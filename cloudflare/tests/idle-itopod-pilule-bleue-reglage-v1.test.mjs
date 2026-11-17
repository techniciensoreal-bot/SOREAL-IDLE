import assert from "node:assert/strict";
import fs from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Little Blue Pill de l'ITOPOD (lu dans le jeu, build 1260, 2026-11-17) : réglage PlayerSettings.buffedKillsOn (faux par défaut, AdventureController::togglePill) ;
 * enemyDeath consomme 1 pilule par kill SEULEMENT si actif ; pillModifier (x2) dans totalPPBonus seulement si pilules > 0 ET actif ;
 * hors ligne (Character::adventureOfflineProgress) kills buffés = min(kills, pilules) si actif, sinon 0.
 */
const ctx = { adventurePower: 1e6, adventureToughness: 1e6, bosses: 100 };
const T0 = 1_000_000;
function fraiche(pilules) {
  const s = normalizeIdleNguState({}, ctx, T0);
  s.systems.tower.unlocked = true;
  s.systems.tower.data.highestFloor = 120;
  s.selloutEffects.bluePills = pilules;
  return s;
}
const avancer = (s, secs) => advanceIdleNguState(s, secs, ctx, T0 + secs * 1000);
const progression = (s) => s.systems.tower.data;

/* Défaut : réglage faux, aucune pilule consommée, aucun doublement. */
{
  const s = fraiche(1000);
  assert.equal(s.selloutEffects.buffedKillsOn, undefined, "réglage faux par défaut (aucun champ)");
  const r = avancer(s, 3600);
  assert.ok(progression(r).kills > 100, "des kills ont eu lieu");
  assert.equal(r.selloutEffects.bluePills, 1000, "réglage inactif : aucune pilule consommée");
}

/* Bascule : refusée sans pilule, inverse le réglage, refusée si l'ITOPOD n'est pas ouvert. */
{
  const vide = fraiche(0);
  assert.throws(() => applyIdleNguAction(vide, { action: "towerTogglePill" }, ctx, T0), /AUCUNE_PILULE/);
  const ferme = normalizeIdleNguState({}, ctx, T0);
  assert.throws(() => applyIdleNguAction(ferme, { action: "towerTogglePill" }, ctx, T0), /SYSTEME_VERROUILLE|AUCUNE_PILULE/);
  let s = applyIdleNguAction(fraiche(500), { action: "towerTogglePill" }, ctx, T0).state;
  assert.equal(s.selloutEffects.buffedKillsOn, true, "activé");
  s = applyIdleNguAction(s, { action: "towerTogglePill" }, ctx, T0).state;
  assert.notEqual(s.selloutEffects.buffedKillsOn, true, "désactivé : retour au défaut");
}

/* Actif : 1 pilule par kill, PPP doublés pour ces kills (stock plus grand que les kills : tout est buffé). */
{
  const base = avancer(fraiche(0), 3600);
  const k = progression(base).kills;
  const s = applyIdleNguAction(fraiche(10_000_000), { action: "towerTogglePill" }, ctx, T0).state;
  const r = avancer(s, 3600);
  assert.equal(progression(r).kills, k, "mêmes kills");
  assert.equal(10_000_000 - r.selloutEffects.bluePills, k, "une pilule par kill");
  const pp = (x) => progression(x).ppProgress + 1e6 * x.currencies.pp;
  assert.ok(Math.abs(pp(r) / pp(base) - 2) < 1e-6, "PPP x2 : " + pp(r) / pp(base));
}

/* Actif avec moins de pilules que de kills : kills buffés = min(kills, pilules). */
{
  const base = avancer(fraiche(0), 3600);
  const k = progression(base).kills;
  const s = applyIdleNguAction(fraiche(50), { action: "towerTogglePill" }, ctx, T0).state;
  const r = avancer(s, 3600);
  assert.equal(r.selloutEffects.bluePills, 0, "toutes les pilules consommées");
  const pp = (x) => progression(x).ppProgress + 1e6 * x.currencies.pp;
  const attendu = (k + 50) / k;
  assert.ok(Math.abs(pp(r) / pp(base) - attendu) < 1e-3, "PPP : " + pp(r) / pp(base) + " attendu " + attendu);
}

/* Interface : bouton visible seulement avec des pilules (ou réglage actif), action liée au compte, texte traduit. */
{
  const ui = fs.readFileSync(new URL("../public/modules/itopod-perks-page-v1.js", import.meta.url), "utf8");
  assert.match(ui, /pilulesRestantes>0\|\|pilulesActives/, "bouton conditionné à la possession de pilules");
  assert.match(ui, /action:'towerTogglePill'/);
  assert.doesNotMatch(ui, /localStorage[^;]*pilule/i, "le réglage est dans l'état du jeu, pas dans localStorage");
  const dico = JSON.parse(fs.readFileSync(new URL("../public/modules/traduction-anglais-dict-v1.json", import.meta.url), "utf8"));
  for (const k of ["Activer la petite pilule bleue", "Désactiver la petite pilule bleue", "kills restants)"]) assert.ok(dico[k], "traduit : " + k);
}
console.log("idle-itopod-pilule-bleue-reglage-v1 ok");
