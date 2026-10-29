#!/usr/bin/env node
/*
 * Publication d'une mise à jour de l'application Windows (Norman, 2026-10-28). À lancer sur le PC de Norman, après avoir changé des images / sons dans R2 et / ou du code (et fait « git commit »).
 *
 *   node desktop/publier-maj.mjs --creer-cle                      UNE SEULE FOIS : crée la paire de clés de signature (privée : %USERPROFILE%\.soreal-idle\maj-cle-privee.pem, hors dépôt ; publique : desktop/maj-cle-publique.pem,
 *                                                                 embarquée dans l'installateur). Sauvegarde la clé privée : sans elle, les applications déjà installées ne pourraient plus recevoir de mise à jour.
 *   node desktop/publier-maj.mjs --notes "Nouvelles images du Titan"      SIMULE : montre ce qui serait publié (code changé ?, médias nouveaux ou modifiés, taille) sans rien écrire
 *   node desktop/publier-maj.mjs --notes "…" --publier            PUBLIE : dépose le paquet de code et le manifeste signé dans R2 (idle/_maj/) ; les applications ouvertes l'affichent dans les 30 minutes
 *   option : --port 8793
 *   option : --apk   publie la mise à jour de l'APK Android hors ligne (idle/_maj-apk/ : même clé de signature, même liste de médias, paquet de code propre à l'APK construit par android/code-apk.mjs)
 *
 * Les médias ne sont PAS recopiés : le manifeste liste chaque fichier de idle/ (clé, taille, etag) ; l'application télécharge seulement ceux qu'elle n'a pas ou qui ont changé. Le code (cloudflare/src, public, contracts, design) voyage dans UN zip.
 * Accès : la connexion wrangler de l'administrateur (lecture par « wrangler dev --remote », écriture par « wrangler r2 object put --remote »). Aucun jeton n'est lu ni affiché. Le manifeste est signé : l'application refuse tout autre.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn, spawnSync, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { construirePaquetCode, FICHIERS_COEUR } from "./src/paquet.mjs";
import { signerManifeste, calculerDelta } from "./src/maj.mjs";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DEPOT = path.resolve(ICI, "..");
{
  const manquants = FICHIERS_COEUR.filter((f) => !fs.existsSync(path.join(DEPOT, ...f.split("/"))));
  if (manquants.length) { console.error("Publication refusée : fichiers du cœur absents du dépôt : " + manquants.join(", ")); process.exit(1); }   /* un paquet signé mais incomplet ferait quitter l'application (audit 2026-10-29) */
}
const args = process.argv.slice(2);
const option = (nom, defaut) => { const i = args.indexOf("--" + nom); return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : defaut; };
const CLE_PRIVEE = path.join(os.homedir(), ".soreal-idle", "maj-cle-privee.pem");
const CLE_PUBLIQUE = path.join(ICI, "maj-cle-publique.pem");
const mo = (o) => (o / 1048576).toFixed(1) + " Mo";

if (args.includes("--creer-cle")) {
  if (fs.existsSync(CLE_PRIVEE)) { console.error("Une clé privée existe déjà (" + CLE_PRIVEE + ") : rien n'est écrasé."); process.exit(1); }
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  fs.mkdirSync(path.dirname(CLE_PRIVEE), { recursive: true });
  fs.writeFileSync(CLE_PRIVEE, privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600 });
  fs.writeFileSync(CLE_PUBLIQUE, publicKey.export({ type: "spki", format: "pem" }));
  console.log("Clés créées.\n  privée  : " + CLE_PRIVEE + "   (à SAUVEGARDER ; ne jamais la mettre dans le dépôt ni l'envoyer)\n  publique: " + CLE_PUBLIQUE + "   (embarquée dans l'installateur : refaire « node desktop/construire.mjs »)");
  process.exit(0);
}

const publier = args.includes("--publier");
const APK = args.includes("--apk");
const DOSSIER_MAJ = APK ? "idle/_maj-apk/" : "idle/_maj/";
const notes = option("notes", "");
if (!fs.existsSync(CLE_PRIVEE)) { console.error("Pas de clé de signature : lancer d'abord « node desktop/publier-maj.mjs --creer-cle »."); process.exit(1); }
if (!notes && publier) { console.error("Écrire de quoi il s'agit : --notes \"Nouvelles images du Titan\" (affiché dans le bandeau du joueur)."); process.exit(1); }
const clePrivee = fs.readFileSync(CLE_PRIVEE, "utf8");
const port = Number(option("port", "8793"));
const base = "http://127.0.0.1:" + port;
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

console.log("Démarrage de l'accès au bucket (wrangler dev --remote)…");
const wrangler = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["wrangler", "dev", "--remote", "--config", path.join(ICI, "recolte", "wrangler.jsonc"), "--ip", "127.0.0.1", "--port", String(port)], { cwd: DEPOT, shell: process.platform === "win32", stdio: ["ignore", "pipe", "pipe"] });
let journal = "";
wrangler.stdout.on("data", (d) => { journal += d; }); wrangler.stderr.on("data", (d) => { journal += d; });
const arreter = () => { try { if (process.platform === "win32") execSync("taskkill /PID " + wrangler.pid + " /T /F", { stdio: "ignore" }); else wrangler.kill("SIGTERM"); } catch (_e) { /* déjà arrêté */ } };
process.on("exit", arreter);

try {
  let pret = false;
  for (let i = 0; i < 90 && !pret; i += 1) { try { const r = await fetch(base + "/ping"); pret = r.ok && (await r.text()) === "ok"; } catch (_e) { /* pas encore */ } if (!pret) await attendre(2000); }
  if (!pret) { console.error("L'accès au bucket n'a pas démarré (connexion wrangler ?). Dernières lignes :\n" + journal.split("\n").slice(-10).join("\n")); process.exit(1); }

  /* 1. médias : tout idle/ sauf idle/_maj/ */
  const medias = [];
  let curseur = null;
  do {
    const r = await (await fetch(base + "/liste?prefix=idle%2F" + (curseur ? "&curseur=" + encodeURIComponent(curseur) : ""))).json();
    for (const o of r.objets) if (!o.cle.endsWith("/") && !o.cle.startsWith("idle/_maj")) medias.push([o.cle, o.taille, String(o.etag || "")]);
    curseur = r.curseur;
    process.stdout.write("\rinventaire : " + medias.length + " médias");
  } while (curseur);
  console.log("");
  medias.sort((a, b) => (a[0] < b[0] ? -1 : 1));

  /* 2. code : paquet déterministe */
  const tmpApk = path.join(os.tmpdir(), "soreal-code-apk");
  const paquet = APK ? await (await import("../android/code-apk.mjs")).construirePaquetApk(tmpApk) : construirePaquetCode(DEPOT);
  const cleCode = DOSSIER_MAJ + (APK ? "code-" : "jeu-") + paquet.sha256.slice(0, 16) + ".zip";
  console.log("code : " + paquet.nb + " fichiers, paquet " + mo(paquet.zip.length) + " (" + paquet.sha256.slice(0, 12) + "…)");

  /* 3. ce qui est publié aujourd'hui */
  let actuel = null;
  try { const r = await fetch(base + "/objet?cle=" + encodeURIComponent(DOSSIER_MAJ + "manifeste.json")); if (r.ok) actuel = await r.json(); } catch (_e) { /* aucun */ }
  const etatActuel = { codeSha: actuel && actuel.code ? actuel.code.sha256 : null, index: Object.fromEntries(((actuel && actuel.medias) || []).map((m) => [m[0], [m[1], m[2]]])) };
  const manifeste = { v: 1, version: new Date().toISOString().replace(/\.\d+Z$/, "Z"), date: new Date().toISOString(), notes, code: { cle: cleCode, taille: paquet.zip.length, sha256: paquet.sha256 }, medias };
  const delta = calculerDelta(manifeste, etatActuel);
  console.log("\nPar rapport à la dernière publication" + (actuel ? " (" + actuel.version + ")" : " (aucune)") + " :");
  console.log("  code      : " + (delta.codeChange ? "CHANGÉ" : "inchangé"));
  console.log("  médias    : " + delta.medias.length + " nouveau(x) ou modifié(s), " + mo(delta.medias.reduce((s, m) => s + m[1], 0)));
  for (const m of delta.medias.slice(0, 12)) console.log("      " + m[0] + " (" + mo(m[1]) + ")");
  if (delta.medias.length > 12) console.log("      … et " + (delta.medias.length - 12) + " autres");
  if (!publier) { console.log("\n(simulation : rien n'a été écrit ; ajouter --publier pour publier)"); process.exit(0); }
  if (!delta.codeChange && !delta.medias.length) { console.log("\nRien de nouveau depuis la dernière publication : rien à publier."); process.exit(0); }

  /* 4. publication : le paquet de code (s'il a changé), puis le manifeste signé EN DERNIER (les applications ne voient la mise à jour qu'une fois tout en place) */
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "soreal-maj-"));
  const deposer = (cle, fichier, type) => {
    const r = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["wrangler", "r2", "object", "put", "soreal/" + cle, "--file", fichier, "--content-type", type, "--remote"], { cwd: DEPOT, shell: process.platform === "win32", encoding: "utf8" });
    if (r.status !== 0) throw new Error("Dépôt de " + cle + " refusé :\n" + String(r.stderr || r.stdout).split("\n").slice(-6).join("\n"));
  };
  if (delta.codeChange) {
    const f = path.join(tmp, "jeu.zip"); fs.writeFileSync(f, paquet.zip);
    console.log("dépôt du paquet de code…"); deposer(cleCode, f, "application/zip");
  }
  manifeste.signature = signerManifeste(manifeste, clePrivee);
  const fm = path.join(tmp, "manifeste.json"); fs.writeFileSync(fm, JSON.stringify(manifeste));
  console.log("dépôt du manifeste signé…"); deposer(DOSSIER_MAJ + "manifeste.json", fm, "application/json");
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("\nMise à jour publiée : " + manifeste.version + (notes ? " — « " + notes + " »" : "") + "\nLes applications ouvertes et connectées la proposent dans les 30 minutes (au plus), à l'ouverture suivante sinon.");
} finally {
  arreter();
}
