#!/usr/bin/env node
/*
 * Norman (2026-10-31) : « à chaque push, les changements du patch note apparaissent EN VERT ; au push suivant, seules les dernières lignes le sont ».
 *   node cloudflare/tools/marquer-nouveautes-push.mjs        (AVANT le commit du push)
 * Compare les lignes de points de release-notes-v1.js (arbre de travail) à celles du même fichier dans `origin/main` (= dernier push) et réécrit
 * modules/release-notes-nouveautes-v1.js avec UNIQUEMENT les lignes absentes de origin/main (liste remplacée, pas cumulée). Idempotent.
 * Repli : si git échoue ou si le fichier n'existe pas dans origin/main, la liste est laissée VIDE (rien en vert) et l'outil le dit.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const racineParDefaut = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const REL_NOTES = "cloudflare/public/modules/release-notes-v1.js";
const REL_DONNEES = "cloudflare/public/modules/release-notes-nouveautes-v1.js";

export function lignesDeNotes(source) {
  const window = {};
  vm.runInNewContext(source, { window });
  const n = window.__SOREAL_IDLE_RELEASE_NOTES_V1__;
  const out = [];
  for (const v of (n && n.versions) || []) {
    for (const g of v.groupes || []) for (const p of g.points || []) out.push(String(p));
    for (const p of v.points || []) out.push(String(p));
  }
  return out;
}

export function contenuDonnees(lignes) {
  return "/*\n * Lignes de la note de mise à jour ajoutées (ou modifiées) depuis le DERNIER PUSH (Norman, 2026-10-31) : elles s'affichent en vert dans les Réglages, et elles seules.\n" +
    " * FICHIER GÉNÉRÉ par `node cloudflare/tools/marquer-nouveautes-push.mjs` (à lancer avant le commit d'un push ; la liste est remplacée, jamais cumulée). Ne pas l'éditer à la main.\n */\n" +
    "(function(){\n  window.__SOREAL_IDLE_NOTES_NOUVEAUTES_V1__ = { lignes: " + (lignes.length ? "[\n" + lignes.map((l) => "    " + JSON.stringify(l)).join(",\n") + "\n  ]" : "[]") + " };\n})();\n";
}

export function marquer(racine = racineParDefaut, reference = "origin/main") {
  const actuel = fs.readFileSync(path.join(racine, REL_NOTES), "utf8");
  let ancien = null, raison = "";
  try {
    ancien = execFileSync("git", ["show", reference + ":" + REL_NOTES], { cwd: racine, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
  } catch (e) { raison = "git show " + reference + " a échoué (" + String(e.message || e).split("\n")[0] + ")"; }
  let lignes = [];
  if (ancien !== null) {
    const connues = new Set(lignesDeNotes(ancien));
    const vues = new Set();
    for (const l of lignesDeNotes(actuel)) if (!connues.has(l) && !vues.has(l)) { vues.add(l); lignes.push(l); }
  }
  fs.writeFileSync(path.join(racine, REL_DONNEES), contenuDonnees(lignes), "utf8");
  return { lignes, raison };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { lignes, raison } = marquer();
  if (raison) console.log("Repli : " + raison + " -> liste vide, rien en vert.");
  console.log(lignes.length + " ligne(s) de la note marquée(s) en vert (ajoutées depuis origin/main).");
}
