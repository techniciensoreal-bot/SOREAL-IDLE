import assert from "node:assert/strict";
import { normalizeIdleNguState, idleNguResourceGenerationPerSecond } from "../src/idle-ngu-progression.js";

/* Norman (2026-10-03) : « Chaque achat de vitesse réduit un petit peu le temps nécessaire pour générer la ressource » : plus de paliers par tick entier. */
const s = normalizeIdleNguState({}, { bosses: 60 }, 1_000_000);
s.resources.energy.bars = 1;
const taux = (v) => { s.resources.energy.speed = v; return idleNguResourceGenerationPerSecond(s, "energy"); };
assert.equal(taux(31.9), 31.9);
assert.ok(taux(32) > taux(31.9), "chaque achat de +0,1 augmente la production, même au-delà de 25");
assert.equal(taux(50), 50, "50 = un remplissage par tick");
console.log("idle-vitesse-generation-continue-v1: OK");
