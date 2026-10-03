import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_ITEM_CATALOG_V1,
  IDLE_ADVENTURE_SETS,
  IDLE_ADVENTURE_ITEM_SETS_V1,
  SET_ITEM_NAMES_V1,
  normalizeIdleAdventureStateV47
} from "../src/idle-adventure-v47.js";
import { NOMS_SPECIALS_FR_V1, NOMS_SETS_FR_V1, NOMS_SETS_OBJETS_FR_V1, NOMS_PIECES_FR_V1 } from "../src/idle-noms-fr-v1.js";

/*
 * Norman (2026-10-03) : « Traduits les noms d'objets. Par exemple "Pissed Off Key" ».
 * Traduction purement cosmétique : identifiants et valeurs du wiki inchangés, seul le nom affiché devient français.
 */
const catalogue = IDLE_ADVENTURE_ITEM_CATALOG_V1;

// 1. L'exemple de Norman.
assert.equal(catalogue.pissedOffKey.name, "Clé furieuse");
assert.equal(catalogue.pissedOffKey.wikiItemId > 0, true, "l'identifiant wiki (image) ne change pas");
assert.equal(IDLE_ADVENTURE_ITEM_SETS_V1.pissedOffKey.name, "Set Clé furieuse");

// 2. Chaque objet du catalogue a une traduction explicite (aucun oubli) et les noms sont uniques.
const noms = new Map();
for (const [id, def] of Object.entries(catalogue)) {
  const fr = def.kind === "equipment" ? NOMS_PIECES_FR_V1[id] : NOMS_SPECIALS_FR_V1[id];
  assert.ok(fr, `traduction manquante pour ${id}`);
  assert.equal(def.name, fr, `le catalogue doit porter le nom français de ${id}`);
  if (def.kind === "equipment") assert.equal(SET_ITEM_NAMES_V1[id], fr, `pièce ${id}`);
  assert.ok(!noms.has(fr), `nom en double : « ${fr} » (${id} et ${noms.get(fr)})`);
  noms.set(fr, id);
}

// 3. Chaque set (équipement et objets) a un nom français, sans doublon.
const nomsSets = new Set();
for (const [id, s] of Object.entries(IDLE_ADVENTURE_SETS)) {
  assert.equal(s.name, NOMS_SETS_FR_V1[id], `set ${id}`);
  assert.ok(!nomsSets.has(s.name), `nom de set en double : ${s.name}`);
  nomsSets.add(s.name);
}
for (const [id, s] of Object.entries(IDLE_ADVENTURE_ITEM_SETS_V1)) {
  assert.equal(s.name, NOMS_SETS_OBJETS_FR_V1[id], `set d'objet ${id}`);
  assert.ok(!nomsSets.has(s.name), `nom de set en double : ${s.name}`);
  nomsSets.add(s.name);
}

// 4. Plus aucun nom de set anglais (« ... Set ») ni nom d'objet repéré à l'ancienne dans le catalogue.
for (const s of nomsSets) assert.ok(!/ Set$/.test(s), `nom de set resté anglais : ${s}`);
for (const [id, def] of Object.entries(catalogue)) assert.ok(!/ Set /.test(def.setName + " "), `setName anglais : ${id}`);

// 5. Un objet déjà enregistré avec son ancien nom anglais passe en français au chargement (comme les pièces d'équipement).
{
  const s = normalizeIdleAdventureStateV47({
    version: normalizeIdleAdventureStateV47({}).version,
    inventory: [{ id: "k1", definitionId: "pissedOffKey", kind: "special", level: 0, name: "Pissed Off Key" }]
  });
  assert.equal(s.inventory.find((i) => i.id === "k1").name, "Clé furieuse");
}

console.log("idle-noms-objets-fr-v1: OK (" + noms.size + " objets, " + nomsSets.size + " sets)");
