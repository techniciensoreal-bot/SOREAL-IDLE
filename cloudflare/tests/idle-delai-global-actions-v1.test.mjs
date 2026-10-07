import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Délai global entre deux actions (Norman, 2026-10-08, vérifié dans NGU Idle) : dès qu'une action est faite, toutes les autres ont 1 s de délai ; 0,8 s avec le set Red Liquid
 * (wiki « Red Liquid (set) » : -20 % sur le global cooldown timer).
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const debut = ui.indexOf("function appliquerDelaiGlobalAdventureIdleV1_(idUtilise,maintenant,a){");
assert.ok(debut > 0, "fonction présente");
const fin = ui.indexOf("\n      }\n", debut) + 8;
const src = ui.slice(debut, fin);
const att = ui.slice(ui.indexOf("const IDLE_ADVENTURE_MANUAL_ATTACKS_V3="), ui.indexOf("let idleAdventureIdleModeV3=true;"));
function monde(a) {
  return new Function(
    att + "\nconst idleAdventureManualStateV3={cooldownUntil:Object.create(null)};\nconst idleNombre_=(v)=>Number(v)||0;\nconst intervalleIdleAttackAdventureIdleV4_=(a)=>a&&a.unlockFlags&&a.unlockFlags.redLiquidMaxed?800:1000;\n" + src +
    "\nreturn {etat:idleAdventureManualStateV3,appliquer:appliquerDelaiGlobalAdventureIdleV1_};"
  )();
}
const ids = ["regular", "strong", "parry", "piercing", "ultimate", "block", "defensiveBuff", "heal", "offensiveBuff", "charge", "ultimateBuff", "paralyze", "hyperRegen", "beastMode", "megaBuff", "ohShit", "move69"];
// 1 s pour toutes les autres, rien pour l'action elle-même (son propre délai est posé ailleurs)
{
  const m = monde({});
  m.appliquer("strong", 10000, {});
  for (const id of ids) {
    if (id === "strong") assert.equal(m.etat.cooldownUntil[id], undefined, "l'action utilisée garde son propre délai");
    else assert.equal(m.etat.cooldownUntil[id], 11000, id + " : 1 s de délai");
  }
}
// Un délai déjà plus long n'est jamais raccourci
{
  const m = monde({});
  m.etat.cooldownUntil.ultimate = 25000;
  m.appliquer("regular", 10000, {});
  assert.equal(m.etat.cooldownUntil.ultimate, 25000);
  assert.equal(m.etat.cooldownUntil.regular, undefined);
}
// Red Liquid : 0,8 s
{
  const m = monde({});
  m.appliquer("heal", 10000, { unlockFlags: { redLiquidMaxed: true } });
  assert.equal(m.etat.cooldownUntil.regular, 10800);
}
// Appelé juste après la pose du délai propre de l'action
assert.ok(/cooldownUntil\[def\.id\]=\s*maintenant\+cooldownDureeAdventureIdleV4_\(def,a\);\s*appliquerDelaiGlobalAdventureIdleV1_\(def\.id,maintenant,a\);/.test(ui), "branché dans utiliserCompetence");
console.log("idle-delai-global-actions-v1: OK");
