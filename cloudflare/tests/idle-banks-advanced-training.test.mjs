import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  rebirthIdleNguState,
  syncIdleNguState,
  idleNguBonuses
} from "../src/idle-ngu-progression.js";

/*
 * Audit 2026-09-24 : pages Banks et Rebirths.
 * - Banks : les Perks 36-40 / Quirks 20-24 retiennent un pourcentage cumulé (1 % par niveau de perk,
 *   0,5 % par niveau de quirk) des niveaux d'Advanced Training au Rebirth ; "banked Advanced Training
 *   levels do not have any effect until the AT menu is unlocked by completing Basic Training".
 * - Rebirths : "Advanced Training levels and access to the menu (until you get the basic training
 *   levels again)" sont perdus.
 */
const ctx = { bosses: 100, basicTrainingComplete: true };
const fresh = () => normalizeIdleNguState({}, ctx, 0);
const HOUR = 3_600_000;

function avecAT(niveaux, perks) {
  const s = fresh();
  s.systems.advancedTraining.unlocked = true;
  for (const [id, lvl] of Object.entries(niveaux)) s.systems.advancedTraining.data.tracks[id].tempLevel = lvl;
  s.systems.advancedTraining.tempLevel = Object.values(niveaux).reduce((a, b) => a + b, 0);
  if (perks) s.systems.perks.data = { levels: perks };
  return s;
}

// Sans perk de banque : rien n'est retenu, le menu est reverrouillé.
{
  const r = rebirthIdleNguState(avecAT({ power: 1000 }), ctx, HOUR);
  assert.equal(r.systems.advancedTraining.data.tracks.power.tempLevel, 0);
  assert.equal(r.bank.advancedTraining, 0);
  assert.equal(r.systems.advancedTraining.unlocked, false, "accès au menu perdu au Rebirth");
}

// Perk 36 niveau 10 (10 %) + perk 37 niveau 10 (10 %) = 20 % arrondi à l'inférieur, par compétence.
{
  const r = rebirthIdleNguState(avecAT({ power: 1005, toughness: 99 }, { 36: 10, 37: 10 }), ctx, HOUR);
  assert.equal(r.systems.advancedTraining.data.tracks.power.tempLevel, 201, "floor(1005 x 0,20)");
  assert.equal(r.systems.advancedTraining.data.tracks.toughness.tempLevel, 19, "floor(99 x 0,20)");
  assert.equal(r.bank.advancedTraining, 220);
  assert.equal(r.systems.advancedTraining.unlocked, false);
  // Menu verrouillé : les niveaux retenus n'ont aucun effet sur la Power d'aventure.
  assert.equal(idleNguBonuses(r).adventurePowerMultiplier, 1, "banked AT levels have no effect while the menu is locked");
  // Basic Training à nouveau complété : le menu se rouvre et les niveaux comptent.
  const rouvert = syncIdleNguState(r, ctx, HOUR + 1000);
  assert.equal(rouvert.systems.advancedTraining.unlocked, true);
  assert.ok(idleNguBonuses(rouvert).adventurePowerMultiplier > 1);
}

// Perk 18 "Instant Advanced Training Levels!" : un niveau de CHAQUE compétence d'AT par niveau de perk, à chaque Rebirth
// (page Advanced Training), en plus des niveaux retenus par la banque.
{
  const r = rebirthIdleNguState(avecAT({ power: 100 }, { 18: 5, 36: 10 }), ctx, HOUR);
  const tr = r.systems.advancedTraining.data.tracks;
  assert.equal(tr.power.tempLevel, 10 + 5, "banque 10 % de 100 + 5 du perk");
  for (const id of ["toughness", "block", "wandoosEnergy", "wandoosMagic"]) assert.equal(tr[id].tempLevel, 5, id);
}
console.log("idle-banks-advanced-training OK");
