import assert from "node:assert/strict";
import { applyIdleNguAction, normalizeIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-17) : "Dans EXP Shop, si on achete vitesse (2EXP) et
 * qu'on a 100 EXP on va passer à 98EXP. Si on reclique sur Vitesse, on
 * ne dépensera plus d'exp et l'achat se fera quand meme. pareille avec
 * puissance plafond et barres." — suspicion d'un exploit permettant
 * d'augmenter Vitesse/Puissance/Plafond/Barres gratuitement après le
 * premier achat.
 *
 * Investigation (même session) : lecture complète de la chaîne réelle
 * (bouton -> actionMetaIdleV130_ -> cloudflare-bridge.js -> Worker APP
 * -> SOREAL-TV (idleCall) -> Worker SOREAL-IDLE (Durable Object) ->
 * runSorealIdleOperation -> agirProgressionSorealIdle ->
 * applyIdleNguAction -> buyResource -> __idleCommit) n'a trouvé aucun
 * chemin qui applique le gain sans déduire le coût : buyResource()
 * (idle-ngu-progression.js) lie déduction et gain dans la même
 * fonction synchrone, sans early-return entre les deux, sur un
 * catalogue de coûts figé (Object.freeze, jamais recalculé). Ce test
 * verrouille ce comportement empiriquement, en rejouant exactement le
 * cycle production (mutation -> JSON.stringify -> JSON.parse, comme le
 * fait réellement idle-sqlite-runtime.js entre deux requêtes) : chaque
 * achat successif du MÊME bouton doit coûter le plein tarif, sans
 * exception, sur les 4 stats concernées (speed/power/cap/bars) et sur
 * les 3 ressources (energy/magic/r3).
 */

function freshState(experience) {
  const state = normalizeIdleNguState({}, {}, Date.now());
  state.currencies.experience = experience;
  state.systems.bloodMagic.unlocked = true;
  state.systems.hacks.unlocked = true;
  return state;
}

// Round-trip through JSON exactly like idle-sqlite-runtime.js does between two requests
// (STATS_JSON is stringified after every action, then re-parsed on the next one).
function roundTrip(state) {
  return JSON.parse(JSON.stringify(state));
}

for (const resource of ["energy", "magic", "r3"]) {
  for (const stat of ["speed", "power", "cap", "bars"]) {
    let state = freshState(1e9); // large EXP pool: never blocked by EXP_INSUFFISANTE mid-loop
    let previousExp = state.currencies.experience;
    let previousStat = state.resources[resource][stat];
    let firstCost = null;
    let firstGain = null;

    for (let click = 1; click <= 5; click++) {
      const stored = roundTrip(state);
      const before = stored.currencies.experience;
      const statBefore = stored.resources[resource][stat];

      const { state: nextState, result } = applyIdleNguAction(
        stored,
        { action: "buyResource", resource, stat },
        {},
        Date.now() + click
      );

      const spent = before - nextState.currencies.experience;
      const gained = nextState.resources[resource][stat] - statBefore;

      assert.ok(
        spent > 0,
        `${resource}.${stat} click #${click} devrait déduire de l'EXP (avant=${before}, après=${nextState.currencies.experience}).`
      );
      assert.ok(
        gained > 0,
        `${resource}.${stat} click #${click} devrait augmenter la stat (avant=${statBefore}, après=${nextState.resources[resource][stat]}).`
      );

      if (firstCost === null) {
        firstCost = spent;
        firstGain = gained;
      } else {
        assert.equal(
          spent,
          firstCost,
          `${resource}.${stat} click #${click} doit coûter EXACTEMENT le même EXP que le premier achat (coût plat, jamais recalculé) — free-purchase exploit si ce coût tombe à 0 après le premier clic.`
        );
        assert.equal(
          gained,
          firstGain,
          `${resource}.${stat} click #${click} doit accorder EXACTEMENT le même gain que le premier achat.`
        );
      }

      state = nextState;
    }

    assert.ok(
      state.currencies.experience < previousExp,
      `${resource}.${stat} : l'EXP totale doit avoir diminué après 5 achats successifs.`
    );
    assert.ok(
      state.resources[resource][stat] > previousStat,
      `${resource}.${stat} : la stat doit avoir augmenté après 5 achats successifs.`
    );
  }
}

// --- Une fois l'EXP réellement épuisée, un rachat doit être refusé (jamais silencieusement gratuit). ---
{
  let state = freshState(1); // 1 EXP : insuffisant pour le coût de 2 (energy/speed)
  const stored = roundTrip(state);
  assert.throws(
    () => applyIdleNguAction(stored, { action: "buyResource", resource: "energy", stat: "speed" }, {}, Date.now()),
    /EXP_INSUFFISANTE/,
    "Un achat sans assez d'EXP doit lever EXP_INSUFFISANTE, jamais réussir gratuitement."
  );
}

console.log("idle-exp-shop-repeated-purchase-charges-every-time: OK");
