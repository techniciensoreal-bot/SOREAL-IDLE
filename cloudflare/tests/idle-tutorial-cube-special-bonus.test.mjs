import assert from "node:assert/strict";
import {
  normalizeIdleAdventureStateV47,
  applyIdleAdventureActionV47,
  IDLE_ADVENTURE_SPECIALS
} from "../src/idle-adventure-v47.js";

/*
 * Audit wiki NGU 2026-09-18, PISTE 1 : page
 * ngu-idle.fandom.com/wiki/4G%27s_Merge_and_Boost_Tutorial_Cube vérifiée
 * en direct (navigateur), section "Specials" : "Energy Speed -- Base
 * value: 5% -- Max stat at lvl 0: 15% -- Max stat at max lvl: 30%". Avant
 * ce correctif, SPECIALS.tutorialCube n'avait aucun champ pour cette
 * magnitude (seulement p:7,t:7) et le boost "special" n'était jamais
 * plafonné pour aucun objet (Norman 2026-09-16, "Sébastien a toujours le
 * boost spécial..." -- corrigé alors uniquement pour EMPÊCHER de cibler
 * une arme/armure, pas pour PLAFONNER un vrai SPECIALS comme le cube).
 */

// --- Le catalogue doit porter la magnitude wiki-sourcée ---
{
  const d = IDLE_ADVENTURE_SPECIALS.tutorialCube;
  assert.equal(d.sBase, 5, "wiki : Energy Speed Base value 5%.");
  assert.equal(d.sMax, 15, "wiki : Energy Speed Max stat at lvl 0 = 15%.");
}

// --- Un Tutorial Cube fraîchement créé démarre à sa vraie base wiki (5), pas 0 (contrairement à Power/Toughness qui, eux, démarrent bien à 0 -- wiki "Base value: 0" pour ces deux stats) ---
{
  let s = normalizeIdleAdventureStateV47({});
  s.inventory = s.inventory.filter((i) => i.definitionId !== "tutorialCube");
  const r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "tutorialCube", level: 0 }, { bosses: 17 }, 1);
  const cube = r.state.inventory.find((i) => i.definitionId === "tutorialCube");
  assert.ok(cube, "Le Tutorial Cube doit avoir été créé.");
  assert.equal(cube.power, 0, "Power démarre bien à 0 (wiki : Base value 0).");
  assert.equal(cube.toughness, 0, "Toughness démarre bien à 0 (wiki : Base value 0).");
  assert.equal(cube.special, 5, "Energy Speed démarre à 5 (wiki : Base value 5%), PAS 0 -- seule stat de cet objet avec un plancher non nul.");
}

// --- Un boost "special" doit être plafonné à sMax au niveau 0 (15), jamais illimité ---
{
  let s = normalizeIdleAdventureStateV47({});
  s.inventory = s.inventory.filter((i) => i.definitionId !== "tutorialCube");
  let r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "tutorialCube", level: 0 }, { bosses: 17 }, 1);
  s = r.state;
  const cubeId = s.inventory.find((i) => i.definitionId === "tutorialCube").id;

  // Boost special énorme (strength 100) -- doit être écrêté à 15, jamais dépasser.
  const boostId = "test-tutorial-cube-special-boost";
  s.inventory.push({ id: boostId, definitionId: "boost:special:100", name: "Boost special 100", kind: "boost", boostType: "special", strength: 100, level: 0 });
  const boosted = applyIdleAdventureActionV47(s, { action: "boost", boostId, targetId: cubeId }, { bosses: 17 }, 1);
  const cube = boosted.state.inventory.find((i) => i.definitionId === "tutorialCube");
  assert.equal(cube.special, 15, "Un boost special, même énorme, ne doit jamais dépasser le plafond wiki de 15% au niveau 0 (avant ce correctif : illimité).");
}

/*
 * Niveau 99, pas 100 : à MAX (100), record() transforme immédiatement le
 * Tutorial Cube en Cube de l'Infini débloqué (retiré de l'inventaire, cf.
 * idle-adventure-v47.js ~1200 "tutorialCubeMaxed") -- un objet discret
 * n'existe donc plus pour vérifier son plafond exactement à 100. Niveau 99
 * suffit à prouver la même formule q=1+niveau/100 (15×1.99=29.85).
 */
{
  let s = normalizeIdleAdventureStateV47({});
  s.inventory = s.inventory.filter((i) => i.definitionId !== "tutorialCube");
  let r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "tutorialCube", level: 99 }, { bosses: 17 }, 1);
  s = r.state;
  const cubeId = s.inventory.find((i) => i.definitionId === "tutorialCube").id;

  const boostId = "test-tutorial-cube-special-boost-lvl99";
  s.inventory.push({ id: boostId, definitionId: "boost:special:100", name: "Boost special 100", kind: "boost", boostType: "special", strength: 100, level: 0 });
  const boosted = applyIdleAdventureActionV47(s, { action: "boost", boostId, targetId: cubeId }, { bosses: 17 }, 1);
  const cube = boosted.state.inventory.find((i) => i.definitionId === "tutorialCube");
  assert.equal(cube.special, 15 * 1.99, "Formule q=1+niveau/100 : 15×(1+99/100)=29.85, même doublement que Power/Toughness vers le plafond wiki de 30% à lvl 100.");
}

console.log("idle-tutorial-cube-special-bonus: OK");
