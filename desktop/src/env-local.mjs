/*
 * SOREAL IDLE pour Windows (Norman, 2026-10-28) : le VRAI Worker de production (cloudflare/src/idle-worker-entry-v1.js) tourne dans l'application, sur l'ordinateur du joueur, avec les trois « bindings » Cloudflare remplacés par des équivalents locaux :
 *  - SOREAL_IDLE (Durable Object) : un seul coordinateur, sur une base SQLite qui est un FICHIER du joueur (aucun serveur, aucune connexion) ;
 *  - ASSETS : le dossier cloudflare/public embarqué dans l'exécutable ;
 *  - SOREAL_R2 : le dossier des médias (images, voix, musiques) embarqué lui aussi, avec les mêmes clés que le bucket « soreal » : le code de résolution des images de production (idle-media-v1.js) fonctionne donc tel quel, hors ligne.
 * Rien n'est réécrit : les mêmes routes, la même logique, les mêmes réponses que le serveur.
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { pathToFileURL } from "node:url";
import { ENTETE, SURCOUT, lireEnClair, tailleEnClair } from "./coffre-medias.mjs";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json", ".wasm": "application/wasm", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".m4a": "audio/mp4", ".mp3": "audio/mpeg", ".opus": "audio/ogg", ".ogg": "audio/ogg", ".wav": "audio/wav", ".onnx": "application/octet-stream"
};
const typeDe = (f) => TYPES[path.extname(f).toLowerCase()] || "application/octet-stream";

/* ---------- base SQLite persistante (même interface que le « sql » d'un Durable Object) ---------- */
function ouvrirBase(chemin) {
  fs.mkdirSync(path.dirname(chemin), { recursive: true });
  const db = new DatabaseSync(chemin);
  db.exec("PRAGMA journal_mode=WAL");
  db.exec("PRAGMA synchronous=NORMAL");
  const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
  return { db, sql };
}

const EN_TETE_JOUEURS = ["ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force","Endurance","Organisation","Puissance","Boss actuel","PV boss","PV boss max","Boss vaincus","Dernière synchro","Public","Rang","Email principal","Email connexion","Pièces","Inventaire JSON","Équipement JSON","Améliorations JSON","Renaissances","Essence renaissance","PV joueur","PV joueur max","KO jusqu'à","Zone aventure","Progression aventure JSON","Points aventure","Dernière action aventure","Matériaux","Collection JSON","Date début","Capacité inventaire","Stats JSON"];

/* Première ouverture seulement : les feuilles de catalogue (celles de la production si une graine est fournie, sinon le minimum) et la feuille des joueurs. */
function semerSiVide(sql, graine) {
  const nb = sql.exec("SELECT COUNT(*) AS n FROM idle_catalog")[0];
  if (nb && Number(nb.n) > 0) return false;
  const feuille = (nom, lignes) => lignes.forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", nom, i + 1, JSON.stringify(l), Date.now()));
  /* graine.feuilles : la liste [feuille, rang, ligne JSON] exportée par le jeu (catalogue de production). JAMAIS la feuille des joueurs ni le registre CLASSEMENT (adresses e-mail des joueurs). */
  const triplets = graine && Array.isArray(graine.feuilles) ? graine.feuilles.filter((f) => Array.isArray(f) && typeof f[0] === "string" && typeof f[2] === "string" && f[0] !== "JOUEURS" && f[0] !== "CLASSEMENT") : null;
  if (triplets && triplets.length) {
    for (const f of triplets) sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", f[0], Number(f[1]) || 1, f[2], Date.now());
  } else {
    feuille("IDLE_BOUTIQUE", [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]]);
  }
  feuille("JOUEURS", [EN_TETE_JOUEURS]);
  return true;
}

/* ---------- ASSETS : le dossier public embarqué ---------- */
function creerAssets(dossierPublic) {
  const racine = path.resolve(dossierPublic);
  function resoudre(chemin) {
    let p;
    try { p = decodeURIComponent(chemin); } catch (_e) { return null; }
    if (p.endsWith("/")) p += "index.html";
    for (const c of [p, p + ".html", p + "/index.html"]) {
      const f = path.resolve(racine, "." + c);
      if (f.startsWith(racine + path.sep)) {
        try { if (fs.statSync(f).isFile()) return f; } catch (_e) { /* suivant */ }
      }
    }
    return null;
  }
  return {
    async fetch(requete) {
      const url = new URL(requete.url);
      const f = resoudre(url.pathname);
      if (!f) return new Response("Not found", { status: 404 });
      const entetes = new Headers({ "content-type": typeDe(f), "content-length": String(fs.statSync(f).size) });
      if (requete.method === "HEAD") return new Response(null, { status: 200, headers: entetes });
      return new Response(Readable.toWeb(fs.createReadStream(f)), { status: 200, headers: entetes });
    }
  };
}

/* ---------- SOREAL_R2 : le dossier des médias, mêmes clés que le bucket ---------- */
/* dossiersMedias : un dossier, ou plusieurs COUCHES de la plus récente à la plus ancienne (mises à jour installées, puis médias de l'installateur) : pour une clé présente dans plusieurs, la couche la plus récente gagne. Les écritures vont dans la plus récente. */
export function creerR2(dossiersMedias, fichierIndex) {
  const racines = (Array.isArray(dossiersMedias) ? dossiersMedias : [dossiersMedias]).map((d) => path.resolve(d));
  let index = null;   /* clé -> { taille, mtime, racine } */
  let promesse = null;
  /*
   * Inventaire des médias (Norman, 2026-10-30 : « le premier lancement de l'exe met du temps : l'interface est figée, puis le jeu s'affiche »). Il se faisait d'un seul bloc, en synchrone, dans le processus de l'application : 5 000 fichiers ouverts et mesurés (5,8 s sur un
   * disque chaud, bien plus au premier lancement quand l'antivirus examine chaque fichier), pendant lesquels RIEN d'autre ne tournait. Désormais : (1) le fichier « _inventaire-medias-v1.json » écrit à la fabrication de l'installateur est lu tel quel (aucun fichier ouvert) ;
   * (2) sinon, le parcours est ASYNCHRONE et parallèle (l'application reste fluide) et commencé dès le démarrage, avant même que la page le demande ; (3) son résultat est gardé dans « fichierIndex » (valable tant qu'aucun dossier n'a changé) : les lancements suivants ne mesurent plus rien.
   */
  const NOM_MANIFESTE = "_inventaire-medias-v1.json";
  async function enParallele(taches, nb) {
    let i = 0;
    await Promise.all(Array.from({ length: nb }, async () => { for (;;) { const k = i; i += 1; if (k >= taches.length) return; await taches[k](); } }));
  }
  async function tailleClair(fichier, tailleDisque) {
    if (tailleDisque < SURCOUT) return tailleDisque;
    let fh = null;
    try {
      fh = await fsp.open(fichier, "r");
      const tete = Buffer.alloc(ENTETE.length);
      await fh.read(tete, 0, tete.length, 0);
      return tete.equals(ENTETE) ? tailleDisque - SURCOUT : tailleDisque;
    } catch (_e) { return tailleDisque; } finally { if (fh) try { await fh.close(); } catch (_e) { /* fermé */ } }
  }
  /* Les fichiers (et la signature des dossiers) d'une couche, sans rien mesurer. */
  async function lister(racine) {
    const fichiers = [], dossiers = [];
    const parcourir = async (dossier, prefixe) => {
      let entrees = [];
      try { entrees = await fsp.readdir(dossier, { withFileTypes: true }); } catch (_e) { return; }
      let st = null;
      try { st = await fsp.stat(dossier); } catch (_e) { /* absent */ }
      dossiers.push(prefixe + ":" + (st ? Math.floor(st.mtimeMs) : 0) + ":" + entrees.length);
      const sous = [];
      for (const e of entrees) {
        const cle = prefixe + e.name;
        if (e.isDirectory()) sous.push(parcourir(path.join(dossier, e.name), cle + "/"));
        else if (e.isFile() && cle !== NOM_MANIFESTE && !cle.startsWith("_externes/") && !/\.(chiffre|nouveau)$/i.test(e.name)) fichiers.push({ cle, fichier: path.join(dossier, e.name) });
      }
      await Promise.all(sous);
    };
    await parcourir(racine, "");
    dossiers.sort();
    return { fichiers, signature: createHash("sha1").update(dossiers.join("|")).digest("hex") };
  }
  async function inventaireCouche(racine, cache) {
    const { fichiers, signature } = await lister(racine);   /* les noms seulement (aucun fichier ouvert ni mesuré) */
    try {   /* écrit à la fabrication de l'installateur : valable tant que les fichiers présents sont exactement ceux du manifeste (un fichier ajouté ou retiré le rend caduc) */
      const m = JSON.parse(await fsp.readFile(path.join(racine, NOM_MANIFESTE), "utf8"));
      if (m && m.v === 1 && m.fichiers && typeof m.fichiers === "object") {
        const presents = new Set(fichiers.map((f) => f.cle)), cles = Object.keys(m.fichiers);
        if (cles.length === presents.size && cles.every((k) => presents.has(k))) return { entrees: cles.map((cle) => [cle, { taille: Number(m.fichiers[cle][0]), mtime: Number(m.fichiers[cle][1]) || 0, racine }]), signature: null };
      }
    } catch (_e) { /* pas de manifeste : parcours */ }
    const enCache = cache && cache[racine];
    if (enCache && enCache.signature === signature && Array.isArray(enCache.entrees)) return { entrees: enCache.entrees.map(([cle, t, m]) => [cle, { taille: t, mtime: m, racine }]), signature, fichiers: fichiers.length };
    const entrees = [];
    await enParallele(fichiers.map((f) => async () => {
      try { const st = await fsp.stat(f.fichier); entrees.push([f.cle, { taille: await tailleClair(f.fichier, st.size), mtime: st.mtimeMs, racine }]); } catch (_e) { /* disparu */ }
    }), 64);
    return { entrees, signature, fichiers: fichiers.length, neuf: true };
  }
  async function construire() {
    if (promesse) return promesse;
    promesse = (async () => {
      let cache = null;
      if (fichierIndex) { try { cache = JSON.parse(await fsp.readFile(fichierIndex, "utf8")); } catch (_e) { /* pas de cache */ } }
      const neuf = new Map(), aGarder = {};
      let ecrire = false;
      const couches = await Promise.all(racines.map((r) => inventaireCouche(r, cache)));
      for (let i = racines.length - 1; i >= 0; i -= 1) {   /* de la plus ancienne à la plus récente : la dernière écrite l'emporte */
        const c = couches[i];
        for (const [cle, meta] of c.entrees) neuf.set(cle, meta);
        if (c.signature) { aGarder[racines[i]] = { signature: c.signature, entrees: c.entrees.map(([cle, m]) => [cle, m.taille, m.mtime]) }; if (c.neuf) ecrire = true; }
      }
      index = neuf;
      if (fichierIndex && ecrire) { try { await fsp.mkdir(path.dirname(fichierIndex), { recursive: true }); await fsp.writeFile(fichierIndex + ".nouveau", JSON.stringify(aGarder)); await fsp.rename(fichierIndex + ".nouveau", fichierIndex); } catch (_e) { /* cache facultatif */ } }
    })();
    try { await promesse; } finally { if (!index) promesse = null; }
  }
  const racine = racines[0];
  const objet = (cle, meta, avecCorps) => {
    const f = path.join(meta.racine, ...cle.split("/"));
    const ct = typeDe(f);
    const etag = createHash("sha1").update(cle + ":" + meta.taille + ":" + Math.floor(meta.mtime)).digest("hex").slice(0, 16);
    const o = {
      key: cle, size: meta.taille, etag, httpEtag: '"' + etag + '"', uploaded: new Date(meta.mtime),
      httpMetadata: { contentType: ct }, customMetadata: {},
      writeHttpMetadata(h) { h.set("content-type", ct); },
      /* médias chiffrés (coffre-medias.mjs) : rendus en clair au moment de les servir ; un fichier sans l'en-tête du coffre est lu tel quel */
      async arrayBuffer() { const b = lireEnClair(f); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); },
      async text() { return lireEnClair(f).toString("utf8"); },
      async json() { return JSON.parse(lireEnClair(f).toString("utf8")); }
    };
    if (avecCorps) o.body = fs.statSync(f).size === meta.taille ? Readable.toWeb(fs.createReadStream(f)) : new Blob([lireEnClair(f)]).stream();
    return o;
  };
  return {
    async get(cle) {
      if (!index) await construire();
      const meta = index.get(String(cle));
      return meta ? objet(String(cle), meta, true) : null;
    },
    async head(cle) {
      if (!index) await construire();
      const meta = index.get(String(cle));
      return meta ? objet(String(cle), meta, false) : null;
    },
    async list(options = {}) {
      if (!index) await construire();
      const prefixe = String(options.prefix || ""), delimiteur = options.delimiter ? String(options.delimiter) : "";
      const limite = Math.max(1, Math.min(1000, Number(options.limit) || 1000));
      const depart = Math.max(0, Number(options.cursor) || 0);
      const cles = [...index.keys()].filter((k) => k.startsWith(prefixe)).sort();
      const objets = [], prefixes = new Set();
      let i = depart;
      for (; i < cles.length && objets.length + prefixes.size < limite; i += 1) {
        const k = cles[i];
        if (delimiteur) {
          const reste = k.slice(prefixe.length), pos = reste.indexOf(delimiteur);
          if (pos >= 0) { prefixes.add(prefixe + reste.slice(0, pos + delimiteur.length)); continue; }
        }
        objets.push(objet(k, index.get(k), false));
      }
      const tronque = i < cles.length;
      return { objects: objets, delimitedPrefixes: [...prefixes], truncated: tronque, cursor: tronque ? String(i) : undefined };
    },
    async put(cle, valeur) {
      const f = path.join(racine, ...String(cle).split("/"));
      fs.mkdirSync(path.dirname(f), { recursive: true });
      const octets = valeur instanceof ArrayBuffer ? Buffer.from(valeur) : ArrayBuffer.isView(valeur) ? Buffer.from(valeur.buffer, valeur.byteOffset, valeur.byteLength) : Buffer.from(String(valeur));
      fs.writeFileSync(f, octets);
      index = null;promesse = null;
    },
    async delete(cles) {
      for (const c of Array.isArray(cles) ? cles : [cles]) { try { fs.unlinkSync(path.join(racine, ...String(c).split("/"))); } catch (_e) { /* déjà absent */ } }
      index = null;promesse = null;
    },
    prechauffer: () => construire()
  };
}

/*
 * Crée l'environnement du Worker. Options :
 *   racineDepot      dossier qui contient cloudflare/src (le dépôt, ou le dossier de l'application empaquetée)
 *   dossierPublic    cloudflare/public
 *   dossierMedias    miroir du bucket R2 (idle/voix/…, idle/bosses/…)
 *   fichierBase      fichier SQLite du joueur (dossier de données de l'application)
 *   graine           { feuilles } : export du catalogue de la production (première ouverture seulement)
 *   utilisateur      { email, emailConnexion, emails, prenom } : le joueur local
 */
export async function creerEnvLocal(opt) {
  const src = (f) => pathToFileURL(path.join(opt.racineDepot, "cloudflare", "src", f)).href;
  const { SorealIdleCoordinatorV1 } = await import(src("index-idle-coordinator-v1.js"));
  const entree = (await import(src("idle-worker-entry-v1.js"))).default;
  const { appliquerGraineContenuV1 } = await import(src("idle-graine-contenu-v1.js"));
  const { db, sql } = ouvrirBase(opt.fichierBase);
  db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
  const coord = new SorealIdleCoordinatorV1({ storage: { sql } }, {});
  const migrations = sql.exec("SELECT COUNT(*) AS n FROM migration_sources WHERE source_key LIKE 'idle:%' AND status='DONE'")[0];
  if (!migrations || Number(migrations.n) < 15) {
    for (let i = 0; i < 15; i += 1) sql.exec("INSERT OR REPLACE INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
  }
  /* Le jeu est ouvert au joueur de cet ordinateur : « accès public » du serveur, posé une fois (l'administrateur du serveur fait la même chose pour les joueurs en ligne). */
  sql.exec("INSERT INTO idle_meta(meta_key,meta_value) VALUES('acces_public','1') ON CONFLICT(meta_key) DO UPDATE SET meta_value='1'");
  sql.exec("BEGIN");   /* une seule écriture sur le disque pour toute la graine (et non une par ligne) */
  let premiere;
  try { premiere = semerSiVide(sql, opt.graine); sql.exec("COMMIT"); } catch (e) { try { sql.exec("ROLLBACK"); } catch (_e) { /* rien à défaire */ } throw e; }
  /* Contenu de la production (catalogue, textes et empreintes de voix, histoires) : re-appliqué à chaque démarrage où la graine a changé (mise à jour de l'application) ; la partie du joueur n'est jamais touchée (idle-graine-contenu-v1.js). */
  const contenu = appliquerGraineContenuV1(sql, opt.graine);
  const stub = { fetch: (requete) => coord.fetch(requete) };
  const env = {
    SOREAL_IDLE: { idFromName: () => ({ nom: "global" }), get: () => stub },
    ASSETS: creerAssets(opt.dossierPublic),
    SOREAL_R2: creerR2(opt.dossiersMedias || opt.dossierMedias, opt.fichierIndex),
    CF_VERSION_METADATA: { id: "desktop" },
    GOOGLE_CLIENT_ID: ""
  };
  /*
   * Session du joueur local : créée par le coordinateur lui-même (comme une connexion Google vérifiée : accès public, drapeau « externe »). Une nouvelle à chaque lancement, posée dans la page par le tout premier script du <head>
   * (la page la lit comme n'importe quelle session Google conservée : standalone-bridge.js).
   */
  function nouvelleSession() {
    const s = coord.createGoogleSessionV1({ email: opt.utilisateur.email, nom: opt.utilisateur.prenom });
    if (!s || !s.ok) throw new Error("SESSION_LOCALE_REFUSEE:" + (s && s.error));
    return { token: s.sessionToken, expiresAt: s.expiresAt };
  }
  env.SOREAL_R2.prechauffer().catch(() => {});   /* l'inventaire des médias commence tout de suite, en tâche de fond : la page le trouve prêt */
  let session = nouvelleSession();
  const scriptSession = () => '<script>try{localStorage.setItem("soreal_idle_google_session_v1",' + JSON.stringify(JSON.stringify({ token: session.token, expiresAt: session.expiresAt })) + ');}catch(_e){}</script>';
  async function repondre(requete) {
    const chemin = new URL(requete.url).pathname;
    /* Comme chez Cloudflare : un fichier du dossier public est servi directement, sans passer par le Worker (sauf la page d'accueil, que le Worker habille de ses en-têtes). */
    if ((requete.method === "GET" || requete.method === "HEAD") && chemin !== "/" && chemin !== "/index.html" && !chemin.startsWith("/api/") && !chemin.startsWith("/__")) {
      const f = await env.ASSETS.fetch(requete);
      if (f.status !== 404) return f;
    }
    /* Voix de secours (Piper) : le Worker de production va chercher son modèle sur un dépôt externe ; ici la copie récoltée (medias/_externes/) est servie directement, donc sans internet. */
    if ((requete.method === "GET" || requete.method === "HEAD") && (chemin === "/api/idle/media/piper-model.onnx" || chemin === "/api/idle/media/piper-model.onnx.json")) {
      const f = [].concat(opt.dossiersMedias || opt.dossierMedias).map((d) => path.join(d, "_externes", chemin.split("/").pop())).find((c) => fs.existsSync(c));
      if (f) {
        const entetes = new Headers({ "content-type": chemin.endsWith(".json") ? "application/json" : "application/octet-stream", "content-length": String(fs.statSync(f).size), "cache-control": "public, max-age=604800" });
        return requete.method === "HEAD" ? new Response(null, { headers: entetes }) : new Response(Readable.toWeb(fs.createReadStream(f)), { headers: entetes });
      }
    }
    const rep = await entree.fetch(requete, env);
    if (requete.method === "GET" && (chemin === "/" || chemin === "/index.html") && rep.ok && (rep.headers.get("content-type") || "").includes("text/html")) {
      const html = (await rep.text()).replace(/<head[^>]*>/i, (m) => m + scriptSession());
      const entetes = new Headers(rep.headers);
      entetes.delete("content-length");
      return new Response(html, { status: rep.status, headers: entetes });
    }
    return rep;
  }
  return {
    env, coord, db, sql, premiere,
    /* Toute requête du jeu passe ici : exactement ce que ferait Cloudflare (la page d'accueil porte en plus la session locale). */
    fetch: repondre,
    renouvelerSession: () => { session = nouvelleSession(); return session; },
    /* Application reliée à un compte : la page reçoit le jeton de session du SERVEUR (celui du compte), pas une session locale ; il reste le même d'un lancement à l'autre, ce qui permet de rouvrir le jeu sans internet (dernier export gardé sous son empreinte). */
    definirSessionExterne: (s) => { session = { token: String(s.token), expiresAt: Number(s.expiresAt) || (Date.now() + 14 * 86400000) }; },
    /* La partie locale du joueur : { index, cells } ou null (feuille JOUEURS de la base de l'application ; l'adresse est en colonnes 18 et 19). */
    ligneJoueur: (email) => {
      const mail = String(email || opt.utilisateur.email).toLowerCase();
      for (const l of sql.exec("SELECT row_index,row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index>1 ORDER BY row_index")) {
        try { const c = JSON.parse(l.row_json); if (String(c[18] || "").toLowerCase() === mail || String(c[19] || "").toLowerCase() === mail) return { index: Number(l.row_index), cells: c }; } catch (_e) { /* ligne illisible : suivante */ }
      }
      return null;
    },
    /* Le pseudo choisi sur cet ordinateur (table des profils), ou "". */
    pseudoLocal: (email) => {
      try { const r = sql.exec("SELECT pseudo FROM idle_profiles WHERE email=?", String(email || opt.utilisateur.email).toLowerCase())[0]; return r ? String(r.pseudo || "") : ""; } catch (_e) { return ""; }
    },
    fermer: () => { try { db.close(); } catch (_e) { /* déjà fermée */ } }
  };
}
