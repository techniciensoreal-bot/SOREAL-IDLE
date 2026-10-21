import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-21) : « dès que le texte a un point, il crée une case de nouveau personnage et découpe ainsi tout le texte (10 ou 20 personnages, peu importe) : ça me permet de générer de petites parties de voix ; pour tous les boss sauf, si possible,
 * ceux que j'ai déjà modifiés ». Un texte sans texte dit enregistré est découpé en une phrase par personnage ; un texte déjà modifié garde ses cadres.
 */
const src = readFileSync(new URL("../public/modules/textes-admin-v1.js", import.meta.url), "utf8");
const debut = src.indexOf("function decouperPhrases_(texte){");
const fin = src.indexOf("function texteDepuisLignes_(lignes){");
assert.ok(debut > 0 && fin > debut, "fonctions de découpe dans l'éditeur");
const { decouperPhrases_, lignesParPhrase_ } = vm.runInNewContext("(function(){" + src.slice(debut, fin) + "\nreturn {decouperPhrases_:decouperPhrases_,lignesParPhrase_:lignesParPhrase_};})()", {});

const phrases = (t) => Array.from(decouperPhrases_(t));
assert.deepEqual(phrases("Bonjour. Je suis un boss. Prépare-toi."), ["Bonjour.", "Je suis un boss.", "Prépare-toi."], "une phrase par point");
assert.deepEqual(phrases("Un seul morceau sans point final"), ["Un seul morceau sans point final"], "pas de point : une seule case");
assert.deepEqual(phrases("Attends... je reviens. Vraiment."), ["Attends... je reviens.", "Vraiment."], "les points de suspension ne coupent pas");
assert.deepEqual(phrases("Il fait 3.5 mètres. Énorme."), ["Il fait 3.5 mètres.", "Énorme."], "un nombre décimal ne coupe pas");
assert.deepEqual(phrases("Fin.\n\nSuite (pause) du texte. Fin."), ["Fin.", "Suite (pause) du texte.", "Fin."], "retours à la ligne et balises conservés");
assert.deepEqual(phrases("   "), [""], "texte vide : une case vide");
const vingt = Array.from({ length: 20 }, (_, i) => "Phrase numéro " + (i + 1) + ".").join(" ");
assert.equal(phrases(vingt).length, 20, "vingt phrases : vingt personnages");

const lignes = Array.from(lignesParPhrase_([{ parleur: "narrateur", expr: "", texte: "A. B.", u: 0 }, { parleur: "femme", expr: "calme", texte: "C. D. E.", u: 1 }]));
assert.deepEqual(JSON.parse(JSON.stringify(lignes)).map((l) => [l.parleur, l.expr, l.texte, l.u]), [["narrateur", "", "A.", 0], ["narrateur", "", "B.", 0], ["femme", "calme", "C.", 1], ["femme", "calme", "D.", 1], ["femme", "calme", "E.", 1]], "chaque phrase garde la voix, l'expression et le paragraphe de son cadre");

// Seuls les textes sans texte dit enregistré sont découpés (ceux déjà modifiés gardent leurs cadres).
assert.ok(src.includes("var phrases=possedeParle?[l.texte]:decouperPhrases_(l.texte);"), "liste de paragraphes : découpée seulement si jamais modifiée");
assert.ok(src.includes("if(!possedeParle)edition.lignes[c.id]=lignesParPhrase_(edition.lignes[c.id])"), "texte simple : découpé seulement si jamais modifié");

// Retour en Zone sûre de la veille expliqué au premier état (zone sûre inattendue au retour dans le jeu).
const combat = readFileSync(new URL("../public/modules/ui-combat-1-v1.js", import.meta.url), "utf8");
assert.ok(combat.includes("(r.raison==='ko_hors_ligne'||r.raison==='defaite')&&at>0&&Date.now()-at<86400000"), "K.O. de la veille expliqué dans le journal d'Aventure");
console.log("idle-voix-decoupe-phrases-v1: OK");
