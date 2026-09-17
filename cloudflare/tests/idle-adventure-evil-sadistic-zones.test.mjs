import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_ZONES,
  normalizeIdleAdventureStateV47,
  idleAdventureSnapshotV47,
  applyIdleAdventureActionV47
} from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * Wiki NGU local, page "Adventure Mode", tableaux "Evil"/"SADISTIC" pour
 * les stats de zone, et page "Evil difficulty" section "Differences" >
 * "Adventure" : "Zones from Evilverse onwards are unlockable by beating
 * their corresponding boss in evil difficulty. Normal zones remain
 * unlocked at all times." (idem SADISTIC : "...from Back to School
 * onwards... in Sadistic.")
 */

const evilverse = IDLE_ADVENTURE_ZONES.find(z => z.id === "evilverse");
const backToSchool = IDLE_ADVENTURE_ZONES.find(z => z.id === "backtoschool");

assert.equal(evilverse.boss, 58);
assert.equal(evilverse.requiredDifficulty, "difficile");
assert.equal(evilverse.p, 1e13);
assert.equal(evilverse.t, 4.7e12);
assert.equal(evilverse.oneHitP, 4.40e14);

assert.equal(backToSchool.boss, 125);
assert.equal(backToSchool.requiredDifficulty, "extreme");

// 17 nouvelles zones (8 Evil + 9 Sadistic), aucune régression sur les 15 Normal.
assert.equal(IDLE_ADVENTURE_ZONES.filter(z => z.requiredDifficulty === "difficile").length, 8);
assert.equal(IDLE_ADVENTURE_ZONES.filter(z => z.requiredDifficulty === "extreme").length, 9);
assert.equal(IDLE_ADVENTURE_ZONES.filter(z => !z.requiredDifficulty).length, 16, "15 zones Normal + Safe Zone = 16 sans requiredDifficulty.");

// --- Une zone Evil reste verrouillée en Normal, même boss largement dépassé ---
{
  const snap = idleAdventureSnapshotV47(normalizeIdleAdventureStateV47({}), 301, "normal", { normal: 301 });
  const z = snap.zones.find(x => x.id === "evilverse");
  assert.equal(z.unlocked, false, "Boss 58 dépassé (301) mais en difficulté Normal : Evilverse doit rester verrouillée.");
}

// --- La même zone se débloque en Evil, une fois le boss réellement atteint EN EVIL ---
{
  const tooEarly = idleAdventureSnapshotV47(normalizeIdleAdventureStateV47({}), 57, "difficile", { normal: 301 });
  assert.equal(tooEarly.zones.find(x => x.id === "evilverse").unlocked, false, "Boss 57 en Evil : pas encore assez pour Evilverse (seuil 58).");

  const unlocked = idleAdventureSnapshotV47(normalizeIdleAdventureStateV47({}), 58, "difficile", { normal: 301 });
  assert.equal(unlocked.zones.find(x => x.id === "evilverse").unlocked, true, "Boss 58 en Evil : Evilverse doit se débloquer.");
}

// --- Une zone Sadistic ne se débloque jamais juste en Evil, même boss suffisant ---
{
  const snap = idleAdventureSnapshotV47(normalizeIdleAdventureStateV47({}), 125, "difficile", { normal: 301, difficile: 301 });
  assert.equal(snap.zones.find(x => x.id === "backtoschool").unlocked, false, "Back To School exige la difficulté Sadistic elle-même, pas seulement le boss 125.");

  const snapSadistic = idleAdventureSnapshotV47(normalizeIdleAdventureStateV47({}), 125, "extreme", { normal: 301, difficile: 301 });
  assert.equal(snapSadistic.zones.find(x => x.id === "backtoschool").unlocked, true, "Boss 125 EN Sadistic doit débloquer Back To School.");
}

// --- "Normal zones remain unlocked at all times" : zone Normal accessible via le pic historique même en Evil ---
{
  // bosses=0 (run Evil qui vient de démarrer), mais le joueur a déjà fini Normal un jour (peak=301).
  const snap = idleAdventureSnapshotV47(normalizeIdleAdventureStateV47({}), 0, "difficile", { normal: 301 });
  const tutorial = snap.zones.find(x => x.id === "tutorial");
  assert.equal(tutorial.unlocked, true, "Une zone Normal déjà atteinte un jour (difficultyPeaks.normal) doit rester accessible même en pleine run Evil à bosses=0.");
}

// --- Sans difficultyPeaks fourni (compat rétroactive) : comportement inchangé, zones Normal basées sur le run courant ---
{
  const snap = idleAdventureSnapshotV47(normalizeIdleAdventureStateV47({}), 4);
  assert.equal(snap.zones.find(x => x.id === "tutorial").unlocked, true);
  assert.equal(snap.zones.find(x => x.id === "evilverse").unlocked, false, "Sans difficulty fourni, une zone Evil reste verrouillée par défaut (jamais un accès accordé par erreur).");
}

// --- selectZone respecte le même gate (pas seulement l'affichage du snapshot) ---
{
  const state = normalizeIdleAdventureStateV47({});
  assert.throws(
    () => applyIdleAdventureActionV47(state, { action: "selectZone", zone: "evilverse" }, { bosses: 58, difficulty: "normal" }, 1),
    /ZONE_VERROUILLEE/,
    "selectZone doit refuser Evilverse en difficulté Normal, même boss suffisant."
  );
  const { result } = applyIdleAdventureActionV47(state, { action: "selectZone", zone: "evilverse" }, { bosses: 58, difficulty: "difficile" }, 1);
  assert.equal(result.zone, "evilverse", "selectZone doit réussir avec la bonne difficulté.");
}

console.log("idle-adventure-evil-sadistic-zones: OK");
