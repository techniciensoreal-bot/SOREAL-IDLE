import assert from "node:assert/strict";
import { normalizeIdleNguState, idleNguEffectiveResourceStat } from "../src/idle-ngu-progression.js";

/*
 * 2026-09-24 -- audit de composition, pages Energy / Magic / Resource 3 / Experience :
 * « Energy Power is limited to a maximum of 1E18 (4.84E18 when using potions) »,
 * « Capped at 1 Qi (1E18) before potion effects », « Energy Bars ... 1E18 (2.2E18
 * when using an Energy Bar Bar) », cap 9E18. Le plafond vaut pour le TOTAL avant
 * potions ; les potions le multiplient ensuite. Avant : seuls les achats bruts
 * etaient plafonnes, les bonus de perks/quirks/souhaits depassaient sans limite.
 */
const ctx = { bosses: 100 };
function etat(mutate) {
  const s = normalizeIdleNguState({}, ctx, 0);
  s.systems.bloodMagic.unlocked = true;
  mutate?.(s);
  return normalizeIdleNguState(s, ctx, 0);
}

/* Power : 1e18 achetes + 50 niveaux de « Generic Energy Power Perk I » (+50 %) -> plafonne a 1e18. */
{
  const s = etat((x) => { x.resources.energy.power = 1e18; x.systems.perks.data.levels[6] = 50; });
  assert.equal(idleNguEffectiveResourceStat(s, "energy", "power"), 1e18);
}
/* Sous le plafond : inchange (achat + bonus plat, x multiplicateur). */
{
  const s = etat((x) => { x.resources.energy.power = 1e6; x.systems.perks.data.levels[6] = 50; });
  const v = idleNguEffectiveResourceStat(s, "energy", "power");
  assert.ok(v > 1e6 * 1.4 && v < 1e6 * 1.6, `mesure ${v}`);
}
/* Potion beta (x2) : multiplie APRES le plafond -> 2e18 (2 x 1,1 avec un Coeur : 2,2e18). */
{
  const s = etat((x) => {
    x.resources.energy.power = 1e18; x.systems.perks.data.levels[6] = 50;
    x.selloutEffects.beta = { energyPower: true };
  });
  assert.equal(idleNguEffectiveResourceStat(s, "energy", "power"), 2e18);
}
/* Bars : 1e18 ; Bar Bar (x2) apres le plafond. Cap : 9e18. */
{
  const s = etat((x) => { x.resources.energy.bars = 1e18; x.systems.perks.data.levels[7] = 50; });
  assert.equal(idleNguEffectiveResourceStat(s, "energy", "bars"), 1e18);
  const c = etat((x) => { x.resources.energy.cap = 9e18; x.systems.perks.data.levels[8] = 50; });
  assert.equal(idleNguEffectiveResourceStat(c, "energy", "cap"), 9e18);
}
/* Magic et Resource 3 : memes plafonds. */
{
  const s = etat((x) => { x.resources.magic.power = 1e18; x.systems.perks.data.levels[9] = 50; });
  assert.ok(idleNguEffectiveResourceStat(s, "magic", "power") <= 1e18);
}
console.log("idle-resource-stat-hard-caps: OK");
