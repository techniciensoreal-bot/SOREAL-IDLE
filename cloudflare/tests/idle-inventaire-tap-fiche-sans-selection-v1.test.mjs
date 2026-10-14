import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-14) : « Je veux supprimer la possibilité de sélectionner un item en faisant un simple tap / clic dessus. Un simple clic / tap ouvre la fiche de l'objet avec les stats (qu'il en ait ou non).
 * Supprime complètement ce système de sélection et de dépôt sur un autre objet pour les fusionner. »
 * (La fusion automatique achetée — double tap / clic droit / « mergeAll » — reste : ce n'est pas un dépôt sur un autre objet.)
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

// 1. Plus aucun état de sélection d'objet, ni classe « selected » sur les cartes / emplacements du sac.
for (const mort of ["idleAdventureSelectionIdV138", "restaurerSelectionInventaireIdleV160_", "idleSelectionModeV32", "idleSelectionObjetsV32", "tapObjetIdleV32_", "debutAppuiObjetIdleV32_"]) {
  assert.ok(!ui.includes(mort), "sélection d'objet encore présente : " + mort);
}
assert.ok(!/\.soreal-idle-v138-(slot|bag-card)\.selected/.test(css), "style de sélection du sac encore présent");
assert.ok(!/classList\.add\('selected'\)/.test(ui), "plus aucune classe selected ajoutée");

// 2. Plus de fusion par dépôt d'un objet sur un autre (ni par appui successif sur deux objets).
for (const mort of ["fusionnerObjetAdventureIdleV47_", "fusionnerSiPossibleAdventureIdleV138_", "fusionnerSelonInteractionAdventureIdleV169_", "idsFusionAdventureIdleV169_", "fusionnerLootIdleV21_", "deposerInventaireIdleV78_", "debutDragInventaireIdleV78_", "action:'merge'"]) {
  assert.ok(!ui.includes(mort), "fusion par dépôt encore présente : " + mort);
}
assert.ok(!ui.includes("return 'fusionner';"), "la décision d'un dépôt sur un emplacement ne fusionne plus");

// 3. Un simple appui ouvre la fiche (carte du sac et pièce équipée), sans statistiques comprises.
const debutCarte = ui.indexOf("function executerTapCarteAdventureIdleV196_");
const carte = ui.slice(debutCarte, ui.indexOf("function ", debutCarte + 10));
assert.ok(carte.includes("ouvrirDetailsObjetParGesteAdventureIdleV196_(objet)"), "tap sur une carte du sac : fiche");
const debutSlot = ui.indexOf("function executerTapSlotAdventureIdleV196_");
const slot = ui.slice(debutSlot, ui.indexOf("function ", debutSlot + 10));
assert.ok(slot.includes("ouvrirDetailsObjetParGesteAdventureIdleV196_(occupant)"), "tap sur une pièce équipée : fiche");
const debutFiche = ui.indexOf("function afficherDetailsObjetAdventureIdleV138_");
const fiche = ui.slice(debutFiche, ui.indexOf("\n      function ", debutFiche + 10));
assert.ok(/statsHtmlObjetAdventureIdleV138_\(item\)/.test(fiche) && /if\(!item\)\{/.test(fiche), "la fiche s'ouvre pour tout objet existant");

// 4. Un dépôt sur une carte ne fait plus que booster (boost sur équipement) ou déplacer.
const debutDepot = ui.indexOf("function deposerSurCarteAdventureIdleV138_");
const depot = ui.slice(debutDepot, ui.indexOf("\n      function ", debutDepot + 10));
assert.ok(depot.includes("boosterObjetParIdAdventureIdleV47_(") && depot.includes("reordonnerInventaireAdventureIdleV162_(") && !depot.includes("definitionId"), "dépôt sur carte : booster ou déplacer, jamais fusionner");

console.log("Inventaire : un appui ouvre la fiche, plus de sélection ni de fusion par dépôt: OK");
