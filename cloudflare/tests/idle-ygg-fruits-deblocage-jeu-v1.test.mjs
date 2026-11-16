import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Lu dans le jeu (FruitController::upgrade, build 1260, 2026-11-16) : Fruit of Rage = ITOPOD debloque ; Fruit of MacGuffin α = succes 145
 * (« Defeat WALDERP 's final form! ») ; Fruit of Quirks = Titan 6 vaincu. Evalue seulement tant que le fruit n'a jamais ete debloque.
 */
const ctx = { bosses: 100 };
const T0 = 1_000_000;
function neuf() {
  const s = normalizeIdleNguState({}, ctx, T0);
  s.systems.yggdrasil.unlocked = true;
  s.currencies.seeds = 1e12;
  return s;
}
const monter = (s, fruit) => applyIdleNguAction(s, { action: "upgradeYggFruit", fruit }, ctx, T0).state;
const visibles = (s) => idleNguSnapshot(s, ctx, T0).yggFruits.map((f) => f.id);

{
  const s = neuf();
  for (const f of ["rage", "macguffinAlpha", "quirks"]) {
    assert.throws(() => monter(s, f), /FRUIT_NON_DEBLOQUE/, f + " verrouille");
    assert.ok(!visibles(s).includes(f), f + " absent de la liste (anti-spoil)");
  }
}
{
  const s = neuf();
  s.systems.tower.unlocked = true;
  assert.ok(visibles(s).includes("rage"));
  assert.equal(monter(s, "rage").systems.yggdrasil.data.fruits.rage.tier, 1);
}
{
  const s = neuf();
  s.adventure.unlockFlags.walderpFinalDefeated = true;
  assert.ok(visibles(s).includes("macguffinAlpha"));
  assert.equal(monter(s, "macguffinAlpha").systems.yggdrasil.data.fruits.macguffinAlpha.tier, 1);
  const t = neuf();
  t.systems.achievements.data = { unlocked: { secretWalderpFinal: 1 } };
  assert.equal(monter(t, "macguffinAlpha").systems.yggdrasil.data.fruits.macguffinAlpha.tier, 1, "succes obtenu : debloque");
}
{
  const s = neuf();
  s.adventure.titans.t6 = { kills: 1, nextAt: 0, hiddenPanel: "" };
  assert.ok(visibles(s).includes("quirks"));
  assert.equal(monter(s, "quirks").systems.yggdrasil.data.fruits.quirks.tier, 1);
}

console.log("idle-ygg-fruits-deblocage-jeu-v1: OK");
