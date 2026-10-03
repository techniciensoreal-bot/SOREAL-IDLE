/*
 * Textes éditables par l'administrateur (Norman, 2026-10-02 : « pour chaque boss, pouvoir éditer le texte, le regénérer en y plaçant des voix
 * différentes… sur tout : fenêtres popup, fenêtres explicatives, etc. »). Même principe que les histoires plein écran (idle-histoires-v1.js) :
 * stockage dans la base SQLite du Durable Object (table idle_textes), jamais dans le code, modifiable depuis le jeu sans redéploiement.
 *
 * Une surcharge = { cle, champs, voix[] }.
 *  - cle : « boss:<numéro> » (chronique d'un boss, champs.texte) ou une clé de popup stable (« tuto:debut:2 », « nouveaute:<id> », « sandwich »…).
 *  - champs : textes remplaçant ceux d'origine ; chaque champ est un texte ou une liste de textes. Le texte peut contenir des balises de voix
 *    « (marius) », « (femme) »… : ce qui suit est lu par cette voix (registre modules/voix-nommees-v1.js), la balise ne s'affiche jamais.
 *  - voix : empreintes des blocs dont une voix a été générée depuis le jeu (fichiers R2 idle/voix/<empreinte>.m4a).
 * Le texte d'origine reste dans le code / le catalogue : supprimer la surcharge le rétablit.
 *
 * La surcharge est GLOBALE (pas liée à une ligne JOUEURS) : la partie A et la partie B de l'administrateur voient les mêmes textes.
 */
import { sqlRows, safeJson } from "./core/sqlite-core.js";

export const IDLE_TEXTE_CLE_RE_V1 = /^[A-Za-z0-9:_.-]{1,80}$/;
export const IDLE_TEXTE_HASH_RE_V1 = /^[0-9a-f]{14}$/;
export const IDLE_TEXTE_BOSS_RE_V1 = /^boss:(\d{1,3})$/;
const IDLE_TEXTE_MAX_CHAMP_V1 = 6000;
const IDLE_TEXTE_MAX_LISTE_V1 = 40;
const IDLE_TEXTE_MAX_CHAMPS_V1 = 12;
const IDLE_TEXTE_MAX_NOM_BOSS_V1 = 80;
const IDLE_TEXTE_NOM_CHAMP_RE_V1 = /^[A-Za-z][A-Za-z0-9_]{0,23}$/;

function nettoyerV1(valeur, max) {
  return String(valeur == null ? "" : valeur).replace(/\r\n?/g, "\n").trim().slice(0, max);
}

/* Valide et normalise une surcharge envoyée par l'administrateur. Lève une Error au message lisible. */
export function normaliserTexteV1(brut) {
  const t = brut && typeof brut === "object" ? brut : {};
  const cle = String(t.cle == null ? "" : t.cle).trim();
  if (!IDLE_TEXTE_CLE_RE_V1.test(cle)) throw new Error("TEXTE_CLE_INVALIDE");
  const boss = IDLE_TEXTE_BOSS_RE_V1.exec(cle);
  if (cle.startsWith("boss:") && (!boss || Number(boss[1]) < 1)) throw new Error("TEXTE_BOSS_INVALIDE");
  const source = t.champs && typeof t.champs === "object" && !Array.isArray(t.champs) ? t.champs : {};
  const noms = Object.keys(source);
  if (!noms.length) throw new Error("TEXTE_CHAMPS_REQUIS");
  if (noms.length > IDLE_TEXTE_MAX_CHAMPS_V1) throw new Error("TEXTE_TROP_DE_CHAMPS");
  const champs = {};
  for (const nom of noms) {
    if (!IDLE_TEXTE_NOM_CHAMP_RE_V1.test(nom)) throw new Error("TEXTE_CHAMP_INVALIDE");
    const v = source[nom];
    if (Array.isArray(v)) champs[nom] = v.slice(0, IDLE_TEXTE_MAX_LISTE_V1).map((x) => nettoyerV1(x, IDLE_TEXTE_MAX_CHAMP_V1));
    else champs[nom] = nettoyerV1(v, IDLE_TEXTE_MAX_CHAMP_V1);
  }
  /* Boss : une chronique (champs.texte) et/ou un NOM (champs.nom, Norman 2026-10-03 : « permets-moi d'éditer le nom du boss ») ; le nom tient sur une ligne. */
  if (boss && typeof champs.nom === "string") champs.nom = champs.nom.replace(/\s+/g, " ").trim().slice(0, IDLE_TEXTE_MAX_NOM_BOSS_V1);
  if (boss && typeof champs.texte !== "string" && !(typeof champs.nom === "string" && champs.nom)) throw new Error("TEXTE_BOSS_CHAMP_TEXTE_REQUIS");
  if (boss && typeof champs.nom === "string" && !champs.nom) delete champs.nom;
  const voix = Array.from(new Set((Array.isArray(t.voix) ? t.voix : []).map((x) => String(x || "").trim()).filter((x) => IDLE_TEXTE_HASH_RE_V1.test(x)))).slice(0, 400);
  return { cle, champs, voix };
}

export function assurerTextesV1(sql) {
  sql.exec("CREATE TABLE IF NOT EXISTS idle_textes(cle TEXT PRIMARY KEY, json TEXT NOT NULL, maj INTEGER NOT NULL)");
}

export function lireTextesV1(sql) {
  assurerTextesV1(sql);
  return sqlRows(sql.exec("SELECT cle,json,maj FROM idle_textes ORDER BY cle"))
    .map((r) => {
      const t = safeJson(r.json, null);
      if (!t || typeof t !== "object") return null;
      try { return Object.assign(normaliserTexteV1(Object.assign({}, t, { cle: r.cle })), { maj: Number(r.maj) || 0 }); } catch (_e) { return null; }
    })
    .filter(Boolean);
}

export function enregistrerTexteV1(sql, brut, maintenant = Date.now()) {
  const t = normaliserTexteV1(brut);
  assurerTextesV1(sql);
  sql.exec("INSERT OR REPLACE INTO idle_textes(cle,json,maj) VALUES(?,?,?)", t.cle, JSON.stringify({ champs: t.champs, voix: t.voix }), maintenant);
  return Object.assign(t, { maj: maintenant });
}

export function supprimerTexteV1(sql, cle) {
  assurerTextesV1(sql);
  sql.exec("DELETE FROM idle_textes WHERE cle=?", String(cle || ""));
}

/* Texte de remplacement d'un boss (chronique), ou null : lu à chaque construction d'un boss, donc gardé en mémoire par base. */
const cacheBoss = { sql: null, parNumero: null };
export function invaliderCacheTextesBossV1() {
  cacheBoss.sql = null;
  cacheBoss.parNumero = null;
}
export function texteBossSurchargeV1(sql, numero) {
  const n = Math.floor(Number(numero) || 0);
  if (!sql || n < 1) return null;
  if (cacheBoss.sql !== sql || !cacheBoss.parNumero) {
    const parNumero = new Map();
    try {
      for (const t of lireTextesV1(sql)) {
        const m = IDLE_TEXTE_BOSS_RE_V1.exec(t.cle);
        if (m && (typeof t.champs.texte === "string" || (typeof t.champs.nom === "string" && t.champs.nom))) parNumero.set(Number(m[1]), t);
      }
    } catch (_e) { /* base indisponible : on garde les textes d'origine */ }
    cacheBoss.sql = sql;
    cacheBoss.parNumero = parNumero;
  }
  const t = cacheBoss.parNumero.get(n);
  return t && typeof t.champs.texte === "string" ? t.champs.texte : null;
}

/* Nom de remplacement d'un boss (affiché ET prononcé), ou null : même cache que la chronique. */
export function nomBossSurchargeV1(sql, numero) {
  const n = Math.floor(Number(numero) || 0);
  if (!sql || n < 1) return null;
  texteBossSurchargeV1(sql, n); /* remplit le cache si besoin */
  const t = cacheBoss.parNumero && cacheBoss.parNumero.get(n);
  return t && typeof t.champs.nom === "string" && t.champs.nom ? t.champs.nom : null;
}

/*
 * Ce que reçoit TOUT joueur : les textes de popups modifiés (les textes d'origine sont déjà dans le jeu) et les empreintes de voix de TOUTES les
 * surcharges (identifiants opaques). Le texte d'une chronique de boss n'est jamais envoyé ici : il arrive avec le boss, seulement quand il est
 * affiché (anti-spoil, AGENTS.md règle n°2).
 */
export function surchargesPourJoueurV1(sql) {
  const textes = lireTextesV1(sql);
  const popups = {};
  const voix = new Set();
  for (const t of textes) {
    for (const h of t.voix) voix.add(h);
    if (!IDLE_TEXTE_BOSS_RE_V1.test(t.cle)) popups[t.cle] = { champs: t.champs, voix: t.voix };
  }
  return { popups, voix: Array.from(voix) };
}
