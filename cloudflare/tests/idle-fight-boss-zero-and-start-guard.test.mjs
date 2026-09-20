import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(
  new URL("../src/idle-sqlite-runtime.js",import.meta.url),
  "utf8"
);

assert.ok(
  source.includes("if(Boolean(actif)&&stats.combatBossActif)") &&
  source.includes("dejaActif:true"),
  "Repeated Fight requests must be idempotent while the boss fight is already active."
);

assert.ok(
  !source.includes("code:'JOUEUR_KO'") &&
  !source.includes("DUREE_KO_SECONDES"),
  "Fight Boss must have no KO gate or KO countdown."
);

assert.ok(
  source.includes("if(bossPv<=1e-9)bossPv=0;") &&
  source.includes("if(pvJoueur<=1e-9)pvJoueur=0;") &&
  source.includes("const bossMort =\n      bossPv===0;") &&
  source.includes("const joueurBattu =\n      pvJoueur===0;"),
  "Fight Boss death/defeat must be based on exact zero HP after clamping."
);

const defeatStart=source.indexOf("if (joueurBattu) {");
assert.ok(defeatStart>=0,"Defeat branch missing.");
const defeat=source.slice(defeatStart,defeatStart+900);
assert.ok(
  defeat.includes("pvJoueur=0;") &&
  defeat.includes("statsCombat.combatBossActif=false;") &&
  defeat.includes("combatBossActif=false;") &&
  !/bossPv\s*=\s*bossPvMax/.test(defeat),
  "Player defeat must stop combat at zero HP without restoring boss HP."
);

const damageStart=source.indexOf("function degatsRecusSecondeSorealIdle_(");
const damageEnd=source.indexOf("function recalculerPuissanceCompleteSorealIdle_",damageStart);
const damageBody=source.slice(damageStart,damageEnd);
assert.ok(
  damageBody.includes("attaque -") &&
  !damageBody.includes("BOSS_DEGATS_MIN_PCT") &&
  !damageBody.includes("attaque * plancherPct"),
  "Fight Boss damage must be exactly max(0, Boss Attack - Defense), with no artificial damage floor."
);

const regenStart=source.indexOf("const regenPvSecJoueur =");
const regenEnd=source.indexOf("if (!combatBossActif)",regenStart);
const regenBody=source.slice(regenStart,regenEnd);
assert.ok(
  regenBody.includes("defense / 20") &&
  !regenBody.includes("0.05 +"),
  "Player Fight Boss HP regen must be exactly Defense/20."
);

console.log("idle-fight-boss-zero-and-start-guard: OK");
