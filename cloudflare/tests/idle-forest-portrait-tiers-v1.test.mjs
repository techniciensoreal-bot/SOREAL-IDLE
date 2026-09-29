import assert from "node:assert/strict";
import { createIdleAdventureStateV47, applyIdleAdventureActionV47, idleAdventureEquipItemV1, idleAdventureUnequipItemV1 } from "../src/idle-adventure-v47.js";
import { idlePortraitForEquippedSetV1, idlePortraitsSnapshotV1, idlePortraitUnlockedV1, idlePortraitByIdV1 } from "../src/idle-portraits-v1.js";

/*
 * Norman (2026-09-29) : « Le set de la fôret, affiche l'image
 * idle/player/Portrait_PlayerAPportrait19.webp. Je voudrais qu'une fois que
 * les 5 pièces soient montées au niveau 50 mini, ce soit l'image
 * idle/player/Portrait_PlayerAPportrait20.png qui soit utilisée. Une fois
 * que les 5 pièces sont au niveau 100, il faut l'image
 * idle/player/Portrait_PlayerAPportrait21.png »
 */
function equiper(s, definitions) {
  for (const [def, niveau] of definitions) {
    s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: def, level: niveau }, {}, Date.now()).state;
    const o = s.inventory.filter((x) => x.definitionId === def).at(-1);
    idleAdventureEquipItemV1(s, o.id, def.split(":")[1]);
  }
  return s;
}
function nouvelEtat(definitions) {
  return equiper(createIdleAdventureStateV47(), definitions);
}

// --- État moteur : autoPortraitTier = le plus petit niveau parmi les 5 pièces Forest équipées ---
{
  const bas = nouvelEtat([["forest:head", 1], ["forest:chest", 37], ["forest:legs", 100], ["forest:boots", 5], ["forest:weapon", 1]]);
  assert.equal(bas.autoPortraitSet, "forest");
  assert.equal(bas.autoPortraitTier, 1, "le maillon faible (niveau 1) fixe le palier, pas la moyenne ni le max");

  const cinquante = nouvelEtat([["forest:head", 50], ["forest:chest", 50], ["forest:legs", 99], ["forest:boots", 50], ["forest:weapon", 50]]);
  assert.equal(cinquante.autoPortraitTier, 50);

  const cent = nouvelEtat([["forest:head", 100], ["forest:chest", 100], ["forest:legs", 100], ["forest:boots", 100], ["forest:weapon", 100]]);
  assert.equal(cent.autoPortraitTier, 100);

  // Un set neuf (état de base) : tier 0.
  assert.equal(createIdleAdventureStateV47().autoPortraitTier, 0);

  // Un autre set (sans variante à seuil) obtient aussi un tier, mais il n'a aucun effet (une seule entrée pour lui).
  const training = nouvelEtat([["training:head", 12], ["training:chest", 12], ["training:legs", 12], ["training:boots", 12], ["training:weapon", 12]]);
  assert.equal(training.autoPortraitTier, 12);
}

// --- Portrait automatique : bascule au bon palier ---
assert.equal(idlePortraitForEquippedSetV1("forest").id, "forest", "sans tier (0) : portrait de base, comportement historique inchangé");
assert.equal(idlePortraitForEquippedSetV1("forest", 0).id, "forest");
assert.equal(idlePortraitForEquippedSetV1("forest", 49).id, "forest", "en dessous de 50 : toujours le portrait de base");
assert.equal(idlePortraitForEquippedSetV1("forest", 50).id, "forest-bonus-1", "50 pile : bonus 1");
assert.equal(idlePortraitForEquippedSetV1("forest", 99).id, "forest-bonus-1", "entre 50 et 100 : toujours bonus 1");
assert.equal(idlePortraitForEquippedSetV1("forest", 100).id, "forest-bonus-2", "100 : bonus 2");
// Les autres sets n'ont qu'une entrée : le tier n'a aucun effet sur eux.
assert.equal(idlePortraitForEquippedSetV1("training", 0).id, "training");
assert.equal(idlePortraitForEquippedSetV1("training", 100).id, "training");

// --- Bout en bout : idlePortraitsSnapshotV1 propage bien equippedSetTier vers le portrait automatique ---
{
  const snapBase = idlePortraitsSnapshotV1("default", { equippedSet: "forest", equippedSetTier: 0, completedSets: {} });
  assert.equal(snapBase.auto.file, "PlayerAPportrait19");

  const snap50 = idlePortraitsSnapshotV1("default", { equippedSet: "forest", equippedSetTier: 50, completedSets: {} });
  assert.equal(snap50.auto.id, "forest-bonus-1");
  assert.equal(snap50.auto.file, "PlayerAPportrait20");

  const snap100 = idlePortraitsSnapshotV1("default", { equippedSet: "forest", equippedSetTier: 100, completedSets: {} });
  assert.equal(snap100.auto.id, "forest-bonus-2");
  assert.equal(snap100.auto.file, "PlayerAPportrait21");
}

// --- Le déblocage manuel dans la galerie reste inchangé : les 2 bonus restent choisissables dès le set complété, peu importe le niveau ---
{
  const env = { completedSets: { forest: true } };
  assert.equal(idlePortraitUnlockedV1(idlePortraitByIdV1("forest-bonus-1"), env), true, "déblocage galerie inchangé : pas de condition de niveau");
  assert.equal(idlePortraitUnlockedV1(idlePortraitByIdV1("forest-bonus-2"), env), true);
  assert.equal(idlePortraitUnlockedV1(idlePortraitByIdV1("forest-bonus-1"), { completedSets: {} }), false, "set Forest non complété : toujours verrouillé");
}

// --- Retirer une pièce garde le set ET le palier mémorisés (même « collant » que le set) ---
{
  let s = nouvelEtat([["forest:head", 100], ["forest:chest", 100], ["forest:legs", 100], ["forest:boots", 100], ["forest:weapon", 100]]);
  assert.equal(s.autoPortraitTier, 100);
  idleAdventureUnequipItemV1(s, s.equipment.head);
  assert.equal(s.autoPortraitSet, "forest", "le set reste mémorisé après retrait d'une pièce");
  assert.equal(s.autoPortraitTier, 100, "le palier reste mémorisé lui aussi, jamais réinitialisé à 0");
}

console.log("idle-forest-portrait-tiers-v1: OK");
