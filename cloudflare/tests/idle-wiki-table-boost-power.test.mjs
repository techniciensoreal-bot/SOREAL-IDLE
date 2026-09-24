import assert from "node:assert/strict";
import { IDLE_PERKS_CATALOG_V1, perkBonusesV1 } from "../src/idle-perks-v1.js";
import { IDLE_QUIRKS_CATALOG_V1, quirkBonusesV1 } from "../src/idle-quirks-v1.js";

/*
 * Wiki, page « Boost », section « Boost power » : « The total maximum boost power for each boost item », 13 valeurs (2026-09-24).
 * La puissance d'un boost = quantité effective (avec 100 % de recyclage : chaque boost recyclé perd un palier et est réappliqué,
 * donc quantité(s) = s + quantité(palier précédent)) x complétions (+2 % par boost maxé, 39 boosts = 1,78, additives)
 * x perks Boosted Boosts I-V x quirks Beasted Boosts I-IV (tous multiplicatifs, au maximum) x 1,2 (set Badly Drawn) x 1,2 (set Construction).
 * Les perks et quirks sont lus dans les VRAIS catalogues du jeu (niveau maximal), pas recopiés.
 */
const WIKI_TABLE = [
  [1, 431.78], [2, 1295.35], [5, 3454.27], [10, 7772.09], [20, 16407.77], [50, 37996.91], [100, 81175.20],
  [200, 167531.81], [500, 383423.36], [1000, 815206.41], [2000, 1678772.52], [5000, 3837687.80], [10000, 8155518.35]
];

const maxLevels = (catalog, ids) => Object.fromEntries(ids.map((id) => [id, catalog.find((x) => x.id === id).cap]));
const perkMultiplier = perkBonusesV1(maxLevels(IDLE_PERKS_CATALOG_V1, [12, 33, 107, 229, 230])).boostPowerMultiplier;
const quirkMultiplier = quirkBonusesV1(maxLevels(IDLE_QUIRKS_CATALOG_V1, [11, 53, 72, 73])).boostPowerMultiplier;

// Maxima annoncés par la page : perks 2,5 / 2,2 / 2,2 / 1,5 / 1,5 ; quirks 1,5 / 2,2 / 1,5 / 1,25.
assert.ok(Math.abs(perkMultiplier - 2.5 * 2.2 * 2.2 * 1.5 * 1.5) < 1e-9, "produit des perks Boosted Boosts au maximum : " + perkMultiplier);
assert.ok(Math.abs(quirkMultiplier - 1.5 * 2.2 * 1.5 * 1.25) < 1e-9, "produit des quirks Beasted Boosts au maximum : " + quirkMultiplier);

const completions = 1 + 39 * 0.02;
const factor = completions * perkMultiplier * quirkMultiplier * 1.2 * 1.2;

let previous = 0;
for (const [strength, expected] of WIKI_TABLE) {
  const effectiveQuantity = strength + previous;
  previous = effectiveQuantity;
  const power = effectiveQuantity * factor;
  // Le wiki arrondit à 2 décimales à partir d'un facteur légèrement arrondi : demi-centième + 1 millionième en relatif.
  assert.ok(Math.abs(power - expected) <= 0.005 + expected * 1e-6,"boost " + strength + " : calculé " + power.toFixed(3) + " contre wiki " + expected);
}

// Multiplicateurs annoncés « ~x1,94 / ~x1,77 / ~x1,88 » avec 100 % de recyclage (boosts 2/20/200/2k, 5/50/500/5k, 10/100/1k/10k).
const ratio = (s) => WIKI_TABLE.find(([x]) => x === s)[1] / factor / s;
for (const s of [200, 2000]) assert.ok(Math.abs(ratio(s) - 1.94) < 0.01, "x1,94 pour " + s);
for (const s of [500, 5000]) assert.ok(Math.abs(ratio(s) - 1.777) < 0.01, "x1,77 pour " + s);
for (const s of [1000, 10000]) assert.ok(Math.abs(ratio(s) - 1.888) < 0.01, "x1,88 pour " + s);

console.log("idle-wiki-table-boost-power: OK");
