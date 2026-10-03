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

/* L'équipement « Spécial : Energy Speed » joue sur la génération (Anneau dégoûtant des égouts : +2 %). Avec les anciens paliers par tick entier, ce bonus était invisible à la plupart des vitesses. */
{
  const { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47 } = await import("../src/idle-adventure-v47.js");
  let a = normalizeIdleAdventureStateV47({});
  a = applyIdleAdventureActionV47(a, { action: "addItem", definitionId: "sewers:ring", level: 0 }, { bosses: 100 }, 1).state;
  const bague = a.inventory.find((i) => i.definitionId === "sewers:ring");
  a = applyIdleAdventureActionV47(a, { action: "equip", id: bague.id, slot: "accessory" }, { bosses: 100 }, 1).state;
  const nu = normalizeIdleNguState({}, { bosses: 100 }, 0);
  nu.resources.energy.speed = 10;
  nu.resources.energy.bars = 1;
  const sans = idleNguResourceGenerationPerSecond(nu, "energy");
  nu.adventure = a;
  const avec = idleNguResourceGenerationPerSecond(nu, "energy");
  assert.ok(Math.abs(avec / sans - 1.02) < 1e-9, "+2 % de vitesse d'énergie grâce à la pièce équipée");
}
console.log("idle-vitesse-generation-continue-v1 (équipement): OK");
