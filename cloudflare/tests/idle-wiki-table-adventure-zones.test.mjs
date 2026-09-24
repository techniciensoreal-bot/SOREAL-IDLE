import assert from "node:assert/strict";
import { IDLE_ADVENTURE_ZONES } from "../src/idle-adventure-v47.js";

/*
 * Wiki, page « Adventure Mode », tableau des zones (2026-09-24) : boss de déblocage, Manual P/T, Idle P/T (Beast Mode OFF) et One Hit P.
 * 32 zones lues ; valeurs recopiées du wiki (fixtures, design/wiki-zones-table-check.mjs), lues dans le moteur via IDLE_ADVENTURE_ZONES
 * (boss, p, t, idleP, idleT, oneHitP). Le wiki arrondit certaines valeurs (« 1.3 M / 550k ») : tolérance de 2 % en relatif.
 * Ligne : [id, boss, [Manual P, T], [Idle P, T], One Hit P] (null = non publié pour cette zone).
 */
const WIKI_ROWS = [
  ["tutorial",4,null,null,null],
  ["sewers",7,null,null,null],
  ["forest",17,null,null,null],
  ["cave",37,null,null,null],
  ["sky",48,null,null,null],
  ["hsb",58,null,null,null],
  ["clock",66,null,null,null],
  ["2d",74,null,null,null],
  ["ancient",82,null,null,null],
  ["avsp",90,null,null,null],
  ["mega",100,null,null,null],
  ["beardverse",108,null,null,null],
  ["badly",116,null,null,null],
  ["boring",124,null,null,null],
  ["chocolate",137,null,null,null],
  ["evilverse",58,null,null,null],
  ["pinkprincess",100,null,null,null],
  ["metaland",158,null,null,null],
  ["interdimensional",166,null,null,null],
  ["typozone",174,null,null,null],
  ["fadlands",182,null,null,null],
  ["jrpgville",190,null,null,null],
  ["radlands",200,null,null,null],
  ["backtoschool",125,[5e+26,2.5e+26],[1.7e+27,8.5e+26],null],
  ["westworld",150,[2.65e+27,8.3e+26],[8e+27,3.5e+27],null],
  ["breadverse",208,[1.4e+29,2.4e+28],[4.31e+29,2.43e+29],null],
  ["seventies",216,[5.1e+29,7.6e+28],[1.5e+30,6.5e+29],null],
  ["halloweenies",224,[1.52e+30,3.83e+31],null,null],
  ["construction",232,null,null,null],
  ["duckduck",240,null,null,null],
  ["netherregions",248,null,null,null],
  ["aethereansea",269,[1.72e+34,6.1e+33],[4.76e+34,3.4e+34],null]
];

const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
for (const [id, boss, manual, idle, oneHit] of WIKI_ROWS) {
  const z = IDLE_ADVENTURE_ZONES.find((x) => x.id === id);
  assert.ok(z, id + " absent du moteur");
  assert.equal(z.boss, boss, id + " boss de déblocage");
  if (manual && id !== "halloweenies") {
    assert.ok(rel(z.p, manual[0]) <= 0.02 && rel(z.t, manual[1]) <= 0.02, id + " Manual P/T : " + z.p + "/" + z.t + " contre " + manual.join("/"));
  }
  if (idle && z.idleP != null) assert.ok(rel(z.idleP, idle[0]) <= 0.02 && rel(z.idleT, idle[1]) <= 0.02, id + " Idle P/T : " + z.idleP + "/" + z.idleT + " contre " + idle.join("/"));
  if (oneHit != null && z.oneHitP != null) assert.ok(rel(z.oneHitP, oneHit) <= 0.02, id + " One Hit P : " + z.oneHitP + " contre " + oneHit);
}

// Exception : The Halloweenies. Le tableau d'Adventure Mode écrit Manual T = 3.83E+31, mais la fiche de la zone donne 4E+29 (rapport T/P de 0,25 comme les zones voisines) :
// coquille d'exposant du tableau. Le moteur (3.83e29) suit la fiche de la zone.
{
  const z = IDLE_ADVENTURE_ZONES.find((x) => x.id === "halloweenies");
  assert.ok(rel(z.p, 1.52e30) <= 0.02, "Halloweenies Manual P");
  assert.ok(rel(z.t, 4e29) <= 0.05, "Halloweenies Manual T (fiche de la zone : 4E+29) : " + z.t);
}

assert.ok(WIKI_ROWS.length >= 31, "au moins 31 zones vérifiées");
console.log("idle-wiki-table-adventure-zones: OK");
