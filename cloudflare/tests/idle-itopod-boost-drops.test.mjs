import assert from "node:assert/strict";
import { normalizeIdleNguState, advanceIdleNguState } from "../src/idle-ngu-progression.js";

/* 2026-09-23 (wiki ITOPOD) : 14 % de chance par kill de lâcher un boost de niveau 1, force selon le palier. */
const ctx = { adventurePower: 1e6, adventureToughness: 1e6, bosses: 100 };
let s = normalizeIdleNguState({}, ctx, 1_000_000);
s.systems.tower.unlocked = true;
s.systems.tower.active = true;
s.adventure.inventory = s.adventure.inventory.filter(i => i.kind !== "boost");
const avant = s.adventure.inventory.length;
s = advanceIdleNguState(s, 5 * 100, ctx, 2_000_000); // 100 kills à 5 s
const boosts = s.adventure.inventory.filter(i => i.kind === "boost");
assert.equal(s.systems.tower.data.kills, 100);
assert.equal(boosts.length, 14, "100 kills x 14 % = 14 boosts");
assert.ok(boosts.every(b => b.level === 1), "les boosts de l'ITOPOD sont de niveau 1");
assert.ok(boosts.every(b => b.strength >= 1 && b.strength <= 2), "palier 1 : boosts 1 (étage 0-9) puis 1 ; jamais plus fort");
console.log("idle-itopod-boost-drops ok");
