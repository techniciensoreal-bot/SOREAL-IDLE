/*
 * Relais de connexion de l'application Android hors ligne (Norman, 2026-10-30 : « au démarrage, un écran de connexion ; on choisit son compte Google ; si ce compte a une partie, elle est restaurée ; sinon on demande un pseudo »).
 *
 * Google refuse la connexion dans la WebView de l'application. Comme sur l'ordinateur, la connexion se fait dans le NAVIGATEUR du téléphone (la page du jeu ouverte avec « ?relais=<code> »). Mais, contrairement à l'ordinateur, l'application ne peut pas écouter
 * un retour local sans changer son code Java : le navigateur DÉPOSE donc ici le jeton de session sous le code secret que l'application a tiré (24 à 64 caractères hexadécimaux, connu d'elle seule), et l'application le RETIRE (une seule fois, la ligne
 * est supprimée à la lecture ; elle disparaît de toute façon après 10 minutes). Le jeton n'est jamais lisible sans le code.
 */
const CODE_RE = /^[0-9a-f]{24,64}$/;
const DUREE_MS = 10 * 60 * 1000;

export function assurerTableRelaisV1(sql) {
  sql.exec("CREATE TABLE IF NOT EXISTS idle_relais (code TEXT PRIMARY KEY, jeton TEXT NOT NULL, expire INTEGER NOT NULL DEFAULT 0, cree INTEGER NOT NULL)");
}

function purger_(sql, maintenant) {
  sql.exec("DELETE FROM idle_relais WHERE cree<?", maintenant - DUREE_MS);
}

/* Dépose le jeton de la session (déjà vérifiée par l'appelant) sous le code. */
export function poserRelaisV1(coord, sessionToken, code, maintenant = Date.now()) {
  const c = String(code || "").trim().toLowerCase();
  if (!CODE_RE.test(c)) return { ok: false, error: "RELAIS_CODE_INVALIDE" };
  const s = coord.standaloneSessionV1(sessionToken);
  if (!s.ok) return { ok: false, error: s.error };
  assurerTableRelaisV1(coord.sql);
  purger_(coord.sql, maintenant);
  coord.sql.exec("INSERT OR REPLACE INTO idle_relais(code,jeton,expire,cree) VALUES(?,?,?,?)", c, String(sessionToken), Number(s.expiresAt) || 0, maintenant);
  return { ok: true };
}

/* Retire le jeton déposé sous le code : { ok:true, attente:true } tant que rien n'est déposé. */
export function lireRelaisV1(coord, code, maintenant = Date.now()) {
  const c = String(code || "").trim().toLowerCase();
  if (!CODE_RE.test(c)) return { ok: false, error: "RELAIS_CODE_INVALIDE" };
  assurerTableRelaisV1(coord.sql);
  purger_(coord.sql, maintenant);
  const ligne = coord.sqlAll("SELECT jeton,expire FROM idle_relais WHERE code=?", c)[0];
  if (!ligne) return { ok: true, attente: true };
  coord.sql.exec("DELETE FROM idle_relais WHERE code=?", c);
  return { ok: true, jeton: String(ligne.jeton), expire: Number(ligne.expire) || 0 };
}
