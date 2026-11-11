import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * Défaite en Red Room (Norman, 2026-11-03) : à la fin de la scène (main sur l'épaule, éclairs bleus), la scène DISPARAÎT et un visage en bitmap LED « digitalisé » apparaît seul, avec des éclairs fins.
 * Gardes : bitmap compact (<= 4 Ko, 64 x 40, chiffres 0 à 7), aucun nom propre, séquence (scène, noir, apparition, visage seul >= 3 s, noir, texte), photosensibilité simulée à 60 images/s à plusieurs hauteurs
 * (au plus 3 changements de luminosité moyenne de plus de 30 % par seconde, >= 0,34 s entre deux, montée >= 0,1 s, descente >= 0,28 s), mouvement réduit = image fixe, victoire et autres défaites inchangées.
 */
const lire = (f) => fs.readFileSync(new URL("../" + f, import.meta.url), "utf8");
const src = lire("public/modules/borne-led-v1.js");
const code = src.replace(/\/\*[\s\S]*?\*\//g, "");

const toile = () => ({ width: 0, height: 0, getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true }) });
const fen = { innerWidth: 1000, addEventListener() {}, devicePixelRatio: 1, localStorage: { getItem: () => "fr" }, matchMedia: () => ({ matches: false }), requestAnimationFrame: () => 1, cancelAnimationFrame() {}, performance: { now: () => 0 }, document: { hidden: false, createElement: toile, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, getElementById: () => null } };
fen.window = fen;
const c = vm.createContext({ ...fen, window: fen, document: fen.document, localStorage: fen.localStorage, Math, Uint8Array, Uint32Array, String, Number, Boolean, parseInt, isFinite, JSON, setTimeout, clearTimeout });
const idx = src.lastIndexOf("})();");
vm.runInContext(src.slice(0, idx) + "window.__EV__=function(e){return eval(e);};" + src.slice(idx), c);
const ev = (e) => fen.__EV__(e);

/* 1. bitmap */
const bm = /var VIS_BM='([0-7]+)';/.exec(src);
assert.ok(bm && bm[1].length === 64 * 40, "bitmap 64 x 40, un chiffre 0 à 7 par point");
assert.ok(bm[1].length <= 4096, "bitmap <= 4 Ko");
assert.ok(new Set(bm[1].split("")).size >= 7, "au moins 7 niveaux de luminosité utilisés");
const bloc = src.slice(src.indexOf("var VIS_W="), src.indexOf("function sKO(t)"));
const interdits = [/twin/i, /peaks/i, /lynch/i, /\bbob\b/i, /killer/i, /laura/i, /cooper/i, /david/i, /photo\.png/i];
for (const re of interdits) assert.ok(!re.test(bloc), "aucun nom propre dans le code du visage : " + re);
assert.ok(!fs.existsSync(new URL("../../design/apercu-redroom-visage/_tmp-visage/photo.png", import.meta.url)), "la photo d'origine n'est pas dans le dépôt");

/* 2. simulation image par image : [luminosité moyenne, points allumés dans le rectangle du visage, hors du rectangle, couleurs] */
const toutes = (W, H, anim) => JSON.parse(ev(`(function(){var W=${W},H=${H},N=W*H,p={anim:${JSON.stringify(anim)},pc0:0.55,tg0:3},pn=new Panel(document.createElement('canvas'),W,H,true),R0=[],t,i,s,dur=SC.ko.dur(p),fh=Math.min(H,Math.floor((W-2)*40/64)),fw=Math.max(8,Math.round(fh*64/40)),x0=Math.floor((W-fw)/2),cols;
  for(t=0;t<dur;t+=1/60){P=pn;pn.p=p;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=H-1;pn.YM=H;pn.reduced=false;
    SC.ko.fn(t);var g=Math.min(1,Math.min(t,dur-t)/0.2);if(g<0)g=0;
    s=0;var dans=0,hors=0;cols={};for(i=0;i<N;i++){var v=pn.v[i]*g;s+=v;if(pn.v[i]>0){cols[pn.c[i]]=1;var x=i%W;if(x>=x0&&x<x0+fw)dans++;else hors++;}}
    R0.push([s/(255*N),dans,hors,Object.keys(cols).join('')]);P=null;}
  return JSON.stringify({dur:dur,L:R0});})()`));
function transitions(L) { const T = []; let ref = 0.0; L.forEach((x, i) => { if (Math.abs(x - ref) > 0.3) { T.push(i / 60); ref = x; } }); return T; }
function pire(T) { let m = 0; for (let i = 0; i < T.length; i++) { let k = 0; while (i + k < T.length && T[i + k] < T[i] + 1) k++; m = Math.max(m, k); } return m; }
function ecartMin(T) { let m = 9; for (let i = 1; i < T.length; i++) m = Math.min(m, T[i] - T[i - 1]); return m; }
const rap = [];
const T0 = ev("VIS_T0"), T1 = ev("VIS_T1"), TX = ev("VIS_TXT");
for (const [W, H] of [[140, 34], [120, 16], [140, 24], [100, 12]]) {
  const r = toutes(W, H, "redroom"), L = r.L.map((x) => x[0]), F = r.L;
  const im = (t) => F[Math.round(t * 60)];
  assert.ok(im(1.5)[1] + im(1.5)[2] > 100, `${W}x${H} : avant, la scène de la Red Room est là`);
  assert.equal(im(T0 - 0.1)[1] + im(T0 - 0.1)[2], 0, `${W}x${H} : noir entre la scène et le visage`);
  assert.ok(im(T0 + 0.15)[2] > 20, `${W}x${H} : apparition numérique : de la neige sur tout l'écran`);
  let frames = 0, horsMax = 0, couleursOk = true;
  for (let i = Math.round((T0 + 0.5) * 60); i < Math.round(T1 * 60); i++) { if (F[i][1] > 40) frames++; horsMax = Math.max(horsMax, F[i][2]); if (/[^35]/.test(F[i][3])) couleursOk = false; }
  assert.ok(frames / 60 >= 3, `${W}x${H} : le visage reste au moins 3 s (${(frames / 60).toFixed(2)} s)`);
  assert.ok(couleursOk, `${W}x${H} : visage seul : points bleus et blancs uniquement (aucune couleur de la scène, aucun texte)`);
  assert.ok(horsMax < 0.1 * W * H, `${W}x${H} : rien d'autre que les éclairs hors du visage (${horsMax} points)`);
  assert.ok(im(T1 + 0.3)[1] + im(T1 + 0.3)[2] === 0, `${W}x${H} : le visage s'éteint avant le texte`);
  assert.ok(im(TX + 0.5)[3].length > 0, `${W}x${H} : le texte final revient après le visage`);
  const T = transitions(L), p = pire(T), e = ecartMin(T);
  let mo = 0, de = 0;
  for (let i = 1; i < L.length; i++) { const d = L[i] - L[i - 1]; mo = Math.max(mo, d * 60); de = Math.max(de, -d * 60); }
  assert.ok(p <= 3, `${W}x${H} : au plus 3 transitions par seconde (${p})`);
  assert.ok(e >= 0.34 - 1 / 60 - 1e-9, `${W}x${H} : au moins 0,34 s entre deux transitions (${e.toFixed(3)})`);
  assert.ok(mo <= 1 / 0.1 + 0.01, `${W}x${H} : montée >= 0,1 s (${mo.toFixed(2)}/s)`);
  assert.ok(de <= 1 / 0.28 + 0.01, `${W}x${H} : descente >= 0,28 s (${de.toFixed(2)}/s)`);
  rap.push(`${W}x${H}: transitions ${T.length}, pire seconde ${p}, écart min ${T.length > 1 ? e.toFixed(2) : "-"} s, montée max ${mo.toFixed(2)}/s, descente max ${de.toFixed(2)}/s, visage ${(frames / 60).toFixed(2)} s`);
}
assert.ok(ev("SC.ko.dur({anim:'redroom'})") === ev("KO_RR_DUR") && ev("KO_RR_DUR") >= T1 + 2, "durée de la défaite en Red Room : visage puis texte");
assert.ok(T1 - T0 >= 3, "visage prévu au moins 3 s");
assert.ok(ev("SC.ko.dur({anim:'mascot'})") === 8.8 && ev("SC.ko.dur({anim:'sweep'})") === 8.8 && ev("SC.ko.dur({})") === 6.4, "les autres défaites gardent leur durée");
assert.ok(/ko:\{fn:sKO,dur:function\(p\)\{return p\.anim==='yeuxcb'\?ycFin\(p,'ko'\)\+6\.4:p\.anim==='redroom'\?KO_RR_DUR/.test(code), "durée de la défaite redroom");
assert.ok(ev("coupeApres({id:'ko',p:{anim:'redroom'},dur:9.6})") === 9.6 && ev("coupeApres({id:'ko',p:{anim:'mascot'},dur:8.8})") === 4.2, "un nouveau combat n'interrompt pas le visage ; les autres défaites gardent leur coupe");

/* 3. éclairs : irréguliers, espacés d'au moins 0,45 s */
const ECL = ev("VIS_ECL.map(function(e){return e[0];})");
assert.ok(ECL.length >= 4, "plusieurs éclairs");
const ecarts = ECL.slice(1).map((x, i) => x - ECL[i]);
assert.ok(Math.min(...ecarts) >= 0.45 && new Set(ecarts.map((x) => x.toFixed(2))).size >= 3, "éclairs à rythme irrégulier, jamais à moins de 0,45 s");
assert.ok(ECL[ECL.length - 1] + 0.3 < T1 - T0, "tous les éclairs tiennent dans la durée du visage");

/* 4. mouvement réduit : image fixe du visage, identique à chaque instant (ni bruit ni éclairs) */
const fixe = (t) => ev(`(function(){var pn=new Panel(document.createElement('canvas'),140,34,true);P=pn;pn.p={anim:'redroom'};pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=33;pn.YM=34;pn.reduced=true;SC.ko.fn(${t});var s=Array.prototype.join.call(pn.v,',')+'|'+Array.prototype.join.call(pn.c,',');P=null;return s;})()`);
const f1 = fixe(3.9), f2 = fixe(5.2), f3 = fixe(0.1);
assert.equal(f1, f2); assert.equal(f1, f3);
assert.ok(f1.split("|")[0].split(",").filter((x) => +x > 0).length > 400, "mouvement réduit : le visage est affiché");

/* 5. victoire et autres défaites inchangées (même code qu'avant) */
assert.ok(src.includes("if(an==='redroom')sRedroom(t);else if(an==='egout')sEgout(t);else (an==='sweep'?sSweep:sMascot)(t);"), "victoire Red Room inchangée");
assert.ok(src.includes("if(an)tueRie(t);else if(am)ecrase(t);else if(fv)koVisage(t);else if(rr)perduRedroom(t);else if(eg)perduEgout(t);"), "défaites Leatherface (tueRie) et mascotte (ecrase) inchangées");
assert.ok(/function sKO\(t\)\{[\s\S]*if\(fv\)visGouverne\(tg\)/.test(code) && /function visGouverne\(tg\)\{[\s\S]*if\(P\.reduced\|\|P\.p\.essai\)return;[\s\S]*nkGouverneur\(tg\)/.test(code), "le régulateur du Nuke passe sur la défaite en Red Room");
assert.ok(!/setTimeout|setInterval/.test(bloc), "dessin calculé depuis le temps de la scène");
console.log("idle-borne-redroom-visage-v1: OK\n  " + rap.join("\n  "));
