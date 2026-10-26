import assert from "node:assert/strict";
import { normalizeIdleAdventureStateV47, idleAdventureSnapshotV47 } from "../src/idle-adventure-v47.js";

/* Le Flubber solitaire (tombé au début du jeu, taux de butin mal réglé) repart à zéro, une seule fois, s'il n'est possédé nulle part (Norman, 2026-10-26). */
const ctx = { bosses: 300 };
const vieux = () => { const s = normalizeIdleAdventureStateV47({}); delete s.flubberRemisAZeroV1; return s; };
const avecFlubber = (s) => { s.itemList.flubber = { seen: true, maxLevel: 10, fullyMaxed: false }; return normalizeIdleAdventureStateV47(JSON.parse(JSON.stringify(s))); };

// 1. vu mais possédé nulle part : remis à zéro
let a = avecFlubber(vieux());
assert.equal(a.itemList.flubber, undefined, "statistique remise à zéro");
assert.equal(a.flubberRemisAZeroV1, true);
assert.ok(!idleAdventureSnapshotV47(a, ctx, 1000).coffreSlots.some((c) => c.definitionId === "flubber" && c.connu), "plus de case connue pour le Flubber");

// 2. une seule fois : un vrai butin ultérieur n'est jamais effacé
a.itemList.flubber = { seen: true, maxLevel: 10, fullyMaxed: false };
a = normalizeIdleAdventureStateV47(JSON.parse(JSON.stringify(a)));
assert.ok(a.itemList.flubber && a.itemList.flubber.seen, "après la remise à zéro, un vrai butin reste");

// 3. possédé (sac) : intouché
let b = vieux(); b.itemList.flubber = { seen: true, maxLevel: 10 };
b.inventory.push({ id: "fl1", definitionId: "flubber", level: 10, kind: "special", slot: "accessory", name: "The Lonely Flubber" });
b = normalizeIdleAdventureStateV47(JSON.parse(JSON.stringify(b)));
if (b.inventory.some((o) => o.definitionId === "flubber")) assert.ok(b.itemList.flubber, "Flubber dans le sac : on ne touche à rien");

// 4. les autres objets ne bougent jamais
let c = vieux(); c.itemList.pissedOffKey = { seen: true, maxLevel: 20 }; c.itemList.flubber = { seen: true, maxLevel: 10 };
c = normalizeIdleAdventureStateV47(JSON.parse(JSON.stringify(c)));
assert.ok(c.itemList.pissedOffKey && c.itemList.pissedOffKey.seen, "seul le Flubber est concerné");
console.log("idle-flubber-remis-a-zero-v1: OK");
