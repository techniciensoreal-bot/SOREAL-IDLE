import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";

/*
 * Norman (2026-09-24) : « Quand on rebirth, on a encore les popups quand on va dans les menus. Ils ne doivent arriver qu'une fois.
 * Pareil pour les textes d'accueil etc. » — l'état « déjà vu » est gardé côté serveur (profil.stats.vus) : Renaissance, autre appareil
 * ou stockage local vidé ne rejouent rien.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// --- Serveur, de bout en bout (SQLite en mémoire) ---
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
const coordinator = new SorealIdleCoordinatorV1({ storage: { sql } }, {});
for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
const HEADERS = ["ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force","Endurance","Organisation","Puissance","Boss actuel","PV boss","PV boss max","Boss vaincus","Dernière synchro","Public","Rang","Email principal","Email connexion","Pièces","Inventaire JSON","Équipement JSON","Améliorations JSON","Renaissances","Essence renaissance","PV joueur","PV joueur max","KO jusqu'à","Zone aventure","Progression aventure JSON","Points aventure","Dernière action aventure","Matériaux","Collection JSON","Date début","Capacité inventaire","Stats JSON"];
const feuille = (nom, lignes) => lignes.forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", nom, i + 1, JSON.stringify(l), Date.now()));
feuille("JOUEURS", [HEADERS]);
feuille("IDLE_BOUTIQUE", [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]]);
const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
const ticket = coordinator.createLaunchTicketV1({ source: "tv", user });
const token = coordinator.consumeLaunchTicketV1(ticket.ticket).sessionToken;
const appeler = (operation, args = []) => coordinator.runStandaloneSessionOperationV1({ sessionToken: token, operation, args: [token, ...args] });
const vus = () => appeler("obtenirEtatSorealIdle").joueur.profil.stats.vus;

assert.deepEqual(vus(), [], "un nouveau joueur n'a rien vu");
let r = appeler("marquerVusSorealIdle", [["menu:bestiaire", "tuto:tutoriel_aventure", "bienvenue"]]);
assert.equal(r.ok, true);
assert.deepEqual(vus(), ["menu:bestiaire", "tuto:tutoriel_aventure", "bienvenue"], "les identifiants sont gardés côté serveur");
appeler("marquerVusSorealIdle", [["menu:bestiaire", "menu:augmentations"]]);
assert.deepEqual(vus(), ["menu:bestiaire", "tuto:tutoriel_aventure", "bienvenue", "menu:augmentations"], "idempotent : pas de doublon, l'ordre est conservé");
appeler("marquerVusSorealIdle", [["", "a b", "x".repeat(200), "<script>", "ok:1"]]);
assert.ok(vus().includes("ok:1") && !vus().some((id) => id.includes("<") || id.includes(" ") || id.length > 80), "identifiants invalides écartés");
// Une autre action du jeu ne touche pas à « vus »
const avant = vus().join(",");
appeler("definirAutoBossSuivantSorealIdle", [false]);
assert.equal(vus().join(","), avant, "les autres opérations conservent les « vus » (comme la Renaissance : elle réécrit les mêmes stats)");

// --- Client ---
assert.match(ui, /\.marquerVusSorealIdle\(SOREAL_SESSION,lot\)/);
assert.match(ui, /idleMenuMarquerAcquisV1_[\s\S]{0,700}idleVuMarquerV1_\('menu:'\+menuId\)/, "un menu vu est envoyé au serveur");
assert.match(ui, /function idleMenusAckListeV1_\(j\)\{[\s\S]{0,400}idleVusServeurV1_\(j\)/, "la liste des menus vus inclut le serveur");
assert.match(ui, /idleTutorielPagesDejaVuLocalV1_\(cle\)\|\|idleVuConnuV1_\(idleEtat,idleVuIdTutorielV1_\(cle\)\)/, "tutoriels : local OU serveur");
assert.match(ui, /idleVuMarquerV1_\(idleVuIdTutorielV1_\(cle\)\)/);
assert.match(ui, /idleVuConnuV1_\(j,'bienvenue'\)/, "texte d'accueil : serveur aussi");
assert.match(ui, /idleVusMigrerLocalV1_\(j\);/, "l'existant du navigateur est confié au serveur");
{
  const m = ui.match(/function idleVuIdTutorielV1_\(cle\)\{[\s\S]*?\n      \}\n/)[0];
  const id = new Function(m + "return idleVuIdTutorielV1_;")();
  const gen = "J001|2026-09-24T20:21:54.607Z";
  assert.equal(id("soreal_idle_tutoriel_aventure_v1_" + gen), "tuto:tutoriel_aventure");
  assert.equal(id("soreal_idle_tutoriel_premier_boss_v1_" + gen), "tuto:tutoriel_premier_boss");
  assert.equal(id("soreal_idle_tutoriel_debut_v1_soreal_idle_bienvenue_v75_" + gen), "tuto:tutoriel_debut");
  assert.ok(!id("soreal_idle_tutoriel_aventure_v1_" + gen).includes("J001"), "l'identifiant ne dépend pas du joueur/de la date de début");
}

console.log("idle-seen-popups-server-v1 OK");
