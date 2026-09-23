import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_ZONES,
  IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2 as LP,
  idleAdventureSnapshotV47,
  createIdleAdventureStateV47
} from "../src/idle-adventure-v47.js";

/*
 * Audit zones 2026-09-23 : verrou d'un échantillon de valeurs de zone relues
 * dans le miroir local du wiki -- pages de zone (phrase "unlocked by beating
 * boss #N", tableau Fight, sections Loot et Enemies), page "Boss Fights"
 * (table "Boss fights that unlock things") et page "Adventure Mode".
 */
const zone = (id) => IDLE_ADVENTURE_ZONES.find((z) => z.id === id);

// 1. Déblocage : table "Boss fights that unlock things" (page Boss Fights) --
//    32/32 zones conformes. Evil = "difficile", SADISTIC = "extreme".
const UNLOCK = {
  tutorial: 4, sewers: 7, forest: 17, cave: 37, sky: 48, hsb: 58, clock: 66, "2d": 74, ancient: 82,
  avsp: 90, mega: 100, beardverse: 108, badly: 116, boring: 124, chocolate: 137,
  evilverse: [58, "difficile"], pinkprincess: [100, "difficile"], metaland: [158, "difficile"],
  interdimensional: [166, "difficile"], typozone: [174, "difficile"], fadlands: [182, "difficile"],
  jrpgville: [190, "difficile"], radlands: [200, "difficile"],
  backtoschool: [125, "extreme"], westworld: [150, "extreme"], breadverse: [208, "extreme"],
  seventies: [216, "extreme"], halloweenies: [224, "extreme"], construction: [232, "extreme"],
  duckduck: [240, "extreme"], netherregions: [248, "extreme"], aethereansea: [269, "extreme"]
};
for (const [id, v] of Object.entries(UNLOCK)) {
  const [boss, diff] = Array.isArray(v) ? v : [v, undefined];
  assert.equal(zone(id).boss, boss, `${id} : débloquée par le boss #${boss}`);
  assert.equal(zone(id).requiredDifficulty, diff, `${id} : difficulté ${diff}`);
}
assert.equal(IDLE_ADVENTURE_ZONES.length, 33, "safe + 32 zones de combat");

// 2. "Boss chance a/b" de la section Enemies de chaque page de zone -- explicite partout.
const BOSS_CHANCE = {
  tutorial: [1, 4], sewers: [1, 4], forest: [2, 9], cave: [3, 16], sky: [1, 5], hsb: [1, 5],
  clock: [2, 9], "2d": [1, 4], ancient: [1, 4], avsp: [1, 4], mega: [1, 5], beardverse: [1, 4],
  badly: [1, 4], boring: [2, 9], chocolate: [3, 13], evilverse: [2, 9], pinkprincess: [1, 4],
  metaland: [1, 4], interdimensional: [1, 4], typozone: [1, 4], fadlands: [1, 4], jrpgville: [1, 4],
  radlands: [1, 5], backtoschool: [1, 4], westworld: [1, 4], breadverse: [1, 4], seventies: [1, 4],
  halloweenies: [1, 4], construction: [1, 4], duckduck: [1, 4], netherregions: [1, 4], aethereansea: [4, 21]
};
for (const [id, [a, b]] of Object.entries(BOSS_CHANCE)) {
  assert.equal(zone(id).bossChance, a / b, `${id} : Boss chance ${a}/${b}`);
}

// 3. One Hit P publié uniquement par la page de zone (tableau Fight, ligne "One Hit").
assert.equal(zone("typozone").oneHitP, 6.915e21);                 // {{BigNum|6.915e+21}}
assert.equal(zone("fadlands").oneHitP, 3.562e22);                 // {{BigNum|3.562e+22}} (live)
assert.equal(zone("radlands").oneHitP, 1.88575e26);               // {{BigNum|1.88575e+26}}
assert.equal(zone("backtoschool").oneHitP, 5.23908333333333e28);  // {{BigNum|5.23908333333333e28}} (live)
assert.equal(zone("westworld").oneHitP, 2.22158333333333e29);     // {{BigNum|2.22158333333333e29}}
assert.equal(zone("seventies").oneHitP, 1.36e31);                 // "13.6 No (1.36E+31)"
assert.equal(zone("halloweenies").oneHitP, 4.2e31);               // "42.0 Non (4.2E+31)"
assert.equal(zone("construction").oneHitP, undefined, "Construction Zone : \"1.42 Dec (1.42E+32)\" incohérent d'un facteur 10 -- omis");
assert.equal(zone("breadverse").oneHitP, undefined, "The Breadverse : One Hit \"-\"");
assert.equal(zone("duckduck").oneHitP, undefined, "DUCK DUCK ZONE : One Hit \"?\"");
assert.equal(zone("netherregions").oneHitP, undefined, "The Nether Regions : One Hit \"?\"");
assert.equal(zone("aethereansea").oneHitP, 5.75e35);              // "575 Dc (5.75E+35)"

// 4. Manual P/T -- tableau agrégé "Adventure Mode" (source retenue).
assert.deepEqual([zone("netherregions").p, zone("netherregions").t], [3.15e32, 8.42e31]); // (3.15E32 / 8.42E31)
assert.deepEqual([zone("aethereansea").p, zone("aethereansea").t], [1.72e34, 6.1e33]);    // (1.72E34 / 6.1E33)
assert.deepEqual([zone("westworld").p, zone("westworld").t], [2.65e27, 8.3e26]);          // (2.65E27 / 8.3E26)

// 5. Loot des deux dernières zones (section Loot de leur page).
{
  // The Nether Regions -- "Boost 10000 (0.0000016% base chance, up to 17% max)" x2,
  // "Dutch (set) - 0.0000006% base chance, up to 5% max", boss 0.0000018%/15%,
  // "Ascended x6 Pendant lvl 8 (0.000006%, up to 12%)", "GALACTIC HERALD LOOTY lvl 8 (0.0000024%, up to 12%)".
  const n = LP.netherregions;
  assert.deepEqual(n.normal.boosts, [{ strength: 10000, chance: 1.6e-8, cap: 0.17 }, { strength: 10000, chance: 1.6e-8, cap: 0.17 }]);
  assert.deepEqual(n.normal.equipment, [{ chance: 6e-9, cap: 0.05, set: "dutch", level: 1 }]);
  assert.deepEqual(n.boss.equipment, [{ chance: 1.8e-8, cap: 0.15, set: "dutch", level: 1 }]);
  assert.deepEqual(n.boss.specials, [
    { id: "ascendedX6Pendant", chance: 6e-8, cap: 0.12, level: 8 },
    { id: "galacticHeraldLooty", chance: 2.4e-8, cap: 0.12, level: 8 }
  ]);
  // The Aethereal Sea -- "Boost 10000 (0.000001% base chance, up to 17% max)" x2,
  // "Pirate (set) - (0.0000004%, up to 5%)" / boss "(0.0000012%, up to 15%)" ;
  // Ascended x6 Pendant / GALACTIC HERALD LOOTY "chance ?" -> jamais tirés.
  const a = LP.aethereansea;
  assert.deepEqual(a.normal.boosts, [{ strength: 10000, chance: 1e-8, cap: 0.17 }, { strength: 10000, chance: 1e-8, cap: 0.17 }]);
  assert.deepEqual(a.normal.equipment, [{ chance: 4e-9, cap: 0.05, set: "pirate", level: 1 }]);
  assert.deepEqual(a.boss.equipment, [{ chance: 1.2e-8, cap: 0.15, set: "pirate", level: 1 }]);
  assert.equal(a.boss.specials, undefined, "taux \"chance ?\" non publiés -- aucun tirage inventé");
}

// 6. Le snapshot expose bien ces champs aux clients.
{
  const snap = idleAdventureSnapshotV47(createIdleAdventureStateV47(), 0);
  const ww = snap.zones.find((z) => z.id === "westworld");
  assert.equal(ww.bossChance, 0.25);
  assert.equal(ww.oneHitP, 2.22158333333333e29);
}

console.log("idle-zones-audit-zones: OK");
