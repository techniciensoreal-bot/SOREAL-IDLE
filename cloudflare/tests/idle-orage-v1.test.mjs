import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Orage visuel (Norman, 2026-10-06) : quand la piste d'ambiance est celle du tonnerre, pluie, ciel assombri et éclairs ; éclairs calés sur les coups de tonnerre
 * de la piste quand l'analyse audio est possible, au hasard sinon ; grondement discret ; doux pour les yeux (espacement, pas d'éclat si mouvement réduit).
 * Magie du sang : la barre du rituel actif saigne (couleurs d'origine du menu, style ITOPOD).
 */
const src = readFileSync("cloudflare/public/modules/orage-v1.js", "utf8");
const ambiant = readFileSync("cloudflare/public/modules/ambient-audio-v1.js", "utf8");

const ecouteurs = {};
const changements = [];
const faux = () => {
  const el = { style: { setProperty() {} }, classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, contains(c) { return this._s.has(c); } }, innerHTML: "", children: [], setAttribute() {}, appendChild(c) { this.children.push(c); c.parentNode = this; }, querySelector(sel) { return el._q[sel] || (el._q[sel] = faux()); }, _q: {}, parentNode: null };
  return el;
};
const corps = faux();
let mouvementReduit = false;
let volume = 0.5;
let contextes = 0;
const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
const fauxContexte = () => ({
  state: "running", sampleRate: 8000, currentTime: 0, destination: {},
  createBuffer: (c, n) => ({ getChannelData: () => new Float32Array(n) }),
  createBufferSource: () => ({ connect() {}, start() {}, buffer: null }),
  createBiquadFilter: () => ({ type: "", frequency: param(), Q: { value: 0 }, connect() {} }),
  createGain: () => ({ gain: param(), connect() {} }),
  resume() {}
});
const fenetre = {
  document: { getElementById: () => null, head: { appendChild() {} }, body: corps, createElement: () => faux() },
  matchMedia: () => ({ matches: mouvementReduit }),
  addEventListener: (nom, fn) => { (ecouteurs[nom] = ecouteurs[nom] || []).push(fn); },
  AudioContext: function () { contextes += 1; return fauxContexte(); },
  __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getAmbiance: () => volume, onChange: (f) => { changements.push(f); } },
  setTimeout, clearTimeout, setInterval: () => 1, clearInterval: () => {}, requestAnimationFrame: (f) => f(), Date, Math, Uint8Array, Float32Array
};
fenetre.window = fenetre;
vm.runInNewContext(src, fenetre, { filename: "orage-v1.js" });
const O = fenetre.__SOREAL_IDLE_ORAGE_V1__;
assert.ok(O && typeof O.eclair === "function", "module exposé");

// Seule la piste du tonnerre déclenche l'orage.
assert.equal(O.estOrage("Thunder.opus"), true);
assert.equal(O.estOrage("idle/ambient/orage-lointain.opus"), true);
for (const autre of ["Birds.opus", "Fireplace.opus", "ruisseau.opus", "BloodMagic.opus", ""]) assert.equal(O.estOrage(autre), false, autre);

// Écoute de la piste : démarre sur le tonnerre, s'arrête sur une autre piste ou sur le silence.
const emettre = (cle, extra) => ecouteurs["soreal-ambiance-v1"].forEach((f) => f({ detail: Object.assign({ cle }, extra || {}) }));
assert.ok(ecouteurs["soreal-ambiance-v1"].length === 1, "écoute l'annonce de la piste");
assert.equal(O.actif(), false);
emettre("Thunder.opus");
assert.equal(O.actif(), true, "tonnerre : orage actif");
emettre("Birds.opus");
assert.equal(O.actif(), false, "autre piste : orage arrêté");
emettre("Thunder.opus");
emettre("");
assert.equal(O.actif(), false, "silence : orage arrêté");

// On ne voit l'orage que si on l'entend : volume d'ambiance à zéro (ou case décochée) = pas d'orage, même si la piste du tonnerre défile en silence.
volume = 0;
emettre("Thunder.opus");
assert.equal(O.actif(), false, "ambiance coupée : pas d'orage");
volume = 0.5;
changements.forEach((f) => f());
assert.equal(O.actif(), true, "ambiance rétablie pendant la piste d'orage : l'orage arrive");
volume = 0;
changements.forEach((f) => f());
assert.equal(O.actif(), false, "ambiance recoupée : l'orage s'arrête");
volume = 0.5;
changements.forEach((f) => f());
O.arreter();
emettre("Birds.opus");
assert.equal(O.actif(), false, "piste sans orage : rien, même avec le son");

// Éclair : jamais deux à moins de 5 s ; rien sans orage.
assert.equal(O.eclair(), false, "pas d'éclair sans orage");
emettre("Thunder.opus");
assert.equal(O.eclair(), true, "premier éclair");
assert.equal(O.eclair(), false, "pas de second éclair dans les 5 s");

// Mouvement réduit : aucun décor, aucun éclair.
O.arreter();
mouvementReduit = true;
emettre("Thunder.opus");
assert.equal(O.actif(), false, "mouvement réduit : pas d'orage visuel");
assert.equal(O.eclair(), false);
mouvementReduit = false;

// Grondement : au volume de l'ambiance, rien à volume 0.
volume = 0;
const avant = contextes;
const c = fauxContexte();
let noeuds = 0;
const spy = new Proxy(c, { get(t, k) { const v = t[k]; return typeof v === "function" && /^create/.test(String(k)) ? (...a) => { noeuds += 1; return v(...a); } : v; } });
O.construireGrondement(spy, {}, 0, 2.5, () => 0.5);
assert.ok(noeuds >= 3, "le grondement construit son bruit");
assert.equal(contextes, avant, "construire n'ouvre aucun contexte");
const sources = src.split("\n").filter((l) => l.includes("function grondement_"));
assert.equal(sources.length, 1);
assert.ok(src.includes("if(!(v>0))return false;"), "volume d'ambiance à 0 : aucun grondement");

// Précautions pour les yeux et les clics.
assert.ok(src.includes("pointer-events:none"), "n'intercepte aucun clic");
assert.ok(src.includes("ESPACE_MIN_MS=5000") && src.includes("Math.floor(Math.random()*3)"), "espacement et au plus trois éclats");
assert.ok(src.includes("prefers-reduced-motion"), "respecte la préférence de mouvement réduit");
assert.ok(src.includes("createAnalyser") && src.includes("hasard_()"), "éclairs calés sur la piste, sinon au hasard");

// Annonce de la piste par l'ambiance, branchement dans la page.
assert.ok(ambiant.includes("addEventListener('playing'"), "annoncée seulement quand la piste joue vraiment");
assert.ok(ambiant.includes("soreal-ambiance-v1") && ambiant.includes("signaler_(cle,slot)") && ambiant.includes("signaler_('',slot)") && ambiant.includes("signaler_('',null)"), "l'ambiance annonce la piste qui joue et son arrêt");
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(/\/modules\/orage-v1\.js\?v=\d+/.test(index) && index.indexOf("orage-v1.js") > index.indexOf("ambient-audio-v1.js"), "module chargé après l'ambiance");

// Magie du sang : couleurs d'origine, barre qui saigne.
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
assert.ok(css.includes('[data-menu="sang"]{--i-a:#be192d;--i-b:#5c0a15;--i-c:#f2a1ab;--i-bg1:#3a0f17;--i-bg2:#130406;'), "palette d'origine du menu (rouge sang sur noir)");
for (const fragment of ["sangBatV1", "sangGouttesV1", ".saigne-v1", ".sang-g-v1"]) assert.ok(css.includes(fragment), "saignement : " + fragment);
assert.ok(meta.includes("soreal-idle-bt-track-v120'+(progressionActive?' saigne-v1':'')"), "la page marque la barre du rituel qui progresse");
assert.ok((meta.match(/<span class=.sang-g-v1./g) || []).length >= 6, "gouttes sous la barre");

console.log("idle-orage-v1: OK");
