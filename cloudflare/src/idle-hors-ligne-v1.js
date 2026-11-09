/*
 * Rattrapage hors ligne : UNE seule définition (avant : trois copies alignées à la main, voir l'historique du correctif docs/HORS-LIGNE.md point 3).
 * Utilisée par idle-ngu-catalogues.js (EARLY_GAME_MAX_OFFLINE_SECONDS), idle-runtime-config.js (PROGRESSION_HORS_LIGNE_MAX_SECONDES, plafondHorsLigneSorealIdle_),
 * idle-basic-training.js (valeur de repli) et idle-ngu-systemes.js (plafond de la synchro NGU).
 */
export const PLAFOND_HORS_LIGNE_SECONDES_V1 = 30 * 24 * 60 * 60;
/* Défis sans progression hors ligne (wiki, page Challenges : « Offline progress disabled » pour le Troll Challenge, le 24 Hour Challenge et le 100 Levels Challenge). */
export const DEFIS_SANS_HORS_LIGNE_IDS_V1 = Object.freeze(["twentyFourHours", "hundredLevels", "troll"]);
export const PLAFOND_HORS_LIGNE_DEFIS_SECONDES_V1 = 60;
