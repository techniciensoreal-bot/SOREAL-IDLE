import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  const attendu = def.kind === "equipment" || (def.kind === "special" && def.slot !== "consumable");
  assert.equal(ids.has(id), attendu, "case du Coffre pour " + id);
}
assert.equal(ids.has("tutorialCube"), false);
assert.equal(ids.has("mysteriousRedLiquid"), false);
assert.equal(ids.has("pissedOffKey"), true, "les objets de set de slot special (montés niveau 100 pour le bonus de complétion) ont leur case");

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


// --- Regroupement : zones, puis titans, cœurs, Looty, pendentifs, autres ---
const groupes = toutes.map((c) => c.groupe);
const ordreG = ["zone", "titan", "coeur", "looty", "pendentif", "autre"];
for (let i = 1; i < groupes.length; i += 1) assert.ok(ordreG.indexOf(groupes[i]) >= ordreG.indexOf(groupes[i - 1]), "les groupes ne se mélangent pas : " + toutes[i].definitionId);
const g = (id) => toutes.find((c) => c.definitionId === id);
assert.equal(g("tubaTime").groupe, "zone");
assert.equal(g("tubaTime").groupeNom, IDLE_ADVENTURE_ZONES.find((z) => z.id === "forest").name);
assert.equal(g("wanderersCane").groupe, "titan");
assert.equal(g("kingLooty").groupe, "titan", "un Looty lâché par un titan est rangé avec les titans");
assert.equal(g("grb:weapon").groupe, "titan", "les pièces de set de titan (GRB) aussi");
assert.equal(g("heartRed").groupe, "coeur");
assert.equal(g("heartRainbow").groupe, "coeur");
assert.equal(g("lootyMcLootFace").groupe, "looty");
assert.equal(g("ascendedX8Pendant").groupe, "pendentif");
// Chaque case a un groupe connu, et rien ne reste sans titre.
assert.ok(toutes.every((c) => ordreG.includes(c.groupe) && typeof c.groupeNom === "string"));
assert.ok(toutes.filter((c) => c.groupe !== "zone").every((c) => c.groupeNom.length > 0));
// Les titans sont rangés par ordre de progression (GRB avant Jake, avant UUG...).
const posTitan = (id) => toutes.findIndex((c) => c.definitionId === id);
assert.ok(posTitan("aNumber") < posTitan("stapler") && posTitan("stapler") < posTitan("uugHair") && posTitan("uugHair") < posTitan("wanderersCane"));

// --- Anti-spoil : les cases existent toutes côté moteur, mais le client n'en reçoit qu'une fois l'objet vu ---
let a = normalizeIdleAdventureStateV47({});
let vues = idleAdventureSnapshotV47(a, ctx, 1000).coffreSlots;
assert.equal(vues.some((c) => c.groupe === "coeur"), false, "aucun cœur envoyé tant qu'aucun cœur n'est possédé");
a = agir(a, { action: "addItem", definitionId: "heartRed", level: 0 }).state;
vues = idleAdventureSnapshotV47(a, ctx, 1000).coffreSlots;
assert.deepEqual(vues.filter((c) => c.groupe === "coeur").map((c) => c.definitionId), ["heartRed"], "le 1er cœur acheté fait apparaître SA case, pas les autres");

// --- La table des butins de titans couvre tous les objets que rollTitanLootV1 distribue ---
const src = readFileSync(new URL("../src/idle-adventure-v47.js", import.meta.url), "utf8");
const debut = src.indexOf("function rollTitanLootV1");
const corps = src.slice(debut, src.indexOf("const TITAN_LOOT_CUBE_ROOT_V1", debut));
const table = src.slice(src.indexOf("const IDLE_ADVENTURE_COFFRE_TITAN_OBJETS_V1"), src.indexOf("const IDLE_ADVENTURE_COFFRE_COEURS_V1"));
const speciaux = new Set(Object.entries(IDLE_ADVENTURE_ITEM_CATALOG_V1).filter(([, d]) => d.kind === "special").map(([id]) => id));
const manquants = [...new Set([...corps.matchAll(/"([A-Za-z0-9]+)"/g)].map((m) => m[1]).filter((x) => speciaux.has(x) && !["mysteriousRedLiquid", "mysteriousPurpleLiquid", "mysteriousGreyLiquid"].includes(x)))].filter((x) => !table.includes('"' + x + '"'));
assert.deepEqual(manquants, [], "objets de titans absents de la table du Coffre");

console.log("idle-coffre-specials-v1: OK");
