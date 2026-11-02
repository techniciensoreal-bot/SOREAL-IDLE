// Bouton de menu Money Pit refait (Norman, 2026-11-02) : contour d'herbe verte et trou au milieu, pièce à gauche (animée quand le Money Pit est disponible), roue à droite (qui tourne quand elle est prête).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("cloudflare/public/soreal-idle-menus-boutons-v1.css", "utf8").split(String.fromCharCode(13)).join("");
const i = css.indexOf("/* moneyPit : bouton refait");
assert.ok(i > 0, "bloc du bouton refait présent");
const bloc = css.slice(i, css.indexOf("@media (prefers-reduced-motion:reduce)", i) > 0 ? css.indexOf("@media (prefers-reduced-motion:reduce)", i) : undefined);

// fond : herbe sur les deux bords, trou (dégradé radial) au centre, vert en contour ; le tout dans deco::before, donc SOUS le liseré (deco::after)
assert.match(bloc, /\[data-menu-id-v1="moneyPit"\] \.soreal-idle-nav-deco-v1::before\{background:url\("data:image\/svg\+xml,[^"]+"\) center\/88% 100% no-repeat,rgb\(20,124,58\)\}/, "trou creusé au milieu sur un fond vert uni : aucune herbe dessinée (ni bandes de bord, ni zigzags)");
assert.ok(!/\[data-menu-id-v1="moneyPit"\][^{]*::after\{background:[^}]*svg/.test(bloc), "le liseré (::after) reste celui du cadre, au-dessus");

// icônes : une pièce à gauche, une roue à droite, carrées
assert.match(bloc, /\.nb-g\{background:url\("data:image\/svg\+xml,[^"]+"\) center\/contain no-repeat;aspect-ratio:1\/1;width:auto;left:13\.5cqw\}/, "pièce à gauche");
assert.match(bloc, /\.nb-d\{background:url\("data:image\/svg\+xml,[^"]+"\) center\/contain no-repeat;aspect-ratio:1\/1;width:auto;right:13\.5cqw\}/, "roue à droite");

// animations : rien au repos ; pièce quand le Money Pit est disponible (vert), roue quand elle est prête (jaune) ; seulement des transformations
assert.match(bloc, /\.soreal-idle-nav-money-green-v1 \.soreal-idle-nav-deco-v1 \.nb-g\{animation:nbV1_piecepit [\d.]+s ease-in-out infinite\}/, "la pièce se retourne quand le pit est dispo");
assert.match(bloc, /\.soreal-idle-nav-money-yellow-v1 \.soreal-idle-nav-deco-v1 \.nb-d\{animation:nbV1_rouepit [\d.]+s linear infinite\}/, "la roue tourne quand elle est prête");
assert.match(bloc, /\.nb-g,[^{]*\.nb-d\{animation:none\}/, "aucune animation au repos");
const kPiece = /@keyframes nbV1_piecepit\{([^@]*?)\}\}/.exec(bloc), kRoue = /@keyframes nbV1_rouepit\{([^@]*?)\}\}/.exec(bloc);
assert.ok(kPiece && kRoue, "images clés présentes");
assert.ok(/^0%,100%\{transform:scaleX\(1\)/.test(kPiece[1]), "pièce : boucle parfaite (0 % = 100 %)");
assert.ok(!/filter|box-shadow|opacity/.test(kPiece[1] + kRoue[1]), "seulement des transformations");
assert.match(kRoue[1], /from\{transform:rotate\(0\)\}to\{transform:rotate\(360deg\)/, "roue : un tour complet (boucle parfaite)");

// prefers-reduced-motion coupe les animations
const reduit = css.slice(css.indexOf("@media (prefers-reduced-motion:reduce)"));
assert.ok(reduit.includes('[data-menu-id-v1="moneyPit"][data-menu-id-v1] .soreal-idle-nav-deco-v1 .nb-g'), "animations coupées en mouvement réduit");

console.log("idle-bouton-money-pit-v1 : OK");
