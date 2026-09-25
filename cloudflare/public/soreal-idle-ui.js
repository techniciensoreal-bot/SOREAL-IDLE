/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-1 */
/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-2 */

    ;(function(){
      'use strict';

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-3 */
      const IDLE_TEST_VERSION='Version bêta';
      const IDLE_UI_MILESTONE_V48_NGU_BALANCE=true;
      const IDLE_CLIENT_PROTOCOL_VERSION=1;
      let idleAutorise=false;
      let idleVerificationEnCours=false;
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-4 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-5 */
      let idleEstAdminV1=null;
      function estAdminSorealIdle_(){
        if(idleEstAdminV1===true)return true;
        if(idleEstAdminV1===false)return false;
        try{
          return Boolean(
            typeof SOREAL_USER!=='undefined'&&
            SOREAL_USER&&
            String(SOREAL_USER.email||'').trim().toLowerCase()==='technicien.soreal@gmail.com'
          );
        }catch(e){
          return false;
        }
      }
      function rafraichirEstAdminSorealIdle_(){
        if(idleEstAdminV1!==null||!SOREAL_SESSION)return;
        google.script.run
          .withSuccessHandler(function(res){
            const estAdminAvant=idleEstAdminV1===true;
            idleEstAdminV1=Boolean(res&&res.ok&&res.isAdmin);
            if(idleEstAdminV1&&!estAdminAvant&&idleEtat){
              rendreIdleEtat_({ok:true,joueur:idleEtat});
            }
          })
          .withFailureHandler(function(){
            idleEstAdminV1=false;
          })
          .estAdminSorealIdle(SOREAL_SESSION);
      }
      /*
       * 2026-09-24 (Norman, développement uniquement) : deux parties, « A » (réelle, jamais réinitialisée) et « B » (réinitialisable,
       * pour comparer à NGU IDLE). Le serveur dit si le sélecteur existe (compte administrateur + fonction active) et quelle partie
       * la session joue ; changer de partie recharge la page (le jeton de session reste dans sessionStorage).
       */
      let idlePartieDevV1=null;
      function rafraichirPartieDevIdleV1_(){
        if(idlePartieDevV1!==null||!SOREAL_SESSION)return;
        idlePartieDevV1={actif:false,partie:'a',charge:false};
        google.script.run
          .withSuccessHandler(function(res){
            const avant=JSON.stringify(idlePartieDevV1);
            idlePartieDevV1={
              actif:Boolean(res&&res.ok&&res.actif),
              partie:String(res&&res.partie||'a')==='b'?'b':'a',
              charge:true
            };
            if(JSON.stringify(idlePartieDevV1)!==avant&&idleEtat){
              rendreIdleEtat_({ok:true,joueur:idleEtat});
            }
          })
          .withFailureHandler(function(){})
          .obtenirPartieDevSorealIdle(SOREAL_SESSION);
      }
      function changerPartieDevIdleV1_(partie){
        const cible=String(partie)==='b'?'b':'a';
        if(!idlePartieDevV1||!idlePartieDevV1.actif||idlePartieDevV1.partie===cible)return;
        google.script.run
          .withSuccessHandler(function(res){
            if(res&&res.ok){
              location.reload();
            }else{
              toastIdleV5_('Impossible de changer de partie.');
            }
          })
          .withFailureHandler(function(){
            toastIdleV5_('Impossible de changer de partie.');
          })
          .definirPartieDevSorealIdle(SOREAL_SESSION,cible);
      }
      window.__changerPartieDevIdleV1__=changerPartieDevIdleV1_;
      function rendrePartiesDevIdleV1_(){
        const p=idlePartieDevV1;
        if(!p||!p.actif)return '';
        function bouton(cle,titre,detail){
          const active=p.partie===cle;
          return '<button type="button" class="soreal-idle-parties-dev-bouton-v1'+(active?' actif':'')+'" '+
            (active?'disabled aria-pressed="true" ':'aria-pressed="false" onclick="window.__changerPartieDevIdleV1__(\''+cle+'\')" ')+'>'+
            '<b>'+titre+'</b><span>'+detail+'</span></button>';
        }
        return '<div class="soreal-idle-section-v8">'+
          '<div class="soreal-idle-window-title-v31">🛠️ Développement — Parties</div>'+
          '<div style="font-size:12px;color:#8b93ab;margin-bottom:10px">Uniquement pendant le développement. Deux parties indépendantes : la <b>A</b> est ta vraie partie (à ne jamais réinitialiser), la <b>B</b> se réinitialise à volonté pour comparer avec NGU IDLE. Le bouton de réinitialisation ci-dessous ne concerne que la partie active.</div>'+
          '<div class="soreal-idle-parties-dev-v1">'+
            bouton('a','Partie A','Ta vraie partie')+
            bouton('b','Partie B','Comparaison NGU IDLE')+
          '</div>'+
          '<div style="font-size:12px;color:#dce5f3;margin-top:8px">Partie active : <b>'+(p.partie==='b'?'B (comparaison)':'A (réelle)')+'</b></div>'+
        '</div>';
      }
      let idleTimerSession=null;
      let idleTimerEnergie=null;
      let idleAnimationFrameJeuV214=0;
      let idleDernierImpactBossV46=0;
      let idleDernierImpactJoueurV46=0;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-6 */
      let idlePopupActifV75=false;
      let idlePopupQueueV75=[];
      let idlePopupBloqueCombatV102=false;
      let idleTutorielPagesEnCoursV1=null;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-7 */
      const IDLE_HIT_JOUEUR_MS_V116=850;
      const IDLE_HIT_BOSS_MS_V116=1000;
      let idleProchainCoupJoueurV116=0;
      let idleProchainCoupBossV116=0;
      let idleCombatIdentiteV116='';

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-8 */
      let idleCompensationImpactJoueurV117=null;
      let idleCompensationImpactBossV117=null;

      function tirerImpactEquilibreIdleV117_(
        acteur
      ){
        const joueur=
          acteur==='joueur';

        const compensation=
          joueur
            ?idleCompensationImpactJoueurV117
            :idleCompensationImpactBossV117;

        if(
          compensation!==null &&
          Number.isFinite(compensation)
        ){
          if(joueur){
            idleCompensationImpactJoueurV117=null;
          }else{
            idleCompensationImpactBossV117=null;
          }

          return {
            multiplicateur:
              compensation,
            critique:false
          };
        }

        const critique=
          Math.random()<.11;

        const premier=
          critique
            ?1.45+Math.random()*.25
            :.65+Math.random()*.70;

        const suivant=
          Math.max(
            .30,
            Math.min(
              1.70,
              2-premier
            )
          );

        if(joueur){
          idleCompensationImpactJoueurV117=
            suivant;
        }else{
          idleCompensationImpactBossV117=
            suivant;
        }

        return {
          multiplicateur:
            premier,
          critique:
            critique
        };
      }

      function sommeImpactsAleatoiresIdleV117_(
        acteur,
        baseParCoup,
        nombre
      ){
        let degats=0;
        let critiques=0;
        const multiplicateurs=[];

        const n=
          Math.max(
            0,
            idleEntier_(
              nombre
            )
          );

        for(let i=0;i<n;i+=1){
          const impact=
            tirerImpactEquilibreIdleV117_(
              acteur
            );

          degats+=
            Math.max(
              0,
              idleNombre_(
                baseParCoup
              )*
              impact.multiplicateur
            );

          multiplicateurs.push(
            impact.multiplicateur
          );

          if(impact.critique){
            critiques+=1;
          }
        }

        return {
          valeur:
            degats,
          critiques:
            critiques,
          multiplicateurs:
            multiplicateurs
        };
      }

      function initialiserCoupsCombatIdleV116_(){
        if(!idleEtat||!idleEtat.combatBossActif){
          idleCombatIdentiteV116='';
          idleProchainCoupJoueurV116=0;
          idleProchainCoupBossV116=0;
          return;
        }

        const identite=
          String(idleEntier_(idleEtat.bossSelection||1))+
          ':'+
          String(idleEtat.bossActuel||'');

        if(identite===idleCombatIdentiteV116){
          return;
        }

        idleCombatIdentiteV116=identite;
        idleCompensationImpactJoueurV117=null;
        idleCompensationImpactBossV117=null;

        const maintenant=Date.now();

        idleProchainCoupJoueurV116=
          maintenant+
          IDLE_HIT_JOUEUR_MS_V116;

        idleProchainCoupBossV116=
          maintenant+
          IDLE_HIT_BOSS_MS_V116;
      }

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
      let idleEtat=null;

      let idleBasicTrainingSaveTimerV120=null;
      let idleBasicTrainingSaveBusyV120=false;
      let idleBasicTrainingDirtyV120=false;

      function basicTrainingIdleV120_(){
        return idleEtat&&
          idleEtat.basicTraining&&
          typeof idleEtat.basicTraining==='object'
            ?idleEtat.basicTraining
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
       * 2026-09-24 (Norman : « quand tous mes points sont générés et que j'en place dans Augmentation, le compteur continue à générer des
       * points et retombe à 0 vers 17-20, puis recommence sans arrêt »). Le serveur ne laisse à l'énergie libre que
       * Cap − (Basic Training + TOUS les systèmes qui en retiennent : Augmentations, NGU, Time Machine, Wishes…) ; le client, lui, ne
       * retirait du Cap que Basic Training : avec toute l'énergie placée dans Augmentation il continuait donc à « générer » localement
       * jusqu'à la prochaine synchronisation, qui ramenait la valeur du serveur (0). Somme lue dans le snapshot, comme le moteur.
       */
      function allocationMetaEnergieIdleV1_(){
        const liste=
          idleEtat&&
          idleEtat.systemes&&
          Array.isArray(idleEtat.systemes.systems)
            ?idleEtat.systemes.systems
            :[];

        return liste.reduce(function(total,sys){
          return total+
            Math.max(
              0,
              idleNombre_(
                sys&&
                sys.state&&
                sys.state.allocation&&
                sys.state.allocation.energy
              )
            );
        },0);
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

      function rafraichirBasicTrainingIdleV120_(){
        const bt=basicTrainingIdleV120_();

        if(!bt)return;

        const total=
          totalAllocationBasicTrainingIdleV120_();

        bt.energy=bt.energy||{};
        bt.energy.idle=
          idleEntier_(
            idleEtat&&idleEtat.energie
          );
        bt.energy.allocated=
          total;
        bt.energy.cap=
          idleEntier_(
            idleEtat&&idleEtat.energieMax
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
            level.textContent=
              formatGrandNombreIdleV70_(
                skill.level
              );
          }

          if(allocation){
            allocation.textContent=
              idleEntier_(
                skill.allocation
              )+
              ' ⚡';
          }

          if(cap){
            cap.textContent=
              String(
                capValeur
              );
          }

          if(nextCap){
            nextCap.textContent=
              String(
                idleEntier_(
                  skill.nextCap||
                  capValeur
                )
              );

            nextCap.classList.toggle(
              'ready',
              Boolean(
                skill.maxReductionReached
              )
            );
          }

          if(speed){
            speed.textContent=
              vitesse
                .toFixed(2)
                .replace('.',',')+
              ' niv/s';
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
            allocation:idleEntier_(loc.allocation)
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
          !idleEtat ||
          !joueur
        ){
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-14 */
        if(
          idleCombatEnPauseApresDefaiteV1 &&
          !idleEtat.combatBossActif
        ){
          [
            'energie',
            'energieMax',
            'productionSeconde',
            'renaissances'
          ].forEach(function(cle){
            if(joueur[cle]!==undefined){
              idleEtat[cle]=joueur[cle];
            }
          });

          if(
            joueur.energieTick&&
            typeof joueur.energieTick==='object'
          ){
            idleEtat.energieTick=
              Object.assign(
                {},
                idleEtat.energieTick||{},
                joueur.energieTick
              );

            idleResteTickEnergieMsV114=
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
            idleEtat[cle]=
              joueur[cle];
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
            idleEtat[cle]=
              Math.max(
                idleNombre_(idleEtat[cle]),
                idleNombre_(joueur[cle])
              );
          }
        });

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-16 */

        if(
          joueur.basicTraining&&
          typeof joueur.basicTraining==='object'
        ){
          idleEtat.basicTraining=
            fusionnerBasicTrainingPlusAvanceIdleV166_(
              idleEtat.basicTraining,
              joueur.basicTraining
            );
        }

        if(
          joueur.combatPrincipal&&
          typeof joueur.combatPrincipal==='object'
        ){
          idleEtat.combatPrincipal=
            Object.assign(
              {},
              joueur.combatPrincipal
            );
        }

        if(
          joueur.energieTick&&
          typeof joueur.energieTick==='object'
        ){
          idleEtat.energieTick=
            Object.assign(
              {},
              idleEtat.energieTick||{},
              joueur.energieTick
            );

          idleResteTickEnergieMsV114=
            Math.max(
              0,
              idleNombre_(
                joueur.energieTick.resteMs
              )
            );
        }

        idleDernierTickLocalV40=
          Date.now();

        rafraichirBasicTrainingIdleV120_();
        rafraichirEnergieEtBoutonsIdleV9_();
      }

      function envoyerAllocationsBasicTrainingIdleV120_(){
        if(
          !SOREAL_SESSION ||
          !idleEtat ||
          !basicTrainingIdleV120_()
        ){
          return;
        }

        if(
          idleBasicTrainingSaveBusyV120
        ){
          idleBasicTrainingDirtyV120=true;
          return;
        }

        idleBasicTrainingSaveBusyV120=true;
        idleBasicTrainingDirtyV120=false;

        const payload=
          allocationsBasicTrainingIdleV120_();

        google.script.run
          .withSuccessHandler(function(res){
            idleBasicTrainingSaveBusyV120=false;

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-17 */
            if(res&&res.ok){
              appliquerEtatBasicTrainingIdleV120_(
                res
              );
            }else{
              idleBasicTrainingDirtyV120=true;
              synchroniserJeuIdleV7_(
                true
              );
            }

            if(idleBasicTrainingDirtyV120){
              programmerEnvoiBasicTrainingIdleV120_(
                res&&res.ok?30:120
              );
            }
          })
          .withFailureHandler(function(){
            idleBasicTrainingSaveBusyV120=false;
            idleBasicTrainingDirtyV120=true;

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
        idleBasicTrainingDirtyV120=true;

        if(idleBasicTrainingSaveTimerV120){
          clearTimeout(
            idleBasicTrainingSaveTimerV120
          );
        }

        idleBasicTrainingSaveTimerV120=
          setTimeout(
            function(){
              idleBasicTrainingSaveTimerV120=null;

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

        return Math.max(
          1,
          idleEntier_(
            input&&input.value
          )||1
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
              idleEtat&&
              idleEtat.energie
            )
          );

        let cible=courant;

        if(action==='plus'){
          cible=
            courant+
            Math.min(
              inputBasicTrainingIdleV120_(),
              idleAvant
            );
        }else if(action==='moins'){
          cible=
            Math.max(
              0,
              courant-
              inputBasicTrainingIdleV120_()
            );
        }else if(action==='cap'){
          cible=
            capBasicTrainingLocalIdleV120_(
              skill
            );

          if(cible>courant){
            cible=
              courant+
              Math.min(
                cible-courant,
                idleAvant
              );
          }
        }

        cible=
          Math.max(
            0,
            idleEntier_(
              cible
            )
          );

        const delta=
          cible-courant;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-18 */
        if(
          action!=='moins'&&
          delta<=0&&
          idleAvant<=0
        ){
          messageFlottantIdleV32_(
            '⚡ Aucune énergie Idle disponible à allouer pour le moment.'
          );
        }

        skill.allocation=
          cible;

        idleEtat.energie=
          Math.max(
            0,
            Math.min(
              Math.max(
                0,
                idleEntier_(
                  idleEtat.energieMax
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
                idleEtat&&
                idleEtat.energie
              )
            :idleEntier_(
                idleEtat&&
                idleEtat.energieMax
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

        idleEtat.energie=
          Math.min(
            Math.max(
              0,
              idleEntier_(
                idleEtat.energieMax
              )-
              allocationMetaEnergieIdleV1_()
            ),
            idleEntier_(
              idleEtat.energie
            )+
            rendu
          );

        rafraichirBasicTrainingIdleV120_();
        rafraichirEnergieEtBoutonsIdleV9_();

        programmerEnvoiBasicTrainingIdleV120_(
          20
        );
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
          }
        });

        if(
          change &&
          idleMenuActifV28===
            'entrainement'
        ){
          const root=
            document.querySelector(
              '.soreal-idle-page-root-v28'
            );

          if(root){
            root.innerHTML=
              pageEntrainementIdleV28_(
                idleEtat
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
          idleEtat&&
          idleEtat.combatPrincipal&&
          typeof idleEtat.combatPrincipal==='object'
            ?idleEtat.combatPrincipal
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

        const attaqueArrondie=
          Math.max(
            100,
            Math.round(
              (
                attaque+
                bonusBoutique
              )*
              multiplicateurStuffAttaque*
              multiplicateurPermanent
            )
          );

        const defenseArrondie=
          Math.max(
            100,
            Math.round(
              defense*
              multiplicateurStuffDefense*
              multiplicateurPermanent
            )
          );

        combatPrincipal.attaqueEntrainement=
          attaque;

        combatPrincipal.defenseEntrainement=
          defense;

        idleEtat.combatPrincipal=
          combatPrincipal;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-21 */
        const pvAvant=
          Math.max(
            0,
            idleNombre_(
              idleEtat.pvJoueur
            )
          );

        const pvMaxAvant=
          Math.max(
            1,
            idleNombre_(
              idleEtat.pvJoueurMax
            )
          );

        const pvMaxCalcule=
          Math.max(
            1,
            attaqueArrondie*
            10
          );

        idleEtat.force=
          attaqueArrondie;

        idleEtat.endurance=
          defenseArrondie;

        idleEtat.puissance=
          attaqueArrondie;

        idleEtat.defense=
          defenseArrondie;

        idleEtat.pvJoueurMax=
          idleEtat.combatBossActif
            ?Math.max(
                pvMaxAvant,
                pvMaxCalcule
              )
            :pvMaxCalcule;

        idleEtat.pvJoueur=
          Math.min(
            idleEtat.pvJoueurMax,
            pvAvant
          );

        bt.attack=
          attaque;

        bt.defense=
          defense;

        rafraichirBasicTrainingIdleV120_();
      }

      window.__ajusterBasicTrainingIdleV120__=
        ajusterBasicTrainingIdleV120_;

      window.__presetBasicTrainingIdleV120__=
        presetBasicTrainingIdleV120_;

      window.__viderBasicTrainingIdleV120__=
        viderBasicTrainingIdleV120_;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-22 */
      window.__energieDisponibleIdleV9__=
        energieDisponibleIdleV9_;


      function idleHtml_(v){
        return escapeHtml(String(v==null?'':v));
      }

      function idleNombre_(v){
        const n=Number(v);
        return Number.isFinite(n)?n:0;
      }

      function idleEntier_(v){
        return Math.max(0,Math.floor(idleNombre_(v)));
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-23 */
      function pousserEtatVersRuntimePartageIdleV1_(){
        if(
          window.__SOREAL_IDLE_RUNTIME_V1__&&
          typeof window.__SOREAL_IDLE_RUNTIME_V1__.pushState==='function'
        ){
          window.__SOREAL_IDLE_RUNTIME_V1__.pushState(idleEtat);
        }
      }

      function formatEnergieIdleV50_(v){
        return String(
          Math.max(
            0,
            Math.floor(
              idleNombre_(v)+1e-9
            )
          )
        );
      }


      function emojiObjetIdleV50_(objet){
        const presentation=window.__SOREAL_IDLE_ITEM_PRESENTATION_V1__;
        if(presentation&&typeof presentation.emojiObjet==='function'){
          return presentation.emojiObjet(objet);
        }
        return '📦 📦';
      }

      function boutonIdle_(){
        return document.getElementById('navButtonSorealIdle');
      }

      function afficherBoutonIdle_(visible){
        const bouton=boutonIdle_();
        if(!bouton)return;
        bouton.style.display=visible?'':'none';
      }

      function marquerBoutonIdleActif_(){
        document.querySelectorAll('.nav-button').forEach(function(btn){
          btn.classList.remove('active','idle-open');
          btn.removeAttribute('data-idle-open-v186');
        });

        const bouton=boutonIdle_();

        if(bouton){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-24 */
          bouton.classList.remove('active','idle-open');
          bouton.setAttribute('data-idle-open-v186','1');
        }
      }

      function styleIdle_(){
        /* Styles extracted to /soreal-idle-ui.css (V7 bulk split). */
      }

      let idleLoadingProgressV55=8;
      let idleLoadingTimerV55=null;
      let idleLoadingDotsV55=0;

      function arreterAnimationChargementIdleV55_(){
        if(idleLoadingTimerV55){
          clearInterval(
            idleLoadingTimerV55
          );
          idleLoadingTimerV55=null;
        }
      }


      function majChargementIdleV55_(
        progression,
        message
      ){
        idleLoadingProgressV55=
          Math.max(
            idleLoadingProgressV55,
            Math.min(
              98,
              idleNombre_(
                progression
              )
            )
          );

        const fill=
          document.getElementById(
            'sorealIdleLoadingFillV55'
          );

        const percent=
          document.getElementById(
            'sorealIdleLoadingPercentV55'
          );

        const statut=
          document.getElementById(
            'sorealIdleLoadingStatusV55'
          );

        if(fill){
          fill.style.width=
            idleLoadingProgressV55+
            '%';
        }

        if(percent){
          percent.textContent=
            Math.floor(
              idleLoadingProgressV55
            )+
            ' %';
        }

        if(
          statut &&
          message
        ){
          statut.textContent=
            String(message);
        }
      }


      function demarrerAnimationChargementIdleV55_(){
        arreterAnimationChargementIdleV55_();

        idleLoadingTimerV55=
          setInterval(function(){
            if(
              PAGE_ACTIVE!=='idle'
            ){
              arreterAnimationChargementIdleV55_();
              return;
            }

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-25 */
            if(idleLoadingProgressV55<55){
              idleLoadingProgressV55+=
                2.4;
            }else if(
              idleLoadingProgressV55<78
            ){
              idleLoadingProgressV55+=
                1.25;
            }else if(
              idleLoadingProgressV55<91
            ){
              idleLoadingProgressV55+=
                .48;
            }else if(
              idleLoadingProgressV55<94
            ){
              idleLoadingProgressV55+=
                .12;
            }

            idleLoadingDotsV55=
              (
                idleLoadingDotsV55+1
              )%4;

            const fill=
              document.getElementById(
                'sorealIdleLoadingFillV55'
              );

            const percent=
              document.getElementById(
                'sorealIdleLoadingPercentV55'
              );

            const dots=
              document.getElementById(
                'sorealIdleLoadingDotsV55'
              );

            if(fill){
              fill.style.width=
                idleLoadingProgressV55+
                '%';
            }

            if(percent){
              percent.textContent=
                Math.floor(
                  idleLoadingProgressV55
                )+
                ' %';
            }

            if(dots){
              dots.textContent=
                '.'.repeat(
                  idleLoadingDotsV55
                );
            }
          },300);
      }


      function rendreIdleChargement_(){
        styleIdle_();

        idleLoadingProgressV55=8;

        document.getElementById('app').innerHTML=
          header()+
          `<section class="soreal-idle-native-v4">
            <div class="soreal-idle-hero-v4">
              <div class="soreal-idle-kicker-v4">SOREAL</div>
              <div class="soreal-idle-title-v4">SOREAL IDLE</div>
              <div class="soreal-idle-sub-v4">
                Chargement de ton personnage
                <span
                  id="sorealIdleLoadingDotsV55"
                  class="soreal-idle-loading-dots-v55"
                ></span>
              </div>
            </div>

            <div class="soreal-idle-loading-v55">
              <div class="soreal-idle-loading-head-v55">
                <div class="soreal-idle-loading-title-v55">
                  Initialisation du jeu
                </div>

                <div
                  id="sorealIdleLoadingPercentV55"
                  class="soreal-idle-loading-percent-v55"
                >
                  8 %
                </div>
              </div>

              <div class="soreal-idle-loading-track-v55">
                <div
                  id="sorealIdleLoadingFillV55"
                  class="soreal-idle-loading-fill-v55"
                  style="width:8%"
                ></div>
              </div>

              <div
                id="sorealIdleLoadingStatusV55"
                class="soreal-idle-loading-status-v55"
              >
                Connexion au moteur…
              </div>
            </div>
          </section>`;

        demarrerAnimationChargementIdleV55_();
      }


      function rendreIdleErreur_(message){
        arreterAnimationChargementIdleV55_();
        styleIdle_();

        document.getElementById('app').innerHTML=
          header()+
          `<section class="soreal-idle-native-v4">
            <div class="soreal-idle-hero-v4">
              <div class="soreal-idle-kicker-v4">Prototype privé</div>
              <div class="soreal-idle-title-v4">SOREAL IDLE</div>
              <div class="soreal-idle-sub-v4">Le moteur a renvoyé une erreur.</div>
              <div class="soreal-idle-badge-v4">🔒 ${IDLE_TEST_VERSION}</div>
            </div>
            <div class="soreal-idle-status-v4 error">
              ${idleHtml_(message||'Erreur inconnue')}
            </div>
          </section>`;
      }

      let idleDernierTickLocalV40=Date.now();
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-26 */
      let idleDernierTickBasicTrainingV166=Date.now();
      const IDLE_BASIC_TRAINING_RATTRAPAGE_MAX_MS_V166=12*60*60*1000;
      let idleResteTickEnergieMsV114=0;


      function actualiserCooldownBossIdleV100_(
        maintenant
      ){
        if(!idleEtat)return;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-27 */
        void maintenant;

        idleEtat.bossRespawnJusqua=0;
        idleEtat.bossRespawnSecondesRestantes=0;
        idleEtat.bossDisponible=true;

        const el=
          document.getElementById(
            'sorealIdleBossRespawnV100'
          );

        if(el){
          el.textContent='';
          el.classList.add('ready');
        }

        const start=
          document.getElementById(
            'sorealIdleBossStartV100'
          );

        if(start){
          start.disabled=
            Boolean(
              idleEtat.combatBossActif ||
              idlePopupBloqueCombatV102 ||
              idlePopupActifV75 ||
              idlePopupQueueV75.length ||
              idleEtat.bossBloqueRenaissance ||
              idleNombre_(idleEtat.pvJoueur)<=0
            );
        }
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-28 */
      function rafraichirCommandesFightBossIdleV167_(){
        if(!idleEtat)return;
        actualiserCooldownBossIdleV100_(Date.now());

        const fuite=
          document.querySelector(
            '.soreal-idle-boss-control-v39.stop'
          );
        if(fuite){
          fuite.disabled=!idleEtat.combatBossActif;
        }

      }

      function transitionMortBossIdleV61_(){
        const host=
          document.getElementById(
            'sorealIdleBossImageHostV36'
          );

        if(!host)return;

        const image=
          host.querySelector(
            'img'
          );

        if(image){
          image.classList.add(
            'soreal-idle-boss-death-v61'
          );
        }

        const overlay=
          document.createElement(
            'div'
          );

        overlay.className=
          'soreal-idle-boss-transition-v61';

        overlay.textContent=
          '🏆 BOSS VAINCU';

        host.appendChild(
          overlay
        );

        if(idleEtat){
          idleEtat.combatBossActif=false;
          idleEtat.bossRespawnJusqua=0;
          idleEtat.bossRespawnSecondesRestantes=0;
          idleEtat.bossDisponible=true;

          const courant=
            Array.isArray(
              idleEtat.bossCatalogue
            )
              ?idleEtat.bossCatalogue.find(
                  function(boss){
                    return (
                      idleEntier_(boss.numero)===
                      idleEntier_(idleEtat.bossSelection)
                    );
                  }
                )
              :null;

          if(courant){
            courant.etat='vaincu';
            courant.selectionnable=false;
            courant.selectionne=false;
          }

          ajouterLogCombatIdleV70_(
            'system',
            '☠️ Ce boss reste mort jusqu’à la Renaissance · passage au boss suivant.'
          );
        }
      }

      /*
       * 2026-09-24 (Norman : « quand on bat un boss, bien souvent, l'écran reste bloqué sur "Boss vaincu", il faut changer d'écran
       * et revenir pour voir le nouveau boss »). Le client prédit la victoire avant que le serveur (qui fait foi) ne l'ait enregistrée :
       * la synchronisation forcée unique lancée à ce moment revient alors « pas encore vaincu », l'état local est conservé
       * (appliquerSynchroCombatSansReflowIdleV116_) et plus rien ne relançait de synchronisation, donc l'écran restait figé jusqu'à
       * un changement de menu (qui recharge tout). On relance la synchronisation forcée toutes les 1,2 s tant que la victoire
       * n'est pas confirmée (le rendu qui affiche le nouveau boss remet le drapeau à zéro et arrête la surveillance) ; au bout de
       * 15 s sans confirmation on abandonne la prédiction locale et on adopte l'état du serveur au lieu de rester figé.
       */
      let idleVictoireSurveillanceV1=null;
      function arreterSurveillanceVictoireBossIdleV1_(){
        if(idleVictoireSurveillanceV1){
          clearInterval(idleVictoireSurveillanceV1);
          idleVictoireSurveillanceV1=null;
        }
      }
      function surveillerConfirmationVictoireBossIdleV1_(){
        arreterSurveillanceVictoireBossIdleV1_();
        const debut=Date.now();
        idleVictoireSurveillanceV1=setInterval(function(){
          if(PAGE_ACTIVE!=='idle'||!idleEtat||!idleVictoireBossLocaleV49){
            arreterSurveillanceVictoireBossIdleV1_();
            return;
          }
          if(Date.now()-debut>15000){
            arreterSurveillanceVictoireBossIdleV1_();
            google.script.run
              .withSuccessHandler(function(etat){
                if(PAGE_ACTIVE!=='idle'||!idleVictoireBossLocaleV49||!etat||!etat.ok||!etat.joueur)return;
                idleEtat=etat.joueur;
                idleCombatArmeLocalV206=false;
                rendreIdleEtat_({ok:true,joueur:etat.joueur});
              })
              .withFailureHandler(function(){})
              .obtenirEtatSorealIdle(SOREAL_SESSION);
            return;
          }
          synchroniserJeuIdleV7_(true);
        },1200);
      }

      function metaTickEnergieIdleV114_(){
        const prod=
          Math.max(
            0.01,
            idleNombre_(
              idleEtat &&
              idleEtat.productionSeconde
            ) || 0.25
          );

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-29 */
        const minimumMs=20;

        const gain=
          Math.max(
            1,
            Math.ceil(
              prod*minimumMs/1000-
              1e-12
            )
          );

        const dureeMs=
          Math.max(
            minimumMs,
            1000*gain/prod
          );

        return {
          gain:gain,
          dureeMs:dureeMs
        };
      }


      function largeurBarreCombatIdleV121_(
        element,
        pourcentage
      ){
        if(!element)return;

        const pct=
          Math.max(
            0,
            Math.min(
              100,
              idleNombre_(
                pourcentage
              )
            )
          );

        const precedent=
          idleNombre_(
            element.dataset&&
            element.dataset.idlePctV121,
            -1
          );

        if(
          precedent>=0 &&
          Math.abs(
            precedent-pct
          )<0.015
        ){
          return;
        }

        element.dataset.idlePctV121=
          String(pct);

        element.style.width=
          pct+'%';
      }


      function largeurBarreVieCombatIdleV163_(element,pourcentage){
        if(!element)return;
        const pct=Math.max(0,Math.min(100,idleNombre_(pourcentage)));
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-30 */
        element.style.setProperty('transition','none','important');
        largeurBarreCombatIdleV121_(element,pct);
      }

      function texteCombatIdleV121_(
        element,
        texte
      ){
        if(!element)return;

        const valeur=
          String(
            texte||''
          );

        if(
          element.textContent===
          valeur
        ){
          return;
        }

        element.textContent=
          valeur;
      }


      /*
       * 2026-09-23 : les nombres de PV / regen changeaient de largeur à chaque
       * rafraîchissement (formatGrandNombreIdleV70_ retire les zéros finaux :
       * "1.60" devenait "1.6") et le suffixe de regen disparaissait dès que les
       * PV étaient pleins, d'où un affichage qui clignote et dont les chiffres
       * bougent. Décimales fixes ici, suffixe toujours présent tant que la
       * regen est > 0, et chiffres tabulaires (soreal-idle-ui.css).
       */
      function formaterDecimalesFixesIdleV1_(valeur,decimales){
        const n=idleNombre_(valeur);
        if(Math.abs(n)>=1000)return formatGrandNombreIdleV70_(n,decimales);
        return n.toFixed(Math.max(0,decimales)).replace('.',',');
      }

      function regenPvFightBossNguParSecondeV164_(defense){
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-31 */
        return Math.max(
          0,
          Math.max(
            0,
            idleNombre_(defense)
          )/
          20
        );
      }


      function mettreAJourJeuIdleLocalV7_(){
        if(
          !idleEtat ||
          PAGE_ACTIVE!=='idle'
        ){
          return;
        }

        const maxTotal=
          idleNombre_(
            idleEtat.energieMax
          );

        const max=
          Math.max(
            0,
            maxTotal-
            totalAllocationBasicTrainingIdleV120_()-
            allocationMetaEnergieIdleV1_()
          );

        const prod=
          Math.max(
            0,
            idleNombre_(
              idleEtat.productionSeconde
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
              idleDernierTickLocalV40
            )
          );

        idleDernierTickLocalV40=
          maintenantTick;

        const dt=
          ecouleTickMs/
          1000;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-32 */
        progresserBasicTrainingLocalIdleV120_(
          ecouleBasicTrainingMs/
          1000
        );

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-33 */
        patcherResumeStatsIdleV28_(
          idleEtat
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
            idleNombre_(idleEtat.energie)
          );

        const energieAuPlafond=
          energieAvantTick>=max;

        if(energieAuPlafond){
          idleResteTickEnergieMsV114=0;
        }else{
          idleResteTickEnergieMsV114+=
            ecouleTickMs;
        }

        const ticksEnergie=
          energieAuPlafond
            ?0
            :Math.max(
                0,
                Math.floor(
                  (
                    idleResteTickEnergieMsV114+
                    1e-7
                  )/
                  metaTickEnergie.dureeMs
                )
              );

        if(ticksEnergie>0){
          idleResteTickEnergieMsV114=
            Math.max(
              0,
              idleResteTickEnergieMsV114-
              ticksEnergie*
              metaTickEnergie.dureeMs
            );

          idleEtat.energie=
            Math.min(
              max,
              Math.floor(
                energieAvantTick+
                ticksEnergie*
                metaTickEnergie.gain+
                1e-9
              )
            );

          if(idleNombre_(idleEtat.energie)>=max){
            idleResteTickEnergieMsV114=0;
          }
        }else{
          idleEtat.energie=
            Math.floor(
              energieAvantTick+
              1e-9
            );
        }

        actualiserManaSortsIdleV90_(
          maintenantTick
        );

        actualiserCooldownBossIdleV100_(
          maintenantTick
        );

        actualiserCooldownAventureIdleV100_(
          maintenantTick
        );


        actualiserEffetsVisuelsJoueurIdleV112_(
          maintenantTick
        );

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-35 */
        if(!idleEtat.combatBossActif){
          const regenPvSecJoueurReposV1=
            regenPvFightBossNguParSecondeV164_(
              idleEtat.defense
            );
          idleEtat.pvJoueur=
            Math.min(
              idleNombre_(idleEtat.pvJoueurMax),
              idleNombre_(idleEtat.pvJoueur)+regenPvSecJoueurReposV1*dt
            );
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-36 */
        if(
          !idleEtat.combatBossActif &&
          idleNombre_(idleEtat.bossPv)>0 &&
          idleNombre_(idleEtat.bossPv)<
            idleNombre_(idleEtat.bossPvMax)
        ){
          const regenBossParSecV172=
            Math.max(
              0,
              idleNombre_(
                idleEtat.regenBoss
              )
            );

          if(regenBossParSecV172>0){
            idleEtat.bossPv=
              Math.min(
                idleNombre_(
                  idleEtat.bossPvMax
                ),
                idleNombre_(
                  idleEtat.bossPv
                )+
                regenBossParSecV172*
                dt
              );
          }
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-37 */
        if(!idleEtat.combatBossActif){
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
            idleEntier_(maxTotal);
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-38 */
        const energyBarEl=
          document.getElementById(
            'sorealIdleEnergyBarV11'
          );

        if(energyBarEl){
          if(ticksEnergie>0)jouerEclatEnergieTickIdleV13_();

          mettreAJourBarreProgressionContinueV1_(
            energyBarEl,
            energieDisponibleIdleV9_(),
            idleResteTickEnergieMsV114/
              Math.max(1,metaTickEnergie.dureeMs),
            maxTotal,
            metaTickEnergie.gain
          );
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-39 */
        const augVisual=idleEtat.__augmentationsVisualV215;
        if(augVisual&&PAGE_ACTIVE==='idle'){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-40 */
          Object.keys(augVisual.defs||{}).forEach(function(id){
            const d=augVisual.defs[id]||{};
            [['main',d.progress,d.seconds,d.waiting,d.goldCost],['upgrade',d.upgradeProgress,d.upgradeSeconds,d.upgradeWaiting,d.upgradeGoldCost]].forEach(function(x){
              const el=document.querySelector('[data-idle-aug-bar-v215="'+id+':'+x[0]+'"]');
              if(!el)return;
              const seconds=idleNombre_(x[2]);
              /* Compte à rebours « Niveau suivant dans … » : suit la même horloge que la barre. */
              const etaEl=document.querySelector('[data-idle-aug-eta-v1="'+id+':'+x[0]+'"]');
              if(etaEl&&typeof window.__texteEtaAugmentIdleV1__==='function'){
                etaEl.textContent=window.__texteEtaAugmentIdleV1__({seconds:seconds,progress:x[1],waiting:x[3],goldCost:x[4],gold:augVisual.defs[id].gold},(performance.now()-augVisual.at)/1000);
              }
              /* Barre pleine faute d'Or : elle reste pleine (comme NGU) au lieu de tourner à vide. */
              if(x[3]&&seconds>0){
                if(el.__idleAugAnimationV217){el.__idleAugAnimationV217.cancel();el.__idleAugAnimationV217=null;delete el.dataset.idleAugDurationV217;}
                el.style.width='100%';
                el.style.transform='scaleX(1)';
                return;
              }
              if(!(seconds>0)){
                if(el.__idleAugAnimationV217){el.__idleAugAnimationV217.cancel();el.__idleAugAnimationV217=null;}
                el.style.width='0%';
                return;
              }
              const duration=Math.max(20,seconds*1000);
              if(!el.__idleAugAnimationV217||Math.abs(idleNombre_(el.dataset.idleAugDurationV217)-duration)>.1){
                if(el.__idleAugAnimationV217)el.__idleAugAnimationV217.cancel();
                el.style.width='100%';
                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-41 */
                /*
                 * Cycles longs (≥ 2 s) : remplissage linéaire honnête 0 -> 100 % puis retour à 0 (Norman, 2026-09-24 : la barre restait pleine
                 * ~26 % du cycle). Les paliers d'affichage ne servent qu'aux cycles très courts, échantillonnés à 15 Hz (voir V220).
                 */
                const animation=el.animate(
                  seconds>=2
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
                  {duration:duration,iterations:Infinity,easing:'linear'}
                );
                animation.currentTime=Math.max(0,Math.min(.999999,idleNombre_(x[1])))*duration;
                el.__idleAugAnimationV217=animation;
                el.dataset.idleAugDurationV217=String(duration);
              }
            });
          });
        }

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
            idleEntier_(maxTotal);
        }


        const vitesseEl=
          document.getElementById(
            'sorealIdleEnergySpeedV34'
          );

        if(vitesseEl){
          vitesseEl.textContent=
            'Tick : '+
            (
              dureeTickEnergieIdleV34_()/
              1000
            ).toFixed(
              dureeTickEnergieIdleV34_()>=1000
                ?2
                :3
            )+
            ' s · +'+
            gainParTickEnergieIdleV34_()+
            ' ⚡';
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-42 */
        const dpsBase=
          Math.max(
            0,
            idleNombre_(
              idleEtat.puissance
            )-
            idleNombre_(
              idleEtat.defenseBoss
            )
          );

        if(
          idleEtat.combatBossActif &&
          idleCombatArmeLocalV206 &&
          !idleVictoireBossLocaleV49
        ){
          traiterCapacitesBossLocalesIdleV70_(
            maintenantTick
          );

          const effetsMagie=
            idleEtat.magie&&
            idleEtat.magie.effets
              ?idleEtat.magie.effets
              :{};

          const immuniseParalysie=
            maintenantTick<
            idleNombre_(
              effetsMagie.immuniteParalysieJusqua
            );

          const paralyse=
            (
              maintenantTick<
              idleParalysieJusquaV70
            ) &&
            !immuniseParalysie;

          const bouclierActif=
            maintenantTick<
            idleBouclierJusquaV70;

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
              idleEtat.bossCapacites
            )
              ?idleEtat.bossCapacites.find(
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
              idleEtat.bossSelection
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
                    idleBouclierReductionV70/
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
                      idleEtat.regenBoss
                    )
                  )
                );
          if(
              dps>0 &&
              idleNombre_(
                idleEtat.bossPv
              )>0 &&
              !idleCombatEnPauseApresDefaiteV1
            ){
              const bossAvant=
                idleNombre_(
                  idleEtat.bossPv
                );

              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-43 */
              const degatsBoss=
                Math.min(
                  bossAvant,
                  Math.max(
                    0,
                    dps*dt
                  )
                );

              if(degatsBoss>0){
                idleCombatLogDegatsJoueurV70+=
                  degatsBoss;

                idleEtat.bossPv=
                  Math.max(
                    0,
                    bossAvant-degatsBoss
                  );
              }

              if(
                bossAvant>0 &&
                idleEtat.bossPv<=0 &&
                !idleVictoireBossLocaleV49
              ){
                idleVictoireBossLocaleV49=
                  true;

                idleCombatArmeLocalV206=false;
                idleEtat.combatBossActif=
                  false;
                jouerEffetAudioIdleV199_('victory');

                const gainXpLocal=
                  idleNombre_(
                    idleEtat.recompenseBossActuel&&
                    idleEtat.recompenseBossActuel.xp
                  );

                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-44 */
                ajouterLogCombatIdleV70_(
                  'bossxp',
                  '🏆 '+
                  String(
                    idleEtat.bossActuel||'Boss'
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
                idleEtat.bossPv=0;
                const bossPvFinalEl=document.getElementById('sorealIdleBossPvV7');
                if(bossPvFinalEl){
                  texteCombatIdleV121_(
                    bossPvFinalEl,
                    '❤️ 0 / '+formatGrandNombreIdleV70_(idleEtat.bossPvMax)
                  );
                }
                const bossBarFinalEl=document.getElementById('sorealIdleBossBarV7');
                if(bossBarFinalEl){
                  largeurBarreVieCombatIdleV163_(bossBarFinalEl,0);
                  void bossBarFinalEl.offsetWidth;
                }

                nettoyerImpactsIdleV50_();

                const apresBarreVide=function(){
                  transitionMortBossIdleV61_();
                  synchroniserJeuIdleV7_(true);
                  surveillerConfirmationVictoireBossIdleV1_();
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

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-46 */

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-47 */
            if(!idleCombatEnPauseApresDefaiteV1){
            const attaqueBrute=
              Math.max(
                0,
                idleNombre_(
                  idleEtat.attaqueBoss
                )
              )*
              (
                idleFureurActiveV70
                  ?multiplicateurFureurLocaleIdleV70_()
                  :1
              );

            const defense=
              Math.max(
                0,
                idleNombre_(
                  idleEtat.defense
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
                  idleEtat.pvJoueur
                ),
                Math.max(
                  0,
                  recusNet*dt
                )
              );

            idleCombatLogDegatsBrutsV100+=
              brutContinu;

            idleCombatLogBloquesV70+=
              bloqueContinu;

            if(degatsJoueur>0){
              idleCombatLogDegatsBossV70+=
                degatsJoueur;

              idleEtat.pvJoueur=
                Math.max(
                  0,
                  idleNombre_(
                    idleEtat.pvJoueur
                  )-
                  degatsJoueur
                );
            }

            if(
              idleEtat.pvJoueur<=0
            ){
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-51 */
              idleEtat.pvJoueur=0;
              idleCombatEnPauseApresDefaiteV1=true;
              idleCombatArmeLocalV206=false;
              idleEtat.combatBossActif=false;
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

        if(
          idleEtat.combatBossActif &&
          maintenantTick-
          idleCombatLogDernierResumeV70>=
          1000
        ){
          idleCombatLogDernierResumeV70=
            maintenantTick;

          if(idleCombatLogDegatsJoueurV70>0){
            const infliges=
              idleCombatLogDegatsJoueurV70;

            ajouterLogCombatIdleV70_(
              'player',
              '⚔️ '+
              String(
                idleEtat.nom||'Joueur'
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
                idleEtat.bossActuel||'Boss'
              )+
              '.'
            );
          }else if(
            maintenantTick<
            idleParalysieJusquaV70
          ){
            ajouterLogCombatIdleV70_(
              'skill',
              '⚡ '+
              String(
                idleEtat.nom||'Joueur'
              )+
              ' est paralysé et ne peut pas attaquer.'
            );
          }

          if(
            idleCombatLogDegatsBrutsV100>0 ||
            idleCombatLogDegatsBossV70>0
          ){
            const brut=
              idleCombatLogDegatsBrutsV100;

            const recus=
              idleCombatLogDegatsBossV70;

            const bloques=
              Math.max(
                0,
                idleCombatLogBloquesV70
              );

            ajouterLogCombatIdleV70_(
              'boss',
              '👹 '+
              String(
                idleEtat.bossActuel||'Boss'
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
                idleEtat.nom||'Joueur'
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

          idleCombatLogDegatsJoueurV70=0;
          idleCombatLogDegatsBossV70=0;
          idleCombatLogDegatsBrutsV100=0;
          idleCombatLogBloquesV70=0;
          idleCombatLogCritiquesJoueurV117=0;
          idleCombatLogCritiquesBossV117=0;
        }

        const joueurPvEl=
          document.getElementById(
            'sorealIdleJoueurPvV15'
          );

        if(joueurPvEl){
          const regenJoueurVisibleV176=
            regenPvFightBossNguParSecondeV164_(
              idleEtat.defense
            );

          texteCombatIdleV121_(
            joueurPvEl,
            '❤️ '+
            formatGrandNombreIdleV70_(
              idleEtat.pvJoueur
            )+
            ' / '+
            formatGrandNombreIdleV70_(
              idleEtat.pvJoueurMax
            )+
            (
              regenJoueurVisibleV176>0
                ?' · ↗ +'+
                  formaterDecimalesFixesIdleV1_(
                    regenJoueurVisibleV176,
                    2
                  )+
                  '/s'
                :''
            )
          );
        }

        const joueurBarre=
          document.getElementById(
            'sorealIdleJoueurBarV15'
          );

        if(joueurBarre){
          const pctJoueur=
            idleNombre_(
              idleEtat.pvJoueurMax
            )>0
              ?Math.max(
                  0,
                  Math.min(
                    100,
                    idleNombre_(
                      idleEtat.pvJoueur
                    )/
                    idleNombre_(
                      idleEtat.pvJoueurMax
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


        const bossPvEl=
          document.getElementById(
            'sorealIdleBossPvV7'
          );

        if(bossPvEl){
          const bossEnRegenV174=
            idleNombre_(idleEtat.bossPv)>0 &&
            idleNombre_(idleEtat.regenBoss)>0;

          texteCombatIdleV121_(
            bossPvEl,
            '❤️ '+
            (
              bossEnRegenV174
                ?formaterDecimalesFixesIdleV1_(idleEtat.bossPv,2)
                :formatGrandNombreIdleV70_(idleEtat.bossPv)
            )+
            ' / '+
            formatGrandNombreIdleV70_(
              idleEtat.bossPvMax
            )+
            (
              bossEnRegenV174
                ?' · ↗ +'+
                  formaterDecimalesFixesIdleV1_(
                    idleEtat.regenBoss,
                    2
                  )+
                  '/s'
                :''
            )
          );
        }

        const barre=
          document.getElementById(
            'sorealIdleBossBarV7'
          );

        if(barre){
          const pct=
            idleNombre_(
              idleEtat.bossPvMax
            )>0
              ?Math.max(
                  0,
                  Math.min(
                    100,
                    idleNombre_(
                      idleEtat.bossPv
                    )/
                    idleNombre_(
                      idleEtat.bossPvMax
                    )*
                    100
                  )
                )
              :0;

          largeurBarreVieCombatIdleV163_(
            barre,
            pct
          );
        }

        const aFight=
          aventureMetaIdleV47_(idleEtat);

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
            noteOuBoutonEl.outerHTML=
              '<div class="soreal-idle-adventure-fight-note-v1">⚔️ Combat en cours…</div>';
          }
        }else if(aFight){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-58 */
          const statsRepos=aFight.stats||{};
          const pvMaxRepos=Math.max(0,idleNombre_(statsRepos.hp));

          if(idleEtat&&(idleEtat.adventureRestPv==null||idleEtat.adventureRestPv>pvMaxRepos)){
            idleEtat.adventureRestPv=restPvInitialIdleV1_(pvMaxRepos);
          }

          const pvRepos=idleEtat?Math.max(0,idleEtat.adventureRestPv):pvMaxRepos;

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
                :idleAdventureRespawnStartPendingV165
                  ?'⚔️ Nouveau combat…'
                  :texteProchainCombatAdventureIdleV165_();

            if(noteOuBoutonEl.textContent!==contenuAttendu){
              noteOuBoutonEl.outerHTML=
                '<div class="soreal-idle-adventure-fight-note-v1">'+
                idleHtml_(contenuAttendu)+
                '</div>';
            }
          }
        }
      }

      function appliquerSynchroCombatSansReflowIdleV116_(
        joueurServeur
      ){
        if(
          joueurServeur &&
          joueurServeur.combatBossActif &&
          !idleCombatArmeLocalV206
        ){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-60 */
          if(idleEtat)idleEtat.combatBossActif=false;

          if(
            !idleCombatStopFantomeEnvoyeV206 &&
            idleEtat &&
            SOREAL_SESSION
          ){
            idleCombatStopFantomeEnvoyeV206=true;
            ajouterActionRapideIdleV60_(
              'combat',
              {
                actif:false,
                raison:'garde_client',
                snapshot:snapshotCombatFightBossIdleV173_()
              }
            );
          }
          return true;
        }


        if(!idleEtat||!joueurServeur)return false;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-61 */
        const aventureLocale=aventureMetaIdleV47_(idleEtat);
        const fightLocal=aventureLocale&&aventureLocale.fight;

        if(fightLocal&&fightLocal.active){
          const aventureServeur=aventureMetaIdleV47_(joueurServeur)||aventureLocale;

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-62 */
          const adventureRestPvAvantSyncV1=idleEtat&&idleEtat.adventureRestPv;
          const basicTrainingAvantSyncV166=idleEtat&&idleEtat.basicTraining;

          idleEtat=Object.assign({},joueurServeur);
          idleEtat.basicTraining=
            fusionnerBasicTrainingPlusAvanceIdleV166_(
              basicTrainingAvantSyncV166,
              joueurServeur.basicTraining
            );
          idleEtat.systemes=Object.assign({},joueurServeur.systemes);
          idleEtat.systemes.adventure=Object.assign(
            {},
            aventureServeur,
            {fight:fightLocal}
          );
          if(adventureRestPvAvantSyncV1!=null)idleEtat.adventureRestPv=adventureRestPvAvantSyncV1;

          idleDernierTickLocalV40=Date.now();
          pousserEtatVersRuntimePartageIdleV1_();
          return true;
        }

        const bossSelectionLocaleV167=
          idleEntier_(idleEtat.bossSelection);
        const bossSelectionServeurV167=
          idleEntier_(joueurServeur.bossSelection);
        const bossVaincusLocalV167=
          idleEntier_(idleEtat.bossVaincus);
        const bossVaincusServeurV167=
          idleEntier_(joueurServeur.bossVaincus);

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-63 */
        const serveurConfirmeVictoireBossV167=
          !joueurServeur.combatBossActif&&
          (
            bossSelectionServeurV167>bossSelectionLocaleV167||
            bossVaincusServeurV167>bossVaincusLocalV167
          );

        if(
          idleVictoireBossLocaleV49&&
          !serveurConfirmeVictoireBossV167
        ){
          return true;
        }

        const memeBossServeurV167=
          bossSelectionLocaleV167===
          bossSelectionServeurV167;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-64 */
        if(
          !idleEtat.combatBossActif &&
          idleCombatEnPauseApresDefaiteV1
        ){
          const localAvantRecupV175=idleEtat;

          idleEtat=
            Object.assign(
              {},
              joueurServeur,
              {
                combatBossActif:false,

                pvJoueur:
                  Math.max(
                    0,
                    idleNombre_(localAvantRecupV175.pvJoueur)
                  ),

                pvJoueurMax:
                  Math.max(
                    1,
                    idleNombre_(localAvantRecupV175.pvJoueurMax),
                    idleNombre_(joueurServeur.pvJoueurMax)
                  ),

                bossPv:
                  Math.max(
                    0,
                    idleNombre_(localAvantRecupV175.bossPv)
                  ),

                bossPvMax:
                  Math.max(
                    1,
                    idleNombre_(localAvantRecupV175.bossPvMax)
                  ),

                bossSelection:
                  idleEntier_(localAvantRecupV175.bossSelection),

                bossVaincus:
                  idleEntier_(localAvantRecupV175.bossVaincus),

                bossActuel:
                  localAvantRecupV175.bossActuel,

                bossId:
                  localAvantRecupV175.bossId,

                attaqueBoss:
                  localAvantRecupV175.attaqueBoss,

                defenseBoss:
                  localAvantRecupV175.defenseBoss,

                regenBoss:
                  localAvantRecupV175.regenBoss,

                bossCapacites:
                  localAvantRecupV175.bossCapacites,

                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-65 */
                basicTraining:
                  localAvantRecupV175.basicTraining,

                force:
                  idleNombre_(localAvantRecupV175.force),

                endurance:
                  idleNombre_(localAvantRecupV175.endurance),

                puissance:
                  idleNombre_(localAvantRecupV175.puissance),

                defense:
                  idleNombre_(localAvantRecupV175.defense),

                combatPrincipal:
                  localAvantRecupV175.combatPrincipal
              }
            );

          idleDernierTickLocalV40=Date.now();
          rafraichirEnergieEtBoutonsIdleV9_();
          pousserEtatVersRuntimePartageIdleV1_();
          return true;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-66 */
        if(
          !idleEtat.combatBossActif &&
          idleCombatEnPauseApresDefaiteV1 &&
          joueurServeur.combatBossActif &&
          memeBossServeurV167
        ){
          return true;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-67 */
        if(
          !idleEtat.combatBossActif &&
          !joueurServeur.combatBossActif &&
          memeBossServeurV167
        ){
          const pvJoueurLocalReposV174=
            Math.max(0,idleNombre_(idleEtat.pvJoueur));
          const bossPvLocalReposV174=
            Math.max(0,idleNombre_(idleEtat.bossPv));
          const basicTrainingReposV174=
            idleEtat.basicTraining;

          idleEtat=
            Object.assign(
              {},
              joueurServeur,
              {
                pvJoueur:pvJoueurLocalReposV174,
                bossPv:bossPvLocalReposV174,
                pvJoueurMax:Math.max(
                  idleNombre_(idleEtat.pvJoueurMax),
                  idleNombre_(joueurServeur.pvJoueurMax)
                ),
                bossPvMax:Math.max(
                  idleNombre_(idleEtat.bossPvMax),
                  idleNombre_(joueurServeur.bossPvMax)
                ),
                basicTraining:
                  fusionnerBasicTrainingPlusAvanceIdleV166_(
                    basicTrainingReposV174,
                    joueurServeur.basicTraining
                  ),
                force:Math.max(
                  idleNombre_(idleEtat.force),
                  idleNombre_(joueurServeur.force)
                ),
                endurance:Math.max(
                  idleNombre_(idleEtat.endurance),
                  idleNombre_(joueurServeur.endurance)
                ),
                puissance:Math.max(
                  idleNombre_(idleEtat.puissance),
                  idleNombre_(joueurServeur.puissance)
                ),
                defense:Math.max(
                  idleNombre_(idleEtat.defense),
                  idleNombre_(joueurServeur.defense)
                )
              }
            );

          idleDernierTickLocalV40=Date.now();
          rafraichirEnergieEtBoutonsIdleV9_();
          pousserEtatVersRuntimePartageIdleV1_();
          return true;
        }

        if(!idleEtat.combatBossActif){
          return false;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-68 */
        if(
          !joueurServeur.combatBossActif ||
          !memeBossServeurV167
        ){
          if(
            !idleVictoireBossLocaleV49 &&
            !idleCombatEnPauseApresDefaiteV1
          ){
            return true;
          }
          return false;
        }

        const bossLocal=
          idleNombre_(idleEtat.bossPv);

        const joueurLocal=
          idleNombre_(idleEtat.pvJoueur);

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-69 */
        const bossServeur=
          idleNombre_(
            joueurServeur.bossPv,
            bossLocal
          );

        const joueurServeurPv=
          idleNombre_(
            joueurServeur.pvJoueur,
            joueurLocal
          );

        const bossMaxLocal=
          Math.max(
            1,
            idleNombre_(
              idleEtat.bossPvMax
            )
          );

        const bossMaxServeur=
          Math.max(
            1,
            idleNombre_(
              joueurServeur.bossPvMax,
              bossMaxLocal
            )
          );

        const joueurMaxLocal=
          Math.max(
            1,
            idleNombre_(
              idleEtat.pvJoueurMax
            )
          );

        const joueurMaxServeur=
          Math.max(
            1,
            idleNombre_(
              joueurServeur.pvJoueurMax,
              joueurMaxLocal
            )
          );

        const conserve={
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-70 */
          bossPv:
            Math.min(
              bossLocal,
              bossServeur
            ),
          bossPvMax:
            Math.max(
              bossMaxLocal,
              bossMaxServeur
            ),
          pvJoueur:
            Math.min(
              joueurLocal,
              joueurServeurPv
            ),
          pvJoueurMax:
            Math.max(
              joueurMaxLocal,
              joueurMaxServeur
            ),

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-71 */
          basicTraining:
            fusionnerBasicTrainingPlusAvanceIdleV166_(
              idleEtat.basicTraining,
              joueurServeur.basicTraining
            ),
          force:
            Math.max(
              idleNombre_(idleEtat.force),
              idleNombre_(joueurServeur.force)
            ),
          endurance:
            Math.max(
              idleNombre_(idleEtat.endurance),
              idleNombre_(joueurServeur.endurance)
            ),
          puissance:
            Math.max(
              idleNombre_(idleEtat.puissance),
              idleNombre_(joueurServeur.puissance)
            ),
          defense:
            Math.max(
              idleNombre_(idleEtat.defense),
              idleNombre_(joueurServeur.defense)
            )
        };

        idleEtat=
          Object.assign(
            {},
            joueurServeur,
            conserve
          );

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-72 */
        idleDernierTickLocalV40=
          Date.now();

        initialiserCoupsCombatIdleV116_();
        rafraichirEnergieEtBoutonsIdleV9_();
        pousserEtatVersRuntimePartageIdleV1_();

        return true;
      }


      function synchroniserJeuIdleV7_(
        force
      ){
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-73 */
        if(idleSyncEnCoursV60){
          if(force)idleSyncForcePendingV167=true;
          return;
        }

        if(
          PAGE_ACTIVE!=='idle' ||
          !SOREAL_SESSION ||
          (
            !force &&
            (
              idleFastNetworkBusyV60 ||
              idleFastPendingV60_() ||
              idleAchatEnCoursV5 ||
              idleRecycleBatchV32 ||
              idleAventureEnCoursV17 ||
              idleSortPurchaseBusyV101 ||
              idleSortPurchaseQueueV101.length>0 ||
              metaOccupeIdleV130_() ||
              idleInventoryBusyV160 ||
              idleInventoryMutationQueueV160.length>0 ||
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-74 */
              idleBasicTrainingSaveBusyV120 ||
              idleBasicTrainingDirtyV120
            )
          )
        ){
          return;
        }

        idleSyncEnCoursV60=true;
        if(force)idleSyncForcePendingV167=false;

        function terminerSynchroEtRelancerForceeIdleV167_(){
          idleSyncEnCoursV60=false;
          if(!idleSyncForcePendingV167)return;
          idleSyncForcePendingV167=false;
          setTimeout(function(){
            synchroniserJeuIdleV7_(true);
          },0);
        }

        google.script.run
          .withSuccessHandler(function(res){
            terminerSynchroEtRelancerForceeIdleV167_();

            if(
              PAGE_ACTIVE!=='idle' ||
              !res ||
              !res.ok ||
              !res.joueur
            ){
              return;
            }

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-75 */
            if(
              idleFastNetworkBusyV60 ||
              idleFastPendingV60_()
            ){
              planifierEnvoiRapideIdleV60_(35);
              return;
            }

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-76 */
            if(metaOccupeIdleV130_()){
              return;
            }

            const ancienBossVaincus=
              idleEtat
                ?idleEntier_(
                    idleEtat.bossVaincus
                  )
                :0;
            const ancienXp=
              idleEtat
                ?idleNombre_(
                    idleEtat.xp
                  )
                :0;

            const joueurServeurProtegeV208=
              protegerJoueurServeurInventaireIdleV208_(
                res.joueur
              );

            const joueurSynchronise=
              appliquerSuppressionsLocalesRecycleV38_(
                joueurServeurProtegeV208
              );

            if(
              !appliquerSynchroCombatSansReflowIdleV116_(
                joueurSynchronise
              )
            ){
              const empreinteAvant=
                empreinteStructurelleIdleV1_(
                  idleEtat
                );

              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-77 */
              const adventureRestPvAvantSyncReposV1=
                idleEtat&&idleEtat.adventureRestPv;

              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-78 */
              const avantSyncBasicTrainingV120={
                force:idleEtat&&idleEtat.force,
                endurance:idleEtat&&idleEtat.endurance,
                puissance:idleEtat&&idleEtat.puissance,
                defense:idleEtat&&idleEtat.defense,
                pvJoueur:idleEtat&&idleEtat.pvJoueur,
                pvJoueurMax:idleEtat&&idleEtat.pvJoueurMax,
                basicTraining:idleEtat&&idleEtat.basicTraining
              };

              idleEtat=
                joueurSynchronise;

              if(adventureRestPvAvantSyncReposV1!=null){
                idleEtat.adventureRestPv=
                  adventureRestPvAvantSyncReposV1;
              }

              [
                'force',
                'endurance',
                'puissance',
                'defense',
                'pvJoueurMax'
              ].forEach(function(cle){
                if(avantSyncBasicTrainingV120[cle]!=null){
                  idleEtat[cle]=
                    Math.max(
                      idleNombre_(avantSyncBasicTrainingV120[cle]),
                      idleNombre_(idleEtat[cle])
                    );
                }
              });

              if(avantSyncBasicTrainingV120.pvJoueur!=null){
                idleEtat.pvJoueur=
                  avantSyncBasicTrainingV120.pvJoueur;
              }

              if(
                avantSyncBasicTrainingV120.basicTraining&&
                typeof avantSyncBasicTrainingV120.basicTraining==='object'
              ){
                idleEtat.basicTraining=
                  fusionnerBasicTrainingPlusAvanceIdleV166_(
                    avantSyncBasicTrainingV120.basicTraining,
                    joueurSynchronise.basicTraining
                  );
              }

              const empreinteApres=
                empreinteStructurelleIdleV1_(
                  idleEtat
                );

              if(empreinteAvant!==empreinteApres){
                rendreIdleEtat_({
                  ok:true,
                  joueur:idleEtat
                });
              }else{
                patcherResumeStatsIdleV28_(
                  idleEtat
                );
              }
            }
            if(
              idleNombre_(
                idleEtat.xp
              )>
              ancienXp
            ){
              ajouterLogCombatIdleV70_(
                'reward',
                '+ '+
                formatGrandNombreIdleV70_(
                  idleNombre_(
                    idleEtat.xp
                  )-
                  ancienXp
                )+
                ' XP.'
              );
            }

            const drops=
              idleEtat &&
              idleEtat.progressionHorsLigne &&
              Array.isArray(
                idleEtat.progressionHorsLigne.dropsRecents
              )
                ?idleEtat.progressionHorsLigne.dropsRecents
                :[];

            if(drops.length){
              setTimeout(function(){
                toastIdleV5_(
                  '🎁 Loot : '+
                  String(
                    drops[
                      drops.length-1
                    ].nom||
                    'Nouvel objet'
                  )
                );
              },0);
            }else if(
              idleEntier_(
                idleEtat.bossVaincus
              )>
              ancienBossVaincus
            ){
              setTimeout(function(){
                toastIdleV5_(
                  'Boss vaincu ! Nouveau combat.'
                );
              },0);
            }
          })
          .withFailureHandler(function(){
            terminerSynchroEtRelancerForceeIdleV167_();
          })
          .synchroniserSorealIdle(
            SOREAL_SESSION
          );
      }


      function dureeTickEnergieIdleV34_(){
        return Math.max(
          1,
          Math.round(
            metaTickEnergieIdleV114_()
              .dureeMs
          )
        );
      }


      function gainParTickEnergieIdleV34_(){
        return Math.max(
          1,
          idleEntier_(
            metaTickEnergieIdleV114_()
              .gain
          )
        );
      }


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-79 */
      function jouerEclatEnergieTickIdleV13_(){
        const shine=document.getElementById('sorealIdleEnergyShineV11');
        if(!shine)return;

        shine.classList.remove('tick');
        void shine.offsetWidth;
        shine.classList.add('tick');

        setTimeout(function(){
          if(shine)shine.classList.remove('tick');
        },320);
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-80 */
      /*
       * Tick de la barre d'énergie — 2026-09-24 (Norman : « la trajectoire entre 400 et 1000 est la même que entre 0 et 1000 ou 999 et
       * 1000 ; elle s'allonge mais ne se rétracte pas, la baisse est instantanée ; comme une balle qui rebondit »).
       * À chaque tick la barre part du remplissage (valeur), monte jusqu'au cap PUIS redescend jusqu'au nouveau remplissage
       * (valeur + gain du tick), les deux à VITESSE CONSTANTE : distance = temps, donc plus la barre est remplie, plus le rebond est
       * court (comme une balle dont les rebonds raccourcissent). La vitesse est celle qui fait tenir l'aller-retour depuis 0 dans
       * exactement un tick ; le reste du tick, la barre attend au nouveau remplissage. Au changement de tick elle est déjà au bon
       * endroit : aucune bascule instantanée.
       */
      function largeurTickEnergieIdleV1_(valeur,gain,progression,max){
        const cible=Math.min(max,valeur+Math.max(0,gain));
        const parcouru=2*max*progression;
        const montee=Math.min(max,valeur+parcouru);
        const descente=Math.max(0,parcouru-(max-valeur));
        return descente>0?Math.max(cible,montee-descente):montee;
      }

      function mettreAJourBarreProgressionContinueV1_(
        element,
        valeurActuelle,
        progressionTick,
        valeurMax,
        gainTick
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

        if(valeur>=max){
          largeurBarreCombatIdleV121_(element,100);
          return;
        }

        const progression=
          Math.max(
            0,
            Math.min(
              1,
              idleNombre_(progressionTick)
            )
          );

        const valeurVisuelle=
          largeurTickEnergieIdleV1_(
            valeur,
            idleNombre_(gainTick),
            progression,
            max
          );

        largeurBarreCombatIdleV121_(
          element,
          valeurVisuelle/max*100
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
        function frameJeuV214_(){
          mettreAJourJeuIdleLocalV7_();
          if(PAGE_ACTIVE==='idle'){
            idleAnimationFrameJeuV214=requestAnimationFrame(frameJeuV214_);
          }else{
            idleAnimationFrameJeuV214=0;
          }
        }
        frameJeuV214_();

        if(
          window.__sorealIdleSyncTimerV7
        ){
          clearInterval(
            window.__sorealIdleSyncTimerV7
          );
        }

        window.__sorealIdleSyncTimerV7=
          setInterval(
            synchroniserJeuIdleV7_,
            Math.max(
              5,
              idleNombre_(
                idleEtat&&
                idleEtat.syncSecondes
              )||15
            )*
            1000
          );
      }

      let idleAchatEnCoursV5=false;
      let idleAchatsEnAttenteV7={
        force:0,
        endurance:0,
        organisation:0
      };

      let idleAchatsEnvoyesV23={
        force:0,
        endurance:0,
        organisation:0
      };

      let idleReserveAventureV23=0;

      let idleFlushAchatsTimerV7=null;

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


      function coutIdleV5_(j,type){
        const couts=
          j&&j.coutsEntrainement
            ?j.coutsEntrainement
            :{};

        const direct=
          idleNombre_(couts[type]);

        if(direct>0)return direct;

        const niveau=
          type==='force'
            ?idleNombre_(j&&j.force)
            :type==='endurance'
              ?idleNombre_(j&&j.endurance)
              :idleNombre_(j&&j.organisation);

        return coutBaseEntrainementIdleV73_(
          j
        )*
        Math.max(
          1,
          Math.floor(
            niveau||1
          )
        );
      }

      function coutNiveauxIdleV7_(
        niveau,
        quantite
      ){
        let total=0;
        let niv=
          Math.max(
            1,
            Math.floor(
              idleNombre_(niveau)
            )
          );

        for(
          let i=0;
          i<quantite;
          i+=1
        ){
          total+=
            coutBaseEntrainementIdleV73_(
              idleEtat
            )*
            niv;
          niv+=1;
        }

        return total;
      }

      function coutAchatsIdleV23_(
        j,
        type,
        source
      ){
        const q=
          idleEntier_(
            source&&source[type]
          );

        const niveauInitial=
          type==='force'
            ?idleEntier_(j.force)
            :type==='endurance'
              ?idleEntier_(j.endurance)
              :idleEntier_(j.organisation);

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-82 */
        const envoyesAvant=
          idleEntier_(
            idleAchatsEnvoyesV23[type]
          );

        const depart=
          source===idleAchatsEnAttenteV7
            ?niveauInitial+envoyesAvant
            :niveauInitial;

        return coutNiveauxIdleV7_(
          depart,
          q
        );
      }


      function coutPendingIdleV7_(
        j,
        type
      ){
        return coutAchatsIdleV23_(
          j,
          type,
          idleAchatsEnAttenteV7
        );
      }


      function coutEnvoyesIdleV23_(
        j,
        type
      ){
        return coutAchatsIdleV23_(
          j,
          type,
          idleAchatsEnvoyesV23
        );
      }


      function peutAcheterIdleV5_(j,type){
        if(!j)return false;

        const energieReservee=
          energieReserveeIdleV23_();

        const niveauBase=
          type==='force'
            ?idleEntier_(j.force)+
              idleEntier_(idleAchatsEnvoyesV23.force)+
              idleEntier_(idleAchatsEnAttenteV7.force)
            :type==='endurance'
              ?idleEntier_(j.endurance)+
                idleEntier_(idleAchatsEnvoyesV23.endurance)+
                idleEntier_(idleAchatsEnAttenteV7.endurance)
              :idleEntier_(j.organisation)+
                idleEntier_(idleAchatsEnvoyesV23.organisation)+
                idleEntier_(idleAchatsEnAttenteV7.organisation);

        const prochainCout=
          coutBaseEntrainementIdleV73_(
            j
          )*
          Math.max(
            1,
            niveauBase
          );

        return (
          idleNombre_(j.energie) -
          energieReservee
        ) >= prochainCout;
      }




      function libererFocusIdleV24_(){
        const actif=
          document.activeElement;

        if(
          actif &&
          typeof actif.blur==='function'
        ){
          actif.blur();
        }
      }


      function conserverPositionIdleV24_(
        callback
      ){
        const x=
          window.scrollX||0;

        const y=
          window.scrollY||0;

        callback();

        requestAnimationFrame(function(){
          window.scrollTo(
            x,
            y
          );
        });
      }


      function toastIdleV5_(message){
        const el=
          document.getElementById(
            'sorealIdleToastV5'
          );

        if(!el)return;

        el.textContent=
          String(message||'');

        el.classList.add(
          'visible'
        );

        setTimeout(function(){
          if(el){
            el.classList.remove(
              'visible'
            );
          }
        },1800);
      }

      function energieReserveeIdleV23_(){
        if(!idleEtat){
          return 0;
        }

        return (
          coutEnvoyesIdleV23_(
            idleEtat,
            'force'
          ) +
          coutEnvoyesIdleV23_(
            idleEtat,
            'endurance'
          ) +
          coutEnvoyesIdleV23_(
            idleEtat,
            'organisation'
          ) +
          coutPendingIdleV7_(
            idleEtat,
            'force'
          ) +
          coutPendingIdleV7_(
            idleEtat,
            'endurance'
          ) +
          coutPendingIdleV7_(
            idleEtat,
            'organisation'
          ) +
          Math.max(
            0,
            idleNombre_(
              idleReserveAventureV23
            )
          )
        );
      }


      function energieReserveeIdleV9_(){
        return energieReserveeIdleV23_();
      }


      function energieDisponibleIdleV9_(){
        if(!idleEtat){
          return 0;
        }

        return Math.max(
          0,
          idleNombre_(
            idleEtat.energie
          ) -
          energieReserveeIdleV23_()
        );
      }


      /*
       * 2026-09-24 (Norman : « au-dessus de la barre d'énergie, un compteur avec les mêmes chiffres que la barre verte, mais avec le total
       * RÉELLEMENT GÉNÉRÉ et non le total actuel : ça permet de savoir combien il nous reste à partager ; avoir les deux informations est
       * utile ») : barre verte = énergie disponible ; compteur = disponible + déjà placée (Basic Training et tous les autres systèmes).
       */
      function energieGenereeTotaleIdleV1_(){
        if(!idleEtat)return 0;
        return energieDisponibleIdleV9_()+
          totalAllocationBasicTrainingIdleV120_()+
          allocationMetaEnergieIdleV1_();
      }

      function texteEnergieGenereeIdleV1_(){
        return '🔋 Généré : '+
          formatEnergieIdleV50_(energieGenereeTotaleIdleV1_())+
          ' / '+
          idleEntier_(idleEtat&&idleEtat.energieMax);
      }

      function rafraichirEnergieEtBoutonsIdleV9_(){
        if(!idleEtat){
          return;
        }

        const energieDisponible =
          energieDisponibleIdleV9_();

        const energieEl =
          document.getElementById(
            'sorealIdleEnergieValeurV4'
          );

        if(energieEl){
          energieEl.textContent=texteEnergieGenereeIdleV1_();
        }

        const energieOverlayEl2=
          document.getElementById(
            'sorealIdleEnergyOverlayV1'
          );

        if(energieOverlayEl2){
          energieOverlayEl2.textContent=
            formatEnergieIdleV50_(
              energieDisponible
            )+
            ' / '+
            idleEntier_(
              idleEtat.energieMax
            );
        }

        const summaryEnergieEl=
          document.getElementById(
            'sorealIdleSummaryEnergieV50'
          );

        if(summaryEnergieEl){
          summaryEnergieEl.textContent=
            formatEnergieIdleV50_(
              energieDisponible
            )+
            ' / '+
            idleEntier_(
              idleEtat.energieMax
            );
        }

        /* V13 : la barre représente uniquement le temps avant le prochain tic. */

        const types = [
          'force',
          'endurance',
          'organisation'
        ];

        document
          .querySelectorAll(
            '.soreal-idle-training-button-v5'
          )
          .forEach(function(btn){
            const type =
              btn.getAttribute(
                'data-idle-training'
              );

            if(
              types.indexOf(type) === -1
            ){
              return;
            }

            const niveauBase =
              type === 'force'
                ? idleEntier_(idleEtat.force) +
                  idleEntier_(
                    idleAchatsEnvoyesV23.force
                  ) +
                  idleEntier_(
                    idleAchatsEnAttenteV7.force
                  )
                : type === 'endurance'
                  ? idleEntier_(idleEtat.endurance) +
                    idleEntier_(
                      idleAchatsEnvoyesV23.endurance
                    ) +
                    idleEntier_(
                      idleAchatsEnAttenteV7.endurance
                    )
                  : idleEntier_(idleEtat.organisation) +
                    idleEntier_(
                      idleAchatsEnvoyesV23.organisation
                    ) +
                    idleEntier_(
                      idleAchatsEnAttenteV7.organisation
                    );

            const prochainCout =
              coutBaseEntrainementIdleV73_(
                idleEtat
              ) *
              Math.max(
                1,
                niveauBase
              );

            btn.textContent =
              idleEntier_(
                prochainCout
              ) +
              ' ⚡';

            btn.disabled =
              energieDisponible <
              prochainCout;
          });

        document
          .querySelectorAll(
            '.soreal-idle-zone-button-v16'
          )
          .forEach(function(btn){
            const zoneId=
              idleEntier_(
                btn.getAttribute(
                  'data-aventure-zone'
                )
              );

            const zones=
              idleEtat &&
              idleEtat.aventure &&
              Array.isArray(
                idleEtat.aventure.zones
              )
                ?idleEtat.aventure.zones
                :[];

            const zone=
              zones.find(function(z){
                return idleEntier_(z.id)===zoneId;
              });

            if(!zone){
              return;
            }

            btn.disabled=
              idleAventureEnCoursV17 ||
              !zone.debloquee;
          });
      }

      function appliquerEtatEntrainementCibleIdleV115_(
        source
      ){
        if(
          !idleEtat ||
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
            idleEtat[cle]=
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
            idleEtat[cle]=
              Object.assign(
                {},
                idleEtat[cle]||{},
                joueur[cle]
              );
          }
        });

        if(
          joueur.energieTick &&
          typeof joueur.energieTick==='object'
        ){
          idleEtat.energieTick=
            Object.assign(
              {},
              idleEtat.energieTick||{},
              joueur.energieTick
            );

          idleResteTickEnergieMsV114=
            Math.max(
              0,
              idleNombre_(
                joueur.energieTick.resteMs
              )
            );
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-84 */
        idleDernierTickLocalV40=
          Date.now();

        rafraichirEnergieEtBoutonsIdleV9_();
        planifierRenduOptimisteIdleV60_();

        return true;
      }


      function rendrePendingIdleV7_(){
        ['force','endurance','organisation']
          .forEach(function(type){
            const el=
              document.getElementById(
                'sorealIdlePendingV7_'+type
              );

            if(!el)return;

            const q=
              idleEntier_(
                idleAchatsEnAttenteV7[type]
              )+
              idleEntier_(
                idleAchatsEnvoyesV23[type]
              );

            el.textContent=
              q>0
                ?' +'+q+' réservé'
                :'';
          });

        rafraichirEnergieEtBoutonsIdleV9_();
      }

      function viderFileAchatsIdleV7_(){
        if(
          idleAchatEnCoursV5
        ){
          return;
        }

        if(
          idleFastNetworkBusyV60
        ){
          setTimeout(
            viderFileAchatsIdleV7_,
            100
          );
          return;
        }

        const achats={
          force:
            idleEntier_(
              idleAchatsEnAttenteV7.force
            ),
          endurance:
            idleEntier_(
              idleAchatsEnAttenteV7.endurance
            ),
          organisation:
            idleEntier_(
              idleAchatsEnAttenteV7.organisation
            )
        };

        const total=
          achats.force+
          achats.endurance+
          achats.organisation;

        if(total<=0){
          return;
        }

        idleAchatEnCoursV5=true;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-85 */
        idleAchatsEnvoyesV23={
          force:
            idleEntier_(achats.force),
          endurance:
            idleEntier_(achats.endurance),
          organisation:
            idleEntier_(achats.organisation)
        };

        idleAchatsEnAttenteV7={
          force:0,
          endurance:0,
          organisation:0
        };

        rendrePendingIdleV7_();

        google.script.run
          .withSuccessHandler(function(res){
            idleAchatEnCoursV5=false;

            idleAchatsEnvoyesV23={
              force:0,
              endurance:0,
              organisation:0
            };

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-86 */
            if(
              res &&
              res.joueur
            ){
              appliquerEtatEntrainementCibleIdleV115_(
                res
              );
            }else{
              rafraichirEnergieEtBoutonsIdleV9_();
            }

            if(
              !res ||
              !res.ok
            ){
              toastIdleV5_(
                res &&
                res.message
                  ?res.message
                  :'Achat impossible.'
              );
            }

            if(
              idleAchatsEnAttenteV7.force+
              idleAchatsEnAttenteV7.endurance+
              idleAchatsEnAttenteV7.organisation >
              0
            ){
              viderFileAchatsIdleV7_();
            }

            if(
              idleFastPendingV60_()
            ){
              planifierEnvoiRapideIdleV60_(35);
            }
          })
          .withFailureHandler(function(e){
            idleAchatEnCoursV5=false;

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-87 */
            idleAchatsEnAttenteV7.force+=
              idleAchatsEnvoyesV23.force;

            idleAchatsEnAttenteV7.endurance+=
              idleAchatsEnvoyesV23.endurance;

            idleAchatsEnAttenteV7.organisation+=
              idleAchatsEnvoyesV23.organisation;

            idleAchatsEnvoyesV23={
              force:0,
              endurance:0,
              organisation:0
            };

            rendrePendingIdleV7_();

            toastIdleV5_(
              e&&e.message
                ?e.message
                :'Erreur serveur.'
            );
          })
          .acheterEntrainementsSorealIdle(
            SOREAL_SESSION,
            achats
          );
      }


      function programmerEnvoiAchatsIdleV7_(){
        if(idleFlushAchatsTimerV7){
          clearTimeout(
            idleFlushAchatsTimerV7
          );
        }

        idleFlushAchatsTimerV7=
          setTimeout(
            viderFileAchatsIdleV7_,
            300
          );
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-88 */
      let idleFastNetworkBusyV60=false;
      let idleFastSendTimerV60=null;
      let idleFastRetryTimerV60=null;
      let idleFastRenderRafV60=null;
      let idleSyncEnCoursV60=false;
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-89 */
      let idleSyncForcePendingV167=false;
      let idleShopReconcileDemandeeV111=false;
      let idleShopReconcileEnCoursV111=false;

      function snapshotCombatFightBossIdleV173_(){
        if(!idleEtat)return null;
        return {
          pvJoueur:Math.max(0,idleNombre_(idleEtat.pvJoueur)),
          bossPv:Math.max(0,idleNombre_(idleEtat.bossPv)),
          bossSelection:idleEntier_(idleEtat.bossSelection)
        };
      }

      function normaliserCommandeCombatIdleV170_(payload){
        if(payload&&typeof payload==='object'){
          const snapshot=
            payload.snapshot&&typeof payload.snapshot==='object'
              ?payload.snapshot
              :null;
          return {
            actif:Boolean(payload.actif),
            raison:String(payload.raison||''),
            snapshot:snapshot
              ?{
                  pvJoueur:Math.max(0,idleNombre_(snapshot.pvJoueur)),
                  bossPv:Math.max(0,idleNombre_(snapshot.bossPv)),
                  bossSelection:idleEntier_(snapshot.bossSelection)
                }
              :null
          };
        }
        return {
          actif:Boolean(payload),
          raison:'',
          snapshot:null
        };
      }

      const idleFastPendingV60={
        equip:[],
        fusion:[],
        shop:{
          production:0,
          capacite:0,
          puissance:0
        },
        forge:{
          tete:0,
          torse:0,
          bottes:0,
          arme:0,
          bijou1:0,
          bijou2:0
        },
        bag:0,
        combat:null,
        autoBoss:null,
        autoAdventure:null,
        boss:null,
        zone:null
      };


      function idleFastCountObjectV60_(
        objet
      ){
        return Object.keys(
          objet||{}
        ).reduce(
          function(total,cle){
            return total+
              Math.max(
                0,
                idleEntier_(
                  objet[cle]
                )
              );
          },
          0
        );
      }


      function idleFastPendingV60_(){
        return Boolean(
          idleFastPendingV60.equip.length ||
          idleFastPendingV60.fusion.length ||
          idleFastCountObjectV60_(
            idleFastPendingV60.shop
          ) ||
          idleFastCountObjectV60_(
            idleFastPendingV60.forge
          ) ||
          idleFastPendingV60.bag>0 ||
          idleFastPendingV60.combat!==null ||
          idleFastPendingV60.autoBoss!==null ||
          idleFastPendingV60.autoAdventure!==null ||
          idleFastPendingV60.boss!==null ||
          idleFastPendingV60.zone!==null
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


      function planifierRenduOptimisteIdleV60_(){
        if(
          idleFastRenderRafV60 ||
          !idleEtat
        ){
          return;
        }

        idleFastRenderRafV60=
          requestAnimationFrame(
            function(){
              idleFastRenderRafV60=null;

              conserverPositionIdleV24_(
                function(){
                  rendreIdleEtat_({
                    ok:true,
                    joueur:idleEtat
                  });
                }
              );
            }
          );
      }


      function planifierEnvoiRapideIdleV60_(
        delai
      ){
        if(idleFastSendTimerV60){
          return;
        }

        idleFastSendTimerV60=
          setTimeout(
            function(){
              idleFastSendTimerV60=null;
              envoyerProchaineActionRapideIdleV60_();
            },
            Math.max(
              35,
              idleEntier_(
                delai===undefined
                  ?70
                  :delai
              )
            )
          );
      }


      function remettreLotRapideIdleV60_(
        lot
      ){
        if(!lot)return;

        switch(lot.type){
          case 'equip':
            idleFastPendingV60.equip=
              lot.payload.concat(
                idleFastPendingV60.equip
              );
            break;

          case 'fusion':
            idleFastPendingV60.fusion=
              lot.payload.concat(
                idleFastPendingV60.fusion
              );
            break;

          case 'shop':
            Object.keys(lot.payload)
              .forEach(function(type){
                idleFastPendingV60.shop[type]+=
                  idleEntier_(
                    lot.payload[type]
                  );
              });
            break;

          case 'forge':
            Object.keys(lot.payload)
              .forEach(function(slot){
                idleFastPendingV60.forge[slot]+=
                  idleEntier_(
                    lot.payload[slot]
                  );
              });
            break;

          case 'bag':
            idleFastPendingV60.bag+=
              idleEntier_(
                lot.payload
              );
            break;

          case 'combat':
            idleFastPendingV60.combat=
              normaliserCommandeCombatIdleV170_(
                lot.payload
              );
            break;

          case 'autoBoss':
            idleFastPendingV60.autoBoss=
              Boolean(
                lot.payload
              );
            break;

          case 'autoAdventure':
            idleFastPendingV60.autoAdventure=
              {
                actif:
                  Boolean(
                    lot.payload&&
                    lot.payload.actif
                  ),
                zoneId:
                  idleEntier_(
                    lot.payload&&
                    lot.payload.zoneId
                  )
              };
            break;

          case 'boss':
            idleFastPendingV60.boss=
              idleEntier_(
                lot.payload
              );
            break;

          case 'zone':
            idleFastPendingV60.zone=
              idleEntier_(
                lot.payload
              );
            break;
        }
      }


      function extraireLotRapideIdleV60_(){
        if(
          idleFastPendingV60.equip.length
        ){
          const lot=
            idleFastPendingV60.equip.splice(
              0,
              idleFastPendingV60.equip.length
            );

          return {
            type:'equip',
            payload:lot
          };
        }

        if(
          idleFastPendingV60.fusion.length
        ){
          const lot=
            idleFastPendingV60.fusion.splice(
              0,
              idleFastPendingV60.fusion.length
            );

          return {
            type:'fusion',
            payload:lot
          };
        }

        if(
          idleFastCountObjectV60_(
            idleFastPendingV60.shop
          )
        ){
          const lot=
            Object.assign(
              {},
              idleFastPendingV60.shop
            );

          idleFastPendingV60.shop={
            production:0,
            capacite:0,
            puissance:0
          };

          return {
            type:'shop',
            payload:lot
          };
        }

        if(
          idleFastCountObjectV60_(
            idleFastPendingV60.forge
          )
        ){
          const lot=
            Object.assign(
              {},
              idleFastPendingV60.forge
            );

          idleFastPendingV60.forge={
            tete:0,
            torse:0,
            bottes:0,
            arme:0,
            bijou1:0,
            bijou2:0
          };

          return {
            type:'forge',
            payload:lot
          };
        }

        if(
          idleFastPendingV60.bag>0
        ){
          const q=
            idleFastPendingV60.bag;

          idleFastPendingV60.bag=0;

          return {
            type:'bag',
            payload:q
          };
        }

        if(
          idleFastPendingV60.combat!==null
        ){
          const valeur=
            idleFastPendingV60.combat;

          idleFastPendingV60.combat=null;

          return {
            type:'combat',
            payload:valeur
          };
        }

        if(
          idleFastPendingV60.autoBoss!==null
        ){
          const valeur=
            idleFastPendingV60.autoBoss;

          idleFastPendingV60.autoBoss=null;

          return {
            type:'autoBoss',
            payload:valeur
          };
        }

        if(
          idleFastPendingV60.autoAdventure!==null
        ){
          const valeur=
            idleFastPendingV60.autoAdventure;

          idleFastPendingV60.autoAdventure=null;

          return {
            type:'autoAdventure',
            payload:valeur
          };
        }

        if(
          idleFastPendingV60.boss!==null
        ){
          const valeur=
            idleFastPendingV60.boss;

          idleFastPendingV60.boss=null;

          return {
            type:'boss',
            payload:valeur
          };
        }

        if(
          idleFastPendingV60.zone!==null
        ){
          const valeur=
            idleFastPendingV60.zone;

          idleFastPendingV60.zone=null;

          return {
            type:'zone',
            payload:valeur
          };
        }

        return null;
      }


      function idleShopPendingV111_(){
        return idleFastCountObjectV60_(
          idleFastPendingV60.shop
        );
      }


      function appliquerEtatBoutiqueCibleIdleV111_(
        source
      ){
        if(!idleEtat||!source)return;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-90 */
        const autoritaire=
          source.joueur &&
          typeof source.joueur==='object'
            ?source.joueur
            :source;

        [
          'energie',
          'energieMax',
          'productionSeconde',
          'puissance'
        ].forEach(function(cle){
          if(
            autoritaire &&
            autoritaire[cle]!==undefined
          ){
            idleEtat[cle]=
              idleNombre_(
                autoritaire[cle]
              );
          }
        });

        if(source.pieces!==undefined){
          idleEtat.pieces=
            Math.max(
              0,
              idleEntier_(source.pieces)
            );
        }

        if(source.ameliorations){
          idleEtat.ameliorations=
            Object.assign(
              {},
              idleEtat.ameliorations||{},
              source.ameliorations
            );
        }

        if(source.coutsBoutique){
          idleEtat.coutsBoutique=
            Object.assign(
              {},
              idleEtat.coutsBoutique||{},
              source.coutsBoutique
            );
        }

        if(!idleEtat.bonusBoutique){
          idleEtat.bonusBoutique={};
        }

        const meta=
          idleEtat.boutiqueMeta||{};

        ['production','capacite','puissance']
          .forEach(function(type){
            if(
              meta[type] &&
              idleEtat.ameliorations
            ){
              idleEtat.bonusBoutique[type]=
                idleEntier_(
                  idleEtat.ameliorations[type]
                )*
                idleNombre_(
                  meta[type].bonusParNiveau
                );
            }
          });

        planifierRenduOptimisteIdleV60_();
      }


      function demanderReconciliationBoutiqueIdleV111_(){
        idleShopReconcileDemandeeV111=true;

        if(
          idleShopReconcileEnCoursV111 ||
          idleShopPendingV111_()>0 ||
          idleFastNetworkBusyV60 ||
          !SOREAL_SESSION
        ){
          return;
        }

        idleShopReconcileDemandeeV111=false;
        idleShopReconcileEnCoursV111=true;

        google.script.run
          .withSuccessHandler(function(res){
            idleShopReconcileEnCoursV111=false;

            if(
              res&&res.ok&&
              idleShopPendingV111_()===0
            ){
              appliquerEtatBoutiqueCibleIdleV111_(
                res
              );
            }

            if(idleShopReconcileDemandeeV111){
              setTimeout(
                demanderReconciliationBoutiqueIdleV111_,
                60
              );
            }
          })
          .withFailureHandler(function(){
            idleShopReconcileEnCoursV111=false;
          })
          .obtenirEtatBoutiqueSorealIdle(
            SOREAL_SESSION
          );
      }


      function terminerLotRapideIdleV60_(
        lot,
        res
      ){
        idleFastNetworkBusyV60=false;

        if(
          !res ||
          !res.ok
        ){
          if(
            idleServeurOccupeV60_(
              res
            )
          ){
            remettreLotRapideIdleV60_(
              lot
            );

            if(idleFastRetryTimerV60){
              clearTimeout(
                idleFastRetryTimerV60
              );
            }

            idleFastRetryTimerV60=
              setTimeout(
                function(){
                  idleFastRetryTimerV60=null;
                  envoyerProchaineActionRapideIdleV60_();
                },
                220
              );

            return;
          }

          messageFlottantIdleV32_(
            '❌ '+
            (
              res&&res.message
                ?res.message
                :'Une action n’a pas pu être enregistrée.'
            )
          );

          if(lot&&lot.type==='shop'){
            demanderReconciliationBoutiqueIdleV111_();
          }
        }else if(
          lot&&
          lot.type==='shop'
        ){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-91 */
          if(idleShopPendingV111_()===0){
            appliquerEtatBoutiqueCibleIdleV111_(
              res
            );
          }
        }

        if(
          idleFastPendingV60_()
        ){
          planifierEnvoiRapideIdleV60_(35);
        }else if(
          lot&&
          lot.type==='shop'
        ){
          if(idleShopReconcileDemandeeV111){
            demanderReconciliationBoutiqueIdleV111_();
          }
          /* Pas de synchronisation complète : elle pouvait annuler l'achat. */
        }else{
          setTimeout(
            function(){
              synchroniserJeuIdleV7_(true);
            },
            80
          );
        }
      }


      function echecLotRapideIdleV60_(
        lot,
        erreur
      ){
        idleFastNetworkBusyV60=false;

        if(
          idleServeurOccupeV60_(
            erreur
          )
        ){
          remettreLotRapideIdleV60_(
            lot
          );

          planifierEnvoiRapideIdleV60_(
            240
          );

          return;
        }

        messageFlottantIdleV32_(
          '❌ '+
          (
            erreur&&erreur.message
              ?erreur.message
              :'Erreur serveur.'
          )
        );

        if(lot&&lot.type==='shop'){
          demanderReconciliationBoutiqueIdleV111_();
        }

        if(
          idleFastPendingV60_()
        ){
          planifierEnvoiRapideIdleV60_(80);
        }else if(
          lot&&
          lot.type==='shop'
        ){
          /* Réconciliation ciblée uniquement. */
        }else{
          setTimeout(
            function(){
              synchroniserJeuIdleV7_(true);
            },
            100
          );
        }
      }


      function envoyerProchaineActionRapideIdleV60_(){
        if(
          idleFastNetworkBusyV60 ||
          !SOREAL_SESSION ||
          !idleFastPendingV60_()
        ){
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-92 */
        if(
          idleAchatEnCoursV5 ||
          idleRecycleBatchV32 ||
          idleAventureEnCoursV17 ||
          idleSortPurchaseBusyV101
        ){
          planifierEnvoiRapideIdleV60_(
            120
          );
          return;
        }

        const lot=
          extraireLotRapideIdleV60_();

        if(!lot){
          return;
        }

        idleFastNetworkBusyV60=true;

        const runner=
          google.script.run
            .withSuccessHandler(
              function(res){
                terminerLotRapideIdleV60_(
                  lot,
                  res
                );
              }
            )
            .withFailureHandler(
              function(e){
                echecLotRapideIdleV60_(
                  lot,
                  e
                );
              }
            );

        switch(lot.type){
          case 'equip':
            runner.equiperObjetsSorealIdle(
              SOREAL_SESSION,
              lot.payload
            );
            break;

          case 'fusion':
            runner.fusionnerObjetsSorealIdle(
              SOREAL_SESSION,
              lot.payload
            );
            break;

          case 'shop':
            runner.acheterAmeliorationsSorealIdle(
              SOREAL_SESSION,
              lot.payload
            );
            break;

          case 'forge':
            runner.ameliorerEquipementsForgeSorealIdle(
              SOREAL_SESSION,
              lot.payload
            );
            break;

          case 'bag':
            runner.agrandirInventairePlusieursSorealIdle(
              SOREAL_SESSION,
              lot.payload
            );
            break;

          case 'combat':{
            const commandeCombat=
              normaliserCommandeCombatIdleV170_(
                lot.payload
              );
            runner.definirCombatBossSorealIdle(
              SOREAL_SESSION,
              commandeCombat.actif,
              commandeCombat.raison,
              commandeCombat.snapshot
            );
            break;
          }

          case 'autoBoss':
            runner.definirAutoBossSuivantSorealIdle(
              SOREAL_SESSION,
              Boolean(
                lot.payload
              )
            );
            break;

          case 'autoAdventure':
            runner.definirCombatAutoAventureSorealIdle(
              SOREAL_SESSION,
              Boolean(
                lot.payload&&
                lot.payload.actif
              ),
              idleEntier_(
                lot.payload&&
                lot.payload.zoneId
              )
            );
            break;

          case 'boss':
            runner.selectionnerBossSorealIdle(
              SOREAL_SESSION,
              idleEntier_(
                lot.payload
              )
            );
            break;

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-93 */
          default:
            idleFastNetworkBusyV60=false;
            planifierEnvoiRapideIdleV60_(35);
        }
      }


      function ajouterActionRapideIdleV60_(
        type,
        payload
      ){
        switch(type){
          case 'equip':
            idleFastPendingV60.equip.push(
              String(payload)
            );
            break;

          case 'fusion':
            idleFastPendingV60.fusion.push(
              String(payload)
            );
            break;

          case 'shop':
            idleFastPendingV60.shop[
              payload
            ]+=1;
            break;

          case 'forge':
            idleFastPendingV60.forge[
              payload
            ]+=1;
            break;

          case 'bag':
            idleFastPendingV60.bag+=1;
            break;

          case 'combat':
            idleFastPendingV60.combat=
              normaliserCommandeCombatIdleV170_(
                payload
              );
            break;

          case 'autoBoss':
            idleFastPendingV60.autoBoss=
              Boolean(
                payload
              );
            break;

          case 'autoAdventure':
            idleFastPendingV60.autoAdventure=
              {
                actif:
                  Boolean(
                    payload&&
                    payload.actif
                  ),
                zoneId:
                  idleEntier_(
                    payload&&
                    payload.zoneId
                  )
              };
            break;

          case 'boss':
            idleFastPendingV60.boss=
              idleEntier_(
                payload
              );
            break;

          case 'zone':
            idleFastPendingV60.zone=
              idleEntier_(
                payload
              );
            break;
        }

        planifierEnvoiRapideIdleV60_(70);
      }


      function acheterEntrainementIdleV5_(type){
        libererFocusIdleV24_();
        if(
          !idleEtat ||
          ['force','endurance','organisation']
            .indexOf(type)===-1
        ){
          return;
        }

        const niveauBase =
          type === 'force'
            ? idleEntier_(idleEtat.force) +
              idleEntier_(idleAchatsEnvoyesV23.force) +
              idleEntier_(
                idleAchatsEnAttenteV7.force
              )
            : type === 'endurance'
              ? idleEntier_(idleEtat.endurance) +
                idleEntier_(idleAchatsEnvoyesV23.endurance) +
                idleEntier_(
                  idleAchatsEnAttenteV7.endurance
                )
              : idleEntier_(idleEtat.organisation) +
                idleEntier_(idleAchatsEnvoyesV23.organisation) +
                idleEntier_(
                  idleAchatsEnAttenteV7.organisation
                );

        const prochainCout =
          coutBaseEntrainementIdleV73_(
            idleEtat
          ) *
          Math.max(
            1,
            niveauBase
          );

        if(
          energieDisponibleIdleV9_() <
          prochainCout
        ){
          rafraichirEnergieEtBoutonsIdleV9_();

          toastIdleV5_(
            'Pas assez d’énergie.'
          );
          return;
        }

        idleAchatsEnAttenteV7[type] += 1;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-94 */
        rendrePendingIdleV7_();
        programmerEnvoiAchatsIdleV7_();

        const bouton=
          document.querySelector(
            '[data-idle-training="'+type+'"]'
          );

        if(bouton){
          bouton.animate(
            [
              {transform:'scale(1)'},
              {transform:'scale(.94)'},
              {transform:'scale(1)'}
            ],
            {
              duration:150
            }
          );
        }
      }

      let idleEquipementEnCoursV10=false;

      function objetEquipeIdleV10_(
        j,
        objet
      ){
        if(
          !j ||
          !j.equipement ||
          !objet
        ){
          return false;
        }

        const equipe =
          j.equipement[
            objet.slot
          ];

        return Boolean(
          equipe &&
          String(equipe.id) ===
          String(objet.id)
        );
      }

      function nomSlotIdleV10_(slot){const a=window.__SOREAL_IDLE_INVENTORY_PRESENTATION_V1__;return a&&a.nomSlot?a.nomSlot(slot):slot;}

      function iconeSlotIdleV10_(slot){const a=window.__SOREAL_IDLE_INVENTORY_PRESENTATION_V1__;return a&&a.iconeSlot?a.iconeSlot(slot):'📦';}


      function dateIdleV25_(iso){
        const d=new Date(iso||'');
        return Number.isNaN(d.getTime())
          ?'—'
          :d.toLocaleDateString('fr-BE',{
              day:'2-digit',
              month:'2-digit',
              year:'numeric'
            });
      }

      function dureeProfilIdleV25_(p){
        const jours=Math.floor(idleNombre_(p&&p.ageJours));
        const heures=Math.floor(idleNombre_(p&&p.ageHeures));
        const mois=Math.floor(idleNombre_(p&&p.ageMois));
        if(mois>=1)return mois+' mois · '+jours+' jours';
        if(jours>=1)return jours+' jours · '+heures+' h';
        return heures+' h';
      }

      function rendreProfilIdleV26_(j){
        const joueur=
          j && typeof j==='object'
            ?j
            :{};

        const profil=
          joueur.profil &&
          typeof joueur.profil==='object'
            ?joueur.profil
            :{};

        const stats=
          profil.stats &&
          typeof profil.stats==='object'
            ?profil.stats
            :{};

        const prochain=
          joueur.prochainPalier &&
          typeof joueur.prochainPalier==='object'
            ?joueur.prochainPalier
            :null;

        return `
          <div class="soreal-idle-window-title-v31 dark">
            👤 ${idleHtml_(joueur.nom||'Joueur')}
            · ${idleHtml_(joueur.titre||'Recrue du dépôt')}
          </div>

          <div class="soreal-idle-character-grid-v25">
            <div class="soreal-idle-character-stat-v25">
              NUMBER
              <b>${formatGrandNombreIdleV70_(joueur.systemes&&joueur.systemes.rebirth&&joueur.systemes.rebirth.number||1)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Puissance
              <b>${idleEntier_(joueur.puissance)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Force
              <b>${idleEntier_(joueur.force)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Endurance
              <b>${idleEntier_(joueur.endurance)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Organisation
              <b>${idleEntier_(joueur.organisation)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Défense
              <b>${idleEntier_(joueur.defense)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Boss vaincus
              <b>${idleEntier_(joueur.bossVaincus)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Renaissances
              <b>${idleEntier_(joueur.renaissances)}</b>
            </div>
          </div>

          <div class="soreal-idle-profile-detail-v52">
            <div>
              📅 Début :
              <strong>${dateIdleV25_(profil.dateDebut)}</strong>
            </div>

            <div>
              ⏱️ Temps de jeu :
              <strong>${dureeProfilIdleV25_(profil)}</strong>
            </div>

            <div>
              🎁 Loots obtenus :
              <strong>${idleEntier_(stats.lootsObtenus)}</strong>
            </div>

            <div>
              ♻️ Objets recyclés :
              <strong>${idleEntier_(stats.objetsRecycles)}</strong>
            </div>

            <div>
              🔗 Fusions :
              <strong>${idleEntier_(stats.fusions)}</strong>
            </div>

            <div>
              🔥 Améliorations forge :
              <strong>${idleEntier_(stats.forge)}</strong>
            </div>

            <div>
              🗺️ Combats aventure :
              <strong>${idleEntier_(stats.combatsAventure)}</strong>
            </div>

            <div>
              🏆 Victoires aventure :
              <strong>${idleEntier_(stats.victoiresAventure)}</strong>
            </div>
          </div>

          ${
            prochain
              ?`
                <div class="soreal-idle-profile-next-v52">
                  🎯 Prochain titre :
                  <strong>${idleHtml_(prochain.nom||'—')}</strong>
                  ${
                    idleEntier_(prochain.niveau)>idleEntier_(joueur.niveau)
                      ?' au niveau '+idleEntier_(prochain.niveau)
                      :''
                  }
                </div>
              `
              :''
          }
        `;
      }


      function rendreSetsIdleV25_(j){
        const actifs=
          j &&
          j.sets &&
          Array.isArray(
            j.sets.actifs
          )
            ?j.sets.actifs
            :[];

        if(!actifs.length){
          return `
            <div class="soreal-idle-set-v25">
              🧩 Aucun bonus de set actif.
              Équipe plusieurs pièces portant le même nom de set.
            </div>
          `;
        }

        return actifs
          .map(function(s){
            return `
              <div class="soreal-idle-set-v25">
                🧩 <strong>${idleHtml_(s.nom)}</strong>
                · ${idleEntier_(s.pieces)}/${idleEntier_(s.piecesMax||6)} pièces
                · <strong>+${idleEntier_(s.bonusPourcent)} % puissance</strong>
                ${
                  s.description
                    ?'<div style="margin-top:4px;opacity:.75">'+
                      idleHtml_(s.description)+
                      '</div>'
                    :''
                }
              </div>
            `;
          })
          .join('');
      }

      let idleForgeActionV25=false;

      function forgerEquipementIdleV25_(
        slot
      ){
        if(
          !SOREAL_SESSION ||
          !idleEtat ||
          !idleEtat.equipement
        ){
          return;
        }

        const objet=
          idleEtat.equipement[
            slot
          ];

        if(!objet){
          messageFlottantIdleV32_(
            '❌ Aucun objet équipé.'
          );
          return;
        }

        const forgeEtat=
          idleEtat.forge &&
          idleEtat.forge[slot]
            ?idleEtat.forge[slot]
            :null;

        const cout=
          Math.max(
            1,
            idleEntier_(
              forgeEtat&&forgeEtat.cout
            )
          );

        if(
          idleEntier_(
            idleEtat.materiaux
          )<cout
        ){
          messageFlottantIdleV32_(
            '❌ Pas assez de matériaux.'
          );
          return;
        }

        idleEtat.materiaux=
          Math.max(
            0,
            idleEntier_(
              idleEtat.materiaux
            )-
            cout
          );

        const avant=
          idleNombre_(
            objet.bonusPuissance
          );

        objet.forge=
          idleEntier_(
            objet.forge
          )+1;

        objet.bonusPuissance=
          Math.max(
            1,
            Math.round(
              avant*1.18+1
            )
          );

        if(
          Array.isArray(
            idleEtat.inventaire
          )
        ){
          const indexInventaire=
            idleEtat.inventaire.findIndex(
              function(item){
                return String(
                  item&&item.id||''
                )===
                String(
                  objet.id||''
                );
              }
            );

          if(indexInventaire>=0){
            idleEtat.inventaire[
              indexInventaire
            ]=
              objet;
          }
        }

        const delta=
          idleNombre_(
            objet.bonusPuissance
          )-
          avant;

        idleEtat.puissance=
          Math.max(
            1,
            idleNombre_(
              idleEtat.puissance
            )+
            delta
          );

        idleEtat.bonusEquipement=
          Math.max(
            0,
            idleNombre_(
              idleEtat.bonusEquipement
            )+
            delta
          );

        if(!idleEtat.forge){
          idleEtat.forge={};
        }

        const meta=
          idleEtat.forgeMeta||{
            base:5,
            croissance:1.65
          };

        idleEtat.forge[slot]={
          niveau:
            idleEntier_(
              objet.forge
            ),
          cout:
            Math.max(
              1,
              Math.round(
                idleNombre_(
                  meta.base
                )*
                Math.pow(
                  Math.max(
                    1,
                    idleNombre_(
                      meta.croissance
                    )
                  ),
                  idleEntier_(
                    objet.forge
                  )
                )
              )
            )
        };

        planifierRenduOptimisteIdleV60_();

        ajouterActionRapideIdleV60_(
          'forge',
          slot
        );

        messageFlottantIdleV32_(
          '🔥 Forge +'+
          idleEntier_(
            objet.forge
          )
        );
      }


      function agrandirSacIdleV25_(){
        if(
          !SOREAL_SESSION ||
          !idleEtat
        ){
          return;
        }

        const cout=
          Math.max(
            1,
            idleEntier_(
              idleEtat
                .coutExtensionInventaire
            )
          );

        if(
          idleEntier_(
            idleEtat.materiaux
          )<cout
        ){
          messageFlottantIdleV32_(
            '❌ Pas assez de matériaux.'
          );
          return;
        }

        const meta=
          idleEtat.inventaireMeta||{
            base:18,
            pas:6,
            coutBase:25,
            croissance:1.85,
            max:90
          };

        if(
          idleEntier_(
            idleEtat.inventaireCapacite
          )>=
          idleEntier_(
            meta.max
          )
        ){
          messageFlottantIdleV32_(
            '❌ Capacité maximale.'
          );
          return;
        }

        idleEtat.materiaux=
          Math.max(
            0,
            idleEntier_(
              idleEtat.materiaux
            )-
            cout
          );

        idleEtat.inventaireCapacite=
          Math.min(
            idleEntier_(
              meta.max
            ),
            idleEntier_(
              idleEtat.inventaireCapacite
            )+
            idleEntier_(
              meta.pas
            )
          );

        idleEtat.inventaireLibre=
          Math.max(
            0,
            idleEntier_(
              idleEtat.inventaireCapacite
            )-
            idleEntier_(
              idleEtat.inventaireUtilise
            )
          );

        const extensions=
          Math.max(
            0,
            Math.floor(
              (
                idleEntier_(
                  idleEtat.inventaireCapacite
                )-
                idleEntier_(
                  meta.base
                )
              )/
              Math.max(
                1,
                idleEntier_(
                  meta.pas
                )
              )
            )
          );

        idleEtat.coutExtensionInventaire=
          Math.max(
            1,
            Math.round(
              idleNombre_(
                meta.coutBase
              )*
              Math.pow(
                Math.max(
                  1,
                  idleNombre_(
                    meta.croissance
                  )
                ),
                extensions
              )
            )
          );

        planifierRenduOptimisteIdleV60_();

        ajouterActionRapideIdleV60_(
          'bag',
          1
        );
      }


      window.__forgerEquipementIdleV25__=forgerEquipementIdleV25_;
      window.__agrandirSacIdleV25__=agrandirSacIdleV25_;


      function rendreSlotEquipeIdleV10_(
        titre,
        objet
      ){
        return `
          <div class="soreal-idle-equip-slot-v10 ${objet?idleHtml_(objet.rarete||'commun'):'commun'}">
            ${
              objet
                ?'<div class="soreal-idle-equipped-icon-v50">'+
                  emojiObjetIdleV50_(objet)+
                  '</div>'
                :''
            }
            <div class="soreal-idle-equip-slot-title-v10">
              ${idleHtml_(titre)}
            </div>
            <div class="soreal-idle-equip-slot-name-v10">
              ${
                objet
                  ?idleHtml_(objet.nom)+
                    (
                      idleEntier_(objet.fusion)>0
                        ?' <span class="soreal-idle-equipped-level-v31">+'+
                          idleEntier_(objet.fusion)+
                          '</span>'
                        :''
                    )
                  :'Aucun objet'
              }
            </div>
            <div class="soreal-idle-equip-slot-bonus-v10">
              ${
                objet
                  ?'+'+
                    idleEntier_(objet.bonusPuissance)+
                    ' puissance · Forge +'+
                    idleEntier_(objet.forge)+
                    (
                      objet.setNom
                        ?' · 🧩 '+idleHtml_(objet.setNom)
                        :''
                    )
                  :'—'
              }
            </div>
            ${
              objet
                ?'<button type="button" class="soreal-idle-forge-button-v25" onclick="window.__forgerEquipementIdleV25__(\''+
                  idleHtml_(objet.slot)+
                  '\')">🔥 Améliorer · '+
                  idleEntier_(
                    idleEtat&&idleEtat.forge&&idleEtat.forge[objet.slot]&&idleEtat.forge[objet.slot].cout
                  )+
                  ' matériaux</button>'
                :''
            }
          </div>
        `;
      }

      let idleSelectionModeV32=false;
      let idleSelectionObjetsV32={};
      let idleLongPressTimerV32=null;
      let idleLongPressDeclencheV32=false;
      let idleRecycleBatchV32=false;
      let idleRecycleQueueV38=[];
      let idleRecycleInflightV38=[];
      let idleRecycleTimerV38=null;


      function selectionIdsIdleV32_(){
        return Object.keys(
          idleSelectionObjetsV32
        ).filter(function(id){
          return Boolean(
            idleSelectionObjetsV32[id]
          );
        });
      }


      function debutAppuiObjetIdleV32_(
        objetId
      ){
        idleLongPressDeclencheV32=false;

        if(idleLongPressTimerV32){
          clearTimeout(
            idleLongPressTimerV32
          );
        }

        idleLongPressTimerV32=
          setTimeout(function(){
            idleLongPressTimerV32=null;
            idleLongPressDeclencheV32=true;
            idleSelectionModeV32=true;
            idleSelectionObjetsV32[
              String(objetId)
            ]=true;

            rafraichirSelectionInventaireIdleV32_();
          },520);
      }


      function finAppuiObjetIdleV32_(){
        if(idleLongPressTimerV32){
          clearTimeout(
            idleLongPressTimerV32
          );
          idleLongPressTimerV32=null;
        }
      }


      function tapObjetIdleV32_(
        event,
        objetId
      ){
        finAppuiObjetIdleV32_();

        if(idleLongPressDeclencheV32){
          idleLongPressDeclencheV32=false;

          if(event){
            event.preventDefault();
            event.stopPropagation();
          }

          return false;
        }

        if(!idleSelectionModeV32){
          return true;
        }

        if(event){
          event.preventDefault();
          event.stopPropagation();
        }

        const id=
          String(objetId);

        idleSelectionObjetsV32[id]=
          !idleSelectionObjetsV32[id];

        if(!selectionIdsIdleV32_().length){
          idleSelectionModeV32=false;
          idleSelectionObjetsV32={};
        }

        rafraichirSelectionInventaireIdleV32_();

        return false;
      }


      function annulerSelectionIdleV32_(){
        idleSelectionModeV32=false;
        idleSelectionObjetsV32={};
        rafraichirSelectionInventaireIdleV32_();
      }


      function rafraichirSelectionInventaireIdleV32_(){
        const ids=
          selectionIdsIdleV32_();

        document
          .querySelectorAll(
            '.soreal-idle-item-v10[data-objet-id]'
          )
          .forEach(function(card){
            const id=
              String(
                card.getAttribute(
                  'data-objet-id'
                ) || ''
              );

            card.classList.toggle(
              'selection-mode',
              idleSelectionModeV32
            );

            card.classList.toggle(
              'selected',
              Boolean(
                idleSelectionObjetsV32[id]
              )
            );

            let check=
              card.querySelector(
                '.soreal-idle-item-check-v32'
              );

            if(
              idleSelectionObjetsV32[id]
            ){
              if(!check){
                check=
                  document.createElement(
                    'div'
                  );
                check.className=
                  'soreal-idle-item-check-v32';
                check.textContent='✓';
                card.appendChild(check);
              }
            }else if(check){
              check.remove();
            }
          });

        const bar=
          document.getElementById(
            'sorealIdleSelectionBarV32'
          );

        const info=
          document.getElementById(
            'sorealIdleSelectionInfoV32'
          );

        if(bar){
          bar.classList.toggle(
            'inactive',
            !idleSelectionModeV32
          );
        }

        if(info){
          info.textContent=
            ids.length+
            ' objet'+
            (ids.length>1?'s':'')+
            ' sélectionné'+
            (ids.length>1?'s':'');
        }
      }


      function messageFlottantIdleV32_(
        texte
      ){
        const ancien=
          document.getElementById(
            'sorealIdleToastV32'
          );

        if(ancien){
          ancien.remove();
        }

        const el=
          document.createElement(
            'div'
          );

        el.id=
          'sorealIdleToastV32';
        el.className=
          'soreal-idle-toast-inline-v32';
        el.textContent=
          String(texte||'');

        document.body.appendChild(el);

        setTimeout(function(){
          if(el&&el.parentNode){
            el.remove();
          }
        },1800);
      }


      function recyclerSelectionIdleV32_(){
        recyclerObjetsOptimisteIdleV32_(
          selectionIdsIdleV32_()
        );
      }


      window.__debutAppuiObjetIdleV32__=
        debutAppuiObjetIdleV32_;
      window.__finAppuiObjetIdleV32__=
        finAppuiObjetIdleV32_;
      window.__tapObjetIdleV32__=
        tapObjetIdleV32_;
      window.__annulerSelectionIdleV32__=
        annulerSelectionIdleV32_;
      window.__recyclerSelectionIdleV32__=
        recyclerSelectionIdleV32_;


      function casesInventaireIdleV78_(j){
        const capacite=
          Math.max(
            1,
            idleEntier_(j&&j.inventaireCapacite)
          );

        const slots=
          new Array(capacite).fill(null);

        const inventaire=
          (
            Array.isArray(j&&j.inventaire)
              ?j.inventaire
              :[]
          )
          .filter(function(objet){
            return !objetEquipeIdleV10_(j,objet);
          });

        const aPlacer=[];

        inventaire.forEach(function(objet){
          const position=
            idleEntier_(objet&&objet.positionSac);

          if(
            position>=1 &&
            position<=capacite &&
            !slots[position-1]
          ){
            slots[position-1]=objet;
          }else{
            aPlacer.push(objet);
          }
        });

        aPlacer.forEach(function(objet){
          const index=
            slots.findIndex(function(valeur){
              return !valeur;
            });

          if(index<0)return;

          objet.positionSac=index+1;
          slots[index]=objet;
        });

        slots.forEach(function(objet,index){
          if(objet){
            objet.positionSac=index+1;
          }
        });

        return slots;
      }


      let idleInventaireDragIdV78='';
      let idleInventaireSauvegardeTimerV78=null;
      let idleInventaireSauvegardeEnCoursV78=false;
      let idleInventaireSauvegardeDemandeeV78=false;


      function dessinerGrilleInventaireIdleV78_(){
        if(!idleEtat)return;

        const host=
          document.querySelector(
            '.soreal-idle-inventory-v10'
          );

        if(host){
          host.innerHTML=
            rendreInventaireIdleV10_(idleEtat);
        }
      }


      function dispositionInventaireIdleV78_(){
        return casesInventaireIdleV78_(idleEtat)
          .map(function(objet){
            return objet
              ?String(objet.id||'')
              :null;
          });
      }


      function envoyerDispositionInventaireIdleV78_(){
        if(!SOREAL_SESSION||!idleEtat){
          return;
        }

        if(idleInventaireSauvegardeEnCoursV78){
          idleInventaireSauvegardeDemandeeV78=true;
          return;
        }

        idleInventaireSauvegardeEnCoursV78=true;
        idleInventaireSauvegardeDemandeeV78=false;

        google.script.run
          .withSuccessHandler(function(){
            idleInventaireSauvegardeEnCoursV78=false;

            if(idleInventaireSauvegardeDemandeeV78){
              setTimeout(
                envoyerDispositionInventaireIdleV78_,
                40
              );
            }
          })
          .withFailureHandler(function(){
            idleInventaireSauvegardeEnCoursV78=false;

            if(idleInventaireSauvegardeDemandeeV78){
              setTimeout(
                envoyerDispositionInventaireIdleV78_,
                120
              );
            }
          })
          .sauvegarderDispositionInventaireSorealIdle(
            SOREAL_SESSION,
            dispositionInventaireIdleV78_()
          );
      }


      function planifierSauvegardeInventaireIdleV78_(){
        if(idleInventaireSauvegardeTimerV78){
          clearTimeout(
            idleInventaireSauvegardeTimerV78
          );
        }

        idleInventaireSauvegardeTimerV78=
          setTimeout(function(){
            idleInventaireSauvegardeTimerV78=null;
            envoyerDispositionInventaireIdleV78_();
          },140);
      }


      function debutDragInventaireIdleV78_(
        event,
        objetId
      ){
        idleInventaireDragIdV78=
          String(objetId||'');

        if(event&&event.dataTransfer){
          event.dataTransfer.effectAllowed='move';

          try{
            event.dataTransfer.setData(
              'text/plain',
              idleInventaireDragIdV78
            );
          }catch(e){}
        }
      }


      function finDragInventaireIdleV78_(){
        idleInventaireDragIdV78='';

        document
          .querySelectorAll(
            '.soreal-idle-inventory-slot-v78.drag-over'
          )
          .forEach(function(el){
            el.classList.remove('drag-over');
          });
      }


      function survolCaseInventaireIdleV78_(event){
        if(event){
          event.preventDefault();

          if(event.currentTarget){
            event.currentTarget.classList.add(
              'drag-over'
            );
          }
        }
      }


      function quitterCaseInventaireIdleV78_(event){
        if(event&&event.currentTarget){
          event.currentTarget.classList.remove(
            'drag-over'
          );
        }
      }


      function deposerInventaireIdleV78_(
        event,
        positionCible
      ){
        if(event){
          event.preventDefault();
          event.stopPropagation();
        }

        const id=
          String(
            idleInventaireDragIdV78 ||
            (
              event&&event.dataTransfer
                ?event.dataTransfer.getData('text/plain')
                :''
            ) ||
            ''
          );

        const cible=
          Math.max(
            1,
            idleEntier_(positionCible)
          );

        if(!id||!idleEtat){
          finDragInventaireIdleV78_();
          return;
        }

        const cases=
          casesInventaireIdleV78_(idleEtat);

        const sourceIndex=
          cases.findIndex(function(objet){
            return (
              objet &&
              String(objet.id||'')===id
            );
          });

        const cibleIndex=cible-1;

        if(
          sourceIndex<0 ||
          cibleIndex<0 ||
          cibleIndex>=cases.length ||
          sourceIndex===cibleIndex
        ){
          finDragInventaireIdleV78_();
          return;
        }

        const objetSource=cases[sourceIndex];
        const objetCible=cases[cibleIndex];

        objetSource.positionSac=cibleIndex+1;

        if(objetCible){
          objetCible.positionSac=sourceIndex+1;
        }

        finDragInventaireIdleV78_();
        dessinerGrilleInventaireIdleV78_();
        planifierSauvegardeInventaireIdleV78_();
      }


      window.__debutDragInventaireIdleV78__=
        debutDragInventaireIdleV78_;

      window.__finDragInventaireIdleV78__=
        finDragInventaireIdleV78_;

      window.__survolCaseInventaireIdleV78__=
        survolCaseInventaireIdleV78_;

      window.__quitterCaseInventaireIdleV78__=
        quitterCaseInventaireIdleV78_;

      window.__deposerInventaireIdleV78__=
        deposerInventaireIdleV78_;


      function rendreInventaireIdleV10_(j){
        const cases=
          casesInventaireIdleV78_(j);

        return cases.map(function(objet,index){
          const position=index+1;

          if(!objet){
            return `
              <div
                class="soreal-idle-inventory-slot-v78"
                data-slot-position="${position}"
                ondragover="window.__survolCaseInventaireIdleV78__(event)"
                ondragleave="window.__quitterCaseInventaireIdleV78__(event)"
                ondrop="window.__deposerInventaireIdleV78__(event,${position})"
              >
                <div class="soreal-idle-slot-index-v78">
                  ${position}
                </div>

                <div class="soreal-idle-slot-empty-v78">
                  +
                </div>
              </div>
            `;
          }

          const id=idleHtml_(objet.id);

          const fusion=
            Math.max(0,idleEntier_(objet.fusion));

          const selected=
            Boolean(
              idleSelectionObjetsV32[
                String(objet.id)
              ]
            );

          return `
            <div
              class="soreal-idle-inventory-slot-v78${
                selected
                  ?' soreal-idle-slot-selected-v78'
                  :''
              }"
              data-slot-position="${position}"
              ondragover="window.__survolCaseInventaireIdleV78__(event)"
              ondragleave="window.__quitterCaseInventaireIdleV78__(event)"
              ondrop="window.__deposerInventaireIdleV78__(event,${position})"
            >
              <div class="soreal-idle-slot-index-v78">
                ${position}
              </div>

              <div
                class="soreal-idle-slot-item-v78 ${idleHtml_(objet.rarete||'commun')}"
                data-objet-id="${id}"
                draggable="true"
                ondragstart="window.__debutDragInventaireIdleV78__(event,'${id}')"
                ondragend="window.__finDragInventaireIdleV78__()"
                onpointerdown="window.__debutAppuiObjetIdleV32__('${id}')"
                onpointerup="window.__finAppuiObjetIdleV32__()"
                onpointercancel="window.__finAppuiObjetIdleV32__()"
                onclick="return window.__tapObjetIdleV32__(event,'${id}')"
                oncontextmenu="return false"
              >
                <div class="soreal-idle-slot-emoji-v78">
                  ${emojiObjetIdleV50_(objet)}
                </div>

                <div class="soreal-idle-slot-name-v78">
                  ${idleHtml_(objet.nom||'Objet')}
                  ${fusion?' +'+fusion:''}
                </div>

                <div class="soreal-idle-slot-power-v78">
                  +${formatGrandNombreIdleV70_(objet.bonusPuissance)}
                  puissance
                </div>
              </div>

              <div class="soreal-idle-slot-actions-v78">
                <button
                  type="button"
                  class="soreal-idle-slot-action-v78"
                  title="Équiper"
                  onclick="event.stopPropagation();window.__equiperObjetIdleV10__('${id}')"
                >🛡️</button>

                <button
                  type="button"
                  class="soreal-idle-slot-action-v78"
                  title="Fusionner"
                  onclick="event.stopPropagation();window.__fusionnerLootIdleV21__('${id}')"
                >🔗</button>

                <button
                  type="button"
                  class="soreal-idle-slot-action-v78"
                  title="Recycler"
                  onclick="event.stopPropagation();window.__recyclerObjetsOptimisteIdleV32__(['${id}'])"
                >♻️</button>
              </div>
            </div>
          `;
        }).join('');
      }



      function equiperObjetIdleV10_(
        objetId
      ){
        libererFocusIdleV24_();

        if(
          !idleEtat ||
          !objetId ||
          !SOREAL_SESSION
        ){
          return;
        }

        const inventaire=
          Array.isArray(
            idleEtat.inventaire
          )
            ?idleEtat.inventaire
            :[];

        const objet=
          inventaire.find(
            function(item){
              return String(
                item&&item.id||''
              )===
              String(
                objetId
              );
            }
          );

        if(!objet){
          return;
        }

        if(!idleEtat.equipement){
          idleEtat.equipement={};
        }

        const slot=
          String(
            objet.slot||''
          );

        const ancien=
          idleEtat.equipement[
            slot
          ]||null;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-95 */
        idleEtat.equipement[
          slot
        ]=
          objet;

        if(!ancien){
          idleEtat.inventaireUtilise=
            Math.max(
              0,
              idleEntier_(
                idleEtat.inventaireUtilise
              )-1
            );

          idleEtat.inventaireLibre=
            Math.max(
              0,
              idleEntier_(
                idleEtat.inventaireCapacite
              )-
              idleEntier_(
                idleEtat.inventaireUtilise
              )
            );
        }

        if(!idleEtat.forge){
          idleEtat.forge={};
        }

        const forgeMeta=
          idleEtat.forgeMeta||{
            base:5,
            croissance:1.65
          };

        const forgeNiveau=
          idleEntier_(
            objet.forge
          );

        idleEtat.forge[slot]={
          niveau:
            forgeNiveau,
          cout:
            Math.max(
              1,
              Math.round(
                idleNombre_(
                  forgeMeta.base
                )*
                Math.pow(
                  Math.max(
                    1,
                    idleNombre_(
                      forgeMeta.croissance
                    )
                  ),
                  forgeNiveau
                )
              )
            )
        };

        const delta=
          idleNombre_(
            objet.bonusPuissance
          )-
          idleNombre_(
            ancien&&ancien.bonusPuissance
          );

        idleEtat.bonusEquipement=
          Math.max(
            0,
            idleNombre_(
              idleEtat.bonusEquipement
            )+
            delta
          );

        idleEtat.puissance=
          Math.max(
            1,
            idleNombre_(
              idleEtat.puissance
            )+
            delta
          );

        planifierRenduOptimisteIdleV60_();

        ajouterActionRapideIdleV60_(
          'equip',
          String(objetId)
        );

        messageFlottantIdleV32_(
          '🛡️ Équipé'
        );
      }


      let idleBoutiqueEnCoursV12=false;


      function acheterAmeliorationIdleV12_(
        type
      ){
        libererFocusIdleV24_();

        if(
          !idleEtat ||
          !SOREAL_SESSION ||
          [
            'production',
            'capacite',
            'puissance'
          ].indexOf(type)===-1
        ){
          return;
        }

        const cout=
          idleEntier_(
            idleEtat &&
            idleEtat.coutsBoutique &&
            idleEtat.coutsBoutique[type]
          );

        if(cout<=0){
          messageFlottantIdleV32_(
            '❌ Coût introuvable.'
          );
          return;
        }

        if(
          idleEntier_(
            idleEtat.pieces
          )<cout
        ){
          messageFlottantIdleV32_(
            '❌ Pas assez d’or.'
          );
          return;
        }

        if(!idleEtat.ameliorations){
          idleEtat.ameliorations={
            production:0,
            capacite:0,
            puissance:0
          };
        }

        idleEtat.pieces=
          Math.max(
            0,
            idleEntier_(
              idleEtat.pieces
            )-
            cout
          );

        idleEtat.ameliorations[type]=
          idleEntier_(
            idleEtat.ameliorations[type]
          )+1;

        const niveau=
          idleEntier_(
            idleEtat.ameliorations[type]
          );

        const meta=
          idleEtat &&
          idleEtat.boutiqueMeta &&
          idleEtat.boutiqueMeta[type]
            ?idleEtat.boutiqueMeta[type]
            :null;

        if(
          meta &&
          idleEtat.coutsBoutique
        ){
          idleEtat.coutsBoutique[type]=
            Math.max(
              1,
              Math.round(
                idleNombre_(
                  meta.base
                )*
                Math.pow(
                  Math.max(
                    1,
                    idleNombre_(
                      meta.croissance
                    )
                  ),
                  niveau
                )
              )
            );

          if(!idleEtat.bonusBoutique){
            idleEtat.bonusBoutique={};
          }

          const ancienBonusV111=
            idleNombre_(
              idleEtat.bonusBoutique[type]
            );

          const nouveauBonusV111=
            niveau*
            idleNombre_(
              meta.bonusParNiveau
            );

          idleEtat.bonusBoutique[type]=
            nouveauBonusV111;

          const deltaBonusV111=
            nouveauBonusV111-
            ancienBonusV111;

          if(type==='production'){
            idleEtat.productionSeconde=
              Math.max(
                .01,
                idleNombre_(
                  idleEtat.productionSeconde
                )+
                deltaBonusV111
              );
          }else if(type==='capacite'){
            idleEtat.energieMax=
              Math.max(
                1,
                idleNombre_(
                  idleEtat.energieMax
                )+
                deltaBonusV111
              );
          }else if(type==='puissance'){
            idleEtat.puissance=
              Math.max(
                1,
                idleNombre_(
                  idleEtat.puissance
                )+
                deltaBonusV111
              );
          }
        }

        planifierRenduOptimisteIdleV60_();

        ajouterActionRapideIdleV60_(
          'shop',
          type
        );
      }


      window.__acheterAmeliorationIdleV12__=
        acheterAmeliorationIdleV12_;

      function rendreBoutiqueIdleV12_(j){
        const a=
          j&&j.ameliorations
            ?j.ameliorations
            :{
                production:0,
                capacite:0,
                puissance:0
              };

        const couts=
          j&&j.coutsBoutique
            ?j.coutsBoutique
            :{};

        const bonus=
          j&&j.bonusBoutique
            ?j.bonusBoutique
            :{
                production:0,
                capacite:0,
                puissance:0
              };

        const pieces=
          idleEntier_(
            j&&j.pieces
          );

        const items=[
          {
            type:'production',
            icon:'⚡',
            titre:'Production d’énergie',
            niveau:a.production,
            effet:'+'+
              idleEntier_(bonus.production)+
              ' énergie/sec',
            cout:couts.production
          },
          {
            type:'capacite',
            icon:'🔋',
            titre:'Capacité d’énergie',
            niveau:a.capacite,
            effet:'+'+
              idleEntier_(bonus.capacite)+
              ' énergie max',
            cout:couts.capacite
          },
          {
            type:'puissance',
            icon:'🔥',
            titre:'Puissance permanente',
            niveau:a.puissance,
            effet:'+'+
              idleEntier_(bonus.puissance)+
              ' puissance',
            cout:couts.puissance
          }
        ];

        return items
          .map(function(item){
            const cout=
              idleEntier_(
                item.cout
              );

            return `
              <div class="soreal-idle-shop-card-v12">
                <div>
                  <div class="soreal-idle-shop-title-v12">
                    ${item.icon}
                    ${idleHtml_(item.titre)}
                    · niv. ${idleEntier_(item.niveau)}
                  </div>
                  <div class="soreal-idle-shop-meta-v12">
                    Bonus total : ${idleHtml_(item.effet)}
                  </div>
                </div>

                <button
                  type="button"
                  class="soreal-idle-shop-buy-v12"
                  onclick="window.__acheterAmeliorationIdleV12__('${item.type}')"
                  ${pieces<cout?'disabled':''}
                >
                  ${cout} 🪙
                </button>
              </div>
            `;
          })
          .join('');
      }





      let idleLootActionV21=false;

      function statutLootIdleV21_(texte,type){
        const el=document.getElementById('sorealIdleLootStatusV21');
        if(!el)return;
        el.className='soreal-idle-loot-status-v21 show '+(type||'error');
        el.textContent=String(texte||'');
      }

      function objetsEncoreEnAttenteRecycleV38_(){
        return idleRecycleQueueV38.concat(
          idleRecycleInflightV38
        );
      }


      function appliquerSuppressionsLocalesRecycleV38_(
        joueur
      ){
        if(
          !joueur ||
          !Array.isArray(
            joueur.inventaire
          )
        ){
          return joueur;
        }

        const ids=
          objetsEncoreEnAttenteRecycleV38_();

        if(!ids.length){
          return joueur;
        }

        joueur.inventaire=
          joueur.inventaire.filter(
            function(objet){
              return (
                ids.indexOf(
                  String(
                    objet&&objet.id||''
                  )
                )===-1
              );
            }
          );

        joueur.inventaireUtilise=
          Math.max(
            0,
            joueur.inventaire.length
          );

        return joueur;
      }


      function programmerEnvoiRecycleV38_(){
        if(
          idleRecycleBatchV32 ||
          idleRecycleTimerV38 ||
          !idleRecycleQueueV38.length
        ){
          return;
        }

        idleRecycleTimerV38=
          setTimeout(function(){
            idleRecycleTimerV38=null;
            envoyerRecycleQueueV38_();
          },90);
      }


      function envoyerRecycleQueueV38_(){
        if(
          idleRecycleBatchV32 ||
          !idleRecycleQueueV38.length ||
          !SOREAL_SESSION
        ){
          return;
        }

        if(
          idleFastNetworkBusyV60
        ){
          setTimeout(
            envoyerRecycleQueueV38_,
            100
          );
          return;
        }

        idleRecycleBatchV32=true;

        idleRecycleInflightV38=
          idleRecycleQueueV38.splice(
            0,
            idleRecycleQueueV38.length
          );

        const envoyes=
          idleRecycleInflightV38.slice();

        google.script.run
          .withSuccessHandler(function(res){
            idleRecycleBatchV32=false;
            idleRecycleInflightV38=[];

            if(
              res &&
              res.ok &&
              res.joueur &&
              !idleFastPendingV60_() &&
              !idleFastNetworkBusyV60
            ){
              idleEtat=
                appliquerSuppressionsLocalesRecycleV38_(
                  res.joueur
                );

              rendreIdleEtat_({
                ok:true,
                joueur:idleEtat
              });
            }else if(
              !idleFastPendingV60_()
            ){
              synchroniserJeuIdleV7_();
            }

            programmerEnvoiRecycleV38_();

            if(
              idleFastPendingV60_()
            ){
              planifierEnvoiRapideIdleV60_(35);
            }
          })
          .withFailureHandler(function(){
            idleRecycleBatchV32=false;

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-96 */
            idleRecycleQueueV38=
              envoyes.concat(
                idleRecycleQueueV38
              );

            idleRecycleInflightV38=[];

            setTimeout(
              programmerEnvoiRecycleV38_,
              300
            );
          })
          .recyclerObjetsSorealIdle(
            SOREAL_SESSION,
            envoyes
          );
      }


      function recyclerObjetsOptimisteIdleV32_(
        ids
      ){
        if(
          !idleEtat ||
          !SOREAL_SESSION
        ){
          return;
        }

        const demandes=
          (
            Array.isArray(ids)
              ?ids
              :[]
          )
          .map(String)
          .filter(Boolean);

        if(!demandes.length){
          return;
        }

        const deja=
          objetsEncoreEnAttenteRecycleV38_();

        const nouveaux=
          demandes.filter(
            function(id){
              return (
                deja.indexOf(id)===-1
              );
            }
          );

        if(!nouveaux.length){
          return;
        }

        idleRecycleQueueV38=
          idleRecycleQueueV38.concat(
            nouveaux
          );

        if(
          Array.isArray(
            idleEtat.inventaire
          )
        ){
          idleEtat.inventaire=
            idleEtat.inventaire.filter(
              function(objet){
                return (
                  nouveaux.indexOf(
                    String(
                      objet&&objet.id||''
                    )
                  )===-1
                );
              }
            );

          idleEtat.inventaireUtilise=
            idleEtat.inventaire.length;
        }

        idleSelectionModeV32=false;
        idleSelectionObjetsV32={};

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-97 */
        rendreIdleEtat_({
          ok:true,
          joueur:idleEtat
        });

        programmerEnvoiRecycleV38_();
      }


      function recyclerLootIdleV21_(
        objetId
      ){
        recyclerObjetsOptimisteIdleV32_(
          [
            String(
              objetId || ''
            )
          ]
        );
      }


      window.__recyclerObjetsOptimisteIdleV32__=
        recyclerObjetsOptimisteIdleV32_;


      function fusionnerLootIdleV21_(
        objetId
      ){
        libererFocusIdleV24_();

        if(
          !objetId ||
          !SOREAL_SESSION ||
          !idleEtat
        ){
          return;
        }

        const inventaire=
          Array.isArray(
            idleEtat.inventaire
          )
            ?idleEtat.inventaire
            :[];

        const index=
          inventaire.findIndex(
            function(o){
              return String(
                o&&o.id||''
              )===
              String(
                objetId
              );
            }
          );

        if(index<0){
          return;
        }

        const objet=
          inventaire[index];

        const fusionActuelle=
          idleEntier_(
            objet.fusion
          );

        const doublon=
          inventaire.findIndex(
            function(o,i){
              return (
                i!==index &&
                String(o&&o.nom||'')===
                  String(objet.nom||'') &&
                String(o&&o.slot||'')===
                  String(objet.slot||'') &&
                String(o&&o.rarete||'')===
                  String(objet.rarete||'') &&
                idleEntier_(
                  o&&o.fusion
                )===
                  fusionActuelle &&
                !objetEquipeIdleV10_(
                  idleEtat,
                  o
                )
              );
            }
          );

        if(doublon<0){
          messageFlottantIdleV32_(
            '❌ Il faut un deuxième exemplaire identique.'
          );
          return;
        }

        const avant=
          idleNombre_(
            objet.bonusPuissance
          );

        objet.fusion=
          fusionActuelle+1;

        objet.bonusPuissance=
          Math.max(
            1,
            Math.round(
              avant*1.15
            )
          );

        inventaire.splice(
          doublon,
          1
        );

        idleEtat.inventaire=
          inventaire;

        idleEtat.inventaireUtilise=
          Math.max(
            0,
            inventaire.filter(
              function(o){
                return !objetEquipeIdleV10_(
                  idleEtat,
                  o
                );
              }
            ).length
          );

        if(
          objetEquipeIdleV10_(
            idleEtat,
            objet
          )
        ){
          if(
            idleEtat.equipement &&
            objet.slot
          ){
            idleEtat.equipement[
              objet.slot
            ]=
              objet;
          }

          const delta=
            idleNombre_(
              objet.bonusPuissance
            )-
            avant;

          idleEtat.puissance=
            Math.max(
              1,
              idleNombre_(
                idleEtat.puissance
              )+
              delta
            );

          idleEtat.bonusEquipement=
            Math.max(
              0,
              idleNombre_(
                idleEtat.bonusEquipement
              )+
              delta
            );
        }

        planifierRenduOptimisteIdleV60_();

        ajouterActionRapideIdleV60_(
          'fusion',
          String(objetId)
        );

        messageFlottantIdleV32_(
          '🔗 Fusion +'+
          idleEntier_(
            objet.fusion
          )
        );
      }


      window.__recyclerLootIdleV21__=recyclerLootIdleV21_;
      window.__fusionnerLootIdleV21__=fusionnerLootIdleV21_;


      let idleAventureEnCoursV17=false;


      const CLE_AUTO_AVENTURE_IDLE_V30=
        'sorealIdleAutoAventureV30';

      let idleAutoAventureV30=false;
      let idleAutoZoneV30=0;
      let idleAutoTimerV30=null;
      let idleAutoCountdownTimerV62=null;
      let idleAutoCountdownFinV62=0;


      function niveauCombatAutoIdleV30_(j){
        void j;
        return 0;
      }


      function combatAutoDebloqueIdleV30_(j){
        return aventureDebloqueeIdleV47_(j);
      }


      function chargerCombatAutoIdleV30_(){
        try{
          const brut=
            localStorage.getItem(
              CLE_AUTO_AVENTURE_IDLE_V30
            );

          if(!brut){
            return;
          }

          const obj=
            JSON.parse(brut);

          idleAutoAventureV30=
            Boolean(
              obj&&obj.actif
            );

          idleAutoZoneV30=
            Math.max(
              0,
              idleEntier_(
                obj&&obj.zone
              )
            );
        }catch(e){}
      }


      function sauverCombatAutoIdleV30_(){
        try{
          localStorage.setItem(
            CLE_AUTO_AVENTURE_IDLE_V30,
            JSON.stringify({
              actif:
                idleAutoAventureV30,
              zone:
                idleAutoZoneV30
            })
          );
        }catch(e){}
      }


      function annulerTimerCombatAutoIdleV30_(){
        if(
          idleAutoTimerV30
        ){
          clearTimeout(
            idleAutoTimerV30
          );

          idleAutoTimerV30=null;
        }

        if(
          idleAutoCountdownTimerV62
        ){
          clearInterval(
            idleAutoCountdownTimerV62
          );

          idleAutoCountdownTimerV62=null;
        }

        idleAutoCountdownFinV62=0;

        const compteur=
          document.getElementById(
            'sorealIdleAutoCountdownV62'
          );

        if(compteur){
          compteur.textContent='';
        }
      }


      function arreterCombatAutoIdleV30_(
        message
      ){
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-98 */
        idleAutoAventureV30=false;

        annulerTimerCombatAutoIdleV30_();
        sauverCombatAutoIdleV30_();

        if(idleEtat){
          idleEtat.autoAventure={
            actif:false,
            zoneId:idleAutoZoneV30
          };
        }

        if(SOREAL_SESSION){
          ajouterActionRapideIdleV60_(
            'autoAdventure',
            {
              actif:false,
              zoneId:idleAutoZoneV30
            }
          );
        }

        if(
          message
        ){
          try{
            toastIdleV5_(
              message
            );
          }catch(e){}
        }

        if(
          idleEtat
        ){
          conserverPositionIdleV24_(
            function(){
              rendreIdleEtat_({
                ok:true,
                joueur:idleEtat
              });
            }
          );
        }
      }


      function zoneAventureLocaleIdleV30_(
        zoneId
      ){
        const zones=
          idleEtat &&
          idleEtat.aventure &&
          Array.isArray(
            idleEtat.aventure.zones
          )
            ?idleEtat.aventure.zones
            :[];

        const id=
          idleEntier_(
            zoneId
          );

        return zones.find(
          function(z){
            return (
              idleEntier_(z.id)===
              id
            );
          }
        ) || null;
      }


      function peutRelancerCombatAutoIdleV30_(){
        if(
          !idleAutoAventureV30 ||
          !combatAutoDebloqueIdleV30_(
            idleEtat
          ) ||
          idleMenuActifV28!=='aventure' ||
          idleAventureEnCoursV17 ||
          idleAutoZoneV30<=0
        ){
          return false;
        }

        const zone=
          zoneAventureLocaleIdleV30_(
            idleAutoZoneV30
          );

        if(
          !zone ||
          !zone.debloquee
        ){
          return false;
        }

        return Boolean(zone&&zone.debloquee&&!idleAventureEnCoursV17);
      }


      function programmerCombatAutoIdleV30_(
        delai
      ){
        annulerTimerCombatAutoIdleV30_();

        if(
          !idleAutoAventureV30
        ){
          return;
        }

        const attente=
          Math.max(
            150,
            Math.ceil(
              cooldownAventureRestantIdleV100_()*
              1000
            )+
            40,
            idleEntier_(
              delai
            )||700
          );

        idleAutoCountdownFinV62=
          Date.now()+
          attente;

        function dessinerCompteARebours(){
          const el=
            document.getElementById(
              'sorealIdleAutoCountdownV62'
            );

          if(!el)return;

          const restant=
            Math.max(
              0,
              idleAutoCountdownFinV62-
              Date.now()
            );

          el.textContent=
            restant>0
              ?'Prochain combat dans '+
                (
                  restant/1000
                ).toFixed(1)+
                ' s'
              :'Lancement du combat…';
        }

        dessinerCompteARebours();

        idleAutoCountdownTimerV62=
          setInterval(
            dessinerCompteARebours,
            100
          );

        idleAutoTimerV30=
          setTimeout(
            function(){
              if(
                idleAutoCountdownTimerV62
              ){
                clearInterval(
                  idleAutoCountdownTimerV62
                );

                idleAutoCountdownTimerV62=null;
              }

              idleAutoTimerV30=null;

              const compteur=
                document.getElementById(
                  'sorealIdleAutoCountdownV62'
                );

              if(compteur){
                compteur.textContent=
                  'Lancement du combat…';
              }

              if(
                !peutRelancerCombatAutoIdleV30_()
              ){
                const zone=
                  zoneAventureLocaleIdleV30_(
                    idleAutoZoneV30
                  );


                return;
              }

              combattreAventureIdleV17_(
                idleAutoZoneV30
              );
            },
            attente
          );
      }


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-99 */
      chargerCombatAutoIdleV30_();


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-100 */


      function cooldownAventureRestantIdleV100_(){
        const fin=
          idleEtat&&
          idleEtat.aventure
            ?Math.max(
                0,
                idleNombre_(
                  idleEtat.aventure.cooldownJusqua
                )
              )
            :0;

        return Math.max(
          0,
          (
            fin-
            Date.now()
          )/
          1000
        );
      }


      function actualiserCooldownAventureIdleV100_(
        maintenant
      ){
        if(
          !idleEtat ||
          !idleEtat.aventure
        ){
          return;
        }

        const fin=
          Math.max(
            0,
            idleNombre_(
              idleEtat.aventure.cooldownJusqua
            )
          );

        const restant=
          Math.max(
            0,
            (
              fin-
              maintenant
            )/
            1000
          );

        document
          .querySelectorAll(
            '[id^="sorealIdleAdventureCooldown_"]'
          )
          .forEach(function(el){
            el.textContent=
              restant>0.01
                ?'⏳ Prochaine rencontre dans '+
                  restant.toFixed(1)+
                  ' s'
                :'✅ Rencontre disponible';

            el.classList.toggle(
              'ready',
              restant<=0.01
            );
          });

        const zones=
          idleEtat.aventure&&
          Array.isArray(
            idleEtat.aventure.zones
          )
            ?idleEtat.aventure.zones
            :[];

        document
          .querySelectorAll(
            '.soreal-idle-zone-button-v16[data-aventure-zone]'
          )
          .forEach(function(button){
            const id=
              idleEntier_(
                button.getAttribute(
                  'data-aventure-zone'
                )
              );

            const zone=
              zones.find(function(z){
                return idleEntier_(z.id)===id;
              });


            button.disabled=
              Boolean(
                idleAventureEnCoursV17 ||
                !zone ||
                !zone.debloquee
              );
          });
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-101 */
      function combattreAventureIdleV17_(
        zoneId
      ){
        // IDLE_ADVENTURE_NO_ENERGY_V44 : Aventure (V47 comme cette
        // ancienne mécanique) est indépendante de l'énergie.
        idleReserveAventureV23=0;

        arreterCombatAutoIdleV30_(
          '🤖 Combat automatique désactivé : ancienne mécanique retirée.'
        );
      }

      window.__combattreAventureIdleV17__=
        combattreAventureIdleV17_;


      let idleRenaissanceEnCoursV14=false;


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-102 */
      const IDLE_REBIRTH_FACTOR_LABELS_V1=[
        {id:'currentBossFactor',nom:'Boss Power Bonus'},
        {id:'priorBossFactor',nom:'Boss Power Bonus (dernier Rebirth)'},
        {id:'currentTimeFactor',nom:'Rebirth Time Factor'},
        {id:'priorTimeFactor',nom:'Rebirth Time Factor (dernier Rebirth)'},
        {id:'trainingFactor',nom:'Training level Factor'},
        {id:'bloodMagicBonus',nom:'Bonus Blood Magic'},
        {id:'nguNumberBonus',nom:'Bonus NGU (Attack)'},
        {id:'beardNumberBonus',nom:'Bonus Beard'}
      ];

      function rendreRenaissanceIdleV14_(j){
        const r=j&&j.renaissance?j.renaissance:{};
        const meta=j&&j.systemes&&j.systemes.rebirth?j.systemes.rebirth:{};
        const actuel=Math.max(1,idleNombre_(meta.number||r.number||1));
        const prochain=Math.max(1,idleNombre_(meta.nextNumber||r.nextNumber||actuel));
        const ratio=actuel>0?prochain/actuel:1;
        const preview=meta.preview||{};
        const detailsFacteurs=IDLE_REBIRTH_FACTOR_LABELS_V1
          .filter(function(f){return idleNombre_(preview[f.id])>0&&Math.abs(idleNombre_(preview[f.id])-1)>1e-9;})
          .map(function(f){
            return '<div class="soreal-idle-rebirth-stat-v14">'+
              '<div class="soreal-idle-rebirth-stat-label-v14">'+f.nom+'</div>'+
              '<div class="soreal-idle-rebirth-stat-value-v14">×'+formatGrandNombreIdleV70_(idleNombre_(preview[f.id]),3)+'</div>'+
            '</div>';
          }).join('');
        return `
          <div id="sorealIdleBlocRenaissanceV27" class="soreal-idle-rebirth-v14">
            <div class="soreal-idle-rebirth-title-v14">♻️ Rebirth</div>
            <div class="soreal-idle-rebirth-sub-v14">
              Recommence le run. Le NUMBER obtenu multipliera Attack et Defense au prochain cycle.
            </div>
            <div class="soreal-idle-rebirth-stats-v14">
              <div class="soreal-idle-rebirth-stat-v14">
                <div class="soreal-idle-rebirth-stat-label-v14">NUMBER actuel</div>
                <div class="soreal-idle-rebirth-stat-value-v14">${formatGrandNombreIdleV70_(actuel)}</div>
              </div>
              <div class="soreal-idle-rebirth-stat-v14">
                <div class="soreal-idle-rebirth-stat-label-v14">NUMBER au Rebirth</div>
                <div class="soreal-idle-rebirth-stat-value-v14">${formatGrandNombreIdleV70_(prochain)}</div>
              </div>
              <div class="soreal-idle-rebirth-stat-v14">
                <div class="soreal-idle-rebirth-stat-label-v14">Variation</div>
                <div class="soreal-idle-rebirth-stat-value-v14">×${ratio.toFixed(3)}</div>
              </div>
            </div>
            ${
              detailsFacteurs
                ?'<div class="soreal-idle-window-title-v31" style="margin-top:12px">📐 Détail du calcul</div>'+
                  '<div class="soreal-idle-rebirth-stats-v14">'+detailsFacteurs+'</div>'
                :''
            }
            <button type="button" class="soreal-idle-rebirth-button-v14"
              onclick="window.__renaitreIdleV14__()" ${(idleRenaissanceEnCoursV14||!(idleEtat&&idleEtat.renaissance&&idleEtat.renaissance.debloquee))?'disabled':''}>
              ♻️ REBIRTH
            </button>
            ${
              (idleEtat&&idleEtat.renaissance&&!idleEtat.renaissance.debloquee)
                ?(idleEtat.renaissance.aventureRequise
                  ?`<div class="soreal-idle-rebirth-warning-v14">Débloqué après avoir vaincu le boss ${idleEtat.renaissance.aventureRequiseBoss||4} (déblocage d'Aventure).</div>`
                  :'<div class="soreal-idle-rebirth-warning-v14">Disponible après 3 minutes de run.</div>')
                :''
            }
            <div class="soreal-idle-rebirth-warning-v14">
              Réinitialisé : boss du run, niveaux de Basic Training et progressions temporaires.
              Conservé : EXP et achats EXP, inventaire/équipement et progressions permanentes prévues par NGU.
            </div>
          </div>`;
      }


      function fermerPopupRenaissanceIdleV63_(){
        const modal=
          document.getElementById(
            'sorealIdleRenaissanceModalV63'
          );

        if(modal){
          modal.remove();
        }
      }


      function executerRenaissanceIdleV63_(){
        if(
          idleRenaissanceEnCoursV14 ||
          !SOREAL_SESSION
        ){
          return;
        }

        fermerPopupRenaissanceIdleV63_();

        idleRenaissanceEnCoursV14=true;

        const bouton=
          document.querySelector(
            '.soreal-idle-rebirth-button-v14'
          );

        if(bouton){
          bouton.disabled=true;
          bouton.textContent=
            '♻️ Renaissance…';
        }

        google.script.run
          .withSuccessHandler(function(res){
            idleRenaissanceEnCoursV14=false;

            if(
              !res ||
              !res.ok ||
              !res.joueur
            ){
              toastIdleV5_(
                res&&res.message
                  ?res.message
                  :'Renaissance impossible.'
              );

              if(res&&res.joueur){
                rendreIdleEtat_({
                  ok:true,
                  joueur:res.joueur
                });
              }

              return;
            }

            idleEtat=
              res.joueur;

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-103 */
            idleCombatEnPauseApresDefaiteV1=false;
            idleVictoireBossLocaleV49=false;

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-104 */
            idleAutoAventureV30=false;
            idleAutoZoneV30=0;
            annulerTimerCombatAutoIdleV30_();
            sauverCombatAutoIdleV30_();
            idleAdventureRespawnAtV1=0;
            if(idleAdventureRespawnTimerV165){
              clearTimeout(idleAdventureRespawnTimerV165);
              idleAdventureRespawnTimerV165=null;
            }

            const adventureApresRebirthV186=
              aventureMetaIdleV47_(idleEtat);
            if(adventureApresRebirthV186){
              adventureApresRebirthV186.selectedZone='safe';
              if(adventureApresRebirthV186.fight){
                adventureApresRebirthV186.fight.active=false;
              }
            }
            pousserEtatVersRuntimePartageIdleV1_();

            rendreIdleEtat_({
              ok:true,
              joueur:res.joueur
            });

            messageFlottantIdleV32_(
              '♻️ Rebirth réussi · NUMBER '+formatGrandNombreIdleV70_(res.number||idleEtat&&idleEtat.renaissance&&idleEtat.renaissance.number||1)
            );
          })
          .withFailureHandler(function(e){
            idleRenaissanceEnCoursV14=false;

            toastIdleV5_(
              e&&e.message
                ?e.message
                :'Erreur pendant la Renaissance.'
            );

            if(idleEtat){
              rendreIdleEtat_({
                ok:true,
                joueur:idleEtat
              });
            }
          })
          .renaitreSorealIdle(
            SOREAL_SESSION
          );
      }


      function renaitreIdleV14_(){
        libererFocusIdleV24_();

        if(idleRenaissanceEnCoursV14){
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-105 */
        if(
          !idleEtat ||
          !idleEtat.renaissance ||
          !idleEtat.renaissance.debloquee
        ){
          toastIdleV5_(
            'Rebirth pas encore disponible : il faut au moins 3 minutes de run avant de pouvoir renaître.'
          );

          return;
        }

        const gain=Math.max(1,idleNombre_(idleEtat&&idleEtat.renaissance&&idleEtat.renaissance.nextNumber||1));

        fermerPopupRenaissanceIdleV63_();

        const modal=
          document.createElement(
            'div'
          );

        modal.id=
          'sorealIdleRenaissanceModalV63';

        modal.className=
          'soreal-idle-modal-backdrop-v63';

        modal.innerHTML=
          '<div class="soreal-idle-modal-card-v63" role="dialog" aria-modal="true" aria-label="Confirmer la Renaissance">'+
            '<div class="soreal-idle-modal-top-v63">'+
              '<div class="soreal-idle-modal-icon-v63">♻️</div>'+
              '<div class="soreal-idle-modal-title-v63">Nouvelle Renaissance</div>'+
              '<div class="soreal-idle-modal-gain-v63">+'+
                idleEntier_(gain)+
                ' NUMBER</div>'+
            '</div>'+
            '<div class="soreal-idle-modal-body-v63">'+
              '<div class="soreal-idle-modal-info-v63">'+
                '<strong>Le cycle recommence.</strong><br>'+
                'Boss du run, niveaux de Basic Training et progressions temporaires du run seront remis à zéro.<br><br>'+
                '<strong>Conservé :</strong> inventaire, équipement, sets, collection, progression Aventure, capacité du sac et toutes les progressions permanentes (NGU, Perks, Quirks, Hacks, Wishes, Cards, MacGuffins…).'+
              '</div>'+
            '</div>'+
            '<div class="soreal-idle-modal-actions-v63">'+
              '<button type="button" class="soreal-idle-modal-button-v63 cancel" onclick="window.__fermerPopupRenaissanceIdleV63__()">Annuler</button>'+
              '<button type="button" class="soreal-idle-modal-button-v63 confirm" onclick="window.__executerRenaissanceIdleV63__()">♻️ Renaître</button>'+
            '</div>'+
          '</div>';

        modal.addEventListener(
          'click',
          function(event){
            if(event.target===modal){
              fermerPopupRenaissanceIdleV63_();
            }
          }
        );

        document.body.appendChild(
          modal
        );
      }


      window.__fermerPopupRenaissanceIdleV63__=
        fermerPopupRenaissanceIdleV63_;

      window.__executerRenaissanceIdleV63__=
        executerRenaissanceIdleV63_;


      window.__renaitreIdleV14__=
        renaitreIdleV14_;



      const CLE_MENU_IDLE_V28=
        'sorealIdleMenuActifV28';

      let idleMenuActifV28='combat';

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-106 */
      let idleMenuRenduV179=null;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-107 */
      function texte69LolIdleV183_(texte){const a=window.__SOREAL_IDLE_TEXT_TRANSFORMS_V1__;return a&&a.texte69Lol?a.texte69Lol(texte):String(texte||'');}
      function appliquer69LolNoeudIdleV183_(racine){
        if(!racine||!document.body.classList.contains('soreal-idle-active-v47'))return;
        const walker=document.createTreeWalker(
          racine,
          NodeFilter.SHOW_TEXT
        );
        const nodes=[];
        while(walker.nextNode())nodes.push(walker.currentNode);
        nodes.forEach(function(node){
          const parent=node.parentElement;
          if(!parent||/^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION)$/i.test(parent.tagName))return;
          const avant=node.nodeValue;
          const apres=texte69LolIdleV183_(avant);
          if(apres!==avant)node.nodeValue=apres;
        });
      }
      function installer69LolIdleV183_(){
        if(document.body.dataset.idle69LolV183==='1')return;
        document.body.dataset.idle69LolV183='1';
        const observer=new MutationObserver(function(mutations){
          if(!document.body.classList.contains('soreal-idle-active-v47'))return;
          mutations.forEach(function(m){
            if(m.type==='characterData'){
              const node=m.target;
              const parent=node.parentElement;
              if(!parent||/^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION)$/i.test(parent.tagName))return;
              const apres=texte69LolIdleV183_(node.nodeValue);
              if(apres!==node.nodeValue)node.nodeValue=apres;
            }else{
              Array.from(m.addedNodes||[]).forEach(function(node){
                if(node.nodeType===Node.TEXT_NODE){
                  const apres=texte69LolIdleV183_(node.nodeValue);
                  if(apres!==node.nodeValue)node.nodeValue=apres;
                }else if(node.nodeType===Node.ELEMENT_NODE){
                  appliquer69LolNoeudIdleV183_(node);
                }
              });
            }
          });
        });
        observer.observe(document.body,{subtree:true,childList:true,characterData:true});
        appliquer69LolNoeudIdleV183_(document.body);
      }


      function chargerMenuIdleV28_(){
        try{
          const sauve=
            sessionStorage.getItem(
              CLE_MENU_IDLE_V28
            );

          if(sauve){
            idleMenuActifV28=
              String(sauve)==='inventaire'?'aventure':String(sauve);
          }
        }catch(e){}
      }


      function sauverMenuIdleV28_(){
        try{
          sessionStorage.setItem(
            CLE_MENU_IDLE_V28,
            idleMenuActifV28
          );
        }catch(e){}
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-108 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-109 */
      function restaurerScrollNavIdleV28_(){
        const actif=
          document.querySelector(
            '.soreal-idle-nav-v28 .active'
          );

        if(!actif)return;

        const nav=
          actif.closest('.soreal-idle-nav-v28');

        if(!nav)return;

        const navRect=nav.getBoundingClientRect();
        const actifRect=actif.getBoundingClientRect();

        const offsetDansNav=
          actifRect.left-
          navRect.left+
          nav.scrollLeft;

        const cible=
          offsetDansNav-
          (nav.clientWidth-actifRect.width)/2;

        nav.scrollLeft=
          Math.max(
            0,
            Math.min(
              cible,
              nav.scrollWidth-nav.clientWidth
            )
          );

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-110 */
        const racine=
          document.getElementById('app');

        let ancetre=
          nav.parentElement;

        while(
          ancetre &&
          ancetre!==racine &&
          ancetre!==document.body
        ){
          ancetre.scrollLeft=0;
          ancetre=ancetre.parentElement;
        }

        if(racine)racine.scrollLeft=0;
      }


      function niveauRequisMenuIdleV29_(
        menu,
        j
      ){
        void menu;
        void j;
        return 1;
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-111 */
      const IDLE_SYSTEME_PAR_MENU_V1={
        augmentations:'augmentations',
        avance:'advancedTraining',
        machine:'timeMachine',
        sang:'bloodMagic',
        wandoos:'wandoos',
        ngu:'ngu',
        yggdrasil:'yggdrasil',
        moneyPit:'moneyPit',
        diggers:'diggers',
        beards:'beards',
        tower:'tower',
        perks:'perks',
        challenges:'challenges',
        titans:'titans',
        macguffins:'macguffins',
        daycare:'daycare',
        questing:'questing',
        quirks:'quirks',
        hacks:'hacks',
        wishes:'wishes',
        cards:'cards',
        cooking:'cooking',
        succes:'achievements'
      };
      const IDLE_MENU_PAR_SYSTEME_V1=Object.fromEntries(
        Object.entries(IDLE_SYSTEME_PAR_MENU_V1).map(function(paire){
          return [paire[1],paire[0]];
        })
      );

      function menuDisponibleIdleV28_(
        id,
        j
      ){
        if(!j)return false;

        if(
          id==='entrainement' ||
          id==='combat' ||
          id==='parametres'
        ){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-112 */
          return true;
        }

        if(id==='spendExp'){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-113 */
          return Boolean(
            j.systemes&&
            j.systemes.records&&
            idleNombre_(j.systemes.records.highestBoss)>=1
          );
        }

        if(id==='setsZones')return false;

        if(id==='sellout'){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-114 */
          return Boolean(
            j.systemes&&
            j.systemes.selloutShop&&
            j.systemes.selloutShop.unlockedEver
          );
        }

        if(id==='aventure'){
          return Boolean(j.aventure&&j.aventure.debloquee);
        }

        /* 2026-09-24 : plus de menu « Inventory » — son contenu est sous Adventure (pageAventureIdleV28_). */
        if(id==='inventaire')return false;

        if(id==='bestiaire'){
          return Boolean(j.bestiaire&&j.bestiaire.debloquee);
        }

        if(id==='renaissance'){
          return Boolean(j.renaissance&&j.renaissance.debloquee);
        }

        const systemeId=IDLE_SYSTEME_PAR_MENU_V1[id];
        if(!systemeId)return false;

        const liste=
          j.systemes&&Array.isArray(j.systemes.systems)
            ?j.systemes.systems
            :[];

        const systeme=liste.find(function(x){
          return x&&x.id===systemeId;
        });

        return Boolean(
          systeme&&systeme.unlock&&systeme.unlock.unlocked
        );
      }

      function generationJoueurIdleV75_(
        j
      ){
        return [
          String(j&&j.id||'joueur'),
          String(
            j&&j.profil&&j.profil.dateDebut||'date'
          )
        ].join('|');
      }


      function definitionsNouveautesIdleV75_(){
        return {
          bestiaire:{
            icon:'📖',
            titre:'Bestiaire débloqué',
            intro:'Tes rencontres sont désormais consignées.',
            menuCible:'bestiaire',
            libelleCible:'Aller au bestiaire',
            bullets:[
              'Une créature reste inconnue tant que tu ne l’as jamais rencontrée.',
              'Boss principaux et créatures d’Aventure partagent le même registre.',
              'Certaines entrées sont beaucoup plus difficiles à découvrir que les autres.'
            ]
          },
          combat_auto:{
            icon:'🤖',
            titre:'Aventure AUTO débloquée',
            intro:'Tu peux automatiser les expéditions.',
            menuCible:'aventure',
            libelleCible:'Aller à l’aventure',
            bullets:[
              'Choisis une zone puis active AUTO.',
              'L’énergie continue d’être consommée pour chaque combat.'
            ]
          },
          renaissance:{
            icon:'♻️',
            titre:'Renaissance débloquée',
            intro:'Tu peux désormais recommencer plus fort.',
            menuCible:'renaissance',
            libelleCible:'Aller à la Renaissance',
            bullets:[
              'Une Renaissance sacrifie une partie de ta progression.',
              'En échange, ton NOMBRE grandit : il multiplie ton Attaque et ta Défense et accélère les cycles suivants.'
            ]
          }
        };
      }


      function fonctionnalitesDisponiblesIdleV75_(j){
        const disponibles=[];

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-115 */
        ['aventure','combat_auto','renaissance']
          .forEach(function(id){
            const entree=
              j&&j.deblocages&&j.deblocages[id]
                ?j.deblocages[id]
                :null;

            if(
              entree &&
              idleEntier_(j.niveau)>=
              idleEntier_(entree.niveau)
            ){
              disponibles.push(id);
            }
          });

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-116 */

        if(
          j&&j.systemes&&Array.isArray(j.systemes.systems)
        ){
          j.systemes.systems.forEach(function(s){
            if(
              s&&
              s.id&&
              s.unlock&&
              s.unlock.unlocked
            ){
              disponibles.push(
                'meta:'+String(s.id)
              );
            }
          });
        }

        return disponibles;
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-117 */
      function idleInfosParMenuIdleV1_(j){
        const definitions=definitionsNouveautesIdleV75_();
        const actuelles=fonctionnalitesDisponiblesIdleV75_(j);
        const parMenu={};

        actuelles.forEach(function(id){
          let info=definitions[id]||null;

          if(
            !info &&
            String(id).indexOf('meta:')===0 &&
            j&&j.systemes&&Array.isArray(j.systemes.systems)
          ){
            const systemeId=String(id).slice(5);
            const s=j.systemes.systems.find(function(entree){
              return entree&&entree.id===systemeId;
            });

            if(s){
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-118 */
              if(systemeId==='moneyPit'){
                info=infoMoneyPitIdleV1_();
              }else if(systemeId!=='dailySpin'){
                const menuCible=IDLE_MENU_PAR_SYSTEME_V1[systemeId]||null;
                info=menuCible?{
                  icon:s.icon||'✨',
                  titre:(s.name||'Nouveau système')+' débloqué',
                  intro:'Une nouvelle couche de progression est disponible.',
                  menuCible:menuCible,
                  libelleCible:'Ouvrir le système',
                  bullets:[
                    s.desc||'Ce système améliore ta progression.',
                    'Son état est sauvegardé dans le moteur partagé SOREAL IDLE.',
                    s.kind==='permanent'
                      ?'Cette progression est permanente entre les Renaissances.'
                      :'Vérifie ce qui est conservé ou banké lors d’une Renaissance.'
                  ]
                }:null;
              }
            }
          }

          if(info&&info.menuCible){
            parMenu[info.menuCible]=info;
          }
        });

        return parMenu;
      }


      function idleMenusAckCleV1_(j){
        return 'soreal_idle_menus_ack_v1_'+generationJoueurIdleV75_(j);
      }

      /*
       * « Déjà vu » (popups de menus, tutoriels, textes d'accueil) — Norman, 2026-09-24 : « quand on rebirth, on a encore les popups quand
       * on va dans les menus ; ils ne doivent arriver qu'une fois, pareil pour les textes d'accueil ». L'état vit désormais AUSSI côté
       * serveur (profil.stats.vus, opération marquerVusSorealIdle) : une Renaissance, un autre appareil ou un stockage local vidé ne
       * les rejouent plus. Le stockage local reste un cache immédiat ; ce qu'il contient déjà est envoyé au serveur une fois.
       */
      const idleVusMemoireV1={};
      let idleVusEnAttenteV1=[];
      let idleVusEnvoiEnCoursV1=false;
      let idleVusMigreV1='';

      function idleVusServeurV1_(j){
        const stats=j&&j.profil&&j.profil.stats;
        return Array.isArray(stats&&stats.vus)?stats.vus:[];
      }

      function idleVuConnuV1_(j,id){
        return idleVusMemoireV1[id]===true||idleVusServeurV1_(j).indexOf(id)!==-1;
      }

      function idleVusEnvoyerV1_(){
        if(idleVusEnvoiEnCoursV1||!idleVusEnAttenteV1.length||!SOREAL_SESSION)return;
        const lot=idleVusEnAttenteV1.slice(0,50);
        idleVusEnvoiEnCoursV1=true;
        try{
          google.script.run
            .withSuccessHandler(function(res){
              idleVusEnvoiEnCoursV1=false;
              if(!res||!res.ok)return;
              idleVusEnAttenteV1=idleVusEnAttenteV1.filter(function(id){return lot.indexOf(id)===-1;});
              if(idleEtat&&idleEtat.profil&&idleEtat.profil.stats&&Array.isArray(res.vus)){
                idleEtat.profil.stats.vus=res.vus;
              }
              if(idleVusEnAttenteV1.length)idleVusEnvoyerV1_();
            })
            .withFailureHandler(function(){
              idleVusEnvoiEnCoursV1=false;
            })
            .marquerVusSorealIdle(SOREAL_SESSION,lot);
        }catch(e){
          idleVusEnvoiEnCoursV1=false;
        }
      }

      function idleVuMarquerV1_(id){
        idleVusMemoireV1[id]=true;
        if(idleVusEnAttenteV1.indexOf(id)===-1)idleVusEnAttenteV1.push(id);
        idleVusEnvoyerV1_();
      }

      /* Identifiant serveur d'un tutoriel : sa clé locale sans le joueur (« soreal_idle_tutoriel_aventure_v1_<joueur> » -> « tuto:tutoriel_aventure »). */
      function idleVuIdTutorielV1_(cle){
        return 'tuto:'+String(cle).replace(/^soreal_idle_/,'').replace(/_v\d+_.*$/,'');
      }

      function idleMenusAckListeLocaleV1_(j){
        try{
          const brut=JSON.parse(localStorage.getItem(idleMenusAckCleV1_(j))||'[]');
          return Array.isArray(brut)?brut:[];
        }catch(e){
          return [];
        }
      }

      function idleMenusAckListeV1_(j){
        const liste=idleMenusAckListeLocaleV1_(j).slice();
        idleVusServeurV1_(j).concat(Object.keys(idleVusMemoireV1)).forEach(function(id){
          if(String(id).indexOf('menu:')===0&&liste.indexOf(String(id).slice(5))===-1)liste.push(String(id).slice(5));
        });
        return liste;
      }

      /* Une fois par partie chargée : ce que le navigateur sait déjà « vu » est confié au serveur (anciens joueurs). */
      function idleVusMigrerLocalV1_(j){
        if(!j)return;
        const generation=generationJoueurIdleV75_(j);
        if(idleVusMigreV1===generation)return;
        idleVusMigreV1=generation;
        idleMenusAckListeLocaleV1_(j).forEach(function(menu){
          if(!idleVuConnuV1_(j,'menu:'+menu))idleVuMarquerV1_('menu:'+menu);
        });
        [
          'soreal_idle_bienvenue_v75_',
          'soreal_idle_tutoriel_debut_v1_soreal_idle_bienvenue_v75_',
          'soreal_idle_tutoriel_premier_boss_v1_',
          'soreal_idle_tutoriel_aventure_v1_'
        ].forEach(function(prefixe){
          const cle=prefixe+generation;
          const id=prefixe==='soreal_idle_bienvenue_v75_'?'bienvenue':idleVuIdTutorielV1_(cle);
          if(idleTutorielPagesDejaVuLocalV1_(cle)&&!idleVuConnuV1_(j,id))idleVuMarquerV1_(id);
        });
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-119 */
      const IDLE_MENUS_SANS_CLIGNOTEMENT_V1=['entrainement','combat','parametres','sellout'];

      function idleMenuEstAcquisV1_(j,menuId){
        return IDLE_MENUS_SANS_CLIGNOTEMENT_V1.indexOf(menuId)!==-1||
          idleMenusAckListeV1_(j).indexOf(menuId)!==-1;
      }

      function idleMenuMarquerAcquisV1_(j,menuId){
        if(IDLE_MENUS_SANS_CLIGNOTEMENT_V1.indexOf(menuId)!==-1)return;
        const liste=idleMenusAckListeLocaleV1_(j);
        if(liste.indexOf(menuId)===-1){
          liste.push(menuId);
          try{
            localStorage.setItem(idleMenusAckCleV1_(j),JSON.stringify(liste));
          }catch(e){}
        }
        idleVuMarquerV1_('menu:'+menuId);
      }


      function fermerPopupNouveauteIdleV75_(){
        const modal=
          document.getElementById(
            'sorealIdleNouveauteModalV75'
          );

        if(modal){
          modal.remove();
        }

        idlePopupActifV75=false;

        if(
          !idlePopupQueueV75.length
        ){
          idlePopupBloqueCombatV102=false;
        }

        setTimeout(
          afficherProchainePopupIdleV75_,
          120
        );
      }


      function allerDepuisPopupNouveauteIdleV106_(
        menu
      ){
        const cible=
          String(
            menu||''
          );

        fermerPopupNouveauteIdleV75_();

        if(
          cible &&
          menuDisponibleIdleV28_(
            cible,
            idleEtat
          )
        ){
          setTimeout(
            function(){
              menuIdleV28_(
                cible
              );
            },
            20
          );
        }
      }


      window.__allerDepuisPopupNouveauteIdleV106__=
        allerDepuisPopupNouveauteIdleV106_;


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-120 */
      const TUTORIEL_DEBUT_JEU_PAGES_V1=[
        {
          titre:'LE COMMENCEMENT',
          sousTitre:'(ACCROCHE-TOI BIEN)',
          long:true,
          bouton:'JOUER',
          paragraphes:[
            '*BLOUM*',
            'Quand tu reprends connaissance, la première chose que tu remarques, c’est ce goût de cuivre dans ta bouche.',
            'La seconde, c’est l’odeur d’égout à plein nez tout autour de toi.',
            'Tu te relèves en soignant ta lèvre fendue et en te frottant la tête, qui a l’air d’avoir reçu tout l’amour d’un bloc de béton. Tu essaies de te rappeler comment tu es arrivé ici... enfin, peu importe où est « ici ». Tu réalises, avec un calme étonnant, que tu as complètement oublié qui tu es. Vu l’état dans lequel tu te trouves, tu te dis qu’ils devaient être de sacrés connards. Balancé dans une fosse d’égout dégueulasse...',
            'Au moins, à court terme, tu as un objectif : trouver un moyen de sortir d’ici. Ça a l’air d’être la bonne chose à faire. Tu essaies de te lever mais tes genoux tremblent, se dérobent, et tu retombes. C’est seulement maintenant que tu sens la faiblesse dans ton corps. Pas le genre de faiblesse normale, comme quand tu te lèves trop vite et que la tête tourne, ou quand ton bras se fait arracher dans un accident industriel. Non, tu as l’impression que *quelque chose* a aspiré la majorité de ta force.',
            'Bon, il n’y a rien d’autre à faire qu’essayer de récupérer un peu de cette force et sortir d’ici. Peut-être qu’appuyer sur un gros bouton blanc marqué « JOUER » te permettra de faire quelque chose d’amusant.'
          ]
        },
        {
          titre:'Norman & Sébastien',
          paragraphes:[
            'Salut, qui que tu sois ! Content que tu aies décidé de jeter un œil à SOREAL IDLE. Nous sommes Norman & Sébastien, les narrateurs de cette histoire. Bref, on commence !'
          ]
        },
        {
          titre:'Objectif',
          paragraphes:[
            'Donc, ton objectif principal dans SOREAL IDLE ? Devenir super méga puissant, et vaincre tous les Boss bizarres qui se dressent sur ton chemin ! En haut, en dessous de la grosse barre verte, tu vois tes deux stats principales, Attaque et Défense. Elles démarrent à 100, mais elles vont grimper à toute vitesse dans une seconde.'
          ]
        },
        {
          titre:'Énergie',
          paragraphes:[
            'En parlant de la grosse barre verte, elle représente ton énergie. Tu génères de l’Énergie à chaque fois que la barre verte se remplit, jusqu’à atteindre le plafond, qui est de 500 pour l’instant. Et l’Énergie sera la clé pour faire grimper tes chiffres d’Attaque et de Défense.'
          ]
        },
        {
          titre:'Basic Training',
          paragraphes:[
            'C’est là que les choses se passent. Si tu sélectionnes Basic Training dans le menu en haut, tu pourras augmenter ton attaque et ta défense (quelle surprise). Pour t’entraîner, tu assignes ton Énergie à une tâche ! Vas-y, clique sur le bouton « + » à côté de « Attaque passive » et regarde ce qui se passe.'
          ]
        },
        {
          titre:'Bien joué',
          paragraphes:[
            'Si tu as bien fait, la barre devrait être en train de se remplir, et ton Attaque devrait grimper maintenant. Tape-toi dans le dos pour te féliciter. Pas trop bas quand même, ce serait bizarre. Si tu cliques sur le bouton -, tu peux retirer cette énergie et la mettre ailleurs.'
          ]
        },
        {
          titre:'Énergie Idle',
          paragraphes:[
            'La grosse barre verte, représente ton energie d\'entrainement disponible. C’est la quantité d’Énergie que tu n’as assignée nulle part et qui traîne à rien faire comme une bonne grosse feignasse. Ton « Plafond d’Énergie » c’est la somme de toute ton Énergie, qu’elle soit idle ou assignée.'
          ]
        },
        {
          titre:'Saisie personnalisée',
          paragraphes:[
            'Quand tu cliques sur le bouton + pour assigner de l’Énergie à une tâche, le jeu va essayer d’assigner une quantité d’Énergie égale au chiffre saisi en haut. En cliquant sur ces boutons bizarres en haut, tu changes la quantité stockée dans la saisie, et tu peux aussi entrer un chiffre personnalisé toi-même dans la barre.'
          ]
        },
        {
          titre:'Défense',
          paragraphes:[
            'Avoir la force d’un transpalette électrique mais en carton, c’est cool, mais tu voudras sûrement un peu de Défense aussi. Donc, il va falloir entraîner la compétence « Blocage » dans le menu Basic Training aussi. Si toute ton Énergie est allouée à l’Attaque passive, il va falloir en retirer un peu.'
          ]
        },
        {
          titre:'Fight Boss',
          paragraphes:[
            'Quand tes stats seront assez hautes, va jeter un œil au menu Fight Boss, et tu pourras mettre ta puissance à l’épreuve. En commençant par un adversaire particulièrement vicieux... Un Petit Bout de Peluche.'
          ]
        },
        {
          titre:'Norman & Sébastien',
          seulementPrecedent:true,
          paragraphes:[
            'Bon, on va aller se faire un sandwich, alors continue à t’entraîner et bats le premier boss. On sera de retour après !',
            '— Norman & Sébastien'
          ]
        }
      ];

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-121 */
      const TUTORIEL_AVENTURE_PAGES_V1=[
        {
          titre:'Norman & Sébastien',
          paragraphes:[
            'Salut salut, c’est encore Norman & Sébastien. Alors comme ça t’as vaincu Une Petite Souris ? On suppose que ça veut dire qu’il est temps d’ajouter un peu de nouveau gameplay qui déchire à ton aventure. D’abord, tu as débloqué l’AVENTURE. Pense à ça comme un « RPG pourri dans le jeu » : tu vas combattre des trucs et looter d’autres trucs. Les compétences d’entraînement que tu débloques deviennent des attaques utilisables en Aventure pour vaincre les ennemis !'
          ]
        },
        {
          titre:'Équipement',
          paragraphes:[
            'Des ennemis vont apparaître aléatoirement toutes les quelques secondes quand tu sors de la Zone Sûre. Combattre des ennemis en Aventure fait tomber de l’équipement, que tu peux équiper dans ton INVENTAIRE, juste en dessous dans cette même page Aventure ! L’équipement peut booster tes stats en Aventure ainsi que tes stats principales d’Attaque/Défense, et plus tard, offrir des bonus spéciaux du tonnerre !'
          ]
        },
        {
          titre:'Zones',
          paragraphes:[
            'Pour commencer, tu n’as débloqué que la zone d’entraînement. Vaincre des boss avec un numéro plus élevé débloquera petit à petit de nouvelles zones d’Aventure à explorer, avec du meilleur équipement à te coller sur le dos !',
            'AUSSI : les boss en Aventure ont une chance de faire tomber de l’EXP ! L’EXP, c’est bien.'
          ]
        },
        {
          titre:'Rebirth',
          paragraphes:[
            'Tu as aussi débloqué le menu Rebirth (une renaissance en français), ce qui mérite quelques explications.'
          ]
        },
        {
          titre:'Le NOMBRE',
          paragraphes:[
            'À un moment donné, tu vas arriver à un point où progresser prendra une éternité. Si tu fais un Rebirth (une renaissance en français), tu vas réinitialiser la plupart de ta progression dans chaque menu, et les boss vont être réinitialisés. En contrepartie, ton NOMBRE va grandir. Le NOMBRE, c’est... eh bien, c’est un nombre. Ton Attaque et ta Défense sont multipliées par ce NOMBRE, et ton NOMBRE peut devenir ridiculement énorme.'
          ]
        },
        {
          titre:'Le NOMBRE',
          paragraphes:[
            'Genre, bêtement énorme.'
          ]
        },
        {
          titre:'Le NOMBRE',
          paragraphes:[
            'Genre, beaucoup plus énorme que ce que t’as dans le pantalon. Hein ptite bite ! (Si t’es une femme, c’est valable pour toi aussi)'
          ]
        },
        {
          titre:'Quand faire un Rebirth ?',
          paragraphes:[
            'Donc, dès que la progression te semble lente, c’est probablement le moment de faire un Rebirth (une renaissance en français), et de réinitialiser un peu de progression pour faire grimper ton nombre ! Tu peux essayer de faire un Rebirth maintenant si tu veux, mais si tu attends plus longtemps, ton NOMBRE grandira encore plus ! Le temps écoulé depuis ton dernier Rebirth est un facteur important pour la taille de ton NOMBRE, jusqu’à 60 minutes. Tu peux vérifier depuis combien de temps ton Rebirth est en cours dans la barre au-dessus.'
          ]
        },
        {
          titre:'Après le Rebirth',
          paragraphes:[
            'Quand tu fais un Rebirth (une renaissance en français), les boss réapparaissent aussi. Avec un NOMBRE assez élevé, tu peux vaincre des boss avec un numéro plus élevé, ce qui te donnera de l’EXP à chaque fois que tu les vaincs !'
          ]
        },
        {
          titre:'Norman & Sébastien',
          seulementPrecedent:true,
          paragraphes:[
            'Arrive au boss 17 et tu débloqueras encore autre chose ! À plus !',
            '— Norman & Sébastien'
          ]
        }
      ];

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-122 */
      const TUTORIEL_PREMIER_BOSS_PAGES_V1=[
        {
          titre:'Norman & Sébastien',
          paragraphes:[
            'Oh hé, cool, tu as écrasé Un Petit Bout de Peluche. Plus important : ce sandwich est fantastique ! Jambon fumé et dinde, fromage suisse et sauce miel-moutarde sur un pain ciabatta. Miam.'
          ]
        },
        {
          titre:'Récompenses',
          paragraphes:[
            'Donc tuer des boss apporte quelques récompenses importantes : d’abord, tu gagnes de l’EXP. L’EXP sert à acheter des pouvoirs permanents dans le menu EXP Shop, qui vient aussi de se débloquer. Tu devrais voir un joli bouton bleu dans la barre en haut.'
          ]
        },
        {
          titre:'Conseil de pro',
          paragraphes:[
            'Il y a plein de trucs à acheter avec l’EXP, mais ne panique pas ! Notre conseil de pro : achète les offres spéciales qui augmentent la vitesse de remplissage de la barre d’Énergie. On les a faites spécifiquement pour des débutants comme toi... ne le prends pas mal.'
          ]
        },
        {
          titre:'Norman & Sébastien',
          seulementPrecedent:true,
          paragraphes:[
            'Bats les prochains boss et on reviendra t’embêter. Norman & Sébastien, terminé !'
          ]
        }
      ];

      function idleTutorielPagesDejaVuLocalV1_(cle){
        try{
          return Boolean(JSON.parse(localStorage.getItem(cle)||'null'));
        }catch(e){
          return false;
        }
      }

      function idleTutorielPagesDejaVuV1_(cle){
        return idleTutorielPagesDejaVuLocalV1_(cle)||idleVuConnuV1_(idleEtat,idleVuIdTutorielV1_(cle));
      }

      function idleTutorielPagesMarquerVuV1_(cle){
        try{
          localStorage.setItem(cle,JSON.stringify(true));
        }catch(e){}
        idleVuMarquerV1_(idleVuIdTutorielV1_(cle));
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-123 */
      const STYLE_ID_TUTO_FLOTTANT_V1='sorealIdleTutoFlottantV1';
      function installerStyleTutoFlottantV1_(){
        if(document.getElementById(STYLE_ID_TUTO_FLOTTANT_V1))return;
        const style=document.createElement('style');
        style.id=STYLE_ID_TUTO_FLOTTANT_V1;
        style.textContent=`
          .soreal-idle-tuto-flottant-v1{
            position:fixed;
            z-index:9000;
            width:min(300px,calc(100vw - 16px));
            border-radius:16px;
            background:#182236;
            border:1px solid rgba(166,188,229,.18);
            box-shadow:0 18px 40px rgba(5,10,25,.45);
            overflow:hidden;
            color:#e9f0f8;
          }
          .soreal-idle-tuto-flottant-drag-v1{
            display:flex;
            align-items:center;
            justify-content:space-between;
            padding:6px 10px;
            background:linear-gradient(135deg,#202d45,#2a3b59);
            color:#8fa3c9;
            cursor:grab;
            user-select:none;
            touch-action:none;
            font-size:12px;
            letter-spacing:1px;
          }
          .soreal-idle-tuto-flottant-drag-v1:active{cursor:grabbing}
          .soreal-idle-tuto-flottant-titre-v1{
            padding:10px 14px 2px;
            font-family:Georgia,'Iowan Old Style','Palatino Linotype',Palatino,serif;
            font-weight:800;
            font-size:16px;
            letter-spacing:.3px;
            color:#ffd76a;
          }
          .soreal-idle-tuto-flottant-corps-v1{
            padding:6px 14px 12px;
            font-family:Georgia,'Iowan Old Style','Palatino Linotype',Palatino,serif;
            font-size:13.5px;
            line-height:1.55;
            color:#cfd8ea;
            max-height:38vh;
            overflow-y:auto;
          }
          .soreal-idle-tuto-flottant-actions-v1{
            display:grid;
            grid-template-columns:1fr 1fr 1fr;
            gap:6px;
            padding:0 10px 10px;
          }
          .soreal-idle-tuto-flottant-actions-v1 button{
            border:0;
            border-radius:9px;
            padding:7px 4px;
            font-size:12px;
            font-weight:700;
            cursor:pointer;
            background:rgba(255,255,255,.08);
            color:#cfd8ea;
          }
          .soreal-idle-tuto-flottant-actions-v1 button.confirm{
            background:linear-gradient(135deg,#f4d47a,#e0a93a);
            color:#241a04;
          }
          .soreal-idle-tuto-flottant-actions-v1 button:disabled{
            opacity:.35;
            cursor:default;
          }
        `;
        document.head.appendChild(style);
      }

      let idleTutorielPagesPositionV1_=null;
      function positionnerTutoFlottantV1_(root){
        const largeur=root.offsetWidth||300;
        const hauteur=root.offsetHeight||160;
        const margeMax={
          left:Math.max(8,window.innerWidth-largeur-8),
          top:Math.max(8,window.innerHeight-hauteur-8)
        };
        if(!idleTutorielPagesPositionV1_){
          idleTutorielPagesPositionV1_={
            left:margeMax.left,
            top:8
          };
        }
        idleTutorielPagesPositionV1_.left=Math.min(margeMax.left,Math.max(8,idleTutorielPagesPositionV1_.left));
        idleTutorielPagesPositionV1_.top=Math.min(margeMax.top,Math.max(8,idleTutorielPagesPositionV1_.top));
        root.style.left=idleTutorielPagesPositionV1_.left+'px';
        root.style.top=idleTutorielPagesPositionV1_.top+'px';
      }
      function activerGlisserTutoFlottantV1_(root){
        const poignee=root.querySelector('.soreal-idle-tuto-flottant-drag-v1');
        if(!poignee)return;
        let actif=false,departX=0,departY=0,origineLeft=0,origineTop=0;
        const surDeplacement=function(event){
          if(!actif)return;
          const point=event.touches?event.touches[0]:event;
          const largeur=root.offsetWidth,hauteur=root.offsetHeight;
          const nouveauLeft=Math.min(Math.max(8,window.innerWidth-largeur-8),Math.max(8,origineLeft+(point.clientX-departX)));
          const nouveauTop=Math.min(Math.max(8,window.innerHeight-hauteur-8),Math.max(8,origineTop+(point.clientY-departY)));
          idleTutorielPagesPositionV1_={left:nouveauLeft,top:nouveauTop};
          root.style.left=nouveauLeft+'px';
          root.style.top=nouveauTop+'px';
          if(event.cancelable)event.preventDefault();
        };
        const surRelachement=function(){
          actif=false;
          document.removeEventListener('mousemove',surDeplacement);
          document.removeEventListener('mouseup',surRelachement);
          document.removeEventListener('touchmove',surDeplacement);
          document.removeEventListener('touchend',surRelachement);
        };
        const surDebut=function(event){
          actif=true;
          const point=event.touches?event.touches[0]:event;
          departX=point.clientX;
          departY=point.clientY;
          origineLeft=root.offsetLeft;
          origineTop=root.offsetTop;
          document.addEventListener('mousemove',surDeplacement);
          document.addEventListener('mouseup',surRelachement);
          document.addEventListener('touchmove',surDeplacement,{passive:false});
          document.addEventListener('touchend',surRelachement);
          if(event.cancelable)event.preventDefault();
        };
        poignee.addEventListener('mousedown',surDebut);
        poignee.addEventListener('touchstart',surDebut,{passive:false});
      }

      function retirerChromeTutorielV1_(){
        const ancienModal=document.getElementById('sorealIdleTutorielPagesModalV1');
        if(ancienModal)ancienModal.remove();
        const ancienFlottant=document.getElementById('sorealIdleTutorielFlottantV1');
        if(ancienFlottant)ancienFlottant.remove();
      }

      /*
       * Voix pré-générées (2026-09-24) : le texte LU par un panneau est construit ICI à partir des données (jamais relevé dans le DOM),
       * posé sur le panneau (data-soreal-tts-say) et réutilisé tel quel par cloudflare/tools/voice-generate.mjs via
       * window.__sorealVoiceTextesIdleV1__ : mêmes blocs de texte = mêmes fichiers audio. Les icônes, « Page n / N » et l'en-tête
       * « SOREAL IDLE » ne sont plus lus.
       */
      function pauseVoixIdleV1_(ms){
        return ' \uE000'+ms+'\uE001 ';
      }

      function texteVoixTutorielIdleV1_(page){
        return String(page&&page.titre||'')+pauseVoixIdleV1_(450)+
          (page&&page.sousTitre?String(page.sousTitre)+pauseVoixIdleV1_(450):'')+
          (Array.isArray(page&&page.paragraphes)?page.paragraphes:[]).join(' ');
      }

      function texteVoixNouveauteIdleV1_(info){
        return String(info&&info.titre||'')+pauseVoixIdleV1_(450)+
          [String(info&&info.intro||''),String(info&&info.texte||'')]
            .concat(Array.isArray(info&&info.bullets)?info.bullets:[])
            .filter(function(t){return String(t).trim();})
            .join(' ');
      }

      function infoMoneyPitIdleV1_(){
        return {
          icon:'🕳️',
          titre:'Money Pit & Roue journalière',
          intro:'Tu as débloqué un trou dans lequel jeter tout ton Or. Oui, tout. Excellente gestion financière.',
          menuCible:'moneyPit',
          libelleCible:'Ouvrir le Money Pit',
          bullets:[
            'Money Pit : avec au moins 100 000 Or, tu peux jeter TOUT l’Or que tu possèdes dans le puits. Plus la somme est énorme, plus le palier de récompenses possibles monte.',
            'Le puits te recrache un lot aléatoire selon le palier atteint, puis il doit se recharger avant le prochain lancer. Les lancers suivants du même run ont un temps de recharge plus long.',
            'Roue journalière : elle est accessible dans ce même menu. Quand elle est prête, fais-la tourner pour gagner un lot aléatoire, notamment de l’AP ou des graines.',
            'La roue revient sur un cycle de 24 heures. Plus tu accumules de tours au fil du temps, plus ses paliers de récompenses progressent.',
            'Repère visuel : le bouton Money Pit devient vert quand le puits est prêt, ou jaune quand la roue journalière est disponible.'
          ]
        };
      }

      /* Tous les textes d'explication connus d'avance (les systèmes dont la description vient des données du jeu restent en repli). */
      window.__sorealVoiceTextesIdleV1__=function(){
        const textes=[];
        [TUTORIEL_DEBUT_JEU_PAGES_V1,TUTORIEL_PREMIER_BOSS_PAGES_V1,TUTORIEL_AVENTURE_PAGES_V1].forEach(function(pages){
          pages.forEach(function(page){textes.push(texteVoixTutorielIdleV1_(page));});
        });
        const definitions=definitionsNouveautesIdleV75_();
        Object.keys(definitions).forEach(function(cle){textes.push(texteVoixNouveauteIdleV1_(definitions[cle]));});
        textes.push(texteVoixNouveauteIdleV1_(infoMoneyPitIdleV1_()));
        return textes;
      };

      function rendreTutorielPagesIdleV1_(){
        const etat=idleTutorielPagesEnCoursV1;
        if(!etat)return;

        const page=etat.pages[etat.index];
        const dernier=etat.index>=etat.pages.length-1;
        const premier=etat.index<=0;

        if(page.long){
          idlePopupBloqueCombatV102=true;
          retirerChromeTutorielV1_();

          const modal=document.createElement('div');
          modal.id='sorealIdleTutorielPagesModalV1';
          modal.className='soreal-idle-modal-backdrop-v63';
          document.body.appendChild(modal);

          modal.innerHTML=
            '<div class="soreal-idle-modal-card-v63" role="dialog" aria-modal="true" data-soreal-tts-say="'+idleHtml_(texteVoixTutorielIdleV1_(page))+'">'+
              '<div class="soreal-idle-modal-top-v63">'+
                '<div class="soreal-idle-modal-title-v63">'+
                  idleHtml_(page.titre||'')+
                  (page.sousTitre?' <span style="opacity:.7;font-weight:600">'+idleHtml_(page.sousTitre)+'</span>':'')+
                '</div>'+
              '</div>'+
              '<div class="soreal-idle-modal-body-v63">'+
                '<div class="soreal-idle-modal-info-v63">'+
                  (page.paragraphes||[]).map(function(p){
                    return '<div style="margin-bottom:10px">'+idleHtml_(p)+'</div>';
                  }).join('')+
                '</div>'+
              '</div>'+
              '<div class="soreal-idle-modal-actions-v63" style="grid-template-columns:1fr">'+
                '<button type="button" class="soreal-idle-modal-button-v63 '+(page.bouton?'jouer':'confirm')+'" onclick="window.__tutorielPagesNaviguerV1__(1)">'+idleHtml_(page.bouton||'Continuer ▶')+'</button>'+
              '</div>'+
            '</div>';
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-124 */
        idlePopupBloqueCombatV102=false;
        installerStyleTutoFlottantV1_();

        let root=document.getElementById('sorealIdleTutorielFlottantV1');
        const nouveau=!root;
        if(nouveau){
          retirerChromeTutorielV1_();
          root=document.createElement('div');
          root.id='sorealIdleTutorielFlottantV1';
          root.className='soreal-idle-tuto-flottant-v1';
          document.body.appendChild(root);
        }

        root.innerHTML=
          '<div class="soreal-idle-tuto-flottant-drag-v1"><span>⠿</span><span>SOREAL IDLE</span></div>'+
          '<div class="soreal-idle-tuto-flottant-titre-v1">'+idleHtml_(page.titre||'')+'</div>'+
          '<div class="soreal-idle-tuto-flottant-corps-v1">'+
            (page.paragraphes||[]).map(function(p){
              return '<div style="margin-bottom:8px">'+idleHtml_(p)+'</div>';
            }).join('')+
          '</div>'+
          '<div class="soreal-idle-tuto-flottant-actions-v1">'+
            '<button type="button" '+(premier?'disabled':'')+' onclick="window.__tutorielPagesNaviguerV1__(-1)">◀ Précédent</button>'+
            '<button type="button" onclick="window.__tutorielPagesFermerV1__()">'+(dernier?'Terminé ✔':'Passer')+'</button>'+
            (
              (dernier&&page.seulementPrecedent)
                ?'<button type="button" class="confirm" onclick="window.__tutorielPagesFermerV1__()">Terminé ✔</button>'
                :'<button type="button" class="confirm" '+(dernier?'disabled style="visibility:hidden"':'')+' onclick="window.__tutorielPagesNaviguerV1__(1)">Suivant ▶</button>'
            )+
          '</div>';

        root.setAttribute('data-soreal-tts-say',texteVoixTutorielIdleV1_(page));

        if(nouveau){
          positionnerTutoFlottantV1_(root);
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-125 */
        activerGlisserTutoFlottantV1_(root);
      }

      function demarrerTutorielPagesIdleV1_(pages,cle){
        if(!Array.isArray(pages)||!pages.length)return;
        if(idleTutorielPagesDejaVuV1_(cle))return;

        idleTutorielPagesEnCoursV1={pages:pages,index:0,cle:cle};

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-126 */
        if(pages[0]&&pages[0].long&&idleEtat&&idleEtat.combatBossActif){
          idleEtat.combatBossActif=false;
          idleVictoireBossLocaleV49=false;
          definirCombatBossIdleV39_(false);
        }

        rendreTutorielPagesIdleV1_();
      }

      function tutorielPagesNaviguerV1_(delta){
        const etat=idleTutorielPagesEnCoursV1;
        if(!etat)return;

        etat.index=Math.max(0,Math.min(etat.pages.length-1,etat.index+delta));
        rendreTutorielPagesIdleV1_();
      }

      function tutorielPagesFermerV1_(){
        const etat=idleTutorielPagesEnCoursV1;
        if(etat)idleTutorielPagesMarquerVuV1_(etat.cle);

        retirerChromeTutorielV1_();
        idleTutorielPagesEnCoursV1=null;

        if(!idlePopupQueueV75.length){
          idlePopupBloqueCombatV102=false;
        }

        setTimeout(afficherProchainePopupIdleV75_,120);
      }

      window.__tutorielPagesNaviguerV1__=tutorielPagesNaviguerV1_;
      window.__tutorielPagesFermerV1__=tutorielPagesFermerV1_;


      function afficherProchainePopupIdleV75_(){
        if(
          idlePopupActifV75 ||
          !idlePopupQueueV75.length
        ){
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-127 */
        idlePopupBloqueCombatV102=true;

        if(
          idleEtat &&
          idleEtat.combatBossActif
        ){
          idleEtat.combatBossActif=false;
          idleVictoireBossLocaleV49=false;

          definirCombatBossIdleV39_(
            false
          );

          setTimeout(
            afficherProchainePopupIdleV75_,
            70
          );

          return;
        }

        if(
          document.querySelector(
            '.soreal-idle-modal-backdrop-v63'
          )
        ){
          setTimeout(
            afficherProchainePopupIdleV75_,
            250
          );
          return;
        }

        const info=
          idlePopupQueueV75.shift();

        if(!info){
          return;
        }

        idlePopupActifV75=true;

        const modal=
          document.createElement('div');

        modal.id=
          'sorealIdleNouveauteModalV75';

        modal.className=
          'soreal-idle-modal-backdrop-v63';

        modal.innerHTML=
          '<div class="soreal-idle-modal-card-v63" role="dialog" aria-modal="true" data-soreal-tts-say="'+idleHtml_(texteVoixNouveauteIdleV1_(info))+'">'+
            '<div class="soreal-idle-modal-top-v63">'+
              '<div class="soreal-idle-modal-icon-v63">'+
                idleHtml_(info.icon||'✨')+
              '</div>'+
              '<div class="soreal-idle-modal-title-v63">'+
                idleHtml_(info.titre||'Nouveauté')+
              '</div>'+
              '<div class="soreal-idle-modal-gain-v63">'+
                idleHtml_(info.intro||'')+
              '</div>'+
            '</div>'+
            '<div class="soreal-idle-modal-body-v63">'+
              '<div class="soreal-idle-modal-info-v63">'+
                (
                  info.texte
                    ?'<div>'+idleHtml_(info.texte)+'</div>'
                    :''
                )+
                (
                  Array.isArray(info.bullets)
                    ?'<div class="soreal-idle-news-bullets-v75">'+
                      info.bullets.map(
                        function(texte){
                          return '<div class="soreal-idle-news-bullet-v75">'+
                            idleHtml_(texte)+
                            '</div>';
                        }
                      ).join('')+
                      '</div>'
                    :''
                )+
              '</div>'+
            '</div>'+
            '<div class="soreal-idle-modal-actions-v63" style="grid-template-columns:'+
              (
                info.menuCible
                  ?'1fr 1fr'
                  :'1fr'
              )+
              '">'+
              '<button type="button" class="soreal-idle-modal-button-v63 cancel" onclick="window.__fermerPopupNouveauteIdleV75__()">'+
                idleHtml_(info.bouton||'Continuer')+
              '</button>'+
              (
                info.menuCible
                  ?'<button type="button" class="soreal-idle-modal-button-v63 confirm" onclick="window.__allerDepuisPopupNouveauteIdleV106__(\''+
                    idleHtml_(info.menuCible)+
                    '\')">'+
                    idleHtml_(
                      info.libelleCible||
                      'Voir la nouveauté'
                    )+
                    '</button>'
                  :''
              )+
            '</div>'+
          '</div>';

        document.body.appendChild(modal);
      }


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-128 */
      function gererPopupsProgressionIdleV75_(j){
        if(!j)return;

        const cle='soreal_idle_bienvenue_v75_'+generationJoueurIdleV75_(j);

        idleVusMigrerLocalV1_(j);

        if(idleTutorielPagesDejaVuLocalV1_(cle)||idleVuConnuV1_(j,'bienvenue'))return;

        try{
          localStorage.setItem(cle,JSON.stringify(true));
        }catch(e){}
        idleVuMarquerV1_('bienvenue');

        if(!Boolean(j&&j.profil&&j.profil.nouveauJoueur))return;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-129 */
        demarrerTutorielPagesIdleV1_(
          TUTORIEL_DEBUT_JEU_PAGES_V1,
          'soreal_idle_tutoriel_debut_v1_'+cle
        );
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-130 */
      function gererTutorielPremierBossIdleV1_(j){
        if(!j)return;
        if(!(idleEntier_(j.bossVaincus)>=1))return;

        demarrerTutorielPagesIdleV1_(
          TUTORIEL_PREMIER_BOSS_PAGES_V1,
          'soreal_idle_tutoriel_premier_boss_v1_'+generationJoueurIdleV75_(j)
        );
      }


      window.__fermerPopupNouveauteIdleV75__=
        fermerPopupNouveauteIdleV75_;


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-131 */
      const IDLE_NAV_COULEURS_V1={
        entrainement:'#3b82f6',
        combat:'#ef4444',
        aventure:'#22c55e',
        bestiaire:'#14b8a6',
        renaissance:'#a855f7',
        augmentations:'#6366f1',
        avance:'#0ea5e9',
        machine:'#06b6d4',
        sang:'#dc2626',
        wandoos:'#64748b',
        ngu:'#8b5cf6',
        yggdrasil:'#10b981',
        moneyPit:'#b45309',
        diggers:'#eab308',
        beards:'#f97316',
        tower:'#78716c',
        perks:'#facc15',
        challenges:'#f43f5e',
        titans:'#b91c1c',
        macguffins:'#ec4899',
        daycare:'#84cc16',
        questing:'#d97706',
        quirks:'#d946ef',
        hacks:'#059669',
        wishes:'#c084fc',
        cards:'#e11d48',
        cooking:'#c2410c',
        sellout:'#8b5cf6',
        spendExp:'#0891b2',
        setsZones:'#0d9488',
        parametres:'#6b7280'
      };

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-132 */
      const IDLE_MENUS_V1=[
        {id:'entrainement',icon:'🥊',nom:'Basic Training'},
        {id:'augmentations',icon:'🦾',nom:'Augmentations'},
        {id:'combat',icon:'⚔️',nom:'Fight Boss'},
        {id:'aventure',icon:'🗺️',nom:'Adventure'},
        {id:'moneyPit',icon:'🕳️',nom:'Money Pit'},
        {id:'bestiaire',icon:'🏆',nom:'Collection'},
        {id:'renaissance',icon:'♻️',nom:'Rebirth'},
        {id:'avance',icon:'🏋️',nom:'Advanced Training'},
        {id:'machine',icon:'⏱️',nom:'Time Machine'},
        {id:'sang',icon:'🩸',nom:'Blood Magic'},
        {id:'wandoos',icon:'💻',nom:'Wandoos'},
        {id:'ngu',icon:'♾️',nom:'NGU'},
        {id:'yggdrasil',icon:'🌱',nom:'Yggdrasil'},
        {id:'diggers',icon:'⛏️',nom:'Gold Diggers'},
        {id:'beards',icon:'🧔',nom:'Beards'},
        {id:'tower',icon:'🏢',nom:'ITOPOD'},
        {id:'perks',icon:'⭐',nom:'Perks'},
        {id:'challenges',icon:'🏁',nom:'Challenges'},
        {id:'titans',icon:'👹',nom:'Titans'},
        {id:'macguffins',icon:'🧩',nom:'MacGuffins'},
        {id:'daycare',icon:'🛠️',nom:'Item Daycare'},
        {id:'questing',icon:'📋',nom:'Questing'},
        {id:'quirks',icon:'📚',nom:'Quirks'},
        {id:'hacks',icon:'🧪',nom:'Hacks'},
        {id:'wishes',icon:'🌠',nom:'Wishes'},
        {id:'cards',icon:'🃏',nom:'Cards'},
        {id:'cooking',icon:'🍲',nom:'Cooking'},
        {id:'succes',icon:'🎖️',nom:'Achievements'},
        {id:'spendExp',icon:'✨',nom:'EXP Shop'},
        {id:'sellout',icon:'🛍️',nom:'Boutique AP'},
        {id:'parametres',icon:'⚙️',nom:'Settings'}
      ];

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-133 */
      let idleAdventureKoAlertV1=false;

      function idleCouleurMoneyPitNavV1_(j){
        const pit=systemeMetaParIdIdleV130_(j,'moneyPit');
        const pitData=pit&&pit.state&&pit.state.data||null;
        const gold=idleNombre_(
          j&&j.systemes&&j.systemes.currencies&&j.systemes.currencies.gold
        );
        const pitPret=Boolean(
          pit&&pit.unlock&&pit.unlock.unlocked&&
          pitData&&
          gold>=100000&&
          Date.now()>=Number(pitData.nextAt||0)
        );
        if(pitPret)return '#2ecc71';

        const roue=systemeMetaParIdIdleV130_(j,'dailySpin');
        const roueData=roue&&roue.state&&roue.state.data||null;
        const rouePrete=Boolean(
          roue&&roue.unlock&&roue.unlock.unlocked&&
          roueData&&
          Date.now()>=Number(roueData.readyAt||0)
        );
        if(rouePrete)return '#f1c40f';

        return null;
      }

      function navigationIdleV28_(j){
        const menus=IDLE_MENUS_V1;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-134 */
        const menusVisibles=menus.filter(function(m){
          return menuDisponibleIdleV28_(m.id,j);
        });

        return `
          <div class="soreal-idle-nav-v28">
            ${menusVisibles.map(function(m){

              const nouveau=!idleMenuEstAcquisV1_(j,m.id);
              const couleurDisponibilite=m.id==='moneyPit'?idleCouleurMoneyPitNavV1_(j):null;
              const classeAlerteAventure=
                m.id==='aventure'&&idleAdventureKoAlertV1&&idleMenuActifV28!=='aventure'
                  ?' soreal-idle-nav-adventure-ko-v1':'';
              const classeMoneyPit=
                m.id==='moneyPit'&&couleurDisponibilite
                  ?(couleurDisponibilite==='#f1c40f'?' soreal-idle-nav-money-yellow-v1':' soreal-idle-nav-money-green-v1')
                  :'';
              /* Yggdrasil Harvest Light (Sellout Shop) : même lueur verte que le Money Pit quand un fruit est prêt (serveur : yggExtra.harvestLight.lit). */
              const yggExtraNav=j&&j.systemes&&j.systemes.yggExtra;
              const classeRecolteYgg=
                m.id==='yggdrasil'&&yggExtraNav&&yggExtraNav.harvestLight&&yggExtraNav.harvestLight.lit
                  ?' soreal-idle-nav-money-green-v1':'';

              return `
                <button
                  type="button"
                  class="soreal-idle-nav-button-v28${
                    idleMenuActifV28===m.id
                      ?' active'
                      :''
                  }${
                    nouveau
                      ?' soreal-idle-nav-new-v1'
                      :''
                  }${classeAlerteAventure}${classeMoneyPit}${classeRecolteYgg}"
                  style="--nav-color:${
                    couleurDisponibilite||IDLE_NAV_COULEURS_V1[m.id]||'#9aa5bb'
                  }"
                  onclick="window.__menuIdleV28__('${m.id}')"
                >
                  ${m.icon} ${m.nom}
                </button>
              `;
            }).join('')}
          </div>
        `;
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-135 */
      let idleSwipeDebutXV1=null;
      let idleSwipeDebutYV1=null;

      function menusVisiblesIdleV1_(j){
        return IDLE_MENUS_V1.filter(function(m){
          return menuDisponibleIdleV28_(m.id,j);
        }).map(function(m){return m.id;});
      }

      function naviguerSwipeIdleV1_(direction){
        if(!idleEtat)return;
        const visibles=menusVisiblesIdleV1_(idleEtat);
        if(visibles.length<2)return;
        const indexActuel=visibles.indexOf(idleMenuActifV28);
        const base=indexActuel===-1?0:indexActuel;
        const suivant=(base+direction+visibles.length)%visibles.length;
        menuIdleV28_(visibles[suivant]);
      }

      function initialiserSwipeNavigationIdleV1_(){
        if(document.body.dataset.idleSwipeBoundV1==='1')return;
        document.body.dataset.idleSwipeBoundV1='1';

        document.addEventListener('touchstart',function(e){
          const cible=e.target&&e.target.closest&&e.target.closest('.soreal-idle-native-v4');
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-136 */
          const surBarreNav=e.target&&e.target.closest&&e.target.closest('.soreal-idle-nav-v28');
          const surInteractionInventaireV180=
            e.target&&
            e.target.closest&&
            e.target.closest(
              '.soreal-idle-v138-bag-card[data-item-id],'+
              '.soreal-idle-v138-slot[data-occupant-id],'+
              '.soreal-idle-item-popup-v1'
            );
          if(!cible||surBarreNav||surInteractionInventaireV180||!e.touches||e.touches.length!==1){
            idleSwipeDebutXV1=null;
            idleSwipeDebutYV1=null;
            return;
          }
          idleSwipeDebutXV1=e.touches[0].clientX;
          idleSwipeDebutYV1=e.touches[0].clientY;
        },{passive:true});

        document.addEventListener('touchend',function(e){
          if(idleSwipeDebutXV1==null)return;
          const fin=e.changedTouches&&e.changedTouches[0];
          const debutX=idleSwipeDebutXV1,debutY=idleSwipeDebutYV1;
          idleSwipeDebutXV1=null;
          idleSwipeDebutYV1=null;
          if(!fin)return;

          const dx=fin.clientX-debutX;
          const dy=fin.clientY-debutY;

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-137 */
          if(Math.abs(dx)<60||Math.abs(dx)<Math.abs(dy)*1.5)return;

          naviguerSwipeIdleV1_(dx<0?1:-1);
        },{passive:true});
      }


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-138 */
      function entetePageIdleV28_(
        titre,
        sousTitre
      ){
        return `
          <div class="soreal-idle-page-head-v28">
            <div class="soreal-idle-page-title-v28">
              ${titre}
            </div>
            ${sousTitre ? `
            <div class="soreal-idle-page-sub-v28">
              ${sousTitre}
            </div>
            ` : ''}
          </div>
        `;
      }


      function formatGrandNombreIdleV70_(valeur,decimales){
        const api=window.__SOREAL_IDLE_NUMBER_FORMAT_V1__;
        return api&&typeof api.grandNombre==='function'
          ?api.grandNombre(valeur,decimales)
          :String(Math.round(idleNombre_(valeur)));
      }

      function barreXpIdleV70_(
        j
      ){
        const xp=
          Math.max(
            0,
            idleNombre_(
              j&&j.xp
            )
          );

        const requis=
          Math.max(
            1,
            idleNombre_(
              j&&j.xpRequise
            )
          );

        const pct=
          Math.max(
            0,
            Math.min(
              100,
              xp/requis*100
            )
          );

        return `
          <div class="soreal-idle-xp-panel-v70">
            <div class="soreal-idle-xp-head-v70">
              <span>
                ⭐ EXPÉRIENCE · Niveau
                <strong id="sorealIdleXpNiveauV70">${idleEntier_(j&&j.niveau)}</strong>
              </span>

              <span id="sorealIdleXpTexteV70">
                ${formatGrandNombreIdleV70_(xp)}
                / ${formatGrandNombreIdleV70_(requis)} XP
              </span>
            </div>

            <div class="soreal-idle-xp-track-v70">
              <div
                id="sorealIdleXpFillV70"
                class="soreal-idle-xp-fill-v70"
                style="width:${pct}%"
              ></div>
            </div>
          </div>
        `;
      }


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-139 */
      let idleAdventureLogV1=[];
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-140 */
      let idleAdventureLogAutoScrollV1_=true;
      let idleAdventureLogScrollMemoV1_=0;
      let idleAdventureLogResumeTimerV1_=null;
      const IDLE_ADVENTURE_LOG_RESUME_MS_V1=6000;

      function ajouterLogAventureIdleV1_(type,texte,rareteClasse){
        const classe=String(rareteClasse||'');
        idleAdventureLogV1.push({
          type:String(type||'system'),
          texte:String(texte||''),
          rareteClasse:/^idle-loot-rarity-[0-6]$/.test(classe)?classe:''
        });
        if(idleAdventureLogV1.length>80){
          idleAdventureLogV1.splice(0,idleAdventureLogV1.length-80);
        }
        dessinerJournalAventureIdleV1_();
      }
      function dessinerJournalAventureIdleV1_(){
        const host=document.getElementById('sorealIdleAdventureLogV1');
        if(!host)return;
        attacherEcouteurScrollJournalAventureIdleV1_(host);
        host.innerHTML=idleAdventureLogV1.length
          ?idleAdventureLogV1.map(function(l){
              return '<div class="soreal-idle-adventure-log-line-v1 '+idleHtml_(l.type)+(l.rareteClasse?' '+idleHtml_(l.rareteClasse):'')+'">'+idleHtml_(l.texte)+'</div>';
            }).join('')
          :'<div class="soreal-idle-adventure-log-line-v1 system">Le journal commencera au prochain combat.</div>';
        if(idleAdventureLogAutoScrollV1_)host.scrollTop=host.scrollHeight;
      }

      function gererScrollJournalAventureIdleV1_(event){
        const host=event&&event.currentTarget;
        if(!host)return;
        const enBas=journalCombatEstEnBasV70_(host);
        idleAdventureLogAutoScrollV1_=enBas;
        idleAdventureLogScrollMemoV1_=host.scrollTop;

        clearTimeout(idleAdventureLogResumeTimerV1_);
        if(!enBas){
          idleAdventureLogResumeTimerV1_=setTimeout(function(){
            idleAdventureLogAutoScrollV1_=true;
            const hostActuel=document.getElementById('sorealIdleAdventureLogV1');
            if(hostActuel)hostActuel.scrollTop=hostActuel.scrollHeight;
          },IDLE_ADVENTURE_LOG_RESUME_MS_V1);
        }
      }

      function attacherEcouteurScrollJournalAventureIdleV1_(host){
        if(!host||host.dataset.idleScrollBoundV1==='1')return;
        host.dataset.idleScrollBoundV1='1';
        host.addEventListener('scroll',gererScrollJournalAventureIdleV1_,{passive:true});
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-141 */
      function restaurerScrollJournalAventureIdleV1_(){
        const host=document.getElementById('sorealIdleAdventureLogV1');
        if(!host)return;
        attacherEcouteurScrollJournalAventureIdleV1_(host);
        host.scrollTop=idleAdventureLogAutoScrollV1_
          ?host.scrollHeight
          :Math.min(idleAdventureLogScrollMemoV1_,host.scrollHeight);
      }

      let idleCombatLogV70=[];
      let idleCombatLogBossV70='';
      let idleCombatLogDernierResumeV70=0;
      let idleCombatLogDegatsJoueurV70=0;
      let idleCombatLogDegatsBossV70=0;
      let idleCombatLogDegatsBrutsV100=0;
      let idleCombatLogBloquesV70=0;
      let idleCombatLogCritiquesJoueurV117=0;
      let idleCombatLogCritiquesBossV117=0;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-142 */
      let idleCombatLogAutoScrollV70_=true;
      let idleCombatLogScrollMemoV70_=0;
      let idleBossSpecialNextV70={};
      let idleParalysieJusquaV70=0;
      let idleBouclierJusquaV70=0;
      let idleBouclierReductionV70=0;
      let idleFureurActiveV70=false;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-143 */
      const idleEffetsVisuelsJoueurV112={
        gel:0,
        feu:0,
        poison:0,
        stun:0
      };
      let idleEffetsSignatureV112='';


      function normaliserTypeEffetJoueurIdleV112_(type){const api=window.__SOREAL_IDLE_TEXT_HELPERS_V1__;return api&&typeof api.normaliserEffet==='function'?api.normaliserEffet(type):'';}


      function activerEffetVisuelJoueurIdleV112_(
        type,
        dureeSec,
        finMs
      ){
        const normalise=
          normaliserTypeEffetJoueurIdleV112_(
            type
          );

        if(!normalise)return;

        const maintenant=Date.now();
        const fin=
          Math.max(
            maintenant,
            idleNombre_(finMs) ||
            (
              maintenant+
              Math.max(
                0,
                idleNombre_(dureeSec)
              )*1000
            )
          );

        if(normalise==='paralysie'){
          idleParalysieJusquaV70=
            Math.max(
              idleParalysieJusquaV70,
              fin
            );
          return;
        }

        if(normalise==='bouclier'){
          return;
        }

        idleEffetsVisuelsJoueurV112[normalise]=
          Math.max(
            idleNombre_(
              idleEffetsVisuelsJoueurV112[normalise]
            ),
            fin
          );
      }


      function reinitialiserEffetsVisuelsJoueurIdleV112_(){
        Object.keys(
          idleEffetsVisuelsJoueurV112
        ).forEach(function(type){
          idleEffetsVisuelsJoueurV112[type]=0;
        });

        idleEffetsSignatureV112='';

        const fx=
          document.getElementById(
            'sorealIdlePlayerStatusFxV112'
          );
        const badges=
          document.getElementById(
            'sorealIdlePlayerStatusBadgesV112'
          );

        if(fx)fx.innerHTML='';
        if(badges)badges.innerHTML='';
      }


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
          idleEtat&&
          idleEtat.magie&&
          idleEtat.magie.effets
            ?idleEtat.magie.effets
            :{};

        const immuniseParalysie=
          maintenant<
          idleNombre_(
            effetsMagie.immuniteParalysieJusqua
          );

        const actifs=[];

        if(
          !immuniseParalysie &&
          maintenant<idleParalysieJusquaV70
        ){
          actifs.push({
            type:'paralysie',
            emoji:'⚡',
            nom:'Paralysé',
            fin:idleParalysieJusquaV70
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
              idleEffetsVisuelsJoueurV112[def[0]]
            );

          if(maintenant<fin){
            actifs.push({
              type:def[0],
              emoji:def[1],
              nom:def[2],
              fin:fin
            });
          }else if(fin>0){
            idleEffetsVisuelsJoueurV112[def[0]]=0;
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

        if(signature===idleEffetsSignatureV112){
          return;
        }

        idleEffetsSignatureV112=signature;

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


      function formatNombreCombatIdleV100_(valeur){
        const api=window.__SOREAL_IDLE_NUMBER_FORMAT_V1__;
        return api&&typeof api.combat==='function'
          ?api.combat(valeur)
          :String(Math.round(Math.max(0,idleNombre_(valeur))));
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


      function tempsLogIdleV70_(){
        const d=new Date();

        return String(
          d.getHours()
        ).padStart(2,'0')+
        ':'+
        String(
          d.getMinutes()
        ).padStart(2,'0')+
        ':'+
        String(
          d.getSeconds()
        ).padStart(2,'0');
      }


      function ajouterLogCombatIdleV70_(
        type,
        texte
      ){
        idleCombatLogV70.push({
          type:
            String(type||'system'),
          texte:
            String(texte||''),
          heure:
            tempsLogIdleV70_()
        });

        if(idleCombatLogV70.length>160){
          idleCombatLogV70.splice(
            0,
            idleCombatLogV70.length-160
          );
        }

        dessinerJournalCombatIdleV70_();
      }


      function viderJournalCombatIdleV70_(){
        idleCombatLogV70=[];
        idleCombatLogAutoScrollV70_=true;
        idleCombatLogScrollMemoV70_=0;
        dessinerJournalCombatIdleV70_();
      }


      function journalCombatEstEnBasV70_(
        host
      ){
        const SEUIL_PX=24;

        return (
          host.scrollHeight-
          host.scrollTop-
          host.clientHeight
        )<SEUIL_PX;
      }


      function gererScrollJournalCombatIdleV70_(
        event
      ){
        const host=
          event&&event.currentTarget;

        if(!host)return;

        idleCombatLogAutoScrollV70_=
          journalCombatEstEnBasV70_(
            host
          );

        idleCombatLogScrollMemoV70_=
          host.scrollTop;
      }


      function attacherEcouteurScrollJournalCombatIdleV70_(
        host
      ){
        if(
          !host ||
          host.dataset.idleScrollBoundV70==='1'
        ){
          return;
        }

        host.dataset.idleScrollBoundV70='1';

        host.addEventListener(
          'scroll',
          gererScrollJournalCombatIdleV70_,
          {passive:true}
        );
      }


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-145 */
      function restaurerScrollJournalCombatIdleV70_(){
        const host=
          document.getElementById(
            'sorealIdleCombatLogBodyV70'
          );

        if(!host)return;

        attacherEcouteurScrollJournalCombatIdleV70_(
          host
        );

        if(idleCombatLogAutoScrollV70_){
          host.scrollTop=
            host.scrollHeight;
        }else{
          host.scrollTop=
            Math.min(
              idleCombatLogScrollMemoV70_,
              host.scrollHeight
            );
        }
      }


      function dessinerJournalCombatIdleV70_(){
        const host=
          document.getElementById(
            'sorealIdleCombatLogBodyV70'
          );

        if(!host)return;

        host.innerHTML=
          idleCombatLogV70.length
            ?idleCombatLogV70.map(
                function(ligne){
                  return (
                    '<div class="soreal-idle-combat-log-line-v70 '+
                    idleHtml_(
                      ligne.type
                    )+
                    '">'+
                    '<span style="opacity:.55">['+
                    idleHtml_(
                      ligne.heure
                    )+
                    ']</span> '+
                    idleHtml_(
                      ligne.texte
                    )+
                    '</div>'
                  );
                }
              ).join('')
            :'<div class="soreal-idle-combat-log-line-v70 system">Le journal commencera au lancement du combat.</div>';

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-146 */
        attacherEcouteurScrollJournalCombatIdleV70_(
          host
        );

        if(idleCombatLogAutoScrollV70_){
          host.scrollTop=
            host.scrollHeight;
        }
      }


      window.__viderJournalCombatIdleV70__=
        viderJournalCombatIdleV70_;


      function journalCombatMarkupIdleV70_(){
        return `
          <div class="soreal-idle-combat-log-v70">
            <div class="soreal-idle-combat-log-head-v70">
              <span>📜 Journal de combat</span>
              <button
                type="button"
                class="soreal-idle-log-clear-v70"
                onclick="window.__viderJournalCombatIdleV70__()"
              >Effacer</button>
            </div>

            <div
              id="sorealIdleCombatLogBodyV70"
              class="soreal-idle-combat-log-body-v70"
            >
              ${
                idleCombatLogV70.length
                  ?idleCombatLogV70.map(
                      function(ligne){
                        return (
                          '<div class="soreal-idle-combat-log-line-v70 '+
                          idleHtml_(ligne.type)+
                          '">'+
                          '<span style="opacity:.55">['+
                          idleHtml_(ligne.heure)+
                          ']</span> '+
                          idleHtml_(ligne.texte)+
                          '</div>'
                        );
                      }
                    ).join('')
                  :'<div class="soreal-idle-combat-log-line-v70 system">Le journal commencera au lancement du combat.</div>'
              }
            </div>
          </div>
        `;
      }


      function labelCapaciteBossIdleV70_(
        capacite
      ){
        const c=
          capacite||{};

        const type=
          String(
            c.type||''
          ).toLowerCase();

        if(type==='regen'){
          return '💚 Régénération · '+
            idleNombre_(c.valeur)+
            '% / '+
            idleNombre_(c.intervalle)+
            ' s';
        }

        if(type==='paralysie'){
          return '⚡ Paralysie · '+
            idleNombre_(c.duree)+
            ' s / '+
            idleNombre_(c.intervalle)+
            ' s';
        }

        if(type==='bouclier'){
          return '🛡️ Bouclier · -'+
            idleNombre_(c.valeur)+
            '% pendant '+
            idleNombre_(c.duree)+
            ' s';
        }

        if(type==='fureur'){
          return '🔥 Fureur · +'+
            idleNombre_(c.valeur)+
            '% attaque sous 30 % ❤️';
        }

        if(type==='sceau'){
          return '🔒 Sceau · -'+
            idleNombre_(c.valeur)+
            '% dégâts jusqu’à Rupture SOREAL';
        }

        const effetJoueur=
          normaliserTypeEffetJoueurIdleV112_(
            type
          );

        if(effetJoueur==='gel'){
          return '❄️ Gel · '+idleNombre_(c.duree)+' s';
        }
        if(effetJoueur==='feu'){
          return '🔥 Brûlure · '+idleNombre_(c.duree)+' s';
        }
        if(effetJoueur==='poison'){
          return '☠️ Poison · '+idleNombre_(c.duree)+' s';
        }
        if(effetJoueur==='stun'){
          return '💫 Étourdissement · '+idleNombre_(c.duree)+' s';
        }

        return '✨ '+String(c.type||'Capacité');
      }


      /* Notes de déblocage « (…) » en tête d'une histoire de boss + récit. Même découpage pour l'affichage et pour la voix pré-générée
         (cloudflare/tools/voice-generate.mjs recopie ce motif : un test compare les deux). */
      function separerNotesHistoireBossIdleV1_(histoire){
        const notes=[];
        let narration=String(histoire||'').trim();
        for(;;){
          const infoMatch=narration.match(/^\(([^\n]+)\)[ \t]*(?:\n|$)\s*/);
          if(!infoMatch)break;
          notes.push('('+String(infoMatch[1]||'').trim()+')');
          narration=narration.slice(infoMatch[0].length).trim();
        }
        return {notes:notes,narration:narration};
      }

      function histoireBossMarkupIdleV142_(
        j
      ){
        const histoire=
          String(
            j&&j.bossHistoire||''
          ).trim();

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-147 */
        if(!histoire){
          return '';
        }

        const nomBoss=
          String(
            j&&j.bossActuel||'Boss'
          ).trim();

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-148 */
        /*
         * 2026-09-24 (Norman) : TOUS les paragraphes du début qui sont entre parenthèses sont des notes sur le jeu (déblocage d'une
         * fonctionnalité, d'une zone...), pas sur le boss : chacun prend la mise en page « note » (avant, seul le premier
         * paragraphe la recevait et les suivants finissaient dans le récit).
         */
        const separe=separerNotesHistoireBossIdleV1_(histoire);
        const notesDeblocage=separe.notes;
        const narration=separe.narration;

        return `
          <div id="sorealIdleBossChroniqueV206" class="soreal-idle-boss-lore-v142">
            <div class="soreal-idle-boss-lore-title-v168" data-soreal-tts-pause="450">Chronique du boss</div>
            <div class="soreal-idle-boss-lore-name-v184" data-soreal-tts-pause="1100">${idleHtml_(nomBoss)}</div>
            <div class="soreal-idle-boss-lore-ornament-v184" data-soreal-tts-ignore>✦ ❦ ✦</div>
            ${notesDeblocage.map(function(note){
              return '<div class="soreal-idle-boss-lore-info-v198" data-soreal-tts-pause="700">'+idleHtml_(note)+'</div>';
            }).join('')}
            ${narration
              ?'<div class="soreal-idle-boss-lore-histoire-v142">'+idleHtml_(narration)+'</div>'
              :''}
            <button type="button" class="soreal-idle-tts-read-v203" data-soreal-tts-target="sorealIdleBossChroniqueV206">🔊 Lire la chronique</button>
          </div>
        `;
      }


      function capacitesBossMarkupIdleV70_(
        j
      ){
        const caps=
          Array.isArray(
            j&&j.bossCapacites
          )
            ?j.bossCapacites
            :[];

        if(!caps.length){
          return '';
        }

        return `
          <div class="soreal-idle-boss-skills-v70">
            ${caps.map(
              function(c){
                return (
                  '<span class="soreal-idle-boss-skill-chip-v70">'+
                  idleHtml_(
                    labelCapaciteBossIdleV70_(c)
                  )+
                  '</span>'
                );
              }
            ).join('')}
          </div>
        `;
      }


      function preparerCapacitesBossIdleV70_(
        forceReset
      ){
        if(!idleEtat)return;

        const boss=
          String(
            idleEtat.bossActuel||''
          );

        if(
          !forceReset &&
          idleCombatLogBossV70===boss
        ){
          return;
        }

        idleCombatLogBossV70=boss;
        idleBossSpecialNextV70={};
        idleParalysieJusquaV70=0;
        idleBouclierJusquaV70=0;
        idleBouclierReductionV70=0;
        idleFureurActiveV70=false;

        reinitialiserEffetsVisuelsJoueurIdleV112_();

        const now=
          Date.now();

        const caps=
          Array.isArray(
            idleEtat.bossCapacites
          )
            ?idleEtat.bossCapacites
            :[];

        caps.forEach(
          function(cap,index){
            if(
              idleNombre_(
                cap.intervalle
              )>0
            ){
              idleBossSpecialNextV70[
                index
              ]=
                now+
                idleNombre_(
                  cap.intervalle
                )*
                1000;
            }
          }
        );
      }


      function multiplicateurFureurLocaleIdleV70_(){
        if(!idleEtat)return 1;

        const caps=
          Array.isArray(
            idleEtat.bossCapacites
          )
            ?idleEtat.bossCapacites
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


      function traiterCapacitesBossLocalesIdleV70_(
        maintenant
      ){
        if(
          !idleEtat ||
          !idleEtat.combatBossActif
        ){
          return;
        }

        preparerCapacitesBossIdleV70_(
          false
        );

        const caps=
          Array.isArray(
            idleEtat.bossCapacites
          )
            ?idleEtat.bossCapacites
            :[];

        const pvMax=
          Math.max(
            1,
            idleNombre_(
              idleEtat.bossPvMax
            )
          );

        const pct=
          idleNombre_(
            idleEtat.bossPv
          )/
          pvMax*
          100;

        if(
          pct<=30 &&
          !idleFureurActiveV70 &&
          caps.some(
            function(c){
              return String(
                c.type||''
              ).toLowerCase()==='fureur';
            }
          )
        ){
          idleFureurActiveV70=true;

          ajouterLogCombatIdleV70_(
            'skill',
            '🔥 '+
            String(
              idleEtat.bossActuel||'Boss'
            )+
            ' entre en FUREUR !'
          );
        }

        caps.forEach(
          function(cap,index){
            const type=
              String(
                cap.type||''
              ).toLowerCase();

            if(
              type==='fureur' ||
              idleNombre_(
                cap.intervalle
              )<=0
            ){
              return;
            }

            const prochain=
              idleBossSpecialNextV70[index]||
              (
                maintenant+
                idleNombre_(
                  cap.intervalle
                )*
                1000
              );

            if(maintenant<prochain){
              idleBossSpecialNextV70[index]=
                prochain;
              return;
            }

            idleBossSpecialNextV70[index]=
              maintenant+
              idleNombre_(
                cap.intervalle
              )*
              1000;

            if(type==='regen'){
              const soin=
                pvMax*
                Math.max(
                  0,
                  idleNombre_(
                    cap.valeur
                  )
                )/
                100;

              const avant=
                idleNombre_(
                  idleEtat.bossPv
                );

              idleEtat.bossPv=
                Math.min(
                  pvMax,
                  avant+
                  soin
                );

              const reel=
                Math.max(
                  0,
                  idleEtat.bossPv-
                  avant
                );

              if(reel>0){
                ajouterLogCombatIdleV70_(
                  'skill',
                  '💚 '+
                  String(
                    idleEtat.bossActuel||'Boss'
                  )+
                  ' régénère '+
                  formatGrandNombreIdleV70_(
                    reel
                  )+
                  ' ❤️.'
                );
              }
            }

            if(type==='paralysie'){
              idleParalysieJusquaV70=
                Math.max(
                  idleParalysieJusquaV70,
                  maintenant+
                  Math.max(
                    0,
                    idleNombre_(
                      cap.duree
                    )
                  )*
                  1000
                );

              activerEffetVisuelJoueurIdleV112_(
                'paralysie',
                cap.duree,
                idleParalysieJusquaV70
              );

              ajouterLogCombatIdleV70_(
                'skill',
                '⚡ '+
                String(
                  idleEtat.bossActuel||'Boss'
                )+
                ' paralyse '+
                String(
                  idleEtat.nom||'le joueur'
                )+
                ' pendant '+
                idleNombre_(
                  cap.duree
                )+
                ' s.'
              );
            }

            const effetJoueurV112=
              normaliserTypeEffetJoueurIdleV112_(
                type
              );

            if(
              ['gel','feu','poison','stun']
                .indexOf(effetJoueurV112)!==-1
            ){
              activerEffetVisuelJoueurIdleV112_(
                effetJoueurV112,
                Math.max(
                  .1,
                  idleNombre_(cap.duree)||1
                )
              );

              if(effetJoueurV112==='stun'){
                idleParalysieJusquaV70=
                  Math.max(
                    idleParalysieJusquaV70,
                    maintenant+
                    Math.max(
                      .1,
                      idleNombre_(cap.duree)||1
                    )*1000
                  );
              }

              const nomsEffetsV112={
                gel:'❄️ gèle',
                feu:'🔥 brûle',
                poison:'☠️ empoisonne',
                stun:'💫 étourdit'
              };

              ajouterLogCombatIdleV70_(
                'skill',
                String(
                  idleEtat.bossActuel||'Boss'
                )+
                ' '+
                nomsEffetsV112[effetJoueurV112]+
                ' '+
                String(
                  idleEtat.nom||'le joueur'
                )+
                '.'
              );
            }

            if(type==='bouclier'){
              idleBouclierJusquaV70=
                Math.max(
                  idleBouclierJusquaV70,
                  maintenant+
                  Math.max(
                    0,
                    idleNombre_(
                      cap.duree
                    )
                  )*
                  1000
                );

              idleBouclierReductionV70=
                Math.max(
                  idleBouclierReductionV70,
                  Math.max(
                    0,
                    Math.min(
                      95,
                      idleNombre_(
                        cap.valeur
                      )
                    )
                  )
                );

              ajouterLogCombatIdleV70_(
                'skill',
                '🛡️ '+
                String(
                  idleEtat.bossActuel||'Boss'
                )+
                ' active un bouclier : -'+
                idleBouclierReductionV70+
                '% dégâts.'
              );
            }
          }
        );

        if(
          idleBouclierJusquaV70>0 &&
          maintenant>=
          idleBouclierJusquaV70
        ){
          idleBouclierJusquaV70=0;
          idleBouclierReductionV70=0;
        }
      }


      function actualiserXpLocaleIdleV70_(
        gain
      ){
        if(
          !idleEtat ||
          idleNombre_(gain)<=0
        ){
          return;
        }

        let xp=
          Math.max(
            0,
            idleNombre_(
              idleEtat.xp
            )+
            idleNombre_(
              gain
            )
          );

        let niveau=
          Math.max(
            1,
            idleEntier_(
              idleEtat.niveau
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

        idleEtat.xp=xp;
        idleEtat.niveau=niveau;
        idleEtat.xpRequise=
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
                idleEtat
              );
              gererTutorielPremierBossIdleV1_(
                idleEtat
              );
            },
            0
          );
        }
      }


      function barreManaIdleV90_(j){
        const magie=
          j&&j.magie
            ?j.magie
            :null;

        if(
          !magie ||
          !magie.debloquee
        ){
          return '';
        }

        const max=
          Math.max(
            1,
            idleNombre_(
              magie.manaMax
            )
          );

        const mana=
          Math.max(
            0,
            Math.min(
              max,
              idleNombre_(
                magie.mana
              )
            )
          );

        const pct=
          Math.max(
            0,
            Math.min(
              100,
              mana/max*100
            )
          );

        return `
          <div class="soreal-idle-mana-panel-v90">
            <div class="soreal-idle-mana-head-v90">
              <span>🔮 MANA</span>
              <span>
                <strong id="sorealIdleManaTextV90">
                  ${formatGrandNombreIdleV70_(mana)}
                  / ${formatGrandNombreIdleV70_(max)}
                </strong>
                · +${idleNombre_(magie.regenSeconde).toFixed(3)}/s
              </span>
            </div>

            <div class="soreal-idle-mana-track-v90">
              <div
                id="sorealIdleManaFillV90"
                class="soreal-idle-mana-fill-v90"
                style="width:${pct}%"
              ></div>
            </div>
          </div>
        `;
      }


      let idleSortActionV90=false;
      let idleSortPurchaseQueueV101=[];
      let idleSortPurchaseBusyV101=false;
      let idleSortPurchaseTimerV101=null;


      function sortParIdIdleV90_(id){
        const sorts=
          idleEtat&&
          idleEtat.magie&&
          Array.isArray(
            idleEtat.magie.sorts
          )
            ?idleEtat.magie.sorts
            :[];

        return sorts.find(
          function(sort){
            return String(
              sort.id||''
            )===String(
              id||''
            );
          }
        )||null;
      }


      function texteEffetSortIdleV90_(
        sort,
        effet
      ){
        const s=sort||{};
        const e=effet||{};

        if(e.type==='soin_boss'){
          return '💚 '+
            String(s.nom||'Sort')+
            ' soigne le boss de '+
            formatGrandNombreIdleV70_(e.valeur)+
            ' ❤️.';
        }

        if(e.type==='degats_sacres'){
          return '✨ '+
            String(s.nom||'Sort')+
            ' brûle le mort-vivant pour '+
            formatGrandNombreIdleV70_(e.valeur)+
            ' dégâts.';
        }

        if(s.type==='heal_pct'){
          return '❤️ '+
            String(s.nom||'Sort')+
            ' rend '+
            formatGrandNombreIdleV70_(e.valeur)+
            ' ❤️.';
        }

        if(
          s.type==='damage_power' ||
          s.type==='damage_boss_pct'
        ){
          return String(s.emoji||'✨')+
            ' '+
            String(s.nom||'Sort')+
            ' inflige '+
            formatGrandNombreIdleV70_(e.valeur)+
            ' dégâts.';
        }

        if(s.type==='shield_pct'){
          return '🛡️ Barrière active : -'+
            idleNombre_(e.valeur)+
            '% dégâts pendant '+
            idleNombre_(e.duree)+
            ' s.';
        }

        if(s.type==='cleanse'){
          return '❄️ Paralysie purgée · immunité '+
            idleNombre_(e.duree)+
            ' s.';
        }

        if(s.type==='vulnerability_pct'){
          return '🌌 Le boss devient vulnérable de +'+
            idleNombre_(e.valeur)+
            '% pendant '+
            idleNombre_(e.duree)+
            ' s.'+
            (
              e.sceauBrise
                ?' Le sceau est brisé.'
                :''
            );
        }

        return String(s.emoji||'✨')+
          ' '+
          String(s.nom||'Sort')+
          ' lancé.';
      }


      function rafraichirMagieOptimisteIdleV101_(){
        conserverPositionIdleV24_(
          function(){
            rendreIdleEtat_({
              ok:true,
              joueur:idleEtat
            });
          }
        );
      }


      function envoyerAchatsSortsIdleV101_(){
        if(
          idleSortPurchaseBusyV101 ||
          !idleSortPurchaseQueueV101.length ||
          !SOREAL_SESSION
        ){
          return;
        }

        const lot=
          idleSortPurchaseQueueV101
            .splice(
              0,
              idleSortPurchaseQueueV101.length
            );

        idleSortPurchaseBusyV101=true;

        google.script.run
          .withSuccessHandler(function(res){
            idleSortPurchaseBusyV101=false;

            if(
              !res ||
              !res.ok
            ){
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-149 */
              synchroniserJeuIdleV7_(
                true
              );

              messageFlottantIdleV32_(
                '❌ '+
                (
                  res&&res.message
                    ?res.message
                    :'Achat magique refusé.'
                )
              );
            }else if(
              !idleSortPurchaseQueueV101.length &&
              res.joueur
            ){
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-150 */
              idleEtat=
                res.joueur;

              rafraichirMagieOptimisteIdleV101_();
            }

            if(
              idleSortPurchaseQueueV101.length
            ){
              setTimeout(
                envoyerAchatsSortsIdleV101_,
                25
              );
            }
          })
          .withFailureHandler(function(e){
            idleSortPurchaseBusyV101=false;

            synchroniserJeuIdleV7_(
              true
            );

            messageFlottantIdleV32_(
              '❌ '+
              (
                e&&e.message
                  ?e.message
                  :'Erreur pendant l’achat magique.'
              )
            );

            if(
              idleSortPurchaseQueueV101.length
            ){
              setTimeout(
                envoyerAchatsSortsIdleV101_,
                120
              );
            }
          })
          .acheterSortsSorealIdle(
            SOREAL_SESSION,
            lot
          );
      }


      function planifierAchatsSortsIdleV101_(){
        if(idleSortPurchaseTimerV101){
          clearTimeout(
            idleSortPurchaseTimerV101
          );
        }

        idleSortPurchaseTimerV101=
          setTimeout(
            function(){
              idleSortPurchaseTimerV101=null;
              envoyerAchatsSortsIdleV101_();
            },
            55
          );
      }


      function acheterSortIdleV90_(
        sortId
      ){
        if(
          !SOREAL_SESSION ||
          !idleEtat ||
          !idleEtat.magie ||
          !idleEtat.magie.debloquee
        ){
          return;
        }

        const sort=
          sortParIdIdleV90_(
            sortId
          );

        if(
          !sort ||
          sort.achete ||
          !sort.disponibleNiveau
        ){
          return;
        }

        const cout=
          Math.max(
            0,
            idleNombre_(
              sort.coutPieces
            )
          );

        if(
          idleNombre_(
            idleEtat.pieces
          )<
          cout
        ){
          messageFlottantIdleV32_(
            '🪙 Pas assez de pièces.'
          );
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-151 */
        idleEtat.pieces=
          Math.max(
            0,
            idleNombre_(
              idleEtat.pieces
            )-
            cout
          );

        sort.achete=true;
        sort.achetable=false;

        if(
          !Array.isArray(
            idleEtat.magie.sortsAchetes
          )
        ){
          idleEtat.magie.sortsAchetes=[];
        }

        if(
          idleEtat.magie.sortsAchetes.indexOf(
            String(sort.id)
          )===-1
        ){
          idleEtat.magie.sortsAchetes.push(
            String(sort.id)
          );
        }

        if(
          idleSortPurchaseQueueV101.indexOf(
            String(sort.id)
          )===-1
        ){
          idleSortPurchaseQueueV101.push(
            String(sort.id)
          );
        }

        rafraichirMagieOptimisteIdleV101_();

        messageFlottantIdleV32_(
          String(sort.emoji||'🔮')+
          ' Sort appris : '+
          String(sort.nom||'')
        );

        planifierAchatsSortsIdleV101_();
      }


      function lancerSortIdleV90_(
        sortId,
        cible
      ){
        if(
          idleSortActionV90 ||
          !SOREAL_SESSION ||
          !idleEtat
        ){
          return;
        }

        const sort=
          sortParIdIdleV90_(
            sortId
          );

        if(!sort){
          return;
        }

        if(
          String(cible||'')==='boss' &&
          !idleEtat.combatBossActif
        ){
          messageFlottantIdleV32_(
            '⚔️ Lance le combat avant de cibler le boss.'
          );
          return;
        }

        idleSortActionV90=true;

        google.script.run
          .withSuccessHandler(function(res){
            idleSortActionV90=false;

            if(
              !res ||
              !res.ok
            ){
              messageFlottantIdleV32_(
                '❌ '+
                (
                  res&&res.message
                    ?res.message
                    :'Sort impossible.'
                )
              );
              return;
            }

            const nomSort=
              res.sort&&res.sort.nom
                ?res.sort.nom
                :sort.nom;

            ajouterLogCombatIdleV70_(
              'skill',
              texteEffetSortIdleV90_(
                res.sort||sort,
                res.effet||{}
              )
            );

            if(
              res.sort &&
              res.sort.type==='cleanse'
            ){
              idleParalysieJusquaV70=0;
            }

            if(res.joueur){
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-152 */
              const adventureRestPvAvantSortV1=idleEtat&&idleEtat.adventureRestPv;
              const joueurSortProtegeV208=
                protegerJoueurServeurInventaireIdleV208_(
                  res.joueur
                );
              if(!appliquerSynchroCombatSansReflowIdleV116_(joueurSortProtegeV208)){
                idleEtat=joueurSortProtegeV208;
                if(adventureRestPvAvantSortV1!=null)idleEtat.adventureRestPv=adventureRestPvAvantSortV1;
              }

              rendreIdleEtat_({
                ok:true,
                joueur:idleEtat
              });
            }

            messageFlottantIdleV32_(
              String(
                res.sort&&res.sort.emoji||'✨'
              )+
              ' '+
              String(nomSort||'Sort')
            );
          })
          .withFailureHandler(function(e){
            idleSortActionV90=false;

            messageFlottantIdleV32_(
              '❌ '+
              (
                e&&e.message
                  ?e.message
                  :'Erreur magique.'
              )
            );
          })
          .lancerSortSorealIdle(
            SOREAL_SESSION,
            String(sortId||''),
            String(cible||'joueur')
          );
      }


      window.__acheterSortIdleV90__=
        acheterSortIdleV90_;

      window.__lancerSortIdleV90__=
        lancerSortIdleV90_;


      function boutonsCibleSortIdleV90_(
        sort,
        compact
      ){
        const cibles=
          Array.isArray(
            sort&&sort.cibles
          )
            ?sort.cibles
            :[];

        const now=Date.now();

        const cooldown=
          Math.max(
            0,
            (
              idleNombre_(
                sort&&sort.cooldownJusqua
              )-
              now
            )/
            1000
          );

        const mana=
          idleEtat&&idleEtat.magie
            ?idleNombre_(
                idleEtat.magie.mana
              )
            :0;

        const baseDisabled=
          (
            cooldown>0 ||
            mana<
            idleNombre_(
              sort&&sort.coutMana
            ) ||
            idleSortActionV90
          );

        return cibles.map(
          function(cible){
            const boss=
              cible==='boss';

            const disabled=
              baseDisabled ||
              (
                boss &&
                !(
                  idleEtat&&
                  idleEtat.combatBossActif
                )
              );

            if(compact){
              return `
                <button
                  type="button"
                  class="soreal-idle-quick-spell-v90${boss?' boss-target':''}"
                  data-sort-idle-v90="${idleHtml_(sort.id)}"
                  data-sort-target-v90="${idleHtml_(cible)}"
                  onclick="window.__lancerSortIdleV90__('${idleHtml_(sort.id)}','${idleHtml_(cible)}')"
                  ${disabled?'disabled':''}
                >
                  ${idleHtml_(sort.emoji||'✨')}
                  ${boss?'Boss':'Moi'}
                  <small>
                    ${formatGrandNombreIdleV70_(sort.coutMana)} mana
                    ${
                      cooldown>0
                        ?' · '+cooldown.toFixed(0)+'s'
                        :''
                    }
                  </small>
                </button>
              `;
            }

            return `
              <button
                type="button"
                class="soreal-idle-spell-button-v90${boss?' boss-target':''}"
                data-sort-idle-v90="${idleHtml_(sort.id)}"
                data-sort-target-v90="${idleHtml_(cible)}"
                onclick="window.__lancerSortIdleV90__('${idleHtml_(sort.id)}','${idleHtml_(cible)}')"
                ${disabled?'disabled':''}
              >
                ${boss?'👹 Cibler le boss':'❤️ Me cibler'}
                ${
                  cooldown>0
                    ?' · '+cooldown.toFixed(0)+'s'
                    :''
                }
              </button>
            `;
          }
        ).join('');
      }


      function barreSortsCombatIdleV90_(
        j
      ){
        const magie=
          j&&j.magie
            ?j.magie
            :null;

        if(
          !magie ||
          !magie.debloquee
        ){
          return '';
        }

        const sorts=
          Array.isArray(
            magie.sorts
          )
            ?magie.sorts.filter(
                function(sort){
                  return sort.achete;
                }
              )
            :[];

        if(!sorts.length){
          return `
            <div class="soreal-idle-quick-spells-v90">
              <div class="soreal-idle-quick-spells-title-v90">
                🔮 Magie
              </div>
              <div class="soreal-idle-note-v4">
                Aucun sort appris. Ouvre l’onglet Magie.
              </div>
            </div>
          `;
        }

        return `
          <div class="soreal-idle-quick-spells-v90">
            <div class="soreal-idle-quick-spells-title-v90">
              🔮 Sorts rapides
            </div>

            <div class="soreal-idle-quick-spells-grid-v90">
              ${sorts.map(
                function(sort){
                  return boutonsCibleSortIdleV90_(
                    sort,
                    true
                  );
                }
              ).join('')}
            </div>
          </div>
        `;
      }


      function pageMagieIdleV90_(
        j
      ){
        const magie=
          j&&j.magie
            ?j.magie
            :null;

        if(
          !magie ||
          !magie.debloquee
        ){
          return `
            ${entetePageIdleV28_(
              '🔮 Magie',
              'La magie n’est pas encore disponible.'
            )}

            <div class="soreal-idle-empty-v21">
              🔒 Niveau ${idleEntier_(magie&&magie.niveauRequis||4)}
            </div>
          `;
        }

        const sorts=
          Array.isArray(
            magie.sorts
          )
            ?magie.sorts
            :[];

        return `
          ${entetePageIdleV28_(
            '🔮 Magasin de magie',
            'Apprends des sorts, gère ton mana et utilise les bons pouvoirs au bon moment.'
          )}

          <div class="soreal-idle-note-v4" style="margin-bottom:12px">
            Le mana se régénère volontairement lentement.
            Les cooldowns empêchent de spammer les soins.
            Un soin lancé sur un boss mort-vivant lui inflige des dégâts sacrés.
          </div>

          <div class="soreal-idle-spell-grid-v90">
            ${sorts.map(function(sort){
              const achete=
                Boolean(sort.achete);

              const niveauOk=
                Boolean(sort.disponibleNiveau);

              return `
                <div
                  class="soreal-idle-spell-card-v90${
                    achete
                      ?' learned'
                      :''
                  }${
                    niveauOk
                      ?''
                      :' locked'
                  }"
                >
                  <div class="soreal-idle-spell-title-v90">
                    <div class="soreal-idle-spell-icon-v90">
                      ${idleHtml_(sort.emoji||'✨')}
                    </div>

                    <div>
                      ${idleHtml_(sort.nom||'Sort')}
                      <div style="margin-top:2px;color:#8999b1;font-size:8px">
                        ${
                          achete
                            ?'✓ APPRIS'
                            :'Niveau '+idleEntier_(sort.niveauRequis)
                        }
                      </div>
                    </div>
                  </div>

                  <div class="soreal-idle-spell-desc-v90">
                    ${idleHtml_(sort.description||'')}
                  </div>

                  <div class="soreal-idle-spell-meta-v90">
                    <span class="soreal-idle-spell-chip-v90">
                      🔮 ${formatGrandNombreIdleV70_(sort.coutMana)} mana
                    </span>
                    <span class="soreal-idle-spell-chip-v90">
                      ⏱️ ${idleNombre_(sort.cooldownSec)} s
                    </span>
                    ${
                      !achete
                        ?'<span class="soreal-idle-spell-chip-v90">🪙 '+
                          formatGrandNombreIdleV70_(sort.coutPieces)+
                          '</span>'
                        :''
                    }
                  </div>

                  <div class="soreal-idle-spell-actions-v90">
                    ${
                      !achete
                        ?`
                          <button
                            type="button"
                            class="soreal-idle-spell-button-v90 buy"
                            onclick="window.__acheterSortIdleV90__('${idleHtml_(sort.id)}')"
                            ${
                              (
                                !niveauOk ||
                                idleNombre_(j.pieces)<
                                idleNombre_(sort.coutPieces)
                              )
                                ?'disabled'
                                :''
                            }
                          >
                            🔓 Apprendre · ${formatGrandNombreIdleV70_(sort.coutPieces)} 🪙
                          </button>
                        `
                        :boutonsCibleSortIdleV90_(
                            sort,
                            false
                          )
                    }
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }


      function actualiserManaSortsIdleV90_(
        maintenant
      ){
        const magie=
          idleEtat&&idleEtat.magie
            ?idleEtat.magie
            :null;

        if(
          !magie ||
          !magie.debloquee
        ){
          return;
        }

        const max=
          Math.max(
            1,
            idleNombre_(
              magie.manaMax
            )
          );

        magie.mana=
          Math.min(
            max,
            Math.max(
              0,
              idleNombre_(
                magie.mana
              )+
              Math.max(
                0,
                idleNombre_(
                  magie.regenSeconde
                )
              )*
              (
                Math.max(
                  0,
                  maintenant-
                  (
                    magie.__tickLocalV90||
                    maintenant
                  )
                )/
                1000
              )
            )
          );

        magie.__tickLocalV90=
          maintenant;

        const texte=
          document.getElementById(
            'sorealIdleManaTextV90'
          );

        if(texte){
          texte.textContent=
            formatGrandNombreIdleV70_(
              magie.mana
            )+
            ' / '+
            formatGrandNombreIdleV70_(
              max
            );
        }

        const fill=
          document.getElementById(
            'sorealIdleManaFillV90'
          );

        if(fill){
          fill.style.width=
            Math.max(
              0,
              Math.min(
                100,
                magie.mana/max*100
              )
            )+
            '%';
        }

        document
          .querySelectorAll(
            '[data-sort-idle-v90]'
          )
          .forEach(function(button){
            const sort=
              sortParIdIdleV90_(
                button.getAttribute(
                  'data-sort-idle-v90'
                )
              );

            if(!sort)return;

            const cible=
              button.getAttribute(
                'data-sort-target-v90'
              )||'joueur';

            const restant=
              Math.max(
                0,
                (
                  idleNombre_(
                    sort.cooldownJusqua
                  )-
                  maintenant
                )/
                1000
              );

            button.disabled=
              Boolean(
                idleSortActionV90 ||
                restant>0 ||
                idleNombre_(
                  magie.mana
                )<
                idleNombre_(
                  sort.coutMana
                ) ||
                (
                  cible==='boss' &&
                  !idleEtat.combatBossActif
                )
              );

            const small=
              button.querySelector(
                'small'
              );

            if(small){
              small.textContent=
                formatGrandNombreIdleV70_(
                  sort.coutMana
                )+
                ' mana'+
                (
                  restant>0
                    ?' · '+
                      restant.toFixed(0)+
                      's'
                    :''
                );
            }
          });
      }


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-153 */
      function rendreBarreEnergiePersistanteIdleV1_(j){
        return `
          <div class="soreal-idle-energy-panel-v34">
            <div class="soreal-idle-energy-head-v34">
              <div class="soreal-idle-energy-title-v34">
                ⚡ Énergie d'entraînement
              </div>

              <div
                id="sorealIdleEnergieValeurV4"
                class="soreal-idle-energy-number-v34"
              >
                ${texteEnergieGenereeIdleV1_()}
              </div>
            </div>

            <div
              id="sorealIdleEnergySpeedV34"
              class="soreal-idle-energy-speed-v34"
            >
              Tick : ${(dureeTickEnergieIdleV34_()/1000).toFixed(2)} s
              · +${idleEntier_(gainParTickEnergieIdleV34_())} ⚡
            </div>

            <div class="soreal-idle-energybar-wrap-v11">
              <div
                id="sorealIdleEnergyBarV11"
                class="soreal-idle-energybar-v11"
              ></div>
              <div
                id="sorealIdleEnergyShineV11"
                class="soreal-idle-energybar-shine-v11"
              ></div>
              <div
                id="sorealIdleEnergyOverlayV1"
                class="soreal-idle-energybar-overlay-v1"
              >
                ${formatEnergieIdleV50_(energieDisponibleIdleV9_())} / ${idleEntier_(j.energieMax)}
              </div>
            </div>
          </div>
        `;
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-154 */
      function formatDureeRunIdleV1_(secondesTotal){
        const api=window.__SOREAL_IDLE_TIME_FORMAT_V1__;
        return api&&typeof api.duree==='function'?api.duree(secondesTotal):'00:00:00';
      }
      function dureeRunSecondesIdleV1_(j){
        const api=window.__SOREAL_IDLE_TIME_FORMAT_V1__;
        return api&&typeof api.runSecondes==='function'?api.runSecondes(j):0;
      }
      function resumeStatsIdleV28_(j){
        const combat=j&&j.combatPrincipal?j.combatPrincipal:{};
        const systemes=j&&j.systemes?j.systemes:{};
        const monnaies=systemes.currencies||{};
        const records=systemes.records||{};
        const number=
          j&&j.renaissance&&j.renaissance.number!==undefined
            ?j.renaissance.number
            :j&&j.renaissance&&j.renaissance.multiplicateur!==undefined
              ?j.renaissance.multiplicateur
              :1;
        const apVisible=Boolean(
          idleNombre_(monnaies.ap)>0||
          (systemes.selloutShop&&systemes.selloutShop.unlockedEver)
        );
        const rebirths=Math.max(0,idleEntier_(records.totalRebirths||0));

        return `
          <div class="soreal-idle-summary-grid-v28">
            <div class="soreal-idle-summary-v28">
              🔢 Nombre
              <b id="sorealIdleSummaryNumberV50">${formatGrandNombreIdleV70_(number)}</b>
            </div>
            <div class="soreal-idle-summary-v28">
              ⚔️ Attack
              <b id="sorealIdleSummaryAttackV50">${formatGrandNombreIdleV70_(combat.attaque||j.puissance||0)}</b>
            </div>
            <div class="soreal-idle-summary-v28">
              🛡️ Defense
              <b id="sorealIdleSummaryDefenseV50">${formatGrandNombreIdleV70_(combat.defense||j.defense||0)}</b>
            </div>
            <div class="soreal-idle-summary-v28">
              🪙 Gold
              <b id="sorealIdleSummaryGoldV50">${formatGrandNombreIdleV70_(monnaies.gold||0)}</b>
            </div>
            <div class="soreal-idle-summary-v28">
              ⭐ EXP
              <b id="sorealIdleSummaryExpV50">${formatGrandNombreIdleV70_(monnaies.experience||j.xp||0)}</b>
            </div>
            ${apVisible
              ?`<div class="soreal-idle-summary-v28">
                  💠 AP
                  <b id="sorealIdleSummaryApV210">${formatGrandNombreIdleV70_(monnaies.ap||0)}</b>
                </div>`
              :''}
            <div class="soreal-idle-summary-v28">
              ♻️ Rebirths
              <b id="sorealIdleSummaryRebirthsV210">${formatGrandNombreIdleV70_(rebirths)}</b>
            </div>
            <div class="soreal-idle-summary-v28">
              ⏱️ Run
              <b id="sorealIdleSummaryRunV1">${formatDureeRunIdleV1_(dureeRunSecondesIdleV1_(j))}</b>
            </div>
          </div>
        `;
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-155 */
      function patcherResumeStatsIdleV28_(j){
        if(!j)return;
        const combat=j.combatPrincipal?j.combatPrincipal:{};
        const systemes=j.systemes||{};
        const monnaies=systemes.currencies||{};
        const records=systemes.records||{};
        const number=
          j.renaissance&&j.renaissance.number!==undefined
            ?j.renaissance.number
            :j.renaissance&&j.renaissance.multiplicateur!==undefined
              ?j.renaissance.multiplicateur
              :1;

        const apVisible=Boolean(
          idleNombre_(monnaies.ap)>0||
          (systemes.selloutShop&&systemes.selloutShop.unlockedEver)
        );
        const apExistant=document.getElementById('sorealIdleSummaryApV210');
        if(apVisible&&!apExistant){
          const numberNode=document.getElementById('sorealIdleSummaryNumberV50');
          const grille=numberNode&&numberNode.closest('.soreal-idle-summary-grid-v28');
          if(grille){
            grille.outerHTML=resumeStatsIdleV28_(j);
          }
        }

        const ecrire=function(id,texte){
          const el=document.getElementById(id);
          if(el)el.textContent=texte;
        };

        ecrire('sorealIdleSummaryNumberV50',formatGrandNombreIdleV70_(number));
        ecrire('sorealIdleSummaryAttackV50',formatGrandNombreIdleV70_(combat.attaque||j.puissance||0));
        ecrire('sorealIdleSummaryDefenseV50',formatGrandNombreIdleV70_(combat.defense||j.defense||0));
        ecrire('sorealIdleSummaryGoldV50',formatGrandNombreIdleV70_(monnaies.gold||0));
        ecrire('sorealIdleSummaryExpV50',formatGrandNombreIdleV70_(monnaies.experience||j.xp||0));
        ecrire('sorealIdleSummaryApV210',formatGrandNombreIdleV70_(monnaies.ap||0));
        ecrire('sorealIdleSummaryRebirthsV210',formatGrandNombreIdleV70_(records.totalRebirths||0));
        ecrire('sorealIdleSummaryRunV1',formatDureeRunIdleV1_(dureeRunSecondesIdleV1_(j)));
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-156 */
      function empreinteStructurelleIdleV1_(j){
        if(!j)return '';

        const systemes=
          j.systemes&&Array.isArray(j.systemes.systems)
            ?j.systemes.systems
            :[];

        const unlocks=
          systemes
            .filter(function(s){return s&&s.unlock&&s.unlock.unlocked;})
            .map(function(s){return String(s.id||'');})
            .sort()
            .join(',');

        return [
          idleEntier_(j.bossVaincus),
          Boolean(j.combatBossActif),
          Boolean(j.bossBloqueRenaissance),
          Boolean(j.inventaireDebloque),
          Boolean(j.aventure&&j.aventure.debloquee),
          Boolean(j.bestiaire&&j.bestiaire.debloquee),
          Boolean(j.renaissance&&j.renaissance.debloquee),
          Boolean(
            j.systemes&&
            j.systemes.selloutShop&&
            j.systemes.selloutShop.unlockedEver
          ),
          idleEntier_(j.niveau),
          unlocks
        ].join('|');
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-157 */


      let idleBossCarteNumeroV91=0;


      function fermerCarteBossIdleV91_(){
        const modal=
          document.getElementById(
            'sorealIdleBossCardModalV91'
          );

        if(modal){
          modal.remove();
        }
      }


      function combattreDepuisCarteBossIdleV91_(
        numero
      ){
        const n=
          idleEntier_(
            numero
          );

        fermerCarteBossIdleV91_();

        selectionnerBossIdleV37_(
          n
        );

        setTimeout(
          function(){
            definirCombatBossIdleV39_(
              true
            );
          },
          120
        );
      }


      function construireCarteBossIdleV91_(
        b
      ){
        const image=
          urlDriveRapideIdleV46_(
            b&&b.driveFileId
          ) ||
          urlBossR2IdleV1_(
            b&&b.numero
          );

        const caps=
          Array.isArray(
            b&&b.capacites
          )
            ?b.capacites
            :[];

        return `
          <div
            class="soreal-idle-modal-card-v63 soreal-idle-boss-card-modal-v91"
            role="dialog"
            aria-modal="true"
          >
            <div class="soreal-idle-modal-top-v63">
              <div class="soreal-idle-modal-icon-v63">👹</div>

              <div class="soreal-idle-modal-title-v63">
                #${idleEntier_(b.numero)}
                · ${idleHtml_(b.nom||'Boss')}
              </div>

              <div class="soreal-idle-modal-gain-v63">
                ${
                  b.mortVivant
                    ?'☠️ MORT-VIVANT'
                    :b.etat==='vaincu'
                      ?'✅ DÉJÀ VAINCU'
                      :'⚔️ BOSS ACTUEL'
                }
              </div>
            </div>

            <div class="soreal-idle-modal-body-v63">
              <div class="soreal-idle-boss-card-image-v91">
                ${
                  image
                    ?'<img src="'+
                      idleHtml_(image)+
                      '" alt="'+
                      idleHtml_(b.nom||'Boss')+
                      '">'
                    :'<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:80px">👹</div>'
                }
              </div>

              <div class="soreal-idle-boss-card-stats-v91">
                <div class="soreal-idle-boss-card-stat-v91">
                  ❤️
                  <strong>${formatGrandNombreIdleV70_(b.pv)}</strong>
                </div>

                <div class="soreal-idle-boss-card-stat-v91">
                  ⚔️ ATTAQUE
                  <strong>${formatGrandNombreIdleV70_(b.attaque)}</strong>
                </div>

                <div class="soreal-idle-boss-card-stat-v91">
                  XP BASE
                  <strong>${formatGrandNombreIdleV70_(b.xp)}</strong>
                </div>

                <div class="soreal-idle-boss-card-stat-v91">
                  NIVEAU
                  <strong>${idleEntier_(b.niveauRequis)}</strong>
                </div>

                <div class="soreal-idle-boss-card-stat-v91">
                  PUISSANCE EST.
                  <strong>~${formatGrandNombreIdleV70_(b.puissanceMinimum)}</strong>
                </div>
              </div>

              <div id="sorealIdleBossModalStoryV206_${idleEntier_(b.numero)}" class="soreal-idle-boss-story-v91"${b.histoire?' data-soreal-tts-chronique="'+idleHtml_(b.nom||'Boss')+'"':''}>
                ${idleHtml_(
                  b.histoire||
                  'Aucune archive n’existe encore pour ce boss.'
                )}
              </div>
              ${b.histoire
                ?'<button type="button" class="soreal-idle-tts-read-v203" data-soreal-tts-target="sorealIdleBossModalStoryV206_'+idleEntier_(b.numero)+'">🔊 Lire la chronique</button>'
                :''}

              <div class="soreal-idle-boss-powers-v91">
                ${
                  caps.length
                    ?caps.map(
                        function(cap){
                          return (
                            '<span class="soreal-idle-boss-skill-chip-v70">'+
                            idleHtml_(
                              labelCapaciteBossIdleV70_(
                                cap
                              )
                            )+
                            '</span>'
                          );
                        }
                      ).join('')
                    :'<span class="soreal-idle-boss-skill-chip-v70">Aucun pouvoir spécial</span>'
                }
              </div>
            </div>

            <div class="soreal-idle-modal-actions-v63">
              <button
                type="button"
                class="soreal-idle-modal-button-v63 cancel"
                onclick="window.__fermerCarteBossIdleV91__()"
              >
                Fermer
              </button>

              <button
                type="button"
                class="soreal-idle-modal-button-v63 confirm"
                onclick="window.__combattreDepuisCarteBossIdleV91__(${idleEntier_(b.numero)})"
                ${b.selectionnable?'':'disabled'}
              >
                ${
                  b.etat==='vaincu'
                    ?'☠️ Mort jusqu’à la Renaissance'
                    :'⚔️ Combattre'
                }
              </button>
            </div>
          </div>
        `;
      }


      function ouvrirCarteBossIdleV91_(
        numero
      ){
        if(!idleEtat){
          return;
        }

        const n=
          idleEntier_(
            numero
          );

        const boss=
          Array.isArray(
            idleEtat.bossCatalogue
          )
            ?idleEtat.bossCatalogue.find(
                function(b){
                  return idleEntier_(b.numero)===n;
                }
              )
            :null;

        if(
          !boss ||
          !boss.connu
        ){
          return;
        }

        idleBossCarteNumeroV91=n;

        if(
          idleEtat.combatBossActif
        ){
          definirCombatBossIdleV39_(
            false
          );

          setTimeout(
            function(){
              ouvrirCarteBossIdleV91_(
                n
              );
            },
            180
          );

          return;
        }

        fermerCarteBossIdleV91_();

        const modal=
          document.createElement(
            'div'
          );

        modal.id=
          'sorealIdleBossCardModalV91';

        modal.className=
          'soreal-idle-modal-backdrop-v63';

        modal.innerHTML=
          construireCarteBossIdleV91_(
            boss
          );

        modal.addEventListener(
          'click',
          function(event){
            if(event.target===modal){
              fermerCarteBossIdleV91_();
            }
          }
        );

        document.body.appendChild(
          modal
        );
      }


      window.__ouvrirCarteBossIdleV91__=
        ouvrirCarteBossIdleV91_;

      window.__fermerCarteBossIdleV91__=
        fermerCarteBossIdleV91_;

      window.__combattreDepuisCarteBossIdleV91__=
        combattreDepuisCarteBossIdleV91_;


      let idleCombatBossActionV39=false;
      let idleAutoBossActionV49=false;
      let idleVictoireBossLocaleV49=false;
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-158 */
      let idleCombatArmeLocalV206=false;
      let idleCombatStopFantomeEnvoyeV206=false;
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-159 */
      let idleCombatEnPauseApresDefaiteV1=false;


      function jouerEffetAudioIdleV199_(nom){
        const audio=window.__SOREAL_IDLE_AUDIO_V199__;
        if(!audio)return false;

        if(typeof audio.play==='function'){
          try{return Boolean(audio.play(String(nom||'')));}catch(_){return false;}
        }

        const fn=audio[String(nom||'')];
        if(typeof fn==='function'){
          try{return Boolean(fn());}catch(_){return false;}
        }

        return false;
      }


      function definirCombatBossIdleV39_(
        actif
      ){
        if(
          !idleEtat ||
          !SOREAL_SESSION
        ){
          return;
        }

        if(
          actif&&(
            idleEtat.combatBossActif||
            idleVictoireBossLocaleV49||
            idleNombre_(idleEtat.pvJoueur)<=0
          )
        ){
          return;
        }

        if(
          actif &&
          (
            idlePopupBloqueCombatV102 ||
            idlePopupActifV75 ||
            idlePopupQueueV75.length
          )
        ){
          afficherProchainePopupIdleV75_();
          return;
        }

        if(actif){
          idleCombatArmeLocalV206=true;
          idleCombatStopFantomeEnvoyeV206=false;
          jouerEffetAudioIdleV199_('fight');
        }else{
          idleCombatArmeLocalV206=false;
        }

        idleEtat.combatBossActif=
          Boolean(
            actif
          );

        if(actif){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-160 */
          idleCombatEnPauseApresDefaiteV1=false;

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-161 */
          idleCombatLogDernierResumeV70=
            Date.now();

          idleCombatLogDegatsJoueurV70=0;
          idleCombatLogDegatsBossV70=0;
          idleCombatLogDegatsBrutsV100=0;
          idleCombatLogBloquesV70=0;

          preparerCapacitesBossIdleV70_(
            true
          );

          ajouterLogCombatIdleV70_(
            'system',
            '▶ Combat lancé contre '+
            String(
              idleEtat.bossActuel||'le boss'
            )+
            '.'
          );
        }

        if(!actif){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-162 */
          idleCombatEnPauseApresDefaiteV1=false;

          messageFlottantIdleV32_(
            '🏃 Fuite · combat interrompu.'
          );

          ajouterLogCombatIdleV70_(
            'system',
            '🏃 Fuite : combat interrompu.'
          );
        }

        idleVictoireBossLocaleV49=false;

        if(actif){
          rafraichirCommandesFightBossIdleV167_();
        }else{
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-163 */
          planifierRenduOptimisteIdleV60_();
        }

        ajouterActionRapideIdleV60_(
          'combat',
          {
            actif:Boolean(actif),
            raison:actif?'reprise':'fuite',
            snapshot:snapshotCombatFightBossIdleV173_()
          }
        );
      }


      window.__definirCombatBossIdleV39__=
        definirCombatBossIdleV39_;


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-164 */
      let idleNukeEnCoursV1=false;


      function lancerCascadeNukeIdleV1_(
        defeated,
        fini
      ){
        if(
          !Array.isArray(defeated) ||
          !defeated.length
        ){
          if(typeof fini==='function'){
            fini();
          }

          return;
        }

        const overlay=
          document.createElement('div');

        overlay.id=
          'sorealIdleNukeCascadeV1';

        overlay.style.cssText=
          'position:fixed;left:50%;top:22%;transform:translate(-50%,-50%);'+
          'z-index:9999;padding:10px 22px;border-radius:14px;'+
          'background:rgba(10,12,20,.88);border:1px solid rgba(255,196,60,.55);'+
          'color:#ffe9a8;font-weight:900;font-size:15px;letter-spacing:.02em;'+
          'box-shadow:0 8px 30px rgba(0,0,0,.45);pointer-events:none;'+
          'text-align:center;white-space:nowrap;transition:opacity .08s linear';

        document.body.appendChild(
          overlay
        );

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-165 */
        const delai=
          defeated.length > 40
            ? 30
            : defeated.length > 15
              ? 55
              : 90;

        let index=0;

        (function etape(){
          if(index>=defeated.length){
            overlay.style.opacity=
              '0';

            setTimeout(
              function(){
                if(
                  overlay &&
                  overlay.parentNode
                ){
                  overlay.remove();
                }

                if(typeof fini==='function'){
                  fini();
                }
              },
              140
            );

            return;
          }

          const boss=
            defeated[index];

          overlay.textContent=
            '💥 #'+
            idleEntier_(boss&&boss.numero)+
            ' '+
            String(boss&&boss.nom||'Boss')+
            '  ('+
            (index+1)+
            '/'+
            defeated.length+
            ')';

          index+=1;

          setTimeout(
            etape,
            delai
          );
        })();
      }


      function nukerBossIdleV1_(){
        if(
          idleNukeEnCoursV1 ||
          !idleEtat ||
          !SOREAL_SESSION ||
          idleEtat.combatBossActif ||
          idleEtat.bossBloqueRenaissance
        ){
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-166 */
        idleFastPendingV60.combat=null;
        idleCombatArmeLocalV206=false;
        idleEtat.combatBossActif=false;
        jouerEffetAudioIdleV199_('nuke');
        idleCombatIdentiteV116='';
        idleProchainCoupJoueurV116=0;
        idleProchainCoupBossV116=0;

        idleNukeEnCoursV1=true;

        google.script.run
          .withSuccessHandler(function(res){
            idleNukeEnCoursV1=false;

            if(!res||!res.ok){
              toastIdleV5_(
                res&&res.message
                  ?res.message
                  :'NUKE impossible pour le moment.'
              );

              return;
            }

            const defeated=
              res.nuke &&
              Array.isArray(res.nuke.defeated)
                ?res.nuke.defeated
                :[];

            lancerCascadeNukeIdleV1_(
              defeated,
              function(){
                idleFastPendingV60.combat=null;
                idleCombatIdentiteV116='';
                idleProchainCoupJoueurV116=0;
                idleProchainCoupBossV116=0;

                idleEtat=
                  res.joueur;

                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-167 */
                idleEtat.combatBossActif=false;

                rendreIdleEtat_({
                  ok:true,
                  joueur:idleEtat
                });

                if(defeated.length){
                  messageFlottantIdleV32_(
                    '🚀 NUKE · '+
                    defeated.length+
                    ' boss enchaîné(s) !'
                  );
                }
              }
            );
          })
          .withFailureHandler(function(e){
            idleNukeEnCoursV1=false;

            toastIdleV5_(
              e&&e.message
                ?e.message
                :'Erreur pendant le NUKE.'
            );
          })
          .nukerBossSorealIdle(
            SOREAL_SESSION
          );
      }


      window.__nukerBossIdleV1__=
        nukerBossIdleV1_;

      /*
       * Auto Nuker (Sellout Shop, 65 000 AP -- wiki : "automatically nuke bosses 10 seconds
       * into each rebirth, and then every minute afterwards"). Lance le même NUKE que le
       * bouton, à partir de l'horodatage de début de run exposé par le serveur.
       */
      let idleAutoNukeRunV1=0;
      let idleAutoNukeDernierV1=0;
      function autoNukeDueIdleV1_(runDebuteA,dernier,maintenant){
        const debut=Number(runDebuteA)||0;
        if(debut<=0)return false;
        const depuis=(maintenant-debut)/1000;
        if(depuis<10)return false;
        return !dernier||maintenant-dernier>=60000;
      }
      window.__autoNukeDueIdleV1__=autoNukeDueIdleV1_;
      setInterval(function(){
        try{
          const j=idleEtat;
          const achats=j&&j.systemes&&j.systemes.selloutShop&&j.systemes.selloutShop.purchases;
          if(!achats||!(Number(achats.autoNuker)>0))return;
          const debut=Number(j.renaissance&&j.renaissance.runDebuteA)||0;
          if(debut!==idleAutoNukeRunV1){
            idleAutoNukeRunV1=debut;
            idleAutoNukeDernierV1=0;
          }
          const maintenant=Date.now();
          if(!autoNukeDueIdleV1_(debut,idleAutoNukeDernierV1,maintenant))return;
          if(idleNukeEnCoursV1||j.combatBossActif||j.bossBloqueRenaissance)return;
          idleAutoNukeDernierV1=maintenant;
          nukerBossIdleV1_();
        }catch(e){}
      },1000);


      function definirAutoBossSuivantIdleV49_(
        actif
      ){
        if(
          !idleEtat ||
          !SOREAL_SESSION
        ){
          return;
        }

        idleEtat.autoBossSuivant=
          Boolean(
            actif
          );

        const checkbox=
          document.getElementById(
            'sorealIdleAutoBossSuivantV49'
          );

        if(checkbox){
          checkbox.checked=
            Boolean(
              actif
            );
        }

        ajouterActionRapideIdleV60_(
          'autoBoss',
          Boolean(actif)
        );
      }


      window.__definirAutoBossSuivantIdleV49__=
        definirAutoBossSuivantIdleV49_;


      let idleSelectionBossEnCoursV37=false;


      function selectionnerBossIdleV37_(
        numero
      ){
        if(
          !SOREAL_SESSION ||
          !idleEtat
        ){
          return;
        }

        const n=
          idleEntier_(
            numero
          );

        idleCombatArmeLocalV206=false;
        idleEtat.bossSelection=n;

        const b=
          Array.isArray(
            idleEtat.bossCatalogue
          )
            ?idleEtat.bossCatalogue.find(
                function(x){
                  return (
                    idleEntier_(
                      x.numero
                    )===n
                  );
                }
              )
            :null;

        if(b){
          idleEtat.bossActuel=b.nom;
          idleEtat.bossPv=b.pv;
          idleEtat.bossPvMax=b.pv;
          idleEtat.attaqueBoss=b.attaque;

          idleEtat.pvJoueur=
            idleEtat.pvJoueurMax;

          idleEtat.bossCatalogue.forEach(
            function(x){
              x.selectionne=
                idleEntier_(
                  x.numero
                )===n;
            }
          );
        }

        planifierRenduOptimisteIdleV60_();

        ajouterActionRapideIdleV60_(
          'boss',
          n
        );
      }


      window.__selectionnerBossIdleV37__=
        selectionnerBossIdleV37_;


let idleDialogueTimerV76=null;


      function phrasesJoueurIdleV76_(){
        return [
          'Même pas peur.',
          'Ça va finir au recyclage.',
          'Encore un effort…',
          'Le dépôt compte sur moi.',
          'Je vais passer ce mur.'
        ];
      }


      function afficherBulleIdleV76_(id,texte){
        const el=
          document.getElementById(id);

        if(!el)return;

        el.textContent=
          String(texte||'');

        el.classList.remove('visible');

        requestAnimationFrame(function(){
          el.classList.add('visible');
        });

        setTimeout(function(){
          el.classList.remove('visible');
        },2700);
      }


      function choisirPhraseIdleV76_(liste){
        const valeurs=
          Array.isArray(liste)
            ?liste
            :[];

        if(!valeurs.length){
          return '';
        }

        return valeurs[
          Math.floor(
            Math.random()*valeurs.length
          )
        ];
      }


      function demarrerBullesCombatIdleV76_(j){
        if(idleDialogueTimerV76){
          clearInterval(idleDialogueTimerV76);
          idleDialogueTimerV76=null;
        }

        if(!j||!j.combatBossActif){
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-168 */
        const faireParler=function(){
          if(
            !idleEtat ||
            !idleEtat.combatBossActif
          ){
            return;
          }

          afficherBulleIdleV76_(
            'sorealIdleDialogueJoueurV76',
            choisirPhraseIdleV76_(
              phrasesJoueurIdleV76_()
            )
          );
        };

        setTimeout(faireParler,850);

        idleDialogueTimerV76=
          setInterval(
            faireParler,
            5200
          );
      }


      function bossNukableIdleV198_(j){
        if(!j)return false;

        return (
          idleNombre_(j.puissance)/5 >
            idleNombre_(j.defenseBoss) &&
          idleNombre_(j.defense)/5 >
            idleNombre_(j.attaqueBoss)
        );
      }


      function pageCombatIdleV28_(j){
        return `
          ${entetePageIdleV28_(
            '⚔️ Fight Boss',
            'Appuie sur Start. Une victoire tue ce boss pour le run et sélectionne immédiatement le suivant.'
          )}

          <div class="soreal-idle-card-v4 soreal-idle-boss-current-v35">
            <div class="soreal-idle-label-v4">BOSS ACTUEL</div>

            <div class="soreal-idle-duel-v41">
              <div class="soreal-idle-duel-versus-row-v42">
                <div class="soreal-idle-duel-fighter-v42">
                  <div class="soreal-idle-duel-nameplate-v65 player">
                    <div class="soreal-idle-duel-role-v65">
                      ⚡ JOUEUR
                    </div>
                    <div class="soreal-idle-duel-name-text-v65">
                      ${idleHtml_(j.nom||'Joueur')}
                    </div>
                  </div>

                  <div
                    id="sorealIdlePlayerImageHostV43"
                    class="soreal-idle-duel-portrait-v41 soreal-idle-player-portrait-v41"
                  >
                    ${
                      markupImageCombatIdleV61_(
                        'joueur',
                        j.apparenceJoueur&&j.apparenceJoueur.driveFileId,
                        '',
                        j.nom||'Joueur',
                        '',
                        String(
                          j.apparenceJoueur&&
                          j.apparenceJoueur.numero||1
                        )
                      ) ||
                      '<div class="soreal-idle-player-placeholder-v41">🧍</div>'
                    }

                    <div
                      id="sorealIdlePlayerStatusFxV112"
                      class="soreal-idle-status-fx-wrap-v112"
                    ></div>
                    <div
                      id="sorealIdlePlayerStatusBadgesV112"
                      class="soreal-idle-status-badges-v112"
                    ></div>
                  </div>

                  <div
                    id="sorealIdleDialogueJoueurV76"
                    class="soreal-idle-dialogue-v76 player"
                  ></div>

                  <div class="soreal-idle-duel-hp-v41">
                    <div
                      class="soreal-idle-note-v4"
                      id="sorealIdleJoueurPvV15"
                      style="text-align:center"
                    >
                      ❤️ ${formatGrandNombreIdleV70_(j.pvJoueur)}
                      / ${formatGrandNombreIdleV70_(j.pvJoueurMax)}
                    </div>

                    <div class="soreal-idle-playerbar-wrap-v15">
                      <div
                        id="sorealIdleJoueurBarV15"
                        class="soreal-idle-playerbar-v15${j.ko?' ko':''}"
                        style="width:${
                          idleNombre_(j.pvJoueurMax)>0
                            ?Math.max(0,Math.min(100,idleNombre_(j.pvJoueur)/idleNombre_(j.pvJoueurMax)*100))
                            :0
                        }%"
                      ></div>
                    </div>
                  </div>
                </div>

                <div class="soreal-idle-vs-v41">VS</div>

                <div class="soreal-idle-duel-fighter-v42">
                  <div
                    id="sorealIdleBossNomV61"
                    class="soreal-idle-duel-nameplate-v65 boss"
                  >
                    <div class="soreal-idle-duel-role-v65">
                      👹 BOSS #${idleEntier_(j.bossSelection||1)}
                    </div>
                    <div
                      id="sorealIdleBossNomTexteV65"
                      class="soreal-idle-duel-name-text-v65"
                    >
                      ${idleHtml_(j.bossActuel||'Boss')}
                    </div>
                  </div>

                  <div
                    id="sorealIdleBossImageHostV36"
                    class="soreal-idle-duel-portrait-v41"
                    data-boss-name="${idleHtml_(j.bossActuel||'Boss')}"
                  >
                    ${
                      markupImageCombatIdleV61_(
                        'boss',
                        j.bossDriveFileId,
                        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-169 */
                        j.bossImage||urlBossR2IdleV1_(idImageBossCanoniqueIdleV181_(j)),
                        j.bossActuel||'Boss',
                        'soreal-idle-boss-image-v35',
                        j.bossActuel||'Boss'
                      ) ||
                      '<div style="font-size:74px">👹</div>'
                    }
                  </div>

                  <div class="soreal-idle-duel-hp-v41">
                    <div
                      class="soreal-idle-note-v4"
                      id="sorealIdleBossPvV7"
                      style="text-align:center"
                    >
                      ❤️ ${formatGrandNombreIdleV70_(j.bossPv)}
                      / ${formatGrandNombreIdleV70_(j.bossPvMax)}
                    </div>

                    <div class="soreal-idle-bossbar-wrap-v7">
                      <div
                        id="sorealIdleBossBarV7"
                        class="soreal-idle-bossbar-v7"
                        style="width:${
                          idleNombre_(j.bossPvMax)>0
                            ?Math.max(0,Math.min(100,idleNombre_(j.bossPv)/idleNombre_(j.bossPvMax)*100))
                            :0
                        }%"
                      ></div>
                    </div>
                  </div>

                  ${capacitesBossMarkupIdleV70_(j)}
                </div>
              </div>

            </div>

            <!--
              Correctif 2026-09-18 (Norman, en direct : "je veux le bouton
              fight, fuite etc en dessous des barres de vie des combats.
              Et le texte en dessous des boutons.") -- .soreal-idle-boss-
              controls-v39 (Fight/Fuite/NUKE) vivait après le slot K.O. ET
              le texte de respawn ; les deux textes vivent désormais APRÈS
              les boutons, jamais avant. Champs/logique inchangés, seule
              la position bouge.
            -->
            <div class="soreal-idle-boss-controls-v39">
              <button
                type="button"
                id="sorealIdleBossStartV100"
                class="soreal-idle-boss-control-v39 start"
                onclick="window.__definirCombatBossIdleV39__(true)"
                ${
                  j.combatBossActif||
                  j.bossBloqueRenaissance||
                  idleNombre_(j.pvJoueur)<=0
                    ?'disabled'
                    :''
                }
              >
                ⚔️ Fight
              </button>

              <button
                type="button"
                class="soreal-idle-boss-control-v39 stop"
                onclick="window.__definirCombatBossIdleV39__(false)"
                ${j.combatBossActif?'':'disabled'}
              >
                🏃 Fuite
              </button>

              <button
                type="button"
                id="sorealIdleBossNukeV1"
                class="soreal-idle-boss-control-v39 nuke"
                onclick="window.__nukerBossIdleV1__()"
                title="NUKE : ton Attaque doit dépasser 5× la Défense du boss ET ta Défense dépasser 5× son Attaque."
                ${
                  j.bossBloqueRenaissance||
                  !bossNukableIdleV198_(j)
                    ?'disabled'
                    :''
                }
              >
                🚀 NUKE
              </button>
            </div>

            <!--
              V168 — NGU garde le battle log pour Adventure ; Fight Boss
              affiche à la place la Story liée au boss. bossHistoire est la
              même donnée que Collection/bossCatalogue.histoire, donc aucune
              deuxième source de vérité n'est créée ici.
            -->
            ${histoireBossMarkupIdleV142_(j)}


            <div
              id="sorealIdleBossRespawnV100"
              class="soreal-idle-boss-respawn-v100 ready"
            ></div>

            ${barreSortsCombatIdleV90_(j)}

            <div class="soreal-idle-reward-v8">
              <span class="soreal-idle-chip-v8">
                +${idleEntier_(j.recompenseBossActuel&&j.recompenseBossActuel.xp)} XP
                ${
                  idleNombre_(j.recompenseBossActuel&&j.recompenseBossActuel.xpMultiplicateur)<.999
                    ?' · '+Math.round(idleNombre_(j.recompenseBossActuel.xpMultiplicateur)*100)+' %'
                    :''
                }
              </span>
            </div>

            ${
              j.bossBloqueRenaissance
                ?'<div class="soreal-idle-rebirth-wall-v37">♻️ Ce boss exige au moins 1 Renaissance. Les boss déjà vaincus restent morts pour ce run.</div>'
                :''
            }
          </div>
        `;
      }


      function ligneEntrainementIdleV28_(
        j,
        type,
        emoji,
        nom,
        description
      ){
        const niveau=
          type==='force'
            ?j.force
            :type==='endurance'
              ?j.endurance
              :j.organisation;

        return `
          <div class="soreal-idle-training-row-v5">
            <div>
              <div class="soreal-idle-training-name-v5">
                ${emoji} ${nom} · niveau ${idleEntier_(niveau)}
                <span id="sorealIdlePendingV7_${type}"></span>
              </div>
              <div class="soreal-idle-training-meta-v5">
                ${description}
              </div>
            </div>

            <button
              type="button"
              class="soreal-idle-training-button-v5"
              data-idle-training="${type}"
              onclick="window.__acheterEntrainementIdleV5__('${type}')"
              ${peutAcheterIdleV5_(j,type)?'':'disabled'}
            >
              ${idleEntier_(coutIdleV5_(j,type))} ⚡
            </button>
          </div>
        `;
      }


      function skillBasicTrainingIdleV120_(
        j,
        skill
      ){
        if(!skill)return '';

        if(!skill.unlocked){
          const precedent=
            (
              j.basicTraining &&
              Array.isArray(j.basicTraining.skills)
            )
              ?j.basicTraining.skills.find(function(x){
                  return x.id===skill.prerequisite;
                })
              :null;

          return `
            <div class="soreal-idle-bt-row-v120 locked">
              <div class="soreal-idle-bt-main-v120">
                <div class="soreal-idle-bt-name-v120">
                  🔒 ???????
                </div>
                <div class="soreal-idle-bt-lock-v120">
                  Requiert ${formatGrandNombreIdleV70_(skill.prerequisiteLevel)}
                  niveaux en ${idleHtml_(precedent&&precedent.name||'compétence précédente')}.
                </div>
              </div>
              <div class="soreal-idle-bt-level-v120">0</div>
              <div class="soreal-idle-bt-allocation-v120">0 ⚡</div>
              <div class="soreal-idle-bt-actions-v120">
                <button disabled>+</button>
                <button disabled>−</button>
                <button disabled>Cap</button>
              </div>
            </div>
          `;
        }

        const vitesseInitiale=
          Math.max(
            0,
            idleNombre_(skill.levelsPerSecond)
          );

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-170 */
        const pourcentageInitial=
          vitesseInitiale>0
            ?Math.max(0,Math.min(100,idleNombre_(skill.progress)*100))
            :0;

        return `
          <div
            class="soreal-idle-bt-row-v120 ${idleHtml_(skill.group||'')}"
            data-basic-training-skill="${idleHtml_(skill.id)}"
          >
            <div class="soreal-idle-bt-main-v120">
              <div class="soreal-idle-bt-name-v120">
                ${idleHtml_(skill.name)}
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
                    ${idleEntier_(skill.cap)}
                  </strong> ⚡
                  · prochain :
                  <strong
                    id="sorealIdleBtNextCapV120_${idleHtml_(skill.id)}"
                    class="${skill.maxReductionReached?'ready':''}"
                  >
                    ${idleEntier_(skill.nextCap||skill.cap)}
                  </strong>
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
              ${idleEntier_(skill.allocation)} ⚡
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
                onclick="window.__ajusterBasicTrainingIdleV120__('${idleHtml_(skill.id)}','cap')"
              >Cap</button>
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
            'Affecte ton énergie aux barres. Elle n’est pas dépensée : retire-la et réaffecte-la quand tu veux.'
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
              <label for="sorealIdleTrainingInputV120">Input</label>
              <input
                id="sorealIdleTrainingInputV120"
                type="number"
                inputmode="numeric"
                min="1"
                step="1"
                value="125"
              >
            </div>

            <div class="soreal-idle-bt-presets-v120">
              <span>Energy Cap</span>
              <button type="button" onclick="window.__presetBasicTrainingIdleV120__('cap',1)">Cap</button>
              <button type="button" onclick="window.__presetBasicTrainingIdleV120__('cap',.5)">1/2</button>
              <button type="button" onclick="window.__presetBasicTrainingIdleV120__('cap',.25)">1/4</button>
            </div>

            <div class="soreal-idle-bt-presets-v120">
              <span>Idle</span>
              <button type="button" onclick="window.__presetBasicTrainingIdleV120__('idle',.5)">1/2</button>
              <button type="button" onclick="window.__presetBasicTrainingIdleV120__('idle',.25)">1/4</button>
              <button type="button" class="clear" onclick="window.__viderBasicTrainingIdleV120__()">Tout retirer</button>
            </div>
          </div>

          <div class="soreal-idle-bt-help-v120">
            Les niveaux gagnés préparent une baisse du Cap pour la prochaine Renaissance,
            jusqu’à −10 % par compétence et par cycle. Pendant le run, le Cap reste fixe.
            L’énergie placée au-dessus du Cap n’accélère jamais la barre au-delà de 50 niveaux/s.
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

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-171 */
      let idleCollectionOngletV1='boss';

      function changerOngletCollectionIdleV1_(onglet){
        idleCollectionOngletV1=String(onglet||'boss');
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(root&&idleEtat)root.innerHTML=contenuMenuIdleV28_(idleEtat);
      }
      window.__changerOngletCollectionIdleV1__=changerOngletCollectionIdleV1_;

      function rendreCollectionCreaturesIdleV1_(entrees,vide){
        if(!entrees.length){
          return '<div class="soreal-idle-empty-v10">'+idleHtml_(vide)+'</div>';
        }

        return '<div class="soreal-idle-bestiary-grid-v110">'+
          entrees.map(function(e){
            if(!e||!e.decouvert){
              return `
                <div class="soreal-idle-bestiary-card-v110 unknown">
                  <div class="soreal-idle-bestiary-emoji-v110">❔</div>
                  <div class="soreal-idle-bestiary-name-v110">???????</div>
                  <div class="soreal-idle-bestiary-type-v110">Entrée inconnue</div>
                </div>
              `;
            }

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-172 */
            const image=
              idleEntier_(e.numero)>0
                ?urlBossR2IdleV1_(idleEntier_(e.numero))
                :(e.zone
                  ?urlMobR2IdleV1_(e.zone,e.boss,e.index,e.nom)
                  :(e.driveFileId
                    ?'https://lh3.googleusercontent.com/d/'+encodeURIComponent(e.driveFileId)+'=w600'
                    :String(e.image||'')));

            return `
              <div class="soreal-idle-bestiary-card-v110${e.rare?' rare-found':''}">
                ${
                  image
                    ?'<div class="soreal-idle-bestiary-image-v120"><img src="'+idleHtml_(image)+'" alt="'+idleHtml_(e.nom||'Créature')+'" '+
                      'onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'flex\'">'+
                      '<div class="soreal-idle-bestiary-emoji-v110" style="display:none">'+idleHtml_(e.emoji||'👾')+'</div></div>'
                    :'<div class="soreal-idle-bestiary-emoji-v110">'+idleHtml_(e.emoji||'👾')+'</div>'
                }
                <div class="soreal-idle-bestiary-name-v110">
                  ${idleHtml_(e.nom||'Créature')}
                </div>
                <div class="soreal-idle-bestiary-type-v110">
                  ${idleHtml_(e.categorie||'Créature')}
                </div>
                <div class="soreal-idle-bestiary-meta-v110">
                  ${idleNombre_(e.pv)>0?'❤️ '+formatGrandNombreIdleV70_(e.pv):''}
                  ${idleNombre_(e.attaque)>0?'· ⚔️ '+formatGrandNombreIdleV70_(e.attaque)+' attaque':''}
                  ${idleNombre_(e.defense)>0?'· 🛡️ '+formatGrandNombreIdleV70_(e.defense)+' défense':''}
                  ${idleNombre_(e.regen)>0?'· 💚 '+formatGrandNombreIdleV70_(e.regen)+' regen':''}
                  ${idleNombre_(e.cadence)>0?'· ⏱️ '+idleNombre_(e.cadence)+' s':''}
                  ${e.typeMob&&e.typeMob!=='normal'?'· '+idleHtml_(e.typeMob):''}
                  ${e.numero>0?'· ✨ '+idleEntier_(e.xp)+' EXP':''}
                  · 👁️ ${idleEntier_(e.rencontres)} rencontre${idleEntier_(e.rencontres)>1?'s':''}
                </div>
                ${e.description
                  ?'<div id="'+
                    (idleEntier_(e.numero)>0
                      ?'sorealIdleCollectionBossStoryV206_'+idleEntier_(e.numero)
                      :'sorealIdleCollectionCreatureDescV206_'+idleEntier_(e.index))+
                    '" class="soreal-idle-bestiary-desc-v110"'+
                    (idleEntier_(e.numero)>0?' data-soreal-tts-chronique="'+idleHtml_(e.nom||'Boss')+'"':'')+
                    '>'+idleHtml_(e.description)+'</div>'
                  :''}
                ${idleEntier_(e.numero)>0&&e.description
                  ?'<button type="button" class="soreal-idle-tts-read-v203" data-soreal-tts-target="sorealIdleCollectionBossStoryV206_'+idleEntier_(e.numero)+'">🔊 Lire cette chronique</button>'
                  :''}
              </div>
            `;
          }).join('')+
        '</div>';
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-173 */
      const IDLE_COLLECTION_BOOST_RE_V1=/^boost:([a-z]+):(\d+)$/;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-174 */
      let idlePageCollectionEquipementV1=1;
      function changerPageCollectionEquipementV1_(page){
        idlePageCollectionEquipementV1=Math.max(1,idleEntier_(page)||1);
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(root&&idleEtat)root.innerHTML=contenuMenuIdleV28_(idleEtat);
      }
      window.__changerPageCollectionEquipementV1__=changerPageCollectionEquipementV1_;

      function rendreCollectionEquipementIdleV1_(itemList,catalog,completedSets,cube){
        const setsDemarres=new Set(
          Object.keys(itemList).map(function(id){
            const def=catalog[id];
            return def&&def.kind==='equipment'&&itemList[id]&&itemList[id].seen
              ?String(def.set||'')
              :'';
          }).filter(Boolean)
        );
        const idsEquipementToutes=Object.keys(catalog).filter(function(id){
          const def=catalog[id];
          if(!def)return false;
          if(def.kind==='equipment'){
            /* ANTI-SPOIL (2026-09-24) : seulement les pièces déjà obtenues, jamais les cases vides du set. */
            return Boolean(itemList[id])&&setsDemarres.has(String(def.set||''));
          }
          return Boolean(itemList[id]&&itemList[id].seen);
        });
        const idsBoosts=Object.keys(itemList).filter(function(id){
          return IDLE_COLLECTION_BOOST_RE_V1.test(id);
        });

        const totalPagesEquipement=Math.max(1,Math.ceil(idsEquipementToutes.length/IDLE_PAGINATION_TAILLE_V1));
        if(idlePageCollectionEquipementV1>totalPagesEquipement)idlePageCollectionEquipementV1=totalPagesEquipement;
        const debutPageEquipement=(idlePageCollectionEquipementV1-1)*IDLE_PAGINATION_TAILLE_V1;
        const idsEquipement=idsEquipementToutes.slice(debutPageEquipement,debutPageEquipement+IDLE_PAGINATION_TAILLE_V1);

        const setsConnus=Object.keys(completedSets).filter(function(setId){
          const idsDuSet=Object.keys(catalog).filter(function(id){
            const def=catalog[id];
            return Boolean(def&&def.kind==='equipment'&&String(def.set||'')===String(setId));
          });
          return Boolean(
            idsDuSet.length&&
            idsDuSet.every(function(id){
              return Boolean(itemList[id]&&itemList[id].fullyMaxed);
            })
          );
        }).map(function(setId){
          const entree=Object.values(catalog).filter(function(c){
            return c&&String(c.set||'')===String(setId);
          })[0];
          return idleHtml_(entree?entree.setName:setId);
        });

        const setsHtml=setsConnus.length
          ?'<div class="soreal-idle-collection-sets-v1"><b>🏅 Sets complétés (100 % boostés)</b><div>'+setsConnus.join(' · ')+'</div></div>'
          :'';

        const cubeHtml=cube&&cube.unlocked
          ?'<div class="soreal-idle-collection-cube-v1">🧊 <b>Cube de l’infini</b> — Power '+formatGrandNombreIdleV70_(cube.power||0)+' · Toughness '+formatGrandNombreIdleV70_(cube.toughness||0)+'</div>'
          :'';

        const grilleEquipement='<div class="soreal-idle-collection-grid-v1">'+
          idsEquipement.map(function(id){
            const def=catalog[id];
            const info=itemList[id];

            if(!info){
              return '<div class="soreal-idle-collection-card-v1 locked">'+
                '<div class="soreal-idle-collection-card-icon-v1"><span>❔</span></div>'+
                '<div class="soreal-idle-collection-card-name-v1">???</div>'+
              '</div>';
            }

            const niveau=idleEntier_(info.maxLevel);
            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-175 */
            const maxAtteint=Boolean(info.fullyMaxed);
            const nom=def.name;
            const estEquipement=def.kind==='equipment';
            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-176 */
            const estStatBearing=estEquipement||def.kind==='special'||def.kind==='cube';
            const pseudoItem=estEquipement
              ?{set:def.set,slot:def.slot,name:def.name,definitionId:id,wikiItemId:def.wikiItemId||0,kind:'equipment',level:niveau}
              :(def.kind==='cube'?{set:'',slot:def.slot||'special',name:def.name,definitionId:id,wikiItemId:def.wikiItemId||0,kind:'cube',level:niveau}:null);
            const puissance=estStatBearing?Math.round(idleNombre_(def.basePower)*(1+niveau/100)):0;
            const solidite=estStatBearing?Math.round(idleNombre_(def.baseToughness)*(1+niveau/100)):0;
            const rareteClasse=idleRareteClasseObjetAdventureIdleV1_(def);

            return '<div class="soreal-idle-collection-card-v1'+(maxAtteint?' maxed':'')+(rareteClasse?' '+rareteClasse:'')+'" '+
              'onclick="window.__afficherDetailsCollectionIdleV1__(\''+idleHtml_(id)+'\')">'+
              (maxAtteint?'<div class="soreal-idle-collection-check-v1" title="Niveau 100 + statistiques boostées à 100 %">✔</div>':'')+
              '<div class="soreal-idle-collection-card-icon-v1">'+
                (pseudoItem?iconeObjetAdventureIdleV138_(pseudoItem):'<span>'+(def.kind==='cube'?'🧊':'✨')+'</span>')+
              '</div>'+
              '<div class="soreal-idle-collection-card-name-v1">'+idleHtml_(nom)+'</div>'+
              (estEquipement
                ?'<div class="soreal-idle-collection-card-level-v1">Niv. '+niveau+'/100</div>'
                :'')+
              '<div class="soreal-idle-collection-card-details-v1" id="soreal-idle-collection-details-'+idleHtml_(id)+'" style="display:none">'+
                (estStatBearing
                  ?'<div>Power '+formatGrandNombreIdleV70_(puissance)+'</div><div>Toughness '+formatGrandNombreIdleV70_(solidite)+'</div>'
                  :'<div>Objet spécial</div>')+
              '</div>'+
            '</div>';
          }).join('')+
        '</div>'+
        rendrePaginationIdleV1_(idlePageCollectionEquipementV1,totalPagesEquipement,'window.__changerPageCollectionEquipementV1__');

        const grilleBoosts=idsBoosts.length
          ?'<div class="soreal-idle-collection-sets-v1"><b>⚡ Boosts obtenus</b></div>'+
            '<div class="soreal-idle-collection-grid-v1">'+
            idsBoosts.map(function(id){
              const m=IDLE_COLLECTION_BOOST_RE_V1.exec(id);
              const type=m[1],force=m[2];
              const nomBoost='Boost '+type.charAt(0).toUpperCase()+type.slice(1)+' +'+force;
              return '<div class="soreal-idle-collection-card-v1">'+
                '<div class="soreal-idle-collection-card-icon-v1">'+
                  iconeObjetAdventureIdleV138_({kind:'boost',boostType:type,strength:force})+
                '</div>'+
                '<div class="soreal-idle-collection-card-name-v1">'+idleHtml_(nomBoost)+'</div>'+
              '</div>';
            }).join('')+
            '</div>'
          :'';

        return setsHtml+cubeHtml+grilleEquipement+grilleBoosts;
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-177 */
      function afficherDetailsCollectionIdleV1_(id){
        const el=document.getElementById('soreal-idle-collection-details-'+id);
        if(!el)return;
        el.style.display=el.style.display==='none'?'block':'none';
      }
      window.__afficherDetailsCollectionIdleV1__=afficherDetailsCollectionIdleV1_;

      function lireHistoireCompleteBossIdleV206_(){
        if(!idleEtat)return;

        const catalogue=
          Array.isArray(idleEtat.bossCatalogue)
            ?idleEtat.bossCatalogue
            :[];

        const connus=catalogue
          .filter(function(b){
            return b&&b.connu&&String(b.histoire||'').trim();
          })
          .sort(function(a,b){
            return idleEntier_(a.numero)-idleEntier_(b.numero);
          });

        if(!connus.length){
          toastIdleV5_('Aucune chronique de boss débloquée.');
          return;
        }

        const tts=
          window.__SOREAL_IDLE_TUTORIAL_TTS_V203__||
          window.__SOREAL_IDLE_TUTORIAL_TTS_V202__;

        if(!tts||typeof tts.readText!=='function'){
          toastIdleV5_('Lecture vocale indisponible sur cet appareil.');
          return;
        }

        if(typeof tts.isSpeaking==='function'&&tts.isSpeaking()){
          if(typeof tts.stop==='function')tts.stop();
          return;
        }

        /*
         * 2026-09-24 : chaque boss est composé EXACTEMENT comme sa chronique affichée (titre, nom, notes, récit, avec les mêmes pauses),
         * séparé du suivant par 2 s : les blocs de texte sont donc ceux des voix pré-générées (aucun calcul, aucun modèle à charger).
         */
        const M=function(ms){return ' \uE000'+ms+'\uE001 ';};
        const composerChronique=typeof tts.composerChronique==='function'
          ?tts.composerChronique
          :function(nom,histoire){return nom+' '+histoire;};
        tts.readText(
          'Chroniques de boss.'+M(1500)+
          connus.map(function(b){
            return composerChronique(String(b.nom||'Boss'),String(b.histoire||''));
          }).join(M(2000))
        );
      }


      window.__lireHistoireCompleteBossIdleV206__=
        lireHistoireCompleteBossIdleV206_;


      function pageBestiaireIdleV110_(j){
        const b=
          j&&j.bestiaire
            ?j.bestiaire
            :{
                debloquee:false,
                niveauRequis:2,
                decouvertes:0,
                entrees:[]
              };

        if(!b.debloquee){
          return `
            ${entetePageIdleV28_(
              '🏆 ???????',
              'Ce registre n’est pas encore accessible.'
            )}
            <div class="soreal-idle-empty-v10">
              🔒 Niveau ${idleEntier_(b.niveauRequis||2)} requis.
            </div>
          `;
        }

        const entrees=
          Array.isArray(b.entrees)
            ?b.entrees
            :[];
        const bossEntrees=entrees.filter(function(e){return e&&e.source==='boss';});
        const aventureEntrees=entrees.filter(function(e){return e&&e.source==='aventure';});

        const a=aventureMetaIdleV47_(j);
        const itemList=a&&a.itemList&&typeof a.itemList==='object'?a.itemList:{};
        const catalog=a&&a.itemCatalog&&typeof a.itemCatalog==='object'?a.itemCatalog:{};
        const completedSets=a&&a.completedSets&&typeof a.completedSets==='object'?a.completedSets:{};
        const cube=a&&a.cube||{};

        const onglet=idleCollectionOngletV1||'boss';
        const decouvertesBoss=bossEntrees.filter(function(e){return e.decouvert;}).length;
        const decouvertesAventure=aventureEntrees.filter(function(e){return e.decouvert;}).length;
        const itemsObtenus=Object.keys(itemList).length;

        return `
          ${entetePageIdleV28_(
            '🏆 Collection',
            'Chaque créature se révèle après une véritable rencontre — chaque objet dès sa première obtention.'
          )}

          <div class="soreal-idle-collection-tabs-v1">
            <button class="soreal-idle-collection-tab-v1${onglet==='boss'?' active':''}" onclick="window.__changerOngletCollectionIdleV1__('boss')">
              👹 Boss <span>${decouvertesBoss}</span>
            </button>
            <button class="soreal-idle-collection-tab-v1${onglet==='aventure'?' active':''}" onclick="window.__changerOngletCollectionIdleV1__('aventure')">
              🗺️ Aventure <span>${decouvertesAventure}</span>
            </button>
            <button class="soreal-idle-collection-tab-v1${onglet==='equipement'?' active':''}" onclick="window.__changerOngletCollectionIdleV1__('equipement')">
              🗡️ Équipement <span>${itemsObtenus}</span>
            </button>
            <button class="soreal-idle-collection-tab-v1${onglet==='sets'?' active':''}" onclick="window.__changerOngletCollectionIdleV1__('sets')">
              📚 Sets
            </button>
          </div>

          ${onglet==='boss'
            ?'<div class="soreal-idle-section-v8" style="margin-bottom:10px">'+
              '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__lireHistoireCompleteBossIdleV206__()">🔊 Lire toute l’histoire des boss débloqués</button>'+
              '</div>'+
              rendreCollectionCreaturesIdleV1_(bossEntrees,'Aucun boss vaincu pour l’instant.')
            :''}
          ${onglet==='aventure'?rendreCollectionCreaturesIdleV1_(aventureEntrees,'Aucune rencontre d’Aventure pour l’instant.'):''}
          ${onglet==='equipement'?rendreCollectionEquipementIdleV1_(itemList,catalog,completedSets,cube):''}
          ${onglet==='sets'?rendreCollectionIdleV22_(j):''}
        `;
      }


      
      function aventureMetaIdleV47_(j){
        return j&&j.systemes&&j.systemes.adventure&&typeof j.systemes.adventure==='object'
          ?j.systemes.adventure
          :null;
      }

      function aventureDebloqueeIdleV47_(j){
        const a=aventureMetaIdleV47_(j);
        const zones=a&&Array.isArray(a.zones)?a.zones:[];
        return zones.some(function(z){return z&&z.id==='tutorial'&&z.unlocked;});
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-178 */
      const IDLE_INVENTORY_ACTIONS_V160=new Set([
        'equip','unequip','merge','boost','cube','discard','setLock',
        'trashPut','trashRecover','coffreDeposer','coffreRetirer','reorderInventory'
      ]);
      let idleInventoryMutationQueueV160=[];
      let idleInventoryBusyV160=false;
      let idleInventorySequenceV160=0;
      let idleInventoryConfirmedAdventureV160=null;
      let idleInventoryDeferredPatchV160=false;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-179 */
      let idleAdventureRevisionServeurV208=0;
      let idleAdventureSnapshotDiffereV208=null;

      const IDLE_ADVENTURE_INVENTORY_FIELDS_V208=[
        'inventory','inventorySlots','equipment','itemList',
        'completedSets','setRewards','permanent','unlockItems','unlockFlags',
        'skillState','cube','cubeTier','inventoryCapacity','inventoryUsed',
        'accessorySlotsCapacity','stats','trash','coffreSlots'
      ];

      function revisionAdventureServeurIdleV208_(a){
        return Math.max(0,idleEntier_(a&&a.revision));
      }

      function fusionnerAdventureServeurAvecInventaireLocalV208_(serveur,local){
        if(!serveur)return serveur;
        if(!local)return cloneInventaireIdleV160_(serveur);
        const fusion=cloneInventaireIdleV160_(serveur);
        IDLE_ADVENTURE_INVENTORY_FIELDS_V208.forEach(function(cle){
          if(Object.prototype.hasOwnProperty.call(local,cle)){
            fusion[cle]=cloneInventaireIdleV160_(local[cle]);
          }
        });
        return fusion;
      }

      function joueurAvecAdventureIdleV208_(joueur,aventure){
        if(!joueur||!aventure)return joueur;
        const copie=Object.assign({},joueur);
        copie.systemes=Object.assign({},joueur.systemes||{});
        copie.systemes.adventure=aventure;
        return copie;
      }

      function memoriserAdventureDiffereeIdleV208_(aventure){
        if(!aventure)return;
        const revision=revisionAdventureServeurIdleV208_(aventure);
        const precedente=revisionAdventureServeurIdleV208_(
          idleAdventureSnapshotDiffereV208
        );
        if(!idleAdventureSnapshotDiffereV208||revision>precedente){
          idleAdventureSnapshotDiffereV208=
            cloneInventaireIdleV160_(aventure);
        }
      }

      function protegerJoueurServeurInventaireIdleV208_(joueur){
        if(!joueur)return joueur;
        const serveur=aventureMetaIdleV47_(joueur);
        if(!serveur)return joueur;

        const revision=revisionAdventureServeurIdleV208_(serveur);
        const local=idleEtat?aventureMetaIdleV47_(idleEtat):null;
        const mutationEnCours=Boolean(
          idleInventoryBusyV160||
          idleInventoryMutationQueueV160.length
        );

        if(mutationEnCours&&local){
          memoriserAdventureDiffereeIdleV208_(serveur);
          idleAdventureRevisionServeurV208=Math.max(
            idleAdventureRevisionServeurV208,
            revision
          );
          return joueurAvecAdventureIdleV208_(
            joueur,
            fusionnerAdventureServeurAvecInventaireLocalV208_(
              serveur,
              local
            )
          );
        }

        if(
          local&&
          revision<idleAdventureRevisionServeurV208
        ){
          return joueurAvecAdventureIdleV208_(
            joueur,
            fusionnerAdventureServeurAvecInventaireLocalV208_(
              serveur,
              local
            )
          );
        }

        idleAdventureRevisionServeurV208=Math.max(
          idleAdventureRevisionServeurV208,
          revision
        );
        idleInventoryConfirmedAdventureV160=
          cloneInventaireIdleV160_(serveur);
        return joueur;
      }

      function appliquerAdventureDiffereeIdleV208_(){
        if(
          idleInventoryBusyV160||
          idleInventoryMutationQueueV160.length||
          !idleAdventureSnapshotDiffereV208||
          !idleEtat
        ){
          return false;
        }

        const differee=idleAdventureSnapshotDiffereV208;
        idleAdventureSnapshotDiffereV208=null;

        const revisionDifferee=
          revisionAdventureServeurIdleV208_(differee);
        const revisionConfirmee=
          revisionAdventureServeurIdleV208_(
            idleInventoryConfirmedAdventureV160
          );

        if(revisionDifferee<=revisionConfirmee){
          return false;
        }

        const courant=aventureMetaIdleV47_(idleEtat);
        const fightLocal=
          courant&&courant.fight&&courant.fight.active
            ?cloneInventaireIdleV160_(courant.fight)
            :null;
        const prochain=cloneInventaireIdleV160_(differee);
        if(fightLocal)prochain.fight=fightLocal;

        idleEtat.systemes=Object.assign({},idleEtat.systemes||{});
        idleEtat.systemes.adventure=prochain;
        idleInventoryConfirmedAdventureV160=
          cloneInventaireIdleV160_(differee);
        idleAdventureRevisionServeurV208=Math.max(
          idleAdventureRevisionServeurV208,
          revisionDifferee
        );

        pousserEtatVersRuntimePartageIdleV1_();
        patchInventaireAdventureIdleV160_(
          idleEtat,
          {action:'reconcile-v208',confirmed:true}
        );
        return true;
      }

      const idleInventoryPerfV160={
        patches:0,
        nodesCreated:0,
        nodesReused:0,
        globalRenders:0,
        globalRendersAvoided:0,
        lastOptimisticMs:0,
        lastNetworkMs:0,
        lastReconcileMs:0
      };
      window.__SOREAL_IDLE_INVENTORY_PERF_V160__=idleInventoryPerfV160;

      function cloneInventaireIdleV160_(value){
        if(value==null)return value;
        if(typeof structuredClone==='function'){
          try{return structuredClone(value);}catch(_e){}
        }
        return JSON.parse(JSON.stringify(value));
      }

      function estMutationInventaireAdventureIdleV160_(payload){
        return Boolean(
          payload&&
          IDLE_INVENTORY_ACTIONS_V160.has(String(payload.action||''))
        );
      }

      function marquePerfInventaireIdleV160_(nom,id){
        try{
          if(window.performance&&typeof performance.mark==='function'){
            performance.mark('soreal-idle-inventory-v160:'+nom+':'+String(id||0));
          }
        }catch(_e){}
      }

      function mesurePerfInventaireIdleV160_(nom,debut,fin,id){
        try{
          if(!window.performance||typeof performance.measure!=='function')return 0;
          const prefix='soreal-idle-inventory-v160:';
          const mesure=prefix+nom+':'+String(id||0);
          performance.measure(
            mesure,
            prefix+debut+':'+String(id||0),
            prefix+fin+':'+String(id||0)
          );
          const entries=performance.getEntriesByName(mesure);
          return entries.length?entries[entries.length-1].duration:0;
        }catch(_e){
          return 0;
        }
      }

      function signatureObjetInventaireIdleV160_(item){
        if(!item)return '';
        return encodeURIComponent(JSON.stringify([
          item.id,item.definitionId,item.kind,item.level,item.power,
          item.toughness,item.special,item.specialType,item.strength,
          item.boostType,item.basePower,item.baseToughness,item.wikiItemId,
          item.name,item.nom,item.slot,item.set,Boolean(item.locked),item._idlePendingV160||0
        ]));
      }

      function construirePlanSacIdleV160_(items,capacite){
        const liste=Array.isArray(items)?items:[];
        const cap=Math.max(0,Math.floor(Number(capacite)||0));
        const total=Math.max(cap,liste.length);
        const plan=[];
        for(let i=0;i<total;i+=1){
          const item=liste[i]||null;
          plan.push(
            item
              ?{
                  key:'item:'+String(item.id||''),
                  version:signatureObjetInventaireIdleV160_(item),
                  item:item,
                  index:i
                }
              :{
                  key:'empty:'+String(i),
                  version:'empty',
                  item:null,
                  index:i
                }
          );
        }
        return plan;
      }

      function casesSacAdventureIdleV162_(a){
        if(!a)return [];
        const items=Array.isArray(a.inventory)?a.inventory:[];
        const equipment=a.equipment||{};
        const itemById=new Map(items.map(function(item){
          return [String(item&&item.id||''),item];
        }));
        const equipes=new Set();
        ADVENTURE_CORE_SLOTS_V138.forEach(function(slot){
          const id=equipment[slot];
          if(id)equipes.add(String(id));
        });
        (Array.isArray(equipment.accessories)?equipment.accessories:[])
          .forEach(function(id){if(id)equipes.add(String(id));});

        const capacite=Math.max(0,idleEntier_(a.inventoryCapacity||24));
        const cases=Array(capacite).fill(null);
        const places=new Set();
        const ordre=Array.isArray(a.inventorySlots)?a.inventorySlots:[];

        for(let i=0;i<Math.min(capacite,ordre.length);i+=1){
          const id=String(ordre[i]||'');
          const item=id?itemById.get(id):null;
          if(item&&!equipes.has(id)&&!places.has(id)){
            cases[i]=item;
            places.add(id);
          }
        }

        items.forEach(function(item){
          const id=String(item&&item.id||'');
          if(!id||equipes.has(id)||places.has(id))return;
          const libre=cases.indexOf(null);
          if(libre>=0){
            cases[libre]=item;
            places.add(id);
          }
        });
        return cases;
      }

      function modeleInventaireAdventureIdleV160_(j){
        const a=aventureMetaIdleV47_(j);
        if(!a)return null;
        const items=Array.isArray(a.inventory)?a.inventory:[];
        const equipment=a.equipment||{};
        const itemById=new Map(items.map(function(i){return [String(i.id),i];}));
        const sacItems=casesSacAdventureIdleV162_(a);
        const capacite=Math.max(0,idleEntier_(a.inventoryCapacity||24));
        const utilise=idleEntier_(
          a.inventoryUsed!=null?a.inventoryUsed:sacItems.filter(Boolean).length
        );
        return {
          a:a,
          items:items,
          equipment:equipment,
          itemById:itemById,
          sacItems:sacItems,
          capacite:capacite,
          utilise:utilise,
          cube:a.cube||{},
          cubeTier:a.cubeTier,
          accessorySlotsCapacity:idleEntier_(a.accessorySlotsCapacity||2)
        };
      }

      function noeudDepuisHtmlInventaireIdleV160_(html){
        const template=document.createElement('template');
        template.innerHTML=String(html||'').trim();
        return template.content.firstElementChild||null;
      }

      function noeudVideSacInventaireIdleV160_(index){
        const node=document.createElement('div');
        node.className='soreal-idle-v138-bag-card soreal-idle-v138-bag-card-vide';
        node.dataset.emptySlotV160=String(index);
        node.dataset.slotIndex=String(index);
        node.setAttribute('ondragover','window.__survolCibleAdventureIdleV138__(event)');
        node.setAttribute('ondragleave','window.__quitterCibleAdventureIdleV138__(event)');
        node.setAttribute('ondrop','window.__deposerSurEmplacementVideSacAdventureIdleV1__(event,'+String(index)+')');
        return node;
      }

      function patchGrilleSacInventaireIdleV160_(modele){
        const root=document.querySelector(
          '#soreal-idle-v138-bag-section .soreal-idle-v138-bag'
        );
        if(!root||!modele)return false;

        const existants=Array.from(root.children);
        const parId=new Map();
        const vides=[];
        existants.forEach(function(node){
          const id=node&&node.dataset?String(node.dataset.itemId||''):'';
          if(id)parId.set(id,node);
          else vides.push(node);
        });

        const plan=construirePlanSacIdleV160_(
          modele.sacItems,
          modele.capacite
        );
        const fragment=document.createDocumentFragment();

        plan.forEach(function(desc){
          let node=null;
          if(desc.item){
            const id=String(desc.item.id||'');
            const courant=parId.get(id)||null;
            if(
              courant&&
              courant.dataset&&
              courant.dataset.itemVersion===desc.version
            ){
              node=courant;
              node.dataset.slotIndex=String(desc.index);
              idleInventoryPerfV160.nodesReused+=1;
            }else{
              node=noeudDepuisHtmlInventaireIdleV160_(
                rendreCarteSacAdventureIdleV138_(desc.item,desc.index)
              );
              idleInventoryPerfV160.nodesCreated+=1;
            }
          }else{
            node=vides.shift()||noeudVideSacInventaireIdleV160_(desc.index);
            if(node){
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-180 */
              node.dataset.emptySlotV160=String(desc.index);
              node.dataset.slotIndex=String(desc.index);
              node.setAttribute(
                'ondrop',
                'window.__deposerSurEmplacementVideSacAdventureIdleV1__(event,'+
                String(desc.index)+
                ')'
              );
              idleInventoryPerfV160.nodesReused+=1;
            }
          }
          if(node)fragment.appendChild(node);
        });

        root.replaceChildren(fragment);
        return true;
      }

      function htmlEquipementInventaireIdleV160_(modele){
        const accessoiresRendu=rendreAccessoiresAdventureIdleV138_(
          modele.equipment,
          modele.itemById,
          modele.accessorySlotsCapacity
        );
        return '<div class="soreal-idle-window-title-v31">🧍 Équipement</div>'+
          '<div class="soreal-idle-v138-paperdoll">'+
            accessoiresRendu.enGrille+
            rendreSlotPaperdollAdventureIdleV138_(
              'head','Casque',modele.itemById.get(String(modele.equipment.head))
            )+
            rendreSlotPaperdollAdventureIdleV138_(
              'chest','Torse',modele.itemById.get(String(modele.equipment.chest))
            )+
            rendreSlotPaperdollAdventureIdleV138_(
              'legs','Pantalon',modele.itemById.get(String(modele.equipment.legs))
            )+
            rendreSlotPaperdollAdventureIdleV138_(
              'boots','Bottes',modele.itemById.get(String(modele.equipment.boots))
            )+
            rendreSlotPaperdollAdventureIdleV138_(
              'weapon','Arme',modele.itemById.get(String(modele.equipment.weapon))
            )+
            rendreSlotCubeInfiniAdventureIdleV1_(modele.cube,modele.cubeTier)+
          '</div>'+
          accessoiresRendu.debordement;
      }

      function patchResumeInventaireIdleV160_(modele){
        if(!modele)return;
        const titreSac=document.querySelector(
          '#soreal-idle-v138-bag-section .soreal-idle-window-title-v31'
        );
        if(titreSac){
          titreSac.textContent='🎒 Sac ('+modele.utilise+' / '+modele.capacite+')';
        }
      }

      function cleSlotEquipementInventaireIdleV160_(node){
        if(!node||!node.classList)return '';
        const classes=[
          'soreal-idle-v138-slot-acc1',
          'soreal-idle-v138-slot-acc2',
          'soreal-idle-v138-slot-head',
          'soreal-idle-v138-slot-chest',
          'soreal-idle-v138-slot-legs',
          'soreal-idle-v138-slot-boots',
          'soreal-idle-v138-slot-weapon',
          'soreal-idle-v138-slot-cube'
        ];
        return classes.find(function(c){return node.classList.contains(c);})||'';
      }

      function slotEquipementIdentiqueIdleV160_(courant,voulu){
        if(!courant||!voulu)return false;
        const classesCourantes=Array.from(courant.classList)
          .filter(function(c){return c!=='selected'&&c!=='drag-over';})
          .sort()
          .join(' ');
        const classesVoulues=Array.from(voulu.classList)
          .filter(function(c){return c!=='selected'&&c!=='drag-over';})
          .sort()
          .join(' ');
        return (
          classesCourantes===classesVoulues&&
          String(courant.getAttribute('data-occupant-id')||'')===
            String(voulu.getAttribute('data-occupant-id')||'')&&
          courant.innerHTML===voulu.innerHTML
        );
      }

      function patchEquipementInventaireIdleV160_(modele){
        const root=document.querySelector(
          '.soreal-idle-v138-equipment-sticky'
        );
        if(!root||!modele)return false;

        const virtuel=document.createElement('div');
        virtuel.innerHTML=htmlEquipementInventaireIdleV160_(modele);

        const courantPaper=root.querySelector('.soreal-idle-v138-paperdoll');
        const vouluPaper=virtuel.querySelector('.soreal-idle-v138-paperdoll');
        if(!courantPaper||!vouluPaper)return false;

        const existants=new Map();
        Array.from(courantPaper.children).forEach(function(node){
          const key=cleSlotEquipementInventaireIdleV160_(node);
          if(key)existants.set(key,node);
        });

        const fragment=document.createDocumentFragment();
        Array.from(vouluPaper.children).forEach(function(voulu){
          const key=cleSlotEquipementInventaireIdleV160_(voulu);
          const courant=key?existants.get(key):null;
          if(courant&&slotEquipementIdentiqueIdleV160_(courant,voulu)){
            fragment.appendChild(courant);
            idleInventoryPerfV160.nodesReused+=1;
          }else{
            fragment.appendChild(voulu);
            idleInventoryPerfV160.nodesCreated+=1;
          }
        });
        courantPaper.replaceChildren(fragment);

        const courantOverflow=root.querySelector('.soreal-idle-v138-accessories');
        const vouluOverflow=virtuel.querySelector('.soreal-idle-v138-accessories');
        if(courantOverflow&&vouluOverflow){
          if(courantOverflow.innerHTML!==vouluOverflow.innerHTML){
            courantOverflow.replaceWith(vouluOverflow);
          }
        }else if(courantOverflow&&!vouluOverflow){
          courantOverflow.remove();
        }else if(!courantOverflow&&vouluOverflow){
          courantPaper.insertAdjacentElement('afterend',vouluOverflow);
        }

        return true;
      }

      function trouverSectionParTitreInventaireIdleV160_(texte){
        const titres=document.querySelectorAll(
          '.soreal-idle-page-root-v28 .soreal-idle-window-title-v31'
        );
        for(let i=0;i<titres.length;i+=1){
          if(String(titres[i].textContent||'').indexOf(texte)!==-1){
            return titres[i].closest('.soreal-idle-section-v8');
          }
        }
        return null;
      }

      function patchCoffreInventaireIdleV160_(modele){
        const section=document.querySelector('.soreal-idle-coffre-titre-v1');
        const root=section&&section.closest('.soreal-idle-section-v8');
        if(!root||!modele)return false;
        const nouveau=noeudDepuisHtmlInventaireIdleV160_(
          rendreCoffreAdventureIdleV1_(
            Array.isArray(modele.a.coffreSlots)?modele.a.coffreSlots:[]
          )
        );
        if(nouveau)root.replaceWith(nouveau);
        return Boolean(nouveau);
      }

      function patchBonusInventaireIdleV160_(modele){
        const root=trouverSectionParTitreInventaireIdleV160_('Equipment Bonuses');
        if(!root||!modele)return false;
        const nouveau=noeudDepuisHtmlInventaireIdleV160_(
          rendreBonusEquipementAdventureIdleV1_(modele.a)
        );
        if(nouveau)root.replaceWith(nouveau);
        return Boolean(nouveau);
      }

      function restaurerSelectionInventaireIdleV160_(modele){
        const id=String(idleAdventureSelectionIdV138||'');
        if(!id)return;
        const item=modele.items.find(function(x){return String(x&&x.id)===id;});
        if(!item){
          idleAdventureSelectionIdV138='';
          afficherDetailsObjetAdventureIdleV138_('');
          return;
        }
        const node=document.querySelector(
          '.soreal-idle-v138-bag-card[data-item-id="'+id+'"],'+
          '.soreal-idle-v138-slot[data-occupant-id="'+id+'"]'
        );
        if(node)node.classList.add('selected');
        const popup=document.getElementById('soreal-idle-v138-details');
        if(popup&&popup.style.display!=='none'){
          afficherDetailsObjetAdventureIdleV138_(id);
        }
      }

      function patchInventaireAdventureIdleV160_(j,options){
        if(
          idleMenuActifV28!=='aventure'||
          !j||
          !aventureMetaIdleV47_(j)
        ){
          return false;
        }

        if(idleAdventureDragIdV138){
          idleInventoryDeferredPatchV160=true;
          return false;
        }

        const opt=options||{};
        const action=String(opt.action||'');
        const marqueId=opt.transactionId||idleInventorySequenceV160||0;
        marquePerfInventaireIdleV160_('patch-start',marqueId);

        const modele=modeleInventaireAdventureIdleV160_(j);
        if(!modele)return false;

        patchResumeInventaireIdleV160_(modele);
        patchGrilleSacInventaireIdleV160_(modele);

        const trashActuelV165=document.querySelector('[data-idle-trash-slot-v165]');
        if(trashActuelV165){
          const tplTrashV165=document.createElement('template');
          tplTrashV165.innerHTML=
            rendreTrashAdventureIdleV165_(modele.a&&modele.a.trash).trim();
          const trashSuivantV165=tplTrashV165.content.firstElementChild;
          if(trashSuivantV165)trashActuelV165.replaceWith(trashSuivantV165);
        }

        if(
          ['equip','unequip','merge','boost','cube','setLock'].indexOf(action)!==-1
        ){
          patchEquipementInventaireIdleV160_(modele);
        }

        if(
          action==='coffreDeposer'||
          action==='coffreRetirer'
        ){
          patchCoffreInventaireIdleV160_(modele);
        }

        if(
          opt.confirmed&&
          ['equip','unequip','merge','boost','cube'].indexOf(action)!==-1
        ){
          patchBonusInventaireIdleV160_(modele);
        }

        restaurerSelectionInventaireIdleV160_(modele);
        idleInventoryPerfV160.patches+=1;
        idleInventoryPerfV160.globalRendersAvoided+=1;
        marquePerfInventaireIdleV160_('patch-end',marqueId);
        return true;
      }

      function idsEquipesInventaireIdleV160_(a){
        const result=new Set();
        const eq=a&&a.equipment||{};
        ADVENTURE_CORE_SLOTS_V138.forEach(function(slot){
          if(eq[slot])result.add(String(eq[slot]));
        });
        (Array.isArray(eq.accessories)?eq.accessories:[])
          .forEach(function(id){result.add(String(id));});
        return result;
      }

      function synchroniserCasesInventaireClientIdleV163_(a){
        if(!a)return [];
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-181 */
        const cases=casesSacAdventureIdleV162_(a);
        a.inventorySlots=cases.map(function(item){
          return item?String(item.id||''):'';
        });
        return a.inventorySlots;
      }

      function recalculerUtilisationInventaireIdleV160_(a){
        if(!a)return;
        const equipes=idsEquipesInventaireIdleV160_(a);
        const items=Array.isArray(a.inventory)?a.inventory:[];
        a.inventoryUsed=items.reduce(function(total,item){
          return total+(item&&!equipes.has(String(item.id))?1:0);
        },0);
      }

      function objetEquipeIdleV165_(a,itemId){
        const id=String(itemId||'');
        const eq=a&&a.equipment||{};
        if(!id)return false;
        if(
          ADVENTURE_CORE_SLOTS_V138.some(function(slot){
            return String(eq[slot]||'')===id;
          })
        )return true;
        return (Array.isArray(eq.accessories)?eq.accessories:[])
          .some(function(x){return String(x||'')===id;});
      }

      function copieIdleV165_(value){
        if(value==null)return value;
        if(typeof structuredClone==='function'){
          try{return structuredClone(value);}catch(_e){}
        }
        return JSON.parse(JSON.stringify(value));
      }

      function appliquerMutationOptimisteInventaireIdleV160_(a,payload,txId){
        if(!a||!payload)return false;
        a.inventory=Array.isArray(a.inventory)?a.inventory:[];
        a.equipment=a.equipment||{};
        a.equipment.accessories=Array.isArray(a.equipment.accessories)
          ?a.equipment.accessories
          :[];

        synchroniserCasesInventaireClientIdleV163_(a);

        const action=String(payload.action||'');
        const id=String(payload.id||'');
        const items=a.inventory;
        const trouver=function(itemId){
          return items.find(function(x){return String(x&&x.id)===String(itemId||'');})||null;
        };

        if(action==='equip'){
          const item=trouver(id);
          const slot=String(payload.slot||'');
          if(!item||item.kind==='boost')return false;
          if(slot==='accessory'){
            if(a.equipment.accessories.map(String).indexOf(id)===-1){
              if(item.set!=='uug'){
                const generaux=a.equipment.accessories.filter(function(existingId){
                  const existing=trouver(existingId);
                  return !existing||existing.set!=='uug';
                }).length;
                if(generaux>=Math.max(0,idleEntier_(a.accessorySlotsCapacity||2))){
                  return false;
                }
              }
              a.equipment.accessories.push(id);
            }
          }else if(
            ADVENTURE_CORE_SLOTS_V138.indexOf(slot)!==-1&&
            String(item.slot||'')===slot
          ){
            a.equipment[slot]=id;
          }else{
            return false;
          }
        }else if(action==='unequip'){
          let trouve=false;
          ADVENTURE_CORE_SLOTS_V138.forEach(function(slot){
            if(String(a.equipment[slot]||'')===id){
              a.equipment[slot]='';
              trouve=true;
            }
          });
          if(a.equipment.accessories.map(String).indexOf(id)!==-1){
            a.equipment.accessories=a.equipment.accessories.filter(
              function(x){return String(x)!==id;}
            );
            trouve=true;
          }
          if(!trouve)return false;

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-182 */
          if(payload.targetIndex!=null){
            synchroniserCasesInventaireClientIdleV163_(a);
            const ordre=a.inventorySlots;
            const src=ordre.map(String).indexOf(id);
            const dst=idleEntier_(payload.targetIndex);
            if(src>=0&&dst>=0&&dst<ordre.length&&src!==dst){
              const tmp=ordre[dst]||'';
              ordre[dst]=id;
              ordre[src]=tmp;
            }
          }
        }else if(action==='merge'){
          const A=trouver(payload.a);
          const B=trouver(payload.b);
          if(!A||!B||A===B||A.definitionId!==B.definitionId)return false;
          if(B.locked)return false;

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-183 */
          ADVENTURE_CORE_SLOTS_V138.forEach(function(slot){
            if(String(a.equipment[slot]||'')===String(B.id)){
              a.equipment[slot]=A.id;
            }
          });
          if(a.equipment.accessories.map(String).indexOf(String(B.id))!==-1){
            a.equipment.accessories=a.equipment.accessories
              .map(function(x){return String(x)===String(B.id)?A.id:x;})
              .filter(function(x,index,arr){
                return arr.map(String).indexOf(String(x))===index;
              });
          }

          A.level=Math.min(
            100,
            idleEntier_(A.level)+idleEntier_(B.level)+1
          );
          A.power=Math.max(idleNombre_(A.power),idleNombre_(B.power));
          A.toughness=Math.max(idleNombre_(A.toughness),idleNombre_(B.toughness));
          A.special=Math.max(idleNombre_(A.special),idleNombre_(B.special));
          A._idlePendingV160=txId||1;
          a.inventory=a.inventory.filter(function(x){
            return String(x&&x.id)!==String(B.id);
          });
        }else if(action==='boost'){
          const boost=trouver(payload.boostId);
          if(!boost||boost.kind!=='boost')return false;
          if(payload.toCube){
            a.inventory=a.inventory.filter(function(x){
              return String(x&&x.id)!==String(boost.id);
            });
            a.cube=Object.assign({},a.cube||{},{
              _idlePendingV160:txId||1
            });
          }else{
            const target=trouver(payload.targetId);
            if(!target||target.kind==='boost')return false;
            const type=String(boost.boostType||'');
            const q=1+Math.max(0,Math.min(100,idleNombre_(target.level)))/100;
            const cap=type==='power'
              ?idleNombre_(target.basePower)*q
              :type==='toughness'
                ?idleNombre_(target.baseToughness)*q
                :type==='special'
                  ?idleNombre_(target.baseSpecial)*q
                  :0;
            const actuel=type==='power'
              ?idleNombre_(target.power)
              :type==='toughness'
                ?idleNombre_(target.toughness)
                :type==='special'
                  ?idleNombre_(target.special)
                  :0;
            /* Objet sans cette statistique (plafond 0) ou statistique pleine : aucune application optimiste (2026-09-24). */
            if(target.fullyMaxed||cap<=1e-9||actuel>=cap-1e-9)return false;
            target._idlePendingV160=txId||1;
            a.inventory=a.inventory.filter(function(x){
              return String(x&&x.id)!==String(boost.id);
            });
          }
        }else if(action==='cube'){
          const boost=trouver(payload.boostId||payload.id);
          if(!boost||boost.kind!=='boost')return false;
          a.inventory=a.inventory.filter(function(x){
            return String(x&&x.id)!==String(boost.id);
          });
          a.cube=Object.assign({},a.cube||{},{
            _idlePendingV160:txId||1
          });
        }else if(action==='reorderInventory'){
          const capacite=Math.max(0,idleEntier_(a.inventoryCapacity||24));
          const ordre=Array.isArray(a.inventorySlots)
            ?a.inventorySlots.slice(0,capacite)
            :[];
          while(ordre.length<capacite)ordre.push('');

          const source=String(payload.sourceId||payload.id||'');
          let src=ordre.map(String).indexOf(source);
          if(src<0){
            const cases=casesSacAdventureIdleV162_(a);
            a.inventorySlots=cases.map(function(item){
              return item?String(item.id||''):'';
            });
            src=a.inventorySlots.indexOf(source);
          }
          if(src<0)return false;

          let dst=-1;
          const targetId=String(payload.targetId||'');
          if(targetId)dst=a.inventorySlots.map(String).indexOf(targetId);
          if(dst<0&&payload.targetIndex!=null){
            dst=idleEntier_(payload.targetIndex);
          }
          if(dst<0||dst>=capacite)return false;
          const temporaire=a.inventorySlots[dst]||'';
          a.inventorySlots[dst]=source;
          a.inventorySlots[src]=temporaire;
        }else if(action==='setLock'){
          const item=trouver(id);
          if(!item)return false;
          item.locked=Boolean(payload.locked);
          item._idlePendingV160=txId||1;
        }else if(action==='trashPut'){
          const item=trouver(id);
          if(!item||item.locked)return false;
          ADVENTURE_CORE_SLOTS_V138.forEach(function(slot){
            if(String(a.equipment[slot]||'')===id)a.equipment[slot]='';
          });
          a.equipment.accessories=a.equipment.accessories.filter(
            function(x){return String(x)!==id;}
          );
          a.trash=copieIdleV165_(item);
          a.inventory=a.inventory.filter(function(x){
            return String(x&&x.id)!==id;
          });
        }else if(action==='trashRecover'){
          if(!a.trash)return false;
          const cap=Math.max(0,idleEntier_(a.inventoryCapacity||24));
          if(idleEntier_(a.inventoryUsed)>=cap)return false;
          a.inventory.push(copieIdleV165_(a.trash));
          a.trash=null;
        }else if(action==='discard'){
          if(idsEquipesInventaireIdleV160_(a).has(id))return false;
          const item=trouver(id);
          if(!item||item.locked)return false;
          a.inventory=a.inventory.filter(function(x){
            return String(x&&x.id)!==id;
          });
        }else if(action==='coffreDeposer'){
          if(idsEquipesInventaireIdleV160_(a).has(id))return false;
          const item=trouver(id);
          if(!item)return false;
          a.inventory=a.inventory.filter(function(x){
            return String(x&&x.id)!==id;
          });
          if(Array.isArray(a.coffreSlots)){
            const slot=a.coffreSlots.find(function(x){
              return x&&String(x.definitionId||'')===String(item.definitionId||'');
            });
            if(slot){
              slot.occupe=true;
              slot.item=cloneInventaireIdleV160_(item);
            }
          }
        }else if(action==='coffreRetirer'){
          if(!Array.isArray(a.coffreSlots))return false;
          const slot=a.coffreSlots.find(function(x){
            return x&&x.item&&String(x.item.id||'')===id;
          });
          if(!slot||!slot.item)return false;
          a.inventory.push(cloneInventaireIdleV160_(slot.item));
          slot.occupe=false;
          slot.item=null;
        }else{
          return false;
        }

        synchroniserCasesInventaireClientIdleV163_(a);
        recalculerUtilisationInventaireIdleV160_(a);
        return true;
      }

      function remplacerAdventureInventaireIdleV160_(base){
        if(!idleEtat||!base)return;
        const courant=aventureMetaIdleV47_(idleEtat);
        const fightLocal=courant&&courant.fight&&courant.fight.active
          ?courant.fight
          :null;

        idleEtat.systemes=Object.assign({},idleEtat.systemes||{});
        idleEtat.systemes.adventure=Object.assign(
          {},
          cloneInventaireIdleV160_(base),
          fightLocal?{fight:fightLocal}:{}
        );

        idleInventoryMutationQueueV160.forEach(function(tx){
          appliquerMutationOptimisteInventaireIdleV160_(
            idleEtat.systemes.adventure,
            tx.payload,
            tx.id
          );
        });
        recalculerUtilisationInventaireIdleV160_(
          idleEtat.systemes.adventure
        );
      }

      function reconstruireEtatOptimisteInventaireIdleV160_(options){
        if(!idleInventoryConfirmedAdventureV160||!idleEtat)return;
        remplacerAdventureInventaireIdleV160_(
          idleInventoryConfirmedAdventureV160
        );
        pousserEtatVersRuntimePartageIdleV1_();
        patchInventaireAdventureIdleV160_(
          idleEtat,
          options||{}
        );
      }

      function cueAudioMutationInventaireIdleV199_(a,payload){
        if(!a||!payload)return '';

        const action=String(payload.action||'');
        const items=Array.isArray(a.inventory)?a.inventory:[];
        const trouver=function(id){
          return items.find(function(item){
            return String(item&&item.id)===String(id||'');
          })||null;
        };

        if(action==='merge'){
          const A=trouver(payload.a);
          const B=trouver(payload.b);
          if(
            !A||
            !B||
            A===B||
            A.definitionId!==B.definitionId||
            A.kind==='boost'||
            B.kind==='boost'
          ){
            return '';
          }

          const slot=String(A.slot||B.slot||'');
          if(slot==='weapon')return 'mergeWeapon';

          if(['head','chest','legs','boots'].indexOf(slot)!==-1){
            return 'mergeArmor';
          }

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-184 */
          return 'mergeAccessory';
        }

        if(action==='boost'&&!payload.toCube){
          const boost=trouver(payload.boostId);
          const cible=trouver(payload.targetId);

          if(!boost||boost.kind!=='boost'||!cible||cible.kind==='boost'){
            return '';
          }

          const type=String(boost.boostType||'').toLowerCase();
          if(type==='power')return 'boostPower';
          if(type==='toughness')return 'boostToughness';
          if(type==='special')return 'boostSpecial';
        }

        return '';
      }


      function terminerMutationInventaireIdleV160_(tx,res,erreur){
        const courant=idleInventoryMutationQueueV160[0];
        if(!courant||courant.id!==tx.id){
          idleInventoryBusyV160=false;
          envoyerProchaineMutationInventaireIdleV160_();
          return;
        }

        marquePerfInventaireIdleV160_('network-end',tx.id);
        idleInventoryPerfV160.lastNetworkMs=
          mesurePerfInventaireIdleV160_(
            'network','network-start','network-end',tx.id
          );

        const mergeTransitoireV183=
          String(tx.payload&&tx.payload.action||'')==='merge'&&
          (
            Boolean(erreur)||
            Boolean(res&&res.retryable)||
            ['SOREAL_IDLE_OCCUPE','TIMEOUT','NETWORK_ERROR'].indexOf(
              String(res&&res.code||'')
            )!==-1
          );

        if(mergeTransitoireV183&&(tx.retryCount||0)<4){
          tx.retryCount=(tx.retryCount||0)+1;
          idleInventoryBusyV160=false;
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-185 */
          setTimeout(
            envoyerProchaineMutationInventaireIdleV160_,
            120*tx.retryCount
          );
          return;
        }

        idleInventoryMutationQueueV160.shift();
        idleInventoryBusyV160=false;

        if(!erreur&&res&&res.ok&&res.joueur){
          const restAvant=idleEtat&&idleEtat.adventureRestPv;
          if(!appliquerSynchroCombatSansReflowIdleV116_(res.joueur)){
            idleEtat=res.joueur;
            if(restAvant!=null&&idleEtat.adventureRestPv==null){
              idleEtat.adventureRestPv=restAvant;
            }
          }

          const serveur=aventureMetaIdleV47_(res.joueur);
          if(serveur){
            idleInventoryConfirmedAdventureV160=
              cloneInventaireIdleV160_(serveur);
            idleAdventureRevisionServeurV208=Math.max(
              idleAdventureRevisionServeurV208,
              revisionAdventureServeurIdleV208_(serveur)
            );
          }

          marquePerfInventaireIdleV160_('reconcile-start',tx.id);
          reconstruireEtatOptimisteInventaireIdleV160_({
            action:tx.payload.action,
            transactionId:tx.id,
            confirmed:true
          });
          marquePerfInventaireIdleV160_('reconcile-end',tx.id);
          idleInventoryPerfV160.lastReconcileMs=
            mesurePerfInventaireIdleV160_(
              'reconcile','reconcile-start','reconcile-end',tx.id
            );

        }else{
          reconstruireEtatOptimisteInventaireIdleV160_({
            action:tx.payload.action,
            transactionId:tx.id,
            confirmed:true
          });
          toastIdleV5_(
            res&&res.message
              ?res.message
              :(erreur&&erreur.message?erreur.message:'Erreur Inventory.')
          );
        }

        if(!idleInventoryMutationQueueV160.length){
          appliquerAdventureDiffereeIdleV208_();
        }

        envoyerProchaineMutationInventaireIdleV160_();
      }

      function envoyerProchaineMutationInventaireIdleV160_(){
        if(
          idleInventoryBusyV160||
          !SOREAL_SESSION||
          !idleInventoryMutationQueueV160.length
        ){
          return;
        }

        const tx=idleInventoryMutationQueueV160[0];
        idleInventoryBusyV160=true;
        marquePerfInventaireIdleV160_('network-start',tx.id);

        appelerProgressionIdleCloudflareV1_(
          {action:'adventure',adventure:tx.payload},
          function(res){
            terminerMutationInventaireIdleV160_(tx,res,null);
          },
          function(e){
            terminerMutationInventaireIdleV160_(tx,null,e||new Error('Erreur Inventory.'));
          }
        );
      }

      function enfilerMutationInventaireIdleV160_(payload){
        if(!SOREAL_SESSION||!idleEtat)return;
        const current=aventureMetaIdleV47_(idleEtat);
        if(!current)return;

        if(
          !idleInventoryMutationQueueV160.length&&
          !idleInventoryBusyV160
        ){
          idleInventoryConfirmedAdventureV160=
            cloneInventaireIdleV160_(current);
        }

        const txId=++idleInventorySequenceV160;
        const mutationPayload=
          cloneInventaireIdleV160_(payload||{});
        if(!mutationPayload.clientMutationId){
          mutationPayload.clientMutationId=
            'inv-'+
            Date.now().toString(36)+'-'+
            String(txId)+'-'+
            Math.random().toString(36).slice(2,10);
        }

        const tx={
          id:txId,
          payload:mutationPayload,
          audioCue:cueAudioMutationInventaireIdleV199_(current,payload||{}),
          createdAt:Date.now()
        };
        idleInventoryMutationQueueV160.push(tx);

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-186 */
        if(tx.audioCue){
          jouerEffetAudioIdleV199_(tx.audioCue);
        }

        marquePerfInventaireIdleV160_('event',tx.id);
        appliquerMutationOptimisteInventaireIdleV160_(
          aventureMetaIdleV47_(idleEtat),
          tx.payload,
          tx.id
        );
        recalculerUtilisationInventaireIdleV160_(
          aventureMetaIdleV47_(idleEtat)
        );
        pousserEtatVersRuntimePartageIdleV1_();

        marquePerfInventaireIdleV160_('optimistic-start',tx.id);
        patchInventaireAdventureIdleV160_(
          idleEtat,
          {
            action:tx.payload.action,
            transactionId:tx.id,
            confirmed:false
          }
        );
        marquePerfInventaireIdleV160_('optimistic-end',tx.id);
        idleInventoryPerfV160.lastOptimisticMs=
          mesurePerfInventaireIdleV160_(
            'optimistic','optimistic-start','optimistic-end',tx.id
          );

        envoyerProchaineMutationInventaireIdleV160_();
      }

      function actionAdventureIdleV47_(payload){
        const action=payload||{};
        if(estMutationInventaireAdventureIdleV160_(action)){
          enfilerMutationInventaireIdleV160_(action);
          return;
        }
        actionMetaIdleV130_({
          action:'adventure',
          adventure:action
        });
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

      function selectionnerZoneAdventureIdleV47_(id){
        const cible=String(id||'safe');
        const a=aventureMetaIdleV47_(idleEtat);
        if(a){
          a.selectedZone=cible;
          patchZoneAdventureSansReflowIdleV1_(idleEtat);
          pousserEtatVersRuntimePartageIdleV1_();
        }
        actionAdventureIdleV47_({action:'selectZone',zone:cible});
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-187 */
      function patchZoneAdventureSansReflowIdleV1_(j){
        if(idleMenuActifV28!=='aventure')return;
        const a=aventureMetaIdleV47_(j);
        if(!a)return;
        const selected=String(a.selectedZone||'safe');
        const zones=Array.isArray(a.zones)?a.zones:[];
        const zone=zones.find(function(z){return z&&String(z.id)===selected;})||null;
        const picker=document.getElementById('idleZoneSelectCustom');
        if(picker){
          const value=picker.querySelector('.team-sort-trigger-value');
          if(value)value.textContent=String((zone&&(zone.name||zone.id))||selected||'—');
          picker.classList.remove('open');
          picker.querySelectorAll('.team-sort-option[data-zone-id]').forEach(function(btn){
            const active=String(btn.getAttribute('data-zone-id')||'')===selected;
            btn.classList.toggle('active',active);
            const arrow=btn.querySelector('.team-sort-option-arrow');
            if(active&&!arrow){
              const mark=document.createElement('span');
              mark.className='team-sort-option-arrow';
              mark.textContent='✓';
              btn.appendChild(mark);
            }else if(!active&&arrow){
              arrow.remove();
            }
          });
        }

        const panneauJoueur=document.querySelector('.soreal-idle-adventure-player-panel-v1');
        const note=panneauJoueur&&panneauJoueur.nextElementSibling;
        if(note){
          note.outerHTML=
            selected==='safe'
              ?'<div class="soreal-idle-adventure-fight-note-v1">🛡️ Zone sûre : choisis une autre zone pour combattre.</div>'
              :'<div class="soreal-idle-adventure-fight-note-v1">'+idleHtml_(texteProchainCombatAdventureIdleV165_())+'</div>';
        }
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-188 */
      function zoneAdventureDeplacerV1_(delta){
        if(!idleEtat)return;
        const a=aventureMetaIdleV47_(idleEtat);
        const zones=a&&Array.isArray(a.zones)?a.zones:[];
        const debloquees=zones.filter(function(z){return z&&z.unlocked;});
        if(!debloquees.length)return;
        const selectionnee=String((a&&a.selectedZone)||'safe');
        let idx=debloquees.findIndex(function(z){return String(z.id)===selectionnee;});
        if(idx<0)idx=0;
        idx=(idx+delta+debloquees.length)%debloquees.length;
        selectionnerZoneAdventureIdleV47_(debloquees[idx].id);
      }
      function zoneAdventurePrecedenteV1_(){zoneAdventureDeplacerV1_(-1);}
      function zoneAdventureSuivanteV1_(){zoneAdventureDeplacerV1_(1);}
      window.__zoneAdventurePrecedenteV1__=zoneAdventurePrecedenteV1_;
      window.__zoneAdventureSuivanteV1__=zoneAdventureSuivanteV1_;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-189 */
      function combattreZoneAdventureIdleV47_(){
        actionAdventureIdleV47_({action:'zoneKill'});
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-190 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-191 */

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-192 */
      function respawnReductionAdventureIdleV1_(j){
        return Math.max(
          0,
          Math.min(
            0.915,
            idleNombre_(j&&j.systemes&&j.systemes.bonuses&&j.systemes.bonuses.respawnReduction)
          )
        );
      }
      const IDLE_ADVENTURE_RESPAWN_MS_V1=4000;
      const IDLE_ADVENTURE_PLAYER_HIT_MS_V2=1000;
      let idleAdventureFightNextPlayerHitV2=0;
      let idleAdventureFightNextEnemyHitV2=0;
      let idleAdventureFightLastRegenAtV2=0;
      let idleAdventureFightIdentityV2='';
      let idleAdventureResolutionPendingV2='';
      let idleAdventureRespawnAtV1=0;
      let idleAdventureRespawnTimerV165=0;
      let idleAdventureRespawnStartPendingV165=false;
      let idleAdventureRespawnZoneV165='';
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-193 */
      let idleAdventureRestRegenLastAtV166=Date.now();

      function reinitialiserHorlogeRegenReposAdventureIdleV166_(maintenant){
        const now=Math.max(0,idleNombre_(maintenant)||Date.now());
        idleAdventureRestRegenLastAtV166=now;
        return now;
      }

      function ecouleRegenReposAdventureIdleV166_(maintenant){
        const now=Math.max(0,idleNombre_(maintenant)||Date.now());
        const precedent=Math.max(
          0,
          idleNombre_(idleAdventureRestRegenLastAtV166)||now
        );
        idleAdventureRestRegenLastAtV166=now;
        return Math.max(0,(now-precedent)/1000);
      }

      function dureeRespawnAdventureIdleV165_(){
        return Math.max(
          0,
          IDLE_ADVENTURE_RESPAWN_MS_V1*
          (1-respawnReductionAdventureIdleV1_(idleEtat))
        );
      }

      function texteProchainCombatAdventureIdleV165_(){
        const restantMs=idleAdventureRespawnAtV1
          ?Math.max(0,idleAdventureRespawnAtV1-Date.now())
          :dureeRespawnAdventureIdleV165_();
        const secondes=Math.max(0,Math.ceil(restantMs/1000));
        return '⏳ Prochain combat dans '+secondes+' seconde'+(secondes>1?'s':'');
      }

      function annulerRespawnAdventureIdleV165_(){
        if(idleAdventureRespawnTimerV165){
          clearTimeout(idleAdventureRespawnTimerV165);
          idleAdventureRespawnTimerV165=0;
        }
        idleAdventureRespawnAtV1=0;
        idleAdventureRespawnStartPendingV165=false;
        idleAdventureRespawnZoneV165='';
      }

      function programmerRespawnAdventureIdleV165_(departMs){
        const a=aventureMetaIdleV47_(idleEtat);
        const zone=String((a&&a.selectedZone)||'safe');
        if(!a||zone==='safe'){
          annulerRespawnAdventureIdleV165_();
          return;
        }
        const depart=Math.max(0,idleNombre_(departMs)||Date.now());
        idleAdventureRespawnAtV1=depart+dureeRespawnAdventureIdleV165_();
        idleAdventureRespawnZoneV165=zone;
        idleAdventureRespawnStartPendingV165=false;
        if(idleAdventureRespawnTimerV165)clearTimeout(idleAdventureRespawnTimerV165);

        const tenter=function(){
          const courant=aventureMetaIdleV47_(idleEtat);
          const zoneCourante=String((courant&&courant.selectedZone)||'safe');
          if(
            !courant||
            zoneCourante==='safe'||
            zoneCourante!==idleAdventureRespawnZoneV165
          ){
            annulerRespawnAdventureIdleV165_();
            return;
          }
          const restant=idleAdventureRespawnAtV1-Date.now();
          if(restant>1){
            idleAdventureRespawnTimerV165=setTimeout(tenter,restant);
            return;
          }
          if(idleAdventureResolutionPendingV2||metaOccupeIdleV130_()){
            idleAdventureRespawnTimerV165=setTimeout(tenter,16);
            return;
          }
          idleAdventureRespawnTimerV165=0;
          idleAdventureRespawnStartPendingV165=true;
          idleAdventureRespawnAtV1=0;
          actionAdventureIdleV47_({
            action:'startZoneFight',
            restHp:idleEtat&&idleEtat.adventureRestPv
          });
        };

        idleAdventureRespawnTimerV165=setTimeout(
          tenter,
          Math.max(0,idleAdventureRespawnAtV1-Date.now())
        );
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-194 */
      const IDLE_ADVENTURE_MANUAL_ATTACKS_V3=Object.freeze([
        {id:'regular',label:'Attaque',icon:'⚔️',btIndex:1,cooldown:1000,multiplier:1.5},
        {id:'strong',label:'Forte',icon:'💥',btIndex:2,cooldown:4000,multiplier:2},
        {id:'parry',label:'Parade',icon:'🛡️',btIndex:3,cooldown:15000,multiplier:1},
        {id:'piercing',label:'Perçante',icon:'🗡️',btIndex:4,cooldown:8000,multiplier:2,pierce:.33},
        {id:'ultimate',label:'Ultime',icon:'☄️',btIndex:5,cooldown:15000,multiplier:2}
      ]);
      const IDLE_ADVENTURE_MANUAL_DEFENSE_V3=Object.freeze([
        {id:'block',label:'Blocage',icon:'🛡️',btIndex:0,cooldown:10000},
        {id:'defensiveBuff',label:'Défense',icon:'🔷',btIndex:1,cooldown:45000},
        {id:'heal',label:'Soin',icon:'❤️',btIndex:2,cooldown:15000},
        {id:'offensiveBuff',label:'Puissance',icon:'🔶',btIndex:3,cooldown:45000},
        {id:'charge',label:'Charge',icon:'⚡',btIndex:4,cooldown:30000},
        {id:'ultimateBuff',label:'Bonus ultime',icon:'✨',btIndex:5,cooldown:45000}
      ]);
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-195 */
      const IDLE_ADVENTURE_ADVANCED_SKILLS_V4=Object.freeze([
        {id:'paralyze',label:'Paralyze',icon:'⏸️',cooldown:15000},
        {id:'hyperRegen',label:'Hyper Regen',icon:'💚',cooldown:35000},
        {id:'beastMode',label:'Beast Mode',icon:'🐲',cooldown:15000},
        {id:'megaBuff',label:'Mega Buff',icon:'🌟',cooldown:50000},
        {id:'ohShit',label:'Oh Shit',icon:'🚨',cooldown:35000},
        {id:'move69',label:'Move 69',icon:'69',cooldown:3600000}
      ]);

      let idleAdventureIdleModeV3=true;
      try{
        idleAdventureIdleModeV3=
          localStorage.getItem('sorealIdleAdventureIdleModeV3')!=='0';
      }catch(e){}
      const idleAdventureManualStateV3={
        cooldownUntil:Object.create(null),
        blockUntil:0,
        blockReduction:.5,
        defensiveBuffUntil:0,
        offensiveBuffUntil:0,
        ultimateBuffUntil:0,
        megaBuffUntil:0,
        enemyParalyzedUntil:0,
        hyperRegenUntil:0,
        charge:false,
        parryArmed:false,
        parryChargeMult:1
      };

      function skillBasicTrainingAdventureIdleV3_(group,index){
        const bt=basicTrainingIdleV120_();
        const list=bt&&Array.isArray(bt.skills)
          ?bt.skills.filter(function(skill){return skill&&skill.group===group;})
          :[];
        return list[index]||null;
      }

      function competenceAdventureDebloqueeIdleV3_(def,group){
        const skill=skillBasicTrainingAdventureIdleV3_(group,def.btIndex);
        return Boolean(skill&&skill.unlocked);
      }

      function niveauWishAdventureIdleV4_(wishId){
        const wishes=systemeMetaParIdIdleV130_(idleEtat,'wishes');
        const tracks=wishes&&wishes.state&&wishes.state.data&&wishes.state.data.tracks;
        const track=tracks&&tracks[String(wishId)];
        return Math.max(0,idleEntier_(track&&track.level));
      }

      function competenceAdventureAvanceeDebloqueeIdleV4_(id,a){
        const skillId=String(id||'');
        const flags=a&&a.unlockFlags||{};
        if(skillId==='paralyze'){
          return Math.max(
            0,
            idleEntier_(
              idleEtat&&idleEtat.systemes&&
              idleEtat.systemes.challenge&&
              idleEtat.systemes.challenge.completions&&
              idleEtat.systemes.challenge.completions.basic
            )
          )>=5;
        }
        if(skillId==='hyperRegen')return Boolean(flags.hyperRegenUnlocked);
        if(skillId==='beastMode')return Boolean(flags.beastModeUnlocked);
        if(skillId==='megaBuff')return niveauWishAdventureIdleV4_(8)>=1;
        if(skillId==='ohShit')return niveauWishAdventureIdleV4_(58)>=1;
        if(skillId==='move69')return Boolean(flags.move69Unlocked);
        return false;
      }

      function groupeCompetenceAdventureIdleV4_(def){
        if(IDLE_ADVENTURE_MANUAL_ATTACKS_V3.indexOf(def)>=0)return'attack';
        if(IDLE_ADVENTURE_MANUAL_DEFENSE_V3.indexOf(def)>=0)return'defense';
        return'advanced';
      }

      function competenceAdventureDisponibleIdleV4_(def,group,a){
        if(!def)return false;
        return group==='advanced'
          ?competenceAdventureAvanceeDebloqueeIdleV4_(def.id,a)
          :competenceAdventureDebloqueeIdleV3_(def,group);
      }

      function definitionCompetenceAdventureIdleV3_(id){
        return IDLE_ADVENTURE_MANUAL_ATTACKS_V3
          .concat(IDLE_ADVENTURE_MANUAL_DEFENSE_V3)
          .concat(IDLE_ADVENTURE_ADVANCED_SKILLS_V4)
          .find(function(def){return def.id===String(id||'');})||null;
      }

      function beastModeActifAdventureIdleV4_(a){
        return Boolean(a&&a.skillState&&a.skillState.beastMode);
      }

      function multiplicateurBeastPowerAdventureIdleV4_(a){
        if(!beastModeActifAdventureIdleV4_(a))return 1;
        return a&&a.unlockFlags&&a.unlockFlags.purpleLiquidMaxed?1.5:1.4;
      }

      function multiplicateurPowerManuelAdventureIdleV3_(maintenant,a){
        let mult=1;
        if(idleAdventureManualStateV3.offensiveBuffUntil>maintenant)mult*=1.2;
        if(idleAdventureManualStateV3.ultimateBuffUntil>maintenant)mult*=1.3;
        if(idleAdventureManualStateV3.megaBuffUntil>maintenant)mult*=1.2;
        mult*=multiplicateurBeastPowerAdventureIdleV4_(a);
        return mult;
      }

      function multiplicateurToughnessManuelAdventureIdleV3_(maintenant){
        let mult=1;
        if(idleAdventureManualStateV3.defensiveBuffUntil>maintenant)mult*=1.2;
        if(idleAdventureManualStateV3.ultimateBuffUntil>maintenant)mult*=1.3;
        if(idleAdventureManualStateV3.megaBuffUntil>maintenant)mult*=1.2;
        return mult;
      }

      function multiplicateurChargeAdventureIdleV3_(a){
        return Math.max(
          2,
          idleNombre_(a&&a.setRewards&&a.setRewards.chargeMultiplier)||2
        );
      }

      function intervalleIdleAttackAdventureIdleV4_(a){
        return a&&a.unlockFlags&&a.unlockFlags.redLiquidMaxed?800:1000;
      }

      function cooldownDureeAdventureIdleV4_(def,a){
        const base=Math.max(0,idleNombre_(def&&def.cooldown));
        if(!def||def.id==='move69')return base;
        /* Specials « Move Cooldowns » de l'équipement (Ring of Might, Sands of Time, Infinity Charm : 50 % max). */
        /* Wiki « Red Liquid (set) » : le -20 % porte sur le « global cooldown timer » (délai entre deux moves différents) et la vitesse d'Idle Attack, PAS sur le cooldown propre de chaque move. Le GCD n'a pas de valeur de base publiée : non simulé, rien de réduit ici. */
        const equipement=Math.max(0,Math.min(95,idleNombre_(a&&a.stats&&a.stats.specials&&a.stats.specials.moveCooldownPct)));
        return base*(1-equipement/100);
      }

      function cooldownRestantAdventureIdleV3_(id,maintenant){
        return Math.max(
          0,
          idleNombre_(idleAdventureManualStateV3.cooldownUntil[id])-maintenant
        );
      }

      function prerequisCompetenceAdventureIdleV4_(id,maintenant){
        const skillId=String(id||'');
        if(skillId==='megaBuff'){
          return ['offensiveBuff','defensiveBuff','ultimateBuff'].every(function(x){
            return cooldownRestantAdventureIdleV3_(x,maintenant)<=0;
          });
        }
        if(skillId==='ohShit'){
          return ['heal','paralyze','hyperRegen'].every(function(x){
            return cooldownRestantAdventureIdleV3_(x,maintenant)<=0;
          });
        }
        return true;
      }

      function rafraichirCommandesAdventureIdleV3_(maintenant){
        const root=document.getElementById('sorealIdleAdventureManualV3');
        if(!root)return;
        const now=Math.max(0,idleNombre_(maintenant)||Date.now());
        const a=aventureMetaIdleV47_(idleEtat);
        root.classList.toggle('manual-active',!idleAdventureIdleModeV3);
        const toggle=root.querySelector('[data-adventure-idle-toggle]');
        if(toggle){
          toggle.classList.toggle('active',idleAdventureIdleModeV3);
          toggle.setAttribute('aria-pressed',idleAdventureIdleModeV3?'true':'false');
          const value=toggle.querySelector('b');
          if(value)value.textContent=idleAdventureIdleModeV3?'ON':'OFF';
        }
        root.querySelectorAll('[data-adventure-skill]').forEach(function(btn){
          const id=String(btn.getAttribute('data-adventure-skill')||'');
          const def=definitionCompetenceAdventureIdleV3_(id);
          if(!def)return;
          const group=groupeCompetenceAdventureIdleV4_(def);
          const unlocked=competenceAdventureDisponibleIdleV4_(def,group,a);
          const restant=cooldownRestantAdventureIdleV3_(id,now);
          const prerequisOk=prerequisCompetenceAdventureIdleV4_(id,now);
          btn.disabled=idleAdventureIdleModeV3||!unlocked||restant>0||!prerequisOk;
          btn.classList.toggle('locked',!unlocked);
          const cd=btn.querySelector('.soreal-idle-adventure-skill-cd-v3');
          if(cd)cd.textContent=restant>0?(restant/1000).toFixed(restant<10000?1:0)+'s':'';
          const label=btn.querySelector('.soreal-idle-adventure-skill-label-v3');
          if(label&&id==='move69'){
            const uses=Math.max(0,idleEntier_(a&&a.skillState&&a.skillState.move69Uses));
            label.textContent='Move 69 · '+uses+'/69';
          }
          let active=false;
          if(id==='block')active=idleAdventureManualStateV3.blockUntil>now;
          else if(id==='defensiveBuff')active=idleAdventureManualStateV3.defensiveBuffUntil>now;
          else if(id==='offensiveBuff')active=idleAdventureManualStateV3.offensiveBuffUntil>now;
          else if(id==='ultimateBuff')active=idleAdventureManualStateV3.ultimateBuffUntil>now;
          else if(id==='megaBuff')active=idleAdventureManualStateV3.megaBuffUntil>now;
          else if(id==='hyperRegen')active=idleAdventureManualStateV3.hyperRegenUntil>now;
          else if(id==='paralyze')active=idleAdventureManualStateV3.enemyParalyzedUntil>now;
          else if(id==='charge')active=idleAdventureManualStateV3.charge;
          else if(id==='parry')active=idleAdventureManualStateV3.parryArmed;
          else if(id==='beastMode')active=beastModeActifAdventureIdleV4_(a);
          btn.classList.toggle('effect-active',active);
        });
      }

      function basculerIdleModeAdventureIdleV3_(){
        const a=aventureMetaIdleV47_(idleEtat);
        const fight=a&&a.fight;
        const maintenant=Date.now();
        if(fight&&fight.active){
          appliquerRegenCombatAdventureIdleV2_(a,fight,maintenant);
        }
        idleAdventureIdleModeV3=!idleAdventureIdleModeV3;
        try{
          localStorage.setItem(
            'sorealIdleAdventureIdleModeV3',
            idleAdventureIdleModeV3?'1':'0'
          );
        }catch(e){}
        if(idleAdventureIdleModeV3){
          idleAdventureFightNextPlayerHitV2=
            maintenant+intervalleIdleAttackAdventureIdleV4_(a);
        }
        rafraichirCommandesAdventureIdleV3_(maintenant);
      }
      window.__basculerIdleModeAdventureIdleV3__=basculerIdleModeAdventureIdleV3_;

      function appliquerHealAdventureIdleV4_(a,fight){
        const max=Math.max(0,idleNombre_(fight&&fight.playerHpMax));
        if(fight&&fight.active&&max>0){
          fight.playerHp=Math.min(
            max,
            idleNombre_(fight.playerHp)+max*.15
          );
          pousserEtatVersRuntimePartageIdleV1_();
          return true;
        }
        return false;
      }

      function appliquerParalyzeAdventureIdleV4_(maintenant){
        idleAdventureManualStateV3.enemyParalyzedUntil=
          Math.max(idleAdventureManualStateV3.enemyParalyzedUntil,maintenant+3000);
      }

      function appliquerHyperRegenAdventureIdleV4_(a,fight,maintenant){
        if(fight&&fight.active){
          appliquerRegenCombatAdventureIdleV2_(a,fight,maintenant);
        }
        idleAdventureManualStateV3.hyperRegenUntil=
          Math.max(idleAdventureManualStateV3.hyperRegenUntil,maintenant+5000);
      }

      function attaqueManuelleAdventureIdleV3_(def,a,fight,maintenant,chargeMemorisee){
        if(!fight||!fight.active)return false;
        let multiplier=Math.max(0,idleNombre_(def&&def.multiplier)||1);
        if(def&&def.id==='ultimate'){
          const bossRecord=Math.max(
            Math.max(0,idleEntier_(idleEtat&&idleEtat.bossVaincus)),
            Math.max(0,idleEntier_(idleEtat&&idleEtat.systemes&&idleEtat.systemes.records&&idleEtat.systemes.records.highestBoss))
          );
          const jrpg=Boolean(a&&a.completedSets&&a.completedSets.jrpg);
          multiplier=(jrpg?4:2)+bossRecord*.01;
        }
        /* Wiki Skills : Parry x1 (x3 avec le set Slimy complété). */
        if(def&&def.id==='parry'&&a&&a.completedSets&&a.completedSets.slimy)multiplier=3;
        /* Riposte de Parry : Charge consommée au lancement de la parade, jamais la Charge courante. */
        if(chargeMemorisee>0){
          multiplier*=chargeMemorisee;
        }else if(idleAdventureManualStateV3.charge){
          multiplier*=multiplicateurChargeAdventureIdleV3_(a);
          idleAdventureManualStateV3.charge=false;
        }
        const power=
          Math.max(0,idleNombre_(a&&a.stats&&a.stats.power))*
          multiplicateurPowerManuelAdventureIdleV3_(maintenant,a);
        const toughness=
          Math.max(0,idleNombre_(fight.mobToughness))*
          (def&&def.pierce?1-Math.max(0,Math.min(.99,def.pierce)):1);
        const avant=Math.max(0,idleNombre_(fight.monsterHp));
        const degats=Math.min(
          avant,
          degatsJoueurAdventureIdleV2_(
            power,
            toughness,
            multiplier,
            facteurAleatoireDegatsAdventureIdleV2_()
          )
        );
        fight.monsterHp=Math.max(0,avant-degats);
        impactMonstreAdventureIdleV1_();
        ajouterLogAventureIdleV1_(
          'player',
          (def&&def.label?def.label:'Attaque')+' : '+
          idleEntier_(degats)+' dégâts sur '+
          libelleEnnemiAdventureIdleV1_(fight)+' !'
        );
        if(fight.monsterHp<=0){
          terminerCombatAdventureLocalV2_(fight,true);
        }else{
          pousserEtatVersRuntimePartageIdleV1_();
        }
        return true;
      }

      function utiliserCompetenceAdventureIdleV3_(id){
        if(idleAdventureIdleModeV3)return;
        const def=definitionCompetenceAdventureIdleV3_(id);
        if(!def)return;
        const a=aventureMetaIdleV47_(idleEtat);
        const group=groupeCompetenceAdventureIdleV4_(def);
        if(!competenceAdventureDisponibleIdleV4_(def,group,a))return;
        const maintenant=Date.now();
        if(
          cooldownRestantAdventureIdleV3_(def.id,maintenant)>0||
          !prerequisCompetenceAdventureIdleV4_(def.id,maintenant)
        )return;
        const fight=a&&a.fight;

        const attaqueBase=group==='attack';
        const requiertCombat=
          (attaqueBase&&def.id!=='parry')||
          def.id==='paralyze'||
          def.id==='ohShit';
        if(requiertCombat&&(!fight||!fight.active))return;

        idleAdventureManualStateV3.cooldownUntil[def.id]=
          maintenant+cooldownDureeAdventureIdleV4_(def,a);

        if(group==='attack'){
          if(def.id==='parry'){
            /*
             * Wiki Skills : Parry « Blocks 50% of incoming damage and automatically
             * attacks » ; set Slimy : « Parry's reflected attack » ; The Beast :
             * le renvoi de dégâts « will activate Parry ». La riposte part donc
             * quand la prochaine attaque ennemie est parée (parade pré-lançable
             * avant le combat), pas au lancement. Parry est « Affected by Charge » :
             * la Charge active est consommée ici et mémorisée pour la riposte.
             */
            idleAdventureManualStateV3.parryArmed=true;
            idleAdventureManualStateV3.parryChargeMult=1;
            if(idleAdventureManualStateV3.charge){
              idleAdventureManualStateV3.parryChargeMult=multiplicateurChargeAdventureIdleV3_(a);
              idleAdventureManualStateV3.charge=false;
            }
          }else{
            attaqueManuelleAdventureIdleV3_(def,a,fight,maintenant);
          }
        }else if(group==='defense'&&def.id==='block'){
          /* Block Damage Reduction : (Level+50)/(Level+100) d'Advanced Training, exposé par le serveur (audit 2026-09-23). */
          let reduction=(a&&a.stats&&Number.isFinite(Number(a.stats.blockReduction)))?Number(a.stats.blockReduction):.5;
          if(idleAdventureManualStateV3.charge){
            reduction=Math.min(.99,reduction*multiplicateurChargeAdventureIdleV3_(a));
            idleAdventureManualStateV3.charge=false;
          }
          idleAdventureManualStateV3.blockReduction=reduction;
          idleAdventureManualStateV3.blockUntil=maintenant+3000;
        }else if(group==='defense'&&def.id==='defensiveBuff'){
          idleAdventureManualStateV3.defensiveBuffUntil=maintenant+15000;
        }else if(group==='defense'&&def.id==='heal'){
          appliquerHealAdventureIdleV4_(a,fight);
        }else if(group==='defense'&&def.id==='offensiveBuff'){
          idleAdventureManualStateV3.offensiveBuffUntil=maintenant+15000;
        }else if(group==='defense'&&def.id==='charge'){
          idleAdventureManualStateV3.charge=true;
        }else if(group==='defense'&&def.id==='ultimateBuff'){
          idleAdventureManualStateV3.ultimateBuffUntil=maintenant+15000;
        }else if(def.id==='paralyze'){
          appliquerParalyzeAdventureIdleV4_(maintenant);
        }else if(def.id==='hyperRegen'){
          appliquerHyperRegenAdventureIdleV4_(a,fight,maintenant);
        }else if(def.id==='beastMode'){
          if(!a.skillState||typeof a.skillState!=='object')a.skillState={};
          a.skillState.beastMode=!Boolean(a.skillState.beastMode);
          actionAdventureIdleV47_({
            action:'setBeastMode',
            enabled:Boolean(a.skillState.beastMode)
          });
        }else if(def.id==='megaBuff'){
          idleAdventureManualStateV3.offensiveBuffUntil=maintenant+15000;
          idleAdventureManualStateV3.defensiveBuffUntil=maintenant+15000;
          idleAdventureManualStateV3.ultimateBuffUntil=maintenant+15000;
          idleAdventureManualStateV3.megaBuffUntil=maintenant+15000;
          idleAdventureManualStateV3.cooldownUntil.offensiveBuff=
            maintenant+cooldownDureeAdventureIdleV4_(
              definitionCompetenceAdventureIdleV3_('offensiveBuff'),a
            );
          idleAdventureManualStateV3.cooldownUntil.defensiveBuff=
            maintenant+cooldownDureeAdventureIdleV4_(
              definitionCompetenceAdventureIdleV3_('defensiveBuff'),a
            );
          idleAdventureManualStateV3.cooldownUntil.ultimateBuff=
            maintenant+cooldownDureeAdventureIdleV4_(
              definitionCompetenceAdventureIdleV3_('ultimateBuff'),a
            );
        }else if(def.id==='ohShit'){
          appliquerHealAdventureIdleV4_(a,fight);
          appliquerParalyzeAdventureIdleV4_(maintenant);
          appliquerHyperRegenAdventureIdleV4_(a,fight,maintenant);
          idleAdventureManualStateV3.cooldownUntil.heal=
            maintenant+cooldownDureeAdventureIdleV4_(
              definitionCompetenceAdventureIdleV3_('heal'),a
            );
          idleAdventureManualStateV3.cooldownUntil.paralyze=
            maintenant+cooldownDureeAdventureIdleV4_(
              definitionCompetenceAdventureIdleV3_('paralyze'),a
            );
          idleAdventureManualStateV3.cooldownUntil.hyperRegen=
            maintenant+cooldownDureeAdventureIdleV4_(
              definitionCompetenceAdventureIdleV3_('hyperRegen'),a
            );
        }else if(def.id==='move69'){
          if(!a.skillState||typeof a.skillState!=='object')a.skillState={};
          a.skillState.move69Uses=Math.min(
            69,
            Math.max(0,idleEntier_(a.skillState.move69Uses))+1
          );
          if(a.skillState.move69Uses>=69)a.skillState.endPiece481=true;
          ajouterLogAventureIdleV1_(
            'system',
            'A million realities collide in your mind, echoing a unified message: '+
            idleEntier_(a.skillState.move69Uses)
          );
          actionAdventureIdleV47_({action:'useMove69'});
        }

        rafraichirCommandesAdventureIdleV3_(maintenant);
      }
      window.__utiliserCompetenceAdventureIdleV3__=utiliserCompetenceAdventureIdleV3_;

      function rendreBoutonCompetenceAdventureIdleV3_(def,group){
        const a=aventureMetaIdleV47_(idleEtat);
        const unlocked=competenceAdventureDisponibleIdleV4_(def,group,a);
        const label=def.id==='move69'
          ?def.label+' · '+Math.max(0,idleEntier_(a&&a.skillState&&a.skillState.move69Uses))+'/69'
          :def.label;
        const titreVerrouillage=
          !unlocked&&def.id==='regular'
            ?'Attaque régulière se débloque à 5000 niveaux d’Attaque passive.'
            :'';
        return '<button type="button" class="soreal-idle-adventure-skill-v3'+
          (unlocked?'':' locked')+'" data-adventure-skill="'+idleHtml_(def.id)+'" '+
          (titreVerrouillage?'title="'+idleHtml_(titreVerrouillage)+'" ':'')+
          'onclick="window.__utiliserCompetenceAdventureIdleV3__(\''+idleHtml_(def.id)+'\')" '+
          (unlocked?'':'disabled')+'>'+
          '<span class="soreal-idle-adventure-skill-icon-v3">'+idleHtml_(def.icon)+'</span>'+
          '<span class="soreal-idle-adventure-skill-label-v3">'+idleHtml_(label)+'</span>'+
          '<span class="soreal-idle-adventure-skill-cd-v3"></span>'+
        '</button>';
      }

      function rendreCommandesAdventureIdleV3_(){
        const a=aventureMetaIdleV47_(idleEtat);
        const avancees=IDLE_ADVENTURE_ADVANCED_SKILLS_V4.filter(function(def){
          return competenceAdventureAvanceeDebloqueeIdleV4_(def.id,a);
        });
        return '<div id="sorealIdleAdventureManualV3" class="soreal-idle-adventure-manual-v3'+
          (idleAdventureIdleModeV3?'':' manual-active')+'">'+
          '<button type="button" class="soreal-idle-adventure-idle-toggle-v3'+
            (idleAdventureIdleModeV3?' active':'')+'" data-adventure-idle-toggle '+
            'aria-pressed="'+(idleAdventureIdleModeV3?'true':'false')+'" '+
            'onclick="window.__basculerIdleModeAdventureIdleV3__()">'+
            '<span>Idle Mode</span><b>'+(idleAdventureIdleModeV3?'ON':'OFF')+'</b>'+
          '</button>'+
          '<div class="soreal-idle-adventure-manual-grid-v3">'+
            '<div class="soreal-idle-adventure-skill-row-v3 attack">'+
              IDLE_ADVENTURE_MANUAL_ATTACKS_V3.map(function(def){
                return rendreBoutonCompetenceAdventureIdleV3_(def,'attack');
              }).join('')+
            '</div>'+
            '<div class="soreal-idle-adventure-skill-row-v3 defense">'+
              IDLE_ADVENTURE_MANUAL_DEFENSE_V3.map(function(def){
                return rendreBoutonCompetenceAdventureIdleV3_(def,'defense');
              }).join('')+
            '</div>'+
            (avancees.length
              ?'<div class="soreal-idle-adventure-skill-row-v3 advanced">'+
                avancees.map(function(def){
                  return rendreBoutonCompetenceAdventureIdleV3_(def,'advanced');
                }).join('')+
              '</div>'
              :'')+
          '</div>'+
        '</div>';
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-196 */
      const IDLE_ADVENTURE_MOB_NOM_CACHE_V1={};
      function cleMobNomCacheV1_(zone,boss,seed){
        return zone+'|'+(boss?'1':'0')+'|'+seed;
      }
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-197 */
      function nomDepuisCleR2AdventureIdleV1_(cle,zoneId){const api=window.__SOREAL_IDLE_TEXT_HELPERS_V1__;return api&&typeof api.nomDepuisCleR2==='function'?api.nomDepuisCleR2(cle,zoneId):'Créature';}
      function resoudreNomEnnemiAdventureIdleV1_(zoneId,boss,seed){
        const cle=cleMobNomCacheV1_(zoneId,boss,seed);
        if(IDLE_ADVENTURE_MOB_NOM_CACHE_V1[cle]!==undefined)return;
        IDLE_ADVENTURE_MOB_NOM_CACHE_V1[cle]=null;
        fetch(urlMobR2IdleV1_(zoneId,boss,seed),{method:'HEAD'})
          .then(function(r){
            const key=r&&r.headers?r.headers.get('x-soreal-idle-r2-key'):'';
            IDLE_ADVENTURE_MOB_NOM_CACHE_V1[cle]=
              key?nomDepuisCleR2AdventureIdleV1_(key,zoneId):'';
          })
          .catch(function(){
            IDLE_ADVENTURE_MOB_NOM_CACHE_V1[cle]='';
          });
      }
      function libelleEnnemiAdventureIdleV1_(fight){
        const boss=Boolean(fight&&fight.boss);
        const generique=boss?'le boss de zone':'l’ennemi';
        // Le runtime fournit le nom exact du bestiaire NGU. Il est prioritaire
        // sur tout nom déduit d'une ancienne clé R2/illustration.
        const nomNGU=String(fight&&fight.mobName||'').trim();
        if(nomNGU)return nomNGU;
        const zoneId=String(fight&&fight.zone||'').toLowerCase();
        if(!zoneId)return generique;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-198 */
        const seed=Math.max(0,Number(fight&&fight.monsterIndex)||0);
        const cle=cleMobNomCacheV1_(zoneId,boss,seed);
        const nomResolu=IDLE_ADVENTURE_MOB_NOM_CACHE_V1[cle];

        if(nomResolu)return nomResolu;
        if(nomResolu===undefined)resoudreNomEnnemiAdventureIdleV1_(zoneId,boss,seed);
        return generique;
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-199 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-200 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-201 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-202 */
      function regenReposAdventureIdleV3_(a,zoneCourante){
        const stats=(a&&a.stats)||{};
        const total=Math.max(
          Math.max(0,idleNombre_(stats.regenBase)||1),
          Math.max(0,idleNombre_(stats.regen))
        );
        if(zoneCourante==='safe'){
          return total*(a&&a.setRewards&&a.setRewards.safeZoneRegen10x?10:5);
        }
        return total;
      }

      function facteurAleatoireDegatsAdventureIdleV2_(){
        return .8+Math.random()*.4;
      }

      function degatsJoueurAdventureIdleV2_(power,toughness,idleBonus,facteur){
        const base=Math.max(
          0,
          idleNombre_(power)-idleNombre_(toughness)/2
        );
        return Math.max(
          0,
          Math.round(
            base*
            Math.max(0,idleNombre_(idleBonus)||1)*
            Math.max(.8,Math.min(1.2,idleNombre_(facteur)||1))
          )
        );
      }

      function degatsEnnemiAdventureIdleV2_(power,toughness,facteur){
        const p=Math.max(0,idleNombre_(power));
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-203 */
        const base=Math.max(
          p*.1,
          p-idleNombre_(toughness)/2
        );
        return Math.max(
          0,
          Math.round(
            base*
            Math.max(.8,Math.min(1.2,idleNombre_(facteur)||1))
          )
        );
      }

      function multiplicateurIdleAttackAdventureIdleV2_(a){
        const sp=a&&a.stats&&a.stats.specials;
        const serveur=sp&&Number(sp.idleAttackMultiplier);
        if(serveur>0)return serveur;
        return Boolean(sp&&sp.idleAttack)
          ?1.5
          :1.2;
      }

      function intervalleAttaqueEnnemiAdventureIdleV2_(fight){
        return Math.max(
          100,
          Math.round(
            Math.max(.1,idleNombre_(fight&&fight.mobAttackRate)||1)*1000
          )
        );
      }

      function identiteFightAdventureIdleV2_(fight){
        return [
          String(fight&&fight.zone||''),
          String(fight&&fight.monsterIndex!=null?fight.monsterIndex:''),
          fight&&fight.boss?'1':'0',
          String(fight&&fight.mobName||''),
          String(fight&&fight.monsterHpMax||'')
        ].join('|');
      }

      /*
       * 2026-09-23 (audit) : la régénération d'aventure paraissait instantanée.
       * Cause : adventureRestPv (PV de repos entre deux combats / en Safe Zone)
       * vivait dans idleEtat, qui est REMPLACÉ à chaque synchro serveur
       * (toutes les 15 s) par un objet où ce champ n'existe pas ; le tick
       * suivant lisait « null » et remettait les PV au maximum. Le PV de
       * repos est désormais mémorisé hors de idleEtat et réinjecté.
       */
      let idleAdventureRestPvMemoV1=null;
      function restPvInitialIdleV1_(pvMax){
        const memo=idleAdventureRestPvMemoV1;
        if(memo==null||!Number.isFinite(memo))return pvMax;
        return Math.min(pvMax,Math.max(0,memo));
      }
      function memoriserRestPvIdleV1_(valeur){
        const n=idleNombre_(valeur);
        idleAdventureRestPvMemoV1=Number.isFinite(n)?Math.max(0,n):null;
      }

      function resetHorlogesFightAdventureIdleV2_(){
        idleAdventureFightNextPlayerHitV2=0;
        idleAdventureFightNextEnemyHitV2=0;
        idleAdventureFightLastRegenAtV2=0;
        idleAdventureFightIdentityV2='';
      }

      function envoyerResolutionAdventurePendingV2_(){
        if(
          !idleAdventureResolutionPendingV2||
          metaOccupeIdleV130_()||
          !SOREAL_SESSION
        ){
          return false;
        }
        const action=idleAdventureResolutionPendingV2;
        actionMetaIdleV130_({
          action:'adventure',
          adventure:{action:action}
        });
        if(metaOccupeIdleV130_()){
          idleAdventureResolutionPendingV2='';
          return true;
        }
        return false;
      }

      function appliquerRegenCombatAdventureIdleV2_(a,fight,jusquaMs){
        if(!fight||!fight.active)return;
        const jusqua=Math.max(0,idleNombre_(jusquaMs));
        if(!idleAdventureFightLastRegenAtV2){
          idleAdventureFightLastRegenAtV2=jusqua;
          return;
        }
        const secondes=Math.max(
          0,
          (jusqua-idleAdventureFightLastRegenAtV2)/1000
        );
        if(!(secondes>0))return;

        const regenBaseJoueur=
          Math.max(0,idleNombre_(a&&a.stats&&a.stats.regen))*
          (idleAdventureIdleModeV3?1.2:1);
        const debutRegen=idleAdventureFightLastRegenAtV2;
        const hyperSecondes=Math.max(
          0,
          (Math.min(jusqua,idleAdventureManualStateV3.hyperRegenUntil)-debutRegen)/1000
        );
        const regenJoueur=
          regenBaseJoueur*(secondes+hyperSecondes*4);
        const regenEnnemi=
          Math.max(0,idleNombre_(fight.mobHpRegen));

        if(regenJoueur>0){
          fight.playerHp=Math.min(
            idleNombre_(fight.playerHpMax),
            idleNombre_(fight.playerHp)+regenJoueur
          );
        }
        if(regenEnnemi>0){
          fight.monsterHp=Math.min(
            idleNombre_(fight.monsterHpMax),
            idleNombre_(fight.monsterHp)+regenEnnemi*secondes
          );
        }
        idleAdventureFightLastRegenAtV2=jusqua;
      }

      function terminerCombatAdventureLocalV2_(fight,victoire){
        if(!fight||!fight.active)return;
        const nom=libelleEnnemiAdventureIdleV1_(fight);
        const finCombatMsV166=
          reinitialiserHorlogeRegenReposAdventureIdleV166_(Date.now());

        if(victoire){
          idleEtat.adventureRestPv=Math.max(0,idleNombre_(fight.playerHp));
          memoriserRestPvIdleV1_(idleEtat.adventureRestPv);
          programmerRespawnAdventureIdleV165_(finCombatMsV166);
          ajouterLogAventureIdleV1_(
            'system',
            'Vous avez vaincu '+nom+' !'
          );
          idleAdventureResolutionPendingV2='resolveZoneFight';
        }else{
          idleEtat.adventureRestPv=0;
          memoriserRestPvIdleV1_(0);
          idleAdventureKoAlertV1=true;
          ajouterLogAventureIdleV1_(
            'enemy',
            'Vous avez été mis K.O. par '+nom+' ! Retour à la Safe Zone…'
          );
          idleAdventureResolutionPendingV2='loseZoneFight';
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-204 */
        fight.active=false;
        resetHorlogesFightAdventureIdleV2_();
        pousserEtatVersRuntimePartageIdleV1_();
        envoyerResolutionAdventurePendingV2_();
      }

      function progresserZoneFightLocalIdleV1_(maintenantTick,dt){
        const a=aventureMetaIdleV47_(idleEtat);
        const fight=a&&a.fight;
        rafraichirCommandesAdventureIdleV3_(maintenantTick);

        if(!fight||!fight.active){
          resetHorlogesFightAdventureIdleV2_();

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-205 */
          const resolutionEnAttente=idleAdventureResolutionPendingV2;
          envoyerResolutionAdventurePendingV2_();
          if(resolutionEnAttente==='loseZoneFight')return;

          const ecouleReposAdventureSecV166=
            ecouleRegenReposAdventureIdleV166_(maintenantTick);
          const stats=(a&&a.stats)||{};
          const pvMaxRepos=Math.max(0,idleNombre_(stats.hp));
          const zoneCourante=String((a&&a.selectedZone)||'safe');
          const regen=regenReposAdventureIdleV3_(a,zoneCourante);

          if(idleEtat.adventureRestPv==null){
            idleEtat.adventureRestPv=restPvInitialIdleV1_(pvMaxRepos);
          }
          idleEtat.adventureRestPv=Math.min(
            pvMaxRepos,
            Math.max(0,idleNombre_(idleEtat.adventureRestPv))+
              regen*ecouleReposAdventureSecV166
          );
          memoriserRestPvIdleV1_(idleEtat.adventureRestPv);

          if(
            a&&
            zoneCourante!=='safe'&&
            aventureDebloqueeIdleV47_(idleEtat)
          ){
            if(!idleAdventureRespawnAtV1&&!idleAdventureRespawnStartPendingV165){
              programmerRespawnAdventureIdleV165_(maintenantTick);
            }
          }else{
            annulerRespawnAdventureIdleV165_();
          }
          return;
        }

        reinitialiserHorlogeRegenReposAdventureIdleV166_(maintenantTick);
        annulerRespawnAdventureIdleV165_();

        if(idleNombre_(fight.monsterHp)<=0){
          terminerCombatAdventureLocalV2_(fight,true);
          return;
        }
        if(idleNombre_(fight.playerHp)<=0){
          terminerCombatAdventureLocalV2_(fight,false);
          return;
        }

        const identite=identiteFightAdventureIdleV2_(fight);
        if(identite!==idleAdventureFightIdentityV2){
          idleAdventureFightIdentityV2=identite;
          idleAdventureFightNextPlayerHitV2=
            maintenantTick+intervalleIdleAttackAdventureIdleV4_(a);
          idleAdventureFightNextEnemyHitV2=
            maintenantTick+intervalleAttaqueEnnemiAdventureIdleV2_(fight);
          idleAdventureFightLastRegenAtV2=maintenantTick;
        }

        let evenements=0;
        let modifie=false;
        const MAX_EVENEMENTS_PAR_TICK=12;

        while(evenements<MAX_EVENEMENTS_PAR_TICK){
          const joueurDu=
            idleAdventureIdleModeV3&&
            idleAdventureFightNextPlayerHitV2<=maintenantTick;
          if(
            idleAdventureFightNextEnemyHitV2<=maintenantTick&&
            idleAdventureManualStateV3.enemyParalyzedUntil>
              idleAdventureFightNextEnemyHitV2
          ){
            idleAdventureFightNextEnemyHitV2=
              idleAdventureManualStateV3.enemyParalyzedUntil;
          }
          const ennemiDu=
            idleAdventureFightNextEnemyHitV2<=maintenantTick;

          if(!joueurDu&&!ennemiDu)break;

          const joueurPremier=
            joueurDu&&(
              !ennemiDu||
              idleAdventureFightNextPlayerHitV2<=idleAdventureFightNextEnemyHitV2
            );
          const momentEvenement=joueurPremier
            ?idleAdventureFightNextPlayerHitV2
            :idleAdventureFightNextEnemyHitV2;

          appliquerRegenCombatAdventureIdleV2_(
            a,
            fight,
            momentEvenement
          );

          if(joueurPremier){
            idleAdventureFightNextPlayerHitV2+=
              intervalleIdleAttackAdventureIdleV4_(a);

            const avant=idleNombre_(fight.monsterHp);
            const degats=Math.min(
              avant,
              degatsJoueurAdventureIdleV2_(
                Math.max(0,idleNombre_(a&&a.stats&&a.stats.power))*
                  multiplicateurPowerManuelAdventureIdleV3_(momentEvenement,a),
                fight.mobToughness,
                multiplicateurIdleAttackAdventureIdleV2_(a),
                facteurAleatoireDegatsAdventureIdleV2_()
              )
            );
            fight.monsterHp=Math.max(0,avant-degats);

            impactMonstreAdventureIdleV1_();
            ajouterLogAventureIdleV1_(
              'player',
              'Vous frappez '+libelleEnnemiAdventureIdleV1_(fight)+
              ' pour '+idleEntier_(degats)+' dégâts !'
            );
            modifie=true;
            evenements+=1;

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-206 */
            if(fight.monsterHp<=0){
              terminerCombatAdventureLocalV2_(fight,true);
              return;
            }
            continue;
          }

          idleAdventureFightNextEnemyHitV2+=
            intervalleAttaqueEnnemiAdventureIdleV2_(fight);

          const avant=idleNombre_(fight.playerHp);
          const toughnessEffectif=
            Math.max(0,idleNombre_(a&&a.stats&&a.stats.toughness))*
            multiplicateurToughnessManuelAdventureIdleV3_(momentEvenement);
          let degats=Math.min(
            avant,
            degatsEnnemiAdventureIdleV2_(
              fight.mobPower,
              toughnessEffectif,
              facteurAleatoireDegatsAdventureIdleV2_()
            )
          );
          if(idleAdventureManualStateV3.blockUntil>momentEvenement){
            const avantBlocage=degats;
            degats=Math.max(
              0,
              Math.round(
                degats*(1-Math.max(0,Math.min(.99,idleAdventureManualStateV3.blockReduction)))
              )
            );
            const bloques=Math.max(0,avantBlocage-degats);
            if(bloques>0){
              ajouterLogAventureIdleV1_(
                'player',
                '🛡️ Blocage : '+idleEntier_(bloques)+' dégâts bloqués !'
              );
            }
          }
          let riposteParryMult=0;
          if(idleAdventureManualStateV3.parryArmed){
            degats=Math.max(0,Math.round(degats*.5));
            idleAdventureManualStateV3.parryArmed=false;
            riposteParryMult=Math.max(1,idleNombre_(idleAdventureManualStateV3.parryChargeMult)||1);
            idleAdventureManualStateV3.parryChargeMult=1;
          }
          if(beastModeActifAdventureIdleV4_(a)){
            degats=Math.max(0,Math.round(degats*3));
          }
          degats=Math.min(avant,degats);
          fight.playerHp=Math.max(0,avant-degats);

          ajouterLogAventureIdleV1_(
            'enemy',
            libelleEnnemiAdventureIdleV1_(fight)+
            ' vous a attaqué pour '+idleEntier_(degats)+' dégâts !'
          );
          modifie=true;
          evenements+=1;

          if(fight.playerHp<=0){
            terminerCombatAdventureLocalV2_(fight,false);
            return;
          }
          /* Riposte automatique de la parade (voir utiliserCompetenceAdventureIdleV3_). */
          if(riposteParryMult>0){
            attaqueManuelleAdventureIdleV3_(
              definitionCompetenceAdventureIdleV3_('parry'),
              a,
              fight,
              momentEvenement,
              riposteParryMult
            );
            if(!fight.active)return;
          }
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-207 */
        appliquerRegenCombatAdventureIdleV2_(
          a,
          fight,
          maintenantTick
        );

        if(modifie){
          pousserEtatVersRuntimePartageIdleV1_();
        }
      }

      function impactMonstreAdventureIdleV1_(){
        const el=document.getElementById('sorealIdleAdventureSceneMobV1');
        if(!el)return;

        el.classList.remove('impact-boss-v46');
        void el.offsetWidth;
        el.classList.add('impact-boss-v46');

        setTimeout(function(){
          if(el)el.classList.remove('impact-boss-v46');
        },260);
      }

      function impactsEchelonneesAdventureIdleV1_(nombre){
        const total=Math.max(1,idleEntier_(nombre)||1);

        for(let i=0;i<total;i+=1){
          if(i===0){
            impactMonstreAdventureIdleV1_();
          }else{
            setTimeout(impactMonstreAdventureIdleV1_,i*110);
          }
        }
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-208 */
      function affronterTitanAdventureIdleV47_(id,difficulty){
        const payload={action:'titan',titan:String(id||'')};
        if(difficulty)payload.difficulty=String(difficulty);
        actionAdventureIdleV47_(payload);
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-209 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-210 */
      const IDLE_WALDERP_PANEL_LABELS_V147={
        combat:'⚔️ Fight Boss',
        entrainement:'🥊 Basic Training',
        inventaire:'🎒 Inventory',
        bestiaire:'📖 Bestiary',
        parametres:'⚙️ Settings'
      };

      function walderpCacheIdleV147_(j){
        const a=aventureMetaIdleV47_(j);
        const titans=a&&Array.isArray(a.titans)?a.titans:[];
        const walderp=titans.find(function(t){
          return t&&t.id==='t5'&&t.state&&t.state.hiddenPanel;
        });
        if(!walderp)return null;
        return String(walderp.state.hiddenPanel||'')||null;
      }

      function walderpBanniereIdleV147_(j){
        const panel=walderpCacheIdleV147_(j);
        if(!panel)return '';

        const ici=panel===idleMenuActifV28;
        const nomPage=IDLE_WALDERP_PANEL_LABELS_V147[panel]||panel;

        return '<div class="soreal-idle-walderp-hide-v147'+(ici?' here':'')+'">'+
          (ici
            ?'👻 Walderp se cache ici ! <button type="button" class="soreal-idle-expand-button-v25" onclick="window.__trouverWalderpIdleV147__()">Le débusquer !</button>'
            :'👻 Walderp se cache quelque part… essaie : <b>'+idleHtml_(nomPage)+'</b>')+
        '</div>';
      }

      function trouverWalderpIdleV147_(){
        actionAdventureIdleV47_({action:'titanFound',titan:'t5'});
      }
      window.__trouverWalderpIdleV147__=trouverWalderpIdleV147_;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-211 */
      const IDLE_ADVENTURE_UNLOCK_ITEMS_V1={
        aNumber:{nom:'A Number',systeme:'NGU'},
        giantSeed:{nom:'Giant Seed',systeme:'Yggdrasil'},
        scrapPaper:{nom:'Scrap Paper',systeme:'Diggers'},
        uugHair:{nom:'UUG Hair',systeme:'Beards'},
        pissedOffKey:{nom:'Pissed Off Key',systeme:'la Tour'},
        wandoos98:{nom:'Wandoos 98',systeme:'Wandoos'}
      };

      function objetsDeblocageDisponiblesAdventureIdleV1_(a){
        const items=a&&a.unlockItems&&typeof a.unlockItems==='object'?a.unlockItems:{};
        return Object.keys(IDLE_ADVENTURE_UNLOCK_ITEMS_V1).filter(function(id){
          return Boolean(items[id]);
        });
      }

      function consommerDeblocageAdventureIdleV47_(id){
        actionAdventureIdleV47_({action:'consumeUnlock',item:String(id||'')});
      }
      window.__consommerDeblocageAdventureIdleV47__=consommerDeblocageAdventureIdleV47_;

      function consommerObjetSkillAdventureIdleV4_(id){
        actionAdventureIdleV47_({action:'consumeSkillItem',id:String(id||'')});
      }
      window.__consommerObjetSkillAdventureIdleV4__=consommerObjetSkillAdventureIdleV4_;

      function transformerObjetAdventureIdleV4_(id){
        actionAdventureIdleV47_({action:'transformAdventureItem',id:String(id||'')});
      }
      window.__transformerObjetAdventureIdleV4__=transformerObjetAdventureIdleV4_;

      function equiperObjetAdventureIdleV47_(id,slot){
        actionAdventureIdleV47_({action:'equip',id:String(id||''),slot:String(slot||'')});
      }

      function desequiperObjetAdventureIdleV47_(id,targetIndex){
        const payload={
          action:'unequip',
          id:String(id||'')
        };
        if(targetIndex!=null){
          payload.targetIndex=idleEntier_(targetIndex);
        }
        actionAdventureIdleV47_(payload);
      }
      window.__desequiperObjetAdventureIdleV47__=desequiperObjetAdventureIdleV47_;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-212 */
      function fusionnerObjetAdventureIdleV47_(idA,idB){
        actionAdventureIdleV47_({action:'merge',a:String(idA||''),b:String(idB||'')});
      }

      function boosterCubeAdventureIdleV47_(boostId){
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-213 */
        actionAdventureIdleV47_({
          action:'boost',
          boostId:String(boostId||''),
          toCube:true
        });
      }

      function actionMetaV47_(payload){
        actionMetaIdleV130_(payload||{});
      }

      function setDiggerIdleV47_(id,niveau){
        actionMetaV47_({action:'setDiggerLevel',digger:String(id||''),level:Math.max(0,idleEntier_(niveau))});
      }

      function toggleDiggerIdleV47_(id,actif){
        actionMetaV47_({action:'toggleDigger',digger:String(id||''),active:Boolean(actif)});
      }

      function formatterHeuresIdleV47_(heures){
        const api=window.__SOREAL_IDLE_TIME_FORMAT_V1__;
        return api&&typeof api.heures==='function'?api.heures(heures):'0,00 h';
      }
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-214 */
      function toggleMenuZoneAdventureIdleV1_(event){
        if(event)event.stopPropagation();
        document.getElementById('idleZoneSelectCustom')?.classList.toggle('open');
      }
      if(!window.__SOREAL_IDLE_ZONE_SELECT_DOCUMENT_V1__){
        window.__SOREAL_IDLE_ZONE_SELECT_DOCUMENT_V1__=true;
        document.addEventListener('click',function(event){
          const bloc=document.getElementById('idleZoneSelectCustom');
          if(bloc&&event&&!bloc.contains(event.target)){
            bloc.classList.remove('open');
          }
        });
      }
      window.__toggleMenuZoneAdventureIdleV1__=toggleMenuZoneAdventureIdleV1_;

      window.__idleAdventureActionV47__=actionAdventureIdleV47_;
      window.__selectionnerZoneAdventureIdleV47__=selectionnerZoneAdventureIdleV47_;
      window.__combattreZoneAdventureIdleV47__=combattreZoneAdventureIdleV47_;
      window.__affronterTitanAdventureIdleV47__=affronterTitanAdventureIdleV47_;
      window.__equiperObjetAdventureIdleV47__=equiperObjetAdventureIdleV47_;
      window.__equiperParIdAdventureIdleV138__=equiperParIdAdventureIdleV138_;
      window.__fusionnerObjetAdventureIdleV47__=fusionnerObjetAdventureIdleV47_;
      window.__boosterCubeAdventureIdleV47__=boosterCubeAdventureIdleV47_;
      window.__actionMetaV47__=actionMetaV47_;
      window.__setDiggerIdleV47__=setDiggerIdleV47_;
      window.__toggleDiggerIdleV47__=toggleDiggerIdleV47_;

      function pageEntrainementIdleV28_(j){
        return pageEntrainementIdleLegacyV47_(j);
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-215 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-216 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-217 */
      function rendreZoneCombatAdventureIdleV1_(a,nomJoueur){
        const fight=a&&a.fight;
        const stats=a&&a.stats||{};
        const pvMaxRepos=Math.max(0,idleNombre_(stats.hp));
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-218 */
        if(idleEtat&&(idleEtat.adventureRestPv==null||idleEtat.adventureRestPv>pvMaxRepos)){
          idleEtat.adventureRestPv=restPvInitialIdleV1_(pvMaxRepos);
        }
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-219 */
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-220 */
        const pvMax=fight&&fight.active?idleEntier_(fight.playerHpMax):idleEntier_(pvMaxRepos);
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-221 */
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-222 */
        const zoneCourante=String((a&&a.selectedZone)||'safe');
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-223 */
        return ''+
          '<div class="soreal-idle-adventure-player-panel-v1" aria-hidden="true"></div>'+
          (fight&&fight.active
            ?'<div class="soreal-idle-adventure-fight-note-v1">⚔️ Combat en cours…</div>'
            :zoneCourante==='safe'
              ?'<div class="soreal-idle-adventure-fight-note-v1">🛡️ Zone sûre : choisis une autre zone pour combattre.</div>'
              :'<div class="soreal-idle-adventure-fight-note-v1">'+idleHtml_(texteProchainCombatAdventureIdleV165_())+'</div>'
          )+
          rendreCommandesAdventureIdleV3_()+
          '<div class="soreal-idle-section-v8">'+
            '<div id="sorealIdleAdventureLogV1" class="soreal-idle-adventure-log-v1">'+
              (idleAdventureLogV1.length
                ?idleAdventureLogV1.map(function(l){
                    return '<div class="soreal-idle-adventure-log-line-v1 '+idleHtml_(l.type)+(l.rareteClasse?' '+idleHtml_(l.rareteClasse):'')+'">'+idleHtml_(l.texte)+'</div>';
                  }).join('')
                :'<div class="soreal-idle-adventure-log-line-v1 system">Le journal commencera au prochain combat.</div>'
              )+
            '</div>'+
          '</div>';
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-224 */
      const IDLE_TITAN_DIFFICULTY_LABELS_V145={easy:'Easy',normal:'Normal',hard:'Hard',brutal:'Brutal'};

      function carteTitanAdventureIdleV145_(t,verrouille,kills){
        const difficultes=t.difficulties&&typeof t.difficulties==='object'?t.difficulties:null;
        const selectId='sorealIdleTitanDifficulteV145_'+idleHtml_(t.id);

        const selecteur=difficultes
          ?'<select id="'+selectId+'" class="soreal-idle-titan-difficulty-v145">'+
            Object.keys(difficultes).map(function(cle){
              const seuils=difficultes[cle]||{};
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-225 */
              const idleInfo=(seuils.idleP!=null&&seuils.idleT!=null)
                ?' · Idle Power '+formatGrandNombreIdleV70_(seuils.idleP)+' · Idle Toughness '+formatGrandNombreIdleV70_(seuils.idleT)
                :'';
              return '<option value="'+idleHtml_(cle)+'" title="'+
                'Power '+formatGrandNombreIdleV70_(seuils.p||0)+' · Toughness '+formatGrandNombreIdleV70_(seuils.t||0)+idleInfo+
                '">'+idleHtml_(IDLE_TITAN_DIFFICULTY_LABELS_V145[cle]||cle)+'</option>';
            }).join('')+
          '</select>'
          :'';

        const onclickAffronter=difficultes
          ?'window.__affronterTitanAdventureIdleV47__(\''+idleHtml_(t.id)+'\',document.getElementById(\''+selectId+'\').value)'
          :'window.__affronterTitanAdventureIdleV47__(\''+idleHtml_(t.id)+'\')';

        return '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;border-radius:12px;background:rgba(255,255,255,.04);opacity:'+(verrouille?'.45':'1')+'">'+
          '<span><b>'+idleHtml_(t.name||t.id)+'</b><br><small>Boss '+idleEntier_(t.boss||0)+' · '+kills+' victoire(s)</small></span>'+
          '<span style="display:flex;align-items:center;gap:8px">'+
            selecteur+
            '<button type="button" class="soreal-idle-expand-button-v25" '+(verrouille?'disabled':'onclick="'+onclickAffronter+'"')+'>Affronter</button>'+
          '</span>'+
        '</div>';
      }

function pageAventureIdleV28_(j){
        const a=aventureMetaIdleV47_(j);
        const zones=a&&Array.isArray(a.zones)?a.zones:[];
        const debloquee=aventureDebloqueeIdleV47_(j);
        if(!a||!debloquee){
          return entetePageIdleV28_('🗺️ Adventure','Le premier vrai terrain de loot de SOREAL IDLE.')+
            '<div class="soreal-idle-section-v8" style="text-align:center;padding:28px">'+
              '<div style="font-size:42px">🔒</div>'+
              '<div style="font-size:20px;font-weight:900;margin-top:8px">Adventure verrouillé</div>'+
              '<div style="margin-top:8px;color:#aeb5c8">Bats le boss 4 pour débloquer Adventure (et son inventaire).</div>'+
            '</div>';
        }
        const selected=String(a.selectedZone||'safe');
        const zone=zones.find(function(z){return z&&z.id===selected;})||zones.find(function(z){return z&&z.unlocked;})||null;
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-226 */
        const titans=(Array.isArray(a.titans)?a.titans:[]).filter(function(t){
          return t&&t.progressionUnlocked!==false;
        });
        const deblocagesDisponibles=objetsDeblocageDisponiblesAdventureIdleV1_(a);
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-227 */
        return ''+
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-228 */
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-229 */
          '<div class="soreal-idle-section-v8"><div class="soreal-idle-window-title-v31">🗺️ Zones</div>'+
            '<div class="soreal-idle-zone-picker-v1">'+
              '<button type="button" class="soreal-idle-zone-arrow-v1" onclick="window.__zoneAdventurePrecedenteV1__()" aria-label="Zone précédente">◀</button>'+
              '<div class="team-sort-custom soreal-idle-zone-custom-v1" id="idleZoneSelectCustom">'+
                '<button type="button" class="team-sort-trigger" onclick="window.__toggleMenuZoneAdventureIdleV1__(event)">'+
                  '<span class="team-sort-trigger-main">'+
                    '<span class="team-sort-trigger-label">Zone</span>'+
                    '<span class="team-sort-trigger-value">'+idleHtml_((zone&&(zone.name||zone.id))||'—')+'</span>'+
                  '</span>'+
                  '<span class="team-sort-arrow">▼</span>'+
                '</button>'+
                '<div class="team-sort-menu">'+
                  /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-230 */
                  zones.filter(function(z){return z&&z.unlocked;}).map(function(z){
                    const active=String(z.id)===selected;
                    /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-231 */
                    const idleInfo=(z.idleP!=null&&z.idleT!=null)
                      ?' · Idle Power '+formatGrandNombreIdleV70_(z.idleP)+' · Idle Toughness '+formatGrandNombreIdleV70_(z.idleT)
                      :'';
                    return '<button type="button" data-zone-id="'+idleHtml_(z.id)+'" class="team-sort-option'+(active?' active':'')+'" title="Power '+formatGrandNombreIdleV70_(z.p||0)+' · Toughness '+formatGrandNombreIdleV70_(z.t||0)+idleInfo+'" onclick="window.__selectionnerZoneAdventureIdleV47__(\''+idleHtml_(z.id)+'\');window.__toggleMenuZoneAdventureIdleV1__();">'+
                      '<span>'+idleHtml_(z.name||z.id)+'</span>'+
                      (active?'<span class="team-sort-option-arrow">✓</span>':'')+
                    '</button>';
                  }).join('')+
                '</div>'+
              '</div>'+
              '<button type="button" class="soreal-idle-zone-arrow-v1" onclick="window.__zoneAdventureSuivanteV1__()" aria-label="Zone suivante">▶</button>'+
            '</div>'+
          '</div>'+
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-232 */
          (zone?rendreZoneCombatAdventureIdleV1_(a,j.nom):'')+
          (titans.length?'<div class="soreal-idle-section-v8"><div class="soreal-idle-window-title-v31">👹 Titans</div><div style="display:grid;gap:8px">'+titans.map(function(t){const verrouille=t.progressionUnlocked===false;const kills=idleEntier_(t.state&&t.state.kills||0);return carteTitanAdventureIdleV145_(t,verrouille,kills);}).join('')+'</div></div>':'')+
          (deblocagesDisponibles.length?'<div class="soreal-idle-section-v8"><div class="soreal-idle-window-title-v31">🔓 Objets de déblocage</div><div style="display:grid;gap:8px">'+deblocagesDisponibles.map(function(id){const d=IDLE_ADVENTURE_UNLOCK_ITEMS_V1[id];return '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;border-radius:12px;background:rgba(120,255,180,.08);border:1px solid rgba(120,255,180,.3)"><span><b>'+idleHtml_(d.nom)+'</b><br><small>Débloque '+idleHtml_(d.systeme)+'</small></span><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__consommerDeblocageAdventureIdleV47__(\''+idleHtml_(id)+'\')">Utiliser</button></div>';}).join('')+'</div></div>':'')+
          /* 2026-09-24 (Norman : « trop de menus sur téléphone ») : tout l'Inventory (équipement, sac, coffre, options) est maintenant sous la page Adventure. */
          (j.inventaireDebloque?pageInventaireIdleV28_(j):'');
      }


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-233 */
      function pageCollectionIdleV22_(j){
        return entetePageIdleV28_(
          '📚 Sets',
          'Progression réelle des sets NGU : chaque pièce doit atteindre le niveau 100 pour activer sa récompense de complétion.'
        )+rendreCollectionIdleV22_(j);
      }

      function libelleRecompenseSetAdventureIdleV163_(reward){
        const r=reward&&typeof reward==='object'?reward:{};
        const parts=[];
        const addNombre=function(key,label,suffix){
          const value=idleNombre_(r[key]);
          if(value)parts.push('+'+formatGrandNombreIdleV70_(value)+(suffix||'')+' '+label);
        };
        addNombre('experience','EXP');
        addNombre('ap','AP');
        addNombre('energySpeed','Energy Speed');
        addNombre('energyPower','Energy Power');
        addNombre('energyBars','Energy Bars');
        addNombre('magicPower','Magic Power');
        addNombre('magicBars','Magic Bars');
        addNombre('magicCap','Magic Cap');
        if(idleNombre_(r.respawn)>0)parts.push('Ennemis Adventure '+formatGrandNombreIdleV70_(idleNombre_(r.respawn)*100,2)+' % plus rapides');
        if(idleNombre_(r.drop)>0)parts.push('+'+formatGrandNombreIdleV70_(idleNombre_(r.drop)*100,2)+' % Drop Chance');
        if(r.safeZoneRegen10x)parts.push('Safe Zone : HP Regen ×10');
        if(r.noEquipmentChallenge)parts.push('Débloque No Equipment Challenge');
        if(r.idleAttack)parts.push('Idle Attack améliorée');
        if(r.wandoosMeh)parts.push('Wandoos MEH débloqué');
        if(idleNombre_(r.diggerSlot)>0)parts.push('+'+idleEntier_(r.diggerSlot)+' emplacement Digger');
        if(idleNombre_(r.luckyCharms)>0)parts.push('+'+idleEntier_(r.luckyCharms)+' Lucky Charms');
        if(idleNombre_(r.extraDropLevelChance)>0)parts.push('+'+formatGrandNombreIdleV70_(idleNombre_(r.extraDropLevelChance)*100,2)+' % chance niveau de drop bonus');
        if(idleNombre_(r.boostEffectiveness)>0)parts.push('+'+formatGrandNombreIdleV70_(idleNombre_(r.boostEffectiveness)*100,2)+' % efficacité des Boosts');
        if(idleNombre_(r.nguSpeedPct)>0)parts.push('+'+formatGrandNombreIdleV70_(r.nguSpeedPct,2)+' % NGU Speed');
        return parts.length?parts.join(' · '):'Récompense NGU sans bonus numérique affichable ici';
      }

      function catalogueSetsCollectionIdleV164_(a){
        const direct=
          a&&a.setCatalog&&typeof a.setCatalog==='object'
            ?a.setCatalog
            :{};

        if(Object.keys(direct).length){
          return direct;
        }

        const itemCatalog=
          a&&a.itemCatalog&&typeof a.itemCatalog==='object'
            ?a.itemCatalog
            :{};

        const derives={};

        Object.keys(itemCatalog).forEach(function(definitionId){
          const def=itemCatalog[definitionId];
          const setId=String(def&&def.set||'');
          if(!setId||!def||def.kind!=='equipment')return;

          if(!derives[setId]){
            derives[setId]={
              id:setId,
              name:String(def.setName||setId),
              source:'',
              slots:[],
              reward:null
            };
          }

          const slot=String(
            def.slot||
            String(definitionId).split(':').pop()||
            ''
          );

          if(slot&&derives[setId].slots.indexOf(slot)===-1){
            derives[setId].slots.push(slot);
          }
        });

        return derives;
      }

      function rendreCollectionIdleV22_(j){
        const a=aventureMetaIdleV47_(j);
        const setCatalog=catalogueSetsCollectionIdleV164_(a);
        const itemCatalog=a&&a.itemCatalog&&typeof a.itemCatalog==='object'?a.itemCatalog:{};
        const itemList=a&&a.itemList&&typeof a.itemList==='object'?a.itemList:{};
        const completed=a&&a.completedSets&&typeof a.completedSets==='object'?a.completedSets:{};
        const sets=Object.values(setCatalog).filter(function(setDef){
          const setId=String(setDef&&setDef.id||'');
          const slots=Array.isArray(setDef&&setDef.slots)?setDef.slots:[];
          return slots.some(function(slot){
            const info=itemList[setId+':'+String(slot)];
            return Boolean(info&&info.seen);
          });
        });

        if(!sets.length){
          return '<div class="soreal-idle-empty-v10">Aucun set découvert pour l’instant. Les cases apparaîtront dès que tu trouveras la première pièce d’un set.</div>';
        }

        return sets.map(function(setDef){
          const setId=String(setDef&&setDef.id||'');
          const slots=Array.isArray(setDef&&setDef.slots)?setDef.slots:[];
          const total=slots.length;
          let vus=0;
          let niveau100=0;
          let verts=0;

          const cartes=slots.map(function(slot){
            const definitionId=setId+':'+String(slot);
            const def=itemCatalog[definitionId]||{};
            const info=itemList[definitionId]||null;
            const vu=Boolean(info&&info.seen);
            const lvl=vu?idleEntier_(info.maxLevel):0;
            const lvl100=Boolean(info&&info.maxed);
            const vert=Boolean(info&&info.fullyMaxed);
            if(vu)vus+=1;
            if(lvl100)niveau100+=1;
            if(vert)verts+=1;

            const pseudo={
              set:setId,
              slot:def.slot||slot,
              name:def.name||definitionId,
              definitionId:definitionId,
              wikiItemId:def.wikiItemId||0,
              kind:'equipment',
              basePower:def.basePower||0,
              baseToughness:def.baseToughness||0
            };

            if(!vu)return '';
            return '<div class="soreal-idle-collection-slot-v32'+(vu?' found':'')+(vert?' maxed':'')+'">'+
              '<div style="font-size:20px">'+(vu?iconeObjetAdventureIdleV138_(pseudo):'❓')+'</div>'+
              '<div>'+(vu?idleHtml_(def.name||definitionId):'Inconnu')+'</div>'+
              (vu
                ?'<small>Niv. '+lvl+'/100'+
                  (vert?' · ✅ 100 %':lvl100?' · boosts à compléter':'')+
                '</small>'
                :'')+
            '</div>';
          }).join('');

          const completeCollection=Boolean(total>0&&verts===total);
          const recompenseHtml=setDef.reward
            ?'<div class="soreal-idle-collection-reward-v32">Récompense NGU au niveau 100 : <strong>'+
                idleHtml_(libelleRecompenseSetAdventureIdleV163_(setDef.reward))+
              '</strong></div>'
            :'';
          return '<div class="soreal-idle-collection-zone-v32">'+
            '<div class="soreal-idle-collection-zone-head-v32">'+
              '<div>'+
                '<div class="soreal-idle-collection-zone-name-v32">📚 '+idleHtml_(setDef.name||setId)+'</div>'+
                recompenseHtml+
                '<div class="soreal-idle-collection-reward-v32">'+
                  'Découverts : '+vus+' · Niveau 100 : '+niveau100+
                  ' · 100 % boosts : '+verts+
                '</div>'+
              '</div>'+
              '<div class="soreal-idle-collection-count-v32'+(completeCollection?' done':'')+'">'+
                verts+(completeCollection?' ✅':'')+
              '</div>'+
            '</div>'+
            '<div class="soreal-idle-collection-slots-v32">'+cartes+'</div>'+
          '</div>';
        }).join('');
      }

      function voirCollectionIdleV22_(
        definitionId
      ){
        const zones=
          idleEtat &&
          idleEtat.collections &&
          Array.isArray(
            idleEtat.collections.zones
          )
            ?idleEtat.collections.zones
            :[];

        let objet=null;

        zones.some(function(zone){
          return (
            Array.isArray(zone.objets)
              ?zone.objets
              :[]
          ).some(function(item){
            if(
              String(
                item &&
                item.definitionId || ''
              ) ===
              String(
                definitionId || ''
              ) &&
              item.objet
            ){
              objet=item.objet;
              return true;
            }

            return false;
          });
        });

        if(!objet){
          return;
        }

        const detail=
          document.getElementById(
            'sorealIdleCollectionDetailV22'
          );

        if(!detail){
          return;
        }

        detail.className=
          'soreal-idle-collection-detail-v22 show';

        detail.innerHTML=
          '<div class="soreal-idle-collection-detail-name-v22">'+
            iconeSlotIdleV10_(objet.slot)+' '+
            idleHtml_(
              objet.nomComplet ||
              objet.nom ||
              'Objet'
            )+
          '</div>'+
          '<div class="soreal-idle-collection-detail-meta-v22">'+
            idleHtml_(
              objet.rareteNom ||
              objet.rarete ||
              'Commun'
            )+
            ' · '+
            idleHtml_(
              nomSlotIdleV10_(
                objet.slot
              )
            )+
            '<br>⚔️ Meilleur bonus : +'+
            idleEntier_(
              objet.bonusPuissance
            )+
            ' puissance'+
            '<br>🔗 Meilleure fusion : +'+
            idleEntier_(
              objet.fusionMax
            )+
            (
              objet.setNom
                ?'<br>🧩 Set : '+
                  idleHtml_(objet.setNom)
                :''
            )+
          '</div>';
      }


      function voirObjetCollectionDepuisElementIdleV22_(
        element
      ){
        if(!element){
          return;
        }

        voirCollectionIdleV22_(
          element.getAttribute(
            'data-collection-id'
          ) || ''
        );
      }


      window.__voirObjetCollectionDepuisElementIdleV22__=
        voirObjetCollectionDepuisElementIdleV22_;

      window.__voirObjetCollectionIdleV22__=
        voirCollectionIdleV22_;


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-234 */
      const ADVENTURE_CORE_SLOTS_V138=['head','chest','legs','boots','weapon'];

      function emplacementEquipementAdventureIdleV138_(item){
        const slot=String(item&&item.slot||'');
        return ADVENTURE_CORE_SLOTS_V138.indexOf(slot)!==-1?slot:'accessory';
      }

      function urlImageObjetAdventureIdleV138_(item){
        const p=new URLSearchParams();
        p.set('set',String(item&&item.set||''));
        if(item&&item.slot)p.set('slot',String(item.slot));
        if(item&&item.definitionId)p.set('definition',String(item.definitionId));
        if(item&&item.wikiItemId)p.set('wikiItemId',String(item.wikiItemId));
        const nom=item&&(item.name||item.nom);
        if(nom)p.set('name',String(nom));
        return '/api/idle/media/item?'+p.toString();
      }

      function urlImageBoostAdventureIdleV138_(boost){
        const p=new URLSearchParams();
        p.set('boostType',String(boost&&boost.boostType||''));
        p.set('strength',String(boost&&boost.strength||''));
        if(boost&&boost.wikiItemId)p.set('wikiItemId',String(boost.wikiItemId));
        return '/api/idle/media/boost?'+p.toString();
      }

      function iconeSlotAdventureIdleV138_(slot){const a=window.__SOREAL_IDLE_INVENTORY_PRESENTATION_V1__;return a&&a.iconeAdventure?a.iconeAdventure(slot):'📦';}

      /*
       * Niveau inscrit SUR l'image de l'objet (Norman, 2026-09-24 : « le niveau inscrit sur l'image de manière visible avec un contour,
       * joli ») et V vert quand l'objet est au maximum : niveau 100 ET statistiques comblées par les boosts — le même prérequis que le
       * Coffre (item.fullyMaxed, calculé par le serveur ; un boost, sans statistiques, l'est dès le niveau 100).
       */
      function badgesNiveauObjetIdleV1_(item){
        if(!item)return '';
        const niveau=idleEntier_(item.level);
        return (niveau>=1
          ?'<i class="idle-lvl-badge-v1'+(niveau>=100?' max':'')+'" aria-hidden="true">'+niveau+'</i>'
          :'')+
          (item.fullyMaxed
            ?'<i class="idle-maxok-badge-v1" title="Niveau 100 et statistiques au maximum" aria-hidden="true">✔</i>'
            :'');
      }

      function iconeObjetAdventureIdleV138_(item){
        return iconeBaseObjetAdventureIdleV138_(item)+badgesNiveauObjetIdleV1_(item);
      }

      function iconeBaseObjetAdventureIdleV138_(item){
        if(item&&item.kind==='boost'){
          return '<img class="idle-boost-icon-v1" src="'+idleHtml_(urlImageBoostAdventureIdleV138_(item))+'" alt="" loading="lazy" draggable="false" '+
            'onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'block\'">'+
            '<span style="display:none">⚡</span>';
        }
        if(item&&item.kind==='cube'){
          return '<img src="'+idleHtml_(urlImageObjetAdventureIdleV138_(item))+'" alt="" loading="lazy" draggable="false" '+
            'onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'block\'">'+
            '<span style="display:none">🧊</span>';
        }
        if(!item||!item.set)return iconeSlotAdventureIdleV138_(item&&item.slot);
        return '<img src="'+idleHtml_(urlImageObjetAdventureIdleV138_(item))+'" alt="" loading="lazy" draggable="false" '+
          'onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'block\'">'+
          '<span style="display:none">'+iconeSlotAdventureIdleV138_(item.slot)+'</span>';
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-235 */
      const IDLE_RARETE_SEUILS_V1=[0.76,1.61,2.47,3.33,4.19,5.04];
      function idleRareteClasseObjetAdventureIdleV1_(item){const a=window.__SOREAL_IDLE_INVENTORY_PRESENTATION_V1__;return a&&a.rarete?a.rarete(item):'';}

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-236 */
      function rendreSlotPaperdollAdventureIdleV138_(slotKey,titre,item){
        const nomComplet=item
          ?idleHtml_(item.name||item.nom||'')+(idleEntier_(item.level)>0?' · Niv. '+idleEntier_(item.level)+'/100':'')
          :idleHtml_(titre);
        const contenu=item
          ?'<div class="soreal-idle-v138-slot-icon" title="'+nomComplet+'">'+iconeObjetAdventureIdleV138_(item)+'</div>'
          :'<div class="soreal-idle-v138-slot-icon" style="opacity:.35" title="'+nomComplet+'">'+iconeSlotAdventureIdleV138_(slotKey)+'</div>';

        const occupantId=item?idleHtml_(String(item.id||'')):'';
        const rareteClasse=idleRareteClasseObjetAdventureIdleV1_(item);

        return '<div class="soreal-idle-v138-slot soreal-idle-v138-slot-'+idleHtml_(slotKey)+(rareteClasse?' '+rareteClasse:'')+(item&&item.locked?' idle-item-locked-v165':'')+'" '+
          'data-equip-slot-v180="'+idleHtml_(slotKey)+'" '+
          (occupantId?'data-occupant-id="'+occupantId+'" data-soreal-longpress="idle-item" ':'')+
          'draggable="false" '+
          '>'+
          (item
            ?''
            :'')+
          contenu+
          '</div>';
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-237 */
      function rendreEmplacementAccessoireAdventureIdleV138_(item,classeSupplementaire){
        const nomComplet=item
          ?idleHtml_(item.name||item.nom||'')+(idleEntier_(item.level)>0?' · Niv. '+idleEntier_(item.level)+'/100':'')
          :'Accessoire';
        const contenu=item
          ?'<div class="soreal-idle-v138-slot-icon" title="'+nomComplet+'">'+iconeObjetAdventureIdleV138_(item)+'</div>'
          :'<div class="soreal-idle-v138-slot-icon" style="opacity:.35" title="'+nomComplet+'">💍</div>';

        const occupantId=item?idleHtml_(String(item.id||'')):'';
        const rareteClasse=idleRareteClasseObjetAdventureIdleV1_(item);

        return '<div class="soreal-idle-v138-slot'+(classeSupplementaire?' '+classeSupplementaire:'')+(rareteClasse?' '+rareteClasse:'')+(item&&item.locked?' idle-item-locked-v165':'')+'" '+
          'data-equip-slot-v180="accessory" '+
          (occupantId?'data-occupant-id="'+occupantId+'" data-soreal-longpress="idle-item" ':'')+
          'draggable="false" '+
          '>'+
          (item
            ?''
            :'')+
          contenu+'</div>';
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-238 */
      function rendreAccessoiresAdventureIdleV138_(equipment,itemById,capacite){
        const ids=Array.isArray(equipment&&equipment.accessories)?equipment.accessories:[];
        const objetsPortes=ids.map(function(id){return itemById.get(String(id));}).filter(Boolean);
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-239 */
        const vides=Math.max(0,idleEntier_(capacite,2)-objetsPortes.length);
        const tousLesSlots=objetsPortes.concat(Array(vides).fill(null));

        const classesGrille=['soreal-idle-v138-slot-acc1','soreal-idle-v138-slot-acc2'];
        const enGrille=tousLesSlots.slice(0,2).map(function(item,index){
          return rendreEmplacementAccessoireAdventureIdleV138_(item,classesGrille[index]);
        }).join('');

        const debordement=tousLesSlots.slice(2);
        const debordementHtml=debordement.length
          ?'<div class="soreal-idle-v138-accessories">'+
            debordement.map(function(item){return rendreEmplacementAccessoireAdventureIdleV138_(item,'');}).join('')+
          '</div>'
          :'';

        return {enGrille:enGrille,debordement:debordementHtml};
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-240 */
      function rendreCarteSacAdventureIdleV138_(item,slotIndex){
        const id=idleHtml_(item.id);
        const rareteClasse=idleRareteClasseObjetAdventureIdleV1_(item);
        const titre=idleHtml_(item.name||item.nom||'Objet')+
          (idleEntier_(item.level)>0?' · Niv. '+idleEntier_(item.level)+'/100':'');
        const version=idleHtml_(signatureObjetInventaireIdleV160_(item));
        return '<div class="soreal-idle-v138-bag-card'+(rareteClasse?' '+rareteClasse:'')+(item&&item.locked?' idle-item-locked-v165':'')+'" '+
          'data-item-id="'+id+'" '+
          'data-item-version="'+version+'" '+
          'data-slot-index="'+idleEntier_(slotIndex)+'" '+
          'data-soreal-longpress="idle-item" '+
          'draggable="false" '+
          'title="'+titre+'" '+
          '>'+
          ''+
          iconeObjetAdventureIdleV138_(item)+
        '</div>';
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-241 */
      function rendreGrilleSacAdventureIdleV1_(items,capacite){
        const total=Math.max(idleEntier_(capacite),items.length);
        const cases=[];
        for(let i=0;i<total;i+=1){
          const item=items[i];
          cases.push(
            item
              ?rendreCarteSacAdventureIdleV138_(item,i)
              :'<div class="soreal-idle-v138-bag-card soreal-idle-v138-bag-card-vide" data-slot-index="'+i+'"></div>'
          );
        }
        return '<div class="soreal-idle-v138-bag">'+cases.join('')+'</div>';
      }

      function reordonnerInventaireAdventureIdleV162_(sourceId,targetId,targetIndex){
        actionAdventureIdleV47_({
          action:'reorderInventory',
          sourceId:String(sourceId||''),
          targetId:String(targetId||''),
          targetIndex:targetIndex==null?null:idleEntier_(targetIndex)
        });
      }

      function deposerSurEmplacementVideSacAdventureIdleV1_(event,targetIndex){
        if(event){event.preventDefault();event.stopPropagation();}
        const id=idSourceAdventureIdleV138_(event);
        nettoyerEtatDragAdventureIdleV138_();
        if(!id||!idleEtat)return;
        const a=aventureMetaIdleV47_(idleEtat);
        const equipment=a&&a.equipment||{};
        const estEquipe=
          ADVENTURE_CORE_SLOTS_V138.some(function(slot){return String(equipment[slot]||'')===id;})||
          (Array.isArray(equipment.accessories)&&equipment.accessories.map(String).indexOf(id)!==-1);
        if(estEquipe){
          desequiperObjetAdventureIdleV47_(
            id,
            targetIndex
          );
          return;
        }
        reordonnerInventaireAdventureIdleV162_(id,'',targetIndex);
      }
      window.__deposerSurEmplacementVideSacAdventureIdleV1__=deposerSurEmplacementVideSacAdventureIdleV1_;

      let idleAdventureDragIdV138='';
      let idleAdventureSelectionIdV138='';
      let idleAdventureIgnorerClicJusquaV165=0;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-242 */
      const IDLE_ADVENTURE_GESTE_SEUIL_PX_V196=32;
      const IDLE_ADVENTURE_DOUBLE_TAP_MS_V196=420;
      let idleDernierClicDroitSourisMsV209=0;

      let idleAdventureGesteV196=null;
      let idleAdventureDernierTapIdV196='';
      let idleAdventureDernierTapMsV196=0;
      let idleAdventureCibleDragV196=null;
      let idleAdventureDragGhostV183=null;

      function supprimerGhostDragAdventureIdleV183_(){
        if(idleAdventureDragGhostV183&&idleAdventureDragGhostV183.parentNode){
          idleAdventureDragGhostV183.remove();
        }
        idleAdventureDragGhostV183=null;
      }

      function creerGhostDragAdventureIdleV183_(source,point){
        supprimerGhostDragAdventureIdleV183_();
        if(!source||!point)return;
        const ghost=document.createElement('div');
        ghost.className='soreal-idle-drag-ghost-v183';
        const visuel=source.querySelector('img,.soreal-idle-v138-slot-icon,span');
        if(visuel)ghost.appendChild(visuel.cloneNode(true));
        else ghost.textContent='📦';
        document.body.appendChild(ghost);
        idleAdventureDragGhostV183=ghost;
        deplacerGhostDragAdventureIdleV183_(point);
      }

      function deplacerGhostDragAdventureIdleV183_(point){
        if(!idleAdventureDragGhostV183||!point)return;
        idleAdventureDragGhostV183.style.left=idleNombre_(point.clientX)+'px';
        idleAdventureDragGhostV183.style.top=idleNombre_(point.clientY)+'px';
      }

      function elementObjetGesteAdventureIdleV196_(target){
        if(!target||!target.closest)return null;
        return target.closest(
          '.soreal-idle-v138-bag-card[data-item-id],'+
          '.soreal-idle-v138-slot[data-occupant-id]'
        );
      }

      function idObjetGesteAdventureIdleV196_(element){
        if(!element)return '';
        return String(
          element.getAttribute('data-item-id')||
          element.getAttribute('data-occupant-id')||
          ''
        );
      }

      function nettoyerCibleDragAdventureIdleV196_(){
        if(idleAdventureCibleDragV196){
          idleAdventureCibleDragV196.classList.remove('drag-over');
          idleAdventureCibleDragV196=null;
        }
      }

      function cibleDragAdventureIdleV196_(point){
        if(!point||typeof document.elementFromPoint!=='function')return null;
        const brut=document.elementFromPoint(
          idleNombre_(point.clientX),
          idleNombre_(point.clientY)
        );
        if(!brut||!brut.closest)return null;
        return brut.closest(
          '[data-idle-trash-slot-v165],'+
          '[data-idle-cube-drop-v180],'+
          '[data-idle-coffre-drop-v180],'+
          '.soreal-idle-v138-bag-card[data-item-id],'+
          '.soreal-idle-v138-bag-card-vide[data-slot-index],'+
          '.soreal-idle-v138-slot[data-equip-slot-v180]'
        );
      }

      function marquerCibleDragAdventureIdleV196_(point){
        const cible=cibleDragAdventureIdleV196_(point);
        if(cible===idleAdventureCibleDragV196)return cible;
        nettoyerCibleDragAdventureIdleV196_();
        idleAdventureCibleDragV196=cible;
        if(cible)cible.classList.add('drag-over');
        return cible;
      }

      function appliquerDepotGesteAdventureIdleV196_(sourceId,cible){
        const source=String(sourceId||'');
        if(!source||!cible)return;

        if(cible.hasAttribute('data-idle-trash-slot-v165')){
          mettreObjetDansTrashAdventureIdleV165_(source);
          return;
        }

        if(cible.hasAttribute('data-idle-cube-drop-v180')){
          const a=idleEtat&&aventureMetaIdleV47_(idleEtat);
          const items=a&&Array.isArray(a.inventory)?a.inventory:[];
          const item=items.find(function(x){return String(x&&x.id)===source;});
          if(!item||item.kind!=='boost'){
            toastIdleV5_('Seul un boost peut être absorbé par le Cube.');
            return;
          }
          boosterCubeAdventureIdleV47_(source);
          return;
        }

        if(cible.hasAttribute('data-idle-coffre-drop-v180')){
          actionAdventureIdleV47_({action:'coffreDeposer',id:source});
          return;
        }

        if(cible.hasAttribute('data-equip-slot-v180')){
          appliquerActionSlotAdventureIdleV138_(
            source,
            String(cible.getAttribute('data-occupant-id')||'')
          );
          return;
        }

        const cibleId=String(cible.getAttribute('data-item-id')||'');
        if(cibleId){
          if(cibleId!==source){
            fusionnerSiPossibleAdventureIdleV138_(source,cibleId);
          }
          return;
        }

        if(cible.classList.contains('soreal-idle-v138-bag-card-vide')){
          const a=idleEtat&&aventureMetaIdleV47_(idleEtat);
          const equipment=a&&a.equipment||{};
          const estEquipe=
            ADVENTURE_CORE_SLOTS_V138.some(function(slot){
              return String(equipment[slot]||'')===source;
            })||
            (
              Array.isArray(equipment.accessories)&&
              equipment.accessories.map(String).indexOf(source)!==-1
            );

          if(estEquipe){
            desequiperObjetAdventureIdleV47_(
              source,
              idleEntier_(cible.getAttribute('data-slot-index'))
            );
          }else{
            reordonnerInventaireAdventureIdleV162_(
              source,
              '',
              idleEntier_(cible.getAttribute('data-slot-index'))
            );
          }
        }
      }

      function annulerTimerGesteAdventureIdleV196_(){
        if(idleAdventureGesteV196&&idleAdventureGesteV196.timer){
          clearTimeout(idleAdventureGesteV196.timer);
          idleAdventureGesteV196.timer=0;
        }
      }

      function libererCaptureGesteAdventureIdleV196_(geste){
        const el=geste&&geste.sourceEl;
        if(
          !el||
          geste.pointerId==null||
          typeof el.hasPointerCapture!=='function'||
          typeof el.releasePointerCapture!=='function'
        )return;

        try{
          if(el.hasPointerCapture(geste.pointerId)){
            el.releasePointerCapture(geste.pointerId);
          }
        }catch(_){}
      }

      function terminerEtatGesteAdventureIdleV196_(options){
        const geste=idleAdventureGesteV196;
        annulerTimerGesteAdventureIdleV196_();
        if(!(options&&options.garderCapture)){
          libererCaptureGesteAdventureIdleV196_(geste);
        }
        idleAdventureGesteV196=null;
        supprimerGhostDragAdventureIdleV183_();
        nettoyerCibleDragAdventureIdleV196_();
      }

      function popupDetailsObjetAdventureIdleOuvertV207_(){
        const root=document.getElementById('soreal-idle-v138-details');
        if(!root)return false;
        return root.style.display!=='none'&&root.getClientRects().length>0;
      }

      function cibleDansPopupDetailsObjetAdventureIdleV207_(target){
        if(!target||!target.closest)return false;
        return Boolean(
          target.closest('#soreal-idle-v138-details')||
          target.closest('#soreal-idle-v138-details-compare-v183')
        );
      }

      function fermerPopupDetailsSiExterieurAdventureIdleV207_(event){
        if(!popupDetailsObjetAdventureIdleOuvertV207_())return false;
        const target=event&&event.target;
        if(cibleDansPopupDetailsObjetAdventureIdleV207_(target))return false;
        fermerDetailsObjetAdventureIdleV1_();
        return true;
      }


      function ouvrirDetailsObjetParGesteAdventureIdleV196_(id){
        const objet=String(id||'');
        if(!objet)return false;

        nettoyerEtatDragAdventureIdleV138_();
        idleAdventureSelectionIdV138=objet;

        document.querySelectorAll(
          '[data-item-id],[data-occupant-id]'
        ).forEach(function(el){
          const cible=String(
            el.getAttribute('data-item-id')||
            el.getAttribute('data-occupant-id')||
            ''
          );
          if(cible===objet)el.classList.add('selected');
        });

        afficherDetailsObjetAdventureIdleV138_(objet);
        idleAdventureIgnorerClicJusquaV165=Date.now()+750;
        return true;
      }

      function estDoubleTapGesteAdventureIdleV196_(id,pointerType){
        if(pointerType==='mouse')return false;

        const maintenant=Date.now();
        const objet=String(id||'');
        const estDouble=Boolean(
          objet&&
          objet===idleAdventureDernierTapIdV196&&
          maintenant-idleAdventureDernierTapMsV196<=IDLE_ADVENTURE_DOUBLE_TAP_MS_V196
        );

        if(estDouble){
          idleAdventureDernierTapIdV196='';
          idleAdventureDernierTapMsV196=0;
        }else{
          idleAdventureDernierTapIdV196=objet;
          idleAdventureDernierTapMsV196=maintenant;
        }

        return estDouble;
      }

      function executerTapSlotAdventureIdleV196_(element){
        if(!element)return;
        const occupant=String(element.getAttribute('data-occupant-id')||'');
        if(!occupant)return;

        if(
          idleAdventureComparerEnAttenteV183&&
          occupant!==idleAdventureComparerPremierV183
        ){
          ouvrirComparaisonObjetAdventureIdleV183_(occupant);
          return;
        }

        if(!idleAdventureSelectionIdV138){
          idleAdventureSelectionIdV138=occupant;
          element.classList.add('selected');
          return;
        }

        const source=idleAdventureSelectionIdV138;
        nettoyerEtatDragAdventureIdleV138_();
        appliquerActionSlotAdventureIdleV138_(source,occupant);
      }

      function executerTapCarteAdventureIdleV196_(element,id){
        const objet=String(id||'');
        if(!element||!objet)return;

        if(
          idleAdventureComparerEnAttenteV183&&
          objet!==idleAdventureComparerPremierV183
        ){
          ouvrirComparaisonObjetAdventureIdleV183_(objet);
          return;
        }

        if(idleAdventureSelectionIdV138&&idleAdventureSelectionIdV138!==objet){
          const source=idleAdventureSelectionIdV138;
          nettoyerEtatDragAdventureIdleV138_();
          fusionnerSiPossibleAdventureIdleV138_(source,objet);
          return;
        }

        if(idleAdventureSelectionIdV138===objet){
          nettoyerEtatDragAdventureIdleV138_();
          fermerDetailsObjetAdventureIdleV1_();
          return;
        }

        nettoyerEtatDragAdventureIdleV138_();
        idleAdventureSelectionIdV138=objet;
        element.classList.add('selected');
      }

      /*
       * Action rapide d'un objet du sac (2026-09-24, comme le clic droit de NGU Idle) :
       * - une pièce identique (même definitionId) est déjà équipée -> fusion dans la pièce équipée ;
       * - sinon -> équipement (remplace la pièce du slot).
       * Les boosts ne sont pas concernés (retourne false). Réutilise la décision du glisser-déposer sur un slot.
       */
      function actionRapideObjetAdventureIdleV209_(id){
        const objet=String(id||'');
        if(!objet||!idleEtat)return false;
        const a=aventureMetaIdleV47_(idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const item=items.find(function(x){return String(x&&x.id)===objet;});
        if(!item||item.kind==='boost')return false;

        const equipement=a.equipment||{};
        const idsEquipes=ADVENTURE_CORE_SLOTS_V138
          .map(function(slot){return String(equipement[slot]||'');})
          .concat(Array.isArray(equipement.accessories)?equipement.accessories.map(String):[])
          .filter(Boolean);
        if(idsEquipes.indexOf(objet)!==-1)return false;

        const jumeau=idsEquipes
          .map(function(idEquipe){return items.find(function(x){return String(x&&x.id)===idEquipe;});})
          .find(function(x){return x&&x.kind!=='boost'&&x.definitionId===item.definitionId;});

        nettoyerEtatDragAdventureIdleV138_();
        if(jumeau)appliquerActionSlotAdventureIdleV138_(objet,String(jumeau.id));
        else equiperParIdAdventureIdleV138_(objet);
        return true;
      }

      function executerTapObjetAdventureIdleV196_(element,id){
        if(!element)return;
        if(element.classList.contains('soreal-idle-v138-bag-card')){
          executerTapCarteAdventureIdleV196_(element,id);
          return;
        }
        executerTapSlotAdventureIdleV196_(element);
      }

      function commencerGesteAdventureIdleV196_(event,element,id){
        terminerEtatGesteAdventureIdleV196_();

        const geste={
          pointerId:event.pointerId,
          pointerType:String(event.pointerType||'mouse'),
          sourceEl:element,
          itemId:String(id||''),
          startX:idleNombre_(event.clientX),
          startY:idleNombre_(event.clientY),
          drag:false,
          moved:false,
          appuiLong:false,
          timer:0
        };

        idleAdventureGesteV196=geste;

        if(typeof element.setPointerCapture==='function'){
          try{element.setPointerCapture(event.pointerId);}catch(_){}
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-243 */
      }

      function deplacerGesteAdventureIdleV196_(event){
        const geste=idleAdventureGesteV196;
        if(!geste||geste.pointerId!==event.pointerId)return;

        const dx=idleNombre_(event.clientX)-geste.startX;
        const dy=idleNombre_(event.clientY)-geste.startY;
        const distance=Math.hypot(dx,dy);

        if(distance<=IDLE_ADVENTURE_GESTE_SEUIL_PX_V196)return;

        geste.moved=true;
        annulerTimerGesteAdventureIdleV196_();

        if(geste.appuiLong)return;

        if(!geste.drag){
          geste.drag=true;
          idleAdventureDragIdV138=geste.itemId;
          idleAdventureIgnorerClicJusquaV165=Date.now()+750;
          geste.sourceEl.classList.add('selected');
          creerGhostDragAdventureIdleV183_(geste.sourceEl,event);
        }

        deplacerGhostDragAdventureIdleV183_(event);
        marquerCibleDragAdventureIdleV196_(event);

        if(event.cancelable)event.preventDefault();
        event.stopPropagation();
      }

      function finirGesteAdventureIdleV196_(event){
        const geste=idleAdventureGesteV196;
        if(!geste||geste.pointerId!==event.pointerId)return;

        if(event.cancelable)event.preventDefault();
        event.stopPropagation();

        annulerTimerGesteAdventureIdleV196_();

        if(geste.drag){
          const cible=marquerCibleDragAdventureIdleV196_(event);
          const source=geste.itemId;
          idleAdventureIgnorerClicJusquaV165=Date.now()+750;
          terminerEtatGesteAdventureIdleV196_();
          nettoyerEtatDragAdventureIdleV138_();
          appliquerDepotGesteAdventureIdleV196_(source,cible);
          return;
        }

        if(geste.appuiLong){
          idleAdventureIgnorerClicJusquaV165=Date.now()+750;
          terminerEtatGesteAdventureIdleV196_();
          return;
        }

        const element=geste.sourceEl;
        const id=geste.itemId;
        const pointerType=geste.pointerType;
        const moved=geste.moved;

        idleAdventureIgnorerClicJusquaV165=Date.now()+750;
        terminerEtatGesteAdventureIdleV196_();

        if(moved)return;

        if(estDoubleTapGesteAdventureIdleV196_(id,pointerType)){
          /* 2026-09-24 : double tap rapide (téléphone) = action rapide équiper / fusionner, comme le clic droit sur PC.
             Les boosts et les objets déjà équipés gardent l'ancien comportement (détails ; maintien long = détails). */
          if(
            element&&
            element.classList.contains('soreal-idle-v138-bag-card')&&
            actionRapideObjetAdventureIdleV209_(id)
          ){
            return;
          }
          ouvrirDetailsObjetParGesteAdventureIdleV196_(id);
          return;
        }

        executerTapObjetAdventureIdleV196_(element,id);
      }

      function annulerGesteAdventureIdleV196_(event){
        const geste=idleAdventureGesteV196;
        if(!geste)return;
        if(event&&event.pointerId!=null&&geste.pointerId!==event.pointerId)return;
        idleAdventureIgnorerClicJusquaV165=Date.now()+350;
        terminerEtatGesteAdventureIdleV196_();
      }

      function installerGestesInventaireAdventureIdleV196_(){
        if(document.documentElement.dataset.idleInventoryGesturesV196==='1')return;
        document.documentElement.dataset.idleInventoryGesturesV196='1';

        document.addEventListener('pointerdown',function(event){
          if(event.isPrimary===false)return;
          if(String(event.pointerType||'mouse')==='mouse'&&event.button===2)idleDernierClicDroitSourisMsV209=Date.now();
          if(String(event.pointerType||'mouse')==='mouse'&&event.button!==0)return;

          fermerPopupDetailsSiExterieurAdventureIdleV207_(event);

          const element=elementObjetGesteAdventureIdleV196_(event.target);
          const id=idObjetGesteAdventureIdleV196_(element);
          if(!element||!id)return;

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-244 */
          if(event.cancelable)event.preventDefault();
          event.stopPropagation();

          commencerGesteAdventureIdleV196_(event,element,id);
        },{capture:true,passive:false});

        document.addEventListener('pointermove',function(event){
          deplacerGesteAdventureIdleV196_(event);
        },{capture:true,passive:false});

        document.addEventListener('pointerup',function(event){
          finirGesteAdventureIdleV196_(event);
        },{capture:true,passive:false});

        document.addEventListener('pointercancel',function(event){
          annulerGesteAdventureIdleV196_(event);
        },true);

        document.addEventListener('lostpointercapture',function(event){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-245 */
          if(
            idleAdventureGesteV196&&
            idleAdventureGesteV196.pointerId===event.pointerId
          ){
            annulerGesteAdventureIdleV196_(event);
          }
        },true);

        document.addEventListener('soreal-longpress',function(event){
          /* PC : le maintien du clic n'ouvre plus le popup (il se refermait au relâchement) — c'est le survol qui l'ouvre. */
          if(event.detail&&event.detail.pointerType==='mouse')return;
          const element=elementObjetGesteAdventureIdleV196_(event.target);
          const id=idObjetGesteAdventureIdleV196_(element);
          if(!element||!id)return;

          if(
            idleAdventureGesteV196&&
            idleAdventureGesteV196.itemId===id
          ){
            idleAdventureGesteV196.appuiLong=true;
            annulerTimerGesteAdventureIdleV196_();
          }

          idleAdventureIgnorerClicJusquaV165=Date.now()+750;
          ouvrirDetailsObjetParGesteAdventureIdleV196_(id);

          if(event.cancelable)event.preventDefault();
          event.stopPropagation();
        },true);

        document.addEventListener('contextmenu',function(event){
          const element=elementObjetGesteAdventureIdleV196_(event.target);
          if(!element)return;
          event.preventDefault();
          /* Clic droit de la souris (PC) sur un objet du sac : action rapide équiper / fusionner. Un contextmenu tactile
             (maintien long) n'est pas un clic droit : il reste géré par le composant de maintien long. */
          const souris=
            event.pointerType==='mouse'||
            (!event.pointerType&&Date.now()-idleDernierClicDroitSourisMsV209<1500);
          if(!souris||!element.classList.contains('soreal-idle-v138-bag-card'))return;
          actionRapideObjetAdventureIdleV209_(idObjetGesteAdventureIdleV196_(element));
        },true);

        document.addEventListener('click',function(event){

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-246 */
          fermerPopupDetailsSiExterieurAdventureIdleV207_(event);

          if(!elementObjetGesteAdventureIdleV196_(event.target))return;
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-247 */
          event.preventDefault();
          event.stopPropagation();
        },true);
      }

      installerGestesInventaireAdventureIdleV196_();

      /*
       * PC — popup d'objet au SURVOL (Norman, 2026-09-24) : « quand on passe la souris sur un objet, le popup apparaît ; il disparaît quand
       * on sort de la fenêtre du popup. Tant qu'on y reste, on a accès aux boutons (verrouiller…). » Souris seulement (le tactile garde le
       * maintien long). Le popup s'ouvre à côté de l'objet ; un court délai de grâce laisse passer la souris de l'objet au popup.
       */
      let idleSurvolIdV1='';
      let idleSurvolTimerOuvrirV1=0;
      let idleSurvolTimerFermerV1=0;
      let idleSurvolBloqueV1=false;

      function survolPossibleIdleV1_(event){
        if(!event||event.pointerType==='touch'||event.pointerType==='pen')return false;
        if(window.matchMedia&&!window.matchMedia('(hover:hover) and (pointer:fine)').matches)return false;
        return true;
      }

      function survolOccupeIdleV1_(){
        return Boolean(
          idleSurvolBloqueV1||
          idleAdventureDragIdV138||
          idleAdventureGesteV196||
          idleAdventureComparerEnAttenteV183||
          document.getElementById('soreal-idle-v138-details-compare-v183')
        );
      }

      function annulerTimersSurvolIdleV1_(){
        clearTimeout(idleSurvolTimerOuvrirV1);
        clearTimeout(idleSurvolTimerFermerV1);
        idleSurvolTimerOuvrirV1=0;
        idleSurvolTimerFermerV1=0;
      }

      function fermerSurvolIdleV1_(){
        annulerTimersSurvolIdleV1_();
        if(!idleSurvolIdV1)return;
        idleSurvolIdV1='';
        if(popupDetailsObjetAdventureIdleOuvertV207_())fermerDetailsObjetAdventureIdleV1_();
      }

      function ouvrirSurvolIdleV1_(element,id){
        if(survolOccupeIdleV1_()||!element||!element.isConnected)return;
        if(!ouvrirDetailsObjetParGesteAdventureIdleV196_(id))return;
        idleSurvolIdV1=id;
        idleAdventureIgnorerClicJusquaV165=0; /* le survol ne doit pas avaler le premier clic */
        const root=document.getElementById('soreal-idle-v138-details');
        if(!root)return;
        /* À côté de l'objet (à droite, sinon à gauche), sans le recouvrir : la souris peut passer de l'objet au popup. */
        const r=element.getBoundingClientRect();
        const largeur=root.offsetWidth||320;
        const hauteur=root.offsetHeight||160;
        const marge=8;
        let left=r.right+4;
        if(left+largeur>window.innerWidth-marge)left=r.left-largeur-4;
        left=Math.min(Math.max(marge,left),Math.max(marge,window.innerWidth-largeur-marge));
        const top=Math.min(Math.max(marge,r.top-6),Math.max(marge,window.innerHeight-hauteur-marge));
        idleItemPopupPositionV1_={left:Math.round(left),top:Math.round(top)};
        root.style.left=idleItemPopupPositionV1_.left+'px';
        root.style.top=idleItemPopupPositionV1_.top+'px';
      }

      document.addEventListener('mouseover',function(event){
        if(!survolPossibleIdleV1_(event))return;
        const cible=event.target;
        if(cibleDansPopupDetailsObjetAdventureIdleV207_(cible)){
          clearTimeout(idleSurvolTimerFermerV1);
          idleSurvolTimerFermerV1=0;
          return;
        }
        const element=elementObjetGesteAdventureIdleV196_(cible);
        const id=idObjetGesteAdventureIdleV196_(element);
        if(element&&id){
          clearTimeout(idleSurvolTimerFermerV1);
          idleSurvolTimerFermerV1=0;
          if(id===idleSurvolIdV1&&popupDetailsObjetAdventureIdleOuvertV207_())return;
          clearTimeout(idleSurvolTimerOuvrirV1);
          idleSurvolTimerOuvrirV1=setTimeout(function(){
            idleSurvolTimerOuvrirV1=0;
            ouvrirSurvolIdleV1_(element,id);
          },110);
          return;
        }
        /* ni objet ni popup : on ferme (avec un court délai de grâce) le popup ouvert par survol */
        clearTimeout(idleSurvolTimerOuvrirV1);
        idleSurvolTimerOuvrirV1=0;
        if(idleSurvolIdV1&&!idleSurvolTimerFermerV1){
          idleSurvolTimerFermerV1=setTimeout(function(){
            idleSurvolTimerFermerV1=0;
            fermerSurvolIdleV1_();
          },200);
        }
      });

      /* La souris quitte la fenêtre du navigateur */
      document.documentElement.addEventListener('mouseleave',function(){
        if(!idleSurvolIdV1)return;
        clearTimeout(idleSurvolTimerFermerV1);
        idleSurvolTimerFermerV1=setTimeout(function(){
          idleSurvolTimerFermerV1=0;
          fermerSurvolIdleV1_();
        },200);
      });

      /* Presser un objet à la souris = glisser-déposer : le popup ne doit pas gêner, ni revenir avant le relâchement. */
      document.addEventListener('pointerdown',function(event){
        if(!survolPossibleIdleV1_(event))return;
        if(!elementObjetGesteAdventureIdleV196_(event.target))return;
        idleSurvolBloqueV1=true;
        fermerSurvolIdleV1_();
      },true);
      document.addEventListener('pointerup',function(){
        setTimeout(function(){idleSurvolBloqueV1=false;},60);
      },true);

      function idSourceAdventureIdleV138_(event){
        return String(
          idleAdventureDragIdV138||
          (event&&event.dataTransfer?event.dataTransfer.getData('text/plain'):'')||
          idleAdventureSelectionIdV138||
          ''
        );
      }

      function nettoyerEtatDragAdventureIdleV138_(){
        idleAdventureDragIdV138='';
        idleAdventureSelectionIdV138='';
        document.querySelectorAll(
          '.soreal-idle-v138-slot.drag-over,'+
          '.soreal-idle-v138-bag-card.drag-over,'+
          '.soreal-idle-v138-bag-card.selected,'+
          '.soreal-idle-v138-slot.selected'
        ).forEach(function(el){
          el.classList.remove('drag-over','selected');
        });
        afficherDetailsObjetAdventureIdleV138_('');

        if(idleInventoryDeferredPatchV160&&idleEtat){
          idleInventoryDeferredPatchV160=false;
          patchInventaireAdventureIdleV160_(
            idleEtat,
            {action:'deferred',confirmed:true}
          );
        }
      }

      function debutDragAdventureIdleV138_(event,itemId){
        terminerEtatGesteAdventureIdleV196_();
        idleAdventureDragIdV138=String(itemId||'');
        if(event&&event.dataTransfer){
          event.dataTransfer.effectAllowed='move';
          try{event.dataTransfer.setData('text/plain',idleAdventureDragIdV138);}catch(e){}
        }
      }

      function survolCibleAdventureIdleV138_(event){
        if(event){
          event.preventDefault();
          if(event.currentTarget)event.currentTarget.classList.add('drag-over');
        }
      }

      function quitterCibleAdventureIdleV138_(event){
        if(event&&event.currentTarget)event.currentTarget.classList.remove('drag-over');
      }

      function equiperParIdAdventureIdleV138_(itemId){
        if(!idleEtat)return;
        const a=aventureMetaIdleV47_(idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const item=items.find(function(x){return String(x&&x.id)===itemId;});
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-248 */
        if(!item||item.kind==='boost')return;
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-249 */
        equiperObjetAdventureIdleV47_(
          item.id,
          emplacementEquipementAdventureIdleV138_(item)
        );
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-250 */
      function idsFusionAdventureIdleV169_(sourceId,cibleId,cibleEquipe){
        void cibleEquipe;
        const source=String(sourceId||'');
        const cible=String(cibleId||'');
        return {a:cible,b:source};
      }

      function fusionnerSelonInteractionAdventureIdleV169_(sourceId,cibleId,cibleEquipe){
        const ids=idsFusionAdventureIdleV169_(sourceId,cibleId,cibleEquipe);
        if(!ids.a||!ids.b||ids.a===ids.b)return;
        fusionnerObjetAdventureIdleV47_(ids.a,ids.b);
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-251 */
      function fusionnerSiPossibleAdventureIdleV138_(sourceId,cibleId){
        if(!idleEtat||sourceId===cibleId)return;
        const a=aventureMetaIdleV47_(idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const source=items.find(function(x){return String(x&&x.id)===sourceId;});
        const cible=items.find(function(x){return String(x&&x.id)===cibleId;});
        if(!source||!cible)return;
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-252 */
        const memeDefinition=
          source.definitionId===cible.definitionId;
        const boostDejaComplete=
          source.kind==='boost'&&
          Boolean(
            a.itemList&&
            a.itemList[source.definitionId]&&
            idleEntier_(a.itemList[source.definitionId].maxLevel)>=100
          );

        if(memeDefinition&&!boostDejaComplete){
          fusionnerSelonInteractionAdventureIdleV169_(
            source.id,
            cible.id,
            false
          );
        }else if(
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-253 */
          source.kind==='boost'&&
          (cible.kind==='equipment'||cible.kind==='special'||cible.kind==='cube')
        ){
          boosterObjetParIdAdventureIdleV47_(source.id,cible.id);
        }else{
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-254 */
          reordonnerInventaireAdventureIdleV162_(source.id,cible.id,null);
        }
      }

      function boosterObjetParIdAdventureIdleV47_(boostId,cibleId){
        const a=aventureMetaIdleV47_(idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const boost=items.find(function(x){return String(x&&x.id)===String(boostId||'');});
        const cible=items.find(function(x){return String(x&&x.id)===String(cibleId||'');});
        if(!boost||boost.kind!=='boost'||!cible||cible.kind==='boost')return;

        const type=String(boost.boostType||'');
        const q=1+Math.max(0,Math.min(100,idleNombre_(cible.level)))/100;
        let cap=0;
        let actuel=0;
        if(type==='power'){
          cap=idleNombre_(cible.basePower)*q;
          actuel=idleNombre_(cible.power);
        }else if(type==='toughness'){
          cap=idleNombre_(cible.baseToughness)*q;
          actuel=idleNombre_(cible.toughness);
        }else if(type==='special'){
          cap=idleNombre_(cible.baseSpecial)*q;
          actuel=idleNombre_(cible.special);
        }

        /*
         * 2026-09-24 (Norman : « Mon épée qui n'a pas de stats Toughness accepte les boosts. Ils me sont ensuite rendus. Il ne doit
         * les accepter QUE s'il a des stats Toughness non remplies. ») : un plafond de 0 = l'objet n'a pas cette statistique. Avant, la
         * garde ne refusait que « plafond > 0 et atteint » : le boost était consommé côté client puis refusé par le serveur et rendu.
         */
        if(cap<=1e-9){
          const nomStat=type==='power'?'Power':type==='toughness'?'Toughness':'Special';
          toastIdleV5_('Cet objet n’a pas de statistique '+nomStat+' à remplir : le boost n’est pas consommé.');
          return;
        }
        if(
          cible.fullyMaxed||
          actuel>=cap-1e-9
        ){
          toastIdleV5_('Cette statistique est déjà au maximum : le boost n’est pas consommé.');
          return;
        }

        actionAdventureIdleV47_({
          action:'boost',
          boostId:String(boostId||''),
          targetId:String(cibleId||'')
        });
      }

      function deposerSurCubeAdventureIdleV138_(event){
        if(event){event.preventDefault();event.stopPropagation();}
        const id=idSourceAdventureIdleV138_(event);
        nettoyerEtatDragAdventureIdleV138_();
        if(!id||!idleEtat)return;
        const a=aventureMetaIdleV47_(idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const source=items.find(function(x){return String(x&&x.id)===id;});
        if(!source||source.kind!=='boost'){
          toastIdleV5_('Seul un boost peut être absorbé par le Cube.');
          return;
        }
        boosterCubeAdventureIdleV47_(source.id);
      }
      window.__deposerSurCubeAdventureIdleV138__=deposerSurCubeAdventureIdleV138_;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-255 */
      function afficherDetailsCubeInfiniAdventureIdleV220_(){
        const root=document.getElementById('soreal-idle-v138-details');
        const corps=document.getElementById('soreal-idle-v138-details-body');
        const a=idleEtat&&aventureMetaIdleV47_(idleEtat);
        const cube=a&&a.cube;
        const tier=a&&a.cubeTier;
        if(!root||!corps||!cube||!cube.unlocked)return;

        const palier=Math.max(0,idleEntier_(tier&&tier.tier));
        const total=Math.max(0,idleNombre_(tier&&tier.totalStats));
        const suivant=tier&&tier.suivant||null;
        const bonus=[];
        if(idleNombre_(tier&&tier.dropChancePct)>0)bonus.push('Chance de drop +'+idleNombre_(tier.dropChancePct)+'%');
        if(idleNombre_(tier&&tier.goldDropsPct)>0)bonus.push('Gold Drops +'+idleNombre_(tier.goldDropsPct)+'%');
        if(idleNombre_(tier&&tier.hackSpeedPct)>0)bonus.push('Hack Speed +'+idleNombre_(tier.hackSpeedPct)+'%');
        if(idleNombre_(tier&&tier.wishSpeedPct)>0)bonus.push('Wish Speed +'+idleNombre_(tier.wishSpeedPct)+'%');

        corps.innerHTML=
          '<div class="soreal-idle-window-title-v31">Cube de l\'infini</div>'+
          '<div class="soreal-idle-v138-details-level">Tier '+palier+' · ID wiki 100</div>'+
          '<div style="display:flex;justify-content:center;margin:8px 0 12px">'+
            '<img src="'+idleHtml_(urlImageCubeInfiniAdventureIdleV1_(palier))+'" alt="Infinity Cube Tier '+palier+'" style="width:92px;height:92px;object-fit:contain">'+
          '</div>'+
          '<div class="soreal-idle-v138-details-stats">'+
            '<div class="soreal-idle-v138-details-stat"><span>Power</span><b>'+formatGrandNombreIdleV70_(cube.power||0)+'</b></div>'+
            '<div class="soreal-idle-v138-details-stat"><span>Toughness</span><b>'+formatGrandNombreIdleV70_(cube.toughness||0)+'</b></div>'+
            '<div class="soreal-idle-v138-details-stat"><span>Total stats</span><b>'+formatGrandNombreIdleV70_(total)+'</b></div>'+
            (suivant
              ?'<div class="soreal-idle-v138-details-stat"><span>Prochain tier</span><b>'+formatGrandNombreIdleV70_(suivant.seuil||0)+'</b></div>'
              :'<div class="soreal-idle-v138-details-stat"><span>Tier</span><b>MAX</b></div>')+
          '</div>'+
          (bonus.length
            ?'<div style="margin-top:10px;font-size:12px;color:#aeb5c8"><b>Bonus du tier</b><br>'+bonus.map(idleHtml_).join('<br>')+'</div>'
            :'');
        root.style.display='block';
        positionnerPopupObjetAdventureIdleV1_(root);
        activerGlisserPopupObjetAdventureIdleV1_(root);
      }

      function clicCubeAdventureIdleV138_(){
        if(!idleAdventureSelectionIdV138){
          afficherDetailsCubeInfiniAdventureIdleV220_();
          return;
        }
        const id=idleAdventureSelectionIdV138;
        nettoyerEtatDragAdventureIdleV138_();
        if(!idleEtat)return;
        const a=aventureMetaIdleV47_(idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const source=items.find(function(x){return String(x&&x.id)===id;});
        if(!source||source.kind!=='boost'){
          toastIdleV5_('Seul un boost peut être absorbé par le Cube.');
          return;
        }
        boosterCubeAdventureIdleV47_(source.id);
      }
      window.__clicCubeAdventureIdleV138__=clicCubeAdventureIdleV138_;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-256 */
      function supprimerObjetAdventureIdleV165_(id){
        mettreObjetDansTrashAdventureIdleV165_(id);
      }
      function mettreObjetDansTrashAdventureIdleV165_(id){
        actionAdventureIdleV47_({action:'trashPut',id:String(id||'')});
      }
      function recupererObjetTrashAdventureIdleV165_(){
        actionAdventureIdleV47_({action:'trashRecover'});
      }
      function basculerVerrouObjetAdventureIdleV165_(id,locked){
        actionAdventureIdleV47_({
          action:'setLock',
          id:String(id||''),
          locked:Boolean(locked)
        });
        fermerDetailsObjetAdventureIdleV1_();
      }
      function deposerSurTrashAdventureIdleV138_(event){
        if(event){event.preventDefault();event.stopPropagation();}
        const id=idSourceAdventureIdleV138_(event);
        nettoyerEtatDragAdventureIdleV138_();
        if(id)mettreObjetDansTrashAdventureIdleV165_(id);
      }
      function rendreTrashAdventureIdleV165_(item){
        const titre=item
          ?'Trash : '+String(item.name||item.nom||'Objet')+' — clique pour récupérer'
          :'Trash — dépose un objet ici';
        return '<div class="soreal-idle-v138-trash-slot" data-idle-trash-slot-v165 '+
          'title="'+idleHtml_(titre)+'" '+
          'ondragover="window.__survolCibleAdventureIdleV138__(event)" '+
          'ondragleave="window.__quitterCibleAdventureIdleV138__(event)" '+
          'ondrop="window.__deposerSurTrashAdventureIdleV138__(event)" '+
          'onclick="window.__clicTrashAdventureIdleV138__()">'+
          (item?iconeObjetAdventureIdleV138_(item):'<span>🗑️</span>')+
        '</div>';
      }
      window.__deposerSurTrashAdventureIdleV138__=deposerSurTrashAdventureIdleV138_;
      window.__supprimerObjetAdventureIdleV165__=supprimerObjetAdventureIdleV165_;
      window.__basculerVerrouObjetAdventureIdleV165__=basculerVerrouObjetAdventureIdleV165_;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-257 */
      function decisionActionSlotAdventureIdleV138_(sourceId,occupantId){
        if(!occupantId||occupantId===sourceId)return 'equiper';
        if(!idleEtat)return 'equiper';
        const a=aventureMetaIdleV47_(idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const source=items.find(function(x){return String(x&&x.id)===sourceId;});
        const occupant=items.find(function(x){return String(x&&x.id)===occupantId;});
        if(!source||!occupant)return 'equiper';
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-258 */
        if(source.kind!=='boost'&&occupant.kind!=='boost'&&source.definitionId===occupant.definitionId){
          return 'fusionner';
        }
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-259 */
        /*
         * 2026-09-24 : un boost spécial n'est « équipé » (échange de place) que sur une pièce SANS Special ; depuis l'audit du
         * 2026-09-23 la plupart des pièces de set en ont un (baseSpecial > 0) et doivent le recevoir (Norman : « je ne peux
         * toujours pas remplir les objets avec les boosts spéciaux »).
         */
        if(source.kind==='boost'&&source.boostType==='special'&&occupant.kind==='equipment'&&!(idleNombre_(occupant.baseSpecial)>0)){
          return 'equiper';
        }
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-260 */
        if(source.kind==='boost'&&(occupant.kind==='equipment'||occupant.kind==='special'||occupant.kind==='cube')){
          return 'booster';
        }
        return 'equiper';
      }

      function appliquerActionSlotAdventureIdleV138_(sourceId,occupantId){
        const decision=decisionActionSlotAdventureIdleV138_(sourceId,occupantId);
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-261 */
        if(decision==='fusionner'){
          fusionnerSelonInteractionAdventureIdleV169_(
            sourceId,
            occupantId,
            true
          );
        }else if(decision==='booster')boosterObjetParIdAdventureIdleV47_(sourceId,occupantId);
        else equiperParIdAdventureIdleV138_(sourceId);
      }

      function deposerSurSlotAdventureIdleV138_(event,slotName,occupantId){
        if(event){event.preventDefault();event.stopPropagation();}
        const id=idSourceAdventureIdleV138_(event);
        nettoyerEtatDragAdventureIdleV138_();
        if(id)appliquerActionSlotAdventureIdleV138_(id,String(occupantId||''));
      }

      function deposerSurCarteAdventureIdleV138_(event,cibleId){
        if(event){event.preventDefault();event.stopPropagation();}
        const id=idSourceAdventureIdleV138_(event);
        nettoyerEtatDragAdventureIdleV138_();
        if(id)fusionnerSiPossibleAdventureIdleV138_(id,String(cibleId||''));
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-262 */
      function afficherDetailsObjetAdventureIdleV138_(itemId){
        const root=document.getElementById('soreal-idle-v138-details');
        const corps=document.getElementById('soreal-idle-v138-details-body');
        if(!root||!corps)return;

        const id=String(itemId||'');
        const a=idleEtat&&aventureMetaIdleV47_(idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const item=id?items.find(function(x){return String(x&&x.id)===id;}):null;

        if(!item){
          root.style.display='none';
          corps.innerHTML='';
          return;
        }

        const niveau=idleEntier_(item.level);
        let statsHtml='';

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-263 */
        if(item.kind==='equipment'||item.kind==='special'||item.kind==='cube'){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-264 */
          const basePower=idleNombre_(item.basePower);
          const baseToughness=idleNombre_(item.baseToughness);
          const q=1+niveau/100;
          const maxPower=basePower*q;
          const maxToughness=baseToughness*q;
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-265 */
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-266 */
          const powerMaxAtteint=basePower>0&&idleNombre_(item.power)+1e-9>=maxPower;
          const toughnessMaxAtteint=baseToughness>0&&idleNombre_(item.toughness)+1e-9>=maxToughness;

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-267 */
          const itemHp=idleNombre_(item.power)*3;
          const itemRegen=idleNombre_(item.toughness)*.03;
          const baseHp=basePower*3;
          const baseRegen=baseToughness*.03;
          const maxHp=baseHp*q;
          const maxRegen=baseRegen*q;
          const hpMaxAtteint=baseHp>0&&itemHp+1e-9>=maxHp;
          const regenMaxAtteint=baseRegen>0&&itemRegen+1e-9>=maxRegen;

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-268 */
          statsHtml=
            '<div class="soreal-idle-v138-details-stats">'+
              (basePower>0
                ?'<div class="soreal-idle-v138-details-stat"><span>Power</span><b>'+
                  '<span class="soreal-idle-v138-stat-value-v1'+(powerMaxAtteint?' maxed':'')+'">'+formatGrandNombreIdleV70_(idleNombre_(item.power))+'</span>'+
                  ' / '+formatGrandNombreIdleV70_(maxPower)+
                '</b></div>'
                :''
              )+
              (baseToughness>0
                ?'<div class="soreal-idle-v138-details-stat"><span>Toughness</span><b>'+
                  '<span class="soreal-idle-v138-stat-value-v1'+(toughnessMaxAtteint?' maxed':'')+'">'+formatGrandNombreIdleV70_(idleNombre_(item.toughness))+'</span>'+
                  ' / '+formatGrandNombreIdleV70_(maxToughness)+
                '</b></div>'
                :''
              )+
              (baseHp>0
                ?'<div class="soreal-idle-v138-details-stat"><span>Max HP</span><b>'+
                  '<span class="soreal-idle-v138-stat-value-v1'+(hpMaxAtteint?' maxed':'')+'">'+formatGrandNombreIdleV70_(itemHp)+'</span>'+
                  ' / '+formatGrandNombreIdleV70_(maxHp)+
                '</b></div>'
                :''
              )+
              (baseRegen>0
                ?'<div class="soreal-idle-v138-details-stat"><span>HP Regen</span><b>'+
                  '<span class="soreal-idle-v138-stat-value-v1'+(regenMaxAtteint?' maxed':'')+'">'+formatGrandNombreIdleV70_(itemRegen,2)+'</span>'+
                  ' / '+formatGrandNombreIdleV70_(maxRegen,2)+
                '</b></div>'
                :''
              )+
              (function(){
                /* Pièces de set : tous leurs Specials (valeur actuelle / plafond du niveau), audit NGU 2026-09-23. */
                if(Array.isArray(item.specialsAll)&&item.specialsAll.length){
                  return item.specialsAll.map(function(sv){
                    const atteint=idleNombre_(sv.value)+1e-9>=idleNombre_(sv.max);
                    return '<div class="soreal-idle-v138-details-stat"><span>Special: '+idleHtml_(idleLabelSpecialBonusV1_(sv.type))+'</span><b>'+
                      '<span class="soreal-idle-v138-stat-value-v1'+(atteint?' maxed':'')+'">'+formatGrandNombreIdleV70_(idleNombre_(sv.value),2)+'%</span>'+
                      ' / '+formatGrandNombreIdleV70_(idleNombre_(sv.max),2)+'%'+
                    '</b></div>';
                  }).join('');
                }
                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-269 */
                const baseSpecial=idleNombre_(item.baseSpecial);
                if(!(baseSpecial>0))return'';
                const maxSpecial=baseSpecial*q;
                const specialMaxAtteint=idleNombre_(item.special)+1e-9>=maxSpecial;
                const label=idleLabelSpecialBonusV1_(item.specialType);
                return '<div class="soreal-idle-v138-details-stat"><span>Special Bonus: '+idleHtml_(label)+'</span><b>'+
                  '<span class="soreal-idle-v138-stat-value-v1'+(specialMaxAtteint?' maxed':'')+'">'+formatGrandNombreIdleV70_(idleNombre_(item.special))+'</span>'+
                  ' / '+formatGrandNombreIdleV70_(maxSpecial)+
                '</b></div>';
              })()+
            '</div>';
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-270 */
        const equipement=a&&a.equipment||{};
        const estEquipe=
          ['head','chest','legs','boots','weapon'].some(function(slot){return String(equipement[slot]||'')===id;}) ||
          (Array.isArray(equipement.accessories)&&equipement.accessories.includes(id));
        const boutonDesequiper=estEquipe
          ?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__desequiperObjetAdventureIdleV47__(\''+idleHtml_(id)+'\')">🔓 Déséquiper</button>'
          :'';

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-271 */
        const estEquipable=
          !estEquipe&&
          item.kind!=='boost'&&
          !item.consumable;
        const boutonEquiper=estEquipable
          ?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__equiperParIdAdventureIdleV138__(\''+idleHtml_(id)+'\');window.__fermerDetailsObjetAdventureIdleV1__();">⚔️ Équiper</button>'
          :'';
        const boutonConsommer=item.consumable
          ?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__consommerObjetSkillAdventureIdleV4__(\''+idleHtml_(id)+'\');window.__fermerDetailsObjetAdventureIdleV1__();">🥤 Utiliser</button>'
          :'';
        const peutTransformerGerbil=
          item.definitionId==='smallGerbil'&&
          niveau>=100&&
          String(idleEtat&&idleEtat.systemes&&idleEtat.systemes.difficulty||'')==='extreme';
        /*
         * Ascensions (2026-09-24) : tout objet dont le catalogue serveur donne une évolution
         * (itemCatalog[definitionId].evolutionTo : Forest Pendant -> Ascended... -> x9, lignée
         * Looty, Wanderer's Cane, The Lonely Flubber) au niveau 100 (wiki : « level it to level
         * 100 and CTRL + Click to transform it »).
         */
        const catalogueObjetsAdv=a&&a.itemCatalog&&typeof a.itemCatalog==='object'?a.itemCatalog:{};
        const evolutionObjetAdv=catalogueObjetsAdv[item.definitionId]&&catalogueObjetsAdv[item.definitionId].evolutionTo;
        const peutTransformerFlubber=item.definitionId!=='smallGerbil'&&Boolean(evolutionObjetAdv)&&niveau>=100;
        const boutonTransformer=(peutTransformerGerbil||peutTransformerFlubber)
          ?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__transformerObjetAdventureIdleV4__(\''+idleHtml_(id)+'\');window.__fermerDetailsObjetAdventureIdleV1__();">🧪 Transformer</button>'
          :'';
        /* Copies de Wandoos 98/XL : +1 niveau d'OS (ou déblocage de Wandoos XL), action méta consumeWandoosCopy. */
        const boutonInstallerOs=(item.definitionId==='wandoos98'||item.definitionId==='wandoosXl')
          ?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__actionMetaIdleV130__({action:\'consumeWandoosCopy\',itemId:\''+idleHtml_(id)+'\'});window.__fermerDetailsObjetAdventureIdleV1__();">💾 Installer l’OS</button>'
          :'';
        /* A Giant Seed réutilisée (Yggdrasil débloqué) : max(1, ⌊L + L²/100⌋) graines, action méta consumeGiantSeed. */
        const boutonSemerGraine=(item.definitionId==='giantSeed'&&!item.locked)
          ?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__actionMetaIdleV130__({action:\'consumeGiantSeed\',itemId:\''+idleHtml_(id)+'\'});window.__fermerDetailsObjetAdventureIdleV1__();">🌱 Ajouter aux graines</button>'
          :'';
        const estVerrouille=Boolean(item.locked);
        const boutonVerrouiller=
          '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__basculerVerrouObjetAdventureIdleV165__(\''+idleHtml_(id)+'\','+(estVerrouille?'false':'true')+')">'+
          (estVerrouille?'🔓 Déverrouiller':'🔒 Verrouiller')+
          '</button>';
        const boutonComparer=
          '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__comparerObjetAdventureIdleV183__(\''+idleHtml_(id)+'\')">⚖️ Comparer</button>';
        const boutonSupprimer=
          '<button type="button" class="soreal-idle-expand-button-v25" '+
          (estVerrouille
            ?'disabled title="Déverrouille l’objet pour le supprimer"'
            :'onclick="window.__supprimerObjetAdventureIdleV165__(\''+idleHtml_(id)+'\');window.__fermerDetailsObjetAdventureIdleV1__();"')+
          '>🗑️ Supprimer</button>';
        const actionsObjetHtml=
          '<div class="soreal-idle-item-popup-actions-v165">'+
            (boutonEquiper||boutonDesequiper)+
            boutonVerrouiller+
            boutonConsommer+
            boutonTransformer+
            boutonInstallerOs+
            boutonSemerGraine+
            boutonComparer+
            boutonSupprimer+
          '</div>';

        corps.innerHTML=
          '<div class="soreal-idle-window-title-v31">'+idleHtml_(item.name||item.nom||'Objet')+'</div>'+
          '<div class="soreal-idle-v138-details-level">Niveau '+niveau+'/100</div>'+
          statsHtml+
          actionsObjetHtml;
        root.style.display='block';
        positionnerPopupObjetAdventureIdleV1_(root);
        activerGlisserPopupObjetAdventureIdleV1_(root);
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-272 */
      let idleItemPopupPositionV1_=null;
      function positionnerPopupObjetAdventureIdleV1_(root){
        const largeur=root.offsetWidth||320;
        const hauteur=root.offsetHeight||160;
        const margeMax={
          left:Math.max(8,window.innerWidth-largeur-8),
          top:Math.max(8,window.innerHeight-hauteur-8)
        };
        if(!idleItemPopupPositionV1_){
          idleItemPopupPositionV1_={
            left:Math.max(8,Math.round((window.innerWidth-largeur)/2)),
            top:Math.max(8,Math.round((window.innerHeight-hauteur)/3))
          };
        }
        idleItemPopupPositionV1_.left=Math.min(margeMax.left,Math.max(8,idleItemPopupPositionV1_.left));
        idleItemPopupPositionV1_.top=Math.min(margeMax.top,Math.max(8,idleItemPopupPositionV1_.top));
        root.style.left=idleItemPopupPositionV1_.left+'px';
        root.style.top=idleItemPopupPositionV1_.top+'px';
      }
      function activerGlisserPopupObjetAdventureIdleV1_(root){
        const poignee=root&&root.querySelector('.soreal-idle-item-popup-drag-v1');
        if(!poignee||poignee.dataset.idleDragBoundV1==='1')return;
        poignee.dataset.idleDragBoundV1='1';
        let actif=false,departX=0,departY=0,origineLeft=0,origineTop=0;
        const surDeplacement=function(event){
          if(!actif)return;
          const point=event.touches?event.touches[0]:event;
          const largeur=root.offsetWidth,hauteur=root.offsetHeight;
          const nouveauLeft=Math.min(
            Math.max(8,window.innerWidth-largeur-8),
            Math.max(8,origineLeft+(point.clientX-departX))
          );
          const nouveauTop=Math.min(
            Math.max(8,window.innerHeight-hauteur-8),
            Math.max(8,origineTop+(point.clientY-departY))
          );
          idleItemPopupPositionV1_={left:nouveauLeft,top:nouveauTop};
          root.style.left=nouveauLeft+'px';
          root.style.top=nouveauTop+'px';
          if(event.cancelable)event.preventDefault();
        };
        const surRelachement=function(){
          actif=false;
          document.removeEventListener('mousemove',surDeplacement);
          document.removeEventListener('mouseup',surRelachement);
          document.removeEventListener('touchmove',surDeplacement);
          document.removeEventListener('touchend',surRelachement);
        };
        const surDebut=function(event){
          if(event.target&&event.target.closest('.soreal-idle-item-popup-close-v1'))return;
          actif=true;
          const point=event.touches?event.touches[0]:event;
          departX=point.clientX;
          departY=point.clientY;
          origineLeft=root.offsetLeft;
          origineTop=root.offsetTop;
          document.addEventListener('mousemove',surDeplacement);
          document.addEventListener('mouseup',surRelachement);
          document.addEventListener('touchmove',surDeplacement,{passive:false});
          document.addEventListener('touchend',surRelachement);
          if(event.cancelable)event.preventDefault();
        };
        poignee.addEventListener('mousedown',surDebut);
        poignee.addEventListener('touchstart',surDebut,{passive:false});
      }
      let idleAdventureComparerPremierV183='';
      let idleAdventureComparerEnAttenteV183=false;

      function fermerComparaisonObjetAdventureIdleV183_(){
        const second=document.getElementById('soreal-idle-v138-details-compare-v183');
        if(second)second.remove();
        idleAdventureComparerPremierV183='';
        idleAdventureComparerEnAttenteV183=false;
        const primary=document.getElementById('soreal-idle-v138-details');
        if(primary)primary.classList.remove('idle-compare-v183');
      }
      function comparerObjetAdventureIdleV183_(id){
        fermerComparaisonObjetAdventureIdleV183_();
        idleAdventureComparerPremierV183=String(id||'');
        idleAdventureComparerEnAttenteV183=true;
        toastIdleV5_('Choisis maintenant le deuxième objet à comparer.');
      }
      function ouvrirComparaisonObjetAdventureIdleV183_(secondId){
        const firstId=String(idleAdventureComparerPremierV183||'');
        const second=String(secondId||'');
        if(!firstId||!second||firstId===second)return false;

        const root=document.getElementById('soreal-idle-v138-details');
        const corps=document.getElementById('soreal-idle-v138-details-body');
        if(!root||!corps)return false;

        afficherDetailsObjetAdventureIdleV138_(firstId);
        const firstHtml=corps.innerHTML;
        afficherDetailsObjetAdventureIdleV138_(second);
        const secondHtml=corps.innerHTML;

        corps.innerHTML=firstHtml;
        root.style.display='block';
        root.classList.add('idle-compare-v183');

        const clone=root.cloneNode(true);
        clone.id='soreal-idle-v138-details-compare-v183';
        clone.classList.add('idle-compare-v183');
        const cloneBody=clone.querySelector('.soreal-idle-item-popup-body-v1');
        if(cloneBody){
          cloneBody.id='soreal-idle-v138-details-body-compare-v183';
          cloneBody.innerHTML=secondHtml;
        }
        const drag=clone.querySelector('.soreal-idle-item-popup-drag-v1');
        if(drag)drag.id='soreal-idle-v138-details-drag-compare-v183';
        const close=clone.querySelector('.soreal-idle-item-popup-close-v1');
        if(close)close.setAttribute('onclick','window.__fermerComparaisonObjetAdventureIdleV183__()');

        document.body.appendChild(clone);

        const marge=8;
        const largeur=Math.max(140,Math.floor((window.innerWidth-marge*3)/2));
        root.style.width=Math.min(320,largeur)+'px';
        clone.style.width=Math.min(320,largeur)+'px';
        root.style.left=marge+'px';
        clone.style.left=Math.max(marge,window.innerWidth-Math.min(320,largeur)-marge)+'px';
        root.style.top=Math.max(marge,Math.min(root.offsetTop||marge,window.innerHeight-root.offsetHeight-marge))+'px';
        clone.style.top=Math.max(marge,Math.min(root.offsetTop||marge,window.innerHeight-clone.offsetHeight-marge))+'px';

        activerGlisserPopupObjetAdventureIdleV1_(root);
        activerGlisserPopupObjetAdventureIdleV1_(clone);
        idleAdventureComparerEnAttenteV183=false;
        return true;
      }
      window.__comparerObjetAdventureIdleV183__=comparerObjetAdventureIdleV183_;
      window.__fermerComparaisonObjetAdventureIdleV183__=fermerComparaisonObjetAdventureIdleV183_;

      function fermerDetailsObjetAdventureIdleV1_(){
        fermerComparaisonObjetAdventureIdleV183_();
        const primary=document.getElementById('soreal-idle-v138-details');
        if(primary)primary.style.width='';
        idleAdventureSelectionIdV138='';
        document.querySelectorAll('.soreal-idle-v138-slot.selected,.soreal-idle-v138-bag-card.selected').forEach(function(el){el.classList.remove('selected');});
        afficherDetailsObjetAdventureIdleV138_('');
      }
      window.__fermerDetailsObjetAdventureIdleV1__=fermerDetailsObjetAdventureIdleV1_;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-273 */
      function clicCibleAdventureIdleV138_(slotName,occupantId){
        void slotName;
        if(Date.now()<idleAdventureIgnorerClicJusquaV165)return;
        const occupant=String(occupantId||'');
        if(!occupant)return;
        const element=document.querySelector(
          '.soreal-idle-v138-slot[data-occupant-id="'+occupant+'"]'
        );
        if(element)executerTapSlotAdventureIdleV196_(element);
      }

      function clicTrashAdventureIdleV138_(){
        if(idleAdventureSelectionIdV138){
          const id=idleAdventureSelectionIdV138;
          nettoyerEtatDragAdventureIdleV138_();
          mettreObjetDansTrashAdventureIdleV165_(id);
          return;
        }
        const a=idleEtat&&aventureMetaIdleV47_(idleEtat);
        if(a&&a.trash)recupererObjetTrashAdventureIdleV165_();
      }
      window.__clicTrashAdventureIdleV138__=clicTrashAdventureIdleV138_;

      function clicCarteAdventureIdleV138_(event,itemId){
        if(Date.now()<idleAdventureIgnorerClicJusquaV165){
          if(event){event.preventDefault();event.stopPropagation();}
          return;
        }

        const id=String(itemId||'');
        const element=
          event&&event.currentTarget
            ?event.currentTarget
            :document.querySelector(
                '.soreal-idle-v138-bag-card[data-item-id="'+id+'"]'
              );

        if(element)executerTapCarteAdventureIdleV196_(element,id);
      }

      window.__debutDragAdventureIdleV138__=debutDragAdventureIdleV138_;
      window.__finDragAdventureIdleV138__=nettoyerEtatDragAdventureIdleV138_;
      window.__survolCibleAdventureIdleV138__=survolCibleAdventureIdleV138_;
      window.__quitterCibleAdventureIdleV138__=quitterCibleAdventureIdleV138_;
      window.__deposerSurSlotAdventureIdleV138__=deposerSurSlotAdventureIdleV138_;
      window.__deposerSurCarteAdventureIdleV138__=deposerSurCarteAdventureIdleV138_;
      window.__clicCibleAdventureIdleV138__=clicCibleAdventureIdleV138_;
      window.__clicCarteAdventureIdleV138__=clicCarteAdventureIdleV138_;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-274 */
      const IDLE_PAGINATION_TAILLE_V1=60;

      function rendrePaginationIdleV1_(pageActuelle,totalPages,callbackJs){
        if(totalPages<=1)return '';
        const boutons=[];
        for(let p=1;p<=totalPages;p++){
          boutons.push(
            '<button class="soreal-idle-pagination-btn-v1'+(p===pageActuelle?' active':'')+'" '+
            'onclick="'+callbackJs+'('+p+')">'+p+'</button>'
          );
        }
        return '<div class="soreal-idle-pagination-v1">'+boutons.join('')+'</div>';
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-275 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-276 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-277 */
      const IDLE_SPECIAL_BONUS_TYPES_V1_=[
        ["energySpeedPct","Energy Speed"],["energyPowerPct","Energy Power"],
        ["energyCapPct","Energy Cap"],["energyBarsPct","Energy Bars"],
        ["magicSpeedPct","Magic Speed"],["magicPowerPct","Magic Power"],
        ["magicCapPct","Magic Cap"],["magicBarsPct","Magic Bars"],
        ["dropChancePct","Drop Chance"],["goldDropsPct","Gold Drops"],
        ["beardSpeedPct","Beard Speed"],["nguSpeedPct","NGU Speed"],
        ["seedGainPct","Seed Gain"],
        ["r3PowerPct","Resource 3 Power"],["r3CapPct","Resource 3 Cap"],["r3BarsPct","Resource 3 Bars"],
        ["wishSpeedPct","Wish Speed"],["hackSpeedPct","Hack Speed"],["wandoosSpeedPct","Wandoos Speed"],
        ["respawnReductionPct","Respawn"],["yggdrasilYieldPct","Yggdrasil Yield"],["augmentSpeedPct","Augment Speed"],
        ["cookingPct","Cooking"],["questDropsPct","Quest Drops"],["moveCooldownPct","Move Cooldowns"],
        ["advancedTrainingPct","Advanced Training"],["daycareSpeedPct","Daycare Speed"],
        ["expPct","EXP"],["apPct","Arbitrary Points (AP)"]
      ];

      function idleLabelSpecialBonusV1_(type){
        const entree=
          IDLE_SPECIAL_BONUS_TYPES_V1_.find(function(e){return e[0]===type;});

        return entree?entree[1]:String(type||'Special');
      }

      function rendreBonusEquipementAdventureIdleV1_(a){
        const stats=(a&&a.stats)||{};
        const power=idleNombre_(stats.power);
        const toughness=idleNombre_(stats.toughness);
        const hp=idleNombre_(stats.hp);
        const regen=idleNombre_(stats.regen);
        const specials=stats.specials||{};

        const lignes=
          (power>0?'<div class="soreal-idle-v138-details-stat"><span>Power</span><b>+'+formatGrandNombreIdleV70_(power)+'</b></div>':'')+
          (toughness>0?'<div class="soreal-idle-v138-details-stat"><span>Toughness</span><b>+'+formatGrandNombreIdleV70_(toughness)+'</b></div>':'')+
          (hp>0?'<div class="soreal-idle-v138-details-stat"><span>Max Health</span><b>+'+formatGrandNombreIdleV70_(hp)+'</b></div>':'')+
          (regen>0?'<div class="soreal-idle-v138-details-stat"><span>Health Regen/s</span><b>+'+formatGrandNombreIdleV70_(regen,2)+'</b></div>':'');

        const specialLignes=IDLE_SPECIAL_BONUS_TYPES_V1_
          .map(function(e){
            const val=idleNombre_(specials[e[0]]);
            return val>0?'<div class="soreal-idle-v138-details-stat"><span>'+e[1]+'</span><b>+'+formatGrandNombreIdleV70_(val,2)+'%</b></div>':'';
          })
          .join('');
        const specialHtml=specialLignes
          ?'<div class="soreal-idle-window-title-v31" style="margin-top:10px;font-size:.95em">Special Bonuses</div>'+
            '<div class="soreal-idle-v138-details-stats">'+specialLignes+'</div>'
          :'';

        const boostsHtml=(power>0||toughness>0)
          ?'<div class="soreal-idle-window-title-v31" style="margin-top:10px;font-size:.95em">Player Stat Boosts</div>'+
            '<div class="soreal-idle-v138-details-stats">'+
              (power>0?'<div class="soreal-idle-v138-details-stat"><span>Attack</span><b>'+formatGrandNombreIdleV70_(power)+'%</b></div>':'')+
              (toughness>0?'<div class="soreal-idle-v138-details-stat"><span>Defense</span><b>'+formatGrandNombreIdleV70_(toughness)+'%</b></div>':'')+
            '</div>'
          :'';

        return '<div class="soreal-idle-section-v8"><div class="soreal-idle-window-title-v31">📊 Equipment Bonuses</div>'+
          (lignes
            ?'<div class="soreal-idle-v138-details-stats">'+lignes+'</div>'
            :'<div style="opacity:.7;padding:8px 4px">Équipe un objet pour voir ses bonus ici.</div>'
          )+
          specialHtml+
          boostsHtml+
        '</div>';
      }

      function pageInventaireIdleV28_(j){
        const a=aventureMetaIdleV47_(j);
        if(!a||!j.inventaireDebloque){
          return entetePageIdleV28_('🎒 Inventory','L’équipement Adventure est stocké ici.')+
            '<div class="soreal-idle-section-v8" style="text-align:center;padding:28px"><div style="font-size:42px">🔒</div><b>Inventory se débloque avec Adventure au boss 4.</b></div>';
        }

        const items=Array.isArray(a.inventory)?a.inventory:[];
        const equipment=a.equipment||{};
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-278 */
        const cube=a.cube||{};

        const itemById=new Map(items.map(function(i){return [String(i.id),i];}));
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-279 */
        const sacItems=casesSacAdventureIdleV162_(a);
        const capacite=idleEntier_(a.inventoryCapacity||24);
        const utilise=idleEntier_(a.inventoryUsed!=null?a.inventoryUsed:sacItems.filter(Boolean).length);

        /* 2026-09-24 (Norman : « fenêtre inutile… supprime pour gagner de la place ») : ni bandeau « Inventory », ni cadres Sac / Cube / Sets
           (le sac s'affiche dans son titre, le Cube dans son emplacement, les sets dans la Collection). */
        return ''+
          '<div class="soreal-idle-v151-inventory-columns">'+
            '<div class="soreal-idle-section-v8 soreal-idle-v138-equipment-sticky"><div class="soreal-idle-window-title-v31">🧍 Équipement</div>'+
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-280 */
              (function(){
                const accessoiresRendu=rendreAccessoiresAdventureIdleV138_(equipment,itemById,idleEntier_(a.accessorySlotsCapacity||2));
                return '<div class="soreal-idle-v138-paperdoll">'+
                  accessoiresRendu.enGrille+
                  rendreSlotPaperdollAdventureIdleV138_('head','Casque',itemById.get(String(equipment.head)))+
                  rendreSlotPaperdollAdventureIdleV138_('chest','Torse',itemById.get(String(equipment.chest)))+
                  rendreSlotPaperdollAdventureIdleV138_('legs','Pantalon',itemById.get(String(equipment.legs)))+
                  rendreSlotPaperdollAdventureIdleV138_('boots','Bottes',itemById.get(String(equipment.boots)))+
                  rendreSlotPaperdollAdventureIdleV138_('weapon','Arme',itemById.get(String(equipment.weapon)))+
                  rendreSlotCubeInfiniAdventureIdleV1_(cube,a.cubeTier)+
                '</div>'+
                accessoiresRendu.debordement;
              })()+
            '</div>'+
            '<div class="soreal-idle-section-v8" id="soreal-idle-v138-bag-section">'+
              '<div class="soreal-idle-v138-bag-heading-v165">'+
                '<div class="soreal-idle-window-title-v31">🎒 Sac ('+utilise+' / '+capacite+')</div>'+
                rendreTrashAdventureIdleV165_(a.trash)+
              '</div>'+
              rendreGrilleSacAdventureIdleV1_(sacItems,capacite)+
            '</div>'+
          '</div>'+
          '<div class="soreal-idle-item-popup-v1" id="soreal-idle-v138-details" style="display:none">'+
            '<div class="soreal-idle-item-popup-drag-v1" id="soreal-idle-v138-details-drag"><span>⠿</span><button type="button" class="soreal-idle-item-popup-close-v1" onclick="window.__fermerDetailsObjetAdventureIdleV1__()" aria-label="Fermer" title="Fermer">✕</button></div>'+
            '<div class="soreal-idle-item-popup-body-v1" id="soreal-idle-v138-details-body"></div>'+
          '</div>'+
          rendreCoffreAdventureIdleV1_(Array.isArray(a.coffreSlots)?a.coffreSlots:[])+
          rendreBonusEquipementAdventureIdleV1_(a);
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-281 */
      let idlePageCoffreV1=1;
      function changerPageCoffreV1_(page){
        idlePageCoffreV1=Math.max(1,idleEntier_(page)||1);
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(root&&idleEtat)root.innerHTML=contenuMenuIdleV28_(idleEtat);
      }
      window.__changerPageCoffreV1__=changerPageCoffreV1_;

      function rendreCoffreAdventureIdleV1_(slots){
        const occupees=slots.filter(function(s){return s&&s.occupe;}).length;
        const totalPagesCoffre=Math.max(1,Math.ceil(slots.length/IDLE_PAGINATION_TAILLE_V1));
        if(idlePageCoffreV1>totalPagesCoffre)idlePageCoffreV1=totalPagesCoffre;
        const debutPageCoffre=(idlePageCoffreV1-1)*IDLE_PAGINATION_TAILLE_V1;
        const slotsPage=slots.slice(debutPageCoffre,debutPageCoffre+IDLE_PAGINATION_TAILLE_V1);

        const grille='<div class="soreal-idle-collection-grid-v1">'+
          slotsPage.map(function(s){
            if(!s.decouvert){
              return '<div class="soreal-idle-collection-card-v1 locked">'+
                '<div class="soreal-idle-collection-card-icon-v1"><span>❔</span></div>'+
                '<div class="soreal-idle-collection-card-name-v1">???</div>'+
              '</div>';
            }
            if(!s.occupe){
              return '<div class="soreal-idle-collection-card-v1">'+
                '<div class="soreal-idle-collection-card-icon-v1"><span>⬜</span></div>'+
                '<div class="soreal-idle-collection-card-name-v1">'+idleHtml_(s.name)+'</div>'+
                '<div class="soreal-idle-collection-card-level-v1">Pas encore rangé</div>'+
              '</div>';
            }
            const item=s.item||{};
            const pseudoItem={set:s.set,slot:s.slot,name:s.name,level:100};
            const rareteClasse=idleRareteClasseObjetAdventureIdleV1_(item);
            return '<div class="soreal-idle-collection-card-v1 maxed'+(rareteClasse?' '+rareteClasse:'')+'" '+
              'onclick="window.__retirerDuCoffreAdventureIdleV1__(\''+idleHtml_(String(item.id))+'\')" '+
              'title="Cliquer pour reprendre l’objet et pouvoir le rééquiper">'+
              '<div class="soreal-idle-collection-check-v1" title="Niveau maximum">✔</div>'+
              '<div class="soreal-idle-collection-card-icon-v1">'+iconeObjetAdventureIdleV138_(pseudoItem)+'</div>'+
              '<div class="soreal-idle-collection-card-name-v1">'+idleHtml_(s.name)+'</div>'+
              '<div class="soreal-idle-collection-card-level-v1">Niv. 100/100</div>'+
            '</div>';
          }).join('')+
        '</div>'+
        rendrePaginationIdleV1_(idlePageCoffreV1,totalPagesCoffre,'window.__changerPageCoffreV1__');

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-282 */
        const ouvert=idleCoffreOuvertV1_();

        return '<div class="soreal-idle-section-v8">'+
          '<div class="soreal-idle-window-title-v31 soreal-idle-coffre-titre-v1" '+
            'onclick="window.__toggleCoffreOuvertAdventureIdleV1__()" '+
            'role="button" tabindex="0" aria-expanded="'+(ouvert?'true':'false')+'">'+
            '<span>🗄️ Coffre ('+occupees+')</span>'+
            '<span class="soreal-idle-coffre-chevron-v1">'+(ouvert?'▲':'▼')+'</span>'+
          '</div>'+
          '<div class="soreal-idle-v138-cube-slot" data-idle-coffre-drop-v180 '+
            'ondragover="window.__survolCibleAdventureIdleV138__(event)" '+
            'ondragleave="window.__quitterCibleAdventureIdleV138__(event)" '+
            'ondrop="window.__deposerSurCoffreAdventureIdleV1__(event)" '+
            'onclick="window.__clicCoffreAdventureIdleV1__()"'+
            '>'+
            '<div>🗄️</div>'+
            '<div>Glisse un objet réellement maxé ici pour le ranger dans sa case (au toucher : touche l’objet puis le Coffre)</div>'+
          '</div>'+
          (ouvert?'<div style="margin-top:10px">'+grille+'</div>':'')+
        '</div>';
      }

      function idleCoffreOuvertV1_(){
        try{
          const v=localStorage.getItem('soreal_idle_coffre_ouvert_v1');
          return v===null?true:v==='1';
        }catch(e){
          return true;
        }
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-283 */
      function jouerSonOuvertureCoffreIdleV1_(){
        jouerEffetAudioIdleV199_('chestOpen');
      }
      function jouerSonFermetureCoffreIdleV197_(){
        jouerEffetAudioIdleV199_('chestClose');
      }
      window.__jouerSonOuvertureCoffreIdleV1__=jouerSonOuvertureCoffreIdleV1_;
      window.__jouerSonFermetureCoffreIdleV197__=jouerSonFermetureCoffreIdleV197_;

      function toggleCoffreOuvertAdventureIdleV1_(){
        const actuel=idleCoffreOuvertV1_();
        if(!actuel){
          jouerSonOuvertureCoffreIdleV1_();
        }else{
          jouerSonFermetureCoffreIdleV197_();
        }
        try{
          localStorage.setItem('soreal_idle_coffre_ouvert_v1',actuel?'0':'1');
        }catch(e){}
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(root&&idleEtat)root.innerHTML=contenuMenuIdleV28_(idleEtat);
      }
      window.__toggleCoffreOuvertAdventureIdleV1__=toggleCoffreOuvertAdventureIdleV1_;

      function deposerSurCoffreAdventureIdleV1_(event){
        if(event){event.preventDefault();event.stopPropagation();}
        const id=idSourceAdventureIdleV138_(event);
        nettoyerEtatDragAdventureIdleV138_();
        if(id)actionAdventureIdleV47_({action:'coffreDeposer',id:String(id)});
      }
      window.__deposerSurCoffreAdventureIdleV1__=deposerSurCoffreAdventureIdleV1_;

      function clicCoffreAdventureIdleV1_(){
        if(!idleAdventureSelectionIdV138){
          toggleCoffreOuvertAdventureIdleV1_();
          return;
        }
        const id=idleAdventureSelectionIdV138;
        nettoyerEtatDragAdventureIdleV138_();
        actionAdventureIdleV47_({action:'coffreDeposer',id:String(id)});
      }
      window.__clicCoffreAdventureIdleV1__=clicCoffreAdventureIdleV1_;

      function retirerDuCoffreAdventureIdleV1_(id){
        if(!id)return;
        actionAdventureIdleV47_({action:'coffreRetirer',id:String(id)});
      }
      window.__retirerDuCoffreAdventureIdleV1__=retirerDuCoffreAdventureIdleV1_;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-284 */
      function urlImageCubeInfiniAdventureIdleV1_(tier){
        const n=Math.max(0,idleEntier_(tier));
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-285 */
        return '/api/idle/media/item?wikiItemId=100&tier='+n+'&name='+encodeURIComponent('THE CUBE');
      }
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-286 */
      function rendreSlotCubeInfiniAdventureIdleV1_(cube,cubeTier){
        if(!cube||!cube.unlocked)return '';

        const tier=idleEntier_(cubeTier&&cubeTier.tier);
        const titre=idleHtml_(
          'Cube de l’infini · Palier '+tier+
          ' · Power '+formatGrandNombreIdleV70_(cube.power||0)+
          ' · Toughness '+formatGrandNombreIdleV70_(cube.toughness||0)
        );

        return '<div class="soreal-idle-v138-slot soreal-idle-v138-slot-cube" data-idle-cube-drop-v180 '+
          'ondragover="window.__survolCibleAdventureIdleV138__(event)" '+
          'ondragleave="window.__quitterCibleAdventureIdleV138__(event)" '+
          'ondrop="window.__deposerSurCubeAdventureIdleV138__(event)" '+
          'onclick="window.__clicCubeAdventureIdleV138__()"'+
          '>'+
          '<div class="soreal-idle-v138-slot-icon" title="'+titre+'">'+
            '<img src="'+idleHtml_(urlImageCubeInfiniAdventureIdleV1_(tier))+'" alt="" loading="lazy" '+
            'onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'block\'">'+
            '<span style="display:none">🧊</span>'+
          '</div>'+
        '</div>';
      }



      /*
       * 2026-09-23 : le drapeau "occupé" vit UNIQUEMENT dans le module
       * meta-progression-v130.js (celui qui envoie réellement les requêtes).
       * Depuis le split UI V9, ce monolithe en gardait une copie jamais
       * assignée, donc toujours false : la résolution d'un combat de zone
       * n'était jamais acquittée (idleAdventureResolutionPendingV2 restait
       * armé) et le combat suivant ne démarrait plus, jusqu'au rechargement.
       */
      function metaOccupeIdleV130_(){
        const api=window.__SOREAL_IDLE_META_V130__;
        return Boolean(api&&typeof api.estOccupeIdleV130_==="function"&&api.estOccupeIdleV130_());
      }

      /*
       * Historique V9 (UI split) : le dispatcheur "Système Méta" (Yggdrasil,
       * Gold Diggers, Perks, Quirks, ITOPOD, Challenges, Augmentations,
       * Time Machine, Blood Magic, Money Pit/Daily Spin, Boutique EXP) a été
       * extrait vers cloudflare/public/modules/meta-progression-v130.js sans
       * changement fonctionnel. Ce module tourne dans une portée JS séparée
       * (balise <script> distincte) et ne peut donc pas lire/écrire
       * directement les variables et fonctions internes du monolithe : ce
       * pont les expose explicitement. Lu à l'exécution des fonctions du
       * module, jamais à son chargement : l'ordre des <script> n'a pas
       * d'importance.
       */
      window.__SOREAL_IDLE_META_HOST_V130__={
        getIdleEtat:function(){return idleEtat;},
        setIdleEtat:function(v){idleEtat=v;},
        setIdleAdventureRespawnStartPending:function(v){idleAdventureRespawnStartPendingV165=v;},
        idleHtml_:idleHtml_,
        idleNombre_:idleNombre_,
        idleEntier_:idleEntier_,
        formatGrandNombreIdleV70_:formatGrandNombreIdleV70_,
        formatterHeuresIdleV47_:formatterHeuresIdleV47_,
        entetePageIdleV28_:entetePageIdleV28_,
        toastIdleV5_:toastIdleV5_,
        messageFlottantIdleV32_:messageFlottantIdleV32_,
        rendreIdleEtat_:rendreIdleEtat_,
        pousserEtatVersRuntimePartageIdleV1_:pousserEtatVersRuntimePartageIdleV1_,
        appliquerSynchroCombatSansReflowIdleV116_:appliquerSynchroCombatSansReflowIdleV116_,
        ajouterLogAventureIdleV1_:ajouterLogAventureIdleV1_,
        aventureMetaIdleV47_:aventureMetaIdleV47_,
        protegerJoueurServeurInventaireIdleV208_:protegerJoueurServeurInventaireIdleV208_,
        estMutationInventaireAdventureIdleV160_:estMutationInventaireAdventureIdleV160_,
        patchInventaireAdventureIdleV160_:patchInventaireAdventureIdleV160_,
        appelerProgressionIdleCloudflareV1_:appelerProgressionIdleCloudflareV1_,
        patchZoneAdventureSansReflowIdleV1_:patchZoneAdventureSansReflowIdleV1_,
        idleRareteClasseObjetAdventureIdleV1_:idleRareteClasseObjetAdventureIdleV1_
      };

      function pageSystemeMetaIdleV130_(j,id,titre){
        const api=window.__SOREAL_IDLE_META_V130__;
        if(api&&typeof api.pageSystemeMetaIdleV130_==='function'){
          return api.pageSystemeMetaIdleV130_(j,id,titre);
        }
        return '';
      }

      function actionMetaIdleV130_(payload){
        const api=window.__SOREAL_IDLE_META_V130__;
        if(api&&typeof api.actionMetaIdleV130_==='function'){
          return api.actionMetaIdleV130_(payload);
        }
      }

      function systemeMetaParIdIdleV130_(j,id){
        const api=window.__SOREAL_IDLE_META_V130__;
        if(api&&typeof api.systemeMetaParIdIdleV130_==='function'){
          return api.systemeMetaParIdIdleV130_(j,id);
        }
        return null;
      }

      function pageSpendExpIdleV1_(j){
        const api=window.__SOREAL_IDLE_META_V130__;
        if(api&&typeof api.pageSpendExpIdleV1_==='function'){
          return api.pageSpendExpIdleV1_(j);
        }
        return '';
      }

      function pageBoutiqueIdleV28_(j){
        return `
          ${entetePageIdleV28_(
            '🪙 Améliorations permanentes',
            'Dépense tes pièces dans des bonus permanents.'
          )}

          <div class="soreal-idle-window-title-v31 gold">
            🪙 Or possédé
            <span class="soreal-idle-gold-total-v31">
              ${idleEntier_(j.pieces)}
            </span>
          </div>

          <div class="soreal-idle-shop-grid-v12">
            ${rendreBoutiqueIdleV12_(j)}
          </div>
        `;
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-306 */
      const IDLE_SELLOUT_SHOP_CATEGORIES_V1={
        boosts1:'⚡ Boosts',
        boosts2:'🍀 Boosts (lots)',
        special1:'🛠️ Spécial 1',
        special2:'🛠️ Spécial 2',
        special3:'🛠️ Spécial 3',
        special4:'🛠️ Spécial 4',
        items:'💝 Objets',
        expPp:'⭐ EXP / PP'
      };

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-307 */
      const IDLE_SELLOUT_TRADUCTIONS_V210={
        energyPotionAlpha:{name:'Potion d’énergie α',effect:'Double la puissance d’Énergie pendant 60 minutes, même à travers plusieurs Rebirths. Se cumule avec la Potion d’énergie β.'},
        energyPotionBeta:{name:'Potion d’énergie β',effect:'Double la puissance d’Énergie jusqu’au prochain Rebirth. Se cumule avec la Potion d’énergie α.'},
        energyPotionDelta:{name:'Potion d’énergie δ',effect:'Double la puissance d’Énergie pendant 24 heures, même à travers plusieurs Rebirths. Ajoute du temps au compteur de la Potion d’énergie α.'},
        magicPotionAlpha:{name:'Potion de magie α',effect:'Double la puissance de Magie pendant 60 minutes, même à travers plusieurs Rebirths. Se cumule avec la Potion de magie β.'},
        magicPotionBeta:{name:'Potion de magie β',effect:'Double la puissance de Magie jusqu’au prochain Rebirth. Se cumule avec la Potion de magie α.'},
        magicPotionDelta:{name:'Potion de magie δ',effect:'Double la puissance de Magie pendant 24 heures, même à travers plusieurs Rebirths. Ajoute du temps au compteur de la Potion de magie α.'},
        resource3PotionAlpha:{name:'Potion de Ressource 3 α',effect:'Triple la puissance de Ressource 3 pendant 60 minutes, même à travers plusieurs Rebirths. Se cumule avec la Potion de Ressource 3 β.'},
        resource3PotionBeta:{name:'Potion de Ressource 3 β',effect:'Double la puissance de Ressource 3 jusqu’au prochain Rebirth. Se cumule avec la Potion de Ressource 3 α.'},
        resource3PotionDelta:{name:'Potion de Ressource 3 δ',effect:'Triple la puissance de Ressource 3 pendant 24 heures, même à travers plusieurs Rebirths. Ajoute du temps au compteur de la Potion de Ressource 3 α.'},
        energyBarBar:{name:'Barre de barres d’énergie',effect:'Double tes barres d’Énergie pendant 60 minutes, même à travers plusieurs Rebirths.'},
        magicBarBar:{name:'Barre de barres de magie',effect:'Double tes barres de Magie pendant 60 minutes, même à travers plusieurs Rebirths.'},
        macguffinMuffin:{name:'Muffin MacGuffin',effect:'Double pendant 24 heures le bonus obtenu des MacGuffins lors d’un Rebirth. Le bonus s’applique à au moins un Rebirth, même si les 24 heures sont dépassées.'},

        icarusFertilizer1:{name:'Engrais maison d’Icarus Proudbottom (x1)',effect:'Accorde +50 % lors de la récolte ou de la consommation d’un fruit d’Yggdrasil. Chaque tas vaut pour un fruit.'},
        icarusFertilizer10:{name:'Engrais maison d’Icarus Proudbottom (x10)',effect:'Même effet que l’engrais à l’unité, par lot de 10.'},
        icarusFertilizer100:{name:'Engrais maison d’Icarus Proudbottom (x100)',effect:'Même effet que l’engrais à l’unité, par lot de 100.'},
        littleBluePill1000:{name:'Petite pilule bleue (x1 000)',effect:'Double le gain de PP dans l’ITOPOD. Chaque pilule dure pendant un kill.'},
        littleBluePill10000:{name:'Petite pilule bleue (x10 000)',effect:'Même effet que la petite pilule bleue, par lot de 10 000.'},
        littleBluePill100000:{name:'Petite pilule bleue (x100 000)',effect:'Même effet que la petite pilule bleue, par lot de 100 000.'},
        beastButter1:{name:'Beurre de la Bête (x1)',effect:'Double la récompense de QP de ta prochaine quête.'},
        beastButter10:{name:'Beurre de la Bête (x10)',effect:'Double la récompense de QP des prochaines quêtes concernées, par lot de 10.'},
        beastButter100:{name:'Beurre de la Bête (x100)',effect:'Double la récompense de QP des prochaines quêtes concernées, par lot de 100.'},
        luckyCharm:{name:'Porte-bonheur',effect:'Double les chances de drop en Adventure pendant 30 minutes, même à travers plusieurs Rebirths. Se cumule avec les autres effets de loot.'},
        superLuckyCharm:{name:'Super porte-bonheur',effect:'Double les chances de drop en Adventure pendant 12 heures, même à travers plusieurs Rebirths. Se cumule avec les autres effets de loot.'},
        mayoInfuser:{name:'Infuseur de mayo',effect:'Double la vitesse de génération de Mayo pendant 24 heures. Affecte aussi les récompenses de fruits.'},
        regularBlackPens:{name:'Stylos noirs ordinaires (x25)',effect:'Ajoute 2 tiers à la prochaine carte générée. Cet effet ne peut pas être désactivé.'},

        improvedLootFilter:{name:'Filtre de butin amélioré',effect:'Permet d’utiliser la liste d’objets comme filtre de butin personnalisé et de filtrer chaque objet individuellement.'},
        extraInventorySpace:{name:'Espace d’inventaire supplémentaire',effect:'Ajoute un emplacement d’inventaire. Peut être acheté plusieurs fois, jusqu’à 166 emplacements supplémentaires.'},
        autoMergeBoostTimers:{name:'Réduction Auto Merge / Auto Boost',effect:'Réduit de 50 % le temps de l’Auto Boost et de l’Auto Merge.'},
        instaTrainingCap:{name:'Plafond d’entraînement instantané',effect:'Assigne presque immédiatement 6 Énergies, une à chacun des entraînements, après chaque Rebirth.'},
        customEnergyMagicButtons:{name:'Boutons % personnalisés Énergie/Magie',effect:'Débloque un jeu de boutons % personnalisés pour les entrées Énergie et Magie, calculés sur le plafond total.'},
        moreCustomEnergyMagicButtons:{name:'Plus de boutons % Énergie/Magie',effect:'Débloque un second jeu de boutons % personnalisés pour les entrées Énergie et Magie.'},
        yggdrasilHarvestLight:{name:'Alerte de récolte Yggdrasil',effect:'Fait s’illuminer le menu Yggdrasil lorsqu’un fruit est totalement mûr et prêt à être mangé ou récolté.'},
        dailySpinTimeBank:{name:'Banque de 7 jours pour la roue journalière',effect:'Étend la durée maximale mise en réserve par la roue journalière de 36 heures à 7 jours.'},
        loadoutSlot:{name:'Emplacement de configuration',effect:'Ajoute un emplacement de configuration. Maximum : 7 achats.'},
        extraBeardSlot:{name:'Emplacement de barbe supplémentaire',effect:'Ajoute une barbe pour Beards of Power. Maximum : 4 achats ; le premier emplacement coûte moins cher.'},
        filterBoostsIntoCube:{name:'Envoyer les boosts filtrés dans le Cube de l’infini',effect:'Les boosts filtrés sont fusionnés dans le Cube de l’infini. Les boosts appliqués ainsi ne sont pas recyclés.'},
        lazyItopodFloorShifter:{name:'Réglage automatique de l’étage ITOPOD',effect:'Vérifie ton étage optimal après chaque kill et ajuste automatiquement l’étage de l’ITOPOD.'},

        extraAccessorySlot1:{name:'Emplacement d’accessoire supplémentaire',effect:'Ajoute 1 emplacement d’accessoire.'},
        daycareSpeedBoost:{name:'Accélération de la garderie',effect:'Les objets placés en garderie gagnent leurs niveaux 10 % plus vite.'},
        extraAccessorySlot2:{name:'Encore un emplacement d’accessoire',effect:'Ajoute encore 1 emplacement d’accessoire. Oui, encore.'},
        diggerSlots:{name:'Emplacements Gold Digger',effect:'Ajoute 1 emplacement de Digger. Maximum : 6 achats ; le premier coûte moins cher.'},
        macguffinSlot:{name:'Emplacement MacGuffin',effect:'Ajoute 1 emplacement MacGuffin. Maximum : 11 achats ; les deux premiers coûtent moins cher.'},
        questReminder:{name:'Rappel de quête',effect:'Fait s’illuminer le menu Questing lorsqu’une quête est prête à être rendue.'},
        fasterQuesting:{name:'Quêtes plus rapides',effect:'Permet de gagner les Major Quests 20 % plus vite.'},
        extendedQuestBank:{name:'Banque de quêtes étendue',effect:'Augmente le plafond de Major Quests de 10 à 50.'},
        extraAccessorySlot3:{name:'Un autre emplacement d’accessoire (bis)',effect:'Ajoute encore 1 emplacement d’accessoire.'},
        customIdleEnergyMagicButtons:{name:'Boutons % Idle Énergie/Magie',effect:'Débloque des boutons % personnalisés pour les entrées Idle Énergie et Magie, calculés sur les ressources Idle totales.'},
        autoNuker:{name:'Nuke automatique',effect:'Lance automatiquement un Nuke sur les boss 10 secondes après chaque Rebirth, puis toutes les minutes.'},
        extraAccessorySlot4:{name:'Encore encore un emplacement d’accessoire',effect:'Ajoute 1 emplacement d’accessoire. Fais-nous confiance : ils serviront tous.'},

        nguCapModifier:{name:'Modificateur de plafond NGU',effect:'Débloque un réglage permettant de choisir le pourcentage du plafond injecté avec le bouton de plafond NGU.'},
        daycareKittyArt:{name:'Apparences du chat de la garderie',effect:'Débloque plusieurs apparences du chat de la garderie. Clique sur le chat pour parcourir les apparences débloquées.'},
        customResource3Button:{name:'Bouton % personnalisé Ressource 3',effect:'Débloque un bouton personnalisé de pourcentage du plafond pour Ressource 3.'},
        anotherCustomResource3Button:{name:'Autre bouton % Ressource 3',effect:'Débloque un second bouton personnalisé de pourcentage du plafond pour Ressource 3.'},
        customIdleResource3Button:{name:'Bouton % Idle Ressource 3',effect:'Débloque un bouton % Idle personnalisé pour Ressource 3.'},
        resource3NameRandomizer:{name:'Nom aléatoire de Ressource 3',effect:'Débloque un réglage qui change aléatoirement le nom de Ressource 3 à chaque Rebirth, parmi plus de 200 noms.'},
        fasterWishes:{name:'Wishes plus rapides',effect:'Accélère les Wishes de 25 %.'},
        inventoryMergeSlots:{name:'Emplacements de fusion d’inventaire',effect:'Débloque un emplacement supplémentaire de fusion d’inventaire. Maximum : 4 achats.'},
        adventureLight:{name:'Alerte Adventure',effect:'Fait s’illuminer le bouton Adventure lorsque tu es dans une Safe Zone.'},
        adventureAdvancer:{name:'Avancement Adventure',effect:'Au bout de 20 secondes d’un Rebirth, te déplace vers la zone normale la plus avancée que tu peux atteindre.'},
        goToQuestZoneButton:{name:'Bouton « Aller à la zone de quête »',effect:'Débloque un bouton qui t’envoie directement dans la zone Adventure de ta quête.'},

        extraDeckSize:{name:'Taille de deck supplémentaire',effect:'Augmente la taille du deck pour pouvoir conserver davantage de cartes. Maximum : 50 achats.'},
        mayoGenerator:{name:'Générateur de mayo',effect:'Permet de faire fonctionner un générateur de Mayo supplémentaire et augmente la vitesse de génération de Mayo de 2 % par emplacement. Maximum : 2 achats.'},
        extraTagSlot:{name:'Emplacement de tag supplémentaire',effect:'Débloque un emplacement de tag supplémentaire pour les cartes afin de favoriser celles que tu veux obtenir.'},
        extraAccessorySlotEvil:{name:'Emplacement d’accessoire Evil',effect:'Un emplacement d’accessoire ordinaire, mais dont l’achat est arbitrairement verrouillé tant que tu n’es pas en difficulté Evil.'},
        extraAccessorySlot5:{name:'Dernier emplacement d’accessoire',effect:'Voilà, c’est le dernier emplacement d’accessoire achetable avec de l’AP. Après celui-ci, terminé.'},

        heartRed:{name:'Mon cœur rouge <3',effect:'Au niveau 100, son bonus complet de +10 % EXP s’applique sans devoir l’équiper.'},
        heartYellow:{name:'Mon cœur jaune <3',effect:'Au niveau 100, son bonus complet de +20 % AP s’applique sans devoir l’équiper.'},
        heartBrown:{name:'Mon cœur brun <3',effect:'Au niveau 100, chaque 10e caca appliqué à un fruit ne consomme pas de caca.'},
        heartGreen:{name:'Mon cœur vert <3',effect:'Au niveau 100, tu gagnes les Perk Points 20 % plus vite dans l’ITOPOD.'},
        heartBlue:{name:'Mon cœur bleu <3',effect:'Au niveau 100, les effets de tous les consommables sont améliorés de 10 %.'},
        heartPurple:{name:'Mon cœur violet <3',effect:'Au niveau 100, les MacGuffins tombent 20 % plus souvent.'},
        heartOrange:{name:'Mon cœur orange <3',effect:'Au niveau 100, les quêtes rapportent 20 % de QP supplémentaires.'},
        heartGrey:{name:'Mon cœur gris <3',effect:'Au niveau 100, les Hacks sont 25 % plus rapides.'},
        heartPink:{name:'Mon cœur rose <3',effect:'Au niveau 100, tu gagnes un emplacement de Wish.'},
        heartRainbow:{name:'Mon cœur arc-en-ciel',effect:'Au niveau 100, la vitesse de génération des Cartes et de Mayo augmente de 10 %.'},

        exp200:{name:'200 EXP',effect:'Ajoute 200 EXP à dépenser dans la Boutique EXP.'},
        exp500:{name:'500 EXP',effect:'Ajoute 500 EXP à dépenser dans la Boutique EXP.'},
        exp2000:{name:'2 000 EXP',effect:'Ajoute 2 000 EXP à dépenser dans la Boutique EXP.'},
        pp25:{name:'25 PP',effect:'Ajoute 25 PP à dépenser dans le menu Perks de l’ITOPOD.'},
        pp100:{name:'100 PP',effect:'Ajoute 100 PP à dépenser dans le menu Perks de l’ITOPOD.'},
        pp500:{name:'500 PP',effect:'Ajoute 500 PP à dépenser dans le menu Perks de l’ITOPOD.'}
      };

      function traductionSelloutIdleV210_(item){
        const t=IDLE_SELLOUT_TRADUCTIONS_V210[String(item&&item.id||'')]||null;
        return {
          name:t&&t.name?t.name:String(item&&item.name||'Objet'),
          effect:t&&t.effect?t.effect:String(item&&item.effect||'')
        };
      }

      /*
       * Boutique AP — même style « boutique » que la Boutique EXP (auvent, caisse, rayons en onglets, étagères), couleur du menu (mauve).
       * Norman (2026-09-24) : « Utilise le même style pour le AP shop que pour le XP Shop mais d'une couleur différente ».
       */
      let idleApOngletV1='';
      try{idleApOngletV1=localStorage.getItem('soreal_idle_ap_onglet_v1')||'';}catch(e){}
      window.__ongletApShopIdleV1__=function(id){
        if(!Object.prototype.hasOwnProperty.call(IDLE_SELLOUT_SHOP_CATEGORIES_V1,id))return;
        idleApOngletV1=id;
        try{localStorage.setItem('soreal_idle_ap_onglet_v1',id);}catch(e){}
        if(idleEtat)rendreIdleEtat_({ok:true,joueur:idleEtat});
      };

      function pageSelloutShopIdleV1_(j){
        const systemes=(j&&j.systemes)||{};
        const shop=systemes.selloutShop||{catalog:[],purchases:{}};
        const catalogue=Array.isArray(shop.catalog)?shop.catalog:[];
        const ap=idleEntier_(systemes.currencies&&systemes.currencies.ap||0);

        const parCategorie={};
        catalogue.forEach(function(item){
          const cle=item.category||'autre';
          if(!parCategorie[cle])parCategorie[cle]=[];
          parCategorie[cle].push(item);
        });

        const visibles=Object.keys(IDLE_SELLOUT_SHOP_CATEGORIES_V1).filter(function(cle){
          return (parCategorie[cle]||[]).length>0;
        });
        const onglet=visibles.indexOf(idleApOngletV1)!==-1?idleApOngletV1:(visibles[0]||'');

        const carte=function(item){
          const auMax=item.nextCost==null;
          const effetActif=item.effectActive===true;
          const abordable=effetActif&&!auMax&&ap>=item.nextCost;
          const texte=traductionSelloutIdleV210_(item);
          const compteur=item.max!=null?' ('+idleEntier_(item.purchased)+'/'+idleEntier_(item.max)+')':(item.purchased>0?' (x'+idleEntier_(item.purchased)+')':'');
          return '<div class="soreal-idle-exp-stat-v210">'+
            '<div class="soreal-idle-exp-stat-head-v210"><span>'+idleHtml_(texte.name)+compteur+'</span></div>'+
            '<div class="soreal-idle-exp-help-v210">'+idleHtml_(texte.effect)+'</div>'+
            (!effetActif
              ?'<div class="soreal-idle-exp-lock-v210" title="Cet effet sera activé dans un prochain palier">🔒 Effet pas encore actif · '+formatGrandNombreIdleV70_(item.nextCost||0)+' AP</div>'
              :auMax
                ?'<div class="soreal-idle-exp-max-v210">✔ Maximum atteint</div>'
                :'<div class="soreal-idle-exp-actions-v210">'+
                  '<button type="button" class="soreal-idle-exp-buy-v210" '+(abordable?'':'disabled ')+
                  'onclick="window.__actionMetaIdleV130__({action:\'sellShopBuy\',itemId:\''+idleHtml_(item.id)+'\'})">'+
                  '<b>Acheter</b><small>'+formatGrandNombreIdleV70_(item.nextCost)+' AP</small></button>'+
                '</div>')+
          '</div>';
        };

        const onglets=visibles.map(function(cle){
          const actif=cle===onglet;
          return '<button type="button" class="soreal-idle-exp-tab-v212'+(actif?' actif':'')+'" aria-pressed="'+actif+'" onclick="window.__ongletApShopIdleV1__(\''+cle+'\')">'+idleHtml_(IDLE_SELLOUT_SHOP_CATEGORIES_V1[cle])+'</button>';
        }).join('');

        const api=window.__SOREAL_IDLE_META_V130__;
        const css=api&&typeof api.boutiqueCssIdleV1_==='function'?api.boutiqueCssIdleV1_():'';

        return entetePageIdleV28_(
          "🛍️ La Boutique de Norman & Sébastien",
          "Dépense tes AP ici. Aucun achat ne coûte d’argent réel."
        )+
        '<style>'+css+'</style>'+
        '<div class="soreal-idle-exp-shop-v213">'+
          '<div class="soreal-idle-exp-awning-v213" aria-hidden="true"></div>'+
          '<div class="soreal-idle-exp-balance-v210"><span>💠 Ta caisse · AP disponible</span><b>'+formatGrandNombreIdleV70_(ap)+'</b></div>'+
          '<div class="soreal-idle-exp-aisles-v213"><span>🧭 Rayons</span><span class="soreal-idle-exp-open-v213">● OUVERT</span></div>'+
          '<div class="soreal-idle-exp-tabs-v212" role="tablist">'+onglets+'</div>'+
          '<div class="soreal-idle-exp-shelves-v213">'+(onglet?(parCategorie[onglet]||[]).map(carte).join(''):'')+'</div>'+
        '</div>';
      }


      function pageRenaissanceIdleV28_(j){
        return `
          ${entetePageIdleV28_(
            '♻️ Renaissance',
            'Recommence une run pour obtenir des bonus permanents.'
          )}

          ${rendreRenaissanceIdleV14_(j)}
        `;
      }


      let idleResetTotalEnCoursV67=false;


      function fermerPopupResetTotalIdleV67_(){
        const modal=
          document.getElementById(
            'sorealIdleResetTotalModalV67'
          );

        if(modal){
          modal.remove();
        }
      }


      function viderActionsLocalesAvantResetIdleV67_(){
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-308 */
        try{
          idleFastPendingV60.equip.length=0;
          idleFastPendingV60.fusion.length=0;

          idleFastPendingV60.shop={
            production:0,
            capacite:0,
            puissance:0
          };

          idleFastPendingV60.forge={
            tete:0,
            torse:0,
            bottes:0,
            arme:0,
            bijou1:0,
            bijou2:0
          };

          idleFastPendingV60.bag=0;
          idleFastPendingV60.combat=null;
          idleFastPendingV60.autoBoss=null;

          if(
            Object.prototype.hasOwnProperty.call(
              idleFastPendingV60,
              'autoAdventure'
            )
          ){
            idleFastPendingV60.autoAdventure=null;
          }

          idleFastPendingV60.boss=null;
          idleFastPendingV60.zone=null;
        }catch(e){}

        try{
          idleAchatsEnAttenteV7.force=0;
          idleAchatsEnAttenteV7.endurance=0;
          idleAchatsEnAttenteV7.organisation=0;
        }catch(e){}

        try{
          idleRecycleQueueV38.length=0;
        }catch(e){}

        try{
          annulerTimerCombatAutoIdleV30_();
        }catch(e){}

        idleAutoAventureV30=false;
      }


      function resetTotalPeutPartirIdleV67_(){
        return !(
          idleFastNetworkBusyV60 ||
          idleAchatEnCoursV5 ||
          idleRecycleBatchV32 ||
          idleAventureEnCoursV17 ||
          idleSyncEnCoursV60
        );
      }


      function envoyerResetTotalIdleV67_(){
        if(
          !idleResetTotalEnCoursV67 ||
          !SOREAL_SESSION
        ){
          return;
        }

        if(
          !resetTotalPeutPartirIdleV67_()
        ){
          const texte=
            document.getElementById(
              'sorealIdleResetTotalStatusV67'
            );

          if(texte){
            texte.textContent=
              'Fin des dernières actions en cours…';
          }

          setTimeout(
            envoyerResetTotalIdleV67_,
            120
          );

          return;
        }

        viderActionsLocalesAvantResetIdleV67_();

        const texte=
          document.getElementById(
            'sorealIdleResetTotalStatusV67'
          );

        if(texte){
          texte.textContent=
            'Suppression complète du personnage…';
        }

        google.script.run
          .withSuccessHandler(function(res){
            if(
              !res ||
              !res.ok
            ){
              idleResetTotalEnCoursV67=false;

              const bouton=
                document.getElementById(
                  'sorealIdleResetTotalConfirmV67'
                );

              if(bouton){
                bouton.disabled=false;
                bouton.textContent=
                  '🗑️ Tout effacer';
              }

              const statut=
                document.getElementById(
                  'sorealIdleResetTotalStatusV67'
                );

              if(statut){
                statut.textContent=
                  res&&res.message
                    ?res.message
                    :'Impossible de réinitialiser le compte.';
              }

              return;
            }

            const statut=
              document.getElementById(
                'sorealIdleResetTotalStatusV67'
              );

            if(statut){
              statut.textContent=
                'Compte supprimé. Redémarrage comme un nouveau joueur…';
            }

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-309 */
            idleEtat=null;
            idleCombatLogV70=[];
            idleCombatLogBossV70='';

            const statutCreation=
              document.getElementById(
                'sorealIdleResetTotalStatusV67'
              );

            if(statutCreation){
              statutCreation.textContent=
                'Création du nouveau personnage…';
            }

            google.script.run
              .withSuccessHandler(function(etat){
                idleResetTotalEnCoursV67=false;

                fermerPopupResetTotalIdleV67_();

                if(
                  etat &&
                  etat.ok &&
                  etat.joueur
                ){
                  idleEtat=
                    etat.joueur;

                  /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-310 */
                  idleMenuActifV28='combat';
                  sauverMenuIdleV28_();

                  rendreIdleEtat_({
                    ok:true,
                    joueur:etat.joueur
                  });

                  messageFlottantIdleV32_(
                    '✨ Nouveau compte créé.'
                  );
                }else{
                  chargerSorealIdleNatifV4_();
                }
              })
              .withFailureHandler(function(){
                idleResetTotalEnCoursV67=false;
                fermerPopupResetTotalIdleV67_();
                chargerSorealIdleNatifV4_();
              })
              .obtenirEtatSorealIdle(
                SOREAL_SESSION
              );
          })
          .withFailureHandler(function(e){
            idleResetTotalEnCoursV67=false;

            const bouton=
              document.getElementById(
                'sorealIdleResetTotalConfirmV67'
              );

            if(bouton){
              bouton.disabled=false;
              bouton.textContent=
                '🗑️ Tout effacer';
            }

            const statut=
              document.getElementById(
                'sorealIdleResetTotalStatusV67'
              );

            if(statut){
              statut.textContent=
                e&&e.message
                  ?e.message
                  :'Erreur serveur pendant le reset.';
            }
          })
          .reinitialiserCompteCompletSorealIdle(
            SOREAL_SESSION
          );
      }


      function executerResetTotalIdleV67_(){
        if(
          idleResetTotalEnCoursV67
        ){
          return;
        }

        idleResetTotalEnCoursV67=true;

        viderActionsLocalesAvantResetIdleV67_();

        const bouton=
          document.getElementById(
            'sorealIdleResetTotalConfirmV67'
          );

        if(bouton){
          bouton.disabled=true;
          bouton.textContent=
            '⏳ Suppression…';
        }

        envoyerResetTotalIdleV67_();
      }


      function ouvrirPopupResetTotalIdleV67_(){
        if(
          idleResetTotalEnCoursV67
        ){
          return;
        }

        fermerPopupResetTotalIdleV67_();

        const modal=
          document.createElement(
            'div'
          );

        modal.id=
          'sorealIdleResetTotalModalV67';

        modal.className=
          'soreal-idle-modal-backdrop-v63';

        modal.innerHTML=
          '<div class="soreal-idle-modal-card-v63" role="dialog" aria-modal="true" aria-label="Réinitialiser entièrement SOREAL IDLE">'+
            '<div class="soreal-idle-modal-top-v63">'+
              '<div class="soreal-idle-modal-icon-v63">💣</div>'+
              '<div class="soreal-idle-modal-title-v63">Tout recommencer ?</div>'+
              '<div class="soreal-idle-modal-gain-v63">Comme si tu n’avais jamais lancé SOREAL IDLE</div>'+
            '</div>'+
            '<div class="soreal-idle-modal-body-v63">'+
              '<div class="soreal-idle-modal-info-v63">'+
                'Cette action efface <strong>réellement tout le personnage</strong>.'+
                '<ul class="soreal-idle-total-reset-list-v67">'+
                  '<li>❌ Niveau & XP</li>'+
                  '<li>❌ Énergie & entraînements</li>'+
                  '<li>❌ Boss & progression</li>'+
                  '<li>❌ Inventaire & équipement</li>'+
                  '<li>❌ Aventure & collections</li>'+
                  '<li>❌ Renaissances</li>'+
                  '<li>❌ Statistiques</li>'+
                  '<li>❌ Date de début</li>'+
                '</ul>'+
                '<div class="soreal-idle-total-reset-warning-v67">⚠️ Irréversible. Après le reset, le jeu recréera ton compte exactement comme lors d’une première connexion.</div>'+
                '<div id="sorealIdleResetTotalStatusV67" style="margin-top:9px;color:#d7b4ba;font-size:10px;font-weight:900;text-align:center"></div>'+
              '</div>'+
            '</div>'+
            '<div class="soreal-idle-modal-actions-v63">'+
              '<button type="button" class="soreal-idle-modal-button-v63 cancel" onclick="window.__fermerPopupResetTotalIdleV67__()">Annuler</button>'+
              '<button id="sorealIdleResetTotalConfirmV67" type="button" class="soreal-idle-modal-button-v63 confirm soreal-idle-total-reset-final-v67" onclick="window.__executerResetTotalIdleV67__()">🗑️ Tout effacer</button>'+
            '</div>'+
          '</div>';

        modal.addEventListener(
          'click',
          function(event){
            if(event.target===modal){
              fermerPopupResetTotalIdleV67_();
            }
          }
        );

        document.body.appendChild(
          modal
        );
      }


      window.__ouvrirPopupResetTotalIdleV67__=
        ouvrirPopupResetTotalIdleV67_;

      window.__fermerPopupResetTotalIdleV67__=
        fermerPopupResetTotalIdleV67_;

      window.__executerResetTotalIdleV67__=
        executerResetTotalIdleV67_;


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-311 */
      let idleResetTousJoueursAdminEnCoursV1=false;

      function fermerPopupResetTousJoueursAdminIdleV1_(){
        const modal=
          document.getElementById(
            'sorealIdleResetTousJoueursAdminModalV1'
          );

        if(modal){
          modal.remove();
        }
      }

      function ouvrirPopupResetTousJoueursAdminIdleV1_(){
        if(
          idleResetTousJoueursAdminEnCoursV1 ||
          !estAdminSorealIdle_()
        ){
          return;
        }

        fermerPopupResetTousJoueursAdminIdleV1_();

        const modal=
          document.createElement('div');

        modal.id=
          'sorealIdleResetTousJoueursAdminModalV1';

        modal.className=
          'soreal-idle-modal-backdrop-v63';

        modal.innerHTML=
          '<div class="soreal-idle-modal-card-v63" role="dialog" aria-modal="true" aria-label="Réinitialiser tous les joueurs">'+
            '<div class="soreal-idle-modal-top-v63">'+
              '<div class="soreal-idle-modal-icon-v63">💣</div>'+
              '<div class="soreal-idle-modal-title-v63">Reset TOUS les joueurs ?</div>'+
              '<div class="soreal-idle-modal-gain-v63">Pas seulement ton propre compte</div>'+
            '</div>'+
            '<div class="soreal-idle-modal-body-v63">'+
              '<div class="soreal-idle-modal-info-v63">'+
                'Cette action efface <strong>la progression de TOUS les joueurs actuels</strong> de SOREAL IDLE, y compris la tienne.'+
                '<div class="soreal-idle-total-reset-warning-v67">⚠️ Irréversible. Chacun repartira comme lors d’une première connexion.</div>'+
                '<div id="sorealIdleResetTousJoueursAdminStatusV1" style="margin-top:9px;color:#d7b4ba;font-size:10px;font-weight:900;text-align:center"></div>'+
              '</div>'+
            '</div>'+
            '<div class="soreal-idle-modal-actions-v63">'+
              '<button type="button" class="soreal-idle-modal-button-v63 cancel" onclick="window.__fermerPopupResetTousJoueursAdminIdleV1__()">Annuler</button>'+
              '<button id="sorealIdleResetTousJoueursAdminConfirmV1" type="button" class="soreal-idle-modal-button-v63 confirm soreal-idle-total-reset-final-v67" onclick="window.__executerResetTousJoueursAdminIdleV1__()">🗑️ Tout réinitialiser</button>'+
            '</div>'+
          '</div>';

        modal.addEventListener(
          'click',
          function(event){
            if(event.target===modal){
              fermerPopupResetTousJoueursAdminIdleV1_();
            }
          }
        );

        document.body.appendChild(modal);
      }

      function executerResetTousJoueursAdminIdleV1_(){
        if(
          idleResetTousJoueursAdminEnCoursV1 ||
          !SOREAL_SESSION ||
          !estAdminSorealIdle_()
        ){
          return;
        }

        idleResetTousJoueursAdminEnCoursV1=true;

        const bouton=
          document.getElementById(
            'sorealIdleResetTousJoueursAdminConfirmV1'
          );

        if(bouton){
          bouton.disabled=true;
          bouton.textContent='⏳ Suppression…';
        }

        google.script.run
          .withSuccessHandler(function(res){
            idleResetTousJoueursAdminEnCoursV1=false;

            if(!res||!res.ok){
              if(bouton){
                bouton.disabled=false;
                bouton.textContent='🗑️ Tout réinitialiser';
              }

              const statut=
                document.getElementById(
                  'sorealIdleResetTousJoueursAdminStatusV1'
                );

              if(statut){
                statut.textContent=
                  res&&res.message
                    ?res.message
                    :'Impossible de réinitialiser les comptes.';
              }

              return;
            }

            const statut=
              document.getElementById(
                'sorealIdleResetTousJoueursAdminStatusV1'
              );

            if(statut){
              statut.textContent=
                (res.message||'Tous les comptes ont été réinitialisés.')+
                ' Rechargement…';
            }

            idleEtat=null;
            idleCombatLogV70=[];
            idleCombatLogBossV70='';

            setTimeout(function(){
              fermerPopupResetTousJoueursAdminIdleV1_();
              chargerSorealIdleNatifV4_();
            },900);
          })
          .withFailureHandler(function(e){
            idleResetTousJoueursAdminEnCoursV1=false;

            if(bouton){
              bouton.disabled=false;
              bouton.textContent='🗑️ Tout réinitialiser';
            }

            const statut=
              document.getElementById(
                'sorealIdleResetTousJoueursAdminStatusV1'
              );

            if(statut){
              statut.textContent=
                e&&e.message
                  ?e.message
                  :'Erreur serveur pendant le reset.';
            }
          })
          .reinitialiserTousLesComptesSorealIdle(
            SOREAL_SESSION
          );
      }

      window.__ouvrirPopupResetTousJoueursAdminIdleV1__=
        ouvrirPopupResetTousJoueursAdminIdleV1_;

      window.__fermerPopupResetTousJoueursAdminIdleV1__=
        fermerPopupResetTousJoueursAdminIdleV1_;

      window.__executerResetTousJoueursAdminIdleV1__=
        executerResetTousJoueursAdminIdleV1_;


      function pagePersonnageIdleV28_(j){
        return `
          ${entetePageIdleV28_(
            '👤 Personnage',
            'Statistiques générales et historique du personnage.'
          )}

          <div class="soreal-idle-character-v25">
            ${rendreProfilIdleV26_(j)}
            ${rendreSetsIdleV25_(j)}

            <div class="soreal-idle-danger-zone-v67">
              <div class="soreal-idle-danger-title-v67">
                ⚠️ Zone dangereuse
              </div>

              <div class="soreal-idle-danger-text-v67">
                Efface entièrement ce personnage et recommence SOREAL IDLE
                exactement comme lors de ta toute première connexion.
              </div>

              <button
                type="button"
                class="soreal-idle-danger-button-v67"
                onclick="window.__ouvrirPopupResetTotalIdleV67__()"
              >
                💣 Réinitialiser entièrement SOREAL IDLE
              </button>
            </div>
          </div>
        `;
      }


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-312 */
      function textesNormanSebastienIdleV204_(j){
        const bossVaincus=idleEntier_(j&&j.bossVaincus);
        const groupes=[
          {
            nom:'Début du jeu',
            visible:true,
            pages:TUTORIEL_DEBUT_JEU_PAGES_V1
          },
          {
            nom:'Premier boss',
            visible:bossVaincus>=1,
            pages:TUTORIEL_PREMIER_BOSS_PAGES_V1
          },
          {
            nom:'Aventure & Rebirth',
            visible:menuDisponibleIdleV28_('aventure',j),
            pages:TUTORIEL_AVENTURE_PAGES_V1
          }
        ];
        const sorties=[];

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-313 */
        groupes.forEach(function(groupe){
          if(!groupe.visible)return;
          const pages=Array.isArray(groupe.pages)?groupe.pages:[];
          pages.forEach(function(page,index){
            if(!page)return;
            sorties.push({
              groupe:groupe.nom,
              titre:String(page.titre||'Introduction'),
              sousTitre:String(page.sousTitre||''),
              index:index+1,
              total:pages.length,
              paragraphes:Array.isArray(page.paragraphes)?page.paragraphes:[]
            });
          });
        });

        return sorties;
      }

      /*
       * 2026-09-24 (Norman) : « Info doit être un menu qui s'ouvre et se ferme, comme le coffre. De base, il doit être fermé. »
       * Même mécanique que le Coffre : titre cliquable + chevron, état gardé dans localStorage, fermé tant que rien n'est stocké.
       */
      function idleInfoOuvertV1_(){
        try{
          return localStorage.getItem('soreal_idle_info_ouvert_v1')==='1';
        }catch(e){
          return false;
        }
      }

      function toggleInfoOuvertIdleV1_(){
        try{
          localStorage.setItem('soreal_idle_info_ouvert_v1',idleInfoOuvertV1_()?'0':'1');
        }catch(e){}
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(root&&idleEtat)root.innerHTML=contenuMenuIdleV28_(idleEtat);
      }
      window.__toggleInfoOuvertIdleV1__=toggleInfoOuvertIdleV1_;

      function pageParametresIdleV28_(j){
        const infosParMenu=idleInfosParMenuIdleV1_(j);
        const infoOuvert=idleInfoOuvertV1_();
        const vus=idleMenusAckListeV1_(j);
        const entrees=vus
          .map(function(menuId){return infosParMenu[menuId];})
          .filter(Boolean);
        const introsNormanSebastien=textesNormanSebastienIdleV204_(j);

        return entetePageIdleV28_(
          '⚙️ Settings',
          ''
        )+
          rendrePartiesDevIdleV1_()+
          '<div class="soreal-idle-section-v8">'+
            '<div class="soreal-idle-window-title-v31 soreal-idle-info-titre-v1" '+
              'onclick="window.__toggleInfoOuvertIdleV1__()" '+
              'role="button" tabindex="0" aria-expanded="'+(infoOuvert?'true':'false')+'">'+
              '<span>ℹ️ Info</span>'+
              '<span class="soreal-idle-coffre-chevron-v1">'+(infoOuvert?'▲':'▼')+'</span>'+
            '</div>'+
            (infoOuvert?
            '<div style="font-size:12px;color:#8b93ab;margin-bottom:10px">Revoir les explications des menus déjà débloqués. Chaque texte peut être relu à voix haute avec la synthèse vocale de ton appareil.</div>'+
            (entrees.length
              ?entrees.map(function(info,index){
                const targetId='sorealIdleInfoRecapV203_'+index;
                return '<div id="'+targetId+'" class="soreal-idle-info-recap-card-v1" data-soreal-tts-say="'+idleHtml_(texteVoixNouveauteIdleV1_(info))+'">'+
                  '<div class="soreal-idle-info-recap-head-v1">'+idleHtml_(info.icon||'✨')+' <b>'+idleHtml_(info.titre||'')+'</b></div>'+
                  (info.intro?'<div class="soreal-idle-info-recap-intro-v1">'+idleHtml_(info.intro)+'</div>':'')+
                  (info.texte?'<div>'+idleHtml_(info.texte)+'</div>':'')+
                  (Array.isArray(info.bullets)
                    ?'<div class="soreal-idle-news-bullets-v75">'+
                      info.bullets.map(function(texte){
                        return '<div class="soreal-idle-news-bullet-v75">'+idleHtml_(texte)+'</div>';
                      }).join('')+
                      '</div>'
                    :'')+
                  '<button type="button" class="soreal-idle-tts-read-v203" data-soreal-tts-target="'+targetId+'">🔊 Lire ce texte</button>'+
                '</div>';
              }).join('')
              :'<div style="font-size:12px;color:#5b6178">Aucun panneau d’information consulté pour l’instant.</div>'
            )+
            '<div class="soreal-idle-window-title-v31" style="margin-top:16px">🎙️ Norman & Sébastien</div>'+
            '<div style="font-size:12px;color:#8b93ab;margin-bottom:10px">Retrouve ici toutes les pages des introductions et tutoriels de Norman & Sébastien déjà rencontrées dans ta partie. Tu peux tout relire ou lancer le Text-to-Speech page par page.</div>'+
            (introsNormanSebastien.length
              ?introsNormanSebastien.map(function(info,index){
                const targetId='sorealIdleNarrateursV203_'+index;
                return '<div id="'+targetId+'" class="soreal-idle-info-recap-card-v1" data-soreal-tts-say="'+idleHtml_(texteVoixTutorielIdleV1_(info))+'">'+
                  '<div class="soreal-idle-info-recap-head-v1">🎙️ <b>'+idleHtml_(info.groupe)+' · '+idleHtml_(info.titre)+'</b></div>'+
                  '<div style="font-size:10px;color:#7f8aa4;margin:4px 0 7px">Page '+idleEntier_(info.index)+' / '+idleEntier_(info.total)+(info.sousTitre?' · '+idleHtml_(info.sousTitre):'')+'</div>'+ 
                  '<div class="soreal-idle-info-recap-intro-v1">'+
                    info.paragraphes.map(function(texte){
                      return '<div style="margin-bottom:7px">'+idleHtml_(texte)+'</div>';
                    }).join('')+
                  '</div>'+
                  '<button type="button" class="soreal-idle-tts-read-v203" data-soreal-tts-target="'+targetId+'">🔊 Lire ce texte</button>'+
                '</div>';
              }).join('')
              :'<div style="font-size:12px;color:#5b6178">Aucune intervention disponible pour l’instant.</div>'
            ):'')+
          '</div>'+
          '<div class="soreal-idle-section-v8">'+
            '<div class="soreal-idle-window-title-v31">Version</div>'+
            '<div style="font-size:12px;color:#8b93ab">Build <b style="color:#dce5f3">V212</b></div>'+
          '</div>'+
          '<div class="soreal-idle-section-v8">'+
            '<div class="soreal-idle-window-title-v31">Réinitialisation complète</div>'+
            '<div style="font-size:12px;color:#8b93ab;margin-bottom:10px">Efface entièrement la progression SOREAL IDLE et recrée le personnage comme lors de la première ouverture. Cette action est irréversible.</div>'+
            '<button type="button" class="soreal-idle-danger-button-v67" onclick="window.__ouvrirPopupResetTotalIdleV67__()">💣 Réinitialiser entièrement SOREAL IDLE</button>'+
          '</div>'+
          (estAdminSorealIdle_()
            ?'<div class="soreal-idle-section-v8">'+
              '<div class="soreal-idle-window-title-v31">🔧 Admin</div>'+
              '<div style="font-size:12px;color:#8b93ab;margin-bottom:10px">Efface la progression de TOUS les joueurs actuels de SOREAL IDLE (pas seulement la tienne). Chacun repartira comme lors d’une première connexion. Action irréversible.</div>'+
              '<button type="button" class="soreal-idle-danger-button-v67" onclick="window.__ouvrirPopupResetTousJoueursAdminIdleV1__()">💣 Réinitialiser TOUS les joueurs</button>'+
            '</div>'
            :''
          );
      }

      function contenuMenuIdleV28_(j){
        switch(idleMenuActifV28){
          case 'entrainement':
            return pageEntrainementIdleV28_(j);
          case 'parametres':
            return pageParametresIdleV28_(j);
          case 'aventure':
            return pageAventureIdleV28_(j);
          case 'bestiaire':
            return pageBestiaireIdleV110_(j);
          case 'boutique':
            return pageBoutiqueIdleV28_(j);
          case 'sellout':
            return pageSelloutShopIdleV1_(j);
          case 'magie':
            return pageMagieIdleV90_(j);
          case 'renaissance':
            return pageRenaissanceIdleV28_(j);
          case 'augmentations':
            return pageSystemeMetaIdleV130_(j,'augmentations','Augmentations');
          case 'avance':
            return pageSystemeMetaIdleV130_(j,'advancedTraining','Entraînement avancé');
          case 'machine':
            return pageSystemeMetaIdleV130_(j,'timeMachine','Machine temporelle');
          case 'sang':
            return pageSystemeMetaIdleV130_(j,'bloodMagic','Magie du sang');
          case 'ngu':
            return pageSystemeMetaIdleV130_(j,'ngu','NGU');
          case 'wandoos':
            return pageSystemeMetaIdleV130_(j,'wandoos','Wandoos');
          case 'yggdrasil':
            return pageSystemeMetaIdleV130_(j,'yggdrasil','Yggdrasil');
          case 'moneyPit':
            return pageSystemeMetaIdleV130_(j,'moneyPit','Money Pit');
          case 'diggers':
            return pageSystemeMetaIdleV130_(j,'diggers','Gold Diggers');
          case 'beards':
            return pageSystemeMetaIdleV130_(j,'beards','Beards');
          case 'tower':
            return pageSystemeMetaIdleV130_(j,'tower','ITOPOD');
          case 'perks':
            return pageSystemeMetaIdleV130_(j,'perks','Perks');
          case 'challenges':
            return pageSystemeMetaIdleV130_(j,'challenges','Challenges');
          case 'titans':
            return pageSystemeMetaIdleV130_(j,'titans','Titans');
          case 'macguffins':
            return pageSystemeMetaIdleV130_(j,'macguffins','MacGuffins');
          case 'setsZones':
            return pageCollectionIdleV22_(j);
          case 'spendExp':
            return pageSpendExpIdleV1_(j);
          case 'daycare':
            return pageSystemeMetaIdleV130_(j,'daycare','Item Daycare');
          case 'questing':
            return pageSystemeMetaIdleV130_(j,'questing','Questing');
          case 'quirks':
            return pageSystemeMetaIdleV130_(j,'quirks','Quirks');
          case 'hacks':
            return pageSystemeMetaIdleV130_(j,'hacks','Hacks');
          case 'wishes':
            return pageSystemeMetaIdleV130_(j,'wishes','Wishes');
          case 'cards':
            return pageSystemeMetaIdleV130_(j,'cards','Cards');
          case 'cooking':
            return pageSystemeMetaIdleV130_(j,'cooking','Cooking');
          case 'succes':
            return pageSystemeMetaIdleV130_(j,'achievements','Achievements');
          case 'personnage':
            return pagePersonnageIdleV28_(j);
          case 'combat':
          default:
            return pageCombatIdleV28_(j);
        }
      }


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-314 */
      function jouerSonMenuIdleV1_(){
        if(typeof window.__jouerSonClicSorealV1__==='function'){
          window.__jouerSonClicSorealV1__();
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-315 */
        jouerEffetAudioIdleV199_('uiClick');
      }
      window.__jouerSonMenuIdleV1__=jouerSonMenuIdleV1_;


      function menuIdleV28_(menu){
        if(
          !menuDisponibleIdleV28_(
            menu,
            idleEtat
          )
        ){
          return;
        }

        jouerSonMenuIdleV1_();

        const nouveauMenu=
          String(
            menu||'combat'
          );

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-316 */
        if(idleEtat&&!idleMenuEstAcquisV1_(idleEtat,nouveauMenu)){
          idleMenuMarquerAcquisV1_(idleEtat,nouveauMenu);

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-317 */
          if(nouveauMenu==='aventure'){
            demarrerTutorielPagesIdleV1_(
              TUTORIEL_AVENTURE_PAGES_V1,
              'soreal_idle_tutoriel_aventure_v1_'+generationJoueurIdleV75_(idleEtat)
            );
          }else{
            const info=idleInfosParMenuIdleV1_(idleEtat)[nouveauMenu];
            if(info){
              idlePopupQueueV75.push(info);
              afficherProchainePopupIdleV75_();
            }
          }
        }

        if(
          idleMenuActifV28==='aventure' &&
          nouveauMenu!=='aventure' &&
          idleAutoAventureV30
        ){
          idleAutoAventureV30=false;

          if(idleEtat){
            idleEtat.autoAventure={
              actif:false,
              zoneId:
                idleAutoZoneV30
            };
          }

          annulerTimerCombatAutoIdleV30_();
          sauverCombatAutoIdleV30_();

          if(SOREAL_SESSION){
            ajouterActionRapideIdleV60_(
              'autoAdventure',
              {
                actif:false,
                zoneId:
                  idleAutoZoneV30
              }
            );
          }
        }

        if(nouveauMenu==='aventure')idleAdventureKoAlertV1=false;

        idleMenuActifV28=
          nouveauMenu;

        sauverMenuIdleV28_();

        rendreIdleEtat_({
          ok:true,
          joueur:idleEtat
        });
      }


      window.__menuIdleV28__=
        menuIdleV28_;


      let idleDerniereImageBossV61='';
      let idleDerniereImageJoueurV61='';
      let idlePreloadsCombatV61={};

      function urlDriveRapideIdleV46_(fileId){
        const id=String(fileId||'').trim();
        return id
          ?'https://lh3.googleusercontent.com/d/'+encodeURIComponent(id)+'=w1000'
          :'';
      }


      function classeFonduImageIdleV61_(
        type,
        cle
      ){
        const key=
          String(cle||'');

        if(type==='boss'){
          if(
            key &&
            idleDerniereImageBossV61!==key
          ){
            idleDerniereImageBossV61=key;
            jouerEffetAudioIdleV199_('bossAppear');
            return ' soreal-idle-image-fade-v61';
          }

          return '';
        }

        if(type==='joueur'){
          if(
            key &&
            idleDerniereImageJoueurV61!==key
          ){
            idleDerniereImageJoueurV61=key;
            return ' soreal-idle-image-fade-v61';
          }
        }

        return '';
      }


      function markupImageCombatIdleV61_(
        type,
        fileId,
        fallbackUrl,
        alt,
        classeBase,
        cle
      ){
        const url=
          urlDriveRapideIdleV46_(
            fileId
          ) ||
          String(
            fallbackUrl||''
          );

        if(!url){
          return '';
        }

        const fade=
          classeFonduImageIdleV61_(
            type,
            cle||fileId||url
          );

        return (
          '<img class="'+
          idleHtml_(
            String(classeBase||'')+
            fade
          )+
          '" src="'+
          idleHtml_(url)+
          '" alt="'+
          idleHtml_(alt||'')+
          '" loading="eager" decoding="async" fetchpriority="high" '+
          (
            fade
              ?"onload=\"this.classList.add('visible')\""
              :''
          )+
          '>'
        );
      }


      function prechargerUrlCombatIdleV61_(
        url
      ){
        const src=
          String(url||'');

        if(
          !src ||
          idlePreloadsCombatV61[src]
        ){
          return;
        }

        idlePreloadsCombatV61[src]=true;

        const img=
          new Image();

        img.decoding='async';
        img.src=src;
      }


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-318 */
      function prechargerCatalogueCombatIdleV61_(
        j
      ){
        if(!j)return;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-319 */
        prechargerUrlCombatIdleV61_(
          urlBossR2IdleV1_(
            idImageBossCanoniqueIdleV181_(j)
          )
        );

        prechargerUrlCombatIdleV61_(
          urlJoueurR2IdleV1_(
            (aventureMetaIdleV47_(j)||{}).selectedZone
          )
        );

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-320 */
        const catalogue=
          Array.isArray(
            j.bossCatalogue
          )
            ?j.bossCatalogue
            :[];

        catalogue.forEach(
          function(boss,index){
            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-321 */
            const numero=
              Math.max(
                1,
                idleEntier_(boss&&boss.numero)||index+1
              );

            const url=
              urlBossR2IdleV1_(
                numero
              );

            if(!url)return;

            idleBossImageCacheV36[
              String(numero)
            ]=url;

            setTimeout(
              function(){
                prechargerUrlCombatIdleV61_(
                  url
                );
              },
              Math.min(
                1200,
                index*35
              )
            );
          }
        );
      }


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-322 */
      function impactsEchelonnesIdleV136_(id,type,nombre){
        const total=
          Math.max(
            1,
            idleEntier_(nombre)||1
          );

        for(let i=0;i<total;i+=1){
          if(i===0){
            impactIdleV46_(id,type);
          }else{
            setTimeout(
              function(){
                impactIdleV46_(id,type);
              },
              i*110
            );
          }
        }
      }


      function impactIdleV46_(id,type){
        const el=
          document.getElementById(id);

        if(!el)return;

        if(
          !idleEtat ||
          !idleEtat.combatBossActif ||
          idleVictoireBossLocaleV49 ||
          idleNombre_(idleEtat.bossPv)<=0
        ){
          return;
        }

        const classe=
          type==='joueur'
            ?'impact-joueur-v46'
            :'impact-boss-v46';

        el.classList.remove(classe);
        void el.offsetWidth;
        el.classList.add(classe);

        setTimeout(function(){
          if(el){
            el.classList.remove(classe);
          }
        },260);
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


      let idleImageJoueurCacheV43={};

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-323 */
      function urlJoueurR2IdleV1_(zone,portrait){
        /* Player Portraits (2026-09-24) : portrait choisi (fichier du wiki), repli serveur sur le défaut. */
        return '/api/idle/media/player?zone='+encodeURIComponent(String(zone||''))+
          (portrait?'&portrait='+encodeURIComponent(String(portrait)):'');
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-324 */
      function urlMobR2IdleV1_(zone,boss,index,nom){
        const z=String(zone||'').trim();
        if(!z)return '';
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-325 */
        return '/api/idle/media/mob?zone='+encodeURIComponent(z)+
          '&boss='+(boss?'1':'0')+
          '&seed='+encodeURIComponent(String(index||'0'))+
          (nom?'&name='+encodeURIComponent(String(nom)):'');
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-326 */
      function chargerImageJoueurIdleV43_(numero,driveFileId,zone,portrait){
        const n=idleEntier_(numero)||1;
        const host=document.getElementById('sorealIdlePlayerImageHostV43');
        if(!host||!SOREAL_SESSION)return;

        const cacheKey=String(zone||'')+':'+n+':'+String(portrait||'');
        if(idleImageJoueurCacheV43[cacheKey]){
          host.innerHTML=
            markupImageCombatIdleV61_(
              'joueur',
              '',
              idleImageJoueurCacheV43[cacheKey],
              'Joueur',
              '',
              String(n)
            );
          return;
        }

        const urlR2=urlJoueurR2IdleV1_(zone,portrait);
        idleImageJoueurCacheV43[cacheKey]=urlR2;
        host.innerHTML=
          markupImageCombatIdleV61_(
            'joueur',
            '',
            urlR2,
            'Joueur',
            '',
            String(n)
          );
      }


      let idleBossImageCacheV36={};

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-327 */
      function urlBossR2IdleV1_(bossId){
        const n=
          Math.max(
            0,
            Math.floor(
              Number(bossId)||0
            )
          );

        return n
          ? '/api/idle/media/boss?id='+encodeURIComponent(String(n))
          : '';
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-328 */
      function idImageBossCanoniqueIdleV181_(j){
        const selection=
          Math.max(
            0,
            idleEntier_(j&&j.bossSelection)
          );

        if(selection>0)return selection;

        return Math.max(
          0,
          idleEntier_(j&&j.bossId)
        );
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-329 */
      function chargerImageBossIdleV36_(
        nomBoss,
        driveFileId,
        bossId
      ){
        const nom=
          String(
            nomBoss || ''
          ).trim();

        const numero=
          Math.max(
            0,
            idleEntier_(bossId)
          );

        if(
          !nom ||
          !numero ||
          !SOREAL_SESSION
        ){
          return;
        }

        const host=
          document.getElementById(
            'sorealIdleBossImageHostV36'
          );

        if(!host){
          return;
        }

        const cacheKey=
          String(numero);

        if(
          idleBossImageCacheV36[cacheKey]
        ){
          host.innerHTML=
            markupImageCombatIdleV61_(
              'boss',
              '',
              idleBossImageCacheV36[cacheKey],
              nom,
              'soreal-idle-boss-image-v35',
              cacheKey
            );

          return;
        }

        const urlR2=
          urlBossR2IdleV1_(numero);

        if(!urlR2)return;

        idleBossImageCacheV36[cacheKey]=
          urlR2;

        host.innerHTML=
          markupImageCombatIdleV61_(
            'boss',
            '',
            urlR2,
            nom,
            'soreal-idle-boss-image-v35',
            cacheKey
          );
      }


      let idleDernierResumeHorsLigneV64=0;

      function afficherResumeHorsLigneIdleV64_(
        j
      ){
        const p=
          j&&j.progressionHorsLigne
            ?j.progressionHorsLigne
            :null;

        if(
          !p ||
          idleNombre_(
            p.secondes
          )<20
        ){
          return;
        }

        const signature=
          idleEntier_(
            p.secondes
          )+
          ':'+
          Math.round(
            idleNombre_(
              p.energieProduite
            )*10
          );

        if(
          String(
            idleDernierResumeHorsLigneV64
          )===String(signature)
        ){
          return;
        }

        idleDernierResumeHorsLigneV64=
          signature;

        const produite=
          idleNombre_(
            p.energieProduite
          );

        const depensee=
          idleNombre_(
            p.energieDepenseeAventure
          );

        const perdue=
          idleNombre_(
            p.energiePerdueAuPlafond
          );

        let texte=
          '⚡ Hors ligne : +'+
          formatEnergieIdleV50_(
            produite
          )+
          ' énergie produite';

        if(depensee>0){
          texte+=
            ' · -'+
            formatEnergieIdleV50_(
              depensee
            )+
            ' dépensée en aventure AUTO';
        }

        if(perdue>0){
          texte+=
            ' · '+
            formatEnergieIdleV50_(
              perdue
            )+
            ' au-delà du maximum';
        }

        setTimeout(
          function(){
            messageFlottantIdleV32_(
              texte
            );
          },
          250
        );
      }


      function rendreIdleEtat_(res){
        if(!res||!res.ok||!res.joueur){
          rendreIdleErreur_('Réponse serveur invalide.');
          return;
        }

        const joueurRenduProtegeV208=
          protegerJoueurServeurInventaireIdleV208_(
            res.joueur
          );

        if(window.__SOREAL_IDLE_INVENTORY_PERF_V160__){
          window.__SOREAL_IDLE_INVENTORY_PERF_V160__.globalRenders+=1;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-330 */
        const idleScrollXAvantRenduV1=window.scrollX||0;
        const idleScrollYAvantRenduV1=window.scrollY||0;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-331 */
        const adventureRestPvAvantV2=idleEtat&&idleEtat.adventureRestPv;
        const synchroCombatSansReflowV179=
          appliquerSynchroCombatSansReflowIdleV116_(
            joueurRenduProtegeV208
          );

        if(!synchroCombatSansReflowV179){
          idleEtat=joueurRenduProtegeV208;
          if(adventureRestPvAvantV2!=null&&idleEtat.adventureRestPv==null){
            idleEtat.adventureRestPv=adventureRestPvAvantV2;
          }
        }
        pousserEtatVersRuntimePartageIdleV1_();
        idleVictoireBossLocaleV49=false;
        idleDernierTickLocalV40=
          Date.now();

        idleResteTickEnergieMsV114=
          Math.max(
            0,
            idleNombre_(
              idleEtat.energieTick &&
              idleEtat.energieTick.resteMs
            )
          );

        const j=idleEtat;

        initialiserCoupsCombatIdleV116_();

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-332 */
        const fightBossDomStableV179=
          synchroCombatSansReflowV179 &&
          Boolean(j.combatBossActif) &&
          idleMenuActifV28==='combat' &&
          idleMenuRenduV179==='combat' &&
          Boolean(
            document.getElementById(
              'sorealIdleBossStartV100'
            )
          );

        if(fightBossDomStableV179){
          patcherResumeStatsIdleV28_(j);
          rafraichirEnergieEtBoutonsIdleV9_();
          rafraichirCommandesFightBossIdleV167_();
          return;
        }

        afficherResumeHorsLigneIdleV64_(
          j
        );

        if(
          j.autoAventure &&
          typeof j.autoAventure==='object'
        ){
          idleAutoAventureV30=
            Boolean(
              j.autoAventure.actif
            );

          if(
            idleEntier_(
              j.autoAventure.zoneId
            )>0
          ){
            idleAutoZoneV30=
              idleEntier_(
                j.autoAventure.zoneId
              );
          }

          sauverCombatAutoIdleV30_();
        }

        chargerMenuIdleV28_();

        prechargerCatalogueCombatIdleV61_(
          j
        );

        if(
          !menuDisponibleIdleV28_(
            idleMenuActifV28,
            j
          )
        ){
          idleMenuActifV28='combat';
          sauverMenuIdleV28_();
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-333 */
        const imageMoneyPitAvantRenduV209=
          idleMenuActifV28==='moneyPit'
            ?document.getElementById('sorealIdleMoneyPitImageV209')
            :null;

        document.getElementById('app').innerHTML=
          header()+
          `<section class="soreal-idle-native-v4">
            <div class="soreal-idle-hero-v4 soreal-idle-hero-banner-v95">
              ${
                j.banniereDriveFileId
                  ?'<img src="'+
                    idleHtml_(
                      urlDriveRapideIdleV46_(
                        j.banniereDriveFileId
                      )
                    )+
                    '" alt="SOREAL IDLE">'
                  :'<div style="height:170px;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:1000">SOREAL IDLE</div>'
              }
              <div class="soreal-idle-badge-v4">
                🔒 ${IDLE_TEST_VERSION}
              </div>
            </div>

            ${navigationIdleV28_(j)}

            ${rendreBarreEnergiePersistanteIdleV1_(j)}

            ${resumeStatsIdleV28_(j)}

            ${walderpBanniereIdleV147_(j)}

            <div class="soreal-idle-page-root-v28" style="--nav-color:${idleHtml_(IDLE_NAV_COULEURS_V1[idleMenuActifV28]||'#5b6b93')}">
              ${contenuMenuIdleV28_(j)}
            </div>
          </section>`;

        if(
          idleMenuActifV28==='moneyPit'&&
          imageMoneyPitAvantRenduV209
        ){
          const imageMoneyPitApresRenduV209=
            document.getElementById('sorealIdleMoneyPitImageV209');
          if(
            imageMoneyPitApresRenduV209&&
            imageMoneyPitApresRenduV209!==imageMoneyPitAvantRenduV209
          ){
            imageMoneyPitApresRenduV209.replaceWith(
              imageMoneyPitAvantRenduV209
            );
          }
        }

        idleMenuRenduV179=
          idleMenuActifV28;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-334 */
        try{
          rendrePendingIdleV7_();
        }catch(e){
          console.error(
            'SOREAL IDLE post-render pending :',
            e
          );
        }

        try{
          demarrerTickerIdle_();
        }catch(e){
          console.error(
            'SOREAL IDLE post-render ticker :',
            e
          );
        }

        try{
          rafraichirEstAdminSorealIdle_();
        }catch(e){
          console.error(
            'SOREAL IDLE post-render admin :',
            e
          );
        }

        try{
          rafraichirPartieDevIdleV1_();
        }catch(e){
          console.error(
            'SOREAL IDLE post-render parties dev :',
            e
          );
        }

        try{
          restaurerScrollNavIdleV28_();
        }catch(e){
          console.error(
            'SOREAL IDLE post-render nav scroll :',
            e
          );
        }

        try{
          initialiserSwipeNavigationIdleV1_();
        }catch(e){
          console.error(
            'SOREAL IDLE post-render swipe :',
            e
          );
        }

        requestAnimationFrame(
          function(){
            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-335 */
            if(typeof window.mesurerInterfaceMobileV31==='function'){
              window.mesurerInterfaceMobileV31();
            }

            restaurerScrollJournalCombatIdleV70_();
            restaurerScrollJournalAventureIdleV1_();

            window.scrollTo(
              idleScrollXAvantRenduV1,
              idleScrollYAvantRenduV1
            );

            chargerImageBossIdleV36_(
              j.bossActuel,
              j.bossDriveFileId,
              idImageBossCanoniqueIdleV181_(j)
            );

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-336 */
            chargerImageJoueurIdleV43_(
              j.apparenceJoueur&&j.apparenceJoueur.numero,
              j.apparenceJoueur&&j.apparenceJoueur.driveFileId,
              (aventureMetaIdleV47_(j)||{}).selectedZone,
              j.systemes&&j.systemes.portraits&&j.systemes.portraits.selectedFile
            );

            demarrerBullesCombatIdleV76_(
              j
            );

            gererPopupsProgressionIdleV75_(
              j
            );

            gererTutorielPremierBossIdleV1_(
              j
            );

            if(
              idleMenuActifV28==='aventure' &&
              idleAutoAventureV30 &&
              !idleAventureEnCoursV17 &&
              peutRelancerCombatAutoIdleV30_()
            ){
              programmerCombatAutoIdleV30_(
                700
              );
            }
          }
        );
      }




      function basculerVersIdleSansReflowV104_(
        res
      ){
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-337 */
        styleIdle_();

        PAGE_ACTIVE='idle';

        document.body.classList.remove(
          'soreal-chat-v31',
          'soreal-agenda-v31'
        );

        document.body.classList.add(
          'soreal-idle-active-v47'
        );

        installer69LolIdleV183_();

        if(
          typeof arreterActualisationsLiveSorealV14_1===
          'function'
        ){
          arreterActualisationsLiveSorealV14_1();
        }

        marquerBoutonIdleActif_();

        rendreIdleEtat_(
          res
        );
      }


      function annulerOuvertureIdleV104_(){
        window.__idleOuvertureEnCoursV104__=0;
      }


      function signalerErreurOuvertureIdleV104_(
        message
      ){
        annulerOuvertureIdleV104_();

        const texte=
          String(
            message||
            'Impossible de charger SOREAL IDLE.'
          );

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-338 */
        if(
          typeof messageFlottantIdleV32_===
          'function'
        ){
          styleIdle_();

          messageFlottantIdleV32_(
            '❌ '+texte
          );
        }else{
          alert(
            texte
          );
        }
      }


      function ouvrirSorealIdleAvecEtatV108_(
        res
      ){
        idleAutorise=true;

        afficherBoutonIdle_(
          true
        );

        if(
          !res ||
          !res.ok ||
          !res.joueur
        ){
          signalerErreurOuvertureIdleV104_(
            res&&res.message
              ?res.message
              :'État du joueur invalide.'
          );
          return false;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-339 */
        basculerVersIdleSansReflowV104_(
          res
        );

        return true;
      }


      window.__ouvrirSorealIdleAvecEtatV108__=
        ouvrirSorealIdleAvecEtatV108_;


      function chargerSorealIdleNatifV4_(){
        if(!idleAutorise){
          signalerErreurOuvertureIdleV104_(
            'Accès SOREAL IDLE non autorisé.'
          );
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-340 */
        const numeroChargement=
          (
            window.__idleNumeroChargementV34__ ||
            0
          ) + 1;

        window.__idleNumeroChargementV34__=
          numeroChargement;

        window.__idleOuvertureEnCoursV104__=
          numeroChargement;

        let chargementTermine=false;
        let tentative=0;
        let timerRetry=null;

        const debutChargementV106=
          Date.now();

        const maxTentativesV106=6;
        const delaiMaximumV106=16000;

        function encoreValide(){
          return (
            !chargementTermine &&
            window.__idleNumeroChargementV34__===
              numeroChargement &&
            window.__idleOuvertureEnCoursV104__===
              numeroChargement
          );
        }

        function terminerChargement(){
          chargementTermine=true;

          if(timerRetry){
            clearTimeout(
              timerRetry
            );

            timerRetry=null;
          }

          window.__idleOuvertureEnCoursV104__=0;

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-341 */
          arreterAnimationChargementIdleV55_();
        }

        function programmerNouvelleTentative(){
          if(!encoreValide()){
            return;
          }

          tentative+=1;

          if(
            tentative>maxTentativesV106 ||
            Date.now()-debutChargementV106>
              delaiMaximumV106
          ){
            terminerChargement();

            signalerErreurOuvertureIdleV104_(
              'Le moteur IDLE est encore occupé. Reclique sur ⚡ dans un instant.'
            );

            return;
          }

          const attente=
            Math.min(
              3500,
              700+
              tentative*450
            );

          timerRetry=
            setTimeout(
              demanderEtat,
              attente
            );
        }

        function demanderEtat(){
          if(!encoreValide()){
            return;
          }

          google.script.run
            .withSuccessHandler(function(res){
              if(!encoreValide()){
                return;
              }

              if(
                res &&
                res.code===
                  'SOREAL_IDLE_OCCUPE'
              ){
                programmerNouvelleTentative();
                return;
              }

              if(
                !res ||
                !res.ok
              ){
                terminerChargement();

                signalerErreurOuvertureIdleV104_(
                  res &&
                  res.message
                    ?res.message
                    :'Impossible de charger SOREAL IDLE.'
                );

                return;
              }

              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-342 */
              terminerChargement();

              try{
                basculerVersIdleSansReflowV104_(
                  res
                );

              }catch(e){
                signalerErreurOuvertureIdleV104_(
                  'Erreur d’affichage IDLE : '+
                  (
                    e&&e.message
                      ?e.message
                      :String(e)
                  )
                );
              }
            })
            .withFailureHandler(function(e){
              if(!encoreValide()){
                return;
              }

              const message=
                e&&e.message
                  ?String(e.message)
                  :String(
                      e||
                      'Erreur serveur'
                    );

              if(
                /moteur SOREAL IDLE est occupé|jeu est occupé|SOREAL_IDLE_OCCUPE/i
                  .test(message)
              ){
                programmerNouvelleTentative();
                return;
              }

              terminerChargement();

              signalerErreurOuvertureIdleV104_(
                message
              );
            })
            .obtenirEtatSorealIdle(
              SOREAL_SESSION
            );
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-343 */
        demanderEtat();
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-344 */
      window.__ouvrirSorealIdleModuleV26__=
        function(){
          idleAutorise=true;

          afficherBoutonIdle_(
            true
          );

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-345 */
          chargerSorealIdleNatifV4_();
        };

      window.__ouvrirSorealIdleModuleV27__=
        window.__ouvrirSorealIdleModuleV26__;

      window.__ouvrirSorealIdleModuleV1__=
        window.__ouvrirSorealIdleModuleV26__;


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-346 */
      const ouvrirPageSorealOriginalV4=
        typeof window.ouvrirPage==='function'
          ?window.ouvrirPage
          :null;

      if(ouvrirPageSorealOriginalV4){
        window.ouvrirPage=function(p,b,restauration){
          if(p==='idle'){
            if(b){
              b.classList.remove(
                'active',
                'selected',
                'open'
              );
            }

            try{
              localStorage.setItem(
                typeof CLE_PAGE_SOREAL!=='undefined'
                  ?CLE_PAGE_SOREAL
                  :'soreal_page',
                'today'
              );
            }catch(e){}

            chargerSorealIdleNatifV4_();

            if(!restauration){
              try{
                if(
                  typeof pousserEtatNavigationSorealV14_1===
                  'function'
                ){
                  pousserEtatNavigationSorealV14_1();
                }
              }catch(e){}
            }

            return;
          }

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-347 */
          annulerOuvertureIdleV104_();

          window.__idleNumeroChargementV34__=
            (
              window.__idleNumeroChargementV34__ ||
              0
            ) + 1;

          document.body.classList.remove(
            'soreal-idle-active-v47'
          );

          return ouvrirPageSorealOriginalV4.apply(
            this,
            arguments
          );
        };
      }

      function verifierAccesIdleNatifV4_(){
        if(idleVerificationEnCours)return;
        if(!SOREAL_SESSION)return;

        idleVerificationEnCours=true;

        google.script.run
          .withSuccessHandler(function(res){
            idleVerificationEnCours=false;
            idleAutorise=Boolean(
              res &&
              res.ok &&
              res.autorise
            );

            afficherBoutonIdle_(idleAutorise);
          })
          .withFailureHandler(function(){
            idleVerificationEnCours=false;
            idleAutorise=false;
            afficherBoutonIdle_(false);
          })
          .obtenirAccesSorealIdle(SOREAL_SESSION);
      }

      function attendreSessionIdleNatifV4_(){
        afficherBoutonIdle_(false);

        if(idleTimerSession){
          clearInterval(idleTimerSession);
        }

        idleTimerSession=setInterval(function(){
          if(!SOREAL_SESSION)return;

          clearInterval(idleTimerSession);
          idleTimerSession=null;
          verifierAccesIdleNatifV4_();
        },500);
        requestAnimationFrame(function(){
          
        });

      }

      window.__acheterEntrainementIdleV5__=
        acheterEntrainementIdleV5_;

      window.__equiperObjetIdleV10__=
        equiperObjetIdleV10_;

      window.__acheterAmeliorationIdleV12__=
        acheterAmeliorationIdleV12_;

      window.__ouvrirSorealIdleModuleV25__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV24__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV23__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV22__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV21__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV20__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV19__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV18__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV17__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV16__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV15__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV14__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV13__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV12__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV11__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV10__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV9__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV8__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV7__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV6__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV5__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV4__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV3__=
        window.__ouvrirSorealIdleModuleV26__;
      window.__ouvrirSorealIdleModuleV2__=
        window.__ouvrirSorealIdleModuleV26__;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-348 */
    })();
