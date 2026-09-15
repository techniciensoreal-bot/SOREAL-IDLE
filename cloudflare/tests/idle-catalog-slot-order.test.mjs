import assert from "node:assert/strict";
import { IDLE_ADVENTURE_ITEM_CATALOG_V1 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-13) : "Quand on la range dans le coffre, elles doivent
 * se classer dans le bon ordre, pas dans l'ordre où je les mets. Exemple
 * arme, tête, torse, jambe, bottes, anneaux, items de la zone, ..."
 *
 * SETS déclarait ses slots dans un ordre de rédaction arbitraire
 * (head/chest/legs/boots/weapon/ring...), jamais pensé comme un ordre
 * d'affichage — IDLE_ADVENTURE_ITEM_CATALOG_V1 (consommé par Collection
 * ET le Coffre) trie désormais chaque zone selon weapon → head → chest →
 * legs → boots → (reste, ordre de déclaration conservé), sans jamais
 * réordonner les ZONES elles-mêmes (déjà wiki-vérifiées).
 */

function slotsOfSet(setId) {
  return Object.entries(IDLE_ADVENTURE_ITEM_CATALOG_V1)
    .filter(([id, def]) => def.kind === "equipment" && def.set === setId)
    .map(([id]) => id.split(":")[1]);
}

// --- Sewers a les 7 types de pièce (arme, tête, torse, jambe, bottes, anneau, amulette) ---
{
  const slots = slotsOfSet("sewers");
  assert.deepEqual(
    slots,
    ["weapon", "head", "chest", "legs", "boots", "ring", "amulet"],
    "L'ordre attendu est arme, tête, torse, jambe, bottes, puis les accessoires (dans leur ordre de déclaration)."
  );
}

// --- Un set sans arme (ex. UUG, uniquement des anneaux) doit rester dans son ordre de déclaration ---
{
  const slots = slotsOfSet("uug");
  assert.deepEqual(
    slots,
    ["ringGreed", "ringMight", "ringUtility", "ringEnergy", "ringMagic"],
    "Sans pièce reconnue (arme/tête/torse/jambe/bottes), l'ordre de déclaration original doit être conservé — jamais un tri qui casse un set 100% accessoires."
  );
}

// --- L'ordre des ZONES elles-mêmes (déjà wiki-vérifié) ne doit jamais être affecté par ce tri ---
{
  const ids = Object.keys(IDLE_ADVENTURE_ITEM_CATALOG_V1).filter((id) => IDLE_ADVENTURE_ITEM_CATALOG_V1[id].kind === "equipment");
  const firstTrainingIndex = ids.findIndex((id) => id.startsWith("training:"));
  const firstSewersIndex = ids.findIndex((id) => id.startsWith("sewers:"));
  const firstForestIndex = ids.findIndex((id) => id.startsWith("forest:"));
  assert.ok(
    firstTrainingIndex < firstSewersIndex && firstSewersIndex < firstForestIndex,
    "L'ordre de progression des zones (training avant sewers avant forest) doit rester intact — seul l'ordre DANS chaque zone change."
  );
}

console.log("idle-catalog-slot-order: OK");
