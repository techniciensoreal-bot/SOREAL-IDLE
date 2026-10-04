import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : « le chat de SOREAL IDLE met longtemps avant d'envoyer mon message ». Le serveur traite les requêtes une par une : le message attendait derrière les synchros. Il s'affiche maintenant au clic
 * (bulle « envoi… »), le champ se vide, et le texte revient seulement si le serveur refuse.
 */
const chat = readFileSync("cloudflare/public/modules/chat-v1.js", "utf8");
const envoyer = chat.slice(chat.indexOf("  function envoyer(){"), chat.indexOf("  function supprimerMessage(id){"));
// Avant l'appel serveur : bulle en attente + champ vidé + rendu immédiat.
const iAppel = envoyer.indexOf("appel('envoyerChatSorealIdle'");
assert.ok(iAppel > 0);
const avant = envoyer.slice(0, iAppel);
assert.ok(avant.includes("enAttente={message:message,idServeur:0};") && avant.includes("champ.value='';") && avant.includes("rendreMessages(true);"), "affichage et vidage du champ AVANT la réponse du serveur");
// Réponse : on retient l'identifiant du vrai message pour ne pas l'afficher deux fois ; une relecture ratée n'annule pas l'envoi.
assert.ok(envoyer.includes("enAttente.idServeur=Number(res.id)||0;") && envoyer.includes("return chargerRecents().catch(function(){});"));
// Refus ou échec : la bulle disparaît et le texte revient dans le champ.
assert.ok(envoyer.includes("enAttente=null;\n      if(!champ.value)champ.value=message;"));
// Rendu : la bulle suit les vrais messages, disparaît dès que le vrai message est arrivé.
assert.ok(chat.includes("!(enAttente.idServeur&&items.some(function(it){return it.id===enAttente.idServeur;}))?htmlEnAttente(enAttente):''"));
assert.ok(chat.includes("liste.innerHTML=htmlListeMessages();"));
// La bulle est visuellement distincte (estompée, « envoi… ») et n'est jamais comptée comme un message non lu ni envoyée au flux.
assert.ok(chat.includes('class="sic-msg moi sic-attente"') && chat.includes('envoi…'));
console.log("idle-chat-envoi-instantane-v1: OK");
