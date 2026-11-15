import assert from "node:assert/strict";
import { normalizeIdleNguState, idleNguResourceGenerationPerSecond } from "../src/idle-ngu-progression.js";

/* Lu dans le jeu (Energy::updateBar, build 1260, 2026-11-15) : la barre gagne vitesse / 50 par tick et se remplit en ceil(50 / vitesse) ticks : 50 / ceil(50 / vitesse) remplissages par seconde (la lecture continue du 2026-10-03 est remplacée : « exactement comme NGU Idle »). */
const s = normalizeIdleNguState({}, { bosses: 60 }, 1_000_000);
s.resources.energy.bars = 1;
const taux = (v) => { s.resources.energy.speed = v; return idleNguResourceGenerationPerSecond(s, "energy"); };
assert.equal(taux(31.9), 25, "31,9 : un remplissage tous les 2 ticks");
assert.equal(taux(24.9), 50 / 3, "24,9 : un remplissage tous les 3 ticks");
assert.ok(taux(25) > taux(24.9), "la vitesse monte par paliers de ticks entiers");
assert.equal(taux(0.2), 1, "vitesse minimale du jeu : 1");
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
  nu.resources.energy.speed = 24.9;   /* juste sous le palier de 25 : +2 % le fait passer de 3 à 2 ticks par remplissage */
  nu.resources.energy.bars = 1;
  const sans = idleNguResourceGenerationPerSecond(nu, "energy");
  nu.adventure = a;
  const avec = idleNguResourceGenerationPerSecond(nu, "energy");
  assert.ok(avec > sans && Math.abs(avec - 25) < 1e-9, "+2 % de vitesse d'énergie grâce à la pièce équipée : 24,9 x 1,02 = 25,4, un remplissage tous les 2 ticks");
}
console.log("idle-vitesse-generation-continue-v1 (équipement): OK");
