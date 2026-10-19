import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-03) : « quand je tue un boss ça ne passe pas directement au suivant ; les niveaux des Augmentations ne sont pris en compte qu'au moment d'appuyer sur Fight ; c'est à ce moment-là que
 * les PV se mettent à jour ». Les effets des Augmentations arrivent par la synchro (toutes les 15 s) : pendant un combat, elle passe à 4 s, et au repos la vie ne redescend pas sous celle du serveur.
 */
const ui = lireUiComplet();
assert.ok(ui.includes("window.__sorealIdleSyncCombatV1=setInterval(function(){"), "synchro rapprochée pendant un combat");
assert.ok(ui.includes("if(idleMenuActifV28!=='combat'||!idleEtat.combatBossActif)return;"), "seulement pendant un combat de Fight Boss");
assert.ok(ui.includes("},(typeof window!=='undefined'&&window.__SOREAL_IDLE_DELAI_SYNC_V1__?window.__SOREAL_IDLE_DELAI_SYNC_V1__(4000):4000));"), "toutes les 4 s (400 ms en jeu local)");
assert.ok(ui.includes("Math.max(0,idleNombre_(idleEtat.pvJoueur),Math.min(idleNombre_(joueurServeur.pvJoueur)"), "au repos : jamais sous la vie déjà régénérée par le serveur");
console.log("idle-fight-stats-synchro-combat-v1: OK");
