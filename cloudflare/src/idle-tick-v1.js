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
