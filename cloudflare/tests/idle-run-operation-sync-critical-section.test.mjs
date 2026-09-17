import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Audit 2026-09-17 : LockService.getScriptLock() (idle-sqlite-runtime.js,
 * voir __idleScriptLockHeldV1 et idle-lock-service-real-exclusion.test.mjs)
 * n'est PAS un vrai verrou distribué — c'est un simple booléen en mémoire,
 * scopé à l'isolate. Ça reste correct AUJOURD'HUI uniquement parce que le
 * cycle lire-modifier-écrire complet de runSorealIdleOperation (reconstruire
 * le workbook depuis SQLite via __idleBuildWorkbook, exécuter l'opération,
 * puis committer via __idleCommit) est ENTIÈREMENT SYNCHRONE : aucun
 * `await` ne peut jamais s'intercaler entre la lecture et l'écriture, donc
 * aucune requête concurrente ne peut jamais voir un état à moitié écrit.
 *
 * Rien n'empêche structurellement une future modification d'introduire un
 * `await` quelque part dans cette section (ex. un appel réseau ajouté par
 * inadvertance dans une opération IDLE_OPERATIONS, ou un helper qui devient
 * async). Si ça arrive, deux requêtes concurrentes sur le même isolate
 * pourraient s'entrelacer PENDANT la fenêtre lire-modifier-écrire : la
 * première construit son workbook, cède la main sur l'await, la seconde
 * construit le SIEN (état encore ancien), les deux commitent chacune leur
 * tour — la dernière écriture gagne et écrase silencieusement les
 * changements de l'autre. C'est une vraie race condition, pas juste un
 * ralentissement, et elle ne lèvera aucune erreur visible : elle se
 * manifestera comme des données perdues façon "Basic Training qui rend ses
 * points" (déjà vécu une fois pour une autre raison, cf. le fichier de test
 * ci-dessus).
 *
 * Ce test ne restructure PAS le mécanisme de verrou (hors scope, cf. audit
 * 2026-09-17) — il verrouille seulement l'INVARIANT dont dépend sa
 * sécurité actuelle : si un futur changement ajoute un `await` entre la
 * construction du workbook et son commit, ce test doit échouer bruyamment
 * ICI, avec une explication, plutôt que de laisser une race condition
 * silencieuse se glisser en production.
 */
const source = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

const fnStart = source.indexOf("export function runSorealIdleOperation(");
assert.ok(
  fnStart >= 0,
  "export function runSorealIdleOperation( introuvable telle quelle : soit la fonction a été renommée/déplacée (mettre ce test à jour), " +
  "soit elle est devenue `export async function runSorealIdleOperation(` — ce qui casserait exactement l'invariant que ce test protège " +
  "(tout le raisonnement de sécurité du LockService en mémoire suppose un cycle lire-modifier-écrire entièrement synchrone)."
);

// runSorealIdleOperation est la dernière fonction du fichier : on prend
// tout jusqu'à la fin plutôt que de tenter un appariement d'accolades.
const fnBody = source.slice(fnStart);

const buildCall = "__idleBuildWorkbook(sql)";
const commitCall = "__idleCommit(sql,workbook)";
const buildIdx = fnBody.indexOf(buildCall);
const commitIdx = fnBody.indexOf(commitCall);
assert.ok(buildIdx >= 0, `${buildCall} introuvable dans runSorealIdleOperation — la fonction a peut-être été renommée/restructurée ; ce test doit être mis à jour en conséquence plutôt qu'ignoré.`);
assert.ok(commitIdx > buildIdx, `${commitCall} introuvable après ${buildCall} dans runSorealIdleOperation.`);

const criticalSection = fnBody.slice(buildIdx, commitIdx + commitCall.length);
const awaitMatches = criticalSection.match(/\bawait\b/g) || [];
assert.equal(
  awaitMatches.length, 0,
  "Un `await` a été introduit entre __idleBuildWorkbook(sql) et __idleCommit(sql,workbook) dans runSorealIdleOperation. " +
  "C'est une régression de sécurité réelle, pas un faux positif : le LockService de ce fichier est un simple booléen en " +
  "mémoire (voir __idleScriptLockHeldV1) qui ne protège QUE parce que ce cycle lire-modifier-écrire est aujourd'hui " +
  "100% synchrone. Introduire un point de suspension ici permettrait à deux requêtes concurrentes sur le même isolate " +
  "de s'entrelacer et à l'une d'écraser silencieusement les données de l'autre (perte de progression joueur, sans erreur " +
  "visible). Si cet await est réellement nécessaire, il faut d'abord doter LockService d'une vraie exclusion mutuelle " +
  "couvrant TOUTE la section async avant de l'ajouter ici."
);

console.log("idle-run-operation-sync-critical-section: OK");
