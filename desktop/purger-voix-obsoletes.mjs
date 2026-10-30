#!/usr/bin/env node
/*
 * Purge des voix OBSOLETES de SOREAL IDLE (Norman, 2026-10-30 : « je veux que les anciennes voix soient supprimées définitivement, elles me font perdre de la place »).
 *
 *   node desktop/purger-voix-obsoletes.mjs                  SIMULATION (défaut) : classe, compte, mesure en Mo ; ne supprime et n'écrit RIEN
 *   node desktop/purger-voix-obsoletes.mjs --appliquer      supprime les voix obsolètes de desktop/medias seulement (copie locale, reconstructible) et retire leurs lignes de _index.json
 *   node desktop/purger-voix-obsoletes.mjs --liste f.txt    écrit en plus la liste des clés R2 obsolètes (une par ligne) dans f.txt
 *   node desktop/purger-voix-obsoletes.mjs --r2             supprime AUSSI les voix obsolètes du bucket R2 de production (wrangler r2 object delete --remote). IRREVERSIBLE.
 *                                                           Sans cette option le script imprime seulement la commande et la liste, il ne touche JAMAIS à R2.
 *
 * Une voix (fichier idle/voix/<empreinte de 14 hexa>.m4a ; l'empreinte est celle du texte lu, voir hashBloc_ dans modules/tutorial-tts-v202.js) est :
 *   - REFERENCEE-PROUVEE si son empreinte est (a) listée dans « voix » d'un texte modifié (desktop/graine/catalogue.json, récolte de production), ou d'une histoire, ou
 *     (b) recalculée à partir du texte actuel d'une chronique de boss (design/ngu-boss-*-fr.json et textes du catalogue) ou d'un texte du catalogue, avec le vrai module de narration ;
 *   - DOUTEUSE si elle n'est prouvée que par le manifeste public/voice/manifest.json (textes statiques du jeu : popups, tutoriel, systèmes ; non recalculables hors navigateur), ou si son nom
 *     n'a pas la forme d'une empreinte (fichier inattendu) : JAMAIS supprimée ;
 *   - OBSOLETE si aucune des sources ci-dessus ne la mentionne : même définition que la route serveur /api/v1/voice-purge (histoires + textes + manifeste), en plus large.
 * Garde-fous : refuse de classer si le catalogue est absent ou incomplet ; refuse d'agir si plus de 40 % des voix seraient obsolètes (sauf --force) ; --r2 ne supprime que des obsolètes.
 * Les dossiers autres que idle/voix/ ne sont jamais touchés. Le fichier _index.json sert de copie de l'inventaire R2 (récolte du jour indiqué dans _recolte.json) : l'inventaire R2 n'est pas relu en direct.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, "..");
const MEDIAS = path.join(ICI, "medias");
const DOSSIER_VOIX = path.join(MEDIAS, "idle", "voix");
const PREFIXE = "idle/voix/";
const BUCKET = "soreal";
const args = process.argv.slice(2);
const APPLIQUER = args.includes("--appliquer");
const R2 = args.includes("--r2");
const FORCE = args.includes("--force");
const optionValeur = (nom) => { const i = args.indexOf("--" + nom); return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : ""; };
const FICHIER_LISTE = optionValeur("liste");
const mo = (o) => (o / 1048576).toFixed(1) + " Mo";
const FORME = /^[0-9a-f]{14}$/;

function lireJson(chemin) { return JSON.parse(fs.readFileSync(chemin, "utf8")); }

/* ----- le vrai module de narration (empreintes identiques à celles du jeu) ----- */
function chargerNarration() {
  const source = fs.readFileSync(path.join(RACINE, "cloudflare", "public", "modules", "tutorial-tts-v202.js"), "utf8");
  const rien = () => {};
  const win = { location: { href: "http://localhost/" }, localStorage: { getItem() { return null; }, setItem() {} }, navigator: { userAgent: "node" } };
  const doc = new Proxy({}, { get: (_t, k) => (k === "readyState" ? "loading" : rien) });
  win.document = doc;
  vm.runInContext(source, vm.createContext({ window: win, document: doc, navigator: win.navigator, localStorage: win.localStorage, location: win.location, console, setTimeout: rien, setInterval: rien, addEventListener: rien, fetch: () => Promise.reject(new Error("hors ligne")) }));
  const api = win.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
  if (!api || typeof api.hashBloc !== "function" || typeof api.planNarration !== "function") throw new Error("module de narration illisible");
  return api;
}

function empreintesRecalculees(api, catalogue) {
  const out = new Set();
  const ajouter = (texte) => { for (const e of api.planNarration(texte)) if (e.chunk != null) out.add(api.hashBloc(e.chunk)); };
  const pause = (ms) => " " + String.fromCharCode(0xe000) + ms + String.fromCharCode(0xe001) + " ";
  ajouter("Chroniques de boss." + pause(1500));
  const noms = new Map(lireJson(path.join(RACINE, "design", "ngu-boss-names-fr.json")).map((b) => [Number(b.id), String(b.nomFr || "")]));
  for (const b of lireJson(path.join(RACINE, "design", "ngu-boss-stories-fr.json"))) {
    const histoire = String(b.story || "").trim();
    if (!histoire) continue;
    const nom = noms.get(Number(b.id)) || "Boss";
    ajouter(api.composerChronique(nom, histoire)); ajouter(api.composerChronique(nom, histoire, true));
  }
  for (const [cle, json] of catalogue.textes) {
    const o = JSON.parse(json);
    const p = o.parle || o.champs || {};
    if (String(cle).startsWith("boss:")) {
      for (const t of [p.texte, (o.champs || {}).texte]) { if (!t) continue; for (const nom of [p.nom || "", (o.champs || {}).nom || ""]) { ajouter(api.composerChronique(nom, t)); ajouter(api.composerChronique(nom, t, true)); } }
    } else {
      for (const t of [p.texte, (o.champs || {}).texte]) if (t) ajouter(t);
    }
  }
  return out;
}

/* ----- classement ----- */
const cataloguePath = path.join(ICI, "graine", "catalogue.json");
if (!fs.existsSync(cataloguePath)) { console.error("desktop/graine/catalogue.json absent : impossible de classer les voix (rien n'est supprimé)."); process.exit(1); }
const catalogue = lireJson(cataloguePath);
if (!Array.isArray(catalogue.textes) || catalogue.textes.length < 50 || !Array.isArray(catalogue.histoires)) { console.error("Catalogue incomplet (textes/histoires manquants) : refus de classer."); process.exit(1); }

const declarees = new Set(); // voix déclarées par un texte modifié ou une histoire (prouvées)
for (const [, json] of catalogue.textes) for (const h of (JSON.parse(json).voix || [])) declarees.add(String(h));
for (const h of catalogue.histoires) for (const x of (h.voix || [])) declarees.add(String(x));
let recalculees = new Set();
try { recalculees = empreintesRecalculees(chargerNarration(), catalogue); } catch (e) { console.error("Avertissement : empreintes non recalculées (" + (e && e.message || e) + ") ; seules les sources déclarées protègent les voix."); }
const manifeste = new Set(lireJson(path.join(RACINE, "cloudflare", "public", "voice", "manifest.json")).files.map(String));

function classer(hash) {
  if (!FORME.test(hash)) return "douteuse";
  if (declarees.has(hash) || recalculees.has(hash)) return "referencee";
  if (manifeste.has(hash)) return "douteuse";
  return "obsolete";
}

/* ----- local (desktop/medias/idle/voix) ----- */
const resume = (nom) => ({ nom, referencee: [0, 0], douteuse: [0, 0], obsolete: [0, 0] });
const local = resume("desktop/medias");
const obsoletesLocales = [];
if (fs.existsSync(DOSSIER_VOIX)) {
  for (const f of fs.readdirSync(DOSSIER_VOIX)) {
    const taille = fs.statSync(path.join(DOSSIER_VOIX, f)).size;
    const hash = f.endsWith(".m4a") ? f.slice(0, -4) : f;
    const classe = f.endsWith(".m4a") ? classer(hash) : "douteuse";
    local[classe][0] += 1; local[classe][1] += taille;
    if (classe === "obsolete") obsoletesLocales.push({ f, taille });
  }
}

/* ----- R2 : d'après _index.json (copie de l'inventaire fait par recolter.mjs) ----- */
const cheminIndex = path.join(MEDIAS, "_index.json");
const index = fs.existsSync(cheminIndex) ? lireJson(cheminIndex) : {};
const r2 = resume("R2 (inventaire _index.json)");
const obsoletesR2 = [];
for (const [cle, valeur] of Object.entries(index)) {
  if (!cle.startsWith(PREFIXE)) continue;
  const f = cle.slice(PREFIXE.length);
  const hash = f.endsWith(".m4a") ? f.slice(0, -4) : f;
  const classe = f.endsWith(".m4a") && !f.includes("/") ? classer(hash) : "douteuse";
  r2[classe][0] += 1; r2[classe][1] += Number(valeur[0]) || 0;
  if (classe === "obsolete") obsoletesR2.push({ cle, taille: Number(valeur[0]) || 0 });
}
let inventaireDu = "";
try { inventaireDu = lireJson(path.join(MEDIAS, "_recolte.json")).le || ""; } catch (_e) { /* pas de date */ }

console.log("Sources : " + declarees.size + " empreintes déclarées (catalogue du " + (catalogue.exporteLe || "?") + "), " + recalculees.size + " recalculées, " + manifeste.size + " au manifeste.");
for (const r of [local, r2]) {
  const total = r.referencee[0] + r.douteuse[0] + r.obsolete[0];
  console.log(r.nom + " : " + total + " voix. référencées " + r.referencee[0] + " (" + mo(r.referencee[1]) + "), douteuses " + r.douteuse[0] + " (" + mo(r.douteuse[1]) + "), OBSOLETES " + r.obsolete[0] + " (" + mo(r.obsolete[1]) + ")");
}
if (inventaireDu) console.log("(inventaire R2 de la récolte du " + inventaireDu + " ; non relu en direct)");

const totalLocal = local.referencee[0] + local.douteuse[0] + local.obsolete[0];
if ((obsoletesLocales.length || obsoletesR2.length) && totalLocal && Math.max(local.obsolete[0], r2.obsolete[0]) > 0.4 * Math.max(totalLocal, 1) && !FORCE) {
  console.error("Plus de 40 % des voix seraient obsolètes : anormal (catalogue périmé ?). Rien n'est fait ; --force pour passer outre.");
  process.exit(2);
}

const commandeExemple = "npx wrangler r2 object delete " + BUCKET + "/" + PREFIXE + "<empreinte>.m4a --remote";
if (FICHIER_LISTE) { fs.writeFileSync(path.resolve(FICHIER_LISTE), obsoletesR2.map((o) => o.cle).join("\n") + "\n"); console.log("Liste R2 écrite : " + path.resolve(FICHIER_LISTE)); }
if (!APPLIQUER && !R2) {
  console.log("\nSIMULATION : rien n'a été supprimé ni écrit.");
  for (const o of obsoletesR2.slice(0, 25)) console.log("  R2 obsolète : " + o.cle + " (" + (o.taille / 1024).toFixed(0) + " Ko)");
  if (obsoletesR2.length > 25) console.log("  … " + (obsoletesR2.length - 25) + " autres (voir --liste)");
  console.log("Pour R2 (production, irréversible) : node desktop/purger-voix-obsoletes.mjs --r2   (équivaut à : " + commandeExemple + " pour chaque obsolète). Ce script ne le fait JAMAIS sans --r2.");
  console.log("Pour la copie locale : node desktop/purger-voix-obsoletes.mjs --appliquer");
  process.exit(0);
}

if (APPLIQUER) {
  let libere = 0;
  for (const o of obsoletesLocales) { fs.unlinkSync(path.join(DOSSIER_VOIX, o.f)); libere += o.taille; delete index[PREFIXE + o.f]; }
  /* l'inventaire (empreintes servant aux mises à jour de l'exe/APK) ne garde que ce qui existe encore localement */
  for (const o of obsoletesR2) delete index[o.cle];
  fs.writeFileSync(cheminIndex, JSON.stringify(index));
  console.log("\nLocal : " + obsoletesLocales.length + " voix obsolètes supprimées de desktop/medias (" + mo(libere) + " libérés) ; _index.json mis à jour (les empreintes de l'APK, _etags.json, en sont déduites à la prochaine construction).");
}

if (R2) {
  console.log("\nR2 : suppression de " + obsoletesR2.length + " voix obsolètes dans le bucket « " + BUCKET + " » (production)…");
  let ok = 0; const echecs = [];
  for (const o of obsoletesR2) {
    const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
    const r = spawnSync(cmd, ["--yes", "wrangler", "r2", "object", "delete", BUCKET + "/" + o.cle, "--remote"], { shell: process.platform === "win32", stdio: "pipe", encoding: "utf8" });
    if (r.status === 0) ok += 1; else echecs.push(o.cle);
  }
  console.log("R2 : " + ok + " supprimées, " + echecs.length + " échecs" + (echecs.length ? " : " + echecs.slice(0, 10).join(", ") : "") + ".");
}
