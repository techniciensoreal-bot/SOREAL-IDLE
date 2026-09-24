import assert from "node:assert/strict";
import { normalizeIdleNguState, rebirthIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * 2026-09-24 -- audit de composition, page « Rebirths », « Sneaky Secret about
 * Rebirthing » : « Rebirthing 3 times in a row (each under 30 minutes long and
 * each defeating boss 37+) Rewards the player with a special, one-time bonus of :
 * 200 EXP, 1 Energy Power ». Jamais implemente jusqu'ici.
 */
const MIN = 60 * 1000;
let t = 0;
function run(state, minutes, bosses) {
  t += minutes * MIN;
  return rebirthIdleNguState(state, { bosses }, t);
}
let s = normalizeIdleNguState({}, { bosses: 40 }, 0);
const power0 = s.resources.energy.power;
const exp0 = s.currencies.experience;

s = run(s, 10, 40);
s = run(s, 10, 40);
assert.equal(s.currencies.experience, exp0, "2 Rebirths : pas encore");
s = run(s, 10, 40);
assert.equal(s.currencies.experience, exp0 + 200, "3e Rebirth de suite : +200 EXP");
assert.equal(s.resources.energy.power, power0 + 1, "+1 Energy Power");
assert.equal(s.records.quickRebirthSecretClaimed, 1);

/* Une seule fois. */
s = run(s, 10, 40); s = run(s, 10, 40); s = run(s, 10, 40);
assert.equal(s.currencies.experience, exp0 + 200);
assert.equal(s.resources.energy.power, power0 + 1);

/* Un Rebirth trop long (>= 30 min) ou sans le boss 37 casse la serie. */
{
  let x = normalizeIdleNguState({}, { bosses: 40 }, 0);
  t = 0;
  x = run(x, 10, 40);
  x = run(x, 31, 40); /* 31 min : serie cassee */
  x = run(x, 10, 40);
  x = run(x, 10, 40);
  assert.equal(x.currencies.experience, exp0, "serie interrompue : rien");
  x = run(x, 10, 40);
  assert.equal(x.currencies.experience, exp0 + 200, "3 de suite apres l'interruption");
}
{
  let x = normalizeIdleNguState({}, { bosses: 40 }, 0);
  t = 0;
  x = run(x, 10, 40);
  x = run(x, 10, 36); /* boss 37 non vaincu */
  x = run(x, 10, 40);
  x = run(x, 10, 40);
  assert.equal(x.currencies.experience, exp0);
}
console.log("idle-rebirth-quick-secret: OK");
