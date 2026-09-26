import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Panneau client « Automatisation de l'inventaire » (modules/inventory-auto-v1.js) rendu depuis un
 * vrai snapshot serveur : verrous, déblocages après achat, actions envoyées, chargement par index.html.
 */
const actions = [];
const noop = () => {};
const document = { getElementById: () => null, addEventListener: noop, querySelectorAll: () => [], head: { appendChild: noop }, createElement: () => ({}) };
const window = { document, addEventListener: noop, __actionMetaV47__: (p) => actions.push(p), confirm: () => true };
/* le panneau d'options est repliable (fermé par défaut) : ces vérifications lisent son contenu, donc panneau ouvert */
const sandbox = { window, document, setTimeout: () => 0, localStorage: { getItem: () => "1", setItem() {} } };
vm.runInNewContext(readFileSync("cloudflare/public/modules/inventory-auto-v1.js", "utf8"), sandbox);
const api = window.__SOREAL_IDLE_INVENTORY_AUTO_V1__;
assert.ok(api && typeof api.panneau === "function", "module chargé");

const ctx = { bosses: 100 };
const t0 = 5_000_000;
{
  const snap = idleNguSnapshot(normalizeIdleNguState({}, ctx, t0), ctx, t0);
  const html = api.panneau({ systemes: snap });
  assert.match(html, /Automatisation de l’inventaire/);
  assert.match(html, /🔒 Achat « Auto Merge » dans la boutique EXP\./);
  assert.match(html, /🔒 1re complétion du No Equipment Challenge\./);
  assert.match(html, /Slots d’automerge : 0 \/ 8/);
  assert.match(html, /Minuteur : <b>1 h 00 min<\/b>/);
}
{
  let s = normalizeIdleNguState({}, ctx, t0);
  s.currencies.experience = 5000;
  for (const item of ["autoMerge", "basicLootFilter", "loadoutSlots", "inventoryMergeSlot"]) s = applyIdleNguAction(s, { action: "buyExpShop", item }, ctx, t0).state;
  const snap = idleNguSnapshot(s, ctx, t0);
  const html = api.panneau({ systemes: snap });
  assert.doesNotMatch(html, /Achat « Auto Merge »/);
  assert.match(html, /Slots d’automerge : 1 \/ 8/);
  assert.match(html, /Configurations d’équipement \(2 \/ 10\)/);
  assert.match(html, /Casque/);
  /* 2026-09-24 : réglage « consommer les boosts recyclés » (Build History 2018, build .367), coché par défaut. */
  assert.match(html, /<input type="checkbox" checked onchange="window\.__inventaireAutoReglageV1__\('consumeRecycled',this\.checked\)"> ♻️/);
}
window.__inventaireAutoReglageV1__("autoMerge", true);
window.__inventaireAutoFiltreTypeV1__("head", true);
window.__inventaireAutoLoadoutV1__("apply", 1);
window.__inventaireAutoReglageV1__("consumeRecycled", false);
assert.deepEqual(JSON.parse(JSON.stringify(actions)), [
  { action: "inventoryAuto", mode: "settings", autoMerge: true },
  { action: "inventoryAuto", mode: "lootFilterType", slot: "head", filtered: true },
  { action: "inventoryAuto", mode: "loadoutApply", index: 1 },
  { action: "inventoryAuto", mode: "settings", consumeRecycled: false }
]);

const index = readFileSync("cloudflare/public/index.html", "utf8");
/* 2026-09-24 : ?v=1 -> ?v=2 (case « consumeRecycled » ajoutée au panneau), puis ?v=3 (le panneau passe après le Coffre). */
assert.ok(index.includes('<script src="/modules/inventory-auto-v1.js?v=6"></script>'));
assert.ok(index.indexOf("/modules/inventory-auto-v1.js") < index.indexOf("/soreal-idle-ui.js"), "chargé avant le monolithe, comme les autres modules");

/* 2026-09-24 (Norman) : le Coffre vient avant toutes les options (filtre de butin, etc.). */
{
  const src = readFileSync("cloudflare/public/modules/inventory-auto-v1.js", "utf8");
  assert.ok(src.includes("soreal-idle-coffre-titre-v1"), "le panneau se place après la section Coffre");
  assert.ok(src.includes("repere.parentNode.insertBefore(bloc,repere.nextSibling)"), "inséré juste après le repère (Coffre, à défaut le sac)");
  assert.ok(!src.includes("colonnes.parentNode.insertBefore(bloc,colonnes.nextSibling)"), "plus d'insertion directe sous le sac");
}

console.log("idle-inventory-auto-client ok");
