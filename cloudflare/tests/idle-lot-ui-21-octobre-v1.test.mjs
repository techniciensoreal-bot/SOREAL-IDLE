import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Lot du 2026-10-21 (Norman) : NUKE après une renaissance, sauts de page, boutons NGU, barre de boss par couleur. */
const lire = (f) => readFileSync(new URL("../public/" + f, import.meta.url), "utf8");
const combat1 = lire("modules/ui-combat-1-v1.js");
const combat2 = lire("modules/ui-combat-2-v1.js");
const noyau = lire("modules/ui-noyau-v1.js");
const augm = lire("modules/augmentations-page-v1.js");
const pit = lire("modules/money-pit-page-v1.js");
const ngu = lire("modules/ngu-labo-v1.js");
const itopod = lire("soreal-idle-itopod.css");

// 1. Après une renaissance, le bouton NUKE suit l'état à chaque rafraîchissement des commandes (il restait désactivé jusqu'à un changement de menu).
assert.ok(combat1.includes("const nuke=document.getElementById('sorealIdleBossNukeV1');") && combat1.includes("REG.bossNukableIdleV198_(REG.idleEtat)"), "NUKE rafraîchi avec les commandes");
assert.ok(combat2.includes("bossNukableIdleV198_:bossNukableIdleV198_,"), "règle du NUKE partagée");

// 2. Aucun saut à l'arrivée sur un menu : les modules qui ajoutent des éléments au rendu sont rappelés dans la même tâche que le rendu complet.
assert.ok(noyau.includes("(window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).forEach(function(f){try{f();}catch(_e){}});\n        try{\n          restaurerScrollNavIdleV28_(") || /APRES_REDESSIN_V1__\|\|\[\]\)\.forEach[^]*?restaurerScrollNavIdleV28_\(idleNavScrollAvantRenduV1\)/.test(noyau), "rappel des modules au rendu complet");
assert.ok(augm.includes("push(function(){if(typeof atTickIdleV1_==='function')atTickIdleV1_();});"), "textes des lignes d'Entraînement avancé posés dans la même tâche");
assert.ok(pit.includes('width="1000" height="1000"'), "image du Money Pit : place réservée avant son chargement");
assert.ok(itopod.includes(".mp2-grille-v1 .soreal-idle-money-scene-v206{max-width:520px!important;margin:0 auto!important;width:100%;box-sizing:border-box}"), "cadre de l'image du Money Pit : largeur définie");

// 3. NGU : boutons lisibles ; « Vers les NGU » illuminé et étoilé.
assert.ok(ngu.includes(".nl-barre-outils button:not(#_):not(#_)") && ngu.includes("background:linear-gradient(180deg,#8087ff 0%,#4a46d6 55%,#312ea8 100%)") && ngu.includes("-webkit-text-stroke:0"), "boutons NGU : fond plein, texte net");
assert.ok(ngu.includes(".nl-haut [data-nl-onglet-btn]::before") && ngu.includes("conic-gradient(from var(--soreal-ang-v1,0deg)") && ngu.includes("nlEtoilesV1"), "bouton Vers les NGU : anneau lumineux et étoiles");
assert.ok(/@keyframes nlEtoilesV1\{0%\{opacity:0;transform:scale\(\.7\)\}50%\{opacity:1;transform:scale\(1\.15\)\}100%\{opacity:0;transform:scale\(\.7\)\}\}/.test(ngu), "étoiles : fondu d'entrée et de sortie (règle n°3)");

// 4. Barre de boss : une couleur par boss, la même pour un même boss, bien distincte entre deux boss qui se suivent.
const debut = combat1.indexOf("function paletteBarreBossIdleV1_(n){");
const fin = combat1.indexOf("/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-28 */\n      function rafraichirCommandesFightBossIdleV167_");
assert.ok(debut > 0 && fin > debut, "palette dans le combat");
const { paletteBarreBossIdleV1_, styleCouleurBarreBossIdleV1_ } = vm.runInNewContext("(function(){" + combat1.slice(debut, fin) + "\nreturn {paletteBarreBossIdleV1_:paletteBarreBossIdleV1_,styleCouleurBarreBossIdleV1_:styleCouleurBarreBossIdleV1_};})()", {});
const teinte = (n) => Number(/hsl\((\d+),/.exec(paletteBarreBossIdleV1_(n).a)[1]);
assert.deepEqual(JSON.parse(JSON.stringify(paletteBarreBossIdleV1_(37))), JSON.parse(JSON.stringify(paletteBarreBossIdleV1_(37))), "même boss, même couleur");
for (let n = 1; n < 301; n += 1) {
  const ecart = Math.abs(teinte(n) - teinte(n + 1));
  assert.ok(Math.min(ecart, 360 - ecart) >= 100, "boss " + n + " et " + (n + 1) + " : couleurs bien distinctes (écart " + ecart + "°)");
}
assert.ok(new Set(Array.from({ length: 301 }, (_, i) => teinte(i + 1))).size > 250, "très peu de boss partagent la même teinte");
assert.ok(styleCouleurBarreBossIdleV1_(5).startsWith("--bc-a:hsl(") && styleCouleurBarreBossIdleV1_(5).includes("--bc-glow:"), "variables posées sur la barre");
assert.ok(combat2.includes('data-couleur-n="${idleEntier_(j.bossId)}"') && combat2.includes("REG.styleCouleurBarreBossIdleV1_"), "couleur posée dès le dessin de la page");
assert.ok(itopod.includes("linear-gradient(180deg,var(--bc-a,#a23fd6) 0%,var(--bc-b,#7a22b4) 50%,var(--bc-c,#4f1286) 100%)") && itopod.includes("linear-gradient(180deg,var(--bc-a,#a23fd6) 0%,var(--bc-b,#7a22b4) 45%,var(--bc-c,#4f1286) 100%)"), "la feuille de style lit les variables (violet par défaut)");
console.log("idle-lot-ui-21-octobre-v1: OK");
