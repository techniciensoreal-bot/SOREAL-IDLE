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

// 1. La fonction de classification existe et couvre exactement les 3 modes concernés.
assert.match(
  meta,
  /var IDLE_INVENTORY_AUTO_ACTIONS_PATCH_V1=\{boostAll:'boost',mergeAll:'merge',transformBoost:''\};/,
  "boostAll/mergeAll/transformBoost doivent être mappés vers un patch ciblé"
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

  // Les modes qui ne touchent jamais la grille du sac gardent le rendu complet (non régression du reste du panneau).
  for (const payload of [
    { action: "inventoryAuto", mode: "settings", autoMerge: true },
    { action: "inventoryAuto", mode: "lootFilterType", slot: "head", filtered: true },
    { action: "inventoryAuto", mode: "loadoutSave", index: 0 },
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
assert.ok(index.includes("/modules/meta-progression-v130.js?v=202609271"));
assert.ok(!index.includes("/modules/meta-progression-v130.js?v=202609261"));

console.log("idle-inventory-auto-no-full-render-v1: OK");
