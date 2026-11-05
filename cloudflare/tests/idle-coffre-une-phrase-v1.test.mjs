import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-11-05) : « quand le coffre pète, je ne veux qu'une phrase dans les phrases dispo. Pas 2 » : une seule bulle, tirée dans la liste ; plus de seconde phrase fixe. */
const dig = readFileSync("cloudflare/public/modules/coffre-digestion-v1.js", "utf8");
const rep = dig.slice(dig.indexOf("function repliques_()"), dig.indexOf("L'accident du jour"));
assert.equal((rep.match(/bulle_\(coffre,/g) || []).length, 1, "une seule bulle à l'accident");
assert.ok(!rep.includes("b2"), "plus de seconde réplique");
assert.ok(rep.includes("||PHRASE_REPLI_ACCIDENT"), "repli si la liste est vide");
const ph = readFileSync("cloudflare/public/modules/phrases-coffre-valise-v1.js", "utf8");
assert.ok(ph.includes("'{C}J’crois que j’me suis chié dessus.'"), "la phrase fait partie de la liste modifiable");
console.log("idle-coffre-une-phrase-v1: OK");
