import assert from "node:assert/strict";
import {
  idleAdventureAddItemV1,
  idleAdventureEquipItemV1,
  idleAdventureUnequipItemV1,
  idleAdventureItemAtLevelV47,
  idleAdventureEquipmentStatsV47,
  normalizeIdleAdventureStateV47,
  IDLE_SECOND_WEAPON_SLOTS_V1
} from "../src/idle-adventure-v47.js";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Seconde arme (Dual Wielding, 2026-09-25) : wiki Wishes 28 / 45, Builds, Evil Troll Challenge 4 / 6 ; source tierce player.ts :
 * ratio = 0,05 x (niveau 28 + niveau 45), appliqué à toutes les stats de la seconde arme.
 */
const ctx = { bosses: 300 };
const near = (a, b, m) => assert.ok(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)), `${m} : ${a} != ${b}`);

function etat(l28, l45, troll = 7) {
  const s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, 0);
  s.challenge.completionsTier.difficile.troll = troll;
  s.systems.wishes.unlocked = true;
  if (l28) s.systems.wishes.data.tracks[28] = { level: l28 };
  if (l45) s.systems.wishes.data.tracks[45] = { level: l45 };
  return normalizeIdleNguState(s, ctx, 0);
}
function donne(s, def, niveau) {
  const o = idleAdventureItemAtLevelV47(def, niveau);
  return idleAdventureAddItemV1(s.adventure, o);
}

// Ratio synchronisé : 0,05 x (28 + 45), plafonné à 1
assert.equal(etat(0, 0).adventure.dualWieldRatio, 0);
near(etat(4, 0).adventure.dualWieldRatio, 0.2, "4 niveaux du souhait 28");
near(etat(10, 10).adventure.dualWieldRatio, 1, "niveaux max des deux souhaits");
// Les souhaits exigent les Troll Challenges Evil 4 et 6 (page Wishes)
assert.equal(etat(3, 0, 3).adventure.dualWieldRatio, 0, "Troll Evil < 4 : souhait 28 verrouillé");
near(etat(3, 2, 4).adventure.dualWieldRatio, 0.15, "Troll Evil 4 : le 28 seul compte, le 45 attend le Troll Evil 6");
near(etat(3, 2, 6).adventure.dualWieldRatio, 0.25, "Troll Evil 6 : Improved Dual Wielding");
assert.throws(() => applyIdleNguAction(etat(0, 0, 3), { action: "setWishSlot", slot: 0, wish: "28" }, ctx, 1), /DIFFICULTE_REQUISE/);

// Équipement : la seconde arme n'est acceptée que dans son slot, et seulement une fois débloquée
{
  const bloque = etat(0, 0);
  const cutlass = donne(bloque, "pirate:cutlass", 50);
  const arme = donne(bloque, "forest:weapon", 20);
  assert.ok(IDLE_SECOND_WEAPON_SLOTS_V1.includes("cutlass"));
  assert.throws(() => idleAdventureEquipItemV1(bloque.adventure, cutlass.id, "weapon2"), /SECONDE_ARME_VERROUILLEE/);
  assert.throws(() => idleAdventureEquipItemV1(bloque.adventure, cutlass.id, "accessory"), /SLOT_INVALIDE/, "plus d'accessoire à 100 %");
  assert.throws(() => idleAdventureEquipItemV1(bloque.adventure, cutlass.id, "weapon"), /SLOT_INVALIDE/);

  const s = etat(6, 4); // ratio 0,5
  const c = donne(s, "pirate:cutlass", 50);
  const f = donne(s, "forest:weapon", 20);
  idleAdventureEquipItemV1(s.adventure, f.id, "weapon");
  const seule = idleAdventureEquipmentStatsV47(s.adventure);
  idleAdventureEquipItemV1(s.adventure, c.id, "weapon2");
  assert.equal(s.adventure.equipment.weapon2, c.id);
  const double = idleAdventureEquipmentStatsV47(s.adventure);
  near(double.power - seule.power, 0.5 * c.power, "Power de la seconde arme x ratio");
  near(double.toughness - seule.toughness, 0.5 * c.toughness, "Toughness de la seconde arme x ratio");
  near(double.hp - seule.hp, 0.5 * c.power * 3, "HP x ratio");
  // pas d'emplacement d'accessoire consommé
  assert.equal(s.adventure.equipment.accessories.length, 0);
  // Déséquipement
  idleAdventureUnequipItemV1(s.adventure, c.id);
  assert.equal(s.adventure.equipment.weapon2, "");
  near(idleAdventureEquipmentStatsV47(s.adventure).power, seule.power, "retour aux stats sans seconde arme");
}

// Une arme principale ordinaire peut aussi aller en seconde arme ; changer de slot la déplace
{
  const s = etat(10, 0);
  const a = donne(s, "forest:weapon", 20);
  idleAdventureEquipItemV1(s.adventure, a.id, "weapon");
  idleAdventureEquipItemV1(s.adventure, a.id, "weapon2");
  assert.equal(s.adventure.equipment.weapon, "");
  assert.equal(s.adventure.equipment.weapon2, a.id);
  idleAdventureEquipItemV1(s.adventure, a.id, "weapon");
  assert.equal(s.adventure.equipment.weapon2, "");
}

// Sauvegarde existante : une seconde arme rangée en accessoire par l'ancienne version est migrée vers le slot dédié (ou retirée si verrouillé)
{
  const s = etat(5, 0);
  const c = donne(s, "pirate:cutlass", 50);
  s.adventure.equipment.accessories = [c.id];
  const n = normalizeIdleAdventureStateV47(s.adventure);
  assert.deepEqual(n.equipment.accessories, []);
  assert.equal(n.equipment.weapon2, c.id);
  const v = etat(0, 0);
  const c2 = donne(v, "pirate:cutlass", 50);
  v.adventure.equipment.accessories = [c2.id];
  const n2 = normalizeIdleAdventureStateV47(v.adventure);
  assert.deepEqual(n2.equipment.accessories, []);
  assert.equal(n2.equipment.weapon2, "");
}

// Snapshot : le slot n'est annoncé qu'une fois débloqué
{
  const av = (s) => idleNguSnapshot(s, ctx, 0).adventure;
  assert.equal(av(etat(0, 0)).secondWeaponUnlocked, false);
  assert.equal(av(etat(2, 0)).secondWeaponUnlocked, true);
}
console.log("idle-dual-wield-second-weapon: OK");
