// Norman (2026-10-29) : « les réapparitions ne sont pas variées (souvent un fondu) ; celles des boss et du joueur doivent être aussi variées que les morts ; il faut des sons qui collent » : sept retours du joueur et sept entrées de boss validés sur la page de démonstration, chacun avec son son.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const src = lire("cloudflare/public/modules/reapparitions-v1.js");

/* le module sur un faux navigateur et un faux contexte audio */
const noeud = () => ({ connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, value: 0 }, gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, Q: { value: 0 }, type: "", buffer: null });
let creesOsc = 0, creesBruit = 0;
const ctx = { currentTime: 0, sampleRate: 8000, createOscillator: () => { creesOsc++; return noeud(); }, createGain: noeud, createBiquadFilter: noeud, createBufferSource: () => { creesBruit++; return noeud(); }, createBuffer: (c, n) => ({ getChannelData: () => new Float32Array(n) }) };
const fenetre = { __SOREAL_IDLE_AUDIO_V199__: { synth: (ms, fn) => { assert.ok(ms > 500 && ms < 4000, "durée du son plausible : " + ms); fn(ctx, noeud()); return Promise.resolve(); } } };
vm.runInNewContext(src, { window: fenetre, document: { head: { appendChild() {} }, documentElement: {}, createElement: () => ({ style: {} }) }, setTimeout, Math, Object, Array, Promise, performance: { now: () => 0 }, getComputedStyle: () => ({}) });
const R = fenetre.__SOREAL_IDLE_REAPPARITIONS_V1__;

// 1. exactement les effets validés (Norman : « je jette » Surgit du trou et Griffures)
assert.deepEqual([...R.joueur].map((x) => x.id), ["marche", "rebond", "tampon", "puzzle", "faisceau", "ballon", "toupie"]);
assert.deepEqual([...R.boss].map((x) => x.id), ["ecrasement", "surgissement", "portail", "silhouette", "plongeon", "fumee", "briques"]);
assert.ok(!src.includes("id:'trou'") && !src.includes("id:'griffes'"), "les effets jetés ne sont pas dans le jeu");
for (const e of [...R.joueur, ...R.boss]) assert.ok(e.duree >= 1 && e.duree <= 3, e.id + " : durée");

// 2. un son PROPRE à chaque effet, qui se construit sans erreur et fait entendre quelque chose
for (const e of [...R.joueur, ...R.boss]) {
  assert.equal(typeof R.sons[e.id], "function", "son de " + e.id);
  const avant = creesOsc + creesBruit;
  R.sons[e.id](ctx, noeud(), 0);
  assert.ok(creesOsc + creesBruit - avant >= 4, e.id + " : un vrai son (plusieurs voix)");
}
assert.equal(new Set(Object.values(R.sons).map((f) => String(f))).size, Object.keys(R.sons).length, "aucun son partagé entre deux effets");

// 3. les sons n'ont pas le défaut du claquement (gain de départ posé dès la création)
assert.ok(/g\.gain\.value=0\.0001;g\.gain\.setValueAtTime\(0\.0001,t\)/.test(src), "gain initial posé");

// 4. câblage : le joueur revient par la file (le fondu en est sorti), les boss prennent les sept entrées après les dix premières
const mort = lire("cloudflare/public/modules/mort-joueur-v1.js");
assert.ok(mort.includes("var CHOIX=['rewind','clignote'].concat(RETOURS).concat(NOUVEAUX);") && mort.includes("if(variante!=='fondu'&&CHOIX.indexOf(variante)<0)variante=suivante_(CHOIX);"), "joueur : fondu retiré de la file, retours ajoutés");
assert.ok(mort.includes("REAPP.jouer('joueur',variante,{calque:calque,img:img})"), "joueur : retour joué dans le calque opaque");
const app = lire("cloudflare/public/modules/apparition-boss-v1.js");
assert.ok(app.includes("function nbEffets(){") && app.includes("var m=nbEffets();return ((n-1)%m+m)%m;"), "boss : dix effets puis sept nouveaux, en suivant le numéro");
assert.ok(app.includes("REAPP.jouer('boss',neuf.id,{calque:calque,img:img})"), "boss : entrée jouée dans le calque");
const index = lire("cloudflare/public/index.html");
assert.ok(/<script defer src="\/modules\/reapparitions-v1\.js\?v=\d+"><\/script>/.test(index), "module chargé");
assert.ok(index.indexOf("reapparitions-v1.js") < index.indexOf("apparition-boss-v1.js"), "avant les modules qui l'utilisent");
console.log("idle-reapparitions-v1 : OK");
