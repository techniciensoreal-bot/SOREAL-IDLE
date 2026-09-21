import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_V47,
  applyIdleAdventureActionV47,
  idleAdventureEquipmentStatsV47
} from "../src/idle-adventure-v47.js";

/*
 * Audit 2026-09-13 (Norman) — wiki NGU vérifié directement (page Infinity
 * Cube) : "A Power and Toughness Boosts will award you 1% of its stats. A
 * Special boost will be split equally between Power and Toughness (0.5%
 * each)." + section Softcap : "you'll still get the full stat up to that
 * softcap, but the excess amount will give only a square root of that
 * surplus" (exemple chiffré du wiki : base 1000 + cube 1100 => 1010).
 *
 * Deux bugs réels trouvés en vérifiant le code contre le wiki (pas
 * seulement le rejet des boosts "special" déjà repéré par l'audit
 * précédent) :
 * 1. cube() ajoutait la force BRUTE du boost au lieu de 1% de cette force
 *    — un boost de force 100 donnait +100 au cube au lieu de +1.
 * 2. Aucun softcap n'existait : le cube s'additionnait linéairement au
 *    Power/Toughness total, sans jamais passer par la racine carrée du
 *    surplus au-delà de l'équipement+base.
 */
function baseState(inventory, cube) {
  return {
    version: IDLE_ADVENTURE_V47,
    inventory,
    equipment: { head: "", chest: "", legs: "", boots: "", weapon: "", accessories: [] },
    cube: Object.assign({ power: 0, toughness: 0, unlocked: true }, cube || {})
  };
}

// --- Boost Power/Toughness : 1% de la force, jamais la force brute ---
{
  const state = baseState([{ id: "b1", kind: "boost", boostType: "power", strength: 100 }]);
  const { state: after } = applyIdleAdventureActionV47(state, { action: "cube", boostId: "b1" });
  assert.equal(after.cube.power, 1, "Un boost Power de force 100 doit donner +1 au cube (1%), jamais +100.");
  assert.equal(after.cube.toughness, 0);
  assert.equal(after.inventory.length, 0, "Le boost doit être consommé.");
}

// --- Boost Special : split 0,5%/0,5% entre Power et Toughness ---
{
  const state = baseState([{ id: "b2", kind: "boost", boostType: "special", strength: 100 }]);
  const { state: after } = applyIdleAdventureActionV47(state, { action: "cube", boostId: "b2" });
  assert.equal(after.cube.power, 0.5, "Un boost Special de force 100 doit donner +0.5 Power (0.5%).");
  assert.equal(after.cube.toughness, 0.5, "...et +0.5 Toughness (0.5%), à parts égales.");
}

// --- Boost Special n'est plus rejeté (CUBE_BOOST_INVALIDE) ---
{
  const state = baseState([{ id: "b3", kind: "boost", boostType: "special", strength: 10 }]);
  assert.doesNotThrow(
    () => applyIdleAdventureActionV47(state, { action: "cube", boostId: "b3" }),
    "Un boost Special doit être accepté par le cube, conformément au wiki."
  );
}

// --- Softcap : exemple exact du wiki (base 1000, cube 1100 => contribution 1010) ---
{
  /*
   * Un objet équipé donnant exactement 1000 de Power, cube à 1100.
   * definitionId volontairement HORS catalogue (2026-09-16, migration
   * cleanItem) : depuis que cleanItem() plafonne power/toughness au
   * vrai niveau de l'objet (base×(1+niveau/100)) pour tout definitionId
   * réel, un vrai "training:head" (baseP=0) ramènerait ce power=1000
   * fictif à 0 avant même d'atteindre idleAdventureEquipmentStatsV47 —
   * ce test vise uniquement l'agrégation équipement+cube et son
   * softcap, jamais le plafonnement par objet (déjà couvert par
   * idle-adventure-v47.test.mjs).
   */
  const state = baseState(
    [{ id: "gear1", definitionId: "__test_fake_gear_v1__", kind: "equipment", level: 0, power: 1000, toughness: 0 }],
    { power: 1100, toughness: 0 }
  );
  state.equipment.head = "gear1";
  const stats = idleAdventureEquipmentStatsV47(state);
  assert.equal(stats.power, 2010, "Base 1000 + cube 1100 doit donner 1000 (plein jusqu'au softcap) + sqrt(100)=10 = 1010 de contribution, soit 2010 au total (comme l'exemple exact du wiki).");
}

// --- Softcap : sous le seuil, le cube s'additionne intégralement (pas de perte) ---
{
  const state = baseState(
    [{ id: "gear2", definitionId: "__test_fake_gear_v1__", kind: "equipment", level: 0, power: 1000, toughness: 0 }],
    { power: 300, toughness: 0 }
  );
  state.equipment.head = "gear2";
  const stats = idleAdventureEquipmentStatsV47(state);
  assert.equal(stats.power, 1300, "Sous le softcap, le cube doit s'additionner intégralement, sans racine carrée.");
}


// --- Contrat client historique : boost + toCube doit atteindre le même moteur ---
{
  const state = baseState([{ id: "b4", kind: "boost", boostType: "toughness", strength: 100 }]);
  const { state: after } = applyIdleAdventureActionV47(state, { action: "boost", boostId: "b4", toCube: true });
  assert.equal(after.cube.toughness, 1, "Le contrat Inventory boost+toCube doit être normalisé vers le Cube.");
  assert.equal(after.inventory.length, 0, "Le boost absorbé par le Cube ne doit pas réapparaître.");
}

console.log("idle-adventure-cube-boosts-softcap: OK");
