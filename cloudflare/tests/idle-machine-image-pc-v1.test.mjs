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

const css = fs.readFileSync("cloudflare/public/soreal-idle-machine.css", "utf8") + " " + fs.readFileSync("cloudflare/public/machine-ecran-tv-v1.css", "utf8");
assert.ok(css.includes("/machine-v3/centre.webp") && css.includes("/machine-v3/tour-energie.webp") && css.includes("/machine-v3/tour-magie.webp"), "trois images en fond");
assert.ok(css.includes("grid-template-columns:576fr 762fr 580fr"), "colonnes proportionnelles aux largeurs d'origine (même hauteur)");
/* Écran de télé noir et blanc (Norman, 2026-11-10, remplace le voile vert et la bande lumineuse du 2026-11-07) : image en gris qui remplit tout le cadre, interférences (bandes qui décalent l'image), grain, lignes de balayage, vignette ; tout par transform / opacity */
assert.ok(css.includes(".tmm-ecran-mob") && css.includes("tmmBalayage") && css.includes("linear-gradient(0deg,rgba(0,0,0,.4) 0,rgba(0,0,0,.1) 38%"), "effet d'écran sur le mob (lignes de balayage, vignette, bande)");
assert.ok(!css.includes("grayscale(1)") && css.includes("filter:url(#tmmCrt)") && css.includes("2.7cqh") && !css.includes("rgba(255,40,40,.13)"), "l'écran est en couleurs ; tube cathodique : vitre bombée et aberration chromatique par un filtre, lignes de balayage douces, reflet et bords sombres (2026-11-11 : plus de grille de pixels rouge-vert-bleu)");
assert.ok(css.includes(".tmm-tv-img{") && css.includes("object-fit:cover"), "l'image remplit tout le cadre");
for (const k of ["tmmTvBandeE", "tmmTvBandeI", "tmmTvDecal", "tmmTvGrain", "tmmTvScintille"]) assert.ok(css.includes("@keyframes " + k), "interférence : " + k);
assert.ok(!css.includes("@keyframes tmmScintille{"), "l'ancien effet (voile vert) est remplacé");
/* la bande d'interférence et sa cale font le trajet inverse avec les mêmes durées : l'image ne glisse jamais, seul son décalage latéral se voit */
assert.ok(css.includes("@keyframes tmmTvBandeE{0%{transform:translateY(-15cqh)}40%,100%{transform:translateY(112cqh)}}") && css.includes("@keyframes tmmTvBandeI{0%{transform:translateY(15cqh)}40%,100%{transform:translateY(-112cqh)}}"), "bande et cale : trajets opposés, la bande attend hors du cadre (boucle sans à-coup)");
assert.ok(css.includes("will-change:transform") && css.includes("@keyframes tmmBalayage{0%{transform:translateY(-110%)}100%{transform:translateY(420%)}}"), "la bande claire ne bouge que par transform (processeur graphique), de l'extérieur à l'extérieur (boucle sans à-coup)");
/* tubes : l'image de chaque tour est AU-DESSUS du tube (::before percé d'un masque à la forme de l'ouverture mesurée), le tube est plus grand et dessous : le liquide passe derrière la machine (Norman, 2026-11-10) */
const tv = css;
assert.ok(tv.includes(".tmm-gauche::before") && tv.includes("tour-energie-cadre.webp") && tv.includes("tour-magie-cadre.webp") && tv.includes("centre-cadre.webp") && tv.includes("pointer-events:none"), "le cadre de Norman (ouvertures transparentes) est posé au-dessus de chaque carte et sert de filtre");
assert.ok(tv.includes(".tmm-gauche .tmm-tube{left:7.12%;top:32.27%;width:13.54%;height:40.64%;border-radius:0;z-index:0") && tv.includes(".tmm-droite .tmm-tube{left:80.17%;top:32.8%;width:13.97%;height:41.7%;border-radius:0;z-index:0") && tv.includes(".tmm-centre .tmm-ecran-mob{left:8.14%;top:6.24%;width:22.7%;height:19.65%;z-index:0}"), "tubes et écran : plus grands que leur ouverture mesurée, SOUS le cadre (z-index 0 < 1) : le liquide et l'image passent derrière la machine");
for (const n of ["tour-energie", "tour-magie", "centre"]) assert.ok(fs.existsSync("cloudflare/public/machine-v3/" + n + "-cadre.webp") && fs.existsSync("cloudflare/public/machine-v3/" + n + "-fond.webp"), n + " : image-cadre (ouvertures transparentes) et image-fond (ouvertures noires)");
assert.ok(tv.includes(".tmm-machine{grid-template-columns:532.2fr 762fr 535.9fr}") && tv.includes(".tmm-gauche{margin-top:3.7%}") && tv.includes(".tmm-droite{margin-top:2.91%}"), "tours réduites (échelle 0,924) et descendues : les connecteurs se font face (mesuré sur les trois cadres)");
assert.ok(tv.includes(".tmm-gauche .tmm-haut{left:46.35%;top:24.57%;width:10.94%;height:8.1%}") && tv.includes(".tmm-droite .tmm-haut{left:43.28%;top:24.83%;width:10.52%;height:8.1%}"), "rouage et orbe centrés dans les cercles du nouveau décor (mesurés sur la transparence)");
assert.ok(tv.includes("/machine-v3/tour-energie.webp") && tv.includes("/machine-v3/tour-magie.webp"), "les images des tours restent celles de Norman");
assert.ok(css.includes("font-family:Orbitron") && css.includes("skewX(-8deg)"), "écritures spéciales : Orbitron, inclinées");
const fonts = fs.readFileSync("cloudflare/public/fonts/fonts.css", "utf8");
assert.ok(fonts.includes("font-family:'Orbitron'") && fonts.includes("/fonts/orbitron-bold.ttf") && fs.existsSync("cloudflare/public/fonts/orbitron-bold.ttf"), "police Orbitron hébergée");

const d = fs.readFileSync("cloudflare/public/modules/machine-dessin-v1.js", "utf8");
assert.ok(d.includes('viewBox="0 0 762 753"') && d.includes('class="tmm-ecran-mob"'), "centre dessiné dans la viewBox de l'image, effet d'écran posé par-dessus");
assert.ok(d.includes("id=\"tmmCrt\"") && d.includes("feDisplacementMap") && d.includes("feOffset"), "filtre du tube cathodique (bombé + aberration chromatique)");
assert.ok(d.includes("POLYGONE_ECRAN") && d.includes('class="tmm-tv-img"') && d.includes("tmm-tv-bande"), "l'écran du mob : contour mesuré de l'ouverture, image HTML et bandes d'interférence");
assert.ok(!d.includes('<image id="tmmImage"'), "plus d'image SVG pour le mob (couche HTML en noir et blanc)");
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
assert.ok(d.includes("var debut=-86,fin=sommetTas(niv)+24-1142") && /opacity:1,offset:\+f\.toFixed\(4\)/.test(d), "pièce : entre au-dessus du bord de la sortie, tombe jusqu'au sommet du tas puis s'y enfonce (jamais effacée avant)");
assert.ok(d.includes("tas.innerHTML=tasInterieur(nv);reglerPieces(racine);"), "un nouveau niveau de tas refait la chute");
const ent = fs.readFileSync("cloudflare/public/_headers", "utf8");
assert.ok(ent.includes("/machine-v3/*"), "images en cache immuable");
console.log("idle-machine-image-pc-v1: OK");
