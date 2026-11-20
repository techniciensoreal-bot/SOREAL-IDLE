import assert from "node:assert/strict";
import "../src/idle-sqlite-runtime.js";
import { normalizeIdleNguState, idleNguBonuses } from "../src/idle-ngu-progression.js";
import { multiplicateursCombatSorealIdle_ } from "../src/idle-runtime-boss.js";
import { nguBossStatsV1 } from "../src/idle-ngu-boss-reference-v1.js";

/* Audit IL 2026-11-20 (Character::totalAttack 2133 / totalDefense 2134 / difficultyModifier 2139 ; BossController::advanceBoss 1546) : en Evil et Sadistic le JOUEUR est divisé par 1e30 (plancher final 100), le boss ne l'est jamais. */
const ctx = { adventurePower: 1e6, adventureToughness: 1e6, bosses: 100 };
const etat = (difficulte) => { const s = normalizeIdleNguState({}, ctx, 1_000_000); s.difficulty = difficulte; return s; };

assert.equal(idleNguBonuses(etat("normal")).difficultyDivider, 1);
assert.equal(idleNguBonuses(etat("difficile")).difficultyDivider, 1e30, "Evil : joueur divisé par 1e30");
assert.equal(idleNguBonuses(etat("extreme")).difficultyDivider, 1e30, "Sadistic : même diviseur, jamais cumulé");

{
  const n = multiplicateursCombatSorealIdle_(idleNguBonuses(etat("normal")), 100);
  const e = multiplicateursCombatSorealIdle_(idleNguBonuses(etat("difficile")), 100);
  assert.ok(Math.abs(e.attaque * 1e30 / n.attaque - 1) < 1e-9, "multiplicateur d'attaque divisé par 1e30 en Evil");
  assert.ok(Math.abs(e.defensePost * 1e30 / n.defensePost - 1) < 1e-9, "part « post » divisée aussi (le 100 naturel l'est)");
}

for (const i of [0, 20, 200]) {
  const n = nguBossStatsV1(i, "normal"), e = nguBossStatsV1(i, "difficile"), s = nguBossStatsV1(i, "extreme");
  assert.deepEqual(e, n, "boss " + (i + 1) + " : Evil = Normal (le boss n'est jamais divisé)");
  assert.deepEqual(s, n, "boss " + (i + 1) + " : Sadistic = Normal");
}
console.log("idle-evil-sadistic-joueur-divise-v1: OK");
