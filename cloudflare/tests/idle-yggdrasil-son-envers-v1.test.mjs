import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-17) : la porte qui se referme joue le son de l'ouverture À L'ENVERS. Le son (synthétisé) est fabriqué hors ligne, retourné, débarrassé de sa fin silencieuse, puis joué ;
 * un même son n'est fabriqué qu'une fois. Sans volume : rien. Sans contexte hors ligne : le son normal.
 */
const sons = readFileSync("cloudflare/public/modules/yggdrasil-sons-v1.js", "utf8");
const elfes = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");

function monde({ volume = 1, hors = true } = {}) {
  const joues = []; let rendus = 0;
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} });
  const ctxBase = () => ({
    sampleRate: 100, currentTime: 0, destination: {}, state: "running",
    createBufferSource: () => ({ connect() {}, start() { joues.push(this.buffer); }, stop() {}, buffer: null }),
    createBuffer: (c, n) => { const d = new Float32Array(n); return { getChannelData: () => d, length: n }; },
    createBiquadFilter: () => ({ type: "", frequency: param(), Q: { value: 0 }, connect() {} }),
    createGain: () => ({ gain: param(), connect() {} }),
    createOscillator: () => ({ type: "", frequency: param(), connect() {}, start() {}, stop() {} })
  });
  const fen = {
    AudioContext: function () { return ctxBase(); },
    __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getInterface: () => volume }
  };
  if (hors) {
    fen.OfflineAudioContext = function (canaux, n) {
      const c = ctxBase();
      c.startRendering = () => { rendus += 1; const d = new Float32Array(n); d[10] = 0.5; d[20] = 0.25; /* un son court : le reste est silence */ return Promise.resolve({ getChannelData: () => d }); };
      c.createBufferSource = () => ({ connect() {}, start() {}, stop() {}, buffer: null });
      return c;
    };
  }
  fen.window = fen;
  vm.runInNewContext(sons, fen);
  return { S: fen.__SOREAL_IDLE_YGG_SONS_V1__, joues, rendus: () => rendus };
}
const attendre = () => new Promise((r) => setTimeout(r, 20));

// 1. Le son est retourné : l'échantillon le plus tardif vient en premier, la fin silencieuse est retirée.
{
  const m = monde();
  assert.equal(m.S.jouerEnvers("porte", 1), true);
  await attendre();
  assert.equal(m.joues.length, 1, "joué une fois");
  const b = m.joues[0].getChannelData(0);
  assert.equal(b.length, 21, "queue silencieuse coupée : 21 échantillons jusqu'au dernier son (indice 20)");
  assert.equal(b[0], 0.25, "le dernier son (indice 20) devient le premier");
  assert.equal(b[10], 0.5, "l'indice 10 devient 20 - 10 = 10 : l'ordre est bien inversé");
  // 2. Même son = fabriqué une seule fois.
  m.S.jouerEnvers("porte", 1); await attendre();
  assert.equal(m.rendus(), 1, "un seul rendu pour deux lectures");
  assert.equal(m.joues.length, 2);
  m.S.jouerEnvers("porte", 2); await attendre();
  assert.equal(m.rendus(), 2, "une autre durée = un autre son");
}
// 3. Volume à zéro : rien, aucun rendu. Pas de contexte hors ligne : repli sur le son normal.
{
  const m = monde({ volume: 0 });
  assert.equal(m.S.jouerEnvers("porte", 1), false);
  assert.equal(m.rendus(), 0);
  const n = monde({ hors: false });
  assert.equal(n.S.jouerEnvers("porte", 1), true, "repli : son normal");
  assert.equal(n.S.jouerEnvers("inconnu", 1), false);
}
// 4. Branchements : la fermeture joue l'envers ; le banc d'essai a son bouton.
assert.ok(elfes.includes("sonEnvers_(nomSonPorte_(),reglages_().porte)") && elfes.includes("bancSonEnvers()") && elfes.includes("⏪ Son à l’envers"), "fermeture et banc d'essai");
console.log("idle-yggdrasil-son-envers-v1: OK");
