import assert from "node:assert/strict";
import { idlePerkByIdV1, perkBonusesV1 } from "../src/idle-perks-v1.js";

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * Wiki NGU en direct (https://ngu-idle.fandom.com/wiki/Perk_Points),
 * indices 56-231 : la colonne "Buy Early?" ("Evil only"/"Sadistic only")
 * est un conseil d'ordre d'achat, jamais une restriction de jeu (même
 * statut que "YES (second)" sur les indices 0-55, jamais traité comme
 * verrou) -- chaque perk ci-dessous reste achetable dès que son coût PP
 * est payé, quelle que soit la difficulté.
 */

// --- Paliers génériques (spot-check des valeurs exactes du wiki) ---
assert.deepEqual(idlePerkByIdV1(57), { id: 57, name: "Generic Energy Power Perk II", effect: "+1% bonus multiplier to your Energy Power per level", cost: 50, cap: 100, bonus: { energyPowerPct: 0.01 } });
assert.deepEqual(idlePerkByIdV1(63).bonus, { nguSpeedEnergyPct: 0.02 }, "Wiki : Faster NGU Energy II = +2%/niveau, pas +2.5% (palier I).");
assert.equal(idlePerkByIdV1(74).cost, 250, "Wiki : palier III commence à 250 PP.");
assert.equal(idlePerkByIdV1(127).bonus.energyBarsPct, 0.001, "Wiki : palier Sadistic V a un taux réduit sur Bars/Cap (+0.1%, pas +0.2%) -- \"Why is it lower? Because in Sadistic Difficulty I don't give a crap about you!\"");
assert.equal(idlePerkByIdV1(129).bonus.magicPowerPct, 0.002, "Wiki : Power reste à +0.2% même en Sadistic V, seuls Bars/Cap baissent.");

// --- "Welcome to X Difficulty" : bonus ponctuels réels, partiellement câblés ---
{
  const evil = idlePerkByIdV1(125);
  assert.equal(evil.cost, 200);
  assert.equal(evil.cap, 1);
  assert.deepEqual(evil.bonus, { statPct: 2.0, dropChancePct: 0.50 }, "Wiki : \"+200% buff to Attack/Defense and 50% Drop Chance bonus\".");
}
{
  const sadistic = idlePerkByIdV1(144);
  assert.equal(sadistic.cost, 500000);
  assert.equal(sadistic.cap, 1);
  assert.deepEqual(sadistic.bonus, { statPct: 10.0, adventureStatsPct: 0.15, augmentSpeedPct: 0.2, nguSpeedEnergyPct: 0.2, nguSpeedMagicPct: 0.2 }, "Wiki : 1000% Attack/Defense, 15% Adventure Stats, 20% Aug Speed et 20% NGU Speed (2026-09-23 : les hooks perk existent maintenant).");
  assert.match(sadistic.effect, /Aug Speed/);
}

// --- ERROR (perk-blague, aucun effet réel) ---
{
  const error = idlePerkByIdV1(231);
  assert.equal(error.cost, 2500000000);
  assert.deepEqual(error.bonus, {}, "Wiki : \"NGU.EXE HAS ENCOUNTERED AN ERROR\" -- une blague, jamais un effet réel à inventer.");
}

// --- Agrégation : chaque palier est un atout DISTINCT, donc un facteur à part (2026-11-13) ---
{
  const bonuses = perkBonusesV1({ 6: 50, 57: 100, 74: 100, 116: 100, 126: 100, 135: 100, 220: 100 });
  /*
   * Mesuré dans le vrai jeu (cloudflare/tools/banc-vrai-jeu) : deux atouts distincts d'un même bonus se multiplient (atout 6 x Fibonacci 1 = x1,65 ;
   * Newbie x Rich Perks I = x10). NON MESURÉ entre deux paliers d'une même famille (I x II...), actifs seulement en Evil et Sadistic : la même
   * règle est appliquée (jshepler, d'après le code du jeu, écrit « Stat Boost For Rich Perks I x Stat Boost For Rich Perks II »). À confirmer au banc.
   * 1,5 x 2 x 1,3 x 1,2 x 1,2 x 1,2 x 2 = 13,4784 (avant : somme, 4,4).
   */
  assert.ok(Math.abs(bonuses.energyPowerMultiplier - 13.4784) < 1e-9, `Les paliers Energy Power sont des facteurs distincts (obtenu ${bonuses.energyPowerMultiplier}).`);
}

console.log("idle-perks-evil-sadistic-tiers: OK");
