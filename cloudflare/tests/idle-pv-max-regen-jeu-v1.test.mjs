import assert from "node:assert/strict";
import { lireSrc } from "./_src-sources.mjs";
import { lireUiComplet } from "./_ui-sources.mjs";

/* Character::updateCharacter : maxHP = 10 + 10 x attack (sans plancher) ; Character::updateHP : 0,05 x (1 + defense) PV/s (IL build 1260). */
const src = lireSrc("idle-sqlite-runtime.js").replace(/\s+/g, "");
assert.ok(src.includes("pvMax:Math.round(10+attaque*10)"), "PV max = 10 + 10 x attaque, sans plancher 1000");
assert.ok(!src.includes("Math.max(1000,Math.round(attaque*10))"));
assert.ok(src.includes("constregenPvSecJoueur=Math.max(0,(1+defense)/20)"), "régénération moteur = (1 + defense) / 20");
const ui = lireUiComplet().replace(/\s+/g, "");
assert.ok(ui.includes("(1+Math.max(0,idleNombre_(defense)))/20"), "régénération client = (1 + defense) / 20");
console.log("idle-pv-max-regen-jeu-v1 OK");
