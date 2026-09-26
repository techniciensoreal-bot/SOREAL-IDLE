import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

/* Norman (2026-09-25) : version Beta 1.0, puis 1.1, 1.2… avec un petit nom ; « Notes de mise à jour » dans Settings ; notes rétroactives 0.7 à 1.0. */
const window = {};
vm.runInNewContext(readFileSync("cloudflare/public/modules/release-notes-v1.js", "utf8"), { window });
const n = JSON.parse(JSON.stringify(window.__SOREAL_IDLE_RELEASE_NOTES_V1__));

assert.equal(n.courante, "3.2");
assert.deepEqual(n.versions.map((v) => v.version), ["3.2", "3.1", "3.0", "2.9", "2.8", "2.7", "2.6", "2.5", "2.4", "2.3", "2.2", "2.1", "2.0", "1.9", "1.8", "1.7", "1.6", "1.5", "1.4", "1.3", "1.2", "1.1", "1.0", "0.9", "0.8", "0.7"], "1.2, 1.1 puis rétroactif 1.0, 0.9, 0.8, 0.7 (plus récente en tête)");
assert.equal(n.versions[0].version, n.courante, "la version courante est la première entrée");
for (const v of n.versions) {
  assert.ok(v.nom && /^\d{4}-\d{2}-\d{2}$/.test(v.date) && v.points.length >= 3, "chaque version : petit nom, date, résumé : " + v.version);
}
// Numéros strictement décroissants (en tête = la plus récente)
const nums = n.versions.map((v) => Number(v.version));
assert.deepEqual(nums, [...nums].sort((a, b) => b - a));

// Anti-spoil : les notes visibles de tous ne nomment pas de système verrouillé ni le Classement (bouton encore réservé)
const texte = JSON.stringify(n.versions).toLowerCase();
for (const interdit of ["classement", "cooking", "titan", "tippi", "evil", "sadistic", "time machine", "macguffin"]) {
  assert.ok(!texte.includes(interdit), "spoil dans les notes : " + interdit);
}

const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("📝 Notes de mise à jour") && ui.includes("window.__basculerNotesMajIdleV1__"));
assert.ok(ui.includes("Build <b style=\"color:#dce5f3\">Beta '+idleHtml_(notesMajIdleV1_().courante)"), "version affichée = courante des notes");
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/release-notes-v1.js"));

console.log("idle-release-notes-v1 OK");
