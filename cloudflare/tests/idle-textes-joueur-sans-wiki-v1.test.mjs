import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

/*
 * T6 de l'audit de coherence du 2026-11-09 (memoire de Norman « Textes joueur : pas de wiki, sets secrets ») : jamais le mot « wiki » dans un
 * texte affiche au joueur (le jeu ne cite pas sa source ; cas trouve : « ID wiki 100 » dans la fenetre du Cube, ui-aventure-2-v1.js).
 * Le test lit TOUS les modules cloudflare/public/modules/*.js et soreal-idle-ui.js, retire les commentaires, extrait les chaines et echoue si
 * l'une contient « wiki » une fois retires les usages TECHNIQUES, listes ici :
 *   - identifiants et cles de donnees : wikiItemId, wikiId, itemIdWiki… (le mot colle a d'autres lettres) ;
 *   - chemins de fichiers : « wiki-cartes/ » (dossier d'images _assets-locales/wiki-cartes) et autres « wiki- » / « -wiki » ;
 *   - adresses web (fandom.com/wiki/…).
 * Les ecrans d'administration ne sont pas exemptes : un administrateur est aussi un joueur, le mot n'y a pas sa place non plus.
 */
const DOSSIER = "cloudflare/public/modules/";

function chainesDuCode(src) {
  const chaines = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === "/" && d === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && d === "*") { const f = src.indexOf("*/", i + 2); i = f < 0 ? n : f + 2; continue; }
    if (c === "'" || c === '"' || c === "`") {
      let j = i + 1;
      let texte = "";
      while (j < n && src[j] !== c) {
        if (src[j] === "\\") { texte += src[j] + (src[j + 1] || ""); j += 2; continue; }
        if (c !== "`" && src[j] === "\n") break;
        texte += src[j]; j++;
      }
      chaines.push(texte);
      i = j + 1;
      continue;
    }
    i++;
  }
  return chaines;
}

function sansUsagesTechniques(t) {
  return t
    .replace(/https?:[^\s"'<>]*/gi, " ")
    .replace(/[\w-]*wiki[\w-]*\/[\w./-]*/gi, " ")
    .replace(/[A-Za-z0-9_$]*wiki[A-Za-z0-9_$]*/gi, (m) => (/^wiki$/i.test(m) || /^wiki(?![A-Za-z0-9_$])/i.test(m) && m.length === 4 ? m : " "));
}

const fichiers = readdirSync(DOSSIER).filter((f) => f.endsWith(".js")).map((f) => DOSSIER + f).concat(["cloudflare/public/soreal-idle-ui.js"]);
const fautes = [];
for (const chemin of fichiers) {
  for (const chaine of chainesDuCode(readFileSync(chemin, "utf8"))) {
    const texte = chaine.replace(/\/\*[\s\S]*?\*\//g, " "); // commentaire de bloc dans une expression ${...} d'un gabarit
    if (!/wiki/i.test(texte)) continue;
    if (/wiki/i.test(sansUsagesTechniques(texte))) fautes.push(chemin.split("/").pop() + " : " + texte.slice(0, 120));
  }
}
assert.ok(fichiers.length > 100, "le test lit bien les modules");
assert.deepEqual(fautes, [], "le mot « wiki » apparaît dans un texte joueur :\n" + fautes.join("\n"));

// Garde dédiée au cas de l'audit : la fenêtre du Cube n'affiche plus d'« ID wiki ».
assert.ok(!readFileSync(DOSSIER + "ui-aventure-2-v1.js", "utf8").includes("ID wiki"), "ui-aventure-2 : plus d'« ID wiki »");

console.log("idle-textes-joueur-sans-wiki-v1 OK (" + fichiers.length + " fichiers contrôlés)");
