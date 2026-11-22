import assert from "node:assert/strict";
import {
  IDLE_NGU_META_VERSION,
  IDLE_NGU_SAVE_SCHEMA,
  advanceIdleNguState,
  applyIdleNguAction
} from "../src/idle-ngu-progression.js";

/*
 * ITOPOD (wiki) : 10 kills = 1 étage, report du temps entre deux ticks, PP de première atteinte des
 * étages multiples de 10, étages de départ/fin (retour au départ après 10 kills sur l'étage de fin),
 * EXP + 1 AP tous les n kills selon le palier. Un kill = 4 s de respawn + 1 s par coup d'Idle Attack.
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
const ctx = { adventurePower: 1e6, adventureToughness: 1e6, bosses: 30 };

// 10 ticks de 20 s = 40 kills = 4 étages, le report de temps n'est jamais perdu
{
  let state = baseState();
  for (let i = 0; i < 10; i++) state = advanceIdleNguState(state, 20, ctx, Date.now());
  const d = state.systems.tower.data;
  assert.equal(d.kills, 40);
  assert.equal(d.floor, 4);
  assert.equal(d.killsOnFloor, 0);
}

// Ticks d'une seconde : le temps de kill s'accumule (5 s par kill)
{
  let state = baseState();
  for (let i = 0; i < 10; i++) state = advanceIdleNguState(state, 1, ctx, Date.now());
  assert.equal(state.systems.tower.data.kills, 2);
}

// Un gros rattrapage donne le même résultat qu'une suite de petits ticks
{
  const gros = advanceIdleNguState(baseState(), 200, ctx, Date.now()).systems.tower.data;
  assert.equal(gros.kills, 40);
  assert.equal(gros.floor, 4);
}

// PP de première atteinte : étage 10 = 1 PP, étage 100 = 10 PP ; jamais deux fois
{
  let state = baseState();
  Object.assign(state.systems.tower.data, { floor: 9, killsOnFloor: 9, highestFloor: 9, kills: 99 });
  state = advanceIdleNguState(state, 5, ctx, Date.now());
  assert.equal(state.systems.tower.data.floor, 10);
  assert.equal(state.currencies.pp, 1);
  state = advanceIdleNguState(state, 5, ctx, Date.now());
  assert.equal(state.currencies.pp, 1);
}

// Étages de départ/fin : après 10 kills sur l'étage de fin, retour à l'étage de départ
{
  let state = baseState();
  Object.assign(state.systems.tower.data, { floor: 5, killsOnFloor: 0, highestFloor: 20, kills: 50 });
  state = applyIdleNguAction(state, { action: "towerFloors", start: 2, end: 4 }, ctx, Date.now()).state;
  /* RÈGLE SOREAL (Norman, 2026-11-22) : Appliquer interrompt le combat et place le joueur sur l'étage de DÉPART, compteur à 0 (le jeu d'origine ne touche qu'à Départ / Fin). */
  assert.equal(state.systems.tower.data.floor, 2, "Appliquer place le joueur à l'étage de départ");
  assert.equal(state.systems.tower.data.killsOnFloor, 0);
  state = advanceIdleNguState(state, 5 * 10, ctx, Date.now());
  assert.equal(state.systems.tower.data.floor, 3, "10 kills à l'étage 2 puis étage suivant");
  assert.equal(state.systems.tower.data.kills, 60);
  state = advanceIdleNguState(state, 5 * 10 * 3, ctx, Date.now());
  const d = state.systems.tower.data;
  assert.equal(d.floor, 3, "30 kills : 3 -> 4 -> retour au départ 2 -> 3 (la fin 4 renvoie au départ)");
  assert.equal(d.kills, 90);
}

// EXP et AP : palier 1 = 1 EXP / 39 kills ; 39 kills donnent 1 AP
{
  let state = baseState();
  state.currencies.experience = 0;
  state.currencies.ap = 0;
  Object.assign(state.systems.tower.data, { floor: 0, killsOnFloor: 0, highestFloor: 0, kills: 0 });
  state = applyIdleNguAction(state, { action: "towerFloors", start: 0, end: 0 }, ctx, Date.now()).state;
  state = advanceIdleNguState(state, 5 * 39, ctx, Date.now());
  assert.equal(state.systems.tower.data.kills, 39);
  assert.ok(Math.abs(state.currencies.experience - 1) < 1e-9);
  assert.equal(state.currencies.ap, 1);
}

// Sans assez de puissance, un kill demande plusieurs coups : 0 kill en 20 s à 10 de Power
{
  const faible = advanceIdleNguState(baseState(), 20, { adventurePower: 1, adventureToughness: 1, bosses: 30 }, Date.now());
  assert.equal(faible.systems.tower.data.kills, 0);
}

console.log("idle-itopod-floor-tracking: OK");

// Bouton Optimal (ex-Auto, Norman 2026-10-12, aligné le 2026-11-22) : un clic = setOptimalFloor (étage optimal plafonné à « plus haut - 1 », départ = fin) ; aucune montée automatique, le joueur n'est pas déplacé.
{
  let state = baseState();
  Object.assign(state.systems.tower.data, { highestFloor: 500 });
  state = advanceIdleNguState(state, 1, ctx, Date.now());
  const optimal = state.systems.tower.data.optimalFloor;
  assert.ok(optimal > 5 && optimal < 500, "l'étage optimal est calculé (" + optimal + ")");
  Object.assign(state.systems.tower.data, { floor: 3, killsOnFloor: 4 });
  state = applyIdleNguAction(state, { action: "towerFloors", auto: true }, ctx, Date.now()).state;
  let d = state.systems.tower.data;
  assert.equal(d.startFloor, optimal);
  assert.equal(d.endFloor, optimal);
  assert.equal(d.floor, optimal, "règle SOREAL 2026-11-22 : Optimal place le joueur à l'étage de départ (= l'optimal)");
  assert.equal(d.killsOnFloor, 0);
  // plus haut atteint = optimal : le jeu plafonne l'étage optimal à plus haut - 1 (AdventureController::setOptimalFloor 179) et met départ = fin = cet étage
  let s2 = baseState();
  Object.assign(s2.systems.tower.data, { floor: 0, highestFloor: optimal });
  s2 = advanceIdleNguState(s2, 1, ctx, Date.now());
  assert.equal(s2.systems.tower.data.optimalFloor, optimal, "exposé = min(optimal, plus haut)");
  s2 = applyIdleNguAction(s2, { action: "towerFloors", auto: true }, ctx, Date.now()).state;
  assert.equal(s2.systems.tower.data.startFloor, optimal - 1, "départ = étage optimal plafonné à plus haut - 1");
  assert.equal(s2.systems.tower.data.endFloor, optimal - 1, "fin = départ : le jeu ne monte jamais seul vers un nouvel étage");
  assert.equal(s2.systems.tower.data.highestFloor, optimal, "aucun étage sauté : le plus haut ne change pas");
  // plus haut = 0 : l'optimal vaut 0, départ 0 et fin 1 (setOptimalFloor puis verifyItopodInputs), plus de mode auto null
  let s0 = baseState();
  s0 = advanceIdleNguState(s0, 1, ctx, Date.now());
  assert.equal(s0.systems.tower.data.optimalFloor, 0, "plus haut = 0 : calculateBestItopodLevel renvoie 0");
  s0 = applyIdleNguAction(s0, { action: "towerFloors", auto: true }, ctx, Date.now()).state;
  assert.equal(s0.systems.tower.data.startFloor, 0);
  assert.equal(s0.systems.tower.data.endFloor, 1);
  // réglage manuel : le départ reste borné à un étage sous le plus haut (wiki)
  let s3 = baseState();
  Object.assign(s3.systems.tower.data, { floor: 14, highestFloor: 14, killsOnFloor: 0 });
  s3 = applyIdleNguAction(s3, { action: "towerFloors", start: 14, end: 14 }, ctx, Date.now()).state;
  assert.equal(s3.systems.tower.data.startFloor, 13, "départ borné à highestFloor - 1");
  // Max : départ = plus haut - 1, la fin est gardée (setMaxFloor)
  let s4 = baseState();
  Object.assign(s4.systems.tower.data, { floor: 0, highestFloor: 40, startFloor: 0, endFloor: 100 });
  s4 = applyIdleNguAction(s4, { action: "towerMaxFloor" }, ctx, Date.now()).state;
  assert.equal(s4.systems.tower.data.startFloor, 39);
  assert.equal(s4.systems.tower.data.endFloor, 100);
}
console.log("idle-itopod-floor-tracking: Auto OK");

// Réglage par défaut du jeu (Adventure::.ctor) : départ 0, fin 20 ; les anciennes sauvegardes en « mode auto » (null) sont migrées, un réglage du joueur est conservé.
{
  let state = advanceIdleNguState(baseState(), 1, ctx, Date.now());
  assert.equal(state.systems.tower.data.startFloor, 0);
  assert.equal(state.systems.tower.data.endFloor, 20);
  let vieux = baseState();
  Object.assign(vieux.systems.tower.data, { startFloor: null, endFloor: null, highestFloor: 300, autoOptimal: true });
  vieux = advanceIdleNguState(vieux, 1, ctx, Date.now());
  assert.equal(vieux.systems.tower.data.startFloor, 0);
  assert.equal(vieux.systems.tower.data.endFloor, 20);
  let regle = baseState();
  Object.assign(regle.systems.tower.data, { startFloor: 30, endFloor: 31, highestFloor: 300 });
  regle = advanceIdleNguState(regle, 1, ctx, Date.now());
  assert.equal(regle.systems.tower.data.startFloor, 30);
  assert.equal(regle.systems.tower.data.endFloor, 31);
  // aucune montée vers l'optimal : le niveau reste dans [0 ; 20] puis retourne au départ
  let monte = baseState();
  Object.assign(monte.systems.tower.data, { highestFloor: 500 });
  const etages = new Set();
  for (let i = 0; i < 60; i++) { monte = advanceIdleNguState(monte, 50, ctx, Date.now()); etages.add(monte.systems.tower.data.floor); }
  assert.ok(Math.max(...etages) <= 20, "jamais au-delà de la fin 20");
}
console.log("idle-itopod-floor-tracking: défaut 0/20 OK");

// Lazy ITOPOD Floor Shifter : interrupteur INDÉPENDANT (Arbitrary.lazyITOPODOn), visible seulement avec l'achat ; après chaque kill : setOptimalFloor puis changeZone (niveau = départ, compteur 0).
{
  const faible = { adventurePower: 1e6, adventureToughness: 1e6, bosses: 30 };
  const forte = { adventurePower: 1e9, adventureToughness: 1e9, bosses: 30 };
  const prepare = (achete) => {
    let st = baseState();
    st.selloutShop = { purchases: achete ? { lazyItopodFloorShifter: 1 } : {}, unlockedEver: true };
    Object.assign(st.systems.tower.data, { highestFloor: 500, floor: 7, killsOnFloor: 3 });
    st = advanceIdleNguState(st, 1, faible, Date.now());
    return st;
  };
  assert.throws(() => applyIdleNguAction(prepare(false), { action: "towerShifter", enabled: true }, faible, Date.now()), /ACHAT_REQUIS/, "interdit sans l'achat");
  let st = prepare(true);
  assert.equal(st.systems.tower.data.shifterOn, false, "désactivé par défaut");
  st = applyIdleNguAction(st, { action: "towerShifter", enabled: true }, faible, Date.now()).state;
  assert.equal(st.systems.tower.data.shifterOn, true);
  st = advanceIdleNguState(st, 5, faible, Date.now());
  let d = st.systems.tower.data;
  const optFaible = d.optimalFloor;
  assert.equal(d.startFloor, optFaible, "le Shifter pose départ = fin = étage optimal");
  assert.equal(d.endFloor, optFaible);
  assert.equal(d.floor, optFaible, "niveau = départ (changeZone)");
  assert.equal(d.killsOnFloor, 0, "compteur remis à 0");
  st = advanceIdleNguState(st, 5, forte, Date.now());
  d = st.systems.tower.data;
  assert.ok(d.endFloor > optFaible, "la fin suit l'étage optimal quand la puissance monte (" + optFaible + " → " + d.endFloor + ")");
  assert.equal(d.floor, d.endFloor);
  // interrupteur coupé : plus de suivi, et un réglage manuel est respecté
  st = applyIdleNguAction(st, { action: "towerShifter", enabled: false }, faible, Date.now()).state;
  st = applyIdleNguAction(st, { action: "towerFloors", start: 3, end: 6 }, faible, Date.now()).state;
  const avant = st.systems.tower.data.endFloor;
  st = advanceIdleNguState(st, 5, forte, Date.now());
  assert.equal(st.systems.tower.data.endFloor, avant, "sans le Shifter activé, l'étage ne bouge pas tout seul");
  assert.equal(st.systems.tower.data.endFloor, 6);
}
console.log("idle-itopod-floor-tracking: Shifter OK");

// Adventure Advancer (Boutique AP) : à 20 s de run, depuis la Zone sûre, passage sur la zone normale la plus avancée ouverte ; une seule fois par run, jamais si une zone est déjà choisie.
{
  const ctxBoss = { adventurePower: 1e6, adventureToughness: 1e6, bosses: 60 };
  const run = 1_000_000;
  const mk = (achete, zone) => {
    const st = baseState();
    st.runStartedAt = run;
    st.selloutShop = { purchases: achete ? { adventureAdvancer: 1 } : {}, unlockedEver: true };
    st.adventure = { selectedZone: zone, fight: { active: false } };
    return st;
  };
  let st = advanceIdleNguState(mk(true, "safe"), 5, ctxBoss, run + 10_000);
  assert.equal(st.adventure.selectedZone, "safe", "avant 20 s : rien");
  st = advanceIdleNguState(st, 15, ctxBoss, run + 25_000);
  assert.notEqual(st.adventure.selectedZone, "safe", "à 20 s : une zone ouverte est choisie (" + st.adventure.selectedZone + ")");
  const choisie = st.adventure.selectedZone;
  st.adventure.selectedZone = "safe";
  st = advanceIdleNguState(st, 5, ctxBoss, run + 40_000);
  assert.equal(st.adventure.selectedZone, "safe", "une seule fois par run");
  let sans = advanceIdleNguState(mk(false, "safe"), 25, ctxBoss, run + 25_000);
  assert.equal(sans.adventure.selectedZone, "safe", "sans l'achat : rien");
  assert.ok(choisie, "zone choisie");
}
console.log("idle-itopod-floor-tracking: Advancer OK");
