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

console.log("idle-stat-multiplie-entre-entrees-v1: OK");
