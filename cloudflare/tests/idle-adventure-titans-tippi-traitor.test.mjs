import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/* 2026-09-25 : titans 13 (TIPPI THE TUTORIAL MOUSE) et 14 (THE TRAITOR) — pages « TIPPI… », « THE TRAITOR (titan) » et « Titans » du wiki. */
const TIPPI = { power: 4e34, toughness: 1.5e34 };
const TRAITOR = { power: 1.5e35, toughness: 4e34 };
function base(bosses, difficulty = "extreme") {
  const s = normalizeIdleNguState({}, { bosses }, 0);
  s.difficulty = difficulty;
  return s;
}
function combat(s, id, stats, bosses, t = 1000) {
  return applyIdleNguAction(s, { action: "adventure", adventure: { action: "titan", titan: id, difficulty: "easy", stats } }, { bosses }, t);
}
function titansVus(s, bosses) {
  return (idleNguSnapshot(s, { bosses }, 0).adventure?.titans || []).map((t) => t.id);
}

// Anti-spoil : ni Tippi ni le Traitor dans la liste tant que le boss requis n'est pas battu
{
  const s = base(295);
  assert.equal(titansVus(s, 295).includes("tippi"), false);
  assert.equal(titansVus(s, 295).includes("traitor"), false);
  assert.throws(() => combat(s, "tippi", TIPPI, 295), /TITAN_VERROUILLE/);
  assert.equal(titansVus(base(296), 296).includes("tippi"), true, "Tippi apparaît au boss 296");
  assert.equal(titansVus(base(300), 300).includes("traitor"), false, "le Traitor reste caché tant que Tippi n'est pas tué");
}

// Tippi : Sadistic seulement, seuils 4E+34 / 1,5E+34, aucune récompense publiée
{
  assert.throws(() => combat(base(300, "difficile"), "tippi", TIPPI, 300), /DIFFICULTE_SADISTIC_REQUISE/);
  assert.throws(() => combat(base(300), "tippi", { power: 3.9e34, toughness: 1.5e34 }, 300), /PUISSANCE_INSUFFISANTE/);
  const r = combat(base(300), "tippi", TIPPI, 300);
  assert.equal(r.result.experience, 0);
  assert.equal(r.result.gold, 0);
  assert.equal(r.state.adventure.titans.tippi.kills, 1);
  assert.ok(r.state.adventure.titans.tippi.nextAt >= 1000 + 3600000, "respawn : plancher de 60 minutes");
  assert.equal(titansVus(r.state, 300).includes("traitor"), true, "Tippi tué : le Traitor apparaît");
}

// Le Traitor : boss 300 + Tippi tué au moins une fois ; sa mort met les Rebirths à 10 000 et pose le flag permanent
{
  const sansTippi = base(300);
  assert.throws(() => combat(sansTippi, "traitor", TRAITOR, 300), /PROGRESSION_TITAN_REQUISE/);
  let s = combat(base(300), "tippi", TIPPI, 300).state;
  assert.throws(() => combat(s, "traitor", { power: 1.4e35, toughness: 4e34 }, 300), /PUISSANCE_INSUFFISANTE/);
  s.records.totalRebirths = 12;
  const r = combat(s, "traitor", TRAITOR, 300);
  assert.equal(r.state.adventure.unlockFlags.traitorDefeated, true);
  assert.equal(r.state.records.totalRebirths, 10000);
  s = r.state;
  s.records.totalRebirths = 25000;
  assert.equal(applyIdleNguAction(s, { action: "adventure", adventure: { action: "titan", titan: "traitor", stats: TRAITOR } }, { bosses: 300 }, 1e12).state.records.totalRebirths, 25000, "jamais réduit");
}
console.log("idle-adventure-titans-tippi-traitor: OK");
