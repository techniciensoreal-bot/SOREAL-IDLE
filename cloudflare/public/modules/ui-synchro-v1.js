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

      /*
       * Nouvelle allocation des deux compétences d'une paire. `a` = celle qu'on a touchée, `b` = sa jumelle ({courant, cap} = niveau alloué, plafond).
       *  + : chacune reçoit l'Input ; si l'énergie libre ne suffit pas pour les deux, elle est partagée en deux parts égales (le reste de la division reste libre).
       *  − : chacune perd l'Input (jamais sous 0).
       *  Cap : chacune monte à son plafond si l'énergie libre suffit pour les deux ; sinon l'énergie libre est coupée en deux parts égales, chaque part limitée au besoin de sa
       *        barre. Le surplus reste dans l'énergie disponible.
       */
      function planSynchroBasicTrainingIdleV1_(action,a,b,libre,entree){
        const moitie=Math.floor(Math.max(0,libre)/2);
        if(action==='plus'){
          const ajout=entree*2<=libre?entree:moitie;
          return {a:a.courant+ajout,b:b.courant+ajout};
        }
        if(action==='moins'){
          return {a:Math.max(0,a.courant-entree),b:Math.max(0,b.courant-entree)};
        }
        if(action==='cap'){
          /*
           * Max rend l'énergie EN TROP (Norman, 2026-10-04 : « si j'ai mis 2000 alors que le cap est 50, Max doit me rendre l'énergie en trop et laisser ce qui est nécessaire au cap ») : une barre au-dessus de son cap
           * redescend à son cap, et l'énergie rendue peut servir à compléter sa jumelle. Une barre en dessous monte à son cap avec l'énergie libre (plus celle qui vient d'être rendue).
           */
          const rendA=Math.max(0,a.courant-a.cap);
          const rendB=Math.max(0,b.courant-b.cap);
          const dispo=Math.max(0,libre)+rendA+rendB;
          const moitieDispo=Math.floor(dispo/2);
          const besoinA=Math.max(0,a.cap-a.courant);
          const besoinB=Math.max(0,b.cap-b.courant);
          const donneA=besoinA+besoinB<=dispo?besoinA:Math.min(besoinA,moitieDispo);
          const donneB=besoinA+besoinB<=dispo?besoinB:Math.min(besoinB,moitieDispo);
          return {a:rendA>0?a.cap:a.courant+donneA,b:rendB>0?b.cap:b.courant+donneB};
        }
        return {a:a.courant,b:b.courant};
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
        call('agirProgressionSorealIdle',[SOREAL_SESSION,payload||{}])
          .then(function(res){if(typeof succes==='function')succes(res);})
          .catch(function(error){if(typeof echec==='function')echec(error);});
      }

  Object.assign(REG,{
    heureServeurIdleV1_:heureServeurIdleV1_,
    planSynchroBasicTrainingIdleV1_:planSynchroBasicTrainingIdleV1_,
    fightEnAttenteServeurIdleV1_:fightEnAttenteServeurIdleV1_,
    idleServeurOccupeV60_:idleServeurOccupeV60_,
    idleVusServeurV1_:idleVusServeurV1_,
    appelerProgressionIdleCloudflareV1_:appelerProgressionIdleCloudflareV1_
  });
})();
