import assert from "node:assert/strict";
import {
  createIdleAdventureStateV47,
  normalizeIdleAdventureStateV47
} from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-18, en direct, marqué URGENT) : "Le cube tutorial
 * n'est toujours pas présent quand on ouvre l'inventaire. Normalement,
 * il doit déjà s'y trouver à la première fois où on accède à notre
 * inventaire. Il est juste là sans l'avoir drop. Ensuite on peut
 * l'équiper et déjà le remplir avec les boosts adéquats."
 *
 * Vérifié sur le wiki (4G's Merge and Boost Tutorial Cube) : le joueur
 * possède déjà cet objet dès le tout début du jeu -- jamais besoin de le
 * faire tomber une première fois. base() (idle-adventure-v47.js), le
 * seul point de construction d'un état Aventure neuf, sème désormais un
 * Tutorial Cube niveau 0 dans l'inventaire (pas pré-équipé -- Norman a
 * été explicite : "on peut l'équiper", une action que le joueur fait
 * lui-même).
 */

// --- Un tout nouvel état contient déjà le Tutorial Cube, dans le sac (pas équipé) ---
{
  const s = createIdleAdventureStateV47();
  const cube = s.inventory.find((i) => i.definitionId === "tutorialCube");
  assert.ok(cube, "Un état Aventure neuf doit déjà contenir un Tutorial Cube dans l'inventaire, sans jamais avoir besoin de le faire tomber.");
  assert.equal(cube.kind, "cube", "Doit être du kind 'cube' (comme n'importe quel autre Tutorial Cube obtenu en jeu).");
  assert.equal(cube.level, 0, "Doit démarrer au niveau 0 (comme un objet jamais encore fusionné).");
  assert.equal(cube.slot, "special", "Doit porter le même slot que la définition SPECIALS.tutorialCube (accessoire équipable).");
  assert.ok(
    !s.equipment.accessories.includes(cube.id),
    "Ne doit PAS être pré-équipé -- Norman : 'il est juste là sans l'avoir drop. Ensuite on peut l'équiper' (une action du joueur, pas automatique)."
  );
}

// --- itemList doit déjà refléter sa découverte (le joueur le possède, il n'est pas "jamais vu") ---
{
  const s = createIdleAdventureStateV47();
  assert.ok(
    s.itemList.tutorialCube && s.itemList.tutorialCube.seen === true,
    "itemList.tutorialCube doit déjà être marqué 'seen' -- l'objet est réellement possédé dès le départ, pas juste théoriquement obtenable."
  );
}

// --- Un état legacy/corrompu (retombe sur base()) reçoit aussi le cube de départ ---
{
  const s = normalizeIdleAdventureStateV47({ version: "old", inventory: [{ level: 99 }] });
  const cube = s.inventory.find((i) => i.definitionId === "tutorialCube");
  assert.ok(cube, "Un état sans version V47 valide (retombe sur base()) doit aussi recevoir le Tutorial Cube de départ.");
  assert.equal(s.inventory.length, 1, "L'inventaire d'un état frais ne doit contenir QUE le cube de départ -- toute donnée invalide doit rester écartée.");
}

// --- Un état DÉJÀ V47 existant (joueur réel en cours de partie) ne doit PAS en recevoir un second à chaque normalisation ---
{
  const frais = createIdleAdventureStateV47();
  const cubeId = frais.inventory.find((i) => i.definitionId === "tutorialCube").id;
  // Simule une re-normalisation d'un état déjà valide (ex. chaque tick serveur) -- ne doit jamais re-semer un second cube.
  const renormalise = normalizeIdleAdventureStateV47(frais);
  const cubes = renormalise.inventory.filter((i) => i.definitionId === "tutorialCube");
  assert.equal(
    cubes.length, 1,
    "Un état déjà V47 valide ne doit jamais recevoir un second Tutorial Cube à chaque renormalisation (sinon un joueur en cours de partie en accumulerait un à chaque tick)."
  );
  assert.equal(cubes[0].id, cubeId, "Doit rester le MÊME objet (même id), jamais remplacé par une nouvelle instance.");
}

console.log("idle-adventure-starting-tutorial-cube: OK");
