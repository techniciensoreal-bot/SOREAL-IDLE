import assert from "node:assert/strict";
import fs from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState, idleNguTimeMachineGoldPerSecond } from "../src/idle-ngu-progression.js";
import { barbesTempsPleinV1 } from "../src/idle-ngu-pistes.js";

/*
 * Audit du code du jeu (build 1260, 2026-11-16, design/audit-code-jeu/hors-ligne.md) : écarts E1 (Or en tête), E3 (barbes : secondes barre pleine), E5 (Entraînement avancé borné à la cible),
 * E6 (hack final à demi-vitesse : voir idle-the-end-v1), E4 (titans : voir idle-titan-autokill-offline).
 */
const ctx = { bosses: 100, basicTrainingComplete: true };

/* E1 : une absence longue crédite l'Or de la Time Machine EN TÊTE (niveaux d'avant l'absence), avant que les autres systèmes dépensent. */
{
  const s = normalizeIdleNguState({}, ctx, 0);
  s.systems.timeMachine.unlocked = true;
  const d = s.systems.timeMachine.data;
  d.bestGoldThisRun = 1000;
  d.highestBossEver = 100;
  s.currencies.gold = 0;
  const gps = idleNguTimeMachineGoldPerSecond(s);
  assert.ok(gps > 0, "la Time Machine produit de l'Or");
  const r = advanceIdleNguState(structuredClone(s), 3600, ctx, 3_600_000);
  /* la production est créditée avec les niveaux d'AVANT l'absence (aucun niveau de vitesse n'était acheté) : exactement gps x secs en Or produit */
  assert.ok(Math.abs(r.systems.timeMachine.data.producedThisRun - gps * 3600) / (gps * 3600) < 1e-6, "Or produit = gps d'avant x secondes : " + r.systems.timeMachine.data.producedThisRun + " / " + gps * 3600);
}

/* E3 : secondes passées barre pleine = clamp(secs - ceil((cap - courante) / énergie par seconde), 0, secs). */
{
  const s = normalizeIdleNguState({}, ctx, 0);
  s.resources.energy.cap = 1000;
  s.resources.energy.current = 1000;
  assert.equal(barbesTempsPleinV1(s, 5000).energy, 5000, "déjà pleine : toute l'absence");
  s.resources.energy.current = 0;
  const tp = barbesTempsPleinV1(s, 5000).energy;
  assert.ok(tp > 0 && tp < 5000, "vide au départ : une partie seulement de l'absence (" + tp + ")");
  assert.equal(barbesTempsPleinV1(s, 5).energy, 0, "absence trop courte pour remplir : aucune seconde barre pleine");
}

/* E5 : Entraînement avancé hors ligne borné à la cible. */
{
  const s = normalizeIdleNguState({}, ctx, 0);
  s.systems.advancedTraining.unlocked = true;
  s.resources.energy.cap = 1e12;
  s.resources.energy.current = 1e12;
  s.resources.energy.power = 1e12;
  const a = applyIdleNguAction(s, { action: "allocateAdvancedTraining", track: "power", value: 1e12 }, ctx, 1000).state;
  a.systems.advancedTraining.data.tracks.power.target = 5;
  const r = advanceIdleNguState(a, 24 * 3600, ctx, 1000 + 24 * 3600 * 1000);
  assert.ok(r.systems.advancedTraining.data.tracks.power.tempLevel <= 5, "niveau borné à la cible : " + r.systems.advancedTraining.data.tracks.power.tempLevel);
}

/* Câblage (E1, E4) lisible dans les sources. */
{
  const sys = fs.readFileSync(new URL("../src/idle-ngu-systemes.js", import.meta.url), "utf8");
  assert.ok(sys.indexOf("crediterOrHorsLigneV1(state, secs)") < sys.indexOf("advanceGeneratedResources(state, secs, context)"), "l'Or est crédité avant toute autre passe");
  const zones = fs.readFileSync(new URL("../src/idle-adventure-zones.js", import.meta.url), "utf8");
  assert.ok(zones.includes("cooldown:7.5*H"), "Amalgamate : 27 000 s");
}

console.log("idle-audit-hors-ligne-code-jeu-v1: OK");
