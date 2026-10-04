import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

/*
 * Norman (2026-10-04) : « dans le shop, les mêmes images que sur la page 4G's Sellout Shop ». Les 71 PNG de la page wiki sont dans public/shop/ ; chaque article de la Boutique AP a son image (association de la page).
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const catalogue = readFileSync("cloudflare/src/idle-sellout-shop-v1.js", "utf8");
const manifeste = JSON.parse(readFileSync("cloudflare/public/shop/manifest.json", "utf8"));

assert.equal(Object.keys(manifeste).length, 71, "71 images de la page wiki");
for (const fichier of Object.values(manifeste)) {
  assert.ok(existsSync("cloudflare/public/shop/" + fichier), fichier);
  assert.equal(readFileSync("cloudflare/public/shop/" + fichier).subarray(0, 4).toString("hex"), "89504e47", fichier + " : PNG");
  assert.ok(/^[a-z0-9-]+\.png$/.test(fichier), "nom propre : " + fichier);
}
assert.equal(readdirSync("cloudflare/public/shop").length, 72, "71 images + manifest");

const carte = ui.match(/const IDLE_SHOP_IMAGES_V1=(\{[^}]*\});/);
assert.ok(carte, "table article -> image");
const table = JSON.parse(carte[1]);
const ids = [...catalogue.matchAll(/\{ id: "([A-Za-z0-9]+)", category/g)].map((m) => m[1]);
assert.ok(ids.length >= 80);
for (const id of ids) {
  assert.ok(table[id], "image manquante pour l'article " + id);
  assert.ok(existsSync("cloudflare/public/shop/" + table[id] + ".png"), "fichier absent : " + table[id]);
}
// Anti-spoil : l'image n'est posée que dans la carte d'un article dont l'effet est actif (le catalogue est filtré avant).
assert.ok(ui.includes("filter(function(item){return item&&item.effectActive===true;})"));
assert.ok(ui.includes("imageArticleShopIdleV1_(item.id)+idleHtml_(texte.name)"));
console.log("idle-shop-images-v1: OK");
