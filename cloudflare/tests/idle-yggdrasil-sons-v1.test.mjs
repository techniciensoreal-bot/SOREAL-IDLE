import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Sons de la page des fruits (Norman, 2026-10-06) : une panoplie de sons agréables (interrupteurs, onglets, activer, améliorer, manger, récolter, poop, « tout »,
 * fruit prêt), synthétisés, au volume « Sons de l'interface ». Aussi : cadre sans pièces qui dépassent, ligne noire sous les onglets, texte de la poop à jour.
 */
const sons = readFileSync("cloudflare/public/modules/yggdrasil-sons-v1.js", "utf8");
const page = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");

let contextes = 0;
let noeuds = 0;
const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
const fauxContexte = () => ({
  state: "running", sampleRate: 8000, currentTime: 0, destination: {},
  createBuffer: (c, n) => ({ getChannelData: () => new Float32Array(n) }),
  createBufferSource: () => { noeuds += 1; return { connect() {}, start() {}, buffer: null }; },
  createBiquadFilter: () => { noeuds += 1; return { type: "", frequency: param(), Q: { value: 0 }, connect() {} }; },
  createGain: () => { noeuds += 1; return { gain: param(), connect() {} }; },
  createOscillator: () => { noeuds += 1; return { type: "", frequency: param(), connect() {}, start() {}, stop() {} }; },
  resume() {}
});
let volume = 0.75;
const fenetre = { AudioContext: function () { contextes += 1; return fauxContexte(); }, __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getInterface: () => volume } };
fenetre.window = fenetre;
vm.runInNewContext(sons, fenetre, { filename: "yggdrasil-sons-v1.js" });
const S = fenetre.__SOREAL_IDLE_YGG_SONS_V1__;
assert.ok(S && typeof S.jouer === "function", "module exposé");

const attendus = ["interrupteur", "onglet", "aide", "activer", "ameliorer", "manger", "recolter", "poop", "tout", "pret"];
assert.deepEqual(Array.from(S.noms).sort(), attendus.slice().sort(), "toute la panoplie");

// Volume à 0 : aucun son, aucun contexte audio.
volume = 0;
for (const n of attendus) assert.equal(S.jouer(n), false, n + " muet à volume 0");
assert.equal(contextes, 0, "pas de contexte audio à volume 0");
assert.equal(S.jouer("inconnu"), false);

// Volume normal : chaque son construit son graphe audio, sans erreur.
volume = 0.75;
for (const n of attendus) {
  const avant = noeuds;
  assert.equal(S.jouer(n), true, n + " joue");
  assert.ok(noeuds - avant >= 3, n + " construit de quoi sonner");
}
const a = noeuds; S.jouer("interrupteur", true); const marche = noeuds - a;
const b = noeuds; S.jouer("interrupteur", false); const arret = noeuds - b;
assert.ok(marche > 0 && arret > 0, "interrupteur dans les deux sens");
const avantTout = noeuds; S.jouer("tout"); const nTout = noeuds - avantTout;
const avantOnglet = noeuds; S.jouer("onglet"); assert.ok(nTout > noeuds - avantOnglet, "la cascade « tout » est plus riche qu'un onglet");

// Branchements dans la page : chaque geste a son son.
for (const [fragment, raison] of [
  ["son_('activer')", "activer"], ["son_('ameliorer')", "améliorer"], ["son_(c.mode==='harvest'?'recolter':'manger')", "manger / récolter"],
  ["son_('interrupteur',m==='harvest')", "interrupteur Manger / Récolter"], ["son_('poop')", "poop"], ["son_('onglet')", "onglet"], ["son_('aide')", "aide"],
  ["son_('tout')", "tout manger"], ["son_('pret')", "fruit prêt"], ["son_('interrupteur',Boolean(v))", "case poop seulement au tier max"]
]) assert.ok(page.includes(fragment), "son branché : " + raison);
assert.ok(page.includes("etat.pretsVus!==null"), "le tintement « prêt » n'est jamais joué à l'ouverture de la page");

// Mise en page : cadre fini, onglets soulignés, texte de la poop à jour.
assert.ok(!page.includes("ygg-luciole") && !/\.ygg-cadre::before\{left:-8px\}/.test(page), "plus de lanternes qui dépassent des côtés du cadre");
assert.ok(page.includes("inset 0 0 0 7px #e0b640"), "cadre à anneaux (or et noir)");
assert.ok(/\.ygg-onglets\{[^}]*border-bottom:3px solid #000/.test(page), "ligne noire sous les onglets");
assert.ok(page.includes("poop achetable à la boutique AP, rayon Boosts.") && !page.includes("Sellout Shop"), "texte de la poop à jour");
assert.ok(!readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8").includes("Poop achetable au 4G"), "ancien texte aussi corrigé");
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(/yggdrasil-sons-v1\.js\?v=\d+/.test(index), "module de sons chargé");
assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon/.test(sons), "rien n'est envoyé");

console.log("idle-yggdrasil-sons-v1: OK");
