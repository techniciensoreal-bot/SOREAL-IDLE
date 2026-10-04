import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : « je dois avoir un cadre par personnage ; je choisis la voix pour ce cadre ; j'en ajoute un autre, je choisis sa voix, etc. ; chaque cadre génère la voix du personnage uniquement, de sa
 * ligne même ». Éditeur des textes (chroniques de boss, popups) : champs « texte » affichés en cadres.
 */
const src = readFileSync("cloudflare/public/modules/textes-admin-v1.js", "utf8");
const debut = src.indexOf("function champParle_(c){");
const fin = src.indexOf("function blocsParCadre_(valeurs){");
assert.ok(debut > 0 && fin > debut);
const voixDeBalise = (c) => { const n = String(c).toLowerCase().replace(/[^a-z0-9]/g, ""); return n === "homme" || n === "narrateur" ? "homme" : n === "femme" ? "femme" : n === "marius" ? "marius" : ""; };
const T = new Function("voixDeBalise_", src.slice(debut, fin) + "\nreturn {champParle_,parleurUi_,lignesDepuisTexte_,texteDepuisLignes_,normaliser_};")(voixDeBalise);

// Seuls les champs « texte » deviennent des cadres.
assert.equal(T.champParle_({ type: "texte" }), true);
assert.equal(T.champParle_({ type: "ligne" }), false);
assert.equal(T.champParle_({ type: "liste" }), false);

// Texte sans balise : un seul cadre, le narrateur (« de base, un personnage »).
assert.deepEqual(T.lignesDepuisTexte_("Il était une fois."), [{ parleur: "narrateur", texte: "Il était une fois." }]);
assert.deepEqual(T.lignesDepuisTexte_(""), [{ parleur: "narrateur", texte: "" }]);
// Balises -> un cadre par personnage ; une balise inconnue reste du texte.
const lignes = T.lignesDepuisTexte_("(narrateur) Il entre. (marius) Salut mon ami ! (femme) Bonjour (enfin presque).");
assert.deepEqual(lignes, [{ parleur: "narrateur", texte: "Il entre." }, { parleur: "marius", texte: "Salut mon ami !" }, { parleur: "femme", texte: "Bonjour (enfin presque)." }]);
// Début par une autre voix que le narrateur.
assert.deepEqual(T.lignesDepuisTexte_("(femme) Oh !"), [{ parleur: "femme", texte: "Oh !" }]);
// Recomposition : le narrateur au début n'a pas de balise, tous les autres cadres en ont une (ce que lit le jeu).
assert.equal(T.texteDepuisLignes_(lignes), "Il entre. (marius) Salut mon ami ! (femme) Bonjour (enfin presque).");
assert.equal(T.texteDepuisLignes_([{ parleur: "femme", texte: "Oh !" }]), "(femme) Oh !");
// Un cadre vide ne laisse aucune trace ; supprimer le premier cadre rend la main à la voix du suivant.
assert.equal(T.texteDepuisLignes_([{ parleur: "narrateur", texte: "A." }, { parleur: "femme", texte: "  " }, { parleur: "marius", texte: "B." }]), "A. (marius) B.");
assert.equal(T.texteDepuisLignes_([{ parleur: "narrateur", texte: "" }, { parleur: "marius", texte: "B." }]), "(marius) B.");
// Aller-retour : un texte avec balises donne le même texte.
const original = "(marius) Salut. (femme) Coucou. (narrateur) Fin.";
assert.equal(T.texteDepuisLignes_(T.lignesDepuisTexte_(original)), "(marius) Salut. (femme) Coucou. Fin.".replace("Coucou. Fin.", "Coucou. (narrateur) Fin."));

// Câblage : une génération par cadre, écoute d'un cadre, ajout / suppression, fichiers par cadre, réduction, son de fin.
assert.ok(src.includes("function genererCadre_(champ,k){") && src.includes("lancerGeneration_(o,blocs,'Ligne '+(k+1));"), "génération d'un seul cadre");
assert.ok(src.includes("function ecouterCadre_(champ,k){"));
assert.ok(src.includes('data-stx-l="generer"') && src.includes('data-stx-l="ecouter"') && src.includes('data-stx-l="suppr"') && src.includes('data-stx-act="cadre+"'), "boutons de cadre : écouter, générer, supprimer, ajouter un personnage");
assert.ok(src.includes("<select data-stx-lparleur=") || src.includes("'<select data-stx-lparleur=\"'+cle+'\""), "choix de la voix par cadre");
assert.ok(src.includes('data-stx-fv="'), "fichiers de voix (télécharger, remplacer) dans chaque cadre");
assert.ok(src.includes("act==='reduire'") && src.includes("act==='agrandir'") && src.includes("act==='arreter-gen'") && src.includes("stx-reduit{inset:auto 12px 12px auto;"), "réduire en petit menu flottant");
assert.ok(src.includes("son.play('voiceDone')"), "son à la fin de la génération");
assert.ok(src.includes("function lancerGeneration_(o,aFaire,libelle){") && src.includes("lancerGeneration_(o,aFaire,'');"), "le bouton global et un cadre partagent la même génération");
console.log("idle-textes-cadres-personnages-v1: OK");
