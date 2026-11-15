import assert from "node:assert/strict";
import { perkBonusesV1 } from "../src/idle-perks-v1.js";

/*
 * QP des quêtes : les atouts DISTINCTS se multiplient (2026-11-15, mesuré dans le vrai jeu, build 1260) :
 * Major idle de base 50 avec Beast Butter (x2) : rien = 100, Better QP Rewards 50 niveaux (+10 %) + Fibonacci 233 (+10 %) = 121.
 * Un seul atout : 55 (50 x 1,10) pour chacun (Better QP Rewards 50, Fibonacci 233).
 */
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg} (obtenu ${a}, attendu ${b})`);
near(perkBonusesV1({}).qpEarningsMultiplier, 1, "aucun atout : x1");
near(perkBonusesV1({ 89: 50 }).qpEarningsMultiplier, 1.1, "Better QP Rewards 50 : x1,10");
near(perkBonusesV1({ 94: 233 }).qpEarningsMultiplier, 1.1, "Fibonacci 233 : x1,10");
near(perkBonusesV1({ 89: 50, 94: 233 }).qpEarningsMultiplier, 1.21, "les deux : x1,10 x x1,10 = x1,21 (121 pour 100)");
assert.equal(Math.floor(100 * perkBonusesV1({ 89: 50, 94: 233 }).qpEarningsMultiplier), 121);
console.log("idle-qp-atouts-multiplies-v1 : OK");
