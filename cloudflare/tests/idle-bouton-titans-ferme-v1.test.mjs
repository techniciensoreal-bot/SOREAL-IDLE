import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { idleNguSnapshot, normalizeIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * EXCEPTION à la règle n°2 voulue par Norman (2026-10-10) : le bouton « Titans » est visible avant l'accès, en « ??? », avec le boss à vaincre. Le serveur n'envoie qu'un nombre (titansAccesBoss) ; la liste des titans
 * reste filtrée (aucun nom, aucune puissance).
 */
const t0 = 1_000_000;
const neuf = normalizeIdleNguState({}, { bosses: 20 }, t0);
const s = idleNguSnapshot(neuf, { bosses: 20 }, t0);
assert.deepEqual(s.adventure.titans, [], "la liste des titans reste vide avant l'accès");
assert.equal(s.adventure.titansAccesBoss, 58, "le boss du premier titan est donné");
const loin = idleNguSnapshot(normalizeIdleNguState({}, { bosses: 70 }, t0), { bosses: 70 }, t0);
assert.ok(loin.adventure.titans.length > 0 && loin.adventure.titansAccesBoss === 0, "dès qu'un titan est atteignable, plus de bouton fermé");

const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("soreal-idle-titans-ferme-v1") && ui.includes("<b>???</b><small>Vaincs le boss "), "bouton grisé : ??? et le boss à vaincre");
assert.ok(/soreal-idle-titans-ferme-v1" disabled/.test(ui), "il n'ouvre rien");
console.log("idle-bouton-titans-ferme-v1: OK");
