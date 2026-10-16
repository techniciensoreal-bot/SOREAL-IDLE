/*
 * SOREAL IDLE — Rendu principal, synchronisation et chargement (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_noyau_v1)return;
  REG.__chargé_ui_noyau_v1=true;

  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function idleFastPendingV60_(){return REG.idleFastPendingV60_.apply(null,arguments);}
  function metaOccupeIdleV130_(){return REG.metaOccupeIdleV130_.apply(null,arguments);}
  function planifierEnvoiRapideIdleV60_(){return REG.planifierEnvoiRapideIdleV60_.apply(null,arguments);}
  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function idleNombre_(){return REG.idleNombre_.apply(null,arguments);}
  function protegerJoueurServeurInventaireIdleV208_(){return REG.protegerJoueurServeurInventaireIdleV208_.apply(null,arguments);}
  function appliquerSuppressionsLocalesRecycleV38_(){return REG.appliquerSuppressionsLocalesRecycleV38_.apply(null,arguments);}
  function empreinteMenusIdleV1_(){return REG.empreinteMenusIdleV1_.apply(null,arguments);}
  function appliquerSynchroCombatSansReflowIdleV116_(){return REG.appliquerSynchroCombatSansReflowIdleV116_.apply(null,arguments);}
  function fusionnerBasicTrainingPlusAvanceIdleV166_(){return REG.fusionnerBasicTrainingPlusAvanceIdleV166_.apply(null,arguments);}
  function patcherResumeStatsIdleV28_(){return REG.patcherResumeStatsIdleV28_.apply(null,arguments);}
  function patcherBarresTimeMachineIdleV1_(){return REG.patcherBarresTimeMachineIdleV1_.apply(null,arguments);}
  function champSaisieActifIdleV1_(){return REG.champSaisieActifIdleV1_.apply(null,arguments);}
  function rafraichirMenuRacineIdleV28_(){return REG.rafraichirMenuRacineIdleV28_.apply(null,arguments);}
  function ajouterLogCombatIdleV70_(){return REG.ajouterLogCombatIdleV70_.apply(null,arguments);}
  function formatGrandNombreIdleV70_(){return REG.formatGrandNombreIdleV70_.apply(null,arguments);}
  function toastIdleV5_(){return REG.toastIdleV5_.apply(null,arguments);}
  function markupImageCombatIdleV61_(){return REG.markupImageCombatIdleV61_.apply(null,arguments);}
  function urlJoueurR2IdleV1_(){return REG.urlJoueurR2IdleV1_.apply(null,arguments);}
  function ancreClicIdleV1_(){return REG.ancreClicIdleV1_.apply(null,arguments);}
  function ancreSacIdleV1_(){return REG.ancreSacIdleV1_.apply(null,arguments);}
  function pousserEtatVersRuntimePartageIdleV1_(){return REG.pousserEtatVersRuntimePartageIdleV1_.apply(null,arguments);}
  function initialiserCoupsCombatIdleV116_(){return REG.initialiserCoupsCombatIdleV116_.apply(null,arguments);}
  function rafraichirEnergieEtBoutonsIdleV9_(){return REG.rafraichirEnergieEtBoutonsIdleV9_.apply(null,arguments);}
  function rafraichirCommandesFightBossIdleV167_(){return REG.rafraichirCommandesFightBossIdleV167_.apply(null,arguments);}
  function afficherResumeHorsLigneIdleV64_(){return REG.afficherResumeHorsLigneIdleV64_.apply(null,arguments);}
  function sauverCombatAutoIdleV30_(){return REG.sauverCombatAutoIdleV30_.apply(null,arguments);}
  function chargerMenuIdleV28_(){return REG.chargerMenuIdleV28_.apply(null,arguments);}
  function prechargerCatalogueCombatIdleV61_(){return REG.prechargerCatalogueCombatIdleV61_.apply(null,arguments);}
  function menuDisponibleIdleV28_(){return REG.menuDisponibleIdleV28_.apply(null,arguments);}
  function sauverMenuIdleV28_(){return REG.sauverMenuIdleV28_.apply(null,arguments);}
  function installerMorphIdleV1_(){return REG.installerMorphIdleV1_.apply(null,arguments);}
  function navigationIdleV28_(){return REG.navigationIdleV28_.apply(null,arguments);}
  function rendreBarreEnergiePersistanteIdleV1_(){return REG.rendreBarreEnergiePersistanteIdleV1_.apply(null,arguments);}
  function walderpBanniereIdleV147_(){return REG.walderpBanniereIdleV147_.apply(null,arguments);}
  function menuStyleIdleV1_(){return REG.menuStyleIdleV1_.apply(null,arguments);}
  function contenuMenuIdleV28_(){return REG.contenuMenuIdleV28_.apply(null,arguments);}
  function rendrePendingIdleV7_(){return REG.rendrePendingIdleV7_.apply(null,arguments);}
  function demarrerTickerIdle_(){return REG.demarrerTickerIdle_.apply(null,arguments);}
  function rafraichirEstAdminSorealIdle_(){return REG.rafraichirEstAdminSorealIdle_.apply(null,arguments);}
  function restaurerScrollNavIdleV28_(){return REG.restaurerScrollNavIdleV28_.apply(null,arguments);}
  function initialiserSwipeNavigationIdleV1_(){return REG.initialiserSwipeNavigationIdleV1_.apply(null,arguments);}
  function restaurerScrollJournalCombatIdleV70_(){return REG.restaurerScrollJournalCombatIdleV70_.apply(null,arguments);}
  function restaurerScrollJournalAventureIdleV1_(){return REG.restaurerScrollJournalAventureIdleV1_.apply(null,arguments);}
  function restaurerAncreClicIdleV1_(){return REG.restaurerAncreClicIdleV1_.apply(null,arguments);}
  function restaurerAncreSacIdleV1_(){return REG.restaurerAncreSacIdleV1_.apply(null,arguments);}
  function chargerImageBossIdleV36_(){return REG.chargerImageBossIdleV36_.apply(null,arguments);}
  function idImageBossCanoniqueIdleV181_(){return REG.idImageBossCanoniqueIdleV181_.apply(null,arguments);}
  function aventureMetaIdleV47_(){return REG.aventureMetaIdleV47_.apply(null,arguments);}
  function gererPopupsProgressionIdleV75_(){return REG.gererPopupsProgressionIdleV75_.apply(null,arguments);}
  function gererTutorielPremierBossIdleV1_(){return REG.gererTutorielPremierBossIdleV1_.apply(null,arguments);}
  function annoncerNouveauxMenusIdleV1_(){return REG.annoncerNouveauxMenusIdleV1_.apply(null,arguments);}
  function generationJoueurIdleV75_(){return REG.generationJoueurIdleV75_.apply(null,arguments);}
  function verifierDefaiteAutoAventureIdleV1_(){return REG.verifierDefaiteAutoAventureIdleV1_.apply(null,arguments);}
  function peutRelancerCombatAutoIdleV30_(){return REG.peutRelancerCombatAutoIdleV30_.apply(null,arguments);}
  function programmerCombatAutoIdleV30_(){return REG.programmerCombatAutoIdleV30_.apply(null,arguments);}
  function messageFlottantIdleV32_(){return REG.messageFlottantIdleV32_.apply(null,arguments);}

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-3 */
      const IDLE_TEST_VERSION='Version bêta';

      /* Badge du haut : le vrai numéro de version (Beta 2.7…), celui des notes de mise à jour (Norman, 2026-09-26 : « garde bien les bons numéros »). */
      function versionBadgeIdleV1_(){
        const n=window.__SOREAL_IDLE_RELEASE_NOTES_V1__;
        return n&&n.courante?'Beta '+n.courante:IDLE_TEST_VERSION;
      }

      function rafraichirPartieDevIdleV1_(){
        if(REG.idlePartieDevV1!==null||!SOREAL_SESSION)return;
        /* Donné dans l'état (partieDev) : aucun appel à part (audit des appels, 2026-10-04). */
        if(REG.idleEtat&&REG.idleEtat.partieDev&&typeof REG.idleEtat.partieDev==='object'){
          REG.idlePartieDevV1={actif:Boolean(REG.idleEtat.partieDev.actif),partie:String(REG.idleEtat.partieDev.partie||'a')==='b'?'b':'a',charge:true};
          if(REG.idlePartieDevV1.actif)rendreIdleEtat_({ok:true,joueur:REG.idleEtat});
          return;
        }
        REG.idlePartieDevV1={actif:false,partie:'a',charge:false};
        google.script.run
          .withSuccessHandler(function(res){
            const avant=JSON.stringify(REG.idlePartieDevV1);
            REG.idlePartieDevV1={
              actif:Boolean(res&&res.ok&&res.actif),
              partie:String(res&&res.partie||'a')==='b'?'b':'a',
              charge:true
            };
            if(JSON.stringify(REG.idlePartieDevV1)!==avant&&REG.idleEtat){
              rendreIdleEtat_({ok:true,joueur:REG.idleEtat});
            }
          })
          .withFailureHandler(function(){})
          .obtenirPartieDevSorealIdle(SOREAL_SESSION);
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

      let idleLoadingTimerV55=null;

      function arreterAnimationChargementIdleV55_(){
        if(idleLoadingTimerV55){
          clearInterval(
            idleLoadingTimerV55
          );
          idleLoadingTimerV55=null;
        }
      }

      function rendreIdleErreur_(message){
        arreterAnimationChargementIdleV55_();
        styleIdle_();

        document.getElementById('app').innerHTML=
          header()+
          `<main class="soreal-idle-native-v4">
            <div class="soreal-idle-hero-v4">
              <div class="soreal-idle-kicker-v4">Prototype privé</div>
              <div class="soreal-idle-title-v4">SOREAL IDLE</div>
              <div class="soreal-idle-sub-v4">Le moteur a renvoyé une erreur.</div>
              <div class="soreal-idle-badge-v4">🔒 ${versionBadgeIdleV1_()}</div>
            </div>
            <div class="soreal-idle-status-v4 error">
              ${idleHtml_(message||'Erreur inconnue')}
            </div>
          </main>`;
      }

      /*
       * Synchro affamée (Norman, 2026-10-03 : audit réactivité) : la synchro périodique est abandonnée tant qu'une action (inventaire, entraînement, achat…) est « en cours ». Un joueur qui
       * clique sans arrêt, ou un drapeau resté vrai, pouvait donc rester très longtemps sans l'état du serveur (chronos qui dérivent). Sans réponse réussie depuis 90 s, la synchro est forcée.
       */
      let idleDerniereSynchroReussieV1=Date.now();

      const IDLE_SYNCHRO_AFFAMEE_MS_V1=90000;

      const IDLE_SYNCHRO_ESPACEMENT_MIN_MS_V1=1500;

      function synchroniserJeuIdleV7_(
        force
      ){
        if(!force&&Date.now()-idleDerniereSynchroReussieV1>IDLE_SYNCHRO_AFFAMEE_MS_V1)force=true;
        /* Pas de synchro ordinaire juste après une synchro réussie (Norman, 2026-10-14 : audit des synchros — une synchro forcée suivie d'une synchro normale 1 s plus tard envoyait deux réponses de 40 Ko pour rien). */
        if(!force&&Date.now()-idleDerniereSynchroReussieV1<IDLE_SYNCHRO_ESPACEMENT_MIN_MS_V1)return;
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-73 */
        if(REG.idleSyncEnCoursV60){
          if(force)idleSyncForcePendingV167=true;
          return;
        }

        if(
          PAGE_ACTIVE!=='idle' ||
          !SOREAL_SESSION ||
          (
            !force &&
            (
              REG.idleFastNetworkBusyV60 ||
              idleFastPendingV60_() ||
              REG.idleAchatEnCoursV5 ||
              REG.idleRecycleBatchV32 ||
              REG.idleAventureEnCoursV17 ||
              REG.idleSortPurchaseBusyV101 ||
              REG.idleSortPurchaseQueueV101.length>0 ||
              metaOccupeIdleV130_() ||
              REG.idleInventoryBusyV160 ||
              REG.idleInventoryMutationQueueV160.length>0 ||
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-74 */
              REG.idleBasicTrainingSaveBusyV120 ||
              REG.idleBasicTrainingDirtyV120
            )
          )
        ){
          return;
        }

        REG.idleSyncEnCoursV60=true;
        if(force)idleSyncForcePendingV167=false;

        function terminerSynchroEtRelancerForceeIdleV167_(){
          REG.idleSyncEnCoursV60=false;
          if(!idleSyncForcePendingV167)return;
          idleSyncForcePendingV167=false;
          setTimeout(function(){
            synchroniserJeuIdleV7_(true);
          },0);
        }

        google.script.run
          .withSuccessHandler(function(res){
            terminerSynchroEtRelancerForceeIdleV167_();
            if(res&&res.ok)idleDerniereSynchroReussieV1=Date.now();

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
              REG.idleFastNetworkBusyV60 ||
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
              REG.idleEtat
                ?idleEntier_(
                    REG.idleEtat.bossVaincus
                  )
                :0;
            const ancienXp=
              REG.idleEtat
                ?idleNombre_(
                    REG.idleEtat.xp
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

            /* Allocations voulues mais pas encore confirmées : jamais écrasées par une synchro calculée avant le clic (Norman, 2026-10-07 : la barre des Augmentations sautait en arrière), et la barre locale est reportée. */
            if(typeof window.__appliquerAllocationsVouluesIdleV1__==='function')window.__appliquerAllocationsVouluesIdleV1__(joueurSynchronise);

            const empreinteMenusAvantV1=empreinteMenusIdleV1_(REG.idleEtat);
            const synchroSansReflowV1=appliquerSynchroCombatSansReflowIdleV116_(
              joueurSynchronise
            );
            if(synchroSansReflowV1&&REG.idleEtat&&empreinteMenusIdleV1_(REG.idleEtat)!==empreinteMenusAvantV1){
              /* Un menu vient d'être débloqué par cette synchro : il doit apparaître tout de suite. */
              rendreIdleEtat_({ok:true,joueur:REG.idleEtat});
            }
            if(
              !synchroSansReflowV1
            ){
              const empreinteAvant=
                empreinteStructurelleIdleV1_(
                  REG.idleEtat
                );

              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-77 */
              const adventureRestPvAvantSyncReposV1=
                REG.idleEtat&&REG.idleEtat.adventureRestPv;

              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-78 */
              const avantSyncBasicTrainingV120={
                force:REG.idleEtat&&REG.idleEtat.force,
                endurance:REG.idleEtat&&REG.idleEtat.endurance,
                puissance:REG.idleEtat&&REG.idleEtat.puissance,
                defense:REG.idleEtat&&REG.idleEtat.defense,
                pvJoueur:REG.idleEtat&&REG.idleEtat.pvJoueur,
                pvJoueurMax:REG.idleEtat&&REG.idleEtat.pvJoueurMax,
                basicTraining:REG.idleEtat&&REG.idleEtat.basicTraining
              };

              REG.idleEtat=
                joueurSynchronise;

              if(adventureRestPvAvantSyncReposV1!=null){
                REG.idleEtat.adventureRestPv=
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
                  REG.idleEtat[cle]=
                    Math.max(
                      idleNombre_(avantSyncBasicTrainingV120[cle]),
                      idleNombre_(REG.idleEtat[cle])
                    );
                }
              });

              if(avantSyncBasicTrainingV120.pvJoueur!=null){
                REG.idleEtat.pvJoueur=
                  avantSyncBasicTrainingV120.pvJoueur;
              }

              if(
                avantSyncBasicTrainingV120.basicTraining&&
                typeof avantSyncBasicTrainingV120.basicTraining==='object'
              ){
                REG.idleEtat.basicTraining=
                  fusionnerBasicTrainingPlusAvanceIdleV166_(
                    avantSyncBasicTrainingV120.basicTraining,
                    joueurSynchronise.basicTraining
                  );
              }

              const empreinteApres=
                empreinteStructurelleIdleV1_(
                  REG.idleEtat
                );

              if(empreinteAvant!==empreinteApres){
                rendreIdleEtat_({
                  ok:true,
                  joueur:REG.idleEtat
                });
              }else{
                patcherResumeStatsIdleV28_(
                  REG.idleEtat
                );
                patcherBarresTimeMachineIdleV1_(
                  REG.idleEtat
                );
              }
            }
            /* Augmentations : la réponse du serveur devient directement le nouveau repère des barres, que la synchro passe par le chemin du combat ou non (aucun redessin, donc aucun retour en arrière visible). */
            /* Quel que soit le menu ouvert : le repère sert aussi à répercuter tout de suite un niveau gagné sur la vie max et l'attaque (Norman, 2026-10-16). */
            if(REG.idleEtat&&typeof window.__adopterRepereAugmentsIdleV1__==='function'){
              try{window.__adopterRepereAugmentsIdleV1__(REG.idleEtat);}catch(e){window.__SOREAL_IDLE_DIAG_V1__&&window.__SOREAL_IDLE_DIAG_V1__.signaler&&window.__SOREAL_IDLE_DIAG_V1__.signaler('repere_augments',e);}
            }
            /* Menus à l'ancienne : la page est redessinée avec les chiffres qui viennent d'arriver. */
            if(REG.IDLE_MENUS_VIVANTS_V1[REG.idleMenuActifV28]&&REG.idleEtat&&!champSaisieActifIdleV1_()){
              try{
                /* Wandoos : seul le poste est remplacé (jamais la page entière), défilement de la page ET de l'écran conservés : l'image de l'ordinateur ne bouge pas (Norman, 2026-10-11). */
                if(REG.idleMenuActifV28==='wandoos'&&window.__SOREAL_IDLE_WANDOOS_V1__&&document.querySelector('.wd-poste'))window.__SOREAL_IDLE_WANDOOS_V1__.rafraichir();
                else rafraichirMenuRacineIdleV28_();
              }catch(e){window.__SOREAL_IDLE_DIAG_V1__&&window.__SOREAL_IDLE_DIAG_V1__.signaler&&window.__SOREAL_IDLE_DIAG_V1__.signaler('synchro_menu_vivant',e);}
            }
            /* Time Machine : à CHAQUE synchro, barres, comptes à rebours et chiffres (remplissages par seconde, Or par seconde, multiplicateurs) sont mis à jour en place, quel que soit le chemin pris par la synchro (Norman, 2026-10-11 : la barre qui tique de plus en plus vite ne se mettait pas à jour). */
            if(REG.idleMenuActifV28==='machine'&&REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.timeMachineView){
              try{patcherBarresTimeMachineIdleV1_(REG.idleEtat);}catch(e){window.__SOREAL_IDLE_DIAG_V1__&&window.__SOREAL_IDLE_DIAG_V1__.signaler&&window.__SOREAL_IDLE_DIAG_V1__.signaler('machine_synchro',e);}
            }
            /* ITOPOD : seuls les chiffres sont mis à jour (la scène animée et les champs d'étage ne sont jamais redessinés). */
            if(REG.idleMenuActifV28==='tower'&&REG.idleEtat&&typeof window.__rafraichirItopodIdleV1__==='function'){
              try{window.__rafraichirItopodIdleV1__(REG.idleEtat);}catch(e){window.__SOREAL_IDLE_DIAG_V1__&&window.__SOREAL_IDLE_DIAG_V1__.signaler&&window.__SOREAL_IDLE_DIAG_V1__.signaler('itopod_chiffres',e);}
            }

            if(
              idleNombre_(
                REG.idleEtat.xp
              )>
              ancienXp
            ){
              ajouterLogCombatIdleV70_(
                'reward',
                '+ '+
                formatGrandNombreIdleV70_(
                  idleNombre_(
                    REG.idleEtat.xp
                  )-
                  ancienXp
                )+
                ' XP.'
              );
            }

            const drops=
              REG.idleEtat &&
              REG.idleEtat.progressionHorsLigne &&
              Array.isArray(
                REG.idleEtat.progressionHorsLigne.dropsRecents
              )
                ?REG.idleEtat.progressionHorsLigne.dropsRecents
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
                REG.idleEtat.bossVaincus
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

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-89 */
      let idleSyncForcePendingV167=false;

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-107 */
      function texte69LolIdleV183_(texte){const a=window.__SOREAL_IDLE_TEXT_TRANSFORMS_V1__;return a&&a.texte69Lol?a.texte69Lol(texte):String(texte||'');}

      function noeudTexte69LolIdleV183_(node){
        if(!node||node.nodeType!==Node.TEXT_NODE)return;
        const avant=node.nodeValue;
        /* Le chiffre de Wandoos a changé : le « lol » collé à l'ancien 69 % s'en va. */
        const suiv=node.nextSibling;
        if(suiv&&suiv.nodeType===1&&suiv.classList&&suiv.classList.contains('wd-lol-v1')&&!/^s*69s?%s*$/.test(avant||''))suiv.remove();
        if(!avant||avant.indexOf('69')<0)return;
        const parent=node.parentElement;
        if(!parent||/^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION)$/i.test(parent.tagName))return;
        /* Wandoos (Norman, 2026-10-16) : « 69 % » ne bouge pas, le « lol » apparaît à sa droite, hors du flux (le chiffre ne se décale pas). */
        if(parent.closest&&parent.closest('.wd-poste')&&/^\s*69\s?%\s*$/.test(avant)){
          const suivant=node.nextSibling;
          if(!(suivant&&suivant.nodeType===1&&suivant.classList.contains('wd-lol-v1'))){
            const lol=document.createElement('span');
            lol.className='wd-lol-v1';lol.textContent='lol';lol.setAttribute('aria-hidden','true');
            parent.insertBefore(lol,node.nextSibling);
          }
          return;
        }
        const apres=texte69LolIdleV183_(avant);
        if(apres!==avant)node.nodeValue=apres;
      }

      function appliquer69LolNoeudIdleV183_(racine){
        if(!racine||!document.body.classList.contains('soreal-idle-active-v47'))return;
        if(racine.nodeType===Node.TEXT_NODE){
          noeudTexte69LolIdleV183_(racine);
          return;
        }
        const walker=document.createTreeWalker(
          racine,
          NodeFilter.SHOW_TEXT,
          {acceptNode:function(n){
            return n.nodeValue&&n.nodeValue.indexOf('69')>=0
              ?NodeFilter.FILTER_ACCEPT
              :NodeFilter.FILTER_REJECT;
          }}
        );
        const nodes=[];
        while(walker.nextNode())nodes.push(walker.currentNode);
        nodes.forEach(noeudTexte69LolIdleV183_);
      }

      function installer69LolIdleV183_(){
        if(document.body.dataset.idle69LolV183==='1')return;
        document.body.dataset.idle69LolV183='1';
        const observer=new MutationObserver(function(mutations){
          if(!document.body.classList.contains('soreal-idle-active-v47'))return;
          const vus=new Set();
          mutations.forEach(function(m){
            if(m.type==='characterData'){
              const node=m.target;
              if(vus.has(node))return;
              vus.add(node);
              noeudTexte69LolIdleV183_(node);
            }else{
              Array.from(m.addedNodes||[]).forEach(function(node){
                if(vus.has(node))return;
                vus.add(node);
                if(node.nodeType===Node.TEXT_NODE)noeudTexte69LolIdleV183_(node);
                else if(node.nodeType===Node.ELEMENT_NODE)appliquer69LolNoeudIdleV183_(node);
              });
            }
          });
        });
        observer.observe(document.body,{subtree:true,childList:true,characterData:true});
        appliquer69LolNoeudIdleV183_(document.body);
      }

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

        /*
         * Le boss SÉLECTIONNÉ fait partie de l'empreinte (Norman, 2026-10-05 : « j'ai tué un boss et le suivant n'apparaît pas » : l'écran restait sur « boss 52 vaincu » alors que l'état était déjà au boss 53). Quand la victoire était déjà comptée en
         * local (bossVaincus identique), la confirmation du serveur ne changeait que le boss sélectionné : l'empreinte restait la même, donc aucun redessin, jusqu'à un changement de menu.
         */
        return [
          idleEntier_(j.bossVaincus),
          idleEntier_(j.bossSelection),
          idleEntier_(j.bossId),
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

      let idleImageJoueurCacheV43={};

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-326 */
      function chargerImageJoueurIdleV43_(numero,driveFileId,zone,portrait,repli){
        const n=idleEntier_(numero)||1;
        const host=document.getElementById('sorealIdlePlayerImageHostV43');
        if(!host||!SOREAL_SESSION)return;

        const cacheKey=String(zone||'')+':'+n+':'+String(portrait||'')+':'+String(repli||'');
        if(idleImageJoueurCacheV43[cacheKey]){
          host.innerHTML=
            markupImageCombatIdleV61_(
              'joueur',
              '',
              idleImageJoueurCacheV43[cacheKey],
              'Joueur',
              'soreal-idle-player-image-v41',
              String(n)
            );
          return;
        }

        const urlR2=urlJoueurR2IdleV1_(zone,portrait,repli);
        idleImageJoueurCacheV43[cacheKey]=urlR2;
        host.innerHTML=
          markupImageCombatIdleV61_(
            'joueur',
            '',
            urlR2,
            'Joueur',
            'soreal-idle-player-image-v41',
            String(n)
          );
      }

      let idleRenduDiffereV1=null;

      let idleRenduDiffereTimerV1=0;

      let idleRenduDiffereDepuisV1=0;

      function navEnDefilementIdleV1_(){
        return REG.idleNavDoigtV1||(Date.now()-REG.idleNavDefilementMsV1)<1200;
      }

      function rendreIdleEtat_(res){
        if(!res||!res.ok||!res.joueur){
          rendreIdleErreur_('Réponse serveur invalide.');
          return;
        }

        /* Pas de rendu pendant que le menu défile (4 s au plus) : le dernier état reçu est rendu juste après. Jamais repoussé si le menu actif change ou si on range les boutons. */
        if(navEnDefilementIdleV1_()&&REG.idleMenuRenduV179===REG.idleMenuActifV28&&!REG.idleMenuEditionV1){
          const depuisDiffere=idleRenduDiffereDepuisV1||(idleRenduDiffereDepuisV1=Date.now());
          if(Date.now()-depuisDiffere<4000){
            idleRenduDiffereV1=res;
            if(!idleRenduDiffereTimerV1){
              idleRenduDiffereTimerV1=setTimeout(function(){
                idleRenduDiffereTimerV1=0;
                const r=idleRenduDiffereV1;
                idleRenduDiffereV1=null;
                if(r)rendreIdleEtat_(r);
              },350);
            }
            return;
          }
        }
        idleRenduDiffereDepuisV1=0;
        /* Position de défilement du menu avant le rendu (restaurée après, tant que le menu actif ne change pas). */
        const idleNavScrollAvantRenduV1=(function(){
          const n=document.querySelector('.soreal-idle-nav-v28');
          return n&&REG.idleMenuRenduV179===REG.idleMenuActifV28?n.scrollLeft:null;
        })();

        const joueurRenduProtegeV208=
          protegerJoueurServeurInventaireIdleV208_(
            res.joueur
          );
        /* Allocations voulues mais pas encore confirmées par le serveur : jamais écrasées par un état plus ancien (modules/meta-progression-v130.js). */
        if(typeof window.__appliquerAllocationsVouluesIdleV1__==='function')window.__appliquerAllocationsVouluesIdleV1__(joueurRenduProtegeV208);

        if(window.__SOREAL_IDLE_INVENTORY_PERF_V160__){
          window.__SOREAL_IDLE_INVENTORY_PERF_V160__.globalRenders+=1;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-330 */
        const idleScrollXAvantRenduV1=window.scrollX||0;
        const idleScrollYAvantRenduV1=window.scrollY||0;
        const idleAncreClicAvantRenduV1=ancreClicIdleV1_();
        const idleAncreSacAvantRenduV1=idleAncreClicAvantRenduV1?null:ancreSacIdleV1_();
        /*
         * Aucun saut au rendu (2026-09-26, Norman : « au moment d'absorber les boosts en maintenant A, l'image fait un saut en haut avant de se
         * repositionner ; je ne veux pas de saut ») : remplacer le contenu de la page la raccourcit un instant, le navigateur ramène alors le défilement
         * en haut avant que le calage ci-dessous ne le rétablisse. On retient donc la hauteur du document pendant le rendu, puis on la relâche.
         */
        try{
          if(document.body){
            /* Hauteur retenue sur le conteneur du jeu (celui qui porte le menu collant), pas sur le body : sinon le menu est poussé hors de l'écran pendant les 700 ms où la page courte est plus petite que le body retenu (Norman, 2026-10-11, Renaissance). */
            const hoteHauteur=document.querySelector('.soreal-idle-native-v4');
            document.body.style.minHeight='';
            if(hoteHauteur)hoteHauteur.style.minHeight='';
            const hauteurAvantRendu=Math.max(document.documentElement.scrollHeight||0,document.body.scrollHeight||0);
            if(hauteurAvantRendu>0){
              if(hoteHauteur)hoteHauteur.style.minHeight=Math.max(0,hauteurAvantRendu-(hoteHauteur.getBoundingClientRect().top+(window.scrollY||0)))+'px';
              else document.body.style.minHeight=hauteurAvantRendu+'px';
              clearTimeout(window.__idleRelacherHauteurTimerV1__);
              window.__idleRelacherHauteurTimerV1__=setTimeout(function(){document.body.style.minHeight='';if(hoteHauteur)hoteHauteur.style.minHeight='';},700);
            }
          }
        }catch(_e){}

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-331 */
        const adventureRestPvAvantV2=REG.idleEtat&&REG.idleEtat.adventureRestPv;
        const synchroCombatSansReflowV179=
          appliquerSynchroCombatSansReflowIdleV116_(
            joueurRenduProtegeV208
          );

        if(!synchroCombatSansReflowV179){
          REG.idleEtat=joueurRenduProtegeV208;
          if(adventureRestPvAvantV2!=null&&REG.idleEtat.adventureRestPv==null){
            REG.idleEtat.adventureRestPv=adventureRestPvAvantV2;
          }
        }
        pousserEtatVersRuntimePartageIdleV1_();
        REG.idleVictoireBossLocaleV49=false;
        REG.idleDernierTickLocalV40=
          Date.now();

        REG.idleResteTickEnergieMsV114=
          Math.max(
            0,
            idleNombre_(
              REG.idleEtat.energieTick &&
              REG.idleEtat.energieTick.resteMs
            )
          );

        const j=REG.idleEtat;

        /*
         * Histoires plein écran (2026-09-27, éditables dans le menu Admin depuis le 2026-09-30) : vérifiées à CHAQUE rendu d'état,
         * quel que soit le menu affiché -- le boss 17 peut être vaincu pendant que le joueur est
         * sur un autre menu (le combat continue côté serveur). Le module gère lui-même l'idempotence
         * (popup plein écran indépendant du rendu de page, jamais recréé si déjà en cours).
         */
        if(window.__SOREAL_IDLE_STORY_ENGINE_V1__&&typeof window.__SOREAL_IDLE_STORY_ENGINE_V1__.considerer==='function'){
          window.__SOREAL_IDLE_STORY_ENGINE_V1__.considerer(j);
        }
        /* Tutoriel éditable (2026-10-14, modules/tutoriel-v1.js) : guides du menu Admin, déclenchés au début du jeu, à la première ouverture d'un menu ou après un boss. */
        if(window.__SOREAL_IDLE_TUTORIEL_V1__&&typeof window.__SOREAL_IDLE_TUTORIEL_V1__.considerer==='function'){
          window.__SOREAL_IDLE_TUTORIEL_V1__.considerer(j);
        }

        initialiserCoupsCombatIdleV116_();

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-332 */
        const fightBossDomStableV179=
          synchroCombatSansReflowV179 &&
          Boolean(j.combatBossActif) &&
          REG.idleMenuActifV28==='combat' &&
          REG.idleMenuRenduV179==='combat' &&
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
          REG.idleAutoAventureV30=
            Boolean(
              j.autoAventure.actif
            );

          if(
            idleEntier_(
              j.autoAventure.zoneId
            )>0
          ){
            REG.idleAutoZoneV30=
              idleEntier_(
                j.autoAventure.zoneId
              );
          }

          sauverCombatAutoIdleV30_();
        }

        chargerMenuIdleV28_();
        try{if(window.__SOREAL_IDLE_INPUT_MENU_V1__&&!window.__inputMenuInitIdleV1){window.__inputMenuInitIdleV1=true;window.__SOREAL_IDLE_INPUT_MENU_V1__.init(REG.idleMenuActifV28);}}catch(_e){}

        prechargerCatalogueCombatIdleV61_(
          j
        );

        if(
          !menuDisponibleIdleV28_(
            REG.idleMenuActifV28,
            j
          )
        ){
          REG.idleMenuActifV28='combat';
          sauverMenuIdleV28_();
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-333 */
        const imageMoneyPitAvantRenduV209=
          REG.idleMenuActifV28==='moneyPit'
            ?document.getElementById('sorealIdleMoneyPitImageV209')
            :null;

        installerMorphIdleV1_(document.getElementById('app'));
        document.getElementById('app').innerHTML=
          header()+
          `<main class="soreal-idle-native-v4">
            <div class="soreal-idle-hero-v4 soreal-idle-hero-banner-v95">
              <img src="/api/idle/media/banner?name=soreal-idle.webp" alt="SOREAL IDLE" onerror="this.outerHTML='&lt;div style=&quot;height:170px;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:1000&quot;&gt;SOREAL IDLE&lt;/div&gt;'">
              <div class="soreal-idle-badge-v4" role="button" tabindex="0" style="cursor:pointer" title="Voir les notes de mise à jour" onclick="window.__ouvrirNotesMajIdleV1__()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.__ouvrirNotesMajIdleV1__()}">
                🔒 ${versionBadgeIdleV1_()}
              </div>
            </div>

            ${navigationIdleV28_(j)}

            ${rendreBarreEnergiePersistanteIdleV1_(j)}

            ${walderpBanniereIdleV147_(j)}

            <div class="soreal-idle-page-root-v28" data-menu="${idleHtml_(menuStyleIdleV1_(j))}" style="--nav-color:${idleHtml_(REG.IDLE_NAV_COULEURS_V1[REG.idleMenuActifV28]||'#5b6b93')}">
              ${contenuMenuIdleV28_(j)}
            </div>
          </main>`;

        if(
          REG.idleMenuActifV28==='moneyPit'&&
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

        REG.idleMenuRenduV179=
          REG.idleMenuActifV28;

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
          restaurerScrollNavIdleV28_(idleNavScrollAvantRenduV1);
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

            const idleAncreClicOkV1=idleAncreClicAvantRenduV1?restaurerAncreClicIdleV1_(idleAncreClicAvantRenduV1,idleScrollXAvantRenduV1):false;
            if(!idleAncreClicOkV1)window.scrollTo(
              idleScrollXAvantRenduV1,
              idleScrollYAvantRenduV1
            );
            restaurerAncreSacIdleV1_(
              idleAncreSacAvantRenduV1,
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
              /* 4 pièces d'un même set équipées : portrait du set (repli : portrait choisi) ; sinon le portrait choisi. */
              j.systemes&&j.systemes.portraits&&(j.systemes.portraits.auto?j.systemes.portraits.auto.file:j.systemes.portraits.selectedFile),
              j.systemes&&j.systemes.portraits&&j.systemes.portraits.auto?j.systemes.portraits.selectedFile:''
            );

            gererPopupsProgressionIdleV75_(
              j
            );

            gererTutorielPremierBossIdleV1_(
              j
            );

            annoncerNouveauxMenusIdleV1_(j);

            /* Succès débloqués : annonce en fondu + fanfare (modules/achievement-notice-v1.js). */
            if(window.__SOREAL_IDLE_ACHIEVEMENT_NOTICE_V1__){
              window.__SOREAL_IDLE_ACHIEVEMENT_NOTICE_V1__.verifier(j,'soreal_idle_succes_annonces_v1_'+generationJoueurIdleV75_(j));
            }

            /* Défis : annonce de fin de défi, trolls, mode aveugle (modules/challenges-v1.js). */
            if(window.__SOREAL_IDLE_DEFIS_V1__){
              try{window.__SOREAL_IDLE_DEFIS_V1__.verifier(j);}catch(_e){}
            }

            /* Sons d'ambiance dès qu'Aventure est débloqué (Norman, 2026-09-27 -- modules/ambient-audio-v1.js). */
            if(window.__SOREAL_IDLE_AMBIENT_AUDIO_V1__){
              window.__SOREAL_IDLE_AMBIENT_AUDIO_V1__.verifier(Boolean(j&&j.aventure&&j.aventure.debloquee));
            }

            verifierDefaiteAutoAventureIdleV1_(j);

            if(
              REG.idleMenuActifV28==='aventure' &&
              REG.idleAutoAventureV30 &&
              !REG.idleAventureEnCoursV17 &&
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
        REG.idleAutorise=true;

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

      function chargerSorealIdleNatifV4_(){
        if(!REG.idleAutorise){
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

  Object.assign(REG,{
    afficherBoutonIdle_:afficherBoutonIdle_,
    synchroniserJeuIdleV7_:synchroniserJeuIdleV7_,
    rendreIdleEtat_:rendreIdleEtat_,
    annulerOuvertureIdleV104_:annulerOuvertureIdleV104_,
    ouvrirSorealIdleAvecEtatV108_:ouvrirSorealIdleAvecEtatV108_,
    chargerSorealIdleNatifV4_:chargerSorealIdleNatifV4_
  });
})();
