import assert from "node:assert/strict";
import fs from "node:fs";
import { matrice } from "../tools/matrice-ecritures-v1.mjs";

/*
 * C1 du plan (2026-11-07) : matrice opération x bloc d'état (design/MATRICE-ECRITURES.json). Garde : (1) la mesure est DÉTERMINISTE ; (2) lire l'état n'écrit rien ; (3) aucune opération ne touche un bloc que la
 * matrice commitée ne déclare pas (un bloc nouveau doit être ajouté en connaissance de cause : c'est le préalable d'un versionnement par bloc, C2). Régénérer : node cloudflare/tools/matrice-ecritures-v1.mjs --ecrire
 */
const declaree = JSON.parse(fs.readFileSync("design/MATRICE-ECRITURES.json", "utf8"));
const ligne = JSON.parse(fs.readFileSync("cloudflare/tests/references/partie-reference-1.json", "utf8"));
const a = matrice(ligne), b = matrice(ligne);
assert.deepEqual(a, b, "matrice déterministe");
assert.deepEqual(a["lire l'état"].blocs, [], "lire l'état n'écrit aucun bloc");
for (const op of Object.keys(a)) {
  assert.ok(declaree[op], "opération connue de la matrice : " + op);
  for (const bloc of a[op].blocs) assert.ok(declaree[op].includes(bloc), op + " : bloc non déclaré dans la matrice : " + bloc);
}
console.log("idle-matrice-ecritures-v1: OK (" + Object.keys(a).length + " opérations)");
