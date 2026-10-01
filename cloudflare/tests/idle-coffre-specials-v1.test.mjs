import assert from "node:assert/strict";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47, idleAdventureSnapshotV47, IDLE_ADVENTURE_ITEM_CATALOG_V1, IDLE_ADVENTURE_ZONES } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-10-01) : « On ne peut pas ranger Tuba of Time dans le coffre. Chaque objet qui peut être monté level 100 doit y avoir sa
 * place. Rangé par zone. » Les objets « special » qui se portent (accessoires, armes...) ont maintenant leur case ; le Tutorial Cube, les
 * consommables et les objets de quête n'en ont pas.
 */
const ctx = { bosses: 300 };
const agir = (s, p) => applyIdleAdventureActionV47(s, p, ctx, 1000);
const cases = (s) => idleAdventureSnapshotV47(s, ctx, 1000).coffreSlots;

// Une case par objet portable ; aucune pour le cube, les consommables ni les objets de quête.
let s = normalizeIdleAdventureStateV47({});
for (const [id, def] of Object.entries(IDLE_ADVENTURE_ITEM_CATALOG_V1)) s.itemList[id] = { seen: true };
const toutes = cases(s);
const ids = new Set(toutes.map((c) => c.definitionId));
assert.ok(ids.has("tubaTime"), "Tuba of Time a sa case");
assert.ok(ids.has("cheeseGrater") && ids.has("kingLooty") && ids.has("wanderersCane"));
for (const [id, def] of Object.entries(IDLE_ADVENTURE_ITEM_CATALOG_V1)) {
  const attendu = def.kind === "equipment" || (def.kind === "special" && def.slot !== "special" && def.slot !== "consumable");
  assert.equal(ids.has(id), attendu, "case du Coffre pour " + id);
}
assert.equal(ids.has("tutorialCube"), false);
assert.equal(ids.has("mysteriousRedLiquid"), false);
assert.equal(ids.has("pissedOffKey"), false);

// Tuba of Time : rangé dans la zone Forêt, avant les objets de la Caverne.
const idx = (id) => toutes.findIndex((c) => c.definitionId === id);
const rangForet = IDLE_ADVENTURE_ZONES.findIndex((z) => z.id === "forest");
const rangCaverne = IDLE_ADVENTURE_ZONES.findIndex((z) => z.id === "cave");
assert.ok(rangForet < rangCaverne);
assert.ok(idx("forest:weapon") < idx("tubaTime"), "dans la zone Forêt, l'équipement du set d'abord");
assert.ok(idx("tubaTime") < idx("cave:head"), "Tuba of Time (Forêt) avant l'équipement de la Caverne");
assert.ok(idx("tubaTime") < idx("cheeseGrater"), "Forêt avant Caverne (Cheese Grater)");

// Dépôt : il faut qu'il soit pleinement maxé ; tant que non découvert, la case n'est pas envoyée au client.
let v = normalizeIdleAdventureStateV47({});
const snap = idleAdventureSnapshotV47(v, ctx, 1000).coffreSlots;
assert.equal(snap.some((c) => c.definitionId === "tubaTime"), false, "anti-spoil : pas de case pour un objet jamais vu");
let r = agir(v, { action: "addItem", definitionId: "tubaTime", level: 100 });
v = r.state;
const tuba = v.inventory.find((o) => o.definitionId === "tubaTime");
assert.ok(tuba, "Tuba dans le sac");
// Pas encore pleinement maxé (niveau 100 seul, sans boosts) : refusé, comme pour l'équipement de set.
assert.throws(() => agir(v, { action: "coffreDeposer", id: tuba.id }), /OBJET_NON_MAXE/);
// Pleinement maxé (Power, Toughness et Special au plafond grâce aux boosts) : accepté.
tuba.power = 1e9; tuba.toughness = 1e9; tuba.special = 1e9;
r = agir(v, { action: "coffreDeposer", id: tuba.id });
v = r.state;
assert.equal(v.inventory.some((o) => o.definitionId === "tubaTime"), false, "sorti du sac");
assert.equal(v.coffre.tubaTime.id, tuba.id, "rangé dans le Coffre");
const apres = idleAdventureSnapshotV47(v, ctx, 1000).coffreSlots.find((c) => c.definitionId === "tubaTime");
assert.equal(apres.occupe, true);
r = agir(v, { action: "coffreRetirer", id: tuba.id });
assert.ok(r.state.inventory.some((o) => o.definitionId === "tubaTime"), "repris");

// Les objets non portables restent refusés.
let c = agir(normalizeIdleAdventureStateV47({}), { action: "addItem", definitionId: "mysteriousRedLiquid", level: 100 }).state;
const liquide = c.inventory.find((o) => o.definitionId === "mysteriousRedLiquid");
if (liquide) assert.throws(() => agir(c, { action: "coffreDeposer", id: liquide.id }), /OBJET_NON_ELIGIBLE_COFFRE/);

console.log("idle-coffre-specials-v1: OK");
