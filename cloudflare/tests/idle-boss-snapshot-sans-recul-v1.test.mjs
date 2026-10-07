import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Jamais de retour en arrière sur le boss (Norman, 2026-10-08) : à l'arrêt d'un combat de boss (fuite, défaite, reprise) le serveur reprend l'instantané du client, mais cet instantané ne peut QUE faire baisser
 * les PV du boss ; il ne lui rend jamais de vie, et un « 0 » du client (victoire prédite) ne tue pas le boss à la place du serveur (sinon : boss remis à son maximum, victoire perdue, barre qui remonte).
 */
const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
const i = rt.indexOf("const bossPvServeur=");
assert.ok(i > 0, "PV du boss côté serveur lus avant l'instantané");
const bloc = rt.slice(i, i + 2600);
assert.ok(/const bossPvRetenu=\s*bossPvSnapshot>0\s*\?Math\.min\(bossPvSnapshot,bossPvServeur\)\s*:bossPvServeur;/.test(bloc), "min(client, serveur) ; un 0 du client ne tue pas le boss");
assert.ok(/\.setValue\(\s*bossPvRetenu\s*\)/.test(bloc), "c'est la valeur retenue qui est écrite, pas l'instantané brut");
assert.ok(!/\.setValue\(\s*bossPvSnapshot\s*\)/.test(bloc), "l'instantané brut n'est plus écrit tel quel");
console.log("idle-boss-snapshot-sans-recul-v1: OK");
