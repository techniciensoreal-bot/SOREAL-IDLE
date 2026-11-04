/*
 * Console propre (Norman, 2026-11-04 : « corrige les erreurs de console »). Seule erreur relevée en parcourant tous les menus dans Chrome : « ResizeObserver loop completed with undelivered notifications ».
 * Ce n'est pas une panne : un observateur de taille (borne, en-têtes, album…) a changé la taille d'un élément observé pendant sa propre notification ; le navigateur livre la suite à l'image suivante et le signale en « erreur ».
 * Aucun comportement à corriger (rien n'est perdu) : on empêche seulement ce message précis d'être rapporté comme une erreur, sans toucher aux autres.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_CONSOLE_PROPRE_V1__)return;
window.__SOREAL_IDLE_CONSOLE_PROPRE_V1__=true;
window.addEventListener('error',function(e){
  var m=e&&e.message?String(e.message):'';
  if(/^ResizeObserver loop (?:limit exceeded|completed with undelivered notifications)/.test(m)){e.stopImmediatePropagation();e.preventDefault();}
},true);
})();
