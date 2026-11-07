import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-07) : « quand je mets de la magie dans la time machine, la barre d'énergie fait un recul ». Cause : le recalcul local d'une allocation de Magie rebasait les DEUX pistes (secondes et ETA) mais pas leur fraction
 * (`speedFill`, `speedFraction` gardaient la valeur de la dernière synchro, jusqu'à 4 s de retard) ; le patch des barres repeignait ensuite la barre d'Énergie avec cette fraction périmée. Le moteur, lui, ne touche pas à la piste
 * d'Énergie quand on alloue de la Magie (vérifié sur la partie de référence). Garde : après un rebasage, la fraction de CHAQUE piste égale progression / durée à l'instant présent.
 */
const src = fs.readFileSync("cloudflare/public/modules/augmentations-page-v1.js", "utf8");
const a = src.indexOf("function rebaserVueTimeMachineIdleV1_("), b = src.indexOf("function recalculerTimeMachineLocalIdleV1_(");
assert.ok(a > 0 && b > a);
const MAINTENANT = 1_000_000_000_000;
const ctx = { Date: { now: () => MAINTENANT }, window: {}, Number, Math, Infinity };
const rebaser = new Function("Date", "window", "reperePosterVueTimeMachineIdleV1_", "systemeMetaParIdIdleV130_", src.slice(a, b) + "\nreturn rebaserVueTimeMachineIdleV1_;")(ctx.Date, ctx.window, () => {}, () => null);
const vue = { __at: MAINTENANT - 4000, speedEtaSeconds: 10, speedProgressSeconds: 10, speedFill: 0.5, speedFraction: 0.5, goldEtaSeconds: null, goldProgressSeconds: 0, goldFill: 0, goldFraction: 0 };
rebaser({ systemes: { currencies: {} } }, vue);
assert.ok(Math.abs(vue.speedFill - 0.7) < 1e-9, "fraction de la piste d'Énergie rebasée : " + vue.speedFill);
assert.equal(vue.speedFraction, vue.speedFill);
assert.ok(Math.abs(vue.speedEtaSeconds - 6) < 1e-9, "ETA rebasée");
assert.equal(vue.goldFill, 0, "piste sans ressource (ETA nulle) : inchangée");
console.log("idle-tm-recul-magie-barre-energie-v1: OK");
