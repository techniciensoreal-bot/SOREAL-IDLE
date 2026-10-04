import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Audit des appels (Norman, 2026-10-04 : « vois les appels en trop, ça doit être propre et rapide »). */
const rt = readFileSync("cloudflare/public/modules/runtime.js", "utf8");
// 1. Le module d'état partagé n'ouvre plus de seconde lecture du serveur pendant que le moteur principal lit déjà : il attend l'état poussé.
{
  let lectures = 0;
  const timers = [];
  const win = { google: { script: { run: { withSuccessHandler() { return { withFailureHandler() { return { obtenirEtatSorealIdle() { lectures += 1; } }; } }; } } } }, SOREAL_SESSION: "x" };
  const ctx = { window: win, document: { readyState: "complete", getElementById: () => null, body: null, querySelector: () => null, addEventListener() {} }, setTimeout: (f, ms) => { timers.push([f, ms]); return timers.length; }, clearTimeout() {}, MutationObserver: class { observe() {} }, Promise, Set, console };
  vm.runInNewContext(rt, ctx);
  const R = win.__SOREAL_IDLE_RUNTIME_V1__;
  const a = R.getState(false);
  const b = R.getState(false);
  assert.equal(lectures, 0, "aucune lecture serveur au démarrage tant que le moteur principal peut pousser son état");
  R.pushState({ nom: "Norman" });
  assert.deepEqual(await a, { nom: "Norman" });
  assert.deepEqual(await b, { nom: "Norman" });
  assert.equal(lectures, 0);
  assert.deepEqual(await R.getState(false), { nom: "Norman" }, "état en cache ensuite");
}
// 2. Les observateurs du corps de page ignorent les simples changements de texte (chiffres des barres, ~25 par seconde).
assert.ok(rt.includes("avecElement_(mutations[i].addedNodes)"), "runtime : éléments seulement");
assert.ok(readFileSync("cloudflare/public/modules/ui.js", "utf8").includes("nodeType===1"), "ui : éléments seulement");
// 3. Administrateur et Partie B : lus dans l'état (reglages, partieDev), plus deux appels à part au démarrage.
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("idleEtat&&idleEtat.reglages!==undefined") && ui.includes("idleEtat.partieDev&&typeof idleEtat.partieDev==='object'"));
assert.ok(readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8").includes("partieDev: { actif: idleDevSlotsAvailableV1(__idleRuntimeUser)"), "le serveur donne partieDev dans l'état");
console.log("idle-audit-appels-v1: OK");
