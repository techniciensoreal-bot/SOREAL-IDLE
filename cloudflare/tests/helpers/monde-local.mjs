import fs from "node:fs";
import vm from "node:vm";

/* Faux navigateur (Worker, IndexedDB, fetch simulés) autour du VRAI module moteur-local-v1.js : voir idle-sauvegarde-locale-protocole-v1.test.mjs. */
const code = fs.readFileSync(new URL("../../public/modules/moteur-local-v1.js", import.meta.url), "utf8");
export const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
export const tick = () => attendre(40);

export function ligne(n, instant) { const l = new Array(38).fill(""); l[1] = "Norman"; l[10] = n; l[15] = instant; l[18] = "n@x"; return l; }

export function monde({ ligneServeur, idb = null, sansMinuterie = false, echelle = 0, lenteurSortant = 0 } = {}) {
  const store = new Map();
  if (idb) store.set("etat:2:n@x", idb);
  const pushes = [];
  const seq = { flux: 0, gains: 0 };
  const etat = { n: 0, instant: 0, flux: [], gains: [] };
  const mondeApi = { store, pushes, etat, push: async () => ({ ok: true, ecrit: true }), vue: null };
  class Worker {
    constructor() { mondeApi.worker = this; }
    postMessage(m) {
      Promise.resolve().then(() => {
        const rep = (resultat) => this.onmessage({ data: { id: m.id, ok: true, resultat } });
        if (m.type === "init") { const l = JSON.parse(m.export.joueurs.ligne); etat.n = Number(l[10]) || 0; etat.instant = Number(l[15]) || 0; if (m.export.reprise) { etat.flux = (m.export.reprise.flux || []).slice(); etat.gains = (m.export.reprise.gains || []).slice(); } rep(true); }
        else if (m.type === "appel") { if (!/^(obtenir|synchroniser)/.test(m.operation)) { etat.n += 1; etat.instant += 1000; } rep({ ok: true, joueur: {} }); }
        else if (m.type === "sortant") {
          for (const e of etat.flux) if (e.n == null) e.n = ++seq.flux;   // numérotation comme le vrai Worker
          for (const e of etat.gains) if (e.n == null) e.n = ++seq.gains;
          const out = { cells: ligne(etat.n, etat.instant), flux: etat.flux.slice(), gains: etat.gains.slice(), instant: etat.instant };
          if (m.vider) { etat.flux = []; etat.gains = []; }   // ancien protocole : les événements quittent la file dès l'extraction
          if (lenteurSortant) setTimeout(() => rep(out), lenteurSortant); else rep(out);
        } else if (m.type === "importer") { etat.n = Number(m.fichier.cells[10]) || 0; etat.instant = Number(m.fichier.cells[15]) || etat.instant; rep({ ok: true, decalees: 0, delta: 0 }); }
        else if (m.type === "acquitter") {
          if (m.fluxJusqua != null || m.gainsJusqua != null) { etat.flux = etat.flux.filter((e) => !(e.n <= Number(m.fluxJusqua))); etat.gains = etat.gains.filter((e) => !(e.n <= Number(m.gainsJusqua))); }
          else { etat.flux.splice(0, Number(m.flux) || 0); etat.gains.splice(0, Number(m.gains) || 0); }   // ancien protocole (comptage)
          rep(true);
        }
        else rep(true);
      });
    }
  }
  const indexedDB = {
    open() {
      const r = {};
      setTimeout(() => {
        const fin = (tx) => setTimeout(() => tx.oncomplete && tx.oncomplete(), 0);
        r.result = {
          createObjectStore() {},
          close() {},
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
  const exp = { ok: true, user: { email: "n@x" }, serveurAt: 5000, joueurs: { index: 2, ligne: JSON.stringify(ligneServeur || ligne(0, 1000)) }, feuilles: [], textes: [] };
  const fetch = async (url, opt) => {
    if (String(url).indexOf("/api/v1/local/export") === 0) return { ok: true, json: async () => exp };
    if (String(url).indexOf("/api/v1/local/push") === 0) {
      const corps = JSON.parse(opt.body);
      pushes.push(corps);
      const rep = await mondeApi.push(corps, pushes.length - 1);
      return { ok: true, json: async () => rep };
    }
    return { ok: true, json: async () => ({ ok: true, textes: [] }) };
  };
  const ecouteurs = {};
  const ecoute = (nom, f) => { (ecouteurs[nom] = ecouteurs[nom] || []).push(f); };
  mondeApi.evenement = (nom) => (ecouteurs[nom] || []).forEach((f) => f({}));
  mondeApi.rechargements = [];
  mondeApi.document = { addEventListener: ecoute, createElement: () => ({ style: {} }), getElementById: () => null, body: { appendChild() {} }, visibilityState: "visible", hidden: false };
  const win = { addEventListener: ecoute, __SOREAL_IDLE_ECART_V1__: undefined };
  const sandbox = {
    window: win, document: mondeApi.document,
    FileReader: class { readAsText(f) { setTimeout(() => { this.result = f.text; this.onload(); }, 0); } },
    location: { search: "", href: "http://x/", reload() { mondeApi.rechargements.push(structuredClone([...store.entries()])); } }, localStorage: { getItem: () => null, removeItem() {} },
    Worker, WebAssembly: {}, indexedDB, fetch, URL, URLSearchParams, performance, structuredClone, console,
    setTimeout: (f, ms) => (sansMinuterie && ms >= 300 && ms < 5000 ? 0 : setTimeout(f, echelle ? (ms || 0) / echelle : Math.min(ms || 0, 5))), clearTimeout, setInterval: () => 0, clearInterval() {}
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  mondeApi.ML = win.__SOREAL_IDLE_MOTEUR_LOCAL_V1__;
  mondeApi.win = win;
  mondeApi.action = () => mondeApi.ML.appeler("acheterEntrainementSorealIdle", [], undefined, "fr", "jeton");
  return mondeApi;
}

