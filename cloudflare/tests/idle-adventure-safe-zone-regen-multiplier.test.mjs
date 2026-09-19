import assert from "node:assert/strict";
import { idleAdventureEquipmentStatsV47, IDLE_ADVENTURE_V47 } from "../src/idle-adventure-v47.js";

/*
 * Wiki NGU — Adventure Mode, Safe Zone: Awakening Site :
 * régénération HP x5 dans la Safe Zone, x10 avec le bonus du set GRB.
 *
 * Cette couche serveur ne doit cependant exposer que la régénération
 * canonique issue de l'équipement/set. Le multiplicateur de zone dépend
 * de selectedZone et est appliqué par le moteur de repos côté client :
 * cela évite de figer un bonus de zone dans stats.regen et de le compter
 * deux fois lors d'un changement de zone instantané.
 */

{
  const stats = idleAdventureEquipmentStatsV47({
    version: IDLE_ADVENTURE_V47,
    selectedZone: "tutorial",
    setRewards: { adventureRegen: 3 }
  });
  assert.equal(stats.regen, 3);
}

{
  const stats = idleAdventureEquipmentStatsV47({
    version: IDLE_ADVENTURE_V47,
    selectedZone: "safe",
    setRewards: { adventureRegen: 3 }
  });
  assert.equal(stats.regen, 3, "stats.regen reste canonique ; le x5 Safe Zone est appliqué par la couche de repos.");
}

{
  const stats = idleAdventureEquipmentStatsV47({
    version: IDLE_ADVENTURE_V47,
    selectedZone: "safe",
    setRewards: { adventureRegen: 3, safeZoneRegen10x: true }
  });
  assert.equal(stats.regen, 3, "Le flag GRB est exposé séparément ; le x10 ne doit pas être pré-appliqué à stats.regen.");
  assert.equal(stats.setRewards.safeZoneRegen10x, true);
}

{
  const stats = idleAdventureEquipmentStatsV47({ version: IDLE_ADVENTURE_V47 });
  assert.equal(stats.regen, 0);
}

console.log("idle-adventure-safe-zone-regen-multiplier: OK");
