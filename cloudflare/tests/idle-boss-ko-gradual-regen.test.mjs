import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-15, en testant SOREAL IDLE en direct sur le boss Aventure
 * de la zone tuto) : "Quand tu as perdu contre le boss, tu as récupéré ta
 * vie trop vite (à corriger)."
 *
 * Cause confirmée dans appliquerProgressionEnergieSorealIdle_ : la boucle de
 * rattrapage (rejoue tout le combat depuis DERNIERE_SYNCHRO) remettait
 * pvJoueur À pvJoueurMax instantanément dès que le décompte de K.O.
 * (DUREE_KO_SECONDES) expirait — au lieu de régénérer progressivement comme
 * partout ailleurs (repos hors combat, Aventure Safe Zone, déjà verrouillé
 * par idle-flee-regen-timestamp.test.mjs pour la Fuite). Comme cette boucle
 * peut rattraper plusieurs secondes/minutes d'un coup à chaque synchro
 * périodique (le combat de Boss est simulé côté client), le joueur ne
 * voyait jamais la remontée progressive : juste un bond direct à 100 %.
 *
 * Vérifié sur le wiki NGU (Safe Zone: Awakening Site) : "Every time the
 * player is defeated they return here to heal" — la récupération après
 * défaite est TOUJOURS progressive dans NGU, jamais un reset instantané.
 *
 * Correctif : le K.O. ne fait plus que débloquer le combat (koJusqua=0) ;
 * pvJoueur continue de régénérer au même taux (regenPctSecJoueur, la Salle
 * de repos choisie — une seule résolution, réutilisée par le repos hors
 * combat ET par l'attente de K.O., jamais un second calcul).
 */
const source = readFileSync(
  new URL("../src/idle-sqlite-runtime.js", import.meta.url),
  "utf8"
);

const fnStart = source.indexOf("function appliquerProgressionEnergieSorealIdle_(");
assert.ok(fnStart >= 0, "appliquerProgressionEnergieSorealIdle_ introuvable.");
const fnEnd = source.indexOf("\nfunction ", fnStart + 10);
const fnBody = source.slice(fnStart, fnEnd);

// Une seule résolution de regenPctSec (Salle de repos), partagée par
// le repos hors combat ET la récupération pendant l'attente de K.O.
const regenDeclarations = (fnBody.match(/const regenPctSecJoueur\s*=/g) || []).length;
assert.equal(
  regenDeclarations,
  1,
  "regenPctSecJoueur doit être calculé une seule fois et réutilisé partout — jamais un second calcul dupliqué."
);

const koWaitStart = fnBody.indexOf("koJusqua > tempsSimulation");
assert.ok(koWaitStart >= 0, "La branche d'attente de K.O. (koJusqua > tempsSimulation) introuvable.");
const koWaitEnd = fnBody.indexOf("if (\n      pvJoueur <= 0\n    ) {", koWaitStart);
const koWaitBody = fnBody.slice(koWaitStart, koWaitEnd >= 0 ? koWaitEnd : koWaitStart + 2000);

assert.ok(
  !/pvJoueur\s*=\s*pvJoueurMax\s*;/.test(koWaitBody),
  "La fin du décompte de K.O. ne doit plus remettre pvJoueur à pvJoueurMax instantanément — la vie doit remonter progressivement, jamais d'un bond."
);

assert.ok(
  koWaitBody.includes("regenPctSecJoueur") &&
  /pvJoueur\s*=\s*\n?\s*Math\.min\(\s*\n?\s*pvJoueurMax,\s*\n?\s*pvJoueur\s*\+/.test(koWaitBody),
  "L'attente de K.O. doit appliquer une régénération progressive (Math.min(pvJoueurMax, pvJoueur + ...)) en utilisant le même regenPctSecJoueur que le repos hors combat."
);

console.log("idle-boss-ko-gradual-regen: OK");
