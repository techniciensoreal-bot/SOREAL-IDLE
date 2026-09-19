import assert from "node:assert/strict";
import {
  normalizeIdleAdventureStateV47,
  applyIdleAdventureActionV47
} from "../src/idle-adventure-v47.js";

/*
 * Audit wiki NGU 2026-09-18, PISTE 2 : pages
 * ngu-idle.fandom.com/wiki/Tutorial_Zone et .../Training_(set) vérifiées
 * en direct (navigateur) -- "Items in Training (set): A Stick, Cloth Hat,
 * Cloth Shirt, Cloth Leggings, Cloth Boots". Avant ce correctif, item()
 * générait un nom générique inventé ("Training Set head", "Training Set
 * weapon", ...) au lieu du vrai nom wiki par pièce.
 */

const EXPECTED = {
  weapon: "Un bâton",
  head: "Chapeau en tissu",
  chest: "Chemise en tissu",
  legs: "Jambières en tissu",
  boots: "Bottes en tissu"
};

for (const [slot, expectedName] of Object.entries(EXPECTED)) {
  const s = normalizeIdleAdventureStateV47({});
  const r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: `training:${slot}`, level: 10 }, { bosses: 4 }, 1);
  const created = r.state.inventory.find((i) => i.definitionId === `training:${slot}`);
  assert.ok(created, `L'objet training:${slot} doit avoir été créé.`);
  assert.equal(
    created.name,
    expectedName,
    `wiki (Training_(set)) : le slot "${slot}" du set Training doit s'appeler "${expectedName}", pas un nom générique inventé.`
  );
}

console.log("idle-training-set-real-item-names: OK");
