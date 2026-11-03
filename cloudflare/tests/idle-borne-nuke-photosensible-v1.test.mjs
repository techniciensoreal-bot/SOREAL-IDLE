import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * Photosensibilité (Norman, 2026-11-03) : la scène NUKE de la borne ne clignote jamais.
 * Règle : jamais plus de 3 changements de luminosité moyenne de l'écran de plus de 30 % par seconde glissante (<= 6 transitions
 * = 3 flashs aller-retour dans la règle du coordinateur ; le régulateur en tolère 3 par seconde), au moins 0,34 s entre deux transitions,
 * montée >= 80 ms, descente >= 250 ms (aucune coupure franche blanc -> noir). Simulation image par image à 60 images/s de TOUTES les scènes
 * (13 de base, 7 réservées, finale) à plusieurs nombres de boss (avec et sans jalons).
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

/* luminosité moyenne (0 à 1) de la zone des scènes, image par image à 60 images/s ; brut = sans le régulateur (pour comparer) */
function serie(v, n, dernier, brut, W = 120, H = 14) {
  return JSON.parse(ev(`(function(){var W=${W},H=${H},N=W*H,p={base:0},L=[],t,i,s,pn=new Panel(document.createElement('canvas'),W,H);
    window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=${v < 0 ? "undefined" : v};nukeRes={n:${n},dernier:${dernier},at:0};S.vic=5;
    for(t=0;t<11.5;t+=1/60){P=pn;pn.p=p;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=H-1;pn.YM=H;
      ${brut ? "sNukeBrut(t)" : "SC.nuke.fn(t)"};
      if(p.res&&t>p.ts+nukeDuree(p.tier,p.d,p.fin,p.tn)+0.3)break;
      s=0;for(i=0;i<N;i++)s+=pn.v[i];L.push(s/(255*N));P=null;}
    window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=undefined;return JSON.stringify(L);})()`));
}
/* transitions : écart de plus de 30 % de luminosité moyenne par rapport au dernier point de référence (hystérésis) */
function transitions(L) {
  const T = []; let ref = 0.03;   // l'amorce part du noir
  L.forEach((x, i) => { if (Math.abs(x - ref) > 0.3) { T.push(i / 60); ref = x; } });
  return T;
}
function pire(T) { let m = 0; for (let i = 0; i < T.length; i++) { let k = 0; while (i + k < T.length && T[i + k] < T[i] + 1) k++; m = Math.max(m, k); } return m; }
function ecartMin(T) { let m = 9; for (let i = 1; i < T.length; i++) m = Math.min(m, T[i] - T[i - 1]); return m; }
function pente(L) { let montee = 0, descente = 0; for (let i = 1; i < L.length; i++) { const d = L[i] - L[i - 1]; montee = Math.max(montee, d * 60); descente = Math.max(descente, -d * 60); } return [montee, descente]; }

const cas = [];
for (let v = 0; v <= 13; v++) cas.push([v, 1, false], [v, 25, false], [v, 250, false]);
for (const [v, n] of [[14, 25], [15, 45], [16, 120], [17, 120], [18, 120], [19, 250], [20, 250], [19, 301], [20, 55]]) cas.push([v, n, false]);
cas.push([-1, 301, true]);
let pireTrans = 0, pireEcart = 9, pireMontee = 0, pireDescente = 0;
const rapport = [];
for (const [v, n, d] of cas) {
  const L = serie(v, n, d, false), T = transitions(L), p = pire(T), e = ecartMin(T), [mo, de] = pente(L);
  pireTrans = Math.max(pireTrans, p); pireEcart = Math.min(pireEcart, e); pireMontee = Math.max(pireMontee, mo); pireDescente = Math.max(pireDescente, de);
  assert.ok(L.length > 120, `scène ${v} (n=${n}) simulée sur toute sa durée`);
  assert.ok(p <= 3, `scène ${v} n=${n} : au plus 3 transitions par seconde (${p}) — la règle autorise 6 ; le régulateur en tolère moins`);
  assert.ok(e >= 0.34 - 1 / 60 - 1e-9, `scène ${v} n=${n} : au moins 0,34 s entre deux transitions (${e.toFixed(3)})`);
  assert.ok(mo <= 1 / 0.1 + 0.01, `scène ${v} n=${n} : montée d'au moins 0,1 s (${mo.toFixed(2)}/s)`);
  assert.ok(de <= 1 / 0.28 + 0.01, `scène ${v} n=${n} : descente d'au moins 0,28 s (${de.toFixed(2)}/s) : pas de coupure franche`);
  if (process.env.NUKE_LUM && (v >= 19 || v < 0)) {
    const B = serie(v, n, d, true), TB = transitions(B), [moB, deB] = pente(B);
    rapport.push(`scène ${v} n=${n} : AVANT ${TB.length} transitions (pire seconde ${pire(TB)}, écart min ${ecartMin(TB).toFixed(2)} s, montée max ${moB.toFixed(1)}/s, descente max ${deB.toFixed(1)}/s) ; APRÈS ${T.length} (pire seconde ${p}, écart min ${e.toFixed(2)} s, montée max ${mo.toFixed(1)}/s, descente max ${de.toFixed(1)}/s) ; luminosité max ${Math.max(...B).toFixed(2)} -> ${Math.max(...L).toFixed(2)}`);
  }
}
if (process.env.NUKE_LUM) console.log(rapport.join("\n"));

/* le régulateur lui-même : un plein écran blanc brutal est étalé (montée), puis retenu (descente) ; jamais deux flashs à moins de 0,34 s */
assert.ok(ev("NK_MONTEE") >= 0.08 && ev("NK_DESCENTE") >= 0.25 && ev("NK_ESPACE") >= 0.34, "constantes de sécurité");
const L = JSON.parse(ev(`(function(){var W=120,H=14,N=W*H,p={base:0,res:true,ts:0,tier:0,d:0,n:1,v:0,tn:2.7,fin:false},pn=new Panel(document.createElement('canvas'),W,H),L=[],t,i,s;
  for(t=0;t<3;t+=1/60){P=pn;pn.p=p;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=H-1;pn.YM=H;
    var on=(t>0.5&&t<0.6)||(t>0.7&&t<0.8)||(t>0.9&&t<1.0)||(t>1.1&&t<1.2)||(t>1.3&&t<1.4)||(t>1.5&&t<1.6);   /* six flashs blancs plein écran en 1,1 s */
    if(on)plein(BLA,255);
    nkGouverneur(t);s=0;for(i=0;i<N;i++)s+=pn.v[i];L.push(s/(255*N));P=null;}
  return JSON.stringify(L);})()`));
const TT = transitions(L);
assert.ok(pire(TT) <= 3 && ecartMin(TT) >= 0.34 - 1 / 60 - 1e-9, "six flashs blancs d'affilée : le régulateur les fusionne (au plus 3 transitions par seconde)");
assert.ok(pente(L)[0] <= 10.01 && pente(L)[1] <= 3.58, "montée >= 0,1 s, descente >= 0,28 s");

/* sources : aucune scène n'enchaîne de flash par explosion, ni flash de fond de palier, ni flash de jalon */
assert.ok(!/ws=z>=4/.test(code), "plus de flashs de fond supplémentaires par palier");
const jalons = code.slice(code.indexOf("function nkJalons"), code.indexOf("function nukeFixe"));
assert.ok(!/eclair\(|plein\(/.test(jalons), "jalons : aucun flash plein écran");
assert.ok(/function sNuke\(t\)\{sNukeBrut\(t\);if\(!P\.reduced&&!P\.p\.annule&&!P\.p\.essai\)nkGouverneur\(t\);\}/.test(code), "le régulateur passe sur chaque image de la scène, après le dessin");
// prefers-reduced-motion : image fixe, aucune animation (donc aucun flash)
assert.ok(/if\(P\.reduced\)\{nukeFixe\(\);return;\}/.test(code));
console.log(`idle-borne-nuke-photosensible-v1: OK (pire seconde : ${pireTrans} transitions, écart min ${pireEcart.toFixed(2)} s, montée max ${pireMontee.toFixed(1)}/s, descente max ${pireDescente.toFixed(2)}/s)`);
