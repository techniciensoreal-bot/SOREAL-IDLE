import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « Quand je fais A + clique gauche pour absorber les boosts sur un item, l'image
 * clignote, on aperçoit rapidement le haut de la page une fraction de seconde pour être replacé au même
 * endroit sur la page. »
 *
 * Cause : les raccourcis clavier A/D/Q/W/E de l'inventaire (modules/inventory-auto-v1.js) envoient
 * {action:'inventoryAuto', mode:'boostAll'|'mergeAll'|'transformBoost', ...} -- jamais reconnu par le test
 * estMutationInventaireAdventureV1 (qui n'accepte que payload.action==='adventure'), donc toujours renvoyé
 * vers rendreIdleEtat_ : la page ENTIÈRE (#app.innerHTML) est reconstruite pour un seul objet boosté,
 * recréant au passage TOUTES les images de la grille du sac (flash) et forçant les rattrapages de défilement
 * déjà en place (saut visible avant repositionnement). Les actions equip/unequip/merge/boost/cube/discard/
 * setLock/... déclenchées depuis l'écran Aventure lui-même (payload.action==='adventure') évitaient déjà ce
 * problème via patchInventaireAdventureIdleV160_ (patch ciblé de la grille, sans toucher au reste de la
 * page) -- jamais branché pour ces raccourcis.
 */
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");

/*
 * 2026-09-27 (Norman, à nouveau : « Quand on ouvre et ferme le coffre, il y a un effet de clignotement... quand on
 * coche un filtre. Part à la traque de ces sauts d'images et neutralise-les. ») : réglages (settings) et filtre de
 * butin (lootFilterType/lootFilterItem) ajoutés à la classification, pour la même raison exacte que boostAll/
 * mergeAll/transformBoost -- leur panneau ne vit que sur la page Aventure, jamais affiché ailleurs.
 */
// 1. La fonction de classification existe et couvre exactement les 6 modes concernés.
assert.match(
  meta,
  /var IDLE_INVENTORY_AUTO_ACTIONS_PATCH_V1=\{boostAll:'boost',mergeAll:'merge',transformBoost:'',settings:'',lootFilterType:'',lootFilterItem:'',sortInventory:''\};/,
  "boostAll/mergeAll/transformBoost/settings/lootFilterType/lootFilterItem/sortInventory (Trier, Norman 2026-10-03 : on voyait le haut de la page une fraction de seconde) doivent être mappés vers un patch ciblé"
);

// 2. Comportement réel de la classification (exécutée hors navigateur).
{
  const fonction = meta.slice(
    meta.indexOf("var IDLE_INVENTORY_AUTO_ACTIONS_PATCH_V1="),
    meta.indexOf("function actionMetaIdleV130_(payload){")
  );
  assert.ok(fonction.includes("function actionPatchInventaireAutoV1_(payload){"), "ancre de découpe valide");
  const classifier = new Function(fonction + "\nreturn actionPatchInventaireAutoV1_;")();

  assert.equal(classifier({ action: "inventoryAuto", mode: "boostAll", targetId: "abc" }), "boost", "A + clic (booster) -> patch comme 'boost'");
  assert.equal(classifier({ action: "inventoryAuto", mode: "boostAll", targetId: "cube" }), "boost", "boost vers le Cube -> patch comme 'boost' aussi (même action côté equip unique)");
  assert.equal(classifier({ action: "inventoryAuto", mode: "mergeAll", itemId: "abc" }), "merge", "D + clic (fusionner) -> patch comme 'merge'");
  assert.equal(classifier({ action: "inventoryAuto", mode: "transformBoost", itemId: "abc", type: "power" }), "", "Q/W/E + clic (transformer) -> patch générique (pas de catégorie équipement/bonus)");
  assert.equal(classifier({ action: "inventoryAuto", mode: "settings", autoMerge: true }), "", "case à cocher réglages -> patch générique, jamais le rendu complet");
  assert.equal(classifier({ action: "inventoryAuto", mode: "lootFilterType", slot: "head", filtered: true }), "", "case à cocher filtre de butin (type) -> patch générique");
  assert.equal(classifier({ action: "inventoryAuto", mode: "lootFilterItem", definitionId: "abc", filtered: true }), "", "case à cocher filtre de butin (objet) -> patch générique");
  assert.equal(classifier({ action: "inventoryAuto", mode: "sortInventory" }), "", "Trier (Norman, 2026-10-03) : patch de la grille seulement, plus de rendu complet (flash du haut de page)");

  // Les configurations d'équipement rééquipent potentiellement toute la tenue : elles gardent le rendu complet.
  for (const payload of [
    { action: "inventoryAuto", mode: "loadoutSave", index: 0 },
    { action: "inventoryAuto", mode: "loadoutApply", index: 0 },
    { action: "adventure", adventure: { action: "boost" } },
    null,
    undefined
  ]) {
    assert.equal(classifier(payload), null, "ne doit pas être reclassé en patch: " + JSON.stringify(payload));
  }
}

// 3. Le dispatcher doit utiliser cette classification pour éviter rendreIdleEtat_ (rendu complet), au même
//    titre que les actions equip/unequip/merge/boost/cube déjà exemptées.
const noyau = meta.slice(meta.indexOf("function actionMetaNoyauIdleV130_("), meta.indexOf("function ajusterAllocationMetaIdleV130_("));
assert.match(
  noyau,
  /const actionPatchInventaireAutoV1=actionPatchInventaireAutoV1_\(payload\);\s*const estMutationInventaireAutoV1=actionPatchInventaireAutoV1!=null;/,
  "le noyau doit calculer la classification pour chaque action"
);
assert.match(
  noyau,
  /if\(estMutationInventaireAdventureV1\|\|estMutationInventaireAutoV1\)\{/,
  "le patch ciblé doit s'appliquer aussi bien aux mutations 'adventure' qu'aux raccourcis inventoryAuto"
);
assert.match(
  noyau,
  /action:estMutationInventaireAdventureV1\?payload\.adventure\.action:actionPatchInventaireAutoV1,/,
  "le nom d'action transmis au patch doit venir de la bonne source selon l'origine de la mutation"
);

// 4. Cache-bust cohérent (index.html + tests qui vérifient ce numéro).
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(index.includes("/modules/meta-progression-v130.js?v=202610061"));
assert.ok(!index.includes("/modules/meta-progression-v130.js?v=202609261"));

console.log("idle-inventory-auto-no-full-render-v1: OK");
