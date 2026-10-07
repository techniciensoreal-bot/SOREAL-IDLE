import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Expressions et pauses des voix (Norman, 2026-10-08) : « (joyeux) » change la façon de dire ce qui suit (réglage du studio à la génération), « (pause 2s) » ajoute un silence ;
 * ni l'une ni l'autre n'est jamais lue, et le texte des blocs (donc leur empreinte et les voix déjà générées) ne change pas.
 */
const registreSource = readFileSync("cloudflare/public/modules/voix-expressions-v1.js", "utf8");
const fenetre = {};
vm.runInNewContext(registreSource, { window: fenetre });
const R = fenetre.__SOREAL_IDLE_EXPRESSIONS_V1__;
assert.ok(R && Array.isArray(R.liste) && R.liste.length >= 6, "registre des expressions");

// --- Registre : expressions reconnues sans tenir compte des accents ni des majuscules ---
assert.equal(R.resoudre("joyeux"), "joyeux");
assert.equal(R.resoudre(" Énergique "), "energique");
assert.equal(R.resoudre("En colère"), "colere");
assert.equal(R.resoudre("fâché"), "colere", "variante d'écriture");
assert.equal(R.resoudre("Mystérieux"), "mysterieux");
assert.equal(R.resoudre("neutre"), "neutre");
assert.equal(R.resoudre("Marius"), "", "un nom de voix n'est pas une expression");
assert.equal(R.resoudre("une note"), "");
assert.equal(R.reglages("neutre"), null, "neutre ne force aucun réglage : ceux de la voix");
assert.deepEqual(JSON.parse(JSON.stringify(R.reglages("dramatique"))), { exaggeration: 0.85, cfg: 0.25 });
R.liste.forEach((e) => { if (e.id !== "neutre") assert.ok(e.exaggeration > 0 && e.exaggeration <= 1 && e.cfg > 0 && e.cfg <= 1, "réglages valides : " + e.id); });
// --- Pauses ---
assert.equal(R.pauseMs("pause"), 1000);
assert.equal(R.pauseMs("Pause 2s"), 2000);
assert.equal(R.pauseMs("pause 2"), 2000);
assert.equal(R.pauseMs("pause 1,5 s"), 1500);
assert.equal(R.pauseMs("pause 800ms"), 800);
assert.equal(R.pauseMs("courte pause"), 500);
assert.equal(R.pauseMs("Longue pause"), 2500);
assert.equal(R.pauseMs("pause 99s"), 5000, "plafonnée à 5 s comme les autres pauses");
assert.equal(R.pauseMs("pause 0"), 0);
assert.equal(R.pauseMs("pausez"), 0);
assert.equal(R.pauseMs("marius"), 0);
assert.equal(R.balisePause(2000), "(pause 2s)");
assert.equal(R.balisePause(800), "(pause 800ms)");
assert.equal(R.baliseExpression("joyeux"), "(joyeux)");
R.pauses.forEach((p) => assert.equal(R.pauseMs(p.tag.slice(1, -1)), p.ms, "la balise proposée donne sa durée : " + p.tag));

// --- Narration : mêmes extraits du module que les autres tests ---
const tts = readFileSync("cloudflare/public/modules/tutorial-tts-v202.js", "utf8");
const grab = (re) => tts.match(re)[0];
const code = [
  grab(/var CHUNK_MAX=\d+;/),
  grab(/var PAUSE_OPEN=[^\n]+;/),
  grab(/var PAUSE_CLOSE=[^\n]+;/),
  grab(/var PAUSE_MAX_MS=\d+;/),
  grab(/var VOIX_OPEN=[^\n]+;/),
  grab(/var VOIX_CLOSE=[^\n]+;/),
  grab(/var EXPR_OPEN=[^\n]+;/),
  grab(/var EXPR_CLOSE=[^\n]+;/),
  grab(/function registreExpressions_\(\)\{[\s\S]*?\n  \}\n/),
  grab(/function resoudreExpressionBalise_\(t\)\{[\s\S]*?\n  \}\n/),
  grab(/function resoudrePauseBalise_\(t\)\{[\s\S]*?\n  \}\n/),
  grab(/function normaliserBalise_\(t\)\{[\s\S]*?\n  \}\n/),
  grab(/function resoudreVoixBalise_\(t\)\{[\s\S]*?\n  \}\n/),
  grab(/function decouperNarration_\(value\)\{[\s\S]*?\n  \}\n/),
  grab(/function planNarration_\(value\)\{[\s\S]*?\n  \}\n/),
  grab(/function retirerParentheses_\(texte\)\{[\s\S]*?\n  \}\n/),
  "return {plan:planNarration_,retirer:retirerParentheses_};"
].join("\n");
const voix = { resoudre: (t) => ({ marius: "marius", lea: "lea" })[String(t).toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "")] || "" };
const { plan, retirer } = new Function("window", code)({ __SOREAL_IDLE_VOIX_NOMMEES_V1__: voix, __SOREAL_IDLE_EXPRESSIONS_V1__: R });
const lire = (texte) => plan(retirer(texte));

// Une expression accompagne les blocs suivants, jusqu'à la suivante ; neutre la retire
assert.deepEqual(lire("Salut. (joyeux) Bravo ! (neutre) Et voilà."), [
  { chunk: "Salut." },
  { chunk: "Bravo !", expr: "joyeux" },
  { chunk: "Et voilà." }
]);
// Une nouvelle voix revient au ton neutre ; l'expression peut suivre la voix
assert.deepEqual(lire("(marius) (dramatique) Il était une fois. (lea) Bonjour."), [
  { chunk: "Il était une fois.", voix: "marius", expr: "dramatique" },
  { chunk: "Bonjour.", voix: "lea" }
]);
assert.deepEqual(lire("(marius) (joyeux) Un. (lea) (calme) Deux."), [
  { chunk: "Un.", voix: "marius", expr: "joyeux" },
  { chunk: "Deux.", voix: "lea", expr: "calme" }
]);
// Une pause devient un silence entre deux textes (jamais en tête ni en fin), sans rien changer au texte des blocs
assert.deepEqual(lire("Attention. (pause 2s) Regardez."), [{ chunk: "Attention." }, { pause: 2000 }, { chunk: "Regardez." }]);
assert.deepEqual(lire("(pause) Début. (longue pause) Fin. (courte pause)"), [{ chunk: "Début." }, { pause: 2500 }, { chunk: "Fin." }]);
assert.deepEqual(lire("A. (pause 800ms) B."), [{ chunk: "A." }, { pause: 800 }, { chunk: "B." }]);
// L'expression survit à une pause
assert.deepEqual(lire("(energique) Un. (pause 1s) Deux."), [{ chunk: "Un.", expr: "energique" }, { pause: 1000 }, { chunk: "Deux.", expr: "energique" }]);
// Le texte des blocs est inchangé : même empreinte que sans balises
assert.equal(lire("(joyeux) Bonjour tout le monde.")[0].chunk, lire("Bonjour tout le monde.")[0].chunk);
// Une parenthèse quelconque reste une note non lue
assert.deepEqual(lire("Il entre (note de mise en scène) et sourit."), [{ chunk: "Il entre et sourit." }]);
// Sans registre d'expressions (module non chargé) : les balises sont simplement ignorées, jamais lues
{
  const sans = new Function("window", code)({ __SOREAL_IDLE_VOIX_NOMMEES_V1__: voix });
  assert.deepEqual(sans.plan(sans.retirer("(joyeux) Salut. (pause 2s) Fin.")), [{ chunk: "Salut. Fin." }]);
}
// Branchement
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(/\/modules\/voix-expressions-v1\.js\?v=\d+/.test(index), "registre chargé par la page");
assert.ok(index.indexOf("voix-expressions-v1.js") < index.indexOf("tutorial-tts-v202.js") + 200, "chargé avec le module de narration");
assert.ok(tts.includes("resoudreExpressionBalise:resoudreExpressionBalise_") && tts.includes("resoudrePauseBalise:resoudrePauseBalise_"), "exposé par le module de narration");
console.log("idle-voix-expressions-v1: OK");
