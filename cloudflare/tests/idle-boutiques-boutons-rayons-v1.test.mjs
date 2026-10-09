import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : couleur des boutons différente par rayon (boutiques EXP et AP) ; plus de prix dans les boutons, boutons plus petits qui disent seulement « Acheter » ;
 * prix, gain et explications dans le cadre sombre de la carte.
 */
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");

// Aucun bouton d'achat ne contient plus de prix : ni <small> ni « EXP » / « AP » dans le libellé.
for (const [nom, src] of [["meta", meta], ["ui", ui]]) {
  const boutons = src.match(/<button type="button" class="soreal-idle-exp-buy-v210[^>]*>[\s\S]{0,260}?<\/button>/g) || [];
  assert.ok(boutons.length > 0, nom + " : boutons trouvés");
  for (const b of boutons) {
    assert.ok(!/<small>|<b>\+|dès |total |\bEXP\b|\bAP\b/.test(b.replace(/onclick="[^"]*"/g, "")), nom + " : prix dans un bouton -> " + b.slice(0, 160));
  }
}
// Le prix est écrit dans la carte.
assert.ok(meta.includes("function idleExpPrixCarteIdleV1_(") && meta.includes("function idleExpLibelleAchatIdleV1_(q){return q>1?'Acheter ×'+q:'Acheter';}"));
assert.equal(meta.split("idleExpPrixCarteIdleV1_(").length - 1, 3, "définition + Rich Jerks, Yggdrasil (les lots et les articles de la boutique EXP utilisent les tuiles d’achat)");
assert.ok(ui.includes("soreal-idle-exp-prix-ligne-v1\"><i>Prix</i><b>'+formatGrandNombreIdleV70_(item.nextCost)+' AP"), "boutique AP : prix dans la carte");
// Boutons plus petits.
assert.ok(meta.includes(".soreal-idle-exp-buy-v210{min-height:0!important;padding:6px 14px!important"));
// Un rayon = une couleur : le cadre porte data-rayon, chaque rayon a ses variables, et les deux thèmes les utilisent.
assert.ok(meta.includes('data-rayon="\'+onglet+\'"') && ui.includes('data-rayon="\'+onglet+\'"'));
const rayonsExp = ["debuts", "toc", "energy", "magic", "r3", "aventure", "slots"];
const rayonsAp = ["boosts1", "boosts2", "special1", "special2", "special3", "special4", "items", "expPp"];
const couleur = (r) => { const cle = `[data-rayon="${r}"]{--rayon-h:`; const k = css.indexOf(cle); assert.ok(k > 0, "couleur du rayon " + r); const bout = css.slice(k + cle.length, k + cle.length + 40); return bout.slice(0, 7) + bout.slice(bout.indexOf("--rayon-b:") + 10, bout.indexOf("--rayon-b:") + 17); };
const exp = rayonsExp.map(couleur);
assert.equal(new Set(exp).size, exp.length, "chaque rayon EXP a sa propre couleur");
const ap = rayonsAp.slice(0, 7).map(couleur); // « EXP / PP » reprend volontairement le turquoise du rayon des slots
assert.equal(new Set(ap).size, ap.length, "chaque rayon AP a sa propre couleur");
couleur("expPp");
assert.ok(css.includes("var(--rayon-h,#19e3d0)") && css.includes("var(--rayon-h,#ffe08a)"), "les deux thèmes lisent la couleur du rayon");
// Tous les rayons de l'interface sont couverts.
for (const id of rayonsExp) assert.ok(meta.includes("id:'" + id + "'"), "rayon EXP " + id);
for (const id of rayonsAp) assert.ok(ui.includes(id + ":'"), "rayon AP " + id);
console.log("idle-boutiques-boutons-rayons-v1: OK");
