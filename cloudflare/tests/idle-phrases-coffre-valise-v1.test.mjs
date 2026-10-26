import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(new URL("../" + f, import.meta.url), "utf8");
const src = lire("public/modules/phrases-coffre-valise-v1.js");

function monde({ surcharges = {}, vomi = false, caca = false } = {}) {
  const w = {
    __SOREAL_IDLE_TEXTES_V1__: { surcharge: (cle) => surcharges[cle] || null },
    __SOREAL_IDLE_VALISE_ACCIDENT_V1__: { niveau: () => (vomi ? 5 : 0) },
    __SOREAL_IDLE_CACA_V1__: { flaqueNiveau: () => (caca ? 3 : 0) },
  };
  const d = { addEventListener() {}, querySelector() { return null; }, createElement() { return {}; } };
  vm.runInNewContext(src, { window: w, document: d, Math });
  return w.__SOREAL_IDLE_PHRASES_V1__;
}
const tout = (P, qui, mode, n = 400) => new Set(Array.from({ length: n }, () => P.tirer(qui, mode)));

// étiquettes
const P0 = monde();
assert.equal(JSON.stringify(P0.analyser("{V}Je suis contente !")), JSON.stringify({ t: "Je suis contente !", v: true, c: false }));
assert.equal(JSON.stringify(P0.analyser("{VC}x")), JSON.stringify({ t: "x", v: true, c: true }));
assert.equal(JSON.stringify(P0.analyser("Bonjour")), JSON.stringify({ t: "Bonjour", v: false, c: false }));
assert.equal(P0.assembler({ t: "x", v: true, c: true }), "{VC}x");

// sans accident : seules les phrases de tous les jours
const sans = tout(P0, "valise", "remarque");
assert.ok(sans.has("Vous comptez me regarder longtemps, damoiseau ?") && ![...sans].some((t) => /contente|émotions|Bleurgh/.test(t)), "aucune phrase d'accident sans accident");

// accident de la valise : « Je suis contente ! » et « beaucoup trop d'émotions » sortent à l'apparition (mode accident:V)
const Pv = monde({ vomi: true });
const ouv = tout(Pv, "valise", "accident:V");
assert.ok(ouv.has("Je suis contente !") && ouv.has("C’est beaucoup trop d’émotions pour moi."), "les deux phrases font partie des ouvertures du vomi");
assert.ok(![...ouv].includes("Vous comptez me regarder longtemps, damoiseau ?"), "une phrase de tous les jours n'est pas une ouverture d'accident");

// étiquette « les deux » : seulement quand les DEUX accidents sont survenus
const surcharges = { "phrases:coffre": { liste: ["{VC}Quelle journée…", "Salut"] } };
assert.ok(!tout(monde({ surcharges, vomi: true }), "coffre", "remarque").has("Quelle journée…"), "vomi seul : pas la phrase des deux");
assert.ok(!tout(monde({ surcharges, caca: true }), "coffre", "remarque").has("Quelle journée…"), "caca seul : pas la phrase des deux");
assert.ok(tout(monde({ surcharges, vomi: true, caca: true }), "coffre", "remarque").has("Quelle journée…"), "les deux accidents : la phrase sort");
// une liste enregistrée remplace les phrases d'origine
assert.equal([...tout(monde({ surcharges: { "phrases:valise": { liste: ["Seule phrase"] } } }), "valise", "remarque", 20)].join("|"), "Seule phrase");

// câblage : chaque module tire dans la liste de l'administrateur ; plus de « Je suis contente » au lavage
assert.ok(lire("public/modules/valise-accident-v1.js").includes("tirer('valise','accident:V')"));
assert.ok(lire("public/modules/valise-v1.js").includes("tirer('valise','remarque')"));
assert.ok(lire("public/modules/coffre-digestion-v1.js").includes("tirer('coffre','accident:C')"));
const so = lire("public/modules/coffre-sommeil-v1.js");
assert.ok(so.includes("tirer('coffre','remarque')") && so.includes("tirer('coffre','accident:V')"));
assert.ok(lire("public/modules/textes-admin-v1.js").includes("editeurHtml()") && lire("public/modules/textes-admin-v1.js").includes("majSimple"));
assert.ok(lire("public/index.html").includes("/modules/phrases-coffre-valise-v1.js?v="));
console.log("idle-phrases-coffre-valise-v1: OK");
