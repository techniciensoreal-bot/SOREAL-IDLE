/*
 * SOREAL IDLE — Entraînement de base (calculs locaux, envois, animations) (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_entrainement_v1)return;
  REG.__chargé_ui_entrainement_v1=true;

  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function idleNombre_(){return REG.idleNombre_.apply(null,arguments);}
  function allocationMetaEnergieIdleV1_(){return REG.allocationMetaEnergieIdleV1_.apply(null,arguments);}
  function formatGrandNombreIdleV70_(){return REG.formatGrandNombreIdleV70_.apply(null,arguments);}
  function rafraichirEnergieEtBoutonsIdleV9_(){return REG.rafraichirEnergieEtBoutonsIdleV9_.apply(null,arguments);}
  function pousserEtatVersRuntimePartageIdleV1_(){return REG.pousserEtatVersRuntimePartageIdleV1_.apply(null,arguments);}
  function synchroniserJeuIdleV7_(){return REG.synchroniserJeuIdleV7_.apply(null,arguments);}
  function planSynchroBasicTrainingIdleV1_(){return REG.planSynchroBasicTrainingIdleV1_.apply(null,arguments);}
  function messageFlottantIdleV32_(){return REG.messageFlottantIdleV32_.apply(null,arguments);}
  function jouerEffetAudioIdleV199_(){return REG.jouerEffetAudioIdleV199_.apply(null,arguments);}
  function formaterEtaTimeMachineIdleV1_(){return REG.formaterEtaTimeMachineIdleV1_.apply(null,arguments);}
  function planifierRenduOptimisteIdleV60_(){return REG.planifierRenduOptimisteIdleV60_.apply(null,arguments);}
  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function entetePageIdleV28_(){return REG.entetePageIdleV28_.apply(null,arguments);}

      function basicTrainingIdleV120_(){
        return REG.idleEtat&&
          REG.idleEtat.basicTraining&&
          typeof REG.idleEtat.basicTraining==='object'
            ?REG.idleEtat.basicTraining
            :null;
      }

      function skillBasicTrainingParIdIdleV120_(id){
        const bt=basicTrainingIdleV120_();

        return bt&&Array.isArray(bt.skills)
          ?bt.skills.find(function(x){
              return x&&x.id===String(id||'');
            })
          :null;
      }

      function totalAllocationBasicTrainingIdleV120_(){
        const bt=basicTrainingIdleV120_();

        return bt&&Array.isArray(bt.skills)
          ?bt.skills.reduce(function(total,x){
              return total+
                (
                  x&&x.unlocked
                    ?idleEntier_(x.allocation)
                    :0
                );
            },0)
          :0;
      }

      /*
       * Énergie libre COHÉRENTE avec ce que l'écran montre comme placé (Norman, 2026-10-04 : « le serveur n'avait que 45 472 d'énergie (l'écran en montrait 65 476) ; je ne veux pas ça, je veux que les chiffres soient justes »).
       * Les répartitions d'énergie partent au serveur par deux canaux indépendants (Basic Training, et tous les autres systèmes), chacun en différé : une réponse de l'un arrivait avec une énergie libre calculée sans ce que
       * l'écran venait de placer (ou de retirer) par l'autre, et l'écran affichait alors une énergie fausse que le serveur refusait ensuite. L'énergie totale générée est la même partout : libre + placé. L'énergie libre
       * affichée est donc celle du serveur, corrigée de l'écart entre ce que le serveur sait avoir placé et ce que l'écran a placé (Basic Training et autres systèmes).
       */
      function sommeAllocBasicTrainingJoueurIdleV1_(joueur){
        const bt=joueur&&joueur.basicTraining;
        return bt&&Array.isArray(bt.skills)?bt.skills.reduce(function(t,x){return t+(x&&x.unlocked?idleEntier_(x.allocation):0);},0):0;
      }

      function sommeAllocMetaJoueurIdleV1_(joueur){
        const liste=joueur&&joueur.systemes&&Array.isArray(joueur.systemes.systems)?joueur.systemes.systems:[];
        return liste.reduce(function(t,sys){return t+Math.max(0,idleNombre_(sys&&sys.state&&sys.state.allocation&&sys.state.allocation.energy));},0);
      }

      function energieLibreCoherenteIdleV1_(joueur){
        if(!joueur)return 0;
        const libreServeur=idleNombre_(joueur.energie);
        const ecartBT=sommeAllocBasicTrainingJoueurIdleV1_(joueur)-totalAllocationBasicTrainingIdleV120_();
        const ecartMeta=sommeAllocMetaJoueurIdleV1_(joueur)-allocationMetaEnergieIdleV1_();
        return Math.max(0,Math.floor(libreServeur+ecartBT+ecartMeta+1e-9));
      }

      function capBasicTrainingLocalIdleV120_(skill){
        if(!skill)return 1;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-10 */
        return Math.max(
          1,
          idleEntier_(
            skill.cap
          )||1
        );
      }

      function vitesseBasicTrainingLocalIdleV120_(skill){
        const bt=basicTrainingIdleV120_();

        if(
          !bt ||
          !skill ||
          !skill.unlocked
        ){
          return 0;
        }

        const cap=
          capBasicTrainingLocalIdleV120_(
            skill
          );

        return Math.max(
          0,
          idleNombre_(
            bt.maxLevelsPerSecond
          )||50
        )*
        Math.min(
          1,
          idleEntier_(
            skill.allocation
          )/
          Math.max(
            1,
            cap
          )
        );
      }

      function animerBarreBasicTrainingIdleV220_(bar,skill,vitesse){
        if(!bar)return;

        const speed=
          Math.max(
            0,
            Math.min(
              50,
              idleNombre_(vitesse)
            )
          );

        if(!(speed>0)){
          if(bar.__idleBtAnimationV220){
            bar.__idleBtAnimationV220.cancel();
            bar.__idleBtAnimationV220=null;
          }
          bar.style.setProperty('transition','none','important');
          bar.style.width='100%';
          bar.style.transformOrigin='left center';
          bar.style.transform='scaleX(0)';
          delete bar.dataset.idleBtDurationV220;
          return;
        }

        /*
         * 2026-09-25 (Norman : « dans NGU, quand une barre est CAP elle ne clignote plus : elle reste complètement remplie de sa couleur ; ex.
         * Attaque passive, barre rouge -> complètement rouge ») : énergie allouée >= cap = la barre se remplit à chaque tick (50 niveaux/s), soit
         * un remplissage permanent (le wiki NGU : « barre entièrement rouge » quand une compétence est speedcap). Plus d'animation en dents de scie.
         */
        if(
          skill&&
          idleEntier_(skill.allocation)>0&&
          idleEntier_(skill.allocation)>=Math.max(1,idleEntier_(skill.cap))
        ){
          if(bar.__idleBtAnimationV220){
            bar.__idleBtAnimationV220.cancel();
            bar.__idleBtAnimationV220=null;
          }
          bar.style.setProperty('transition','none','important');
          bar.style.width='100%';
          bar.style.transformOrigin='left center';
          bar.style.transform='scaleX(1)';
          delete bar.dataset.idleBtDurationV220;
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-11 */
        const duration=
          Math.max(
            20,
            1000/
            speed
          );

        const progress=
          Math.max(
            0,
            Math.min(
              .999999,
              idleNombre_(
                skill&&skill.progress
              )
            )
          );

        bar.style.setProperty('transition','none','important');
        bar.style.width='100%';
        bar.style.transformOrigin='left center';
        bar.style.willChange='transform';

        const ancienneDuree=
          idleNombre_(
            bar.dataset&&
            bar.dataset.idleBtDurationV220
          );

        if(
          !bar.__idleBtAnimationV220 ||
          Math.abs(ancienneDuree-duration)>.1
        ){
          if(bar.__idleBtAnimationV220){
            bar.__idleBtAnimationV220.cancel();
          }

          const animation=
            bar.animate(
              [
                {transform:'scaleX(0)',offset:0},
                {transform:'scaleX(0)',offset:.08},
                {transform:'scaleX(1)',offset:.72},
                {transform:'scaleX(1)',offset:.98},
                {transform:'scaleX(0)',offset:1}
              ],
              {
                duration:duration,
                iterations:Infinity,
                easing:'linear'
              }
            );

          animation.currentTime=
            progress*
            duration;

          bar.__idleBtAnimationV220=
            animation;

          bar.dataset.idleBtDurationV220=
            String(duration);
        }
      }

      function allocationsBasicTrainingIdleV120_(){
        const bt=basicTrainingIdleV120_();
        const result={};

        if(
          bt&&
          Array.isArray(bt.skills)
        ){
          bt.skills.forEach(function(skill){
            if(skill&&skill.id){
              result[skill.id]=
                idleEntier_(
                  skill.allocation
                );
            }
          });
        }

        return result;
      }

      /*
       * Audit de l'entraînement de base (Norman, 2026-10-05) : ce rafraîchissement tourne ~13 fois par seconde et réécrivait les 6 textes de chaque compétence à chaque passage, même identiques (chaque réécriture remplace
       * le nœud de texte : ~150 modifications de page par seconde sans rien de nouveau, qui relançaient aussi les observateurs de la page). Un texte n'est réécrit que s'il a changé.
       */
      function ecrireTexteSiChangeIdleV1_(el,texte){
        if(el&&el.textContent!==texte)el.textContent=texte;
      }

      function rafraichirBasicTrainingIdleV120_(){
        const bt=basicTrainingIdleV120_();

        if(!bt)return;

        const total=
          totalAllocationBasicTrainingIdleV120_();

        bt.energy=bt.energy||{};
        bt.energy.idle=
          idleEntier_(
            REG.idleEtat&&REG.idleEtat.energie
          );
        bt.energy.allocated=
          total;
        bt.energy.cap=
          idleEntier_(
            REG.idleEtat&&REG.idleEtat.energieMax
          );

        if(!Array.isArray(bt.skills)){
          return;
        }

        bt.skills.forEach(function(skill){
          if(!skill||!skill.id){
            return;
          }

          const level=
            document.getElementById(
              'sorealIdleBtLevelV120_'+
              skill.id
            );

          const allocation=
            document.getElementById(
              'sorealIdleBtAllocationV120_'+
              skill.id
            );

          const cap=
            document.getElementById(
              'sorealIdleBtCapV120_'+
              skill.id
            );

          const nextCap=
            document.getElementById(
              'sorealIdleBtNextCapV120_'+
              skill.id
            );

          const speed=
            document.getElementById(
              'sorealIdleBtSpeedV120_'+
              skill.id
            );

          const eta=
            document.getElementById(
              'sorealIdleBtEtaV120_'+
              skill.id
            );

          const bar=
            document.getElementById(
              'sorealIdleBtBarV120_'+
              skill.id
            );

          const capValeur=
            capBasicTrainingLocalIdleV120_(
              skill
            );

          const vitesse=
            vitesseBasicTrainingLocalIdleV120_(
              skill
            );

          skill.cap=
            capValeur;

          skill.levelsPerSecond=
            vitesse;

          if(level){
            ecrireTexteSiChangeIdleV1_(level,
              formatGrandNombreIdleV70_(
                skill.level
              ));
          }

          if(allocation){
            ecrireTexteSiChangeIdleV1_(allocation,
              formatEntierLisibleIdleV1_(
                skill.allocation
              )+
              ' ⚡');
          }

          if(cap){
            ecrireTexteSiChangeIdleV1_(cap,
              formatEntierLisibleIdleV1_(
                capValeur
              ));
          }

          if(nextCap){
            ecrireTexteSiChangeIdleV1_(nextCap,
              formatEntierLisibleIdleV1_(
                skill.nextCap||
                capValeur
              ));

            nextCap.classList.toggle(
              'ready',
              Boolean(
                skill.maxReductionReached
              )
            );
          }

          if(speed){
            ecrireTexteSiChangeIdleV1_(speed,
              vitesse
                .toFixed(2)
                .replace('.',',')+
              ' niv/s');
          }

          if(eta){
            ecrireTexteSiChangeIdleV1_(eta,
              texteEtaBasicTrainingIdleV1_(
                vitesse
              ));
          }

          if(bar){
            animerBarreBasicTrainingIdleV220_(
              bar,
              skill,
              vitesse
            );
          }
        });
      }

      function fusionnerBasicTrainingPlusAvanceIdleV166_(
        local,
        serveur
      ){
        if(!local||typeof local!=='object')return serveur;
        if(!serveur||typeof serveur!=='object')return local;
        if(!Array.isArray(local.skills)||!Array.isArray(serveur.skills)){
          return serveur;
        }

        const localParId=new Map(
          local.skills
            .filter(function(x){return x&&x.id;})
            .map(function(x){return [String(x.id),x];})
        );

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-12 */
        const memeRun=serveur.skills.every(function(srv){
          const loc=srv&&localParId.get(String(srv.id||''));
          return !loc||
            idleEntier_(loc.cap)===idleEntier_(srv.cap);
        });

        if(!memeRun)return serveur;

        /*
         * Déblocage fait par le SERVEUR pendant que l'écran ne le savait pas encore (Norman, 2026-10-04 : « j'ai cap le premier et ajouté 10K en plus pour que l'énergie passe toute seule au suivant quand il se débloque ;
         * l'énergie m'a été rendue et rien n'est allé au 2e menu »). Training Auto Advance : le serveur déplace alors le surplus de la prérequise vers la compétence débloquée. Garder l'allocation de l'écran (l'ancienne
         * répartition, surplus encore dans la première) annulait ce transfert, et la répartition renvoyée ensuite au serveur effaçait le surplus. Dans ce cas la répartition du serveur fait foi pour tout le tableau.
         */
        const debloqueParLeServeur=serveur.skills.some(function(srv){
          const loc=srv&&localParId.get(String(srv.id||''));
          return Boolean(loc&&srv.unlocked&&!loc.unlocked);
        });
        const fusion=Object.assign({},serveur);
        fusion.skills=serveur.skills.map(function(srv){
          if(!srv||!srv.id)return srv;
          const loc=localParId.get(String(srv.id));
          if(!loc)return srv;

          const totalLocal=
            Math.max(0,idleNombre_(loc.level))+
            Math.max(0,Math.min(.999999999,idleNombre_(loc.progress)));
          const totalServeur=
            Math.max(0,idleNombre_(srv.level))+
            Math.max(0,Math.min(.999999999,idleNombre_(srv.progress)));
          /*
           * 2026-09-23 (audit NGU) : le client peut légitimement être en
           * avance sur le serveur (latence de la réponse, allocation appliquée
           * localement avant son envoi), mais cette avance restait à vie :
           * elle n'était jamais résorbée, donc l'affichage dérivait au-dessus
           * de la vérité serveur à chaque changement d'allocation. L'avance
           * tolérée est bornée à 3 s de gain à la vitesse courante (2 niveaux
           * au minimum) ; au-delà, le serveur fait foi.
           */
          const vitesseServeur=Math.max(0,idleNombre_(srv.levelsPerSecond));
          const avanceTolereeMax=Math.max(2,vitesseServeur*3);
          const avance=(
            totalLocal>=totalServeur&&
            totalLocal-totalServeur<=avanceTolereeMax
          )?loc:srv;

          return Object.assign({},srv,{
            level:idleEntier_(avance.level),
            progress:Math.max(
              0,
              Math.min(.999999999,idleNombre_(avance.progress))
            ),
            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-13 */
            allocation:idleEntier_(debloqueParLeServeur?srv.allocation:loc.allocation)
          });
        });
        return fusion;
      }

      function appliquerEtatBasicTrainingIdleV120_(
        res
      ){
        const joueur=
          res&&
          res.joueur&&
          typeof res.joueur==='object'
            ?res.joueur
            :null;

        if(
          !REG.idleEtat ||
          !joueur
        ){
          return;
        }

        const energieCoherente=energieLibreCoherenteIdleV1_(joueur);

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-14 */
        if(
          REG.idleCombatEnPauseApresDefaiteV1 &&
          !REG.idleEtat.combatBossActif
        ){
          [
            'energie',
            'energieMax',
            'productionSeconde',
            'renaissances'
          ].forEach(function(cle){
            if(joueur[cle]!==undefined){
              REG.idleEtat[cle]=cle==='energie'?energieCoherente:joueur[cle];
            }
          });

          if(
            joueur.energieTick&&
            typeof joueur.energieTick==='object'
          ){
            REG.idleEtat.energieTick=
              Object.assign(
                {},
                REG.idleEtat.energieTick||{},
                joueur.energieTick
              );

            REG.idleResteTickEnergieMsV114=
              Math.max(
                0,
                idleNombre_(
                  joueur.energieTick.resteMs
                )
              );
          }

          rafraichirBasicTrainingIdleV120_();
          rafraichirEnergieEtBoutonsIdleV9_();
          pousserEtatVersRuntimePartageIdleV1_();
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-15 */
        [
          'energie',
          'energieMax',
          'productionSeconde',
          'renaissances'
        ].forEach(function(cle){
          if(
            joueur[cle]!==undefined
          ){
            REG.idleEtat[cle]=
              cle==='energie'?energieCoherente:joueur[cle];
          }
        });

        [
          'force',
          'endurance',
          'organisation',
          'puissance',
          'defense',
          'pvJoueurMax'
        ].forEach(function(cle){
          if(
            joueur[cle]!==undefined
          ){
            REG.idleEtat[cle]=
              Math.max(
                idleNombre_(REG.idleEtat[cle]),
                idleNombre_(joueur[cle])
              );
          }
        });

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-16 */

        if(
          joueur.basicTraining&&
          typeof joueur.basicTraining==='object'
        ){
          REG.idleEtat.basicTraining=
            fusionnerBasicTrainingPlusAvanceIdleV166_(
              REG.idleEtat.basicTraining,
              joueur.basicTraining
            );
        }

        if(
          joueur.combatPrincipal&&
          typeof joueur.combatPrincipal==='object'
        ){
          REG.idleEtat.combatPrincipal=
            Object.assign(
              {},
              joueur.combatPrincipal
            );
        }

        if(
          joueur.energieTick&&
          typeof joueur.energieTick==='object'
        ){
          REG.idleEtat.energieTick=
            Object.assign(
              {},
              REG.idleEtat.energieTick||{},
              joueur.energieTick
            );

          REG.idleResteTickEnergieMsV114=
            Math.max(
              0,
              idleNombre_(
                joueur.energieTick.resteMs
              )
            );
        }

        REG.idleDernierTickLocalV40=
          Date.now();

        rafraichirBasicTrainingIdleV120_();
        rafraichirEnergieEtBoutonsIdleV9_();
      }

      function envoyerAllocationsBasicTrainingIdleV120_(){
        if(
          !SOREAL_SESSION ||
          !REG.idleEtat ||
          !basicTrainingIdleV120_()
        ){
          return;
        }

        if(
          REG.idleBasicTrainingSaveBusyV120
        ){
          REG.idleBasicTrainingDirtyV120=true;
          return;
        }

        /* Une répartition d'un autre système, modifiée avant celle-ci, passe d'abord. */
        if(REG.idleAllocOrdreV1.meta&&REG.idleAllocOrdreV1.meta<REG.idleAllocOrdreV1.bt&&Date.now()-REG.idleAllocOrdreV1.metaAt<4000){
          programmerEnvoiBasicTrainingIdleV120_(40);
          return;
        }

        REG.idleBasicTrainingSaveBusyV120=true;
        REG.idleBasicTrainingDirtyV120=false;

        const payload=
          allocationsBasicTrainingIdleV120_();

        google.script.run
          .withSuccessHandler(function(res){
            REG.idleBasicTrainingSaveBusyV120=false;

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-17 */
            if(res&&res.ok){
              appliquerEtatBasicTrainingIdleV120_(
                res
              );
              if(!REG.idleBasicTrainingDirtyV120)REG.idleAllocOrdreV1.bt=0;
            }else{
              REG.idleBasicTrainingDirtyV120=true;
              synchroniserJeuIdleV7_(
                true
              );
            }

            if(REG.idleBasicTrainingDirtyV120){
              programmerEnvoiBasicTrainingIdleV120_(
                res&&res.ok?30:120
              );
            }
          })
          .withFailureHandler(function(){
            REG.idleBasicTrainingSaveBusyV120=false;
            REG.idleBasicTrainingDirtyV120=true;

            synchroniserJeuIdleV7_(
              true
            );

            programmerEnvoiBasicTrainingIdleV120_(
              120
            );
          })
          .definirAllocationsEntrainementSorealIdle(
            SOREAL_SESSION,
            payload
          );
      }

      function programmerEnvoiBasicTrainingIdleV120_(
        delai
      ){
        REG.idleBasicTrainingDirtyV120=true;
        if(!REG.idleAllocOrdreV1.bt){
          REG.idleAllocOrdreV1.bt=++REG.idleAllocOrdreV1.n;
          REG.idleAllocOrdreV1.btAt=Date.now();
        }

        if(REG.idleBasicTrainingSaveTimerV120){
          clearTimeout(
            REG.idleBasicTrainingSaveTimerV120
          );
        }

        REG.idleBasicTrainingSaveTimerV120=
          setTimeout(
            function(){
              REG.idleBasicTrainingSaveTimerV120=null;

              envoyerAllocationsBasicTrainingIdleV120_();
            },
            Math.max(
              20,
              idleEntier_(delai)||70
            )
          );
      }

      function inputBasicTrainingIdleV120_(){
        const input=
          document.getElementById(
            'sorealIdleTrainingInputV120'
          );

        const repli=
          window.__lireMontantAugmentIdleV1__
            ?window.__lireMontantAugmentIdleV1__()
            :1;

        return Math.max(
          1,
          idleEntier_(
            input&&input.value
          )||repli
        );
      }

      function ajusterBasicTrainingIdleV120_(
        id,
        action
      ){
        const skill=
          skillBasicTrainingParIdIdleV120_(
            id
          );

        if(
          !skill ||
          !skill.unlocked
        ){
          return;
        }

        const courant=
          idleEntier_(
            skill.allocation
          );

        const idleAvant=
          Math.max(
            0,
            idleEntier_(
              REG.idleEtat&&
              REG.idleEtat.energie
            )
          );

        /* Synchro Basic Training (Norman, 2026-10-02) : case cochée sous Input, offerte par l'achat « Synchro Basic Training » de la boutique EXP. Les compétences vont
         * par paire (attaque ↔ défense) ; ce qu'on place dans l'une est placé au même instant dans l'autre. Fonction pure : planSynchroBasicTrainingIdleV1_. */
        const jumelle=synchroBasicTrainingActifIdleV1_()?skillBasicTrainingParIdIdleV120_(IDLE_BT_JUMELLES_V1[id]):null;
        const synchro=!!(jumelle&&jumelle.unlocked);
        const entree=inputBasicTrainingIdleV120_();
        let plan;

        /* « 0 » (Norman, 2026-10-11) : retire TOUTE l'énergie de cette barre, et d'elle seule (même avec Synchro, la jumelle ne bouge pas). */
        if(action==='zero'){
          plan={a:0,b:synchro?idleEntier_(jumelle.allocation):0};
        }else if(synchro){
          plan=planSynchroBasicTrainingIdleV1_(
            action,
            {courant:courant,cap:capBasicTrainingLocalIdleV120_(skill)},
            {courant:idleEntier_(jumelle.allocation),cap:capBasicTrainingLocalIdleV120_(jumelle)},
            idleAvant,
            entree
          );
        }else{
          let cible=courant;

          if(action==='plus'){
            cible=courant+Math.min(entree,idleAvant);
          }else if(action==='moins'){
            cible=Math.max(0,courant-entree);
          }else if(action==='cap'){
            cible=capBasicTrainingLocalIdleV120_(skill);

            if(cible>courant){
              cible=courant+Math.min(cible-courant,idleAvant);
            }
          }

          plan={a:Math.max(0,idleEntier_(cible)),b:0};
        }

        const delta=
          (plan.a-courant)+
          (synchro?plan.b-idleEntier_(jumelle.allocation):0);

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-18 */
        if(
          action!=='moins'&&
          delta===0&&
          idleAvant<=0
        ){
          messageFlottantIdleV32_(
            '⚡ Aucune énergie Idle disponible à allouer pour le moment.'
          );
        }

        /* Sons de +, − et Cap (2026-09-26) : seulement si l'allocation change vraiment. */
        if(delta!==0){
          jouerEffetAudioIdleV199_(
            action==='plus'?'btPlus':(action==='moins'||action==='zero')?'btMinus':'btCap'
          );
        }

        skill.allocation=
          plan.a;

        if(synchro)jumelle.allocation=plan.b;

        REG.idleEtat.energie=
          Math.max(
            0,
            Math.min(
              Math.max(
                0,
                idleEntier_(
                  REG.idleEtat.energieMax
                )-
                totalAllocationBasicTrainingIdleV120_()-
                allocationMetaEnergieIdleV1_()
              ),
              idleAvant-delta
            )
          );

        rafraichirBasicTrainingIdleV120_();
        rafraichirEnergieEtBoutonsIdleV9_();

        programmerEnvoiBasicTrainingIdleV120_(
          70
        );
      }

      /* Paires de Basic Training : toujours ensemble (Norman, 2026-10-02). Les identifiants sont ceux du serveur (attaque ↔ défense de même ligne). */
      const IDLE_BT_JUMELLES_V1={
        attaque_passive:'blocage',blocage:'attaque_passive',
        attaque_reguliere:'defense_renforcee',defense_renforcee:'attaque_reguliere',
        attaque_renforcee:'recuperation',recuperation:'attaque_renforcee',
        contre_palette:'boost_offensif',boost_offensif:'contre_palette',
        percee_quai:'charge_logistique',charge_logistique:'percee_quai',
        ultime_soreal:'ultime_logistique',ultime_logistique:'ultime_soreal'
      };

      /* La case n'existe (et ne compte) que si l'achat a été fait : le serveur l'annonce par `basicTrainingSynchro`. */
      /*
       * Norman (2026-10-03) : « le bouton Synchro doit conserver son état après un Rebirth ». L'achat est mémorisé : une réponse qui ne porte pas (encore) l'information (champ absent) ne fait ni
       * disparaître la case ni perdre son choix ; seul un « non » explicite du serveur (partie réinitialisée) l'efface. Le choix coché/décoché reste dans le stockage local, jamais touché par un Rebirth.
       */
      let idleBtSynchroAcheteV1=false;

      function synchroBasicTrainingAcheteIdleV1_(){
        if(REG.idleEtat&&typeof REG.idleEtat.basicTrainingSynchro==='boolean')idleBtSynchroAcheteV1=REG.idleEtat.basicTrainingSynchro;
        return idleBtSynchroAcheteV1;
      }

      function synchroBasicTrainingActifIdleV1_(){
        if(!REG.idleEtat||!synchroBasicTrainingAcheteIdleV1_())return false;
        try{return window.localStorage.getItem(REG.IDLE_BT_SYNCHRO_CLE_V1)==='1';}catch(e){return false;}
      }

      function presetBasicTrainingIdleV120_(
        source,
        fraction
      ){
        const input=
          document.getElementById(
            'sorealIdleTrainingInputV120'
          );

        if(!input)return;

        const base=
          source==='idle'
            ?idleEntier_(
                REG.idleEtat&&
                REG.idleEtat.energie
              )
            :idleEntier_(
                REG.idleEtat&&
                REG.idleEtat.energieMax
              );

        input.value=
          String(
            Math.max(
              1,
              Math.floor(
                base*
                Math.max(
                  0,
                  idleNombre_(
                    fraction
                  )
                )
              )
            )
          );
      }

      function viderBasicTrainingIdleV120_(){
        const bt=
          basicTrainingIdleV120_();

        if(
          !bt ||
          !Array.isArray(bt.skills)
        ){
          return;
        }

        let rendu=0;

        bt.skills.forEach(function(skill){
          rendu+=
            idleEntier_(
              skill&&skill.allocation
            );

          if(skill){
            skill.allocation=0;
          }
        });

        REG.idleEtat.energie=
          Math.min(
            Math.max(
              0,
              idleEntier_(
                REG.idleEtat.energieMax
              )-
              allocationMetaEnergieIdleV1_()
            ),
            idleEntier_(
              REG.idleEtat.energie
            )+
            rendu
          );

        rafraichirBasicTrainingIdleV120_();
        rafraichirEnergieEtBoutonsIdleV9_();

        programmerEnvoiBasicTrainingIdleV120_(
          20
        );
      }

      /* « Training Auto Advance » acheté (la boutique EXP le publie dans les bonus du serveur) ? */
      function autoAdvanceBasicTrainingActifIdleV1_(){
        const b=REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.bonuses;
        return Boolean(b&&b.basicTrainingAutoAdvance);
      }

      function actualiserDeblocagesBasicTrainingLocalIdleV120_(){
        const bt=
          basicTrainingIdleV120_();

        if(
          !bt ||
          !Array.isArray(bt.skills)
        ){
          return false;
        }

        let change=false;
        let transfertAuto=false;

        bt.skills.forEach(function(skill){
          if(
            !skill ||
            skill.unlocked ||
            !skill.prerequisite
          ){
            return;
          }

          const precedent=
            bt.skills.find(function(x){
              return x&&
                x.id===
                skill.prerequisite;
            });

          if(
            precedent &&
            idleNombre_(
              precedent.level
            )>=
            idleNombre_(
              skill.prerequisiteLevel
            )
          ){
            skill.unlocked=true;
            change=true;
            /*
             * Training Auto Advance (boutique EXP, wiki « Experience » > Misc : « automatically allocates energy each time a skill is unlocked while leaving the necessary cap for each skill ») : à l'instant du
             * déblocage, l'énergie de la prérequise AU-DELÀ de son cap passe à la compétence débloquée (Norman, 2026-10-04 : « j'ai mis 2329 dans Attaque passive, capée à 89 ; au déblocage de la suivante, l'énergie
             * en trop n'est pas passée »). Le serveur fait le même transfert, mais pendant qu'on est dans ce menu la page ne reprend pas son état (modules/basic-training-stability-v121.js) : sans ce transfert LOCAL,
             * l'écran garde l'ancienne répartition et la renvoie au serveur au prochain clic, ce qui annulait le transfert du serveur.
             */
            if(autoAdvanceBasicTrainingActifIdleV1_()){
              const surplus=Math.max(0,idleEntier_(precedent.allocation)-Math.max(1,idleEntier_(precedent.cap)));
              if(surplus>0){
                precedent.allocation=idleEntier_(precedent.allocation)-surplus;
                skill.allocation=idleEntier_(skill.allocation)+surplus;
                transfertAuto=true;
              }
            }
          }
        });

        if(transfertAuto){
          /* Le serveur reçoit la nouvelle répartition (l'énergie totale allouée ne change pas). */
          programmerEnvoiBasicTrainingIdleV120_(30);
        }

        if(
          change &&
          REG.idleMenuActifV28===
            'entrainement'
        ){
          const root=
            document.querySelector(
              '.soreal-idle-page-root-v28'
            );

          if(root){
            root.innerHTML=
              pageEntrainementIdleV28_(
                REG.idleEtat
              );

            rafraichirBasicTrainingIdleV120_();
          }
        }

        return change;
      }

      function progresserBasicTrainingLocalIdleV120_(
        dt
      ){
        const bt=
          basicTrainingIdleV120_();

        if(
          !bt ||
          !Array.isArray(bt.skills) ||
          dt<=0
        ){
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-19 */
        bt.skills.forEach(function(skill){
          if(
            !skill ||
            !skill.unlocked
          ){
            return;
          }

          const vitesse=
            vitesseBasicTrainingLocalIdleV120_(
              skill
            );

          if(vitesse<=0){
            return;
          }

          const niveauAvant=
            idleNombre_(
              skill.level
            );

          const valeur=
            niveauAvant+
            idleNombre_(
              skill.progress
            )+
            vitesse*
            dt;

          skill.level=
            Math.max(
              0,
              Math.floor(
                valeur
              )
            );

          skill.progress=
            Math.max(
              0,
              Math.min(
                .999999999,
                valeur-
                skill.level
              )
            );

          const bar=
            document.getElementById(
              'sorealIdleBtBarV120_'+skill.id
            );

          if(bar){
            animerBarreBasicTrainingIdleV220_(
              bar,
              skill,
              vitesse
            );
          }
        });

        actualiserDeblocagesBasicTrainingLocalIdleV120_();

        let attaque=100;
        let defense=100;

        bt.skills.forEach(function(skill){
          if(!skill)return;

          /* 2026-09-23 (audit NGU) : niveau ENTIER (wiki : Level^1.3 x BaseValue),
           * la fraction de barre (skill.progress) n'est qu'un affichage. */
          const level=
            Math.max(
              0,
              Math.floor(
                idleNombre_(
                  skill.level
                )
              )
            );

          const contribution=
            Math.pow(
              level,
              1.3
            )*
            Math.max(
              0,
              idleNombre_(
                skill.baseValue
              )
            );

          if(skill.group==='attack'){
            attaque+=contribution;
          }else if(skill.group==='defense'){
            defense+=contribution;
          }
        });

        const combatPrincipal=
          REG.idleEtat&&
          REG.idleEtat.combatPrincipal&&
          typeof REG.idleEtat.combatPrincipal==='object'
            ?REG.idleEtat.combatPrincipal
            :{};

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-20 */
        /*
         * 2026-09-24 (audit de composition) : ces multiplicateurs étaient codés
         * à 1, si bien que chaque frame remplaçait l'Attaque/Défense du serveur
         * (NUMBER, équipement, augments, Wandoos, perks, NGU...) par
         * l'entraînement brut. Le serveur expose désormais le produit qu'il
         * applique (combatPrincipal.multiplicateurAttaqueTotal/DefenseTotal).
         */
        const multiplicateurCombatPositifIdleV1_=function(v){
          const n=Number(v);
          return Number.isFinite(n)&&n>0?n:1;
        };
        const multiplicateurStuffAttaque=
          multiplicateurCombatPositifIdleV1_(
            combatPrincipal.multiplicateurAttaqueTotal
          );
        const multiplicateurStuffDefense=
          multiplicateurCombatPositifIdleV1_(
            combatPrincipal.multiplicateurDefenseTotal
          );
        const multiplicateurPermanent=1;

        const bonusBoutique=
          Math.max(
            0,
            idleNombre_(
              combatPrincipal
                .bonusBoutique
            )
          );

        /* 2026-09-25 : le 100 naturel n'est jamais multiplié (wiki NUMBER : « from Basic Training »), comme côté serveur. */
        const attaqueArrondie=
          Math.max(
            100,
            100+Math.round(
              (
                (attaque-100)+
                bonusBoutique
              )*
              multiplicateurStuffAttaque*
              multiplicateurPermanent
            )
          );

        const defenseArrondie=
          Math.max(
            100,
            100+Math.round(
              (defense-100)*
              multiplicateurStuffDefense*
              multiplicateurPermanent
            )
          );

        combatPrincipal.attaqueEntrainement=
          attaque;

        combatPrincipal.defenseEntrainement=
          defense;

        REG.idleEtat.combatPrincipal=
          combatPrincipal;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-21 */
        const pvAvant=
          Math.max(
            0,
            idleNombre_(
              REG.idleEtat.pvJoueur
            )
          );

        const pvMaxAvant=
          Math.max(
            1,
            idleNombre_(
              REG.idleEtat.pvJoueurMax
            )
          );

        const pvMaxCalcule=
          Math.max(
            1,
            attaqueArrondie*
            10
          );

        REG.idleEtat.force=
          attaqueArrondie;

        REG.idleEtat.endurance=
          defenseArrondie;

        REG.idleEtat.puissance=
          attaqueArrondie;

        REG.idleEtat.defense=
          defenseArrondie;

        REG.idleEtat.pvJoueurMax=
          REG.idleEtat.combatBossActif
            ?Math.max(
                pvMaxAvant,
                pvMaxCalcule
              )
            :pvMaxCalcule;

        REG.idleEtat.pvJoueur=
          Math.min(
            REG.idleEtat.pvJoueurMax,
            pvAvant
          );

        bt.attack=
          attaque;

        bt.defense=
          defense;

        rafraichirBasicTrainingIdleV120_();
      }

      /* Entier avec points entre les milliers (1.000.000) : les chiffres écrits en entier restent lisibles (Norman, 2026-10-10). */
      function formatEntierLisibleIdleV1_(v){
        const api=window.__SOREAL_IDLE_NUMBER_FORMAT_V1__;
        const n=Math.floor(idleNombre_(v)+1e-9);
        return api&&typeof api.entierLisible==='function'?api.entierLisible(n):String(n);
      }

      /*
       * Time Machine — la progression est calculée côté serveur et revient à chaque
       * synchronisation. Un changement de speedFill/goldFill n'est pas structurel :
       * sans patch DOM dédié, l'écran gardait donc la largeur du rendu initial
       * jusqu'à un changement de menu ou de niveau.
       */
      /*
       * Norman (2026-09-29) : « pour chaque barre, il faut un temps pour compléter un niveau qui
       * s'affiche. » Basic Training est la RÉFÉRENCE demandée pour les autres écrans (Augmentation,
       * Time Machine, Blood Magic), mais n'affichait lui-même aucune durée -- alors que
       * vitesseBasicTrainingLocalIdleV120_ calcule déjà skill.levelsPerSecond côté client (rien à
       * ajouter côté serveur) : 1 niveau prend simplement 1/levelsPerSecond secondes.
       */
      function texteEtaBasicTrainingIdleV1_(niveauxParSeconde){
        const v=Math.max(0,idleNombre_(niveauxParSeconde));
        if(!(v>0))return '⏱ Aucune énergie allouée';
        /* Norman (2026-10-01) : une barre plafonnée (50 niveaux/s) n'écrit plus « 1 s par niveau » mais « 50 niveaux par seconde ». */
        if(v>1)return '⏱ '+v.toLocaleString('fr-FR',{maximumFractionDigits:2})+' niveaux par seconde';
        return '⏱ '+formaterEtaTimeMachineIdleV1_(1/v)+' par niveau';
      }

      function coutBaseEntrainementIdleV73_(j){
        return Math.max(
          1,
          idleNombre_(
            j&&
            j.entrainementMeta&&
            j.entrainementMeta.coutBase
          )||75
        );
      }

      function appliquerEtatEntrainementCibleIdleV115_(
        source
      ){
        if(
          !REG.idleEtat ||
          !source ||
          typeof source!=='object'
        ){
          return false;
        }

        const joueur=
          source.joueur &&
          typeof source.joueur==='object'
            ?source.joueur
            :source;

        if(
          !joueur ||
          typeof joueur!=='object'
        ){
          return false;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-83 */
        [
          'energie',
          'energieMax',
          'productionSeconde',
          'force',
          'endurance',
          'organisation',
          'puissance',
          'defense',
          'pvJoueur',
          'pvJoueurMax'
        ].forEach(function(cle){
          if(joueur[cle]!==undefined){
            REG.idleEtat[cle]=
              idleNombre_(
                joueur[cle]
              );
          }
        });

        [
          'coutsEntrainement',
          'entrainementMeta'
        ].forEach(function(cle){
          if(
            joueur[cle] &&
            typeof joueur[cle]==='object'
          ){
            REG.idleEtat[cle]=
              Object.assign(
                {},
                REG.idleEtat[cle]||{},
                joueur[cle]
              );
          }
        });

        if(
          joueur.energieTick &&
          typeof joueur.energieTick==='object'
        ){
          REG.idleEtat.energieTick=
            Object.assign(
              {},
              REG.idleEtat.energieTick||{},
              joueur.energieTick
            );

          REG.idleResteTickEnergieMsV114=
            Math.max(
              0,
              idleNombre_(
                joueur.energieTick.resteMs
              )
            );
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-84 */
        REG.idleDernierTickLocalV40=
          Date.now();

        rafraichirEnergieEtBoutonsIdleV9_();
        planifierRenduOptimisteIdleV60_();

        return true;
      }

      function skillBasicTrainingIdleV120_(
        j,
        skill
      ){
        if(!skill)return '';

        /*
         * Seule la PROCHAINE compétence à débloquer est montrée (groupeBasicTrainingIdleV120_ n'en passe jamais plus d'une), en gris, avec son seul prérequis
         * (Norman, 2026-10-03 : « Nécessite 5K niveaux dans le menu au-dessus »). Aucune autre information (ni coût, ni effet) : règle n°2.
         */
        if(!skill.unlocked){
          const liste=j&&j.basicTraining&&Array.isArray(j.basicTraining.skills)?j.basicTraining.skills:[];
          const dessus=liste.find(function(x){return x&&x.id===skill.prerequisite;});
          const nomDessus=dessus?String(dessus.name||''):'';
          return `
            <div class="soreal-idle-bt-row-v120 ${idleHtml_(skill.group||'')} verrouille" data-basic-training-skill="${idleHtml_(skill.id)}" aria-disabled="true">
              <div class="soreal-idle-bt-main-v120">
                <div class="soreal-idle-bt-name-v120">${idleHtml_(skill.name)}</div>
                <div class="soreal-idle-bt-prerequis-v1">Nécessite ${idleHtml_(formatGrandNombreIdleV70_(idleEntier_(skill.prerequisiteLevel)))} niveaux dans ${nomDessus?idleHtml_(nomDessus):'le menu au-dessus'}</div>
              </div>
            </div>`;
        }

        /*
         * Montée en puissance (Norman, 2026-10-04 : « Attaque régulière plus bad ass que attaque passive, attaque puissante plus bad ass que attaque régulière ») : le rang de la barre dans sa section (0 à 5)
         * pilote son habillage (soreal-idle-themes.css, « MONTÉE EN PUISSANCE ») : mêmes couleurs, de plus en plus sombre, lumineux et animé.
         */
        const rangBt=Math.max(0,Math.min(5,(j&&j.basicTraining&&Array.isArray(j.basicTraining.skills)?j.basicTraining.skills:[]).filter(function(x){return x&&x.group===skill.group;}).findIndex(function(x){return x.id===skill.id;})));

        const vitesseInitiale=
          Math.max(
            0,
            idleNombre_(skill.levelsPerSecond)
          );

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-170 */
        /* Cap atteint (énergie allouée >= cap) : barre entièrement remplie, sans clignotement (voir animerBarreBasicTrainingIdleV220_). */
        const pourcentageInitial=
          vitesseInitiale>0
            ?(idleEntier_(skill.allocation)>0&&idleEntier_(skill.allocation)>=Math.max(1,idleEntier_(skill.cap))
              ?100
              :Math.max(0,Math.min(100,idleNombre_(skill.progress)*100)))
            :0;

        return `
          <div
            class="soreal-idle-bt-row-v120 ${idleHtml_(skill.group||'')}"
            data-basic-training-skill="${idleHtml_(skill.id)}"
            data-rang-v1="${rangBt}"
          >
            <div class="soreal-idle-bt-main-v120">
              <div class="soreal-idle-bt-name-v120">
                ${idleHtml_(window.__SOREAL_IDLE_ICONES_V1__?window.__SOREAL_IDLE_ICONES_V1__.avec('basicTraining',skill.id,skill.name):skill.name)}
              </div>

              <div class="soreal-idle-bt-track-v120">
                <div
                  id="sorealIdleBtBarV120_${idleHtml_(skill.id)}"
                  class="soreal-idle-bt-fill-v120"
                  style="width:100%;transform:scaleX(${pourcentageInitial/100});transform-origin:left center;will-change:transform;transition:none"
                ></div>
              </div>

              <div class="soreal-idle-bt-meta-v120">
                <span id="sorealIdleBtSpeedV120_${idleHtml_(skill.id)}">
                  ${idleNombre_(skill.levelsPerSecond).toFixed(2).replace('.',',')} niv/s
                </span>
                <span>
                  Cap :
                  <strong id="sorealIdleBtCapV120_${idleHtml_(skill.id)}">
                    ${formatEntierLisibleIdleV1_(skill.cap)}
                  </strong> ⚡
                  · prochain :
                  <strong
                    id="sorealIdleBtNextCapV120_${idleHtml_(skill.id)}"
                    class="${skill.maxReductionReached?'ready':''}"
                  >
                    ${formatEntierLisibleIdleV1_(skill.nextCap||skill.cap)}
                  </strong>
                </span>
                <span id="sorealIdleBtEtaV120_${idleHtml_(skill.id)}">
                  ${texteEtaBasicTrainingIdleV1_(vitesseInitiale)}
                </span>
              </div>
            </div>

            <div
              id="sorealIdleBtLevelV120_${idleHtml_(skill.id)}"
              class="soreal-idle-bt-level-v120"
            >
              ${formatGrandNombreIdleV70_(skill.level)}
            </div>

            <div
              id="sorealIdleBtAllocationV120_${idleHtml_(skill.id)}"
              class="soreal-idle-bt-allocation-v120"
            >
              ${formatEntierLisibleIdleV1_(skill.allocation)} ⚡
            </div>

            <div class="soreal-idle-bt-actions-v120">
              <button
                type="button"
                onclick="window.__ajusterBasicTrainingIdleV120__('${idleHtml_(skill.id)}','plus')"
              >+</button>
              <button
                type="button"
                onclick="window.__ajusterBasicTrainingIdleV120__('${idleHtml_(skill.id)}','moins')"
              >−</button>
              <button
                type="button"
                data-sans-traduction
                title="Cap : place seulement l’énergie nécessaire pour atteindre le plafond de cette compétence"
                onclick="window.__ajusterBasicTrainingIdleV120__('${idleHtml_(skill.id)}','cap')"
              >Cap</button>
              <button
                type="button"
                title="Retirer toute l’énergie de cette barre"
                onclick="window.__ajusterBasicTrainingIdleV120__('${idleHtml_(skill.id)}','zero')"
              >0</button>
            </div>
          </div>
        `;
      }

      function groupeBasicTrainingIdleV120_(
        j,
        groupe,
        titre
      ){
        const toutesSkills=
          j&&
          j.basicTraining&&
          Array.isArray(j.basicTraining.skills)
            ?j.basicTraining.skills.filter(function(x){
                return x.group===groupe;
              })
            :[];
        const premierVerrouille=toutesSkills.findIndex(function(x){return !x.unlocked;});
        const skills=premierVerrouille<0
          ?toutesSkills
          :toutesSkills.slice(0,premierVerrouille+1);

        return `
          <section class="soreal-idle-bt-panel-v120 ${idleHtml_(groupe)}">
            <div class="soreal-idle-bt-panel-head-v120">
              <strong>${idleHtml_(titre)}</strong>
              <span>Niveau</span>
              <span>Énergie affectée</span>
              <span></span>
            </div>

            ${skills.map(function(skill){
              return skillBasicTrainingIdleV120_(
                j,
                skill
              );
            }).join('')}
          </section>
        `;
      }

      function pageEntrainementIdleLegacyV47_(j){
        const bt=
          j&&j.basicTraining
            ?j.basicTraining
            :{
                energy:{idle:0,allocated:0,cap:0},
                energyPower:1,
                energyBars:1,
                maxLevelsPerSecond:50,
                skills:[]
              };

        const energie=
          bt.energy||{};

        return `
          ${entetePageIdleV28_(
            '🏋️ Basic Training',
            'Place ton énergie pour augmenter ton attaque et ta défense.'
          )}

          <!--
            Norman (2026-09-16) : "tu peux l'enlever de basic training et
            de fight boss et n'utiliser que celle que je te demande [la
            barre persistante sous le menu]." L'ancien bloc
            .soreal-idle-bt-energy-v120 (Idle/affectée/Cap + sa propre
            barre) est retiré ici — la seule barre d'Énergie visible reste
            désormais rendreBarreEnergiePersistanteIdleV1_ (shell), jamais
            un second mécanisme. L'info vitesse/multiplicateurs, utile
            spécifiquement à cet écran, reste affichée seule.
          -->
          <div class="soreal-idle-bt-toolbar-v120">
            <div class="soreal-idle-bt-info-v1">
              vitesse max ${idleEntier_(bt.maxLevelsPerSecond||50)} niv/s
              · Energy Power n’accélère pas Basic Training
            </div>

            <div class="soreal-idle-bt-input-box-v120">
              <label for="sorealIdleTrainingInputV120">🎚️ Input</label>
              <input
                id="sorealIdleTrainingInputV120"
                type="text"
                inputmode="decimal"
                value="${idleHtml_(String(window.__lireMontantAugmentIdleV1__?window.__lireMontantAugmentIdleV1__():125))}"
                title="Un nombre, ou une fraction comme 1/8 (résolue en 1/8 de l'énergie idle libre à la validation)"
                oninput="window.__saisirMontantAugmentIdleV1__&&window.__saisirMontantAugmentIdleV1__(this.value)"
                onblur="window.__resoudreFractionInputIdleV1__(this);window.__saisirMontantAugmentIdleV1__&&window.__saisirMontantAugmentIdleV1__(this.value)"
              >
              ${synchroBasicTrainingAcheteIdleV1_()?`
              <label class="soreal-idle-bt-synchro-v1" title="Cochée : l'énergie placée dans une compétence est placée en même temps dans sa jumelle (Attaque passive ↔ Blocage…)">
                <input
                  type="checkbox"
                  id="sorealIdleTrainingSynchroV1"
                  ${synchroBasicTrainingActifIdleV1_()?'checked':''}
                  onchange="window.__basculerSynchroBasicTrainingIdleV1__(this.checked)"
                >
                🔗 Synchro
              </label>`:''}
            </div>

            <div class="soreal-idle-bt-presets-v120">
              <span>⚡ Plafond d’énergie</span>
              <button type="button" onclick="window.__presetBasicTrainingIdleV120__('cap',1)">Max</button>
              <button type="button" onclick="window.__presetBasicTrainingIdleV120__('cap',.5)">1/2</button>
              <button type="button" onclick="window.__presetBasicTrainingIdleV120__('cap',.25)">1/4</button>
            </div>

            <div class="soreal-idle-bt-presets-v120">
              <span>💤 Idle</span>
              <button type="button" onclick="window.__presetBasicTrainingIdleV120__('idle',.5)">1/2</button>
              <button type="button" onclick="window.__presetBasicTrainingIdleV120__('idle',.25)">1/4</button>
              <button type="button" class="clear" onclick="window.__viderBasicTrainingIdleV120__()">Tout retirer</button>
            </div>
            ${window.__SOREAL_IDLE_ALLOC_V1__&&window.__SOREAL_IDLE_ALLOC_V1__.compteur?window.__SOREAL_IDLE_ALLOC_V1__.compteur('energy','basicTraining'):''}
          </div>

          ${groupeBasicTrainingIdleV120_(
            j,
            'attack',
            '⚔️ Compétences d’attaque'
          )}

          ${groupeBasicTrainingIdleV120_(
            j,
            'defense',
            '🛡️ Compétences de défense'
          )}
        `;
      }

      function pageEntrainementIdleV28_(j){
        return pageEntrainementIdleLegacyV47_(j);
      }

  Object.assign(REG,{
    basicTrainingIdleV120_:basicTrainingIdleV120_,
    totalAllocationBasicTrainingIdleV120_:totalAllocationBasicTrainingIdleV120_,
    energieLibreCoherenteIdleV1_:energieLibreCoherenteIdleV1_,
    fusionnerBasicTrainingPlusAvanceIdleV166_:fusionnerBasicTrainingPlusAvanceIdleV166_,
    envoyerAllocationsBasicTrainingIdleV120_:envoyerAllocationsBasicTrainingIdleV120_,
    ajusterBasicTrainingIdleV120_:ajusterBasicTrainingIdleV120_,
    presetBasicTrainingIdleV120_:presetBasicTrainingIdleV120_,
    viderBasicTrainingIdleV120_:viderBasicTrainingIdleV120_,
    progresserBasicTrainingLocalIdleV120_:progresserBasicTrainingLocalIdleV120_,
    formatEntierLisibleIdleV1_:formatEntierLisibleIdleV1_,
    coutBaseEntrainementIdleV73_:coutBaseEntrainementIdleV73_,
    appliquerEtatEntrainementCibleIdleV115_:appliquerEtatEntrainementCibleIdleV115_,
    pageEntrainementIdleV28_:pageEntrainementIdleV28_
  });
})();
