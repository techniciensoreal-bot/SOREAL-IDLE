import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Journal de Norman (2026-10-17) : « rollback_detecte bossVaincus : 32 -> 30 (état plus récent de 0 ms) » et « systemes.adventure.revision : N -> N-1 (0 ms) ». Cause : dans un Worker l'horloge n'avance pas pendant un
 * calcul synchrone ; deux requêtes de suite recevaient le MÊME __serveurAtV1 et la garde du client (qui ne rejette que « at plus petit ») laissait passer la plus ancienne. L'instant est maintenant strictement croissant.
 */
const src = readFileSync("cloudflare/src/index-idle-coordinator-v1.js", "utf8");
const debut = src.indexOf("let dernierInstantReponseIdleV1_ = 0;");
const fin = src.indexOf("export class SorealIdleCoordinatorV1");
assert.ok(debut > 0 && fin > debut, "fonction présente");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(src.slice(debut, fin).replace("export function", "function") + "\nthis.f = instantStrictementCroissantIdleV1_;", ctx);
const f = ctx.f;
const a = f(1000), b = f(1000), c = f(1000), d = f(999);
assert.ok(a === 1000 && b > a && c > b && d > c, "même milliseconde ou horloge qui recule : toujours strictement croissant");
assert.ok(f(2000) === 2000, "l'horloge qui avance reprend la main");
let prec = f(1.78e12);
for (let i = 0; i < 1000; i += 1) { const x = f(1.78e12); assert.ok(x > prec, "toujours distinguable à 1,78e12"); prec = x; }
assert.ok(src.includes("const debutCalculMsV1 = instantStrictementCroissantIdleV1_(Date.now());"), "branché sur chaque appel de session");
console.log("idle-instant-reponse-croissant-v1: OK");
