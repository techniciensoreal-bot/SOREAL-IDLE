import assert from "node:assert/strict";
import { atApplyTargetsV1 } from "../src/idle-ngu-pistes.js";

/*
 * Norman (2026-11-07) : « quand une cible est à -1 elle doit juste faire passer à la ligne suivante l'énergie ; ici, elle m'a été rendue au lieu d'être mise dans Vidage d'énergie de Wandoos ». Une ligne à -1 avec « Faire suivre
 * l'énergie » fait passer son énergie à la ligne suivante qui n'est ni à -1 ni atteinte (comme une ligne qui a atteint sa cible), jusqu'au « Vidage d'énergie de Wandoos » ; sans « Faire suivre l'énergie », -1 ne change rien.
 * Entraînement avancé testé ici sur un état construit à la main ; NGU et Augmentations ont le même changement (idle-cible-moins-un-v1 garde le reste du comportement).
 */
function etat(pistes, avance = true, wandoos = true) {
  const tracks = {};
  for (const [k, [energy, target, tempLevel]] of Object.entries(pistes)) tracks[k] = { energy, target, tempLevel, level: 0 };
  for (const k of ["toughness", "power", "block", "wandoosEnergy", "wandoosMagic"]) if (!tracks[k]) tracks[k] = { energy: 0, target: 0, tempLevel: 0, level: 0 };
  return { systems: { advancedTraining: { unlocked: true, allocation: { energy: 0, magic: 0 }, data: { tracks, advanceEnergy: avance, activeTrack: "" } }, wandoos: { unlocked: wandoos } } };
}
const e = (s) => Object.fromEntries(Object.entries(s.systems.advancedTraining.data.tracks).map(([k, v]) => [k, v.energy]));

{ /* la ligne à -1 passe son énergie au vidage, en sautant les autres lignes à -1 */
  const s = etat({ toughness: [100, -1, 0], power: [0, -1, 0], block: [0, -1, 0] });
  atApplyTargetsV1(s);
  assert.deepEqual(e(s), { toughness: 0, power: 0, block: 0, wandoosEnergy: 100, wandoosMagic: 0 }, "énergie passée jusqu'au Vidage d'énergie de Wandoos");
}
{ /* la suivante valable est la première ligne ni à -1 ni atteinte */
  const s = etat({ toughness: [100, -1, 0], power: [0, 0, 0] });
  atApplyTargetsV1(s);
  assert.deepEqual(e(s), { toughness: 0, power: 100, block: 0, wandoosEnergy: 0, wandoosMagic: 0 });
}
{ /* sans « Faire suivre l'énergie » : -1 ne change rien (l'énergie reste) */
  const s = etat({ toughness: [100, -1, 0] }, false);
  atApplyTargetsV1(s);
  assert.equal(e(s).toughness, 100);
}
{ /* le cas qui marchait déjà : ligne atteinte -> vidage en sautant les lignes à -1 */
  const s = etat({ toughness: [100, 1, 5], power: [0, -1, 0], block: [0, -1, 0] });
  atApplyTargetsV1(s);
  assert.deepEqual(e(s), { toughness: 0, power: 0, block: 0, wandoosEnergy: 100, wandoosMagic: 0 });
}
console.log("idle-cible-moins-un-passe-energie-v1: OK");
