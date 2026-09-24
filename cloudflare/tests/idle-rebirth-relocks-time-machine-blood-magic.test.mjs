import assert from "node:assert/strict";
import { normalizeIdleNguState, advanceIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * 2026-09-24 -- audit de composition, page « Rebirths » (« What do I lose when I
 * rebirth? ») : « Access to the Adventure, Augmentation, Time Machine, and Blood
 * Magic tabs until their related bosses are beaten » (Time Machine : boss 30,
 * Blood Magic : boss 37 ; page Boss Fights). Le drapeau `unlocked` restait vrai
 * apres le Rebirth : la Time Machine produisait de l'Or et Blood Magic tournait
 * des le boss 1 du nouveau Rebirth.
 */
function etat() {
  const s = normalizeIdleNguState({}, { bosses: 100 }, 0);
  s.systems.timeMachine.unlocked = true;
  s.systems.bloodMagic.unlocked = true;
  s.systems.timeMachine.data.bestGoldThisRun = 1000;
  s.systems.timeMachine.data.highestBossEver = 100;
  s.resources.energy.cap = 1e9; s.resources.energy.current = 1e9; s.resources.magic.cap = 1e9; s.resources.magic.current = 1e9;
  s.currencies.gold = 1e12;
  s.systems.bloodMagic.allocation.magic = 1e6;
  s.systems.bloodMagic.data.activeRitual = "tack";
  return s;
}
function courir(bosses) {
  const s = etat();
  return advanceIdleNguState(s, 3600, { bosses }, 3600 * 1000);
}
const bas = courir(10);
assert.equal(bas.currencies.gold, 1e12, "boss 10 : la Time Machine ne produit pas, Blood Magic ne consomme pas d'Or");
assert.equal(bas.currencies.blood, 0);
const tm = courir(30);
assert.ok(tm.currencies.gold > 1e12, "boss 30 : la Time Machine produit");
const bm = courir(37);
assert.ok(bm.currencies.blood > 0, "boss 37 : Blood Magic produit du sang");
console.log("idle-rebirth-relocks-time-machine-blood-magic: OK");
