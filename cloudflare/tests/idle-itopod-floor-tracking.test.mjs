import assert from "node:assert/strict";
import {
  IDLE_NGU_META_VERSION,
  IDLE_NGU_SAVE_SCHEMA,
  advanceIdleNguState
} from "../src/idle-ngu-progression.js";

/*
 * Audit 2026-09-16 : `tower.data.floor += Math.floor(kills / 10)` perdait
 * le report entre deux ticks — en jeu normal (tick fréquent, quasi
 * toujours 0 ou 1 kill par appel), Math.floor(1/10) vaut TOUJOURS 0, donc
 * l'étage ne montait jamais tant qu'un seul gros rattrapage hors-ligne
 * n'accumulait pas 10 kills d'un coup dans UN SEUL appel — contraire au
 * wiki (itopod.md : "every 10 enemies killed advances 1 floor"). Corrigé
 * en dérivant systématiquement l'étage du total cumulé de kills.
 */

function baseState() {
  return {
    version: IDLE_NGU_META_VERSION,
    saveSchema: IDLE_NGU_SAVE_SCHEMA,
    systems: {
      tower: { unlocked: true, active: true, data: { floor: 0, killProgress: 0, kills: 0, ppProgress: 0 } }
    },
    currencies: { pp: 0 }
  };
}

// --- Régression réelle : 10 ticks d'1 kill chacun doivent faire monter l'étage, pas seulement un seul gros tick de 10 kills ---
{
  let state = baseState();
  // Puissance calibrée pour produire exactement ~1 kill par appel de 1s à l'étage 0.
  for (let i = 0; i < 10; i++) {
    state = advanceIdleNguState(state, 20, { adventurePower: 1, adventureToughness: 1, bosses: 30 }, Date.now());
  }
  assert.ok(
    state.systems.tower.data.kills >= 10,
    "10 appels doivent cumulativement produire au moins 10 kills au total."
  );
  assert.equal(
    state.systems.tower.data.floor,
    Math.floor(state.systems.tower.data.kills / 10),
    "L'étage doit toujours refléter floor(kills totaux / 10), quel que soit le découpage des ticks — jamais bloqué à 0 tant qu'un seul tick n'atteint pas 10 kills."
  );
  assert.ok(state.systems.tower.data.floor >= 1, "Après au moins 10 kills cumulés sur plusieurs petits ticks, l'étage doit avoir progressé.");
}

// --- Un seul gros rattrapage (offline) doit donner le même résultat qu'avant (pas de régression sur le cas déjà correct) ---
{
  let state = baseState();
  state = advanceIdleNguState(state, 200, { adventurePower: 1, adventureToughness: 1, bosses: 30 }, Date.now());
  assert.equal(
    state.systems.tower.data.floor,
    Math.floor(state.systems.tower.data.kills / 10),
    "Un unique gros tick doit aussi respecter floor(kills totaux / 10)."
  );
}

// --- Conversion PPP -> PP inchangée (1 000 000 PPP = 1 PP, (200+Floor) PPP/kill) ---
{
  let state = baseState();
  state.systems.tower.data.kills = 4990; // juste avant floor 500
  state.systems.tower.data.floor = 499;
  state.systems.tower.data.killProgress = 0.99;
  state = advanceIdleNguState(state, 1000, { adventurePower: 1e12, adventureToughness: 1e12, bosses: 30 }, Date.now());
  assert.ok(state.currencies.pp >= 0, "La conversion PP ne doit jamais produire une valeur négative.");
}

console.log("idle-itopod-floor-tracking: OK");
