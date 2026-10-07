import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

/* Norman (2026-09-25) : version Beta avec un petit nom ; « Notes de mise à jour » dans Settings. Refonte 2026-10-02 : une entrée par jour (1.0 -> 2.4). */
const window = {};
vm.runInNewContext(readFileSync("cloudflare/public/modules/release-notes-v1.js", "utf8"), { window });
const n = JSON.parse(JSON.stringify(window.__SOREAL_IDLE_RELEASE_NOTES_V1__));

assert.equal(n.courante, "2.4");
assert.deepEqual(n.versions.map((v) => v.version), ["2.4", "2.3", "2.2", "2.1", "2.0", "1.9", "1.8", "1.7", "1.6", "1.5", "1.4", "1.3", "1.2", "1.1", "1.0"], "une entrée par jour : 1.0 le 2026-09-23 puis +0.1 par jour, la plus récente en tête");
assert.deepEqual(n.versions.map((v) => v.date), ["2026-10-07", "2026-10-06", "2026-10-05", "2026-10-04", "2026-10-03", "2026-10-02", "2026-10-01", "2026-09-30", "2026-09-29", "2026-09-28", "2026-09-27", "2026-09-26", "2026-09-25", "2026-09-24", "2026-09-23"], "une seule entrée par jour");
assert.equal(n.versions[0].version, n.courante, "la version courante est la première entrée");
for (const v of n.versions) {
  assert.ok(v.nom && /^\d{4}-\d{2}-\d{2}$/.test(v.date) && v.points.length >= 3, "chaque version : petit nom, date, résumé : " + v.version);
}
// Numéros strictement décroissants (en tête = la plus récente)
const nums = n.versions.map((v) => Number(v.version));
assert.deepEqual(nums, [...nums].sort((a, b) => b - a));

// Anti-spoil : les notes visibles de tous ne nomment pas de système verrouillé ni le Classement (bouton encore réservé)
const texte = JSON.stringify(n.versions).toLowerCase();
for (const interdit of ["classement", "cooking", "titan", "tippi", "evil", "sadistic", "time machine", "macguffin", "yggdrasil", "wandoos", "gold digger", "mineurs d", "barbes", "souhaits", "piratages", "garderie", "itopod", "quirks", "giant seed"]) {
  assert.ok(!texte.includes(interdit), "spoil dans les notes : " + interdit);
}

const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("📝 Notes de mise à jour") && ui.includes("window.__basculerNotesMajIdleV1__"));
assert.ok(ui.includes("Build <b style=\"color:#dce5f3\">Beta '+idleHtml_(notesMajIdleV1_().courante)"), "version affichée = courante des notes");
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/release-notes-v1.js"));

console.log("idle-release-notes-v1 OK");
