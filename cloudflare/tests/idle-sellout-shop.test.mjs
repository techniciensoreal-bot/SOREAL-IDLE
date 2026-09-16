import assert from "node:assert/strict";
import {
  IDLE_SELLOUT_SHOP_CATALOG_V1,
  idleSelloutShopNextCostV1,
  idleSelloutShopBuyV1
} from "../src/idle-sellout-shop-v1.js";
import {
  idleNguSnapshot,
  IDLE_NGU_META_VERSION,
  IDLE_NGU_SAVE_SCHEMA
} from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-13) : "je veux exactement le même shop [4G's Sellout
 * Shop]. Je ne veux juste pas les menus qui permettent de dépenser de
 * l'argent réel."
 *
 * Catalogue vérifié directement sur ngu-idle.fandom.com/wiki/4G's_Sellout_Shop
 * (noms/effets/prix copiés tels quels). Exclus délibérément : "Packs"
 * (Kreds/argent réel) et "Buying AP" (achat direct d'AP, page Arbitrary
 * Points) — les deux seuls mécanismes d'argent réel du jeu, comme
 * demandé. "An Evil Accessory Slot" est aussi omis : SOREAL n'a pas de
 * difficulté Evil (scope "EARLY" déjà documenté ailleurs).
 */

// --- Le catalogue ne doit jamais contenir d'argent réel ---
{
  const idsInterdits = ["buyAp", "kreds", "pack", "realMoney"];
  for (const item of IDLE_SELLOUT_SHOP_CATALOG_V1) {
    assert.ok(
      !idsInterdits.some((forbidden) => item.id.toLowerCase().includes(forbidden.toLowerCase())),
      "Aucun objet du catalogue ne doit référencer un mécanisme d'argent réel : " + item.id
    );
  }
  assert.ok(IDLE_SELLOUT_SHOP_CATALOG_V1.length >= 70, "Le catalogue doit couvrir l'intégralité du vrai shop (~75 objets), pas un sous-ensemble réduit.");
}

// --- Formules de coût vérifiées contre les totaux exacts publiés par le wiki ---
{
  // "Extra Inventory Space... Total cost: 1,411,500" (166 achats).
  const item = IDLE_SELLOUT_SHOP_CATALOG_V1.find((x) => x.id === "extraInventorySpace");
  let total = 0;
  for (let n = 0; n < item.max; n++) total += idleSelloutShopNextCostV1(item, n);
  assert.equal(total, 1411500, "Le coût total d'Extra Inventory Space doit correspondre exactement au total publié par le wiki.");
  assert.equal(idleSelloutShopNextCostV1(item, item.max), null, "Au plafond (166), l'objet ne doit plus jamais avoir de coût (achat refusé).");
}
{
  // "Loadout Slot!... Total cost: 560,000" (7 achats).
  const item = IDLE_SELLOUT_SHOP_CATALOG_V1.find((x) => x.id === "loadoutSlot");
  let total = 0;
  for (let n = 0; n < item.max; n++) total += idleSelloutShopNextCostV1(item, n);
  assert.equal(total, 560000, "Le coût total de Loadout Slot doit correspondre exactement au total publié par le wiki.");
}
{
  // "An Extra Beard Slot!... 110,000 / 225,000" — 1er moins cher, les 3 suivants au même prix.
  const item = IDLE_SELLOUT_SHOP_CATALOG_V1.find((x) => x.id === "extraBeardSlot");
  assert.equal(idleSelloutShopNextCostV1(item, 0), 110000);
  assert.equal(idleSelloutShopNextCostV1(item, 1), 225000);
  assert.equal(idleSelloutShopNextCostV1(item, 3), 225000);
  assert.equal(idleSelloutShopNextCostV1(item, 4), null, "Max 4 : le 5e achat doit être refusé.");
}

// --- Achat réel : débite l'AP, incrémente le compteur, refuse si insuffisant ou au plafond ---
function freshState(ap) {
  const snap = idleNguSnapshot(
    { version: IDLE_NGU_META_VERSION, saveSchema: IDLE_NGU_SAVE_SCHEMA },
    { adventurePower: 100, adventureToughness: 100, bosses: 0 }
  );
  // idleNguSnapshot ne renvoie pas l'état mutable directement ; on reconstruit
  // un état minimal compatible avec idleSelloutShopBuyV1 (mêmes champs lus/écrits).
  return { currencies: { ap, experience: 0, pp: 0 }, selloutShop: { purchases: {} } };
}

{
  const s = freshState(20000);
  const r = idleSelloutShopBuyV1(s, "energyPotionAlpha");
  assert.equal(r.cost, 5000);
  assert.equal(s.currencies.ap, 15000, "L'AP doit être débitée exactement du coût réel.");
  assert.equal(s.selloutShop.purchases.energyPotionAlpha, 1);

  idleSelloutShopBuyV1(s, "energyPotionAlpha");
  assert.equal(s.selloutShop.purchases.energyPotionAlpha, 2, "Un objet à achats illimités doit pouvoir être racheté.");
}

{
  const s = freshState(100);
  assert.throws(
    () => idleSelloutShopBuyV1(s, "energyPotionAlpha"),
    /AP_INSUFFISANT/,
    "Un achat sans assez d'AP doit être refusé, jamais un découvert silencieux."
  );
  assert.equal(s.currencies.ap, 100, "L'AP ne doit jamais être débitée si l'achat échoue.");
}

{
  const s = freshState(10000000);
  s.selloutShop.purchases.improvedLootFilter = 1;
  assert.throws(
    () => idleSelloutShopBuyV1(s, "improvedLootFilter"),
    /OBJET_AU_MAXIMUM/,
    "Un objet à achat unique (max:1) déjà acheté doit refuser un second achat."
  );
}

// --- EXP/PP : seul effet de jeu câblé immédiatement dans ce lot ---
{
  const s = freshState(1000000);
  idleSelloutShopBuyV1(s, "exp500");
  assert.equal(s.currencies.experience, 500, "Acheter '500 EXP!' doit réellement créditer 500 EXP, pas seulement enregistrer l'achat.");
  idleSelloutShopBuyV1(s, "pp100");
  assert.equal(s.currencies.pp, 100, "Acheter '100 PP!' doit réellement créditer 100 PP.");
}

// --- Snapshot : chaque entrée expose déjà son prochain coût, le client ne doit jamais le recalculer ---
{
  const snap = idleNguSnapshot(
    { version: IDLE_NGU_META_VERSION, saveSchema: IDLE_NGU_SAVE_SCHEMA },
    { adventurePower: 100, adventureToughness: 100, bosses: 0 }
  );
  assert.ok(Array.isArray(snap.selloutShop.catalog) && snap.selloutShop.catalog.length >= 70);
  const entry = snap.selloutShop.catalog.find((x) => x.id === "energyPotionAlpha");
  assert.equal(entry.nextCost, 5000);
  assert.equal(entry.purchased, 0);
}

// --- unlockedEver : n'apparaît qu'après avoir récolté du premier AP, jamais réévalué à la baisse ---
{
  const snapAvant = idleNguSnapshot(
    { version: IDLE_NGU_META_VERSION, saveSchema: IDLE_NGU_SAVE_SCHEMA },
    { adventurePower: 100, adventureToughness: 100, bosses: 0 }
  );
  assert.equal(snapAvant.selloutShop.unlockedEver, false, "Une toute nouvelle partie (0 AP) ne doit pas encore débloquer le Sellout Shop.");

  const snapApres = idleNguSnapshot(
    { version: IDLE_NGU_META_VERSION, saveSchema: IDLE_NGU_SAVE_SCHEMA, currencies: { ap: 1 } },
    { adventurePower: 100, adventureToughness: 100, bosses: 0 }
  );
  assert.equal(snapApres.selloutShop.unlockedEver, true, "Dès le premier AP récolté, le Sellout Shop doit apparaître.");

  // Dépenser tout son AP (retomber à 0) ne doit jamais faire disparaître le menu déjà débloqué.
  const snapApresDepense = idleNguSnapshot(
    { version: IDLE_NGU_META_VERSION, saveSchema: IDLE_NGU_SAVE_SCHEMA, currencies: { ap: 0 }, selloutShop: { purchases: {}, unlockedEver: true } },
    { adventurePower: 100, adventureToughness: 100, bosses: 0 }
  );
  assert.equal(snapApresDepense.selloutShop.unlockedEver, true, "Une fois débloqué, dépenser tout son AP ne doit jamais re-verrouiller le menu.");
}

console.log("idle-sellout-shop: OK");
