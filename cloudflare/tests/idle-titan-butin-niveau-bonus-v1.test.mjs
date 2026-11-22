import assert from "node:assert/strict";
import fs from "node:fs";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";

/* Butin des titans : LootDrop::titanLevelBonus (IL build 1260) ajouté aux objets spéciaux (makeTitanLevelledLoot) ;
 * exceptions : makeTitanLoot (niveau 0), niveaux fixes. Loi du Wandoos 98 du Grand Corrupted Tree ; Calculatrice à 0,00023. */
function combat(etat, id, ctx, suite, t = 1000) {
  const avant = Math.random; let i = 0;
  Math.random = () => suite[Math.min(i++, suite.length - 1)];
  try { return applyIdleAdventureActionV47(etat, { action: "titan", titan: id }, ctx, t); } finally { Math.random = avant; }
}
const copies = (r, id) => r.result.drops.filter((d) => d.definitionId === id);

// GCT : Wandoos 98 : jet < 0,2 = 4 à 7, sinon 3 à 7 (aléa constant : 0 -> 4, .999 -> 7), plus le bonus.
for (const [bonus, jet, lvl] of [[0, 0, 4], [0, .999, 7], [1, 0, 5], [1, .999, 8]]) {
  const etat = normalizeIdleAdventureStateV47({});
  etat.titans.t1 = { kills: 24, nextAt: 0 }; etat.unlockFlags.ngu = true;
  const r = combat(etat, "t2", { bosses: 66, stats: { power: 6000, toughness: 5000 }, titanLootLevelBonus: bonus }, [jet]);
  assert.equal(copies(r, "wandoos98")[0].level, lvl, `GCT bonus ${bonus} jet ${jet}`);
}
// GRB : A Number niveau 0 sans bonus ; Wandoos 98 hors branche à 20 % = niveau 1 fixe.
{
  const r = combat(normalizeIdleAdventureStateV47({}), "t1", { bosses: 58, stats: { power: 1300, toughness: 1300 }, titanLootLevelBonus: 1 }, [.999999]);
  assert.equal(copies(r, "aNumber")[0].level, 0, "A Number : makeTitanLoot, sans bonus");
  assert.equal(copies(r, "wandoos98")[0].level, 1, "Wandoos 98 GRB : niveau 1 fixe sans bonus");
}
const src = fs.readFileSync(new URL("../src/idle-adventure-combat.js", import.meta.url), "utf8");
assert.match(src, /objetB\("stapler",4\)/); assert.match(src, /objetB\("ascendedForestPendant",50\)/);
assert.match(src, /\["ordinaryCalculator",4,\.00023,\.25\]/); assert.match(src, /\["animeFigurine",4,\.00035,\.25\]/);
assert.match(src, /objet\("severedUnicornHead",1\)/); assert.match(src, /canneWalderpV1\(bonus=0\)/);
assert.match(src, /const objetB=/); assert.ok(src.includes("chance(.2)?4+I(Math.random()*4):3+I(Math.random()*5)"));
console.log("idle-titan-butin-niveau-bonus-v1 OK");
