import assert from "node:assert/strict";
import {
  IDLE_QUEST_MAJOR_INTERVAL_SECONDS_V1,
  IDLE_QUEST_BANK_CAP_V1,
  IDLE_QUEST_BANK_CAP_EXTENDED_V1,
  IDLE_QUEST_FASTER_QUESTING_PCT_V1,
  IDLE_QUEST_FAD_SET_FASTER_PCT_V1,
  IDLE_QUEST_FAD_SET_BUTTERS_V1,
  IDLE_QUEST_BASE_REWARD_MAJOR_V1,
  IDLE_QUEST_BASE_REWARD_MINOR_V1,
  IDLE_QUEST_ACTIVE_REWARD_FACTOR_V1,
  IDLE_QUEST_ITEMS_MIN_V1,
  IDLE_QUEST_ITEMS_SPREAD_V1,
  IDLE_QUEST_BASE_DROP_CHANCE_V1,
  IDLE_QUEST_IDLE_DIVIDER_BASE_V1,
  IDLE_QUEST_IDLE_DIVIDER_MIN_V1,
  IDLE_QUEST_HANDIN_DIVIDER_BASE_V1,
  IDLE_QUEST_ITEM_MAX_LEVEL_V1,
  IDLE_QUEST_ITEM_COMPLETION_QP_PCT_V1,
  IDLE_QUEST_MOBSTER_SET_QP_PCT_V1,
  IDLE_QUEST_BUTTER_FACTOR_V1,
  IDLE_QUEST_FIBONACCI_FIXED_LEVEL_V1,
  IDLE_QUEST_ITEMS_V1,
  idleQuestBonusTotalsV1,
  idleQuestIdleDividerV1,
  idleQuestHandInValueV1,
  idleQuestIdleSecondsPerItemV1,
  idleQuestDropMultiplierV1,
  idleQuestMajorIntervalSecondsV1,
  idleQuestBankCapV1,
  idleQuestRewardV1
} from "../src/idle-questing-v1.js";
import { idlePerkByIdV1, perkBonusesV1 } from "../src/idle-perks-v1.js";
import { idleQuirkByIdV1 } from "../src/idle-quirks-v1.js";
import { idleWishByIdV1 } from "../src/idle-wishes-v1.js";
import { IDLE_SELLOUT_EFFECTS_V1 } from "../src/idle-sellout-shop-v1.js";

/*
 * Questing (2026-09-23) : valeurs verrouillées contre le miroir local du wiki NGU
 * (pages Questing, Perk Points, Quirk Points, Wishes, 4G's Sellout Shop, Arbitrary Points,
 * Fibonacci Perk, Mobster (set), Fad (set), pages de zone).
 */

// --- Constantes de la page Questing / Sellout / sets ---
assert.equal(IDLE_QUEST_MAJOR_INTERVAL_SECONDS_V1, 7 * 3600 + 50 * 60, "Every 7 hours and 50 minutes");
assert.equal(IDLE_QUEST_BANK_CAP_V1, 10, "up to a maximum of 10");
assert.equal(IDLE_QUEST_BANK_CAP_EXTENDED_V1, 50, "Extended Quest Bank : from 10 to 50");
assert.equal(IDLE_QUEST_FASTER_QUESTING_PCT_V1, 0.20, "Faster Questing! : 20% faster");
assert.equal(IDLE_QUEST_FAD_SET_FASTER_PCT_V1, 0.10, "Fad (set) : 10% Faster Major Quests");
assert.equal(IDLE_QUEST_FAD_SET_BUTTERS_V1, 3, "Fad (set) : 3 Beast Butters");
assert.equal(IDLE_QUEST_BASE_REWARD_MAJOR_V1, 50, "base reward 50 QP / 50 AP");
assert.equal(IDLE_QUEST_BASE_REWARD_MINOR_V1, 10, "Minor : Normally this value is 10 (20 %)");
assert.equal(IDLE_QUEST_ACTIVE_REWARD_FACTOR_V1, 2, "without filling the idle mode bar doubles the reward");
assert.equal(IDLE_QUEST_ITEMS_MIN_V1, 50);
assert.equal(IDLE_QUEST_ITEMS_SPREAD_V1, 10, "between 50-59");
assert.equal(IDLE_QUEST_BASE_DROP_CHANCE_V1, 0.05, "5% from all enemies");
assert.equal(IDLE_QUEST_IDLE_DIVIDER_BASE_V1, 8);
assert.equal(IDLE_QUEST_IDLE_DIVIDER_MIN_V1, 3, "can be reduced to 3 by upgrades");
assert.equal(IDLE_QUEST_HANDIN_DIVIDER_BASE_V1, 11, "Quest Item Level / (11 - Bonus Hand In Level)");
assert.equal(IDLE_QUEST_ITEM_MAX_LEVEL_V1, 100);
assert.equal(IDLE_QUEST_ITEM_COMPLETION_QP_PCT_V1, 0.02, "+2% QP par type d'objet niveau 100");
assert.equal(IDLE_QUEST_MOBSTER_SET_QP_PCT_V1, 0.15, "Mobster (set) : +15% QP Gain");
assert.equal(IDLE_QUEST_BUTTER_FACTOR_V1, 2, "Beast Butter : doubles your QP reward");
assert.equal(IDLE_QUEST_FIBONACCI_FIXED_LEVEL_V1, 610);

// --- Liste des objets de quête (Questing, List of Quest Items) ---
assert.deepEqual(
  IDLE_QUEST_ITEMS_V1.map(x => [x.zone, x.set, x.wikiId, x.name]),
  [
    ["sewers", "sewers", 278, "Bits of String"],
    ["forest", "forest", 281, "A Dreamcatcher"],
    ["hsb", "hsb", 283, "A Missing Puzzle Piece"],
    ["2d", "2d", 279, "The Entire State of North Dakota"],
    ["avsp", "gaudy", 282, "Random Canadian Coins"],
    ["mega", "mega", 287, "A Useless College Diploma"],
    ["beardverse", "beardverse", 285, "A Spittoon"],
    ["chocolate", "choco", 280, "A Toothbrush"],
    ["evilverse", "edgy", 284, "A Severed Human Thumb"],
    ["pinkprincess", "pinkprincess", 286, "A Smaller Caterpillar"]
  ]
);

// --- Catalogues : coût / plafond / clé (page Perk Points) ---
const perks = {
  87: [30000, 1, { questMinorBaseQp: 2 }],
  89: [400, 50, { qpEarningsPct: 0.002 }],
  90: [200, 30, { questDropsPct: 0.5 }],
  91: [25000, 1, { questIdleDividerReduction: 1 }],
  92: [250000, 1, { questIdleDividerReduction: 1 }],
  104: [200, 1, { questTrulyIdle: 1 }],
  105: [100, 1, { questIdleDividerReduction: 2 }],
  106: [5000, 1, { questIdleDividerReduction: 1 }],
  145: [1500, 1, { questHandinReduction: 1 }],
  146: [50000, 2, { questHandinReduction: 1 }],
  147: [1000000, 10, { questMajorBaseQp: 1 }],
  148: [5000000, 2, { questMinorBaseQp: 1 }]
};
for (const [id, [cost, cap, bonus]] of Object.entries(perks)) {
  const p = idlePerkByIdV1(Number(id));
  assert.ok(p, "perk " + id + " présente");
  assert.equal(p.cost, cost, "coût perk " + id);
  assert.equal(p.cap, cap, "plafond perk " + id);
  assert.deepEqual(p.bonus, bonus, "effet perk " + id);
}
assert.ok(idlePerkByIdV1(94).fibonacciMilestones.some(m => m.level === 610 && m.questFixedItems === 1), "Fibonacci 610 : quêtes fixées à 50 objets");
assert.ok(Math.abs(perkBonusesV1({ 94: 233 }).qpEarningsMultiplier - 1.10) < 1e-12, "Fibonacci 233 : +10% QP");
assert.ok(Math.abs(perkBonusesV1({ 89: 50 }).qpEarningsMultiplier - 1.10) < 1e-12, "Better QP Rewards! : 50 x 0,2 %");
assert.deepEqual(
  { cost: idleQuirkByIdV1(71).cost, cap: idleQuirkByIdV1(71).cap, bonus: idleQuirkByIdV1(71).bonus },
  { cost: 4000, cap: 2, bonus: { questHandinReduction: 1 } },
  "Quirk 71 : 4 000 QP, 2 niveaux"
);
const wishes = {
  19: [10, { questActiveRewardPct: 0.02 }],
  47: [10, { questQpPct: 0.02 }],
  62: [10, { questActiveRewardPct: 0.01 }],
  80: [2, { questHandinReduction: 1 }],
  81: [2, { questHandinReduction: 1 }],
  101: [10, { questMajorBaseQp: 1 }],
  102: [2, { questMinorBaseQp: 1 }]
};
for (const [id, [levels, bonus]] of Object.entries(wishes)) {
  const w = idleWishByIdV1(Number(id));
  assert.equal(w.levels, levels, "niveaux souhait " + id);
  assert.deepEqual(w.bonus, bonus, "effet souhait " + id);
}
for (const id of ["beastButter1", "beastButter10", "beastButter100", "beastButter"]) assert.ok(IDLE_SELLOUT_EFFECTS_V1[id]?.butters > 0, id);
assert.equal(IDLE_SELLOUT_EFFECTS_V1.beastButter10.butters, 10);
assert.equal(IDLE_SELLOUT_EFFECTS_V1.beastButter100.butters, 100);
for (const id of ["fasterQuesting", "extendedQuestBank", "goToQuestZoneButton"]) assert.ok(IDLE_SELLOUT_EFFECTS_V1[id]?.passive, id);
assert.equal(IDLE_SELLOUT_EFFECTS_V1.questReminder, undefined, "Quest Reminder reste non achetable (voyant de menu non construit)");

// --- Formules ---
const etat = (perkLevels = {}, quirkLevels = {}, wishLevels = {}, extra = {}) => ({
  systems: {
    perks: { data: { levels: perkLevels } },
    quirks: { data: { levels: quirkLevels } },
    wishes: { data: { tracks: Object.fromEntries(Object.entries(wishLevels).map(([k, v]) => [k, { level: v }])) } },
    questing: { data: extra.questing || {} }
  },
  adventure: { completedSets: extra.sets || {} },
  selloutShop: { purchases: extra.purchases || {} }
});

assert.equal(idleQuestIdleDividerV1(idleQuestBonusTotalsV1(etat())), 8);
assert.equal(idleQuestIdleDividerV1(idleQuestBonusTotalsV1(etat({ 105: 1 }))), 6, "Gooder Idle Questing : -2");
assert.equal(idleQuestIdleDividerV1(idleQuestBonusTotalsV1(etat({ 91: 1, 92: 1, 105: 1, 106: 1 }))), 3, "toutes les perks : 3");

assert.equal(idleQuestHandInValueV1(100, 0), 1, "sans achat : 1 par objet quel que soit le niveau");
assert.equal(idleQuestHandInValueV1(100, 1), 11, "Perk 145 : 1 + (100/10)");
assert.equal(idleQuestHandInValueV1(9, 1), 1, "arrondi inférieur");
assert.equal(idleQuestHandInValueV1(10, 1), 2);
assert.equal(idleQuestHandInValueV1(100, 9), 51, "9 niveaux : diviseur 2 -> un objet 100 complète une quête de 50");
assert.equal(idleQuestBonusTotalsV1(etat({ 145: 1, 146: 2 }, { 71: 2 }, { 80: 2, 81: 2 })).handInBonusLevel, 9);

const env = { respawnSeconds: 4, idleAttackSeconds: 1 };
assert.equal(idleQuestIdleSecondsPerItemV1(8, env, 1), 800, "8 x (4 + 1) / (3 x 1) minutes = 800 s par objet");
assert.equal(idleQuestIdleSecondsPerItemV1(1, env, 1), 100, "quête active : 20 x (respawn + speed) / drop secondes");
assert.equal(idleQuestIdleSecondsPerItemV1(3, { respawnSeconds: 2, idleAttackSeconds: 0.8 }, 2), 3 * 2.8 * 20 / 2);
assert.equal(idleQuestDropMultiplierV1(idleQuestBonusTotalsV1(etat({ 90: 30 })), { gearQuestDropsPct: 10 }), 1.25, "10 % d'équipement + 30 x 0,5 %");

assert.equal(idleQuestMajorIntervalSecondsV1(etat()), 28200);
assert.ok(Math.abs(idleQuestMajorIntervalSecondsV1(etat({}, {}, {}, { purchases: { fasterQuesting: 1 } })) - 28200 / 1.2) < 1e-9);
assert.ok(Math.abs(idleQuestMajorIntervalSecondsV1(etat({}, {}, {}, { purchases: { fasterQuesting: 1 }, sets: { fad: true } })) - 28200 / 1.32) < 1e-9);
assert.equal(idleQuestBankCapV1(etat()), 10);
assert.equal(idleQuestBankCapV1(etat({}, {}, {}, { purchases: { extendedQuestBank: 1 } })), 50);

// Récompenses (page Questing + page Arbitrary Points)
const r = (s, o, e = {}) => idleQuestRewardV1(s, e, o);
assert.deepEqual([r(etat(), { major: true }).qp, r(etat(), { major: true }).ap], [100, 100], "Major active : 50 x 2");
assert.deepEqual([r(etat(), { major: true, usedIdle: true }).qp, r(etat(), { major: true, usedIdle: true }).ap], [50, 50]);
assert.deepEqual([r(etat(), { major: false }).qp, r(etat(), { major: false, usedIdle: true }).qp], [20, 10], "Minor : 20 % de la Major");
assert.equal(r(etat({ 87: 1 }), { major: false, usedIdle: true }).ap, 12, "Arbitrary Points : 12 avec Not So Minor Anymore");
assert.equal(r(etat({}, {}, { 101: 10 }), { major: true }).ap, 120, "Arbitrary Points : 120 (active major with wish bonus)");
assert.equal(r(etat({}, {}, { 19: 10, 62: 10 }), { major: true }).qp, 130, "souhaits 19/62 : +30 % sur la récompense active");
assert.equal(r(etat({}, {}, { 19: 10, 62: 10 }), { major: true, usedIdle: true }).qp, 50, "sans effet en idle");
assert.equal(r(etat({}, {}, { 47: 10 }), { major: true, usedIdle: true }).qp, 60, "souhait 47 : +2 %/niveau");
assert.equal(r(etat({}, {}, {}, { sets: { mobster: true } }), { major: true, usedIdle: true }).qp, 57, "Mobster : +15 %");
assert.equal(r(etat({}, {}, {}, { questing: { maxedItems: { sewers: true, forest: true } } }), { major: true, usedIdle: true }).qp, 52, "2 objets niveau 100 : +4 %");
assert.equal(r(etat(), { major: true, usedIdle: true, butter: true }).qp, 100, "Beast Butter : QP x2");
assert.equal(r(etat(), { major: true, usedIdle: true, butter: true }).ap, 50, "Beast Butter ne double pas l'AP");
assert.equal(r(etat(), { major: true, usedIdle: true }, { qpEarningsMultiplier: 1.1, qpHackMultiplier: 2 }).qp, 110);

console.log("idle-questing-values: OK");
