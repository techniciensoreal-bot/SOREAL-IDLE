import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { macguffinOnZoneKillsV1, macguffinOnItopodKillsV1 } from "../src/idle-macguffins-v1.js";

/*
 * Vérification 2026-09-24 : le Purple Heart (set) est bien branché dans les drops réels de
 * MacGuffins, pas seulement dans le calcul du seuil. Page My Purple Heart : « reduces the time it
 * takes to obtain MacGuffins from any source by 20% » ; page MacGuffin Fragments, « Minimum kills
 * required per MacGuffin Fragment with all bonuses : Adventure zone 720, ITOPOD 1,800 » (1 800 =
 * 5 000 x 0,8 x 0,75 x 0,75 x 0,8 : le cœur compte aussi à l'ITOPOD).
 */
const ctx = { bosses: 200 };
const T0 = 1_000_000;
function etat(coeurNiveau) {
  let s = normalizeIdleNguState({}, ctx, T0);
  if (coeurNiveau !== null) s = applyIdleNguAction(s, { action: "adventure", adventure: { action: "addItem", definitionId: "heartPurple", level: coeurNiveau } }, ctx, T0).state;
  s.systems.macguffins.unlocked = true;
  s.systems.perks.data = Object.assign({}, s.systems.perks.data, { levels: { 68: 1 } });
  return s;
}

// Zone : 800 kills suffisent avec le cœur au niveau 100, pas au niveau 99.
{
  const avec = etat(100);
  assert.equal(macguffinOnZoneKillsV1(avec, "sewers", 799).length, 0);
  const drops = macguffinOnZoneKillsV1(avec, "sewers", 1);
  assert.equal(drops.length, 1, "800e kill : fragment de The Sewers");
  assert.equal(drops[0].type, "energyPower");
  assert.equal(macguffinOnZoneKillsV1(etat(99), "sewers", 800).length, 0, "cœur niveau 99 : il faut 1 000 kills");
}

// ITOPOD (perk 68) : 4 000 kills avec le cœur, 5 000 sans.
{
  assert.equal(macguffinOnItopodKillsV1(etat(100), 4000, () => 0).length, 1);
  assert.equal(macguffinOnItopodKillsV1(etat(null), 4000, () => 0).length, 0);
  assert.equal(macguffinOnItopodKillsV1(etat(null), 5000, () => 0).length, 1);
}

console.log("idle-macguffins-purple-heart-drops: OK");
