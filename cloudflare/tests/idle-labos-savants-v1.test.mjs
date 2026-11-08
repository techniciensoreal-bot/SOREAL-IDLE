import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { IDLE_NGU_DIGGERS } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-11-08) : « transformer les mineurs d'or en Labos : des savants fous qui concoctent des potions ; style cartoon ». Garde du module des savants fous (modules/labos-savants-v1.js) :
 * un labo par mineur du moteur, une potion différente par labo, des scènes SVG en couches, un liquide découpé dans la forme réelle de chaque verre, des animations en boucle parfaite (règle n°3).
 */
const src = fs.readFileSync("cloudflare/public/modules/labos-savants-v1.js", "utf8");
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(src, ctx);
const S = ctx.window.__SOREAL_IDLE_LABOS_SAVANTS_V1__;
assert.ok(S && typeof S.scene === "function" && typeof S.css === "function", "module exposé");

// Un labo par mineur du moteur (mêmes identifiants), tous différents.
const ids = IDLE_NGU_DIGGERS.map((d) => d.id).sort();
assert.deepEqual(Object.keys(S.labos).sort(), ids, "un labo par mineur du moteur");
assert.deepEqual(Object.keys(S.cellules).sort(), ids, "une cellule de décor par labo");
assert.equal(new Set(Object.values(S.labos).map((l) => l.potion)).size, ids.length, "douze potions différentes");
assert.equal(new Set(Object.values(S.labos).map((l) => l.c.join())).size, ids.length, "douze couleurs de potion différentes");
assert.equal(new Set(Object.values(S.labos).map((l) => l.nom)).size, ids.length, "douze noms de labos différents");

// Les recadrages tombent dans l'image du décor (1262 x 848) avec la taille d'une scène (316 x 268).
for (const [id, [x, y]] of Object.entries(S.cellules)) assert.ok(x >= 0 && y >= 0 && x + 316 <= 1262 && y + 268 <= 848, "cellule de " + id + " dans le décor");

// Les formes intérieures des verres (mesurées sur le canal alpha) tiennent dans leur image.
const dims = { flacon: [274, 378], becher: [222, 324], tubeD: [265, 325], tubeG: [265, 325] };
for (const [k, [w, h]] of Object.entries(dims)) {
  const I = S.interieurs[k];
  assert.ok(I && I.p.startsWith("M") && I.p.endsWith("Z"), "chemin du verre " + k);
  assert.ok(I.x0 >= 0 && I.x1 <= w && I.y0 >= 0 && I.y1 <= h && I.x1 > I.x0 && I.y1 > I.y0, "intérieur de " + k + " dans son image");
}

// Une scène complète : décor, savant, établi, liquides et verre dans l'ordre des couches ; images fournies par l'appelant.
const img = { decor: "d.webp", etabli: "e.webp", flacon: "f.webp", tubes: "t.webp", becher: "b.webp" };
for (const id of ids) {
  const svg = S.scene(id, img, true);
  assert.ok(svg.startsWith("<svg") && svg.endsWith("</svg>") && svg.includes('class="lb lb-on"'), "scène de " + id);
  const ordre = ["d.webp", "lb-savant", "e.webp", "lbc-" + id + "-flacon", 'href="f.webp"'].map((m) => svg.indexOf(m));
  assert.ok(ordre.every((p) => p >= 0) && ordre.every((p, i) => i === 0 || p > ordre[i - 1]), "couches dans l'ordre : décor, savant, établi, liquide, verre (" + id + ")");
  assert.ok(!svg.includes("NaN") && !svg.includes("undefined"), "aucune valeur invalide dans " + id);
  const ouverts = (svg.match(/<g[ >]/g) || []).length, fermes = (svg.match(/<\/g>/g) || []).length;
  assert.equal(ouverts, fermes, "groupes SVG équilibrés dans " + id);
}
assert.ok(!S.scene("inconnu", img, true), "labo inconnu : rien");
assert.ok(!S.scene("drop", img, false).includes('class="lb lb-on"'), "au repos : aucune animation");

// Animations : boucle parfaite (période commune --T), seulement transform et opacity, mouvement réduit coupé.
const css = S.css();
const kf = [...css.matchAll(/@keyframes (\w+)\{([^@]*?)\}\s*(?=\n|$)/g)];
assert.ok(kf.length >= 15, "au moins quinze animations (articulations, cheveux, blouse, yeux, bouche, liquide, bulles)");
for (const [, nom, corps] of kf) {
  assert.ok(!/(?:^|[;{ ])(?:width|height|top|left|margin|background|filter)\s*:/.test(corps), "seuls transform et opacity animés : " + nom);
  const premier = /^(?:0%|0%,)/.test(corps), dernier = /100%/.test(corps);
  assert.ok(premier && dernier, "départ et arrivée identiques (0 % et 100 % groupés) : " + nom);
}
assert.ok(css.includes("--T:2.4s") && css.includes("prefers-reduced-motion"), "période commune et mouvement réduit");
for (const articulation of ["lb-bras-av", "lb-avbras-av", "lb-bras-ar", "lb-avbras-ar", "lb-tete", "lb-cheveux", "lb-pan"]) assert.ok(css.includes("." + articulation + "{animation"), "articulation animée : " + articulation);
// Pivots : chaque articulation tourne autour de son vrai point.
assert.ok(css.includes("transform-origin:47px 46px") && css.includes("transform-origin:57.5px 37.5px"), "épaule puis coude du bras avant");

// Anti-spoil (règle n°2) : aucun total « x / y » dans le module.
assert.ok(!/\d+\s*\/\s*(?:12|total)/.test(src.replace(/\/\*[\s\S]*?\*\//g, "")), "aucun total révélateur");
console.log("idle-labos-savants-v1: OK");
