import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-10-11) : « la barre Ciseaux de sécurité bouge alors qu'elle n'a pas d'énergie ». Cause : le repli sur l'allocation globale des anciennes sauvegardes s'appliquait à la piste « active » (Ciseaux par défaut) dès qu'elle
 * n'avait pas d'énergie propre : elle progressait avec le TOTAL placé ailleurs. Une piste sans énergie ne progresse jamais.
 */
const ctx = { bosses: 120, bestGold: 1e15, adventurePower: 1e9 };
const T = 1_000_000;
let s = normalizeIdleNguState({}, ctx, T);
s.systems.augmentations.unlocked = true;
s.resources.energy.cap = 1e9; s.resources.energy.current = 1e9; s.resources.energy.power = 1;
s.currencies.gold = 1e30;
// énergie seulement sur l'Upgrade des Ciseaux et sur le Lait ; rien sur l'Augment des Ciseaux (piste « active » par défaut)
s = applyIdleNguAction(s, { action: "allocateAugment", pair: "scissors", upgrade: true, value: 2e6 }, ctx, T).state;
s = applyIdleNguAction(s, { action: "allocateAugment", pair: "milk", upgrade: false, value: 1e6 }, ctx, T).state;
const avant = structuredClone(s.systems.augmentations.data.pairs.scissors);
s = advanceIdleNguState(s, 3000, ctx, T + 3_000_000);
const p = s.systems.augmentations.data.pairs.scissors;
assert.equal(p.level, avant.level, "l'Augment sans énergie ne gagne aucun niveau");
assert.equal(p.progress, avant.progress, "sa barre ne bouge pas");
assert.ok(p.upgradeLevel > avant.upgradeLevel || p.upgradeProgress > avant.upgradeProgress, "la piste qui a de l'énergie, elle, avance");
const d = idleNguSnapshot(s, ctx, T + 3_000_000).augmentations.find((x) => x.id === "scissors");
assert.equal(d.secondsPerLevel, null, "aucune durée annoncée pour une piste sans énergie");
console.log("idle-augments-piste-sans-energie-v1: OK");
