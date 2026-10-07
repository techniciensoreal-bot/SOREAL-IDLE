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
const T = new Function("voixDeBalise_", "tts_", src.slice(debut, fin) + "\nreturn {champParle_,parleurUi_,lignesDepuisTexte_,texteDepuisLignes_,normaliser_,lignesDepuisListe_,listeDepuisLignes_,voixFinale_,etatFinal_,teteBalises_};")(voixDeBalise, () => null);

// Les champs « texte » et « liste » (tutoriels, nouveautés) deviennent des cadres ; une ligne simple (titre, nom) reste un champ.
assert.equal(T.champParle_({ type: "texte" }), true);
assert.equal(T.champParle_({ type: "ligne" }), false);
assert.equal(T.champParle_({ type: "liste" }), true);

// Texte sans balise : un seul cadre, le narrateur (« de base, un personnage »).
assert.deepEqual(T.lignesDepuisTexte_("Il était une fois."), [{ parleur: "narrateur", expr: "", texte: "Il était une fois." }]);
assert.deepEqual(T.lignesDepuisTexte_(""), [{ parleur: "narrateur", expr: "", texte: "" }]);
// Balises -> un cadre par personnage ; une balise inconnue reste du texte.
const lignes = T.lignesDepuisTexte_("(narrateur) Il entre. (marius) Salut mon ami ! (femme) Bonjour (enfin presque).");
assert.deepEqual(lignes, [{ parleur: "narrateur", expr: "", texte: "Il entre." }, { parleur: "marius", expr: "", texte: "Salut mon ami !" }, { parleur: "femme", expr: "", texte: "Bonjour (enfin presque)." }]);
// Début par une autre voix que le narrateur.
assert.deepEqual(T.lignesDepuisTexte_("(femme) Oh !"), [{ parleur: "femme", expr: "", texte: "Oh !" }]);
// Recomposition : le narrateur au début n'a pas de balise, tous les autres cadres en ont une (ce que lit le jeu).
assert.equal(T.texteDepuisLignes_(lignes), "Il entre. (marius) Salut mon ami ! (femme) Bonjour (enfin presque).");
assert.equal(T.texteDepuisLignes_([{ parleur: "femme", expr: "", texte: "Oh !" }]), "(femme) Oh !");
// Un cadre vide ne laisse aucune trace ; supprimer le premier cadre rend la main à la voix du suivant.
assert.equal(T.texteDepuisLignes_([{ parleur: "narrateur", expr: "", texte: "A." }, { parleur: "femme", expr: "", texte: "  " }, { parleur: "marius", expr: "", texte: "B." }]), "A. (marius) B.");
assert.equal(T.texteDepuisLignes_([{ parleur: "narrateur", expr: "", texte: "" }, { parleur: "marius", expr: "", texte: "B." }]), "(marius) B.");
// Aller-retour : un texte avec balises donne le même texte.
const original = "(marius) Salut. (femme) Coucou. (narrateur) Fin.";
assert.equal(T.texteDepuisLignes_(T.lignesDepuisTexte_(original)), "(marius) Salut. (femme) Coucou. Fin.".replace("Coucou. Fin.", "Coucou. (narrateur) Fin."));

// Listes de paragraphes (tutoriels, nouveautés) : un cadre par paragraphe ; la voix en vigueur se poursuit d'un paragraphe à l'autre.
{
  const liste = ["Bienvenue.", "(femme) Bonjour, moi c'est Léa.", "Je continue de parler.", "(narrateur) Retour au narrateur."];
  const cadres = T.lignesDepuisListe_(liste);
  assert.deepEqual(cadres, [{ parleur: "narrateur", expr: "", texte: "Bienvenue." }, { parleur: "femme", expr: "", texte: "Bonjour, moi c'est Léa." }, { parleur: "femme", expr: "", texte: "Je continue de parler." }, { parleur: "narrateur", expr: "", texte: "Retour au narrateur." }]);
  // Recomposition : une balise seulement quand la voix change ; le tout redonne exactement la liste d'origine.
  assert.deepEqual(T.listeDepuisLignes_(cadres), liste);
  // Ajouter un personnage (cadre) en fin de liste, ou en retirer un : seules les balises nécessaires apparaissent.
  assert.deepEqual(T.listeDepuisLignes_([...cadres, { parleur: "marius", expr: "", texte: "Salut." }]), [...liste, "(marius) Salut."]);
  assert.deepEqual(T.listeDepuisLignes_([cadres[0], cadres[2]]), ["Bienvenue.", "(femme) Je continue de parler."]);
  assert.deepEqual(T.listeDepuisLignes_([{ parleur: "narrateur", expr: "", texte: " " }]), []);
  assert.deepEqual(T.lignesDepuisListe_([]), [{ parleur: "narrateur", expr: "", texte: "" }]);
  // Une balise au milieu d'un paragraphe garde la voix finale pour le suivant.
  assert.deepEqual(T.lignesDepuisListe_(["Il dit (femme) oui.", "Suite."]).map((c) => c.parleur), ["narrateur", "femme"]);
}

// Câblage : une génération par cadre, écoute d'un cadre, ajout / suppression, fichiers par cadre, réduction, son de fin.
assert.ok(src.includes("function genererCadre_(champ,k){") && src.includes("lancerGeneration_(o,blocs,champ==='__titre'?'Titre':'Ligne '+(k+1));"), "génération d'un seul cadre");
assert.ok(src.includes("function ecouterCadre_(champ,k){"));
assert.ok(src.includes("title=\"Retirer ce personnage\">🗑</button>") && src.includes("＋ Ajouter un personnage</button>"), "boutons ajouter et retirer un personnage");
assert.ok(src.includes('data-stx-l="generer"') && src.includes('data-stx-l="ecouter"') && src.includes('data-stx-l="suppr"') && src.includes('data-stx-act="cadre+"'), "boutons de cadre : écouter, générer, supprimer, ajouter un personnage");
assert.ok(src.includes('data-stx-lparleur="') && src.includes("u.chipsHtml(cle,l)") && readFileSync("cloudflare/public/modules/voix-ui-v1.js", "utf8").includes('data-vu-pick="voix"'), "choix de la voix et de l'expression par cadre (sélecteurs avec écoute, module partagé)");
assert.ok(src.includes('data-stx-fv="'), "fichiers de voix (télécharger, remplacer) dans chaque cadre");
assert.ok(src.includes("act==='reduire'") && src.includes("act==='agrandir'") && src.includes("act==='arreter-gen'") && src.includes("stx-reduit{inset:auto 12px 12px auto;"), "réduire en petit menu flottant");
assert.ok(src.includes("son.play('voiceDone')"), "son à la fin de la génération");
assert.ok(src.includes("function lancerGeneration_(o,aFaire,libelle){") && src.includes("lancerGeneration_(o,aFaire,'');"), "le bouton global et un cadre partagent la même génération");
console.log("idle-textes-cadres-personnages-v1: OK");

// Titre du boss (Norman, 2026-10-04 : « je dois aussi pouvoir régénérer le titre des boss ») : le nom lu en tête de la chronique est un bloc de voix à lui, qui a son propre cadre.
{
  const a = src.indexOf("function blocsDuTitre_(valeurs,blocs){");
  const b = src.indexOf("function blocsParCadre_(valeurs){");
  assert.ok(a > 0 && b > a);
  const norm = (t) => String(t == null ? "" : t).replace(/\([^()]*\)/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  const fabrique = (titre) => new Function("edition", "normaliser_", src.slice(a, b) + "\nreturn blocsDuTitre_;")({ def: { titre } }, norm);
  const blocs = [{ texte: "Gros Boss", hash: "h0" }, { texte: "Il était une fois.", hash: "h1" }];
  const r = fabrique("nom")({ nom: "Gros  Boss" }, blocs);
  assert.deepEqual(r.titre.map((x) => x.hash), ["h0"], "le premier bloc est le titre");
  assert.deepEqual(r.autres.map((x) => x.hash), ["h1"], "les cadres ne reçoivent plus le titre");
  const non = fabrique("nom")({ nom: "Autre nom" }, blocs);
  assert.deepEqual(non.titre, [], "le titre modifié n'a pas encore de bloc généré qui lui corresponde : rien n'est retiré");
  assert.deepEqual(fabrique("")({ nom: "Gros Boss" }, blocs).titre, [], "un texte sans titre ne change pas");
  assert.ok(src.includes("titre:'nom',") && src.includes("data-c=\"__titre\"") && src.includes("Voix du titre") && src.includes("Générer (ou régénérer) la voix du titre") && src.includes("Écouter uniquement le titre"), "cadre du titre : écouter et générer");
  assert.ok(src.includes("lancerGeneration_(o,blocs,champ==='__titre'?'Titre':'Ligne '+(k+1));") && src.includes("if(champ==='__titre')return r.titre||[];"), "génération du titre seul");
  assert.ok(src.includes("cadreT.innerHTML=titreCadreHtml_(r.titre||[]);"), "fichier et badge du titre rafraîchis");
}
