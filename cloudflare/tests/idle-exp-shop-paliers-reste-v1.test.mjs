import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-05) : « Recyclage de boosts propose d'acheter par 10 alors que le maximum est 5 » : jamais de palier d'achat au-delà de ce qu'il reste à acheter. */
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const i = meta.indexOf("let tiers=it.max!=null&&it.max>1?[1,5,10]");
assert.ok(i > 0);
const bloc = meta.slice(i, meta.indexOf("/* Prix variable", i));
const calc = (max, purchased) => {
  const it = { max, purchased };
  const H = { idleEntier_: (v) => Math.floor(Number(v) || 0) };
  return new Function("it", "H", bloc.replace(/\/\*[\s\S]*?\*\//g, "").replace("let tiers", "var tiers") + "; return tiers;")(it, H);
};
assert.deepEqual(calc(5, 0), [1, 5], "max 5, rien d'acheté : 1 et 5, jamais 10");
assert.deepEqual(calc(5, 2), [1, 3], "il reste 3 : 1 et 3");
assert.deepEqual(calc(5, 4), [1], "il reste 1");
assert.deepEqual(calc(25, 0), [1, 5, 10], "grand maximum : paliers habituels");
assert.deepEqual(calc(8, 0), [1, 5, 8], "il reste 8 : 1, 5 et le reste");
console.log("idle-exp-shop-paliers-reste-v1: OK");

// Explications de la boutique EXP (Norman, 2026-10-05) : les Barres multiplient la génération ; la Puissance n'est PAS la quantité produite à chaque génération (wiki NGU Idle, page « Energy »).
{
  const meta2 = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
  assert.ok(meta2.includes("autant de points que de Barres") && meta2.includes("vitesse × Barres"), "Barres : un remplissage donne autant de points que de Barres");
  assert.ok(!meta2.includes("Augmente la quantité de ressource produite à chaque génération"), "ancienne explication fausse de la Puissance retirée");
  assert.ok(meta2.includes("N’a pas d’effet sur le menu Entraînement de base"), "Puissance : sans effet sur Entraînement de base");
}
