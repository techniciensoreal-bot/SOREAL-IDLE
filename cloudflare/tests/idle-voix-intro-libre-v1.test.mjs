import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

/*
 * « Chroniques de boss. » (introduction lue avant la première chronique par « Lire toute l'histoire des boss débloqués », dans le MÊME texte que la chronique) était lue avec la voix de secours alors que son fichier existe :
 * la chronique enregistrée rendait le texte « enregistré » et l'introduction, sans liste déclarée, était interdite (règle stricte). Les textes « libres » ajoutés par le jeu ne sont jamais interdits.
 */
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const rien = () => {};
const win = { location: { href: "http://localhost/" }, localStorage: { getItem() { return null; }, setItem() {} }, navigator: { userAgent: "node" } };
const doc = new Proxy({}, { get: (_t, k) => (k === "readyState" ? "loading" : rien) });
win.document = doc;
const ctx = vm.createContext({ window: win, document: doc, navigator: win.navigator, localStorage: win.localStorage, location: win.location, console, setTimeout: rien, setInterval: rien, addEventListener: rien,
  fetch: () => Promise.resolve({ ok: false, status: 404 }) });
const modules = path.join(R, "cloudflare", "public", "modules");
for (const m of ["voix-nommees-v1.js", "voix-expressions-v1.js", "tutorial-tts-v202.js"]) vm.runInContext(fs.readFileSync(path.join(modules, m), "utf8"), ctx);
const t = win.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
assert.equal(typeof t.declarerTexteLibre, "function");

const intro = "Chroniques de boss.";
const M = (ms) => " " + ms + " ";
const chronique = t.composerChronique("Boss", "Une chronique enregistrée, validée par Norman.", true);
const texte = intro + M(1500) + chronique;
const blocs = (x) => t.planNarration(x).filter((e) => e.chunk != null).map((e) => t.hashBloc(e.chunk));
const hIntro = t.hashBloc(t.planNarration(intro)[0].chunk);
assert.ok(blocs(texte).includes(hIntro), "l'introduction forme un bloc identique dans le texte composé (même empreinte que la génération)");
const hChro = blocs(chronique);
t.enregistrerVoixDynamiques(hChro);   // la chronique est déclarée, pas l'introduction
assert.ok(t.blocsInterdits(t.planNarration(texte))[hIntro], "sans déclaration, l'introduction est interdite (comportement qui causait le repli)");
t.declarerTexteLibre(intro);
const interdits = t.blocsInterdits(t.planNarration(texte));
assert.ok(!interdits[hIntro], "l'introduction déclarée libre est lue depuis son fichier");
// la règle stricte reste entière pour tout le reste
const ancienne = t.composerChronique("Boss", "Ancienne variante non validée du récit.", true);
const hAnc = blocs(ancienne)[0];
const interdits2 = t.blocsInterdits(t.planNarration(texte + M(1200) + ancienne));
assert.ok(interdits2[hAnc], "une variante non déclarée d'une chronique reste interdite");
assert.ok(!interdits2[hIntro]);
// les appelants déclarent l'introduction
for (const [f, re] of [["lecteur-chroniques-v1.js", /declarerTexteLibre\(String\(intro\)\)/], ["ui-combat-2-v1.js", /declarerTexteLibre\(texteVoixSansTexteIdleV1_/]]) assert.match(fs.readFileSync(path.join(modules, f), "utf8"), re, f);
console.log("idle-voix-intro-libre-v1 : OK");
