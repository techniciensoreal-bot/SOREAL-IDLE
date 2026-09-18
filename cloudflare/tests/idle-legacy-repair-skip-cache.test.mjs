import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Perf (2026-09-18, Norman : "le menu Paramètres est lent") — mesuré en
 * direct dans le navigateur : chaque /api/idle/call prenait entre 830ms et
 * 2,2s, sur TOUTES les pages du jeu (pas seulement Paramètres — c'est juste
 * l'écran où Norman l'a remarqué). Cause confirmée en lisant
 * runSorealIdleOperation() : __idleRepairCatalogSheetNamesV1() et
 * __idleRestoreCatalogFromLegacyV2() tournaient AVANT CHAQUE opération,
 * sans exception — jusqu'à 15 requêtes SQL chacune (une par feuille
 * canonique : JOUEURS, CONFIG, IDLE_BOSS...), rien que pour constater qu'il
 * n'y a rien à réparer une fois la migration terminée (déjà confirmée par
 * le check sourceState.total/done juste au-dessus, qui ne redevient jamais
 * faux). Ce test verrouille le drapeau mémoire qui limite ces deux passes
 * à une seule fois par démarrage à froid de l'isolate, jamais un skip
 * permanent qui masquerait une vraie migration incomplète.
 */
const source = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

assert.ok(
  source.includes("let __idleLegacyRepairDoneV1=false;"),
  "Le drapeau __idleLegacyRepairDoneV1 doit exister, initialisé à false (donc toujours réévalué après un redémarrage à froid)."
);

const fnStart = source.indexOf("export function runSorealIdleOperation(");
assert.ok(fnStart >= 0, "runSorealIdleOperation introuvable telle quelle — mettre ce test à jour si elle a été renommée.");
const fnBody = source.slice(fnStart);

const guardIdx = fnBody.indexOf("if(!__idleLegacyRepairDoneV1){");
const repairIdx = fnBody.indexOf("__idleRepairCatalogSheetNamesV1(sql);");
const restoreIdx = fnBody.indexOf("__idleRestoreCatalogFromLegacyV2(sql);");
const setDoneIdx = fnBody.indexOf("__idleLegacyRepairDoneV1=true;");
const buildIdx = fnBody.indexOf("__idleBuildWorkbook(sql)");

assert.ok(
  guardIdx >= 0 && guardIdx < repairIdx && repairIdx < restoreIdx && restoreIdx < setDoneIdx && setDoneIdx < buildIdx,
  "Les deux passes de réparation legacy doivent être protégées par le drapeau mémoire, dans cet ordre, et " +
  "toujours AVANT __idleBuildWorkbook(sql) — l'ordre de réparation-puis-reconstruction ne doit jamais changer."
);

// Les deux appels doivent être STRICTEMENT à l'intérieur du bloc du drapeau
// (donc avant le prochain "}" qui referme le if), jamais déplacés en dehors.
const closingBraceIdx = fnBody.indexOf("\n  }", setDoneIdx);
assert.ok(
  closingBraceIdx > setDoneIdx && closingBraceIdx < buildIdx,
  "Le bloc du drapeau doit se refermer avant __idleBuildWorkbook — les deux réparations restent conditionnelles, pas inconditionnelles."
);

console.log("idle-legacy-repair-skip-cache: OK");
