import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Hommage à Grizboule (Norman, 2026-10-08) : une ligne en bas de chaque note de mise à jour, présente aussi en anglais. */
const notes = readFileSync("cloudflare/public/modules/release-notes-v1.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const dict = JSON.parse(readFileSync("cloudflare/public/modules/traduction-anglais-dict-v1.json", "utf8"));
const m = notes.match(/hommage:'([^']+)'/);
assert.ok(m && m[1].includes("Grizboule"), "hommage dans les données des notes");
assert.ok(dict[m[1]] && dict[m[1]].includes("Grizboule"), "traduction anglaise de l'hommage");
assert.ok(ui.includes("notes.hommage?'<div class=\"soreal-idle-notes-maj-hommage-v1\">'"), "affiché sous chaque version");
const bloc = ui.slice(ui.indexOf("notes.versions.map(function(v,i){"), ui.indexOf("notes.versions.map(function(v,i){") + 700);
assert.ok(bloc.indexOf("v.points.map") < bloc.indexOf("notes.hommage"), "en bas de la note, après les points");
console.log("idle-notes-hommage-v1: OK");
