import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-09-14) : "j'ai toujours des items à 4/1. Sûrement dû à
 * mon ancienne partie. Je veux que tu forces un reset total du jeu
 * pour tout le monde." Confirmé explicitement (reset GLOBAL, action
 * irréversible affectant tous les joueurs) avant tout déclenchement.
 *
 * reinitialiserTousLesComptesSorealIdle reprend le même principe que
 * reinitialiserCompteCompletSorealIdle (efface réellement la ligne
 * A:STATS_JSON — jamais juste des compteurs remis à 0, pour que
 * creerJoueurSorealIdle_() recrée chaque joueur comme une toute
 * première connexion), appliqué à CHAQUE ligne de la feuille JOUEURS.
 * Réservé à un déclenchement manuel ponctuel (jamais un bouton
 * joueur) : exigerAccesSorealIdle_ suffit, l'appelant est le seul
 * Responsable qui a demandé et confirmé cette action explicitement.
 */
const source = fs.readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

const start = source.indexOf("function reinitialiserTousLesComptesSorealIdle(");
assert.ok(start >= 0, "reinitialiserTousLesComptesSorealIdle introuvable.");
const end = source.indexOf("\nfunction reinitialiserCompteCompletSorealIdle(", start);
assert.ok(end > start, "Fin de reinitialiserTousLesComptesSorealIdle introuvable.");
const body = source.slice(start, end);

assert.ok(
  body.includes("exigerAccesSorealIdle_(") &&
  body.indexOf("exigerAccesSorealIdle_(") < body.indexOf("LockService.getScriptLock()"),
  "L'action doit exiger une session IDLE valide avant tout accès au verrou/à la feuille."
);
assert.ok(
  body.includes("feuille.getLastRow()") &&
  !body.includes("trouverLigneJoueurSorealIdle_("),
  "Doit itérer TOUTES les lignes de la feuille (getLastRow), jamais se limiter à la ligne d'un seul joueur (trouverLigneJoueurSorealIdle_)."
);
assert.ok(
  /getRange\(\s*2,\s*1,\s*derniereLigne\s*-\s*1,\s*c\.STATS_JSON\s*\)\s*\.clearContent\(\)/.test(body),
  "Doit effacer réellement le contenu (clearContent), depuis la ligne 2 (après l'en-tête) jusqu'à la dernière ligne, colonnes 1 à STATS_JSON — même portée que le reset individuel, appliquée à tout le monde."
);
assert.equal(
  body.includes("if (derniereLigne >= 2)"),
  true,
  "Doit gérer sans erreur le cas d'une feuille sans aucun joueur (ne pas appeler getRange avec une hauteur de 0 ou négative)."
);

// --- Enregistrement dans la table de dispatch des opérations IDLE ---
assert.ok(
  /IDLE_OPERATIONS\s*=\s*Object\.freeze\(\{[\s\S]{0,4000}reinitialiserTousLesComptesSorealIdle[\s\S]{0,4000}\}\)/.test(source) ||
  new RegExp("reinitialiserTousLesComptesSorealIdle,\\s*\\n\\s*renaitreSorealIdle,").test(source),
  "reinitialiserTousLesComptesSorealIdle doit être enregistré dans la table de dispatch des opérations IDLE pour être appelable depuis le client."
);

console.log("idle-reset-all-accounts: OK");
