import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Norman (2026-09-26) : trois sons différents pour +, − et Cap de Basic Training, en rapport avec ce qu'ils font. */
const audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// 1. Les trois sons sont réellement synthétisés (contexte audio factice qui enregistre ce qui est planifié) et diffèrent
const enregistre = [];
class Param { constructor(nom) { this.nom = nom; } setValueAtTime(v, t) { this.dernier = { v, t }; } exponentialRampToValueAtTime(v, t) { this.fin = { v, t }; } }
class Osc { constructor() { this.frequency = new Param("f"); this.detune = new Param("d"); this.type = "sine"; } connect() {} start(t) { this.debut = t; } stop() {}
  finalise() { enregistre.push({ type: this.type, from: this.frequency.dernier.v, to: this.frequency.fin ? this.frequency.fin.v : this.frequency.dernier.v, at: Number(this.debut.toFixed(3)) }); } }
const oscillateurs = [];
class Ctx {
  constructor() { this.currentTime = 0; this.sampleRate = 8000; this.state = "running"; this.destination = {}; }
  createGain() { return { gain: new Param("g"), connect() {} }; }
  createOscillator() { const o = new Osc(); oscillateurs.push(o); return o; }
  createBuffer(_c, n) { return { getChannelData: () => new Float32Array(n) }; }
  createBufferSource() { return { connect() {}, start() {}, stop() {} }; }
  createBiquadFilter() { return { frequency: new Param("bf"), Q: new Param("q"), connect() {} }; }
  resume() { return Promise.resolve(); }
}
const fenetre = { AudioContext: Ctx, addEventListener() {} };
vm.runInNewContext(audio, { window: fenetre, document: { addEventListener() {} }, setTimeout, clearTimeout, Promise, Date, Math, console });
const A = fenetre.__SOREAL_IDLE_AUDIO_V199__;
const signatures = {};
for (const nom of ["btPlus", "btMinus", "btCap"]) {
  assert.equal(typeof A[nom], "function", nom);
  oscillateurs.length = 0; enregistre.length = 0;
  assert.equal(A[nom](), true, nom + " accepté par l'ordonnanceur");
  await new Promise((r) => setTimeout(r, 900));
  oscillateurs.forEach((o) => o.finalise());
  assert.ok(enregistre.length >= 2, nom + " planifie de vraies notes : " + enregistre.length);
  signatures[nom] = JSON.stringify(enregistre);
}
assert.equal(new Set(Object.values(signatures)).size, 3, "trois sons différents");
// sens : + monte, − descend, Cap monte en puissance puis finit haut
const notes = (nom) => JSON.parse(signatures[nom]);
assert.ok(notes("btPlus").every((n) => n.to > n.from), "+ : les glissandos montent");
assert.ok(notes("btMinus").every((n) => n.to < n.from), "− : les glissandos descendent");
const cap = notes("btCap");
assert.ok(cap.some((n) => n.to > n.from * 3) && cap.some((n) => n.from >= 1500 && n.at > 0.2), "Cap : une charge qui monte, puis un « ding » aigu à la fin");

// 2. Branchement : seulement si l'allocation change ; +, − et Cap ont chacun leur son
assert.ok(ui.includes("if(delta!==0){"), "aucun son si rien ne change");
assert.ok(ui.includes("action==='plus'?'btPlus':action==='moins'?'btMinus':'btCap'"));
console.log("idle-basic-training-button-sounds-v1: OK");
