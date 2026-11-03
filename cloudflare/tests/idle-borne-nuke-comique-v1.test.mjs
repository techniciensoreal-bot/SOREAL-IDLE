import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * Borne d'arcade, petits Nuke (Norman, 2026-11-03 : « ça m'a écrit SUPER NUKE pour 3 boss seulement.. ça doit au contraire faire des animations genre un cul qui pète »).
 * Aux paliers 0 et 1 (moins de 10 boss) : jamais SUPER NUKE (indice 10), au moins une fois sur deux une scène comique (22 = le cul qui pète, 23 = le ballon qui se dégonfle).
 * SUPER NUKE reste possible à partir du palier 2 ; les tirages des paliers 2, 3, 4, le bombardier, le chien et la finale ne changent pas ; aucun indice existant n'est décalé.
 */
const src = fs.readFileSync(new URL("../public/modules/borne-led-v1.js", import.meta.url), "utf8");
const code = src.replace(/\/\*[\s\S]*?\*\//g, "");
const toile = () => ({ width: 0, height: 0, getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true }) });
const fen = { innerWidth: 1000, addEventListener() {}, devicePixelRatio: 1, localStorage: { getItem: () => "fr" }, matchMedia: () => ({ matches: false }), requestAnimationFrame: () => 1, cancelAnimationFrame() {}, performance: { now: () => 0 }, document: { hidden: false, createElement: toile, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, getElementById: () => null } };
fen.window = fen;
const c = vm.createContext({ ...fen, window: fen, document: fen.document, localStorage: fen.localStorage, Math, Uint8Array, Uint32Array, String, Number, Boolean, parseInt, isFinite, JSON, setTimeout, clearTimeout });
const idx = src.lastIndexOf("})();");
vm.runInContext(src.slice(0, idx) + "window.__EV__=function(e){return eval(e);};" + src.slice(idx), c);
const ev = (e) => fen.__EV__(e);
const JS = (x) => JSON.parse(JSON.stringify(x));

/* ---------------- indices : rien ne bouge, les deux scènes sont ajoutées à la fin ---------------- */
assert.equal(ev("NUKES.length"), 23);
assert.equal(ev("NUKES[10].name"), "superNuke");
assert.equal(ev("NUKES[12].name"), "chien");
assert.equal(ev("NUKES[BOMBARDIER].name"), "bombardier");
assert.equal(ev("NUKES[21].name"), "finale");
assert.equal(ev("NK_FINALE"), 21, "la finale garde l'indice 21");
assert.equal(ev("NUKES[22].name"), "ballon");   /* la scène du cul qui pète est supprimée (Norman, 2026-11-03 : « on supprime le caca, je n'aime pas ») */
assert.deepEqual(JS(ev("NK_COMIQUES")), [22]);
assert.ok(!(22 in JS(ev("NK_RESERVEES"))), "pas une scène réservée aux paliers hauts");
assert.equal(ev("NK_SCN[22]"), 4.7, "durée propre du ballon (tour dans le ciel compris) : 4,7 s");
assert.ok(/NK_SCN={12:CHIEN_TN,22:BAL_TN}/.test(code));
assert.ok(ev("nukeDuree(0,0,false,4.7)") > ev("nukeDuree(0,0,false)"));

/* ---------------- tirages ---------------- */
const tirer = (tier, n = 3000) => { ev("nukeSac=[];nukeDernier=-1"); return Array.from({ length: n }, () => ev(`nukeVariante(${tier})`)); };
for (const tier of [0, 1]) {
  const t = tirer(tier);
  assert.ok(!t.includes(10), "palier " + tier + " : jamais SUPER NUKE");
  assert.ok(t.every((v) => (v <= 13) || v === 22), "palier " + tier + " : base et comiques seulement");
  const part = t.filter((v) => v === 22).length / t.length;
  assert.ok(part >= 0.3 && part < 0.6, "palier " + tier + " : le ballon sort souvent mais jamais deux fois de suite, il n'y a plus qu'une scène comique (" + part.toFixed(3) + ")");
  assert.ok(t.includes(22), "la scène comique (le ballon) sort");
  for (const v of [0, 5, 9, 12, 13]) assert.ok(t.includes(v), "palier " + tier + " : la scène de base " + v + " sort toujours");
  for (let i = 1; i < t.length; i++) if (t[i] > 13 || t[i - 1] > 13) assert.notEqual(t[i], t[i - 1], "pas de répétition immédiate d'une scène comique");
}
const t2 = tirer(2);
assert.ok(t2.includes(10), "palier 2 : SUPER NUKE reste possible");
assert.ok(!t2.includes(22), "palier 2 : pas de scène comique");
for (const tier of [3, 4]) { const t = tirer(tier, 600); assert.ok(!t.includes(10) && !t.includes(22), "palier " + tier + " : inchangé"); }
/* Norman, 2026-11-03 : le chat (5), le chien (12) et le ballon (22) ne sortent QUE aux petits Nuke (paliers 0 et 1), jamais aux paliers 2, 3 et 4 */
assert.deepEqual(JS(ev("NK_PETITS_SEULEMENT")), [5, 12, 22], "les trois scènes réservées aux petits Nuke (chat, chien, ballon)");
for (const tier of [0, 1]) { const t = tirer(tier, 3000); for (const v of [5, 12, 22]) assert.ok(t.includes(v), "palier " + tier + " : la scène " + v + " sort"); }
for (const tier of [2, 3, 4]) { const t = tirer(tier, 3000); for (const v of [5, 12, 22]) assert.ok(!t.includes(v), "palier " + tier + " : jamais la scène " + v + " (3000 tirages)"); }
assert.ok(tirer(2, 3000).some((v) => v <= 13 && v !== 10), "palier 2 : la moitié « base » reste tirée (sans chat ni chien)");
ev("nukeSac=[];nukeDernier=-1");
const brut = Array.from({ length: 3000 }, () => ev("nukeChoix()"));
assert.ok(brut.includes(10), "le tirage de base (nukeChoix) n'a pas changé : SUPER NUKE y est toujours");
const pb = brut.filter((v) => v === 13).length / brut.length;
assert.ok(pb > 0.13 && pb < 0.28, "bombardier : toujours environ 1 sur 5");
// le palier calculé depuis le nombre de boss : 1 à 2 = 0, 3 à 9 = 1, 10 = 2
assert.deepEqual([1, 2, 3, 9, 10, 49, 50].map((n) => ev(`nukePalier(${n})`)), [0, 0, 1, 1, 2, 2, 3]);
// scène forcée (outil de réglage) : 22 est accepté, la finale reste exclue
ev("window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=22");
assert.equal(JS(ev("(function(){var p={};nukeInit(p,1,false,0);return p.v;})()")), 22);
assert.equal(JS(ev("(function(){var p={};nukeInit(p,1,false,0);return p.tn;})()")), 4.7);
ev("window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=undefined");

/* ---------------- dessin : aucune erreur, bouton enfoncé puis NUKE ! ---------------- */
const rendu = (v, u, W, H) => JSON.parse(ev(`(function(){var pn=new Panel(document.createElement('canvas'),${W},${H});P=pn;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=${H - 1};pn.YM=${H};pn.p={essai:1,n:1};window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=${v};SC.nuke.fn(${u});window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=undefined;
  var peau=indexCouleur([255,178,140]),n=0,sk=0,i,o={n:0,sk:0,c:[]};for(i=0;i<${W * H};i++)if(pn.v[i]){o.n++;if(pn.c[i]===peau)o.sk++;}o.c=Array.prototype.slice.call(pn.c);o.vv=Array.prototype.slice.call(pn.v);P=null;return JSON.stringify(o);})()`));
for (const v of [22]) for (const [W, H] of [[60, 16], [140, 16], [140, 34]]) {
  for (let u = 0; u <= 4.7; u += 0.05) assert.doesNotThrow(() => rendu(v, u, W, H), `scène ${v} ${W}x${H} u=${u.toFixed(2)}`);
  assert.ok(rendu(v, 1.2, W, H).n > 20, "la scène dessine quelque chose");
  const bx = W - 16, imp = 3.5;   /* lâché à 0,9 s, vol de 2,6 s (tour dans le ciel compris) */
  const avant = rendu(v, 0.5, W, H), apres = rendu(v, imp + 0.02, W, H);
  const at = (o, x, y) => (o.vv[y * W + x] ? o.c[y * W + x] : 0);
  assert.equal(at(avant, bx + 5, H - 2), 1, `scène ${v} ${W}x${H} : le dôme est au repos avant le contact (la base ambre est visible)`);
  assert.ok([2, 3].includes(at(apres, bx + 5, H - 2)), `scène ${v} ${W}x${H} : le bouton est enfoncé de deux rangées au contact`);
  assert.equal(at(apres, bx + 5, H - 3), 3, `scène ${v} ${W}x${H} : et il s'allume (blanc) un instant`);
  const fin = rendu(v, 4.5, W, H);
  assert.equal(fin.sk, 0, "le cul a disparu quand le mot s'écrit");
  assert.ok(fin.n > 30, "NUKE ! est écrit");
  const lignesMot = new Set(); fin.vv.forEach((x, i) => { if (x) lignesMot.add((i / W) | 0); });
  assert.ok(lignesMot.size >= 5, "des lettres de plusieurs rangées de haut");
}
// le ballon fait un VRAI CERCLE dans le ciel avant de s'écraser (Norman, 2026-11-03) : un tour complet de rayon R autour d'un centre fixe, puis il pique sur le bouton
{
  for (const H of [16, 34]) {
    const pos = (u) => JS(ev(`ballonPos(${u},30,${H - 9},124,${H - 6},${H})`)), c = JS(ev(`ballonCercle(${H},30,124)`));
    const tour = []; for (let u = 0.9 + 2.6 * 0.28; u <= 0.9 + 2.6 * 0.78 + 1e-9; u += 0.01) tour.push(pos(u));
    for (const p of tour) assert.ok(Math.abs(Math.hypot(p.x - c.cx, p.y - c.cy) - c.R) < 0.01, H + " : chaque point du tour est à la même distance du centre (cercle)");
    const w = Math.max(...tour.map((p) => p.x)) - Math.min(...tour.map((p) => p.x)), h = Math.max(...tour.map((p) => p.y)) - Math.min(...tour.map((p) => p.y));
    assert.ok(Math.abs(w - h) < 0.3 && w > 2 * c.R - 0.3, H + " : aussi large que haut (un rond vu de face) : " + w.toFixed(1) + " x " + h.toFixed(1));
    assert.ok(Math.min(...tour.map((p) => p.y)) >= 3, H + " : le cercle reste dans l'écran avec la place du ballon");
    assert.ok(Math.abs(pos(3.5).x - 124) < 0.01 && Math.abs(pos(3.5).y - (H - 6)) < 0.01, H + " : il arrive pile sur le bouton");
    assert.ok(Math.abs(pos(0.9).x - 30) < 0.01 && Math.abs(pos(0.9).y - (H - 9)) < 0.01, H + " : il part de sa place");
    let saut = 0; for (let u = 0.9; u < 3.5; u += 0.01) { const a2 = pos(u), b2 = pos(u + 0.01); saut = Math.max(saut, Math.hypot(a2.x - b2.x, a2.y - b2.y)); }
    assert.ok(saut < 3.2, H + " : trajectoire continue, sans téléportation (" + saut.toFixed(2) + ")");
  }
}

/* ---------------- flashs : au plus 3 transitions par seconde (même mesure que idle-borne-nuke-photosensible-v1), mouvement réduit ---------------- */
for (const v of [22]) {
  const L = JSON.parse(ev(`(function(){var W=120,H=14,N=W*H,p={base:0},L=[],t,i,s,pn=new Panel(document.createElement('canvas'),W,H);window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=${v};nukeRes={n:1,dernier:false,at:0};S.vic=5;
    for(t=0;t<7;t+=1/60){P=pn;pn.p=p;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=H-1;pn.YM=H;SC.nuke.fn(t);s=0;for(i=0;i<N;i++)s+=pn.v[i];L.push(s/(255*N));P=null;}
    window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=undefined;return JSON.stringify(L);})()`));
  const tr = []; let ref = 0.03; L.forEach((x, i) => { if (Math.abs(x - ref) > 0.3) { tr.push(i / 60); ref = x; } });
  for (let i = 0; i < tr.length; i++) { let k = 0; while (i + k < tr.length && tr[i + k] < tr[i] + 1) k++; assert.ok(k <= 3, "scène " + v + " : au plus 3 transitions par seconde"); }
  const fixe = (u) => ev(`(function(){var pn=new Panel(document.createElement('canvas'),120,14);pn.reduced=true;P=pn;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=13;pn.p={v:${v},base:0};SC.nuke.fn(${u});var s=Array.prototype.join.call(pn.v,',');P=null;return s;})()`);
  assert.equal(fixe(0.3), fixe(3.1), "scène " + v + " reduced-motion : image fixe « NUKE ! »");
  assert.ok(fixe(1).split(",").some((x) => x !== "0"));
}
assert.ok(/nkGouverneur\(t\)/.test(code), "aucune lueur plein écran propre à la scène (le régulateur passe dessus)");

/* ---------------- aucun miroir, aucun spoil, aucun texte ajouté ---------------- */
const zone = code.slice(code.indexOf("function comCoul"), code.indexOf("SPR.avion1"));
assert.ok(!/reverse\(|scale\(-|mirror|flip/i.test(zone), "aucun miroir");
assert.ok(!/bossActuel|S\.nom|S\.num|301/.test(zone), "aucun nom de boss ni total");
assert.ok(!/T\('/.test(zone), "aucun texte nouveau (donc aucune traduction à ajouter) hors NUKE ! habituel");
console.log("idle-borne-nuke-comique-v1: OK");
