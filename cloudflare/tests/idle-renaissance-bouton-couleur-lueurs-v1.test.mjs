import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-17) : le bouton Renaissance prend la couleur de son menu ; quand la renaissance est en positif, de petites lueurs dorées MONTENT dans le bouton (piste B) — sur la page et dans le menu du haut.
 * Jamais de bande de lumière qui balaie, de halo qui pulse ni d'étoile qui scintille (« je déteste » : mémoire feedback-pas-de-brillance-balayage-halo).
 */
const lire = (p) => readFileSync("cloudflare/public/" + p, "utf8");
const rb = lire("soreal-idle-renaissance.css"), it = lire("soreal-idle-itopod.css"), nav = lire("modules/ui-navigation-v1.js"), page = lire("modules/ui-renaissance-v1.js");

assert.ok(page.includes("soreal-idle-rebirth-button-v14${prochain>actuel*1.0000001?' positif':''}"), "le bouton de la page porte .positif quand le nombre augmente");
assert.ok(nav.includes("classeRenaissancePositif") && nav.includes("' renaissance-positif-v1'") && nav.includes("${classeMoneyPit}${classeRenaissancePositif}"), "le bouton du menu porte .renaissance-positif-v1 quand c'est possible ET positif");
assert.ok(rb.includes("var(--nav-color)") && rb.includes("animation:none}") && !/rb2Halo|rb2Balayage|rb2Etoile/.test(rb), "couleur du menu, aucun halo permanent, ni balayage ni étoile");
assert.ok(rb.includes(".positif:not(:disabled)::before") && rb.includes("rb2Lueurs"), "lueurs qui montent sur la page");
for (const css of [rb, it]) {
  const bloc = css.slice(css.search(/rb2Lueurs 3\.4s|rbNavLueurs 3\.4s/));
  assert.ok(/background-repeat:repeat;/.test(css) && /-webkit-mask-image:linear-gradient\(180deg,transparent 0,#000 30%,#000 70%,transparent 100%\)/.test(css), "tuiles répétées, masque haut/bas : boucle sans à-coup");
  void bloc;
}
// règle n°3 : les couches ont la même taille de tuile et le glissement vaut exactement une tuile
const tuileP = rb.match(/background-size:((?:120px 64px(?:,)?){4})/), glissP = rb.match(/to\{background-position:((?:0 -64px(?:,)?){4})\}/);
assert.ok(tuileP && glissP, "page : 4 couches de 120x64, glissement de 64 px");
const tuileN = it.match(/background-size:((?:100px 56px(?:,)?){4})/), glissN = it.match(/to\{background-position:((?:0 -56px(?:,)?){4})\}/);
assert.ok(tuileN && glissN, "menu : 4 couches de 100x56, glissement de 56 px");
assert.ok(/prefers-reduced-motion:reduce\)\{[^}]*rb2Lueurs|prefers-reduced-motion:reduce\)\{[^}]*::before\{animation:none\}/.test(rb) && it.includes("renaissance-positif-v1::after{animation:none}"), "animation coupée si mouvement réduit");
assert.ok(!/balayage|rbEtoile|rbHalo/i.test(it.slice(it.indexOf("Bouton Renaissance du menu du haut"))), "rien de balayage/halo/étoile dans le menu du haut");
console.log("idle-renaissance-bouton-couleur-lueurs-v1: OK");
