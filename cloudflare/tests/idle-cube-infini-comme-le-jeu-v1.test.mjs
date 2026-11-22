import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import "../src/idle-adventure-v47.js";   // ordre d'import (dépendances circulaires)
import { cube, cubeDirect } from "../src/idle-adventure-inventaire.js";

/*
 * Norman (2026-11-22) : « vérifie si les chiffres du cube de l'infini sont corrects, si les % s'appliquent aux boosts avalés par le cube ; il faut que ce soit comme le jeu ».
 * Jeu (ItemNameDesc::cubeFilter / InventoryController::infinityCubeBoost, IL build 1260) : gain = capAttack (ou capDefense, ou spec1Cap pour un Special) x boostBonus / diviseur, diviseur = (100, ou 50 avec le perk 26) / min(2, effet du souhait 110) ; un Special est divisé par 2 sur chaque stat ;
 * boostBonus (AllItemListController::boostBonus) = (1 + 0,02 x boosts maxés) x 1,2 (Badly Drawn) x 1,2 (Construction) x Boosted Boosts (perks 12, 33, 107, 229, 230) x Beasted Boosts (quirks 11, 53, 72, 73). Les % sont donc appliqués au boost AVALÉ, au moment où il l'est.
 */
function etat(over) {
  return Object.assign({ inventory: [], cube: { power: 0, toughness: 0, unlocked: true }, setRewards: { boostCompletions: 10 }, completedSets: { badly: true, construction: true }, recentClientMutations: [] }, over || {});
}
const boostBonus = (1 + 0.02 * 10) * 1.2 * 1.2;
const ctx = { boostPowerMultiplier: 2, cubeBoostRate: 0.02, cubeBoostEffectiveness: 1.5 };   // perk 26 (1/50), perks/quirks de boost x2, souhait 110 niveau 10 (x1,5)
const attendu = (force) => force * boostBonus * 2 * 0.02 * 1.5;

let s = etat({ inventory: [{ id: "p", kind: "boost", boostType: "power", strength: 100 }] });
cube(s, "p", ctx);
assert.ok(Math.abs(s.cube.power - attendu(100)) < 1e-9, "Power : capAttack x boostBonus / diviseur");
assert.equal(s.cube.toughness, 0);

s = etat({ inventory: [{ id: "t", kind: "boost", boostType: "toughness", strength: 100 }] });
cube(s, "t", ctx);
assert.ok(Math.abs(s.cube.toughness - attendu(100)) < 1e-9 && s.cube.power === 0, "Toughness : même formule sur la robustesse");

s = etat({ inventory: [{ id: "s", kind: "boost", boostType: "special", strength: 100 }] });
cube(s, "s", ctx);
assert.ok(Math.abs(s.cube.power - attendu(100) / 2) < 1e-9 && Math.abs(s.cube.toughness - attendu(100) / 2) < 1e-9, "Special : moitié sur chaque stat");

// Hors ligne : kills / 8 boosts « Special » (Character::adventureOfflineProgress), mêmes % appliqués
s = etat();
cubeDirect(s, 100, 80, ctx);
assert.ok(Math.abs(s.cube.power - (attendu(100) / 2) * 10) < 1e-9, "cube direct : kills / 8 x la valeur d'un Special");

// Sans achat du perk 26 ni souhait : 1 % (diviseur 100)
s = etat({ inventory: [{ id: "p", kind: "boost", boostType: "power", strength: 100 }] });
cube(s, "p", { boostPowerMultiplier: 1, cubeBoostRate: 0.01, cubeBoostEffectiveness: 1 });
assert.ok(Math.abs(s.cube.power - 100 * boostBonus * 0.01) < 1e-9, "de base : 1 % de la valeur totale");

// Un boost filtré est versé dans le Cube même avant d'avoir trouvé le Cube (ItemNameDesc::cubeFilter n'exige que « Filter Boosts into Infinity Cube! »)
const src = readFileSync(new URL("../src/idle-inventory-auto-v1.js", import.meta.url), "utf8");
assert.ok(!/filterBoostsIntoCube && s\.cube\?\.unlocked/.test(src), "plus de condition « cube débloqué » pour verser un boost filtré dans le cube");
console.log("idle-cube-infini-comme-le-jeu-v1: OK");
