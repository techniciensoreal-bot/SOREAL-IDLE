import assert from "node:assert/strict";
import { lireNotes, chargerNotes } from "./_notes.mjs";
import vm from "node:vm";
import { readFileSync } from "node:fs";

/*
 * T2 de l'audit de coherence du 2026-11-09 (AGENTS.md regle n°2) : le groupe « Général » des notes de version est affiche A TOUT LE MONDE
 * (idle-release-notes-groupes-v1 : le filtre par menu possede ne le touche pas). Pour un joueur neuf, aucune ligne de ce groupe, dans AUCUNE
 * version, ne doit donc nommer un systeme ou un menu qu'il n'a pas encore. Une ligne qui parle d'un systeme va dans le groupe `menu:` de
 * ce systeme (montre seulement quand le joueur le possede), ou est reformulee sans le nommer.
 * La liste des noms est CENTRALISEE ici : l'allonger quand un systeme est ajoute au jeu.
 */
const SYSTEMES_INTERDITS_DANS_GENERAL = [
  "machine temporelle", "time machine", "scientifique", "labo", "défi", "renaissance", "titan", "ngu", "album",
  "collection", "cube", "money pit", "roue journalière", "trou sans fond", "itopod", "dans la tour", "3e ressource",
  "wandoos", "yggdrasil", "barbe", "garderie", "souhait", "piratage", "digger", "mineur", "cuisine", "cooking", "macguffin", "quirk", "perk",
  "tippi", "evil", "sadistic", "giant seed", "classement", "augmentation", "blood magic", "magie du sang", "entraînement avancé",
];
/*
 * CAS NON TRANCHES (a decider par Norman) : mots dont on ignore s'ils designent quelque chose de deja visible d'un joueur neuf (barre de Magie
 * du bandeau ? Chroniques de boss lues des le premier boss ? mot « Rebirth » du tutoriel ?). Ils ne font pas echouer le test mais leur nombre
 * ne doit JAMAIS augmenter : une nouvelle ligne Général avec un de ces mots est refusee tant que la decision n'est pas prise. Si Norman decide
 * « verrouille », deplacer les lignes dans leur menu et passer le mot dans SYSTEMES_INTERDITS_DANS_GENERAL.
 */
const A_TRANCHER_PAR_NORMAN = ["magie", "chronique", "rebirth"];
const A_TRANCHER_MAX_2026_11_09 = 40;
/* Le nom du jeu lui-meme n'est pas un systeme (visible des l'ecran de connexion). */
const NOM_DU_JEU = ["soreal ngu idle", "ngu idle", "n de ngu"];

const n = JSON.parse(JSON.stringify(chargerNotes()));

/* Mot entier (pluriel permis) : « défi » ne doit pas attraper « défiler », ni « ngu » « longue ». */
const motEntier = (mot) => new RegExp("(?<![\\p{L}])" + mot.split(" ").join(" ") + "(?:s|x)?(?![\\p{L}])", "u");
const fautes = [];
const aTrancher = [];
let lignesGeneral = 0;
for (const v of n.versions) {
  const g = v.groupes.find((x) => x.menu === "general");
  if (!g) continue;
  g.points.forEach((p, i) => {
    lignesGeneral++;
    let t = String(p).toLowerCase();
    for (const nom of NOM_DU_JEU) t = t.split(nom).join(" ");
    for (const mot of A_TRANCHER_PAR_NORMAN) if (motEntier(mot).test(t)) aTrancher.push(v.version + " general[" + i + "] « " + mot + " »");
    for (const mot of SYSTEMES_INTERDITS_DANS_GENERAL) if (motEntier(mot).test(t)) fautes.push(v.version + " general[" + i + "] « " + mot + " » : " + String(p).slice(0, 90));
  });
}
assert.ok(lignesGeneral > 50, "le groupe Général existe bien (garde contre un test vide)");
assert.deepEqual(fautes, [], "ligne du groupe Général qui nomme un système (règle n°2) :\n" + fautes.join("\n"));
assert.ok(aTrancher.length <= A_TRANCHER_MAX_2026_11_09, "lignes Général avec un mot non tranché : " + aTrancher.length + " > " + A_TRANCHER_MAX_2026_11_09);
console.log("idle-notes-general-sans-systeme-v1 OK (" + lignesGeneral + " lignes Général contrôlées)");
