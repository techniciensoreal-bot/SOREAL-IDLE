/*
 * Chat et présence de SOREAL IDLE (Norman, 2026-09-30) : « supprimer le chat tel qu'il est. Un chat uniquement réservé aux gens qui
 * jouent au jeu, accessible via le jeu, pour voir qui est en ligne SUR SOREAL IDLE (APP et TV ne doivent pas nous signaler en ligne),
 * avec des infos en plus du genre "Farm dans <zone d'Aventure>". »
 *
 * Tout vit dans la base SQLite du Durable Object de SOREAL IDLE : aucun lien avec le chat de APP/TV (l'ancien pont par la page parente
 * est supprimé). « En ligne » = un battement reçu de CE jeu dans les dernières secondes (battementV1) : ouvrir APP ou TV n'y change rien.
 *
 * Le battement sert aussi au TEMPS DE JEU ACTIF (classement) : il dit si le joueur a réellement interagi récemment avec la page
 * visible ; le temps écoulé entre deux battements rapprochés n'est compté que dans ce cas (jamais le rattrapage hors-ligne).
 *
 * Confidentialité : un joueur n'est jamais identifié par son adresse e-mail pour les autres (seulement le nom affiché, « pseudo » ou
 * « pseudo (prénom) » comme au classement) ; la page ne reçoit qu'un drapeau « c'est moi ».
 */
import { sqlRows } from "./core/sqlite-core.js";

/* Un battement toutes les ~20 s (un onglet en arrière-plan n'en envoie qu'environ un par minute) : en ligne tant que le dernier a moins de 90 s. */
export const IDLE_PRESENCE_EN_LIGNE_MS_V1 = 90 * 1000;
/* Au-delà de cet écart entre deux battements, le joueur a quitté le jeu : le temps n'est pas compté. */
export const IDLE_PRESENCE_ECART_MAX_S_V1 = 60;
/* Jamais plus de 45 s comptées par battement, quoi que dise le client. */
export const IDLE_PRESENCE_GAIN_MAX_S_V1 = 45;
export const IDLE_CHAT_MAX_TEXTE_V1 = 280;
export const IDLE_CHAT_MAX_MESSAGES_V1 = 500;
export const IDLE_CHAT_DELAI_MIN_MS_V1 = 1500;
export const IDLE_CHAT_LIMITE_LECTURE_V1 = 100;

export function assurerChatV1(sql) {
  sql.exec("CREATE TABLE IF NOT EXISTS idle_chat(id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, email TEXT NOT NULL, nom TEXT NOT NULL, admin INTEGER NOT NULL DEFAULT 0, texte TEXT NOT NULL)");
  sql.exec("CREATE TABLE IF NOT EXISTS idle_presence(email TEXT PRIMARY KEY, nom TEXT NOT NULL, admin INTEGER NOT NULL DEFAULT 0, vu_le INTEGER NOT NULL, actif INTEGER NOT NULL DEFAULT 0, activite TEXT NOT NULL DEFAULT '{}')");
}

/* Ce que fait le joueur, réduit au strict nécessaire (le client l'envoie, le serveur ne fait confiance à rien). */
export function normaliserActiviteV1(brut) {
  const a = brut && typeof brut === "object" ? brut : {};
  const t = a.t === "farm" || a.t === "boss" ? a.t : "libre";
  const sortie = { t };
  if (t === "farm") {
    sortie.zoneId = Math.max(0, Math.min(9999, Math.floor(Number(a.zoneId) || 0)));
    sortie.zoneNom = String(a.zoneNom == null ? "" : a.zoneNom).replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 60);
  }
  if (t === "boss") sortie.boss = Math.max(0, Math.min(99999, Math.floor(Number(a.boss) || 0)));
  return sortie;
}

function texteChatNettoyeV1(valeur) {
  return String(valeur == null ? "" : valeur)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f​-‏‪-‮⁠﻿]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, IDLE_CHAT_MAX_TEXTE_V1);
}

/*
 * Enregistre le battement d'un joueur et renvoie les secondes de temps ACTIF à lui créditer + la liste des joueurs en ligne.
 * gain > 0 seulement si : le client déclare une interaction récente sur page visible (actif), un battement précédent existe et il
 * date de moins de IDLE_PRESENCE_ECART_MAX_S_V1 secondes.
 */
export function battementV1(sql, { email, nom, admin, actif, activite, now = Date.now() }) {
  assurerChatV1(sql);
  const cle = String(email || "").trim().toLowerCase();
  if (!cle) throw new Error("PRESENCE_EMAIL_REQUIS");
  const precedent = sqlRows(sql.exec("SELECT vu_le FROM idle_presence WHERE email=?", cle))[0];
  let gain = 0;
  if (precedent && actif === true) {
    const ecart = (now - Number(precedent.vu_le)) / 1000;
    if (ecart > 0 && ecart <= IDLE_PRESENCE_ECART_MAX_S_V1) gain = Math.min(ecart, IDLE_PRESENCE_GAIN_MAX_S_V1);
  }
  sql.exec(
    "INSERT OR REPLACE INTO idle_presence(email,nom,admin,vu_le,actif,activite) VALUES(?,?,?,?,?,?)",
    cle,
    String(nom || "Joueur").slice(0, 80),
    admin ? 1 : 0,
    now,
    actif === true ? 1 : 0,
    JSON.stringify(normaliserActiviteV1(activite))
  );
  /* Ménage : les présences très anciennes sont oubliées (la liste ne montre de toute façon que les joueurs en ligne). */
  sql.exec("DELETE FROM idle_presence WHERE vu_le < ?", now - 24 * 3600 * 1000);
  return { gain, enLigne: listerEnLigneV1(sql, cle, now) };
}

export function listerEnLigneV1(sql, emailMoi, now = Date.now()) {
  assurerChatV1(sql);
  return sqlRows(sql.exec("SELECT email,nom,admin,actif,activite FROM idle_presence WHERE vu_le >= ? ORDER BY nom COLLATE NOCASE", now - IDLE_PRESENCE_EN_LIGNE_MS_V1))
    .map((r) => {
      let activite = { t: "libre" };
      try { activite = normaliserActiviteV1(JSON.parse(r.activite)); } catch (_e) { /* activité illisible : « libre » */ }
      return { nom: r.nom, admin: Number(r.admin) === 1, actif: Number(r.actif) === 1, activite, moi: r.email === String(emailMoi || "").toLowerCase() };
    });
}

export function lireChatV1(sql, { apresId = 0, limite = 40, email = "" } = {}) {
  assurerChatV1(sql);
  const moi = String(email || "").trim().toLowerCase();
  const after = Math.max(0, Math.floor(Number(apresId) || 0));
  const max = Math.max(1, Math.min(IDLE_CHAT_LIMITE_LECTURE_V1, Math.floor(Number(limite) || 40)));
  const rows = after > 0
    ? sqlRows(sql.exec("SELECT id,at,email,nom,admin,texte FROM idle_chat WHERE id > ? ORDER BY id LIMIT ?", after, max))
    : sqlRows(sql.exec("SELECT id,at,email,nom,admin,texte FROM (SELECT id,at,email,nom,admin,texte FROM idle_chat ORDER BY id DESC LIMIT ?) ORDER BY id", max));
  return rows.map((r) => ({ id: Number(r.id), at: Number(r.at), nom: r.nom, admin: Number(r.admin) === 1, message: r.texte, moi: r.email === moi }));
}

export function envoyerChatV1(sql, { email, nom, admin, texte, now = Date.now() }) {
  assurerChatV1(sql);
  const cle = String(email || "").trim().toLowerCase();
  if (!cle) throw new Error("CHAT_EMAIL_REQUIS");
  const message = texteChatNettoyeV1(texte);
  if (!message) return { ok: false, code: "CHAT_VIDE", message: "Message vide." };
  const dernier = sqlRows(sql.exec("SELECT at FROM idle_chat WHERE email=? ORDER BY id DESC LIMIT 1", cle))[0];
  if (dernier && now - Number(dernier.at) < IDLE_CHAT_DELAI_MIN_MS_V1) {
    return { ok: false, code: "CHAT_TROP_RAPIDE", message: "Doucement : un message à la fois." };
  }
  sql.exec("INSERT INTO idle_chat(at,email,nom,admin,texte) VALUES(?,?,?,?,?)", now, cle, String(nom || "Joueur").slice(0, 80), admin ? 1 : 0, message);
  const id = Number(sqlRows(sql.exec("SELECT last_insert_rowid() AS id"))[0].id);
  sql.exec("DELETE FROM idle_chat WHERE id <= ?", id - IDLE_CHAT_MAX_MESSAGES_V1);
  return { ok: true, id };
}

export function supprimerMessageChatV1(sql, id) {
  assurerChatV1(sql);
  sql.exec("DELETE FROM idle_chat WHERE id=?", Math.floor(Number(id) || 0));
}

/* Identifiant du dernier message (pour le badge « non lus » sans recharger les messages). */
export function dernierIdChatV1(sql) {
  assurerChatV1(sql);
  const r = sqlRows(sql.exec("SELECT MAX(id) AS id FROM idle_chat"))[0];
  return Number(r && r.id) || 0;
}
