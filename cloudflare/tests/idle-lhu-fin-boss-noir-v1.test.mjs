import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-07) : « quand Cthulhu dit "Je te laisse, je dois chier", puis autre chose, puis part : le nouveau boss (caca flottant) ne doit apparaître que quand il est parti. L'écran de la partie du boss reste noir tant qu'il n'est pas
 * parti ; il doit être hors de l'écran 2 secondes, puis le nouveau boss apparaît et son texte est lu (il n'avait prononcé que son nom). » Et : « j'ai raccourci le tuto, il n'est plus placé aux bons endroits ».
 */
const t = fs.readFileSync("cloudflare/public/modules/tutoriel-v1.js", "utf8");
// le voile tombe dès la victoire (détection rapide), sur la carte du boss, au-dessus de la page et sous Lhu
assert.ok(t.includes("if(recordBoss_()>avant)bossNoir_(true);") && t.includes("setTimeout(sonde,120)"), "voile dès la victoire détectée (sonde toutes les 120 ms)");
assert.ok(t.includes("#sorealLhuNoirV1{position:fixed;z-index:90000;background:#000") && t.includes(".soreal-idle-boss-current-v35"), "voile noir posé sur la carte du boss (z-index sous les bulles de Lhu, 100000)");
assert.ok(/html\.'\+CLASSE_NOIR\+' #sorealIdleBossChroniqueV206\{visibility:hidden\}/.test(t), "la chronique du nouveau boss est masquée derrière le voile");
// aucune lecture automatique derrière le voile : la chronique est marquée lue, puis relue à la main au dévoilement
assert.ok(t.includes("tts.marquerChroniqueLue(id)") && t.includes("tts.readTarget(id)") && t.includes("tts.lectureCible(id)"), "chronique : marquée lue sous le voile, lue en entier au dévoilement (sans relancer une lecture en cours)");
// fin du guide : Lhu s'envole, 2 secondes, puis le nouveau boss
assert.ok(t.includes("finLhu=sc.partir()") && t.includes("programmerDevoilement_(finLhu)"), "le dévoilement part du départ de Lhu");
assert.ok(t.includes("noirMinuteur=setTimeout(devoilerBoss_,2000)") && t.includes("noirSecours=setTimeout(devoilerBoss_,15000)"), "2 secondes après son départ, filet de sécurité de 15 s");
// placement : une étape qui attend un clic sans scène fait voler Lhu près de la cible
assert.ok(/function etapeAvecPlace_\(s,e\)\{[\s\S]*scene:'place',mascotteSur:e\.mascotteSur\|\|e\.cible\.selecteur/.test(t) && t.includes("e=etapeAvecPlace_(s,e);"), "Lhu se place tout seul près de la cible d'une étape à clic sans scène");
// aucun !important ajouté
assert.ok(!/#sorealLhuNoirV1[^']*!important/.test(t), "pas de !important dans le voile");
console.log("idle-lhu-fin-boss-noir-v1: OK");
