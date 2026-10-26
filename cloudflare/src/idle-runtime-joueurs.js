/*
 * Identités, pseudos, classement et administration des accès (audit d'architecture, 2026-10-16 : découpage de idle-sqlite-runtime.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { idleDevSlotForUserV1, idleDevSlotsAvailableV1, idleDevEstAdminV1, idleDevEstEmailPartieTestV1, idleDevNormalizeSlotV1 } from "./idle-dev-save-slots-v1.js";
import { lireProfilIdleV1, noterPassageProfilIdleV1, libelleJoueurIdleV1, nomJeuJoueurIdleV1, definirPseudoProfilIdleV1, listerJoueursExternesIdleV1, profilsParEmailIdleV1 } from "./idle-profile-v1.js";
import { sqlRows } from "./core/sqlite-core.js";
import { CONFIG_SOREAL_IDLE, nombreSorealIdle_, normaliserEmailSorealIdle_ } from "./idle-runtime-config.js";
import { LockService, SpreadsheetApp, __idleCtx } from "./idle-sqlite-runtime.js";
import { assurerDonneesJeuSorealIdle_, exigerAccesSorealIdle_, extraireEmailsUtilisateurSorealIdle_, obtenirFeuilleJoueursSorealIdle_, obtenirSpreadsheetSorealIdle_, trouverLigneJoueurSorealIdle_ } from "./idle-runtime-acces.js";
import { statsJoueurSorealIdle_ } from "./idle-runtime-collection.js";
import { definitionBossSorealIdle_, niveauRequisBossSorealIdle_ } from "./idle-runtime-boss.js";

/*
 * ------------------------------------------------------------------
 * Profil du joueur : pseudo, joueur externe (2026-09-26) — voir idle-profile-v1.js
 * ------------------------------------------------------------------
 */
function emailBrutProfilSorealIdle_(acces) {
  return normaliserEmailSorealIdle_(
    (acces && acces.user && (acces.user.email || acces.user.emailConnexion)) ||
    (acces && acces.emailAutorise)
  );
}

/* Adresse propre du joueur : sert aux PROFILS (pseudo, prénom). La présence, le fil et le chat utilisent la clé de ligne ci-dessous. */
function emailProfilSorealIdle_(acces) {
  return emailBrutProfilSorealIdle_(acces);
}

/*
 * Clé UNIQUE d'un joueur dans « En direct », la présence et le chat (Norman, 2026-10-09 : « Sébastien et Saka (Sébastien) sont le même compte, il ne faut afficher que Saka (Sébastien) »). Un même joueur arrive avec
 * des adresses différentes selon le lanceur (APP ou TV) et la ligne de jeu est retrouvée par adresse OU, à défaut, adoptée d'après le prénom (ce qui réécrit les adresses de la ligne) : l'adresse n'est donc
 * pas stable. La clé est l'identifiant de LA LIGNE de jeu (colonne ID), le même quel que soit le lanceur. La partie d'essai (B) garde sa clé à part ; en cas d'échec, on retombe sur l'adresse brute.
 * Chaque adresse rencontrée est mémorisée avec cette clé (table idle_alias) : on retrouve ainsi le pseudo posé sous l'une des adresses du joueur.
 */
export function cleJoueurSorealIdle_(acces) {
  const brut = emailBrutProfilSorealIdle_(acces);
  if (!acces || typeof acces !== 'object') return brut;
  if (typeof acces.__cleJoueurV1 === 'string' && acces.__cleJoueurV1) return acces.__cleJoueurV1;
  let cle = brut;
  try {
    if (__idleCtx.__idleSql && idleDevSlotForUserV1(acces.user) === 'a') {
      const feuille = obtenirFeuilleJoueursSorealIdle_();
      const ligne = trouverLigneJoueurSorealIdle_(feuille, acces);
      const c = CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;
      const id = String(feuille.getRange(ligne, c.ID).getValue() || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (id) {
        cle = 'ligne-' + id + '@joueur.idle';
        memoriserAliasJoueurSorealIdle_(cle, adressesJoueurSorealIdle_(acces));
      }
    }
  } catch (_) {
    cle = brut;
  }
  try { acces.__cleJoueurV1 = cle; } catch (_) { /* objet figé : pas de mémo */ }
  return cle;
}

/* Adresses sous lesquelles ce joueur se présente (ses adresses de session). */
function adressesJoueurSorealIdle_(acces) {
  const liste = [emailBrutProfilSorealIdle_(acces)];
  try {
    extraireEmailsUtilisateurSorealIdle_(acces && acces.user).forEach(function (e) { liste.push(normaliserEmailSorealIdle_(e)); });
    if (acces && acces.emailAutorise) liste.push(normaliserEmailSorealIdle_(acces.emailAutorise));
  } catch (_) { /* repli : l'adresse brute */ }
  return liste.filter(function (e, i) { return e && liste.indexOf(e) === i; });
}

const __aliasPretV1 = new WeakSet();

function assurerAliasSorealIdleV1_() {
  /* audit 2026-10-13 : table créée une seule fois par connexion SQL */
  if (!__idleCtx.__idleSql || __aliasPretV1.has(__idleCtx.__idleSql)) return;
  __idleCtx.__idleSql.exec('CREATE TABLE IF NOT EXISTS idle_alias(email TEXT PRIMARY KEY, cle TEXT NOT NULL)');
  __aliasPretV1.add(__idleCtx.__idleSql);
}

function memoriserAliasJoueurSorealIdle_(cle, adresses) {
  if (!__idleCtx.__idleSql) return;
  assurerAliasSorealIdleV1_();
  adresses.forEach(function (e) {
    const rows = __idleCtx.__idleSql.exec('SELECT cle FROM idle_alias WHERE email=?', e);
    const liste = Array.isArray(rows) ? rows : (rows && typeof rows.toArray === 'function' ? rows.toArray() : []);
    if (liste.length && liste[0].cle === cle) return;
    __idleCtx.__idleSql.exec('INSERT OR REPLACE INTO idle_alias(email,cle) VALUES(?,?)', e, cle);
  });
}

/*
 * Profil d'une adresse ; ce qui manque (pseudo, prénom) est repris sous une autre adresse du même joueur (même ligne de jeu). Le prénom compte autant que le pseudo : « Saka (Sébastien) » s'affichait
 * « Saka » dès que le pseudo était posé sous une adresse et le prénom sous une autre (Norman, 2026-10-10).
 */
function profilAvecAliasSorealIdle_(email) {
  const e = normaliserEmailSorealIdle_(email);
  if (!__idleCtx.__idleSql || !e) return null;
  let profil = lireProfilIdleV1(__idleCtx.__idleSql, e);
  if (profil && profil.pseudo && profil.prenom) return profil;
  try {
    assurerAliasSorealIdleV1_();
    const brut = __idleCtx.__idleSql.exec('SELECT a2.email AS email FROM idle_alias a1 JOIN idle_alias a2 ON a2.cle=a1.cle WHERE a1.email=?', e);
    const autres = Array.isArray(brut) ? brut : (brut && typeof brut.toArray === 'function' ? brut.toArray() : []);
    autres.forEach(function (r) {
      if (profil && profil.pseudo && profil.prenom) return;
      const p = lireProfilIdleV1(__idleCtx.__idleSql, r.email);
      if (!p) return;
      if (!profil) { if (p.pseudo || p.prenom) profil = Object.assign({}, p); return; }
      if (!profil.pseudo && p.pseudo) profil = Object.assign({}, profil, { pseudo: p.pseudo, externe: profil.externe });
      if (!profil.prenom && p.prenom) profil = Object.assign({}, profil, { prenom: p.prenom });
    });
  } catch (_) { /* repli : le profil de l'adresse seule */ }
  return profil;
}

/* Enregistre le passage du joueur (adresse, externe ou non, nom Google) ; jamais bloquant pour le jeu. */
export function noterPassageIdleV1_(acces) {
  if (!__idleCtx.__idleSql) return;
  try {
    noterPassageProfilIdleV1(__idleCtx.__idleSql, {
      email: emailProfilSorealIdle_(acces),
      externe: Boolean(acces.user && acces.user.externe === true),
      googleName: acces.user && acces.user.externe === true ? acces.user.name : '',
      prenom: acces.user && acces.user.externe !== true ? String(acces.user.prenom || '').trim() : ''
    });
  } catch (_) {
    /* le profil est un confort : une erreur ici ne doit jamais empêcher de jouer */
  }
}

export function identiteJoueurSorealIdle_(acces) {
  const externe = Boolean(acces && acces.user && acces.user.externe === true);
  let profil = null;
  try {
    profil = __idleCtx.__idleSql ? profilAvecAliasSorealIdle_(emailProfilSorealIdle_(acces)) : null;
  } catch (_) {
    profil = null;
  }
  const pseudo = profil ? profil.pseudo : '';
  const prenom = externe ? '' : String((acces && acces.user && acces.user.prenom) || '').trim();
  const profilAffiche = { pseudo: pseudo, externe: externe, googleName: profil ? profil.googleName : '', prenom: profil ? profil.prenom : '' };
  return {
    externe: externe,
    pseudo: pseudo,
    prenom: prenom,
    /* Nom vu des autres : « Pseudo (Prénom) » pour un ouvrier, « Pseudo » pour un externe. */
    nomAffiche: libelleJoueurIdleV1(profilAffiche, prenom) || 'Joueur',
    /* L'adresse n'est montrée qu'au joueur externe lui-même (compte Google utilisé). */
    email: externe ? emailProfilSorealIdle_(acces) : ''
  };
}

export function nomJeuDepuisLigneSorealIdle_(row, c) {
  const nomLigne = String(row[c.NOM - 1] || '');
  if (!__idleCtx.__idleSql) return nomLigne;
  try {
    const email = normaliserEmailSorealIdle_(row[c.EMAIL_PRINCIPAL - 1] || row[c.EMAIL_CONNEXION - 1] || '');
    const profil = email ? profilAvecAliasSorealIdle_(email) : null;
    return profil ? nomJeuJoueurIdleV1(profil, nomLigne) : nomLigne;
  } catch (_) {
    return nomLigne;
  }
}

export function obtenirIdentiteSorealIdle(sessionToken) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  return Object.assign({ ok: true }, identiteJoueurSorealIdle_(acces));
}

export function definirPseudoSorealIdle(sessionToken, pseudo) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  if (!__idleCtx.__idleSql) throw new Error('SOREAL_IDLE_BASE_INDISPONIBLE');
  noterPassageIdleV1_(acces);
  const resultat = definirPseudoProfilIdleV1(__idleCtx.__idleSql, emailProfilSorealIdle_(acces), pseudo);
  if (!resultat.ok) return { ok: false, code: resultat.code, message: resultat.message };
  return Object.assign({ ok: true }, identiteJoueurSorealIdle_(acces));
}

function exigerAdministrateurSorealIdle_(sessionToken) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  if (extraireEmailsUtilisateurSorealIdle_(acces.user).indexOf(ADMIN_SOREAL_IDLE_EMAIL) === -1) {
    throw new Error('SOREAL_IDLE_ADMIN_REQUIS');
  }
  if (!__idleCtx.__idleSql) throw new Error('SOREAL_IDLE_BASE_INDISPONIBLE');
  return acces;
}

/* Interrupteur d'accès public (joueurs connectés par Google) : administrateur seulement, fermé par défaut. */
export function definirAccesPublicSorealIdle(sessionToken, actif) {
  exigerAdministrateurSorealIdle_(sessionToken);
  const ouvert = actif === true || actif === 'true' || actif === 1 || actif === '1';
  __idleCtx.__idleSql.exec(
    "INSERT INTO idle_meta(meta_key,meta_value) VALUES('acces_public',?) "+
    "ON CONFLICT(meta_key) DO UPDATE SET meta_value=excluded.meta_value",
    ouvert ? '1' : '0'
  );
  __idleCtx.__idleAccesPublic = ouvert;
  return { ok: true, accesPublic: ouvert };
}

/* Joueurs connectés par Google : l'administrateur voit leur adresse et leur nom Google (les autres joueurs ne voient que le pseudo). */
export function listerJoueursExternesSorealIdle(sessionToken) {
  exigerAdministrateurSorealIdle_(sessionToken);
  return { ok: true, joueurs: listerJoueursExternesIdleV1(__idleCtx.__idleSql) };
}

/*
 * ------------------------------------------------------------------
 * Accès à SOREAL IDLE (2026-09-25, Norman : « un bouton pour moi tout seul dans les paramètres : activer donne l'accès à toutes les personnes
 * avec un compte connecté sur le site ; désactiver le cache à tout le monde »)
 * ------------------------------------------------------------------
 * Activé : tout compte connecté à APP / TV qui a le trophée « Assiduité de bronze » est autorisé (sous sa propre adresse, même s'il ne travaille plus
 * ici). Désactivé : seuls les comptes de Norman. Réservé au compte administrateur ; par défaut désactivé.
 */
export function definirAccesOuvertSorealIdle(
  sessionToken,
  actif
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const emails =
    extraireEmailsUtilisateurSorealIdle_(
      acces.user
    );

  if (emails.indexOf(ADMIN_SOREAL_IDLE_EMAIL) === -1) {
    throw new Error(
      'SOREAL_IDLE_ADMIN_REQUIS'
    );
  }

  if (!__idleCtx.__idleSql) {
    throw new Error(
      'SOREAL_IDLE_BASE_INDISPONIBLE'
    );
  }

  const ouvert = actif === true || actif === 'true' || actif === 1 || actif === '1';

  __idleCtx.__idleSql.exec(
    "INSERT INTO idle_meta(meta_key,meta_value) VALUES('acces_ouvert',?) "+
    "ON CONFLICT(meta_key) DO UPDATE SET meta_value=excluded.meta_value",
    ouvert ? '1' : '0'
  );

  __idleCtx.__idleAccesOuvert = ouvert;

  return {
    ok: true,
    accesOuvert: ouvert
  };
}

/*
 * ------------------------------------------------------------------
 * Ordre des boutons du menu (« Rangement des boutons », 2026-09-25)
 * ------------------------------------------------------------------
 */
export function definirOrdreMenusSorealIdle(
  sessionToken,
  ordre
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(1800)) {
    return {
      ok: false,
      message:
        'Le jeu est occupé.'
    };
  }

  try {
    const feuille =
      obtenirFeuilleJoueursSorealIdle_();

    const ligne =
      trouverLigneJoueurSorealIdle_(
        feuille,
        acces
      );

    assurerDonneesJeuSorealIdle_(
      feuille,
      ligne
    );

    const c =
      CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

    const cellule =
      feuille.getRange(
        ligne,
        c.STATS_JSON
      );

    const stats =
      statsJoueurSorealIdle_(
        cellule.getValue()
      );

    stats.menuOrdre =
      statsJoueurSorealIdle_(
        JSON.stringify({menuOrdre:Array.isArray(ordre) ? ordre : [], menuOrdreVersion: 3})
      ).menuOrdre;

    cellule.setValue(
      JSON.stringify(
        stats
      )
    );

    SpreadsheetApp.flush();

    return {
      ok: true,
      menuOrdre: stats.menuOrdre
    };
  } finally {
    lock.releaseLock();
  }
}

/*
 * ------------------------------------------------------------------
 * Classement des joueurs (2026-09-25)
 * ------------------------------------------------------------------
 * Norman : « tous les comptes IDLE doivent y apparaître ; quelqu'un qui reset sa partie reste présent, en bas du classement, avec les
 * statistiques à 0 ; les autres ne disparaissent jamais tant que leurs parties sont actives ; classement par statistique ET classement
 * global à points, dans des onglets du même menu ; le numéro du boss le plus élevé peut y figurer ».
 * Registre (feuille CLASSEMENT : e-mail, nom, dernière vue) : un joueur dont la ligne a été effacée par un reset reste listé, à 0.
 */
const CLASSEMENT_STATS_SOREAL_IDLE_V1 = Object.freeze([
  'boss',
  'rebirths',
  'number',
  'exp',
  'playSeconds',
  'achievements'
]);

/*
 * Norman (2026-09-27) : catégorie « Clics/Tap », comptée à part -- un compteur brut, jamais anti-triche, ne doit
 * pas fausser le classement Global (qui reflète la vraie progression). Son propre rang est bien calculé (onglet
 * dédié côté client), mais exclu de la somme de points qui fait le classement Global ci-dessous.
 */
const CLASSEMENT_STATS_HORS_GLOBAL_SOREAL_IDLE_V1 = Object.freeze(['clics', 'combatLong']);

const CLASSEMENT_STATS_TOUTES_SOREAL_IDLE_V1 = Object.freeze(
  CLASSEMENT_STATS_SOREAL_IDLE_V1.concat(CLASSEMENT_STATS_HORS_GLOBAL_SOREAL_IDLE_V1)
);

/* Classement public pour tous les joueurs ayant accès à SOREAL IDLE. */
export function classementDebloqueSorealIdle_() {
  return true;
}

export function estAdministrateurSorealIdle_(emailPrincipal, emailConnexion) {
  const emails = [emailPrincipal, emailConnexion]
    .map(function(e) { return String(e || '').trim().toLowerCase(); });
  return emails.indexOf(ADMIN_SOREAL_IDLE_EMAIL) !== -1;
}

/* Fin d'un combat de boss mené à son terme (victoire ou défaite) : sa durée entre au record du joueur, puis le compteur repart de zéro. */
/*
 * Règle de Norman (2026-10-11) : le record « combat le plus long » est un combat de boss lancé par UN SEUL « Fight » sur un boss à PV pleins et mené jusqu'au bout (aucune fuite, aucune reprise d'un boss déjà entamé,
 * aucun arrêt technique), et il garde son issue : gagné (le boss est mort) ou perdu.
 */
export function cloreCombatBossClassementV1_(stats, gagne) {
  const duree = Math.max(0, nombreSorealIdle_(stats.combatBossDureeSec, 0));
  if (stats.combatBossDepartFrais === true && duree > nombreSorealIdle_(stats.combatBossPlusLongSec, 0)) {
    stats.combatBossPlusLongSec = duree;
    stats.combatBossPlusLongGagne = gagne === true;
  }
  stats.combatBossDureeSec = 0;
  stats.combatBossDepartFrais = false;
}

function valeursClassementJoueurSorealIdle_(stats) {
  const meta =
    stats && stats.metaNgu && typeof stats.metaNgu === 'object'
      ? stats.metaNgu
      : {};
  const records =
    meta.records && typeof meta.records === 'object'
      ? meta.records
      : {};
  const succes =
    meta.systems &&
    meta.systems.achievements &&
    meta.systems.achievements.data &&
    meta.systems.achievements.data.unlocked &&
    typeof meta.systems.achievements.data.unlocked === 'object'
      ? Object.keys(meta.systems.achievements.data.unlocked).length
      : 0;
  const positif = function(v) {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  return {
    boss: Math.floor(positif(records.highestBoss)),
    rebirths: Math.floor(positif(records.totalRebirths)),
    number: positif(records.bestNumber),
    exp: positif(records.totalExpEarned),
    /* Temps de jeu ACTIF (battementSorealIdle), plus le temps écoulé du moteur : voir statsJoueurSorealIdle_.tempsActifSec. */
    playSeconds: Math.floor(positif(stats && stats.tempsActifSec)),
    achievements: succes,
    clics: Math.floor(positif(stats && stats.clicsTotal)),
    /* Combat de boss le plus long, en dixièmes de seconde (secondes avec une décimale). */
    combatLong: Math.round(positif(stats && stats.combatBossPlusLongSec) * 10) / 10,
    /* issue du combat le plus long : true = gagné, false = perdu, null = pas de record */
    combatLongGagne: stats && stats.combatBossPlusLongSec > 0 && typeof stats.combatBossPlusLongGagne === 'boolean' ? stats.combatBossPlusLongGagne : null
  };
}

/*
 * Ne comptent au classement que les joueurs connectés à leur compte (Norman, 2026-09-25) : ni la « partie B » de développement
 * (ancienne « partie B », retirée : sa ligne éventuelle, adresse alias « nom+partieb@… », n'apparaît jamais), ni une entrée sans vrai nom (« Joueur »).
 */
function joueurExclusClassementSorealIdle_(cle, nom) {
  const email = String(cle || '').trim().toLowerCase();
  const libelle = String(nom || '').trim().toLowerCase();
  return (
    !email ||
    idleDevEstEmailPartieTestV1(email) ||
    !libelle ||
    libelle === 'joueur'
  );
}

export function obtenirClassementSorealIdle(
  sessionToken,
  options
) {
  /* sansEcriture : calcul des rangs SEUL (aucune écriture : ni passage noté, ni registre) -- sert à obtenirMesRangsSorealIdle, appelé régulièrement en arrière-plan. */
  const sansEcriture = Boolean(options && options.sansEcriture);
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const c =
    CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

  const feuille =
    obtenirFeuilleJoueursSorealIdle_();

  const moi =
    String(acces.emailAutorise || '').trim().toLowerCase();

  /* Le prénom de l'ouvrier qui ouvre le classement est mémorisé tout de suite (son nom peut ainsi s'afficher « Pseudo (Prénom) » dès cette page). */
  if (!sansEcriture) noterPassageIdleV1_(acces);

  const registre =
    obtenirFeuilleClassementSorealIdle_();

  /* Pseudos (2026-09-26) : un externe n'est vu que par son pseudo (sans pseudo : le prénom de son compte Google) ; un ouvrier apparaît « Pseudo (Prénom) », prénom obligatoire. */
  const profils = __idleCtx.__idleSql ? profilsParEmailIdleV1(__idleCtx.__idleSql) : new Map();
  const nomAffiche = function(cle, nomLigne) {
    return libelleJoueurIdleV1(profils.get(String(cle || '').trim().toLowerCase()), nomLigne);
  };

  const parCle = new Map();

  for (let r = 2; r <= registre.getLastRow(); r += 1) {
    const cle =
      String(registre.getCell(r, 1) || '').trim().toLowerCase();
    if (!cle) continue;
    if (joueurExclusClassementSorealIdle_(cle, nomAffiche(cle, registre.getCell(r, 2)))) {
      /* Entrée enregistrée avant ces règles (partie B, « Joueur ») : retirée du registre. */
      if (!sansEcriture) registre.getRange(r, 1, 1, 3).setValues([['', '', '']]);
      continue;
    }
    parCle.set(cle, {
      cle: cle,
      ligneRegistre: r,
      nom: nomAffiche(cle, String(registre.getCell(r, 2) || '').trim()),
      nomBrut: String(registre.getCell(r, 2) || '').trim(),
      present: false,
      visible: true,
      valeurs: valeursClassementJoueurSorealIdle_(null)
    });
  }

  const derniere = feuille.getLastRow();

  for (let ligne = 2; ligne <= derniere; ligne += 1) {
    const valeursLigne =
      feuille.getRange(ligne, 1, 1, c.STATS_JSON).getValues()[0];

    if (!valeursLigne.some(function(v) { return v !== '' && v != null; })) continue;

    const emailPrincipal =
      String(valeursLigne[c.EMAIL_PRINCIPAL - 1] || '').trim().toLowerCase();
    const emailConnexion =
      String(valeursLigne[c.EMAIL_CONNEXION - 1] || '').trim().toLowerCase();
    const cle = emailPrincipal || emailConnexion;
    if (!cle) continue;

    const nomBrut =
      String(valeursLigne[c.NOM - 1] || '').trim();
    const nom = nomAffiche(cle, nomBrut);

    if (joueurExclusClassementSorealIdle_(cle, nom)) continue;

    const stats =
      statsJoueurSorealIdle_(
        valeursLigne[c.STATS_JSON - 1]
      );

    const entree =
      parCle.get(cle) ||
      { cle: cle, ligneRegistre: 0, nom: nom, nomBrut: nomBrut, present: false, visible: true, valeurs: null };

    entree.nom = nom;
    entree.nomBrut = nomBrut;
    entree.present = true;
    entree.valeurs = valeursClassementJoueurSorealIdle_(stats);
    /*
     * Norman (2026-09-27) : « Je ne veux pas apparaitre dans le classement pour les autres. » Le joueur qui se
     * cache reste dans le registre (son historique n'est jamais perdu) mais n'est jamais renvoyé à un AUTRE
     * spectateur (filtré plus bas, sur entree.visible, sauf pour lui-même).
     */
    entree.visible = stats.classementVisible !== false;
    entree.alias = emailConnexion;
    parCle.set(cle, entree);
  }

  /* Registre : chaque joueur vu y est inscrit (ou son nom mis à jour) et n'en sort plus. */
  let prochaineLigne = Math.max(2, registre.getLastRow() + 1);
  parCle.forEach(function(entree) {
    if (!entree.present || sansEcriture) return;
    /*
     * Audit du 2026-10-10 (IDLE-AUDIT-PERF-004) : le registre était réécrit en entier à chaque ouverture du classement (une écriture par joueur, « Dernière vue » = maintenant, donc toujours « modifiée »). On n'écrit
     * plus qu'un joueur nouveau ou dont le nom a changé ; la colonne « Dernière vue » n'est lue nulle part.
     */
    if (entree.ligneRegistre
      && String(registre.getCell(entree.ligneRegistre, 1) || '').trim().toLowerCase() === entree.cle
      && String(registre.getCell(entree.ligneRegistre, 2) || '').trim() === entree.nomBrut) return;
    const ligneRegistre = entree.ligneRegistre || prochaineLigne++;
    registre.getRange(ligneRegistre, 1, 1, 3).setValues([[entree.cle, entree.nomBrut, Date.now()]]);
    entree.ligneRegistre = ligneRegistre;
  });
  if (!sansEcriture && (registre.getLastRow() === 0 || String(registre.getCell(1, 1) || '') === '')) {
    registre.getRange(1, 1, 1, 3).setValues([['Email', 'Nom', 'Derniere vue']]);
  }

  const entrees = Array.from(parCle.values())
    .filter(function(entree) {
      const cestMoi = entree.cle === moi || entree.alias === moi;
      /* Caché par son propre choix (Paramètres) : invisible pour tout le monde sauf lui-même. */
      return entree.visible !== false || cestMoi;
    })
    .map(function(entree) {
      return {
        cle: entree.cle,
        nom: entree.nom || 'Joueur',
        moi: entree.cle === moi || entree.alias === moi,
        valeurs: entree.valeurs || valeursClassementJoueurSorealIdle_(null)
      };
    });

  const n = entrees.length;

  /* Rang de chaque statistique (égalités : même rang, le suivant saute) ; points = n - rang + 1 ; global = somme des points. */
  CLASSEMENT_STATS_TOUTES_SOREAL_IDLE_V1.forEach(function(nomStat) {
    const tries = entrees.slice().sort(function(a, b) {
      return (b.valeurs[nomStat] - a.valeurs[nomStat]) ||
        String(a.nom).localeCompare(String(b.nom), 'fr');
    });
    tries.forEach(function(entree, i) {
      entree.rangs = entree.rangs || {};
      const precedent = i > 0 ? tries[i - 1] : null;
      entree.rangs[nomStat] =
        precedent && precedent.valeurs[nomStat] === entree.valeurs[nomStat]
          ? precedent.rangs[nomStat]
          : i + 1;
    });
  });

  entrees.forEach(function(entree) {
    entree.points = CLASSEMENT_STATS_SOREAL_IDLE_V1.reduce(function(total, nomStat) {
      return total + (n - entree.rangs[nomStat] + 1);
    }, 0);
  });

  const global = entrees.slice().sort(function(a, b) {
    return (b.points - a.points) ||
      (b.valeurs.boss - a.valeurs.boss) ||
      String(a.nom).localeCompare(String(b.nom), 'fr');
  });
  global.forEach(function(entree, i) {
    const precedent = i > 0 ? global[i - 1] : null;
    entree.rang =
      precedent && precedent.points === entree.points
        ? precedent.rang
        : i + 1;
  });

  return {
    ok: true,
    joueurs: n,
    stats: CLASSEMENT_STATS_TOUTES_SOREAL_IDLE_V1.slice(),
    entrees: entrees.map(function(entree) {
      return {
        nom: entree.nom,
        moi: entree.moi,
        rang: entree.rang,
        points: entree.points,
        rangs: entree.rangs,
        valeurs: entree.valeurs
      };
    })
  };
}

/*
 * Mes rangs (Norman, 2026-10-17 : « quand on bat un record personnel ou qu'on monte de place au classement, un popup avec un petit son »). Le client appelle cette opération de temps en temps : mon rang global et mon rang
 * par statistique, plus mes valeurs (combat le plus long, meilleur Nombre…), pour détecter un record ou une montée. Même calcul que le classement, mais SANS aucune écriture.
 */
export function obtenirMesRangsSorealIdle(sessionToken) {
  const r = obtenirClassementSorealIdle(sessionToken, { sansEcriture: true });
  if (!r || !r.ok) return { ok: false };
  const moi = (r.entrees || []).find(function(e) { return e.moi; }) || null;
  return {
    ok: true,
    joueurs: r.joueurs,
    moi: moi ? { rang: moi.rang, rangs: moi.rangs, valeurs: moi.valeurs } : null
  };
}

function obtenirFeuilleClassementSorealIdle_() {
  return obtenirSpreadsheetSorealIdle_()
    .getOrCreateSheet(
      CONFIG_SOREAL_IDLE.FEUILLE_CLASSEMENT
    );
}

export function selectionnerBossSorealIdle(
  sessionToken,
  numeroBoss
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(1800)) {
    return {
      ok: false,
      message:
        'Le jeu est occupé.'
    };
  }

  try {
    const feuille =
      obtenirFeuilleJoueursSorealIdle_();

    const ligne =
      trouverLigneJoueurSorealIdle_(
        feuille,
        acces
      );

    assurerDonneesJeuSorealIdle_(
      feuille,
      ligne
    );

    const c =
      CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

    const row =
      feuille
        .getRange(
          ligne,
          1,
          1,
          c.STATS_JSON
        )
        .getValues()[0];

    const bossVaincus =
      Math.max(
        0,
        Math.floor(
          nombreSorealIdle_(
            row[c.BOSS_VAINCUS - 1],
            0
          )
        )
      );

    const numeroDemande =
      Math.max(
        1,
        Math.floor(
          nombreSorealIdle_(
            numeroBoss,
            bossVaincus + 1
          )
        )
      );

    const numero =
      bossVaincus + 1;

    if (numeroDemande < numero) {
      return {
        ok:false,
        code:'BOSS_DEJA_VAINCU',
        message:
          'Ce boss est mort pour ce run. Il reviendra à la Renaissance.'
      };
    }

    if (numeroDemande > numero) {
      return {
        ok:false,
        code:'BOSS_NON_ATTEINT',
        message:
          'Bats d’abord le boss actuel.'
      };
    }

    const index =
      numero - 1;

    const niveau =
      Math.max(
        1,
        Math.floor(
          nombreSorealIdle_(
            row[c.NIVEAU - 1],
            1
          )
        )
      );

    const niveauRequis =
      niveauRequisBossSorealIdle_(
        index
      );

    if (niveau < niveauRequis) {
      return {
        ok:false,
        code:'BOSS_NIVEAU_INSUFFISANT',
        niveauRequis:niveauRequis,
        message:
          'Ce boss est encore inconnu.'
      };
    }

    const stats =
      statsJoueurSorealIdle_(
        row[c.STATS_JSON - 1]
      );

    stats.bossSelection =
      numero;

    stats.bossRespawnJusqua = 0;

    stats.buffBouclierJusqua = 0;
    stats.buffBouclierPct = 0;
    stats.immuniteParalysieJusqua = 0;
    stats.bossStunJusqua = 0;
    stats.bossVulnerableJusqua = 0;
    stats.bossVulnerablePct = 0;
    stats.sceauBriseBossNumero = 0;
    stats.bossStunJusqua = 0;
    stats.bossVulnerableJusqua = 0;
    stats.bossVulnerablePct = 0;
    stats.sceauBriseBossNumero = 0;

    const boss =
      definitionBossSorealIdle_(
        index
      );

    feuille
      .getRange(
        ligne,
        c.STATS_JSON
      )
      .setValue(
        JSON.stringify(
          stats
        )
      );

    feuille
      .getRange(
        ligne,
        c.BOSS_ACTUEL
      )
      .setValue(
        boss.nom
      );

    feuille
      .getRange(
        ligne,
        c.BOSS_PV_MAX
      )
      .setValue(
        boss.pv
      );

    feuille
      .getRange(
        ligne,
        c.BOSS_PV
      )
      .setValue(
        boss.pv
      );

    feuille
      .getRange(
        ligne,
        c.PV_JOUEUR
      )
      .setValue(
        row[c.PV_JOUEUR_MAX - 1]
      );

    feuille
      .getRange(
        ligne,
        c.KO_JUSQUA
      )
      .clearContent();

    SpreadsheetApp.flush();

    return {
      ok: true,
      numero:
        numero,
      nom:
        boss.nom,
      pv:
        boss.pv,
      attaque:
        boss.attaque,
      niveauRequis:
        niveauRequis
    };
  } finally {
    lock.releaseLock();
  }
}

/*
 * Norman (2026-09-14) : "j'ai toujours des items à 4/1. Sûrement dû à
 * mon ancienne partie. Je veux que tu forces un reset total du jeu
 * pour tout le monde." Confirmé explicitement (reset GLOBAL, pas
 * seulement son propre compte) avant exécution — action irréversible
 * qui efface la progression de tous les joueurs SOREAL IDLE.
 *
 * Même principe que reinitialiserCompteCompletSorealIdle (efface
 * réellement la ligne A:AL, jamais juste des compteurs remis à 0 —
 * au prochain chargement, creerJoueurSorealIdle_() recrée chaque
 * joueur comme une toute première connexion), appliqué à CHAQUE ligne
 * de la feuille JOUEURS plutôt qu'à la seule ligne de l'appelant.
 * Réservé à un déclenchement manuel ponctuel (jamais exposé à un
 * bouton joueur) : exigerAccesSorealIdle_ suffit ici, l'appelant est
 * l'unique Responsable qui a demandé et confirmé cette action.
 *
 * Correctif 2026-09-18 (Norman, en direct : "ajoute à moi seul, dans le
 * menu paramètres, un bouton qui reset l'entièreté des joueurs actuels")
 * — désormais exposée à un vrai bouton (SOREAL-APP, pageParametresIdleV28_),
 * donc le commentaire ci-dessus ("jamais un bouton joueur", "l'appelant
 * est l'unique Responsable") n'est plus garanti par le simple fait que
 * personne d'autre ne connaît cette fonction : exigerAccesSorealIdle_
 * seul autorise tout compte de la liste EMAILS_DEVELOPPEMENT (Norman,
 * Sébastien...), pas seulement Norman. ADMIN_SOREAL_IDLE_EMAIL restreint
 * cette action précise (et elle seule) au seul Responsable — la liste de
 * développement reste inchangée pour l'accès normal au jeu.
 */
export const ADMIN_SOREAL_IDLE_EMAIL = 'technicien.soreal@gmail.com';

/*
 * Correctif 2026-09-18 (Norman, en direct, bug confirmé en repro live
 * malgré un premier correctif client le même jour) : le bouton admin
 * restait invisible car il dépendait entièrement de SOREAL_USER, peuplé
 * côté client par le handshake TV-embed (postMessage, tv-staging-session-
 * bridge-v1.html / authReturnInline de build-static.mjs) -- un mécanisme
 * asynchrone dont le timing n'est jamais garanti par rapport au premier
 * rendu de la page Settings. Ce point d'entrée dédié, minimal (aucune
 * lecture de feuille), donne au client une réponse SERVEUR autoritaire
 * et indépendante de ce handshake -- la même comparaison que
 * les autres opérations réservées à l'administrateur, jamais un second
 * critère dupliqué.
 */
export function estAdminSorealIdle(
  sessionToken
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  return {
    ok: true,
    isAdmin:
      String(acces.emailAutorise || '').toLowerCase() ===
      ADMIN_SOREAL_IDLE_EMAIL
  };
}

/*
 * Sélecteur de parties A, B et C (2026-09-27 pour la B de Norman ; ouvert à TOUS les joueurs le 2026-10-26 -- voir idle-dev-save-slots-v1.js). La partie effectivement jouée est mémorisée sur la session (idle_sessions.user_json.slot),
 * jamais sur le compte lui-même : changer d'appareil ou se reconnecter revient toujours sur la partie A.
 */
export function obtenirPartieDevSorealIdle(sessionToken) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  return {
    ok: true,
    actif: idleDevEstAdminV1(acces.user),
    parties: idleDevSlotsAvailableV1(acces.user),
    partie: idleDevSlotForUserV1(acces.user)
  };
}

export function definirPartieDevSorealIdle(sessionToken, partie) {
  const acces = exigerAccesSorealIdle_(sessionToken);
  if (!idleDevSlotsAvailableV1(acces.user)) throw new Error('PARTIES_DEV_INDISPONIBLES');
  if (!__idleCtx.__idleSql) throw new Error('SOREAL_IDLE_BASE_INDISPONIBLE');

  const token = String(sessionToken || '').trim();
  const cible = idleDevNormalizeSlotV1(partie);
  const ligne = sqlRows(
    __idleCtx.__idleSql.exec('SELECT user_json FROM idle_sessions WHERE session_token=?', token)
  )[0];
  if (!ligne) return { ok: false, error: 'IDLE_SESSION_INVALID' };

  let user = {};
  try { user = JSON.parse(String(ligne.user_json || '{}')); } catch (_e) {}
  user.slot = cible;
  __idleCtx.__idleSql.exec(
    'UPDATE idle_sessions SET user_json=? WHERE session_token=?',
    JSON.stringify(user),
    token
  );

  return { ok: true, actif: true, partie: cible };
}

export function reinitialiserCompteCompletSorealIdle(
  sessionToken
) {
  const acces =
    exigerAccesSorealIdle_(
      sessionToken
    );

  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(10000)) {
    return {
      ok: false,
      code: 'SOREAL_IDLE_OCCUPE',
      retryable: true,
      message:
        'Le moteur termine encore une action. Réessaie dans un instant.'
    };
  }

  try {
    const feuille =
      obtenirFeuilleJoueursSorealIdle_();

    const ligne =
      trouverLigneJoueurSorealIdle_(
        feuille,
        acces
      );

    const c =
      CONFIG_SOREAL_IDLE.COLONNES_JOUEURS;

    /*
     * RESET TOTAL.
     *
     * On ne remet pas simplement des compteurs à 0 :
     * on efface réellement toute la ligne A:AL du joueur.
     * Au prochain chargement d'IDLE, trouverLigneJoueurSorealIdle_()
     * ne retrouvera plus cet utilisateur et passera par
     * creerJoueurSorealIdle_(), exactement comme une première connexion.
     *
     * Le format de la feuille est conservé, seul le contenu est effacé.
     */
    feuille
      .getRange(
        ligne,
        1,
        1,
        c.STATS_JSON
      )
      .clearContent();

    SpreadsheetApp.flush();

    return {
      ok: true,
      resetComplet: true,
      message:
        'Compte SOREAL IDLE entièrement réinitialisé.'
    };
  } finally {
    lock.releaseLock();
  }
}
