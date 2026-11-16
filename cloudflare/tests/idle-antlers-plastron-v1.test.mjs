import assert from "node:assert/strict";
import { neuf, agir, possede, avecAleatoire } from "./_antlers-aide.mjs";
import { IDLE_ADVENTURE_WIKI_ITEM_IDS_V1, SPECIALS_EN_V1, SPECIALS } from "../src/idle-adventure-sets.js";
import { IDLE_ADVENTURE_COFFRE_TITAN_OBJETS_V1 } from "../src/idle-adventure-inventaire.js";
import { IDLE_SPECIAL_POINTS_EXP_V1 } from "../src/idle-adventure-special-points-v1.js";

/*
 * Blue Eyes Ultimate Chestplate (objet 342, build 1260) : curAttack 5 500 000, curDefense 160 000 000, specials 49 / 51 / 50 = 1,2e9 / 2,5e8 / 2e8 points.
 * Types lus dans Equipment::effectName et la table des types : 49 = Res3 Cap, 50 = Hack Speed, 51 = Wish Speed, 10 000 000 points pour 1 % -> 120 %, 25 %, 20 %.
 * Butin : LootDrop::zone30Drop : titan9SpecialReward, tirage min(1e-6 x facteur de loot, 0,25) a chaque victoire sur l'Exile, niveau 0.
 */
const d = SPECIALS_EN_V1.blueEyesChestplate;
assert.equal(IDLE_ADVENTURE_WIKI_ITEM_IDS_V1.blueEyesChestplate, 342);
assert.equal(d.name, "Blue Eyes Ultimate Chestplate");
assert.equal(d.slot, "chest");
assert.equal(d.p, 5500000);
assert.equal(d.t, 160000000);
assert.deepEqual([d.sType, d.sMax], ["r3CapPct", 120]);
assert.deepEqual(d.sExtra.map(e => [e.type, e.max0, e.max100]), [["wishSpeedPct", 25, 50], ["hackSpeedPct", 20, 40]]);
assert.ok(SPECIALS.blueEyesChestplate.name);
assert.ok(IDLE_ADVENTURE_COFFRE_TITAN_OBJETS_V1.t7.includes("blueEyesChestplate"));
assert.deepEqual(IDLE_SPECIAL_POINTS_EXP_V1.blueEyesChestplate, [7, 7, 7]);

const CTX = { bosses: 301, difficulty: "difficile", stats: { power: 1e30, toughness: 1e30 } };
const exileSansSac = () => {
  const s = neuf();
  s.unlockFlags.titan9Unlocked = true;
  return s;
};
const tuer = (s, alea) => avecAleatoire(alea, () => agir(s, { action: "titan", titan: "t7", difficulty: "easy" }, CTX));

/* Sans titan9SpecialReward (Sac jamais assemblé) : jamais, même avec un tirage de 0. */
assert.equal(possede(tuer(exileSansSac(), 0).state, "blueEyesChestplate"), 0);
/* Avec titan9SpecialReward : tirage 0 -> le plastron, au niveau 0 ; tirage 0,9 -> rien. */
{
  const s = exileSansSac();
  s.unlockFlags.titan9SpecialReward = true;
  const r = tuer(s, 0);
  assert.equal(possede(r.state, "blueEyesChestplate"), 1);
  assert.equal(r.state.itemList.blueEyesChestplate.seen, true);
  assert.equal(r.state.inventory.find(x => x.definitionId === "blueEyesChestplate").level, 0);
  const s2 = exileSansSac();
  s2.unlockFlags.titan9SpecialReward = true;
  assert.equal(possede(tuer(s2, 0.9).state, "blueEyesChestplate"), 0);
}
console.log("ok");
