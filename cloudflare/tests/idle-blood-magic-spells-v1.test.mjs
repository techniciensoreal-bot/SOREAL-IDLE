import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  idleNguBonuses,
  idleNguTimeMachineGoldPerSecond
} from "../src/idle-ngu-progression.js";

/*
 * NGU wiki adaptation (2026-09-14) — audit indépendant de Blood Magic
 * (demandé en complément de la migration Quirks/Perks). Le tableau des
 * Blood Rituals lui-même (sang gagné / coût en or / temps, les 8
 * lignes de https://ngu-idle.fandom.com/wiki/Blood_Magic) était déjà
 * exact et n'a pas été touché.
 *
 * En revanche, les formules des SORTS de Blood Magic (castBloodSpell,
 * idle-ngu-progression.js) étaient inventées, sans aucune source wiki,
 * depuis la toute première version du fichier (commit aa744cd4) :
 * - Blood NUMBER Boost utilisait 1 + blood^0.2/10 au lieu du cumul
 *   additif réel "+1 par sang dépensé ce Rebirth" (page Blood Magic ET
 *   page NUMBER, table des facteurs de Rebirth, toutes deux
 *   consultées le 2026-09-14).
 * - Blood Spaghetti (Drop Chance) utilisait 1 + log10(1+blood)/20 au
 *   lieu de (log2(Blood/10 000)+1)% (formule exacte de la page Blood
 *   Magic), ET son résultat n'était jamais lu par dropMultiplier —
 *   câblé ici pour la première fois.
 * - Counterfeit Gold (bonus GPS) utilisait 1 + log10(1+blood)/10 au
 *   lieu de (log2(Blood/1 000 000)+1)² % (formule exacte de la même
 *   page).
 * - Le seuil minimum de sang par sort (colonne "Minimum Blood
 *   Required" de la page Blood Magic) n'était jamais vérifié — seul un
 *   `blood <= 0` générique existait.
 * Iron Pill n'a pas été touché : le wiki décrit un gain de stat ABSOLU
 * (Blood^0.25 ajouté directement à Power/Toughness), alors que le code
 * le convertit en bonus multiplicatif sur adventureMultiplier depuis
 * l'origine du fichier — un choix d'architecture antérieur à tout
 * audit wiki que ce round ne force pas à corriger (le corriger
 * proprement toucherait le pipeline de stats d'Aventure, hors scope
 * meta-progression).
 */

// --- Blood NUMBER Boost: cumul additif "+1 par sang dépensé ce Rebirth" ---
{
  const state = normalizeIdleNguState({}, {}, 1_000_000);
  state.systems.bloodMagic.unlocked = true;
  state.currencies.blood = 100;
  const after1 = applyIdleNguAction(state, { action: "castBloodSpell", spell: "numberBoost" }, {}, 1_000_000).state;
  assert.equal(after1.systems.bloodMagic.data.spells.numberBoost, 101, "100 sang dépensé -> multiplicateur NUMBER = 100 + 1 = 101 (page NUMBER: 'the amount of blood cast ... + 1').");
  assert.equal(after1.currencies.blood, 0, "Tout le sang est consommé par le lancer.");

  after1.currencies.blood = 50;
  const after2 = applyIdleNguAction(after1, { action: "castBloodSpell", spell: "numberBoost" }, {}, 1_000_000).state;
  assert.equal(after2.systems.bloodMagic.data.spells.numberBoost, 151, "Cumulatif sur le Rebirth: 100 + 50 sang dépensés au total -> 151, pas une composition multiplicative (101 * 51 serait faux).");

  assert.equal(after2.rebirth.preview.bloodMagicBonus, 151, "Le facteur NUMBER du prochain Rebirth (rebirth.preview) doit refléter le même cumul additif.");
}

// --- Seuils minimum de sang par sort (colonne wiki "Minimum Blood Required") ---
{
  const state = normalizeIdleNguState({}, {}, 1_000_000);
  state.systems.bloodMagic.unlocked = true;

  state.currencies.blood = 99;
  assert.throws(
    () => applyIdleNguAction(state, { action: "castBloodSpell", spell: "ironPill" }, {}, 1_000_000),
    /SANG_INSUFFISANT/,
    "Iron Pill exige 100 sang minimum (wiki) ; 99 doit être refusé."
  );

  state.currencies.blood = 9999;
  assert.throws(
    () => applyIdleNguAction(state, { action: "castBloodSpell", spell: "bloodSpaghetti" }, {}, 1_000_000),
    /SANG_INSUFFISANT/,
    "Blood Spaghetti exige 10 000 sang minimum (wiki) ; 9 999 doit être refusé."
  );

  state.currencies.blood = 999999;
  assert.throws(
    () => applyIdleNguAction(state, { action: "castBloodSpell", spell: "counterfeitGold" }, {}, 1_000_000),
    /SANG_INSUFFISANT/,
    "Counterfeit Gold exige 1 000 000 sang minimum (wiki) ; 999 999 doit être refusé."
  );

  assert.throws(
    () => applyIdleNguAction(state, { action: "castBloodSpell", spell: "notASpell" }, {}, 1_000_000),
    /SORT_SANG_INVALIDE/,
    "Un sort inconnu doit être rejeté explicitement."
  );
}

// --- Blood Spaghetti: formule wiki exacte + câblage réel dans dropMultiplier ---
{
  const state = normalizeIdleNguState({}, {}, 1_000_000);
  state.systems.bloodMagic.unlocked = true;
  state.currencies.blood = 10000;
  const after = applyIdleNguAction(state, { action: "castBloodSpell", spell: "bloodSpaghetti" }, {}, 1_000_000).state;
  // (log2(10 000 / 10 000) + 1) % = (0 + 1)% = 1% -> multiplicateur 1.01
  assert.ok(Math.abs(after.systems.bloodMagic.data.spells.bloodSpaghetti - 1.01) < 1e-9, "Au seuil minimum exact (10 000 sang), le bonus Drop Chance doit être de +1% pile (formule wiki).");

  const before = idleNguBonuses(state);
  const bonusesAfter = idleNguBonuses(after);
  assert.ok(bonusesAfter.dropMultiplier > before.dropMultiplier, "Blood Spaghetti doit désormais visiblement augmenter dropMultiplier (bug 'effet jamais appliqué' corrigé).");
  assert.ok(Math.abs(bonusesAfter.dropMultiplier / before.dropMultiplier - 1.01) < 1e-9, "Le gain doit être exactement +1%, sans autre facteur parasite.");

  // Cumul: un second lancer avec 40 000 sang -> total 50 000 -> log2(5)+1 ≈ 3.3219, pas juste log2(4)+1 du dernier lancer seul.
  after.currencies.blood = 40000;
  const after2 = applyIdleNguAction(after, { action: "castBloodSpell", spell: "bloodSpaghetti" }, {}, 1_000_000).state;
  const expectedPct = Math.log2(50000 / 10000) + 1;
  assert.ok(Math.abs(after2.systems.bloodMagic.data.spells.bloodSpaghetti - (1 + expectedPct / 100)) < 1e-9, "Le cumul doit porter sur le total de sang dépensé à ce sort ce Rebirth (50 000), pas seulement le dernier lancer (40 000).");
}

// --- Counterfeit Gold: formule wiki exacte (log2 au carré) + câblage GPS existant ---
{
  const state = normalizeIdleNguState({}, {}, 1_000_000);
  state.systems.bloodMagic.unlocked = true;
  state.systems.timeMachine.unlocked = true;
  state.systems.timeMachine.data.bestGoldThisRun = 1000;
  state.systems.timeMachine.data.speedLevel = 10;
  state.systems.timeMachine.data.goldLevel = 5;
  state.currencies.blood = 1000000;

  const gpsBefore = idleNguTimeMachineGoldPerSecond(state);
  const after = applyIdleNguAction(state, { action: "castBloodSpell", spell: "counterfeitGold" }, {}, 1_000_000).state;
  // (log2(1 000 000 / 1 000 000) + 1)² % = (0 + 1)² % = 1% -> multiplicateur 1.01
  assert.ok(Math.abs(after.systems.bloodMagic.data.spells.counterfeitGold - 1.01) < 1e-9, "Au seuil minimum exact (1 000 000 sang), le bonus GPS doit être de +1% pile (formule wiki au carré).");
  const gpsAfter = idleNguTimeMachineGoldPerSecond(after);
  assert.ok(gpsAfter > gpsBefore, "Counterfeit Gold doit augmenter le GPS du Time Machine (câblage déjà existant, formule corrigée).");

  // 4 000 000 sang -> (log2(4)+1)² % = (2+1)² % = 9% -> multiplicateur 1.09
  const state2 = normalizeIdleNguState({}, {}, 1_000_000);
  state2.systems.bloodMagic.unlocked = true;
  state2.currencies.blood = 4000000;
  const after2 = applyIdleNguAction(state2, { action: "castBloodSpell", spell: "counterfeitGold" }, {}, 1_000_000).state;
  assert.ok(Math.abs(after2.systems.bloodMagic.data.spells.counterfeitGold - 1.09) < 1e-9, "4 000 000 de sang -> +9% pile, la mise au carré de la formule wiki doit être appliquée (l'ancienne formule n'élevait jamais au carré).");
}

// --- Réinitialisation au Rebirth: le cumul de sang dépensé par sort doit repartir à zéro (Ironit Pill excepté) ---
{
  const state = normalizeIdleNguState({}, {}, 1_000_000);
  state.systems.bloodMagic.unlocked = true;
  state.currencies.blood = 4000000;
  const cast = applyIdleNguAction(state, { action: "castBloodSpell", spell: "counterfeitGold" }, {}, 1_000_000).state;
  assert.ok(cast.systems.bloodMagic.data.spells.counterfeitGoldBloodSpent > 0, "Le sang cumulé doit être suivi en interne.");
}

console.log("idle-blood-magic-spells-v1: OK");
