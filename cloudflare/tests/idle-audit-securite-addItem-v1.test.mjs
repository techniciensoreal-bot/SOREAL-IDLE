import assert from "node:assert/strict";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/*
 * Audit de sécurité du 2026-10-10, IDLE-AUDIT-SEC-001 (P0) : « addItem » (action de test) fabriquait n'importe quel objet, niveau maximal compris, pour un joueur ordinaire. Le chemin public refuse maintenant les actions d'Aventure
 * réservées ; le moteur lui-même (applyIdleNguAction), utilisé directement par les tests, ne change pas.
 */
const g = creerJoueurExterneV1();
const etat = g.op("obtenirEtatSorealIdle", "x");
assert.equal(etat.ok, true, "le joueur ordinaire est accepté");
const avantInv = ((etat.joueur.systemes || {}).adventure || {}).inventory || [];

const res = g.op("agirProgressionSorealIdle", "x", { action: "adventure", adventure: { action: "addItem", definitionId: "mega:weapon", level: 100 } });
assert.equal(res.ok, false, "addItem est refusé pour un client");
assert.match(String(res.message || ""), /ACTION_RESERVEE/, "refus explicite");

// Aucun objet n'a été créé, rien n'est débloqué par un objet fabriqué.
const apres = g.op("obtenirEtatSorealIdle", "x");
const inventaire = (apres.joueur && apres.joueur.systemes && apres.joueur.systemes.adventure && apres.joueur.systemes.adventure.inventory) || [];
assert.equal(inventaire.length, avantInv.length, "inventaire inchangé");
assert.ok(!inventaire.some((x) => x && x.definitionId === "mega:weapon"), "aucune épée fabriquée");
const debloque = g.op("agirProgressionSorealIdle", "x", { action: "adventure", adventure: { action: "useUnlockItem", itemId: "aNumber" } });
assert.equal(debloque.ok, false, "pas de déblocage avec un objet que le joueur n'a pas");

// Les actions ordinaires du client continuent de fonctionner (sélection de zone : accepte ou refuse selon le jeu, mais pas « réservée »).
const zone = g.op("agirProgressionSorealIdle", "x", { action: "adventure", adventure: { action: "selectZone", zone: "safe" } });
assert.doesNotMatch(String(zone.code || zone.error || zone.message || ""), /ACTION_RESERVEE/, "les actions normales ne sont pas bloquées");
console.log("idle-audit-securite-addItem-v1: OK");
