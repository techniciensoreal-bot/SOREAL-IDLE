import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createIdleAdventureStateV47,
  applyIdleAdventureActionV47,
  idleAdventureBoostV1,
  idleAdventureAddItemV1
} from "../src/idle-adventure-v47.js";
import {
  applyIdleInventoryAutoActionV1,
  normalizeIdleInventoryAutoV1
} from "../src/idle-inventory-auto-v1.js";
import {
  IDLE_NGU_EXP_SHOP_V1,
  normalizeIdleNguState,
  applyIdleNguAction,
  idleNguSnapshot
} from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-29) : « J'aimerai un bouton pour trier l'inventaire. Il classe dans cet ordre
 * automatiquement l'inventaire : bijoux en premier, armes, tete, torse, jambes, pieds, objets
 * divers, boost (Power, Toughness et en dernier special). De base, il ne serait pas dévérouillé,
 * mais tu peux l'ajouter dans le shop, dans la section débutant. Il coute 200 EXP. »
 * Fonctionnalité SOREAL originale (absente du wiki NGU Idle) : coût donné directement par Norman.
 */

function adv() {
  const s = createIdleAdventureStateV47();
  s.inventoryAuto = normalizeIdleInventoryAutoV1(null);
  return s;
}
function addItem(s, definitionId, level = 0) {
  const r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId, level }, {});
  const o = r.result;
  Object.assign(s, r.state);
  return s.inventory.find((x) => x.id === o.id);
}
function addBoost(s, type, strength, level = 0) {
  const b = idleAdventureBoostV1(type, strength);
  b.level = level;
  return idleAdventureAddItemV1(s, b);
}

// --- 1. EXP shop : achat unique à 200 EXP, exactement le coût donné par Norman. ---
{
  assert.equal(IDLE_NGU_EXP_SHOP_V1.sortInventory.cost(), 20);
  assert.equal(IDLE_NGU_EXP_SHOP_V1.sortInventory.max, 1, "achat unique (déblocage), pas un palier répétable");
}

// --- 2. Verrouillé de base : le mode refuse tant que l'achat n'a pas eu lieu. ---
{
  const s = adv();
  addItem(s, "sewers:ring");
  addItem(s, "sewers:weapon");
  assert.throws(
    () => applyIdleInventoryAutoActionV1({ adventure: s }, { mode: "sortInventory" }, { sortInventoryUnlocked: false }),
    /TRI_INVENTAIRE_VERROUILLE/
  );
  assert.throws(
    () => applyIdleInventoryAutoActionV1({ adventure: s }, { mode: "sortInventory" }, {}),
    /TRI_INVENTAIRE_VERROUILLE/,
    "env absent -> refusé aussi, jamais un déblocage par défaut"
  );
}

// --- 3. Ordre exact demandé : bijoux, armes, tête, torse, jambes, pieds, objets divers, boost (Power, Toughness, Special). ---
{
  const s = adv();
  /* Un Tutorial Cube existe déjà dans un adventure state fraîchement créé (kind:"cube" -> "accessory" -> "bijoux", même rang que sewers:ring, ajouté avant lui donc en tête à rang égal). */
  const cube = s.inventory[0];
  // Ajoutés dans un ordre volontairement inverse : seul le tri doit produire l'ordre attendu.
  const boostSpecial = addBoost(s, "special", 1);
  const boostToughness = addBoost(s, "toughness", 1);
  const boostPower = addBoost(s, "power", 1);
  const divers = addItem(s, "aNumber"); // slot:"special", objet non catégorisable en équipement (basicFilterTypeV1 -> "")
  const pieds = addItem(s, "sewers:boots");
  const jambes = addItem(s, "sewers:legs");
  const torse = addItem(s, "sewers:chest");
  const tete = addItem(s, "sewers:head");
  const armes = addItem(s, "sewers:weapon");
  const bijoux = addItem(s, "sewers:ring"); // accessoire = "bijoux" (aucune sous-catégorie bague/amulette dans le modèle de données)

  applyIdleInventoryAutoActionV1({ adventure: s }, { mode: "sortInventory" }, { sortInventoryUnlocked: true });

  const idsAttendus = [cube, bijoux, armes, tete, torse, jambes, pieds, divers, boostPower, boostToughness, boostSpecial].map((o) => o.id);
  const idsReels = s.inventorySlots.filter(Boolean);
  assert.deepEqual(idsReels, idsAttendus, "ordre exact demandé par Norman, quel que soit l'ordre d'ajout");
}

// --- 3 bis. Boosts triés par numéro croissant DANS leur catégorie (Norman, 2026-10-03) : Power 1, 2, 5… puis Toughness 1, 2… puis Special. ---
{
  const s = adv();
  s.inventory = [];
  const b = [["special", 2], ["power", 5], ["toughness", 1], ["power", 1], ["special", 1], ["power", 2], ["toughness", 5]].map(([t, n]) => addBoost(s, t, n));
  applyIdleInventoryAutoActionV1({ adventure: s }, { mode: "sortInventory" }, { sortInventoryUnlocked: true });
  const reel = s.inventorySlots.filter(Boolean).map((id) => { const o = s.inventory.find((x) => x.id === id); return o.boostType + o.strength; });
  assert.deepEqual(reel, ["power1", "power2", "power5", "toughness1", "toughness5", "special1", "special2"], "par catégorie puis par numéro croissant");
}

// --- 4. Les slots d'automerge (réservés, curés à la main par le joueur) ne sont jamais réordonnés par le tri. ---
{
  const s = adv();
  s.inventory = []; // retire le Tutorial Cube de départ, hors sujet pour ce test
  s.mergeSlots = 2;
  const dansAutomerge = addItem(s, "sewers:boots"); // volontairement "mal" catégorisé dans un slot d'automerge
  const bijouxHors = addItem(s, "sewers:ring");
  const armeHors = addItem(s, "sewers:weapon");
  s.inventorySlots = [dansAutomerge.id, "", armeHors.id, bijouxHors.id]; // hors automerge, volontairement dans le mauvais ordre
  applyIdleInventoryAutoActionV1({ adventure: s }, { mode: "sortInventory" }, { sortInventoryUnlocked: true });
  assert.equal(s.inventorySlots[0], dansAutomerge.id, "le slot d'automerge n'est jamais touché par le tri, même mal catégorisé");
  assert.equal(s.inventorySlots[1], "", "le second slot d'automerge (vide) reste vide, jamais comblé par le tri");
  assert.equal(s.inventorySlots[2], bijouxHors.id, "bijoux avant armes, uniquement hors des slots d'automerge");
  assert.equal(s.inventorySlots[3], armeHors.id);
}

// --- 5. Achat réel (buyExpShop) : verrouillé par défaut, débloqué après achat, 20 EXP dépensés. ---
{
  const ctx = { bosses: 40 };
  let state = normalizeIdleNguState({}, ctx, 0);
  state.currencies.experience = 500;
  let snap = idleNguSnapshot(state, ctx, 0);
  assert.equal(snap.inventoryAuto.unlocked.sortInventory, false, "verrouillé de base, comme demandé");
  state = applyIdleNguAction(state, { action: "buyExpShop", item: "sortInventory", quantity: 1 }, ctx, 0).state;
  assert.equal(state.currencies.experience, 480, "20 EXP dépensés (Norman, 2026-10-02 : rayon Toc), exactement le coût annoncé");
  snap = idleNguSnapshot(state, ctx, 0);
  assert.equal(snap.inventoryAuto.unlocked.sortInventory, true, "débloqué après achat");

  // Un second achat est refusé (max:1, comme Auto Merge) : jamais un second débit.
  assert.throws(() => applyIdleNguAction(state, { action: "buyExpShop", item: "sortInventory", quantity: 1 }, ctx, 0), /./);
}

// --- 6. Boutique EXP (section Débuts) : présent, avec son nom, son aide et son coût -- comme Auto Merge. ---
{
  const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
  assert.match(meta, /IDLE_EXP_TOC_V1=\[[^\]]*'sortInventory'[^\]]*\]/, "doit apparaître dans le rayon Toc (Norman, 2026-10-02)");
  assert.match(meta, /sortInventory:'[^']*Trier l.inventaire'/, "nom affiché dans la boutique");
  assert.match(meta, /sortInventory:'Débloque un bouton « Trier »[^']*'/, "aide affichée dans la boutique");
  assert.match(meta, /sortInventory:'adventure'/, "même visibilité anti-spoil qu'Auto Merge (masqué avant Adventure)");
}

// --- 7. Bouton dans le sac : jamais affiché avant l'achat (AGENTS.md règle n°2 -- aucun cadenas, aucun prix hors du Shop). ---
{
  const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
  const iGarde = ui.indexOf("j.systemes&&j.systemes.inventoryAuto&&j.systemes.inventoryAuto.unlocked&&j.systemes.inventoryAuto.unlocked.sortInventory");
  assert.ok(iGarde > 0, "le bouton Trier doit être conditionné au déblocage, jamais affiché verrouillé");
  const iTrier = ui.indexOf("🗂️ Trier</button>", iGarde);
  assert.ok(iTrier > iGarde && iTrier - iGarde < 400, "le bouton Trier doit se trouver juste après cette garde de déblocage");
  assert.ok(
    ui.includes("onclick=\"window.__actionMetaV47__({action:\\'inventoryAuto\\',mode:\\'sortInventory\\'})\""),
    "doit envoyer exactement {action:'inventoryAuto',mode:'sortInventory'}"
  );
}

// --- 8. Même nom = côte à côte (Norman, 2026-10-03) : A, B, A -> A, A, B dans la catégorie. ---
{
  const s = adv();
  const a1 = addItem(s, "sewers:ring");
  const b = addItem(s, "forest:ring");
  const a2 = addItem(s, "sewers:ring");
  if (a1.name !== b.name) {
    applyIdleInventoryAutoActionV1({ adventure: s }, { mode: "sortInventory" }, { sortInventoryUnlocked: true });
    const noms = s.inventorySlots.filter(Boolean).map((id) => s.inventory.find((x) => x.id === id).name);
    assert.deepEqual(noms.filter((n) => n !== "Cube tutoriel"), [a1.name, a2.name, b.name], "les deux objets du même nom se suivent");
  }
}

console.log("idle-inventory-sort-v1: OK");
