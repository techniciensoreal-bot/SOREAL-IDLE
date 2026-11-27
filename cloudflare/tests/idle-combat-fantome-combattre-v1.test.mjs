import assert from "node:assert/strict";
import fs from "node:fs";

/* Audit Fight Boss (2026-11-27) : combat fantome client + bouton Combattre de la carte. */
const c1 = fs.readFileSync("cloudflare/public/modules/ui-combat-1-v1.js", "utf8");
const c2 = fs.readFileSync("cloudflare/public/modules/ui-combat-2-v1.js", "utf8");
const ar = fs.readFileSync("cloudflare/public/modules/ui-actions-rapides-v1.js", "utf8");

/* (1) desaccord « combat inactif » : le client garde 8 s au plus puis fait foi au moteur, sauf ordre en vol */
assert.ok(c1.includes("REG.idleCombatDesaccordDepuisV1") && c1.includes("<8000)return true;"), "(1) delai de 8 s");
assert.ok(c1.includes("ordreEnVolV1||!REG.idleCombatDesaccordDepuisV1"), "(1) un ordre en vol relance le delai");
/* (2) ordre Fight ignore/obsolete : combat local desarme */
assert.ok(/res\.ok&&\(res\.obsolete\|\|res\.ignore\)[\s\S]{0,200}lot\.payload\.actif[\s\S]{0,200}combatBossActif=false/.test(ar), "(2) ordre ignore desarme le combat local");
/* (3) Combattre : meme boss = ni soin ni boss rempli */
assert.ok(c2.includes("const memeBossIdleV1=idleEntier_(REG.idleEtat.bossSelection)===n;") && /if\(!memeBossIdleV1\)\{\s*REG\.idleEtat\.bossPv=b\.pv;\s*REG\.idleEtat\.pvJoueur=/.test(c2), "(3) PV intacts si meme boss");
console.log("idle-combat-fantome-combattre-v1: OK");
