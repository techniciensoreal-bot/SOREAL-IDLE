// Norman (2026-11-05) : « on doit quand même pouvoir jouer de plusieurs appareils ; on reprend la partie la plus récente quand on se connecte ailleurs ».
// Tests de reprise écrits AVANT l'état en mémoire du moteur (design/PLAN-MOTEUR-UNIQUE.md, étape 2) : ils décrivent le comportement à préserver, de bout en bout côté serveur (export = connexion, envoi = sauvegarde).
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { exporterPourMoteurLocalV1, recevoirDuMoteurLocalV1, listerSauvegardesLocalesV1 } from "../src/idle-local-sync-v1.js";

const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
const coord = new SorealIdleCoordinatorV1({ storage: { sql } }, {});
for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
const src = fs.readFileSync(new URL("../tools/local-dev-server.mjs", import.meta.url), "utf8");
const HEADERS_ = new Function(src.match(/const HEADERS_ = (\[.*?\]);/)[1].replace(/^/, "return "))();
const feuille = (nom, lignes) => lignes.forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", nom, i + 1, JSON.stringify(l), Date.now()));
feuille("JOUEURS", [HEADERS_]);
feuille("IDLE_BOUTIQUE", [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]]);
const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
const T = coord.consumeLaunchTicketV1(coord.createLaunchTicketV1({ source: "tv", user }).ticket).sessionToken;
coord.runStandaloneSessionOperationV1({ sessionToken: T, operation: "obtenirEtatSorealIdle", args: [T] });
const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));
const SYNCHRO = 15;   // colonne « dernière synchro » (version de la ligne)
// Marqueur de partie : le compteur de clics des statistiques (colonne Stats JSON), que le moteur ne recalcule jamais (la colonne « Puissance » est recalculée à chaque lecture).
const marque = (ligne) => JSON.parse(ligne[37]).clicsTotal;
const poserMarque = (ligne, v) => { const st = JSON.parse(ligne[37]); st.clicsTotal = v; ligne[37] = JSON.stringify(st); };
const indexJoueur = exporterPourMoteurLocalV1(coord, T, "init", true).joueurs.index;
const serveur = () => JSON.parse(sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=?", indexJoueur)[0].row_json);
const se_connecte = (appareil) => { const e = exporterPourMoteurLocalV1(coord, T, appareil); return { exp: e, ligne: JSON.parse(e.joueurs.ligne), depuis: e.serveurAt }; };
const envoie = (ap, valeur, dateMs, extra) => { const c = ap.ligne.slice(); poserMarque(c, valeur); c[SYNCHRO] = new Date(dateMs).toISOString(); return recevoirDuMoteurLocalV1(coord, Object.assign({ sessionToken: T, cells: c, appareil: ap.nom, depuis: ap.depuis }, extra || {})); };
const appareil = (nom) => Object.assign(se_connecte(nom), { nom });
await attendre(30);

// 1. A joue et envoie ; B se connecte ailleurs : B reçoit la partie la plus RÉCENTE (celle de A)
let A = appareil("A");
let r = envoie(A, 100, Date.now());
assert.equal(r.ok, true); assert.equal(r.ecrit, true, "A : envoi pris");
await attendre(30);
let B = appareil("B");
assert.equal(marque(B.ligne), 100, "1. B voit l'état le plus récent de A");
assert.equal(marque(serveur()), 100);

// 2. B joue et envoie ; A (ancien onglet, connecté AVANT B) tente d'envoyer : refus « partie reprise ailleurs », l'état de B n'est jamais écrasé
await attendre(30);
r = envoie(B, 200, Date.now());
assert.equal(r.ecrit, true, "B : envoi pris");
await attendre(30);
r = envoie(A, 150, Date.now(), { depuis: A.depuis });
assert.equal(r.ok, false); assert.equal(r.conflit, true, "2. A reçoit le conflit (écran « Partie reprise sur un autre appareil »)");
assert.equal(r.error, "IDLE_PARTIE_REPRISE_AILLEURS");
assert.equal(marque(serveur()), 200, "2. l'état de B n'est pas écrasé");

// 3. Fermeture brutale de B après son dernier envoi (300) : sa copie locale (350) n'est jamais partie. A se reconnecte : elle voit 300 (le dernier envoi).
await attendre(30);
envoie(B, 300, Date.now());
const localB = 350, dateLocaleB = Date.now() + 20;   // plus récente que le serveur, jamais envoyée
await attendre(30);
A = appareil("A");
assert.equal(marque(A.ligne), 300, "3. après la fermeture brutale de B, A reprend le dernier envoi de B");
// 3a. A joue et envoie 400 ; B revient avec sa copie locale (350) : refus, et le choix « garder la partie de cet appareil » ne détruit pas 400 (copie avant écrasement)
await attendre(30);
envoie(A, 400, Date.now());
await attendre(30);
r = envoie(B, localB, dateLocaleB, { depuis: B.depuis });
assert.equal(r.conflit, true, "3a. B revenu avec une copie locale : conflit");
assert.equal(marque(serveur()), 400);
const avant = listerSauvegardesLocalesV1(coord, user.email).length;
/* Le choix passe par une nouvelle connexion (l'appareil revendique la partie) puis l'envoi avec choixAppareil : sans cela, le conflit « reprise ailleurs » l'emporte. */
B = appareil("B");
await attendre(30);
r = envoie(B, localB, Date.now() + 40, { depuis: B.depuis, choixAppareil: true });
assert.equal(r.ok, true); assert.equal(r.ecrit, true, "3a. le joueur choisit la partie de B : elle remplace");
assert.equal(marque(serveur()), 350);
const apres = listerSauvegardesLocalesV1(coord, user.email);
assert.ok(apres.length > avant && apres.some((x) => x.motif === "avant-choix-appareil"), "3a. la partie remplacée (400) est gardée avant écrasement");
// 3b. si personne d'autre n'a joué : l'appareil qui revient avec une copie plus récente la renvoie après s'être reconnecté (reprise de la copie locale plus récente)
await attendre(30);
const C = appareil("C");
await attendre(30);
r = envoie(C, 500, Date.now() + 60);
assert.equal(r.ecrit, true, "3b. une copie locale plus récente est reprise");
assert.equal(marque(serveur()), 500);

// 4. deux onglets du MÊME appareil : même identifiant, aucun conflit entre eux ; la version la plus récente gagne, un envoi plus ancien n'écrase jamais
await attendre(30);
const onglet1 = appareil("D"), onglet2 = appareil("D");
r = envoie(onglet1, 600, Date.now() + 80);
assert.equal(r.ok, true); assert.equal(r.ecrit, true);
r = envoie(onglet2, 550, Date.now() - 5000);
assert.equal(r.conflit, undefined, "4. pas de conflit entre deux onglets du même appareil");
assert.equal(r.ecrit, false, "4. un état plus ancien n'écrase jamais un plus récent");
assert.equal(marque(serveur()), 600);

console.log("idle-reprise-multi-appareils-v1: OK");
