/*
 * SOREAL IDLE — Synchronisation avec le serveur (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_synchro_v1)return;
  REG.__chargé_ui_synchro_v1=true;



      /* Heure du SERVEUR (Norman, 2026-10-03 : « tous les compteurs doivent être très précis ») : les échéances (cooldowns, Money Pit, Daily Spin, début de run) sont des dates du serveur, jamais à comparer à l'horloge du téléphone. */
      function heureServeurIdleV1_(){
        return typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now();
      }

      function fightEnAttenteServeurIdleV1_(){
        return Boolean(
          REG.idleVictoireBossLocaleV49||
          REG.idlePrevisionBossV1.actif||
          REG.idleCombatLotEnVolV1||
          REG.idleFastPendingV60.combat!==null
        );
      }

      function idleServeurOccupeV60_(
        resOuErreur
      ){
        const code=
          String(
            resOuErreur &&
            resOuErreur.code || ''
          );

        const message=
          String(
            resOuErreur &&
            resOuErreur.message ||
            resOuErreur ||
            ''
          );

        return Boolean(
          code==='SOREAL_IDLE_OCCUPE' ||
          /occupé|occupe|SOREAL_IDLE_OCCUPE/i
            .test(message)
        );
      }

      function idleVusServeurV1_(j){
        const stats=j&&j.profil&&j.profil.stats;
        return Array.isArray(stats&&stats.vus)?stats.vus:[];
      }

      function appelerProgressionIdleCloudflareV1_(payload,succes,echec){
        const call=window.__SOREAL_IDLE_CALL_V1__;
        if(typeof call!=='function'){
          if(typeof echec==='function')echec(new Error('Transport Cloudflare IDLE indisponible.'));
          return;
        }
        /* Dernier filet (revue de tous les menus, 2026-11-05) : toute action qui arrête, démarre ou redistribue une production part avec l'instant du clic ; posé plus tôt par le menu quand il le peut (clientAt), ici au plus tard à l'envoi. */
        if(payload&&typeof payload==='object'&&payload.clientAt===undefined&&/^(allocate|clear[A-Za-z]*Allocations$|reclaimResource$|toggle$|toggleDigger$|setDiggerLevel$|selectRitual$|selectTrack$)/.test(String(payload.action||'')))payload=Object.assign({},payload,{clientAt:typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now()});
        call('agirProgressionSorealIdle',[SOREAL_SESSION,payload||{}])
          .then(function(res){if(typeof succes==='function')succes(res);})
          .catch(function(error){if(typeof echec==='function')echec(error);});
      }

  Object.assign(REG,{
    heureServeurIdleV1_:heureServeurIdleV1_,
    fightEnAttenteServeurIdleV1_:fightEnAttenteServeurIdleV1_,
    idleServeurOccupeV60_:idleServeurOccupeV60_,
    idleVusServeurV1_:idleVusServeurV1_,
    appelerProgressionIdleCloudflareV1_:appelerProgressionIdleCloudflareV1_
  });
})();
