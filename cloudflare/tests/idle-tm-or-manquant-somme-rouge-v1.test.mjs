import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-03) : « dans time machine, quand il manque de l'argent, enlève le compte à rebours d'argent manquant. Je veux juste la somme écrite en rouge nécessaire pour le niveau suivant. »
 * Faute d'Or, l'écran de la Machine temporelle n'affiche plus ni « En attente d'Or » ni l'Or présent qui défile : seulement le COÛT du niveau suivant (fixe), en rouge.
 */
const src = fs.readFileSync("cloudflare/public/modules/ui-machine-temporelle-v1.js", "utf8").replace(/\r\n/g, "\n");
/* Norman (2026-11-03, rectification) : « je voulais juste que la SOMME sur la ligne Niveau suivant devienne rouge, pas un compteur à la place du temps restant » */
assert.ok(!src.includes("const coutRequis=") && !src.includes("or-manque-v1") && !src.includes("tmEtaLast='or'"), "plus de compteur d'Or à la place du temps restant");
assert.ok(src.includes("pisteEl.querySelector('[data-tm-prix]')") && src.includes("(faussesOr&&!bloqueDefi)?'#ff3b3b':''") && src.includes("prixEl.style.color!==cp)prixEl.style.color=cp"), "la somme de la ligne « Niveau suivant » passe en rouge (style en ligne), puis redevient normale");
assert.ok(src.includes("if(el.dataset.tmEtaLast!==String(secondesAffichees)){") && src.includes("el.textContent='Fin de la barre dans '+formaterEtaTimeMachineIdleV1_(restant);") && !src.includes("}else if(el.dataset.tmEtaLast!==String(secondesAffichees))"), "le temps restant garde son compte à rebours, sans condition d'Or");
/* Barre pleine avec un reste > 0 (niveau très court posé à 100 %) : l'Or doit être vérifié dès que le temps restant est nul, sinon « Fin de la barre dans 0s » reste affiché. */
assert.ok(src.includes("if(niveau0!==null&&restant<=0){"), "le manque d'Or est testé sur le temps restant, pas sur le reste de départ");
assert.ok(!src.includes("if(niveau0!==null&&fill0>=1&&base<=0){"), "plus de test sur base<=0 (laissait « 0s » sans vérifier l'Or)");
console.log("idle-tm-or-manquant-somme-rouge-v1 : OK");
