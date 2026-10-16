/*
 * Numéros de version (?v=N) des fichiers du frontend (audit d'architecture, 2026-10-16).
 *
 * Les scripts, feuilles de style et le dictionnaire sont servis avec « Cache-Control: immutable » (cloudflare/public/_headers) : le navigateur ne redemande jamais un fichier
 * dont l'adresse (avec son ?v=N) n'a pas changé. Il faut donc qu'un fichier modifié change TOUJOURS de numéro. Ce script s'en charge :
 *   node cloudflare/tools/maj-pins.mjs            -> monte le numéro de chaque fichier modifié depuis la dernière exécution (index.html ou le fichier qui charge le dictionnaire)
 *   node cloudflare/tools/maj-pins.mjs --verifier -> ne modifie rien ; sort en erreur si un fichier a changé sans que son numéro ait bougé (utilisé par le test idle-pins-assets-v1)
 * La liste de référence (empreinte + numéro de chaque fichier) est cloudflare/tools/pins-assets.json.
 */
import { readFileSync, writeFileSync as ecrireFichier, existsSync } from "node:fs";

/* Windows verrouille parfois un fichier une fraction de seconde (serveur local, antivirus) : l'écriture est reprise quelques fois avant d'échouer. */
function writeFileSync(chemin, contenu) {
  for (let essai = 0; ; essai += 1) {
    try { return ecrireFichier(chemin, contenu); } catch (e) { if (essai >= 6) throw e; Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300); }
  }
}
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(racine, "public");
const MANIFESTE = join(racine, "tools", "pins-assets.json");
const verifier = process.argv.includes("--verifier");

const empreinte = (chemin) => createHash("sha1").update(readFileSync(chemin)).digest("hex");
const lire = (f) => readFileSync(f, "utf8");

/* Références : { chemin du fichier servi, fichier qui le référence, motif qui capture (avant ?v=)(numéro) } */
function references() {
  const index = lire(join(PUBLIC, "index.html"));
  const refs = [];
  for (const m of index.matchAll(/(?:src|href)="(\/[^"?]+\.(?:js|css|json))\?v=(\d+)"/g)) {
    refs.push({ servi: m[1], dans: "index.html", motif: new RegExp("(" + m[1].replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&") + "\\?v=)(\\d+)"), pin: Number(m[2]) });
  }
  const trad = lire(join(PUBLIC, "modules", "traduction-anglais-v1.js"));
  const d = trad.match(/(\/modules\/traduction-anglais-dict-v1\.json\?v=)(\d+)/);
  if (d) refs.push({ servi: "/modules/traduction-anglais-dict-v1.json", dans: "modules/traduction-anglais-v1.js", motif: /(\/modules\/traduction-anglais-dict-v1\.json\?v=)(\d+)/, pin: Number(d[2]) });
  return refs;
}

const manifeste = existsSync(MANIFESTE) ? JSON.parse(lire(MANIFESTE)) : {};
const refs = references();
const anomalies = []; const bumps = []; const nouveaux = [];
const sources = new Map(); // fichier source -> texte courant
const texteDe = (f) => { if (!sources.has(f)) sources.set(f, lire(join(PUBLIC, f))); return sources.get(f); };
for (const r of refs) {
  const chemin = join(PUBLIC, r.servi.slice(1));
  if (!existsSync(chemin)) { anomalies.push(`${r.servi} : fichier référencé introuvable`); continue; }
  const sha = empreinte(chemin);
  const e = manifeste[r.servi];
  if (!e) { manifeste[r.servi] = { pin: r.pin, sha }; nouveaux.push(r.servi); continue; }
  if (e.sha === sha) {
    if (e.pin !== r.pin) { /* numéro changé à la main sans changement de contenu : on le retient */ manifeste[r.servi] = { pin: r.pin, sha }; }
    continue;
  }
  /* Contenu modifié : le numéro doit avoir augmenté */
  if (r.pin > e.pin) { manifeste[r.servi] = { pin: r.pin, sha }; continue; }
  if (verifier) { anomalies.push(`${r.servi} : contenu modifié mais ?v=${r.pin} inchangé (lancer node cloudflare/tools/maj-pins.mjs)`); continue; }
  const neuf = e.pin + 1;
  const texte = texteDe(r.dans).replace(r.motif, (_, a) => a + neuf);
  sources.set(r.dans, texte);
  manifeste[r.servi] = { pin: neuf, sha };
  bumps.push(`${r.servi} : ?v=${e.pin} -> ?v=${neuf}`);
}
if (verifier) {
  /* Fichiers du manifeste qui ne sont plus référencés : signalés (la liste de référence doit rester propre) */
  const servis = new Set(refs.map((r) => r.servi));
  for (const k of Object.keys(manifeste)) if (!servis.has(k)) anomalies.push(`${k} : dans pins-assets.json mais plus référencé (lancer le script sans --verifier pour nettoyer)`);
  if (nouveaux.length) anomalies.push(`non listés dans pins-assets.json : ${nouveaux.join(", ")} (lancer node cloudflare/tools/maj-pins.mjs)`);
  if (anomalies.length) { console.error(anomalies.join("\n")); process.exit(1); }
  console.log(`pins : ${refs.length} fichiers à jour`);
} else {
  const servis = new Set(refs.map((r) => r.servi));
  for (const k of Object.keys(manifeste)) if (!servis.has(k)) delete manifeste[k];
  for (const [f, t] of sources) if (bumps.length) writeFileSync(join(PUBLIC, f), t);
  const ordonne = Object.fromEntries(Object.keys(manifeste).sort().map((k) => [k, manifeste[k]]));
  writeFileSync(MANIFESTE, JSON.stringify(ordonne, null, 1) + "\n");
  console.log(`pins : ${refs.length} fichiers suivis, ${nouveaux.length} ajoutés, ${bumps.length} numéros montés`);
  bumps.forEach((b) => console.log("  " + b));
  if (anomalies.length) { console.error(anomalies.join("\n")); process.exit(1); }
}
