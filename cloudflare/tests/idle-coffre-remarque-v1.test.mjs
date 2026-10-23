import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-22) : de temps en temps, le Coffre dit « Pourquoi tu me regardes comme si j'allais chier sur tes affaires ? » (quand on le regarde, éveillé, jamais par-dessus une autre bulle).
 */
const mod = readFileSync("cloudflare/public/modules/coffre-sommeil-v1.js", "utf8");
const PHRASE = "Pourquoi tu me regardes comme si j’allais chier sur tes affaires ?";
assert.ok(mod.includes(PHRASE), "phrase exacte");

function monde(aleas) {
  const enfants = [];
  let tic = null, visible = true, cache = false;
  const el = {
    classList: { add() {}, remove() {}, contains: () => false },
    getBoundingClientRect: () => ({ top: 100, bottom: 300, left: 0, right: 200, width: 200, height: 200 }),
    appendChild: (n) => { n.parentNode = el; enfants.push(n); },
    removeChild: (n) => { const i = enfants.indexOf(n); if (i >= 0) enfants.splice(i, 1); n.parentNode = null; },
    querySelector: (s) => enfants.find((n) => n.className && s.split(",").some((x) => n.className.includes(x.trim().replace(/^\./, "")))) || null,
    closest: () => el
  };
  const doc = { querySelector: () => el, createElement: () => ({ setAttribute() {}, style: {}, classList: { add() {} }, className: "", parentNode: null, textContent: "" }), addEventListener() {}, documentElement: { clientHeight: 800, clientWidth: 1200 } };
  Object.defineProperty(doc, "hidden", { get: () => cache });
  const fen = { innerHeight: 800, innerWidth: 1200, __SOREAL_IDLE_AUDIO_V199__: { play() {} }, __SOREAL_IDLE_COFFRE_DIGESTION_V1__: { visible: () => (visible ? el : null) } };
  let k = 0;
  const alea = Object.assign(Object.create(Math), { random: () => (k < aleas.length ? aleas[k++] : 0.5) });
  const ctx = { window: fen, document: doc, setInterval: (f) => { tic = f; return 1; }, setTimeout() {}, Math: alea, console };
  vm.runInNewContext(mod, ctx);
  return { api: fen.__SOREAL_IDLE_COFFRE_SOMMEIL_V1__, tic: () => tic(), enfants, el, vis: (v) => { visible = v; }, cacher: (v) => { cache = v; } };
}
const textes = (m) => m.enfants.map((n) => n.textContent);

// 1. Au bout de son délai de présence à l'écran (150 s minimum), éveillé : la remarque apparaît ; pas avant.
{
  const m = monde([0, 0.999]);   // remarque après 150 s, endormissement après ~159 s
  for (let i = 0; i < 599; i += 1) m.tic();
  assert.deepEqual(textes(m), [], "rien avant 150 s");
  m.tic();
  assert.deepEqual(textes(m), [PHRASE], "la remarque apparaît");
  assert.ok(/bg-replique-v1/.test(m.enfants[0].className), "même bulle que les autres répliques du Coffre");
}

// 2. Jamais hors de vue ni onglet caché ; le délai n'avance qu'à l'écran.
{
  const m = monde([0, 0.999]);
  m.vis(false);
  for (let i = 0; i < 2000; i += 1) m.tic();
  assert.deepEqual(textes(m), [], "hors de l'écran : rien");
  m.vis(true); m.cacher(true);
  for (let i = 0; i < 2000; i += 1) m.tic();
  assert.deepEqual(textes(m), [], "onglet caché : rien");
}

// 3. Jamais par-dessus une autre bulle ; direct : la fonction refuse tant qu'une bulle est affichée.
{
  const m = monde([0.5, 0.9]);
  assert.equal(m.api.dire(m.el), true);
  assert.equal(m.api.dire(m.el), false, "une bulle est déjà là : pas de superposition");
  assert.equal(m.enfants.length, 1);
}

// 4. Endormi, il ne fait pas de remarque ; une fois réveillé le compte reprend.
{
  const m = monde([0.999, 0]);   // remarque après ~420 s, endormissement dès 240 s
  for (let i = 0; i < 1000; i += 1) m.tic();   // 250 s : il dort
  assert.equal(m.api.dort(), true);
  const avant = textes(m).length;
  for (let i = 0; i < 100; i += 1) m.tic();
  assert.equal(textes(m).filter((t) => t === PHRASE).length, 0, "endormi : pas de remarque");
  assert.ok(textes(m).length >= avant);
}
console.log("idle-coffre-remarque-v1: OK");
