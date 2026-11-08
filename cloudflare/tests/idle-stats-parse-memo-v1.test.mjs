import assert from "node:assert/strict";
import fs from "node:fs";
await import("../src/idle-sqlite-runtime.js");
const { statsJoueurSorealIdle_ } = await import("../src/idle-runtime-collection.js");

/* Plan C2 : la colonne STATS_JSON n'est relue qu'une fois par texte, mais chaque appel reçoit une copie fraîche (les appelants modifient metaNgu, cooldowns...). */
const brut = JSON.parse(fs.readFileSync("cloudflare/tests/references/partie-reference-2.json", "utf8"));
const ligne = Object.keys(brut).sort((a, b) => a - b).map((k) => brut[k]);
const texte = ligne[37];
assert.ok(texte.length > 2000, "texte assez gros pour le mémo");
const a = statsJoueurSorealIdle_(texte), b = statsJoueurSorealIdle_(texte);
assert.deepEqual(a, b, "même texte, mêmes valeurs");
assert.notEqual(a.metaNgu, b.metaNgu, "jamais le même objet");
const avant = JSON.stringify(b.metaNgu);
a.metaNgu.records = { highestBoss: -1 }; a.metaNgu.zzz = 1; a.vus.push("test");
const c = statsJoueurSorealIdle_(texte);
assert.equal(JSON.stringify(c.metaNgu), avant, "une modification du résultat ne fuit pas dans les appels suivants");
assert.equal(c.vus.includes("test"), false);
const autre = JSON.parse(texte); autre.lootsObtenus = (autre.lootsObtenus || 0) + 7;
const d = statsJoueurSorealIdle_(JSON.stringify(autre));
assert.equal(d.lootsObtenus, a.lootsObtenus + 7, "un texte différent est relu");
assert.equal(statsJoueurSorealIdle_(texte).lootsObtenus, c.lootsObtenus, "retour au premier texte");
assert.equal(statsJoueurSorealIdle_("").lootsObtenus, 0, "texte vide");
assert.equal(statsJoueurSorealIdle_("{pas du json").lootsObtenus, 0, "texte invalide");
console.log("idle-stats-parse-memo-v1: OK");
