// Norman (2026-11-01) : « pour chaque liquide dans les bocaux, il y a une ligne blanche avec des coupures dans les vagues ; je veux la supprimer, juste garder les vagues. »
import fs from "node:fs";
import assert from "node:assert/strict";
const s = fs.readFileSync("cloudflare/public/modules/daycare-page-v1.js", "utf8");
assert.ok(!/\.gd-liq::after\{/.test(s), "plus de ligne blanche (pseudo-élément ::after) sur le liquide");
assert.ok(s.includes("animation:gd-onde 3.2s linear infinite"), "les vagues restent");
console.log("idle-garderie-liquide-sans-ligne-v1 : OK");
