import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, idleNguBonuses } from "../src/idle-ngu-progression.js";
import { IDLE_ADVENTURE_SETS } from "../src/idle-adventure-v47.js";

/*
 * Audit des bonus de complétion (2026-09-23) : consommables donnés par un set
 * (miroir NGU-Wiki) -- Forest : "2 Energy potions α / 2 Energy potions β / 2
 * Energy bar bars" ; HSB : "1 Magic potion α / 1 Magic potion β / 1 Magic bar
 * bar" ; Gaudy : "2 Lucky Charms!" ; Incriminating Evidence : "+1 of every
 * Resource 3 Potion!". Activés immédiatement (effets Sellout), une seule fois.
 */

const ajouter = (s, definitionId, level = 100) =>
  applyIdleNguAction(s, { action: "adventure", adventure: { action: "addItem", definitionId, level } }, {}, 1).state;
const completer = (s, setId) => {
  for (const slot of IDLE_ADVENTURE_SETS[setId].slots) s = ajouter(s, `${setId}:${slot}`);
  assert.equal(s.adventure.completedSets[setId], true, `${setId} complété`);
  return s;
};
const neuf = () => {
  const s = normalizeIdleNguState({}, {}, 0);
  s.adventure.bonusSlots = { inventory: 100 };
  return s;
};

// ---------- Forest ----------
{
  let s = neuf();
  const avant = idleNguBonuses(s);
  s = completer(s, "forest");
  const fx = s.selloutEffects;
  assert.equal(fx.remaining.energyPower, 2 * 3600, "2 Energy potions α = 2 x 60 min");
  assert.equal(fx.beta.energyPower, true, "Energy potion β active");
  assert.equal(fx.remaining.energyBars, 2 * 3600, "2 Energy bar bars = 2 x 60 min");
  assert.deepEqual(s.adventure.pendingSetConsumablesV1, {}, "file d'attente vidée");
  const apres = idleNguBonuses(s);
  assert.ok(Math.abs(apres.energyPowerMultiplier - avant.energyPowerMultiplier * 4) < 1e-9, "Energy Power x2 (α) x2 (β)");
  assert.ok(Math.abs(apres.energyBarsMultiplier - avant.energyBarsMultiplier * 2) < 1e-9, "Energy Bars x2 (Bar Bar)");
  // Une action suivante ne ré-applique rien.
  s = ajouter(s, "tubaTime", 0);
  assert.equal(s.selloutEffects.remaining.energyPower, 2 * 3600, "jamais appliqué deux fois");
}

// ---------- HSB ----------
{
  let s = completer(neuf(), "hsb");
  assert.equal(s.selloutEffects.remaining.magicPower, 3600, "1 Magic potion α");
  assert.equal(s.selloutEffects.beta.magicPower, true, "1 Magic potion β");
  assert.equal(s.selloutEffects.remaining.magicBars, 3600, "1 Magic bar bar");
}

// ---------- Gaudy ----------
{
  let s = neuf();
  const avant = idleNguBonuses(s).dropMultiplier;
  s = completer(s, "gaudy");
  assert.equal(s.selloutEffects.remaining.luck, 2 * 1800, "2 Lucky Charms = 2 x 30 min");
  assert.ok(Math.abs(idleNguBonuses(s).dropMultiplier - avant * 2) < 1e-9, "Drop Chance x2 pendant le Lucky Charm");
}

// ---------- Incriminating Evidence : 1 potion Resource 3 α, β et δ ----------
{
  let s = neuf();
  const avant = idleNguBonuses(s).r3PowerMultiplier;
  s = ajouter(s, "incriminatingEvidence");
  assert.equal(s.adventure.completedSets.incriminatingEvidence, true);
  assert.equal(s.selloutEffects.remaining.r3Power, 3600 + 86400, "α (60 min) + δ (1 jour) sur le même minuteur");
  assert.equal(s.selloutEffects.beta.r3Power, true, "β active");
  assert.ok(idleNguBonuses(s).r3PowerMultiplier > avant, "R3 Power multiplié par les potions");
}

// ---------- Set complété avant ce correctif : consommables accordés une seule fois au chargement ----------
{
  let s = completer(neuf(), "forest");
  const brut = JSON.parse(JSON.stringify(s));
  delete brut.adventure.setConsumablesGrantedV1;
  brut.selloutEffects = { remaining: {}, beta: {}, bluePills: 0 };
  const recharge = normalizeIdleNguState(brut, {}, 2);
  assert.equal(recharge.selloutEffects.remaining.energyPower, 2 * 3600, "rattrapage à la normalisation");
  const encore = normalizeIdleNguState(recharge, {}, 3);
  assert.equal(encore.selloutEffects.remaining.energyPower, 2 * 3600, "pas de second rattrapage");
}

console.log("idle-set-bonus-consumables: OK");
