import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, rebirthIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";
import { idleAdventureSnapshotV47, normalizeIdleAdventureStateV47, applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";

/*
 * Re-verrouillage après Rebirth / défi (Norman, 2026-10-02). Wiki NGU, page Rebirths, « What do I lose when I rebirth? » : « Access to the Adventure,
 * Augmentation, Time Machine, and Blood Magic tabs until their related bosses are beaten. » Les zones d'Aventure se referment aussi tant que leur boss n'est
 * pas retué DANS CE RUN ; exception du wiki (page Evil difficulty) : « Normal zones remain unlocked at all times » en Evil/Sadistic.
 */
const T0 = 1_000_000_000;
const vieux = (bosses = 140) => {
  const s = normalizeIdleNguState({}, { bosses }, T0);
  s.systems.challenges.unlocked = true;
  s.records.highestBoss = bosses;
  s.records.totalRebirths = 10;
  for (const t of ["t2", "t3", "t4"]) s.adventure.titans[t] = Object.assign({}, s.adventure.titans[t], { kills: 1 });
  s.adventure.itemList = {};
  for (const sl of ["head", "chest", "legs", "boots", "weapon", "necklace", "meat"]) s.adventure.itemList["grb:" + sl] = { seen: true };
  s.challenge.bestMs = { basic: 1000 };
  s.difficultyPeaks = { normal: bosses };
  return s;
};
const ouverts = (s) => ["augmentations", "timeMachine", "bloodMagic"].map((id) => s.systems[id].unlocked);

// 1. Avec les boss du run : menus ouverts.
{
  const s = vieux();
  const r = normalizeIdleNguState(s, { bosses: 140 }, T0 + 1000);
  assert.deepEqual(ouverts(r), [true, true, true]);
}

// 2. Lancer un défi : les trois menus se referment, et restent fermés tant que le run n'a pas rebattu leur boss.
{
  let s = vieux();
  s = applyIdleNguAction(s, { action: "challenge", mode: "start", challenge: "basic" }, { bosses: 140 }, T0 + 5000).state;
  assert.deepEqual(ouverts(s), [false, false, false], "menus refermés par le lancement d'un défi");
  s = normalizeIdleNguState(s, { bosses: 0 }, T0 + 6000);
  assert.deepEqual(ouverts(s), [false, false, false], "toujours fermés au boss 0 du run");
  assert.throws(() => applyIdleNguAction(s, { action: "allocate", system: "augmentations", resource: "energy", value: 1 }, { bosses: 0 }, T0 + 7000), /SYSTEME_VERROUILLE/);
  s = normalizeIdleNguState(s, { bosses: 20 }, T0 + 8000);
  assert.deepEqual(ouverts(s), [true, false, false], "Augmentations rouvert au boss voulu du run, pas les autres");
  s = normalizeIdleNguState(s, { bosses: 40 }, T0 + 9000);
  assert.deepEqual(ouverts(s), [true, true, true], "tous rouverts quand les boss sont rebattus");
}

// 3. Un Rebirth normal fait de même.
{
  const s = rebirthIdleNguState(vieux(), { bosses: 140 }, T0 + 4 * 3600e3, {});
  assert.deepEqual(ouverts(s), [false, false, false]);
}

// 4. Zones d'Aventure : refermées en Normal tant que le boss n'est pas retué dans le run ; Normal toujours ouvertes en Evil.
{
  const adv = normalizeIdleAdventureStateV47({});
  const zones = (snap) => snap.zones.filter((z) => z.unlocked).map((z) => z.id);
  const run0 = idleAdventureSnapshotV47(adv, 0, "normal", { normal: 140 });
  assert.deepEqual(zones(run0), [], "boss 0 du run : plus aucune zone, Aventure incluse");
  const run8 = idleAdventureSnapshotV47(adv, 8, "normal", { normal: 140 });
  assert.deepEqual(zones(run8), ["safe", "tutorial", "sewers"], "boss 8 : seulement les zones dont le boss est retué dans ce run");
  const evil = idleAdventureSnapshotV47(adv, 0, "difficile", { normal: 140 });
  assert.ok(zones(evil).includes("sewers") && zones(evil).includes("chocolate"), "Evil : les zones Normal restent ouvertes (wiki)");
}
// Zone sélectionnée avant le Rebirth et maintenant fermée (Norman, 2026-10-02 : « plus de combat en Aventure ») : la sélection retombe sur la zone ouverte la plus
// avancée au lieu de bloquer chaque combat avec ZONE_VERROUILLEE.
{
  const adv = normalizeIdleAdventureStateV47({});
  adv.selectedZone = "forest";
  adv.lastCombatZone = "forest";
  const snap5 = idleAdventureSnapshotV47(adv, 5, "normal", {});
  assert.equal(snap5.selectedZone, "tutorial", "boss 5 : Forêt fermée, on retombe sur la Zone Tutoriel");
  assert.equal(snap5.lastCombatZone, "tutorial");
  const snap0 = idleAdventureSnapshotV47(adv, 0, "normal", {});
  assert.equal(snap0.selectedZone, "safe", "aucune zone de combat ouverte : Zone sûre");
  const snap20 = idleAdventureSnapshotV47(adv, 20, "normal", {});
  assert.equal(snap20.selectedZone, "forest", "zone ouverte : jamais touchée");
  const demarre = applyIdleAdventureActionV47(adv, { action: "startZoneFight" }, { bosses: 5, difficulty: "normal", difficultyPeaks: {}, stats: { power: 1000, hp: 1000, toughness: 1000, regen: 1 } }, T0);
  assert.equal(demarre.state.selectedZone, "tutorial", "le combat démarre dans la zone ouverte au lieu d'échouer");
  assert.equal(demarre.state.fight.active, true);
}
console.log("idle-relock-rebirth-v1: OK");
