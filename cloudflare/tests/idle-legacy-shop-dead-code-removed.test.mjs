import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Grand nettoyage (audit 2026-09-17) : acheterAmeliorationSorealIdle et
 * acheterAmeliorationsSorealIdle (ancienne "Boutique Permanente" V53,
 * remplacée par Spend EXP du moteur NGU, cf. SOREAL_IDLE_V53_LEGACY_SHOP_DISABLED
 * déjà verrouillé par idle-v47-source-contract.test.mjs) avaient le même
 * défaut que les fonctions de loot Fight Boss (idle-fight-boss-loot-removed
 * .test.mjs) : un `return {ok:false,...}` en toute première instruction,
 * suivi de ~330 lignes de l'ancienne implémentation complète (calcul de
 * coût, verrou, écriture spreadsheet...) jamais atteintes. Supprimé.
 */
const source = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

for (const fn of ["acheterAmeliorationSorealIdle", "acheterAmeliorationsSorealIdle"]) {
  const start = source.indexOf("function " + fn + "(");
  assert.ok(start >= 0, fn + " introuvable.");
  const end = source.indexOf("\n}", start);
  const body = source.slice(start, end);
  assert.ok(
    body.includes("SOREAL_IDLE_V53_LEGACY_SHOP_DISABLED"),
    fn + " doit rester désactivée."
  );
  assert.ok(
    !body.includes("LockService.getScriptLock()") &&
    !body.includes("SpreadsheetApp.flush()"),
    fn + " ne doit plus contenir de code mort après son return (plus de verrou, plus d'écriture spreadsheet inatteignable)."
  );
}

// Les helpers de calcul (ameliorationsSorealIdle_, coutAmeliorationSorealIdle_,
// bonusAmeliorationsSorealIdle_) restent réels : d'autres call sites vivants
// les utilisent encore (obtenirEtatBoutiqueSorealIdle,
// construireEtatJoueurSorealIdle_) — jamais à supprimer, contrairement aux
// fonctions dédiées au loot Fight Boss qui, elles, n'avaient plus aucun
// appelant du tout.
for (const helper of ["ameliorationsSorealIdle_", "coutAmeliorationSorealIdle_", "bonusAmeliorationsSorealIdle_"]) {
  assert.ok(
    source.includes("function " + helper + "("),
    helper + " doit rester (utilisé ailleurs, pas orphelin comme le code des boutiques désactivées)."
  );
}

/*
 * Correction en cours de route (audit 2026-09-17, passe d'orphelins en
 * cascade) : bonusRenaissanceSorealIdle_ avait en réalité ZÉRO appelant
 * réel une fois les boutiques désactivées ET etatRenaissanceSorealIdle_
 * (elle aussi orpheline) retirées — son seul "usage" était dans du code
 * déjà mort. Supprimée avec le reste, contrairement à ce que ce test
 * affirmait initialement.
 */
assert.ok(
  !source.includes("function bonusRenaissanceSorealIdle_("),
  "bonusRenaissanceSorealIdle_ doit avoir disparu (confirmé orpheline après suppression de ses seuls appelants, eux-mêmes du code mort)."
);

console.log("idle-legacy-shop-dead-code-removed: OK");
