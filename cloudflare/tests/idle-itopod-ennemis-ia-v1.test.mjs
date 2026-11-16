import assert from "node:assert/strict";
import {
  ITOPOD_DUDE_AI_V1,
  itopodCycleV1,
  itopodDrawAiV1,
  itopodEnemyActionV1,
  itopodEnemyMemoireV1,
  itopodEnemyStatsV1,
  itopodFightV1
} from "../src/idle-itopod-combat-v1.js";

/*
 * ITOPOD (NGU Idle build 1260, lu dans le code du jeu le 2026-11-16) : les 16 « Dude », leurs IA, leurs stats par étage, leurs cycles de coups, et un combat complet (coups du joueur, coups de l'ennemi, PV, mort).
 */

// Les 16 Dude : IA 0 x4, 1 x3, 2 x3, 3 x2, 5 x2, 6 x2 (aucun explosif)
{
  assert.equal(ITOPOD_DUDE_AI_V1.length, 16);
  const n = {};
  for (const a of ITOPOD_DUDE_AI_V1) n[a] = (n[a] || 0) + 1;
  assert.deepEqual(n, { 0: 4, 1: 3, 2: 3, 3: 2, 5: 2, 6: 2 });
  // le tirage est uniforme sur la table
  assert.equal(itopodDrawAiV1(0), ITOPOD_DUDE_AI_V1[0]);
  assert.equal(itopodDrawAiV1(0.999999), ITOPOD_DUDE_AI_V1[15]);
}

// Stats : 10 / 10 / 1 / 600 à l'étage 0, x1,05 par étage (powerUp), étage plafonné à 1600
{
  const e0 = itopodEnemyStatsV1(0);
  assert.deepEqual([e0.attack, e0.defense, e0.regen, e0.hp, e0.attackRate], [10, 10, 1, 600, 1.2]);
  const e100 = itopodEnemyStatsV1(100);
  assert.ok(Math.abs(e100.hp - 600 * Math.pow(1.05, 100)) < 1e-6);
  assert.ok(Math.abs(e100.attack - 10 * Math.pow(1.05, 100)) < 1e-9);
  assert.equal(itopodEnemyStatsV1(5000).hp, itopodEnemyStatsV1(1600).hp);
  assert.equal(itopodEnemyStatsV1(-3).hp, 600);
}

const suite = (ai, tours) => {
  const st = itopodEnemyMemoireV1();
  return Array.from({ length: tours }, () => itopodEnemyActionV1(ai, st));
};

// IA 0 : un coup ordinaire à chaque tour
assert.ok(suite(0, 20).every((a) => a.mult === 1 && !a.tick && !a.paralyze));

// IA 1 poison : cycle de 7 tours, tick de poison aux tours 2, 3 et 4 (le tour de poison avance le compteur de 2)
{
  const s = suite(1, 21);
  assert.ok(s.every((a) => a.mult === 1 && !a.paralyze));
  const ticks = s.map((a, i) => (a.tick ? (i % 7) + 1 : 0)).filter(Boolean);
  assert.deepEqual(ticks, [2, 3, 4, 2, 3, 4, 2, 3, 4]);
}

// IA 2 chargeur : cycle de 5 tours : coup, coup, rien, rien, coup x4
assert.deepEqual(suite(2, 10).map((a) => a.mult), [1, 1, 0, 0, 4, 1, 1, 0, 0, 4]);

// IA 3 paralysie : cycle de 12 tours : rien, coup, coup + paralysie, puis 9 coups
{
  const s = suite(3, 24);
  assert.deepEqual(s.slice(0, 12).map((a) => a.mult), [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  assert.deepEqual(s.map((a, i) => (a.paralyze ? i + 1 : 0)).filter(Boolean), [3, 15]);
  assert.deepEqual(s.slice(12).map((a) => a.mult), s.slice(0, 12).map((a) => a.mult));
}

// IA 5 rapide : cycle de 14 tours ; le mode rapide commence au tour 8 et finit au tour 14
{
  const st = itopodEnemyMemoireV1();
  const mult = [];
  const mode = [];
  for (let i = 0; i < 28; i++) { mult.push(itopodEnemyActionV1(5, st).mult); mode.push(st.rapidMode); }
  assert.deepEqual(mult.slice(0, 14), [1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1]);
  assert.deepEqual(mult.slice(14), mult.slice(0, 14));
  assert.deepEqual(mode.slice(0, 14), [false, false, false, false, false, false, false, true, true, true, true, true, true, false]);
}

// IA 6 grandisseur : coup x (1 + floor(n/2)/5)
assert.deepEqual(suite(6, 6).map((a) => Number(a.mult.toFixed(6))), [1, 1.2, 1.2, 1.4, 1.4, 1.6]);

/* Combat complet, étage 0 : ennemi 600 PV, attaque 10, premier coup à 1,8 s puis toutes les 1,2 s ; joueur : un coup par seconde. */
const joueur = (o) => Object.assign({ floor: 0, ai: 0, power: 300, toughness: 0, idleMult: 1, interval: 1, hp: 1000, hpMax: 1000, regen: 0, tMax: 100 }, o);

// Un coup suffit : l'ennemi (premier coup à 1,8 s) n'attaque jamais
{
  const f = itopodFightV1(joueur({ power: 2000 }));
  assert.equal(f.outcome, "kill");
  assert.equal(f.hits, 1);
  assert.ok(Math.abs(f.t - (1)) < 1e-9, "durée " + f.t);
  assert.equal(f.hp, 1000);
}

// Trois coups (295 de dégâts : 600 PV), mort à 3,0 s : un seul coup de l'ennemi (à 1,8 s) ; 10 - 0 / 2 = 10 de dégâts
{
  const f = itopodFightV1(joueur({ power: 300 }));
  assert.equal(f.outcome, "kill");
  assert.equal(f.hits, 3);
  assert.ok(Math.abs(f.t - (3)) < 1e-9, "durée " + f.t);
  assert.equal(f.hp, 990);
}

// La Robustesse réduit le coup : 10 - 8 / 2 = 6 ; plancher à 10 % de l'attaque (1) pour une Robustesse énorme
assert.equal(itopodFightV1(joueur({ power: 300, toughness: 8 })).hp, 994);
assert.equal(itopodFightV1(joueur({ power: 300, toughness: 1e6 })).hp, 999);

// La régénération (par seconde) soigne pendant le combat
{
  const f = itopodFightV1(joueur({ power: 300, hp: 500, hpMax: 1000, regen: 2 }));
  assert.equal(f.hp, 500 + 2 * 3 - 10);
}

// Mort du joueur : PV insuffisants face au premier coup
{
  const f = itopodFightV1(joueur({ power: 300, hp: 10, hpMax: 10 }));
  assert.equal(f.outcome, "death");
  assert.ok(Math.abs(f.t - (1.8)) < 1e-9, "durée " + f.t);
  assert.equal(f.hp, 0);
}

// Un joueur qui ne peut pas blesser l'ennemi (Puissance <= défense / 2) et qui perd plus qu'il ne régénère meurt
{
  const f = itopodFightV1(joueur({ power: 5, hp: 100, hpMax: 100 }));
  assert.equal(f.outcome, "death");
  assert.equal(f.hits > 0, true);
}

// Chargeur : 5e tour = coup x4 ; coups à 1,8 / 3,0 / (rien 4,2) / (rien 5,4) / 6,6 : 10 + 10 + 40
{
  const f = itopodFightV1(joueur({ ai: 2, power: 150, hp: 1000, hpMax: 1000 })); // 600 / 145 = 5 coups, mort à 5 s
  assert.equal(f.outcome, "kill");
  assert.ok(Math.abs(f.t - (5)) < 1e-9, "durée " + f.t);
  assert.equal(f.hp, 1000 - 10 - 10); // coups à 1,8 et 3,0 ; le suivant (4,2) est une annonce sans coup
}

// Poison : tick de floor(10 x 0,2) = 2 aux tours 2, 3, 4 ; ennemi vaincu à 5 s (coups à 1,8 / 3,0 / 4,2 : le tour 3 donne coup + tick)
{
  const f = itopodFightV1(joueur({ ai: 1, power: 150 }));
  assert.ok(Math.abs(f.t - (5)) < 1e-9, "durée " + f.t);
  // tours : 1,8 coup (10) ; 3,0 coup + poison (10 + 2) ; 4,2 coup + poison (10 + 2) ; 5,4 après la mort
  assert.equal(f.hp, 1000 - 10 - 12 - 12);
}

// Paralysie : le joueur ne frappe plus pendant 2 s au tour 3 de l'ennemi (6,6... : 1,8 rien ; 3,0 coup ; 4,2 coup + paralysie)
{
  const f = itopodFightV1(joueur({ ai: 3, power: 150 }));
  // sans paralysie : mort à 5 s ; la paralysie (à 4,2 s, avant le 5e coup du joueur) repousse le 5e coup de 2 s
  assert.ok(Math.abs(f.t - (7)) < 1e-9, "durée " + f.t);
}

// Le mode rapide resserre les coups de l'ennemi (0,36 s) à partir du tour 9
{
  const f = itopodFightV1(joueur({ ai: 5, power: 40, hp: 1e6, hpMax: 1e6, tMax: 60 })); // 600 / 35 = 18 coups
  assert.equal(f.outcome, "kill");
  assert.ok(Math.abs(f.t - (18)) < 1e-9, "durée " + f.t);
  // tours à 1,8 / 3,0 / 4,2 / 5,4 (coups), 6,6 (annonce), 7,8 et 9,0 (rien), 10,2 (mode rapide, coup), puis 10,56 ... : plus de coups reçus qu'avec un rythme de 1,2 s
  const ordinaire = itopodFightV1(joueur({ ai: 0, power: 40, hp: 1e6, hpMax: 1e6, tMax: 60 }));
  assert.ok(f.hp !== ordinaire.hp);
}

// Cycle : le délai de réapparition précède le combat et soigne ; temps insuffisant = cycle incomplet
{
  const c = itopodCycleV1(joueur({ power: 300, hp: 500, regen: 1, respawn: 4, tMax: 100 }));
  assert.equal(c.complete, true);
  assert.equal(c.outcome, "kill");
  assert.ok(Math.abs(c.t - (4 + 3)) < 1e-9, "durée " + c.t);
  assert.equal(c.hp, 500 + 4 + 3 - 10);
  const court = itopodCycleV1(joueur({ power: 300, hp: 500, regen: 1, respawn: 4, tMax: 6 }));
  assert.equal(court.complete, false);
  assert.equal(court.hp, 500, "les PV de départ du cycle sont conservés (le cycle est rejoué à la synchro suivante)");
  // joueur à 0 PV sans régénération : il meurt dès l'apparition
  const mort = itopodCycleV1(joueur({ power: 300, hp: 0, regen: 0, respawn: 4 }));
  assert.equal(mort.outcome, "death");
  assert.ok(Math.abs(mort.t - (4)) < 1e-9, "durée " + mort.t);
}

console.log("idle-itopod-ennemis-ia-v1: OK");
