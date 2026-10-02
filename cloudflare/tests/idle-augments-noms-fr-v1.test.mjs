import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { IDLE_NGU_AUGMENTATIONS } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-10-02) : « traduis le menu Augmentation, les titres des barres à monter : Safety Scissors etc. »
 * Chaque Augment affiche son nom français ; le moteur garde les noms du wiki.
 */
const src = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const debut = src.indexOf("const IDLE_NOMS_AUGMENTS_V1={");
assert.ok(debut > 0, "table des noms français");
const table = new Function(src.slice(debut, src.indexOf("};", debut) + 2) + "\nreturn IDLE_NOMS_AUGMENTS_V1;")();
for (const a of IDLE_NGU_AUGMENTATIONS) {
  assert.ok(table[a.id], a.id + " : nom français");
  assert.notEqual(table[a.id], a.name, a.id + " : traduit, pas le nom anglais du wiki");
}
assert.equal(table.scissors, "Ciseaux de sécurité");
assert.ok(src.includes("idleHtml_(IDLE_NOMS_AUGMENTS_V1[def.id]||def.name||def.id)"), "le titre de chaque barre utilise le nom français");
// Deuxième ligne d'un Augment : le nom de son Upgrade (wiki NGU Idle « Augmentations »), en français.
const d2 = src.indexOf("const IDLE_NOMS_UPGRADES_AUGMENTS_V1={");
assert.ok(d2 > 0, "table des noms d'Upgrades");
const upgrades = new Function(src.slice(d2, src.indexOf("};", d2) + 2) + "\nreturn IDLE_NOMS_UPGRADES_AUGMENTS_V1;")();
for (const a of IDLE_NGU_AUGMENTATIONS) {
  assert.ok(upgrades[a.upgrade.id], a.upgrade.id + " : nom français de l'Upgrade");
  assert.notEqual(upgrades[a.upgrade.id], a.upgrade.name);
}
assert.equal(upgrades.dangerScissors, "Ciseaux dangereux");
assert.ok(src.includes("IDLE_NOMS_UPGRADES_AUGMENTS_V1[def.upgrade&&def.upgrade.id]"), "la 2e ligne affiche le nom de l'Upgrade, plus « Upgrade »");
console.log("idle-augments-noms-fr-v1: OK");
