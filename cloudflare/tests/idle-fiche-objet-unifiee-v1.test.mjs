import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47, idleAdventureSnapshotV47, IDLE_ADVENTURE_ITEM_CATALOG_V1 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-10-03) : « dans le coffre, je veux pouvoir consulter les statistiques des objets avant de décider si je le reprends dans l'inventaire ; trouve une manière uniformisée pour tous les objets, équipé, dans
 * l'inventaire, dans le coffre ou dans les collections ». Une seule fiche d'objet ; le coffre et la collection l'ouvrent, le coffre y ajoute « Reprendre dans l'inventaire ».
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// 1. Serveur : l'objet rangé au coffre arrive avec ses statistiques complètes (Specials détaillés et plafonds), comme un objet d'inventaire.
{
  let s = normalizeIdleAdventureStateV47({});
  s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "forest:head", level: 100 }, { bosses: 300 }, 1).state;
  const piece = s.inventory.find((i) => i.definitionId === "forest:head");
  s.coffre["forest:head"] = { ...piece };
  s.itemList["forest:head"] = { seen: true, maxLevel: 100, fullyMaxed: true };
  const slot = idleAdventureSnapshotV47(s, 300).coffreSlots.find((x) => x.definitionId === "forest:head");
  assert.ok(slot.occupe && slot.item);
  assert.ok(Array.isArray(slot.item.specialsAll) && slot.item.specialsAll.length === 2, "Specials détaillés (valeur / plafond)");
  assert.ok(slot.item.basePower + slot.item.baseToughness > 0, "bases pour les plafonds de Puissance / Endurance");
  assert.equal(slot.item.id, piece.id, "même identifiant : la fiche peut reprendre l'objet");
}

// 2. Catalogue : les Specials (type + plafond au niveau 0) de chaque objet pour la fiche de la Collection.
assert.deepEqual(IDLE_ADVENTURE_ITEM_CATALOG_V1["forest:head"].specials, [["energyPowerPct", 10], ["energySpeedPct", 12]]);
assert.ok(IDLE_ADVENTURE_ITEM_CATALOG_V1.cheeseGrater.specials.length >= 3, "objets spéciaux : leurs extras aussi");
assert.deepEqual(IDLE_ADVENTURE_ITEM_CATALOG_V1["training:head"].specials, [], "pièce sans Special : liste vide");

// 3. Client : une seule fiche, ouverte par le coffre et la collection (clic ou survol de 0,5 s) ; la reprise passe par la fiche.
assert.ok(ui.includes("function afficherPopupObjetUnifieIdleV1_(cle,ancre)"));
assert.ok(ui.includes("statsHtmlObjetAdventureIdleV138_(item)+\n          actions;"), "mêmes statistiques que la fiche de l'inventaire");
assert.ok(ui.includes("window.__consulterObjetIdleV1__"));
assert.ok(ui.includes("data-popup-objet-v1=\"'+idleHtml_(clePopup)+'\""), "cases du coffre");
assert.ok(ui.includes("data-popup-objet-v1=\"'+idleHtml_(clePopupCollection)+'\""), "cases de la collection");
assert.ok(ui.includes("⬅️ Reprendre dans l’inventaire"), "reprise depuis la fiche");
assert.ok(!ui.includes("onclick=\"window.__retirerDuCoffreAdventureIdleV1__(\''+idleHtml_(String(item.id))+'\')\" '+"), "plus de reprise directe au clic sur la case");
assert.ok(ui.includes("IDLE_SURVOL_DELAI_OUVERTURE_MS_V1);\n        return;\n        }\n        clearTimeout(idleSurvolVirtuelTimerV1);") || ui.includes("idleSurvolVirtuelTimerV1=setTimeout"), "survol de 0,5 s");
assert.ok(ui.includes("function racinePopupObjetIdleV1_()"), "la fiche existe aussi sur la page Collection (créée au besoin)");
console.log("idle-fiche-objet-unifiee-v1: OK");
