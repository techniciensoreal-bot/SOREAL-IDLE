import assert from "node:assert/strict";
import { IDLE_ADVENTURE_COFFRE_PLACE_V1 } from "../src/idle-adventure-v47.js";
import { IDLE_ADVENTURE_COFFRE_PENDENTIFS_V1 } from "../src/idle-adventure-inventaire.js";

/* Norman (2026-11-04) : « dans le coffre, je veux que les pendentifs ascendant soient dans la même catégorie, classés du plus faible au plus puissant ». */
const liste = ["ascendedForestPendant", "ascendedAscendedForestPendant", "ascendedX3Pendant", "ascendedX4Pendant", "ascendedX5Pendant", "ascendedX6Pendant", "ascendedX7Pendant", "ascendedX8Pendant", "ascendedX9Pendant"];
assert.deepEqual([...IDLE_ADVENTURE_COFFRE_PENDENTIFS_V1], liste, "lignée du plus faible au plus puissant");
liste.forEach((id, i) => {
  const p = IDLE_ADVENTURE_COFFRE_PLACE_V1[id];
  assert.ok(p, id + " a une place");
  assert.equal(p.groupe, "pendentif", id + " : groupe des pendentifs ascendés (même quand un titan le lâche)");
  assert.equal(p.rang, i, id + " : rang dans la lignée");
});
console.log("idle-coffre-pendentifs-groupe-v1: OK");
