import assert from "node:assert/strict";
import { normalizeIdleNguState, advanceIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/*
 * 2026-09-24 -- audit de composition, page « Wandoos » (Boot-up) : « At the beginning of each rebirth, there is a
 * 1-hour boot-up process ... The speed increase is linear, and ranges from 0-100% speed ». Une fenetre simulee d'un
 * seul bloc (retour hors ligne) etait multipliee par la vitesse de la FIN de fenetre (surevaluation jusqu'a x2 sur
 * la premiere heure). On integre maintenant la rampe lineaire sur la fenetre.
 */
const ctx = { bosses: 58, bestGold: 1e6, adventurePower: 1e9 };
const T0 = 100_000_000;

function wandoos() {
  let s = normalizeIdleNguState({}, ctx, T0);
  s.adventure.unlockFlags.wandoos = true;
  s = normalizeIdleNguState(s, ctx, T0);
  s.runStartedAt = T0;
  s.resources.energy.cap = 1e9;
  s.resources.energy.current = 1e9;
  s = applyIdleNguAction(s, { action: "allocate", system: "wandoos", resource: "energy", value: 1e6 }, ctx, T0).state; /* 0,05 niveau/s a pleine vitesse */
  return s;
}
const total = (x) => x.systems.wandoos.data.dumpEnergyLevel + x.systems.wandoos.data.dumpEnergyProgress;

/* Un seul bloc de 30 min depuis le debut du run : integrale de la rampe = 0,25 x 1800 s x 0,05. */
{
  const un = advanceIdleNguState(wandoos(), 1800, ctx, T0 + 1800 * 1000);
  assert.ok(Math.abs(total(un) - 0.05 * 1800 * 0.25) < 1e-6, `bloc 30 min : ${total(un)}`);
  /* Meme resultat en petits pas de 1 minute. */
  let pas = wandoos();
  for (let i = 1; i <= 30; i += 1) pas = advanceIdleNguState(pas, 60, ctx, T0 + i * 60 * 1000);
  assert.ok(Math.abs(total(pas) - total(un)) / total(un) < 0.04, `pas de 1 min : ${total(pas)} vs bloc ${total(un)}`);
}
/* Bloc de 2 h : 1 h de rampe (0,5 x 3600) + 1 h a pleine vitesse = 0,05 x (1800 + 3600) s. */
{
  const un = advanceIdleNguState(wandoos(), 7200, ctx, T0 + 7200 * 1000);
  assert.ok(Math.abs(total(un) - 0.05 * (1800 + 3600)) < 1e-6, `bloc 2 h : ${total(un)}`);
}
console.log("idle-wandoos-boot-average: OK");
