import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-10-10) : quand l'Or manque pour deux pistes d'Augmentations dont les barres sont pleines, c'est la moins chère (prochain niveau) qui doit prendre le niveau, pas la première de la liste.
 */
const ctx = { bosses: 120, bestGold: 1e15, adventurePower: 1e9 };
const T = 1_000_000;
function depart() {
  let s = normalizeIdleNguState({}, ctx, T);
  s.systems.augmentations.unlocked = true;
  s.resources.energy.cap = 1e9; s.resources.energy.current = 1e9; s.resources.energy.power = 1e9;
  const act = (p) => { s = applyIdleNguAction(s, p, ctx, T).state; };
  // Ciseaux dangereux (Upgrade des Ciseaux) et Boire aussi le lait (Upgrade du Lait) : énergie sur les deux, l'Or manque.
  act({ action: "allocateAugment", pair: "scissors", upgrade: true, value: 1e8 });
  act({ action: "allocateAugment", pair: "milk", upgrade: true, value: 1e8 });
  // on les amène à un niveau où l'Upgrade des Ciseaux coûte PLUS que celle du Lait
  s.systems.augmentations.data.pairs.scissors.upgradeLevel = 30;
  s.systems.augmentations.data.pairs.milk.upgradeLevel = 3;
  return s;
}
let s = depart();
s.currencies.gold = 0;
s = advanceIdleNguState(s, 3600, ctx, T + 3_600_000); // barres pleines, en attente d'Or
const p0 = s.systems.augmentations.data.pairs;
const nivS = p0.scissors.upgradeLevel, nivM = p0.milk.upgradeLevel;
const coutS = 5e4 * 0; // (les coûts exacts viennent du moteur : on les lit par l'effet)
// Or suffisant pour UNE des deux seulement (mais assez pour l'une ou l'autre) : celui du Lait (moins cher) doit l'emporter.
const def = { scissors: null };
s.currencies.gold = 0;
// on cherche un montant qui permet l'une ou l'autre piste mais pas les deux
let trouve = null;
for (let or = 1e3; or < 1e40 && !trouve; or *= 1.5) {
  const test = structuredClone(s);
  test.currencies.gold = or;
  const r = advanceIdleNguState(test, 5, ctx, T + 3_606_000);
  const a = r.systems.augmentations.data.pairs;
  const gagneS = a.scissors.upgradeLevel > nivS, gagneM = a.milk.upgradeLevel > nivM;
  if (gagneS || gagneM) trouve = { or, gagneS, gagneM };
}
assert.ok(trouve, "un montant d'Or déclenche un achat");
assert.ok(trouve.gagneM && !trouve.gagneS, "quand l'Or ne suffit que pour une piste, c'est la moins chère (Lait) qui prend le niveau : " + JSON.stringify(trouve));
console.log("idle-augments-ordre-achat-v1: OK");
