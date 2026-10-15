/*
 * Journal des variations d'EXP (Norman, 2026-10-08 : « il faudrait un historique de ce qu'ils ont reçu pour contrer ça, si ça arrive encore », après le set de la Grotte dont les 300 EXP n'avaient pas été versés).
 *
 * Le moteur ne gardait que le solde. Ici, chaque fois qu'une opération change l'EXP d'un joueur (colonne XP de sa ligne, miroir de metaNgu.currencies.experience), une ligne est ajoutée :
 * quand, quelle opération du jeu, solde avant / après. Écrit par __idleCommit (idle-sqlite-runtime.js), donc quelle que soit l'opération ; jamais dans l'état du moteur (pas d'horodatage dans l'état).
 * Borné : les 1 000 dernières lignes par joueur, 60 jours. Les variations de moins de 1 EXP ne sont pas journalisées.
 *
 * Production courante regroupée (Norman, 2026-10-15 : « dans le journal, je n'ai pas l'historique d'hier ») : l'EXP de fond tombe à chaque synchro et à chaque battement (~toutes les 20 s) ; avec 300 lignes, le journal ne couvrait
 * qu'environ une heure et demie de jeu et l'historique de la veille était perdu. Une hausse ORDINAIRE (synchro ou présence, continue avec la ligne précédente, pas plus de 3 fois la hausse moyenne déjà regroupée) est ajoutée à la ligne
 * précédente (« Synchronisation ×12 ») au lieu d'en créer une, 30 regroupements au plus par ligne. Une hausse inhabituelle (récompense de set, de boss, crédit), une baisse, ou toute autre opération gardent leur propre ligne.
 */
import { sqlRows } from "./core/sqlite-core.js";

export const IDLE_GAINS_MAX_PAR_JOUEUR_V1 = 1000;
export const IDLE_GAINS_DUREE_MAX_MS_V1 = 60 * 24 * 3600 * 1000;
export const IDLE_GAINS_SEUIL_V1 = 1;
export const IDLE_GAINS_OPERATIONS_COURANTES_V1 = new Set(["obtenirEtatSorealIdle", "battementSorealIdle"]);
export const IDLE_GAINS_REGROUPEMENT_MAX_V1 = 30;

/* audit 2026-10-13 : le schéma n'est créé qu'une fois par connexion SQL (avant : des instructions DDL à chaque battement et à chaque synchro) */
const __gainsPretV1 = new WeakSet();
export function assurerGainsV1(sql) {
  if (sql && typeof sql === "object" && __gainsPretV1.has(sql)) return;
  sql.exec("CREATE TABLE IF NOT EXISTS idle_gains_exp(id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, email TEXT NOT NULL, nom TEXT NOT NULL DEFAULT '', operation TEXT NOT NULL, avant REAL NOT NULL, apres REAL NOT NULL)");
  sql.exec("CREATE INDEX IF NOT EXISTS idx_idle_gains_exp_email ON idle_gains_exp(email, id)");
  if (sql && typeof sql === "object") __gainsPretV1.add(sql);
}

export function enregistrerGainExpV1(sql, { email, nom = "", operation = "", avant, apres, now = Date.now() }) {
  const cle = String(email || "").trim().toLowerCase();
  const a = Number(avant);
  const b = Number(apres);
  if (!cle || !Number.isFinite(a) || !Number.isFinite(b) || Math.abs(b - a) < IDLE_GAINS_SEUIL_V1) return 0;
  assurerGainsV1(sql);
  /* Production courante : regroupée avec la ligne précédente quand elle la prolonge sans surprise. */
  const brut = String(operation || "");
  if (b > a && IDLE_GAINS_OPERATIONS_COURANTES_V1.has(brut)) {
    const prec = sqlRows(sql.exec("SELECT id,operation,avant,apres FROM idle_gains_exp WHERE email=? ORDER BY id DESC LIMIT 1", cle))[0];
    const m = prec && /^(.*?)(?:×(\d+))?$/.exec(String(prec.operation));
    const n = m ? Math.max(1, Number(m[2]) || 1) : 0;
    if (m && m[1] === brut && Number(prec.apres) === a && n < IDLE_GAINS_REGROUPEMENT_MAX_V1) {
      const moyenne = (Number(prec.apres) - Number(prec.avant)) / n;
      if (b - a <= 3 * moyenne + 5) {
        sql.exec("UPDATE idle_gains_exp SET at=?, apres=?, operation=? WHERE id=?", now, b, brut + "×" + (n + 1), prec.id);
        return 1;
      }
    }
  }
  sql.exec("INSERT INTO idle_gains_exp(at,email,nom,operation,avant,apres) VALUES(?,?,?,?,?,?)", now, cle, String(nom || "").slice(0, 80), String(operation || "").slice(0, 120), a, b);
  /* Ménage : au plus 300 lignes par joueur, jamais plus de 60 jours. */
  sql.exec("DELETE FROM idle_gains_exp WHERE email=? AND (at < ? OR id <= COALESCE((SELECT id FROM idle_gains_exp WHERE email=? ORDER BY id DESC LIMIT 1 OFFSET ?), 0))", cle, now - IDLE_GAINS_DUREE_MAX_MS_V1, cle, IDLE_GAINS_MAX_PAR_JOUEUR_V1);
  return 1;
}

/* Lignes les plus récentes d'abord. email vide : tous les joueurs. */
export function lireGainsExpV1(sql, { email = "", limite = 50 } = {}) {
  assurerGainsV1(sql);
  const cle = String(email || "").trim().toLowerCase();
  const max = Math.max(1, Math.min(1000, Math.floor(Number(limite) || 50)));
  const rows = cle
    ? sqlRows(sql.exec("SELECT id,at,email,nom,operation,avant,apres FROM idle_gains_exp WHERE email=? ORDER BY id DESC LIMIT ?", cle, max))
    : sqlRows(sql.exec("SELECT id,at,email,nom,operation,avant,apres FROM idle_gains_exp ORDER BY id DESC LIMIT ?", max));
  return rows.map((r) => ({ id: Number(r.id), at: Number(r.at), email: r.email, nom: r.nom, operation: r.operation, avant: Number(r.avant), apres: Number(r.apres), delta: Number(r.apres) - Number(r.avant) }));
}

/* Une référence de crédit déjà employée pour ce joueur (évite de créditer deux fois la même chose). */
export function creditDejaFaitV1(sql, email, operation) {
  assurerGainsV1(sql);
  const r = sqlRows(sql.exec("SELECT COUNT(*) AS n FROM idle_gains_exp WHERE email=? AND operation=?", String(email || "").trim().toLowerCase(), String(operation || "")))[0];
  return Number(r && r.n) > 0;
}
