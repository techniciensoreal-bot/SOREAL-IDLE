// Norman (2026-11-01) : « Redrum (Norman) n'est jamais montré » dans l'ITOPOD : un compte d'ouvrier absent des profils d'équipe de TV est aussi un ennemi (« pseudo (prénom) »), sans jamais exposer d'adresse e-mail.
import fs from "node:fs";
import assert from "node:assert/strict";
const lire = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const coord = lire("cloudflare/src/index-idle-coordinator-v1.js"), roster = lire("cloudflare/src/idle-itopod-roster-v1.js");
const route = coord.slice(coord.indexOf('if (path === "/__soreal-idle-v1/noms-joueurs")'), coord.indexOf('if (path === "/__soreal-idle-v1/launch-ticket-consume")'));
assert.ok(route.includes("internes.push({ nom, email: profil.email })") && route.includes("noms, internes"), "la route interne renvoie les comptes d'ouvrier avec leur adresse (usage serveur seulement)");
assert.ok(roster.includes("nomsJoueurs.push(c.nom)") && !roster.includes("parEmail.has("), "tout compte d'ouvrier est un ennemi sous son libellé (doublon de nom ignoré par idleItopodAjouterJoueursV1)");
// jamais d'adresse dans la réponse publique : le roster n'expose que { nom, avatar }
const fin = roster.slice(roster.indexOf("export function idleItopodAjouterJoueursV1"));
assert.ok(!/email/.test(fin.slice(0, fin.indexOf("\n}\n"))), "aucune adresse dans la liste publique");
console.log("idle-itopod-compte-ouvrier-ennemi-v1 : OK");
