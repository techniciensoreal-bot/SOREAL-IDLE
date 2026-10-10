/*
 * Calendrier de connexion du Money Pit (Norman, 2026-10-03) : « Quand tu te connectes, tous les jours, tu as des récompenses. Plus tu enchaînes les jours, mieux les récompenses sont. Ça doit être des
 * récompenses en AP (pour combler le fait qu'on puisse acheter de l'AP avec du vrai argent dans NGU IDLE). Les récompenses durent 1 mois complet (le nombre de cases varie suivant le mois), le total doit être
 * de 150 000 AP par mois, en tranches de plus en plus grosses ; le dernier jour du mois doit être beaucoup plus élevé que le jour précédent. »
 *
 * Fonctionnalité SOREAL originale (absente du wiki NGU Idle) : toutes les valeurs viennent directement de Norman. Les AP versés ne passent PAS par le bonus d'AP (comme le « Special Prize » : un
 * total mensuel fixe de 150 000 AP).
 *
 * Règles (révisées le 2026-10-10, demande de Norman : « un jour raté ne remet plus à 1, ça n'a pas de sens vu que c'est un mois ») :
 *  - Le « jour » est le jour calendaire de Paris (Europe/Paris), jamais l'horloge du téléphone : le serveur est la seule référence.
 *  - Le plateau du mois a autant de cases que le mois a de jours (28 à 31) ; la case n° k est celle du k-ième jour du mois et rapporte la k-ième somme du barème. Une récompense par jour, réclamable ce jour-là seulement.
 *  - Une case dont le jour est passé sans avoir été réclamée est « ratée » : grisée, définitivement perdue. Elle ne remet RIEN à zéro.
 *  - Chaque jour raté retire 10 % aux récompenses RESTANTES (dernier lot compris), de façon cumulée : 1000 devient 900, un 2e jour raté retire 10 % de 900 (810), etc. Les jours ratés ne comptent qu'à partir du
 *    premier jour de participation du joueur dans le mois (un joueur qui arrive le 15 n'est pas puni pour les jours 1 à 14 ; un joueur qui avait déjà participé les mois précédents est compté dès le 1er).
 *  - Exception du PREMIER mois (octobre 2026, pour remercier les joueurs) : aucune pénalité ; le joueur qui a raté un jour depuis sa dernière connexion en est remercié par une fenêtre à la connexion (voir `merci`
 *    dans le résultat de la réclamation et `offert` dans la vue).
 *  - Un mois complet sans aucun jour raté rapporte exactement 150 000 AP.
 */

export const IDLE_LOGIN_CALENDAR_TOTAL_AP_V1 = 150000;
/* Part de la dernière case dans le total du mois : « beaucoup plus élevée que la veille ». */
const PART_DERNIERE_CASE_V1 = 0.2;
/* Les sommes sont arrondies à la dizaine d'AP (la dernière case absorbe le reste pour que le total soit EXACTEMENT 150 000). */
const ARRONDI_V1 = 10;
const FUSEAU_V1 = "Europe/Paris";
/* Pénalité par jour raté sur les récompenses restantes (Norman, 2026-10-10 : 10 %, cumulée). */
export const IDLE_LOGIN_CALENDAR_PENALITE_V1 = 0.1;
/* Premier mois offert : aucune pénalité, un simple remerciement (Norman, 2026-10-10). */
export const IDLE_LOGIN_CALENDAR_MOIS_OFFERT_V1 = "2026-10";

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

const jourDuMoisDeCleV1 = (cle) => Number(String(cle).slice(8, 10)) || 0;
/* Nombre de jours entre deux clés « AAAA-MM-JJ » (b - a). */
const ecartJoursV1 = (a, b) =>
  Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 86400000);
/* Somme arrondie à la dizaine d'AP, comme le barème. */
const arrondiApV1 = (v) => Math.max(0, Math.round(v / ARRONDI_V1) * ARRONDI_V1);

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

/*
 * Octroi de lancement (Norman, 2026-10-03) : « pour la récompense d'octobre, octroie à tous les joueurs les jours 1 et 2 ». Pour OCTOBRE 2026 seulement, chaque joueur qui voit le calendrier (Money Pit découvert)
 * reçoit une seule fois les cases 1 et 2 (si leur jour est passé et qu'elles n'ont pas déjà été prises) ; la case du jour se réclame normalement.
 */
export const IDLE_LOGIN_CALENDAR_OCTROI_V1 = Object.freeze({ mois: "2026-10", cases: 2 });

/*
 * État du mois à l'instant `maintenant` : cases réclamées, cases ratées (jours passés non réclamés), jours ratés qui comptent (pénalité) et récompense de chaque case. Les anciennes sauvegardes (série + dernier
 * jour) sont converties : les `serie` derniers jours consécutifs jusqu'au dernier jour réclamé, plus les cases 1 et 2 d'octobre 2026 pour qui en avait reçu l'octroi.
 */
function etatEffectifV1(rec, maintenant) {
  const aujourdhui = idleLoginCalendarJourParisV1(maintenant);
  const cleJour = idleLoginCalendarCleJourV1(aujourdhui);
  const cleMois = idleLoginCalendarCleMoisV1(aujourdhui);
  const jours = idleLoginCalendarJoursDuMoisV1(aujourdhui.annee, aujourdhui.mois);
  const src = idleLoginCalendarNormaliserV1(rec);
  let reclamees = [];
  let debut = 0;
  if (src.mois === cleMois) {
    if (src.cases.length) {
      reclamees = src.cases.filter((d) => d >= 1 && d <= jours);
    } else if (src.serie > 0 && src.dernierJour.slice(0, 7) === cleMois) {
      const fin = jourDuMoisDeCleV1(src.dernierJour);
      for (let d = Math.max(1, fin - src.serie + 1); d <= fin; d += 1) reclamees.push(d);
    }
    /* Anciennes sauvegardes seulement (sans liste de cases) : celles qui avaient reçu l'octroi d'octobre ont pris les cases 1 et 2. */
    if (!src.cases.length && src.octroi === cleMois && cleMois === IDLE_LOGIN_CALENDAR_OCTROI_V1.mois) {
      for (let d = 1; d <= IDLE_LOGIN_CALENDAR_OCTROI_V1.cases; d += 1) if (d < aujourdhui.jour) reclamees.push(d);
    }
    reclamees = [...new Set(reclamees)].sort((x, y) => x - y);
    debut = src.debut > 0 ? Math.min(src.debut, jours) : reclamees.length ? reclamees[0] : 0;
  }
  const dejaAujourdhui = reclamees.includes(aujourdhui.jour);
  /* Premier jour qui compte pour la pénalité : le début de participation dans le mois ; sans participation ce mois-ci, le 1er pour qui avait déjà participé avant, sinon aujourd'hui (aucun jour raté). */
  const aDejaJoue = src.totalReclames > 0 || src.octroi !== "";
  const premier = debut > 0 ? debut : aDejaJoue && src.mois !== cleMois ? 1 : aujourdhui.jour;
  const ratees = [];
  const comptees = [];
  for (let d = 1; d < aujourdhui.jour; d += 1) {
    if (reclamees.includes(d)) continue;
    ratees.push(d);
    if (d >= premier) comptees.push(d);
  }
  const offert = cleMois === IDLE_LOGIN_CALENDAR_MOIS_OFFERT_V1;
  const nominal = idleLoginCalendarBaremeV1(jours);
  /* Récompense de la case d : barème × 0,9 par jour raté qui compte et qui PRÉCÈDE cette case ; pour une case à venir, tous les jours ratés jusqu'ici. */
  const recompenses = nominal.map((ap, i) => {
    const d = i + 1;
    if (offert) return ap;
    const avant = comptees.filter((x) => x < d).length;
    return arrondiApV1(ap * Math.pow(1 - IDLE_LOGIN_CALENDAR_PENALITE_V1, avant));
  });
  return { aujourdhui, cleJour, cleMois, jours, reclamees, ratees, comptees, debut, premier, dejaAujourdhui, offert, recompenses, nominal };
}

/* Vue envoyée au client (jamais de donnée personnelle : que le plateau et ce qui a été pris ou raté). */
export function idleLoginCalendarSnapshotV1(rec, maintenant) {
  const e = etatEffectifV1(rec, maintenant);
  const cumul = idleLoginCalendarNormaliserV1(rec);
  const penalites = e.offert ? 0 : e.comptees.length;
  const prochainJour = e.dejaAujourdhui ? e.aujourdhui.jour + 1 : e.aujourdhui.jour;
  return {
    mois: e.cleMois,
    annee: e.aujourdhui.annee,
    moisNumero: e.aujourdhui.mois,
    jours: e.jours,
    /* Récompense de chaque case, déjà réduite par les jours ratés. */
    bareme: e.recompenses,
    totalMois: IDLE_LOGIN_CALENDAR_TOTAL_AP_V1,
    jourDuMois: e.aujourdhui.jour,
    reclamees: e.reclamees,
    ratees: e.ratees,
    joursRates: penalites,
    /* 1 = aucune pénalité ; 0,9 après un jour raté, 0,81 après deux… */
    multiplicateur: Math.round(Math.pow(1 - IDLE_LOGIN_CALENDAR_PENALITE_V1, penalites) * 10000) / 10000,
    offert: e.offert,
    /* Nombre de cases prises ce mois-ci (ancien nom : série). */
    serie: e.reclamees.length,
    /* Depuis le début des récompenses de connexion (Norman, 2026-10-03) : total d'AP obtenus et nombre de récupérations (l'octroi de lancement compte dans les AP). */
    totalAp: cumul.totalAp,
    totalReclames: cumul.totalReclames,
    reclamable: !e.dejaAujourdhui && e.aujourdhui.jour <= e.jours,
    dejaReclameAujourdhui: e.dejaAujourdhui,
    prochainAp: prochainJour <= e.jours ? e.recompenses[prochainJour - 1] : 0,
    jourParis: e.cleJour
  };
}

/* Réclame la récompense du jour. Retourne { ap, case, serie, jours, manques, ratesDepuisConnexion, merci, reduction } ; lève une erreur si déjà réclamée aujourd'hui. */
export function idleLoginCalendarReclamerV1(state, maintenant) {
  const e = etatEffectifV1(state.records.loginCalendar, maintenant);
  if (e.dejaAujourdhui) throw new Error("CALENDRIER_DEJA_RECLAME");
  const jour = e.aujourdhui.jour;
  const ap = e.recompenses[jour - 1];
  state.currencies.ap = Math.max(0, Number(state.currencies.ap) || 0) + ap;
  const avant = idleLoginCalendarNormaliserV1(state.records.loginCalendar);
  /* Jours ratés depuis la dernière connexion (la dernière récompense réclamée) : sert au remerciement du premier mois et à l'information de pénalité. */
  const ecart = avant.dernierJour && avant.totalReclames > 0 ? Math.max(0, ecartJoursV1(avant.dernierJour, e.cleJour) - 1) : 0;
  const cases = [...new Set([...e.reclamees, jour])].sort((x, y) => x - y);
  state.records.loginCalendar = {
    mois: e.cleMois,
    cases,
    debut: e.debut > 0 ? e.debut : e.premier,
    serie: cases.length,
    dernierJour: e.cleJour,
    totalReclames: avant.totalReclames + 1,
    totalAp: avant.totalAp + ap,
    octroi: avant.octroi
  };
  const manques = e.offert ? 0 : e.comptees.length;
  return {
    ap,
    case: jour,
    serie: cases.length,
    jours: e.jours,
    manques,
    ratesDepuisConnexion: ecart,
    /* Premier mois : un jour raté depuis la dernière connexion = remerciement (la totalité est conservée). */
    merci: e.offert && ecart > 0,
    reduction: e.offert ? 0 : Math.round((1 - Math.pow(1 - IDLE_LOGIN_CALENDAR_PENALITE_V1, manques)) * 100)
  };
}

/* Assainit la sauvegarde (jamais de valeur étrangère) ; absent ou invalide : plateau vierge. */
export function idleLoginCalendarNormaliserV1(rec) {
  const src = rec && typeof rec === "object" && !Array.isArray(rec) ? rec : {};
  const entier = (v) => Math.max(0, Math.floor(Number(v) || 0));
  const cases = Array.isArray(src.cases) ? [...new Set(src.cases.map((v) => entier(v)).filter((v) => v >= 1 && v <= 31))].sort((x, y) => x - y) : [];
  return {
    mois: /^\d{4}-\d{2}$/.test(String(src.mois || "")) ? String(src.mois) : "",
    cases,
    debut: Math.min(31, entier(src.debut)),
    serie: Math.min(31, entier(src.serie)),
    dernierJour: /^\d{4}-\d{2}-\d{2}$/.test(String(src.dernierJour || "")) ? String(src.dernierJour) : "",
    totalReclames: entier(src.totalReclames),
    totalAp: entier(src.totalAp),
    octroi: /^\d{4}-\d{2}$/.test(String(src.octroi || "")) ? String(src.octroi) : ""
  };
}

export function idleLoginCalendarOctroiV1(state, maintenant) {
  const e = etatEffectifV1(state.records.loginCalendar, maintenant);
  if (e.cleMois !== IDLE_LOGIN_CALENDAR_OCTROI_V1.mois) return 0;
  const rec = idleLoginCalendarNormaliserV1(state.records.loginCalendar);
  if (rec.octroi === IDLE_LOGIN_CALENDAR_OCTROI_V1.mois) return 0;
  /* Cases 1 et 2 d'octobre : offertes une seule fois, seulement si leur jour est passé et si elles n'ont pas déjà été prises ; la case du jour se réclame normalement. */
  const cible = Math.min(e.jours, IDLE_LOGIN_CALENDAR_OCTROI_V1.cases);
  let credit = 0;
  const cases = new Set(e.reclamees);
  /* Un joueur déjà bien avancé (au moins autant de cases prises que l'octroi) ne reçoit rien. */
  const avance = e.reclamees.length >= cible;
  for (let d = 1; d <= cible && !avance; d += 1) {
    if (cases.has(d) || d >= e.aujourdhui.jour) continue;
    credit += e.nominal[d - 1];
    cases.add(d);
  }
  if (credit > 0) {
    state.currencies.ap = Math.max(0, Number(state.currencies.ap) || 0) + credit;
    rec.totalAp += credit;
  }
  rec.mois = e.cleMois;
  rec.cases = [...cases].sort((x, y) => x - y);
  rec.serie = rec.cases.length;
  rec.octroi = IDLE_LOGIN_CALENDAR_OCTROI_V1.mois;
  state.records.loginCalendar = rec;
  return credit;
}
