import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-05) : « en combat de boss, ma vie diminue de plus en plus lentement, s'arrête, puis remonte malgré le combat quand la régénération est plus forte que les coups de l'ennemi. Ça n'arrive jamais : la barre reste
 * statique et ne remonte qu'à la fin du combat. » Cause : les dégâts nets étaient bornés à 0 (régén − coups < 0 = « rien »), sans jamais soigner. Client et serveur appliquent maintenant le soin net pendant le combat.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const bloc = ui.slice(ui.indexOf("            if(degatsJoueur>0){\n              idleCombatLogDegatsBossV70+="), ui.indexOf("            if(\n              idleEtat.pvJoueur<=0\n            ){"));
assert.ok(bloc.includes("}else if(regenPvSecJoueurBossV1>recus){") && bloc.includes("(regenPvSecJoueurBossV1-recus)*dt") && bloc.includes("idleNombre_(idleEtat.pvJoueurMax)"), "client : la vie remonte pendant le combat, plafonnée aux PV max");
const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
assert.ok(rt.includes("const soinJoueurSec =") && rt.includes("if(soinJoueurSec>0&&pvJoueur>0){") && rt.includes("pvJoueur+segment*soinJoueurSec"), "serveur : même soin net pendant la simulation du combat");
// Même formule des deux côtés : soin = régénération (défense / 20) − coups reçus.
assert.ok(ui.includes("regenPvFightBossNguParSecondeV164_(defense)") && rt.includes("regenPvSecJoueur -\n        degatsRecusSec"));
// Une régénération plus faible ne soigne jamais : le chemin des dégâts nets est inchangé.
assert.ok(rt.includes("degatsRecusSec =\n      Math.max(\n        0,\n        degatsRecusSec -\n        regenPvSecJoueur\n      );"));
console.log("idle-regen-superieure-aux-coups-v1: OK");
