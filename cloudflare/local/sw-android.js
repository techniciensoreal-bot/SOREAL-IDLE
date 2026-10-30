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
  html: "text/html; charset=utf-8", js: "text/javascript; charset=utf-8", css: "text/css; charset=utf-8", json: "application/json; charset=utf-8", webmanifest: "application/manifest+json",
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
function creerR2() {
  let index = null;
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
      const cles = [...idx.keys()].filter((k) => k.startsWith(prefixe) && !k.startsWith("_externes/")).sort();
      const objets = [], prefixes = new Set();
      let i = depart;
      for (; i < cles.length && objets.length + prefixes.size < limite; i += 1) {
        const k = cles[i];
        if (delimiteur) {
          const reste = k.slice(prefixe.length), pos = reste.indexOf(delimiteur);
          if (pos >= 0) { prefixes.add(prefixe + reste.slice(0, pos + delimiteur.length)); continue; }
        }
        objets.push(objet(k, Number(idx.get(k))));
      }
      const tronque = i < cles.length;
      return { objects: objets, delimitedPrefixes: [...prefixes], truncated: tronque, cursor: tronque ? String(i) : undefined };
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

async function demarrer() {
  const SQL = await initSqlJs({ locateFile: () => "/sql-wasm-v1.wasm" });
  const octets = await idbLire("sqlite");
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
  /*
   * Graine du contenu de la production : d'abord celle qui voyage dans les mises à jour (public/graine-contenu-v1.json, remplacée par le paquet de code de la mise à jour), sinon celle embarquée dans l'APK (/__graine.json).
   * Re-appliquée à chaque démarrage où son empreinte diffère (catalogue, textes et empreintes de voix, histoires) ; la feuille JOUEURS n'est jamais touchée ; une graine absente ou invalide n'écrase rien (idle-graine-contenu-v1.js).
   */
  const graine = await (async () => {
    for (const url of ["/graine-contenu-v1.json", "/__graine.json"]) {
      try { const g = await fetch(url); if (g.ok) { const j = await g.json(); if (graineValideV1(j)) return j; } } catch (_e) { /* suivante */ }
    }
    return null;
  })();
  const premiere = semerSiVide(sql, graine);
  const contenu = appliquerGraineContenuV1(sql, graine);
  const stub = { fetch: (requete) => coord.fetch(requete) };
  const env = {
    SOREAL_IDLE: { idFromName: () => ({ nom: "global" }), get: () => stub },
    ASSETS,
    SOREAL_R2: creerR2(),
    CF_VERSION_METADATA: { id: "android" },
    GOOGLE_CLIENT_ID: ""
  };
  /* Session du joueur local : la même d'un lancement à l'autre tant qu'elle vaut encore deux jours (la table des sessions est dans la base gardée). */
  let session = await idbLire("session");
  const valide = session && session.token && Number(session.expiresAt) > Date.now() + 2 * 86400000
    && sql.exec("SELECT COUNT(*) AS n FROM idle_sessions WHERE session_token=?", session.token)[0].n > 0;
  if (!valide) {
    const s = coord.createGoogleSessionV1({ email: JOUEUR.email, nom: JOUEUR.prenom });
    if (!s || !s.ok) throw new Error("SESSION_LOCALE_REFUSEE:" + (s && s.error));
    session = { token: s.sessionToken, expiresAt: s.expiresAt };
    await idbEcrire("session", session);
  }
  etat = { db, sql, coord, env, session, SQL };
  if (premiere || contenu.applique || !octets) await sauvegarder(true);
  return etat;
}

function init() { return pret || (pret = demarrer().catch((e) => { pret = null; throw e; })); }

/* Exporte la base dans IndexedDB (au plus une fois toutes les 4 s, sauf demande) ; l'export de sql.js libère les requêtes préparées, ce qui est sans effet ici (chaque appel en prépare une). */
function sauvegarder(force) {
  if (!etat) return Promise.resolve();
  if (!force && Date.now() - derniereSauvegarde < 4000) return Promise.resolve();
  if (sauvegardeEnCours) return sauvegardeEnCours;
  sauvegardeEnCours = (async () => {
    try {
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

async function repondre(requete) {
  const e = await init();
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
  ev.respondWith(repondre(req).catch((err) => new Response(JSON.stringify({ ok: false, error: "APK_HORS_LIGNE:" + String((err && err.message) || err) }), { status: 500, headers: { "content-type": "application/json" } })));
  if (req.method !== "GET" && req.method !== "HEAD") ev.waitUntil(sauvegarder(false));
});
