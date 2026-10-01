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
var LISTE=[
  {id:'pere-de-bohort',nom:'Père de Bohort',genre:'homme'},
  {id:'asmr',nom:'ASMR',genre:'homme'},
  {id:'realiste-femme',nom:'Réaliste femme',genre:'femme'},
  {id:'lecteur',nom:'Lecteur',genre:'homme'},
  {id:'marseille',nom:'Marseille',genre:'homme'},
  {id:'pd',nom:'PD',genre:'homme'},
  {id:'cool',nom:'Cool',genre:'homme'},
  {id:'gogole',nom:'Gogole',genre:'homme'},
  {id:'vieille',nom:'Vieille',genre:'femme'},
  {id:'jeune-vieille',nom:'Jeune vieille',genre:'femme'},
  {id:'folle-2',nom:'Folle 2',genre:'femme'}
];
window.__SOREAL_IDLE_VOIX_NOMMEES_V1__={
  liste:LISTE,
  existe:function(id){return LISTE.some(function(v){return v.id===id;});},
  genre:function(id){var v=LISTE.filter(function(x){return x.id===id;})[0];return v?v.genre:(id==='femme'?'femme':'homme');}
};
})();
