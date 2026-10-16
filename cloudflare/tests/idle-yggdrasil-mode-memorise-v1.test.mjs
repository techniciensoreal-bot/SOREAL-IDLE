import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-16) : « le jeu doit mémoriser si un fruit était sur Récolter ou Manger. » Le choix de chaque fruit d'Yggdrasil est gardé sur l'appareil, par partie : relu à l'ouverture de la page, écrit à
 * chaque changement ; seul « Récolter » est gardé (Manger est le défaut) ; le Poop (qui se décoche après usage) n'est pas gardé.
 */
const src = fs.readFileSync(new URL("../public/modules/yggdrasil-elfes-v1.js", import.meta.url), "utf8");
const coupe = (re) => src.match(re)[0];
const code = [
  "var etat={choix:{}};",
  coupe(/function choix_\(id\)\{[^\n]*\n/),
  coupe(/var CLE_MODES_=[^\n]*\n/),
  coupe(/function chargerModes_\(nom\)\{[\s\S]*?\n  \}\n/),
  coupe(/function sauverModes_\(\)\{[\s\S]*?\n  \}\n/),
  "this.api={etat:etat,choix_:choix_,chargerModes_:chargerModes_,sauverModes_:sauverModes_};"
].join("\n");
function appareil(stock) {
  const ctx = { localStorage: { getItem: (k) => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); } }, JSON, Object };
  vm.runInNewContext("(function(){" + code + "}).call(this)", ctx);
  return ctx.api;
}
const stock = {};
let a = appareil(stock);
a.chargerModes_("Norman");
assert.equal(a.choix_("gold").mode, "eat", "défaut : Manger");
a.choix_("gold").mode = "harvest"; a.choix_("luck").mode = "harvest"; a.sauverModes_();
a.choix_("luck").mode = "eat"; a.sauverModes_();
assert.deepEqual(JSON.parse(stock["soreal_idle_ygg_modes_v1:Norman"]), { gold: "harvest" }, "seul Récolter est gardé");
a.choix_("gold").poop = true; a.sauverModes_();
assert.ok(!stock["soreal_idle_ygg_modes_v1:Norman"].includes("poop"), "le Poop n'est pas gardé");
// Nouvelle ouverture du jeu (page rechargée) : les choix reviennent.
a = appareil(stock);
a.chargerModes_("Norman");
assert.equal(a.choix_("gold").mode, "harvest", "Récolter retrouvé après rechargement");
assert.equal(a.choix_("luck").mode, "eat");
assert.equal(a.choix_("gold").poop, false);
// Une autre partie a ses propres choix.
a = appareil(stock);
a.chargerModes_("Norman (B)");
assert.equal(a.choix_("gold").mode, "eat", "partie B : ses propres choix");
// Stock illisible : on retombe sur le défaut sans erreur.
const abime = { "soreal_idle_ygg_modes_v1:X": "{pas du json" };
a = appareil(abime); a.chargerModes_("X");
assert.equal(a.choix_("gold").mode, "eat");
// Branchement dans la page : lecture à l'ouverture, écriture au changement de mode.
assert.ok(/function page\(j\)\{[\s\S]{0,120}chargerModes_\(j&&j\.nom\)/.test(src), "page() relit les choix de la partie");
assert.ok(src.includes("choix_(id).mode=m;sauverModes_();"), "le changement de mode est écrit");
console.log("idle-yggdrasil-mode-memorise-v1: OK");
