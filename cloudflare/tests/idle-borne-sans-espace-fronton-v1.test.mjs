import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-11-01) : « plus d'espace vide entre la partie haute de la borne et l'écran. Il y a une coupure dans les bandes LED bleu et rouge. »
 * Cause : le fronton (SVG) finissait par un bandeau sombre de 12 unités + un filet horizontal qui recouvraient le bas des baguettes bleue et rouge, et le duel
 * ajoutait 18 px de remplissage en haut ; les baguettes du duel (10 px, dégradé différent) ne prolongeaient pas celles du fronton (8 unités sur 520, x = 1 à 9). */
const css = readFileSync(new URL("../public/soreal-idle-itopod.css", import.meta.url), "utf8");
const js = readFileSync(new URL("../public/modules/ui-combat-2-v1.js", import.meta.url), "utf8");

const fronton = js.match(/const BORNE_FRONTON_IDLE_V2="((?:[^"\\]|\\.)*)"/);
assert.ok(fronton, "le fronton de la borne existe");
const svg = fronton[1].replace(/\\"/g, '"');

// 1. Le fronton n'a plus de bandeau ni de filet en bas : rien ne recouvre le bas des baguettes.
assert.ok(!/<rect x="0" y="88"/.test(svg), "plus de bandeau sombre au bas du fronton");
assert.ok(!/M0 91 H520/.test(svg), "plus de filet horizontal au bas du fronton");
assert.ok(/viewBox="0 0 520 92"/.test(svg), "le fronton s'arrête juste sous l'enseigne");
const hauteurViewBox = 92;
const bas = [...svg.matchAll(/<rect [^>]*y="(\d+(?:\.\d+)?)" [^>]*height="(\d+(?:\.\d+)?)"/g)].map((m) => Number(m[1]) + Number(m[2]));
assert.ok(bas.every((b) => b <= hauteurViewBox - 4), "aucun rectangle ne descend jusqu'au bas du fronton (il couperait les baguettes)");

// 2. Le raccord est sans marge ni remplissage : le duel colle au fronton et l'écran colle au duel.
const regle = (sel) => { const i = css.indexOf(sel); assert.ok(i >= 0, "règle absente : " + sel.slice(-60)); return css.slice(i, css.indexOf("}", i)); };
const BN = '[data-menu="combat"] .soreal-idle-boss-current-v35.borne-v2 ';
const duel = regle(BN + ".soreal-idle-duel-v41{position:relative;margin:0!important;");
assert.match(duel, /padding:0 26px 16px!important/, "aucun remplissage en haut du duel");
assert.ok(/margin:0!important/.test(duel), "aucune marge autour du duel");
assert.match(regle("@media (max-width:560px){\n  html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-page-root-v28" + BN + ".soreal-idle-duel-v41{"), /padding:0 18px 12px!important/, "téléphone : aucun remplissage en haut");
assert.match(css, /\.bn-fronton\{display:block;width:100%;height:auto;margin:0 0 -1px;/, "le fronton déborde d'un pixel sur le duel (aucun joint)");
const ecran = regle("soreal-idle-duel-versus-row-v42{\n  position:relative;box-sizing:border-box;overflow:hidden;");
assert.match(ecran, /border-radius:0 0 20px 20px!important/, "le haut de l'écran est carré (il s'accole au fronton)");

// 3. Les baguettes du duel prolongent exactement celles du fronton : même abscisse (1/520), même épaisseur (8/520), mêmes couleurs, du haut au bas du duel.
const pseudo = regle(BN + ".soreal-idle-duel-v41::before,");
assert.match(pseudo, /top:0!important;bottom:0!important/, "les baguettes vont du haut au bas du duel");
assert.match(pseudo, /width:calc\(100cqw\*8\/520\)!important/, "même épaisseur que la baguette du fronton");
const bleu = regle(BN + ".soreal-idle-duel-v41::before{left:");
assert.match(bleu, /left:calc\(100cqw\/520\)!important/);
assert.match(bleu, /var\(--bl\) 37\.5%,#a1c4ff 37\.5% 62\.5%,var\(--bl\) 62\.5%/, "même cœur clair (2 sur 8) que le fronton");
const rouge = regle(BN + ".soreal-idle-duel-v41::after{right:");
assert.match(rouge, /right:calc\(100cqw\/520\)!important/);
assert.match(rouge, /var\(--ro\) 37\.5%,#ff9fa8 37\.5% 62\.5%,var\(--ro\) 62\.5%/);
// dans le fronton : x = 5, épaisseur 8 (1 à 9) à gauche ; x = 515 à droite (511 à 519)
assert.ok(/M5 100 V28 Q5 11 22 11 H498 Q515 11 515 28 V100/.test(svg), "la baguette du fronton est bien à x = 5, épaisseur 8");
assert.ok(/stroke-width="8" stroke-linecap="round"/.test(svg));
// et le dégradé du fronton est bien le même bleu / rouge que les variables de la borne
assert.ok(/--bl:#2f7bff;--ro:#ff2a3d/.test(css) && /stop-color="#2f7bff"/.test(svg) && /stop-color="#ff2a3d"/.test(svg));

// 4. Chaque baguette est dessinée par UN seul élément par côté dans le duel, et ne dépend d'aucun autre bandeau (pas de seconde barre entre les deux).
assert.equal((css.match(/borne-v2 \.soreal-idle-duel-v41::before\{left:/g) || []).length, 1);
assert.equal((css.match(/borne-v2 \.soreal-idle-duel-v41::after\{right:/g) || []).length, 1);

console.log("ok idle-borne-sans-espace-fronton-v1");
