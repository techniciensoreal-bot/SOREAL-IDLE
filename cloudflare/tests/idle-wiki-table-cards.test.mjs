import assert from "node:assert/strict";
import { IDLE_CARDS_TYPES_V1, idleCardBonusPctV1 } from "../src/idle-cards-v1.js";

/*
 * Wiki, page « Cards » (2026-09-24) :
 *  1. « Card bonus formula » : constantes C1..C4 des 14 types de cartes, formule (C1 + C2 x R x T^C3 x C4^T) x (M / 100) ;
 *  2. tableau « bonus par tier successif » : ratios bonus(T+1) / bonus(T) pour les 18 passages de tier (moins pour les types plafonnés plus tôt)
 *     et TOTAL(pen) = bonus(tier maximal) / bonus(1). Le texte annonce une rareté de 1,0 mais le tableau est calculé avec la rareté la plus haute (1,2)
 *     pour 10 types et avec une rareté observée de 1,14 à 1,17 pour 4 types (TM, GOLD, ADV, DAYCARE) : le test exige qu'il existe une rareté de la
 *     plage réelle (0,8 à 1,2) qui reproduit TOUS les ratios (arrondis à 2 décimales) et le TOTAL(pen) du wiki, pour chaque type.
 * Valeurs recopiées du wiki (fixtures, design/wiki-cards-table-check.mjs) ; le moteur est lu via IDLE_CARDS_TYPES_V1 et idleCardBonusPctV1.
 */
const CONSTANTS = {
  energyNgu: [0.03, 0.1, 1.2, 1.03], magicNgu: [0.02, 0.1, 0.8, 1.08], wandoos: [0.02, 0.1, 0.8, 1.1], augments: [0.02, 0.1, 0.8, 1.1],
  timeMachine: [0.02, 0.1, 0.8, 1.15], hacks: [0.02, 0.1, 0.4, 1.05], wishes: [0.02, 0.1, 0.5, 1.05], stats: [5, 1, 1.5, 2],
  adventure: [0.05, 0.1, 0.4, 1.07], drop: [0.02, 0.1, 1, 1.15], gold: [0.1, 0.5, 0.8, 1.15], daycare: [0.005, 0.02, 0.4, 1.04],
  pp: [0.01, 0.02, 0.6, 1.11], qp: [0.01, 0.02, 0.6, 1.08]
};
assert.equal(IDLE_CARDS_TYPES_V1.length, 14);
for (const [id, c] of Object.entries(CONSTANTS)) {
  const type = IDLE_CARDS_TYPES_V1.find((t) => t.id === id);
  assert.ok(type, id + " absent");
  assert.deepEqual([...type.c], c, id + " : constantes C1..C4");
}

// [id, ratios publiés (tier 1->2 ... ), TOTAL(pen)]
const WIKI = [
  ["energyNgu",[2.1,1.61,1.43,1.33,1.27,1.23,1.2,1.18,1.17,1.15,1.14,1.13,1.12,1.12,1.11,1.11,1.1,1.1],47.1],
  ["magicNgu",[1.76,1.46,1.34,1.28,1.24,1.22,1.2,1.18,1.17,1.16,1.16,1.15,1.14,1.14,1.14,1.13,1.13,1.13],36.63],
  ["wandoos",[1.79,1.48,1.37,1.3,1.27,1.24,1.22,1.21,1.19,1.19,1.18,1.17,1.17,1.16,1.16,1.15,1.15,1.15],51.04],
  ["augments",[1.79,1.48,1.37,1.3,1.27,1.24,1.22,1.21,1.19,1.19,1.18,1.17,1.17,1.16,1.16,1.15,1.15,1.15],51.04],
  ["timeMachine",[1.87,1.55,1.43,1.36,1.32,1.3,1.28,1.26,1.25,1.24,1.23,1.23,1.22,1.21,1.21,1.21,1.2,1.2],113.73],
  ["hacks",[1.33,1.21,1.16,1.14,1.12,1.11,1.1,1.1,1.09,1.09,1.08,1.08,1.08,1.08,1.08,1.07,1.07,1.07],6.88],
  ["wishes",[1.42,1.26,1.2,1.16,1.14,1.13,1.12,1.11,1.1,1.1,1.09],5.25],
  ["stats",[2.51,2.95,2.89,2.74,2.61,2.51,2.44,2.39,2.34,2.31,2.28,2.26,2.24,2.22,2.2,2.19,2.18,2.17],7041251.99],
  ["adventure",[1.29,1.2,1.16,1.14,1.13,1.12,1.11,1.11,1.11,1.1,1.1,1.1,1.1,1.09,1.09,1.09,1.09,1.09],8.08],
  ["drop",[2.14,1.68,1.51,1.43,1.37,1.34,1.31,1.29,1.28,1.26,1.25,1.25,1.24,1.23,1.23,1.22,1.22,1.21],205.5],
  ["gold",[1.87,1.55,1.43,1.36,1.32,1.3,1.28,1.26,1.25,1.24,1.23,1.23,1.22,1.21,1.21,1.21,1.2,1.2],113.35],
  ["daycare",[1.31,1.19,1.15,1.12,1.11,1.1,1.09,1.08,1.08,1.08,1.07,1.07,1.07,1.07,1.06,1.06,1.06,1.06],5.61],
  ["pp",[1.5,1.34,1.28,1.24,1.22,1.2,1.19,1.18,1.17,1.17,1.16,1.16,1.16,1.15,1.15,1.15],21.41],
  ["qp",[1.46,1.31,1.24,1.21,1.18,1.17,1.16,1.15,1.14,1.14,1.13,1.13,1.12,1.12],11.04]
];

for (const [id, ratios, totalPen] of WIKI) {
  let fitted = null;
  for (let R = 0.8; R <= 1.2001 && !fitted; R += 0.0005) {
    const b = (t) => idleCardBonusPctV1(id, t, R, 100);
    const ratiosOk = ratios.every((w, i) => Math.abs(b(i + 2) / b(i + 1) - w) <= 0.0051);
    const mine = b(1 + ratios.length) / b(1);
    if (ratiosOk && Math.abs(mine - totalPen) / totalPen <= 1e-4) fitted = R;
  }
  assert.ok(fitted !== null, id + " : aucune rareté entre 0,8 et 1,2 ne reproduit les ratios et le TOTAL(pen) du wiki");
  assert.ok(fitted >= 1.13, id + " : rareté ajustée " + fitted + " (attendu proche de la rareté maximale)");
}

console.log("idle-wiki-table-cards: OK");
