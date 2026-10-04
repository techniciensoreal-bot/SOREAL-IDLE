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
export const IDLE_ITOPOD_TV_HOTE_INTERNE_V1 = "https://soreal-tv.internal";
export const IDLE_ITOPOD_AVATAR_PREFIX_V1 = "shared/avatars/";
export const IDLE_ITOPOD_DECOR_PREFIX_V1 = "shared/avatar-backgrounds/";
/* Décors de la tour (Norman, 2026-10-04) : idle/itopod/, un fichier par étage de 1 à 10 (le numéro est le premier nombre du nom de fichier). */
export const IDLE_ITOPOD_ETAGE_PREFIX_V1 = "idle/itopod/";
export const IDLE_ITOPOD_ETAGES_V1 = 10;
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
  if (!k.startsWith(prefix) || k.includes("..") || k.includes("//") || !/\.(webp|png|jpe?g|gif|avif)$/i.test(k)) return "";
  return /^[\p{L}\p{N} _.\-\/()'’]{1,240}$/u.test(k) ? k : "";
}

/* Liste des ouvriers { nom, avatar } à partir de la réponse de /api/cosmetiques-equipe. Dédoublonnée sur le prénom, triée. */
/* Prénom lisible d'un fichier d'avatar : « shared/avatars/level-2/03-jean_pierre.webp » → « Jean Pierre ». */
export function idleItopodNomDepuisCleV1(cle) {
  const base = text(cle).split("/").pop().replace(/.[A-Za-z0-9]+$/, "").replace(/^[0-9]+[-_ .]*/, "").replace(/[-_]+/g, " ").trim();
  return base.split(" ").filter(Boolean).map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(" ").slice(0, 40);
}

export function idleItopodRosterV1(cosmetics, clesAvatars) {
  const par = cosmetics && typeof cosmetics === "object" ? cosmetics.parEmail : null;
  const out = new Map();
  for (const item of Object.values(par && typeof par === "object" ? par : {})) {
    const nom = text(item && item.nom).slice(0, 40);
    if (!nom || IDLE_ITOPOD_EXCLUS_V1.includes(norm(nom))) continue;
    const avatar = idleItopodCleR2V1(item.avatarUrl, IDLE_ITOPOD_AVATAR_PREFIX_V1);
    const k = norm(nom);
    if (!out.has(k) || (!out.get(k).avatar && avatar)) out.set(k, { nom, avatar });
  }
  /* Norman, 2026-10-04 : « les avatars des ouvriers, responsables et anciens sont dans shared/avatars/ » : chaque image du dossier est un ennemi (prénom lu dans le nom du fichier si TV ne le donne pas). */
  const dejaAvatar = new Set([...out.values()].map((w) => w.avatar).filter(Boolean));
  for (const cle of Array.isArray(clesAvatars) ? clesAvatars : []) {
    const avatar = idleItopodCleR2V1(cle, IDLE_ITOPOD_AVATAR_PREFIX_V1);
    if (!avatar || dejaAvatar.has(avatar)) continue;
    const lu = idleItopodNomDepuisCleV1(avatar);
    const k = norm(lu);
    const nom = IDLE_ITOPOD_TOUJOURS_V1.find((n) => norm(n) === k) || lu;
    if (!nom || IDLE_ITOPOD_EXCLUS_V1.includes(k)) continue;
    if (!out.has(k) || !out.get(k).avatar) { out.set(k, { nom: out.has(k) ? out.get(k).nom : nom, avatar }); dejaAvatar.add(avatar); }
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

/* { 1: clé, ..., 10: clé } depuis les clés R2 idle/itopod/ ; le numéro d'un fichier est le premier nombre de 1 à 10 de son nom (« 3.webp », « etage-03.png »…). À numéro égal, le premier par ordre alphabétique. */
export function idleItopodEtagesV1(cles) {
  const out = {};
  for (const cle of [...(Array.isArray(cles) ? cles : [])].sort()) {
    const k = idleItopodCleR2V1(cle, IDLE_ITOPOD_ETAGE_PREFIX_V1);
    const m = k && k.slice(IDLE_ITOPOD_ETAGE_PREFIX_V1.length).match(/[0-9]+/);
    const n = m ? Number(m[0]) : 0;
    if (n >= 1 && n <= IDLE_ITOPOD_ETAGES_V1 && !out[n]) out[n] = k;
  }
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
    /*
     * TV est fermé aux non-connectés depuis le 2026-10-01 (verrou « session exigée » : la route publique répond 401 SESSION_EXPIREE, ce qui réduisait la liste aux deux ouvriers toujours présents, sans avatar).
     * Les Workers qui lisent TV côté serveur passent par la liaison de service avec l'hôte interne « soreal-tv.internal », seul exempté du verrou (SOREAL-TV features/access-gate/policy.js) : ce nom n'existe que
     * via la liaison, jamais depuis Internet.
     */
    const urlInterne = IDLE_ITOPOD_TV_HOTE_INTERNE_V1 + "/api/cosmetiques-equipe";
    const init = { headers: { accept: "application/json" } };
    const r = fetchFn
      ? await fetchFn(url, init)
      : env && env.SOREAL_TV_API && typeof env.SOREAL_TV_API.fetch === "function"
        ? await env.SOREAL_TV_API.fetch(new Request(urlInterne, init))
        : await fetch(url, { ...init, cf: { cacheEverything: true, cacheTtl: 300 } });
    if (r.ok) cosmetics = await r.json();
  } catch (_) { /* liste réduite */ }
  let cles = [];
  let clesEtages = [];
  let clesAvatars = [];
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
    if (env && env.SOREAL_R2 && typeof env.SOREAL_R2.list === "function") {
      let cursor;
      do {
        const opts = { prefix: IDLE_ITOPOD_AVATAR_PREFIX_V1, limit: 1000 };
        if (cursor) opts.cursor = cursor;
        const l = await env.SOREAL_R2.list(opts);
        clesAvatars = clesAvatars.concat((l.objects || []).map((o) => o.key));
        cursor = l.truncated && l.cursor ? l.cursor : undefined;
      } while (cursor && clesAvatars.length < 3000);
      const l = await env.SOREAL_R2.list({ prefix: IDLE_ITOPOD_ETAGE_PREFIX_V1, limit: 1000 });
      clesEtages = (l.objects || []).map((o) => o.key);
    }
  } catch (_) { /* pas de décor */ }
  const valeur = { ok: true, workers: idleItopodRosterV1(cosmetics, clesAvatars), decors: idleItopodDecorsParNiveauV1(cles), etages: idleItopodEtagesV1(clesEtages), complete: Boolean(cosmetics) };
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
  const cle = idleItopodCleR2V1(brute, IDLE_ITOPOD_AVATAR_PREFIX_V1) || idleItopodCleR2V1(brute, IDLE_ITOPOD_DECOR_PREFIX_V1) || idleItopodCleR2V1(brute, IDLE_ITOPOD_ETAGE_PREFIX_V1);
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
