/*
 * Banc de reproduction des pertes de progression du jeu local (audit en lecture seule du 2026-11-01).
 * AUCUN fichier de production n'est modifié ; ce dossier n'est PAS joué par la suite normale (aucun fichier ne finit par `.test.mjs`).
 *
 * Deux morceaux RÉELS, un morceau simulé :
 *  - REEL  : le module de la page `public/modules/moteur-local-v1.js` (lu et exécuté tel quel dans un faux navigateur) ;
 *  - REEL  : le code serveur `src/idle-local-sync-v1.js` (export + réception) sur une vraie base SQLite en mémoire (node:sqlite) avec le vrai coordinateur ;
 *  - SIMULE: le Web Worker (le moteur de jeu lui-même) : un compteur de progression `n` (colonne « Boss vaincus », index 14) et la « Dernière synchro » (index 15).
 *    Le reste de la ligne (stats JSON...) est celui de la vraie ligne exportée, recopié tel quel.
 * Différences avec tests/helpers/monde-local.mjs : la ligne exportée vient du VRAI serveur (donc sa « Dernière synchro » est celle que le vrai serveur fabrique à l'export),
 * l'IndexedDB peut être partagé entre deux « pages », le réseau d'export peut être coupé.
 */
import fs from "node:fs";
import vm from "node:vm";
import { DatabaseSync } from "node:sqlite";

const RACINE = new URL("../../", import.meta.url);
const code = fs.readFileSync(new URL("public/modules/moteur-local-v1.js", RACINE), "utf8");
const { SorealIdleCoordinatorV1 } = await import(new URL("src/index-idle-coordinator-v1.js", RACINE).href);
const sync = await import(new URL("src/idle-local-sync-v1.js", RACINE).href);

export const COL_N = 14;       // « Boss vaincus » : marqueur de progression (jamais recalculé par l'export du serveur : vérifié)
export const COL_SYNCHRO = 15; // « Dernière synchro »
export const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
export const tick = () => attendre(40);
export const enMs = (v) => { const n = Number(v); return Number.isFinite(n) && String(v).trim() !== "" ? n : Date.parse(String(v)); };

/* Vrai serveur (coordinateur + SQLite en mémoire), un joueur. */
export function serveurReel() {
  const db = new DatabaseSync(":memory:");
  const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
  db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
  const coord = new SorealIdleCoordinatorV1({ storage: { sql } }, {});
  for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
  const src = fs.readFileSync(new URL("tools/local-dev-server.mjs", RACINE), "utf8");
  const ENTETE = new Function(src.match(/const HEADERS_ = (\[.*?\]);/)[1].replace(/^/, "return "))();
  const feuille = (nom, lignes) => lignes.forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", nom, i + 1, JSON.stringify(l), Date.now()));
  feuille("JOUEURS", [ENTETE]);
  feuille("IDLE_BOUTIQUE", [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]]);
  const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
  const jeton = coord.consumeLaunchTicketV1(coord.createLaunchTicketV1({ source: "tv", user }).ticket).sessionToken;
  coord.runStandaloneSessionOperationV1({ sessionToken: jeton, operation: "obtenirEtatSorealIdle", args: [jeton] });
  const index = 2;
  const api = {
    coord, sql, jeton,
    /* Ce que fait la page quand elle s'ouvre : GET /api/v1/local/export (le VRAI code serveur ; il revendique la partie et, on le démontre, réécrit la ligne). */
    exporter(appareil = "page-" + Math.random().toString(36).slice(2)) {
      const e = sync.exporterPourMoteurLocalV1(coord, jeton, appareil);
      if (!e.ok) throw new Error("export refusé : " + e.error);
      return JSON.parse(JSON.stringify(e));
    },
    /* POST /api/v1/local/push (le VRAI code serveur). */
    recevoir(corps) { return JSON.parse(JSON.stringify(sync.recevoirDuMoteurLocalV1(coord, Object.assign({}, corps, { sessionToken: jeton })))); },
    ligne() { return JSON.parse(sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=?", index)[0].row_json); },
    /* Pose un état de départ précis sur le serveur (progression `n`, « Dernière synchro » = `instant`) sans passer par le moteur. */
    poser(n, instant) {
      const l = api.ligne(); l[COL_N] = n; l[COL_SYNCHRO] = new Date(instant).toISOString();
      sql.exec("UPDATE idle_catalog SET row_json=? WHERE sheet_name='JOUEURS' AND row_index=?", JSON.stringify(l), index);
    }
  };
  return api;
}

/*
 * Faux navigateur autour du VRAI moteur-local-v1.js.
 *  exp       : réponse de /api/v1/local/export (objet), ou fonction (appareil) => export (calculé à la requête), ou null = réseau coupé (fetch rejeté)
 *  store     : IndexedDB (Map) éventuellement partagé avec une autre « page » (deux onglets)
 *  serveur   : si fourni, /push est traité par le vrai code serveur ; sinon `mondeApi.push` (faux)
 */
export function monde({ exp, store = new Map(), serveur = null, sansMinuterie = false } = {}) {
  const pushes = [];
  const seq = { flux: 0, gains: 0 };
  const etat = { n: 0, instant: 0, base: null, flux: [], gains: [] };
  const mondeApi = { store, pushes, etat, push: null, rechargements: [], cle: null };
  mondeApi.push = async (corps) => (serveur ? serveur.recevoir(corps) : { ok: true, ecrit: true });
  const ligneDe = () => { const c = etat.base.slice(); c[COL_N] = etat.n; c[COL_SYNCHRO] = new Date(etat.instant).toISOString(); return c; };
  class Worker {
    constructor() { mondeApi.worker = this; }
    postMessage(m) {
      Promise.resolve().then(() => {
        const rep = (resultat) => this.onmessage({ data: { id: m.id, ok: true, resultat } });
        if (m.type === "init") {
          etat.base = JSON.parse(m.export.joueurs.ligne);
          etat.n = Number(etat.base[COL_N]) || 0; etat.instant = enMs(etat.base[COL_SYNCHRO]) || 0;
          if (m.export.reprise) { etat.flux = (m.export.reprise.flux || []).slice(); etat.gains = (m.export.reprise.gains || []).slice(); }
          rep(true);
        } else if (m.type === "appel") {
          const lecture = /^(obtenir|synchroniser)/.test(m.operation);
          etat.instant = Math.max(etat.instant + 1, Date.now());    // le moteur réel écrit « maintenant » dans la colonne 16 à chaque opération (idle-runtime-actions.js)
          if (!lecture) etat.n += 1;
          rep({ ok: true, joueur: {} });
        } else if (m.type === "sortant") {
          for (const e of etat.flux) if (e.n == null) e.n = ++seq.flux;
          for (const e of etat.gains) if (e.n == null) e.n = ++seq.gains;
          const out = { cells: ligneDe(), flux: etat.flux.slice(), gains: etat.gains.slice(), instant: etat.instant };
          if (m.vider) { etat.flux = []; etat.gains = []; }
          rep(out);
        } else if (m.type === "importer") {
          const base = etat.base.slice();
          const f = m.fichier.cells;
          etat.n = Number(f[COL_N]) || 0;
          etat.instant = Math.max(etat.instant + 1, Date.now());     // l'import écrit « maintenant » (preparerLignePartieV1)
          etat.base = f.slice(); void base;
          rep({ ok: true, decalees: 0, delta: 0 });
        } else if (m.type === "acquitter") {
          if (m.fluxJusqua != null) etat.flux = etat.flux.filter((e) => !(e.n <= Number(m.fluxJusqua)));
          if (m.gainsJusqua != null) etat.gains = etat.gains.filter((e) => !(e.n <= Number(m.gainsJusqua)));
          rep(true);
        } else rep(true);
      });
    }
  }
  const indexedDB = {
    open() {
      const r = {};
      setTimeout(() => {
        const fin = (tx) => setTimeout(() => tx.oncomplete && tx.oncomplete(), 0);
        r.result = {
          createObjectStore() {}, close() {},
          transaction() {
            const tx = {};
            tx.objectStore = () => ({
              get(k) { const q = { result: store.has(k) ? structuredClone(store.get(k)) : undefined }; fin(tx); return q; },
              put(v, k) { store.set(k, structuredClone(v)); fin(tx); return {}; },
              delete(k) { store.delete(k); fin(tx); return {}; }
            });
            return tx;
          }
        };
        if (r.onupgradeneeded) r.onupgradeneeded();
        if (r.onsuccess) r.onsuccess();
      }, 0);
      return r;
    }
  };
  const fetch = async (url, opt) => {
    if (String(url).indexOf("/api/v1/local/export") === 0) {
      if (!exp) throw new TypeError("Failed to fetch");   // réseau coupé : aucune réponse HTTP
      const appareil = new URL("http://x" + String(url)).searchParams.get("appareil") || "";
      const e = typeof exp === "function" ? exp(appareil) : exp;   // fonction : le VRAI export serveur est calculé au moment de la requête, avec l identifiant d appareil que la page envoie
      mondeApi.expRecu = e;
      return { ok: true, json: async () => e };
    }
    if (String(url).indexOf("/api/v1/local/push") === 0) {
      const corps = JSON.parse(opt.body);
      pushes.push(corps);
      const rep = await mondeApi.push(corps, pushes.length - 1, opt.signal);
      return { ok: true, json: async () => rep };
    }
    return { ok: true, json: async () => ({ ok: true, textes: [] }) };
  };
  const ecouteurs = {};
  const ecoute = (nom, f) => { (ecouteurs[nom] = ecouteurs[nom] || []).push(f); };
  mondeApi.evenement = (nom) => (ecouteurs[nom] || []).forEach((f) => f({}));
  mondeApi.document = { addEventListener: ecoute, createElement: () => ({ style: {} }), getElementById: () => null, body: { appendChild() {} }, visibilityState: "visible", hidden: false };
  const win = { addEventListener: ecoute, __SOREAL_IDLE_ECART_V1__: undefined };
  const sandbox = {
    window: win, document: mondeApi.document,
    FileReader: class { readAsText(f) { setTimeout(() => { this.result = f.text; this.onload(); }, 0); } },
    location: { search: "", href: "http://x/", reload() { mondeApi.rechargements.push(structuredClone([...store.entries()])); } }, localStorage: { getItem: () => null, removeItem() {} },
    Worker, WebAssembly: {}, AbortController, indexedDB, fetch, URL, URLSearchParams, performance, structuredClone, console,
    setTimeout: (f, ms) => (sansMinuterie && ms >= 300 && ms < 5000 ? 0 : setTimeout(f, ms === 4000 ? 2000 : Math.min(ms || 0, 5))), clearTimeout, setInterval: () => 0, clearInterval() {}
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  mondeApi.ML = win.__SOREAL_IDLE_MOTEUR_LOCAL_V1__;
  mondeApi.win = win;
  mondeApi.action = () => mondeApi.ML.appeler("acheterEntrainementSorealIdle", [], undefined, "fr", "jeton");
  mondeApi.demarrer = () => mondeApi.ML.appeler("obtenirEtatSorealIdle", [], undefined, "fr", "jeton");
  mondeApi.cle = "etat:2:technicien.soreal@gmail.com";   // « etat:<index de la ligne>:<e-mail> » (moteur-local-v1.js demarrer)
  return mondeApi;
}

/* Petit cadre : exécute un scénario, affiche OK ou l'échec et sort avec le bon code (les repros d'un défaut ACTUEL doivent sortir en 1). */
export async function scenario(nom, corps) {
  try { await corps(); console.log(nom + " : OK (le défaut n'est PLUS reproduit)"); }
  catch (e) { console.log(nom + " : ECHEC (défaut reproduit) -> " + (e && e.message || e)); process.exitCode = 1; }
}
