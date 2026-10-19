#!/usr/bin/env node
/*
 * Déploiement LOCAL de SOREAL IDLE (secours quand le quota de minutes GitHub Actions est épuisé).
 * Décision du propriétaire (2026-10-19) : on utilise ce chemin pendant les mois où il dit « mon quota GitHub est épuisé » ;
 * au début du mois suivant on reprend les push via GitHub.
 *
 * Il reproduit .github/workflows/cloudflare-deploy.yml :
 *   1. travaille sur une COPIE PROPRE d'un commit (jamais le dossier de travail : il contient des builds de test et des maquettes
 *      qui n'ont rien à faire en production, dont des fichiers de plus de 25 Mio que Cloudflare refuserait) ;
 *   2. toute la suite de tests (cloudflare/tests/*.test.mjs), arrêt au premier échec ;
 *   3. build du frontend autonome + node --check de tous les scripts publics ;
 *   4. dépendances du runtime vocal ;
 *   5. wrangler deploy avec --message "git:<sha>" ;
 *   6. vérification : le déploiement actif est à 100 % et porte bien ce SHA.
 *
 * Utilisation (depuis la racine du dépôt) :
 *   node cloudflare/tools/deployer-local.mjs              # SIMULE : étapes 1 à 4, ne déploie RIEN
 *   node cloudflare/tools/deployer-local.mjs --deployer   # fait aussi les étapes 5 et 6 (PRODUCTION)
 *   options : --commit <ref> (défaut HEAD) · --sans-tests (dépannage, déconseillé)
 *
 * Prérequis : être connecté à Cloudflare (`npx wrangler login` une seule fois ; `npx wrangler whoami` pour vérifier).
 * Le script ne lit, ne copie et n'affiche jamais le jeton Cloudflare.
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

const args = process.argv.slice(2);
const deployer = args.includes("--deployer");
const sansTests = args.includes("--sans-tests");
const iCommit = args.indexOf("--commit");
const ref = iCommit >= 0 ? args[iCommit + 1] : "HEAD";
const WRANGLER = "wrangler@4.127.1"; // même version que le workflow
const URL_PROD = "https://soreal-idle.technicien-soreal.workers.dev";
const WIN = process.platform === "win32";
const NPX = WIN ? "npx.cmd" : "npx";

const etape = (t) => console.log("\n=== " + t + " ===");
const echec = (m) => { console.error("\nÉCHEC : " + m); process.exit(1); };
const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).trim();
function lancer(cmd, a, opt = {}) {
  const r = spawnSync(cmd, a, { stdio: "inherit", shell: WIN && cmd.endsWith(".cmd"), ...opt });
  if (r.status !== 0) echec(cmd + " " + a.join(" ") + " (code " + r.status + ")");
}

const racine = git("rev-parse", "--show-toplevel");
process.chdir(racine);
const sha = git("rev-parse", ref);
console.log("Commit : " + sha + "  (" + git("log", "-1", "--format=%s", sha) + ")");
if (ref === "HEAD" && git("status", "--porcelain", "--untracked-files=no")) {
  console.log("Avertissement : des modifications non commitées existent ; elles ne seront PAS déployées (copie propre du commit).");
}

// 1. copie propre
etape("1/6 copie propre du commit");
const copie = fs.mkdtempSync(path.join(os.tmpdir(), "soreal-deploy-"));
const tar = path.join(copie, "src.tar");
execFileSync("git", ["archive", "--format=tar", "-o", tar, sha]);
const dossier = path.join(copie, "depot");
fs.mkdirSync(dossier);
execFileSync("tar", ["-xf", tar, "-C", dossier]);
fs.rmSync(tar);
console.log("Copie : " + dossier);

// garde-fous sur le contenu publié
etape("garde-fous : contenu de cloudflare/public");
const LIMITE = 25 * 1024 * 1024;
const trop = [];
(function parcourir(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) parcourir(p);
    else if (fs.statSync(p).size > LIMITE) trop.push(path.relative(dossier, p));
  }
})(path.join(dossier, "cloudflare", "public"));
if (trop.length) echec("fichier(s) de plus de 25 Mio dans cloudflare/public (Cloudflare les refuse) : " + trop.join(", "));
console.log("aucun fichier de plus de 25 Mio.");

// 2. tests
if (sansTests) console.log("\n(tests sautés : --sans-tests)");
else {
  etape("2/6 suite de tests");
  const tests = fs.readdirSync(path.join(dossier, "cloudflare", "tests")).filter((f) => f.endsWith(".test.mjs")).sort();
  let n = 0;
  for (const t of tests) {
    const r = spawnSync("node", [path.join("cloudflare", "tests", t)], { cwd: dossier, stdio: "pipe", encoding: "utf8" });
    if (r.status !== 0) { console.error((r.stdout || "").slice(-1500) + (r.stderr || "").slice(-1500)); echec("test en échec : " + t); }
    n += 1;
  }
  console.log(n + " fichiers de test : zéro échec.");
}

// 3. build + syntaxe
etape("3/6 build du frontend autonome et vérification de syntaxe");
lancer("node", ["cloudflare/build-standalone.mjs"], { cwd: dossier });
const aVerifier = ["cloudflare/public/standalone-bridge.js", "cloudflare/public/soreal-idle-ui.js"];
for (const f of fs.readdirSync(path.join(dossier, "cloudflare", "public", "modules"))) if (f.endsWith(".js")) aVerifier.push("cloudflare/public/modules/" + f);
for (const f of aVerifier) lancer("node", ["--check", f], { cwd: dossier });
console.log(aVerifier.length + " scripts publics : syntaxe valide.");

// 4. runtime vocal
etape("4/6 dépendances du runtime vocal");
lancer("node", ["cloudflare/tools/verify-voice-runtime-dependencies.mjs"], { cwd: dossier });

if (!deployer) {
  console.log("\nSIMULATION TERMINÉE : tout est prêt, rien n'a été déployé.");
  console.log("Pour déployer en PRODUCTION : node cloudflare/tools/deployer-local.mjs --deployer");
  console.log("Copie propre gardée pour inspection : " + dossier);
  process.exit(0);
}

// 5. déploiement
etape("5/6 wrangler deploy (PRODUCTION)");
lancer(NPX, ["--yes", WRANGLER, "deploy", "--config", "wrangler.jsonc", "--message", "git:" + sha], { cwd: dossier });

// 6. vérifications
etape("6/6 vérification du déploiement");
const st = spawnSync(NPX, ["--yes", WRANGLER, "deployments", "status", "--config", "wrangler.jsonc", "--json"], { cwd: dossier, encoding: "utf8", shell: WIN });
if (st.status !== 0) echec("deployments status : " + (st.stderr || "").slice(-500));
const parse = JSON.parse(st.stdout);
const dep = (parse && (parse.deployment || (parse.result && parse.result.deployment) || parse.result)) || parse;
const versions = Array.isArray(dep && dep.versions) ? dep.versions : [];
const actif = versions.slice().sort((a, b) => Number((b && b.percentage) || 0) - Number((a && a.percentage) || 0))[0] || null;
const pct = Number((actif && actif.percentage) || 0);
const msg = String((dep && dep.annotations && dep.annotations["workers/message"]) || (dep && dep.message) || "");
if (!actif || pct !== 100) echec("routage de production non vérifiable (version active : " + JSON.stringify(actif) + ")");
if (msg !== "git:" + sha) echec("SHA en production différent : attendu git:" + sha + ", observé " + (msg || "absent"));
console.log("Production à 100 % sur " + sha + " (version " + (actif.version_id || actif.id) + ").");


