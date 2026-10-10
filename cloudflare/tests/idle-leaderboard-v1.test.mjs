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

// Interrupteur d'accès (2026-09-25) : par défaut fermé pour les autres comptes ; l'administrateur l'ouvre depuis les Paramètres.
// 2026-09-27 (Norman) : revirement -- Sébastien redevient un compte à accès permanent (EMAILS_DEVELOPPEMENT), qui ne dépend plus du tout
// de cet interrupteur ni du trophée. Il n'est cependant toujours pas l'administrateur (ADMIN_SOREAL_IDLE_EMAIL reste réservé à Norman) :
// il a désormais accès au jeu (ACCES_REFUSE ne se déclenche plus pour lui), mais pas le droit de manier l'interrupteur (ADMIN_REQUIS).
const acces = (user) => runSorealIdleOperation(sql, "obtenirAccesSorealIdle", ["x"], user);
assert.equal(acces(norman).autorise, true, "administrateur : toujours autorisé");
assert.equal(acces(sebastien).autorise, true, "Sébastien : accès permanent d'office, quel que soit l'état de l'interrupteur ou du trophée");
assert.throws(() => op("definirAccesOuvertSorealIdle", sebastien, true), /ADMIN_REQUIS/);
const etatNorman = op("obtenirEtatSorealIdle", norman).joueur;
assert.deepEqual({ ...etatNorman.reglages }, { accesOuvert: false, accesPublic: false }, "réglage visible de l'administrateur, fermé par défaut");
assert.equal(op("definirAccesOuvertSorealIdle", norman, true).accesOuvert, true);
assert.equal(acces(sebastien).autorise, true, "toujours autorisé (accès permanent, indépendant de l'interrupteur qu'on vient d'ouvrir ici)");
assert.equal(acces(sansTrophee).autorise, false, "accès ouvert mais pas de trophée : pas d'accès");
assert.equal(acces(Object.assign({}, sansTrophee, { idleTrophee: "true" })).autorise, false, "seul le drapeau booléen posé par TV compte");
const etatSeb = op("obtenirEtatSorealIdle", sebastien).joueur;
assert.equal(etatNorman.classement.debloque, true, "administrateur : bouton visible");
assert.equal(etatSeb.classement.debloque, true, "autres joueurs : bouton Classement visible");
assert.equal(etatSeb.reglages, null, "les réglages administrateur restent réservés à l'administrateur");
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
  /* 2026-09-30 : le classement « Temps de jeu » lit le temps ACTIF (stats.tempsActifSec, battementSorealIdle), plus records.playSeconds (temps écoulé du moteur, rattrapage hors-ligne compris). */
  if (records.playSeconds !== undefined) stats.tempsActifSec = records.playSeconds;
  stats.metaNgu.systems.achievements.data.unlocked = Object.fromEntries(Array.from({ length: succes }, (_, i) => ["a" + i, 1]));
  arr[37] = JSON.stringify(stats);
  db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), l.id);
}
regler("technicien.soreal@gmail.com", { highestBoss: 40, totalRebirths: 5, bestNumber: 1200, totalExpEarned: 9000, playSeconds: 7200 }, 12);
regler("hodappsebastien@gmail.com", { highestBoss: 55, totalRebirths: 2, bestNumber: 300, totalExpEarned: 20000, playSeconds: 3600 }, 4);

// Tous les joueurs autorisés reçoivent le classement
let cSeb = op("obtenirClassementSorealIdle", sebastien);
assert.equal(cSeb.ok, true);
assert.equal(cSeb.joueurs, 2);
assert.equal(cSeb.entrees.find((e) => e.moi).nom, "Sébastien");
let c = op("obtenirClassementSorealIdle", norman);
assert.equal(c.ok, true);
assert.equal(c.joueurs, 2);
const nom = (x) => x.nom;
const moi = c.entrees.find((e) => e.moi);
assert.equal(moi.nom, "Norman");
const seb = c.entrees.find((e) => !e.moi);
// Rangs par statistique : Sébastien devant en boss et EXP ; Norman devant en Rebirths, NUMBER, temps, succès ;
// Clics/Tap (2026-09-27) : aucun des deux n'a cliqué dans ce test -> égalité, rang 1 pour les deux, et surtout EXCLU du
// calcul des points ci-dessous (un compteur brut sans anti-triche ne doit pas fausser le classement Global).
assert.deepEqual({ ...seb.rangs }, { boss: 1, rebirths: 2, number: 2, exp: 1, playSeconds: 2, achievements: 2, clics: 1, combatLong: 1 });
assert.deepEqual({ ...moi.rangs }, { boss: 2, rebirths: 1, number: 1, exp: 2, playSeconds: 1, achievements: 1, clics: 1, combatLong: 1 });
// Points : rang r -> (2 - r + 1) ; global = somme (clics n'y entre jamais)
assert.equal(seb.points, 2 + 1 + 1 + 2 + 1 + 1);
assert.equal(moi.points, 1 + 2 + 2 + 1 + 2 + 2);
assert.equal(moi.rang, 1);
assert.equal(seb.rang, 2);
assert.equal(seb.valeurs.boss, 55, "numéro du boss le plus élevé (pas d'anti-spoil dans le classement)");

// Clics/Tap (2026-09-27, Norman) : compteur cumulatif, sans effet sur les points/rang Global.
assert.equal(op("enregistrerClicsSorealIdle", sebastien, 3).clicsTotal, 3);
assert.equal(op("enregistrerClicsSorealIdle", sebastien, 4).clicsTotal, 7, "cumulatif entre deux appels");
c = op("obtenirClassementSorealIdle", norman);
const sebApresClics = c.entrees.find((e) => !e.moi);
const moiApresClics = c.entrees.find((e) => e.moi);
assert.equal(sebApresClics.valeurs.clics, 7);
assert.equal(moiApresClics.valeurs.clics, 0);
assert.equal(sebApresClics.rangs.clics, 1, "devant sur cet onglet");
assert.equal(moiApresClics.rangs.clics, 2);
assert.equal(moiApresClics.rang, 1, "le classement Global n'a pas bougé : les clics n'y comptent pas");
assert.equal(moiApresClics.points, 1 + 2 + 2 + 1 + 2 + 2, "points Global inchangés (clics exclu de la somme)");

// Un joueur qui reset reste présent, à 0, tout en bas
op("reinitialiserCompteCompletSorealIdle", sebastien);
c = op("obtenirClassementSorealIdle", norman);
assert.equal(c.joueurs, 2, "le joueur réinitialisé reste listé");
const apres = c.entrees.find((e) => e.nom === "Sébastien" || !e.moi);
assert.ok(apres, "présent");
assert.deepEqual({ ...apres.valeurs }, { boss: 0, rebirths: 0, number: 0, exp: 0, playSeconds: 0, achievements: 0, clics: 0, combatLong: 0 });
assert.equal(apres.rang, 2, "en bas du classement");
// Puis il rejoue : nouvelle partie, toujours dans le classement (une seule entrée)
op("obtenirEtatSorealIdle", sebastien);
c = op("obtenirClassementSorealIdle", norman);
assert.equal(c.joueurs, 2);
assert.equal(c.entrees.filter((e) => !e.moi).length, 1);

/*
 * Norman (2026-09-27) : « Je ne veux pas apparaitre dans le classement pour les autres. Uniquement moi. Et
 * avoir une case dans parametres pour pouvoir apparaitre ou disparaitre. » Préférence personnelle, disponible
 * à n'importe quel joueur (jamais réservée à l'administrateur) : caché des AUTRES, jamais de lui-même.
 */
c = op("obtenirClassementSorealIdle", norman);
assert.equal(c.joueurs, 2, "par défaut : tout le monde visible");
assert.equal(op("definirClassementVisibleSorealIdle", sebastien, false).classementVisible, false, "n'importe quel joueur peut se cacher, pas seulement l'administrateur");
c = op("obtenirClassementSorealIdle", norman);
assert.equal(c.joueurs, 1, "Sébastien caché : n'apparaît plus dans le classement vu par Norman");
assert.equal(c.entrees.filter((e) => !e.moi).length, 0, "aucune entrée pour Sébastien");
assert.equal(op("definirClassementVisibleSorealIdle", sebastien, true).classementVisible, true, "peut se rendre à nouveau visible");
c = op("obtenirClassementSorealIdle", norman);
assert.equal(c.joueurs, 2, "de retour dans le classement une fois réactivé");
assert.equal(op("definirClassementVisibleSorealIdle", norman, false).classementVisible, false);
c = op("obtenirClassementSorealIdle", norman);
assert.equal(c.joueurs, 2, "caché ou non, un joueur continue toujours de se voir lui-même");
assert.equal(c.entrees.find((e) => e.moi).nom, "Norman", "Norman se voit toujours lui-même après s'être caché");
assert.equal(op("definirClassementVisibleSorealIdle", norman, true).classementVisible, true, "remis visible pour la suite du test");

// Ordre des menus enregistré (Rangement des boutons)
const r = op("definirOrdreMenusSorealIdle", norman, ["combat", "entrainement", "faux id!", "combat", "classement"]);
assert.deepEqual(r.menuOrdre, ["combat", "entrainement", "classement"], "identifiants valides, sans doublon");
assert.deepEqual(op("obtenirEtatSorealIdle", norman).joueur.profil.stats.menuOrdre, ["combat", "entrainement", "classement"]);

// Fermer l'accès le cache aux comptes qui en dépendaient (sauf à l'administrateur et à Sébastien, tous deux permanents)
assert.equal(op("definirAccesOuvertSorealIdle", norman, false).accesOuvert, false);
assert.equal(acces(inconnu).autorise, false, "accès fermé : caché à un compte qui ne dépendait que de l'interrupteur + trophée");
assert.throws(() => op("obtenirEtatSorealIdle", inconnu), /ACCES_REFUSE/);
assert.equal(acces(norman).autorise, true, "l'administrateur garde son accès");
assert.equal(acces(sebastien).autorise, true, "Sébastien garde son accès permanent même l'interrupteur fermé");

console.log("idle-leaderboard-v1: OK");
