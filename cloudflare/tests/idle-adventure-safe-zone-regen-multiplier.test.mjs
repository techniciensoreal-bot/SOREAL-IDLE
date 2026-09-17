import assert from "node:assert/strict";
import { idleAdventureEquipmentStatsV47, IDLE_ADVENTURE_V47 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-18), confirmé en jouant au vrai jeu : "Le bonus x5 de la
 * regen ne s'applique qu'aux bonus fournis par les équipements... dans le
 * vrai jeu on est à 1/s sans stuff dans la safe zone ou non en aventure."
 * Wiki NGU (page locale "Adventure Mode", tableau Zones, ligne "1. Safe
 * Zone: Awakening Site") : "5x HP Regeneration in zone / 10x with GRB's
 * set bonus" — un multiplicateur documenté, jamais appliqué jusqu'ici
 * (setRewards.safeZoneRegen10x existait déjà dans la définition du set GRB
 * mais n'était lu nulle part). Ce test couvre uniquement le multiplicateur
 * lui-même (part équipement, ici setRewards.adventureRegen comme proxy —
 * même chemin de calcul que equippedRegen, tous deux sommés avant d'être
 * multipliés) ; le plancher de base à 1/s (zone-agnostique) est couvert
 * séparément par idle-adventure-regen-floor-one.test.mjs.
 */

// Bonus d'équipement (setRewards.adventureRegen), hors Safe Zone : pas de multiplicateur.
{
  const stats = idleAdventureEquipmentStatsV47({ version: IDLE_ADVENTURE_V47, selectedZone: "tutorial", setRewards: { adventureRegen: 3 } });
  assert.equal(stats.regen, 3, "Hors Safe Zone, regen d'équipement reste 3, sans multiplicateur.");
}

// Même bonus, en Safe Zone (valeur par défaut de selectedZone) : x5.
{
  const stats = idleAdventureEquipmentStatsV47({ version: IDLE_ADVENTURE_V47, setRewards: { adventureRegen: 3 } });
  assert.equal(stats.regen, 15, "En Safe Zone, regen d'équipement = 3 x5 = 15.");
}

// Même bonus, en Safe Zone, avec le bonus de set GRB (safeZoneRegen10x) : x10.
{
  const stats = idleAdventureEquipmentStatsV47({ version: IDLE_ADVENTURE_V47, setRewards: { adventureRegen: 3, safeZoneRegen10x: true } });
  assert.equal(stats.regen, 30, "En Safe Zone avec le bonus GRB, regen d'équipement = 3 x10 = 30.");
}

// Aucun bonus d'équipement, Safe Zone : 0 x multiplicateur reste 0 (le plancher
// à 1/s est ajouté plus loin par idleAdventureCombatStatsV1, hors du périmètre
// de idleAdventureEquipmentStatsV47 — voir idle-adventure-regen-floor-one.test.mjs).
{
  const stats = idleAdventureEquipmentStatsV47({ version: IDLE_ADVENTURE_V47 });
  assert.equal(stats.regen, 0, "Sans bonus d'équipement, la part équipement de la regen reste 0 (le plancher 1/s est ajouté ailleurs).");
}

console.log("idle-adventure-safe-zone-regen-multiplier: OK");
