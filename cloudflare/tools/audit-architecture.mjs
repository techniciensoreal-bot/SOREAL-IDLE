/*
 * Audit d'architecture (Norman, 2026-10-16 : « un audit qui dise : il n'y a rien à corriger »).
 *
 *   node cloudflare/tools/audit-architecture.mjs          -> affiche le rapport ; sort en erreur s'il reste un point à corriger
 *   node cloudflare/tools/audit-architecture.mjs --json   -> même chose en JSON
 *
 * Ce que « parfait » veut dire ICI (seuils objectifs, écrits en dur ci-dessous) :
 *   1. aucun fichier JavaScript du frontend ou du moteur n'a plus de MAX_LIGNES_FICHIER lignes ;
 *   2. aucune fonction n'a plus de MAX_LIGNES_FONCTION lignes, SAUF celles de EXCEPTIONS_FONCTIONS, qui ne doivent jamais grossir (plafond figé) ;
 *   3. chaque script/feuille de style/dictionnaire versionné par ?v=N a bien un numéro à jour (maj-pins.mjs --verifier) ;
 *   4. les en-têtes de cache immuables (public/_headers) couvrent les fichiers versionnés ;
 *   5. tous les fichiers JavaScript publics et du moteur passent `node --check` (syntaxe).
 * Ce que cet audit NE mesure PAS : la justesse du jeu (les tests s'en chargent), le style CSS (voir « dette CSS » du rapport), la vitesse réelle
 * (voir cloudflare/bench/bench-moteur.mjs). Un rapport vert signifie « aucun seuil ci-dessus n'est dépassé », rien de plus.
 */
import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { decouper } from "../tests/_js-scan.mjs";
import { analyzeEsm } from "../tests/_esm-scan.mjs";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const MAX_LIGNES_FICHIER = 2700;
const MAX_LIGNES_FONCTION = 450;
/* Fonctions déjà plus longues que le seuil à la date de l'audit : plafond = taille actuelle, à ne jamais relever. Les réduire = supprimer la ligne. */
const EXCEPTIONS_FONCTIONS = {
  "src/idle-runtime-progression.js:appliquerProgressionEnergieSorealIdle_": 1900,
  "src/idle-runtime-etat.js:construireEtatJoueurSorealIdle_": 1700,
  "public/modules/blood-magic-v1.js:creer": 490,
};

const problemes = []; const infos = [];
const lignesDe = (t) => t.split("\n").length;

const fichiers = [];
for (const [dossier, re] of [["public", /\.js$/], ["public/modules", /\.js$/], ["src", /\.js$/]]) {
  for (const f of readdirSync(join(racine, dossier))) if (re.test(f)) fichiers.push(dossier + "/" + f);
}

for (const f of fichiers) {
  const texte = readFileSync(join(racine, f), "utf8").replace(/\r\n/g, "\n");
  const n = lignesDe(texte);
  if (n > MAX_LIGNES_FICHIER) problemes.push(`fichier trop long : ${f} (${n} lignes, maximum ${MAX_LIGNES_FICHIER})`);
  let fonctions = [];
  try {
    if (f.startsWith("src/")) {
      const A = analyzeEsm(join(racine, f));
      fonctions = A.stmts.filter((s) => s.kind === "function").map((s) => [s.names[0], s.endLine - s.startLine + 1]);
    } else {
      const d = decouper(texte);
      fonctions = d.items.filter((i) => i.kind === "function").map((i) => [i.names[0], lignesDe(texte.slice(i.debut, i.fin))]);
    }
  } catch (e) { problemes.push(`analyse impossible : ${f} (${e.message})`); continue; }
  for (const [nom, l] of fonctions) {
    const cle = f + ":" + nom;
    const plafond = EXCEPTIONS_FONCTIONS[cle];
    if (plafond !== undefined) { infos.push(`exception : ${cle} (${l} lignes, plafond ${plafond})`); if (l > plafond) problemes.push(`fonction grossie : ${cle} (${l} lignes, plafond ${plafond})`); continue; }
    if (l > MAX_LIGNES_FONCTION) problemes.push(`fonction trop longue : ${cle} (${l} lignes, maximum ${MAX_LIGNES_FONCTION})`);
  }
  const syntaxe = spawnSync(process.execPath, ["--check", join(racine, f)], { encoding: "utf8" });
  if (syntaxe.status !== 0) problemes.push(`erreur de syntaxe : ${f}`);
}

const pins = spawnSync(process.execPath, [join(racine, "tools", "maj-pins.mjs"), "--verifier"], { encoding: "utf8" });
if (pins.status !== 0) problemes.push("numéros ?v= périmés (lancer node cloudflare/tools/maj-pins.mjs) : " + (pins.stdout + pins.stderr).trim().split("\n")[0]);

const entetes = readFileSync(join(racine, "public", "_headers"), "utf8");
for (const motif of ["/modules/*", "/soreal-idle-*.js", "/soreal-idle-*.css", "immutable"]) if (!entetes.includes(motif)) problemes.push("_headers : motif absent " + motif);

const css = readFileSync(join(racine, "public", "soreal-idle-ui.css"), "utf8");
infos.push(`dette CSS (non bloquante) : ${(css.match(/!important/g) || []).length} « !important » dans soreal-idle-ui.css`);

const rapport = { fichiersAnalyses: fichiers.length, problemes, infos };
if (process.argv.includes("--json")) console.log(JSON.stringify(rapport, null, 2));
else {
  console.log(`Audit d'architecture : ${fichiers.length} fichiers JavaScript analysés.`);
  infos.forEach((i) => console.log("  · " + i));
  if (problemes.length) { console.log(`\n${problemes.length} point(s) à corriger :`); problemes.forEach((p) => console.log("  ✗ " + p)); }
  else console.log("\nIl n'y a rien à corriger selon les seuils de l'audit (voir l'en-tête du script pour ce qu'ils couvrent).");
}
process.exit(problemes.length ? 1 : 0);
