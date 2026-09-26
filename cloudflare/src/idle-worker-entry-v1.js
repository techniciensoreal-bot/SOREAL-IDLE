export { SorealIdleCoordinatorV1 } from "./index-idle-coordinator-v1.js";
import { traiterRequeteIdleMedia } from "./idle-media-v1.js";

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
    sessionEndpoint: url.origin + "/api/v1/session",
    callEndpoint: url.origin + "/api/v1/call"
  });
}

function idleBearerV1(request) {
  const raw = String(request.headers.get("authorization") || "").trim();
  const match = /^Bearer\s+(.+)$/i.exec(raw);
  return match ? String(match[1] || "").trim() : "";
}

async function idleCoordinatorFetchV1(env, path, init = {}) {
  if (!env?.SOREAL_IDLE) {
    return idleJsonV1({ ok: false, error: "IDLE_COORDINATOR_UNAVAILABLE" }, 503);
  }
  const id = env.SOREAL_IDLE.idFromName("global");
  const stub = env.SOREAL_IDLE.get(id);
  const headers = new Headers(init.headers || {});
  if (init.body != null && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return stub.fetch(new Request(
    new URL(path, "https://soreal-idle.invalid"),
    { method: init.method || "GET", headers, body: init.body }
  ));
}

async function idleSessionV1(request, env) {
  const body = await request.json().catch(() => null);
  const ticket = String(body?.ticket || "").trim();
  if (!ticket) {
    return idleJsonV1({ ok: false, error: "LAUNCH_TICKET_REQUIRED" }, 400);
  }
  return idleCoordinatorFetchV1(env, "/__soreal-idle-v1/launch-ticket-consume", {
    method: "POST",
    body: JSON.stringify({ ticket })
  });
}

async function idleCallV1(request, env) {
  const body = await request.json().catch(() => null);
  const operation = String(body?.operation || "").trim();
  const args = Array.isArray(body?.args) ? body.args : [];

  if (!operation) {
    return idleJsonV1({ ok: false, error: "IDLE_OPERATION_REQUIRED" }, 400);
  }

  /*
   * Audit 2026-09-23 (second passage) : cette route acceptait aussi un
   * repli "clé interne" (x-soreal-idle-internal-key, même secret que le
   * proxy avatar/debug-list) qui faisait confiance à un `user.email`
   * fourni tel quel par l'appelant -- aucune preuve de session, juste une
   * égalité de chaîne plus loin (reinitialiserTousLesComptesSorealIdle
   * comparait `acces.emailAutorise==='technicien.soreal@gmail.com'`).
   * Recherche exhaustive (TV, APP, IDLE) : AUCUN appelant légitime --
   * TV/APP appellent le Durable Object directement via le binding
   * cross-script (jamais joignable depuis l'internet), jamais cette
   * route HTTP publique avec cet en-tête. Retiré entièrement plutôt que
   * durci : la seule protection restante est le jeton de session normal
   * ci-dessous, émis par le mécanisme de ticket à usage unique déjà
   * vérifié solide par cet audit (idle-standalone-session.test.mjs).
   */
  const sessionToken = idleBearerV1(request);
  if (!sessionToken) {
    return idleJsonV1({ ok: false, code: "LAUNCH_TICKET_REQUIRED" }, 401);
  }

  const reponse = await idleCoordinatorFetchV1(env, "/__soreal-idle-v1/session-call", {
    method: "POST",
    body: JSON.stringify({ sessionToken, operation, args })
  });
  if (operation === "signalerBugSorealIdle") return idleBugMailV1(reponse, env, sessionToken);
  return reponse;
}

/*
 * Signalement de bug (2026-09-26, Norman) : le mail « Soreal IDLE Bug signalé » part vers la passerelle Apps Script (integrations/idle-bug-mail/Code.gs)
 * dont l'adresse est le secret SOREAL_IDLE_BUG_MAIL_URL (secret optionnel SOREAL_IDLE_BUG_MAIL_SECRET). Le signalement est de toute façon enregistré
 * par le moteur ; sans secret configuré, ou si l'envoi échoue, le joueur voit « enregistré » et l'administrateur le retrouve dans Settings.
 * `rapport` (adresse e-mail comprise) n'est jamais renvoyé au navigateur.
 */
export const IDLE_BUG_MAIL_OBJET_V1 = "Soreal IDLE Bug signal\u00e9";
export async function idleBugMailV1(reponse, env, sessionToken, fetchFn = fetch) {
  const data = await reponse.clone().json().catch(() => null);
  if (!reponse.ok || !data || !data.ok || !data.rapport) return reponse;
  const rapport = data.rapport;
  delete data.rapport;
  data.mailEnvoye = false;
  const url = String(env?.SOREAL_IDLE_BUG_MAIL_URL || "").trim();
  if (url) {
    try {
      const ctrl = new AbortController();
      const minuteur = setTimeout(() => ctrl.abort(), 9000);
      const r = await fetchFn(url, {
        method: "POST",
        headers: { "content-type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret: String(env?.SOREAL_IDLE_BUG_MAIL_SECRET || ""), subject: IDLE_BUG_MAIL_OBJET_V1, rapport }),
        signal: ctrl.signal
      });
      clearTimeout(minuteur);
      const j = await r.json().catch(() => null);
      data.mailEnvoye = Boolean(r.ok && j && j.ok);
    } catch (_) {
      data.mailEnvoye = false;
    }
    /* Statut du mail, gardé avec le signalement (échec sans importance : le signalement est déjà enregistré). */
    try {
      await idleCoordinatorFetchV1(env, "/__soreal-idle-v1/session-call", {
        method: "POST",
        body: JSON.stringify({ sessionToken, operation: "marquerBugMailSorealIdle", args: [data.id, data.mailEnvoye ? "envoy\u00e9" : "\u00e9chec"] })
      });
    } catch (_) { /* ignoré */ }
  }
  return idleJsonV1(data);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const mediaResponse = await traiterRequeteIdleMedia(request, env);
    if (mediaResponse) return mediaResponse;


    if (request.method === "GET" && url.pathname === "/api/v1/bootstrap") {
      return idleBootstrapV1(request);
    }

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      if (!env?.ASSETS) return new Response("SOREAL Idle UI indisponible", { status: 503 });
      const asset = await env.ASSETS.fetch(
        new Request(new URL("/index.html", request.url), request)
      );
      const headers = new Headers(asset.headers);
      /*
       * Le shell standalone doit toujours revalider : les scripts internes
       * sont versionnés par query string, mais un index.html figé en cache
       * empêcherait justement le navigateur/WebView de voir ces nouvelles
       * URLs après un déploiement.
       */
      headers.set("cache-control", "no-cache, no-store, must-revalidate");
      headers.set("pragma", "no-cache");
      headers.set("expires", "0");
      /*
       * 2026-09-23 (audit, suite) : frame-ancestors est IGNORÉ par les
       * navigateurs quand livré via <meta http-equiv="Content-Security-
       * Policy">, confirmé en direct (erreur console après le premier
       * correctif, qui ne posait la CSP que par meta) -- seul un vrai
       * en-tête HTTP le fait respecter. object-src/base-uri restent
       * aussi dans le <meta> (harmless, défense en profondeur), mais
       * frame-ancestors ne peut être appliqué que depuis ici.
       *
       * 2026-09-23 (second audit) : 'self' seul aurait cassé l'intégration
       * légitime de ce frontend en iframe cross-origin depuis TV
       * (TV_78_JS_Fallback_Continued.html) et APP (Soreal_App_html.html,
       * soreal-idle-module.html) dès que le bug de cache Cloudflare
       * ci-dessous (en-tête qui n'atteint pas encore les vrais clients)
       * serait résolu -- silencieusement, sans erreur applicative visible.
       * Origines de production listées explicitement.
       */
      headers.set(
        "content-security-policy",
        "object-src 'none'; base-uri 'self'; frame-ancestors 'self' https://soreal-tv.technicien-soreal.workers.dev https://soreal-app.technicien-soreal.workers.dev"
      );
      return new Response(asset.body, {
        status: asset.status,
        statusText: asset.statusText,
        headers
      });
    }

    if (request.method === "POST" && url.pathname === "/api/v1/session") {
      return idleSessionV1(request, env);
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
