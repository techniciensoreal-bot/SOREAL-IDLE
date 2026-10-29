import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import { readFileSync } from "node:fs";

/* Hommage à Grizboule (Norman, 2026-10-08) : une ligne en bas de chaque note de mise à jour, présente aussi en anglais. */
const notes = readFileSync("cloudflare/public/modules/release-notes-v1.js", "utf8");
const ui = lireUiComplet();
const dict = JSON.parse(readFileSync("cloudflare/public/modules/traduction-anglais-dict-v1.json", "utf8"));
const m = notes.match(/hommage:'([^']+)'/);
assert.ok(m && m[1].includes("Grizboule"), "hommage dans les données des notes");
assert.ok(dict[m[1]] && dict[m[1]].includes("Grizboule"), "traduction anglaise de l'hommage");
assert.ok(ui.includes("(v.hommage||notes.hommage)?'<div class=\"soreal-idle-notes-maj-hommage-v1\">'"), "affiché sous chaque version (celui de la version, sinon l'hommage général)");
const bloc = ui.slice(ui.indexOf("notes.versions.filter(function(v,i){"), ui.indexOf("notes.versions.filter(function(v,i){") + 700);
assert.ok(bloc.indexOf("htmlVersionNotesMajIdleV1_(v,possedes)") < bloc.indexOf("notes.hommage"), "en bas de la note, après les lignes");
assert.equal(m[1], "🐾 En hommage à Grizboule", "Norman (2026-10-11) : seulement une patte de chat et « En hommage à Grizboule »");
// Norman (2026-10-11) : les versions déjà publiées gardent l'ancien hommage ; le texte court ne vaut qu'à partir d'aujourd'hui.
import vm from "node:vm";
const w = {};
vm.runInNewContext(notes, { window: w });
const nn = w.__SOREAL_IDLE_RELEASE_NOTES_V1__;
const ancien = nn.versions.filter((v) => v.version !== "2.6" && v.version !== "2.7" && v.version !== "2.8" && v.version !== "2.9" && v.version !== "3.0" && v.version !== "3.1" && v.version !== "3.2" && v.version !== "3.3" && v.version !== "3.4" && v.version !== "3.5" && v.version !== "3.6" && v.version !== "3.7" && v.version !== "3.8" && v.version !== "3.9" && v.version !== "4.0" && v.version !== "4.1" && v.version !== "4.2" && v.version !== "4.4" && v.version !== "4.3");
assert.equal(ancien.length, 16);
for (const v of ancien) assert.ok(String(v.hommage).startsWith("🐾 En souvenir de Grizboule, mon chat adoré") && String(v.hommage).includes("je t’aime et tu me manques.") && dict[v.hommage], "ancien hommage conservé et traduit : " + v.version);
for (const [i, nom] of ["4.4", "4.3", "4.2", "4.1", "4.0", "3.9", "3.8", "3.7", "3.6", "3.5", "3.4", "3.3", "3.2", "3.1", "3.0", "2.9", "2.8", "2.7", "2.6"].entries()) assert.equal(nn.versions[i].hommage, undefined, nom + " utilise l hommage court");
console.log("idle-notes-hommage-v1: OK");
