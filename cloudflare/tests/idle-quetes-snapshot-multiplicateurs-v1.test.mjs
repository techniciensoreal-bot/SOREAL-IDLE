import assert from "node:assert/strict";
import { idleQuestingSnapshotV1, idleQuestQpMultiplierV1, idleQuestBonusTotalsV1, IDLE_QUEST_ACTIVE_REWARD_FACTOR_V1 } from "../src/idle-questing-v1.js";

/* Le snapshot expose qpMultiplier, activeRewardMultiplier et dropMultiplier (affichage de la page Quêtes). */
const state = { systems: { questing: { unlocked: true, data: {} } }, adventure: { completedSets: {} }, bonuses: {}, selloutEffects: {}, selloutShop: {} };
const snap = idleQuestingSnapshotV1(state, {});
assert.equal(snap.unlocked, true);
assert.equal(snap.qpMultiplier, idleQuestQpMultiplierV1(state, {}));
assert.equal(snap.activeRewardMultiplier, IDLE_QUEST_ACTIVE_REWARD_FACTOR_V1 * idleQuestBonusTotalsV1(state).activeRewardMultiplier);
assert.ok(snap.activeRewardMultiplier >= 2);
assert.equal(typeof snap.dropMultiplier, "number");
console.log("idle-quetes-snapshot-multiplicateurs-v1 OK");
