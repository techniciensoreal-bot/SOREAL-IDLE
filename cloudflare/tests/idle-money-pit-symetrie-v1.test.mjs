// Norman (2026-11-02) : « les 2 mêmes colonnes, une symétrie parfaite, tout doit s'emboîter » : sur PC, le trou et la roue sont deux carrés identiques 25 % plus petits, les cartes de chaque rangée ont la même hauteur,
// « Login rewards » prend la largeur des deux réunis, et rien ne colle le cadre d'au-dessus.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const norm = (t) => t.split(String.fromCharCode(13)).join("");
const css = norm(readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8"));
const regle = css.lastIndexOf("  html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-page-root-v28[data-menu=\"moneyPit\"] .mp2-grille-v1{grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto auto auto");
assert.ok(regle > 0, "règle de la grille symétrique présente");
const media = css.lastIndexOf("@media (min-width:761px){", regle);
assert.ok(media > 0 && regle - media < 1500 && !css.slice(media, regle).includes("\n}\n"), "dans le bloc PC seulement (> 760 px : le téléphone ne change pas)");
const bloc = css.slice(media);

assert.ok(bloc.includes("margin-top:14px!important"), "14 px d'écart avec le cadre d'au-dessus");
assert.ok(bloc.includes(">.mp-col-v1{display:contents}"), "les deux colonnes partagent UNE grille (rangées communes)");
for (const [col, ligne] of [[1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [2, 3]]) {
  const classe = col === 1 ? "mp-col-trou-v1" : "mp-col-roue-v1";
  assert.ok(bloc.includes(`>.${classe}>:nth-child(${ligne}){grid-column:${col};grid-row:${ligne}}`), `colonne ${col}, rangée ${ligne}`);
}
assert.ok(/\.mp-col-v1>\*\{width:75%!important;max-width:75%!important;margin:0!important;justify-self:center;align-self:stretch;box-sizing:border-box\}/.test(bloc), "chaque cadre : 75 % de sa moitié, centré, même hauteur que son voisin");
assert.ok(bloc.includes(".mp-col-roue-v1>.rb-roue{aspect-ratio:1/1;") && bloc.includes(".mp-col-trou-v1>.soreal-idle-money-scene-v206{aspect-ratio:1/1;"), "rangée 1 : deux carrés identiques");
assert.ok(bloc.includes("calc(100% * .875 + 2.5px)"), "« Login rewards » : la largeur des deux colonnes réunies");

// la roue ne porte plus le bouton ni la légende : ils sont dans la carte du dessous
const roue = norm(readFileSync("cloudflare/public/modules/roue-journaliere-v1.js", "utf8"));
assert.ok(roue.includes("function rendreControles(st,j,boutonHtml)") && roue.includes("rendreControles:rendreControles"), "bouton et légende rendus à part");
const page = norm(readFileSync("cloudflare/public/modules/money-pit-page-v1.js", "utf8"));
assert.ok(page.includes("RO.rendreControles(roueSt,j,boutonRoue)"), "la carte « Roue journalière ! » porte le bouton et la légende");

console.log("idle-money-pit-symetrie-v1 : OK");
