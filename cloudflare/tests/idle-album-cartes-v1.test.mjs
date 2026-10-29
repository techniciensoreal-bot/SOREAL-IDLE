// Norman (2026-10-29) : Chroniques de boss = album de collection (pochettes en plastique) ; au clic la carte sort de sa pochette et vient en zoom, on peut la faire tourner.
import fs from "node:fs";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const m = lire("cloudflare/public/modules/album-cartes-v1.js"), c = lire("cloudflare/public/soreal-idle-album.css"), u = lire("cloudflare/public/modules/ui-chroniques-v1.js"), i = lire("cloudflare/public/index.html"), k = lire("cloudflare/public/modules/carte-boss-magic-v1.js");
assert.ok(m.includes("window.__SOREAL_IDLE_ALBUM_V1__={pochette:pochette,rendre:rendre,ouvrir:ouvrir,page:page}") && m.includes("alb-plastique") && m.includes("alb-sorti") && m.includes("prefers-reduced-motion"), "module : pochette en plastique, carte qui sort, réduction des animations");
assert.ok(m.includes("grande.animate(") && m.includes("transformOrigin='0 0'"), "la carte vole de sa pochette à la fiche zoomée");
assert.ok(c.includes(".alb-plastique") && c.includes("repeat(3,minmax(0,1fr))") && c.includes("repeat(4,minmax(0,1fr))") && c.includes(".soreal-idle-album-v1::before"), "classeur : anneaux, 3 colonnes (4 sur grand écran), plastique");
assert.ok(u.includes("window.__SOREAL_IDLE_ALBUM_V1__.pochette(e,") && u.includes("const album=Boolean(window.__SOREAL_IDLE_ALBUM_V1__)"), "la collection des boss utilise les pochettes");
assert.ok(/soreal-idle-album\.css\?v=\d+/.test(i) && /album-cartes-v1\.js\?v=\d+/.test(i), "fichiers chargés");
assert.ok(k.includes("addEventListener('pointerdown'"), "rotation au doigt / à la souris");
assert.ok(lire("cloudflare/public/soreal-idle-carte-boss.css").includes("touch-action:pan-y"), "défilement vertical du texte conservé");
// anti-spoil : une pochette par boss découvert seulement, jamais de case vide
assert.ok(u.includes("entrees=entrees.filter(function(e){return e&&e.decouvert;})") && !m.includes("???"), "aucune pochette vide");
console.log("idle-album-cartes-v1 : OK");
// pages : tourner la page autour des anneaux, boutons, glissement du doigt, téléphone (9) et PC (8)
{
  const m2 = lire("cloudflare/public/modules/album-cartes-v1.js"), c2 = lire("cloudflare/public/soreal-idle-album.css"), u2 = lire("cloudflare/public/modules/ui-chroniques-v1.js");
  assert.ok(m2.includes("(min-width:640px)').matches?8:9") && m2.includes("rotateY(-172deg)") && m2.includes("transform-origin:0 50%"), "9 pochettes par page sur téléphone, 8 sur PC ; la feuille pivote autour des anneaux");
  assert.ok(m2.includes('onclick="window.__SOREAL_IDLE_ALBUM_V1__.page(-1)"') && m2.includes("page(1)") && m2.includes("addEventListener('touchend'"), "boutons précédent / suivant et glissement du doigt");
  assert.ok(m2.includes("'Page '+(p+1)+' / '+n") && !/boss découverts|\/ ?301/.test(m2), "numéro de page seulement (aucun total de boss)");
  assert.ok(u2.includes("window.__SOREAL_IDLE_ALBUM_V1__.rendre(cartesHtml)"), "la collection passe par l'album paginé");
  assert.ok(c2.includes(".alb-feuille{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))") && c2.includes(".alb-bouton"), "feuille 3 colonnes (4 sur grand écran), boutons");
}
console.log("idle-album-cartes-v1 pages : OK");
