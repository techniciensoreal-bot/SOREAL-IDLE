import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-09-24) : « Dans les filtres, casque est toujours coché. Je n'arrive pas à le décocher. »
 * actionMetaIdleV130_ abandonne en silence une action envoyée pendant qu'une autre action méta est en cours : la case décochée à l'écran
 * revenait à sa valeur précédente sans que rien n'ait été enregistré. Les réglages du panneau sont maintenant renvoyés jusqu'à ce que
 * le serveur les reflète.
 */
const source = readFileSync("cloudflare/public/modules/inventory-auto-v1.js", "utf8");

// --- Bac à sable : horloge manuelle, serveur simulé qui ABANDONNE les 2 premières actions (comme « méta occupé ») ---
const minuteurs = [];
let temps = 0;
const setTimeoutSim = (fn, ms) => { minuteurs.push({ at: temps + ms, fn }); return minuteurs.length; };
async function avancerAsync(ms) { for (let t = 0; t < ms; t += 100) { avancer(100); await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); } }
function avancer(ms) {
  const fin = temps + ms;
  for (;;) {
    minuteurs.sort((a, b) => a.at - b.at);
    const suivant = minuteurs.find((m) => m.at <= fin);
    if (!suivant) break;
    minuteurs.splice(minuteurs.indexOf(suivant), 1);
    temps = suivant.at;
    suivant.fn();
  }
  temps = fin;
}
const serveur = { types: { head: true, chest: true }, actions: [], abandons: 2 };
const etatServeur = () => ({
  systemes: {
    adventure: { inventory: [], cube: {} },
    inventoryAuto: {
      unlocked: { lootFilterBasic: true }, settings: {}, lootFilterTypes: ["head", "chest", "legs"],
      lootFilter: { types: Object.assign({}, serveur.types), items: [] }, loadouts: [], filterable: []
    }
  }
});
const elements = {};
const document = {
  getElementById: (id) => elements[id] || null, addEventListener() {}, querySelectorAll: () => [], head: { appendChild() {} }, createElement: () => ({}),
  activeElement: null
};
const window = {
  document, addEventListener() {}, confirm: () => true,
  __actionMetaV47__: (p) => {
    serveur.actions.push(p);
    if (serveur.abandons > 0) { serveur.abandons -= 1; return; } // action abandonnée : rien n'est enregistré
    if (p.mode === "lootFilterType") { if (p.filtered) serveur.types[p.slot] = true; else delete serveur.types[p.slot]; }
  },
  __SOREAL_IDLE_RUNTIME_V1__: { getState: () => Promise.resolve(etatServeur()), onRender() {} }
};
vm.runInNewContext(source, { window, document, localStorage: { getItem: () => "1", setItem() {} }, setTimeout: setTimeoutSim, clearTimeout() {}, Promise, Object, Array, Math, Number, String, Boolean, Date, JSON });
const api = window.__SOREAL_IDLE_INVENTORY_AUTO_V1__;

// L'utilisateur décoche « Casque » : les deux premiers envois sont abandonnés, le troisième passe.
window.__inventaireAutoFiltreTypeV1__("head", false);
assert.equal(serveur.actions.length, 1, "un premier envoi immédiat");
assert.equal(serveur.types.head, true, "abandonné : le serveur n'a rien enregistré");
for (let i = 0; i < 12 && serveur.types.head; i += 1) { await avancerAsync(1500); }
assert.ok(!serveur.types.head, "renvoyé jusqu'à être enregistré");
assert.equal(serveur.actions.length, 3, "3 envois : 2 abandonnés + 1 pris en compte");
const nombreEnvois = serveur.actions.length;
for (let i = 0; i < 6; i += 1) { await avancerAsync(1500); }
assert.equal(serveur.actions.length, nombreEnvois, "plus aucun envoi une fois la valeur enregistrée");

// Le panneau affiche la valeur voulue (décochée) pendant l'attente : la case ne « rebondit » pas.
{
  serveur.types = { chest: true };
  serveur.abandons = 99; // le serveur ignore tout
  const avant = serveur.actions.length;
  window.__inventaireAutoFiltreTypeV1__("chest", false);
  const html = api.panneau(etatServeur());
  assert.match(html, /<input type="checkbox" onchange="window\.__inventaireAutoFiltreTypeV1__\('chest',this\.checked\)"> Torse/, "Torse affiché décoché tant que l'envoi est en cours");
  for (let i = 0; i < 30; i += 1) { await avancerAsync(1500); }
  assert.equal(serveur.actions.length - avant, 8, "au plus 8 envois puis abandon, jamais de boucle infinie");
  assert.match(api.panneau(etatServeur()), /<input type="checkbox" checked onchange="window\.__inventaireAutoFiltreTypeV1__\('chest',this\.checked\)"> Torse/, "après abandon, l'affichage reflète le serveur");
}

assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/inventory-auto-v1.js?v=6"));
console.log("idle-inventory-filter-reliable-v1: OK");
