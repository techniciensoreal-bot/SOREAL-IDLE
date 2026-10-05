import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

/*
 * Audit d'Entraînement avancé (Norman, 2026-10-05 : « fais un audit de Entraînement avancé uniquement »). Mesuré en local :
 *  - au repos, le suivi des pistes (niveau, bonus) réécrivait ses textes ~7 fois par seconde même identiques : ~40 modifications de page par seconde, 0 après correction ;
 *  - des « + » sur trois pistes partaient en trois appels (et « Tout retirer » en un par piste) -> un seul appel `allocateAdvancedTrainings` pour le lot, au résultat identique ;
 *  - un clic sans effet envoyait quand même un appel -> plus d'envoi.
 */
const { runSorealIdleOperation } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-sqlite-runtime.js").href);
const { SorealIdleCoordinatorV1 } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/index-idle-coordinator-v1.js").href);
const HEADERS = ["ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force","Endurance","Organisation","Puissance","Boss actuel","PV boss","PV boss max","Boss vaincus","Dernière synchro","Public","Rang","Email principal","Email connexion","Pièces","Inventaire JSON","Équipement JSON","Améliorations JSON","Renaissances","Essence renaissance","PV joueur","PV joueur max","KO jusqu'à","Zone aventure","Progression aventure JSON","Points aventure","Dernière action aventure","Matériaux","Collection JSON","Date début","Capacité inventaire","Stats JSON"];
function partie() {
  const db = new DatabaseSync(":memory:");
  const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
  db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
  new SorealIdleCoordinatorV1({ storage: { sql } }, {});
  for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
  sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "JOUEURS", 1, JSON.stringify(HEADERS), Date.now());
  [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]].forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "IDLE_BOUTIQUE", i + 1, JSON.stringify(l), Date.now()));
  const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
  const run = (op, ...a) => runSorealIdleOperation(sql, op, ["local", ...a], user);
  run("obtenirEtatSorealIdle");
  const ligne = sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const arr = JSON.parse(ligne.row_json);
  arr[14] = 140; arr[4] = 50000; arr[5] = 100000; arr[6] = 0;
  { const st = JSON.parse(arr[37] || "{}"); Object.values((st.entrainementBase || {}).skills || {}).forEach((k) => { k.level = 200000; }); arr[37] = JSON.stringify(st); }
  db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  run("synchroniserSorealIdle");
  return run;
}
const pistes = (r) => { const a = r.joueur.systemes.systems.find((x) => x.id === "advancedTraining"); return { u: a.state.unlocked, p: Object.fromEntries(Object.entries(a.state.data.tracks).map(([k, v]) => [k, v.energy])), alloc: a.state.allocation.energy, libre: r.joueur.energie }; };
const base = pistes(partie()("obtenirEtatSorealIdle"));
assert.equal(base.u, true, "Advanced Training débloqué pour le test");
const ids = Object.keys(base.p).slice(0, 3);
const items = [{ track: ids[0], value: 60 }, { track: ids[1], value: 40 }, { track: ids[2], value: 25 }];
// 1. Le lot donne exactement le même état que les allocations une par une.
const seq = partie();
let rs;
for (const it of items) rs = seq("agirProgressionSorealIdle", { action: "allocateAdvancedTraining", ...it });
const lot = partie();
const rl = lot("agirProgressionSorealIdle", { action: "allocateAdvancedTrainings", items });
assert.equal(rl.ok, true);
const A = pistes(rs), B = pistes(rl);
assert.deepEqual(B.p, A.p, "mêmes énergies par piste");
assert.equal(B.alloc, A.alloc);
assert.ok(ids.every((id, i) => B.p[id] === items[i].value), "les valeurs demandées sont posées");
// « Tout retirer » en un lot : tout revient à zéro.
const rz = lot("agirProgressionSorealIdle", { action: "allocateAdvancedTrainings", items: items.map((i) => ({ track: i.track, value: 0 })) });
assert.ok(Object.values(pistes(rz).p).every((v) => v === 0), "tout retiré en un appel");

// 2. Client.
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
assert.ok(meta.includes("envoi={action:'allocateAdvancedTrainings',items:") && meta.includes("if(delta===0)return;") && meta.includes("envoyerAllocRapideV1_({action:'allocateAdvancedTraining',track:id,value:valeur});"), "lot et pas d'envoi sans changement");
const tick = meta.slice(meta.indexOf("      function atTickIdleV1_(){"), meta.indexOf("      if(typeof setInterval==='function'&&!window.__SOREAL_IDLE_AT_TICK_V1__){"));
assert.ok(!tick.includes("if(nivEl)nivEl.textContent=") && !tick.includes("if(bonusEl)bonusEl.textContent=") && tick.includes("if(nivEl.textContent!==t)") && tick.includes("if(bonusEl.textContent!==t)"), "niveau et bonus réécrits seulement s'ils changent");
console.log("idle-entrainement-avance-audit-v1: OK");
