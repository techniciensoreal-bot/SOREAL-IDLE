import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

/*
 * T7 de l'audit de coherence du 2026-11-09 (AGENTS.md regle n°1, exception de Norman du 2026-10-04). Quand aucune source ne publie l'ampleur
 * d'une valeur de jeu, une constante SOREAL moderee est permise, SIGNALEE par un commentaire. Ce test garde le REGISTRE de ces constantes :
 * il scanne cloudflare/src/*.js pour les commentaires « choix SOREAL » (toute casse), « approximation documentée » et « sciemment divergente »
 * et exige, pour chacun, une entree de cloudflare/tests/references/constantes-soreal-v1.json (fichier, repere, description, statut, date).
 * Une constante signalee mais absente du registre fait echouer le test ; une entree dont le commentaire a disparu aussi (registre perime).
 * Le test n'invente ni ne verifie aucune valeur de jeu : il ne fait que rendre visible ce que Norman doit encore valider.
 */
const DOSSIER = "cloudflare/src/";
const MARQUEURS = ["choix soreal", "approximation documentée", "sciemment divergente"];
const STATUTS = ["à valider par Norman", "validé par Norman", "à retirer"];

// Commentaire sur plusieurs lignes : retours à la ligne, espaces et « * » / « // » de tête ramenés à un seul espace.
const normaliser = (s) => s.replace(/\s*\r?\n\s*(?:\*|\/\/)?\s*/g, " ");

const registre = JSON.parse(readFileSync("cloudflare/tests/references/constantes-soreal-v1.json", "utf8"));
assert.ok(Array.isArray(registre.entrees) && registre.entrees.length > 0, "registre non vide");
for (const e of registre.entrees) {
  assert.ok(e.fichier && e.repere && e.description && e.statut && /^\d{4}-\d{2}-\d{2}$/.test(e.date), "entrée complète : " + JSON.stringify(e).slice(0, 80));
  assert.ok(STATUTS.includes(e.statut), "statut connu : " + e.statut);
}

const trouves = [];
for (const f of readdirSync(DOSSIER).filter((x) => x.endsWith(".js")).sort()) {
  const t = normaliser(readFileSync(DOSSIER + f, "utf8"));
  const bas = t.toLowerCase();
  const vus = new Set();
  for (const m of MARQUEURS) {
    let i = -1;
    while ((i = bas.indexOf(m, i + 1)) >= 0) {
      const repere = t.slice(i, i + 60).trim();
      if (vus.has(repere)) continue;
      vus.add(repere);
      trouves.push({ fichier: f, repere });
    }
  }
}
assert.ok(trouves.length >= 18, "le scan voit les constantes SOREAL connues (" + trouves.length + ")");

const nonRegistrees = trouves.filter((c) => !registre.entrees.some((e) => e.fichier === c.fichier && e.repere === c.repere));
assert.deepEqual(
  nonRegistrees,
  [],
  "constante SOREAL signalée dans le code mais absente de cloudflare/tests/references/constantes-soreal-v1.json (fichier, repere, description, statut « à valider par Norman », date) :\n" +
    nonRegistrees.map((c) => c.fichier + " : " + c.repere).join("\n"),
);
const perimees = registre.entrees.filter((e) => !trouves.some((c) => c.fichier === e.fichier && c.repere === e.repere));
assert.deepEqual(perimees, [], "entrée du registre dont le commentaire n'existe plus (la retirer ou la mettre à jour) :\n" + perimees.map((e) => e.fichier + " : " + e.repere).join("\n"));

console.log("idle-constantes-soreal-registre-v1 OK (" + trouves.length + " constantes SOREAL, " + registre.entrees.filter((e) => e.statut === "à valider par Norman").length + " à valider par Norman)");
