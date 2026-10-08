import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-08) : « Retravaille le menu NGU. On oublie les potions. Il faut des barres, qui gardent les couleurs et soient beaucoup plus jolies que toutes celles du jeu ; le fond comme le cadre du chat des niveaux 30 dans SOREAL APP :
 * une nuit étoilée, avec les tuyaux qui brillent dans la nuit aux couleurs des barres. » + « L'image du trou sans fond sur PC est beaucoup trop grande. »
 */
const src = readFileSync("cloudflare/public/modules/ngu-labo-v1.js", "utf8");
// Plus de fioles
assert.ok(!/FIOLE|DECOUPE|nl-bulle|nl-verre|scaleY/.test(src), "plus aucune fiole : ni contour, ni bulles, ni remplissage vertical");
// Barres : tuyaux horizontaux, remplissage en scaleX (transform seulement)
assert.ok(src.includes("function barreHtml_(n,ancre){") && src.includes("liq.style.transform='scaleX('+v+')'"), "tuyau horizontal qui se remplit en transform");
assert.ok(src.includes('class="nl-bride g"') && src.includes('class="nl-bride d"'), "brides métalliques aux deux bouts");
assert.ok(src.includes("data-nl-pct"), "pourcentage affiché dans le tuyau");
// Nuit étoilée « cosmos » du cadre de chat des niveaux 30 : violet profond, étoiles à quatre branches qui scintillent
assert.ok(src.includes("linear-gradient(160deg,#1b0f45 0%,#120a33 45%,#0a0620 100%)"), "dégradé de nuit du cadre cosmos");
assert.ok(src.includes("clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%)"), "étoiles à quatre branches");
assert.ok(/@keyframes nlEtoile\{0%,60%,100%\{opacity:\.25;transform:scale\(\.6\)\}/.test(src), "scintillement en opacité / échelle (compositeur)");
assert.ok(src.includes("prefers-reduced-motion:no-preference"), "animations coupées pour qui les refuse");
// Tuyaux qui brillent aux couleurs des barres : halo et tronc lumineux
assert.ok(src.includes("box-shadow:0 0 12px color-mix(in srgb,var(--nl-c) 70%,transparent)") && src.includes(".nl-grille::before"), "tuyaux lumineux et tronc commun");
assert.ok(src.includes("@keyframes nlFlux"), "reflet qui parcourt les tuyaux alimentés");
// Aucune animation de propriété lourde sur les tuyaux (box-shadow, width...)
assert.ok(!/@keyframes nl[A-Za-z]+\{[^}]*(box-shadow|width|height|filter)/.test(src), "les animations ne touchent que transform et opacité");
// Les 16 couleurs sont conservées
for (const [id, c] of Object.entries({ augments: "#868686", wandoos: "#7a96f5", powerAlpha: "#ed3e3e", magicNgu: "#9e19f1", yggdrasil: "#58c46a" })) assert.ok(src.includes(id + ":['" + c + "'"), "couleur conservée : " + id);
// Le titre n'est pas un h1 (le thème du jeu y pose contour et ombre noirs)
assert.ok(!src.includes("<h1>") && src.includes('class="nl-titre"'), "titre hors des règles de h1 du thème");

// Image du trou sans fond : plafonnée en hauteur sur PC
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
assert.ok(meta.includes(".soreal-idle-money-scene-v206>img{display:block;width:auto;height:auto;max-width:100%;max-height:min(40vh,340px);margin:0 auto;object-fit:contain}"), "image du puits plafonnée à 340 px / 40 % de l'écran, entière et centrée");
console.log("idle-ngu-nuit-tuyaux-v1: OK");
