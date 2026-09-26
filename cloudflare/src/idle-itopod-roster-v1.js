/*
 * SOREAL IDLE — ITOPOD : les ennemis portent les prénoms des ouvriers (Norman, 2026-09-26) : « dans NGU IDLE les ennemis portaient les noms des
 * donateurs ; j'aimerais qu'ils portent les prénoms des ouvriers, avec leur avatar ; plus j'en aurai, plus la liste s'agrandira. Pour le décor,
 * utilise les décors Level 1 à 6. Ajoute Sébastien et moi dans l'ITOPOD également. »
 *
 * Source : la route PUBLIQUE de SOREAL TV « /api/cosmetiques-equipe » (un profil par personne : prénom, avatar), lue côté serveur. La liste grandit
 * donc toute seule avec l'équipe. Les images viennent du même stockage R2 (bucket « soreal », dossiers shared/avatars/level-N/ et
 * shared/avatar-backgrounds/level-N/). Aucune adresse e-mail n'est renvoyée à IDLE.
 */

export const IDLE_ITOPOD_TV_ORIGIN_V1 = "https://soreal-tv.technicien-soreal.workers.dev";
export const IDLE_ITOPOD_AVATAR_PREFIX_V1 = "shared/avatars/";
export const IDLE_ITOPOD_DECOR_PREFIX_V1 = "shared/avatar-backgrounds/";
/* Profils qui ne sont pas des personnes de l'équipe (profil d'accueil). */
export const IDLE_ITOPOD_EXCLUS_V1 = Object.freeze(["bienvenue"]);
/* Toujours présents dans l'ITOPOD, même sans profil (Norman : « Sébastien et moi »). */
export const IDLE_ITOPOD_TOUJOURS_V1 = Object.freeze(["Norman", "Sébastien"]);

const text = (v) => String(v == null ? "" : v).trim();
const norm = (v) => text(v).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* Clé R2 d'une URL d'avatar / de décor de TV (« /assets/shared/avatars/level-1/x.webp?v=1 ») ; "" si ce n'est pas un fichier partagé autorisé. */
export function idleItopodCleR2V1(url, prefix) {
  let k = text(url).split("?")[0].split("#")[0];
  try { k = decodeURIComponent(k); } catch (_) { return ""; }
  k = k.replace(/^\/+/, "").replace(/^assets\//, "");
  if (!k.startsWith(prefix) || k.includes("..") || k.includes("//") || !/\.(webp|png|jpe?g|gif)$/i.test(k)) return "";
  return /^[\p{L}\p{N} _.\-\/()'’]{1,240}$/u.test(k) ? k : "";
}

/* Liste des ouvriers { nom, avatar } à partir de la réponse de /api/cosmetiques-equipe. Dédoublonnée sur le prénom, triée. */
export function idleItopodRosterV1(cosmetics) {
  const par = cosmetics && typeof cosmetics === "object" ? cosmetics.parEmail : null;
  const out = new Map();
  for (const item of Object.values(par && typeof par === "object" ? par : {})) {
    const nom = text(item && item.nom).slice(0, 40);
    if (!nom || IDLE_ITOPOD_EXCLUS_V1.includes(norm(nom))) continue;
    const avatar = idleItopodCleR2V1(item.avatarUrl, IDLE_ITOPOD_AVATAR_PREFIX_V1);
    const k = norm(nom);
    if (!out.has(k) || (!out.get(k).avatar && avatar)) out.set(k, { nom, avatar });
  }
  for (const nom of IDLE_ITOPOD_TOUJOURS_V1) if (!out.has(norm(nom))) out.set(norm(nom), { nom, avatar: "" });
  return [...out.values()].sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }));
}

/* Décors par niveau : { 1: [clé, ...], ..., 6: [...] } depuis les clés R2 shared/avatar-backgrounds/level-N/... */
export function idleItopodDecorsParNiveauV1(cles) {
  const out = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const cle of Array.isArray(cles) ? cles : []) {
    const k = idleItopodCleR2V1(cle, IDLE_ITOPOD_DECOR_PREFIX_V1);
    const m = k && k.match(/(?:^|\/)level[-_ ]?(\d+)(?:\/|$)/i);
    const n = m ? Number(m[1]) : 0;
    if (out[n]) out[n].push(k);
  }
  for (const n of Object.keys(out)) out[n].sort();
  return out;
}

let cache = { at: 0, valeur: null };
const DUREE_CACHE_MS = 10 * 60 * 1000;

/* Réponse JSON { ok, workers:[{nom, avatar}], decors:{1..6:[clé]} } ; en cas d'échec de TV, la liste réduite aux deux toujours présents. */
export async function idleItopodRosterReponseV1(request, env, fetchFn) {
  const maintenant = Date.now();
  if (cache.valeur && maintenant - cache.at < DUREE_CACHE_MS) return jsonReponse(cache.valeur);
  let cosmetics = null;
  try {
    /*
     * Liaison de service SOREAL_TV_API (wrangler.jsonc) : un Worker ne peut pas appeler un autre Worker par son adresse workers.dev (erreur 1042,
     * constatée en production le 2026-09-26), il passe par la liaison. Repli sur l'adresse publique pour les tests et le développement local.
     */
    const url = IDLE_ITOPOD_TV_ORIGIN_V1 + "/api/cosmetiques-equipe";
    const init = { headers: { accept: "application/json" } };
    const r = fetchFn
      ? await fetchFn(url, init)
      : env && env.SOREAL_TV_API && typeof env.SOREAL_TV_API.fetch === "function"
        ? await env.SOREAL_TV_API.fetch(new Request(url, init))
        : await fetch(url, { ...init, cf: { cacheEverything: true, cacheTtl: 300 } });
    if (r.ok) cosmetics = await r.json();
  } catch (_) { /* liste réduite */ }
  let cles = [];
  try {
    if (env && env.SOREAL_R2 && typeof env.SOREAL_R2.list === "function") {
      let cursor;
      do {
        const opts = { prefix: IDLE_ITOPOD_DECOR_PREFIX_V1, limit: 1000 };
        if (cursor) opts.cursor = cursor;
        const l = await env.SOREAL_R2.list(opts);
        cles = cles.concat((l.objects || []).map((o) => o.key));
        cursor = l.truncated && l.cursor ? l.cursor : undefined;
      } while (cursor && cles.length < 3000);
    }
  } catch (_) { /* pas de décor */ }
  const valeur = { ok: true, workers: idleItopodRosterV1(cosmetics), decors: idleItopodDecorsParNiveauV1(cles), complete: Boolean(cosmetics) };
  /* Un échec de TV n'est gardé que peu de temps. */
  cache = { at: cosmetics ? maintenant : maintenant - DUREE_CACHE_MS + 30000, valeur };
  return jsonReponse(valeur);
}

function jsonReponse(valeur) {
  return new Response(JSON.stringify(valeur), { status: 200, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300" } });
}

/* Image partagée (avatar ou décor) servie depuis R2 : uniquement les dossiers shared/avatars/ et shared/avatar-backgrounds/. */
export async function idleItopodImagePartageeV1(request, env, url) {
  const brute = text(url.searchParams.get("key"));
  const cle = idleItopodCleR2V1(brute, IDLE_ITOPOD_AVATAR_PREFIX_V1) || idleItopodCleR2V1(brute, IDLE_ITOPOD_DECOR_PREFIX_V1);
  if (!cle) return new Response("Image invalide", { status: 400, headers: { "cache-control": "no-store" } });
  if (!env || !env.SOREAL_R2 || typeof env.SOREAL_R2.get !== "function") return new Response("Média indisponible", { status: 503, headers: { "cache-control": "no-store" } });
  const objet = await env.SOREAL_R2.get(cle);
  if (!objet) return new Response("Image introuvable", { status: 404, headers: { "cache-control": "public, max-age=60" } });
  const h = new Headers();
  if (typeof objet.writeHttpMetadata === "function") objet.writeHttpMetadata(h);
  if (!h.has("content-type")) h.set("content-type", /\.png$/i.test(cle) ? "image/png" : /\.jpe?g$/i.test(cle) ? "image/jpeg" : /\.gif$/i.test(cle) ? "image/gif" : "image/webp");
  if (objet.httpEtag) h.set("etag", objet.httpEtag);
  h.set("cache-control", "public, max-age=86400");
  h.set("access-control-allow-origin", "*");
  return new Response(request.method === "HEAD" ? null : objet.body, { status: 200, headers: h });
}
