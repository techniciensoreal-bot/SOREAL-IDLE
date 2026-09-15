import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-11) : "Quand on prend la fuite contre les boss, ça ne
 * fonctionne pas comme prévu. On récupère très vite sa vie. Il faut que
 * le régén se fasse lentement comme c'est prévu dans NGU."
 *
 * Cause : definirCombatBossSorealIdle (la Fuite) ne touchait jamais
 * DERNIERE_SYNCHRO. appliquerProgressionEnergieSorealIdle_ applique son
 * taux de régén hors-combat (~2,5%/s) à TOUT le temps écoulé depuis cette
 * valeur — qui, pendant un combat simulé côté client, ne datait que de la
 * dernière synchro périodique (jusqu'à ~15s plus tôt), jamais mise à jour
 * par les coups portés localement pendant le combat lui-même. Résultat :
 * la première lecture d'état après une Fuite créditait jusqu'à ~15s de
 * régén "hors combat" pour une période où le joueur combattait activement
 * — un bond de vie visible au lieu d'une remontée lente. Corrigé en
 * timbrant DERNIERE_SYNCHRO à l'instant précis de la Fuite, pour que le
 * calcul de régén ne démarre jamais avant ce moment.
 */
const source = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

const start = source.indexOf("function definirCombatBossSorealIdle(");
assert.ok(start >= 0, "definirCombatBossSorealIdle introuvable.");
const end = source.indexOf("function nukerBossSorealIdle(", start);
const body = source.slice(start, end);

const fleeStart = body.indexOf("if (!stats.combatBossActif) {");
assert.ok(fleeStart >= 0, "La branche Fuite (!stats.combatBossActif) introuvable.");
const fleeBody = body.slice(fleeStart);

assert.ok(
  fleeBody.indexOf("c.KO_JUSQUA") < fleeBody.indexOf("c.DERNIERE_SYNCHRO") &&
  fleeBody.indexOf("c.DERNIERE_SYNCHRO") >= 0,
  "La Fuite doit timbrer DERNIERE_SYNCHRO à l'instant présent, juste après avoir nettoyé KO_JUSQUA — sinon le prochain calcul de régén crédite à tort le temps passé en combat actif comme du repos."
);

assert.ok(
  /c\.DERNIERE_SYNCHRO\s*\)\s*\.setValue\(\s*new Date\(\)\s*\)/.test(fleeBody),
  "Le timbre doit utiliser l'heure ACTUELLE (new Date(), pas une valeur passée ou dérivée de la ligne)."
);

console.log("idle-flee-regen-timestamp: OK");
