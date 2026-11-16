import assert from "node:assert/strict";
import test from "node:test";
import { lireSrc } from "./_src-sources.mjs";
import "../src/idle-sqlite-runtime.js";   /* point d'entree : evite le cycle d'initialisation entre les fichiers du moteur */
import { bossFinDesBossAtteinteSorealIdle_, regenBossSecondeSorealIdle_, BOSS_DERNIER_INDEX_V1 } from "../src/idle-runtime-boss.js";

/*
 * Audit boss-at-rebirth E3 (2026-11-16), lus dans le jeu (build 1260) :
 * - advanceBoss / beginFight / fight / nukeBosses : plus aucun boss quand bossID > 300 ; stats de fin 69 / 69 / 420.
 */
test("plus aucun boss apres le 301e : drapeau de fin et regen de fin", () => {
  assert.equal(BOSS_DERNIER_INDEX_V1, 300);
  assert.equal(bossFinDesBossAtteinteSorealIdle_(300), false);
  assert.equal(bossFinDesBossAtteinteSorealIdle_(301), true);
  assert.equal(bossFinDesBossAtteinteSorealIdle_(5000), true);
  assert.equal(regenBossSecondeSorealIdle_(301, 420), 420 * 50);
});

test("le moteur ferme le combat, le Nuke et la definition apres le dernier boss", () => {
  const boss = lireSrc("idle-runtime-boss.js");
  assert.ok(/NONE \(YOU KILLED THEM ALL\)/.test(boss) && /BOSS_FIN_PV_V1=420/.test(boss) && /BOSS_FIN_ATTAQUE_DEFENSE_V1=69/.test(boss));
  assert.ok(/if \(bossFinDesBossAtteinteSorealIdle_\(n\)\) \{\s*return \{/.test(boss), "definitionBossSorealIdle_ doit renvoyer le boss de fin");
  const combat = lireSrc("idle-runtime-combat.js");
  assert.ok(/if \(bossFinDesBossAtteinteSorealIdle_\(bossVaincus\)\) break;/.test(combat), "le Nuke doit s'arreter apres le dernier boss");
  assert.ok(/if \(bossFinDesBossAtteinteSorealIdle_\(bossIndex\)\) return \{ok:true,actif:false,ignore:true,finDesBoss:true/.test(combat), "aucun combat ne doit demarrer apres le dernier boss");
});
