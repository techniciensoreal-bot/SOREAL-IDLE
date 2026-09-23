import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * 2026-09-23 (wiki Drop Chance) : le bonus de drop du set 2D (x1,0743) et du Cube (additif avec les objets)
 * était appliqué deux fois : dans specials.dropChancePct -> dropMultiplier du moteur meta, PUIS de nouveau dans
 * rollKill / titan. Le contexte meta marque maintenant son multiplicateur comme incluant déjà l'équipement.
 */
const ngu = readFileSync("cloudflare/src/idle-ngu-progression.js", "utf8");
const adv = readFileSync("cloudflare/src/idle-adventure-v47.js", "utf8");
assert.equal(ngu.split("dropMultiplierIncludesGear").length - 1, 2, "kill de zone et titan");
assert.equal(adv.split("ctx.dropMultiplierIncludesGear").length - 1, 2, "rollKill et titan ignorent set + Cube quand le meta les fournit");
console.log("idle-drop-chance-no-double-count ok");
