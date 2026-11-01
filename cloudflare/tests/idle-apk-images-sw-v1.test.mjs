import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

/*
 * Norman (2026-11-01) : « l'APK est lent : les images clignotent, il galère à charger ce qu'il a en mémoire ». Cause : le service worker (Worker du jeu) est arrêté par Android quand il est inactif, et chaque image réveillée attendait le démarrage complet du moteur (sql.js, base, graine).
 * Ici le VRAI service worker construit est exécuté avec de faux « self », « caches » et « fetch » : une image servie ne démarre JAMAIS le moteur (aucune lecture de la base ni du wasm), la seconde est rendue par le cache sans réveiller le Worker, et une route d'API (hors image) démarre bien le moteur (vérifié sur le code : lancer le vrai démarrage ici ferait charger sql.js).
 */
const source = fs.readFileSync(new URL("../local/sw-android.js", import.meta.url), "utf8");
assert.ok(source.includes("envLeger") && source.includes("repondreImage") && source.includes('req.destination === "image"'), "le service worker a un chemin léger pour les images");

/* Fluidité (2026-11-01) : contrôles du code, valables aussi sans esbuild. */
assert.ok(source.includes("BASE_COMPLETE_MS = 120000") && source.includes("async function gardeLigne") || source.includes("function gardeLigne"), "la ligne du joueur est gardée à part, la base entière rarement");
assert.ok(!/Date.now() - derniereSauvegarde < 4000/.test(source), "plus d'export de toute la base toutes les 4 s");
assert.ok(source.includes("if (estPush) await garde;"), "la ligne est écrite AVANT la réponse à un envoi de la page (elle efface alors sa copie)");
assert.ok(source.includes('p === "/api/v1/local/textes"') && source.includes("BATTEMENT_REEL_MS"), "routes inutiles hors ligne : réponse immédiate (textes) ou espacée (battement)");
assert.ok(source.includes("graine_texte_id") && source.includes("Promise.all(["), "réveil : graine mémoïsée par l'empreinte des octets, lectures en parallèle");
assert.ok(source.includes("x-garde-le") && !source.includes("if (!rafraichies.has(cle)) {"), "les images ne sont plus relues à chaque réveil");

/* esbuild n'est installé que sur le PC de Norman (cloudflare/local/node_modules, hors dépôt) : sans lui (CI), on s'en tient aux contrôles du code ci-dessus. */
try { createRequire(new URL("../local/package.json", import.meta.url))("esbuild"); }
catch (_e) { console.log("idle-apk-images-sw-v1: OK (contrôles du code seulement : esbuild absent)"); process.exit(0); }
const { construireWorker } = await import("../../android/code-apk.mjs");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sw-apk-"));
const sortie = path.join(tmp, "sw.js");
await construireWorker(sortie);

const appels = [];
const octetsImage = new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4]);
globalThis.fetch = async (u, init) => {
  const url = new URL(typeof u === "string" ? u : u.url, "https://appassets.example/");
  appels.push(url.pathname);
  if (url.pathname === "/__medias/_index.json") return new Response(JSON.stringify({ "shared/avatars/level-2/a.webp": octetsImage.length }), { status: 200, headers: { "content-type": "application/json" } });
  if (url.pathname.startsWith("/__medias/shared/avatars/")) return new Response(octetsImage, { status: 200, headers: { "content-type": "image/webp", "content-length": String(octetsImage.length) } });
  return new Response("absent", { status: 404 });
};
const magasin = new Map();
const cacheFaux = {
  async match(cle) { const r = magasin.get(cle); return r ? r.clone() : undefined; },
  async put(cle, rep) { magasin.set(cle, rep); },
  async keys() { return [...magasin.keys()]; },
  async delete(cle) { return magasin.delete(cle); }
};
globalThis.caches = { open: async () => cacheFaux, keys: async () => [], delete: async () => true };
const ecouteurs = {};
globalThis.self = { location: { origin: "https://appassets.example" }, addEventListener: (nom, f) => { ecouteurs[nom] = f; }, skipWaiting() {}, clients: { claim: async () => {} } };
await import(pathToFileURL(sortie).href + "?t=" + Date.now());
assert.equal(typeof ecouteurs.fetch, "function", "écouteur fetch installé");

function evenement(url, destination) {
  const req = new Request(url, { method: "GET" });
  Object.defineProperty(req, "destination", { value: destination });
  const attente = [];
  let reponse = null;
  return { request: req, respondWith(p) { reponse = Promise.resolve(p); }, waitUntil(p) { attente.push(Promise.resolve(p)); }, async fin() { const r = reponse ? await reponse : null; await Promise.all(attente); return r; } };
}
const IMAGE = "https://appassets.example/api/idle/media/shared?key=" + encodeURIComponent("shared/avatars/level-2/a.webp");

// 1) première image : servie par le Worker, SANS démarrer le moteur
{
  const ev = evenement(IMAGE, "image");
  ecouteurs.fetch(ev);
  const rep = await ev.fin();
  assert.ok(rep && rep.status === 200, "image servie (" + (rep && rep.status) + ")");
  assert.equal((await rep.arrayBuffer()).byteLength, octetsImage.length, "octets de l'image");
  assert.ok(!appels.some((p) => /sql-wasm|graine|__graine/.test(p)), "le moteur n'a pas démarré pour une image : " + appels.join(", "));
  assert.equal(magasin.size, 1, "l'image est gardée dans le cache");
}
// 2) deuxième vue : rendue par le cache tout de suite
{
  const avant = appels.length;
  const ev = evenement(IMAGE, "image");
  ecouteurs.fetch(ev);
  const rep = await ev.fin();
  assert.equal(rep.status, 200);
  assert.equal((await rep.arrayBuffer()).byteLength, octetsImage.length);
  assert.ok(!appels.slice(avant).some((p) => /sql-wasm|graine|__graine/.test(p)), "toujours sans moteur");
}
// 3) un appel du jeu (hors image) passe toujours par le démarrage du moteur (repondre sans l'option légère)
assert.ok(source.includes("async function repondre(requete, leger) {\n  const e = leger ? { env: envLeger() } : await init();"), "seules les images prennent le chemin léger");

/* ---- Partie fonctionnelle (le vrai moteur dans le service worker) : seulement si la graine du contenu est présente sur ce PC (desktop/graine/catalogue.json est hors dépôt : absente en CI). ---- */
const fichierGraine = new URL("../../desktop/graine/catalogue.json", import.meta.url);
const fichierWasm = new URL("../public/sql-wasm-v1.wasm", import.meta.url);
if (fs.existsSync(fichierGraine) && fs.existsSync(fichierWasm)) {
  const graineTexte = fs.readFileSync(fichierGraine);
  const wasm = fs.readFileSync(fichierWasm);
  const kv = new Map();
  let ecritures = [];
  globalThis.indexedDB = { open() {
    const r = {};
    setTimeout(() => {
      r.result = {
        createObjectStore() {}, close() {},
        transaction() {
          const t = {};
          t.objectStore = () => ({
            get(k) { const q = {}; setTimeout(() => { q.result = kv.get(k); q.onsuccess && q.onsuccess(); }, 0); return q; },
            put(v, k) { kv.set(k, v); ecritures.push(k); setTimeout(() => t.oncomplete && t.oncomplete(), 0); }
          });
          return t;
        }
      };
      r.onupgradeneeded && r.onupgradeneeded();
      r.onsuccess && r.onsuccess();
    }, 0);
    return r;
  } };
  const appelsF = [];
  globalThis.fetch = async (u) => {
    const url = new URL(typeof u === "string" ? u : u.url, "https://appassets.example/");
    appelsF.push(url.pathname);
    if (url.pathname === "/sql-wasm-v1.wasm") return new Response(wasm, { status: 200, headers: { "content-type": "application/wasm" } });
    if (url.pathname === "/graine-contenu-v1.json") return new Response(graineTexte, { status: 200, headers: { "content-type": "application/json" } });
    if (url.pathname === "/__medias/_index.json") return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
    return new Response("absent", { status: 404 });
  };
  /* Fichier .js sans package.json = CommonJS : le cache ignore la query ; une copie sous un autre nom donne un VRAI nouveau réveil (état en mémoire neuf). */
  let nbReveils = 0;
  const nouveauReveil = async () => { const f = path.join(tmp, "reveil-" + (nbReveils += 1) + ".js"); fs.copyFileSync(sortie, f); await import(pathToFileURL(f).href); };
  const appeler = async (methode, chemin, jeton, corps) => {
    const init = { method: methode, headers: { authorization: "Bearer " + jeton, "content-type": "application/json" } };
    if (corps !== undefined) init.body = JSON.stringify(corps);
    const req = new Request("https://appassets.example" + chemin, init);
    Object.defineProperty(req, "destination", { value: "" });
    const attente = []; let reponse = null;
    ecouteurs.fetch({ request: req, respondWith(p) { reponse = Promise.resolve(p); }, waitUntil(p) { attente.push(Promise.resolve(p)); } });
    const rep = await reponse; await Promise.all(attente);
    return rep.json();
  };
  // Réveil 1 : démarrage complet
  await nouveauReveil();
  { const ev = evenement("https://appassets.example/__pret", ""); ecouteurs.fetch(ev); const r = await ev.fin(); assert.equal(await r.text(), "ok", "le moteur démarre dans le service worker"); }
  const jeton = kv.get("session").token;
  assert.ok(kv.has("sqlite"), "premier démarrage : base gardée");
  const exp = await appeler("GET", "/api/v1/local/export?appareil=essai", jeton);
  assert.equal(exp.ok, true, "export du joueur local : " + JSON.stringify(exp).slice(0, 200));
  ecritures = [];
  // plusieurs envois de la page : seule la ligne est écrite, jamais la base entière
  let cells = JSON.parse(exp.joueurs.ligne);
  for (let i = 1; i <= 3; i += 1) {
    cells = cells.slice();
    cells[15] = new Date(Date.now() + i * 1000).toISOString();
    cells[20] = String(1000 + i);
    const r = await appeler("POST", "/api/v1/local/push", jeton, { cells, flux: [], gains: [], appareil: "essai", depuis: exp.serveurAt, rev: i });
    assert.equal(r.ok, true, "envoi accepté : " + JSON.stringify(r).slice(0, 200));
    assert.equal(r.ecrit, true);
    assert.equal(JSON.parse(kv.get("lignes").find((l) => l[0] === exp.joueurs.index)[1])[20], String(1000 + i), "la ligne gardée est celle qui vient d'être envoyée (avant la réponse)");
  }
  assert.ok(!ecritures.includes("sqlite"), "un envoi de la page n'exporte plus toute la base : " + ecritures.join(","));
  assert.equal(ecritures.filter((k) => k === "lignes").length, 3, "une écriture de ligne par envoi");
  // textes : réponse immédiate
  const tx = await appeler("GET", "/api/v1/local/textes", jeton);
  assert.equal(tx.ok, false);
  // battement : le premier (amorce) est réel, le suivant (dans les 90 s) rend la dernière réponse sans événements
  const b1 = await appeler("POST", "/api/v1/call", jeton, { operation: "battementSorealIdle", args: [jeton, { amorceFlux: true, connecte: true }] });
  assert.equal(b1.ok, true, "battement réel : " + JSON.stringify(b1).slice(0, 200));
  const b2 = await appeler("POST", "/api/v1/call", jeton, { operation: "battementSorealIdle", args: [jeton, { amorceFlux: false, connecte: true, apresFlux: 0 }] });
  assert.equal(b2.ok, true);
  assert.deepEqual(b2.enLigne, b1.enLigne, "présence conservée entre deux battements espacés");
  assert.deepEqual(b2.flux, []);
  // Réveil 2 (le service worker a été tué ; la base entière gardée est ANCIENNE, les lignes sont à jour) : la dernière partie envoyée est retrouvée
  ecritures = [];
  appelsF.length = 0;
  await nouveauReveil();
  { const ev = evenement("https://appassets.example/__pret", ""); ecouteurs.fetch(ev); await ev.fin(); }
  const exp2 = await appeler("GET", "/api/v1/local/export?appareil=essai", jeton);
  assert.equal(exp2.ok, true, "le même jeton fonctionne après le réveil : " + JSON.stringify(exp2).slice(0, 200));
  assert.equal(Number(JSON.parse(exp2.joueurs.ligne)[20]), 1003, "la partie envoyée est retrouvée au réveil sans copie complète récente");
  assert.ok(!ecritures.includes("sqlite"), "le réveil à l'identique ne ré-exporte pas la base : " + ecritures.join(","));
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log("idle-apk-images-sw-v1: OK");
