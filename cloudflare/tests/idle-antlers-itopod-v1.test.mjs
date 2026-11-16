import assert from "node:assert/strict";
import { neuf, possede } from "./_antlers-aide.mjs";
import { normalizeIdleNguState, advanceIdleNguState } from "../src/idle-ngu-progression.js";
import { exileItopodV1, idleExileItopodChanceV1 } from "../src/idle-antlers-v1.js";
import { exileDonnerV1 } from "../src/idle-antlers-v1.js";

/*
 * Tentacule de l'Exilé (337) : LootDrop::checkExileDrop (méthode 547, build 1260), appelée à chaque kill ITOPOD : exige le Visage (336) déjà vu,
 * étage 950 à 999 inclus, réussite si tirage <= (étage - 949) x 0,0001, sans facteur de loot.
 */
assert.equal(idleExileItopodChanceV1(949), 0);
assert.ok(Math.abs(idleExileItopodChanceV1(950) - 0.0001) < 1e-12);
assert.ok(Math.abs(idleExileItopodChanceV1(999) - 0.005) < 1e-12);
assert.equal(idleExileItopodChanceV1(1000), 0);
assert.equal(idleExileItopodChanceV1(0), 0);

/* Sans le Visage vu : jamais. Avec : un tirage qui réussit donne un Tentacule (même rng à 0,5 : saut géométrique de 138 kills à l'étage 999). */
{
  const s = neuf();
  assert.deepEqual(exileItopodV1(s, 999, 10000, () => 0.0000001), [], "336 jamais vu : rien");
  exileDonnerV1(s, "faceExile");
  s.inventory = s.inventory.filter(x => x.definitionId !== "faceExile");
  assert.equal(s.itemList.faceExile.seen, true, "« vu » reste vrai après la suppression de l'objet");
  assert.deepEqual(exileItopodV1(s, 949, 10000, () => 0.0000001), [], "étage 949 : probabilité 0");
  assert.deepEqual(exileItopodV1(s, 1000, 10000, () => 0.0000001), [], "étage 1000 : hors plage");
  const out = exileItopodV1(s, 999, 1000, () => 0.5);
  assert.equal(out.length, 7, "p = 0,5 % : un Tentacule tous les 139 kills (1000 kills : 7)");
  assert.ok(out.every(o => o.definitionId === "exileClueTentacle"));
  assert.equal(s.itemList.exileClueTentacle.seen, true);
  assert.deepEqual(exileItopodV1(s, 999, 0, () => 0.0000001), []);
  /* Aucun dédoublonnage : plusieurs 337 dans le sac. */
  assert.equal(possede(s, "exileClueTentacle"), 7);
}
/* Un tirage très bas réussit dès le premier kill ; un tirage proche de 1 : jamais. */
{
  const s = neuf();
  exileDonnerV1(s, "faceExile");
  assert.equal(exileItopodV1(s, 950, 1, () => 0.9999).length, 0);
  const p = idleExileItopodChanceV1(950);
  /* écart nul quand ln(u)/ln(1-p) < 1, c.-à-d. u > 1 - p : le premier kill réussit */
  assert.equal(exileItopodV1(s, 950, 1, () => 1 - p / 2).length, 1);
}
/* Sac plein : « vu » est posé quand même (markItemAsDropped avant l'ajout), l'objet est perdu. */
{
  const s = neuf();
  exileDonnerV1(s, "faceExile");
  s.bonusSlots = { inventory: 0 };
  for (let i = 0; i < 500 && s.inventory.length < 5000; i++) {
    const o = exileDonnerV1(s, "exileClueAntennae");
    if (!o) break;
  }
  const avant = possede(s, "exileClueTentacle");
  const out = exileItopodV1(s, 999, 1000, () => 0.5);
  assert.equal(out.length, 0, "sac plein : rien n'est ajouté");
  assert.equal(possede(s, "exileClueTentacle"), avant);
  assert.equal(s.itemList.exileClueTentacle.seen, true, "mais l'objet est marqué vu");
}
/* Intégration : le moteur de l'ITOPOD appelle bien la règle (étage 999, Visage vu -> Tentacules ; sans Visage -> aucun). */
{
  const ctx = { adventurePower: 1e30, adventureToughness: 1e30, bosses: 301 };
  const monter = vu => {
    let s = normalizeIdleNguState({}, ctx, 1_000_000);
    s.systems.tower.unlocked = true;
    s.systems.tower.active = true;
    Object.assign(s.systems.tower.data, { floor: 999, killsOnFloor: 0, highestFloor: 999, startFloor: 999, endFloor: 999, kills: 0 });
    if (vu) s.adventure.itemList.faceExile = { maxLevel: 0, seen: true };
    const orig = Math.random;
    Math.random = () => 0.5;
    try { s = advanceIdleNguState(s, 1000, ctx, 2_000_000); } finally { Math.random = orig; }
    return s;
  };
  assert.equal(possede(monter(false).adventure, "exileClueTentacle"), 0);
  const avec = monter(true);
  assert.ok(avec.systems.tower.data.kills > 100, "l'ITOPOD a bien tué des ennemis");
  assert.ok(possede(avec.adventure, "exileClueTentacle") >= 1, "au moins un Tentacule à l'étage 999");
}
console.log("ok");
