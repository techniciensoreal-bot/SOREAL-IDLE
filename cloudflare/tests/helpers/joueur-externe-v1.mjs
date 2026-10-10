import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../../src/index-idle-coordinator-v1.js";
import { runSorealIdleOperation } from "../../src/idle-sqlite-runtime.js";

/*
 * Harnais d'audit de sécurité (2026-10-10) : un VRAI joueur ordinaire (compte externe, accès public ouvert) qui appelle les opérations par le chemin public (runSorealIdleOperation), sur un SQLite en mémoire.
 * Sert aux tests qui vérifient ce qu'un client peut ou ne peut pas obtenir du serveur.
 */
const ENTETES = ["ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force","Endurance","Organisation","Puissance","Boss actuel","PV boss","PV boss max","Boss vaincus","Dernière synchro","Public","Rang","Email principal","Email connexion","Pièces","Inventaire JSON","Équipement JSON","Améliorations JSON","Renaissances","Essence renaissance","PV joueur","PV joueur max","KO jusqu'à","Zone aventure","Progression aventure JSON","Points aventure","Dernière action aventure","Matériaux","Collection JSON","Date début","Capacité inventaire","Stats JSON"];

export function creerJoueurExterneV1(email = "joueur.test@example.com") {
  const db = new DatabaseSync(":memory:");
  const journalSql = [];
  const sql = {
    exec(q, ...b) {
      journalSql.push([q, b]);
      const st = db.prepare(q);
      if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b);
      st.run(...b);
      return [];
    }
  };
  db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
  const coordinateur = new SorealIdleCoordinatorV1({ storage: { sql } }, {});
  for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
  const feuille = (nom, lignes) => lignes.forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", nom, i + 1, JSON.stringify(l), Date.now()));
  feuille("JOUEURS", [ENTETES]);
  feuille("IDLE_BOUTIQUE", [["Type","CoutBase","Croissance","BonusParNiveau"],["production",20,1.6,1],["capacite",20,1.6,1],["puissance",20,1.6,1]]);
  sql.exec("INSERT INTO idle_meta(meta_key,meta_value) VALUES('acces_public','1')");
  const user = { email, emailConnexion: email, emails: [email], prenom: "Joueur", role: "externe", externe: true };
  return { db, sql, user, journalSql, coordinateur, op: (nom, ...args) => runSorealIdleOperation(sql, nom, args, user) };
}
