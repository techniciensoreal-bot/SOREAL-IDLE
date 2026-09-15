import assert from "node:assert/strict";
import { idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-11) : "le mode aventure est déjà débloqué [après un
 * Rebirth]... il ne doit se débloquer qu'au niveau habituel. C'est
 * uniquement inventaire qui doit rester perma débloqué et collection
 * aussi. Le reste se redéverouille en montant de niveau."
 *
 * Ce test remplace idle-adventure-unlock-survives-rebirth.test.mjs, qui
 * verrouillait le comportement INVERSE (Aventure permanente une fois
 * atteinte) sur la foi d'une hypothèse jamais vérifiée contre le wiki NGU.
 * Vérifié depuis (wiki NGU, page "Rebirths", section "What do I lose when I
 * rebirth?") : "Access to the Adventure, Augmentation, Time Machine, and
 * Blood Magic tabs [is lost] until their related bosses are beaten...
 * Bosses fought (you go back to boss 1)." Seuls l'Inventaire et la
 * Collection restent permanents ("Basic Training, Money Pit, Inventory,
 * Wandoos 98 and all further tabs will remain unlocked").
 *
 * idleNguSnapshot() ne doit donc débloquer les zones Aventure QUE contre
 * context.bosses — le compteur du RUN EN COURS, remis à 0 par
 * renaitreSorealIdle() à chaque Renaissance — jamais contre
 * state.records.highestBoss (le high-water-mark historique, qui reste utile
 * pour d'autres besoins comme la Collection/Bestiaire, mais ne doit plus
 * jamais servir de porte d'accès à l'Aventure).
 */

// "tutorial" est la zone qui matérialise l'accès à l'Aventure elle-même
// (boss requis = 4, exactement le seuil réel du wiki NGU pour Adventure Mode).
const tutorialZone=(snapshot)=>snapshot.adventure.zones.find(z=>z.id==="tutorial");

// Run précédent : le joueur a déjà tué 10 boss (bien au-delà du seuil de 4
// requis par la zone "tutorial"/l'Aventure), donc records.highestBoss=10 est
// déjà persisté dans l'état sauvegardé.
const savedStateAfterPriorRun={
  records:{highestBoss:10,highestZone:1,setsCompleted:0,totalRebirths:1,highestGoldDrop:0}
};

// Juste après une Renaissance : le run EN COURS n'a encore tué aucun boss.
const freshRunContext={bosses:0,zone:1,sets:0,rebirths:1};

const snapshot=idleNguSnapshot(savedStateAfterPriorRun,freshRunContext);

assert.ok(
  tutorialZone(snapshot),
  "La zone 'tutorial' (seuil boss 4, porte d'entrée de l'Aventure) doit exister dans l'instantané."
);
assert.equal(
  tutorialZone(snapshot).unlocked,
  false,
  "L'Aventure déjà débloquée lors d'un run précédent doit se REVERROUILLER juste après une Renaissance tant que le boss 4 n'a pas été rebattu CE run, exactement comme le jeu réel — même si highestBoss=10 historiquement."
);
assert.equal(
  snapshot.records.highestBoss,
  10,
  "Le plus haut niveau de boss jamais atteint (utile ailleurs, ex. Bestiaire/Collection) ne doit toujours jamais régresser."
);

// Une fois le boss 4 rebattu CE run, l'Aventure se débloque à nouveau normalement.
const rebeatenContext={bosses:4,zone:1,sets:0,rebirths:1};
const rebeatenSnapshot=idleNguSnapshot(savedStateAfterPriorRun,rebeatenContext);
assert.equal(
  tutorialZone(rebeatenSnapshot).unlocked,
  true,
  "Dès que le boss 4 est rebattu CE run, l'Aventure doit se débloquer normalement."
);

// Contre-vérification : un joueur n'ayant JAMAIS tué le boss 4 (ni ce
// run-ci, ni un run précédent) ne doit toujours pas avoir accès à l'Aventure.
const neverReachedState={
  records:{highestBoss:1,highestZone:1,setsCompleted:0,totalRebirths:0,highestGoldDrop:0}
};
const neverReachedSnapshot=idleNguSnapshot(neverReachedState,{bosses:1,zone:1,sets:0,rebirths:0});
assert.equal(
  tutorialZone(neverReachedSnapshot).unlocked,
  false,
  "Une Aventure jamais atteinte (highestBoss=1 < seuil 4) doit rester verrouillée."
);

console.log("idle-adventure-relocks-on-rebirth: OK");
