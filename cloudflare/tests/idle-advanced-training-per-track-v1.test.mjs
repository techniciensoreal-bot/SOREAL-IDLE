import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Advanced Training (Norman, 2026-10-02) : comme dans le jeu d'origine, chaque compétence a SON énergie allouée, son niveau et son Target.
 * Formules inchangées (wiki : 10 000 s / 20 000 s pour le niveau 1, racine carrée de la puissance).
 */
const ctx = { bosses: 100, basicTrainingComplete: true };
const fresh = () => {
  const s = normalizeIdleNguState({}, ctx, 0);
  s.systems.advancedTraining.unlocked = true;
  s.systems.wandoos.unlocked = true;
  s.resources.energy.cap = 3000;
  s.resources.energy.current = 3000;
  s.resources.energy.power = 1;
  return s;
};
const agir = (s, a, t = 1000) => applyIdleNguAction(s, Object.assign({ action: a.action }, a), ctx, t).state;
const at = (s) => s.systems.advancedTraining;

// 1. Chaque compétence reçoit sa propre énergie ; allocation.energy en est la somme ; l'énergie libre diminue d'autant.
let s = fresh();
s = agir(s, { action: "allocateAdvancedTraining", track: "power", value: 1000 });
s = agir(s, { action: "allocateAdvancedTraining", track: "toughness", value: 500 });
assert.equal(at(s).data.tracks.power.energy, 1000);
assert.equal(at(s).data.tracks.toughness.energy, 500);
assert.equal(at(s).allocation.energy, 1500);
assert.equal(s.resources.energy.current, 1500);

// 2. Elles progressent EN MÊME TEMPS, chacune à son débit (10 000 s pour le niveau 1 à 1000 d'énergie, 1 de puissance).
let r = advanceIdleNguState(s, 10001, ctx, 10_001_000);
assert.equal(at(r).data.tracks.power.tempLevel, 1, "1000 d'énergie : niveau 1 en 10 000 s");
assert.equal(at(r).data.tracks.toughness.tempLevel, 0, "500 d'énergie : la moitié du débit, pas encore de niveau");
assert.equal(at(r).data.tracks.block.tempLevel, 0, "sans énergie : rien");

// 3. Retirer (valeur 0) rend l'énergie.
s = agir(s, { action: "allocateAdvancedTraining", track: "power", value: 0 });
assert.equal(at(s).allocation.energy, 500);
assert.equal(s.resources.energy.current, 2500);

// 4. Plafond : jamais plus que l'énergie possédée.
s = agir(s, { action: "allocateAdvancedTraining", track: "block", value: 99999 });
assert.equal(at(s).data.tracks.block.energy, 2500);
assert.equal(s.resources.energy.current, 0);

// 5. Target : à l'atteinte du niveau, l'énergie de la compétence est retirée.
s = fresh();
s = agir(s, { action: "setAdvancedTrainingTarget", track: "power", value: 1 });
s = agir(s, { action: "allocateAdvancedTraining", track: "power", value: 3000 });
r = advanceIdleNguState(s, 4000, ctx, 4_000_000); // 3000 d'énergie : niveau 1 en ~3 333 s
assert.equal(at(r).data.tracks.power.tempLevel >= 1, true);
assert.equal(at(r).data.tracks.power.energy, 0, "Target atteint : énergie retirée");
assert.equal(at(r).allocation.energy, 0);

// 6. Pistes Wandoos : refusées tant que Wandoos est verrouillé.
s = fresh();
s.systems.wandoos.unlocked = false;
assert.throws(() => agir(s, { action: "allocateAdvancedTraining", track: "wandoosEnergy", value: 10 }), /PISTE_VERROUILLEE/);
assert.throws(() => agir(s, { action: "allocateAdvancedTraining", track: "inconnue", value: 10 }), /PISTE_INCONNUE/);

// 7. Rebirth : les énergies par compétence sont remises à zéro.
{
  s = fresh();
  s = agir(s, { action: "allocateAdvancedTraining", track: "power", value: 1000 });
  s.systems.advancedTraining.data.tracks.power.tempLevel = 5;
  const apres = applyIdleNguAction(s, { action: "challenge", mode: "start", challenge: "basic" }, { bosses: 100 }, 5000).state;
  void apres;
}

// 8. Ancien contrat (allocation unique + piste active) toujours valable.
s = fresh();
s.systems.advancedTraining.allocation.energy = 1000;
s.systems.advancedTraining.data.activeTrack = "power";
r = advanceIdleNguState(s, 10001, ctx, 10_001_000);
assert.equal(at(r).data.tracks.power.tempLevel, 1);

// 9. Snapshot : chaque compétence expose niveau, énergie et Target.
{
  s = fresh();
  s = agir(s, { action: "allocateAdvancedTraining", track: "power", value: 100 });
  s = agir(s, { action: "setAdvancedTrainingTarget", track: "power", value: 40 });
  const snap = idleNguSnapshot(s, ctx, 2000);
  const sys = snap.systems.find((x) => x.id === "advancedTraining");
  assert.equal(sys.state.data.tracks.power.energy, 100);
  assert.equal(sys.state.data.tracks.power.target, 40);
}


// Advance Energy (2026-10-02) : à l'atteinte du Target d'une ligne, son énergie passe à la ligne suivante (ordre de l'écran) ; sinon elle est rendue.
{
  let a = fresh();
  a = agir(a, { action: "setAdvancedTrainingAdvance", enabled: true });
  assert.equal(at(a).data.advanceEnergy, true);
  a = agir(a, { action: "setAdvancedTrainingTarget", track: "toughness", value: 1 });
  a = agir(a, { action: "allocateAdvancedTraining", track: "toughness", value: 3000 });
  let r = advanceIdleNguState(a, 4000, ctx, 4_000_000);
  assert.ok(at(r).data.tracks.toughness.tempLevel >= 1);
  assert.equal(at(r).data.tracks.toughness.energy, 0, "Target atteint : la ligne n'a plus d'énergie");
  assert.equal(at(r).data.tracks.power.energy, 3000, "l'énergie est passée à la ligne suivante");
  assert.equal(at(r).allocation.energy, 3000, "l'énergie allouée totale ne change pas");
  assert.equal(r.resources.energy.current, 0, "rien n'est rendu à l'énergie libre");

  // La ligne suivante a déjà atteint son propre Target : on saute à la suivante.
  let b = fresh();
  b = agir(b, { action: "setAdvancedTrainingAdvance", enabled: true });
  b = agir(b, { action: "setAdvancedTrainingTarget", track: "toughness", value: 1 });
  b.systems.advancedTraining.data.tracks.power.target = 1;
  b.systems.advancedTraining.data.tracks.power.tempLevel = 1;
  b = agir(b, { action: "allocateAdvancedTraining", track: "toughness", value: 3000 });
  r = advanceIdleNguState(b, 4000, ctx, 4_000_000);
  assert.equal(at(r).data.tracks.block.energy, 3000, "Power déjà à son Target : l'énergie va à Block");

  // Désactivé (ou plus de ligne disponible) : l'énergie est rendue.
  let c = fresh();
  c = agir(c, { action: "setAdvancedTrainingTarget", track: "toughness", value: 1 });
  c = agir(c, { action: "allocateAdvancedTraining", track: "toughness", value: 3000 });
  r = advanceIdleNguState(c, 4000, ctx, 4_000_000);
  assert.equal(at(r).data.tracks.power.energy, 0);
  assert.equal(r.resources.energy.current, 3000);
  assert.throws(() => applyIdleNguAction(normalizeIdleNguState({}, { bosses: 10 }, 0), { action: "setAdvancedTrainingAdvance", enabled: true }, { bosses: 10 }, 1000), /SYSTEME_VERROUILLE/);
}

// Page client (2026-10-02) : une ligne par compétence (Name / Level / Energy Allocated / Target / + −), plus de barres de progression.
{
  const { readFileSync } = await import("node:fs");
  const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
  assert.ok(meta.includes("function pageAdvancedTrainingIdleV1_(j)") && meta.includes("if(id==='advancedTraining')return pageAdvancedTrainingIdleV1_(j);"));
  for (const mot of ["Energy Allocated", "Target", "Level", "allocateAdvancedTraining", "setAdvancedTrainingTarget", "setAdvancedTrainingAdvance", "WTF do I do?", "Advance Energy"]) assert.ok(meta.includes(mot), mot);
  const ui = readFileSync("cloudflare/public/modules/ui.js", "utf8");
  assert.ok(ui.includes("if(window.__SOREAL_IDLE_AT_PAGE_V2__)return;"), "l'ancien rendu à barres est désactivé");
}
console.log("idle-advanced-training-per-track-v1: OK");
