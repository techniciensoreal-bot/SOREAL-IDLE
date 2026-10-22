import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-22) : écran de victoire « arcade » (image du boss qui éclate en pixels, K.O., BOSS VAINCU) quand on tue un boss après un combat d'au moins 5 secondes, jamais pour un NUKE ; son grave et doux (« trop aigu,
 * ça casse les oreilles »).
 */
const code = readFileSync(new URL("../public/modules/victoire-boss-arcade-v1.js", import.meta.url), "utf8");
const dessines = [];   /* sources passées à drawImage : l'image affichée ou la copie mémorisée du boss combattu */
const ctx2d = new Proxy({}, { get: (c, k) => (k === "fillStyle" || k === "globalAlpha" ? 1 : k === "drawImage" ? (src) => { dessines.push(src); } : k === "getImageData" ? () => ({ data: new Uint8ClampedArray(4 * 40 * 160) }) : () => {}), set: () => true });
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
  const image = { naturalWidth: 0, src: "/api/idle/media/boss?id=7" };
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

// 1. Quand : victoire d'un combat de boss d'au moins 5 secondes, à chaque fois, quel que soit le boss ou la difficulté.
{
  const m = monde();
  assert.equal(m.V.combatMinMs, 5000);
  assert.equal(m.V.doitJouer(etat(), 4999), false, "combat de moins de 5 s : pas d'écran");
  assert.equal(m.V.doitJouer(etat(), 0), false, "durée inconnue : pas d'écran");
  assert.equal(m.V.doitJouer(etat(), undefined), false);
  assert.equal(m.V.doitJouer(etat(), 5000), true, "5 s exactement : écran");
  assert.equal(m.V.jouer(m.hote, m.image, etat(), 4000), false);
  assert.equal(m.ajoutes.length, 0, "rien posé pour un combat court");
  assert.equal(m.V.jouer(m.hote, m.image, etat(), 7500), true, "joué");
  assert.equal(m.ajoutes.length, 1);
  assert.ok(/vic-arcade/.test(m.ajoutes[0].className) && /soreal-idle-boss-transition-v61/.test(m.ajoutes[0].className), "calque de la borne, exclu des secousses de combat");
  assert.ok("data-morph-garder" in m.ajoutes[0].attrs, "gardé par le redessin (règle n°4)");
  assert.equal(m.V.jouer(m.hote, m.image, etat(), 9000), true, "le même boss tué de nouveau (après une renaissance) : l'écran revient, il ne dépend que de la durée");
  assert.deepEqual(Object.keys(m.magasin), [], "plus rien n'est mémorisé");
}
// 2. Toutes les difficultés, tous les boss.
for (const diff of ["normal", "difficile", "extreme"]) {
  for (const boss of [1, 6, 120]) {
    const m = monde();
    assert.equal(m.V.jouer(m.hote, m.image, etat({ bossSelection: boss, systemes: { difficulty: diff, records: { highestBoss: 200 } } }), 6000), true, diff + " boss " + boss);
  }
}

// 3. « Réduire les animations » : rien ; sans état : rien.
{
  const m = monde({ reduit: true });
  assert.equal(m.V.jouer(m.hote, m.image, etat({ bossSelection: 9 }), 8000), false);
  assert.equal(m.ajoutes.length, 0);
  assert.equal(monde().V.doitJouer(null), false);
}

// 4. Le son est grave et doux : aucune note au-dessus de C5 (≈ 523 Hz), filtre passe-bas, volume 0 = silence.
{
  const m = monde();
  assert.equal(m.V.jouer(m.hote, m.image, etat({ bossSelection: 8 }), 8000), true);
  assert.ok(m.oscillateurs.length > 20, "plusieurs voix : boum, accord, mélodie, tics");
  const max = Math.max(...m.oscillateurs.map((o) => o.frequency.value));
  assert.ok(max <= 800, "aucune note aiguë (la plus haute : " + max + " Hz)");
  const lead = m.oscillateurs.filter((o) => o.frequency.value > 500 && o.frequency.value < 530).length;
  assert.ok(lead >= 1, "la note finale est un Do5, pas plus haut");
  assert.ok(m.filtres.some((f) => f.type === "lowpass" && f.frequency.value === 1800), "tout passe par un filtre passe-bas à 1 800 Hz");
  const muet = monde({ volume: 0 });
  muet.V.jouer(muet.hote, muet.image, etat({ bossSelection: 8 }), 8000);
  assert.equal(muet.oscillateurs.length, 0, "volume 0 : aucun son");
}

// 5. Câblage : à la victoire d'un combat (pas le NUKE), le bandeau texte reste caché en dessous ; module chargé par la page.
// 4b. C'est l'image du boss TUÉ qui éclate, jamais celle du suivant (le moteur local affiche déjà le suivant quand la victoire est prédite).
{
  const m = monde();
  const imgFought = { naturalWidth: 400, naturalHeight: 400, src: "/api/idle/media/boss?id=6" };
  const imgNext = { naturalWidth: 400, naturalHeight: 400, src: "/api/idle/media/boss?id=7" };
  m.hote.querySelector = (s) => (s === "img" ? m.hote.imgAffichee : (s === ".vic-arcade" ? null : null));
  m.hote.imgAffichee = imgNext;
  m.fen.location = { href: "http://x/" }; m.fen.URL = URL;
  const e = etat({ bossSelection: 7 });
  dessines.length = 0;
  // Sans copie mémorisée et avec l'image du SUIVANT affichée : on joue sans éclats plutôt qu'avec la mauvaise image.
  assert.equal(m.V.jouer(m.hote, imgNext, e, 8000, 6), true);
  assert.equal(dessines.includes(imgNext), false, "l'image du boss suivant n'est jamais utilisée pour le boss tué");
  // L'image affichée est bien celle du boss tué : elle sert.
  dessines.length = 0;
  m.V.jouer(m.hote, imgFought, e, 8000, 6);
  assert.equal(dessines.includes(imgFought), true, "l'image du boss tué sert à l'explosion");
  // Copie mémorisée au début du combat (boss 6 affiché) ; ensuite le boss 7 s'affiche : l'explosion utilise la COPIE.
  m.hote.imgAffichee = imgFought;
  assert.equal(m.V.capturer(m.hote, 6), true, "copie du boss combattu");
  assert.equal(m.V.capturer(m.hote, 7), false, "une image qui n'est pas celle du boss demandé n'est jamais copiée");
  m.hote.imgAffichee = imgNext;
  dessines.length = 0;
  m.V.jouer(m.hote, imgNext, e, 8000, 6);
  assert.equal(dessines.includes(imgNext), false);
  assert.ok(dessines.length > 0 && dessines.every((s) => s !== imgFought && s !== imgNext), "dessiné d'après la copie mémorisée du boss 6 (un canvas)");
}

const combat1 = readFileSync(new URL("../public/modules/ui-combat-1-v1.js", import.meta.url), "utf8");
assert.ok(combat1.includes("if(arcade&&!REG.idleNukeEnCoursV1)victoireArcadeIdleV1=Boolean(arcade.jouer(host,image,REG.idleEtat,REG.idleCombatDebutV1?Date.now()-REG.idleCombatDebutV1:0,REG.idleCombatBossNumV1));"), "jamais pendant un NUKE ; durée du combat et boss combattu transmis");
assert.ok(combat1.includes("REG.idleCombatBossNumV1=idleEntier_(REG.idleEtat.bossSelection||1);") && combat1.includes("arcade.planifierCapture(REG.idleCombatBossNumV1)"), "au début de chaque combat : le boss combattu est noté et son image mise de côté");
assert.ok(combat1.includes("REG.idleCombatDebutV1=Date.now();"), "le début de chaque combat est noté");
assert.ok(combat1.includes("'soreal-idle-boss-transition-v61'+(victoireArcadeIdleV1?' vic-cache':'')"), "bandeau caché mais gardé pour le filet de sécurité");
const combat2 = readFileSync(new URL("../public/modules/ui-combat-2-v1.js", import.meta.url), "utf8");
assert.ok(!combat2.includes("transitionMortBossIdleV61_") && !combat2.includes("VICTOIRE_ARCADE"), "la cascade du NUKE n'appelle jamais l'écran de victoire");
assert.ok(readFileSync(new URL("../public/index.html", import.meta.url), "utf8").includes('<script defer src="/modules/victoire-boss-arcade-v1.js?v='), "module chargé");
console.log("idle-victoire-boss-arcade-v1: OK");
