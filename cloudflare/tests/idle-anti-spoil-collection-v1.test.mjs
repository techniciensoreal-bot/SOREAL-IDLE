import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { runSorealIdleOperation } from "../src/idle-sqlite-runtime.js";

/*
 * Norman (2026-09-24) : « Fais attention à ne pas spoil… Il ne doivent pas voir qu'il y a 301 boss. Dans collection, il ne faut pas
 * montrer toutes les cases disponibles ni le nombre d'items à devoir placer. Garde vraiment cette façon de penser pour le projet. »
 * Le joueur ne reçoit (et ne voit) que ce qu'il a déjà découvert.
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

// --- Serveur : un joueur qui n'a rien découvert ne reçoit AUCUNE entrée de collection ni aucun emplacement de coffre ---
{
  const r = runSorealIdleOperation(sql, "obtenirEtatSorealIdle", ["x"], user);
  const j = r.joueur;
  assert.ok(j && j.bestiaire, "état joueur reçu");
  assert.equal(j.bestiaire.decouvertes, 0);
  assert.deepEqual(j.bestiaire.entrees, [], "aucune entrée de Bestiaire (ni « ??? ») : le nombre de boss ne se déduit pas de la liste");
  const aventure = j.systemes && j.systemes.adventure;
  assert.ok(aventure, "état d'aventure présent");
  assert.deepEqual(aventure.coffreSlots, [], "aucun emplacement de coffre exposé avant d'avoir découvert un objet");
  const brut = JSON.stringify(j.bestiaire);
  assert.ok(!/301|"total"/.test(brut), "aucun total de boss dans le Bestiaire");
}

// --- Client : plus de dénominateur, plus de cases vides ---
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(!ui.includes("/???"), "les onglets de Collection ne montrent plus « n/??? »");
assert.ok(!/Coffre \('\+occupees\+' \/ '\+slots\.length/.test(ui), "le Coffre ne montre plus son nombre total d'emplacements");
assert.match(ui, /🗄️ Coffre \('\+occupees\+'\)/);
assert.ok(!/'Découverts '\+vus\+'\/'\+total/.test(ui) && !/verts\+' \/ '\+total/.test(ui), "les sets n'affichent plus « x/6 »");
assert.match(ui, /if\(!vu\)return '';/, "les pièces de set non vues ne sont pas dessinées");
assert.match(ui, /return Boolean\(itemList\[id\]\)&&setsDemarres\.has\(String\(def\.set\|\|''\)\);/, "Équipement : seulement les pièces obtenues");

console.log("idle-anti-spoil-collection-v1: OK");
