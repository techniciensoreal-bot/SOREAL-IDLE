import assert from "node:assert/strict";
import fs from "node:fs";

/* Audit Fight Boss (2026-11-27), cas rares du client : calque noir apres un combat arrete sans victoire ; Fight et Nuke qui se telescopent. */
const c1 = fs.readFileSync("cloudflare/public/modules/ui-combat-1-v1.js", "utf8");
const c2 = fs.readFileSync("cloudflare/public/modules/ui-combat-2-v1.js", "utf8");

/* (1) le drapeau « combat en cours » est baisse apres 4 s de combat inactif, jamais pendant l'ecran de victoire */
assert.ok(/idleCombatInactifDepuisV1[\s\S]{0,400}>=4000&&!window\.__SOREAL_IDLE_VICTOIRE_EN_COURS__[\s\S]{0,120}__SOREAL_IDLE_COMBAT_EN_COURS_V1__=false/.test(c1), "(1) drapeau baisse apres 4 s d'inactivite hors victoire");
assert.ok(c1.includes("REG.idleCombatInactifDepuisV1=0;\n"), "(1) compteur d'inactivite remis a zero des que le combat est actif");

/* (2) Fight ignore pendant un Nuke (appel ou cascade) ; Nuke ignore si un ordre Fight est en attente ou en vol */
assert.ok(c2.includes("if(actif&&(REG.idleNukeEnCoursV1||REG.idleNukeCascadeV1))return;"), "(2) Fight ignore pendant le Nuke");
assert.ok(/REG\.idleFastPendingV60\.combat!==null \|\|\s*REG\.idleCombatLotEnVolV1 \|\|\s*REG\.idleNukeCascadeV1/.test(c2), "(2) Nuke ignore si un Fight est en attente");
assert.ok(c2.includes("REG.idleNukeCascadeV1=true;") && /REG\.idleNukeCascadeV1=false;\s*REG\.idleFastPendingV60\.combat=null;/.test(c2), "(2) drapeau de cascade pose puis baisse a la fin");
assert.ok(c2.includes("},15000);   /* filet"), "(2) filet de 15 s");
console.log("idle-combat-boss-client-rares-v1: OK");
