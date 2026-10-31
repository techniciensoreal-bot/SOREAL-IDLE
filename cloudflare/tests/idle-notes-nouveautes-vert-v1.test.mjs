import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import vm from "node:vm";
/* Norman (2026-10-31) : les lignes de la note ajoutées depuis le dernier push s'affichent en vert, elles seules. */
const html = readFileSync("cloudflare/public/index.html", "utf8");
const iDonnees = html.indexOf("/modules/release-notes-nouveautes-v1.js?v=");
const iNotes = html.indexOf("/modules/release-notes-v1.js?v=");
const iRendu = html.indexOf("/modules/ui-reglages-v1.js?v=");
assert.ok(iDonnees > 0 && iDonnees < iNotes && iDonnees < iRendu, "(a) données chargées AVANT le module de notes et celui qui les rend");
const donnees = readFileSync("cloudflare/public/modules/release-notes-nouveautes-v1.js", "utf8");
const w0 = {};
vm.runInNewContext(donnees, { window: w0 });
assert.ok(Array.isArray(w0.__SOREAL_IDLE_NOTES_NOUVEAUTES_V1__.lignes), "(a) liste exposée");
assert.ok(donnees.split("\n").length < 400, "fichier de données raisonnable");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
assert.match(css, /li\.note-neuve-v1\{color:#4ade80\}/, "(b) style vert");
assert.ok(!/animation/.test(css.split("li.note-neuve-v1")[1].split("\n")[0]), "pas d'animation");

// (b) rendu réel
const ui = lireUiComplet();
const i = ui.indexOf("function menusPossedesNotesMajIdleV1_(){");
const j = ui.indexOf("function htmlNotesMajIdleV1_(){");
assert.ok(i > 0 && j > i);
const fab = (lignes) => {
  const win = { __SOREAL_IDLE_NOTES_NOUVEAUTES_V1__: { lignes }, __SOREAL_IDLE_META_HOST_V130__: {} };
  const doc = { querySelectorAll: () => [] };
  return vm.runInNewContext("(function(document,idleHtml_,window,idleEtat){" + ui.slice(i, j) + "return htmlVersionNotesMajIdleV1_;})", {})(doc, (t) => String(t), win, {});
};
const v = { groupes: [{ menu: "general", titre: "Général", points: ["Ligne neuve é’", "Ligne ancienne"] }] };
const out = fab(["Ligne neuve é’"])(v, { general: true });
assert.ok(out.includes('<li class="note-neuve-v1">Ligne neuve é’</li>'), "ligne listée : verte");
assert.ok(out.includes("<li>Ligne ancienne</li>"), "ligne non listée : normale");
assert.equal(fab([])(v, { general: true }), "<div class=\"soreal-idle-notes-maj-groupe-v1\"><div class=\"soreal-idle-notes-maj-menu-v1\">Général</div><ul><li>Ligne neuve é’</li><li>Ligne ancienne</li></ul></div>", "liste vide : rien en vert");
assert.ok(fab(["X"])({ points: ["X", "Y"] }, {}).startsWith('<ul><li class="note-neuve-v1">X</li><li>Y</li>'), "ancien format aussi");

// (c) l'outil sur un dépôt temporaire
const { marquer } = await import("../tools/marquer-nouveautes-push.mjs");
const dir = mkdtempSync(path.join(tmpdir(), "nouv-"));
const rel = path.join(dir, "cloudflare", "public", "modules");
mkdirSync(rel, { recursive: true });
const notes = (pts) => "(function(){window.__SOREAL_IDLE_RELEASE_NOTES_V1__={courante:'1.0',versions:[{version:'1.0',groupes:[{menu:'general',titre:'G',points:[" + pts.map((p) => JSON.stringify(p)).join(",") + "]}]}]};})();";
const git = (...a) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd: dir, stdio: "pipe" });
git("init", "-q");
writeFileSync(path.join(rel, "release-notes-v1.js"), notes(["A", "B"]));
git("add", "."); git("commit", "-q", "-m", "un");
git("update-ref", "refs/remotes/origin/main", "HEAD");
writeFileSync(path.join(rel, "release-notes-v1.js"), notes(["A", "B", "C \"q\" é", "D"]));
let r = marquer(dir);
assert.deepEqual(r.lignes, ["C \"q\" é", "D"], "seules les nouvelles lignes");
const f1 = readFileSync(path.join(rel, "release-notes-nouveautes-v1.js"), "utf8");
r = marquer(dir);
assert.equal(readFileSync(path.join(rel, "release-notes-nouveautes-v1.js"), "utf8"), f1, "idempotent");
const w = {}; vm.runInNewContext(f1, { window: w });
assert.equal(JSON.stringify(w.__SOREAL_IDLE_NOTES_NOUVEAUTES_V1__.lignes), JSON.stringify(["C \"q\" é", "D"]), "fichier généré relisible");
git("add", "."); git("commit", "-q", "-m", "deux");
git("update-ref", "refs/remotes/origin/main", "HEAD");
writeFileSync(path.join(rel, "release-notes-v1.js"), notes(["A", "B", "C \"q\" é", "D", "E"]));
assert.deepEqual(marquer(dir).lignes, ["E"], "pas de cumul au push suivant");
git("checkout", "--", "cloudflare/public/modules/release-notes-v1.js");
assert.deepEqual(marquer(dir).lignes, [], "aucune différence : liste vide");
const w2 = {}; vm.runInNewContext(readFileSync(path.join(rel, "release-notes-nouveautes-v1.js"), "utf8"), { window: w2 });
assert.equal(w2.__SOREAL_IDLE_NOTES_NOUVEAUTES_V1__.lignes.length, 0);
assert.ok(marquer(dir, "origin/inexistante").raison, "repli clair si git échoue");
console.log("idle-notes-nouveautes-vert-v1: OK");
