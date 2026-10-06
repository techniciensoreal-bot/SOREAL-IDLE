import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

/*
 * AGENTS.md, règle n°2 (aucun spoil) : le joueur ne voit que ce qu'il a déjà débloqué. Ce test lit TOUS les modules
 * cloudflare/public/modules/*.js, retire les commentaires, extrait les chaînes de texte affichables et échoue si l'une
 * d'elles contient :
 *   - un cadenas « 🔒 » ;
 *   - une case « ??? » ;
 *   - le mot « verrouill… » (verrouillé, verrouillée, verrouillage...) ;
 *   - un total révélateur du type « x / max… » (concaténation « ' / '+…max/total/cap… »).
 * Les exceptions volontaires sont dans LISTE_BLANCHE ci-dessous : chaque entrée est (fichier, fragment exact de la chaîne,
 * raison). Toute nouvelle exception doit être justifiée ici, jamais ajoutée en silence.
 */
const DOSSIER = "cloudflare/public/modules/";

// Retire les commentaires (ligne et bloc) en respectant les chaînes ', " et ` ; renvoie aussi les chaînes extraites.
function analyser(src) {
  const chaines = [];
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
      let texte = "";
      while (j < n && src[j] !== c) {
        if (src[j] === "\\") { texte += src[j] + (src[j + 1] || ""); j += 2; continue; }
        if (c !== "`" && src[j] === "\n") break;
        texte += src[j]; j++;
      }
      chaines.push(texte);
      code += src.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    code += c; i++;
  }
  return { chaines, code };
}

/*
 * LISTE BLANCHE (fichier -> fragments autorisés, avec la raison).
 */
const LISTE_BLANCHE = [
  /* challenges-v1.js : « ??? » remplace une valeur NON affichable (nombre trop grand pour la mise en forme) dans le détail d'un défi
     DÉJÀ débloqué ; ce n'est pas une case d'un contenu non découvert. */
  { fichier: "challenges-v1.js", contient: "???", raison: "valeur numérique non affichable d'un défi déjà débloqué, pas un contenu verrouillé" },
  /* meta-progression-v130.js : page Augmentations. Comme la ligne verrouillée de Basic Training, UNE SEULE paire encore
     verrouillée (la prochaine) est montrée, sans nom ni seuil, pour que l'interface ne saute pas ; tout le reste est tronqué.
     Comportement demandé par Norman et épinglé par idle-anti-spoil-augmentations-v1.test.mjs. */
  { fichier: "meta-progression-v130.js", contient: "🔒 ???????", raison: "unique prochain Augment, sans nom ni condition (cf. Basic Training)" },
  { fichier: "meta-progression-v130.js", contient: "Augment verrouillé.", raison: "libellé générique de ce même emplacement" },
  { fichier: "meta-progression-v130.js", contient: "🔒 Upgrade verrouillé.", raison: "emplacement générique d'un Upgrade pas encore atteint, jamais son coût ni sa condition" },
  /* meta-progression-v130.js : cartes (Cards). 🔒 = icône « protégée » d'une carte que le joueur possède et a lui-même protégée ;
     rien à voir avec un déblocage. */
  { fichier: "meta-progression-v130.js", exact: "🔒 ", raison: "icône « carte protégée » (choix du joueur)" },
  { fichier: "meta-progression-v130.js", contient: "🔒 Protéger", raison: "bouton « Protéger » d'une carte possédée" },
  /* Texte d'aide d'un défi DÉJÀ actif : règle du défi en cours (le joueur y est), pas un contenu non découvert. */
  { fichier: "challenges-v1.js", contient: "Le menu Augmentations est verrouillé pendant le défi", raison: "règle d'un défi en cours" },
  /* Compteurs « fait / max » d'un défi déjà débloqué (demande explicite : restent OK). */
  { fichier: "challenges-v1.js", contient: "' / '+max", raison: "progression d'un défi déjà débloqué" },
  /* Boutique EXP : « Acheté n / plafond » d'un article déjà visible dans la boutique (plafond d'achat de cet article, pas un total caché). */
  { fichier: "meta-progression-v130.js", contient: "' / '+H.idleEntier_(it.max)", raison: "plafond d'achat d'un article de boutique déjà affiché" },
  /* Barre d'Énergie allouée : « courant / capacité » d'une ressource que le joueur possède. */
  { fichier: "ui.js", contient: "' / '+formatNombre_(max)", raison: "capacité de la barre d'énergie du joueur" },
  /* Page des fruits : « tier / tier max » d'un fruit déjà débloqué (plafond d'amélioration de ce fruit, aussi écrit dans la note de la page), pas un total caché. */
  { fichier: "yggdrasil-elfes-v1.js", contient: "'/'+d.maxTier", raison: "tier / tier maximum d'un fruit déjà découvert" },
  /* Outil d'administration (voix studio) : jamais montré à un joueur. */
  { fichier: "admin-histoires-v1.js", contient: "'/'+v.total", raison: "page admin, pas une interface joueur" },
  { fichier: "textes-admin-v1.js", contient: "'/'+s.total", raison: "éditeur de textes réservé à l'administrateur (blocs de voix prêts), jamais montré à un joueur" }
];

function autorise(fichier, texte) {
  return LISTE_BLANCHE.some((e) => e.fichier === fichier && (e.exact !== undefined ? texte === e.exact : texte.includes(e.contient)));
}

const MOTIFS = [
  [/🔒/u, "cadenas"],
  [/\?\?\?/, "case ???"],
  [/verrouill/i, "mot « verrouillé »"]
];
/* « ' / '+snap.maxSlots », « ' / '+nombre(d.totalExpGainMaxPct) » : dénominateur qui révèle un total non découvert. */
const MOTIF_TOTAL = /['"]\s*\/\s*['"]\s*\+\s*[A-Za-z_.$()]*?(?:max|Max|total|Total)[A-Za-z0-9_.$()]*/;

const violations = [];
const fichiers = readdirSync(DOSSIER).filter((f) => f.endsWith(".js"));
assert.ok(fichiers.length > 20, "les modules sont bien lus");
for (const f of fichiers) {
  const { chaines, code } = analyser(readFileSync(DOSSIER + f, "utf8"));
  for (const texte of chaines) {
    for (const [re, nom] of MOTIFS) {
      if (re.test(texte) && !autorise(f, texte)) violations.push(f + " : " + nom + " dans « " + texte.slice(0, 100) + " »");
    }
  }
  const m = MOTIF_TOTAL.exec(code);
  if (m && !autorise(f, m[0])) violations.push(f + " : total révélateur « " + m[0] + " »");
}
assert.deepEqual(violations, [], "spoils dans les modules :\n" + violations.join("\n"));

/* La liste blanche ne doit pas pourrir : chaque exception doit encore exister dans le module. */
for (const e of LISTE_BLANCHE) {
  const { chaines } = analyser(readFileSync(DOSSIER + e.fichier, "utf8"));
  assert.ok(chaines.some((t) => t.includes(e.contient)) || readFileSync(DOSSIER + e.fichier, "utf8").includes(e.contient), "entrée de liste blanche périmée : " + e.fichier + " / " + e.contient);
}

/* Le détecteur lui-même fonctionne. */
{
  const a = analyser("var x='🔒 test'; // 🔒 ignoré\n/* verrouillé */ var y=\"ok\";");
  assert.deepEqual(a.chaines, ["🔒 test", "ok"]);
  assert.ok(MOTIF_TOTAL.test("'<b>'+x+' / '+entier(snap.maxSlots)+'</b>'"));
  assert.ok(!MOTIF_TOTAL.test("'<b>'+niveau+'</b> / '+max"));
}

console.log("idle-anti-spoil-modules-v1: OK");
