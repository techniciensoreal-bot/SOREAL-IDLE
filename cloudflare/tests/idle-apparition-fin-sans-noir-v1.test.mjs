import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
/*
 * Norman (2026-11-21) : « souvent, après l'animation d'arrivée d'un boss, il y a un clignotement noir très rapide ». Pour les mises en scène des réapparitions, la scène (copie de l'image) est retirée puis le calque sombre s'efface en 0,12 s : un noir visible.
 * Le calque de ces mises en scène (app-boss-neuf) doit disparaître d'un coup, sans fondu ; seul l'effet en canvas garde son fondu.
 */
const src = readFileSync(new URL("../public/modules/apparition-boss-v1.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
const m = /function terminer\(\)\{([\s\S]*?)\n      \}\n      function demarrer/.exec(src);
assert.ok(m, "fonction terminer trouvée");
const corps = m[1];
const iNeuf = corps.indexOf("app-boss-neuf");
const iFondu = corps.indexOf("calque.style.opacity='0'");
assert.ok(iNeuf > 0 && iFondu > iNeuf, "le cas des mises en scène est traité AVANT le fondu");
const cas = corps.slice(iNeuf, iFondu);
assert.ok(/transition='none'/.test(cas) && /removeChild\(calque\)/.test(cas) && /return;/.test(cas), "le calque des mises en scène est retiré tout de suite, sans fondu");
console.log("idle-apparition-fin-sans-noir-v1 : OK");
