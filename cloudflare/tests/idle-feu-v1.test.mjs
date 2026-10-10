import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Lueur de feu de bois (Norman, 2026-10-07) : quand la piste d'ambiance est celle du feu qui crépite, une lumière chaude vacille sur l'écran et éclaire les menus ;
 * éclats calés sur les crépitements de la piste quand l'analyse audio est possible ; rien si « moins d'animations » ou si on n'entend pas la piste.
 */
const src = readFileSync("cloudflare/public/modules/feu-v1.js", "utf8");
const index = readFileSync("cloudflare/public/index.html", "utf8");

const ecouteurs = {};
const changements = [];
const faux = () => ({ style: { _v: {}, setProperty(k, v) { this._v[k] = v; } }, classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, contains(c) { return this._s.has(c); } }, innerHTML: "", parentNode: null, setAttribute() {}, querySelector: () => faux() });
let mouvementReduit = false;
let volume = 0.5;
const ajoutes = [];
const corps = { appendChild(el) { el.parentNode = corps; ajoutes.push(el); }, removeChild(el) { el.parentNode = null; } };
const fenetre = {
  document: { getElementById: () => null, head: { appendChild() {} }, body: corps, createElement: () => faux() },
  matchMedia: () => ({ matches: mouvementReduit }),
  addEventListener: (nom, fn) => { (ecouteurs[nom] = ecouteurs[nom] || []).push(fn); },
  __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getAmbiance: () => volume, onChange: (f) => { changements.push(f); } },
  localStorage: { getItem: () => "1" }, /* effet coché dans les Réglages : la cheminée est coupée par défaut (2026-10-08) */
  setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {}, requestAnimationFrame: (f) => f(), Date, Math, Uint8Array, Number
};
fenetre.window = fenetre;
vm.runInNewContext(src, fenetre, { filename: "feu-v1.js" });
const F = fenetre.__SOREAL_IDLE_FEU_V1__;
assert.ok(F && typeof F.crepiter === "function", "module exposé");

// Seule la piste du feu déclenche la lueur.
for (const oui of ["Fireplace.opus", "idle/ambient/feu-de-bois.opus", "Crackling Fire.opus", "Campfire.opus"]) assert.equal(F.estFeu(oui), true, oui);
for (const non of ["Thunder.opus", "Birds.opus", "ruisseau.opus", "BloodMagic.opus", ""]) assert.equal(F.estFeu(non), false, non);

const emettre = (cle, extra) => ecouteurs["soreal-ambiance-v1"].forEach((f) => f({ detail: Object.assign({ cle }, extra || {}) }));
assert.equal(ecouteurs["soreal-ambiance-v1"].length, 1, "écoute l'annonce de la piste");
assert.equal(F.actif(), false);
emettre("Fireplace.opus");
assert.equal(F.actif(), true, "piste de feu : lueur active");
assert.ok(ajoutes.length === 1 && ajoutes[0].innerHTML.includes("fe-lueur") && ajoutes[0].innerHTML.includes("fe-ombre"), "décor posé : ombre des bords, lueur chaude, éclat");
emettre("Thunder.opus");
assert.equal(F.actif(), false, "autre piste : lueur arrêtée");
emettre("Fireplace.opus"); emettre("");
assert.equal(F.actif(), false, "silence : lueur arrêtée");

// Volume d'ambiance à zéro : on n'entend pas le feu, on ne le voit pas.
volume = 0;
emettre("Fireplace.opus");
assert.equal(F.actif(), false, "volume à zéro : pas de lueur");
volume = 0.5;
emettre("Fireplace.opus");
assert.equal(F.actif(), true);
volume = 0; changements.forEach((f) => f());
assert.equal(F.actif(), false, "le volume coupé éteint la lueur");
volume = 0.5; changements.forEach((f) => f());
assert.equal(F.actif(), true, "le volume rétabli la rallume");
F.arreter();

// Mouvement réduit : rien du tout.
mouvementReduit = true;
assert.equal(F.demarrer(), false);
assert.equal(F.actif(), false, "moins d'animations : aucune lueur");
mouvementReduit = false;

// Style : mélangé aux couleurs de la page, jamais cliquable, retiré à l'arrêt.
assert.ok(src.includes("pointer-events:none") && !src.includes("mix-blend-mode") && !src.includes("--fe-x',(") && src.includes("removeChild(racine)"), "lueur douce et légère (aucun mélange de calques, seul l'opacité bouge), sans clic, retirée à l'arrêt");
assert.ok(index.includes('<script defer src="/modules/feu-v1.js?v=10"></script>'), "module chargé par la page");
console.log("idle-feu-v1: OK");
