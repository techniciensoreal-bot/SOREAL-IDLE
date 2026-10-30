#!/usr/bin/env node
/*
 * Blocs de voix (texte exact lu + empreinte) calcules avec le VRAI module de narration (modules/tutorial-tts-v202.js) charge dans un contexte
 * Node sans navigateur : meme composerChronique, meme planNarration (decoupage 600 caracteres, pauses), meme hashBloc (cyrb53 + etiquette cb1)
 * que le jeu. Utilise par voix-en-jeu-v1.py (inventaire et generation des voix ANGLAISES, Norman 2026-10-30).
 *
 *   node voix-en-blocs-v1.mjs <entree.json> <sortie.json>
 * entree : [{ "cat": "chronique", "id": 12, "nom": "Boss name", "histoire": "texte" }, { "cat": "texte", "id": "x", "texte": "..." }]
 * sortie : [{ cat, id, blocs: [{ hash, texte, voix, expr }] }]  (les pauses sont omises : ce ne sont pas des fichiers)
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ICI, "..", "public", "modules", "tutorial-tts-v202.js");

function contexte() {
  const bidon = () => new Proxy(function () {}, { get: (_t, k) => (k === Symbol.toPrimitive ? () => "" : k === "length" ? 0 : bidon()), apply: () => bidon(), construct: () => bidon(), set: () => true });
  const doc = { readyState: "loading", addEventListener() {}, removeEventListener() {}, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, createElement: bidon, body: bidon(), head: bidon(), documentElement: bidon() };
  const win = { addEventListener() {}, removeEventListener() {}, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, location: { href: "http://localhost/", search: "" }, navigator: { userAgent: "node" } };
  win.window = win; win.document = doc; win.self = win;
  const ctx = vm.createContext(Object.assign(win, { document: doc, localStorage: win.localStorage, console, setTimeout: win.setTimeout, clearTimeout() {}, setInterval: win.setInterval, clearInterval() {}, navigator: win.navigator, location: win.location }));
  vm.runInContext(fs.readFileSync(SRC, "utf8"), ctx, { filename: "tutorial-tts-v202.js" });
  return ctx.window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
}

const [entree, sortie] = process.argv.slice(2);
if (!entree || !sortie) { console.error("usage : node voix-en-blocs-v1.mjs entree.json sortie.json"); process.exit(2); }
const tts = contexte();
if (!tts || typeof tts.planNarration !== "function") { console.error("module de narration non charge"); process.exit(3); }
const sorties = JSON.parse(fs.readFileSync(entree, "utf8")).map((e) => {
  const t = e.cat === "chronique" ? tts.composerChronique(e.nom, e.histoire) : String(e.texte || "");
  const blocs = [];
  for (const etape of tts.planNarration(t)) {
    if (etape.chunk == null) continue;
    blocs.push({ hash: tts.hashBloc(etape.chunk), texte: etape.chunk, voix: etape.voix || "", expr: etape.expr || "" });
  }
  return { cat: e.cat, id: e.id, blocs };
});
fs.writeFileSync(sortie, JSON.stringify(sorties), "utf8");
console.log(sorties.length + " entrees, " + sorties.reduce((n, s) => n + s.blocs.length, 0) + " blocs");
