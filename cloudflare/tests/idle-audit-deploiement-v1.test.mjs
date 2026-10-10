import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import worker from "../src/idle-worker-entry-v1.js";

/*
 * Audit du 2026-10-10 : CI-001 (AGENTS.md disait cancel-in-progress: true, le workflow dit false), CI-003 (déploiement possible depuis une autre branche), CI-007 (aucun délai maximal), CI-004 (aucun moyen public de voir la version active).
 */
const workflow = readFileSync(new URL("../../.github/workflows/cloudflare-deploy.yml", import.meta.url), "utf8");
const agents = readFileSync(new URL("../../AGENTS.md", import.meta.url), "utf8");

// CI-003 et CI-007
assert.match(workflow, /^    if: github\.ref == 'refs\/heads\/main'$/m, "seule la branche main déploie, même par workflow_dispatch");
assert.match(workflow, /^    timeout-minutes: \d+$/m, "délai maximal du job");

// CI-001 : la documentation dit la même chose que le workflow.
const valeurWorkflow = /^  cancel-in-progress:\s*(true|false)/m.exec(workflow)[1];
const valeurAgents = /`cancel-in-progress: (true|false)`/.exec(agents)[1];
assert.equal(valeurAgents, valeurWorkflow, "AGENTS.md et le workflow donnent la même valeur de cancel-in-progress");

// CI-004 : la version active est exposée (champ ajouté, rien d'autre ne change).
const env = { GOOGLE_CLIENT_ID: "id-public", CF_VERSION_METADATA: { id: "version-abc" } };
const boot = await (await worker.fetch(new Request("https://x.invalid/api/v1/bootstrap"), env)).json();
assert.equal(boot.version, "version-abc");
assert.equal(boot.protocol, 1, "champs existants conservés");
assert.equal(boot.ok, true);
assert.equal(boot.googleClientId, "id-public");
const sans = await (await worker.fetch(new Request("https://x.invalid/api/v1/bootstrap"), {})).json();
assert.equal(sans.version, "", "sans binding : chaîne vide, jamais d'erreur");
console.log("idle-audit-deploiement-v1: OK");
