import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-10) : « les barres d'entraînement avancé avancent de manière saccadée » : le remplissage était écrit toutes les 150 ms ; il est maintenant dessiné à chaque image (requestAnimationFrame), transform seulement. */
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
assert.ok(meta.includes("function atImagesIdleV1_()") && meta.includes("requestAnimationFrame(atImagesIdleV1_)") && meta.includes("atDemarrerImagesIdleV1_();"), "remplissage à chaque image");
const tick = meta.slice(meta.indexOf("function atTickIdleV1_()"), meta.indexOf("setInterval(atTickIdleV1_,150)"));
assert.ok(!/rempl\.style\.transform=tr/.test(tick), "le tick de 150 ms n'écrit plus le remplissage");
console.log("idle-barres-avance-fluides-v1: OK");
