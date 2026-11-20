import assert from "node:assert/strict";
import { normalizeIdleAdventureStateV47, advanceAdventureZoneAutoFarmOfflineV1 } from "../src/idle-adventure-v47.js";

/* 2026-11-20 : le farm hors ligne attendait 4 s fixes entre deux monstres ; le jeu (AdventureController::respawnTime) et le combat en ligne appliquent la réduction de réapparition. */
function kills(reduction) {
  let g = 12345; Math.random = () => (g = (g * 1103515245 + 12345) % 2147483648) / 2147483648; /* tirages fixes : seul le délai change */
  const s = normalizeIdleAdventureStateV47({});
  s.lastCombatZone = "tutorial"; s.selectedZone = "tutorial"; s.zone.encounters.tutorial = 1;
  const r = advanceAdventureZoneAutoFarmOfflineV1(s, { bosses: 4, respawnReduction: reduction, stats: { power: 1e9, toughness: 1e9, hp: 1e9, regen: 100 } }, 60, 1000);
  return r.kills;
}
const sans = kills(0), avec = kills(0.5);
assert.ok(sans > 0, "le farm tue des monstres");
assert.ok(avec > sans, "une réduction de réapparition de 50 % augmente le nombre de monstres tués (" + sans + " -> " + avec + ")");
console.log("ok");
