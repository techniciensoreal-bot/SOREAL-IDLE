import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-11-14) : le texte sous les barres d'Entraînement avancé tient sur UNE ligne sur PC ; sur téléphone, « il faut ce qu'il faut » (deux lignes si la place manque). */
const css = readFileSync(new URL("../public/soreal-idle-stabilite-v1.css", import.meta.url), "utf8");
const pc = css.match(/\.soreal-idle-at-detail-v1\{display:flex[^}]*\}/);
assert.ok(pc && pc[0].includes("flex-wrap:nowrap") && pc[0].includes("white-space:nowrap"), "PC : une seule ligne, jamais de retour");
assert.ok(/@media \(max-width:700px\)\{[^{]*\.soreal-idle-at-detail-v1\{flex-direction:column/.test(css), "téléphone : deux lignes si la place manque");
const page = readFileSync(new URL("../public/modules/augmentations-page-v1.js", import.meta.url), "utf8");
assert.ok(!/\.soreal-idle-at-detail-v1\{[^}]*(flex-wrap|flex-direction)/.test(page), "la mise en page du détail vit dans la feuille de stabilité");
const stable = readFileSync(new URL("../public/modules/at-hauteur-stable-v1.js", import.meta.url), "utf8");
assert.ok(stable.includes("sonde.innerHTML='<span>'+b+'</span><span>'+PIRES[i]+'</span>'"), "la hauteur réservée est mesurée sur le pire texte");
console.log("idle-at-detail-une-ligne-v1 : OK");
