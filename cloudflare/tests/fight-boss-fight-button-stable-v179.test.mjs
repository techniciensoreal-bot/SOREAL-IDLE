import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);

const start=source.indexOf("function rendreIdleEtat_(res){");
assert.ok(start>=0,"rendreIdleEtat_ introuvable");
const end=source.indexOf("\n      function ",start+20);
const body=source.slice(start,end);

const guardPos=body.indexOf("const fightBossDomStableV179=");
const innerHtmlPos=body.indexOf("document.getElementById('app').innerHTML=");
assert.ok(guardPos>=0,"garde DOM stable Fight Boss V179 absent");
assert.ok(innerHtmlPos>=0,"rendu complet #app introuvable");
assert.ok(
  guardPos<innerHtmlPos,
  "Le garde Fight Boss doit s'exécuter avant toute reconstruction de #app."
);

assert.match(
  body,
  /fightBossDomStableV179=[\s\S]{0,500}synchroCombatSansReflowV179[\s\S]{0,300}j\.combatBossActif[\s\S]{0,300}idleMenuActifV28==='combat'[\s\S]{0,220}idleMenuRenduV179==='combat'/,
  "Le rendu ne doit être bloqué que pour le Fight Boss déjà visible sur le même onglet Combat."
);

assert.match(
  body,
  /if\(fightBossDomStableV179\)\{[\s\S]{0,500}rafraichirCommandesFightBossIdleV167_\(\);[\s\S]{0,100}return;/,
  "Pendant Fight Boss, le bouton doit être patché sans reconstruire son DOM."
);

assert.match(
  body,
  /idleMenuRenduV179=\s*\n?\s*idleMenuActifV28;/,
  "Après un vrai rendu, le menu réellement peint doit être mémorisé."
);

const menuStart=source.indexOf("function menuIdleV28_(");
assert.ok(menuStart>=0,"menuIdleV28_ introuvable");
const menuEnd=source.indexOf("\n      function ",menuStart+20);
const menuBody=source.slice(menuStart,menuEnd);
assert.match(
  menuBody,
  /idleMenuActifV28=\s*\n?\s*nouveauMenu;[\s\S]{0,220}rendreIdleEtat_\(/,
  "Un changement volontaire d'onglet doit changer idleMenuActifV28 avant le rendu, afin de contourner le garde du menu déjà peint."
);

console.log("Fight Boss stable Fight DOM V179: OK");
