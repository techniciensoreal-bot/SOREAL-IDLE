import assert from "node:assert/strict";
import { createBasicTrainingStateV411, advanceBasicTrainingStateV411 } from "../src/idle-basic-training.js";

/*
 * Norman (2026-09-27), en réponse à docs/HORS-LIGNE.md : « traite le point 3 » -- le rattrapage hors ligne de
 * Basic Training était plafonné à 12 h (`CONFIG_SOREAL_IDLE.PROGRESSION_HORS_LIGNE_MAX_SECONDES`,
 * idle-sqlite-runtime.js), un chiffre sans source wiki, incohérent avec tous les autres systèmes de SOREAL,
 * plafonnés à 30 jours (EARLY_GAME_MAX_OFFLINE_SECONDS, idle-ngu-progression.js). Ce test verrouille l'alignement,
 * en appelant advanceBasicTrainingStateV411 SANS préciser maxOfflineSeconds (la valeur de repli par défaut de la
 * fonction, qui doit donc elle aussi valoir 30 jours -- le vrai plafond de production vient de
 * CONFIG_SOREAL_IDLE.PROGRESSION_HORS_LIGNE_MAX_SECONDES, vérifié séparément).
 */

const JOUR = 24 * 3600 * 1000;

const fresh = () => {
  const s = createBasicTrainingStateV411(0);
  s.skills.attaque_passive.allocation = 10000; // pas de cap atteint : progresse tant qu'il reste du temps à traiter
  return s;
};

// --- un rattrapage de 20 h (au-delà de l'ancien plafond de 12 h) doit être traité EN ENTIER ---
{
  const { state } = advanceBasicTrainingStateV411(fresh(), 20 * 3600 * 1000);
  const { state: etat12h } = advanceBasicTrainingStateV411(fresh(), 20 * 3600 * 1000, 12 * 3600);
  assert.ok(
    state.skills.attaque_passive.level > etat12h.skills.attaque_passive.level,
    "20 h de rattrapage doivent apporter plus de niveaux que l'ancien plafond de 12 h (sinon le plafond par défaut est resté à 12 h)"
  );
}

// --- 20 jours et 40 jours d'absence donnent EXACTEMENT le même résultat que 30 jours (plafond, jamais davantage) ---
{
  const { state: j20 } = advanceBasicTrainingStateV411(fresh(), 20 * JOUR);
  const { state: j30 } = advanceBasicTrainingStateV411(fresh(), 30 * JOUR);
  const { state: j40 } = advanceBasicTrainingStateV411(fresh(), 40 * JOUR);
  assert.ok(j20.skills.attaque_passive.level < j30.skills.attaque_passive.level, "20 jours < 30 jours (sous le plafond, progression normale)");
  assert.equal(j40.skills.attaque_passive.level, j30.skills.attaque_passive.level, "40 jours = 30 jours (plafonné à 30 jours, jamais davantage)");
}

console.log("idle-basic-training-offline-cap-30-days: OK");
