import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-26) : « quand on fait « lire toutes les chroniques de boss » ou qu'on les reprend, entre chaque boss, le son idle/ambient/Ding.m4a ». Le lecteur des chroniques joue le ding entre deux boss (jamais après le dernier) ;
 * le serveur ne le tire jamais au hasard comme son d'ambiance.
 */
const lecteur = readFileSync("cloudflare/public/modules/lecteur-chroniques-v1.js", "utf8");
assert.ok(lecteur.includes("var CLE_DING='idle/ambient/Ding.m4a';"), "le fichier du ding");
assert.ok(lecteur.includes("/api/idle/media/ambient?key='+encodeURIComponent(CLE_DING)"), "joué par la route des sons d'ambiance");
const i = lecteur.indexOf("if(etat.index+1>=etat.file.length){etat.index+=1;terminer();return;}");
const j = lecteur.indexOf("ding(function(){", i);
assert.ok(i > 0 && j > i, "après la dernière chronique : fin sans ding ; sinon ding puis chronique suivante");
assert.ok(lecteur.includes("setTimeout(suite,4000)") && lecteur.includes("addEventListener('error',suite)"), "jamais bloqué si le son manque");

const media = readFileSync("cloudflare/src/idle-media-v1.js", "utf8");
assert.ok(media.includes('IDLE_AMBIANT_R2_PREFIX+"Ding.m4a"') && media.includes("IDLE_DING_R2_CLE_V1.toLowerCase())return false;"), "le ding n'est jamais un son d'ambiance tiré au hasard");

/* Trois tournements de page distincts dans le fichier, joués un par un, à tour de rôle (Norman, 2026-10-26). */
assert.ok(lecteur.includes("var DING_SEGMENTS=[[0.22,0.82],[1.40,1.86],[2.37,3.14]];"), "les trois tournements de page (bornes mesurées dans le fichier)");
assert.ok(lecteur.includes("function dingRang_()") && lecteur.includes("localStorage.setItem(CLE_DING_RANG,String((rang+1)%DING_SEGMENTS.length))"), "rang tournant 1, 2, 3, 1…, mémorisé");
assert.ok(lecteur.includes("a.currentTime=seg[0];") && lecteur.includes("a.pause();"), "un seul tournement par intervalle : départ au bon endroit, coupure à la fin du tournement");
console.log("idle-chroniques-ding-v1: OK");
