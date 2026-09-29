import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-09-27) : « Parfois, je meurs en mode aventure et dans le journal de combat, ma mort n'apparaît
 * pas. » Diagnostic original : le combat automatique d'Aventure se résout entièrement côté serveur, y compris les
 * défaites -- jamais via terminerCombatAdventureLocalV2_ (client), le SEUL endroit qui alimentait le journal avant
 * ce correctif.
 *
 * Correctif 2026-09-29 (suite à « Je ne loot pas en étant hors ligne ») : la source de ce champ a changé. L'ancien
 * progression.autoAventureHorsLigne (simulateur LEGACY, idle-sqlite-runtime.js) ne s'exécutait en réalité jamais
 * (déclencheur statsAuto.autoAventure/autoAventureZone jamais mis à vrai nulle part, confirmé par grep exhaustif).
 * Remplacé par autoFarmAventureEtat, alimenté par le VRAI simulateur (advanceAdventureZoneAutoFarmOfflineV1,
 * idle-adventure-v47.js) via metaNguEtat.adventure.lastAutoFarmSummaryV1 -- voir le commentaire dans
 * construireEtatJoueurSorealIdle_ juste avant "const autoFarmAventureEtat =". La forme du champ CLIENT
 * (combats/victoires/defaites/derniereDefaite) reste inchangée : verifierDefaiteAutoAventureIdleV1_ (déjà testé
 * ci-dessous) n'a donc eu besoin d'aucune modification, seule sa source de données a changé.
 */
const runtime = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

// --- Le champ n'est plus jeté : il est bien construit à partir du VRAI résumé de farm (autoFarmAventureEtat), avec repli null. ---
{
  const i = runtime.indexOf("autoAventureHorsLigne:\n      autoFarmAventureEtat");
  assert.ok(i > 0, "le champ autoAventureHorsLigne doit être construit dans construireEtatJoueurSorealIdle_ à partir du vrai résumé de farm (autoFarmAventureEtat)");
  const bloc = runtime.slice(i, runtime.indexOf("syncSecondes:", i));
  assert.match(bloc, /defaites:Math\.max\(0,combats-victoires\)/, "les défaites sont dérivées (combats-victoires), jamais un compteur séparé oublié par le simulateur");
  assert.match(bloc, /:\s*null,/, "repli null quand aucun farm n'a eu lieu ce sync (aucun kill, aucune défaite)");
}

// --- Dérivation isolée (kills/derniereDefaite -> combats/victoires/defaites), rejouée dans un sandbox pour couvrir les cas limites. ---
{
  const debut = runtime.indexOf("(function(a){", runtime.indexOf("autoAventureHorsLigne:\n      autoFarmAventureEtat"));
  const finAppel = runtime.indexOf("(autoFarmAventureEtat)", debut);
  assert.ok(debut > 0 && finAppel > debut, "fonction de dérivation introuvable");
  // De "(function(a){" (sans la parenthèse d'appel immédiat) jusqu'à la fermeture "})" juste avant l'appel.
  const fonctionSeule = runtime.slice(debut + 1, runtime.lastIndexOf("})", finAppel) + 1);

  function nombreSorealIdle_(v, defaut) {
    const n = Number(v);
    return Number.isFinite(n) ? n : defaut;
  }
  const sandbox = { nombreSorealIdle_ };
  const fnVm = vm.runInNewContext("(" + fonctionSeule + ")", sandbox);
  // fnVm() renvoie un objet d'un autre "realm" (vm) : on le rapporte en JSON plutôt qu'en deepStrictEqual
  // (qui compare aussi le prototype, différent entre realms, même à propriétés égales).
  const fn = (a) => JSON.parse(JSON.stringify(fnVm(a)));

  assert.deepEqual(fn({ kills: 5 }), { combats: 5, victoires: 5, defaites: 0, derniereDefaite: null }, "5 victoires, aucune défaite en cours de lot -> 0 défaite");
  assert.deepEqual(fn({ kills: 0 }), { combats: 0, victoires: 0, defaites: 0, derniereDefaite: null }, "aucun kill -> tout à 0");
  assert.deepEqual(fn({}), { combats: 0, victoires: 0, defaites: 0, derniereDefaite: null }, "objet incomplet -> jamais NaN grâce à nombreSorealIdle_");

  // --- derniereDefaite (monstre/zone/ko) : propagée telle quelle, et compte pour +1 combat (le combat perdu qui a arrêté le farm). ---
  assert.deepEqual(
    fn({ kills: 2, derniereDefaite: { monstre: "Gluant", zone: "Forêt", boss: false, ko: true } }),
    { combats: 3, victoires: 2, defaites: 1, derniereDefaite: { monstre: "Gluant", zone: "Forêt", boss: false, ko: true } },
    "le récit de la dernière défaite (monstre/zone/ko) doit être propagé au client, et compter comme le combat perdu"
  );
  assert.deepEqual(
    fn({ kills: 0, derniereDefaite: { monstre: "Skeleton", zone: "Zone Tutoriel", boss: false, ko: true } }),
    { combats: 1, victoires: 0, defaites: 1, derniereDefaite: { monstre: "Skeleton", zone: "Zone Tutoriel", boss: false, ko: true } },
    "mort dès le premier combat (0 victoire) : 1 combat, 1 défaite"
  );
}

console.log("idle-adventure-auto-defeat-log-v1: OK");
