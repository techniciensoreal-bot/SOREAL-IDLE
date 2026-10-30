// Norman (2026-10-30) : « sur les cartes Magic, les zones ne correspondent pas : il met 20 boss pour la zone 1 ; il faut compter via le mode Aventure (zone Tutoriel, etc.) et incrémenter de 1 à chaque zone d'Aventure ».
import fs from "node:fs";
import assert from "node:assert/strict";
import { mondeDuBossV1 } from "../src/idle-boss-monde-v1.js";
import { IDLE_ADVENTURE_ZONES } from "../src/idle-adventure-zones.js";

const m = (n) => { const r = mondeDuBossV1(n); return r.monde + "/" + r.ordre; };
// Zone Tutoriel (monde 1) jusqu'au boss qui ouvre les Égouts (7 boss vaincus : le boss 8 se combat avec les Égouts ouverts).
assert.equal(m(1), "1/1");
assert.equal(m(7), "1/7", "le boss 7 est encore dans le monde 1 (plus 20 boss par monde)");
assert.equal(m(8), "2/1", "Égouts : monde 2 dès le boss 8 (7 boss vaincus)");
assert.equal(m(17), "2/10");
assert.equal(m(18), "3/1", "Forêt : monde 3 (17 boss vaincus)");
assert.equal(m(38), "4/1", "Grotte : monde 4");
// Chaque nouveau seuil d'ouverture d'une zone fait passer au monde suivant, sans jamais sauter de numéro.
const seuils = Array.from(new Set(IDLE_ADVENTURE_ZONES.filter((z) => z.id !== "safe").map((z) => z.boss))).sort((a, b) => a - b);
let precedent = 0;
for (let n = 1; n <= 301; n++) {
  const { monde, ordre } = mondeDuBossV1(n);
  assert.ok(monde === precedent || monde === precedent + 1 || precedent === 0, "aucun monde sauté au boss " + n);
  assert.ok(ordre >= 1, "ordre positif au boss " + n);
  precedent = monde;
}
assert.equal(mondeDuBossV1(seuils[seuils.length - 1] + 1).ordre, 1, "le dernier monde commence juste après le dernier seuil");
assert.equal(mondeDuBossV1(0).monde, 1, "numéro invalide : monde 1");
// L'état du joueur envoie ces valeurs (catalogue, boss sélectionné), plus de division par 20.
const etat = fs.readFileSync(new URL("../src/idle-runtime-etat.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
assert.ok(etat.includes("mondeDuBossV1(index + 1).monde") && etat.includes("mondeDuBossV1(index + 1).ordre"), "catalogue des boss : monde et ordre selon la zone d'Aventure");
assert.ok(etat.includes("mondeDuBossV1(bossSelectionIndex + 1).monde"), "boss sélectionné : monde selon la zone d'Aventure");
console.log("idle-boss-monde-aventure-v1 : OK");
