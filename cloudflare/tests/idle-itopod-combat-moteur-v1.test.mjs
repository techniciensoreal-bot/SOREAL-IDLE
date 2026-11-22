import assert from "node:assert/strict";
import {
  IDLE_NGU_META_VERSION,
  IDLE_NGU_SAVE_SCHEMA,
  advanceIdleNguState,
  applyIdleNguAction
} from "../src/idle-ngu-progression.js";

/*
 * ITOPOD (NGU Idle build 1260, lu dans le code du jeu le 2026-11-16) : en ligne, les ennemis attaquent le joueur (premier coup à 1,8 s) ; un joueur qui ne tue pas assez vite perd des PV, meurt, repart de l'étage de départ
 * (le compteur de 10 kills n'est PAS remis à zéro) avec 0 PV. Hors ligne (synchro de 5 minutes ou plus) le jeu ne simule aucun combat : calcul par lots, aucun PV touché.
 */

function baseState(data) {
  return {
    version: IDLE_NGU_META_VERSION,
    saveSchema: IDLE_NGU_SAVE_SCHEMA,
    systems: { tower: { unlocked: true, active: true, data: Object.assign({ floor: 0, killsOnFloor: 0, highestFloor: 200, kills: 0, ppProgress: 0 }, data) } },
    currencies: { pp: 0 }
  };
}
const ctxDe = (power, toughness) => ({ adventurePower: power, adventureToughness: toughness, bosses: 30 });
const reglerEtages = (state, start, end, ctx) => applyIdleNguAction(state, { action: "towerFloors", start, end }, ctx, Date.now()).state;
const avancer = (state, secondes, pas, ctx) => {
  for (let t = 0; t < secondes; t += pas) state = advanceIdleNguState(state, pas, ctx, Date.now());
  return state;
};

// Le tirage du type d'ennemi est le seul hasard : on le fige (IA 0 = coup ordinaire) pour des résultats exacts.
const hasardInitial = Math.random;
Math.random = () => 0;

try {
  // --- Un coup suffit partout : aucun combat simulé, aucun PV conservé (calcul par lots inchangé) ---
  {
    const ctx = ctxDe(1e6, 1e6);
    const etat = avancer(reglerEtages(baseState(), 0, 2, ctx), 120, 20, ctx);
    const d = etat.systems.tower.data;
    assert.ok(d.kills > 0);
    assert.equal(d.hp, undefined, "aucun combat : pas de PV d'ITOPOD gardés");
    assert.equal(d.deaths, undefined);
  }

  // --- Étages à plusieurs coups mais joueur solide : les kills passent, les PV restent entre 0 et le maximum, aucune mort ---
  {
    const ctx = ctxDe(3000, 300);
    const depart = reglerEtages(baseState({ floor: 40 }), 40, 40, ctx); /* Appliquer ne déplace plus le joueur (alignement 2026-11-22) : il est posé à l'étage 40 */
    const etat = avancer(depart, 120, 5, ctx);
    const d = etat.systems.tower.data;
    assert.ok(d.kills >= 15, "2 coups = 2 s + 4 s de réapparition : environ 20 kills en 120 s, obtenu " + d.kills);
    assert.ok(Number.isFinite(d.hp) && d.hp > 0, "PV conservés pendant les combats");
    assert.ok(!d.deaths, "aucune mort");
    assert.equal(d.floor, 40);
  }

  // --- Joueur trop faible pour l'étage choisi : il meurt, retourne à l'étage de départ avec 0 PV ; le compteur de 10 kills est conservé ---
  {
    const ctx = ctxDe(1000, 10);
    const depart = reglerEtages(baseState({ floor: 50, killsOnFloor: 4, highestFloor: 200 }), 50, 60, ctx);
    const etat = avancer(depart, 120, 5, ctx);
    const d = etat.systems.tower.data;
    assert.ok(d.deaths >= 1, "le joueur est mort au moins une fois, obtenu " + d.deaths);
    assert.ok(d.floor >= 50 && d.floor <= 60);
    assert.ok(Number.isFinite(d.hp) && d.hp >= 0);
  }

  // --- Mort : retour à l'étage de départ, PV à 0, compteur de kills de l'étage inchangé ---
  {
    const ctx = ctxDe(1000, 10);
    // étage de départ 50, joueur placé à l'étage 58 avec 3 kills sur l'étage et peu de PV : la première synchro suffit à le faire mourir
    let etat = reglerEtages(baseState({ floor: 58, killsOnFloor: 3, highestFloor: 200 }), 50, 60, ctx);
    etat.systems.tower.data.floor = 58;
    etat.systems.tower.data.killsOnFloor = 3;
    etat.systems.tower.data.hp = 1;
    etat = advanceIdleNguState(etat, 6, ctx, Date.now());
    const d = etat.systems.tower.data;
    assert.equal(d.deaths, 1);
    assert.equal(d.floor, 50, "retour à l'étage de départ (itopodStart)");
    assert.equal(d.killsOnFloor, 3, "le compteur de kills de l'étage n'est pas remis à zéro");
    assert.ok(d.hp < 1000, "PV très bas juste après la mort (régénération pendant le délai de réapparition seulement)");
  }

  // --- Une synchro longue donne la même issue que des synchros courtes (le cycle est rejoué depuis son début, jamais perdu) ---
  {
    const ctx = ctxDe(3000, 300);
    const depart = reglerEtages(baseState({ floor: 40 }), 40, 40, ctx); /* Appliquer ne déplace plus le joueur (alignement 2026-11-22) : il est posé à l'étage 40 */
    const court = avancer(depart, 60, 3, ctx).systems.tower.data;
    const long = avancer(depart, 60, 60, ctx).systems.tower.data;
    assert.equal(court.kills, long.kills);
    assert.equal(court.floor, long.floor);
  }

  // --- Hors ligne (5 minutes ou plus) : aucun combat, aucun PV, calcul par lots comme avant ---
  {
    const ctx = ctxDe(1000, 10);
    const depart = reglerEtages(baseState({ floor: 50, killsOnFloor: 0, highestFloor: 200 }), 50, 60, ctx);
    const d = advanceIdleNguState(depart, 3600, ctx, Date.now()).systems.tower.data;
    assert.equal(d.hp, undefined);
    assert.equal(d.deaths, undefined);
    assert.ok(d.kills > 0);
  }
} finally {
  Math.random = hasardInitial;
}

console.log("idle-itopod-combat-moteur-v1: OK");
