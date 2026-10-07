import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Vieux disques durs dans Wandoos (Norman, 2026-10-07) : six bruits synthétisés, tirés au hasard (jamais deux fois le même de suite) tant que l'ordinateur rétro est allumé et affiché ;
 * rien si le volume des sons de l'interface est à zéro ni quand la page est cachée.
 */
const src = readFileSync("cloudflare/public/modules/wandoos-disque-v1.js", "utf8");
const index = readFileSync("cloudflare/public/index.html", "utf8");
let noeuds = 0, contextes = 0, volume = 0.75, cache = false, affiche = true;
const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, cancelScheduledValues() {} });
const fauxContexte = () => ({
  state: "running", sampleRate: 8000, currentTime: 0, destination: {},
  createBuffer: (_c, n) => ({ getChannelData: () => new Float32Array(n) }),
  createBufferSource: () => { noeuds += 1; return { connect() {}, start() {}, buffer: null }; },
  createBiquadFilter: () => { noeuds += 1; return { type: "", frequency: param(), Q: { value: 0 }, connect() {} }; },
  createGain: () => { noeuds += 1; return { gain: param(), connect() {}, disconnect() {} }; },
  createOscillator: () => { noeuds += 1; return { type: "", frequency: param(), connect() {}, start() {}, stop() {} }; },
  resume() {}
});
const timers = [];
const fenetre = {
  document: { readyState: "complete", addEventListener() {}, get hidden() { return cache; }, querySelector: () => (affiche ? {} : null) },
  AudioContext: function () { contextes += 1; return fauxContexte(); },
  __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getInterface: () => volume },
  setTimeout: (f, ms) => { timers.push({ f, ms }); return timers.length; }, clearTimeout() {},
  Date, Math, Float32Array, Number
};
fenetre.window = fenetre;
vm.runInNewContext(src, fenetre, { filename: "wandoos-disque-v1.js" });
const D = fenetre.__SOREAL_IDLE_WANDOOS_DISQUE_V1__;
assert.ok(D && D.NOMS.length === 6, "six bruits de disque dur");
assert.ok(timers.length === 1 && timers[0].ms >= 6000 && timers[0].ms <= 22000, "un tirage planifié entre 6 et 22 secondes");

// Chacun des six construit un vrai son.
for (let i = 0; i < 6; i++) {
  const avant = noeuds;
  assert.equal(D.jouer(i), true, D.NOMS[i] + " jouable");
  assert.ok(noeuds - avant >= 12, D.NOMS[i] + " : un vrai son (" + (noeuds - avant) + " nœuds)");
}
assert.equal(D.jouer(6), false, "numéro inconnu refusé");

// Jamais deux fois le même de suite, et tous sortent à l'usage.
let precedent = -1; const vus = new Set();
for (let k = 0; k < 400; k++) { const i = D.choisir(); assert.notEqual(i, precedent, "jamais deux fois de suite"); precedent = i; vus.add(i); }
assert.equal(vus.size, 6, "les six sortent");

// Volume à zéro : silence.
volume = 0; const av = noeuds; assert.equal(D.jouer(0), false); assert.equal(noeuds, av, "volume à zéro : rien");
volume = 0.75;

// Planification : joue seulement si l'ordinateur est affiché et la page visible.
timers.length = 0; D.arreter(); D.demarrer();
const lancer = () => { const t = timers.shift(); const avant = noeuds; t.f(); return noeuds - avant; };
affiche = true; cache = false; assert.ok(lancer() > 0, "ordinateur affiché : un bruit joue");
affiche = false; assert.equal(lancer(), 0, "ordinateur éteint ou pas affiché : silence");
affiche = true; cache = true; assert.equal(lancer(), 0, "page cachée : silence");
assert.ok(timers.length >= 1, "le tirage suivant est toujours planifié");
assert.ok(index.includes('<script defer src="/modules/wandoos-disque-v1.js?v=1"></script>'), "module chargé par la page");
console.log("idle-wandoos-disque-v1: OK");
