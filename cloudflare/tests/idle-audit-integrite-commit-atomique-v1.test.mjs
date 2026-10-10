import assert from "node:assert/strict";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";
import { runSorealIdleOperation } from "../src/idle-sqlite-runtime.js";

/*
 * Audit du 2026-10-10, IDLE-AUDIT-PERF-006 / SEC-015 : le commit d'une opération écrit idle_catalog PUIS idle_players (puis le journal d'EXP) sans transaction : une erreur au milieu laissait les deux tables diverger (idle_players sert de
 * filet de restauration). Le coordinateur donne maintenant au moteur un handle avec transactionSync quand le Durable Object le fournit : une erreur annule tout le commit.
 */
const g = creerJoueurExterneV1("atomique@example.com", { avecTransaction: true });
const moteur = g.coordinateur.sqlMoteur;
assert.equal(typeof moteur.transactionSync, "function", "le handle du moteur porte transactionSync quand le stockage le fournit");
const sansTx = creerJoueurExterneV1("sans-tx@example.com");
assert.equal(typeof sansTx.coordinateur.sqlMoteur.transactionSync, "undefined", "sans transactionSync (tests, autres hôtes) : handle brut, comportement inchangé");

const op = (nom, ...args) => runSorealIdleOperation(moteur, nom, ["x", ...args], g.user);
assert.equal(op("obtenirEtatSorealIdle").ok, true);
const ligne = () => g.sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index>1")[0].row_json;
const avant = ligne();

// Panne au milieu du commit : l'écriture de idle_players échoue APRÈS celle de idle_catalog.
const execNormal = moteur.exec;
moteur.exec = (q, ...b) => {
  if (/INSERT INTO idle_players/i.test(q)) throw new Error("PANNE_SIMULEE");
  return execNormal(q, ...b);
};
assert.throws(() => op("enregistrerClicsSorealIdle", 5), /PANNE_SIMULEE/);
moteur.exec = execNormal;
assert.equal(ligne(), avant, "commit annulé en entier : la ligne du joueur dans idle_catalog n'a pas bougé");

// Sans panne, le commit passe et la ligne change.
assert.equal(op("enregistrerClicsSorealIdle", 5).ok, true);
assert.notEqual(ligne(), avant, "sans panne, l'écriture est bien faite");
console.log("idle-audit-integrite-commit-atomique-v1: OK");
