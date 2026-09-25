import assert from "node:assert/strict";
import {
  IDLE_MACGUFFIN_TYPES_V1,
  IDLE_MACGUFFIN_RANDOM_BASE_POOL_V1,
  IDLE_MACGUFFIN_MAX_SLOTS_V1,
  macguffinTimeRatioV1,
  macguffinRebirthGainPctV1,
  macguffinKillsRequiredV1,
  macguffinBloodSpellLevelsV1,
  macguffinFruitLevelsV1,
  macguffinMergeLevelV1
} from "../src/idle-macguffins-v1.js";

/*
 * Valeurs verrouillées sur le miroir local du wiki NGU (page "MacGuffin
 * Fragments", sauf mention) -- jamais recalculées "à la main" ailleurs.
 */
const proche = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg} (obtenu ${a}, attendu ${b})`);

/* --- Catalogue : 22 fragments, numéros d'objet du wiki --- */
assert.equal(IDLE_MACGUFFIN_TYPES_V1.length, 22, "22 different kinds of fragments");
assert.equal(new Set(IDLE_MACGUFFIN_TYPES_V1.map(t => t.id)).size, 22);
assert.deepEqual(
  IDLE_MACGUFFIN_TYPES_V1.map(t => t.item),
  [198, 200, 199, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 228, 211, 250, 291, 289, 290, 298, 299, 300],
  "Numéros d'objet dans l'ordre # 1-22 de la table The Fragments & Drop Locations."
);
const zones = Object.fromEntries(IDLE_MACGUFFIN_TYPES_V1.filter(t => t.zone).map(t => [t.id, t.zone]));
assert.deepEqual(zones, {
  energyPower: "sewers", magicPower: "forest", energyCap: "cave", magicCap: "sky", energyNgu: "hsb",
  magicNgu: "clock", energyBar: "2d", magicBar: "ancient", sexy: "avsp", smart: "mega",
  dropChance: "beardverse", golden: "badly", augment: "boring", stat: "chocolate",
  energyWandoos: "evilverse", magicWandoos: "pinkprincess", number: "metaland", blood: "interdimensional"
});
assert.equal(IDLE_MACGUFFIN_TYPES_V1.find(t => t.id === "stat").requiresSet, "choco", "Stat : Choco set complété requis.");
assert.equal(IDLE_MACGUFFIN_TYPES_V1.find(t => t.id === "adventure").titan, "nerd");
assert.deepEqual(IDLE_MACGUFFIN_RANDOM_BASE_POOL_V1.slice().sort(),
  ["dropChance", "energyBar", "energyCap", "energyNgu", "energyPower", "magicBar", "magicCap", "magicNgu", "magicPower", "sexy", "smart"],
  "Tirage aléatoire : Energy/Magic Cap/Pow/Bars/NGU/SEXY/SMART + Drop.");
assert.equal(IDLE_MACGUFFIN_MAX_SLOTS_V1, 22);
for (const id of ["sexy", "smart"]) {
  assert.equal(IDLE_MACGUFFIN_TYPES_V1.find(t => t.id === id).effect, null, `${id} : aucun effet branché.`);
}

assert.equal(IDLE_MACGUFFIN_TYPES_V1.find(t => t.id === "golden").effect, "goldDrops", "Golden : Gold Drops (source tierce, 2026-09-25).");

/* --- Ratio de temps T : tableau "Time / Bonus" (arrondi à 2 décimales du wiki) --- */
const h = 3600;
const tableNormale = [[300, 0.03], [900, 0.25], [1800, 1], [2100, 1.08], [h, 1.41], [2 * h, 2], [4 * h, 2.83], [8 * h, 4], [12 * h, 4.9], [24 * h, 6.93], [200 * h, 20]];
for (const [s, bonus] of tableNormale) proche(macguffinTimeRatioV1(s), bonus, 0.005, `T normal à ${s} s`);
assert.equal(macguffinTimeRatioV1(300 * h), 20, "Plafond 20 (200 h).");
assert.equal(macguffinTimeRatioV1(0), 0);
/* 2e Troll Challenge Sadistic : second tableau. */
const tableTroll = [[300, 0.03], [900, 0.25], [1800, 1], [h, 2], [24 * h, 48], [48 * h, 63.34], [72 * h, 74.49], [170 * h, 104.86]];
for (const [s, bonus] of tableTroll) proche(macguffinTimeRatioV1(s, true), bonus, 0.01, `T troll à ${s} s`);
assert.equal(macguffinTimeRatioV1(1000 * h, true), 104.86, "Plafond 104.86.");

/* --- Gains par Rebirth (points de %) --- */
proche(macguffinRebirthGainPctV1("energyPower", 0, 1), 0.001, 1e-12, "Power L=0");
proche(macguffinRebirthGainPctV1("magicPower", 100, 1), 0.101, 1e-12, "Power L=100");
proche(macguffinRebirthGainPctV1("energyPower", 101, 1), Math.pow(102, 0.3) * 0.02512, 1e-12, "Power L>100");
proche(macguffinRebirthGainPctV1("energyCap", 100, 2), 0.202, 1e-12, "Cap L=100, T=2");
proche(macguffinRebirthGainPctV1("dropChance", 500, 1), Math.pow(501, 0.2) * 0.03981, 1e-12, "Drop L>100");
proche(macguffinRebirthGainPctV1("adventure", 1000, 1), Math.pow(1001, 0.2) * 0.03981, 1e-12, "Adventure L>100");
proche(macguffinRebirthGainPctV1("sexy", 0, 1), 0.001, 1e-12, "SEXY suit la formule standard");
proche(macguffinRebirthGainPctV1("golden", 9, 1), 0.05, 1e-12, "Golden (L+1) x 0.005 %");
proche(macguffinRebirthGainPctV1("golden", 999, 1), 5, 1e-9, "Golden linéaire au-delà de 100");
proche(macguffinRebirthGainPctV1("augment", 200, 1), 0.201, 1e-12, "Augment linéaire");
proche(macguffinRebirthGainPctV1("stat", 0, 1), 0.01, 1e-12, "Stat (L+1) x 0.01 %");
proche(macguffinRebirthGainPctV1("energyWandoos", 100, 1), 0.202, 1e-12, "Wandoos L=100");
proche(macguffinRebirthGainPctV1("magicWandoos", 200, 1), Math.pow(201, 0.25) * 0.06325, 1e-12, "Wandoos L>100");
proche(macguffinRebirthGainPctV1("number", 100, 1), 0.505, 1e-12, "Number L=100");
proche(macguffinRebirthGainPctV1("number", 300, 1), Math.pow(301, 0.25) * 0.1581, 1e-12, "Number L>100");
proche(macguffinRebirthGainPctV1("blood", 0, 1), 0.003, 1e-12, "Blood L=0");
proche(macguffinRebirthGainPctV1("blood", 150, 1), Math.pow(151, 0.2) * 0.1194, 1e-12, "Blood L>100");
proche(macguffinRebirthGainPctV1("r3Power", 0, 1), 0.0005, 1e-12, "R3 Power L=0");
proche(macguffinRebirthGainPctV1("r3Power", 200, 1), Math.pow(201, 0.3) * 0.01255, 1e-12, "R3 Power L>100");
proche(macguffinRebirthGainPctV1("r3Cap", 200, 1), Math.pow(201, 0.2) * 0.0199, 1e-12, "R3 Cap L>100");
proche(macguffinRebirthGainPctV1("r3Bar", 100, 1), 0.0505, 1e-12, "R3 Bar L=100");

/* --- Kills par fragment : minimums publiés 720 (zone) et 1 800 (ITOPOD) --- */
assert.equal(macguffinKillsRequiredV1({}), 1000);
assert.equal(macguffinKillsRequiredV1({ chocoSet: true }), 900);
assert.equal(macguffinKillsRequiredV1({ chocoSet: true, purpleHeart: true }), 720);
assert.equal(macguffinKillsRequiredV1({ itopod: true }), 5000);
assert.equal(macguffinKillsRequiredV1({ itopod: true, perk69: true }), 4000);
assert.equal(macguffinKillsRequiredV1({ itopod: true, perk69: true, perk70: true }), 3000);
assert.equal(macguffinKillsRequiredV1({ itopod: true, perk69: true, perk70: true, perk71: true }), 2250);
assert.equal(macguffinKillsRequiredV1({ itopod: true, perk69: true, perk70: true, perk71: true, purpleHeart: true }), 1800);

/* --- Sorts Blood MacGuffin α / β : table de la page Blood Magic --- */
const alpha = [[1e9, 1], [1e10, 2], [1e11, 3], [1e12, 4], [1e15, 7], [1e18, 10], [1e19, 11]];
for (const [blood, lv] of alpha) assert.equal(macguffinBloodSpellLevelsV1("alpha", blood), lv, `α ${blood}`);
const beta = [[1e6, 1], [2e7, 2], [4e8, 3], [8e9, 4], [1.6e11, 5], [3.2e12, 6], [6.4e13, 7], [1.28e15, 8], [2.56e16, 9], [5.12e17, 10], [1.024e19, 11]];
for (const [blood, lv] of beta) assert.equal(macguffinBloodSpellLevelsV1("beta", blood), lv, `β ${blood}`);
assert.equal(macguffinBloodSpellLevelsV1("alpha", 9.9e8), 0, "Minimum 1B.");
assert.equal(macguffinBloodSpellLevelsV1("beta", 9.9e5), 0, "Minimum 1M.");

/* --- Fruits of MacGuffin (page Yggdrasil) --- */
assert.equal(macguffinFruitLevelsV1("alpha", 1), 1);
assert.equal(macguffinFruitLevelsV1("alpha", 10), 16, "⌈⌈10^1.5⌉ x 0.5⌉ = ⌈32 x 0.5⌉");
assert.equal(macguffinFruitLevelsV1("alpha", 2), 2, "⌈3 x 0.5⌉");
/* β : "+1 levels at Tiers 5, 8, 10, 12, 14, 16, 17, 19, 21, 22, 23" */
const betaParTier = [];
for (let t = 1; t <= 24; t++) betaParTier.push(macguffinFruitLevelsV1("beta", t));
const sauts = [];
for (let t = 2; t <= 24; t++) if (betaParTier[t - 1] > betaParTier[t - 2]) sauts.push(t);
assert.deepEqual(sauts, [5, 8, 10, 12, 14, 16, 17, 19, 21, 22, 23], "Paliers publiés du Fruit of MacGuffin β.");
assert.equal(betaParTier[0], 1);
assert.equal(betaParTier[19], 9, "Tier 20 : ⌈90 x 0.1⌉ = 9 (pas 10 à cause du flottant).");

/* --- Fusion : somme des niveaux + 1, sans plafond --- */
assert.equal(macguffinMergeLevelV1(0, 0), 1);
assert.equal(macguffinMergeLevelV1(100, 100), 201, "Au-delà du plafond 100 des objets.");

console.log("idle-macguffins-formulas ok");
