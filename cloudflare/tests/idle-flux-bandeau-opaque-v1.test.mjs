import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-13) : « le bandeau en direct fait baisser les fps, enlève la transparence » : pas de masque dégradé sur le bandeau, et pas de mesure de mise en page à chaque image.
 * Norman (2026-10-27) : « le bandeau doit apparaître et disparaître en fondu ; sur PC, les informations n'apparaissent parfois pas tout à droite mais au milieu » : seul le fondu d'apparition et de disparition (0,6 s) est animé,
 * le défilement reste en transform ; le bandeau est masqué par visibility (et non display:none) pour que sa largeur reste mesurable ; le repli de largeur est celui de la page, jamais 300 px.
 */
const flux = readFileSync("cloudflare/public/modules/flux-v1.js", "utf8");
const css = flux.slice(flux.indexOf("function css(){"), flux.indexOf("function css(){") + 4200);
assert.ok(!/mask-image/.test(css), "plus de masque dégradé sur la fenêtre de défilement");
assert.ok(css.includes("#sorealIdleFluxV1.sif-off{opacity:0;visibility:hidden;pointer-events:none;transition:opacity .6s ease,visibility 0s linear .6s}"), "le bandeau apparaît et disparaît en fondu");
assert.ok(!css.includes("sif-off{display:none"), "masqué par visibility : sa largeur reste mesurable (première information par la droite)");
assert.ok(!/will-change:opacity/.test(css), "aucune couche permanente pour l'opacité");
assert.ok(flux.includes("document.documentElement.clientWidth"), "repli sur la largeur de la page, jamais au milieu");
assert.ok(flux.includes("premier.__largeurV1||(premier.__largeurV1=premier.getBoundingClientRect().width)"), "largeur mesurée une seule fois par information");
console.log("idle-flux-bandeau-opaque-v1: OK");
