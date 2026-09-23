import assert from "node:assert/strict";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";

/*
 * 2026-09-23 : special() pose id = definitionId ; deux exemplaires du même
 * objet spécial partageaient donc le même id et merge() les refusait (A===B).
 * Nécessaire aux sets à un objet (Pissed Off Key, Wandoos...) qui se
 * complètent par fusion jusqu'au niveau 100.
 */

// Deux Pissed Off Key ajoutés -> deux ids distincts, fusionnables.
{
  let s = normalizeIdleAdventureStateV47({});
  s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "pissedOffKey", level: 3 }, {}, 1).state;
  s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "pissedOffKey", level: 4 }, {}, 1).state;
  const cles = s.inventory.filter((o) => o.definitionId === "pissedOffKey");
  assert.equal(cles.length, 2);
  assert.notEqual(cles[0].id, cles[1].id, "ids distincts");
  s = applyIdleAdventureActionV47(s, { action: "merge", a: cles[0].id, b: cles[1].id }, {}, 1).state;
  const reste = s.inventory.filter((o) => o.definitionId === "pissedOffKey");
  assert.equal(reste.length, 1);
  assert.equal(reste[0].level, 8, "3 + 4 + 1 = 8");
}

// Une sauvegarde contenant déjà des doublons est réparée au chargement ; l'équipement garde sa cible.
{
  const base = normalizeIdleAdventureStateV47({});
  const brut = JSON.parse(JSON.stringify(base));
  const acc = { id: "tubaTime", definitionId: "tubaTime", kind: "special", slot: "accessory", level: 5, power: 0, toughness: 0, special: 0 };
  brut.inventory.push({ ...acc }, { ...acc, level: 7 });
  brut.equipment.accessories = ["tubaTime"];
  const s = normalizeIdleAdventureStateV47(brut);
  const tubas = s.inventory.filter((o) => o.definitionId === "tubaTime");
  assert.equal(new Set(tubas.map((o) => o.id)).size, 2, "doublon réparé");
  assert.equal(tubas.find((o) => o.id === "tubaTime").level, 5, "la première occurrence garde son id");
  assert.deepEqual(s.equipment.accessories, ["tubaTime"]);
  assert.equal(new Set(s.inventory.map((o) => o.id)).size, s.inventory.length, "tous les ids sont uniques");
}

console.log("idle-adventure-special-item-unique-ids: OK");
