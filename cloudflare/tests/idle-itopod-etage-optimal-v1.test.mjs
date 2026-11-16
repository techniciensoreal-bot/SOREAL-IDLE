import assert from "node:assert/strict";
import { towerOptimalFloorV1 } from "../src/idle-ngu-systemes.js";

/*
 * Étage optimal de l'ITOPOD = Character::calculateBestItopodLevel du jeu (NGU Idle build 1260, lu le 2026-11-16) :
 * 0 sous 700 de Puissance ; sinon floor(log base 1,05 de (Puissance / 765 x Idle Attack Power)), au moins 1.
 */

assert.equal(towerOptimalFloorV1(10, 1.2), 0);
assert.equal(towerOptimalFloorV1(699.9, 1.2), 0, "sous 700 de Puissance : aucun étage optimal");
assert.equal(towerOptimalFloorV1(700, 1.2), 1, "au moins 1 dès 700");
assert.equal(towerOptimalFloorV1(1e6, 1.2), Math.floor(Math.log((1e6 / 765) * 1.2) / Math.log(1.05)));
assert.equal(towerOptimalFloorV1(1e6, 1.2), 150);

// Frontière : à Puissance = 765 x 1,05^k / Idle Attack Power, l'étage optimal est exactement k
for (const k of [2, 10, 37, 100, 400]) {
  const puissance = (765 * Math.pow(1.05, k)) / 1.2;
  assert.equal(towerOptimalFloorV1(puissance * 1.0000001, 1.2), k, "k = " + k);
  assert.equal(towerOptimalFloorV1(puissance * 0.999999, 1.2), k - 1, "juste sous le seuil de l'étage " + k);
}

// Plafond du jeu : 1600
assert.equal(towerOptimalFloorV1(1e300, 1.2), 1600);

// Cohérence : l'étage optimal du jeu se tue toujours en un coup (marge pour les aléas), même avec un autre Idle Attack Power
for (const idle of [1, 1.2, 2, 5]) {
  for (const p of [700, 5e3, 1e5, 1e8, 1e12]) {
    const f = towerOptimalFloorV1(p, idle);
    const s = Math.pow(1.05, f);
    assert.ok((p - 5 * s) * idle >= 600 * s * 1.02, "un coup moyen tue au pire un ennemi de PV +2 % : P=" + p + " idle=" + idle + " étage " + f);
  }
}

console.log("idle-itopod-etage-optimal-v1: OK");
