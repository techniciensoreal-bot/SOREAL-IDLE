/*
 * SOREAL IDLE — Fight Boss et Titans (partie 1) (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_combat_1_v1)return;
  REG.__chargé_ui_combat_1_v1=true;

  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function idleNombre_(){return REG.idleNombre_.apply(null,arguments);}
  function fightEnAttenteServeurIdleV1_(){return REG.fightEnAttenteServeurIdleV1_.apply(null,arguments);}
  function rendreIdleEtat_(){return REG.rendreIdleEtat_.apply(null,arguments);}
  function synchroniserJeuIdleV7_(){return REG.synchroniserJeuIdleV7_.apply(null,arguments);}
  function multiplicateurFureurLocaleIdleV70_(){return REG.multiplicateurFureurLocaleIdleV70_.apply(null,arguments);}
  function aventureMetaIdleV47_(){return REG.aventureMetaIdleV47_.apply(null,arguments);}
  function ajouterLogAventureIdleV1_(){return REG.ajouterLogAventureIdleV1_.apply(null,arguments);}
  function ajouterActionRapideIdleV60_(){return REG.ajouterActionRapideIdleV60_.apply(null,arguments);}
  function fusionnerBasicTrainingPlusAvanceIdleV166_(){return REG.fusionnerBasicTrainingPlusAvanceIdleV166_.apply(null,arguments);}
  function pousserEtatVersRuntimePartageIdleV1_(){return REG.pousserEtatVersRuntimePartageIdleV1_.apply(null,arguments);}
  function rafraichirEnergieEtBoutonsIdleV9_(){return REG.rafraichirEnergieEtBoutonsIdleV9_.apply(null,arguments);}
  function aventureDebloqueeIdleV47_(){return REG.aventureDebloqueeIdleV47_.apply(null,arguments);}
  function toastIdleV5_(){return REG.toastIdleV5_.apply(null,arguments);}
  function conserverPositionIdleV24_(){return REG.conserverPositionIdleV24_.apply(null,arguments);}
  function zoneAventureLocaleIdleV30_(){return REG.zoneAventureLocaleIdleV30_.apply(null,arguments);}
  function cooldownAventureRestantIdleV100_(){return REG.cooldownAventureRestantIdleV100_.apply(null,arguments);}
  function combattreAventureIdleV17_(){return REG.combattreAventureIdleV17_.apply(null,arguments);}
  function demarrerTutorielPagesIdleV1_(){return REG.demarrerTutorielPagesIdleV1_.apply(null,arguments);}
  function generationJoueurIdleV75_(){return REG.generationJoueurIdleV75_.apply(null,arguments);}
  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function attrHistoireVoixIdleV1_(){return REG.attrHistoireVoixIdleV1_.apply(null,arguments);}
  function mainChroniqueIdleV1_(){return REG.mainChroniqueIdleV1_.apply(null,arguments);}
  function sansBaliseVoixIdleV1_(){return REG.sansBaliseVoixIdleV1_.apply(null,arguments);}
  function boutonLectureChroniqueIdleV1_(){return REG.boutonLectureChroniqueIdleV1_.apply(null,arguments);}
  function formatGrandNombreIdleV70_(){return REG.formatGrandNombreIdleV70_.apply(null,arguments);}

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-7 */
      const IDLE_HIT_JOUEUR_MS_V116=850;

      const IDLE_HIT_BOSS_MS_V116=1000;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-8 */
      let idleCompensationImpactJoueurV117=null;

      let idleCompensationImpactBossV117=null;

      function initialiserCoupsCombatIdleV116_(){
        if(!REG.idleEtat||!REG.idleEtat.combatBossActif){
          REG.idleCombatIdentiteV116='';
          REG.idleProchainCoupJoueurV116=0;
          REG.idleProchainCoupBossV116=0;
          return;
        }

        const identite=
          String(idleEntier_(REG.idleEtat.bossSelection||1))+
          ':'+
          String(REG.idleEtat.bossActuel||'');

        if(identite===REG.idleCombatIdentiteV116){
          return;
        }

        REG.idleCombatIdentiteV116=identite;
        idleCompensationImpactJoueurV117=null;
        idleCompensationImpactBossV117=null;

        const maintenant=Date.now();

        REG.idleProchainCoupJoueurV116=
          maintenant+
          IDLE_HIT_JOUEUR_MS_V116;

        REG.idleProchainCoupBossV116=
          maintenant+
          IDLE_HIT_BOSS_MS_V116;
      }

      /*
       * Un niveau d'Augment gagné agit tout de suite sur l'attaque, la défense et la VIE MAX (Norman, 2026-10-09 : « quand Augmentation prend un niveau, la barre de vie ne grandit pas instantanément »).
       * Avant, le multiplicateur ne changeait qu'à la synchro suivante. On recalcule ici le multiplicateur d'Augments depuis les niveaux rejoués localement (même formule que le moteur : somme de
       * base × niveau^exposant × (1 + niveau d'Upgrade²), l'effet des perks/NGU est déduit du multiplicateur du serveur) et on répercute le rapport sur les multiplicateurs de combat ; la synchro corrige.
       */
      function appliquerAugmentsSurCombatIdleV1_(visual,niveaux){
        try{
          const base=visual&&visual.base;
          const cp=REG.idleEtat&&REG.idleEtat.combatPrincipal;
          const defs=REG.idleEtat&&REG.idleEtat.systemes&&Array.isArray(REG.idleEtat.systemes.augmentations)?REG.idleEtat.systemes.augmentations:[];
          if(!base||!cp||!defs.length)return;
          /* Aucun niveau rejoué (pas encore de repère) : on ne touche à rien. Depuis le 2026-10-16 les niveaux sont rejoués à chaque tick quel que soit le menu ouvert. */
          if(!Object.keys(niveaux).length)return;
          let additif=0;
          defs.forEach(function(d){
            /* Une piste non affichée garde le niveau du dernier repère. */
            const vd=(visual.defs&&visual.defs[d.id])||{};
            const n=niveaux[d.id+':main']!=null?niveaux[d.id+':main']:Math.max(0,idleEntier_(vd.level));
            if(!(n>0))return;
            const u=niveaux[d.id+':upgrade']!=null?niveaux[d.id+':upgrade']:Math.max(0,idleEntier_(vd.upgradeLevel));
            additif+=idleNombre_(d.baseMultiplier)*Math.pow(n,idleNombre_(d.exponent)||1)*(1+u*u);
          });
          /* Sans niveau d'Augment au départ, on ne peut pas déduire l'effet des perks/NGU : on attend la synchro plutôt que d'inventer un saut. */
          if(!(base.additif>0))return;
          const k=(base.mult-1)/base.additif;
          const multMaintenant=Math.max(1,1+additif*k);
          const ratio=multMaintenant/base.mult;
          const applique=visual.appliedRatio||1;
          /* Les niveaux ne reculent jamais : un rapport plus petit que celui déjà appliqué vient d'une donnée manquante, on l'ignore. */
          if(!isFinite(ratio)||ratio<=0||ratio<=applique+1e-12)return;
          /* L'attaque et la défense de combat ne sont plus touchées ici : elles suivent la trajectoire envoyée par le serveur pour TOUS les systèmes (appliquerTrajectoireStatsIdleV1_). Ce rejeu ne sert plus qu'au multiplicateur affiché dans la page. */
          visual.appliedRatio=ratio;
          const texteMult=document.getElementById('sorealIdleAugMultV1');
          if(texteMult&&typeof window.__formatMultiplicateurIdleV1__==='function')texteMult.textContent=window.__formatMultiplicateurIdleV1__(multMaintenant);
        }catch(e){}
      }

      /*
       * Multiplicateurs d'attaque et de défense du combat local, à jour pour TOUS les systèmes (Norman, 2026-10-16 : « l'état du personnage est déterminé par les événements du gameplay, jamais par l'onglet affiché »).
       * Le serveur renvoie, avec chaque état, les valeurs que ces deux multiplicateurs prendront dans les secondes qui suivent (combatPrincipal.trajectoire, calculée par le même moteur : Augmentations, NGU, Wandoos,
       * Hacks, Wishes... sans code propre à chaque système). On les applique ici à l'heure dite, par interpolation entre deux points. Aucune minuterie ni synchro : appelée par le tick qui existe déjà.
       */
      function appliquerTrajectoireStatsIdleV1_(){
        const e=REG.idleEtat;const cp=e&&e.combatPrincipal;const tr=cp&&cp.trajectoire;
        if(!cp||!Array.isArray(tr)||!tr.length)return;
        if(!cp.__baseTrajV1)cp.__baseTrajV1={a:idleNombre_(cp.multiplicateurAttaqueTotal),d:idleNombre_(cp.multiplicateurDefenseTotal)};
        if(!cp.__ancreTrajV1){
          const recu=Number(e.__recuPerfV1);
          const rtt=typeof window.__SOREAL_IDLE_RTT_V1__==='function'?window.__SOREAL_IDLE_RTT_V1__():0;
          cp.__ancreTrajV1=(recu>0?recu:performance.now())-rtt/2;
        }
        const ms=performance.now()-cp.__ancreTrajV1;
        let t0=0,a0=cp.__baseTrajV1.a,d0=cp.__baseTrajV1.d,a=a0,d=d0;
        for(let i=0;i<tr.length;i++){
          const p=tr[i];
          if(ms>=p.t){t0=p.t;a0=p.a;d0=p.d;a=a0;d=d0;continue;}
          const f=(ms-t0)/(p.t-t0);a=a0+(p.a-a0)*f;d=d0+(p.d-d0)*f;break;
        }
        if(a>0&&cp.multiplicateurAttaqueTotal!==a)cp.multiplicateurAttaqueTotal=a;
        if(d>0&&cp.multiplicateurDefenseTotal!==d)cp.multiplicateurDefenseTotal=d;
      }

      function actualiserCooldownBossIdleV100_(
        maintenant
      ){
        if(!REG.idleEtat)return;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-27 */
        void maintenant;

        REG.idleEtat.bossRespawnJusqua=0;
        REG.idleEtat.bossRespawnSecondesRestantes=0;
        REG.idleEtat.bossDisponible=true;

        const el=
          document.getElementById(
            'sorealIdleBossRespawnV100'
          );

        /* Audit de Combat de boss (Norman, 2026-10-05) : ces écritures tournaient ~20 fois par seconde, même sans rien changer, et chacune modifiait la page ; elles n'ont lieu que si la valeur change. */
        if(el){
          if(el.textContent!=='')el.textContent='';
          if(!el.classList.contains('ready'))el.classList.add('ready');
        }

        const start=
          document.getElementById(
            'sorealIdleBossStartV100'
          );

        if(start){
          const desactive=
            Boolean(
              REG.idleEtat.combatBossActif ||
              REG.idlePopupBloqueCombatV102 ||
              REG.idlePopupActifV75 ||
              REG.idlePopupQueueV75.length ||
              REG.idleEtat.bossBloqueRenaissance ||
              idleNombre_(REG.idleEtat.pvJoueur)<=0 ||
              fightEnAttenteServeurIdleV1_()
            );
          if(start.disabled!==desactive)start.disabled=desactive;
        }
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-28 */
      function rafraichirCommandesFightBossIdleV167_(){
        if(!REG.idleEtat)return;
        actualiserCooldownBossIdleV100_(Date.now());

        const fuite=
          document.querySelector(
            '.soreal-idle-boss-control-v39.stop'
          );
        if(fuite){
          const fuiteDesactivee=!REG.idleEtat.combatBossActif;
          if(fuite.disabled!==fuiteDesactivee)fuite.disabled=fuiteDesactivee;
        }

      }

      /*
       * Filet de sécurité « Boss vaincu » (Norman, 2026-10-15 : « il arrive encore souvent que l'image du boss suivant n'apparaisse pas ; ça reste bloqué sur Boss vaincu ; je dois changer de menu ou faire Fight puis Fuite »).
       * Le bandeau « 🏆 BOSS VAINCU » est posé par-dessus l'image ; il ne disparaît que quand la page est redessinée avec le boss suivant. Toutes les protections précédentes dépendent d'un drapeau de victoire prédite : s'il a
       * été remis à zéro entre-temps (réponse du serveur, battement, action), plus rien ne relançait le rendu et le bandeau restait. Ici, indépendamment de tout drapeau : tant que CE bandeau est encore à l'écran,
       * on redemande l'état au serveur (à 3, 6, 10, 15 et 20 s) et on redessine la page avec lui (le serveur fait foi : le boss suivant s'il a confirmé la victoire, sinon le même boss, prêt à être relancé).
       */
      function surveillerVictoireFigeeIdleV1_(bandeau){
        const debut=Date.now();
        const rendezVous=[3000,6000,10000,15000,20000];
        let i=0;
        const attendre=function(){
          if(i>=rendezVous.length)return;
          setTimeout(function(){
            i+=1;
            if(!bandeau||!bandeau.isConnected||PAGE_ACTIVE!=='idle'||!REG.idleEtat){return;}
            google.script.run
              .withSuccessHandler(function(etat){
                if(!bandeau.isConnected||PAGE_ACTIVE!=='idle'||!etat||!etat.ok||!etat.joueur){attendre();return;}
                REG.idleVictoireBossLocaleV49=false;
                REG.idlePrevisionBossV1={actif:false,vaincus:0,debut:0};
                arreterSurveillanceVictoireBossIdleV1_();
                REG.idleCombatArmeLocalV206=false;
                REG.idleEtat=etat.joueur;
                rendreIdleEtat_({ok:true,joueur:etat.joueur});
                if(bandeau.isConnected)attendre();
              })
              .withFailureHandler(function(){attendre();})
              .obtenirEtatSorealIdle(SOREAL_SESSION);
          },Math.max(0,rendezVous[i]-(i?rendezVous[i-1]:0)));
        };
        attendre();
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
        surveillerVictoireFigeeIdleV1_(overlay);

        if(REG.idleEtat){
          REG.idleEtat.combatBossActif=false;
          REG.idleEtat.bossRespawnJusqua=0;
          REG.idleEtat.bossRespawnSecondesRestantes=0;
          REG.idleEtat.bossDisponible=true;

          const courant=
            Array.isArray(
              REG.idleEtat.bossCatalogue
            )
              ?REG.idleEtat.bossCatalogue.find(
                  function(boss){
                    return (
                      idleEntier_(boss.numero)===
                      idleEntier_(REG.idleEtat.bossSelection)
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
       * un changement de menu (qui recharge tout). On relance la synchronisation forcée toutes les 0,4 s (Norman, 2026-09-27 :
       * « presque 10 secondes d'attente avant que le boss suivant apparaisse » -- 1,2 s laissait jusqu'à 1,2 s de « retard
       * d'affichage » en plus du retard déjà pris par le serveur lui-même à confirmer la victoire) tant que la victoire n'est
       * pas confirmée (le rendu qui affiche le nouveau boss remet le drapeau à zéro et arrête la surveillance) ; au bout de
       * 15 s sans confirmation on abandonne la prédiction locale et on adopte l'état du serveur au lieu de rester figé.
       */
      let idleVictoireSurveillanceV1=null;
      /* Coup final ordonné par le serveur : instant (Date.now) où la barre du boss a été ramenée à presque rien pour que le tick local déroule la victoire, 0 sinon. */
      let idleCoupFinalServeurV1=0;

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
          if(PAGE_ACTIVE!=='idle'||!REG.idleEtat||!REG.idleVictoireBossLocaleV49){
            arreterSurveillanceVictoireBossIdleV1_();
            return;
          }
          if(Date.now()-debut>15000){
            arreterSurveillanceVictoireBossIdleV1_();
            /* Trace pour le diagnostic : une victoire prédite que le serveur n'a pas confirmée en 15 s (voir « Diagnostic », Réglages). */
            try{
              const srv=typeof window.__SOREAL_IDLE_DERNIER_ETAT_SERVEUR_V1__==='function'?window.__SOREAL_IDLE_DERNIER_ETAT_SERVEUR_V1__():null;
              const pct=srv&&idleNombre_(srv.bossPvMax)>0?Math.round(100*idleNombre_(srv.bossPv)/idleNombre_(srv.bossPvMax)):'?';
              window.__SOREAL_IDLE_DIAG_V1__&&window.__SOREAL_IDLE_DIAG_V1__.signaler('victoire_boss_non_confirmee','boss '+idleEntier_(REG.idlePrevisionBossV1.vaincus)+' : 15 s sans confirmation ; serveur : boss à '+pct+' % de ses PV, combat '+(srv&&srv.combatBossActif?'actif':'arrêté')+', boss vaincus '+(srv?idleEntier_(srv.bossVaincus):'?'));
            }catch(_e){}
            google.script.run
              .withSuccessHandler(function(etat){
                if(PAGE_ACTIVE!=='idle'||!REG.idleVictoireBossLocaleV49||!etat||!etat.ok||!etat.joueur)return;
                REG.idleEtat=etat.joueur;
                REG.idleCombatArmeLocalV206=false;
                rendreIdleEtat_({ok:true,joueur:etat.joueur});
              })
              .withFailureHandler(function(){})
              .obtenirEtatSorealIdle(SOREAL_SESSION);
            return;
          }
          synchroniserJeuIdleV7_(true);
        },400);
      }

      /*
       * vaincusAvant = nombre de boss vaincus AU MOMENT de la victoire. Norman (2026-10-03) : « j'ai tué le boss 45 et je suis passé au 47 ; après refresh j'étais bien au 46 ». Le serveur répond
       * maintenant plus vite que le délai de 250 ms avant d'afficher le suivant : sa confirmation (déjà au boss 46, avec SON « boss suivant » = 47) arrivait avant, et on appliquait alors ce 47 par-dessus.
       * On n'applique donc le boss suivant que si l'état est encore exactement celui de la victoire, et que ce boss suivant est bien le suivant immédiat.
       */
      function appliquerBossSuivantLocalIdleV1_(vaincusAvant){
        const n=REG.idleEtat&&REG.idleEtat.bossSuivant;
        if(PAGE_ACTIVE!=='idle'||!REG.idleVictoireBossLocaleV49||!n||!n.bossId||idleEntier_(n.bossVaincus)<=idleEntier_(REG.idleEtat.bossVaincus))return false;
        if(vaincusAvant!==undefined&&idleEntier_(REG.idleEtat.bossVaincus)>idleEntier_(vaincusAvant)){
          /* Le serveur a déjà confirmé la victoire : son état fait foi, plus rien à prédire. */
          REG.idleVictoireBossLocaleV49=false;
          arreterSurveillanceVictoireBossIdleV1_();
          return false;
        }
        if(vaincusAvant!==undefined&&(idleEntier_(REG.idleEtat.bossVaincus)!==idleEntier_(vaincusAvant)||idleEntier_(n.bossVaincus)!==idleEntier_(vaincusAvant)+1))return false;
        const vaincus=idleEntier_(n.bossVaincus);
        Object.assign(REG.idleEtat,n);
        REG.idleEtat.bossSuivant=null;
        REG.idleEtat.combatBossActif=false;
        REG.idleEtat.bossPv=idleNombre_(n.bossPvMax);
        REG.idleEtat.bossRespawnJusqua=0;
        REG.idleEtat.bossRespawnSecondesRestantes=0;
        REG.idleEtat.bossDisponible=true;
        /* rendreIdleEtat_ remet à zéro le drapeau de victoire prédite : on le rétablit, avec la garde, pour que le serveur en retard ne ramène pas l'ancien boss. */
        rendreIdleEtat_({ok:true,joueur:REG.idleEtat});
        REG.idleVictoireBossLocaleV49=true;
        REG.idlePrevisionBossV1={actif:true,vaincus:vaincus,debut:Date.now()};
        return true;
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

      /*
       * Ambiance du duel (Norman, 2026-10-03 : « une animation aux images dans Fight Boss quand le combat commence ; plus la vie d'un des deux combattants est faible, plus l'effet s'intensifie »).
       * 0 = pleine vie, 1 = presque mort, pour chaque combattant ; les animations CSS (soreal-idle-themes.css) en tirent leur vitesse, leur amplitude et leur halo.
       */
      function actualiserAmbianceCombatIdleV1_(){
        const duel=document.querySelector('.soreal-idle-duel-v41');
        if(!duel||!REG.idleEtat)return;
        const actif=Boolean(REG.idleEtat.combatBossActif)&&!REG.idleVictoireBossLocaleV49;
        if(!actif){
          if(duel.classList.contains('combat-actif')){
            duel.classList.remove('combat-actif','danger-boss','danger-joueur');
            ['--i-joueur','--i-boss'].forEach(function(c){duel.style.removeProperty(c);});
          }
          return;
        }
        const ratio=function(pv,max){return idleNombre_(max)>0?Math.max(0,Math.min(1,idleNombre_(pv)/idleNombre_(max))):1;};
        const iJoueur=Math.round((1-ratio(REG.idleEtat.pvJoueur,REG.idleEtat.pvJoueurMax))*50)/50;
        const iBoss=Math.round((1-ratio(REG.idleEtat.bossPv,REG.idleEtat.bossPvMax))*50)/50;
        if(!duel.classList.contains('combat-actif'))duel.classList.add('combat-actif');
        duel.classList.toggle('danger-boss',iBoss>=.75);
        duel.classList.toggle('danger-joueur',iJoueur>=.75);
        /* Écrit seulement si ça change (les animations ne repartent pas à chaque tick). */
        const cle=iJoueur+'|'+iBoss;
        if(duel.dataset.ambianceV1!==cle){
          duel.dataset.ambianceV1=cle;
          duel.style.setProperty('--i-joueur',String(iJoueur));
          duel.style.setProperty('--i-boss',String(iBoss));
        }
      }

      function largeurBarreVieCombatIdleV163_(element,pourcentage){
        if(!element)return;
        const pct=Math.max(0,Math.min(100,idleNombre_(pourcentage)));
        /*
         * Norman (2026-09-29) : « La barre de vie des boss rame quand elle diminue. Avant elle
         * était très fluide. » Ce forçage inline de transition:none (V163, "COMBAT PAR IMPACT
         * V116") avait un sens tant que le tick de jeu tournait à la fréquence native de l'écran
         * (souvent 60 Hz) : poser la largeur brute assez souvent SUFFISAIT à paraître fluide sans
         * aucune transition. Depuis le plafonnement du tick lourd à 15 Hz (2026-09-28, pour les
         * freezes iPhone/Safari), ce même forçage ne laisse plus que 15 "marches" par seconde
         * visibles à l'écran -- d'où l'effet de saccade. Retiré, comme la barre d'Énergie/Magie
         * (Beta 6.7, idle-energy-adventure-hp-v200.test.mjs) : on pose la largeur directement
         * depuis la valeur réellement connue, SANS interpolation inventée ici ; c'est uniquement la
         * transition CSS de .soreal-idle-bossbar-v7/.soreal-idle-playerbar-v15 (soreal-idle-ui.css)
         * qui fait le lissage visuel, exactement le même principe déjà éprouvé pour l'Énergie/Magie.
         */
        largeurBarreCombatIdleV121_(element,pct);
      }

      function texteCombatIdleV121_(
        element,
        texte,
        regen
      ){
        if(!element)return;

        const valeur=
          String(
            texte||''
          );

        /*
         * Chiffres de vie du duel FIXES (Norman, 2026-10-02 : « ils s'allongent ou rétrécissent suivant les virgules des PV, il faut qu'ils restent fixes »).
         * Dans la pastille, « ❤️ PV / PV MAX » est écrit en trois morceaux : les PV actuels occupent une case de largeur constante (alignés à droite,
         * assez large pour la valeur max + une décimale de regen), si bien que ni la pastille ni les chiffres ne bougent quand les PV changent de longueur.
         */
        const parent=element.parentElement;
        const m=parent&&parent.classList&&parent.classList.contains('soreal-idle-duel-hp-v41')
          ?/^(\S+)\s+(.+?)\s+\/\s+(.+)$/.exec(valeur)
          :null;
        if(m){
          let cur=element.querySelector('.soreal-idle-hp-cur-v1');
          let max=element.querySelector('.soreal-idle-hp-max-v1');
          let structureChangee=false;
          if(!cur||!max){
            element.textContent='';
            [['soreal-idle-hp-ic-v1',m[1]],['soreal-idle-hp-cur-v1',m[2]],['soreal-idle-hp-sep-v1',' / '],['soreal-idle-hp-max-v1',m[3]],['soreal-idle-hp-regen-v1','']].forEach(function(p){
              const span=document.createElement('span');
              span.className=p[0];
              span.textContent=p[1];
              element.appendChild(span);
            });
            cur=element.querySelector('.soreal-idle-hp-cur-v1');
            max=element.querySelector('.soreal-idle-hp-max-v1');
            structureChangee=true;
          }
          if(max.textContent!==m[3]){
            max.textContent=m[3];
            structureChangee=true;
          }
          if(cur.textContent!==m[2])cur.textContent=m[2];
          /* Largeur constante de la case : la valeur max (même format, deux décimales) + 1 caractère de marge (« 999,99 » sous un max « 1,00K »). */
          const largeurCase='calc('+(Math.max(m[3].length,6)+1)+'ch + .5em)';
          if(cur.style.width!==largeurCase)cur.style.width=largeurCase;
          /* Régénération par seconde : petit texte vert lumineux, tout à droite de la pastille (positionné en absolu : ne déplace jamais les chiffres). */
          const regenEl=element.querySelector('.soreal-idle-hp-regen-v1');
          const regenTexte=String(regen||'');
          if(regenEl&&regenEl.textContent!==regenTexte)regenEl.textContent=regenTexte;
          ajusterVieDuelIdleV1_(element,structureChangee);
          return;
        }

        const change=element.textContent!==valeur;
        if(change)element.textContent=valeur;
        ajusterVieDuelIdleV1_(element,change);
      }

      function ajusterVieDuelIdleV1_(element,change){
        try{
          const parent=element.parentElement;
          if(!parent||!parent.classList||!parent.classList.contains('soreal-idle-duel-hp-v41'))return;
          const largeur=String(parent.clientWidth);
          /* Les PV bougent plusieurs fois par seconde : on ne remesure (retrait de la taille, lecture de largeur, rétrécissement) que si la largeur de la carte ou le NOMBRE de caractères change, pas à chaque chiffre. */
          const cleFit=largeur+'|'+element.textContent.length;
          if(element.getAttribute('data-fit-cle')===cleFit)return;
          element.setAttribute('data-fit-cle',cleFit);
          element.setAttribute('data-fit-largeur',largeur);
          element.style.removeProperty('font-size');
          element.style.removeProperty('white-space');
          element.style.removeProperty('overflow-wrap');
          let taille=parseFloat(window.getComputedStyle(element).fontSize)||12;
          let essais=0;
          while(element.scrollWidth>element.clientWidth+0.5&&taille>7&&essais<30){
            taille-=0.5;
            essais+=1;
            element.style.setProperty('font-size',taille+'px','important');
          }
          /* Cas extrême (texte très long dans une carte très étroite) : le texte passe sur deux lignes plutôt que de sortir de la pastille. */
          if(element.scrollWidth>element.clientWidth+0.5){
            element.style.setProperty('white-space','normal','important');
            element.style.setProperty('overflow-wrap','anywhere','important');
          }
        }catch(e){}
      }

      /*
       * Dégâts NETS que le boss inflige au joueur par seconde (mêmes facteurs que le bloc de riposte du tick de combat : fureur, défense, bouclier magique, étourdissement,
       * régénération). Sert à savoir QUI tombe en premier : le serveur résout le combat en temps continu (les deux se frappent en même temps, le premier à 0 PV perd), le
       * client ne doit donc jamais annoncer une victoire que le serveur résoudrait en défaite (Norman, 2026-10-02 : « le boss recule »). À garder aligné sur le bloc de riposte.
       */
      function degatsNetsBossParSecondeIdleV1_(effetsMagie,maintenantTick){
        const attaqueBrute=Math.max(0,idleNombre_(REG.idleEtat.attaqueBoss))*(REG.idleFureurActiveV70?multiplicateurFureurLocaleIdleV70_():1);
        const defense=Math.max(0,idleNombre_(REG.idleEtat.defense));
        const bossEtourdi=maintenantTick<idleNombre_(effetsMagie.bossStunJusqua);
        const reduction=maintenantTick<idleNombre_(effetsMagie.bouclierJusqua)
          ?Math.max(0,Math.min(.95,idleNombre_(effetsMagie.bouclierPct)/100))
          :0;
        const recus=bossEtourdi?0:Math.max(0,Math.max(0,attaqueBrute-defense)*(1-reduction));
        return Math.max(0,recus-regenPvFightBossNguParSecondeV164_(defense));
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

      /*
       * Retour en Zone sûre expliqué (audit d'Aventure, Norman 2026-10-05 : « je gagne un combat et il me dit Zone sûre alors que je suis dans le ciel ») : le serveur dit POURQUOI il a ramené le joueur en Zone sûre (titan, K.O., zone refermée, défi,
       * Renaissance, K.O. pendant l'absence) ; la raison est écrite une fois dans le journal d'Aventure et en console. Au premier état reçu, on ne ressort pas un vieux retour.
       */
      let idleRetourSafeCleV1=null;

      function signalerRetourSafeIdleV1_(joueur){
        const a=joueur&&aventureMetaIdleV47_(joueur);
        const r=a&&a.retourSafe;
        if(!r)return;
        const at=Math.max(0,idleNombre_(r.at));
        /* Un retour enregistré (at > 0) se repère à son heure ; un repli de zone refermée (at = 0, recalculé à chaque réponse) à son texte. */
        const cle=(at>0?String(at):'repli')+'|'+String(r.raison||'')+'|'+String(r.detail||'');
        if(idleRetourSafeCleV1===null){idleRetourSafeCleV1=cle;return;}
        if(cle===idleRetourSafeCleV1)return;
        idleRetourSafeCleV1=cle;
        if(!(at>0||String(r.raison||'')==='zone_fermee'))return;
        if(String(a.selectedZone||'safe')!=='safe'&&String(r.raison||'')!=='zone_fermee')return;
        const texte=(String(a.selectedZone||'safe')==='safe'?'🛡️ Retour en Zone sûre : ':'↩️ Zone changée : ')+String(r.detail||r.raison||'raison inconnue');
        try{console.warn('[IDLE] retour en Zone sûre',r);}catch(_e){}
        try{ajouterLogAventureIdleV1_('system',texte);}catch(_e){}
      }

      /*
       * Norman (2026-10-17, signalement 🐞 : barre du boss 53, 49 … 1, 3, puis 100) : « en visuel le boss a repris toute sa vie, mais il était mort en vrai ». Le serveur avait tué le boss quelques dixièmes de seconde avant
       * le dernier coup local : adopter son état d'un coup remplaçait la barre presque vide par le boss suivant PLEIN, sans coup final ni « boss vaincu ». Maintenant la barre est ramenée à presque rien et le tick local
       * déroule la victoire (barre à 0, mort du boss, boss suivant) comme pour une victoire locale ; si le tick ne passe pas (page cachée…), l'état du serveur est adopté au bout de 2,5 s (branche suivante).
       * Renvoie true quand la synchro est traitée ici (état local conservé).
       */
      function coupFinalServeurIdleV1_(serveurConfirme){
        if(
          !serveurConfirme||
          REG.idleVictoireBossLocaleV49||
          !REG.idleEtat||
          !REG.idleEtat.combatBossActif||
          PAGE_ACTIVE!=='idle'||
          !document.getElementById('sorealIdleBossBarV7')||
          (idleCoupFinalServeurV1&&Date.now()-idleCoupFinalServeurV1>=2500)
        ){
          idleCoupFinalServeurV1=0;
          return false;
        }
        if(!idleCoupFinalServeurV1){
          idleCoupFinalServeurV1=Date.now();
          REG.idleEtat.bossPv=Math.min(idleNombre_(REG.idleEtat.bossPv),1e-9);
          setTimeout(function(){
            if(idleCoupFinalServeurV1&&!REG.idleVictoireBossLocaleV49&&REG.idleEtat&&REG.idleEtat.combatBossActif){
              REG.idleCombatArmeLocalV206=false;
              REG.idleEtat.combatBossActif=false;
              REG.idleCombatEnPauseApresDefaiteV1=false;
              synchroniserJeuIdleV7_(true);
            }
            idleCoupFinalServeurV1=0;
          },2600);
        }
        return true;
      }

      function appliquerSynchroCombatSansReflowIdleV116_(
        joueurServeur
      ){
        signalerRetourSafeIdleV1_(joueurServeur);
        if(REG.idlePrevisionBossV1.actif&&joueurServeur){
          const confirmee=idleEntier_(joueurServeur.bossVaincus)>=REG.idlePrevisionBossV1.vaincus;
          if(!confirmee&&Date.now()-REG.idlePrevisionBossV1.debut<=15000)return true;
          REG.idlePrevisionBossV1={actif:false,vaincus:0,debut:0};
          REG.idleVictoireBossLocaleV49=false;
          arreterSurveillanceVictoireBossIdleV1_();
          /* Confirmée : la suite compare le boss affiché (déjà le bon) au serveur ; non confirmée au bout de 15 s : le serveur fait foi. */
          if(!confirmee)return false;
        }
        /*
         * Réponse EN RETARD (Norman, 2026-10-03 : « j'ai tué un boss et il a de nouveau été affiché : retour arrière d'un boss »). Les synchros se chevauchent (surveillance de victoire toutes les
         * 0,4 s, battement, actions) : une réponse calculée AVANT la victoire peut arriver APRÈS celle qui l'a confirmée et remettait l'ancien boss. Un boss vaincu le reste jusqu'à la
         * Renaissance : une réponse qui compte MOINS de boss vaincus (à nombre de Renaissances égal) est périmée, on la laisse de côté.
         */
        if(joueurServeur&&REG.idleEtat&&!REG.idlePrevisionBossV1.actif&&idleEntier_(joueurServeur.bossVaincus)<idleEntier_(REG.idleEtat.bossVaincus)&&idleEntier_(joueurServeur.renaissance&&joueurServeur.renaissance.renaissances)===idleEntier_(REG.idleEtat.renaissance&&REG.idleEtat.renaissance.renaissances)){
          return true;
        }
        /*
         * Norman (2026-09-26) : « je tue un petit bout de peluche, ça met Boss vaincu et au bout de 7 secondes j'ai de nouveau le même boss ».
         * Cause (lue dans le code) : le client prédit la victoire un peu AVANT le serveur (qui calcule le combat à l'heure du serveur). Tant que le
         * serveur n'a pas fini de tuer le boss, sa réponse dit « combat encore actif » alors que le client n'est plus armé : la « garde fantôme » ci-dessous
         * ordonnait alors au serveur d'ARRÊTER le combat en lui recopiant les PV du boss du client (0) ; hors combat, un boss à 0 PV est restauré à son
         * maximum (invariant V184) : victoire perdue, même boss. Pendant une victoire prédite, on laisse donc le serveur terminer son combat ; la
         * surveillance de victoire relance la synchronisation jusqu'à la confirmation (ou 15 s).
         */
        if(
          joueurServeur &&
          joueurServeur.combatBossActif &&
          REG.idleVictoireBossLocaleV49
        ){
          return true;
        }

        if(
          joueurServeur &&
          joueurServeur.combatBossActif &&
          !REG.idleCombatArmeLocalV206
        ){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-60 */
          if(REG.idleEtat)REG.idleEtat.combatBossActif=false;

          if(
            !REG.idleCombatStopFantomeEnvoyeV206 &&
            REG.idleEtat &&
            SOREAL_SESSION
          ){
            REG.idleCombatStopFantomeEnvoyeV206=true;
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


        if(!REG.idleEtat||!joueurServeur)return false;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-61 */
        const aventureLocale=aventureMetaIdleV47_(REG.idleEtat);
        const fightLocal=aventureLocale&&aventureLocale.fight;

        if(fightLocal&&fightLocal.active){
          const aventureServeur=aventureMetaIdleV47_(joueurServeur)||aventureLocale;

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-62 */
          const adventureRestPvAvantSyncV1=REG.idleEtat&&REG.idleEtat.adventureRestPv;
          const basicTrainingAvantSyncV166=REG.idleEtat&&REG.idleEtat.basicTraining;

          REG.idleEtat=Object.assign({},joueurServeur);
          REG.idleEtat.basicTraining=
            fusionnerBasicTrainingPlusAvanceIdleV166_(
              basicTrainingAvantSyncV166,
              joueurServeur.basicTraining
            );
          REG.idleEtat.systemes=Object.assign({},joueurServeur.systemes);
          REG.idleEtat.systemes.adventure=Object.assign(
            {},
            aventureServeur,
            {fight:fightLocal}
          );
          if(adventureRestPvAvantSyncV1!=null)REG.idleEtat.adventureRestPv=adventureRestPvAvantSyncV1;

          REG.idleDernierTickLocalV40=Date.now();
          pousserEtatVersRuntimePartageIdleV1_();
          return true;
        }

        const bossSelectionLocaleV167=
          idleEntier_(REG.idleEtat.bossSelection);
        const bossSelectionServeurV167=
          idleEntier_(joueurServeur.bossSelection);
        const bossVaincusLocalV167=
          idleEntier_(REG.idleEtat.bossVaincus);
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
          REG.idleVictoireBossLocaleV49&&
          !serveurConfirmeVictoireBossV167
        ){
          return true;
        }

        /*
         * Le SERVEUR a tué le boss (il fait foi) alors que le client, lui, se croit encore en plein combat sans avoir fini le sien (Norman, 2026-10-02 : « quand je tue un boss je ne peux plus
         * faire Fight, je dois changer d'écran » ; reproduit en ligne : boss tué côté serveur, écran figé sur l'ancien boss avec Fight désactivé). Sa simulation locale peut retarder sur le
         * serveur (puissance qui monte pendant l'entraînement, ordre de départ arrivé après la prédiction…). Avant, ce cas tombait dans « combat local actif : on garde l'état local » et ne
         * se corrigeait que par un changement d'écran. On désarme le combat local et on adopte l'état du serveur.
         */
        if(coupFinalServeurIdleV1_(serveurConfirmeVictoireBossV167))return true;
        if(
          serveurConfirmeVictoireBossV167&&
          !REG.idleVictoireBossLocaleV49&&
          REG.idleEtat.combatBossActif
        ){
          REG.idleCombatArmeLocalV206=false;
          REG.idleEtat.combatBossActif=false;
          REG.idleCombatEnPauseApresDefaiteV1=false;
          return false;
        }

        const memeBossServeurV167=
          bossSelectionLocaleV167===
          bossSelectionServeurV167;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-64 */
        if(
          !REG.idleEtat.combatBossActif &&
          REG.idleCombatEnPauseApresDefaiteV1
        ){
          const localAvantRecupV175=REG.idleEtat;

          REG.idleEtat=
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

          REG.idleDernierTickLocalV40=Date.now();
          rafraichirEnergieEtBoutonsIdleV9_();
          pousserEtatVersRuntimePartageIdleV1_();
          return true;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-66 */
        if(
          !REG.idleEtat.combatBossActif &&
          REG.idleCombatEnPauseApresDefaiteV1 &&
          joueurServeur.combatBossActif &&
          memeBossServeurV167
        ){
          return true;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-67 */
        if(
          !REG.idleEtat.combatBossActif &&
          !joueurServeur.combatBossActif &&
          memeBossServeurV167
        ){
          /* Au repos : la vie ne redescend pas sous ce que le serveur a déjà régénéré (les PV max montent avec les Augmentations, la régénération du serveur suit : Norman, 2026-10-03). */
          const pvJoueurLocalReposV174=
            Math.max(0,idleNombre_(REG.idleEtat.pvJoueur),Math.min(idleNombre_(joueurServeur.pvJoueur),Math.max(idleNombre_(REG.idleEtat.pvJoueurMax),idleNombre_(joueurServeur.pvJoueurMax))));
          const bossPvLocalReposV174=
            Math.max(0,idleNombre_(REG.idleEtat.bossPv));
          const basicTrainingReposV174=
            REG.idleEtat.basicTraining;

          REG.idleEtat=
            Object.assign(
              {},
              joueurServeur,
              {
                pvJoueur:pvJoueurLocalReposV174,
                bossPv:bossPvLocalReposV174,
                pvJoueurMax:Math.max(
                  idleNombre_(REG.idleEtat.pvJoueurMax),
                  idleNombre_(joueurServeur.pvJoueurMax)
                ),
                bossPvMax:Math.max(
                  idleNombre_(REG.idleEtat.bossPvMax),
                  idleNombre_(joueurServeur.bossPvMax)
                ),
                basicTraining:
                  fusionnerBasicTrainingPlusAvanceIdleV166_(
                    basicTrainingReposV174,
                    joueurServeur.basicTraining
                  ),
                force:Math.max(
                  idleNombre_(REG.idleEtat.force),
                  idleNombre_(joueurServeur.force)
                ),
                endurance:Math.max(
                  idleNombre_(REG.idleEtat.endurance),
                  idleNombre_(joueurServeur.endurance)
                ),
                puissance:Math.max(
                  idleNombre_(REG.idleEtat.puissance),
                  idleNombre_(joueurServeur.puissance)
                ),
                defense:Math.max(
                  idleNombre_(REG.idleEtat.defense),
                  idleNombre_(joueurServeur.defense)
                )
              }
            );

          REG.idleDernierTickLocalV40=Date.now();
          rafraichirEnergieEtBoutonsIdleV9_();
          pousserEtatVersRuntimePartageIdleV1_();
          return true;
        }

        if(!REG.idleEtat.combatBossActif){
          return false;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-68 */
        if(
          !joueurServeur.combatBossActif ||
          !memeBossServeurV167
        ){
          if(
            !REG.idleVictoireBossLocaleV49 &&
            !REG.idleCombatEnPauseApresDefaiteV1
          ){
            return true;
          }
          return false;
        }

        const bossLocal=
          idleNombre_(REG.idleEtat.bossPv);

        const joueurLocal=
          idleNombre_(REG.idleEtat.pvJoueur);

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
              REG.idleEtat.bossPvMax
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
              REG.idleEtat.pvJoueurMax
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
              REG.idleEtat.basicTraining,
              joueurServeur.basicTraining
            ),
          force:
            Math.max(
              idleNombre_(REG.idleEtat.force),
              idleNombre_(joueurServeur.force)
            ),
          endurance:
            Math.max(
              idleNombre_(REG.idleEtat.endurance),
              idleNombre_(joueurServeur.endurance)
            ),
          puissance:
            Math.max(
              idleNombre_(REG.idleEtat.puissance),
              idleNombre_(joueurServeur.puissance)
            ),
          defense:
            Math.max(
              idleNombre_(REG.idleEtat.defense),
              idleNombre_(joueurServeur.defense)
            )
        };

        REG.idleEtat=
          Object.assign(
            {},
            joueurServeur,
            conserve
          );

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-72 */
        REG.idleDernierTickLocalV40=
          Date.now();

        initialiserCoupsCombatIdleV116_();
        rafraichirEnergieEtBoutonsIdleV9_();
        pousserEtatVersRuntimePartageIdleV1_();

        return true;
      }

      function snapshotCombatFightBossIdleV173_(){
        if(!REG.idleEtat)return null;
        return {
          pvJoueur:Math.max(0,idleNombre_(REG.idleEtat.pvJoueur)),
          bossPv:Math.max(0,idleNombre_(REG.idleEtat.bossPv)),
          bossSelection:idleEntier_(REG.idleEtat.bossSelection)
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

      const CLE_AUTO_AVENTURE_IDLE_V30=
        'sorealIdleAutoAventureV30';

      let idleAutoTimerV30=null;

      let idleAutoCountdownTimerV62=null;

      let idleAutoCountdownFinV62=0;

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

          REG.idleAutoAventureV30=
            Boolean(
              obj&&obj.actif
            );

          REG.idleAutoZoneV30=
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
                REG.idleAutoAventureV30,
              zone:
                REG.idleAutoZoneV30
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
        REG.idleAutoAventureV30=false;

        annulerTimerCombatAutoIdleV30_();
        sauverCombatAutoIdleV30_();

        if(REG.idleEtat){
          REG.idleEtat.autoAventure={
            actif:false,
            zoneId:REG.idleAutoZoneV30
          };
        }

        if(SOREAL_SESSION){
          ajouterActionRapideIdleV60_(
            'autoAdventure',
            {
              actif:false,
              zoneId:REG.idleAutoZoneV30
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
          REG.idleEtat
        ){
          conserverPositionIdleV24_(
            function(){
              rendreIdleEtat_({
                ok:true,
                joueur:REG.idleEtat
              });
            }
          );
        }
      }

      function peutRelancerCombatAutoIdleV30_(){
        if(
          !REG.idleAutoAventureV30 ||
          !combatAutoDebloqueIdleV30_(
            REG.idleEtat
          ) ||
          REG.idleMenuActifV28!=='aventure' ||
          REG.idleAventureEnCoursV17 ||
          REG.idleAutoZoneV30<=0
        ){
          return false;
        }

        const zone=
          zoneAventureLocaleIdleV30_(
            REG.idleAutoZoneV30
          );

        if(
          !zone ||
          !zone.debloquee
        ){
          return false;
        }

        return Boolean(zone&&zone.debloquee&&!REG.idleAventureEnCoursV17);
      }

      function programmerCombatAutoIdleV30_(
        delai
      ){
        annulerTimerCombatAutoIdleV30_();

        if(
          !REG.idleAutoAventureV30
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
                    REG.idleAutoZoneV30
                  );


                return;
              }

              combattreAventureIdleV17_(
                REG.idleAutoZoneV30
              );
            },
            attente
          );
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-130 */
      function gererTutorielPremierBossIdleV1_(j){
        if(!j)return;
        if(!(idleEntier_(j.bossVaincus)>=1))return;

        demarrerTutorielPagesIdleV1_(
          REG.TUTORIEL_PREMIER_BOSS_PAGES_V1,
          'soreal_idle_tutoriel_premier_boss_v1_'+generationJoueurIdleV75_(j)
        );
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-142 */
      let idleCombatLogAutoScrollV70_=true;

      let idleCombatLogScrollMemoV70_=0;

      let idleBossSpecialNextV70={};

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
          REG.idleParalysieJusquaV70=
            Math.max(
              REG.idleParalysieJusquaV70,
              fin
            );
          return;
        }

        if(normalise==='bouclier'){
          return;
        }

        REG.idleEffetsVisuelsJoueurV112[normalise]=
          Math.max(
            idleNombre_(
              REG.idleEffetsVisuelsJoueurV112[normalise]
            ),
            fin
          );
      }

      function reinitialiserEffetsVisuelsJoueurIdleV112_(){
        Object.keys(
          REG.idleEffetsVisuelsJoueurV112
        ).forEach(function(type){
          REG.idleEffetsVisuelsJoueurV112[type]=0;
        });

        REG.idleEffetsSignatureV112='';

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

      function formatNombreCombatIdleV100_(valeur){
        const api=window.__SOREAL_IDLE_NUMBER_FORMAT_V1__;
        return api&&typeof api.combat==='function'
          ?api.combat(valeur)
          :String(Math.round(Math.max(0,idleNombre_(valeur))));
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
        REG.idleCombatLogV70.push({
          type:
            String(type||'system'),
          texte:
            String(texte||''),
          heure:
            tempsLogIdleV70_()
        });

        if(REG.idleCombatLogV70.length>160){
          REG.idleCombatLogV70.splice(
            0,
            REG.idleCombatLogV70.length-160
          );
        }

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
          REG.idleCombatLogV70.length
            ?REG.idleCombatLogV70.map(
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
          return '⛓️ Sceau · -'+
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

      function estBaliseVoixIdleV1_(contenu){
        const tts=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
        return Boolean(tts&&typeof tts.resoudreVoixBalise==='function'&&tts.resoudreVoixBalise(contenu));
      }

      function separerNotesHistoireBossIdleV1_(histoire){
        const notes=[];
        let narration=String(histoire||'').trim();
        for(;;){
          const infoMatch=narration.match(/^\(([^\n]+)\)[ \t]*(?:\n|$)\s*/);
          if(!infoMatch||estBaliseVoixIdleV1_(infoMatch[1]))break;
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
          /* Boss sans chronique : l'administrateur peut quand même lui en écrire une (jamais rien pour un joueur). */
          const Tadmin=window.__SOREAL_IDLE_TEXTES_V1__;
          return Tadmin&&Tadmin.boutonBossHtml&&j&&j.bossId
            ?'<div style="margin:8px 0">'+Tadmin.boutonBossHtml(j.bossId)+'</div>'
            :'';
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

        /*
         * data-soreal-chronique-boss-id (Norman, 2026-09-27) : identifiant STABLE du boss dont dépend la lecture automatique une seule fois
         * (modules/tutorial-tts-v202.js, panneauChroniqueBoss_). j.bossId (même valeur que bossCatalogue[].numero) est utilisé plutôt que le
         * nom pour éviter toute ambiguïté ; ce panneau reste rendu en continu tant que l'écran Boss est affiché, contrairement aux popups de
         * tutoriel qui ne sont créés qu'une fois.
         */
        /* Chronique avec balises de voix : le panneau porte le texte à lire (nom + récit brut), sinon la lecture se ferait sur le texte affiché, sans voix. */
        const ttsChronique=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
        /* Texte et nom PARLÉS fixés par l'administrateur : la voix lit ceux-là, quoi que dise le texte affiché (Norman, 2026-10-11). */
        const histoireParlee=String(j&&j.bossHistoireParlee||'').trim();
        const nomParle=String(j&&j.bossNomParle||'').trim();
        const attrLecture=(ttsChronique&&typeof ttsChronique.composerChronique==='function'&&(histoireParlee||nomParle||attrHistoireVoixIdleV1_(histoire)))
          ?' data-soreal-tts-say="'+idleHtml_(ttsChronique.composerChronique(nomParle||nomBoss,histoireParlee||histoire))+'"'
          :'';
        return `
          <div id="sorealIdleBossChroniqueV206" class="soreal-idle-boss-lore-v142${window.__chroniqueOuverteIdleV1?' ouverte':''}" role="button" tabindex="0" aria-label="Chronique du boss" data-soreal-chronique-boss-id="${idleEntier_(j&&j.bossId||0)}"${attrLecture}>
            <button type="button" class="soreal-idle-lore-fermer-v1" aria-label="Fermer" data-soreal-tts-ignore>✕</button>
            ${mainChroniqueIdleV1_()}
            <div class="soreal-idle-boss-lore-title-v168" data-soreal-tts-ignore>Chronique du boss</div>
            <div class="soreal-idle-boss-lore-name-v184" data-soreal-tts-pause="1100">${idleHtml_(nomBoss)}</div>
            <div class="soreal-idle-boss-lore-ornament-v184" data-soreal-tts-ignore>✦ ❦ ✦</div>
            ${notesDeblocage.map(function(note){
              return '<div class="soreal-idle-boss-lore-info-v198" data-soreal-tts-pause="700">'+idleHtml_(note)+'</div>';
            }).join('')}
            ${narration
              ?'<div class="soreal-idle-boss-lore-histoire-v142" data-sans-traduction>'+idleHtml_(sansBaliseVoixIdleV1_(narration))+'</div>'
              :''}
            ${boutonLectureChroniqueIdleV1_()}
            ${window.__SOREAL_IDLE_TEXTES_V1__?window.__SOREAL_IDLE_TEXTES_V1__.boutonBossHtml(j&&j.bossId):''}
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
        if(!REG.idleEtat)return;

        const boss=
          String(
            REG.idleEtat.bossActuel||''
          );

        if(
          !forceReset &&
          REG.idleCombatLogBossV70===boss
        ){
          return;
        }

        REG.idleCombatLogBossV70=boss;
        idleBossSpecialNextV70={};
        REG.idleParalysieJusquaV70=0;
        REG.idleBouclierJusquaV70=0;
        REG.idleBouclierReductionV70=0;
        REG.idleFureurActiveV70=false;

        reinitialiserEffetsVisuelsJoueurIdleV112_();

        const now=
          Date.now();

        const caps=
          Array.isArray(
            REG.idleEtat.bossCapacites
          )
            ?REG.idleEtat.bossCapacites
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

      function traiterCapacitesBossLocalesIdleV70_(
        maintenant
      ){
        if(
          !REG.idleEtat ||
          !REG.idleEtat.combatBossActif
        ){
          return;
        }

        preparerCapacitesBossIdleV70_(
          false
        );

        const caps=
          Array.isArray(
            REG.idleEtat.bossCapacites
          )
            ?REG.idleEtat.bossCapacites
            :[];

        const pvMax=
          Math.max(
            1,
            idleNombre_(
              REG.idleEtat.bossPvMax
            )
          );

        const pct=
          idleNombre_(
            REG.idleEtat.bossPv
          )/
          pvMax*
          100;

        if(
          pct<=30 &&
          !REG.idleFureurActiveV70 &&
          caps.some(
            function(c){
              return String(
                c.type||''
              ).toLowerCase()==='fureur';
            }
          )
        ){
          REG.idleFureurActiveV70=true;

          ajouterLogCombatIdleV70_(
            'skill',
            '🔥 '+
            String(
              REG.idleEtat.bossActuel||'Boss'
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
                  REG.idleEtat.bossPv
                );

              REG.idleEtat.bossPv=
                Math.min(
                  pvMax,
                  avant+
                  soin
                );

              const reel=
                Math.max(
                  0,
                  REG.idleEtat.bossPv-
                  avant
                );

              if(reel>0){
                ajouterLogCombatIdleV70_(
                  'skill',
                  '💚 '+
                  String(
                    REG.idleEtat.bossActuel||'Boss'
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
              REG.idleParalysieJusquaV70=
                Math.max(
                  REG.idleParalysieJusquaV70,
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
                REG.idleParalysieJusquaV70
              );

              ajouterLogCombatIdleV70_(
                'skill',
                '⚡ '+
                String(
                  REG.idleEtat.bossActuel||'Boss'
                )+
                ' paralyse '+
                String(
                  REG.idleEtat.nom||'le joueur'
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
                REG.idleParalysieJusquaV70=
                  Math.max(
                    REG.idleParalysieJusquaV70,
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
                  REG.idleEtat.bossActuel||'Boss'
                )+
                ' '+
                nomsEffetsV112[effetJoueurV112]+
                ' '+
                String(
                  REG.idleEtat.nom||'le joueur'
                )+
                '.'
              );
            }

            if(type==='bouclier'){
              REG.idleBouclierJusquaV70=
                Math.max(
                  REG.idleBouclierJusquaV70,
                  maintenant+
                  Math.max(
                    0,
                    idleNombre_(
                      cap.duree
                    )
                  )*
                  1000
                );

              REG.idleBouclierReductionV70=
                Math.max(
                  REG.idleBouclierReductionV70,
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
                  REG.idleEtat.bossActuel||'Boss'
                )+
                ' active un bouclier : -'+
                REG.idleBouclierReductionV70+
                '% dégâts.'
              );
            }
          }
        );

        if(
          REG.idleBouclierJusquaV70>0 &&
          maintenant>=
          REG.idleBouclierJusquaV70
        ){
          REG.idleBouclierJusquaV70=0;
          REG.idleBouclierReductionV70=0;
        }
      }

  Object.assign(REG,{
    initialiserCoupsCombatIdleV116_:initialiserCoupsCombatIdleV116_,
    appliquerAugmentsSurCombatIdleV1_:appliquerAugmentsSurCombatIdleV1_,
    appliquerTrajectoireStatsIdleV1_:appliquerTrajectoireStatsIdleV1_,
    actualiserCooldownBossIdleV100_:actualiserCooldownBossIdleV100_,
    rafraichirCommandesFightBossIdleV167_:rafraichirCommandesFightBossIdleV167_,
    transitionMortBossIdleV61_:transitionMortBossIdleV61_,
    surveillerConfirmationVictoireBossIdleV1_:surveillerConfirmationVictoireBossIdleV1_,
    appliquerBossSuivantLocalIdleV1_:appliquerBossSuivantLocalIdleV1_,
    largeurBarreCombatIdleV121_:largeurBarreCombatIdleV121_,
    actualiserAmbianceCombatIdleV1_:actualiserAmbianceCombatIdleV1_,
    largeurBarreVieCombatIdleV163_:largeurBarreVieCombatIdleV163_,
    texteCombatIdleV121_:texteCombatIdleV121_,
    ajusterVieDuelIdleV1_:ajusterVieDuelIdleV1_,
    degatsNetsBossParSecondeIdleV1_:degatsNetsBossParSecondeIdleV1_,
    regenPvFightBossNguParSecondeV164_:regenPvFightBossNguParSecondeV164_,
    appliquerSynchroCombatSansReflowIdleV116_:appliquerSynchroCombatSansReflowIdleV116_,
    snapshotCombatFightBossIdleV173_:snapshotCombatFightBossIdleV173_,
    normaliserCommandeCombatIdleV170_:normaliserCommandeCombatIdleV170_,
    chargerCombatAutoIdleV30_:chargerCombatAutoIdleV30_,
    sauverCombatAutoIdleV30_:sauverCombatAutoIdleV30_,
    annulerTimerCombatAutoIdleV30_:annulerTimerCombatAutoIdleV30_,
    arreterCombatAutoIdleV30_:arreterCombatAutoIdleV30_,
    peutRelancerCombatAutoIdleV30_:peutRelancerCombatAutoIdleV30_,
    programmerCombatAutoIdleV30_:programmerCombatAutoIdleV30_,
    gererTutorielPremierBossIdleV1_:gererTutorielPremierBossIdleV1_,
    formatNombreCombatIdleV100_:formatNombreCombatIdleV100_,
    ajouterLogCombatIdleV70_:ajouterLogCombatIdleV70_,
    journalCombatEstEnBasV70_:journalCombatEstEnBasV70_,
    restaurerScrollJournalCombatIdleV70_:restaurerScrollJournalCombatIdleV70_,
    labelCapaciteBossIdleV70_:labelCapaciteBossIdleV70_,
    histoireBossMarkupIdleV142_:histoireBossMarkupIdleV142_,
    capacitesBossMarkupIdleV70_:capacitesBossMarkupIdleV70_,
    preparerCapacitesBossIdleV70_:preparerCapacitesBossIdleV70_,
    traiterCapacitesBossLocalesIdleV70_:traiterCapacitesBossLocalesIdleV70_
  });
})();
