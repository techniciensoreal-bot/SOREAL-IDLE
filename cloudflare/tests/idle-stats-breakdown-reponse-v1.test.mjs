import assert from "node:assert/strict";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/* Panneaux « Stats Breakdown » : la réponse d'état du vrai moteur porte combatPrincipal.detailStats.panneauxStats (Énergie, gains pour une partie neuve ; rien de verrouillé). */
const g = creerJoueurExterneV1("sbr" + Math.random().toString(36).slice(2) + "@example.com");
g.op("obtenirEtatSorealIdle", "x");
g.op("definirPseudoSorealIdle", "x", "SB");
const r = g.op("synchroniserSorealIdle", "x");
const ps = r.joueur.combatPrincipal.detailStats.panneauxStats;
assert.ok(ps && ps.panneaux, "panneaux présents dans la réponse");
assert.deepEqual(Object.keys(ps.panneaux).sort(), ["energie", "gains"], "partie neuve : rien de verrouillé n'est envoyé");
assert.equal(ps.diviseur, 1);
const txt = JSON.stringify(ps);
assert.ok(txt.length < 4000, "pièce légère : " + txt.length);
assert.equal(/Magie|Wandoos|NGU|Barbe|Aventure/.test(txt), false);
console.log("idle-stats-breakdown-reponse-v1: OK");
