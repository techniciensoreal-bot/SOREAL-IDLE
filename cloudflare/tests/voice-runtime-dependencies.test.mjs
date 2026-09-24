import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  collectImportMapModules,
  collectIntegrityScripts,
  collectNeuralModuleAssets,
  collectModelUpstream,
  collectOrtCompanionFiles,
  collectVoiceRuntimeDependencies,
  validatePiperModelConfig,
  computeIntegrity
} from "../tools/voice-runtime-dependencies.mjs";

/*
 * 2026-09-24 : le workflow de production vérifiait encore piper-plus, @piper-plus/g2p, le modèle multilingue, Siwis et Gilles
 * (pipeline V1-V9 retiré) alors que le frontend charge onnxruntime-web, @diffusionstudio/piper-wasm et le modèle Tom, et il le
 * faisait APRÈS le déploiement. La liste est maintenant calculée depuis les vraies sources, contrôlée avant le déploiement, et ce
 * test (hors ligne, déterministe) verrouille l'extraction et l'ordre des étapes.
 */
const read = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8");
const indexHtml = read("../public/index.html");
const neural = read("../public/modules/local-neural-piper-v1.js");
const media = readFileSync(new URL("../src/idle-media-v1.js", import.meta.url)).toString("utf8");
const workflow = read("../../.github/workflows/cloudflare-deploy.yml");

// --- Extraction sur les vraies sources ---
const deps = collectVoiceRuntimeDependencies({ indexHtml, neuralModuleSource: neural, mediaSource: media });
const byKind = (kind) => deps.filter((d) => d.kind === kind);

const ort = byKind("esm");
assert.equal(ort.length, 1, "un seul module ES externe (onnxruntime-web)");
assert.equal(ort[0].name, "onnxruntime-web");
assert.ok(/^https:\/\/cdn\.jsdelivr\.net\/npm\/onnxruntime-web@\d+\.\d+\.\d+\/dist\/ort\.min\.mjs$/.test(ort[0].url), "URL ONNX Runtime versionnée exactement : " + ort[0].url);

const sri = byKind("script-sri");
assert.ok(sri.some((d) => /piper_phonemize\.js$/.test(d.url) && /^sha384-[A-Za-z0-9+/=]+$/.test(d.integrity)), "piper_phonemize.js et son empreinte SRI sont détectés");

const assets = byKind("asset").map((d) => d.url);
assert.ok(assets.some((u) => /piper_phonemize\.wasm$/.test(u)) && assets.some((u) => /piper_phonemize\.data$/.test(u)), "wasm et data de piper_phonemize détectés");

const model = byKind("model")[0];
assert.ok(model && /fr_FR-tom-medium\.onnx$/.test(model.url), "le modèle amont est la voix Tom");
assert.equal(byKind("model-config")[0].url, model.url + ".json");

// --- Politique : aucun script externe sans Subresource Integrity dans index.html ---
{
  const html = indexHtml.replace(/<!--[\s\S]*?-->/g, "");
  const external = [...html.matchAll(/<script\b[^>]*\bsrc="(https:\/\/[^"]+)"[^>]*>/gi)];
  for (const m of external) {
    assert.ok(/\bintegrity="sha(256|384|512)-/.test(m[0]), "script externe sans integrity : " + m[1]);
  }
}

// --- Cohérence : tout ce que le module vocal télécharge est couvert ---
for (const m of neural.matchAll(/"(https:\/\/[^"]+)"/g)) {
  assert.ok(deps.some((d) => d.url === m[1]), "URL du module vocal non vérifiée par la CI : " + m[1]);
}

// --- Workflow : plus d'ancien pipeline, et contrôle AVANT le déploiement ---
for (const obsolete of ["piper-plus", "@piper-plus/g2p", "multilingual-test-medium", "siwis", "gilles"]) {
  assert.ok(!workflow.toLowerCase().includes(obsolete), "le workflow référence encore l'ancien pipeline vocal : " + obsolete);
}
const verifyAt = workflow.indexOf("node cloudflare/tools/verify-voice-runtime-dependencies.mjs");
const deployAt = workflow.indexOf("wrangler@4.127.1 deploy");
assert.ok(verifyAt > 0, "le workflow doit lancer verify-voice-runtime-dependencies.mjs");
assert.ok(deployAt > 0 && verifyAt < deployAt, "le contrôle des dépendances vocales doit précéder le déploiement");
assert.ok(workflow.indexOf("idle-piper-production-origin.smoke.mjs") > deployAt, "le smoke Chromium réel reste après le déploiement");

// --- Unités des extracteurs ---
assert.deepEqual(collectImportMapModules('<!-- <script type="importmap">{ cassé }</script> --><script type="importmap">{"imports":{"a":"https://x.test/a.mjs","b":"/local.js"}}</script>').map((d) => d.url), ["https://x.test/a.mjs"]);
assert.deepEqual(collectIntegrityScripts('<script src="https://x.test/a.js" integrity="sha384-AAA" crossorigin="anonymous"></script><script src="https://x.test/b.js"></script>'), [{ kind: "script-sri", url: "https://x.test/a.js", integrity: "sha384-AAA" }]);
assert.deepEqual(collectNeuralModuleAssets('const A_URL_V1="https://x.test/a.wasm";\nconst B="pas une url";').map((d) => d.url), ["https://x.test/a.wasm"]);
assert.deepEqual(collectModelUpstream('const IDLE_PIPER_MODEL_UPSTREAM_V1=\n  "https://h.test/m.onnx";').map((d) => d.url), ["https://h.test/m.onnx", "https://h.test/m.onnx.json"]);
assert.deepEqual(collectModelUpstream("rien"), []);
assert.deepEqual(
  collectOrtCompanionFiles("https://cdn.test/npm/ort@1/dist/ort.min.mjs", 'import("./ort-wasm-simd-threaded.jsep.mjs")').map((d) => d.url),
  ["https://cdn.test/npm/ort@1/dist/ort-wasm-simd-threaded.jsep.mjs", "https://cdn.test/npm/ort@1/dist/ort-wasm-simd-threaded.jsep.wasm"]
);

// --- Configuration du modèle ---
const validConfig = { phoneme_type: "espeak", espeak: { voice: "fr" }, audio: { sample_rate: 44100 }, phoneme_id_map: { a: [1] } };
assert.deepEqual(validatePiperModelConfig(validConfig), []);
assert.ok(validatePiperModelConfig({ ...validConfig, espeak: { voice: "en" } }).length === 1);
assert.ok(validatePiperModelConfig({ ...validConfig, phoneme_type: "text" }).length === 1);
assert.ok(validatePiperModelConfig({ ...validConfig, phoneme_id_map: {} }).length === 1);
assert.ok(validatePiperModelConfig(null).length === 1);

// --- Empreinte SRI (vecteur connu : SHA-384("abc")) ---
const abcHex = "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7";
assert.equal(await computeIntegrity(Buffer.from("abc")), "sha384-" + Buffer.from(abcHex, "hex").toString("base64"));

console.log("voice-runtime-dependencies: OK");
