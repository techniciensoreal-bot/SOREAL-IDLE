import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47, idleAdventureSnapshotV47 } from "../src/idle-adventure-v47.js";

/*
 * Points de couleur des boosts qui manquent (Norman, 2026-10-08) : orange = Power, bleu = Toughness, jaune = Special, au niveau actuel de la pièce.
 * Le V vert redevient réservé au niveau 100 (fullyMaxed), une fois les points disparus.
 */
const ctx = { bosses: 100 };
const vue = (s, id) => idleAdventureSnapshotV47(s, ctx, 1).inventory.find((x) => x.id === id);
let s = normalizeIdleAdventureStateV47({});
s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "sewers:weapon", level: 5 }, ctx, 1).state;
const epee = s.inventory.find((x) => x.definitionId === "sewers:weapon");
// L'épée d'égouts a de la Power mais pas de Toughness : seul le point orange existe
let v = vue(s, epee.id);
assert.equal(v.boostManque.power, true, "il manque de la Power : point orange");
assert.equal(v.boostManque.toughness, false, "pas de Toughness sur cette pièce : jamais de point bleu");
assert.equal(v.boostManque.special, false, "pas de Special sur cette pièce : jamais de point jaune");
// On comble la Power du niveau 5 : le point orange disparaît, sans V (pas niveau 100)
for (let i = 0; i < 400 && vue(s, epee.id).boostManque.power; i += 1) {
  s.inventory.push({ id: "bp" + i, definitionId: "boost:power:10", name: "Boost power", kind: "boost", boostType: "power", strength: 10, level: 0 });
  s = applyIdleAdventureActionV47(s, { action: "boost", boostId: "bp" + i, targetId: epee.id }, ctx, 1).state;
}
v = vue(s, epee.id);
assert.deepEqual(v.boostManque, { power: false, toughness: false, special: false }, "plus aucun point");
assert.equal(v.level, 5);
assert.equal(v.fullyMaxed, false, "niveau 5 : pas de V vert");
// Un boost n'a jamais de point
s.inventory.push({ id: "bx", definitionId: "boost:power:1", name: "Boost power", kind: "boost", boostType: "power", strength: 1, level: 0 });
assert.deepEqual(vue(s, "bx").boostManque, { power: false, toughness: false, special: false });
// Une armure n'a que de la Toughness (point bleu seul), comme dans NGU
s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "training:head", level: 20 }, ctx, 1).state;
const casque = s.inventory.find((x) => x.definitionId === "training:head");
assert.deepEqual(vue(s, casque.id).boostManque, { power: false, toughness: true, special: false }, "casque neuf : point bleu seulement");
// Client : points colorés, V seulement pour fullyMaxed
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
assert.ok(ui.includes("function pointsBoostManquantIdleV1_(item){") && ui.includes('<b class="p"') && ui.includes('<b class="t"') && ui.includes('<b class="s"'), "trois points");
const badges = ui.slice(ui.indexOf("function badgesNiveauObjetIdleV1_(item){"), ui.indexOf("function iconeObjetAdventureIdleV138_(item){"));
assert.ok(badges.includes("item.fullyMaxed") && badges.includes("pointsBoostManquantIdleV1_(item)") && !badges.includes("boostsPleins"), "V vert = fullyMaxed seulement ; sinon les points");
assert.ok(css.includes(".idle-boostpts-v1 b.p{background:#ff8a1f;}") && css.includes("b.t{background:#3d9bff;}") && css.includes("b.s{background:#ffe14a;}"), "orange, bleu, jaune");
console.log("idle-boosts-manquants-v1: OK");
