import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_MOB_BESTIARY_V1,
  IDLE_ADVENTURE_MOB_CATALOG_V1,
  idleAdventureMobBestiaryEntryV1
} from "../src/idle-adventure-v47.js";
import { applyIdleNguAction } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-17) : "ALL the boss names, ALL the mob names [...] les
 * MEMES noms [que NGU]". Ce test verrouille l'extension V2 du bestiaire
 * (design/build-idle-adventure-bestiary-v2.mjs, sourcée du miroir local
 * du wiki) aux 15 zones jouables, et les 2 divergences trouvées par
 * rapport à l'ancienne V1 écrite à la main.
 */

// --- Couverture complète : les 15 zones jouables ont toutes une entrée
// bestiaire non vide (avant cette session, seules 8 zones en avaient une,
// et Cave n'avait que 3 des 16 ennemis réels).
const ZONES_ATTENDUES = [
  "tutorial", "sewers", "forest", "cave", "sky", "hsb", "clock", "2d",
  "ancient", "avsp", "mega", "beardverse", "badly", "boring", "chocolate"
];
for (const zoneId of ZONES_ATTENDUES) {
  const z = IDLE_ADVENTURE_MOB_BESTIARY_V1[zoneId];
  assert.ok(z, "La zone " + zoneId + " doit avoir une entrée bestiaire.");
  assert.ok(z.normal.length > 0, "La zone " + zoneId + " doit avoir au moins un ennemi normal réel.");
}
assert.equal(IDLE_ADVENTURE_MOB_BESTIARY_V1.cave.normal.length, 13, "Cave doit avoir ses 13 ennemis normaux réels (3 seulement avant cette session).");
assert.equal(IDLE_ADVENTURE_MOB_BESTIARY_V1.cave.boss.length, 3, "Cave doit avoir ses 3 boss d'Aventure réels (0 avant cette session).");

// --- Divergence trouvée #1 : Sewers a 4 ennemis réels (3 normaux + 1
// boss), pas 3 -- "Small Mouse" manquait.
const sewersNames = IDLE_ADVENTURE_MOB_BESTIARY_V1.sewers.normal.map(m => m.name);
assert.ok(sewersNames.includes("Small Mouse"), "Sewers doit inclure 'Small Mouse' (absent de l'ancien bestiaire écrit à la main).");

// --- Divergence trouvée #2 : "Rat of Unusual Size" est un boss d'Aventure
// de Forest sur le wiki (boss=yes), pas un ennemi normal.
const forestBossNames = IDLE_ADVENTURE_MOB_BESTIARY_V1.forest.boss.map(m => m.name);
const forestNormalNames = IDLE_ADVENTURE_MOB_BESTIARY_V1.forest.normal.map(m => m.name);
assert.ok(forestBossNames.includes("Rat of Unusual Size"), "'Rat of Unusual Size' doit être classé boss d'Aventure de Forest (boss=yes sur le wiki).");
assert.ok(!forestNormalNames.includes("Rat of Unusual Size"), "'Rat of Unusual Size' ne doit plus apparaître comme ennemi normal de Forest.");
assert.ok(forestBossNames.includes("Gorgon"), "Gorgon doit rester boss d'Aventure de Forest.");

// --- Vrais noms NGU exacts (pas d'invention SOREAL) sur un échantillon.
assert.equal(IDLE_ADVENTURE_MOB_BESTIARY_V1.tutorial.normal[0].name, "A Small Piece of Fluff");
assert.equal(IDLE_ADVENTURE_MOB_BESTIARY_V1.tutorial.boss[0].name, "A Small Mouse");

// --- Zones sans art R2 dédié (beardverse/badly/boring/chocolate) ont
// quand même des stats RÉELLES exploitables en combat, même sans image.
for (const zoneId of ["beardverse", "badly", "boring", "chocolate"]) {
  assert.equal((IDLE_ADVENTURE_MOB_CATALOG_V1[zoneId] || {}).normal.length, 0, zoneId + " ne doit toujours avoir aucun art R2 dédié (pas encore livré).");
  assert.ok(IDLE_ADVENTURE_MOB_BESTIARY_V1[zoneId].normal.length > 0, zoneId + " doit quand même avoir des stats de combat réelles.");
}

// --- idleAdventureMobBestiaryEntryV1 doit retrouver une entrée réelle
// même pour une zone sans catalogue d'images (le combat ne dépend jamais
// de l'art disponible).
const beardverseEntry = idleAdventureMobBestiaryEntryV1({ id: "beardverse" }, false, 0);
assert.ok(beardverseEntry && beardverseEntry.name, "Une entrée bestiaire réelle doit être trouvable pour beardverse malgré l'absence d'art R2.");

/*
 * Correctif 2026-09-17 (extension bestiaire V2) : avant ce correctif, le
 * tirage du monstre réellement rencontré (monsterIndex, startZoneFight)
 * se basait UNIQUEMENT sur la longueur du catalogue d'images R2
 * (IDLE_ADVENTURE_MOB_CATALOG_V1), qui reste vide pour beardverse/badly/
 * boring/chocolate -- monsterIndex valait donc toujours -1 sur ces 4
 * zones, et idleAdventureMobBestiaryEntryV1 abandonnait aussitôt, même
 * avec des données bestiaire désormais disponibles. Ce test lance un
 * vrai combat sur Beardverse (débloqué dès boss 108) et vérifie qu'au
 * moins un des PV de monstre obtenus correspond à une vraie entrée du
 * bestiaire (mise à l'échelle), jamais systématiquement au seul repli
 * "moyenne de zone".
 */
const ctx = { adventurePower: 100, adventureToughness: 100, bosses: 200 };
const afterSelect = applyIdleNguAction(
  null,
  { action: "adventure", adventure: { action: "selectZone", zone: "beardverse" } },
  ctx,
  1
).state;

const originalRandom = Math.random;
const monsterHpMaxSeen = new Set();
try {
  // Force un combat NON-boss (bossChance jamais atteint) pour rester sur
  // le pool `normal`, et fait varier le tirage du monsterIndex sur
  // plusieurs tentatives indépendantes.
  const normalPool = IDLE_ADVENTURE_MOB_BESTIARY_V1.beardverse.normal;
  for (let i = 0; i < normalPool.length; i++) {
    Math.random = (() => {
      let call = 0;
      return () => {
        call++;
        // 1er tirage = bossChance (proche de 1 => jamais boss),
        // 2e tirage = monsterIndex (réparti sur normalPool.length).
        if (call === 1) return 0.99;
        return i / normalPool.length;
      };
    })();
    const fought = applyIdleNguAction(
      afterSelect,
      { action: "adventure", adventure: { action: "startZoneFight" } },
      ctx,
      2 + i
    );
    monsterHpMaxSeen.add(fought.state.adventure.fight.monsterHpMax);
  }
} finally {
  Math.random = originalRandom;
}
/*
 * Avant le correctif (monsterIndex toujours -1 sur les zones sans art),
 * TOUS les tirages retombaient sur l'unique repli plat z.oneHitP -- un
 * seul monsterHpMax possible, quel que soit le mob visé par le tirage.
 * Avec le repli sur la longueur du bestiaire, chaque mob réel (Power/
 * Toughness/maxHp différents, cf. IDLE_ADVENTURE_MOB_BESTIARY_V1.beardverse)
 * doit donner un monsterHpMax différent.
 */
assert.ok(
  monsterHpMaxSeen.size > 1,
  "Les combats sur Beardverse doivent varier selon le mob RÉELLEMENT tiré (bestiaire), pas retomber systématiquement sur l'unique repli plat de zone (monsterHpMaxSeen=" + [...monsterHpMaxSeen].join(",") + ")."
);

console.log("idle-ngu-real-names-bestiary-v2: OK");
