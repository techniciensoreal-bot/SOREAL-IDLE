import assert from "node:assert/strict";
import { lireReference } from "./_migrations-formes.mjs";
import * as M from "../src/idle-migrations-v1.js";
import { normalizeIdleNguState, rebirthIdleNguState, syncIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Migration 54 -> 55 (chaîne secrète de la Bête) : toute partie qui avait la Bête par l'ancienne règle (boss 132 atteint) ou qui l'avait déjà combattue garde son accès ; les autres doivent trouver le secret.
 * Puis le Rebirth qui pose titan6Unlocked (Rebirth::checkSpecial) de bout en bout par le vrai moteur.
 */
const cp = o => JSON.parse(JSON.stringify(o));
const T0 = 1.76e12;
const m = M.MIGRATIONS.find(x => x.de === 54);
assert.equal(m.vers, 55);
assert.equal(M.ETAT_VERSION_COURANTE, 55);

function ancien(modif = {}) {
  const e = cp(lireReference(1));
  e.etatVersion = 54;
  e.adventure = e.adventure || {};
  e.adventure.unlockFlags = Object.assign({}, e.adventure.unlockFlags);
  delete e.adventure.unlockFlags.titan6Unlocked;
  e.adventure.titans = {};
  e.records = Object.assign({}, e.records, { highestBoss: 50 });
  e.difficultyPeaks = { normal: 50, difficile: 0, extreme: 0 };
  e.difficulty = "normal";
  return Object.assign(e, modif);
}
const migrer = (e, jeu = {}) => M.appliquerMigrationV1(m, e, { now: T0, jeu });

{
  const e = migrer(ancien());
  assert.equal(e.etatVersion, 55);
  assert.ok(!e.adventure.unlockFlags.titan6Unlocked, "boss 50 : le secret reste à trouver");
}
{
  const e = ancien(); e.records.highestBoss = 132;
  assert.equal(migrer(e).adventure.unlockFlags.titan6Unlocked, true, "boss 132 atteint : accès conservé");
}
{
  const e = ancien(); e.records.highestBoss = 131;
  assert.ok(!migrer(e).adventure.unlockFlags.titan6Unlocked);
  assert.equal(migrer(ancien(), { bosses: 140 }).adventure.unlockFlags.titan6Unlocked, true, "boss en cours >= 132");
}
{
  const e = ancien(); e.difficultyPeaks.normal = 301;
  assert.equal(migrer(e).adventure.unlockFlags.titan6Unlocked, true, "pic de difficulté");
}
{
  const e = ancien(); e.difficulty = "difficile"; e.difficultyPeaks.normal = 301;
  assert.equal(migrer(e).adventure.unlockFlags.titan6Unlocked, true, "Evil : a forcément passé le 132");
}
{
  const e = ancien(); e.adventure.titans = { t6: { kills: 1, nextAt: 0 } };
  assert.equal(migrer(e).adventure.unlockFlags.titan6Unlocked, true, "Bête déjà vaincue");
}
{
  const e = migrer(ancien({ records: Object.assign({}, lireReference(1).records, { highestBoss: 200 }) }));
  const deux = migrer(cp(e));
  assert.equal(JSON.stringify(deux), JSON.stringify(e), "idempotente");
  const hors = ancien(); hors.etatVersion = 55;
  assert.ok(!M.appliquerMigrationV1(m, hors, { now: T0, jeu: {} }).adventure.unlockFlags.titan6Unlocked, "hors de sa version : sans effet");
}
/* Par la vraie normalisation : une sauvegarde à la version 54 avec le boss 132 atteint garde la Bête ; un nouveau joueur non. */
{
  const e = ancien(); e.records.highestBoss = 140;
  const n = normalizeIdleNguState(e, { bosses: 0 }, T0);
  assert.equal(n.adventure.unlockFlags.titan6Unlocked, true);
  assert.equal(n.etatVersion, 55);
  const neuf = normalizeIdleNguState({}, { bosses: 0 }, T0);
  assert.ok(!neuf.adventure.unlockFlags.titan6Unlocked, "nouvelle partie : le secret reste à trouver");
  assert.equal(neuf.etatVersion, 55);
}

/* Rebirth de bout en bout : 4 indices faits + 2600 s de partie : titan6Unlocked ; 2000 s : non. */
{
  const cx = { bosses: 100, rebirths: 1 };
  const prepare = (secondes, indices) => {
    const s = normalizeIdleNguState({}, cx, T0);
    s.runStartedAt = T0;
    for (let i = 1; i <= indices; i++) s.adventure.unlockFlags["clue" + i + "Complete"] = true;
    return rebirthIdleNguState(s, cx, T0 + secondes * 1000);
  };
  assert.equal(prepare(2600, 4).adventure.unlockFlags.titan6Unlocked, true);
  assert.ok(!prepare(2600, 3).adventure.unlockFlags.titan6Unlocked);
  assert.ok(!prepare(2500, 4).adventure.unlockFlags.titan6Unlocked);
  assert.ok(!prepare(2615, 4).adventure.unlockFlags.titan6Unlocked);
}
console.log("idle-bete-migration-v1: OK");
