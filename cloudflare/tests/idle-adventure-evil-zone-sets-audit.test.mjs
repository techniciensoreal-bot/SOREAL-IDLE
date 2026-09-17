import assert from "node:assert/strict";
import { idleAdventureItemAtLevelV47, IDLE_ADVENTURE_SETS } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-18) : "il faut tout faire" (équipement des 17 zones
 * Evil/Sadistic). Audit des 8 sets des zones Evil (wiki NGU en direct,
 * ngu-idle.fandom.com -- le mirroir local n'a pas les templates Item_data
 * qui résolvent les stats, même méthode que les 16 sets déjà audités le
 * 2026-09-15/16) :
 * - https://ngu-idle.fandom.com/wiki/Edgy_(set) + Edgy_Boots_(set) + BOTH_Edgy_Boots
 * - https://ngu-idle.fandom.com/wiki/Pretty_Pink_Princess_(set)
 * - https://ngu-idle.fandom.com/wiki/Meta_(set)
 * - https://ngu-idle.fandom.com/wiki/Party_(set)
 * - https://ngu-idle.fandom.com/wiki/Typo_(set)
 * - https://ngu-idle.fandom.com/wiki/Fad_(set)
 * - https://ngu-idle.fandom.com/wiki/JRPG_(set)
 * - https://ngu-idle.fandom.com/wiki/Rad_(set)
 * "Stats Max" niveau 100, même convention que le reste du fichier (item()
 * divise par 2 puis applique q=1+niveau/100).
 */

function statsAt100(definitionId) {
  const o = idleAdventureItemAtLevelV47(definitionId, 100, "preview");
  return { power: o.power, toughness: o.toughness };
}
function sumSet(ids) {
  return ids.reduce((acc, id) => {
    const s = statsAt100(id);
    return { power: acc.power + s.power, toughness: acc.toughness + s.toughness };
  }, { power: 0, toughness: 0 });
}

// --- Edgy Set (Evilverse) ---
assert.deepEqual(statsAt100("edgy:weapon"), { power: 11200000, toughness: 600000 });
assert.deepEqual(statsAt100("edgy:head"), { power: 80000, toughness: 1004000 });
assert.deepEqual(statsAt100("edgy:chest"), { power: 60000, toughness: 1080000 });
assert.deepEqual(statsAt100("edgy:legs"), { power: 60000, toughness: 1110000 });
assert.deepEqual(statsAt100("edgy:boots"), { power: 120000, toughness: 1080000 });
assert.deepEqual(statsAt100("edgy:amulet"), { power: 300000, toughness: 300000 });
assert.deepEqual(sumSet(["edgy:weapon", "edgy:head", "edgy:chest", "edgy:legs", "edgy:boots", "edgy:amulet"]), { power: 11820000, toughness: 5174000 });

// --- Pretty Pink Princess Set ---
assert.deepEqual(statsAt100("pinkprincess:weapon"), { power: 15200000, toughness: 880000 });
assert.deepEqual(statsAt100("pinkprincess:head"), { power: 120000, toughness: 1484000 });
assert.deepEqual(statsAt100("pinkprincess:chest"), { power: 120000, toughness: 1480000 });
assert.deepEqual(statsAt100("pinkprincess:legs"), { power: 100000, toughness: 1510000 });
assert.deepEqual(statsAt100("pinkprincess:boots"), { power: 60000, toughness: 1460000 });
assert.deepEqual(statsAt100("pinkprincess:amulet"), { power: 800000, toughness: 800000 });
assert.deepEqual(sumSet(["pinkprincess:weapon", "pinkprincess:head", "pinkprincess:chest", "pinkprincess:legs", "pinkprincess:boots", "pinkprincess:amulet"]), { power: 16400000, toughness: 7614000 });
assert.equal(IDLE_ADVENTURE_SETS.pinkprincess.reward.itopodPpPct, .10, "Wiki : \"Gain 10% more PP\".");

// --- Meta Set ---
assert.deepEqual(statsAt100("meta:weapon"), { power: 50000000, toughness: 2400000 });
assert.deepEqual(statsAt100("meta:head"), { power: 300000, toughness: 4400000 });
assert.deepEqual(statsAt100("meta:chest"), { power: 300000, toughness: 4400000 });
assert.deepEqual(statsAt100("meta:legs"), { power: 300000, toughness: 4400000 });
assert.deepEqual(statsAt100("meta:boots"), { power: 300000, toughness: 4400000 });
assert.deepEqual(statsAt100("meta:charmInfinity"), { power: 1777776, toughness: 1777776 });
assert.deepEqual(statsAt100("meta:charm69"), { power: 1393938, toughness: 1393938 });
assert.deepEqual(sumSet(["meta:weapon", "meta:head", "meta:chest", "meta:legs", "meta:boots", "meta:charmInfinity", "meta:charm69"]), { power: 54371714, toughness: 23171714 });

// --- Party Set ---
assert.deepEqual(statsAt100("party:weapon"), { power: 100000000, toughness: 4000000 });
assert.deepEqual(statsAt100("party:head"), { power: 500000, toughness: 9000000 });
assert.deepEqual(statsAt100("party:chest"), { power: 500000, toughness: 9000000 });
assert.deepEqual(statsAt100("party:legs"), { power: 500000, toughness: 9000000 });
assert.deepEqual(statsAt100("party:boots"), { power: 500000, toughness: 9000000 });
assert.deepEqual(statsAt100("party:cup"), { power: 3000000, toughness: 2000000 });
assert.deepEqual(statsAt100("party:whistle"), { power: 4000000, toughness: 4000000 });
assert.deepEqual(sumSet(["party:weapon", "party:head", "party:chest", "party:legs", "party:boots", "party:cup", "party:whistle"]), { power: 109000000, toughness: 46000000 });
assert.equal(IDLE_ADVENTURE_SETS.party.reward.diggerGlobalBonusPct, 5, "Wiki : \"+5% Total Diggers Level Bonus\".");

// --- Typo Set ---
assert.deepEqual(statsAt100("typo:weapon"), { power: 320000000, toughness: 12000000 });
assert.deepEqual(statsAt100("typo:head"), { power: 1200000, toughness: 30000000 });
assert.deepEqual(statsAt100("typo:chest"), { power: 1200000, toughness: 32000000 });
assert.deepEqual(statsAt100("typo:legs"), { power: 1200000, toughness: 31000000 });
assert.deepEqual(statsAt100("typo:boots"), { power: 1200000, toughness: 30000000 });
assert.deepEqual(statsAt100("typo:asscessory"), { power: 24000000, toughness: 24000000 });
assert.deepEqual(statsAt100("typo:eyeElxu"), { power: 13333332, toughness: 13333332 });
assert.deepEqual(sumSet(["typo:weapon", "typo:head", "typo:chest", "typo:legs", "typo:boots", "typo:asscessory", "typo:eyeElxu"]), { power: 362133332, toughness: 172333332 });

// --- Fad Set ---
assert.deepEqual(statsAt100("fad:weapon"), { power: 500000000, toughness: 20000000 });
assert.deepEqual(statsAt100("fad:head"), { power: 1800000, toughness: 44000000 });
assert.deepEqual(statsAt100("fad:chest"), { power: 1800000, toughness: 48000000 });
assert.deepEqual(statsAt100("fad:legs"), { power: 1800000, toughness: 46000000 });
assert.deepEqual(statsAt100("fad:boots"), { power: 1800000, toughness: 42000000 });
assert.deepEqual(statsAt100("fad:pokeymanCard"), { power: 38000000, toughness: 38000000 });
assert.deepEqual(statsAt100("fad:krazyBonez"), { power: 40000000, toughness: 40000000 });
assert.deepEqual(sumSet(["fad:weapon", "fad:head", "fad:chest", "fad:legs", "fad:boots", "fad:pokeymanCard", "fad:krazyBonez"]), { power: 585200000, toughness: 278000000 });

// --- JRPG Set ---
assert.deepEqual(statsAt100("jrpg:weapon"), { power: 800000000, toughness: 32000000 });
assert.deepEqual(statsAt100("jrpg:head"), { power: 2800000, toughness: 76000000 });
assert.deepEqual(statsAt100("jrpg:chest"), { power: 3000000, toughness: 74000000 });
assert.deepEqual(statsAt100("jrpg:legs"), { power: 3000000, toughness: 78000000 });
assert.deepEqual(statsAt100("jrpg:boots"), { power: 3000000, toughness: 76000000 });
assert.deepEqual(statsAt100("jrpg:zipper"), { power: 42000000, toughness: 46000000 });
assert.deepEqual(statsAt100("jrpg:wig"), { power: 60000000, toughness: 60000000 });
assert.deepEqual(sumSet(["jrpg:weapon", "jrpg:head", "jrpg:chest", "jrpg:legs", "jrpg:boots", "jrpg:zipper", "jrpg:wig"]), { power: 913800000, toughness: 442000000 });

// --- Rad Set ---
assert.deepEqual(statsAt100("rad:weapon"), { power: 1760000000, toughness: 70000000 });
assert.deepEqual(statsAt100("rad:head"), { power: 6600000, toughness: 174000000 });
assert.deepEqual(statsAt100("rad:chest"), { power: 6800000, toughness: 172000000 });
assert.deepEqual(statsAt100("rad:legs"), { power: 7000000, toughness: 172000000 });
assert.deepEqual(statsAt100("rad:boots"), { power: 6800000, toughness: 172000000 });
assert.deepEqual(statsAt100("rad:notDrugs"), { power: 180000000, toughness: 180000000 });
assert.deepEqual(statsAt100("rad:gloveOfPower"), { power: 260000000, toughness: 160000000 });
assert.deepEqual(sumSet(["rad:weapon", "rad:head", "rad:chest", "rad:legs", "rad:boots", "rad:notDrugs", "rad:gloveOfPower"]), { power: 2227200000, toughness: 1100000000 });

// --- Chaque zone Evil référence bien le bon set (source) ---
for (const [setId, zoneId] of [["edgy", "evilverse"], ["pinkprincess", "pinkprincess"], ["meta", "metaland"], ["party", "interdimensional"], ["typo", "typozone"], ["fad", "fadlands"], ["jrpg", "jrpgville"], ["rad", "radlands"]]) {
  assert.equal(IDLE_ADVENTURE_SETS[setId].source, zoneId, `Le set ${setId} doit venir de la zone ${zoneId}.`);
}

console.log("idle-adventure-evil-zone-sets-audit: OK");
