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
assert.equal(ev("NUKES.length"), 24);
assert.equal(ev("NUKES[10].name"), "superNuke");
assert.equal(ev("NUKES[12].name"), "chien");
assert.equal(ev("NUKES[BOMBARDIER].name"), "bombardier");
assert.equal(ev("NUKES[21].name"), "finale");
assert.equal(ev("NK_FINALE"), 21, "la finale garde l'indice 21");
assert.equal(ev("NUKES[22].name"), "culQuiPete");
assert.equal(ev("NUKES[23].name"), "ballon");
assert.deepEqual(JS(ev("NK_COMIQUES")), [22, 23]);
assert.ok(!(22 in JS(ev("NK_RESERVEES"))) && !(23 in JS(ev("NK_RESERVEES"))), "pas des scènes réservées aux paliers hauts");
assert.equal(ev("NK_SCN[22]"), 3.6, "durée propre du cul qui pète : 3,6 s");
assert.equal(ev("NK_SCN[23]"), 3.2, "durée propre du ballon : 3,2 s");
assert.ok(/NK_SCN=\{12:CHIEN_TN,22:CUL_TN,23:BAL_TN\}/.test(code));
assert.ok(ev("nukeDuree(0,0,false,3.6)") > ev("nukeDuree(0,0,false)"));

/* ---------------- tirages ---------------- */
const tirer = (tier, n = 3000) => { ev("nukeSac=[];nukeDernier=-1"); return Array.from({ length: n }, () => ev(`nukeVariante(${tier})`)); };
for (const tier of [0, 1]) {
  const t = tirer(tier);
  assert.ok(!t.includes(10), "palier " + tier + " : jamais SUPER NUKE");
  assert.ok(t.every((v) => (v <= 13) || v === 22 || v === 23), "palier " + tier + " : base et comiques seulement");
  const part = t.filter((v) => v === 22 || v === 23).length / t.length;
  assert.ok(part >= 0.5 && part < 0.75, "palier " + tier + " : une scène comique au moins une fois sur deux (" + part.toFixed(3) + ")");
  assert.ok(t.includes(22) && t.includes(23), "les deux scènes comiques sortent");
  for (const v of [0, 5, 9, 12, 13]) assert.ok(t.includes(v), "palier " + tier + " : la scène de base " + v + " sort toujours");
  for (let i = 1; i < t.length; i++) if (t[i] > 13 || t[i - 1] > 13) assert.notEqual(t[i], t[i - 1], "pas de répétition immédiate d'une scène comique");
}
const t2 = tirer(2);
assert.ok(t2.includes(10), "palier 2 : SUPER NUKE reste possible");
assert.ok(!t2.includes(22) && !t2.includes(23), "palier 2 : pas de scène comique");
for (const tier of [3, 4]) { const t = tirer(tier, 600); assert.ok(!t.includes(10) && !t.includes(22) && !t.includes(23), "palier " + tier + " : inchangé"); }
/* Norman, 2026-11-03 : le chat (5), le chien (12), le cul qui pète (22) et le ballon (23) ne sortent QUE aux petits Nuke (paliers 0 et 1), jamais aux paliers 2, 3 et 4 */
assert.deepEqual(JS(ev("NK_PETITS_SEULEMENT")), [5, 12, 22, 23], "les quatre scènes réservées aux petits Nuke");
for (const tier of [0, 1]) { const t = tirer(tier, 3000); for (const v of [5, 12, 22, 23]) assert.ok(t.includes(v), "palier " + tier + " : la scène " + v + " sort"); }
for (const tier of [2, 3, 4]) { const t = tirer(tier, 3000); for (const v of [5, 12, 22, 23]) assert.ok(!t.includes(v), "palier " + tier + " : jamais la scène " + v + " (3000 tirages)"); }
assert.ok(tirer(2, 3000).some((v) => v <= 13 && v !== 10), "palier 2 : la moitié « base » reste tirée (sans chat ni chien)");
ev("nukeSac=[];nukeDernier=-1");
const brut = Array.from({ length: 3000 }, () => ev("nukeChoix()"));
assert.ok(brut.includes(10), "le tirage de base (nukeChoix) n'a pas changé : SUPER NUKE y est toujours");
const pb = brut.filter((v) => v === 13).length / brut.length;
assert.ok(pb > 0.13 && pb < 0.28, "bombardier : toujours environ 1 sur 5");
// le palier calculé depuis le nombre de boss : 1 à 2 = 0, 3 à 9 = 1, 10 = 2
assert.deepEqual([1, 2, 3, 9, 10, 49, 50].map((n) => ev(`nukePalier(${n})`)), [0, 0, 1, 1, 2, 2, 3]);
// scène forcée (outil de réglage) : 23 est accepté, la finale reste exclue
ev("window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=23");
assert.equal(JS(ev("(function(){var p={};nukeInit(p,1,false,0);return p.v;})()")), 23);
assert.equal(JS(ev("(function(){var p={};nukeInit(p,1,false,0);return p.tn;})()")), 3.2);
ev("window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=undefined");

/* ---------------- dessin : aucune erreur, bouton enfoncé puis NUKE ! ---------------- */
const rendu = (v, u, W, H) => JSON.parse(ev(`(function(){var pn=new Panel(document.createElement('canvas'),${W},${H});P=pn;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=${H - 1};pn.YM=${H};pn.p={essai:1,n:1};window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=${v};SC.nuke.fn(${u});window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=undefined;
  var peau=indexCouleur([255,178,140]),n=0,sk=0,i,o={n:0,sk:0,c:[]};for(i=0;i<${W * H};i++)if(pn.v[i]){o.n++;if(pn.c[i]===peau)o.sk++;}o.c=Array.prototype.slice.call(pn.c);o.vv=Array.prototype.slice.call(pn.v);P=null;return JSON.stringify(o);})()`));
for (const v of [22, 23]) for (const [W, H] of [[60, 16], [140, 16], [140, 34]]) {
  for (let u = 0; u <= 3.6; u += 0.05) assert.doesNotThrow(() => rendu(v, u, W, H), `scène ${v} ${W}x${H} u=${u.toFixed(2)}`);
  assert.ok(rendu(v, 1.2, W, H).n > 20, "la scène dessine quelque chose");
  const bx = W - 16, imp = v === 22 ? 2.05 : 2.0;
  const avant = rendu(v, 0.5, W, H), apres = rendu(v, imp + 0.02, W, H);
  const at = (o, x, y) => (o.vv[y * W + x] ? o.c[y * W + x] : 0);
  assert.equal(at(avant, bx + 5, H - 2), 1, `scène ${v} ${W}x${H} : le dôme est au repos avant le contact (la base ambre est visible)`);
  assert.ok([2, 3].includes(at(apres, bx + 5, H - 2)), `scène ${v} ${W}x${H} : le bouton est enfoncé de deux rangées au contact`);
  assert.equal(at(apres, bx + 5, H - 3), 3, `scène ${v} ${W}x${H} : et il s'allume (blanc) un instant`);
  const fin = rendu(v, 3.4, W, H);
  assert.equal(fin.sk, 0, "le cul a disparu quand le mot s'écrit");
  assert.ok(fin.n > 30, "NUKE ! est écrit");
  const lignesMot = new Set(); fin.vv.forEach((x, i) => { if (x) lignesMot.add((i / W) | 0); });
  assert.ok(lignesMot.size >= 5, "des lettres de plusieurs rangées de haut");
}
// le cul est dessiné DE PROFIL (Norman, 2026-11-03) : une croupe chair au premier plan, la fesse du fond plus SOMBRE qui dépasse, un slip bleu, aucun sexe ; il se tortille avant le pet
{
  const a = rendu(22, 0.2, 140, 16), b = rendu(22, 0.2 + 0.1, 140, 16);
  assert.notDeepEqual(a.vv.join() + a.c.join(), b.vv.join() + b.c.join(), "les fesses se tortillent");
  assert.ok(rendu(22, 0.8, 140, 16).sk > 40, "beaucoup de points de peau");
  const idx = (r, g, bl) => ev(`indexCouleur([${r},${g},${bl}])`);
  const peau = idx(255, 178, 140), fond = idx(112, 48, 46), slip = idx(90, 160, 255);
  for (const [W, H] of [[60, 16], [140, 16], [140, 34]]) {
    const o = rendu(22, 0.5, W, H), n = (ci) => o.c.filter((c, i) => o.vv[i] && c === ci).length;
    assert.ok(n(peau) > 30, W + "x" + H + " : fesse du premier plan couleur chair (" + n(peau) + ")");
    assert.ok(n(fond) > 8, W + "x" + H + " : fesse du fond, chair FONCÉE, visible (" + n(fond) + ")");
    assert.ok(n(slip) > 8, W + "x" + H + " : slip bleu");
    // la fesse du fond dépasse du premier plan : à droite de la dernière chair claire d'une rangée il reste de la chair sombre
    const xmaxPeau = Math.max(...o.c.map((c, i) => (o.vv[i] && c === peau ? i % W : -1))), xmaxFond = Math.max(...o.c.map((c, i) => (o.vv[i] && c === fond ? i % W : -1)));
    assert.ok(xmaxFond > xmaxPeau, W + "x" + H + " : la fesse du fond dépasse à droite (de profil, tourné vers le bouton)");
    const rgb = ev("RGB"), clair = (ci) => rgb[ci].reduce((x, y) => x + y, 0);
    assert.ok(clair(fond) < clair(peau) * 0.6, "la chair du fond est nettement plus sombre");
  }
  const sansSexe = code.slice(code.indexOf("function culDessin"), code.indexOf("function culQuiPete"));
  assert.ok(!/sexe|penis|pénis|zizi/i.test(sansSexe) || /aucun sexe|pas de sexe/i.test(src), "aucune anatomie explicite");
}
// le pet : un jet BRUN (jamais vert), rien avant 1,0 s, puis jet horizontal, nuages et volutes brunes
{
  const coul = (u, W = 140, H = 16) => JSON.parse(ev(`(function(){var pn=new Panel(document.createElement('canvas'),${W},${H});P=pn;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=${H - 1};pn.YM=${H};pn.p={essai:1,n:1};window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=22;SC.nuke.fn(${u});window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=undefined;var C=comCoul(),o={brun:0,vert:0,i:0},i;for(i=0;i<pn.v.length;i++)if(pn.v[i]){if(pn.c[i]===C.brun||pn.c[i]===C.brun2)o.brun++;if(pn.c[i]===indexCouleur([150,205,40])||pn.c[i]===indexCouleur([225,235,100]))o.vert++;}P=null;return JSON.stringify(o);})()`));
  assert.equal(coul(0.9).brun, 0, "pas de jet avant le pet");
  for (const [W, H] of [[60, 16], [140, 16], [140, 34]]) {
    for (let u = 0; u <= 3.6; u += 0.05) assert.equal(coul(u, W, H).vert, 0, "aucun pixel vert de pet (" + W + "x" + H + " u=" + u.toFixed(2) + ")");
    assert.ok(coul(1.3, W, H).brun > 6, W + "x" + H + " : le jet brun sort de la raie");
    assert.ok(coul(1.6, W, H).brun > coul(1.3, W, H).brun * 0.8 && coul(1.6, W, H).brun > 15, "le jet et le nuage brun avancent");
  }
  const rgb = ev("RGB"), C = JS(ev("comCoul()"));
  for (const k of ["brun", "brun2"]) assert.ok(rgb[C[k]][0] > rgb[C[k]][1] && rgb[C[k]][1] > rgb[C[k]][2] && rgb[C[k]][1] < 140, k + " : une vraie couleur marron");
  // le jet part du bord droit du cul (de la jonction des fesses) et se dirige vers le bouton, qui est touché à 2,05 s
  const at = (u) => { const o = rendu(22, u, 140, 16); let mx = -1; o.c.forEach((c, i) => { if (o.vv[i] && (c === C.brun || c === C.brun2)) mx = Math.max(mx, i % 140); }); return mx; };
  assert.ok(at(1.5) > at(1.2) && at(1.9) > at(1.5), "le jet progresse vers la droite, vers le bouton");
  assert.ok(at(1.95) >= 124, "il atteint le bouton à environ 2,05 s");
}

/* ---------------- flashs : au plus 3 transitions par seconde (même mesure que idle-borne-nuke-photosensible-v1), mouvement réduit ---------------- */
for (const v of [22, 23]) {
  const L = JSON.parse(ev(`(function(){var W=120,H=14,N=W*H,p={base:0},L=[],t,i,s,pn=new Panel(document.createElement('canvas'),W,H);window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=${v};nukeRes={n:1,dernier:false,at:0};S.vic=5;
    for(t=0;t<7;t+=1/60){P=pn;pn.p=p;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=H-1;pn.YM=H;SC.nuke.fn(t);s=0;for(i=0;i<N;i++)s+=pn.v[i];L.push(s/(255*N));P=null;}
    window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=undefined;return JSON.stringify(L);})()`));
  const tr = []; let ref = 0.03; L.forEach((x, i) => { if (Math.abs(x - ref) > 0.3) { tr.push(i / 60); ref = x; } });
  for (let i = 0; i < tr.length; i++) { let k = 0; while (i + k < tr.length && tr[i + k] < tr[i] + 1) k++; assert.ok(k <= 3, "scène " + v + " : au plus 3 transitions par seconde"); }
  const fixe = (u) => ev(`(function(){var pn=new Panel(document.createElement('canvas'),120,14);pn.reduced=true;P=pn;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=13;pn.p={v:${v},base:0};SC.nuke.fn(${u});var s=Array.prototype.join.call(pn.v,',');P=null;return s;})()`);
  assert.equal(fixe(0.3), fixe(3.1), "scène " + v + " reduced-motion : image fixe « NUKE ! »");
  assert.ok(fixe(1).split(",").some((x) => x !== "0"));
}
assert.ok(/nkGouverneur\(t\)/.test(code) && !/function culQuiPete[\s\S]{0,4000}plein\(/.test(code.slice(code.indexOf("function culQuiPete"), code.indexOf("function ballonPos"))), "aucune lueur plein écran propre à la scène (le régulateur passe dessus)");

/* ---------------- aucun miroir, aucun spoil, aucun texte ajouté ---------------- */
const zone = code.slice(code.indexOf("function comCoul"), code.indexOf("SPR.avion1"));
assert.ok(!/reverse\(|scale\(-|mirror|flip/i.test(zone), "aucun miroir");
assert.ok(!/bossActuel|S\.nom|S\.num|301/.test(zone), "aucun nom de boss ni total");
assert.ok(!/T\('/.test(zone), "aucun texte nouveau (donc aucune traduction à ajouter) hors NUKE ! habituel");
console.log("idle-borne-nuke-comique-v1: OK");
