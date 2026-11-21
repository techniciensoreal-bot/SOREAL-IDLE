/*
 * « En direct » ne montre QUE ce que le joueur fait lui-même (Norman, 2026-11-21 : « quand une chose se fait automatiquement, un nuke automatique, un sort de Blood Magic qui se lance tout seul, ça ne doit pas apparaître dans En direct »).
 * Tout code qui agit AUTOMATIQUEMENT (Auto Boost, Auto Merge, Auto-Kill des Titans…) s'exécute dans fluxMuetV1(() => …) : pendant ce temps, les compteurs de l'« En direct » (boosts, transformations, combats de titan) ne bougent pas.
 * Module sans dépendance (importé par le moteur d'Aventure et par l'automatisation de l'inventaire sans cycle).
 */
let profondeur = 0;
export function fluxMuetActifV1() { return profondeur > 0; }
export function fluxMuetV1(fn) {
  profondeur += 1;
  try { return fn(); } finally { profondeur -= 1; }
}
