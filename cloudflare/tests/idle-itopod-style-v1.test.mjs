import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Habillage « ITOPOD » de toute l'application (Norman, 2026-10-06) : une feuille chargée EN DERNIER, une palette par menu, panneaux de pierre, boutons biseautés,
 * onglets, jauges, torches et losanges. Ce test garde la structure (palettes, ordre de chargement, aucune ressource externe).
 */
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const index = readFileSync("cloudflare/public/index.html", "utf8");

const liens = [...index.matchAll(/<link rel="stylesheet" href="\/([a-z-]+\.css)\?v=\d+">/g)].map((m) => m[1]);
assert.equal(liens[liens.length - 1], "soreal-idle-itopod.css", "feuille ITOPOD chargée en dernier : " + liens.join(", "));
assert.ok(liens.indexOf("soreal-idle-itopod.css") > liens.indexOf("soreal-idle-themes.css") && liens.indexOf("soreal-idle-itopod.css") > liens.indexOf("soreal-idle-jeu.css"));

const menus = ["entrainement", "combat", "aventure", "bestiaire", "moneyPit", "augmentations", "machine", "sang", "challenges", "titans", "ngu", "wandoos", "yggdrasil", "diggers", "beards", "shop", "succes", "classement", "chat", "parametres", "admin"];
for (const m of menus) {
  const bloc = new RegExp('\\[data-menu="' + m + '"\]\{[^}]*--i-a:[^;}]+;[^}]*--i-b:[^;}]+;[^}]*--i-c:[^;}]+;[^}]*--i-bg1:[^;}]+;[^}]*--i-bg2:[^;}]+;[^}]*--i-glow:[^;}]+;');
  assert.ok(bloc.test(css), "palette complète pour le menu " + m);
}
assert.ok(/\.soreal-idle-page-root-v28\[data-menu\]\{--i-a:/.test(css), "palette par défaut (ITOPOD, violet et or)");
for (const fragment of ["border:3px solid #000", "5px 5px 0 #000", "itpTorche", "var(--i-glow)"]) assert.ok(css.includes(fragment), "langage de l'ITOPOD : " + fragment);
assert.ok(!/@import|url\(\s*["']?https?:/i.test(css), "aucune ressource externe");
// Écritures « BD » : Bangers (titres, boutons) et Comic Neue (textes), chargées par index.html ; seul l'écran rétro garde sa police.
assert.ok(index.includes("fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue"), "polices BD chargées par la page");
assert.ok(css.includes('--f-titre:"Bangers"') && css.includes('--f-texte:"Comic Neue"'), "deux familles : titres et textes");
assert.ok(css.includes(":not(.wd-ecran)") && css.includes(":not(.wd-touche)"), "l'ordinateur rétro garde sa police d'écran");
assert.ok(css.includes("-webkit-text-stroke:1px #000"), "contour noir des titres (lettres de BD)");
// Montée en puissance : six rangs, chacun avec un fond de plus en plus foncé ; le dernier est la couleur de base, très foncée ; titres de Basic Training en bandeaux de combat.
for (let n = 0; n <= 5; n++) {
  assert.ok(css.includes('[data-rang-v1="' + n + '"]{border:3px solid #000!important;'), "rang " + n + " : cadre");
  assert.ok(css.includes('[data-rang-v1="' + n + '"] .soreal-idle-bt-fill-v120{'), "rang " + n + " : matière de la barre");
}
const bloc = (n) => { const d = css.indexOf('[data-rang-v1="' + n + '"]{border:3px solid #000!important;'); return css.slice(d, css.indexOf('}', d)); };
const part = (n) => Number(bloc(n).split('linear-gradient(145deg,color-mix(in srgb,var(--rg-c1) ')[1].split('%')[0]);
assert.equal(part(0), 50, 'rang 0 : fond le plus clair');
assert.ok(bloc(5).includes('color-mix(in srgb,var(--rg-dark) 78%,#000)'), 'rang 5 : couleur de base, très foncée');
const mixes = [0, 1, 2, 3, 4].map(part);
assert.deepEqual(mixes, mixes.slice().sort((a, b) => b - a), "le fond s'assombrit à chaque rang : " + mixes.join(' > '));
for (const fragment of ["rgSheenV1", "rgBatV1", "rgFeuV1", "repeating-linear-gradient(135deg,rgba(0,0,0,.30)", "clip-path:polygon(0 0,16px 8px"]) assert.ok(css.includes(fragment), "effet de montée en puissance : " + fragment);
assert.ok(css.includes(".soreal-idle-bt-panel-v120.attack .soreal-idle-bt-panel-head-v120::before") && css.includes("viewBox='0 0 64 64'"), "emblèmes d'épées et de bouclier dans les titres");
console.log("idle-itopod-style-v1: OK");
