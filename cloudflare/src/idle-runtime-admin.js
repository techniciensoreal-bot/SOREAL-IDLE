/*
 * Signalements de bug, histoires, tutoriel et textes (administration) (audit d'architecture, 2026-10-16 : découpage de idle-sqlite-runtime.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { sqlRows, safeJson } from "./core/sqlite-core.js";
import { idleDevSlotsAvailableV1, idleDevSlotForUserV1 } from "./idle-dev-save-slots-v1.js";
import { IDLE_NGU_META_VERSION } from "./idle-ngu-progression.js";
import { histoireDuBossV1, lireHistoiresV1, enregistrerHistoireV1, supprimerHistoireV1 } from "./idle-histoires-v1.js";
import { annulerVictoireTitanV1 } from "./idle-adventure-v47.js";
import { creditDejaFaitV1, lireGainsExpV1 } from "./idle-gains-v1.js";
import { ancienTutorielActifV1, ancienMenusActifV1, guidesPourJoueurV1, lireGuidesV1, enregistrerGuideV1, supprimerGuideV1, reglerAncienMenusV1, reglerAncienTutorielV1 } from "./idle-tutoriel-v1.js";
import { surchargesPourJoueurV1, lireTextesV1, enregistrerTexteV1, invaliderCacheTextesBossV1, supprimerTexteV1 } from "./idle-textes-v1.js";
import { histoireBossFrAligneeV1 } from "./idle-traductions-v1.js";
import { assurerDonneesJeuSorealIdle_, exigerAccesSorealIdle_, obtenirFeuilleJoueursSorealIdle_, trouverLigneJoueurSorealIdle_ } from "./idle-runtime-acces.js";
import { LockService, NGU_BOSS_NAMES_FR_V1, SpreadsheetApp, __idleCtx } from "./idle-sqlite-runtime.js";
import { ADMIN_SOREAL_IDLE_EMAIL } from "./idle-runtime-joueurs.js";
import { CONFIG_SOREAL_IDLE, nombreSorealIdle_ } from "./idle-runtime-config.js";
import { initialiserModeleJoueurSorealIdleV41SiNecessaire_ } from "./idle-runtime-aventure.js";
import { statsJoueurSorealIdle_ } from "./idle-runtime-collection.js";
import { construireEtatJoueurSorealIdle_ } from "./idle-runtime-etat.js";
import { bossCatalogueSorealIdle_ } from "./idle-runtime-catalogue.js";

/*
 * Signalement de bug (2026-09-26, Norman). Pas de mail : le message est enregistre ici (table idle_bug_reports), l'administrateur les lit dans Settings et
 * les supprime une fois le souci regle. Limite : 5 signalements par heure et par compte, 2000 caracteres.
 */
const IDLE_BUG_MAX_CHARS_V1 = 2000;

const IDLE_BUG_MAX_PAR_HEURE_V1 = 5;

export function signalerBugSorealIdle(sessionToken, message, contexte) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  const texte = String(message == null ? '' : message).replace(/\r\n/g, '\n').trim().slice(0, IDLE_BUG_MAX_CHARS_V1);
  if (!texte) return { ok: false, message: '\u00c9cris un message avant d\u2019envoyer.' };
  if (!__idleCtx.__idleSql) throw new Error('SOREAL_IDLE_BASE_INDISPONIBLE');
  __idleCtx.__idleSql.exec("CREATE TABLE IF NOT EXISTS idle_bug_reports(id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER, email TEXT, prenom TEXT, message TEXT, contexte TEXT, mail_status TEXT)");
  const email = String(acces.emailAutorise || (acces.user && acces.user.email) || '').trim().toLowerCase();
  const prenom = String((acces.user && acces.user.prenom) || '').trim().slice(0, 60);
  const maintenant = Date.now();
  const recents = sqlRows(__idleCtx.__idleSql.exec("SELECT COUNT(*) AS n FROM idle_bug_reports WHERE email=? AND at>?", email, maintenant - 3600000))[0];
  if (Number(recents && recents.n) >= IDLE_BUG_MAX_PAR_HEURE_V1) {
    return { ok: false, message: 'Tu as d\u00e9j\u00e0 envoy\u00e9 plusieurs signalements r\u00e9cemment. R\u00e9essaie dans un moment.' };
  }
  const ctx = {};
  if (contexte && typeof contexte === 'object') {
    for (const k of ['version', 'menu', 'appareil', 'ecran', 'heure']) {
      if (contexte[k] != null) ctx[k] = String(contexte[k]).slice(0, 200);
    }
  }
  __idleCtx.__idleSql.exec("INSERT INTO idle_bug_reports(at,email,prenom,message,contexte,mail_status) VALUES(?,?,?,?,?,'en attente')", maintenant, email, prenom, texte, JSON.stringify(ctx));
  const id = Number(sqlRows(__idleCtx.__idleSql.exec("SELECT last_insert_rowid() AS id"))[0].id);
  return { ok: true, id };
}

/*
 * Derniers signalements (administrateur seulement). Avec l'option 'compter' : seulement le nombre de signalements pas encore vus (pour la notification « En direct », sans rien marquer). Sans option
 * (l'administrateur ouvre la liste) : tout ce qui existe est marqué comme vu (table idle_bug_vus, un repère par compte : le signalement repasse dans « En direct » tant qu'on n'est pas allé le voir).
 */
export function lireBugsSorealIdle(sessionToken, option) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  if (String(acces.emailAutorise || '').toLowerCase() !== ADMIN_SOREAL_IDLE_EMAIL) throw new Error('SOREAL_IDLE_ADMIN_REQUIS');
  if (!__idleCtx.__idleSql) return { ok: true, bugs: [] };
  __idleCtx.__idleSql.exec("CREATE TABLE IF NOT EXISTS idle_bug_reports(id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER, email TEXT, prenom TEXT, message TEXT, contexte TEXT, mail_status TEXT)");
  __idleCtx.__idleSql.exec("CREATE TABLE IF NOT EXISTS idle_bug_vus(email TEXT PRIMARY KEY, dernier INTEGER)");
  const moi = String(acces.emailAutorise || '').toLowerCase();
  const vu = sqlRows(__idleCtx.__idleSql.exec("SELECT dernier FROM idle_bug_vus WHERE email=?", moi))[0];
  const dernierVu = Number(vu && vu.dernier) || 0;
  if (option === 'compter') {
    const nouveaux = sqlRows(__idleCtx.__idleSql.exec("SELECT COUNT(*) AS n FROM idle_bug_reports WHERE id>?", dernierVu))[0];
    return { ok: true, nonVus: Number(nouveaux && nouveaux.n) || 0 };
  }
  const rows = sqlRows(__idleCtx.__idleSql.exec("SELECT id,at,email,prenom,message,contexte,mail_status FROM idle_bug_reports ORDER BY id DESC LIMIT 50"));
  const plusRecent = sqlRows(__idleCtx.__idleSql.exec("SELECT MAX(id) AS m FROM idle_bug_reports"))[0];
  if (Number(plusRecent && plusRecent.m) > dernierVu) __idleCtx.__idleSql.exec("INSERT OR REPLACE INTO idle_bug_vus(email,dernier) VALUES(?,?)", moi, Number(plusRecent.m));
  return { ok: true, bugs: rows.map((r) => ({ id: r.id, at: r.at, prenom: r.prenom, message: r.message, contexte: safeJson(r.contexte, {}) })) };
}

/* Suppression d'un signalement regle (administrateur seulement). */
export function supprimerBugSorealIdle(sessionToken, id) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  if (String(acces.emailAutorise || '').toLowerCase() !== ADMIN_SOREAL_IDLE_EMAIL) throw new Error('SOREAL_IDLE_ADMIN_REQUIS');
  if (!__idleCtx.__idleSql) return { ok: true };
  __idleCtx.__idleSql.exec("DELETE FROM idle_bug_reports WHERE id=?", Number(id) || 0);
  return { ok: true };
}

/*
 * Préparation de la partie B pour les essais (Norman, 2026-10-05 : « tu ne peux pas t'ajouter des choses dans la partie B ? modifie-la comme tu veux, je ne l'utilise pas, elle est faite pour faire des tests »).
 * Réservé à l'administrateur ET à la partie B (compte distinct de la partie A, voir idle-dev-save-slots-v1.js) : jamais la vraie partie, jamais un autre joueur. Fixe seulement des valeurs de départ bornées :
 *   boss (boss vaincus, 0-140), or (0-1e30), exp / ap (0-1e18), pp (0-1e15), energieCap (1-1e12), energiePuissance (1-1e9), energie (énergie libre, bornée au plafond).
 */
/*
 * Copie la partie A (la vraie) SUR la partie B (le banc d'essai) : mêmes niveaux, mêmes objets, mêmes monnaies, pour reproduire en essai ce que Norman voit dans son vrai jeu (2026-10-07 :
 * « copie ma partie A sur la B, comme ça tu es dans les mêmes conditions »). La partie A est seulement LUE, jamais modifiée. Les colonnes d'identité de la ligne B (id, nom « (B) », adresses
 * alias, public, rang) sont conservées : la B reste exclue du classement et du fil « En direct ». Réservé à l'administrateur, depuis la partie B.
 */
export function copierPartieASurBSorealIdle(sessionToken) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  if (!idleDevSlotsAvailableV1(acces.user) || idleDevSlotForUserV1(acces.user) !== 'b') throw new Error('PARTIE_TEST_REQUISE');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false, code: 'SOREAL_IDLE_OCCUPE', retryable: true, message: 'Le moteur termine encore une action. Réessaie dans un instant.' };
  try {
    const feuille = obtenirFeuilleJoueursSorealIdle_();
    const accesA = Object.assign({}, acces, { user: Object.assign({}, acces.user, { slot: 'a' }) });
    const ligneA = trouverLigneJoueurSorealIdle_(feuille, accesA);
    const ligneB = trouverLigneJoueurSorealIdle_(feuille, acces);
    if (ligneA === ligneB) throw new Error('PARTIES_IDENTIQUES');
    const c = CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;
    const rowA = feuille.getRange(ligneA, 1, 1, c.STATS_JSON).getValues()[0];
    const rowB = feuille.getRange(ligneB, 1, 1, c.STATS_JSON).getValues()[0];
    const gardees = [c.ID, c.NOM, c.PUBLIC, c.RANG, c.EMAIL_PRINCIPAL, c.EMAIL_CONNEXION];
    const neuve = rowA.map((valeur, i) => (gardees.indexOf(i + 1) !== -1 ? rowB[i] : valeur));
    feuille.getRange(ligneB, 1, 1, c.STATS_JSON).setValues([neuve]);
    SpreadsheetApp.flush();
    return { ok: true, copie: true, message: 'Partie A copiée sur la partie B.' };
  } finally {
    lock.releaseLock();
  }
}

export function preparerPartieTestSorealIdle(sessionToken, options) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  if (!idleDevSlotsAvailableV1(acces.user) || idleDevSlotForUserV1(acces.user) !== 'b') throw new Error('PARTIE_TEST_REQUISE');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false, code: 'SOREAL_IDLE_OCCUPE', retryable: true, message: 'Le moteur termine encore une action. R\u00e9essaie dans un instant.' };
  try {
    const feuille = obtenirFeuilleJoueursSorealIdle_();
    const ligne = trouverLigneJoueurSorealIdle_(feuille, acces);
    initialiserModeleJoueurSorealIdleV41SiNecessaire_(feuille, ligne);
    const c = CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;
    const row = feuille.getRange(ligne, 1, 1, c.STATS_JSON).getValues()[0];
    const stats = statsJoueurSorealIdle_(row[c.STATS_JSON - 1]);
    const meta = stats.metaNgu;
    if (!(meta && meta.version === IDLE_NGU_META_VERSION && meta.resources && meta.resources.energy && meta.currencies)) throw new Error('PARTIE_TEST_ETAT_INCOMPLET');

    const o = options && typeof options === 'object' ? options : {};
    const borne = (v, min, max) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null; };
    /* Nettoyage du fil « En direct » : avant ce correctif, les essais en partie B s'enregistraient sous l'adresse réelle ; purgerFluxDepuis (ms) efface les annonces de ce compte depuis cet instant. */
    const purge = borne(o.purgerFluxDepuis, 0, Date.now());
    if (purge !== null && __idleCtx.__idleSql) {
      const reel = String(ADMIN_SOREAL_IDLE_EMAIL || '').toLowerCase();
      __idleCtx.__idleSql.exec('DELETE FROM idle_flux WHERE email=? AND at>=?', reel, purge);
    }
    const boss = borne(o.boss, 0, 140);
    const or = borne(o.or, 0, 1e30);
    const cap = borne(o.energieCap, 1, 1e12);
    const puissance = borne(o.energiePuissance, 1, 1e9);
    const libre = borne(o.energie, 0, 1e12);
    const magieCap = borne(o.magieCap, 1, 1e12);
    const magiePuissance = borne(o.magiePuissance, 1, 1e9);
    const magieLibre = borne(o.magie, 0, 1e12);
    /* Monnaies d'essai : EXP, AP, PP (boutiques, atouts), bornées. */
    const exp = borne(o.exp, 0, 1e18);
    const ap = borne(o.ap, 0, 1e18);
    const pp = borne(o.pp, 0, 1e15);
    const graines = borne(o.graines, 0, 1e15);
    /* Puissance/robustesse d'Aventure permanentes d'essai (banc d'essai uniquement) : sans équipement, la tour ne peut pas tourner en partie B. */
    const aventurePuissance = borne(o.aventurePuissance, 0, 1e18);
    const aventureRobustesse = borne(o.aventureRobustesse, 0, 1e18);
    const applique = {};

    if (aventurePuissance !== null || aventureRobustesse !== null) {
      if (!meta.adventure || typeof meta.adventure !== 'object') meta.adventure = {};
      if (!meta.adventure.permanent || typeof meta.adventure.permanent !== 'object') meta.adventure.permanent = {};
      if (aventurePuissance !== null) { meta.adventure.permanent.adventurePower = aventurePuissance; applique.aventurePuissance = aventurePuissance; }
      if (aventureRobustesse !== null) { meta.adventure.permanent.adventureToughness = aventureRobustesse; applique.aventureRobustesse = aventureRobustesse; }
    }

    if (boss !== null) {
      const b = Math.floor(boss);
      feuille.getRange(ligne, c.BOSS_VAINCUS).setValue(b);
      if (meta.records && typeof meta.records === 'object') meta.records.highestBoss = Math.max(b, nombreSorealIdle_(meta.records.highestBoss, 0));
      applique.boss = b;
    }
    /* Systèmes à objet consommable (NGU, Yggdrasil, Gold Diggers, Barbe, ITOPOD, Wandoos) : débloqués d'office pour les essais en partie B. */
    if (o.systemes === true) {
      if (!meta.adventure || typeof meta.adventure !== 'object') meta.adventure = {};
      const drapeaux = (meta.adventure.unlockFlags && typeof meta.adventure.unlockFlags === 'object') ? meta.adventure.unlockFlags : {};
      for (const k of ['ngu', 'yggdrasil', 'diggers', 'beards', 'tower', 'wandoos', 'hacks', 'wishes', 'questing', 'quirks', 'cards', 'cooking', 'macguffins', 'walderpFinalDefeated', 'basicTrainingComplete']) drapeaux[k] = true; /* banc d'essai : tous les systèmes qui acceptent de l'énergie, de la magie ou de la 3e ressource (2026-10-09) */
      meta.adventure.unlockFlags = drapeaux;
      applique.systemes = true;
    }
    if (or !== null) { meta.currencies.gold = or; applique.or = or; }
    if (exp !== null) { meta.currencies.experience = exp; applique.exp = exp; }
    if (ap !== null) { meta.currencies.ap = ap; applique.ap = ap; }
    if (pp !== null) { meta.currencies.pp = pp; applique.pp = pp; }
    if (graines !== null) { meta.currencies.seeds = graines; applique.graines = graines; }
    const e = meta.resources.energy;
    if (cap !== null) { e.cap = cap; e.capNaturel = cap; applique.energieCap = cap; }
    if (puissance !== null) { e.power = puissance; applique.energiePuissance = puissance; }
    const mg = meta.resources && meta.resources.magic;
    if (mg && (magieCap !== null || magiePuissance !== null || magieLibre !== null)) {
      if (magieCap !== null) { mg.cap = magieCap; mg.capNaturel = magieCap; applique.magieCap = magieCap; }
      if (magiePuissance !== null) { mg.power = magiePuissance; applique.magiePuissance = magiePuissance; }
      if (magieLibre !== null || magieCap !== null) { mg.current = Math.min(magieLibre !== null ? magieLibre : mg.current, Math.max(1, nombreSorealIdle_(mg.cap, 1))); mg.fillProgress = 0; applique.magie = mg.current; }
    }
    if (libre !== null || cap !== null) {
      e.current = Math.min(libre !== null ? libre : e.current, Math.max(1, nombreSorealIdle_(e.cap, 1)));
      e.fillProgress = 0;
      applique.energie = e.current;
      feuille.getRange(ligne, c.ENERGIE).setValue(e.current);
    }
    feuille.getRange(ligne, c.STATS_JSON).setValue(JSON.stringify(stats));
    SpreadsheetApp.flush();

    return {
      ok: true,
      applique,
      joueur: construireEtatJoueurSorealIdle_(feuille, ligne, { gain: 0, secondesComptabilisees: 0, degats: 0, bossBattus: 0, xpGagnee: 0, niveauxGagnes: 0, dropsRecents: [] })
    };
  } finally {
    lock.releaseLock();
  }
}

/*
 * Histoires plein écran éditables (voir idle-histoires-v1.js). Joueur : obtenirHistoireBossSorealIdle -- UNIQUEMENT l'histoire du boss
 * demandé (jamais la liste : anti-spoil). Administrateur (technicien.soreal@gmail.com) : lister / enregistrer / supprimer.
 */
function exigerAdminHistoiresSorealIdle_(sessionToken) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  if (String(acces.emailAutorise || '').toLowerCase() !== ADMIN_SOREAL_IDLE_EMAIL) throw new Error('SOREAL_IDLE_ADMIN_REQUIS');
  if (!__idleCtx.__idleSql) throw new Error('SOREAL_IDLE_SQL_ABSENT');
  return acces;
}

export function obtenirHistoireBossSorealIdle(sessionToken, boss) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  if (!__idleCtx.__idleSql) return { ok: true, histoire: null };
  /*
   * Anti-spoil (règle n°2, audit du 2026-10-10, IDLE-AUDIT-SEC-006) : l'histoire d'un boss n'est donnée qu'à un joueur qui l'a atteint. Le client la demande à la mort du boss N (bossSelection = N + 1) AVANT que le
   * serveur ait confirmé la victoire prédite (« boss suivant instantané ») : on accepte donc jusqu'à un boss au-delà du meilleur résultat connu (boss vaincus du run ou record permanent), jamais plus.
   * En cas de doute (ligne introuvable), rien n'est donné.
   */
  const n = Math.floor(Number(boss) || 0);
  let atteint = -1;
  try {
    const feuille = obtenirFeuilleJoueursSorealIdle_();
    const ligne = trouverLigneJoueurSorealIdle_(feuille, acces);
    const c = CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;
    const row = feuille.getRange(ligne, 1, 1, c.STATS_JSON).getValues()[0];
    const stats = statsJoueurSorealIdle_(row[c.STATS_JSON - 1]);
    const vaincus = Math.max(0, Math.floor(nombreSorealIdle_(row[c.BOSS_VAINCUS - 1], 0)));
    const record = Math.max(0, Math.floor(nombreSorealIdle_(stats && stats.metaNgu && stats.metaNgu.records && stats.metaNgu.records.highestBoss, 0)));
    atteint = Math.max(vaincus, record);
  } catch (_e) {
    atteint = -1;
  }
  if (atteint < 0 || n > atteint + 1) return { ok: true, histoire: null };
  return { ok: true, histoire: histoireDuBossV1(__idleCtx.__idleSql, boss) };
}

/* Admin, SUR SON PROPRE COMPTE : annule une victoire de titan obtenue par un bug (Norman, 2026-10-04). Les récompenses déjà reçues restent. */
export function annulerVictoireTitanAdminSorealIdle(sessionToken, titanId) {
  const acces = exigerAdminHistoiresSorealIdle_(sessionToken);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1800)) return { ok: false, message: 'Le jeu est occupé.' };
  try {
    const feuille = obtenirFeuilleJoueursSorealIdle_();
    const ligne = trouverLigneJoueurSorealIdle_(feuille, acces);
    assurerDonneesJeuSorealIdle_(feuille, ligne);
    const cellule = feuille.getRange(ligne, CONFIG_SOREAL_IDLE.COLONNES_JOUEURS.STATS_JSON);
    const stats = statsJoueurSorealIdle_(cellule.getValue());
    const aventure = stats.metaNgu && stats.metaNgu.adventure;
    if (!aventure || typeof aventure !== 'object') return { ok: false, message: 'Aucune aventure.' };
    let resultat;
    try { resultat = annulerVictoireTitanV1(aventure, String(titanId || 't1')); } catch (e) { return { ok: false, message: String(e && e.message || e) }; }
    cellule.setValue(JSON.stringify(stats));
    SpreadsheetApp.flush();
    return Object.assign({ ok: true }, resultat);
  } finally {
    lock.releaseLock();
  }
}

/* Cherche un joueur par adresse OU par nom (sans accent ni majuscule, une seule correspondance exigée). */
function trouverJoueurAdminSorealIdle_(feuille, saisie) {
  const c = CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;
  const net = (v) => String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  const cible = net(saisie);
  if (!cible) return { erreur: 'PARAMETRES' };
  const dernier = Math.max(2, feuille.getLastRow());
  const lignes = feuille.getRange(2, 1, dernier - 1, c.EMAIL_CONNEXION).getValues();
  const trouves = [];
  for (let i = 0; i < lignes.length; i += 1) {
    const principal = net(lignes[i][c.EMAIL_PRINCIPAL - 1]);
    const connexion = net(lignes[i][c.EMAIL_CONNEXION - 1]);
    const nom = net(lignes[i][c.NOM - 1]);
    if (!(principal || connexion)) continue;
    if (cible.indexOf('@') !== -1 ? (principal === cible || connexion === cible) : nom === cible) {
      trouves.push({ ligne: i + 2, email: connexion || principal, nom: String(lignes[i][c.NOM - 1] || '') });
    }
  }
  if (!trouves.length) return { erreur: 'JOUEUR_INTROUVABLE' };
  if (trouves.length > 1) return { erreur: 'JOUEUR_AMBIGU', noms: trouves.map((x) => x.nom + ' <' + x.email + '>') };
  return trouves[0];
}

/*
 * Crédit d'EXP à un joueur par l'administrateur (Norman, 2026-10-08 : les 300 EXP du set de la Grotte non versés à Sébastien). Agit sur la ligne du joueur désigné par son adresse, jamais sur celle de l'administrateur.
 * params = { email, montant (entier, 1 à 1 000 000 000), reference (texte unique : le même crédit ne passe qu'une fois pour un joueur) }. La variation est inscrite au journal d'EXP avec cette référence.
 */
export function crediterExpAdminSorealIdle(sessionToken, params) {
  exigerAdminHistoiresSorealIdle_(sessionToken);
  const p = params && typeof params === 'object' ? params : {};
  const email = String(p.email || p.joueur || '').trim();
  const montant = Math.floor(Number(p.montant));
  const reference = String(p.reference || '').trim().replace(/[^\w .:@+-]/g, '').slice(0, 80);
  if (!email || !(montant >= 1 && montant <= 1e9) || !reference) return { ok: false, code: 'PARAMETRES', message: 'joueur (nom ou adresse), montant (1 à 1 000 000 000) et reference sont obligatoires.' };
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1800)) return { ok: false, message: 'Le jeu est occupé.' };
  try {
    const feuille = obtenirFeuilleJoueursSorealIdle_();
    const c = CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;
    const trouve = trouverJoueurAdminSorealIdle_(feuille, email);
    if (trouve.erreur === 'JOUEUR_AMBIGU') return { ok: false, code: 'JOUEUR_AMBIGU', message: 'Plusieurs joueurs correspondent : ' + trouve.noms.join(' ; ') + '. Utilise l’adresse e-mail.' };
    if (trouve.erreur) return { ok: false, code: 'JOUEUR_INTROUVABLE', message: 'Aucun joueur avec ce nom ou cette adresse.' };
    const ligne = trouve.ligne;
    const cle = trouve.email;
    const etiquette = 'crediterExpAdminSorealIdle:' + reference;
    if (creditDejaFaitV1(__idleCtx.__idleSql, cle, etiquette)) return { ok: false, code: 'DEJA_FAIT', message: 'Ce crédit (référence « ' + reference + ' ») a déjà été fait pour ce joueur.' };
    const cellule = feuille.getRange(ligne, c.STATS_JSON);
    const stats = statsJoueurSorealIdle_(cellule.getValue());
    if (!stats.metaNgu || !stats.metaNgu.currencies || typeof stats.metaNgu.currencies !== 'object') return { ok: false, code: 'ETAT_ABSENT', message: 'Ce joueur n’a pas encore d’état de jeu.' };
    const avant = Math.max(0, nombreSorealIdle_(stats.metaNgu.currencies.experience, 0));
    const apres = avant + montant;
    stats.metaNgu.currencies.experience = apres;
    cellule.setValue(JSON.stringify(stats));
    feuille.getRange(ligne, c.XP).setValue(apres);
    /* Étiquette lue par __idleCommit pour la ligne du journal. */
    __idleCtx.__idleReferenceGainV1 = reference;
    SpreadsheetApp.flush();
    return { ok: true, email: cle, avant, apres, montant, reference };
  } finally {
    lock.releaseLock();
  }
}

/*
 * Record « combat le plus long » retiré par l'administrateur (Norman, 2026-10-21 : « supprime le record de Sylvain, il est forcément faux » : 1 min 48 enregistré pendant que la page était fermée ou en arrière-plan). params = { joueur (nom ou adresse) }.
 * Le jeu tournant dans la page de chaque joueur (jeu local), la ligne du serveur est RÉÉCRITE à chaque envoi de l'appareil : remettre le record à zéro ici ne suffirait pas (l'appareil renverrait l'ancien). La valeur retirée est donc
 * mémorisée (table idle_records_retires) et le serveur la remet à zéro dans tout envoi qui la porte encore (idle-local-sync-v1.js) ; un record plus long, obtenu ensuite, n'est jamais touché.
 */
export function retirerRecordCombatLongAdminSorealIdle(sessionToken, params) {
  exigerAdminHistoiresSorealIdle_(sessionToken);
  const p = params && typeof params === 'object' ? params : {};
  const joueur = String(p.joueur || p.email || '').trim();
  if (!joueur) return { ok: false, code: 'PARAMETRES', message: 'Écris le prénom ou l’adresse du joueur.' };
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1800)) return { ok: false, message: 'Le jeu est occupé.' };
  try {
    const feuille = obtenirFeuilleJoueursSorealIdle_();
    const c = CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;
    const trouve = trouverJoueurAdminSorealIdle_(feuille, joueur);
    if (trouve.erreur === 'JOUEUR_AMBIGU') return { ok: false, code: 'JOUEUR_AMBIGU', message: 'Plusieurs joueurs correspondent : ' + trouve.noms.join(' ; ') + '. Utilise l’adresse e-mail.' };
    if (trouve.erreur) return { ok: false, code: 'JOUEUR_INTROUVABLE', message: 'Aucun joueur avec ce nom ou cette adresse.' };
    const cellule = feuille.getRange(trouve.ligne, c.STATS_JSON);
    const stats = statsJoueurSorealIdle_(cellule.getValue());
    const avant = Math.max(0, nombreSorealIdle_(stats.combatBossPlusLongSec, 0));
    if (!(avant > 0)) return { ok: false, code: 'AUCUN_RECORD', message: 'Ce joueur n’a aucun record « combat le plus long ».' };
    stats.combatBossPlusLongSec = 0;
    stats.combatBossPlusLongGagne = null;
    cellule.setValue(JSON.stringify(stats));
    __idleCtx.__idleSql.exec('CREATE TABLE IF NOT EXISTS idle_records_retires(email TEXT NOT NULL, code TEXT NOT NULL, valeur REAL NOT NULL, at INTEGER NOT NULL)');
    __idleCtx.__idleSql.exec('INSERT INTO idle_records_retires(email,code,valeur,at) VALUES(?,?,?,?)', trouve.email, 'combatLong', avant, Date.now());
    SpreadsheetApp.flush();
    return { ok: true, email: trouve.email, nom: trouve.nom, avant };
  } finally {
    lock.releaseLock();
  }
}

/* Journal des variations d'EXP (administrateur) : params = { email (facultatif : sinon tous les joueurs), limite }. */
export function lireGainsExpAdminSorealIdle(sessionToken, params) {
  exigerAdminHistoiresSorealIdle_(sessionToken);
  const p = params && typeof params === 'object' ? params : {};
  let email = String(p.email || p.joueur || '').trim();
  if (email) {
    const trouve = trouverJoueurAdminSorealIdle_(obtenirFeuilleJoueursSorealIdle_(), email);
    if (trouve.erreur === 'JOUEUR_AMBIGU') return { ok: false, code: 'JOUEUR_AMBIGU', message: 'Plusieurs joueurs correspondent : ' + trouve.noms.join(' ; ') + '.' };
    if (trouve.erreur) return { ok: false, code: 'JOUEUR_INTROUVABLE', message: 'Aucun joueur avec ce nom ou cette adresse.' };
    email = trouve.email;
  }
  return { ok: true, lignes: lireGainsExpV1(__idleCtx.__idleSql, { email, limite: p.limite }) };
}

export function listerHistoiresAdminSorealIdle(sessionToken) {
  exigerAdminHistoiresSorealIdle_(sessionToken);
  const boss = [];
  for (const [numero, nom] of NGU_BOSS_NAMES_FR_V1) boss.push({ numero, nom });
  boss.sort((a, b) => a.numero - b.numero);
  return { ok: true, histoires: lireHistoiresV1(__idleCtx.__idleSql), boss };
}

export function enregistrerHistoireAdminSorealIdle(sessionToken, histoire) {
  exigerAdminHistoiresSorealIdle_(sessionToken);
  try {
    return { ok: true, histoire: enregistrerHistoireV1(__idleCtx.__idleSql, histoire) };
  } catch (e) {
    const code = String(e && e.message || e);
    if (code === 'HISTOIRE_BOSS_DEJA_UTILISE') return { ok: false, code, message: 'Ce boss a déjà une histoire active : « ' + String(e.autre || '') + ' ». Change son boss ou désactive-la d’abord.' };
    if (/^HISTOIRE_/.test(code)) return { ok: false, code, message: code };
    throw e;
  }
}

export function supprimerHistoireAdminSorealIdle(sessionToken, id) {
  exigerAdminHistoiresSorealIdle_(sessionToken);
  /* L'identifiant arrive soit en texte, soit dans un objet { id } (le pont client ajoute la session au premier argument de type texte). */
  supprimerHistoireV1(__idleCtx.__idleSql, id && typeof id === 'object' ? id.id : id);
  return { ok: true };
}

/*
 * Tutoriel éditable (voir idle-tutoriel-v1.js). Joueur : obtenirTutorielSorealIdle -- UNIQUEMENT les guides du déclencheur demandé (début du jeu, ouverture d'un menu, boss vaincu) et le réglage
 * « ancien tutoriel » ; jamais la liste complète (anti-spoil). Administrateur : lister / enregistrer / supprimer / régler l'ancien tutoriel.
 */
export function obtenirTutorielSorealIdle(sessionToken, contexte) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  if (!__idleCtx.__idleSql) return { ok: true, ancienActif: true, ancienMenusActif: true, guides: [] };
  const ctx = contexte && typeof contexte === 'object' ? contexte : {};
  const ancienActif = ancienTutorielActifV1(__idleCtx.__idleSql);
  const ancienMenusActif = ancienMenusActifV1(__idleCtx.__idleSql);
  /* Un guide de boss n'est donné qu'à un joueur qui l'a atteint (même règle que les histoires : IDLE-AUDIT-SEC-006). */
  if (ctx.boss != null) {
    let atteint = -1;
    try {
      const feuille = obtenirFeuilleJoueursSorealIdle_();
      const ligne = trouverLigneJoueurSorealIdle_(feuille, acces);
      const c = CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;
      const row = feuille.getRange(ligne, 1, 1, c.STATS_JSON).getValues()[0];
      const stats = statsJoueurSorealIdle_(row[c.STATS_JSON - 1]);
      const vaincus = Math.max(0, Math.floor(nombreSorealIdle_(row[c.BOSS_VAINCUS - 1], 0)));
      const record = Math.max(0, Math.floor(nombreSorealIdle_(stats && stats.metaNgu && stats.metaNgu.records && stats.metaNgu.records.highestBoss, 0)));
      atteint = Math.max(vaincus, record);
    } catch (_e) {
      atteint = -1;
    }
    if (atteint < 0 || Math.floor(Number(ctx.boss) || 0) > atteint + 1) return { ok: true, ancienActif, ancienMenusActif, guides: [] };
  }
  return { ok: true, ancienActif, ancienMenusActif, guides: guidesPourJoueurV1(__idleCtx.__idleSql, ctx) };
}

export function listerTutorielAdminSorealIdle(sessionToken) {
  exigerAdminHistoiresSorealIdle_(sessionToken);
  return { ok: true, guides: lireGuidesV1(__idleCtx.__idleSql), ancienActif: ancienTutorielActifV1(__idleCtx.__idleSql), ancienMenusActif: ancienMenusActifV1(__idleCtx.__idleSql) };
}

export function enregistrerTutorielAdminSorealIdle(sessionToken, guide) {
  exigerAdminHistoiresSorealIdle_(sessionToken);
  try {
    return { ok: true, guide: enregistrerGuideV1(__idleCtx.__idleSql, guide) };
  } catch (e) {
    const code = String(e && e.message || e);
    if (/^TUTO_/.test(code)) return { ok: false, code, message: code };
    throw e;
  }
}

export function supprimerTutorielAdminSorealIdle(sessionToken, id) {
  exigerAdminHistoiresSorealIdle_(sessionToken);
  /* L'identifiant arrive soit en texte, soit dans un objet { id } (le pont client ajoute la session au premier argument de type texte). */
  supprimerGuideV1(__idleCtx.__idleSql, id && typeof id === 'object' ? id.id : id);
  return { ok: true };
}

export function reglerAncienTutorielAdminSorealIdle(sessionToken, actif) {
  exigerAdminHistoiresSorealIdle_(sessionToken);
  /* Argument : un booléen (ancien tutoriel de départ) ou { actif, quoi:'menus' } (anciennes fenêtres d'explication des menus). */
  const objet = actif && typeof actif === 'object' ? actif : { actif };
  const valeur = objet.actif === true || objet.actif === 'true' || objet.actif === 1;
  if (String(objet.quoi || '') === 'menus') reglerAncienMenusV1(__idleCtx.__idleSql, valeur);
  else reglerAncienTutorielV1(__idleCtx.__idleSql, valeur);
  return { ok: true, ancienActif: ancienTutorielActifV1(__idleCtx.__idleSql), ancienMenusActif: ancienMenusActifV1(__idleCtx.__idleSql) };
}

/*
 * Textes éditables (Norman, 2026-10-02 : chroniques de boss, popups et fenêtres explicatives modifiables par l'administrateur, avec voix
 * différentes ; voir idle-textes-v1.js). Joueur : obtenirTextesSurchargesSorealIdle (textes de popups modifiés + empreintes de voix, jamais le
 * texte d'une chronique de boss : il arrive avec le boss). Administrateur : lister (tous les boss, texte d'origine compris) / enregistrer /
 * supprimer. Le contrôle d'administrateur compare l'adresse RÉELLE du compte (jamais celle de la partie B) : il fonctionne dans les deux parties.
 */
export function obtenirTextesSurchargesSorealIdle(sessionToken) {
  exigerAccesSorealIdle_(sessionToken);
  if (!__idleCtx.__idleSql) return { ok: true, popups: {}, voix: [] };
  return Object.assign({ ok: true }, surchargesPourJoueurV1(__idleCtx.__idleSql));
}

export function listerTextesAdminSorealIdle(sessionToken) {
  exigerAdminHistoiresSorealIdle_(sessionToken);
  const textes = lireTextesV1(__idleCtx.__idleSql);
  const catalogue = bossCatalogueSorealIdle_();
  const boss = [];
  for (const [numero, nom] of NGU_BOSS_NAMES_FR_V1) {
    const ligne = catalogue[numero - 1];
    const surcharge = textes.find((t) => t.cle === 'boss:' + numero) || null;
    /* nom = nom ACTUEL (peut être modifié) ; nomOriginal = celui du catalogue NGU français. */
    const nomActuel = surcharge && surcharge.champs && typeof surcharge.champs.nom === 'string' && surcharge.champs.nom ? surcharge.champs.nom : nom;
    boss.push({ numero, nom: nomActuel, nomOriginal: nom, original: histoireBossFrAligneeV1(numero, String(ligne && ligne.histoire || '')), surcharge });
  }
  boss.sort((a, b) => a.numero - b.numero);
  return { ok: true, boss, popups: textes.filter((t) => !/^boss:/.test(t.cle)) };
}

export function enregistrerTexteAdminSorealIdle(sessionToken, texte) {
  exigerAdminHistoiresSorealIdle_(sessionToken);
  try {
    const t = enregistrerTexteV1(__idleCtx.__idleSql, texte);
    invaliderCacheTextesBossV1();
    return { ok: true, texte: t };
  } catch (e) {
    const code = String(e && e.message || e);
    if (/^TEXTE_/.test(code)) return { ok: false, code, message: code };
    throw e;
  }
}

export function supprimerTexteAdminSorealIdle(sessionToken, cle) {
  exigerAdminHistoiresSorealIdle_(sessionToken);
  /* La clé arrive soit en texte, soit dans un objet { cle } (le pont client ajoute la session au premier argument de type texte). */
  supprimerTexteV1(__idleCtx.__idleSql, cle && typeof cle === 'object' ? cle.cle : cle);
  invaliderCacheTextesBossV1();
  return { ok: true };
}
