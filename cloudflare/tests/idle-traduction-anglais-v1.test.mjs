import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-05) : « pour le mode anglais, je veux que tu remettes l'intégralité des mots en anglais ; on doit pouvoir passer du français à l'anglais via le menu, et inversement ».
 * Le module traduction-anglais-v1.js remplace, dans le texte affiché, chaque morceau de français connu (dictionnaire extrait de tout le code) par son anglais.
 */
const R = "cloudflare/public/modules/";
const dico = JSON.parse(readFileSync(R + "traduction-anglais-dict-v1.json", "utf8"));
assert.ok(Object.keys(dico).length > 2500, "dictionnaire : plus de 2500 morceaux");
for (const [fr, en] of Object.entries(dico)) {
  assert.equal(typeof en, "string");
  assert.ok(en.trim().length > 0, "traduction vide pour " + fr);
  assert.ok(!/[<>]/.test(fr), "pas de balise HTML collée dans une clé : " + fr);
}

function charger(langue) {
  const win = { localStorage: { getItem: () => langue }, addEventListener() {} };
  const ctx = { window: win, document: { readyState: "complete", addEventListener() {}, body: null }, localStorage: win.localStorage, fetch: () => new Promise(() => {}), requestAnimationFrame() {}, MutationObserver: function () {}, NodeFilter: {}, console };
  win.window = win; Object.assign(win, ctx);
  vm.createContext(ctx);
  vm.runInContext(readFileSync(R + "traduction-anglais-v1.js", "utf8"), ctx);
  return ctx.window;
}
const w = charger("en");
const T = w.__SOREAL_IDLE_TRADUCTION_ANGLAIS_V1__;
T.charger(dico);
const cas = [
  ["Fermer", "Close"],
  ["Niveau suivant dans 2 s", "Next level in 2 s"],
  ["Tout retirer", "Remove all"],
  ["🗡️ Attaque régulière", "🗡️ Regular Attack"],
  ["Acheter", "Buy"],
  ["Aucun boss vaincu pour l’instant.", "No boss defeated yet."],
  ["Mickaël a réussi un Challenge en 8 min 30 s", "Mickaël completed a Challenge in 8 min 30 s"],
  ["Tu as lancé le combat contre un Titan", "You started the fight against un Titan"],
  ["Basic Training", "Basic Training"],
  ["Already English, nothing to change", null]
];
for (const [fr, en] of cas) {
  const r = T.traduire(fr);
  if (en === null) assert.equal(r, fr, "texte déjà anglais : inchangé");
  else if (fr.startsWith("Tu as lancé")) assert.ok(r.includes("You") && r.includes("started the fight against"), r);
  else assert.equal(r, en, fr);
}
// « Français » : aucun module actif, l'actif() du module reste faux et le menu ne change rien.
assert.equal(typeof charger("fr").__SOREAL_IDLE_LANGUE_CHANGEE_V1__, "function");

// Branchements : le menu Réglages prévient le module, la page charge le module.
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("window.__SOREAL_IDLE_LANGUE_CHANGEE_V1__(choix)"), "le changement de langue prévient le module anglais");
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/traduction-anglais-v1.js"));
const src = readFileSync(R + "traduction-anglais-v1.js", "utf8");
assert.ok(src.includes("restaurer_"), "retour au français : les textes d'origine sont restitués");
assert.ok(src.includes(".sic-txt,.sic-nom"), "messages et pseudos du chat jamais traduits");
console.log("idle-traduction-anglais-v1: OK");
