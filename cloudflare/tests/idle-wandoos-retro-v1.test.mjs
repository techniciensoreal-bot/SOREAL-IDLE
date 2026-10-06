import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Page Wandoos « ordinateur rétro » (Norman, 2026-10-06) : écran de l'image idle/banners/wandoos.webp, texte vert avec un bouton vert/bleu/orange/blanc,
 * barres à l'ancienne, touches de clavier (+, −, MAX…) cliquables avec le son d'un clavier.
 */
const src = readFileSync("cloudflare/public/modules/wandoos-retro-v1.js", "utf8");
const stockage = {};
const noeuds = [];
const ecouteurs = {};
let contextesCrees = 0;
const fauxContexte = () => ({
  state: "running", sampleRate: 8000, currentTime: 0, destination: {},
  createBuffer: (c, n) => ({ getChannelData: () => new Float32Array(n) }),
  createBufferSource: () => { const n = { type: "src", connect() {}, start() {} }; noeuds.push(n); return n; },
  createBiquadFilter: () => { const n = { type: "", frequency: {}, Q: {}, connect() {} }; noeuds.push(n); return n; },
  createGain: () => { const n = { gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; noeuds.push(n); return n; },
  createOscillator: () => { const n = { frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; noeuds.push(n); return n; },
  resume() {}
});
let volume = 0.75;
const poste = { dataset: {}, setAttribute(k, v) { poste.dataset[k.replace("data-", "")] = v; } };
const nomCouleur = { textContent: "" };
const fenetre = {
  localStorage: { getItem: (k) => (k in stockage ? stockage[k] : null), setItem: (k, v) => { stockage[k] = String(v); } },
  AudioContext: function () { contextesCrees += 1; return fauxContexte(); },
  __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getInterface: () => volume },
  __SOREAL_IDLE_META_HOST_V130__: {
    idleHtml_: (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
    formatGrandNombreIdleV70_: (v) => String(Math.floor(Number(v) || 0)),
    entetePageIdleV28_: (t) => "<h1>" + t + "</h1>"
  },
  __SOREAL_IDLE_META_V130__: { systemeMetaParIdIdleV130_: (j, id) => j.systems.find((x) => x.id === id) || null }
};
fenetre.window = fenetre;
fenetre.localStorage = fenetre.localStorage;
fenetre.document = {
  getElementById: () => null, head: { appendChild() {} }, createElement: () => ({}),
  querySelector: (sel) => (sel === ".wd-poste" ? poste : sel === ".wd-nomcouleur" ? nomCouleur : null),
  addEventListener: (nom, fn) => { (ecouteurs[nom] = ecouteurs[nom] || []).push(fn); }
};
vm.runInNewContext(src, Object.assign(fenetre, { localStorage: fenetre.localStorage }), { filename: "wandoos-retro-v1.js" });
const W = fenetre.__SOREAL_IDLE_WANDOOS_V1__;
assert.ok(W && typeof W.page === "function", "module exposé");

const joueur = (debloque, actif = true) => ({ systems: [{ id: "wandoos", name: "Wandoos", icon: "💻", unlock: { unlocked: debloque }, state: { active: actif, level: 1234, allocation: { energy: 60, magic: 25 }, data: { os: "98", dumpEnergyLevel: 812, dumpMagicLevel: 422, dumpEnergyProgress: 0.63, dumpMagicProgress: 0.18 } } }] });

// Anti-spoil : rien tant que le système n'est pas découvert.
assert.equal(W.page(joueur(false)), "", "système verrouillé : aucune page");

// Page : écran avec barres, touches de clavier, bouton de couleur.
const h = W.page(joueur(true));
assert.ok(h.includes("wd-ecran") && h.includes("wd-crt") && h.includes("wd-clavier"), "écran et clavier");
assert.equal((h.match(/class="wd-barre"/g) || []).length, 4, "4 barres : progression et allocation, énergie et magie");
assert.ok(h.includes("NIV <b>812</b>") && h.includes("NIV <b>422</b>"), "niveaux des deux Dumps");
assert.ok(h.includes("63%") && h.includes("60%") && h.includes("25%"), "pourcentages");
for (const [res, delta] of [["energy", -100], ["energy", -10], ["energy", 10], ["energy", 100], ["magic", -100], ["magic", -10], ["magic", 10], ["magic", 100]]) {
  assert.ok(h.includes("__ajusterAllocationMetaIdleV130__('wandoos','" + res + "'," + delta + ")"), "touche " + res + " " + delta);
}
assert.ok(h.includes("__toggleSystemeMetaIdleV130__('wandoos')") && h.includes("DÉSACTIVER"), "touche espace : désactiver quand actif");
assert.ok(W.page(joueur(true, false)).includes("ACTIVER") && !W.page(joueur(true, false)).includes("DÉSACTIVER"), "touche espace : activer quand arrêté");
assert.ok(h.includes('data-couleur="vert"'), "vert par défaut");
assert.ok(!/<script|onerror=|javascript:/i.test(h), "rien d'exécutable dans les données");

// Couleurs : vert -> bleu -> orange -> blanc -> vert, mémorisées.
assert.deepEqual(Array.from(W.couleurs), ["vert", "bleu", "orange", "blanc"]);
const vues = [];
for (let i = 0; i < 4; i++) { W.couleur(); vues.push(poste.dataset.couleur); }
assert.deepEqual(vues, ["bleu", "orange", "blanc", "vert"]);
W.couleur();
assert.equal(stockage.soreal_idle_wandoos_couleur_v1, "bleu", "couleur mémorisée");
assert.ok(W.page(joueur(true)).includes('data-couleur="bleu"'), "la page se redessine dans la couleur choisie");
assert.equal(nomCouleur.textContent, "BLEU");

// Son : un clic de clavier au volume des sons de l'interface ; rien à volume 0.
volume = 0;
assert.equal(W.son(false, false), false, "volume à 0 : pas de son");
assert.equal(contextesCrees, 0, "volume à 0 : même pas de contexte audio");
volume = 0.75;
const avant = noeuds.length;
assert.equal(W.son(false, false), true, "volume normal : la touche claque");
assert.ok(noeuds.length - avant >= 5, "claquement + « thock » construits");
const apres = noeuds.length;
assert.equal(W.son(true, true), true, "relâchement");
assert.ok(noeuds.length - apres >= 4 && noeuds.length - apres < 8, "le relâchement est plus bref (sans « thock »)");
assert.ok(ecouteurs.pointerdown && ecouteurs.pointerup, "le son s'attache à l'appui et au relâchement des touches");

// Branchements.
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(/\/modules\/wandoos-retro-v1\.js\?v=\d+/.test(index), "module chargé par la page");
assert.ok(index.indexOf("wandoos-retro-v1.js") > index.indexOf("meta-progression-v130.js"), "chargé après la page générique");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
assert.ok(meta.includes("id==='wandoos'&&window.__SOREAL_IDLE_WANDOOS_V1__"), "la page générique délègue à la page rétro");
assert.ok(src.includes("/api/idle/media/banner?name=wandoos.webp"), "l'écran est celui de idle/banners/wandoos.webp");
assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon/.test(src), "rien n'est envoyé");

console.log("idle-wandoos-retro-v1: OK");
