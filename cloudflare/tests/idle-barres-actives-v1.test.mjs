import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-10) : chaque barre qui porte de l'énergie doit se voir d'un coup d'œil (particules, un style par menu), même si sa barre de progression est pleine ou bloquée.
 */
const src = readFileSync("cloudflare/public/modules/barres-actives-v1.js", "utf8");
const html = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(html.includes('/modules/barres-actives-v1.js?v='), "module chargé par index.html");

// Logique : une ligne est active dès qu'un chiffre non nul d'énergie est placé.
const fenetre = {};
const faux = { head: { appendChild() {} }, createElement: () => ({}), getElementById: () => null, querySelector: () => null, hidden: false };
vm.runInNewContext(src, { window: fenetre, document: faux, setInterval() {} });
const api = fenetre.__SOREAL_IDLE_BARRES_ACTIVES_V1__;
for (const [t, attendu] of [["0⚡", false], ["0 ⚡", false], ["", false], ["1 ⚡", true], ["120K⚡", true], ["0,5K", true], ["40K", true], ["0", false]]) {
  assert.equal(api.estActif(t), attendu, "« " + t + " »");
}
assert.equal(api.styles.length, 6);
assert.equal(new Set(api.styles).size, 6, "un style de particules différent par menu");

// Boucles parfaites (règle n°3) : chaque animation commence ET finit à opacité 0, et ne revient jamais en arrière.
for (const nom of ["pvBraise", "pvEtoile", "pvBit", "pvPiece", "pvGoutte", "pvOrbe"]) {
  const m = src.match(new RegExp("@keyframes " + nom + "\{(.*?)\}'\+|@keyframes " + nom + "\{(.*?)\}\}"));
  const corps = m ? (m[1] || m[2]) : "";
  assert.ok(corps, nom + " existe");
  assert.match(corps, /^0%\{opacity:0;/, nom + " : fondu d'entrée (opacité 0 à 0 %)");
  assert.match(corps, /100%\{opacity:0;/, nom + " : fondu de sortie (opacité 0 à 100 %)");
}
// Seules transform et opacity s'animent (carte graphique), jamais box-shadow ni filtre.
const keyframes = src.match(/@keyframes pv[A-Za-z]+\{.*?\}\}?'/g).join("");
assert.ok(!/box-shadow|filter/.test(keyframes), "particules animées en transform/opacity seulement");
assert.ok(src.includes("prefers-reduced-motion:reduce"), "mouvement réduit coupé");
assert.ok(src.includes("if(!document.hidden)balayer()"), "en pause quand la page est cachée");
console.log("idle-barres-actives-v1: OK");
