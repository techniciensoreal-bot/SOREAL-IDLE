import assert from "node:assert/strict";
import { lireUiComplet, extraireElements } from "./_ui-sources.mjs";

/*
 * Norman (2026-10-29) : « quand on clique sur un item ça ouvre son menu, quand on reclique ça le ferme : je veux exactement le même comportement pour le cube de l'infini ; supprime sa règle et relie-le à la règle des autres. »
 * Règle des objets : un appui ouvre la fiche ; un nouvel appui sur l'objet dont la fiche est ouverte la REFERME (l'appui la ferme comme tout clic hors du popup, et le tap qui suit ne la rouvre pas :
 * idleFicheFermeeParAppuiV1). Le Cube suit la même règle, souris comme tactile ; le double tap acheté (absorber les boosts) reste, sans empêcher l'ouverture au premier appui.
 */
const ui = lireUiComplet();
const bloc = extraireElements(ui, ["V:idleCubeDernierTapMsV1", "V:idleCubeIgnorerClicJusquaV1", "F:ouvrirDetailsCubeParGesteIdleV1_", "F:absorberTousBoostsCubeAdventureIdleV1_", "V:idleCubeDernierEvtMsV1", "F:toucherCubeAdventureIdleV1_", "V:idleCubeAppuiV1", "F:clicCubeAdventureIdleV138_"]);

// la règle commune : la fiche du Cube a son repère, lu par la fermeture « clic hors du popup » des objets
assert.ok(ui.includes("let idleFicheCubeOuverteV1=false;"), "repère de la fiche du Cube");
assert.ok(ui.includes("appuyeCube&&idleFicheCubeOuverteV1?{id:'cube',ms:Date.now()}"), "l'appui sur le Cube dont la fiche est ouverte est mémorisé comme pour un objet");
assert.ok(ui.includes("idleFicheCubeOuverteV1=true;") && /const id=String\(itemId\|\|''\);\n\s*idleFicheCubeOuverteV1=false;/.test(ui), "repère posé à l'ouverture du Cube, remis à zéro quand une autre fiche s'affiche ou que la fiche se ferme");
assert.ok(!/typePointeur==='mouse'\)\{\s*afficherDetailsCubeInfiniAdventureIdleV220_/.test(ui), "plus de règle propre à la souris pour le Cube");
assert.ok(/cubeLong[\s\S]{0,260}ouvrirDetailsCubeParGesteIdleV1_\(\)/.test(ui), "l'appui long passe par la même ouverture");

// Exécution réelle du bloc avec un faux environnement.
const envoyes = [], details = [];
let maintenant = 1000;
const fabrique = new Function(
  "window", "Date", "nettoyerEtatDragAdventureIdleV138_", "afficherDetailsCubeInfiniAdventureIdleV220_", "IDLE_ADVENTURE_DOUBLE_TAP_MS_V196", "gestesAchetesIdleV1_", "REG", "idleFicheFermeeParAppuiV1",
  bloc + "\nreturn {clic:clicCubeAdventureIdleV138_,appuiFermeLaFiche:function(){idleFicheFermeeParAppuiV1={id:'cube',ms:Date.now()};}};"
);
let double = true;
const fenetre = { __actionMetaV47__: (p) => envoyes.push(p), matchMedia: () => ({ matches: true }) };
const REG = {};
const { clic, appuiFermeLaFiche } = fabrique(fenetre, { now: () => maintenant }, () => {}, () => details.push(maintenant), 420, () => ({ double, triple: false }), REG, { id: "", ms: 0 });

// Souris : un clic ouvre la fiche ; l'appui suivant la ferme (le clic qui suit ne la rouvre pas) ; le clic d'après l'ouvre de nouveau.
clic({ pointerType: "mouse" });
assert.equal(details.length, 1, "souris : le clic ouvre la fiche");
appuiFermeLaFiche();
maintenant += 50;
clic({ pointerType: "mouse" });
assert.equal(details.length, 1, "souris : le clic sur le Cube dont la fiche vient d'être fermée par l'appui ne la rouvre pas");
maintenant += 300;
clic({ pointerType: "mouse" });
assert.equal(details.length, 2, "souris : la fiche s'ouvre de nouveau au clic suivant");
assert.equal(envoyes.length, 0, "souris : jamais d'absorption (« A + clic » reste le raccourci PC)");

// Tactile : un simple appui ouvre la fiche, comme un objet ; deuxième appui = fermeture ; sans achat de double tap, rien n'est absorbé.
double = false;
maintenant = 5000;
clic({ pointerType: "touch" });
assert.equal(details.length, 3, "tactile : un simple appui ouvre la fiche");
appuiFermeLaFiche();
maintenant = 5300;
clic({ pointerType: "touch" });
assert.equal(details.length, 3, "tactile : le second appui referme (et ne rouvre pas)");
assert.equal(envoyes.length, 0);

// Double tap acheté : le premier appui ouvre la fiche, le second (dans 420 ms) absorbe tous les boosts sans ouvrir de nouveau.
double = true;
maintenant = 9000;
clic({ pointerType: "touch" });
const apresPremier = details.length;
assert.equal(apresPremier, 4, "double tap : le premier appui ouvre la fiche");
maintenant = 9200;
clic({ pointerType: "touch" });
assert.deepEqual(envoyes, [{ action: "inventoryAuto", mode: "boostAll", targetId: "cube" }], "double tap = absorber tous les boosts dans le Cube");
assert.equal(details.length, apresPremier, "le second appui n'ouvre plus rien");
// taps trop espacés : pas d'absorption, nouvelle ouverture
maintenant = 12000;
clic({ pointerType: "pen" });
maintenant = 12600;
clic({ pointerType: "pen" });
assert.equal(envoyes.length, 1, "taps espacés de plus de 420 ms : aucune absorption");
console.log("idle-cube-ouverture-comme-objets-v1: OK");
