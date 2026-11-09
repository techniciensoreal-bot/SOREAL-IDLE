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
  /*
   * Le menu Renaissance apparaît seul à la fin des 3 minutes (Norman, 2026-11-09 : « le menu Renaissance n'est pas apparu après 3 minutes ; il est apparu quand j'ai cliqué sur un menu »). Le menu n'existe que quand l'état du moteur dit « renaissance.debloquee » ; ce
   * drapeau n'est recalculé que par une synchro, et aucune n'était demandée à l'instant où l'horloge du run atteint 180 s : il fallait qu'un clic en provoque une. Ici : dès que le boss requis est vaincu, que le menu n'est pas encore là et que l'horloge du run (celle du bandeau,
   * heure du serveur) a passé 180 s, une synchro est demandée, au plus une toutes les 2,5 s tant que le moteur ne confirme pas (il compte avec la même horloge) ; la synchro suivante change l'empreinte des menus et le menu apparaît tout de suite. Aucune lecture de la page.
   */
  var MIN_REBIRTH_S=180,derniereSync=0;
  function menuAttendu(){
    if(document.hidden)return;
    var hote=window.__SOREAL_IDLE_META_HOST_V130__,api=window.__SOREAL_IDLE_TIME_FORMAT_V1__;
    if(!hote||typeof hote.getIdleEtat!=='function'||!api||typeof api.runSecondes!=='function')return;
    var j=hote.getIdleEtat(),r=j&&j.renaissance;
    if(!r||r.debloquee||r.aventureRequise)return;
    if(api.runSecondes(j)<MIN_REBIRTH_S)return;
    var maintenant=Date.now();
    if(maintenant-derniereSync<2500)return;
    derniereSync=maintenant;
    try{var reg=window.__SOREAL_IDLE_REG__;if(reg&&typeof reg.synchroniserJeuIdleV7_==='function')reg.synchroniserJeuIdleV7_(true);}catch(_e){}
  }
  setInterval(maj,1000);
  setInterval(menuAttendu,1000);
  window.__SOREAL_IDLE_TEMPS_REBIRTH_V1__={maj:maj,menuAttendu:menuAttendu};
})();
