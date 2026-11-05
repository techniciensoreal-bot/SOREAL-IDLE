/*
 * Le tick du jeu (Norman, 2026-11-05 : « ça doit être exactement la même chose que sur NGU IDLE original »). Wiki NGU Idle, page « Energy », section « Ticks » : le jeu fait 50 mises à jour par seconde, donc une barre de progression
 * gagne AU PLUS UN remplissage par tick, soit 50 remplissages (ou niveaux) par seconde ; page « Advanced Training » : « maximum speed of 50 levels/second once the bars are capped ». Un niveau gagné par une barre dure donc AU MOINS un tick.
 */
export const IDLE_TICK_SECONDS_V1 = 1 / 50;
