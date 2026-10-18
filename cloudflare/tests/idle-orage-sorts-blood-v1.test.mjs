import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import fs from "node:fs";
const lire = (p) => fs.readFileSync(new URL("../public/" + p, import.meta.url), "utf8");
const orage = lire("modules/orage-v1.js"), amb = lire("modules/ambient-audio-v1.js"), blood = lire("modules/blood-magic-v1.js"), ui = lireUiComplet(), trad = lire("modules/traduction-interface-v1.js");
/* Norman (2026-10-15) : un sort de Blood Magic = pentacles et runes (plus d'orage), et la piste d'ambiance bascule sur la piste d'orage */
assert.ok(orage.includes("var NIVEAUX_SORTS={numberBoost:1,ironPill:2,bloodSpaghetti:3,counterfeitGold:4,leeches:5};"), "cinq niveaux, dans l'ordre de la liste des sorts");
assert.ok(orage.includes("{rouge:.25,gouttes:0,motif:0,duree:2200}") && orage.includes("{rouge:.95,gouttes:26,motif:3,duree:6000}"), "de plus en plus riche jusqu'au dernier sort");
assert.ok(orage.includes("osTourne") && orage.includes("osTourneInverse") && orage.includes("function pentacleSvg_(motif){"), "pentacle qui tourne, sceau et double pentacle à runes");
const sortie = orage.slice(orage.indexOf("function sort(idOuNiveau){"), orage.indexOf("L'orage ne se montre que si on ENTEND le tonnerre"));
assert.ok(!/trace_\(|BLANCS|coupTonnerre|TONNERRES|os-sombre|os-eclair/.test(sortie), "plus d'éclair, de ciel noir ni de tonnerre pour les sorts");
assert.ok(sortie.includes("basculerSurOrage_();") && orage.includes("A.forcerOrage()"), "le sort fait basculer la piste d'ambiance sur l'orage");
assert.ok(amb.includes("function forcerOrage(){") && amb.includes("var MOTIF_ORAGE=/thunder|orage|storm|tonnerre/i;") && amb.includes("if(cleForcee){var f=cleForcee;cleForcee='';forceProchaine=true;return f;}") && amb.includes("forcerOrage:forcerOrage"), "bascule sur la piste d'orage puis reprise normale");
assert.ok(orage.includes("localStorage.getItem('soreal_idle_effet_orage_v1')!=='0'") && orage.includes("mouvementReduit_()"), "respecte l'effet coupé et le mouvement réduit");
assert.ok(blood.includes("o.sort(String(id||''))"), "branché sur le lancement d'un sort");
assert.ok(ui.includes("window.__apercuOrageSortIdleV1__") && ui.includes("htmlReglagesOrageSortsIdleV1_()+"), "aperçu de chaque sort dans les Réglages de développement");
/* « sang » et « Nombre » partout : sorts traduits */
assert.ok(trad.includes("['Blood NUMBER Boost','Boost du nombre par le sang'],['Blood Spaghetti','Spaghetti au sang']") && trad.includes("['BLOOD','SANG'],['Blood','sang']"), "traduction automatique : sang, Nombre, noms de sorts");
assert.ok(blood.includes("nom:'Boost du nombre par le sang'") && blood.includes("' sang</b></div>'") && !/Pas assez de Blood/.test(blood), "textes de la page Magie du sang en français");
console.log("idle-orage-sorts-blood-v1: OK");
/* « j'ai toujours l'éclair avec le rituel » : la piste d'orage imposée par un sort n'allume jamais le décor d'éclairs */
assert.ok(amb.includes("slot.force=forceProchaine;") && amb.includes("force:Boolean(slot&&slot.force)") && orage.includes("!courante.force&&volumeAmbiance_()>0"), "piste d'orage d'un sort : le son seulement, pas d'éclair ni de ciel assombri");
