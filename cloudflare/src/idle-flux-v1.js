/*
 * Fil d'actualité de SOREAL IDLE (Norman, 2026-10-01) : « une manière de voir ce que les gens font dans leur jeu : Mickaël vient de tuer
 * <boss>, Sébastien a débloqué le trophée <trophée>, Sylvain farme dans les égouts, Maxence a terrassé <titan>… pour rendre le jeu plus
 * vivant, et pouvoir voir ces informations dans tous les menus (texte défilant). »
 *
 * Les événements sont DÉDUITS de l'état du joueur à chacun de ses battements (toutes les ~20 s, voir battementSorealIdle) : on compare un
 * instantané (boss, trophées, titans, défis, Rebirths) avec le précédent. Aucune opération du jeu n'est modifiée, et seuls les joueurs
 * dont le jeu est ouvert produisent des événements. Le premier battement d'un joueur ne fait que mémoriser son état (jamais de rafale).
 *
 * Confidentialité : le nom affiché est le même qu'au classement/chat (jamais l'adresse e-mail) ; un joueur qui s'est retiré du classement
 * (stats.classementVisible === false) n'apparaît pas non plus dans le fil.
 * Anti-spoil (AGENTS.md règle n°2) : le serveur stocke le détail brut (n° de boss, nom du titan…) ; c'est le CLIENT qui ne l'affiche que si
 * le lecteur l'a déjà découvert (sinon « a vaincu un boss », « a débloqué un trophée »…), comme pour le chat.
 */
import { sqlRows } from "./core/sqlite-core.js";

export const IDLE_FLUX_MAX_LIGNES_V1 = 400;
export const IDLE_FLUX_DUREE_MAX_MS_V1 = 48 * 3600 * 1000;
export const IDLE_FLUX_LIMITE_LECTURE_V1 = 40;
/* Un joueur qui change de zone de farm n'est annoncé qu'une fois toutes les 10 minutes au plus. */
export const IDLE_FLUX_DELAI_FARM_MS_V1 = 10 * 60 * 1000;
/* Jamais plus de ce nombre d'événements par battement et par joueur (un gros rattrapage ne doit pas inonder le fil). */
export const IDLE_FLUX_MAX_PAR_BATTEMENT_V1 = 6;

export function assurerFluxV1(sql) {
  sql.exec("CREATE TABLE IF NOT EXISTS idle_flux(id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, email TEXT NOT NULL, nom TEXT NOT NULL, type TEXT NOT NULL, donnees TEXT NOT NULL DEFAULT '{}')");
  sql.exec("CREATE TABLE IF NOT EXISTS idle_flux_etat(email TEXT PRIMARY KEY, etat TEXT NOT NULL, maj INTEGER NOT NULL)");
}

const N = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

/*
 * Instantané des jalons d'un joueur, lu dans sa ligne (boss vaincus + stats.metaNgu). Tout est réduit à des identifiants et des compteurs.
 */
export function instantaneJoueurV1({ bossVaincus = 0, stats = null } = {}) {
  const m = stats && typeof stats === "object" && stats.metaNgu && typeof stats.metaNgu === "object" ? stats.metaNgu : {};
  const succes = Object.keys((m.systems && m.systems.achievements && m.systems.achievements.data && m.systems.achievements.data.unlocked) || {}).sort();
  const titans = {};
  const brutsTitans = (m.adventure && m.adventure.titans) || {};
  for (const [id, t] of Object.entries(brutsTitans)) {
    const k = Math.max(0, Math.floor(N(t && t.kills, 0)));
    if (k > 0) titans[id] = k;
  }
  const defis = {};
  const ch = m.challenge || {};
  for (const [id, n] of Object.entries(ch.completions || {})) if (N(n) > 0) defis["normal:" + id] = Math.floor(N(n));
  for (const tier of ["difficile", "extreme"]) {
    for (const [id, n] of Object.entries((ch.completionsTier && ch.completionsTier[tier]) || {})) if (N(n) > 0) defis[tier + ":" + id] = Math.floor(N(n));
  }
  return {
    boss: Math.max(0, Math.floor(N(bossVaincus, 0))),
    succes,
    titans,
    defis,
    rebirths: Math.max(0, Math.floor(N(m.records && m.records.totalRebirths, 0)))
  };
}

/*
 * Événements entre deux instantanés. noms = { boss(n), succes(id), titan(id) } renvoient les noms d'origine. Retourne au plus
 * IDLE_FLUX_MAX_PAR_BATTEMENT_V1 événements { type, donnees }.
 */
export function evenementsV1(avant, apres, noms = {}) {
  if (!avant || !apres) return [];
  const nom = (f, x) => { try { return String((typeof f === "function" ? f(x) : "") || "").slice(0, 80); } catch (_e) { return ""; } };
  const ev = [];
  if (apres.boss > avant.boss) ev.push({ type: "boss", donnees: { boss: apres.boss, nom: nom(noms.boss, apres.boss) } });
  const connus = new Set(avant.succes || []);
  let nbSucces = 0;
  for (const id of apres.succes || []) {
    if (connus.has(id) || nbSucces >= 3) continue;
    nbSucces += 1;
    ev.push({ type: "succes", donnees: { id, nom: nom(noms.succes, id) } });
  }
  for (const [id, kills] of Object.entries(apres.titans || {})) {
    if (kills > N((avant.titans || {})[id], 0)) ev.push({ type: "titan", donnees: { id, nom: nom(noms.titan, id) } });
  }
  for (const [cle, n] of Object.entries(apres.defis || {})) {
    if (n > N((avant.defis || {})[cle], 0)) {
      const [tier, id] = cle.split(":");
      ev.push({ type: "defi", donnees: { id, tier, completion: n } });
    }
  }
  if (apres.rebirths > avant.rebirths) ev.push({ type: "rebirth", donnees: { n: apres.rebirths } });
  return ev.slice(0, IDLE_FLUX_MAX_PAR_BATTEMENT_V1);
}

function lireEtatV1(sql, email) {
  const r = sqlRows(sql.exec("SELECT etat FROM idle_flux_etat WHERE email=?", email))[0];
  if (!r) return null;
  try { return JSON.parse(r.etat); } catch (_e) { return null; }
}

/*
 * Compare l'instantané du joueur au précédent, enregistre les événements et mémorise le nouvel état. visible=false : rien n'est publié (l'état
 * est tout de même mémorisé, pour ne pas rattraper d'un coup au retour dans le classement). activite = activité normalisée du battement.
 */
export function enregistrerJalonsV1(sql, { email, nom, visible = true, instantane, activite = null, noms = {}, now = Date.now() }) {
  assurerFluxV1(sql);
  const cle = String(email || "").trim().toLowerCase();
  if (!cle || !instantane) return 0;
  const precedent = lireEtatV1(sql, cle);
  const etat = Object.assign({}, instantane, { farmZone: precedent ? N(precedent.farmZone, 0) : 0, farmAt: precedent ? N(precedent.farmAt, 0) : 0 });
  let ajoutes = 0;
  if (precedent && visible) {
    const evenements = evenementsV1(precedent, instantane, noms);
    /* Farm : annoncé seulement quand la zone change, au plus toutes les 10 minutes. */
    if (activite && activite.t === "farm" && N(activite.zoneId) > 0 && N(activite.zoneId) !== N(precedent.farmZone, 0) && now - N(precedent.farmAt, 0) >= IDLE_FLUX_DELAI_FARM_MS_V1) {
      evenements.push({ type: "farm", donnees: { zoneId: N(activite.zoneId), zoneNom: String(activite.zoneNom || "").slice(0, 60) } });
      etat.farmZone = N(activite.zoneId);
      etat.farmAt = now;
    }
    for (const e of evenements.slice(0, IDLE_FLUX_MAX_PAR_BATTEMENT_V1)) {
      sql.exec("INSERT INTO idle_flux(at,email,nom,type,donnees) VALUES(?,?,?,?,?)", now, cle, String(nom || "Joueur").slice(0, 80), e.type, JSON.stringify(e.donnees));
      ajoutes += 1;
    }
  } else if (activite && activite.t === "farm" && N(activite.zoneId) > 0) {
    etat.farmZone = N(activite.zoneId);
    etat.farmAt = now;
  }
  sql.exec("INSERT OR REPLACE INTO idle_flux_etat(email,etat,maj) VALUES(?,?,?)", cle, JSON.stringify(etat), now);
  if (ajoutes) {
    sql.exec("DELETE FROM idle_flux WHERE at < ?", now - IDLE_FLUX_DUREE_MAX_MS_V1);
    const dernier = Number(sqlRows(sql.exec("SELECT MAX(id) AS id FROM idle_flux"))[0].id) || 0;
    sql.exec("DELETE FROM idle_flux WHERE id <= ?", dernier - IDLE_FLUX_MAX_LIGNES_V1);
  }
  return ajoutes;
}

export function lireFluxV1(sql, { apresId = 0, limite = IDLE_FLUX_LIMITE_LECTURE_V1, email = "" } = {}) {
  assurerFluxV1(sql);
  const moi = String(email || "").trim().toLowerCase();
  const after = Math.max(0, Math.floor(Number(apresId) || 0));
  const max = Math.max(1, Math.min(IDLE_FLUX_LIMITE_LECTURE_V1, Math.floor(Number(limite) || IDLE_FLUX_LIMITE_LECTURE_V1)));
  const rows = after > 0
    ? sqlRows(sql.exec("SELECT id,at,email,nom,type,donnees FROM idle_flux WHERE id > ? ORDER BY id LIMIT ?", after, max))
    : sqlRows(sql.exec("SELECT id,at,email,nom,type,donnees FROM (SELECT id,at,email,nom,type,donnees FROM idle_flux ORDER BY id DESC LIMIT ?) ORDER BY id", max));
  return rows.map((r) => {
    let donnees = {};
    try { donnees = JSON.parse(r.donnees); } catch (_e) { /* détail illisible : événement sans détail */ }
    return { id: Number(r.id), at: Number(r.at), nom: r.nom, type: r.type, donnees, moi: r.email === moi };
  });
}

export function dernierIdFluxV1(sql) {
  assurerFluxV1(sql);
  const r = sqlRows(sql.exec("SELECT MAX(id) AS id FROM idle_flux"))[0];
  return Number(r && r.id) || 0;
}
