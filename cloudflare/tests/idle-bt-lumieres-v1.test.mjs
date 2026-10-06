import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Basic Training (Norman, 2026-10-06) : (1) les bandeaux « Compétences d'attaque / de défense » vacillent au hasard comme une lumière qui va claquer, avec un petit bruit ;
 * (2) ajouter de l'énergie = bruit de machine qui démarre (avec fade out), la retirer = bruit de machine qui s'arrête.
 */
const src = readFileSync("cloudflare/public/modules/bt-lumieres-v1.js", "utf8");
const audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const index = readFileSync("cloudflare/public/index.html", "utf8");

let contextes = 0;
let noeuds = 0;
const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {} });
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
let mouvementReduit = false;
const timers = [];
const fenetre = {
  document: { readyState: "complete", addEventListener() {}, querySelectorAll: () => [], hidden: false },
  matchMedia: () => ({ matches: mouvementReduit }),
  AudioContext: function () { contextes += 1; return fauxContexte(); },
  __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getInterface: () => volume },
  setTimeout: (f, ms) => { timers.push({ f, ms }); return timers.length; }, clearTimeout() {}, Date, Math, Float32Array, Array, Map
};
fenetre.window = fenetre;
vm.runInNewContext(src, fenetre, { filename: "bt-lumieres-v1.js" });
const L = fenetre.__SOREAL_IDLE_BT_LUMIERES_V1__;
assert.ok(L && typeof L.vaciller === "function", "module exposé");

// Motif : alterne éteint / allumé, finit allumé, jamais plus de trois éclats par seconde.
for (let essai = 0; essai < 200; essai++) {
  const m = L.motif();
  assert.ok(m.length >= 4, "au moins deux extinctions");
  assert.equal(m[0][0], true, "commence par s'éteindre");
  assert.equal(m[m.length - 1][0], false, "finit allumé");
  for (let i = 1; i < m.length; i++) assert.notEqual(m[i][0], m[i - 1][0], "alterne");
  let t = 0;
  const extinctions = [];
  m.forEach((e) => { if (e[0]) extinctions.push(t); t += e[1]; });
  for (let i = 0; i + 3 < extinctions.length; i++) assert.ok(extinctions[i + 3] - extinctions[i] >= 1000, "pas plus de trois éclats par seconde : " + (extinctions[i + 3] - extinctions[i]));
}
assert.ok(Array.from({ length: 50 }, () => L.motif()).some((m) => m.length > 7), "parfois un blocage plus long avant de revenir");

// Vacillement d'un bandeau : la classe s'ajoute et se retire, un son à chaque changement.
const el = { isConnected: true, classList: { _s: new Set(), toggle(c, v) { v ? this._s.add(c) : this._s.delete(c); }, remove(c) { this._s.delete(c); }, contains(c) { return this._s.has(c); } } };
const sons = [];
const t0 = timers.length;
assert.equal(L.vaciller(el, () => 0.5), true);
let vusEteint = el.classList.contains(L.classe);
assert.equal(vusEteint, true, "s'éteint tout de suite");
let garde = 0;
while (timers.length > t0 && garde++ < 40) { const t = timers.splice(t0, 1)[0]; t.f(); }
assert.equal(el.classList.contains(L.classe), false, "revient allumé à la fin");

// Mouvement réduit : rien ; volume 0 : aucun son, aucun contexte audio.
mouvementReduit = true;
assert.equal(L.vaciller(el), false, "mouvement réduit : pas de vacillement");
mouvementReduit = false;
const contextesAvant = contextes;
volume = 0;
assert.equal(L.sonner("eteint"), false);
assert.equal(contextes, contextesAvant, "volume 0 : aucun contexte audio de plus");
volume = 0.75;
const a = noeuds; assert.equal(L.sonner("eteint"), true); assert.ok(noeuds - a >= 30, "« tzzt » : crépitement, « pop » et bourdonnement du ballast : " + (noeuds - a));
const b = noeuds; assert.equal(L.sonner("allume"), true); assert.ok(noeuds - b >= 10 && noeuds - b < noeuds - a, "rallumage : plus court que l'extinction : " + (noeuds - b));

// Le hasard : un vacillement toutes les 7 à 22 secondes par bandeau.
assert.ok(src.includes("7000+Math.random()*15000"), "intervalle aléatoire de 7 à 22 s");
assert.ok(src.includes("prefers-reduced-motion"), "respecte la préférence de mouvement réduit");
assert.ok(src.includes(".soreal-idle-bt-panel-v120.attack .soreal-idle-bt-panel-head-v120") && src.includes(".soreal-idle-bt-panel-v120.defense .soreal-idle-bt-panel-head-v120"), "bandeaux d'attaque et de défense");
assert.ok(css.includes(".soreal-idle-bt-panel-head-v120.lumiere-eteinte{") && css.includes("brightness(.2)"), "état éteint : bandeau assombri");
assert.ok(/\/modules\/bt-lumieres-v1\.js\?v=\d+/.test(index), "module chargé par la page");

// Machine : + démarre (fade out), − s'arrête ; la file n'est retenue que 300 ms.
for (const [fonction, builder] of [["btPlus_", "machineDemarre_"], ["btMoins_", "machineS_arrete_"]]) {
  const debut = audio.indexOf("function " + fonction + "(){");
  assert.ok(debut > 0, fonction + " existe");
  const corps = audio.slice(debut, audio.indexOf("}", audio.indexOf("}", debut) + 1) + 1);
  assert.ok(corps.includes("jouerWebAudio_(300," + builder + ")"), fonction + " joue " + builder + " sans retenir la file plus de 300 ms");
}
const demarre = audio.slice(audio.indexOf("function machineDemarre_"), audio.indexOf("function machineS_arrete_"));
const arrete = audio.slice(audio.indexOf("function machineS_arrete_"), audio.indexOf("function btPlus_"));
assert.ok(demarre.includes("from:185,to:900") && demarre.includes("from:112,to:430"), "démarrage : le moteur monte en tours (médium audible sur de petits haut-parleurs)");
assert.ok(arrete.includes("from:850,to:135") && arrete.includes("from:430,to:92"), "arrêt : le moteur retombe");
assert.ok(demarre.includes("moteurRates_(c,.10,.115,.88,10,"), "démarrage : les ratés du moteur se resserrent (facteur < 1)");
assert.ok(arrete.includes("moteurRates_(c,.05,.045,1.27,9,"), "arrêt : les ratés s'espacent (facteur > 1)");
const corpsMoteur = audio.slice(audio.indexOf("function moteurSon_"), audio.indexOf("function moteurRates_"));
assert.ok(corpsMoteur.includes("linearRampToValueAtTime") && corpsMoteur.includes("setTargetAtTime"), "crescendo linéaire puis longue queue : un vrai fade out audible");
assert.ok(audio.includes("machineDemarre:{duree:1200") && audio.includes("machineArrete:{duree:1100"), "constructeurs exposés pour les vérifications hors ligne");

console.log("idle-bt-lumieres-v1: OK");
