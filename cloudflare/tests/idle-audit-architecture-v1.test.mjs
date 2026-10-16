import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

/* Audit d'architecture (cloudflare/tools/audit-architecture.mjs) : tailles de fichiers et de fonctions, numéros ?v=, en-têtes de cache, syntaxe. */
const script = fileURLToPath(new URL("../tools/audit-architecture.mjs", import.meta.url));
const r = spawnSync(process.execPath, [script], { encoding: "utf8" });
assert.equal(r.status, 0, "l'audit d'architecture signale des points à corriger :\n" + r.stdout + r.stderr);
console.log("idle-audit-architecture-v1 ok");
