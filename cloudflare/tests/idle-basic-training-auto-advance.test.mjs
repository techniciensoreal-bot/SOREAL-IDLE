import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createBasicTrainingStateV411,
  advanceBasicTrainingStateV411,
  totalBasicTrainingAllocationV411
} from "../src/idle-basic-training.js";
import { normalizeIdleNguState, applyIdleNguAction, idleNguBonuses, idleNguSnapshot, IDLE_NGU_EXP_SHOP_V1 } from "../src/idle-ngu-progression.js";

/*
 * Wiki « Experience » > Misc et « Basic Training » > Related Purchases :
 * « Training Auto Advance » 300 EXP, achat unique, « Automatically allocates
 * energy each time a skill is unlocked while leaving the necessary cap for
 * each skill ». Lecture retenue : au déblocage, le surplus au-delà du cap de
 * la prérequise passe à la compétence débloquée.
 */

// --- boutique EXP ---
{
  const def = IDLE_NGU_EXP_SHOP_V1.trainingAutoAdvance;
  assert.equal(def.name, "Training Auto Advance");
  assert.equal(def.cost(0), 300);
  assert.equal(def.max, 1);
  const ctx = { bosses: 10 };
  const s = normalizeIdleNguState({}, ctx, 1_000);
  s.currencies.experience = 299;
  assert.throws(() => applyIdleNguAction(s, { action: "buyExpShop", item: "trainingAutoAdvance" }, ctx, 2_000), /EXP_INSUFFISANT/);
  s.currencies.experience = 700;
  assert.equal(idleNguBonuses(s).basicTrainingAutoAdvance, false);
  const r = applyIdleNguAction(s, { action: "buyExpShop", item: "trainingAutoAdvance", quantity: 2 }, ctx, 2_000);
  assert.equal(r.state.currencies.experience, 400, "achat unique : 300 EXP une seule fois");
  assert.equal(idleNguBonuses(r.state).basicTrainingAutoAdvance, true);
  assert.throws(() => applyIdleNguAction(r.state, { action: "buyExpShop", item: "trainingAutoAdvance" }, ctx, 3_000), /ACHAT_AU_MAXIMUM/);
  const entry = idleNguSnapshot(r.state, ctx, 3_000).expShop.find((x) => x.id === "trainingAutoAdvance");
  assert.equal(entry.purchased, 1);
  assert.equal(entry.nextCost, null);
}

// --- mécanique ---
// Attaque passive : cap 2 500, déblocage de la suivante à 5 000 niveaux. À 50 niv/s, 100 s.
const fresh = () => {
  const s = createBasicTrainingStateV411(0);
  s.skills.attaque_passive.allocation = 10000; // cap 2 500 -> surplus 7 500
  s.skills.blocage.allocation = 2500; // exactement le cap : aucun surplus
  return s;
};

// sans l'achat : comportement inchangé (la compétence débloquée reste à 0)
{
  const { state } = advanceBasicTrainingStateV411(fresh(), 150_000, 12 * 3600, 1);
  assert.equal(state.skills.attaque_passive.level, 7500);
  assert.equal(state.skills.attaque_passive.allocation, 10000);
  assert.equal(state.skills.attaque_reguliere.allocation, 0);
  assert.equal(state.skills.attaque_reguliere.level, 0);
}

// avec l'achat : 7 500 d'énergie passent à Attaque régulière au déblocage (t = 100 s)
{
  const before = fresh();
  const total = totalBasicTrainingAllocationV411(before);
  const { state } = advanceBasicTrainingStateV411(before, 150_000, 12 * 3600, 1, { autoAdvance: true });
  assert.equal(state.skills.attaque_passive.level, 7500, "la prérequise garde sa vitesse max");
  assert.equal(state.skills.attaque_passive.allocation, 2500, "« leaving the necessary cap »");
  assert.equal(state.skills.attaque_reguliere.allocation, 7500);
  // cap 15 000, 7 500 alloués -> 25 niv/s pendant les 50 s après le déblocage
  assert.equal(state.skills.attaque_reguliere.level, 1250);
  assert.equal(totalBasicTrainingAllocationV411(state), total, "aucune énergie inactive prise ni créée");
  // défense : Blocage exactement au cap -> Défense renforcée débloquée mais rien à transférer
  assert.equal(state.skills.blocage.allocation, 2500);
  assert.equal(state.skills.defense_renforcee.allocation, 0);
}

// déblocage déjà acquis avant l'achat : aucun transfert (seulement « each time a skill is unlocked »)
{
  const s = fresh();
  s.skills.attaque_passive.level = 6000;
  const { state } = advanceBasicTrainingStateV411(s, 10_000, 12 * 3600, 1, { autoAdvance: true });
  assert.equal(state.skills.attaque_passive.allocation, 10000);
  assert.equal(state.skills.attaque_reguliere.allocation, 0);
}

// cascade : chaque déblocage laisse le cap et fait suivre le reste
{
  const s = createBasicTrainingStateV411(0);
  for (const id of Object.keys(s.skills)) s.skills[id].cap = 1;
  s.skills.attaque_passive.allocation = 100;
  s.skills.attaque_passive.level = 4999;
  s.skills.attaque_reguliere.level = 9999;
  s.skills.attaque_renforcee.level = 14999;
  s.skills.contre_palette.level = 19999;
  s.skills.percee_quai.level = 24999;
  const { state } = advanceBasicTrainingStateV411(s, 1_000, 12 * 3600, 1, { autoAdvance: true });
  assert.deepEqual(
    ["attaque_passive", "attaque_reguliere", "attaque_renforcee", "contre_palette", "percee_quai", "ultime_soreal"].map((id) => state.skills[id].allocation),
    [1, 1, 1, 1, 1, 95]
  );
  assert.equal(totalBasicTrainingAllocationV411(state), 100);
}

// câblage runtime : la synchro passe l'option depuis l'achat de la boutique EXP
{
  const src = readFileSync(new URL("../src/idle-sqlite-runtime.js", import.meta.url), "utf8");
  assert.match(src, /autoAdvance:\s*autoAvanceEntrainementSorealIdle_\(stats\)/);
  assert.match(src, /expShop\.trainingAutoAdvance/);
}

// libellé client
{
  const client = readFileSync(new URL("../public/modules/meta-progression-v130.js", import.meta.url), "utf8");
  assert.match(client, /trainingAutoAdvance:'[^']+'/);
}

console.log("idle-basic-training-auto-advance: OK");
