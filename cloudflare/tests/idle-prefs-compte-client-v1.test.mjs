import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-16) : cases, saisies, onglets, réglages liés au COMPTE, pareils sur tous les appareils. Ce test fait tourner le VRAI modules/prefs-compte-v1.js sur un faux navigateur (stockage, minuteries,
 * serveur) : écriture groupée, valeurs du compte reprises, première fois sur un appareil, suppression, rechargement unique, clés jamais synchronisées.
 */
const code = readFileSync("cloudflare/public/modules/prefs-compte-v1.js", "utf8");
function appareil(initial = {}) {
  class Storage { constructor() { this.d = new Map(); } setItem(k, v) { this.d.set(String(k), String(v)); } getItem(k) { return this.d.has(String(k)) ? this.d.get(String(k)) : null; } removeItem(k) { this.d.delete(String(k)); } key(i) { return [...this.d.keys()][i] ?? null; } get length() { return this.d.size; } }
  const local = new Storage(), session = new Storage();
  Object.entries(initial).forEach(([k, v]) => local.d.set(k, v));
  const minuteries = []; const appels = []; const rechargements = [];
  let serveur = {}; let enPanne = false;
  const fen = {
    Storage, localStorage: local, sessionStorage: session, Object, Array, Promise, Date, String, Number, Boolean,
    document: { hidden: false, addEventListener() {} }, addEventListener() {},
    setTimeout: (f, d) => { minuteries.push({ f, d }); return minuteries.length; }, clearTimeout: (i) => { if (minuteries[i - 1]) minuteries[i - 1].f = null; },
    location: { reload() { rechargements.push(1); } },
    __SOREAL_IDLE_CALL_V1__: async (op, args) => {
      appels.push({ op, args });
      if (enPanne) throw new Error("hors ligne");
      const prefs = args[0].prefs; for (const [k, v] of Object.entries(prefs)) { if (v === null) delete serveur[k]; else serveur[k] = v; }
      return { ok: true, joueur: { nom: "Norman", systemes: { uiPrefs: { ...serveur } } } };
    }
  };
  fen.window = fen;
  vm.runInNewContext(code, fen, { filename: "prefs-compte-v1.js" });
  const tourner = async () => { for (let i = 0; i < 5; i += 1) { const m = minuteries.splice(0).filter((x) => x.f); for (const x of m) x.f(); await new Promise((r) => setImmediate(r)); } };
  return { fen, local, session, appels, rechargements, tourner, api: fen.__SOREAL_IDLE_PREFS_V1__, getServeur: () => ({ ...serveur }), panne: (b) => { enPanne = b; } };
}
const plat = (x) => JSON.parse(JSON.stringify(x));
const joueur = (prefs) => ({ nom: "Norman", systemes: { uiPrefs: prefs } });

// 1. Écriture : suivie -> envoyée en UN lot groupé ; non suivie / session -> jamais.
{
  const a = appareil();
  a.api.appliquer(joueur({}));                 // première réception : marque l'appareil comme initialisé
  await a.tourner(); a.appels.length = 0;
  a.fen.localStorage.setItem("soreal_idle_montant_input_v1", "250");
  a.fen.localStorage.setItem("soreal_idle_bt_synchro_v1", "1");
  a.fen.localStorage.setItem("soreal_idle_session_v1", "SECRET");
  a.fen.localStorage.setItem("autre_site_cle", "x");
  a.fen.localStorage.setItem("soreal_idle_perf_v1", "mesures");   // journal de mesures : change toutes les 10 s, jamais envoyé
  a.fen.sessionStorage.setItem("soreal_idle_montant_input_v1", "pas ça");
  assert.equal(a.appels.length, 0, "rien n'est envoyé tout de suite (groupé)");
  await a.tourner();
  assert.equal(a.appels.length, 1, "un seul envoi pour tout le lot");
  assert.equal(a.appels[0].op, "agirProgressionSorealIdle");
  assert.deepEqual(plat(a.appels[0].args[0]), { action: "setUiPrefs", prefs: { soreal_idle_montant_input_v1: "250", soreal_idle_bt_synchro_v1: "1" } }, "clés du jeu seulement ; jamais la session");
  a.fen.localStorage.removeItem("soreal_idle_bt_synchro_v1");
  await a.tourner();
  assert.deepEqual(plat(a.appels[1].args[0].prefs), { soreal_idle_bt_synchro_v1: null }, "suppression envoyée");
  a.fen.localStorage.setItem("soreal_idle_montant_input_v1", "250"); await a.tourner();
  assert.equal(a.appels.length, 2, "une valeur déjà connue du compte n'est pas renvoyée");
}
// 2. Un autre appareil : les valeurs du compte l'emportent ; rechargement UNE fois.
{
  const b = appareil({ soreal_idle_montant_input_v1: "10" });
  b.local.d.set("soreal_idle_prefs_init_v1:Norman", "1");
  b.api.appliquer(joueur({ soreal_idle_montant_input_v1: "250", soreal_idle_bt_synchro_v1: "1" }));
  assert.equal(b.local.getItem("soreal_idle_montant_input_v1"), "250", "valeur du compte reprise");
  assert.equal(b.local.getItem("soreal_idle_bt_synchro_v1"), "1", "case du compte cochée ici aussi");
  assert.equal(b.rechargements.length, 1, "changement au chargement : un rechargement");
  b.api.appliquer(joueur({ soreal_idle_montant_input_v1: "300" }));
  assert.equal(b.local.getItem("soreal_idle_montant_input_v1"), "300", "changement ultérieur : appliqué en direct");
  assert.equal(b.rechargements.length, 1, "pas de second rechargement");
  assert.equal(b.local.getItem("soreal_idle_bt_synchro_v1"), null, "clé absente du compte (supprimée ailleurs) : supprimée ici");
  const c = appareil({ soreal_idle_montant_input_v1: "250" }); c.local.d.set("soreal_idle_prefs_init_v1:Norman", "1");
  c.api.appliquer(joueur({ soreal_idle_montant_input_v1: "250" }));
  assert.equal(c.rechargements.length, 0, "rien de changé : aucun rechargement");
}
// 3. Première fois sur un appareil : ses réglages existants montent au compte (rien de perdu), le compte l'emporte en cas de conflit.
{
  const d = appareil({ soreal_idle_volume_musique_v1: "0.3", soreal_idle_montant_input_v1: "5", soreal_idle_session_v1: "SECRET" });
  d.api.appliquer(joueur({ soreal_idle_montant_input_v1: "99" }));
  assert.equal(d.local.getItem("soreal_idle_montant_input_v1"), "99", "conflit : le compte l'emporte");
  await d.tourner();
  assert.deepEqual(plat(d.getServeur()), { soreal_idle_volume_musique_v1: "0.3" }, "réglage local inconnu du compte envoyé ; session jamais");
}
// 4. Un changement fait ici et pas encore envoyé n'est pas écrasé par une réponse du serveur ; clé trop grosse jamais supprimée ; panne : on réessaie.
{
  const e = appareil(); e.api.appliquer(joueur({})); await e.tourner(); e.appels.length = 0;
  e.local.setItem("soreal_idle_montant_input_v1", "7");
  e.api.appliquer(joueur({ soreal_idle_montant_input_v1: "1" }));
  assert.equal(e.local.getItem("soreal_idle_montant_input_v1"), "7", "changement local en attente protégé");
  const f = appareil(); f.local.d.set("soreal_idle_prefs_init_v1:Norman", "1");
  f.local.d.set("soreal_idle_succes_vus_v1", "x".repeat(9000));
  f.api.appliquer(joueur({}));
  assert.equal(f.local.getItem("soreal_idle_succes_vus_v1").length, 9000, "valeur trop grosse pour le compte : gardée en local");
  const g = appareil(); g.api.appliquer(joueur({})); await g.tourner(); g.appels.length = 0;
  g.panne(true); g.local.setItem("soreal_idle_montant_input_v1", "42"); await g.tourner();
  assert.ok(g.appels.length >= 1 && Object.keys(g.api.attente()).length === 1, "échec : le changement reste en attente");
  g.panne(false); await g.tourner(); await g.tourner();
  assert.equal(g.getServeur().soreal_idle_montant_input_v1, "42", "réessayé et reçu");
}
// 5. Branchement : script chargé en premier, pont qui applique.
const html = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(html.indexOf("/modules/prefs-compte-v1.js?v=") > 0 && html.indexOf("/modules/prefs-compte-v1.js") < html.indexOf("/modules/perf-texte-v1.js"), "chargé avant les autres modules");
assert.ok(readFileSync("cloudflare/public/standalone-bridge.js", "utf8").includes("__SOREAL_IDLE_PREFS_V1__.appliquer(data.joueur)"), "le pont remet les préférences à chaque réponse");
console.log("idle-prefs-compte-client-v1: OK");
