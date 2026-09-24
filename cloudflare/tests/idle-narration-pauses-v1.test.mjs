import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-24) : lire « Chronique du boss (petit arrêt) Gorgonzola (arrêt plus long que le point) puis l'histoire », et
 * mettre en « note » TOUS les paragraphes du début entre parenthèses (déblocages), pas seulement le premier.
 */
const tts = readFileSync("cloudflare/public/modules/tutorial-tts-v202.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// --- Découpe : marqueurs de pause -> silences, textes en blocs ---
const grab = (re) => tts.match(re)[0];
const code = [
  grab(/var CHUNK_MAX=\d+;/),
  grab(/var PAUSE_OPEN=[^\n]+;/),
  grab(/var PAUSE_CLOSE=[^\n]+;/),
  grab(/var PAUSE_MAX_MS=\d+;/),
  grab(/function decouperNarration_\(value\)\{[\s\S]*?\n  \}\n/),
  grab(/function planNarration_\(value\)\{[\s\S]*?\n  \}\n/),
  "return {planNarration_:planNarration_,open:PAUSE_OPEN,close:PAUSE_CLOSE};"
].join("\n");
const { planNarration_: plan, open, close } = new Function(code)();
const marque = (ms) => " " + open + ms + close + " ";

assert.deepEqual(plan("Bonjour tout le monde."), [{ chunk: "Bonjour tout le monde." }]);
assert.deepEqual(
  plan("Chronique du boss" + marque(450) + "Gorgonzola" + marque(1100) + "Il était une fois. Un boss."),
  [{ chunk: "Chronique du boss" }, { pause: 450 }, { chunk: "Gorgonzola" }, { pause: 1100 }, { chunk: "Il était une fois. Un boss." }],
  "titre, pause courte, nom, pause plus longue, récit"
);
assert.deepEqual(plan(marque(500) + "Salut" + marque(500)), [{ chunk: "Salut" }], "aucune pause en tête ni en fin de lecture");
assert.deepEqual(plan("A" + marque(300) + marque(700) + "B"), [{ chunk: "A" }, { pause: 300 }, { chunk: "B" }], "deux pauses de suite : une seule");
assert.deepEqual(plan("A" + marque(99999) + "B")[1], { pause: 5000 }, "pause plafonnée");
{
  const long = "Une phrase assez longue pour le test. ".repeat(60);
  const steps = plan(long);
  assert.ok(steps.length > 1 && steps.every((s) => s.chunk && s.chunk.length <= 600), "le récit est découpé en blocs de 600 caractères au plus");
}

// --- Lecture : préchargement du bloc suivant ---
assert.match(tts, /assurer\(prochainTexte\(i\+1\),true\);/);
assert.match(tts, /el\.getAttribute\('data-soreal-tts-pause'\)/);

// --- Balisage de la chronique ---
assert.match(ui, /soreal-idle-boss-lore-title-v168" data-soreal-tts-pause="450"/);
assert.match(ui, /soreal-idle-boss-lore-name-v184" data-soreal-tts-pause="1100"/);
assert.match(ui, /soreal-idle-boss-lore-ornament-v184" data-soreal-tts-ignore/);

// --- Notes entre parenthèses : toutes, en tête seulement, ligne entière ---
{
  const re = ui.match(/const infoMatch=narration\.match\((\/[^\n]+\/)\);/)[1];
  const regex = new RegExp(re.slice(1, -1));
  const histoire =
    "(Fonctionnalité Augmentation débloquée !)\n\n(Une nouvelle Zone d'Aventure a été débloquée : Forêt !)\n\nÉpuisé, tu titubes. (Oh oh.)";
  const notes = [];
  let narration = histoire;
  for (;;) {
    const m = narration.match(regex);
    if (!m) break;
    notes.push("(" + m[1].trim() + ")");
    narration = narration.slice(m[0].length).trim();
  }
  assert.deepEqual(notes, ["(Fonctionnalité Augmentation débloquée !)", "(Une nouvelle Zone d'Aventure a été débloquée : Forêt !)"]);
  assert.equal(narration, "Épuisé, tu titubes. (Oh oh.)", "une parenthèse au milieu du récit reste dans le récit");
  assert.equal("(Note) Et la suite.".match(regex), null, "une parenthèse suivie de texte sur la même ligne n'est pas une note");
}
assert.match(ui, /notesDeblocage\.map\(function\(note\)\{\s*return '<div class="soreal-idle-boss-lore-info-v198" data-soreal-tts-pause="700">'/);

console.log("idle-narration-pauses-v1: OK");
