/*
 * SOREAL IDLE — météo de l'endroit où le joueur joue, pour le Trou sans fond (Norman, 2026-11-20 : « s'il pleut chez lui, il doit pleuvoir sur le Money Pit »).
 * Le client n'envoie QUE la latitude et la longitude APPROXIMATIVES de la grande ville de son fuseau horaire (déduites par modules/trou-nuit-v1.js : aucune position GPS, aucune permission) ;
 * ici elles sont encore arrondies à 0,1° (~11 km) puis la météo actuelle est lue chez Open-Meteo (api.open-meteo.com, sans clé) et gardée 15 minutes par le cache de Cloudflare : un seul appel
 * par case de 0,1° et par quart d'heure, quel que soit le nombre de joueurs. La réponse ne contient qu'une catégorie ; rien n'est stocké, aucune adresse IP n'est transmise à Open-Meteo.
 * Codes météo : WMO « weather_code » de l'API (0 ciel clair ; 1-3 de plus en plus nuageux ; 45-48 brouillard ; 51-57 bruine ; 61-67 pluie ; 71-77 neige ; 80-82 averses ; 85-86 averses de neige ; 95-99 orage).
 */
export const IDLE_METEO_CATEGORIES_V1 = ["clair", "nuageux", "couvert", "brouillard", "bruine", "pluie", "forte-pluie", "neige", "forte-neige", "orage"];

export function idleMeteoCategorieV1(code) {
  const c = Math.round(Number(code));
  if (!Number.isFinite(c)) return "clair";
  if (c === 2) return "nuageux";
  if (c === 3) return "couvert";
  if (c === 45 || c === 48) return "brouillard";
  if (c >= 51 && c <= 57) return "bruine";
  if (c === 61 || c === 63 || c === 66 || c === 80 || c === 81) return "pluie";
  if (c === 65 || c === 67 || c === 82) return "forte-pluie";
  if (c === 71 || c === 73 || c === 77 || c === 85) return "neige";
  if (c === 75 || c === 86) return "forte-neige";
  if (c >= 95 && c <= 99) return "orage";
  return "clair";
}

/* Coordonnées valides arrondies à 0,1°, sinon null. */
export function idleMeteoCoordonneesV1(lat, lon) {
  const a = Number(lat), o = Number(lon);
  if (!Number.isFinite(a) || !Number.isFinite(o) || Math.abs(a) > 90 || Math.abs(o) > 180) return null;
  return { lat: Math.round(a * 10) / 10, lon: Math.round(o * 10) / 10 };
}

export function idleMeteoUrlAmontV1(co) {
  return "https://api.open-meteo.com/v1/forecast?latitude=" + co.lat + "&longitude=" + co.lon + "&current=weather_code&timezone=UTC";
}

/* Répond à GET /api/idle/media/meteo?lat=&lon= ; `lire` (par défaut fetch avec cache Cloudflare de 15 min) est injectable pour les tests. */
export async function idleMeteoRepondreV1(url, lire) {
  const entetes = { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=600", "access-control-allow-origin": "*" };
  const co = idleMeteoCoordonneesV1(url.searchParams.get("lat"), url.searchParams.get("lon"));
  if (!co) return new Response(JSON.stringify({ ok: false, erreur: "POSITION_INVALIDE" }), { status: 400, headers: entetes });
  try {
    const lecteur = lire || ((u) => fetch(u, { cf: { cacheTtl: 900, cacheEverything: true } }));
    const r = await lecteur(idleMeteoUrlAmontV1(co));
    if (!r || !r.ok) throw new Error("AMONT");
    const j = await r.json();
    const code = j && j.current ? j.current.weather_code : null;
    if (code === null || code === undefined) throw new Error("AMONT");
    return new Response(JSON.stringify({ ok: true, categorie: idleMeteoCategorieV1(code) }), { status: 200, headers: entetes });
  } catch (_e) {
    /* Sans météo, la page reste simplement sans effet : jamais une erreur visible. */
    return new Response(JSON.stringify({ ok: false, erreur: "METEO_INDISPONIBLE" }), { status: 503, headers: Object.assign({}, entetes, { "cache-control": "no-store" }) });
  }
}
