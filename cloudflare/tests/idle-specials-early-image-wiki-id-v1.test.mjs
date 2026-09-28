import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-09-28) : « J'ai ajouté Item_0432_Tuba_of_Time.webp dans items sur le R2. Mais l'image
 * n'est pas prise en compte. Il faut que le jeu cherche les items par ID. »
 *
 * Cause : item-specials-early-v75.js construisait l'URL média avec seulement `set`+`name=<id SOREAL
 * camelCase, ex. tubaTime>`, jamais `wikiItemId` — alors que le moteur transporte déjà wikiItemId=432
 * pour Tuba of Time (idle-adventure-v47.js, IDLE_ADVENTURE_WIKI_ITEM_IDS_V1.tubaTime, couvert par
 * idle-wiki-item-ids.test.mjs) et que le Worker média (itemSet_, idle-media-v1.js) sait déjà
 * prioriser une résolution par wikiItemId exact sur la résolution floue par nom (choisirObjetItemR2ParId_
 * avant choisirObjetItemR2_). `name` reste transmis tel quel (l'id camelCase, jamais le vrai nom NGU
 * espacé : paramItemR2_ rejette toute valeur contenant un espace) — seul un ajout de wikiItemId suffit,
 * aucun changement serveur nécessaire.
 */
const source=fs.readFileSync("cloudflare/public/modules/item-specials-early-v75.js","utf8");

assert.match(source,/function urlImage_\(id,objet\)\{/,"urlImage_ doit recevoir l'objet pour lire son wikiItemId");
assert.match(source,/if\(wikiItemId\)p\.set\('wikiItemId',String\(wikiItemId\)\);/,"l'URL doit transporter wikiItemId quand il est connu");
assert.match(source,/var url=urlImage_\(id,objet\);/,"installer_ doit transmettre l'objet réel à urlImage_");

const vm=await import("node:vm");
const window={};
const document={querySelector(){return null;},querySelectorAll(){return [];},getElementById(){return null;},head:{appendChild(){}},createElement(){return {classList:{add(){},remove(){}},addEventListener(){},dataset:{}};},addEventListener(){},readyState:"complete"};
vm.runInNewContext(source,{window,document,URLSearchParams,setTimeout,clearTimeout});

const urlImage=window.__SOREAL_IDLE_SPECIAL_EARLY_IMAGES_V75_TEST__.urlImage;

// Cas réel de Norman : Tuba of Time, wikiItemId=432 transporté par l'objet du moteur.
const urlAvecId=urlImage("tubaTime",{definitionId:"tubaTime",name:"Tuba of Time",wikiItemId:432});
assert.ok(urlAvecId.includes("wikiItemId=432"),"Tuba of Time doit résoudre son image par wikiItemId=432 : "+urlAvecId);
assert.ok(urlAvecId.includes("set=specials-early"),"le pack specials-early doit rester transmis");
assert.ok(urlAvecId.includes("name=tubaTime"),"name reste l'id SOREAL (jamais le vrai nom espacé, rejeté par le serveur)");

// Objet sans wikiItemId connu (ex. ancien snapshot, ou special non encore mappé) : repli sans le paramètre.
const urlSansId=urlImage("tubaTime",{definitionId:"tubaTime",name:"Tuba of Time"});
assert.ok(!urlSansId.includes("wikiItemId"),"sans wikiItemId sur l'objet, ne pas envoyer de paramètre vide/faux");

console.log("idle-specials-early-image-wiki-id-v1: OK");
