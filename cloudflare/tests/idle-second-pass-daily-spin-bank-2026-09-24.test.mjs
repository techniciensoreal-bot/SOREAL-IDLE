import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { idleSelloutShopEffectActiveV1 } from "../src/idle-sellout-shop-v1.js";

/*
 * Audit de seconde passe (2026-09-24) : 4G's Sellout Shop « 7-Day Time Bank for Daily Spin! »
 * (« extend the maximum time banked by the daily spin system from 36 hours to 7 days », 100 000 AP).
 * Le plafond total (cadence de 24 h + retard banké) passe de 36 h à 7 jours : retard banké max 12 h -> 144 h.
 */
const ctx = { bosses: 100 };
const T0 = 1_000_000;
const HEURE = 3600000;

function tourApresRetard(retardHeures, achete) {
  const s = normalizeIdleNguState({}, ctx, T0);
  s.systems.dailySpin.unlocked = true;
  s.systems.dailySpin.data.totalSpins = 0;
  s.systems.dailySpin.data.readyAt = 1; // prêt depuis « 1 ms »
  if (achete) s.selloutShop.purchases.dailySpinTimeBank = 1;
  const now = 1 + retardHeures * HEURE;
  return applyIdleNguAction(s, { action: "collect", system: "dailySpin" }, ctx, now).result;
}

assert.equal(idleSelloutShopEffectActiveV1("dailySpinTimeBank"), true, "l'objet est achetable");

/* Sans l'achat : plafond de 12 h de retard banké (36 h au total), comme avant. */
assert.equal(tourApresRetard(6, false).bankedMs, 6 * HEURE);
assert.equal(tourApresRetard(100, false).bankedMs, 12 * HEURE);

/* Avec l'achat : jusqu'à 7 jours au total = 144 h de retard banké. */
assert.equal(tourApresRetard(100, true).bankedMs, 100 * HEURE, "100 h de retard : entièrement banké");
assert.equal(tourApresRetard(500, true).bankedMs, 144 * HEURE, "plafond 7 jours - 24 h");

/* Achat de bout en bout : 100 000 AP débités. */
{
  const s = normalizeIdleNguState({}, ctx, T0);
  s.currencies.ap = 150_000;
  s.selloutShop.unlockedEver = true;
  const r = applyIdleNguAction(s, { action: "sellShopBuy", itemId: "dailySpinTimeBank" }, ctx, T0 + 1000).state;
  assert.equal(r.selloutShop.purchases.dailySpinTimeBank, 1);
  assert.equal(r.currencies.ap, 50_000);
}

console.log("idle-second-pass-daily-spin-bank-2026-09-24 ok");
