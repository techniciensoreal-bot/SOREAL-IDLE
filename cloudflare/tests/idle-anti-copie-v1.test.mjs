import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-04) : « un clic droit ne doit pas ouvrir le menu Windows dans le jeu ; on ne doit pas pouvoir copier-coller les textes : ça donne une image de page internet et pas de vrai jeu. »
 */
const source = readFileSync("cloudflare/public/modules/anti-copie-v1.js", "utf8");
const index = readFileSync("cloudflare/public/index.html", "utf8");

const ecouteurs = {};
const document_ = { addEventListener: (t, f, capture) => { (ecouteurs[t] = ecouteurs[t] || []).push({ f, capture }); }, activeElement: null };
const window_ = {};
vm.runInNewContext(source, { window: window_, document: document_ });
assert.ok(window_.__SOREAL_IDLE_ANTI_COPIE_V1__);
for (const t of ["contextmenu", "selectstart", "copy", "cut"]) assert.ok(ecouteurs[t] && ecouteurs[t][0].capture === true, t + " écouté en capture");

// Faux éléments : closest() répond selon la balise.
const SAISIE = ["INPUT", "TEXTAREA", "SELECT"];
const el = (balise, parent = null) => ({ nodeType: 1, tagName: balise, parentNode: parent, closest(sel) { let n = this; while (n) { if (SAISIE.includes(n.tagName) && /input|textarea|select/.test(sel)) return n; n = n.parentNode; } return null; } });
const evt = (cible, extra = {}) => { const e = { target: cible, prevented: false, stopped: false, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; }, ...extra }; return e; };
const lancer = (type, e) => ecouteurs[type].forEach((x) => x.f(e));

const div = el("DIV");
const champ = el("INPUT");
const texteDansDiv = { nodeType: 3, parentNode: div };

// Clic droit : annulé partout sauf dans un champ de saisie ; jamais stoppé (les gestes du jeu qui l'écoutent continuent).
{
  const e1 = evt(div); lancer("contextmenu", e1);
  assert.equal(e1.prevented, true, "pas de menu du navigateur sur le jeu");
  assert.equal(e1.stopped, false, "l'événement n'est pas stoppé : clic droit sur un objet du sac = action rapide, toujours possible");
  const e2 = evt(champ); lancer("contextmenu", e2);
  assert.equal(e2.prevented, false, "un champ de saisie garde son menu (coller…)");
  const e3 = evt(texteDansDiv); lancer("contextmenu", e3);
  assert.equal(e3.prevented, true, "cible texte : traitée comme son parent");
}
// Sélection et copie.
{
  const s1 = evt(div); lancer("selectstart", s1); assert.equal(s1.prevented, true);
  const s2 = evt(champ); lancer("selectstart", s2); assert.equal(s2.prevented, false);
  const donnees = {}; const c1 = evt(div, { clipboardData: { setData: (t, v) => { donnees[t] = v; } } }); lancer("copy", c1);
  assert.equal(c1.prevented, true, "copier un texte du jeu : refusé"); assert.equal(donnees["text/plain"], "", "le presse-papiers reçoit du vide");
  lancer("cut", evt(div)); 
  const c2 = evt(champ); lancer("copy", c2); assert.equal(c2.prevented, false, "copier depuis un champ : autorisé");
  document_.activeElement = champ;
  const c3 = evt(div); lancer("copy", c3); assert.equal(c3.prevented, false, "focus dans un champ : copier-coller normal");
  document_.activeElement = null;
}

// Page : style appliqué dès le chargement (aucun clignotement), module chargé, champs exclus du blocage.
assert.ok(index.includes('<style id="soreal-idle-anti-copie-v1">html,body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}'));
assert.ok(index.includes("input,textarea,select,[contenteditable=\"\"],[contenteditable=\"true\"],[data-copie-autorisee],[data-copie-autorisee] *{-webkit-user-select:text;user-select:text;-webkit-touch-callout:default}"), "les champs de saisie restent sélectionnables");
assert.ok(index.includes('/modules/anti-copie-v1.js'));
// Les gestes de clic droit du jeu existent toujours (le blocage ne les retire pas).
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("Clic droit de la souris (PC) sur un objet du sac : action rapide équiper / fusionner"));
console.log("idle-anti-copie-v1: OK");
