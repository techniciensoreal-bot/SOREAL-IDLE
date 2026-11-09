import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

/*
 * T4 de l'audit de coherence du 2026-11-09 (AGENTS.md regle n°2) : « Pas de total révélateur : jamais « 12 / 301 boss », « 5 / 284 emplacements »... ».
 * idle-anti-spoil-modules-v1 ne voit que les totaux nommes max/total/cap ; ce test voit ceux qui prennent la TAILLE D'UNE LISTE comme
 * denominateur : `' / '+x.length`, `'/'+x.length` et les gabarits `/ ${x.length}` dans le code (commentaires retires) de tous les
 * modules cloudflare/public/modules/*.js. Cas decouvert par l'audit : titans-v1.js « forme x / t.forms.length » (corrige : on n'affiche
 * que la forme deja decouverte).
 * LISTE_BLANCHE : (fichier, fragment exact, raison). Toute nouvelle exception se justifie ici, jamais en silence.
 */
const DOSSIER = "cloudflare/public/modules/";

const LISTE_BLANCHE = [
  { fichier: "profile-v1.js", fragment: "fait+' / '+items.length", raison: "EXCEPTION DECIDEE PAR NORMAN (2026-10-10, AGENTS.md regle n°2) : la page des succes montre tous les trophees avec un total « x / y » par categorie." },
  { fichier: "cards-page-v1.js", fragment: "deck.length)+' / '+H.idleEntier_(c.deckSize", raison: "Taille du deck du joueur sur sa capacite de deck (deckSize), pas le total d'une collection cachee ; la capacite fait partie de la mecanique deja visible." },
  { fichier: "ui-combat-2-v1.js", fragment: "'/'+defeated.length", raison: "Progression « n-ieme / total » de la liste des boss que le joueur vient lui-meme de vaincre avec le Nuke (la liste est celle de ses victoires, pas un total cache)." },
  { fichier: "album-cartes-v1.js", fragment: "L+'/'+cartes.length+'/'+pagesTitans()", raison: "Cle de cache interne (jamais affichee)." },
];
/* Ecrans reserves a l'administrateur (compteurs d'upload, de voix, de pages de la liste de tous les boss) : jamais montres a un joueur. */
const FICHIERS_ADMIN = /^(admin-.*|textes-admin-v1|mesure-reference-v1)\.js$/;

// Retire les commentaires (ligne et bloc) en respectant les chaines ', " et ` (memes regles que idle-anti-spoil-modules-v1).
function sansCommentaires(src) {
  let code = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === "/" && d === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && d === "*") { const f = src.indexOf("*/", i + 2); i = f < 0 ? n : f + 2; continue; }
    if (c === "'" || c === '"' || c === "`") {
      let j = i + 1;
      while (j < n && src[j] !== c) {
        if (src[j] === "\\") { j += 2; continue; }
        if (c !== "`" && src[j] === "\n") break;
        j++;
      }
      code += src.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    code += c;
    i++;
  }
  return code;
}

/* ' / '+x.length  |  '/'+x.length  |  "/ "+x.length  |  `/ ${...length...}` */
const MOTIFS = [
  /['"] ?\/ ?['"]\s*\+\s*[A-Za-z_$][\w$.\[\]()]*\.length/g,
  /\/\s*\$\{[^}]*\.length[^}]*\}/g,
];

const sansEspaces = (s) => s.replace(/\s+/g, "");
const trouves = [];
let fichiersLus = 0;
for (const nom of readdirSync(DOSSIER).filter((f) => f.endsWith(".js"))) {
  if (FICHIERS_ADMIN.test(nom)) continue;
  fichiersLus++;
  const code = sansCommentaires(readFileSync(DOSSIER + nom, "utf8"));
  for (const re of MOTIFS) {
    for (const m of code.matchAll(re)) {
      const debut = Math.max(0, m.index - 40);
      const contexte = code.slice(debut, m.index + m[0].length + 20);
      const autorise = LISTE_BLANCHE.some((e) => e.fichier === nom && sansEspaces(contexte).includes(sansEspaces(e.fragment)));
      if (!autorise) trouves.push(nom + " : …" + contexte.replace(/\s+/g, " ") + "…");
    }
  }
}
assert.ok(fichiersLus > 100, "le test lit bien les modules");
assert.deepEqual(trouves, [], "total révélateur (« x / liste.length ») dans un texte affiché (règle n°2) :\n" + trouves.join("\n"));
for (const e of LISTE_BLANCHE) {
  assert.ok(e.raison.length > 20, "exception justifiée : " + e.fichier);
  assert.ok(sansEspaces(readFileSync(DOSSIER + e.fichier, "utf8")).includes(sansEspaces(e.fragment)), "entrée de liste blanche périmée : " + e.fichier + " / " + e.fragment);
}

// Garde dédiée au cas de l'audit.
const titans = readFileSync(DOSSIER + "titans-v1.js", "utf8");
assert.ok(!titans.includes("forms.length+')"), "titans-v1 : la forme n'affiche plus de total");

console.log("idle-anti-spoil-totaux-length-v1 OK (" + fichiersLus + " modules joueur contrôlés)");
