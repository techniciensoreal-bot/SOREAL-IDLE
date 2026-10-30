import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { expShopSnapshotV1 as snap } from "../src/idle-ngu-actions.js";

/*
 * L'achat « Item Daycare ! » (daycareSlot1) ne dépendait que du système Daycare, lui-même débloqué
 * par cet achat : condition circulaire. Il est maintenant rattaché à l'Aventure (rayon Débuts).
 * Les slots 2 et 3 restent rattachés à Daycare (visibles une fois le slot 1 acheté).
 */
const ctx = { bosses: 100 };
const T0 = 1_000_000;
const fresh = (highestBoss) => {
  const s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, T0);
  s.currencies.experience = 1_000_000;
  s.records.highestBoss = highestBoss;
  return s;
};
const ids = (s) => snap(s).map((x) => x.id);

{
  const s = fresh(4);
  assert.equal(s.systems.daycare.unlocked, false);
  const v = ids(s);
  assert.ok(v.includes("daycareSlot1"), "slot 1 visible avec l'Aventure débloquée");
  assert.ok(!v.includes("daycareSlot2") && !v.includes("daycareSlot3"), "slots 2 et 3 cachés sans emplacement");
  const s1 = normalizeIdleNguState(applyIdleNguAction(s, { action: "buyExpShop", item: "daycareSlot1" }, ctx, T0).state, ctx, T0);
  s1.records.highestBoss = 4;
  assert.equal(s1.systems.daycare.unlocked, true);
  const v1 = ids(s1);
  assert.ok(v1.includes("daycareSlot2"), "slot 2 visible après l'achat du slot 1");
}
{
  const v = ids(fresh(3));
  assert.ok(!v.includes("daycareSlot1") && !v.includes("daycareSlot2") && !v.includes("daycareSlot3"), "Aventure verrouillée : rien de Daycare");
}
console.log("idle-daycare-achat-visible-v1 OK");
