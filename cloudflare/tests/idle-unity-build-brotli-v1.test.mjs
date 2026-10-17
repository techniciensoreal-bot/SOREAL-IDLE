// Client Unity (/unity/) : le Worker sert les fichiers .br du build avec Content-Encoding: br (le .wasm brut depasse les 25 Mio des assets).
import assert from "node:assert/strict";
import { servirBuildUnityBrotliV1 } from "../src/idle-worker-entry-v1.js";

const octets = new Uint8Array([1, 2, 3]);
const demandes = [];
const env = { ASSETS: { async fetch(req) { demandes.push(new URL(req.url).pathname); return new Response(octets, { status: 200, headers: { ETag: '"abc"' } }); } } };
const url = (p) => new URL("https://exemple.test" + p);
const req = (p, methode = "GET") => new Request(url(p), { method: methode });

let r = await servirBuildUnityBrotliV1(req("/unity/Build/WebGL.wasm.br"), env, url("/unity/Build/WebGL.wasm.br"));
assert.equal(r.status, 200);
assert.equal(r.headers.get("Content-Encoding"), "br");
assert.equal(r.headers.get("Content-Type"), "application/wasm");
assert.equal(r.headers.get("ETag"), '"abc"');
assert.ok(true);
assert.deepEqual(demandes, ["/unity/_br/WebGL.wasm.bin"]);

r = await servirBuildUnityBrotliV1(req("/unity/Build/WebGL.framework.js.br"), env, url("/unity/Build/WebGL.framework.js.br"));
assert.equal(r.headers.get("Content-Type"), "application/javascript");
r = await servirBuildUnityBrotliV1(req("/unity/Build/WebGL.data.br"), env, url("/unity/Build/WebGL.data.br"));
assert.equal(r.headers.get("Content-Type"), "application/octet-stream");

// Autres chemins, autres noms ou autre methode : jamais servis ici (pas de lecture arbitraire dans les assets).
for (const p of ["/unity/Build/../index.html.br", "/unity/Build/Autre.wasm.br", "/unity/_br/WebGL.wasm.bin", "/modules/x.br", "/unity/Build/WebGL.wasm"]) {
  assert.equal(await servirBuildUnityBrotliV1(req(p), env, url(p)), null, p);
}
assert.equal(await servirBuildUnityBrotliV1(req("/unity/Build/WebGL.wasm.br", "POST"), env, url("/unity/Build/WebGL.wasm.br")), null);

// Fichier absent : 404, pas d'erreur.
const vide = { ASSETS: { async fetch() { return new Response("", { status: 404 }); } } };
r = await servirBuildUnityBrotliV1(req("/unity/Build/WebGL.wasm.br"), vide, url("/unity/Build/WebGL.wasm.br"));
assert.equal(r.status, 404);
console.log("idle-unity-build-brotli-v1 OK");
// Le corps est deja compresse : la reponse doit declarer encodeBody "manual" (sinon le runtime Cloudflare le compresse une 2e fois et Unity ne peut plus lire le fichier).
import { readFileSync } from "node:fs";
assert.match(readFileSync(new URL("../src/idle-worker-entry-v1.js", import.meta.url), "utf8"), /encodeBody:\s*"manual"/);
console.log("encodeBody manual OK");
