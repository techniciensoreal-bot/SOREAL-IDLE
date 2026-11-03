import assert from "node:assert/strict";
import fs from "node:fs";

/* Norman (2026-11-03) : « quand le chat ou le chien pisse, il ne doit pas y avoir d'effets supplémentaires genre orage qui se superpose, des éclairs en même temps. Ce sont des petits nuke, donc ça doit rester sobre. » */
const src = fs.readFileSync(new URL("../public/modules/borne-led-v1.js", import.meta.url), "utf8");
const code = src.replace(/\/\*[\s\S]*?\*\//g, "");
const corps = (nom) => { const i = code.indexOf("function " + nom + "("); assert.ok(i >= 0, nom); return code.slice(i, code.indexOf("\nfunction ", i + 10)); };
assert.ok(/if\(z<2\|\|u<0\.5\)return;/.test(corps("nkApres")), "éclairs, gerbes, ondes et lettres arc-en-ciel : à partir du palier 2 seulement");
assert.ok(/if\(a&&z>=2&&u>0\.9\)/.test(corps("nkAvant")), "secousse de l'écran : à partir du palier 2 seulement");
assert.ok(/return z>=2\?\[/.test(corps("nkTrem")), "le mot ne tremble qu'à partir du palier 2");
// les scènes réservées aux petits Nukes (chat, chien, cul, ballon) ne sortent qu'aux paliers 0 et 1
assert.ok(/NK_PETITS_SEULEMENT=\[5,12,22\]/.test(code), "chat, chien et ballon : petits Nukes seulement");
console.log("idle-borne-nuke-petits-sobres-v1: OK");
