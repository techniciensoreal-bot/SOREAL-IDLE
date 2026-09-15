import assert from "node:assert/strict";
import { idleRuntimeTestHooks } from "../src/idle-sqlite-runtime.js";

/*
 * Norman (2026-09-14), preuve par capture d'écran du vrai jeu NGU Idle :
 * "Current Energy Speed is 3,4, meaning the bar fills every 15 ticks."
 * Formule NGU vérifiée (wiki + capture) : ticksToFillBar = ceil(50 /
 * EnergySpeed), moteur à 50 ticks/seconde en base — ceil(50/3.4)=15 ✓.
 * Energy Speed est plafonnée à 50, où 1 seul tick suffit à remplir la
 * barre : 1000ms/50 = 20ms, l'intervalle le plus rapide possible dans le
 * vrai jeu, quelle que soit la production.
 *
 * SOREAL IDLE n'a pas de stat "Energy Speed" discrète : le tick est dérivé
 * d'une production continue (metaTickEnergieSorealIdle_), avec un plancher
 * `ENERGIE_TICK_MIN_MS` qui doit correspondre à ce même intervalle le plus
 * rapide possible. Il était fixé à 90ms — jusqu'à 4,5× plus lent que le
 * vrai jeu ne le permet en fin de partie, quelle que soit la production
 * (c'est précisément la préoccupation de Norman : "quand on va avoir 1
 * billion a générer, avec 1 tique par seconde, autant te dire que ça
 * n'ira pas.").
 */
const { CONFIG_SOREAL_IDLE, metaTickEnergieSorealIdle_ } = idleRuntimeTestHooks;

assert.equal(
  CONFIG_SOREAL_IDLE.ENERGIE_TICK_MIN_MS,
  20,
  "Le plancher de tick doit correspondre à l'intervalle le plus rapide possible du vrai jeu (1000ms/50 ticks par seconde au maximum d'Energy Speed), jamais un plancher arbitraire plus lent."
);

// --- À très haute production, le tick doit pouvoir descendre jusqu'à 20ms, jamais rester bloqué à l'ancien plancher de 90ms ---
{
  const tick = metaTickEnergieSorealIdle_(1e9);
  assert.equal(tick.dureeMs, 20, "À très haute production, la durée d'un tick doit atteindre le nouveau plancher de 20ms (ancien plancher fautif : 90ms).");
  assert.ok(tick.gain > 0, "Le gain par tick doit rester un entier positif même au plancher.");
}

// --- Basse production : le plancher ne doit jamais raccourcir un tick qui serait de toute façon plus long ---
{
  const tick = metaTickEnergieSorealIdle_(0.25);
  assert.equal(tick.dureeMs, 4000, "Une faible production ne doit jamais être affectée par le changement de plancher (4000ms > 20ms et > 90ms).");
}

console.log("idle-energy-tick-speed-floor: OK");
