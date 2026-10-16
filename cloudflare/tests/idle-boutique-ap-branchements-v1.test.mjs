import assert from "node:assert/strict";
import { lireSrc } from "./_src-sources.mjs";
import { lireUiComplet } from "./_ui-sources.mjs";
import { readFileSync } from "node:fs";
import { BASIC_TRAINING_V411, createBasicTrainingStateV411, applyBasicTrainingAllocationsV411 } from "../src/idle-basic-training.js";
import { idleSelloutShopEffectActiveV1 } from "../src/idle-sellout-shop-v1.js";

/*
 * Norman (2026-10-12) : « veille à brancher tout ce qui est dans les boutiques ». Boutique AP (4G's Sellout Shop, wiki NGU Idle) : branchés ce jour-là -- Lazy ITOPOD Floor Shifter, Adventure Advancer (20 s de run),
 * Adventure Light (lueur du bouton Aventure en Zone sûre), Insta Training Cap (1 d'énergie par entraînement au Rebirth). Ils sont donc ACHETABLES.
 */
for (const id of ["lazyItopodFloorShifter", "adventureAdvancer", "adventureLight", "instaTrainingCap"]) {
  assert.equal(idleSelloutShopEffectActiveV1(id), true, id + " : achetable");
}

// Insta Training Cap : 1 d'énergie par entraînement déjà ouvert, au Rebirth ; le reste de l'énergie reste libre.
{
  const etat = createBasicTrainingStateV411(1_000_000);
  const voulu = {};
  for (const def of BASIC_TRAINING_V411.skills) voulu[def.id] = 1;
  const r = applyBasicTrainingAllocationsV411(etat, voulu, 100, 100, {});
  assert.ok(r.allocated >= 1 && r.allocated <= 6, "au plus 6 d'énergie placée (" + r.allocated + ")");
  assert.equal(r.idleEnergy, 100 - r.allocated, "le reste reste libre");
  for (const def of BASIC_TRAINING_V411.skills) assert.ok(r.state.skills[def.id].allocation <= 1, "pas plus de 1 par compétence : " + def.id);
}
const rt = lireSrc("idle-sqlite-runtime.js");
assert.ok(rt.includes("stats.metaNgu.selloutShop.purchases.instaTrainingCap") && rt.includes("feuille.getRange(ligne,c.ENERGIE).setValue(energieLibreDepart);"), "le Rebirth place 1 d'énergie par entraînement avec l'achat");
const ui = lireUiComplet();
assert.ok(ui.includes("it.id==='adventureLight'&&idleNombre_(it.purchased)>0") && ui.includes("${classeLumiereAventure}"), "le bouton Aventure s'allume en Zone sûre avec l'achat");
console.log("idle-boutique-ap-branchements-v1: OK");
