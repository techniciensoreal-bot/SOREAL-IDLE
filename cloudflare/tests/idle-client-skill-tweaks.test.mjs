import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import { readFileSync } from "node:fs";

/* 2026-09-23 (wiki Skills / Build Move Cooldowns) : cooldowns réduits par les specials « Move Cooldowns », Parry x3 avec Slimy, Idle Mode x1,8. */
const ui = lireUiComplet();
assert.ok(ui.includes("specials.moveCooldownPct"), "les Move Cooldowns de l'équipement réduisent les cooldowns");
assert.ok(ui.includes("completedSets.slimy)multiplier=3"), "Parry x3 avec le set Slimy");
assert.ok(ui.includes("specials.idleAttackMultiplier") || ui.includes("sp.idleAttackMultiplier"), "Idle Mode lit le multiplicateur serveur (x1,8)");
console.log("idle-client-skill-tweaks ok");
