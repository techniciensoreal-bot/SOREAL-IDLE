import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « Je veux que tu améliores le visuel de Automatisation de l'inventaire.
 * Tout est trop compacté. Crée des petites catégories. Tout doit être clair. »
 */
const mod = readFileSync("cloudflare/public/modules/inventory-auto-v1.js", "utf8");

// 1. Un helper de section dédié existe et est utilisé pour chaque catégorie.
assert.match(mod, /function section\(titre,contenu\)\{/, "un helper de section doit exister");
const occurrences = (mod.match(/lignes\.push\(section\(/g) || []).length;
assert.equal(occurrences, 6, "les 6 catégories (Automatisation, Slots d'automerge, Transformation, Action au clic, Filtre de butin, Configurations) doivent chacune être une section");

// 2. Chaque catégorie garde son propre titre reconnaissable.
for (const titre of [
  "🤖 Automatisation",
  "🟦 Slots d’automerge",
  "🔀 Transformation des boosts",
  "👆 Action au clic",
  "🧹 Filtre de butin",
  "🎽 Configurations d’équipement"
]) {
  assert.ok(mod.includes(titre), `catégorie manquante : ${titre}`);
}

// 3. CSS : les sections sont visuellement séparées (fond/bordure/marge), pas juste empilées à plat.
assert.match(mod, /\.soreal-idle-inv-auto-sections-v1\{display:grid;gap:10px/, "espacement entre les catégories");
assert.match(mod, /\.soreal-idle-inv-auto-section-v1\{padding:12px 14px;border-radius:14px;background:[^;]+;border:1px solid/, "chaque catégorie doit avoir sa propre carte visuelle (fond + bordure)");
assert.match(mod, /\.soreal-idle-inv-auto-section-titre-v1\{/, "chaque catégorie doit avoir un titre stylé à part");

console.log("idle-inventory-auto-categories-v1: OK");
