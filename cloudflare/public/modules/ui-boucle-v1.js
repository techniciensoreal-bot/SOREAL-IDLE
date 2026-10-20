/*
 * SOREAL IDLE — Boucle de jeu locale (tick, expérience, effets visuels) (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_boucle_v1)return;
  REG.__chargé_ui_boucle_v1=true;

  function idleNombre_(){return REG.idleNombre_.apply(null,arguments);}
  function totalAllocationBasicTrainingIdleV120_(){return REG.totalAllocationBasicTrainingIdleV120_.apply(null,arguments);}
  function allocationMetaEnergieIdleV1_(){return REG.allocationMetaEnergieIdleV1_.apply(null,arguments);}
  function progresserBasicTrainingLocalIdleV120_(){return REG.progresserBasicTrainingLocalIdleV120_.apply(null,arguments);}
  function patcherResumeStatsIdleV28_(){return REG.patcherResumeStatsIdleV28_.apply(null,arguments);}
  function progresserZoneFightLocalIdleV1_(){return REG.progresserZoneFightLocalIdleV1_.apply(null,arguments);}
  function metaTickEnergieIdleV114_(){return REG.metaTickEnergieIdleV114_.apply(null,arguments);}
  function allocationMetaMagieIdleV1_(){return REG.allocationMetaMagieIdleV1_.apply(null,arguments);}
  function metaTickMagieIdleV1_(){return REG.metaTickMagieIdleV1_.apply(null,arguments);}
  function texteMagieGenereeIdleV1_(){return REG.texteMagieGenereeIdleV1_.apply(null,arguments);}
  function formatEnergieIdleV50_(){return REG.formatEnergieIdleV50_.apply(null,arguments);}
  function actualiserManaSortsIdleV90_(){return REG.actualiserManaSortsIdleV90_.apply(null,arguments);}
  function actualiserCooldownBossIdleV100_(){return REG.actualiserCooldownBossIdleV100_.apply(null,arguments);}
  function actualiserCooldownAventureIdleV100_(){return REG.actualiserCooldownAventureIdleV100_.apply(null,arguments);}
  function heureServeurIdleV1_(){return REG.heureServeurIdleV1_.apply(null,arguments);}
  function assurerPisteMagicTimeMachineIdleV1_(){return REG.assurerPisteMagicTimeMachineIdleV1_.apply(null,arguments);}
  function actualiserCompteReboursTimeMachineIdleV1_(){return REG.actualiserCompteReboursTimeMachineIdleV1_.apply(null,arguments);}
  function regenPvFightBossNguParSecondeV164_(){return REG.regenPvFightBossNguParSecondeV164_.apply(null,arguments);}
  function rafraichirCommandesFightBossIdleV167_(){return REG.rafraichirCommandesFightBossIdleV167_.apply(null,arguments);}
  function texteEnergieGenereeIdleV1_(){return REG.texteEnergieGenereeIdleV1_.apply(null,arguments);}
  function energieDisponibleIdleV9_(){return REG.energieDisponibleIdleV9_.apply(null,arguments);}
  function formatEntierLisibleIdleV1_(){return REG.formatEntierLisibleIdleV1_.apply(null,arguments);}
  function synchroniserJeuIdleV7_(){return REG.synchroniserJeuIdleV7_.apply(null,arguments);}
  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function formatGrandNombreIdleV70_(){return REG.formatGrandNombreIdleV70_.apply(null,arguments);}
  function appliquerAugmentsSurCombatIdleV1_(){return REG.appliquerAugmentsSurCombatIdleV1_.apply(null,arguments);}
  function appliquerTrajectoireStatsIdleV1_(){return REG.appliquerTrajectoireStatsIdleV1_.apply(null,arguments);}
  function rafraichirMenuRacineIdleV28_(){return REG.rafraichirMenuRacineIdleV28_.apply(null,arguments);}
  function texteNiveauParSecondeIdleV1_(){return REG.texteNiveauParSecondeIdleV1_.apply(null,arguments);}
  function traiterCapacitesBossLocalesIdleV70_(){return REG.traiterCapacitesBossLocalesIdleV70_.apply(null,arguments);}
  function degatsNetsBossParSecondeIdleV1_(){return REG.degatsNetsBossParSecondeIdleV1_.apply(null,arguments);}
  function jouerEffetAudioIdleV199_(){return REG.jouerEffetAudioIdleV199_.apply(null,arguments);}
  function ajouterLogCombatIdleV70_(){return REG.ajouterLogCombatIdleV70_.apply(null,arguments);}
  function texteCombatIdleV121_(){return REG.texteCombatIdleV121_.apply(null,arguments);}
  function formaterPvFixeIdleV1_(){return REG.formaterPvFixeIdleV1_.apply(null,arguments);}
  function largeurBarreVieCombatIdleV163_(){return REG.largeurBarreVieCombatIdleV163_.apply(null,arguments);}
  function transitionMortBossIdleV61_(){return REG.transitionMortBossIdleV61_.apply(null,arguments);}
  function appliquerBossSuivantLocalIdleV1_(){return REG.appliquerBossSuivantLocalIdleV1_.apply(null,arguments);}
  function surveillerConfirmationVictoireBossIdleV1_(){return REG.surveillerConfirmationVictoireBossIdleV1_.apply(null,arguments);}
  function envoyerAllocationsBasicTrainingIdleV120_(){return REG.envoyerAllocationsBasicTrainingIdleV120_.apply(null,arguments);}
  function ajouterActionRapideIdleV60_(){return REG.ajouterActionRapideIdleV60_.apply(null,arguments);}
  function snapshotCombatFightBossIdleV173_(){return REG.snapshotCombatFightBossIdleV173_.apply(null,arguments);}
  function formatNombreCombatIdleV100_(){return REG.formatNombreCombatIdleV100_.apply(null,arguments);}
  function majHudPvIdleV2_(){return REG.majHudPvIdleV2_.apply(null,arguments);}
  function actualiserAmbianceCombatIdleV1_(){return REG.actualiserAmbianceCombatIdleV1_.apply(null,arguments);}
  function actualiserDisponibiliteMoneyPitNavIdleV1_(){return REG.actualiserDisponibiliteMoneyPitNavIdleV1_.apply(null,arguments);}
  function aventureMetaIdleV47_(){return REG.aventureMetaIdleV47_.apply(null,arguments);}
  function poserNoteCombatAdventureIdleV1_(){return REG.poserNoteCombatAdventureIdleV1_.apply(null,arguments);}
  function texteProchainCombatAdventureIdleV165_(){return REG.texteProchainCombatAdventureIdleV165_.apply(null,arguments);}
  function rendreIdleEtat_(){return REG.rendreIdleEtat_.apply(null,arguments);}
  function largeurBarreCombatIdleV121_(){return REG.largeurBarreCombatIdleV121_.apply(null,arguments);}
  function idleFastPendingV60_(){return REG.idleFastPendingV60_.apply(null,arguments);}
  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function gererPopupsProgressionIdleV75_(){return REG.gererPopupsProgressionIdleV75_.apply(null,arguments);}
  function gererTutorielPremierBossIdleV1_(){return REG.gererTutorielPremierBossIdleV1_.apply(null,arguments);}

      let idleTimerEnergie=null;

      let idleAnimationFrameJeuV214=0;

      let idleTimerJeuArrierePlanV1=0;

      function coupsDusIdleV116_(
        maintenant,
        prochain,
        intervalle
      ){
        if(!prochain||maintenant<prochain){
          return {
            nombre:0,
            prochain:prochain
          };
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-9 */
        const nombre=
          Math.max(
            1,
            Math.min(
              4,
              1+
              Math.floor(
                (maintenant-prochain)/
                intervalle
              )
            )
          );

        return {
          nombre:nombre,
          prochain:
            prochain+
            nombre*intervalle
        };
      }

      const idleRepereVisuelsV1_={};

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-26 */
      let idleDernierTickBasicTrainingV166=Date.now();

      const IDLE_BASIC_TRAINING_RATTRAPAGE_MAX_MS_V166=12*60*60*1000;

      /*
       * Norman (2026-09-29) : « La barre de magie doit avoir le même comportement [au compte-goutte
       * que l'énergie]. » L'énergie avance localement tick par tick (idleEtat.energie, ci-dessus)
       * entre deux synchronisations serveur -- la Magie, elle, ne lisait QUE l'instantané serveur
       * (idleEtat.systemes.resources.magic.current), repeint identique à 15 Hz jusqu'à la prochaine
       * synchro (~15s) : aucun mouvement visible entre les deux, un vrai bond d'un coup à chaque
       * synchro plutôt qu'un remplissage progressif. Même horloge de reste de tick que l'Énergie,
       * dédiée à la Magie.
       */
      let idleResteTickMagieMsV1=0;

      /* Étape extraite de mettreAJourJeuIdleLocalV7_ (découpage d'une très grande fonction, 2026-10-16) : 30 lignes. */
      function mettreAJourJeuIdleLocalV7__p1(energieAvantTick, max, metaTickEnergie, ticksEnergie){
        if(ticksEnergie>0){
          REG.idleResteTickEnergieMsV114=
            Math.max(
              0,
              REG.idleResteTickEnergieMsV114-
              ticksEnergie*
              metaTickEnergie.dureeMs
            );

          REG.idleEtat.energie=
            Math.min(
              max,
              Math.floor(
                energieAvantTick+
                ticksEnergie*
                metaTickEnergie.gain+
                1e-9
              )
            );

          if(idleNombre_(REG.idleEtat.energie)>=max){
            REG.idleResteTickEnergieMsV114=0;
          }
        }else{
          REG.idleEtat.energie=
            Math.floor(
              energieAvantTick+
              1e-9
            );
        }
      }

      /* Étape extraite de mettreAJourJeuIdleLocalV7_ (découpage d'une très grande fonction, 2026-10-16) : 119 lignes. */
      function mettreAJourJeuIdleLocalV7__p2(ecouleTickMs){
        {
          const ressourceMagieEtat=
            REG.idleEtat.systemes&&REG.idleEtat.systemes.resources&&REG.idleEtat.systemes.resources.magic;
          const budgetMagieEtat=
            REG.idleEtat.systemes&&REG.idleEtat.systemes.resourceBudget&&REG.idleEtat.systemes.resourceBudget.magic;
          const infoMagieEtat=
            REG.idleEtat.systemes&&REG.idleEtat.systemes.resourceInfo&&REG.idleEtat.systemes.resourceInfo.magic;

          if(ressourceMagieEtat&&budgetMagieEtat&&infoMagieEtat){
            /*
             * Plafond local de la Magie (bug d'un joueur, 2026-10-16 : « il générait plus de magie que son maximum, réglé par un refresh »). freeCapacity vient de la dernière synchro : si le plafond
             * baisse ou si de la Magie est placée depuis (allocation), current+freeCapacity est périmé et la Magie dépassait le maximum jusqu'à la synchro suivante. Le plafond est donc aussi borné
             * par le plafond de la run moins la Magie placée MAINTENANT (même calcul que le serveur : cap - allocation - réservé) ; la valeur ne dépasse jamais ce plafond.
             */
            const capMagieTickEtat=idleNombre_(infoMagieEtat.capRun);
            const plafondMagieDirect=capMagieTickEtat>0
              ?Math.max(0,capMagieTickEtat-allocationMetaMagieIdleV1_()-Math.max(0,idleNombre_(budgetMagieEtat.reservedExternal)))
              :Infinity;
            if(Number.isFinite(plafondMagieDirect)&&idleNombre_(ressourceMagieEtat.current)>plafondMagieDirect){
              ressourceMagieEtat.current=Math.floor(plafondMagieDirect+1e-9);
            }
            const magieAvantTick=
              Math.max(0,idleNombre_(ressourceMagieEtat.current));

            const maxLocalMagie=
              Math.min(
                plafondMagieDirect,
                Math.max(
                  magieAvantTick,
                  magieAvantTick+idleNombre_(budgetMagieEtat.freeCapacity)
                )
              );

            const magieAuPlafond=magieAvantTick>=maxLocalMagie;

            if(magieAuPlafond){
              idleResteTickMagieMsV1=0;
            }else{
              idleResteTickMagieMsV1+=ecouleTickMs;
            }

            const metaTickMagie=metaTickMagieIdleV1_();

            const ticksMagie=
              magieAuPlafond
                ?0
                :Math.max(
                    0,
                    Math.floor(
                      (idleResteTickMagieMsV1+1e-7)/
                      metaTickMagie.dureeMs
                    )
                  );

            if(ticksMagie>0){
              idleResteTickMagieMsV1=
                Math.max(
                  0,
                  idleResteTickMagieMsV1-
                  ticksMagie*metaTickMagie.dureeMs
                );

              ressourceMagieEtat.current=
                Math.min(
                  maxLocalMagie,
                  Math.floor(
                    magieAvantTick+
                    ticksMagie*metaTickMagie.gain+
                    1e-9
                  )
                );

              if(idleNombre_(ressourceMagieEtat.current)>=maxLocalMagie){
                idleResteTickMagieMsV1=0;
              }
            }else{
              ressourceMagieEtat.current=
                Math.floor(
                  magieAvantTick+
                  1e-9
                );
            }

            /*
             * Norman (2026-09-30) : « La magie ne monte pas progressivement comme l'énergie. Elle
             * monte par 20 tous les x secondes. » La valeur (ressourceMagieEtat.current ci-dessus)
             * avançait déjà correctement au compte-goutte, tick par tick -- mais rien dans CE tick
             * ne poussait cette valeur vers la barre/le texte affichés : seule
             * rafraichirEnergieEtBoutonsIdleV9_() les mettait à jour, jamais appelée depuis la
             * boucle de jeu (seulement au clic sur un bouton) contrairement à la barre d'Énergie
             * juste au-dessus (sorealIdleEnergyBarV11, mise à jour à CHAQUE tick). Entre deux
             * synchros complètes avec le serveur (~15 s), la barre restait donc figée à l'ancienne
             * valeur jusqu'au prochain rendu complet -- perçu comme "un saut de 20 toutes les 15 s".
             * Mêmes éléments que rafraichirEnergieEtBoutonsIdleV9_ (jamais un second calcul).
             */
            const magicValeurTickEl=document.getElementById('sorealIdleMagicValeurV1');
            const magicOverlayTickEl=document.getElementById('sorealIdleMagicOverlayV1');
            const magicBarTickEl=document.getElementById('sorealIdleMagicBarV1');
            const magicDisponibleTick=Math.max(0,idleNombre_(ressourceMagieEtat.current));
            const magicCapTick=Math.max(0,idleNombre_(infoMagieEtat.capRun));

            if(magicValeurTickEl){
              magicValeurTickEl.textContent=texteMagieGenereeIdleV1_();
            }
            if(magicOverlayTickEl){
              magicOverlayTickEl.textContent=
                formatEnergieIdleV50_(magicDisponibleTick)+
                ' / '+
                formatEnergieIdleV50_(magicCapTick);
            }
            if(magicBarTickEl){
              mettreAJourBarreProgressionContinueV1_(
                magicBarTickEl,
                magicDisponibleTick,
                magicCapTick
              );
            }
          }
        }
      }

      /* Étape extraite de mettreAJourJeuIdleLocalV7_ (découpage d'une très grande fonction, 2026-10-16) : 11 lignes. */
      function mettreAJourJeuIdleLocalV7__p3(dt){
        if(!REG.idleEtat.combatBossActif){
          const regenPvSecJoueurReposV1=
            regenPvFightBossNguParSecondeV164_(
              REG.idleEtat.defense
            );
          REG.idleEtat.pvJoueur=
            Math.min(
              idleNombre_(REG.idleEtat.pvJoueurMax),
              idleNombre_(REG.idleEtat.pvJoueur)+regenPvSecJoueurReposV1*dt
            );
        }
      }

      /* Étape extraite de mettreAJourJeuIdleLocalV7_ (découpage d'une très grande fonction, 2026-10-16) : 28 lignes. */
      function mettreAJourJeuIdleLocalV7__p4(dt){
        if(
          !REG.idleEtat.combatBossActif &&
          idleNombre_(REG.idleEtat.bossPv)>0 &&
          idleNombre_(REG.idleEtat.bossPv)<
            idleNombre_(REG.idleEtat.bossPvMax)
        ){
          const regenBossParSecV172=
            Math.max(
              0,
              idleNombre_(
                REG.idleEtat.regenBoss
              )
            );

          if(regenBossParSecV172>0){
            REG.idleEtat.bossPv=
              Math.min(
                idleNombre_(
                  REG.idleEtat.bossPvMax
                ),
                idleNombre_(
                  REG.idleEtat.bossPv
                )+
                regenBossParSecV172*
                dt
              );
          }
        }
      }

      /* Étape extraite de mettreAJourJeuIdleLocalV7_ (découpage d'une très grande fonction, 2026-10-16) : 12 lignes. */
      function mettreAJourJeuIdleLocalV7__p5(){
        {
          const monnaiesOr=REG.idleEtat.systemes&&REG.idleEtat.systemes.currencies;
          const vueMachine=REG.idleEtat.systemes&&REG.idleEtat.systemes.timeMachineView;
          const maintOr=performance.now();
          const dtOr=REG.idleOrLocalAtV1===0?0:Math.max(0,Math.min(5,(maintOr-REG.idleOrLocalAtV1)/1000));
          REG.idleOrLocalAtV1=maintOr;
          const gps=idleNombre_(vueMachine&&vueMachine.netGps);
          if(monnaiesOr&&gps>0&&dtOr>0&&PAGE_ACTIVE==='idle'){
            monnaiesOr.gold=idleNombre_(monnaiesOr.gold)+gps*dtOr;
            if(maintOr-REG.idleOrLocalPatchV1>500){REG.idleOrLocalPatchV1=maintOr;patcherResumeStatsIdleV28_(REG.idleEtat);}
          }
        }
      }

      /* Étape extraite de mettreAJourJeuIdleLocalV7_ (découpage d'une très grande fonction, 2026-10-16) : 88 lignes. */
      function mettreAJourJeuIdleLocalV7__p6(augVisual, niveauxAugmentsLocaux){
        if(augVisual&&PAGE_ACTIVE==='idle'){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-40 */
          Object.keys(augVisual.defs||{}).forEach(function(id){
            const d=augVisual.defs[id]||{};
            [['main',d.progress,d.seconds,d.waiting,d.goldCost,d.level],['upgrade',d.upgradeProgress,d.upgradeSeconds,d.upgradeWaiting,d.upgradeGoldCost,d.upgradeLevel]].forEach(function(x){
              /* Les niveaux sont rejoués à chaque tick, quelle que soit la page affichée (Norman, 2026-10-16 : l'effet d'un niveau d'Augmentations sur les PV ne doit pas attendre qu'on ouvre le menu) ; seuls les éléments de la page ne sont cherchés et écrits que si elle est ouverte. */
              const surPageAug=REG.idleMenuActifV28==='augmentations';
              const el=surPageAug?elementAugIdleV1_('[data-idle-aug-bar-v215="'+id+':'+x[0]+'"]'):null;
              const secondes0=idleNombre_(x[2]);
              const ecouleAug=(performance.now()-augVisual.at)/1000;
              const monnaiesLocales=REG.idleEtat.systemes&&REG.idleEtat.systemes.currencies;
              /*
               * Niveaux SANS interruption et chiffres instantanés (Norman, 2026-10-03 : « au moment où la barre passe, le nouveau chiffre doit être instantanément affiché et la barre
               * continuer »). On rejoue localement, depuis le repère du dernier état serveur, les niveaux terminés : le niveau n coûte (niveau n × coût de base) en Or pour un Augment
               * (n² × coût de base pour son Upgrade) et dure n fois plus longtemps que le premier. Chaque niveau terminé avec assez d'Or retire son coût du compteur d'Or, affiche tout de
               * suite le niveau, le coût et la durée du suivant, et la barre repart ; elle ne s'arrête que si l'Or manque. Le serveur compte les mêmes niveaux : la synchro suivante confirme.
               */
              const niv0=Math.max(0,idleEntier_(x[5]));
              const expo=x[0]==='upgrade'?2:1;
              const cout0=idleNombre_(x[4]);
              const rapport=function(k){return (niv0+1+k)/(niv0+1);};
              const dureeK=function(k){return secondes0*rapport(k);};
              const coutK=function(k){return cout0*Math.pow(rapport(k),expo);};
              const cle='cycles_'+x[0];
              let debites=d[cle]||0;
              let k=0,reste=idleNombre_(x[1])*secondes0+ecouleAug,bloque=false,debiteCeTick=false;
              if(secondes0>0.0201){
                /* Rejeu en formule (rejouerCyclesAugmentIdleV1_, meta-progression) : aucun plafond de 200 niveaux, même pour une barre qui en gagne des dizaines par seconde. */
                const orAvant=idleNombre_(monnaiesLocales&&monnaiesLocales.gold);
                const rj=window.__rejouerCyclesAugmentIdleV1__({niv0:niv0,sec0:secondes0,cout0:cout0,expo:expo,reste0:reste,debites:debites,gold:monnaiesLocales?orAvant:0});
                if(Boolean(monnaiesLocales)&&rj.debit>0){monnaiesLocales.gold=Math.max(0,orAvant-rj.debit);debiteCeTick=true;}
                k=rj.k;reste=rj.reste;bloque=rj.bloque;debites=rj.debites;
                d[cle]=debites;
                if(debiteCeTick)patcherResumeStatsIdleV28_(REG.idleEtat);
              }else if(secondes0>0&&typeof window.__rejouerCyclesAugmentPlafonneIdleV1__==='function'){
                /* Barre CAP (50 niveaux par seconde au plus) : les niveaux, le coût et l'Or sont eux aussi rejoués en direct (Norman, 2026-10-10). */
                const orAvantCap=idleNombre_(monnaiesLocales&&monnaiesLocales.gold);
                const rjCap=window.__rejouerCyclesAugmentPlafonneIdleV1__({niv0:niv0,sec0:secondes0,cout0:cout0,expo:expo,reste0:reste,debites:debites,gold:monnaiesLocales?orAvantCap:0});
                if(Boolean(monnaiesLocales)&&rjCap.debit>0){monnaiesLocales.gold=Math.max(0,orAvantCap-rjCap.debit);debiteCeTick=true;}
                k=rjCap.k;reste=rjCap.reste;bloque=rjCap.bloque;debites=rjCap.debites;
                d[cle]=debites;
                if(debiteCeTick)patcherResumeStatsIdleV28_(REG.idleEtat);
              }
              const secondes=secondes0>0.0201?dureeK(k):secondes0;
              const orLive=idleNombre_(monnaiesLocales&&monnaiesLocales.gold);
              const manqueOrServeur=Boolean(x[3])&&k===0&&orLive+1e-9<coutK(0);
              const attenteOr=(bloque||manqueOrServeur)&&secondes0>0;
              const attenteServeur=(debiteCeTick||(Boolean(x[3])&&!attenteOr))&&secondes0>0;
              if(el&&attenteServeur&&Date.now()-idleAugSyncV1>(typeof window!=='undefined'&&window.__SOREAL_IDLE_DELAI_SYNC_V1__?window.__SOREAL_IDLE_DELAI_SYNC_V1__(3000):3000)){
                idleAugSyncV1=Date.now();
                /* La réponse est adoptée comme nouveau repère à l'arrivée (voir la synchro) : plus de redessin différé, qui faisait repasser toute la page par les chiffres en retard du serveur. */
                synchroniserJeuIdleV7_(true);
              }
              /* Niveau, coût du prochain niveau et compte à rebours : mis à jour à l'instant où la barre passe. */
              const nivEl=el?elementAugIdleV1_('[data-idle-aug-niv-v1="'+id+':'+x[0]+'"]'):null;
              /* Le niveau affiché ne recule jamais d'un cran à l'arrivée d'une réponse du serveur (écart d'horloge de quelques dixièmes de seconde sur une barre qui gagne des dizaines de niveaux par seconde) : on garde le plus haut tant que l'écart reste infime (moins de 1 % du niveau, 20 niveaux au plus). */
              let nivAffiche=niv0+k;
              if(nivEl){
                const avant=nivEl.__idleNivAfficheV1;
                if(avant!=null&&nivAffiche<avant&&avant-nivAffiche<=Math.min(20,Math.max(2,avant*0.01)))nivAffiche=avant;
                nivEl.__idleNivAfficheV1=nivAffiche;
              }
              ecrireSiChangeIdleV1_(nivEl,formatEntierLisibleIdleV1_(nivAffiche));
              niveauxAugmentsLocaux[id+':'+x[0]]=nivAffiche;
              if(!el)return;
              const coutEl=elementAugIdleV1_('[data-idle-aug-cout-v1="'+id+':'+x[0]+'"]');
              if(coutEl&&k>0)ecrireSiChangeIdleV1_(coutEl,formatGrandNombreIdleV70_(coutK(k))+' Or');
              /* La somme est verte quand on a l'Or, rouge sinon (Norman, 2026-10-08). */
              if(coutEl){
                const coutAffiche=k>0?coutK(k):cout0;
                coutEl.dataset.cout=String(coutAffiche);
                const assezOr=orLive>=coutAffiche;
                if(coutEl.classList.contains('ok')!==assezOr||coutEl.classList.contains('non')===assezOr){coutEl.classList.toggle('ok',assezOr);coutEl.classList.toggle('non',!assezOr);}
              }
              const etaEl=elementAugIdleV1_('[data-idle-aug-eta-v1="'+id+':'+x[0]+'"]');
              if(etaEl&&typeof window.__texteEtaAugmentIdleV1__==='function'){
                ecrireSiChangeIdleV1_(etaEl,window.__texteEtaAugmentIdleV1__({seconds:secondes,progress:secondes>0?Math.max(0,Math.min(1,reste/secondes)):0,waiting:attenteOr,goldCost:k>0?coutK(k):cout0,gold:orLive},0));
              }
              /* Barre pleine faute d'Or : elle reste pleine (comme NGU) au lieu de tourner à vide. Sinon elle continue sans s'arrêter. */
              if(attenteOr){
                if(el.__idleAugAnimationV217){el.__idleAugAnimationV217.cancel();el.__idleAugAnimationV217=null;delete el.dataset.idleAugDurationV217;}
                el.style.width='100%';
                el.style.transform='scaleX(1)';
                return;
              }
              /* Le moteur dit « en attente » alors que l'Or suffit (défi « 100 niveaux » atteint, par exemple) : aucun niveau ne viendra à la fin du tour. La barre reste PLEINE au lieu de tourner à vide
                 (journal de Norman, 2026-10-20 : barre_recule toutes les 5,5 s sur Ciseaux, niveau inchangé pendant 13 minutes) ; la synchro ci-dessus la repart dès que le moteur valide. */
              if(Boolean(x[3])&&k===0&&secondes0>0&&!debiteCeTick){
                if(el.__idleAugAnimationV217){el.__idleAugAnimationV217.cancel();el.__idleAugAnimationV217=null;delete el.dataset.idleAugDurationV217;}
                el.style.width='100%';
                el.style.transform='scaleX(1)';
                return;
              }
              animerBarreCycliqueIdleV217_(el,secondes,secondes>0?Math.max(0,Math.min(.999999,reste/secondes)):idleNombre_(x[1]),true);
            });
          });
          appliquerAugmentsSurCombatIdleV1_(augVisual,niveauxAugmentsLocaux);
        }
      }

      /* Étape extraite de mettreAJourJeuIdleLocalV7_ (découpage d'une très grande fonction, 2026-10-16) : 90 lignes. */
      function mettreAJourJeuIdleLocalV7__p7(bloodVisuels){
        Object.keys((bloodVisuels&&typeof bloodVisuels==='object'&&!bloodVisuels.ritual)?bloodVisuels:{}).forEach(function(ritualCleBlood){
        const bloodVisual=bloodVisuels[ritualCleBlood];
        if(bloodVisual&&PAGE_ACTIVE==='idle'){
          const el=document.querySelector('[data-idle-blood-bar-v1="'+bloodVisual.ritual+'"]');
          if(el){
            const seconds=idleNombre_(bloodVisual.secondsPerCompletion);
            /* Progression à l'instant PRÉSENT (repère + temps écoulé), jamais celle du dernier chiffre serveur : un redessin ne ramène plus la barre en arrière. */
            const progress=seconds>0?Math.max(0,Math.min(.999999,((1-idleNombre_(bloodVisual.etaSeconds)/seconds)+Math.max(0,(performance.now()-(bloodVisual.at||performance.now()))/1000)/seconds)%1)):0;
            /*
             * Or EN DIRECT (Norman, 2026-10-03 : « le souci avec l'Or apparaît aussi dans Blood Magic »). Un rituel qui se termine dépense de l'Or ; sans Or, la barre bouclait
             * à vide. Comme pour les Augmentations : barre arrivée au bout = pleine ; s'il manque de l'Or (Or actuel) on le dit ; sinon on resynchronise et on redessine.
             */
            const rituelDef=((REG.idleEtat.systemes&&REG.idleEtat.systemes.bloodRituals)||[]).find(function(r){return r&&r.id===bloodVisual.ritual;});
            const coutOrB=idleNombre_(rituelDef&&rituelDef.gold);
            let orLiveB=idleNombre_(REG.idleEtat.systemes&&REG.idleEtat.systemes.currencies&&REG.idleEtat.systemes.currencies.gold);
            /*
             * Les rituels s'ENCHAÎNENT (Norman, 2026-10-09 : « Blood Magic maxé n'enchaîne pas les niveaux, il s'arrête pour calculer les −30M Gold ; notre Or doit diminuer super vite ») : tant que l'Or le permet, les
             * rituels terminés depuis le dernier repère sont rejoués ICI (Or débité, compteur augmenté, repère avancé) exactement comme le moteur (un rituel terminé = coût en Or), sans attendre la réponse du serveur ;
             * la synchro ne fait que confirmer. Sans Or suffisant, la barre reste pleine comme avant.
             */
            if(seconds>0&&coutOrB>0){
              const maintB=performance.now();
              const ecoule0=Math.max(0,(maintB-(bloodVisual.at||maintB))/1000);
              const eta0=idleNombre_(bloodVisual.etaSeconds);
              if(ecoule0>=eta0-1e-9){
                const dus=Math.floor((ecoule0-eta0)/seconds)+1;
                const faits=Math.min(dus,Math.floor((orLiveB+1e-9)/coutOrB),1000000);
                if(faits>0&&REG.idleEtat.systemes&&REG.idleEtat.systemes.currencies){
                  orLiveB=Math.max(0,orLiveB-faits*coutOrB);
                  REG.idleEtat.systemes.currencies.gold=orLiveB;
                  bloodVisual.ajoutLocal=(bloodVisual.ajoutLocal||0)+faits;
                  /* Chaque rituel TERMINÉ le dit à l'animation de la scène (modules/sang-rituel-decor-v1.js) : la coupure, la punaise, le jet… partent de CET événement et non d'un chiffre affiché (le compteur est borné et ne bouge pas toujours : le papier bougeait sans couper — Norman, 2026-10-15). */
                  try{window.dispatchEvent(new CustomEvent('soreal-rituel-termine',{detail:{id:String(bloodVisual.ritual),faits:faits}}));}catch(_e){}
                  const compte=document.getElementById('sorealIdleBloodCountV1_'+bloodVisual.ritual);
                  if(compte&&typeof window.__bloodCompteTickV1__==='function')compte.textContent=idleEntier_(window.__bloodCompteTickV1__(bloodVisual.ritual,faits));
                  if(faits===dus){
                    const reste=(ecoule0-eta0)%seconds;
                    bloodVisual.at=maintB;
                    bloodVisual.etaSeconds=Math.max(1e-6,seconds-reste);
                  }else{
                    /* Or épuisé : les rituels payés sont rejoués, le suivant attend l'Or (barre pleine). */
                    bloodVisual.at=maintB;
                    bloodVisual.etaSeconds=0;
                  }
                  if(Date.now()-idleAugSyncV1>(typeof window!=='undefined'&&window.__SOREAL_IDLE_DELAI_SYNC_V1__?window.__SOREAL_IDLE_DELAI_SYNC_V1__(3000):3000)){idleAugSyncV1=Date.now();synchroniserJeuIdleV7_(true);}
                }
              }
            }
            const ecouleB=Math.max(0,(performance.now()-(bloodVisual.at||performance.now()))/1000);
            const pleineB=seconds>0.0201&&ecouleB>=idleNombre_(bloodVisual.etaSeconds)-1e-9;
            const manqueOrB=coutOrB>0&&orLiveB+1e-9<coutOrB;
            const ligneBloodFixe=document.getElementById('sorealIdleBloodEtaLineV1_'+bloodVisual.ritual);
            /* Compteur relu à chaque tick dans l'état à jour du serveur (voir __bloodCompteTickV1__ dans blood-magic-v1.js) : il ne reste plus bloqué entre deux redessins de la page. */
            if(typeof window.__bloodCompteTickV1__==='function'){
              const compte2=document.getElementById('sorealIdleBloodCountV1_'+bloodVisual.ritual);
              if(compte2){const texte2=idleEntier_(window.__bloodCompteTickV1__(bloodVisual.ritual,0));if(compte2.textContent!==texte2)compte2.textContent=texte2;}
            }
            if(pleineB){
              if(el.__idleAugAnimationV217){el.__idleAugAnimationV217.cancel();el.__idleAugAnimationV217=null;delete el.dataset.idleAugDurationV217;}
              el.style.width='100%';
              el.style.transform='scaleX(1)';
              if(manqueOrB){
                if(ligneBloodFixe)ecrireSiChangeIdleV1_(ligneBloodFixe,'🪙 Il manque <b class="or-somme-v1">'+formatGrandNombreIdleV70_(coutOrB-orLiveB)+' Or</b> pour le prochain rituel.');
              }else{
                if(ligneBloodFixe)ecrireSiChangeIdleV1_(ligneBloodFixe,'⏳ Rituel en cours de validation…');
                if(Date.now()-idleAugSyncV1>(typeof window!=='undefined'&&window.__SOREAL_IDLE_DELAI_SYNC_V1__?window.__SOREAL_IDLE_DELAI_SYNC_V1__(3000):3000)){
                  idleAugSyncV1=Date.now();
                  synchroniserJeuIdleV7_(true);
                  setTimeout(function(){
                    const racine=document.querySelector('.soreal-idle-page-root-v28');
                    if(racine&&racine.getAttribute('data-menu')==='sang'&&REG.idleEtat)rafraichirMenuRacineIdleV28_();
                  },1500);
                }
              }
            }else{
            animerBarreCycliqueIdleV217_(el,seconds,progress);
            /* Compte à rebours « avant le prochain rituel » : suit la même horloge que la barre (mis à jour à chaque passage, plus figé). */
            const ligneBlood=document.getElementById('sorealIdleBloodEtaLineV1_'+bloodVisual.ritual);
            if(ligneBlood&&seconds>0&&typeof window.__formatDureeAugmentIdleV1__==='function'){
              const ecouleBlood=Math.max(0,(performance.now()-(bloodVisual.at||performance.now()))/1000);
              const restantBlood=(((idleNombre_(bloodVisual.etaSeconds)-ecouleBlood)%seconds)+seconds)%seconds;
              /* sous la seconde : la VRAIE durée d'un niveau (0,2 s), jamais arrondie à « 1 s » (Norman, 2026-10-11) */
              const texteBlood='⏱ '+(seconds<1?String(Math.round(seconds*100)/100).replace('.',',')+' s':window.__formatDureeAugmentIdleV1__(restantBlood||seconds))+' avant le prochain rituel complété';
              if(ligneBlood.textContent!==texteBlood)ligneBlood.textContent=texteBlood;
            }
            }
          }
        }
        });
      }

      /* Étape extraite de mettreAJourJeuIdleLocalV7_ (découpage d'une très grande fonction, 2026-10-16) : 154 lignes. */
      function mettreAJourJeuIdleLocalV7__p8(dps, dt, effetsMagie, maintenantTick){
        if(
              dps>0 &&
              idleNombre_(
                REG.idleEtat.bossPv
              )>0 &&
              !REG.idleCombatEnPauseApresDefaiteV1
            ){
              const bossAvant=
                idleNombre_(
                  REG.idleEtat.bossPv
                );

              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-43 */
              /* Qui tombe en premier ? (voir degatsNetsBossParSecondeIdleV1_) : si le joueur meurt avant le boss, ses coups ne comptent que jusqu'à sa mort. */
              const recusParSec=degatsNetsBossParSecondeIdleV1_(effetsMagie,maintenantTick);
              const tempsAvantMortJoueur=recusParSec>0?idleNombre_(REG.idleEtat.pvJoueur)/recusParSec:Infinity;
              const tempsAvantMortBoss=bossAvant/dps;
              const dtJoueurFrappe=tempsAvantMortJoueur<tempsAvantMortBoss?Math.min(dt,tempsAvantMortJoueur):dt;
              const degatsBoss=
                Math.min(
                  bossAvant,
                  Math.max(
                    0,
                    dps*dtJoueurFrappe
                  )
                );

              if(degatsBoss>0){
                REG.idleCombatLogDegatsJoueurV70+=
                  degatsBoss;

                REG.idleEtat.bossPv=
                  Math.max(
                    0,
                    bossAvant-degatsBoss
                  );
              }

              if(
                bossAvant>0 &&
                REG.idleEtat.bossPv<=0 &&
                !REG.idleVictoireBossLocaleV49
              ){
                REG.idleVictoireBossLocaleV49=
                  true;

                REG.idleCombatArmeLocalV206=false;
                REG.idleEtat.combatBossActif=
                  false;
                jouerEffetAudioIdleV199_('victory');

                const gainXpLocal=
                  idleNombre_(
                    REG.idleEtat.recompenseBossActuel&&
                    REG.idleEtat.recompenseBossActuel.xp
                  );

                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-44 */
                ajouterLogCombatIdleV70_(
                  'bossxp',
                  '🏆 '+
                  String(
                    REG.idleEtat.bossActuel||'Boss'
                  )+
                  ' vaincu · +'+
                  formatGrandNombreIdleV70_(
                    gainXpLocal
                  )+
                  ' XP.'
                );

                actualiserXpLocaleIdleV70_(
                  gainXpLocal
                );

                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-45 */
                REG.idleEtat.bossPv=0;
                const bossPvFinalEl=document.getElementById('sorealIdleBossPvV7');
                if(bossPvFinalEl){
                  texteCombatIdleV121_(
                    bossPvFinalEl,
                    '❤️ '+formaterPvFixeIdleV1_(0)+' / '+formaterPvFixeIdleV1_(REG.idleEtat.bossPvMax),''
                  );
                }
                const bossBarFinalEl=document.getElementById('sorealIdleBossBarV7');
                if(bossBarFinalEl){
                  largeurBarreVieCombatIdleV163_(bossBarFinalEl,0);
                  void bossBarFinalEl.offsetWidth;
                }

                nettoyerImpactsIdleV50_();

                const vaincusALaVictoireV1=idleEntier_(REG.idleEtat.bossVaincus);
                const apresBarreVide=function(){
                  transitionMortBossIdleV61_();
                  /* Le boss suivant apparaît presque tout de suite (court temps pour voir la victoire), sans attendre le serveur. */
                  setTimeout(function(){appliquerBossSuivantLocalIdleV1_(vaincusALaVictoireV1);},250);
                  const synchroniserVictoire=function(){
                    synchroniserJeuIdleV7_(true);
                    surveillerConfirmationVictoireBossIdleV1_();
                  };
                  /*
                   * Norman (2026-09-26) : « parfois, quand on bat un boss, il reste sur Boss vaincu et nous rend le même boss ». Le combat est prédit ici avec
                   * les niveaux d'entraînement du moment ; si les allocations récentes ne sont pas encore parties, le serveur (qui fait foi) calcule avec
                   * d'anciennes stats et ne confirme pas la victoire. On envoie donc d'abord les allocations en attente (1,5 s au plus), puis on synchronise.
                   */
                  /*
                   * Norman (2026-10-07) : « le boss suivant ne se charge pas toujours ; la barre de vie de l'ancien boss reste, sans image ; j'ai refait Fight et regagné l'EXP ». Le serveur calcule la
                   * victoire avec SES chiffres : les allocations des autres menus (Augmentations, Time Machine, Blood Magic) encore en route changent ce qu'il voit. On les laisse donc partir
                   * d'abord (1,5 s au plus), exactement comme les allocations de Basic Training ci-dessous, puis on demande la confirmation.
                   */
                  const apresAllocationsMeta=function(suite){
                    const enAttente=window.__allocRapideEnAttenteIdleV1__;
                    if(typeof enAttente!=='function'||!enAttente()){suite();return;}
                    if(typeof window.__viderAllocRapideIdleV1__==='function')window.__viderAllocRapideIdleV1__();
                    const debutMeta=Date.now();
                    const attendreMeta=function(){
                      if(!enAttente()||Date.now()-debutMeta>1500){suite();return;}
                      setTimeout(attendreMeta,60);
                    };
                    attendreMeta();
                  };
                  apresAllocationsMeta(function(){
                    if(REG.idleBasicTrainingDirtyV120||REG.idleBasicTrainingSaveBusyV120){
                      if(REG.idleBasicTrainingSaveTimerV120){
                        clearTimeout(REG.idleBasicTrainingSaveTimerV120);
                        REG.idleBasicTrainingSaveTimerV120=null;
                      }
                      if(!REG.idleBasicTrainingSaveBusyV120)envoyerAllocationsBasicTrainingIdleV120_();
                      const debutAttente=Date.now();
                      const attendreEnvoi=function(){
                        if((!REG.idleBasicTrainingSaveBusyV120&&!REG.idleBasicTrainingDirtyV120)||Date.now()-debutAttente>1500){
                          synchroniserVictoire();
                          return;
                        }
                        setTimeout(attendreEnvoi,60);
                      };
                      attendreEnvoi();
                    }else{
                      synchroniserVictoire();
                    }
                  });
                };
                if(typeof requestAnimationFrame==='function'){
                  requestAnimationFrame(function(){
                    requestAnimationFrame(function(){
                      setTimeout(apresBarreVide,110);
                    });
                  });
                }else{
                  setTimeout(apresBarreVide,130);
                }
              }
            }
      }

      /* Étape extraite de mettreAJourJeuIdleLocalV7_ (découpage d'une très grande fonction, 2026-10-16) : 161 lignes. */
      function mettreAJourJeuIdleLocalV7__p9(dt, effetsMagie, maintenantTick){
        if(!REG.idleCombatEnPauseApresDefaiteV1&&!REG.idleVictoireBossLocaleV49){
            const attaqueBrute=
              Math.max(
                0,
                idleNombre_(
                  REG.idleEtat.attaqueBoss
                )
              )*
              (
                REG.idleFureurActiveV70
                  ?multiplicateurFureurLocaleIdleV70_()
                  :1
              );

            const defense=
              Math.max(
                0,
                idleNombre_(
                  REG.idleEtat.defense
                )
              );

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-48 */
            const regenPvSecJoueurBossV1=
              regenPvFightBossNguParSecondeV164_(
                defense
              );

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-49 */
            const recusBase=
              Math.max(
                0,
                attaqueBrute-defense
              );

            const bossEtourdi=
              maintenantTick<
              idleNombre_(
                effetsMagie.bossStunJusqua
              );

            const bouclierMagiqueActif=
              maintenantTick<
              idleNombre_(
                effetsMagie.bouclierJusqua
              );

            const reductionBouclierMagique=
              bouclierMagiqueActif
                ?Math.max(
                    0,
                    Math.min(
                      .95,
                      idleNombre_(
                        effetsMagie.bouclierPct
                      )/
                      100
                    )
                  )
                :0;

            const recus=
              bossEtourdi
                ?0
                :Math.max(
                    0,
                    recusBase*
                    (
                      1-
                      reductionBouclierMagique
                    )
                  );

            const bloque=
              Math.max(
                0,
                attaqueBrute-recus
              );

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-50 */
            const recusNet=
              Math.max(
                0,
                recus-regenPvSecJoueurBossV1
              );

            const brutContinu=
              Math.max(
                0,
                attaqueBrute*dt
              );

            const bloqueContinu=
              Math.max(
                0,
                bloque*dt
              );

            const degatsJoueur=
              Math.min(
                idleNombre_(
                  REG.idleEtat.pvJoueur
                ),
                Math.max(
                  0,
                  recusNet*dt
                )
              );

            REG.idleCombatLogDegatsBrutsV100+=
              brutContinu;

            REG.idleCombatLogBloquesV70+=
              bloqueContinu;

            if(degatsJoueur>0){
              REG.idleCombatLogDegatsBossV70+=
                degatsJoueur;

              REG.idleEtat.pvJoueur=
                Math.max(
                  0,
                  idleNombre_(
                    REG.idleEtat.pvJoueur
                  )-
                  degatsJoueur
                );
            }else if(regenPvSecJoueurBossV1>recus){
              /* Régénération plus forte que les coups du boss : la vie remonte PENDANT le combat (Norman, 2026-10-05), jamais au-delà des PV max. */
              REG.idleEtat.pvJoueur=
                Math.min(
                  Math.max(idleNombre_(REG.idleEtat.pvJoueurMax),idleNombre_(REG.idleEtat.pvJoueur)),
                  idleNombre_(REG.idleEtat.pvJoueur)+(regenPvSecJoueurBossV1-recus)*dt
                );
            }

            if(
              REG.idleEtat.pvJoueur<=0
            ){
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-51 */
              REG.idleEtat.pvJoueur=0;
              REG.idleCombatEnPauseApresDefaiteV1=true;
              REG.idleCombatArmeLocalV206=false;
              REG.idleEtat.combatBossActif=false;
              jouerEffetAudioIdleV199_('defeat');

              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-52 */
              rafraichirCommandesFightBossIdleV167_();

              ajouterActionRapideIdleV60_(
                'combat',
                {
                  actif:false,
                  raison:'defaite',
                  snapshot:snapshotCombatFightBossIdleV173_()
                }
              );

              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-53 */
            }
            }
      }

      /* Étape extraite de mettreAJourJeuIdleLocalV7_ (découpage d'une très grande fonction, 2026-10-16) : 132 lignes. */
      function mettreAJourJeuIdleLocalV7__p10(maintenantTick){
        if(
          REG.idleEtat.combatBossActif &&
          maintenantTick-
          REG.idleCombatLogDernierResumeV70>=
          1000
        ){
          REG.idleCombatLogDernierResumeV70=
            maintenantTick;

          if(REG.idleCombatLogDegatsJoueurV70>0){
            const infliges=
              REG.idleCombatLogDegatsJoueurV70;

            ajouterLogCombatIdleV70_(
              'player',
              '⚔️ '+
              String(
                REG.idleEtat.nom||'Joueur'
              )+
              ' '+
              verbeDegatIdleV142_(
                infliges
              )+
              ' '+
              formatNombreCombatIdleV100_(
                infliges
              )+
              ' '+
              motDegatIdleV100_(
                infliges
              )+
              (
                idleCombatLogCritiquesJoueurV117>0
                  ?' · 💥 '+idleCombatLogCritiquesJoueurV117+' coup'+
                    (idleCombatLogCritiquesJoueurV117>1?'s':'')+
                    ' puissant'+
                    (idleCombatLogCritiquesJoueurV117>1?'s':'')
                  :''
              )+
              ' à '+
              String(
                REG.idleEtat.bossActuel||'Boss'
              )+
              '.'
            );
          }else if(
            maintenantTick<
            REG.idleParalysieJusquaV70
          ){
            ajouterLogCombatIdleV70_(
              'skill',
              '⚡ '+
              String(
                REG.idleEtat.nom||'Joueur'
              )+
              ' est paralysé et ne peut pas attaquer.'
            );
          }

          if(
            REG.idleCombatLogDegatsBrutsV100>0 ||
            REG.idleCombatLogDegatsBossV70>0
          ){
            const brut=
              REG.idleCombatLogDegatsBrutsV100;

            const recus=
              REG.idleCombatLogDegatsBossV70;

            const bloques=
              Math.max(
                0,
                REG.idleCombatLogBloquesV70
              );

            ajouterLogCombatIdleV70_(
              'boss',
              '👹 '+
              String(
                REG.idleEtat.bossActuel||'Boss'
              )+
              ' attaque pour '+
              formatNombreCombatIdleV100_(
                brut
              )+
              ' '+
              motDegatIdleV100_(
                brut
              )+
              (
                idleCombatLogCritiquesBossV117>0
                  ?' · 💥 '+idleCombatLogCritiquesBossV117+' coup'+
                    (idleCombatLogCritiquesBossV117>1?'s':'')+
                    ' puissant'+
                    (idleCombatLogCritiquesBossV117>1?'s':'')
                  :''
              )+
              (
                bloques>0.0001
                  ?' · 🛡️ '+
                    formatNombreCombatIdleV100_(
                      bloques
                    )+
                    ' '+
                    motBloqueIdleV100_(
                      bloques
                    )
                  :''
              )+
              ' · ❤️ '+
              String(
                REG.idleEtat.nom||'Joueur'
              )+
              ' subit '+
              formatNombreCombatIdleV100_(
                recus
              )+
              ' '+
              motDegatIdleV100_(
                recus
              )+
              '.'
            );
          }

          REG.idleCombatLogDegatsJoueurV70=0;
          REG.idleCombatLogDegatsBossV70=0;
          REG.idleCombatLogDegatsBrutsV100=0;
          REG.idleCombatLogBloquesV70=0;
          idleCombatLogCritiquesJoueurV117=0;
          idleCombatLogCritiquesBossV117=0;
        }
      }

      /* Étape extraite de mettreAJourJeuIdleLocalV7_ (découpage d'une très grande fonction, 2026-10-16) : 17 lignes. */
      function mettreAJourJeuIdleLocalV7__p11(joueurPvEl){
        if(joueurPvEl){
          /* Norman (2026-09-27) : PV joueur rétrécissait en boucle pendant la
           * regen faute de décimale (comme le PV boss, bossEnRegenV174). */
          const regenJoueurVisibleV176=
            regenPvFightBossNguParSecondeV164_(
              REG.idleEtat.defense
            );

          texteCombatIdleV121_(
            joueurPvEl,
            '❤️ '+
            formaterPvFixeIdleV1_(REG.idleEtat.pvJoueur)+
            ' / '+
            formaterPvFixeIdleV1_(REG.idleEtat.pvJoueurMax),
            regenJoueurVisibleV176>0?'+'+formaterPvFixeIdleV1_(regenJoueurVisibleV176)+'/s':''
          );
        }
      }

      /* Étape extraite de mettreAJourJeuIdleLocalV7_ (découpage d'une très grande fonction, 2026-10-16) : 36 lignes. */
      function mettreAJourJeuIdleLocalV7__p12(joueurBarre){
        if(joueurBarre){
          const pctJoueur=
            idleNombre_(
              REG.idleEtat.pvJoueurMax
            )>0
              ?Math.max(
                  0,
                  Math.min(
                    100,
                    idleNombre_(
                      REG.idleEtat.pvJoueur
                    )/
                    idleNombre_(
                      REG.idleEtat.pvJoueurMax
                    )*
                    100
                  )
                )
              :0;

          largeurBarreVieCombatIdleV163_(
            joueurBarre,
            pctJoueur
          );

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-54 */
          joueurBarre.classList.toggle(
            'low',
            pctJoueur<=50&&pctJoueur>25
          );

          joueurBarre.classList.toggle(
            'critical',
            pctJoueur<=25
          );
        }
      }

      /* Étape extraite de mettreAJourJeuIdleLocalV7_ (découpage d'une très grande fonction, 2026-10-16) : 14 lignes. */
      function mettreAJourJeuIdleLocalV7__p13(bossPvEl){
        if(bossPvEl){
          const bossEnRegenV174=
            idleNombre_(REG.idleEtat.bossPv)>0 &&
            idleNombre_(REG.idleEtat.regenBoss)>0;

          texteCombatIdleV121_(
            bossPvEl,
            '❤️ '+
            formaterPvFixeIdleV1_(REG.idleEtat.bossPv)+
            ' / '+
            formaterPvFixeIdleV1_(REG.idleEtat.bossPvMax),
            bossEnRegenV174?'+'+formaterPvFixeIdleV1_(REG.idleEtat.regenBoss)+'/s':''
          );
        }
      }

      /* Étape extraite de mettreAJourJeuIdleLocalV7_ (découpage d'une très grande fonction, 2026-10-16) : 28 lignes. */
      function mettreAJourJeuIdleLocalV7__p14(barre){
        if(barre){
          const pct=
            idleNombre_(
              REG.idleEtat.bossPvMax
            )>0
              ?Math.max(
                  0,
                  Math.min(
                    100,
                    idleNombre_(
                      REG.idleEtat.bossPv
                    )/
                    idleNombre_(
                      REG.idleEtat.bossPvMax
                    )*
                    100
                  )
                )
              :0;

          largeurBarreVieCombatIdleV163_(
            barre,
            pct
          );
          /* Le boss faiblit : sa barre s'embrase (<= 50 %) puis clignote (<= 25 %), comme celle du joueur (voir soreal-idle-themes.css, Fight Boss). */
          barre.classList.toggle('bas',pct<=50&&pct>25);
          barre.classList.toggle('critique',pct<=25);
        }
      }

      /* Étape extraite de mettreAJourJeuIdleLocalV7_ (découpage d'une très grande fonction, 2026-10-16) : 143 lignes. */
      function mettreAJourJeuIdleLocalV7__p15(aFight, fight, noteOuBoutonEl){
        if(
          fight&&fight.active&&fight.zone&&
          String(fight.zone||'')===String((aFight&&aFight.selectedZone)||'')
        ){
          const fightPvEl=
            document.getElementById(
              'sorealIdleAdventureFightPvV1'
            );

          if(fightPvEl){
            texteCombatIdleV121_(
              fightPvEl,
              formatGrandNombreIdleV70_(fight.monsterHp)+
              ' HP'
            );
          }

          const fightBarEl=
            document.getElementById(
              'sorealIdleAdventureFightBarV1'
            );

          if(fightBarEl){
            const fightPct=
              idleNombre_(fight.monsterHpMax)>0
                ?Math.max(
                    0,
                    Math.min(
                      100,
                      idleNombre_(fight.monsterHp)/
                      idleNombre_(fight.monsterHpMax)*
                      100
                    )
                  )
                :0;

            largeurBarreVieCombatIdleV163_(
              fightBarEl,
              fightPct
            );
          }

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-57 */
          const joueurPvLabelEl=
            document.querySelector(
              '.soreal-idle-adventure-player-pv-label-v1'
            );

          if(joueurPvLabelEl){
            texteCombatIdleV121_(
              joueurPvLabelEl,
              formatGrandNombreIdleV70_(fight.playerHp)+
              ' HP'
            );
          }

          const joueurBarEl=
            document.getElementById(
              'sorealIdleAdventureJoueurBarV1'
            );

          if(joueurBarEl){
            const joueurPct=
              idleNombre_(fight.playerHpMax)>0
                ?Math.max(
                    0,
                    Math.min(
                      100,
                      idleNombre_(fight.playerHp)/
                      idleNombre_(fight.playerHpMax)*
                      100
                    )
                  )
                :0;

            largeurBarreVieCombatIdleV163_(
              joueurBarEl,
              joueurPct
            );
          }

          if(
            noteOuBoutonEl&&
            noteOuBoutonEl.textContent.indexOf('Combat en cours')===-1
          ){
            poserNoteCombatAdventureIdleV1_(noteOuBoutonEl,'⚔️ Combat en cours…');
          }
        }else if(aFight){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-58 */
          const statsRepos=aFight.stats||{};
          const pvMaxRepos=Math.max(0,idleNombre_(statsRepos.hp));

          if(REG.idleEtat&&(REG.idleEtat.adventureRestPv==null||REG.idleEtat.adventureRestPv>pvMaxRepos)){
            REG.idleEtat.adventureRestPv=restPvInitialIdleV1_(pvMaxRepos);
          }

          const pvRepos=REG.idleEtat?Math.max(0,REG.idleEtat.adventureRestPv):pvMaxRepos;

          const joueurPvLabelReposEl=
            document.querySelector(
              '.soreal-idle-adventure-player-pv-label-v1'
            );

          if(joueurPvLabelReposEl){
            texteCombatIdleV121_(
              joueurPvLabelReposEl,
              formatGrandNombreIdleV70_(pvRepos)+
              ' HP'
            );
          }

          const joueurBarReposEl=
            document.getElementById(
              'sorealIdleAdventureJoueurBarV1'
            );

          if(joueurBarReposEl){
            const joueurPctRepos=
              pvMaxRepos>0
                ?Math.max(0,Math.min(100,pvRepos/pvMaxRepos*100))
                :0;

            largeurBarreVieCombatIdleV163_(
              joueurBarReposEl,
              joueurPctRepos
            );
          }

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-59 */
          if(noteOuBoutonEl){
            const zoneCouranteRepos=String(aFight.selectedZone||'safe');
            const contenuAttendu=
              zoneCouranteRepos==='safe'
                ?'🛡️ Zone sûre : choisis une autre zone pour combattre.'
                :REG.idleAdventureRespawnStartPendingV165
                  ?'⚔️ Nouveau combat…'
                  :texteProchainCombatAdventureIdleV165_();

            if(noteOuBoutonEl.textContent!==contenuAttendu){
              poserNoteCombatAdventureIdleV1_(noteOuBoutonEl,contenuAttendu);
            }
          }
        }
      }

      /* Fonction interne de mettreAJourJeuIdleLocalV7_ remontée au niveau du module (découpage d'une très grande fonction, 2026-10-16). */
      function elementAugIdleV1_(selecteur){
          const cache=window.__idleAugElsV1__||(window.__idleAugElsV1__=new Map());
          const garde=cache.get(selecteur);
          if(garde&&garde.isConnected)return garde;
          const el=document.querySelector(selecteur);
          if(el)cache.set(selecteur,el);else cache.delete(selecteur);
          return el;
        }

      /* Fonction interne de mettreAJourJeuIdleLocalV7_ remontée au niveau du module (découpage d'une très grande fonction, 2026-10-16). */
      function ecrireSiChangeIdleV1_(el,texte){
          if(!el)return;
          if(texte.indexOf('<b class="or-somme-v1">')>=0){
            if(el.__orHtmlV1!==texte){el.innerHTML=texte;el.__orHtmlV1=texte;}
            return;
          }
          el.__orHtmlV1=null;
          if(el.textContent!==texte)el.textContent=texte;
        }

      /* Fonction interne de mettreAJourJeuIdleLocalV7_ remontée au niveau du module (découpage d'une très grande fonction, 2026-10-16). */
      function animerBarreCycliqueIdleV217_(el,seconds,progress,tenir){
          if(!(seconds>0)){
            /* Aucune ressource allouée : la barre reste à sa fraction (elle ne retombe pas à 0) et repartira de là. */
            if(el.__idleAugAnimationV217){el.__idleAugAnimationV217.cancel();el.__idleAugAnimationV217=null;delete el.dataset.idleAugDurationV217;}
            const fraction=Math.max(0,Math.min(.999999,Number(progress)||0));
            el.style.width='100%';
            el.style.transform='scaleX('+fraction+')';
            return;
          }
          /* Vitesse maximale (1 niveau par tick, 50/s) : la barre est CAP, elle reste entièrement remplie au lieu de clignoter (Norman, 2026-09-25). */
          if(seconds<=0.0201){
            if(el.__idleAugAnimationV217){el.__idleAugAnimationV217.cancel();el.__idleAugAnimationV217=null;delete el.dataset.idleAugDurationV217;}
            el.style.width='100%';
            el.style.transform='scaleX(1)';
            return;
          }
          const duration=Math.max(20,seconds*1000);
          const fini=Boolean(tenir&&el.__idleAugAnimationV217&&el.__idleAugAnimationV217.playState==='finished'&&Number(progress)<0.98);
          if(!el.__idleAugAnimationV217||fini||Math.abs(idleNombre_(el.dataset.idleAugDurationV217)-duration)>.1){
            if(el.__idleAugAnimationV217)el.__idleAugAnimationV217.cancel();
            el.style.width='100%';
            /*
             * Cycles longs (≥ 2 s) : remplissage linéaire honnête 0 -> 100 % puis retour à 0 (Norman, 2026-09-24 : la barre restait pleine
             * ~26 % du cycle). Les paliers d'affichage ne servent qu'aux cycles très courts, échantillonnés à 15 Hz (voir V220).
             */
            const animation=el.animate(
              seconds>0
                ?[
                  {transform:'scaleX(0)',offset:0},
                  {transform:'scaleX(1)',offset:1}
                ]
                :[
                  {transform:'scaleX(0)',offset:0},
                  {transform:'scaleX(0)',offset:.08},
                  {transform:'scaleX(1)',offset:.72},
                  {transform:'scaleX(1)',offset:.98},
                  {transform:'scaleX(0)',offset:1}
                ],
              (tenir&&seconds>=2)?{duration:duration,iterations:1,fill:'forwards',easing:'linear'}:{duration:duration,iterations:Infinity,easing:'linear'}
            );
            animation.currentTime=Math.max(0,Math.min(.999999,idleNombre_(progress)))*duration;
            el.__idleAugAnimationV217=animation;
            el.dataset.idleAugDurationV217=String(duration);
          }else{
            /*
             * Recalage de phase : la barre tourne seule (animation du navigateur) pendant que le niveau affiché suit le repère du serveur ; après une synchro, les deux pouvaient différer de quelques
             * dixièmes de seconde (la barre repartait de zéro 0,4 à 0,8 s AVANT que le numéro de niveau change). Dès que l'écart dépasse 80 ms (5 % du cycle), la barre se cale sur le repère.
             */
            const anim=el.__idleAugAnimationV217;
            if(anim&&anim.playState==='running'){
              const cible=Math.max(0,Math.min(.999999,Number(progress)||0))*duration;
              const actuel=(Number(anim.currentTime)||0)%duration;
              let ecart=cible-actuel;
              if(ecart>duration/2)ecart-=duration;else if(ecart<-duration/2)ecart+=duration;
              if(Math.abs(ecart)>Math.max(80,duration*0.05))anim.currentTime=cible;
            }
          }
        }

      /* Étape extraite de mettreAJourJeuIdleLocalV7_ (découpage d'une très grande fonction, 2026-10-16) : 130 lignes. */
      function mettreAJourJeuIdleLocalV7__p16(dpsBase, dt, maintenantTick){
        if(
          REG.idleEtat.combatBossActif &&
          REG.idleCombatArmeLocalV206 &&
          !REG.idleVictoireBossLocaleV49
        ){
          traiterCapacitesBossLocalesIdleV70_(
            maintenantTick
          );

          const effetsMagie=
            REG.idleEtat.magie&&
            REG.idleEtat.magie.effets
              ?REG.idleEtat.magie.effets
              :{};

          const immuniseParalysie=
            maintenantTick<
            idleNombre_(
              effetsMagie.immuniteParalysieJusqua
            );

          const paralyse=
            (
              maintenantTick<
              REG.idleParalysieJusquaV70
            ) &&
            !immuniseParalysie;

          const bouclierActif=
            maintenantTick<
            REG.idleBouclierJusquaV70;

          let multiplicateurMagieDps=1;

          if(
            maintenantTick<
            idleNombre_(
              effetsMagie.bossVulnerableJusqua
            )
          ){
            multiplicateurMagieDps*=
              1+
              Math.max(
                0,
                idleNombre_(
                  effetsMagie.bossVulnerablePct
                )
              )/
              100;
          }

          const sceau=
            Array.isArray(
              REG.idleEtat.bossCapacites
            )
              ?REG.idleEtat.bossCapacites.find(
                  function(cap){
                    return String(
                      cap&&cap.type||''
                    ).toLowerCase()==='sceau';
                  }
                )
              :null;

          if(
            sceau &&
            idleEntier_(
              effetsMagie.sceauBriseBossNumero
            )!==
            idleEntier_(
              REG.idleEtat.bossSelection
            )
          ){
            multiplicateurMagieDps*=
              Math.max(
                .05,
                1-
                Math.max(
                  0,
                  Math.min(
                    95,
                    idleNombre_(
                      sceau.valeur
                    )
                  )
                )/
                100
              );
          }

          const dpsAvantRegenBoss=
            dpsBase*
            (
              bouclierActif
                ?Math.max(
                    .05,
                    1-
                    REG.idleBouclierReductionV70/
                    100
                  )
                :1
            )*
            multiplicateurMagieDps;

          const dps=
            paralyse
              ?0
              :Math.max(
                  0,
                  dpsAvantRegenBoss-
                  Math.max(
                    0,
                    idleNombre_(
                      REG.idleEtat.regenBoss
                    )
                  )
                );
          mettreAJourJeuIdleLocalV7__p8(dps, dt, effetsMagie, maintenantTick);

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-46 */

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-47 */
            /*
             * Un boss tué dans CE tick ne riposte plus (Norman, 2026-10-02 : « le boss recule après sa mort »). Avant, le même tick enregistrait la victoire PUIS la
             * défaite du joueur (quand les coups du boss auraient aussi tué un joueur à très peu de PV) : l'ordre « défaite » remplaçait l'ordre « démarrer le combat »
             * encore en file (une seule action `combat` à la fois), donc le serveur ne faisait jamais le combat, ne voyait jamais la victoire, et au bout de la garde de
             * 15 s ramenait le boss précédent à pleine vie.
             */
            mettreAJourJeuIdleLocalV7__p9(dt, effetsMagie, maintenantTick);
        }
      }

      function mettreAJourJeuIdleLocalV7_(){
        if(
          !REG.idleEtat ||
          PAGE_ACTIVE!=='idle'
        ){
          return;
        }

        const maxTotal=
          idleNombre_(
            REG.idleEtat.energieMax
          );

        /*
         * Entier (Norman, 2026-10-02 : « 🔋 Reste à générer : 0 · ⏱ Pleine dans 1 s se met à clignoter très vite quand tout est généré »). Une allocation
         * décimale (Time Machine, Max…) rendait ce plafond décimal (ex. 1234,6) : l'énergie, toujours arrondie à l'entier, valait 1234 puis 1234,6 puis 1234
         * à chaque image -- le compteur alternait donc entre « pleine » et « reste 0 ». Énergie et plafond sont maintenant tous deux entiers.
         */
        const max=
          Math.max(
            0,
            Math.floor(
              maxTotal-
              totalAllocationBasicTrainingIdleV120_()-
              allocationMetaEnergieIdleV1_()+
              1e-9
            )
          );

        const prod=
          Math.max(
            0,
            idleNombre_(
              REG.idleEtat.productionSeconde
            )
          );

        const maintenantTick=
          Date.now();

        const ecouleBasicTrainingMs=
          Math.max(
            0,
            Math.min(
              IDLE_BASIC_TRAINING_RATTRAPAGE_MAX_MS_V166,
              maintenantTick-
              idleDernierTickBasicTrainingV166
            )
          );

        idleDernierTickBasicTrainingV166=
          maintenantTick;

        const ecouleTickMs=
          Math.max(
            0,
            Math.min(
              1000,
              maintenantTick-
              REG.idleDernierTickLocalV40
            )
          );

        REG.idleDernierTickLocalV40=
          maintenantTick;

        const dt=
          ecouleTickMs/
          1000;

        /*
         * Vie qui recule d'une fraction de seconde (Norman, 2026-10-20 : « ma vie est passée de 1.19Tg à 1.20Tg et est revenue à 1.19 »). L'entraînement local déduit défense et VIE MAX des multiplicateurs de combat
         * (attaque x10 pour la vie) ; il passait AVANT leur mise à jour par la trajectoire : après chaque réponse du moteur, ces multiplicateurs étaient ceux de l'instant où le moteur avait commencé son calcul (en retard
         * de 0,1 à 0,3 s), la vie max retombait donc d'un cran pour une image, puis remontait à l'image suivante. La trajectoire est maintenant appliquée D'ABORD (et dès le remplacement de l'état, voir soreal-idle-ui.js).
         */
        appliquerTrajectoireStatsIdleV1_();

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-32 */
        progresserBasicTrainingLocalIdleV120_(
          ecouleBasicTrainingMs/
          1000
        );

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-33 */
        patcherResumeStatsIdleV28_(
          REG.idleEtat
        );

        progresserZoneFightLocalIdleV1_(
          maintenantTick,
          dt
        );

        const metaTickEnergie=
          metaTickEnergieIdleV114_();

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-34 */
        const energieAvantTick=
          Math.max(
            0,
            idleNombre_(REG.idleEtat.energie)
          );

        const energieAuPlafond=
          energieAvantTick>=max;

        if(energieAuPlafond){
          REG.idleResteTickEnergieMsV114=0;
        }else{
          REG.idleResteTickEnergieMsV114+=
            ecouleTickMs;
        }

        const ticksEnergie=
          energieAuPlafond
            ?0
            :Math.max(
                0,
                Math.floor(
                  (
                    REG.idleResteTickEnergieMsV114+
                    1e-7
                  )/
                  metaTickEnergie.dureeMs
                )
              );

        mettreAJourJeuIdleLocalV7__p1(energieAvantTick, max, metaTickEnergie, ticksEnergie);

        /*
         * Norman (2026-09-29) : même remplissage au compte-goutte pour la Magie -- mêmes calculs que
         * l'Énergie ci-dessus, mais sur idleEtat.systemes.resources.magic.current (jamais de champ
         * plat idleEtat.magie*, déjà pris par l'ancien système de sorts). Le plafond de croissance
         * local est current+freeCapacity (resourceBudget.magic, déjà fourni par le serveur) : freeCapacity
         * inclut déjà l'allocation, jamais recalculée ici.
         *
         * Garde resourceInfo.magic (jamais juste resources.magic/resourceBudget.magic) : la snapshot
         * serveur expose TOUJOURS resources.magic/resourceBudget.magic, même Magie verrouillée (Blood
         * Magic non débloquée) -- seul resourceInfo.magic est filtré par le serveur selon le
         * déblocage. Sans cette garde, un joueur sans Blood Magic verrait sa Magie avancer toute seule
         * en fond, au taux de repli 0.25/s de metaTickMagieIdleV1_ (aucune production réelle).
         */
        mettreAJourJeuIdleLocalV7__p2(ecouleTickMs);

        actualiserManaSortsIdleV90_(
          maintenantTick
        );

        actualiserCooldownBossIdleV100_(
          maintenantTick
        );

        actualiserCooldownAventureIdleV100_(
          heureServeurIdleV1_()
        );


        actualiserEffetsVisuelsJoueurIdleV112_(
          maintenantTick
        );

        assurerBarreMagicPersistanteIdleV1_();
        assurerPisteMagicTimeMachineIdleV1_();
        actualiserCompteReboursTimeMachineIdleV1_();

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-35 */
        mettreAJourJeuIdleLocalV7__p3(dt);

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-36 */
        mettreAJourJeuIdleLocalV7__p4(dt);

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-37 */
        if(!REG.idleEtat.combatBossActif){
          rafraichirCommandesFightBossIdleV167_();
        }

        const energieEl=
          document.getElementById(
            'sorealIdleEnergieValeurV4'
          );

        if(energieEl){
          energieEl.textContent=texteEnergieGenereeIdleV1_();
        }

        const energieOverlayEl=
          document.getElementById(
            'sorealIdleEnergyOverlayV1'
          );

        if(energieOverlayEl){
          energieOverlayEl.textContent=
            formatEnergieIdleV50_(
              energieDisponibleIdleV9_()
            )+
            ' / '+
            formatEntierLisibleIdleV1_(maxTotal);
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-38 */
        const energyBarEl=
          document.getElementById(
            'sorealIdleEnergyBarV11'
          );

        if(energyBarEl){

          mettreAJourBarreProgressionContinueV1_(
            energyBarEl,
            energieDisponibleIdleV9_(),
            maxTotal
          );
        }

        /*
         * Barre de progression cyclique partagée (0 -> 100 % puis retour à 0, en boucle infinie tant
         * que la durée du cycle ne change pas) -- extraite le 2026-09-29 pour être réutilisée par
         * Blood Magic (Norman : « blood magic n'a pas de barre d'avancement comme dans NGU Idle »),
         * qui n'a qu'un seul rituel actif à la fois, contrairement à la boucle par def d'Augmentation
         * ci-dessous. Comportement inchangé pour Augmentation (Historique V8, bloc-41).
         */
        /*
         * Audit du menu Augmentations (Norman, 2026-10-05) : ce passage tourne plusieurs fois par seconde pour chaque barre ; il cherchait 4 éléments dans la page et réécrivait 3 textes À CHAQUE FOIS, même identiques
         * (chaque réécriture remplace le nœud de texte : ~190 modifications de page par seconde sans rien de nouveau, qui relançaient aussi les observateurs de la page). Les éléments sont gardés tant qu'ils sont dans la
         * page, et un texte n'est réécrit que s'il a changé.
         */
        /* elementAugIdleV1_ : remontée au niveau du module */
        /* Le message « il manque X Or » porte la somme dans une balise dorée (<b class="or-somme-v1">) : on le pose en HTML, et on compare à l'ancien texte posé (pas à innerHTML, que le navigateur reformule) pour ne pas le réécrire à chaque tick. */
        /* ecrireSiChangeIdleV1_ : remontée au niveau du module */
        /*
         * `tenir` (Augments, Norman 2026-10-05 : « plus jamais de barre qui fait marche arrière quand le calcul de l'Or se fait ») : sur un cycle long, la barre s'arrête PLEINE au bout (fill forwards) au lieu de boucler. Bouclée, elle
         * repartait à zéro d'elle-même (l'animation du navigateur, sans attendre le jeu) un instant avant que le jeu constate qu'il manque de l'Or et la remette pleine : on voyait la barre tomber à zéro puis remonter. Une barre qui
         * a fini son cycle et dont le jeu en démarre un nouveau (niveau validé) est recréée ; les rituels de Blood Magic, eux, bouclent toujours (même durée à chaque tour).
         */
        /* animerBarreCycliqueIdleV217_ : remontée au niveau du module */

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-39 */
        /*
         * Norman (2026-10-03) : « le compteur de Blood Magic s'arrête (27 s) alors que la barre avance. TOUS LES COMPTEURS doivent être très précis. » Chaque synchro remplace l'état
         * (idleEtat=joueurServeur) : les repères visuels posés au dernier rendu (barres et comptes à rebours) disparaissaient, le texte n'était plus rafraîchi alors que la barre,
         * animée par le navigateur, continuait. On les reporte sur le nouvel état tant que la page ne les a pas redessinés (même horloge, donc aucun saut).
         */
        ['__augmentationsVisualV215','__bloodMagicVisualV1'].forEach(function(cle){
          if(REG.idleEtat[cle]===undefined){if(idleRepereVisuelsV1_[cle]!==undefined)REG.idleEtat[cle]=idleRepereVisuelsV1_[cle];}
          else idleRepereVisuelsV1_[cle]=REG.idleEtat[cle];
        });
        /* « machine » (Time Machine) : sa barre de l'Or tique de plus en plus vite quand le niveau de vitesse monte ; sans synchro périodique, il fallait changer de menu pour le voir (Norman, 2026-10-11). Les chiffres sont mis à jour EN PLACE à chaque synchro. */
        if((REG.IDLE_MENUS_VIVANTS_V1[REG.idleMenuActifV28]||REG.idleMenuActifV28==='tower'||REG.idleMenuActifV28==='machine')&&PAGE_ACTIVE==='idle'&&Date.now()-idleMenuViveSyncV1>(typeof window!=='undefined'&&window.__SOREAL_IDLE_DELAI_SYNC_V1__?window.__SOREAL_IDLE_DELAI_SYNC_V1__(4000):4000)&&!champSaisieActifIdleV1_()){
          idleMenuViveSyncV1=Date.now();
          synchroniserJeuIdleV7_(true);
        }
        /*
         * Or EN DIRECT (Norman, 2026-10-10 : « les soustractions d'Or posent problème dans tous les menus qui en demandent : un petit retour en arrière, un temps d'arrêt, ou la mauvaise piste qui prend le niveau ; le contrôle de l'Or ne
         * se fait pas assez vite »). Le client retirait bien l'Or de chaque niveau acheté, mais ne le REMPLISSAIT jamais entre deux synchros : il croyait en manquer (barre pleine, « en attente d'Or ») alors que la machine en avait déjà
         * produit, puis la synchro suivante rendait l'Or et faisait sauter les niveaux. L'Or gagné par seconde (Or net de la machine) est maintenant ajouté localement à chaque tick, comme l'énergie ; la synchro ne fait que confirmer.
         */
        mettreAJourJeuIdleLocalV7__p5();
        /* Attaque et défense du combat : valeurs de la trajectoire du serveur à cet instant, quel que soit le menu ouvert (tous les systèmes). */
        appliquerTrajectoireStatsIdleV1_();
        const augVisual=REG.idleEtat.__augmentationsVisualV215;
        const niveauxAugmentsLocaux={};
        mettreAJourJeuIdleLocalV7__p6(augVisual, niveauxAugmentsLocaux);

        /*
         * Blood Magic : barre de progression du rituel actif vers sa prochaine complétion (Norman,
         * 2026-09-29 : « blood magic n'a pas de barre d'avancement comme dans NGU Idle »). Un seul
         * rituel progresse réellement à la fois (bloodMagicViewV1, idle-ngu-progression.js) : un seul
         * élément à patcher, jamais une boucle par rituel comme Augmentation.
         */
        const bloodVisuels=REG.idleEtat.__bloodMagicVisualV1;
        mettreAJourJeuIdleLocalV7__p7(bloodVisuels);

        const summaryEnergieEl=
          document.getElementById(
            'sorealIdleSummaryEnergieV50'
          );

        if(summaryEnergieEl){
          summaryEnergieEl.textContent=
            formatEnergieIdleV50_(
              energieDisponibleIdleV9_()
            )+
            ' / '+
            formatEntierLisibleIdleV1_(maxTotal);
        }


        const vitesseEl=
          document.getElementById(
            'sorealIdleEnergySpeedV34'
          );

        if(vitesseEl){
          vitesseEl.textContent=texteNiveauParSecondeIdleV1_(REG.idleEtat&&REG.idleEtat.productionSeconde);
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-42 */
        const dpsBase=
          Math.max(
            0,
            idleNombre_(
              REG.idleEtat.puissance
            )-
            idleNombre_(
              REG.idleEtat.defenseBoss
            )
          );

        mettreAJourJeuIdleLocalV7__p16(dpsBase, dt, maintenantTick);

        mettreAJourJeuIdleLocalV7__p10(maintenantTick);

        const joueurPvEl=
          document.getElementById(
            'sorealIdleJoueurPvV15'
          );

        mettreAJourJeuIdleLocalV7__p11(joueurPvEl);

        const joueurBarre=
          document.getElementById(
            'sorealIdleJoueurBarV15'
          );

        mettreAJourJeuIdleLocalV7__p12(joueurBarre);

        /* Bandeau du haut : la Vie est TOUJOURS celle de Fight Boss, sur toutes les pages (Aventure comprise), mise à jour à chaque tick avec les mêmes valeurs (régénération comprise). */
        {
          majHudPvIdleV2_(
            REG.idleEtat.pvJoueur,
            REG.idleEtat.pvJoueurMax,
            regenPvFightBossNguParSecondeV164_(REG.idleEtat.defense)
          );
        }


        const bossPvEl=
          document.getElementById(
            'sorealIdleBossPvV7'
          );

        mettreAJourJeuIdleLocalV7__p13(bossPvEl);

        const barre=
          document.getElementById(
            'sorealIdleBossBarV7'
          );

        mettreAJourJeuIdleLocalV7__p14(barre);

        actualiserAmbianceCombatIdleV1_();
        actualiserDisponibiliteMoneyPitNavIdleV1_();

        const aFight=
          aventureMetaIdleV47_(REG.idleEtat);

        const fight=
          aFight&&aFight.fight;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-55 */
        const panneauJoueurEl=
          document.querySelector(
            '.soreal-idle-adventure-player-panel-v1'
          );

        const noteOuBoutonEl=
          panneauJoueurEl?panneauJoueurEl.nextElementSibling:null;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-56 */
        mettreAJourJeuIdleLocalV7__p15(aFight, fight, noteOuBoutonEl);
      }

      function assurerBarreMagicPersistanteIdleV1_(){
        if(!REG.idleEtat||!REG.idleEtat.systemes)return;
        const infoMagic=
          REG.idleEtat.systemes.resourceInfo&&
          REG.idleEtat.systemes.resourceInfo.magic;

        if(!infoMagic)return;

        if(!document.getElementById('sorealIdleMagicBarV1')){
          /* Au plus un rendu de secours par seconde (audit du 2026-10-10, IDLE-AUDIT-FE-014) : ce garde-fou, appelé à chaque tick, pouvait sinon redessiner toute la page jusqu'à 15 fois par seconde si la barre manquait. */
          const maintenant=Date.now();
          if(maintenant-(assurerBarreMagicPersistanteIdleV1_.dernier||0)<1000)return;
          assurerBarreMagicPersistanteIdleV1_.dernier=maintenant;
          rendreIdleEtat_({
            ok:true,
            joueur:REG.idleEtat
          });
        }
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-80 */
      /*
       * Barre d'Énergie/Magie — Norman (2026-09-25) voulait un « vrai tic » qui tape le cap puis
       * repart instantanément (largeurTickEnergieIdleV1_, retiré). Norman (2026-09-29, revirement
       * assumé, même principe déjà admis pour la barre d'XP de Basic Training le 2026-09-17) :
       * « Je ne veux plus qu'elle tique !!! elle doit simplement se remplir et se vider quand on
       * place de l'énergie. Aucune animation de tique par seconde. » La largeur est donc désormais
       * posée directement à partir de la valeur RÉELLEMENT connue (aucune interpolation de tick
       * inventée côté client) ; la transition CSS de .soreal-idle-energybar-v11
       * (transition:width .12s linear, soreal-idle-ui.css) fait tout le lissage visuel.
       */
      function mettreAJourBarreProgressionContinueV1_(
        element,
        valeurActuelle,
        valeurMax
      ){
        if(!element)return;

        const max=
          Math.max(
            0,
            idleNombre_(valeurMax)
          );

        if(max<=0){
          largeurBarreCombatIdleV121_(element,0);
          return;
        }

        const valeur=
          Math.max(
            0,
            Math.min(
              max,
              idleNombre_(valeurActuelle)
            )
          );

        largeurBarreCombatIdleV121_(
          element,
          valeur/max*100
        );
      }

      function demarrerTickerIdle_(){
        if(idleTimerEnergie){
          clearInterval(idleTimerEnergie);
          idleTimerEnergie=null;
        }
        if(idleAnimationFrameJeuV214){
          cancelAnimationFrame(idleAnimationFrameJeuV214);
          idleAnimationFrameJeuV214=0;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-81 */
        /*
         * iPhone/Safari : la boucle visible tournait auparavant au rythme natif
         * de requestAnimationFrame (souvent 60 Hz) alors que les barres du jeu
         * sont conçues pour ~15 tics/s. Le calcul reste basé sur le temps réel
         * écoulé (dt), donc plafonner les mises à jour lourdes à 15 Hz réduit
         * fortement les lectures/écritures DOM sans ralentir la progression.
         */
        let dernierFrameJeuVisibleV214=0;
        /*
         * 60 images par seconde (Norman, 2026-10-19 : « tout doit être en 60 FPS »). Le plafond de 15 Hz ci-dessous reste le PLANCHER : celui des appareils lents (iPhone, vieux
         * téléphones). Tant que le calcul d'un tick coûte peu (moyenne glissante mesurée sur CET appareil), le jeu le refait à CHAQUE image (barres, compteurs, PV) ; s'il
         * coûte plus, il passe à 30 images par seconde, puis revient à 15. dt reste le temps réel écoulé : la progression ne dépend jamais de la cadence.
         */
        const intervalleFrameJeuVisibleV214=1000/15;
        let coutTickMsV1=1;
        function intervalleAdaptatifJeuV1_(){
          if(coutTickMsV1<4.5)return 0;
          if(coutTickMsV1<9)return 1000/30-3;
          return intervalleFrameJeuVisibleV214;
        }
        function frameJeuV214_(timestamp){
          const maintenantFrame=
            Number.isFinite(Number(timestamp))
              ?Number(timestamp)
              :(typeof performance!=='undefined'&&performance.now?performance.now():Date.now());

          if(
            !dernierFrameJeuVisibleV214 ||
            maintenantFrame-dernierFrameJeuVisibleV214>=intervalleFrameJeuVisibleV214 ||
            maintenantFrame-dernierFrameJeuVisibleV214>=intervalleAdaptatifJeuV1_()
          ){
            dernierFrameJeuVisibleV214=maintenantFrame;
            const debutTickV1=(typeof performance!=='undefined'&&performance.now)?performance.now():0;
            /* audit 2026-10-13 : une exception dans un tick ne doit pas arrêter toute la boucle visible (le rAF est ré-armé même en cas d'erreur) */
            try{
              mettreAJourJeuIdleLocalV7_();
              if(debutTickV1)coutTickMsV1=coutTickMsV1*0.9+Math.min(50,performance.now()-debutTickV1)*0.1;
            }catch(erreurTickV1){
              try{console.error('[IDLE] tick local',erreurTickV1);}catch(_e){}
            }
          }

          if(PAGE_ACTIVE==='idle'){
            idleAnimationFrameJeuV214=requestAnimationFrame(frameJeuV214_);
          }else{
            idleAnimationFrameJeuV214=0;
          }
        }
        frameJeuV214_();

        /*
         * Norman (2026-09-27) : « Le mode aventure doit continuer à farmer des objets quand l'application est en
         * fond. » requestAnimationFrame est entièrement SUSPENDU par le navigateur dès que l'onglet devient
         * invisible (garanti par la spec, jamais un simple ralentissement) : tout le tick de jeu local (combat
         * auto d'Aventure, Fight Boss...) s'arrêtait donc net en arrière-plan, alors que la session reste bien
         * active (ce n'est pas "hors ligne" : l'app tourne toujours, juste cachée). Un setInterval, lui, continue
         * de se déclencher en arrière-plan (ralenti par le navigateur, jamais suspendu comme rAF) : il prend le
         * relais du même tick UNIQUEMENT pendant que l'onglet est caché, jamais en double avec rAF quand il est
         * visible.
         */
        if(idleTimerJeuArrierePlanV1){
          clearInterval(idleTimerJeuArrierePlanV1);
          idleTimerJeuArrierePlanV1=0;
        }
        idleTimerJeuArrierePlanV1=setInterval(function(){
          if(document.hidden&&PAGE_ACTIVE==='idle'){
            try{mettreAJourJeuIdleLocalV7_();}catch(erreurTickV1){try{console.error('[IDLE] tick local (arrière-plan)',erreurTickV1);}catch(_e){}}
          }
        },1000);

        /*
         * Retour sur l'onglet / l'appli (Norman, 2026-10-03 : audit réactivité) : caché, le navigateur ralentit les minuteries (jusqu'à 1 par minute) ; le tick local est plafonné à 1 s par passage.
         * Au retour, barres et chronos étaient en retard jusqu'à la prochaine synchro (15 s ou plus). On resynchronise tout de suite : l'état du serveur, lui, a bien avancé.
         */
        if(!window.__sorealIdleRetourOngletV1){
          window.__sorealIdleRetourOngletV1=true;
          let dernierRetourV1=0;
          const auRetourV1=function(){
            if(document.hidden||PAGE_ACTIVE!=='idle'||!REG.idleEtat||!SOREAL_SESSION)return;
            if(Date.now()-dernierRetourV1<2000)return;
            dernierRetourV1=Date.now();
            REG.idleDernierTickLocalV40=Date.now();
            synchroniserJeuIdleV7_(true);
          };
          document.addEventListener('visibilitychange',auRetourV1);
          window.addEventListener('pageshow',auRetourV1);
          window.addEventListener('focus',auRetourV1);
        }

        if(
          window.__sorealIdleSyncTimerV7
        ){
          clearInterval(
            window.__sorealIdleSyncTimerV7
          );
        }

        /* Jeu local (Norman, 2026-10-19) : le moteur est dans la page, une synchro ne coûte que ~50 ms sans réseau : la cadence de fond (15 s par défaut) est divisée par 10. */
        window.__sorealIdleSyncTimerV7=
          setInterval(
            synchroniserJeuIdleV7_,
            (typeof window!=='undefined'&&window.__SOREAL_IDLE_DELAI_SYNC_V1__?window.__SOREAL_IDLE_DELAI_SYNC_V1__(Math.max(5,idleNombre_(REG.idleEtat&&REG.idleEtat.syncSecondes)||15)*1000):Math.max(5,idleNombre_(REG.idleEtat&&REG.idleEtat.syncSecondes)||15)*1000)
          );

        /*
         * Stats à jour PENDANT un combat (Norman, 2026-10-03 : « quand je tue un boss ça ne passe pas directement au suivant ; les niveaux des Augmentations ne sont pris en compte qu'au moment d'appuyer
         * sur Fight, et les PV ne se mettent à jour qu'à ce moment-là »). Les Augmentations montent côté serveur (jusqu'à 50 niveaux par seconde) mais le client ne reçoit leurs effets qu'à la synchro :
         * toutes les 15 s, son combat prédit tournait avec des stats périmées, le serveur (plus fort) tuait le boss avant lui et l'écran n'avançait qu'à la synchro suivante. Pendant un combat de
         * Fight Boss, on se resynchronise donc toutes les 4 s.
         */
        if(window.__sorealIdleSyncCombatV1)clearInterval(window.__sorealIdleSyncCombatV1);
        window.__sorealIdleSyncCombatV1=setInterval(function(){
          if(document.hidden||PAGE_ACTIVE!=='idle'||!REG.idleEtat||!SOREAL_SESSION)return;
          if(REG.idleMenuActifV28!=='combat'||!REG.idleEtat.combatBossActif)return;
          if(typeof idleFastPendingV60_==='function'&&idleFastPendingV60_())return;
          synchroniserJeuIdleV7_();
        },(typeof window!=='undefined'&&window.__SOREAL_IDLE_DELAI_SYNC_V1__?window.__SOREAL_IDLE_DELAI_SYNC_V1__(4000):4000));
      }

      let idleCombatLogCritiquesJoueurV117=0;

      let idleCombatLogCritiquesBossV117=0;

      function actualiserEffetsVisuelsJoueurIdleV112_(
        maintenant
      ){
        const host=
          document.getElementById(
            'sorealIdlePlayerImageHostV43'
          );

        if(!host)return;

        let fx=
          document.getElementById(
            'sorealIdlePlayerStatusFxV112'
          );
        let badges=
          document.getElementById(
            'sorealIdlePlayerStatusBadgesV112'
          );

        if(!fx){
          fx=document.createElement('div');
          fx.id='sorealIdlePlayerStatusFxV112';
          fx.className='soreal-idle-status-fx-wrap-v112';
          host.appendChild(fx);
        }

        if(!badges){
          badges=document.createElement('div');
          badges.id='sorealIdlePlayerStatusBadgesV112';
          badges.className='soreal-idle-status-badges-v112';
          host.appendChild(badges);
        }

        const effetsMagie=
          REG.idleEtat&&
          REG.idleEtat.magie&&
          REG.idleEtat.magie.effets
            ?REG.idleEtat.magie.effets
            :{};

        const immuniseParalysie=
          maintenant<
          idleNombre_(
            effetsMagie.immuniteParalysieJusqua
          );

        const actifs=[];

        if(
          !immuniseParalysie &&
          maintenant<REG.idleParalysieJusquaV70
        ){
          actifs.push({
            type:'paralysie',
            emoji:'⚡',
            nom:'Paralysé',
            fin:REG.idleParalysieJusquaV70
          });
        }

        [
          ['gel','❄️','Gelé'],
          ['feu','🔥','Brûlure'],
          ['poison','☠️','Poison'],
          ['stun','💫','Étourdi']
        ].forEach(function(def){
          const fin=
            idleNombre_(
              REG.idleEffetsVisuelsJoueurV112[def[0]]
            );

          if(maintenant<fin){
            actifs.push({
              type:def[0],
              emoji:def[1],
              nom:def[2],
              fin:fin
            });
          }else if(fin>0){
            REG.idleEffetsVisuelsJoueurV112[def[0]]=0;
          }
        });

        const bouclierFin=
          Math.max(
            0,
            idleNombre_(
              effetsMagie.bouclierJusqua
            )
          );

        if(maintenant<bouclierFin){
          actifs.push({
            type:'bouclier',
            emoji:'🛡️',
            nom:'Bouclier',
            fin:bouclierFin
          });
        }

        const signature=
          actifs.map(function(a){
            return a.type+':'+
              Math.max(
                0,
                Math.ceil(
                  (a.fin-maintenant)/250
                )
              );
          }).join('|');

        if(signature===REG.idleEffetsSignatureV112){
          return;
        }

        REG.idleEffetsSignatureV112=signature;

        fx.innerHTML=
          actifs.map(function(a){
            return '<div class="soreal-idle-status-fx-v112 '+
              idleHtml_(a.type)+
              '"></div>';
          }).join('');

        badges.innerHTML=
          actifs.map(function(a){
            const restant=
              Math.max(
                0,
                (a.fin-maintenant)/1000
              );

            return '<span class="soreal-idle-status-chip-v112">'+
              idleHtml_(a.emoji+' '+a.nom+' '+restant.toFixed(1).replace('.',',')+' s')+
              '</span>';
          }).join('');
      }

      function motDegatIdleV100_(valeur){const api=window.__SOREAL_IDLE_TEXT_HELPERS_V1__;return api&&typeof api.motDegat==='function'?api.motDegat(valeur):(idleNombre_(valeur)>1.0001?'dégâts':'dégât');}

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-144 */
      const IDLE_VERBES_DEGATS_V142_=[
        {seuil:10,mots:['chatouille','titille']},
        {seuil:200,mots:['frappe','tape sur']},
        {seuil:1000,mots:['cogne','tabasse']},
        {seuil:1e4,mots:['défonce','démolit']},
        {seuil:1e6,mots:['explose','fait exploser']},
        {seuil:1e9,mots:['pulvérise','réduit en miettes']},
        {seuil:1e12,mots:['désintègre','compacte']},
        {seuil:1e15,mots:['vaporise','envoie au tri sélectif définitif']},
        {seuil:1e18,mots:['ANÉANTIT','EXPÉDIE DIRECT AU RECYCLAGE FINAL']},
        {seuil:1e21,mots:['ENVOIE EN ORBITE','LIVRE EN PIÈCES DÉTACHÉES']},
        {seuil:Infinity,mots:['EFFACE DE L’EXISTENCE','SCANNE, DÉCLASSE ET SUPPRIME DE L’UNIVERS']}
      ];

      function verbeDegatIdleV142_(
        valeur
      ){
        const n=
          idleNombre_(valeur);

        for(
          let i=0;
          i<IDLE_VERBES_DEGATS_V142_.length;
          i++
        ){
          const palier=
            IDLE_VERBES_DEGATS_V142_[i];

          if(n<palier.seuil){
            const mots=
              palier.mots;

            return mots[
              Math.floor(
                Math.random()*
                mots.length
              )
            ];
          }
        }

        return 'inflige';
      }

      function motBloqueIdleV100_(
        valeur
      ){
        return idleNombre_(valeur)>1.0001
          ?'bloqués'
          :'bloqué';
      }

      function multiplicateurFureurLocaleIdleV70_(){
        if(!REG.idleEtat)return 1;

        const caps=
          Array.isArray(
            REG.idleEtat.bossCapacites
          )
            ?REG.idleEtat.bossCapacites
            :[];

        let mult=1;

        caps.forEach(
          function(cap){
            if(
              String(
                cap.type||''
              ).toLowerCase()==='fureur'
            ){
              mult*=
                1+
                Math.max(
                  0,
                  idleNombre_(
                    cap.valeur
                  )
                )/
                100;
            }
          }
        );

        return mult;
      }

      function actualiserXpLocaleIdleV70_(
        gain
      ){
        if(
          !REG.idleEtat ||
          idleNombre_(gain)<=0
        ){
          return;
        }

        let xp=
          Math.max(
            0,
            idleNombre_(
              REG.idleEtat.xp
            )+
            idleNombre_(
              gain
            )
          );

        let niveau=
          Math.max(
            1,
            idleEntier_(
              REG.idleEtat.niveau
            )
          );

        let niveaux=0;

        while(
          xp>=niveau*100 &&
          niveaux<100
        ){
          xp-=niveau*100;
          niveau+=1;
          niveaux+=1;
        }

        REG.idleEtat.xp=xp;
        REG.idleEtat.niveau=niveau;
        REG.idleEtat.xpRequise=
          niveau*100;

        const texte=
          document.getElementById(
            'sorealIdleXpTexteV70'
          );

        const fill=
          document.getElementById(
            'sorealIdleXpFillV70'
          );

        const niveauEl=
          document.getElementById(
            'sorealIdleXpNiveauV70'
          );

        if(texte){
          texte.textContent=
            formatGrandNombreIdleV70_(xp)+
            ' / '+
            formatGrandNombreIdleV70_(
              niveau*100
            )+
            ' XP';
        }

        if(fill){
          fill.style.width=
            Math.max(
              0,
              Math.min(
                100,
                xp/(niveau*100)*100
              )
            )+
            '%';
        }

        if(niveauEl){
          niveauEl.textContent=
            String(niveau);
        }

        if(niveaux>0){
          ajouterLogCombatIdleV70_(
            'reward',
            '⭐ NIVEAU SUPÉRIEUR ! Niveau '+
            niveau+
            '.'
          );

          const panel=
            document.querySelector(
              '.soreal-idle-xp-panel-v70'
            );

          if(panel){
            panel.classList.remove(
              'soreal-idle-levelup-flash-v70'
            );
            void panel.offsetWidth;
            panel.classList.add(
              'soreal-idle-levelup-flash-v70'
            );
          }

          setTimeout(
            function(){
              gererPopupsProgressionIdleV75_(
                REG.idleEtat
              );
              gererTutorielPremierBossIdleV1_(
                REG.idleEtat
              );
            },
            0
          );
        }
      }

      /* Dernière resynchronisation demandée par une barre d'Augmentation pleine (anti-rafale). */
      let idleAugSyncV1=0;

      /*
       * Menus « à l'ancienne » (NGU, Wandoos, Yggdrasil, Gold Diggers, Barbes, Souhaits, Hacks, Garderie) : leurs chiffres ne venaient que de la synchro (toutes les 15 s, sinon à la prochaine visite)
       * et restaient figés devant le joueur (Norman, 2026-10-05 : « tout doit se passer en direct »). Tant que l'un d'eux est ouvert, une synchro part toutes les 4 s et la page est redessinée à l'arrivée
       * (sans toucher à la position de défilement, et jamais pendant qu'un champ de saisie a le focus).
       */
      let idleMenuViveSyncV1=0;

      function champSaisieActifIdleV1_(){
        if(REG.idlePointeurEnfonceV1&&Date.now()-REG.idlePointeurEnfonceV1<3000)return true;
        const a=document.activeElement;
        if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))return true;
        /* Un champ modifié mais pas encore validé (ITOPOD : étages tapés ou réglés avec − et +) ne doit jamais être remis à zéro par un redessin. */
        const racine=document.querySelector('.soreal-idle-page-root-v28');
        if(!racine)return false;
        const champs=racine.querySelectorAll('input,textarea,select');
        for(let i=0;i<champs.length;i+=1){
          const c=champs[i];
          if(c.type==='checkbox'||c.type==='radio'){if(c.checked!==c.defaultChecked)return true;}
          else if(c.type!=='button'&&c.type!=='submit'&&c.value!==c.defaultValue)return true;
        }
        return false;
      }

      function restPvInitialIdleV1_(pvMax){
        const memo=REG.idleAdventureRestPvMemoV1;
        if(memo==null||!Number.isFinite(memo))return pvMax;
        return Math.min(pvMax,Math.max(0,memo));
      }

      function nettoyerImpactsIdleV50_(){
        [
          'sorealIdleBossImageHostV36',
          'sorealIdlePlayerImageHostV43'
        ].forEach(function(id){
          const el=
            document.getElementById(id);

          if(!el)return;

          el.classList.remove(
            'impact-boss-v46',
            'impact-joueur-v46'
          );
        });
      }

  Object.assign(REG,{
    mettreAJourBarreProgressionContinueV1_:mettreAJourBarreProgressionContinueV1_,
    demarrerTickerIdle_:demarrerTickerIdle_,
    multiplicateurFureurLocaleIdleV70_:multiplicateurFureurLocaleIdleV70_,
    champSaisieActifIdleV1_:champSaisieActifIdleV1_,
    restPvInitialIdleV1_:restPvInitialIdleV1_
  });
})();
