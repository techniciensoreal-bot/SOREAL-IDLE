import assert from "node:assert/strict";
import { neuf, ajouter, equiper } from "./_antlers-aide.mjs";
import { IDLE_ADVENTURE_WIKI_ITEM_IDS_V1, SPECIALS_EN_V1, SPECIALS } from "../src/idle-adventure-sets.js";
import { IDLE_ADVENTURE_COFFRE_TITAN_OBJETS_V1 } from "../src/idle-adventure-inventaire.js";
import { NOMS_SPECIALS_FR_V1 } from "../src/idle-noms-fr-v1.js";

/*
 * Chaîne de l'Exilé, les sept objets (ids 335 à 341 du jeu, build 1260 : table d'objets, noms et types lus dans Assembly-CSharp).
 */
const OBJETS = [
  ["sealExile", 335, "Seal of the Exile", "weapon"],
  ["faceExile", 336, "Face of the Exile", "special"],
  ["exileClueTentacle", 337, "Tentacle of the Exile (Clue)", "special"],
  ["exileClueAntlers", 338, "Antlers of the Exile (Clue)", "special"],
  ["exileClueBuster", 339, "Buster of the Exile (Clue)", "special"],
  ["exileClueAntennae", 340, "Antennae of the Exile (Clue)", "special"],
  ["sackExile", 341, "Sack of the Exile", "special"]
];
for (const [cle, id, nom, slot] of OBJETS) {
  assert.equal(IDLE_ADVENTURE_WIKI_ITEM_IDS_V1[cle], id, cle + " : id du jeu");
  assert.equal(SPECIALS_EN_V1[cle].name, nom);
  assert.equal(SPECIALS_EN_V1[cle].slot, slot);
  assert.equal(SPECIALS_EN_V1[cle].p, 0);
  assert.equal(SPECIALS_EN_V1[cle].t, 0);
  assert.ok(NOMS_SPECIALS_FR_V1[cle], cle + " : nom français");
  assert.ok(SPECIALS[cle]);
  assert.ok(IDLE_ADVENTURE_COFFRE_TITAN_OBJETS_V1.t7.includes(cle), cle + " : rangé dans le coffre (titan Exilé)");
}
/* Les accessoires du titan (328 à 334) restent distincts des indices. */
assert.equal(IDLE_ADVENTURE_WIKI_ITEM_IDS_V1.antlersExile, 328);
assert.equal(IDLE_ADVENTURE_WIKI_ITEM_IDS_V1.busterExile, 334);

/* L'objet peut entrer dans le sac et le Sceau se porte en arme (le Prêtre exige qu'il soit équipé). */
{
  const a = ajouter(neuf(), "exileClueAntlers");
  assert.equal(a.o.definitionId, "exileClueAntlers");
  assert.equal(a.s.itemList.exileClueAntlers.seen, true);
  const s = equiper(neuf(), "sealExile", "weapon");
  const id = s.equipment.weapon;
  assert.equal(s.inventory.find(x => x.id === id).definitionId, "sealExile");
}
console.log("ok");
