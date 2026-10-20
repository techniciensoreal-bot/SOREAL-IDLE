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
import { lireTextesV1 } from "./idle-textes-v1.js";
import { invaliderTrajectoireV1 } from "./idle-runtime-etat.js";

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

/*
 * SAUVEGARDES DE SÉCURITÉ (Norman, 2026-10-19 : « les sauvegardes des gens peuvent se perdre ; tu dois avoir un backup »). Le jeu se calcule sur l'appareil et le serveur reçoit la ligne du
 * joueur : une erreur (le nuke du 2026-10-19 a ramené une partie au boss 1) ne doit JAMAIS être définitive. Avant d'écraser la ligne d'un compte, le serveur en garde une COPIE :
 *  - « initiale » : la première fois qu'un compte passe au jeu local (état d'avant le local, intact) ;
 *  - « quotidienne » : une par jour, conservées 30 jours ;
 *  - « periodique » : au plus une tous les quarts d'heure, les 48 dernières (12 h) ;
 *  - « avant-anomalie » : toujours, quand l'anti-triche note une anomalie ; « avant-restauration » : avant toute restauration.
 * Restauration par l'administrateur seul (restaurerSauvegardeLocaleV1) : la partie restaurée remplace la ligne ; les appareils en cours de jeu reçoivent « Partie reprise ailleurs ».
 */
const SAUVEGARDE_INTERVALLE_MS = 15 * 60 * 1000;
const SAUVEGARDE_RECENTES_MAX = 48;
const SAUVEGARDE_QUOTIDIENNES_MS = 30 * 24 * 3600 * 1000;

function assurerSauvegardes(coord) {
  coord.sql.exec("CREATE TABLE IF NOT EXISTS idle_sauvegardes_locales(id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, at INTEGER NOT NULL, motif TEXT NOT NULL, row_json TEXT NOT NULL)");
  coord.sql.exec("CREATE INDEX IF NOT EXISTS idx_idle_sauvegardes_locales_email ON idle_sauvegardes_locales(email,at)");
}

function copier(coord, email, rowJson, motif, now) {
  assurerSauvegardes(coord);
  coord.sql.exec("INSERT INTO idle_sauvegardes_locales(email,at,motif,row_json) VALUES(?,?,?,?)", email, now, motif, rowJson);
  coord.sql.exec("DELETE FROM idle_sauvegardes_locales WHERE email=? AND motif NOT IN ('quotidienne','initiale') AND id NOT IN (SELECT id FROM idle_sauvegardes_locales WHERE email=? AND motif NOT IN ('quotidienne','initiale') ORDER BY id DESC LIMIT ?)", email, email, SAUVEGARDE_RECENTES_MAX);
  coord.sql.exec("DELETE FROM idle_sauvegardes_locales WHERE email=? AND motif='quotidienne' AND at < ?", email, now - SAUVEGARDE_QUOTIDIENNES_MS);
}

/* Copie la ligne actuelle du serveur si le calendrier ci-dessus le demande (ou toujours, avec « motifForce »). */
export function sauvegarderSiBesoinLocalV1(coord, email, rowJson, now, motifForce = "") {
  if (!email || !rowJson) return false;
  assurerSauvegardes(coord);
  if (motifForce) { copier(coord, email, rowJson, motifForce, now); return true; }
  const derniere = coord.sqlAll("SELECT at FROM idle_sauvegardes_locales WHERE email=? ORDER BY at DESC LIMIT 1", email)[0];
  if (!derniere) { copier(coord, email, rowJson, "initiale", now); return true; }
  const debutJour = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate());
  const duJour = coord.sqlAll("SELECT 1 AS x FROM idle_sauvegardes_locales WHERE email=? AND motif='quotidienne' AND at>=? LIMIT 1", email, debutJour)[0];
  if (!duJour) { copier(coord, email, rowJson, "quotidienne", now); return true; }
  if (now - Number(derniere.at) >= SAUVEGARDE_INTERVALLE_MS) { copier(coord, email, rowJson, "periodique", now); return true; }
  return false;
}

function indexParEmail(coord, email) {
  const e = sv(email).toLowerCase();
  const r = coord.sqlAll("SELECT source_row FROM idle_players WHERE lower(email_primary)=? OR lower(email_login)=? LIMIT 1", e, e)[0];
  return r && Number(r.source_row) > 1 ? Number(r.source_row) : 0;
}

export function listerSauvegardesLocalesV1(coord, email) {
  assurerSauvegardes(coord);
  return coord.sqlAll("SELECT id,at,motif,row_json FROM idle_sauvegardes_locales WHERE email=? ORDER BY at DESC LIMIT 200", sv(email).toLowerCase()).map((r) => {
    let c = [];
    try { c = JSON.parse(r.row_json); } catch (_) {}
    return { id: Number(r.id), at: Number(r.at), motif: r.motif, bossVaincus: Number(c[COL_BOSS_VAINCUS]) || 0, renaissances: Number(c[COL_RENAISSANCES]) || 0, derniereSynchro: c[COL_DERNIERE_SYNCHRO] || "", octets: r.row_json.length };
  });
}

export function restaurerSauvegardeLocaleV1(coord, email, id) {
  invaliderTrajectoireV1();
  const mail = sv(email).toLowerCase();
  assurerSauvegardes(coord);
  const copie = coord.sqlAll("SELECT row_json FROM idle_sauvegardes_locales WHERE email=? AND id=?", mail, Number(id))[0];
  if (!copie) return { ok: false, error: "IDLE_SAUVEGARDE_INTROUVABLE" };
  const index = indexParEmail(coord, mail);
  if (!index) return { ok: false, error: "IDLE_LIGNE_JOUEUR_INTROUVABLE" };
  const actuelle = coord.sqlAll("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=?", index)[0];
  const maintenant = Date.now();
  if (actuelle) copier(coord, mail, actuelle.row_json, "avant-restauration", maintenant);
  let serveur = [];
  try { serveur = JSON.parse(actuelle.row_json); } catch (_) {}
  const cells = JSON.parse(copie.row_json);
  for (const c of COLS_DU_SERVEUR) cells[c] = serveur[c];
  cells[COL_DERNIERE_SYNCHRO] = new Date(maintenant).toISOString();
  coord.sql.exec("UPDATE idle_catalog SET row_json=?,updated_at=? WHERE sheet_name='JOUEURS' AND row_index=?", JSON.stringify(cells), maintenant, index);
  revendiquer(coord, mail, "__restauration__", maintenant);   // tout appareil en cours de jeu reçoit « partie reprise ailleurs »
  return { ok: true, index, restauree: Number(id) };
}

/*
 * INTERRUPTEUR GÉNÉRAL du jeu local (Norman, 2026-10-19 : le jeu local est actif pour TOUS les joueurs, avec toutes les précautions). L'administrateur peut le COUPER sans redéployer
 * (POST /api/v1/local/interrupteur {actif:false}) : l'export refuse alors (« IDLE_LOCAL_DESACTIVE »), la page retombe sur le mode serveur au prochain chargement ; les parties
 * déjà poussées restent intactes. Rallumé par {actif:true}.
 */
function assurerReglages(coord) {
  coord.sql.exec("CREATE TABLE IF NOT EXISTS idle_local_reglages(cle TEXT PRIMARY KEY, valeur TEXT NOT NULL)");
}
export function localActifV1(coord) {
  assurerReglages(coord);
  const r = coord.sqlAll("SELECT valeur FROM idle_local_reglages WHERE cle='actif'")[0];
  return !(r && r.valeur === "0");
}
export function definirLocalActifV1(coord, actif) {
  assurerReglages(coord);
  coord.sql.exec("INSERT OR REPLACE INTO idle_local_reglages(cle,valeur) VALUES('actif',?)", actif ? "1" : "0");
  return { ok: true, actif: Boolean(actif) };
}

/*
 * Appareil resté en MODE SERVEUR (onglet ouvert avant la mise à jour, navigateur sans Worker) : ses actions modifient la ligne du joueur sur le serveur. Pour qu'un appareil en jeu
 * local ne l'écrase jamais avec un état plus ancien, toute action de jeu passée par le serveur REVENDIQUE la partie (« __serveur__ ») : l'appareil local reçoit alors « partie reprise
 * ailleurs » à son prochain envoi et se recharge sur l'état du serveur. Les simples lectures (état, synchro) ne revendiquent rien.
 */
export const OPERATIONS_DE_JEU_V1 = new Set([
  "agirProgressionSorealIdle", "definirAllocationsEntrainementSorealIdle", "acheterAmeliorationSorealIdle", "acheterAmeliorationsSorealIdle", "acheterEntrainementSorealIdle",
  "acheterEntrainementsSorealIdle", "acheterSortSorealIdle", "acheterSortsSorealIdle", "agrandirInventairePlusieursSorealIdle", "agrandirInventaireSorealIdle",
  "ameliorerEquipementForgeSorealIdle", "ameliorerEquipementsForgeSorealIdle", "combattreAventureSorealIdle", "definirAutoBossSuivantSorealIdle", "definirCombatAutoAventureSorealIdle",
  "definirCombatBossSorealIdle", "equiperObjetsSorealIdle", "fusionnerObjetSorealIdle", "fusionnerObjetsSorealIdle", "lancerSortSorealIdle", "recyclerObjetSorealIdle",
  "recyclerObjetsSorealIdle", "renaitreSorealIdle", "sauvegarderDispositionInventaireSorealIdle", "selectionnerBossSorealIdle", "definirClassementVisibleSorealIdle", "nukerBossSorealIdle",
]);
export function noterActionServeurV1(coord, user, operation) {
  if (!OPERATIONS_DE_JEU_V1.has(operation)) return false;
  const mail = emailsDe(effectif(user))[0] || "";
  if (!mail) return false;
  revendiquer(coord, mail, "__serveur__", Date.now());
  return true;
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

/*
 * Textes modifiés par l'administrateur (chroniques et noms de boss, popups : table idle_textes du serveur) pour le moteur LOCAL (Norman, 2026-10-20 : « j'ai créé une voix pour le boss 99 et c'est toujours l'ancienne qui est lue »).
 * Sans eux le moteur local lisait le texte d'origine du catalogue, donc l'empreinte de l'ANCIENNE voix. Les champs réservés à l'administrateur (voixTextes, voixFaites) ne partent jamais.
 * Forme : [[cle, json, maj]] ; remplace TOUTE la table du moteur local (une suppression côté serveur disparaît aussi).
 */
export function textesPourMoteurLocalV1(coord) {
  try {
    return lireTextesV1(coord.sqlMoteur).map((t) => [t.cle, JSON.stringify({ champs: t.champs, parle: t.parle, voix: t.voix }), Number(t.maj) || 0]);
  } catch (_e) {
    return [];
  }
}

export function exporterPourMoteurLocalV1(coord, sessionToken, appareil = "") {
  const s = coord.standaloneSessionV1(sessionToken);
  if (!s.ok) return { ok: false, error: s.error };
  if (!localActifV1(coord)) return { ok: false, error: "IDLE_LOCAL_DESACTIVE" };
  /* Crée la ligne du joueur si c'est sa première visite, puis la lit. */
  const premiereLecture = runSorealIdleOperation(coord.sqlMoteur, "obtenirEtatSorealIdle", [sessionToken], s.user);
  /* Préférences du compte : envoyées AVEC l'export pour que la page décide de son rechargement (règle n°6) AVANT de démarrer le moteur, et non après (le démarrage complet était perdu : « le chargement ne se termine pas, puis un 2e chargement démarre »). */
  const uiPrefsCompte = { nom: sv(premiereLecture && premiereLecture.joueur && premiereLecture.joueur.nom), prefs: (premiereLecture && premiereLecture.joueur && premiereLecture.joueur.systemes && premiereLecture.joueur.systemes.uiPrefs) || {} };
  const index = indexLigneJoueur(coord, s.user);
  if (!index) return { ok: false, error: "IDLE_LIGNE_JOUEUR_INTROUVABLE" };
  const entete = coord.sqlAll("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=1")[0];
  const ligne = coord.sqlAll("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=?", index)[0];
  if (!ligne) return { ok: false, error: "IDLE_LIGNE_JOUEUR_INTROUVABLE" };
  sauvegarderSiBesoinLocalV1(coord, emailsDe(effectif(s.user))[0] || "", ligne.row_json, Date.now());
  const feuilles = coord.sqlAll("SELECT sheet_name,row_index,row_json FROM idle_catalog WHERE sheet_name!='JOUEURS' ORDER BY sheet_name,row_index")
    .map((r) => [r.sheet_name, Number(r.row_index), r.row_json]);
  const profils = emailsDe(effectif(s.user)).map((e) => coord.sqlAll("SELECT email,pseudo,pseudo_key,externe,google_name,prenom,first_seen,updated_at FROM idle_profiles WHERE email=?", e)[0]).filter(Boolean);
  const maintenant = Date.now();
  revendiquer(coord, emailsDe(effectif(s.user))[0] || "", sv(appareil).slice(0, 64), maintenant);
  return { ok: true, user: s.user, uiPrefsCompte, serveurAt: maintenant, textes: textesPourMoteurLocalV1(coord), joueurs: { entete: entete ? entete.row_json : "[]", index, ligne: ligne.row_json }, feuilles, profils };
}

export function recevoirDuMoteurLocalV1(coord, p) {
  invaliderTrajectoireV1(); /* la ligne du joueur est écrite de l'extérieur : la trajectoire des multiplicateurs mise de côté n'est plus fiable */
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
    /* Copie de sécurité de la ligne actuelle AVANT de l'écraser (toujours, si l'anti-triche a noté une anomalie). */
    sauvegarderSiBesoinLocalV1(coord, emailsDe(effectif(s.user))[0] || "", actuelle.row_json, Date.now(), p.importPartie === true ? "avant-import" : (alertes.length ? "avant-anomalie" : ""));
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
