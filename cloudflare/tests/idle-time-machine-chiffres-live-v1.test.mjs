import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-10-03) : « vérifie que ces informations (Comment ton GPS est calculé) soient à jour et qu'elles se mettent à jour avec les changements ».
 * Formules relues sur le wiki « Broken Time Machine » : niveau 0 = barre 1x puis +1 par niveau jusqu'à 50 (50 remplissages par seconde) ; au-delà, +1 au multiplicateur d'Or par niveau ;
 * meilleur boss - 27 (max 274x) ; Or de la machine = meilleur drop d'Or d'Aventure.
 */
const ctx = { bosses: 58 };
const T = 5_000_000;
const etat = normalizeIdleNguState({}, ctx, T);
etat.systems.timeMachine.unlocked = true;
const tm = etat.systems.timeMachine;
tm.data.bestGoldThisRun = 36400;
tm.data.highestBossEver = 58;
const vue0 = idleNguSnapshot(etat, ctx, T).timeMachineView;
assert.equal(vue0.barFillsPerSecond, 1, "niveau 0 : 1 remplissage par seconde");
assert.equal(vue0.highestBossMultiplier, 31, "58 - 27");
assert.equal(vue0.goldPerBarFill, 36400);
assert.equal(vue0.machineSpeedMultiplier, 1);
assert.equal(Math.round(vue0.grossGps), 36400 * 31, "GPS brut = Or x remplissages x multiplicateurs");
tm.data.speedLevel = 49;
assert.equal(idleNguSnapshot(etat, ctx, T).timeMachineView.barFillsPerSecond, 50);
tm.data.speedLevel = 51;
const v51 = idleNguSnapshot(etat, ctx, T).timeMachineView;
assert.equal(v51.barFillsPerSecond, 50, "plafond de 50 remplissages par seconde");
assert.equal(v51.machineSpeedMultiplier, 3, "niveau 51 : multiplicateur 3 (wiki)");

// Mise à jour en place : mêmes éléments, nouveau texte ; un facteur qui apparaît redessine la page.
const els = {};
const mk = (txt) => ({ textContent: txt });
["goldPerBarFill", "barFillsPerSecond", "highestBossMultiplier", "goldMultiplier", "machineSpeedMultiplier", "grossGps", "netGps"].forEach((k) => { els['[data-tm-stat="' + k + '"]'] = mk("old"); });
els['[data-tm-niveau="vitesse"]'] = mk("old");
els['[data-tm-niveau="or"]'] = mk("old");
els[".soreal-idle-tm-v1"] = mk("");
let rafraichi = 0;
const window = {
  __SOREAL_IDLE_META_HOST_V130__: {
    getIdleEtat() { return null; },
    idleHtml_: String,
    idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
    idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)),
    formatGrandNombreIdleV70_: (v) => "#" + v,
    rafraichirMenuRacineIdleV28_() { rafraichi += 1; }
  },
  __SOREAL_IDLE_TEXT_HELPERS_V1__: { libelleRessource: String },
  __SOREAL_IDLE_TEXT_TRANSFORMS_V1__: { attr: String }
};
const document = { getElementById() { return null; }, querySelector: (q) => els[q] || null, querySelectorAll: () => [] };
vm.runInNewContext(readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8"), { window, document });
const maj = window.__patcherChiffresTimeMachineIdleV1__;
assert.equal(typeof maj, "function");
const j = { systemes: idleNguSnapshot(etat, ctx, T) };
maj(j);
assert.equal(els['[data-tm-stat="grossGps"]'].textContent, "#" + v51.grossGps);
assert.equal(els['[data-tm-stat="machineSpeedMultiplier"]'].textContent, "#3");
assert.equal(els['[data-tm-stat="highestBossMultiplier"]'].textContent, "#31");
assert.equal(els['[data-tm-niveau="vitesse"]'].textContent, "#51", "niveau de vitesse mis à jour");
assert.equal(rafraichi, 0, "aucun redessin tant que la liste des facteurs ne change pas");
// Un bonus de Barbe apparaît (facteur jusque-là sans effet, donc absent de la page) : la page est redessinée une fois.
j.systemes.timeMachineView.beardMultiplier = 1.5;
maj(j);
assert.equal(rafraichi, 1, "un nouveau facteur actif redessine la page");
console.log("idle-time-machine-chiffres-live-v1 OK");
