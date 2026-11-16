import assert from "node:assert/strict";
import { normalizeIdleNguState, rebirthIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Lu dans le jeu (AllBeardsController::reset / addBankedLevels, build 1260, 2026-11-16) : la banque de niveaux temporaires de barbes est PAR barbe
 * (actives ou non) : bankedLevel = (long)(beardLevel x totalBankedBeardTemp), puis chaque barbe reprend SA banque au Rebirth.
 */
const ctx = { bosses: 100 };
const HOUR = 3_600_000;
function neuf() {
  const s = normalizeIdleNguState({}, ctx, 0);
  s.systems.beards.unlocked = true;
  s.systems.perks.data = { levels: { 46: 10, 47: 10 } };   /* 20 % */
  return s;
}

{
  const s = neuf();
  s.systems.beards.data.tracks.attack.tempLevel = 1005;
  s.systems.beards.data.tracks.drop.tempLevel = 99;
  s.systems.beards.data.tracks.adventure.tempLevel = 7;
  const r = rebirthIdleNguState(s, ctx, HOUR);
  assert.deepEqual(r.bank.beards, { attack: 201, drop: 19, adventure: 1 }, "floor(1005 x 0,2), floor(99 x 0,2), floor(7 x 0,2)");
  assert.equal(r.systems.beards.data.tracks.attack.tempLevel, 201, "chaque barbe reprend SA banque");
  assert.equal(r.systems.beards.data.tracks.drop.tempLevel, 19);
  assert.equal(r.systems.beards.data.tracks.adventure.tempLevel, 1);
  assert.equal(r.systems.beards.data.tracks.ngu.tempLevel, 0);
}
{
  /* Ancien format (un seul nombre) : rattache a la 1re barbe active. */
  const s = neuf();
  s.bank.beards = 40;
  const r = normalizeIdleNguState(JSON.parse(JSON.stringify(s)), ctx, 0);
  assert.equal(typeof r.bank.beards, "object");
  assert.equal(Object.values(r.bank.beards).reduce((a, b) => a + b, 0), 40);
}
console.log("idle-banque-barbes-par-barbe-v1: OK");
