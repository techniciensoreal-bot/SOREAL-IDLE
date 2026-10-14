import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-14) : « un simple clic / tap ouvre la fiche de l'objet avec les stats (qu'il en ait ou non) ; fin du système de sélection ». PUIS (même jour, après avoir testé sur téléphone) : « je voulais juste changer l'appui long
 * en simple tap, pas changer la manière dont les objets se fusionnent » : la fusion par GLISSER-DÉPOSER d'un objet sur un autre est donc CONSERVÉE (ce test le garde).
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

// 1. Plus aucun état de sélection d'objet, ni classe « selected » sur les cartes / emplacements du sac.
for (const mort of ["idleAdventureSelectionIdV138", "restaurerSelectionInventaireIdleV160_", "idleSelectionModeV32", "idleSelectionObjetsV32", "tapObjetIdleV32_", "debutAppuiObjetIdleV32_"]) {
  assert.ok(!ui.includes(mort), "sélection d'objet encore présente : " + mort);
}
assert.ok(!/\.soreal-idle-v138-(slot|bag-card)\.selected/.test(css), "style de sélection du sac encore présent");
assert.ok(!/classList\.add\('selected'\)/.test(ui), "plus aucune classe selected ajoutée");

// 2. La fusion par glisser-déposer d'un objet sur un autre (carte du sac ou pièce équipée) est CONSERVÉE.
for (const vivant of ["fusionnerObjetAdventureIdleV47_", "fusionnerSiPossibleAdventureIdleV138_", "fusionnerSelonInteractionAdventureIdleV169_", "idsFusionAdventureIdleV169_", "action:'merge'"]) {
  assert.ok(ui.includes(vivant), "fusion par glisser-déposer disparue : " + vivant);
}
assert.ok(ui.includes("return 'fusionner';"), "déposer une pièce sur la pièce équipée identique la fusionne");
const debutDepot0 = ui.indexOf("function appliquerDepotGesteAdventureIdleV196_");
const depot0 = ui.slice(debutDepot0, ui.indexOf("\n      function ", debutDepot0 + 10));
assert.ok(depot0.includes("fusionnerSiPossibleAdventureIdleV138_(source,cibleId)"), "le dépôt d'un objet sur un autre objet du sac fusionne");

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

// 4. Un dépôt sur une carte : fusion si même objet, boost sur équipement, sinon déplacement (comme avant).
const debutDepot = ui.indexOf("function fusionnerSiPossibleAdventureIdleV138_");
const depot = ui.slice(debutDepot, ui.indexOf("\n      function ", debutDepot + 10));
assert.ok(depot.includes("memeDefinition") && depot.includes("boosterObjetParIdAdventureIdleV47_(") && depot.includes("reordonnerInventaireAdventureIdleV162_("), "dépôt sur carte : fusionner, booster ou déplacer");

// 5. Un nouvel appui sur l'objet dont la fiche est ouverte la referme (Norman, 2026-10-14) : l'appui ferme la fiche, le tap qui suit ne la rouvre pas.
const debutFerme = ui.indexOf("function fermerPopupDetailsSiExterieurAdventureIdleV207_");
const ferme = ui.slice(debutFerme, ui.indexOf("\n      }", debutFerme));
assert.ok(ferme.includes("idleFicheFermeeParAppuiV1=") && ferme.indexOf("idleFicheFermeeParAppuiV1=") < ferme.indexOf("fermerDetailsObjetAdventureIdleV1_()"), "l'objet appuyé est mémorisé AVANT la fermeture de la fiche");
const debutOuvre = ui.indexOf("function ouvrirDetailsObjetParGesteAdventureIdleV196_");
const ouvre = ui.slice(debutOuvre, ui.indexOf("\n      }", debutOuvre));
assert.ok(ouvre.includes("idleFicheFermeeParAppuiV1.id===objet") && ouvre.indexOf("idleFicheFermeeParAppuiV1.id===objet") < ouvre.indexOf("afficherDetailsObjetAdventureIdleV138_(objet)"), "même objet : la fiche reste fermée");

// 6. Double tap acheté : le premier appui n'ouvre pas la fiche tout de suite (elle gênerait le deuxième appui) ; la souris l'ouvre aussitôt.
const debutFin = ui.indexOf("function finirGesteAdventureIdleV196_");
const fin = ui.slice(debutFin, ui.indexOf("\n      function ", debutFin + 10));
assert.ok(fin.includes("idleDoubleDiffereTimerV1=setTimeout(") && fin.includes("pointerType!=='mouse'") && fin.indexOf("clicDroitGestesAchetesIdleV1_(id)") < fin.indexOf("idleDoubleDiffereTimerV1=setTimeout("), "ouverture différée seulement avec un double tap acheté, au toucher");

console.log("Inventaire : un appui ouvre la fiche, plus de sélection, fusion par glisser-déposer conservée: OK");
