import assert from "node:assert/strict";
import { normalizeIdleNguState } from "../src/idle-ngu-progression.js";
import { castBloodSpellPartielV1 } from "../src/idle-ngu-systemes.js";

/*
 * Lu dans le jeu (build 1260, 2026-11-16, RebirthPowerSpell::castRebirthSpell(montant), castLootSpell(montant), castGoldSpell(montant)) :
 *  - un montant au-dessus du sang disponible ne fait rien ;
 *  - Loot (10 000) et Gold (1e6) ignorent un montant sous leur minimum, le Nombre n'a aucun minimum ;
 *  - le montant s'ajoute au cumul du sort, il est retiré du sang, le reste est conservé.
 */
const ctx = {};
function neuf(sang) {
  const s = normalizeIdleNguState({}, ctx, 1_000_000);
  s.systems.bloodMagic.unlocked = true;
  s.currencies.blood = sang;
  return s;
}

{
  const s = neuf(10);
  assert.equal(castBloodSpellPartielV1(s, "numberBoost", 11), null, "plus que le sang : rien");
  assert.equal(s.currencies.blood, 10);
  assert.ok(castBloodSpellPartielV1(s, "numberBoost", 0.5), "aucun minimum pour le Nombre");
  assert.equal(s.systems.bloodMagic.data.spells.numberBoost, 1.5);
  assert.equal(s.currencies.blood, 9.5, "le reste du sang est conservé");
}
{
  const s = neuf(30_000);
  assert.equal(castBloodSpellPartielV1(s, "bloodSpaghetti", 9_999), null, "sous le minimum de 10 000");
  assert.equal(s.currencies.blood, 30_000);
  castBloodSpellPartielV1(s, "bloodSpaghetti", 10_000);
  const sp = s.systems.bloodMagic.data.spells;
  assert.equal(sp.bloodSpaghettiBloodSpent, 10_000);
  assert.equal(sp.bloodSpaghetti, 1 + 1 * 0.01, "log2(1)+1 = 1");
  assert.equal(s.currencies.blood, 20_000);
  castBloodSpellPartielV1(s, "bloodSpaghetti", 20_000);
  assert.equal(sp.bloodSpaghetti, 1 + 2 * 0.01, "log2(3)+1 = 2,58 : arrondi à 2");
  assert.equal(s.currencies.blood, 0);
}
{
  const s = neuf(5_000_000);
  assert.equal(castBloodSpellPartielV1(s, "counterfeitGold", 999_999), null, "sous le minimum de 1e6");
  castBloodSpellPartielV1(s, "counterfeitGold", 2_000_000);
  assert.equal(s.systems.bloodMagic.data.spells.counterfeitGold, 1 + 4 * 0.01, "(log2(2)+1)^2 = 4");
  assert.equal(s.currencies.blood, 3_000_000);
}
assert.throws(() => castBloodSpellPartielV1(neuf(10), "ironPill", 5), /SORT_SANG_INVALIDE/, "la Pilule de fer n'a pas de lancer partiel");

console.log("idle-blood-lancers-partiels-v1: OK");
