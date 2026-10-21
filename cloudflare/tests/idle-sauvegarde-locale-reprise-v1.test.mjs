import assert from "node:assert/strict";
import { monde, ligne, tick, attendre } from "./helpers/monde-local.mjs";

/* Reprise (audit anti-rollback, Norman, 2026-10-21) : une copie de l'appareil plus ANCIENNE que le serveur n'est jamais détruite en silence : elle est mise de côté. */
// 1. Copie de l'appareil plus ancienne que le serveur : mise de côté, jamais détruite.
{
  const w = monde({ ligneServeur: ligne(30, 9000), idb: { cells: ligne(9, 5000), flux: [{ at: 1, type: "boss", donnees: "{}" }], gains: [], at: 1 } });
  await w.ML.appeler("obtenirEtatSorealIdle", [], undefined, "fr", "jeton");
  await tick();
  assert.equal(w.etat.n, 30, "le serveur, plus récent, fait foi");
  assert.equal(w.store.has("etat:2:n@x"), false, "la copie ancienne ne sera plus rejouée");
  assert.equal(w.store.get("etat:2:n@x:ecartee")?.cells[10], 9, "mais elle est conservée de côté (jamais détruite en silence)");
}

console.log("idle-sauvegarde-locale-reprise-v1: OK");
