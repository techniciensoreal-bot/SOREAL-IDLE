/*
 * Jeu local (Norman, 2026-10-19) : le moteur tourne dans la page ; le serveur ne fait plus que
 *  - FOURNIR au démarrage la ligne du joueur et les feuilles de catalogue (exporterPourMoteurLocalV1),
 *  - RECEVOIR la progression (recevoirDuMoteurLocalV1) pour les classements et « En direct » : ligne du joueur, événements du flux, gains d'EXP.
 * Règles : l'identité (ID, nom, rang, e-mails) reste celle du serveur ; un état plus ancien que celui du serveur n'écrase jamais un état plus récent
 * (comparaison sur « Dernière synchro », colonne 16, jamais sur l'horloge de l'appareil seule) ; les événements sont rattachés au compte de la session.
 */
import { runSorealIdleOperation } from "./idle-sqlite-runtime.js";
import { assurerFluxV1 } from "./idle-flux-v1.js";
import { assurerGainsV1 } from "./idle-gains-v1.js";
import { idleDevSlotForUserV1, idleDevUserForSlotV1 } from "./idle-dev-save-slots-v1.js";

const sv = (v) => String(v == null ? "" : v).trim();
const COL_DERNIERE_SYNCHRO = 15;            // colonne 16 (base 0)
const COLS_DU_SERVEUR = [0, 1, 17, 18, 19]; // ID, Nom, Rang, e-mail principal, e-mail de connexion
/*
 * Anti-triche (Norman, 2026-10-19) : « personne ne va essayer de tricher ; si ça détecte de la triche, ce sera un souci de ton anti-triche ». Donc :
 *  - MODE OBSERVATION : une anomalie est NOTÉE (table idle_alertes_locales, lisible par l'administrateur seul) et la progression est TOUJOURS acceptée ;
 *    seul un envoi malformé est refusé ;
 *  - peu de règles, toutes sans faux positif possible dans un jeu honnête : l'horloge de l'appareil ne peut pas annoncer une date lointaine dans le futur
 *    (avancer l'horloge ferait gagner du temps hors ligne) ; un compteur qui ne redescend jamais (renaissances) ne redescend pas ; les boss vaincus ne
 *    redescendent que par une renaissance.
 * Le rejeu complet des actions (journal) viendra si ces notes montrent un jour un vrai besoin.
 */
const TOLERANCE_HORLOGE_MS = 15 * 60 * 1000;
const COL_BOSS_VAINCUS = 14;
const COL_RENAISSANCES = 24;
const MAX_ALERTES = 500;

export function analyserEnvoiLocalV1(avant, apres, maintenantMs) {
  const alertes = [];
  const recu = enMs(apres[COL_DERNIERE_SYNCHRO]);
  if (Number.isFinite(recu) && recu > maintenantMs + TOLERANCE_HORLOGE_MS) {
    alertes.push({ code: "horloge_avance", detail: "synchro annoncée " + Math.round((recu - maintenantMs) / 60000) + " min dans le futur" });
  }
  if (Array.isArray(avant) && avant.length > COL_RENAISSANCES) {
    const renAvant = Number(avant[COL_RENAISSANCES]) || 0;
    const renApres = Number(apres[COL_RENAISSANCES]) || 0;
    if (renApres < renAvant) alertes.push({ code: "renaissances_recul", detail: renAvant + " -> " + renApres });
    else if (renApres === renAvant && (Number(apres[COL_BOSS_VAINCUS]) || 0) < (Number(avant[COL_BOSS_VAINCUS]) || 0)) {
      alertes.push({ code: "boss_vaincus_recul", detail: (Number(avant[COL_BOSS_VAINCUS]) || 0) + " -> " + (Number(apres[COL_BOSS_VAINCUS]) || 0) });
    }
  }
  return alertes;
}

function noterAlertes(coord, email, alertes) {
  if (!alertes.length) return;
  coord.sql.exec("CREATE TABLE IF NOT EXISTS idle_alertes_locales(id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, email TEXT NOT NULL, code TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '')");
  for (const a of alertes) coord.sql.exec("INSERT INTO idle_alertes_locales(at,email,code,detail) VALUES(?,?,?,?)", Date.now(), email, a.code, a.detail);
  coord.sql.exec("DELETE FROM idle_alertes_locales WHERE id <= (SELECT COALESCE(MAX(id),0) FROM idle_alertes_locales) - ?", MAX_ALERTES);
}

export function lireAlertesLocalesV1(coord) {
  try {
    return coord.sqlAll("SELECT at,email,code,detail FROM idle_alertes_locales ORDER BY id DESC LIMIT 100");
  } catch (_) { return []; }
}

/*
 * Un seul appareil joue la partie à la fois (changement d'appareil, deux onglets) : à l'export, l'appareil qui démarre REVENDIQUE la partie ; un envoi d'un autre appareil
 * qui avait démarré AVANT cette revendication est refusé (« conflit »), au lieu d'écraser la progression de l'appareil le plus récent. Ce n'est pas de l'anti-triche.
 */
function assurerAppareils(coord) {
  coord.sql.exec("CREATE TABLE IF NOT EXISTS idle_local_appareils(email TEXT PRIMARY KEY, appareil TEXT NOT NULL, vu INTEGER NOT NULL)");
}
function revendiquer(coord, email, appareil, now) {
  if (!appareil) return;
  assurerAppareils(coord);
  coord.sql.exec("INSERT OR REPLACE INTO idle_local_appareils(email,appareil,vu) VALUES(?,?,?)", email, appareil, now);
}

const MAX_FLUX = 200;
const MAX_GAINS = 100;

/* « Dernière synchro » est une date ISO (ou des millisecondes) : toujours comparée en millisecondes. */
function enMs(v) {
  const n = Number(v);
  return Number.isFinite(n) && sv(v) !== "" ? n : Date.parse(sv(v));
}

function emailsDe(user) {
  const l = [user && user.email, user && user.emailConnexion].concat((user && user.emails) || []);
  return Array.from(new Set(l.map((e) => sv(e).toLowerCase()).filter(Boolean)));
}

/* Partie B (essai de Norman) : sa ligne est stockée sous l'adresse alias, comme le fait le moteur (trouverLigneJoueurSorealIdle_). */
function effectif(user) {
  return idleDevSlotForUserV1(user) === "b" ? idleDevUserForSlotV1(user, "b") : user;
}

function indexLigneJoueur(coord, user) {
  for (const e of emailsDe(effectif(user))) {
    const r = coord.sqlAll("SELECT source_row FROM idle_players WHERE lower(email_primary)=? OR lower(email_login)=? LIMIT 1", e, e)[0];
    if (r && Number(r.source_row) > 1) return Number(r.source_row);
  }
  return 0;
}

export function exporterPourMoteurLocalV1(coord, sessionToken, appareil = "") {
  const s = coord.standaloneSessionV1(sessionToken);
  if (!s.ok) return { ok: false, error: s.error };
  /* Crée la ligne du joueur si c'est sa première visite, puis la lit. */
  runSorealIdleOperation(coord.sqlMoteur, "obtenirEtatSorealIdle", [sessionToken], s.user);
  const index = indexLigneJoueur(coord, s.user);
  if (!index) return { ok: false, error: "IDLE_LIGNE_JOUEUR_INTROUVABLE" };
  const entete = coord.sqlAll("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=1")[0];
  const ligne = coord.sqlAll("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=?", index)[0];
  if (!ligne) return { ok: false, error: "IDLE_LIGNE_JOUEUR_INTROUVABLE" };
  const feuilles = coord.sqlAll("SELECT sheet_name,row_index,row_json FROM idle_catalog WHERE sheet_name!='JOUEURS' ORDER BY sheet_name,row_index")
    .map((r) => [r.sheet_name, Number(r.row_index), r.row_json]);
  const profils = emailsDe(effectif(s.user)).map((e) => coord.sqlAll("SELECT email,pseudo,pseudo_key,externe,google_name,prenom,first_seen,updated_at FROM idle_profiles WHERE email=?", e)[0]).filter(Boolean);
  const maintenant = Date.now();
  revendiquer(coord, emailsDe(effectif(s.user))[0] || "", sv(appareil).slice(0, 64), maintenant);
  return { ok: true, user: s.user, serveurAt: maintenant, joueurs: { entete: entete ? entete.row_json : "[]", index, ligne: ligne.row_json }, feuilles, profils };
}

export function recevoirDuMoteurLocalV1(coord, p) {
  const s = coord.standaloneSessionV1(p && p.sessionToken);
  if (!s.ok) return { ok: false, error: s.error };
  const index = indexLigneJoueur(coord, s.user);
  if (!index) return { ok: false, error: "IDLE_LIGNE_JOUEUR_INTROUVABLE" };
  const cells = Array.isArray(p.cells) ? p.cells : null;
  const appareil = sv(p.appareil).slice(0, 64);
  if (appareil) {
    assurerAppareils(coord);
    const mail = emailsDe(effectif(s.user))[0] || "";
    const propre = coord.sqlAll("SELECT appareil,vu FROM idle_local_appareils WHERE email=?", mail)[0];
    if (propre && propre.appareil !== appareil && Number(p.depuis) < Number(propre.vu)) return { ok: false, conflit: true, error: "IDLE_PARTIE_REPRISE_AILLEURS" };
    if (!propre || propre.appareil !== appareil) revendiquer(coord, mail, appareil, Date.now());
  }
  if (!cells || cells.length < 30) return { ok: false, error: "IDLE_LOCAL_LIGNE_INVALIDE" };
  const actuelle = coord.sqlAll("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=?", index)[0];
  let serveur = [];
  try { serveur = JSON.parse(actuelle.row_json); } catch (_) {}
  const recu = enMs(cells[COL_DERNIERE_SYNCHRO]);
  const connu = enMs(serveur[COL_DERNIERE_SYNCHRO]);
  const alertes = analyserEnvoiLocalV1(serveur, cells, Date.now());
  noterAlertes(coord, emailsDe(effectif(s.user))[0] || "", alertes);
  let ecrit = false;
  if (!(Number.isFinite(connu) && Number.isFinite(recu) && recu < connu)) {
    const fusion = cells.slice();
    for (const c of COLS_DU_SERVEUR) fusion[c] = serveur[c];
    coord.sql.exec("UPDATE idle_catalog SET row_json=?,updated_at=? WHERE sheet_name='JOUEURS' AND row_index=?", JSON.stringify(fusion), Date.now(), index);
    ecrit = true;
  }
  const cle = emailsDe(effectif(s.user))[0] || "";
  const nom = sv(s.user.prenom || "Joueur").slice(0, 80);
  assurerFluxV1(coord.sql);
  assurerGainsV1(coord.sql);
  let flux = 0;
  for (const e of (Array.isArray(p.flux) ? p.flux : []).slice(0, MAX_FLUX)) {
    if (!e || typeof e.type !== "string") continue;
    coord.sql.exec("INSERT INTO idle_flux(at,email,nom,type,donnees) VALUES(?,?,?,?,?)", Number(e.at) || Date.now(), cle, nom, e.type.slice(0, 40), sv(e.donnees).slice(0, 4000) || "{}");
    flux += 1;
  }
  let gains = 0;
  for (const g of (Array.isArray(p.gains) ? p.gains : []).slice(0, MAX_GAINS)) {
    if (!g) continue;
    coord.sql.exec("INSERT INTO idle_gains_exp(at,email,nom,operation,avant,apres) VALUES(?,?,?,?,?,?)", Number(g.at) || Date.now(), cle, nom, sv(g.operation).slice(0, 120), Number(g.avant) || 0, Number(g.apres) || 0);
    gains += 1;
  }
  return { ok: true, ecrit, flux, gains, alertes: alertes.length, serveurAt: Date.now() };
}
