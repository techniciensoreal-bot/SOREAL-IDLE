// Norman (2026-10-30) : l'image « Wandoos Fond PC » (salle de serveurs aux néons) en fond du cadre de Wandoos ; le titre reste au-dessus, le dessin dépasse en haut, à gauche et à droite.
import fs from "node:fs";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const img = fs.readFileSync("cloudflare/public/wandoos/fond-pc-v1.webp");
assert.equal(img.subarray(0, 4).toString("latin1"), "RIFF", "fichier WebP");
assert.equal(img.subarray(8, 12).toString("latin1"), "WEBP", "fichier WebP");
assert.ok(img.length < 200 * 1024, "image compressée (moins de 200 Ko, l'original PNG fait 2,3 Mo) : " + img.length);
// dimensions 1024 x 1024 (VP8 / VP8L / VP8X)
const f = img.subarray(12, 16).toString("latin1");
let l = 0, h = 0;
if (f === "VP8 ") { l = img.readUInt16LE(26) & 0x3fff; h = img.readUInt16LE(28) & 0x3fff; }
else if (f === "VP8L") { const b = img.readUInt32LE(21); l = (b & 0x3fff) + 1; h = ((b >> 14) & 0x3fff) + 1; }
else if (f === "VP8X") { l = 1 + (img[24] | (img[25] << 8) | (img[26] << 16)); h = 1 + (img[27] | (img[28] << 8) | (img[29] << 16)); }
assert.deepEqual([l, h], [1024, 1024], "1024 x 1024 comme dessiné");
const css = lire("cloudflare/public/soreal-idle-itopod.css"), hd = lire("cloudflare/public/_headers");
assert.ok(css.includes("var(--i-photo,linear-gradient(transparent,transparent))") , "la photo est un calque du fond existant (même !important : aucune dette de plus)");
assert.ok(css.includes('@media (min-width:701px){\n  html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-page-root-v28[data-menu="wandoos"]{--i-photo:url("/wandoos/fond-pc-v1.webp") center/cover no-repeat}'), "ordinateur seulement (le téléphone garde son fond)");
assert.ok(css.includes('[data-menu="wandoos"]>.soreal-idle-page-head-v28{position:relative;z-index:1;margin:10px 22px 14px}'), "le titre est au-dessus et rentré : le dessin dépasse en haut, à gauche et à droite");
assert.ok(hd.includes("/wandoos/*\n  Cache-Control: public, max-age=31536000, immutable"), "image versionnée par son nom : cache immuable");
assert.ok(css.includes('[data-menu="wandoos"]{--i-a:#84cc16;--i-b:#3f6212;'), "le titre prend la couleur du menu (le vert du bouton, --nav-color #84cc16)");
assert.ok(css.includes('.wd-ecran::after{background:radial-gradient') && css.includes('.wd-clavier::after{content:""') && css.includes('.wd-crt::before{content:""'), "reflets mauve (gauche) et vert (droite) sur la vitre, le clavier et la coque");
assert.ok(css.includes("-webkit-mask-box-image:url(\"/api/idle/media/banner?name=wandoos.webp\")"), "la teinte de la coque est découpée dans la silhouette de l'image du moniteur (rien autour)");
console.log("idle-wandoos-fond-pc-v1 : OK");
