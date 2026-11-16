/*
 * SOREAL IDLE — Questing (quêtes de la Bête, Quirk Points).
 *
 * Module autonome (2026-09-23) : toute la logique des quêtes vit ici ;
 * idle-ngu-progression.js ne fait que l'appeler par quatre crochets
 * courts (tick, action, kill de zone, snapshot) et lui fournir un `env`
 * de valeurs déjà calculées ailleurs (respawn, Quest Drops de
 * l'équipement, multiplicateurs de Perks/Hack). Ce module n'importe
 * jamais idle-ngu-progression.js (pas de dépendance circulaire).
 *
 * Source unique : miroir local du wiki NGU Idle
 * (Documents/NGU-Wiki/pages/<Titre>.json), pages "Questing",
 * "Perk Points", "Quirk Points", "Wishes", "4G's Sellout Shop",
 * "Arbitrary Points", "Fibonacci Perk", "Respawn", "Mobster (set)",
 * "Fad (set)" et les pages de zone (ligne "<objet> - if on quest").
 * Règle n°1 d'AGENTS.md : aucune valeur n'est inventée ; chaque constante
 * ci-dessous cite sa phrase source. Les points que le wiki laisse ouverts
 * (façon de cumuler deux bonus, ordre de remise des objets...) sont
 * signalés "CHOIX SOREAL" : ce sont des conventions de code, jamais des
 * nombres de jeu.
 *
 * Heroic Sigil (set) "+10 % Quest Drops" et Orange Heart (set) "+20 % QP" :
 * câblés le 2026-09-23 (le Sigil et le cœur sont désormais de vrais objets
 * fusionnables, SETS_OBJETS_V1 dans idle-adventure-v47.js) ; Blue Heart (set) :
 * Beast Butter x2,2 au lieu de x2 (idle-hearts-v1.js).
 *
 * Volontairement NON implémenté (effet non modélisable sans inventer) :
 *  - Quest Reminder (voyant du menu : relève du monolithe client) ;
 *  - Fruit of Quirks (Yggdrasil), montée de niveau des objets de quête en
 *    Daycare (48 h) : systèmes absents ou tenus par d'autres.
 * (Cartes QP : branchées le 2026-09-24, env.qpCardMultiplier.)
 *
 * MESURÉ DANS LE VRAI JEU (NGU Idle build 1260, banc d'essai, 2026-11-15, Major idle de base 50 QP) : Beast Butter x2 (100) ; Orange Heart x1,2 (120 avec le beurre) ;
 * Better QP Rewards 50 (+10 %) et Fibonacci 233 (+10 %) se MULTIPLIENT : 50 x 2 x 1,10 x 1,10 x 1,2 = 145 ; Improved Quest Looting niveau 30 = x1,15 de vitesse d'idle et le Heroic Sigil
 * est un facteur SÉPARÉ x1,1 (1,15 x 1,1 = 1,265, mesuré 1,265). Non mesurés (objets ou systèmes inaccessibles au banc) : souhait 47, Mobster, objets de quête, Hack, cartes.
 */
import { IDLE_PERKS_CATALOG_V1 } from "./idle-perks-v1.js";
import { exileIndiceBeteV1 } from "./idle-antlers-v1.js";
import { idlePerkNiveauxV1, idleQuirkNiveauxV1, idleWishTracksActifsV1 } from "./idle-difficulty-gates-v1.js";
import { IDLE_QUIRKS_CATALOG_V1 } from "./idle-quirks-v1.js";
import { IDLE_WISHES_CATALOG_V1 } from "./idle-wishes-v1.js";
import { IDLE_ADVENTURE_ZONES, idleAdventureMergeLevelV47 } from "./idle-adventure-v47.js";
import { idleHeartsQpMultiplierV1, idleHeartsConsumableFactorV1 } from "./idle-hearts-v1.js";

import { nombreV1, entierV1 } from "./idle-outils-v1.js";   /* outils communs (identiques aux anciennes définitions locales) */
const N = nombreV1;
const I = entierV1;

/* Questing : "Every 7 hours and 50 minutes you will earn a major quest, up to a maximum of 10." */
export const IDLE_QUEST_MAJOR_INTERVAL_SECONDS_V1 = (7 * 60 + 50) * 60;
export const IDLE_QUEST_BANK_CAP_V1 = 10;
/* 4G's Sellout Shop, Extended Quest Bank : "Increase your Major Quests cap from 10 to 50." */
export const IDLE_QUEST_BANK_CAP_EXTENDED_V1 = 50;
/* Sellout "Faster Questing!" : "Gain Major Quests 20% faster." ; Fad (set) : "10% Faster Major Quests!". */
export const IDLE_QUEST_FASTER_QUESTING_PCT_V1 = 0.20;
export const IDLE_QUEST_FAD_SET_FASTER_PCT_V1 = 0.10;
/* Fad (set) : "10% Faster Major Quests!<br/>3 Beast Butters" (bonus de complétion, une seule fois). */
export const IDLE_QUEST_FAD_SET_BUTTERS_V1 = 3;
/*
 * Questing : "The base reward for completing a quest is 50 Quirk Points and 50 Arbitrary Points."
 * Perk "Not So Minor Anymore" : "The base Minor Quest reward modifier is increased by 2 ... Normally this value is 10."
 * ("the minor quest only gives 20% reward" : 10 = 20 % de 50.)
 */
export const IDLE_QUEST_BASE_REWARD_MAJOR_V1 = 50;
export const IDLE_QUEST_BASE_REWARD_MINOR_V1 = 10;
/* Questing : "Completing a quest without filling the idle mode bar doubles the reward." */
export const IDLE_QUEST_ACTIVE_REWARD_FACTOR_V1 = 2;
/* Questing : "collect between 50-59 of a specific quest item (Fibonacci perk Level 610 reward sets it to 50 items every time)". */
export const IDLE_QUEST_ITEMS_MIN_V1 = 50;
export const IDLE_QUEST_ITEMS_SPREAD_V1 = 10;
/* Questing : "The base drop chance for quest items is 5% from all enemies." */
export const IDLE_QUEST_BASE_DROP_CHANCE_V1 = 0.05;
/* Questing, Idle questing : "idle quest divider (8 by default, can be reduced to 3 by upgrades)". */
export const IDLE_QUEST_IDLE_DIVIDER_BASE_V1 = 8;
export const IDLE_QUEST_IDLE_DIVIDER_MIN_V1 = 3;
/*
 * Hand-in : Perk 145 "The formula is 1 + (level/10) progress, rounded down." ; Perk 146 / Quirk 71 /
 * Souhaits 80-81 "reduce the level ratio ... by 1 per level". La page Questing écrit le diviseur
 * 11 - (Bonus Hand In Level), le total des 9 niveaux possibles (Perks 3, Quirks 2, Wishes 4) :
 * 1 niveau -> /10, 9 niveaux -> /2 ("from 10% of the item level up to a maximum of 50%").
 * Sans aucun de ces achats : "Higher level items don't give additional progress" (1 par objet).
 */
export const IDLE_QUEST_HANDIN_DIVIDER_BASE_V1 = 11;
/* Questing : "Quest items drop at level 0" ; "For each unique quest item type you level to 100 ... +2% QP." */
export const IDLE_QUEST_ITEM_MAX_LEVEL_V1 = 100;
export const IDLE_QUEST_ITEM_COMPLETION_QP_PCT_V1 = 0.02;
/* Mobster (set) : "+15% QP Gain". */
export const IDLE_QUEST_MOBSTER_SET_QP_PCT_V1 = 0.15;
/* Sellout, Beast Butter : "Doubles your QP reward on your next quest." */
export const IDLE_QUEST_BUTTER_FACTOR_V1 = 2;
/* Fibonacci Perk (id 94) : niveau 610 "Quests now require a set 50 items". */
export const IDLE_QUEST_FIBONACCI_FIXED_LEVEL_V1 = 610;

/*
 * Questing, "List of Quest Items" + pages de zone ("<objet> - if on quest").
 * `set` : "You will only be assigned quests for a given zone once you have completed the gear set
 * for that zone (maxxed all items in the set)" -- le set de la zone, tel que listé dans sa section
 * Loot (Sewers/Forest/HSB/2D/Gaudy/Mega/Beardverse/Choco/Edgy/Pretty Pink Princess).
 * `wikiId` : numéro de l'image de l'objet (ex. "278 - Bits of String.png").
 */
export const IDLE_QUEST_ITEMS_V1 = Object.freeze([
  Object.freeze({ zone: "sewers", set: "sewers", wikiId: 278, name: "Bits of String" }),
  Object.freeze({ zone: "forest", set: "forest", wikiId: 281, name: "A Dreamcatcher" }),
  Object.freeze({ zone: "hsb", set: "hsb", wikiId: 283, name: "A Missing Puzzle Piece" }),
  Object.freeze({ zone: "2d", set: "2d", wikiId: 279, name: "The Entire State of North Dakota" }),
  Object.freeze({ zone: "avsp", set: "gaudy", wikiId: 282, name: "Random Canadian Coins" }),
  Object.freeze({ zone: "mega", set: "mega", wikiId: 287, name: "A Useless College Diploma" }),
  Object.freeze({ zone: "beardverse", set: "beardverse", wikiId: 285, name: "A Spittoon" }),
  Object.freeze({ zone: "chocolate", set: "choco", wikiId: 280, name: "A Toothbrush" }),
  Object.freeze({ zone: "evilverse", set: "edgy", wikiId: 284, name: "A Severed Human Thumb" }),
  Object.freeze({ zone: "pinkprincess", set: "pinkprincess", wikiId: 286, name: "A Smaller Caterpillar" })
]);

export function idleQuestItemByZoneV1(zone) {
  return IDLE_QUEST_ITEMS_V1.find(x => x.zone === String(zone || "")) || null;
}

function zoneNameV1(zone) {
  const z = IDLE_ADVENTURE_ZONES.find(x => x.id === zone);
  return z ? z.name : String(zone || "");
}

/* ---------- Bonus des Perks / Quirks / Souhaits (clés `quest*` des catalogues) ---------- */

/*
 * Les catalogues portent les effets de quête sous des clés préfixées "quest" (et qpEarningsPct pour
 * "Better QP Rewards!", même compartiment que Fibonacci 233 "+10% QP rewards"). perkBonusesV1 &
 * co. les additionnent déjà dans leur total interne sans les exposer : on les relit ici, niveau x
 * valeur par niveau, exactement comme eux, sans toucher à leurs objets de retour.
 */
export function idleQuestBonusTotalsV1(state) {
  const totals = {};
  const addKeys = (bonus, level) => {
    for (const [key, perLevel] of Object.entries(bonus || {})) {
      if (!key.startsWith("quest")) continue;
      totals[key] = (totals[key] || 0) + N(perLevel) * level;
    }
  };
  const perkLevels = idlePerkNiveauxV1(state);
  for (const perk of IDLE_PERKS_CATALOG_V1) {
    const level = Math.max(0, Math.min(perk.cap, I(perkLevels[perk.id])));
    if (!level) continue;
    addKeys(perk.bonus, level);
    if (Array.isArray(perk.fibonacciMilestones)) {
      for (const tier of perk.fibonacciMilestones) {
        if (level < tier.level) continue;
        const { level: _ignore, ...rest } = tier;
        addKeys(rest, 1);
      }
    }
  }
  const quirkLevels = idleQuirkNiveauxV1(state);
  for (const quirk of IDLE_QUIRKS_CATALOG_V1) {
    const level = Math.max(0, Math.min(quirk.cap, I(quirkLevels[quirk.id])));
    if (level) addKeys(quirk.bonus, level);
  }
  const wishTracks = idleWishTracksActifsV1(state);
  /* Lu dans le jeu (BeastQuestController::allActiveModifier) : 2 x souhait 19 x souhait 62, un PRODUIT. */
  let activeRewardProduct = 1;
  for (const wish of IDLE_WISHES_CATALOG_V1) {
    const level = Math.max(0, Math.min(wish.levels, I(wishTracks[String(wish.id)]?.level)));
    if (level) {
      addKeys(wish.bonus, level);
      if (wish.bonus && wish.bonus.questActiveRewardPct) activeRewardProduct *= 1 + N(wish.bonus.questActiveRewardPct) * level;
    }
  }
  return {
    /* Lu dans le jeu (BeastQuestController, build 1260, 2026-11-15) : les bonus de base (souhaits 101/102, atouts 147/148) ne s'ajoutent qu'à partir de la difficulté Sadistic. */
    majorBaseBonus: state?.difficulty === "extreme" ? totals.questMajorBaseQp || 0 : 0,
    /* Lu dans le jeu (BeastQuestController::minorQuestReward) : l'atout 87 (+2) s'ajoute dès qu'il est possédé, quelle que soit la difficulté ; l'atout 148 et le souhait 102 seulement à partir de Sadistic ; la base mineure totale (10 + bonus) est plafonnée à 16. */
    minorBaseBonus: Math.min(6, (totals.questMinorBaseAlways || 0) + (state?.difficulty === "extreme" ? totals.questMinorBaseQp || 0 : 0)),
    handInBonusLevel: totals.questHandinReduction || 0,
    idleDividerReduction: totals.questIdleDividerReduction || 0,
    questDropsPct: totals.questDropsPct || 0,
    trulyIdle: (totals.questTrulyIdle || 0) > 0,
    fixedItems: (totals.questFixedItems || 0) > 0,
    questQpPct: totals.questQpPct || 0,
    activeRewardPct: totals.questActiveRewardPct || 0,
    activeRewardMultiplier: activeRewardProduct,
    /* Perk 87 possédé : +2 à la base mineure des AP (plafond 13). */
    minorApBonus: (totals.questMinorBaseAlways || 0) > 0 ? 2 : 0
  };
}

/* ---------- Formules ---------- */

/* Diviseur d'idle : 8 - réductions (Perks 91, 92, 105 (x2), 106), plancher 3. */
export function idleQuestIdleDividerV1(bonus) {
  return Math.max(IDLE_QUEST_IDLE_DIVIDER_MIN_V1, IDLE_QUEST_IDLE_DIVIDER_BASE_V1 - Math.max(0, N(bonus?.idleDividerReduction)));
}

/* Valeur de remise d'un objet de quête de niveau `level` (voir IDLE_QUEST_HANDIN_DIVIDER_BASE_V1). */
export function idleQuestHandInValueV1(level, handInBonusLevel) {
  const b = Math.max(0, Math.min(9, I(handInBonusLevel)));
  if (b <= 0) return 1;
  const divider = IDLE_QUEST_HANDIN_DIVIDER_BASE_V1 - b;
  return 1 + Math.floor(Math.max(0, I(level)) / divider);
}

/*
 * Multiplicateur "Quest Drops" : spéciaux d'équipement "Quest Drops" (Build Quest Drops, en %) +
 * Perk 90 "Improved Quest Looting" ("improve the drop chance for Quest Items by 0.5%" par niveau).
 * LU DANS LE CODE DU JEU (build 1260, 2026-11-15) : l'équipement et le Perk se MULTIPLIENT : (1 + équipement) x (1 + perk), puis le Sigil. La Drop Chance normale ne compte pas : "It is increased by the Quest
 * Drops special rather than regular Drop Chance specials".
 */
export function idleQuestDropMultiplierV1(bonus, env) {
  /*
   * Heroic Sigil (set) : "Quest items drop 10% more often!" (env.questDropsSetPct = 0,10 une fois le
   * Sigil au niveau 100). facteur séparé x1,1 (lu dans le jeu).
   */
  const sigil = 1 + Math.max(0, N(env?.questDropsSetPct));
  return Math.max(0, 1 + Math.max(0, N(env?.gearQuestDropsPct)) / 100) * Math.max(0, 1 + Math.max(0, N(bonus?.questDropsPct)) / 100) * sigil;
}

/*
 * Questing, "Idle questing" : temps = divider x items x (respawn + speed) / (3 x drop) minutes,
 * soit, par objet, divider x (respawn + speed) / (5 % x drop) secondes ("20 x items x (respawn +
 * speed) / drop seconds" en quête active, divider = 1). respawn : temps de respawn réel (base 4 s,
 * page Respawn) ; speed : 0,8 s avec Mysterious Red Liquid maxé, 1 s sinon ; drop : multiplicateur
 * Quest Drops. "Items that improve quest drop percentages will improve your idle questing speed by
 * the same amount."
 */
export function idleQuestIdleSecondsPerItemV1(divider, env, dropMultiplier) {
  const respawn = Math.max(0, N(env?.respawnSeconds, 4));
  const speed = Math.max(0, N(env?.idleAttackSeconds, 1));
  const drop = Math.max(1e-9, N(dropMultiplier, 1));
  return (Math.max(1, N(divider, IDLE_QUEST_IDLE_DIVIDER_BASE_V1)) * (respawn + speed)) / (IDLE_QUEST_BASE_DROP_CHANCE_V1 * drop);
}

/*
 * Intervalle d'une Major Quest. MESURÉ DANS LE VRAI JEU (NGU Idle build 1260, banc d'essai, 2026-11-15, minuteur de Major posé juste avant l'échéance) :
 * intervalle de base 28 200 s (7 h 50) ; « 20 % plus vite » (Faster Questing) RACCOURCIT l'intervalle de 20 % (x0,8 = 22 560 s, et non 28 200 / 1,2) ; Fad
 * « 10 % plus vite » le raccourcit de 10 % (x0,9 = 25 380 s) ; les deux ensemble donnent x0,72 (20 304 s, mesuré 20 303), multiplicatifs et non additifs (x0,70).
 */
export function idleQuestMajorIntervalSecondsV1(state) {
  let facteur = 1;
  if (I(state?.selloutShop?.purchases?.fasterQuesting) > 0) facteur *= 1 - IDLE_QUEST_FASTER_QUESTING_PCT_V1;
  if (state?.adventure?.completedSets?.fad) facteur *= 1 - IDLE_QUEST_FAD_SET_FASTER_PCT_V1;
  return IDLE_QUEST_MAJOR_INTERVAL_SECONDS_V1 * facteur;
}

export function idleQuestBankCapV1(state) {
  return I(state?.selloutShop?.purchases?.extendedQuestBank) > 0 ? IDLE_QUEST_BANK_CAP_EXTENDED_V1 : IDLE_QUEST_BANK_CAP_V1;
}

/*
 * Récompense d'une quête terminée.
 *  - base : 50 (Major) + Perk 147 + Souhait 101 ; 10 (Minor) + 2 (Perk 87) + Perk 148 + Souhait 102.
 *  - active (barre d'idle jamais remplie) : x2, et les souhaits 19/62 ("2% / 1% better active
 *    questing rewards per level") majorent cette récompense active (lu dans le jeu : ils
 *    s'appliquent au QP ET aux AP ; sans eux, page Arbitrary Points : 120 AP pour une Major active = (50 + 10) x 2).
 *  - QP : x Perks (Fibonacci 233 +10 %, Better QP Rewards +0,2 %/niv., via env.qpEarningsMultiplier)
 *    x Souhait 47 (+2 %/niv.) x Mobster (+15 %) x objets de quête niveau 100 (+2 % chacun)
 *    x QP Hack (env.qpHackMultiplier) x cartes QP (env.qpCardMultiplier) x Beast Butter (x2). chaque source multiplie les autres
 *    (lu dans le jeu ; les objets de quête niveau 100 se composent : 1,02 puissance n) ; arrondi à l'entier inférieur.
 *  - AP : base x2 si active, x bonus AP généraux (env.apEarningsMultiplier), arrondi inférieur
 *    ("the final AP value is rounded down", page Arbitrary Points ; 10 AP pour une Minor idle).
 */
/*
 * Facteur de QP commun à toutes les sources (quêtes ET titans), lu dans le jeu (BeastQuestController::questRewardFactor, build 1260, 2026-11-16) :
 * set Godmother (x1,15, ici « mobster »), 1,02 ^ objets de quête au niveau 100, atouts ITOPOD (totalQPBonus), hack QP, souhait 47, cartes QP,
 * Orange Heart (x1,2), atout Fibonacci 233 (x1,1). Le Beast Butter se multiplie à part (butterFactor de idleQuestRewardV1).
 */
export function idleQuestQpMultiplierV1(state, env) {
  const bonus = idleQuestBonusTotalsV1(state);
  const data = state?.systems?.questing?.data || {};
  const maxedCount = IDLE_QUEST_ITEMS_V1.filter(x => data.maxedItems && data.maxedItems[x.zone]).length;
  return (
    Math.max(0, N(env?.qpEarningsMultiplier, 1)) *
    (1 + bonus.questQpPct) *
    (state?.adventure?.completedSets?.mobster ? 1 + IDLE_QUEST_MOBSTER_SET_QP_PCT_V1 : 1) *
    idleHeartsQpMultiplierV1(state) /* Orange Heart (set) : "Quests give 20% more QP!" */ *
    Math.pow(1 + IDLE_QUEST_ITEM_COMPLETION_QP_PCT_V1, maxedCount) *
    Math.max(0, N(env?.qpHackMultiplier, 1)) *
    /*
     * Cartes QP (2026-09-24) : page Cards, type « QP Gain (QP) » ; page Questing, « Other features :
     * QP Hacks, QP Cards ». Même traitement que le QP Hack (facteur multiplicatif, facteur
     * multiplicatif, lu dans le jeu), calculé par idle-cards-v1.js (cardsQpGainMultiplier).
     */
    Math.max(0, N(env?.qpCardMultiplier, 1))
  );
}

export function idleQuestRewardV1(state, env, { major, usedIdle, butter }) {
  const bonus = idleQuestBonusTotalsV1(state);
  const base = major
    ? IDLE_QUEST_BASE_REWARD_MAJOR_V1 + bonus.majorBaseBonus
    : IDLE_QUEST_BASE_REWARD_MINOR_V1 + bonus.minorBaseBonus;
  const activeFactor = usedIdle ? 1 : IDLE_QUEST_ACTIVE_REWARD_FACTOR_V1;
  const activeWish = usedIdle ? 1 : bonus.activeRewardMultiplier;
  const qpMultiplier = idleQuestQpMultiplierV1(state, env);
  /* Beast Butter : x2, x2,2 avec le Blue Heart (set) ("All consumable give 10% better effects"). */
  const butterFactor = butter ? IDLE_QUEST_BUTTER_FACTOR_V1 * idleHeartsConsumableFactorV1(state) : 1;
  const qp = Math.floor(base * activeFactor * activeWish * qpMultiplier * butterFactor);
  /* Lu dans le jeu (majorQuestAPReward = 50 ; minorQuestAPReward = 10, +2 avec l'atout 87, plafonné à 13) : les bonus de base du QP (souhaits 101/102, atouts 147/148) ne comptent pas pour les AP. */
  const apBase = major ? 50 : Math.min(13, 10 + bonus.minorApBonus);
  const ap = Math.floor(apBase * activeFactor * activeWish * Math.max(0, N(env?.apEarningsMultiplier, 1)));
  return { qp, ap, base, activeFactor, activeWish, qpMultiplier, butter: Boolean(butter) };
}

/* ---------- État ---------- */

function normalizeQuestV1(raw) {
  if (!raw || typeof raw !== "object") return null;
  const def = idleQuestItemByZoneV1(raw.zone);
  if (!def) return null;
  const required = Math.max(1, I(raw.required, IDLE_QUEST_ITEMS_MIN_V1));
  return {
    major: Boolean(raw.major),
    zone: def.zone,
    required,
    progress: Math.max(0, Math.min(required, I(raw.progress))),
    idleBar: Math.max(0, Math.min(0.999999999999, N(raw.idleBar))),
    usedIdle: Boolean(raw.usedIdle),
    startedAt: Math.max(0, N(raw.startedAt))
  };
}

export function normalizeIdleQuestingDataV1(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const items = {};
  for (const def of IDLE_QUEST_ITEMS_V1) {
    const byLevel = src.items && typeof src.items === "object" ? src.items[def.zone] : null;
    if (!byLevel || typeof byLevel !== "object") continue;
    const clean = {};
    for (const [lv, n] of Object.entries(byLevel)) {
      const level = I(lv, -1);
      const count = Math.max(0, I(n));
      if (level < 0 || level > IDLE_QUEST_ITEM_MAX_LEVEL_V1 || count <= 0) continue;
      clean[String(level)] = count;
    }
    if (Object.keys(clean).length) items[def.zone] = clean;
  }
  const maxedItems = {};
  for (const def of IDLE_QUEST_ITEMS_V1) if (src.maxedItems && src.maxedItems[def.zone]) maxedItems[def.zone] = true;
  const stats = src.stats && typeof src.stats === "object" ? src.stats : {};
  return {
    quest: normalizeQuestV1(src.quest),
    idle: Boolean(src.idle),
    preferMajor: src.preferMajor !== false,
    /* Lu dans le jeu (BeastQuest.usedButter) : le beurre est actif seulement quand le joueur l'utilise ; par défaut il n'est plus consommé automatiquement. */
    useButter: src.useButter === true,
    /* Lu dans le jeu (BeastQuest::.ctor) : 3 Major en banque au départ. */
    majorsBanked: src.majorsBanked === undefined ? 3 : Math.max(0, I(src.majorsBanked)),
    majorProgressSeconds: Math.max(0, N(src.majorProgressSeconds)),
    items,
    maxedItems,
    fadButtersGranted: Boolean(src.fadButtersGranted),
    stats: {
      majorCompleted: Math.max(0, I(stats.majorCompleted)),
      minorCompleted: Math.max(0, I(stats.minorCompleted)),
      qpEarned: Math.max(0, N(stats.qpEarned)),
      apEarned: Math.max(0, N(stats.apEarned))
    },
    lastReward: src.lastReward && typeof src.lastReward === "object" ? { ...src.lastReward } : null
  };
}

function questingDataV1(state) {
  const sys = state?.systems?.questing;
  if (!sys) return null;
  sys.data = normalizeIdleQuestingDataV1(sys.data);
  return sys.data;
}

/* Stock de Beast Butter : tenu par state.selloutEffects.beastButters (achats Sellout, roue, set Fad). */
function buttersV1(state) {
  return Math.max(0, I(state?.selloutEffects?.beastButters));
}
function addButtersV1(state, n) {
  if (!state.selloutEffects || typeof state.selloutEffects !== "object") state.selloutEffects = { remaining: {}, beta: {}, bluePills: 0 };
  state.selloutEffects.beastButters = buttersV1(state) + Math.max(0, I(n));
}

export function idleQuestEligibleZonesV1(state) {
  const done = state?.adventure?.completedSets || {};
  /* Lu dans le jeu (BeastQuestController::constructQuestList, 2026-11-16) : Sewers toujours disponible ; Evilverse et Pretty Pink Princess seulement à partir d'Evil ; les autres demandent leur set complété. */
  const evil = state?.difficulty && state.difficulty !== "normal";
  return IDLE_QUEST_ITEMS_V1.filter(x => x.zone === "sewers" || (Boolean(done[x.set]) && (evil || (x.zone !== "evilverse" && x.zone !== "pinkprincess")))).map(x => x.zone);
}

function startQuestV1(state, d, major, now, rng) {
  if (d.quest) throw new Error("QUETE_DEJA_ACTIVE");
  const zones = idleQuestEligibleZonesV1(state);
  if (!zones.length) throw new Error("QUETE_AUCUNE_ZONE");
  if (major && d.majorsBanked < 1) throw new Error("QUETE_MAJEURE_INDISPONIBLE");
  const bonus = idleQuestBonusTotalsV1(state);
  /* Zone tirée uniformément parmi celles dont le set est terminé, quantité de 50 à 59 : lu dans le jeu (2026-11-15). */
  const zone = zones[Math.min(zones.length - 1, Math.floor(rng() * zones.length))];
  const required = bonus.fixedItems
    ? IDLE_QUEST_ITEMS_MIN_V1
    : IDLE_QUEST_ITEMS_MIN_V1 + Math.min(IDLE_QUEST_ITEMS_SPREAD_V1 - 1, Math.floor(rng() * IDLE_QUEST_ITEMS_SPREAD_V1));
  if (major) d.majorsBanked -= 1;
  d.quest = { major: Boolean(major), zone, required, progress: 0, idleBar: 0, usedIdle: false, startedAt: N(now) };
  return { started: true, major: Boolean(major), zone, required, itemName: idleQuestItemByZoneV1(zone).name };
}

function completeQuestV1(state, d, env, auto) {
  const q = d.quest;
  if (!q) throw new Error("AUCUNE_QUETE_ACTIVE");
  if (q.progress < q.required) throw new Error("QUETE_INCOMPLETE");
  const butter = d.useButter && buttersV1(state) > 0;
  const reward = idleQuestRewardV1(state, env, { major: q.major, usedIdle: q.usedIdle, butter });
  if (butter) state.selloutEffects.beastButters = buttersV1(state) - 1;
  state.currencies.qp = Math.max(0, N(state.currencies.qp)) + reward.qp;
  state.currencies.ap = Math.max(0, N(state.currencies.ap)) + reward.ap;
  if (q.major) d.stats.majorCompleted += 1;
  else d.stats.minorCompleted += 1;
  d.stats.qpEarned += reward.qp;
  d.stats.apEarned += reward.ap;
  d.lastReward = { major: q.major, zone: q.zone, qp: reward.qp, ap: reward.ap, active: !q.usedIdle, butter: reward.butter, auto: Boolean(auto) };
  /* BeastQuestController::giveRewardsAndClear (build 1260) : quête rendue à la main, aucun objet venu de l'idle, jauge idle entre 90 % et 100 %, Tentacule (337) vu : Bois de l'Exilé (338). Avant la remise à zéro de la quête (clearQuest). */
  const indiceExile = exileIndiceBeteV1(state.adventure, d.idle, q);
  d.quest = null;
  return { completed: true, ...d.lastReward, ...(indiceExile ? { indiceExile: true } : {}) };
}

/* Remise : "turn in all items that match your current quest" ; le surplus reste en stock. */
function handInV1(state, d) {
  const q = d.quest;
  if (!q) throw new Error("AUCUNE_QUETE_ACTIVE");
  const stock = d.items[q.zone] || {};
  const bonus = idleQuestBonusTotalsV1(state);
  let handedIn = 0;
  let gained = 0;
  /* CHOIX SOREAL : niveaux croissants (garde les objets montés en niveau le plus longtemps possible). */
  const levels = Object.keys(stock).map(Number).sort((a, b) => a - b);
  for (const level of levels) {
    while (stock[level] > 0 && q.progress < q.required) {
      const value = idleQuestHandInValueV1(level, bonus.handInBonusLevel);
      q.progress = Math.min(q.required, q.progress + value);
      gained += value;
      stock[level] -= 1;
      handedIn += 1;
    }
    if (stock[level] <= 0) delete stock[level];
  }
  if (Object.keys(stock).length) d.items[q.zone] = stock;
  else delete d.items[q.zone];
  return { handedIn, progress: q.progress, required: q.required, gained };
}

/* Fusion de deux objets de quête du même type : même règle que l'équipement (niveau a + b + 1, max 100). */
function mergeItemsV1(d, zone, levelA, levelB) {
  const def = idleQuestItemByZoneV1(zone);
  if (!def) throw new Error("OBJET_QUETE_INVALIDE");
  const a = I(levelA, -1);
  const b = I(levelB, -1);
  const stock = d.items[def.zone] || {};
  const need = {};
  need[a] = (need[a] || 0) + 1;
  need[b] = (need[b] || 0) + 1;
  for (const [lv, n] of Object.entries(need)) if (I(stock[lv]) < n) throw new Error("OBJET_QUETE_ABSENT");
  if (a >= IDLE_QUEST_ITEM_MAX_LEVEL_V1) throw new Error("OBJET_QUETE_DEJA_MAX");
  stock[a] -= 1;
  stock[b] -= 1;
  const level = idleAdventureMergeLevelV47(a, b);
  stock[level] = I(stock[level]) + 1;
  for (const lv of Object.keys(stock)) if (stock[lv] <= 0) delete stock[lv];
  d.items[def.zone] = stock;
  if (level >= IDLE_QUEST_ITEM_MAX_LEVEL_V1) d.maxedItems[def.zone] = true;
  return { zone: def.zone, level, maxed: level >= IDLE_QUEST_ITEM_MAX_LEVEL_V1 };
}

function autoStartV1(state, d, now, rng) {
  if (d.quest || !idleQuestEligibleZonesV1(state).length) return false;
  startQuestV1(state, d, d.preferMajor && d.majorsBanked > 0, now, rng);
  return true;
}

/* ---------- Crochets appelés par idle-ngu-progression.js ---------- */

/*
 * Tick : Major Quests gagnées avec le temps (jusqu'au plafond de la banque), set Fad, et
 * progression d'idle. "Truly Idle Questing" (Perk 104) : "when you are in idle mode quests will be
 * handed in and new ones started automatically". CHOIX SOREAL : la quête relancée est une Major si
 * `preferMajor` est actif et qu'une Major est en banque, sinon une Minor.
 */
export function advanceIdleQuestingV1(state, seconds, env = {}, now = Date.now(), rng = Math.random) {
  if (!state?.systems?.questing?.unlocked) return;
  const d = questingDataV1(state);
  const secs = Math.max(0, N(seconds));

  if (state.adventure?.completedSets?.fad && !d.fadButtersGranted) {
    addButtersV1(state, IDLE_QUEST_FAD_SET_BUTTERS_V1);
    d.fadButtersGranted = true;
  }

  const cap = idleQuestBankCapV1(state);
  {
    /* Lu dans le jeu (BeastQuestController::Update) : le minuteur tourne toujours, même banque pleine ; à chaque intervalle on retire le seuil et on ajoute une Major (la banque est plafonnée). */
    const interval = idleQuestMajorIntervalSecondsV1(state);
    d.majorProgressSeconds += secs;
    const gained = Math.floor(d.majorProgressSeconds / interval);
    if (gained > 0) {
      d.majorsBanked = Math.min(cap, d.majorsBanked + gained);
      d.majorProgressSeconds -= gained * interval;
    }
  }

  if (!d.idle) return;
  const bonus = idleQuestBonusTotalsV1(state);
  const perItem = idleQuestIdleSecondsPerItemV1(idleQuestIdleDividerV1(bonus), env, idleQuestDropMultiplierV1(bonus, env));
  let remaining = secs;
  for (let guard = 0; guard < 2000; guard++) {
    if (!d.quest) {
      if (!bonus.trulyIdle || !autoStartV1(state, d, now, rng)) break;
    }
    const q = d.quest;
    if (q.progress >= q.required) {
      if (!bonus.trulyIdle) break;
      completeQuestV1(state, d, env, true);
      continue;
    }
    if (!(remaining > 0)) break;
    const toFinish = (q.required - q.progress - q.idleBar) * perItem;
    if (remaining >= toFinish) {
      q.progress = q.required;
      q.idleBar = 0;
      q.usedIdle = true;
      remaining -= toFinish;
    } else {
      const units = q.idleBar + remaining / perItem;
      const whole = Math.floor(units);
      if (whole > 0) {
        q.progress = Math.min(q.required, q.progress + whole);
        q.usedIdle = true;
      }
      q.idleBar = Math.min(0.999999999999, units - whole);
      remaining = 0;
    }
  }
}

/*
 * Kill de zone (zoneKill / resolveZoneFight) : "Quest items only drop when you are on a quest and
 * are adventuring in the zone where your current quest item is found" ; l'idle "will also disable
 * non idle quest item drops while idle mode is active". Les objets restent dans le stock de quête
 * (pas dans le sac d'Aventure), niveau 0.
 */
export function idleQuestingOnZoneKillV1(state, zoneId, env = {}, rng = Math.random) {
  if (!state?.systems?.questing?.unlocked) return null;
  const d = questingDataV1(state);
  if (!d.quest || d.idle || d.quest.zone !== String(zoneId || "")) return null;
  const chance = Math.min(1, IDLE_QUEST_BASE_DROP_CHANCE_V1 * idleQuestDropMultiplierV1(idleQuestBonusTotalsV1(state), env));
  if (!(rng() < chance)) return null;
  const stock = d.items[d.quest.zone] || {};
  stock["0"] = I(stock["0"]) + 1;
  d.items[d.quest.zone] = stock;
  const def = idleQuestItemByZoneV1(d.quest.zone);
  return { zone: def.zone, name: def.name, level: 0 };
}

export function applyIdleQuestingActionV1(state, action, payload = {}, env = {}, now = Date.now(), rng = Math.random) {
  if (!state?.systems?.questing?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const d = questingDataV1(state);
  switch (action) {
    case "questStart":
      return startQuestV1(state, d, Boolean(payload.major), now, rng);
    case "questSkip": {
      /* "There is no penalty for skipping a minor quest aside from losing any handin progress" ; une Major passée est perdue. */
      if (!d.quest) throw new Error("AUCUNE_QUETE_ACTIVE");
      const skipped = { major: d.quest.major, zone: d.quest.zone };
      d.quest = null;
      return { skipped };
    }
    case "questHandIn":
      return handInV1(state, d);
    case "questComplete":
      return completeQuestV1(state, d, env, false);
    case "questIdle":
      d.idle = payload.active === undefined ? !d.idle : Boolean(payload.active);
      return { idle: d.idle };
    case "questMerge":
      return mergeItemsV1(d, payload.zone, payload.levelA, payload.levelB);
    case "questPrefs":
      if (payload.preferMajor !== undefined) d.preferMajor = Boolean(payload.preferMajor);
      if (payload.useButter !== undefined) d.useButter = Boolean(payload.useButter);
      return { preferMajor: d.preferMajor, useButter: d.useButter };
    default:
      throw new Error("ACTION_QUETE_INCONNUE");
  }
}

export function idleQuestingSnapshotV1(state, env = {}) {
  const sys = state?.systems?.questing;
  if (!sys?.unlocked) return { unlocked: false };
  const d = normalizeIdleQuestingDataV1(sys.data);
  const bonus = idleQuestBonusTotalsV1(state);
  const divider = idleQuestIdleDividerV1(bonus);
  const dropMultiplier = idleQuestDropMultiplierV1(bonus, env);
  const perItem = idleQuestIdleSecondsPerItemV1(divider, env, dropMultiplier);
  const cap = idleQuestBankCapV1(state);
  const interval = idleQuestMajorIntervalSecondsV1(state);
  const preview = (major) => ({
    active: idleQuestRewardV1(state, env, { major, usedIdle: false, butter: false }),
    idle: idleQuestRewardV1(state, env, { major, usedIdle: true, butter: false })
  });
  const q = d.quest;
  const questDef = q ? idleQuestItemByZoneV1(q.zone) : null;
  return {
    unlocked: true,
    idle: d.idle,
    preferMajor: d.preferMajor,
    useButter: d.useButter,
    butters: buttersV1(state),
    majorsBanked: d.majorsBanked,
    bankCap: cap,
    majorIntervalSeconds: interval,
    secondsToNextMajor: d.majorsBanked >= cap ? null : Math.max(0, interval - d.majorProgressSeconds),
    quest: q ? {
      ...q,
      itemName: questDef.name,
      zoneName: zoneNameV1(q.zone),
      readyToComplete: q.progress >= q.required,
      idleEtaSeconds: Math.max(0, (q.required - q.progress - q.idleBar) * perItem)
    } : null,
    eligibleZones: idleQuestEligibleZonesV1(state).map(zone => ({ zone, zoneName: zoneNameV1(zone), itemName: idleQuestItemByZoneV1(zone).name })),
    items: IDLE_QUEST_ITEMS_V1.filter(def => d.items[def.zone] || d.maxedItems[def.zone]).map(def => ({
      zone: def.zone,
      zoneName: zoneNameV1(def.zone),
      itemName: def.name,
      maxed: Boolean(d.maxedItems[def.zone]),
      levels: Object.entries(d.items[def.zone] || {})
        .map(([lv, count]) => ({ level: I(lv), count, handInValue: idleQuestHandInValueV1(I(lv), bonus.handInBonusLevel) }))
        .sort((a, b) => a.level - b.level)
    })),
    dropChance: Math.min(1, IDLE_QUEST_BASE_DROP_CHANCE_V1 * dropMultiplier),
    dropMultiplier,
    idleDivider: divider,
    idleSecondsPerItem: perItem,
    handInBonusLevel: bonus.handInBonusLevel,
    handInDivider: bonus.handInBonusLevel > 0 ? IDLE_QUEST_HANDIN_DIVIDER_BASE_V1 - Math.min(9, bonus.handInBonusLevel) : null,
    trulyIdle: bonus.trulyIdle,
    fixedItems: bonus.fixedItems,
    rewardPreview: { major: preview(true), minor: preview(false) },
    goToQuestZone: I(state?.selloutShop?.purchases?.goToQuestZoneButton) > 0,
    stats: { ...d.stats },
    lastReward: d.lastReward
  };
}
