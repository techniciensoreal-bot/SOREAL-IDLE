// Norman (2026-10-30) : (1) « quand on double tape sur le cube pour qu'il absorbe les boosts, ça ouvre sa fenêtre et ça n'absorbe pas ; ça doit ouvrir avec un simple clic mais pas avec un double » ;
// (2) « sur téléphone, je ne vois pas l'aura du cube de l'infini » (la case rognait l'ombre portée : overflow:hidden de l'icône sur téléphone).
import fs from "node:fs";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const a2 = lire("cloudflare/public/modules/ui-aventure-2-v1.js"), css = lire("cloudflare/public/soreal-idle-itopod.css");
assert.ok(a2.includes("let idleCubeOuvertureDiffereeV1=0;") && a2.includes("idleCubeOuvertureDiffereeV1=setTimeout(function(){idleCubeOuvertureDiffereeV1=0;idleCubeDernierTapMsV1=0;ouvrirDetailsCubeParGesteIdleV1_();},IDLE_ADVENTURE_DOUBLE_TAP_MS_V196+30);return;"), "avec « Double tap », le premier appui n'ouvre la fenêtre qu'après le délai du double tap");
assert.ok(a2.includes("clearTimeout(idleCubeOuvertureDiffereeV1);\n        const double=gestesAchetesIdleV1_().double;\n        if(double&&maintenant-idleCubeDernierTapMsV1<=IDLE_ADVENTURE_DOUBLE_TAP_MS_V196){idleCubeDernierTapMsV1=0;absorberTousBoostsCubeAdventureIdleV1_();return;}"), "le deuxième appui annule l'ouverture et absorbe les boosts");
assert.ok(a2.includes("        ouvrirDetailsCubeParGesteIdleV1_();\n      }\n      let idleCubeOuvertureDiffereeV1=0;"), "sans l'achat, l'appui simple ouvre tout de suite");
assert.ok(css.includes(".soreal-idle-v138-slot-cube .soreal-idle-v138-slot-icon{overflow:visible}"), "téléphone : l'icône du cube ne rogne plus son aura");
console.log("idle-cube-double-tap-aura-telephone-v1 : OK");
