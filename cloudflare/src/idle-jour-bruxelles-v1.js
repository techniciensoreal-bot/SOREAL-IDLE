/*
 * Jour calendaire de Bruxelles (AGENTS.md, « Process » point 0 : le jour de référence du jeu est celui de Bruxelles). UNE seule fonction : elle remplace jourBruxellesV1
 * (idle-daycare-skins-v1.js) et idleLoginCalendarJourParisV1 (idle-login-calendar-v1.js), qui étaient identiques mot pour mot (Paris et Bruxelles ont le même décalage UTC toute l'année,
 * donc le même jour calendaire). Les deux anciens noms restent exportés par leurs fichiers comme alias.
 */
const FUSEAU_BRUXELLES_V1 = "Europe/Brussels";

const formateurBruxellesV1 = (() => {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: FUSEAU_BRUXELLES_V1, year: "numeric", month: "2-digit", day: "2-digit" });
  } catch (_e) {
    return null;
  }
})();

/* { annee, mois (1-12), jour } du jour calendaire de Bruxelles pour un instant (ms) ; l'instant vient du moteur (heure du serveur), jamais de l'horloge de l'appareil. */
export function jourDeBruxellesV1(ms) {
  const t = Number.isFinite(Number(ms)) ? Number(ms) : Date.now();
  if (formateurBruxellesV1) {
    const parts = formateurBruxellesV1.formatToParts(new Date(t));
    const lire = (type) => Number(parts.find((p) => p.type === type)?.value);
    const annee = lire("year");
    const mois = lire("month");
    const jour = lire("day");
    if (annee > 0 && mois > 0 && jour > 0) return { annee, mois, jour };
  }
  /* Repli (environnement sans Intl fuseau) : heure de Bruxelles approchée par UTC+1. */
  const d = new Date(t + 3600000);
  return { annee: d.getUTCFullYear(), mois: d.getUTCMonth() + 1, jour: d.getUTCDate() };
}
