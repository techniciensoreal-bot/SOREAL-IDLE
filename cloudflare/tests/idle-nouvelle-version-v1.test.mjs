import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Bannière « nouvelle version disponible » (Norman, 2026-10-01) : comparaison des fichiers versionnés de index.html, jamais de rechargement auto. */
const src = readFileSync("cloudflare/public/modules/nouvelle-version-v1.js", "utf8");
const sandbox = { window: {}, document: { addEventListener() {}, querySelectorAll() { return []; } }, setInterval() {}, setTimeout() {}, location: {}, fetch() {} };
vm.runInNewContext(src, sandbox);
const { signature } = sandbox.window.__SOREAL_IDLE_NOUVELLE_VERSION_V1__;
const a = '<link rel="stylesheet" href="/a.css?v=1"><script defer src="/x.js?v=2"></script><script src="/sans-version.js"></script>';
const b = '<script defer src="/x.js?v=2"></script><link rel="stylesheet" href="/a.css?v=1">';
const c = '<link rel="stylesheet" href="/a.css?v=1"><script defer src="/x.js?v=3"></script>';
assert.equal(signature(a), signature(b), "l'ordre et les fichiers sans version sont ignorés");
assert.notEqual(signature(a), signature(c), "un numéro de version changé est détecté");
assert.ok(!/location\.reload\(\)/.test(src.replace(/addEventListener\('click',function\(\)\{location\.reload\(\);\}\)/, "")), "pas de rechargement automatique");
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/nouvelle-version-v1.js"));
console.log("idle-nouvelle-version-v1 OK");
