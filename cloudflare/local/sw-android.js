/*
 * SOREAL IDLE pour Android, HORS LIGNE (Norman, 2026-10-28 : « il faut l'apk hors ligne »). Même idée que l'application Windows (desktop/src/env-local.mjs) : le VRAI Worker de production
 * (cloudflare/src/idle-worker-entry-v1.js) tourne sur l'appareil, ici dans le service worker de la WebView de l'APK, avec les trois « bindings » Cloudflare remplacés :
 *  - SOREAL_IDLE (Durable Object) : un seul coordinateur, sur une base SQLite (sql.js) gardée dans IndexedDB ;
 *  - ASSETS : les fichiers du jeu embarqués dans l'APK (la WebView les sert elle-même, voir MainActivity.java) ;
 *  - SOREAL_R2 : les médias (images, voix, musiques) embarqués dans l'APK, avec les mêmes clés que le bucket « soreal » (/__medias/<clé>), indexés par /__medias/_index.json.
 * Rien n'est réécrit : mêmes routes, même logique, mêmes réponses que le serveur. Construit par android/construire-hors-ligne.mjs, publié DANS l'APK sous le nom sw-idle-v1.js (c'est le service
 * worker que la page enregistre déjà : standalone-bridge.js), jamais sur le site en ligne.
 */
import initSqlJs from "sql.js/dist/sql-wasm-browser.js";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import entree from "../src/idle-worker-entry-v1.js";
import { appliquerGraineContenuV1, graineValideV1 } from "../src/idle-graine-contenu-v1.js";

const BASE_IDB = "soreal-idle-android-v1";
const EN_TETE_JOUEURS = ["ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force","Endurance","Organisation","Puissance","Boss actuel","PV boss","PV boss max","Boss vaincus","Dernière synchro","Public","Rang","Email principal","Email connexion","Pièces","Inventaire JSON","Équipement JSON","Améliorations JSON","Renaissances","Essence renaissance","PV joueur","PV joueur max","KO jusqu'à","Zone aventure","Progression aventure JSON","Points aventure","Dernière action aventure","Matériaux","Collection JSON","Date début","Capacité inventaire","Stats JSON"];
const JOUEUR = { email: "joueur@soreal-idle.local", prenom: "Joueur" };

const TYPES = {
  html: "text/html; charset=utf-8", js: "text/javascript; charset=utf-8", mjs: "text/javascript; charset=utf-8", tflite: "application/octet-stream", css: "text/css; charset=utf-8", json: "application/json; charset=utf-8", webmanifest: "application/manifest+json",
  wasm: "application/wasm", svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", ico: "image/x-icon",
  woff2: "font/woff2", woff: "font/woff", ttf: "font/ttf", m4a: "audio/mp4", mp3: "audio/mpeg", opus: "audio/ogg", ogg: "audio/ogg", wav: "audio/wav", onnx: "application/octet-stream", mp4: "video/mp4", webm: "video/webm"
};
const typeDe = (cle) => TYPES[String(cle).split("?")[0].split(".").pop().toLowerCase()] || "application/octet-stream";

/* ---------- IndexedDB : la base SQLite exportée + la session ---------- */
function ouvrirIdb() {
  return new Promise((ok, ko) => {
    const r = indexedDB.open(BASE_IDB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("kv");
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
  });
}
async function idbLire(cle) {
  const idb = await ouvrirIdb();
  return new Promise((ok, ko) => { const q = idb.transaction("kv").objectStore("kv").get(cle); q.onsuccess = () => { idb.close(); ok(q.result); }; q.onerror = () => { idb.close(); ko(q.error); }; });
}
async function idbEcrire(cle, valeur) {
  const idb = await ouvrirIdb();
  return new Promise((ok, ko) => { const t = idb.transaction("kv", "readwrite"); t.objectStore("kv").put(valeur, cle); t.oncomplete = () => { idb.close(); ok(); }; t.onerror = () => { idb.close(); ko(t.error); }; t.onabort = () => { idb.close(); ko(t.error); }; });
}

/* ---------- sql : même interface que le « sql » d'un Durable Object ---------- */
function creerSql(base) {
  return {
    exec(q, ...b) {
      const st = base.prepare(q);
      try {
        if (b.length) st.bind(b);
        const out = [];
        while (st.step()) out.push(st.getAsObject());
        return out;
      } finally { st.free(); }
    }
  };
}

/* Première ouverture seulement : feuilles de catalogue de la production (graine embarquée) + feuille des joueurs (jamais celle des autres joueurs ni CLASSEMENT). */
function semerSiVide(sql, graine) {
  const nb = sql.exec("SELECT COUNT(*) AS n FROM idle_catalog")[0];
  if (nb && Number(nb.n) > 0) return false;
  const triplets = graine && Array.isArray(graine.feuilles) ? graine.feuilles.filter((f) => Array.isArray(f) && typeof f[0] === "string" && typeof f[2] === "string" && f[0] !== "JOUEURS" && f[0] !== "CLASSEMENT") : [];
  if (!triplets.length) throw new Error("GRAINE_ABSENTE");
  const maintenant = Date.now();
  for (const f of triplets) sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", f[0], Number(f[1]) || 1, f[2], maintenant);
  sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "JOUEURS", 1, JSON.stringify(EN_TETE_JOUEURS), maintenant);
  return true;
}

/* ---------- ASSETS : la WebView sert les fichiers de l'APK ; ce service worker les lui demande comme n'importe quel fichier du site ---------- */
const ASSETS = {
  async fetch(requete) {
    const url = new URL(requete.url);
    let chemin = url.pathname;
    if (chemin.endsWith("/")) chemin += "index.html";
    return fetch(url.origin + chemin, { method: requete.method === "HEAD" ? "HEAD" : "GET" });
  }
};

/* ---------- SOREAL_R2 : /__medias/<clé>, index des clés dans /__medias/_index.json ({ clé: taille }) ---------- */
function borneInferieure(tableau, x) {
  let a = 0, b = tableau.length;
  while (a < b) { const m = (a + b) >> 1; if (tableau[m] < x) a = m + 1; else b = m; }
  return a;
}
function creerR2() {
  let index = null, triees = null;
  async function charger() {
    if (index) return index;
    const rep = await fetch("/__medias/_index.json");
    if (!rep.ok) throw new Error("INDEX_MEDIAS_ABSENT");
    index = new Map(Object.entries(await rep.json()));
    return index;
  }
  const adresse = (cle) => "/__medias/" + String(cle).split("/").map(encodeURIComponent).join("/");
  const objet = (cle, taille) => {
    const ct = typeDe(cle);
    const etag = (taille.toString(16) + "-" + cle.length.toString(16) + cle.slice(-6).replace(/[^a-z0-9]/gi, "")).slice(0, 24);
    const o = {
      key: cle, size: taille, etag, httpEtag: '"' + etag + '"', uploaded: new Date(0),
      httpMetadata: { contentType: ct }, customMetadata: {},
      writeHttpMetadata(h) { h.set("content-type", ct); },
      async arrayBuffer() { return (await fetch(adresse(cle))).arrayBuffer(); },
      async text() { return (await fetch(adresse(cle))).text(); },
      async json() { return (await fetch(adresse(cle))).json(); }
    };
    return o;
  };
  return {
    async get(cle) {
      const idx = await charger();
      const taille = idx.get(String(cle));
      if (taille === undefined) return null;
      const o = objet(String(cle), Number(taille));
      /* Les appelants passent o.body directement à new Response() : un flux, pas une promesse. */
      const rep = await fetch(adresse(cle));
      o.body = rep.body;
      return o;
    },
    async head(cle) {
      const idx = await charger();
      const taille = idx.get(String(cle));
      return taille === undefined ? null : objet(String(cle), Number(taille));
    },
    async list(options = {}) {
      const idx = await charger();
      const prefixe = String(options.prefix || ""), delimiteur = options.delimiter ? String(options.delimiter) : "";
      const limite = Math.max(1, Math.min(1000, Number(options.limit) || 1000));
      const depart = Math.max(0, Number(options.cursor) || 0);
      /* Clés triées UNE fois par réveil (avant : filtre + tri des ~5 000 clés à chaque list(), appelé par plusieurs routes de médias) ; le préfixe est une tranche contiguë de la liste triée. */
      const toutes = triees || (triees = [...idx.keys()].filter((k) => !k.startsWith("_externes/")).sort());
      const debut = borneInferieure(toutes, prefixe);
      let fin = debut;
      while (fin < toutes.length && toutes[fin].startsWith(prefixe)) fin += 1;
      const objets = [], prefixes = new Set();
      let i = debut + depart;
      for (; i < fin && objets.length + prefixes.size < limite; i += 1) {
        const k = toutes[i];
        if (delimiteur) {
          const reste = k.slice(prefixe.length), pos = reste.indexOf(delimiteur);
          if (pos >= 0) { prefixes.add(prefixe + reste.slice(0, pos + delimiteur.length)); continue; }
        }
        objets.push(objet(k, Number(idx.get(k))));
      }
      const tronque = i < fin;
      return { objects: objets, delimitedPrefixes: [...prefixes], truncated: tronque, cursor: tronque ? String(i - debut) : undefined };
    },
    /* L'APK est en lecture seule : les téléversements d'administration (voix, histoires) n'y ont pas de sens. */
    async put() { throw new Error("APK_LECTURE_SEULE"); },
    async delete() { throw new Error("APK_LECTURE_SEULE"); }
  };
}

/* ---------- démarrage ---------- */
let etat = null;      // { db, sql, coord, env, session }
let pret = null;
let derniereSauvegarde = 0;
let sauvegardeEnCours = null;

/* Empreinte FNV sur deux voies des OCTETS d'un fichier (une seule passe, sans décodage ni JSON.stringify). */
function empreinteOctets(tampon) {
  const o = new Uint8Array(tampon);
  let a = 0x811c9dc5, b = 0x01000193 ^ o.length;
  for (let i = 0; i < o.length; i += 1) { const c = o[i]; a = Math.imul(a ^ c, 0x01000193); b = Math.imul(b ^ c ^ (a >>> 7), 0x85ebca6b); }
  return (a >>> 0).toString(16).padStart(8, "0") + (b >>> 0).toString(16).padStart(8, "0") + "-" + o.length.toString(16);
}
const URLS_GRAINE = ["/graine-contenu-v1.json", "/__graine.json"];
/* Premier fichier de graine lisible à partir du rang « debut » : { rang, id, tampon } (id = adresse + empreinte des octets). Rien n'est analysé ici. */
async function lireGraineBrute(debut) {
  for (let k = debut; k < URLS_GRAINE.length; k += 1) {
    try { const g = await fetch(URLS_GRAINE[k]); if (g.ok) { const tampon = await g.arrayBuffer(); return { rang: k, id: URLS_GRAINE[k] + "|" + empreinteOctets(tampon), tampon }; } } catch (_e) { /* suivante */ }
  }
  return null;
}
function analyserGraine(brute) {
  try { const j = JSON.parse(new TextDecoder().decode(brute.tampon)); return graineValideV1(j) ? j : null; } catch (_e) { return null; }
}
function lireMeta(sql, cle) {
  try { const r = sql.exec("SELECT meta_value AS v FROM idle_meta WHERE meta_key=?", cle)[0]; return r ? String(r.v) : ""; } catch (_e) { return ""; }
}

/*
 * Lignes des joueurs (la partie) gardées À PART dans IndexedDB, à chaque changement (Norman, 2026-11-01 : « l'APK est beaucoup moins fluide »). Avant, CHAQUE écriture (la page envoie sa partie toutes les 10 s) exportait TOUTE la base SQLite (catalogue, textes,
 * histoires : plusieurs Mo) puis l'écrivait dans IndexedDB. Maintenant la ligne du joueur (≈ 100 à 200 Ko) est écrite seule, tout de suite et AVANT la réponse à l'envoi de la page (qui efface alors sa propre copie) ; la base entière n'est plus exportée qu'au plus
 * toutes les 2 minutes (tables lentes : sessions, présence, sauvegardes de sécurité), à la création d'une ligne ou d'une session, et au premier démarrage. Au réveil, les lignes gardées remplacent celles de la base exportée (elles sont toujours au moins aussi récentes).
 */
const BASE_COMPLETE_MS = 120000;
let derniereLignes = null, gardeEnCours = null, gardeARefaire = false, baseCompleteRequise = false;
function lireLignes(sql) {
  return sql.exec("SELECT row_index AS i,row_json AS j FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index>1 ORDER BY row_index").map((r) => [Number(r.i), String(r.j)]);
}
function memesLignes(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let k = 0; k < a.length; k += 1) if (a[k][0] !== b[k][0] || a[k][1] !== b[k][1]) return false;
  return true;
}
function appliquerLignesGardees(sql, lignes) {
  for (const l of lignes) {
    if (!Array.isArray(l) || typeof l[1] !== "string") continue;
    const ex = sql.exec("SELECT row_json AS j FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=?", Number(l[0]))[0];
    if (ex && String(ex.j) !== l[1]) sql.exec("UPDATE idle_catalog SET row_json=?,updated_at=? WHERE sheet_name='JOUEURS' AND row_index=?", l[1], Date.now(), Number(l[0]));
  }
}
function gardeLigne() {
  if (!etat) return Promise.resolve();
  if (gardeEnCours) { gardeARefaire = true; return gardeEnCours; }
  gardeEnCours = (async () => {
    await null;   /* le « finally » ne doit jamais s'exécuter avant l'affectation ci-dessus (aucune attente sur le chemin « rien de changé ») */
    try {
      do {
        gardeARefaire = false;
        const lignes = lireLignes(etat.sql);
        if (memesLignes(lignes, derniereLignes)) continue;
        const nouvelle = !derniereLignes || lignes.length !== derniereLignes.length || lignes.some((l, k) => l[0] !== derniereLignes[k][0]);
        await idbEcrire("lignes", lignes);
        derniereLignes = lignes;
        if (nouvelle) baseCompleteRequise = true;
      } while (gardeARefaire);
    } catch (_e) { /* IndexedDB refuse : la prochaine requête réessaie (derniereLignes n'a pas bougé) */ }
    finally { gardeEnCours = null; }
  })();
  return gardeEnCours;
}

async function demarrer() {
  /* Tout ce qui est indépendant part en parallèle (avant : wasm, puis base, puis graine, puis session, l'un après l'autre à chaque réveil). */
  const [SQL, octets, lignesGardees, sessionIdb, graineBrute] = await Promise.all([
    initSqlJs({ locateFile: () => "/sql-wasm-v1.wasm" }),
    idbLire("sqlite"),
    idbLire("lignes").catch(() => null),
    idbLire("session"),
    lireGraineBrute(0)
  ]);
  const db = octets ? new SQL.Database(new Uint8Array(octets)) : new SQL.Database();
  const sql = creerSql(db);
  db.run("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
  const coord = new SorealIdleCoordinatorV1({ storage: { sql } }, {});
  const migrations = sql.exec("SELECT COUNT(*) AS n FROM migration_sources WHERE source_key LIKE 'idle:%' AND status='DONE'")[0];
  if (!migrations || Number(migrations.n) < 15) {
    for (let i = 0; i < 15; i += 1) sql.exec("INSERT OR REPLACE INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
  }
  /* Le jeu est ouvert au joueur de cet appareil : « accès public » du serveur, posé une fois. */
  sql.exec("INSERT INTO idle_meta(meta_key,meta_value) VALUES('acces_public','1') ON CONFLICT(meta_key) DO UPDATE SET meta_value='1'");
  /* Les lignes de joueurs gardées à part sont au moins aussi récentes que la base exportée. */
  if (octets && Array.isArray(lignesGardees)) appliquerLignesGardees(sql, lignesGardees);
  /*
   * Graine du contenu de la production : d'abord celle qui voyage dans les mises à jour (public/graine-contenu-v1.json, remplacée par le paquet de code de la mise à jour), sinon celle embarquée dans l'APK (/__graine.json).
   * Re-appliquée à chaque démarrage où son empreinte diffère (catalogue, textes et empreintes de voix, histoires) ; la feuille JOUEURS n'est jamais touchée ; une graine absente ou invalide n'écrase rien (idle-graine-contenu-v1.js).
   * Réveil rapide (2026-11-01) : l'empreinte des OCTETS du fichier est gardée DANS la base (idle_meta « graine_texte_id », elle voyage donc avec l'export) ; si elle n'a pas changé, le fichier n'est ni décodé, ni analysé, ni ré-empreint (avant : JSON.parse + JSON.stringify
   * + empreinte de 500 Ko à chaque réveil du service worker).
   */
  let premiere = false, contenu = { applique: false }, baseASauver = false;
  const aJour = Boolean(graineBrute) && lireMeta(sql, "graine_texte_id") === graineBrute.id && lireMeta(sql, "graine_empreinte") !== "";
  if (!aJour) {
    let brute = graineBrute, graine = brute ? analyserGraine(brute) : null;
    if (brute && !graine) { brute = await lireGraineBrute(brute.rang + 1); graine = brute ? analyserGraine(brute) : null; }
    premiere = semerSiVide(sql, graine);
    contenu = appliquerGraineContenuV1(sql, graine);
    if (graine && brute && (contenu.applique || contenu.raison === "A_JOUR")) {
      sql.exec("INSERT INTO idle_meta(meta_key,meta_value) VALUES('graine_texte_id',?) ON CONFLICT(meta_key) DO UPDATE SET meta_value=excluded.meta_value", brute.id);
      baseASauver = true;
    }
  }
  const stub = { fetch: (requete) => coord.fetch(requete) };
  const env = {
    SOREAL_IDLE: { idFromName: () => ({ nom: "global" }), get: () => stub },
    ASSETS,
    SOREAL_R2: r2Partage || (r2Partage = creerR2()),
    CF_VERSION_METADATA: { id: "android" },
    GOOGLE_CLIENT_ID: ""
  };
  /* Session du joueur local : la même d'un lancement à l'autre tant qu'elle vaut encore deux jours (la table des sessions est dans la base gardée). */
  let session = sessionIdb;
  const valide = session && session.token && Number(session.expiresAt) > Date.now() + 2 * 86400000
    && sql.exec("SELECT COUNT(*) AS n FROM idle_sessions WHERE session_token=?", session.token)[0].n > 0;
  if (!valide) {
    const s = coord.createGoogleSessionV1({ email: JOUEUR.email, nom: JOUEUR.prenom });
    if (!s || !s.ok) throw new Error("SESSION_LOCALE_REFUSEE:" + (s && s.error));
    session = { token: s.sessionToken, expiresAt: s.expiresAt };
    await idbEcrire("session", session);
    baseASauver = true;   /* la session doit être dans la base gardée, sinon elle serait refusée au réveil suivant */
  }
  derniereLignes = lireLignes(sql);
  etat = { db, sql, coord, env, session, SQL };
  if (premiere || contenu.applique || !octets || baseASauver) await sauvegarder(true);
  return etat;
}

function init() { return pret || (pret = demarrer().catch((e) => { pret = null; throw e; })); }

/* Exporte la base entière dans IndexedDB : au plus une fois toutes les 2 minutes (sauf demande) ; l'export de sql.js libère les requêtes préparées, ce qui est sans effet ici (chaque appel en prépare une). Les lignes des joueurs, elles, sont gardées à chaque changement (gardeLigne). */
function sauvegarder(force, ecriture) {
  if (!etat) return Promise.resolve();
  if (!force && !baseCompleteRequise && !(ecriture && Date.now() - derniereSauvegarde >= BASE_COMPLETE_MS)) return Promise.resolve();
  if (sauvegardeEnCours) return sauvegardeEnCours;
  sauvegardeEnCours = (async () => {
    try {
      await gardeLigne();
      baseCompleteRequise = false;
      const octets = etat.db.export();
      await idbEcrire("sqlite", octets.buffer.slice(octets.byteOffset, octets.byteOffset + octets.byteLength));
      derniereSauvegarde = Date.now();
    } catch (_e) { /* la base du service worker n'est qu'une copie : le moteur de la page garde la partie dans son propre IndexedDB */ }
    finally { sauvegardeEnCours = null; }
  })();
  return sauvegardeEnCours;
}

function scriptSession(session) {
  return '<script>try{localStorage.setItem("soreal_idle_google_session_v1",' + JSON.stringify(JSON.stringify({ token: session.token, expiresAt: session.expiresAt })) + ');}catch(_e){}</script>';
}

/*
 * Images lentes sur l'APK (Norman, 2026-11-01 : « les images clignotent, il galère à charger ce qu'il a en mémoire ; la fluidité est beaucoup moindre que l'APK en ligne »). Cause : tout /api/ passe par ce service worker, et Android l'arrête après quelques secondes d'inactivité ; à chaque réveil,
 * la moindre image attendait init() : démarrage de sql.js, chargement de la base depuis IndexedDB, application de la graine du contenu. Deux remèdes :
 *  1) les routes d'images n'ont pas besoin du moteur : elles tournent avec un env LÉGER dont le coordinateur ne démarre qu'à la première utilisation (envLeger) ;
 *  2) une image déjà vue est rendue tout de suite par le Cache API, sans même réveiller le Worker. Elle n est relue en arrière-plan que si sa copie a plus de 6 h (en-tête x-garde-le : une image remplacée par une mise à jour des médias apparaît à la vue suivante) ;
 *     avant, CHAQUE réveil du service worker relisait en arrière-plan chaque image affichée (R2, index, moteur léger) : des dizaines de requêtes inutiles par réveil, au moment même où la page en demandait d autres.
 * Bornes : images d'au plus 300 Ko, 600 entrées (les plus anciennes partent d'abord).
 */
const CACHE_IMAGES = "soreal-idle-images-v1";
const IMAGE_MAX_OCTETS = 300 * 1024, IMAGES_MAX = 600;
const REFRAICHIR_APRES_MS = 6 * 3600 * 1000;
const rafraichies = new Set();
let ajouts = 0;
function envLeger() {
  if (etat) return etat.env;
  const stub = { fetch: async (requete) => (await init()).coord.fetch(requete) };
  return { SOREAL_IDLE: { idFromName: () => ({ nom: "global" }), get: () => stub }, ASSETS, SOREAL_R2: r2Partage || (r2Partage = creerR2()), CF_VERSION_METADATA: { id: "android" }, GOOGLE_CLIENT_ID: "" };
}
let r2Partage = null;
const routeMedia = (url) => url.pathname.startsWith("/api/idle/media/");
async function garderImage(cache, cle, rep) {
  try {
    const ct = rep.headers.get("content-type") || "";
    const taille = Number(rep.headers.get("content-length")) || 0;
    if (rep.status !== 200 || !ct.startsWith("image/") || (taille && taille > IMAGE_MAX_OCTETS)) return;
    const copie = rep.clone();
    const octets = await copie.arrayBuffer();
    if (octets.byteLength > IMAGE_MAX_OCTETS) return;
    await cache.put(cle, new Response(octets, { status: 200, headers: { "content-type": ct, "cache-control": "no-cache", "x-garde-le": String(Date.now()) } }));
    /* Ménage seulement de temps en temps (cache.keys() liste toute la base à chaque appel). */
    if (++ajouts % 25 === 0) { const cles = await cache.keys(); for (let i = 0; i < cles.length - IMAGES_MAX; i += 1) await cache.delete(cles[i]); }
  } catch (_e) { /* pas de copie : l'image est tout de même rendue */ }
}
async function repondreImage(ev, requete, url) {
  const cache = await caches.open(CACHE_IMAGES);
  const cle = url.pathname + url.search;
  const deja = await cache.match(cle);
  const frais = async () => { const rep = await repondre(requete, true); ev.waitUntil(garderImage(cache, cle, rep.clone())); return rep; };
  if (deja) {
    const age = Date.now() - (Number(deja.headers.get("x-garde-le")) || 0);
    if (age > REFRAICHIR_APRES_MS && !rafraichies.has(cle)) { rafraichies.add(cle); ev.waitUntil(frais().catch(() => {})); }
    return deja;
  }
  return frais();
}

async function repondre(requete, leger) {
  const e = leger ? { env: envLeger() } : await init();
  /* Une requête de navigation ne peut pas être recopiée par le Worker (new Request(req, …) la refuse) : on la refait telle quelle, en requête ordinaire. */
  if (requete.mode === "navigate") requete = new Request(requete.url, { method: requete.method, headers: requete.headers });
  const chemin = new URL(requete.url).pathname;
  /* Voix de secours (Piper) : le Worker de production va chercher son modèle sur un dépôt externe ; ici la copie embarquée est servie directement. */
  if ((requete.method === "GET" || requete.method === "HEAD") && (chemin === "/api/idle/media/piper-model.onnx" || chemin === "/api/idle/media/piper-model.onnx.json")) {
    const rep = await fetch("/__medias/_externes/" + chemin.split("/").pop(), { method: requete.method });
    if (rep.ok) return rep;
  }
  const rep = await entree.fetch(requete, e.env, { waitUntil() {}, passThroughOnException() {} });
  if (requete.method === "GET" && (chemin === "/" || chemin === "/index.html") && rep.ok && (rep.headers.get("content-type") || "").includes("text/html")) {
    const html = (await rep.text()).replace(/<head[^>]*>/i, (m) => m + scriptSession(e.session));
    const entetes = new Headers(rep.headers);
    entetes.delete("content-length");
    return new Response(html, { status: rep.status, headers: entetes });
  }
  return rep;
}

function reponseJson(donnees) {
  return new Response(JSON.stringify(donnees), { status: 200, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-soreal-now": String(Date.now()) } });
}
const BATTEMENT_REEL_MS = 90000;
let dernierBattement = null;   // { jeton, at, donnees }
async function appelerApi(requete) {
  let corps = null;
  try { corps = JSON.parse(await requete.clone().text()); } catch (_e) { corps = null; }
  if (corps && corps.operation === "battementSorealIdle") {
    const jeton = (requete.headers.get("authorization") || "").replace(/^Bearers+/i, "");
    const info = Array.isArray(corps.args) ? corps.args.find((a) => a && typeof a === "object") : null;
    const amorce = Boolean(info && info.amorceFlux === true);
    const c = dernierBattement;
    if (jeton && !amorce && c && c.jeton === jeton && Date.now() - c.at < BATTEMENT_REEL_MS) return reponseJson(Object.assign({}, c.donnees, { flux: [], maintenant: Date.now() }));
    const rep = await repondre(requete);
    if (jeton && rep.ok) { try { const d = await rep.clone().json(); if (d && d.ok) dernierBattement = { jeton, at: Date.now(), donnees: d }; } catch (_e) { /* réponse non JSON : pas gardée */ } }
    return rep;
  }
  return repondre(requete);
}

self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", (ev) => { ev.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (ev) => {
  const req = ev.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const p = url.pathname;
  if (p === "/__pret") {
    ev.respondWith(init().then(() => new Response("ok", { headers: { "cache-control": "no-store" } }), (err) => new Response(String((err && err.message) || err), { status: 500 })));
    return;
  }
  if (!(p === "/" || p === "/index.html" || p.startsWith("/api/"))) return;   // fichiers du jeu : la WebView les sert (APK)
  if (req.method === "GET" && routeMedia(url) && req.destination === "image" && !req.headers.get("range")) {
    ev.respondWith(repondreImage(ev, req, url).catch((err) => new Response("Image indisponible : " + String((err && err.message) || err), { status: 502 })));
    return;
  }
  /* Les autres routes de médias (voix, roster, listes…) n'ont pas non plus besoin du moteur au réveil : env léger, le coordinateur ne démarre que s'il est vraiment appelé. */
  if (req.method === "GET" && routeMedia(url)) {
    ev.respondWith(repondre(req, true).catch((err) => new Response(JSON.stringify({ ok: false, error: "APK_HORS_LIGNE:" + String((err && err.message) || err) }), { status: 500, headers: { "content-type": "application/json" } })));
    return;
  }
  /*
   * Routes de l'API que l'application hors ligne n'a aucune raison de faire travailler (2026-11-01) :
   *  - GET /api/v1/local/textes (la page l'appelle toutes les minutes) : les textes viennent de la graine, déjà dans l'export du démarrage ; seule une mise à jour de l'application les change (relancement). Réponse immédiate « rien de neuf », sans réveiller le moteur ;
   *  - battementSorealIdle (toutes les 20 s) : présence, temps de jeu, fil « En direct » d'un joueur seul sur son téléphone. Le vrai calcul n'a lieu qu'au plus toutes les 90 s (et au premier battement de la page) ; entre deux, la dernière réponse est rendue (sans événements).
   */
  if (req.method === "GET" && p === "/api/v1/local/textes") {
    ev.respondWith(Promise.resolve(reponseJson({ ok: false, error: "APK_TEXTES_LOCAUX" })));
    return;
  }
  const estPush = req.method === "POST" && p === "/api/v1/local/push";
  const travail = req.method === "POST" && p === "/api/v1/call" ? appelerApi(req) : repondre(req);
  ev.respondWith(travail.then(async (rep) => {
    /* La ligne du joueur est gardée à part (peu coûteuse) AVANT de répondre à un envoi de la page : elle efface sa propre copie dès qu'elle reçoit « ok ». Pour le reste : en arrière-plan. */
    if (etat) {
      const ecriture = req.method !== "GET" && req.method !== "HEAD";
      const garde = gardeLigne().catch(() => {});
      if (estPush) await garde;
      ev.waitUntil(garde.then(() => sauvegarder(false, ecriture)));
    }
    return rep;
  }).catch((err) => new Response(JSON.stringify({ ok: false, error: "APK_HORS_LIGNE:" + String((err && err.message) || err) }), { status: 500, headers: { "content-type": "application/json" } })));
});
