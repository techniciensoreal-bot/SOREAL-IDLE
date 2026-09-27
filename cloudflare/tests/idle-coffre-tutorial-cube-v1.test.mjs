import assert from "node:assert/strict";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47, idleAdventureSnapshotV47 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-27, revient sur son choix du 2026-09-25) : « Quand le tutorial cube s'est
 * transformé en infinity cube, le tutorial cube s'est directement rangé dans le coffre ? En
 * vrai, je voudrais qu'il disparaisse et qu'il ne soit plus possible de le looter à partir de
 * ce moment-là. Il n'y a plus que l'infinity cube. Pareil pour le rangement coffre. Il ne doit
 * même pas y avoir la place pour le tutorial cube. »
 * (L'ancienne version de ce test, du 2026-09-25, vérifiait le comportement inverse -- un
 * trophée rangé dans une case dédiée du Coffre -- explicitement retiré par cette demande.)
 */
const ctx = { bosses: 20 };
const agir = (s, p) => applyIdleAdventureActionV47(s, p, ctx, 1000).state;
const case_ = (s) => idleAdventureSnapshotV47(s, ctx, 1000).coffreSlots.find((x) => x.definitionId === "tutorialCube");

// Tant qu'il n'est pas maxxé : aucune case, comme avant.
let s = normalizeIdleAdventureStateV47({});
assert.equal(case_(s), undefined, "pas de case avant d'avoir maxxé le Tutorial Cube");
assert.equal(s.cube.unlocked, false);

// Niveau 100 atteint : Cube de l'infini débloqué, le Tutorial Cube disparaît -- AUCUNE case ne lui est jamais réservée.
s = agir(s, { action: "addItem", definitionId: "tutorialCube", level: 100 });
assert.equal(s.cube.unlocked, true, "le Cube de l'infini est débloqué");
assert.equal(s.inventory.some((o) => o.definitionId === "tutorialCube"), false, "plus de Tutorial Cube dans le sac");
assert.equal(s.equipment.accessories.length, 0, "plus de Tutorial Cube équipé");
assert.equal(case_(s), undefined, "aucune case de Coffre pour le Tutorial Cube, même une fois maxé");
assert.equal(s.coffre.tutorialCube, undefined, "rien n'est rangé dans le Coffre");

// Une sauvegarde qui portait déjà l'ancien trophée (posé par la version du 2026-09-25) le perd à la normalisation, sans jamais lui redonner de case.
let ancien = normalizeIdleAdventureStateV47({});
ancien.cube.unlocked = true;
ancien.unlockFlags.tutorialCubeMaxed = true;
ancien.unlockFlags.tutorialCubeCoffreV1 = true;
ancien.coffre.tutorialCube = { id: "iOld1", definitionId: "tutorialCube", level: 100 };
ancien.inventory = [];
ancien = normalizeIdleAdventureStateV47(JSON.parse(JSON.stringify(ancien)));
assert.equal(ancien.coffre.tutorialCube, undefined, "l'ancien trophée est retiré à la normalisation");
assert.equal(case_(ancien), undefined, "toujours aucune case, une fois la migration inverse appliquée");

// Plus aucun objet spécial (kind "cube"/"special") n'a de case dédiée -- le Coffre n'accepte plus que l'équipement.
const slots = idleAdventureSnapshotV47(ancien, ctx, 1000).coffreSlots.map((x) => x.definitionId);
assert.equal(slots.filter((x) => !x.includes(":")).length, 0, "aucune case hors équipement (\"set:slot\") dans le Coffre");

console.log("idle-coffre-tutorial-cube-v1: OK");
