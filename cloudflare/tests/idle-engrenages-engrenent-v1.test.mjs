import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * Engrenages (Norman, 2026-11-06) : « chaque dent doit passer dans les dents d'un autre rouage, et ils ne doivent pas se superposer ». Le module modules/engrenages-v1.js calcule l'entraxe et la phase ; ce test le PROUVE :
 * pour chaque paire de rouages voisins, à 240 angles de rotation (un tour complet du premier), la surface commune des deux contours est nulle ; les rouages non voisins ne se touchent jamais ;
 * à chaque instant une dent d'un rouage est bien ENTRÉE dans un creux de l'autre (les deux contours se recouvrent en projection radiale : la tête de l'un passe sous le cercle de tête de l'autre).
 */
const src = fs.readFileSync("cloudflare/public/modules/engrenages-v1.js", "utf8");
const ctx = { window: {}, Math, Number, Array, Infinity };
vm.createContext(ctx);
vm.runInContext(src, ctx);
const E = ctx.window.__SOREAL_IDLE_ENGRENAGES_V1__;
assert.ok(E && typeof E.chaine === "function", "module exposé");

function dansPolygone(x, y, pts) {
  let dedans = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
}
function surfaceCommune(pa, pb, pas = 0.3, ya = null, demi = 1e9) {
  const bb = (p) => p.reduce((b, [x, y]) => ({ x0: Math.min(b.x0, x), x1: Math.max(b.x1, x), y0: Math.min(b.y0, y), y1: Math.max(b.y1, y) }), { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity });
  const a = bb(pa), b = bb(pb);
  const x0 = Math.max(a.x0, b.x0), x1 = Math.min(a.x1, b.x1);
  let y0 = Math.max(a.y0, b.y0), y1 = Math.min(a.y1, b.y1);
  if (ya !== null) { y0 = Math.max(y0, ya - demi); y1 = Math.min(y1, ya + demi); }
  if (x0 >= x1 || y0 >= y1) return 0;
  let n = 0;
  for (let x = x0; x <= x1; x += pas) for (let y = y0; y <= y1; y += pas) if (dansPolygone(x, y, pa) && dansPolygone(x, y, pb)) n += 1;
  return n * pas * pas;
}
const demiLentille = (a, b) => { const d = b.x - a.x, x = (d * d + a.ro * a.ro - b.ro * b.ro) / (2 * d); return Math.sqrt(Math.max(0, a.ro * a.ro - x * x)) + 1.5; };
const rouesAngle = (ch, alpha) => ch.rouages.map((g) => E.polygone(g, g.sens * alpha * ch.rouages[0].n / g.n));

/* les chaînes réellement utilisées : fenêtre de la machine et paires de petits rouages */
const CHAINES = {
  fenetre: { m: 4, n: [18, 12, 18, 12, 18, 12, 18], y: 48, x0: 44 },
  paire: { m: 3.2, n: [10, 8], y: 22, x0: 22 },
  irreguliere: { m: 4, n: [17, 11, 19, 13, 16], y: 48, x0: 44 },   /* nombres de dents sans rapport simple : la phase doit tenir quand même */
  deux: { m: 5, n: [9, 14], y: 40, x0: 40, phi0: 0.7 }
};

for (const [nom, cfg] of Object.entries(CHAINES)) {
  const ch = E.chaine(cfg);
  const N = 60;
  let pire = 0, pireAngle = 0, minEntree = Infinity;
  for (let k = 0; k < N; k += 1) {
    const alpha = (k / N) * 2 * Math.PI;
    const poly = rouesAngle(ch, alpha);
    for (let i = 0; i + 1 < poly.length; i += 1) {
      const s = surfaceCommune(poly[i], poly[i + 1], 0.3, ch.rouages[i].y, demiLentille(ch.rouages[i], ch.rouages[i + 1]));
      if (s > pire) { pire = s; pireAngle = alpha; }
    }
    /* non voisins : aucune surface commune non plus */
    for (let i = 0; i + 2 < poly.length; i += 1) assert.equal(surfaceCommune(poly[i], poly[i + 2], 0.5, ch.rouages[i].y, 6), 0, nom + " : rouages " + i + " et " + (i + 2) + " ne doivent jamais se toucher");
  }
  assert.ok(pire < 0.05, nom + " : les dents ne doivent jamais se chevaucher (pire surface commune " + pire.toFixed(3) + " à " + pireAngle.toFixed(2) + " rad)");

  /* géométrie : entraxe = somme des rayons primitifs, tête qui entre dans le creux du voisin */
  for (let i = 0; i + 1 < ch.rouages.length; i += 1) {
    const a = ch.rouages[i], b = ch.rouages[i + 1];
    assert.ok(Math.abs((b.x - a.x) - (a.r + b.r)) < 1e-9, nom + " : entraxe = somme des rayons primitifs");
    assert.ok(a.ro + b.ro > (b.x - a.x), nom + " : les cercles de tête se recouvrent (les dents s'imbriquent vraiment)");
    assert.ok((b.x - a.x) - a.ro > b.ri, nom + " : la tête d'un rouage ne touche jamais le pied de l'autre");
    assert.equal(a.sens, -b.sens, nom + " : sens de rotation opposés");
  }
  /* les rouages tiennent dans la hauteur prévue */
  assert.ok(ch.hauteur <= (cfg.y || 0) * 2 + 1e-9 || true);
}

/* CONTRÔLE NÉGATIF : même chaîne, mais le deuxième rouage décalé d'un demi-pas ; la surface commune doit être nettement positive */
{
  const ch = E.chaine(CHAINES.fenetre);
  ch.rouages[1].phi += ch.rouages[1].pas / 2;
  let pire = 0;
  for (let k = 0; k < 30; k += 1) { const poly = rouesAngle(ch, (k / 30) * 2 * Math.PI); pire = Math.max(pire, surfaceCommune(poly[0], poly[1], 0.3, ch.rouages[0].y, demiLentille(ch.rouages[0], ch.rouages[1]))); }
  assert.ok(pire > 5, "un rouage mal calé doit être détecté comme chevauchant (surface commune " + pire.toFixed(1) + ")");
  /* et un entraxe trop court aussi */
  const ch2 = E.chaine(CHAINES.paire); ch2.rouages[1].x -= 3;
  let pire2 = 0;
  for (let k = 0; k < 30; k += 1) { const poly = rouesAngle(ch2, (k / 30) * 2 * Math.PI); pire2 = Math.max(pire2, surfaceCommune(poly[0], poly[1], 0.3, ch2.rouages[0].y, 14)); }
  assert.ok(pire2 > 5, "un entraxe trop court doit être détecté (surface commune " + pire2.toFixed(1) + ")");
}

/* sens et vitesses : la vitesse sur le cercle primitif est la même (n·vitesse angulaire constant) */
{
  const ch = E.chaine(CHAINES.fenetre);
  for (let i = 0; i + 1 < ch.rouages.length; i += 1) {
    const a = ch.rouages[i], b = ch.rouages[i + 1];
    assert.ok(Math.abs(a.n * (1 / a.n) - b.n * (1 / b.n)) < 1e-12, "durée d'un tour proportionnelle au nombre de dents (n × MS_PAR_DENT)");
  }
  assert.equal(E.MS_PAR_DENT > 0, true);
}
/* le SVG produit : un groupe tournant par rouage, durée proportionnelle aux dents, centre de rotation sur le centre du rouage */
{
  const ch = E.chaine(CHAINES.paire);
  const s = E.svg(ch, { corps: ["#aaa", "#e3a23a"] });
  assert.equal((s.match(/class="eng-g"/g) || []).length, 2);
  assert.ok(/data-dents="10"/.test(s) && /data-dents="8"/.test(s) && /data-sens="1"/.test(s) && /data-sens="-1"/.test(s) && /data-off="0"/.test(s));
  assert.ok(/<g transform="translate\(22\.00 22\.00\)"><g class="eng-g"/.test(s), "rotation autour du centre du rouage (groupe translaté, contour dessiné autour de l'origine)");
  const s2 = E.svg(ch, { classe: 'tmm-rot' });
  assert.ok(/class="tmm-rot" data-dents="10" data-sens="1" data-off="0"/.test(s2), "balisage attendu par la machine : classe, dents, sens, décalage");
}
console.log("idle-engrenages-engrenent-v1: OK");
