#!/usr/bin/env node
/*
 * Textes STATIQUES en anglais, par calcul Node avec le VRAI traducteur du jeu (modules/traduction-anglais-v1.js + traduction-anglais-dict-v1.json),
 * sans navigateur : voix-en-jeu-v1.py --categorie statiques lit le resultat (statiques-en.json).
 *
 *   node voix-en-statiques-node-v1.mjs <blocs-fr.json> <statiques-en.json>
 * blocs-fr.json : liste des blocs FRANCAIS (planNarration des textes d'explication, nouveautes et systemes), obtenue dans le jeu par la console :
 *   voir voix-en-statiques-console-v1.js (meme liste, meme ordre) ; ici on ne traduit que ce fichier, bloc par bloc comme le fait l'export console.
 * sortie : [[texte anglais, 0|1]] ; 1 = du francais reste apres traduction (a corriger dans le dictionnaire AVANT de voiser).
 * Avec --restes : affiche seulement les blocs qui gardent du francais.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const MODULE = path.join(ICI, "..", "public", "modules", "traduction-anglais-v1.js");
const DICO = path.join(ICI, "..", "public", "modules", "traduction-anglais-dict-v1.json");

export function traducteur() {
  const doc = { readyState: "complete", addEventListener() {}, body: null, title: "", querySelector: () => null };
  const win = { addEventListener() {}, localStorage: { getItem: () => "en", setItem() {} }, document: doc, console };
  win.window = win;
  const ctx = vm.createContext(Object.assign(win, { document: doc, localStorage: win.localStorage, fetch: () => new Promise(() => {}), setTimeout, clearTimeout, console, MutationObserver: function () { this.observe = () => {}; this.disconnect = () => {}; } }));
  vm.runInContext(fs.readFileSync(MODULE, "utf8"), ctx, { filename: "traduction-anglais-v1.js" });
  const api = ctx.window.__SOREAL_IDLE_TRADUCTION_ANGLAIS_V1__;
  api.charger(JSON.parse(fs.readFileSync(DICO, "utf8")));
  return api.traduire;
}

// Meme detecteur que voix-en-statiques-console-v1.js, SANS « pour » (verbe anglais legitime) ; le prenom « Sébastien » est retire avant le test (voir resteFrancais)
export const RESTE_FR = /[àâçéèêëîïôûùü]|\b(le|la|les|des|une|un|tu|ton|ta|tes|est|pas|que|qui|dans|avec|sur|et|ou|de|du|ce|cette|vous|je|il|elle|nous)\b/i;

export function resteFrancais(en) { return RESTE_FR.test(String(en).replace(/Sébastien/g, "")); }

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const seulementRestes = process.argv.includes("--restes");
  const [entree, sortie] = args;
  if (!entree) { console.error("usage : node voix-en-statiques-node-v1.mjs blocs-fr.json [statiques-en.json] [--restes]"); process.exit(2); }
  const tr = traducteur();
  const blocs = JSON.parse(fs.readFileSync(entree, "utf8"));
  const sorti = blocs.map((fr) => { const en = tr(fr); return [en, resteFrancais(en) ? 1 : 0, fr]; });
  const restes = sorti.filter((x) => x[1] === 1);
  if (seulementRestes) for (const [en, , fr] of restes) console.log("FR : " + fr + "\nEN : " + en + "\n");
  if (sortie) fs.writeFileSync(sortie, JSON.stringify(sorti.map(([en, r]) => [en, r])), "utf8");
  console.log(sorti.length + " blocs, " + restes.length + " gardent du francais");
}
