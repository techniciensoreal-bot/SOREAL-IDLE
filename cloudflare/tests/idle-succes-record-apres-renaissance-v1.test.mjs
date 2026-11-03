import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { runSorealIdleOperation } from "../src/idle-sqlite-runtime.js";

/*
 * Norman (2026-11-03) : « dans Succès, certains succès nécessitent de tuer un boss. Quand on rebirth, ces succès ne doivent pas être recachés : on a déjà tué le boss 100 dans notre partie, on doit toujours pouvoir y avoir accès. »
 * Le record du compte (records.highestBoss) est un maximum permanent ; le compteur « boss vaincus » du run, lui, repart à 0 à chaque Renaissance. La visibilité d'un succès (idle-ngu-bonus.js, achievementsSnapshotV1, masquage fait par le SERVEUR)
 * ne dépend que du record : cette simulation de bout en bout (vrai moteur, vraie Renaissance, SQLite en mémoire) verrouille que rien ne se recache après une Renaissance, que le record soit déjà enregistré ou qu'il ne soit encore porté que
 * par le compteur du run (cas d'une partie dont le record n'a pas encore été écrit).
 */
function partie(recordInitial, bossDuRun) {
  const db = new DatabaseSync(":memory:");
  const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
  db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
  new SorealIdleCoordinatorV1({ storage: { sql } }, {});
  for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
  const HEADERS = ["ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force","Endurance","Organisation","Puissance","Boss actuel","PV boss","PV boss max","Boss vaincus","Dernière synchro","Public","Rang","Email principal","Email connexion","Pièces","Inventaire JSON","Équipement JSON","Améliorations JSON","Renaissances","Essence renaissance","PV joueur","PV joueur max","KO jusqu'à","Zone aventure","Progression aventure JSON","Points aventure","Dernière action aventure","Matériaux","Collection JSON","Date début","Capacité inventaire","Stats JSON"];
  const feuille = (nom, lignes) => lignes.forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", nom, i + 1, JSON.stringify(l), Date.now()));
  feuille("JOUEURS", [HEADERS]);
  feuille("IDLE_BOUTIQUE", [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]]);
  const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
  const lire = () => runSorealIdleOperation(sql, "obtenirEtatSorealIdle", ["local"], user);
  lire();
  const ligne = sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const arr = JSON.parse(ligne.row_json);
  arr[14] = bossDuRun;
  const stats = JSON.parse(arr[37] || "{}");
  const m = (stats.metaNgu = stats.metaNgu || {});
  m.records = Object.assign({}, m.records, { highestBoss: recordInitial, totalRebirths: 40 });
  m.systems = m.systems || {};
  for (const k of ["ngu", "yggdrasil", "beards"]) m.systems[k] = Object.assign({}, m.systems[k], { unlocked: true });
  m.runStartedAt = Date.now() - 600_000;
  arr[37] = JSON.stringify(stats);
  db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  const cachees = (j) => j.systemes.achievements.list.filter((x) => !x.name).map((x) => x.id + ":" + x.voirApresBoss).sort();
  const avant = lire().joueur;
  const renaissance = runSorealIdleOperation(sql, "renaitreSorealIdle", ["local"], user);
  assert.equal(renaissance.ok, true, JSON.stringify(renaissance));
  const apres = renaissance.joueur;
  const relu = lire().joueur;
  const enregistre = JSON.parse(JSON.parse(sql.exec("select row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0].row_json)[37]).metaNgu.records.highestBoss;
  return { avant, apres, relu, enregistre, cachees };
}

for (const [recordInitial, bossDuRun] of [[100, 100], [0, 100]]) {
  const { avant, apres, relu, enregistre, cachees } = partie(recordInitial, bossDuRun);
  assert.equal(avant.bossVaincus, 100);
  assert.equal(apres.bossVaincus, 0, "le compteur du run repart à 0 à la Renaissance");
  assert.equal(enregistre, 100, "le record du compte survit à la Renaissance (même s'il n'était encore porté que par le compteur du run)");
  /* Rien ne se recache : même liste de succès masqués avant, juste après, et à la lecture suivante. */
  assert.deepEqual(cachees(apres), cachees(avant), "aucun succès ne repasse en « ????? » après une Renaissance");
  assert.deepEqual(cachees(relu), cachees(avant));
  const liste = apres.systemes.achievements.list;
  assert.equal(liste.find((x) => x.id === "boss_100").unlocked, true, "« Defeat Boss 100 » reste obtenu");
  assert.equal(liste.find((x) => x.id === "boss_100").name, "Defeat Boss 100");
  /* Les seuls masqués : un boss plus loin que le record (> 100), les boss non vaincus, et les trophées de menu qui ne se dévoilent qu'une fois obtenus (décision de Norman, 2026-10-16). */
  const menuSecret = new Set(["secretNguMenu", "secretYggdrasilMenu", "secretBeardsMenu", "secretAtCorner"]);
  for (const x of liste.filter((y) => !y.name)) {
    assert.ok(x.group === "boss" || menuSecret.has(x.id) || x.voirApresBoss > 100, "masqué à tort après Renaissance : " + x.id + " (boss à tuer : " + x.voirApresBoss + ")");
  }
  assert.equal(liste.filter((x) => x.group === "boss" && x.unlocked).length, 10, "les dix « Defeat Boss N » jusqu'à 100 sont obtenus et visibles");
}
console.log("idle-succes-record-apres-renaissance-v1: OK");
