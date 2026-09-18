import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Perf (2026-09-18, Norman : "le menu Paramètres est lent") — mesuré en
 * direct : le coût n'est jamais dans le code (chaque étape interne de
 * runSorealIdleOperation mesure 0ms sur un isolate chaud), c'est le temps
 * de compilation à froid du bundle (~24 000 lignes) que Cloudflare repaie
 * dès que le Durable Object reste inactif. Ce test verrouille le cron de
 * keep-warm : sans lui, un joueur qui revient après une pause repaie ce
 * coût lui-même à chaque fois.
 */
const wranglerRaw = readFileSync("wrangler.jsonc", "utf8").replace(/\/\/.*$/gm, "");
const wrangler = JSON.parse(wranglerRaw);

assert.ok(
  Array.isArray(wrangler?.triggers?.crons) && wrangler.triggers.crons.includes("*/5 * * * *"),
  "wrangler.jsonc doit déclarer un cron toutes les 5 minutes pour garder le Durable Object éveillé — Norman a explicitement refusé " +
  "la résolution minimale de Cloudflare (chaque minute) par prudence sur l'accumulation si d'autres domaines ajoutent un jour leur " +
  "propre keep-warm ; ne jamais resserrer cet intervalle sans reconfirmer avec lui."
);

const entrySource = readFileSync("cloudflare/src/idle-worker-entry-v1.js", "utf8");

assert.ok(
  entrySource.includes("async scheduled(_event, env, ctx)"),
  "Le point d'entrée du Worker doit exporter un handler scheduled() pour le cron keep-warm."
);
assert.ok(
  entrySource.includes('ctx.waitUntil(pingSorealIdleV1(env));'),
  "Le handler scheduled() doit déléguer le ping au Durable Object via ctx.waitUntil (jamais bloquer le cron dessus)."
);
assert.ok(
  entrySource.includes('/__soreal-idle-v1/counts"'),
  "Le ping doit cibler la route la plus légère (counts — 3 COUNT() sans reconstruire le catalogue), jamais une opération de jeu réelle."
);
assert.ok(
  entrySource.includes("if (!env?.SOREAL_IDLE) return;") &&
  entrySource.includes("catch (_) {"),
  "Le ping doit échouer silencieusement (jamais faire planter le cron) — le prochain tick réessaiera une minute plus tard."
);

console.log("idle-keep-warm-cron: OK");
