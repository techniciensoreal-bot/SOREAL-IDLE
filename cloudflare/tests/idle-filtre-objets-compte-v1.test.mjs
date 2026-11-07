import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-07) : « mon filtre à objets avancé s'est reset de nouveau. Il m'a retiré tout ce que j'avais coché. » Le choix des objets filtrés est AUSSI une préférence de compte (règle n°6) :
 * si le moteur ne la reflète plus (réinitialisation, état plus ancien, autre appareil), le client lui renvoie les objets cochés ; seul le joueur change la liste.
 */
const mem = {};
const localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
const actions = [];
const noop = () => {};
const document = { getElementById: () => null, addEventListener: noop, querySelectorAll: () => [], head: { appendChild: noop }, createElement: () => ({}) };
let etat = null;
const window = { document, addEventListener: noop, __actionMetaV47__: (p) => { actions.push(p); /* le moteur applique l'action */ const it = etat.systemes.inventoryAuto.lootFilter.items; const d = String(p.definitionId); const i = it.indexOf(d); if (p.filtered && i < 0) it.push(d); if (!p.filtered && i >= 0) it.splice(i, 1); }, confirm: () => true,
  __SOREAL_IDLE_RUNTIME_V1__: { onRender: noop, getState: () => Promise.resolve(etat) } };
const sandbox = { window, document, setTimeout: (f) => { f(); return 0; }, setInterval: () => 0, localStorage, performance: { now: () => 0 } };
vm.runInNewContext(readFileSync("cloudflare/public/modules/inventory-auto-v1.js", "utf8"), sandbox);
const api0 = window.__SOREAL_IDLE_INVENTORY_AUTO_V1__;
const api = Object.assign({}, api0, { filtreCompte: () => { const v = api0.filtreCompte(); return v === null ? null : Array.from(v); } });
assert.ok(api && typeof api.reconcilierFiltre === "function", "module chargé");

const decouverts = ["a:1", "a:2", "a:3", "b:1"].map((definitionId) => ({ definitionId, name: definitionId }));
const nouvelEtat = (items, improved = true) => ({ systemes: { inventoryAuto: { unlocked: { lootFilterImproved: improved }, lootFilter: { types: {}, items: items.slice() }, filterable: decouverts } } });

/* 1. première utilisation : la préférence prend le filtre du moteur, rien n'est envoyé */
etat = nouvelEtat(["a:1", "a:2"]); api.etat(etat); api.reconcilierFiltre();
assert.deepEqual(api.filtreCompte().sort(), ["a:1", "a:2"], "préférence créée à partir du moteur");
assert.equal(actions.length, 0, "rien à renvoyer");

/* 2. le joueur coche un objet : la préférence suit tout de suite */
window.__inventaireAutoFiltreObjetV1__("a:3", true);
assert.deepEqual(api.filtreCompte().sort(), ["a:1", "a:2", "a:3"], "case cochée enregistrée dans la préférence");

/* 3. le moteur a tout perdu (réinitialisation) : les objets cochés lui sont renvoyés */
actions.length = 0;
etat = nouvelEtat([]); api.etat(etat); api.reconcilierFiltre();
assert.deepEqual(Array.from(etat.systemes.inventoryAuto.lootFilter.items).sort(), ["a:1", "a:2", "a:3"], "filtre restauré dans le moteur");
assert.equal(actions.length, 3, "un envoi par objet");
assert.ok(actions.every((a) => a.action === "inventoryAuto" && a.mode === "lootFilterItem" && a.filtered === true), "envois de cases cochées");

/* 4. le joueur décoche : la préférence suit, et le moteur n'a pas à re-cocher */
window.__inventaireAutoFiltreObjetV1__("a:2", false);
assert.deepEqual(api.filtreCompte().sort(), ["a:1", "a:3"], "case décochée enregistrée");
actions.length = 0; etat = nouvelEtat(["a:1", "a:3"]); api.etat(etat); api.reconcilierFiltre();
assert.equal(actions.length, 0, "moteur et préférence d'accord : rien à faire");

/* 5. décoché ailleurs (la préférence a changé) : le moteur suit */
mem.soreal_idle_filtre_objets_v1_0 = "a:1";
etat = nouvelEtat(["a:1", "a:3"]); api.etat(etat); api.reconcilierFiltre();
assert.deepEqual(etat.systemes.inventoryAuto.lootFilter.items, ["a:1"], "l'objet décoché sur un autre appareil est décoché ici aussi");

/* 6. filtre avancé non obtenu : aucune action, aucune préférence touchée */
actions.length = 0; etat = nouvelEtat([], false); api.etat(etat); api.reconcilierFiltre();
assert.equal(actions.length, 0, "rien tant que le filtre amélioré n'est pas possédé");

/* 7. un objet pas encore découvert n'est jamais envoyé (le moteur le refuserait) */
mem.soreal_idle_filtre_objets_v1_0 = "a:1|zz:inconnu";
actions.length = 0; etat = nouvelEtat([]); api.etat(etat); api.reconcilierFiltre();
assert.deepEqual(etat.systemes.inventoryAuto.lootFilter.items, ["a:1"], "seuls les objets découverts sont restaurés");

/* 8. préférence en morceaux de 6 000 caractères au plus (limite d'une clé de préférence de compte) */
const longue = Array.from({ length: 900 }, (_, i) => "objet_tres_long_numero_" + i + ":x");
etat = nouvelEtat([]); api.etat(etat);
for (const d of longue) window.__inventaireAutoFiltreObjetV1__(d, true);
const cles = Object.keys(mem).filter((k) => k.startsWith("soreal_idle_filtre_objets_v1"));
assert.ok(cles.length > 2, "plusieurs morceaux");
for (const k of cles) { assert.ok(mem[k].length <= 8000, "valeur ≤ 8 000 caractères : " + k); assert.ok(k.length <= 120 && /^[A-Za-z0-9_.:-]+$/.test(k), "clé valide : " + k); }
assert.equal(api.filtreCompte().length, 900 + 2, "aucun objet perdu dans les morceaux");
console.log("idle-filtre-objets-compte-v1: OK");
