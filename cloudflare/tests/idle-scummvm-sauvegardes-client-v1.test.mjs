import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { idleScummvmSauvegardesTraiterV1 } from "../src/idle-scummvm-sauvegardes-v1.js";

/*
 * Synchronisation des sauvegardes de ScummVM, côté page (modules/scummvm-sync-v1.js) : le vrai module sur un faux navigateur (faux IndexedDB d'IDBFS, horloge d'appareil décalée,
 * minuteurs manuels) branché sur le VRAI code serveur (SQLite en mémoire). Reprise des seuls fichiers plus récents, local plus récent conservé, délai de 3 s, création conforme de la base,
 * envoi des seuls fichiers changés, un seul minuteur, conflit (message + aucun envoi) puis « Reprendre ici », keepalive à la fermeture, aucune donnée de sauvegarde dans les logs, anti-spoil.
 */
const SOURCE = readFileSync("cloudflare/public/modules/scummvm-sync-v1.js", "utf8");
const PAGE = readFileSync("cloudflare/public/modules/scummvm-page-v1.js", "utf8");
const JEU = { id: "dott", cible: "tentacle", nom: "Day of the Tentacle" };
const DOSSIER = "/home/web_user/saves/";
const b64 = (t) => Buffer.from(t).toString("base64");
const octets = (t) => new Uint8Array(Buffer.from(t));
const texte = (u) => Buffer.from(u).toString();

/* serveur partagé par les appareils */
const dbs = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = dbs.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
const COMPTES = { "jeton-a": "norman@x.fr", "jeton-b": "norman@x.fr", "jeton-autre": "autre@x.fr" };

function appareil(opts = {}) {
  const decalage = opts.decalage || 0;   /* l'horloge de l'appareil avance de `decalage` ms sur celle du serveur */
  class FD extends Date { constructor(...a) { if (a.length) super(...a); else super(Date.now() + decalage); } static now() { return Date.now() + decalage; } }
  const idb = { existe: opts.init !== null, table: opts.init !== null, magasin: new Map(Object.entries(opts.init || {})), versionCreee: null, index: null, creations: 0, ecritures: [] };
  const timers = [];
  let idTimer = 0;
  const journal = [];
  const requetes = [];
  const ecouteurs = {};
  const elements = [];
  const asynchrone = (f) => setTimeout(f, 0);
  function fabriquerMagasin(tx) {
    const reqs = () => { tx.pendants += 1; return () => { tx.pendants -= 1; if (tx.pendants === 0 && tx.oncomplete) asynchrone(() => { if (tx.pendants === 0 && !tx.fini) { tx.fini = true; tx.oncomplete(); } }); }; };
    return {
      indexNames: { contains: (n) => idb.index === n },
      createIndex(nom, chemin, o) { idb.index = nom; idb.indexInfos = { chemin, o }; },
      get(k) { const q = {}; const fin = reqs(); asynchrone(() => { q.result = idb.magasin.get(k); if (q.onsuccess) q.onsuccess(); fin(); }); return q; },
      put(v, k) { const q = {}; const fin = reqs(); idb.ecritures.push(k); asynchrone(() => { idb.magasin.set(k, v); if (q.onsuccess) q.onsuccess(); fin(); }); return q; },
      openCursor(plage) {
        const q = {}; const fin = reqs();
        const cles = [...idb.magasin.keys()].filter((k) => k >= plage.l && k <= plage.h).sort();
        let i = 0;
        const pas = () => asynchrone(() => {
          if (i >= cles.length) { q.result = null; if (q.onsuccess) q.onsuccess(); fin(); return; }
          const k = cles[i++];
          q.result = { key: k, value: idb.magasin.get(k), continue: pas };
          if (q.onsuccess) q.onsuccess();
        });
        pas();
        return q;
      }
    };
  }
  const indexedDB = {
    open(nom, version) {
      assert.equal(nom, "/home/web_user");
      const req = {};
      asynchrone(() => {
        const db = {
          objectStoreNames: { contains: (n) => n === "FILE_DATA" && idb.table },
          createObjectStore(n) { assert.equal(n, "FILE_DATA"); idb.table = true; return fabriquerMagasin({ pendants: 0 }); },
          close() {},
          transaction() { const tx = { pendants: 0, fini: false }; tx.objectStore = () => fabriquerMagasin(tx); return tx; }
        };
        req.result = db;
        if (!idb.existe) {
          if (version === undefined) { req.transaction = { abort() { idb.abandons = (idb.abandons || 0) + 1; } }; if (req.onupgradeneeded) req.onupgradeneeded(); if (req.onerror) req.onerror(); return; }
          idb.existe = true; idb.creations += 1; idb.versionCreee = version;
          req.transaction = { objectStore: () => fabriquerMagasin({ pendants: 0 }) };
          if (req.onupgradeneeded) req.onupgradeneeded();
        }
        if (req.onsuccess) req.onsuccess();
      });
      return req;
    }
  };
  const el = (tag) => { const e = { tag, children: [], style: {}, attrs: {}, listeners: {}, textContent: "", parentNode: null, setAttribute(k, v) { this.attrs[k] = v; }, appendChild(c) { c.parentNode = this; this.children.push(c); return c; }, removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentNode = null; return c; }, addEventListener(t, f) { this.listeners[t] = f; } }; elements.push(e); return e; };
  const hote = { ecart: opts.sansEcart ? null : -decalage };
  const sb = {
    console: { log: (...a) => journal.push(a.join(" ")), warn: (...a) => journal.push(a.join(" ")), error: (...a) => journal.push(a.join(" ")), debug: (...a) => journal.push(a.join(" ")) },
    Promise, Math, JSON, Object, Array, String, Number, Boolean, Set, Error, Uint8Array, Date: FD,
    atob: (s) => Buffer.from(s, "base64").toString("latin1"), btoa: (s) => Buffer.from(s, "latin1").toString("base64"),
    IDBKeyRange: { bound: (l, h) => ({ l, h }) },
    indexedDB: opts.sansIndexedDB ? undefined : indexedDB,
    sessionStorage: { getItem: (k) => (k === "soreal_idle_session_v1" ? (opts.jeton === undefined ? "jeton-a" : opts.jeton) : null) },
    localStorage: { getItem: () => null },
    setTimeout: (f, ms) => { idTimer += 1; timers.push({ f, ms, id: idTimer }); return idTimer; },
    clearTimeout: (id) => { const i = timers.findIndex((t) => t.id === id); if (i >= 0) timers.splice(i, 1); },
    document: { visibilityState: "visible", body: el("body"), createElement: el, addEventListener(t, f) { ecouteurs["document:" + t] = f; } },
    addEventListener(t, f) { ecouteurs[t] = f; },
    fetch: async (url, o) => {
      const corps = JSON.parse(o.body);
      requetes.push({ url: String(url), corps, keepalive: o.keepalive === true, auth: o.headers.authorization });
      if (opts.fetchBloque) return new Promise(() => {});
      if (opts.fetchEchoue) throw new Error("reseau");
      const compte = COMPTES[String(o.headers.authorization || "").replace("Bearer ", "")];
      if (!compte) return { json: async () => ({ ok: false }) };
      const res = await idleScummvmSauvegardesTraiterV1(sql, compte, corps, { autorise: async () => true });
      return { json: async () => res };
    },
    __SOREAL_IDLE_ECART_V1__: () => hote.ecart
  };
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(SOURCE, sb);
  return { sb, S: sb.__SOREAL_IDLE_SCUMMVM_SYNC_V1__, idb, timers, journal, requetes, ecouteurs, elements, hote, decalage };
}
const laisser = async (n = 12) => { for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 2)); };
const tour = async (A) => { A.S.tour(); await laisser(); for (let i = 0; i < 200 && A.S.etat.enCours; i += 1) await laisser(2); };
const ecritures = (A) => A.requetes.filter((r) => r.corps.action === "ecrire");
const fichierLocal = (A, nom) => A.idb.magasin.get(DOSSIER + nom);
const poser = (A, nom, contenu, ts, mode = 33206) => A.idb.magasin.set(DOSSIER + nom, { timestamp: new Date(ts), mode, contents: octets(contenu) });
const serveur = async (compte = "norman@x.fr") => (await idleScummvmSauvegardesTraiterV1(sql, compte, { action: "lire", jeu: "dott" }, { autorise: async () => true })).fichiers;
const T0 = Date.now() - 3600_000;   /* une heure dans le passé, heure du serveur */
const base = { "/home/web_user/saves": { timestamp: new Date(T0), mode: 16877 }, "/home/web_user/scummvm.ini": { timestamp: new Date(T0), mode: 33206, contents: octets("[scummvm]") } };

/* 1. téléphone : envoi des fichiers changés seulement, horloge normalisée à l'heure du serveur (appareil en avance d'une heure), un seul minuteur */
const tel = appareil({ init: { ...base }, decalage: 3600_000 });
poser(tel, "tentacle.s00", "partie-telephone-1", T0 + 3600_000 + 1000);   /* date de l'appareil = heure du serveur T0+1000 + 1 h d'avance */
poser(tel, "tentacle.s01", "emplacement-un", T0 + 3600_000 + 500);
poser(tel, "autre.s00", "autre-jeu", T0 + 3600_000 + 700);   /* sauvegarde d'un autre jeu : jamais envoyée */
await tel.S.reprendre(JEU);
tel.S.suivre(JEU); tel.S.suivre(JEU); tel.S.suivre({ ...JEU });
assert.equal(tel.timers.filter((t) => t.ms === 20000).length, 1, "un seul minuteur de 20 s, replanifié (setTimeout), jamais de setInterval");
assert.ok(!/setInterval/.test(SOURCE), "aucun setInterval");
await tour(tel);
let w = ecritures(tel);
assert.equal(w.length, 1, "un lot unique par requête");
assert.deepEqual(w[0].corps.fichiers.map((f) => f.nom).sort(), ["tentacle.s00", "tentacle.s01"], "seulement les fichiers du jeu");
assert.equal(w[0].corps.fichiers.find((f) => f.nom === "tentacle.s00").maj, T0 + 1000, "maj = heure du serveur (timestamp de l'appareil + écart)");
assert.equal(w[0].corps.fichiers.find((f) => f.nom === "tentacle.s00").base, 0, "fichier jamais vu du serveur : base 0");
assert.equal(w[0].auth, "Bearer jeton-a");
assert.equal(w[0].url, "/api/v1/scummvm-sauvegardes");
assert.equal(tel.timers.filter((t) => t.ms === 20000).length, 1, "toujours un seul minuteur après un tour");
assert.deepEqual((await serveur()).map((f) => f.nom), ["tentacle.s00", "tentacle.s01"]);
await tour(tel);
assert.equal(ecritures(tel).length, 1, "rien n'a changé : rien n'est renvoyé");
poser(tel, "tentacle.s00", "partie-telephone-2", T0 + 3600_000 + 9000);
await tour(tel);
w = ecritures(tel);
assert.equal(w.length, 2); assert.deepEqual(w[1].corps.fichiers.map((f) => f.nom), ["tentacle.s00"], "seul le fichier changé est envoyé");
assert.equal(w[1].corps.fichiers[0].base, T0 + 1000, "base = le maj du serveur vu à l'envoi précédent");
assert.equal(texte(Buffer.from((await serveur()).find((f) => f.nom === "tentacle.s00").donnees, "base64")), "partie-telephone-2");
assert.equal(tel.elements.some((e) => e.className === "scv-sync-msg"), false, "anti-spoil : aucun message sans conflit");

/* 2. PC neuf (aucune base IndexedDB) : la base est CRÉÉE comme IDBFS (version 21, table FILE_DATA, index timestamp, dossier saves) puis la partie est reprise ; rien à renvoyer */
const pc = appareil({ init: null, decalage: -120_000 });   /* horloge du PC en retard de 2 min */
await pc.S.reprendre(JEU);
assert.equal(pc.idb.creations, 1); assert.equal(pc.idb.versionCreee, 21, "même version que IDBFS.DB_VERSION de scummvm.js");
assert.equal(pc.idb.table, true); assert.equal(pc.idb.index, "timestamp"); assert.equal(JSON.stringify(pc.idb.indexInfos), JSON.stringify({ chemin: "timestamp", o: { unique: false } }));
const dos = pc.idb.magasin.get("/home/web_user/saves");
assert.equal(dos.mode, 16877, "entrée du dossier saves (IDBFS ne crée pas les parents)");
const reprise = fichierLocal(pc, "tentacle.s00");
assert.equal(texte(reprise.contents), "partie-telephone-2");
assert.equal(reprise.mode, 33206);
assert.equal(+reprise.timestamp, T0 + 9000 - 120_000, "timestamp écrit = maj - écart (heure de l'appareil, en retard de 2 min)");
assert.equal(texte(fichierLocal(pc, "tentacle.s01").contents), "emplacement-un");
assert.equal(fichierLocal(pc, "autre.s00"), undefined, "un fichier d'un autre jeu n'est jamais repris");
assert.equal(pc.idb.magasin.has("/home/web_user/scummvm.ini"), false, "la config n'est pas créée (le moteur la télécharge)");
pc.S.suivre(JEU);
await tour(pc);
assert.equal(ecritures(pc).length, 0, "partie reprise = déjà sur le serveur : aucun envoi");

/* 3. local plus récent : conservé, jamais écrasé par une plus ancienne, puis envoyé ; un local plus ancien est remplacé */
const maison = appareil({ init: { ...base } });
poser(maison, "tentacle.s00", "local-plus-recent", Date.now() + 1000);   /* plus récent que le serveur */
poser(maison, "tentacle.s01", "local-plus-ancien", T0 - 100000);
const avantS00 = fichierLocal(maison, "tentacle.s00");
await maison.S.reprendre(JEU);
assert.equal(fichierLocal(maison, "tentacle.s00"), avantS00, "local plus récent : intact");
assert.equal(texte(fichierLocal(maison, "tentacle.s01").contents), "emplacement-un", "local plus ancien : remplacé par le serveur");
assert.equal(maison.idb.creations, 0, "la base existante n'est jamais recréée");
maison.S.suivre(JEU);
await tour(maison);
w = ecritures(maison);
assert.equal(w.length, 1); assert.deepEqual(w[0].corps.fichiers.map((f) => f.nom), ["tentacle.s00"], "le local plus récent est envoyé, pas le fichier repris");
assert.equal(w[0].corps.fichiers[0].base, T0 + 9000, "base = version du serveur vue à la reprise");
assert.equal(texte(Buffer.from((await serveur()).find((f) => f.nom === "tentacle.s00").donnees, "base64")), "local-plus-recent");

/* 4. rien sur le serveur et pas de base : rien n'est créé */

{
  const neuf = appareil({ init: null, jeton: "jeton-autre" });   /* autre compte : serveur vide pour lui */
  await neuf.S.reprendre(JEU);
  assert.equal(neuf.idb.creations, 0, "pas de base et rien à reprendre : aucune création");
  assert.equal(neuf.idb.existe, false);
  neuf.S.suivre(JEU);
  await tour(neuf);
  assert.equal(ecritures(neuf).length, 0);
  const isole = appareil({ init: { ...base }, jeton: "jeton-autre" });
  await isole.S.reprendre(JEU);
  assert.equal(fichierLocal(isole, "tentacle.s00"), undefined, "isolation par compte : un autre compte ne reprend rien");
}


/* 5. délai : si le serveur ne répond pas, le jeu démarre après 3 s ; rien n'est écrit plus tard ; erreurs silencieuses */
{
  const lent = appareil({ init: { ...base }, fetchBloque: true });
  let fini = false;
  lent.S.reprendre(JEU).then(() => { fini = true; });
  await laisser();
  assert.equal(fini, false, "pas fini avant les 3 s");
  const t = lent.timers.find((x) => x.ms === 3000);
  assert.ok(t, "minuteur de 3 s");
  t.f();
  await laisser();
  assert.equal(fini, true, "la promesse se résout après 3 s");
  const hs = appareil({ init: { ...base }, fetchEchoue: true });
  await hs.S.reprendre(JEU);   /* serveur en panne : se résout sans erreur */
  hs.S.suivre(JEU);
  poser(hs, "tentacle.s00", "x", Date.now());
  await tour(hs);
  assert.equal(hs.timers.filter((x) => x.ms === 20000).length, 1, "nouvel essai au tour suivant");
  const sansIdb = appareil({ sansIndexedDB: true });
  await sansIdb.S.reprendre(JEU);
  const sansJeton = appareil({ jeton: "" });
  await sansJeton.S.reprendre(JEU);
  assert.equal(sansJeton.requetes.length, 0, "sans jeton : aucune requête");
  await sansIdb.S.reprendre(null);
}

/* 6. reprise écartée après les 3 s : le suivi relit le serveur et signale le conflit s'il a mieux (jamais d'écrasement) */
{
  const tard = appareil({ init: { ...base } });
  poser(tard, "tentacle.s00", "vieux-local", T0 - 500000);
  let reponse = null;
  const originale = tard.sb.fetch;
  tard.sb.fetch = (u, o) => (JSON.parse(o.body).action === "lire" && !reponse ? new Promise((r) => { reponse = () => originale(u, o).then(r); }) : originale(u, o));
  const p = tard.S.reprendre(JEU);
  await laisser();
  tard.timers.find((x) => x.ms === 3000).f();
  await p;
  reponse();   /* la réponse arrive après le départ du jeu : elle ne doit rien écrire */
  await laisser(20);
  assert.equal(texte(fichierLocal(tard, "tentacle.s00").contents), "vieux-local", "aucune écriture après l'abandon");
  tard.S.suivre(JEU);
  poser(tard, "tentacle.s00", "vieux-local-modifie", T0 - 400000);
  await tour(tard);
  assert.equal(tard.S.etat.conflit, true);
  assert.equal(ecritures(tard).length, 0, "conflit : rien n'est envoyé");
}

/* 7. conflit : un autre appareil a joué depuis la reprise ; message, aucun envoi, puis « Reprendre ici » force */
{
  const a = appareil({ init: { ...base } });   /* téléphone */
  const b = appareil({ init: { ...base } });   /* PC */
  await a.S.reprendre(JEU); a.S.suivre(JEU);
  await b.S.reprendre(JEU); b.S.suivre(JEU);
  assert.equal(texte(fichierLocal(b, "tentacle.s00").contents), "local-plus-recent");
  const maj0 = (await serveur()).find((f) => f.nom === "tentacle.s00").maj;
  /* le téléphone avance et envoie */
  poser(a, "tentacle.s00", "avance-telephone", Date.now() + 2000);
  await tour(a);
  assert.equal(texte(Buffer.from((await serveur()).find((f) => f.nom === "tentacle.s00").donnees, "base64")), "avance-telephone");
  /* le PC joue aussi (sans avoir rechargé) : sa sauvegarde est plus récente */
  poser(b, "tentacle.s00", "avance-pc", Date.now() + 4000);
  await tour(b);
  assert.equal(b.S.etat.conflit, true, "conflit détecté");
  const msg = b.elements.find((e) => e.className === "scv-sync-msg");
  assert.ok(msg, "message affiché");
  assert.equal(msg.children[0].textContent, "Partie reprise sur un autre appareil : recharge pour la retrouver.");
  assert.equal(msg.children[1].textContent, "Reprendre ici");
  assert.equal(texte(Buffer.from((await serveur()).find((f) => f.nom === "tentacle.s00").donnees, "base64")), "avance-telephone", "la version de l'autre appareil n'est pas écrasée");
  assert.ok((await serveur()).find((f) => f.nom === "tentacle.s00").maj > maj0);
  const avant = ecritures(b).length;
  await tour(b);
  assert.equal(ecritures(b).length, avant, "tant que le conflit dure : aucun envoi");
  assert.equal(b.timers.filter((t) => t.ms === 20000).length, 0, "le minuteur s'arrête pendant le conflit");
  /* « Reprendre ici » : l'appareil devient la référence */
  msg.children[1].listeners.click();
  await laisser(); for (let i = 0; i < 100 && b.S.etat.enCours; i += 1) await laisser(2);
  const dernier = ecritures(b).at(-1);
  assert.equal(dernier.corps.force, true, "envoi forcé");
  assert.equal(texte(Buffer.from((await serveur()).find((f) => f.nom === "tentacle.s00").donnees, "base64")), "avance-pc");
  assert.equal(b.S.etat.conflit, false); assert.equal(b.S.etat.force, false);
  assert.equal(msg.parentNode, null, "message retiré");
  assert.equal(b.timers.filter((t) => t.ms === 20000).length, 1, "le suivi reprend");
}

/* 8. fermeture : pagehide envoie l'autosave seule, en keepalive */
{
  const p = appareil({ init: { ...base } });
  await p.S.reprendre(JEU); p.S.suivre(JEU);
  await tour(p);   /* se met à jour sur le serveur */
  poser(p, "tentacle.s00", "derniere-seconde", Date.now() + 8000);
  poser(p, "tentacle.s01", "autre-emplacement", Date.now() + 8000);
  const avant = p.requetes.length;
  p.ecouteurs.pagehide();
  await laisser(20);
  const r = p.requetes.slice(avant);
  assert.equal(r.length, 1); assert.equal(r[0].keepalive, true, "fetch keepalive");
  assert.deepEqual(r[0].corps.fichiers.map((f) => f.nom), ["tentacle.s00"], "seulement l'autosave");
  assert.ok(p.ecouteurs["document:visibilitychange"], "aussi à la mise en arrière-plan");
}

/* 9. aucune donnée de sauvegarde dans les journaux (tous les appareils) ; branchement dans la page ; dictionnaire anglais ; index.html */
for (const A of [tel, pc, maison]) assert.deepEqual(A.journal, [], "aucun log");
assert.ok(!/console\./.test(SOURCE), "aucun console.* dans le module");
assert.ok(PAGE.includes("S.reprendre(jeuCourant)") && PAGE.includes("reprise().then(apres,apres)"), "la page attend la reprise avant de lancer");
assert.ok(PAGE.indexOf("reprise().then(apres,apres)") < PAGE.indexOf("S.suivre(jeuCourant)"), "suivi après");
assert.ok(PAGE.includes("iframe.src=urlLancement(jeuCourant)"), "URL de lancement inchangée");
const dico = JSON.parse(readFileSync("cloudflare/public/modules/traduction-anglais-dict-v1.json", "utf8"));
assert.equal(dico["Partie reprise sur un autre appareil : recharge pour la retrouver."], "Game resumed on another device: reload to get it back.");
assert.equal(dico["Reprendre ici"], "Resume here");
const index = readFileSync("cloudflare/public/index.html", "utf8");
const iSync = index.search(/<script defer src="\/modules\/scummvm-sync-v1\.js\?v=[0-9]+"><\/script>/);   /* le numéro ?v= monte à chaque modification (maj-pins) */
assert.ok(iSync > 0 && iSync < index.indexOf("/modules/scummvm-page-v1.js"), "script chargé avant scummvm-page-v1.js");

/* 13. HORLOGE D'APPAREIL EN RETARD et pont qui n'a pas encore mesuré l'écart (bug du 2026-11-24 : « ma partie n'a pas repris là où j'étais ») : la partie LOCALE plus récente ne doit JAMAIS être remplacée par une sauvegarde distante plus ancienne. L'écart est pris sur l'heure que le serveur renvoie. */
{
  const maintenant = Date.now();
  await idleScummvmSauvegardesTraiterV1(sql, "autre@x.fr", { action: "ecrire", jeu: "dott", fichiers: [{ nom: "tentacle.s00", maj: maintenant - 30_000, donnees: b64("ancienne-distante"), base: 0 }] }, { autorise: async () => true });
  const retard = appareil({ init: { ...base }, jeton: "jeton-autre", decalage: -600_000, sansEcart: true });   /* horloge 10 min en retard, écart du pont inconnu */
  poser(retard, "tentacle.s00", "locale-plus-recente", maintenant - 5_000 - 600_000);   /* écrite il y a 5 s (vraie heure) = date d'appareil en retard de 10 min */
  const avant = fichierLocal(retard, "tentacle.s00");
  await retard.S.reprendre(JEU);
  assert.equal(fichierLocal(retard, "tentacle.s00"), avant, "partie locale plus récente : intacte, malgré l'horloge en retard et l'écart inconnu");
  assert.equal(texte(fichierLocal(retard, "tentacle.s00").contents), "locale-plus-recente");
}
console.log("idle-scummvm-sauvegardes-client-v1: OK");
