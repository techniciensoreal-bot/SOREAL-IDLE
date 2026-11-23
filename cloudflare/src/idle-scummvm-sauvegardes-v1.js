/*
 * SOREAL IDLE — synchronisation des SAUVEGARDES du jeu ScummVM (menu « Énigmes ») entre les appareils d'un même compte
 * (Norman, 2026-11-22 : « je vais jouer sur mon téléphone et avancer ; je dois pouvoir reprendre au même endroit sur le PC plus tard ou au boulot »).
 *
 * DONNÉE PARTAGÉE entre appareils, donc côté serveur et hors de l'état du jeu (règle n°7 : le jeu local ne la voit pas ; aucune opération de jeu n'est ajoutée,
 * le contrat du protocole ne change pas), comme le profil de badavatar (idle-profil-badavatar-v1.js). Route : POST /api/v1/scummvm-sauvegardes (idle-worker-entry-v1.js),
 * traitée dans le coordinateur (index-idle-coordinator-v1.js) qui a la table SQLite : session -> compte, droit de jouer, droit « Énigmes », puis idleScummvmSauvegardesTraiterV1.
 *
 * Table idle_scummvm_sauvegardes(compte, jeu, nom, donnees, maj, taille) : un fichier de sauvegarde par ligne, contenu en base 64 (jamais lu ni journalisé ici).
 * Actions : { action:'lire', jeu } -> { ok, fichiers:[{nom,maj,donnees}] } ; { action:'ecrire', jeu, force?, fichiers:[{nom,maj,donnees,base?}] } -> { ok, fichiers:[{nom,maj}], conflits:[nom] }.
 * `maj` = millisecondes à l'HEURE DU SERVEUR (le client corrige l'horloge de l'appareil par l'écart mesuré) ; un `maj` au-delà de maintenant + 5 min est refusé.
 * Fusion PAR FICHIER : le serveur garde la version dont `maj` est la plus récente (égalité : le serveur). `base` (facultatif) = le `maj` du serveur que l'appareil a vu pour ce fichier ;
 * s'il a changé depuis (un autre appareil a joué), le fichier n'est PAS écrasé : il revient dans `conflits` (jamais d'écrasement silencieux). `force:true` (« Reprendre ici ») remplace sans comparer.
 * Action { action:'effacer', jeu } (« Recommencer la partie », Norman, 2026-11-23) -> { ok, effaces:n } : supprime TOUTES les lignes (compte, jeu), jamais d'autres comptes ni d'autres jeux, et garde la date
 * `effacee_ms` (heure du serveur) dans idle_scummvm_effacements : un envoi dont le `maj` est antérieur à cet effacement (un autre appareil encore ouvert avec l'ancienne partie) revient en conflit, même avec `force`.
 * Le compte n'est que celui du jeton de session : le client n'envoie jamais d'identité.
 */
import { sqlRows } from "./core/sqlite-core.js";

export const IDLE_SCUMMVM_SAUV_JEU_V1 = /^[a-z0-9-]{1,40}$/;
/* Liste blanche : <cible>.s00 à <cible>.s99 (créneaux de ScummVM) et « timestamps » (index des dates de ScummVM). */
export const IDLE_SCUMMVM_SAUV_NOM_V1 = /^(?:[A-Za-z0-9_-]{1,40}\.s[0-9]{2}|timestamps)$/;
export const IDLE_SCUMMVM_SAUV_MAX_FICHIERS_V1 = 12;
export const IDLE_SCUMMVM_SAUV_MAX_FICHIER_V1 = 300000;
export const IDLE_SCUMMVM_SAUV_MAX_COMPTE_V1 = 1500000;
export const IDLE_SCUMMVM_SAUV_AVANCE_MAJ_MS_V1 = 5 * 60 * 1000;
const BASE64_V1 = /^[A-Za-z0-9+/]+={0,2}$/;

const TABLES_PRETES_V1 = new WeakSet();
export function idleScummvmSauvegardesAssurerTableV1(sql) {
  if (sql && typeof sql === "object" && TABLES_PRETES_V1.has(sql)) return;
  sql.exec("CREATE TABLE IF NOT EXISTS idle_scummvm_sauvegardes(compte TEXT NOT NULL, jeu TEXT NOT NULL, nom TEXT NOT NULL, donnees TEXT NOT NULL, maj INTEGER NOT NULL, taille INTEGER NOT NULL, PRIMARY KEY(compte, jeu, nom))");
  sql.exec("CREATE TABLE IF NOT EXISTS idle_scummvm_effacements(compte TEXT NOT NULL, jeu TEXT NOT NULL, effacee_ms INTEGER NOT NULL, PRIMARY KEY(compte, jeu))");
  if (sql && typeof sql === "object") TABLES_PRETES_V1.add(sql);
}

function fichierValide(f, maintenant) {
  if (!f || typeof f !== "object" || Array.isArray(f)) return "SCUMMVM_SAUV_FICHIER";
  if (typeof f.nom !== "string" || !IDLE_SCUMMVM_SAUV_NOM_V1.test(f.nom)) return "SCUMMVM_SAUV_NOM";
  if (typeof f.donnees !== "string" || !f.donnees.length || f.donnees.length > IDLE_SCUMMVM_SAUV_MAX_FICHIER_V1) return "SCUMMVM_SAUV_TAILLE";
  if (f.donnees.length % 4 !== 0 || !BASE64_V1.test(f.donnees)) return "SCUMMVM_SAUV_DONNEES";
  if (!Number.isInteger(f.maj) || f.maj <= 0) return "SCUMMVM_SAUV_MAJ";
  if (f.maj > maintenant + IDLE_SCUMMVM_SAUV_AVANCE_MAJ_MS_V1) return "SCUMMVM_SAUV_MAJ_FUTUR";
  if (f.base !== undefined && (!Number.isInteger(f.base) || f.base < 0)) return "SCUMMVM_SAUV_BASE";
  return "";
}

/*
 * ctx = { autorise: async () => boolean (droit « Énigmes » du compte : idleScummvmCompteAutoriseV1), maintenant? }.
 * Sans `autorise` : refus (jamais d'accès ouvert par défaut).
 */
export async function idleScummvmSauvegardesTraiterV1(sql, compte, corps, ctx = {}) {
  const email = String(compte == null ? "" : compte).trim().toLowerCase();
  if (!email) return { ok: false, code: "SCUMMVM_SAUV_COMPTE" };
  if (typeof ctx.autorise !== "function" || !(await ctx.autorise())) return { ok: false, error: "SOREAL_IDLE_ACCES_REFUSE", code: "SCUMMVM_SAUV_ACCES" };
  const c = corps && typeof corps === "object" && !Array.isArray(corps) ? corps : {};
  const jeu = c.jeu;
  if (typeof jeu !== "string" || !IDLE_SCUMMVM_SAUV_JEU_V1.test(jeu)) return { ok: false, code: "SCUMMVM_SAUV_JEU" };
  idleScummvmSauvegardesAssurerTableV1(sql);
  if (c.action === "lire") {
    const lignes = sqlRows(sql.exec("SELECT nom,donnees,maj FROM idle_scummvm_sauvegardes WHERE compte=? AND jeu=? ORDER BY nom", email, jeu));
    return { ok: true, fichiers: lignes.map((l) => ({ nom: String(l.nom), maj: Number(l.maj), donnees: String(l.donnees) })) };
  }
  if (c.action === "effacer") {
    const n = Number(sqlRows(sql.exec("SELECT COUNT(*) AS n FROM idle_scummvm_sauvegardes WHERE compte=? AND jeu=?", email, jeu))[0]?.n) || 0;
    sql.exec("DELETE FROM idle_scummvm_sauvegardes WHERE compte=? AND jeu=?", email, jeu);
    const quand = ctx.maintenant === undefined ? Date.now() : ctx.maintenant;
    sql.exec("INSERT INTO idle_scummvm_effacements(compte,jeu,effacee_ms) VALUES(?,?,?) ON CONFLICT(compte,jeu) DO UPDATE SET effacee_ms=excluded.effacee_ms", email, jeu, quand);
    return { ok: true, effaces: n };
  }
  if (c.action !== "ecrire") return { ok: false, code: "SCUMMVM_SAUV_ACTION" };
  const maintenant = ctx.maintenant === undefined ? Date.now() : ctx.maintenant;
  const entrants = c.fichiers;
  if (!Array.isArray(entrants) || !entrants.length || entrants.length > IDLE_SCUMMVM_SAUV_MAX_FICHIERS_V1) return { ok: false, code: "SCUMMVM_SAUV_LISTE" };
  const noms = new Set();
  for (const f of entrants) {
    const err = fichierValide(f, maintenant);
    if (err) return { ok: false, code: err };
    if (noms.has(f.nom)) return { ok: false, code: "SCUMMVM_SAUV_DOUBLON" };
    noms.add(f.nom);
  }
  const force = c.force === true;
  const existants = new Map();
  for (const l of sqlRows(sql.exec("SELECT nom,maj,taille FROM idle_scummvm_sauvegardes WHERE compte=? AND jeu=?", email, jeu))) existants.set(String(l.nom), { maj: Number(l.maj), taille: Number(l.taille) });
  /* décision par fichier, sans rien écrire encore */
  const aEcrire = [];
  const conflits = [];
  const eff = sqlRows(sql.exec("SELECT effacee_ms FROM idle_scummvm_effacements WHERE compte=? AND jeu=?", email, jeu))[0];
  const effaceeMs = eff ? Number(eff.effacee_ms) : 0;
  for (const f of entrants) {
    if (f.maj < effaceeMs) { conflits.push(f.nom); continue; }   /* partie antérieure à « Recommencer » : jamais ressuscitée */
    const ex = existants.get(f.nom);
    if (!ex) { aEcrire.push(f); continue; }
    if (force) { aEcrire.push(f); continue; }
    if (f.base !== undefined && f.base !== ex.maj) { conflits.push(f.nom); continue; }
    if (f.maj > ex.maj) aEcrire.push(f);
  }
  /* bornes : fichiers par jeu et caractères au total pour le compte (vérifiées AVANT toute écriture : tout ou rien) */
  const apres = new Map(existants);
  for (const f of aEcrire) apres.set(f.nom, { maj: f.maj, taille: f.donnees.length });
  if (apres.size > IDLE_SCUMMVM_SAUV_MAX_FICHIERS_V1) return { ok: false, code: "SCUMMVM_SAUV_TROP_DE_FICHIERS" };
  const autres = sqlRows(sql.exec("SELECT COALESCE(SUM(taille),0) AS n FROM idle_scummvm_sauvegardes WHERE compte=? AND jeu<>?", email, jeu))[0];
  let total = Number(autres && autres.n) || 0;
  for (const v of apres.values()) total += v.taille;
  if (total > IDLE_SCUMMVM_SAUV_MAX_COMPTE_V1) return { ok: false, code: "SCUMMVM_SAUV_QUOTA" };
  for (const f of aEcrire) {
    sql.exec("INSERT INTO idle_scummvm_sauvegardes(compte,jeu,nom,donnees,maj,taille) VALUES(?,?,?,?,?,?) ON CONFLICT(compte,jeu,nom) DO UPDATE SET donnees=excluded.donnees,maj=excluded.maj,taille=excluded.taille", email, jeu, f.nom, f.donnees, f.maj, f.donnees.length);
  }
  const etat = [...apres.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([nom, v]) => ({ nom, maj: v.maj }));
  return { ok: true, fichiers: etat, conflits };
}
