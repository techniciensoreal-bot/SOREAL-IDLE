import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « Dans les input où on peut choisir la valeur qu'on désire, je veux
 * qu'on puisse écrire 1/8 pour prendre 1/8 de notre énergie. Quand on valide ou qu'on clique
 * en dehors de la zone d'input, ça se transforme en ce que correspond 1/8 de notre énergie
 * idle. »
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const augMod = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");

// 1. Fonction pure idleParseFractionEnergieV1_ : "n/d" -> floor(energieLibre*n/d), jamais moins que 1 ; sinon null.
{
  const bloc = ui.slice(ui.indexOf("function idleParseFractionEnergieV1_("), ui.indexOf("function idleResoudreFractionInputV1_("));
  const fabrique = new Function("idleNombre_", bloc + "\nreturn idleParseFractionEnergieV1_;");
  const idleParseFractionEnergieV1_ = fabrique((v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; });

  assert.equal(idleParseFractionEnergieV1_("1/8", 1000), 125);
  assert.equal(idleParseFractionEnergieV1_("1/2", 999), 499, "arrondi au sol, jamais arrondi au-dessus");
  assert.equal(idleParseFractionEnergieV1_(" 3 / 4 ", 100), 75, "espaces autour du /");
  assert.equal(idleParseFractionEnergieV1_("1/8", 1), 1, "jamais moins que 1, même si le calcul donne 0");
  assert.equal(idleParseFractionEnergieV1_("125", 1000), null, "un nombre simple n'est pas une fraction");
  assert.equal(idleParseFractionEnergieV1_("", 1000), null, "champ vide -> pas une fraction");
  assert.equal(idleParseFractionEnergieV1_("1/0", 1000), null, "division par zéro refusée");
  assert.equal(idleParseFractionEnergieV1_("abc", 1000), null, "texte quelconque -> pas une fraction");
}

// 2. Les 3 champs "Input" (Basic Training, Augmentations, Time Machine) sont bien en type="text"
//    (un input type="number" rejette le caractère "/" avant même que l'utilisateur ait fini de taper)
//    et branchés sur le résolveur de fraction via onblur.
assert.match(ui, /id="sorealIdleTrainingInputV120"[\s\S]{0,120}type="text"/, "Basic Training : input en texte, pas en nombre");
assert.match(ui, /id="sorealIdleTrainingInputV120"[\s\S]{0,220}onblur="window\.__resoudreFractionInputIdleV1__\(this\)"/, "Basic Training : branché sur le résolveur de fraction");
assert.match(augMod, /id="sorealIdleAugInputV1" type="text"/, "Augmentations : input en texte, pas en nombre");
assert.match(augMod, /id="sorealIdleAugInputV1"[\s\S]{0,260}onblur="window\.__resoudreFractionInputIdleV1__\(this\)/, "Augmentations : branché sur le résolveur de fraction");
assert.match(augMod, /id="sorealIdleTmInputV1" type="text"/, "Time Machine : input en texte, pas en nombre");
assert.match(augMod, /id="sorealIdleTmInputV1"[\s\S]{0,260}onblur="window\.__resoudreFractionInputIdleV1__\(this\)/, "Time Machine : branché sur le résolveur de fraction");

// 3. Le résolveur global est bien exposé (pont pour les autres modules).
assert.match(ui, /window\.__resoudreFractionInputIdleV1__=idleResoudreFractionInputV1_;/);

console.log("idle-input-fraction-v1: OK");
