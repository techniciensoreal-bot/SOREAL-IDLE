// Norman (2026-10-30) : thème Magic dans les Réglages. La première fois qu'une image est rencontrée avec le thème actif, l'ancienne reste 5 secondes puis la nouvelle la remplace en fondu ; ensuite l'image du thème apparaît directement.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const code = lire("cloudflare/public/modules/theme-images-v1.js");

// --- fichiers du thème : 299 boss (1 à 301 sans 289 et 296), 32 fonds, 32 zones sûres, WebP, légers
const dossier = "cloudflare/public/magic/";
const boss = fs.readdirSync(dossier + "boss").map((f) => Number(f.replace(".webp", ""))).sort((a, b) => a - b);
const attendus = []; for (let n = 1; n <= 301; n++) if (n !== 289 && n !== 296) attendus.push(n);
assert.deepEqual(boss, attendus, "un WebP par boss (sauf 289 et 296, sans image dans le dossier d'origine)");
const zones = fs.readdirSync(dossier + "fonds").map((f) => f.replace(".webp", "")).sort();
assert.equal(zones.length, 32, "32 fonds de zone");
assert.deepEqual(fs.readdirSync(dossier + "safe").map((f) => f.replace(".webp", "")).sort(), zones, "une image de zone sûre par zone");
let total = 0;
for (const d of ["boss", "fonds", "safe"]) for (const f of fs.readdirSync(dossier + d)) {
  const b = fs.readFileSync(dossier + d + "/" + f);
  assert.equal(b.subarray(0, 4).toString("latin1") + b.subarray(8, 12).toString("latin1"), "RIFFWEBP", f + " : WebP");
  assert.ok(b.length < 160 * 1024, f + " : compressée (" + b.length + " octets)");
  total += b.length;
}
assert.ok(total < 20 * 1024 * 1024, "thème complet sous 20 Mo : " + total);

// --- logique : base pendant 5 s, puis thème ; « déjà vu » mémorisé
function monde() {
  const stock = {}; const minuteries = [];
  const fen = {
    localStorage: { getItem: (k) => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); }, removeItem: (k) => { delete stock[k]; } },
    document: { querySelectorAll: () => [], querySelector: () => null },
    Image: function () { const o = this; Object.defineProperty(o, "src", { set(v) { o._s = v; setTimeout0(() => o.onload && o.onload()); } }); },
    requestAnimationFrame: () => 0,
  };
  const file = [];
  const setTimeout0 = (f) => file.push(f);
  fen.window = fen;
  fen.setTimeout = (f, ms) => { minuteries.push({ f, ms }); return minuteries.length; };
  vm.runInNewContext(code, Object.assign(fen, { setTimeout: fen.setTimeout }));
  return { fen, stock, minuteries, vider: () => { while (file.length) file.shift()(); } };
}
{
  const m = monde(); const T = m.fen.__SOREAL_IDLE_THEME_V1__;
  const base = "/api/idle/media/boss?id=12";
  assert.equal(T.habiller("boss", 12, base), base, "sans thème : image de base");
  assert.equal(m.minuteries.length, 0, "sans thème : aucune minuterie");
  T.definir("magic");
  assert.equal(T.habiller("boss", 12, base), base, "thème actif, image jamais vue : l'ancienne reste d'abord");
  assert.equal(T.habiller("boss", 12, base), base, "un redessin ne change rien");
  assert.equal(m.minuteries.length, 1, "une seule minuterie par image (un redessin ne la relance pas)");
  assert.equal(m.minuteries[0].ms, 5000, "5 secondes");
  m.minuteries[0].f(); m.vider();
  assert.equal(T.habiller("boss", 12, base), "/magic/boss/12.webp", "après les 5 secondes : l'image du thème");
  assert.deepEqual(JSON.parse(m.stock.soreal_idle_theme_vus_v1), ["magic:boss:12"], "image mémorisée comme déjà vue (liée au compte)");
  // Deuxième rencontre (même page rechargée) : directement, sans minuterie.
  const m2 = monde(); m2.stock.soreal_idle_theme_v1 = "magic"; m2.stock.soreal_idle_theme_vus_v1 = JSON.stringify(["magic:boss:12"]);
  assert.equal(m2.fen.__SOREAL_IDLE_THEME_V1__.habiller("boss", 12, base), "/magic/boss/12.webp", "déjà vue : l'image du thème directement");
  assert.equal(m2.minuteries.length, 0, "déjà vue : ni minuterie ni fondu");
  assert.equal(m2.fen.__SOREAL_IDLE_THEME_V1__.habiller("boss", 289, "/api/idle/media/boss?id=289"), "/api/idle/media/boss?id=289", "boss sans image de thème : image de base");
  assert.equal(m2.fen.__SOREAL_IDLE_THEME_V1__.habiller("fonds", "sewers", "x"), "x", "fond jamais vu : base");
  m2.fen.__SOREAL_IDLE_THEME_V1__.definir("");
  assert.equal(m2.fen.__SOREAL_IDLE_THEME_V1__.habiller("boss", 12, base), base, "thème coupé : image de base tout de suite");
}

// --- branchements
const combat = lire("cloudflare/public/modules/ui-combat-2-v1.js");
assert.ok(combat.includes("theme.habiller('boss',n,base)") && combat.includes("difficulte!=='difficile'&&difficulte!=='extreme'?theme.habiller"), "boss : adresse via le thème, en difficulté normale seulement");
assert.ok(combat.includes("if(urlActuelle&&idleBossImageCacheV36[cacheKey])idleBossImageCacheV36[cacheKey]=urlActuelle;"), "le cache d'image de boss suit le thème");
assert.ok(lire("cloudflare/public/modules/adventure-fond-zone-v1.js").includes("th.habiller('fonds',id,base)"), "fonds de zone via le thème");
assert.ok(lire("cloudflare/public/modules/adventure-scene-v79.js").includes("th.habiller('safe',zoneVisuelle,base)"), "zones sûres via le thème");
const reg = lire("cloudflare/public/modules/ui-reglages-v1.js");
assert.ok(reg.includes("htmlReglagesThemeIdleV1_()+\n            htmlReglagesAudioIdleV1_()+") && reg.includes("window.__changerThemeIdleV1__=function(code)"), "section « Thème des images » dans Son et image");
assert.ok(lire("cloudflare/public/index.html").includes('/modules/theme-images-v1.js?v='), "module chargé");
assert.ok(lire("cloudflare/public/_headers").includes("/magic/*"), "en-tête de cache du dossier du thème");
console.log("idle-theme-images-v1 : OK");
