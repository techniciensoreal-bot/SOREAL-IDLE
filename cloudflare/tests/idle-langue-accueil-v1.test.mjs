// Norman (2026-10-30) : « au moment de mettre son surnom au lancement du jeu, je veux qu'on puisse choisir sa langue aussi, et l'intro devra se lancer en anglais s'il a choisi l'anglais. »
// L'écran de pseudo porte deux gros boutons Français / English (même clé et même mécanisme que les Réglages) ; l'intro lit la langue choisie : textes anglais originaux, voix française coupée, voix anglaise par image (section 4).
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const popups = fs.readFileSync("cloudflare/public/modules/ui-popups-v1.js", "utf8");
const intro = fs.readFileSync("cloudflare/public/modules/intro-diaporama-v1.js", "utf8");
const reglages = fs.readFileSync("cloudflare/public/modules/ui-reglages-v1.js", "utf8");
const amorcage = fs.readFileSync("cloudflare/public/modules/ui-amorcage-v1.js", "utf8");

// --- 1. code : boutons, clé, mécanisme des Réglages, aucun texte verrouillé
const debut = popups.indexOf("function afficherAccueilPseudoIdleV1_(j){");
const fin = popups.indexOf("/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-128 */", debut);
assert.ok(debut > 0 && fin > debut, "fonction de l'écran de pseudo trouvée");
const fonction = popups.slice(debut, fin);
assert.ok(fonction.includes('data-langue="fr"') && fonction.includes('data-langue="en"') && fonction.includes("<span>Français</span>") && fonction.includes("<span>English</span>"), "deux boutons Français / English");
assert.ok(fonction.includes("<svg") && !/[\u{1F300}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}]/u.test(fonction), "drapeaux dessinés en SVG, aucun émoji");
assert.ok(fonction.includes("window.__changerLangueIdleV1__(code)") && fonction.includes("soreal_idle_langue_v1"), "même mécanisme et même clé que les Réglages");
assert.ok(fonction.includes("data-sans-traduction"), "les noms des langues ne sont jamais traduits");
assert.ok(fonction.indexOf("ac-langues") < fonction.indexOf("Bienvenue"), "choix de langue au-dessus du texte d'accueil");
assert.ok(fonction.includes("navigator.language") && fonction.includes("/^en/i"), "défaut : langue du navigateur si elle commence par « en »");
assert.ok(/aria-pressed/.test(fonction), "le choix en cours est mis en évidence");
assert.ok(reglages.includes("window.__changerLangueIdleV1__(") && amorcage.includes("window.__changerLangueIdleV1__=function(langue)"), "le mécanisme des Réglages existe toujours");
// anti-spoil : le texte des boutons ne contient que des noms de langue
const libelles = [...fonction.matchAll(/<span>([^<]*)<\/span>/g)].map((m) => m[1]);
assert.deepEqual(libelles, ["Français", "English"], "rien d'autre que les noms de langue (règle n°2)");

// --- 2. l'écran sur un faux navigateur
function faux(stock, navigatorLang) {
  const ecouteurs = [];
  const boutons = ["fr", "en"].map((code) => {
    const attrs = { "data-langue": code, "aria-pressed": "false" };
    return { getAttribute: (k) => attrs[k], setAttribute: (k, v) => { attrs[k] = v; }, addEventListener: (t, f) => ecouteurs.push([code, t, f]), attrs };
  });
  const noeud = { querySelectorAll: (sel) => (sel === ".ac-lang" ? boutons : []), querySelector: () => ({ addEventListener() {}, focus() {}, select() {}, value: "", textContent: "" }), setAttribute() {}, set innerHTML(v) { noeud.html = v; } };
  const document = { getElementById: () => null, createElement: () => ({ style: {}, set textContent(v) {} }), head: { appendChild() {} }, body: { appendChild() {} } };
  document.createElement = (tag) => (tag === "div" ? noeud : { set textContent(v) {} });
  const appels = [];
  const fenetre = {
    __changerLangueIdleV1__: (c) => { appels.push(c); stock.soreal_idle_langue_v1 = c; },
  };
  const ctx = {
    document, window: fenetre, navigator: { language: navigatorLang }, setTimeout: () => 0, google: { script: { run: {} } }, SOREAL_SESSION: "s", REG: {},
    localStorage: { getItem: (k) => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); } },
    idleHtml_: (s) => String(s), accueilMarquerIdleV1_() {},
  };
  vm.runInNewContext(fonction + "\nafficherAccueilPseudoIdleV1_({identite:{pseudo:''}});", ctx);
  return { boutons, ecouteurs, appels, stock, noeud };
}
// langue enregistrée = anglais : le bouton English est mis en évidence, aucun changement forcé
let e = faux({ soreal_idle_langue_v1: "en" }, "fr-FR");
assert.equal(e.boutons[1].attrs["aria-pressed"], "true");
assert.equal(e.boutons[0].attrs["aria-pressed"], "false");
assert.deepEqual(e.appels, []);
// rien d'enregistré, navigateur anglais : l'anglais est appliqué tout de suite par le mécanisme des Réglages
e = faux({}, "en-GB");
assert.deepEqual(e.appels, ["en"]);
assert.equal(e.stock.soreal_idle_langue_v1, "en");
assert.equal(e.boutons[1].attrs["aria-pressed"], "true");
// rien d'enregistré, navigateur français : français, rien n'est écrit
e = faux({}, "fr-FR");
assert.deepEqual(e.appels, []);
assert.equal(e.boutons[0].attrs["aria-pressed"], "true");
// un appui sur English écrit la bonne clé via le mécanisme existant ; un appui sur Français revient
e.ecouteurs.find(([c, t]) => c === "en" && t === "click")[2]();
assert.deepEqual(e.appels, ["en"]);
assert.equal(e.stock.soreal_idle_langue_v1, "en");
assert.equal(e.boutons[1].attrs["aria-pressed"], "true");
e.ecouteurs.find(([c, t]) => c === "fr" && t === "click")[2]();
assert.equal(e.stock.soreal_idle_langue_v1, "fr");
assert.equal(e.boutons[0].attrs["aria-pressed"], "true");
// sans __changerLangueIdleV1__ (repli) : clé écrite et module de traduction prévenu
{
  const stock = {}; const prevenu = [];
  const noeud = { querySelectorAll: () => [], querySelector: () => ({ addEventListener() {}, focus() {}, select() {} }), setAttribute() {}, set innerHTML(v) {} };
  const bouton = (c) => ({ getAttribute: () => c, setAttribute() {}, addEventListener: (t, f) => { if (t === "click") bouton.f = f; } });
  noeud.querySelectorAll = () => [bouton("en")];
  const ctx = {
    document: { getElementById: () => null, createElement: (t) => (t === "div" ? noeud : { set textContent(v) {} }), head: { appendChild() {} }, body: { appendChild() {} } },
    window: { __SOREAL_IDLE_LANGUE_CHANGEE_V1__: (c) => prevenu.push(c) }, navigator: { language: "fr" }, setTimeout: () => 0, google: {}, SOREAL_SESSION: "s", REG: {},
    localStorage: { getItem: (k) => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); } }, idleHtml_: (s) => String(s), accueilMarquerIdleV1_() {},
  };
  vm.runInNewContext(fonction + "\nafficherAccueilPseudoIdleV1_({identite:{}});", ctx);
  bouton.f();
  assert.equal(stock.soreal_idle_langue_v1, "en");
  assert.deepEqual(prevenu, ["en"]);
}

// --- 3. l'intro lit la langue choisie
assert.ok(intro.includes("function langueEn()") && intro.includes("soreal_idle_langue_v1"), "l'intro lit la même clé");
assert.ok(intro.includes("function voixEtapes(){return modeEtape&&!langueEn();}"), "voix par image coupée en anglais");
assert.ok(!/if\(modeEtape\)lancerEtape|if\(modeEtape\)return;\n  if\(indice/.test(intro), "plus de lancement de voix sans passer par la langue");

const dict = JSON.parse(fs.readFileSync("cloudflare/public/modules/traduction-anglais-dict-v1.json", "utf8"));
const phrases = [...intro.matchAll(/\{n:'(\d\d)',t:'((?:[^'\\]|\\.)*)'\}/g)].map((m) => m[2].replace(/\\'/g, "'"));
assert.equal(phrases.length, 16);
for (const p of phrases) assert.ok(dict[p], "phrase de l'intro au dictionnaire : " + p.slice(0, 40));
for (const t of ["Clique sur le bouton pour jouer", "JOUER", "Le commencement"]) assert.ok(dict[t], "texte de l'intro au dictionnaire : " + t);

function lancerIntro(langue) {
  const stock = langue ? { soreal_idle_langue_v1: langue } : {};
  const el = () => ({ style: {}, setAttribute() {}, appendChild() {}, addEventListener() {}, classList: { add() {}, remove() {}, toggle() {} }, querySelector: () => null, querySelectorAll: () => [] });
  const document = { getElementById: () => null, createElement: el, head: { appendChild() {} }, documentElement: el(), body: el(), addEventListener() {}, querySelector: () => null };
  const fenetre = { matchMedia: () => ({ matches: false }), addEventListener() {}, __SOREAL_IDLE_TRADUCTION_ANGLAIS_V1__: { actif: () => langue === "en", traduire: (s) => dict[s] ?? s } };
  vm.runInNewContext(intro, { window: fenetre, document, setTimeout: () => 0, setInterval: () => 0, clearTimeout() {}, clearInterval() {}, Date, Math, String, Array, Object, console, localStorage: { getItem: (k) => (k in stock ? stock[k] : null), setItem() {} } });
  return fenetre.__SOREAL_IDLE_INTRO_DIAPORAMA_V1__;
}
const enFr = lancerIntro("fr").html({ titre: "Le commencement" }, "Texte lu");
const enEn = lancerIntro("en").html({ titre: "Le commencement" }, "Texte lu");
assert.ok(enFr.includes('data-soreal-tts-say="Texte lu"') && !enFr.includes("data-soreal-tts-ignore data-soreal-tts-ignore"), "français : la voix de la page lit le texte");
assert.ok(enEn.includes('data-soreal-tts-say=""') && enEn.includes('" data-soreal-tts-ignore>'), "anglais : aucune voix française sur l'intro");
assert.equal(lancerIntro("en").texteHtml(phrases[1]), "When you come to,", "texte anglais affiché");

// --- 4. voix anglaise de l'intro (Norman, 2026-10-30) : texte ORIGINAL du jeu (design/intro-original-en.json), 16 voix statiques /voice-en/intro-NN.m4a
const original = JSON.parse(fs.readFileSync("design/intro-original-en.json", "utf8"));
assert.ok(original.source && original.images.length === 16 && original.bouton === "PLAY", "source citée, 16 images, bouton PLAY");
const copie = JSON.parse(fs.readFileSync("cloudflare/public/voice-en/intro-original-en.json", "utf8"));
assert.deepEqual(copie, original, "la copie publique égale la source");
const manifeste = JSON.parse(fs.readFileSync("cloudflare/public/voice-en/manifest.json", "utf8"));
original.images.forEach((im, i) => {
  assert.equal(im.n, String(i + 1).padStart(2, "0"));
  const fichier = `cloudflare/public/voice-en/intro-${im.n}.m4a`;
  assert.ok(fs.existsSync(fichier) && fs.statSync(fichier).size > 2000, "voix non vide : " + fichier);
  assert.equal(manifeste[im.n].texte, im.texte, "manifeste = texte original : " + im.n);
  assert.ok(manifeste[im.n].duree > 0.5 && manifeste[im.n].duree < 60, "durée plausible : " + im.n);
});
assert.ok(intro.includes("DIR_EN+'intro-'+DIAPOS[i].n+'.m4a'") && intro.includes("'/voice-en/'"), "l'intro anglaise lit /voice-en/intro-NN.m4a");
assert.ok(intro.includes("function voixEn(){return langueEn()&&Boolean(original);}"), "pas de voix tant que le texte original n'est pas chargé");
assert.ok(/a\.onerror=function\(\)\{[^}]*repli\(\)/.test(intro) && intro.includes("setTimeout(suivante,plancher)"), "repli minuterie si fichier absent");
assert.ok(intro.includes("NotAllowedError") && intro.includes("attenteSon=true"), "attente d'un geste si le son est bloqué");
assert.ok(intro.includes("AV.getVoix()") && intro.includes("T.enabled()"), "volume et son coupé du joueur respectés");
assert.ok(!/DIR_EN[^;]*chronique/.test(intro) && /\n  r\.setAttribute\('data-soreal-tts-say',d\.say\);/.test(intro) && !/if\(!langueEn\(\)\)r\.setAttribute\('data-soreal-tts-say',d\.say\)/.test(intro), "chronique du boss 1 : plus de coupure en anglais (voix anglaise du lecteur)");
assert.ok(intro.includes("data-soreal-tts-sans-traduction"), "l'histoire anglaise du boss 1 n'est pas retraduite par le lecteur");
assert.ok(!/langueEn\(\)&&t&&typeof t\.enabled/.test(intro) && !/!langueEn\(\)&&t&&typeof t\.enabled/.test(intro), "la lecture de la chronique n'est plus coupée en anglais");
// scénario : intro anglaise sur un faux navigateur, original chargé, voix jouée puis image suivante, repli si erreur
{
  const stock = { soreal_idle_langue_v1: "en" };
  const jouees = []; const minuteries = []; let audio;
  const classes = () => ({ add() {}, remove() {}, toggle() {} });
  const el = () => ({ style: {}, setAttribute() {}, getAttribute: () => null, appendChild() {}, addEventListener() {}, classList: classes(), querySelector: () => el(), querySelectorAll: () => [el(), el()], removeAttribute() {}, focus() {} });
  const racine = el(); racine.isConnected = true;
  const document = { getElementById: (id) => (id === "sorealIdleIntroDiapoV1" ? racine : null), createElement: el, head: { appendChild() {} }, documentElement: el(), body: el(), addEventListener() {}, querySelector: () => null };
  class FauxAudio { constructor(u) { this.src = u; audio = this; jouees.push(u); } play() { return Promise.resolve(); } pause() {} load() {} removeAttribute() {} }
  const fenetre = { matchMedia: () => ({ matches: false }), addEventListener() {}, Audio: FauxAudio, __SOREAL_IDLE_TUTORIAL_TTS_V209__: { enabled: () => true }, __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getVoix: () => 0.5 }, __SOREAL_IDLE_TRADUCTION_ANGLAIS_V1__: { actif: () => true, traduire: (x) => x } };
  const ctx = { Image: class {}, window: fenetre, document, setTimeout: (f, ms) => { minuteries.push([f, ms]); return minuteries.length; }, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, Date, Math, String, Array, Object, Promise, console,
    fetch: async (u) => ({ ok: true, json: async () => JSON.parse(fs.readFileSync("cloudflare/public" + u, "utf8")) }), localStorage: { getItem: (k) => (k in stock ? stock[k] : null), setItem() {} } };
  vm.runInNewContext(intro, ctx);
  await new Promise((r) => setImmediate(r)); await new Promise((r) => setImmediate(r));
  const api = fenetre.__SOREAL_IDLE_INTRO_DIAPORAMA_V1__;
  assert.equal(api.texteHtml(phrases[1]), "As you come to,", "texte ORIGINAL affiché en anglais");
  assert.ok(api.texteHtml(phrases[13]).includes("<em>something</em>"), "mise en relief du n°14");
  assert.ok(api.texteHtml(phrases[0]).includes("WHOOMPH"), "ouverture *WHOOMPH*");
  assert.ok(api.html({ titre: "Le commencement" }, "x").includes("THE BEGINNING"), "titre original");
  api.demarrer();
  assert.equal(jouees[0], "/voice-en/intro-01.m4a", "la voix de la 1re image part");
  assert.equal(audio.volume, 0.5, "volume du joueur");
  audio.onended();
  const suivante = minuteries[minuteries.length - 1][0]; suivante();
  assert.equal(jouees[1], "/voice-en/intro-02.m4a", "fin de voix : voix de l'image suivante");
  const avant = minuteries.length; audio.onerror();
  assert.ok(minuteries.length > avant, "fichier absent : minuterie texte seul");
}

console.log("idle-langue-accueil-v1 : OK");
