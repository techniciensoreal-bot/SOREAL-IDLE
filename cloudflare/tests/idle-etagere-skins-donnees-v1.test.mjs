import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Données géométriques des 11 skins de la Garderie (modules/etagere-skins-v1.js) : format, bornes, bocaux sans chevauchement. Le module se charge sans navigateur (faux window). */
const src = readFileSync("cloudflare/public/modules/etagere-skins-v1.js", "utf8");
const window = {};
vm.runInNewContext(src, { window });
const D = window.__SOREAL_IDLE_ETAGERE_SKINS_V1__;
assert.ok(D, "module exposé");
const IDS = ["defaut", "noeud", "arcenciel", "fibonacci", "dore", "matrix", "chauvesouris", "tchernobyl", "pirate", "noel", "nega"];
assert.equal(JSON.stringify(D.ordre), JSON.stringify(IDS));
assert.equal(Object.keys(D.skins).sort().join(), IDS.slice().sort().join());
const pct = (v) => typeof v === "number" && v >= 0 && v <= 100;
const couleur = (c) => /^#[0-9a-f]{6}$/i.test(c);
const NB_YEUX = { fibonacci: 6, tchernobyl: 6, pirate: 1 };

for (const id of IDS) {
  const s = D.skins[id];
  assert.equal(s.image, "/api/idle/media/garderie-skin?id=" + id, id);
  assert.ok(s.pupille > 0.15 && s.pupille < 0.45, id + " pupille");
  assert.ok(couleur(s.paupiere), id + " paupiere");
  assert.ok(Array.isArray(s.yeux), id + " yeux");
  assert.equal(s.yeux.length, NB_YEUX[id] || 2, id + " nombre d'ovales");
  for (const e of s.yeux) {
    for (const k of ["left", "top", "larg", "haut"]) assert.ok(pct(e[k]) && e[k] > 0, id + " " + k);
    assert.ok(e.left + e.larg <= 100 && e.top + e.haut <= 100, id + " œil dans l'image");
    assert.ok(e.top + e.haut < 36, id + " œil dans le tiers haut");
    assert.ok(e.cote === "g" || e.cote === "d", id + " cote");
    assert.ok(couleur(e.couleur), id + " couleur d'œil");
  }
  const p = s.pots;
  assert.ok(pct(p.haut) && pct(p.larg) && pct(p.axe), id + " pots");
  assert.equal(p.compartiments.length, 3, id + " compartiments");
  assert.equal(p.places.length, 6, id + " places");
  p.compartiments.forEach((c, i) => {
    assert.ok(pct(c.sol) && pct(c.gauche) && pct(c.droite) && c.gauche < c.droite, id + " compartiment " + i);
    assert.equal(c.cx.length, 2);
    if (i) assert.ok(c.sol > p.compartiments[i - 1].sol + p.haut, id + " planches trop proches");
    for (const cx of c.cx) assert.ok(cx - p.larg / 2 >= c.gauche && cx + p.larg / 2 <= c.droite, id + " bocal hors du compartiment " + i);
  });
  const R = p.places.map((pl, i) => {
    const c = p.compartiments[i >> 1];
    assert.equal(pl.sol, c.sol, id + " sol de la place " + i);
    assert.equal(pl.cx, c.cx[i & 1], id + " centre de la place " + i);
    assert.ok(pct(pl.cx) && pct(pl.sol) && pl.echelle > 0 && pl.echelle <= 1.5, id + " place " + i);
    const w = p.larg * pl.echelle, h = p.haut * pl.echelle;
    const r = { x0: pl.cx - w / 2, x1: pl.cx + w / 2, y0: pl.sol - h, y1: pl.sol };
    assert.ok(r.x0 >= 0 && r.x1 <= 100 && r.y0 >= 0 && r.y1 <= 100, id + " place " + i + " dans l'image");
    return r;
  });
  for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) {
    const A = R[a], B = R[b];
    const sep = A.x1 <= B.x0 || B.x1 <= A.x0 || A.y1 <= B.y0 || B.y1 <= A.y0;
    assert.ok(sep, id + " bocaux " + a + " et " + b + " se chevauchent");
  }
}
/* Les paupières-sprites (etagere-paupieres-v1.js) suivent les ovales : même ordre, boîte du masque centrée sur l'ovale mesuré ; Fibonacci a 4 petits yeux de plus (têtes 4 et 5). */
{
  const w2 = {};
  vm.runInNewContext(readFileSync("cloudflare/public/modules/etagere-paupieres-v1.js", "utf8"), { window: w2 });
  const Pp = w2.__SOREAL_IDLE_ETAGERE_PAUPIERES_V1__;
  for (const id of IDS) {
    assert.equal(Pp[id].length, D.skins[id].yeux.length + (id === "fibonacci" ? 4 : 0), id + " : un sprite de paupière par ovale");
    D.skins[id].yeux.forEach((o, i) => {
      const p = Pp[id][i];
      assert.ok(Math.abs((p.left + p.larg / 2) - (o.left + o.larg / 2)) < 2 && Math.abs((p.top + p.haut / 2) - (o.top + o.haut / 2)) < 2, id + " œil " + i + " : masque centré sur l'ovale");
    });
  }
}
console.log("idle-etagere-skins-donnees-v1 ok");
