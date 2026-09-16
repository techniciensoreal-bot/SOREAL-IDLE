import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_V47,
  normalizeIdleAdventureStateV47
} from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-16) : "je me retrouve avec des stats genre Toughness
 * 2/1 sur mon casque... tu dois mettre à jour les sauvegardes des
 * joueurs déjà en cours [...] tenir compte du nombre de boosts
 * réellement appliqué, ne pas remplir artificiellement les
 * statistiques."
 *
 * Conséquence directe du bug de plafond de boost (voir idle-adventure-
 * v47.test.mjs) : sous l'ancien code, applyBoost() plafonnait à
 * basePower×2 (le plafond ABSOLU, niveau 100) au lieu de basePower×
 * (1+niveau/100) (le plafond du NIVEAU COURANT) — un objet boosté SOUS
 * le niveau 100 avait donc pu accumuler une stat au-delà de ce que son
 * vrai niveau autorise. cleanItem() (appelée par
 * normalizeIdleAdventureStateV47 à CHAQUE chargement, inventaire ET
 * coffre) doit désormais corriger cet excédent automatiquement, sur
 * TOUTES les sauvegardes déjà en cours, sans action manuelle — mais
 * SEULEMENT vers le bas (jamais ajouter une valeur non gagnée) et
 * SEULEMENT l'excédent réellement illégitime.
 */

// --- training:head (baseP=0, baseT=1) boosté au-delà du plafond de son niveau doit être corrigé ---
{
  // Niveau 21 : plafond légitime = baseT×(1+21/100) = 1×1.21 = 1.21.
  // Toughness=2 ne peut venir que de l'ancien bug (plafond absolu ×2).
  const raw = {
    version: IDLE_ADVENTURE_V47,
    inventory: [{ id: "i1", definitionId: "training:head", kind: "equipment", level: 21, power: 0, toughness: 2 }]
  };
  const s = normalizeIdleAdventureStateV47(raw);
  const item = s.inventory.find(x => x.id === "i1");
  assert.ok(item, "L'objet doit survivre à la migration.");
  assert.ok(
    item.toughness < 2,
    "Toughness=2 sur un objet niveau 21 (plafond légitime 1.21) doit être réduit — c'est exactement le \"Toughness 2/1\" signalé."
  );
  assert.ok(
    Math.abs(item.toughness - 1.21) < 1e-9,
    "Toughness doit être ramené EXACTEMENT au plafond légitime du niveau courant (1.21), jamais une valeur arbitraire."
  );
}

// --- Un objet déjà dans les clous (jamais boosté au-delà de son niveau) ne doit JAMAIS être modifié ---
{
  const raw = {
    version: IDLE_ADVENTURE_V47,
    // Niveau 21 : plafond 1.21, ici toughness=1 (jamais boosté) — doit rester intact.
    inventory: [{ id: "i2", definitionId: "training:head", kind: "equipment", level: 21, power: 0, toughness: 1 }]
  };
  const s = normalizeIdleAdventureStateV47(raw);
  const item = s.inventory.find(x => x.id === "i2");
  assert.equal(item.toughness, 1, "Un objet déjà légitime ne doit jamais être modifié par la migration (jamais une valeur ajoutée artificiellement).");
}

// --- Le coffre (rangement des objets maxés) doit recevoir la même correction que l'inventaire ---
{
  const raw = {
    version: IDLE_ADVENTURE_V47,
    coffre: { "training:head": { id: "i3", definitionId: "training:head", kind: "equipment", level: 100, power: 0, toughness: 5 } }
  };
  const s = normalizeIdleAdventureStateV47(raw);
  const item = s.coffre["training:head"];
  assert.ok(item, "L'objet du coffre doit survivre à la migration.");
  assert.ok(
    Math.abs(item.toughness - 2) < 1e-9,
    "Au niveau 100 (plafond légitime = baseT×2 = 2), un excédent doit être ramené à 2, jamais laissé à une valeur impossible (5)."
  );
}

// --- Un accessoire (SPECIALS) subit la même correction, avec sa propre base ---
{
  // tutorialCube : p:7,t:7 -> baseP=baseT=7 (special, jamais divisé par 2 comme les sets).
  const raw = {
    version: IDLE_ADVENTURE_V47,
    inventory: [{ id: "i4", definitionId: "tutorialCube", kind: "cube", level: 10, power: 999, toughness: 0 }]
  };
  const s = normalizeIdleAdventureStateV47(raw);
  const item = s.inventory.find(x => x.id === "i4");
  assert.ok(
    Math.abs(item.power - 7 * 1.1) < 1e-9,
    "Un accessoire (SPECIALS) boosté au-delà de son plafond de niveau doit aussi être corrigé, avec sa propre base (7), jamais celle d'un set."
  );
}

console.log("idle-adventure-item-cap-migration: OK");
