import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-22) : « quand on clique sur ITOPOD on doit toujours être ramené à l'écran de combat ; il ne doit pas garder la boutique en mémoire ». La page ITOPOD a deux vues (la tour = combat, la boutique des Atouts) ;
 * la vue choisie restait en mémoire (window.__itopodVueIdleV1__). Un clic sur le menu ITOPOD remet la vue « tour ».
 */
const nav = readFileSync(new URL("../public/modules/ui-navigation-v1.js", import.meta.url), "utf8");
const page = readFileSync(new URL("../public/modules/itopod-perks-page-v1.js", import.meta.url), "utf8");
const reset = "if(nouveauMenu==='tower')window.__itopodVueIdleV1__='tour';";
const i = nav.indexOf(reset);
assert.ok(i > 0, "le clic sur ITOPOD remet la vue « tour »");
assert.ok(i < nav.indexOf("REG.idleMenuActifV28=\n          nouveauMenu;") || i < nav.indexOf("REG.idleMenuActifV28=nouveauMenu;"), "avant le changement de menu et le rendu");
assert.ok(i < nav.indexOf("rendreIdleEtat_({", i), "avant le redessin de la page");
// La page n'affiche la boutique que si la vue mémorisée vaut « atouts » : « tour » montre le combat.
assert.ok(page.includes("window.__itopodVueIdleV1__==='atouts'"), "la vue mémorisée décide de ce que la page montre");
// Le bouton Atouts de la page bascule toujours (tour <-> atouts) : seule l'entrée par le menu est remise à « tour ».
assert.ok(page.includes("const vers=window.__itopodVueIdleV1__==='atouts'?'tour':'atouts';"));
console.log("idle-itopod-retour-combat-v1: OK");
