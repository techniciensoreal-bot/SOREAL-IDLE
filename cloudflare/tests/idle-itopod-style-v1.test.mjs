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
// Combat de boss : UNE borne d'arcade de face, les deux combattants sur le même grand écran (Norman, 2026-10-06).
const arene = css.slice(css.indexOf("COMBAT DE BOSS : l'ARÈNE D'ARCADE"));
assert.ok(arene.length > 6000, "bloc de l'arène d'arcade présent");
for (const fragment of [
  "arcadeFightV1", "arcadeVsV1", "arcadeBalayageV1", "arcadeMarqueeV1",             /* FIGHT qui pulse, VS qui brille, balayage cathodique, marquee qui respire */
  "perspective(260px) rotateX(62deg)",                                               /* sol quadrillé en perspective */
  "transform:skewX(-12deg)",                                                         /* barres de vie inclinées face à face */
  ".soreal-idle-bossbar-wrap-v7{transform:scaleX(-1);}",                             /* la barre du boss se vide vers le centre */
  "repeating-linear-gradient(45deg,#ffd21e 0 11px,#17140c 11px 22px)",              /* NUKE : hachures de danger */
  "grid-template-columns:minmax(0,1fr) minmax(0,1.5fr) minmax(0,1fr)",              /* FUITE | FIGHT | NUKE */
  ".soreal-idle-boss-respawn-v100:empty{display:none!important;}",
  "@media (max-width:520px)", "@media (max-width:700px)", "prefers-reduced-motion"
]) assert.ok(arene.includes(fragment), "arène : " + fragment);
assert.ok(!arene.includes("Bangers") && !arene.includes("areneBraisesV1"), "plus de style BD dans l'arène");
for (const cible of ["soreal-idle-duel-nameplate-v65", "soreal-idle-duel-portrait-v41", "soreal-idle-duel-hp-v41", "soreal-idle-vs-v41", "soreal-idle-boss-controls-v39", "soreal-idle-boss-respawn-v100", "soreal-idle-reward-v8"]) assert.ok(arene.includes(cible), "l'arène habille " + cible);
assert.ok(!/ \{[^}]*display:none[^}]*soreal-idle-duel-portrait/.test(arene), "les portraits ne sont jamais cachés");
// Une seule borne : le bloc duel est le corps, la rangée est l'écran, plus de rotation de chaque combattant.
assert.ok(arene.includes(".soreal-idle-duel-v41::before") && arene.includes("★  SOREAL IDLE  ★") && arene.includes("rotateX(48deg)"), "une borne : marquee et tableau isométrique");
assert.ok(!arene.includes("rotateY("), "plus de deux bornes tournées : une seule borne de face");
assert.equal((arene.match(/circle at \d+% (19|51)px,#fff/g) || []).length, 6, "six boutons en relief : trois en haut, trois en dessous");
assert.equal((arene.match(/circle at 24% 17px,#fff/g) || []).length, 1, "un seul joystick");
assert.ok(arene.includes("border:10px solid #05060a") && arene.includes("minmax(0,1fr) auto minmax(0,1fr)"), "grand écran cathodique à deux combattants");
console.log("idle-itopod-style-v1: OK");
