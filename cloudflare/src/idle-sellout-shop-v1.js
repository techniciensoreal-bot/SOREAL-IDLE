/*
 * 4G's Sellout Shop (Norman, 2026-09-13) : "je veux exactement le même
 * shop. Je ne veux juste pas les menus qui permettent de dépenser de
 * l'argent réel."
 *
 * Catalogue vérifié directement sur ngu-idle.fandom.com/wiki/4G's_Sellout_Shop
 * le 2026-09-13 — noms, effets et prix copiés tels quels. Exclus
 * délibérément : la section "Packs" (achats en Kreds/argent réel contre
 * de l'AP/objets) et "Buying AP" (achat direct d'AP contre argent réel,
 * page Arbitrary Points) — les deux seuls mécanismes d'argent réel du
 * jeu réel, explicitement interdits par Norman. Tout le reste est fidèle.
 *
 * Portée V212 : l'EXP/PP est le seul groupe dont l'effet est réellement
 * câblé dans le moteur aujourd'hui. Les autres objets restent visibles
 * pour documenter le catalogue NGU, mais ils sont NON ACHETABLES tant que
 * leur effet n'existe pas : aucun AP ne doit pouvoir être débité pour un
 * achat sans résultat. Le serveur réapplique cette garde, même si un client
 * ancien ou modifié tente d'envoyer directement sellShopBuy.
 */

const N = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const I = (v, d = 0) => Math.floor(N(v, d));

function flatCost(price) {
  return () => price;
}
function tieredCost(prices) {
  return (n) => (n < prices.length ? prices[n] : prices[prices.length - 1]);
}
function linearCappedCost(base, step, cap) {
  return (n) => Math.min(cap, base + step * n);
}

export const IDLE_SELLOUT_SHOP_CATALOG_V1 = Object.freeze([
  // --- Boosts 1 (consommables, prix fixe, achats illimités) ---
  { id: "energyPotionAlpha", category: "boosts1", name: "Energy Potion α", effect: "Doubles your Energy power for 60 minutes, even if you rebirth multiple times. Stacks with Energy Potion β.", cost: flatCost(5000), max: null },
  { id: "energyPotionBeta", category: "boosts1", name: "Energy Potion β", effect: "Doubles your Energy power forever, but is lost upon rebirth. Stacks with Energy Potion α.", cost: flatCost(10000), max: null },
  { id: "energyPotionDelta", category: "boosts1", name: "Energy Potion δ", effect: "Doubles your Energy power for 1 day, even if you rebirth multiple times. Adds to the Energy Potion α timer.", cost: flatCost(100000), max: null },
  { id: "magicPotionAlpha", category: "boosts1", name: "Magic Potion α", effect: "Doubles your Magic power for 60 minutes, even if you rebirth multiple times. Stacks with Magic Potion β.", cost: flatCost(5000), max: null },
  { id: "magicPotionBeta", category: "boosts1", name: "Magic Potion β", effect: "Doubles your Magic power forever, but is lost upon rebirth. Stacks with Magic Potion α.", cost: flatCost(10000), max: null },
  { id: "magicPotionDelta", category: "boosts1", name: "Magic Potion δ", effect: "Doubles your Magic power for 1 day, even if you rebirth multiple times. Adds to the Magic Potion α timer.", cost: flatCost(100000), max: null },
  { id: "resource3PotionAlpha", category: "boosts1", name: "Resource 3 Potion α", effect: "Triples your Resource 3 power for 60 minutes, even if you rebirth multiple times. Stacks with Resource 3 Potion β.", cost: flatCost(4000), max: null },
  { id: "resource3PotionBeta", category: "boosts1", name: "Resource 3 Potion β", effect: "Doubles your Resource 3 power forever, but is lost upon rebirth. Stacks with Resource 3 Potion α.", cost: flatCost(40000), max: null },
  { id: "resource3PotionDelta", category: "boosts1", name: "Resource 3 Potion δ", effect: "Triples your Resource 3 power for 1 day, even if you rebirth multiple times. Adds to the Resource Potion α timer.", cost: flatCost(40000), max: null },
  { id: "energyBarBar", category: "boosts1", name: "Energy Bar Bar", effect: "Doubles your Energy bars for 60 minutes, even if you rebirth multiple times.", cost: flatCost(10000), max: null },
  { id: "magicBarBar", category: "boosts1", name: "Magic Bar Bar", effect: "Doubles your Magic bars for 60 minutes, even if you rebirth multiple times.", cost: flatCost(10000), max: null },
  { id: "macguffinMuffin", category: "boosts1", name: "MacGuffin Muffin", effect: "Doubles the bonus you get from MacGuffins when you rebirth for 24 hours. Applies for at least one rebirth, even if it's past 24 hours.", cost: flatCost(50000), max: null },

  // --- Boosts 2 (consommables achetés en lot) ---
  { id: "icarusFertilizer1", category: "boosts2", name: "Icarus Proudbottom's Homemade Fertilizer (x1)", effect: "50% bonus when harvesting or eating a fruit from Yggdrasil. Each pile lasts for 1 fruit.", cost: flatCost(3000), max: null, qty: 1 },
  { id: "icarusFertilizer10", category: "boosts2", name: "Icarus Proudbottom's Homemade Fertilizer (x10)", effect: "Comme ci-dessus, par lot de 10.", cost: flatCost(25000), max: null, qty: 10 },
  { id: "icarusFertilizer100", category: "boosts2", name: "Icarus Proudbottom's Homemade Fertilizer (x100)", effect: "Comme ci-dessus, par lot de 100.", cost: flatCost(225000), max: null, qty: 100 },
  { id: "littleBluePill1000", category: "boosts2", name: "Little Blue Pill (x1 000)", effect: "Doubles your PP gain from ITOPOD. Each pill lasts for one kill.", cost: flatCost(2500), max: null, qty: 1000 },
  { id: "littleBluePill10000", category: "boosts2", name: "Little Blue Pill (x10 000)", effect: "Comme ci-dessus, par lot de 10 000.", cost: flatCost(20000), max: null, qty: 10000 },
  { id: "littleBluePill100000", category: "boosts2", name: "Little Blue Pill (x100 000)", effect: "Comme ci-dessus, par lot de 100 000.", cost: flatCost(175000), max: null, qty: 100000 },
  { id: "beastButter1", category: "boosts2", name: "Beast Butter (x1)", effect: "Doubles your QP reward on your next quest.", cost: flatCost(10000), max: null, qty: 1 },
  { id: "beastButter10", category: "boosts2", name: "Beast Butter (x10)", effect: "Comme ci-dessus, par lot de 10.", cost: flatCost(90000), max: null, qty: 10 },
  { id: "beastButter100", category: "boosts2", name: "Beast Butter (x100)", effect: "Comme ci-dessus, par lot de 100.", cost: flatCost(800000), max: null, qty: 100 },
  { id: "luckyCharm", category: "boosts2", name: "Lucky Charm", effect: "Doubles your Adventure Drop Chance for 30 minutes, even if you rebirth multiple times. Stacks with other Looting effects.", cost: flatCost(5000), max: null },
  { id: "superLuckyCharm", category: "boosts2", name: "Super Lucky Charm", effect: "Doubles your Adventure Drop Chance for 12 hours, even if you rebirth multiple times. Stacks with other Looting effects.", cost: flatCost(50000), max: null },
  { id: "mayoInfuser", category: "boosts2", name: "Mayo Infuser", effect: "Doubles Mayo generation speed for 24 hours. Affects Fruit reward.", cost: flatCost(40000), max: null },
  { id: "regularBlackPens", category: "boosts2", name: "Regular Black Pens (x25)", effect: "Adds 2 tiers to the next card spawned. Cannot be turned off.", cost: flatCost(40000), max: null, qty: 25 },

  // --- Special 1 (déblocages permanents) ---
  { id: "improvedLootFilter", category: "special1", name: "Improved Loot Filter", effect: "Buy this to use the Item List as a customized loot filter! You'll be able to click items in the list to filter them individually!", cost: flatCost(100000), max: 1 },
  { id: "extraInventorySpace", category: "special1", name: "Extra Inventory Space", effect: "Adds a new inventory slot. Can be purchased multiple times, for a maximum of 166 extra slots.", cost: linearCappedCost(3000, 100, 10000), max: 166 },
  { id: "autoMergeBoostTimers", category: "special1", name: "1/2 Auto Merge and Boost Timers!", effect: "Buy this for a 50% time reduction on Auto Boost and Auto Merge!", cost: flatCost(100000), max: 1 },
  { id: "instaTrainingCap", category: "special1", name: "Insta Training Cap", effect: "This upgrade will assign 6 energy, 1 for each training, almost immediately into each rebirth.", cost: flatCost(10000), max: 1 },
  { id: "customEnergyMagicButtons", category: "special1", name: "Custom Energy/Magic % Buttons", effect: "Unlocks one set of custom % buttons for Energy and Magic inputs! These work like the other custom buttons, but they output a % of your total cap.", cost: flatCost(25000), max: 1 },
  { id: "moreCustomEnergyMagicButtons", category: "special1", name: "More Custom Energy/Magic % Buttons", effect: "Unlocks another set of custom % buttons for Energy and Magic inputs! These work like the other custom buttons, but they output a % of your total cap.", cost: flatCost(80000), max: 1 },
  { id: "yggdrasilHarvestLight", category: "special1", name: "Yggdrasil Harvest Light", effect: "Buy this to have the Yggdrasil menu light up when fruit is fully grown and ready to be eaten of harvested.", cost: flatCost(50000), max: 1 },
  { id: "dailySpinTimeBank", category: "special1", name: "7-Day Time Bank for Daily Spin!", effect: "Buy this to extend the maximum time banked by the daily spin system from 36 hours to 7 days.", cost: flatCost(100000), max: 1 },
  { id: "loadoutSlot", category: "special1", name: "Loadout Slot!", effect: "Max Purchases: 7", cost: linearCappedCost(50000, 10000, Infinity), max: 7 },
  { id: "extraBeardSlot", category: "special1", name: "An Extra Beard Slot!", effect: "An extra beard for the Beards Of Power. Max Purchases: 4 - First slot is cheaper.", cost: tieredCost([110000, 225000, 225000, 225000]), max: 4 },
  { id: "filterBoostsIntoCube", category: "special1", name: "Filter Boosts into Infinity Cube!", effect: "Buy this to have filtered boosts get merged into your Infinity Cube! However boosts applied this way will not be recycled.", cost: flatCost(15000), max: 1 },
  { id: "lazyItopodFloorShifter", category: "special1", name: "Lazy ITOPOD Floor Shifter", effect: "This will check your optimal floor in the I.T.O.P.O.D after each kill, and adjust the floor you're on automatically.", cost: flatCost(225000), max: 1 },

  // --- Special 2 ---
  { id: "extraAccessorySlot1", category: "special2", name: "Extra Accessory Slot!", effect: "Adds 1 accessory slot.", cost: flatCost(225000), max: 1 },
  { id: "daycareSpeedBoost", category: "special2", name: "Daycare Speed Boost!", effect: "Items in the Daycare will gain levels 10% faster.", cost: flatCost(125000), max: 1 },
  { id: "extraAccessorySlot2", category: "special2", name: "Another Extra Accessory Slot!", effect: "Adds 1 accessory slot (again) (again?)", cost: flatCost(225000), max: 1 },
  { id: "diggerSlots", category: "special2", name: "Digger Slots!", effect: "Adds 1 digger slot. Max Purchases: 6 - First slot is cheaper.", cost: tieredCost([110000, 225000, 225000, 225000, 225000, 225000]), max: 6 },
  { id: "macguffinSlot", category: "special2", name: "A MacGuffin Slot!", effect: "Adds 1 MacGuffin slot. Max Purchases: 11 - First 2 slots are cheaper.", cost: tieredCost([100000, 100000, 225000, 225000, 225000, 225000, 225000, 225000, 225000, 225000, 225000]), max: 11 },
  { id: "questReminder", category: "special2", name: "Quest Reminder!", effect: "This will make the Questing Menu button light up when you have a Quest ready to hand in.", cost: flatCost(50000), max: 1 },
  { id: "fasterQuesting", category: "special2", name: "Faster Questing!", effect: "Gain Major Quests 20% faster.", cost: flatCost(250000), max: 1 },
  { id: "extendedQuestBank", category: "special2", name: "Extended Quest Bank", effect: "Increase your Major Quests cap from 10 to 50.", cost: flatCost(125000), max: 1 },
  { id: "extraAccessorySlot3", category: "special2", name: "Another Extra Accessory Slot! (bis)", effect: "Adds another 1 accessory slot (again).", cost: flatCost(500000), max: 1 },
  { id: "customIdleEnergyMagicButtons", category: "special2", name: "Custom Idle Energy/Magic % Buttons!", effect: "Unlocks a set of custom % buttons for idle Energy and Magic inputs! These work like the other custom buttons, but they output a % of your total idle Energy or Magic.", cost: flatCost(125000), max: 1 },
  { id: "autoNuker", category: "special2", name: "Auto Nuker", effect: "This will automatically nuke bosses 10 seconds into each rebirth, and then every minute afterwards.", cost: flatCost(65000), max: 1 },
  { id: "extraAccessorySlot4", category: "special2", name: "Yet Another Extra Accessory Slot!", effect: "Adds 1 accessory slot (trust me, you need them all).", cost: flatCost(500000), max: 1 },

  // --- Special 3 ---
  { id: "nguCapModifier", category: "special3", name: "NGU Cap Modifier", effect: "Unlocks a setting to modify the % of cap gets input when you click the NGU cap button.", cost: flatCost(100000), max: 1 },
  { id: "daycareKittyArt", category: "special3", name: "Daycare Kitty Art!", effect: "Unlocks several new designs of the Daycare Kitty! You can click the Kitty to cycle through all of your unlocked Art.", cost: flatCost(250000), max: 1 },
  { id: "customResource3Button", category: "special3", name: "Custom Resource 3 % Button!", effect: "Unlock a custom Cap % button for Resource 3!", cost: flatCost(50000), max: 1 },
  { id: "anotherCustomResource3Button", category: "special3", name: "Another Custom Resource 3 % Button!", effect: "Unlock another custom Cap % button for Resource 3!", cost: flatCost(150000), max: 1 },
  { id: "customIdleResource3Button", category: "special3", name: "Custom Idle Resource 3 % Button!", effect: "Unlock a custom Idle % button for Resource 3!", cost: flatCost(150000), max: 1 },
  { id: "resource3NameRandomizer", category: "special3", name: "Resource 3 Name Randomizer", effect: "Unlocks a setting which will randomize the name of your Resource 3 every time you rebirth. It'll pick from a pool of over 200 names!", cost: flatCost(100000), max: 1 },
  { id: "fasterWishes", category: "special3", name: "Faster Wishes", effect: "Gain 25% faster Wishes!", cost: flatCost(250000), max: 1 },
  { id: "inventoryMergeSlots", category: "special3", name: "Inventory Merge Slots", effect: "Unlocks an extra inventory merge slot! Max purchases: 4.", cost: tieredCost([50000, 150000, 250000, 500000]), max: 4 },
  { id: "adventureLight", category: "special3", name: "Adventure Light", effect: "The Adventure button will light up when in a safe zone.", cost: flatCost(75000), max: 1 },
  { id: "adventureAdvancer", category: "special3", name: "Adventure Advancer", effect: "Advances you to the furthest normal zone you can reach at the 20s mark of a rebirth.", cost: flatCost(65000), max: 1 },
  { id: "goToQuestZoneButton", category: "special3", name: "'Go To Quest Zone' Button", effect: "Unlocks a 'Go To Quest Zone' button which will send you to whatever Adventure Zone your Quest is on.", cost: flatCost(100000), max: 1 },
  /*
   * "An Evil Accessory Slot" (500,000 AP, réservé à la difficulté Evil)
   * délibérément omis : SOREAL IDLE n'a pas encore de difficulté
   * Evil/Sadistic (scope "EARLY" déjà documenté, idle-adventure-v47.js).
   * À réintégrer le jour où cette difficulté existe, pas avant.
   */

  // --- Special 4 ---
  { id: "extraDeckSize", category: "special4", name: "Extra Deck Size!", effect: "Unlock extra Deck size with this, to hold more lovely Cards! Max purchases: 50.", cost: flatCost(25000), max: 50 },
  { id: "mayoGenerator", category: "special4", name: "Mayo Generator", effect: "Allows you to run another Mayo generator simultaneously! Also buffs your Mayo Generation speed by 2% per slot. Max purchases: 2.", cost: flatCost(250000), max: 2 },
  { id: "extraTagSlot", category: "special4", name: "Extra Tag Slot!", effect: "Unlock an extra tag Slot for Cards - ensuring you get more of the Cards that you like!", cost: flatCost(250000), max: 1 },
  { id: "extraAccessorySlot5", category: "special4", name: "Extra Accessory Slot (dernier)", effect: "This is it - the last and most sellout-y Accessory slot. There's no more for AP after this.", cost: flatCost(750000), max: 1 },

  // --- Items (Coeurs) ---
  { id: "heartRed", category: "items", name: "My Red Heart <3", effect: "When this heart reaches 100, you will gain the full EXP bonus (10%) this heart provides without needing it equipped.", cost: flatCost(225000), max: 1 },
  { id: "heartYellow", category: "items", name: "My Yellow Heart <3", effect: "When this heart reaches 100, you will gain the full AP bonus (20%) this heart provides without needing it equipped.", cost: flatCost(150000), max: 1 },
  { id: "heartBrown", category: "items", name: "My Brown Heart <3", effect: "When this heart reaches 100, every 10th poop applied to a fruit doesn't consume poop!", cost: flatCost(225000), max: 1 },
  { id: "heartGreen", category: "items", name: "My Green Heart <3", effect: "When this heart reaches 100, you will earn Perk Points 20% faster in the ITOPOD.", cost: flatCost(225000), max: 1 },
  { id: "heartBlue", category: "items", name: "My Blue Heart <3", effect: "When this heart reaches 100, all consumables will have their effects improved by 10%.", cost: flatCost(225000), max: 1 },
  { id: "heartPurple", category: "items", name: "My Purple Heart <3", effect: "When this heart reaches 100, MacGuffins will drop 20% more often.", cost: flatCost(225000), max: 1 },
  { id: "heartOrange", category: "items", name: "My Orange Heart <3", effect: "When this heart reaches 100, Quests will earn 20% more QP.", cost: flatCost(225000), max: 1 },
  { id: "heartGrey", category: "items", name: "My Grey Heart <3", effect: "When this heart reaches 100, Hacks will be 25% faster.", cost: flatCost(225000), max: 1 },
  { id: "heartPink", category: "items", name: "My Pink Heart <3", effect: "When this heart reaches 100, you will gain a Wish Slot.", cost: flatCost(225000), max: 1 },
  { id: "heartRainbow", category: "items", name: "My Rainbow Heart", effect: "When this heart reaches 100, you will gain +10% Card and Mayo generation speed.", cost: flatCost(500000), max: 1 },

  // --- EXP / PP (câblés immédiatement : ajout direct à state.currencies) ---
  { id: "exp200", category: "expPp", name: "200 EXP!", effect: "Gives you 200 EXP to use in the EXP menu.", cost: flatCost(40000), max: null, grant: { currency: "experience", amount: 200 } },
  { id: "exp500", category: "expPp", name: "500 EXP!", effect: "Gives you 500 EXP to use in the EXP menu.", cost: flatCost(100000), max: null, grant: { currency: "experience", amount: 500 } },
  { id: "exp2000", category: "expPp", name: "2000 EXP!", effect: "Gives you 2000 EXP to use in the EXP menu.", cost: flatCost(400000), max: null, grant: { currency: "experience", amount: 2000 } },
  { id: "pp25", category: "expPp", name: "25 PP!", effect: "Gives you 25 PP to use in the I.T.O.P.O.D Perks menu.", cost: flatCost(100000), max: null, grant: { currency: "pp", amount: 25 } },
  { id: "pp100", category: "expPp", name: "100 PP!", effect: "Gives you 100 PP to use in the I.T.O.P.O.D Perks menu.", cost: flatCost(400000), max: null, grant: { currency: "pp", amount: 100 } },
  { id: "pp500", category: "expPp", name: "500 PP!", effect: "Gives you 500 PP to use in the I.T.O.P.O.D Perks menu.", cost: flatCost(2000000), max: null, grant: { currency: "pp", amount: 500 } }
]);

export function idleSelloutShopItemV1(id) {
  return IDLE_SELLOUT_SHOP_CATALOG_V1.find((x) => x.id === id) || null;
}

export function idleSelloutShopNextCostV1(item, purchased) {
  const n = Math.max(0, I(purchased, 0));
  if (item.max != null && n >= item.max) return null;
  return Math.max(0, Math.round(item.cost(n)));
}

export function idleSelloutShopEffectActiveV1(itemOrId) {
  const item =
    typeof itemOrId === "string"
      ? idleSelloutShopItemV1(itemOrId)
      : itemOrId;
  return Boolean(
    item &&
    item.grant &&
    item.grant.currency &&
    N(item.grant.amount, 0) > 0
  );
}

/*
 * Achat générique — un seul point d'entrée pour les ~75 objets, jamais
 * une fonction différente par objet. Ne fait QUE : vérifier le plafond,
 * calculer le coût réel (formule propre à l'objet), débiter l'AP,
 * incrémenter le compteur d'achats, et appliquer le seul type d'effet
 * déjà câblé (grant de monnaie EXP/PP). Les autres effets restent
 * fidèlement enregistrés (voir en-tête de fichier) sans être bâclés.
 */
export function idleSelloutShopBuyV1(state, itemId) {
  const item = idleSelloutShopItemV1(String(itemId || ""));
  if (!item) throw new Error("OBJET_BOUTIQUE_INTROUVABLE");
  if (!idleSelloutShopEffectActiveV1(item)) {
    throw new Error("EFFET_BOUTIQUE_AP_INACTIF");
  }
  const shop = state.selloutShop && typeof state.selloutShop === "object" ? state.selloutShop : { purchases: {} };
  const purchases = shop.purchases && typeof shop.purchases === "object" ? shop.purchases : {};
  const already = Math.max(0, I(purchases[item.id], 0));
  const cost = idleSelloutShopNextCostV1(item, already);
  if (cost == null) throw new Error("OBJET_AU_MAXIMUM");
  if (N(state.currencies.ap, 0) < cost) throw new Error("AP_INSUFFISANT");

  state.currencies.ap -= cost;
  purchases[item.id] = already + 1;
  shop.purchases = purchases;
  state.selloutShop = shop;

  if (item.grant) {
    state.currencies[item.grant.currency] = N(state.currencies[item.grant.currency], 0) + item.grant.amount;
  }

  return { itemId: item.id, cost, purchased: already + 1, max: item.max };
}
