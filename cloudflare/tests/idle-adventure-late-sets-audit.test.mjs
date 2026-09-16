import assert from "node:assert/strict";
import { idleAdventureItemAtLevelV47, IDLE_ADVENTURE_BOOSTS } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-16) : "mets à jour les stats des objets avant notre
 * update des chiffres." Les 16 premiers sets étaient déjà audités
 * (vérifiés exacts à nouveau ce jour, 4 spot-checks live sur le wiki :
 * Forest/HSB/Spoopy/Slimy, zéro écart) ; 4 sets restaient sur un repli
 * "répartition égale" au lieu de la vraie fiche wiki par pièce : 2D,
 * UUG's Rings, Wanderer's, S'rerednaW. Totaux de set déjà corrects,
 * seule la répartition PAR PIÈCE était fausse.
 *
 * Sources (wiki NGU, "Stats Max" niveau 100, confirmées live) :
 * - https://ngu-idle.fandom.com/wiki/2D_(set)
 * - https://ngu-idle.fandom.com/wiki/UUG's_rings_(set)
 * - https://ngu-idle.fandom.com/wiki/Wanderer's_(set)
 * - https://ngu-idle.fandom.com/wiki/S'rerednaW_(set)
 *
 * Norman a aussi confirmé le palier de Boost incomplet (wiki NGU, page
 * Boost : "1, 2, 5, 10, 20, 50, 100, 200, 500, 1k, 2k, 5k and 10k" — 13
 * paliers réels, SOREAL s'arrêtait à 100, les 6 derniers manquaient).
 */

// idleAdventureItemAtLevelV47(definitionId, level, id) renvoie l'objet à un
// niveau donné ; au niveau 100 (MAX), power/toughness = les vraies valeurs
// "Stats Max" du wiki (avant division par 2 puis ×q, q=1+100/100=2 → ×1).
function statsAt100(definitionId) {
  const o = idleAdventureItemAtLevelV47(definitionId, 100, "preview");
  return { power: o.power, toughness: o.toughness };
}

// --- 2D Set ---
assert.deepEqual(statsAt100("2d:weapon"), { power: 9200, toughness: 600 });
assert.deepEqual(statsAt100("2d:head"), { power: 100, toughness: 1200 });
assert.deepEqual(statsAt100("2d:chest"), { power: 100, toughness: 1290 });
assert.deepEqual(statsAt100("2d:legs"), { power: 140, toughness: 1520 });
assert.deepEqual(statsAt100("2d:boots"), { power: 120, toughness: 1400 });
assert.deepEqual(statsAt100("2d:cube"), { power: 1300, toughness: 1300 });
assert.deepEqual(statsAt100("2d:amulet"), { power: 0, toughness: 0 });

// --- UUG's Rings Set ---
assert.deepEqual(statsAt100("uug:ringGreed"), { power: 0, toughness: 0 });
assert.deepEqual(statsAt100("uug:ringMight"), { power: 13332, toughness: 13332 });
assert.deepEqual(statsAt100("uug:ringUtility"), { power: 2000, toughness: 2000 });
assert.deepEqual(statsAt100("uug:ringEnergy"), { power: 2000, toughness: 2000 });
assert.deepEqual(statsAt100("uug:ringMagic"), { power: 2000, toughness: 2000 });

// --- Wanderer's Set ---
assert.deepEqual(statsAt100("wanderer:head"), { power: 2000, toughness: 44000 });
assert.deepEqual(statsAt100("wanderer:chest"), { power: 2000, toughness: 46000 });
assert.deepEqual(statsAt100("wanderer:legs"), { power: 2000, toughness: 46000 });
assert.deepEqual(statsAt100("wanderer:boots"), { power: 2000, toughness: 48000 });

// --- S'rerednaW Set ---
assert.deepEqual(statsAt100("rerednaw:head"), { power: 2000, toughness: 42000 });
assert.deepEqual(statsAt100("rerednaw:chest"), { power: 2000, toughness: 44000 });
assert.deepEqual(statsAt100("rerednaw:legs"), { power: 2000, toughness: 46000 });
assert.deepEqual(statsAt100("rerednaw:boots"), { power: 2000, toughness: 48000 });

// --- Totaux de set inchangés (aucune régression sur ce qui était déjà juste) ---
function sumSet(ids) {
  return ids.reduce((acc, id) => {
    const s = statsAt100(id);
    return { power: acc.power + s.power, toughness: acc.toughness + s.toughness };
  }, { power: 0, toughness: 0 });
}
assert.deepEqual(sumSet(["2d:weapon", "2d:head", "2d:chest", "2d:legs", "2d:boots", "2d:cube", "2d:amulet"]), { power: 10960, toughness: 7310 });
assert.deepEqual(sumSet(["uug:ringGreed", "uug:ringMight", "uug:ringUtility", "uug:ringEnergy", "uug:ringMagic"]), { power: 19332, toughness: 19332 });
assert.deepEqual(sumSet(["wanderer:head", "wanderer:chest", "wanderer:legs", "wanderer:boots"]), { power: 8000, toughness: 184000 });
assert.deepEqual(sumSet(["rerednaw:head", "rerednaw:chest", "rerednaw:legs", "rerednaw:boots"]), { power: 8000, toughness: 180000 });

// --- Boost tiers : les 13 vrais paliers NGU, pas seulement les 7 premiers ---
assert.deepEqual(
  IDLE_ADVENTURE_BOOSTS,
  [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000],
  "Les 13 paliers réels de Boost (wiki NGU) doivent tous être disponibles, pas seulement les 7 premiers."
);

console.log("idle-adventure-late-sets-audit: OK");
