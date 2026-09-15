import assert from "node:assert/strict";
import { normalizeIdleNguState, idleNguBonuses } from "../src/idle-ngu-progression.js";

/*
 * NGU wiki adaptation (2026-09-14) — audit indépendant de Gold Diggers
 * (page https://ngu-idle.fandom.com/wiki/Digger, redirigée vers "Gold
 * Diggers"). Le catalogue IDLE_NGU_DIGGERS (12 diggers : coût de
 * déblocage, drain initial, taux de croissance 1.5x/1.75x, plafond de
 * niveau) et les 10 formules d'effet par niveau (ex: Stat Digger
 * (200 + Level^3)%, Adventure Digger (110 + 0.5*Level)%, etc.) étaient
 * déjà exacts, cellule par cellule, et n'ont pas été touchés.
 *
 * Le seul écart trouvé : la section "Global Digger Bonus" du wiki
 * donne une formule strictement ADDITIVE — "0.05%*(Total Digger
 * Levels) + (No TM Challenge Bonus) + (Party (set) Bonus)". Le bonus
 * du Défi "No Time Machine" (+5 points de % dès le palier 1) doit
 * s'ADDITIONNER au pourcentage de niveaux avant le +100% final.
 * L'ancienne formule (diggerGlobalBonus, idle-ngu-progression.js)
 * calculait (1 + levelPct/100) * 1.05 — une composition
 * MULTIPLICATIVE des deux termes, jamais sourcée par le wiki, avec un
 * écart croissant avec le nombre de niveaux de Diggers achetés.
 */

const fresh = (context = {}, now = 1_000_000) => normalizeIdleNguState({}, context, now);

// --- Sans le Défi "No Time Machine": la formule pure par niveaux doit rester inchangée ---
{
  const state = fresh({}, 1_000_000);
  state.systems.diggers.unlocked = true;
  state.systems.diggers.data.diggers.drop.maxLevel = 100;
  const bonus = idleNguBonuses(state).diggerGlobalBonus;
  // 100 niveaux total <= 500 -> 0.05% * 100 = 5% -> multiplicateur 1.05, sans terme de Défi.
  assert.ok(Math.abs(bonus - 1.05) < 1e-9, "Sans Défi No Time Machine, le bonus global doit rester 1 + 0.05%*Total, formule wiki pure.");
}

// --- Avec le Défi "No Time Machine" complété: le +5% doit s'ADDITIONNER, pas se multiplier ---
{
  const state = fresh({}, 1_000_000);
  state.systems.diggers.unlocked = true;
  state.systems.diggers.data.diggers.drop.maxLevel = 100;
  state.challenge.completions.noTimeMachine = 1;
  const bonus = idleNguBonuses(state).diggerGlobalBonus;
  // Formule wiki additive: 1 + (5% + 5%) = 1.10, PAS 1.05 * 1.05 = 1.1025 (ancienne formule, fausse).
  assert.ok(Math.abs(bonus - 1.10) < 1e-9, "Le bonus du Défi No Time Machine doit s'additionner (1 + 5% + 5% = 1.10), pas se composer multiplicativement (1.05 * 1.05 = 1.1025, l'ancien bug).");
}

console.log("idle-digger-global-bonus-additive-v1: OK");
