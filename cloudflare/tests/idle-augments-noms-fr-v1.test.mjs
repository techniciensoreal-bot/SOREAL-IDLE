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
console.log("idle-augments-noms-fr-v1: OK");
