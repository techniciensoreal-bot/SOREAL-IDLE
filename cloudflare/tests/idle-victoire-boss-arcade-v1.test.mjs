import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-22) : écran de victoire « arcade » (image du boss qui éclate en pixels, K.O., BOSS VAINCU) au PREMIER kill d'un boss, toujours en Evil et Sadistic, jamais pour un NUKE ; son grave et doux (« trop aigu,
 * ça casse les oreilles »).
 */
const code = readFileSync(new URL("../public/modules/victoire-boss-arcade-v1.js", import.meta.url), "utf8");
const ctx2d = new Proxy({}, { get: (c, k) => (k === "fillStyle" || k === "globalAlpha" ? 1 : () => {}), set: () => true });
function monde({ reduit = false, stock = {}, volume = 0.8 } = {}) {
  const magasin = Object.assign({}, stock);
  const ajoutes = [];
  const oscillateurs = [], filtres = [];
  const faux = (type) => ({ type, frequency: { value: 0, setValueAtTime(f) { this.value = f; }, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} });
  class AudioContext {
    constructor() { this.currentTime = 0; this.sampleRate = 8000; this.state = "running"; this.destination = {}; }
    createOscillator() { const o = faux("sine"); oscillateurs.push(o); return o; }
    createGain() { return { gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
    createBiquadFilter() { const f = { type: "", frequency: { value: 0, setValueAtTime(v) { this.value = v; }, exponentialRampToValueAtTime() {} }, Q: { value: 0 }, connect() {} }; filtres.push(f); return f; }
    createBufferSource() { return { buffer: null, connect() {}, start() {} }; }
    createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; }
    createDynamicsCompressor() { return { connect() {} }; }
    createDelay() { return { delayTime: { value: 0 }, connect() {} }; }
  }
  const hote = {
    getBoundingClientRect: () => ({ width: 300, height: 360 }),
    querySelector: (s) => ajoutes.find((e) => s === ".vic-arcade" && /vic-arcade/.test(e.className)) || null,
    appendChild(e) { ajoutes.push(e); e.isConnected = true; }
  };
  const doc = {
    createElement: (tag) => ({ tag, className: "", style: {}, attrs: {}, children: [], isConnected: false, width: 0, height: 0,
      setAttribute(k, v) { this.attrs[k] = v; }, appendChild(c) { this.children.push(c); }, remove() { this.isConnected = false; },
      getContext: () => ctx2d, parentNode: null }),
    getElementById: () => null, head: { appendChild() {} }, documentElement: { appendChild() {} }
  };
  const image = { naturalWidth: 0 };
  const fen = {
    document: doc, AudioContext, performance: { now: () => 0 }, requestAnimationFrame: () => 0, setTimeout: () => 0, console,
    localStorage: { getItem: (k) => (k in magasin ? magasin[k] : null), setItem: (k, v) => { magasin[k] = String(v); } },
    matchMedia: () => ({ matches: reduit }),
    __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getInterface: () => volume },
    __SOREAL_IDLE_LIRE_ETAT_V1__: () => null
  };
  fen.window = fen;
  vm.runInNewContext(code, fen);
  return { V: fen.__SOREAL_IDLE_VICTOIRE_ARCADE_V1__, hote, image, magasin, ajoutes, oscillateurs, filtres, fen };
}
const etat = (o) => Object.assign({ bossSelection: 6, systemes: { difficulty: "normal", records: { highestBoss: 5 } } }, o);

// 1. Normal : seulement le PREMIER kill de ce boss. Le plus haut boss déjà battu au premier lancement compte comme « déjà vu ».
{
  const m = monde();
  assert.equal(m.V.doitJouer(etat({ bossSelection: 5 })), false, "boss déjà battu avant l'installation : pas d'écran");
  assert.equal(m.magasin.soreal_idle_victoire_arcade_max_v1, "5", "mémorisé (lié au compte : clé soreal_idle_*)");
  assert.equal(m.V.doitJouer(etat({ bossSelection: 6 })), true, "premier kill du boss 6");
  assert.equal(m.V.jouer(m.hote, m.image, etat({ bossSelection: 6 })), true, "joué");
  assert.equal(m.ajoutes.length, 1);
  assert.ok(/vic-arcade/.test(m.ajoutes[0].className) && /soreal-idle-boss-transition-v61/.test(m.ajoutes[0].className), "calque de la borne, exclu des secousses de combat");
  assert.ok("data-morph-garder" in m.ajoutes[0].attrs, "gardé par le redessin (règle n°4)");
  assert.equal(m.magasin.soreal_idle_victoire_arcade_max_v1, "6");
  assert.equal(m.V.jouer(m.hote, m.image, etat({ bossSelection: 6 })), false, "le même boss tué de nouveau (après renaissance) : plus d'écran");
  assert.equal(m.V.doitJouer(etat({ bossSelection: 4 })), false, "un boss plus bas : plus d'écran");
  assert.equal(m.V.doitJouer(etat({ bossSelection: 7 })), true, "le boss suivant : son premier kill");
}

// 2. Evil et Sadistic : à chaque victoire, sans rien mémoriser.
for (const diff of ["difficile", "extreme"]) {
  const m = monde({ stock: { soreal_idle_victoire_arcade_max_v1: "50" } });
  const e = etat({ bossSelection: 3, systemes: { difficulty: diff, records: { highestBoss: 60 } } });
  assert.equal(m.V.doitJouer(e), true, diff + " : toujours");
  assert.equal(m.V.jouer(m.hote, m.image, e), true);
  assert.equal(m.V.jouer(m.hote, m.image, e), true, diff + " : encore à la victoire suivante");
  assert.equal(m.magasin.soreal_idle_victoire_arcade_max_v1, "50", diff + " : le plus haut boss vu de Normal n'est pas touché");
}

// 3. « Réduire les animations » : rien ; sans état : rien.
{
  const m = monde({ reduit: true });
  assert.equal(m.V.jouer(m.hote, m.image, etat({ bossSelection: 9 })), false);
  assert.equal(m.ajoutes.length, 0);
  assert.equal(monde().V.doitJouer(null), false);
}

// 4. Le son est grave et doux : aucune note au-dessus de C5 (≈ 523 Hz), filtre passe-bas, volume 0 = silence.
{
  const m = monde();
  assert.equal(m.V.jouer(m.hote, m.image, etat({ bossSelection: 8 })), true);
  assert.ok(m.oscillateurs.length > 20, "plusieurs voix : boum, accord, mélodie, tics");
  const max = Math.max(...m.oscillateurs.map((o) => o.frequency.value));
  assert.ok(max <= 800, "aucune note aiguë (la plus haute : " + max + " Hz)");
  const lead = m.oscillateurs.filter((o) => o.frequency.value > 500 && o.frequency.value < 530).length;
  assert.ok(lead >= 1, "la note finale est un Do5, pas plus haut");
  assert.ok(m.filtres.some((f) => f.type === "lowpass" && f.frequency.value === 1800), "tout passe par un filtre passe-bas à 1 800 Hz");
  const muet = monde({ volume: 0 });
  muet.V.jouer(muet.hote, muet.image, etat({ bossSelection: 8 }));
  assert.equal(muet.oscillateurs.length, 0, "volume 0 : aucun son");
}

// 5. Câblage : à la victoire d'un combat (pas le NUKE), le bandeau texte reste caché en dessous ; module chargé par la page.
const combat1 = readFileSync(new URL("../public/modules/ui-combat-1-v1.js", import.meta.url), "utf8");
assert.ok(combat1.includes("if(arcade&&!REG.idleNukeEnCoursV1)victoireArcadeIdleV1=Boolean(arcade.jouer(host,image,REG.idleEtat));"), "jamais pendant un NUKE");
assert.ok(combat1.includes("'soreal-idle-boss-transition-v61'+(victoireArcadeIdleV1?' vic-cache':'')"), "bandeau caché mais gardé pour le filet de sécurité");
const combat2 = readFileSync(new URL("../public/modules/ui-combat-2-v1.js", import.meta.url), "utf8");
assert.ok(!combat2.includes("transitionMortBossIdleV61_") && !combat2.includes("VICTOIRE_ARCADE"), "la cascade du NUKE n'appelle jamais l'écran de victoire");
assert.ok(readFileSync(new URL("../public/index.html", import.meta.url), "utf8").includes('<script defer src="/modules/victoire-boss-arcade-v1.js?v='), "module chargé");
console.log("idle-victoire-boss-arcade-v1: OK");
