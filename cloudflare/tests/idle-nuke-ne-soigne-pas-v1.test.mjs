import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-08) : « dans Fight Boss, je suis à moitié de vie, je fais le bouton Nuke et je récupère toute ma vie ».
 * NUKE tue le boss sans combat : il ne doit pas soigner le joueur, ni lever un KO en cours.
 */
const source = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
const debut = source.indexOf("function nukerBossSorealIdle(");
assert.ok(debut >= 0, "nukerBossSorealIdle introuvable");
const fin = source.indexOf("\nfunction ", debut + 10);
const corps = source.slice(debut, fin > 0 ? fin : undefined);

const ecriturePv = corps.slice(corps.indexOf("getRange(ligne, c.PV_JOUEUR)"), corps.indexOf("getRange(ligne, c.PIECES)"));
assert.ok(ecriturePv.includes("row[c.PV_JOUEUR - 1]"), "les PV écrits partent des PV actuels du joueur");
assert.ok(!/setValue\(\s*Math\.max\(\s*1,\s*nombreSorealIdle_\(\s*row\[c\.PV_JOUEUR_MAX - 1\]/.test(ecriturePv), "plus de remise à fond de vie");
assert.ok(!corps.includes("c.KO_JUSQUA).clearContent()"), "NUKE ne lève pas un KO en cours");
console.log("idle-nuke-ne-soigne-pas-v1: OK");
