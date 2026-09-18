import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  advanceIdleNguState,
  idleNguBonuses
} from "../src/idle-ngu-progression.js";

/*
 * Audit wiki NGU 2026-09-18, PISTE 6 : idleNguBonuses() (idle-ngu-
 * progression.js) calcule energyPowerFlat/energyBarsFlat/
 * energyCapMultiplier/magicPowerFlat/magicBarsFlat/magicCapFlat/
 * magicCapMultiplier -- alimentés par idle-perks-v1.js:94, perk id 1 "The
 * Newbie Magic Perk" : "Gain 1 Magic Power, 1 Magic Bar, and 10k Magic
 * Cap!" (bonus: { magicPowerFlat: 1, magicBarsFlat: 1, magicCapFlat:
 * 10000 }) -- mais avant ce correctif, AUCUNE fonction de génération de
 * ressource (resourceCapacityForCurrent/advanceGeneratedResources/
 * idleNguResourceGenerationPerSecond) ne relisait ces champs : acheter ce
 * Perk n'avait strictement aucun effet en jeu. Vérifie ici que le Magic
 * Cap effectif (utilisé pour remplir state.resources.magic.current) dépasse
 * bien le cap acheté brut une fois le Perk possédé.
 */

const context = { bosses: 200, bestGold: 1e6, adventurePower: 1e9 };

/*
 * normalizeResource() (idle-ngu-progression.js:1117) impose un plancher de
 * 100 pour Magic (`resource === "energy" ? 500 : 100`), pas 1 -- alors que
 * le commentaire de defaultResource() juste au-dessus (ligne ~603) cite une
 * capture d'écran Norman 2026-09-18 du vrai jeu ("Total Magic Cap: 1" sur
 * un personnage neuf). Incohérence interne repérée pendant cet audit mais
 * hors du périmètre ciblé de ce correctif (PISTE 6 = le branchement des
 * bonus, pas la valeur plancher elle-même) -- signalée telle quelle dans le
 * rapport final, non corrigée ici pour ne pas élargir le blast radius.
 * Ce test utilise donc le plancher réellement appliqué (100), pas 1.
 */
function stateWithNewbieMagicPerk(hasPerk) {
  let state = normalizeIdleNguState({}, context, 1_000_000);
  state.systems.bloodMagic.unlocked = true;
  state.resources.magic.cap = 100;
  state.resources.magic.speed = 50; // vitesse max pour remplir vite dans le test
  if (hasPerk) {
    state.systems.perks.data.levels = Object.assign({}, state.systems.perks.data.levels, { 1: 1 });
  }
  return state;
}

// --- Sanity : idleNguBonuses() doit bien exposer le Perk sous forme de bonus non nul une fois acheté ---
{
  const withPerk = idleNguBonuses(stateWithNewbieMagicPerk(true));
  const withoutPerk = idleNguBonuses(stateWithNewbieMagicPerk(false));
  assert.equal(withoutPerk.magicCapFlat, 0, "Sans le Perk, magicCapFlat doit rester à 0.");
  assert.equal(withPerk.magicCapFlat, 10000, "Wiki idle-perks-v1.js:94 (The Newbie Magic Perk) : +10k Magic Cap au niveau 1.");
  assert.equal(withPerk.magicPowerFlat, 1, "Wiki idle-perks-v1.js:94 : +1 Magic Power au niveau 1.");
  assert.equal(withPerk.magicBarsFlat, 1, "Wiki idle-perks-v1.js:94 : +1 Magic Bar au niveau 1.");
}

// --- Le bonus doit réellement influencer le jeu : le Magic généré doit pouvoir dépasser le cap acheté brut (100) une fois le Perk actif ---
{
  const withoutPerk = advanceIdleNguState(stateWithNewbieMagicPerk(false), 5, context, 1_005_000);
  assert.ok(
    withoutPerk.resources.magic.current <= 100 + 1e-9,
    "Sans le Perk, le Magic courant ne doit jamais dépasser le cap acheté brut (100) -- sinon le test lui-même serait mal calibré."
  );

  const withPerk = advanceIdleNguState(stateWithNewbieMagicPerk(true), 5, context, 1_005_000);
  assert.ok(
    withPerk.resources.magic.current > 100 + 1e-9,
    `Avec le Perk (magicCapFlat +10000), le Magic courant doit pouvoir dépasser le cap acheté brut de 100 -- ` +
    `mesuré : ${withPerk.resources.magic.current}. Avant ce correctif, resourceCapacityForCurrent ignorait ` +
    `magicCapFlat/magicCapMultiplier et ce test aurait échoué.`
  );
}

console.log("idle-ngu-resource-bonus-wiring: OK");
