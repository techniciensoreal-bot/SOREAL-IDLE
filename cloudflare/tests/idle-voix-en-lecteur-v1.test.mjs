// Norman (2026-10-31) : toutes les voix du jeu en anglais. Le lecteur (modules/tutorial-tts-v202.js) :
//  - en « English », sans fichier de voix pour un bloc, reste MUET (jamais Piper, voix française) ;
//  - passe les textes statiques (data-soreal-tts-say) par le traducteur anglais avant de hacher, comme l'export voix-en-statiques-console-v1.js ;
//  - demande pour la chronique du boss 1 l'empreinte du texte anglais original, la même que le fichier généré par voix-en-jeu-v1.py.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";

const src = fs.readFileSync("cloudflare/public/modules/tutorial-tts-v202.js", "utf8");

// --- 1. code : muet en anglais, jamais Piper
assert.ok(src.includes("function langueAnglaise_()") && src.includes("soreal_idle_langue_v1"), "le lecteur lit la langue du joueur");
assert.ok(/if\(langueAnglaise_\(\)\)\{voiceStats\.muets\+=1;return null;\}\s*voiceStats\.piper\+=1;\s*return requestLocalNeuralAudio_/.test(src), "anglais sans fichier : muet, avant tout appel à Piper");
assert.ok(/if\(blob\|\|langueAnglaise_\(\)\)return;\s*requestLocalNeuralAudio_/.test(src), "le préchauffage ne synthétise pas en anglais");
assert.ok(/if\(!blob\)return null;[^\n]*\n\s*return playBlobWebAudioPromise_/.test(src), "un bloc muet est sauté, la lecture continue");
const appelsPiper = src.match(/requestLocalNeuralAudio_\(/g).length;
assert.equal(appelsPiper, 3, "définition + deux appels seulement (préchauffage, lecture), tous gardés par la langue");

// --- 2. code : textes statiques traduits en anglais, chroniques jamais retraduites
assert.ok(/langueAnglaise_\(\)&&!panel\.hasAttribute\('data-soreal-chronique-boss-id'\)&&!panel\.hasAttribute\('data-soreal-tts-sans-traduction'\)/.test(src), "attribut say traduit en anglais sauf chronique de boss");
assert.ok(src.includes("__SOREAL_IDLE_TRADUCTION_ANGLAIS_V1__") && src.includes("trad.traduire(dit)"), "même traducteur que l'export des statiques");

// --- 3. le vrai module dans un contexte Node : empreinte du texte de boss 1 en anglais
function contexte(langue) {
  const bidon = () => new Proxy(function () {}, { get: (_t, k) => (k === Symbol.toPrimitive ? () => "" : k === "length" ? 0 : bidon()), apply: () => bidon(), construct: () => bidon(), set: () => true });
  const doc = { readyState: "loading", addEventListener() {}, removeEventListener() {}, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, createElement: bidon, body: bidon(), head: bidon(), documentElement: bidon() };
  const ls = { getItem: (k) => (k === "soreal_idle_langue_v1" ? langue : null), setItem() {}, removeItem() {} };
  const win = { addEventListener() {}, removeEventListener() {}, localStorage: ls, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, location: { href: "http://localhost/", search: "" }, navigator: { userAgent: "node" } };
  win.window = win; win.document = doc; win.self = win;
  const ctx = vm.createContext(Object.assign(win, { document: doc, localStorage: ls, console, setTimeout: win.setTimeout, clearTimeout() {}, setInterval: win.setInterval, clearInterval() {}, navigator: win.navigator, location: win.location }));
  vm.runInContext(src, ctx, { filename: "tutorial-tts-v202.js" });
  return ctx.window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
}
const tts = contexte("en");
assert.ok(tts && typeof tts.planNarration === "function", "module chargé");
assert.equal(typeof tts.voiceStats().muets, "number", "compteur de blocs muets");

const racine = path.resolve(".");
const histoires = JSON.parse(fs.readFileSync(path.join(racine, "design", "ngu-boss-stories-en.json"), "utf8"));
const noms = JSON.parse(fs.readFileSync(path.join(racine, "design", "ngu-boss-names-fr.json"), "utf8"));
const histoire1 = String(histoires.find((h) => Number(h.id) === 1).story).trim();
const nom1 = noms.find((b) => Number(b.id) === 1).nomEn;
assert.equal(nom1, "A Small Piece of Fluff");
assert.ok(histoire1.startsWith("You shakily get to your feet"), "histoire anglaise ORIGINALE du boss 1");

// Ce que le client demande : composerChronique(nom, histoire) puis planNarration (comme narrate_ et le générateur).
const demande = tts.planNarration(tts.composerChronique(nom1, histoire1)).filter((e) => e.chunk != null).map((e) => tts.hashBloc(e.chunk));
// Le même calcul avec la langue française ne change rien (le hachage ne dépend pas de la langue).
const demandeFr = contexte("fr");
const demandeFrHashs = demandeFr.planNarration(demandeFr.composerChronique(nom1, histoire1)).filter((e) => e.chunk != null).map((e) => demandeFr.hashBloc(e.chunk));
assert.equal(JSON.stringify(demande), JSON.stringify(demandeFrHashs), "hachage identique quelle que soit la langue");
assert.ok(demande.length >= 2, "nom + histoire = au moins deux blocs");

// Comparaison avec le fichier généré (hors dépôt : seulement si présent, sinon on garde les deux calculs du code)
const etat = path.join(os.homedir(), "soreal-voice-studio", "voix-en-jeu", "etat.json");
const final = path.join(os.homedir(), "soreal-voice-studio", "voix-en-jeu", "final");
if (fs.existsSync(etat)) {
  const blocs = Object.values(JSON.parse(fs.readFileSync(etat, "utf8"))).filter((b) => b.cat === "chroniques" && Number(b.id) === 1);
  if (blocs.length) {
    const generes = new Set(blocs.map((b) => b.hash));
    for (const h of demande) assert.ok(generes.has(h), "empreinte demandée par le client présente dans le générateur : " + h);
    assert.ok(demande.includes("170e9d2f43f7b6"), "l'histoire du boss 1 a l'empreinte 170e9d2f43f7b6");
    assert.ok(demande.includes("0549ed748c7cd3"), "le nom du boss 1 a l'empreinte 0549ed748c7cd3");
    if (fs.existsSync(final)) for (const h of demande) { const ok = blocs.find((b) => b.hash === h); if (ok && ok.statut === "ok") assert.ok(fs.existsSync(path.join(final, h + ".m4a")), "fichier final présent : " + h); }
  }
}
console.log("idle-voix-en-lecteur-v1 : OK (" + demande.join(", ") + ")");
