import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-11-14) : dans Labos, le bouton + doit être grisé quand le niveau suivant n'est pas acheté (on est au maximum de ce qu'on a acheté). */
const page = readFileSync(new URL("../public/modules/labos-page-v1.js", import.meta.url), "utf8");
assert.ok(page.includes("(run>=max?' lp-manque':'')+'\" '+(run>=max?'aria-disabled=\"true\" '"), "le + est marqué indisponible, sans clic, quand le niveau actif atteint le niveau acheté");
const regle = page.match(/\.lp-btn\.carre\.lp-manque\{[^}]*\}/);
assert.ok(regle, "règle du bouton carré grisé");
assert.ok(/opacity:\.\d+/.test(regle[0]) && /color:#6/.test(regle[0]), "symbole atténué et bouton terne, visiblement différent d'un bouton actif");
console.log("idle-labos-plus-grise-v1 : OK");
