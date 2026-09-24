import assert from "node:assert/strict";
import {
  applyIdleAdventureActionV47,
  createIdleAdventureStateV47,
  normalizeIdleAdventureStateV47,
  idleAdventureItemBaseValueV1,
  IDLE_ADVENTURE_ITEM_CATALOG_V1
} from "../src/idle-adventure-v47.js";

/*
 * Audit des objets du 2026-09-24 (script : 431 modèles "Template:Item data" du
 * miroir NGU-Wiki comparés au catalogue). Valeurs recopiées des modèles.
 */

// --- 1. "Base value" Power/Toughness : départ d'un objet neuf ---
{
  // Kokiri Blade : powervalbase 20 ; The Tuba of Time : 2/2 ; THE EXPONENTIAL : 2 800 000 (= plafond niveau 0) ;
  // The Titan Effigy : 13 000 000 000 ; Tutorial Cube : 0 ; My Red Heart : 69/69 (pBase de la définition).
  assert.deepEqual(idleAdventureItemBaseValueV1("forest:weapon"), { power: 20, toughness: 0 });
  assert.deepEqual(idleAdventureItemBaseValueV1("tubaTime"), { power: 2, toughness: 2 });
  assert.deepEqual(idleAdventureItemBaseValueV1("theExponential"), { power: 2800000, toughness: 2800000 });
  assert.deepEqual(idleAdventureItemBaseValueV1("titanEffigy"), { power: 13000000000, toughness: 13000000000 });
  assert.deepEqual(idleAdventureItemBaseValueV1("tutorialCube"), { power: 0, toughness: 0 });
  assert.deepEqual(idleAdventureItemBaseValueV1("heartRed"), { power: 69, toughness: 69 });
  // Cloth Hat : toughnessvalbase 1 ; A Beanie : 0/1 600.
  assert.deepEqual(idleAdventureItemBaseValueV1("training:head"), { power: 0, toughness: 1 });
  assert.deepEqual(idleAdventureItemBaseValueV1("aBeanie"), { power: 0, toughness: 1600 });

  const s = createIdleAdventureStateV47();
  let r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "theExponential", level: 0 }, {}, 1);
  const expo = r.state.inventory.find((o) => o.definitionId === "theExponential");
  assert.equal(expo.power, 2800000, "un accessoire Evil tombe déjà à son plafond du niveau 0 (Base value = Max stat at lvl 0)");
  assert.equal(expo.toughness, 2800000);
  r = applyIdleAdventureActionV47(r.state, { action: "addItem", definitionId: "cave:weapon", level: 7 }, {}, 1);
  const mole = r.state.inventory.find((o) => o.definitionId === "cave:weapon");
  assert.equal(mole.power, 120, "Mole Hammer : Base value 120, jamais un tirage aléatoire");
  // "A Regular Tie" publie une Base value (82) au-dessus de son plafond du niveau 0 (81.5) : ramenée au plafond.
  r = applyIdleAdventureActionV47(r.state, { action: "addItem", definitionId: "jake:tie", level: 0 }, {}, 1);
  assert.equal(r.state.inventory.find((o) => o.definitionId === "jake:tie").toughness, 81.5);
}

// Objet déjà possédé, créé à 0 avant le correctif : remonte à sa Base value au chargement.
{
  const s = createIdleAdventureStateV47();
  const brut = JSON.parse(JSON.stringify(s));
  brut.inventory.push({ id: "vieux", definitionId: "forest:weapon", kind: "equipment", set: "forest", slot: "weapon", level: 3, power: 0, toughness: 0, special: 0 });
  brut.inventory.push({ id: "boosté", definitionId: "forest:weapon", kind: "equipment", set: "forest", slot: "weapon", level: 3, power: 50, toughness: 0, special: 0 });
  const n = normalizeIdleAdventureStateV47(brut);
  assert.equal(n.inventory.find((o) => o.id === "vieux").power, 20);
  assert.equal(n.inventory.find((o) => o.id === "boosté").power, 50, "une valeur déjà boostée n'est jamais réduite");
}

// Aucune Base value ne dépasse le plafond du niveau 0 hors du cas "A Regular Tie".
{
  for (const [id, d] of Object.entries(IDLE_ADVENTURE_ITEM_CATALOG_V1)) {
    const b = idleAdventureItemBaseValueV1(id);
    if (id === "jake:tie") continue;
    assert.ok(b.power <= d.basePower + 1e-6 && b.toughness <= d.baseToughness + 1e-6, `${id} : Base value > plafond niveau 0`);
  }
}

console.log("idle-items-wiki-audit-2026-09-24: OK");
