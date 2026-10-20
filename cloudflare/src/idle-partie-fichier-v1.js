/*
 * Sauvegarde / chargement d'une partie par fichier (Norman, 2026-10-20 : « ajoute la possibilité d'exporter et de charger une partie, pour tout le monde ; la partie reprend EXACTEMENT au moment de la sauvegarde,
 * aucun temps calculé hors ligne entre la sauvegarde et le chargement »).
 *
 * Le fichier contient la ligne du joueur telle que le moteur la détient (les 38 colonnes de la feuille JOUEURS, dont « Stats JSON ») et l'instant du moteur à l'export (`serveurAt`, horloge du serveur).
 * Au chargement :
 *   1. l'IDENTITÉ du compte qui charge est conservée (ID, nom, visibilité, rang, e-mails, date de début) : on ne devient jamais un autre joueur ; ses préférences d'interface (uiPrefs) aussi ;
 *   2. TOUTES les dates de la partie sont décalées de (maintenant − instant de l'export) : une échéance qui tombait dans 3 minutes tombera dans 3 minutes, une barre à 40 % reste à 40 %, aucun temps hors ligne
 *      n'est compté. Sont décalés : les colonnes de dates, les dates ISO écrites en texte et les nombres qui valent un horodatage en millisecondes proche de l'instant de l'export (±2 ans) — sauf les montants
 *      (or, énergie, records…) dont la valeur peut, par hasard, tomber dans cette fenêtre.
 */
export const FORMAT_PARTIE_V1 = "soreal-idle-partie-v1";
export const NB_COLONNES_PARTIE_V1 = 38;
export const COL_DERNIERE_SYNCHRO_PARTIE_V1 = 15;
export const COLS_DATES_PARTIE_V1 = [15, 28, 32, 35];            // Dernière synchro, KO jusqu'à, Dernière action aventure, Date début
export const COLS_IDENTITE_PARTIE_V1 = [0, 1, 16, 17, 18, 19, 35]; // ID, Nom, Public, Rang, e-mails, Date début : toujours celles du compte qui charge
export const COL_STATS_JSON_PARTIE_V1 = 37;
const FENETRE_MS = 2 * 366 * 24 * 3600 * 1000;
const TAILLE_MAX_LIGNE = 1900000; // sous la limite d'une ligne SQLite du serveur (2 Mo)
const RE_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const RE_CLE_TEMPS = /(?:At|Ms|Jusqua|Until|Time|Ts|Date|Depuis|Since|Start|Started|Debut|Expire|Expires|Deadline|Ready|Respawn|Cooldown|Next|Prochain|Last|Dernier|Derniere|Maj)(?:[A-Z_0-9]|$)|^(?:at|t|ts|ms)$/;
const RE_CHEMIN_MONTANT = /(?:currenc|resource|record|gold|energy|energie|magic|magie|power|bars|cap\b|level|niveau|count|kills|total|best|max|allocation|experience|exp\b|ap\b|pp\b|qp\b|points|essence|capacity|capacite|cost|cout|price|prix|value|amount|score|damage|degats|hp\b|pv)/i;

export function creerFichierPartieV1(cells, instantMoteur, extra = {}) {
  return { format: FORMAT_PARTIE_V1, version: 1, exporteLe: new Date(Number(instantMoteur) || Date.now()).toISOString(), serveurAt: Number(instantMoteur) || Date.now(), nom: String(extra.nom || ""), cells: Array.isArray(cells) ? cells.slice() : [] };
}

export function validerFichierPartieV1(f) {
  if (!f || typeof f !== "object" || Array.isArray(f)) return { ok: false, erreur: "FICHIER_ILLISIBLE" };
  if (f.format !== FORMAT_PARTIE_V1) return { ok: false, erreur: "FORMAT_INCONNU" };
  if (!Array.isArray(f.cells) || f.cells.length !== NB_COLONNES_PARTIE_V1) return { ok: false, erreur: "COLONNES_INVALIDES" };
  if (!Number.isFinite(Number(f.serveurAt)) || Number(f.serveurAt) < 1.4e12 || Number(f.serveurAt) > 4.1e12) return { ok: false, erreur: "INSTANT_INVALIDE" };
  const stats = f.cells[COL_STATS_JSON_PARTIE_V1];
  if (typeof stats !== "string" || stats.length < 2 || stats.length > TAILLE_MAX_LIGNE) return { ok: false, erreur: "ETAT_INVALIDE" };
  let o = null;
  try { o = JSON.parse(stats); } catch (_) { return { ok: false, erreur: "ETAT_INVALIDE" }; }
  if (!o || typeof o !== "object" || Array.isArray(o)) return { ok: false, erreur: "ETAT_INVALIDE" };
  let total = 0;
  for (const c of f.cells) { if (typeof c === "string") total += c.length; else if (c !== null && typeof c !== "number" && typeof c !== "boolean") return { ok: false, erreur: "COLONNES_INVALIDES" }; }
  if (total > TAILLE_MAX_LIGNE) return { ok: false, erreur: "FICHIER_TROP_GROS" };
  return { ok: true };
}

function enFenetre(v, instant) { return typeof v === "number" && Number.isFinite(v) && Math.abs(v - instant) <= FENETRE_MS; }

function decalerValeur(v, chemin, cle, instant, delta, compte) {
  if (typeof v === "number") {
    if (enFenetre(v, instant) && (RE_CLE_TEMPS.test(cle) || !RE_CHEMIN_MONTANT.test(chemin))) { compte.n += 1; return v + delta; }
    return v;
  }
  if (typeof v === "string") {
    if (RE_ISO.test(v)) { const ms = Date.parse(v); if (enFenetre(ms, instant)) { compte.n += 1; return new Date(ms + delta).toISOString(); } }
    return v;
  }
  if (Array.isArray(v)) { for (let i = 0; i < v.length; i += 1) v[i] = decalerValeur(v[i], chemin + "[]", cle, instant, delta, compte); return v; }
  if (v && typeof v === "object") { for (const k of Object.keys(v)) v[k] = decalerValeur(v[k], chemin + "." + k, k, instant, delta, compte); return v; }
  return v;
}

/*
 * Ligne importée → ligne à écrire : identité et préférences du compte conservées, dates décalées de `delta` = maintenant − instant de l'export.
 * `courante` : la ligne actuelle du compte (38 colonnes). Retourne { cells, decalees } (decalees = nombre de dates décalées, pour le contrôle).
 */
export function preparerLignePartieV1(courante, fichier, maintenant) {
  const instant = Number(fichier.serveurAt);
  const delta = Number(maintenant) - instant;
  const cells = fichier.cells.map((c) => c);
  const compte = { n: 0 };
  for (let i = 0; i < cells.length; i += 1) {
    const c = cells[i];
    if (typeof c !== "string" || c === "") continue;
    const t = c.trim();
    if (i === COL_STATS_JSON_PARTIE_V1 || t.startsWith("{") || t.startsWith("[")) {
      try { cells[i] = JSON.stringify(decalerValeur(JSON.parse(c), "col" + i, "", instant, delta, compte)); } catch (_) { /* texte laissé tel quel */ }
    } else if (COLS_DATES_PARTIE_V1.includes(i)) {
      const ms = Date.parse(c);
      if (enFenetre(ms, instant)) { cells[i] = new Date(ms + delta).toISOString(); compte.n += 1; }
    }
  }
  /* Identité du compte qui charge (colonnes) */
  for (const i of COLS_IDENTITE_PARTIE_V1) cells[i] = courante && courante[i] !== undefined ? courante[i] : cells[i];
  /* Préférences d'interface du compte : celles de la partie actuelle, jamais celles du fichier. */
  try {
    const nouv = JSON.parse(cells[COL_STATS_JSON_PARTIE_V1]);
    let anc = null;
    try { anc = courante && courante[COL_STATS_JSON_PARTIE_V1] ? JSON.parse(courante[COL_STATS_JSON_PARTIE_V1]) : null; } catch (_) { anc = null; }
    const prefs = anc && anc.metaNgu && anc.metaNgu.uiPrefs ? anc.metaNgu.uiPrefs : null;
    if (nouv && nouv.metaNgu) { if (prefs) nouv.metaNgu.uiPrefs = prefs; else delete nouv.metaNgu.uiPrefs; }
    cells[COL_STATS_JSON_PARTIE_V1] = JSON.stringify(nouv);
  } catch (_) { /* inchangé */ }
  /* Dernière synchro = maintenant : aucun temps hors ligne ne sera compté à la première opération. */
  cells[COL_DERNIERE_SYNCHRO_PARTIE_V1] = new Date(Number(maintenant)).toISOString();
  return { cells, decalees: compte.n, delta };
}
