import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  rebirthIdleNguState,
  idleNguBonuses
} from "../src/idle-ngu-progression.js";

/*
 * 2026-09-24 — audit de composition, page « NUMBER » (miroir local, page
 * restaurée) : « NUMBER ... multiplies your Attack and Defense from Basic
 * Training. The NUMBER for the next rebirth will be the product of the
 * following factors » : boss courant / précédent, facteurs de temps,
 * entraînement, Blood Magic, NGU Number, Beard NUMBER, Yggdrasil (Fruit of
 * Numbers activé ce Rebirth), MacGuffin, Number Hack.
 *
 * Avant : Beard et NGU Number étaient multipliés au NUMBER courant (Attaque)
 * ET au prochain NUMBER (comptés deux fois d'un Rebirth à l'autre) ; Fruit of
 * Numbers et Number Hack touchaient l'Attaque mais jamais le prochain NUMBER.
 */

const ctx = { bosses: 100 };
const T = 2 * 3600 * 1000;

function etatAvecNumber(mutate) {
  const s = normalizeIdleNguState({}, ctx, 0);
  s.rebirth.number = 1000;
  if (mutate) mutate(s);
  return normalizeIdleNguState(s, ctx, T);
}

const base = etatAvecNumber();
const bAtt = idleNguBonuses(base).attackMultiplier;
const bDef = idleNguBonuses(base).defenseMultiplier;
assert.equal(idleNguBonuses(base).numberMultiplier, 1000, "le NUMBER courant seul multiplie l'Attaque");

/* Beard NUMBER (Reverse Hitler) : facteur du prochain NUMBER uniquement. */
{
  const s = etatAvecNumber((x) => {
    x.systems.beards.unlocked = true;
    x.systems.beards.data.tracks.defense.permanentLevel = 50;
  });
  const beard = idleNguBonuses(s).beardNumberMultiplier;
  assert.ok(beard > 1, "le Beard NUMBER doit être actif pour ce test");
  assert.equal(idleNguBonuses(s).attackMultiplier, bAtt, "Beard NUMBER : aucun effet sur l'Attaque du run courant");
  assert.equal(idleNguBonuses(s).defenseMultiplier, bDef);
  assert.ok(Math.abs(s.rebirth.preview.beardNumberBonus - beard) < 1e-12);
  assert.ok(Math.abs(s.rebirth.nextNumber / base.rebirth.nextNumber - beard) < 1e-9, "compté une seule fois dans le prochain NUMBER");
}

/* Fruit of Numbers : x^1.3 x 0,05 %, prochain NUMBER, seulement si activé ce Rebirth. */
{
  const actif = etatAvecNumber((x) => {
    x.systems.yggdrasil.data.permanent.numbersValue = 100;
    x.systems.yggdrasil.data.runNumbersActive = true;
  });
  const attendu = 1 + Math.pow(100, 1.3) * 5e-4;
  assert.equal(idleNguBonuses(actif).attackMultiplier, bAtt);
  assert.ok(Math.abs(actif.rebirth.preview.yggNumberBonus - attendu) < 1e-12);
  assert.ok(Math.abs(actif.rebirth.nextNumber / base.rebirth.nextNumber - attendu) < 1e-9);
  const inactif = etatAvecNumber((x) => {
    x.systems.yggdrasil.data.permanent.numbersValue = 100;
    x.systems.yggdrasil.data.runNumbersActive = false;
  });
  assert.equal(inactif.rebirth.preview.yggNumberBonus, 1, "non mangé ce Rebirth : facteur 1");
}

/* Number Hack : « Hacks do not affect Normal mode » ; en Evil, facteur du prochain NUMBER. */
{
  const hack = (difficulty) => etatAvecNumber((x) => {
    x.difficulty = difficulty;
    x.systems.hacks.unlocked = true;
    x.systems.hacks.data.tracks.number.level = 10;
  });
  const normal = hack("normal");
  assert.equal(normal.rebirth.preview.hacksNumberBonus, 1);
  const evil = hack("difficile");
  const attendu = 1 + 5 * 10 / 100; /* 5 %/niveau, 1er palier à 40 niveaux (page Hacks) */
  assert.ok(Math.abs(evil.rebirth.preview.hacksNumberBonus - attendu) < 1e-12);
  const evilSans = etatAvecNumber((x) => { x.difficulty = "difficile"; });
  assert.equal(idleNguBonuses(evil).attackMultiplier, idleNguBonuses(evilSans).attackMultiplier, "le Number Hack ne touche pas l'Attaque courante");
}

/* Changement de difficulté : NUMBER ET facteurs du Rebirth précédent remis à 1. */
{
  let s = normalizeIdleNguState(null, { bosses: 301 }, 0);
  s.difficultyPeaks.normal = 301;
  s.runStartedAt = 0;
  s.rebirth.number = 999;
  s.bonuses.richJerksAttackLevel = 1000;
  s.systems.perks.data.levels[5] = 100;
  const c = { bosses: 301, beastV4Beaten: true };
  const after = applyIdleNguAction(s, { action: "difficulty", value: "difficile" }, c, 4 * 60 * 1000).state;
  assert.equal(after.rebirth.number, 1);
  assert.equal(after.rebirth.hasPreviousRun, false);
  const next = normalizeIdleNguState(after, { bosses: 3 }, 4 * 60 * 1000 + T);
  assert.equal(next.rebirth.preview.priorBossFactor, 1, "« prior boss » : 1 après un changement de difficulté (et non 1,5^301)");
  assert.equal(next.rebirth.preview.priorTimeFactor, 1);
}

/* Rebirth ordinaire : les facteurs précédents restent (2^boss du run fini). */
{
  let s = normalizeIdleNguState({}, { bosses: 12 }, 0);
  s.runStartedAt = 0;
  s = rebirthIdleNguState(s, { bosses: 12 }, T);
  assert.equal(s.rebirth.hasPreviousRun, true);
  const next = normalizeIdleNguState(s, { bosses: 4 }, 2 * T);
  assert.ok(Math.abs(next.rebirth.preview.priorBossFactor / Math.pow(2, 12) - 1) < 1e-12);
}

console.log("idle NUMBER composition: OK");
