import assert from "node:assert/strict";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/*
 * Audit Fight Boss (2026-11-27) : la feuille IDLE_BOSS de production n'a pas de ligne pour le boss 80 (300 lignes, IDs 1..79 puis 81..301) et le moteur lit le catalogue par position :
 * a partir du boss 80, nom / chronique du Collection venaient du boss suivant et le boss 301 sortait du catalogue. Le moteur comble maintenant un trou entre deux IDs (bossCatalogueCombleTrousSorealIdleV1_).
 */
const g = creerJoueurExterneV1("trou@example.com");
const feuille = (nom, lignes) => lignes.forEach((l, i) => g.sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", nom, i + 1, JSON.stringify(l), Date.now()));
const lignes = [["ID", "Nom", "PV", "Attaque", "XP", "Pieces", "Histoire", "Actif"]];
for (let i = 1; i <= 301; i += 1) if (i !== 80) lignes.push([i, "Nom" + i, 500 * i, 2 * i, 10, 1, "Histoire" + i, true]);
feuille("IDLE_BOSS", lignes);
assert.equal(lignes.length - 1, 300, "la feuille de test a 300 lignes (80 manque)");

const ligneJoueur = () => g.sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
g.op("obtenirEtatSorealIdle", "x");
const regler = (vaincus) => {
  const l = ligneJoueur();
  const a = JSON.parse(l.row_json);
  a[14] = vaincus;
  g.sql.exec("update idle_catalog set row_json=? where rowid=?", JSON.stringify(a), l.id);
  return g.op("obtenirEtatSorealIdle", "x").joueur;
};
for (const vaincus of [79, 150, 299, 300]) {
  const j = regler(vaincus);
  const parNumero = new Map(j.bossCatalogue.map((b) => [b.numero, b]));
  for (const n of [1, 79, 81, 82, 150, 299, 300, 301]) {
    const b = parNumero.get(n);
    if (!b) continue;
    assert.equal(b.nom, "Nom" + n, "vaincus=" + vaincus + " : le boss " + n + " garde son propre nom (pas celui du suivant)");
  }
  assert.deepEqual(j.bossCatalogue.map((b) => b.numero), j.bossCatalogue.map((_, i) => i + 1), "numeros contigus (le trou est comble)");
}
console.log("idle-catalogue-boss-trou-v1: OK");
