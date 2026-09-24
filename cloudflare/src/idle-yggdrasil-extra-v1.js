/*
 * SOREAL IDLE — Yggdrasil : compléments (2026-09-23).
 *
 * Poop (engrais d'Icarus Proudbottom), achats « Auto-Activate » de la
 * boutique EXP, quirk « The Beast's Fertilizer », perks d'activation rapide
 * (16/17), Fruit of Power δ, Watermelon, Fruit of Quirks, Fruit of Numbers
 * débloqué par le Troll Challenge. Le moteur (idle-ngu-progression.js)
 * n'appelle ce module que par de petits crochets délimités ; aucun import
 * croisé vers le moteur (fonctions pures sur l'état).
 *
 * Sources (miroir local NGU-Wiki, Règle n°1 d'AGENTS.md) :
 *  - « Yggdrasil » : sections « Icarus Proudbottom's Homemade Fertilizer (AKA
 *    Poop) », « Fruits and Fruit Effects », « Nerdy Formulas », « Yggdrasil
 *    upgrades » ;
 *  - « Experience », section « Yggdrasil » (coût EXP et « Required Resource
 *    Cap » de chaque Auto-Activate) ;
 *  - « 4G's Sellout Shop » (lots de Poop 1/10/100) ;
 *  - « Brown Heart (set) » / « Blue Heart (set) » ;
 *  - « Perk Points » (16, 17) ; « Quirk Points » (13) ;
 *  - « Challenges », Troll Challenge : « Completion 5 Reward(s) : A new fruit:
 *    The Fruit of Numbers! ».
 *
 * NON implémenté (valeur non exacte dans le wiki, ou système absent) :
 *  - fruits de Mayo (« 10 Qa Energy or Magic » ; la page Experience exige
 *    « 100 Q » de cap alors que la règle « 10x » donnerait 100 Qa) ;
 *  - QPRewardModifier du Fruit of Quirks : jamais défini par le wiki (page
 *    Questing : « then multiplied by other bonuses ») -> laissé à 1 ;
 *  - (fait le 2026-09-24 : A Giant Seed est un vrai objet, Seed (set) donne
 *    10 Poop, la graine réutilisée donne des graines -- voir plus bas) ;
 *  - (fait le 2026-09-24 : Poop d'Icarus Proudbottom en The Sky, tirée par
 *    rollKill d'idle-adventure-v47.js, et de l'ITOPOD avec la perk 30, voir
 *    idleYggItopodPoopV1) ;
 *  - souhait 60 « I wish Fruit of MacGuffin α also didn't suck » (+20 % par
 *    niveau, place dans l'arrondi non publiée).
 */

import { idleHeartsConsumableFactorV1 } from "./idle-hearts-v1.js";

const N = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const I = (v, d = 0) => Math.floor(N(v, d));

/* ---------- Poop ---------- */

/*
 * Page Yggdrasil : « Poop is a consumable that allows a specific fruits reward
 * to be increased by 50% (before rounding). This will only affect the next one
 * time it is eaten or harvested and will consume one Poop » ; Nerdy Formulas :
 * « Poop = If no Poop, this is 1. If Poop is used on that fruit, this is 1.5
 * (1.65 with Blue Heart Set) ».
 */
export const IDLE_YGG_POOP_FACTOR_V1 = 1.5;
/* « if the player has maxed the Brown Heart, then one every 10th Poop used will not be consumed ». */
export const IDLE_YGG_BROWN_HEART_EVERY_V1 = 10;

export function idleYggPoopCountV1(state) {
  return Math.max(0, I(state?.selloutEffects?.poop, 0));
}

/* 1,5 ; x1,1 avec le Blue Heart (set) (« All consumable give 10% better effects » -> 1,65). */
export function idleYggPoopFactorV1(state) {
  return IDLE_YGG_POOP_FACTOR_V1 * idleHeartsConsumableFactorV1(state);
}

export function idleYggBrownHeartActiveV1(state) {
  return Boolean(state?.adventure?.completedSets?.heartBrown);
}

/*
 * Utilise une Poop sur le fruit mangé/récolté (appelé seulement après toutes
 * les validations du fruit). Brown Heart (set) : le compteur poopUsed compte
 * chaque Poop utilisée ; chaque 10e n'est pas consommée si le set est complété.
 */
export function idleYggUsePoopV1(state) {
  const fx = state.selloutEffects;
  if (!fx || typeof fx !== "object" || idleYggPoopCountV1(state) < 1) throw new Error("POOP_INSUFFISANTE");
  fx.poopUsed = Math.max(0, I(fx.poopUsed, 0)) + 1;
  const free = idleYggBrownHeartActiveV1(state) && fx.poopUsed % IDLE_YGG_BROWN_HEART_EVERY_V1 === 0;
  if (!free) fx.poop = idleYggPoopCountV1(state) - 1;
  return { factor: idleYggPoopFactorV1(state), consumed: !free, free, remaining: idleYggPoopCountV1(state) };
}

/* ---------- Poop de l'ITOPOD (2026-09-24) ---------- */

/*
 * Perk 30 « What a Crappy Perk » (page Perk Points, 25 PP, 1 niveau) : « This
 * perk grants a tiny, tiny chance that the Pissed Off Dudes in the ITOPOD drop
 * poop. It also works offline! » ; même ligne, colonne « Buy Early? » : « gives
 * 1 poop every 9000 kills and additionally a 0.01% chance per kill for 1 poop ».
 * Recoupé par la page Yggdrasil : « from the ITOPOD at a rate of 2-11 per day
 * after buying the "What a Crappy Perk" perk » (≈ 9 500 à 52 000 kills par jour).
 * Le taux de 0,01 % n'est pas présenté comme une « base chance » : il n'est pas
 * multiplié par le Drop Chance.
 */
export const IDLE_YGG_ITOPOD_POOP_PERK_ID_V1 = 30;
export const IDLE_YGG_ITOPOD_POOP_KILLS_V1 = 9000;
export const IDLE_YGG_ITOPOD_POOP_CHANCE_V1 = 0.0001;
/* Au-delà, le tirage kill par kill est remplacé par l'espérance (choix d'implémentation, gros rattrapages hors-ligne). */
const ITOPOD_POOP_LOOP_MAX_V1 = 100000;

export function idleYggItopodPoopV1(state, kills, rng = Math.random) {
  const k = Math.max(0, I(kills, 0));
  if (k <= 0) return 0;
  if (I(state?.systems?.perks?.data?.levels?.[IDLE_YGG_ITOPOD_POOP_PERK_ID_V1], 0) < 1) return 0;
  const fx = state.selloutEffects;
  if (!fx || typeof fx !== "object") return 0;
  const total = Math.max(0, I(fx.itopodPoopKills, 0)) + k;
  let gain = Math.floor(total / IDLE_YGG_ITOPOD_POOP_KILLS_V1);
  fx.itopodPoopKills = total - gain * IDLE_YGG_ITOPOD_POOP_KILLS_V1;
  if (k <= ITOPOD_POOP_LOOP_MAX_V1) {
    for (let i = 0; i < k; i++) if (rng() < IDLE_YGG_ITOPOD_POOP_CHANCE_V1) gain++;
  } else {
    const attendu = k * IDLE_YGG_ITOPOD_POOP_CHANCE_V1;
    gain += Math.floor(attendu) + (rng() < attendu - Math.floor(attendu) ? 1 : 0);
  }
  if (gain > 0) fx.poop = idleYggPoopCountV1(state) + gain;
  return gain;
}

/* ---------- A Giant Seed réutilisée (2026-09-24) ---------- */

/*
 * Fiche « A Giant Seed » : « If used again: ... X seeds have been added! » ;
 * « A Giant Seed of level L gives max(1, ⌊L + L²/100⌋) seeds. For example, at
 * level 50 you will get 75 seeds and at level 100, 200 seeds. » Page Yggdrasil,
 * « Getting Seeds » : « 1 seed per item level, plus 1% bonus also per level
 * (rounded down) ». Le premier usage (déblocage d'Yggdrasil) reste le drapeau
 * unlockItems/consumeUnlock du moteur Aventure : cette action n'est possible
 * qu'une fois Yggdrasil débloqué, et retire l'objet du sac.
 */
export function idleYggGiantSeedSeedsV1(level) {
  const l = Math.max(0, I(level, 0));
  return Math.max(1, Math.floor(l + (l * l) / 100));
}

export function idleYggConsumeGiantSeedV1(state, itemId) {
  if (!state?.systems?.yggdrasil?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const adventure = state.adventure;
  const inventaire = Array.isArray(adventure?.inventory) ? adventure.inventory : [];
  const objet = inventaire.find((x) => x && x.id === String(itemId || ""));
  if (!objet || objet.definitionId !== "giantSeed") throw new Error("GRAINE_GEANTE_INVALIDE");
  /* Un objet verrouillé ne se consomme pas (même règle que la suppression côté client). */
  if (objet.locked) throw new Error("OBJET_VERROUILLE");
  const seeds = idleYggGiantSeedSeedsV1(objet.level);
  adventure.inventory = inventaire.filter((x) => x !== objet);
  if (adventure.equipment && Array.isArray(adventure.equipment.accessories)) {
    adventure.equipment.accessories = adventure.equipment.accessories.filter((x) => x !== objet.id);
  }
  /* Le client n'accepte un inventaire serveur que si sa révision avance (même règle que le Daycare). */
  adventure.revision = Math.max(0, I(adventure.revision, 0)) + 1;
  state.currencies.seeds = Math.max(0, N(state.currencies.seeds, 0)) + seeds;
  return { seeds, level: Math.max(0, I(objet.level, 0)) };
}

/* ---------- Auto-Activate (boutique EXP) ---------- */

/*
 * Page Experience, section Yggdrasil : « Buying these will automatically
 * activate the fruit whenever possible, AND remove the Energy or Magic
 * activation cost too! » ; « Your total Energy or Magic cap must be 10x
 * greater than the fruit's activation cost to buy these. » Coût (EXP) et
 * « Required Resource Cap » repris ligne par ligne ; la ressource est celle du
 * tableau (identique à la ressource d'activation du fruit).
 */
export const IDLE_YGG_AUTO_ACTIVATE_V1 = Object.freeze([
  Object.freeze({ fruit: "gold", name: "Fruit of Gold Auto-Activate", cost: 300, requiredCap: 1e6, resource: "energy" }),
  Object.freeze({ fruit: "powerAlpha", name: "Fruit of Power α Auto-Activate", cost: 500, requiredCap: 2e6, resource: "energy" }),
  Object.freeze({ fruit: "adventure", name: "Fruit of Adventure Auto-Activate", cost: 600, requiredCap: 2e6, resource: "energy" }),
  Object.freeze({ fruit: "knowledge", name: "Fruit of Knowledge Auto-Activate", cost: 2000, requiredCap: 1e7, resource: "energy" }),
  Object.freeze({ fruit: "pomegranate", name: "Pomegranate Auto-Activate", cost: 2000, requiredCap: 3e6, resource: "magic" }),
  Object.freeze({ fruit: "luck", name: "Fruit of Luck Auto-Activate", cost: 8000, requiredCap: 5e7, resource: "energy" }),
  Object.freeze({ fruit: "powerBeta", name: "Fruit of Power β Auto-Activate", cost: 10000, requiredCap: 3e7, resource: "magic" }),
  Object.freeze({ fruit: "arbitrariness", name: "Fruit of Arbitrariness Auto-Activate", cost: 15000, requiredCap: 2e8, resource: "energy" }),
  Object.freeze({ fruit: "numbers", name: "Fruit of Numbers Auto-Activate", cost: 20000, requiredCap: 1e8, resource: "magic" }),
  Object.freeze({ fruit: "rage", name: "Fruit of Rage Auto-Activate", cost: 100000, requiredCap: 5e9, resource: "energy" }),
  Object.freeze({ fruit: "macguffinAlpha", name: "Fruit of MacGuffins α Auto-Activate", cost: 500000, requiredCap: 5e9, resource: "magic" }),
  Object.freeze({ fruit: "powerDelta", name: "Fruit of Power δ Auto-Activate", cost: 2e6, requiredCap: 5e10, resource: "energy" }),
  Object.freeze({ fruit: "watermelon", name: "Watermelon Auto-Activate", cost: 5e6, requiredCap: 2e11, resource: "magic" }),
  Object.freeze({ fruit: "macguffinBeta", name: "Fruit of MacGuffins β Auto-Activate", cost: 1.5e7, requiredCap: 1e12, resource: "energy" }),
  Object.freeze({ fruit: "quirks", name: "Fruit of Quirks Auto-Activate", cost: 1e6, requiredCap: 4e11, resource: "magic" })
]);

export function idleYggAutoShopIdV1(fruitId) {
  const id = String(fruitId || "");
  return "yggAuto" + id.charAt(0).toUpperCase() + id.slice(1);
}

/* Entrées de IDLE_NGU_EXP_SHOP_V1 (achat unique chacune). */
export function idleYggAutoActivateExpShopEntriesV1() {
  return Object.fromEntries(IDLE_YGG_AUTO_ACTIVATE_V1.map((a) => [
    idleYggAutoShopIdV1(a.fruit),
    Object.freeze({ name: a.name, cost: () => a.cost, gain: 1, max: 1, yggFruit: a.fruit, resource: a.resource, requiredCap: a.requiredCap })
  ]));
}

export function idleYggAutoActivateOwnedV1(state, fruitId) {
  return Math.max(0, I(state?.bonuses?.expShop?.[idleYggAutoShopIdV1(fruitId)], 0)) >= 1;
}

/* Coût d'activation réel : 0 si l'Auto-Activate du fruit est acheté (« remove the ... activation cost »). */
export function idleYggActivationCostV1(state, def) {
  return idleYggAutoActivateOwnedV1(state, def.id) ? 0 : Math.max(0, N(def.activationCost, 0));
}

/*
 * « After unlocking it, that specific fruit will never be inactive, and will
 * always be activated pretty much instantly, for free. [Note: You do still
 * have to manually harvest/eat the fruit] » -> tout fruit débloqué (tier >= 1)
 * et inactif dont l'Auto-Activate est acheté redémarre sa croissance à zéro.
 */
export function idleYggAutoActivateV1(state, fruitDefs) {
  const data = state?.systems?.yggdrasil?.data;
  if (!state?.systems?.yggdrasil?.unlocked || !data?.fruits) return [];
  const activated = [];
  for (const def of fruitDefs) {
    const f = data.fruits[def.id];
    if (!f || f.active || I(f.tier, 0) <= 0 || !idleYggAutoActivateOwnedV1(state, def.id)) continue;
    f.active = true;
    f.growthHours = 0;
    activated.push(def.id);
  }
  return activated;
}

/* ---------- Croissance ---------- */

/*
 * Page Yggdrasil : « Every one full hour growing, they will reach the next
 * Tier » ; quirk 13 « The Beast's Fertilizer » (page Quirk Points, 3 niveaux) :
 * « Each tier will take 1 minute less to grow! ». Durée d'un tier en secondes.
 */
export const IDLE_YGG_TIER_SECONDS_V1 = 3600;
export const IDLE_YGG_FERTILIZER_QUIRK_ID_V1 = 13;
export const IDLE_YGG_FERTILIZER_SECONDS_V1 = 60;

export function idleYggTierSecondsV1(state) {
  const level = Math.max(0, Math.min(3, I(state?.systems?.quirks?.data?.levels?.[IDLE_YGG_FERTILIZER_QUIRK_ID_V1], 0)));
  return IDLE_YGG_TIER_SECONDS_V1 - IDLE_YGG_FERTILIZER_SECONDS_V1 * level;
}

/*
 * Perks 16/17 (page Perk Points) : « The Fruit of Power Beta's bonus / The
 * Fruit of Numbers' bonus will automatically turn on after 30 minutes, and
 * without having to eat the fruit! » -> 30 minutes après le début du Rebirth.
 */
export const IDLE_YGG_QUICK_ACTIVATION_SECONDS_V1 = 1800;

export function idleYggQuickActivationV1(state, nowMs) {
  const data = state?.systems?.yggdrasil?.data;
  if (!data) return;
  const run = (N(nowMs, 0) - Math.max(0, N(state.runStartedAt, 0))) / 1000;
  if (run < IDLE_YGG_QUICK_ACTIVATION_SECONDS_V1) return;
  const perks = state.systems?.perks?.data?.levels || {};
  if (I(perks[16], 0) >= 1) data.runPowerBetaActive = true;
  if (I(perks[17], 0) >= 1) data.runNumbersActive = true;
}

/* ---------- Déblocage ---------- */

/* Troll Challenge (Normal), complétion 5 : « A new fruit: The Fruit of Numbers! ». */
export const IDLE_YGG_NUMBERS_TROLL_COMPLETIONS_V1 = 5;

export function idleYggFruitUnlockedV1(state, fruitId) {
  if (fruitId === "numbers") return I(state?.challenge?.completions?.troll, 0) >= IDLE_YGG_NUMBERS_TROLL_COMPLETIONS_V1;
  return true;
}

/* ---------- Effets des nouveaux fruits ---------- */

/*
 * Fruit of Power δ : « Your "Invisible Fruit of Power δ Level" grants you a
 * permanent, always active Attack/Defense bonus based off Invisible Fruit of
 * Power δ Level^1.3 * 0.0001% ».
 */
export function idleYggPowerDeltaMultiplierV1(ygg) {
  const level = Math.max(0, N(ygg?.permanent?.powerDeltaValue, 0));
  return 1 + Math.pow(level, 1.3) * 1e-6;
}

/*
 * Unité de tier des graines. Fruit of Quirks : « When harvested, this fruit
 * gives the standard seed reward based off of T^1.5. When eaten, the seed
 * reward is based on the tier formula used for the fruit's specific bonus »
 * (sa formule de QP utilise T, pas ⌈T^1.5⌉).
 */
export function idleYggSeedUnitV1(def, tier, eaten) {
  const t = Math.max(1, I(tier, 1));
  if (eaten && def?.eatSeedUnit === "linear") return t;
  return Math.ceil(Math.pow(t, 1.5));
}

/*
 * Fruit of Quirks : « ⌈T x 3 x QPRewardModifier x Poop x Quirk_Ygg x
 * Equip_YggYield x FirstHarvest⌉ ». QPRewardModifier non publié -> 1.
 */
export function idleYggFruitOfQuirksQpV1(tier, multipliers = 1) {
  return Math.ceil(Math.max(1, I(tier, 1)) * 3 * Math.max(0, N(multipliers, 1)));
}

/* ---------- Instantané client ---------- */

export function idleYggExtraSnapshotV1(state, fruitDefs, deps = {}) {
  const fx = state?.selloutEffects || {};
  const used = Math.max(0, I(fx.poopUsed, 0));
  const brown = idleYggBrownHeartActiveV1(state);
  const autos = Object.fromEntries(IDLE_YGG_AUTO_ACTIVATE_V1.map((a) => [a.fruit, a]));
  return {
    poop: idleYggPoopCountV1(state),
    poopUsed: used,
    poopFactor: idleYggPoopFactorV1(state),
    brownHeart: brown,
    /* Rang de la prochaine Poop gratuite (1 = la prochaine) ; null sans Brown Heart (set). */
    nextFreePoopIn: brown ? IDLE_YGG_BROWN_HEART_EVERY_V1 - (used % IDLE_YGG_BROWN_HEART_EVERY_V1) : null,
    tierSeconds: idleYggTierSecondsV1(state),
    maxTier: deps.maxTier,
    fruits: Object.fromEntries(fruitDefs.map((def) => {
      const f = state?.systems?.yggdrasil?.data?.fruits?.[def.id] || {};
      const auto = autos[def.id];
      const tier = Math.max(0, I(f.tier, 0));
      return [def.id, {
        unlocked: idleYggFruitUnlockedV1(state, def.id),
        activationCost: idleYggActivationCostV1(state, def),
        nextTierCost: typeof deps.tierCost === "function" && tier < N(deps.maxTier, 0) ? deps.tierCost(def, tier + 1) : null,
        autoActivate: idleYggAutoActivateOwnedV1(state, def.id),
        autoShopId: auto ? idleYggAutoShopIdV1(def.id) : null,
        autoCost: auto ? auto.cost : null,
        autoRequiredCap: auto ? auto.requiredCap : null
      }];
    }))
  };
}
