import assert from "node:assert/strict";
import { quirkBonusesV1, idleQuirkByIdV1 } from "../src/idle-quirks-v1.js";
import { normalizeIdleNguState, idleNguBonuses, advanceIdleNguState } from "../src/idle-ngu-progression.js";

/* Audit NGU 2026-09-23 : quirks ajoutés (coûts/plafonds/effets = tableau « Quirk Points » du wiki). */
assert.equal(idleQuirkByIdV1(22).cost, 500);
assert.equal(idleQuirkByIdV1(24).cost, 2000);
assert.equal(idleQuirkByIdV1(24).cap, 10);
assert.equal(idleQuirkByIdV1(47).bonus.r3PowerPct, 0.01);
assert.equal(idleQuirkByIdV1(68).bonus.r3CapPct, 0.005, "Resource 3 Cap Quirk II : 0,5 % par niveau");
assert.equal(idleQuirkByIdV1(70).bonus.itopodPppFlat, 10);
assert.equal(idleQuirkByIdV1(91).bonus.bloodGainPct, 0.01);
assert.equal(idleQuirkByIdV1(185).cost, 100000);

// banks : additifs avec les paliers I et II
{
  const b = quirkBonusesV1({ 20: 10, 21: 10, 22: 10, 23: 10, 24: 10 });
  assert.ok(Math.abs(b.atBankMultiplier - 1.25) < 1e-9, "5 paliers x 10 niveaux x 0,5 % = 25 %");
  const tm = quirkBonusesV1({ 25: 10, 27: 10 });
  assert.ok(Math.abs(tm.tmBankMultiplier - 1.10) < 1e-9);
}

// Resource 3 : multiplicateur lu par le moteur
{
  const s = normalizeIdleNguState({}, {}, 0);
  const sans = idleNguBonuses(s).r3PowerMultiplier;
  s.systems.quirks.data = { levels: { 47: 50, 67: 50 } };
  assert.ok(Math.abs(idleNguBonuses(s).r3PowerMultiplier / sans - (1 + 0.5 + 0.5)) < 1e-9, "50 x 1 % + 50 x 1 %");
}

// ITOPOD : +10 PPP de base par niveau du quirk 70
{
  const ctx = { bosses: 30, adventurePower: 1e6, adventureToughness: 1e6 };
  const construire = (levels) => {
    const s = normalizeIdleNguState({}, ctx, 0);
    s.systems.tower = { unlocked: true, active: true, data: { floor: 0, killProgress: 0, kills: 0, ppProgress: 0 } };
    s.currencies.pp = 0;
    if (levels) s.systems.quirks.data = { levels };
    return advanceIdleNguState(s, 6, ctx, 20_000).systems.tower.data.ppProgress;
  };
  const base = construire(null);
  const avec = construire({ 70: 10 });
  assert.ok(base > 0 && Math.abs(avec / base - (200 + 100) / 200) < 1e-9, "(200 + 10 x 10) / 200 par kill");
}

console.log("idle-quirks-banks-r3-ppp-blood: OK");
