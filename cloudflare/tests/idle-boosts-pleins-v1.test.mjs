import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47, idleAdventureSnapshotV47 } from "../src/idle-adventure-v47.js";

/*
 * V vert dès que les statistiques sont comblées POUR LE NIVEAU ACTUEL (Norman, 2026-10-08) : on sait ainsi qu'il est inutile de lui ajouter des boosts, même si la pièce n'est pas au niveau 100.
 */
const ctx = { bosses: 100 };
const vue = (s, id) => idleAdventureSnapshotV47(s, ctx, 1).inventory.find((x) => x.id === id);
let s = normalizeIdleAdventureStateV47({});
s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "sewers:weapon", level: 5 }, ctx, 1).state;
const epee = s.inventory.find((x) => x.definitionId === "sewers:weapon");
assert.equal(vue(s, epee.id).boostsPleins, false, "pièce fraîche : il reste de la place pour des boosts");
// Des boosts de Power jusqu'au plafond du niveau 5 (l'épée d'égouts n'a pas de Toughness à remplir).
for (let i = 0; i < 400 && !vue(s, epee.id).boostsPleins; i += 1) {
  s.inventory.push({ id: "bp" + i, definitionId: "boost:power:10", name: "Boost power", kind: "boost", boostType: "power", strength: 10, level: 0 });
  s = applyIdleAdventureActionV47(s, { action: "boost", boostId: "bp" + i, targetId: epee.id }, ctx, 1).state;
}
const pleine = vue(s, epee.id);
assert.equal(pleine.boostsPleins, true, "plafond du niveau atteint : V vert");
assert.equal(pleine.level, 5, "toujours niveau 5");
assert.equal(pleine.fullyMaxed, false, "ce n'est pas le niveau 100 : fullyMaxed reste faux");
s.inventory.push({ id: "bx", definitionId: "boost:power:1", name: "Boost power", kind: "boost", boostType: "power", strength: 1, level: 0 });
assert.throws(() => applyIdleAdventureActionV47(s, { action: "boost", boostId: "bx", targetId: epee.id }, ctx, 1), /BOOST_STAT_DEJA_MAX/, "le serveur refuserait bien un boost de plus");
// Un boost lui-même n'a jamais ce V.
assert.equal(vue(s, "bx").boostsPleins, false);
// Client : le même V vert, avec une info-bulle qui dit pourquoi.
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("item.boostsPleins") && ui.includes("inutile d’ajouter des boosts"), "badge V vert pour les statistiques pleines");
console.log("idle-boosts-pleins-v1: OK");
