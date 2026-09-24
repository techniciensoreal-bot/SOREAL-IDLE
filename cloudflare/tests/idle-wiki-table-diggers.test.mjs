import assert from "node:assert/strict";
import { IDLE_NGU_DIGGERS } from "../src/idle-ngu-progression.js";

/*
 * Wiki, page « Gold Diggers », tableau « Types of Diggers » (2026-09-24) : coût de déblocage (or), drain d'or au niveau 1, niveau plafond dur et
 * croissance (x1,5 par niveau pour les 4 diggers de la page 1, x1,75 pour les 8 autres). Valeurs recopiées du wiki ; le moteur est lu via IDLE_NGU_DIGGERS.
 * Le bonus global (« Bonus w/ all diggers upgraded to hard cap : 67.848 % ») découle de la formule de la page appliquée aux plafonds du moteur :
 * au-dessus de 500 niveaux au total = 25 % + 0,05 % x (niveaux totaux - 500)^0,7.
 * (Les formules d'effet par digger, 150 + L, 200 + L^3, 110 + 0,5 L, 120 + L, 110 + L, 105 + 0,1 L, 105 + 0,5 L, sont dans diggerBonuses, non exportée.)
 */
const WIKI = [
  // [id, coût de déblocage, drain niveau 1, niveau plafond]
  ["drop", 1e16, 1e12, 1657], ["wandoos", 1e16, 1e12, 1657], ["stats", 1e16, 1e12, 1657], ["adventure", 1e16, 1e12, 1657],
  ["energyNgu", 1e19, 1e15, 1188], ["magicNgu", 1e19, 1e15, 1188], ["energyBeard", 1e22, 1e18, 1176], ["magicBeard", 1e22, 1e18, 1176],
  ["pp", 1e25, 1e21, 1164], ["daycare", 1e25, 1e21, 1164], ["blood", 1e28, 1e24, 1151], ["experience", 1e28, 1e24, 1151]
];
assert.equal(IDLE_NGU_DIGGERS.length, 12);
WIKI.forEach(([id, unlock, drain, cap], i) => {
  const d = IDLE_NGU_DIGGERS[i];
  assert.equal(d.id, id, "ordre des diggers");
  assert.equal(d.unlockCost, unlock, id + " coût de déblocage");
  assert.equal(d.drain, drain, id + " drain");
  assert.equal(d.cap, cap, id + " niveau plafond");
  assert.equal(d.growth, i < 4 ? 1.5 : 1.75, id + " croissance");
});

const totalLevels = IDLE_NGU_DIGGERS.reduce((sum, d) => sum + d.cap, 0);
const globalBonusPct = 25 + 0.05 * Math.pow(totalLevels - 500, 0.7);
assert.ok(Math.abs(globalBonusPct - 67.848) < 0.001, "bonus global avec tous les diggers au plafond : " + globalBonusPct);

console.log("idle-wiki-table-diggers: OK");
