// Norman (2026-11-02) : (1) la touche R (reprendre l'énergie allouée) laissait l'énergie des Augmentations en place ; (2) un troll qui « retire toute l'énergie / toute la magie » doit retirer AUSSI ce qui est déjà alloué, comme la touche R.
import assert from "node:assert/strict";
import { normalizeIdleNguState, advanceIdleNguState } from "../src/idle-ngu-progression.js";
import { reclaimAllocatedResource } from "../src/idle-ngu-ressources.js";

const T0 = 1_000_000_000_000;
const CONTEXTE = { bosses: 120 };
function etat() {
  const s = normalizeIdleNguState({}, CONTEXTE, T0);
  s.systems.augmentations.unlocked = true;
  s.systems.bloodMagic.unlocked = true;
  const pairs = s.systems.augmentations.data.pairs;
  const ids = Object.keys(pairs);
  assert.ok(ids.length >= 2, "des paires d'augmentations existent");
  pairs[ids[0]].energy = 4000; pairs[ids[1]].upgradeEnergy = 1500;
  s.systems.augmentations.allocation.energy = 5500;
  s.resources.energy.current = 100;
  s.resources.magic.current = 50;
  return { s, ids };
}

// 1. R reprend aussi l'énergie des Augmentations (par paire), et la somme ne la fait pas revenir au tick suivant
{
  const { s, ids } = etat();
  const r = reclaimAllocatedResource(s, "energy", {});
  assert.equal(r.released, 5500, "toute l'énergie allouée aux Augmentations est reprise");
  assert.equal(s.systems.augmentations.data.pairs[ids[0]].energy, 0);
  assert.equal(s.systems.augmentations.data.pairs[ids[1]].upgradeEnergy, 0);
  assert.equal(s.systems.augmentations.allocation.energy, 0);
  const apres = advanceIdleNguState(s, 1, CONTEXTE, T0 + 1000);
  assert.equal(apres.systems.augmentations.allocation.energy, 0, "la somme des paires reste à zéro après un tick");
}

// 2. Le troll « énergie » / « magie » vide la réserve ET les allocations (même reprise que la touche R)
{
  const { applyTrollEffectV1 } = await import("../src/idle-ngu-systemes.js");
  {
    const { s, ids } = etat();
    applyTrollEffectV1(s, "energy");
    assert.equal(s.resources.energy.current, 0, "plus d'énergie libre");
    assert.equal(s.systems.augmentations.allocation.energy, 0, "plus d'énergie allouée aux Augmentations");
    assert.equal(s.systems.augmentations.data.pairs[ids[0]].energy, 0);
    assert.equal(s.systems.augmentations.data.pairs[ids[1]].upgradeEnergy, 0);
    assert.equal(s.resources.magic.current, 50, "la magie n'est pas touchée");
  }
  {
    const { s } = etat();
    s.systems.bloodMagic.allocation.magic = 30;
    const rits = Object.values(s.systems.bloodMagic.data.rituals || {});
    if (rits[0]) rits[0].magic = 30;
    applyTrollEffectV1(s, "magic");
    assert.equal(s.resources.magic.current, 0, "plus de magie libre");
    assert.equal(s.systems.bloodMagic.allocation.magic, 0, "plus de magie allouée aux rituels");
    for (const r of rits) assert.equal(r.magic, 0);
    assert.equal(s.resources.energy.current, 100, "l'énergie n'est pas touchée");
  }
  {
    const { s } = etat();
    s.systems.bloodMagic.unlocked = false;
    assert.doesNotThrow(() => applyTrollEffectV1(s, "magic"), "magie pas encore débloquée : aucune erreur");
  }
}
console.log("idle-reprise-ressources-augmentations-troll-v1 : OK");
