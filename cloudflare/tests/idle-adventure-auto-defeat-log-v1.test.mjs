import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-09-27) : « Parfois, je meurs en mode aventure et dans le journal de combat, ma mort n'apparaît
 * pas. » Diagnostic : le combat automatique d'Aventure (Beta 3.6, en ligne comme hors ligne) se résout entièrement
 * côté serveur, y compris les défaites -- jamais via terminerCombatAdventureLocalV2_ (client), le SEUL endroit qui
 * alimentait le journal avant ce correctif. progression.autoAventureHorsLigne (combats/victoires) était déjà
 * calculé côté serveur mais jamais renvoyé au client (jeté à chaque appel de construireEtatJoueurSorealIdle_).
 *
 * Le simulateur de combat auto (dans appliquerProgressionEnergieSorealIdle_) est une boucle de ~1700 lignes
 * dépendant du schéma complet d'une ligne JOUEURS (37 colonnes) et des données de zone -- l'exercer de bout en
 * bout de façon fiable (garantir une défaite précise) dépasse ce qu'un test unitaire raisonnable doit simuler.
 * On vérifie donc directement, à la source, que le champ n'est plus jeté et que sa dérivation (defaites) est
 * correcte ; puis, isolément, la même dérivation rejouée dans un sandbox pour couvrir les cas limites.
 */
const runtime = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

// --- Le champ n'est plus jeté : il est bien construit à partir de progression.autoAventureHorsLigne, avec repli null. ---
{
  const i = runtime.indexOf("autoAventureHorsLigne:\n      progression && progression.autoAventureHorsLigne");
  assert.ok(i > 0, "le champ autoAventureHorsLigne doit être construit dans construireEtatJoueurSorealIdle_ à partir de progression");
  const bloc = runtime.slice(i, runtime.indexOf("syncSecondes:", i));
  assert.match(bloc, /defaites:Math\.max\(0,combats-victoires\)/, "les défaites sont dérivées (combats-victoires), jamais un compteur séparé oublié par le simulateur");
  assert.match(bloc, /:\s*null,/, "repli null quand aucune progression n'a été rejouée (plusieurs sites d'appel passent null)");
}

// --- Dérivation isolée (combats/victoires -> defaites), rejouée dans un sandbox pour couvrir les cas limites. ---
{
  const debut = runtime.indexOf("(function(a){", runtime.indexOf("autoAventureHorsLigne:\n      progression && progression.autoAventureHorsLigne"));
  const finAppel = runtime.indexOf("(progression.autoAventureHorsLigne)", debut);
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

  assert.deepEqual(fn({ combats: 5, victoires: 3 }), { combats: 5, victoires: 3, defaites: 2, derniereDefaite: null }, "3 victoires sur 5 combats -> 2 défaites");
  assert.deepEqual(fn({ combats: 4, victoires: 4 }), { combats: 4, victoires: 4, defaites: 0, derniereDefaite: null }, "aucune défaite -> 0, jamais négatif");
  assert.deepEqual(fn({ combats: 0, victoires: 0 }), { combats: 0, victoires: 0, defaites: 0, derniereDefaite: null }, "aucun combat auto -> tout à 0");
  assert.deepEqual(fn({}), { combats: 0, victoires: 0, defaites: 0, derniereDefaite: null }, "objet incomplet -> jamais NaN grâce à nombreSorealIdle_");

  // --- derniereDefaite (monstre/zone/ko) : propagée telle quelle quand fournie par le simulateur. ---
  assert.deepEqual(
    fn({ combats: 3, victoires: 2, derniereDefaite: { monstre: "Gluant", zone: "Forêt", boss: false, ko: true } }),
    { combats: 3, victoires: 2, defaites: 1, derniereDefaite: { monstre: "Gluant", zone: "Forêt", boss: false, ko: true } },
    "le récit de la dernière défaite (monstre/zone/ko) doit être propagé au client"
  );
}

console.log("idle-adventure-auto-defeat-log-v1: OK");
