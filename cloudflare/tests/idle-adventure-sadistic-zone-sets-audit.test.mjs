import assert from "node:assert/strict";
import { idleAdventureItemAtLevelV47, IDLE_ADVENTURE_SETS } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-18) : "il faut tout faire" (équipement des 17 zones
 * Evil/Sadistic). Audit des 9 sets des zones SADISTIC (wiki NGU en
 * direct, ngu-idle.fandom.com -- même méthode que les 8 sets Evil déjà
 * audités, cf. idle-adventure-evil-zone-sets-audit.test.mjs) :
 * - https://ngu-idle.fandom.com/wiki/Back_To_School_(set)
 * - https://ngu-idle.fandom.com/wiki/Western_(set)
 * - https://ngu-idle.fandom.com/wiki/Bread_(set)
 * - https://ngu-idle.fandom.com/wiki/Disco_(set)
 * - https://ngu-idle.fandom.com/wiki/Halloweenie_(set)
 * - https://ngu-idle.fandom.com/wiki/Construction_(set)
 * - https://ngu-idle.fandom.com/wiki/Duck_(set)
 * - https://ngu-idle.fandom.com/wiki/Dutch_(set)
 * - https://ngu-idle.fandom.com/wiki/Pirate_(set)
 *
 * À partir de Bread (set), chaque set SADISTIC a 8 pièces (pas 7) : le
 * bloc "Without accessories" de sa fiche wiki additionne systématiquement
 * DEUX objets à "arme" (Power dominant, Toughness faible), en plus des 4
 * pièces d'armure -- SOREAL modélise la seconde arme comme un slot
 * supplémentaire nommé (ex. "baguette", "vinylShard"), jamais fusionnée
 * avec le slot "weapon" existant.
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

// --- Back To School Set (7 pièces) ---
assert.deepEqual(statsAt100("backtoschool:weapon"), { power: 2280000000, toughness: 90000000 });
assert.deepEqual(statsAt100("backtoschool:head"), { power: 9200000, toughness: 244000000 });
assert.deepEqual(statsAt100("backtoschool:chest"), { power: 9200000, toughness: 244000000 });
assert.deepEqual(statsAt100("backtoschool:legs"), { power: 9200000, toughness: 244000000 });
assert.deepEqual(statsAt100("backtoschool:boots"), { power: 9200000, toughness: 244000000 });
assert.deepEqual(statsAt100("backtoschool:theS"), { power: 360000000, toughness: 360000000 });
assert.deepEqual(statsAt100("backtoschool:walkman"), { power: 252000000, toughness: 180000000 });
assert.deepEqual(sumSet(["backtoschool:weapon", "backtoschool:head", "backtoschool:chest", "backtoschool:legs", "backtoschool:boots", "backtoschool:theS", "backtoschool:walkman"]), { power: 2928800000, toughness: 1606000000 });

// --- Western Set (7 pièces) ---
assert.deepEqual(statsAt100("western:weapon"), { power: 2960000000, toughness: 116000000 });
assert.deepEqual(statsAt100("western:head"), { power: 12000000, toughness: 318000000 });
assert.deepEqual(statsAt100("western:chest"), { power: 12000000, toughness: 320000000 });
assert.deepEqual(statsAt100("western:legs"), { power: 12000000, toughness: 316000000 });
assert.deepEqual(statsAt100("western:boots"), { power: 12000000, toughness: 324000000 });
assert.deepEqual(statsAt100("western:corgi"), { power: 440000000, toughness: 440000000 });
assert.deepEqual(statsAt100("western:bandana"), { power: 340000000, toughness: 340000000 });
assert.deepEqual(sumSet(["western:weapon", "western:head", "western:chest", "western:legs", "western:boots", "western:corgi", "western:bandana"]), { power: 3788000000, toughness: 2174000000 });

// --- Bread Set (8 pièces) ---
assert.deepEqual(statsAt100("bread:weapon"), { power: 7640000000, toughness: 180000000 });
assert.deepEqual(statsAt100("bread:baguette"), { power: 7200000000, toughness: 274000000 });
assert.deepEqual(statsAt100("bread:head"), { power: 26000000, toughness: 760000000 });
assert.deepEqual(statsAt100("bread:chest"), { power: 26000000, toughness: 764000000 });
assert.deepEqual(statsAt100("bread:legs"), { power: 26000000, toughness: 766000000 });
assert.deepEqual(statsAt100("bread:boots"), { power: 26000000, toughness: 756000000 });
assert.deepEqual(statsAt100("bread:creamPie"), { power: 820000000, toughness: 820000000 });
assert.deepEqual(statsAt100("bread:yeast"), { power: 760000000, toughness: 760000000 });
assert.deepEqual(sumSet(["bread:weapon", "bread:baguette", "bread:head", "bread:chest", "bread:legs", "bread:boots", "bread:creamPie", "bread:yeast"]), { power: 16524000000, toughness: 5080000000 });

// --- Disco Set (8 pièces) ---
assert.deepEqual(statsAt100("disco:weapon"), { power: 9720001000, toughness: 274000000 });
assert.deepEqual(statsAt100("disco:vinylShard"), { power: 10000000000, toughness: 220000000 });
assert.deepEqual(statsAt100("disco:head"), { power: 35000000, toughness: 1026000000 });
assert.deepEqual(statsAt100("disco:chest"), { power: 35200000, toughness: 1024000000 });
assert.deepEqual(statsAt100("disco:legs"), { power: 35200000, toughness: 1028000000 });
assert.deepEqual(statsAt100("disco:boots"), { power: 35200000, toughness: 1032000000 });
assert.deepEqual(statsAt100("disco:whitePowder"), { power: 1106000000, toughness: 1106000000 });
assert.deepEqual(statsAt100("disco:rollingPaper"), { power: 1110000000, toughness: 1110000000 });
assert.deepEqual(sumSet(["disco:weapon", "disco:vinylShard", "disco:head", "disco:chest", "disco:legs", "disco:boots", "disco:whitePowder", "disco:rollingPaper"]), { power: 22076601000, toughness: 6820000000 });

// --- Halloweenie Set (8 pièces) ---
assert.deepEqual(statsAt100("halloweenie:weapon"), { power: 14500000000, toughness: 420000000 });
assert.deepEqual(statsAt100("halloweenie:apple"), { power: 14040000000, toughness: 274000000 });
assert.deepEqual(statsAt100("halloweenie:head"), { power: 50600000, toughness: 1486000000 });
assert.deepEqual(statsAt100("halloweenie:chest"), { power: 51000000, toughness: 1480000000 });
assert.deepEqual(statsAt100("halloweenie:legs"), { power: 51000000, toughness: 1490000000 });
assert.deepEqual(statsAt100("halloweenie:boots"), { power: 51000000, toughness: 1488000000 });
assert.deepEqual(statsAt100("halloweenie:toiletPaper"), { power: 1286000000, toughness: 1286000000 });
assert.deepEqual(statsAt100("halloweenie:pandora"), { power: 1302000000, toughness: 1302000000 });
assert.deepEqual(sumSet(["halloweenie:weapon", "halloweenie:apple", "halloweenie:head", "halloweenie:chest", "halloweenie:legs", "halloweenie:boots", "halloweenie:toiletPaper", "halloweenie:pandora"]), { power: 31331600000, toughness: 9226000000 });
assert.equal(IDLE_ADVENTURE_SETS.halloweenie.reward.itopodPpPct, .45, "Wiki : \"+45% PP gain!\".");

// --- Construction Set (8 pièces) ---
assert.deepEqual(statsAt100("construction:weapon"), { power: 41020000000, toughness: 600000000 });
assert.deepEqual(statsAt100("construction:hammer"), { power: 40000000000, toughness: 800000000 });
assert.deepEqual(statsAt100("construction:head"), { power: 145200000, toughness: 4110000000 });
assert.deepEqual(statsAt100("construction:chest"), { power: 144800000, toughness: 4080000000 });
assert.deepEqual(statsAt100("construction:legs"), { power: 151800000, toughness: 4060000000 });
assert.deepEqual(statsAt100("construction:boots"), { power: 152000000, toughness: 4120000000 });
assert.deepEqual(statsAt100("construction:toolbox"), { power: 3640000000, toughness: 3640000000 });
assert.deepEqual(statsAt100("construction:levelLevel"), { power: 1866000000, toughness: 1866000000 });
assert.deepEqual(sumSet(["construction:weapon", "construction:hammer", "construction:head", "construction:chest", "construction:legs", "construction:boots", "construction:toolbox", "construction:levelLevel"]), { power: 87119800000, toughness: 23276000000 });
assert.equal(IDLE_ADVENTURE_SETS.construction.reward.boostEffectiveness, .20, "Wiki : \"20% Boostier Boosts!\".");

// --- Duck Set (8 pièces) ---
assert.deepEqual(statsAt100("duck:weapon"), { power: 57800000000, toughness: 840000000 });
assert.deepEqual(statsAt100("duck:shotgun"), { power: 57000000000, toughness: 1100000000 });
assert.deepEqual(statsAt100("duck:head"), { power: 200000000, toughness: 5640000000 });
assert.deepEqual(statsAt100("duck:chest"), { power: 200000000, toughness: 5620000000 });
assert.deepEqual(statsAt100("duck:legs"), { power: 200000000, toughness: 5740000000 });
assert.deepEqual(statsAt100("duck:boots"), { power: 200000000, toughness: 5680000000 });
assert.deepEqual(statsAt100("duck:ducktTape"), { power: 5080000000, toughness: 5080000000 });
assert.deepEqual(statsAt100("duck:duckCaller"), { power: 2400000000, toughness: 2400000000 });
assert.deepEqual(sumSet(["duck:weapon", "duck:shotgun", "duck:head", "duck:chest", "duck:legs", "duck:boots", "duck:ducktTape", "duck:duckCaller"]), { power: 123080000000, toughness: 32100000000 });

// --- Dutch Set (8 pièces) ---
assert.deepEqual(statsAt100("dutch:weapon"), { power: 76400000000, toughness: 1200000000 });
assert.deepEqual(statsAt100("dutch:tulip"), { power: 76000000000, toughness: 1200000000 });
assert.deepEqual(statsAt100("dutch:head"), { power: 280000000, toughness: 7700000000 });
assert.deepEqual(statsAt100("dutch:chest"), { power: 280000000, toughness: 7640000000 });
assert.deepEqual(statsAt100("dutch:legs"), { power: 280000000, toughness: 7600000000 });
assert.deepEqual(statsAt100("dutch:boots"), { power: 280000000, toughness: 7700000000 });
assert.deepEqual(statsAt100("dutch:netherlands"), { power: 5620000000, toughness: 5620000000 });
assert.deepEqual(statsAt100("dutch:cheese"), { power: 7020000000, toughness: 7020000000 });
assert.deepEqual(sumSet(["dutch:weapon", "dutch:tulip", "dutch:head", "dutch:chest", "dutch:legs", "dutch:boots", "dutch:netherlands", "dutch:cheese"]), { power: 166160000000, toughness: 45680000000 });
assert.equal(IDLE_ADVENTURE_SETS.dutch.reward.bloodMagicSpeedPct, .25, "Wiki : \"+25% Faster Blood Magic Rituals!\".");

// --- Pirate Set (8 pièces) ---
assert.deepEqual(statsAt100("pirate:weapon"), { power: 138000000000, toughness: 2000000000 });
assert.deepEqual(statsAt100("pirate:cutlass"), { power: 126000000000, toughness: 2000000000 });
assert.deepEqual(statsAt100("pirate:head"), { power: 480000000, toughness: 11200000000 });
assert.deepEqual(statsAt100("pirate:chest"), { power: 500000000, toughness: 11400000000 });
assert.deepEqual(statsAt100("pirate:legs"), { power: 480000000, toughness: 11000000000 });
assert.deepEqual(statsAt100("pirate:boots"), { power: 480000000, toughness: 11000000000 });
assert.deepEqual(statsAt100("pirate:eyepatch"), { power: 11800000000, toughness: 11800000000 });
assert.deepEqual(statsAt100("pirate:compass"), { power: 11800000000, toughness: 11800000000 });
assert.deepEqual(sumSet(["pirate:weapon", "pirate:cutlass", "pirate:head", "pirate:chest", "pirate:legs", "pirate:boots", "pirate:eyepatch", "pirate:compass"]), { power: 289540000000, toughness: 72200000000 });

// --- Chaque zone SADISTIC référence bien le bon set (source) ---
for (const [setId, zoneId] of [["backtoschool", "backtoschool"], ["western", "westworld"], ["bread", "breadverse"], ["disco", "seventies"], ["halloweenie", "halloweenies"], ["construction", "construction"], ["duck", "duckduck"], ["dutch", "netherregions"], ["pirate", "aethereansea"]]) {
  assert.equal(IDLE_ADVENTURE_SETS[setId].source, zoneId, `Le set ${setId} doit venir de la zone ${zoneId}.`);
}

console.log("idle-adventure-sadistic-zone-sets-audit: OK");
