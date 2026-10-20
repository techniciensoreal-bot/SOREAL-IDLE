import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Journal de Norman (2026-10-20) : 30 « barre_recule » (Ciseaux, niveau « inchangé ») et des « niveau_recule 999 -> 1 » étaient FAUX : la sonde lisait le niveau affiché avec parseInt, or il est abrégé (« 2,87K » -> 2) et
 * ne change plus quand le niveau monte. Garde : le niveau comparé vient de l'état du jeu (niveau exact), le texte affiché n'est qu'un repli.
 */
const src = readFileSync(new URL("../public/modules/diag-fluidite-v1.js", import.meta.url), "utf8");
assert.ok(src.includes("pairs[parts[0]]") && src.includes("paire.upgradeLevel") && src.includes("paire.level"), "niveau exact lu dans l'état des Augmentations");
assert.ok(/if\(!isFinite\(niv\)\)niv=nivEl\?parseInt\(nivEl\.textContent,10\):NaN;/.test(src), "le texte affiché n'est qu'un repli");
assert.ok(!/var niv=nivEl\?parseInt/.test(src), "plus de lecture directe du texte abrégé");
console.log("idle-diag-niveau-exact-v1: OK");
