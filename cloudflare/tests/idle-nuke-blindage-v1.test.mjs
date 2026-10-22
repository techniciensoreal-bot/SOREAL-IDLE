import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-22) : le bouton NUKE se referme sous un blindage d'acier quand il n'est pas disponible, avec une animation (et un son) à la fermeture et la même à l'envers à l'ouverture, style Transformers.
 */
const code = readFileSync(new URL("../public/modules/nuke-blindage-v1.js", import.meta.url), "utf8");
function monde({ reduit = false, volume = 0.8 } = {}) {
  let sons = 0;
  const faux = () => ({ frequency: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() { sons += 1; }, stop() {}, type: "" });
  class AudioContext {
    constructor() { this.currentTime = 0; this.sampleRate = 8000; this.state = "running"; this.destination = {}; }
    createOscillator() { return faux(); }
    createGain() { return { gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
    createBiquadFilter() { return { type: "", frequency: { value: 0 }, Q: { value: 0 }, connect() {} }; }
    createBufferSource() { const s = faux(); s.buffer = null; return s; }
    createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; }
    createDynamicsCompressor() { return { connect() {} }; }
  }
  const creerBouton = (disabled) => {
    const b = { disabled, enfants: [], id: "sorealIdleBossNukeV1", appendChild(e) { this.enfants.push(e); }, querySelector(s) { return s === ".nk-blindage" ? this.enfants[0] || null : null; } };
    return b;
  };
  const etat = { bouton: creerBouton(true) };
  const doc = {
    hidden: false, styles: [],
    getElementById: (id) => (id === "sorealIdleBossNukeV1" ? etat.bouton : id === "soreal-idle-nuke-blindage-style" ? doc.styles[0] || null : null),
    createElement: () => { const e = { attrs: {}, className: "", innerHTML: "", setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }, removeAttribute(k) { delete this.attrs[k]; }, hasAttribute(k) { return k in this.attrs; }, getBoundingClientRect() { return {}; } }; return e; },
    head: { appendChild(e) { doc.styles.push(e); } }, documentElement: { appendChild() {} }
  };
  const fen = { document: doc, AudioContext, console, setInterval: () => 0, matchMedia: () => ({ matches: reduit }), __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getInterface: () => volume } };
  fen.window = fen;
  vm.runInNewContext(code, fen);
  return { N: fen.__SOREAL_IDLE_NUKE_BLINDAGE_V1__, etat, doc, nbSons: () => sons, creerBouton };
}

// 1. Premier passage : le calque se met directement sur l'état du bouton, sans son ni animation (fermé tant que le NUKE est indisponible).
{
  const m = monde();
  assert.equal(m.N.verifier(), true);
  const c = m.etat.bouton.enfants[0];
  assert.ok(c && /nk-blindage/.test(c.className), "calque ajouté au bouton");
  assert.ok("data-morph-garder" in c.attrs, "gardé par le redessin (règle n°4)");
  assert.equal(c.attrs["data-etat"], "ferme", "indisponible : fermé");
  assert.equal(m.nbSons(), 0, "aucun son au premier passage");
  assert.equal((c.innerHTML.match(/class="nk-porte /g) || []).length, 2, "deux battants d'acier");
  assert.equal((c.innerHTML.match(/class="nk-poutre"/g) || []).length, 2, "poutre centrale en métal, portée par les battants");
  assert.equal((c.innerHTML.match(/class="nk-verrou /g) || []).length, 2, "deux verrous");
  assert.ok(!/ffcf1f|ffd400|nk-bande/i.test(c.innerHTML), "aucune ligne jaune au milieu");
}

// 2. Il devient disponible : il s'ouvre avec son ; il redevient indisponible : il se referme avec son ; rien si rien ne change.
{
  const m = monde();
  m.N.verifier();
  m.etat.bouton.disabled = false;
  m.N.verifier();
  assert.equal(m.etat.bouton.enfants[0].attrs["data-etat"], "ouvert");
  const sonsOuverture = m.nbSons();
  assert.ok(sonsOuverture > 8, "claquements, servo et souffle à l'ouverture (" + sonsOuverture + ")");
  m.N.verifier(); m.N.verifier();
  assert.equal(m.nbSons(), sonsOuverture, "pas de son tant que l'état ne change pas");
  m.etat.bouton.disabled = true;
  m.N.verifier();
  assert.equal(m.etat.bouton.enfants[0].attrs["data-etat"], "ferme");
  assert.ok(m.nbSons() > sonsOuverture + 8, "fermeture : son aussi");
}

// 3. Le jeu redessine le bouton (calque perdu) : le calque neuf reprend l'état d'avant SANS animation, puis l'animation se joue si l'état a changé.
{
  const m = monde();
  m.N.verifier();                                    // fermé
  m.etat.bouton = m.creerBouton(true);              // bouton redessiné, toujours indisponible
  m.N.verifier();
  assert.equal(m.etat.bouton.enfants[0].attrs["data-etat"], "ferme");
  assert.equal(m.nbSons(), 0, "un redessin n'est pas une animation");
  m.etat.bouton = m.creerBouton(false);             // redessiné ET devenu disponible : il s'ouvre
  m.N.verifier();
  assert.equal(m.etat.bouton.enfants[0].attrs["data-etat"], "ouvert");
  assert.ok(m.nbSons() > 8, "s'ouvre avec son");
}

// 4. « Réduire les animations » et volume 0 : pas de son ; le calque change d'état instantanément.
{
  const m = monde({ reduit: true });
  m.N.verifier(); m.etat.bouton.disabled = false; m.N.verifier();
  assert.equal(m.etat.bouton.enfants[0].attrs["data-etat"], "ouvert");
  assert.equal(m.nbSons(), 0);
  const muet = monde({ volume: 0 });
  muet.N.verifier(); muet.etat.bouton.disabled = false; muet.N.verifier();
  assert.equal(muet.nbSons(), 0, "volume 0 : aucun son");
}

// 5. Feuille de style : fermé = battants joints ; ouvert = glissés chacun de son côté (poutre comprise) ; l'ouverture déverrouille d'abord, la fermeture verrouille en dernier.
{
  const m = monde(); m.N.verifier();
  const css = m.doc.styles[0].textContent;
  assert.ok(css.includes('[data-etat="ouvert"] .nk-g{transform:translateX(-102%);transition-delay:.35s}') && css.includes('[data-etat="ouvert"] .nk-d{transform:translateX(102%);transition-delay:.35s}'), "battants glissés de chaque côté après les verrous");
  assert.ok(css.includes('[data-etat="ouvert"] .nk-v1{transform:translateY(-300%);transition-delay:0s}') && css.includes('[data-etat="ferme"] .nk-verrou{transition-delay:.7s}'), "verrous : retirés d'abord, remis en dernier");
  assert.ok(!/ffcf1f|ffd400/i.test(css), "pas de jaune dans le blindage");
  assert.ok(css.includes("@media (prefers-reduced-motion:reduce)") || /@media \(prefers-reduced-motion:reduce\)/.test(css));
}

assert.ok(readFileSync(new URL("../public/index.html", import.meta.url), "utf8").includes('<script defer src="/modules/nuke-blindage-v1.js?v='), "module chargé");
console.log("idle-nuke-blindage-v1: OK");
