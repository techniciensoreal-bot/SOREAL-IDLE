/*
 * Contenu de la production pour les applications HORS LIGNE (APK Android, exe Windows) (Norman, 2026-10-30 : « ce ne sont pas les bonnes voix du narrateur et des histoires, ce sont les anciennes »).
 *
 * Cause : ces applications gardent leur propre base. Les feuilles de catalogue n'y étaient semées qu'à la PREMIÈRE ouverture, et les textes modifiés par l'administrateur (table idle_textes : chroniques de boss, popups, liste des
 * empreintes de voix) et les histoires (table idle_histoires) n'y étaient jamais copiés : l'application gardait donc les textes et les voix d'origine, sans jamais les mettre à jour.
 *
 * Ici : la « graine » ({ feuilles, textes, histoires, exporteLe }, rangée par desktop/recolter.mjs --catalogue) est RE-APPLIQUÉE à chaque démarrage où son empreinte diffère de celle déjà appliquée (idle_meta « graine_empreinte »).
 * Ne touche JAMAIS : la feuille JOUEURS (la partie du joueur), ni CLASSEMENT, ni les sessions, profils, flux ou sauvegardes. Garde-fou : une graine absente, illisible ou incomplète n'écrase rien ; l'écriture est atomique
 * (SAVEPOINT) : au moindre échec tout est défait. Sans progression perdue possible : seules des feuilles de catalogue et des tables de textes sont remplacées.
 */
import { assurerTextesV1, invaliderCacheTextesBossV1 } from "./idle-textes-v1.js";
import { assurerHistoiresV1 } from "./idle-histoires-v1.js";

export const IDLE_GRAINE_META_V1 = "graine_empreinte";
const FEUILLES_EXCLUES = new Set(["JOUEURS", "CLASSEMENT"]);
const FEUILLES_REQUISES = ["CONFIG", "IDLE_BOSS"];

/* Empreinte FNV-1a sur deux voies (pas de crypto asynchrone : le démarrage reste synchrone). */
export function empreinteGraineV1(graine) {
  const texte = JSON.stringify(graine);
  let a = 0x811c9dc5, b = 0x01000193 ^ texte.length;
  for (let i = 0; i < texte.length; i += 1) {
    const c = texte.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193);
    b = Math.imul(b ^ c ^ (a >>> 7), 0x85ebca6b);
  }
  return (a >>> 0).toString(16).padStart(8, "0") + (b >>> 0).toString(16).padStart(8, "0") + "-" + texte.length.toString(16);
}

/* Une graine utilisable : des feuilles de catalogue bien formées (dont les feuilles indispensables). Les textes et les histoires sont facultatifs mais, s'ils sont présents, doivent être bien formés. */
export function graineValideV1(graine) {
  if (!graine || typeof graine !== "object" || !Array.isArray(graine.feuilles)) return false;
  const feuilles = graine.feuilles.filter((f) => Array.isArray(f) && typeof f[0] === "string" && !FEUILLES_EXCLUES.has(f[0]));
  if (!feuilles.length || !feuilles.every((f) => typeof f[2] === "string")) return false;
  const noms = new Set(feuilles.map((f) => f[0]));
  if (!FEUILLES_REQUISES.every((n) => noms.has(n))) return false;
  if (graine.textes !== undefined && !(Array.isArray(graine.textes) && graine.textes.every((t) => Array.isArray(t) && typeof t[0] === "string" && typeof t[1] === "string"))) return false;
  if (graine.histoires !== undefined && !(Array.isArray(graine.histoires) && graine.histoires.every((h) => h && typeof h === "object" && typeof h.id === "string" && h.id))) return false;
  return true;
}

function metaLire(sql) {
  try {
    const r = sql.exec("SELECT meta_value AS v FROM idle_meta WHERE meta_key=?", IDLE_GRAINE_META_V1)[0];
    return r ? String(r.v) : "";
  } catch (_e) { return ""; }
}

/*
 * Applique la graine si elle est valide et différente de celle déjà appliquée. Renvoie { applique, raison, empreinte }.
 * Ne lance jamais d'exception : en cas d'erreur la base est remise comme avant (SAVEPOINT).
 */
export function appliquerGraineContenuV1(sql, graine, maintenant = Date.now()) {
  if (!graineValideV1(graine)) return { applique: false, raison: "GRAINE_ABSENTE_OU_INVALIDE" };
  const empreinte = empreinteGraineV1(graine);
  if (metaLire(sql) === empreinte) return { applique: false, raison: "A_JOUR", empreinte };
  try {
    sql.exec("SAVEPOINT graine_contenu_v1");
    try {
      /* Catalogue : toutes les feuilles de la graine remplacent celles de la base, SAUF JOUEURS et CLASSEMENT. Les feuilles de la base absentes de la graine (rien de tel en pratique) sont laissées telles quelles. */
      const feuilles = graine.feuilles.filter((f) => Array.isArray(f) && typeof f[0] === "string" && !FEUILLES_EXCLUES.has(f[0]));
      for (const nom of new Set(feuilles.map((f) => f[0]))) sql.exec("DELETE FROM idle_catalog WHERE sheet_name=?", nom);
      for (const f of feuilles) sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", f[0], Number(f[1]) || 1, f[2], maintenant);
      /* Textes (chroniques, popups, empreintes de voix) : la table est REMPLACÉE par celle de la production, comme le fait le moteur local de la page à chaque export. */
      if (Array.isArray(graine.textes)) {
        assurerTextesV1(sql);
        sql.exec("DELETE FROM idle_textes");
        for (const t of graine.textes) sql.exec("INSERT OR REPLACE INTO idle_textes(cle,json,maj) VALUES(?,?,?)", String(t[0]), String(t[1]), Number(t[2]) || 0);
        invaliderCacheTextesBossV1();
      }
      /* Histoires : remplacées par celles de la production (assurerHistoiresV1 d'abord : il pose ses drapeaux de semence pour ne rien réinsérer ensuite). Une liste vide n'efface rien. */
      if (Array.isArray(graine.histoires) && graine.histoires.length) {
        assurerHistoiresV1(sql);
        sql.exec("DELETE FROM idle_histoires");
        for (const h of graine.histoires) {
          const { maj, ...corps } = h;
          sql.exec("INSERT OR REPLACE INTO idle_histoires(id,json,maj) VALUES(?,?,?)", h.id, JSON.stringify(corps), Number(maj) || maintenant);
        }
      }
      sql.exec("INSERT INTO idle_meta(meta_key,meta_value) VALUES(?,?) ON CONFLICT(meta_key) DO UPDATE SET meta_value=excluded.meta_value", IDLE_GRAINE_META_V1, empreinte);
      sql.exec("RELEASE graine_contenu_v1");
    } catch (e) {
      try { sql.exec("ROLLBACK TO graine_contenu_v1"); sql.exec("RELEASE graine_contenu_v1"); } catch (_e) { /* déjà défait */ }
      return { applique: false, raison: "ECHEC:" + String((e && e.message) || e), empreinte };
    }
  } catch (e) {
    return { applique: false, raison: "ECHEC:" + String((e && e.message) || e), empreinte };
  }
  return { applique: true, raison: "APPLIQUEE", empreinte };
}
