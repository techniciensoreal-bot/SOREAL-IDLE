import assert from "node:assert/strict";
import { normalizeIdleNguState } from "../src/idle-ngu-progression.js";
import { macguffinOnTitanKillV1, macguffinDropLevelV1 } from "../src/idle-macguffins-v1.js";

/*
 * Lu dans le jeu (LootDrop::titanLevelBonus, build 1260, 2026-11-16) : le MacGuffin ALÉATOIRE d'un titan gagne +1 niveau
 * si le No Rebirth Challenge est complété au moins une fois ; le 291 du Nerd (dropMacguffin(291, 0)) non.
 */
const ctx = { bosses: 120 };
function neuf(noRebirth) {
  const s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, 1_000_000_000);
  s.adventure.unlockFlags.walderpFinalDefeated = true;
  s.systems.macguffins.unlocked = true;
  s.challenge.completions.noRebirth = noRebirth;
  return s;
}
const rng = () => 0;
{
  const s = neuf(0);
  const d = macguffinOnTitanKillV1(s, "nerd", "easy", 1, rng);
  assert.deepEqual(d.map(f => f.level), [macguffinDropLevelV1(s), macguffinDropLevelV1(s)], "sans défi : niveau de base");
}
{
  const s = neuf(1);
  const base = macguffinDropLevelV1(s);
  const d = macguffinOnTitanKillV1(s, "nerd", "easy", 1, rng);
  assert.equal(d.length, 2);
  const adventure = d.find(f => f.type === "adventure");
  const aleatoire = d.find(f => f.type !== "adventure");
  assert.equal(adventure.level, base, "le 291 du Nerd ne reçoit pas le bonus");
  assert.equal(aleatoire.level, base + 1, "le MacGuffin aléatoire reçoit +1 niveau");
}

console.log("idle-macguffins-titan-niveau-v1: OK");
