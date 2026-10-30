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
function monde(admin = true) {
  const stock = {}; const minuteries = [];
  const fen = {
    __SOREAL_IDLE_EST_ADMIN_V1__: () => admin,
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
  assert.deepEqual(JSON.parse(m.stock.soreal_idle_theme_vus_v1), { b: ["12"], m: [], f: [], s: [] }, "image mémorisée comme déjà vue (liée au compte, format compact : une valeur de préférence tient en 8 000 caractères)");
  // Deuxième rencontre (même page rechargée) : directement, sans minuterie.
  const m2 = monde(); m2.stock.soreal_idle_theme_v1 = "magic"; m2.stock.soreal_idle_theme_vus_v1 = JSON.stringify({ b: ["12"], m: [], f: [], s: [] });
  assert.equal(m2.fen.__SOREAL_IDLE_THEME_V1__.habiller("boss", 12, base), "/magic/boss/12.webp", "déjà vue : l'image du thème directement");
  assert.equal(m2.minuteries.length, 0, "déjà vue : ni minuterie ni fondu");
  assert.equal(m2.fen.__SOREAL_IDLE_THEME_V1__.habiller("boss", 289, "/api/idle/media/boss?id=289"), "/api/idle/media/boss?id=289", "boss sans image de thème : image de base");
  assert.equal(m2.fen.__SOREAL_IDLE_THEME_V1__.habiller("fonds", "sewers", "x"), "x", "fond jamais vu : base");
  m2.fen.__SOREAL_IDLE_THEME_V1__.definir("");
  assert.equal(m2.fen.__SOREAL_IDLE_THEME_V1__.habiller("boss", 12, base), base, "thème coupé : image de base tout de suite");
}

// --- réservé à l'administrateur (Norman, 2026-10-30)
{
  const m = monde(false); m.stock.soreal_idle_theme_v1 = "magic";
  const T = m.fen.__SOREAL_IDLE_THEME_V1__;
  assert.equal(T.theme(), "", "autre compte : aucun thème, même si la valeur est mémorisée");
  assert.equal(T.habiller("boss", 12, "b"), "b", "autre compte : image de base");
  T.definir("magic");
  assert.equal(m.stock.soreal_idle_theme_v1 === "magic", false, "autre compte : le thème ne peut pas être activé");
  assert.equal(m.minuteries.length, 0, "autre compte : aucune minuterie");
}
assert.ok(lire("cloudflare/public/modules/ui-reglages-v1.js").includes("if(!T||!T.estAdmin())return '';"), "section des Réglages réservée à l'administrateur");
assert.ok(!lire("cloudflare/public/modules/release-notes-v1.js").includes("thème Magic") && !lire("cloudflare/public/modules/release-notes-v1.js").includes("thème des images"), "aucune mention du thème dans les notes de mise à jour");

// --- ennemis d'Aventure (Norman, 2026-10-30) : un ennemi est le boss de même nom ; avec le thème, le serveur renvoie vers l'image du thème de ce boss
{
  const m = monde(); const T = m.fen.__SOREAL_IDLE_THEME_V1__;
  const base = "/api/idle/media/mob?zone=sewers&boss=0&seed=1&name=Goblin";
  T.definir("magic");
  assert.equal(T.habiller("mob", "Goblin", base, base + "&theme=magic"), base, "ennemi jamais vu : l'ancienne image d'abord");
  assert.equal(m.minuteries.length, 1, "une minuterie de 5 s");
  m.minuteries[0].f(); m.vider();
  assert.equal(T.habiller("mob", "Goblin", base, base + "&theme=magic"), base + "&theme=magic", "ensuite : l'image du thème (via le serveur)");
  const vus = JSON.parse(m.stock.soreal_idle_theme_vus_v1);
  assert.equal(vus.m.length, 1, "ennemi mémorisé par une empreinte courte du nom");
  assert.ok(vus.m[0].length <= 8, "empreinte courte : " + vus.m[0]);
  // la liste complète (boss + ennemis + fonds + zones sûres) tient dans une préférence (8 000 caractères)
  const grosse = { b: [], m: [], f: [], s: [] };
  for (let n = 1; n <= 301; n++) grosse.b.push(String(n));
  for (let n = 0; n < 400; n++) grosse.m.push((n * 2654435761 >>> 0).toString(36));
  for (let n = 0; n < 32; n++) { grosse.f.push("aethereansea"); grosse.s.push("aethereansea"); }
  assert.ok(JSON.stringify(grosse).length < 8000, "tout ce qu'on peut voir tient dans une préférence : " + JSON.stringify(grosse).length);
}
{
  const { traiterRequeteIdleMedia } = await import("../src/idle-media-v1.js");
  const objets = (cles) => ({ objects: cles.map((key) => ({ key })), truncated: false });
  const R2 = {
    async list(o) {
      if (o.delimiter) return { delimitedPrefixes: ["idle/aventure/Sewers/"], objects: [], truncated: false };
      if (o.prefix === "idle/bosses/") return objets(["idle/bosses/Boss_005_A_Slightly_Bigger_Mouse.png", "idle/bosses/Boss_289_Un_Boss_Sans_Image_Magic.png"]);
      return objets(["idle/aventure/Sewers/sewers_safe_zone.webp"]);
    },
    async get(k) { return { body: "x", httpEtag: '"e"', writeHttpMetadata(h) { h.set("content-type", "image/png"); } }; }
  };
  const appel = (q) => traiterRequeteIdleMedia(new Request("https://soreal.test/api/idle/media/mob?zone=sewers&boss=0&seed=0&" + q), { SOREAL_R2: R2 });
  const r = await appel("name=A%20Slightly%20Bigger%20Mouse&theme=magic");
  assert.equal(r.status, 302, "thème Magic : redirection vers l'image du boss de même nom");
  assert.equal(r.headers.get("location"), "/magic/boss/5.webp", "vers l'image Magic de ce boss");
  const base = await appel("name=A%20Slightly%20Bigger%20Mouse");
  assert.equal(base.status, 200, "sans thème : l'image de base, comme avant");
  assert.equal(base.headers.get("x-soreal-idle-r2-key"), "idle/bosses/Boss_005_A_Slightly_Bigger_Mouse.png");
  const sans = await appel("name=Un%20Boss%20Sans%20Image%20Magic&theme=magic");
  assert.equal(sans.status, 200, "boss sans image Magic (289) : l'image de base");
}

// --- branchements
const combat = lire("cloudflare/public/modules/ui-combat-2-v1.js");
assert.ok(combat.includes("theme.habiller('boss',n,base)") && combat.includes("difficulte!=='difficile'&&difficulte!=='extreme'?theme.habiller"), "boss : adresse via le thème, en difficulté normale seulement");
assert.ok(combat.includes("if(urlActuelle&&idleBossImageCacheV36[cacheKey])idleBossImageCacheV36[cacheKey]=urlActuelle;"), "le cache d'image de boss suit le thème");
assert.ok(lire("cloudflare/public/modules/adventure-fond-zone-v1.js").includes("th.habiller('fonds',id,base)"), "fonds de zone via le thème");
assert.ok(lire("cloudflare/public/modules/adventure-scene-v79.js").includes("th.habiller('safe',zoneVisuelle,base)"), "zones sûres via le thème");
assert.ok(lire("cloudflare/public/modules/adventure-scene-v79.js").includes("th.habiller('mob',String(fight.mobName),base,base+'&theme=magic')"), "ennemis d'Aventure via le thème");
const reg = lire("cloudflare/public/modules/ui-reglages-v1.js");
assert.ok(reg.includes("htmlReglagesThemeIdleV1_()+\n            htmlReglagesAudioIdleV1_()+") && reg.includes("window.__changerThemeIdleV1__=function(code)"), "section « Thème des images » dans Son et image");
assert.ok(lire("cloudflare/public/index.html").includes('/modules/theme-images-v1.js?v='), "module chargé");
assert.ok(lire("cloudflare/public/_headers").includes("/magic/*"), "en-tête de cache du dossier du thème");
console.log("idle-theme-images-v1 : OK");
