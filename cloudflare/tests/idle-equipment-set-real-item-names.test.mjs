import assert from "node:assert/strict";
import {
  normalizeIdleAdventureStateV47,
  applyIdleAdventureActionV47
} from "../src/idle-adventure-v47.js";

/*
 * Round 2 (2026-09-18, sweep "renommage des sets d'équipement") : les 35
 * sets suivant Training (sewers -> pirate, la totalité du catalogue
 * d'équipement Adventure Mode Normal) portaient un nom générique
 * SOREAL-inventé ("Sewers Set head", ...) au lieu du vrai nom wiki par
 * pièce. Voir le commentaire détaillé au-dessus de SET_ITEM_NAMES_V1 dans
 * idle-adventure-v47.js pour le détail de la méthode de sourcing (miroir
 * wiki local, page {{Set}} par zone). Ce test vérifie un échantillon
 * représentatif (au moins une pièce par set, plus les cas particuliers
 * documentés -- edgy/pinkprincess/wanderer/rerednaw/uug) plutôt que les
 * ~180 entrées individuelles.
 */

const SAMPLES = {
  "sewers:weapon": "Épée rouillée",
  "sewers:amulet": "Amulette fissurée",
  "forest:pendant": "Forest Pendant",
  "cave:combat": "Combat Cheese",
  "hsb:weapon": "Magitech Blade",
  "grb:necklace": "Suspicious Sausage Necklace",
  "grb:meat": "Raw Slab of Meat",
  "clock:alarm": "Alarm Clock",
  "clock:sands": "The Sands of Time",
  "2d:cube": "THE CUBE",
  "spoopy:amulet": "Amulet of Sunshine, Sparkles, and Gore",
  "jake:tie": "A Regular Tie",
  "jake:paperweight": "Generic Paperweight",
  "gaudy:weapon": "Paper Fan",
  "mega:weapon": "Beam Laser Sword",
  "beardverse:boots": "Fuzzy Orange Cheeto Slippers!",
  "badly:weapon": "Badly Drawn Gun",
  "stealth:legs": "No Pants",
  "choco:weapon": "Chocolate Crowbar",
  // uug : pas de slots corps, uniquement 5 anneaux
  "uug:ringGreed": "Ring of Greed",
  "uug:ringMagic": "Ring of Way Too Much Magic",
  // wanderer/rerednaw : 4 slots seulement, pas de weapon
  "wanderer:head": "Wanderer's Hat",
  "rerednaw:head": "taH s'rerednaW",
  "slimy:weapon": "The Fists of Flubber",
  // edgy : 5 pièces ; les bottes forment "Edgy Boots (set)" (Left/Right), BOTH à part
  "edgyboots:left": "Left Edgy Boot",
  "bothedgy:boots": "BOTH Edgy Boots",
  "edgy:weapon": "Edgy Jaw Axe",
  // pinkprincess : slot confirmé via catégorie objet (pas la position de page)
  "pinkprincess:weapon": "Giant Sticky Foot",
  "pinkprincess:amulet": "A Pretty Pink Bow",
  "meta:charmInfinity": "Infinity Charm",
  "meta:charm69": "69 Charm",
  "party:cup": "Plastic Red Cup",
  "party:whistle": "Party Whistle",
  // typo : jeux de mots (Hamlet=Helmet, Wee pin=Weapon)
  "typo:head": "Hamlet",
  "typo:weapon": "Wee pin",
  "fad:weapon": "THE MALF SLAMMER",
  "jrpg:weapon": "Gift Shop Buster Sword Replica",
  "jrpg:head": "Buster Sword Top",
  "rad:boots": "A Skateboard",
  "backtoschool:theS": "THE S",
  "western:corgi": "A Battle Corgi",
  // bread : slot "baguette" nommé par l'objet, arme réelle distincte
  "bread:baguette": "1 Day-Old Baguette",
  "bread:weapon": "A Rolling Pin",
  "disco:vinylShard": "A Vinyl Record Shard",
  "halloweenie:legs": "A Broomstick",
  "halloweenie:weapon": "A Giant Scythe",
  "construction:hammer": "A Wooden Hammer",
  "construction:weapon": "A Giant Wrecking Ball",
  "duck:shotgun": "A shotgun",
  "duck:weapon": "The Zapper",
  "dutch:weapon": "Weaponized Hollandaise sauce",
  "pirate:cutlass": "The Cutlass",
  "pirate:weapon": "The Flintlock"
};

for (const [definitionId, expectedName] of Object.entries(SAMPLES)) {
  const [set, slot] = definitionId.split(":");
  const s = normalizeIdleAdventureStateV47({});
  const r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId, level: 10 }, { bosses: 200 }, 1);
  const created = r.state.inventory.find((i) => i.definitionId === definitionId);
  assert.ok(created, `L'objet ${definitionId} doit avoir été créé.`);
  assert.equal(
    created.name,
    expectedName,
    `wiki (${set} (set)) : le slot "${slot}" doit s'appeler "${expectedName}", pas un nom générique inventé.`
  );
}

console.log(`idle-equipment-set-real-item-names: OK (${Object.keys(SAMPLES).length} pièces vérifiées sur 35 sets)`);
