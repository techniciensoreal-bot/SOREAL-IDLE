import assert from "node:assert/strict";
import { possede } from "./_antlers-aide.mjs";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { advanceIdleQuestingV1, idleQuestBonusTotalsV1, idleQuestIdleDividerV1, idleQuestIdleSecondsPerItemV1, idleQuestDropMultiplierV1 } from "../src/idle-questing-v1.js";

/*
 * Jauge idle de la Bête et Bois de l'Exilé (338), lecture du code du jeu (build 1260) :
 *  - BeastQuestController::updateIdleQuest (méthode 1257) : `idleProgress += idleProgressPerTick` à chaque tick ; si idleProgress >= 1 : remis à 0, allActive = faux, advanceQuest.
 *    En ligne, la jauge est donc TOUJOURS dans [0, 1[ à la fin d'un tick : elle ne reste jamais à 1.
 *  - Character::questingOfflineProgress (méthode 2238) : tronque à (long)((1 - idleProgress) / perTick) ticks pour finir l'objet courant ; s'il en faut plus que les ticks écoulés,
 *    idleProgress += ticks x perTick (reste < 1) ; sinon objet gagné, allActive = faux, jauge = reste fractionnaire (loc10 - (int)loc10), donc < 1 ; la valeur est ensuite bornée à [0, 1]
 *    (cette borne n'est jamais atteinte : un reste fractionnaire est strictement < 1).
 * Dans SOREAL la jauge (idleBar) est bornée à 0,999999999999 et usedIdle = NON allActive : même comportement, la borne haute « <= 1 » du 338 est donc toujours vraie et seul le seuil de 0,9 compte.
 */
const ctx = { bosses: 200, rebirths: 1 };
const T0 = 1_000_000_000;

function enQuete() {
  let s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, T0);
  s.adventure.unlockItems = Object.assign({}, s.adventure.unlockItems, { heroicSigil: true });
  s.adventure.completedSets = { sewers: true };
  s = normalizeIdleNguState(s, ctx, T0);
  const orig = Math.random;
  Math.random = () => 0;
  try { s = applyIdleNguAction(s, { action: "questStart" }, ctx, T0).state; } finally { Math.random = orig; }
  s.adventure.itemList.exileClueTentacle = { maxLevel: 0, seen: true };
  return s;
}
function secondesParObjet(s) {
  const b = idleQuestBonusTotalsV1(s);
  return idleQuestIdleSecondsPerItemV1(idleQuestIdleDividerV1(b), {}, idleQuestDropMultiplierV1(b, {}));
}

/* Idle allumé, jauge à 0 : on laisse passer 95 % d'un objet. Aucun objet fini : usedIdle reste faux, la jauge vaut 0,95, puis on COUPE l'idle et on rend la quête (progression complétée à la main). */
{
  const s = enQuete();
  let d = s.systems.questing.data;
  const per = secondesParObjet(s);
  assert.ok(per > 0);
  d.idle = true;
  d.quest.progress = 0;
  d.quest.idleBar = 0;
  advanceIdleQuestingV1(s, per * 0.95, {}, T0);
  d = s.systems.questing.data;
  assert.ok(Math.abs(d.quest.idleBar - 0.95) < 1e-9, "jauge 0,95 : " + d.quest.idleBar);
  assert.equal(d.quest.progress, 0, "aucun objet fini");
  assert.equal(d.quest.usedIdle, false, "allActive reste vrai tant qu'aucune jauge idle n'a fini un objet");
  d.idle = false;                       /* toggleIdleMode : la jauge reste figée */
  d.quest.progress = d.quest.required;  /* le reste de la quête vient des drops actifs */
  const r = applyIdleNguAction(s, { action: "questComplete" }, ctx, T0);
  assert.equal(possede(r.state.adventure, "exileClueAntlers"), 1, "jauge 0,95, idle coupé, rien venu de l'idle : Bois de l'Exilé");
}
/* Une longue absence finit des objets : la jauge reste STRICTEMENT sous 1 et usedIdle devient vrai (allActive = faux) : plus de Bois. */
{
  const s = enQuete();
  let d = s.systems.questing.data;
  const per = secondesParObjet(s);
  d.idle = true;
  d.quest.progress = 0;
  d.quest.idleBar = 0.9;
  advanceIdleQuestingV1(s, per * 3.5, {}, T0);
  d = s.systems.questing.data;
  assert.ok(d.quest.progress >= 3, "objets gagnés pendant l'absence");
  assert.equal(d.quest.usedIdle, true);
  assert.ok(d.quest.idleBar < 1, "jamais 1 exactement : " + d.quest.idleBar);
  d.idle = false;
  d.quest.progress = d.quest.required;
  const r = applyIdleNguAction(s, { action: "questComplete" }, ctx, T0);
  assert.equal(possede(r.state.adventure, "exileClueAntlers"), 0, "un objet est venu de l'idle (allActive faux)");
}
/* Fin pile d'un objet (reste nul) : la jauge repart à 0, jamais à 1. */
{
  const s = enQuete();
  let d = s.systems.questing.data;
  const per = secondesParObjet(s);
  d.idle = true;
  d.quest.progress = 0;
  d.quest.idleBar = 0;
  advanceIdleQuestingV1(s, per, {}, T0);
  d = s.systems.questing.data;
  assert.equal(d.quest.idleBar, 0);
  assert.equal(d.quest.progress, 1);
}
console.log("ok");
