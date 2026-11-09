#!/usr/bin/env node
/*
 * Préparation d'un push (vague 0 de l'audit de cohérence, 2026-11-09) : enchaîne, dans l'ordre et en s'arrêtant à la première erreur, ce qu'AGENTS.md demande à la main.
 *
 *   node cloudflare/tools/preparer-push.mjs [options]
 *
 * Étapes :
 *   1. verifier-note-du-jour.mjs      (code 1 = la note du jour est à créer/compléter : étape humaine ou agent, le script s'arrête)
 *   2. marquer-nouveautes-push.mjs    (lignes de la note en vert depuis le dernier push)
 *   3. build-moteur-local.mjs         (régénère moteur-local-worker-v1.js + wasm ; sautée avec --sans-moteur)
 *   4. maj-pins.mjs                   (relancé tant qu'il monte des numéros ; au plus 4 passes)
 *   5. inventaire-visuels.mjs --ecrire
 *   6. audit-architecture.mjs
 *   7. suite de tests complète, 6 fichiers à la fois (child_process, sans xargs : portable Windows) ; seuls les échecs sont affichés (sautée avec --rapide)
 *
 * Options :
 *   --rapide         saute la suite complète (étape 7)
 *   --sans-moteur    saute la reconstruction du moteur local (étape 3)
 *   --a-blanc        affiche les commandes sans rien exécuter
 *   --connus=a,b,c   échecs tolérés « connus de cette machine » (défaut : idle-graine-contenu-v1, idle-histoires-utiles-v1, idle-studio-port-libre-v1) ; --connus= (vide) = aucun toléré
 *   --parallele=N    nombre de tests simultanés (défaut 6)
 * Sortie : 0 si tout est prêt, 1 sinon (le message dit quoi faire). Ce script ne committe ni ne pousse jamais.
 */
import { spawn, spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const arg = (nom) => { const a = process.argv.find((x) => x.startsWith(nom + "=")); return a === undefined ? undefined : a.slice(nom.length + 1); };
const aBlanc = process.argv.includes("--a-blanc");
const rapide = process.argv.includes("--rapide");
const sansMoteur = process.argv.includes("--sans-moteur");
const parallele = Math.max(1, Number(arg("--parallele")) || 6);
const connusArg = arg("--connus");
const CONNUS_DEFAUT = ["idle-graine-contenu-v1", "idle-histoires-utiles-v1", "idle-studio-port-libre-v1"];
const connus = new Set(connusArg === undefined ? CONNUS_DEFAUT : connusArg.split(",").map((s) => s.trim()).filter(Boolean));

const outil = (n, ...a) => ["node", ["cloudflare/tools/" + n, ...a]];
const montrer = ([c, a]) => c + " " + a.join(" ");
let numero = 0;
const etape = (titre) => console.log(`\n[${++numero}] ${titre}`);
function arreter(message) { console.error("\nARRÊT : " + message); process.exit(1); }
function lancer(titre, [cmd, args], { sortie = true } = {}) {
  etape(titre + "\n    $ " + montrer([cmd, args]));
  if (aBlanc) return { status: 0, stdout: "" };
  const r = spawnSync(cmd === "node" ? process.execPath : cmd, args, { cwd: racine, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (sortie) { if (r.stdout) process.stdout.write(r.stdout.replace(/^/gm, "    ")); if (r.stderr) process.stderr.write(r.stderr.replace(/^/gm, "    ")); }
  return r;
}

console.log(`Préparation du push${aBlanc ? " (À BLANC : rien n'est exécuté)" : ""} — ${rapide ? "sans" : "avec"} suite complète (${parallele} à la fois), ${sansMoteur ? "sans" : "avec"} reconstruction du moteur local.`);

let r = lancer("Note du jour (date de Bruxelles)", outil("verifier-note-du-jour.mjs"));
if (r.status !== 0) arreter("la note de mise à jour du jour est à créer ou à corriger (voir le message ci-dessus et AGENTS.md, Process n°0). C'est une étape humaine/agent : la faire, puis relancer ce script.");

r = lancer("Lignes de la note en vert (nouveautés depuis le dernier push)", outil("marquer-nouveautes-push.mjs"));
if (r.status !== 0) arreter("marquer-nouveautes-push.mjs a échoué (voir ci-dessus).");

if (sansMoteur) { etape("Moteur local : sauté (--sans-moteur)"); }
else {
  r = lancer("Reconstruction du moteur local (obligatoire après toute modification de cloudflare/src)", outil("build-moteur-local.mjs"));
  if (r.status !== 0) arreter("build-moteur-local.mjs a échoué. Dépendances absentes ? cd cloudflare/local && npm install, puis relancer.");
}

for (let passe = 1; passe <= 4; passe += 1) {
  r = lancer(`Numéros ?v= (maj-pins), passe ${passe}`, outil("maj-pins.mjs"));
  if (r.status !== 0) arreter("maj-pins.mjs a échoué (voir ci-dessus).");
  if (aBlanc) { console.log("    (à blanc : relancé tant que « N numéros montés » avec N > 0)"); break; }
  const m = /(\d+) numéros montés/.exec(r.stdout || "");
  if (!m || Number(m[1]) === 0) break;
  if (passe === 4) arreter("maj-pins.mjs monte encore des numéros après 4 passes : un fichier change à chaque lancement (build non déterministe ?).");
}

r = lancer("Catalogue des visuels et effets", outil("inventaire-visuels.mjs", "--ecrire"));
if (r.status !== 0) arreter("inventaire-visuels.mjs --ecrire a échoué (voir ci-dessus). Relire ensuite design/CATALOGUE-VISUELS.md.");

r = lancer("Audit d'architecture (tailles, pins, cliquets de dette)", outil("audit-architecture.mjs"));
if (r.status !== 0) arreter("l'audit signale des points à corriger (chaque ligne ✗ dit quoi faire). Ne jamais relever un plafond sans accord de Norman.");

if (rapide) { etape("Suite de tests complète : sautée (--rapide)"); console.log("\nPRÊT (sans suite complète) : à lancer avant le push, ou laisser la CI la rejouer."); process.exit(0); }

const tests = readdirSync(join(racine, "cloudflare", "tests")).filter((f) => f.endsWith(".test.mjs")).sort();
etape(`Suite de tests complète : ${tests.length} fichiers, ${parallele} à la fois (échecs connus tolérés : ${[...connus].join(", ") || "aucun"})`);
if (aBlanc) {
  console.log(`    $ pour chaque cloudflare/tests/*.test.mjs : node <fichier>   (${parallele} processus simultanés ; seuls les échecs sont affichés)`);
  console.log("\nÀ BLANC terminé : aucune commande n'a été exécutée.");
  process.exit(0);
}
const debut = Date.now();
const echecs = []; let fait = 0; let suivant = 0;
await new Promise((fin) => {
  let actifs = 0;
  const lancerSuivant = () => {
    while (actifs < parallele && suivant < tests.length) {
      const f = tests[suivant++]; actifs += 1;
      const enfant = spawn(process.execPath, [join(racine, "cloudflare", "tests", f)], { cwd: racine });
      let journal = "";
      enfant.stdout.on("data", (d) => { journal += d; }); enfant.stderr.on("data", (d) => { journal += d; });
      const termine = (code) => {
        actifs -= 1; fait += 1;
        if (code !== 0) echecs.push({ nom: f.replace(/\.test\.mjs$/, ""), journal });
        if (fait % 100 === 0) console.log(`    ... ${fait}/${tests.length}`);
        if (fait === tests.length) fin(); else lancerSuivant();
      };
      enfant.on("error", (e) => { journal += String(e); termine(1); });
      enfant.on("close", termine);
    }
  };
  if (!tests.length) fin(); else lancerSuivant();
});
const secondes = Math.round((Date.now() - debut) / 1000);
const tolerés = echecs.filter((e) => connus.has(e.nom)); const vrais = echecs.filter((e) => !connus.has(e.nom));
console.log(`    ${tests.length - echecs.length}/${tests.length} tests verts en ${secondes} s.`);
if (tolerés.length) console.log(`    Échecs connus de cette machine (tolérés) : ${tolerés.map((e) => e.nom).join(", ")}`);
if (vrais.length) {
  for (const e of vrais) console.error(`\n=== ECHEC ${e.nom} ===\n${e.journal.split("\n").slice(-40).join("\n")}`);
  arreter(`${vrais.length} test(s) en échec : ${vrais.map((e) => e.nom).join(", ")}. Corriger (ou relancer ce test seul : node cloudflare/tests/<nom>.test.mjs) avant de pousser.`);
}
console.log("\nPRÊT : note du jour, pins, moteur local, catalogue, audit et tests sont à jour. Reste le commit puis le push (sur ordre de Norman).");
