import assert from "node:assert/strict";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/*
 * Règle n°2 d'AGENTS.md (audit 2026-11-09, vague 1) : pièces voisines de `systemes.systems`.
 * yggExtra.fruits = mêmes fruits que yggFruits ; mayoTypes vide tant que les Cartes ne sont pas découvertes ;
 * aucun maximum futur (wishSlots / daycare / macguffins) et aucun emplacement de souhait non obtenu.
 */
const MAYO = ["sadMayo", "ayyMayo", "cincoMayo", "angryMayo", "moldyMayo", "prettyMayo"];
function joueur(email, boss) {
  const h = creerJoueurExterneV1(email);
  h.op("obtenirEtatSorealIdle", "x");
  if (boss) {
    const ligne = h.sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
    const arr = JSON.parse(ligne.row_json);
    arr[14] = boss;
    const st = JSON.parse(arr[37] || "{}");
    (st.metaNgu = st.metaNgu || {}).records = Object.assign({}, st.metaNgu.records, { highestBoss: boss });
    arr[37] = JSON.stringify(st);
    h.db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  }
  return h.op("obtenirEtatSorealIdle", "x").joueur.systemes;
}
function verifier(nom, sys) {
  const ids = new Set((sys.yggFruits || []).map((f) => f.id));
  const extra = Object.keys(sys.yggExtra.fruits || {});
  assert.deepEqual(extra.sort(), [...ids].sort(), nom + " : yggExtra.fruits = yggFruits (aucun fruit non découvert)");
  if (!sys.cards.unlocked) {
    assert.deepEqual(sys.cards.mayoTypes, [], nom + " : aucun nom de mayo avant les Cartes");
    for (const m of MAYO) assert.ok(!extra.includes(m), nom + " : fruit " + m + " non découvert");
  }
  assert.ok(!extra.includes("numbers") && !ids.has("numbers"), nom + " : le Fruit of Numbers n apparait qu apres la 5e completion du defi Troll");
  assert.ok(!JSON.stringify(sys).includes("\"maxSlots\""), nom + " : aucun maximum d'emplacements");
  assert.ok(sys.wishSlots.slots.length <= sys.wishSlots.slotCount, nom + " : seulement les emplacements de souhait obtenus");
  assert.ok(sys.wishSlots.slots.every((s) => s.unlocked), nom + " : aucun emplacement verrouillé");
}
const neuf = joueur("pv-neuf@example.com", 0);
verifier("neuf", neuf);
assert.equal(Object.keys(neuf.yggExtra.fruits).length, 0, "joueur neuf : aucun fruit");
assert.equal(neuf.cards.mayoTypes.length, 0, "joueur neuf : aucun mayo");
verifier("boss 60", joueur("pv-60@example.com", 60));
const tout = joueur("pv-200@example.com", 200);
verifier("boss 200", tout);
if (tout.cards.unlocked) assert.equal(tout.cards.mayoTypes.length, 6, "Cartes découvertes : les 6 mayos");
console.log("idle-anti-spoil-pieces-voisines-v1: OK");
