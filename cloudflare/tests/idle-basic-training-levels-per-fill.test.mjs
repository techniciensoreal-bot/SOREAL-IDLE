import assert from "node:assert/strict";
import {
  createBasicTrainingStateV411,
  advanceBasicTrainingSkillV411,
  basicTrainingSnapshotV411,
  levelsPerFillBasicTrainingV411,
  levelsPerSecondForBasicTrainingSkillV411
} from "../src/idle-basic-training.js";
import { normalizeIdleNguState, idleNguBonuses } from "../src/idle-ngu-progression.js";
import { idleQuirkByIdV1 } from "../src/idle-quirks-v1.js";
import { idleWishByIdV1 } from "../src/idle-wishes-v1.js";

/*
 * Audit NGU 2026-09-23 (wiki Basic Training / Advanced Training) : Double
 * Basic Training (perk 15), Super Advanced Beast Training! (quirk 17) et
 * "I wish Basic Training was EVEN FASTER >:)" (wish 23) ajoutent chacun un
 * niveau à chaque remplissage de barre. Le perk était acheté sans effet, le
 * quirk absent du catalogue, le souhait sans bonus.
 */
assert.equal(levelsPerFillBasicTrainingV411({}), 1);
assert.equal(levelsPerFillBasicTrainingV411({ doubleBasicTraining: true }), 2);
assert.equal(levelsPerFillBasicTrainingV411({ doubleBasicTraining: true, quirkExtraLevels: 1, wishExtraLevels: 1 }), 4);

const quirk = idleQuirkByIdV1(17);
assert.equal(quirk.name, "Super Advanced Beast Training!");
assert.equal(quirk.cost, 4000, "wiki : 4 000 QP");
assert.equal(quirk.cap, 1);
assert.equal(idleWishByIdV1(23).bonus.basicTrainingExtraLevel, 1);

// vitesse : x niveaux par barre
assert.equal(levelsPerSecondForBasicTrainingSkillV411(1000, 1000), 50);
assert.equal(levelsPerSecondForBasicTrainingSkillV411(1000, 1000, 2), 100);
assert.equal(levelsPerSecondForBasicTrainingSkillV411(500, 1000, 4), 100, "moitié du cap alloué : moitié de 200 niv/s");

// avance : 10 s à 50 barres/s x 2 niveaux
{
  const s = createBasicTrainingStateV411(0);
  const skill = { ...s.skills.attaque_passive, allocation: s.skills.attaque_passive.cap };
  const simple = advanceBasicTrainingSkillV411(skill, 10, 1);
  const double = advanceBasicTrainingSkillV411(skill, 10, 2);
  assert.equal(simple.level, 500);
  assert.equal(double.level, 1000);
}

// bonus agrégés depuis les vrais états perk / quirk / wish
{
  const state = normalizeIdleNguState({ difficulty: "extreme" }, {}, 0);
  assert.equal(idleNguBonuses(state).basicTrainingLevelsPerFill, 1);
  state.systems.perks.data.levels[15] = 1;
  assert.equal(idleNguBonuses(state).basicTrainingLevelsPerFill, 2, "perk Double Basic Training");
  state.systems.quirks.data = { levels: { 17: 1 } };
  assert.equal(idleNguBonuses(state).basicTrainingLevelsPerFill, 3, "+ quirk");
  state.systems.wishes.data.tracks[23] = { level: 1 };
  assert.equal(idleNguBonuses(state).basicTrainingLevelsPerFill, 4, "+ souhait");
}

// le snapshot annonce la vitesse max réelle (le client s'en sert pour animer les barres)
{
  const raw = createBasicTrainingStateV411(0);
  assert.equal(basicTrainingSnapshotV411(raw, 100, 100).maxLevelsPerSecond, 50);
  const snap = basicTrainingSnapshotV411(raw, 100, 100, 3);
  assert.equal(snap.maxLevelsPerSecond, 150);
  assert.equal(snap.levelsPerFill, 3);
}

console.log("idle-basic-training-levels-per-fill: OK");
