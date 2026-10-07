import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Toutes les voix éditables, même celles qui se déclenchent sans texte à l'écran (Norman, 2026-10-08) : la voix de fond du sandwich et l'introduction « Chroniques de boss. ».
 * Sans modification la lecture est strictement celle d'avant (mêmes blocs, mêmes empreintes, donc mêmes voix déjà générées).
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const tts = readFileSync("cloudflare/public/modules/tutorial-tts-v202.js", "utf8");
const grabTts = (re) => tts.match(re)[0];
const grabUi = (re) => {
  const m = ui.match(re);
  assert.ok(m, "extrait introuvable : " + re);
  return m[0];
};

const code = [
  grabTts(/var CHUNK_MAX=\d+;/), grabTts(/var PAUSE_OPEN=[^\n]+;/), grabTts(/var PAUSE_CLOSE=[^\n]+;/), grabTts(/var PAUSE_MAX_MS=\d+;/),
  grabTts(/var VOIX_OPEN=[^\n]+;/), grabTts(/var VOIX_CLOSE=[^\n]+;/), grabTts(/var EXPR_OPEN=[^\n]+;/), grabTts(/var EXPR_CLOSE=[^\n]+;/),
  grabTts(/function registreExpressions_\(\)\{[\s\S]*?\n  \}\n/), grabTts(/function resoudreExpressionBalise_\(t\)\{[\s\S]*?\n  \}\n/), grabTts(/function resoudrePauseBalise_\(t\)\{[\s\S]*?\n  \}\n/),
  grabTts(/function normaliserBalise_\(t\)\{[\s\S]*?\n  \}\n/), grabTts(/function resoudreVoixBalise_\(t\)\{[\s\S]*?\n  \}\n/),
  grabTts(/function decouperNarration_\(value\)\{[\s\S]*?\n  \}\n/), grabTts(/function planNarration_\(value\)\{[\s\S]*?\n  \}\n/), grabTts(/function retirerParentheses_\(texte\)\{[\s\S]*?\n  \}\n/),
  // le texte du jeu
  grabUi(/function pauseVoixIdleV1_\(ms\)\{[\s\S]*?\n      \}\n/),
  grabUi(/const VOIX_ARRIERE_PLAN_SANDWICH_IDLE_V1=[\s\S]*?CROYEZ TOUT CE QU’IL VOUS DIT\.';/),
  grabUi(/function baliseursPausesIdleV1_\(texte\)\{[\s\S]*?\n      \}\n/),
  grabUi(/const TEXTE_VOIX_SANDWICH_EDITABLE_IDLE_V1=[^\n]+;/),
  "return {plan:planNarration_,retirer:retirerParentheses_,origine:VOIX_ARRIERE_PLAN_SANDWICH_IDLE_V1,editable:TEXTE_VOIX_SANDWICH_EDITABLE_IDLE_V1};"
].join("\n");
const voix = { resoudre: (t) => ({ marius: "marius" })[String(t).toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "")] || "" };
const fenetre = {};
vm.runInNewContext(readFileSync("cloudflare/public/modules/voix-expressions-v1.js", "utf8"), { window: fenetre });
const { plan, retirer, origine, editable } = new Function("window", code)({ __SOREAL_IDLE_VOIX_NOMMEES_V1__: voix, __SOREAL_IDLE_EXPRESSIONS_V1__: fenetre.__SOREAL_IDLE_EXPRESSIONS_V1__ });

// Le texte éditable montre ses balises, lisibles : une pause et la voix de la dame
assert.ok(editable.includes("(pause 900ms) (femme) J’ADORE SOREAL IDLE."), "balises visibles dans l'éditeur : " + editable);
assert.ok(!/[-]/.test(editable), "aucun marqueur invisible dans le texte montré à l'administrateur");
// Lecture : mêmes blocs, même pause qu'avec le texte codé d'origine ; seule la dame a en plus sa voix explicite
const lecturePlan = plan(retirer(editable));
const originePlan = plan(origine);
assert.deepEqual(lecturePlan.map((e) => e.chunk ?? e.pause), originePlan.map((e) => e.chunk ?? e.pause), "mêmes blocs de texte et même pause : les voix déjà générées restent valables");
assert.equal(lecturePlan.find((e) => e.chunk && e.chunk.includes("J’ADORE")).voix, "femme", "la dame a sa voix explicite");

// Branchement
assert.ok(ui.includes("const CLE_VOIX_SANDWICH_IDLE_V1='systeme:sandwich';") && ui.includes("const CLE_VOIX_CHRONIQUES_INTRO_IDLE_V1='systeme:chroniques-intro';"), "clés de surcharge");
assert.ok(ui.includes("groupe:'Voix sans texte à l’écran'"), "groupe dédié dans l'éditeur");
assert.ok(ui.includes("T.declarer(CLE_VOIX_SANDWICH_IDLE_V1,{") && ui.includes("T.declarer(CLE_VOIX_CHRONIQUES_INTRO_IDLE_V1,{"), "les deux voix sont déclarées à l'éditeur");
assert.ok(ui.includes("tts.readText(texteVoixSansTexteIdleV1_(CLE_VOIX_SANDWICH_IDLE_V1,VOIX_ARRIERE_PLAN_SANDWICH_IDLE_V1))"), "le sandwich lit la version modifiée");
assert.ok(ui.includes("texteVoixSansTexteIdleV1_(CLE_VOIX_CHRONIQUES_INTRO_IDLE_V1,TEXTE_CHRONIQUES_INTRO_IDLE_V1)+M(1500)"), "l'intro des chroniques lit la version modifiée");
// Sans surcharge : repli sur l'origine
{
  const f = ui.slice(ui.indexOf("function texteVoixSansTexteIdleV1_(cle,origine){"), ui.indexOf("function lancerVoixArrierePlanSandwichIdleV1_(){"));
  const lire = new Function("window", f + "\nreturn texteVoixSansTexteIdleV1_;");
  const sans = lire({})("systeme:sandwich", "ORIGINE");
  assert.equal(sans, "ORIGINE", "sans module de textes : l'origine");
  const modif = lire({
    __SOREAL_IDLE_TEXTES_V1__: { surcharge: (c) => (c === "systeme:sandwich" ? { texte: "(marius) Nouveau  texte. (pause 1s) Fin." } : null) },
    __SOREAL_IDLE_TUTORIAL_TTS_V209__: { retirerParentheses: retirer }
  });
  assert.ok(modif("systeme:sandwich", "ORIGINE").includes("Nouveau texte."), "texte modifié lu");
  assert.equal(modif("systeme:autre", "ORIGINE"), "ORIGINE", "autre clé : l'origine");
}
console.log("idle-voix-sans-texte-v1: OK");
