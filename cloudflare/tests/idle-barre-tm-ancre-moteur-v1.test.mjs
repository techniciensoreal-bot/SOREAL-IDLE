import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lirePagesMeta } from "./_meta-pages.mjs";

/*
 * Norman (2026-11-05) : « priorité numéro une : ne plus jamais avoir un recul de barre… il y a un calcul qui met trop de temps à se faire » (barre rapide après un rebirth). Mesuré sur sa partie : allocation 125 à 134 ms, synchro 90 ms.
 * 1. L'ancre des chiffres du moteur dans la Machine temporelle est la réception CALÉE (début du calcul du moteur), pas l'heure d'arrivée ; le calcul local d'un clic ancre à maintenant.
 * 2. Les clés de mémo des bonus et de l'équipement n'embarquent plus les blocs jamais lus (uiPrefs, journal d'idempotence) : ~25 % de temps en moins par opération.
 */
const tm = readFileSync("cloudflare/public/modules/ui-machine-temporelle-v1.js", "utf8");
assert.ok(tm.includes("function patcherBarresTimeMachineIdleV1_(j,depuisMaintenant)"), "le patch sait d'où viennent les chiffres");
assert.ok(/recuCaleTm=Number\(j&&j\.__recuPerfV1\)/.test(tm) && tm.includes("!depuisMaintenant&&recuCaleTm>0"), "ancre = réception calée du moteur");
assert.ok(!/eta\.dataset\.tmEtaAt=String\(Date\.now\(\)-\(typeof window\.__SOREAL_IDLE_RTT_V1__/.test(tm), "plus d'ancre à l'heure d'arrivée");
const pages = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8") + lirePagesMeta();
assert.ok(/recalculerPisteFractionIdleV1_\(k,fracAvant,alloc\)[\s\S]{0,700}patcherBarresTimeMachineIdleV1_\(j,true\)/.test(pages), "le recalcul local du clic ancre à maintenant");
assert.ok(/H\.patcherBarresTimeMachineIdleV1_\(j\);\s*\n\s*\}\s*\n\s*\n\s*\/\*\s*\n\s*\* Recalcul local/.test(pages) || pages.includes("H.patcherBarresTimeMachineIdleV1_(j);"), "la réponse du moteur garde l'ancre calée");

const bonus = readFileSync("cloudflare/src/idle-ngu-bonus.js", "utf8");
assert.ok(bonus.includes("function cleSansDonneesInertesV1(state)") && bonus.includes("JSON.stringify(cleSansDonneesInertesV1(state))"), "clé de mémo des bonus allégée");
assert.ok(/uiPrefs: undefined, recentClientMutations: undefined/.test(bonus), "uiPrefs et journal d'idempotence hors clé");
const equip = readFileSync("cloudflare/src/idle-adventure-v47.js", "utf8");
assert.ok(equip.includes("JSON.stringify(Object.assign({},raw,{recentClientMutations:undefined}))"), "clé de mémo de l'équipement allégée");
console.log("idle-barre-tm-ancre-moteur-v1: OK");
