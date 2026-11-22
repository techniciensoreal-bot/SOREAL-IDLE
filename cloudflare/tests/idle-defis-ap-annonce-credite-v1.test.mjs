import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";
import { apWithBonusV1, apBonusMultiplierV1 } from "../src/idle-ngu-bonus.js";

/* L'AP annoncé d'un défi = l'AP crédité (Character::checkAPAdded, build 1260) : base majorée par le bonus AP commun ; apBase = la base brute. */
const ctx = { bosses: 100 };
let s = normalizeIdleNguState({}, ctx, 1_000_000);
s.difficulty = "difficile"; s.systems.challenges.unlocked = true; s.records.highestBoss = 100;
const def = idleNguSnapshot(s, ctx, 2_000_000).challengeDefinitions.find(d => d.id === "basic");
assert.equal(def.reward.apBase, 500, "base brute conservée");
assert.ok(def.reward.ap >= 500, "AP annoncé = AP majoré (jamais sous la base)");
assert.equal(def.reward.experience, 15000, "l'EXP annoncée reste la base");
s = applyIdleNguAction(s, { action: "challenge", mode: "start", challenge: "basic" }, ctx, 2_000_000).state;
const apAvant = s.currencies.ap;
const fin = applyIdleNguAction(s, { action: "challenge", mode: "complete", challenge: "basic" }, ctx, 2_100_000);
const gagne = fin.state.currencies.ap - apAvant;
assert.equal(fin.result.reward.ap, gagne, "AP renvoyé = AP crédité");
assert.ok(apBonusMultiplierV1(s) >= 1);
console.log("idle-defis-ap-annonce-credite-v1 OK");
