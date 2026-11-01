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
 * RÈGLE STRICTE (Norman, 2026-11-01 : « tout ce que je considère comme validé dans les voix doit être la SEULE version qui existe » ; règle de desktop/src/voix-utiles.mjs et de la route POST /api/v1/voice-purge?strict=1). Une voix
 * (fichier idle/voix/<empreinte de 14 hexa>.m4a ; empreinte = celle du texte lu, hashBloc_ de modules/tutorial-tts-v202.js) est UTILE si et seulement si :
 *   (a) son empreinte est dans la liste « voix » d'un texte enregistré ou d'une histoire (desktop/graine/catalogue.json) ;
 *   (b) c'est une voix statique du manifeste public/voice/manifest.json NON liée à un texte enregistré (voix anglaises des chroniques comprises : elles sont au manifeste et ne sont jamais liées) ;
 * Tout le reste est OBSOLETE : orphelines ET anciennes variantes d'un texte enregistré (texte d'origine, affiché ou ancien texte dit, même si le manifeste les cite encore). « Référencée » = (a) ; « douteuse » = (b), jamais supprimée.
 * Garde-fous : refuse de classer si le catalogue est absent ou incomplet ; refuse d'agir si plus de 40 % des voix seraient obsolètes (sauf --force) ; --r2 ne supprime que des obsolètes.
 * Les dossiers autres que idle/voix/ ne sont jamais touchés. Le fichier _index.json sert de copie de l'inventaire R2 (récolte du jour indiqué dans _recolte.json) : l'inventaire R2 n'est pas relu en direct.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { chargerPlanVoix } from "./src/voix-utiles.mjs";

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

/* ----- classement STRICT (règle de desktop/src/voix-utiles.mjs, la même que la route POST /api/v1/voice-purge?strict=1) ----- */
const plan = chargerPlanVoix(RACINE);
if (!plan.ok) { console.error("Impossible de classer les voix (" + plan.raison + ") : rien n'est supprimé."); process.exit(1); }
const { declarees, manifeste, liees } = plan;
const catalogue = plan.catalogue;
function classer(hash) {
  if (!FORME.test(hash)) return "douteuse";
  if (declarees.has(hash)) return "referencee";
  if (manifeste.has(hash) && !liees.has(hash)) return "douteuse";
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

console.log("Sources : " + declarees.size + " empreintes déclarées (catalogue du " + (catalogue.exporteLe || "?") + "), " + liees.size + " liées à un texte enregistré, " + manifeste.size + " au manifeste. RÈGLE STRICTE : seules les voix déclarées et les voix statiques non liées sont utiles.");
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
