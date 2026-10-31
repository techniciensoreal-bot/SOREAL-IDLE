import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { nettoyerUiPrefsV1, appliquerUiPrefsV1, IDLE_UI_PREFS_MAX_TOTAL_V1 } from "../src/idle-ui-prefs-v1.js";

/*
 * Norman (2026-10-31) : « les chiffres que je mets dans les champs ne se sauvegardent plus ; ça doit être lié au COMPTE ». Causes gardées ici :
 *  1. le serveur coupait la liste TRIÉE par ordre alphabétique quand le total dépassait la limite : les saisies (« soreal_idle_m… ») disparaissaient en silence, puis le client les SUPPRIMAIT de l'appareil ;
 *  2. une valeur tapée juste avant la fermeture de l'application (envoi groupé 1,5 s) ou pas encore reçue par le compte était remplacée à la réouverture par la vieille valeur du compte.
 */
// 1. Serveur : les grosses listes sont écartées avant les petites saisies.
{
  const brut = {};
  for (let i = 0; i < 20; i += 1) brut["soreal_idle_a_liste_vue_" + String(i).padStart(2, "0")] = "x".repeat(7990);
  brut.soreal_idle_montant_input_v1 = "4242";
  brut.soreal_idle_montants_menu_v1 = '{"ngu":900}';
  brut.sorealIdleTargetV1 = "7";
  assert.ok(Object.values(brut).join("").length > IDLE_UI_PREFS_MAX_TOTAL_V1);
  const net = nettoyerUiPrefsV1(brut);
  assert.equal(net.soreal_idle_montant_input_v1, "4242");
  assert.equal(net.soreal_idle_montants_menu_v1, '{"ngu":900}');
  assert.equal(net.sorealIdleTargetV1, "7");
  assert.ok(JSON.stringify(net).length <= IDLE_UI_PREFS_MAX_TOTAL_V1 + 2000);
  const etat = { uiPrefs: brut };
  appliquerUiPrefsV1(etat, { soreal_idle_zz_cible_v1: "88" });
  assert.equal(etat.uiPrefs.soreal_idle_zz_cible_v1, "88", "une nouvelle saisie, même en fin d'alphabet, est gardée");
}

// 2. Client : vrai module sur faux navigateur.
const code = readFileSync(new URL("../public/modules/prefs-compte-v1.js", import.meta.url), "utf8");
function appareil(initial = {}) {
  class Storage { constructor() { this.d = new Map(); } setItem(k, v) { this.d.set(String(k), String(v)); } getItem(k) { return this.d.has(String(k)) ? this.d.get(String(k)) : null; } removeItem(k) { this.d.delete(String(k)); } key(i) { return [...this.d.keys()][i] ?? null; } get length() { return this.d.size; } }
  const local = new Storage(), session = new Storage();
  Object.entries(initial).forEach(([k, v]) => local.d.set(k, v));
  const minuteries = []; const appels = [];
  let serveur = {}; let refuse = () => false;
  const fen = {
    Storage, localStorage: local, sessionStorage: session, Object, Array, Promise, Date, String, Number, Boolean, JSON,
    document: { hidden: false, addEventListener() {} }, addEventListener() {},
    setTimeout: (f) => { minuteries.push({ f }); return minuteries.length; }, clearTimeout: (i) => { if (minuteries[i - 1]) minuteries[i - 1].f = null; },
    location: { reload() {} },
    __SOREAL_IDLE_CALL_V1__: async (op, args) => {
      appels.push(args[0].prefs);
      for (const [k, v] of Object.entries(args[0].prefs)) { if (refuse(k)) continue; if (v === null) delete serveur[k]; else serveur[k] = v; }
      return { ok: true, joueur: { nom: "Norman", systemes: { uiPrefs: { ...serveur } } } };
    }
  };
  fen.window = fen;
  vm.runInNewContext(code, fen, { filename: "prefs-compte-v1.js" });
  const tourner = async () => { for (let i = 0; i < 6; i += 1) { const m = minuteries.splice(0).filter((x) => x.f); for (const x of m) x.f(); await new Promise((r) => setImmediate(r)); } };
  return { fen, local, appels, tourner, api: fen.__SOREAL_IDLE_PREFS_V1__, serveur: () => serveur, setServeur: (o) => { serveur = o; }, refuser: (f) => { refuse = f; } };
}
const joueur = (prefs) => ({ nom: "Norman", systemes: { uiPrefs: prefs } });

// 2a. Fermeture avant l'envoi : à la réouverture, la valeur tapée n'est PAS remplacée par l'ancienne valeur du compte, et elle repart.
{
  const a = appareil();
  a.api.appliquer(joueur({ soreal_idle_montant_input_v1: "125" })); await a.tourner();
  a.fen.localStorage.setItem("soreal_idle_montant_input_v1", "777");   // tapé, l'application se ferme avant l'envoi
  const stockage = [...a.local.d.entries()];
  const b = appareil(Object.fromEntries(stockage));                     // réouverture : mémoire neuve, même stockage
  b.setServeur({ soreal_idle_montant_input_v1: "125" });
  b.api.appliquer(joueur({ soreal_idle_montant_input_v1: "125" }));
  assert.equal(b.local.getItem("soreal_idle_montant_input_v1"), "777", "la vieille valeur du compte n'écrase pas la saisie");
  await b.tourner();
  assert.equal(b.serveur().soreal_idle_montant_input_v1, "777", "la saisie repart vers le compte");
  b.api.appliquer(joueur({ ...b.serveur() }));
  assert.equal(b.local.getItem("soreal_idle_prefs_journal_v1"), null, "confirmé par le compte : le journal se vide");
  b.api.appliquer(joueur({ soreal_idle_montant_input_v1: "5" }));       // autre appareil, plus tard : le compte l'emporte de nouveau
  assert.equal(b.local.getItem("soreal_idle_montant_input_v1"), "5");
}
// 2b. Le compte a refusé une clé : elle n'est jamais supprimée de l'appareil (renvoyée une seule fois).
{
  const a = appareil();
  a.api.appliquer(joueur({})); await a.tourner();
  a.refuser((k) => k === "soreal_idle_zz_cible_v1");
  a.fen.localStorage.setItem("soreal_idle_zz_cible_v1", "31"); await a.tourner();
  a.api.appliquer(joueur({ ...a.serveur() })); await a.tourner();
  a.api.appliquer(joueur({ ...a.serveur() })); await a.tourner();
  assert.equal(a.local.getItem("soreal_idle_zz_cible_v1"), "31", "une saisie refusée par le compte reste sur l'appareil");
  assert.ok(a.appels.filter((p) => "soreal_idle_zz_cible_v1" in p).length <= 3, "pas de boucle d'envoi");
}
console.log("OK idle-prefs-saisies-conservees-v1");
