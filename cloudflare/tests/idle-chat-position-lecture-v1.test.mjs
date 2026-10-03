import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-03) : « le chat doit toujours être placé de manière à ce qu'on voie les derniers messages ; il nous remet toujours en haut de la file. »
 * Le rendu complet du jeu re-monte le chat dans la page : l'élément déplacé perd son défilement. La position voulue par le joueur est retenue et rétablie.
 */
const chat = readFileSync("cloudflare/public/modules/chat-v1.js", "utf8");
assert.ok(chat.includes("let lectureBas=true;"), "par défaut : collé en bas");
assert.ok(chat.includes("const bas=garderBas===true||lectureBas;"), "décision basée sur le choix du joueur, pas sur une mesure faussée par le remontage");
assert.ok(chat.includes("liste.scrollTop=lectureHaut;"), "position de lecture rétablie quand le joueur est remonté");
assert.ok(chat.includes("addEventListener('scroll',function(){majPositionLecture(this);}"));
assert.ok(chat.includes("if(!liste||!(liste.clientHeight>0))return;"), "une liste détachée ou cachée ne change pas le choix du joueur");
assert.ok(chat.includes("lectureBas=true;/* son propre message"), "son propre message est toujours visible");
console.log("idle-chat-position-lecture-v1 OK");
