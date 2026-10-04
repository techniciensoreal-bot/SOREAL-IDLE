import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : « repense le menu d'édition des voix : une ligne par personnage, ne générer que cette ligne, ajouter ou supprimer des lignes (de base un seul personnage), réduire en petit menu flottant pour
 * continuer à jouer pendant la génération, petit son à la fin, garder télécharger / uploader ».
 */
const admin = readFileSync("cloudflare/public/modules/admin-histoires-v1.js", "utf8");
const moteur = readFileSync("cloudflare/public/modules/story-engine-v1.js", "utf8");
const audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");

// 1. Moteur d'histoires réel : même découpe que le jeu.
const fenetre = {};
const faux = { addEventListener() {}, getElementById: () => null, createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, classList: { add() {}, remove() {} } }), head: { appendChild() {} }, body: { appendChild() {} } };
new Function("window", "document", "localStorage", "setTimeout", moteur)(fenetre, faux, { getItem: () => null, setItem() {} }, setTimeout);
const segmenter = fenetre.__SOREAL_IDLE_STORY_ENGINE_V1__.segmenter;

// 2. Fonctions de lignes extraites du module admin (aucun accès au DOM).
const debut = admin.indexOf("function parleurUi_(p){");
const fin = admin.indexOf("function blocsDeLigne_(l){");
assert.ok(debut > 0 && fin > debut);
const f = new Function("segmenter", "parleurCanon_", "segmentsDeEtape_", admin.slice(debut, fin) + "\nreturn {parleurUi_,etapeVide_,lignesDepuisEtape_,composerEtape_,sansEspaces_,initialiserLignes_Brut:null};");
const canon = (p) => (p === "homme" ? "homme" : p || "narrateur");
const segs = (e) => segmenter(e.texte, e.parleur).segments;
const T = f(segmenter, canon, segs);

// De base : un seul personnage, une ligne vide.
const vide = T.etapeVide_("img.png");
assert.deepEqual(vide.lignes, [{ parleur: "narrateur", texte: "" }]);

// Texte existant (avec balises) -> une ligne par personnage ; recomposé à l'identique côté jeu.
const ancien = { texte: "Il était une fois. (femme) Bonjour ! (narrateur) Elle sourit.", parleur: "narrateur" };
const lignes = T.lignesDepuisEtape_(ancien);
assert.deepEqual(lignes, [{ parleur: "narrateur", texte: "Il était une fois." }, { parleur: "femme", texte: "Bonjour !" }, { parleur: "narrateur", texte: "Elle sourit." }]);
const recompose = { texte: "", parleur: "", lignes };
T.composerEtape_(recompose);
assert.equal(recompose.parleur, "narrateur");
assert.equal(recompose.texte, "Il était une fois. (femme) Bonjour ! (narrateur) Elle sourit.");
// Le jeu lit exactement les mêmes segments (donc les mêmes empreintes de voix) qu'avant la modification.
assert.deepEqual(segmenter(recompose.texte, recompose.parleur).segments, segmenter(ancien.texte, ancien.parleur).segments);

// Ajouter / supprimer des lignes : les lignes vides ne laissent aucune trace dans le texte enregistré.
const e = { texte: "", parleur: "narrateur", lignes: [{ parleur: "narrateur", texte: "Premier." }, { parleur: "femme", texte: "" }, { parleur: "femme", texte: "Troisième." }] };
T.composerEtape_(e);
assert.equal(e.texte, "Premier. (femme) Troisième.");
e.lignes.splice(0, 1);
T.composerEtape_(e);
assert.equal(e.parleur, "femme", "la voix de départ suit la première ligne non vide");
assert.equal(e.texte, "Troisième.");
const toutVide = { texte: "x", parleur: "femme", lignes: [{ parleur: "femme", texte: "  " }] };
T.composerEtape_(toutVide);
assert.equal(toutVide.texte, "");
assert.equal(T.sansEspaces_("  a \n b  "), "a b");

// 3. Une génération par ligne, sans toucher au reste ; réduction en petit menu ; son de fin ; fichiers conservés.
assert.ok(admin.includes("function genererLigne_(i,k){") && admin.includes("blocsDeLigne_(l).forEach(function(b){if(!vus[b.hash]){vus[b.hash]=1;blocs.push(b);}});") && admin.includes("lancerGeneration_(blocs,'Étape '+(i+1)+', ligne '+(k+1));"), "génération d'une seule ligne");
assert.ok(admin.includes('data-adm-l="generer"') && admin.includes('data-adm-l="ecouter"') && admin.includes('data-adm-l="suppr"') && admin.includes('data-adm-e="ligne+"'), "boutons de ligne : écouter, générer, supprimer, ajouter");
assert.ok(admin.includes("fichiersVoixHtml_(blocs,voix)"), "télécharger / remplacer conservés, par ligne");
assert.ok(admin.includes("data-adm-g=\"reduire\"") && admin.includes("act==='reduire'") && admin.includes("act==='agrandir'") && admin.includes("act==='arreter-gen'"), "réduire / rouvrir / arrêter");
assert.ok(admin.includes("#'+EDITEUR_ID+'.adm-reduit{inset:auto 12px 12px auto;") && admin.includes("pointer-events:none") && admin.includes(".adm-reduit .adm-mini-v1{display:block;pointer-events:auto"), "réduit : un petit cadre dans le coin, le jeu reste cliquable");
assert.ok(admin.includes("sonVoixPrete_();") && admin.includes("a.play('voiceDone')"), "son à la fin de la génération");
assert.ok(admin.includes("envoi.etapes.forEach(function(e){delete e.lignes;});"), "le format enregistré ne change pas");
assert.ok(admin.includes("initialiserLignes_(lignesAvant);"), "les lignes en cours d'édition survivent à l'enregistrement");
// La génération continue même réduit : elle ne dépend d'aucun élément visible (les mises à jour cherchent leurs éléments par identifiant).
assert.ok(admin.includes("var mini=document.getElementById('sorealIdleAdminMiniEtatV1');"));
// Son de fin : défini dans l'audio, hors file d'attente des sons de combat (groupe à part).
assert.ok(audio.includes('DEFINITIONS.voiceDone={group:"admin-voice"') && audio.includes('voiceDone:function(){return demander_("voiceDone");}'));
console.log("idle-admin-voix-lignes-v1: OK");
