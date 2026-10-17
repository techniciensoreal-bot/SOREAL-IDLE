import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-17, signalement 🐞 : barre du boss 53, 49, … 1, 3 puis 100) : « en visuel le boss a repris toute sa vie, mais il était mort en vrai ». Le serveur confirmait la victoire un peu avant le dernier coup
 * local : le client adoptait son état d'un coup (boss suivant PLEIN, sans coup final). Maintenant : la barre est ramenée à presque rien, le tick local déroule la victoire (barre à 0, mort du boss, boss suivant) ;
 * repli au bout de 2,5 s si le tick ne passe pas.
 */
const src = readFileSync("cloudflare/public/modules/ui-combat-1-v1.js", "utf8");
const tick = readFileSync("cloudflare/public/modules/ui-boucle-v1.js", "utf8");
assert.ok(src.includes("let idleCoupFinalServeurV1=0;"), "état du coup final");
const d = src.indexOf("function coupFinalServeurIdleV1_(serveurConfirme){");
assert.ok(d > 0, "aide du coup final");
const aide = src.slice(d, src.indexOf("function appliquerSynchroCombatSansReflowIdleV116_("));
for (const m of ["!serveurConfirme", "REG.idleVictoireBossLocaleV49", "!REG.idleEtat.combatBossActif", "PAGE_ACTIVE!=='idle'", "sorealIdleBossBarV7", "REG.idleEtat.bossPv=Math.min(idleNombre_(REG.idleEtat.bossPv),1e-9)", "synchroniserJeuIdleV7_(true)", "},2600)", ">=2500"]) assert.ok(aide.includes(m), "présent : " + m);
// Appelée avant l'ancienne adoption de l'état du serveur, qui reste le repli.
const appel = src.indexOf("if(coupFinalServeurIdleV1_(serveurConfirmeVictoireBossV167))return true;");
const ancien = src.indexOf("serveurConfirmeVictoireBossV167&&\n          !REG.idleVictoireBossLocaleV49&&\n          REG.idleEtat.combatBossActif");
assert.ok(appel > 0 && ancien > appel, "appel avant le repli (adopter l'état du serveur)");
// Le tick local déroule la victoire dès que la barre atteint 0 (c'est lui qui joue le coup final).
assert.ok(/bossAvant>0\s*&&\s*REG\.idleEtat\.bossPv<=0\s*&&\s*!REG\.idleVictoireBossLocaleV49/.test(tick), "le tick déclenche la victoire locale quand la barre tombe à 0");
console.log("idle-coup-final-serveur-v1: OK");
