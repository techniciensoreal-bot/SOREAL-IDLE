import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * 2026-09-24 : durcissement du workflow de production.
 * - permissions minimales (contents: read) ;
 * - Node épinglé (setup-node) avant toute exécution de node/npx ;
 * - un run en cours n'est jamais annulé (scénario : annulation après `wrangler deploy` mais avant la vérification du SHA
 *   annoté ou le smoke Chromium => SHA en production sans validation complète) ;
 * - ordre des étapes : tests -> build -> dépendances vocales -> déploiement -> SHA vérifié -> smoke réel.
 */
const workflow = readFileSync(new URL("../../.github/workflows/cloudflare-deploy.yml", import.meta.url), "utf8");

assert.match(workflow, /^permissions:\n  contents: read\n/m, "permissions: contents: read au niveau du workflow");
assert.ok(!/\bcontents:\s*write\b|\bpermissions:\s*write-all\b/.test(workflow), "aucun droit d'écriture GitHub");

assert.match(workflow, /group: soreal-idle-cloudflare-production\n  cancel-in-progress: false/, "un run de production commencé n'est jamais annulé");
assert.ok(!/^[^#\n]*cancel-in-progress:\s*true/m.test(workflow), "aucune ligne de configuration (hors commentaire) n'active l'annulation");

const setupAt = workflow.indexOf("uses: actions/setup-node@v4");
assert.ok(setupAt > 0, "Node doit être épinglé par actions/setup-node");
assert.match(workflow, /node-version: "\d+"/, "version de Node explicite (majeure)");
const firstNodeAt = Math.min(...["node cloudflare/", 'node "$f"', "npx --yes"].map((s) => workflow.indexOf(s)).filter((i) => i >= 0));
assert.ok(setupAt < firstNodeAt, "setup-node précède toute commande node/npx");

const order = [
  "name: Run test suite",
  "name: Build standalone frontend",
  "name: Verify voice runtime dependencies",
  "name: Deploy SOREAL Idle Worker",
  "name: Verify deployed Git SHA",
  "name: Verify deployed Piper narration in Chromium"
].map((label) => workflow.indexOf(label));
assert.ok(order.every((i) => i > 0), "toutes les étapes attendues existent");
assert.deepEqual([...order].sort((a, b) => a - b), order, "ordre des étapes de release");

console.log("deploy-workflow-hardening: OK");
