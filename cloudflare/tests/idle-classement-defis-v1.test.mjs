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

/*
 * Norman (2026-10-27) : « dans les classements, retire Combat le plus long et ajoute le classement défis, avec ses sous-menus : chacun des défis et le temps accompli pour le terminer. Les gens ne doivent pas voir les défis qu'ils n'ont pas
 * encore débloqués dans le jeu. »
 * Le SERVEUR ne renvoie que les défis que le spectateur voit (débloqués, actifs ou terminés) : ni le nom ni les temps des autres.
 */
function defis(email, records, bestMs) {
  const lignes = db.prepare("select rowid as id, row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1").all();
  const l = lignes.find((x) => JSON.parse(x.row_json)[18] === email);
  const arr = JSON.parse(l.row_json);
  const stats = JSON.parse(arr[37]);
  Object.assign(stats.metaNgu.records, records);
  stats.metaNgu.systems.challenges.unlocked = true;
  stats.metaNgu.challenge = Object.assign(stats.metaNgu.challenge || {}, { bestMs });
  arr[37] = JSON.stringify(stats);
  db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), l.id);
}
// Norman a battu le boss 60 (Basic débloqué) et fini Basic en 5 000 s ; Sébastien n'a que Basic fini en 4 000 s, mais a aussi fini Troll en 9 000 s (Norman ne l'a pas débloqué)
defis("technicien.soreal@gmail.com", { highestBoss: 60 }, { basic: 5_000_000 });
defis("hodappsebastien@gmail.com", { highestBoss: 50 }, { basic: 4_000_000, troll: 9_000_000 });

const cN = op("obtenirClassementSorealIdle", norman);
assert.ok(!cN.stats.includes("combatLong"), "plus de classement du combat le plus long");
assert.ok(cN.defis && Array.isArray(cN.defis.visibles));
const idsN = cN.defis.visibles.map((d) => d.id);
assert.ok(idsN.includes("basic"), "Basic : débloqué et terminé");
assert.ok(idsN.includes("twentyFourHours"), "24 Hour : débloqué par Basic en moins de 24 h, même sans temps");
assert.ok(!idsN.includes("troll"), "Troll : pas débloqué par Norman, jamais visible");
assert.ok(!("troll" in cN.defis.classements), "aucun temps d'un défi verrouillé n'est envoyé");
assert.ok(!JSON.stringify(cN).includes("Troll"), "pas même le nom d'un défi verrouillé");
const basic = cN.defis.classements.basic;
assert.deepEqual(basic.map((e) => [e.nom, e.ms, e.rang]), [["Sébastien", 4_000_000, 1], ["Norman", 5_000_000, 2]], "du temps le plus court au plus long");
assert.equal(basic[1].moi, true);
assert.deepEqual(cN.defis.classements.twentyFourHours, [], "personne n'a terminé 24 Hour");
// Sébastien : ne voit que ses défis (Basic terminé, Troll terminé) ; 24 Hour requiert Basic en moins de 24 h : terminé en 4 000 s, donc visible aussi
const cS = op("obtenirClassementSorealIdle", sebastien);
const idsS = cS.defis.visibles.map((d) => d.id);
assert.ok(idsS.includes("troll") && idsS.includes("basic"), "ses défis terminés sont visibles pour lui");
assert.equal(cS.defis.classements.troll.length, 1);
assert.deepEqual(cS.defis.classements.troll.map((e) => e.nom), ["Sébastien"], "Norman n'a pas terminé Troll");
// un joueur sans aucun défi ne voit aucune sous-section
const cache = op("obtenirClassementSorealIdle", norman);
assert.equal(cache.entrees.every((e) => !("defis" in e) && !("metaBrut" in e)), true, "rien de brut n'est renvoyé");
// client : onglet « Défis » seulement s'il y a des défis visibles, sous-menus, temps lisible, rien du combat le plus long
import { readFileSync } from "node:fs";
const ui = readFileSync("cloudflare/public/modules/ui-chroniques-v1.js", "utf8");
assert.ok(ui.includes("{id:'defis',nom:'⚔️ Défis'}") && ui.includes("return visibles.length?IDLE_CLASSEMENT_ONGLETS_V1.concat([IDLE_CLASSEMENT_ONGLET_DEFIS_V1]):IDLE_CLASSEMENT_ONGLETS_V1;"), "l'onglet Défis n'existe que s'il y a un défi visible");
assert.ok(ui.includes("window.__changerDefiClassementIdleV1__=changerDefiClassementIdleV1_;") && ui.includes("soreal-idle-classement-defis-v1"), "sous-menus : un par défi");
assert.ok(ui.includes("if(onglet==='defis')return tete+onglets+pageClassementDefisIdleV1_(d);"));
assert.ok(ui.includes("function formaterTempsDefiIdleV1_(ms)") && ui.includes("' min '+dd(sec)+' s'"), "temps lisible");
assert.ok(!/combatLong|Combat le plus long/.test(ui), "plus rien du combat le plus long dans le classement");
const fmt = new Function("idleNombre_", ui.slice(ui.indexOf("function formaterTempsDefiIdleV1_(ms)"), ui.indexOf("function changerOngletClassementIdleV1_")) + "return formaterTempsDefiIdleV1_;")((x) => Number(x) || 0);
assert.equal(fmt(11_560_000), "3 h 12 min 40 s");
assert.equal(fmt(725_000), "12 min 05 s");
assert.equal(fmt(48_000), "48 s");
console.log("idle-classement-defis-v1: OK");
