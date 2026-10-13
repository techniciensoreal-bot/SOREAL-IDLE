import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-13) : une fois que le cube passe au tiers 1, les statistiques Aventure n'affichent plus que le chiffre mauve entre parenthèses « (+68) », sans le mot « cube ». */
const scene = readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8");
assert.ok(scene.includes("var cubePalierN=Math.floor(number_(a&&a.cubeTier&&a.cubeTier.tier));"), "le palier du cube est lu sur l'état d'Aventure");
assert.ok(scene.includes("' (+'+cubeTexte+(cubePalierN>=1?'':' cube')+')'"), "« cube » n'apparaît qu'avant le palier 1");
const texte = (palier, valeur) => " (+" + valeur + (palier >= 1 ? "" : " cube") + ")";
assert.equal(texte(0, 68), " (+68 cube)");
assert.equal(texte(1, 68), " (+68)");
assert.equal(texte(3, 68), " (+68)");
console.log("idle-cube-tier1-bonus-sans-mot-v1: OK");
