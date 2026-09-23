import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * 2026-09-23 (wiki Beards of Power) : plusieurs Beards actives selon les slots (1 + Troll 4 + EXP 50 000 + Sellout x4) ;
 * les Beards de même ressource se ralentissent (diviseur = nombre actif, x0,9 avec Beardverse).
 */
const ctx = { bosses: 100 };
function base() {
  let s = normalizeIdleNguState({}, ctx, 1_000_000);
  s.systems.beards.unlocked = true;
  s.resources.energy.power = 100; s.resources.energy.bars = 100;
  s.resources.magic.power = 100; s.resources.magic.bars = 100;
  return s;
}
const select = (s, track) => applyIdleNguAction(s, { action: "selectTrack", system: "beards", track }, ctx, 1_000_000).state;

{
  let s = base();
  s = select(s, "drop");
  s = select(s, "ngu"); // un seul slot : remplace la première
  const snap = idleNguSnapshot(s, ctx, 1_000_000);
  const actives = snap.systems.find(x => x.id === "beards").tracks.filter(t => t.active).map(t => t.id);
  assert.deepEqual(actives, ["ngu"], "1 slot : la sélection remplace la Beard active");
}
{
  let s = base();
  s.challenge.completions.troll = 4; // +1 slot
  s = select(s, "drop");
  s = select(s, "ngu");
  const snap = idleNguSnapshot(s, ctx, 1_000_000);
  const actives = snap.systems.find(x => x.id === "beards").tracks.filter(t => t.active).map(t => t.id).sort();
  assert.deepEqual(actives, ["drop", "ngu"]);
  s = select(s, "ngu"); // retirer
  assert.deepEqual(s.systems.beards.data.activeTracks, ["drop"]);
}
{
  // deux Beards Energy (drop, ngu) : chacune deux fois plus lente qu'une Beard seule
  const seule = base();
  let a = select(seule, "drop");
  a = advanceIdleNguState(a, 100, ctx, 1_100_000);
  let b = base();
  b.challenge.completions.troll = 4;
  b = select(select(b, "drop"), "ngu");
  b = advanceIdleNguState(b, 100, ctx, 1_100_000);
  const pa = a.systems.beards.data.tracks.drop.progress + a.systems.beards.data.tracks.drop.tempLevel;
  const pb = b.systems.beards.data.tracks.drop.progress + b.systems.beards.data.tracks.drop.tempLevel;
  assert.ok(Math.abs(pb / pa - 0.5) < 1e-6, "diviseur Beards_SameResource = 2 : " + pb / pa);
}
console.log("idle-beards-multi-slots ok");
