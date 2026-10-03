import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-03) : « quand on clique sur le Shop, un bruit comme dans les vieux magasins, avec des cloches accrochées au-dessus de la porte qui tintaient quand la porte cognait ».
 */
const audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
let clic = null;
const fenetre = {};
const document = { addEventListener(type, f, opt) { if (type === "click" && opt && opt.capture && !clic) clic = f; } };
new Function("window", "document", "localStorage", audio)(fenetre, document, { getItem: () => null, setItem() {} });
const moteur = fenetre.__SOREAL_IDLE_AUDIO_V199__;

// Le son existe, est exporté et se construit sans erreur : un coup de porte + des clochettes aiguës, tout dans la plage audible.
const b = moteur.builders.shopDoor;
assert.ok(b && typeof b.construire === "function" && b.duree >= 1200 && b.duree <= 2200);
const journal = [];
const param = (nom) => ({
  setValueAtTime(v, t) { journal.push([nom, "set", Number(v), Number(t)]); },
  exponentialRampToValueAtTime(v, t) { journal.push([nom, "ramp", Number(v), Number(t)]); },
  linearRampToValueAtTime() {}
});
const noeud = (type) => ({ connect() {}, start(t) { journal.push([type, "start", Number(t)]); }, stop() {}, type: "", gain: param(type + ".gain"), frequency: param(type + ".freq"), Q: param("q"), detune: param("detune") });
b.construire({ currentTime: 0, sampleRate: 8000, destination: {}, createGain: () => noeud("gain"), createOscillator: () => noeud("osc"), createBiquadFilter: () => noeud("filtre"), createBufferSource: () => noeud("source"), createBuffer: (n, frames) => ({ getChannelData: () => new Float32Array(frames) }) });
const departs = journal.filter((x) => x[0] === "osc" && x[1] === "start").length;
assert.ok(departs >= 20, "beaucoup de partiels de cloche : " + departs);
const freqs = journal.filter((x) => x[0] === "osc.freq" && x[1] === "set").map((x) => x[2]);
assert.ok(freqs.some((f) => f < 200), "le coup de la porte (grave)");
assert.ok(freqs.filter((f) => f >= 2000).length >= 9, "les clochettes (aiguës)");
assert.ok(freqs.every((f) => f < 17000), "aucune fréquence proche de la limite audible/Nyquist");
const fins = journal.filter((x) => x[0] === "gain.gain" && x[1] === "ramp" && x[2] < 0.001).map((x) => x[3]);
assert.ok(Math.max(...fins) <= 1.7, "le tintement s'éteint avant la fin annoncée");
const dep = journal.filter((x) => x[0] === "osc.freq" && x[1] === "set").length;
assert.ok(dep > 0);

// Déclenchement : le clic sur le bouton de menu « shop » joue la porte ; les autres menus gardent la note habituelle.
const joues = [];
const original = moteur.play;
assert.equal(typeof moteur.shopDoor, "function", "exposé comme les autres sons");
assert.ok(clic, "écouteur de clic de navigation présent");
assert.ok(audio.includes('demander_(b.getAttribute("data-menu-id-v1")==="shop"?"shopDoor":"menuNav");'), "le bouton Shop joue la porte, les autres menus la note habituelle");
assert.ok(audio.includes('shopDoor:{group:"ui-nav"'), "même groupe que la navigation : un seul son à la fois");
void joues; void original;
console.log("idle-shop-door-sound-v1 OK");
