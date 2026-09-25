import assert from "node:assert/strict";
import { normalizeIdleNguState, advanceIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/*
 * 2026-09-24 -- audit de composition, pages Wishes / Money Pit : souhait 4 « I wish money Pit
 * didn't suck » : « (Also maxes your money pit Wandoos level if it's not yet at level 100.) ».
 */
const ctx = { bosses: 58, bestGold: 1e6, adventurePower: 1e9 };
const w = normalizeIdleNguState({ difficulty: "difficile" }, ctx, 0); /* souhait 4 = Evil ; Wandoos y est ralenti de 1e12 */
w.systems.wandoos.unlocked = true;
w.systems.wandoos.allocation.energy = 1e18; /* 1e6 x 1e12 (ralentissement Evil) : vitesse de base 0,05 niveau/s */
const NOW = 10 * 3600 * 1000; /* 10 h apres le debut du run : boot termine */
const total = (x) => x.systems.wandoos.data.dumpEnergyLevel + x.systems.wandoos.data.dumpEnergyProgress;
const sans = total(advanceIdleNguState(w, 100, ctx, NOW));
w.systems.wishes.data.tracks["4"].level = 1;
const avec = total(advanceIdleNguState(w, 100, ctx, NOW));
assert.ok(Math.abs(sans - 5) < 1e-6, `niveau d'OS 0 : ${sans}`);
assert.ok(Math.abs(avec - 505) < 1e-6, `niveau d'OS 100 -> vitesse x101 : ${avec}`);
void applyIdleNguAction;
console.log("idle-wish4-wandoos-money-pit-level: OK");
