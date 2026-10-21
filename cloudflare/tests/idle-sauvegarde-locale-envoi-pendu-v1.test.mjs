import assert from "node:assert/strict";
import { monde, tick } from "./helpers/monde-local.mjs";

/*
 * Audit anti-rollback S7 (Norman, 2026-10-21) : un envoi réseau qui ne répond jamais laissait « envoi en cours » à vrai : plus aucun envoi normal ne partait. L'envoi est maintenant abandonné après un délai ;
 * la progression est renvoyée à l'envoi suivant.
 */
const w = monde();
await w.action(); await tick();
w.push = (corps, i, signal) => new Promise((ok, ko) => { if (signal) signal.addEventListener("abort", () => ko(new Error("abandonné"))); });   // ne répond jamais
const premier = await w.ML.envoyerMaintenant();
assert.equal(premier, false, "un envoi pendu est un échec, pas une sauvegarde");
w.push = async () => ({ ok: true, ecrit: true });
const suivant = await w.ML.envoyerMaintenant();
assert.equal(suivant, true, "l'envoi suivant part et aboutit");
assert.equal(w.pushes.at(-1).cells[10], 1, "la progression est renvoyée");
console.log("idle-sauvegarde-locale-envoi-pendu-v1: OK");
