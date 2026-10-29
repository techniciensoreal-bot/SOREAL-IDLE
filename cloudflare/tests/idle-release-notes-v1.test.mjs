import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import vm from "node:vm";
import { readFileSync } from "node:fs";

/* Norman (2026-09-25) : version Beta avec un petit nom ; « Notes de mise à jour » dans Settings. Refonte 2026-10-02 : une entrée par jour (1.0 -> 3.0). */
const window = {};
vm.runInNewContext(readFileSync("cloudflare/public/modules/release-notes-v1.js", "utf8"), { window });
const n = JSON.parse(JSON.stringify(window.__SOREAL_IDLE_RELEASE_NOTES_V1__));

assert.equal(n.courante, "4.3");
assert.deepEqual(n.versions.map((v) => v.version), ["4.3", "4.2", "4.1", "4.0", "3.9", "3.8", "3.7", "3.6", "3.5", "3.4", "3.3", "3.2", "3.1", "3.0", "2.9", "2.8", "2.7", "2.6", "2.5", "2.4", "2.3", "2.2", "2.1", "2.0", "1.9", "1.8", "1.7", "1.6", "1.5", "1.4", "1.3", "1.2", "1.1", "1.0"], "une entrée par jour : 1.0 le 2026-09-23 puis +0.1 par jour, la plus récente en tête");
assert.deepEqual(n.versions.map((v) => v.date), ["2026-10-29", "2026-10-28", "2026-10-27", "2026-10-26", "2026-10-25", "2026-10-24", "2026-10-23", "2026-10-22", "2026-10-21", "2026-10-20", "2026-10-19", "2026-10-17", "2026-10-16", "2026-10-15", "2026-10-14", "2026-10-13", "2026-10-12", "2026-10-11", "2026-10-10", "2026-10-07", "2026-10-06", "2026-10-05", "2026-10-04", "2026-10-03", "2026-10-02", "2026-10-01", "2026-09-30", "2026-09-29", "2026-09-28", "2026-09-27", "2026-09-26", "2026-09-25", "2026-09-24", "2026-09-23"], "une seule entrée par jour");
assert.equal(n.versions[0].version, n.courante, "la version courante est la première entrée");
/* Notes regroupées par menu (Norman, 2026-10-11) : groupes { menu, titre, points }. */
const MENUS_VALIDES = ["general", "entrainement", "combat", "aventure", "renaissance", "moneyPit", "augmentations", "avance", "machine", "sang", "tower", "daycare", "challenges", "titans", "ngu", "wandoos", "yggdrasil", "diggers", "beards", "macguffins", "hacks", "questing", "quirks", "wishes", "cards", "cooking", "shop", "chroniques", "chat", "parametres"];
function lignes(v) { return (v.groupes || []).flatMap((g) => g.points); }
/* Le groupe « Titans » n'est montré qu'aux joueurs dont les titans sont accessibles (voir idle-release-notes-groupes-v1.test.mjs) : ses lignes peuvent nommer les Titans. */
function lignesNeutres(v) { return (v.groupes || []).filter((g) => g.menu !== "titans").flatMap((g) => g.points); }
for (const v of n.versions) {
  assert.ok(Array.isArray(v.groupes) && v.groupes.length > 0, "notes groupées par menu : " + v.version);
  for (const g of v.groupes) assert.ok(MENUS_VALIDES.includes(g.menu) && g.titre && g.points.length > 0, "groupe valide : " + v.version + " / " + g.menu);
  assert.equal(v.groupes[0].menu === "general" || v.groupes.every((g) => g.menu !== "general"), true, "« Général » vient en premier");
  assert.ok(v.nom && /^\d{4}-\d{2}-\d{2}$/.test(v.date) && lignes(v).length >= 3, "chaque version : petit nom, date, résumé : " + v.version);
}
// Numéros strictement décroissants (en tête = la plus récente)
const nums = n.versions.map((v) => Number(v.version));
assert.deepEqual(nums, [...nums].sort((a, b) => b - a));

// Anti-spoil : les notes visibles de tous ne nomment pas de système verrouillé ni le Classement (bouton encore réservé)
/* Seules les LIGNES sont vérifiées : les titres de menu (ITOPOD…) ne s'affichent que si le joueur possède déjà ce menu (voir idle-release-notes-groupes-v1.test.mjs). */
const texte = JSON.stringify(n.versions.map(lignesNeutres)).toLowerCase();
for (const interdit of ["classement", "cooking", "titan", "tippi", "evil", "sadistic", "time machine", "macguffin", "yggdrasil", "wandoos", "gold digger", "mineurs d", "barbes", "souhaits", "piratages", "garderie", "itopod", "quirks", "giant seed"]) {
  assert.ok(!texte.includes(interdit), "spoil dans les notes : " + interdit);
}

const ui = lireUiComplet();
assert.ok(ui.includes("📝 Notes de mise à jour") && ui.includes("window.__basculerNotesMajIdleV1__"));
assert.ok(ui.includes("Build <b style=\"color:#dce5f3\">Beta '+idleHtml_(notesMajIdleV1_().courante)"), "version affichée = courante des notes");
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/release-notes-v1.js"));

console.log("idle-release-notes-v1 OK");

/* Norman (2026-10-14) : la date de CHAQUE version (anciennes comprises) s'affiche en toutes lettres. */
{
  const ui = lireUiComplet();
  assert.ok(ui.includes("function dateNotesMajIdleV1_(iso)") && ui.includes("idleHtml_(dateNotesMajIdleV1_(v.date))"), "date des notes en toutes lettres");
}
