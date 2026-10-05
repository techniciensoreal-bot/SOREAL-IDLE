import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-05) : « le menu Augmentations fait des rollback pour s'accorder avec le serveur ».
 * 1. la réponse de synchro devient directement le repère des barres (plus de redessin différé 1,5 s après) ;
 * 2. rebaser le repère REJOUE les niveaux terminés (niveau, coût, Or) au lieu de les effacer par un modulo.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");

assert.ok(ui.includes("window.__adopterRepereAugmentsIdleV1__(idleEtat)"), "la synchro adopte le repère");
assert.ok(!/data-menu'\)==='augmentations'&&idleEtat\)rafraichirMenuRacineIdleV28_/.test(ui), "plus de redessin différé des Augments");
assert.ok(meta.includes('id="sorealIdleAugMultV1"'), "le multiplicateur total se met à jour sans redessin");

const debut = meta.indexOf("      function rejouerCyclesAugmentIdleV1_(p){");
const fin = meta.indexOf("      function ajusterAugmentIdleV1_");
assert.ok(debut > 0 && fin > debut);
const etat = { systemes: { currencies: { gold: 1000 } } };
const t0 = 1_000_000;
let maintenant = t0;
const ctx = {
  performance: { now: () => maintenant },
  window: { __SOREAL_IDLE_META_HOST_V130__: {
    getIdleEtat: () => etat,
    idleEntier_: (v) => Math.floor(Number(v) || 0),
    idleNombre_: (v) => Number(v) || 0
  } }
};
const rebaser = vm.runInNewContext("(function(){" + meta.slice(debut, fin) + "\nreturn rebaserVisuelAugmentsIdleV1_;})()", ctx);

// Augment niveau 4 : 10 s au premier niveau, donc 50 s pour le niveau 4 -> 5 ? Ici : durée du prochain niveau = 10 s, coût 100 Or, barre à 50 %.
const visual = { at: t0, defs: { scissors: { progress: 0.5, seconds: 10, waiting: false, level: 4, goldCost: 100, upgradeProgress: 0, upgradeSeconds: 0, upgradeWaiting: false, upgradeLevel: 0, upgradeGoldCost: 0 } } };
maintenant = t0 + 5000 + 6000 * 1000 / 1000; // +11 s : 5 s finissent le niveau en cours, 6 s entament le suivant (durée 12 s)
rebaser(visual);
const d = visual.defs.scissors;
assert.equal(d.level, 5, "le niveau terminé est compté (il n'était pas effacé par un modulo)");
assert.equal(etat.systemes.currencies.gold, 900, "son coût est débité de l'Or local");
assert.equal(d.goldCost, 120, "coût du niveau suivant (niveau 6 : 100 x 6/5)");
assert.ok(Math.abs(d.seconds - 12) < 1e-9, "durée du niveau suivant");
assert.ok(Math.abs(d.progress - 6 / 12) < 1e-9, "la barre est à sa vraie place");
assert.equal(visual.at, maintenant);
// un second rebasage immédiat ne débite rien de plus
rebaser(visual);
assert.equal(etat.systemes.currencies.gold, 900);
assert.equal(visual.defs.scissors.level, 5);

// Pas assez d'Or : la barre reste pleine (>= 100 %), aucun niveau, aucun débit.
etat.systemes.currencies.gold = 10;
const v2 = { at: maintenant, defs: { milk: { progress: 0.9, seconds: 10, waiting: false, level: 0, goldCost: 50, upgradeProgress: 0, upgradeSeconds: 0, upgradeWaiting: false, upgradeLevel: 0, upgradeGoldCost: 0 } } };
maintenant += 5000;
rebaser(v2);
assert.equal(v2.defs.milk.level, 0);
assert.equal(etat.systemes.currencies.gold, 10);
assert.ok(v2.defs.milk.progress >= 1, "barre pleine faute d'Or");
console.log("idle-augmentation-repere-sans-redessin-v1: OK");

// Recalage de phase : la barre (animation du navigateur) se cale sur le repère dès que l'écart dépasse 80 ms ou 5 % du cycle.
assert.ok(ui.includes("if(Math.abs(ecart)>Math.max(80,duration*0.05))anim.currentTime=cible;"), "recalage de phase de la barre");
// Le niveau affiché ne recule pas d'un cran à l'arrivée du serveur (écart infime).
assert.ok(ui.includes("nivEl.__idleNivAfficheV1"), "niveau affiché monotone");
