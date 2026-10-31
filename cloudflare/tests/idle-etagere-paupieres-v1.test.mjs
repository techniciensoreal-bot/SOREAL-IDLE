import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import vm from "node:vm";

/* Paupières et regards-sprites des chats-étagères (Norman, 2026-10-31 : « adaptées au chat pour que ça colle PARFAITEMENT » ; planche de pupilles validée) :
 * un sprite de paupière au masque exact par ŒIL, un sprite de regard par œil clippé à ce masque, tout en % de l'image, mouvement réduit coupé ;
 * tchernobyl : deux moitiés qui se rejoignent au milieu. */
const pub = (f) => readFileSync("cloudflare/public/" + f, "utf8");
const IDS = ["defaut", "noeud", "arcenciel", "fibonacci", "dore", "matrix", "chauvesouris", "tchernobyl", "pirate", "noel", "nega"];
const bac = { window: {}, document: { head: null }, Math, Date };
for (const f of ["etagere-skins-v1", "etagere-paupieres-v1", "etagere-regards-v1", "etagere-personnage-v1"]) vm.runInNewContext(pub("modules/" + f + ".js"), bac);
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
/* course de la bille bornée : iris 0,8 de la hauteur du blanc, déplacement <= 25 % de sa taille (puis clippé par le masque) */
const bille = m.match(/@keyframes etBilleG2\{[^]*?\}\}',/)[0];
for (const mm of bille.matchAll(/translate\((-?[\d.]+)%,(-?[\d.]+)%\)/g)) assert.ok(Math.abs(+mm[1]) <= 25 && Math.abs(+mm[2]) <= 25, "bille bornée : " + mm[0]);
assert.ok(bille.startsWith("@keyframes etBilleG2{0%,60%{transform:translate(0,0)}") && bille.includes("100%{transform:translate(0,0)}}"), "boucle parfaite de 29 s : départ = arrivée");
assert.ok(m.includes("--o:translateY(-102%)") && m.includes("--o:translateX(-102%)") && m.includes("--o:translateX(102%)"), "ouvert : sprite entièrement hors du masque (image d'origine intacte)");
assert.ok(/@keyframes etClin2\{0%,90%,100%\{transform:var\(--o\)\}94%\{transform:translate\(0,0\)\}\}/.test(m), "boucle parfaite : début = fin, fermé = sprite exactement en place");
assert.ok(/@keyframes etPaupG2\{0%,[^}]*100%\{transform:var\(--o\)\}/.test(m), "boucle de 29 s de l'œil gauche : début = fin");
assert.ok(m.includes("etClin2 13s") && m.includes("etPaupG2 29s") && m.includes("etBilleG2 29s") && m.includes("var(--dl,0s)"), "mêmes durées, délais par œil");
assert.ok(m.includes(".et-paup,.et-regard,.et-iris{animation:none}"), "mouvement réduit coupé");
assert.ok(!/setInterval|setTimeout/.test(m), "aucune minuterie (règle n°4)");
/* clignements SYNCHRONES : un seul délai par chat ; Fibonacci : vague d'une tête à l'autre (2 yeux par tête, décalage constant) ; pirate : une seule paupière */
for (const id of IDS) {
  const dl = (E.yeuxHtml(id).match(/--dl:(-?[\d.]+)s/g) || []).map((x) => parseFloat(x.slice(5)));
  if (id !== "fibonacci") assert.equal(new Set(dl).size, 1, id + " : tous les yeux clignent ensemble");
  else {
    assert.equal(dl.length, 10);
    for (let t = 0; t < 5; t++) assert.ok(dl[2 * t] === dl[2 * t + 1], "fibonacci : les deux yeux d'une tête ensemble");
    const ph = [0, 1, 2, 3, 4].map((t) => (((dl[2 * t] % 29) + 29) % 29));
    for (let t = 1; t < 5; t++) assert.ok(Math.abs(((ph[t] - ph[t - 1] + 29) % 29) - 0.4) < 0.11 || Math.abs(((ph[t - 1] - ph[t] + 29) % 29) - 0.4) < 0.11, "fibonacci : décalage constant d'une tête à la suivante");
  }
}
assert.equal((E.yeuxHtml("pirate").match(/<i class="et-oeil/g) || []).length, 1);
assert.ok(E.yeuxHtml("pirate").includes("et-un") && !E.yeuxHtml("dore").includes("et-un"), "seul le pirate a une paupière (l'autre œil est sous le cache-œil)");
/* index.html : données avant le module */
const idx = pub("index.html");
const a = idx.indexOf("etagere-paupieres-v1.js?v="), r = idx.indexOf("etagere-regards-v1.js?v="), b = idx.indexOf("etagere-personnage-v1.js?v=");
assert.ok(a > 0 && r > 0 && b > a && b > r && /<script defer src="\/modules\/etagere-paupieres-v1\.js\?v=\d+">/.test(idx) && /<script defer src="\/modules\/etagere-regards-v1\.js\?v=\d+">/.test(idx), "scripts des paupières et des regards avant celui du personnage");
console.log("idle-etagere-paupieres-v1 ok");
