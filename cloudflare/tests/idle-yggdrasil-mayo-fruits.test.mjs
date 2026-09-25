import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";
import { IDLE_YGG_MAYO_FRUITS_V1, idleYggMayoFruitBaseV1 } from "../src/idle-yggdrasil-extra-v1.js";

/*
 * Fruits de Mayo (2026-09-25) : wiki Yggdrasil « Nerdy Formulas » — progression du générateur associé = T^1.1 x 0.025 x Poop x MayoSpeed.
 * Disponibles uniquement avec le système Cards ; cachés (catalogue + boutique EXP) tant qu'il est verrouillé.
 */
const ctx = { bosses: 100 };
const near = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b)), `${m} : ${a} != ${b}`);

function pret(fruit, tier, cartes = true) {
  const s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, 0);
  s.systems.yggdrasil.unlocked = true;
  if (cartes) s.systems.cards.unlocked = true;
  const f = s.systems.yggdrasil.data.fruits[fruit];
  f.tier = tier;
  f.active = true;
  f.growthHours = tier;
  f.firstHarvestThisRun = false;
  return s;
}
const manger = (fruit, tier, cartes = true) =>
  applyIdleNguAction(pret(fruit, tier, cartes), { action: "useYggFruit", fruit, mode: "eat" }, ctx, 1);

assert.equal(IDLE_YGG_MAYO_FRUITS_V1.length, 6);
near(idleYggMayoFruitBaseV1(100, 1), Math.pow(100, 1.1) * 0.025, "base T^1.1 x 0.025");
near(idleYggMayoFruitBaseV1(100, 2), Math.pow(100, 1.1) * 0.05, "Poop");

// Progression créditée au bon générateur : partie entière ajoutée, reste conservé
for (const m of IDLE_YGG_MAYO_FRUITS_V1) {
  const avant = pret(m.id, 24);
  const r = applyIdleNguAction(avant, { action: "useYggFruit", fruit: m.id, mode: "eat" }, ctx, 1);
  const attendu = idleYggMayoFruitBaseV1(24, 1) * 1; // vitesse de mayo de base = 1
  const data = r.state.systems.cards.data;
  near(data.mayo[m.mayo] + data.mayoProgress[m.mayo], attendu, `${m.id} progression`);
  for (const autre of IDLE_YGG_MAYO_FRUITS_V1) {
    if (autre.mayo !== m.mayo) assert.equal((data.mayo[autre.mayo] || 0) + (data.mayoProgress[autre.mayo] || 0), 0, `${m.id} ne touche pas ${autre.mayo}`);
  }
}

// Verrouillé sans Cards : impossible à manger, absent du catalogue et de la boutique EXP
{
  const verrou = pret("angryMayo", 0, false);
  assert.throws(() => applyIdleNguAction(verrou, { action: "upgradeYggFruit", fruit: "angryMayo" }, ctx, 1), /FRUIT_NON_DEBLOQUE/);
  const s = pret("angryMayo", 0, false);
  const snap = idleNguSnapshot(s, ctx, 1);
  assert.equal(snap.yggFruits.some((f) => /mayo/i.test(f.id)), false, "catalogue de fruits sans mayo");
  assert.equal(JSON.stringify(snap).includes("Mayo Auto-Activate"), false, "boutique EXP sans Auto-Activate de mayo");
  const avecCartes = idleNguSnapshot(pret("angryMayo", 0, true), ctx, 1);
  assert.equal(avecCartes.yggFruits.filter((f) => /mayo/i.test(f.id)).length, 6);
}
console.log("ok idle-yggdrasil-mayo-fruits");
