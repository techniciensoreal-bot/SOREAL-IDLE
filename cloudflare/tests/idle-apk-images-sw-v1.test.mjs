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
fs.rmSync(tmp, { recursive: true, force: true });
console.log("idle-apk-images-sw-v1: OK");
