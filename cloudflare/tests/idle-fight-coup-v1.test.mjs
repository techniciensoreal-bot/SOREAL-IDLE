// Bouton rouge FIGHT : un coup de poing synthétisé (Norman, 2026-10-06 : « je n'aime pas le Fight finalement, mets un son de coup de poing »).
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";

const src = readFileSync("cloudflare/public/modules/fight-coup-v1.js", "utf8");
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(/\/modules\/fight-coup-v1\.js\?v=\d+/.test(index), "module chargé par index.html");
assert.ok(!index.includes("fight-voix"), "plus de voix « Fight »");
assert.ok(!existsSync("cloudflare/public/modules/fight-voix-v1.js") && !existsSync("cloudflare/public/modules/fight-voix-base"), "voix et fichiers WAV retirés");

// Trois couches (choc grave, claque médium, crac bref) et variation de hauteur à chaque coup.
assert.ok(src.includes("exponentialRampToValueAtTime(46*k") && src.includes("bandpass") && src.includes("gc.gain.setValueAtTime(0.4"), "choc grave, claque, crac");
assert.ok(src.includes("0.92+Math.random()*0.16"), "hauteur légèrement différente à chaque coup");
assert.ok(src.includes("getInterface") && src.includes("v<=0"), "volume de la barre interface, silence si coupé");

// Un clic sur le bouton rouge (actif) joue le coup ; un autre clic ou un bouton désactivé : rien.
const ecouteurs = {};
let joues = 0;
function noeud() { const n = { connect() {}, start() {}, stop() {}, gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, Q: { value: 0 }, curve: null }; return n; }
class FauxContexte {
  constructor() { this.currentTime = 0; this.state = "running"; this.destination = noeud(); }
  createGain() { joues++; return noeud(); }
  createOscillator() { return noeud(); }
  createBiquadFilter() { return noeud(); }
  createWaveShaper() { return noeud(); }
  createBufferSource() { return noeud(); }
  createBuffer(_c, n) { return { getChannelData: () => new Float32Array(n) }; }
}
const fenetre = { AudioContext: FauxContexte, __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getInterface: () => 0.75 } };
fenetre.window = fenetre;
fenetre.document = { addEventListener: (t, f) => { (ecouteurs[t] = ecouteurs[t] || []).push(f); } };
vm.runInNewContext(src, Object.assign(fenetre, { Math, Float32Array, Promise }), { filename: "fight-coup-v1.js" });
const api = fenetre.__SOREAL_IDLE_FIGHT_COUP_V1__;
assert.ok(api && typeof api.jouer === "function", "API exposée");
const clic = (ecouteurs.click || [])[0];
assert.ok(clic, "écouteur de clic posé");
clic({ target: { closest: (sel) => (sel === "#sorealIdleBossStartV100" ? { disabled: false } : null) } });
const apres = joues;
assert.ok(apres > 0, "clic sur FIGHT : le coup est joué");
clic({ target: { closest: () => null } });
clic({ target: { closest: () => ({ disabled: true }) } });
assert.equal(joues, apres, "autre clic ou bouton désactivé : silence");
fenetre.__SOREAL_IDLE_AUDIO_VOLUME_V1__.getInterface = () => 0;
assert.equal(api.jouer(), false, "volume à zéro : rien");
console.log("idle-fight-coup-v1: OK");
