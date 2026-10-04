import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-04) : « Quand on va dans le menu Blood, on doit entendre idle/ambient/BloodMagic.opus. Elle doit reprendre où elle s'était arrêtée quand on y retourne, avec un fade in et fade out quand on
 * quitte. » (Même mécanique que la musique du Shop, 2026-10-03.)
 */
const src = readFileSync("cloudflare/public/modules/shop-music-v1.js", "utf8");
const media = readFileSync("cloudflare/src/idle-media-v1.js", "latin1");
const index = readFileSync("cloudflare/public/index.html", "utf8");

assert.ok(src.includes("idle/ambient/BloodMagic.opus") && src.includes("idle/ambient/ShopMusic.opus"), "les deux fichiers R2");
assert.ok(src.includes("{menu:'sang'"), "joué dans le menu Blood Magic (data-menu = sang)");
assert.ok(!/currentTime\s*=/.test(src), "jamais remise à zéro : elle reprend là où elle s'était arrêtée");
assert.ok(src.includes("audio.loop=true") || src.includes("m.audio.loop=true"), "en boucle");
assert.ok(!src.includes("__SOREAL_IDLE_AMBIENT_AUDIO_V1__"), "ne touche pas à l'ambiance d'Aventure");
assert.ok(index.includes("/modules/shop-music-v1.js"), "module chargé");
assert.ok(media.includes('IDLE_AMBIANT_R2_PREFIX+"BloodMagic.opus"') && media.includes("IDLE_BLOOD_MUSIQUE_R2_CLE_V1.toLowerCase())return false"), "exclue des sons d'ambiance d'Aventure tirés au hasard");
assert.ok(media.includes("IDLE_SHOP_MUSIQUE_R2_CLE_V1.toLowerCase())return false"), "la musique du Shop l'est toujours");

// Comportement : faux navigateur (menu courant, éléments Audio, horloge).
let menu = "aventure";
const audios = [];
class FauxAudio {
  constructor(url) { this.url = url; this.volume = 1; this.paused = true; this.currentTime = 0; this.loop = false; this.ecritures = 0; audios.push(this); }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
}
let maintenant = 0;
const rafs = [];
const intervalles = [];
const ctx = {
  window: {},
  document: { hidden: false, querySelector: () => ({ getAttribute: () => menu }) },
  Audio: FauxAudio,
  Date: { now: () => maintenant },
  Math, Number, Promise, console,
  requestAnimationFrame: (f) => { rafs.push(f); return rafs.length; },
  cancelAnimationFrame: () => {},
  setInterval: (f) => { intervalles.push(f); return 1; }
};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(src, ctx);
const battement = () => intervalles.forEach((f) => f());
const avancer = async (ms) => {
  for (let t = 0; t <= ms; t += 100) { maintenant += 100; const copie = rafs.splice(0); copie.forEach((f) => f()); await Promise.resolve(); await Promise.resolve(); }
};

// Hors du menu : rien ne joue.
battement(); await avancer(200);
assert.equal(audios.length, 0, "aucun élément audio créé hors des menus musicaux");

// Entrée dans le menu Blood : la musique démarre à volume 0 puis monte (fade in).
menu = "sang";
battement(); await avancer(100);
const sang = audios.find((a) => a.url.includes(encodeURIComponent("idle/ambient/BloodMagic.opus")));
assert.ok(sang, "BloodMagic.opus lue");
assert.equal(sang.paused, false);
assert.ok(sang.volume < 0.35, "fade in : le volume part de 0");
await avancer(1200);
assert.ok(Math.abs(sang.volume - 0.35) < 0.02, "fade in terminé au niveau Ambiance : " + sang.volume);

// La musique avance, on quitte : fade out puis pause, sans toucher à la position.
sang.currentTime = 42.5;
menu = "aventure";
battement(); await avancer(300);
assert.equal(sang.paused, false, "pendant le fade out, elle joue encore");
assert.ok(sang.volume < 0.35 && sang.volume > 0, "fade out en cours : " + sang.volume);
await avancer(1200);
battement(); await avancer(100);
assert.equal(sang.paused, true, "en pause après le fade out");
assert.equal(sang.volume, 0);
assert.equal(sang.currentTime, 42.5, "position conservée");

// On revient : même élément, reprise à la même position avec un nouveau fade in.
menu = "sang";
battement(); await avancer(100);
assert.equal(audios.filter((a) => a.url.includes("BloodMagic")).length, 1, "même élément audio (pas de rechargement)");
assert.equal(sang.paused, false);
assert.equal(sang.currentTime, 42.5, "reprend là où elle s'était arrêtée");
assert.ok(sang.volume < 0.35, "nouveau fade in");

// Le Shop garde sa musique, séparée.
menu = "shop";
battement(); await avancer(100);
assert.ok(audios.some((a) => a.url.includes(encodeURIComponent("idle/ambient/ShopMusic.opus")) && !a.paused), "musique du Shop");
console.log("idle-musiques-menu-v1: OK");
