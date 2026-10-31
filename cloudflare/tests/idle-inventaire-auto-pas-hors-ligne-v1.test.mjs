import assert from "node:assert/strict";
import { advanceIdleNguState, normalizeIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-10-31) : « auto boost et auto merge ne doivent pas fonctionner hors ligne. L'inventaire se remplit à 100 % et c'est tout. Il faut que le joueur se connecte pour que le auto merge et auto boost se remettent en route. »
 * Un écart de 5 minutes ou plus depuis la dernière synchro = hors ligne : les minuteurs d'Auto Merge / Auto Boost ne bougent pas (donc rien ne part). Une synchro courte (joueur connecté) les fait avancer normalement.
 */
function etat() {
  const s = normalizeIdleNguState(null, { bosses: 300 }, 1000);
  s.bonuses = s.bonuses || {};
  s.bonuses.expShop = Object.assign({}, s.bonuses.expShop, { autoMerge: 1 });
  s.adventure.inventoryAuto = Object.assign({}, s.adventure.inventoryAuto, { autoMerge: true, mergeElapsed: 100 });
  return s;
}
const lire = (s) => s.adventure.inventoryAuto.mergeElapsed;

// connecté : une synchro de 30 s fait avancer le minuteur
{
  const apres = advanceIdleNguState(etat(), 30, { bosses: 300 }, 31000);
  assert.ok(lire(apres) > 100, "en ligne, le minuteur d'Auto Merge avance (" + lire(apres) + ")");
}
// hors ligne : 1 h, 10 h, 30 jours d'absence → le minuteur reste exactement où il était, rien ne part
for (const secondes of [300, 3600, 10 * 3600, 30 * 24 * 3600]) {
  const apres = advanceIdleNguState(etat(), secondes, { bosses: 300 }, 1000 + secondes * 1000);
  assert.equal(lire(apres), 100, "hors ligne (" + secondes + " s), l'Auto Merge est figé");
}
// juste sous le seuil : encore « en ligne »
{
  const apres = advanceIdleNguState(etat(), 299, { bosses: 300 }, 1000 + 299000);
  assert.ok(lire(apres) > 100, "299 s = encore connecté");
}
console.log("idle-inventaire-auto-pas-hors-ligne-v1: OK");
