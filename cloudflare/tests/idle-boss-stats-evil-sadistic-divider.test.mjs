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

  assert.ok(relClose(evil.attaque, normal.attaque / 1e30), "Evil : attaque doit être divisée par 1e30.");
  assert.ok(relClose(evil.defense, normal.defense / 1e30), "Evil : defense doit être divisée par 1e30.");
  assert.ok(relClose(sadistic.attaque, normal.attaque / 1e30), "SADISTIC : même diviseur ×1e30 qu'Evil, jamais cumulé.");
  assert.ok(relClose(sadistic.defense, normal.defense / 1e30), "SADISTIC : même diviseur ×1e30 qu'Evil, jamais cumulé.");
  assert.ok(relClose(evil.pv, normal.pv / 1e30), "pv doit suivre la même proportion qu'attaque (HP=Attaque×10, mécaniquement divisé pareil).");
  assert.equal(evil.xp, normal.xp, "xp ne varie jamais avec la difficulté (non documenté par le wiki comme changeant).");
  assert.equal(sadistic.xp, normal.xp, "xp ne varie jamais avec la difficulté (SADISTIC non plus).");
}

// --- Boss au-delà de la table sourcée (progression infinie extrapolée) : même règle ---
{
  const index = 200; // au-delà de NGU_BOSS_REFERENCE_V1 (160 entrées)
  const normal = nguBossStatsV1(index, "normal");
  const evil = nguBossStatsV1(index, "difficile");
  assert.ok(relClose(evil.attaque, normal.attaque / 1e30), "Le diviseur doit s'appliquer aussi à la progression infinie extrapolée.");
  assert.equal(evil.xp, normal.xp, "xp reste inchangé même au-delà de la table sourcée.");
}

console.log("idle-boss-stats-evil-sadistic-divider: OK");
