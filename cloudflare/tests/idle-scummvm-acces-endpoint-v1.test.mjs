/* POST /api/v1/scummvm-acces (idle-worker-entry-v1.js) : session absente = refus ; compte non autorisé = autorise:false sans jeton ; autorisé = jeton qui ouvre les fichiers (bout en bout sur le Worker, Durable Object simulé). */
import assert from "node:assert/strict";
import fs from "node:fs";
import worker, { idleReinitialiserLimitesV1 } from "../src/idle-worker-entry-v1.js";
import { idleScummvmOublierMemoAccesV1 } from "../src/idle-scummvm-acces-v1.js";
import { idleScummvmOublierMemoV1 } from "../src/idle-scummvm-v1.js";

const SESSIONS = {
  "session-norman": { ok: true, email: "norman@exemple.test", emails: ["norman@exemple.test"], admin: true },
  "session-autre": { ok: true, email: "autre@exemple.test", emails: ["autre@exemple.test"], admin: false },
  "session-listee": { ok: true, email: "listee@exemple.test", emails: ["listee@exemple.test"], admin: false },
};
const objets = {
  "scummvm/ouvert": "1",
  "scummvm/acces.json": JSON.stringify({ admins: true, comptes: ["listee@exemple.test"], tous: false }),
  "scummvm/jeux.json": '{"jeux":[]}',
  "scummvm/moteur/scummvm.wasm": "0123456789",
};
const appelsDO = [];
const env = {
  SOREAL_R2: {
    async head(cle) { return cle in objets ? { size: objets[cle].length } : null; },
    async get(cle, o) { if (!(cle in objets)) return null; const t = objets[cle]; return { async text() { return t; }, body: new Blob([o && o.range ? t.slice(o.range.offset, o.range.offset + o.range.length) : t]).stream() }; },
  },
  SOREAL_IDLE: {
    idFromName: () => "global",
    get: () => ({
      async fetch(rq) {
        const chemin = new URL(rq.url).pathname; appelsDO.push(chemin);
        const corps = await rq.json().catch(() => ({}));
        if (chemin === "/__soreal-idle-v1/scummvm-secret") return Response.json({ ok: true, secret: "b".repeat(64) });
        if (chemin === "/__soreal-idle-v1/scummvm-acces") return Response.json(SESSIONS[corps.sessionToken] || { ok: false, error: "IDLE_SESSION_INVALID" });
        return Response.json({ ok: false }, { status: 404 });
      },
    }),
  },
};
const post = (jeton, extra = {}) => worker.fetch(new Request("https://x.test/api/v1/scummvm-acces", { method: "POST", headers: jeton ? { authorization: "Bearer " + jeton, ...extra } : extra, body: "{}" }), env);
const reinit = () => { idleScummvmOublierMemoAccesV1(); idleScummvmOublierMemoV1(); idleReinitialiserLimitesV1(); };

reinit();
// session absente / invalide : refus (jamais de jeton)
let r = await post("");
assert.equal(r.status, 401); assert.equal((await r.json()).jeton, undefined);
r = await post("session-inconnue");
assert.equal(r.status, 401); assert.equal((await r.json()).jeton, undefined, "session invalide : refus");
// seule la méthode POST
r = await worker.fetch(new Request("https://x.test/api/v1/scummvm-acces", { method: "GET", headers: { authorization: "Bearer session-norman" } }), env);
assert.equal(r.status, 404, "GET : rien");

// compte non autorisé : autorise:false, aucun jeton
r = await post("session-autre");
let j = await r.json();
assert.equal(r.status, 200); assert.deepEqual(j, { ok: true, autorise: false }, "un autre joueur : autorise:false sans jeton");
assert.equal(r.headers.get("cache-control"), "no-store");

// administrateur et compte listé : jeton
r = await post("session-norman"); j = await r.json();
assert.equal(j.ok, true); assert.equal(j.autorise, true); assert.ok(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(j.jeton), "jeton sûr pour un segment d'URL");
assert.ok(j.expire > Date.now() / 1000 + 12 * 3600 - 1 && j.expire <= Date.now() / 1000 + 24 * 3600 + 1, "expiration : 12 à 24 h");
const jetonNorman = j.jeton;
r = await post("session-listee"); j = await r.json();
assert.equal(j.autorise, true, "compte de la liste"); const jetonListe = j.jeton;
assert.notEqual(jetonListe, jetonNorman);
r = await post("session-norman"); assert.equal((await r.json()).jeton, jetonNorman, "même jeton dans la tranche (cache du navigateur)");

// bout en bout : le jeton ouvre les fichiers, sans lui 404, et le compte autorisé est relu dans la liste
const fichier = (jeton, chemin) => worker.fetch(new Request("https://x.test/api/idle/scummvm/" + (jeton ? jeton + "/" : "") + chemin, { headers: { range: "bytes=2-4" } }), env);
r = await fichier(jetonNorman, "moteur/scummvm.wasm");
assert.equal(r.status, 206); assert.equal(await r.text(), "234");
assert.ok(r.headers.get("cache-control").startsWith("private"), "cache privé");
assert.equal((await fichier("", "moteur/scummvm.wasm")).status, 404, "sans jeton : 404");
assert.equal((await worker.fetch(new Request("https://x.test/api/idle/scummvm/ouvert"), env)).status, 404, "plus de point public /ouvert");
assert.equal((await worker.fetch(new Request("https://x.test/data/index.json"), env)).status, 404, "chemin absolu du moteur sans Referer : 404");
r = await worker.fetch(new Request("https://x.test/data/index.json", { headers: { referer: "https://x.test/api/idle/scummvm/" + jetonNorman + "/moteur/scummvm.html" } }), env);
assert.equal(r.status, 404, "avec Referer valide : le fichier n'existe pas dans ce R2 de test, mais l'accès est accepté (404 d'absence, pas de refus)");
objets["scummvm/moteur/data/index.json"] = "{}";
r = await worker.fetch(new Request("https://x.test/data/index.json", { headers: { referer: "https://x.test/api/idle/scummvm/" + jetonNorman + "/moteur/scummvm.html" } }), env);
assert.equal(r.status, 200, "chemin absolu du moteur + Referer valide : 200");

// la liste change : le compte retiré perd ses fichiers (après le mémo de 30 s)
objets["scummvm/acces.json"] = JSON.stringify({ admins: true, comptes: [], tous: false });
idleScummvmOublierMemoAccesV1();
assert.equal((await fichier(jetonListe, "jeux.json")).status, 404, "compte retiré de la liste : 404");
r = await post("session-listee"); assert.deepEqual(await r.json(), { ok: true, autorise: false }, "et plus de jeton");
assert.equal((await fichier(jetonNorman, "jeux.json")).status, 206, "l administrateur garde l acces");
// ouvert à tous (plus tard)
objets["scummvm/acces.json"] = JSON.stringify({ admins: true, comptes: [], tous: true });
idleScummvmOublierMemoAccesV1();
r = await post("session-autre"); assert.equal((await r.json()).autorise, true, "tous:true");
// interrupteur général fermé : personne, même l'administrateur
delete objets["scummvm/ouvert"];
idleScummvmOublierMemoAccesV1(); idleScummvmOublierMemoV1();
r = await post("session-norman"); assert.deepEqual(await r.json(), { ok: true, autorise: false }, "interrupteur fermé : autorise:false");
assert.equal((await fichier(jetonNorman, "jeux.json")).status, 404, "interrupteur fermé : 404");

// limite de débit par jeton de session
reinit(); objets["scummvm/ouvert"] = "1";
let limites = 0;
for (let i = 0; i < 20; i++) { const x = await post("session-norman"); if (x.status === 429) limites++; }
assert.ok(limites > 0, "rafale de demandes : limitée (429)");

// CORS de l'application Android : seule cette origine, et la route est dans la liste
reinit();
r = await worker.fetch(new Request("https://x.test/api/v1/scummvm-acces", { method: "OPTIONS", headers: { origin: "https://appassets.androidplatform.net" } }), env);
assert.equal(r.status, 204);
assert.equal(r.headers.get("access-control-allow-origin"), "https://appassets.androidplatform.net");
r = await worker.fetch(new Request("https://x.test/api/v1/scummvm-acces", { method: "POST", headers: { origin: "https://autre.test", authorization: "Bearer session-norman" }, body: "{}" }), env);
assert.equal(r.headers.get("access-control-allow-origin"), null, "autre origine : aucun en-tête CORS");

// Durable Object : routes internes présentes, clé hors des sauvegardes (lecture du code)
const coord = fs.readFileSync(new URL("../src/index-idle-coordinator-v1.js", import.meta.url), "utf8");
assert.ok(coord.includes('"/__soreal-idle-v1/scummvm-acces"') && coord.includes('"/__soreal-idle-v1/scummvm-secret"'), "routes internes du coordinateur");
assert.ok(/WHERE meta_key<>'scummvm_secret_v1'/.test(coord), "la clé de signature n'est jamais écrite dans la sauvegarde");
assert.ok(coord.includes("estAdminSorealIdle"), "l'administrateur est reconnu par la même opération que les outils d'administration");
// application de bureau : la demande de jeton est relayée au serveur
assert.ok(fs.readFileSync(new URL("../../desktop/src/liaison.mjs", import.meta.url), "utf8").includes('"/api/v1/scummvm-acces"'), "exe : route relayée");

console.log("idle-scummvm-acces-endpoint-v1: OK");
