/* Audit du code du jeu (2026-11-16, quirks-questing.md, economie.md) : le beurre (usedButter) ne compte que pour les QP des titans 6 et Nerd (boss6QP, boss7QP : pas de division par butterModifier) ; les titans 8 à 12 et le Fruit of Quirks (consumeQPFruit) le divisent ; le Fruit of Quirks multiplie par questRewardFactor. */
import assert from "node:assert/strict";
import fs from "node:fs";
import { idleQuestButterEnCoursV1 } from "../src/idle-questing-v1.js";

const base = (over = {}) => ({ systems: { questing: { data: { quest: { major: true }, useButter: true, ...over } } }, selloutEffects: { beastButters: 2 }, adventure: {} });
assert.equal(idleQuestButterEnCoursV1(base()), 2, "quête en cours + beurre coché + stock : x2");
assert.equal(idleQuestButterEnCoursV1(base({ quest: null })), 1, "aucune quête en cours : pas de beurre");
assert.equal(idleQuestButterEnCoursV1(base({ useButter: false })), 1, "case décochée : pas de beurre");
const sans = base(); sans.selloutEffects.beastButters = 0;
assert.equal(idleQuestButterEnCoursV1(sans), 1, "plus de beurre en stock : pas de beurre");

const combat = fs.readFileSync(new URL("../src/idle-adventure-combat.js", import.meta.url), "utf8");
assert.ok(/id===\"t6\"\|\|id===\"nerd\"\)\?Math\.max\(1,N\(ctx&&ctx\.questButterFactor,1\)\):1/.test(combat), "seuls t6 et nerd reçoivent le beurre");
const sys = fs.readFileSync(new URL("../src/idle-ngu-systemes.js", import.meta.url), "utf8");
assert.equal((sys.match(/idleYggFruitOfQuirksQpV1\([^;]*questRewardFactorTitansV1\(state,\{\}\)/g) || []).length, 2, "Fruit of Quirks : QP et aperçu multiplient par questRewardFactor");
console.log("idle-beurre-titans-fruit-quirks-v1 ok");
