import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-03) : « quand on passe d'un rayon à l'autre dans la boutique, un bruit de pas, quelqu'un qui marche, 3 pas seulement ; les bruits ne doivent pas se chevaucher si on change rapidement de menu »
 * et « un son par menu en rapport avec le type de menu ».
 */
const audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

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
assert.ok(api && api.builders && api.builders.shopSteps && Array.isArray(api.builders.menus));

// 1. Les trois pas : exactement trois frappes de talon, régulières, et le son tient dans sa durée (rien ne déborde sur le suivant).
{
  const { c, evenements } = faux();
  api.builders.shopSteps.construire(c);
  const talons = evenements.filter((e) => e.fin - e.debut >= 0.1 && e.debut < 1).map((e) => Math.round(e.debut * 100) / 100);
  const distincts = [...new Set(talons)];
  assert.deepEqual(distincts.slice(0, 3), [0, 0.31, 0.62], "trois pas, un toutes les ~0,3 s");
  assert.ok(Math.max(...evenements.map((e) => e.fin)) * 1000 <= api.builders.shopSteps.duree, "la fin du son ne dépasse pas sa durée annoncée : jamais de chevauchement");
}

// 2. Un son par menu : tous les menus de la barre (sauf Shop qui garde sa porte) en ont un, court, et chacun est différent.
const menus = [...ui.matchAll(/\{id:'([a-zA-Z]+)',icon:'[^']*',nom:'[^']*'\}/g)].map((m) => m[1]).filter((id) => id !== "shop");
assert.ok(menus.length >= 28); /* Collection, Classement et Succès sont réunis dans « Chroniques » depuis le 2026-10-08 */
const sons = Object.fromEntries(api.builders.menus.map((m) => [m.nom, m]));
const signatures = new Set();
for (const id of menus) {
  assert.ok(sons[id], `son manquant pour le menu ${id}`);
  const { c, evenements } = faux();
  sons[id].construire(c);
  assert.ok(evenements.length > 0, `${id} ne produit aucun son`);
  const fin = Math.max(...evenements.map((e) => e.fin)) * 1000;
  assert.ok(sons[id].duree <= 500, `${id} : son trop long (${sons[id].duree} ms)`);
  if (process.env.AUDIT_SONS) console.log(id, Math.round(fin), sons[id].duree);
  assert.ok(fin <= sons[id].duree + 80, `${id} : la fin du son (${Math.round(fin)} ms) dépasse sa durée annoncée (${sons[id].duree} ms)`);
  signatures.add(sons[id].construire.toString());
}
assert.equal(signatures.size, menus.length, "chaque menu a son propre son");

// 3. Câblage : clic sur un menu = son du menu ; clic sur un rayon = trois pas ; même ordonnanceur (jamais deux sons à la fois).
assert.ok(audio.includes('demander_(idMenu==="shop"?"shopDoor":(DEFINITIONS["menu_"+idMenu]?"menu_"+idMenu:"menuNav"))'));
assert.ok(audio.includes('.soreal-idle-exp-tab-v212,.soreal-idle-shop-onglet-v1') && audio.includes('demander_("shopSteps")'));
assert.ok(audio.includes('shopSteps:{group:"shop-steps"'));
assert.ok(audio.includes("if(actif)return;"), "un seul son actif à la fois");
console.log("idle-sons-menus-et-pas-boutique-v1: OK (" + menus.length + " menus)");
