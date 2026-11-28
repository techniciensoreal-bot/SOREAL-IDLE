import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-28) : « j'ai encore des rollback de barre dans Time Machine ; quand je prends ou mets de l'énergie rapidement, des clics me sont rendus ».
 * Mesure dans le navigateur (partie B, moteur local) : 5 rafales de 10 clics sur 16 voyaient l'énergie placée reculer de 2 à 3 clics. Cause : la réponse d'une action d'Aventure
 * (startZoneFight / resolveZoneFight, toutes les quelques secondes), calculée AVANT les clics, était adoptée par appliquerSynchroCombatSansReflowIdleV116_ sans que les allocations voulues
 * (pas encore confirmées) soient réappliquées : seules la synchro et le rendu complet le faisaient. Avec la réapplication à l'entrée de cette fonction : 0 recul sur 20 rafales.
 */
const c1 = fs.readFileSync("cloudflare/public/modules/ui-combat-1-v1.js", "utf8");
const i = c1.indexOf("function appliquerSynchroCombatSansReflowIdleV116_(");
assert.ok(i > 0);
const tete = c1.slice(i, i + 1800);
assert.ok(tete.includes("window.__appliquerAllocationsVouluesIdleV1__(joueurServeur)"), "l'état qui arrive reçoit les allocations voulues dès l'entrée");
assert.ok(tete.indexOf("__appliquerAllocationsVouluesIdleV1__") < tete.indexOf("REG.idlePrevisionBossV1.actif"), "avant tout retour anticipé");
/* les deux reprises par google.script.run (victoire non confirmée, bandeau de reprise) aussi */
assert.equal(c1.split("window.__appliquerAllocationsVouluesIdleV1__(etat.joueur)").length - 1, 2, "les deux adoptions d'un état complet réappliquent aussi les allocations voulues");

/* chaque site qui adopte un état de réponse d'action passe par cette fonction (ou par la synchro / le rendu, qui réappliquent déjà) */
for (const [fichier, motif] of [["meta-progression-v130.js", "appliquerSynchroCombatSansReflowIdleV116_(joueurMetaProtegeV208)"], ["ui-inventaire-v1.js", "appliquerSynchroCombatSansReflowIdleV116_(res.joueur)"], ["ui-magie-energie-v1.js", "appliquerSynchroCombatSansReflowIdleV116_(joueurSortProtegeV208)"]]) {
  assert.ok(fs.readFileSync("cloudflare/public/modules/" + fichier, "utf8").includes(motif), fichier + " passe par le point de passage commun");
}

/*
 * Recul de barre de la Machine temporelle (Norman, 2026-11-28) : mesuré, 4 à 6 reculs de 5 à 16 points par série de 8 rafales de clics. Un redessin de la page retire l'ancre du compte à rebours
 * (data-tm-eta-at) ; le minuteur la recalcule depuis vue.__ancreTmV1, restée celle de la réponse d'origine alors que les chiffres de la vue avaient été avancés à « maintenant » par le clic.
 * Le rebasage local de la vue (rebaserVueTimeMachineIdleV1_) remet donc aussi l'ancre à maintenant. Avec cela : 0 recul sur 26 rafales.
 */
const aug = fs.readFileSync("cloudflare/public/modules/augmentations-page-v1.js", "utf8");
const j = aug.indexOf("function rebaserVueTimeMachineIdleV1_(");
const fin = aug.indexOf("function recalculerTimeMachineLocalIdleV1_(", j);
assert.ok(j > 0 && fin > j);
const corps = aug.slice(j, fin);
assert.ok(corps.indexOf("vue.__at=maintenant;") > 0 && corps.indexOf("vue.__ancreTmV1=performance.now();") > corps.indexOf("vue.__at=maintenant;"), "le rebasage local pose l'ancre du compte a rebours a maintenant");
const mt = fs.readFileSync("cloudflare/public/modules/ui-machine-temporelle-v1.js", "utf8");
assert.ok(mt.includes("vueTm.__ancreTmV1!==undefined)?vueTm.__ancreTmV1"), "le minuteur relit bien vue.__ancreTmV1 quand l'ancre est retiree");
console.log("idle-alloc-voulues-reponses-action-v1: OK");
