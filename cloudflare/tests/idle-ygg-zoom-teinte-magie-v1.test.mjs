import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-21) : « quand on mange les fruits Grenades, le fruit qui est zoomé à l'écran perd son filtre bleuté ». Les fruits de Magie (Grenade, Puissance β) ont une carte « magie » dont la vitre porte un calque de teinte (mix-blend-mode:hue) ;
 * la copie zoomée vit sur la page entière (position fixed, dans body), donc hors de la vitre : elle doit recevoir le même calque, découpé sur la silhouette du fruit.
 */
const src = readFileSync(new URL("../public/modules/yggdrasil-elfes-v1.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");

// 1. Le calque de la vitre d'une carte magie existe toujours (la référence).
assert.ok(src.includes(".ygg-carte.magie .ygg-vitre::after{") && src.includes("linear-gradient(160deg,#22e8c4,#1b9ad8);mix-blend-mode:hue;opacity:.9"), "teinte de la vitre d'une carte magie");

// 2. Le fruit zoomé reçoit le même dégradé, même mode de fusion, même opacité, découpé sur l'image.
assert.ok(src.includes(".ygg-zoom-v1.magie::after{") && /\.ygg-zoom-v1\.magie::after\{[^}]*linear-gradient\(160deg,#22e8c4,#1b9ad8\);mix-blend-mode:hue;opacity:\.9/.test(src), "même teinte que la vitre");
assert.ok(/\.ygg-zoom-v1\.magie::after\{[^}]*mask:var\(--ygg-zoom-src\) center\/contain no-repeat/.test(src), "calque découpé sur la silhouette du fruit (le fond transparent n'est jamais coloré)");

// 3. La copie zoomée : un conteneur (isolé) portant l'image ; la classe « magie » vient de la carte du fruit ; la variable donne l'image au masque.
const i = src.indexOf("function zoomFruit_(img,k,rot){");
const corps = src.slice(i, src.indexOf("document.body.appendChild(e);", i));
assert.ok(corps.includes("img.closest('.ygg-carte.magie')"), "la teinte dépend de la carte du fruit (magie), jamais du fruit seul");
assert.ok(corps.includes("e.className='ygg-zoom-v1'+(magie?' magie':'')") && corps.includes("isolation:isolate") && corps.includes("--ygg-zoom-src:url("), "conteneur isolé, classe magie, image du masque");
assert.ok(corps.includes("data-morph-garder") && corps.includes("position:fixed"), "toujours posée sur la page entière et gardée par le redessin");
console.log("idle-ygg-zoom-teinte-magie-v1: OK");
