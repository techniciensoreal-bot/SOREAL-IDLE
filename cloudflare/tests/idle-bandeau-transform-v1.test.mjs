import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Audit 60 fps (Norman, 2026-10-26, Chrome, partie B). Le bandeau du haut est sur TOUTES les pages : tout ce qu'il anime coûte partout.
 *  - Barre de vie (1 200 px) : sa largeur s'animait en continu (mise en page + dessin à chaque image) ; sans cette animation, +6 images/s. Elle garde sa pleine largeur et glisse par transform.
 *  - Braises de l'énergie et code de la 3e ressource : animaient background-position (motif repeint à chaque image) ; ils glissent maintenant par transform, sur une couche à eux.
 * Règle du dépôt : on n'anime que transform et opacity.
 */
const menus = readFileSync("cloudflare/public/modules/ui-menus-v1.js", "utf8");
const pv = menus.slice(menus.indexOf("function majHudPvIdleV2_("), menus.indexOf("function jumeauxClicIdleV1_"));
assert.ok(pv.includes("bar.style.width='100%';") && pv.includes("bar.style.transform='translate3d('+(-(100-pct)).toFixed(2)+'%,0,0)';"), "la barre de vie glisse par transform, pleine largeur");
assert.ok(!pv.includes("bar.style.width=pct"), "plus de largeur animée");
assert.ok(pv.includes("bar.dataset.idlePctHudV1=pct.toFixed(2);"), "le pourcentage reste lisible (diagnostic)");
const diag = readFileSync("cloudflare/public/modules/diag-fluidite-v1.js", "utf8");
assert.ok(diag.includes("el.dataset&&el.dataset.idlePctHudV1!==undefined?el.dataset.idlePctHudV1:(el.style&&el.style.width)"), "le diagnostic lit le pourcentage posé par le jeu");
const hud = readFileSync("cloudflare/public/modules/hud-haut-v2.js", "utf8");
assert.ok(hud.includes("html body #sorealIdleHudPvBarV2{transition:transform .28s linear,background .4s ease,box-shadow .4s ease!important;will-change:transform}"), "transition sur le transform, couche propre");
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
assert.ok(css.includes("@keyframes sorealHudBgx{to{transform:translate3d(var(--p,79px),0,0)}}"), "braises et code glissent par transform");
assert.ok(!css.includes("@keyframes sorealHudBgx{to{background-position-x"), "plus d'animation de background-position pour ces motifs");
assert.ok(css.includes("left:calc(var(--p,79px)*-1);will-change:transform}"), "le motif déborde d'une période à gauche (le conteneur coupe)");
assert.ok(/\.soreal-idle-hud-v2 \.soreal-idle-bulles-v2\{display:block;position:absolute;inset:0;border-radius:inherit;overflow:hidden/.test(css), "le conteneur coupe ce qui déborde");

console.log("idle-bandeau-transform-v1: OK");
