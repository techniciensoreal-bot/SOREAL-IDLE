/*
 * Le tick du jeu (Norman, 2026-11-05 : « ça doit être exactement la même chose que sur NGU IDLE original »). Wiki NGU Idle, page « Energy », section « Ticks » : le jeu fait 50 mises à jour par seconde, donc une barre de progression
 * gagne AU PLUS UN remplissage par tick, soit 50 remplissages (ou niveaux) par seconde ; page « Advanced Training » : « maximum speed of 50 levels/second once the bars are capped ». Un niveau gagné par une barre dure donc AU MOINS un tick.
 */
export const IDLE_TICK_SECONDS_V1 = 1 / 50;

/*
 * Durée d'un niveau QUANTIFIÉE sur les ticks (lu dans le code du jeu, build 1260, 2026-11-15 : AugmentController::advanceAug, Training, etc.) : la barre gagne `p` par tick, au plus un niveau par tick,
 * et à `progression >= 1` elle repart de 0 SANS report. Un niveau dure donc ceil(1 / p) ticks, c'est-à-dire ceil(durée continue / tick) ticks (au moins un). La tolérance 1e-9 absorbe le bruit des
 * flottants (une durée de 4 ticks calculée 4,0000000001 ne doit pas devenir 5).
 */
export function dureeNiveauEnTicksV1(brut) {
  const b = Number(brut);
  if (b === Infinity) return Infinity;   /* aucune ressource allouée : la barre n'avance pas (comme Math.max(tick, Infinity)) */
  if (!(b > 0) || !Number.isFinite(b)) return IDLE_TICK_SECONDS_V1;
  return Math.max(1, Math.ceil(b / IDLE_TICK_SECONDS_V1 - 1e-9)) * IDLE_TICK_SECONDS_V1;
}

/*
 * Niveaux gagnés par une barre qui fournit `a` unités de travail PAR TICK, le niveau n coûtant n unités (donc ceil(n / a) ticks, au moins un : voir dureeNiveauEnTicksV1). `P` = ticks déjà accumulés sur le niveau
 * en cours, `budget` = ticks disponibles (réel : une fraction de tick reste en progression). Retourne { gained, P }. Le calcul se fait par GROUPES de niveaux qui durent le même nombre de ticks (n dans ]a(m-1), a m]) :
 * le nombre d'itérations est celui des durées distinctes, jamais celui des niveaux (une barre à 50 niveaux par seconde reste instantanée). `maxGain` borne le nombre de niveaux (cible, niveau maximal).
 * Règle du jeu : à la fin d'un niveau la barre repart de 0, sans report.
 */
export function niveauxEnTicksV1(level, P, budget, a, maxGain = Infinity) {
  const L = Math.max(0, Math.floor(Number(level) || 0));
  let ticks = Math.max(0, Number(budget) || 0);
  let progress = Math.max(0, Number(P) || 0);
  const rate = Number(a);
  if (!(rate > 0) || !Number.isFinite(rate) || !(maxGain > 0)) return { gained: 0, P: progress };
  const mDe = (n) => Math.max(1, Math.ceil(n / rate - 1e-9));
  let n = L + 1;
  let gained = 0;
  const besoin = Math.max(0, mDe(n) - progress);
  if (ticks + 1e-9 < besoin) return { gained: 0, P: progress + ticks };
  ticks = Math.max(0, ticks - besoin);
  gained = 1;
  n += 1;
  let garde = 0;
  while (gained < maxGain && garde++ < 5000000) {
    const m = mDe(n);
    const dernier = Math.floor(rate * (m + 1e-9));
    const c = Math.max(1, dernier - n + 1);
    const possibles = Math.floor((ticks + 1e-9) / m);
    const k = Math.min(c, possibles, maxGain - gained);
    if (k >= c) { ticks = Math.max(0, ticks - c * m); gained += c; n += c; continue; }
    ticks = Math.max(0, ticks - k * m); gained += k;
    return { gained, P: gained >= maxGain ? 0 : ticks };
  }
  return { gained, P: gained >= maxGain ? 0 : ticks };
}
