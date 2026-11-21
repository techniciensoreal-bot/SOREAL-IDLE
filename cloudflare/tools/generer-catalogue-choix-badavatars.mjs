/*
 * Catalogue des éléments CHOISISSABLES des badavatars (Norman, 2026-11-21 : « au moment de modifier notre badavatar, on peut choisir parmi tous les éléments : accessoires, vêtements… comme sur Soreal TV »).
 * Fichier généré : modules/itopod-badavatars-choix-catalogue-v1.js. Il est SÉPARÉ du catalogue du tirage (generer-catalogue-badavatars.mjs, itopod-badavatars-catalogue-v1.js) : le tirage au hasard d'un badavatar
 * désigné utilise l'INDICE dans les listes de l'autre fichier, qui ne doit donc jamais être regénéré (les visages des joueurs changeraient). Celui-ci ne sert qu'à CHOISIR : tout ce que TV propose (shared/badavatars/ du R2).
 * Chaîne (même mesure que le catalogue du tirage) :
 *   1. node cloudflare/tools/badavatars/telecharger-r2.mjs <dossier>
 *   2. node cloudflare/tools/badavatars/serveur.mjs <dossier> 8791  puis ouvrir http://127.0.0.1:8791/mesurer.html  (écrit res.json et tete.json)
 *   3. node cloudflare/tools/generer-catalogue-choix-badavatars.mjs <dossier>
 * Aucune valeur n'est inventée : boîtes MESURÉES sur les pixels non transparents ; un corps dont la tête n'a pas pu être mesurée de façon fiable n'est pas proposé (même règle que le tirage).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dossier = path.resolve(process.argv[2] || ".");
const sortie = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "modules", "itopod-badavatars-choix-catalogue-v1.js");
const res = JSON.parse(fs.readFileSync(path.join(dossier, "res.json"), "utf8"));
const tete = JSON.parse(fs.readFileSync(path.join(dossier, "tete.json"), "utf8"));
const teteValide = (t) => t.chin < 400 && t.peak >= 110 && (t.chin - t.T) / t.peak >= 1.0 && (t.chin - t.T) / t.peak <= 1.4 && Math.abs(t.cx - 240) <= 6;

const bodies = { Body_Homme: [], Body_Femme: [] };
for (const [k, t] of Object.entries(tete).sort()) {
  const dir = k.split("/")[0];
  if (bodies[dir] && res[k] && teteValide(t)) {
    const m = res[k], s = Math.min(480 / m[0], 640 / m[1]);
    bodies[dir].push([k, t.T, t.chin, t.peak, Math.round(t.cx), Math.round(((640 - m[1] * s) / 2 + (m[5] + 1) * s) * 100) / 100, Number.isFinite(t.torse) ? t.torse : 0]);
  }
}
const parts = { Vetements: [], Cheveux: [], Yeux: [], Oreille_Gauche: [], Oreille_Droite: [], Nez: [], Bouche: [], Barbe: [], Accessoires: [] };
for (const [k, m] of Object.entries(res).sort()) {
  if (!m) continue;
  const [dir, sous] = k.split("/");
  let cat = dir;
  if (dir === "Yeux" && k.split("/").length > 2) continue;
  if (dir === "Oreilles") cat = sous === "Gauche" ? "Oreille_Gauche" : sous === "Droite" ? "Oreille_Droite" : "";
  if (parts[cat]) parts[cat].push([k, ...m]);
}
const texte = "/* Généré par cloudflare/tools/generer-catalogue-choix-badavatars.mjs : ne pas éditer à la main. Éléments CHOISISSABLES (même forme que itopod-badavatars-catalogue-v1.js : pièces [clé relative à shared/badavatars/, largeur, hauteur, x0, y0, x1, y1], corps [clé, haut de la tête, menton, largeur de la tête, axe, bas opaque, bas du torse]). Ne sert jamais au tirage. */\n" +
  "(function () {\n  window.__SOREAL_IDLE_ITOPOD_BADAVATARS_CHOIX_V1__ = " + JSON.stringify({ version: 1, bodies, parts }) + ";\n})();\n";
fs.writeFileSync(sortie, texte);
console.log("écrit", sortie, "corps", Object.fromEntries(Object.entries(bodies).map(([a, b]) => [a, b.length])), "pièces", Object.fromEntries(Object.entries(parts).map(([a, b]) => [a, b.length])), Math.round(texte.length / 1024) + " Ko");
