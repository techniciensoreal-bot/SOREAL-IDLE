import assert from "node:assert/strict";
import { IDLE_NGU_AUGMENTATIONS } from "../src/idle-ngu-progression.js";

/*
 * Wiki, page « Augmentations », tableau « Augment & Upgrade » (2026-09-24) : multiplicateur de base, coût de base en or du niveau 1,
 * temps de base (secondes, 1000 de cap, 1 de puissance, mode normal) et boss de déblocage des 6 Augmentations et de leurs 6 Upgrades.
 * Le wiki note certains multiplicateurs arrondis (« 976.563 M ») : tolérance de 1e-6 en relatif sur les valeurs arrondies.
 * Valeurs recopiées du wiki (fixtures) ; le moteur est lu via IDLE_NGU_AUGMENTATIONS.
 */
const WIKI = [
  // [id augment, id upgrade, mult., or aug, temps aug, boss aug, or upgrade, temps upgrade, boss upgrade]
  ["scissors", "dangerScissors", 1, 1e4, 400, 17, 1e7, 400, 37],
  ["milk", "drinkMilk", 25, 2e5, 6800, 18, 5e8, 4800, 40],
  ["cannon", "missileLauncher", 625, 4e6, 115600, 20, 2.5e10, 57600, 44],
  ["minigun", "actualAmmo", 15625, 8e7, 1965200, 24, 1.25e12, 691200, 46],
  ["buster", "chargeShot", 390625, 1.6e9, 33408400, 28, 6.25e13, 8294400, 48],
  ["exoskeleton", "energyShield", 976.563e6, 1.8e16, 46771760000, 56, 3.125e18, 6635520000, 56],
  ["laserSword", "quadLaser", 2.441e12, 2.3e19, 65480464000000, 68, 1.5625e20, 5308416000000, 68]
];
const close = (a, b) => Math.abs(a - b) <= Math.abs(b) * 1e-6;

assert.equal(IDLE_NGU_AUGMENTATIONS.length, WIKI.length, "7 paires Augment + Upgrade");
for (const [id, upId, mult, gold, seconds, boss, upGold, upSeconds, upBoss] of WIKI) {
  const a = IDLE_NGU_AUGMENTATIONS.find((x) => x.id === id);
  assert.ok(a, "augment absent : " + id);
  assert.equal(a.upgrade.id, upId, id + " : identifiant de l'upgrade");
  assert.ok(close(a.baseMultiplier, mult), id + " multiplicateur " + a.baseMultiplier + " contre " + mult);
  assert.ok(close(a.baseGold, gold), id + " or " + a.baseGold + " contre " + gold);
  assert.equal(a.baseSeconds, seconds, id + " temps de base");
  assert.equal(a.unlockBoss, boss, id + " boss de déblocage");
  assert.ok(close(a.upgrade.baseGold, upGold), upId + " or " + a.upgrade.baseGold + " contre " + upGold);
  assert.equal(a.upgrade.baseSeconds, upSeconds, upId + " temps de base");
  assert.equal(a.upgrade.unlockBoss, upBoss, upId + " boss de déblocage");
}

console.log("idle-wiki-table-augmentations: OK");
