#!/usr/bin/env node
/*
 * Récolte des médias de SOREAL IDLE pour l'application Windows (Norman, 2026-10-28) : copie TOUT ce que le jeu lit dans le bucket R2 « soreal », dossier idle/ (images des boss, objets, zones, titans, fruits ; voix ; musiques d'ambiance ;
 * histoires ; bannière…), vers desktop/medias, avec les MÊMES clés : l'application les sert exactement comme le serveur.
 *
 *   node desktop/recolter.mjs --liste           inventaire seulement (dossiers, nombre de fichiers, Mo) : ne télécharge rien
 *   node desktop/recolter.mjs                   télécharge ce qui manque ou a changé (reprise possible, rien n'est supprimé)
 *   node desktop/recolter.mjs --catalogue f.json  range le catalogue de production (voir plus bas) dans desktop/graine/catalogue.json
 *   options : --prefixe idle/  --port 8792  --simultanes 6
 *
 * Accès : la connexion wrangler de l'administrateur (« npx wrangler login », déjà faite pour le déploiement). Le script lance un petit Worker de LECTURE SEULE (desktop/recolte/worker.js) avec « wrangler dev --remote » sur 127.0.0.1,
 * s'en sert pour lister et lire le bucket, puis l'arrête. Aucun jeton n'est lu, copié ni affiché ; rien n'est écrit dans le bucket.
 * Modèle de la voix de secours (Piper) : récupéré par la route publique du jeu et rangé dans medias/_externes/ (voir le README du dossier desktop).
 *
 * Catalogue de production : le serveur ne l'expose qu'à une session de joueur. Dans le jeu en ligne (après le prochain déploiement et un lancement avec internet), ouvrir la console du navigateur (F12) et lancer le contenu de
 * desktop/exporter-catalogue.js ; il télécharge catalogue.json, à donner à « --catalogue ».
 */
import fs from "node:fs";
import path from "node:path";
import { spawn, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const MEDIAS = path.join(ICI, "medias");
const args = process.argv.slice(2);
const option = (nom, defaut) => { const i = args.indexOf("--" + nom); return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : defaut; };
const seulementListe = args.includes("--liste");
const prefixe = option("prefixe", "idle/");
const port = Number(option("port", "8792"));
const simultanes = Math.max(1, Math.min(16, Number(option("simultanes", "6"))));
const base = "http://127.0.0.1:" + port;
const mo = (o) => (o / 1048576).toFixed(1) + " Mo";

/* ----- catalogue : simple copie contrôlée ----- */
if (args.includes("--catalogue")) {
  const source = option("catalogue", "");
  if (!source || !fs.existsSync(source)) { console.error("Fichier du catalogue introuvable : " + source); process.exit(1); }
  const j = JSON.parse(fs.readFileSync(source, "utf8"));
  const feuilles = Array.isArray(j.feuilles) ? j.feuilles : null;
  if (!feuilles || !feuilles.length || !feuilles.every((f) => Array.isArray(f) && typeof f[0] === "string" && typeof f[2] === "string")) { console.error("Ce fichier n'est pas un catalogue exporté par le jeu (liste « feuilles » attendue)."); process.exit(1); }
  fs.mkdirSync(path.join(ICI, "graine"), { recursive: true });
  fs.writeFileSync(path.join(ICI, "graine", "catalogue.json"), JSON.stringify({ feuilles, exporteLe: j.exporteLe || null }));
  const noms = new Set(feuilles.map((f) => f[0]));
  console.log("Catalogue rangé : " + feuilles.length + " lignes, " + noms.size + " feuilles (" + [...noms].slice(0, 8).join(", ") + (noms.size > 8 ? "…" : "") + ").");
  process.exit(0);
}

/* ----- Worker de lecture seule ----- */
function attendre(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function pret() {
  for (let i = 0; i < 90; i += 1) {
    try { const r = await fetch(base + "/ping"); if (r.ok && (await r.text()) === "ok") return true; } catch (_e) { /* pas encore */ }
    await attendre(2000);
  }
  return false;
}
console.log("Démarrage de l'accès en lecture seule au bucket (wrangler dev --remote)…");
const wrangler = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["wrangler", "dev", "--remote", "--config", path.join(ICI, "recolte", "wrangler.jsonc"), "--ip", "127.0.0.1", "--port", String(port)], { cwd: path.join(ICI, ".."), shell: process.platform === "win32", stdio: ["ignore", "pipe", "pipe"] });
let journal = "";
wrangler.stdout.on("data", (d) => { journal += d; }); wrangler.stderr.on("data", (d) => { journal += d; });
function arreter() {
  try { if (process.platform === "win32") execSync("taskkill /PID " + wrangler.pid + " /T /F", { stdio: "ignore" }); else wrangler.kill("SIGTERM"); } catch (_e) { /* déjà arrêté */ }
}
process.on("exit", arreter); process.on("SIGINT", () => { arreter(); process.exit(130); });

try {
  if (!(await pret())) { console.error("L'accès au bucket n'a pas démarré (connexion wrangler absente ?). Dernières lignes :\n" + journal.split("\n").slice(-12).join("\n")); process.exit(1); }

  /* inventaire complet */
  const objets = [];
  let curseur = null;
  do {
    const r = await (await fetch(base + "/liste?prefix=" + encodeURIComponent(prefixe) + (curseur ? "&curseur=" + encodeURIComponent(curseur) : ""))).json();
    objets.push(...r.objets.filter((o) => !o.cle.endsWith("/") && !o.cle.startsWith("idle/_maj/")));
    curseur = r.curseur;
    process.stdout.write("\rinventaire : " + objets.length + " fichiers");
  } while (curseur);
  console.log("");
  const parDossier = new Map();
  for (const o of objets) { const d = o.cle.split("/").slice(0, 2).join("/") + "/"; const e = parDossier.get(d) || { n: 0, t: 0 }; e.n += 1; e.t += o.taille; parDossier.set(d, e); }
  console.log("\nDossier".padEnd(34) + "fichiers".padStart(10) + "taille".padStart(12));
  for (const [d, e] of [...parDossier].sort()) console.log(d.padEnd(33) + String(e.n).padStart(10) + mo(e.t).padStart(12));
  const total = objets.reduce((s, o) => s + o.taille, 0);
  console.log("TOTAL".padEnd(33) + String(objets.length).padStart(10) + mo(total).padStart(12));
  if (seulementListe) { console.log("\n(--liste : rien n'a été téléchargé)"); process.exit(0); }

  /* téléchargement : ce qui manque ou dont la taille diffère ; reprise possible */
  const aFaire = objets.filter((o) => { try { return fs.statSync(path.join(MEDIAS, ...o.cle.split("/"))).size !== o.taille; } catch (_e) { return true; } });
  console.log("\nA télécharger : " + aFaire.length + " fichiers (" + mo(aFaire.reduce((s, o) => s + o.taille, 0)) + "), déjà présents : " + (objets.length - aFaire.length));
  let fait = 0, erreurs = [], i = 0;
  async function ouvrier() {
    for (;;) {
      const o = aFaire[i++];
      if (!o) return;
      const destination = path.join(MEDIAS, ...o.cle.split("/"));
      for (let essai = 1; essai <= 3; essai += 1) {
        try {
          const r = await fetch(base + "/objet?cle=" + encodeURIComponent(o.cle));
          if (!r.ok) throw new Error("HTTP " + r.status);
          const octets = Buffer.from(await r.arrayBuffer());
          if (octets.length !== o.taille) throw new Error("taille " + octets.length + " au lieu de " + o.taille);
          fs.mkdirSync(path.dirname(destination), { recursive: true });
          fs.writeFileSync(destination + ".partiel", octets);
          fs.renameSync(destination + ".partiel", destination);
          break;
        } catch (e) {
          if (essai === 3) erreurs.push(o.cle + " : " + (e && e.message || e));
          else await attendre(500 * essai);
        }
      }
      fait += 1;
      if (fait % 25 === 0 || fait === aFaire.length) process.stdout.write("\rtéléchargés : " + fait + " / " + aFaire.length);
    }
  }
  await Promise.all(Array.from({ length: simultanes }, ouvrier));
  console.log("");

  /* modèle de la voix de secours (servi par une route publique du jeu, il vient d'un dépôt externe) */
  const externes = path.join(MEDIAS, "_externes");
  fs.mkdirSync(externes, { recursive: true });
  for (const nom of ["piper-model.onnx", "piper-model.onnx.json"]) {
    const f = path.join(externes, nom);
    if (fs.existsSync(f) && fs.statSync(f).size > 0) continue;
    try {
      const r = await fetch("https://soreal-idle.technicien-soreal.workers.dev/api/idle/media/" + nom);
      if (!r.ok) throw new Error("HTTP " + r.status);
      fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
      console.log("voix de secours : " + nom + " (" + mo(fs.statSync(f).size) + ")");
    } catch (e) { erreurs.push("_externes/" + nom + " : " + (e && e.message || e)); }
  }

  /* index des médias embarqués (clé -> [taille, etag]) : sert aux mises à jour à ne télécharger que ce qui a changé */
  if (!erreurs.length || !args.includes("--strict")) {
    const index = {};
    for (const o of objets) if (!erreurs.some((e) => e.startsWith(o.cle + " :"))) index[o.cle] = [o.taille, String(o.etag || "")];
    fs.writeFileSync(path.join(MEDIAS, "_index.json"), JSON.stringify(index));
  }
  fs.writeFileSync(path.join(MEDIAS, "_recolte.json"), JSON.stringify({ le: new Date().toISOString(), prefixe, fichiers: objets.length, octets: total, erreurs: erreurs.length }, null, 2));
  if (erreurs.length) { console.log("\n" + erreurs.length + " erreur(s) :\n" + erreurs.slice(0, 20).join("\n") + "\nRelancer la commande : seuls les fichiers manquants sont repris."); process.exitCode = 2; }
  else console.log("\nRécolte terminée : " + objets.length + " fichiers, " + mo(total) + ", dans " + MEDIAS);
} finally {
  arreter();
}
