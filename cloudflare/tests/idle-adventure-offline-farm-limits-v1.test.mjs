import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-29) : « Je veux qu'on puisse farmer le mode aventure tout
 * en étant hors ligne avec quelques contraintes. 8h maximum de farming hors
 * ligne. Et jamais plus de 70% des cases de l'inventaire. Il faut toujours
 * une place disponible pour les loots titans etc. » + « le combat doit être
 * calculé comme s'il avait eu lieu. Donc le joueur doit pouvoir être mort
 * aussi si la rencontre l'a tué. Il devra pouvoir lire dans le journal de
 * combat la manière dont il est mort. »
 *
 * Le simulateur de combat auto (dans appliquerProgressionEnergieSorealIdle_)
 * est une boucle de ~1700 lignes dépendant du schéma complet d'une ligne
 * JOUEURS -- l'exercer de bout en bout dépasse ce qu'un test unitaire
 * raisonnable doit simuler (même principe que idle-adventure-auto-defeat-
 * log-v1.test.mjs). On vérifie donc directement, à la source, que les 3
 * contraintes sont câblées au bon endroit.
 */
const runtime = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

// --- Plafond de 8h, local au bloc Aventure AUTO, jamais partagé avec l'énergie/les autres systèmes ---
{
  const debutBloc = runtime.indexOf("statsAuto.autoAventureZone > 0");
  const finBloc = runtime.indexOf("\n  if (\n    combatsAutoHorsLigne > 0\n  ) {", debutBloc);
  assert.ok(debutBloc > 0 && finBloc > debutBloc, "bloc Aventure AUTO introuvable");
  const bloc = runtime.slice(debutBloc, finBloc);

  assert.match(
    bloc,
    /const ecoulePrisEnCompteAventureAuto =\s*Math\.min\(\s*ecoulePrisEnCompte,\s*8 \* 60 \* 60\s*\);/,
    "le temps pris en compte pour le farm Aventure doit être plafonné localement à 8h"
  );
  assert.match(
    bloc,
    /Math\.floor\(\s*ecoulePrisEnCompteAventureAuto \/\s*intervalle\s*\)/,
    "le nombre de créneaux disponibles doit utiliser le temps PLAFONNÉ à 8h, pas le temps hors ligne général"
  );
  assert.match(
    bloc,
    /const totalAutoMs =\s*ecoulePrisEnCompteAventureAuto \*\s*1000;/,
    "la chronologie simulée doit elle aussi utiliser le temps plafonné à 8h"
  );
}

// --- Plafond de 70% de l'inventaire pour CE farm uniquement (jamais pour un loot en ligne normal) ---
{
  assert.match(
    runtime,
    /const capaciteSacFarmHorsLigneV1 =\s*Math\.floor\(\s*capaciteSac \* 0\.7\s*\);/,
    "70% de la capacité du sac doit être calculé comme plafond dédié au farm hors ligne"
  );
  const i = runtime.indexOf("nombreObjetsSacSorealIdle_(\n            inventaire,\n            equipement\n          ) <\n          capaciteSacFarmHorsLigneV1");
  assert.ok(i > 0, "le loot du farm hors ligne doit être bloqué par le plafond à 70%, pas par la capacité totale (capaciteSac)");
}

// --- Le joueur peut réellement mourir : la défaite (monstre/zone/ko) est capturée AVANT l'arrêt de la boucle ---
{
  const i = runtime.indexOf("derniereDefaiteAuto = {");
  assert.ok(i > 0, "la dernière défaite doit être capturée (monstre/zone/boss/ko)");
  const captureBlock = runtime.slice(i, runtime.indexOf("break;", i));
  assert.match(captureBlock, /monstre:\s*String\(\s*\(monstreAuto && monstreAuto\.nom\) \|\| ''\s*\)/, "le nom du monstre qui a tué le joueur doit être capturé");
  assert.match(captureBlock, /zone:\s*String\(\s*\(zoneAuto && zoneAuto\.nom\) \|\| ''\s*\)/, "la zone où le joueur est mort doit être capturée");
  assert.match(captureBlock, /ko: tempsKoAuto <= tempsLimiteAuto/, "distingue un vrai K.O. d'un simple abandon faute de temps");

  // Propagé jusqu'au premier objet retourné par le simulateur.
  assert.match(runtime, /derniereDefaite:\s*derniereDefaiteAuto\s*\n\s*}\s*\n\s*};\s*\n}/, "derniereDefaiteAuto doit être exposé dans autoAventureHorsLigne");

  // Et jusqu'au reformatage client (construireEtatJoueurSorealIdle_).
  const reformatageStart = runtime.indexOf("autoAventureHorsLigne:\n      progression && progression.autoAventureHorsLigne");
  assert.ok(reformatageStart > 0);
  const reformatage = runtime.slice(reformatageStart, runtime.indexOf("syncSecondes:", reformatageStart));
  assert.match(reformatage, /d\.monstre/);
  assert.match(reformatage, /d\.zone/);
  assert.match(reformatage, /d\.ko/);
}

// --- Client : le journal de combat raconte la manière dont le joueur est mort, avec le monstre et la zone ---
{
  const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
  const debut = ui.indexOf("let idleDerniereSyncAutoDefaiteAventureV1_=0;");
  const fin = ui.indexOf("function rendreLigneJournalAventureIdleV1_", debut);
  const bloc = ui.slice(debut, fin);

  assert.match(bloc, /const d=infos&&infos\.derniereDefaite;/);
  assert.match(bloc, /d\.ko/, "le message doit distinguer K.O. réel et abandon faute de temps");
  assert.match(bloc, /💀 Tu as été mis K\.O\. par /, "le récit doit nommer ce qui a tué le joueur, pas un message générique");
  assert.match(bloc, /\[d\.monstre,d\.zone\]\.filter\(Boolean\)\.join/, "monstre et zone doivent apparaître dans le récit");
}

console.log("idle-adventure-offline-farm-limits-v1: OK");
