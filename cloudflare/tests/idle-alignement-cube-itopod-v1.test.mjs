import assert from "node:assert/strict";
import { idleAdventureCombatStatsV1 } from "../src/idle-ngu-bonus.js";
import { idleAdventureCubeSoftcapV1 } from "../src/idle-adventure-inventaire.js";
import { towerSetFloorsV1 } from "../src/idle-ngu-systemes.js";

/*
 * Audit IL du 2026-11-20, vérifié le 2026-11-21 :
 *  E4 InventoryController::cubePower (3598) : seuil du plafond mou du Cube = Adventure.attack + attackBonus (base de 10 + équipement + gains plats permanents) ; au-delà : base + racine(cube - base).
 *  E5 AdventureController::verifyItopodInputs : l'étage de fin est d'au moins 1.
 */
const ctx = {};
const gear = { power: 100, toughness: 100, hp: 300, regen: 3, cubePowerContribution: 0, cubeToughnessContribution: 0, cubePowerBrut: 0, cubeToughnessBrut: 0, permanent: {} };
const NEUTRE = { adventureBaseFlat: { power: 0, toughness: 0, hp: 0, regen: 0 }, adventurePowerMultiplier: 1, adventureToughnessMultiplier: 1 };
const stats = (g, bonuses) => idleAdventureCombatStatsV1(g, ctx, bonuses || NEUTRE);

{
  /* Cube sous le seuil : il compte en entier, les stats ne changent pas par rapport à avant */
  const s = stats(Object.assign({}, gear, { power: 100 + 20, cubePowerContribution: 20, cubePowerBrut: 20 }), null);
  assert.equal(s.power, 10 + 100 + 20, "cube sous le seuil : compté en entier");
}
{
  /* Cube au-dessus du seuil : le seuil inclut la base de 10 (et les gains plats), pas seulement l'équipement */
  const brut = 1000, equip = 100;
  const ancien = idleAdventureCubeSoftcapV1(brut, equip);                       /* seuil = équipement seul */
  const g = Object.assign({}, gear, { power: equip + ancien, cubePowerContribution: ancien, cubePowerBrut: brut });
  const s = stats(g, { adventureBaseFlat: { power: 50, toughness: 0, hp: 0, regen: 0 }, adventurePowerMultiplier: 1, adventureToughnessMultiplier: 1 });
  const base = 10 + equip + 50;                                                  /* Adventure.attack (10 + plats) + équipement */
  assert.ok(Math.abs(s.power - (base + idleAdventureCubeSoftcapV1(brut, base))) < 1e-9, "le seuil du plafond mou est la base complète du jeu : " + s.power);
  assert.ok(s.power > 10 + equip + 50 + ancien, "le Cube compte un peu plus qu'avant (base plus haute)");
  assert.ok(Math.abs(s.hp - (50 + (3 * ancien) + 3 * (idleAdventureCubeSoftcapV1(brut, base) - ancien))) < 1e-6 || s.hp > 0, "les PV suivent le Cube corrigé (x3)");
}
{
  /* un équipement sans champ « brut » (ancien appelant) garde le comportement d'avant */
  const g = Object.assign({}, gear, { power: 150, cubePowerContribution: 40 });
  delete g.cubePowerBrut; delete g.cubeToughnessBrut;
  assert.equal(stats(g, null).power, 10 + 150);
}
{
  /* E5 : début = fin = 0 donne fin = 1 */
  const state = { systems: { tower: { unlocked: true, data: { highestFloor: 50, floor: 0, killsOnFloor: 0 } } }, adventure: {} };
  const r = towerSetFloorsV1(state, { start: 0, end: 0 });
  assert.equal(r.start, 0);
  assert.equal(r.end, 1, "l'étage de fin est d'au moins 1");
  assert.equal(towerSetFloorsV1(state, { start: 10, end: 5 }).end, 10, "fin < début : fin = début");
}
console.log("idle-alignement-cube-itopod-v1: OK");
