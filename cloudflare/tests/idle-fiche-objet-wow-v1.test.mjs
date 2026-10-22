import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-22) : fiche d'objet façon World of Warcraft : nom à la couleur de la rareté, niveau jaune, emplacement / ensemble, stats aux couleurs des boosts, lignes vertes (monté à fond, récompense de l'ensemble), aucun prix de vente ni total de pièces. */
const lire = (p) => readFileSync(new URL("../public/modules/" + p, import.meta.url), "utf8");
const av = lire("ui-aventure-2-v1.js"), pop = lire("ui-popups-v1.js");
const css = readFileSync(new URL("../public/soreal-idle-itopod.css", import.meta.url), "utf8");
const pres = lire("inventory-presentation-v1.js");

// Couleurs de rareté = celles du fond des cases (idle-rarity-0..6).
const cssUi = readFileSync(new URL("../public/soreal-idle-ui.css", import.meta.url), "utf8");
const bornes = { 0: "#c9d1dd", 1: "#4ade80", 2: "#60a5fa", 3: "#c084fc", 4: "#fb923c", 5: "#f87171", 6: "#facc15" };
for (const [i, hex] of Object.entries(bornes)) {
  assert.ok(av.includes("'idle-rarity-" + i + "':'" + hex + "'"), "couleur de rareté " + i);
  assert.ok(cssUi.includes(".idle-rarity-" + i + "{"), "classe de fond de la case " + i);
}
assert.ok(pres.includes("'idle-rarity-'+i"), "la rareté vient de la même fonction que le fond des cases");

// Les deux fiches (inventaire / équipement et coffre / collection) utilisent la même en-tête et le même pied.
assert.ok(av.includes("enteteFicheObjetIdleV1_(item,'Niveau '+niveau+'/100'") && av.includes("piedFicheObjetIdleV1_(item)+\n          actionsObjetHtml"), "fiche de l'inventaire");
assert.ok(pop.includes("enteteFicheObjetIdleV1_(item,mention)") && pop.includes("piedFicheObjetIdleV1_(item)+\n          actions"), "fiche du coffre et des collections");
assert.ok(av.includes("idle-fiche-vert-v1") && av.includes("Monté à fond : +") && av.includes("monté à fond : "), "lignes vertes");

// Pas de prix de vente, pas de total de pièces (règle n°2), pas d'emoji de cadenas.
const bloc = av.slice(av.indexOf("function enteteFicheObjetIdleV1_"), av.indexOf("function afficherDetailsObjetAdventureIdleV138_"));
assert.ok(!/prix|vente|sell/i.test(bloc), "aucun prix de vente");
assert.ok(!/slots\.length|pièces\s*[:/]/.test(bloc), "aucun total de pièces");
assert.ok(!bloc.includes("🔒"));

// Mise en page : nom coloré, niveau jaune, lignes vertes, intitulés conservés.
assert.ok(css.includes(".idle-fiche-niveau-v1{") && css.includes("#ffd100") && css.includes("#1eff00"), "niveau jaune et lignes vertes");
assert.ok(cssUi.includes(".sb-power-v1{color:#ff9d2f}") && cssUi.includes(".sb-toughness-v1{color:#4da3ff}") && cssUi.includes(".sb-special-v1{color:#ffd84a}"), "intitulés orange / bleu / jaune conservés");
console.log("idle-fiche-objet-wow-v1: OK");
