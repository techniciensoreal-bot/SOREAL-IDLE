import assert from "node:assert/strict";
import {
  normalizeIdleAdventureStateV47,applyIdleAdventureActionV47
} from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-16) : "Sébastien a toujours le boost spécial qui est
 * ajouté à son épée alors que c'est impossible normalement."
 *
 * Root cause confirmée : applyBoost() ne vérifiait jamais que la cible
 * d'un boost "special" était réellement un objet du catalogue SPECIALS
 * (accessoires/cube — les seuls à avoir un vrai bonus "special", voir le
 * commentaire au-dessus de applyBoost dans idle-adventure-v47.js :
 * "SOREAL n'a jamais construit de mécanisme de bonus par objet pour ces
 * Specials... seuls les Specials globaux déjà câblés via setRewards
 * existent"). Une arme/armure d'un set (kind:"set") pouvait donc
 * accumuler un "special" sans plafond ni formule ni effet de jeu réel —
 * exactement ce que Sébastien a constaté sur son épée.
 */

// 1) Un boost "special" sur une arme d'équipement (kind:"set") doit être refusé.
{
  let s = normalizeIdleAdventureStateV47({});
  s.inventory = s.inventory.filter(function(i){return i.definitionId!=="tutorialCube";});  let r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "forest:weapon", level: 40 }, { bosses: 17 }, 1);
  s = r.state;
  const weaponId = s.inventory[0].id;

  const boostId = "test-special-boost-1";
  s.inventory.push({ id: boostId, definitionId: "boost:special:100", name: "Boost special 100", kind: "boost", boostType: "special", strength: 100, level: 0 });

  assert.throws(
    () => applyIdleAdventureActionV47(s, { action: "boost", boostId, targetId: weaponId }, { bosses: 17 }, 1),
    /BOOST_SPECIAL_CIBLE_INVALIDE/,
    "Un boost special sur une arme d'équipement (kind:\"set\") doit être refusé — impossible normalement."
  );
}

// 2) Un boost "special" sur un vrai objet SPECIALS (accessoire/cube) doit continuer à fonctionner.
{
  let s = normalizeIdleAdventureStateV47({});
  s.inventory = s.inventory.filter(function(i){return i.definitionId!=="tutorialCube";});  let r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "tutorialCube", level: 1 }, { bosses: 17 }, 1);
  s = r.state;
  // tutorialCube a cube:true dans son catalogue, donc l'objet construit porte
  // kind:"cube" (voir special() dans idle-adventure-v47.js) — mais defById()
  // le classe bien "special" pour le garde-fou (n'importe quel id du
  // catalogue SPECIALS, cube ou non), c'est ce qui compte ici.
  const cubeId = s.inventory.find(x => x.definitionId === "tutorialCube")?.id;
  assert.ok(cubeId, "Un objet 'tutorialCube' doit exister dans l'inventaire après addItem.");

  const boostId = "test-special-boost-2";
  s.inventory.push({ id: boostId, definitionId: "boost:special:1", name: "Boost special 1", kind: "boost", boostType: "special", strength: 1, level: 0 });

  assert.doesNotThrow(
    () => applyIdleAdventureActionV47(s, { action: "boost", boostId, targetId: cubeId }, { bosses: 17 }, 1),
    "Un boost special sur un vrai objet SPECIALS (kind:\"special\") doit rester autorisé."
  );
}

// 3) Power/Toughness boosts sur une arme d'équipement doivent rester inchangés (pas de régression).
{
  let s = normalizeIdleAdventureStateV47({});
  s.inventory = s.inventory.filter(function(i){return i.definitionId!=="tutorialCube";});  let r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "forest:weapon", level: 40 }, { bosses: 17 }, 1);
  s = r.state;
  let r2 = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "forest:weapon", level: 40 }, { bosses: 17 }, 1);
  s = r2.state;
  const ids = s.inventory.map(x => x.id);
  const merged = applyIdleAdventureActionV47(s, { action: "merge", a: ids[0], b: ids[1] }, { bosses: 17 }, 1);
  s = merged.state;
  const weaponId = s.inventory[0].id;

  const boostId = "test-power-boost-1";
  s.inventory.push({ id: boostId, definitionId: "boost:power:100", name: "Boost power 100", kind: "boost", boostType: "power", strength: 100, level: 0 });

  assert.doesNotThrow(
    () => applyIdleAdventureActionV47(s, { action: "boost", boostId, targetId: weaponId }, { bosses: 17 }, 1),
    "Un boost power/toughness sur une arme d'équipement doit rester autorisé — seul 'special' est concerné par le nouveau garde-fou."
  );
}

console.log("idle-adventure-special-boost-equipment-guard: OK");
