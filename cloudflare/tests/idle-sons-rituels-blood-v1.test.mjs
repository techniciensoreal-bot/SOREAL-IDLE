import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : « des sons de rituel de plus en plus bad ass quand on lance un rituel avec notre blood ». Un son par sort de Blood Magic, chacun plus long et plus chargé que le précédent.
 */
const audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/blood-magic-v1.js", "utf8") + "\n" + readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8") /* Blood Magic vit dans son module depuis le 2026-10-07 */;
// Faux contexte Web Audio : enregistre chaque note et chaque bruit planifiés.
function faux() {
  const evenements = [];
  const c = {
    currentTime: 0, sampleRate: 8000, state: "running", destination: {},
    createGain() { return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, cancelScheduledValues() {} }, connect() {} }; },
    createOscillator() {
      const o = { frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, detune: { setValueAtTime() {} }, connect() {}, start(t) { o.t0 = t; }, stop(t) { evenements.push({ debut: o.t0, fin: t }); } };
      return o;
    },
    createBuffer(_n, frames) { return { getChannelData() { return new Float32Array(frames); }, length: frames }; },
    createBufferSource() { const s = { connect() {}, start(t) { evenements.push({ debut: t, fin: t + (s.buffer ? s.buffer.length / 8000 : 0) }); } }; return s; },
    createBiquadFilter() { return { frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, Q: { setValueAtTime() {} }, connect() {} }; }
  };
  return { c, evenements };
}

globalThis.window = {};
globalThis.document = { addEventListener() {} };
globalThis.localStorage = { getItem: () => null, setItem() {} };
globalThis.AudioContext = function () {};
new Function(audio)();
const api = window.__SOREAL_IDLE_AUDIO_V199__;
const ordre = ["numberBoost", "ironPill", "bloodSpaghetti", "counterfeitGold", "leeches"];
const sons = Object.fromEntries(api.builders.sortsBlood.map((m) => [m.nom, m]));
assert.deepEqual(Object.keys(sons), ordre, "un rituel par sort, du plus modeste au dernier");

let precedent = { evenements: 0, duree: 0 };
for (const id of ordre) {
  const { c, evenements } = faux();
  sons[id].construire(c);
  const fin = Math.max(...evenements.map((e) => e.fin)) * 1000;
  assert.ok(fin <= sons[id].duree + 80, `${id} : la fin du son (${Math.round(fin)} ms) dépasse sa durée (${sons[id].duree} ms)`);
  assert.ok(evenements.length > precedent.evenements, `${id} : plus de couches que le sort précédent`);
  assert.ok(sons[id].duree > precedent.duree, `${id} : plus long que le sort précédent`);
  precedent = { evenements: evenements.length, duree: sons[id].duree };
}
assert.ok(sons.leeches.duree >= 4000 && sons.numberBoost.duree <= 1500, "du bref au cérémoniel");

// Câblage : un son par sort au clic sur « Lancer », même ordonnanceur, jamais bloquant.
assert.ok(audio.includes('DEFINITIONS["sortBlood_"+id]={group:"blood-spell"') && audio.includes('sortBlood:function(id){return demander_("sortBlood_"+id);}'));
assert.ok(meta.includes("window.__sonSortBloodIdleV1__(") && meta.includes("a.sortBlood(String(id||''))"), "bouton Lancer");
console.log("idle-sons-rituels-blood-v1: OK");
