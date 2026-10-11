import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
/*
 * Audit des menus « en temps réel » (Norman, 2026-10-11) : « la barre qui tique de plus en plus vite dans la Machine à remonter le temps ne se met pas à jour en temps réel : il faut changer de menu et revenir. Assure-toi que
 * chaque menu est actif en temps réel quand on s'y trouve. »
 * Chaque menu dont les chiffres évoluent sans action du joueur a un mécanisme de mise à jour :
 *   - synchro toutes les 4 s + redessin de la page : NGU, Wandoos, Yggdrasil, Mineurs, Barbes, Souhaits, Hacks, Garderie (IDLE_MENUS_VIVANTS_V1) ;
 *   - synchro toutes les 4 s + mise à jour EN PLACE (sans redessin, donc sans retour en arrière) : ITOPOD et Machine temporelle ;
 *   - rejeu local des niveaux et de l'Or + adoption de la réponse du serveur : Augmentations, Entraînement de base, rituels de sang, Entraînement avancé ;
 *   - pages sans chiffre qui bouge d'elles-mêmes (boutique, chroniques, réglages, administration) : rien à faire.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const vivants = ui.match(/const IDLE_MENUS_VIVANTS_V1=\{([^}]*)\}/);
assert.ok(vivants, "liste des menus vivants");
for (const m of ["ngu", "wandoos", "yggdrasil", "diggers", "beards", "wishes", "hacks", "daycare"]) assert.ok(("," + vivants[1]).includes("," + m + ":1"), "menu vivant : " + m);
// synchro périodique des menus à mise à jour en place
assert.ok(ui.includes("IDLE_MENUS_VIVANTS_V1[idleMenuActifV28]||idleMenuActifV28==='tower'||idleMenuActifV28==='machine')&&PAGE_ACTIVE==='idle'&&Date.now()-idleMenuViveSyncV1>4000"), "ITOPOD et Machine temporelle : synchro toutes les 4 s");
// mise à jour en place à chaque synchro
assert.ok(ui.includes("if(idleMenuActifV28==='machine'&&idleEtat&&idleEtat.systemes&&idleEtat.systemes.timeMachineView){") && ui.includes("patcherBarresTimeMachineIdleV1_(idleEtat)"), "Machine temporelle : chiffres, barres et compte à rebours mis à jour à chaque synchro");
assert.ok(ui.includes("idleMenuActifV28==='tower'&&idleEtat&&typeof window.__rafraichirItopodIdleV1__==='function'"), "ITOPOD : mise à jour en place");
assert.ok(ui.includes("window.__adopterRepereAugmentsIdleV1__(idleEtat)"), "Augmentations : réponse du serveur adoptée comme repère");
// le patch de la Machine temporelle couvre les remplissages par seconde, l'Or par seconde et l'Or par remplissage
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
for (const k of ["barFillsPerSecond:nombre", "netGps:nombre", "orReel:nombre", "machineSpeedMultiplier:nombre"]) assert.ok(meta.includes(k), "chiffre mis à jour en place : " + k);
assert.ok(meta.includes("barreOr.setAttribute('data-fills',cle)"), "la barre d'Or change de cadence quand le niveau de vitesse monte");
console.log("idle-menus-temps-reel-v1: OK");
