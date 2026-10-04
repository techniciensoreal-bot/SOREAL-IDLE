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
assert.deepEqual(Object.keys(sons).sort(), ["applause", "laugh"]);
assert.ok(sons.applause.duree >= 2800 && sons.applause.duree <= 3300, "applaudissements : environ 3 secondes");
assert.ok(sons.laugh.duree >= 1800 && sons.laugh.duree <= 3000);

// Applaudissements : un tampon de bruit non silencieux, qui monte puis s'éteint, de la durée annoncée.
{
  const { c, ev } = faux();
  sons.applause.construire(c);
  const tampon = ev.find((e) => e.buffer).buffer.d;
  const dureeS = tampon.length / 8000;
  assert.ok(Math.abs(dureeS - 3.1) < .05, "3,1 s de tampon");
  const energie = (a, b) => { let s = 0; for (let i = Math.floor(a * 8000); i < Math.floor(b * 8000); i += 1) s += tampon[i] * tampon[i]; return s / ((b - a) * 8000); };
  assert.ok(energie(.0, .3) < energie(1, 1.5), "ça monte au début");
  assert.ok(energie(2.9, 3.1) < energie(1, 1.5) * .6, "ça s'éteint à la fin");
  assert.ok(Math.max(...tampon) <= 1.0001 && Math.max(...tampon) > .5, "normalisé, pas de saturation");
}
// Rires : huit voix, chacune planifiée, tout fini avant la durée annoncée.
{
  const { c, ev } = faux();
  sons.laugh.construire(c);
  assert.ok(ev.filter((e) => !e.buffer).length >= 8, "huit voix");
  assert.ok(Math.max(...ev.map((e) => e.fin)) * 1000 <= sons.laugh.duree + 50, "fini à temps");
}
// Hors file d'attente : un son de foule ne remplace jamais le son de victoire ou de fuite.
assert.ok(audio.includes("if(SONS_FOULE_V1[name])return jouerFoule_(name);") && audio.includes('applause:function(){return demander_("applause");}') && audio.includes('laugh:function(){return demander_("laugh");}'));
// Câblage client : applaudissements seulement à la première victoire (boss au-delà du record, une fois par boss), rires seulement s'il y avait un combat à fuir.
assert.ok(ui.includes("jouerEffetAudioIdleV199_('victory');\n                if(premiereVictoireBossIdleV1_())jouerEffetAudioIdleV199_('applause');"));
assert.ok(ui.includes("if(enCombat){\n          jouerEffetAudioIdleV199_('flee');") && ui.includes("jouerEffetAudioIdleV199_('laugh');"));
const debut = ui.indexOf("      const idleBossApplaudisV1={};");
const fin = ui.indexOf("      function jouerEffetAudioIdleV199_(nom){");
let etat = { bossSelection: 5, systemes: { records: { highestBoss: 4 } } };
const premiere = new Function("idleEtat", "idleEntier_", ui.slice(debut, fin) + "\nreturn premiereVictoireBossIdleV1_;");
const e = (v) => Math.max(0, Math.floor(Number(v) || 0));
const p = premiere(etat, e);
assert.equal(p(), true, "boss 5 jamais battu (record 4)");
assert.equal(p(), false, "pas deux fois le même boss avant la confirmation du serveur");
etat.bossSelection = 4; assert.equal(p(), false, "boss 4 déjà battu : pas d'applaudissements");
etat.bossSelection = 3; assert.equal(p(), false);
etat.bossSelection = 6; assert.equal(p(), true, "boss suivant");
assert.equal(premiere(null, e)(), false, "jamais de plantage sans état");
console.log("idle-sons-foule-v1: OK");
