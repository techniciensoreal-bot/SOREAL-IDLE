// Norman (2026-10-29) : « Failed to fetch quand je veux générer » (aucune génération de voix ne marche dans l'exe) : l'envoi vers le serveur passe par le processus principal ; une erreur y devenait un « Failed to fetch » muet. Désormais : pile réseau de Chromium, raison lisible renvoyée à la page, petit journal.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";
const DEPOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const L = await import(pathToFileURL(path.join(DEPOT, "desktop", "src", "liaison.mjs")).href);

// la raison d'un échec réseau est conservée (message et code de la cause)
const echec = async () => { const e = new TypeError("fetch failed"); e.cause = { code: "UNABLE_TO_VERIFY_LEAF_SIGNATURE" }; throw e; };
const r = await L.transmettre({ urlBase: "https://exemple.invalid", jeton: "x", methode: "POST", chemin: "/api/v1/voice-upload", recherche: "?h=1", corps: Buffer.from("a"), fetchFn: echec });
assert.equal(r, null, "échec réseau : null (la page reçoit une erreur)");
assert.match(L.derniereErreurTransmission, /fetch failed.*UNABLE_TO_VERIFY_LEAF_SIGNATURE/, "raison conservée : " + L.derniereErreurTransmission);
assert.equal(L.estRouteAdmin("/api/v1/voice-upload"), true); assert.equal(L.estRouteAdmin("/api/v1/call"), false);
// une réponse normale n'est pas touchée ; un 401 reste « liaison refusée »
const ok = await L.transmettre({ urlBase: "https://exemple.invalid", jeton: "x", methode: "POST", chemin: "/api/v1/voice-upload", corps: Buffer.from("a"), fetchFn: async () => new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }) });
assert.equal(ok.reponse.status, 200);
assert.deepEqual(await L.transmettre({ urlBase: "https://exemple.invalid", jeton: "x", methode: "POST", chemin: "/api/v1/voice-upload", corps: Buffer.from("a"), fetchFn: async () => new Response("", { status: 401 }) }), { expiree: true });

// câblage dans le cœur : Chromium (net.fetch), JSON lisible pour les routes d'administration, journal
const coeur = fs.readFileSync(path.join(DEPOT, "desktop", "coeur.js"), "utf8");
assert.ok(coeur.includes("fetchFn: (u, o) => net.fetch(u, Object.assign({}, o, { bypassCustomProtocolHandlers: true }))"), "envoi par la pile réseau de Chromium");
assert.ok(coeur.includes("Impossible d'envoyer au serveur : ") && coeur.includes("Le serveur refuse la liaison de ce compte") && coeur.includes("status: r && r.expiree ? 401 : 502"), "la page reçoit la raison");
assert.ok(coeur.includes("liaison-diagnostic.log") && coeur.includes("function journalLiaison_(ligne)"), "journal des envois d'administration");
console.log("idle-desktop-liaison-diagnostic-v1 : OK");
