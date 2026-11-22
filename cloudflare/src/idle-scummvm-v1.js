/*
 * ScummVM dans Soreal IDLE (Norman, 2026-11-22) : le moteur ScummVM (WebAssembly) et les jeux sont des objets R2 sous le préfixe `scummvm/` du seau SOREAL_R2,
 * servis par GET/HEAD /api/idle/scummvm/<clé> (même origine que le jeu : aucune configuration CORS, l'iframe lit les sauvegardes d'IndexedDB).
 *   scummvm/moteur/…            la page hôte `scummvm.html`, scummvm.js, scummvm.wasm, data/… (tels que compilés ; ne change que lors d'une mise à jour du moteur)
 *   scummvm/jeux/<dossier>/…    les fichiers d'un jeu + un index.json `{nom: taille}` (généré par cloudflare/tools/scummvm-envoyer.mjs)
 *   scummvm/jeux.json           le catalogue : {"jeux":[{"id","nom","dossier","cible","difficulte"}]} (un jeu par difficulté)
 * Norman change de jeu en envoyant un autre dossier et en éditant jeux.json : aucun code à modifier.
 * La route est publique (ce sont des fichiers de jeu, jamais des données de joueur) ; elle gère les requêtes partielles (Range), l'ETag et la revalidation.
 * INTERRUPTEUR (Norman, 2026-11-22 : « il ne faut pas qu'il soit accessible aux joueurs pour le moment ») : tout est FERMÉ tant que l'objet R2 `scummvm/ouvert` n'existe pas (le contenu n'importe pas) :
 * la route répond 404 pour tous les fichiers et `GET /api/idle/scummvm/ouvert` répond {"ouvert":false} (le client cache alors le menu). Ouvrir : envoyer un objet `scummvm/ouvert` ; fermer : le supprimer
 * (wrangler r2 object put|delete soreal/scummvm/ouvert --remote) ; effet en moins d'une minute (mémo de l'isolat).
 * Anti-spoil (règle n°2) : le catalogue est une liste de jeux, pas de contenu de jeu de Soreal ; le client n'affiche que le jeu de la difficulté courante.
 */
export const IDLE_SCUMMVM_PREFIXE_R2_V1 = "scummvm/";
export const IDLE_SCUMMVM_PREFIXE_URL_V1 = "/api/idle/scummvm/";

const TYPES_V1 = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".wasm": "application/wasm", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".css": "text/css; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".zip": "application/zip" };

/* Clé R2 sûre : segments de lettres, chiffres, point, tiret, souligné, espace ; jamais « .. » ni segment vide ni caractère de contrôle. null si invalide. */
export function idleScummvmCleV1(chemin) {
  let brut = String(chemin || "");
  try { brut = decodeURIComponent(brut); } catch (e) { return null; }
  /* le moteur concatène parfois le dossier de sa page et un chemin absolu (« moteur//data/plugins/libsky.so », mesuré le 2026-11-22) : les barres répétées sont ramenées à une seule. */
  brut = brut.replace(/\/{2,}/g, "/");
  if (!brut || brut.length > 300 || /[\u0000-\u001f\\]/.test(brut) || brut.startsWith("/") || brut.endsWith("/")) return null;
  const segments = brut.split("/");
  for (const s of segments) if (!s || s === "." || s === ".." || !/^[A-Za-z0-9._ \-+()]+$/.test(s)) return null;
  return IDLE_SCUMMVM_PREFIXE_R2_V1 + segments.join("/");
}

function typeDe(cle) {
  const m = /\.[A-Za-z0-9]+$/.exec(cle);
  return (m && TYPES_V1[m[0].toLowerCase()]) || "application/octet-stream";
}

/* Cache : le moteur change rarement (une semaine) ; les jeux et le catalogue sont revalidés à chaque fois (ETag : 304 sans retélécharger) pour qu'un jeu remplacé soit pris tout de suite. */
function cacheDe(cle) {
  return cle.startsWith(IDLE_SCUMMVM_PREFIXE_R2_V1 + "moteur/") ? "public, max-age=604800" : "no-cache";
}

/* Requête partielle « bytes=a-b » (un seul intervalle) -> {offset, length} ou null (aucune) ou "invalide". */
export function idleScummvmIntervalleV1(entete, taille) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(String(entete || "").trim());
  if (!m || (m[1] === "" && m[2] === "")) return entete ? "invalide" : null;
  let debut; let fin;
  if (m[1] === "") { const n = Number(m[2]); if (!(n > 0)) return "invalide"; debut = Math.max(0, taille - n); fin = taille - 1; }
  else { debut = Number(m[1]); fin = m[2] === "" ? taille - 1 : Math.min(Number(m[2]), taille - 1); }
  if (!(debut <= fin) || debut >= taille) return "invalide";
  return { offset: debut, length: fin - debut + 1 };
}

/* Le moteur lit ses données et sa config en chemins ABSOLUS depuis la racine de l'origine (/data/index.json, /data/*.dat, /data/plugins/*.so, /scummvm.ini) : ces chemins sont aliasés vers
 * scummvm/moteur/… (mesuré le 2026-11-22 ; la maquette servait le moteur à la racine). Renvoie le chemin /api/idle/scummvm/… ou null si la requête n'est pas pour le moteur. */
export function idleScummvmAliasV1(pathname) {
  const p = String(pathname || "");
  if (p === "/scummvm.ini" || p.startsWith("/data/")) return IDLE_SCUMMVM_PREFIXE_URL_V1 + "moteur" + p;
  return null;
}

const MEMO_OUVERT_MS_V1 = 30000;
let memoOuvert = { t: 0, valeur: false };
/* Vrai si l'objet R2 `scummvm/ouvert` existe. Mémo court : un Worker sert beaucoup de requêtes pendant le chargement du moteur ; aucune exception ne remonte (faux). */
export async function idleScummvmOuvertV1(env, maintenant = Date.now()) {
  if (!env || !env.SOREAL_R2 || typeof env.SOREAL_R2.head !== "function") return false;
  if (maintenant - memoOuvert.t < MEMO_OUVERT_MS_V1 && maintenant >= memoOuvert.t) return memoOuvert.valeur;
  let valeur = false;
  try { valeur = Boolean(await env.SOREAL_R2.head(IDLE_SCUMMVM_PREFIXE_R2_V1 + "ouvert")); } catch (e) { valeur = false; }
  memoOuvert = { t: maintenant, valeur };
  return valeur;
}
export function idleScummvmOublierMemoV1() { memoOuvert = { t: 0, valeur: false }; }

export async function idleScummvmRepondreV1(request, env, url) {
  const methode = request.method;
  if (methode !== "GET" && methode !== "HEAD") return new Response("Méthode refusée", { status: 405, headers: { allow: "GET, HEAD" } });
  const reste = url.pathname.slice(IDLE_SCUMMVM_PREFIXE_URL_V1.length);
  const ouvert = await idleScummvmOuvertV1(env);
  if (reste === "ouvert") return new Response(JSON.stringify({ ouvert }), { status: 200, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
  if (!ouvert) return new Response("Introuvable", { status: 404, headers: { "cache-control": "no-store" } });
  const cle = idleScummvmCleV1(reste);
  if (!cle) return new Response("Chemin invalide", { status: 400, headers: { "cache-control": "no-store" } });
  if (!env || !env.SOREAL_R2 || typeof env.SOREAL_R2.get !== "function") return new Response("Média indisponible", { status: 503, headers: { "cache-control": "no-store" } });
  const tete = await env.SOREAL_R2.head(cle);
  if (!tete) return new Response("Introuvable", { status: 404, headers: { "cache-control": "public, max-age=30" } });
  const entetes = new Headers();
  entetes.set("content-type", typeDe(cle));
  entetes.set("cache-control", cacheDe(cle));
  entetes.set("accept-ranges", "bytes");
  entetes.set("x-content-type-options", "nosniff");
  if (tete.httpEtag) entetes.set("etag", tete.httpEtag);
  const sonEtag = request.headers.get("if-none-match");
  if (sonEtag && tete.httpEtag && sonEtag === tete.httpEtag) return new Response(null, { status: 304, headers: entetes });
  const taille = Number(tete.size) || 0;
  const demande = request.headers.get("range");
  const inter = idleScummvmIntervalleV1(demande, taille);
  if (inter === "invalide") { entetes.set("content-range", "bytes */" + taille); return new Response("Intervalle invalide", { status: 416, headers: entetes }); }
  if (inter) {
    entetes.set("content-range", "bytes " + inter.offset + "-" + (inter.offset + inter.length - 1) + "/" + taille);
    entetes.set("content-length", String(inter.length));
    if (methode === "HEAD") return new Response(null, { status: 206, headers: entetes });
    const partie = await env.SOREAL_R2.get(cle, { range: { offset: inter.offset, length: inter.length } });
    return new Response(partie ? partie.body : null, { status: partie ? 206 : 404, headers: entetes });
  }
  entetes.set("content-length", String(taille));
  if (methode === "HEAD") return new Response(null, { status: 200, headers: entetes });
  const objet = await env.SOREAL_R2.get(cle);
  return new Response(objet ? objet.body : null, { status: objet ? 200 : 404, headers: entetes });
}
