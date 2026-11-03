import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-03) : « dans time machine, quand il manque de l'argent, enlève le compte à rebours d'argent manquant. Je veux juste la somme écrite en rouge nécessaire pour le niveau suivant. »
 * Faute d'Or, l'écran de la Machine temporelle n'affiche plus ni « En attente d'Or » ni l'Or présent qui défile : seulement le COÛT du niveau suivant (fixe), en rouge.
 */
const src = fs.readFileSync("cloudflare/public/modules/ui-machine-temporelle-v1.js", "utf8").replace(/\r\n/g, "\n");
assert.ok(src.includes("const coutRequis=orPresent+manqueOr;"), "somme nécessaire = Or présent + manque = coût du niveau suivant (constante)");
assert.ok(src.includes("formatGrandNombreIdleV70_(coutRequis)+' Or</b>'") && src.includes("poserLcdTmIdleV1_(el,formatGrandNombreIdleV70_(coutRequis)+' Or',true);"), "l'écran et le texte n'affichent que la somme nécessaire");
assert.ok(!src.includes("poserLcdTmIdleV1_(el,'En attente d’Or')") && !src.includes("formatGrandNombreIdleV70_(orPresent)+' Or</b>'"), "plus de « En attente d'Or » ni d'Or présent qui défile");
assert.ok(src.includes("function poserLcdTmIdleV1_(etaEl,texte,rouge)") && src.includes("lcd.style.color!==c)lcd.style.color=c"), "rouge en style en ligne (aucun !important de plus), couleur normale remise ensuite");
/* Barre pleine avec un reste > 0 (niveau très court posé à 100 %) : l'Or doit être vérifié dès que le temps restant est nul, sinon « Fin de la barre dans 0s » reste affiché. */
assert.ok(src.includes("if(niveau0!==null&&restant<=0){"), "le manque d'Or est testé sur le temps restant, pas sur le reste de départ");
assert.ok(!src.includes("if(niveau0!==null&&fill0>=1&&base<=0){"), "plus de test sur base<=0 (laissait « 0s » sans vérifier l'Or)");
console.log("idle-tm-or-manquant-somme-rouge-v1 : OK");
