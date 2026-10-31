import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import vm from "node:vm";

/* Paupières et regards-sprites des chats-étagères (Norman, 2026-10-31 : « adaptées au chat pour que ça colle PARFAITEMENT » ; planche de pupilles validée) :
 * un sprite de paupière au masque exact par ŒIL, un sprite de regard par œil clippé à ce masque, tout en % de l'image, mouvement réduit coupé ;
 * tchernobyl : deux moitiés qui se rejoignent au milieu. */
const pub = (f) => readFileSync("cloudflare/public/" + f, "utf8");
const IDS = ["defaut", "noeud", "arcenciel", "fibonacci", "dore", "matrix", "chauvesouris", "tchernobyl", "pirate", "noel", "nega"];
const bac = { window: {}, document: { head: null }, Math, Date };
for (const f of ["etagere-skins-v1", "etagere-paupieres-v1", "etagere-regards-v1", "etagere-expression-v1", "etagere-personnage-v1"]) vm.runInNewContext(pub("modules/" + f + ".js"), bac);
const P = bac.window.__SOREAL_IDLE_ETAGERE_PAUPIERES_V1__, G = bac.window.__SOREAL_IDLE_ETAGERE_REGARDS_V1__, S = bac.window.__SOREAL_IDLE_ETAGERE_SKINS_V1__, E = bac.window.__SOREAL_IDLE_ETAGERE_V1__;
assert.ok(P && G && S && E);

const chunks = (b) => {   /* dimensions d'un WebP : VP8L (sans perte) ou VP8X/VP8 (avec perte + alpha) */
  assert.equal(b.toString("ascii", 0, 4), "RIFF"); assert.equal(b.toString("ascii", 8, 12), "WEBP");
  const t = b.toString("ascii", 12, 16);
  if (t === "VP8L") { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
  if (t === "VP8X") return { w: (b.readUIntLE(24, 3)) + 1, h: (b.readUIntLE(27, 3)) + 1 };
  throw new Error("format webp inattendu " + t);
};
let poidsP = 0, poidsG = 0;
const vus = new Set();
for (const id of IDS) {
  assert.ok(Array.isArray(P[id]) && Array.isArray(G[id]), id + " couvert");
  assert.equal(P[id].length, S.skins[id].yeux.length + (id === "fibonacci" ? 4 : 0), id + " : un sprite de paupière par œil");
  assert.equal(G[id].length, P[id].length, id + " : un regard par œil");
  P[id].forEach((p, i) => {
    for (const k of ["left", "top", "larg", "haut"]) assert.ok(typeof p[k] === "number" && p[k] >= 0, id + i + " " + k);
    assert.ok(p.left + p.larg <= 100 && p.top + p.haut <= 100, id + i + " : rien hors de l'image");
    const imgs = id === "tchernobyl" ? p.images : [p.image];
    assert.ok(id !== "tchernobyl" ? typeof p.image === "string" && !p.images : Array.isArray(p.images) && p.images.length === 2 && p.moitie > 20 && p.moitie < 80, id + i + " : sprite(s)");
    let largPx = 0;
    imgs.forEach((u) => {
      assert.ok(u.startsWith("/garderie/paupieres/" + id + "-" + i) && u.endsWith(".webp"), u);
      const f = "cloudflare/public" + u;
      assert.ok(existsSync(f), f);
      const t = statSync(f).size; poidsP += t;
      assert.ok(t > 100 && t < 12000, f + " : taille raisonnable (" + t + " o)");
      const d = chunks(readFileSync(f));
      largPx += d.w;
      assert.ok(Math.abs(d.h - p.haut * 11.52) <= 1.2, f + " : hauteur du sprite = hauteur du masque");
      assert.ok(!vus.has(u)); vus.add(u);
    });
    assert.ok(Math.abs(largPx - p.larg * 7.68) <= 1.2, id + i + " : largeur des sprites = largeur du masque");
    /* le regard : disque d'iris ENTIER dans la boîte du blanc (pas plus grand que 0,85 de sa hauteur) et centré */
    const g = G[id][i];
    assert.ok(g.image.startsWith("/garderie/yeux/" + id + "-" + i) && existsSync("cloudflare/public" + g.image), id + i + " : sprite de regard");
    const tg = statSync("cloudflare/public" + g.image).size; poidsG += tg;
    assert.ok(tg > 80 && tg < 12000, g.image + " : taille raisonnable (" + tg + " o)");
    const dg = chunks(readFileSync("cloudflare/public" + g.image));
    assert.ok(Math.abs(dg.h / 2 - g.haut * 11.52) <= 1.2 && Math.abs(dg.w / 2 - g.larg * 7.68) <= 1.2, id + i + " : regard rendu à 2x");
    assert.ok(g.haut <= p.haut * 0.85 + 0.05 && g.larg <= p.larg + 0.05, id + i + " : iris ≈ 0,8 de la hauteur du blanc, avec de la marge pour la bille");
    assert.ok(Math.abs((g.left + g.larg / 2) - (p.left + p.larg / 2)) < 0.05 && Math.abs((g.top + g.haut / 2) - (p.top + p.haut / 2)) < 0.05, id + i + " : regard centré dans le blanc");
  });
}
assert.ok(poidsP + poidsG < 400 * 1024, "poids total des sprites < 400 Ko (" + poidsP + " + " + poidsG + " o)");
assert.ok(poidsP < 300 * 1024);
assert.equal(P.tchernobyl.length, 6); assert.equal(P.fibonacci.length, 10); assert.equal(P.pirate.length, 1);
/* rendu : regard + paupière dans un œil clippé par le masque (même sprite), tchernobyl = deux moitiés, la paupière passe AU-DESSUS du regard */
for (const id of IDS) {
  const h = E.yeuxHtml(id);
  const nbOeil = (h.match(/<i class="et-oeil/g) || []).length;
  assert.equal(nbOeil, P[id].length, id);
  assert.equal((h.match(/mask-image:url\(/g) || []).length, nbOeil * 2, id + " : chaque œil a son masque (préfixé et standard)");
  assert.equal((h.match(/class="et-iris et-ir"/g) || []).length, nbOeil, id + " : un regard-sprite par œil");
  assert.equal((h.match(/class="et-paup et-sp/g) || []).length, id === "tchernobyl" ? nbOeil * 2 : nbOeil, id + " : sprites de paupière");
  assert.ok(!/class="et-paup"/.test(h), id + " : plus de paupière unie");
  assert.ok(!/(left|top|width|height):-/.test(h.replace(/left:-[\d.]+%/g, "")) && !/NaN|undefined/.test(h), id + " : aucune valeur invalide");
  /* regard avant paupière dans chaque œil (la paupière recouvre le regard) */
  for (const oe of h.split('<i class="et-oeil').slice(1)) assert.ok(oe.indexOf("et-regard") < oe.indexOf("et-paup"), id + " : paupière au-dessus du regard");
  /* le disque d'iris reste dans la boîte du masque (positions en %) */
  for (const m of h.matchAll(/class="et-iris et-ir" style="left:(-?[\d.]+)%;top:(-?[\d.]+)%;width:([\d.]+)%;height:([\d.]+)%/g)) {
    const [l, t, w, hh] = m.slice(1).map(Number);
    assert.ok(l >= 0 && t >= 0 && l + w <= 100.01 && t + hh <= 100.01, id + " : iris dans la boîte du blanc (" + m[0] + ")");
  }
}
assert.equal((E.yeuxHtml("tchernobyl").match(/et-pg/g) || []).length, 6);
assert.equal((E.yeuxHtml("tchernobyl").match(/et-pd/g) || []).length, 6);
assert.ok(!E.yeuxHtml("dore").includes("et-pg"), "les autres chats gardent une paupière verticale unique");
const m = pub("modules/etagere-personnage-v1.js");
assert.ok(m.includes(".et-m{border-radius:0}") && m.includes(".et-oeil{position:absolute;z-index:6;display:block;border-radius:50%;overflow:hidden"), "œil clippé (masque + overflow) : la pupille ne sort jamais du blanc");
assert.ok(m.includes("--ox:0%;--oy:-102%") && m.includes("--ox:-102%;--oy:0%") && m.includes("--ox:102%;--oy:0%"), "ouvert : sprite entièrement hors du masque (image d'origine intacte)");
assert.ok(!/!important/.test(m + pub("modules/etagere-expression-v1.js")), "aucun !important");
assert.ok(!/setInterval|setTimeout/.test(m + pub("modules/etagere-expression-v1.js")), "aucune minuterie (règle n°4)");
/* ---------- expressions : regards et paupières (modules/etagere-expression-v1.js) ---------- */
const X = bac.window.__SOREAL_IDLE_ETAGERE_EXPR_V1__;
assert.ok(X && X.ids.length === 11 && IDS.every((id) => X.ids.includes(id)), "une table d'expression par chat");
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const cycles = IDS.map((id) => X.cycle(id));
cycles.forEach((c, i) => { assert.ok(c >= 34 && c <= 61, IDS[i] + " : cycle de 34 à 61 s (" + c + ")"); for (let j = i + 1; j < cycles.length; j++) assert.equal(gcd(c, cycles[j]), 1, IDS[i] + " et " + IDS[j] + " : cycles premiers entre eux (jamais synchrones)"); });
const ev = {};
for (const id of IDS) {
  const c = X.construire(id), css = X.cssDe(id);
  assert.ok(c.stats.centre >= 0.3 && c.stats.centre <= 0.6, id + " : environ la moitié du temps au centre (" + c.stats.centre.toFixed(2) + ")");
  assert.ok(Object.keys(c.stats.evenements).length >= 2, id + " : plusieurs façons de fermer les yeux");
  for (const k of Object.keys(c.stats.evenements)) ev[k] = 1;
  /* boucle parfaite : 0 % et 100 % identiques, pour le regard comme pour la paupière */
  for (const [nom, kf] of [["regard", c.regard], ["paupière", c.paupiere]]) {
    const corps = kf.slice(kf.indexOf("{") + 1, -1);
    const f = [...corps.matchAll(/(\d+(?:\.\d+)?)%\{transform:([^}]*)\}/g)].map((x) => [parseFloat(x[1]), x[2]]);
    assert.equal(f[0][0], 0, id + " " + nom + " : démarre à 0 %"); assert.equal(f[f.length - 1][0], 100, id + " " + nom + " : finit à 100 %");
    assert.equal(f[0][1], f[f.length - 1][1], id + " " + nom + " : boucle parfaite (0 % = 100 %)");
    for (let i = 1; i < f.length; i++) assert.ok(f[i][0] > f[i - 1][0], id + " " + nom + " : pourcentages croissants");
  }
  assert.ok(css.includes("@media (prefers-reduced-motion:no-preference){") && css.includes(".et-k-" + id + " .et-ir{animation:etG-" + id + " " + c.T + "s") && css.includes(".et-k-" + id + " .et-paup.et-sp{animation:etP-" + id + " " + c.T + "s"), id + " : animations hors mouvement réduit seulement");
  assert.ok(!/!important/.test(css) && css.length < 16000, id + " : CSS généré léger (" + css.length + " o)");
  /* regard : amplitudes bornées par les variables de l'œil (jamais plus d'une amplitude, bille bornée) */
  for (const mm of c.regard.matchAll(/var\(--ay\)\*(-?[\d.]+)/g)) assert.ok(Math.abs(+mm[1]) <= 1.36, id + " : amplitude verticale bornée");
  for (const mm of c.regard.matchAll(/var\(--bq\)\*(-?[\d.]+)%/g)) assert.ok(Math.abs(+mm[1]) <= 25, id + " : bille bornée");
  assert.equal(c.stats.billes, id === "pirate" ? 0 : 1, id + " : la bille tombe une fois par cycle (rare), sauf le pirate (un seul œil)");
}
for (const k of ["n", "l", "d", "p", "s", "L"]) assert.ok(ev[k], "façon de fermer « " + k + " » utilisée");
/* la paupière accompagne le regard : regard vers le bas = paupière à 90 % d'ouverture au plus ; les fermetures sont des translations d'une fraction du masque */
for (const id of ["defaut", "noeud"]) assert.ok(/calc\(var\(--ox\)\*0\.9\d*\)/.test(X.construire(id).paupiere), id + " : paupière un peu plus basse quand le regard descend");
/* chaque œil porte ses amplitudes, sa classe de chat, et le disque d'iris reste dans le blanc */
for (const id of IDS) {
  const h = E.yeuxHtml(id);
  const n = (h.match(/<i class="et-oeil/g) || []).length;
  assert.equal((h.match(/--ax:[\d.]+%;--ay:[\d.]+%;--bq:[01]/g) || []).length, n, id + " : amplitudes par œil");
  assert.equal((h.match(new RegExp("et-k-" + id, "g")) || []).length, n, id + " : classe du chat sur chaque œil");
  for (const mm of h.matchAll(/--ax:([\d.]+)%;--ay:([\d.]+)%/g)) assert.ok(+mm[1] <= 60 && +mm[2] <= 25 && +mm[1] > 0 && +mm[2] > 0, id + " : amplitudes bornées");
  assert.equal((h.match(/transform-origin:-?[\d.]+% -?[\d.]+%/g) || []).length, n, id + " : origine de déformation du souffle par œil");
}
/* petits yeux de Fibonacci : amplitude proportionnelle (calculée sur leur propre blanc) */
{
  const h = E.yeuxHtml("fibonacci"), ax = [...h.matchAll(/--ax:([\d.]+)%/g)].map((x) => +x[1]);
  assert.equal(ax.length, 10); assert.ok(ax.every((a) => a > 0 && a <= 60));
}
/* souffle : déformation douce de tout le chat (image + yeux, même transformation), boucle parfaite, discrète, coupée en mouvement réduit */
for (const id of IDS) {
  const [P, a, sk] = X.SOUFFLE[id];
  assert.ok(P >= 3.5 && P <= 9, id + " : période de souffle"); assert.ok(a > 0 && a <= 0.008, id + " : étirement discret"); assert.ok(sk > 0 && sk <= 0.2, id + " : balancement discret");
  const css = X.cssDe(id);
  assert.ok(css.includes("@keyframes etS-" + id + "{0%,100%{transform:scale(1,1) skewX(0deg)}") && css.includes("#gd-fig-" + id + " .gd-img,#gd-fig-" + id + " .et-oeil{animation:etS-" + id), id + " : souffle sur l'image et les yeux");
  assert.ok(css.indexOf("@media (prefers-reduced-motion:no-preference){#gd-fig-" + id) > 0, id + " : souffle coupé en mouvement réduit");
}
assert.equal(new Set(IDS.map((id) => X.SOUFFLE[id][0])).size, 11, "périodes de souffle toutes différentes");
assert.ok(m.includes("transform-origin:'+((50-o.left)/o.larg*100)"), "même origine (bas-centre du chat) pour l'image et les yeux : ils restent alignés");
/* clignements SYNCHRONES : un seul délai par chat ; Fibonacci : vague d'une tête à l'autre (2 yeux par tête, décalage constant) ; pirate : une seule paupière */
for (const id of IDS) {
  const dl = (E.yeuxHtml(id).match(/--dl:(-?[\d.]+)s/g) || []).map((x) => parseFloat(x.slice(5)));
  if (id !== "fibonacci") assert.equal(new Set(dl).size, 1, id + " : tous les yeux clignent ensemble");
  else {
    assert.equal(dl.length, 10);
    for (let t = 0; t < 5; t++) assert.ok(dl[2 * t] === dl[2 * t + 1], "fibonacci : les deux yeux d'une tête ensemble");
    const ph = [0, 1, 2, 3, 4].map((t) => (((dl[2 * t] % 47) + 47) % 47));
    for (let t = 1; t < 5; t++) assert.ok(Math.abs(((ph[t] - ph[t - 1] + 47) % 47) - 0.4) < 0.11 || Math.abs(((ph[t - 1] - ph[t] + 47) % 47) - 0.4) < 0.11, "fibonacci : décalage constant d'une tête à la suivante");
  }
}
assert.equal((E.yeuxHtml("pirate").match(/<i class="et-oeil/g) || []).length, 1);
assert.ok(!E.yeuxHtml("pirate").includes("et-pg"), "seul le pirate a une paupière (l autre œil est sous le cache-œil) ; les autres chats en ont une par œil");
/* index.html : données avant le module */
const idx = pub("index.html");
const a = idx.indexOf("etagere-paupieres-v1.js?v="), r = idx.indexOf("etagere-regards-v1.js?v="), b = idx.indexOf("etagere-personnage-v1.js?v="), xe = idx.indexOf("etagere-expression-v1.js?v=");
assert.ok(xe > 0 && b > xe && a > 0 && r > 0 && b > a && b > r && /<script defer src="\/modules\/etagere-paupieres-v1\.js\?v=\d+">/.test(idx) && /<script defer src="\/modules\/etagere-regards-v1\.js\?v=\d+">/.test(idx), "scripts des paupières et des regards avant celui du personnage");
console.log("idle-etagere-paupieres-v1 ok");
