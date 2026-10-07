import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Éditeur de textes et de voix refait (Norman, 2026-10-08) : une bulle par personnage, choix de la voix APRÈS l'avoir écoutée, expressions, pauses, boutons évidents.
 * Les expressions et les pauses sont des balises du texte : l'éditeur les range dans les bulles et les recompose sans rien perdre.
 */
const src = readFileSync("cloudflare/public/modules/textes-admin-v1.js", "utf8");
const regSource = readFileSync("cloudflare/public/modules/voix-expressions-v1.js", "utf8");
const fenetreReg = {};
vm.runInNewContext(regSource, { window: fenetreReg });
const R = fenetreReg.__SOREAL_IDLE_EXPRESSIONS_V1__;

// --- Conversions texte <-> bulles : mêmes extraits que les autres tests, avec un module de narration simulé ---
const debut = src.indexOf("function champParle_(c){");
const fin = src.indexOf("function blocsParCadre_(valeurs){");
assert.ok(debut > 0 && fin > debut, "extrait des conversions");
const voixDeBalise = (c) => { const n = String(c).toLowerCase().replace(/[^a-z0-9]/g, ""); return n === "homme" || n === "narrateur" ? "homme" : n === "femme" ? "femme" : n === "marius" ? "marius" : ""; };
const tts = { resoudreExpressionBalise: (c) => R.resoudre(c) };
const T = new Function("voixDeBalise_", "tts_",
  src.slice(debut, fin) + "\nreturn {lignesDepuisTexte_,texteDepuisLignes_,lignesDepuisListe_,listeDepuisLignes_,etatFinal_,teteBalises_};")(voixDeBalise, () => tts);
const json = (v) => JSON.stringify(v);

// Une expression en tête d'un texte : elle devient la propriété de la bulle (le texte n'en garde pas la balise)
assert.equal(json(T.lignesDepuisTexte_("(joyeux) Bravo !")), json([{ parleur: "narrateur", expr: "joyeux", texte: "Bravo !" }]));
assert.equal(json(T.lignesDepuisTexte_("Il entre. (marius) (dramatique) Salut. (femme) Bonjour.")), json([
  { parleur: "narrateur", expr: "", texte: "Il entre." },
  { parleur: "marius", expr: "dramatique", texte: "Salut." },
  { parleur: "femme", expr: "", texte: "Bonjour." }
]), "une nouvelle voix revient au ton neutre");
// Une pause reste dans le texte de la bulle (elle se place où on veut dans la phrase)
assert.equal(json(T.lignesDepuisTexte_("(marius) Attends. (pause 2s) Voilà.")), json([{ parleur: "marius", expr: "", texte: "Attends. (pause 2s) Voilà." }]));
// Aller-retour sans perte
for (const texte of ["Bonjour.", "(joyeux) Bravo !", "Il entre. (marius) (dramatique) Salut. (femme) Bonjour.", "(marius) Attends. (pause 2s) Voilà."]) {
  assert.equal(T.texteDepuisLignes_(T.lignesDepuisTexte_(texte)), texte, "aller-retour : " + texte);
}
// Liste de paragraphes (tutoriels, nouveautés) : l'expression d'un paragraphe ne déborde pas sur le suivant
const paragraphes = ["Un paragraphe.", "(joyeux) Un autre, joyeux.", "(neutre) Retour au ton naturel.", "(femme) (calme) Elle parle doucement.", "Elle continue calmement."];
const cadres = T.lignesDepuisListe_(paragraphes);
assert.equal(json(cadres.map((c) => [c.parleur, c.expr])), json([["narrateur", ""], ["narrateur", "joyeux"], ["narrateur", ""], ["femme", "calme"], ["femme", "calme"]]));
assert.equal(json(T.listeDepuisLignes_(cadres)), json(paragraphes), "aller-retour d'une liste de paragraphes");
// Changer l'expression d'une bulle suffit à écrire la balise, et la bulle suivante revient au neutre si besoin
assert.equal(json(T.listeDepuisLignes_([{ parleur: "narrateur", expr: "joyeux", texte: "A." }, { parleur: "narrateur", expr: "", texte: "B." }])), json(["(joyeux) A.", "(neutre) B."]));
assert.equal(json(T.etatFinal_("Salut (energique) vite (pause 1s)", "narrateur", "")), json({ voix: "narrateur", expr: "energique" }));

// --- Balises jamais affichées : voix, expressions et pauses disparaissent du texte montré ---
{
  const d = src.indexOf("/* Expression ou pause désignée par le contenu d'une parenthèse");
  const f = src.indexOf("function aDesBalises_(texte){");
  const code = src.slice(d, f) + "\nreturn sansBalises_;";
  const sansBalises = new Function("voixDeBalise_", "tts_", code)(voixDeBalise, () => ({ resoudreExpressionBalise: (c) => R.resoudre(c), resoudrePauseBalise: (c) => R.pauseMs(c) }));
  assert.equal(sansBalises("(marius) (joyeux) Bonjour (pause 2s) tout le monde."), "Bonjour tout le monde.");
  assert.equal(sansBalises("Une (note de mise en scène) reste."), "Une (note de mise en scène) reste.", "une parenthèse ordinaire reste affichée");
}

// --- Interface : module partagé (sélecteur avec écoute, puces, pauses) branché dans l'éditeur de textes ---
const ui = readFileSync("cloudflare/public/modules/voix-ui-v1.js", "utf8");
assert.ok(ui.includes('data-vu-pick="voix"') && ui.includes('data-vu-pick="expr"'), "puces voix et expression sur chaque bulle");
assert.ok(src.includes("u.chipsHtml(cle,l)") && src.includes("u.pausesHtml(cle,'stx-voix')") && src.includes("u.pauseBoutonHtml(cle,'stx-voix')"), "l'éditeur de textes utilise les briques partagées");
assert.ok(ui.includes("function essayer_(voixId,exprId,bouton){") && ui.includes("o.synthetiserBrut(phrase,voixId,exprId)"), "écouter une voix (avec son expression) avant de la choisir");
assert.ok(ui.includes('data-vu-essai="') && ui.includes("▶ Écouter</button></div>"), "bouton Écouter sur chaque voix du sélecteur");
assert.ok(ui.includes("🚀 Lancer le studio") && ui.includes("Le studio de voix n’est pas lancé sur ce PC"), "message utile si le studio n'est pas lancé");
assert.ok(src.includes("function appliquerChoix_(type,cle,valeur){") && src.includes("edition.aRefaire[b.hash]=1"), "changer de voix ou d'expression marque les fichiers à refaire");
assert.ok(ui.includes("function insererPause(ta,balise){") && ui.includes("data-vu-pausebtn="), "bouton Pause qui insère une balise au curseur");
assert.ok(ui.includes("pausesListe().map(") && R.pauses.length >= 4, "pauses courte, normale, longue, très longue");
assert.ok(src.includes('class="stx-pied"') && src.includes("💾 Enregistrer") && src.includes("🎙 Tout générer") && src.includes('stx-lib'), "bandeau d'actions toujours visible");
assert.ok(src.includes("outerHTML=puceStudioHtml_()") && ui.includes("🟢 Studio prêt") && ui.includes("🔴 Studio éteint"), "état du studio d'un coup d'œil");
assert.ok(src.includes("Voix sans texte") && src.includes("stx-groupe"), "voix cachées en tête de la liste, groupes repliables");
assert.ok(ui.includes("registreVoix_().forEach(function(v,i){if(v.id===id)rang=i;});"), "une couleur distincte par voix nommée");
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(/\/modules\/voix-ui-v1\.js\?v=\d+/.test(index) && index.indexOf("voix-ui-v1.js") < index.indexOf("textes-admin-v1.js"), "module partagé chargé avant les éditeurs");
// Une voix est « prête » seulement si son fichier existe ET qu'elle n'est pas à refaire
assert.ok(/prets=blocs\.filter\(function\(b\)\{return voix\.indexOf\(b\.hash\)!==-1&&!aR\[b\.hash\];\}\)/.test(src), "état « Voix prête » tenant compte des voix à refaire");
// Expression envoyée au studio à la génération, jamais à la lecture
const histoires = readFileSync("cloudflare/public/modules/admin-histoires-v1.js", "utf8");
assert.ok(histoires.includes("corps.exaggeration=r.exaggeration;corps.cfg=r.cfg;"), "réglages de l'expression envoyés au studio");
assert.ok(src.includes("o.synthetiser(b.texte,b.parleur,b.expr)"), "la génération passe l'expression du bloc");
console.log("idle-textes-editeur-v2-v1: OK");
