import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * 2026-09-24 (Norman) : « Quand on bat un boss, bien souvent, l'écran reste bloqué sur "Boss vaincu" ; il faut changer d'écran
 * et revenir pour voir le nouveau boss. » Le client prédit la victoire ; si la synchronisation forcée unique ne revient pas
 * « vaincu » (le serveur fait foi et n'a pas encore tué le boss), l'état local était gardé sans nouvelle tentative.
 * Contrôles du source (soreal-idle-ui.js).
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// La surveillance démarre juste après la synchronisation forcée de la victoire.
assert.match(ui, /transitionMortBossIdleV61_\(\);\s*const synchroniserVictoire=function\(\)\{\s*synchroniserJeuIdleV7_\(true\);\s*surveillerConfirmationVictoireBossIdleV1_\(\);\s*\};/);
// Norman (2026-09-26) : les allocations d'entraînement en attente partent avant la synchronisation (sinon le serveur calcule avec d'anciennes stats)
assert.ok(ui.includes("if(idleBasicTrainingDirtyV120||idleBasicTrainingSaveBusyV120){") && ui.includes("attendreEnvoi"));

const debut = ui.indexOf("function arreterSurveillanceVictoireBossIdleV1_()");
const fin = ui.indexOf("function metaTickEnergieIdleV114_()");
const bloc = ui.slice(debut, fin);
assert.ok(debut > 0 && fin > debut);
// Relance forcée toutes les 1,2 s tant que le drapeau de victoire locale est levé.
assert.match(bloc, /setInterval\(function\(\)\{[\s\S]*synchroniserJeuIdleV7_\(true\);\s*\},1200\)/);
// S'arrête quand le rendu remet le drapeau à zéro, quand on quitte IDLE ou qu'il n'y a plus d'état.
assert.match(bloc, /PAGE_ACTIVE!=='idle'\|\|!idleEtat\|\|!idleVictoireBossLocaleV49/);
// Au bout de 15 s : abandon de la prédiction, rechargement complet de l'état serveur et rendu.
assert.match(bloc, /Date\.now\(\)-debut>15000/);
assert.match(bloc, /\.obtenirEtatSorealIdle\(SOREAL_SESSION\)/);
assert.match(bloc, /rendreIdleEtat_\(\{ok:true,joueur:etat\.joueur\}\)/);

// Le rendu complet remet toujours le drapeau à zéro (ce qui arrête la surveillance).
assert.match(ui, /pousserEtatVersRuntimePartageIdleV1_\(\);\s*idleVictoireBossLocaleV49=false;/);

console.log("idle-boss-victory-watchdog-v1: OK");
