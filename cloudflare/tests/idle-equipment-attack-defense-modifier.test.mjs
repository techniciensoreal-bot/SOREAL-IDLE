import assert from "node:assert/strict";
import { normalizeIdleNguState, idleNguBonuses } from "../src/idle-ngu-progression.js";
import { applyIdleAdventureActionV47, createIdleAdventureStateV47 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-18, deux captures d'écran du vrai NGU le même jour) :
 * 1) personnage neuf sans gear -> Attack/Defense Breakdown affiche
 *    "Equipment Modifier: x100%" (neutre).
 * 2) gear équipé (Power total +1, Toughness total +1) -> panneau
 *    "EQUIPMENT BONUSES" affiche "Player Stat Boosts: Attack: 1%,
 *    Defense: 1%".
 * Wiki NGU (page Adventure Mode, déjà cité idle-sqlite-runtime.js:9095-
 * 9097 et idle-adventure-power-not-from-basic-training.test.mjs) :
 * "for every point of Power/Toughness from your gear, you also get +1%
 * Attack/Defense" -- documenté depuis le 2026-09-14 mais jamais câblé
 * dans attackMultiplier/defenseMultiplier jusqu'à ce correctif.
 *
 * Ce test construit un état Aventure avec un objet équipé de Power/
 * Toughness connus (en fixant directement .power/.toughness sur l'objet
 * généré, même technique que idle-adventure-boost-merge-coffre.test.mjs,
 * pour ne pas dépendre du système de boost), puis vérifie que
 * idleNguBonuses().attackMultiplier/defenseMultiplier appliquent
 * EXACTEMENT +1%/point, chacun sur le bon axe (jamais croisé), et que
 * l'un ne "fuit" jamais dans l'autre via la base commune attackMultiplier.
 */

/*
 * forest:weapon porte tout le Power du set (t:0) et forest:head tout le
 * Toughness (p:0) -- cf. idleAdventureItemStatsMaxV1: weapon {p:160,t:0},
 * head {p:0,t:40} (audit piece-par-piece déjà en place, idle-adventure-
 * v47.js). cleanItem() (appelé à chaque normalizeIdleAdventureStateV47,
 * donc à chaque action, y compris "equip") clampe .power/.toughness au
 * plafond RÉEL de la pièce -- fixer .toughness sur une arme (plafond réel
 * 0) serait donc silencieusement ramené à 0 : chaque axe doit être testé
 * sur la pièce qui porte réellement cette stat sur le wiki.
 */
function equipItemWithStat(definitionId, slot, power, toughness) {
  let s = createIdleAdventureStateV47();
  let r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId, level: 50 }, { bosses: 17 }, 1);
  const item = r.state.inventory.find((i) => i.definitionId === definitionId);
  item.power = power;
  item.toughness = toughness;
  r = applyIdleAdventureActionV47(r.state, { action: "equip", id: item.id, slot }, { bosses: 17 }, 1);
  return r.state;
}
function equipWeaponWithStats(power, toughness) {
  if (power > 0 && toughness === 0) return equipItemWithStat("forest:weapon", "weapon", power, 0);
  if (toughness > 0 && power === 0) return equipItemWithStat("forest:head", "head", 0, toughness);
  if (power === 0 && toughness === 0) return equipItemWithStat("forest:weapon", "weapon", 0, 0);
  // Power et Toughness ensemble : une pièce de chaque.
  let s = createIdleAdventureStateV47();
  let r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "forest:weapon", level: 50 }, { bosses: 17 }, 1);
  const weapon = r.state.inventory.find((i) => i.definitionId === "forest:weapon");
  weapon.power = power;
  r = applyIdleAdventureActionV47(r.state, { action: "addItem", definitionId: "forest:head", level: 50 }, { bosses: 17 }, 1);
  const head = r.state.inventory.find((i) => i.definitionId === "forest:head");
  head.toughness = toughness;
  r = applyIdleAdventureActionV47(r.state, { action: "equip", id: weapon.id, slot: "weapon" }, { bosses: 17 }, 1);
  r = applyIdleAdventureActionV47(r.state, { action: "equip", id: head.id, slot: "head" }, { bosses: 17 }, 1);
  return r.state;
}

// --- Neutre sans équipement ---
{
  const state = normalizeIdleNguState(null, { bosses: 0 }, 0);
  const bonuses = idleNguBonuses(state);
  assert.equal(bonuses.attackMultiplier > 0, true);
  const baseline = bonuses.attackMultiplier;

  const state2 = normalizeIdleNguState(null, { bosses: 0 }, 0);
  state2.adventure = equipWeaponWithStats(0, 0);
  const bonuses2 = idleNguBonuses(state2);
  assert.ok(
    Math.abs(bonuses2.attackMultiplier - baseline) < 1e-9,
    "Sans Power/Toughness d'équipement, l'Equipment Modifier doit rester neutre (x100%)."
  );
}

// --- Power +1 (arme seule, toughness volontairement 0) -> +1% Attack, Defense inchangé ---
{
  const stateBase = normalizeIdleNguState(null, { bosses: 0 }, 0);
  const baseBonuses = idleNguBonuses(stateBase);

  const stateGeared = normalizeIdleNguState(null, { bosses: 0 }, 0);
  stateGeared.adventure = equipWeaponWithStats(1, 0);
  const gearedBonuses = idleNguBonuses(stateGeared);

  assert.ok(
    Math.abs(gearedBonuses.attackMultiplier / baseBonuses.attackMultiplier - 1.01) < 1e-9,
    "Power +1 depuis l'équipement doit multiplier Attack par exactement 1.01 (+1%)."
  );
  assert.ok(
    Math.abs(gearedBonuses.defenseMultiplier / baseBonuses.defenseMultiplier - 1) < 1e-9,
    "Power seul (Toughness=0) ne doit JAMAIS changer Defense -- l'Equipment Modifier ne doit pas fuiter d'un axe à l'autre via la base commune attackMultiplier."
  );
}

// --- Toughness +1 (armure seule, power 0) -> +1% Defense, Attack inchangé ---
{
  const stateBase = normalizeIdleNguState(null, { bosses: 0 }, 0);
  const baseBonuses = idleNguBonuses(stateBase);

  const stateGeared = normalizeIdleNguState(null, { bosses: 0 }, 0);
  stateGeared.adventure = equipWeaponWithStats(0, 1);
  const gearedBonuses = idleNguBonuses(stateGeared);

  assert.ok(
    Math.abs(gearedBonuses.defenseMultiplier / baseBonuses.defenseMultiplier - 1.01) < 1e-9,
    "Toughness +1 depuis l'équipement doit multiplier Defense par exactement 1.01 (+1%)."
  );
  assert.ok(
    Math.abs(gearedBonuses.attackMultiplier / baseBonuses.attackMultiplier - 1) < 1e-9,
    "Toughness seul (Power=0) ne doit JAMAIS changer Attack."
  );
}

// --- Cas exact du screenshot Norman : Power+1 ET Toughness+1 ensemble ---
{
  const stateBase = normalizeIdleNguState(null, { bosses: 0 }, 0);
  const baseBonuses = idleNguBonuses(stateBase);

  const stateGeared = normalizeIdleNguState(null, { bosses: 0 }, 0);
  stateGeared.adventure = equipWeaponWithStats(1, 1);
  const gearedBonuses = idleNguBonuses(stateGeared);

  assert.ok(Math.abs(gearedBonuses.attackMultiplier / baseBonuses.attackMultiplier - 1.01) < 1e-9);
  assert.ok(Math.abs(gearedBonuses.defenseMultiplier / baseBonuses.defenseMultiplier - 1.01) < 1e-9);
}

console.log("idle-equipment-attack-defense-modifier: OK");
