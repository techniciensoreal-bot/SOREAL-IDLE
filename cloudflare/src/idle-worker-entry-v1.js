export { SorealIdleCoordinatorV1 } from "./index-idle-coordinator-v1.js";
import { traiterRequeteIdleMedia } from "./idle-media-v1.js";
import { verifierJetonGoogleIdleV1 } from "./idle-google-auth-v1.js";

/*
 * Ce Worker a DEUX surfaces (voir AGENTS.md, section « Relation avec SOREAL-APP / SOREAL-TV »). (1) Le chemin public du frontend autonome : le shell
 * (index.html et ses assets), /api/v1/bootstrap, /api/v1/session (ticket de lancement à usage unique), /api/v1/google-login, /api/v1/logout,
 * /api/v1/call (authentifié par jeton de session) et les téléversements d'administration. (2) Le chemin historique par binding Durable Object
 * cross-script depuis « soreal-tv » / « soreal-app » (SOREAL_IDLE), jamais joignable depuis l'internet. Tout autre chemin répond 404. Le cron
 * ci-dessous ne sert qu'à garder le Durable Object chaud.
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
    // le prochain tick réessaiera cinq minutes plus tard.
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
function idleBootstrapV1(request, env) {
  const url = new URL(request.url);
  return idleJsonV1({
    ok: true,
    service: "soreal-idle",
    standalone: true,
    protocol: 1,
    /* Identifiant de la version Cloudflare active (binding CF_VERSION_METADATA, public, sans secret) : permet de vérifier ce qui tourne réellement (audit du 2026-10-10, IDLE-AUDIT-CI-004). Champ AJOUTÉ seulement. */
    version: String(env?.CF_VERSION_METADATA?.id || ""),
    /* Identifiant client Google (public) : vide tant que la connexion Google n'est pas configurée -> le bouton n'est pas proposé. */
    googleClientId: String(env?.GOOGLE_CLIENT_ID || "").trim(),
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

/*
 * Garde-fous des routes publiques (audit du 2026-10-10, IDLE-AUDIT-SEC-007) : un joueur (ou un script) ne doit pas pouvoir saturer le Durable Object unique, qui reconstruit tout le classeur à chaque appel.
 *  - taille du corps plafonnée avant tout parsing JSON ;
 *  - seau à jetons par jeton de session (route d'appel) et par adresse (connexion Google), en mémoire d'isolat : borne un flot, sans gêner la cadence normale du client (synchro 4 à 15 s, actions au clic).
 * La mémoire de limitation est purgée dès qu'elle grossit, jamais sans borne.
 */
const IDLE_CORPS_MAX_OCTETS_V1 = 262144;
const IDLE_LIMITES_V1 = new Map();

function idleLimiteDepasseeV1(cle, capacite, parSeconde, maintenant = Date.now()) {
  if (IDLE_LIMITES_V1.size > 5000) {
    for (const [k, v] of IDLE_LIMITES_V1) if (maintenant - v.t > 60000) IDLE_LIMITES_V1.delete(k);
    if (IDLE_LIMITES_V1.size > 5000) IDLE_LIMITES_V1.clear();
  }
  const e = IDLE_LIMITES_V1.get(cle) || { jetons: capacite, t: maintenant };
  e.jetons = Math.min(capacite, e.jetons + ((maintenant - e.t) / 1000) * parSeconde);
  e.t = maintenant;
  const refuse = e.jetons < 1;
  if (!refuse) e.jetons -= 1;
  IDLE_LIMITES_V1.set(cle, e);
  return refuse;
}

export function idleReinitialiserLimitesV1() {
  IDLE_LIMITES_V1.clear();
}

/* Corps JSON borné : { corps, tropGros }. Un corps absent ou invalide donne corps:null, comme avant. */
async function idleLireJsonBorneV1(request, maxOctets = IDLE_CORPS_MAX_OCTETS_V1) {
  const annonce = Number(request.headers.get("content-length"));
  if (Number.isFinite(annonce) && annonce > maxOctets) return { corps: null, tropGros: true };
  const texte = await request.text().catch(() => "");
  if (texte.length > maxOctets) return { corps: null, tropGros: true };
  try {
    return { corps: JSON.parse(texte), tropGros: false };
  } catch (_e) {
    return { corps: null, tropGros: false };
  }
}

const idleTropDeRequetesV1 = () => idleJsonV1({ ok: false, code: "SOREAL_IDLE_TROP_DE_REQUETES", retryable: true }, 429);
const idleCorpsTropGrosV1 = () => idleJsonV1({ ok: false, code: "SOREAL_IDLE_CORPS_TROP_GROS" }, 413);

async function idleSessionV1(request, env) {
  if (idleLimiteDepasseeV1("ticket:" + String(request.headers.get("cf-connecting-ip") || "inconnue"), 30, 30 / 60)) return idleTropDeRequetesV1();
  const lecture = await idleLireJsonBorneV1(request);
  if (lecture.tropGros) return idleCorpsTropGrosV1();
  const body = lecture.corps;
  const ticket = String(body?.ticket || "").trim();
  if (!ticket) {
    return idleJsonV1({ ok: false, error: "LAUNCH_TICKET_REQUIRED" }, 400);
  }
  return idleCoordinatorFetchV1(env, "/__soreal-idle-v1/launch-ticket-consume", {
    method: "POST",
    body: JSON.stringify({ ticket })
  });
}

/*
 * Connexion par Google (2026-09-26, Norman : « la personne doit se connecter avec son gmail »). Le navigateur envoie le jeton d'identité reçu de Google ; il est
 * vérifié ici (signature, destinataire, expiration, adresse vérifiée) puis une session IDLE est ouverte pour cette adresse. Le droit de jouer reste décidé par le
 * moteur à chaque appel (accès public ouvert par l'administrateur).
 */
async function idleGoogleLoginV1(request, env) {
  /* Connexion Google : 10 tentatives par minute et par adresse. */
  if (idleLimiteDepasseeV1("google:" + String(request.headers.get("cf-connecting-ip") || "inconnue"), 10, 10 / 60)) return idleTropDeRequetesV1();
  const lecture = await idleLireJsonBorneV1(request);
  if (lecture.tropGros) return idleCorpsTropGrosV1();
  const body = lecture.corps;
  const verification = await verifierJetonGoogleIdleV1(body?.credential, { clientId: env?.GOOGLE_CLIENT_ID });
  if (!verification.ok) {
    const status = verification.code === "GOOGLE_NON_CONFIGURE" ? 503 : verification.code === "GOOGLE_CLES_INDISPONIBLES" ? 502 : 401;
    return idleJsonV1({ ok: false, error: verification.code }, status);
  }
  return idleCoordinatorFetchV1(env, "/__soreal-idle-v1/google-session-create", {
    method: "POST",
    body: JSON.stringify({ email: verification.email, nom: verification.nom, sub: verification.sub })
  });
}

async function idleLogoutV1(request, env) {
  const sessionToken = idleBearerV1(request);
  if (!sessionToken) return idleJsonV1({ ok: true });
  return idleCoordinatorFetchV1(env, "/__soreal-idle-v1/session-revoke", {
    method: "POST",
    body: JSON.stringify({ sessionToken })
  });
}

/* Jeu local : export de la ligne du joueur et des catalogues au démarrage, réception de la progression (voir idle-local-sync-v1.js). */
/*
 * Application Android hors ligne (Norman, 2026-10-30) : sa page est servie par https://appassets.androidplatform.net et appelle ces trois routes du serveur (relais de connexion, lecture de sa partie, pseudo unique) : seule cette origine reçoit les
 * en-têtes CORS, et seulement sur ces routes.
 */
const IDLE_ORIGINE_APK_V1 = "https://appassets.androidplatform.net";
function idleCorsApkV1(request, url) {
  if (request.headers.get("origin") !== IDLE_ORIGINE_APK_V1) return null;
  if (!/^\/api\/v1\/(relais|pseudo|local\/export)$/.test(url.pathname)) return null;
  return { "access-control-allow-origin": IDLE_ORIGINE_APK_V1, "access-control-allow-headers": "authorization, content-type", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-max-age": "600", vary: "origin" };
}
function idleAvecCorsApkV1(cors, reponse) {
  if (!cors) return reponse;
  const h = new Headers(reponse.headers);
  for (const [k, v] of Object.entries(cors)) h.set(k, v);
  return new Response(reponse.body, { status: reponse.status, headers: h });
}

async function idleLocalV1(request, env, chemin) {
  const sessionToken = idleBearerV1(request);
  if (!sessionToken) return idleJsonV1({ ok: false, code: "LAUNCH_TICKET_REQUIRED" }, 401);
  if (idleLimiteDepasseeV1("local:" + sessionToken, 10, 2)) return idleTropDeRequetesV1();
  let corps = {};
  if (chemin === "local-export") { corps.appareil = new URL(request.url).searchParams.get("appareil") || ""; corps.lecture = new URL(request.url).searchParams.get("lecture") === "1"; }
  if (chemin === "local-push") {
    const lecture = await idleLireJsonBorneV1(request, 4194304);
    if (lecture.tropGros) return idleCorpsTropGrosV1();
    corps = lecture.corps && typeof lecture.corps === "object" ? lecture.corps : {};
  }
  corps.sessionToken = sessionToken;
  return idleCoordinatorFetchV1(env, "/__soreal-idle-v1/" + chemin, { method: "POST", body: JSON.stringify(corps) });
}

async function idleCallV1(request, env) {
  const lecture = await idleLireJsonBorneV1(request);
  if (lecture.tropGros) return idleCorpsTropGrosV1();
  const body = lecture.corps;
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
   * égalité de chaîne plus loin (une opération d'administration
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
  /* 40 appels de réserve, 12 par seconde ensuite, par session : très au-dessus de la cadence réelle du client, très en dessous d'un flot. */
  if (idleLimiteDepasseeV1("session:" + sessionToken, 40, 12)) return idleTropDeRequetesV1();

  const reponse = await idleCoordinatorFetchV1(env, "/__soreal-idle-v1/session-call", {
    method: "POST",
    /* catalogHashes : ce que le client possède déjà (voir idle-catalogues-v1.js) ; absent = réponse complète. */
    body: JSON.stringify({ sessionToken, operation, args, catalogHashes: body && typeof body.catalogHashes === "object" ? body.catalogHashes : undefined, langue: body && body.langue === "en" ? "en" : "fr" })
  });
  /* Heure du serveur (Norman, 2026-10-03 : « les chronos doivent être très précis ») : le client en déduit l'écart de son horloge (voir standalone-bridge.js, __SOREAL_IDLE_HEURE_V1__). */
  try {
    const entetes = new Headers(reponse.headers);
    entetes.set("x-soreal-now", String(Date.now()));
    return new Response(reponse.body, { status: reponse.status, statusText: reponse.statusText, headers: entetes });
  } catch (_e) {
    return reponse;
  }
}

/*
 * Téléversements du menu Admin (2026-09-30) : images d'histoire et voix générées, vers R2. Réservés à l'administrateur : le jeton de
 * session (Bearer) est vérifié par le moteur (opération estAdminSorealIdle, même règle que les autres outils d'administration) AVANT
 * de lire le corps de la requête.
 */
const IDLE_UPLOAD_MAX_IMAGE_V1 = 8 * 1024 * 1024;
const IDLE_UPLOAD_MAX_VOIX_V1 = 12 * 1024 * 1024;
const IDLE_UPLOAD_TYPES_V1 = { webp: "image/webp", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif" };

async function idleEstAdminV1(request, env) {
  const sessionToken = idleBearerV1(request);
  if (!sessionToken) return false;
  const reponse = await idleCoordinatorFetchV1(env, "/__soreal-idle-v1/session-call", {
    method: "POST",
    body: JSON.stringify({ sessionToken, operation: "estAdminSorealIdle", args: [sessionToken] })
  });
  if (!reponse || !reponse.ok) return false;
  const donnees = await reponse.json().catch(() => null);
  return Boolean(donnees && donnees.ok && donnees.isAdmin === true);
}

/*
 * Purge des voix R2 inutiles (Norman, 2026-09-30 : « vérifie bien que les anciennes soient supprimées pour gagner de la place ») : supprime de
 * idle/voix/ tout fichier dont l'empreinte n'apparaît dans AUCUNE histoire (liste « voix » de chaque histoire, lue par le moteur via
 * l'opération d'administration listerHistoiresAdminSorealIdle). Réservée à l'administrateur ; ne touche jamais aux images ni aux autres
 * dossiers. « dry » (=1) : compte seulement, ne supprime rien.
 */
async function idlePurgerVoixAdminV1(request, env, url) {
  if (!(await idleEstAdminV1(request, env))) return idleJsonV1({ ok: false, error: "SOREAL_IDLE_ADMIN_REQUIS" }, 403);
  if (!env?.SOREAL_R2 || typeof env.SOREAL_R2.list !== "function" || typeof env.SOREAL_R2.delete !== "function") return idleJsonV1({ ok: false, error: "R2_INDISPONIBLE" }, 503);
  const sessionToken = idleBearerV1(request);
  const reponse = await idleCoordinatorFetchV1(env, "/__soreal-idle-v1/session-call", {
    method: "POST",
    body: JSON.stringify({ sessionToken, operation: "listerHistoiresAdminSorealIdle", args: [sessionToken] })
  });
  const donnees = reponse && reponse.ok ? await reponse.json().catch(() => null) : null;
  if (!donnees || !donnees.ok || !Array.isArray(donnees.histoires)) return idleJsonV1({ ok: false, error: "HISTOIRES_ILLISIBLES" }, 502);
  const utiles = new Set();
  for (const h of donnees.histoires) for (const hash of Array.isArray(h.voix) ? h.voix : []) utiles.add(String(hash));
  /*
   * Voix des textes modifiés depuis le jeu (chroniques de boss, popups : opération listerTextesAdminSorealIdle) : elles restent aussi.
   * Si cette liste est illisible, on ne supprime RIEN plutôt que de risquer d'effacer des voix utilisées.
   */
  const reponseTextes = await idleCoordinatorFetchV1(env, "/__soreal-idle-v1/session-call", {
    method: "POST",
    body: JSON.stringify({ sessionToken, operation: "listerTextesAdminSorealIdle", args: [sessionToken] })
  });
  const textes = reponseTextes && reponseTextes.ok ? await reponseTextes.json().catch(() => null) : null;
  if (!textes || !textes.ok) return idleJsonV1({ ok: false, error: "TEXTES_ILLISIBLES" }, 502);
  for (const t of [].concat(Array.isArray(textes.popups) ? textes.popups : [], (Array.isArray(textes.boss) ? textes.boss : []).map((b) => b && b.surcharge).filter(Boolean))) {
    for (const hash of Array.isArray(t.voix) ? t.voix : []) utiles.add(String(hash));
  }
  /*
   * Voix pré-générées des textes du jeu (public/voice/manifest.json, stockées au même endroit sur R2) : jamais supprimées non plus. Avant ce
   * garde, une purge effaçait aussi les ~900 voix du tutoriel et des popups, qui n'appartiennent à aucune histoire.
   */
  if (env?.ASSETS && typeof env.ASSETS.fetch === "function") {
    const m = await env.ASSETS.fetch(new Request(new URL("/voice/manifest.json", request.url)));
    const manifeste = m && m.ok ? await m.json().catch(() => null) : null;
    if (!manifeste || !Array.isArray(manifeste.files)) return idleJsonV1({ ok: false, error: "MANIFESTE_VOIX_ILLISIBLE" }, 502);
    for (const hash of manifeste.files) utiles.add(String(hash));
  }
  const aSupprimer = [];
  let gardees = 0;
  let octetsLiberes = 0;
  let cursor;
  do {
    const options = { prefix: "idle/voix/", limit: 1000 };
    if (cursor) options.cursor = cursor;
    const listed = await env.SOREAL_R2.list(options);
    for (const o of (listed && listed.objects) || []) {
      const hash = String(o.key).slice("idle/voix/".length).replace(/\.m4a$/, "");
      if (utiles.has(hash)) gardees += 1;
      else { aSupprimer.push(o.key); octetsLiberes += Number(o.size) || 0; }
    }
    cursor = listed && listed.truncated && listed.cursor ? listed.cursor : undefined;
  } while (cursor);
  if (url.searchParams.get("dry") !== "1") {
    for (let i = 0; i < aSupprimer.length; i += 500) await env.SOREAL_R2.delete(aSupprimer.slice(i, i + 500));
  }
  return idleJsonV1({ ok: true, supprimees: aSupprimer.length, gardees, octetsLiberes, simulation: url.searchParams.get("dry") === "1" });
}

async function idleUploadAdminV1(request, env, url) {
  if (!(await idleEstAdminV1(request, env))) return idleJsonV1({ ok: false, error: "SOREAL_IDLE_ADMIN_REQUIS" }, 403);
  if (!env?.SOREAL_R2 || typeof env.SOREAL_R2.put !== "function") return idleJsonV1({ ok: false, error: "R2_INDISPONIBLE" }, 503);
  const estVoix = url.pathname === "/api/v1/voice-upload";
  const max = estVoix ? IDLE_UPLOAD_MAX_VOIX_V1 : IDLE_UPLOAD_MAX_IMAGE_V1;
  const annonce = Number(request.headers.get("content-length") || 0);
  if (annonce > max) return idleJsonV1({ ok: false, error: "FICHIER_TROP_GROS" }, 413);
  let cle = "";
  let type = "";
  let fichier = "";
  if (estVoix) {
    const h = String(url.searchParams.get("h") || "").trim();
    if (!/^[0-9a-f]{14}$/.test(h)) return idleJsonV1({ ok: false, error: "EMPREINTE_INVALIDE" }, 400);
    cle = "idle/voix/" + h + ".m4a";
    type = "audio/mp4";
    fichier = h;
  } else {
    const id = String(url.searchParams.get("id") || "").trim();
    const ext = String(url.searchParams.get("ext") || "").trim().toLowerCase();
    if (!/^[A-Za-z0-9_-]{1,60}$/.test(id)) return idleJsonV1({ ok: false, error: "HISTOIRE_ID_INVALIDE" }, 400);
    if (!IDLE_UPLOAD_TYPES_V1[ext]) return idleJsonV1({ ok: false, error: "TYPE_IMAGE_INVALIDE" }, 400);
    fichier = Date.now().toString(36) + Math.random().toString(36).slice(2, 7) + "." + ext;
    cle = "idle/story/" + id + "/" + fichier;
    type = IDLE_UPLOAD_TYPES_V1[ext];
  }
  const octets = await request.arrayBuffer();
  if (!octets.byteLength) return idleJsonV1({ ok: false, error: "FICHIER_VIDE" }, 400);
  if (octets.byteLength > max) return idleJsonV1({ ok: false, error: "FICHIER_TROP_GROS" }, 413);
  await env.SOREAL_R2.put(cle, octets, { httpMetadata: { contentType: type } });
  return idleJsonV1({ ok: true, file: fichier, bytes: octets.byteLength });
}

/*
 * Mises à jour de l'application Windows (Norman, 2026-10-28 ; desktop/src/maj.mjs). Deux routes en lecture seule, sans authentification (le contenu est celui que le jeu sert déjà à tout le monde) :
 *  - /api/v1/maj/manifeste : le manifeste SIGNÉ publié par le propriétaire (idle/_maj/manifeste.json) ; l'application ne le croit que si la signature vaut pour sa clé publique ;
 *  - /api/v1/maj/fichier?cle=idle/… : un fichier du bucket sous idle/ (médias, paquet de code de la mise à jour), tel quel.
 */
async function idleMajV1(request, env, url) {
  if (!env?.SOREAL_R2 || typeof env.SOREAL_R2.get !== "function") return idleJsonV1({ ok: false, error: "R2_INDISPONIBLE" }, 503);
  if (url.pathname === "/api/v1/maj/manifeste") {
    const objet = await env.SOREAL_R2.get("idle/_maj/manifeste.json");
    if (!objet) return idleJsonV1({ ok: false, error: "AUCUNE_MAJ" }, 404);
    return new Response(objet.body, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
  }
  const cle = String(url.searchParams.get("cle") || "");
  const interdit = !cle.startsWith("idle/") || cle.length > 300 || cle.split("/").some((seg) => seg === ".." || seg === "") || [...cle].some((c) => c.charCodeAt(0) < 32 || c === "\\");
  if (interdit) return idleJsonV1({ ok: false, error: "CLE_INVALIDE" }, 400);
  const objet = await env.SOREAL_R2.get(cle);
  if (!objet) return idleJsonV1({ ok: false, error: "ABSENT" }, 404);
  const entetes = new Headers({ "cache-control": "public, max-age=300", "content-length": String(objet.size) });
  entetes.set("content-type", (objet.httpMetadata && objet.httpMetadata.contentType) || "application/octet-stream");
  return new Response(objet.body, { headers: entetes });
}

/*
 * Sauvegarde quotidienne de TOUTES les parties (Norman, 2026-10-28 : « fais bien un backup de leurs jeux »). La tâche planifiée (toutes les 5 minutes) en écrit UNE par jour dans R2 (backups/idle/joueurs-AAAA-MM-JJ.json.gz), à la première exécution du jour ;
 * les sauvegardes de plus de 30 jours sont supprimées. En plus des copies par joueur que le serveur garde déjà (idle_sauvegardes_locales : première, quotidiennes, périodiques, avant anomalie / restauration / import).
 */
const SAUVEGARDE_PREFIXE_V1 = "backups/idle/joueurs-";
const SAUVEGARDE_JOURS_V1 = 30;
async function sauvegardeQuotidienneV1(env, maintenant = Date.now()) {
  if (!env?.SOREAL_R2 || typeof env.SOREAL_R2.put !== "function" || !env?.SOREAL_IDLE) return { fait: false, raison: "INDISPONIBLE" };
  const jour = new Date(maintenant).toISOString().slice(0, 10);
  const cle = SAUVEGARDE_PREFIXE_V1 + jour + ".json.gz";
  try {
    if (await env.SOREAL_R2.head(cle)) return { fait: false, raison: "DEJA_FAITE" };
    const stub = env.SOREAL_IDLE.get(env.SOREAL_IDLE.idFromName("global"));
    const rep = await stub.fetch(new Request("https://soreal-idle.invalid/__soreal-idle-v1/backup-all", { method: "POST" }));
    if (!rep.ok) return { fait: false, raison: "LECTURE_REFUSEE" };
    const texte = await rep.text();
    const donnees = await new Response(new Blob([texte]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();
    await env.SOREAL_R2.put(cle, donnees, { httpMetadata: { contentType: "application/gzip" } });
    /* ménage : plus de 30 jours */
    const limite = new Date(maintenant - SAUVEGARDE_JOURS_V1 * 86400000).toISOString().slice(0, 10);
    const listees = await env.SOREAL_R2.list({ prefix: SAUVEGARDE_PREFIXE_V1, limit: 1000 });
    const vieilles = (listees.objects || []).map((o) => o.key).filter((k) => {
      if (!k.startsWith(SAUVEGARDE_PREFIXE_V1) || !k.endsWith(".json.gz")) return false;
      const date = k.slice(SAUVEGARDE_PREFIXE_V1.length, SAUVEGARDE_PREFIXE_V1.length + 10);
      return date.length === 10 && date[4] === "-" && date[7] === "-" && date < limite;
    });
    if (vieilles.length) await env.SOREAL_R2.delete(vieilles);
    return { fait: true, cle, octets: donnees.byteLength, supprimees: vieilles.length };
  } catch (e) {
    return { fait: false, raison: "ERREUR", detail: String(e && e.message || e).slice(0, 200) };
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && (url.pathname === "/api/v1/maj/manifeste" || url.pathname === "/api/v1/maj/fichier")) return idleMajV1(request, env, url);
    const mediaResponse = await traiterRequeteIdleMedia(request, env);
    if (mediaResponse) return mediaResponse;


    if (request.method === "POST" && url.pathname === "/api/v1/voice-purge") {
      return idlePurgerVoixAdminV1(request, env, url);
    }

    if (request.method === "POST" && (url.pathname === "/api/v1/story-upload" || url.pathname === "/api/v1/voice-upload")) {
      return idleUploadAdminV1(request, env, url);
    }

    if (request.method === "GET" && url.pathname === "/api/v1/bootstrap") {
      return idleBootstrapV1(request, env);
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

    if (request.method === "POST" && url.pathname === "/api/v1/google-login") {
      return idleGoogleLoginV1(request, env);
    }

    if (request.method === "POST" && url.pathname === "/api/v1/logout") {
      return idleLogoutV1(request, env);
    }

    /* Notes de l'anti-triche du jeu local : administrateur seul. */
    if (request.method === "GET" && url.pathname === "/api/v1/local/alertes") {
      if (!(await idleEstAdminV1(request, env))) return idleJsonV1({ ok: false, error: "SOREAL_IDLE_ADMIN_REQUIS" }, 403);
      return idleCoordinatorFetchV1(env, "/__soreal-idle-v1/local-alertes", { method: "POST", body: "{}" });
    }
    /* Interrupteur général du jeu local (administrateur seul) : GET = état, POST {actif:false} = retour au mode serveur au prochain chargement de chaque joueur. */
    if (url.pathname === "/api/v1/local/interrupteur" && (request.method === "GET" || request.method === "POST")) {
      if (!(await idleEstAdminV1(request, env))) return idleJsonV1({ ok: false, error: "SOREAL_IDLE_ADMIN_REQUIS" }, 403);
      let corps = {};
      if (request.method === "POST") {
        const lecture = await idleLireJsonBorneV1(request);
        corps = lecture.corps && typeof lecture.corps === "object" ? { actif: lecture.corps.actif } : {};
      }
      return idleCoordinatorFetchV1(env, "/__soreal-idle-v1/local-interrupteur", { method: "POST", body: JSON.stringify(corps) });
    }
    /* Sauvegardes de sécurité des parties (jeu local) : liste et restauration, administrateur seul. */
    if (request.method === "GET" && url.pathname === "/api/v1/local/sauvegardes") {
      if (!(await idleEstAdminV1(request, env))) return idleJsonV1({ ok: false, error: "SOREAL_IDLE_ADMIN_REQUIS" }, 403);
      return idleCoordinatorFetchV1(env, "/__soreal-idle-v1/local-sauvegardes", { method: "POST", body: JSON.stringify({ email: url.searchParams.get("email") || "" }) });
    }
    if (request.method === "POST" && url.pathname === "/api/v1/local/restaurer") {
      if (!(await idleEstAdminV1(request, env))) return idleJsonV1({ ok: false, error: "SOREAL_IDLE_ADMIN_REQUIS" }, 403);
      const lecture = await idleLireJsonBorneV1(request);
      const c = lecture.corps && typeof lecture.corps === "object" ? lecture.corps : {};
      return idleCoordinatorFetchV1(env, "/__soreal-idle-v1/local-restaurer", { method: "POST", body: JSON.stringify({ email: c.email, id: c.id }) });
    }
    /* Connexion de l'application Android hors ligne (idle-relais-apk-v1.js, modules/apk-connexion-v1.js). */
    const corsApk = idleCorsApkV1(request, url);
    if (corsApk && request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsApk });
    if (url.pathname === "/api/v1/relais" && request.method === "POST") {
      const jeton = idleBearerV1(request);
      if (!jeton) return idleJsonV1({ ok: false, code: "LAUNCH_TICKET_REQUIRED" }, 401);
      const lecture = await idleLireJsonBorneV1(request, 2048);
      const corps = lecture.corps && typeof lecture.corps === "object" ? lecture.corps : {};
      return idleCoordinatorFetchV1(env, "/__soreal-idle-v1/relais-poser", { method: "POST", body: JSON.stringify({ sessionToken: jeton, code: corps.code }) });
    }
    if (url.pathname === "/api/v1/relais" && request.method === "GET") {
      const code = url.searchParams.get("code") || "";
      if (idleLimiteDepasseeV1("relais:" + code, 10, 1)) return idleAvecCorsApkV1(corsApk, idleTropDeRequetesV1());
      return idleAvecCorsApkV1(corsApk, await idleCoordinatorFetchV1(env, "/__soreal-idle-v1/relais-lire", { method: "POST", body: JSON.stringify({ code }) }));
    }
    if (url.pathname === "/api/v1/pseudo" && request.method === "POST") {
      const jeton = idleBearerV1(request);
      if (!jeton) return idleAvecCorsApkV1(corsApk, idleJsonV1({ ok: false, code: "LAUNCH_TICKET_REQUIRED" }, 401));
      if (idleLimiteDepasseeV1("pseudo:" + jeton, 5, 0.5)) return idleAvecCorsApkV1(corsApk, idleTropDeRequetesV1());
      const lecture = await idleLireJsonBorneV1(request, 2048);
      const corps = lecture.corps && typeof lecture.corps === "object" ? lecture.corps : {};
      return idleAvecCorsApkV1(corsApk, await idleCoordinatorFetchV1(env, "/__soreal-idle-v1/pseudo-definir", { method: "POST", body: JSON.stringify({ sessionToken: jeton, pseudo: corps.pseudo }) }));
    }
    if (request.method === "GET" && url.pathname === "/api/v1/local/export") return idleAvecCorsApkV1(corsApk, await idleLocalV1(request, env, "local-export"));
    if (request.method === "POST" && url.pathname === "/api/v1/local/push") return idleLocalV1(request, env, "local-push");
    /* Textes modifiés par l'administrateur, relus par chaque page (le moteur local n'a pas la table du serveur). */
    if (request.method === "GET" && url.pathname === "/api/v1/local/textes") return idleLocalV1(request, env, "local-textes");

    if (request.method === "POST" && url.pathname === "/api/v1/call") {
      return idleCallV1(request, env);
    }

    return new Response("SOREAL Idle Worker", { status: 404 });
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(pingSorealIdleV1(env));
    ctx.waitUntil(sauvegardeQuotidienneV1(env));
  }
};
