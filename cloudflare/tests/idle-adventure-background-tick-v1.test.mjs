import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « Le mode aventure doit continuer à farmer des objets quand l'application est en fond. »
 *
 * Diagnostic (vérifié en lisant le code, et sur le wiki NGU Idle avant de construire quoi que ce soit -- Règle
 * n°1) : le tick de jeu local (mettreAJourJeuIdleLocalV7_, qui fait avancer le combat auto d'Aventure via
 * progresserZoneFightLocalIdleV1_) tournait UNIQUEMENT sur requestAnimationFrame -- entièrement SUSPENDU par le
 * navigateur dès que l'onglet devient invisible (garanti par la spec, jamais un simple ralentissement). La
 * session reste pourtant bien active (l'app tourne toujours, juste cachée) : ce n'est PAS le cas "hors ligne"
 * (app fermée) documenté sur le wiki NGU Idle (Adventure Mode : « AutoKill works offline, but no items drop
 * while you are offline ») -- ici on ne s'écarte donc pas du jeu original, on corrige un tick qui s'arrêtait à
 * tort alors qu'il devrait continuer comme si l'onglet était visible.
 *
 * Correctif : un setInterval (jamais suspendu par le navigateur en arrière-plan, seulement ralenti) prend le
 * relais du MÊME tick, uniquement pendant que document.hidden est vrai -- jamais en double avec rAF quand
 * l'onglet est visible.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// --- La variable de minuteur est déclarée au même endroit que les autres timers du ticker. ---
assert.ok(ui.includes("let idleTimerJeuArrierePlanV1=0;"), "variable de minuteur introuvable");
assert.ok(
  ui.indexOf("let idleAnimationFrameJeuV214=0;\n      let idleTimerJeuArrierePlanV1=0;") > 0,
  "déclarée juste après les autres timers du ticker (idleTimerEnergie/idleAnimationFrameJeuV214)"
);

{
  const debut = ui.indexOf("function demarrerTickerIdle_(){");
  const fin = ui.indexOf("\n      let idleAchatEnCoursV5=false;", debut);
  const fonction = ui.slice(debut, fin);

  assert.ok(
    fonction.includes("if(idleTimerJeuArrierePlanV1){") && fonction.includes("clearInterval(idleTimerJeuArrierePlanV1);"),
    "l'ancien minuteur doit être nettoyé avant d'en reposer un nouveau (jamais deux minuteurs qui s'accumulent)"
  );
  assert.match(
    fonction,
    /idleTimerJeuArrierePlanV1=setInterval\(function\(\)\{\s*\n\s*if\(document\.hidden&&PAGE_ACTIVE==='idle'\)mettreAJourJeuIdleLocalV7_\(\);\s*\n\s*\},1000\);/,
    "le setInterval doit rejouer exactement le même tick (mettreAJourJeuIdleLocalV7_), uniquement onglet caché"
  );
}

// --- Comportement réel de la garde (document.hidden && PAGE_ACTIVE==='idle') isolée et rejouée hors navigateur. ---
{
  const debut = ui.indexOf("idleTimerJeuArrierePlanV1=setInterval(function(){");
  const debutCallback = ui.indexOf("function(){", debut);
  const finCallback = ui.indexOf("},1000);", debutCallback) + "}".length;
  const callbackSrc = ui.slice(debutCallback, finCallback);
  assert.ok(callbackSrc.startsWith("function(){") && callbackSrc.endsWith("}"), "découpe du callback invalide");

  function essayer(hidden, pageActive) {
    let appels = 0;
    const fn = new Function(
      "document", "PAGE_ACTIVE", "mettreAJourJeuIdleLocalV7_",
      "return (" + callbackSrc + ")"
    )({ hidden }, pageActive, function () { appels += 1; });
    fn();
    return appels;
  }

  assert.equal(essayer(true, "idle"), 1, "onglet caché + page idle active -> le tick doit continuer");
  assert.equal(essayer(false, "idle"), 0, "onglet visible -> rAF s'en occupe déjà, jamais de double tick");
  assert.equal(essayer(true, "autre"), 0, "une autre page active (pas le jeu) -> jamais de tick fantôme");
}

// --- mettreAJourJeuIdleLocalV7_ doit rester basé sur un delta de temps réel (Date.now()), jamais un compte de
//     frames -- sinon l'appeler une fois par seconde (au lieu de ~60 fois) fausserait toute la progression. ---
{
  const debut = ui.indexOf("function mettreAJourJeuIdleLocalV7_(){");
  const fin = ui.indexOf("\n      function ", debut + 40);
  const fonction = ui.slice(debut, fin);
  assert.ok(fonction.includes("Date.now()"), "doit calculer un vrai delta de temps, compatible avec un tick plus espacé (setInterval, 1/s)");
}

console.log("idle-adventure-background-tick-v1: OK");
