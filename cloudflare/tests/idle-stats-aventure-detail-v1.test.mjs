import assert from "node:assert/strict";
import { idleAdventureCombatStatsV1 } from "../src/idle-ngu-bonus.js";

/*
 * Provenance des statistiques d'Aventure (Norman, 2026-11-11 : « un i sur lequel on peut cliquer et on voit le détail de la provenance de chaque bonus »).
 * Le détail envoyé à l'écran (detailV1) reprend EXACTEMENT les termes du calcul : (base + équipement + Cube + permanent + gains fixes) × multiplicateur. Il n'existe que si le serveur le demande (context.detailV1) : le combat ne paie rien.
 */
const gear = { power: 140, toughness: 90, hp: 420, regen: 2.5, cubePowerContribution: 40, cubeToughnessContribution: 15, permanent: { adventurePower: 6, adventureToughness: 4, adventureHp: 18, adventureRegen: .2 } };
const bonuses = {
  adventurePowerMultiplier: 1.5 * 1.2, adventureToughnessMultiplier: 1.5 * 1.1,
  adventureBaseFlat: { power: 100, toughness: 100, hp: 0, regen: 0 },
  adventureSources: [["perk", 1.5]], adventureSourcesPuissance: 1.2, adventureSourcesEndurance: 1.1,
  adventureFlatSources: { power: { fruit: 0, perk: 100, pilule: 0 }, toughness: { fruit: 0, perk: 100, pilule: 0 }, hp: {}, regen: {} }
};
const sans = idleAdventureCombatStatsV1(gear, {}, bonuses);
assert.equal(sans.detailV1, undefined, "sans demande, aucun détail (le calcul du combat ne change pas)");
const r = idleAdventureCombatStatsV1(gear, { detailV1: true }, bonuses);
for (const k of ["power", "toughness", "hp", "regen"]) {
  const d = r.detailV1[k];
  const somme = d.base + d.equipement + d.cube + d.permanent + d.plat;
  assert.ok(Math.abs(somme * d.multiplicateur - r[k]) < 1e-6, k + " : (parts) × multiplicateur = total exact");
}
const p = r.detailV1.power;
assert.equal(p.cube, 40, "le Cube est séparé de l'équipement");
assert.equal(p.equipement, 100, "l'équipement ne contient plus la part du Cube");
assert.deepEqual(p.sources.map((s) => s[0]), ["perk", "avance"], "les sources du multiplicateur, avec l'Entraînement avancé en dernier");
assert.equal(p.plats.perk, 100, "le gain fixe garde sa provenance");
console.log("idle-stats-aventure-detail-v1: OK");
