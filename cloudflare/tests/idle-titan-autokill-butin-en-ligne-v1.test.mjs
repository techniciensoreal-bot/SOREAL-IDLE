import assert from "node:assert/strict";
import { applyIdleNguAction, advanceIdleNguState, normalizeIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-10-11) : « on garde l'auto kill hors ligne comme celui du Wiki : il donne l'EXP, l'Or, AP, PP, QP. Mais l'auto kill EN LIGNE doit donner les loots. »
 * En ligne = synchro courte (moins de 5 minutes) ; hors ligne = rattrapage plus long, jamais d'objet.
 */
const ctx = { bosses: 300, adventurePower: 5000, adventureToughness: 5000, difficulty: "extreme" };
function depart() {
  let s = normalizeIdleNguState(null, ctx, 1000);
  s.difficulty = "extreme";
  s = applyIdleNguAction(s, { action: "adventure", adventure: { action: "setAutoKillTitan", id: "t1", enabled: true } }, ctx, 1000).state;
  return s;
}
const objets = (s) => s.adventure.inventory.length + Object.keys(s.adventure.unlockItems || {}).filter((k) => s.adventure.unlockItems[k]).length;

// EN LIGNE : une synchro de 60 s, GRB prêt : kill, récompenses ET butin
{
  const s0 = depart();
  const avant = objets(s0);
  const s = advanceIdleNguState(s0, 60, ctx, 1000 + 60_000);
  assert.ok(s.adventure.titans.t1.kills >= 1, "GRB est vaincu");
  assert.ok(s.adventure.permanent.experience > 0 && s.adventure.permanent.gold > 0, "EXP et Or crédités");
  assert.ok(objets(s) > avant, "butin reçu en ligne (objets : " + avant + " -> " + objets(s) + ")");
  assert.ok(s.adventure.dernierButinAutoKill && s.adventure.dernierButinAutoKill.id === "t1", "dernier butin mémorisé");
}
// HORS LIGNE : un rattrapage de 10 jours : EXP, Or, AP, PP, QP seulement, aucun objet
{
  const s0 = depart();
  const avant = objets(s0);
  const dix = 10 * 24 * 3600;
  const s = advanceIdleNguState(s0, dix, ctx, 1000 + dix * 1000);
  assert.ok(s.adventure.titans.t1.kills >= 200, "kills réguliers hors ligne");
  assert.ok(s.adventure.permanent.experience > 0 && s.adventure.permanent.ap > 0 && s.adventure.permanent.gold > 0, "récompenses créditées");
  assert.equal(objets(s), avant, "aucun objet hors ligne (wiki : no items drop while you are offline)");
  assert.equal(s.adventure.dernierButinAutoKill, undefined);
}
console.log("idle-titan-autokill-butin-en-ligne-v1: OK");
