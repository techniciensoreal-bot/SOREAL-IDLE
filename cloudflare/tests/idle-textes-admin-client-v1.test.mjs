import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

/*
 * Textes éditables (Norman, 2026-10-02) côté client : balises de voix dans la narration (« (marius) », « (femme) »…), affichage sans balises,
 * application des surcharges aux fenêtres explicatives, et câblage dans le jeu.
 */
const tts = readFileSync("cloudflare/public/modules/tutorial-tts-v202.js", "utf8");
const grab = (re) => tts.match(re)[0];

// --- Narration : une balise de voix change la voix des blocs suivants, jamais lue ---
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
  grab(/var MOTIF_NOTE_BOSS=[^\n]+;/),
  grab(/function composerChronique_\(nom,histoire\)\{[\s\S]*?\n  \}\n/),
  grab(/function retirerParentheses_\(texte\)\{[\s\S]*?\n  \}\n/),
  "return {plan:planNarration_,retirer:retirerParentheses_,composer:composerChronique_,open:PAUSE_OPEN,close:PAUSE_CLOSE,resoudre:resoudreVoixBalise_};"
].join("\n");
const registre = { resoudre: (t) => ({ marius: "marius", lea: "lea" })[String(t).toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "")] || "" };
const { plan, retirer, composer, open, close, resoudre } = new Function("window", code)({ __SOREAL_IDLE_VOIX_NOMMEES_V1__: registre });
const pause = (ms) => " " + open + ms + close + " ";
const json = (v) => JSON.stringify(v);

assert.equal(resoudre("Narrateur"), "homme");
assert.equal(resoudre(" FEMME "), "femme");
assert.equal(resoudre("Marius"), "marius");
assert.equal(resoudre("note de déblocage"), "");

assert.equal(
  json(plan(retirer("(narrateur) Il entre. (marius) Salut mon ami ! (femme) Bonjour."))),
  json([{ chunk: "Il entre.", voix: "homme" }, { chunk: "Salut mon ami !", voix: "marius" }, { chunk: "Bonjour.", voix: "femme" }]),
  "une voix par bloc, balises jamais lues"
);
assert.equal(json(plan(retirer("Bonjour (une note) tout le monde."))), json([{ chunk: "Bonjour tout le monde." }]), "toute autre parenthèse reste un texte non lu, sans voix");
assert.equal(
  json(plan(retirer("(marius) Un." + pause(500) + "Deux."))),
  json([{ chunk: "Un.", voix: "marius" }, { pause: 500 }, { chunk: "Deux.", voix: "marius" }]),
  "la voix traverse les pauses"
);
assert.equal(json(plan(retirer("Avant. (femme) Après."))), json([{ chunk: "Avant." }, { chunk: "Après.", voix: "femme" }]), "avant la première balise : voix par défaut");

// Chronique : une ligne « (marius) » seule est une balise, pas une note de déblocage ; la vraie note reste ignorée.
{
  const lue = composer("Boss", "(Tu débloques X.)\n(marius)\nSalut.");
  assert.equal(json(plan(retirer(lue)).map((e) => e.chunk || e.pause)), json(["Boss", 1100, "Salut."]));
  assert.equal(plan(retirer(lue)).find((e) => e.chunk === "Salut.").voix, "marius");
  const sansNote = composer("Boss", "(marius)\nSalut.");
  assert.equal(plan(retirer(sansNote)).find((e) => e.chunk === "Salut.").voix, "marius", "la balise en tête n'est pas prise pour une note");
}

// --- Défi / Rebirth (Norman, 2026-10-02) : la chronique d'un boss déjà rencontré n'est jamais lue automatiquement ---
{
  const motif = /function bossDejaRencontre_\(id\)\{[\s\S]*?\n  \}\n/;
  const code2 = tts.match(motif)[0] + "\nreturn bossDejaRencontre_;";
  const fonction = (bossMax) => new Function("window", code2)({ __SOREAL_IDLE_ACTIVITE_V1__: () => ({ bossMax }) });
  assert.equal(fonction(60)("17"), true, "boss 17 avec un record de 60 : déjà rencontré, pas de lecture auto");
  assert.equal(fonction(60)("60"), true);
  assert.equal(fonction(60)("61"), false, "boss 61 : jamais rencontré, lu une fois");
  assert.equal(fonction(0)("1"), false, "joueur neuf : tout est nouveau");
  assert.equal(new Function("window", code2)({})("5"), false, "sans activité connue : comportement d'origine");
  assert.ok(tts.includes("if(!id||chroniqueDejaLue_(id)||bossDejaRencontre_(id))return null;"), "câblé dans le panneau de lecture automatique");
}

// --- Module d'édition : affichage sans balises, surcharges appliquées sans toucher l'original ---
function charger(recu) {
  const enregistrees = [];
  const ctx = {
    document: { addEventListener() {}, getElementById: () => null, createElement: () => ({}), head: { appendChild() {} } },
    setTimeout: () => 0,
    console
  };
  ctx.window = ctx;
  ctx.__SOREAL_IDLE_TUTORIAL_TTS_V209__ = { resoudreVoixBalise: resoudre, enregistrerVoixDynamiques: (l) => enregistrees.push(...l) };
  if (recu) {
    ctx.__SOREAL_IDLE_STANDALONE_V1__ = { session: () => "jeton" };
    ctx.__SOREAL_IDLE_CALL_V1__ = (nom) => Promise.resolve(nom === "obtenirTextesSurchargesSorealIdle" ? Object.assign({ ok: true }, recu) : { ok: false });
  }
  vm.createContext(ctx);
  vm.runInContext(readFileSync("cloudflare/public/modules/textes-admin-v1.js", "utf8"), ctx);
  return { T: ctx.__SOREAL_IDLE_TEXTES_V1__, enregistrees };
}

const { T } = charger(null);
assert.ok(T && typeof T.appliquerPage === "function");
assert.equal(T.sansBalises("(marius) Salut ! (femme) Bonjour."), "Salut ! Bonjour.");
assert.equal(T.sansBalises("Texte (avec une note) normal"), "Texte (avec une note) normal", "une parenthèse qui n'est pas une voix reste affichée");
assert.equal(T.sansBalises("A\n(marius)\nB"), "A\nB");
assert.equal(T.aDesBalises("(femme) Oui"), true);
assert.equal(T.aDesBalises("Oui (peut-être)"), false);

const page = { titre: "Objectif", paragraphes: ["Un.", "Deux."], long: true, cadrage: "stats" };
const intacte = T.appliquerPage("tuto:test:0", page);
assert.equal(intacte._cle, "tuto:test:0");
assert.equal(intacte._brut, undefined, "sans surcharge : texte d'origine, rien de brut");
assert.equal(json(intacte.paragraphes), json(["Un.", "Deux."]));
assert.equal(intacte.long, true, "les autres propriétés de la page sont conservées");

{
  const recu = { popups: { "tuto:test:0": { champs: { titre: "Nouveau (marius)", paragraphes: ["(marius) Un.", "(femme) Deux."] }, voix: ["0123456789abcd"] } }, voix: ["0123456789abcd"] };
  const { T: T2, enregistrees } = charger(recu);
  await new Promise((r) => setImmediate(r));
  await new Promise((r) => setImmediate(r));
  const p = T2.appliquerPage("tuto:test:0", page);
  assert.equal(p.titre, "Nouveau", "titre affiché sans balise");
  assert.equal(json(p.paragraphes), json(["Un.", "Deux."]), "paragraphes affichés sans balises");
  assert.equal(json(p._brut.paragraphes), json(["(marius) Un.", "(femme) Deux."]), "texte à lire : balises gardées");
  assert.equal(p.cadrage, "stats");
  assert.equal(json(enregistrees), json(["0123456789abcd"]), "les voix générées sont déclarées à la narration");
  const info = T2.appliquerInfo("nouveaute:x", { titre: "T", intro: "I", bullets: ["a"] });
  assert.equal(info.titre, "T", "pas de surcharge : inchangé");
  assert.equal(page.titre, "Objectif", "l'original n'est jamais modifié");
}

// --- Câblage dans le jeu ---
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
for (const m of ["const src=(page&&page._brut)||page;", "info=(info&&info._brut)||info;", "appliquerTextesTutorielsIdleV1_();", "window.__SOREAL_IDLE_EST_ADMIN_V1__=estAdminSorealIdle_;", "declarerTextesSystemesIdleV1_(j);", "boutonBossHtml(j&&j.bossId)", "sansBaliseVoixIdleV1_(narration)", "attrHistoireVoixIdleV1_(b.histoire)"]) {
  assert.ok(ui.includes(m), "câblage : " + m);
}
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(index.indexOf("/modules/textes-admin-v1.js") > index.indexOf("/modules/admin-histoires-v1.js") && index.indexOf("/modules/textes-admin-v1.js") < index.indexOf("/soreal-idle-ui.js"), "module chargé après l'éditeur d'histoires et avant le jeu");
const admin = readFileSync("cloudflare/public/modules/admin-histoires-v1.js", "utf8");
assert.ok(admin.includes("outilsVoix:{synthetiser:synthetiser_,synthetiserBrut:synthetiserBrut_,televerser:televerserVoix_,") && admin.includes("textes.pageHtml()"), "menu Admin : textes sous les histoires, outils de voix partagés");
console.log("idle-textes-admin-client-v1: OK");
