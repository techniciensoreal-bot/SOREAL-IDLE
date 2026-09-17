import assert from "node:assert/strict";
import { idleRuntimeTestHooks } from "../src/idle-sqlite-runtime.js";

const { equilibrerBossPrincipalSorealIdleV413_ } = idleRuntimeTestHooks;

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * Phase 2a (idle-boss-stats-evil-sadistic-divider.test.mjs) verrouille le
 * diviseur ×1e-30 au niveau de nguBossStatsV1. Ce test verrouille la
 * PROPAGATION jusqu'à equilibrerBossPrincipalSorealIdleV413_, la fonction
 * qui enveloppe TOUS les usages de nguBossStatsV1 dans le moteur de
 * combat réel (definitionBossSorealIdle_, attaqueBossSorealIdle_,
 * defenseBossSorealIdle_, pvMaxBossSorealIdle_ en sont de simples
 * enveloppes qui lui délèguent directement -- vérifié par lecture de
 * code, pas retesté séparément ici pour éviter d'avoir à simuler tout le
 * classeur SQLite/D1 dont ces enveloppes dépendent via
 * bossCatalogueSorealIdle_).
 *
 * `{}` comme définition catalogue : ne fournit aucune valeur propre, donc
 * le plancher MAX(définition, nguBossStatsV1) retombe entièrement sur
 * nguBossStatsV1(index, difficulty) -- exactement ce qu'on veut isoler.
 */

const relClose = (a, b) => Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1e-300) < 1e-9;

{
  /*
   * index=200 (pas 20) : equilibrerBossPrincipalSorealIdleV413_ applique
   * aussi un plancher Math.max(1, ...) contre `source` (ici {} -> défaut
   * 1) pour ne jamais laisser un boss à 0 stat -- à un index trop petit,
   * la valeur normale divisée par 1e30 retombe SOUS ce plancher de 1 et
   * s'y fait écraser, masquant le diviseur qu'on veut isoler ici. Un
   * index assez grand pour que attaque/1e30 reste > 1 est nécessaire.
   */
  const index = 200;
  const normal = equilibrerBossPrincipalSorealIdleV413_({}, index, "normal");
  const evil = equilibrerBossPrincipalSorealIdleV413_({}, index, "difficile");
  const sadistic = equilibrerBossPrincipalSorealIdleV413_({}, index, "extreme");

  assert.ok(relClose(evil.attaque, normal.attaque / 1e30), "Evil : attaque divisée par 1e30 jusque dans le moteur de combat.");
  assert.ok(relClose(evil.defense, normal.defense / 1e30), "Evil : defense divisée par 1e30 jusque dans le moteur de combat.");
  assert.ok(relClose(evil.pv, normal.pv / 1e30), "Evil : pv suit la même proportion (HP=Attaque×10).");
  assert.ok(relClose(sadistic.attaque, normal.attaque / 1e30), "SADISTIC : même diviseur ×1e30 qu'Evil, jamais cumulé.");
  assert.equal(evil.xp, normal.xp, "xp ne doit jamais être divisé par la difficulté.");
}

// --- Sans argument de difficulté : comportement historique inchangé ---
{
  const index = 5;
  const withoutArg = equilibrerBossPrincipalSorealIdleV413_({}, index);
  const explicitNormal = equilibrerBossPrincipalSorealIdleV413_({}, index, "normal");
  assert.deepEqual(withoutArg, explicitNormal, "Omettre le 3e argument doit rester strictement identique à 'normal' (compat rétroactive).");
}

console.log("idle-boss-combat-engine-difficulty-wiring: OK");
