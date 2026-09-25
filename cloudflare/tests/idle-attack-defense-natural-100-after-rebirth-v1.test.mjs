import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { runSorealIdleOperation } from "../src/idle-sqlite-runtime.js";

/*
 * Norman (2026-09-25), jeux côte à côte : « mes PV sont à 209 K dans SOREAL IDLE alors qu'ils ne sont qu'à 1 010 dans NGU IDLE (max). Pareil pour
 * l'attaque : NGU fait retomber le joueur à 100 Attack / 100 Defense après un Rebirth. Les bonus accumulés ne se déverrouillent qu'au moment
 * d'avancer dans les boss. »
 * Wiki : NUMBER « multiplies your Attack and Defense from Basic Training » ; le joueur a « a natural attack and defense of 100 ».
 */
const db = new DatabaseSync(":memory:");
const sql = {
  exec(query, ...bindings) {
    const statement = db.prepare(query);
    if (/^\s*(select|pragma|with)/i.test(query)) return statement.all(...bindings);
    statement.run(...bindings);
    return [];
  }
};
db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
new SorealIdleCoordinatorV1({ storage: { sql } }, {});
for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
const HEADERS = ["ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force","Endurance","Organisation","Puissance","Boss actuel","PV boss","PV boss max","Boss vaincus","Dernière synchro","Public","Rang","Email principal","Email connexion","Pièces","Inventaire JSON","Équipement JSON","Améliorations JSON","Renaissances","Essence renaissance","PV joueur","PV joueur max","KO jusqu'à","Zone aventure","Progression aventure JSON","Points aventure","Dernière action aventure","Matériaux","Collection JSON","Date début","Capacité inventaire","Stats JSON"];
const feuille = (nom, lignes) => lignes.forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", nom, i + 1, JSON.stringify(l), Date.now()));
feuille("JOUEURS", [HEADERS]);
feuille("IDLE_BOUTIQUE", [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]]);
const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };

const lire = () => runSorealIdleOperation(sql, "obtenirEtatSorealIdle", ["x"], user).joueur;
lire(); // crée le joueur

function regler({ number, niveauAttaque = 0, niveauDefense = 0, bossesRun = 0 }) {
  /* La vérité est la ligne JOUEURS de idle_catalog (idle_players n'en est qu'une copie). */
  const ligne = db.prepare("select rowid as id, row_json from idle_catalog where sheet_name='JOUEURS' and row_index=2").all()[0];
  const arr = JSON.parse(ligne.row_json);
  const stats = JSON.parse(arr[37]);
  stats.metaNgu.rebirth.number = number;
  stats.entrainementBase.skills.attaque_passive.level = niveauAttaque;
  stats.entrainementBase.skills.blocage.level = niveauDefense;
  arr[37] = JSON.stringify(stats);
  arr[14] = bossesRun;
  db.prepare('update idle_catalog set row_json=? where rowid=?').run(JSON.stringify(arr), ligne.id);
  return lire();
}

// 1. Sans aucun point d'entraînement : 100 / 100 / 1 000 PV, quel que soit le NUMBER (comme NGU après un Rebirth)
for (const number of [1, 209, 5e6]) {
  const j = regler({ number });
  assert.equal(j.puissance, 100, "NUMBER " + number + " : attaque naturelle 100");
  assert.equal(j.defense, 100, "NUMBER " + number + " : défense naturelle 100");
  assert.equal(j.pvJoueurMax, 1000, "NUMBER " + number + " : PV = 10 x Attaque, minimum 1 000");
}

// 2. Avec de l'entraînement : NUMBER multiplie SEULEMENT les points de l'entraînement
{
  const base = regler({ number: 1, niveauAttaque: 1000, niveauDefense: 1000 });
  const points = base.puissance - 100;
  assert.ok(points > 0, "l'entraînement apporte des points");
  const x10 = regler({ number: 10, niveauAttaque: 1000, niveauDefense: 1000 });
  assert.ok(Math.abs(x10.puissance - (100 + points * 10)) <= 5, "100 naturel + entraînement x NUMBER (à l'arrondi près)");
  assert.ok(Math.abs(x10.defense - (100 + (base.defense - 100) * 10)) <= 5);
  assert.equal(x10.combatPrincipal.multiplicateurAttaqueTotal, 10, "produit exposé au client");
}

console.log("idle-attack-defense-natural-100-after-rebirth-v1: OK");
