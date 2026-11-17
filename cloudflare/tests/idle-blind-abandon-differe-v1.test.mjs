/* lu dans le jeu, build 1260, 2026-11-17 : AllChallengesController::quitChallenge (défi Blind : abandon différé de 180 s, delayedBlindQuit). */
import assert from "node:assert/strict";
import { challengeAction, autoCompleteChallengeV1 } from "../src/idle-ngu-snapshot.js";

const T0 = 1_000_000_000_000;
const mk = (active) => ({ systems: { challenges: { unlocked: true } }, challenge: { active, activeTier: "normal", startedAt: T0, completions: {} } });

const b = mk("blind");
const r = challengeAction(b, { mode: "stop" }, {}, T0 + 1000);
assert.equal(r.differe, true, "Blind : l'abandon est différé");
assert.equal(b.challenge.active, "blind", "toujours en défi juste après la demande");
autoCompleteChallengeV1(b, { bosses: 0 }, T0 + 1000 + 179_000);
assert.equal(b.challenge.active, "blind", "toujours en défi à 179 s");
challengeAction(b, { mode: "stop" }, {}, T0 + 1000 + 100_000);   /* nouvelle demande : repart de zéro (CancelInvoke puis Invoke) */
autoCompleteChallengeV1(b, { bosses: 0 }, T0 + 1000 + 100_000 + 179_000);
assert.equal(b.challenge.active, "blind", "la nouvelle demande a repoussé l'échéance");
autoCompleteChallengeV1(b, { bosses: 0 }, T0 + 1000 + 100_000 + 180_000);
assert.equal(b.challenge.active, "", "abandonné à +180 s");
assert.equal(b.challenge.blindQuitAt, undefined);

const n = mk("noAugs");
assert.equal(challengeAction(n, { mode: "stop" }, {}, T0 + 1000).stopped, true, "les autres défis s'abandonnent tout de suite");
console.log("idle-blind-abandon-differe-v1 OK");
