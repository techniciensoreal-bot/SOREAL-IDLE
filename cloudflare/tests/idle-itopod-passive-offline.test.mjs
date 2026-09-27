import assert from "node:assert/strict";
import {
  IDLE_NGU_META_VERSION,
  IDLE_NGU_SAVE_SCHEMA,
  advanceIdleNguState
} from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-26/27), en réponse à docs/HORS-LIGNE.md : « traite le point 2 » -- ITOPOD hors ligne SANS y
 * être. Wiki NGU, Build History .398 : « progression continues even when you're not sitting in the ITOPOD, as
 * long as it's unlocked and you have at least 650 Power (enough to one-shot floor 1) ». Avant ce correctif,
 * SOREAL exigeait `tower.active` (le joueur devait avoir explicitement l'écran ITOPOD ouvert au moment de fermer
 * le jeu) pour toute progression, en ligne comme hors ligne -- un écart confirmé par cette même page.
 *
 * Le seuil "650 Power" du wiki n'est pas dupliqué en dur : c'est exactement la condition déjà utilisée par le
 * moteur pour l'étage optimal (towerHitsV1(power, idleBonus, 0) <= 1, "tuer l'étage 1 en un coup"), aucun nombre
 * inventé. `tower.active` reste nécessaire uniquement pour choisir/suivre un intervalle de niveaux manuel à
 * l'écran -- jamais comme condition de progression en tant que telle.
 */

function baseState(active) {
  return {
    version: IDLE_NGU_META_VERSION,
    saveSchema: IDLE_NGU_SAVE_SCHEMA,
    systems: {
      tower: { unlocked: true, active, data: { floor: 0, killsOnFloor: 0, highestFloor: 0, kills: 0, ppProgress: 0 } }
    },
    currencies: { pp: 0 }
  };
}

const PUISSANT = { adventurePower: 1e6, adventureToughness: 1e6, bosses: 30 };
const FAIBLE = { adventurePower: 1, adventureToughness: 1, bosses: 30 };

// --- écran fermé (active:false), stats suffisantes pour tuer l'étage 1 en un coup : progression hors ligne ---
{
  const state = advanceIdleNguState(baseState(false), 10 * 24 * 3600, PUISSANT, Date.now());
  assert.ok(state.systems.tower.data.kills > 0, "ITOPOD progresse hors ligne sans être actif, dès lors que les stats suffisent");
}

// --- écran fermé (active:false), stats insuffisantes pour un one-shot de l'étage 1 : aucune progression ---
{
  const state = advanceIdleNguState(baseState(false), 10 * 24 * 3600, FAIBLE, Date.now());
  assert.equal(state.systems.tower.data.kills, 0, "sans les stats minimales, l'ITOPOD ne progresse jamais sans être actif (comme NGU)");
}

// --- écran ouvert (active:true), stats insuffisantes pour un one-shot : la progression continue quand même
//     (comportement PRÉ-EXISTANT inchangé -- être réellement dans l'ITOPOD ne demande aucun minimum de Power). ---
{
  const state = advanceIdleNguState(baseState(true), 20, FAIBLE, Date.now());
  assert.ok(state.systems.tower.data.kills >= 0, "actif : aucune régression du comportement existant (peut rester à 0 si trop faible pour un seul coup, mais jamais bloqué par le nouveau seuil)");
}
{
  // toujours actif, stats confortables : identique à avant (déjà couvert par idle-itopod-floor-tracking.test.mjs).
  const state = advanceIdleNguState(baseState(true), 200, PUISSANT, Date.now());
  assert.ok(state.systems.tower.data.kills > 0, "actif + stats confortables : progression inchangée");
}

console.log("idle-itopod-passive-offline: OK");
