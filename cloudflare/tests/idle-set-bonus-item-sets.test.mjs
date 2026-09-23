import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  advanceIdleNguState,
  applyIdleNguAction,
  idleNguBonuses
} from "../src/idle-ngu-progression.js";
import { IDLE_ADVENTURE_ITEM_SETS_V1, IDLE_ADVENTURE_SPECIALS } from "../src/idle-adventure-v47.js";

/*
 * Audit des bonus de complétion (2026-09-23) : sets d'objets hors équipement
 * (SETS_OBJETS_V1), miroir NGU-Wiki pages "Pissed Off Key (set)", "Wandoos
 * (set)", "Normal Bonus Accs (set)". Compléter le set = chaque objet au niveau
 * 100 ; le bonus doit alors entrer dans le bon multiplicateur.
 */

const ajouter = (s, definitionId, level = 100, now = 1) =>
  applyIdleNguAction(s, { action: "adventure", adventure: { action: "addItem", definitionId, level } }, {}, now).state;

// Chaque objet référencé existe bien dans SPECIALS.
for (const [id, set] of Object.entries(IDLE_ADVENTURE_ITEM_SETS_V1)) {
  for (const defId of set.items) assert.ok(IDLE_ADVENTURE_SPECIALS[defId], `${id} : objet ${defId} présent dans SPECIALS`);
}

// ---------- Pissed Off Key (set) : +10 % de progression de PP dans l'ITOPOD ----------
{
  const tourUnKill = (s) => {
    s.difficulty = "normal";
    s.systems.tower = { unlocked: true, active: true, data: { floor: 0, killProgress: 0, kills: 0, ppProgress: 0 } };
    return advanceIdleNguState(s, 6, { adventurePower: 1e6, adventureToughness: 1e6, bosses: 30 }, Date.now());
  };
  let temoin = normalizeIdleNguState({}, {}, 0);
  temoin = ajouter(temoin, "pissedOffKey", 99);
  assert.equal(temoin.adventure.completedSets.pissedOffKey, undefined, "niveau 99 : set pas encore complété");
  const ppTemoin = tourUnKill(temoin).systems.tower.data.ppProgress;

  let s = normalizeIdleNguState({}, {}, 0);
  s = ajouter(s, "pissedOffKey", 100);
  assert.equal(s.adventure.completedSets.pissedOffKey, true, "Pissed Off Key niveau 100 -> set complété");
  assert.ok(Math.abs(s.adventure.setRewards.itopodPpPct - 0.1) < 1e-12);
  const pp = tourUnKill(s).systems.tower.data.ppProgress;
  assert.ok(ppTemoin > 0, "Sanity : un kill ITOPOD donne de la progression de PP");
  assert.ok(Math.abs(pp - ppTemoin * 1.1) < 1e-9, `progression de PP x1,10 (${ppTemoin} -> ${pp})`);
}

// ---------- Wandoos (set) : 300 EXP + 10 % de vitesse une fois le boot terminé ----------
{
  const context = { bosses: 58, bestGold: 1e6, adventurePower: 1e9 };
  const now = 100_000_000;
  const wandoos = (avecSet, bootTermine) => {
    let s = normalizeIdleNguState({}, context, now);
    s.adventure.unlockFlags.wandoos = true;
    s = normalizeIdleNguState(s, context, now);
    if (avecSet) {
      const xpAvant = s.currencies.experience;
      s = ajouter(s, "wandoos98", 100, now);
      assert.equal(s.adventure.completedSets.wandoos, true, "Wandoos 98 niveau 100 -> set complété");
      assert.equal(s.currencies.experience - xpAvant, 300, "300 EXP crédités à la complétion");
    }
    s.runStartedAt = now - (bootTermine ? 2 * 3600 * 1000 : 1800 * 1000);
    s.resources.energy.cap = 1e9;
    s.resources.energy.current = 1e9;
    s = applyIdleNguAction(s, { action: "allocate", system: "wandoos", resource: "energy", value: 5e8 }, context, now).state;
    return advanceIdleNguState(s, 1, context, now + 1).systems.wandoos.data;
  };
  const sansSet = wandoos(false, true);
  const avecSet = wandoos(true, true);
  assert.equal(sansSet.dumpEnergyLevel, 25, "Sanity : moitié du seuil -> 25 niveaux/s");
  assert.equal(avecSet.dumpEnergyLevel, 27, "boot terminé : 25 x 1,10 = 27,5 -> 27 niveaux");
  assert.ok(Math.abs(avecSet.dumpEnergyProgress - 0.5) < 1e-9, "reste 0,5 de progression (27,5)");
  // Pendant le boot (30 min sur 60), le bonus du set ne s'applique pas encore.
  const bootSansSet = wandoos(false, false);
  const bootAvecSet = wandoos(true, false);
  assert.equal(bootAvecSet.dumpEnergyLevel, bootSansSet.dumpEnergyLevel, "pendant le boot : aucun bonus du set");
}

// ---------- Normal Bonus Accs (set) : +25 % de drop rate ----------
{
  let s = normalizeIdleNguState({}, {}, 0);
  const avant = idleNguBonuses(s).dropMultiplier;
  const items = IDLE_ADVENTURE_ITEM_SETS_V1.normalBonusAccs.items;
  assert.equal(items.length, 13, "13 accessoires dans Normal Bonus Accs (set)");
  for (const defId of items.slice(0, 12)) s = ajouter(s, defId, 100);
  assert.equal(s.adventure.completedSets.normalBonusAccs, undefined, "12 sur 13 : pas encore complété");
  s = ajouter(s, items[12], 100);
  assert.equal(s.adventure.completedSets.normalBonusAccs, true, "13 accessoires niveau 100 -> set complété");
  assert.ok(Math.abs(s.adventure.setRewards.drop - 0.25) < 1e-12);
  assert.ok(Math.abs(idleNguBonuses(s).dropMultiplier - avant * 1.25) < 1e-9, "Drop Chance x1,25 (rien d'équipé)");
  // Sommes de Power/Toughness des 13 accessoires = "Total Stats Max" du wiki / 2 (valeur niveau 0).
  const S = IDLE_ADVENTURE_SPECIALS;
  assert.equal(items.reduce((a, id) => a + S[id].p, 0) * 2, 11450);
  assert.equal(items.reduce((a, id) => a + S[id].t, 0) * 2, 11420);
}

console.log("idle-set-bonus-item-sets: OK");
