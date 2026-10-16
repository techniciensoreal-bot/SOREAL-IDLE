/*
 * SOREAL IDLE — Fight Boss et Titans (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_combat_v1)return;
  REG.__chargé_ui_combat_v1=true;

  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function idleNombre_(){return REG.idleNombre_.apply(null,arguments);}
  function fightEnAttenteServeurIdleV1_(){return REG.fightEnAttenteServeurIdleV1_.apply(null,arguments);}
  function rendreIdleEtat_(){return REG.rendreIdleEtat_.apply(null,arguments);}
  function synchroniserJeuIdleV7_(){return REG.synchroniserJeuIdleV7_.apply(null,arguments);}
  function ajusterVieDuelIdleV1_(){return REG.ajusterVieDuelIdleV1_.apply(null,arguments);}
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
  function formatGrandNombreIdleV70_(){return REG.formatGrandNombreIdleV70_.apply(null,arguments);}
  function construireCarteBossIdleV91_(){return REG.construireCarteBossIdleV91_.apply(null,arguments);}
  function messageFlottantIdleV32_(){return REG.messageFlottantIdleV32_.apply(null,arguments);}
  function afficherProchainePopupIdleV75_(){return REG.afficherProchainePopupIdleV75_.apply(null,arguments);}
  function jouerEffetAudioIdleV199_(){return REG.jouerEffetAudioIdleV199_.apply(null,arguments);}
  function planifierRenduOptimisteIdleV60_(){return REG.planifierRenduOptimisteIdleV60_.apply(null,arguments);}
  function attrHistoireVoixIdleV1_(){return REG.attrHistoireVoixIdleV1_.apply(null,arguments);}
  function sansBaliseVoixIdleV1_(){return REG.sansBaliseVoixIdleV1_.apply(null,arguments);}
  function texteVoixSansTexteIdleV1_(){return REG.texteVoixSansTexteIdleV1_.apply(null,arguments);}
  function selectionnerZoneAdventureIdleV47_(){return REG.selectionnerZoneAdventureIdleV47_.apply(null,arguments);}
  function rafraichirCommandesAdventureIdleV3_(){return REG.rafraichirCommandesAdventureIdleV3_.apply(null,arguments);}
  function resetHorlogesFightAdventureIdleV2_(){return REG.resetHorlogesFightAdventureIdleV2_.apply(null,arguments);}
  function envoyerResolutionAdventurePendingV2_(){return REG.envoyerResolutionAdventurePendingV2_.apply(null,arguments);}
  function ecouleRegenReposAdventureIdleV166_(){return REG.ecouleRegenReposAdventureIdleV166_.apply(null,arguments);}
  function regenReposAdventureIdleV3_(){return REG.regenReposAdventureIdleV3_.apply(null,arguments);}
  function restPvInitialIdleV1_(){return REG.restPvInitialIdleV1_.apply(null,arguments);}
  function memoriserRestPvIdleV1_(){return REG.memoriserRestPvIdleV1_.apply(null,arguments);}
  function programmerRespawnAdventureIdleV165_(){return REG.programmerRespawnAdventureIdleV165_.apply(null,arguments);}
  function annulerRespawnAdventureIdleV165_(){return REG.annulerRespawnAdventureIdleV165_.apply(null,arguments);}
  function reinitialiserHorlogeRegenReposAdventureIdleV166_(){return REG.reinitialiserHorlogeRegenReposAdventureIdleV166_.apply(null,arguments);}
  function terminerCombatAdventureLocalV2_(){return REG.terminerCombatAdventureLocalV2_.apply(null,arguments);}
  function identiteFightAdventureIdleV2_(){return REG.identiteFightAdventureIdleV2_.apply(null,arguments);}
  function intervalleIdleAttackAdventureIdleV4_(){return REG.intervalleIdleAttackAdventureIdleV4_.apply(null,arguments);}
  function intervalleAttaqueEnnemiAdventureIdleV2_(){return REG.intervalleAttaqueEnnemiAdventureIdleV2_.apply(null,arguments);}
  function cooldownDureeAdventureIdleV4_(){return REG.cooldownDureeAdventureIdleV4_.apply(null,arguments);}
  function titanJoueurParalyseIdleV1_(){return REG.titanJoueurParalyseIdleV1_.apply(null,arguments);}
  function appliquerRegenCombatAdventureIdleV2_(){return REG.appliquerRegenCombatAdventureIdleV2_.apply(null,arguments);}
  function degatsJoueurAdventureIdleV2_(){return REG.degatsJoueurAdventureIdleV2_.apply(null,arguments);}
  function multiplicateurPowerManuelAdventureIdleV3_(){return REG.multiplicateurPowerManuelAdventureIdleV3_.apply(null,arguments);}
  function multiplicateurIdleAttackAdventureIdleV2_(){return REG.multiplicateurIdleAttackAdventureIdleV2_.apply(null,arguments);}
  function titanMultDegatsJoueurIdleV1_(){return REG.titanMultDegatsJoueurIdleV1_.apply(null,arguments);}
  function facteurAleatoireDegatsAdventureIdleV2_(){return REG.facteurAleatoireDegatsAdventureIdleV2_.apply(null,arguments);}
  function impactMonstreAdventureIdleV1_(){return REG.impactMonstreAdventureIdleV1_.apply(null,arguments);}
  function fxIdleV1_(){return REG.fxIdleV1_.apply(null,arguments);}
  function libelleEnnemiAdventureIdleV1_(){return REG.libelleEnnemiAdventureIdleV1_.apply(null,arguments);}
  function multiplicateurToughnessManuelAdventureIdleV3_(){return REG.multiplicateurToughnessManuelAdventureIdleV3_.apply(null,arguments);}
  function degatsEnnemiAdventureIdleV2_(){return REG.degatsEnnemiAdventureIdleV2_.apply(null,arguments);}
  function definitionCompetenceAdventureIdleV3_(){return REG.definitionCompetenceAdventureIdleV3_.apply(null,arguments);}
  function beastModeActifAdventureIdleV4_(){return REG.beastModeActifAdventureIdleV4_.apply(null,arguments);}
  function attaqueManuelleAdventureIdleV3_(){return REG.attaqueManuelleAdventureIdleV3_.apply(null,arguments);}
  function urlJoueurR2IdleV1_(){return REG.urlJoueurR2IdleV1_.apply(null,arguments);}

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-7 */
      const IDLE_HIT_JOUEUR_MS_V116=850;

      const IDLE_HIT_BOSS_MS_V116=1000;

      let idleProchainCoupJoueurV116=0;

      let idleProchainCoupBossV116=0;

      let idleCombatIdentiteV116='';

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-8 */
      let idleCompensationImpactJoueurV117=null;

      let idleCompensationImpactBossV117=null;

      function initialiserCoupsCombatIdleV116_(){
        if(!REG.idleEtat||!REG.idleEtat.combatBossActif){
          idleCombatIdentiteV116='';
          idleProchainCoupJoueurV116=0;
          idleProchainCoupBossV116=0;
          return;
        }

        const identite=
          String(idleEntier_(REG.idleEtat.bossSelection||1))+
          ':'+
          String(REG.idleEtat.bossActuel||'');

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
          /* Hors de la page Augmentations, aucun niveau n'est rejoué : on ne touche à rien (sinon la vie max retombait au multiplicateur de départ en changeant de menu). */
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
          const atk=idleNombre_(cp.multiplicateurAttaqueTotal),def=idleNombre_(cp.multiplicateurDefenseTotal);
          if(atk>0)cp.multiplicateurAttaqueTotal=atk*ratio/applique;
          if(def>0)cp.multiplicateurDefenseTotal=def*ratio/applique;
          visual.appliedRatio=ratio;
          const texteMult=document.getElementById('sorealIdleAugMultV1');
          if(texteMult&&typeof window.__formatMultiplicateurIdleV1__==='function')texteMult.textContent=window.__formatMultiplicateurIdleV1__(multMaintenant);
        }catch(e){}
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
            !idleCombatStopFantomeEnvoyeV206 &&
            REG.idleEtat &&
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

      function ouvrirCarteBossIdleV91_(
        numero
      ){
        if(!REG.idleEtat){
          return;
        }

        const n=
          idleEntier_(
            numero
          );

        const boss=
          Array.isArray(
            REG.idleEtat.bossCatalogue
          )
            ?REG.idleEtat.bossCatalogue.find(
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
          REG.idleEtat.combatBossActif
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

      let idleCombatStopFantomeEnvoyeV206=false;

      /* Fight retenu pendant une victoire prédite : démarre dès que le drapeau tombe (confirmation du serveur, repli après 15 s ou rendu complet), au plus 20 s. */
      let idleFightRetenuV1=null;

      function retenirFightApresConfirmationIdleV1_(){
        if(idleFightRetenuV1)return;
        messageFlottantIdleV32_('⏳ Victoire en cours de confirmation : le combat démarre dans un instant.');
        const debut=Date.now();
        idleFightRetenuV1=setInterval(function(){
          const trop=Date.now()-debut>20000;
          if(REG.idleVictoireBossLocaleV49&&!trop)return;
          clearInterval(idleFightRetenuV1);
          idleFightRetenuV1=null;
          if(!trop&&PAGE_ACTIVE==='idle'&&REG.idleEtat&&!REG.idleEtat.combatBossActif)definirCombatBossIdleV39_(true);
        },250);
      }

      function definirCombatBossIdleV39_(
        actif
      ){
        if(
          !REG.idleEtat ||
          !SOREAL_SESSION
        ){
          return;
        }

        /*
         * Fight cliqué pendant que la victoire n'est pas encore confirmée par le serveur (Norman, 2026-10-02 : « quand je tue un boss, je ne peux plus faire Fight ; je dois
         * changer d'écran »). Le boss suivant est déjà affiché mais le serveur, plus lent (1 à 4 s par appel), n'a pas encore enregistré le kill : lui envoyer un combat
         * maintenant serait ignoré (snapshot « obsolète »). Le clic n'est plus perdu en silence : il est RETENU et le combat démarre dès que la victoire est confirmée.
         */
        if(
          actif&&
          REG.idleVictoireBossLocaleV49&&
          !REG.idleEtat.combatBossActif&&
          idleNombre_(REG.idleEtat.pvJoueur)>0
        ){
          retenirFightApresConfirmationIdleV1_();
          return;
        }

        if(
          actif&&(
            REG.idleEtat.combatBossActif||
            REG.idleVictoireBossLocaleV49||
            idleNombre_(REG.idleEtat.pvJoueur)<=0
          )
        ){
          return;
        }

        /* Un ordre de combat précédent n'est pas encore validé par le serveur : pas de nouveau Fight (raccourci clavier compris). */
        if(actif&&!REG.idleEtat.combatBossActif&&(REG.idleCombatLotEnVolV1||REG.idleFastPendingV60.combat!==null))return;

        if(
          actif &&
          (
            REG.idlePopupBloqueCombatV102 ||
            REG.idlePopupActifV75 ||
            REG.idlePopupQueueV75.length
          )
        ){
          afficherProchainePopupIdleV75_();
          return;
        }

        if(actif){
          REG.idleCombatArmeLocalV206=true;
          idleCombatStopFantomeEnvoyeV206=false;
          jouerEffetAudioIdleV199_('fight');
        }else{
          REG.idleCombatArmeLocalV206=false;
        }

        REG.idleEtat.combatBossActif=
          Boolean(
            actif
          );

        if(actif){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-160 */
          REG.idleCombatEnPauseApresDefaiteV1=false;

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-161 */
          REG.idleCombatLogDernierResumeV70=
            Date.now();

          REG.idleCombatLogDegatsJoueurV70=0;
          REG.idleCombatLogDegatsBossV70=0;
          REG.idleCombatLogDegatsBrutsV100=0;
          REG.idleCombatLogBloquesV70=0;

          preparerCapacitesBossIdleV70_(
            true
          );

          ajouterLogCombatIdleV70_(
            'system',
            '▶ Combat lancé contre '+
            String(
              REG.idleEtat.bossActuel||'le boss'
            )+
            '.'
          );
        }

        if(!actif){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-162 */
          REG.idleCombatEnPauseApresDefaiteV1=false;

          /* Plus de popup quand on fuit (Norman, 2026-10-10) : le son de fuite et l'entrée du journal de combat suffisent. */

          ajouterLogCombatIdleV70_(
            'system',
            '🏃 Fuite : combat interrompu.'
          );
        }

        REG.idleVictoireBossLocaleV49=false;

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
          REG.idleNukeEnCoursV1 ||
          !REG.idleEtat ||
          !SOREAL_SESSION ||
          REG.idleEtat.combatBossActif ||
          REG.idleEtat.bossBloqueRenaissance
        ){
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-166 */
        REG.idleFastPendingV60.combat=null;
        REG.idleCombatArmeLocalV206=false;
        REG.idleEtat.combatBossActif=false;
        jouerEffetAudioIdleV199_('nuke');
        idleCombatIdentiteV116='';
        idleProchainCoupJoueurV116=0;
        idleProchainCoupBossV116=0;

        REG.idleNukeEnCoursV1=true;

        google.script.run
          .withSuccessHandler(function(res){
            REG.idleNukeEnCoursV1=false;

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
                REG.idleFastPendingV60.combat=null;
                idleCombatIdentiteV116='';
                idleProchainCoupJoueurV116=0;
                idleProchainCoupBossV116=0;

                REG.idleEtat=
                  res.joueur;

                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-167 */
                REG.idleEtat.combatBossActif=false;

                rendreIdleEtat_({
                  ok:true,
                  joueur:REG.idleEtat
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
            REG.idleNukeEnCoursV1=false;

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

      function autoNukeDueIdleV1_(runDebuteA,dernier,maintenant){
        const debut=Number(runDebuteA)||0;
        if(debut<=0)return false;
        const depuis=(maintenant-debut)/1000;
        if(depuis<10)return false;
        return !dernier||maintenant-dernier>=60000;
      }

      function selectionnerBossIdleV37_(
        numero
      ){
        if(
          !SOREAL_SESSION ||
          !REG.idleEtat
        ){
          return;
        }

        const n=
          idleEntier_(
            numero
          );

        REG.idleCombatArmeLocalV206=false;
        REG.idleEtat.bossSelection=n;

        const b=
          Array.isArray(
            REG.idleEtat.bossCatalogue
          )
            ?REG.idleEtat.bossCatalogue.find(
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
          REG.idleEtat.bossActuel=b.nom;
          REG.idleEtat.bossPv=b.pv;
          REG.idleEtat.bossPvMax=b.pv;
          REG.idleEtat.attaqueBoss=b.attaque;

          REG.idleEtat.pvJoueur=
            REG.idleEtat.pvJoueurMax;

          REG.idleEtat.bossCatalogue.forEach(
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

      /*
       * Fiche d'un boss (clic sur sa carte de Collection) : image, statistiques et chronique. Les données sont celles de l'entrée du Bestiaire,
       * que le serveur n'envoie que pour un boss déjà découvert (règle anti-spoil). La chronique garde les attributs de lecture vocale
       * (data-soreal-tts-chronique / bouton data-soreal-tts-target), donc les voix pré-générées de la page s'appliquent telles quelles.
       */
      function fermerBossCollectionIdleV1_(){
        const m=document.getElementById('sorealIdleBossCollectionModalV1');
        if(m)m.remove();
      }

      function ouvrirBossCollectionIdleV1_(numero){
        const n=idleEntier_(numero);
        const entrees=REG.idleEtat&&REG.idleEtat.bestiaire&&Array.isArray(REG.idleEtat.bestiaire.entrees)?REG.idleEtat.bestiaire.entrees:[];
        const e=entrees.find(function(x){return x&&x.source==='boss'&&x.decouvert&&idleEntier_(x.numero)===n;});
        if(!e)return;
        fermerBossCollectionIdleV1_();
        const stats=[
          idleNombre_(e.pv)>0?'<div><span>❤️ Points de vie</span><b>'+formatGrandNombreIdleV70_(e.pv)+'</b></div>':'',
          idleNombre_(e.attaque)>0?'<div><span>⚔️ Attaque</span><b>'+formatGrandNombreIdleV70_(e.attaque)+'</b></div>':'',
          idleNombre_(e.defense)>0?'<div><span>🛡️ Défense</span><b>'+formatGrandNombreIdleV70_(e.defense)+'</b></div>':'',
          idleNombre_(e.regen)>0?'<div><span>💚 Régénération</span><b>'+formatGrandNombreIdleV70_(e.regen)+'</b></div>':'',
          idleNombre_(e.xp)>0?'<div><span>✨ EXP</span><b>'+formatGrandNombreIdleV70_(e.xp)+'</b></div>':'',
          '<div><span>👁️ Rencontres</span><b>'+idleEntier_(e.rencontres)+'</b></div>'
        ].join('');
        const idHistoire='sorealIdleCollectionBossStoryV206_'+n;
        const modal=document.createElement('div');
        modal.id='sorealIdleBossCollectionModalV1';
        modal.className='soreal-idle-modal-backdrop-v63';
        modal.innerHTML=
          '<div class="soreal-idle-modal-card-v63 soreal-idle-boss-fiche-v1" role="dialog" aria-modal="true" aria-label="'+idleHtml_(e.nom||'Boss')+'">'+
            '<div class="soreal-idle-boss-fiche-image-v1"><img src="'+idleHtml_(urlBossR2IdleV1_(n))+'" alt="'+idleHtml_(e.nom||'Boss')+'" '+
              'onerror="this.style.display=\'none\'"></div>'+
            '<div class="soreal-idle-modal-top-v63" style="padding-top:14px"><div class="soreal-idle-modal-title-v63">'+idleHtml_(e.nom||'Boss')+'</div></div>'+
            '<div class="soreal-idle-modal-body-v63">'+
              '<div class="soreal-idle-boss-fiche-stats-v1">'+stats+'</div>'+
              (e.description
                ?'<div class="soreal-idle-boss-fiche-titre-v1">📜 Chronique</div>'+
                  '<div id="'+idHistoire+'" class="soreal-idle-bestiary-desc-v110 soreal-idle-boss-fiche-histoire-v1" data-soreal-tts-chronique="'+idleHtml_(e.nom||'Boss')+'"'+attrHistoireVoixIdleV1_(e.description)+'>'+idleHtml_(sansBaliseVoixIdleV1_(e.description))+'</div>'+
                  '<button type="button" class="soreal-idle-tts-read-v203" data-soreal-tts-target="'+idHistoire+'">🔊 Lire cette chronique</button>'+
                  '<button type="button" class="soreal-idle-chro-suite-v1" data-lire-chroniques-depuis="'+n+'"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5 L13.5 8 L4 13.5 Z" fill="currentColor"/></svg><span>Lire les chroniques à partir d’ici</span></button>'
                :'')+
              /* Administrateur : modifier le nom et la chronique de CE boss depuis la Collection (Norman, 2026-10-04) ; le bouton n'existe pas pour les autres comptes, et le serveur revérifie à l'enregistrement. */
              (window.__SOREAL_IDLE_TEXTES_V1__&&window.__SOREAL_IDLE_TEXTES_V1__.boutonBossHtml?'<div class="soreal-idle-boss-fiche-admin-v1">'+window.__SOREAL_IDLE_TEXTES_V1__.boutonBossHtml(n)+'</div>':'')+
            '</div>'+
            '<div class="soreal-idle-modal-actions-v63">'+
              '<button type="button" class="soreal-idle-modal-button-v63 cancel" onclick="window.__fermerBossCollectionIdleV1__()">Fermer</button>'+
            '</div>'+
          '</div>';
        modal.addEventListener('click',function(ev){if(ev.target===modal)fermerBossCollectionIdleV1_();});
        document.body.appendChild(modal);
      }

      function lireHistoireCompleteBossIdleV206_(){
        if(!REG.idleEtat)return;

        const catalogue=
          Array.isArray(REG.idleEtat.bossCatalogue)
            ?REG.idleEtat.bossCatalogue
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
          texteVoixSansTexteIdleV1_(REG.CLE_VOIX_CHRONIQUES_INTRO_IDLE_V1,REG.TEXTE_CHRONIQUES_INTRO_IDLE_V1)+M(1500)+
          connus.map(function(b){
            return composerChronique(String(b.nom||'Boss'),String(b.histoire||''));
          }).join(M(2000))
        );
      }

      function titanComportementsIdleV1_(fight){
        const api=window.SorealTitanComportementsV1;
        return api&&fight&&fight.titanId&&api.possede(fight.titanId)?api:null;
      }

      function fxEtatsIdleV1_(fight,maintenant){
        const fx=window.SorealCombatFxV1;
        if(!fx)return;
        try{
          const api=window.SorealTitanComportementsV1;
          const tit=REG.idleTitanEtatV1&&api&&fight&&fight.active?REG.idleTitanEtatV1:null;
          fx.etats(fight&&fight.active?{
            soin:Math.max(REG.idleFxSoinJusqua,REG.idleAdventureManualStateV3.hyperRegenUntil),
            saigne:tit?tit.saignements:0,
            paralyse:Boolean(tit&&api.joueurParalyse(tit,maintenant)),
            spores:Boolean(tit&&api.multDegatsJoueur(fight.titanId,tit,maintenant)>0&&api.multDegatsJoueur(fight.titanId,tit,maintenant)<1),
            mobInvincible:Boolean(tit&&api.multDegatsJoueur(fight.titanId,tit,maintenant)===0),
            mobParalyse:REG.idleAdventureManualStateV3.enemyParalyzedUntil>maintenant
          }:{});
        }catch(e){}
      }

      /* Niveau de l'Anneau d'Apathie équipé (null = aucun) : il retire l'invincibilité d'UUG et réduit sa croissance de puissance. */
      function niveauAnneauApathieIdleV1_(a){
        const eq=a&&a.equipment&&Array.isArray(a.equipment.accessories)?a.equipment.accessories:[];
        const inv=Array.isArray(a&&a.inventory)?a.inventory:[];
        for(let i=0;i<eq.length;i+=1){
          const id=String(eq[i]||'');
          if(!id)continue;
          const item=inv.find(function(x){return x&&String(x.id)===id;});
          if(item&&item.definitionId==='ringOfApathy')return Math.max(0,idleEntier_(item.level));
        }
        return null;
      }

      /* Arrête le combat de titan en cours et renvoie en Zone sûre (même effet que choisir la Zone sûre). Faux s'il n'y en avait pas. */
      function arreterCombatTitanIdleV1_(){
        const a=aventureMetaIdleV47_(REG.idleEtat);
        if(a&&a.fight&&a.fight.active&&a.fight.titanId){
          selectionnerZoneAdventureIdleV47_('safe');
          return true;
        }
        return false;
      }

      function progresserZoneFightLocalIdleV1_(maintenantTick,dt){
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const fight=a&&a.fight;
        rafraichirCommandesAdventureIdleV3_(maintenantTick);

        if(!fight||!fight.active){
          resetHorlogesFightAdventureIdleV2_();
          fxEtatsIdleV1_(null,maintenantTick);
          REG.idleTitanEtatV1=null;

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-205 */
          const resolutionEnAttente=REG.idleAdventureResolutionPendingV2;
          envoyerResolutionAdventurePendingV2_();
          if(resolutionEnAttente==='loseZoneFight')return;

          const ecouleReposAdventureSecV166=
            ecouleRegenReposAdventureIdleV166_(maintenantTick);
          const stats=(a&&a.stats)||{};
          const pvMaxRepos=Math.max(0,idleNombre_(stats.hp));
          const zoneCourante=String((a&&a.selectedZone)||'safe');
          const regen=regenReposAdventureIdleV3_(a,zoneCourante);

          if(REG.idleEtat.adventureRestPv==null){
            REG.idleEtat.adventureRestPv=restPvInitialIdleV1_(pvMaxRepos);
          }
          REG.idleEtat.adventureRestPv=Math.min(
            pvMaxRepos,
            Math.max(0,idleNombre_(REG.idleEtat.adventureRestPv))+
              regen*ecouleReposAdventureSecV166
          );
          memoriserRestPvIdleV1_(REG.idleEtat.adventureRestPv);

          if(
            a&&
            zoneCourante!=='safe'&&
            aventureDebloqueeIdleV47_(REG.idleEtat)
          ){
            if(!REG.idleAdventureRespawnAtV1&&!REG.idleAdventureRespawnStartPendingV165){
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
        if(identite!==REG.idleAdventureFightIdentityV2){
          REG.idleAdventureFightIdentityV2=identite;
          REG.idleAdventureFightNextPlayerHitV2=
            maintenantTick+intervalleIdleAttackAdventureIdleV4_(a);
          REG.idleAdventureFightNextEnemyHitV2=
            maintenantTick+intervalleAttaqueEnnemiAdventureIdleV2_(fight);
          REG.idleAdventureFightLastRegenAtV2=maintenantTick;
          REG.idleTitanEtatV1=titanComportementsIdleV1_(fight)?window.SorealTitanComportementsV1.neuf():null;
          if(REG.idleTitanEtatV1)REG.idleTitanEtatV1.id=fight.titanId;
          /*
           * Norman (2026-10-13) : « quand on active le mode manuel du combat, les CD de chacune des attaques doivent être en cours : si une a un CD de 20 s, elle ne sera disponible que 20 s après le début du combat. »
           * Au départ d'un combat de TITAN, tous les raccourcis (attaques, défenses, compétences avancées) entrent en recharge pour leur durée complète (Move 69, qui n'est pas une attaque de combat, n'est pas concerné) ;
           * ils se débloquent donc un par un, que l'Idle Mode soit allumé ou non.
           */
          if(fight.titanId){
            REG.IDLE_ADVENTURE_MANUAL_ATTACKS_V3.concat(REG.IDLE_ADVENTURE_MANUAL_DEFENSE_V3,REG.IDLE_ADVENTURE_ADVANCED_SKILLS_V4).forEach(function(def){
              if(def.id==='move69')return;
              const fin=maintenantTick+cooldownDureeAdventureIdleV4_(def,a);
              if(idleNombre_(REG.idleAdventureManualStateV3.cooldownUntil[def.id])<fin)REG.idleAdventureManualStateV3.cooldownUntil[def.id]=fin;
            });
          }
        }
        if(REG.idleTitanEtatV1&&fight.titanId==='t4')REG.idleTitanEtatV1.anneau=niveauAnneauApathieIdleV1_(a);
        /* Fin d'une paralysie du titan : les cooldowns étaient en pause, on les repousse de la durée subie ; l'Idle Mode reprend un coup plus tard. */
        if(REG.idleTitanEtatV1){
          const subie=window.SorealTitanComportementsV1.finParalysie(REG.idleTitanEtatV1,maintenantTick);
          if(subie>0){
            Object.keys(REG.idleAdventureManualStateV3.cooldownUntil).forEach(function(k){
              if(REG.idleAdventureManualStateV3.cooldownUntil[k]>maintenantTick-subie)REG.idleAdventureManualStateV3.cooldownUntil[k]+=subie;
            });
            REG.idleAdventureFightNextPlayerHitV2=Math.max(REG.idleAdventureFightNextPlayerHitV2,maintenantTick+intervalleIdleAttackAdventureIdleV4_(a));
            ajouterLogAventureIdleV1_('system','Tu peux de nouveau bouger.');
          }
        }

        let evenements=0;
        let modifie=false;
        const MAX_EVENEMENTS_PAR_TICK=12;

        while(evenements<MAX_EVENEMENTS_PAR_TICK){
          const joueurDu=
            REG.idleAdventureIdleModeV3&&
            !titanJoueurParalyseIdleV1_(maintenantTick)&&
            REG.idleAdventureFightNextPlayerHitV2<=maintenantTick;
          if(
            REG.idleAdventureFightNextEnemyHitV2<=maintenantTick&&
            REG.idleAdventureManualStateV3.enemyParalyzedUntil>
              REG.idleAdventureFightNextEnemyHitV2
          ){
            REG.idleAdventureFightNextEnemyHitV2=
              REG.idleAdventureManualStateV3.enemyParalyzedUntil;
          }
          const ennemiDu=
            REG.idleAdventureFightNextEnemyHitV2<=maintenantTick;

          if(!joueurDu&&!ennemiDu)break;

          const joueurPremier=
            joueurDu&&(
              !ennemiDu||
              REG.idleAdventureFightNextPlayerHitV2<=REG.idleAdventureFightNextEnemyHitV2
            );
          const momentEvenement=joueurPremier
            ?REG.idleAdventureFightNextPlayerHitV2
            :REG.idleAdventureFightNextEnemyHitV2;

          appliquerRegenCombatAdventureIdleV2_(
            a,
            fight,
            momentEvenement
          );

          if(joueurPremier){
            REG.idleAdventureFightNextPlayerHitV2+=
              intervalleIdleAttackAdventureIdleV4_(a);

            const avant=idleNombre_(fight.monsterHp);
            const degats=Math.min(
              avant,
              degatsJoueurAdventureIdleV2_(
                Math.max(0,idleNombre_(a&&a.stats&&a.stats.power))*
                  multiplicateurPowerManuelAdventureIdleV3_(momentEvenement,a),
                fight.mobToughness,
                multiplicateurIdleAttackAdventureIdleV2_(a)*titanMultDegatsJoueurIdleV1_(fight,momentEvenement),
                facteurAleatoireDegatsAdventureIdleV2_()
              )
            );
            fight.monsterHp=Math.max(0,avant-degats);

            impactMonstreAdventureIdleV1_();
            fxIdleV1_('mob',titanMultDegatsJoueurIdleV1_(fight,momentEvenement)===0?'invincible':'coup',idleEntier_(degats));
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

          REG.idleAdventureFightNextEnemyHitV2+=
            intervalleAttaqueEnnemiAdventureIdleV2_(fight);

          const avant=idleNombre_(fight.playerHp);
          const toughnessEffectif=
            Math.max(0,idleNombre_(a&&a.stats&&a.stats.toughness))*
            multiplicateurToughnessManuelAdventureIdleV3_(momentEvenement);
          const facteurAleaDegats=facteurAleatoireDegatsAdventureIdleV2_();
          let degats=Math.min(
            avant,
            degatsEnnemiAdventureIdleV2_(
              fight.mobPower,
              toughnessEffectif,
              facteurAleaDegats
            )
          );
          /* Capacités du titan (wiki « Titan Skills ») : attaque puissante (dégâts multipliés) ou paralysie du joueur. */
          let fxTypeAttaque='degats';
          let attTitan=null;
          if(REG.idleTitanEtatV1){
            const att=window.SorealTitanComportementsV1.attaqueTitan(fight.titanId,REG.idleTitanEtatV1,momentEvenement,Math.random());
            attTitan=att;
            /*
             * Wiki « Titans » : « All titans grow in strength by 1% per attack, which can make them much harder to defeat with the bare minimum power/toughness compared to even slightly higher stats ». C'est la PUISSANCE du titan qui
             * grandit (cumulée, 1,01 puissance n) AVANT la réduction par ta Robustesse : dégâts = max(10 % de sa puissance, puissance - Robustesse / 2). Appliquée seulement au résultat final (après la réduction), la croissance
             * ne comptait presque pas (Norman, 2026-10-12 : « son attaque ne montait pas beaucoup, plus le combat dure plus il est supposé taper fort, ça se stack »).
             */
            if(att.croissanceTitan>1)degats=Math.min(avant,degatsEnnemiAdventureIdleV2_(fight.mobPower*att.croissanceTitan,toughnessEffectif,facteurAleaDegats));
            if(att.multDegats!==1)degats=Math.min(avant,Math.round(degats*att.multDegats));
            if(att.type==='puissante'){
              ajouterLogAventureIdleV1_('enemy','💥 Attaque puissante !');
              fxTypeAttaque='puissante';
            }
            if(att.invincibleDebut)ajouterLogAventureIdleV1_('enemy','🛡️ UUG devient invincible : tes coups ne le touchent plus !');
            if(att.type==='sauterelles')ajouterLogAventureIdleV1_('enemy','🦗 Les sauterelles se ruent sur toi : 10 attaques rapides !');
            if(att.rafale)fxTypeAttaque='sauterelle';
            if(att.suite)REG.idleAdventureFightNextEnemyHitV2=momentEvenement+att.intervalleMs;
            if(att.type==='chemise'){
              fxTypeAttaque='chemise';
              const defDes=att.desactive?definitionCompetenceAdventureIdleV3_(att.desactive):null;
              ajouterLogAventureIdleV1_('enemy',att.nouvelle&&defDes?'👔 Jake agite sa chemise : « '+defDes.label+' » est désactivée jusqu’à la fin du combat !':'👔 Jake agite sa chemise… sans effet de plus.');
            }
            if(att.saigne){
              const apiT=window.SorealTitanComportementsV1;
              ajouterLogAventureIdleV1_('enemy','🩸 Tu saignes ! Ta régénération tombe à '+Math.round(apiT.multRegenJoueur(fight.titanId,REG.idleTitanEtatV1)*100)+' %.');
            }
            if(att.paralyse)fxIdleV1_('joueur','eclair');
            if(att.spores)fxIdleV1_('joueur','spore');
            if(att.spores)ajouterLogAventureIdleV1_('enemy','🍄 « Tes bras deviennent soudain lourds » : tes dégâts tombent aux 2/3 pendant 15 s.');
            if(att.draine){fxIdleV1_('joueur','spore');ajouterLogAventureIdleV1_('enemy','🍄 « Tu sens l’énergie se vider de ton corps » : tu subis ×2,5 de dégâts pendant 15 s.');}
            if(att.paralyse)ajouterLogAventureIdleV1_('enemy','⚡ Tu es paralysé : plus de capacités ni d’Idle pendant 4 s !');
          }
          if(REG.idleAdventureManualStateV3.blockUntil>momentEvenement){
            const avantBlocage=degats;
            degats=Math.max(
              0,
              Math.round(
                degats*(1-Math.max(0,Math.min(.99,REG.idleAdventureManualStateV3.blockReduction)))
              )
            );
            const bloques=Math.max(0,avantBlocage-degats);
            if(bloques>0){
              fxTypeAttaque='bloc';
              ajouterLogAventureIdleV1_(
                'player',
                '🛡️ Blocage : '+idleEntier_(bloques)+' dégâts bloqués !'
              );
            }
          }
          let riposteParryMult=0;
          if(REG.idleAdventureManualStateV3.parryArmed){
            degats=Math.max(0,Math.round(degats*.5));
            REG.idleAdventureManualStateV3.parryArmed=false;
            riposteParryMult=Math.max(1,idleNombre_(REG.idleAdventureManualStateV3.parryChargeMult)||1);
            REG.idleAdventureManualStateV3.parryChargeMult=1;
          }
          if(beastModeActifAdventureIdleV4_(a)){
            degats=Math.max(0,Math.round(degats*3));
          }
          degats=Math.min(avant,degats);
          fight.playerHp=Math.max(0,avant-degats);
          fxIdleV1_('joueur',fxTypeAttaque,degats>0?'-'+idleEntier_(degats):'');

          if(!(attTitan&&attTitan.type==='chemise'))ajouterLogAventureIdleV1_(
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
        fxEtatsIdleV1_(fight,maintenantTick);

        if(modifie){
          pousserEtatVersRuntimePartageIdleV1_();
        }
      }

      function htmlReglagesMusiqueTitanIdleV1_(){
        if(!REG.idlePartieDevV1||!REG.idlePartieDevV1.actif||!window.__SOREAL_IDLE_MUSIQUE_TITAN_V1__)return '';
        return '<div class="soreal-idle-section-v8">'+
          '<div class="soreal-idle-window-title-v31">🥁 Musique de combat de Titan (développement)</div>'+
          '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">Section visible seulement en développement : la musique qui joue pendant un combat de Titan (générée par le navigateur, niveau = barre « Musique »). Les sons d’ambiance d’Aventure se taisent pendant ce temps.</div>'+
          '<div style="display:flex;gap:10px">'+
            '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__apercuMusiqueTitanIdleV1__(true)">▶ Écouter</button>'+
            '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__apercuMusiqueTitanIdleV1__(false)">■ Arrêter</button>'+
          '</div>'+
        '</div>';
      }

      let idleDerniereImageBossV61='';

      let idleDernierGongBossV1='';

      let idleDerniereImageJoueurV61='';

      let idlePreloadsCombatV61={};

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
            /*
             * Un seul gong par NOUVEAU boss (Norman, 2026-09-26 : « le son se répète 2 fois », puis « quand on fuit, il ne faut pas que le son du boss soit
             * rejoué »). Le son est lié à l'identité du boss (numéro + nom), pas à l'adresse de son image : l'image est dessinée deux fois (adresse Drive puis
             * R2), et une fuite ou une reprise du combat redessine la même image sans que ce soit un nouveau boss.
             */
            const identiteGongBoss=
              String(idImageBossCanoniqueIdleV181_(REG.idleEtat)||'')+'|'+
              String(REG.idleEtat&&REG.idleEtat.bossActuel||'');
            if(identiteGongBoss!==idleDernierGongBossV1){
              idleDernierGongBossV1=identiteGongBoss;
              jouerEffetAudioIdleV199_('bossAppear');
            }
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
        /*
         * Norman (2026-10-02) : « mon collègue a parfois les anciennes images, celles de mon Drive ». Cause : l'identifiant Drive du catalogue (ancien
         * stockage) passait AVANT l'image R2 actuelle. R2 est la source de vérité : l'image R2 d'abord, le Drive seulement si aucune image R2 n'est
         * connue (jamais pour le portrait du joueur, chargé ensuite depuis R2).
         */
        const url=
          String(
            fallbackUrl||''
          );

        if(!url){
          return '';
        }

        /*
         * Fondu + gong seulement quand l'IMAGE change : la clé est son adresse. Avant, la page Fight Boss (clé = nom du boss) et la mise à jour de
         * l'image (clé = numéro du boss) se relayaient avec deux clés différentes : chaque rendu, dont celui d'une Fuite, refaisait le fondu et rejouait
         * le son d'apparition du boss (Norman, 2026-09-26).
         */
        void cle;
        const fade=
          classeFonduImageIdleV61_(
            type,
            url
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
          '" loading="eager" decoding="'+(fade?'async':'sync')+'" fetchpriority="high" '+
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

        {
          const dejaAffichee=host.querySelector('img');
          const urlAttendue=idleBossImageCacheV36[cacheKey]||urlBossR2IdleV1_(numero);
          if(dejaAffichee&&urlAttendue&&dejaAffichee.getAttribute('src')===urlAttendue)return;
        }

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

  Object.assign(REG,{
    initialiserCoupsCombatIdleV116_:initialiserCoupsCombatIdleV116_,
    appliquerAugmentsSurCombatIdleV1_:appliquerAugmentsSurCombatIdleV1_,
    actualiserCooldownBossIdleV100_:actualiserCooldownBossIdleV100_,
    rafraichirCommandesFightBossIdleV167_:rafraichirCommandesFightBossIdleV167_,
    transitionMortBossIdleV61_:transitionMortBossIdleV61_,
    surveillerConfirmationVictoireBossIdleV1_:surveillerConfirmationVictoireBossIdleV1_,
    appliquerBossSuivantLocalIdleV1_:appliquerBossSuivantLocalIdleV1_,
    largeurBarreCombatIdleV121_:largeurBarreCombatIdleV121_,
    actualiserAmbianceCombatIdleV1_:actualiserAmbianceCombatIdleV1_,
    largeurBarreVieCombatIdleV163_:largeurBarreVieCombatIdleV163_,
    texteCombatIdleV121_:texteCombatIdleV121_,
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
    traiterCapacitesBossLocalesIdleV70_:traiterCapacitesBossLocalesIdleV70_,
    fermerCarteBossIdleV91_:fermerCarteBossIdleV91_,
    combattreDepuisCarteBossIdleV91_:combattreDepuisCarteBossIdleV91_,
    definirCombatBossIdleV39_:definirCombatBossIdleV39_,
    nukerBossIdleV1_:nukerBossIdleV1_,
    autoNukeDueIdleV1_:autoNukeDueIdleV1_,
    fermerBossCollectionIdleV1_:fermerBossCollectionIdleV1_,
    ouvrirBossCollectionIdleV1_:ouvrirBossCollectionIdleV1_,
    lireHistoireCompleteBossIdleV206_:lireHistoireCompleteBossIdleV206_,
    arreterCombatTitanIdleV1_:arreterCombatTitanIdleV1_,
    progresserZoneFightLocalIdleV1_:progresserZoneFightLocalIdleV1_,
    htmlReglagesMusiqueTitanIdleV1_:htmlReglagesMusiqueTitanIdleV1_,
    markupImageCombatIdleV61_:markupImageCombatIdleV61_,
    prechargerCatalogueCombatIdleV61_:prechargerCatalogueCombatIdleV61_,
    urlBossR2IdleV1_:urlBossR2IdleV1_,
    idImageBossCanoniqueIdleV181_:idImageBossCanoniqueIdleV181_,
    chargerImageBossIdleV36_:chargerImageBossIdleV36_
  });
})();
