import assert from "node:assert/strict";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/*
 * Audit du 2026-10-10, IDLE-AUDIT-PERF-010 : après un remplacement de feuille de catalogue (route d'import du coordinateur), un isolat chaud servait l'ancien contenu jusqu'à 5 minutes (mémo de tables). Le remplacement vide maintenant
 * ces mémos : la lecture suivante voit tout de suite le nouveau contenu.
 */
const g = creerJoueurExterneV1("memos@example.com");
const cout = () => JSON.stringify(g.op("obtenirEtatSorealIdle", "x").joueur.coutsBoutique);
const avant = cout();
assert.ok(avant.length > 2, "les coûts de boutique viennent bien de la feuille IDLE_BOUTIQUE");
const nouvelles = [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 999, 1.6, 1], ["capacite", 999, 1.6, 1], ["puissance", 999, 1.6, 1]]
  .map((row_json, i) => ({ sheet_name: "IDLE_BOUTIQUE", row_index: i + 1, row_json }));
const r = g.coordinateur.replaceCatalogSheets({ sheets: ["IDLE_BOUTIQUE"], catalog: nouvelles });
assert.equal(r.ok, true);
const apres = cout();
assert.notEqual(apres, avant, "le nouveau contenu est servi immédiatement, sans attendre l'expiration du mémo (avant : " + avant + ", après : " + apres + ")");
console.log("idle-audit-perf-memos-catalogue-v1: OK");
