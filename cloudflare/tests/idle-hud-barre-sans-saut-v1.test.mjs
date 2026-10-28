import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-26) : « quand je dépense toute ma magie ou toute mon énergie, les barres disparaissent et ça fait bouger la page où je me trouve ».
 * Norman (2026-10-28) : « ça fait encore bouger le menu dans lequel on se trouve ; ça doit vraiment être 2 choses indépendantes ». L'ancienne compensation (report sur le défilement) ne jouait que page défilée : en haut de page le contenu suivait la barre.
 * Maintenant une réserve (bloc vide juste sous le bandeau) absorbe exactement chaque variation de hauteur du bandeau, image après image (ResizeObserver, avant l'affichage) : le contenu ne bouge ni en haut de page ni défilé.
 * Mesuré dans Chrome : la position du contenu reste identique à chaque image pendant le fondu d'une barre (départ ET retour).
 */
const hud = readFileSync("cloudflare/public/modules/hud-haut-v2.js", "utf8");
assert.ok(hud.includes("new ResizeObserver(") && hud.includes("hudObs.observe(h)"), "le bandeau est surveillé image après image");
assert.ok(hud.includes("sorealIdleHudReserveV2") && hud.includes("data-morph-garder"), "réserve sous le bandeau, épargnée par le redessin de la page");
assert.ok(hud.includes("reserve.getBoundingClientRect().bottom+"), "on mesure la position réelle du contenu (le bas de la réserve, marges du bandeau comprises)");
assert.ok(hud.includes("reserve.style.height=Math.max(0,hauteur-d)+'px'"), "la variation de hauteur est absorbée par la réserve");
assert.ok(!hud.includes("window.scrollTo("), "plus de report sur le défilement : le contenu ne bouge pas du tout, défilé ou non");
assert.ok(hud.includes("Math.abs(d)>0.01&&Math.abs(d)<60") &&!hud.includes("Math.abs(d)>=.5"), "aucun seuil de 0,5 px : les petits écarts du début et de la fin du fondu s'additionneraient en un saut");
assert.ok(hud.includes("tcv-actif"), "le bandeau caché pendant un combat de Titan n'est pas compensé");
assert.ok(hud.includes("remettreReserve") && hud.includes("window.addEventListener('resize'"), "réserve remise à zéro au changement de menu et de taille de fenêtre");
assert.ok(hud.includes("surveillerHud();"), "le bandeau (parfois recréé) est ré-attaché régulièrement");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
assert.ok(css.includes("soreal-idle-page-root-v28{overflow-anchor:none}"), "l'ancrage natif reste coupé (page redessinée en continu) : c'est la réserve qui compense");

assert.ok(hud.includes("GRACE_MS=5000") && hud.includes("Date.now()<graceJusqua"), "page qui vient de s afficher : rien n est absorbé pendant 5 s (sinon un grand vide entre la barre de vie et la page, Norman 2026-10-28 : dans tous les menus)");
console.log("idle-hud-barre-sans-saut-v1: OK");
