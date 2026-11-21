import assert from "node:assert/strict";
import { createBasicTrainingStateV411, advanceBasicTrainingStateV411 } from "../src/idle-basic-training.js";

/* Déblocage STRICT d'une compétence (OffenseTraining::locked 4349 : verrouillée tant que le niveau précédent <= id x 5000) et Training Auto Advance : l'énergie doit passer à la compétence suivante même quand la précédente part d'exactement 5 000 (déblocage manqué avant le passage au seuil strict). */
const avance = (s, ms) => advanceBasicTrainingStateV411(s, ms, 12 * 3600, 1, { autoAdvance: true }).state;

{ /* la précédente part à 5 000,4 : la suivante s'ouvre à 5 001 et reçoit le surplus */
  const s = createBasicTrainingStateV411(0);
  s.skills.attaque_passive.level = 5000; s.skills.attaque_passive.progress = 0.4; s.skills.attaque_passive.allocation = 10000;
  const r = avance(s, 100_000);
  assert.ok(r.skills.attaque_passive.level > 5000);
  assert.ok(r.skills.attaque_reguliere.allocation > 0, "l'énergie est passée à Attaque régulière");
  assert.ok(r.skills.attaque_reguliere.level > 0, "Attaque régulière avance");
}
{ /* exactement 5 000 sans progression : toujours verrouillée (règle du jeu), pas d'énergie perdue en double */
  const s = createBasicTrainingStateV411(0);
  s.skills.attaque_passive.level = 5000; s.skills.attaque_passive.allocation = 2500;
  const r = avance(s, 0);
  assert.equal(r.skills.attaque_reguliere.allocation, 0);
}
console.log("idle-basic-training-seuil-strict-v1: OK");
