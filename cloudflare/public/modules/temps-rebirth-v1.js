/*
 * SOREAL IDLE — case « Rebirth » du bandeau du haut (Norman, 2026-10-24) : le temps écoulé depuis le début du Rebirth en cours (jours, heures, minutes, secondes), tenu à jour chaque seconde.
 * La case est dessinée par resumeStatsIdleV28_ (ui-aventure-1-v1.js) seulement quand le menu Renaissance est découvert ; ce module n'écrit que son texte, d'après l'état du jeu et l'heure du serveur (jamais lue dans la page).
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_TEMPS_REBIRTH_V1__)return;
  function maj(){
    if(document.hidden)return;
    var el=document.getElementById('sorealIdleSummaryRebirthTempsV1');
    if(!el)return;
    var api=window.__SOREAL_IDLE_TIME_FORMAT_V1__,hote=window.__SOREAL_IDLE_META_HOST_V130__;
    if(!api||typeof api.runSecondes!=='function'||!hote||typeof hote.getIdleEtat!=='function')return;
    var texte=api.duree(api.runSecondes(hote.getIdleEtat()));
    if(el.textContent!==texte)el.textContent=texte;
  }
  setInterval(maj,1000);
  window.__SOREAL_IDLE_TEMPS_REBIRTH_V1__={maj:maj};
})();
