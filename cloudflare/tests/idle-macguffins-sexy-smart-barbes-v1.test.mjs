import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Lu dans le jeu (build 1260, 2026-11-16) : AllBeardsController::energyBeardSpeedFactor multiplie par
 * Inventory.macguffinBonuses[8] (SEXY), magicBeardSpeedFactor par [9] (SMART) : vitesse des barbes Energy / Magic.
 * Piste Neckbeard ("drop") = Energy, Fu Manchu ("attack") = Magic.
 */
function etat(context, piste, perm) {
  let state = normalizeIdleNguState({}, context, 1_000_000);
  state.systems.beards.unlocked = true;
  state.resources.energy.power = 100;
  state.resources.energy.bars = 100;
  state.resources.magic.power = 100;
  state.resources.magic.bars = 100;
  state.resources.magic.current = 1e12;
  state.resources.energy.current = 1e12;
  state.systems.beards.active = true; state.systems.beards.data.activeTracks = [piste]; state.systems.beards.data.activeTrack = piste;
  if (perm) state.systems.macguffins.data.permanent = perm;
  return state;
}
function progres(context, piste, perm) {
  const s = advanceIdleNguState(etat(context, piste, perm), 100, context, 1_100_000);
  const t = s.systems.beards.data.tracks[piste];
  assert.equal(t.tempLevel, 0, "sanity : pas de passage de niveau");
  assert.ok(t.progress > 0, "sanity : la piste progresse "+JSON.stringify([piste,perm,t]));
  return t.progress;
}

const context = { bosses: 100 };
{
  const r = progres(context, "drop", { sexy: 100 }) / progres(context, "drop", {});
  assert.ok(Math.abs(r - 2) < 1e-3, `SEXY +100 % double la vitesse de la barbe Energy (mesuré ${r})`);
  const rSmartSurEnergie = progres(context, "drop", { smart: 100 }) / progres(context, "drop", {});
  assert.ok(Math.abs(rSmartSurEnergie - 1) < 1e-9, "SMART n'agit pas sur une barbe Energy");
}
{
  const r = progres(context, "attack", { smart: 50 }) / progres(context, "attack", {});
  assert.ok(Math.abs(r - 1.5) < 1e-3, `SMART +50 % : x1,5 sur la barbe Magic (mesuré ${r})`);
  const rSexySurMagie = progres(context, "attack", { sexy: 50 }) / progres(context, "attack", {});
  assert.ok(Math.abs(rSexySurMagie - 1) < 1e-9, "SEXY n'agit pas sur une barbe Magic");
}

console.log("idle-macguffins-sexy-smart-barbes-v1: OK");
