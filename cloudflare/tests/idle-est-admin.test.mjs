import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-09-18, en direct, repro live) : le bouton admin "Reset TOUS
 * les joueurs" restait invisible côté SOREAL-APP même après le premier
 * correctif du jour (lire SOREAL_USER au lieu d'une variable jamais
 * peuplée) -- SOREAL_USER dépend d'un handshake TV-embed asynchrone
 * (postMessage) dont le timing n'est jamais garanti avant le tout premier
 * rendu de la page Settings.
 *
 * estAdminSorealIdle donne au client une réponse SERVEUR autoritaire,
 * indépendante de ce handshake -- même comparaison (acces.emailAutorise
 * contre ADMIN_SOREAL_IDLE_EMAIL) que reinitialiserTousLesComptesSorealIdle,
 * jamais un second critère dupliqué. Contrairement à cette dernière, elle
 * ne lit/écrit jamais la feuille JOUEURS (aucun verrou nécessaire) --
 * appelable librement à chaque rendu côté client sans coût.
 */
const source = fs.readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

const start = source.indexOf("function estAdminSorealIdle(");
assert.ok(start >= 0, "estAdminSorealIdle introuvable.");
const end = source.indexOf("\nfunction reinitialiserTousLesComptesSorealIdle(", start);
assert.ok(end > start, "Fin de estAdminSorealIdle introuvable.");
const body = source.slice(start, end);

assert.ok(
  body.includes("exigerAccesSorealIdle_("),
  "Doit exiger une session IDLE valide (même garde que les autres opérations), jamais un accès anonyme."
);
assert.ok(
  !/getRange|LockService|SpreadsheetApp/.test(body),
  "Ne doit jamais lire/écrire la feuille JOUEURS ni prendre de verrou -- doit rester un point d'entrée léger, appelable librement à chaque rendu côté client."
);
assert.ok(
  /acces\.emailAutorise[\s\S]{0,40}toLowerCase\(\)[\s\S]{0,40}===[\s\S]{0,10}ADMIN_SOREAL_IDLE_EMAIL/.test(body),
  "Doit comparer acces.emailAutorise (lowercased) à ADMIN_SOREAL_IDLE_EMAIL -- exactement le même critère que reinitialiserTousLesComptesSorealIdle, jamais un second critère dupliqué (ex. re-tester la liste EMAILS_DEVELOPPEMENT)."
);
assert.ok(
  /isAdmin\s*:/.test(body) && /ok\s*:\s*true/.test(body),
  "Doit répondre {ok:true, isAdmin:<bool>} -- jamais lever/refléter une erreur pour un compte simplement non-admin (seule une session invalide doit faire échouer exigerAccesSorealIdle_)."
);

assert.ok(
  source.indexOf("const ADMIN_SOREAL_IDLE_EMAIL = 'technicien.soreal@gmail.com';") < start,
  "ADMIN_SOREAL_IDLE_EMAIL doit déjà être défini avant cette fonction -- jamais une seconde constante dupliquée."
);

// --- Enregistrement dans la table de dispatch des opérations IDLE ---
assert.ok(
  new RegExp("estAdminSorealIdle,\\s*\\n\\s*equiperObjetsSorealIdle,").test(source),
  "estAdminSorealIdle doit être enregistré dans la table de dispatch IDLE_OPERATIONS pour être appelable depuis le client."
);

console.log("idle-est-admin: OK");
