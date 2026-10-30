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
assert.equal(JSON.stringify(P0.analyser("{V}Je suis contente !")), JSON.stringify({ t: "Je suis contente !", v: true, c: false, r: false, d: false, m: false, p: false }));
assert.equal(JSON.stringify(P0.analyser("{VC}x")), JSON.stringify({ t: "x", v: true, c: true, r: false, d: false, m: false, p: false }));
assert.equal(JSON.stringify(P0.analyser("Bonjour")), JSON.stringify({ t: "Bonjour", v: false, c: false, r: false, d: false, m: false, p: false }));
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

/* Étiquettes de situation (2026-10-30) : {R} réveil, {D} daycare, {M} max, {P} plein. */
{
  const a = P0.analyser("{R}Quoi ?");
  assert.ok(a.r && !a.d && !a.m && !a.p && a.t === "Quoi ?");
  const b = P0.analyser("{DM}x");
  assert.ok(b.d && b.m && !b.r && !b.p);
  const c = P0.analyser("{RV}x");
  assert.ok(c.r && c.v);
  assert.equal(P0.assembler({ t: "x", v: true, c: false, r: true, d: false, m: false, p: true }), "{VRP}x");
  assert.equal(P0.assembler(P0.analyser("{PMDRCV}hop")), "{VCRDMP}hop", "ordre canonique, aller-retour");
  const L = { "phrases:coffre": { liste: ["Tous les jours", "{R}Réveil !", "{D}Daycare !", "{M}Maxé !", "{P}Plein !", "{V}Vomi"] } };
  const Pc = monde({ surcharges: L });
  assert.equal([...tout(Pc, "coffre", "reveil", 60)].join("|"), "Réveil !");
  assert.equal([...tout(Pc, "coffre", "daycare", 60)].join("|"), "Daycare !");
  assert.equal([...tout(Pc, "coffre", "daycare:max", 60)].join("|"), "Maxé !");
  assert.equal([...tout(Pc, "coffre", "plein", 60)].join("|"), "Plein !");
  /* jamais en phrase de tous les jours ni d'accident */
  assert.equal([...tout(Pc, "coffre", "remarque", 100)].join("|"), "Tous les jours");
  assert.ok(![...tout(monde({ surcharges: L, vomi: true }), "coffre", "accident:V", 100)].some((t) => /Réveil|Daycare|Maxé|Plein/.test(t)));
  /* repli {M} -> {D} ; rien du tout sans phrase du genre */
  const Pd = monde({ surcharges: { "phrases:coffre": { liste: ["{D}Daycare !", "Salut"] } } });
  assert.equal([...tout(Pd, "coffre", "daycare:max", 40)].join("|"), "Daycare !", "pas de {M} : repli sur {D}");
  assert.equal(Pd.tirer("coffre", "plein"), "");
  assert.equal(monde({ surcharges: { "phrases:coffre": { liste: ["Salut"] } } }).tirer("coffre", "reveil"), "", "ancienne liste sans étiquette : rien en réveil (le module garde ses répliques d'origine)");
  /* défauts : de quoi parler dans chaque situation, dont le refus demandé */
  const Pz = monde();
  assert.ok(tout(Pz, "coffre", "reveil").size >= 5 && tout(Pz, "valise", "reveil").size >= 5);
  assert.ok(tout(Pz, "coffre", "daycare").size >= 3 && tout(Pz, "coffre", "daycare:max").size >= 3);
  assert.ok(tout(Pz, "coffre", "plein").has("Fais de la place, c’est full là dedans !"));
  assert.ok(!tout(Pz, "coffre", "remarque", 600).has("Fais de la place, c’est full là dedans !"));
  assert.equal(Pz.defauts.valise.some((p) => /^{[DMP]/.test(p)), false, "la valise n'a pas de phrases de garderie");
  /* éditeur : les trois cases demandées + « Plein », combinables avec les cases existantes */
  const html = Pz.editeurHtml();
  for (const k of ["data-php-r", "data-php-d", "data-php-m", "data-php-p", "data-php-v", "data-php-c"]) assert.ok(html.includes(k), "case " + k);
  for (const l of ["Réveil", "Daycare", "Max", "Plein"]) assert.ok(html.includes("> " + l + "</label>"), "libellé " + l);
  const bv = html.slice(html.indexOf('data-qui="valise"'), html.indexOf('data-qui="coffre"'));
  assert.ok(bv.includes("data-php-r") && !bv.includes("data-php-d") && !bv.includes("data-php-p"), "la valise : seulement Réveil en plus");
}
/* câblage du réveil */
assert.ok(so.includes("tirer('coffre','reveil')") && so.includes("parler:function(texte)"));
assert.ok(lire("public/modules/valise-v1.js").includes("tirer('valise','reveil')"));
console.log("idle-phrases-coffre-valise-v1: OK");
