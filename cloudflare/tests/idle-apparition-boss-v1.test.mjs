import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-22) : dix effets d'apparition de boss, joués dans l'ordre des boss, chacun avec son son ; on ne voit jamais l'image du boss suivant avant la fin de l'écran de victoire.
 */
const code = readFileSync(new URL("../public/modules/apparition-boss-v1.js", import.meta.url), "utf8");
const victoire = readFileSync(new URL("../public/modules/victoire-boss-arcade-v1.js", import.meta.url), "utf8");

function monde({ reduit = false, volume = 0.8 } = {}) {
  const freqs = []; let sons = 0;
  const param = () => ({ value: 0, setValueAtTime(v) { freqs.push(v); }, linearRampToValueAtTime() {}, exponentialRampToValueAtTime(v) { freqs.push(v); } });
  const faux = () => ({ frequency: param(), connect() {}, start() { sons += 1; }, stop() {}, type: "" });
  class AudioContext {
    constructor() { this.currentTime = 0; this.sampleRate = 8000; this.state = "running"; this.destination = {}; }
    createOscillator() { return faux(); }
    createGain() { return { gain: param(), connect() {} }; }
    createBiquadFilter() { return { type: "", frequency: param(), Q: { value: 0 }, connect() {} }; }
    createBufferSource() { const s = faux(); s.buffer = null; return s; }
    createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; }
    createDynamicsCompressor() { return { connect() {} }; }
  }
  const ctx2d = (log) => new Proxy({}, {
    get(_t, k) {
      if (k === "getImageData") return (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4).fill(200) });
      if (k === "createImageData") return (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) });
      return (...a) => { log.push([k, ...a]); };
    },
    set() { return true; }
  });
  const canvas = () => { const log = []; const c = { width: 0, height: 0, log, style: {}, getContext() { return c.ctx || (c.ctx = ctx2d(log)); }, appendChild() {} }; return c; };
  const enfants = [];
  const hote = { id: "sorealIdleBossImageHostV36", img: null, querySelector(s) { return s === "img" ? this.img : s === ".app-boss" ? enfants[0] || null : null; }, appendChild(e) { enfants.push(e); e.isConnected = true; } };
  const doc = {
    body: {}, head: { appendChild() {} }, documentElement: { appendChild() {} },
    getElementById: (id) => (id === hote.id ? hote : null),
    querySelectorAll: () => enfants.splice(0).map((e) => { e.parentNode = null; return { parentNode: e, ...{} }; }).filter(() => false),
    createElement: (t) => { if (t === "canvas") return canvas(); const e = { style: {}, attrs: {}, className: "", isConnected: false, setAttribute(k, v) { this.attrs[k] = v; }, appendChild() {}, remove() { enfants.splice(enfants.indexOf(this), 1); } }; return e; },
    addEventListener() {}
  };
  let raf = [];
  const fen = { document: doc, AudioContext, console, URL, location: { href: "http://x/" }, performance: { now: () => 0 }, requestAnimationFrame: (f) => { raf.push(f); return raf.length; }, setTimeout: () => 0, matchMedia: () => ({ matches: reduit }), MutationObserver: undefined, __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getInterface: () => volume } };
  fen.window = fen;
  vm.runInNewContext(code, fen);
  const poserImage = (n) => { hote.img = { complete: true, naturalWidth: 100, naturalHeight: 100, width: 100, height: 100, src: "/api/idle/media/boss?id=" + n, currentSrc: "/api/idle/media/boss?id=" + n }; };
  return { A: fen.__SOREAL_IDLE_APPARITION_BOSS_V1__, fen, hote, enfants, poserImage, doc, freqs, nbSons: () => sons, canvas };
}

// 1. Dix effets, dans l'ordre des boss ((n-1) mod 10).
{
  const { A } = monde();
  assert.equal(A.noms.length, 10); assert.equal(A.durees.length, 10);
  assert.deepEqual([1, 2, 10, 11, 20, 301].map(A.indexPour), [0, 1, 9, 0, 9, 0]);
  assert.equal(new Set(A.noms).size, 10, "dix noms différents");
}

// 2. Chaque scène s'exécute sans erreur à plusieurs instants et finit sur l'image entière du boss.
{
  const m = monde();
  for (let i = 0; i < 10; i++) {
    m.poserImage(i + 1);
    const E = m.A.preparer(m.hote.img, i);
    const cv = m.canvas(); const c = cv.getContext();
    for (const t of [0, 0.2, 0.5, 0.9, 1.2, m.A.durees[i] - 0.02]) m.A.scene(i, c, t, E);
    cv.log.length = 0;
    m.A.scene(i, c, m.A.durees[i] + 0.05, E);
    assert.ok(cv.log.some((l) => l[0] === "drawImage" && l[1] === E.SRC), "effet " + m.A.noms[i] + " finit sur l'image du boss");
  }
}

// 3. Un son par effet, nombreux, graves (rien d'aigu) et différents d'un effet à l'autre.
{
  const signatures = new Set();
  for (let i = 0; i < 10; i++) {
    const m = monde();
    const C = m.fen.AudioContext; const ctx = new C();
    const sortie = { connect() {} };
    m.A.sons(i, ctx, 0, sortie);
    assert.ok(m.nbSons() >= 3, "effet " + i + " : plusieurs sons (" + m.nbSons() + ")");
    assert.ok(Math.max(...m.freqs) <= 1300, "effet " + i + " : rien d'aigu (" + Math.max(...m.freqs) + " Hz)");
    signatures.add(m.nbSons() + ":" + m.freqs.slice(0, 6).join(","));
  }
  assert.ok(signatures.size >= 8, "sons différents d'un effet à l'autre");
}

// 4. jouer : calque opaque gardé par le redessin, son joué, pas d'effet en « réduire les animations » ni sans image.
{
  const m = monde();
  assert.equal(m.A.jouer(m.hote), false, "pas d'image : rien");
  m.poserImage(3);
  assert.equal(m.A.jouer(m.hote), true);
  assert.equal(m.enfants.length, 1);
  assert.ok("data-morph-garder" in m.enfants[0].attrs, "règle n°4");
  assert.match(m.enfants[0].className, /app-boss/);
  assert.ok(m.A.enCours());
  assert.ok(m.nbSons() > 0, "son joué avec l'effet");
  const r = monde({ reduit: true }); r.poserImage(3);
  assert.equal(r.A.jouer(r.hote), false, "réduire les animations : aucun effet");
  const mu = monde({ volume: 0 }); mu.poserImage(3); mu.A.jouer(mu.hote);
  assert.equal(mu.nbSons(), 0, "volume 0 : aucun son");
}

// 4 bis. La classe de mort du boss précédent (opacity:0) ne reste jamais sur l'image du boss suivant (image noire, Norman 2026-10-22).
{
  const m = monde();
  m.poserImage(34);
  const retirees = [];
  m.hote.img.classList = { remove: (c) => retirees.push(c) };
  m.hote.img.style = { removeProperty: () => {} };
  m.A.jouer(m.hote);
  assert.ok(retirees.includes("soreal-idle-boss-death-v61"), "classe de mort retirée au début de l'apparition");
}

// 5. Surveillance : pas d'effet pour la première image, un effet quand le boss change, rien pendant l'écran de victoire.
{
  const m = monde();
  m.poserImage(5); m.A.verifier();
  assert.equal(m.enfants.length, 0, "première image vue : pas d'effet");
  m.poserImage(6); m.fen.__SOREAL_IDLE_VICTOIRE_EN_COURS__ = true; m.A.verifier();
  assert.equal(m.enfants.length, 0, "écran de victoire en cours : il passe la main lui-même");
  m.fen.__SOREAL_IDLE_VICTOIRE_EN_COURS__ = false; m.poserImage(7); m.A.verifier();
  assert.equal(m.enfants.length, 1, "le boss change : son apparition se joue");
}

// 5 bis. Pendant un combat de boss, le changement d'image est seulement masqué (calque sombre, sans effet ni son) : la victoire passe d'abord.
{
  const m = monde();
  m.poserImage(5); m.A.verifier();
  m.fen.__SOREAL_IDLE_COMBAT_EN_COURS_V1__ = true; m.poserImage(6); m.A.verifier();
  assert.equal(m.enfants.length, 1, "le boss suivant est masqué tout de suite");
  assert.equal(m.nbSons(), 0, "aucun effet ni son avant la victoire");
  assert.equal(m.A.enCours(), false);
}

// 6. L'écran de victoire passe la main : drapeau, annulation, appel de l'apparition à la fin.
assert.ok(/__SOREAL_IDLE_VICTOIRE_EN_COURS__\s*=\s*true/.test(victoire) && /__SOREAL_IDLE_VICTOIRE_EN_COURS__\s*=\s*false/.test(victoire), "drapeau posé puis retiré");
assert.ok(/__SOREAL_IDLE_APPARITION_BOSS_V1__/.test(victoire) && /\.annuler\(/.test(victoire) && /\.jouer\(/.test(victoire), "annule une apparition en cours, rejoue à la fin");
assert.ok(readFileSync(new URL("../public/index.html", import.meta.url), "utf8").includes('<script defer src="/modules/apparition-boss-v1.js?v='), "module chargé");
console.log("idle-apparition-boss-v1: OK");

// Jamais d'écran noir à la place du boss suivant (Norman, 2026-10-23) : toute sortie sans effet retire le calque sombre, l'attente de l'image va jusqu'à 10 s, filet de 12 s.
{
  const src = readFileSync(new URL("../public/modules/apparition-boss-v1.js", import.meta.url), "utf8");
  assert.ok(src.includes("if(reduit_()){liberer_(hote);return false;}") && src.includes("if(!img){liberer_(hote);return false;}") && src.includes("if(!n){liberer_(hote);return false;}"), "sorties sans effet : calque retiré");
  assert.ok(src.includes("if(++essais>200){terminer();return;}") && src.includes("},12000);"), "attente de l'image 10 s, filet de 12 s");
  assert.ok(src.includes("if(reduit_())return;   /* sans animations"), "couvrir() ne pose rien sans animations");
}
