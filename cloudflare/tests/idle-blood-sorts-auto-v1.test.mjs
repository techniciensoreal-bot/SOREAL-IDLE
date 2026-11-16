import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { applyRebirthResetV56_ } from "../src/idle-ngu-actions.js";
import { avancerSortsAutoV1 } from "../src/idle-ngu-systemes.js";

/*
 * Lu dans le jeu (build 1260, 2026-11-16, RebirthPowerSpell::autoSpell, relancé toutes les secondes) :
 *  - rien si le boss est <= 36 ou si aucune case n'est cochée ;
 *  - le sang est réparti à parts égales (floor) entre les sorts cochés, chacun lance son lancer partiel avec CE montant, dans l'ordre Nombre, Spaghetti, Or ;
 *  - les cases survivent au Rebirth (AllBloodMagicController::reset ne les touche pas) ; rien hors ligne.
 */
const ctx = { bosses: 50 };
function neuf(sang) {
  const s = normalizeIdleNguState({}, ctx, 1_000_000);
  s.systems.bloodMagic.unlocked = true;
  s.currencies.blood = sang;
  return s;
}
const regler = (s, spell, value) => applyIdleNguAction(s, { action: "setBloodAutoSpell", spell, value }, ctx, 1_000_000).state;

{
  const s = regler(neuf(100), "numberBoost", true);
  assert.equal(s.systems.bloodMagic.data.spells.autoNumberBoost, true);
  assert.equal(regler(s, "numberBoost").systems.bloodMagic.data.spells.autoNumberBoost, false, "sans valeur : bascule");
  assert.throws(() => regler(neuf(1), "ironPill", true), /SORT_SANG_INVALIDE/, "seuls Nombre, Spaghetti et Or ont une case automatique");
}
{
  /* Une case : tout le sang part (cadence de 1 s). */
  const s = regler(neuf(100), "numberBoost", true);
  avancerSortsAutoV1(s, 0.5, ctx);
  assert.equal(s.currencies.blood, 100, "moins d'une seconde : rien");
  avancerSortsAutoV1(s, 0.5, ctx);
  assert.equal(s.currencies.blood, 0);
  assert.equal(s.systems.bloodMagic.data.spells.numberBoost, 101);
}
{
  /* Trois cases : sang / 3 (floor) chacun ; Gold ignoré sous son minimum (1e6), Spaghetti accepté (10 000). */
  let s = neuf(40_001);
  for (const k of ["numberBoost", "bloodSpaghetti", "counterfeitGold"]) s = regler(s, k, true);
  avancerSortsAutoV1(s, 1, ctx);
  const sp = s.systems.bloodMagic.data.spells;
  assert.equal(sp.numberBoost, 1 + 13_333);
  assert.equal(sp.bloodSpaghettiBloodSpent, 13_333);
  assert.equal(sp.counterfeitGoldBloodSpent, 0, "13 333 < 1e6 : l'Or ignore ce lancer");
  assert.equal(s.currencies.blood, 40_001 - 2 * 13_333, "le sang du lancer ignoré reste");
}
{
  /* Boss 36 ou moins, hors ligne : rien. */
  const s = regler(neuf(100), "numberBoost", true);
  avancerSortsAutoV1(s, 1, { bosses: 36 });
  assert.equal(s.currencies.blood, 100, "boss 36 : rien");
  avancerSortsAutoV1(s, 400, ctx);
  assert.equal(s.currencies.blood, 100, "hors ligne : rien");
}
{
  /* Les cases survivent au Rebirth (le reste du sang est remis à zéro). */
  const s = regler(regler(neuf(100), "numberBoost", true), "counterfeitGold", true);
  const retour = applyRebirthResetV56_(s, ctx, 1_000_000, {});
  const sp = (retour && retour.state ? retour.state : s).systems.bloodMagic.data.spells;
  assert.equal(sp.autoNumberBoost, true);
  assert.equal(sp.autoCounterfeitGold, true);
  assert.equal(sp.autoBloodSpaghetti, false);
}
{
  /* Sans case cochée : le sang n'est jamais touché. */
  const s = neuf(100);
  avancerSortsAutoV1(s, 10, ctx);
  assert.equal(s.currencies.blood, 100);
}

{
  /* Interface : la case n'existe que sur une carte de sort DÉJÀ découverte (anti-spoil, règle n°2), lue dans l'état du moteur ; textes au dictionnaire anglais. */
  const { readFileSync } = await import("node:fs");
  const ui = readFileSync(new URL("../public/modules/blood-magic-v1.js", import.meta.url), "utf8");
  const dict = JSON.parse(readFileSync(new URL("../public/modules/traduction-anglais-dict-v1.json", import.meta.url), "utf8"));
  assert.ok(ui.includes("action:\\'setBloodAutoSpell\\'") && ui.includes("boutonAutoSortBloodV1_(sp.id,spells)+"), "case dessinée dans la carte du sort");
  assert.ok(ui.indexOf("].filter(function(sp){return sp.visible;})") < ui.indexOf("boutonAutoSortBloodV1_(sp.id,spells)+"), "après le filtre des sorts découverts");
  for (const t of ["Automatique : activé", "Automatique : désactivé", "Lance ce sort chaque seconde avec sa part du sang"]) assert.ok(dict[t], "dictionnaire : " + t);
}

console.log("idle-blood-sorts-auto-v1: OK");
