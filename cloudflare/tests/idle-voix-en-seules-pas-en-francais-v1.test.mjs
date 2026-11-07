import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-07) : « le boss Rob Boss prononce le nom du boss avec la voix anglaise » (pancarte de chronique, jeu en français). Cause : le nom « Rob Boss » est identique en français et en anglais, donc a la MÊME empreinte ;
 * aucune voix française n'existait pour ce bloc, la voix anglaise générée depuis a pris la place et le français la lisait. Parade : le manifeste liste `enSeules` (voix anglaises sans équivalent français) ; hors anglais, le bloc
 * n'est pas demandé et retombe sur la voix française de secours.
 */
const m = JSON.parse(fs.readFileSync("cloudflare/public/voice/manifest.json", "utf8"));
assert.ok(Array.isArray(m.enSeules) && m.enSeules.length > 500, "liste enSeules au manifeste : " + (m.enSeules || []).length);
assert.ok(m.enSeules.includes("1c62e086a2e1f6"), "« Rob Boss » (chronique 105, bloc du nom) est une voix anglaise seule");
assert.ok(m.enSeules.every((h) => /^[0-9a-f]{14}$/.test(h)), "chaque empreinte enSeules est valide");
const src = fs.readFileSync("cloudflare/public/modules/tutorial-tts-v202.js", "utf8");
assert.ok(/enSeules_\[String\(h\)\]=true/.test(src) && /if\(!langueAnglaise_\(\)&&enSeules_\[hash\]\)return null;/.test(src), "le client ignore une voix anglaise seule hors anglais");
/* les voix déclarées par une histoire / un texte enregistré (voixDynamiques) ne passent pas par ce filtre : l'éditeur Admin reste maître de ses voix */
const i = src.indexOf("var source=voixDynamiques[hash]"), j = src.indexOf("if(!langueAnglaise_()&&enSeules_[hash])return null;");
assert.ok(i > 0 && j > i, "filtre placé dans la branche du manifeste, pas dans celle des voix déclarées");
const pub = fs.readFileSync("cloudflare/tools/voice-publish.mjs", "utf8");
assert.ok(/enSeules: enSeules_\(/.test(pub) && /for \(const h of nouvelles\) if \(!connues\.has\(h\)\) liste\.add\(h\)/.test(pub), "l'outil d'envoi conserve et complète enSeules");
console.log("idle-voix-en-seules-pas-en-francais-v1: OK");
