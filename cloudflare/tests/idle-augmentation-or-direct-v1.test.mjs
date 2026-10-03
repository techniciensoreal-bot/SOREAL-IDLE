import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-03) : « sans Or la barre avance plusieurs niveaux avant de dire ce qui manque ; avec assez d'Or elle n'avance plus ».
 * Le jugement « il manque de l'Or » se fait avec l'Or EN DIRECT (pas celui du dernier rendu) ; une barre arrivée au bout reste pleine ; si l'Or suffit,
 * une resynchronisation puis un nouveau rendu de la page repartent de l'état du serveur.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("const orLive=idleNombre_(idleEtat.systemes&&idleEtat.systemes.currencies&&idleEtat.systemes.currencies.gold);"));
assert.ok(ui.includes("const pleineAug=seconds>0.0201&&(idleNombre_(x[1])*seconds+ecouleAug>=seconds-1e-9);"), "la barre arrivée au bout est détectée côté client");
assert.ok(ui.includes("const attenteOr=Boolean(x[3]||pleineAug)&&manqueOr;") && ui.includes("const attenteServeur=Boolean(x[3]||pleineAug)&&!manqueOr&&seconds>0;"));
assert.ok(ui.includes("Date.now()-idleAugSyncV1>3000") && ui.includes("rafraichirMenuRacineIdleV28_();"), "resynchronisation anti-rafale puis nouveau rendu");
console.log("idle-augmentation-or-direct-v1: OK");
