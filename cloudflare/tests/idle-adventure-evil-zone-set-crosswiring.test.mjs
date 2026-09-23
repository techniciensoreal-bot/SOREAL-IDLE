import assert from "node:assert/strict";
import {
  advanceIdleNguState,
  normalizeIdleNguState,
  idleNguBonuses,
  IDLE_NGU_META_VERSION,
  IDLE_NGU_SAVE_SCHEMA
} from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-18) : "il faut tout faire" (équipement des 17 zones
 * Evil/Sadistic). Deux bonus de complétion de set traversent le pont déjà
 * établi state.adventure.setRewards.* -> idle-ngu-progression.js (même
 * schéma que setRewards.diggerSlot -> availableDiggerSlots) :
 * - Pretty Pink Princess (set) : "Gain 10% more PP" (ITOPOD).
 * - Party (set) : "+5% Total Diggers Level Bonus" (Gold Diggers,
 *   comblant le gap explicitement documenté dans diggerGlobalBonus()).
 */

// --- Pretty Pink Princess : +10% PP ITOPOD ---
{
  function baseState(itopodPpPct) {
    const state = normalizeIdleNguState({}, {}, Date.now());
    state.systems.tower = { unlocked: true, active: true, data: { floor: 0, killProgress: 0, kills: 0, ppProgress: 0 } };
    state.currencies.pp = 0;
    state.adventure.setRewards.itopodPpPct = itopodPpPct;
    return state;
  }
  const oneKill = (itopodPpPct) => advanceIdleNguState(baseState(itopodPpPct), 6, { adventurePower: 1e6, adventureToughness: 1e6, bosses: 30 }, Date.now());

  const withoutBonus = oneKill(0);
  assert.equal(withoutBonus.systems.tower.data.kills, 1, "Sanity : la calibration doit produire exactement 1 kill.");
  assert.equal(withoutBonus.systems.tower.data.ppProgress, 200, "Sans le set, (200 + floor 0) x 1 kill = 200.");

  const withBonus = oneKill(.10);
  assert.ok(Math.abs(withBonus.systems.tower.data.ppProgress - 220) < 1e-9, "Avec Pretty Pink Princess (set) complet (+10% PP), 200 x 1.10 = 220.");
}

// --- Party : +5% Total Diggers Level Bonus (additif, cf. idle-digger-global-bonus-additive-v1.test.mjs) ---
{
  const state = normalizeIdleNguState({}, {}, Date.now());
  state.systems.diggers.unlocked = true;
  state.systems.diggers.data.diggers.drop.maxLevel = 100;
  const withoutSet = idleNguBonuses(state).diggerGlobalBonus;
  assert.ok(Math.abs(withoutSet - 1.05) < 1e-9, "Sans le set Party, seule la formule par niveaux s'applique (100 niveaux x 0.05% = 5%).");

  state.adventure.setRewards.diggerGlobalBonusPct = 5;
  const withSet = idleNguBonuses(state).diggerGlobalBonus;
  assert.ok(Math.abs(withSet - 1.10) < 1e-9, "Wiki (Gold Diggers, \"Global Digger Bonus\") : le bonus de Party (set) s'ADDITIONNE (1 + 5% + 5% = 1.10), jamais ne se multiplie.");
}

console.log("idle-adventure-evil-zone-set-crosswiring: OK");
