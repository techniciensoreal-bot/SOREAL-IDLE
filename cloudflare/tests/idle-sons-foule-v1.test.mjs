import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : applaudissements (~3 s) à la première victoire sur un boss, rires de foule à la fuite, EN PLUS du son de base. Sons synthétisés, jouables hors file d'attente.
 */
const audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
function faux() {
  const ev = [];
  const c = {
    currentTime: 0, sampleRate: 8000, state: "running", destination: {},
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} }; },
    createOscillator() { const o = { frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, detune: { setValueAtTime() {} }, connect() {}, start(t) { o.t0 = t; }, stop(t) { ev.push({ fin: t }); } }; return o; },
    createBuffer(_n, frames) { const d = new Float32Array(frames); return { getChannelData() { return d; }, length: frames, d }; },
    createBufferSource() { const s = { connect() {}, start(t) { ev.push({ fin: t + (s.buffer ? s.buffer.length / 8000 : 0), buffer: s.buffer }); } }; return s; },
    createBiquadFilter() { return { frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, Q: { setValueAtTime() {} }, connect() {} }; }
  };
  return { c, ev };
}
globalThis.window = {}; globalThis.document = { addEventListener() {} }; globalThis.localStorage = { getItem: () => null, setItem() {} }; globalThis.AudioContext = function () {};
new Function(audio)();
const api = window.__SOREAL_IDLE_AUDIO_V199__;
const sons = Object.fromEntries(api.builders.foule.map((m) => [m.nom, m]));
assert.deepEqual(Object.keys(sons).sort(), ["laugh"], "plus d'applaudissements (Norman, 2026-10-07)");
assert.ok(sons.laugh.duree >= 1800 && sons.laugh.duree <= 3000);

// Rires : huit voix, chacune planifiée, tout fini avant la durée annoncée.
{
  const { c, ev } = faux();
  sons.laugh.construire(c);
  assert.ok(ev.filter((e) => !e.buffer).length >= 8, "huit voix");
  assert.ok(Math.max(...ev.map((e) => e.fin)) * 1000 <= sons.laugh.duree + 50, "fini à temps");
}
// Hors file d'attente : un son de foule ne remplace jamais le son de victoire ou de fuite.
assert.ok(audio.includes("if(SONS_FOULE_V1[name])return jouerFoule_(name);") && audio.includes('laugh:function(){return demander_("laugh");}'));
// Câblage client : plus d'applaudissements ; rires seulement s'il y avait un combat à fuir.
assert.ok(!ui.includes("'applause'") && !audio.includes("applause"), "aucun applaudissement");
assert.ok(ui.includes("if(enCombat){\n          jouerEffetAudioIdleV199_('flee');") && ui.includes("jouerEffetAudioIdleV199_('laugh');"));
console.log("idle-sons-foule-v1: OK");
