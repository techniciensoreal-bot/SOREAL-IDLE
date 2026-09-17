import assert from "node:assert/strict";
import { calculateIdleNguNextNumber } from "../src/idle-ngu-progression.js";
import { perkBonusesV1 } from "../src/idle-perks-v1.js";
import { quirkBonusesV1 } from "../src/idle-quirks-v1.js";

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * Wiki NGU local, page "SADISTIC difficulty", section "Fight boss and
 * number" : "Boss Power Bonus of rebirth NUMBER is based on 1.2^[boss
 * beaten]... this multiplier can be increased... through the unlocking
 * of the relevant Perks, Quirks and Wishes." Perks 157/158 (+0.0005 x2)
 * et Quirks 74/75 (+0.001 x2) sont additifs sur la base 1.20, jamais
 * composés multiplicativement, et jamais étendus à la borne "up to
 * x1.25" qui inclut des Wishes non construites.
 */

const noBonusBase = calculateIdleNguNextNumber({ difficulty: "extreme", bosses: 1, hasPreviousRun: false }).factors.currentBossFactor;
assert.ok(Math.abs(noBonusBase - 1.2) < 1e-9, "Sans perks/quirks, la base Sadistic doit rester exactement 1.20^1.");

const withBonus = calculateIdleNguNextNumber({ difficulty: "extreme", bosses: 1, hasPreviousRun: false, sadisticBossMultiplierBonus: 0.005 }).factors.currentBossFactor;
assert.ok(Math.abs(withBonus - 1.205) < 1e-9, "1.20 + 0.005 = 1.205, additif, jamais 1.20 x 1.005.");

// Evil/Normal ne doivent jamais recevoir ce bonus (mécanique documentée uniquement pour SADISTIC).
const evilUnaffected = calculateIdleNguNextNumber({ difficulty: "difficile", bosses: 1, hasPreviousRun: false, sadisticBossMultiplierBonus: 0.5 }).factors.currentBossFactor;
assert.ok(Math.abs(evilUnaffected - 1.5) < 1e-9, "Le bonus Sadistic ne doit jamais s'appliquer à la base Evil (1.5).");

// --- Agrégation perks + quirks ---
assert.ok(Math.abs(perkBonusesV1({ 157: 10, 158: 10 }).sadisticBossMultiplierBonus - 0.01) < 1e-9, "Perks 157+158 max (10 niveaux chacun x 0.0005) = 0.01.");
assert.ok(Math.abs(quirkBonusesV1({ 74: 10, 75: 10 }).sadisticBossMultiplierBonus - 0.02) < 1e-9, "Quirks 74+75 max (10 niveaux chacun x 0.001) = 0.02.");

console.log("idle-sadistic-boss-multiplier-perks-quirks: OK");
