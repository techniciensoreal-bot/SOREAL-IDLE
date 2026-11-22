import assert from "node:assert/strict";
import { towerHitsV1 } from "../src/idle-ngu-systemes.js";
import { itopodFightV1 } from "../src/idle-itopod-combat-v1.js";

/*
 * Norman (2026-11-22) : « les ennemis de l'ITOPOD n'ont pas de regen de vie dans le jeu original ? » : si (AdventureController::manageFight : PV de l'ennemi + régénération x dt, régénération de base 1 x 1,05^étage par seconde).
 * Le calcul par lots (coups par ennemi) doit donner le même nombre de coups que la simulation d'un combat (itopodFightV1, qui régénère l'ennemi entre deux coups).
 */
for (const floor of [0, 10, 40, 120]) {
  for (const interval of [1, 0.8]) {
    for (const mult of [0.0015, 0.004, 0.02, 0.5]) {
      const scale = Math.pow(1.05, floor);
      const power = (600 * scale / mult) * 1 + (10 * scale) / 2;   /* dégâts = pv x mult ... environ */
      const idle = 1.2;
      const r = itopodFightV1({ floor, ai: 0, power, toughness: 1e30, idleMult: idle, interval, hp: 1e30, hpMax: 1e30, regen: 0, tMax: 1e9 });
      assert.equal(r.outcome, "kill");
      const lots = towerHitsV1(power, idle, floor, interval);
      assert.equal(lots, r.hits, `étage ${floor}, intervalle ${interval}, dégâts/PV ${mult} : mêmes coups que la simulation`);
    }
  }
}
// la régénération coûte des coups : un joueur qui tue « en 5 coups sans regen » en demande un peu plus de 5 quand le coup est juste
const sans = Math.ceil(600 / 120);
assert.equal(sans, 5);
assert.ok(towerHitsV1(120 + 5, 1, 0, 1) >= 5);
assert.equal(towerHitsV1(1e6, 1.2, 0, 1), 1, "un coup qui dépasse les PV tue en 1 coup (aucune régénération avant le premier coup)");
assert.ok(towerHitsV1(5.5, 1, 0, 1) >= 1e9, "un coup plus faible que la régénération ne tue jamais");
console.log("idle-itopod-regen-ennemi-v1: OK");
