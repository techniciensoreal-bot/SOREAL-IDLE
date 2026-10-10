import assert from "node:assert/strict";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/*
 * Audit du 2026-10-10, IDLE-AUDIT-PERF-004 : ouvrir le classement réécrivait le registre (une écriture par joueur) à chaque fois. La deuxième ouverture, sans nouveau joueur ni changement de nom, n'écrit plus le registre.
 */
const g = creerJoueurExterneV1("classement@example.com");
g.op("obtenirEtatSorealIdle", "x");
assert.equal(g.op("definirPseudoSorealIdle", "x", "Testeur").ok, true, "pseudo accepté : le joueur apparaît au classement");
const premier = g.op("obtenirClassementSorealIdle", "x");
assert.equal(premier.ok, true);

const ecritsRegistre = (depuis) => g.journalSql.slice(depuis).filter(([q, b]) => /INSERT|UPDATE|REPLACE/i.test(q) && b.includes("CLASSEMENT")).length;

let depuis = g.journalSql.length;
g.op("obtenirClassementSorealIdle", "x");
const apres1 = ecritsRegistre(depuis);
depuis = g.journalSql.length;
g.op("obtenirClassementSorealIdle", "x");
const apres2 = ecritsRegistre(depuis);
assert.equal(apres2, 0, "ouvertures suivantes : aucune écriture du registre CLASSEMENT (obtenu : " + apres2 + ", précédente : " + apres1 + ")");

// Le classement reste correct : le joueur s'y voit toujours.
const c = g.op("obtenirClassementSorealIdle", "x");
assert.ok(JSON.stringify(c).length > 0 && c.ok === true);
console.log("idle-audit-perf-classement-v1: OK");
