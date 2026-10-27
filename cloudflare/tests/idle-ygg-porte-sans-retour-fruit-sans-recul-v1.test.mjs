import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-27) : « les portes d'Yggdrasil font des rollback à l'ouverture » et « en revenant dans Yggdrasil, des fruits max rétrécissent jusqu'à redevenir un tas de terre (spoil) ».
 * Porte : une réponse en retard annonçant le fruit inactif refermait la porte pendant son ouverture ; pendant l'animation d'ouverture on ne referme plus.
 * Fruits : plus jamais d'animation de rétrécissement (4 s) : une pousse plus petite, ou un autre fruit sur la même carte, prend sa taille d'un coup (data-ygg-snap).
 */
const src = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");
const porte = src.slice(src.indexOf("function porteDe_(id,actif){"), src.indexOf("var vit=reglages_().porte;"));
assert.ok(porte.includes("if(etat.ouvre&&etat.ouvre[id]&&Date.now()-etat.ouvre[id]<DUREE_OUVERTURE_*reglages_().porte)return porte_(id,true);"), "pas de fermeture pendant l'ouverture");
assert.ok(porte.indexOf("return porte_(id,true);") < porte.indexOf("F[id]=Date.now()"), "la garde passe avant le déclenchement de la fermeture");
assert.ok(src.includes(".ygg-vitre[data-ygg-snap] .ygg-img{transition:none;}"), "transition coupée pour le rendu concerné");
assert.ok(src.includes("return Boolean(o)&&(o.id!==id||s<o.s-0.0005||f<o.f-0.0005);"), "recul de la pousse ou autre fruit sur la carte = prise de taille immédiate");
assert.ok(src.includes("snap_(pos,id,v.tier>0?Number(echelleTerre_(v)):0.14,v.tier>0?Number(echelleFruit_(v)):0)?' data-ygg-snap=\"1\"':''"), "l'attribut est posé sur la vitre");
assert.ok(src.includes("map(function(v,i){return carte_(d,v,i);})"), "la position de la carte est transmise");
console.log("idle-ygg-porte-sans-retour-fruit-sans-recul-v1: OK");
