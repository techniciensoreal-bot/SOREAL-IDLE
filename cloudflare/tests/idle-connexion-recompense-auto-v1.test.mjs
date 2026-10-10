import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-06) : la récompense de connexion est donnée dès la connexion, avec une annonce (jours consécutifs, AP récupérés).
 */
const mod = readFileSync("cloudflare/public/modules/connexion-recompense-v1.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(index.includes('<script defer src="/modules/connexion-recompense-v1.js?v=4"></script>'));
assert.ok(meta.includes("window.__connexionRecompenseAutoV1__&&window.__SOREAL_IDLE_CONNEXION_RECOMPENSE_V1__") && meta.includes(".annoncer(res.resultat)"));

// Comportement : réclamation automatique une seule fois, annonce avec série et AP.
const appels = [];
const noeuds = {};
const doc = {
  hidden: false,
  head: { appendChild() {} },
  body: { appendChild(n) { noeuds[n.id] = n; } },
  getElementById: (id) => noeuds[id] || null,
  querySelector: () => null,
  createElement: () => ({ id: "", className: "", setAttribute() {}, addEventListener() {}, set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h; }, parentNode: null })
};
let intervalle = null;
const win = {
  __SOREAL_IDLE_LIRE_ETAT_V1__: () => ({ systemes: { loginCalendar: { reclamable: true, prochainAp: 300 } } }),
  __actionMetaIdleV130__: (p) => appels.push(p)
};
const ctx = { window: win, document: doc, setInterval: (f) => { intervalle = f; }, setTimeout: () => 0, Date: { now: (() => { let t = 1e6; return () => (t += 3000); })() }, Math, Number, String };
vm.runInNewContext(mod, ctx);
const api = win.__SOREAL_IDLE_CONNEXION_RECOMPENSE_V1__;
assert.ok(api && typeof intervalle === "function");
api.essayer(); api.essayer();
assert.equal(appels.length, 1, "réclamée une seule fois");
assert.equal(JSON.stringify(appels[0]), JSON.stringify({ action: "loginCalendar" }));
assert.equal(win.__connexionRecompenseAutoV1__, true);
api.annoncer({ ap: 12340, case: 4, serie: 4, jours: 31 });
const html = noeuds["cx-recompense-v1"].innerHTML;
assert.ok(html.includes("Récompense de connexion") && html.includes("Case du jour : <b>4</b>") && html.includes("+12") && html.includes("AP"), "annonce : case du jour et AP");
assert.ok(!html.includes("Merci de jouer"), "pas de remerciement sans jour raté");
// Premier mois : un jour raté depuis la dernière connexion = remerciement, la totalité est conservée (Norman, 2026-10-10).
api.annoncer({ ap: 12340, case: 6, serie: 4, jours: 31, merci: true, ratesDepuisConnexion: 2, manques: 0, reduction: 0 });
const htmlMerci = noeuds["cx-recompense-v1"].innerHTML;
assert.ok(htmlMerci.includes("Tu as raté <b>2</b> jour(s) depuis ta dernière connexion") && htmlMerci.includes("la totalité de tes récompenses") && htmlMerci.includes("Merci de jouer à mon jeu"), "remerciement du premier mois");
// Après le premier mois : information sur la réduction des récompenses restantes.
api.annoncer({ ap: 9000, case: 6, serie: 4, jours: 31, merci: false, ratesDepuisConnexion: 1, manques: 1, reduction: 10 });
const htmlPerte = noeuds["cx-recompense-v1"].innerHTML;
assert.ok(htmlPerte.includes("Tu as raté <b>1</b> jour(s)") && htmlPerte.includes("réduites de <b>10</b> %") && !htmlPerte.includes("Merci de jouer"), "information de réduction");

// Rien à réclamer / calendrier invisible : aucune opération.
const appels2 = [];
const win2 = { __SOREAL_IDLE_LIRE_ETAT_V1__: () => ({ systemes: { loginCalendar: null } }), __actionMetaIdleV130__: (p) => appels2.push(p) };
vm.runInNewContext(mod, { window: win2, document: doc, setInterval() {}, setTimeout: () => 0, Date: { now: () => 1e9 }, Math, Number, String });
win2.__SOREAL_IDLE_CONNEXION_RECOMPENSE_V1__.essayer();
assert.equal(appels2.length, 0, "calendrier pas encore visible : rien n'est envoyé");
console.log("idle-connexion-recompense-auto-v1: OK");
