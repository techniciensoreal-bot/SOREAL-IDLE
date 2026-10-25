import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-16) : « un son pour la porte qui s'ouvre » + « pouvoir déclencher l'animation moi-même et régler sa vitesse pour montrer celle que je préfère ». Banc d'essai (administrateur) en bas de la page
 * Yggdrasil : lancer les images, la porte (avec son son) et le son seul ; régler cadence, sens et durée d'ouverture ; les réglages sont ceux que le jeu utilise pour ce compte.
 */
const src = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");
const sons = readFileSync("cloudflare/public/modules/yggdrasil-sons-v1.js", "utf8");
const coupe = (re) => src.match(re)[0];

// 1. Réglages : valeurs d'origine, bornes, arrondis, persistance dans le stockage (donc liés au compte).
const codeR = [
  coupe(/var REGLAGES_DEFAUT_=\{[^\n]*\n/), coupe(/var CLE_REGLAGES_=[^\n]*\n/),
  coupe(/function reglages_\(\)\{[\s\S]*?\n {2}\}\n/), coupe(/function ecrireReglages_\(r\)\{[\s\S]*?\n {2}\}\n/),
  "this.api={reglages_:reglages_,ecrire:ecrireReglages_,defaut:REGLAGES_DEFAUT_,cle:CLE_REGLAGES_};"
].join("\n");
function stockage(initial = {}) {
  const d = { ...initial };
  const ctx = { JSON, Math, Number, isFinite, localStorage: { getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); } } };
  vm.runInNewContext("(function(){" + codeR + "}).call(this)", ctx);
  return { api: ctx.api, d };
}
{
  const { api, d } = stockage();
  const r = JSON.parse(JSON.stringify(api.reglages_()));
  assert.deepEqual(r, { cadence: 110, sens: -1, porte: 1, son: "pierre" }, "valeurs d'origine");
  api.ecrire({ cadence: 200, sens: 1, porte: 1.7, son: "bois" });
  assert.ok(String(api.cle).startsWith("soreal_idle_"), "clé suivie par prefs-compte-v1 : liée au compte");
  assert.deepEqual(JSON.parse(JSON.stringify(api.reglages_())), { cadence: 200, sens: 1, porte: 1.7, son: "bois" }, "réglages relus (bruit de porte compris)");
  const hors = stockage({ soreal_idle_ygg_anim_v1: JSON.stringify({ cadence: 9999, sens: 7, porte: 99 }) }).api.reglages_();
  assert.deepEqual([hors.cadence, hors.sens, hors.porte], [400, -1, 2.5], "valeurs hors bornes ramenées dans les bornes");
  const bas = stockage({ soreal_idle_ygg_anim_v1: JSON.stringify({ cadence: 1, porte: 0 }) }).api.reglages_();
  assert.deepEqual([bas.cadence, bas.porte], [30, 0.5]);
  assert.equal(stockage({ soreal_idle_ygg_anim_v1: "{pas du json" }).api.reglages_().cadence, 110, "stockage illisible : valeurs d'origine");
  assert.equal(stockage({ soreal_idle_ygg_anim_v1: JSON.stringify({ cadence: 133 }) }).api.reglages_().cadence, 130, "arrondi à 10 ms");
}

// 2. Les images suivent la cadence et le sens réglés (banc ET jeu : même fonction).
const codeI = [
  codeR.replace(/this\.api=[^\n]*$/, ""), "var etat={};",
  coupe(/var FRUITS_24_=\{[^}]*\};/),
  coupe(/function nbEtapes_\(id\)\{[^\n]*\n/),
  coupe(/function urlEtape_\(id,k\)\{[^\n]*\n/), coupe(/function jouerImages_\(id,vitre,depart,R,fini\)\{[\s\S]*?\n {2}\}\n/),
  "this.api={jouerImages_:jouerImages_,reglages_:reglages_};"
].join("\n");
function jouer(R, depart) {
  let t = 0; const timers = []; const calques = [];
  const el = () => ({ srcs: [], attrs: {}, parentNode: null, setAttribute(k, v) { this.attrs[k] = v; }, set src(v) { this.srcs.push(v); } });
  const vitre = { appendChild(n) { n.parentNode = { removeChild() {} }; calques.push(n); } };
  const ctx = { JSON, Math, Number, isFinite, encodeURIComponent, localStorage: { getItem: () => null, setItem() {} }, document: { createElement: el }, setTimeout: (f, d) => { timers.push({ f, a: t + d }); } };
  vm.runInNewContext("(function(){" + codeI + "}).call(this)", ctx);
  let fini = 0; ctx.api.jouerImages_("gold", vitre, depart, R, () => { fini += 1; });
  while (timers.length) { timers.sort((a, b) => a.a - b.a); const x = timers.shift(); t = x.a; x.f(); }
  return { etapes: calques[0].srcs.map((u) => Number(u.match(/etape=(\d+)/)[1])), duree: t, fini };
}
{
  const a = jouer({ cadence: 110, sens: -1, porte: 1 }, 19);
  assert.deepEqual(a.etapes, Array.from({ length: 20 }, (_, i) => 19 - i), "arbre → graine");
  assert.equal(a.fini, 1);
  const b = jouer({ cadence: 110, sens: 1, porte: 1 }, 19);
  assert.deepEqual(b.etapes, Array.from({ length: 20 }, (_, i) => i), "graine → arbre : les mêmes 20 images dans l'autre sens");
  const lent = jouer({ cadence: 220, sens: -1, porte: 1 }, 19), vif = jouer({ cadence: 55, sens: -1, porte: 1 }, 19);
  assert.ok(Math.abs(lent.duree / a.duree - 2) < 0.1 && Math.abs(vif.duree / a.duree - 0.5) < 0.1, "la durée suit la cadence : " + [vif.duree, a.duree, lent.duree]);
}

// 3. La porte : durée de l'animation et du son proportionnelles au réglage.
assert.ok(/calc\(1\.25s\*var\(--vit,1\)\)/.test(src) && /calc\(1\.5s\*var\(--vit,1\)\)/.test(src) && /;--vit:'\+reglages_\(\)\.porte/.test(src), "durées CSS de la porte multipliées par --vit");
assert.ok(/son_\(nomSonPorte_\(\),vit\)/.test(src) && /DUREE_OUVERTURE_\*vit/.test(src), "son et fenêtre d'ouverture suivent le réglage");
{
  const fin = (k) => {
    let max = 0;
    const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
    const ctx = {
      sampleRate: 8000, currentTime: 0, destination: {},
      createBuffer: (c, n) => ({ getChannelData: () => new Float32Array(n) }),
      createBufferSource: () => ({ connect() {}, start(t) { max = Math.max(max, t); }, buffer: null }),
      createBiquadFilter: () => ({ type: "", frequency: param(), Q: { value: 0 }, connect() {} }),
      createGain: () => ({ gain: param(), connect() {} }),
      createOscillator: () => ({ type: "", frequency: param(), connect() {}, start(t) { max = Math.max(max, t); }, stop(t) { max = Math.max(max, t); } })
    };
    const fen = { AudioContext: function () { return ctx; }, __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getInterface: () => 1 } };
    fen.window = fen;
    vm.runInNewContext(sons, fen);
    fen.__SOREAL_IDLE_YGG_SONS_V1__.construire("porte", ctx, {}, 0, Math.random, k);
    return max;
  };
  const un = fin(1), deux = fin(2), demi = fin(0.5), defaut = fin(undefined);
  assert.ok(un > 0.7 && un < 1.3, "porte lourde sans mélodie finale : environ 0,9 s : " + un);
  assert.ok(Math.abs(deux / un - 2) < 0.15 && Math.abs(demi / un - 0.5) < 0.1, "durée du son proportionnelle au réglage : " + [demi, un, deux]);
  assert.equal(defaut, un, "sans réglage : durée normale");
}

// 4. Branchement : banc visible seulement pour l'administrateur, aucune action envoyée au serveur, panneau gardé au redessin.
const banc = coupe(/function banc_\(\)\{[\s\S]*?\n {2}\}\n/);
assert.ok(banc.includes("if(!admin_())return '';"), "administrateur seulement");
assert.ok(/estAdminSorealIdle_/.test(coupe(/function admin_\(\)[^\n]*\n/)), "statut d'administrateur du jeu");
for (const f of ["bancImages", "bancPorte", "bancSon", "bancRaz", "banc:function", "bancAffiche"]) assert.ok(src.includes(f), f + " exposé");
assert.ok(!/action_\(/.test(src.slice(src.indexOf("function banc_()"), src.indexOf("function carte_(d,v)"))), "le banc n'envoie rien au serveur");
assert.ok(src.includes("p.setAttribute('data-morph-garder','')") && /ygg-anim/.test(src), "calques de démonstration gardés par le redessin (règle n°4)");
assert.ok(["Images", "Porte + son", "Son seul", "Valeurs d’origine"].every((t) => banc.includes(t)), "boutons du banc");
assert.ok(banc.includes('type="range" min="30" max="400"') && banc.includes('type="range" min="0.5" max="2.5"') && banc.includes('name="yggBancSens"'), "curseurs de vitesse et choix du sens");
console.log("idle-yggdrasil-banc-animations-v1: OK");
