import assert from "node:assert/strict";
import {
  IDLE_DAYCARE_BASE_HOURS_BY_WIKI_ID_V1,
  IDLE_DAYCARE_MAX_SLOTS_V1,
  idleDaycareBaseHoursV1,
  idleDaycareFactorsV1,
  normalizeIdleDaycareDataV1,
  advanceIdleDaycareV1
} from "../src/idle-daycare-v1.js";
import { IDLE_ADVENTURE_WIKI_ITEM_IDS_V1 } from "../src/idle-adventure-v47.js";
import { perkBonusesV1, idlePerkByIdV1 } from "../src/idle-perks-v1.js";

/*
 * Item Daycare -- valeurs verrouillées sur le miroir local du wiki NGU
 * (pages « Item Daycare », « Challenges », « Perk Points », « Experience »,
 * et la ligne « Daycare: » de chaque page objet).
 */
const near = (a, b, msg, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${msg} (obtenu ${a}, attendu ${b})`);

// --- Table des heures de base (pages objets) ---
{
  const t = IDLE_DAYCARE_BASE_HOURS_BY_WIKI_ID_V1;
  assert.equal(Object.keys(t).length, 321, "321 pages objets publient un taux de garderie.");
  assert.equal(t[248], 48, "A Bag of Trash : un niveau toutes les 48 h.");
  assert.equal(t[77], 1, "Tutorial Cube : 1 h.");
  assert.equal(t[53], 1, "Forest Pendant : 1 h.");
  assert.equal(t[76], 24, "Ascended Forest Pendant : 24 h.");
  assert.equal(t[94], 36, "Ascended Ascended Forest Pendant : 36 h.");
  assert.equal(t[142], 48, "Ascended Ascended Ascended Pendant : 48 h.");
  assert.equal(t[118], 12, "Stapler : 12 h.");
  assert.equal(t[119], 8, "My Red Heart : 8 h.");
  assert.equal(t[446], undefined, "Creepy Doll : daycare = ? sur le wiki, aucun taux inventé.");
  assert.equal(idleDaycareBaseHoursV1({ wikiItemId: 446 }), null);
  const ids = Object.values(IDLE_ADVENTURE_WIKI_ITEM_IDS_V1);
  assert.equal(ids.filter((id) => t[id] != null).length, 301, "297 objets du dépôt ont un taux publié (les 86 autres : daycare = ?).");
}

// --- Slots (page Item Daycare : 6 au total) ---
{
  assert.equal(IDLE_DAYCARE_MAX_SLOTS_V1, 6);
  assert.equal(idleDaycareFactorsV1({}).slots, 0);
  assert.equal(idleDaycareFactorsV1({ expShopSlots: 3 }).slots, 3, "3 achats EXP.");
  assert.equal(idleDaycareFactorsV1({ blindNormal: 9 }).slots, 0, "Blind Normal : slot à la complétion finale seulement.");
  assert.equal(idleDaycareFactorsV1({ blindNormal: 10 }).slots, 1, "Blind Normal 10e complétion.");
  assert.equal(idleDaycareFactorsV1({ trollEvil: 2 }).slots, 0);
  assert.equal(idleDaycareFactorsV1({ trollEvil: 3 }).slots, 1, "Troll Evil 3e complétion.");
  assert.equal(idleDaycareFactorsV1({ expShopSlots: 3, blindNormal: 10, trollEvil: 7, perkSlots: 1 }).slots, 6);
  const p86 = idlePerkByIdV1(86);
  assert.ok(p86 && p86.cost === 50000 && p86.cap === 1, "Perk 86 « Daycare Slot! c: » : 50 000 PP, 1 niveau.");
  assert.equal(perkBonusesV1({ 86: 1 }).daycareSlotBonus, 1);
}

// --- Réductions de temps (rétroactives) ---
{
  near(idleDaycareFactorsV1({ blindNormal: 1 }).timeFactor, 0.94, "Blind Normal 1re complétion : -5 % -1 %");
  near(idleDaycareFactorsV1({ blindNormal: 10 }).timeFactor, 0.85, "Blind Normal x10 : x85 %");
  const bless = perkBonusesV1({ 27: 5, 28: 5 });
  near(bless.daycareTimeMultiplier, 0.95 * 0.95, "Blessing I et II : x95 % chacune");
  near(perkBonusesV1({ 27: 5 }).daycareTimeMultiplier, 0.95, "Blessing I seule");
  assert.equal(bless.daycareGrowthMultiplier, 1, "Les Blessings ne sont pas une hausse de vitesse.");
  near(idleDaycareFactorsV1({ selloutSpeedBoost: true }).timeFactor, 0.9, "Daycare Speed Boost : x90 %");
}

// --- Hausses de vitesse (non rétroactives) ---
{
  near(idleDaycareFactorsV1({ gearDaycareSpeedPct: 104 }).speedMultiplier, 2.04, "Équipement : +20 % x4 + 24 % = x204 %");
  near(idleDaycareFactorsV1({ perkSpeedMultiplier: perkBonusesV1({ 94: 55 }).daycareGrowthMultiplier }).speedMultiplier, 1.05, "Fibonacci 55 : x105 %");
  near(idleDaycareFactorsV1({ wishLevel: 10 }).speedMultiplier, 1.10, "Souhait 27 : x110 %");
  near(idleDaycareFactorsV1({ blindEvil: 10 }).speedMultiplier, 1.20, "Blind Evil : x120 %");
  near(idleDaycareFactorsV1({ blindSadistic: 10 }).speedMultiplier, 1.10, "Blind Sadistic : x110 %");
  // Page Item Daycare : « overall time per level can be reduced to ... = 22.20% » (sans diggers/hacks/cartes).
  const f = idleDaycareFactorsV1({
    blindNormal: 10, perkTimeMultiplier: 0.95 * 0.95, selloutSpeedBoost: true,
    gearDaycareSpeedPct: 104, perkSpeedMultiplier: 1.05, wishLevel: 10, blindEvil: 10, blindSadistic: 10
  });
  assert.equal((f.timeFactor / f.speedMultiplier * 100).toFixed(2), "22.20");
}

// --- Exemple du wiki : base 8 h, 15 jours -> 45 niveaux ; 50 avec le Daycare Speed Boost ---
{
  const run = (factors) => {
    const data = normalizeIdleDaycareDataV1({ slots: [{ item: { id: "x", definitionId: "redHeart", wikiItemId: 119, level: 0 }, levelAtEntry: 0, hours: 0 }] });
    advanceIdleDaycareV1(data, 15 * 24 * 3600, factors);
    return data.slots[0].item.level;
  };
  assert.equal(run(idleDaycareFactorsV1({})), 45);
  assert.equal(run(idleDaycareFactorsV1({ selloutSpeedBoost: true })), 50);
}

// --- Rétroactivité des réductions de temps, pas des hausses de vitesse ; plafond 100 ---
{
  const data = normalizeIdleDaycareDataV1({ slots: [{ item: { id: "x", definitionId: "redHeart", wikiItemId: 119, level: 0 }, levelAtEntry: 0, hours: 0 }] });
  advanceIdleDaycareV1(data, 36 * 3600, idleDaycareFactorsV1({}));
  assert.equal(data.slots[0].item.level, 4, "36 h / 8 h = 4 niveaux");
  advanceIdleDaycareV1(data, 0, idleDaycareFactorsV1({ selloutSpeedBoost: true }));
  assert.equal(data.slots[0].item.level, 5, "Réduction achetée après coup : 36 / 7,2 = 5 niveaux (rétroactif).");
  advanceIdleDaycareV1(data, 8 * 3600, idleDaycareFactorsV1({ wishLevel: 10 }));
  near(data.slots[0].hours, 36 + 8 * 1.1, "La vitesse ne s'applique qu'au temps écoulé pendant qu'elle est active.");
  advanceIdleDaycareV1(data, 10000 * 3600, idleDaycareFactorsV1({}));
  assert.equal(data.slots[0].item.level, 100, "Le niveau s'arrête à 100.");
  near(data.slots[0].hours, 800, "Le temps n'est plus compté au-delà du niveau 100.");
}

console.log("idle-daycare-v1 ok");
