import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-21) : « le nombre du sang pour le sort Nombre ne se met pas à jour en temps réel, il faut changer d'onglet et revenir ; pareil pour NGU : quand on place de l'énergie, le décompte ne s'affiche pas (« Place de l'énergie
 * pour avancer »), il faut changer et revenir. Tout doit toujours s'afficher en temps réel. »
 *  1. Cause du NGU : champSaisieActifIdleV1_ (ui-boucle-v1.js) bloquait TOUT redessin d'un menu vivant dès qu'un champ avait une valeur différente de sa valeur d'origine ; les champs des pages Preact (data-vdom) valent « 125 » / « 0 »
 *     pour une valeur d'origine vide : la page ne se redessinait plus jamais. Ces champs, et le champ Input partagé (gardé à chaque frappe), ne bloquent plus.
 *  2. Magie du sang : « Bonus actuel » et « En le lançant maintenant » sont des îlots écrits en place avec le sang affiché (majApercusSortsV1_).
 */
const lire = (f) => readFileSync(new URL("../public/modules/" + f, import.meta.url), "utf8").replace(/\r\n/g, "\n");

/* 1. Le garde de redessin : mêmes règles, exécutées sur un faux document. */
{
  const src = lire("ui-boucle-v1.js");
  const i = src.indexOf("function champSaisieActifIdleV1_(){");
  const corps = src.slice(i, src.indexOf("\n      }\n", i) + 8);
  const fabrique = new Function("REG", "document", "Date", corps + "\nreturn champSaisieActifIdleV1_;");
  const champ = (o) => Object.assign({ tagName: "INPUT", type: "text", value: "", defaultValue: "", id: "", checked: false, defaultChecked: false, closest(sel) { return this.vdom && sel === "[data-vdom]" ? {} : null; } }, o);
  const essai = (champs, actif) => {
    const doc = { activeElement: actif || null, querySelector: () => ({ querySelectorAll: () => champs }) };
    return fabrique({ idlePointeurEnfonceV1: 0 }, doc, Date)();
  };
  assert.equal(essai([champ({ value: "125", vdom: true }), champ({ value: "0", vdom: true })]), false, "champs d'une page Preact : jamais bloquants");
  assert.equal(essai([champ({ value: "2000", id: "sorealIdleAugInputV1" })]), false, "le champ Input partagé (gardé à chaque frappe) ne bloque pas");
  assert.equal(essai([champ({ value: "5", defaultValue: "" })]), true, "un autre champ modifié et non validé protège toujours le redessin (ITOPOD à l'ancienne…)");
  assert.equal(essai([], champ({ vdom: true })), false, "le focus dans un champ d'une page Preact ne bloque pas non plus");
  assert.equal(essai([], champ({})), true, "le focus dans un autre champ bloque toujours (frappe en cours)");
}

/* 2. Magie du sang : îlots et mise à jour en direct. */
{
  const vdom = lire("blood-magic-vdom-v1.js");
  assert.ok(/h\(Vif,\{tag:'div',attrs:\{class:'soreal-idle-blood-sort-actuel-v1','data-bm-actuel':sp\.id\}/.test(vdom), "« Bonus actuel » est un îlot Vif");
  assert.ok(/h\(Vif,\{tag:'div',attrs:\{class:'soreal-idle-blood-sort-apercu-v1','data-bm-apercu':sp\.id\}/.test(vdom) && vdom.includes("APERCU_SORTS=['numberBoost','bloodSpaghetti','counterfeitGold']"), "l'aperçu est présent d'office pour les trois sorts qui en ont un");
  const blood = lire("blood-magic-v1.js");
  assert.ok(/function majApercusSortsV1_\(\)/.test(blood) && /sortsDefinisBloodV1_\(H,e\.systemes\|\|\{\},data,sangAfficheV1_\(\)\)/.test(blood), "recalculé avec le sang AFFICHÉ (mêmes définitions que la page)");
  const boucle = blood.slice(blood.indexOf("setInterval(function(){"));
  assert.ok(boucle.indexOf("majBoutonsSortsV1_();\n    majApercusSortsV1_();") > 0, "appelé par la minuterie de 250 ms de la page (comme le total de sang et les boutons)");
  const css = readFileSync(new URL("../public/soreal-idle-ui.css", import.meta.url), "utf8");
  assert.ok(css.includes(".soreal-idle-blood-sort-apercu-v1:empty{display:none}"), "un aperçu vide est masqué");
}
console.log("idle-affichage-temps-reel-v1: OK");
