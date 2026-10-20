import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Machine à remonter le temps (Norman, 2026-10-20) : le dessin vit dans modules/machine-dessin-v1.js. Garde : balisage SVG statique que le redessin de la page laisse en place (data-morph-vivant), roues engrenées
 * (dents, sens opposés, décalage calculé), animations par WAAPI (la VITESSE change, jamais la phase), mouvement réduit respecté, textes échappés, image du mob construite comme celle de la scène d'Aventure.
 */
const src = readFileSync(new URL("../public/modules/machine-dessin-v1.js", import.meta.url), "utf8");
const window = {};
const sandbox = { window, document: { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null }, matchMedia: () => ({ matches: false }), performance, requestAnimationFrame: () => 0, URLSearchParams, encodeURIComponent, WeakSet };
vm.runInNewContext(src, sandbox);
const D = window.__SOREAL_IDLE_TM_DESSIN_V1__;
assert.ok(D && ["defs", "centre", "hautEnergie", "hautMagie", "rafraichir", "maj", "urlMob"].every((k) => typeof D[k] === "function"));
assert.ok(Array.isArray(window.__SOREAL_IDLE_APRES_REDESSIN_V1__) && window.__SOREAL_IDLE_APRES_REDESSIN_V1__.length === 1, "inscrit au redessin de la page (règle n°4)");

// Le centre : un seul SVG vivant, 7 roues engrenées (5 + 2 petites), vitesse et butin affichés, image du mob.
const svg = D.centre({ ticks: 37, mob: { zone: "forest", boss: 0, seed: 2, name: "Le Balourd" }, butin: "+1,24 Qa Or" });
assert.ok(svg.startsWith("<svg") && svg.includes('data-morph-vivant="1"') && svg.includes('data-tmm-centre="1"'));
const roues = svg.match(/class="tmm-rot" data-dents="(\d+)" data-sens="(-?1)" data-off="(-?[\d.]+)"/g) || [];
assert.equal(roues.length, 7, "sept roues dans la baie");
const sens = roues.slice(0, 5).map((r) => Number(/data-sens="(-?1)"/.exec(r)[1]));
assert.deepEqual(sens, [1, -1, 1, -1, 1], "deux roues voisines tournent en sens contraire");
assert.ok(svg.includes('id="tmmVitesse"') && svg.includes(">37 /s<") && svg.includes("+1,24 Qa Or") && svg.includes("Le Balourd"));
assert.ok(svg.includes("/api/idle/media/mob?zone=forest&amp;boss=0&amp;seed=2&amp;name=Le+Balourd"), "même route d'image que la scène d'Aventure");
assert.ok(svg.includes('id="tmmAiguille"') && svg.includes("rotate(") && svg.includes('class="tmm-piece"'), "cadran et pièces");
// Sans butin : un cadran d'horloge qui attend, aucune image.
const sans = D.centre({ ticks: 1, mob: null, butin: "" });
assert.ok(sans.includes('id="tmmAttente"') && !sans.includes('id="tmmImage"'));
// Titan : route des titans.
assert.equal(D.urlMob({ titan: "gordon" }), "/api/idle/media/titan?id=gordon");
assert.equal(D.urlMob({ zone: "sewers", boss: 1, seed: -1 }), "/api/idle/media/mob?zone=sewers&boss=1&seed=0");
assert.equal(D.urlMob(null), "");
// Aucun texte non échappé dans le dessin.
const piege = D.centre({ ticks: 5, mob: { zone: "forest", boss: 0, seed: 0, name: '<img src=x onerror=alert(1)>' }, butin: "<b>" });
assert.ok(!piege.includes("<img src=x") && !piege.includes("<b>") && piege.includes("&lt;img"), "textes échappés");
assert.ok(D.hautEnergie().includes("tmm-rot") && D.hautMagie().includes("tmm-anneau") && D.hautMagie().includes("data-morph-vivant"));
assert.ok(D.defs().includes('id="tmmPignon"') && D.defs().includes('id="tmmOrbe"'));

// Le code : la phase ne saute jamais (playbackRate), vitesse lissée, mouvement réduit, 50 tiques par seconde au plafond.
assert.ok(src.includes("playbackRate") && src.includes("iterations:Infinity") && !/\.animate\([^)]*\)[\s\S]{0,40}duration:\s*vue/.test(src), "la vitesse change par playbackRate, jamais la durée");
assert.ok(src.includes("prefers-reduced-motion") && src.includes("if(calme)return;"), "mouvement réduit : rien ne tourne");
assert.ok(src.includes("Math.min(50,") && src.includes("tourDeReference"), "plafond de 50 tiques par seconde");
// Page : tours Énergie (gauche) et Magie (droite), Magie seulement une fois débloquée.
const page = readFileSync(new URL("../public/modules/augmentations-page-v1.js", import.meta.url), "utf8");
assert.ok(page.includes("tmm-tour") && page.includes("tmm-gauche") && page.includes("tmm-droite") && page.includes("(magicOk?tour('or'"), "tour de droite seulement avec Blood Magic");
assert.ok(page.includes("D.maj(vue)"), "la machine suit chaque synchro");
const idx = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
assert.ok(/soreal-idle-machine\.css/.test(idx) && /machine-dessin-v1\.js/.test(idx) && idx.indexOf("machine-dessin-v1.js") < idx.indexOf("augmentations-page-v1.js"), "chargé avant la page");
console.log("idle-machine-dessin-v1: OK");
