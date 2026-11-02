import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Fluidité du menu « Combat de boss » (audit du 2026-11-02, Norman : « jamais sous 60 images/s »).
 * Mesuré (navigateur, combat simulé) : le panneau LED de la borne faisait ~3 000 drawImage par image (la jauge de vie du boss, immobile, était repeinte 60 fois par seconde) ;
 * il compare maintenant la grille à celle déjà affichée et ne repeint que les cellules changées (et leurs voisines : le halo déborde d'une cellule) dans un rectangle de découpe,
 * avec un résultat identique pixel pour pixel à un redessin complet (vérifié dans le navigateur sur 300 images aléatoires).
 */
const src = readFileSync("cloudflare/public/modules/borne-led-v1.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-borne-led-v1.css", "utf8");
const themes = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");

// canvas opaque, aucun toucher reçu
assert.ok(src.includes("getContext('2d',{alpha:false})"), "canvas LED opaque (alpha:false)");
assert.ok(/\.bn-led-canvas\{[^}]*pointer-events:none/.test(css), "le canvas LED ne reçoit aucun toucher");

// repeinture par cellules changées
assert.ok(src.includes("this.pc=new Uint8Array(n)") && src.includes("this.pl=new Uint8Array(n)") && src.includes("this.pg=new Uint8Array(n)"), "grille précédente gardée (couleur, niveau du coeur, niveau du halo)");
assert.ok(src.includes("if(nc===0&&!this.neuf&&this.nd%240!==0){P=null;return;}"), "rien de changé : aucun dessin");
assert.ok(src.includes("ctx.clip();") && src.includes("ctx.save();ctx.beginPath();") && src.includes("ctx.restore();"), "repeinture dans un rectangle de découpe");
assert.ok(src.includes("this.neuf=true"), "tout est repeint après un changement de grille, de taille ou de sprites");
assert.ok(src.includes("redessinerTout:function"), "API de contrôle : tout redessiner");

// halo de cadre des portraits : toujours invisible (box-shadow:none!important), donc plus d'animation qui force un recalcul de style par image
assert.ok(!/\.combat-actif \.soreal-idle-(duel-portrait|player-portrait)-v41[^{]*\{\s*animation:sorealHalo/.test(themes), "aucune animation de halo sur les portraits");
assert.ok(themes.includes("@keyframes sorealHaloBossV1") && themes.includes("@keyframes sorealHaloJoueurV1"), "keyframes conservés");

// ---------- exécution réelle sur un faux navigateur : compte des appels de dessin ----------
function fausseToile(journal) {
  const ctx = new Proxy({}, {
    get: (_t, k) => {
      if (k === "createRadialGradient" || k === "createLinearGradient") return () => ({ addColorStop() {} });
      return (...a) => { journal.push(k); };
    },
    set: () => true,
  });
  return { width: 0, height: 0, style: {}, getContext: (t, o) => { if (o) journal.opts = o; return ctx; }, setAttribute() {}, className: "" };
}
const journal = [];
const documentFaux = { hidden: false, createElement: () => fausseToile(journal), querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, getElementById: () => null };
const fenetre = {
  innerWidth: 1000, addEventListener() {}, devicePixelRatio: 1, document: documentFaux, performance: { now: () => 0 },
  matchMedia: () => ({ matches: false }), requestAnimationFrame: () => 1, cancelAnimationFrame() {},
  localStorage: { getItem: () => null },
};
fenetre.window = fenetre;
const ctxVm = vm.createContext({ ...fenetre, window: fenetre, document: documentFaux, localStorage: fenetre.localStorage, performance: fenetre.performance, setTimeout, clearTimeout, Math, Uint8Array, Int32Array, String, Number, Array, Object, Boolean, RegExp, JSON, parseInt, isFinite, Date });
const idx = src.lastIndexOf("})();");
vm.runInContext(src.slice(0, idx) + "window.__EV__=function(e){return eval(e);};" + src.slice(idx), ctxVm);
const ev = (e) => fenetre.__EV__(e);

ev("window.__p=new Panel(document.createElement('canvas'),40,10,true);window.__p.fit(4,160,40);1");
assert.equal(journal.opts && journal.opts.alpha, false, "getContext('2d',{alpha:false})");
const dessin = (cellules) => {
  journal.length = 0;
  ev(`(function(){window.__p.draw(function(){var P2=window.__ledP();${JSON.stringify(cellules)}.forEach(function(c){P2.c[c[0]]=c[1];P2.v[c[0]]=c[2];});},0,1,{});})()`);
  return journal.slice();
};
ev("window.__ledP=function(){return P;}");
const n = (a, k) => a.filter((x) => x === k).length;

const premier = dessin([[45, 1, 255], [46, 2, 200]]);
assert.ok(n(premier, "drawImage") >= 1 + 2 + 2, "premier dessin : tout est repeint (fond + halos + coeurs)");
assert.equal(n(premier, "clip"), 0, "premier dessin complet : sans découpe");

const identique = dessin([[45, 1, 255], [46, 2, 200]]);
assert.equal(identique.filter((x) => x === "drawImage").length, 0, "grille identique : aucun drawImage");

const petit = dessin([[45, 1, 255], [46, 2, 200], [100, 3, 255]]);
assert.equal(n(petit, "clip"), 1, "une cellule changée : repeinture découpée");
assert.ok(n(petit, "drawImage") < 20, "une cellule changée : quelques drawImage seulement (" + n(petit, "drawImage") + ")");
assert.ok(n(petit, "rect") >= 3, "rectangles de découpe : la cellule et ses voisines (3 rangées)");

ev("window.__p.neuf=true;1");
const force = dessin([[45, 1, 255], [46, 2, 200], [100, 3, 255]]);
assert.equal(n(force, "clip"), 0, "tout redessiner : sans découpe");
assert.ok(n(force, "drawImage") >= 1 + 3 + 3, "tout redessiner : fond + halos + coeurs");

console.log("idle-fluidite-combat-led-v1: OK");
