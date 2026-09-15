import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  advanceIdleNguState,
  applyIdleNguAction,
  rebirthIdleNguState
} from "../src/idle-ngu-progression.js";

/*
 * NGU wiki adaptation (2026-09-14) — audit indépendant de Yggdrasil
 * (demandé en complément de la migration Quirks/Perks). Le catalogue
 * IDLE_NGU_YGG_FRUITS lui-même (10 fruits Normal, coût d'activation,
 * Base Seed Reward, coût de tier) est exact, cellule par cellule, face
 * à https://ngu-idle.fandom.com/wiki/Yggdrasil et n'a pas été touché.
 *
 * En revanche, la formule "Seed Gains" du wiki (section Nerdy Formulas)
 * inclut PerkSeeds (Perk "I Want Your Seeds ;)", +5%/niveau jusqu'à 20
 * niveaux), QuirkSeeds (Quirk "The Beast's Seed ;)", +1%/niveau jusqu'à
 * 25 niveaux) et FirstHarvest (Perk "The First Harvest's The Best",
 * +10%/niveau jusqu'à 5 niveaux, actif seulement au premier
 * eat/harvest d'un fruit donné dans le Rebirth). Les trois bonus
 * étaient déjà catalogués et déjà correctement calculés par
 * idleNguBonuses() (seedYieldMultiplierFromPerks/Quirks,
 * firstHarvestMultiplierFromPerks) — mais jamais lus par
 * yggSeedGain()/useYggFruit(), qui créditait les graines sans aucun
 * des trois bonus. f.firstHarvestThisRun était même déjà suivi
 * (basculé à false après usage, remis à true au Rebirth) sans que son
 * bonus ne soit jamais appliqué. Câblés ici pour la première fois.
 */

const fresh = (context = {}, now = 1_000_000) => normalizeIdleNguState({}, context, now);

function growGoldFruitToTierOne(context, now) {
  let state = fresh(context, now);
  state.systems.yggdrasil.unlocked = true;
  state.currencies.seeds = 1000;
  state.resources.energy.cap = 500_000;
  state.resources.energy.current = 500_000;
  state = applyIdleNguAction(state, { action: "upgradeYggFruit", fruit: "gold" }, context, now).state;
  state = applyIdleNguAction(state, { action: "activateYggFruit", fruit: "gold" }, context, now).state;
  state = advanceIdleNguState(state, 3600, context, now + 3_600_000);
  assert.equal(state.systems.yggdrasil.data.fruits.gold.growthHours, 1, "Le fruit doit avoir atteint 1h de croissance (Tier 1).");
  return state;
}

// --- Perk seed-yield bonus (I Want Your Seeds ;)) doit augmenter les graines récoltées ---
{
  const context = { bosses: 66 };
  const baseline = growGoldFruitToTierOne(context, 1_000_000);
  const seedsBefore = baseline.currencies.seeds;
  const noPerk = applyIdleNguAction(baseline, { action: "useYggFruit", fruit: "gold", mode: "harvest" }, context, 4_600_000).state;
  const baseSeedGain = noPerk.currencies.seeds - seedsBefore;

  const withPerk = growGoldFruitToTierOne(context, 1_000_000);
  withPerk.systems.perks.unlocked = true;
  withPerk.currencies.pp = 1000;
  const bought = applyIdleNguAction(withPerk, { action: "buyPerk", perkId: 24 }, context, 1_000_000).state;
  assert.equal(bought.systems.perks.data.levels[24], 1, "Perk 24 (I Want Your Seeds ;)) doit être achetée niveau 1.");
  const seedsBefore2 = bought.currencies.seeds;
  const harvested = applyIdleNguAction(bought, { action: "useYggFruit", fruit: "gold", mode: "harvest" }, context, 4_600_000).state;
  const boostedSeedGain = harvested.currencies.seeds - seedsBefore2;
  assert.ok(boostedSeedGain > baseSeedGain, "Avec le Perk +5% seed yield, la récolte doit rapporter plus de graines que sans.");
  // Arrondi (ceil) au Tier 1 sur de petits nombres: on vérifie que le
  // multiplicateur wiki (+5%, Perk 24 niveau 1) est bien celui utilisé
  // en amont de l'arrondi, plutôt que le ratio final exact.
  assert.equal(boostedSeedGain, Math.ceil(baseSeedGain * 1.05), "Le gain arrondi doit correspondre à baseSeedGain x 1.05 (formule wiki), arrondi au supérieur.");
}

// --- First Harvest bonus ne s'applique qu'à la toute première récolte du Rebirth ---
{
  const context = { bosses: 66 };
  let state = growGoldFruitToTierOne(context, 1_000_000);
  state.systems.perks.unlocked = true;
  state.currencies.pp = 1000;
  state = applyIdleNguAction(state, { action: "buyPerk", perkId: 51 }, context, 1_000_000).state;
  assert.equal(state.systems.perks.data.levels[51], 1, "Perk 51 (The First Harvest's The Best) doit être achetée niveau 1.");
  assert.equal(state.systems.yggdrasil.data.fruits.gold.firstHarvestThisRun, true, "Avant toute récolte ce Rebirth, firstHarvestThisRun doit être vrai.");

  const seedsBefore = state.currencies.seeds;
  const firstHarvest = applyIdleNguAction(state, { action: "useYggFruit", fruit: "gold", mode: "harvest" }, context, 4_600_000).state;
  const firstGain = firstHarvest.currencies.seeds - seedsBefore;
  assert.equal(firstHarvest.systems.yggdrasil.data.fruits.gold.firstHarvestThisRun, false, "firstHarvestThisRun doit passer à faux après la première récolte.");

  // Deuxième cycle du même fruit, sans le bonus FirstHarvest cette fois.
  let state2 = firstHarvest;
  state2 = applyIdleNguAction(state2, { action: "upgradeYggFruit", fruit: "gold" }, context, 4_600_000).state;
  state2 = applyIdleNguAction(state2, { action: "activateYggFruit", fruit: "gold" }, context, 4_600_000).state;
  state2 = advanceIdleNguState(state2, 3600, context, 8_200_000);
  const seedsBefore2 = state2.currencies.seeds;
  const secondHarvest = applyIdleNguAction(state2, { action: "useYggFruit", fruit: "gold", mode: "harvest" }, context, 8_200_000).state;
  const secondGain = secondHarvest.currencies.seeds - seedsBefore2;
  assert.ok(firstGain > secondGain, "Le bonus +10% FirstHarvest ne doit s'appliquer qu'à la toute première récolte du Rebirth, pas aux suivantes.");

  // Rebirth remet firstHarvestThisRun à true pour le prochain Rebirth.
  const reborn = rebirthIdleNguState(secondHarvest, context, 10_000_000);
  assert.equal(reborn.systems.yggdrasil.data.fruits.gold.firstHarvestThisRun, true, "Le Rebirth doit réarmer le bonus FirstHarvest pour le nouveau Rebirth.");
}

console.log("idle-ygg-seed-yield-wiring-v1: OK");
