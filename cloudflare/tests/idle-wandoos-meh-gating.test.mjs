import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/* 2026-09-23 (wiki Wandoos) : Wandoos MEH se débloque avec le set Jake ; le niveau d'OS multiplie la vitesse par (niveau + 1). */
const base = () => {
  const s = normalizeIdleNguState({}, { bosses: 100 }, 1_000_000);
  s.systems.wandoos.unlocked = true;
  return s;
};
assert.throws(() => applyIdleNguAction(base(), { action: "selectWandoosOs", os: "meh" }, { bosses: 100 }, 2_000_000), /OS_VERROUILLE/);
{
  const s = base();
  s.adventure.setRewards.wandoosMeh = true;
  const r = applyIdleNguAction(s, { action: "selectWandoosOs", os: "meh" }, { bosses: 100 }, 2_000_000);
  assert.equal(r.state.systems.wandoos.data.os, "meh");
}
console.log("idle-wandoos-meh-gating ok");
