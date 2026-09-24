import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/*
 * 2026-09-24 — audit des pages-guides. La FAQ cite les « One kind bonus » du Money Pit ; la page
 * Money Pit (« One-Time Bonuses », or TOTAL jeté) + Energy + Magic donnent : 1E8 -> +100 Max HP,
 * +1 HP Regen ; 1E10 -> +1 Energy Bar, +1 Magic Bar ; 1E11 -> Looty McLootFace ; 1E12 -> +100 EXP.
 * Rien de tout cela n'était versé. Le « +10 Power/Toughness » (page) contre « +1 » (FAQ) reste
 * en suspens (non versé).
 */

const H = 3600 * 1000;
function jeter(s, gold, t) {
  s.currencies.gold = gold;
  const old = Math.random;
  Math.random = () => 0; // palier : 1re colonne (Adv Stat), jamais EXP
  try {
    return applyIdleNguAction(s, { action: "moneyPit" }, { bosses: 100 }, t).state;
  } finally {
    Math.random = old;
  }
}
function neuf() {
  const s = normalizeIdleNguState({}, { bosses: 100 }, 1_000_000);
  s.systems.moneyPit.unlocked = true;
  return s;
}
const perm = (s) => s.adventure.permanent;
const looty = (s) => s.adventure.inventory.filter((o) => o.definitionId === "lootyMcLootFace");

// Cumul sur plusieurs jets : 6e7 puis 6e7 franchit 1E8.
{
  let s = neuf();
  s = jeter(s, 6e7, 10_000_000);
  assert.equal(perm(s).adventureHp || 0, 0, "6e7 cumulés : pas encore de bonus");
  const regenAvant = perm(s).adventureRegen || 0;
  s = jeter(s, 6e7, 10_000_000 + 2 * H);
  assert.equal(perm(s).adventureHp, 100, "1E8 cumulés : +100 Max HP");
  assert.equal(perm(s).adventureRegen - regenAvant, 1, "+1 HP Regen (le palier 3, colonne 0, ne touche pas la regen)");
  assert.equal(perm(s).energyBarsFlat || 0, 0);
  // Une seule fois.
  s = jeter(s, 1e5, 10_000_000 + 5 * H);
  assert.equal(perm(s).adventureHp, 100, "bonus 1E8 versé une seule fois");
}

// Un seul gros jet : tous les seuils franchis d'un coup.
{
  let s = neuf();
  const expAvant = s.currencies.experience;
  s = jeter(s, 1e12, 10_000_000);
  assert.equal(perm(s).energyBarsFlat, 1, "1E10 : +1 Energy Bar");
  assert.equal(perm(s).magicBarsFlat, 1, "1E10 : +1 Magic Bar");
  assert.equal(looty(s).length, 1, "1E11 : Looty McLootFace");
  assert.equal(looty(s)[0].level, 0);
  assert.equal(s.currencies.experience - expAvant, 100, "1E12 : +100 EXP (le jet du palier, colonne 0, n'en donne pas)");
  assert.equal(s.records.moneyPitOneTimeMask, 15);
  s = jeter(s, 1e12, 10_000_000 + 2 * H);
  assert.equal(looty(s).length, 1, "pas de second Looty");
  assert.equal(perm(s).energyBarsFlat, 1);
}

// Sac plein : le Looty n'est pas perdu, il est versé au jet suivant.
{
  let s = neuf();
  s.adventure.inventory = [];
  const plein = [];
  for (let i = 0; i < 200; i += 1) plein.push({ id: `b${i}`, kind: "boost", boostType: "power", strength: 1, level: 0, name: "Power Boost" });
  s.adventure.inventory = plein;
  s = jeter(s, 2e11, 10_000_000);
  assert.equal(looty(s).length, 0, "sac plein : pas de Looty");
  assert.equal(s.records.moneyPitOneTimeMask & 4, 0, "palier Looty non marqué versé");
  assert.equal(s.records.moneyPitOneTimeMask & 3, 3, "les autres paliers sont versés");
  s.adventure.inventory = [];
  s = jeter(s, 1e5, 10_000_000 + 2 * H);
  assert.equal(looty(s).length, 1, "Looty versé dès qu'il y a de la place");
}

console.log("idle-money-pit-one-time-bonuses OK");
