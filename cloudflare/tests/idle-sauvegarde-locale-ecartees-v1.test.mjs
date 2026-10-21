import assert from "node:assert/strict";
import { monde, ligne } from "./helpers/monde-local.mjs";

/*
 * Audit anti-rollback R3 (Norman, 2026-10-21) : une copie de l'appareil plus ancienne que le serveur est mise de côté. Elle n'avait qu'UN emplacement : un deuxième écartement détruisait le premier.
 * Maintenant les 3 dernières sont gardées (":ecartee", ":ecartee-1", ":ecartee-2", de la plus récente à la plus ancienne) et listées par copiesEcartees().
 */
const cle = "etat:2:n@x";
let store = new Map();
for (const n of [9, 11, 13, 15]) {
  const w = monde({ ligneServeur: ligne(30, 9000), idb: { cells: ligne(n, 5000), flux: [], gains: [], at: n } });
  for (const [k, v] of store) if (k.includes(":ecartee")) w.store.set(k, v);
  await w.ML.appeler("obtenirEtatSorealIdle", [], undefined, "fr", "jeton");
  store = w.store;
  if (n === 15) {
    assert.equal(store.get(cle + ":ecartee").cells[10], 15, "la plus récente");
    assert.equal(store.get(cle + ":ecartee-1").cells[10], 13);
    assert.equal(store.get(cle + ":ecartee-2").cells[10], 11, "la 3e plus récente ; la 4e (9) est la seule à disparaître");
    assert.equal(store.has(cle), false, "la copie courante n'est plus dans la reprise");
    const liste = await w.ML.copiesEcartees();
    assert.deepEqual(JSON.parse(JSON.stringify(liste.map((c) => c.cells[10]))), [15, 13, 11], "listées de la plus récente à la plus ancienne");
  }
}
console.log("idle-sauvegarde-locale-ecartees-v1: OK");
