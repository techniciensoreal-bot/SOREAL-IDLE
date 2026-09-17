import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Grand nettoyage (audit 2026-09-17) : niveauRequisBossSorealIdle_ a le
 * même défaut que le reste du lot -- "V53 : plus de niveau joueur
 * global requis pour affronter un boss" (return 1; en toute première
 * instruction) suivi de l'ancien calcul par
 * definitionBossSorealIdle_(index).niveauRequis, jamais atteint. La
 * fonction elle-même reste (encore appelée à 7 endroits réels), seul
 * son corps mort disparaît.
 */
const source = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

const start = source.indexOf("function niveauRequisBossSorealIdle_(");
assert.ok(start >= 0, "niveauRequisBossSorealIdle_ doit exister (encore appelée ailleurs).");
const end = source.indexOf("\n}", start);
const body = source.slice(start, end);

assert.ok(body.includes("return 1;"), "Doit toujours renvoyer 1 (V53 : plus de niveau requis).");
assert.ok(
  !body.includes(".niveauRequis") &&
  !body.includes("const index =") &&
  !body.includes("definitionBossSorealIdle_("),
  "Le calcul mort (definitionBossSorealIdle_(index).niveauRequis) ne doit plus exister dans le corps de la fonction."
);

console.log("idle-boss-level-required-dead-code-removed: OK");
