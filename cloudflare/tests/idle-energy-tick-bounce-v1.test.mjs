import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-25) : « La barre démarre de 0 et va taper jusqu'au 500. Elle repart instantanément
 * de 1 et va taper dans 500... » (remplaçait la version « balle qui rebondit » du 2026-09-24) --
 * demande initiale d'un « vrai tic » qui rebondit, implémentée alors par largeurTickEnergieIdleV1_.
 *
 * Norman (2026-09-29, revirement assumé -- même principe déjà admis pour la barre d'XP de Basic
 * Training le 2026-09-17, voir .soreal-idle-bt-fill-v120 dans soreal-idle-ui.css) : « Tu n'as pas
 * arrangé la barre énergie et magie.. Je ne veux plus qu'elle tique !!! elle doit simplement se
 * remplir et se vider quand on place de l'énergie. Aucune animation de tique par seconde. »
 * largeurTickEnergieIdleV1_ (et le rendu RAF V221 qui l'interpolait à la fréquence de l'écran) sont
 * retirés : la barre affiche directement la valeur réellement connue, lissée par la seule
 * transition CSS de base (transition:width .12s linear, .soreal-idle-energybar-v11).
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

assert.ok(!ui.includes("function largeurTickEnergieIdleV1_("), "l'ancienne fonction de rebond par tick ne doit plus être déclarée");
assert.ok(!ui.includes("function rafraichirVisuelsFluidesIdleV221_("), "le rendu RAF qui interpolait le rebond n'a plus lieu d'être, sans rebond à lisser");

const debut = ui.indexOf("function mettreAJourBarreProgressionContinueV1_(");
const fin = ui.indexOf("function demarrerTickerIdle_()", debut);
assert.ok(debut > 0 && fin > debut, "mettreAJourBarreProgressionContinueV1_ introuvable");
const fn = ui.slice(debut, fin);

// Signature simplifiée : plus de progression/gain de tick, seulement (élément, valeur, max).
assert.match(fn, /function mettreAJourBarreProgressionContinueV1_\(\s*element,\s*valeurActuelle,\s*valeurMax\s*\)\{/);

// Rejoue la fonction réelle dans un sandbox pour vérifier le comportement "simplement se remplir/vider".
const sandbox = {
  idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
  largeurBarreCombatIdleV121_: (el, pct) => { el.dernierPourcentage = pct; }
};
const rejouee = new Function(
  "idleNombre_", "largeurBarreCombatIdleV121_",
  fn + "\nreturn mettreAJourBarreProgressionContinueV1_;"
)(sandbox.idleNombre_, sandbox.largeurBarreCombatIdleV121_);

// La barre reflète directement valeur/max, quel que soit un éventuel 4e/5e argument fourni par erreur (ignorés).
for (const [valeur, max, attendu] of [[0, 500, 0], [101, 500, 20.2], [250, 500, 50], [500, 500, 100], [600, 500, 100]]) {
  const el = {};
  rejouee(el, valeur, max, 999999 /* ancien paramètre "progression", doit être ignoré */, 42 /* ancien "gain", ignoré */);
  assert.ok(Math.abs(el.dernierPourcentage - attendu) < 1e-9, `valeur=${valeur}/max=${max} -> ${attendu}%, obtenu ${el.dernierPourcentage}%`);
}

// Cap à 0 ou négatif : toujours vide, jamais une division par zéro qui produirait NaN.
{
  const el = {};
  rejouee(el, 10, 0);
  assert.equal(el.dernierPourcentage, 0);
}

// La transition CSS fait tout le lissage : plus aucune règle ne doit la couper avec transition:none.
assert.ok(
  !css.includes("transition:none !important;\n            background:linear-gradient(90deg,#2fd86e"),
  "aucune règle ne doit forcer transition:none sur la barre d'Énergie/Magie"
);
assert.match(css, /\.soreal-idle-energybar-v11\{[\s\S]{0,300}?transition:width \.12s linear;/, "transition de base présente, seule responsable du lissage visuel");

console.log("idle-energy-tick-bounce-v1 OK (barre simple, sans tic, Norman 2026-09-29)");
