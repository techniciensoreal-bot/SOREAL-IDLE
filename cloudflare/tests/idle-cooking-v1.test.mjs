import assert from "node:assert/strict";
import {
  IDLE_COOKING_V1,
  generateIdleCookingMealV1,
  idleCookingIngredientLevelScoreV1,
  idleCookingPairLevelScoreV1,
  idleCookingPairScoreV1,
  idleCookingOptimalScoreV1,
  idleCookingEfficiencyV1,
  idleCookingUnlockedSlotsV1,
  idleCookingGearV1,
  idleCookingTotalBonusesV1,
  idleCookingTimerV1,
  idleCookingMealExpGainPctV1,
  eatIdleCookingMealV1,
  normalizeIdleCookingDataV1
} from "../src/idle-cooking-v1.js";

/*
 * Cooking (wiki NGU, miroir local : pages "Cooking", "Build Cooking",
 * "Space (set)", "Bread (set)", "ROCK LOBSTER", "AMALGAMATE"). Verrouille
 * les valeurs publiées et les formules "Nerdy Math".
 */
const H = 3600000;
const proche = (a, b, eps = 1e-9, msg) => assert.ok(Math.abs(a - b) <= eps, (msg || "") + ` (${a} vs ${b})`);

/* --- constantes du wiki --- */
{
  const C = IDLE_COOKING_V1;
  assert.equal(C.ingredientCount, 8);
  assert.equal(C.pairCount, 4);
  assert.equal(C.baseSlots, 6);
  assert.deepEqual([C.levelMin, C.levelMax], [0, 20]);
  assert.deepEqual([C.ingredientTargetMin, C.ingredientTargetMax, C.ingredientWeightMin, C.ingredientWeightMax], [0, 20, 4, 14]);
  assert.deepEqual([C.pairTargetMin, C.pairTargetMax, C.pairWeightMin, C.pairWeightMax], [5, 34, 8, 30]);
  assert.deepEqual([C.ingredientScoreStep, C.ingredientScoreExponent, C.pairScoreStep, C.pairScoreExponent], [0.03, 30, 0.02, 40]);
  assert.equal(C.gearMultiplierPerPiece, 1.03);
  assert.deepEqual([C.spaceSetMultiplier, C.slot7Multiplier, C.slot8Multiplier], [1.10, 1.20, 1.20]);
  assert.deepEqual([C.mealHours, C.breadSetReductionHours], [23.5, 1]);
  assert.deepEqual([C.bankCapHours, C.bankCapBreadHours, C.bankCapDesignHours], [24.5, 25.5, 48]);
  assert.equal(C.totalExpGainMaxPct, 300);
  /* "Total: x1.9481 (x2.007 with legs slot bug)" */
  proche(Math.pow(1.03, 7) * 1.1 * 1.2 * 1.2, 1.9481, 5e-5, "total wiki 7 pièces");
  proche(Math.pow(1.03, 8) * 1.1 * 1.2 * 1.2, 2.007, 5e-4, "total wiki avec bug des jambes");
}

/* --- formules de score --- */
{
  const ing = { target: 3, weight: 10 };
  assert.equal(idleCookingIngredientLevelScoreV1(ing, 3), 10, "pic exact = poids");
  proche(idleCookingIngredientLevelScoreV1(ing, 5), Math.pow(1 - 0.06, 30) * 10);
  const pair = { target: 11, weight: 20 };
  assert.equal(idleCookingPairLevelScoreV1(pair, 11), 20);
  proche(idleCookingPairLevelScoreV1(pair, 14), Math.pow(1 - 0.06, 40) * 20);

  /* Exemple du wiki : pics d'ingrédient 3 et 9, pic de somme 11. */
  const meal = {
    ingredients: [
      { target: 3, weight: 10 }, { target: 9, weight: 10 },
      { target: 0, weight: 4 }, { target: 20, weight: 14 },
      { target: 7, weight: 5 }, { target: 7, weight: 5 },
      { target: 1, weight: 6 }, { target: 2, weight: 6 }
    ],
    pairs: [
      { a: 0, b: 1, target: 11, weight: 20 },
      { a: 2, b: 3, target: 20, weight: 8 },
      { a: 4, b: 5, target: 14, weight: 30 },
      { a: 6, b: 7, target: 5, weight: 10 }
    ]
  };
  const tous = new Array(8).fill(true);
  const lv = (a, b) => { const l = new Array(8).fill(0); l[0] = a; l[1] = b; return l; };
  /* "the ingredients of the pair are interchangeable so having 5 of A and 14 of B gives the same score as 14 of A and 5 of B" */
  proche(idleCookingPairScoreV1(meal, meal.pairs[0], lv(5, 14), tous), idleCookingPairScoreV1(meal, meal.pairs[0], lv(14, 5), tous));
  /* Score d'une paire = 2 ILS par ingrédient débloqué + score de somme si les deux le sont. */
  const attendu =
    idleCookingIngredientLevelScoreV1(meal.ingredients[0], 3) + idleCookingIngredientLevelScoreV1(meal.ingredients[1], 3) +
    idleCookingIngredientLevelScoreV1(meal.ingredients[0], 9) + idleCookingIngredientLevelScoreV1(meal.ingredients[1], 9) +
    idleCookingPairLevelScoreV1(meal.pairs[0], 12);
  proche(idleCookingPairScoreV1(meal, meal.pairs[0], lv(3, 9), tous), attendu);
  /* Ingrédient 2 verrouillé : seul le niveau de l'ingrédient 1 compte, sans score de somme. */
  const masque = [true, false, true, true, true, true, true, true];
  proche(
    idleCookingPairScoreV1(meal, meal.pairs[0], lv(3, 9), masque),
    idleCookingIngredientLevelScoreV1(meal.ingredients[0], 3) + idleCookingIngredientLevelScoreV1(meal.ingredients[1], 3)
  );

  /* Efficacité = Score_curr / Score_opt ; 100 % pour les niveaux optimaux. */
  const opt = idleCookingOptimalScoreV1(meal, tous);
  let meilleurs = new Array(8).fill(0);
  for (const p of meal.pairs) {
    let best = -1;
    for (let x = 0; x <= 20; x++) for (let y = 0; y <= 20; y++) {
      const l = new Array(8).fill(0); l[p.a] = x; l[p.b] = y;
      const s = idleCookingPairScoreV1(meal, p, l, tous);
      if (s > best) { best = s; meilleurs[p.a] = x; meilleurs[p.b] = y; }
    }
  }
  proche(idleCookingEfficiencyV1(meal, meilleurs, tous), 1);
  assert.ok(idleCookingEfficiencyV1(meal, new Array(8).fill(20), tous) < 1);
  assert.ok(opt > 0);
  /* Slots 7/8 verrouillés : l'optimum est recalculé avec le même masque (100 % reste atteignable). */
  const six = [true, true, true, true, true, true, false, false];
  proche(idleCookingEfficiencyV1(meal, meilleurs, six), idleCookingEfficiencyV1(meal, meilleurs.map((v, i) => (i < 6 ? v : 0)), six));
}

/* --- génération d'un repas --- */
{
  let graine = 42;
  const rng = () => { graine = (graine * 1103515245 + 12345) % 2147483648; return graine / 2147483648; };
  for (let n = 0; n < 200; n++) {
    const m = generateIdleCookingMealV1(rng);
    assert.equal(m.ingredients.length, 8);
    assert.equal(m.pairs.length, 4);
    const idx = m.pairs.flatMap(p => [p.a, p.b]).sort((a, b) => a - b);
    assert.deepEqual(idx, [0, 1, 2, 3, 4, 5, 6, 7], "4 paires disjointes couvrant les 8 ingrédients");
    for (const i of m.ingredients) {
      assert.ok(Number.isInteger(i.target) && i.target >= 0 && i.target <= 20);
      assert.ok(i.weight >= 4 && i.weight <= 14);
    }
    for (const p of m.pairs) {
      assert.ok(Number.isInteger(p.target) && p.target >= 5 && p.target <= 34);
      assert.ok(p.weight >= 8 && p.weight <= 30);
    }
  }
  assert.deepEqual(generateIdleCookingMealV1(() => 0).pairs.map(p => p.target), [5, 5, 5, 5]);
  assert.deepEqual(generateIdleCookingMealV1(() => 0.9999999).pairs.map(p => p.target), [34, 34, 34, 34]);
}

/* --- slots d'ingrédients --- */
assert.equal(idleCookingUnlockedSlotsV1({ titans: {} }), 6);
assert.equal(idleCookingUnlockedSlotsV1({ titans: { lobster: { kills: 1 } } }), 7);
assert.equal(idleCookingUnlockedSlotsV1({ titans: { lobster: { kills: 3 }, amalgamate: { kills: 1 } } }), 8);

/* --- équipement Cooking et Total Cooking Bonuses --- */
{
  const inv = [
    { id: "w", definitionId: "grb:weapon", name: "Bloody Cleaver" },
    { id: "h", definitionId: "grb:head", name: "Chef's Hat" },
    { id: "c", definitionId: "grb:chest", name: "Chef's Apron" },
    { id: "l", definitionId: "grb:legs", name: "Regular Pants" },
    { id: "b", definitionId: "grb:boots", name: "Non Slip Shoes" },
    { id: "j", definitionId: "theJoker", name: "The Joker" },
    { id: "n", definitionId: "grb:necklace", name: "Suspicious Sausage Necklace" }
  ];
  const adv = {
    inventory: inv,
    equipment: { weapon: "w", head: "h", chest: "c", legs: "l", boots: "b", accessories: ["j", "n"] },
    completedSets: {},
    titans: {}
  };
  const gear = idleCookingGearV1(adv);
  assert.equal(gear.pieces.length, 6, "le collier GRB n'a pas de Special Cooking");
  assert.equal(gear.count, 7, "jambes comptées deux fois (bug documenté)");
  proche(idleCookingTotalBonusesV1(adv).multiplier, Math.pow(1.03, 7));
  adv.completedSets.space = true;
  adv.titans = { lobster: { kills: 1 }, amalgamate: { kills: 1 } };
  proche(idleCookingTotalBonusesV1(adv).multiplier, Math.pow(1.03, 7) * 1.1 * 1.2 * 1.2);
  proche(idleCookingTotalBonusesV1({ inventory: [], equipment: {}, completedSets: {}, titans: {} }).multiplier, 1);
}

/* --- minuterie : 23,5 h, banque plafonnée à 24,5 h (bug), Bread Set -1 h / 25,5 h --- */
{
  const data = normalizeIdleCookingDataV1({ bankAnchorAt: 1000 });
  const sans = idleCookingTimerV1(data, { completedSets: {} }, 1000 + 23 * H);
  assert.equal(sans.mealMs, 23.5 * H);
  assert.equal(sans.ready, false);
  assert.equal(sans.readyInMs, 0.5 * H);
  const plein = idleCookingTimerV1(data, { completedSets: {} }, 1000 + 100 * H);
  assert.equal(plein.bankedMs, 24.5 * H, "banque plafonnée à 24,5 h");
  const pain = idleCookingTimerV1(data, { completedSets: { bread: true } }, 1000 + 100 * H);
  assert.equal(pain.mealMs, 22.5 * H);
  assert.equal(pain.bankedMs, 25.5 * H);
}

/* --- gain par repas : formule jshepler (forum Steam), plancher de base 0,36 --- */
assert.ok(Math.abs(idleCookingMealExpGainPctV1(1, 1.32, 0) - 0.66) < 1e-9, "premier repas, efficacité 100 %, bonus 132 % : +0,66 % (exemple du wiki)");
assert.ok(Math.abs(idleCookingMealExpGainPctV1(1, 1.32, 20) - (1 - 0.04) * 0.66) < 1e-9, "total +20 % -> base 1 - 0,2^2");
assert.ok(Math.abs(idleCookingMealExpGainPctV1(1, 1.32, 100) - 0.36 * 0.66) < 1e-9, "total +100 % -> base plancher 0,36");
assert.ok(Math.abs(idleCookingMealExpGainPctV1(1, 1.32, 300) - 0.36 * 0.66) < 1e-9, "total +300 % -> 0,24 % (0,36 x 0,66 %)");
assert.ok(Math.abs(idleCookingMealExpGainPctV1(0.5, 1, 0) - 0.25) < 1e-9, "efficacité 50 %, bonus 100 % : 0,25 %");
assert.equal(idleCookingMealExpGainPctV1(0, 1.32, 0), 0);

/* --- manger (gain injecté) : banque consommée, plafond 300 %, bonus EXP synchronisé --- */
{
  const state = {
    adventure: { completedSets: {}, titans: {}, inventory: [], equipment: {} },
    bonuses: { cookingExp: 0 },
    systems: { cooking: { id: "cooking", unlocked: true, data: { bankAnchorAt: 1 } } }
  };
  assert.throws(() => eatIdleCookingMealV1(state, 1, 1 + 10 * H), /COOKING_REPAS_PAS_PRET/);
  const t = 1 + 100 * H;
  const r = eatIdleCookingMealV1(state, 250, t);
  assert.equal(r.totalExpGainPct, 250);
  assert.equal(state.bonuses.cookingExp, 2.5);
  /* 24,5 h en banque - 23,5 h consommées = 1 h reportée sur le repas suivant. */
  const apres = idleCookingTimerV1(state.systems.cooking.data, state.adventure, t);
  assert.equal(apres.bankedMs, 1 * H);
  assert.equal(apres.readyInMs, 22.5 * H);
  assert.throws(() => eatIdleCookingMealV1(state, 1, t + 1), /COOKING_REPAS_PAS_PRET/);
  const r2 = eatIdleCookingMealV1(state, 250, t + 23 * H);
  assert.equal(r2.totalExpGainPct, 300, "plafond de 300 %");
  assert.equal(r2.gainPct, 50);
  assert.equal(state.bonuses.cookingExp, 3);
  assert.equal(state.systems.cooking.data.mealsEaten, 2);
  assert.throws(() => eatIdleCookingMealV1(state, null, t + 200 * H), /COOKING_GAIN_REPAS_NON_DOCUMENTE/);
}

console.log("idle-cooking-v1: OK");
