import assert from "node:assert/strict";
import {
  normalizeIdleAdventureStateV47,
  applyIdleAdventureActionV47,
  idleAdventureEquipmentStatsV47,
  IDLE_ADVENTURE_SPECIALS
} from "../src/idle-adventure-v47.js";
import { normalizeIdleNguState, idleNguBonuses } from "../src/idle-ngu-progression.js";

/*
 * Audit wiki NGU 2026-09-18, PISTE 2 (Norman : "Est-ce que tu as bien
 * intégré chacune des statistiques special etc ?") -- vérifie que chaque
 * SPECIALS ci-dessus porte désormais un `sType` (le Special primaire,
 * boostable, même mécanisme que PISTE 1/tutorialCube) et, pour les objets
 * multi-Specials, un `sExtra` ([{type,base,max0,max100}]), et que l'agrégat
 * idleAdventureEquipmentStatsV47().specials rejoint réellement les
 * multiplicateurs idleNguBonuses() correspondants (energyPowerMultiplier,
 * magicCapMultiplier, magicPowerMultiplier...).
 */

// --- Données catalogue (valeurs wiki citées dans idle-adventure-v47.js) ---
{
  const tuba = IDLE_ADVENTURE_SPECIALS.tubaTime;
  assert.equal(tuba.sType, "energyPowerPct", "The Tuba of Time : Specials = Energy Power (wiki).");
  assert.equal(tuba.sBase, 5, "Energy Power Base value = 5%.");
  assert.equal(tuba.sMax, 15, "Energy Power Max stat at lvl 0 = 15%.");

  const sky = IDLE_ADVENTURE_SPECIALS.skyBall;
  assert.equal(sky.sType, "magicCapPct", "A Dragon's Left Ball : 1er Special listé = Magic Cap (wiki).");
  assert.equal(sky.sBase, 2);
  assert.equal(sky.sMax, 3);
  assert.equal(sky.sExtra?.[0]?.type, "magicPowerPct", "2e Special = Magic Power (wiki).");
  assert.equal(sky.sExtra[0].base, 20, "Magic Power Base value = 20%.");

  const cheese = IDLE_ADVENTURE_SPECIALS.cheeseGrater;
  assert.equal(cheese.sType, "dropChancePct");
  assert.deepEqual(
    cheese.sExtra.map((e) => e.type),
    ["energySpeedPct", "magicSpeedPct"],
    "Cheese Grater : 3 Specials (Drop Chance + Energy Speed + Magic Speed), wiki."
  );

  // Objets sans Special (revérifiés au navigateur, pas un oubli) : ni sType ni sExtra.
  assert.equal(IDLE_ADVENTURE_SPECIALS.wanderersCane.sType, undefined, "Wanderer's Cane : aucun Special sur sa fiche wiki.");
  assert.equal(IDLE_ADVENTURE_SPECIALS.ringOfApathy.sType, undefined, "Ring of Apathy : aucun Special sur sa fiche wiki.");
}

// --- Agrégat idleAdventureEquipmentStatsV47 : équiper Tuba of Time + A Dragon's Left Ball ---
function equipSpecial(adv, definitionId, ctx) {
  let r = applyIdleAdventureActionV47(adv, { action: "addItem", definitionId, level: 0 }, ctx, 1);
  adv = r.state;
  const it = adv.inventory.find((i) => i.definitionId === definitionId);
  r = applyIdleAdventureActionV47(adv, { action: "equip", id: it.id, slot: "accessory" }, ctx, 1);
  return r.state;
}

let adv = normalizeIdleAdventureStateV47({});
const ctx = { bosses: 100 };
adv = equipSpecial(adv, "tubaTime", ctx);
adv = equipSpecial(adv, "skyBall", ctx);

{
  const stats = idleAdventureEquipmentStatsV47(adv);
  assert.equal(stats.specials.energyPowerPct, 5, "Tuba of Time équipé, non boosté : Energy Power = sa Base value wiki (5%).");
  assert.equal(stats.specials.magicCapPct, 2, "A Dragon's Left Ball équipé, non boosté : Magic Cap = sa Base value wiki (2%), Special primaire.");
  assert.equal(stats.specials.magicPowerPct, 20, "A Dragon's Left Ball : Magic Power (2e Special, sExtra) = sa Base value wiki (20%), non boostable individuellement.");
  assert.equal(stats.specialsByType.energyPowerPct, 5, "specialsByType expose le même agrégat que specials.<type>Pct.");
}

// --- Ces mêmes agrégats rejoignent réellement idleNguBonuses() (energyPowerMultiplier/magicCapMultiplier/magicPowerMultiplier) ---
{
  const emptyState = normalizeIdleNguState({}, {}, Date.now());
  const before = idleNguBonuses(emptyState);

  const gearedState = normalizeIdleNguState({}, {}, Date.now());
  gearedState.adventure = adv;
  const after = idleNguBonuses(gearedState);

  assert.ok(
    Math.abs(after.energyPowerMultiplier / before.energyPowerMultiplier - 1.05) < 1e-9,
    "energyPowerMultiplier doit gagner exactement +5% (Tuba of Time, Energy Power) une fois l'objet équipé."
  );
  assert.ok(
    Math.abs(after.magicCapMultiplier / before.magicCapMultiplier - 1.02) < 1e-9,
    "magicCapMultiplier doit gagner exactement +2% (A Dragon's Left Ball, Magic Cap primaire)."
  );
  assert.ok(
    Math.abs(after.magicPowerMultiplier / before.magicPowerMultiplier - 1.20) < 1e-9,
    "magicPowerMultiplier doit gagner exactement +20% (A Dragon's Left Ball, Magic Power en sExtra)."
  );
}

console.log("idle-specials-typed-bonuses: OK");
