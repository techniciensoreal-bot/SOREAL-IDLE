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
 *  - parle : (Norman, 2026-10-11) le texte tel qu'il doit être DIT, même forme que `champs` (texte ou liste de textes, avec les balises de voix) : les joueurs lisent `champs` et ENTENDENT `parle`, quoi qu'on change dans `champs`. Absent = la voix suit `champs`.
 *  - voixTextes : { empreinte du bloc affiché -> texte de VOIX } (Norman, 2026-10-08) : comment le bloc doit se PRONONCER, écrit librement (« est-ce tes haut paix »), sans toucher au texte lu par les joueurs. L'empreinte reste celle du
 *    texte affiché : le fichier de voix est le même, seule la phrase envoyée au studio change. Jamais envoyé aux joueurs (administrateur seulement).
 *  - voixFaites : { empreinte -> texte de voix utilisé lors de la DERNIÈRE génération } : un bloc dont le texte de voix a changé depuis est « à refaire ».
 * Le texte d'origine reste dans le code / le catalogue : supprimer la surcharge le rétablit.
 *
 * La surcharge est GLOBALE (pas liée à une ligne JOUEURS) : la partie A et la partie B de l'administrateur voient les mêmes textes.
 */
import { sqlRows, safeJson } from "./core/sqlite-core.js";

export const IDLE_TEXTE_CLE_RE_V1 = /^[A-Za-z0-9:_.-]{1,80}$/;
export const IDLE_TEXTE_HASH_RE_V1 = /^[0-9a-f]{14}$/;
export const IDLE_TEXTE_BOSS_RE_V1 = /^boss:(\d{1,3})$/;
/*
 * Langues (Norman, 2026-11-02 : « quand je mets le jeu en anglais, j'édite les voix ANGLAISES… et quand je mets en FR, j'édite uniquement le FR ») : la surcharge ANGLAISE d'un texte est stockée sous la clé « <clé>:en »
 * (« boss:12:en », « tuto:debut:2:en »), strictement séparée de la française. Un joueur qui joue en anglais ne reçoit QUE les « :en » (clé renvoyée sans le suffixe), en français que les autres : jamais de fuite d'une langue dans l'autre.
 */
export const IDLE_TEXTE_BOSS_EN_RE_V1 = /^boss:(\d{1,3}):en$/;
export const IDLE_TEXTE_SUFFIXE_EN_V1 = ":en";
export const estCleEnV1 = (cle) => String(cle == null ? "" : cle).endsWith(IDLE_TEXTE_SUFFIXE_EN_V1);
export const cleSansLangueV1 = (cle) => { const c = String(cle == null ? "" : cle); return c.endsWith(IDLE_TEXTE_SUFFIXE_EN_V1) ? c.slice(0, -IDLE_TEXTE_SUFFIXE_EN_V1.length) : c; };
export const cleAvecLangueV1 = (cle, langue) => (langue === "en" ? cleSansLangueV1(cle) + IDLE_TEXTE_SUFFIXE_EN_V1 : cleSansLangueV1(cle));
/*
 * Suppression COMPLÈTE d'une voix sans texte à l'écran (Norman, 2026-11-03 : « dans admin, je dois pouvoir supprimer complètement les choses dans Voix sans texte à l'écran »). Seules ces clés (et leur version « :en ») peuvent être
 * supprimées : l'entrée n'est alors plus lue du tout (ni voix générée, ni voix de secours, ni texte d'origine). Marqueur persistant { supprime: true } dans la ligne idle_textes de la clé ; sans champs ni voix, donc ses voix ne sont plus
 * « déclarées » (purge stricte : elles deviennent inutiles, rien n'est supprimé ici). « Rétablir » = supprimerTexteV1 (retour au texte d'origine).
 */
export const IDLE_TEXTES_SUPPRIMABLES_V1 = ["systeme:sandwich", "systeme:chroniques-intro"];
export const estSupprimableV1 = (cle) => IDLE_TEXTES_SUPPRIMABLES_V1.includes(cleSansLangueV1(cle));
const IDLE_TEXTE_MAX_CHAMP_V1 = 6000;
const IDLE_TEXTE_MAX_LISTE_V1 = 40;
const IDLE_TEXTE_MAX_CHAMPS_V1 = 12;
const IDLE_TEXTE_MAX_NOM_BOSS_V1 = 80;
const IDLE_TEXTE_MAX_VOIX_TEXTE_V1 = 1500;
const IDLE_TEXTE_MAX_VOIX_TEXTES_V1 = 400;

/* { empreinte: texte } : empreintes valides seulement, textes non vides, bornés. */
function voixTextesV1(brut) {
  const out = {};
  if (!brut || typeof brut !== "object" || Array.isArray(brut)) return out;
  for (const h of Object.keys(brut).slice(0, IDLE_TEXTE_MAX_VOIX_TEXTES_V1)) {
    if (!IDLE_TEXTE_HASH_RE_V1.test(h)) continue;
    const v = nettoyerV1(brut[h], IDLE_TEXTE_MAX_VOIX_TEXTE_V1);
    if (v) out[h] = v;
  }
  return out;
}
const IDLE_TEXTE_NOM_CHAMP_RE_V1 = /^[A-Za-z][A-Za-z0-9_]{0,23}$/;

function nettoyerV1(valeur, max) {
  return String(valeur == null ? "" : valeur).replace(/\r\n?/g, "\n").trim().slice(0, max);
}

/* Valide et normalise une surcharge envoyée par l'administrateur. Lève une Error au message lisible. */
export function normaliserTexteV1(brut) {
  const t = brut && typeof brut === "object" ? brut : {};
  const cle = String(t.cle == null ? "" : t.cle).trim();
  if (!IDLE_TEXTE_CLE_RE_V1.test(cle)) throw new Error("TEXTE_CLE_INVALIDE");
  if (cle.startsWith("saviez-vous:")) throw new Error("TEXTE_CLE_INVALIDE");   /* fonctionnalité supprimée (2026-11-02) */
  if (t.supprime === true) {
    if (!estSupprimableV1(cle)) throw new Error("TEXTE_SUPPRESSION_INCONNUE");
    return { cle, champs: {}, parle: {}, voix: [], voixTextes: {}, voixFaites: {}, supprime: true };
  }
  const boss = IDLE_TEXTE_BOSS_RE_V1.exec(cle) || IDLE_TEXTE_BOSS_EN_RE_V1.exec(cle);
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
  /*
   * Blocs d'une liste (Norman, 2026-11-02 : « je dois pouvoir supprimer un texte… si c'était 3 textes jaunes, je peux le mettre en 1 ou 5 ») : le joueur voit EXACTEMENT les blocs enregistrés, jamais un bloc vide.
   * Un bloc vide d'une liste est retiré ; la liste parlée du même champ (un texte dit par bloc) perd les mêmes rangs quand elle est de même longueur.
   */
  const rangsGardes = {};
  for (const nom of noms) {
    if (!Array.isArray(champs[nom])) continue;
    const gardes = champs[nom].map((x) => Boolean(x));
    rangsGardes[nom] = gardes;
    champs[nom] = champs[nom].filter((x, i) => gardes[i]);
  }
  /* Texte parlé : mêmes noms de champs, mêmes bornes ; un nom de champ absent de `champs` est ignoré. */
  const parle = {};
  const sourceParle = t.parle && typeof t.parle === "object" && !Array.isArray(t.parle) ? t.parle : {};
  for (const nom of Object.keys(sourceParle)) {
    if (!IDLE_TEXTE_NOM_CHAMP_RE_V1.test(nom) || !(nom in champs)) continue;
    const v = sourceParle[nom];
    if (Array.isArray(v)) {
      const dits = v.slice(0, IDLE_TEXTE_MAX_LISTE_V1).map((x) => nettoyerV1(x, IDLE_TEXTE_MAX_CHAMP_V1));
      const gardes = rangsGardes[nom];
      parle[nom] = gardes && gardes.length === dits.length ? dits.filter((x, i) => gardes[i]) : dits;
    } else if (typeof v === "string") parle[nom] = nettoyerV1(v, IDLE_TEXTE_MAX_CHAMP_V1);
  }
  if (boss && typeof parle.nom === "string") parle.nom = parle.nom.replace(/\s+/g, " ").trim().slice(0, IDLE_TEXTE_MAX_NOM_BOSS_V1);
  const voix = Array.from(new Set((Array.isArray(t.voix) ? t.voix : []).map((x) => String(x || "").trim()).filter((x) => IDLE_TEXTE_HASH_RE_V1.test(x)))).slice(0, 400);
  return { cle, champs, parle, voix, voixTextes: voixTextesV1(t.voixTextes), voixFaites: voixTextesV1(t.voixFaites) };
}

export function assurerTextesV1(sql) {
  sql.exec("CREATE TABLE IF NOT EXISTS idle_textes(cle TEXT PRIMARY KEY, json TEXT NOT NULL, maj INTEGER NOT NULL)");
  /* Nettoyage (2026-11-02) : l'ancienne fonctionnalité supprimée a laissé, au plus, une ligne : elle est effacée. */
  sql.exec("DELETE FROM idle_textes WHERE cle LIKE 'saviez-vous:%'");
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
  sql.exec("INSERT OR REPLACE INTO idle_textes(cle,json,maj) VALUES(?,?,?)", t.cle, JSON.stringify(t.supprime ? { supprime: true, champs: {}, parle: {}, voix: [], voixTextes: {}, voixFaites: {} } : { champs: t.champs, parle: t.parle, voix: t.voix, voixTextes: t.voixTextes, voixFaites: t.voixFaites }), maintenant);
  return Object.assign(t, { maj: maintenant });
}

export function supprimerTexteV1(sql, cle) {
  assurerTextesV1(sql);
  sql.exec("DELETE FROM idle_textes WHERE cle=?", String(cle || ""));
}

/*
 * Validation de la voix d'un texte (Norman, 2026-10-28 : « un bouton rouge de base, jaune au premier clic (validé mais peut mieux faire), vert au deuxième (totalement validé), rouge au troisième »). 0 = rouge (non validée, rien d'enregistré),
 * 1 = jaune, 2 = vert. Table à part : une chronique d'origine (sans surcharge) peut être validée sans devenir un texte modifié. Administrateur seulement ; jamais envoyée aux joueurs.
 */
export const IDLE_VOIX_VALIDATION_MAX_V1 = 2;
export function assurerValidationsVoixV1(sql) {
  sql.exec("CREATE TABLE IF NOT EXISTS idle_voix_validation(cle TEXT PRIMARY KEY, etat INTEGER NOT NULL, maj INTEGER NOT NULL)");
}
/* { cle: 1 | 2 } : les textes rouges n'ont pas de ligne. */
export function lireValidationsVoixV1(sql) {
  assurerValidationsVoixV1(sql);
  const out = {};
  for (const r of sqlRows(sql.exec("SELECT cle,etat FROM idle_voix_validation"))) {
    const e = Number(r.etat);
    if (IDLE_TEXTE_CLE_RE_V1.test(String(r.cle)) && (e === 1 || e === 2)) out[String(r.cle)] = e;
  }
  return out;
}
export function definirValidationVoixV1(sql, cle, etat, maintenant = Date.now()) {
  const k = String(cle == null ? "" : cle);
  if (!IDLE_TEXTE_CLE_RE_V1.test(k)) throw new Error("TEXTE_CLE_INVALIDE");
  const e = Math.floor(Number(etat));
  if (!(e >= 0 && e <= IDLE_VOIX_VALIDATION_MAX_V1)) throw new Error("TEXTE_VALIDATION_INVALIDE");
  assurerValidationsVoixV1(sql);
  if (e === 0) sql.exec("DELETE FROM idle_voix_validation WHERE cle=?", k);
  else sql.exec("INSERT OR REPLACE INTO idle_voix_validation(cle,etat,maj) VALUES(?,?,?)", k, e, maintenant);
  return e;
}

/* Texte de remplacement d'un boss (chronique), ou null : lu à chaque construction d'un boss, donc gardé en mémoire par base. */
const cacheBoss = { sql: null, parNumero: null, parNumeroEn: null };
export function invaliderCacheTextesBossV1() {
  cacheBoss.sql = null;
  cacheBoss.parNumero = null;
  cacheBoss.parNumeroEn = null;
}
/* Surcharge d'un boss dans la langue demandée (« fr » par défaut, « en » = clé boss:<N>:en) ou undefined ; un seul passage remplit les deux tables. */
function entreeBossV1(sql, n, langue) {
  if (cacheBoss.sql !== sql || !cacheBoss.parNumero) {
    const parNumero = new Map();
    const parNumeroEn = new Map();
    try {
      for (const t of lireTextesV1(sql)) {
        const m = IDLE_TEXTE_BOSS_RE_V1.exec(t.cle);
        const me = m ? null : IDLE_TEXTE_BOSS_EN_RE_V1.exec(t.cle);
        const lien = m || me;
        if (lien && (typeof t.champs.texte === "string" || (typeof t.champs.nom === "string" && t.champs.nom))) (m ? parNumero : parNumeroEn).set(Number(lien[1]), t);
      }
    } catch (_e) { /* base indisponible : on garde les textes d'origine */ }
    cacheBoss.sql = sql;
    cacheBoss.parNumero = parNumero;
    cacheBoss.parNumeroEn = parNumeroEn;
  }
  return (langue === "en" ? cacheBoss.parNumeroEn : cacheBoss.parNumero).get(n);
}
/* Au moins une chronique ou un nom de boss écrit en ANGLAIS (clé boss:<N>:en) ? Évite de reparcourir toute une réponse quand il n'y en a aucune. */
export function aSurchargesBossEnV1(sql) {
  if (!sql) return false;
  entreeBossV1(sql, 0, "en");
  return Boolean(cacheBoss.parNumeroEn && cacheBoss.parNumeroEn.size);
}
export function texteBossSurchargeV1(sql, numero, langue) {
  const n = Math.floor(Number(numero) || 0);
  if (!sql || n < 1) return null;
  const t = entreeBossV1(sql, n, langue);
  return t && typeof t.champs.texte === "string" ? t.champs.texte : null;
}

/* Texte PARLÉ de la chronique d'un boss (ce que la voix dit, quel que soit le texte affiché), ou null. */
export function texteBossParleV1(sql, numero, langue) {
  const n = Math.floor(Number(numero) || 0);
  if (!sql || n < 1) return null;
  const t = entreeBossV1(sql, n, langue);
  return t && t.parle && typeof t.parle.texte === "string" && t.parle.texte ? t.parle.texte : null;
}
/* Nom PARLÉ d'un boss (ce que la voix prononce), ou null. */
export function nomBossParleV1(sql, numero, langue) {
  const n = Math.floor(Number(numero) || 0);
  if (!sql || n < 1) return null;
  const t = entreeBossV1(sql, n, langue);
  return t && t.parle && typeof t.parle.nom === "string" && t.parle.nom ? t.parle.nom : null;
}

/* Nom de remplacement d'un boss (affiché ET prononcé), ou null : même cache que la chronique. */
export function nomBossSurchargeV1(sql, numero, langue) {
  const n = Math.floor(Number(numero) || 0);
  if (!sql || n < 1) return null;
  const t = entreeBossV1(sql, n, langue);
  return t && typeof t.champs.nom === "string" && t.champs.nom ? t.champs.nom : null;
}

/*
 * Ce que reçoit TOUT joueur : les textes de popups modifiés (les textes d'origine sont déjà dans le jeu) et les empreintes de voix de TOUTES les
 * surcharges (identifiants opaques). Le texte d'une chronique de boss n'est jamais envoyé ici : il arrive avec le boss, seulement quand il est
 * affiché (anti-spoil, AGENTS.md règle n°2).
 */
export function surchargesPourJoueurV1(sql, langue) {
  const textes = lireTextesV1(sql);
  const popups = {};
  const voix = new Set();
  const en = langue === "en";
  for (const t of textes) {
    /* Langue du joueur : en anglais SEULES les surcharges « :en » (renvoyées sous la clé sans suffixe, le jeu ne change pas), sinon seulement les françaises. */
    if (estCleEnV1(t.cle) !== en) continue;
    for (const h of t.voix) voix.add(h);
    const cle = en ? cleSansLangueV1(t.cle) : t.cle;
    /* Entrée supprimée : le joueur reçoit seulement le marqueur (aucun texte, aucune voix) ; il n'y a rien d'autre à savoir. */
    if (t.supprime) { popups[cle] = { champs: {}, parle: {}, voix: [], supprime: true }; continue; }
    if (!IDLE_TEXTE_BOSS_RE_V1.test(cle)) popups[cle] = { champs: t.champs, parle: t.parle, voix: t.voix };
  }
  return { popups, voix: Array.from(voix), entieres: entieresPourJoueurV1(sql, langue) };
}

/*
 * Chroniques « DÉFINITIVES » (Norman, 2026-11-05 : « sur chaque chronique de boss, je veux pouvoir cocher définitive. Une fois fait, les fichiers audio ne sont remis qu'en un seul, avec exactement les mêmes temps d'arrêt que
 * quand on le lit de manière séparée ; ensuite les voix séparées sont supprimées et seule l'entière est conservée »). Table à part, administrateur seulement (comme la validation de la voix).
 * Une ligne par clé (boss:<N> ou boss:<N>:en) : { plans: { avec, sans }, pret, separeesSupprimees }.
 *  - plans.avec / plans.sans : { entier, etapes } -- `entier` = empreinte du fichier ENTIER (calculée par le navigateur sur le texte lu complet, voir tutorial-tts-v202.js entierDe), `etapes` = la liste exacte des blocs
 *    { h: empreinte } et des silences { p: millisecondes } que la lecture séparée joue. Avec = nom du boss lu en tête ; sans = lecteur enchaîné.
 *  - pret : le fichier entier est sur R2 (posé par l'outil cloudflare/tools/fusionner-chroniques-definitives.mjs) ; seul alors le joueur reçoit son empreinte et la lit à la place des blocs.
 *  - separeesSupprimees : les blocs séparés ont été supprimés de R2 (après l'écoute et l'accord de Norman).
 */
const IDLE_DEFINITIVE_VARIANTES_V1 = ["avec", "sans"];
export function assurerDefinitivesV1(sql) {
  sql.exec("CREATE TABLE IF NOT EXISTS idle_voix_definitives(cle TEXT PRIMARY KEY, json TEXT NOT NULL, maj INTEGER NOT NULL)");
}
function nettoyerPlanDefinitiveV1(p) {
  if (!p || typeof p !== "object" || !IDLE_TEXTE_HASH_RE_V1.test(String(p.entier || ""))) return null;
  const etapes = [];
  for (const e of (Array.isArray(p.etapes) ? p.etapes : []).slice(0, 400)) {
    if (e && IDLE_TEXTE_HASH_RE_V1.test(String(e.h || ""))) etapes.push({ h: String(e.h) });
    else if (e && Number.isFinite(Number(e.p)) && Number(e.p) >= 0 && Number(e.p) <= 60000) etapes.push({ p: Math.round(Number(e.p)) });
    else return null;
  }
  return etapes.some((e) => e.h) ? { entier: String(p.entier), etapes } : null;
}
function nettoyerDefinitiveV1(d) {
  const plans = {};
  for (const v of IDLE_DEFINITIVE_VARIANTES_V1) {
    const p = nettoyerPlanDefinitiveV1(d && d.plans && d.plans[v]);
    if (p) plans[v] = p;
  }
  return { plans, pret: Boolean(d && d.pret), separeesSupprimees: Boolean(d && d.separeesSupprimees) };
}
/* { cle: { plans, pret, separeesSupprimees } } */
export function lireDefinitivesV1(sql) {
  assurerDefinitivesV1(sql);
  const out = {};
  for (const r of sqlRows(sql.exec("SELECT cle,json FROM idle_voix_definitives"))) {
    if (!IDLE_TEXTE_CLE_RE_V1.test(String(r.cle))) continue;
    const d = nettoyerDefinitiveV1(safeJson(r.json, null));
    if (Object.keys(d.plans).length) out[String(r.cle)] = d;
  }
  return out;
}
/* Coche (plans fournis) ou décoche (definitive = false) : une nouvelle coche remet « pret » à faux tant que l'outil n'a pas posé les fichiers entiers. */
export function definirDefinitiveV1(sql, cle, definitive, plans, maintenant = Date.now()) {
  const k = String(cle == null ? "" : cle);
  if (!IDLE_TEXTE_CLE_RE_V1.test(k) || !/^boss:\d+(:en)?$/.test(k)) throw new Error("TEXTE_CLE_INVALIDE");
  assurerDefinitivesV1(sql);
  if (!definitive) { sql.exec("DELETE FROM idle_voix_definitives WHERE cle=?", k); return null; }
  const d = nettoyerDefinitiveV1({ plans });
  if (!Object.keys(d.plans).length) throw new Error("TEXTE_DEFINITIVE_PLAN_INVALIDE");
  sql.exec("INSERT OR REPLACE INTO idle_voix_definitives(cle,json,maj) VALUES(?,?,?)", k, JSON.stringify(d), maintenant);
  return d;
}
/* Posé par l'outil de fusion : les fichiers entiers sont sur R2 (pret) et, plus tard, les blocs séparés sont supprimés. Les empreintes `entiers` doivent être exactement celles des plans enregistrés. */
export function marquerDefinitivePreteV1(sql, cle, pret, separeesSupprimees, maintenant = Date.now()) {
  const k = String(cle == null ? "" : cle);
  const d = lireDefinitivesV1(sql)[k];
  if (!d) throw new Error("TEXTE_DEFINITIVE_ABSENTE");
  d.pret = Boolean(pret);
  d.separeesSupprimees = d.pret && Boolean(separeesSupprimees);
  sql.exec("INSERT OR REPLACE INTO idle_voix_definitives(cle,json,maj) VALUES(?,?,?)", k, JSON.stringify(d), maintenant);
  return d;
}
/* Empreintes des fichiers ENTIERS prêts d'une langue : ce que reçoit tout joueur (identifiants opaques, comme les empreintes de voix). */
export function entieresPourJoueurV1(sql, langue) {
  const en = langue === "en";
  const out = [];
  for (const [cle, d] of Object.entries(lireDefinitivesV1(sql))) {
    if (!d.pret || estCleEnV1(cle) !== en) continue;
    for (const v of IDLE_DEFINITIVE_VARIANTES_V1) if (d.plans[v]) out.push(d.plans[v].entier);
  }
  return out;
}
