import assert from "node:assert/strict";
import { normalizeIdleNguState, idleNguBonuses, advanceIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * 2026-09-24 -- audit de composition, pages « Yggdrasil » et « Perk Points » :
 * « Quicker Power Fruit Beta Activation » (perk 16) et « Quicker Fruit of
 * Numbers Bonus Activation » (perk 17) : « The Fruit of Power Beta's bonus will
 * automatically turn on after 30 minutes » ; « Fruit of Power beta and Fruit of
 * Numbers' bonuses are only activated after eating that fruit at least once
 * during the current rebirth, or by buying the respective quicker activation
 * perk ». Le bonus de ces deux perks etait vide : jamais actifs sans manger le fruit.
 *  - Power beta : Attack/Defense x (1 + niveau invisible^2 x 0,05 %).
 *  - Numbers : facteur du prochain NUMBER (1 + niveau^1,3 x 0,05 %).
 */
const ctx = { bosses: 100 };
const MIN = 60 * 1000;

function etat(mutate, elapsedMin) {
  const s = normalizeIdleNguState({}, ctx, 0);
  s.systems.yggdrasil.unlocked = true;
  s.systems.yggdrasil.data.permanent.powerBetaValue = 100;
  s.systems.yggdrasil.data.permanent.numbersValue = 100;
  mutate?.(s);
  return normalizeIdleNguState(s, ctx, elapsedMin * MIN);
}

const base = idleNguBonuses(etat(null, 45));
const betaAttendu = 1 + Math.pow(100, 2) * 5e-4;
const numbersAttendu = 1 + Math.pow(100, 1.3) * 5e-4;

/* Sans le perk : rien n'est actif tant que le fruit n'a pas ete mange. */
assert.equal(etat(null, 45).systems.yggdrasil.data.runPowerBetaActive, false);

/* Avec le perk : rien avant 30 minutes, actif apres. */
const avant = etat((s) => { s.systems.perks.data.levels[16] = 1; s.systems.perks.data.levels[17] = 1; }, 29);
assert.equal(avant.systems.yggdrasil.data.runPowerBetaActive, false);
assert.equal(avant.systems.yggdrasil.data.runNumbersActive, false);
const apres = etat((s) => { s.systems.perks.data.levels[16] = 1; s.systems.perks.data.levels[17] = 1; }, 31);
assert.equal(apres.systems.yggdrasil.data.runPowerBetaActive, true);
assert.equal(apres.systems.yggdrasil.data.runNumbersActive, true);
const b = idleNguBonuses(apres);
const r = b.attackMultiplier / base.attackMultiplier;
/* Le perk n'ajoute aucun autre bonus Attack/Defense : le rapport est exactement le facteur de Power beta. */
assert.ok(Math.abs(r / betaAttendu - 1) < 1e-9, `Power beta : ${r} attendu ${betaAttendu}`);
assert.ok(Math.abs(apres.rebirth.preview.yggNumberBonus / numbersAttendu - 1) < 1e-9, "Fruit of Numbers : facteur du prochain NUMBER");

/* Un seul perk : seul son fruit s'active. */
const seul = etat((s) => { s.systems.perks.data.levels[17] = 1; }, 31);
assert.equal(seul.systems.yggdrasil.data.runPowerBetaActive, false);
assert.equal(seul.systems.yggdrasil.data.runNumbersActive, true);

/* Meme chemin hors ligne : la progression du temps active aussi. */
{
  const s = etat((x) => { x.systems.perks.data.levels[16] = 1; }, 1);
  assert.equal(s.systems.yggdrasil.data.runPowerBetaActive, false);
  const later = advanceIdleNguState(s, 40 * 60, ctx, 41 * MIN);
  assert.equal(later.systems.yggdrasil.data.runPowerBetaActive, true);
}
console.log("idle-yggdrasil-quick-activation-perks: OK");
