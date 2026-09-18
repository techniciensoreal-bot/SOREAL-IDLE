import assert from "node:assert/strict";
import { normalizeIdleAdventureStateV47, idleAdventureSnapshotV47, IDLE_ADVENTURE_V47 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-18, en direct, capture d'écran de son propre Tutorial
 * Cube) : "je vois que mon tutorial cube n'a toujours pas de stats
 * special. Tu n'as rien fait ?"
 *
 * Cause confirmée en deux parties :
 * 1) special() (création d'un objet) fixe déjà special=d.sBase (PISTE 1,
 *    2026-09-18) -- mais cleanItem() (qui tourne à CHAQUE chargement de
 *    sauvegarde) ne plafonnait .special que VERS LE BAS (Math.min contre
 *    d.sBase*q). Un Tutorial Cube déjà en inventaire AVANT ce correctif
 *    gardait donc .special=0 pour toujours, sans jamais bénéficier
 *    rétroactivement du plancher -- contrairement au principe déjà
 *    appliqué ailleurs ("tout objet déjà possédé en bénéficie
 *    immédiatement, sans migration de save").
 * 2) idleAdventureSnapshotV47 n'exposait ni specialType (label wiki, ex.
 *    "energySpeedPct") ni baseSpecial (plafond au niveau 0) par objet --
 *    seul un nombre brut item.special sans aucun label ni plafond était
 *    exploitable côté client.
 *
 * Ce test verrouille les deux : un vieux Tutorial Cube à .special=0 doit
 * remonter à sBase(5) au chargement, et le snapshot doit exposer
 * specialType/baseSpecial pour que le client puisse afficher "Energy
 * Speed: 5/15" plutôt que rien du tout.
 */

// --- 1) Legacy item (.special=0, comme avant le correctif sBase) doit remonter à sBase ---
{
  const legacyState = {
    version: IDLE_ADVENTURE_V47,
    inventory: [
      { id: "cube1", definitionId: "tutorialCube", kind: "cube", level: 0, power: 0, toughness: 0, special: 0 }
    ]
  };
  const normalized = normalizeIdleAdventureStateV47(legacyState);
  const cube = normalized.inventory.find((i) => i.id === "cube1");
  assert.ok(cube, "Le Tutorial Cube legacy doit survivre à la normalisation.");
  assert.equal(cube.special, 5, "Un Tutorial Cube dont .special=0 (donnée antérieure au correctif sBase) doit remonter au plancher réel sBase=5 (wiki), jamais rester bloqué à 0.");
}

// --- 2) Un objet DÉJÀ boosté au-dessus de sBase ne doit jamais être touché (le plancher ne descend jamais une vraie valeur) ---
{
  const boostedState = {
    version: IDLE_ADVENTURE_V47,
    inventory: [
      { id: "cube2", definitionId: "tutorialCube", kind: "cube", level: 0, power: 0, toughness: 0, special: 9 }
    ]
  };
  const normalized = normalizeIdleAdventureStateV47(boostedState);
  const cube = normalized.inventory.find((i) => i.id === "cube2");
  assert.equal(cube.special, 9, "Un Tutorial Cube déjà boosté au-dessus de sBase (9 > 5) ne doit jamais être modifié par le plancher.");
}

// --- 3) Le snapshot expose specialType et baseSpecial pour le Tutorial Cube ---
{
  const state = {
    version: IDLE_ADVENTURE_V47,
    inventory: [
      { id: "cube3", definitionId: "tutorialCube", kind: "cube", level: 0, power: 0, toughness: 0, special: 5 }
    ]
  };
  const snap = idleAdventureSnapshotV47(state, 100);
  const cube = snap.inventory.find((i) => i.id === "cube3");
  assert.ok(cube, "Le Tutorial Cube doit apparaître dans le snapshot.");
  assert.equal(cube.specialType, "energySpeedPct", "specialType doit exposer le vrai type wiki (energySpeedPct) pour que le client puisse afficher le bon label (Energy Speed).");
  assert.equal(cube.baseSpecial, 15, "baseSpecial doit exposer le plafond au niveau 0 (sMax=15, wiki) -- même convention que basePower/baseToughness, pour que le client calcule baseSpecial*q comme plafond réel.");
}

// --- 4) Un objet sans Special Bonus chiffré (ex. un équipement classique) n'expose jamais de specialType ---
{
  const state = {
    version: IDLE_ADVENTURE_V47,
    inventory: [
      { id: "w1", definitionId: "forest:weapon", kind: "equipment", set: "forest", slot: "weapon", level: 50, power: 0, toughness: 0, special: 0 }
    ]
  };
  const snap = idleAdventureSnapshotV47(state, 100);
  const weapon = snap.inventory.find((i) => i.id === "w1");
  assert.ok(weapon, "L'arme doit apparaître dans le snapshot.");
  assert.equal(weapon.specialType, undefined, "Un objet d'équipement classique (jamais un SPECIALS) ne doit jamais exposer de specialType inventé.");
}

console.log("idle-special-bonus-floor-legacy-items: OK");
