import assert from "node:assert/strict";
import { normalizeIdleNguState, advanceIdleNguState } from "../src/idle-ngu-progression.js";

/* Norman (2026-10-13) : un joueur avait équipé un set complet niveau 69 sans recevoir le trophée « Wear a set of Helmet, Chest, Legs, Boots, and Weapon, all at level 69 » (secretLevel69, 30 BP). */
const SLOTS = ["head", "chest", "legs", "boots", "weapon"];
function etat(niveaux, equiper = SLOTS) {
  let s = normalizeIdleNguState({}, { bosses: 5 }, 1000);
  s.adventure.inventory = SLOTS.map((slot, i) => ({ id: "obj" + i, kind: "equipment", slot, type: slot, level: niveaux[i], power: 1, toughness: 1, hp: 0, regen: 0 }));
  s.adventure.equipment = Object.assign({}, s.adventure.equipment);
  equiper.forEach((slot) => { s.adventure.equipment[slot] = "obj" + SLOTS.indexOf(slot); });
  return s;
}
const obtenu = (s) => {
  const r = advanceIdleNguState(s, 0, { bosses: 5 }, 2000);
  return r.systems.achievements.data.unlocked.secretLevel69 !== undefined;
};
assert.equal(obtenu(etat([69, 69, 69, 69, 69])), true, "cinq pièces équipées au niveau 69 : trophée obtenu");
assert.equal(obtenu(etat([69, 69, 69, 69, 68])), false, "une pièce au niveau 68 : pas de trophée");
assert.equal(obtenu(etat([69, 69, 69, 69, 70])), false, "une pièce au niveau 70 : pas de trophée (« all at level 69 »)");
assert.equal(obtenu(etat([69, 69, 69, 69, 69], ["head", "chest", "legs", "boots"])), false, "arme non équipée : pas de trophée");
console.log("idle-achievement-level69-v1: OK");
