import assert from "node:assert/strict";
import { possede } from "./_antlers-aide.mjs";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { exileIndiceBeteV1 } from "../src/idle-antlers-v1.js";

/*
 * Bois de l'Exilé (338), indice de la Bête : BeastQuestController::giveRewardsAndClear (méthodes 1241/1242, build 1260) : quête rendue à la main
 * (idle COUPÉ), aucun objet venu de l'idle (allActive), jauge idle entre 90 % et 100 % inclus, Tentacule (337) déjà vu.
 * Dans SOREAL : idleBar = idleProgress, usedIdle = NON allActive, d.idle = idleMode.
 */
const ctx = { bosses: 200, rebirths: 1 };
const T0 = 1_000_000_000;

function enQuete({ vu = true, idle = false, usedIdle = false, barre = 0.95 } = {}) {
  let s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, T0);
  s.adventure.unlockItems = Object.assign({}, s.adventure.unlockItems, { heroicSigil: true });
  s.adventure.completedSets = { sewers: true };
  s = normalizeIdleNguState(s, ctx, T0);
  const orig = Math.random;
  Math.random = () => 0;
  try { s = applyIdleNguAction(s, { action: "questStart" }, ctx, T0).state; } finally { Math.random = orig; }
  const d = s.systems.questing.data;
  d.quest.progress = d.quest.required;
  d.quest.idleBar = barre;
  d.quest.usedIdle = usedIdle;
  d.idle = idle;
  if (vu) s.adventure.itemList.exileClueTentacle = { maxLevel: 0, seen: true };
  return s;
}
const rendre = s => applyIdleNguAction(s, { action: "questComplete" }, ctx, T0);

/* Cas de référence : à la main, jauge à 95 %, rien venu de l'idle, 337 vu -> 338. */
{
  const r = rendre(enQuete());
  assert.equal(r.result.indiceExile, true);
  assert.equal(possede(r.state.adventure, "exileClueAntlers"), 1);
  assert.equal(r.state.adventure.itemList.exileClueAntlers.seen, true);
  assert.equal(r.state.systems.questing.data.quest, null, "la quête est bien rendue");
}
/* Bornes de la jauge : 0,9 inclus, 1 inclus ; 0,899 et au-delà de 1 : non. */
for (const [barre, attendu] of [[0.9, 1], [0.899, 0], [0.5, 0], [0, 0], [0.999, 1], [1, 1]]) {
  const r = rendre(enQuete({ barre }));
  assert.equal(possede(r.state.adventure, "exileClueAntlers"), attendu, "jauge " + barre);
}
assert.equal(exileIndiceBeteV1({ itemList: { exileClueTentacle: { seen: true } }, inventory: [], serial: 1 }, false, { usedIdle: false, idleBar: 1.01 }), null);
/* Sans le Tentacule vu : jamais. */
{
  const r = rendre(enQuete({ vu: false }));
  assert.equal(possede(r.state.adventure, "exileClueAntlers"), 0);
  assert.equal(r.result.indiceExile, undefined);
}
/* Idle actif (rendu de l'idle) : jamais. Un objet venu de l'idle (usedIdle) : jamais. */
assert.equal(possede(rendre(enQuete({ idle: true })).state.adventure, "exileClueAntlers"), 0);
assert.equal(possede(rendre(enQuete({ usedIdle: true })).state.adventure, "exileClueAntlers"), 0);
/* Pas de dédoublonnage : un second rendu en redonne un. */
{
  const s = enQuete();
  s.adventure.itemList.exileClueAntlers = { maxLevel: 0, seen: true };
  const r = rendre(s);
  assert.equal(possede(r.state.adventure, "exileClueAntlers"), 1);
}
console.log("ok");
