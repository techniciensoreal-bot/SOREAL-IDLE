export { SorealIdleCoordinatorV1 } from "./index-idle-coordinator-v1.js";

/*
 * Ce Worker n'est jamais appelé directement par un navigateur — seul le
 * binding Durable Object cross-script depuis "soreal-tv"/"soreal-app"
 * (SOREAL_IDLE) l'atteint. Aucune route publique stable n'est nécessaire
 * ici, hors le cron ci-dessous.
 *
 * Keep-warm (2026-09-18, Norman : "le menu Paramètres est lent") — mesuré
 * en direct : le coût n'est jamais dans le code du moteur (chaque étape
 * interne de runSorealIdleOperation mesure 0ms une fois l'isolate chaud),
 * c'est le temps de compilation à froid du bundle (~24 000 lignes : moteur
 * IDLE + progression NGU + Aventure) que Cloudflare repaie dès que le
 * Durable Object reste inactif un moment. Un cron toutes les 5 minutes
 * (Norman a explicitement refusé la résolution minimale de Cloudflare —
 * 1 minute — par prudence sur l'accumulation si d'autres domaines
 * ajoutent un jour leur propre keep-warm) réveille l'objet via sa route
 * la plus légère (/__soreal-idle-v1/counts — 3 COUNT() sans reconstruire
 * tout le catalogue), pour couvrir le vrai cas d'usage (revenir sur le
 * jeu après une vraie pause) sans viser les micro-pauses de quelques
 * secondes.
 */
async function pingSorealIdleV1(env) {
  if (!env?.SOREAL_IDLE) return;
  try {
    const id = env.SOREAL_IDLE.idFromName("global");
    const stub = env.SOREAL_IDLE.get(id);
    await stub.fetch(new Request("https://soreal-idle.invalid/__soreal-idle-v1/counts"));
  } catch (_) {
    // Un échec de keep-warm ne doit jamais faire tomber le cron en erreur visible —
    // le prochain tick réessaiera une minute plus tard.
  }
}

export default {
  async fetch() {
    return new Response("SOREAL Idle Worker", { status: 404 });
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(pingSorealIdleV1(env));
  }
};
