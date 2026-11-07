import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-07) : image détourée « Time Machine PC » (trois panneaux, PC seulement ; le téléphone viendra avec d'autres images) : un petit cadre pour l'image du mob, un autre pour le nom et le butin, un effet d'écran sur
 * le mob, des écritures spéciales (science-fiction), un vrai tas d'Or et des pièces qui entrent par le haut de la sortie et tombent DANS le tas. Cette garde vérifie que tout reste branché : zones mesurées, CSS, police hébergée, tas.
 */
const zones = JSON.parse(fs.readFileSync("cloudflare/public/machine-v3/zones.json", "utf8"));
assert.deepEqual(Object.keys(zones), ["tour-energie", "centre", "tour-magie"], "trois tranches");
assert.ok(new Set(Object.values(zones).map((z) => z.hauteur)).size === 1, "même hauteur pour les trois : posées bord à bord");
for (const nom of ["tour-energie", "centre", "tour-magie"]) assert.ok(fs.statSync("cloudflare/public/machine-v3/" + nom + ".webp").size > 50000, "image " + nom);
const c = zones.centre.zones;
assert.ok(c.mob && c.info && c.mob.l < c.info.l / 2, "un petit cadre pour le mob, un grand pour le nom et le butin");
assert.ok(Math.abs(c.mob.y - c.info.y) < 0.002 && Math.abs(c.mob.h - c.info.h) < 0.002, "les deux cadres du haut sont alignés");

const css = fs.readFileSync("cloudflare/public/soreal-idle-machine.css", "utf8");
assert.ok(css.includes("/machine-v3/centre.webp") && css.includes("/machine-v3/tour-energie.webp") && css.includes("/machine-v3/tour-magie.webp"), "trois images en fond");
assert.ok(css.includes("grid-template-columns:576fr 762fr 580fr"), "colonnes proportionnelles aux largeurs d'origine (même hauteur)");
assert.ok(css.includes(".tmm-ecran-mob") && css.includes("tmmBalayage") && css.includes("repeating-linear-gradient(0deg,rgba(0,0,0,.34)"), "effet d'écran sur le mob (lignes de balayage, vignette, bande)");
assert.ok(/will-change:transform/.test(css) && /@keyframes tmmBalayage\{0%\{transform:translateY\(-110%\)\}100%\{transform:translateY\(420%\)\}\}/.test(css), "la bande ne bouge que par transform (processeur graphique), de l'extérieur à l'extérieur (boucle sans à-coup)");
assert.ok(css.includes("font-family:Orbitron") && css.includes("skewX(-8deg)"), "écritures spéciales : Orbitron, inclinées");
const fonts = fs.readFileSync("cloudflare/public/fonts/fonts.css", "utf8");
assert.ok(fonts.includes("font-family:'Orbitron'") && fonts.includes("/fonts/orbitron-bold.ttf") && fs.existsSync("cloudflare/public/fonts/orbitron-bold.ttf"), "police Orbitron hébergée");

const d = fs.readFileSync("cloudflare/public/modules/machine-dessin-v1.js", "utf8");
assert.ok(d.includes('viewBox="0 0 762 753"') && d.includes('class="tmm-ecran-mob"'), "centre dessiné dans la viewBox de l'image, effet d'écran posé par-dessus");
assert.ok(d.includes('preserveAspectRatio="xMidYMid slice"'), "l'image du mob remplit son cadre");
/* le tas : de vraies pièces (ellipses d'or), aucune petite pièce ; les pièces qui tombent entrent par le haut (rognées) et s'enfoncent dans le tas */
const ctxMod = { window: {}, document: { getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; } }, matchMedia: () => ({ matches: false }), requestAnimationFrame() { return 0; }, performance: { now: () => 0 }, IntersectionObserver: undefined };
ctxMod.window = ctxMod;
new Function("window", "document", "matchMedia", "requestAnimationFrame", "performance", d)(ctxMod, ctxMod.document, ctxMod.matchMedia, ctxMod.requestAnimationFrame, ctxMod.performance);
const D = ctxMod.__SOREAL_IDLE_TM_DESSIN_V1__;
for (const niv of [0, 4, 9]) {
  const t = D.tasInterieur(niv);
  assert.ok(/<ellipse /.test(t) && !/<circle/.test(t), "tas niveau " + niv + " : des pièces ovales, aucune petite pièce ronde dessus");
}
const n = (niv) => (D.tasInterieur(niv).match(/<ellipse /g) || []).length;
assert.ok(n(0) >= 5 && n(9) > n(0) && n(9) <= 50, "le tas grossit avec le niveau (" + n(0) + " -> " + n(9) + " pièces)");
assert.ok(d.includes("var debut=-46,fin=sommetTas(niv)+24-1142") && /opacity:1,offset:\+f\.toFixed\(4\)/.test(d), "pièce : entre au-dessus du bord de la sortie, tombe jusqu'au sommet du tas puis s'y enfonce (jamais effacée avant)");
assert.ok(d.includes("tas.innerHTML=tasInterieur(nv);reglerPieces(racine);"), "un nouveau niveau de tas refait la chute");
const ent = fs.readFileSync("cloudflare/public/_headers", "utf8");
assert.ok(ent.includes("/machine-v3/*"), "images en cache immuable");
console.log("idle-machine-image-pc-v1: OK");
