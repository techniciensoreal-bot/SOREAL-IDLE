import assert from "node:assert/strict";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/*
 * Audit du 2026-10-10, IDLE-AUDIT-SEC-014 : une feuille de catalogue vidée VOLONTAIREMENT (remplacement confirmé) était reconstruite depuis legacy_rows au démarrage à froid suivant : d'anciennes valeurs, éventuellement non
 * conformes au wiki, réapparaissaient. Une feuille marquée « purge volontaire » n'est plus restaurée ; les autres feuilles vides le sont toujours.
 * Ce test vit dans son propre processus : la restauration n'a lieu qu'au premier appel de l'isolat.
 */
const g = creerJoueurExterneV1("purge@example.com");
const compte = (feuille) => g.sql.exec("SELECT COUNT(*) AS n FROM idle_catalog WHERE sheet_name=?", feuille)[0].n;

for (const [cle, valeurs] of [["idle:sorts", ["Sort", "Cout"]], ["idle:zones", ["Zone", "Niveau"]]]) {
  g.sql.exec("INSERT INTO legacy_rows(source_key,row_index,values_json,imported_at) VALUES(?,?,?,?)", cle, 1, JSON.stringify(valeurs), Date.now());
}
g.sql.exec("INSERT INTO idle_meta(meta_key,meta_value) VALUES(?,?)", "catalogue_purge:IDLE_SORTS", String(Date.now()));
assert.equal(compte("IDLE_SORTS"), 0);
assert.equal(compte("IDLE_ZONES"), 0);

g.op("obtenirEtatSorealIdle", "x"); // premier appel de l'isolat : la restauration tourne
assert.equal(compte("IDLE_SORTS"), 0, "feuille purgée volontairement : NON ressuscitée depuis legacy_rows");
assert.ok(compte("IDLE_ZONES") > 0, "une feuille vide non marquée est toujours restaurée (filet de sécurité conservé)");
console.log("idle-audit-securite-purge-volontaire-v1: OK");
