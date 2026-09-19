import assert from "node:assert/strict";
import { normalizeIdleAdventureStateV47, IDLE_ADVENTURE_V47 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-18, en direct) : "le set que tu vois n'est pas le set
 * du tuto. Je t'ai donné son nom tout à l'heure."
 *
 * Cause confirmée en direct sur le compte de Norman (Network live) :
 * urlImageObjetAdventureIdleV138_ (Soreal_Idle_UI.html) construit l'URL
 * d'image R2 à partir de item.name -- "head" (Cloth Hat, créé après le
 * correctif de renommage Round 2) resolvait correctement en
 * name=Cloth+Hat, mais "chest"/"boots" (déjà en inventaire AVANT ce
 * correctif) montraient encore name=Training+Set+chest/boots, le vieux
 * nom générique. item() (fonction de création) applique déjà
 * SET_ITEM_NAMES_V1 -- mais seulement à la création, jamais pour un objet
 * déjà possédé. Même classe de bug que le plancher sBase du Special
 * Bonus (idle-special-bonus-floor-legacy-items.test.mjs, même jour).
 *
 * Ce test verrouille que cleanItem() (qui tourne à CHAQUE chargement de
 * sauvegarde) resynchronise le nom de TOUT objet d'équipement vers
 * SET_ITEM_NAMES_V1, quelle que soit la valeur déjà stockée.
 */

// --- Un objet legacy avec l'ancien nom générique doit être renommé au vrai nom wiki ---
{
  const legacyState = {
    version: IDLE_ADVENTURE_V47,
    inventory: [
      { id: "chest1", definitionId: "training:chest", kind: "equipment", set: "training", slot: "chest", level: 10, power: 0, toughness: 0, special: 0, name: "Training Set chest" },
      { id: "boots1", definitionId: "training:boots", kind: "equipment", set: "training", slot: "boots", level: 10, power: 0, toughness: 0, special: 0, name: "Training Set boots" }
    ]
  };
  const normalized = normalizeIdleAdventureStateV47(legacyState);
  const chest = normalized.inventory.find((i) => i.id === "chest1");
  const boots = normalized.inventory.find((i) => i.id === "boots1");
  assert.equal(chest.name, "Chemise en tissu", "Un objet legacy 'Training Set chest' doit être resynchronisé vers le libellé français à chaque chargement.");
  assert.equal(boots.name, "Bottes en tissu", "Un objet legacy 'Training Set boots' doit être resynchronisé vers le libellé français à chaque chargement.");
}

// --- Un objet déjà correctement nommé (créé après le correctif) n'est jamais modifié ---
{
  const state = {
    version: IDLE_ADVENTURE_V47,
    inventory: [
      { id: "head1", definitionId: "training:head", kind: "equipment", set: "training", slot: "head", level: 10, power: 0, toughness: 0, special: 0, name: "Chapeau en tissu" }
    ]
  };
  const normalized = normalizeIdleAdventureStateV47(state);
  const head = normalized.inventory.find((i) => i.id === "head1");
  assert.equal(head.name, "Chapeau en tissu", "Un objet déjà correctement nommé ne doit jamais changer.");
}

// --- Un objet SPECIALS (jamais concerné par SET_ITEM_NAMES_V1) garde son propre nom ---
{
  const state = {
    version: IDLE_ADVENTURE_V47,
    inventory: [
      { id: "cube1", definitionId: "tutorialCube", kind: "cube", level: 0, power: 0, toughness: 0, special: 0, name: "Tutorial Cube" }
    ]
  };
  const normalized = normalizeIdleAdventureStateV47(state);
  const cube = normalized.inventory.find((i) => i.id === "cube1");
  assert.equal(cube.name, "Tutorial Cube", "Un objet SPECIALS ne doit jamais être touché par la resynchronisation SET_ITEM_NAMES_V1 (réservée aux objets d'équipement kind==='set').");
}

console.log("idle-legacy-item-names-resync: OK");
