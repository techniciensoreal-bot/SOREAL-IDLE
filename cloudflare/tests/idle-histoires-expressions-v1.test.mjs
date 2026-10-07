import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Histoires plein écran : expressions et pauses (Norman, 2026-10-08). L'éditeur range l'expression de chaque ligne dans sa bulle et la recompose dans le texte de l'étape ;
 * le lecteur ne les affiche jamais et les lit (pauses) / les transmet à la génération (expressions).
 */
const admin = readFileSync("cloudflare/public/modules/admin-histoires-v1.js", "utf8");
const moteur = readFileSync("cloudflare/public/modules/story-engine-v1.js", "utf8");
const reg = {};
vm.runInNewContext(readFileSync("cloudflare/public/modules/voix-expressions-v1.js", "utf8"), { window: reg });
const R = reg.__SOREAL_IDLE_EXPRESSIONS_V1__;

// --- Lecteur : mêmes extraits que les autres tests du moteur, avec un module de narration simulé ---
const faux = { addEventListener() {}, getElementById: () => null, createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, classList: { add() {}, remove() {} } }), head: { appendChild() {} }, body: { appendChild() {} } };
const fenetre = {
  __SOREAL_IDLE_TUTORIAL_TTS_V209__: {
    resoudreExpressionBalise: (c) => R.resoudre(c),
    resoudrePauseBalise: (c) => R.pauseMs(c),
    retirerParentheses: (t) => t
  }
};
vm.runInNewContext(readFileSync("cloudflare/public/modules/voix-nommees-v1.js", "utf8"), { window: fenetre });
new Function("window", "document", "localStorage", "setTimeout", moteur)(fenetre, faux, { getItem: () => null, setItem() {} }, setTimeout);
const segmenter = fenetre.__SOREAL_IDLE_STORY_ENGINE_V1__.segmenter;
const seg = segmenter("(joyeux) Bonjour tout le monde. (pause 2s) (femme) (calme) Salut.", "narrateur");
assert.equal(seg.affiche, "Bonjour tout le monde. Salut.", "ni expression ni pause à l'écran");
assert.equal(seg.segments.length, 2, "toujours découpé par voix");
assert.ok(seg.segments[0].texte.includes("(joyeux)") && seg.segments[0].texte.includes("(pause 2s)"), "le texte à lire garde ses balises pour le module de narration");
assert.equal(segmenter("Il entre (note de mise en scène) et sourit.", "narrateur").affiche, "Il entre (note de mise en scène) et sourit.", "une parenthèse ordinaire reste affichée");
assert.ok(moteur.includes("t.retirerParentheses(decoupe.segments[k].texte)") && moteur.includes("t.retirerParentheses(s.texte)"), "la lecture et le préchargement passent par le module de narration (pauses et expressions)");

// --- Éditeur : lignes <-> texte de l'étape, avec expression ---
const debut = admin.indexOf("function parleurUi_(p){");
const fin = admin.indexOf("function blocsDeLigne_(l){");
assert.ok(debut > 0 && fin > debut, "extrait des lignes");
const canon = (p) => (p === "homme" ? "homme" : p || "narrateur");
const segs = (e) => segmenter(e.texte, e.parleur).segments;
const T = new Function("segmenter", "parleurCanon_", "segmentsDeEtape_", "tts_",
  admin.slice(debut, fin) + "\nreturn {etapeVide_,lignesDepuisEtape_,composerEtape_,exprTete_};")(segmenter, canon, segs, () => fenetre.__SOREAL_IDLE_TUTORIAL_TTS_V209__);
const json = (v) => JSON.stringify(v);

assert.equal(json(T.etapeVide_("a.png").lignes), json([{ parleur: "narrateur", expr: "", texte: "" }]), "une ligne neutre par défaut");
assert.equal(json(T.exprTete_("(joyeux) Bravo !")), json({ expr: "joyeux", reste: "Bravo !" }));
assert.equal(json(T.exprTete_("(neutre) Calme.")), json({ expr: "", reste: "Calme." }));
assert.equal(json(T.exprTete_("Pas d'expression.")), json({ expr: "", reste: "Pas d'expression." }));

const etape = { texte: "(joyeux) Il était une fois. (femme) (dramatique) Et voilà. (pause 1s) Fin. (marius) Salut.", parleur: "narrateur" };
const lignes = T.lignesDepuisEtape_(etape);
assert.equal(json(lignes), json([
  { parleur: "narrateur", expr: "joyeux", texte: "Il était une fois." },
  { parleur: "femme", expr: "dramatique", texte: "Et voilà. (pause 1s) Fin." },
  { parleur: "marius", expr: "", texte: "Salut." }
].map((x) => x)), "expression en tête de chaque ligne ; la pause reste dans le texte");
const recompose = { texte: "", parleur: "", lignes };
T.composerEtape_(recompose);
assert.equal(recompose.texte, "(joyeux) Il était une fois. (femme) (dramatique) Et voilà. (pause 1s) Fin. (marius) Salut.", "aller-retour sans perte");
assert.equal(recompose.parleur, "narrateur");

// --- Branchement ---
assert.ok(admin.includes("data-adm-lexpr=") && admin.includes("u.chipsHtml(cle,l)") && admin.includes("u.pausesHtml(cle,'soreal-idle-adm-btn-v1')"), "puces, expression et pauses dans chaque ligne");
assert.ok(admin.includes("function appliquerChoix_(type,cle,valeur){") && admin.includes("edition.aRefaire[b.hash]=1"), "changer de voix ou d'expression : fichiers à refaire");
assert.ok(admin.includes("return blocsDeTexte_((l&&l.expr?'('+l.expr+') ':'')+(l&&l.texte))"), "les blocs d'une ligne portent son expression (texte et empreinte inchangés)");
assert.ok(admin.includes("var aFaire=blocs.filter(function(b){return toutes||!bloc_Pret_(b.hash);});"), "« Générer les voix » refait les voix dont l'expression ou la voix a changé");
assert.ok(admin.includes('class="adm-plus-v1"'), "actions secondaires rangées dans « ⋯ »");
console.log("idle-histoires-expressions-v1: OK");
