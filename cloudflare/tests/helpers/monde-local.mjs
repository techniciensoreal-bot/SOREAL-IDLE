import fs from "node:fs";
import vm from "node:vm";

/* Faux navigateur (Worker, IndexedDB, fetch simulés) autour du VRAI module moteur-local-v1.js : voir idle-sauvegarde-locale-protocole-v1.test.mjs. */
const code = fs.readFileSync(new URL("../../public/modules/moteur-local-v1.js", import.meta.url), "utf8");
export const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
export const tick = () => attendre(40);

export function ligne(n, instant) { const l = new Array(38).fill(""); l[1] = "Norman"; l[10] = n; l[15] = instant; l[18] = "n@x"; return l; }

export function monde({ ligneServeur, idb = null } = {}) {
  const store = new Map();
  if (idb) store.set("etat:2:n@x", idb);
  const pushes = [];
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
          const out = { cells: ligne(etat.n, etat.instant), flux: etat.flux.slice(), gains: etat.gains.slice(), instant: etat.instant };
          if (m.vider) { etat.flux = []; etat.gains = []; }   // ancien protocole : les événements quittent la file dès l'extraction
          rep(out);
        } else if (m.type === "acquitter") { etat.flux.splice(0, Number(m.flux) || 0); etat.gains.splice(0, Number(m.gains) || 0); rep(true); }
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
  const win = { addEventListener() {}, __SOREAL_IDLE_ECART_V1__: undefined };
  const sandbox = {
    window: win, document: { addEventListener() {}, createElement: () => ({ style: {} }), getElementById: () => null, body: { appendChild() {} }, visibilityState: "visible", hidden: false },
    location: { search: "", href: "http://x/" }, localStorage: { getItem: () => null, removeItem() {} },
    Worker, WebAssembly: {}, indexedDB, fetch, URL, URLSearchParams, performance, structuredClone, console,
    setTimeout: (f, ms) => setTimeout(f, Math.min(ms || 0, 5)), clearTimeout, setInterval: () => 0, clearInterval() {}
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  mondeApi.ML = win.__SOREAL_IDLE_MOTEUR_LOCAL_V1__;
  mondeApi.action = () => mondeApi.ML.appeler("acheterEntrainementSorealIdle", [], undefined, "fr", "jeton");
  return mondeApi;
}

