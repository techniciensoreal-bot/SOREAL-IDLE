import assert from "node:assert/strict";
import fs from "node:fs";
const lire = (p) => fs.readFileSync(new URL("../public/" + p, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const audio = lire("modules/audio-effects-v199.js"), ui = lire("soreal-idle-ui.js");
/*
 * Norman (2026-10-15) : pas de réglage de sons de défaite pour les joueurs ; le jeu tire au hasard parmi les sons RETENUS : l'ancien, le trombone triste, le glas, le game over d'arcade, le disque qui s'arrête, la toccata
 * sinistre et l'orgue de foire triste. Les autres propositions (orgue de cathédrale, boîte à musique qui ralentit, fanfare funèbre, gong) servent de sons d'apparition de boss.
 */
const bloc = audio.slice(audio.indexOf("  var SONS_DEFAITE=["), audio.indexOf("  ];\n", audio.indexOf("  var SONS_DEFAITE=[")));
assert.deepEqual([...bloc.matchAll(/\{nom:"([a-z-]+)",libelle:/g)].map((m) => m[1]), ["elegie", "trombone", "glas", "arcade", "vinyle", "orgue-toccata", "orgue-foraine"], "sons de défaite retenus");
assert.ok(bloc.includes('{nom:"elegie",libelle:"Élégie (le son d’origine)",duree:1900,construire:defaiteConstruire_}'), "l'ancien son est inchangé");
for (const retire of ["defaiteCordeConstruire_", "defaiteOrgueConstruire_", "defaiteBallonConstruire_", "defaiteTambourConstruire_", "defaiteVerreConstruire_", "CANDIDATS_DEFAITE", "defeatCandidates"]) assert.ok(!audio.includes(retire), "écarté : " + retire);
const boss = audio.slice(audio.indexOf("  var SONS_BOSS=["), audio.indexOf("  ];\n", audio.indexOf("  var SONS_BOSS=[")));
for (const n of ["cathedrale", "boite-lente", "fanfare-funebre", "gong"]) assert.ok(boss.includes('{nom:"' + n + '",duree:'), "son d'apparition de boss : " + n);
assert.equal((boss.match(/\{nom:"/g) || []).length, 14, "dix sons d'apparition de boss d'origine + quatre");
assert.ok(audio.includes("function choisirSonDefaite_()") && audio.includes("x.nom!==dernierSonDefaite") && audio.includes("function defaite_(){\n    var son=choisirSonDefaite_();"), "tirage au hasard, jamais deux fois le même de suite");
assert.ok(!audio.includes("defeatSelection") && !audio.includes("setDefeatSelection") && !audio.includes("CLE_DEFAITES"), "aucune sélection par le joueur");
assert.ok(audio.includes("previewDefeat:ecouterDefaite_"), "écoute possible (développement)");
/* Réglages : section seulement en mode développement, sans case qui change le jeu */
const sec = ui.slice(ui.indexOf("function htmlReglagesSonsDefaiteIdleV1_(){"), ui.indexOf("/* Effets visuels (Norman, 2026-10-08)"));
assert.ok(sec.includes("if(!idlePartieDevV1||!idlePartieDevV1.actif") && sec.includes("return '';") && !sec.includes('type="checkbox"'), "section réservée au développement, écoute seulement");
assert.ok(ui.includes("htmlReglagesSonsDefaiteIdleV1_()+"), "section posée dans les Réglages");
console.log("idle-sons-defaite-choix-v1: OK");
