import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Basic Training (Norman, 2026-10-06) :
 *  - aucune énergie placée : les lumières des bandeaux « Compétences d'attaque / de défense » sont ÉTEINTES ;
 *  - de l'énergie placée sur une machine totalement vide : elles s'allument comme un néon, avec le son du néon qui s'allume, UNE seule fois (tant qu'on n'a pas tout retiré) ;
 *  - allumées, elles claquent rarement : un bandeau (haut ou bas) vacille une ou deux fois, avec un « tzzzzt » court, doux, le second coupant le premier ;
 *  - + = machine qui démarre (fade out), − = machine qui s'arrête.
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
  createGain: () => { noeuds += 1; return { gain: param(), connect() {}, disconnect() {} }; },
  createOscillator: () => { noeuds += 1; return { type: "", frequency: param(), connect() {}, start() {}, stop() {} }; },
  resume() {}
});
const fauxBandeau = () => ({ isConnected: true, classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, toggle(c, v) { v ? this._s.add(c) : this._s.delete(c); }, contains(c) { return this._s.has(c); } } });
let volume = 0.75;
let mouvementReduit = false;
let timers = [];
let bandeaux = [fauxBandeau(), fauxBandeau()];
const etatJeu = { basicTraining: { skills: [{ allocation: 0 }, { allocation: 0 }] } };
const fenetre = {
  document: { readyState: "complete", addEventListener() {}, querySelectorAll: (sel) => (sel.includes("lumiere") || sel === "." + "lumiere-eteinte" ? [] : bandeaux), hidden: false },
  matchMedia: () => ({ matches: mouvementReduit }),
  AudioContext: function () { contextes += 1; return fauxContexte(); },
  __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getInterface: () => volume },
  __SOREAL_IDLE_META_HOST_V130__: { getIdleEtat: () => etatJeu },
  setTimeout: (f, ms) => { timers.push({ f, ms }); return timers.length; }, clearTimeout() {},
  setInterval: () => 1, clearInterval() {}, Date, Math, Float32Array, Array, Map, Number
};
fenetre.window = fenetre;
vm.runInNewContext(src, fenetre, { filename: "bt-lumieres-v1.js" });
const L = fenetre.__SOREAL_IDLE_BT_LUMIERES_V1__;
assert.ok(L && typeof L.veiller === "function", "module exposé");
/* Le minuteur du hasard (50 à 140 s) est mis de côté : il a son propre test. */
const minuteurHasard = timers.filter((t) => t.ms >= 50000);
timers = timers.filter((t) => t.ms < 50000);
assert.ok(minuteurHasard.length === 1 && minuteurHasard[0].ms <= 140000, "un seul minuteur de hasard, de 50 à 140 s");
const vider = () => { let g = 0; while (timers.length && g++ < 200) { const t = timers.shift(); if (t.ms >= 50000) continue; t.f(); } };
const place = (n) => { etatJeu.basicTraining.skills[0].allocation = n; };
const eteints = () => bandeaux.map((b) => b.classList.contains(L.classe));

// 1. Énergie totale lue dans l'état du jeu.
place(0); assert.equal(L.totalEnergie(), 0);
place(2500); assert.equal(L.totalEnergie(), 2500);
etatJeu.basicTraining.skills[1].allocation = 300; assert.equal(L.totalEnergie(), 2800, "somme des compétences");
etatJeu.basicTraining.skills[1].allocation = 0;

// 2. Ouverture avec de l'énergie déjà placée : les bandeaux naissent allumés, sans animation ni son.
place(2500);
let avant = noeuds;
L.veiller();
vider();
assert.deepEqual(eteints(), [false, false], "énergie placée à l'ouverture : allumés");
assert.equal(noeuds, avant, "aucun son à l'ouverture");

// 3. Plus aucune énergie : lumières éteintes, sans bruit ; une page redessinée (nouveaux bandeaux) retrouve l'état éteint.
place(0);
avant = noeuds;
L.veiller();
assert.deepEqual(eteints(), [true, true], "aucune énergie : lumières éteintes");
bandeaux = [fauxBandeau(), fauxBandeau()];
L.veiller();
assert.deepEqual(eteints(), [true, true], "page redessinée : toujours éteintes");
assert.equal(noeuds, avant, "éteindre ne fait aucun bruit");

// 4. De l'énergie sur une machine totalement vide : le néon s'allume, avec son, une seule fois.
place(125);
avant = noeuds;
L.veiller();
const sonAllumage = noeuds - avant;
assert.ok(sonAllumage >= 40, "le néon qui s'allume fait un vrai son (hésitations, décharge, ping, ballast) : " + sonAllumage);
let vuAllume = false, vuNoir = false, vuEclat = false;
let garde = 0;
while (timers.length && garde++ < 100) {
  const t = timers.shift(); t.f();
  if (bandeaux[0].classList.contains(L.classeEclat)) vuEclat = true;
  if (bandeaux[0].classList.contains(L.classe)) vuNoir = true; else vuAllume = true;
}
assert.ok(vuNoir && vuAllume && vuEclat, "l'allumage hésite (noir / lumière) puis prend avec un éclat");
assert.deepEqual(eteints(), [false, false], "allumés à la fin");
assert.ok(!bandeaux[0].classList.contains(L.classeEclat), "l'éclat retombe");
avant = noeuds;
L.veiller(); L.veiller(); place(250); L.veiller(); vider();
assert.equal(noeuds, avant, "plus de son tant qu'on n'a pas tout retiré");
assert.deepEqual(eteints(), [false, false]);

// 5. Tout retirer puis remettre : le néon s'allume de nouveau, avec son.
place(0); L.veiller();
assert.deepEqual(eteints(), [true, true]);
avant = noeuds;
place(10); L.veiller(); vider();
assert.ok(noeuds - avant >= 40, "tout retiré puis remis : le son du néon revient");
assert.deepEqual(eteints(), [false, false]);

// 5b. Machine déjà en marche, une AUTRE barre reçoit de l'énergie pour la première fois (Norman, 2026-10-07) : un ou deux vacillements au hasard et un bruit de démarrage.
//     La toute première barre, elle, allume la machine (cas 4) : pas de démarrage en plus.
{
  place(40); L.veiller(); vider();
  const avantBarre = noeuds;
  etatJeu.basicTraining.skills[1].allocation = 30;
  L.veiller();
  assert.ok(noeuds - avantBarre >= 8, "une nouvelle barre alimentée : un bruit de machine qui démarre");
  /* la première coupure est immédiate : on la relève avant de dérouler les minuteries */
  let vuCoupure = bandeaux.some((b) => b.classList.contains(L.classe)), g2 = 0;
  while (timers.length && g2++ < 100) {
    const t = timers.shift(); t.f();
    if (bandeaux.some((b) => b.classList.contains(L.classe))) vuCoupure = true;
  }
  assert.ok(vuCoupure, "un vacillement (coupure) accompagne le démarrage");
  assert.deepEqual(eteints(), [false, false], "les lumières reviennent");
  const apres = noeuds;
  L.veiller(); vider();
  assert.equal(noeuds, apres, "pas de nouveau démarrage tant qu'aucune autre barre n'est remplie");
  etatJeu.basicTraining.skills[1].allocation = 0;
  L.veiller();
  for (let i = 1; i <= 6; i++) {
    const avantType = noeuds;
    assert.equal(L.sonner("demarrage" + i), true, "démarrage " + i + " jouable");
    assert.ok(noeuds - avantType >= 6, "démarrage " + i + " construit un vrai son");
  }
  assert.equal(L.sonner("demarrage7"), false, "type inconnu refusé");
}

// 6. Mouvement réduit : seulement l'état, sans clignotement ni son.
mouvementReduit = true;
place(0); L.veiller();
assert.deepEqual(eteints(), [true, true]);
avant = noeuds;
place(10); L.veiller(); vider();
assert.deepEqual(eteints(), [false, false], "mouvement réduit : allumé tout de suite");
assert.equal(noeuds, avant, "mouvement réduit : aucun son");
mouvementReduit = false;

// 7. Vacillement : un ou deux coups, jamais plus ; le second très rapproché du premier ; toujours allumé à la fin.
const nbCoups = new Set();
for (let essai = 0; essai < 300; essai++) {
  const m = L.motif();
  const coups = m.filter((e) => e[0]).length;
  nbCoups.add(coups);
  assert.ok(coups === 1 || coups === 2, "un ou deux coups : " + coups);
  assert.equal(m[m.length - 1][0], false, "finit allumé");
  for (let i = 1; i < m.length; i++) assert.notEqual(m[i][0], m[i - 1][0], "alterne");
  if (coups === 2) {
    const debut2 = m[0][1] + m[1][1];
    assert.ok(debut2 > 100 && debut2 < 160, "le second coup arrive très vite : " + Math.round(debut2) + " ms après le premier");
    assert.ok(m[0][1] < 115, "…avant la fin du premier « tzzzzt » (0,17 s) qu'il coupe");
  }
}
assert.deepEqual([...nbCoups].sort(), [1, 2], "parfois une fois, parfois deux");
place(500);
const el = bandeaux[0];
timers = [];
assert.equal(L.vaciller(el, () => 0.5), true);
assert.equal(el.classList.contains(L.classe), true, "s'éteint tout de suite");
vider();
assert.equal(el.classList.contains(L.classe), false, "revient allumé");
mouvementReduit = true;
assert.equal(L.vaciller(el), false, "mouvement réduit : pas de vacillement");
mouvementReduit = false;

// 8. Sons : « tzzzzt » court et un second qui coupe le premier ; volume 0 : rien.
const contextesAvant = contextes;
volume = 0;
assert.equal(L.sonner("eteint"), false);
assert.equal(L.sonner("allume"), false);
assert.equal(contextes, contextesAvant, "volume 0 : aucun contexte audio de plus");
volume = 0.75;
const a = noeuds; assert.equal(L.sonner("eteint"), true); const nEteint = noeuds - a;
assert.ok(nEteint >= 12 && nEteint <= 30, "« tzzzzt » : claquement d'arc, souffle, ballast : " + nEteint);
const b = noeuds; assert.equal(L.sonner("allume"), true); assert.ok(noeuds - b > nEteint, "le néon qui s'allume est plus riche que le « tzzzzt »");
assert.equal(L.sonner("inconnu"), false);
assert.equal(L.sonner("eteint"), true, "un second coup tout de suite après le premier");
assert.ok(src.indexOf("couperVoix_(c);") > 0 && src.indexOf("couperVoix_(c);") < src.indexOf("voixCourante=maitre;"), "le second coup coupe le premier : une seule voix à la fois");

// 9. Rareté, douceur, branchements.
assert.ok(src.includes("50000+Math.random()*90000"), "rare : un vacillement toutes les 50 à 140 s, pour un seul bandeau");
assert.ok(src.includes("totalEnergie()>0"), "le hasard ne joue que si de l'énergie est placée");
assert.ok(src.includes("presents[Math.floor(Math.random()*presents.length)]"), "un bandeau tiré au sort : en haut (attaque) ou en bas (défense)");
assert.ok(src.includes(".soreal-idle-bt-panel-v120.attack .soreal-idle-bt-panel-head-v120") && src.includes(".soreal-idle-bt-panel-v120.defense .soreal-idle-bt-panel-head-v120"), "bandeaux d'attaque et de défense");
assert.ok(src.includes("var GAIN_MAITRE=0.8;") && src.includes("var DUREE")===false || src.includes("o.souffle(0,0.17,2400,1500,0.17)"), "« tzzzzt » : 0,17 s, souffle doux à 0,17");
assert.ok(!src.includes("highpass"), "aucun filtre passe-haut : les aigus agressifs sont bannis");
assert.ok(src.includes("prefers-reduced-motion"), "respecte la préférence de mouvement réduit");
assert.ok(css.includes(".soreal-idle-bt-panel-head-v120.lumiere-eteinte{") && css.includes("brightness(.2)"), "état éteint : bandeau assombri");
assert.ok(css.includes("lumiere-eclat") && css.includes("eclatNeonV1"), "éclat du néon qui prend");
assert.ok(/\/modules\/bt-lumieres-v1\.js\?v=\d+/.test(index), "module chargé par la page");

// 10. Basic Training : + et − font un clic de clavier ; la file n'est retenue que 150 ms (on peut enchaîner les clics).
for (const [fonction, grave] of [["btPlus_", "false"], ["btMoins_", "true"]]) {
  const debut = audio.indexOf("function " + fonction + "(){");
  assert.ok(debut > 0, fonction + " existe");
  const corps = audio.slice(debut, audio.indexOf("}", audio.indexOf("}", debut) + 1) + 1);
  assert.ok(corps.includes("jouerWebAudio_(150,function(c){clavierClic_(c," + grave + ");})"), fonction + " joue un clic de clavier");
}
const clavier = audio.slice(audio.indexOf("function clavierClic_"), audio.indexOf("function btPlus_"));
assert.ok(clavier.includes("bruit_") && clavier.includes("tonal_") && clavier.includes("var relache="), "enfoncement (claquement, craquement, thock, tintement) puis relâchement");
assert.ok(clavier.includes("Math.random()*0.12"), "légère variation de hauteur à chaque appel");
assert.ok(!audio.includes("function machineDemarre_") && !audio.includes("function moteurSon_"), "plus de bruit de machine");
assert.ok(audio.includes("clavierClic:{duree:200") && audio.includes("clavierClicGrave:{duree:200"), "constructeurs exposés pour les vérifications hors ligne");

console.log("idle-bt-lumieres-v1: OK");
