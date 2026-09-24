import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * 2026-09-24 — audit de composition (Attack/Defense ~x1100 plus élevés dans
 * NGU à niveaux d'entraînement identiques). Le ticker local du client
 * (progresserBasicTrainingLocalIdleV120_) recalculait l'Attaque/Défense à
 * chaque frame avec des multiplicateurs codés à 1 et écrasait la valeur du
 * serveur : l'écran (et la simulation locale du Fight Boss) montrait
 * l'entraînement brut, sans NUMBER, équipement, augments, Wandoos, perks...
 * Le serveur expose maintenant le produit qu'il applique réellement.
 */

const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const debut = ui.indexOf("function progresserBasicTrainingLocalIdleV120_(");
assert.ok(debut > 0, "progresserBasicTrainingLocalIdleV120_ introuvable");
const fin = ui.indexOf("window.__ajusterBasicTrainingIdleV120__", debut);
assert.ok(fin > debut);
const source = ui.slice(debut, fin);

function executer(combatPrincipal) {
  const idleEtat = { combatPrincipal, pvJoueur: 0, pvJoueurMax: 1, combatBossActif: false };
  const bt = {
    skills: [
      { id: "attaque_passive", group: "attack", unlocked: true, level: 1000, progress: 0, baseValue: 150 },
      { id: "blocage", group: "defense", unlocked: true, level: 1000, progress: 0, baseValue: 150 }
    ]
  };
  const fn = new Function(
    "idleEtat", "basicTrainingIdleV120_", "vitesseBasicTrainingLocalIdleV120_", "document",
    "animerBarreBasicTrainingIdleV220_", "actualiserDeblocagesBasicTrainingLocalIdleV120_",
    "rafraichirBasicTrainingIdleV120_", "idleNombre_",
    source + "\nreturn progresserBasicTrainingLocalIdleV120_;"
  )(
    idleEtat, () => bt, () => 0, { getElementById: () => null },
    () => {}, () => {}, () => {},
    (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; }
  );
  fn(0.5);
  return idleEtat;
}

const entrainement = 100 + Math.pow(1000, 1.3) * 150;

{
  const etat = executer({ multiplicateurAttaqueTotal: 1067, multiplicateurDefenseTotal: 500 });
  assert.equal(etat.puissance, Math.round(entrainement * 1067), "Attaque affichée = entraînement x produit serveur");
  assert.equal(etat.force, etat.puissance);
  assert.equal(etat.defense, Math.round(entrainement * 500), "Défense affichée = entraînement x produit serveur");
  assert.equal(etat.pvJoueurMax, etat.puissance * 10, "PV = 10 x Attaque (wiki Boss Fights)");
  assert.equal(etat.combatPrincipal.attaqueEntrainement, entrainement, "l'entraînement brut reste disponible");
}
{
  /* NUMBER < 1 après un Rebirth rapide : le plancher de 100 reste celui du serveur. */
  const etat = executer({ multiplicateurAttaqueTotal: 0.33, multiplicateurDefenseTotal: 0.33 });
  assert.equal(etat.puissance, Math.max(100, Math.round(entrainement * 0.33)));
}
{
  /* Ancien serveur (champ absent) : repli neutre x1, jamais NaN. */
  const etat = executer({});
  assert.equal(etat.puissance, Math.round(entrainement));
}

/* Le serveur expose bien le produit qu'il applique. */
const runtime = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
const statsDebut = runtime.indexOf("function statsCombatPrincipalSorealIdleV413_(");
const statsFin = runtime.indexOf("\n}\n", statsDebut);
const stats = runtime.slice(statsDebut, statsFin);
assert.match(stats, /multiplicateurAttaqueTotal:\s*Math\.max\(\s*1e-300,\s*nombreSorealIdle_\(\s*bonusMetaNgu\.attackMultiplier/);
assert.match(stats, /multiplicateurDefenseTotal:\s*Math\.max\(\s*1e-300,\s*nombreSorealIdle_\(\s*bonusMetaNgu\.defenseMultiplier/);
assert.match(runtime, /multiplicateurAttaqueTotal:\s*combatPrincipalEtat\s*\.multiplicateurAttaqueTotal/);
assert.match(runtime, /multiplicateurDefenseTotal:\s*combatPrincipalEtat\s*\.multiplicateurDefenseTotal/);

console.log("idle client attack/defense multipliers: OK");
