import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * 2026-09-24 -- audit de composition, page « Money Pit » :
 *  « One-Time Bonuses » (TOTAL Gold Dropped, somme de tous les jets) :
 *    1E8  -> Adventure +10 Power, +10 Toughness, +100 Max Health, +1 Health Regen
 *    1E10 -> +1 Energy Bar, +1 Magic Bar
 *    1E11 -> Looty McLootFace
 *    1E12 -> +100 EXP
 *  Non implementes jusqu'ici. Chaque bonus n'est donne qu'une fois.
 *  Souhait 4 « I wish money Pit didn't suck » : niveau Wandoos du Money Pit
 *  maximal (100).
 */
const ctx = { bosses: 100 };
const H = 3600000;
let t = 1_000_000;

function pit(state, gold) {
  state.currencies.gold = gold;
  t += 1000 * H; /* recharge terminee */
  return applyIdleNguAction(state, { action: "moneyPit" }, ctx, t).state;
}

let s = normalizeIdleNguState({}, ctx, t);
s.systems.moneyPit.unlocked = true;
const perm = () => s.adventure.permanent;

s = pit(s, 5e7);
assert.ok(!(perm().adventureHp >= 100), "5E7 au total : rien encore (hors gains de palier)");
const hp0 = perm().adventureHp || 0;
const p0 = perm().adventurePower || 0;
s = pit(s, 5e7); /* total 1E8 */
/* Le palier (1E8 = palier 2 : jusqu'a +100 HP/+2 P/T possibles au tirage) s'ajoute au bonus unique : on verifie le plancher. */
assert.ok((perm().adventurePower || 0) - p0 >= 10, "+10 Power");
assert.ok((perm().adventureToughness || 0) >= 10, "+10 Toughness");
assert.ok((perm().adventureHp || 0) - hp0 >= 100, "+100 Max Health");
assert.ok((perm().adventureRegen || 0) >= 1, "+1 Health Regen");
assert.equal(s.systems.moneyPit.data.oneTimeClaimed["1e8"], true);

/* Pas de double attribution. */
const p1 = perm().adventurePower;
s = pit(s, 1e5);
assert.ok(perm().adventurePower - p1 <= 1, "le bonus 1E8 n'est pas redonne (palier 1 : +1 au plus)");

/* 1E10 : +1 barre Energy/Magic (une seule fois). */
const bars0 = perm().energyBarsFlat || 0;
s = pit(s, 1e10);
assert.equal(perm().energyBarsFlat - bars0, 1);
assert.equal(perm().magicBarsFlat, 1);
s = pit(s, 1e10);
assert.equal(perm().energyBarsFlat - bars0, 1, "une seule fois");

/* 1E11 : Looty McLootFace ; 1E12 : +100 EXP. */
const looties = () => s.adventure.inventory.filter((i) => i.definitionId === "lootyMcLootFace").length;
assert.equal(looties(), 0);
s = pit(s, 1e11);
assert.equal(looties(), 1, "Looty McLootFace");
s = pit(s, 1e11);
assert.equal(looties(), 1, "une seule fois");
const exp0 = s.currencies.experience;
s = pit(s, 1e12);
assert.ok(s.currencies.experience - exp0 >= 100, "+100 EXP");
assert.equal(s.systems.moneyPit.data.oneTimeClaimed["1e12"], true);

/* Souhait 4 : niveau Wandoos du Money Pit a 100. */
{
  const w = normalizeIdleNguState({}, ctx, 0);
  w.systems.wandoos.unlocked = true;
  w.systems.wandoos.allocation.energy = 1e6; /* vitesse de base 50 x 1e6 / 1e9 = 0,05 niveau/s */
  const NOW = 10 * 3600 * 1000; /* 10 h apres le debut du run : boot termine */
  const total = (x) => x.systems.wandoos.data.dumpEnergyLevel + x.systems.wandoos.data.dumpEnergyProgress;
  const sans = total(advanceIdleNguState(w, 100, ctx, NOW));
  w.systems.wishes.data.tracks["4"].level = 1;
  const avec = total(advanceIdleNguState(w, 100, ctx, NOW));
  assert.ok(Math.abs(sans - 5) < 1e-6, `niveau d'OS 0 : ${sans}`);
  assert.ok(Math.abs(avec - 505) < 1e-6, `niveau d'OS 100 -> vitesse x101 : ${avec}`);
}
console.log("idle-money-pit-one-time-bonuses: OK");
