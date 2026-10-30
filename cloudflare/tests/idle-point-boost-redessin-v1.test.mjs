// Norman (2026-10-30) : « il arrive qu'un objet ait le maximum de boosts possible et que son point ne disparaisse pas (niveau 100, totalement boosté) ; je dois changer d'onglet et revenir ».
// La case du sac n'est redessinée que si la signature de l'objet change : elle doit donc tenir compte du V (fullyMaxed), des points (boostManque) et des Specials secondaires.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const src = fs.readFileSync("cloudflare/public/modules/ui-inventaire-v1.js", "utf8").replace(/\r\n/g, "\n");
const debut = src.indexOf("function signatureObjetInventaireIdleV160_(item){");
const fin = src.indexOf("function construirePlanSacIdleV160_", debut);
assert.ok(debut > 0 && fin > debut, "fonction de signature trouvée");
const signature = vm.runInNewContext("(" + src.slice(debut, fin).replace("function signatureObjetInventaireIdleV160_", "function") + ")", { encodeURIComponent, JSON });
const base = { id: "a1", definitionId: "x", kind: "set", level: 100, power: 10, toughness: 10, special: 5, name: "Casque" };
const avant = Object.assign({}, base, { boostManque: { power: false, toughness: false, special: true }, specialsAll: [{ value: 5, max: 5 }, { value: 1, max: 4 }] });
const apres = Object.assign({}, base, { boostManque: { power: false, toughness: false, special: false }, specialsAll: [{ value: 5, max: 5 }, { value: 4, max: 4 }] });
assert.notEqual(signature(avant), signature(apres), "le dernier boost d'un Special secondaire change la signature (la case est redessinée, le point disparaît)");
assert.notEqual(signature(Object.assign({}, apres, { fullyMaxed: false })), signature(Object.assign({}, apres, { fullyMaxed: true })), "le V vert (fullyMaxed) change la signature");
assert.notEqual(signature(Object.assign({}, apres, { boostManque: { power: true, toughness: false, special: false } })), signature(apres), "un point de Power allumé ou éteint change la signature");
assert.equal(signature(apres), signature(JSON.parse(JSON.stringify(apres))), "un objet identique garde la même signature (pas de redessin inutile)");
console.log("idle-point-boost-redessin-v1 : OK");
