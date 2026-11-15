import assert from "node:assert/strict";
import { nextBasicTrainingCapV411 } from "../src/idle-basic-training.js";

/*
 * Rebirth::resetTraining (code du jeu, build 1260, 2026-11-15) : r = (long)(1 + (n - 500 x i)^1,2 / 500 x (cap / 1000)) ; r >= 1 ; r <= cap / 10 + 1 ; nouveau cap = cap - r s'il reste plus de 1, sinon 1.
 */
const r = (cap, n, i) => Math.max(1, Math.trunc(1 + Math.pow(n - 500 * i, 1.2) / 500 * (cap / 1000)));
assert.equal(nextBasicTrainingCapV411(2500, 1000, 0), 2500 - Math.min(r(2500, 1000, 0), Math.trunc(2500 / 10) + 1), "compétence 0, niveau 1000");
assert.equal(nextBasicTrainingCapV411(2500, 1000, 0), 2480);
assert.equal(nextBasicTrainingCapV411(2500, 0, 0), 2499, "niveau 0 : réduction minimale de 1");
assert.equal(nextBasicTrainingCapV411(15000, 400, 1), 14999, "niveau < 500 x rang : puissance non définie, réduction de 1");
assert.equal(nextBasicTrainingCapV411(2500, 1e9, 0), 2500 - (250 + 1), "plafond de la réduction : cap / 10 + 1");
assert.equal(nextBasicTrainingCapV411(1, 5000, 0), 1);
assert.equal(nextBasicTrainingCapV411(2, 5000, 0), 1, "le cap ne tombe jamais sous 1");
console.log("idle-basic-training-cap-rebirth-v1: OK");
