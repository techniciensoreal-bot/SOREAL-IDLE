import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-16) : « le bruit que tu as fait pour la porte, mets-le quand le coffre pète de temps en temps, mais pas le ding de fin ; et fais-moi un bruit de porte plus grave et lourde. »
 * Le Coffre a un pet « grincement de porte » (sans aucun tintement), tiré de temps en temps, jamais deux fois de suite ; la porte d'Yggdrasil a un bruit plus grave et plus lourd.
 */
const coffre = readFileSync("cloudflare/public/modules/audio-coffre-v1.js", "utf8");
const sons = readFileSync("cloudflare/public/modules/yggdrasil-sons-v1.js", "utf8");

function contexte() {
  const oscillateurs = []; let sorties = 0;
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} });
  const ctx = {
    sampleRate: 8000, currentTime: 0, destination: {},
    createBuffer: (c, n) => ({ getChannelData: () => new Float32Array(n) }),
    createBufferSource: () => ({ connect() {}, start() {}, stop() {}, buffer: null }),
    createBiquadFilter: () => ({ type: "", frequency: param(), Q: { value: 0 }, connect() {} }),
    createGain: () => ({ gain: param(), connect() { sorties += 1; } }),
    createOscillator: () => {
      const o = { type: "", freqs: [], frequency: { value: 0, setValueAtTime(v) { o.freqs.push(v); }, exponentialRampToValueAtTime(v) { o.freqs.push(v); } }, connect() {}, start() {}, stop() {} };
      oscillateurs.push(o); return o;
    }
  };
  return { ctx, oscillateurs, sorties: () => sorties };
}
function moduleCoffre(alea = Math.random) {
  const fen = { Math: Object.assign(Object.create(Math), { random: alea }), window: {} };
  fen.window = fen;
  vm.runInNewContext(coffre, fen, { filename: "audio-coffre-v1.js" });
  return fen;
}

// 1. Le pet grinçant : grave, sans tintement (aucun oscillateur au-dessus de 300 Hz : un « ding » serait à 440 Hz ou plus).
{
  const fen = moduleCoffre();
  const { ctx, oscillateurs } = contexte();
  fen.__coffrePetForceIdleV1__ = true;
  const son = fen.__SOREAL_IDLE_AUDIO_COFFRE_V1__.jouerDigestion("pet", ctx, {});
  assert.equal(son.id, "grincement-porte", "pet forcé : le grincement");
  const max = Math.max(...oscillateurs.flatMap((o) => o.freqs));
  assert.ok(oscillateurs.length >= 3 && max <= 300, "grave, aucun tintement aigu (fréquence max d'un oscillateur : " + max + " Hz)");
  assert.equal(fen.__coffrePetForceIdleV1__, false, "forçage utilisé une seule fois");
  assert.ok(!/ping\(/.test(coffre.slice(coffre.indexOf("function grincementPorte"), coffre.indexOf("var PET_RARE"))), "aucun tintement (ping) dans le grincement");
}
// 2. De temps en temps : environ un pet sur six, jamais deux fois de suite ; les six pets d'origine restent.
{
  let graine = 7; const alea = () => { graine = (graine * 1664525 + 1013904223) >>> 0; return graine / 4294967296; };
  const fen = moduleCoffre(alea);
  const { ctx } = contexte();
  const ids = []; for (let i = 0; i < 3000; i += 1) ids.push(fen.__SOREAL_IDLE_AUDIO_COFFRE_V1__.jouerDigestion("pet", ctx, {}).id);
  const part = ids.filter((x) => x === "grincement-porte").length / ids.length;
  assert.ok(part > 0.12 && part < 0.22, "de temps en temps : " + part.toFixed(3));
  assert.ok(ids.every((x, i) => i === 0 || !(x === "grincement-porte" && ids[i - 1] === "grincement-porte")), "jamais deux fois de suite");
  assert.equal(new Set(ids.filter((x) => x !== "grincement-porte")).size, 6, "les six pets d'origine sont toujours joués");
  // Les rots ne sont pas concernés.
  assert.ok(Array.from({ length: 200 }, () => fen.__SOREAL_IDLE_AUDIO_COFFRE_V1__.jouerDigestion("rot", ctx, {}).id).every((x) => x.startsWith("rot-")));
}
// 3. La porte d'Yggdrasil : plus grave et plus lourde (fréquences des gonds ~40-90 Hz, sinus de fond, grand coup de butée) ; plus de tintement aigu.
{
  const { ctx, oscillateurs } = contexte();
  const fen = { AudioContext: function () { return ctx; }, __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getInterface: () => 1 } };
  fen.window = fen;
  vm.runInNewContext(sons, fen);
  fen.__SOREAL_IDLE_YGG_SONS_V1__.construire("porte", ctx, {}, 0, Math.random, 1);
  const graves = oscillateurs.filter((o) => o.freqs.length && Math.max(...o.freqs) <= 160);
  const toutes = oscillateurs.flatMap((o) => o.freqs);
  assert.ok(Math.min(...toutes) <= 30 && graves.length >= 6, "essentiellement des sons très graves : " + graves.length + " oscillateurs sous 160 Hz sur " + oscillateurs.length);
  const aigus = oscillateurs.filter((o) => Math.max(...o.freqs) > 500).length;
  assert.equal(aigus, 0, "plus aucun tintement aigu (oscillateur au-dessus de 500 Hz)");
  assert.ok(/38\*det/.test(sons) && /82,26/.test(sons), "gonds à 38 Hz, butée de 82 à 26 Hz");
}
// 4. Le banc d'essai (administrateur) a le bouton qui fait péter le Coffre avec ce son.
const page = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");
assert.ok(page.includes("bancPetCoffre()") && page.includes("__coffrePetForceIdleV1__=true") && page.includes("A.play('coffrePet')"), "bouton du banc : pet grinçant du Coffre");
console.log("idle-coffre-pet-grincement-v1: OK");
