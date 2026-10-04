import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createIdleAdventureStateV47,
  applyIdleAdventureActionV47,
  idleAdventureBoostV1,
  idleAdventureAddItemV1,
  IDLE_ADVENTURE_BOOSTS
} from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-10-03) : « Je viens de fusionner un boost power niveau 1 jusqu'au niveau 100. Je ne vois pas le petit V vert dans la collection. Il y a une récompense : est-ce intégré pour tous les boosts ? »
 * Wiki : chaque boost maximisé (3 couleurs x 13 niveaux = 39) donne +2 % d'efficacité à tous les boosts.
 */
let state = createIdleAdventureStateV47();
let attendu = 0;
for (const type of ["power", "toughness", "special"]) {
  for (const force of IDLE_ADVENTURE_BOOSTS) {
    const a = idleAdventureBoostV1(type, force);
    const b = idleAdventureBoostV1(type, force);
    state.inventory = [];
    state.inventorySlots = [];
    a.level = 49;
    b.level = 50;
    idleAdventureAddItemV1(state, a);
    idleAdventureAddItemV1(state, b);
    state = applyIdleAdventureActionV47(state, { action: "merge", a: a.id, b: b.id }, { bosses: 50 }, Date.now()).state;
    attendu += 1;
    assert.equal(state.itemList[`boost:${type}:${force}`].boostCompletionRewardV183, true, `${type} ${force} : récompense versée`);
    assert.equal(state.setRewards.boostCompletions, attendu, `${type} ${force} : compteur`);
  }
}
assert.equal(attendu, 39, "3 couleurs x 13 niveaux");
assert.ok(Math.abs(state.setRewards.boostEffectiveness - 0.78) < 1e-9, "+78 % au total, jamais plus");

// Client : le petit V vert apparaît sur la carte d'un boost maximisé de la Collection.
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("const boostMaxe=Boolean(itemList[id]&&idleEntier_(itemList[id].maxLevel)>=100);"));
assert.ok(ui.includes("(boostMaxe?'<div class=\"soreal-idle-collection-check-v1\""), "V vert sur les boosts au niveau 100");
assert.ok(ui.includes("d’efficacité de tous les boosts"), "récompense rappelée");
console.log("idle-boost-completion-39-boosts-v1: OK");
