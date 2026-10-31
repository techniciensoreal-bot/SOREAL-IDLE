/*
 * Catalogue des pièces de « badavatars » pour l'ITOPOD (fichier généré : modules/itopod-badavatars-catalogue-v1.js).
 * Chaîne complète (les images vivent dans le R2 « soreal », dossier shared/badavatars/) :
 *   1. node cloudflare/tools/badavatars/telecharger-r2.mjs <dossier>      (liste + télécharge, via le Worker de récolte en lecture seule)
 *   2. node cloudflare/tools/badavatars/serveur.mjs <dossier> 8791         puis ouvrir http://127.0.0.1:8791/mesurer.html (mesure les images dans le navigateur, écrit res.json et tete.json)
 *   3. node cloudflare/tools/generer-catalogue-badavatars.mjs <dossier>
 * Aucune valeur n'est inventée : les boîtes sont MESURÉES sur les pixels non transparents de chaque image.
 * Jamais de Vetements ni d'Accessoires dans le catalogue ; les yeux ne gardent que les paires (les yeux Droit/Gauche isolés sont ignorés).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dossier = path.resolve(process.argv[2] || ".");
const sortie = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "modules", "itopod-badavatars-catalogue-v1.js");
const res = JSON.parse(fs.readFileSync(path.join(dossier, "res.json"), "utf8"));
const tete = JSON.parse(fs.readFileSync(path.join(dossier, "tete.json"), "utf8"));

export function teteValide(t) {
  const h = t.chin - t.T;
  return t.chin < 400 && t.peak >= 110 && h / t.peak >= 1.0 && h / t.peak <= 1.4 && Math.abs(t.cx - 240) <= 6;
}
const bodies = { Body_Homme: [], Body_Femme: [] };
for (const [k, t] of Object.entries(tete).sort()) {
  const dir = k.split("/")[0];
  if (bodies[dir] && teteValide(t)) bodies[dir].push([k, t.T, t.chin, t.peak, Math.round(t.cx)]);
}
const parts = { Cheveux: [], Yeux: [], Oreille_Gauche: [], Oreille_Droite: [], Nez: [], Bouche: [], Barbe: [] };
for (const [k, m] of Object.entries(res).sort()) {
  if (!m) continue;
  const [dir, sous] = k.split("/");
  let cat = dir;
  if (dir === "Yeux" && k.split("/").length > 2) continue;
  if (dir === "Oreilles") cat = sous === "Gauche" ? "Oreille_Gauche" : sous === "Droite" ? "Oreille_Droite" : "";
  if (parts[cat]) parts[cat].push([k, ...m]);
}
const texte = "/* Généré par cloudflare/tools/generer-catalogue-badavatars.mjs : ne pas éditer à la main. [clé relative à shared/badavatars/, largeur, hauteur, x0, y0, x1, y1] (pixels non transparents) ; corps : [clé, haut de la tête, menton, largeur de la tête, axe] en pixels d'une scène 480 x 640. */\n" +
  "(function () {\n  window.__SOREAL_IDLE_ITOPOD_BADAVATARS_CATALOGUE_V1__ = " + JSON.stringify({ version: 1, bodies, parts }) + ";\n})();\n";
fs.writeFileSync(sortie, texte);
console.log("écrit", sortie, "corps", Object.fromEntries(Object.entries(bodies).map(([a, b]) => [a, b.length])), "pièces", Object.fromEntries(Object.entries(parts).map(([a, b]) => [a, b.length])));
