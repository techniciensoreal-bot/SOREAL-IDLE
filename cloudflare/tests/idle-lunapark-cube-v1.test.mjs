import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-10) : luna park derrière la borne, bouton « Fight » gardé tel quel, popup quand le Cube de l'infini change de palier. */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const cube = readFileSync("cloudflare/public/modules/cube-palier-v1.js", "utf8");
const html = readFileSync("cloudflare/public/index.html", "utf8");
const dict = JSON.parse(readFileSync("cloudflare/public/modules/traduction-anglais-dict-v1.json", "utf8"));

// Luna park : décor SVG derrière la borne (grande roue, guirlandes, chapiteau, ballons), animations en boucle sans à-coup, coupées en mouvement réduit.
assert.ok(ui.includes("const BORNE_LUNAPARK_IDLE_V2=") && ui.includes('<div class="bn-lunapark" aria-hidden="true">${BORNE_LUNAPARK_IDLE_V2}</div>'));
for (const k of ["lp-roue", "lp-ampoule", "lp-ballon", "lp-fanion", "lp-wagon"]) assert.ok(ui.includes(k), k);
const lp = css.slice(css.indexOf("Luna park derrière la borne"));
for (const k of ["lpAmp", "lpScint", "lpFlotte", "lpFanion"]) assert.ok(new RegExp("@keyframes " + k + "\{0%,100%\{").test(lp), k + " : départ = arrivée");
assert.ok(/@keyframes lpTourne\{from\{transform:rotate\(0\)\}to\{transform:rotate\(360deg\)\}\}/.test(lp), "la roue fait un tour exact");
assert.ok(lp.includes("prefers-reduced-motion:reduce"), "mouvement réduit");
// Le bouton garde le mot « Fight » dans les deux langues (jamais traduit).
assert.ok(/class="soreal-idle-boss-control-v39 start"\s+data-sans-traduction/.test(ui), "Fight n'est pas traduit");
// Popup du Cube : annoncé seulement quand le palier monte (une fois), rien du palier suivant.
assert.ok(cube.includes("Ton Cube de l’infini vient de se transformer !") && cube.includes("palier>ancien"), "popup à la montée de palier");
assert.ok(!cube.includes(".suivant"), "rien du palier suivant (règle n°2)");
assert.ok(html.includes("/modules/cube-palier-v1.js"), "module chargé");
assert.equal(dict["Ton Cube de l’infini vient de se transformer !"], "Your Infinity Cube just transformed!");
console.log("idle-lunapark-cube-v1: OK");
