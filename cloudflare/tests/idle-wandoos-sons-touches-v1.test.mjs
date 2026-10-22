import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-22) : « Les boutons de Wandoos ne font plus de bruit ». Cause : le bloc des clics rapides (2026-10-19) déclarait un second « toucheDe_ » qui remplaçait celui du son ; l'écouteur du son
 * recevait un objet sans classList (erreur) ou rien. Le vrai module tourne ici dans un faux navigateur : appuyer sur + ou un chiffre, sur la barre d'espace ou sur une autre touche joue bien le son.
 */
const code = readFileSync(new URL("../public/modules/wandoos-retro-v1.js", import.meta.url), "utf8");
const ecouteurs = {};
const jouees = [];
const classes = (liste) => ({ contains: (c) => liste.includes(c) });
function touche(liste, onclick) {
  const b = { disabled: false, classList: classes(liste), onclick: () => {}, getAttribute: (k) => (k === "onclick" ? onclick : null) };
  b.closest = (sel) => (sel === ".wd-touche" ? b : null);
  return b;
}
const document = {
  addEventListener: (nom, f) => { (ecouteurs[nom] = ecouteurs[nom] || []).push(f); },
  getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ style: {} }), head: { appendChild() {} }, documentElement: { appendChild() {} }
};
const fen = {
  __SOREAL_IDLE_AUDIO_V199__: { play: (nom) => jouees.push(nom) },
  __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getInterface: () => 0.8 },
  addEventListener() {}, matchMedia: () => ({ matches: false })
};
fen.window = fen;
vm.createContext(Object.assign(fen, { document, performance: { now: () => 1000 }, setTimeout, clearTimeout, setInterval: () => 0, requestAnimationFrame: () => 0, localStorage: { getItem: () => null, setItem() {} }, console }));
vm.runInContext(code, fen);
const evenement = (cible, pointerType = "mouse") => ({ target: cible, pointerType, button: 0, clientX: 1, clientY: 1, stopImmediatePropagation() {}, preventDefault() {} });
const lancer = (nom, cible, type) => (ecouteurs[nom] || []).forEach((f) => f(evenement(cible, type)));

// Touche + (placement) : son de touche normale ; barre d'espace : son grave ; touche sans action de placement (couleur, effacer) : aussi un son.
lancer("pointerdown", touche(["wd-touche"], "window.__SOREAL_IDLE_WANDOOS_V1__.place(1)"));
assert.deepEqual(jouees.splice(0), ["btPlus"], "touche + : bruit de clavier");
lancer("pointerdown", touche(["wd-touche", "wd-espace"], "window.__SOREAL_IDLE_WANDOOS_V1__.place(1)"));
assert.deepEqual(jouees.splice(0), ["btMinus"], "barre d'espace : bruit grave");
lancer("pointerdown", touche(["wd-touche"], "window.__SOREAL_IDLE_WANDOOS_V1__.chiffre(5)"));
assert.deepEqual(jouees.splice(0), ["btPlus"], "chiffre : bruit de clavier");
lancer("pointerdown", touche(["wd-touche", "wd-touche-couleur"], "window.__SOREAL_IDLE_WANDOOS_V1__.couleur()"));
assert.deepEqual(jouees.splice(0), ["btPlus"], "touche sans placement : bruit aussi");
// Le doigt (pointeur tactile) : le son part à l'appui comme pour la souris.
lancer("pointerdown", touche(["wd-touche"], "window.__SOREAL_IDLE_WANDOOS_V1__.place(1)"), "touch");
assert.deepEqual(jouees.splice(0), ["btPlus"], "tactile : bruit à l'appui");
console.log("idle-wandoos-sons-touches-v1: OK");
