import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-25) : « Je t'ai demandé de ne pas montrer plusieurs fois les popups quand on les a déjà vus. Mais il faut qu'on soit considéré
 * comme un nouveau joueur quand on reset la partie : à ce moment, il faut qu'on les voit une fois de nouveau. »
 * Le serveur efface déjà la ligne du joueur (donc profil.stats.vus) ; côté page, la mémoire des « vus » et les caches locaux doivent l'être aussi.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const debut = ui.indexOf("function idleVusOublierV1_(){");
const fin = ui.indexOf("function idleVuMarquerV1_(id){");
assert.ok(debut > 0 && fin > debut);
const src = ui.slice(debut, fin);

const stockage = {
  soreal_idle_menus_ack_v1_J001: "[]",
  "soreal_idle_bienvenue_v75_J001|2026": "true",
  "soreal_idle_tutoriel_debut_v1_x": "true",
  soreal_idle_tutoriel_aventure_v1_J001: "true",
  sorealIdleAutoAventureV30: "1",
  soreal_idle_info_ouvert_v1: "1"
};
const localStorage = {
  removeItem: (k) => { delete stockage[k]; }
};
Object.defineProperty(localStorage, "length", { get: () => Object.keys(stockage).length });
const fabrique = new Function("localStorage", "Object2", `
  const idleVusMemoireV1={bienvenue:true,'menu:aventure':true,'tuto:tutoriel_aventure':true};
  let idleVusEnAttenteV1=['menu:x'];
  let idleVusMigreV1='J001|2026';
  const Object=Object2;
  ${src}
  return {oublier:idleVusOublierV1_,etat:()=>({memoire:{...idleVusMemoireV1},attente:idleVusEnAttenteV1,migre:idleVusMigreV1})};
`);
// Object.keys(localStorage) doit lister les clés : on branche un proxy dédié
const proxy = new Proxy(localStorage, { ownKeys: () => Object.keys(stockage), getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }) });
const Objet = Object.assign(Object.create(Object), Object, { keys: (o) => (o === proxy ? Object.keys(stockage) : Object.keys(o)) });
const api = fabrique(proxy, Objet);
api.oublier();
const etat = api.etat();
assert.deepEqual(etat.memoire, {}, "la mémoire des « vus » de la page est vidée");
assert.deepEqual(etat.attente, [], "plus rien en attente d'envoi");
assert.equal(etat.migre, "", "la migration du stockage local sera refaite pour la nouvelle partie");
assert.deepEqual(Object.keys(stockage).sort(), ["sorealIdleAutoAventureV30", "soreal_idle_info_ouvert_v1"].sort(), "seuls les caches de « vus » sont retirés (préférences conservées)");

// Câblage : appelé au succès du reset total, avant de recréer le personnage
const reset = ui.slice(ui.indexOf("function envoyerResetTotalIdleV67_"), ui.indexOf("function executerResetTotalIdleV67_"));
assert.ok(reset.indexOf("idleVusOublierV1_();") > 0 && reset.indexOf("idleVusOublierV1_();") < reset.indexOf("idleEtat=null;"));

console.log("idle-reset-forgets-seen-popups-v1: OK");
