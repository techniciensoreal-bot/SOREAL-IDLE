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
  { fichier: "augmentations-page-v1.js", contient: "🔒 ???????", raison: "unique prochain Augment, sans nom ni condition (cf. Basic Training)" },
  { fichier: "augmentations-page-v1.js", contient: "Augment verrouillé.", raison: "libellé générique de ce même emplacement" },
  { fichier: "augmentations-page-v1.js", contient: "🔒 Upgrade verrouillé.", raison: "emplacement générique d'un Upgrade pas encore atteint, jamais son coût ni sa condition" },
  /* meta-progression-v130.js : cartes (Cards). 🔒 = icône « protégée » d'une carte que le joueur possède et a lui-même protégée ;
     rien à voir avec un déblocage. */
  /* Texte d'aide d'un défi DÉJÀ actif : règle du défi en cours (le joueur y est), pas un contenu non découvert. */
  { fichier: "challenges-v1.js", contient: "Le menu Augmentations est verrouillé pendant le défi", raison: "règle d'un défi en cours" },
  /* Compteurs « fait / max » d'un défi déjà débloqué (demande explicite : restent OK). */
  { fichier: "challenges-v1.js", contient: "' / '+max", raison: "progression d'un défi déjà débloqué" },
  /* Boutique EXP : « Acheté n / plafond » d'un article déjà visible dans la boutique (plafond d'achat de cet article, pas un total caché). */
  /* Barre d'Énergie allouée : « courant / capacité » d'une ressource que le joueur possède. */
  { fichier: "ui.js", contient: "' / '+formatNombre_(max)", raison: "capacité de la barre d'énergie du joueur" },
  /* Page des fruits : « tier / tier max » d'un fruit déjà débloqué (plafond d'amélioration de ce fruit, aussi écrit dans la note de la page), pas un total caché. */
  { fichier: "yggdrasil-elfes-v1.js", contient: "'/'+d.maxTier", raison: "tier / tier maximum d'un fruit déjà découvert" },
  /* Page des succès (EXCEPTION voulue par Norman, 2026-10-10) : tous les trophées sont des cases ; l'objectif est « ????? » tant que le boss indiqué n'est pas vaincu, et la case dit quel boss tuer. Le serveur n'envoie ni nom ni seuil tant que ce n'est pas visible. */
  { fichier: "profile-v1.js", exact: "?????", raison: "objectif d'un succès pas encore visible (page des succès)" },
  { fichier: "profile-v1.js", contient: "🔒 Tue le boss ", raison: "boss à tuer pour voir les infos d'un succès (page des succès)" },
  { fichier: "profile-v1.js", exact: "???", raison: "numéro de boss caché pour « Boss vaincus » (Norman, 2026-10-10 : que des ???)" },
  /* Page Money Pit (money-pit-page-v1.js, extraite de meta-progression-v130.js) : « Page n / total » = pagination de l'historique du joueur lui-même, pas un total caché. */
  { fichier: "money-pit-page-v1.js", contient: "' / '+total", raison: "pagination de l'historique de récompenses déjà obtenues" },
  /* Pages extraites de meta-progression-v130.js (découpage 2026-10-16) : mêmes exceptions qu'avant, dans leur nouveau fichier. */
  { fichier: "cards-page-v1.js", exact: "🔒 ", raison: "icône « carte protégée » (choix du joueur)" },
  { fichier: "cards-page-v1.js", contient: "🔒 Protéger", raison: "bouton « Protéger » d'une carte possédée" },
  { fichier: "boutique-exp-page-v1.js", contient: "' / '+H.idleEntier_(it.max)", raison: "plafond d'achat d'un article de boutique déjà affiché" },
  { fichier: "wishes-page-v1.js", contient: "' / '+H.idleEntier_(sl.maxLevel)", raison: "niveau / niveau maximum d'un slot de souhait déjà possédé" },
  { fichier: "yggdrasil-diggers-page-v1.js", contient: "' / '+max", raison: "niveau de la run / meilleur niveau d'un Gold Digger déjà possédé" },
  /* Pages extraites de soreal-idle-ui.js : « verrouille » = NOM DE CLASSE CSS de la ligne d'entraînement grisée (aucun texte affiché). */
  { fichier: "page-entrainement-v1.js", contient: "verrouille\" data-basi", raison: "nom de classe CSS, pas un texte affiché" },
  /* Code extrait de soreal-idle-ui.js (modules ui-*-v1.js, 2026-10-16) : mêmes exceptions qu'avant, dans leur nouveau fichier. */
  { fichier: "ui-aventure-v1.js", contient: "soreal-idle-titans-ferme-v1", raison: "bouton « Titans » fermé en « ??? » : exception décidée par Norman (2026-10-10), AGENTS.md règle n°2" },
  { fichier: "ui-aventure-v1.js", contient: "Déverrouiller", raison: "verrou posé par le joueur sur SON objet (bouton d'inventaire)" },
  { fichier: "ui-aventure-v1.js", contient: "Verrouiller", raison: "verrou posé par le joueur sur SON objet (bouton d'inventaire)" },
  { fichier: "ui-aventure-v1.js", contient: "Déverrouille l’objet pour le supprimer", raison: "verrou posé par le joueur sur SON objet (info-bulle)" },
  { fichier: "ui-chroniques-v1.js", contient: "Boss ???", raison: "classement : le boss d'un joueur plus avancé est masqué (anti-spoil)" },
  { fichier: "ui-inventaire-v1.js", contient: "les verrouillés passent devant avec leurs doubles", raison: "objets verrouillés par le joueur lui-même (info-bulle du tri)" },
  { fichier: "ui-noyau-v1.js", contient: "🔒 ", raison: "cadenas du badge de version du prototype privé, pas un contenu verrouillé" },
  { fichier: "ui-reglages-v1.js", contient: "' / '+total", raison: "page n / total d'un tutoriel déjà ouvert" },
  /* Outil d'administration (voix studio) : jamais montré à un joueur. */
  { fichier: "admin-histoires-v1.js", contient: "'/'+v.total", raison: "page admin, pas une interface joueur" },
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
