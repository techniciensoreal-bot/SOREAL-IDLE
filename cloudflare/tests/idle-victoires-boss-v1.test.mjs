// Norman (2026-10-30) : sur les cartes des boss, le nombre de fois que le boss a été tué.
import fs from "node:fs";
import assert from "node:assert/strict";
import { compterVictoireBossV1_, normaliserVictoiresBossV1_ } from "../src/idle-victoires-boss-v1.js";

const s = {};
compterVictoireBossV1_(s, 12); compterVictoireBossV1_(s, 12); compterVictoireBossV1_(s, 301);
assert.deepEqual(s.victoiresBoss, { "12": 2, "301": 1 }, "un compteur par numéro de boss");
compterVictoireBossV1_(s, 0); compterVictoireBossV1_(s, 1000); compterVictoireBossV1_(null, 5); compterVictoireBossV1_(s, "abc");
assert.deepEqual(s.victoiresBoss, { "12": 2, "301": 1 }, "numéros invalides ignorés");
assert.deepEqual(normaliserVictoiresBossV1_({ "5": 3, "x": 2, "7": -1, "9": 2.9, "1234": 5 }), { "5": 3, "9": 2 }, "copie propre : clés numériques, entiers positifs");
assert.deepEqual(normaliserVictoiresBossV1_(null), {});
assert.deepEqual(normaliserVictoiresBossV1_([1, 2]), {});

const lire = (f) => fs.readFileSync(new URL(f, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const combat = lire("../src/idle-runtime-combat.js"), prog = lire("../src/idle-runtime-progression.js"), coll = lire("../src/idle-runtime-collection.js");
assert.ok(combat.includes("compterVictoireBossV1_(stats, bossIndexNuke + 1);"), "NUKE : chaque boss tué compte");
assert.ok(prog.includes("compterVictoireBossV1_(statsCombat, bossCombatIndex + 1);"), "combat : chaque boss vaincu compte");
assert.ok(coll.includes("victoiresBoss:normaliserVictoiresBossV1_(s.victoiresBoss),"), "la lecture des statistiques conserve le compteur");
assert.ok(coll.includes("index < bossVaincus ? 1 : 0") && coll.includes("(stats.victoiresBoss || {})[String(index + 1)]"), "la Collection envoie les victoires (au moins 1 pour un boss déjà vaincu)");
console.log("idle-victoires-boss-v1 : OK");
