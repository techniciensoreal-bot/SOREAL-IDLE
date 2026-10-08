import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-10-08) : « Sébastien a complété le set de la Grotte aux multiples choses, tout fusionné et tout boosté ; le bonus est en vert, il a eu la Magic mais pas les 300 EXP ».
 * Cause : l'EXP (et l'AP) de complétion d'un set est écrite dans adventure.permanent, puis versée dans les vraies monnaies par crediterRecompensesAventure -- appelée après un combat,
 * un titan ou le Daycare, mais PAS après l'Auto Merge / l'Auto Boost ni après un geste « inventoryAuto » (A / D + clic...) : un set complété ainsi ne payait que ses bonus de Magic / Énergie.
 */
const context = { bosses: 120, bestGold: 1e6, adventurePower: 1e9 };
const add = (s, definitionId, level) => applyIdleNguAction(s, { action: "adventure", adventure: { action: "addItem", definitionId, level } }, context, 1_000_000).state;

// Set de la Grotte (8 pièces, +300 EXP, Magic) : 7 pièces au niveau 100, la dernière obtenue en fusionnant deux armes (60 + 40).
let s = normalizeIdleNguState({}, context, 1_000_000);
s.currencies.experience = 0;
for (const slot of ["head", "chest", "legs", "boots", "ring", "amulet", "combat"]) s = add(s, `cave:${slot}`, 100);
assert.equal(s.adventure.completedSets.cave, undefined, "départ : set pas encore complété");
s = add(s, "cave:weapon", 60);
s = add(s, "cave:weapon", 40);
const armes = s.adventure.inventory.filter((o) => o.definitionId === "cave:weapon");
assert.equal(armes.length, 2);

// Geste « inventoryAuto » (D + clic = fusion) qui complète le set
const r = applyIdleNguAction(s, { action: "inventoryAuto", mode: "mergeAll", itemId: armes[0].id }, context, 1_000_000);
s = r.state;
assert.equal(s.adventure.completedSets.cave, true, "set complété par la fusion");
assert.equal(s.adventure.permanent.experience, 300, "récompense brute enregistrée");
assert.equal(s.currencies.experience, 300, "les 300 EXP du set sont versées dans la vraie monnaie (la Magic l'était déjà)");

// Le tick d'Auto Merge / Auto Boost verse lui aussi (garde de code : le tick est lancé par le temps, difficile à provoquer ici)
const src = readFileSync("cloudflare/src/idle-ngu-progression.js", "utf8");
assert.ok(src.includes("const avantAutoInventaire = photoRecompensesAventure(state);") && src.includes("crediterRecompensesAventure(state, avantAutoInventaire);"), "tick Auto Merge / Auto Boost");
console.log("idle-set-exp-auto-inventaire-v1: OK");
