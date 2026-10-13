import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-13) : « le bandeau en direct fait baisser les fps, enlève la transparence » : pas d'opacité animée ni de masque dégradé sur le bandeau, et pas de mesure de mise en page à chaque image. */
const flux = readFileSync("cloudflare/public/modules/flux-v1.js", "utf8");
const css = flux.slice(flux.indexOf("function css(){"), flux.indexOf("function css(){") + 3500);
assert.ok(!/mask-image/.test(css), "plus de masque dégradé sur la fenêtre de défilement");
assert.ok(!/transition:opacity/.test(css) && !/#sorealIdleFluxV1\.sif-off\{opacity/.test(css), "plus d'opacité animée sur le bandeau");
assert.ok(css.includes("#sorealIdleFluxV1.sif-off{display:none;pointer-events:none}"), "le bandeau se masque d'un coup");
assert.ok(flux.includes("premier.__largeurV1||(premier.__largeurV1=premier.getBoundingClientRect().width)"), "largeur mesurée une seule fois par information");
console.log("idle-flux-bandeau-opaque-v1: OK");
