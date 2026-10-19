import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { exporterPourMoteurLocalV1, recevoirDuMoteurLocalV1, analyserEnvoiLocalV1, lireAlertesLocalesV1, listerSauvegardesLocalesV1, restaurerSauvegardeLocaleV1, sauvegarderSiBesoinLocalV1 } from "../src/idle-local-sync-v1.js";
import { idleOperationNames } from "../src/idle-sqlite-runtime.js";

/*
 * Jeu local (Norman, 2026-10-19) : le moteur tourne dans la page ; le serveur exporte la ligne du joueur au démarrage et reçoit la progression.
 * Garde : export (ligne du joueur seule, jamais celle des autres), réception (identité conservée, état plus ancien refusé, flux et gains rattachés
 * au compte de la session), aiguillage (chat, classements, « En direct » restent au serveur) et fichiers construits à jour.
 */
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
const coord = new SorealIdleCoordinatorV1({ storage: { sql } }, {});
for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
const src = fs.readFileSync(new URL("../tools/local-dev-server.mjs", import.meta.url), "utf8");
const HEADERS_ = new Function(src.match(/const HEADERS_ = (\[.*?\]);/)[1].replace(/^/, "return ")) ();
HEADERS_.splice(0, 0); // en-têtes tels que le serveur de test les pose
const feuille = (nom, lignes) => lignes.forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", nom, i + 1, JSON.stringify(l), Date.now()));
feuille("JOUEURS", [HEADERS_]);
feuille("IDLE_BOUTIQUE", [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]]);

const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
const autre = { email: "autre@example.com", emailConnexion: "autre@example.com", emails: ["autre@example.com"], prenom: "Autre" };
const jeton = (u) => coord.consumeLaunchTicketV1(coord.createLaunchTicketV1({ source: "tv", user: u }).ticket).sessionToken;
const T = jeton(user);
coord.runStandaloneSessionOperationV1({ sessionToken: T, operation: "obtenirEtatSorealIdle", args: [T] });

// Export : la ligne du joueur + les catalogues, jamais la ligne d'un autre joueur.
const exp = exporterPourMoteurLocalV1(coord, T);
assert.equal(exp.ok, true);
assert.ok(exp.feuilles.some((f) => f[0] === "IDLE_BOUTIQUE"), "les feuilles de catalogue sont exportées");
assert.ok(!exp.feuilles.some((f) => f[0] === "JOUEURS"), "la feuille JOUEURS n'est jamais exportée en entier");
const ligne = JSON.parse(exp.joueurs.ligne);
assert.equal(String(ligne[18]).toLowerCase(), user.email);
assert.equal(exporterPourMoteurLocalV1(coord, "faux").ok, false, "sans session valide : refus");

// Réception : l'identité reste celle du serveur, un état plus récent est écrit, un état plus ancien est refusé.
const lire = () => JSON.parse(sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=?", exp.joueurs.index)[0].row_json);
const a = ligne.slice(); a[15] = "2030-01-01T00:00:10.000Z"; a[1] = "USURPATION"; a[18] = "voleur@example.com"; a[10] = 12345;
let r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: a, flux: [{ at: 1, type: "boss", donnees: "{\"n\":1}" }], gains: [{ at: 2, operation: "test", avant: 1, apres: 2 }] });
assert.equal(r.ok, true); assert.equal(r.ecrit, true); assert.equal(r.flux, 1); assert.equal(r.gains, 1);
assert.equal(lire()[10], 12345, "la progression est enregistrée");
assert.equal(lire()[1], ligne[1], "le nom reste celui du serveur");
assert.equal(String(lire()[18]).toLowerCase(), user.email, "l'e-mail reste celui du serveur");
assert.equal(sql.exec("SELECT email FROM idle_flux")[0].email, user.email, "les événements sont rattachés au compte de la session");
const vieux = a.slice(); vieux[15] = "2029-01-01T00:00:00.000Z"; vieux[10] = 1;
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: vieux });
assert.equal(r.ecrit, false, "un état plus ancien n'écrase jamais un état plus récent");
assert.equal(lire()[10], 12345);
assert.equal(recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: [1, 2, 3] }).ok, false, "ligne incomplète refusée");

// Anti-triche en OBSERVATION : une anomalie est notée mais la progression est toujours acceptée ; un envoi honnête ne note rien.
const honnete = ligne.slice(); honnete[15] = new Date(Date.now() + 1000).toISOString();
assert.equal(recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: honnete }).alertes, 0, "un envoi honnête ne déclenche aucune alerte");
const futur = ligne.slice(); futur[15] = "2031-01-01T00:00:00.000Z";
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: futur });
assert.equal(r.alertes, 1); assert.equal(r.ecrit, true, "l'anomalie est notée, la progression reste acceptée");
assert.equal(lireAlertesLocalesV1(coord)[0].code, "horloge_avance");
assert.deepEqual(analyserEnvoiLocalV1(honnete, honnete, Date.now()), []);
const av = honnete.slice(); av[24] = 5; av[14] = 40; const ap = av.slice(); ap[24] = 6; ap[14] = 0;
assert.deepEqual(analyserEnvoiLocalV1(av, ap, Date.now()), [], "après une renaissance, les boss vaincus repartent de zéro : normal");
const ap2 = av.slice(); ap2[14] = 10;
assert.equal(analyserEnvoiLocalV1(av, ap2, Date.now())[0].code, "boss_vaincus_recul");
const ap3 = av.slice(); ap3[24] = 4;
assert.equal(analyserEnvoiLocalV1(av, ap3, Date.now())[0].code, "renaissances_recul");

// Un seul appareil joue à la fois : l'appareil arrivé après revendique la partie ; l'ancien, au prochain envoi, reçoit un conflit (jamais d'écrasement).
const debutA = Date.now() - 5000;
exporterPourMoteurLocalV1(coord, T, "appareil-A");
const lireDeA = exporterPourMoteurLocalV1(coord, T, "appareil-B");   // B démarre après A
const suite = ligne.slice(); suite[15] = "2032-01-01T00:00:00.000Z"; suite[10] = 777;
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: suite, appareil: "appareil-A", depuis: debutA });
assert.equal(r.ok, false); assert.equal(r.conflit, true, "A avait démarré avant B : conflit, pas d'écrasement");
assert.notEqual(lire()[10], 777);
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: suite, appareil: "appareil-B", depuis: lireDeA.serveurAt });
assert.equal(r.ok, true, "B, l'appareil le plus récent, peut envoyer"); assert.equal(lire()[10], 777);

// Sauvegardes de sécurité : copie initiale au passage en local, copie AVANT chaque anomalie, rotation bornée, restauration réservée à une copie existante.
const liste = listerSauvegardesLocalesV1(coord, user.email);
const initiale = liste.find((x) => x.motif === "initiale");
assert.ok(initiale, "une copie « initiale » est prise quand le compte passe au jeu local");
assert.ok(liste.some((x) => x.motif === "avant-anomalie"), "une anomalie provoque une copie AVANT l'écrasement");
for (let i = 1; i <= 70; i += 1) sauvegarderSiBesoinLocalV1(coord, user.email, JSON.stringify(ligne), Date.now() + i * 16 * 60 * 1000 + 3 * 24 * 3600 * 1000);
const apres = listerSauvegardesLocalesV1(coord, user.email);
assert.ok(apres.filter((x) => x.motif === "periodique").length <= 48, "les copies périodiques sont bornées à 48");
assert.ok(apres.some((x) => x.motif === "initiale"), "la copie initiale n'est jamais effacée par la rotation");
assert.equal(restaurerSauvegardeLocaleV1(coord, user.email, 999999).ok, false, "copie inconnue : refus");
const avantRestauration = lire()[10];
assert.notEqual(avantRestauration, ligne[10]);
const rr = restaurerSauvegardeLocaleV1(coord, user.email, initiale.id);
assert.equal(rr.ok, true);
assert.equal(lire()[10], ligne[10], "la restauration remet la partie de la copie");
assert.equal(String(lire()[18]).toLowerCase(), user.email, "l'identité reste celle du serveur");
assert.ok(listerSauvegardesLocalesV1(coord, user.email).some((x) => x.motif === "avant-restauration"), "l'état écrasé par la restauration est lui-même copié");
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: suite, appareil: "appareil-B", depuis: Date.now() - 60000 });
assert.equal(r.conflit, true, "un appareil en cours de jeu reçoit « partie reprise ailleurs » après une restauration");

const mod = fs.readFileSync(new URL("../public/modules/moteur-local-v1.js", import.meta.url), "utf8");
// Garde : toute opération du moteur est soit locale, soit au serveur sans toucher la ligne du joueur, soit listée comme « modifie le joueur » (rechargement).
const debut = mod.indexOf('const MODIFIENT_LE_JOUEUR=') + 'const MODIFIENT_LE_JOUEUR='.length;
const modifient = Object.keys(new Function('return ' + mod.slice(debut, mod.indexOf('};', debut) + 1))());
for (const o of modifient) assert.ok(idleOperationNames().includes(o), 'opération inconnue : ' + o);

// Aiguillage : toutes les opérations locales existent ; chat, classements, « En direct », comptes et administration restent au serveur.
const locales = Object.keys(new Function("const window={};" + mod.match(/const LOCALES=(\{[\s\S]*?\});/)[0].replace("const LOCALES=", "return ") .replace(/^return /, "return ")) ());
const connues = new Set(idleOperationNames());
for (const o of locales) assert.ok(connues.has(o), "opération locale inconnue du moteur : " + o);
for (const o of ["lireChatSorealIdle", "envoyerChatSorealIdle", "lireFluxSorealIdle", "battementSorealIdle", "obtenirClassementSorealIdle", "obtenirMesRangsSorealIdle", "definirPseudoSorealIdle", "listerJoueursExternesSorealIdle", "crediterExpAdminSorealIdle", "reinitialiserCompteCompletSorealIdle", "preparerPartieTestSorealIdle"]) {
  assert.ok(!locales.includes(o), o + " doit rester au serveur");
}
assert.ok(locales.includes("nukerBossSorealIdle"), "le nuke est une action de jeu : local (un nuke au serveur ramenait au premier boss)");
assert.ok(locales.includes("synchroniserSorealIdle") && locales.includes("obtenirEtatSorealIdle") && locales.includes("renaitreSorealIdle"));

// Sauvegarde sur l'appareil : la ligne du joueur est gardée dans IndexedDB, reprise si elle est plus récente que celle du serveur, effacée une fois reçue.
assert.ok(mod.includes("__envoyerPartieServeurIdleV1__") && fs.readFileSync(new URL("../public/modules/ui-reglages-v1.js", import.meta.url), "utf8").includes("Envoyer ma partie vers le serveur"), "bouton Réglages");
assert.ok(mod.includes("indexedDB.open(\"soreal_idle_moteur_local_v1\"") && mod.includes("enMs(rec.cells[15])>enMs(srv[15])") && mod.includes("kv(\"effacer\",cleSauve)"), "sauvegarde appareil absente");

// Fichiers construits à jour : l'adresse du Worker et du wasm porte l'empreinte de leur contenu.
const crypto = await import("node:crypto");
const h = (f) => crypto.createHash("sha256").update(fs.readFileSync(new URL("../public/" + f, import.meta.url))).digest("hex").slice(0, 10);
assert.ok(mod.includes("moteur-local-worker-v1.js?v=" + h("moteur-local-worker-v1.js")), "relancer node cloudflare/tools/build-moteur-local.mjs");
assert.ok(mod.includes("sql-wasm-v1.wasm?v=" + h("sql-wasm-v1.wasm")), "relancer node cloudflare/tools/build-moteur-local.mjs");
console.log("idle-moteur-local-v1: OK");
