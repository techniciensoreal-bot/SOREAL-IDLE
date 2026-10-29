// Norman (2026-10-29) : « après une renaissance, le boss de Fight Boss est mort tout seul quand l'écran de la borne s'est allumé » : la Renaissance laissait combatBossActif vrai ; le nouveau run combattait son premier boss sans clic.
import fs from "node:fs";
import assert from "node:assert/strict";
const src = fs.readFileSync("cloudflare/src/idle-runtime-actions.js", "utf8").replace(/\r\n/g, "\n");
const debut = src.indexOf("export function renaitreSorealIdle("), fin = src.indexOf("\nexport function", debut + 10);
const fn = src.slice(debut, fin < 0 ? undefined : fin);
for (const champ of ["combatBossActif=false", "bossSelection=1", "bossRespawnJusqua=0", "bossStunJusqua=0", "bossVulnerableJusqua=0", "sceauBriseBossNumero=0"]) assert.ok(fn.includes("stats." + champ), "la Renaissance remet " + champ);
assert.ok(fn.indexOf("stats.combatBossActif=false") < fn.indexOf("feuille.getRange(ligne,c.STATS_JSON).setValue"), "avant l'écriture de l'état");
console.log("idle-renaissance-arrete-fight-boss-v1 : OK");
