import assert from "node:assert/strict";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";
import { nettoyerUiPrefsV1, appliquerUiPrefsV1, IDLE_UI_PREFS_MAX_CLES_V1, IDLE_UI_PREFS_MAX_VALEUR_V1 } from "../src/idle-ui-prefs-v1.js";
import { IDLE_CATALOGUES_CHEMINS_V1, IDLE_PIECES_ETAT_CHEMINS_V1 } from "../src/idle-catalogues-v1.js";

/*
 * Norman (2026-10-16) : cases, saisies, onglets et réglages liés au COMPTE, pareils sur tous les appareils. Côté serveur : un coffre de couples texte -> texte (state.uiPrefs), sans effet sur le jeu,
 * borné, écrit par l'action « setUiPrefs », renvoyé dans systemes.uiPrefs (pièce d'état omise quand elle ne change pas).
 */
// Nettoyage et limites.
assert.deepEqual(nettoyerUiPrefsV1(null), {});
assert.deepEqual(nettoyerUiPrefsV1({ b: "2", a: "1", "mauvaise clé": "x", c: 3, d: null, e: { x: 1 } }), { a: "1", b: "2" }, "clés valides, valeurs texte seulement, ordre stable");
assert.deepEqual(Object.keys(nettoyerUiPrefsV1({ z: "1", a: "2" })), ["a", "z"]);
assert.equal(nettoyerUiPrefsV1({ gros: "x".repeat(IDLE_UI_PREFS_MAX_VALEUR_V1 + 1) }).gros, undefined, "valeur trop grosse refusée");
const beaucoup = {}; for (let i = 0; i < IDLE_UI_PREFS_MAX_CLES_V1 + 50; i += 1) beaucoup["k" + String(i).padStart(4, "0")] = "v";
assert.equal(Object.keys(nettoyerUiPrefsV1(beaucoup)).length, IDLE_UI_PREFS_MAX_CLES_V1, "nombre de clés borné");
{
  const st = {};
  const r = appliquerUiPrefsV1(st, { a: "1", b: "2", "x y": "3", c: 5 });
  assert.deepEqual(st.uiPrefs, { a: "1", b: "2" }); assert.equal(r.acceptees, 2); assert.equal(r.ignorees, 2);
  appliquerUiPrefsV1(st, { a: null, b: "9" });
  assert.deepEqual(st.uiPrefs, { b: "9" }, "null supprime, le reste est remplacé");
  appliquerUiPrefsV1(st, "n'importe quoi"); appliquerUiPrefsV1(st, undefined);
  assert.deepEqual(st.uiPrefs, { b: "9" }, "une demande absurde ne change rien");
}
// Pièce d'état stable : omise quand elle ne change pas.
assert.ok(IDLE_PIECES_ETAT_CHEMINS_V1.includes("systemes.uiPrefs") && !IDLE_CATALOGUES_CHEMINS_V1.includes("systemes.uiPrefs"));

// Moteur : écrit par l'action, renvoyé à l'état suivant (autre « appareil » = autre requête), conservé après d'autres actions.
const g = creerJoueurExterneV1("prefs@example.com");
const run = (op, ...a) => g.op(op, "x", ...a);
const e0 = run("obtenirEtatSorealIdle");
assert.deepEqual(e0.joueur.systemes.uiPrefs, {}, "aucune préférence au départ");
const r = run("agirProgressionSorealIdle", { action: "setUiPrefs", prefs: { soreal_idle_montant_input_v1: "250", "soreal_idle_ygg_modes_v1:Norman": "{\"gold\":\"harvest\"}", soreal_idle_bt_synchro_v1: "1" } });
assert.equal(r.ok, true, JSON.stringify(r).slice(0, 200));
assert.equal(r.joueur.systemes.uiPrefs.soreal_idle_montant_input_v1, "250");
const autre = run("obtenirEtatSorealIdle");
assert.deepEqual(autre.joueur.systemes.uiPrefs, { soreal_idle_bt_synchro_v1: "1", soreal_idle_montant_input_v1: "250", "soreal_idle_ygg_modes_v1:Norman": "{\"gold\":\"harvest\"}" }, "un autre appareil retrouve tout");
run("agirProgressionSorealIdle", { action: "setUiPrefs", prefs: { soreal_idle_montant_input_v1: null } });
assert.equal(run("obtenirEtatSorealIdle").joueur.systemes.uiPrefs.soreal_idle_montant_input_v1, undefined, "suppression");
assert.equal(run("synchroniserSorealIdle").joueur.systemes.uiPrefs.soreal_idle_bt_synchro_v1, "1", "conservé après d'autres opérations");
// Aucun effet sur le jeu : mêmes statistiques avant/après.
const avant = run("obtenirEtatSorealIdle").joueur;
run("agirProgressionSorealIdle", { action: "setUiPrefs", prefs: { a: "1" } });
const apres = run("obtenirEtatSorealIdle").joueur;
assert.equal(apres.pvJoueurMax, avant.pvJoueurMax); assert.equal(apres.niveau, avant.niveau);
console.log("idle-prefs-compte-serveur-v1: OK");
