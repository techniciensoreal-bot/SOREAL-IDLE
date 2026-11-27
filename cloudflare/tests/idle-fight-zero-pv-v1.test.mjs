import assert from "node:assert/strict";
import fs from "node:fs";
/* Audit Fight Boss (2026-11-27), A7 : un Fight a 0 PV ne demarre pas et ne compte ni defaite ni essai. */
const src = fs.readFileSync("cloudflare/src/idle-runtime-combat.js", "utf8");
const i = src.indexOf("A7 : un Fight a 0 PV");
assert.ok(i > 0, "garde presente");
const garde = src.slice(i, i + 500);
assert.ok(/c\.PV_JOUEUR\)\.getValue\(\), 0\) <= 0/.test(garde) && garde.includes("ignore:true,pvJoueurNul:true"), "refus sans effet");
assert.ok(i < src.indexOf("marquerRencontreBossPrincipalUneFoisParRunV207_(\n        stats,\n        bossIndex + 1") && i < src.indexOf("stats.fluxEssais=essais"), "la garde precede la rencontre et le compteur d'essais");
console.log("idle-fight-zero-pv-v1: OK");
