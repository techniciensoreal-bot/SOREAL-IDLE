import assert from "node:assert/strict";
import { nguBossStatsV1 } from "../src/idle-ngu-boss-reference-v1.js";

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * Wiki NGU local, page "Evil difficulty" section "Differences" : "Fight
 * boss attack defense divided by 1 nonillion (1e30)" ; page "SADISTIC
 * difficulty" section "Differences" : "Fight boss attack/defense is
 * divided by 1e30 compared to Normal (this attack modifier is the same
 * as Evil as of patch 1.110)" -- un seul et même diviseur pour les deux
 * difficultés, jamais cumulé, jamais appliqué à xp.
 */

const relClose = (a, b) => Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1e-300) < 1e-9;

// --- Sans argument de difficulté (compat rétroactive) : comportement inchangé ---
{
  const withoutArg = nguBossStatsV1(0);
  const explicitNormal = nguBossStatsV1(0, "normal");
  assert.deepEqual(withoutArg, explicitNormal, "Omettre le 2e argument doit rester strictement identique à 'normal'.");
}

// --- Boss dans la table sourcée (index < 160) : Evil et Sadistic divisent par le même 1e30 ---
{
  const index = 20; // boss #21, dans NGU_BOSS_REFERENCE_V1
  const normal = nguBossStatsV1(index, "normal");
  const evil = nguBossStatsV1(index, "difficile");
  const sadistic = nguBossStatsV1(index, "extreme");

  assert.ok(relClose(evil.attaque, normal.attaque), "Evil : le BOSS n'est jamais divisé (audit IL 2026-11-20 : c'est le joueur qui l'est).");
  assert.ok(relClose(evil.defense, normal.defense), "Evil : la défense du boss est inchangée.");
  assert.ok(relClose(sadistic.attaque, normal.attaque), "SADISTIC : stats du boss inchangées.");
  assert.ok(relClose(sadistic.defense, normal.defense), "SADISTIC : défense du boss inchangée.");
  assert.ok(relClose(evil.pv, normal.pv), "pv doit suivre la même proportion qu'attaque (HP=Attaque×10, mécaniquement divisé pareil).");
  assert.equal(evil.xp, normal.xp, "xp ne varie jamais avec la difficulté (non documenté par le wiki comme changeant).");
  assert.equal(sadistic.xp, normal.xp, "xp ne varie jamais avec la difficulté (SADISTIC non plus).");
}

// --- Boss au-delà de la table sourcée (progression infinie extrapolée) : même règle ---
{
  const index = 200; // au-delà de NGU_BOSS_REFERENCE_V1 (160 entrées)
  const normal = nguBossStatsV1(index, "normal");
  const evil = nguBossStatsV1(index, "difficile");
  assert.ok(relClose(evil.attaque, normal.attaque), "Même règle pour la progression extrapolée : le boss n'est jamais divisé.");
  assert.equal(evil.xp, normal.xp, "xp reste inchangé même au-delà de la table sourcée.");
}

console.log("idle-boss-stats-evil-sadistic-divider: OK");
