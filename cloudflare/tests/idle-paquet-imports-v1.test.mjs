import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/*
 * « Ni plus ni moins » (Norman, 2026-11-14) : le paquet de code des mises à jour (exe) ne contient de design/ que ce que le jeu importe. Ce test garantit qu'il n'en MANQUE aucun : chaque importation relative (import … from, import(), new URL(…, import.meta.url))
 * des fichiers JavaScript du paquet (cloudflare/src, cloudflare/public/modules importés par le Worker, desktop/src, cœur) se résout sur un fichier DU PAQUET. Une importation manquante empêcherait l'application de démarrer.
 */
const DEPOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const { fichiersDuCode } = await import(pathToFileURL(path.join(DEPOT, "desktop", "src", "paquet.mjs")).href);
const fichiers = fichiersDuCode(DEPOT);
const dansPaquet = new Set(fichiers.map((f) => f.nom));
const absents = [];
const RE = [/\bfrom\s*["'](\.{1,2}\/[^"']+)["']/g, /\bimport\s*\(\s*["'](\.{1,2}\/[^"']+)["']\s*\)/g, /\bimport\s*["'](\.{1,2}\/[^"']+)["']/g];
for (const f of fichiers) {
  if (!/\.(js|mjs)$/.test(f.nom)) continue;
  if (!(f.nom.startsWith("cloudflare/src/") || f.nom.startsWith("desktop/"))) continue;   /* le Worker et l'application : les modules de la page sont des fichiers de public/ déjà tous présents */
  const t = fs.readFileSync(f.chemin, "utf8");
  for (const re of RE) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(t))) {
      const cible = path.posix.normalize(path.posix.join(path.posix.dirname(f.nom), m[1]));
      if (!dansPaquet.has(cible)) absents.push(f.nom + " -> " + m[1] + " (" + cible + ")");
    }
  }
}
/* Les importations qui sortent du paquet vers un fichier de design/ non listé sont les seules à craindre ; les autres (ex. desktop/main.js, absent volontairement) sont signalées pareil. */
const vraiment = absents.filter((a) => !/^desktop\/(main|construire|publier-maj|recolter|purger-voix-obsoletes|exporter-catalogue|creer-icone)/.test(a));
assert.deepEqual(vraiment, [], "importation absente du paquet de mise à jour :\n" + vraiment.join("\n"));
assert.ok(fichiers.filter((f) => f.nom.startsWith("design/")).length >= 10, "les fichiers de design importés sont dans le paquet");
assert.ok(!dansPaquet.has("design/JOURNAL-SESSIONS.md") && !fichiers.some((f) => /^design\/(mineurs|maquettes|external|archive)/.test(f.nom)), "ni notes, ni maquettes, ni images de travail");
console.log("idle-paquet-imports-v1 : OK (" + fichiers.length + " fichiers)");
