// Machine temporelle : le fond des 4 barres du haut vides est la couleur de la page, très foncée (Norman, 2026-11-02).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8").split(String.fromCharCode(13)).join("");
const i = css.indexOf('[data-sj-menu="machine"] .soreal-idle-native-v4 .soreal-idle-hud-v2 .soreal-idle-energybar-wrap-v11{');
assert.ok(i > 0, "règle du fond des barres vides de la Machine temporelle");
const regle = css.slice(i, css.indexOf("}", i));
assert.ok(/,#04201e!important/.test(regle), "base turquoise très foncée sous le verre");
const m = /#04201e/.exec(regle)[0], lum = [1, 3, 5].map((k) => parseInt(m.slice(k, k + 2), 16));
assert.ok(Math.max(...lum) < 48, "presque noir");
console.log("idle-machine-barres-vides-sombres-v1 : OK");
