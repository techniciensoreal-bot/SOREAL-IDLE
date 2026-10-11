import assert from "node:assert/strict";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";
import { normalizeIdleNguState, applyIdleNguAction, idleNguEffectiveResourceStat } from "../src/idle-ngu-progression.js";

/* Norman (2026-10-11) : retirer une pièce qui donne du cap d'Energy est refusé si l'énergie placée dépasserait le nouveau cap : « Libère X d'énergie avant de retirer cette pièce ». */
function etatAvecCasque() {
  const state = normalizeIdleNguState({});
  let adv = normalizeIdleAdventureStateV47({});
  adv = applyIdleAdventureActionV47(adv, { action: "addItem", definitionId: "jake:head", level: 0 }, { bosses: 100 }, 1).state;
  const hat = adv.inventory.find((i) => i.definitionId === "jake:head");
  adv = applyIdleAdventureActionV47(adv, { action: "equip", itemId: hat.id, id: hat.id, slot: "head" }, { bosses: 100 }, 2).state;
  state.adventure = adv;
  return { state, hat };
}
const { state, hat } = etatAvecCasque();
assert.equal(state.adventure.equipment.head, hat.id, "casque équipé");
const capAvec = idleNguEffectiveResourceStat(state, "energy", "cap");
const capSans = idleNguEffectiveResourceStat(Object.assign({}, state, { adventure: applyIdleAdventureActionV47(state.adventure, { action: "unequip", itemId: hat.id, id: hat.id }, { bosses: 100 }, 3).state }), "energy", "cap");
assert.ok(capAvec > capSans, "le casque donne du cap");

// énergie placée juste sous le cap avec casque : retirer est refusé, avec le montant à libérer
const lourd = JSON.parse(JSON.stringify(state));
lourd.systems.wandoos.unlocked = true; lourd.systems.wandoos.allocation = { energy: capAvec };
assert.throws(
  () => applyIdleNguAction(lourd, { action: "adventure", adventure: { action: "unequip", itemId: hat.id, id: hat.id } }, {}, 10),
  /^Error: Libère .+ d'énergie avant de retirer cette pièce\.$/
);
assert.equal(lourd.adventure.equipment.head, hat.id, "rien n'a été retiré");

// énergie placée qui tient dans le cap sans casque : le retrait passe
const leger = JSON.parse(JSON.stringify(state));
leger.systems.wandoos.unlocked = true; leger.systems.wandoos.allocation = { energy: Math.floor(capSans / 2) };
const ok = applyIdleNguAction(leger, { action: "adventure", adventure: { action: "unequip", itemId: hat.id, id: hat.id } }, {}, 10);
assert.ok(ok, "retrait accepté");
console.log("idle-retrait-piece-cap-energie-v1: OK");
