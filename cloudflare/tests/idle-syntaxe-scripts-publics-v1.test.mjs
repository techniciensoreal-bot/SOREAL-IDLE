import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import vm from "node:vm";

/*
 * Audit du 2026-10-10, IDLE-AUDIT-TEST-003 : « idle-standalone-ui » ne contrôlait la syntaxe que de 2 des ~85 scripts publics. Une erreur de syntaxe dans un module (typiquement en déplaçant du code) fait échouer SON chargement sans
 * qu'aucun test ne casse : toutes ses fonctions disparaissent (incident Blood Magic du 7 octobre). Chaque script public chargé par index.html est ici COMPILÉ (sans l'exécuter).
 */
const html = readFileSync("cloudflare/public/index.html", "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"?#]+)[^"]*"[^>]*>/g)]
  .filter((m) => !/type="module"/.test(m[0]))
  .map((m) => m[1])
  .filter((src) => src.startsWith("/") && src.endsWith(".js"));
assert.ok(scripts.length >= 60, "les scripts d'index.html sont trouvés (obtenu : " + scripts.length + ")");

let compiles = 0;
for (const src of scripts) {
  const fichier = "cloudflare/public" + src;
  const code = readFileSync(fichier, "utf8");
  try {
    new vm.Script(code, { filename: fichier });
    compiles += 1;
  } catch (e) {
    assert.fail("erreur de syntaxe dans " + fichier + " : " + e.message);
  }
}
assert.equal(compiles, scripts.length);

// Tout module public présent dans le dossier mais absent d'index.html doit être un choix explicite (sinon un module ajouté ne serait jamais chargé).
const presents = readdirSync("cloudflare/public/modules").filter((f) => f.endsWith(".js"));
const charges = new Set(scripts.map((s) => s.replace("/modules/", "")));
const orphelins = presents.filter((f) => !charges.has(f) && !html.includes("modules/" + f));
assert.deepEqual(orphelins, [], "modules publics jamais chargés par index.html : " + orphelins.join(", "));
console.log("idle-syntaxe-scripts-publics-v1: OK (" + compiles + " scripts compilés)");
