import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { runSorealIdleOperation } from "../src/idle-sqlite-runtime.js";

/*
 * Norman (2026-09-25) — classement des joueurs : boss le plus élevé, Rebirths, meilleur NUMBER, EXP totale gagnée, temps de jeu, succès ;
 * classement par statistique ET global à points ; tous les comptes IDLE y figurent ; un joueur qui reset reste présent, en bas, à 0 ;
 * le bouton n'est visible que de l'administrateur pour l'instant.
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
const norman = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
/* idleTrophee : drapeau posé par le Worker TV (trophée « Assiduité de bronze » débloqué), jamais par le navigateur. */
const sebastien = { email: "hodappsebastien@gmail.com", emailConnexion: "hodappsebastien@gmail.com", emails: ["hodappsebastien@gmail.com"], prenom: "Sébastien", idleTrophee: true };
const sansTrophee = { email: "sans.trophee@example.com", emailConnexion: "sans.trophee@example.com", emails: ["sans.trophee@example.com"], prenom: "Sans", idleTrophee: false };
const op = (nom, user, ...args) => runSorealIdleOperation(sql, nom, ["x", ...args], user);

// Interrupteur d'accès (2026-09-25) : par défaut fermé, plus d'accès spécial pour Sébastien ; l'administrateur l'ouvre depuis les Paramètres
const acces = (user) => runSorealIdleOperation(sql, "obtenirAccesSorealIdle", ["x"], user);
assert.equal(acces(norman).autorise, true, "administrateur : toujours autorisé");
assert.equal(acces(sebastien).autorise, false, "Sébastien n'a plus d'accès spécial : accès fermé par défaut");
assert.throws(() => op("definirAccesOuvertSorealIdle", sebastien, true), /ACCES_REFUSE/);
const etatNorman = op("obtenirEtatSorealIdle", norman).joueur;
assert.deepEqual({ ...etatNorman.reglages }, { accesOuvert: false }, "réglage visible de l'administrateur, fermé par défaut");
assert.equal(op("definirAccesOuvertSorealIdle", norman, true).accesOuvert, true);
assert.equal(acces(sebastien).autorise, true, "accès ouvert : le détenteur du trophée Assiduité de bronze est autorisé, comme les autres");
assert.equal(acces(sansTrophee).autorise, false, "accès ouvert mais pas de trophée : pas d'accès");
assert.equal(acces(Object.assign({}, sansTrophee, { idleTrophee: "true" })).autorise, false, "seul le drapeau booléen posé par TV compte");
const etatSeb = op("obtenirEtatSorealIdle", sebastien).joueur;
assert.equal(etatNorman.classement.debloque, true, "administrateur : bouton visible");
assert.equal(etatSeb.classement.debloque, false, "autres joueurs : bouton Classement pas encore visible");
assert.equal(etatSeb.reglages, null, "l'interrupteur n'est visible que de l'administrateur");
assert.throws(() => op("definirAccesOuvertSorealIdle", sebastien, false), /ADMIN_REQUIS/);
// Partie B de développement (adresse alias) et entrée sans nom : jamais au classement
const normanB = Object.assign({}, norman, { slot: "b" });
op("obtenirEtatSorealIdle", normanB);
const inconnu = { email: "sans.nom@example.com", emailConnexion: "sans.nom@example.com", emails: ["sans.nom@example.com"], prenom: "Joueur", idleTrophee: true };
op("obtenirEtatSorealIdle", inconnu);

function regler(email, records, succes = 0) {
  const lignes = db.prepare("select rowid as id, row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1").all();
  const l = lignes.find((x) => JSON.parse(x.row_json)[18] === email);
  const arr = JSON.parse(l.row_json);
  const stats = JSON.parse(arr[37]);
  Object.assign(stats.metaNgu.records, records);
  stats.metaNgu.systems.achievements.data.unlocked = Object.fromEntries(Array.from({ length: succes }, (_, i) => ["a" + i, 1]));
  arr[37] = JSON.stringify(stats);
  db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), l.id);
}
regler("technicien.soreal@gmail.com", { highestBoss: 40, totalRebirths: 5, bestNumber: 1200, totalExpEarned: 9000, playSeconds: 7200 }, 12);
regler("hodappsebastien@gmail.com", { highestBoss: 55, totalRebirths: 2, bestNumber: 300, totalExpEarned: 20000, playSeconds: 3600 }, 4);

// Seul l'administrateur reçoit le classement
assert.throws(() => op("obtenirClassementSorealIdle", sebastien), /CLASSEMENT_VERROUILLE/);
let c = op("obtenirClassementSorealIdle", norman);
assert.equal(c.ok, true);
assert.equal(c.joueurs, 2);
const nom = (x) => x.nom;
const moi = c.entrees.find((e) => e.moi);
assert.equal(moi.nom, "Norman");
const seb = c.entrees.find((e) => !e.moi);
// Rangs par statistique : Sébastien devant en boss et EXP ; Norman devant en Rebirths, NUMBER, temps, succès
assert.deepEqual({ ...seb.rangs }, { boss: 1, rebirths: 2, number: 2, exp: 1, playSeconds: 2, achievements: 2 });
assert.deepEqual({ ...moi.rangs }, { boss: 2, rebirths: 1, number: 1, exp: 2, playSeconds: 1, achievements: 1 });
// Points : rang r -> (2 - r + 1) ; global = somme
assert.equal(seb.points, 2 + 1 + 1 + 2 + 1 + 1);
assert.equal(moi.points, 1 + 2 + 2 + 1 + 2 + 2);
assert.equal(moi.rang, 1);
assert.equal(seb.rang, 2);
assert.equal(seb.valeurs.boss, 55, "numéro du boss le plus élevé (pas d'anti-spoil dans le classement)");

// Un joueur qui reset reste présent, à 0, tout en bas
op("reinitialiserCompteCompletSorealIdle", sebastien);
c = op("obtenirClassementSorealIdle", norman);
assert.equal(c.joueurs, 2, "le joueur réinitialisé reste listé");
const apres = c.entrees.find((e) => e.nom === "Sébastien" || !e.moi);
assert.ok(apres, "présent");
assert.deepEqual({ ...apres.valeurs }, { boss: 0, rebirths: 0, number: 0, exp: 0, playSeconds: 0, achievements: 0 });
assert.equal(apres.rang, 2, "en bas du classement");
// Puis il rejoue : nouvelle partie, toujours dans le classement (une seule entrée)
op("obtenirEtatSorealIdle", sebastien);
c = op("obtenirClassementSorealIdle", norman);
assert.equal(c.joueurs, 2);
assert.equal(c.entrees.filter((e) => !e.moi).length, 1);

// Ordre des menus enregistré (Rangement des boutons)
const r = op("definirOrdreMenusSorealIdle", norman, ["combat", "entrainement", "faux id!", "combat", "classement"]);
assert.deepEqual(r.menuOrdre, ["combat", "entrainement", "classement"], "identifiants valides, sans doublon");
assert.deepEqual(op("obtenirEtatSorealIdle", norman).joueur.profil.stats.menuOrdre, ["combat", "entrainement", "classement"]);

// Fermer l'accès le cache à tout le monde (sauf à l'administrateur)
assert.equal(op("definirAccesOuvertSorealIdle", norman, false).accesOuvert, false);
assert.equal(acces(sebastien).autorise, false, "accès fermé : caché à tout le monde");
assert.throws(() => op("obtenirEtatSorealIdle", sebastien), /ACCES_REFUSE/);
assert.equal(acces(norman).autorise, true, "l'administrateur garde son accès");

console.log("idle-leaderboard-v1: OK");
