import assert from "node:assert/strict";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/*
 * Audit de sécurité du 2026-10-10, IDLE-AUDIT-SEC-002 (P1) : les statistiques de combat envoyées par un client passaient devant celles du serveur. Un titan dont la barrière de puissance n'était pas franchie se tuait avec des
 * « stats » falsifiées. Le serveur ignore maintenant tout champ « stats » venu du client.
 */
function joueurBoss60(email) {
  const g = creerJoueurExterneV1(email);
  g.op("obtenirEtatSorealIdle", "x");
  // Joueur du boss 60 (titans atteints) mais de puissance réelle faible.
  const ligne = g.sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const arr = JSON.parse(ligne.row_json);
  arr[14] = 60;
  const stats = JSON.parse(arr[37] || "{}");
  const meta = (stats.metaNgu = stats.metaNgu || {});
  meta.records = Object.assign({}, meta.records, { highestBoss: 60 });
  arr[37] = JSON.stringify(stats);
  g.db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  return (a) => g.op("agirProgressionSorealIdle", "x", { action: "adventure", adventure: a });
}
const FAUX = { power: 1e30, toughness: 1e30, hp: 1e30, regen: 1e30 };

const honnete = joueurBoss60("a@example.com")({ action: "titan", titan: "t1" });
assert.equal(honnete.ok, false, "puissance réelle insuffisante : refusé");
assert.match(String(honnete.message || ""), /PUISSANCE_INSUFFISANTE/);

const truque = joueurBoss60("b@example.com")({ action: "titan", titan: "t1", stats: FAUX });
assert.equal(truque.ok, false, "des stats falsifiées ne franchissent pas la barrière");
assert.match(String(truque.message || ""), /PUISSANCE_INSUFFISANTE/, "même refus qu'avec des stats honnêtes");

// Même résultat pour un combat de titan et un kill de zone avec ou sans stats imposées : le serveur les ignore.
for (const action of ["startTitanFight", "zoneKill", "resolveZoneFight"]) {
  const a = joueurBoss60("c@example.com")(Object.assign({ action, titan: "t1" }));
  const b = joueurBoss60("d@example.com")(Object.assign({ action, titan: "t1", stats: FAUX }));
  assert.equal(b.ok, a.ok, action + " : les stats du client ne changent rien (ok)");
  assert.equal(String(b.message || ""), String(a.message || ""), action + " : les stats du client ne changent rien (message)");
}
console.log("idle-audit-securite-stats-serveur-v1: OK");
