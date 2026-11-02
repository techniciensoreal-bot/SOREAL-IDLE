// Norman (2026-10-29) : « quand on démarre Wandoos avec le clavier, les écritures décalent le chargement » : le message d'allumage change de longueur et le pourcentage de largeur ; le bloc centré bougeait.
import fs from "node:fs";
import assert from "node:assert/strict";
const s = fs.readFileSync("cloudflare/public/modules/wandoos-retro-v1.js", "utf8").replace(/\r\n/g, "\n");
for (const regle of [".wd-boot{min-height:6.6em;}", ".wd-boot .wd-ligne{flex-wrap:nowrap;align-items:flex-start;min-height:2.5em;}", ".wd-boot #wd-boot-msg{flex:1 1 auto;min-width:0;min-height:2.5em;", ".wd-boot #wd-boot-pct{flex:0 0 auto;min-width:4ch;text-align:right;font-variant-numeric:tabular-nums;}"]) assert.ok(s.includes(regle), "règle présente : " + regle);
assert.ok(s.includes('id="wd-boot-msg"') && s.includes('id="wd-boot-pct"'), "identifiants lus par le minuteur d'allumage");
console.log("idle-wandoos-allumage-stable-v1 : OK");
