import assert from "node:assert/strict";
import { monde, ligne, attendre } from "./helpers/monde-local.mjs";

/*
 * Audit anti-rollback S1 et S5 (Norman, 2026-10-21) : une copie de l'appareil non transmise ne doit jamais être détruite par une panne d'IndexedDB.
 *  S1 : la mise de côté échoue (quota...) -> la copie d'origine était quand même effacée.
 *  S5 : la lecture de la copie échoue au démarrage (base lente ou bloquée) -> le jeu repartait comme s'il n'y avait pas de copie, et la 1re action l'écrasait.
 * Maintenant : tant que la copie n'est pas lue ET mise à l'abri, rien n'est effacé ni écrasé ; dès que la base répond, elle est mise de côté puis la sauvegarde reprend.
 */
const cle = "etat:2:n@x";
const copie = (n) => ({ cells: ligne(n, 5000), flux: [{ at: 1, type: "boss", donnees: "{}" }], gains: [], at: 1 });
const quelquePart = (w, n) => [...w.store.entries()].some(([, v]) => v && v.cells && v.cells[10] === n);

// S1 : écriture de la copie écartée refusée.
{
  const w = monde({ ligneServeur: ligne(30, 9000), idb: copie(9) });
  const set = w.store.set.bind(w.store);
  let panne = true;
  w.store.set = (k, v) => { if (panne && String(k).includes(":ecartee")) throw new Error("quota"); return set(k, v); };
  await w.ML.appeler("obtenirEtatSorealIdle", [], undefined, "fr", "jeton");
  assert.equal(w.store.get(cle)?.cells[10], 9, "S1 : la copie d'origine n'est pas effacée quand la mise de côté échoue");
  await w.action(); await attendre(600);
  assert.equal(w.store.get(cle)?.cells[10], 9, "S1 : la sauvegarde de la nouvelle partie n'écrase pas la copie non protégée");
  panne = false;
  await w.action(); await attendre(600);
  assert.equal(w.store.get(cle + ":ecartee")?.cells[10], 9, "S1 : la base répond : la copie est mise de côté");
  assert.equal(w.store.get(cle)?.cells[10], w.etat.n, "S1 : puis la sauvegarde courante reprend");
}

// S5 : lecture de la copie en échec au démarrage.
{
  const w = monde({ ligneServeur: ligne(3, 1000), idb: copie(9) });
  const get = w.store.get.bind(w.store);
  let panne = true;
  w.store.get = (k) => { if (panne && k === cle) throw new Error("IDB lente"); return get(k); };
  await w.ML.appeler("obtenirEtatSorealIdle", [], undefined, "fr", "jeton");
  await w.action(); await attendre(600);
  assert.equal(get(cle)?.cells[10], 9, "S5 : la copie non lue n'est pas écrasée par la 1re action");
  panne = false;
  await w.action(); await attendre(600);
  assert.ok(quelquePart(w, 9), "S5 : la base répond : la copie (9) est mise à l'abri, jamais perdue");
  assert.equal(w.store.get(cle)?.cells[10], w.etat.n, "S5 : puis la sauvegarde courante reprend");
}

// Cas normal inchangé : sans panne, pas de blocage.
{
  const w = monde();
  await w.action(); await attendre(600);
  assert.equal(w.store.get(cle)?.cells[10], 1);
}
console.log("idle-sauvegarde-locale-copie-protegee-v1: OK");
