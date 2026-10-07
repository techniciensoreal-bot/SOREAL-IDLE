import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-07) : le mot qui suit un gain d'or est de plus en plus content quand la somme monte (Bah…, Ça se prend, Chouette, Cool, Pas mal, Wow, OH BORDEL, WHOUHOU…). */
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const a = meta.indexOf("      const PALIERS_OR_EXCLAMATION_V1=[");
const b = meta.indexOf("      function ajusterBloodMagicIdleV1_(mode,ritualId){");
assert.ok(a > 0 && b > a, "paliers présents");
const exclamation = new Function(meta.slice(a, b) + "\nreturn exclamationOrIdleV1_;")();
const attendu = [[0, "Bah…"], [5, "Bah…"], [50, "Ça se prend."], [500, "Chouette !"], [5000, "Cool !"], [50000, "Pas mal !"], [500000, "Wow !"], [5e7, "OH BORDEL !"], [5e9, "WHOUHOU !"]];
for (const [somme, mot] of attendu) assert.equal(exclamation(somme), mot, "somme " + somme);
const ordre = [1, 50, 500, 5e3, 5e4, 5e5, 5e7, 5e9, 5e12, 5e15, 5e19, 5e25].map(exclamation);
assert.equal(new Set(ordre).size, ordre.length, "chaque palier a son mot : de plus en plus content");
assert.equal(exclamation(5e25), "LÉGENDAIRE !!!", "au-delà du dernier palier : joie maximale");
assert.equal(exclamation("n'importe quoi"), "Bah…", "jamais de plantage");
assert.ok(meta.includes("' or ! '+exclamationOrIdleV1_(res.resultat.gold)"), "le journal d'Aventure utilise les paliers");
console.log("idle-or-exclamation-v1: OK");
