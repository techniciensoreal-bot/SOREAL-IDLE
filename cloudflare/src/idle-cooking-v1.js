/*
 * SOREAL IDLE — Cooking (système NGU débloqué par IT HUNGERS, Titan 10).
 *
 * Source unique : miroir local du wiki NGU (Documents\NGU-Wiki\pages),
 * pages "Cooking" (sections d'intro, "Mechanics overview", "Nerdy Math",
 * "Gear", "Cooking upgrades"), "Build Cooking", "Space (set)",
 * "Bread (set)", "ROCK LOBSTER", "AMALGAMATE", "Titans", "Experience".
 * Règle n°1 d'AGENTS.md : aucune valeur n'est inventée. Ce qui n'est PAS
 * publié par le wiki est explicitement laissé non implémenté :
 *
 * - Le gain d'EXP d'un repas ("Current Meal Exp Gain") : le wiki dit
 *   seulement que manger "permanently increase exp gains, up to a maximum
 *   of 300%" et que le gain courant est appliqué au "Total Exp Gain". Aucune
 *   formule ne relie l'efficacité du repas et les "Total Cooking Bonuses" au
 *   gain par repas. La capture Cooking-sample.png montre un seul point
 *   (efficacité +100 %, bonus 132 %, gain +0.66 %, total +100 %), insuffisant
 *   pour déduire une formule (linéarité, dépendance au total déjà acquis...).
 *   idleCookingMealExpGainPctV1 renvoie donc null et l'action "manger" est
 *   refusée (COOKING_GAIN_REPAS_NON_DOCUMENTE) plutôt que d'inventer un gain.
 *   Toute la mécanique autour (minuterie, banque, plafond 300 %, nouveau
 *   repas) est câblée et testée via eatIdleCookingMealV1 : il suffira de
 *   remplacer ce null par la formule sourcée.
 * - La loi de tirage des cibles/poids : le wiki donne les bornes ("between
 *   0 and 20 inclusive"...), pas la distribution ; tirage uniforme dans ces
 *   bornes (seule lecture possible sans ajouter d'information).
 * - Le niveau initial des ingrédients d'un nouveau repas n'est pas publié :
 *   0 (la stratégie du wiki commence de toute façon par "Reduce all
 *   ingredients to zero").
 * - Les noms d'ingrédients : la capture en montre 7 (Garlic, Snake Oil,
 *   MALK, Bread, Eggs, Onion, Candy Canes) sans ordre de slot certain et le
 *   8e n'est nommé nulle part ; l'interface les numérote donc simplement.
 * - Les aliments GLOP (A Well Done Steak With Ketchup, Pickle Ice Cream,
 *   A Can of Surstromming, A Jar of Marmite, Pizza With Pineapple) ne sont
 *   PAS des ingrédients de Cooking : pages "GLOP", "GLOP Recipe" et
 *   "Secrets and Spoilers" > IT HUNGERS, ce sont les composants de la GLOP
 *   qui sert à COMBATTRE IT HUNGERS (quête non modélisée, voir
 *   idle-adventure-v47.js). Les ingrédients de Cooking sont générés avec
 *   chaque repas, sans inventaire ni drop.
 */
import { IDLE_ADVENTURE_SPECIALS } from "./idle-adventure-v47.js";
import { SET_ITEM_SPECIALS_V1 } from "./idle-adventure-set-specials-v1.js";

const HEURE_MS = 3600000;

export const IDLE_COOKING_V1 = Object.freeze({
  /* "Nerdy Math" : "a new meal and 8 ingredients will be randomly generated", "4 secret pairs". */
  ingredientCount: 8,
  pairCount: 4,
  /* "Ingredient Slots" : "Base: 6 slots", "+1 slot" ROCK LOBSTER (Titan 11), "+1 slot" AMALGAMATE (Titan 12). */
  baseSlots: 6,
  /* "Strategy" : "specific ingredient values, which can range in increments of 0-20". */
  levelMin: 0,
  levelMax: 20,
  /* "Nerdy Math" : cibles/poids d'un ingrédient et d'une paire. */
  ingredientTargetMin: 0,
  ingredientTargetMax: 20,
  ingredientWeightMin: 4,
  ingredientWeightMax: 14,
  pairTargetMin: 5,
  pairTargetMax: 34,
  pairWeightMin: 8,
  pairWeightMax: 30,
  /* Ingredient Level Score = (1 - 0.03 * |cible - niveau|) ^ 30 * poids. */
  ingredientScoreStep: 0.03,
  ingredientScoreExponent: 30,
  /* Pair Level Score = (1 - 0.02 * |cible paire - somme|) ^ 40 * poids paire. */
  pairScoreStep: 0.02,
  pairScoreExponent: 40,
  /* "Gear" : "Each equipped Cooking gear item provides a multiplicative 3% bonus" (jambes comptées 2 fois, bug du jeu). */
  gearMultiplierPerPiece: 1.03,
  /* "Total Cooking Bonuses" : Space Set x1.10, slot 7 x1.20, slot 8 x1.20. */
  spaceSetMultiplier: 1.10,
  slot7Multiplier: 1.20,
  slot8Multiplier: 1.20,
  /* "Eat Rate" : "Base rate: 1 meal per 23.5 hours", Bread Set "-1 hour". */
  mealHours: 23.5,
  breadSetReductionHours: 1,
  /*
   * Intro : le temps se met en banque "up to a maximum of 48 hours. Due to a
   * bug, the banked time will not exceed 24.5 hours (25.5 hours with the
   * Bread Set)". On reproduit le comportement réel (bugué), comme ailleurs
   * dans SOREAL (ex. bug des 5000 Seeds du Daily Spin).
   */
  bankCapHours: 24.5,
  bankCapBreadHours: 25.5,
  bankCapDesignHours: 48,
  /* Intro : "permanently increase exp gains, up to a maximum of 300%". */
  totalExpGainMaxPct: 300
});

const C = IDLE_COOKING_V1;

function num(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function int(v, d = 0) {
  return Math.trunc(num(v, d));
}
function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

/* ---------------------------------------------------------------- repas -- */

function tirageEntier(rng, min, max) {
  return min + Math.min(max - min, Math.floor(rng() * (max - min + 1)));
}
function tirageDecimal(rng, min, max) {
  return min + rng() * (max - min);
}

/*
 * "The ingredients are generated in random pairs which are unrelated to
 * their position on the screen" : mélange des 8 index puis appariement
 * deux à deux.
 */
export function generateIdleCookingMealV1(rng = Math.random) {
  const ordre = Array.from({ length: C.ingredientCount }, (_, i) => i);
  for (let i = ordre.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [ordre[i], ordre[j]] = [ordre[j], ordre[i]];
  }
  const ingredients = Array.from({ length: C.ingredientCount }, () => ({
    target: tirageEntier(rng, C.ingredientTargetMin, C.ingredientTargetMax),
    weight: tirageDecimal(rng, C.ingredientWeightMin, C.ingredientWeightMax)
  }));
  const pairs = [];
  for (let p = 0; p < C.pairCount; p++) {
    pairs.push({
      a: ordre[2 * p],
      b: ordre[2 * p + 1],
      target: tirageEntier(rng, C.pairTargetMin, C.pairTargetMax),
      weight: tirageDecimal(rng, C.pairWeightMin, C.pairWeightMax)
    });
  }
  return { ingredients, pairs };
}

function normalizeMeal(raw) {
  if (!raw || typeof raw !== "object") return null;
  const ingredients = Array.isArray(raw.ingredients) ? raw.ingredients : [];
  const pairs = Array.isArray(raw.pairs) ? raw.pairs : [];
  if (ingredients.length !== C.ingredientCount || pairs.length !== C.pairCount) return null;
  const vus = new Set();
  const outPairs = [];
  for (const p of pairs) {
    const a = int(p?.a, -1);
    const b = int(p?.b, -1);
    if (a < 0 || b < 0 || a >= C.ingredientCount || b >= C.ingredientCount || a === b || vus.has(a) || vus.has(b)) return null;
    vus.add(a);
    vus.add(b);
    outPairs.push({
      a,
      b,
      target: clamp(int(p.target, C.pairTargetMin), C.pairTargetMin, C.pairTargetMax),
      weight: clamp(num(p.weight, C.pairWeightMin), C.pairWeightMin, C.pairWeightMax)
    });
  }
  return {
    ingredients: ingredients.map(x => ({
      target: clamp(int(x?.target, 0), C.ingredientTargetMin, C.ingredientTargetMax),
      weight: clamp(num(x?.weight, C.ingredientWeightMin), C.ingredientWeightMin, C.ingredientWeightMax)
    })),
    pairs: outPairs
  };
}

export function createIdleCookingDataV1() {
  return {
    meal: null,
    mealNumber: 0,
    levels: new Array(C.ingredientCount).fill(0),
    bankAnchorAt: 0,
    totalExpGainPct: 0,
    mealsEaten: 0,
    lastEatenAt: 0
  };
}

export function normalizeIdleCookingDataV1(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const out = createIdleCookingDataV1();
  out.meal = normalizeMeal(src.meal);
  out.mealNumber = Math.max(0, int(src.mealNumber, 0));
  const levels = Array.isArray(src.levels) ? src.levels : [];
  out.levels = out.levels.map((_, i) => clamp(int(levels[i], 0), C.levelMin, C.levelMax));
  out.bankAnchorAt = Math.max(0, num(src.bankAnchorAt, 0));
  out.totalExpGainPct = clamp(num(src.totalExpGainPct, 0), 0, C.totalExpGainMaxPct);
  out.mealsEaten = Math.max(0, int(src.mealsEaten, 0));
  out.lastEatenAt = Math.max(0, num(src.lastEatenAt, 0));
  return out;
}

/* ------------------------------------------------------------ déblocages -- */

function titanTue(adventure, id) {
  return int(adventure?.titans?.[id]?.kills, 0) >= 1;
}

/* "Your first Rock Lobster kill unlocks the 7th ingredient slot" / "Your first AMALGAMATE kill unlocks the 8th". */
export function idleCookingUnlockedSlotsV1(adventure) {
  let slots = C.baseSlots;
  if (titanTue(adventure, "lobster")) slots += 1;
  if (titanTue(adventure, "amalgamate")) slots += 1;
  return slots;
}

/*
 * Les slots 7 et 8 sont des emplacements d'écran distincts ("only 6 or 7
 * ingredients may display if ingredient slots 7 and 8 are not unlocked") :
 * AMALGAMATE vaincu sans ROCK LOBSTER ouvre quand même le slot 8.
 */
function masqueSlots(adventure) {
  const m = new Array(C.ingredientCount).fill(false);
  for (let i = 0; i < C.baseSlots; i++) m[i] = true;
  m[6] = titanTue(adventure, "lobster");
  m[7] = titanTue(adventure, "amalgamate");
  return m;
}

/* ----------------------------------------------------------------- score -- */

export function idleCookingIngredientLevelScoreV1(ingredient, level) {
  const base = 1 - C.ingredientScoreStep * Math.abs(num(ingredient.target) - num(level));
  return Math.pow(base, C.ingredientScoreExponent) * num(ingredient.weight);
}

export function idleCookingPairLevelScoreV1(pair, sum) {
  const base = 1 - C.pairScoreStep * Math.abs(num(pair.target) - num(sum));
  return Math.pow(base, C.pairScoreExponent) * num(pair.weight);
}

/*
 * "Nerdy Math" : pour une paire (Ingred1, Ingred2) le score est la somme de
 * - si Ingred1 débloqué : ILS(Ingred1, Ingred1) + ILS(Ingred2, Ingred1)
 * - si Ingred2 débloqué : ILS(Ingred1, Ingred2) + ILS(Ingred2, Ingred2)
 * - si les deux sont débloqués : Pair Level Score (somme des deux niveaux)
 * où ILS(A, B) compare la CIBLE de A au NIVEAU de B (d'où les deux pics).
 */
export function idleCookingPairScoreV1(meal, pair, levels, mask) {
  const i1 = meal.ingredients[pair.a];
  const i2 = meal.ingredients[pair.b];
  const l1 = num(levels[pair.a]);
  const l2 = num(levels[pair.b]);
  let s = 0;
  if (mask[pair.a]) s += idleCookingIngredientLevelScoreV1(i1, l1) + idleCookingIngredientLevelScoreV1(i2, l1);
  if (mask[pair.b]) s += idleCookingIngredientLevelScoreV1(i1, l2) + idleCookingIngredientLevelScoreV1(i2, l2);
  if (mask[pair.a] && mask[pair.b]) s += idleCookingPairLevelScoreV1(pair, l1 + l2);
  return s;
}

export function idleCookingScoreV1(meal, levels, mask) {
  return meal.pairs.reduce((sum, pair) => sum + idleCookingPairScoreV1(meal, pair, levels, mask), 0);
}

/*
 * Score_opt : "the best score that could be achieved by setting all 8
 * ingredients to a number between 0 and 20" -- avec le même masque de slots
 * que le score courant, sinon 100 % serait inatteignable alors que
 * "When all ingredients are set perfectly the score will be 100%". Chaque
 * paire est indépendante : recherche exhaustive 21 x 21 par paire.
 */
export function idleCookingOptimalScoreV1(meal, mask) {
  let total = 0;
  for (const pair of meal.pairs) {
    let best = 0;
    const levels = new Array(C.ingredientCount).fill(0);
    for (let x = C.levelMin; x <= C.levelMax; x++) {
      for (let y = C.levelMin; y <= C.levelMax; y++) {
        levels[pair.a] = x;
        levels[pair.b] = y;
        const s = idleCookingPairScoreV1(meal, pair, levels, mask);
        if (s > best) best = s;
      }
    }
    total += best;
  }
  return total;
}

/* "The Current Meal Efficiency multiplier is calculated as Score_curr / Score_opt". */
export function idleCookingEfficiencyV1(meal, levels, adventureOrMask) {
  if (!meal) return 0;
  const mask = Array.isArray(adventureOrMask) ? adventureOrMask : masqueSlots(adventureOrMask);
  const lv = levels.map((l, i) => (mask[i] ? l : 0));
  const opt = idleCookingOptimalScoreV1(meal, mask);
  return opt > 0 ? idleCookingScoreV1(meal, lv, mask) / opt : 0;
}

/* ------------------------------------------------------------ équipement -- */

function aUnSpecialCooking(definitionId) {
  const set = SET_ITEM_SPECIALS_V1[definitionId];
  if (Array.isArray(set)) return set.some(entry => entry[0] === "cookingPct");
  const special = IDLE_ADVENTURE_SPECIALS[definitionId];
  if (!special) return false;
  if (special.sType === "cookingPct") return true;
  return Array.isArray(special.sExtra) && special.sExtra.some(ex => ex.type === "cookingPct");
}

/*
 * "Gear" : chaque objet équipé affichant "Cooking %" compte pour x1.03,
 * quelle que soit la valeur affichée ; "Cooking gear in the legs slot [counts]
 * twice". "Bloody Cleaver must be in the primary (top) weapon slot" : SOREAL
 * n'a qu'un slot arme (equipment.weapon), qui est donc le slot primaire.
 */
export function idleCookingGearV1(adventure) {
  const eq = adventure?.equipment || {};
  const inventaire = Array.isArray(adventure?.inventory) ? adventure.inventory : [];
  const parId = id => inventaire.find(x => x && x.id === id) || null;
  const pieces = [];
  const slots = [["weapon", eq.weapon], ["head", eq.head], ["chest", eq.chest], ["legs", eq.legs], ["boots", eq.boots]];
  for (const id of Array.isArray(eq.accessories) ? eq.accessories : []) slots.push(["accessory", id]);
  const vus = new Set();
  for (const [slot, id] of slots) {
    if (!id || vus.has(id)) continue;
    vus.add(id);
    const o = parId(id);
    if (!o || !aUnSpecialCooking(String(o.definitionId || ""))) continue;
    pieces.push({ slot, id: o.id, definitionId: o.definitionId, name: o.name || o.definitionId, count: slot === "legs" ? 2 : 1 });
  }
  return { pieces, count: pieces.reduce((s, p) => s + p.count, 0) };
}

/* ------------------------------------------------------ bonus et minuterie -- */

export function idleCookingTotalBonusesV1(adventure) {
  const gear = idleCookingGearV1(adventure);
  const gearMultiplier = Math.pow(C.gearMultiplierPerPiece, gear.count);
  const spaceSet = Boolean(adventure?.completedSets?.space);
  const mask = masqueSlots(adventure);
  const multiplier =
    gearMultiplier *
    (spaceSet ? C.spaceSetMultiplier : 1) *
    (mask[6] ? C.slot7Multiplier : 1) *
    (mask[7] ? C.slot8Multiplier : 1);
  return { gear, gearMultiplier, spaceSet, slot7: mask[6], slot8: mask[7], multiplier };
}

export function idleCookingTimerV1(data, adventure, now) {
  const bread = Boolean(adventure?.completedSets?.bread);
  const mealMs = (C.mealHours - (bread ? C.breadSetReductionHours : 0)) * HEURE_MS;
  const capMs = (bread ? C.bankCapBreadHours : C.bankCapHours) * HEURE_MS;
  const anchor = num(data?.bankAnchorAt, 0);
  const bankedMs = anchor > 0 ? clamp(num(now) - anchor, 0, capMs) : 0;
  const ready = anchor > 0 && bankedMs >= mealMs;
  return {
    breadSet: bread,
    mealMs,
    capMs,
    bankedMs,
    ready,
    readyInMs: anchor > 0 ? Math.max(0, mealMs - bankedMs) : mealMs
  };
}

/*
 * Gain d'EXP du repas courant : NON PUBLIÉ par le wiki (voir l'en-tête du
 * fichier). null = "inconnu" ; ne jamais remplacer par une valeur approchée.
 */
export function idleCookingMealExpGainPctV1(/* efficiency, totalBonusesMultiplier, totalExpGainPct */) {
  return null;
}

function synchroniserBonusExp(state, data) {
  if (!state.bonuses || typeof state.bonuses !== "object") return;
  state.bonuses.cookingExp = clamp(num(data.totalExpGainPct, 0), 0, C.totalExpGainMaxPct) / 100;
}

function nouveauRepas(data, rng) {
  data.meal = generateIdleCookingMealV1(rng);
  data.mealNumber = Math.max(0, int(data.mealNumber, 0)) + 1;
  data.levels = new Array(C.ingredientCount).fill(0);
}

/*
 * Tick : "Once unlocked, a new meal and 8 ingredients will be randomly
 * generated" ; la minuterie démarre au déblocage. Recopie aussi le Total
 * Exp Gain vers state.bonuses.cookingExp (lu par idleNguBonuses().xpMultiplier
 * comme (1 + cookingExp)).
 */
export function advanceIdleCookingV1(state, now, rng = Math.random) {
  const sys = state?.systems?.cooking;
  if (!sys) return;
  sys.data = normalizeIdleCookingDataV1(sys.data);
  if (sys.unlocked) {
    if (!sys.data.meal) nouveauRepas(sys.data, rng);
    if (!sys.data.bankAnchorAt) sys.data.bankAnchorAt = num(now, 0);
  }
  sys.level = sys.data.mealsEaten;
  synchroniserBonusExp(state, sys.data);
}

/*
 * Manger : "eating the dish will apply it to the Total Exp Gain and generate
 * a new random meal and ingredients" ; consomme une durée de repas dans la
 * banque de temps. `gainPct` est fourni par l'appelant (voir
 * idleCookingMealExpGainPctV1) ; le total est plafonné à 300 %.
 */
export function eatIdleCookingMealV1(state, gainPct, now, rng = Math.random) {
  const sys = state?.systems?.cooking;
  if (!sys?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  advanceIdleCookingV1(state, now, rng);
  const data = sys.data;
  const timer = idleCookingTimerV1(data, state.adventure, now);
  if (!timer.ready) throw new Error("COOKING_REPAS_PAS_PRET");
  const gain = gainPct;
  if (typeof gain !== "number" || !Number.isFinite(gain) || gain < 0) throw new Error("COOKING_GAIN_REPAS_NON_DOCUMENTE");
  const avant = data.totalExpGainPct;
  data.totalExpGainPct = Math.min(C.totalExpGainMaxPct, avant + gain);
  data.bankAnchorAt = num(now) - (timer.bankedMs - timer.mealMs);
  data.mealsEaten += 1;
  data.lastEatenAt = num(now);
  nouveauRepas(data, rng);
  sys.level = data.mealsEaten;
  synchroniserBonusExp(state, data);
  return { gainPct: data.totalExpGainPct - avant, totalExpGainPct: data.totalExpGainPct, mealNumber: data.mealNumber };
}

/* Actions joueur : payload { action: "cooking", op: "setIngredient" | "eat", index, level }. */
export function applyIdleCookingActionV1(state, payload = {}, now, rng = Math.random) {
  const sys = state?.systems?.cooking;
  if (!sys?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  advanceIdleCookingV1(state, now, rng);
  const data = sys.data;
  const op = String(payload.op || "");
  if (op === "setIngredient") {
    const index = int(payload.index, -1);
    if (index < 0 || index >= C.ingredientCount) throw new Error("COOKING_INGREDIENT_INVALIDE");
    if (!masqueSlots(state.adventure)[index]) throw new Error("COOKING_SLOT_VERROUILLE");
    const level = int(payload.level, NaN);
    if (!Number.isFinite(level) || level < C.levelMin || level > C.levelMax) throw new Error("COOKING_NIVEAU_INVALIDE");
    data.levels[index] = level;
    return { index, level, efficiency: idleCookingEfficiencyV1(data.meal, data.levels, state.adventure) };
  }
  if (op === "eat") {
    const efficiency = idleCookingEfficiencyV1(data.meal, data.levels, state.adventure);
    const bonuses = idleCookingTotalBonusesV1(state.adventure);
    const gain = idleCookingMealExpGainPctV1(efficiency, bonuses.multiplier, data.totalExpGainPct);
    if (gain === null) throw new Error("COOKING_GAIN_REPAS_NON_DOCUMENTE");
    return eatIdleCookingMealV1(state, gain, now, rng);
  }
  throw new Error("COOKING_ACTION_INCONNUE");
}

/*
 * Vue client : jamais les cibles/poids/paires (secrets du repas, que le
 * joueur doit retrouver en tâtonnant), seulement les niveaux choisis et les
 * valeurs affichées par le vrai écran (efficacité, bonus, gain, total).
 */
export function idleCookingSystemSnapshotV1(state, now) {
  const sys = state?.systems?.cooking;
  if (!sys) return null;
  const data = normalizeIdleCookingDataV1(sys.data);
  const adventure = state.adventure;
  const mask = masqueSlots(adventure);
  const bonuses = idleCookingTotalBonusesV1(adventure);
  const efficiency = idleCookingEfficiencyV1(data.meal, data.levels, mask);
  const gain = data.meal ? idleCookingMealExpGainPctV1(efficiency, bonuses.multiplier, data.totalExpGainPct) : null;
  const timer = idleCookingTimerV1(data, adventure, now);
  return {
    id: sys.id,
    unlocked: Boolean(sys.unlocked),
    active: Boolean(sys.active),
    level: data.mealsEaten,
    tempLevel: 0,
    permanentLevel: 0,
    progress: 0,
    allocation: { energy: 0, magic: 0, r3: 0 },
    data: {
      hasMeal: Boolean(data.meal),
      mealNumber: data.mealNumber,
      unlockedSlots: mask.filter(Boolean).length,
      ingredients: data.levels.map((level, index) => ({ index, unlocked: mask[index], level: mask[index] ? level : 0 })),
      levelMin: C.levelMin,
      levelMax: C.levelMax,
      efficiencyPct: efficiency * 100,
      totalCookingBonusesPct: bonuses.multiplier * 100,
      bonuses: {
        gearPieces: bonuses.gear.pieces.map(p => ({ slot: p.slot, name: p.name, count: p.count })),
        gearCount: bonuses.gear.count,
        gearMultiplier: bonuses.gearMultiplier,
        spaceSet: bonuses.spaceSet,
        slot7: bonuses.slot7,
        slot8: bonuses.slot8
      },
      mealExpGainPct: gain,
      mealExpGainDocumented: gain !== null,
      totalExpGainPct: data.totalExpGainPct,
      totalExpGainMaxPct: C.totalExpGainMaxPct,
      mealsEaten: data.mealsEaten,
      timer: {
        ready: timer.ready,
        readyInMs: timer.readyInMs,
        bankedMs: timer.bankedMs,
        mealMs: timer.mealMs,
        capMs: timer.capMs,
        breadSet: timer.breadSet
      }
    }
  };
}
