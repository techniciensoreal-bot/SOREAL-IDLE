import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { chargerBoss } from "../tools/voice-generate.mjs";

/*
 * Norman (2026-09-24) : « je n'aime pas la voix IA, j'aimerais les générer une fois et les rendre jouables sur le site via un format
 * pas lourd ». Les blocs de texte sont lus depuis /voice/<empreinte>.m4a (AAC mono) ; Piper local ne sert plus que de repli.
 */
const tts = readFileSync("cloudflare/public/modules/tutorial-tts-v202.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

const grab = (re) => tts.match(re)[0];
const code = [
  grab(/var CHUNK_MAX=\d+;/),
  grab(/var PAUSE_OPEN=[^\n]+;/),
  grab(/var PAUSE_CLOSE=[^\n]+;/),
  grab(/var PAUSE_MAX_MS=\d+;/),
  grab(/var VOICE_TAG='[^']+';/),
  grab(/function hashBloc_\(text\)\{[\s\S]*?\n  \}\n/),
  grab(/function decouperNarration_\(value\)\{[\s\S]*?\n  \}\n/),
  grab(/function planNarration_\(value\)\{[\s\S]*?\n  \}\n/),
  grab(/var MOTIF_NOTE_BOSS=[^\n]+;/),
  grab(/function composerChronique_\(nom,histoire\)\{[\s\S]*?\n  \}\n/),
  "return {hash:hashBloc_,plan:planNarration_,composer:composerChronique_,open:PAUSE_OPEN,close:PAUSE_CLOSE,motif:MOTIF_NOTE_BOSS};"
].join("\n");
const { hash, plan, composer, open, close, motif } = new Function(code)();
const marque = (ms) => " " + open + ms + close + " ";

// --- Empreinte : stable, 14 caractères hexadécimaux, insensible aux espaces, sensible au texte ---
assert.match(hash("Bonjour."), /^[0-9a-f]{14}$/);
assert.equal(hash("Bonjour."), hash("  Bonjour.  "));
assert.equal(hash("Bonjour   tout\nle monde."), hash("Bonjour tout le monde."));
assert.notEqual(hash("Bonjour."), hash("Bonjour !"));

// --- Composition d'une chronique = balisage affiché (titre, nom, notes, récit, mêmes pauses) ---
assert.deepEqual(plan(composer("Gorgonzola", "Il était une fois.")), [
  { chunk: "Chronique du boss" }, { pause: 450 }, { chunk: "Gorgonzola" }, { pause: 1100 }, { chunk: "Il était une fois." }
]);
assert.deepEqual(plan(composer("Gorgonzola", "(Zone débloquée !)\n\n(Autre note.)\n\nRécit. (pas une note)")), [
  { chunk: "Chronique du boss" }, { pause: 450 }, { chunk: "Gorgonzola" }, { pause: 1100 },
  { chunk: "(Zone débloquée ! )" }, { pause: 700 }, { chunk: "(Autre note. )" }, { pause: 700 }, { chunk: "Récit. (pas une note)" }
]);
assert.match(ui, /soreal-idle-boss-lore-title-v168" data-soreal-tts-pause="450"/);
assert.match(ui, /soreal-idle-boss-lore-name-v184" data-soreal-tts-pause="1100"/);
assert.match(ui, /soreal-idle-boss-lore-info-v198" data-soreal-tts-pause="700"/);

// --- Le jeu (affichage) et le module de narration séparent les notes avec le même motif ---
const motifJeu = ui.match(/const infoMatch=narration\.match\((\/[^\n]+\/)\);/)[1];
assert.equal(motif.toString(), motifJeu, "même motif de notes dans l'affichage et dans la narration");

// --- Client : fichier pré-généré d'abord, Piper en repli ---
assert.match(tts, /blobs\[i\]=obtenirAudioBloc_\(steps\[i\]\.chunk,idCible,myGeneration,silent\);/);
assert.match(tts, /if\(blob\)\{voiceStats\.fichiers\+=1;return blob;\}\s*voiceStats\.piper\+=1;\s*return requestLocalNeuralAudio_\(/);
assert.match(tts, /VOICE_DIR\+'manifest\.json'/);
assert.match(tts, /VOICE_DIR\+hash\+'\.m4a'/);
assert.match(tts, /catch\(function\(\)\{return \{\};\}\)/, "manifeste absent -> Piper, pas d'erreur");
assert.match(tts, /planNarration:planNarration_,\s*hashBloc:hashBloc_,\s*composerChronique:composerChronique_/);

// --- Histoires de boss lues seules (fiche du boss, collection) : mêmes blocs que la chronique ---
assert.match(tts, /panel\.hasAttribute\('data-soreal-tts-chronique'\)/);
assert.match(tts, /composerChronique_\(panel\.getAttribute\('data-soreal-tts-chronique'\),panel\.textContent\)/);
assert.match(ui, /id="sorealIdleBossModalStoryV206_\$\{idleEntier_\(b\.numero\)\}" class="soreal-idle-boss-story-v91"\$\{b\.histoire\?' data-soreal-tts-chronique="'/);
assert.match(ui, /class="soreal-idle-bestiary-desc-v110"'\+\s*\(idleEntier_\(e\.numero\)>0\?' data-soreal-tts-chronique="'/);

// --- Panneaux d'explication : le texte lu est construit à partir des données (attribut), jamais relevé dans le DOM ---
assert.match(tts, /panel\.hasAttribute\('data-soreal-tts-say'\)/);
assert.equal((ui.match(/data-soreal-tts-say="'\+idleHtml_\(texteVoix/g) || []).length, 4, "tutoriel long, popup nouveauté, carte Info, carte Norman & Sébastien");
assert.match(ui, /root\.setAttribute\('data-soreal-tts-say',texteVoixTutorielIdleV1_\(page\)\);/, "tutoriel flottant");
assert.match(ui, /window\.__sorealVoiceTextesIdleV1__=function\(\)\{/);
assert.match(readFileSync("cloudflare/tools/voice-generate.mjs", "utf8"), /window\.__sorealVoiceTextesIdleV1__\(\)/);

// --- « Lire toute l'histoire » : même composition que la chronique affichée ---
{
  const f = ui.slice(ui.indexOf("function lireHistoireCompleteBossIdleV206_(){"), ui.indexOf("window.__lireHistoireCompleteBossIdleV206__="));
  assert.match(f, /composerChronique\(String\(b\.nom\|\|'Boss'\),String\(b\.histoire\|\|''\)\)/);
  assert.match(f, /'Chroniques de boss\.'\+M\(1500\)/);
  assert.match(f, /\.join\(M\(2000\)\)/);
}

// --- Couverture : chaque bloc de chaque chronique a son fichier (généré par cloudflare/tools/voice-generate.mjs) ---
{
  const manifeste = JSON.parse(readFileSync("cloudflare/public/voice/manifest.json", "utf8"));
  const fichiers = new Set(manifeste.files);
  const surDisque = new Set(readdirSync("cloudflare/public/voice").filter((f) => f.endsWith(".m4a") && !f.includes(".tmp")).map((f) => f.slice(0, -4)));
  assert.equal(manifeste.v, 1);
  assert.deepEqual([...fichiers].sort(), [...surDisque].sort(), "manifest.json = les fichiers présents");
  const manquants = [];
  const blocs = (texte) => plan(texte).filter((e) => e.chunk != null).map((e) => hash(e.chunk));
  for (const h of blocs("Chroniques de boss." + marque(1500))) if (!fichiers.has(h)) manquants.push("intro");
  for (const b of chargerBoss()) {
    for (const h of blocs(composer(b.nom, b.histoire))) if (!fichiers.has(h)) manquants.push("boss " + b.id);
  }
  assert.deepEqual(manquants, [], "blocs sans fichier audio : relancer node cloudflare/tools/voice-generate.mjs");
  assert.ok(existsSync("cloudflare/public/voice/manifest.json"));
}

console.log("idle-voice-pregenerated-v1 OK");
