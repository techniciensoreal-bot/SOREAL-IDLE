/* Route R2 de ScummVM (idle-scummvm-v1.js) : clés sûres, types, cache, requêtes partielles, ETag, méthodes, branchement dans le Worker, outil d'envoi (miroir local). */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { idleScummvmAliasV1, idleScummvmCleV1, idleScummvmIntervalleV1, idleScummvmOublierMemoV1, idleScummvmOuvertV1, idleScummvmRepondreV1 } from "../src/idle-scummvm-v1.js";

// 1. clés : seules les clés sûres passent, toujours sous le préfixe scummvm/
assert.equal(idleScummvmCleV1("moteur/scummvm.wasm"), "scummvm/moteur/scummvm.wasm");
assert.equal(idleScummvmCleV1("jeux/BASS-Floppy-1.3/sky.dsk"), "scummvm/jeux/BASS-Floppy-1.3/sky.dsk");
assert.equal(idleScummvmCleV1("jeux.json"), "scummvm/jeux.json");
assert.equal(idleScummvmCleV1("moteur//data/plugins/libsky.so"), "scummvm/moteur/data/plugins/libsky.so", "barres doublées du moteur ramenées à une");
for (const mauvaise of ["", "../secret", "moteur/../../x", "moteur/%2e%2e/x", "/abs", "dossier/", "a\\b", "a/\u0000b", "a/b?c", "a/b#c", "a/..", "a/./b", "%E0%A4%A", "x".repeat(400)]) {
  assert.equal(idleScummvmCleV1(mauvaise), null, "refusée : " + JSON.stringify(mauvaise).slice(0, 40));
}

// 1b. chemins absolus du moteur aliasés vers scummvm/moteur/
assert.equal(idleScummvmAliasV1("/data/index.json"), "/api/idle/scummvm/moteur/data/index.json");
assert.equal(idleScummvmAliasV1("/data/plugins/libsky.so"), "/api/idle/scummvm/moteur/data/plugins/libsky.so");
assert.equal(idleScummvmAliasV1("/scummvm.ini"), "/api/idle/scummvm/moteur/scummvm.ini");
for (const autre of ["/", "/index.html", "/api/v1/call", "/database/x", "/datax/y", "/scummvm.js"]) assert.equal(idleScummvmAliasV1(autre), null, autre);
assert.ok(fs.readFileSync(new URL("../src/idle-worker-entry-v1.js", import.meta.url), "utf8").includes("idleScummvmAliasV1(url.pathname)"), "alias branché dans le Worker");
assert.ok(fs.readFileSync(new URL("../tools/local-dev-server.mjs", import.meta.url), "utf8").includes("bytes=(" + String.fromCharCode(92) + "d*)"), "regex Range du serveur local intacte (l'antislash ne doit pas être perdu)");

// 2. intervalles
assert.equal(idleScummvmIntervalleV1(null, 100), null);
assert.deepEqual(idleScummvmIntervalleV1("bytes=0-9", 100), { offset: 0, length: 10 });
assert.deepEqual(idleScummvmIntervalleV1("bytes=90-", 100), { offset: 90, length: 10 });
assert.deepEqual(idleScummvmIntervalleV1("bytes=-10", 100), { offset: 90, length: 10 });
assert.deepEqual(idleScummvmIntervalleV1("bytes=50-5000", 100), { offset: 50, length: 50 });
for (const mauvais of ["bytes=100-200", "bytes=9-3", "bytes=-0", "bytes=", "items=0-1", "bytes=0-1,5-6"]) assert.equal(idleScummvmIntervalleV1(mauvais, 100), "invalide", mauvais);

// 3. R2 simulé
const contenu = { "scummvm/ouvert": Buffer.from("1"), "scummvm/moteur/scummvm.wasm": Buffer.from("0123456789".repeat(10)), "scummvm/jeux.json": Buffer.from('{"jeux":[]}'), "scummvm/jeux/g/a.dsk": Buffer.from("abc") };
let lectures = 0;
const R2 = {
  async head(cle) { const b = contenu[cle]; return b ? { size: b.length, httpEtag: '"e' + b.length + '"' } : null; },
  async get(cle, o) { lectures++; const b = contenu[cle]; if (!b) return null; const t = o && o.range ? b.subarray(o.range.offset, o.range.offset + o.range.length) : b; return { body: new Blob([t]).stream() }; }
};
const env = { SOREAL_R2: R2 };

// 2b. INTERRUPTEUR : fermé sans l'objet scummvm/ouvert (tout en 404, le client reçoit ouvert:false), ouvert dès qu'il existe
{
  const sans = { SOREAL_R2: { ...R2, async head(cle) { return cle === "scummvm/ouvert" ? null : R2.head(cle); } } };
  idleScummvmOublierMemoV1();
  for (const chemin of ["moteur/scummvm.wasm", "jeux.json", "jeux/g/a.dsk"]) {
    const rr = await idleScummvmRepondreV1(new Request("https://x.test/api/idle/scummvm/" + chemin), sans, new URL("https://x.test/api/idle/scummvm/" + chemin));
    assert.equal(rr.status, 404, "fermé : " + chemin + " introuvable pour les joueurs");
  }
  const etat = await idleScummvmRepondreV1(new Request("https://x.test/api/idle/scummvm/ouvert"), sans, new URL("https://x.test/api/idle/scummvm/ouvert"));
  assert.deepEqual(await etat.json(), { ouvert: false });
  assert.equal(etat.headers.get("cache-control"), "no-store");
  assert.equal(await idleScummvmOuvertV1({}), false, "pas de R2 : fermé");
  assert.equal(await idleScummvmOuvertV1({ SOREAL_R2: { head: async () => { throw new Error("panne"); } } }, 9e12), false, "erreur R2 : fermé, jamais d'exception");
  idleScummvmOublierMemoV1();
  const ouvert = await idleScummvmRepondreV1(new Request("https://x.test/api/idle/scummvm/ouvert"), env, new URL("https://x.test/api/idle/scummvm/ouvert"));
  assert.deepEqual(await ouvert.json(), { ouvert: true });
  /* mémo : un changement d'état est vu après 30 s, pas avant */
  idleScummvmOublierMemoV1();
  assert.equal(await idleScummvmOuvertV1(env, 1_000_000), true);
  assert.equal(await idleScummvmOuvertV1(sans, 1_010_000), true, "mémo de 30 s");
  assert.equal(await idleScummvmOuvertV1(sans, 1_031_000), false, "après 30 s : fermé");
  idleScummvmOublierMemoV1();
}
const req = (chemin, init = {}) => new Request("https://x.test/api/idle/scummvm/" + chemin, init);
const appeler = (chemin, init) => idleScummvmRepondreV1(req(chemin, init), env, new URL("https://x.test/api/idle/scummvm/" + chemin));

let r = await appeler("moteur/scummvm.wasm");
assert.equal(r.status, 200);
assert.equal(r.headers.get("content-type"), "application/wasm");
assert.equal(r.headers.get("cache-control"), "public, max-age=604800", "moteur : gardé une semaine");
assert.equal(r.headers.get("accept-ranges"), "bytes");
assert.equal((await r.arrayBuffer()).byteLength, 100);

r = await appeler("jeux.json");
assert.equal(r.headers.get("cache-control"), "no-cache", "catalogue : revalidé");
assert.equal(r.headers.get("content-type"), "application/json; charset=utf-8");
r = await appeler("jeux/g/a.dsk");
assert.equal(r.headers.get("cache-control"), "no-cache", "un jeu remplacé est pris tout de suite");
assert.equal(r.headers.get("content-type"), "application/octet-stream");

r = await appeler("moteur/scummvm.wasm", { headers: { range: "bytes=10-19" } });
assert.equal(r.status, 206);
assert.equal(r.headers.get("content-range"), "bytes 10-19/100");
assert.equal(Buffer.from(await r.arrayBuffer()).toString(), "0123456789");
r = await appeler("moteur/scummvm.wasm", { headers: { range: "bytes=500-600" } });
assert.equal(r.status, 416);
assert.equal(r.headers.get("content-range"), "bytes */100");

r = await appeler("moteur/scummvm.wasm", { headers: { "if-none-match": '"e100"' } });
assert.equal(r.status, 304, "ETag identique : 304, rien retéléchargé");
const avant = lectures;
r = await appeler("moteur/scummvm.wasm", { method: "HEAD" });
assert.equal(r.status, 200);
assert.equal(r.headers.get("content-length"), "100");
assert.equal(lectures, avant, "HEAD ne lit pas le contenu");

assert.equal((await appeler("moteur/absent.js")).status, 404);
assert.equal((await appeler("../x")).status, 400);
assert.equal((await appeler("jeux.json", { method: "POST", body: "x" })).status, 405);
assert.equal((await idleScummvmRepondreV1(req("jeux.json"), {}, new URL("https://x.test/api/idle/scummvm/jeux.json"))).status, 404, "pas de R2 : fermé (404), jamais d'exception");

// 4. branchement dans le Worker : route publique GET/HEAD avec limite par adresse
const worker = fs.readFileSync(new URL("../src/idle-worker-entry-v1.js", import.meta.url), "utf8");
assert.ok(worker.includes("idleScummvmRepondreV1(request, env,") && worker.includes("IDLE_SCUMMVM_PREFIXE_URL_V1"), "route branchée dans le Worker");
assert.ok(/idleLimiteDepasseeV1\("scummvm:"/.test(worker), "limite par adresse");

// 5. outil d'envoi vers un miroir local : index.json générés, page du moteur sans Sentry, catalogue validé
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scummvm-test-"));
try {
  const moteur = path.join(tmp, "moteur"); fs.mkdirSync(path.join(moteur, "data", "plugins"), { recursive: true });
  fs.writeFileSync(path.join(moteur, "scummvm.html"), '<html><script>window.__SENTRY_CFG__={dsn:"x"};</script><script src="sentry.bundle.js"></script><body>ok</body></html>');
  fs.writeFileSync(path.join(moteur, "scummvm.js"), "1"); fs.writeFileSync(path.join(moteur, "scummvm.wasm"), "22");
  fs.writeFileSync(path.join(moteur, "data", "a.dat"), "333"); fs.writeFileSync(path.join(moteur, "data", "plugins", "libx.so"), "4444");
  const jeu = path.join(tmp, "MonJeu"); fs.mkdirSync(path.join(jeu, "sous"), { recursive: true });
  fs.writeFileSync(path.join(jeu, "x.dat"), "12345"); fs.writeFileSync(path.join(jeu, "sous", "y.dat"), "1");
  const miroir = path.join(tmp, "miroir");
  const outil = fileURLPath("../tools/scummvm-envoyer.mjs");
  const lancer = (...a) => spawnSync(process.execPath, [outil, ...a], { encoding: "utf8" });
  let p = lancer("moteur", moteur, "--local", miroir); assert.equal(p.status, 0, p.stderr);
  const html = fs.readFileSync(path.join(miroir, "scummvm", "moteur", "scummvm.html"), "utf8");
  assert.ok(!/sentry/i.test(html) && html.includes("ok"), "le rapport d'erreurs tiers est retiré de la page du moteur");
  const di = JSON.parse(fs.readFileSync(path.join(miroir, "scummvm", "moteur", "data", "index.json"), "utf8"));
  assert.deepEqual(di.games, { baseUrl: "/api/idle/scummvm/jeux" }, "les jeux sont lus depuis notre route");
  assert.equal(di["a.dat"], 3);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(miroir, "scummvm", "moteur", "data", "plugins", "index.json"), "utf8")), { "libx.so": 4 });
  p = lancer("jeu", jeu, "--local", miroir); assert.equal(p.status, 0, p.stderr);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(miroir, "scummvm", "jeux", "MonJeu", "index.json"), "utf8")), { "sous": { "y.dat": 1 }, "x.dat": 5 });
  assert.ok(fs.existsSync(path.join(miroir, "scummvm", "jeux", "MonJeu", "sous", "index.json")));
  const bon = path.join(tmp, "jeux.json"); fs.writeFileSync(bon, JSON.stringify({ jeux: [{ id: "a", nom: "A", dossier: "MonJeu", cible: "sky", difficulte: "normal" }] }));
  p = lancer("catalogue", bon, "--local", miroir); assert.equal(p.status, 0, p.stderr);
  assert.ok(fs.existsSync(path.join(miroir, "scummvm", "jeux.json")));
  const mauvais = path.join(tmp, "mauvais.json"); fs.writeFileSync(mauvais, JSON.stringify({ jeux: [{ id: "a", nom: "A", dossier: "d", cible: "c", difficulte: "facile" }] }));
  assert.notEqual(lancer("catalogue", mauvais, "--local", miroir).status, 0, "difficulté inconnue refusée");
  p = lancer("jeu", jeu, "--nom", "../mal", "--local", miroir); assert.notEqual(p.status, 0, "nom de dossier invalide refusé");
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }

function fileURLPath(rel) { return new URL(rel, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"); }
console.log("idle-scummvm-route-v1: OK");
