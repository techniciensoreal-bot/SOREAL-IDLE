import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Hommage à Grizboule (Norman, 2026-10-08) : une ligne en bas de chaque note de mise à jour, présente aussi en anglais. */
const notes = readFileSync("cloudflare/public/modules/release-notes-v1.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
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
const ancien = nn.versions.filter((v) => v.version !== "2.6" && v.version !== "2.7");
assert.equal(ancien.length, 16);
for (const v of ancien) assert.ok(String(v.hommage).startsWith("🐾 En souvenir de Grizboule, mon chat adoré") && String(v.hommage).includes("je t’aime et tu me manques.") && dict[v.hommage], "ancien hommage conservé et traduit : " + v.version);
assert.equal(nn.versions[0].hommage, undefined, "2.7 utilise l hommage court"); assert.equal(nn.versions[1].hommage, undefined, "2.6 aussi");
console.log("idle-notes-hommage-v1: OK");
