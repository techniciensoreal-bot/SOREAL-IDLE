import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Coupe de génération SANS pause (Norman, 2026-11-03) : « (/) » dans un texte de voix = le studio coupe la génération en deux morceaux (le modèle reçoit des textes plus courts) mais raccorde
 * sans silence. Le marqueur n'est jamais lu, jamais affiché, et ne change pas l'empreinte du bloc (donc le nom du fichier de voix). Le studio est en Python (pas de modèle ici) : on teste le vrai module
 * de narration du jeu dans Node et le contenu du source du studio.
 */
const ttsSource = readFileSync("cloudflare/public/modules/tutorial-tts-v202.js", "utf8");
function contexte() {
  const bidon = () => new Proxy(function () {}, { get: (_t, k) => (k === Symbol.toPrimitive ? () => "" : k === "length" ? 0 : bidon()), apply: () => bidon(), construct: () => bidon(), set: () => true });
  const doc = { readyState: "loading", addEventListener() {}, removeEventListener() {}, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, createElement: bidon, body: bidon(), head: bidon(), documentElement: bidon() };
  const win = { addEventListener() {}, removeEventListener() {}, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, location: { href: "http://localhost/", search: "" }, navigator: { userAgent: "node" } };
  win.window = win; win.document = doc; win.self = win;
  const ctx = vm.createContext(Object.assign(win, { document: doc, localStorage: win.localStorage, console, setTimeout: win.setTimeout, clearTimeout() {}, setInterval: win.setInterval, clearInterval() {}, navigator: win.navigator, location: win.location }));
  vm.runInContext(readFileSync("cloudflare/public/modules/voix-expressions-v1.js", "utf8"), ctx, { filename: "voix-expressions-v1.js" });
  vm.runInContext(ttsSource, ctx, { filename: "tutorial-tts-v202.js" });
  return ctx.window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
}
const T = contexte();
assert.ok(T && typeof T.planNarration === "function", "module de narration chargé");
const blocs = (texte) => T.planNarration(T.retirerParentheses(texte)).filter((e) => e.chunk != null);

// --- 1. Même empreinte avec ou sans le marqueur ---
const sans = "Il était une fois un guerrier très fatigué qui marchait depuis des jours dans la plaine sans jamais s'arrêter pour se reposer.";
const avec = "Il était une fois un guerrier très fatigué (/) qui marchait depuis des jours dans la plaine (/) sans jamais s'arrêter pour se reposer.";
const a = blocs(sans), b = blocs(avec);
/* Norman (2026-11-04) : « ça ne crée que 1 fichier malgré les / » : chaque marqueur sépare deux BLOCS, donc deux fichiers de voix, chacun avec l'empreinte de SON texte. */
assert.equal(a.length, 1);
assert.equal(b.length, 3, "deux marqueurs = trois blocs = trois fichiers");
assert.deepEqual(Array.from(b, (e) => e.chunk), ["Il était une fois un guerrier très fatigué", "qui marchait depuis des jours dans la plaine", "sans jamais s'arrêter pour se reposer."], "le texte lu ne contient jamais le marqueur");
assert.equal(new Set(Array.from(b, (e) => T.hashBloc(e.chunk))).size, 3, "trois empreintes différentes");
assert.equal(T.hashBloc(avec), T.hashBloc(sans), "hashBloc retire lui-même le marqueur (texte entier)");
assert.equal(a[0].colleAvant, undefined);
assert.equal(a[0].colleApres, undefined, "sans marqueur : aucun raccord");
assert.deepEqual(Array.from(b, (e) => [!!e.colleAvant, !!e.colleApres]), [[false, false], [false, false], [false, false]], "Norman (2026-11-04) : aucun raccord collé : chaque bloc garde son silence normal, comme entre deux phrases (même arrêt qu'un point)");
assert.ok(b.every((e) => e.studio === undefined), "plus de texte studio avec marqueurs : chaque bloc part seul");
assert.ok(!/\(\/\)/.test(b.map((e) => e.chunk).join(" ")));

// --- 2. Marqueur devant une ponctuation, aux bords, doublé, avec espaces internes ---
const p = blocs("Il court (/), puis il saute.");
assert.equal(p[0].chunk, "Il court, puis il saute.", "pas d'espace avant la virgule");
assert.equal(T.hashBloc(p[0].chunk), T.hashBloc("Il court, puis il saute."));
assert.equal(p.length, 1, "coupe devant une ponctuation : pas une coupe");
const bord = blocs("(/) Bonjour tout le monde, voici une très longue phrase (/)");
assert.equal(bord[0].chunk, "Bonjour tout le monde, voici une très longue phrase");
assert.equal(bord.length, 1, "marqueur aux bords : sans effet");
assert.ok(!bord[0].colleAvant && !bord[0].colleApres);
const large = blocs("Un texte assez long pour être coupé ( / ) et son suite qui continue ici.");
assert.deepEqual(Array.from(large, (e) => e.chunk), ["Un texte assez long pour être coupé", "et son suite qui continue ici."]);
assert.equal(blocs("(/)").length, 0, "un texte qui n'est qu'un marqueur ne donne aucun bloc");
assert.equal(T.resoudreCoupeBalise("/"), true);
assert.equal(T.resoudreCoupeBalise(" / "), true);
assert.equal(T.resoudreCoupeBalise("pause"), false);
assert.equal(T.marqueCoupe, "(/)");

// --- 3. Les autres balises ne changent pas (voix, pause) ---
assert.equal(T.planNarration(T.retirerParentheses("Salut tout le monde (pause 1s) et bonjour à tous.")).filter((e) => e.pause != null).length, 1, "une pause reste une pause");
const avecPause = T.planNarration(T.retirerParentheses("Un texte (pause 2s) un autre texte (/) suite du texte."));
assert.equal(avecPause.filter((e) => e.pause != null).length, 1);

// --- 4. Affichage : le marqueur n'apparaît nulle part (textes-admin sansBalises, moteur d'histoires) ---
const admin = readFileSync("cloudflare/public/modules/textes-admin-v1.js", "utf8");
assert.match(admin, /function estBaliseCoupe_/);
assert.match(admin, /estBaliseCoupe_\(contenu\)\|\|voixDeBalise_/, "sansBalises_ traite (/) comme une balise de lecture");
const sansBalisesSrc = admin.slice(admin.indexOf("function estBaliseCoupe_"), admin.indexOf("function aDesBalises_"));
// On reconstitue sansBalises_ seule : aucune voix ni expression reconnue ici, seule la coupe (/) est une balise de lecture.
const lignes = sansBalisesSrc.split("\n").map((l) => (l.startsWith("function estBaliseDeLecture_") ? "function estBaliseDeLecture_(c){return estBaliseCoupe_(c);}" : l));
const sansBalises = new Function(lignes.join("\n") + ";return sansBalises_;");
const S = sansBalises();
assert.equal(S("Il court (/) vite et loin."), "Il court vite et loin.");
assert.equal(S("Il court (/), puis saute."), "Il court, puis saute.");
assert.equal(S("Ligne un\n(/)\nLigne deux"), "Ligne un\nLigne deux");
assert.equal(S("Une note (importante) reste."), "Une note (importante) reste.", "toute autre parenthèse reste");
assert.ok(!/\(\/\)/.test(S("a (/) b (/) c (/)")));

const histoires = readFileSync("cloudflare/public/modules/story-engine-v1.js", "utf8");
assert.match(histoires, /\\\(\\s\*\\\/\\s\*\\\)/, "le moteur d'histoires retire (/) du texte affiché");

// --- 5. Éditeur : l'aide est visible et insère le marqueur ---
const ui = readFileSync("cloudflare/public/modules/voix-ui-v1.js", "utf8");
assert.match(ui, /data-vu-pause="\(\/\)"/, "bouton qui insère (/)");
assert.match(ui, /\(\/\) = coupe la génération ici : un fichier de voix de plus, avec le même arrêt qu’un point/, "aide sous le champ");

// --- 6. Le studio Python : marqueur dans decouper, raccord sans silence ---
const py = readFileSync("cloudflare/tools/voice-studio/serveur.py", "utf8");
assert.match(py, /MARQUE_COUPE = "\(\/\)"/);
assert.match(py, /def decouper_marque\(texte\)/);
assert.match(py, /def decouper\(texte\):\n[^\n]*\n    return \[s for s, _ in decouper_marque\(texte\)\]/, "decouper coupe au marqueur");
assert.match(py, /def decouper_simple\(texte\)/, "texte sans marqueur : ancien découpage inchangé");
assert.match(py, /if not MARQUE_COUPE_RE\.search\(t\):\n        return \[\(s, False\) for s in decouper_simple\(t\)\]/, "sans marqueur : aucun raccord spécial");
assert.match(py, /def raccorder_sans_pause\(a, b, sr\)/);
assert.match(py, /FONDU_ENCHAINE_S = 0\.03/);
assert.match(py, /def couper_bords\(wav, sr, question=False, colle_avant=False, colle_apres=False\)/);
assert.match(py, /if colles\[i\]:\n            sortie = raccorder_sans_pause/, "raccord nul quand le segment suit un marqueur");
assert.match(py, /sortie = torch\.cat\(\[sortie, silence, wavs\[i\]\], dim=1\)/, "les raccords normaux gardent le silence RACCORD_S");
assert.match(py, /RACCORD_S = 0\.22/);
assert.match(py, /colle_apres = rang \+ 1 < len\(plan\) and plan\[rang \+ 1\]\[1\]/);
assert.match(py, /couper_bords\(wav, m\.sr, est_question\(segment\), colle, colle_apres\)/);
// Le marqueur n'est jamais envoyé au modèle : les segments viennent de decouper_marque, qui le retire.
assert.match(py, /parties = \[p\.strip\(\) for p in MARQUE_COUPE_RE\.split\(t\) if p\.strip\(\)\]/);
// Pas de point final artificiel ajouté au segment qui précède un marqueur (intonation de continuation).
const synth = py.slice(py.indexOf("def synthetiser_long"), py.indexOf("TEMPO_ANGLAIS"));
assert.ok(!/colle_apres[^\n]*\+ "\."/.test(synth), "aucun point final ajouté avant un marqueur");
// Générateur par lots (voix anglaises) : même règle.
const lot = readFileSync("cloudflare/tools/voix-en-jeu-v1.py", "utf8");
assert.match(lot, /def segmenter_marque\(texte\)/);
assert.match(lot, /serveur\.assembler_segments\(morceaux, colles, m\.sr, silence\)/);
assert.match(lot, /bloc\.get\("studio"\) or bloc\["texte"\]/);
const blocsMjs = readFileSync("cloudflare/tools/voix-en-blocs-v1.mjs", "utf8");
assert.match(blocsMjs, /studio: etape\.studio \|\| ""/);
// Admin : le texte envoyé au studio est celui avec marqueurs, l'empreinte reste celle du texte lu.
for (const f of ["admin-histoires-v1.js", "textes-admin-v1.js"]) {
  const src = readFileSync("cloudflare/public/modules/" + f, "utf8");
  assert.match(src, /texte:e\.chunk,hash:/, f + " : chaque bloc part seul au studio");
  assert.ok(src.includes("colleAvant") && src.includes("colleApres"), f + " : transmet les raccords au studio");
  assert.match(src, /hashBloc\(e\.chunk\)|hashBloc\(e\.chunk\)/, f + " : empreinte du texte lu");
}

console.log("idle-voix-coupe-sans-pause-v1 : ok");

// --- 7. Un fichier par morceau : le studio rogne le bord collé (Norman, 2026-11-04) ---
assert.match(py, /def finir_bloc\(wav, sr, colle_avant=False, colle_apres=False\)/);
assert.match(py, /couper_bords\(wav, sr, False, colle_avant, colle_apres\)/, "bord collé rogné");
assert.match(py, /return wav if colle_apres else avec_silence_final\(wav, sr\)/, "pas de silence final avant un raccord sans pause");
assert.match(py, /donnees\.get\("colleAvant"\) is True, donnees\.get\("colleApres"\) is True/, "la requête transmet les raccords");
console.log("idle-voix-coupe-sans-pause-v1 (un fichier par morceau) : ok");
