import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : « plusieurs variantes des bruits de pas, parfois 3, parfois 4, qui ont l'air différents, sinon le son a l'air vraiment répétitif ».
 */
const audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
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
const variantes = api.builders.shopStepsVariantes;
assert.ok(Array.isArray(variantes) && variantes.length >= 6, "au moins six façons de marcher");

// Chaque variante, avec 3 puis 4 pas : le bon nombre de pas, dans les temps, et un son qui lui est propre.
const signatures = new Set();
const sommes = new Set();
for (const v of variantes) {
  assert.equal(v.tempo.length, 2);
  for (const nb of [3, 4]) {
    const tempo = (v.tempo[0] + v.tempo[1]) / 2;
    const { c, evenements } = faux();
    v.construire(c, nb, tempo, () => 0.5);
    assert.ok(evenements.length >= nb, `${v.nom} : des sons pour ${nb} pas`);
    const debuts = [...new Set(evenements.map((e) => Math.round(e.debut * 100) / 100))].sort((a, b) => a - b);
    const pas = debuts.filter((d, i) => i === 0 || d - debuts[i - 1] > tempo * 0.6);
    assert.equal(pas.length, nb, `${v.nom} : ${nb} pas distincts (obtenu ${pas.length})`);
    const fin = Math.max(...evenements.map((e) => e.fin));
    assert.ok(fin <= (nb - 1) * tempo + 0.32 + 0.02, `${v.nom} : le son tient dans la durée annoncée (${fin.toFixed(2)} s)`);
    if (nb === 3) { signatures.add(v.construire.toString() + v.nom); sommes.add(evenements.length + ":" + evenements.map((e) => Math.round((e.fin - e.debut) * 1000)).join(",")); }
  }
}
assert.equal(signatures.size, variantes.length);
assert.equal(sommes.size, variantes.length, "chaque variante a sa propre construction sonore (nombre et durée des éléments)");

// L'aléa : deux passages de la même variante ne sont jamais identiques (décalage, force, hauteur).
{
  const v = variantes[0];
  const a = faux(); v.construire(a.c, 3, 0.3);
  const b = faux(); v.construire(b.c, 3, 0.3);
  const cle = (e) => e.map((x) => `${x.debut.toFixed(4)}-${x.fin.toFixed(4)}`).join("|");
  assert.notEqual(cle(a.evenements), cle(b.evenements), "les pas ne se répètent pas à l'identique");
}

// Le tirage : 3 ou 4 pas, jamais la même variante deux fois de suite (ordonnanceur réel : un passage = une variante).
assert.ok(audio.includes("var nb=Math.random()<.5?3:4;"), "3 ou 4 pas");
assert.ok(audio.includes("(dernierePasVarianteV1+1+Math.floor(Math.random()*(n-1)))%n"), "jamais deux fois la même d'affilée");
assert.ok(audio.includes("variante.tempo[0]+Math.random()*(variante.tempo[1]-variante.tempo[0])"), "tempo différent à chaque fois");
// Le pas d'origine (3 pas réguliers) reste disponible pour les vérifications existantes.
assert.ok(api.builders.shopSteps && api.builders.shopSteps.duree === 900);
console.log("idle-pas-boutique-variantes-v1: OK (" + variantes.length + " variantes)");
