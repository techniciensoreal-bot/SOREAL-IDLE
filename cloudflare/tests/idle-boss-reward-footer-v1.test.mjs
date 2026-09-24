import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { nguBossStatsV1 } from "../src/idle-ngu-boss-reference-v1.js";

/*
 * Norman (2026-09-24) : « Dans le bas de Fight Boss, il est marqué le nombre d'XP que le boss rapporte ainsi que l'or qu'il va nous donner.
 * Tu peux vérifier si c'est correct ? »
 * Wiki, page Boss Fights, colonne « Exp Reward » : seul l'EXP est une récompense de boss principal (aucun or, aucun objet).
 * L'or « 🪙 » affiché venait de l'ancienne version (colonne inventée « pieces » de IDLE_BOSS) : supprimé.
 */
// EXP de base par boss, recopiées du tableau « Boss listing » du wiki (boss numéro -> EXP, valeur valable jusqu'au changement suivant).
const PALIERS_WIKI = [[1, 0], [4, 1], [5, 0], [7, 1], [24, 1], [34, 2], [44, 3], [54, 4], [64, 5], [74, 6], [84, 7], [94, 8], [104, 9], [114, 10], [124, 11], [134, 12], [144, 13], [154, 14]];
for (const [numero, xp] of PALIERS_WIKI) {
  assert.equal(Math.round(nguBossStatsV1(numero - 1).xp), xp, "boss " + numero + " : EXP du wiki");
}
// entre deux paliers la valeur ne change pas
for (const [numero, xp] of [[2, 0], [3, 0], [6, 0], [17, 1], [18, 1], [33, 1], [43, 2], [53, 3], [159, 14]]) {
  assert.equal(Math.round(nguBossStatsV1(numero - 1).xp), xp, "boss " + numero);
}

const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const bas = ui.slice(ui.indexOf('<div class="soreal-idle-reward-v8">'), ui.indexOf("j.bossBloqueRenaissance", ui.indexOf('<div class="soreal-idle-reward-v8">')));
assert.match(bas, /XP/);
assert.ok(!bas.includes("🪙") && !bas.includes("pieces"), "plus d'or affiché en bas de Fight Boss");

const runtime = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
assert.ok(!/pieces \+=\s*Math\.max\(\s*1,\s*Math\.round\(\s*recompensePiecesBossSorealIdle_\(\s*boss/.test(runtime), "un boss principal ne donne plus de « pièces »");
assert.ok(!runtime.includes("genererObjetBossSorealIdle_(\n            bossCombatIndex") && !runtime.includes("genererObjetBossSorealIdle_(\n            bossIndexNuke"), "un boss principal ne lâche plus d'objet");
assert.ok(!/recompenseBossActuel: \{[\s\S]{0,900}pieces:/.test(runtime), "la récompense annoncée ne contient plus de pièces");

console.log("idle-boss-reward-footer-v1: OK");
