import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-03) : ShopMusic.opus joué en boucle tant qu'on est dans le Shop, en plus de l'ambiance d'Aventure. */
const mod = readFileSync("cloudflare/public/modules/shop-music-v1.js", "utf8");
assert.ok(mod.includes("idle/ambient/ShopMusic.opus"), "bon fichier R2");
assert.ok(mod.includes("audio.loop=true"), "en boucle");
assert.ok(mod.includes("getAttribute('data-menu')==='shop'"), "joué seulement dans le Shop");
assert.ok(!mod.includes("__SOREAL_IDLE_AMBIENT_AUDIO_V1__"), "ne touche pas à l'ambiance d'Aventure : les deux se superposent");

const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(index.includes("/modules/shop-music-v1.js"), "module chargé");

const media = readFileSync("cloudflare/src/idle-media-v1.js", "utf8");
assert.ok(media.includes('IDLE_AMBIANT_R2_PREFIX+"ShopMusic.opus"'), "clé de la musique du Shop");
assert.ok(media.includes("IDLE_SHOP_MUSIQUE_R2_CLE_V1.toLowerCase())return false"), "exclue de la liste d'ambiance d'Aventure (jamais tirée au hasard)");
console.log("idle-shop-music-v1: OK");
