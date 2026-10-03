/*
 * Calendrier de connexion du Money Pit (Norman, 2026-10-03) : « Quand tu te connectes, tous les jours, tu as des récompenses. Plus tu enchaînes les jours, mieux les récompenses sont. Si tu
 * rates un jour, la progression reprend à 0. Ça doit être des récompenses en AP (pour combler le fait qu'on puisse acheter de l'AP avec du vrai argent dans NGU IDLE). Les récompenses durent
 * 1 mois complet (le nombre de cases varie suivant le mois), le total doit être de 150 000 AP par mois, en tranches de plus en plus grosses ; le dernier jour du mois doit être beaucoup plus
 * élevé que le jour précédent. »
 *
 * Fonctionnalité SOREAL originale (absente du wiki NGU Idle) : toutes les valeurs viennent directement de Norman. Les AP versés ne passent PAS par le bonus d'AP (comme le « Special Prize » : un
 * total mensuel fixe de 150 000 AP).
 *
 * Règles :
 *  - Le « jour » est le jour calendaire de Paris (Europe/Paris), jamais l'horloge du téléphone : le serveur est la seule référence.
 *  - Le plateau du mois a autant de cases que le mois a de jours (28 à 31) ; la case n° k rapporte la k-ième somme du barème du mois.
 *  - Une récompense par jour. Réclamer le lendemain d'une récompense prolonge la série (case suivante) ; rater un jour la remet à 0 (retour à la case 1) ; un nouveau mois repart aussi de la case 1.
 *  - Série ininterrompue depuis le 1er du mois : la dernière case (jour du mois) est atteinte.
 */

export const IDLE_LOGIN_CALENDAR_TOTAL_AP_V1 = 150000;
/* Part de la dernière case dans le total du mois : « beaucoup plus élevée que la veille ». */
const PART_DERNIERE_CASE_V1 = 0.2;
/* Les sommes sont arrondies à la dizaine d'AP (la dernière case absorbe le reste pour que le total soit EXACTEMENT 150 000). */
const ARRONDI_V1 = 10;
const FUSEAU_V1 = "Europe/Paris";

const formateurJourV1 = (() => {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: FUSEAU_V1, year: "numeric", month: "2-digit", day: "2-digit" });
  } catch (_e) {
    return null;
  }
})();

/* { annee, mois (1-12), jour } du jour calendaire de Paris pour un instant donné (ms). */
export function idleLoginCalendarJourParisV1(ms) {
  const t = Number.isFinite(Number(ms)) ? Number(ms) : Date.now();
  if (formateurJourV1) {
    const parts = formateurJourV1.formatToParts(new Date(t));
    const lire = (type) => Number(parts.find((p) => p.type === type)?.value);
    const annee = lire("year");
    const mois = lire("month");
    const jour = lire("day");
    if (annee > 0 && mois > 0 && jour > 0) return { annee, mois, jour };
  }
  /* Repli (environnement sans Intl fuseau) : heure de Paris approchée par UTC+1. */
  const d = new Date(t + 3600000);
  return { annee: d.getUTCFullYear(), mois: d.getUTCMonth() + 1, jour: d.getUTCDate() };
}

const deux = (n) => String(n).padStart(2, "0");
export const idleLoginCalendarCleJourV1 = (p) => `${p.annee}-${deux(p.mois)}-${deux(p.jour)}`;
export const idleLoginCalendarCleMoisV1 = (p) => `${p.annee}-${deux(p.mois)}`;
export const idleLoginCalendarJoursDuMoisV1 = (annee, mois) => new Date(Date.UTC(annee, mois, 0)).getUTCDate();

function veilleV1(p) {
  const d = new Date(Date.UTC(p.annee, p.mois - 1, p.jour - 1));
  return { annee: d.getUTCFullYear(), mois: d.getUTCMonth() + 1, jour: d.getUTCDate() };
}

/*
 * Barème d'un mois de `jours` cases : somme EXACTE de 150 000 AP, croissant d'une case à l'autre, dernière case = 20 % du total (bien au-dessus de la veille).
 * Les jours 1 à jours-1 se partagent les 80 % restants proportionnellement à (rang + 4) : la première case n'est jamais dérisoire, la progression est régulière.
 */
export function idleLoginCalendarBaremeV1(jours) {
  const n = Math.max(2, Math.min(31, Math.floor(Number(jours) || 30)));
  const derniere = Math.round((IDLE_LOGIN_CALENDAR_TOTAL_AP_V1 * PART_DERNIERE_CASE_V1) / ARRONDI_V1) * ARRONDI_V1;
  const reste = IDLE_LOGIN_CALENDAR_TOTAL_AP_V1 - derniere;
  const poids = Array.from({ length: n - 1 }, (_v, i) => i + 1 + 4);
  const somme = poids.reduce((a, b) => a + b, 0);
  const sommes = poids.map((w) => Math.round(((reste * w) / somme) / ARRONDI_V1) * ARRONDI_V1);
  /* L'arrondi laisse quelques dizaines d'AP d'écart : on le reporte sur la dernière case du « corps » du barème pour rester exact sans rien casser de la progression. */
  const ecart = reste - sommes.reduce((a, b) => a + b, 0);
  sommes[sommes.length - 1] += ecart;
  return sommes.concat(derniere);
}

/* Série effective à l'instant `maintenant` : tient compte du mois courant, de la veille et d'un jour raté. */
function etatEffectifV1(rec, maintenant) {
  const aujourdhui = idleLoginCalendarJourParisV1(maintenant);
  const cleJour = idleLoginCalendarCleJourV1(aujourdhui);
  const cleMois = idleLoginCalendarCleMoisV1(aujourdhui);
  const jours = idleLoginCalendarJoursDuMoisV1(aujourdhui.annee, aujourdhui.mois);
  const src = rec && typeof rec === "object" ? rec : {};
  let serie = Math.max(0, Math.min(jours, Math.floor(Number(src.serie) || 0)));
  const dernierJour = String(src.dernierJour || "");
  const dejaAujourdhui = dernierJour === cleJour;
  if (String(src.mois || "") !== cleMois) serie = 0; /* nouveau mois : nouveau plateau */
  else if (!dejaAujourdhui && dernierJour !== idleLoginCalendarCleJourV1(veilleV1(aujourdhui))) serie = 0; /* un jour raté : retour à la case 1 */
  return { aujourdhui, cleJour, cleMois, jours, serie, dejaAujourdhui };
}

/* Vue envoyée au client (jamais de donnée personnelle : que le plateau et la série). */
export function idleLoginCalendarSnapshotV1(rec, maintenant) {
  const e = etatEffectifV1(rec, maintenant);
  const bareme = idleLoginCalendarBaremeV1(e.jours);
  return {
    mois: e.cleMois,
    annee: e.aujourdhui.annee,
    moisNumero: e.aujourdhui.mois,
    jours: e.jours,
    bareme,
    totalMois: IDLE_LOGIN_CALENDAR_TOTAL_AP_V1,
    serie: e.serie,
    /* Cases allumées = série ; prochaine case à réclamer = série + 1 (si possible aujourd'hui). */
    reclamable: !e.dejaAujourdhui && e.serie < e.jours,
    dejaReclameAujourdhui: e.dejaAujourdhui,
    prochainAp: e.serie < e.jours ? bareme[e.serie] : 0,
    jourParis: e.cleJour
  };
}

/* Réclame la récompense du jour. Retourne { ap, case, serie, jours } ; lève une erreur si déjà réclamée aujourd'hui ou si le plateau est terminé. */
export function idleLoginCalendarReclamerV1(state, maintenant) {
  const e = etatEffectifV1(state.records.loginCalendar, maintenant);
  if (e.dejaAujourdhui) throw new Error("CALENDRIER_DEJA_RECLAME");
  if (e.serie >= e.jours) throw new Error("CALENDRIER_TERMINE");
  const bareme = idleLoginCalendarBaremeV1(e.jours);
  const ap = bareme[e.serie];
  const serie = e.serie + 1;
  state.currencies.ap = Math.max(0, Number(state.currencies.ap) || 0) + ap;
  const avant = state.records.loginCalendar && typeof state.records.loginCalendar === "object" ? state.records.loginCalendar : {};
  state.records.loginCalendar = {
    mois: e.cleMois,
    serie,
    dernierJour: e.cleJour,
    totalReclames: Math.max(0, Math.floor(Number(avant.totalReclames) || 0)) + 1,
    totalAp: Math.max(0, Math.floor(Number(avant.totalAp) || 0)) + ap
  };
  return { ap, case: serie, serie, jours: e.jours };
}

/* Assainit la sauvegarde (jamais de valeur étrangère) ; absent ou invalide : plateau vierge. */
export function idleLoginCalendarNormaliserV1(rec) {
  const src = rec && typeof rec === "object" && !Array.isArray(rec) ? rec : {};
  const entier = (v) => Math.max(0, Math.floor(Number(v) || 0));
  return {
    mois: /^\d{4}-\d{2}$/.test(String(src.mois || "")) ? String(src.mois) : "",
    serie: Math.min(31, entier(src.serie)),
    dernierJour: /^\d{4}-\d{2}-\d{2}$/.test(String(src.dernierJour || "")) ? String(src.dernierJour) : "",
    totalReclames: entier(src.totalReclames),
    totalAp: entier(src.totalAp)
  };
}
