import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Grand nettoyage (audit 2026-09-17) : allocatedFraction (idle-ngu-
 * progression.js) n'avait plus aucun appelant nulle part dans le
 * dépôt (fonction interne, jamais exportée) — trouvée par le même
 * audit systématique de références que idle-sqlite-runtime.js.
 * totalAllocated (le vrai calcul utilisé partout ailleurs pour ce
 * genre de vérification) reste inchangé.
 */
const source = readFileSync("cloudflare/src/idle-ngu-progression.js", "utf8");

assert.ok(
  !source.includes("function allocatedFraction("),
  "allocatedFraction doit avoir disparu (zéro appelant confirmé)."
);
assert.ok(
  source.includes("function totalAllocated("),
  "totalAllocated (utilisé ailleurs) doit rester inchangé."
);

console.log("idle-ngu-progression-allocated-fraction-removed: OK");
