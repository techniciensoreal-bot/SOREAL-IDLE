/*
 * SOREAL IDLE — registre des voix nommées des histoires (Norman, 2026-10-01 : « plusieurs voix différentes parmi un large éventail »).
 *
 * Chaque voix est un extrait de référence FRANÇAIS que le studio de voix local (Chatterbox) imite : le fichier voix/<identifiant>.wav du studio.
 * Extraits : jeu de données CML-TTS (licence CC BY 4.0, via kyutai/tts-voices) -- à citer dans les crédits.
 * Dans un texte d'histoire, la balise « (identifiant) » fait lire ce qui suit par cette voix, comme « (femme) » / « (homme) ».
 * genre : voix de repli (Piper) quand la voix du studio n'a pas été générée. Ajouter une voix = ajouter une ligne ici + déposer son extrait
 * (voir cloudflare/tools/voice-studio/installer_voix_nommees.py).
 *
 *   window.__SOREAL_IDLE_VOIX_NOMMEES_V1__ = { liste:[{id,nom,genre}], existe(id), genre(id) }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_VOIX_NOMMEES_V1__)return;
/*
 * Noms courts (Norman, 2026-10-01 : « (Père de Bohort) ne fonctionne pas, Gogole non plus : des noms plus courts qui fonctionnent »). Dans le texte,
 * la balise est reconnue sans tenir compte des majuscules, des accents, des espaces et des tirets : « (Bohort) », « (bohort) », « (BOHORT) » sont
 * identiques. Les anciens identifiants et anciens noms restent acceptés (alias) : les histoires déjà écrites continuent de fonctionner.
 */
var LISTE=[
  {id:'bohort',nom:'Bohort',genre:'homme',alias:['pere-de-bohort','Père de Bohort']},
  {id:'asmr',nom:'ASMR',genre:'homme',alias:[]},
  {id:'lea',nom:'Léa',genre:'femme',alias:['realiste-femme','Réaliste femme']},
  {id:'lecteur',nom:'Lecteur',genre:'homme',alias:[]},
  {id:'marius',nom:'Marius',genre:'homme',alias:['marseille','Marseille']},
  {id:'dandy',nom:'Dandy',genre:'homme',alias:['pd','PD']},
  {id:'cool',nom:'Cool',genre:'homme',alias:[]},
  {id:'niais',nom:'Niais',genre:'homme',alias:['gogole','Gogole']},
  {id:'vieille',nom:'Vieille',genre:'femme',alias:[]},
  {id:'mamie',nom:'Mamie',genre:'femme',alias:['jeune-vieille','Jeune vieille']},
  {id:'folle',nom:'Folle',genre:'femme',alias:['folle-2','Folle 2']}
];
function normaliser(t){
  return String(t==null?'':t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
}
var PAR_NOM={};
LISTE.forEach(function(v){
  PAR_NOM[normaliser(v.id)]=v.id;
  PAR_NOM[normaliser(v.nom)]=v.id;
  (v.alias||[]).forEach(function(a){PAR_NOM[normaliser(a)]=v.id;});
});
window.__SOREAL_IDLE_VOIX_NOMMEES_V1__={
  liste:LISTE,
  /* Identifiant canonique d'une voix nommée à partir d'un identifiant, d'un nom ou d'un ancien alias (« » si inconnue). */
  resoudre:function(t){return PAR_NOM[normaliser(t)]||'';},
  existe:function(id){return LISTE.some(function(v){return v.id===id;});},
  genre:function(id){var v=LISTE.filter(function(x){return x.id===id;})[0];return v?v.genre:(id==='femme'?'femme':'homme');}
};
})();
