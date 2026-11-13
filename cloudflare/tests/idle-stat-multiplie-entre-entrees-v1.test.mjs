import assert from "node:assert/strict";
import { perkBonusesV1 } from "../src/idle-perks-v1.js";
import { quirkBonusesV1 } from "../src/idle-quirks-v1.js";
import { wishBonusesV1 } from "../src/idle-wishes-v1.js";

/*
 * Attack/Defense : les niveaux d'UNE entrée (atout, quirk, souhait) s'additionnent, les entrées DISTINCTES se multiplient.
 *
 * MESURÉ DANS LE VRAI JEU le 2026-11-13 (NGU Idle build 1260) : une copie de la sauvegarde de Norman est modifiée (niveaux écrits directement),
 * le vrai jeu la charge et recalcule ses statistiques, puis la sauvegarde enregistrée par le jeu est relue. Le facteur retenu est l'attaque
 * divisée par (entraînement de base x équipement x NUMBER) ; la défense donne chaque fois le même facteur. Valeurs relevées :
 *   atouts  : Newbie 1 + Rich Perks I 40 = x10,00000 ; Fibonacci 377 = x3,77000 ; Newbie 1 + Fibonacci 377 = x7,54000 ;
 *   quirks  : (Evil) quirk 7 niveau 100 + quirk 51 niveau 50 = x4,000 ; en difficulté normale le quirk 51 est sans effet (x2,000) ;
 *   souhaits: (Evil) souhait 0 niveau 1 + souhait 5 niveau 3 = x8,000 ; souhait 5 niveau 2 + souhait 30 niveau 2 = x9,001 ;
 *   croisé  : atout 4 (x2) x quirk 7 niveau 100 (x2) = x4,00000.
 */
const proche = (a, b, message) => assert.ok(Math.abs(a - b) < 1e-9, message + " (obtenu " + a + ")");

/* atouts */
proche(perkBonusesV1({ 4: 1, 5: 40 }).statMultiplier, 10, "Newbie x Rich Perks I niveau 40 = x10");
proche(perkBonusesV1({ 94: 377 }).statMultiplier, 3.77, "palier 377 de Fibonacci = x3,77");
proche(perkBonusesV1({ 4: 1, 94: 377 }).statMultiplier, 7.54, "Newbie x palier 377 = x7,54");

/* quirks */
proche(quirkBonusesV1({ 7: 100 }).statMultiplier, 2, "quirk 7 niveau 100 = x2");
proche(quirkBonusesV1({ 7: 100, 51: 50 }).statMultiplier, 4, "quirk 7 niveau 100 (x2) x quirk 51 niveau 50 (x2) = x4, pas x3");
proche(quirkBonusesV1({ 7: 3 }).statMultiplier, 1.03, "les niveaux d'un même quirk s'additionnent");
proche(quirkBonusesV1({}).statMultiplier, 1, "aucun quirk : x1");

/* souhaits */
const souhaits = (niveaux) => wishBonusesV1(Object.fromEntries(Object.entries(niveaux).map(([id, level]) => [id, { level }])));
proche(souhaits({ 0: 1, 5: 3 }).statMultiplier, 8, "souhait 0 niveau 1 (x2) x souhait 5 niveau 3 (x4) = x8, pas x5");
proche(souhaits({ 5: 2, 30: 2 }).statMultiplier, 9, "souhait 5 niveau 2 (x3) x souhait 30 niveau 2 (x3) = x9, pas x5");
proche(souhaits({ 5: 3 }).statMultiplier, 4, "les niveaux d'un même souhait s'additionnent");
proche(souhaits({}).statMultiplier, 1, "aucun souhait : x1");

/*
 * Même règle pour les autres bonus en pourcentage, mesurée le 2026-11-13 (cloudflare/tools/banc-vrai-jeu/resultats, séries 3 à 7).
 * Puissance : vitesse d'un NGU alimenté par 1 milliard d'énergie ou de magie. Cap : énergie posée très haut, ramenée au cap total par le jeu.
 * Barres : énergie gagnée en 71 s depuis 0 avec 1 000 barres de base. Stats d'Aventure : PV actuels en zone sûre.
 *   énergie, puissance : atout 6x50 = x1,500 ; atout 6x50 + Fibonacci 1 = x1,650 ; quirks 35x50 + 0 = x1,650 ; atout 6x50 x quirk 35x50 = x2,250 ;
 *   énergie, cap (base 3 571) : atout 8x50 = 5 356 ; + Fibonacci 2 = 5 892 ; quirks 1 + 36x50 = 5 892 ; atout 8x50 x quirk 36x50 = 8 035 ;
 *   énergie, barres (base 142 000) : atout 7x50 = 213 000 ; + Fibonacci 21 = 234 300 ; quirks 2 + 37x50 = 234 300 ; atout x quirk = 319 500 ;
 *   magie, puissance : atout 9x50 + Fibonacci 1 = x1,650 ; magie, cap (base 100 000) : atout 11x50 = 150 000 ; + Fibonacci 3 = 165 000 ;
 *   Aventure (base 62 PV) : atout 55x1000 = 124 ; + Fibonacci 34 = 140,12 ; quirks 6 + 8x1000 = 155 ; atout 55x1000 x quirk 8x1000 = 248.
 */
proche(perkBonusesV1({ 6: 50 }).energyPowerMultiplier, 1.5, "atout 6 niveau 50 = x1,5");
proche(perkBonusesV1({ 6: 50, 94: 1 }).energyPowerMultiplier, 1.65, "puissance d'énergie : atout 6 x Fibonacci 1 = x1,65, pas x1,60");
proche(perkBonusesV1({ 8: 50, 94: 2 }).energyCapMultiplier, 1.65, "cap d'énergie : atout 8 x Fibonacci 2 = x1,65");
proche(perkBonusesV1({ 7: 50, 94: 21 }).energyBarsMultiplier, 1.65, "barres d'énergie : atout 7 x Fibonacci 21 = x1,65");
proche(perkBonusesV1({ 9: 50, 94: 1 }).magicPowerMultiplier, 1.65, "puissance de magie : atout 9 x Fibonacci 1 = x1,65");
proche(perkBonusesV1({ 11: 50, 94: 3 }).magicCapMultiplier, 1.65, "cap de magie : atout 11 x Fibonacci 3 = x1,65");
proche(perkBonusesV1({ 55: 1000, 94: 34 }).adventureStatsMultiplier, 2.26, "stats d'Aventure : atout 55 x Fibonacci 34 = x2,26, pas x2,13");
proche(quirkBonusesV1({ 35: 50, 0: 1 }).energyPowerMultiplier, 1.65, "puissance d'énergie : quirk 35 x quirk 0 = x1,65");
proche(quirkBonusesV1({ 36: 50, 1: 1 }).energyCapMultiplier, 1.65, "cap d'énergie : quirk 36 x quirk 1 = x1,65");
proche(quirkBonusesV1({ 37: 50, 2: 1 }).energyBarsMultiplier, 1.65, "barres d'énergie : quirk 37 x quirk 2 = x1,65");
proche(quirkBonusesV1({ 6: 1, 8: 1000 }).adventureStatsMultiplier, 2.5, "stats d'Aventure : quirk 6 x quirk 8 = x2,5, pas x2,25");

console.log("idle-stat-multiplie-entre-entrees-v1: OK");
