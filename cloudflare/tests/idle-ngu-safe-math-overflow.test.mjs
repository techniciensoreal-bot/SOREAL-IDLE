import assert from "node:assert/strict";
import { safePow, safeProduct } from "../src/idle-ngu-progression.js";

/*
 * Mission NGU (2026-09-08) : audit trouvé que safePow()/safeProduct()
 * écrêtaient tout résultat à [1e-300, 1e300] via un plafond arbitraire sur
 * le logarithme (±690). Deux chaînes de multiplicateurs produisant "en
 * vrai" 1e400 et 1e900 devenaient alors STRICTEMENT IDENTIQUES — un vrai
 * bug de correction, pas juste une limite de précision, puisque NUMBER (le
 * multiplicateur de Renaissance) et tout ce qu'il multiplie en dépendent.
 * Ce test verrouille que ce plafond n'existe plus.
 */

// Avant le correctif : safeProduct([1e90,1e90,1e90]) = 1e270 (sous l'ancien
// plafond de 1e300), mais ajouter un facteur pour atteindre exactement
// l'ancien plafond (1e300) ou le dépasser légèrement (1e305) donnait
// AUSSI 1e300 dans les deux cas — indiscernables. Avec le correctif, ces
// deux résultats restent distincts puisqu'ils sont tous deux < ~1.7977e308.
{
  const troisCent = safeProduct([1e90, 1e90, 1e90, 1e30]); // 1e300
  const troisCentCinq = safeProduct([1e90, 1e90, 1e90, 1e35]); // 1e305

  assert.notEqual(
    troisCent, troisCentCinq,
    "1e300 et 1e305 doivent rester distincts — avant le correctif, les deux valaient exactement 1e300."
  );
  assert.ok(
    troisCentCinq > troisCent,
    "1e305 doit être strictement supérieur à 1e300."
  );
  assert.ok(
    Number.isFinite(troisCent) && Number.isFinite(troisCentCinq),
    "Les deux doivent rester des Number JS finis (tous deux sous la limite réelle d'un double)."
  );
}

// La vraie limite désormais est celle d'un double IEEE 754 (~1.7977e308),
// pas 1e300. En dessous de cette limite, deux magnitudes très différentes
// (mais toutes deux < 1.7977e308) doivent rester exactement distinguables.
{
  const a = safePow(10, 305);
  const b = safePow(10, 307);
  assert.notEqual(a, b, "10^305 et 10^307 doivent rester distincts (tous deux < limite double).");
  assert.ok(b > a, "10^307 doit être strictement supérieur à 10^305.");
  assert.ok(Number.isFinite(a) && Number.isFinite(b), "Les deux doivent rester des Number JS finis sous ~1.7977e308.");
}

// Au-delà de la limite réelle d'un double, le résultat devient honnêtement
// Infinity (correctement ordonné), jamais une fausse valeur finie arbitraire.
{
  const enorme = safePow(10, 400);
  assert.equal(enorme, Infinity, "10^400 dépasse un double IEEE 754 : le résultat doit être Infinity, jamais 1e300.");

  const encorePlusEnorme = safeProduct([1e200, 1e200, 1e200]);
  assert.equal(encorePlusEnorme, Infinity, "1e200 * 1e200 * 1e200 = 1e600, au-delà d'un double : doit être Infinity.");
}

// Comportement inchangé dans la plage "normale" déjà bien couverte par les
// tests existants (pas de régression sur les valeurs early-game réelles).
// Tolérance relative : le calcul passe par un espace logarithmique des deux
// côtés (avant et après ce correctif), donc une imprécision flottante de
// l'ordre de 1e-10 est inhérente à l'approche, pas une régression.
{
  const puissance = safePow(2, 10);
  assert.ok(Math.abs(puissance - 1024) / 1024 < 1e-9, "safePow doit rester exact (à la précision flottante près) pour des valeurs ordinaires : obtenu " + puissance);

  const produit = safeProduct([2, 3, 4]);
  assert.ok(Math.abs(produit - 24) / 24 < 1e-9, "safeProduct doit rester exact (à la précision flottante près) pour des valeurs ordinaires : obtenu " + produit);
}

console.log("idle-ngu-safe-math-overflow: OK");
