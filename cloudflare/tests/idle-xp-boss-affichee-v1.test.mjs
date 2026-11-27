import assert from "node:assert/strict";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/* Audit Fight Boss (2026-11-27) : l'EXP de boss AFFICHEE est celle que le moteur DONNE (bonus de 1re victoire qui remplace la base, arrondi vers le bas) : boss 1, jamais vaincu : 2 (et non 0). */
const g = creerJoueurExterneV1("xp@example.com");
const xp = () => g.op("obtenirEtatSorealIdle", "x").joueur.recompenseBossActuel.xp;
assert.equal(xp(), 2, "boss 1 jamais vaincu : l'etat annonce les 2 XP du bonus de 1re victoire");
const l = g.sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
const a = JSON.parse(l.row_json);
const s = JSON.parse(a[37]);
s.metaNgu.records.highestBoss = 50;
a[37] = JSON.stringify(s);
g.sql.exec("update idle_catalog set row_json=? where rowid=?", JSON.stringify(a), l.id);
assert.equal(xp(), 0, "boss 1 deja vaincu une fois : l'EXP de repetition du boss 1 (0), plus le bonus");
console.log("idle-xp-boss-affichee-v1: OK");
