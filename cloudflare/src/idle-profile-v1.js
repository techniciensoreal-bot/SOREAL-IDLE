/*
 * SOREAL IDLE — profil public d'un joueur : pseudo, joueur externe (connecté par Google), nom affiché.
 *
 * Norman (2026-09-26) : « la personne doit se connecter avec son gmail. On verra son nom de gmail. Il faut ajouter dans Paramètres la possibilité de choisir un
 * pseudo. C'est ce pseudo qui sera utilisé pour les gens qui jouent en dehors de SOREAL APP et TV. Si c'est un ouvrier, il peut afficher un pseudo (mais on verra
 * son prénom entre parenthèses). »
 *
 *  - joueur externe  = connecté par Google, sans compte SOREAL : il n'est vu des autres que par son pseudo (jamais son nom Google ni son adresse) ;
 *  - ouvrier         = arrivé par APP / TV : « Pseudo (Prénom) » ;
 *  - sans pseudo     = le nom de la ligne du joueur (« Joueur » pour un externe, ce qui le laisse hors classement tant qu'il n'a pas choisi).
 *
 * Table idle_profiles (une ligne par adresse e-mail) : pseudo affiché, clé de pseudo (unicité sans accents ni majuscules), drapeau externe, nom Google (visible
 * de l'administrateur seulement). Le pseudo survit à une réinitialisation de la partie (il n'est pas dans l'état du jeu).
 */
import { sqlRows } from "./core/sqlite-core.js";

export const IDLE_PSEUDO_MIN_V1 = 3;
export const IDLE_PSEUDO_MAX_V1 = 20;

/* Noms qui laisseraient croire à un compte officiel : refusés. */
const PSEUDOS_RESERVES_V1 = ["admin", "administrateur", "moderateur", "modo", "soreal", "support", "staff", "system", "systeme"];

function texteV1(valeur) {
  return String(valeur == null ? "" : valeur).trim();
}

function emailV1(valeur) {
  return texteV1(valeur).toLowerCase();
}

/* Clé d'unicité : sans accents ni majuscules, lettres et chiffres seulement. */
export function idlePseudoCleV1(pseudo) {
  return texteV1(pseudo)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/* Retourne { ok:true, pseudo, cle } ou { ok:false, code, message } (messages prêts à afficher). */
export function normaliserPseudoIdleV1(brut) {
  const pseudo = texteV1(brut).replace(/\s+/g, " ");
  if (!pseudo) return { ok: false, code: "PSEUDO_VIDE", message: "Choisis un pseudo." };
  const longueur = Array.from(pseudo).length;
  if (longueur < IDLE_PSEUDO_MIN_V1) return { ok: false, code: "PSEUDO_TROP_COURT", message: "Ton pseudo doit faire au moins " + IDLE_PSEUDO_MIN_V1 + " caractères." };
  if (longueur > IDLE_PSEUDO_MAX_V1) return { ok: false, code: "PSEUDO_TROP_LONG", message: "Ton pseudo doit faire au plus " + IDLE_PSEUDO_MAX_V1 + " caractères." };
  if (!/^[\p{L}\p{N}][\p{L}\p{N} _.'-]*$/u.test(pseudo) || /[ _.'-]$/.test(pseudo)) {
    return { ok: false, code: "PSEUDO_CARACTERES", message: "Lettres, chiffres, espace, _ . ' - seulement ; commence par une lettre ou un chiffre et finis de même." };
  }
  if ((pseudo.match(/\p{L}/gu) || []).length < 2) return { ok: false, code: "PSEUDO_LETTRES", message: "Ton pseudo doit contenir au moins deux lettres." };
  const cle = idlePseudoCleV1(pseudo);
  if (/https?|www|\.com|\.be|\.fr/i.test(pseudo)) return { ok: false, code: "PSEUDO_LIEN", message: "Un pseudo ne peut pas être une adresse de site." };
  if (PSEUDOS_RESERVES_V1.includes(cle)) return { ok: false, code: "PSEUDO_RESERVE", message: "Ce pseudo est réservé." };
  return { ok: true, pseudo, cle };
}

export function assurerTableProfilsIdleV1(sql) {
  sql.exec(
    "CREATE TABLE IF NOT EXISTS idle_profiles(" +
    "email TEXT PRIMARY KEY,pseudo TEXT NOT NULL DEFAULT '',pseudo_key TEXT NOT NULL DEFAULT '',externe INTEGER NOT NULL DEFAULT 0," +
    "google_name TEXT NOT NULL DEFAULT '',first_seen INTEGER NOT NULL DEFAULT 0,updated_at INTEGER NOT NULL DEFAULT 0)"
  );
  sql.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_idle_profiles_pseudo ON idle_profiles(pseudo_key) WHERE pseudo_key<>''");
}

export function lireProfilIdleV1(sql, email) {
  const cle = emailV1(email);
  if (!cle) return null;
  assurerTableProfilsIdleV1(sql);
  const ligne = sqlRows(sql.exec("SELECT email,pseudo,pseudo_key,externe,google_name,first_seen,updated_at FROM idle_profiles WHERE email=?", cle))[0];
  return ligne
    ? { email: ligne.email, pseudo: texteV1(ligne.pseudo), externe: Number(ligne.externe) === 1, googleName: texteV1(ligne.google_name), premiereVue: Number(ligne.first_seen || 0) }
    : null;
}

/*
 * Enregistre le passage d'un joueur (adresse, joueur externe ou non, nom Google). N'écrit que ce qui change. Un joueur arrivé par APP / TV n'est jamais rétrogradé
 * en « externe », et un externe qui passe ensuite par APP / TV devient ouvrier (son pseudo est conservé).
 */
export function noterPassageProfilIdleV1(sql, { email, externe, googleName }, maintenant = Date.now()) {
  const cle = emailV1(email);
  if (!cle) return null;
  assurerTableProfilsIdleV1(sql);
  const actuel = lireProfilIdleV1(sql, cle);
  const nom = texteV1(googleName).slice(0, 80);
  if (!actuel) {
    sql.exec(
      "INSERT INTO idle_profiles(email,pseudo,pseudo_key,externe,google_name,first_seen,updated_at) VALUES(?,?,?,?,?,?,?)",
      cle, "", "", externe ? 1 : 0, nom, maintenant, maintenant
    );
    return lireProfilIdleV1(sql, cle);
  }
  const nouveauExterne = externe ? actuel.externe : false;
  const nouveauNom = nom || actuel.googleName;
  if (nouveauExterne !== actuel.externe || nouveauNom !== actuel.googleName) {
    sql.exec("UPDATE idle_profiles SET externe=?,google_name=?,updated_at=? WHERE email=?", nouveauExterne ? 1 : 0, nouveauNom, maintenant, cle);
  }
  return lireProfilIdleV1(sql, cle);
}

/* Enregistre le pseudo d'un joueur. Retourne { ok:true, pseudo } ou { ok:false, code, message }. Le pseudo est unique (sans accents ni majuscules). */
export function definirPseudoProfilIdleV1(sql, email, brut, maintenant = Date.now()) {
  const cle = emailV1(email);
  if (!cle) return { ok: false, code: "PSEUDO_COMPTE", message: "Compte introuvable." };
  const verifie = normaliserPseudoIdleV1(brut);
  if (!verifie.ok) return verifie;
  assurerTableProfilsIdleV1(sql);
  const pris = sqlRows(sql.exec("SELECT email FROM idle_profiles WHERE pseudo_key=? AND email<>?", verifie.cle, cle))[0];
  if (pris) return { ok: false, code: "PSEUDO_PRIS", message: "Ce pseudo est déjà pris." };
  if (!lireProfilIdleV1(sql, cle)) {
    sql.exec("INSERT INTO idle_profiles(email,pseudo,pseudo_key,externe,google_name,first_seen,updated_at) VALUES(?,?,?,0,'',?,?)", cle, verifie.pseudo, verifie.cle, maintenant, maintenant);
  } else {
    sql.exec("UPDATE idle_profiles SET pseudo=?,pseudo_key=?,updated_at=? WHERE email=?", verifie.pseudo, verifie.cle, maintenant, cle);
  }
  return { ok: true, pseudo: verifie.pseudo };
}

/* Nom montré aux autres joueurs (classement, listes) : voir l'en-tête. nomLigne = prénom (ouvrier) ou « Joueur » (externe). */
export function libelleJoueurIdleV1(profil, nomLigne) {
  const ligne = texteV1(nomLigne);
  const pseudo = texteV1(profil && profil.pseudo);
  if (!pseudo) return ligne;
  if (profil && profil.externe) return pseudo;
  if (!ligne || ligne.toLowerCase() === pseudo.toLowerCase()) return pseudo;
  return pseudo + " (" + ligne + ")";
}

/* Tous les profils, indexés par adresse (classement). */
export function profilsParEmailIdleV1(sql) {
  assurerTableProfilsIdleV1(sql);
  const carte = new Map();
  for (const ligne of sqlRows(sql.exec("SELECT email,pseudo,externe,google_name FROM idle_profiles"))) {
    carte.set(emailV1(ligne.email), { email: emailV1(ligne.email), pseudo: texteV1(ligne.pseudo), externe: Number(ligne.externe) === 1, googleName: texteV1(ligne.google_name) });
  }
  return carte;
}

/* Liste des joueurs externes (administrateur) : adresse Google, nom Google, pseudo. */
export function listerJoueursExternesIdleV1(sql) {
  assurerTableProfilsIdleV1(sql);
  return sqlRows(sql.exec("SELECT email,pseudo,google_name,first_seen,updated_at FROM idle_profiles WHERE externe=1 ORDER BY first_seen DESC,email"))
    .map((l) => ({ email: emailV1(l.email), pseudo: texteV1(l.pseudo), nomGoogle: texteV1(l.google_name), premiereVue: Number(l.first_seen || 0), derniereVue: Number(l.updated_at || 0) }));
}
