import assert from "node:assert/strict";
import fs from "node:fs";
const lire = (p) => fs.readFileSync(new URL("../public/" + p, import.meta.url), "utf8");
const orage = lire("modules/orage-v1.js"), blood = lire("modules/blood-magic-v1.js"), ui = lire("soreal-idle-ui.js"), trad = lire("modules/traduction-interface-v1.js");
/* Norman (2026-10-15) : un sort de Blood Magic assombrit l'écran, éclair + tonnerre au même moment, de plus en plus fort jusqu'au dernier sort, pentacle pour les derniers */
assert.ok(orage.includes("var NIVEAUX_SORTS={numberBoost:1,ironPill:2,bloodSpaghetti:3,counterfeitGold:4,leeches:5};"), "cinq niveaux, dans l'ordre de la liste des sorts");
assert.ok(orage.includes("eclairs:[260]") && orage.includes("eclairs:[260,1350]") && orage.includes("eclairs:[260,1250,2350]") && orage.includes("eclairs:[260,1150,2100,3150]"), "de plus en plus d'éclairs");
assert.ok(/pentacle:1/.test(orage) && /pentacle:2/.test(orage) && orage.includes("osTourne") && orage.includes("osTourneInverse"), "pentacle qui tourne (sorts 4 et 5), double à runes pour le dernier");
assert.ok(orage.includes("var e=trace_();") && orage.includes("BLANCS[") && orage.includes("coupTonnerre_(niveau,i);"), "réutilise le tracé d'éclair et les claquements de l'orage, tonnerre au même instant");
assert.ok(orage.includes("function sortieReverbeOrage_(a){") && orage.includes("var TONNERRES=[") && orage.includes("var TONNERRES_PAR_NIVEAU=[null,[0],[3],[0,2],[3,2,4],[0,3,2,4]];"), "tonnerres de SOREAL APP (réverbération comprise)");
assert.ok(orage.includes("localStorage.getItem('soreal_idle_effet_orage_v1')!=='0'") && orage.includes("mouvementReduit_()"), "respecte l'effet orage coupé et le mouvement réduit");
assert.ok(blood.includes("o.sort(String(id||''))"), "branché sur le lancement d'un sort");
assert.ok(ui.includes("window.__apercuOrageSortIdleV1__") && ui.includes("htmlReglagesOrageSortsIdleV1_()+"), "aperçu de chaque sort dans les Réglages de développement");
/* « sang » et « Nombre » partout : sorts traduits */
assert.ok(trad.includes("['Blood NUMBER Boost','Boost du nombre par le sang'],['Blood Spaghetti','Spaghetti de sang']") && trad.includes("['BLOOD','SANG'],['Blood','sang']"), "traduction automatique : sang, Nombre, noms de sorts");
assert.ok(blood.includes("nom:'Boost du nombre par le sang'") && blood.includes("' sang</b></div>'") && !/Pas assez de Blood/.test(blood), "textes de la page Magie du sang en français");
console.log("idle-orage-sorts-blood-v1: OK");
