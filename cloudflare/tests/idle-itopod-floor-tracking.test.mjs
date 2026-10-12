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
  assert.equal(state.systems.tower.data.floor, 2);
  state = advanceIdleNguState(state, 5 * 10 * 3, ctx, Date.now());
  const d = state.systems.tower.data;
  assert.equal(d.floor, 2, "3 étages x 10 kills = un cycle complet, retour au départ");
  assert.equal(d.kills, 50 + 30);
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

// Bouton Auto (Norman, 2026-10-12) : un clic règle les étages sur le meilleur étage (optimal) ; règle du wiki : départ de 0 à « un étage sous le plus haut atteint », fin jusqu'à 1600 ; aucune montée automatique.
{
  let state = baseState();
  state = advanceIdleNguState(state, 1, ctx, Date.now());
  const optimal = state.systems.tower.data.optimalFloor;
  assert.ok(optimal > 5, "l'étage optimal est calculé (" + optimal + ")");
  // plus haut atteint au-dessus de l'optimal : un seul étage (départ = fin = optimal), aucune boucle, aucun changement d'étage
  Object.assign(state.systems.tower.data, { floor: 3, killsOnFloor: 4, highestFloor: optimal + 5, startFloor: null, endFloor: null });
  state = applyIdleNguAction(state, { action: "towerFloors", auto: true }, ctx, Date.now()).state;
  let d = state.systems.tower.data;
  assert.equal(d.startFloor, optimal);
  assert.equal(d.endFloor, optimal);
  assert.equal(d.floor, optimal, "placé sur le meilleur étage");
  const etages = new Set();
  for (let i = 0; i < 30; i++) {
    state = advanceIdleNguState(state, 7, ctx, Date.now());
    etages.add(state.systems.tower.data.floor);
  }
  assert.deepEqual([...etages], [optimal], "reste sur le meilleur étage : pas de montée ni de boucle");
  // plus haut atteint = optimal : le wiki limite le départ à un étage sous le plus haut → optimal-1 → optimal
  let s2 = baseState();
  s2 = advanceIdleNguState(s2, 1, ctx, Date.now());
  Object.assign(s2.systems.tower.data, { floor: 0, highestFloor: optimal, startFloor: null, endFloor: null });
  s2 = applyIdleNguAction(s2, { action: "towerFloors", auto: true }, ctx, Date.now()).state;
  assert.equal(s2.systems.tower.data.startFloor, optimal - 1, "départ au plus un étage sous le plus haut atteint (wiki)");
  assert.equal(s2.systems.tower.data.endFloor, optimal);
  assert.equal(s2.systems.tower.data.highestFloor, optimal, "aucun étage sauté : le plus haut ne change pas");
  // réglage manuel : le départ reste borné à un étage sous le plus haut (wiki)
  let s3 = baseState();
  Object.assign(s3.systems.tower.data, { floor: 14, highestFloor: 14, killsOnFloor: 0 });
  s3 = applyIdleNguAction(s3, { action: "towerFloors", start: 14, end: 14 }, ctx, Date.now()).state;
  assert.equal(s3.systems.tower.data.startFloor, 13, "départ borné à highestFloor - 1");
}
console.log("idle-itopod-floor-tracking: Auto OK");

// Lazy ITOPOD Floor Shifter (wiki ITOPOD, boutique 4G : « check your optimal floor after each kill, and adjust it ») : acheté + Auto choisi, les étages suivent l'étage optimal quand la puissance monte ; sans l'achat, ils restent où l'Auto les a mis.
{
  const faible = { adventurePower: 1e6, adventureToughness: 1e6, bosses: 30 };
  const forte = { adventurePower: 1e9, adventureToughness: 1e9, bosses: 30 };
  const prepare = (achete) => {
    let st = baseState();
    st.selloutShop = { purchases: achete ? { lazyItopodFloorShifter: 1 } : {}, unlockedEver: true };
    st = advanceIdleNguState(st, 1, faible, Date.now());
    Object.assign(st.systems.tower.data, { highestFloor: 500, floor: 0 });
    st = applyIdleNguAction(st, { action: "towerFloors", auto: true }, faible, Date.now()).state;
    return st;
  };
  for (const achete of [true, false]) {
    let st = prepare(achete);
    const avant = st.systems.tower.data.endFloor;
    assert.equal(st.systems.tower.data.startFloor, avant, "Auto : un seul étage (plus haut atteint bien au-dessus)");
    st = advanceIdleNguState(st, 5, forte, Date.now());
    const d = st.systems.tower.data;
    if (achete) {
      assert.ok(d.endFloor > avant, "avec le Shifter, la fin suit l'étage optimal plus haut (" + avant + " → " + d.endFloor + ")");
      assert.equal(d.startFloor, d.endFloor, "toujours un seul étage");
      assert.equal(d.floor, d.endFloor, "on est passé sur le nouvel étage optimal");
    } else {
      assert.equal(d.endFloor, avant, "sans le Shifter, l'étage ne bouge pas tout seul");
    }
  }
  // un réglage manuel coupe le suivi automatique
  let st = prepare(true);
  st = applyIdleNguAction(st, { action: "towerFloors", start: 3, end: 6 }, faible, Date.now()).state;
  assert.equal(st.systems.tower.data.autoOptimal, false);
  st = advanceIdleNguState(st, 5, forte, Date.now());
  assert.equal(st.systems.tower.data.endFloor, 6, "réglage manuel respecté, même avec le Shifter");
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
