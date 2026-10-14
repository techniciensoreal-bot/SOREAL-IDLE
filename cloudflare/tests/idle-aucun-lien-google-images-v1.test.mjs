import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

/* Norman (2026-10-14) : « j'ai demandé 10 000 000 de fois de me séparer de Google » — la bannière (Drive) ne s'affichait plus quand le partage a été restreint. Plus aucune image ne vient de Google : tout vient du stockage R2 du jeu. */
const fichiers = ["cloudflare/public/index.html", "cloudflare/public/soreal-idle-ui.js", "cloudflare/src/idle-sqlite-runtime.js"];
for (const d of ["cloudflare/public/modules"]) for (const f of readdirSync(d)) if (/\.(js|html)$/.test(f)) fichiers.push(d + "/" + f);
for (const f of fichiers) {
  const s = readFileSync(f, "utf8");
  assert.ok(!/lh3\.googleusercontent|drive\.google\.com|drive\.usercontent|1omNowtqq/.test(s), "lien Google d'image dans " + f);
}
const html = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(html.includes("/api/idle/media/banner?name=soreal-idle.webp"), "écran de chargement : bannière R2");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes('<img src="/api/idle/media/banner?name=soreal-idle.webp"'), "bannière du jeu : R2");
assert.ok(!ui.includes("urlDriveRapideIdleV46_"), "plus de fonction d'adresse Drive");
console.log("Aucun lien Google pour les images : OK");
