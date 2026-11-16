import assert from "node:assert/strict";
import test from "node:test";
import "../src/idle-sqlite-runtime.js";   /* point d'entree : evite le cycle d'initialisation entre les fichiers du moteur */
import { regenBossSecondeSorealIdle_ } from "../src/idle-runtime-boss.js";
import { nguBossStatsV1 } from "../src/idle-ngu-boss-reference-v1.js";

/*
 * Audit boss-at-rebirth E4 (2026-11-16), lu dans le jeu (build 1260) : BossController::Start fait InvokeRepeating("fight", 0, 0.02)
 * (50 appels par seconde) et BossController::fight ajoute Character.bossRegen a CHAQUE appel (sans le facteur 0,02 des degats),
 * meme hors combat : la regeneration par seconde vaut 50 x la valeur du tableau.
 */
test("la regeneration des boss vaut 50 fois la valeur du tableau (50 appels de fight par seconde)", () => {
  for (const index of [0, 1, 4, 19, 20, 150, 300]) {
    const ref = nguBossStatsV1(index);
    assert.equal(regenBossSecondeSorealIdle_(index, ref.pv), ref.regen * 50, "boss d'index " + index);
  }
  const evil = nguBossStatsV1(10, "difficile");
  assert.equal(regenBossSecondeSorealIdle_(10, evil.pv), evil.regen * 50);
});
