import assert from "node:assert/strict";
import { normalizeIdleNguState, idleNguBonuses } from "../src/idle-ngu-progression.js";

/* 2026-09-23 : les Diggers PP et Blood (wiki Gold Diggers) étaient calculés mais jamais lus. */
const s = normalizeIdleNguState({}, { bosses: 100 }, 1_000_000);
s.systems.diggers.unlocked = true;
s.systems.diggers.data.diggers.pp.active = true;
s.systems.diggers.data.diggers.pp.runLevel = 10;
s.systems.diggers.data.diggers.pp.maxLevel = 10;
s.systems.diggers.data.diggers.blood.active = true;
s.systems.diggers.data.diggers.blood.runLevel = 10;
s.systems.diggers.data.diggers.blood.maxLevel = 10;
const b = idleNguBonuses(s);
assert.ok(b.ppMultiplier > 1, "Digger PP : (110 + niveau) x bonus global %");
console.log("idle-diggers-pp-blood ok");
