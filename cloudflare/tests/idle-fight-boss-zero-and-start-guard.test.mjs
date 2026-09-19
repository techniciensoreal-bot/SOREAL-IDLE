import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync("src/idle-sqlite-runtime.js","utf8");

assert.ok(
  source.includes("if(Boolean(actif)&&stats.combatBossActif)") &&
  source.includes("dejaActif:true"),
  "Repeated Fight requests must be idempotent while the boss fight is already active."
);

assert.ok(
  source.includes("code:'JOUEUR_KO'") &&
  source.includes("koJusquaMs>Date.now()"),
  "Fight must not restart while the player is still KO."
);

assert.ok(
  source.includes("if(bossPv<=1e-9)bossPv=0;") &&
  source.includes("if(pvJoueur<=1e-9)pvJoueur=0;") &&
  source.includes("const bossMort =\n      bossPv===0;") &&
  source.includes("const joueurKo =\n      pvJoueur===0;"),
  "Fight Boss death/KO must be based on exact zero HP after clamping."
);

console.log("idle-fight-boss-zero-and-start-guard: OK");
