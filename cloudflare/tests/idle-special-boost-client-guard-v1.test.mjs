import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * 2026-09-24 (Norman) : les boosts spéciaux ne remplissent pas les Specials des objets, sauf le cube tuto / infini.
 * Garde côté client (soreal-idle-ui.js) : pas d'action envoyée, pas de « booster » proposé, pas d'application optimiste.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

const glisser = ui.slice(ui.indexOf("function boosterObjetParIdAdventureIdleV47_("), ui.indexOf("function deposerSurCubeAdventureIdleV138_("));
assert.match(glisser, /if\(type==='special'&&cible\.kind!=='cube'\)\{\s*toastIdleV5_\(/);
assert.ok(glisser.indexOf("type==='special'&&cible.kind!=='cube'") < glisser.indexOf("actionAdventureIdleV47_("), "le refus précède l'envoi de l'action");

const decision = ui.slice(ui.indexOf("function decisionActionSlotAdventureIdleV138_("), ui.indexOf("function appliquerActionSlotAdventureIdleV138_("));
assert.match(decision, /source\.boostType==='special'&&occupant\.kind!=='cube'\)\{\s*return 'equiper';/);
assert.ok(decision.indexOf("occupant.kind!=='cube'") < decision.indexOf("return 'booster'"), "la règle spéciale passe avant « booster »");

assert.match(ui, /if\(type==='special'&&target\.kind!=='cube'\)return false;/, "pas d'application optimiste d'un boost spécial sur un objet");

console.log("idle-special-boost-client-guard-v1: OK");
