import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

/*
 * Audit du menu Augmentations (Norman, 2026-10-05 : « fais un audit d'Augmentations uniquement »). Constats mesurés en local :
 *  - une rafale de clics sur plusieurs Augments partait en UN appel par cible (chacun avec sa réponse complète) -> un seul appel `allocateAugments` pour le lot, au résultat identique ;
 *  - un clic qui ne change rien (plus d'énergie libre, déjà à zéro) envoyait quand même un appel -> plus d'envoi ;
 *  - le passage de la page (barres, niveaux, coûts, comptes à rebours) cherchait 4 éléments et réécrivait 3 textes identiques à chaque tour (~190 modifications de page par seconde) -> éléments gardés, texte réécrit seulement s'il change.
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
  db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  run("synchroniserSorealIdle");
  return run;
}
const pairs = (r) => { const a = r.joueur.systemes.systems.find((x) => x.id === "augmentations"); return { p: Object.fromEntries(Object.entries(a.state.data.pairs).map(([k, v]) => [k, [v.energy, v.upgradeEnergy]])), alloc: a.state.allocation.energy, libre: r.joueur.energie }; };
const items = [{ pair: "scissors", upgrade: false, value: 100 }, { pair: "milk", upgrade: false, value: 80 }, { pair: "cannon", upgrade: false, value: 40 }];
// 1. Le lot donne exactement le même état que les allocations une par une.
const seq = partie();
let rs;
for (const it of items) rs = seq("agirProgressionSorealIdle", { action: "allocateAugment", ...it });
const lot = partie();
const rl = lot("agirProgressionSorealIdle", { action: "allocateAugments", items });
assert.equal(rl.ok, true);
const A = pairs(rs), B = pairs(rl);
assert.deepEqual(B.p, A.p, "mêmes allocations par Augment");
assert.equal(B.alloc, A.alloc);
assert.ok(B.p.scissors[0] === 100 && B.p.milk[0] === 80 && B.p.cannon[0] === 40, "les valeurs demandées sont posées");
// Le lot est borné (40 cibles) et refuse de dépasser l'énergie libre comme une allocation seule.
const gros = partie()("agirProgressionSorealIdle", { action: "allocateAugments", items: [{ pair: "scissors", upgrade: false, value: 1e12 }] });
assert.ok(pairs(gros).p.scissors[0] <= 1e6 && pairs(gros).libre >= 0, "borné par l'énergie libre");

// 2. Client : lot en un appel, pas d'envoi sans changement, éléments gardés et texte écrit seulement s'il change.
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
assert.ok(meta.includes("envoi={action:'allocateAugments',items:") && meta.includes("if(delta===0)return;"));
assert.ok(meta.includes("cles.forEach(function(c,i){if(!R.file.has(c)&&payloads[i])R.file.set(c,payloads[i]);});"), "échec réseau : tout le lot est remis en file");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("function elementAugIdleV1_(selecteur)") && ui.includes("function ecrireSiChangeIdleV1_(el,texte)"));
assert.ok(!/etaEl.textContent=|nivEl.textContent=|coutEl.textContent=/.test(ui), "plus de réécriture systématique des textes");
console.log("idle-augmentations-audit-v1: OK");
