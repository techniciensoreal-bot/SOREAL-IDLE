import assert from "node:assert/strict";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47, idleAdventureSnapshotV47 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-25) : « Dans le coffre au trésor de SOREAL IDLE, il faut un emplacement pour le Tutorial Cube (quand il est maxxé). »
 * Wiki (Infinity Cube) : « To unlock the Infinity Cube, the player must max out the 4G's Merge and Boost Tutorial Cube item to level 100 » : au niveau
 * 100 le Tutorial Cube devient le Cube de l'infini ; il n'est plus perdu, il est rangé dans sa case du Coffre.
 */
const ctx = { bosses: 20 };
const agir = (s, p) => applyIdleAdventureActionV47(s, p, ctx, 1000).state;
const case_ = (s) => idleAdventureSnapshotV47(s, ctx, 1000).coffreSlots.find((x) => x.definitionId === "tutorialCube");

// Tant qu'il n'est pas maxxé : aucune case (rien à deviner)
let s = normalizeIdleAdventureStateV47({});
assert.equal(case_(s), undefined, "pas de case avant d'avoir maxxé le Tutorial Cube");
assert.equal(s.cube.unlocked, false);

// Niveau 100 atteint : Cube de l'infini débloqué ET Tutorial Cube rangé dans sa case, pas perdu
s = agir(s, { action: "addItem", definitionId: "tutorialCube", level: 100 });
assert.equal(s.cube.unlocked, true, "le Cube de l'infini est débloqué");
assert.equal(s.inventory.some((o) => o.definitionId === "tutorialCube"), false, "plus de Tutorial Cube dans le sac");
assert.equal(case_(s).occupe, true, "case du Coffre remplie");
assert.equal(case_(s).name, "Tutorial Cube");
assert.equal(case_(s).item.level, 100);

// On peut le reprendre (le trophée n'est pas reversé une seconde fois ensuite)
const id = case_(s).item.id;
s = agir(s, { action: "coffreRetirer", id });
assert.equal(case_(s).occupe, false);
s = normalizeIdleAdventureStateV47(JSON.parse(JSON.stringify(s)));
assert.equal(case_(s).occupe, false, "pas de doublon recréé à la normalisation");

// Compte ayant transformé son Tutorial Cube avant l'existence de la case : trophée rangé une fois, au niveau maximum
let ancien = normalizeIdleAdventureStateV47({});
ancien.cube.unlocked = true;
ancien.unlockFlags.tutorialCubeMaxed = true;
ancien.inventory = [];
ancien = normalizeIdleAdventureStateV47(JSON.parse(JSON.stringify(ancien)));
assert.equal(case_(ancien).occupe, true, "ancien compte : Tutorial Cube maxxé rangé dans le Coffre");
assert.equal(case_(ancien).item.level, 100);
assert.equal(case_(ancien).item.power, 14, "Power maximum au niveau 100 (wiki : 14)");
assert.equal(case_(ancien).item.toughness, 14);

// Les autres objets spéciaux ne sont pas acceptés dans le Coffre
const slots = idleAdventureSnapshotV47(ancien, ctx, 1000).coffreSlots.map((x) => x.definitionId);
assert.equal(slots.filter((x) => !x.includes(":")).join(","), "tutorialCube");

console.log("idle-coffre-tutorial-cube-v1: OK");
