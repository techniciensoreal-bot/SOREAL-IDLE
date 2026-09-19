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

function idleJsonV1(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

/*
 * 2026-09-19 — première brique de l'isolation complète de SOREAL Idle.
 *
 * APP/TV ne doivent à terme fournir qu'un bouton de lancement. Le Worker
 * Idle expose donc désormais ses propres routes publiques de bootstrap.
 * Elles ne donnent encore aucun accès à un compte joueur : l'identité sera
 * transmise par un ticket de lancement signé et consommable une seule fois.
 * Tant que ce ticket n'est pas câblé, /api/v1/session refuse explicitement
 * l'accès au lieu de retomber silencieusement sur l'ancien bridge APP/TV.
 */
function idleBootstrapV1(request) {
  const url = new URL(request.url);
  return idleJsonV1({
    ok: true,
    service: "soreal-idle",
    standalone: true,
    protocol: 1,
    sessionEndpoint: url.origin + "/api/v1/session"
  });
}

async function idleCallV1(request, env) {
  if (!env?.SOREAL_IDLE) {
    return idleJsonV1({ ok: false, error: "IDLE_COORDINATOR_UNAVAILABLE" }, 503);
  }

  const body = await request.json().catch(() => null);
  const operation = String(body?.operation || "").trim();
  const args = Array.isArray(body?.args) ? body.args : [];
  const user = body?.user && typeof body.user === "object" ? body.user : null;

  if (!operation) {
    return idleJsonV1({ ok: false, error: "IDLE_OPERATION_REQUIRED" }, 400);
  }

  /*
   * Route autonome vers le Durable Object IDLE. L'authentification publique
   * reste volontairement fermée tant que le ticket signé APP/TV n'est pas
   * consommé ici. Le header interne permet aux tests/liaisons Worker de
   * préparer la migration sans exposer un compte joueur sur Internet.
   */
  const internalKey = String(env.SOREAL_IDLE_INTERNAL_KEY || "");
  const suppliedKey = String(request.headers.get("x-soreal-idle-internal-key") || "");
  if (!internalKey || suppliedKey !== internalKey) {
    return idleJsonV1({ ok: false, code: "LAUNCH_TICKET_REQUIRED" }, 401);
  }

  const id = env.SOREAL_IDLE.idFromName("global");
  const stub = env.SOREAL_IDLE.get(id);
  const target = new URL("/__soreal-idle-v1/call", request.url);
  return stub.fetch(new Request(target, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ operation, args, user })
  }));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/v1/bootstrap") {
      return idleBootstrapV1(request);
    }

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      if (!env?.ASSETS) return new Response("SOREAL Idle UI indisponible", { status: 503 });
      return env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
    }

    if (request.method === "POST" && url.pathname === "/api/v1/session") {
      return idleJsonV1({
        ok: false,
        code: "LAUNCH_TICKET_REQUIRED",
        message: "SOREAL Idle attend un ticket de lancement signe par SOREAL."
      }, 401);
    }

    if (request.method === "POST" && url.pathname === "/api/v1/call") {
      return idleCallV1(request, env);
    }

    return new Response("SOREAL Idle Worker", { status: 404 });
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(pingSorealIdleV1(env));
  }
};
