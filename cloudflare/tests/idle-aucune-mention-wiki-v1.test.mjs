import assert from "node:assert/strict";
import { lirePagesMeta } from "./_meta-pages.mjs";
import { readFileSync } from "node:fs";

/* Norman (2026-10-13) : « on ne doit pas mentionner le wiki » dans le jeu : aucun texte affiché au joueur ne cite le wiki (les commentaires du code et les identifiants techniques, comme wikiItemId, ne sont pas du texte affiché). */
const fichiers = [
  "cloudflare/public/modules/cooking-v1.js",
  "cloudflare/public/modules/titans-comportements-v1.js",
  "cloudflare/public/modules/journal-attaques-v1.js",
  "cloudflare/public/modules/release-notes-v1.js",
  "cloudflare/src/idle-titans-combat-v1.js"
];
const sansCommentaires = (s) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:'"\\])\/\/[^\n]*/g, "$1");
for (const f of fichiers) {
  const texte = sansCommentaires(readFileSync(f, "utf8"));
  assert.ok(!/wiki/i.test(texte), "pas de « wiki » dans les textes affichés de " + f);
}
// message de garderie : lu dans meta-progression
const meta = sansCommentaires((readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8") + lirePagesMeta()));
const garderie = sansCommentaires(readFileSync("cloudflare/public/modules/daycare-page-v1.js", "utf8"));
assert.ok(!/publié par le wiki/.test(meta) && !/publié par le wiki/.test(garderie) && !/["'`][^"'`]*wiki[^"'`]*["'`]/i.test(garderie), "message de garderie sans wiki (la garderie vit dans le Coffre : daycare-page-v1.js)");
console.log("idle-aucune-mention-wiki-v1: OK");
