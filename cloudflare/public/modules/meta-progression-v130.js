/*
 * SOREAL IDLE — Système Méta (Yggdrasil, Gold Diggers, Perks, Quirks,
 * ITOPOD, Challenges, Augmentations, Time Machine, Blood Magic,
 * Money Pit / Daily Spin, Boutique EXP).
 * Extrait du monolithe soreal-idle-ui.js (UI split V9), sans changement
 * fonctionnel : mêmes fonctions, mêmes signatures, mêmes bridges
 * window.__x__ pour les gestionnaires onclick inline.
 *
 * Ce module dépend d'état et de fonctions qui vivent dans la fermeture
 * du monolithe (session, état joueur en cours, synchronisation serveur,
 * rendu partagé). Comme le monolithe et ce module s'exécutent dans deux
 * portées JS séparées (deux balises <script> distinctes), ces
 * dépendances sont exposées explicitement par le monolithe via
 * window.__SOREAL_IDLE_META_HOST_V130__ avant tout appel réel (l'ordre
 * de chargement des <script> n'a pas d'importance (les modules chargent
 * avant le monolithe) : ce pont n'est relu qu'au moment de l'exécution
 * réelle des fonctions ci-dessous, jamais au chargement du module.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_META_V130__)return;

      let idleMetaBusyV130=false;


      function systemeMetaParIdIdleV130_(j,id){
        const liste=
          j&&j.systemes&&Array.isArray(j.systemes.systems)
            ?j.systemes.systems
            :[];

        return liste.find(function(s){
          return s&&s.id===String(id||'');
        }) || null;
      }


      /*
       * 2026-09-23 : un startZoneFight qui n'aboutit pas (verrou serveur
       * SOREAL_IDLE_OCCUPE, timeout réseau, refus serveur, appel abandonné
       * car le module était occupé) laissait idleAdventureRespawnStartPendingV165
       * à true pour toujours : plus aucun respawn n'était reprogrammé et
       * l'aventure restait figée jusqu'à un aller-retour Safe Zone.
       */
      function estDemarrageCombatZoneV1_(payload){
        return Boolean(
          payload&&
          payload.action==='adventure'&&
          payload.adventure&&
          payload.adventure.action==='startZoneFight'
        );
      }

      function libererDemarrageCombatEnEchecV1_(payload){
        if(estDemarrageCombatZoneV1_(payload)){
          window.__SOREAL_IDLE_META_HOST_V130__.setIdleAdventureRespawnStartPending(false);
        }
      }

      /*
       * Raccourcis clavier A/D/Q/W/E de l'inventaire (modules/inventory-auto-v1.js, action:'inventoryAuto')
       * mutent l'inventaire d'Aventure exactement comme les actions equip/unequip/merge/boost/cube déjà
       * ci-dessous exemptées du rendu complet (estMutationInventaireAdventureV1) -- mais sous payload.action
       * ==='inventoryAuto', jamais 'adventure', donc jamais reconnues par ce test. Elles retombaient sur
       * rendreIdleEtat_ (page ENTIÈRE remplacée) à chaque raccourci : en maintenant A pour absorber
       * plusieurs boosts d'affilée, l'image de l'objet clignotait et la page sautait brièvement en haut
       * avant de se replacer (Norman, 2026-09-27). boostAll/mergeAll suivent exactement la même mécanique
       * que boost/merge (juste appliquée en masse) ; transformBoost ne change que l'objet boost affiché
       * dans le sac, jamais l'équipement -- aucune catégorie de patch supplémentaire n'est donc nécessaire
       * pour lui (patchResumeInventaireIdleV160_/patchGrilleSacInventaireIdleV160_ suffisent, toujours
       * appliquées sans condition par patchInventaireAdventureIdleV160_).
       *
       * 2026-09-27 (Norman, à nouveau : « quand on coche un filtre... il y a un effet de clignotement ») : les modes
       * réglages (settings) et filtre de butin (lootFilterType/lootFilterItem) ne touchent jamais la grille du sac
       * NI l'équipement, mais retombaient pourtant sur le même rendu complet que le reste -- leur panneau
       * (« Automatisation de l'inventaire ») ne vit QUE sur la page Aventure (ancré au sac), donc jamais affiché tant
       * que ce n'est pas le menu actif : mêmes conditions de sécurité que boostAll/mergeAll/transformBoost, ajoutés
       * ici pour la même raison. Les configurations d'équipement (loadoutSave/loadoutApply) restent au rendu complet :
       * elles rééquipent potentiellement toute la tenue, donc changent réellement la grille/l'équipement affiché.
       */
      var IDLE_INVENTORY_AUTO_ACTIONS_PATCH_V1={boostAll:'boost',mergeAll:'merge',transformBoost:'',settings:'',lootFilterType:'',lootFilterItem:'',sortInventory:''};
      function actionPatchInventaireAutoV1_(payload){
        if(!payload||payload.action!=='inventoryAuto')return null;
        const mode=String(payload.mode||'');
        if(!Object.prototype.hasOwnProperty.call(IDLE_INVENTORY_AUTO_ACTIONS_PATCH_V1,mode))return null;
        return IDLE_INVENTORY_AUTO_ACTIONS_PATCH_V1[mode];
      }

      /*
       * Boutons réactifs (2026-09-26, Norman : « quand on effectue un achat, il faut souvent s'y reprendre à 2 fois ; pareil pour le Money Pit et la
       * roue »). Une action envoyée pendant qu'une autre était en cours (le jeu en envoie régulièrement en arrière-plan) était ABANDONNÉE en
       * silence : le clic ne faisait rien. Elle est maintenant mise en file et envoyée dès que le canal se libère. Exceptions : les actions de
       * combat de zone (leur cadence est gérée à part, elles doivent rester abandonnées) et le doublon exact de l'action en cours dans les 700 ms
       * (double clic : un seul achat).
       */
      let idleMetaFileV1=[];
      let idleMetaTimerFileV1=0;
      let idleMetaDernierEnvoiV1={cle:'',at:0};
      function cleActionMetaV1_(payload){try{return JSON.stringify(payload||{});}catch(_e){return '';}}
      function actionCombatZoneMetaV1_(payload){
        return Boolean(payload&&payload.action==='adventure'&&payload.adventure&&
          ['startZoneFight','resolveZoneFight','loseZoneFight','zoneKill'].indexOf(payload.adventure.action)!==-1);
      }
      function viderFileActionsMetaV1_(){
        idleMetaTimerFileV1=0;
        if(idleMetaBusyV130){
          idleMetaTimerFileV1=setTimeout(viderFileActionsMetaV1_,60);
          return;
        }
        const suivante=idleMetaFileV1.shift();
        if(suivante)actionMetaNoyauIdleV130_(suivante);
        if(idleMetaFileV1.length&&!idleMetaTimerFileV1)idleMetaTimerFileV1=setTimeout(viderFileActionsMetaV1_,60);
      }
      function actionMetaIdleV130_(payload){
        if(idleMetaBusyV130&&SOREAL_SESSION&&!actionCombatZoneMetaV1_(payload)){
          const cle=cleActionMetaV1_(payload);
          if(cle&&cle===idleMetaDernierEnvoiV1.cle&&Date.now()-idleMetaDernierEnvoiV1.at<700)return;
          if(cle&&idleMetaFileV1.some(function(x){return cleActionMetaV1_(x)===cle;}))return;
          idleMetaFileV1.push(payload);
          if(idleMetaFileV1.length>12)idleMetaFileV1.shift();
          if(!idleMetaTimerFileV1)idleMetaTimerFileV1=setTimeout(viderFileActionsMetaV1_,60);
          return;
        }
        actionMetaNoyauIdleV130_(payload);
      }

      function actionMetaNoyauIdleV130_(payload){
        if(
          idleMetaBusyV130 ||
          !SOREAL_SESSION
        ){
          libererDemarrageCombatEnEchecV1_(payload);
          return;
        }

        idleMetaDernierEnvoiV1={cle:cleActionMetaV1_(payload),at:Date.now()};
        idleMetaBusyV130=true;

        window.__SOREAL_IDLE_META_HOST_V130__.appelerProgressionIdleCloudflareV1_(
          payload||{},
          function(res){
            idleMetaBusyV130=false;

            if(
              res &&
              res.ok &&
              res.joueur
            ){
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-287 */
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-288 */
              const adventureRestPvAvantV1=window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat()&&window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat().adventureRestPv;
              const joueurMetaProtegeV208=
                window.__SOREAL_IDLE_META_HOST_V130__.protegerJoueurServeurInventaireIdleV208_(
                  res.joueur
                );
              if(!window.__SOREAL_IDLE_META_HOST_V130__.appliquerSynchroCombatSansReflowIdleV116_(joueurMetaProtegeV208)){
                window.__SOREAL_IDLE_META_HOST_V130__.setIdleEtat(joueurMetaProtegeV208);
                if(adventureRestPvAvantV1!=null)window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat().adventureRestPv=adventureRestPvAvantV1;
              }

              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-289 */
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-290 */
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-291 */
              const estCycleCombatZoneV1=Boolean(
                payload&&
                payload.action==='adventure'&&
                payload.adventure&&
                ['startZoneFight','resolveZoneFight','loseZoneFight'].indexOf(payload.adventure.action)!==-1
              );
              if(
                payload&&payload.action==='adventure'&&payload.adventure&&
                payload.adventure.action==='startZoneFight'
              ){
                window.__SOREAL_IDLE_META_HOST_V130__.setIdleAdventureRespawnStartPending(false);
              }

              const estMutationInventaireAdventureV1=Boolean(
                payload&&
                payload.action==='adventure'&&
                payload.adventure&&
                window.__SOREAL_IDLE_META_HOST_V130__.estMutationInventaireAdventureIdleV160_(payload.adventure)
              );
              const actionPatchInventaireAutoV1=actionPatchInventaireAutoV1_(payload);
              const estMutationInventaireAutoV1=actionPatchInventaireAutoV1!=null;

              if(!estCycleCombatZoneV1){
                if(estMutationInventaireAdventureV1||estMutationInventaireAutoV1){
                  const aventureFraicheV1=window.__SOREAL_IDLE_META_HOST_V130__.aventureMetaIdleV47_(joueurMetaProtegeV208);
                  const aventureCouranteV1=window.__SOREAL_IDLE_META_HOST_V130__.aventureMetaIdleV47_(window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat());
                  const fightLocalV1=aventureCouranteV1&&aventureCouranteV1.fight&&aventureCouranteV1.fight.active
                    ?aventureCouranteV1.fight
                    :null;
                  if(aventureFraicheV1&&window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat()&&window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat().systemes){
                    window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat().systemes=Object.assign({},window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat().systemes,{
                      adventure:Object.assign(
                        {},
                        aventureFraicheV1,
                        fightLocalV1?{fight:fightLocalV1}:{}
                      )
                    });
                  }
                  window.__SOREAL_IDLE_META_HOST_V130__.patchInventaireAdventureIdleV160_(
                    window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat(),
                    {
                      action:estMutationInventaireAdventureV1?payload.adventure.action:actionPatchInventaireAutoV1,
                      confirmed:true
                    }
                  );
                }else if(
                  payload&&payload.action==='adventure'&&payload.adventure&&
                  payload.adventure.action==='startTitanFight'&&typeof window.__menuIdleV28__==='function'
                ){
                  /* Le titan est maintenant l'ennemi du combat : on ouvre la scène d'Aventure (Norman, 2026-10-02). */
                  window.__menuIdleV28__('aventure');
                }else{
                  window.__SOREAL_IDLE_META_HOST_V130__.rendreIdleEtat_({
                    ok:true,
                    joueur:joueurMetaProtegeV208
                  });
                }
              }else if(
                payload&&
                payload.adventure&&
                payload.adventure.action==='loseZoneFight'
              ){
                window.__SOREAL_IDLE_META_HOST_V130__.patchZoneAdventureSansReflowIdleV1_(window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat());
              }else if(
                payload&&
                payload.adventure&&
                payload.adventure.action==='resolveZoneFight'
              ){
                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-292 */
                window.__SOREAL_IDLE_META_HOST_V130__.patchInventaireAdventureIdleV160_(
                  window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat(),
                  {action:'loot',confirmed:true}
                );
              }
              window.__SOREAL_IDLE_META_HOST_V130__.pousserEtatVersRuntimePartageIdleV1_();

              if(window.__SOREAL_IDLE_THE_END_UI_V1__){
                const aventureFin=window.__SOREAL_IDLE_META_HOST_V130__.aventureMetaIdleV47_(window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat());
                window.__SOREAL_IDLE_THE_END_UI_V1__.notifier(aventureFin);
                if(res.resultat&&Array.isArray(res.resultat.text)&&payload&&payload.adventure&&payload.adventure.action==='theEndPlay'){
                  window.__SOREAL_IDLE_THE_END_UI_V1__.ouvrirFin(res.resultat.text);
                }
              }

              if(
                res.resultat &&
                Object.keys(res.resultat).length
              ){
                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-293 */
                if(!estCycleCombatZoneV1){
                  /* A + clic sans rien d'absorbé : on dit pourquoi au lieu d'un « Progression mise à jour » trompeur. */
                  const boostVideV1=payload&&payload.action==='inventoryAuto'&&payload.mode==='boostAll'
                    &&!(window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(res.resultat.applied)>0||window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(res.resultat.cube)>0);
                  const ia=window.__SOREAL_IDLE_INVENTORY_AUTO_V1__;
                  window.__SOREAL_IDLE_META_HOST_V130__.messageFlottantIdleV32_(
                    boostVideV1&&ia&&ia.expliquerAucunBoost&&payload.targetId&&payload.targetId!=='cube'
                      ?ia.expliquerAucunBoost(payload.targetId)
                      :'✅ Progression mise à jour'
                  );
                }

                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-294 */
                if(
                  payload&&
                  payload.action==='adventure'&&
                  payload.adventure&&
                  payload.adventure.action==='loseZoneFight'
                ){
                  window.__SOREAL_IDLE_META_HOST_V130__.toastIdleV5_('💀 Vaincu ! Retour à la Safe Zone pour te soigner.');
                }

                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-295 */
                if(
                  payload&&
                  payload.action==='adventure'&&
                  payload.adventure&&
                  payload.adventure.action==='resolveZoneFight'
                ){
                  if(Array.isArray(res.resultat.drops)&&res.resultat.drops.length){
                    res.resultat.drops.forEach(function(objet){
                      const aventureLoot=window.__SOREAL_IDLE_META_HOST_V130__.aventureMetaIdleV47_(window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat());
                      const sacLoot=aventureLoot&&Array.isArray(aventureLoot.inventory)
                        ?aventureLoot.inventory
                        :[];
                      const objetSnapshot=sacLoot.find(function(x){
                        return String(x&&x.id||'')===String(objet&&objet.id||'');
                      })||objet;
                      const rarete=window.__SOREAL_IDLE_META_HOST_V130__.idleRareteClasseObjetAdventureIdleV1_(objetSnapshot);
                      const classeLog=rarete
                        ?rarete.replace('idle-rarity-','idle-loot-rarity-')
                        :'';
                      /*
                       * (filtré) (2026-09-27, Norman : « Quand un objet tombe et que le filtre est activé pour ce type de pièce,
                       * le journal de combat doit indiqué (filtré) à côté de l'objet. ») : marqué serveur (idle-inventory-auto-v1.js,
                       * idleInventoryProcessNewDropsV1) -- l'objet est bien apparu, mais n'est jamais resté dans le sac.
                       */
                      window.__SOREAL_IDLE_META_HOST_V130__.ajouterLogAventureIdleV1_(
                        'loot',
                        (objet&&(objet.name||objet.nom)||'Un objet')+' obtenu !'+(objet&&objet.filtered?' (filtré)':''),
                        classeLog
                      );
                    });
                  }
                  /* Un drop doit se voir tout de suite : si le sac affiché ne le contient pas après le patch, on redessine la page Aventure. */
                  const dropsVisibles=Array.isArray(res.resultat.drops)?res.resultat.drops.filter(function(o){return o&&o.id&&!o.filtered;}):[];
                  if(dropsVisibles.length){
                    setTimeout(function(){
                      if(!document.getElementById('soreal-idle-v138-bag-section'))return;
                      const H2=window.__SOREAL_IDLE_META_HOST_V130__;
                      const av=H2.aventureMetaIdleV47_(H2.getIdleEtat());
                      const sac=av&&Array.isArray(av.inventory)?av.inventory:[];
                      const manque=dropsVisibles.some(function(o){
                        /* Seulement si l'objet est bien dans le sac de l'état (un drop recyclé ou fusionné automatiquement n'y reste pas). */
                        if(!sac.some(function(x){return String(x&&x.id||'')===String(o.id);}))return false;
                        return !document.querySelector('#soreal-idle-v138-bag-section [data-item-id="'+String(o.id).replace(/"/g,'')+'"]');
                      });
                      if(manque&&!document.querySelector('.soreal-idle-dragging-v138,[data-idle-dragging]')&&typeof window.__SOREAL_IDLE_META_HOST_V130__.rafraichirMenuRacineIdleV28_==='function'){
                        window.__SOREAL_IDLE_META_HOST_V130__.rafraichirMenuRacineIdleV28_();
                      }
                    },80);
                  }
                  if(window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(res.resultat.gold)>0){
                    window.__SOREAL_IDLE_META_HOST_V130__.ajouterLogAventureIdleV1_(
                      'gold',
                      '+ '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(res.resultat.gold)+' or ! Chouette !'
                    );
                  }
                }

                /*
                 * Son spécial d'absorption totale (2026-09-27, Norman : « Quand un objet absorbe tous
                 * les boosts possible, il faut un son spécial pour cette action. ») : « A + clic »/
                 * double tap (mode:'boostAll') -- son joué seulement si au moins un boost a réellement
                 * été absorbé (stats.applied/cube, idle-inventory-auto-v1.js), jamais sur un clic à vide.
                 */
                if(
                  payload&&
                  payload.action==='inventoryAuto'&&
                  payload.mode==='boostAll'&&
                  (window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(res.resultat.applied)>0||window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(res.resultat.cube)>0)
                ){
                  try{
                    if(window.__SOREAL_IDLE_AUDIO_V199__&&typeof window.__SOREAL_IDLE_AUDIO_V199__.boostAllAbsorption==='function'){
                      window.__SOREAL_IDLE_AUDIO_V199__.boostAllAbsorption();
                    }
                  }catch(_e){}
                }

                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-296 */
                if(
                  payload&&
                  payload.action==='adventure'&&
                  payload.adventure&&
                  payload.adventure.action==='consumeUnlock'&&
                  res.resultat.flag
                ){
                  const nomsSystemesDeblocageV1={
                    ngu:'NGU',yggdrasil:'Yggdrasil',diggers:'Diggers',
                    beards:'Beards',tower:'la Tour',wandoos:'Wandoos'
                  };
                  window.__SOREAL_IDLE_META_HOST_V130__.toastIdleV5_(
                    '🔓 '+
                    (nomsSystemesDeblocageV1[res.resultat.flag]||res.resultat.flag)+
                    ' débloqué !'
                  );
                }

                /*
                 * Norman (2026-09-27) : « Quand on balance son argent dans le money pit, il n'y a pas de son. ni quand on
                 * tourne la roue. ils doivent avoir leurs propres sons. » Joué dès l'action elle-même, jamais conditionné
                 * à l'obtention d'un lot (res.resultat.reward peut être vide un tour sur deux).
                 */
                if(payload&&payload.action==='moneyPit'){
                  try{
                    if(window.__SOREAL_IDLE_AUDIO_V199__&&typeof window.__SOREAL_IDLE_AUDIO_V199__.moneyPit==='function'){
                      window.__SOREAL_IDLE_AUDIO_V199__.moneyPit();
                    }
                  }catch(_e){}
                }
                if(payload&&payload.action==='loginCalendar'&&res.resultat&&res.resultat.ap){
                  try{
                    if(window.__SOREAL_IDLE_AUDIO_V199__&&typeof window.__SOREAL_IDLE_AUDIO_V199__.dailySpin==='function'){
                      window.__SOREAL_IDLE_AUDIO_V199__.dailySpin();
                    }
                  }catch(_e){}
                  /* Récompense prise automatiquement à la connexion : une annonce (jour de série, AP) à la place du simple message. */
                  if(window.__connexionRecompenseAutoV1__&&window.__SOREAL_IDLE_CONNEXION_RECOMPENSE_V1__){
                    window.__connexionRecompenseAutoV1__=false;
                    window.__SOREAL_IDLE_CONNEXION_RECOMPENSE_V1__.annoncer(res.resultat);
                  }else
                  window.__SOREAL_IDLE_META_HOST_V130__.toastIdleV5_(
                    '📅 Jour '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(res.resultat.case)+' : +'+
                    window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(res.resultat.ap))+' 💠 AP !'
                  );
                }
                if(payload&&payload.action==='collect'&&payload.system==='dailySpin'){
                  try{
                    if(window.__SOREAL_IDLE_AUDIO_V199__&&typeof window.__SOREAL_IDLE_AUDIO_V199__.dailySpin==='function'){
                      window.__SOREAL_IDLE_AUDIO_V199__.dailySpin();
                    }
                  }catch(_e){}
                }

                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-297 */
                if(
                  payload&&payload.action==='moneyPit'&&
                  res.resultat.reward
                ){
                  const libelleBoost=res.resultat.boost
                    ?'Boost '+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(res.resultat.boost.type)+' +'+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(res.resultat.boost.strength)+' · '
                    :'';
                  window.__SOREAL_IDLE_META_HOST_V130__.toastIdleV5_(
                    '🕳️ Lot remporté : '+
                    libelleBoost+
                    formaterRecompenseIdleV1_(res.resultat.reward)
                  );
                }
                if(
                  payload&&payload.action==='collect'&&
                  payload.system==='dailySpin'&&
                  res.resultat.reward
                ){
                  window.__SOREAL_IDLE_META_HOST_V130__.toastIdleV5_(
                    '🎡 Lot remporté : '+
                    formaterRecompenseIdleV1_(res.resultat.reward)
                  );
                }
              }

              return;
            }

            libererDemarrageCombatEnEchecV1_(payload);

            window.__SOREAL_IDLE_META_HOST_V130__.toastIdleV5_(
              res&&res.message
                ?res.message
                :'Action impossible.'
            );
          },
          function(e){
            idleMetaBusyV130=false;
            libererDemarrageCombatEnEchecV1_(payload);

            window.__SOREAL_IDLE_META_HOST_V130__.toastIdleV5_(
              e&&e.message
                ?e.message
                :'Erreur de métaprogression.'
            );
          }
        );
      }


      function ajusterAllocationMetaIdleV130_(
        systemeId,
        ressource,
        delta
      ){
        const s=
          systemeMetaParIdIdleV130_(
            window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat(),
            systemeId
          );

        if(!s)return;

        const actuelle=
          window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(
            s.state&&
            s.state.allocation&&
            s.state.allocation[ressource]
          );

        actionMetaIdleV130_({
          action:'allocate',
          system:systemeId,
          resource:ressource,
          value:Math.max(
            0,
            Math.min(
              100,
              actuelle+
              window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(delta)
            )
          )
        });
      }


      function toggleSystemeMetaIdleV130_(id){
        const s=
          systemeMetaParIdIdleV130_(
            window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat(),
            id
          );

        actionMetaIdleV130_({
          action:'toggle',
          system:id,
          active:!(
            s&&s.state&&s.state.active
          )
        });
      }


      function collecterSystemeMetaIdleV130_(id){
        actionMetaIdleV130_({
          action:'collect',
          system:id
        });
      }


      window.__actionMetaIdleV130__=
        actionMetaIdleV130_;

      window.__ajusterAllocationMetaIdleV130__=
        ajusterAllocationMetaIdleV130_;

      window.__toggleSystemeMetaIdleV130__=
        toggleSystemeMetaIdleV130_;

      window.__collecterSystemeMetaIdleV130__=
        collecterSystemeMetaIdleV130_;


      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-298 */
      const IDLE_LIBELLES_MONNAIE_RECOMPENSE_V1={
        gold:'🪙 Or',experience:'⭐ EXP',ap:'💠 AP',pp:'🔷 PP',
        seeds:'🌱 Graines',blood:'🩸 Sang'
      };
      function formaterRecompenseIdleV1_(reward){
        return Object.keys(reward||{}).map(function(cle){
          return '+'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(reward[cle]))+' '+
            (IDLE_LIBELLES_MONNAIE_RECOMPENSE_V1[cle]||cle);
        }).join(' · ')||'rien';
      }

      function libelleRessourceMetaIdleV130_(id){const api=window.__SOREAL_IDLE_TEXT_HELPERS_V1__;return api&&typeof api.libelleRessource==='function'?api.libelleRessource(id):String(id||'');}

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-299 */
      const IDLE_SPEND_EXP_STATS_V1=[
        {
          id:'speed',
          nom:'Vitesse',
          icone:'⏩',
          /* Wiki NGU Idle, page « Energy » (Purchase) : Speed = « rate at which you generate Energy », plafonné à 50 : 1 point par tick (50 par seconde) et par barre. */
          explication:'Vitesse de remplissage de la barre de cette ressource : plus elle est élevée, plus vite tes points sont générés. Maximum : 50 remplissages par seconde.'
        },
        {
          id:'power',
          nom:'Puissance',
          icone:'💪',
          /* Wiki, page « Energy » : Power = « effect of each point of Energy put into a task » ; la production d'une activité vaut points placés × Power (sauf Basic Training et Wandoos). Elle ne change pas la génération. */
          explication:'Chaque point de cette ressource placé dans une activité produit Puissance fois plus d’effet (sauf Basic Training). N’accélère pas la génération.'
        },
        {
          id:'cap',
          nom:'Plafond',
          icone:'📦',
          explication:'Augmente la quantité maximale de ressource que tu peux stocker.'
        },
        {
          id:'bars',
          nom:'Barres',
          icone:'📊',
          /* Wiki, page « Energy » : Bars = « increases the rate at which you generate Energy » ; moteur (advanceGeneratedResources) : chaque remplissage de la barre donne autant de points que de Barres, donc génération par seconde = vitesse × Barres. */
          explication:'Chaque remplissage de la barre te donne autant de points que de Barres : avec 3 Barres, un remplissage rapporte 3 points au lieu de 1. Ça multiplie la vitesse de génération (vitesse × Barres).'
        }
      ];

      function idleExpShopIdInput_(res,stat){
        return 'idle-exp-qty-'+res+'-'+stat;
      }
      function idleExpShopIdApercu_(res,stat){
        return 'idle-exp-cost-'+res+'-'+stat;
      }

      /*
       * Boutons d'achat (Norman, 2026-10-04) : « les prix ne doivent pas être dans les boutons ; boutons plus petits, qui montrent juste que l'achat sera effectué ; les explications, le prix etc. dans la partie sombre
       * du cadre ». Le bouton ne dit donc que « Acheter » (et la quantité) ; le prix et le gain de chaque quantité sont écrits dans la carte (idleExpPrixCarteIdleV1_).
       */
      function idleExpLibelleAchatIdleV1_(q){return q>1?'Acheter ×'+q:'Acheter';}
      function idleExpPrixCarteIdleV1_(lignes,unite){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const liste=(lignes||[]).filter(Boolean);
        if(!liste.length)return '';
        return '<div class="soreal-idle-exp-prix-v1">'+liste.map(function(l){
          return '<span class="soreal-idle-exp-prix-ligne-v1">'+(l.q>1?'<i>×'+H.idleEntier_(l.q)+'</i>':'<i>Prix</i>')+(l.gain!=null&&l.gain!==''?'<em>+'+l.gain+'</em>':'')+'<b>'+l.cout+' '+(unite||'EXP')+'</b></span>';
        }).join('')+'</div>';
      }

      function idleExpShopBoutonsLotIdleV1_(res,stat,achat){
        const tiers=Array.isArray(achat.bulkTiers)&&achat.bulkTiers.length?achat.bulkTiers:[1];
        const prix=idleExpPrixCarteIdleV1_(tiers.map(function(qty){
          return {q:qty,gain:window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_((achat.gain||0)*qty,2),cout:window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_((achat.cost||0)*qty)};
        }),'EXP');
        return prix+'<div class="soreal-idle-exp-actions-v210">'+tiers.map(function(qty){
          return '<button type="button" class="soreal-idle-exp-buy-v210" onclick="window.__acheterRessourceMetaIdleV130__(\''+
            window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(res)+'\',\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(stat)+'\','+qty+')">'+idleExpLibelleAchatIdleV1_(qty)+'</button>';
        }).join('')+'</div>';
      }

      function idleExpShopLotPersonnaliseIdleV1_(res,stat,achat){
        const idInput=idleExpShopIdInput_(res,stat);
        const idApercu=idleExpShopIdApercu_(res,stat);
        const coutUnitaire=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(achat.cost||0);
        return '<div class="soreal-idle-exp-custom-v210">'+
          '<label>Quantité personnalisée · <span class="soreal-idle-exp-prix-custom-v1"><b><span id="'+idHtml_attr_(idApercu)+'">'+coutUnitaire+'</span> EXP</b></span></label>'+
          '<input type="number" min="1" step="1" value="1" id="'+idHtml_attr_(idInput)+'" '+
            'oninput="window.__idleExpShopApercuLotPersonnalise__(\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(res)+'\',\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(stat)+'\','+coutUnitaire+')">'+
          '<button type="button" class="soreal-idle-exp-buy-v210 primary" onclick="window.__acheterRessourceLotPersonnaliseMetaIdleV130__(\''+
            window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(res)+'\',\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(stat)+'\')">'+
            'Acheter'+
          '</button>'+
        '</div>';
      }

      function idHtml_attr_(v){const a=window.__SOREAL_IDLE_TEXT_TRANSFORMS_V1__;return a&&a.attr?a.attr(v):String(v||'');}

      window.__idleExpShopApercuLotPersonnalise__=function(res,stat,coutUnitaire){
        const input=document.getElementById(idleExpShopIdInput_(res,stat));
        const apercu=document.getElementById(idleExpShopIdApercu_(res,stat));
        if(!input||!apercu)return;
        let qty=Math.floor(Number(input.value));
        if(!Number.isFinite(qty)||qty<1)qty=1;
        apercu.textContent=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(coutUnitaire*qty);
      };

      function idleExpShopNewbieOffersIdleV1_(res,stat,offres,utilisees){
        const restantes=(offres||[]).filter(function(o){return utilisees.indexOf(o.id)===-1;});
        if(!restantes.length)return '';
        return '<div class="soreal-idle-exp-newbie-v210">'+
          '<div class="soreal-idle-window-title-v31">🎁 Offres débutant</div>'+
          '<div class="soreal-idle-note-v4">Offres à usage unique : elles disparaissent après achat.</div>'+
          '<div class="soreal-idle-exp-actions-v210">'+
            restantes.map(function(o){
              return '<div class="soreal-idle-exp-offre-v1">'+idleExpPrixCarteIdleV1_([{q:1,gain:window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(o.gain,2),cout:window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(o.cost)}],'EXP')+
                '<button type="button" class="soreal-idle-exp-buy-v210 offer" onclick="window.__acheterNewbieOfferMetaIdleV130__(\''+
                window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(res)+'\',\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(stat)+'\',\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(o.id)+'\')">Offre unique</button></div>';
            }).join('')+
          '</div>'+
        '</div>';
      }

      function idleExpShopStatBlocIdleV1_(res,stat,x,achat,verrou,newbieCatalogue,newbieUtilisees){
        const auMax=achat&&window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(x[stat.id])>=achat.hardCap-1e-9;
        const verrouille=achat&&achat.unlockBoss&&verrou&&verrou.unlocked===false;
        /* ANTI-SPOIL (2026-09-24) : un achat encore verrouillé (ex. Puissance / Plafond avant le boss requis) n'est pas montré du tout. */
        if(verrouille)return '';
        return '<div class="soreal-idle-exp-stat-v210">'+
          '<div class="soreal-idle-exp-stat-head-v210">'+
            '<span class="soreal-idle-exp-titrebloc-v1">'+idleExpTitreAvecImageIdleV1_(stat.icone+' '+stat.nom)+idleExpPointIdleV1_('res:'+res.id+':'+stat.id)+'</span>'+
            '<div class="soreal-idle-exp-current-v211"><small>Actuel</small><strong>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(x[stat.id]||0,2)+'</strong></div>'+
          '</div>'+
          '<div class="soreal-idle-exp-help-v210">'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(stat.explication||'')+'</div>'+
          (!achat
            ?'<div class="soreal-idle-note-v4">Indisponible.</div>'
            :auMax
              ?'<div class="soreal-idle-exp-max-v210">✔ Maximum atteint</div>'
              :idleExpShopBoutonsLotIdleV1_(res.id,stat.id,achat)+
                idleExpShopLotPersonnaliseIdleV1_(res.id,stat.id,achat)+
                idleExpShopNewbieOffersIdleV1_(res.id,stat.id,(newbieCatalogue&&newbieCatalogue[stat.id])||null,newbieUtilisees)
          )+
        '</div>';
      }

      /*
       * 2026-09-24 (Norman : « Exp shop a trop de catégories. On s'y perd… Il y a des choses qu'on doit acheter très tôt, du genre le
       * filtre à loot, mais il est perdu tout en bas. Un nouveau joueur ne le trouvera jamais. Je n'aime pas le blanc que tu as mis en
       * fond. Utilise le même bleu que dans la bannière "Boutique EXP" ») : la page est découpée en ONGLETS (un seul à l'écran), le
       * premier « 🚀 Débuts » regroupe les achats bon marché à faire tôt ; les cartes reprennent le bleu de la bannière de la page.
       */
      const IDLE_EXP_ONGLETS_V1=[
        {id:'debuts',icone:'🚀',nom:'Débuts'},
        {id:'toc',icone:'🧰',nom:'Toc'},
        {id:'energy',icone:'⚡',nom:'Énergie'},
        {id:'magic',icone:'✨',nom:'Magie'},
        {id:'r3',icone:'🧪',nom:'Ressource 3'},
        {id:'aventure',icone:'⚔️',nom:'Aventure'},
        {id:'slots',icone:'🎒',nom:'Slots & options'}
      ];
      /* Achats bon marché et utiles dès le début, dans l'ordre conseillé (du moins cher au plus cher). */
      const IDLE_EXP_DEBUTS_V1=['inventorySpace','basicLootFilter','boostRecycling','autoMerge','daycareSlot1','trainingAutoAdvance'];
      /* Rayon « Toc » (Norman, 2026-10-02) : les petits outils de confort, bon marché. */
      const IDLE_EXP_TOC_V1=['sortInventory','syncBasicTraining','menuAnimations'];
      const IDLE_EXP_STATS_AVENTURE_V1=['adventurePower','adventureToughness','adventureHp','adventureRegen'];
      /* Gestes du sac, rayon « Aventure » (Norman, 2026-10-04) : Double tap 20 EXP, Triple tap 30 EXP. */
      const IDLE_EXP_GESTES_V1=['doubleTap','tripleTap'];
      const IDLE_EXP_NOMS_V1=window.__SOREAL_IDLE_EXP_NOMS_V1__={adventurePower:'⚔️ Puissance d’aventure',adventureToughness:'🛡️ Robustesse d’aventure',adventureHp:'❤️ PV max d’aventure',adventureRegen:'💗 Régénération d’aventure',inventorySpace:'🎒 Espaces d’inventaire',accessorySlot1:'💍 Slot d’accessoire',accessorySlot2:'💍 Autre slot d’accessoire',diggerSlot:'⛏️ Slot de Digger',daycareSlot1:'🛠️ Item Daycare (1er slot de garderie)',daycareSlot2:'🛠️ Autre slot de garderie',daycareSlot3:'🛠️ Encore un slot de garderie',beardSlot:'🧔 Slot de Beard',autoMerge:'🔁 Auto Merge (fusion automatique)',sortInventory:'🗂️ Trier l’inventaire',menuAnimations:'🎞️ Menus animés',syncBasicTraining:'🔗 Synchro Basic Training',doubleTap:'👆 Double tap',tripleTap:'👆 Triple tap',basicLootFilter:'🧹 Filtre de butin basique',loadoutSlots:'🎽 2 emplacements de configuration',loadoutSlot3:'🎽 Autre emplacement de configuration',boostRecycling:'♻️ Recyclage des boosts (+10 % par achat)',inventoryMergeSlot:'🟦 Slot d’automerge',trainingAutoAdvance:'🏋️ Avance automatique de l’entraînement'};
      /* Une ligne d'explication pour les achats de l'onglet Débuts (effets déjà décrits dans le jeu : panneau d'inventaire, Basic Training). */
      const IDLE_EXP_AIDES_V1={
        inventorySpace:'Plus de places dans ton sac : les premières sont les moins chères.',
        basicLootFilter:'Débloque le filtre de butin : choisis les types d’objets à ne plus ramasser (menu Inventory).',
        boostRecycling:'Un boost utilisé peut revenir avec un palier de moins : +10 % de chance par achat, 50 % au maximum.',
        autoMerge:'Fusionne automatiquement les doublons de ton équipement (menu Inventory).',
        sortInventory:'Débloque un bouton « Trier » dans ton sac (menu Inventory) qui range tes objets par catégorie.',
        menuAnimations:'Les boutons du menu du haut s’animent quand le menu est actif (énergie, magie ou ressource 3 placée dedans, combat en cours…) : tu vois d’un coup d’œil ce qui travaille.',
        syncBasicTraining:'Ajoute une case à cocher sous Input dans Basic Training : cochée, l’énergie que tu places dans une compétence est placée en même temps dans sa jumelle (Attaque passive et Blocage…), pour qu’elles montent exactement à la même vitesse.',
        daycareSlot1:'Débloque le premier slot de l’Item Daycare.',
        trainingAutoAdvance:'Basic Training passe tout seul à la compétence suivante.',
        doubleTap:'Appuie deux fois vite sur un objet (équipé ou non) : il absorbe tous les boosts de ton inventaire. Sur PC : clic droit sur l’objet (au sac ou équipé) ; avec le Triple tap, le clic droit fusionne d’abord les pièces identiques, puis absorbe les boosts quand il n’y en a plus.',
        tripleTap:'Appuie trois fois vite sur un objet (équipé ou non) : il fusionne automatiquement avec toutes les pièces identiques disponibles. Sur PC : clic droit sur l’objet (au sac ou équipé) ; avec le Double tap, quand plus aucune pièce n’est disponible, le clic droit absorbe les boosts.'
      };
      let idleExpOngletV1=(function(){try{return localStorage.getItem('soreal_idle_exp_onglet_v1')||'debuts';}catch(e){return 'debuts';}})();

      /*
       * ANTI-SPOIL (Norman, 2026-09-24 : « Magie, Ressource 3, ils ne doivent pas savoir que ça existe. Ils doivent être surpris quand ils
       * le débloquent. Pense toujours comme ça dans le jeu. ») : la boutique ne montre QUE ce que le joueur a déjà débloqué — un onglet
       * ou un achat lié à un système encore verrouillé n'apparaît pas du tout (ni onglet, ni cadenas, ni prix).
       */
      const IDLE_EXP_SYSTEME_DE_L_ACHAT_V1={
        adventurePower:'adventure',adventureToughness:'adventure',adventureHp:'adventure',adventureRegen:'adventure',
        inventorySpace:'adventure',accessorySlot1:'adventure',accessorySlot2:'adventure',autoMerge:'adventure',sortInventory:'adventure',syncBasicTraining:'adventure',doubleTap:'adventure',tripleTap:'adventure',basicLootFilter:'adventure',
        loadoutSlots:'adventure',loadoutSlot3:'adventure',boostRecycling:'adventure',inventoryMergeSlot:'adventure',
        diggerSlot:'diggers',beardSlot:'beards',daycareSlot1:'daycare',daycareSlot2:'daycare',daycareSlot3:'daycare',
        macguffinSlot1:'macguffins',macguffinSlot2:'macguffins'
      };
      function idleExpSystemeDebloqueIdleV1_(j,m,systeme){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        if(!systeme)return true;
        if(systeme==='adventure')return Boolean(m.records&&H.idleNombre_(m.records.highestBoss)>=4);
        const sys=systemeMetaParIdIdleV130_(j,systeme);
        return Boolean(sys&&sys.state&&sys.state.unlocked);
      }
      function idleExpAchatVisibleIdleV1_(j,m,it){
        if(!it)return false;
        const systeme=it.yggFruit?'yggdrasil':IDLE_EXP_SYSTEME_DE_L_ACHAT_V1[it.id];
        return idleExpSystemeDebloqueIdleV1_(j,m,systeme);
      }
      function idleExpOngletsVisiblesIdleV1_(j,m){
        const tous=Array.isArray(m.expShop)?m.expShop:[];
        const visible=function(it){return idleExpAchatVisibleIdleV1_(j,m,it);};
        const resteSlots=tous.some(function(it){
          return visible(it)&&IDLE_EXP_DEBUTS_V1.indexOf(it.id)===-1&&IDLE_EXP_TOC_V1.indexOf(it.id)===-1&&IDLE_EXP_STATS_AVENTURE_V1.indexOf(it.id)===-1&&IDLE_EXP_GESTES_V1.indexOf(it.id)===-1;
        });
        const resteToc=tous.some(function(it){return visible(it)&&IDLE_EXP_TOC_V1.indexOf(it.id)!==-1;});
        return IDLE_EXP_ONGLETS_V1.filter(function(o){
          if(o.id==='toc')return resteToc;
          if(o.id==='magic')return idleExpSystemeDebloqueIdleV1_(j,m,'bloodMagic');
          if(o.id==='r3')return idleExpSystemeDebloqueIdleV1_(j,m,'hacks');
          if(o.id==='aventure')return idleExpSystemeDebloqueIdleV1_(j,m,'adventure');
          if(o.id==='slots')return resteSlots;
          return true;
        });
      }
      /* Achats actuellement visibles de la boutique EXP, par rayon (point rouge « nouveau », modules/boutique-nouveautes-v1.js). Seuls les achats que le joueur voit déjà sont comptés. */
      function idleExpAchatsParRayonIdleV1_(j){
        const m=j&&j.systemes?j.systemes:null;
        if(!m||!Array.isArray(m.expShop))return {};
        const tous=m.expShop;
        const parId=function(id){return tous.find(function(it){return it.id===id;});};
        const visible=function(it){return it&&idleExpAchatVisibleIdleV1_(j,m,it);};
        const ids=function(liste){return liste.map(parId).filter(visible).map(function(it){return it.id;});};
        const sortie={};
        sortie.debuts=ids(IDLE_EXP_DEBUTS_V1);
        sortie.toc=ids(IDLE_EXP_TOC_V1);
        sortie.aventure=ids(IDLE_EXP_STATS_AVENTURE_V1.concat(IDLE_EXP_GESTES_V1));
        sortie.slots=tous.filter(function(it){
          return visible(it)&&!it.yggFruit&&IDLE_EXP_DEBUTS_V1.indexOf(it.id)===-1&&IDLE_EXP_TOC_V1.indexOf(it.id)===-1&&IDLE_EXP_STATS_AVENTURE_V1.indexOf(it.id)===-1&&IDLE_EXP_GESTES_V1.indexOf(it.id)===-1;
        }).map(function(it){return it.id;}).concat(tous.filter(function(it){return it.yggFruit&&visible(it);}).map(function(it){return it.id;}));
        ['energy','magic','r3'].forEach(function(res){
          const couts=(m.resourcePurchases||{})[res]||{};
          const verrous=(m.resourcePurchaseUnlock||{})[res]||{};
          sortie[res]=IDLE_SPEND_EXP_STATS_V1.filter(function(stat){
            const achat=couts[stat.id],verrou=verrous[stat.id];
            return !(achat&&achat.unlockBoss&&verrou&&verrou.unlocked===false);
          }).map(function(stat){return 'res:'+res+':'+stat.id;});
        });
        /* Seuls les rayons que le joueur peut ouvrir comptent. */
        const ouverts={};
        idleExpOngletsVisiblesIdleV1_(j,m).forEach(function(o){if(sortie[o.id]&&sortie[o.id].length)ouverts[o.id]=sortie[o.id];});
        return ouverts;
      }
      window.__SOREAL_IDLE_EXP_ACHATS_V1__=idleExpAchatsParRayonIdleV1_;
      function idleExpPointIdleV1_(id){
        const B=window.__SOREAL_IDLE_BOUTIQUE_V1__;
        return B&&B.estNouveau('exp',id)?B.point('Nouvel achat'):'';
      }
      function idleExpOngletCourantV1_(visibles){
        const liste=visibles||IDLE_EXP_ONGLETS_V1;
        return liste.some(function(o){return o.id===idleExpOngletV1;})?idleExpOngletV1:'debuts';
      }
      window.__ongletExpShopIdleV1__=function(id){
        if(!IDLE_EXP_ONGLETS_V1.some(function(o){return o.id===id;}))return;
        idleExpOngletV1=id;
        try{localStorage.setItem('soreal_idle_exp_onglet_v1',id);}catch(e){}
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        if(H.getIdleEtat())H.rendreIdleEtat_({ok:true,joueur:H.getIdleEtat()});
      };

      /*
       * Image de chaque achat de la boutique EXP (Norman, 2026-10-04 : « je n'ai pas les images dans la boutique EXP ») : le wiki NGU Idle n'illustre pas ces achats, l'emoji du titre devient donc une vignette
       * (même place et même taille que les images de la boutique AP) et le titre garde le texte seul. Un achat sans emoji reçoit une vignette neutre.
       */
      const IDLE_EXP_EMOJI_DEBUT_V1=/^((?:\p{Extended_Pictographic}\uFE0F?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*)+)\s*([\s\S]*)$/u;
      /* Vraies illustrations du rayon Toc (Norman, 2026-10-04 : trois images, une par achat, nommées d'après le menu qu'elles concernent) : fichiers de /shop/ ; si une image manque, la vignette à emoji reste. */
      const IDLE_EXP_PHOTOS_V1={sortInventory:'exp-inventaire',syncBasicTraining:'exp-basic-training',menuAnimations:'exp-menus'};
      function idleExpTitreAvecImageIdleV1_(titreHtml,id){
        const m=IDLE_EXP_EMOJI_DEBUT_V1.exec(String(titreHtml||''));
        const icone=m?m[1]:'✦';
        const texte=m?m[2]:String(titreHtml||'');
        const photo=id&&IDLE_EXP_PHOTOS_V1[id];
        const image=photo?'<img src="/shop/'+photo+'.png" alt="" width="64" height="64" loading="eager" decoding="async" onerror="this.remove()">':'';
        return '<span class="soreal-idle-exp-img-v1'+(photo?' avec-photo':'')+'" aria-hidden="true">'+icone+image+'</span><span class="soreal-idle-exp-titre-v1">'+texte+'</span>';
      }
      function idleExpShopItemCarteIdleV1_(it,aide){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const fini=it.nextCost==null;
        const restants=Array.isArray(it.remainingCosts)?it.remainingCosts:null;
        let tiers=it.max!=null&&it.max>1?[1,5,10]:it.max===1?[1]:[1,10,100];
        /* Jamais plus d'achats que ce qu'il en reste (Norman, 2026-10-05 : « Recyclage de boosts propose d'acheter par 10 alors que le maximum est 5 ») : les paliers qui dépassent le reste disparaissent, et le reste lui-même devient un palier s'il est inférieur à 10. */
        if(it.max!=null&&it.max>1){
          const reste=Math.max(1,it.max-H.idleEntier_(it.purchased));
          tiers=tiers.filter(function(q){return q<=reste;});
          if(reste>1&&reste<10&&tiers.indexOf(reste)===-1)tiers.push(reste);
        }
        /* Prix variable (espaces d'inventaire) : montants réellement payés, et bouton « tout » pour les places restantes. */
        if(restants&&restants.length>10)tiers=tiers.concat([restants.length]);
        const coutTotal=function(q){return restants?restants.slice(0,q).reduce(function(a,b){return a+b;},0):H.idleEntier_(it.nextCost)*q;};
        const boutons=tiers.map(function(q){
          return `<button type="button" class="soreal-idle-exp-buy-v210" onclick="window.__acheterExpShopIdleV1__('${H.idleHtml_(it.id)}',${q})">${idleExpLibelleAchatIdleV1_(q)}</button>`;
        }).join('');
        /* Prix et gain de chaque quantité : écrits dans la carte (jamais dans les boutons). Prix variable : le total réellement payé. */
        const prixCarte=fini?'':idleExpPrixCarteIdleV1_(tiers.map(function(q){return {q:q,gain:(it.max===1&&q===1)?'':H.formatGrandNombreIdleV70_((it.gain||0)*q,2),cout:H.formatGrandNombreIdleV70_(coutTotal(q),2)};}),'EXP');
        return `<div class="soreal-idle-exp-stat-v210"><div class="soreal-idle-exp-stat-head-v210"><span class="soreal-idle-exp-titrebloc-v1">${idleExpTitreAvecImageIdleV1_(IDLE_EXP_NOMS_V1[it.id]||H.idleHtml_(it.name),it.id)}${idleExpPointIdleV1_(it.id)}</span><div class="soreal-idle-exp-current-v211"><small>Acheté</small><strong>${H.idleEntier_(it.purchased)}${it.max!=null?' / '+H.idleEntier_(it.max):''}</strong></div></div>`+
          (aide?`<div class="soreal-idle-exp-help-v210">${H.idleHtml_(aide)}</div>`:'')+prixCarte+
          (fini?'<div class="soreal-idle-exp-max-v210">✔ Maximum atteint</div>':`<div class="soreal-idle-exp-actions-v210">${boutons}</div>`)+
          '</div>';
      }

      function idleExpShopRichJerksIdleV1_(m){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const rj=m.richJerks||{};
        return ['attack','defense'].map(function(stat){
          const niveau=stat==='attack'?rj.attackLevel:rj.defenseLevel;
          const boutons=[1,10,100].map(function(q){
            return `<button type="button" class="soreal-idle-exp-buy-v210" onclick="window.__acheterRichJerksIdleV1__('${stat}',${q})">${idleExpLibelleAchatIdleV1_(q)}</button>`;
          }).join('');
          return `<div class="soreal-idle-exp-stat-v210"><div class="soreal-idle-exp-stat-head-v210"><span class="soreal-idle-exp-titrebloc-v1">${idleExpTitreAvecImageIdleV1_((stat==='attack'?'🗡️ Attaque':'🛡️ Défense')+' pour riches (Rich Jerks)')}</span><div class="soreal-idle-exp-current-v211"><small>Niveau</small><strong>${H.idleEntier_(niveau||0)}</strong></div></div>${idleExpPrixCarteIdleV1_([1,10,100].map(function(q){return {q:q,gain:H.idleEntier_((rj.pctPerLevel||10)*q)+' %',cout:H.idleEntier_((rj.cost||30)*q)};}),'EXP')}<div class="soreal-idle-exp-actions-v210">${boutons}</div></div>`;
        }).join('');
      }

      /* Wiki Experience, section Yggdrasil : activation automatique et gratuite ; cap Energy/Magic total >= 10x le coût d'activation. */
      function idleExpShopYggIdleV1_(items){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        if(!items.length)return '';
        return '<div class="soreal-idle-exp-resource-v210">🌱 Yggdrasil : Auto-Activate</div>'+
          items.map(function(it){
            const fini=it.nextCost==null;
            return `<div class="soreal-idle-exp-stat-v210"><div class="soreal-idle-exp-stat-head-v210"><span class="soreal-idle-exp-titrebloc-v1">${idleExpTitreAvecImageIdleV1_(H.idleHtml_(it.name))}${idleExpPointIdleV1_(it.id)}</span><div class="soreal-idle-exp-current-v211"><small>Cap requis</small><strong>${H.formatGrandNombreIdleV70_(it.requiredCap||0)} ${it.resource==='magic'?'Magic':'Energy'}</strong></div></div>`+
              (fini?'<div class="soreal-idle-exp-max-v210">✔ Acheté : activation automatique et gratuite</div>':idleExpPrixCarteIdleV1_([{q:1,gain:'',cout:H.formatGrandNombreIdleV70_(it.nextCost)}],'EXP')+`<div class="soreal-idle-exp-actions-v210"><button type="button" class="soreal-idle-exp-buy-v210" onclick="window.__acheterExpShopIdleV1__('${H.idleHtml_(it.id)}',1)">Acheter</button></div>`)+
              '</div>';
          }).join('');
      }

      /* Achats de l'onglet Débuts encore abordables avec l'EXP actuelle (pastille sur l'onglet). */
      function idleExpDebutsAbordablesIdleV1_(j,m,exp){
        const tous=Array.isArray(m.expShop)?m.expShop:[];
        return IDLE_EXP_DEBUTS_V1.filter(function(id){
          const it=tous.find(function(x){return x.id===id;});
          return it&&idleExpAchatVisibleIdleV1_(j,m,it)&&it.nextCost!=null&&it.nextCost<=exp;
        }).length;
      }

      function idleExpShopContenuOngletIdleV1_(j,m,onglet){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const tous=Array.isArray(m.expShop)?m.expShop:[];
        const parId=function(id){return tous.find(function(it){return it.id===id;});};
        if(onglet==='debuts'){
          const cartes=IDLE_EXP_DEBUTS_V1.map(parId).filter(function(it){return it&&idleExpAchatVisibleIdleV1_(j,m,it);}).map(function(it){return idleExpShopItemCarteIdleV1_(it,IDLE_EXP_AIDES_V1[it.id]);}).join('');
          return '<div class="soreal-idle-exp-intro-v212">🚀 <b>À acheter tôt.</b> Ces achats sont peu chers et rendent la partie bien plus confortable ; dans l’ordre conseillé.</div>'+cartes;
        }
        if(onglet==='toc'){
          const cartes=IDLE_EXP_TOC_V1.map(parId).filter(function(it){return it&&idleExpAchatVisibleIdleV1_(j,m,it);}).map(function(it){return idleExpShopItemCarteIdleV1_(it,IDLE_EXP_AIDES_V1[it.id]);}).join('');
          return '<div class="soreal-idle-exp-intro-v212">🧰 <b>J’ai des TOC, mais au moins ils sont bien rangés.</b></div>'+cartes;
        }
        if(onglet==='energy'||onglet==='magic'||onglet==='r3'){
          /* Un onglet de ressource verrouillé n'est jamais proposé (voir idleExpOngletsVisiblesIdleV1_) : aucun message « verrouillé ». */
          const x=(m.resources||{})[onglet]||{};
          const couts=(m.resourcePurchases||{})[onglet]||{};
          const verrous=(m.resourcePurchaseUnlock||{})[onglet]||{};
          const newbie=m.newbieOffers||{};
          const catalogue=((newbie.catalog||{})[onglet])||{};
          const utilisees=Array.isArray(newbie.used)?newbie.used:[];
          return IDLE_SPEND_EXP_STATS_V1.map(function(stat){
            return idleExpShopStatBlocIdleV1_({id:onglet},stat,x,couts[stat.id],verrous[stat.id],catalogue,utilisees);
          }).join('');
        }
        if(onglet==='aventure'){
          return IDLE_EXP_STATS_AVENTURE_V1.concat(IDLE_EXP_GESTES_V1).map(parId).filter(function(it){return it&&idleExpAchatVisibleIdleV1_(j,m,it);}).map(function(it){return idleExpShopItemCarteIdleV1_(it,null);}).join('')+idleExpShopRichJerksIdleV1_(m);
        }
        /* slots : tout le reste (hors Débuts et statistiques d'aventure), puis Yggdrasil */
        const reste=tous.filter(function(it){
          return idleExpAchatVisibleIdleV1_(j,m,it)&&!it.yggFruit&&IDLE_EXP_DEBUTS_V1.indexOf(it.id)===-1&&IDLE_EXP_TOC_V1.indexOf(it.id)===-1&&IDLE_EXP_STATS_AVENTURE_V1.indexOf(it.id)===-1&&IDLE_EXP_GESTES_V1.indexOf(it.id)===-1;
        });
        return reste.map(function(it){return idleExpShopItemCarteIdleV1_(it,null);}).join('')+idleExpShopYggIdleV1_(tous.filter(function(it){return it.yggFruit&&idleExpAchatVisibleIdleV1_(j,m,it);}));
      }

      /*
       * Style « boutique » partagé par la Boutique EXP et la Boutique AP (Norman, 2026-09-24 : « le même style pour la boutique AP que pour la
       * XP Shop, mais d'une autre couleur »). La couleur vient de --nav-color, posée sur la page par le menu (IDLE_NAV_COULEURS_V1).
       */
      function idleBoutiqueCssIdleV1_(){
        const bleu='var(--nav-color,#0891b2)';
        const fond1='color-mix(in srgb,'+bleu+' 60%,#0b1020)';
        const fond2='color-mix(in srgb,'+bleu+' 38%,#1a2340)';
        /*
         * 2026-09-24 (Norman : « Mets 2 nuances de couleurs dans EXP Shop. Essaie de le rendre joli. Ça doit nous faire penser à un
         * magasin ») : deux nuances = les deux extrémités du dégradé de la bannière (fond1 60 %, fond2 38 %), en alternance d'une carte
         * à l'autre ; décor de boutique : auvent rayé à festons, caisse (EXP disponible) avec enseigne « OUVERT », rayons (onglets)
         * suspendus, produits posés sur une étagère, boutons en étiquettes de prix, « épuisé » en tampon.
         */
        const css=[
          `.soreal-idle-exp-shop-v213{margin:0 0 14px;border-radius:18px;overflow:hidden;background:${fond2};border:1px solid color-mix(in srgb,${bleu} 55%,transparent);box-shadow:0 10px 26px rgba(0,0,0,.28)}`,
          `.soreal-idle-exp-awning-v213{position:relative;height:30px;margin-bottom:14px;background:repeating-linear-gradient(90deg,${bleu} 0 26px,${fond1} 26px 52px)}`,
          `.soreal-idle-exp-awning-v213::after{content:"";position:absolute;left:0;right:0;top:100%;height:14px;background:radial-gradient(circle at 13px 0,${bleu} 12.5px,transparent 13.5px) 0 0/52px 14px repeat-x,radial-gradient(circle at 13px 0,${fond1} 12.5px,transparent 13.5px) 26px 0/52px 14px repeat-x;filter:drop-shadow(0 3px 2px rgba(0,0,0,.25))}`,
          `.soreal-idle-exp-balance-v210{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 14px 12px;padding:12px 14px;border-radius:14px;background:${fond1};color:#fff;border:2px solid rgba(255,255,255,.22);box-shadow:inset 0 2px 8px rgba(0,0,0,.35)}`,
          `.soreal-idle-exp-balance-v210 span{font-size:14px;font-weight:900;letter-spacing:.03em;color:#fff}.soreal-idle-exp-balance-v210 b{display:inline-flex;align-items:center;justify-content:center;min-width:72px;padding:6px 12px;border-radius:9px;background:#07111f;color:#7ff0c0;font-size:17px;font-family:ui-monospace,Consolas,monospace;letter-spacing:.04em;box-shadow:inset 0 0 0 2px rgba(255,255,255,.14)}`,
          `.soreal-idle-exp-open-v213{padding:2px 9px;border-radius:999px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.3);color:#c9f7dd;font-size:11px;font-weight:1000;letter-spacing:.14em}`,
          `.soreal-idle-exp-aisles-v213{display:flex;align-items:center;justify-content:space-between;margin:0 14px 4px;font-size:11px;font-weight:1000;letter-spacing:.16em;text-transform:uppercase;color:#a9cfdc}`,
          `.soreal-idle-exp-titrebloc-v1{display:inline-flex;align-items:center;gap:10px;min-width:0}`,
          `.soreal-idle-exp-img-v1{flex:0 0 auto;width:46px;height:46px;display:inline-flex;align-items:center;justify-content:center;font-size:27px;line-height:1;border-radius:12px;background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.28),rgba(255,255,255,.04) 62%),linear-gradient(145deg,#27597a,#12304a);border:1px solid rgba(160,215,240,.45);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 2px 5px rgba(0,0,0,.4)}`,
          `.soreal-idle-exp-img-v1{position:relative}`,
          `.soreal-idle-exp-img-v1.avec-photo{width:64px;height:64px;padding:0;overflow:hidden}`,
          `.soreal-idle-exp-img-v1 img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;image-rendering:pixelated;border-radius:inherit}`,
          `.soreal-idle-exp-titre-v1{min-width:0}`,
          `.soreal-idle-exp-tabs-v212{display:flex;gap:7px;flex-wrap:wrap;margin:0 14px 16px;padding-top:6px}`,
          `.soreal-idle-exp-tab-v212{appearance:none;cursor:pointer;position:relative;padding:9px 13px;border-radius:4px 4px 14px 14px;border:1px solid rgba(255,255,255,.22);background:${fond1};color:#e8f4f8;font-size:14px;font-weight:900;display:inline-flex;align-items:center;gap:6px}`,
          `.soreal-idle-exp-tab-v212::before{content:"";position:absolute;left:50%;top:-8px;width:2px;height:8px;background:rgba(255,255,255,.4);transform:translateX(-50%)}`,
          `.soreal-idle-exp-tab-v212:hover{background:color-mix(in srgb,${bleu} 72%,#0b1020)}`,
          `.soreal-idle-exp-tab-v212.actif{background:${bleu};border-color:#fff;color:#fff;box-shadow:0 5px 14px color-mix(in srgb,${bleu} 55%,transparent)}`,
          `.soreal-idle-exp-pastille-v212{min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#f5c451;color:#3a2a00;font-size:13px;font-weight:1000;display:inline-flex;align-items:center;justify-content:center}`,
          `.soreal-idle-exp-shelves-v213{padding:0 14px 14px}`,
          `.soreal-idle-exp-intro-v212{margin:0 0 12px;padding:11px 13px 11px 40px;position:relative;border-radius:12px;background:rgba(245,196,81,.13);border:2px dashed rgba(245,196,81,.5);color:#f7e6b0;font-size:14px;line-height:1.5;font-weight:750}.soreal-idle-exp-intro-v212::before{content:"🏷️";position:absolute;left:11px;top:9px;font-size:18px}`,
          `.soreal-idle-exp-resource-v210{margin:16px 0 8px;padding:10px 13px;border-radius:12px;background:${fond1};color:#fff;border-left:4px solid ${bleu};font-size:15px;font-weight:1000}`,
          `.soreal-idle-exp-stat-v210{position:relative;margin:0 0 16px;padding:0 0 12px;border-radius:14px 14px 4px 4px;background:${fond1};color:#f2f8fb;border:1px solid rgba(255,255,255,.14);border-bottom:7px solid ${bleu};box-shadow:0 7px 0 rgba(0,0,0,.3),0 12px 16px rgba(0,0,0,.18)}`,
          `.soreal-idle-exp-shelves-v213>.soreal-idle-exp-stat-v210:nth-of-type(even){background:${fond2};border-color:rgba(255,255,255,.14);border-bottom-color:${fond1}}`,
          `.soreal-idle-exp-stat-head-v210{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:13px 13px 0 0;background:rgba(0,0,0,.22);color:#fff;font-size:14px;font-weight:1000}.soreal-idle-exp-stat-head-v210>span{min-width:0}`,
          `.soreal-idle-exp-stat-v210>:not(.soreal-idle-exp-stat-head-v210){margin-left:12px;margin-right:12px}`,
          `.soreal-idle-exp-current-v211{display:flex;align-items:baseline;gap:6px;flex:0 0 auto;padding:4px 8px;border-radius:8px;background:#07111f;color:#fff;border:1px solid rgba(255,255,255,.14)}.soreal-idle-exp-current-v211 small{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#9fc6d3;font-weight:900}.soreal-idle-exp-current-v211 strong{font-size:15px;color:#7ff0c0}`,
          `.soreal-idle-exp-help-v210{margin-top:8px;margin-bottom:10px;color:#c2dde6;font-size:13px;line-height:1.5;font-weight:750}`,
          `.soreal-idle-exp-stat-v210>.soreal-idle-exp-actions-v210:first-of-type{margin-top:10px}`,
          `.soreal-idle-exp-actions-v210{display:grid;grid-template-columns:repeat(auto-fit,minmax(122px,1fr));gap:8px}`,
          `.soreal-idle-exp-buy-v210{appearance:none;position:relative;min-height:50px;border:1px solid rgba(255,255,255,.28);border-radius:6px 12px 12px 6px;padding:8px 10px 8px 22px;background:${bleu};color:#fff !important;cursor:pointer;text-align:left;display:flex;flex-direction:column;justify-content:center;gap:2px;outline:1px dashed rgba(255,255,255,.35);outline-offset:-4px}`,
          `.soreal-idle-exp-buy-v210{min-height:0!important;padding:6px 14px!important;flex-direction:row!important;align-items:center;justify-content:center;gap:0!important;font-size:13px;font-weight:1000;letter-spacing:.03em;outline:none!important;border-radius:10px!important;text-align:center}`,
          `.soreal-idle-exp-buy-v210::before{display:none!important}`,
          `.soreal-idle-exp-prix-v1{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 8px}`,
          `.soreal-idle-exp-prix-ligne-v1{display:inline-flex;align-items:baseline;gap:7px;padding:4px 10px;border-radius:8px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.16);font-size:12.5px;color:#e9dcff}`,
          `.soreal-idle-exp-prix-ligne-v1 i{font-style:normal;font-weight:1000;color:#cdbbf2}.soreal-idle-exp-prix-ligne-v1 em{font-style:normal;font-weight:900;color:#9df0b4}.soreal-idle-exp-prix-ligne-v1 b{font-weight:1000;color:#ffe38a}`,
          `.soreal-idle-exp-prix-custom-v1 b{color:#ffe38a}.soreal-idle-exp-offre-v1{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:4px 0}.soreal-idle-exp-offre-v1 .soreal-idle-exp-prix-v1{margin:0}`,
          `.soreal-idle-exp-buy-v210::before{content:"";position:absolute;left:7px;top:50%;width:7px;height:7px;margin-top:-4px;border-radius:50%;background:${fond2};box-shadow:inset 0 0 0 1px rgba(255,255,255,.5)}`,
          `.soreal-idle-exp-buy-v210:hover{background:color-mix(in srgb,${bleu} 82%,#fff);transform:translateY(-1px)}.soreal-idle-exp-buy-v210:active{transform:translateY(0)}.soreal-idle-exp-buy-v210 b{font-size:14px;line-height:1.1;color:#fff !important}.soreal-idle-exp-buy-v210 small{font-size:12px;color:#e3f4fa !important;font-weight:900}`,
          `.soreal-idle-exp-buy-v210:disabled{opacity:.42;cursor:not-allowed;filter:grayscale(.45);transform:none}`,
          `.soreal-idle-exp-buy-v210.primary{background:#f5c451;border-color:#fff;color:#3a2a00 !important}.soreal-idle-exp-buy-v210.primary b,.soreal-idle-exp-buy-v210.primary small{color:#3a2a00 !important}.soreal-idle-exp-buy-v210.primary:hover{background:#ffd978}.soreal-idle-exp-buy-v210.offer{background:rgba(245,196,81,.22);border-color:rgba(245,196,81,.6);color:#ffeeb5 !important}.soreal-idle-exp-buy-v210.offer b,.soreal-idle-exp-buy-v210.offer small{color:#ffeeb5 !important}`,
          `.soreal-idle-exp-custom-v210{display:grid;grid-template-columns:minmax(120px,1fr) 90px minmax(112px,auto);gap:8px;align-items:end;margin-top:10px;padding-top:10px;border-top:2px dotted rgba(255,255,255,.2)}.soreal-idle-exp-custom-v210 label{grid-column:1/-1;font-size:12px;font-weight:900;color:#b9d6e0}.soreal-idle-exp-custom-v210 input{min-width:0;padding:9px;border-radius:9px;border:1px solid rgba(255,255,255,.22);background:rgba(0,0,0,.28);color:#fff;font-weight:800}`,
          `.soreal-idle-exp-newbie-v210{margin-top:10px;padding:10px;border-radius:11px;background:rgba(245,196,81,.11);border:2px dashed rgba(245,196,81,.4)}.soreal-idle-exp-newbie-v210 .soreal-idle-window-title-v31{margin-bottom:5px;padding:0;background:transparent;border:0;box-shadow:none;color:#f7e6b0}.soreal-idle-exp-newbie-v210 .soreal-idle-note-v4{color:#e9d9a3}`,
          `.soreal-idle-exp-lock-v210,.soreal-idle-exp-max-v210{padding:9px 10px;border-radius:10px;background:rgba(0,0,0,.22);color:#cfe6ee;border:1px solid rgba(255,255,255,.12);font-size:13px;font-weight:850}.soreal-idle-exp-max-v210{width:fit-content;background:rgba(52,199,89,.14);color:#a6f0bb;border:2px solid rgba(52,199,89,.5);border-radius:8px;transform:rotate(-1.5deg);letter-spacing:.04em;text-transform:uppercase}`,
          `@media(max-width:560px){.soreal-idle-exp-stat-head-v210{align-items:flex-start}.soreal-idle-exp-current-v211{flex-direction:column;gap:1px;align-items:flex-end}.soreal-idle-exp-actions-v210{grid-template-columns:repeat(2,minmax(0,1fr))}.soreal-idle-exp-custom-v210{grid-template-columns:1fr 1fr}.soreal-idle-exp-custom-v210 .primary{grid-column:1/-1}.soreal-idle-exp-tab-v212{flex:1 1 calc(50% - 7px);justify-content:center}.soreal-idle-exp-tabs-v212,.soreal-idle-exp-aisles-v213{margin-left:10px;margin-right:10px}.soreal-idle-exp-balance-v210{margin-left:10px;margin-right:10px}.soreal-idle-exp-shelves-v213{padding:0 10px 12px}}`
        ].join('');
        return css;
      }

      /*
       * Rayon COMPLET (Norman, 2026-10-05 : « un petit V vert comme celui des sets quand on a acheté tout ce que contient le rayon ; si je rajoute des articles, le V disparaît tant qu'on n'a pas fait ce nouvel achat »). Calculé à chaque affichage
       * sur les achats VISIBLES du rayon : tous au maximum (plus de prix suivant). Un nouvel article qui devient visible rend donc le rayon incomplet. Les rayons de ressources (Énergie, Magie, Ressource 3) n'ont pas de maximum : jamais de V.
       */
      function idleExpRayonCompletIdleV1_(j,rayon,ids){
        if(rayon==='energy'||rayon==='magic'||rayon==='r3')return false;
        const liste=(j&&j.systemes&&Array.isArray(j.systemes.expShop))?j.systemes.expShop:[];
        if(!Array.isArray(ids)||!ids.length)return false;
        return ids.every(function(id){const it=liste.find(function(x){return x.id===id;});return Boolean(it)&&it.nextCost==null;});
      }
      function pageSpendExpIdleV1_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const m=j&&j.systemes?j.systemes:{};
        const exp=H.idleEntier_((m.currencies&&m.currencies.experience)||0);
        const onglets_visibles=idleExpOngletsVisiblesIdleV1_(j,m);
        const onglet=idleExpOngletCourantV1_(onglets_visibles);
        const abordables=idleExpDebutsAbordablesIdleV1_(j,m,exp);
        const css=idleBoutiqueCssIdleV1_();
        /* Points rouges : ouvrir un rayon marque ses nouveaux achats comme vus (les cartes gardent leur point le temps de la visite). */
        const B=window.__SOREAL_IDLE_BOUTIQUE_V1__;
        const parRayon=B?idleExpAchatsParRayonIdleV1_(j):{};
        if(B)B.marquerRayon('exp',parRayon,onglet);
        const onglets=onglets_visibles.map(function(o){
          const actif=o.id===onglet;
          const pastille=(o.id==='debuts'&&abordables>0?`<span class="soreal-idle-exp-pastille-v212" title="Achats abordables">${abordables}</span>`:'')+(B&&B.rayonNonVu('exp',parRayon,o.id)?B.point('Nouveaux achats dans ce rayon'):'');
          return `<button type="button" class="soreal-idle-exp-tab-v212${actif?' actif':''}" aria-pressed="${actif}" onclick="window.__ongletExpShopIdleV1__('${o.id}')">${o.icone} ${o.nom}${pastille}${idleExpRayonCompletIdleV1_(j,o.id,parRayon[o.id])?'<span class="soreal-idle-rayon-complet-v1" title="Tout est acheté dans ce rayon">✔</span>':''}</button>`;
        }).join('');
        return H.entetePageIdleV28_(
          '✨ Boutique EXP',
          'Utilise ton EXP pour améliorer durablement ta partie. Commence par l’onglet 🚀 Débuts.'
        )+
        '<style>'+css+'</style>'+
        '<div class="soreal-idle-exp-shop-v213" data-rayon="'+onglet+'">'+
          '<div class="soreal-idle-exp-awning-v213" aria-hidden="true"></div>'+
          '<div class="soreal-idle-exp-balance-v210"><span>🪙 Ta caisse · EXP disponible</span><b>'+H.formatGrandNombreIdleV70_(exp)+'</b></div>'+
          '<div class="soreal-idle-exp-aisles-v213"><span>🧭 Rayons</span><span class="soreal-idle-exp-open-v213">● OUVERT</span></div>'+
          '<div class="soreal-idle-exp-tabs-v212" role="tablist">'+onglets+'</div>'+
          '<div class="soreal-idle-exp-shelves-v213">'+idleExpShopContenuOngletIdleV1_(j,m,onglet)+'</div>'+
        '</div>';
      }

      function acheterExpShopIdleV1_(item,quantite){
        actionMetaIdleV130_({action:'buyExpShop',item:String(item),quantity:Math.max(1,Math.floor(Number(quantite))||1)});
      }
      window.__acheterExpShopIdleV1__=acheterExpShopIdleV1_;
      function acheterRichJerksIdleV1_(stat,niveaux){
        actionMetaIdleV130_({action:'richJerks',stat:String(stat),levels:Math.max(1,Math.floor(Number(niveaux))||1)});
      }
      window.__acheterRichJerksIdleV1__=acheterRichJerksIdleV1_;

      function acheterRessourceMetaIdleV130_(ressource,stat,quantite){
        const payload={action:'buyResource',resource:ressource,stat:stat};
        const qty=Math.floor(Number(quantite));
        if(Number.isFinite(qty)&&qty>1)payload.quantity=qty;
        actionMetaIdleV130_(payload);
      }
      window.__acheterRessourceMetaIdleV130__=acheterRessourceMetaIdleV130_;

      function acheterRessourceLotPersonnaliseMetaIdleV130_(ressource,stat){
        const input=document.getElementById(idleExpShopIdInput_(ressource,stat));
        let qty=input?Math.floor(Number(input.value)):1;
        if(!Number.isFinite(qty)||qty<1)qty=1;
        acheterRessourceMetaIdleV130_(ressource,stat,qty);
      }
      window.__acheterRessourceLotPersonnaliseMetaIdleV130__=acheterRessourceLotPersonnaliseMetaIdleV130_;

      function acheterNewbieOfferMetaIdleV130_(ressource,stat,offerId){
        actionMetaIdleV130_({action:'buyNewbieOffer',resource:ressource,stat:stat,offerId:offerId});
      }
      window.__acheterNewbieOfferMetaIdleV130__=acheterNewbieOfferMetaIdleV130_;



      function selectionnerPisteMetaIdleV131_(
        systemeId,
        pisteId
      ){
        actionMetaIdleV130_({
          action:'selectTrack',
          system:systemeId,
          track:pisteId
        });
      }


      window.__selectionnerPisteMetaIdleV131__=
        selectionnerPisteMetaIdleV131_;


      function rendrePistesSystemeMetaIdleV131_(s){
        /* ANTI-SPOIL (AGENTS.md règle n°2) : une piste encore verrouillée n'apparaît pas du tout (ni cadenas, ni « Verrouillée »). */
        const pistes=
          Array.isArray(s&&s.tracks)
            ?s.tracks.filter(function(p){return p&&p.unlocked!==false;})
            :[];

        if(!pistes.length){
          return '';
        }

        return '<div class="soreal-idle-section-v8" style="margin-top:10px">'+
          '<div class="soreal-idle-window-title-v31">🎯 Piste active</div>'+
          '<div class="soreal-idle-shop-grid-v12">'+
            pistes.map(function(p){
              const st=p.state||{};
              const niveau=
                window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(st.level)+
                window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(st.tempLevel)+
                window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(st.permanentLevel);
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-300 */
              return '<button type="button" class="soreal-idle-expand-button-v25" style="'+
                (p.active?'outline:2px solid rgba(255,255,255,.65);':'')+
                '" '+
                'onclick="window.__selectionnerPisteMetaIdleV131__(\''+
                  window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(s.id)+
                  '\',\''+
                  window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(p.id)+
                  '\')"'+
                '>'+
                (p.active?'▶️ ':'')+
                window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(emojiNomIdleV1_(s.id,p.id,p.name||p.id))+
                ' · '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(niveau)+
                '<br><small>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(p.effect||'')+'</small>'+
              '</button>';
            }).join('')+
          '</div>'+
        '</div>';
      }


      function rendreAllocationsSystemeMetaIdleV130_(s){
        const ressources=
          Array.isArray(s&&s.resources)
            ?s.resources
            :[];

        if(!ressources.length){
          return '';
        }

        return '<div class="soreal-idle-shop-grid-v12">'+
          ressources.map(function(r){
            const valeur=
              window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(
                s.state&&
                s.state.allocation&&
                s.state.allocation[r]
              );

            return '<div class="soreal-idle-section-v8">'+
              '<div class="soreal-idle-window-title-v31">'+
                libelleRessourceMetaIdleV130_(r)+
              '</div>'+
              '<div class="soreal-idle-note-v4">'+
                'Allocation : <strong>'+valeur.toFixed(0)+' %</strong>'+
              '</div>'+
              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px">'+
                '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__ajusterAllocationMetaIdleV130__(\''+
                  window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(s.id)+
                  '\',\''+
                  window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(r)+
                  '\',-10)">−10 %</button>'+
                '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__ajusterAllocationMetaIdleV130__(\''+
                  window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(s.id)+
                  '\',\''+
                  window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(r)+
                  '\',10)">+10 %</button>'+
              '</div>'+
            '</div>';
          }).join('')+
        '</div>';
      }


      /*
       * Compte à rebours Money Pit / Daily Spin (Norman, 2026-10-03 : « tous les compteurs doivent être très précis »). Le texte était écrit une seule fois au dessin de la page :
       * il restait figé puis le bouton restait grisé après l'échéance. Chaque bouton porte maintenant son échéance (heure du SERVEUR) ; un minuteur met le texte à jour et,
       * à l'échéance, redessine la page une fois pour rendre le bouton actif.
       */
      function libelleRechargeMoneyPitIdleV1_(restantS){
        const h=Math.floor(restantS/3600);
        const m=Math.floor((restantS%3600)/60);
        const sec=restantS%60;
        return '🕳️ En recharge · '+(h>0?(h+'h '+m+'m'):(m>0?(m+'m '+sec+'s'):(sec+'s')));
      }
      function libelleRechargeDailySpinIdleV1_(restantS){
        const h=Math.floor(restantS/3600);
        const m=Math.floor((restantS%3600)/60);
        return '🎡 Prochain tour · '+(h>0?(h+'h '+m+'m'):(m>0?(m+'m'):(restantS+'s')));
      }
      let minuteurRechargeIdleV1=null;
      function demarrerMinuteurRechargeIdleV1_(){
        if(minuteurRechargeIdleV1||typeof setInterval!=='function')return;
        minuteurRechargeIdleV1=setInterval(function(){
        const boutons=document.querySelectorAll('[data-idle-recharge-v1]');
        if(!boutons.length)return;
        const maintenant=(typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now());
        let echu=false;
        boutons.forEach(function(b){
          const restantMs=Number(b.getAttribute('data-fin'))-maintenant;
          if(restantMs>0){
            const restantS=Math.ceil(restantMs/1000);
            const texte=b.getAttribute('data-idle-recharge-v1')==='pit'?libelleRechargeMoneyPitIdleV1_(restantS):libelleRechargeDailySpinIdleV1_(restantS);
            if(b.textContent!==texte)b.textContent=texte;
          }else echu=true;
        });
        if(echu){
          const racine=document.querySelector('.soreal-idle-page-root-v28');
          const H=window.__SOREAL_IDLE_META_HOST_V130__;
          if(racine&&H&&typeof H.rafraichirMenuRacineIdleV28_==='function'&&H.getIdleEtat())H.rafraichirMenuRacineIdleV28_();
        }
        },500);
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-301 */
      function rendreBoutonMoneyPitIdleV1_(j,st){
        const gold=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(j&&j.systemes&&j.systemes.currencies&&j.systemes.currencies.gold);
        const nextAt=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(st&&st.data&&st.data.nextAt);
        const restantMs=nextAt-(typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now());
        if(restantMs>0){
          const restantS=Math.ceil(restantMs/1000);
          demarrerMinuteurRechargeIdleV1_();
          return '<button type="button" class="soreal-idle-expand-button-v25" disabled data-idle-recharge-v1="pit" data-fin="'+nextAt+'">'+libelleRechargeMoneyPitIdleV1_(restantS)+'</button>';
        }
        if(gold<100000){
          return '<button type="button" class="soreal-idle-expand-button-v25" disabled>🕳️ Jeter de l’or (100 000 Or requis, '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(gold)+' actuel)</button>';
        }
        return '<button type="button" class="soreal-idle-expand-button-v25 glow-dispo-v1" onclick="window.__actionMetaIdleV130__({action:\'moneyPit\'})">🕳️ Balance ton argent</button>';
      }

      function rendreBoutonDailySpinIdleV203_(st){
        const readyAt=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(st&&st.data&&st.data.readyAt);
        const restantMs=readyAt-(typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now());
        if(restantMs>0){
          const restantS=Math.ceil(restantMs/1000);
          demarrerMinuteurRechargeIdleV1_();
          return '<button type="button" class="soreal-idle-expand-button-v25" disabled data-idle-recharge-v1="spin" data-fin="'+readyAt+'">'+libelleRechargeDailySpinIdleV1_(restantS)+'</button>';
        }
        return '<button type="button" class="soreal-idle-expand-button-v25 glow-dispo-v1" onclick="window.__collecterSystemeMetaIdleV130__(\'dailySpin\')">🎡 Fais-moi tourner, bébé !</button>';
      }

      function rendreSystemeMetaIdleV130_(
        j,
        s,
        detail
      ){
        if(!s)return '';

        const unlocked=
          Boolean(
            s.unlock&&s.unlock.unlocked
          );

        const st=
          s.state||{};

        /* ANTI-SPOIL (AGENTS.md règle n°2) : un système encore verrouillé n'a ni carte, ni cadenas, ni condition de déblocage. */
        if(!unlocked)return '';

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-302 */
        const collecte=[
          'yggdrasil',
          'dailySpin',
          'bloodMagic'
        ].indexOf(s.id)!==-1;

        return '<div class="soreal-idle-section-v8">'+
          '<div class="soreal-idle-window-title-v31">'+
            window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(s.icon||'⚙️')+' '+
            window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(s.name||s.id)+
          '</div>'+
          '<div class="soreal-idle-note-v4">'+
            window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(s.desc||'')+
          '</div>'+
          (unlocked
            ?'<div class="soreal-idle-note-v4" style="margin-top:7px">'+
                'Niveau <strong>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(st.level||0)+'</strong>'+
                ' · temporaire <strong>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(st.tempLevel||0)+'</strong>'+
                ' · permanent <strong>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(st.permanentLevel||0)+'</strong>'+
              '</div>'+
              (detail
                ?rendrePistesSystemeMetaIdleV131_(s)+
                  rendreAllocationsSystemeMetaIdleV130_(s)
                :'')+
              (detail
                ?'<div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:10px">'+
                    '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__toggleSystemeMetaIdleV130__(\''+
                      window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(s.id)+
                      '\')">'+
                      (st.active?'⏸️ Désactiver':'▶️ Activer')+
                    '</button>'+
                    (s.id==='dailySpin'
                      ?rendreBoutonDailySpinIdleV203_(st)
                      :(collecte
                        ?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__collecterSystemeMetaIdleV130__(\''+
                          window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(s.id)+
                          '\')">📥 Récolter / utiliser</button>'
                        :'')
                    )+
                    (s.id==='moneyPit'?rendreBoutonMoneyPitIdleV1_(j,st):'')+
                    (s.id==='diggers'
                      ?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__actionMetaIdleV130__({action:\'buyDigger\'})">⛏️ Améliorer l’équipe</button>'
                      :'')+
                    (s.id==='titans'
                      ?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__actionMetaIdleV130__({action:\'titan\'})">👹 Affronter le Colosse</button>'
                      :'')+
                  '</div>'
                :'')
            :'')+
        '</div>';
      }


      /*
       * Money Pit (2026-09-26, Norman : « il ne faudrait que les bonus totaux que le Money Pit nous a apportés depuis le début de la partie ») :
       * remplace le bandeau « Progression permanente » (EXP, PP, QP, Or…) au-dessus du puits. Totaux cumulés côté serveur (data.rewardsTotal).
       */
      function bandeauMoneyPitIdleV1_(data){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const t=data&&data.rewardsTotal&&typeof data.rewardsTotal==='object'?data.rewardsTotal:{};
        const n=function(k){return Math.max(0,Number(t[k])||0);};
        const f=function(v,d){return H.formatGrandNombreIdleV70_(v,d);};
        const lignes=[];
        if(n('adventureStats'))lignes.push('⚔️ +'+f(n('adventureStats'))+' Puissance et Endurance d’Aventure');
        if(n('adventureHp'))lignes.push('❤️ +'+f(n('adventureHp'))+' PV max d’Aventure');
        if(n('adventureRegen'))lignes.push('🩹 +'+f(n('adventureRegen'),2)+' Regen PV d’Aventure');
        if(n('cubePower')||n('cubeToughness')||n('cubeBoth')){
          const morceaux=[];
          if(n('cubePower'))morceaux.push('+'+f(n('cubePower'))+' Puissance');
          if(n('cubeToughness'))morceaux.push('+'+f(n('cubeToughness'))+' Endurance');
          if(n('cubeBoth'))morceaux.push('+'+f(n('cubeBoth'))+' des deux');
          lignes.push('🧊 Cube : '+morceaux.join(' · '));
        }
        if(n('experience'))lignes.push('✨ +'+f(n('experience'))+' EXP');
        if(n('ap'))lignes.push('🎟️ +'+f(n('ap'))+' AP');
        if(n('seeds'))lignes.push('🌱 +'+f(n('seeds'))+' graines');
        if(n('wandoosLevels'))lignes.push('💻 +'+f(n('wandoosLevels'))+' niveaux de Wandoos');
        if(n('boosts'))lignes.push('🚀 '+f(n('boosts'))+' boost(s) obtenu(s)');
        if(n('energyBars')||n('magicBars'))lignes.push('📊 +'+f(n('energyBars'))+' barre(s) d’Energy · +'+f(n('magicBars'))+' barre(s) de Magic');
        return '<div class="soreal-idle-section-v8">'+
          '<div class="soreal-idle-window-title-v31 gold">🕳️ Bonus obtenus grâce au Money Pit</div>'+
          (lignes.length
            ?'<div style="display:grid;gap:5px;margin-top:6px">'+lignes.map(function(l){return '<div class="soreal-idle-note-v4" style="margin:0">'+H.idleHtml_(l)+'</div>';}).join('')+'</div>'
            :'<div class="soreal-idle-note-v4">Aucun bonus pour l’instant : jette ton Or dans le puits.</div>')+
        '</div>';
      }

      function bandeauMetaIdleV130_(j){
        const m=
          j&&j.systemes
            ?j.systemes
            :{};

        const c=m.currencies||{};

        return '<div class="soreal-idle-section-v8">'+
          '<div class="soreal-idle-window-title-v31 gold">🧭 Progression permanente</div>'+
          '<div class="soreal-idle-note-v4">'+
            '✨ EXP '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(c.experience||0)+
            ' · ⭐ PP '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(c.pp||0)+
            ' · 📋 QP '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(c.qp||0)+
            ' · 🪙 Or '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(c.gold||0)+
            ' · 🩸 Sang '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(c.blood||0)+
            ' · 🌱 Graines '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(c.seeds||0)+
          '</div>'+
          '<div class="soreal-idle-note-v4" style="margin-top:6px">'+
            'Difficulté : <strong>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(m.difficulty||'normal')+'</strong>'+
          '</div>'+
        '</div>';
      }


      
      /*
       * Yggdrasil (2026-09-23, Ygg extra) : Poop (case à cocher par fruit, envoyée avec Manger/Récolter),
       * Auto-Activate (boutique EXP, achetable ici), durée d'un tier (The Beast's Fertilizer), coût du
       * prochain tier. Données : j.systemes.yggExtra (idle-yggdrasil-extra-v1.js). L'ancien résumé
       * « Réservé Energy/Magic » (modèle de réservation retiré en V52, toujours 0) est remplacé.
       */
      const yggPoopChoixIdleV1_={};
      function basculerPoopYggIdleV1_(fruit,coche){yggPoopChoixIdleV1_[String(fruit)]=Boolean(coche);}
      window.__basculerPoopYggIdleV1__=basculerPoopYggIdleV1_;
      function utiliserFruitYggIdleV1_(fruit,mode){
        const payload={action:'useYggFruit',fruit:String(fruit),mode:mode==='harvest'?'harvest':'eat'};
        if(yggPoopChoixIdleV1_[String(fruit)])payload.poop=true;
        yggPoopChoixIdleV1_[String(fruit)]=false;
        window.__actionMetaV47__(payload);
      }
      window.__utiliserFruitYggIdleV1__=utiliserFruitYggIdleV1_;
      function pageYggdrasilIdleV47_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const s=systemeMetaParIdIdleV130_(j,'yggdrasil');
        if(!s||!s.state||!s.state.unlocked)return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        const data=s.state.data||{};
        const fruits=data.fruits||{};
        const m=j&&j.systemes?j.systemes:{};
        /* Anti-spoil : un fruit qui porte le nom d'un système encore verrouillé n'apparaît pas. */
        const defs=(Array.isArray(m.yggFruits)?m.yggFruits:[]).filter(function(def){return !/MacGuffin/i.test(String(def.name||def.id||''))||Boolean(systemeMetaParIdIdleV130_(j,'macguffins')&&systemeMetaParIdIdleV130_(j,'macguffins').state&&systemeMetaParIdIdleV130_(j,'macguffins').state.unlocked);});
        const x=m.yggExtra||{};
        const xf=x.fruits||{};
        const tierSec=Number(x.tierSeconds)>0?Number(x.tierSeconds):3600;
        const seeds=m.currencies?H.idleEntier_(m.currencies.seeds||0):0;
        const exp=m.currencies?Number(m.currencies.experience)||0:0;
        const poop=H.idleEntier_(x.poop||0);
        const noms={energy:'Energy',magic:'Magic'};
        const brown=x.brownHeart?' · Brown Heart : '+(x.nextFreePoopIn===1?'la prochaine est gratuite':'gratuite dans '+H.idleEntier_(x.nextFreePoopIn||0)):'';
        return H.entetePageIdleV28_('🌱 Yggdrasil','Chaque tier permet une heure de croissance supplémentaire. Mange un fruit pour son effet ou récolte-le pour doubler les graines. Une Poop (+50 % avant arrondi) s’utilise sur le prochain fruit mangé ou récolté.')+
          '<div class="soreal-idle-summary-grid-v28">'+
            '<div class="soreal-idle-summary-v28">🌱 Graines<b>'+H.formatGrandNombreIdleV70_(seeds)+'</b></div>'+
            '<div class="soreal-idle-summary-v28">💩 Poop<b>'+H.formatGrandNombreIdleV70_(poop)+'</b></div>'+
            '<div class="soreal-idle-summary-v28">⏳ Durée d’un tier<b>'+H.idleEntier_(Math.round(tierSec/60))+' min</b></div>'+
          '</div>'+
          '<div class="soreal-idle-note-v4" style="margin:6px 0 10px">Poop : x'+H.idleHtml_(String(Math.round((Number(x.poopFactor)||1.5)*100)/100).replace('.',','))+' · tier max '+H.idleEntier_(x.maxTier||10)+H.idleHtml_(brown)+' · Poop achetable au 4G’s Sellout Shop.</div>'+
          '<div style="display:grid;gap:10px">'+defs.map(function(def){
            const f=fruits[def.id]||{};
            const e=xf[def.id]||{};
            const id=H.idleHtml_(def.id);
            const tier=H.idleEntier_(f.tier||0);
            const growth=H.idleNombre_(f.growthHours||0)*tierSec/3600;
            const pret=Boolean(f.active)&&(Number(f.growthHours)||0)>=1;
            const cout=e.activationCost!=null?e.activationCost:(def.activationCost||0);
            const verrou=e.unlocked===false&&!(f.tier>0);
            if(verrou)return '';/* ANTI-SPOIL : un fruit encore verrouillé n'apparaît pas du tout. */
            const ressource=noms[def.resource]||H.idleHtml_(def.resource||'energy');
            const auto=e.autoActivate
              ?'<span style="color:#8fe0a0">⚡ Auto-Activate</span>'
              :(e.autoShopId?'<button type="button" class="soreal-idle-expand-button-v25" '+(exp>=(e.autoCost||0)?'':'disabled ')+'title="Cap '+ressource+' total requis : '+H.formatGrandNombreIdleV70_(e.autoRequiredCap||0)+'" onclick="window.__acheterExpShopIdleV1__(\''+H.idleHtml_(e.autoShopId)+'\',1)">Auto-Activate · '+H.formatGrandNombreIdleV70_(e.autoCost||0)+' EXP</button>':'');
            return '<div class="soreal-idle-section-v8" style="margin:0">'+
              '<div style="display:flex;justify-content:space-between;gap:8px"><b>'+H.idleHtml_(emojiNomIdleV1_('yggdrasil',def.id,def.name||def.id))+'</b><span>Tier '+tier+'</span></div>'+
              '<div style="font-size:14px;color:#aeb5c8;margin-top:5px">'+
                'Croissance '+H.formatterHeuresIdleV47_(growth)+' / '+H.formatterHeuresIdleV47_(H.idleEntier_(f.tier||0)*tierSec/3600)+
                ' · activation '+(cout>0?H.formatGrandNombreIdleV70_(cout)+' '+ressource:'gratuite')+
                (e.nextTierCost!=null?' · tier suivant '+H.formatGrandNombreIdleV70_(e.nextTierCost)+' graines':(e.nextTierCost===null?' · tier max':''))+
              '</div>'+
              '<div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:9px">'+
                '<button type="button" class="soreal-idle-expand-button-v25" '+(verrou||e.nextTierCost===null?'disabled':'onclick="window.__actionMetaV47__({action:\'upgradeYggFruit\',fruit:\''+id+'\'})"')+'>Tier +1</button>'+
                '<button type="button" class="soreal-idle-expand-button-v25" '+(f.active||!(f.tier>0)?'disabled':'onclick="window.__actionMetaV47__({action:\'activateYggFruit\',fruit:\''+id+'\'})"')+'>'+(f.active?(pret?'Prêt':'En croissance'):'Activer')+'</button>'+
                '<button type="button" class="soreal-idle-expand-button-v25" '+(pret?'':'disabled ')+'onclick="window.__utiliserFruitYggIdleV1__(\''+id+'\',\'eat\')">Manger</button>'+
                '<button type="button" class="soreal-idle-expand-button-v25" '+(pret?'':'disabled ')+'onclick="window.__utiliserFruitYggIdleV1__(\''+id+'\',\'harvest\')">Récolter</button>'+
                '<label style="font-size:14px;display:flex;gap:4px;align-items:center"><input type="checkbox" '+(poop>0?'':'disabled ')+(yggPoopChoixIdleV1_[def.id]?'checked ':'')+'onchange="window.__basculerPoopYggIdleV1__(\''+id+'\',this.checked)">💩 Poop</label>'+
                auto+
              '</div>'+
            '</div>';
          }).join('')+'</div>';
      }

      function pageDiggersIdleV47_(j){
        const s=systemeMetaParIdIdleV130_(j,'diggers');
        if(!s||!s.state||!s.state.unlocked)return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        const data=s.state.data||{};
        const diggers=data.diggers||{};
        /* Anti-spoil : le mineur d'un système encore verrouillé n'apparaît pas. */
        const defs=(j&&j.systemes&&Array.isArray(j.systemes.diggerDefinitions)?j.systemes.diggerDefinitions:[]).filter(function(def){return def.id!=='daycare'||Boolean(systemeMetaParIdIdleV130_(j,'daycare')&&systemeMetaParIdIdleV130_(j,'daycare').state&&systemeMetaParIdIdleV130_(j,'daycare').state.unlocked);});
        const active=Object.keys(diggers).filter(function(id){return diggers[id]&&diggers[id].active;}).length;
        return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('⛏️ Gold Diggers','Monte leur niveau maximum puis choisis le niveau actif. Les Diggers consomment le GPS produit par la Time Machine.')+
          '<div class="soreal-idle-summary-grid-v28"><div class="soreal-idle-summary-v28">🎰 Slots<b>'+active+' actif(s) · '+Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(data.slots||1)-active)+' libre(s)</b></div></div>'+
          '<div style="display:grid;gap:10px">'+defs.map(function(def){const d=diggers[def.id]||{};const run=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(d.runLevel||0);const max=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(d.maxLevel||0);return '<div class="soreal-idle-section-v8" style="margin:0"><div style="display:flex;justify-content:space-between;gap:8px"><b>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(emojiNomIdleV1_('diggers',def.id,def.name||def.id))+'</b><span>'+run+' / '+max+'</span></div><div style="font-size:14px;color:#aeb5c8;margin-top:5px">Drain base '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(def.drain||0)+' GPS · cap '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.cap||0)+'</div><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px"><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__actionMetaV47__({action:\'upgradeDigger\',digger:\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.id)+'\'})">Max +1</button><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__setDiggerIdleV47__(\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.id)+'\','+Math.max(0,run-1)+')">−</button><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__setDiggerIdleV47__(\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.id)+'\','+Math.min(max,run+1)+')">+</button><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__toggleDiggerIdleV47__(\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.id)+'\','+(!d.active)+')">'+(d.active?'Désactiver':'Activer')+'</button></div></div>';}).join('')+'</div>';
      }

/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-303 */
function pagePerksIdleV1_(j){
        const s=systemeMetaParIdIdleV130_(j,'perks');
        if(!s||!s.state||!s.state.unlocked)return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const levels=(s.state.data&&s.state.data.levels)||{};
        const defs=j&&j.systemes&&Array.isArray(j.systemes.perkDefinitions)?j.systemes.perkDefinitions:[];
        const pp=j&&j.systemes&&j.systemes.currencies?H.idleEntier_(j.systemes.currencies.pp||0):0;
        /*
         * Magasin des Perks (Norman, 2026-10-04) : une boutique à part, en vitrines (néon violet et rose, étagères) et non en rayons à auvent comme les boutiques EXP et AP ;
         * une image par achat : celle du wiki NGU Idle (https://ngu-idle.fandom.com/wiki/Perk_Points), copiée dans /perks/<numéro du perk>.webp. Aucun total (anti-spoil).
         */
        const filtre=window.__perkFiltreIdleV1__||{q:'',abordables:false};
        const q=String(filtre.q||'').trim().toLowerCase();
        const cartes=defs.map(function(perk){
          const niveau=H.idleEntier_(levels[perk.id]||0);
          const cap=H.idleEntier_(perk.cap||0);
          const auMax=niveau>=cap;
          const cout=H.idleEntier_(perk.cost||0);
          const abordable=!auMax&&pp>=cout;
          const nom=String(perk.name||('Perk '+perk.id));
          if(q&&(nom+' '+String(perk.effect||'')).toLowerCase().indexOf(q)<0)return '';
          if(filtre.abordables&&!abordable)return '';
          const barre=cap>0?Math.min(100,niveau*100/cap):0;
          return '<article class="pk-vitrine'+(auMax?' pk-max':abordable?' pk-abordable':'')+(niveau>0?' pk-possede':'')+'">'+
            '<div class="pk-socle"><img class="pk-image" src="/perks/'+H.idleEntier_(perk.id)+'.webp" alt="" loading="lazy" onerror="this.hidden=true"></div>'+
            '<div class="pk-corps">'+
              '<div class="pk-nom">'+H.idleHtml_(nom)+'</div>'+
              '<div class="pk-effet">'+H.idleHtml_(perk.effect||'')+'</div>'+
              '<div class="pk-niveau"><div class="pk-jauge"><i style="width:'+barre.toFixed(1)+'%"></i></div><span>'+niveau+' / '+cap+'</span></div>'+
            '</div>'+
            (auMax
              ?'<div class="pk-etiquette pk-etiquette-max">✔ Maximum</div>'
              :'<button type="button" class="pk-acheter" onclick="window.__acheterPerkIdleV1__('+perk.id+')"><span class="pk-prix">⭐ '+cout+' PP</span><span class="pk-achat">Acheter</span></button>')+
          '</article>';
        }).join('');
        return '<div class="pk-fond"><div class="pk-boutique">'+
            '<div class="pk-enseigne"><span class="pk-ampoules"></span><div class="pk-enseigne-texte"><small>Boutique</small><b>Perk Emporium</b></div><span class="pk-ampoules"></span></div>'+
            '<div class="pk-comptoir"><div class="pk-solde"><span>⭐ PP disponibles</span><b>'+pp+'</b></div>'+
              '<input class="pk-recherche" type="search" placeholder="Chercher un perk…" value="'+H.idleHtml_(filtre.q||'')+'" oninput="window.__perkFiltrerIdleV1__(this.value,null)">'+
              '<button type="button" class="pk-bascule'+(filtre.abordables?' actif':'')+'" onclick="window.__perkFiltrerIdleV1__(null,'+(filtre.abordables?'false':'true')+')">💰 Abordables</button>'+
            '</div>'+
            '<div class="pk-etagere">'+(cartes||'<div class="pk-vide">Aucun perk ne correspond.</div>')+'</div>'+
          '</div></div>';
      }

/* Filtre du magasin des Perks : recherche et « abordables » ; le magasin est redessiné aussitôt (la saisie garde le focus). */
function perkFiltrerIdleV1_(q,abordables){
        const f=window.__perkFiltreIdleV1__||(window.__perkFiltreIdleV1__={q:'',abordables:false});
        if(q!=null)f.q=String(q);
        if(abordables!=null)f.abordables=Boolean(abordables);
        const racine=document.querySelector('.pk-fond');
        const ancien=racine&&racine.querySelector('.pk-boutique');
        if(!ancien)return;
        const actif=document.activeElement&&document.activeElement.classList&&document.activeElement.classList.contains('pk-recherche');
        const pos=actif?document.activeElement.selectionStart:0;
        const tmp=document.createElement('div');
        tmp.innerHTML=pagePerksIdleV1_(window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat());
        const neuf=tmp.querySelector('.pk-boutique');
        if(!neuf)return;
        ancien.replaceWith(neuf);
        if(actif){const champ=racine.querySelector('.pk-recherche');if(champ){champ.focus();try{champ.setSelectionRange(pos,pos);}catch(_){}}}
      }
      window.__perkFiltrerIdleV1__=perkFiltrerIdleV1_;

function pageQuirksIdleV1_(j){
        const s=systemeMetaParIdIdleV130_(j,'quirks');
        if(!s||!s.state||!s.state.unlocked)return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        const levels=(s.state.data&&s.state.data.levels)||{};
        const defs=j&&j.systemes&&Array.isArray(j.systemes.quirkDefinitions)?j.systemes.quirkDefinitions:[];
        const qp=j&&j.systemes&&j.systemes.currencies?window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(j.systemes.currencies.qp||0):0;
        return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('📚 Quirks','Chaque Quirk a son propre coût plat et son propre plafond. Dépense tes QP pour les améliorer une par une.')+
          '<div class="soreal-idle-summary-grid-v28"><div class="soreal-idle-summary-v28">📋 QP disponibles<b>'+qp+'</b></div></div>'+
          '<div style="display:grid;gap:10px">'+defs.map(function(quirk){
            const niveau=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(levels[quirk.id]||0);
            const cap=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(quirk.cap||0);
            const auMax=niveau>=cap;
            const cout=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(quirk.cost||0);
            return '<div class="soreal-idle-section-v8" style="margin:0">'+
              '<div style="display:flex;justify-content:space-between;gap:8px"><b>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(emojiNomIdleV1_('quirks',quirk.id,quirk.name||('Quirk '+quirk.id)))+'</b><span>'+niveau+' / '+cap+'</span></div>'+
              '<div style="font-size:14px;color:#aeb5c8;margin-top:5px">'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(quirk.effect||'')+'</div>'+
              '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">'+
                (auMax
                  ?'<span class="soreal-idle-note-v4">✔ Maximum atteint</span>'
                  :'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__acheterQuirkIdleV1__('+quirk.id+')">📚 Acheter ('+cout+' QP)</button>')+
              '</div>'+
            '</div>';
          }).join('')+'</div>';
      }

/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-304 */
function pageItopodIdleV1_(j){
        const s=systemeMetaParIdIdleV130_(j,'tower');
        if(!s||!s.state||!s.state.unlocked)return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const d=(s.state.data)||{};
        const etage=H.idleEntier_(d.floor);
        const kills=H.idleEntier_(d.kills);
        const versProchainEtage=d.killsOnFloor!=null?H.idleEntier_(d.killsOnFloor):kills%10;
        const plusHaut=H.idleEntier_(d.highestFloor||d.floor);
        const optimal=H.idleEntier_(d.optimalFloor);
        const auto=d.startFloor==null||d.endFloor==null;
        const debut=H.idleEntier_(d.startFloor==null?0:d.startFloor);
        const fin=H.idleEntier_(d.endFloor==null?optimal:d.endFloor);
        const ppProgress=Math.max(0,H.idleNombre_(d.ppProgress));
        const pp=H.idleEntier_((j&&j.systemes&&j.systemes.currencies&&j.systemes.currencies.pp)||0);
        const pourcent=Math.max(0,Math.min(100,ppProgress/10000));
        /* Champ de saisie « jeu vidéo » : valeur au centre, − et + de part et d'autre. */
        const champ=function(id,libelle,valeur){
          return '<div class="itp-champ"><label for="'+id+'">'+libelle+'</label>'+
            '<div class="itp-pas"><button type="button" class="itp-pas-bouton" aria-label="Moins" onclick="window.__itopodPasIdleV1__(this,-1)">−</button>'+
            '<input id="'+id+'" class="itp-saisie" type="number" inputmode="numeric" min="0" max="1600" value="'+valeur+'">'+
            '<button type="button" class="itp-pas-bouton" aria-label="Plus" onclick="window.__itopodPasIdleV1__(this,1)">+</button></div></div>';
        };
        const tuile=function(icone,libelle,valeur){return '<div class="itp-tuile"><span class="itp-tuile-icone">'+icone+'</span><span class="itp-tuile-libelle">'+libelle+'</span><b>'+valeur+'</b></div>';};
        const atouts=systemeMetaParIdIdleV130_(j,'perks');
        const atoutsOuverts=Boolean(atouts&&atouts.state&&atouts.state.unlocked);
        const vueAtouts=atoutsOuverts&&window.__itopodVueIdleV1__==='atouts';
        return H.entetePageIdleV28_(
          '🏢 ITOPOD',
          'Une tour sans fin : bats 10 ennemis pour monter d’un étage. Chaque ennemi vaincu te rapporte des PPP ('+(j&&j.systemes&&j.systemes.difficulty==='extreme'?2000:j&&j.systemes&&j.systemes.difficulty==='difficile'?700:200)+' + le numéro de l’étage). À 1 000 000 PPP, tu gagnes 1 PP à dépenser dans les Atouts. Tu choisis l’étage de départ et l’étage de fin : arrivé au bout, tu repars du départ.'
        )+
        (atoutsOuverts?'<div class="itp-vues"><button type="button" class="itp-bouton itp-bouton-atouts" onclick="window.__itopodVueIdleV1_basculer__()">'+(vueAtouts?'🏢 Retour à la tour':'⭐ Atouts')+'</button></div>':'')+
        (atoutsOuverts?'<div class="itp-vue-atouts"'+(vueAtouts?'':' hidden')+'>'+pagePerksIdleV1_(j)+'</div>':'')+
        '<div class="itp-page"'+(vueAtouts?' hidden':'')+'>'+
          (window.__SOREAL_IDLE_ITOPOD_SCENE_V1__?window.__SOREAL_IDLE_ITOPOD_SCENE_V1__.html(Object.assign({},d,{actif:Boolean(s.state.active)})):'')+
          '<section class="itp-panneau itp-entree">'+
            '<button type="button" class="itp-bouton itp-bouton-entrer'+(s.state.active?' itp-en-cours':'')+'" onclick="window.__itopodBasculerIdleV1__()">'+(s.state.active?'🚪 Quitter l’ITOPOD':'⚔️ Entrer dans l’ITOPOD')+'</button>'+
            '<div class="itp-mode">'+(s.state.active?'Tu combats les ennemis à la chaîne.':'Entre dans la tour pour combattre les ennemis à la chaîne.')+'</div>'+
            (d.hitsParKill===0?'<div class="itp-mode itp-alerte">Tu n’es pas encore assez fort pour avancer dans la tour : monte ta Puissance d’Aventure.</div>':'')+
          '</section>'+
          '<section class="itp-panneau itp-montee">'+
            '<div class="itp-titre">🪜 Étages à gravir</div>'+
            '<div class="itp-mode">'+(auto?'Montée automatique jusqu’à l’étage optimal':'Départ '+debut+' → fin '+fin)+'</div>'+
            '<div class="itp-champs">'+champ('itopodDebutV1','Départ',debut)+champ('itopodFinV1','Fin',fin)+'</div>'+
            '<div class="itp-actions">'+
              '<button type="button" class="itp-bouton" onclick="window.__itopodEtagesIdleV1__()">Appliquer</button>'+
              '<button type="button" class="itp-bouton itp-bouton-auto" onclick="window.__itopodAutoIdleV1__()">Auto</button>'+
            '</div>'+
          '</section>'+
          '<section class="itp-panneau">'+
            '<div class="itp-titre">📊 Progression</div>'+
            '<div class="itp-tuiles">'+
              tuile('🏢','Étage',etage)+
              tuile('⭐','PP disponibles',pp)+
              tuile('🗡️','Ennemis vaincus',H.formatGrandNombreIdleV70_(kills))+
              tuile('⬆️','Prochain étage',versProchainEtage+' / 10')+
              tuile('🏔️','Étage le plus haut',plusHaut)+
              tuile('🎯','Étage optimal',optimal)+
            '</div>'+
            '<div class="itp-pp"><div class="itp-pp-ligne"><span>🔷 Progression PP</span><b>'+Math.floor(ppProgress).toLocaleString('fr-FR')+' / 1 000 000</b></div>'+
              '<div class="itp-pp-barre"><div class="itp-pp-rempli" style="width:'+pourcent.toFixed(2)+'%"></div></div></div>'+
          '</section>'+
        '</div>';
      }

/* Bouton « Atouts » de la page ITOPOD : bascule entre la tour et la boutique des Atouts (ancien menu à part), sans rien redessiner. */
function itopodVueIdleV1_basculer_(){
        const vers=window.__itopodVueIdleV1__==='atouts'?'tour':'atouts';
        window.__itopodVueIdleV1__=vers;
        const a=document.querySelector('.itp-vue-atouts');
        const t=document.querySelector('.itp-page');
        const b=document.querySelector('.itp-bouton-atouts');
        if(a)a.hidden=vers!=='atouts';
        if(t)t.hidden=vers==='atouts';
        if(b)b.textContent=vers==='atouts'?'🏢 Retour à la tour':'⭐ Atouts';
      }
      window.__itopodVueIdleV1_basculer__=itopodVueIdleV1_basculer_;

/* Mise à jour en direct des chiffres de la page ITOPOD (étage, ennemis vaincus, PP, progression) sans toucher à la scène animée ni aux champs d'étage. */
function rafraichirItopodIdleV1_(j){
        const vivant=document.querySelector('.itp-page');
        if(!vivant)return;
        const tmp=document.createElement('div');
        /* La scène animée est mise de côté pendant ce calcul : son HTML réinitialise le combat de l'écran (coups, ennemi suivant) ; sans cette précaution les ennemis ne défilaient plus (toujours le même, remis à zéro toutes les 4 s). */
        const scene=window.__SOREAL_IDLE_ITOPOD_SCENE_V1__;
        window.__SOREAL_IDLE_ITOPOD_SCENE_V1__=null;
        try{tmp.innerHTML=pageItopodIdleV1_(j);}finally{window.__SOREAL_IDLE_ITOPOD_SCENE_V1__=scene;}
        const neuf=tmp.querySelector('.itp-page');
        if(!neuf)return;
        const copier=function(racineVive,racineNeuve,sel){
          const a=racineVive.querySelectorAll(sel),b=racineNeuve.querySelectorAll(sel);
          a.forEach(function(e,i){if(b[i]&&e.textContent!==b[i].textContent)e.textContent=b[i].textContent;});
        };
        copier(vivant,neuf,'.itp-tuile b');
        copier(vivant,neuf,'.itp-pp-ligne b');
        const barreVive=vivant.querySelector('.itp-pp-rempli'),barreNeuve=neuf.querySelector('.itp-pp-rempli');
        if(barreVive&&barreNeuve&&barreVive.style.width!==barreNeuve.style.width)barreVive.style.width=barreNeuve.style.width;
        /* Solde de PP de la boutique des Atouts (même page). */
        const soldeVif=document.querySelector('.pk-solde b'),soldeNeuf=tmp.querySelector('.pk-solde b');
        if(soldeVif&&soldeNeuf&&soldeVif.textContent!==soldeNeuf.textContent)soldeVif.textContent=soldeNeuf.textContent;
      }
      window.__rafraichirItopodIdleV1__=rafraichirItopodIdleV1_;

/* Entrer dans la tour / la quitter (le combat à la chaîne ne tourne que tour ouverte). */
function itopodBasculerIdleV1_(){
        toggleSystemeMetaIdleV130_('tower');
      }
      window.__itopodBasculerIdleV1__=itopodBasculerIdleV1_;

/* Boutons − et + des champs d'étage : un pas de 1, borné à 0–1600 comme la saisie. */
function itopodPasIdleV1_(bouton,delta){
        const el=bouton&&bouton.parentNode?bouton.parentNode.querySelector('input'):null;
        if(!el)return;
        el.value=String(Math.max(0,Math.min(1600,(Number(el.value)||0)+(Number(delta)||0))));
      }
      window.__itopodPasIdleV1__=itopodPasIdleV1_;

function itopodEtagesIdleV1_(){
        const debut=document.getElementById('itopodDebutV1');
        const fin=document.getElementById('itopodFinV1');
        actionMetaIdleV130_({action:'towerFloors',start:Number(debut&&debut.value)||0,end:Number(fin&&fin.value)||0});
      }
      window.__itopodEtagesIdleV1__=itopodEtagesIdleV1_;

function itopodAutoIdleV1_(){
        actionMetaIdleV130_({action:'towerFloors',auto:true});
      }
      window.__itopodAutoIdleV1__=itopodAutoIdleV1_;

function acheterPerkIdleV1_(perkId){
        actionMetaIdleV130_({action:'buyPerk',perkId:Number(perkId)});
      }
      window.__acheterPerkIdleV1__=acheterPerkIdleV1_;

function acheterQuirkIdleV1_(quirkId){
        actionMetaIdleV130_({action:'buyQuirk',quirkId:Number(quirkId)});
      }
      window.__acheterQuirkIdleV1__=acheterQuirkIdleV1_;

/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-305 */
function pageChallengesIdleV1_(j){
        const s=systemeMetaParIdIdleV130_(j,'challenges');
        if(!s||!s.state||!s.state.unlocked)return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        /* Page détaillée (textes français, restrictions, récompenses par complétion) : modules/challenges-v1.js. */
        if(window.__SOREAL_IDLE_DEFIS_V1__&&typeof window.__SOREAL_IDLE_DEFIS_V1__.page==='function')return window.__SOREAL_IDLE_DEFIS_V1__.page(j);
        const defs=j&&j.systemes&&Array.isArray(j.systemes.challengeDefinitions)?j.systemes.challengeDefinitions:[];
        const actif=defs.find(function(d){return d&&d.active;})||null;
        return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('🏁 Défis'+(defs[0]&&defs[0].tier==='difficile'?' (Evil)':defs[0]&&defs[0].tier==='extreme'?' (Sadistic)':''),'Démarre un défi débloqué, atteins son objectif de boss, puis valide-le pour la récompense. Un seul défi actif à la fois. Les défis Evil et Sadistic ont leurs propres compteurs et récompenses.')+
          (actif
            ?'<div class="soreal-idle-summary-grid-v28"><div class="soreal-idle-summary-v28">Défi actif<b>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(actif.name||actif.id)+'</b></div></div>'+
              '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px">'+
                '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__validerDefiIdleV1__(\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(actif.id)+'\')">✔ Valider</button>'+
                '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__abandonnerDefiIdleV1__()">✖ Abandonner</button>'+
              '</div>'
            :'')+
          '<div style="display:grid;gap:10px">'+defs.map(function(def){
            const statut=
              !def.implemented?'🚧 En préparation'
              :def.active?'▶️ Actif'
              :'✅ Prêt';
            const peutDemarrer=Boolean(def.unlocked)&&Boolean(def.implemented)&&!actif;
            return '<div class="soreal-idle-section-v8" style="margin:0">'+
              '<div style="display:flex;justify-content:space-between;gap:8px"><b>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.name||def.id)+'</b><span>'+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.completion||0)+' / '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.max||0)+'</span></div>'+
              '<div style="font-size:14px;color:#aeb5c8;margin-top:5px">'+statut+
                (def.targetBoss?' · Objectif boss '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.targetBoss):'')+
                ' · Récompense '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(def.reward&&def.reward.experience||0)+' EXP / '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(def.reward&&def.reward.ap||0)+' AP'+
              '</div>'+
              (peutDemarrer
                ?'<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">'+
                    '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__demarrerDefiIdleV1__(\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.id)+'\')">▶️ Démarrer</button>'+
                  '</div>'
                :'')+
            '</div>';
          }).join('')+'</div>';
      }

function demarrerDefiIdleV1_(challengeId){
        actionMetaIdleV130_({action:'challenge',mode:'start',challenge:String(challengeId)});
      }
      window.__demarrerDefiIdleV1__=demarrerDefiIdleV1_;

function validerDefiIdleV1_(challengeId){
        actionMetaIdleV130_({action:'challenge',mode:'complete',challenge:String(challengeId)});
      }
      window.__validerDefiIdleV1__=validerDefiIdleV1_;

function abandonnerDefiIdleV1_(){
        actionMetaIdleV130_({action:'challenge',mode:'stop'});
      }
      window.__abandonnerDefiIdleV1__=abandonnerDefiIdleV1_;

function allocationMaxMetaIdleV48_(j,systemId,resource){
        const snapshot=j&&j.systemes&&typeof j.systemes==='object'?j.systemes:{};
        const systems=Array.isArray(snapshot.systems)?snapshot.systems:[];
        const cap=Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snapshot.resources&&snapshot.resources[resource]&&snapshot.resources[resource].cap||0));
        const usedOther=systems.reduce(function(total,s){
          if(!s||s.id===systemId)return total;
          return total+Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(s.state&&s.state.allocation&&s.state.allocation[resource]||0));
        },0);
        return Math.max(0,cap-usedOther);
      }

      /*
       * Supprimé (2026-09-29) : allocationMetaIdleV48_ (boutons 0/25/50/100% d'un montant ABSOLU)
       * était le dernier survivant du défaut déjà diagnostiqué pour Augmentation le 2026-09-24
       * ("ça me retire l'énergie de Basic Training") -- Blood Magic était son seul appelant restant,
       * remplacé ci-dessous par le même schéma Input + Cap/1/2/1/4 + Idle que Basic Training/
       * Augmentation. Plus aucun appelant (grep vérifié) : retiré plutôt que laissé mort.
       */

      /*
       * 2026-09-24 (Norman : « Augmentation ne fonctionne pas comme dans NGU IDLE. Il me semble qu'il y avait des + pour pouvoir y
       * placer de l'énergie comme pour Basic Training. Là, si je clique sur 50 %, ça me retire l'énergie de Basic Training… »).
       * Les boutons 0 / 25 / 50 / 100 % visaient un montant ABSOLU (une fraction du Cap) : « 50 % » d'un Cap de 500 prenait d'un coup
       * les 250 unités libres, donc l'énergie Idle de Basic Training tombait à 0. Comme Basic Training : « + » / « − » placent ou
       * retirent la valeur du champ Input (le serveur borne à l'énergie libre), « Max » place toute l'énergie libre, « Tout retirer »
       * rend tout.
       */
      /*
       * Norman (2026-09-29) : « Je veux que les zones de saisies Input conservent le dernier
       * chiffre écrit. » Avant ce correctif, la valeur tapée ne survivait qu'en mémoire (perdue à
       * chaque rechargement de page) et Basic Training avait sa PROPRE zone Input, jamais reliée à
       * celle-ci : elle affichait "125" en dur dans son modèle HTML (soreal-idle-ui.js), donc
       * chaque re-rendu complet de la page (la synchro périodique d'environ 15 s, entre autres)
       * effaçait ce que le joueur venait de taper. Une seule valeur, désormais partagée par les
       * QUATRE zones Input (Basic Training, Augmentations, Blood Magic, Time Machine -- exactement
       * comme elles partageaient déjà cette variable entre elles trois) et persistée dans
       * localStorage : elle survit à un re-rendu, à un changement de menu ET à un rechargement.
       */
      let montantAugmentIdleV1=(function(){
        try{
          const v=Math.floor(Number(localStorage.getItem('soreal_idle_montant_input_v1')));
          return Number.isFinite(v)&&v>=1?v:125;
        }catch(_e){
          return 125;
        }
      })();
      function montantAugmentLireIdleV1_(){
        const el=document.getElementById('sorealIdleAugInputV1');
        const n=Math.floor(Number(el&&el.value));
        if(Number.isFinite(n)&&n>=1)montantAugmentIdleV1=n;
        return montantAugmentIdleV1;
      }
      window.__saisirMontantAugmentIdleV1__=function(v){
        const n=Math.floor(Number(v));
        if(Number.isFinite(n)&&n>=1){
          montantAugmentIdleV1=n;
          try{localStorage.setItem('soreal_idle_montant_input_v1',String(n));}catch(_e){}
        }
      };
      window.__lireMontantAugmentIdleV1__=function(){return montantAugmentIdleV1;};
      /*
       * Norman (2026-09-29) : « les boutons Energy Cap ; Cap, 1/2, 1/4 et IDLE Cap, 1/2, 1/4 » --
       * mêmes raccourcis que la barre d'outils de Basic Training (presetBasicTrainingIdleV120_,
       * soreal-idle-ui.js), qui ne fait qu'écrire l'Input : "cap" part du plafond d'énergie total
       * (idleEtat.energieMax), "idle" part de l'énergie idle actuellement libre (idleEtat.energie).
       * Mêmes deux sources, jamais une valeur inventée pour Augmentation.
       */
      function presetAugmentIdleV1_(source,fraction){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const input=document.getElementById('sorealIdleAugInputV1');
        if(!input)return;
        const base=source==='idle'?H.idleEntier_(j&&j.energie):H.idleEntier_(j&&j.energieMax);
        const valeur=Math.max(1,Math.floor(base*Math.max(0,Number(fraction)||0)));
        input.value=String(valeur);
        window.__saisirMontantAugmentIdleV1__(valeur);
      }
      window.__presetAugmentIdleV1__=presetAugmentIdleV1_;
      /*
       * Norman (2026-09-27) : « Je veux le même son et la même animation sur le bouton + et le chiffre qui reçoit les
       * points d'énergie que dans basic training mais dans augmentation. » Avant ce correctif, le clic attendait le
       * bruit du réseau (rendreIdleEtat_ complet, appelé seulement à la réponse serveur) pour que la barre/le chiffre
       * ne bouge, et aucun son n'était joué -- exactement comme ajusterBasicTrainingIdleV120_ (soreal-idle-ui.js) :
       * mise à jour optimiste locale IMMÉDIATE (pair.energy/upgradeEnergy, énergie idle restante) + même son
       * (btPlus/btMinus/btCap) que Basic Training, avant même l'envoi au serveur. La confirmation serveur suit
       * normalement (actionMetaNoyauIdleV130_) et corrige la valeur si besoin.
       */
      /*
       * Norman (2026-09-29) : « j'ai l'impression que la réactivité n'est pas aussi bonne que dans
       * basic training. Le jeu m'a l'air plus lent. » Cause : rendreIdleEtat_ régénère TOUT le menu
       * affiché (chaque paire Augment/Upgrade visible) à chaque clic +/-/Cap -- beaucoup plus lourd
       * qu'un patch DOM ciblé, exactement le même défaut que Basic Training évitait déjà depuis le
       * début (rafraichirBasicTrainingIdleV120_, soreal-idle-ui.js). Remplacé par une mise à jour
       * directe des seuls éléments concernés : le chiffre alloué de CETTE paire, et la barre
       * d'Énergie principale (déjà exposée sur le pont hôte, rafraichirEnergieEtBoutonsIdleV9_).
       * La barre de PROGRESSION (le remplissage vers le niveau suivant) reste inchangée ici : elle
       * dépend de progressPct, calculé côté serveur à partir d'un débit, jamais de l'allocation
       * elle-même -- un rendu complet ne la rafraîchissait pas plus vite, il ne faisait que repeindre
       * la même valeur déjà affichée, à un coût bien plus élevé.
       */
      function rafraichirAllocationAugmentIdleV1_(pairId,upgrade,value){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const span=document.getElementById('sorealIdleAugAllocV1_'+pairId+'_'+(upgrade?'upgrade':'main'));
        if(span)span.textContent=H.formatGrandNombreIdleV70_(value)+' ⚡';
        const libre=document.getElementById('sorealIdleAugEnergieLibreV1');
        if(libre){
          const j=H.getIdleEtat();
          libre.textContent=H.formatGrandNombreIdleV70_(Math.max(0,H.idleNombre_(j&&j.energie)));
        }
        if(typeof H.rafraichirEnergieEtBoutonsIdleV9_==='function')H.rafraichirEnergieEtBoutonsIdleV9_();
      }

      /*
       * ===== Allocations rapides (chantier « réactivité », Norman 2026-09-30) =====
       * « L'interface n'est pas réactive : quand on retire ou remet l'énergie dans Augmentations, ça met du temps. Tout doit être aussi
       * rapide que Basic Training. » Cause : chaque clic attendait l'aller-retour serveur (file d'actions en série, puis rendu complet de
       * la page) avant de mettre à jour durée, barre et compte à rebours. Basic Training, lui, applique tout EN LOCAL, envoie en différé
       * l'état voulu (un seul envoi pour une rafale de clics) et recolle la réponse sans tout redessiner. Même principe ici :
       *  1. le clic modifie l'état local et recalcule tout de suite ce qui en dépend (durée d'un niveau = K / allocation, barre, compte à
       *     rebours), avec les constantes K envoyées par le serveur (secondsK, speedK…) -- jamais une seconde formule inventée ;
       *  2. l'allocation part en différé (70 ms), UNE seule fois par cible (la dernière valeur voulue), un envoi à la fois ;
       *  3. la réponse est recollée SANS redessiner la page si elle confirme ce que l'écran montre ; sinon (refus, plafond) rendu complet.
       */
      const IDLE_ALLOC_RAPIDE_V1={file:new Map(),timer:0,enCours:false,ancien:null,voulu:new Map()};
      function cleAllocRapideV1_(p){
        return String(p.action)+':'+String(p.system||'')+':'+String(p.resource||p.pair||p.track||p.ritual||'')+':'+(p.upgrade?'u':'m');
      }
      function planifierAllocRapideV1_(delai){
        const R=IDLE_ALLOC_RAPIDE_V1;
        if(R.timer)clearTimeout(R.timer);
        R.timer=setTimeout(viderAllocRapideV1_,Math.max(15,delai||70));
      }
      /* Met une action d'allocation en attente ; la même cible est écrasée (dernière valeur voulue), en fin de file pour garder l'ordre. */
      function envoyerAllocRapideV1_(payload,delai){
        if(typeof SOREAL_SESSION==='undefined'||!SOREAL_SESSION)return;
        const R=IDLE_ALLOC_RAPIDE_V1;
        if(payload.action==='clearAugmentAllocations'){
          Array.from(R.file.keys()).forEach(function(c){if(c.indexOf('allocateAugment:')===0)R.file.delete(c);});
        }
        const cle=cleAllocRapideV1_(payload);
        const O=window.__allocOrdreIdleV1__;
        if(O&&!O.meta){O.meta=++O.n;O.metaAt=Date.now();}
        R.file.delete(cle);
        R.file.set(cle,payload);
        /* Ce que le joueur veut, tant que le serveur ne l'a pas confirmé : réappliqué sur tout état serveur plus ancien (voir appliquerAllocationsVoulues). */
        if(payload.action==='allocate'||payload.action==='allocateAugment'||payload.action==='allocateAdvancedTraining')R.voulu.set(cle,payload);
        else if(payload.action==='clearAugmentAllocations')Array.from(R.voulu.keys()).forEach(function(c){if(c.indexOf('allocateAugment:')===0)R.voulu.delete(c);});
        planifierAllocRapideV1_(delai);
      }
      function O2(){return window.__allocOrdreIdleV1__;}
      function viderAllocRapideV1_(){
        const R=IDLE_ALLOC_RAPIDE_V1;
        R.timer=0;
        if(R.enCours)return;
        const suivant=R.file.entries().next();
        if(suivant.done)return;
        /* Une répartition de Basic Training, modifiée avant celle-ci, doit arriver au serveur d'abord (voir idleAllocOrdreV1 dans soreal-idle-ui.js). */
        const O=window.__allocOrdreIdleV1__;
        if(O&&O.bt&&O.bt<O.meta&&Date.now()-O.btAt<4000){planifierAllocRapideV1_(40);return;}
        const cle=suivant.value[0];
        const payload=suivant.value[1];
        /* Plusieurs Augments / Upgrades en attente : un seul appel pour le lot (audit du menu Augmentations, 2026-10-05), au lieu d'un appel — et d'une réponse complète — par cible. */
        let cles=[cle];
        let envoi=payload;
        if(payload.action==='allocateAdvancedTraining'){
          const lotAt=[[cle,payload]];
          R.file.forEach(function(p,c){if(c!==cle&&p.action==='allocateAdvancedTraining')lotAt.push([c,p]);});
          if(lotAt.length>1){
            cles=lotAt.map(function(x){return x[0];});
            envoi={action:'allocateAdvancedTrainings',items:lotAt.map(function(x){return {track:x[1].track,value:x[1].value};})};
          }
        }else if(payload.action==='allocateAugment'){
          const lot=[[cle,payload]];
          R.file.forEach(function(p,c){if(c!==cle&&p.action==='allocateAugment')lot.push([c,p]);});
          if(lot.length>1){
            cles=lot.map(function(x){return x[0];});
            envoi={action:'allocateAugments',items:lot.map(function(x){return {pair:x[1].pair,upgrade:Boolean(x[1].upgrade),value:x[1].value};})};
          }
        }
        const payloads=cles.map(function(c){return c===cle?payload:R.file.get(c);});
        cles.forEach(function(c){R.file.delete(c);});
        R.enCours=true;
        window.__SOREAL_IDLE_META_HOST_V130__.appelerProgressionIdleCloudflareV1_(
          envoi,
          function(res){
            R.enCours=false;
            /* Réponse du serveur (sauf si une valeur plus récente attend dans la file) : l'intention est soldée AVANT de recoller, pour que le serveur garde la main (plafond, refus). */
            if(res&&res.ok)cles.forEach(function(c){if(!R.file.has(c))R.voulu.delete(c);});
            reconcilierAllocRapideV1_(res);
            if(R.file.size)planifierAllocRapideV1_(20);
            else if(O2()&&!R.timer)O2().meta=0;
          },
          function(){
            R.enCours=false;
            /* Échec réseau : on remet l'action (sauf si une valeur plus récente l'a déjà remplacée) et on réessaie. */
            cles.forEach(function(c,i){if(!R.file.has(c)&&payloads[i])R.file.set(c,payloads[i]);});
            planifierAllocRapideV1_(1200);
          }
        );
      }
      window.__envoyerAllocRapideIdleV1__=envoyerAllocRapideV1_;
      window.__allocRapideEtatIdleV1__=function(){return {enAttente:IDLE_ALLOC_RAPIDE_V1.file.size,enCours:IDLE_ALLOC_RAPIDE_V1.enCours,timer:Boolean(IDLE_ALLOC_RAPIDE_V1.timer)};};

      /* Empreinte des allocations de tous les systèmes : ce que le joueur a demandé, à comparer à ce que le serveur confirme. */
      function empreinteAllocationsMetaV1_(j){
        const liste=j&&j.systemes&&Array.isArray(j.systemes.systems)?j.systemes.systems:[];
        return liste.map(function(x){
          const st=(x&&x.state)||{};
          const pairs=st.data&&st.data.pairs;
          const extra=pairs?Object.keys(pairs).map(function(k){return k+':'+(pairs[k]&&pairs[k].energy)+'/'+(pairs[k]&&pairs[k].upgradeEnergy);}).join(','):'';
          const rituel=st.data&&st.data.activeRitual?st.data.activeRitual:'';
          const pistesAt=String(x&&x.id)==='advancedTraining'&&st.data&&st.data.tracks?Object.keys(st.data.tracks).map(function(k){return k+'='+(st.data.tracks[k]&&st.data.tracks[k].energy)+'/'+(st.data.tracks[k]&&st.data.tracks[k].target);}).join(','):'';
          return String(x&&x.id)+'='+JSON.stringify(st.allocation||{})+extra+rituel+pistesAt;
        }).join('|');
      }
      function niveauxAugmentsMetaV1_(j){
        const s=systemeMetaParIdIdleV130_(j,'augmentations');
        const pairs=s&&s.state&&s.state.data&&s.state.data.pairs||{};
        return Object.keys(pairs).map(function(k){return k+':'+pairs[k].level+'/'+pairs[k].upgradeLevel;}).join(',');
      }

      /*
       * Anti-« rollback » (Norman, 2026-10-01) : « Les menus font parfois des rollback : je mets de l'énergie et elle m'est rendue ; je dois la
       * remettre (Time Machine…). » Cause : un état serveur calculé AVANT l'allocation (réponse d'un autre appel : combat, synchro, achat…) arrivait
       * après le clic et écrasait l'état local. Tant que le serveur n'a pas confirmé une allocation voulue, on la réapplique donc sur tout état qui
       * arrive (même calcul que le clic : allocation de la piste, énergie/Magic libre en conséquence). Sans effet quand l'état contient déjà la valeur.
       */
      function appliquerAllocationsVoulues(j){
        const R=IDLE_ALLOC_RAPIDE_V1;
        if(!j||!R.voulu.size)return;
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        R.voulu.forEach(function(p){
          const val=Math.max(0,Math.floor(Number(p.value)||0));
          if(p.action==='allocate'){
            const sys=systemeMetaParIdIdleV130_(j,p.system);
            if(!sys||!sys.state||!sys.state.allocation)return;
            const actuel=Math.max(0,H.idleNombre_(sys.state.allocation[p.resource]));
            const delta=val-actuel;
            if(!delta)return;
            sys.state.allocation[p.resource]=val;
            if(p.resource==='energy')j.energie=Math.max(0,H.idleNombre_(j.energie)-delta);
            else if(p.resource==='magic'&&j.systemes&&j.systemes.resources&&j.systemes.resources.magic){
              const m=j.systemes.resources.magic;
              m.current=Math.max(0,H.idleNombre_(m.current)-delta);
            }
          }else if(p.action==='allocateAdvancedTraining'){
            const sysAt=systemeMetaParIdIdleV130_(j,'advancedTraining');
            const pisteAt=sysAt&&sysAt.state&&sysAt.state.data&&sysAt.state.data.tracks&&sysAt.state.data.tracks[p.track];
            if(!pisteAt)return;
            const actuelAt=Math.max(0,H.idleNombre_(pisteAt.energy));
            const deltaAt=val-actuelAt;
            if(!deltaAt)return;
            pisteAt.energy=val;
            if(sysAt.state.allocation)sysAt.state.allocation.energy=Math.max(0,H.idleNombre_(sysAt.state.allocation.energy)+deltaAt);
            j.energie=Math.max(0,H.idleNombre_(j.energie)-deltaAt);
          }else if(p.action==='allocateAugment'){
            const sys=systemeMetaParIdIdleV130_(j,'augmentations');
            const pair=sys&&sys.state&&sys.state.data&&sys.state.data.pairs&&sys.state.data.pairs[p.pair];
            if(!pair)return;
            const champ=p.upgrade?'upgradeEnergy':'energy';
            const actuel=Math.max(0,H.idleNombre_(pair[champ]));
            const delta=val-actuel;
            if(!delta)return;
            pair[champ]=val;
            if(sys.state.allocation)sys.state.allocation.energy=Math.max(0,H.idleNombre_(sys.state.allocation.energy)+delta);
            j.energie=Math.max(0,H.idleNombre_(j.energie)-delta);
          }
        });
      }
      window.__appliquerAllocationsVouluesIdleV1__=appliquerAllocationsVoulues;

      /*
       * Réponse du serveur à une allocation. Une réponse plus ancienne que la valeur affichée est ignorée (la dernière réconcilie) ; une
       * réponse qui confirme l'écran met à jour les vues serveur (durées, progression) SANS redessiner la page ; une divergence
       * (refus, plafond, niveau cible atteint) redessine tout, comme avant.
       */
      function reconcilierAllocRapideV1_(res){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const R=IDLE_ALLOC_RAPIDE_V1;
        if(!res||!res.ok||!res.joueur)return;
        if(R.file.size||R.timer)return;
        const j=H.getIdleEtat();
        if(!j)return;
        const srv=H.protegerJoueurServeurInventaireIdleV208_(res.joueur);
        if(empreinteAllocationsMetaV1_(j)!==empreinteAllocationsMetaV1_(srv)){
          /* Trace en console seulement (pas de message au joueur : ce sont les chiffres qui doivent être justes, voir energieLibreCoherenteIdleV1_ dans soreal-idle-ui.js). */
          try{
            console.warn('[IDLE] répartition d’énergie ajustée par le serveur',{energieEcran:Math.floor(H.idleNombre_(j.energie)),energieServeur:Math.floor(H.idleNombre_(srv.energie)),repartitionEcran:empreinteAllocationsMetaV1_(j),repartitionServeur:empreinteAllocationsMetaV1_(srv)});
          }catch(_e){}
          /* Une répartition de Basic Training encore en route vers le serveur ne doit pas être écrasée par cette réponse. */
          if(typeof window.__btAllocEnAttenteIdleV1__==='function'&&window.__btAllocEnAttenteIdleV1__()&&j.basicTraining)srv.basicTraining=j.basicTraining;
          if(typeof window.__energieLibreCoherenteIdleV1__==='function'){
            const libre=window.__energieLibreCoherenteIdleV1__(srv);
            H.setIdleEtat(srv);
            srv.energie=libre;
          }else{
            H.setIdleEtat(srv);
          }
          H.rendreIdleEtat_({ok:true,joueur:srv});
          return;
        }
        /* Confirmation : l'énergie libre affichée suit celle du serveur, corrigée de ce que l'écran a placé de son côté (Basic Training en route…). */
        if(typeof window.__energieLibreCoherenteIdleV1__==='function')j.energie=window.__energieLibreCoherenteIdleV1__(srv);
        const niveauxAvant=niveauxAugmentsMetaV1_(j);
        const ressourcesLocales=j.systemes&&j.systemes.resources;
        j.systemes=srv.systemes;
        /* Les repères des barres (Augments, rituels) partent de l'instant où le serveur a produit CETTE réponse : avec l'instant de la première réponse du chargement, la barre rattrapait tout le temps écoulé depuis à la nouvelle vitesse (Norman, 2026-10-05). */
        if(srv.__recuPerfV1)j.__recuPerfV1=srv.__recuPerfV1;
        if(ressourcesLocales&&j.systemes)j.systemes.resources=ressourcesLocales;
        if(niveauxAugmentsMetaV1_(j)!==niveauxAvant&&typeof H.rafraichirMenuRacineIdleV28_==='function'){
          H.rafraichirMenuRacineIdleV28_();
          return;
        }
        var signalerPageIdleV1_=function(cle,e){var D=window.__SOREAL_IDLE_DIAG_V1__;if(D&&D.signaler)D.signaler(cle,e);};
        try{pageAugmentationsIdleV48_(j);}catch(e){signalerPageIdleV1_('page_augments',e);}
        try{if(j.systemes&&j.systemes.bloodMagicView)pageBloodMagicIdleV48_(j);}catch(e){signalerPageIdleV1_('page_blood',e);}
        if(typeof H.patcherBarresTimeMachineIdleV1_==='function')H.patcherBarresTimeMachineIdleV1_(j);
      }

      /*
       * Recalcul local d'une piste à allocation A : durée d'un niveau = K / A ; la progression (en SECONDES) ne change pas quand on
       * change l'allocation, donc fraction' = secondes / durée'. Renvoie { seconds, progress } (seconds = 0 sans allocation).
       */
      /*
       * Barres alimentées par une ressource (Norman, 2026-10-05) : en changeant l'allocation, la barre ne rattrape pas son retard et ne perd rien : elle garde la MÊME fraction et adopte la nouvelle vitesse
       * (durée du niveau = K / allocation). Sans ressource, la barre reste où elle est.
       */
      function recalculerPisteFractionIdleV1_(k,fraction,alloc){
        const a=Math.max(0,Number(alloc)||0);
        const frac=Math.max(0,Math.min(.999999,Number(fraction)||0));
        if(!(k>0)||!(a>0))return {seconds:0,progress:frac};
        return {seconds:k/a,progress:frac};
      }
      function recalculerPisteAllocIdleV1_(k,progressSecondes,alloc){
        const a=Math.max(0,Number(alloc)||0);
        if(!(k>0)||!(a>0))return {seconds:0,progress:0};
        const seconds=k/a;
        return {seconds:seconds,progress:Math.max(0,Math.min(.999999,(Math.max(0,progressSecondes)||0)/seconds))};
      }

      /* Fait avancer d'abord les barres d'Augmentations du temps écoulé, puis repart de « maintenant » : tous les repères restent cohérents. */
      /* Instant (horloge locale, performance.now) où le serveur a produit la dernière réponse : réception moins un demi aller-retour (voir standalone-bridge.js). */
      function ancreSnapshotIdleV1_(j){
        const rtt=typeof window.__SOREAL_IDLE_RTT_V1__==='function'?window.__SOREAL_IDLE_RTT_V1__():0;
        const recu=j&&Number(j.__recuPerfV1);
        return (recu>0?recu:performance.now())-rtt/2;
      }

/*
       * Repère visuel des Augments (une photo du serveur à l'instant où il l'a produite) : barres, niveaux et Or sont rejoués localement depuis ce repère (soreal-idle-ui.js, patch à chaque tick).
       * Construit à partir d'un état serveur : défs (Augments), paires (niveaux, énergie placée) et Or. Utilisé au dessin de la page ET à chaque synchro (voir adopterRepereAugmentsIdleV1_).
       */
      function construireVisuelAugmentsIdleV1_(j){
        const snap=j&&j.systemes||{},defs=Array.isArray(snap.augmentations)?snap.augmentations:[];
        const sys=systemeMetaParIdIdleV130_(j,'augmentations');
        const pairs=((sys&&sys.state&&sys.state.data)||{}).pairs||{};
        const gold=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snap.currencies&&snap.currencies.gold||0);
        const etatAug=j;
  return {
          src:defs,
          at:ancreSnapshotIdleV1_(etatAug),
          defs:Object.fromEntries(defs.map(function(d){return [d.id,{progress:window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(d.progressPct),upgradeProgress:window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(d.upgradeProgressPct),/* Norman (2026-10-02) : « quand je retire tout d'Augmentation la barre continue à monter » -- un état serveur en retard décrit encore l'ancienne allocation : sans énergie placée (allocation affichée, après les allocations voulues), la barre ne tourne pas. */seconds:(window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_((pairs[d.id]||{}).energy)>0)?window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(d.secondsPerLevel):0,upgradeSeconds:(window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_((pairs[d.id]||{}).upgradeEnergy)>0)?window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(d.upgradeSecondsPerLevel):0,level:window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_((pairs[d.id]||{}).level),upgradeLevel:window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_((pairs[d.id]||{}).upgradeLevel),waiting:Boolean(d.waitingGold),upgradeWaiting:Boolean(d.upgradeWaitingGold),goldCost:window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(d.goldCost),upgradeGoldCost:window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(d.upgradeGoldCost),gold:gold}];}))
  };
      }
      /*
       * Norman (2026-10-05) : « le menu Augmentations n'est toujours pas fluide, il fait des rollback pour s'accorder avec le serveur ». Avant, chaque niveau validé déclenchait une synchro puis un REDESSIN
       * complet de la page 1,5 s plus tard : toutes les barres, niveaux et coûts repassaient un instant par les chiffres (en retard) du serveur. Désormais la réponse du serveur devient directement le nouveau
       * repère (même mécanique, aucun redessin) : le niveau, la barre et l'Or restent ceux de l'écran, recalés sur le serveur à l'instant où il a calculé.
       */
      function adopterRepereAugmentsIdleV1_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const snap=j&&j.systemes;
        if(!snap||!Array.isArray(snap.augmentations)||!snap.augmentations.length)return;
        j.__augmentationsVisualV215=construireVisuelAugmentsIdleV1_(j);
        const mult=document.getElementById('sorealIdleAugMultV1');
        const texteMult='x'+H.idleNombre_(snap.bonuses&&snap.bonuses.augmentationMultiplier||1).toFixed(3);
        if(mult&&mult.textContent!==texteMult)mult.textContent=texteMult;
      }
      window.__adopterRepereAugmentsIdleV1__=adopterRepereAugmentsIdleV1_;

      /*
       * Rejeu des niveaux terminés d'une barre d'Augment depuis son repère, EN FORMULE (et non niveau par niveau, plafonné à 200 comme avant : une barre qui gagne 5 à 12 niveaux par seconde
       * restait figée 200 niveaux derrière le serveur jusqu'à la synchro suivante, puis sautait en arrière). Le niveau n (n = niveau + 1 + j) dure sec0 × n/n0 et coûte cout0 × (n/n0)^expo
       * (expo 1 pour un Augment, 2 pour son Upgrade). `debites` cycles ont déjà été débités. Rend {k, reste, debites, debit, bloque} ; l'appelant retire `debit` de l'Or local.
       */
      function rejouerCyclesAugmentIdleV1_(p){
        const n0=Math.max(1,p.niv0+1),sec0=p.sec0,expo=p.expo;
        const temps=function(k){return sec0/n0*(k*n0+k*(k-1)/2);};
        const somme1=function(a,b){return (b*(b-1)-a*(a-1))/2;};
        const somme2=function(a,b){const f=function(m){return (m-1)*m*(2*m-1)/6;};return f(b)-f(a);};
        const cout=function(a,b){
          const m=b-a;
          if(m<=0)return 0;
          if(expo===1)return p.cout0/n0*(m*n0+somme1(a,b));
          return p.cout0/(n0*n0)*(m*n0*n0+2*n0*somme1(a,b)+somme2(a,b));
        };
        const total=p.reste0;
        let kMax=Math.floor(-(n0-0.5)+Math.sqrt((n0-0.5)*(n0-0.5)+2*total*n0/sec0));
        if(!(kMax>=0)||!isFinite(kMax))kMax=0;
        while(kMax>0&&temps(kMax)>total*(1+1e-12))kMax-=1;
        while(temps(kMax+1)<=total*(1+1e-12)&&kMax<1e9)kMax+=1;
        const d=Math.min(p.debites,kMax);
        let k=kMax,debit=0,debites=Math.max(p.debites,0),bloque=false;
        if(kMax>d){
          if(cout(d,kMax)<=p.gold+1e-9){
            debit=cout(d,kMax);debites=kMax;
          }else{
            let lo=d,hi=kMax;
            while(hi-lo>1){const mid=Math.floor((lo+hi)/2);if(cout(d,mid)<=p.gold+1e-9)lo=mid;else hi=mid;}
            k=lo;bloque=true;debit=cout(d,k);debites=Math.max(debites,k);
          }
        }
        return {k:k,reste:total-temps(k),debites:debites,debit:debit,bloque:bloque,coutProchain:p.cout0*Math.pow((n0+k)/n0,expo),dureeProchaine:sec0*(n0+k)/n0};
      }
      window.__rejouerCyclesAugmentIdleV1__=rejouerCyclesAugmentIdleV1_;

      /*
       * Ramène le repère à « maintenant ». Les niveaux terminés depuis le repère sont REJOUÉS (niveau, coût, durée du suivant, Or débité) exactement comme le fait le tick de soreal-idle-ui.js : l'ancien
       * calcul (reste de la division par la durée) effaçait ces niveaux sans les compter, d'où un niveau affiché qui reculait d'un cran et un Or trop haut jusqu'à la synchro suivante.
       */
      function rebaserVisuelAugmentsIdleV1_(visual){
        if(!visual||!visual.defs)return;
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const maintenant=performance.now();
        const ecoule=Math.max(0,(maintenant-visual.at)/1000);
        const etat=H.getIdleEtat();
        const monnaies=etat&&etat.systemes&&etat.systemes.currencies;
        Object.keys(visual.defs).forEach(function(id){
          const d=visual.defs[id];
          [['progress','seconds','waiting','level','goldCost','main',1],['upgradeProgress','upgradeSeconds','upgradeWaiting','upgradeLevel','upgradeGoldCost','upgrade',2]].forEach(function(c){
            const sec0=Number(d[c[1]])||0;
            if(!(sec0>0)||d[c[2]])return;
            if(sec0<=0.0201)return;
            const niv0=Math.max(0,H.idleEntier_(d[c[3]]));
            const cout0=H.idleNombre_(d[c[4]]);
            const cle='cycles_'+c[5];
            const rj=rejouerCyclesAugmentIdleV1_({niv0:niv0,sec0:sec0,cout0:cout0,expo:c[6],reste0:(Number(d[c[0]])||0)*sec0+ecoule,debites:d[cle]||0,gold:monnaies?H.idleNombre_(monnaies.gold):0});
            if(monnaies&&rj.debit>0)monnaies.gold=Math.max(0,H.idleNombre_(monnaies.gold)-rj.debit);
            d[cle]=Math.max(0,rj.debites-rj.k);
            if(rj.k>0){d[c[3]]=niv0+rj.k;d[c[4]]=rj.coutProchain;}
            d[c[1]]=rj.dureeProchaine;
            d[c[0]]=Math.max(0,rj.reste/rj.dureeProchaine);
          });
        });
        visual.at=maintenant;
      }

      function ajusterAugmentIdleV1_(pairId,upgrade,mode){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const s=systemeMetaParIdIdleV130_(j,'augmentations');
        const pair=((s&&s.state&&s.state.data&&s.state.data.pairs)||{})[pairId]||{};
        const current=Math.max(0,H.idleNombre_(upgrade?pair.upgradeEnergy:pair.energy));
        const pas=montantAugmentLireIdleV1_();
        const idleAvant=Math.max(0,H.idleNombre_(j&&j.energie));
        const cible=mode==='plus'
          ?current+Math.min(pas,idleAvant)
          :mode==='moins'
            ?Math.max(0,current-pas)
            :current+idleAvant;
        const value=Math.max(0,H.idleEntier_(cible));
        const delta=value-current;

        if(delta!==0){
          try{
            const audio=window.__SOREAL_IDLE_AUDIO_V199__;
            const son=mode==='plus'?'btPlus':mode==='moins'?'btMinus':'btCap';
            if(audio&&typeof audio[son]==='function')audio[son]();
          }catch(_e){}

          if(pair)pair[upgrade?'upgradeEnergy':'energy']=value;
          if(s&&s.state&&s.state.allocation)s.state.allocation.energy=Math.max(0,H.idleNombre_(s.state.allocation.energy)+delta);
          if(j)j.energie=Math.max(0,idleAvant-delta);
          recalculerAugmentLocalIdleV1_(j,pairId,upgrade,value);
          rafraichirAllocationAugmentIdleV1_(pairId,upgrade,value);
        }

        /* Rien n'a changé (plus d'énergie libre, déjà à zéro) : aucun envoi (audit du menu Augmentations, 2026-10-05) ; une intention déjà en attente pour cette cible, elle, part quand même. */
        if(delta===0)return;
        envoyerAllocRapideV1_({action:'allocateAugment',pair:pairId,upgrade:Boolean(upgrade),value:value});
      }
      window.__ajusterAugmentIdleV1__=ajusterAugmentIdleV1_;

      /*
       * Recalcule tout de suite, pour la piste modifiée, la durée d'un niveau, la barre et le compte à rebours (le ticker de
       * soreal-idle-ui.js les redessine à son prochain passage, donc quasi instantanément) : durée = K / allocation, avec K (secondsK)
       * fourni par le serveur. Les autres pistes gardent leur animation en cours (rebasées sur « maintenant »).
       */
      /* « Tout retirer » : rend toute l'Energy des Augments d'un coup, en local d'abord (durées, barres, énergie libre), puis un seul envoi. */
      function viderAugmentsIdleV1_(){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const s=systemeMetaParIdIdleV130_(j,'augmentations');
        if(!s||!s.state)return;
        const pairs=(s.state.data&&s.state.data.pairs)||{};
        let rendu=0;
        Object.keys(pairs).forEach(function(id){
          const p=pairs[id];
          ['energy','upgradeEnergy'].forEach(function(cle){
            const v=Math.max(0,H.idleNombre_(p&&p[cle]));
            if(!(v>0))return;
            rendu+=v;
            p[cle]=0;
            recalculerAugmentLocalIdleV1_(j,id,cle==='upgradeEnergy',0);
            rafraichirAllocationAugmentIdleV1_(id,cle==='upgradeEnergy',0);
          });
        });
        if(s.state.allocation)s.state.allocation.energy=0;
        if(rendu>0){
          try{
            const audio=window.__SOREAL_IDLE_AUDIO_V199__;
            if(audio&&typeof audio.btMinus==='function')audio.btMinus();
          }catch(_e){}
          if(j)j.energie=Math.max(0,H.idleNombre_(j.energie))+rendu;
          if(typeof H.rafraichirEnergieEtBoutonsIdleV9_==='function')H.rafraichirEnergieEtBoutonsIdleV9_();
        }
        envoyerAllocRapideV1_({action:'clearAugmentAllocations'});
      }
      window.__viderAugmentsIdleV1__=viderAugmentsIdleV1_;

      function recalculerAugmentLocalIdleV1_(j,pairId,upgrade,alloc){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const defs=j&&j.systemes&&Array.isArray(j.systemes.augmentations)?j.systemes.augmentations:[];
        const def=defs.find(function(x){return x&&x.id===pairId;});
        const visual=j&&j.__augmentationsVisualV215;
        const d=visual&&visual.defs&&visual.defs[pairId];
        if(!def||!d)return;
        const k=H.idleNombre_(upgrade?def.upgradeSecondsK:def.secondsK);
        if(!(k>0))return;
        rebaserVisuelAugmentsIdleV1_(visual);
        const cleP=upgrade?'upgradeProgress':'progress';
        const cleS=upgrade?'upgradeSeconds':'seconds';
        const cleW=upgrade?'upgradeWaiting':'waiting';
        const ancienSec=H.idleNombre_(d[cleS]);
        /* Fraction actuelle de la barre : celle de l'écran si la piste tournait, sinon celle du serveur ; elle ne change pas avec l'allocation (voir recalculerPisteFractionIdleV1_). */
        const fracAvant=ancienSec>0?Math.min(1,H.idleNombre_(d[cleP])):H.idleNombre_(upgrade?def.upgradeProgressFraction:def.progressFraction);
        const nouveau=recalculerPisteFractionIdleV1_(k,fracAvant,alloc);
        d[cleS]=nouveau.seconds;
        d[cleP]=nouveau.progress;
        d[cleW]=false;
        def[upgrade?'upgradeSecondsPerLevel':'secondsPerLevel']=nouveau.seconds>0?nouveau.seconds:null;
        def[upgrade?'upgradeProgressPct':'progressPct']=nouveau.progress;
        const texte=document.querySelector('[data-idle-aug-parniveau-v1="'+pairId+':'+(upgrade?'upgrade':'main')+'"]');
        /* Norman (2026-10-01) : plus de « ⏱ … par niveau » : cette durée dépend de l'énergie placée, elle n'a pas lieu d'être. L'élément reste, vide. */
        if(texte)texte.textContent='';
      }

      /*
       * 2026-09-24 (Norman) : « il faudrait le temps indiqué pour qu'elle prenne un niveau ». Durée d'un niveau, coût en Or, et — tant
       * que la barre est pleine faute d'Or (wiki : chaque niveau coûte de l'Or) — ce qu'il manque. Aussi rafraîchi à chaque tick par
       * soreal-idle-ui.js (data-idle-aug-eta-v1) : le compte à rebours suit la barre.
       */
      function formatDureeAugmentIdleV1_(secondes){
        let s=Math.max(0,Math.ceil(Number(secondes)||0));
        if(s<60)return s+' s';
        const j=Math.floor(s/86400);s-=j*86400;
        const h=Math.floor(s/3600);s-=h*3600;
        const m=Math.floor(s/60);s-=m*60;
        if(j>0)return j+' j '+h+' h';
        if(h>0)return h+' h '+m+' min';
        return m+' min '+s+' s';
      }
      window.__formatDureeAugmentIdleV1__=formatDureeAugmentIdleV1_;
      function texteEtaAugmentIdleV1_(x,ecoule){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const secondes=Number(x&&x.seconds);
        if(!(secondes>0))return 'Place de l’énergie pour progresser.';
        if(x.waiting){
          const manque=Math.max(0,Number(x.goldCost)-Number(x.gold));
          return manque>0
            ?'⏳ Barre pleine : il manque '+H.formatGrandNombreIdleV70_(manque)+' Or pour le niveau suivant.'
            :'⏳ Barre pleine : plus de niveau disponible pour l’instant (défi en cours).';
        }
        const restant=secondes*(1-Math.max(0,Math.min(1,Number(x.progress)||0)))-(Number(ecoule)||0);
        const reste=((restant%secondes)+secondes)%secondes;
        return 'Niveau suivant dans '+formatDureeAugmentIdleV1_(reste||secondes);
      }
      window.__texteEtaAugmentIdleV1__=texteEtaAugmentIdleV1_;

      /*
       * Norman (2026-09-29) : « retravailler les menus Augmentations, Time Machine, Blood Magic : plus
       * clairs dans leur manière d'être utilisés, et savoir à quoi sert chaque chose. » Un bloc d'aide
       * commun aux trois pages : un résumé (à quoi sert le menu) puis des étapes numérotées. Chaque
       * phrase vient de la page wiki NGU du menu (Augmentations, Broken Time Machine, Blood Magic,
       * consultées le 2026-09-29) -- aucune valeur inventée. Anti-spoil (AGENTS.md, règle n°2) : l'appelant
       * ne passe que du texte relatif à ce que le joueur a DÉJÀ débloqué. Le bloc est repliable et son état
       * survit au re-rendu (la synchro périodique redessine la page) via localStorage.
       */
      function aideMenuOuverteIdleV1_(cle){
        try{return localStorage.getItem('soreal_idle_aide_v1_'+cle)!=='0';}catch(_e){return true;}
      }
      window.__basculerAideMenuIdleV1__=function(cle,details){
        try{localStorage.setItem('soreal_idle_aide_v1_'+cle,details&&details.open?'1':'0');}catch(_e){}
      };
      function carteAideMenuIdleV1_(cle,resume,etapes){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        return '<details class="soreal-idle-aide-v1" data-idle-aide-v1="'+H.idleHtml_(cle)+'"'+(aideMenuOuverteIdleV1_(cle)?' open':'')+' ontoggle="window.__basculerAideMenuIdleV1__(\''+H.idleHtml_(cle)+'\',this)">'+
          '<summary>💡 À quoi ça sert ?</summary>'+
          '<p class="soreal-idle-aide-resume-v1">'+H.idleHtml_(resume)+'</p>'+
          '<ol class="soreal-idle-aide-etapes-v1">'+etapes.map(function(e){return '<li>'+H.idleHtml_(e)+'</li>';}).join('')+'</ol>'+
        '</details>';
      }
      /* Ligne de légende sous l'aide : ce que font les boutons de la barre d'outils (Input, Cap, Idle) -- la même pour Augmentations / Time Machine / Blood Magic. */
      function legendeAllocationIdleV1_(ressource,libre,croix){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        /* Blood Magic (Norman, 2026-10-01) : le « + » y est une croix renversée. */
        const plus=croix?'<b class="soreal-idle-blood-croix-v1">✝︎</b>':'<b>+</b>';
        return '<p class="soreal-idle-aide-legende-v1"><b>Input</b> = la quantité déplacée à chaque clic sur '+plus+' (placer) ou <b>−</b> (retirer). '+
          '<b>Max</b> et <b>1/2</b>, <b>1/4</b> remplissent Input à partir de ton maximum de '+H.idleHtml_(ressource)+' ; <b>Idle</b> à partir de celui qui est libre. '+
          (libre?'<b>Max</b> place tout ce qui est libre.':'')+'</p>';
      }

      function pageAugmentationsIdleV48_(j){
        const sys=systemeMetaParIdIdleV130_(j,'augmentations');
        /* No Augmentations Challenge : « the augmentations feature is entirely off-limits for the duration of this challenge ». */
        if(j&&j.systemes&&j.systemes.challenge&&j.systemes.challenge.active==='noAugmentations')return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('🦾 Augmentations','Menu interdit pendant le défi.')+'<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">🚫 No Augmentations Challenge : le menu Augmentations est interdit tant que le défi est en cours. Termine-le ou abandonne-le pour y retourner.</div>';
        if(!sys||!sys.state||!sys.state.unlocked)return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        const snap=j&&j.systemes||{},defs=Array.isArray(snap.augmentations)?snap.augmentations:[],pairs=(sys.state.data||{}).pairs||{};
        /*
         * Déblocage des Augments et de leurs Upgrades (Norman, 2026-10-04 : « toute l'énergie que je place m'est rendue » ; essai en direct sur son compte : « Ciseaux dangereux » affiché comme disponible, toute l'énergie
         * placée revenait au bout d'une seconde). Le serveur compare le seuil au boss du RUN EN COURS (context.bosses, remis à zéro à chaque Rebirth, comme tous les déblocages de systèmes) ; la page, elle, lisait le
         * meilleur boss de tous les temps (records.highestBoss = 61 contre 32 dans le run) et proposait donc des Upgrades que le serveur refusait en bloc. Le déblocage lit maintenant le même boss que le serveur ;
         * « Boss max » reste affiché pour information.
         */
        const bossMax=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(snap.records&&snap.records.highestBoss||0),boss=Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(j&&j.bossVaincus)),gold=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snap.currencies&&snap.currencies.gold||0),mult=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snap.bonuses&&snap.bonuses.augmentationMultiplier||1);
        /*
         * Norman (2026-10-03) : chronos très précis. Un redessin de la page ne doit JAMAIS remettre la barre en arrière : si les chiffres du serveur n'ont pas changé depuis le dernier dessin (même tableau),
         * on garde le repère qui tourne déjà, rebasé à maintenant. Sinon (nouvelle réponse), le repère part de l'instant où le serveur a produit ces chiffres : réception moins un demi aller-retour.
         */
        const etatAug=window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat();
        const visuelAugExistant=etatAug.__augmentationsVisualV215;
        const garderVisuelAug=Boolean(visuelAugExistant&&visuelAugExistant.src===defs&&defs.length);
        if(garderVisuelAug)rebaserVisuelAugmentsIdleV1_(visuelAugExistant);
        if(!garderVisuelAug){
        etatAug.__augmentationsVisualV215=construireVisuelAugmentsIdleV1_(j);
        rebaserVisuelAugmentsIdleV1_(etatAug.__augmentationsVisualV215);
        }
        const cap=Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snap.resources&&snap.resources.energy&&snap.resources.energy.cap||0));
        /* Montée en puissance : du premier Augment (rang 0) au dernier (rang 5). */
        const rangAugment=function(d){const i=defs.findIndex(function(x){return x&&d&&x.id===d.id;});return Math.max(0,Math.min(5,Math.round(Math.max(0,i)*5/Math.max(1,defs.length-1))));};
        function track(def,pair,upgrade,ok){
          const value=Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(upgrade?pair.upgradeEnergy:pair.energy));
          const pct=Math.max(0,Math.min(100,window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(upgrade?def.upgradeProgressPct:def.progressPct)*100));
          const level=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(upgrade?pair.upgradeLevel:pair.level);
          /* Deuxième ligne d'un Augment : le vrai nom de son Upgrade (wiki NGU Idle « Augmentations » : Danger Scissors, Drinking The Milk Too…), en français. */
          const label=upgrade?'⬆️ '+(IDLE_NOMS_UPGRADES_AUGMENTS_V1[def.upgrade&&def.upgrade.id]||(def.upgrade&&def.upgrade.name)||'Upgrade'):'';
          const sousTitre='';
          return '<div class="soreal-idle-aug-piste-v1'+(upgrade?' upgrade':'')+'" data-rang-v1="'+rangAugment(def)+'" style="margin-top:8px;opacity:'+(ok?'1':'.45')+'"><div style="display:flex;justify-content:space-between"><b>'+(label?label+' · ':'')+'Niv. <span data-idle-aug-niv-v1="'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.id)+':'+(upgrade?'upgrade':'main')+'">'+level+'</span></b><span id="sorealIdleAugAllocV1_'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.id)+'_'+(upgrade?'upgrade':'main')+'" class="soreal-idle-bt-allocation-v120">'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(value)+'⚡</span></div>'+(sousTitre?'<div class="soreal-idle-aug-soustitre-v1">'+sousTitre+'</div>':'')+'<div style="font-size:13px;color:#aeb5c8;margin:3px 0 1px">'+'<span data-idle-aug-parniveau-v1="'+def.id+':'+(upgrade?'upgrade':'main')+'"></span>Coût du prochain niveau 💰 <span data-idle-aug-cout-v1="'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.id)+':'+(upgrade?'upgrade':'main')+'">'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(upgrade?def.upgradeGoldCost:def.goldCost)+' Or</span></div><div data-idle-aug-eta-v1="'+def.id+':'+(upgrade?'upgrade':'main')+'" style="font-size:13px;color:#c7d2fe;margin-bottom:3px">'+texteEtaAugmentIdleV1_({seconds:upgrade?def.upgradeSecondsPerLevel:def.secondsPerLevel,progress:upgrade?def.upgradeProgressPct:def.progressPct,waiting:upgrade?def.upgradeWaitingGold:def.waitingGold,goldCost:upgrade?def.upgradeGoldCost:def.goldCost,gold:gold},0)+'</div><div class="soreal-idle-bt-track-v120"><div data-idle-aug-bar-v215="'+def.id+':'+(upgrade?'upgrade':'main')+'" class="soreal-idle-bt-fill-v120" style="width:100%;transform:scaleX('+(pct/100)+');transform-origin:left center;will-change:transform;background:#6366f1;transition:none"></div></div><div class="soreal-idle-bt-actions-v120" style="margin-top:6px">'+[['plus','+'],['moins','−'],['max','Max']].map(function(b){return '<button type="button" '+(ok?'onclick="window.__ajusterAugmentIdleV1__(\''+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(def.id)+'\','+upgrade+',\''+b[0]+'\')"':'disabled')+'>'+b[1]+'</button>';}).join('')+'</div></div>';
        }
        return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('🦾 Augmentations','Renforce ton Attack et ta Defense en y investissant de l’Energy et de l’Or.')+
          carteAideMenuIdleV1_('augmentations','Chaque Augment te donne un multiplicateur d’Attack et de Defense. Les multiplicateurs de tous tes Augments s’additionnent.',[
            'Place de l’Energy sur un Augment avec + : plus il en reçoit, plus sa barre se remplit vite.',
            'Quand la barre est pleine, l’Augment gagne un niveau si tu as assez d’Or (le coût d’un niveau = coût de base × ce niveau).',
            'Chaque Augment a une Upgrade associée : elle coûte de l’Or et de l’Energy, et multiplie le bonus de l’Augment par (1 + niveau²).',
            'Chaque Augment et chaque Upgrade a sa propre Energy et progresse en parallèle des autres.',
            'Tous les niveaux sont remis à zéro à chaque Rebirth.'
          ])+
          '<div class="soreal-idle-summary-grid-v28"><div class="soreal-idle-summary-v28">💪 Bonus total Attack &amp; Defense<b id="sorealIdleAugMultV1">x'+mult.toFixed(3)+'</b></div><div class="soreal-idle-summary-v28">👹 Boss max<b>'+bossMax+'</b></div></div>'+
          legendeAllocationIdleV1_('Energy',true)+
          '<div class="soreal-idle-bt-toolbar-v120"><div class="soreal-idle-bt-input-box-v120"><label for="sorealIdleAugInputV1">🎚️ Input</label><input id="sorealIdleAugInputV1" type="text" value="'+montantAugmentIdleV1+'" title="Un nombre, ou une fraction comme 1/8 (résolue en 1/8 de l\'énergie idle libre à la validation)" oninput="window.__saisirMontantAugmentIdleV1__(this.value)" onblur="window.__resoudreFractionInputIdleV1__(this);window.__saisirMontantAugmentIdleV1__(this.value)"></div><div class="soreal-idle-bt-info-v1">Énergie libre : <b id="sorealIdleAugEnergieLibreV1">'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(j&&j.energie)))+'</b> ⚡</div>'+
          '<div class="soreal-idle-bt-presets-v120"><span>⚡ Energy Cap</span><button type="button" onclick="window.__presetAugmentIdleV1__(\'cap\',1)">Max</button><button type="button" onclick="window.__presetAugmentIdleV1__(\'cap\',.5)">1/2</button><button type="button" onclick="window.__presetAugmentIdleV1__(\'cap\',.25)">1/4</button></div>'+
          '<div class="soreal-idle-bt-presets-v120"><span>💤 Idle</span><button type="button" onclick="window.__presetAugmentIdleV1__(\'idle\',.5)">1/2</button><button type="button" onclick="window.__presetAugmentIdleV1__(\'idle\',.25)">1/4</button><button type="button" class="clear" onclick="window.__viderAugmentsIdleV1__()">Tout retirer</button></div></div>'+
          /*
           * Anti-spoil (2026-09-27, Norman + AGENTS.md règle n°2) : IDLE_NGU_AUGMENTATIONS est déjà trié par unlockBoss croissant
           * (idle-ngu-progression.js), donc « débloqués + le prochain » est juste une troncature à la première paire non débloquée
           * (exactement le même principe que groupeBasicTrainingIdleV120_/premierVerrouille, soreal-idle-ui.js). La paire encore
           * verrouillée montrée ensuite n'affiche ni son nom, ni son seuil ("Boss N") -- jamais une condition en clair, comme la
           * ligne verrouillée de Basic Training (icone + « ??????? »).
           */
          (function(){
            const premierVerrouilleIndex=defs.findIndex(function(def){return boss<window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.unlockBoss||0);});
            const defsVisibles=premierVerrouilleIndex<0?defs:defs.slice(0,premierVerrouilleIndex+1);
            return '<div style="display:grid;gap:10px;margin-top:10px">'+defsVisibles.map(function(def){
              const pair=pairs[def.id]||{};
              const mainOk=boss>=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.unlockBoss||0);
              if(!mainOk){
                return '<div class="soreal-idle-section-v8" style="margin:0;opacity:.55"><div style="display:flex;justify-content:space-between;gap:8px"><b>🔒 ???????</b></div><div style="font-size:14px;color:#aeb5c8;margin-top:4px">Augment verrouillé.</div></div>';
              }
              const upgradeOk=boss>=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.upgrade&&def.upgrade.unlockBoss||999999);
              /* "Boss N" n'est jamais un spoil ICI : l'augment est déjà débloqué, c'est un rappel historique, pas une condition à venir. Idem pour "Upgrade N" une fois l'upgrade lui-même débloqué. */
              return '<div class="soreal-idle-section-v8" data-icone="'+(IDLE_ICONES_AUGMENTS_V1[def.id]||'')+'" style="margin:0"><div style="display:flex;justify-content:space-between;gap:8px"><b>'+(IDLE_ICONES_AUGMENTS_V1[def.id]?IDLE_ICONES_AUGMENTS_V1[def.id]+' ':'')+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(IDLE_NOMS_AUGMENTS_V1[def.id]||def.name||def.id)+'</b><span>Boss '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.unlockBoss||0)+(upgradeOk?' · Upgrade '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(def.upgrade.unlockBoss||0):'')+'</span></div>'+track(def,pair,false,mainOk)+(def.upgrade?(upgradeOk?track(def,pair,true,true):'<div style="margin-top:8px;opacity:.55;font-size:14px;color:#aeb5c8">🔒 Upgrade verrouillé.</div>'):'')+'</div>';
            }).join('')+'</div>';
          })();
      }

      /*
       * Broken Time Machine (2026-09-25, d'après la capture du jeu fournie par Norman) : bandeau « BROKEN TIME MACHINE », deux pistes
       * (Machine Speed en vert = Energy ; Gold Multiplier en jaune = Magic) avec barre de progression vers le niveau suivant, boutons + / −,
       * champ « Target » (niveau cible ; à l'atteinte l'allocation de la piste est retirée, 0 = aucun), ressource allouée et niveau ;
       * panneau gris des facteurs du GPS. + / − placent ou retirent la valeur du champ Input (comme Basic Training et les Augmentations) ;
       * Max place toute la ressource libre de la piste. Les facteurs viennent de j.systemes.timeMachineView (mêmes valeurs que le calcul du GPS).
       */
      /*
       * Norman (2026-09-29) : « je veux garder le visuel actuel [de Time Machine], mais je veux le
       * son lié aux plus et moins de basic training et l'animation de l'énergie allouée de basic
       * training également. » Le son (btPlus/btMinus/btCap) était déjà présent -- ce qui manquait
       * était la mise à jour OPTIMISTE locale (comme ajusterAugmentIdleV1_/ajusterBasicTrainingIdleV120_) :
       * avant ce correctif, le clic attendait la réponse serveur (actionMetaNoyauIdleV130_) avant
       * que la barre/le chiffre ne bouge, exactement le symptôme "menus plus lents que Basic
       * Training". Magie : mutée sur idleEtat.systemes.resources.magic.current (le même champ que
       * le remplissage au compte-goutte de la Beta 6.5, pour rester cohérent avec lui).
       */
      /*
       * Time Machine : recalcul local de la piste modifiée (Energy = vitesse, Magic = or). Durée du niveau = K / allocation (K : speedK /
       * goldK fournis par le serveur), progression en secondes inchangée. Les deux pistes sont d'abord avancées du temps écoulé, puis le
       * tout repart de « maintenant » ; la barre et le compte à rebours sont repeints tout de suite (patcherBarresTimeMachineIdleV1_).
       */
      function rebaserVueTimeMachineIdleV1_(vue){
        const maintenant=Date.now();
        const ecoule=Math.max(0,(maintenant-(vue.__at||maintenant))/1000);
        [['speed','speedEtaSeconds'],['gold','goldEtaSeconds']].forEach(function(c){
          const eta=vue[c[1]];
          if(eta===null||eta===undefined||!Number.isFinite(Number(eta)))return;
          const avance=Math.min(ecoule,Math.max(0,Number(eta)));
          vue[c[0]+'ProgressSeconds']=Math.max(0,Number(vue[c[0]+'ProgressSeconds'])||0)+avance;
          vue[c[1]]=Math.max(0,Number(eta)-avance);
        });
        vue.__at=maintenant;
      }
      function recalculerTimeMachineLocalIdleV1_(j,ressource,alloc){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const vue=j&&j.systemes&&j.systemes.timeMachineView;
        if(!vue)return;
        const piste=ressource==='energy'?'speed':'gold';
        const k=H.idleNombre_(vue[piste+'K']);
        if(!(k>0))return;
        rebaserVueTimeMachineIdleV1_(vue);
        const progSec=H.idleNombre_(vue[piste+'ProgressSeconds']);
        const etaAvant=vue[piste+'EtaSeconds'];
        /* Fraction actuelle : secondes écoulées sur durée du niveau (écoulé + reste) ; sans durée (aucune ressource), la fraction du serveur. */
        const fracAvant=(etaAvant!==null&&etaAvant!==undefined&&Number.isFinite(Number(etaAvant))&&progSec+Number(etaAvant)>0)
          ?progSec/(progSec+Number(etaAvant))
          :H.idleNombre_(vue[piste+'Fraction']);
        const nouveau=recalculerPisteFractionIdleV1_(k,fracAvant,alloc);
        vue[piste+'Fill']=nouveau.progress;
        vue[piste+'Fraction']=nouveau.progress;
        vue[piste+'ProgressSeconds']=nouveau.seconds>0?nouveau.progress*nouveau.seconds:progSec;
        vue[piste+'EtaSeconds']=nouveau.seconds>0?Math.max(0,(1-nouveau.progress)*nouveau.seconds):null;
        if(typeof H.patcherBarresTimeMachineIdleV1_==='function')H.patcherBarresTimeMachineIdleV1_(j);
      }

      function ajusterTimeMachineIdleV1_(ressource,mode){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const s=systemeMetaParIdIdleV130_(j,'timeMachine');
        const current=Math.max(0,H.idleNombre_(s&&s.state&&s.state.allocation&&s.state.allocation[ressource]));
        const pas=Math.max(1,Math.floor(Number((document.getElementById('sorealIdleTmInputV1')||{}).value)||montantAugmentIdleV1));
        if(Number.isFinite(pas)&&pas>=1)montantAugmentIdleV1=pas;
        /*
         * Norman (2026-09-29) : « il me permet d'ajouter de l'énergie même si je n'en ai pas. elle
         * est ensuite retirée mais il ne doit même pas l'accepter. » Contrairement à
         * ajusterBasicTrainingIdleV120_ (soreal-idle-ui.js, Math.min(input,idleAvant)) et
         * ajusterAugmentIdleV1_, "plus" ici ajoutait tout le pas sans jamais le plafonner à la
         * ressource libre réelle -- accepté localement puis corrigé au prochain état serveur, d'où
         * l'impression d'un ajout accepté puis retiré. Même plafond que les autres écrans.
         */
        const libre=Math.max(0,H.idleNombre_(
          ressource==='energy'
            ?(j&&j.energie)
            :(j&&j.systemes&&j.systemes.resources&&j.systemes.resources.magic&&j.systemes.resources.magic.current)
        ));
        const value=mode==='plus'
          ?current+Math.min(pas,libre)
          :mode==='moins'
            ?Math.max(0,current-pas)
            /* MAX = tout ce qui est libre (comme le serveur), jamais le plafond théorique : Norman (2026-10-02) voyait « 124K » (énergie pas encore générée) avant la vraie valeur 62,9K. */
            :Math.max(current,Math.min(current+libre,allocationMaxMetaIdleV48_(j,'timeMachine',ressource)));
        const delta=value-current;

        if(mode==='plus'&&delta<=0&&libre<=0&&H.messageFlottantIdleV32_){
          H.messageFlottantIdleV32_(
            ressource==='energy'
              ?'⚡ Aucune énergie Idle disponible à allouer pour le moment.'
              :'🔮 Aucune Magic disponible à allouer pour le moment.'
          );
        }

        if(delta!==0){
          if(H.jouerEffetAudioIdleV199_){
            H.jouerEffetAudioIdleV199_(
              mode==='plus'?'tmPlus':mode==='moins'?'tmMinus':'tmCap'
            );
          }
          if(s&&s.state&&s.state.allocation)s.state.allocation[ressource]=value;
          if(ressource==='energy'){
            if(j)j.energie=Math.max(0,H.idleNombre_(j.energie)-delta);
          }else if(ressource==='magic'){
            const ressourceMagie=j&&j.systemes&&j.systemes.resources&&j.systemes.resources.magic;
            if(ressourceMagie)ressourceMagie.current=Math.max(0,H.idleNombre_(ressourceMagie.current)-delta);
          }
          /*
           * Norman (2026-09-29, suite) : même correctif de réactivité qu'Augmentation/Blood Magic --
           * patch DOM ciblé (le chiffre alloué de CETTE piste + la barre d'Énergie/Magie principale)
           * au lieu d'un rendreIdleEtat_ complet. actionMetaNoyauIdleV130_ redessine tout dès la
           * réponse serveur de toute façon : aucune perte de cohérence, seul le clic devient instantané.
           */
          const cleAlloc=ressource==='energy'?'vitesse':'or';
          const allocSpan=document.getElementById('sorealIdleTmAllocV1_'+cleAlloc);
          if(allocSpan)allocSpan.textContent=H.formatGrandNombreIdleV70_(value);
          if(typeof H.rafraichirEnergieEtBoutonsIdleV9_==='function')H.rafraichirEnergieEtBoutonsIdleV9_();
        }

        if(delta!==0)recalculerTimeMachineLocalIdleV1_(j,ressource,value);
        envoyerAllocRapideV1_({action:'allocate',system:'timeMachine',resource:ressource,value:value});
      }
      window.__ajusterTimeMachineIdleV1__=ajusterTimeMachineIdleV1_;
      window.__cibleTimeMachineIdleV1__=function(piste,valeur){
        const n=Math.max(0,Math.floor(Number(valeur)||0));
        envoyerAllocRapideV1_({action:'setTimeMachineTarget',track:String(piste),value:n});
      };

      /*
       * Mise à jour EN PLACE des chiffres de la page Time Machine après chaque synchro (Norman, 2026-10-03 : « vérifie que ces informations soient à jour et qu'elles se mettent à jour avec les
       * changements »). Ils n'étaient écrits qu'au dessin de la page : meilleur Or, meilleur boss, niveaux, GPS restaient figés jusqu'à un changement de menu. Un facteur qui apparaît ou disparaît
       * (passe de « sans effet » à actif) change la liste affichée : on redessine alors la page une fois.
       */
      /*
       * Barre d'Or de la machine (Norman, 2026-10-03 : « la Time Machine a une barre supplémentaire dans NGU IDLE, celle du bas de la capture : c'est elle qui tique 1 fois par seconde de base »).
       * Wiki « Broken Time Machine » : « Machine Speed: speed up how fast the bar fills » ; 1 remplissage par seconde au niveau 0, +1 par niveau jusqu'à 50 (« 1 fill per tick »). Chaque
       * remplissage rapporte « Gold per Bar Fill ». Animation purement CSS, calée sur l'heure du SERVEUR (même phase pour tout le monde, aucun saut au redessin) ; à partir de 16
       * remplissages par seconde l'œil ne distingue plus les cycles : la barre reste pleine et scintille.
       */
      function legendeBarreOrTimeMachineIdleV1_(vue){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const n=Math.max(1,H.idleNombre_(vue.barFillsPerSecond)||1);
        return '💰 +'+H.formatGrandNombreIdleV70_(H.idleNombre_(vue.goldPerBarFill))+' Or à chaque remplissage · '+(n<=1?'1 remplissage par seconde':H.formatGrandNombreIdleV70_(n)+' remplissages par seconde');
      }

      function styleBarreOrTimeMachineIdleV1_(fills){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const n=Math.max(1,Math.min(50,H.idleNombre_(fills)||1));
        const periode=1/n;
        if(periode<1/16)return {classe:'rapide',style:''};
        const maintenant=typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now();
        const phase=(maintenant/1000)%periode;
        return {classe:'',style:'animation-duration:'+periode.toFixed(4)+'s;animation-delay:-'+phase.toFixed(4)+'s'};
      }

      function patcherChiffresTimeMachineIdleV1_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const vue=j&&j.systemes&&j.systemes.timeMachineView;
        if(!vue||!document.querySelector('.soreal-idle-tm-v1'))return;
        const nombre=function(v){return H.formatGrandNombreIdleV70_(H.idleNombre_(v));};
        const pct=function(mult){return Number(H.idleNombre_(mult)*100).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' %';};
        const SPEC={goldPerBarFill:nombre,barFillsPerSecond:nombre,highestBossMultiplier:nombre,goldMultiplier:nombre,machineSpeedMultiplier:nombre,grossGps:nombre,netGps:nombre,
          bloodMagicMultiplier:pct,nguMultiplier:pct,challengeMultiplier:pct,beardMultiplier:pct};
        const FACULTATIFS={bloodMagicMultiplier:1,nguMultiplier:1,challengeMultiplier:1,beardMultiplier:1};
        let structure=false;
        Object.keys(SPEC).forEach(function(cle){
          const el=document.querySelector('[data-tm-stat="'+cle+'"]');
          const actif=!FACULTATIFS[cle]||Math.abs(H.idleNombre_(vue[cle])-1)>=1e-9;
          if(FACULTATIFS[cle]&&actif!==Boolean(el)){structure=true;return;}
          if(!el)return;
          const texte=SPEC[cle](vue[cle]);
          if(el.textContent!==texte)el.textContent=texte;
        });
        /* Bandeau d'identité : gain d'Or par seconde en grand, mis à jour avec chaque synchro. */
        document.querySelectorAll('[data-tm-hero]').forEach(function(el){
          const cle=el.getAttribute('data-tm-hero');
          if(!SPEC[cle])return;
          const texte=SPEC[cle](vue[cle]);
          if(el.textContent!==texte)el.textContent=texte;
        });
        const barreOr=document.querySelector('[data-tm-or-remplissage]');
        if(barreOr){
          const b=styleBarreOrTimeMachineIdleV1_(vue.barFillsPerSecond);
          const cle=String(H.idleNombre_(vue.barFillsPerSecond));
          if(barreOr.getAttribute('data-fills')!==cle){
            barreOr.setAttribute('data-fills',cle);
            barreOr.className='soreal-idle-tm-or-remplissage-v1'+(b.classe?' '+b.classe:'');
            barreOr.setAttribute('style',b.style);
          }
          const leg=document.querySelector('[data-tm-or-legende]');
          if(leg){const t=legendeBarreOrTimeMachineIdleV1_(vue);if(leg.textContent!==t)leg.textContent=t;}
        }
        const s=systemeMetaParIdIdleV130_(j,'timeMachine');
        const data=(s&&s.state&&s.state.data)||{};
        [['vitesse',data.speedLevel],['or',data.goldLevel]].forEach(function(x){
          const el=document.querySelector('[data-tm-niveau="'+x[0]+'"]');
          if(!el)return;
          const texte=nombre(x[1]||0);
          if(el.textContent!==texte)el.textContent=texte;
        });
        if(structure&&typeof H.rafraichirMenuRacineIdleV28_==='function')H.rafraichirMenuRacineIdleV28_();
      }
      window.__patcherChiffresTimeMachineIdleV1__=patcherChiffresTimeMachineIdleV1_;

      function pageTimeMachineIdleV48_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const s=systemeMetaParIdIdleV130_(j,'timeMachine');
        if(!s||!s.state||!s.state.unlocked)return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        const data=s.state.data||{};
        const vue=(j&&j.systemes&&j.systemes.timeMachineView)||{};
        /* Repère de temps de la vue serveur : sert au recalcul local de la progression au clic (rebaserVueTimeMachineIdleV1_). */
        if(vue&&!vue.__at)vue.__at=Date.now();
        const magic=systemeMetaParIdIdleV130_(j,'bloodMagic');
        const magicOk=Boolean(magic&&magic.state&&magic.state.unlocked);
        const nombre=function(v){return H.formatGrandNombreIdleV70_(H.idleNombre_(v));};
        const pct=function(mult){return Number(H.idleNombre_(mult)*100).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' %';};
        const alloue=function(r){return Math.max(0,H.idleNombre_(s.state.allocation&&s.state.allocation[r]));};
        const formaterEta=function(secondes){
          const total=Math.max(0,Math.ceil(H.idleNombre_(secondes)));
          if(total<=0)return '0 s';
          const h=Math.floor(total/3600);
          const m=Math.floor((total%3600)/60);
          const s=total%60;
          if(h>0)return h+' h '+String(m).padStart(2,'0')+' min '+String(s).padStart(2,'0')+' s';
          if(m>0)return m+' min '+String(s).padStart(2,'0')+' s';
          return s+' s';
        };
        /*
         * Sous-titre de chaque piste (Norman, 2026-09-29 : « savoir à quoi sert chaque chose ») : la ressource
         * qu'elle consomme et ce qu'elle apporte, d'après la page wiki « Broken Time Machine » (consultée le
         * 2026-09-29) -- Machine Speed : Energy + Or, barre plus rapide jusqu'au niveau 50 puis multiplicateur d'Or
         * par niveau ; Gold Multiplier : Magic + Or, simple multiplicateur d'Or.
         */
        const SOUS_TITRES_PISTE={
          vitesse:'⚡ Energy + Or · accélère la barre (jusqu’au niveau 50), puis chaque niveau multiplie l’Or produit',
          or:'🔮 Magic + Or · multiplie l’Or produit par la machine'
        };
        const piste=function(cle,titre,ressource,libelleAlloc,niveau,fill,cible,verrou,etaSecondes){
          const largeur=Math.max(0,Math.min(100,H.idleNombre_(fill)*100));
          const etaValide=Number.isFinite(Number(etaSecondes));
          return '<section class="soreal-idle-tm-piste-v1 '+cle+(verrou?' locked':'')+'">'+
            '<div class="soreal-idle-tm-titre-v1">'+H.idleHtml_(titre)+'</div>'+
            '<div class="soreal-idle-tm-soustitre-v1">'+H.idleHtml_(SOUS_TITRES_PISTE[cle]||'')+'</div>'+
            (verrou
              ?''
              :'<div class="soreal-idle-tm-ligne-v1">'+
                '<div class="soreal-idle-tm-barre-wrap-v1">'+
                  '<div class="soreal-idle-tm-barre-v1"><div class="soreal-idle-tm-remplissage-v1" data-tm-fill0="'+(largeur/100).toFixed(6)+'" style="width:'+largeur.toFixed(2)+'%"></div></div>'+
                  '<div class="soreal-idle-tm-eta-v1" data-tm-eta-track="'+cle+'" data-tm-eta-seconds="'+(etaValide?Math.max(0,H.idleNombre_(etaSecondes)):'')+'">'+
                    (etaValide?'Fin de la barre dans '+formaterEta(etaSecondes):'Alloue une ressource pour démarrer la barre')+
                  '</div>'+
                '</div>'+
                '<div class="soreal-idle-tm-boutons-v1">'+
                  '<button type="button" title="Placer la valeur de Input" onclick="window.__ajusterTimeMachineIdleV1__(\''+ressource+'\',\'plus\')">+</button>'+
                  '<button type="button" title="Retirer la valeur de Input" onclick="window.__ajusterTimeMachineIdleV1__(\''+ressource+'\',\'moins\')">−</button>'+
                  '<button type="button" class="max" title="Placer toute la ressource libre" onclick="window.__ajusterTimeMachineIdleV1__(\''+ressource+'\',\'max\')">Max</button>'+
                '</div>'+
                '<div class="soreal-idle-tm-col-v1"><span>Cible</span><input type="number" inputmode="numeric" min="0" step="1" value="'+H.idleEntier_(cible)+'" title="Niveau cible : l\'allocation est retirée dès qu\'il est atteint (0 = aucune cible)" onchange="window.__cibleTimeMachineIdleV1__(\''+(cle==='vitesse'?'speed':'gold')+'\',this.value)"></div>'+
                '<div class="soreal-idle-tm-col-v1"><span>'+H.idleHtml_(libelleAlloc)+'</span><b id="sorealIdleTmAllocV1_'+cle+'" data-idle-alloc-pop-v1>'+nombre(alloue(ressource))+'</b></div>'+
                '<div class="soreal-idle-tm-col-v1"><span>Niveau</span><b data-tm-niveau="'+cle+'">'+nombre(niveau)+'</b></div>'+
              '</div>')+
          '</section>';
        };
        const stat=function(libelle,valeur,cle){return '<div><span>'+H.idleHtml_(libelle)+' :</span> <b'+(cle?' data-tm-stat="'+cle+'"':'')+'>'+valeur+'</b></div>';};
        const factSansEffet=function(libelle,mult,cle){return Math.abs(H.idleNombre_(mult)-1)<1e-9?'':stat(libelle,pct(mult),cle);};
        return '<div class="soreal-idle-tm-v1">'+
          '<header class="soreal-idle-tm-entete-v1"><h1>Machine à remonter le temps cassée</h1><p>(Ramasse cet or encore, et encore, et encore, et...)</p></header>'+
          /*
           * Bandeau d'identité (Norman, 2026-10-04 : « retravaille le menu Machine à remonter le temps cassée pour qu'il colle plus aux autres menus ; il doit avoir sa propre identité et bien nous rappeler qu'on gagne de l'OR »).
           * Une machine de laiton qui crache des pièces : le gain d'Or par seconde en grand, la barre d'Or qui bat à chaque remplissage et ce que rapporte un remplissage.
           */
          '<section class="soreal-idle-tm-hero-v1">'+
            '<div class="soreal-idle-tm-hero-pieces-v1" aria-hidden="true"><i>🪙</i><i>🪙</i><i>🪙</i><i>🪙</i><i>🪙</i></div>'+
            '<div class="soreal-idle-tm-hero-titre-v1">💰 Ta machine fabrique de l’Or</div>'+
            '<div class="soreal-idle-tm-hero-gps-v1"><b data-tm-hero="netGps">'+nombre(vue.netGps)+'</b><span> Or par seconde</span></div>'+
            '<div class="soreal-idle-tm-hero-sous-v1">Brut <b data-tm-hero="grossGps">'+nombre(vue.grossGps)+'</b> /s · <b data-tm-hero="goldPerBarFill">'+nombre(vue.goldPerBarFill)+'</b> Or à chaque remplissage de barre</div>'+
            (function(){const b=styleBarreOrTimeMachineIdleV1_(vue.barFillsPerSecond);return '<div class="soreal-idle-tm-or-v1"><div class="soreal-idle-tm-or-barre-v1"><div class="soreal-idle-tm-or-remplissage-v1'+(b.classe?' '+b.classe:'')+'" data-tm-or-remplissage="1" data-fills="'+H.idleNombre_(vue.barFillsPerSecond)+'" style="'+b.style+'"></div></div><div class="soreal-idle-tm-or-legende-v1" data-tm-or-legende="1">'+H.idleHtml_(legendeBarreOrTimeMachineIdleV1_(vue))+'</div></div>';})()+
          '</section>'+
          carteAideMenuIdleV1_('timeMachine','La Time Machine produit de l’Or toute seule (le GPS, Gold par seconde) en rejouant le meilleur drop d’Or que tu as obtenu en Adventure.',[
            'Vitesse de la machine (Energy + Or) : elle accélère la barre. Jusqu’au niveau 50 chaque niveau la remplit plus vite ; au-delà, chaque niveau ajoute un multiplicateur d’Or.'
          ].concat(magicOk?['Multiplicateur d’or (Magic + Or) : il multiplie simplement l’Or produit.']:[]).concat([
            'Ton meilleur boss vaincu multiplie aussi l’Or produit.',
            'Le niveau N coûte N fois le prix du niveau 1, en Or et dans la ressource allouée.',
            'Les niveaux sont remis à zéro à chaque Rebirth.'
          ]))+
          '<div class="soreal-idle-tm-input-v1"><label for="sorealIdleTmInputV1">🎚️ Input</label><input id="sorealIdleTmInputV1" type="text" title="Un nombre, ou une fraction comme 1/8 (résolue en 1/8 de l\'énergie idle libre à la validation)" value="'+montantAugmentIdleV1+'" oninput="window.__saisirMontantAugmentIdleV1__(this.value)" onblur="window.__resoudreFractionInputIdleV1__(this);window.__saisirMontantAugmentIdleV1__(this.value)"><span><b>Input</b> = quantité déplacée à chaque clic sur <b>+</b> (placer) ou <b>−</b> (retirer) ; <b>Max</b> place tout ce qui est libre. <b>Cible</b> = niveau visé : l’allocation est retirée dès qu’il est atteint (0 = pas de cible).</span></div>'+
          piste('vitesse','⏱️ Vitesse de la machine','energy','Énergie allouée',data.speedLevel||0,vue.speedFill,vue.speedTarget,false,vue.speedEtaSeconds)+
          /* Anti-spoil (AGENTS.md règle n°2) : tant que Blood Magic n'est pas débloqué, la piste Magic n'apparaît pas du tout (avant : « 🔒 Magic se débloque avec Blood Magic au boss 37 »). */
          (magicOk?piste('or','🪙 Multiplicateur d’or','magic','Magie allouée',data.goldLevel||0,vue.goldFill,vue.goldTarget,false,vue.goldEtaSeconds):'')+
          '<section class="soreal-idle-tm-stats-v1">'+
            '<div class="soreal-idle-tm-stats-titre-v1">🧮 Comment ton GPS est calculé</div>'+
            '<div class="soreal-idle-tm-stats-grille-v1">'+
              '<div>'+
                stat('🪙 Or par remplissage de barre',nombre(vue.goldPerBarFill),'goldPerBarFill')+
                stat('🔁 Remplissages de barre par seconde',nombre(vue.barFillsPerSecond),'barFillsPerSecond')+
                /* Anti-spoil : un facteur encore à 100 % (sans effet) n'est pas listé -- jamais le nom d'un système que le joueur n'a pas encore fait jouer. */
                factSansEffet('Bonus GPS Blood Magic',vue.bloodMagicMultiplier,'bloodMagicMultiplier')+
                factSansEffet('Multiplicateur GPS NGU',vue.nguMultiplier,'nguMultiplier')+
                factSansEffet('Multiplicateur des défis',vue.challengeMultiplier,'challengeMultiplier')+
              '</div>'+
              '<div>'+
                stat('👹 Multiplicateur du meilleur boss',nombre(vue.highestBossMultiplier),'highestBossMultiplier')+
                stat('🪙 Multiplicateur d’or',nombre(vue.goldMultiplier),'goldMultiplier')+
                stat('⏱️ Multiplicateur GPS de la vitesse',nombre(vue.machineSpeedMultiplier),'machineSpeedMultiplier')+
                factSansEffet('Multiplicateur GPS de la Barbe',vue.beardMultiplier,'beardMultiplier')+
              '</div>'+
            '</div>'+
            '<div class="soreal-idle-tm-gps-v1"><div>💰 GPS brut : <b data-tm-stat="grossGps">'+nombre(vue.grossGps)+'</b></div><div>💎 GPS net : <b data-tm-stat="netGps">'+nombre(vue.netGps)+'</b></div></div>'+
          '</section>'+
        '</div>';
      }

      /*
       * Norman (2026-09-29) : « Dans Blood magic, la manière dont tu l'as reproduit, ça n'est pas
       * opérationnel. » Cause : allocationMetaIdleV48_ (boutons 0/25/50/100% d'un montant ABSOLU) est
       * exactement le défaut déjà diagnostiqué et corrigé pour Augmentation le 2026-09-24 (voir le
       * commentaire juste au-dessus de cette fonction) -- jamais corrigé pour Blood Magic, resté sur
       * l'ancien helper générique. Remplacé par le même schéma Input + Cap/1/2/1/4 + Idle (Basic
       * Training/Augmentation), optimiste comme ajusterAugmentIdleV1_/ajusterTimeMachineIdleV1_.
       */
      /*
       * Norman (2026-09-29) : même correctif de réactivité qu'Augmentation (voir
       * rafraichirAllocationAugmentIdleV1_ plus haut) -- un patch DOM ciblé plutôt qu'un
       * rendreIdleEtat_ complet à chaque clic. La confirmation serveur (actionMetaNoyauIdleV130_)
       * continue de déclencher un rendu complet dès la réponse, donc aucune perte de cohérence :
       * seul le clic lui-même devient instantané.
       */
      function rafraichirAllocationBloodMagicIdleV1_(value){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const toolbarSpan=document.getElementById('sorealIdleBloodAllocV1');
        if(toolbarSpan)toolbarSpan.textContent=H.formatGrandNombreIdleV70_(value);
        /* Magie libre (Norman, 2026-10-05 : elle restait à 100 alors que tout était placé) : suit l'état local mis à jour par le clic. */
        const libreEl=document.getElementById('sorealIdleBloodLibreV1');
        const etatLibre=H.getIdleEtat();
        const magieLibre=etatLibre&&etatLibre.systemes&&etatLibre.systemes.resources&&etatLibre.systemes.resources.magic;
        if(libreEl&&magieLibre){const t=H.formatGrandNombreIdleV70_(Math.max(0,H.idleNombre_(magieLibre.current)));if(libreEl.textContent!==t)libreEl.textContent=t;}
        /* Compteur du rituel actif (les autres restent à 0) : mis à jour sur place, sans redessiner la page. */
        const sys=systemeMetaParIdIdleV130_(H.getIdleEtat(),'bloodMagic');
        const actif=sys&&sys.state&&sys.state.data&&sys.state.data.activeRitual;
        if(actif){
          const compteur=document.getElementById('sorealIdleBloodRitualAllocV1_'+actif);
          const texte=H.formatGrandNombreIdleV70_(value);
          if(compteur&&compteur.textContent!==texte)compteur.textContent=texte;
        }
        if(typeof H.rafraichirEnergieEtBoutonsIdleV9_==='function')H.rafraichirEnergieEtBoutonsIdleV9_();
      }

      /*
       * Blood Magic : recalcul local du rituel actif. Durée d'une complétion = K / Magic allouée (K : secondsK, fourni par le serveur).
       * Le visuel (barre + compte à rebours) est mis à jour tout de suite ; le ticker de soreal-idle-ui.js le repeint.
       */
      function recalculerBloodLocalIdleV1_(j,alloc){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const vue=j&&j.systemes&&j.systemes.bloodMagicView;
        if(!vue)return;
        const k=H.idleNombre_(vue.secondsK);
        if(!(k>0))return;
        const visuel=j.__bloodMagicVisualV1;
        const maintenant=performance.now();
        /* Fraction actuelle de la barre (celle de l'écran si elle tournait, sinon celle du serveur) : elle ne change pas avec l'allocation. */
        let fracAvant;
        if(visuel&&H.idleNombre_(visuel.secondsPerCompletion)>0){
          const ecoule=Math.max(0,(maintenant-(visuel.at||maintenant))/1000);
          const sec=H.idleNombre_(visuel.secondsPerCompletion);
          fracAvant=Math.min(1,(1-H.idleNombre_(visuel.etaSeconds)/sec)+ecoule/sec);
        }else{
          fracAvant=H.idleNombre_(vue.progressFraction);
        }
        const nouveau=recalculerPisteFractionIdleV1_(k,fracAvant,alloc);
        const progSec=nouveau.seconds>0?nouveau.progress*nouveau.seconds:H.idleNombre_(vue.progressSeconds);
        vue.secondsPerCompletion=nouveau.seconds>0?nouveau.seconds:null;
        vue.etaSeconds=nouveau.seconds>0?Math.max(0,(1-nouveau.progress)*nouveau.seconds):null;
        vue.progressFraction=nouveau.progress;
        vue.progressSeconds=progSec;
        j.__bloodMagicVisualV1=nouveau.seconds>0
          ?{ritual:vue.activeRitual,secondsPerCompletion:nouveau.seconds,etaSeconds:vue.etaSeconds,at:maintenant,src:vue}
          :null;
        /*
         * Plus de Magic sur le rituel (Norman, 2026-10-05 : « si j'enlève toute la magie, la barre continue de monter ») : la barre tournait encore, animée par le navigateur, car plus aucun repère ne la pilotait. On la fige là où elle en
         * était ; elle repart de ce point (donnée du serveur) dès qu'on remet de la Magic.
         */
        const barreRituel=document.querySelector('[data-idle-blood-bar-v1="'+vue.activeRitual+'"]');
        if(nouveau.seconds>0){
          window.__bloodFigeV1=null;
        }else{
          const pct=nouveau.progress;
          window.__bloodFigeV1={ritual:vue.activeRitual,pct:pct};
          if(barreRituel){
            if(barreRituel.__idleAugAnimationV217){barreRituel.__idleAugAnimationV217.cancel();barreRituel.__idleAugAnimationV217=null;delete barreRituel.dataset.idleAugDurationV217;}
            barreRituel.style.width='100%';
            barreRituel.style.transform='scaleX('+pct+')';
          }
        }
        const ligne=document.getElementById('sorealIdleBloodEtaLineV1_'+vue.activeRitual);
        if(ligne){
          ligne.style.display='';
          ligne.textContent=nouveau.seconds>0
            ?'⏱ '+formatDureeAugmentIdleV1_(vue.etaSeconds)+' avant le prochain rituel complété'
            :'Alloue de la Magic (ci-dessus) pour faire progresser ce rituel.';
        }
      }

      function ajusterBloodMagicIdleV1_(mode){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const s=systemeMetaParIdIdleV130_(j,'bloodMagic');
        const current=Math.max(0,H.idleNombre_(s&&s.state&&s.state.allocation&&s.state.allocation.magic));
        const pas=Math.max(1,Math.floor(Number((document.getElementById('sorealIdleBloodInputV1')||{}).value)||montantAugmentIdleV1));
        if(Number.isFinite(pas)&&pas>=1)montantAugmentIdleV1=pas;
        const ressourceMagie=j&&j.systemes&&j.systemes.resources&&j.systemes.resources.magic;
        const idleAvant=Math.max(0,H.idleNombre_(ressourceMagie&&ressourceMagie.current));
        const cible=mode==='plus'
          ?current+Math.min(pas,idleAvant)
          :mode==='moins'
            ?Math.max(0,current-pas)
            :current+idleAvant;
        const value=Math.max(0,H.idleEntier_(cible));
        const delta=value-current;

        if(delta!==0){
          if(H.jouerEffetAudioIdleV199_){
            H.jouerEffetAudioIdleV199_(
              mode==='plus'?'bloodPlus':mode==='moins'?'bloodMinus':'bloodCap'
            );
          }
          if(s&&s.state&&s.state.allocation)s.state.allocation.magic=value;
          if(ressourceMagie)ressourceMagie.current=Math.max(0,idleAvant-delta);
          recalculerBloodLocalIdleV1_(j,value);
          rafraichirAllocationBloodMagicIdleV1_(value);
        }

        envoyerAllocRapideV1_({action:'allocate',system:'bloodMagic',resource:'magic',value:value});
      }
      window.__ajusterBloodMagicIdleV1__=ajusterBloodMagicIdleV1_;

      function viderBloodMagicIdleV1_(){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const s=systemeMetaParIdIdleV130_(j,'bloodMagic');
        const current=Math.max(0,H.idleNombre_(s&&s.state&&s.state.allocation&&s.state.allocation.magic));
        if(current<=0)return;
        if(H.jouerEffetAudioIdleV199_)H.jouerEffetAudioIdleV199_('bloodMinus');
        if(s&&s.state&&s.state.allocation)s.state.allocation.magic=0;
        const ressourceMagie=j&&j.systemes&&j.systemes.resources&&j.systemes.resources.magic;
        if(ressourceMagie)ressourceMagie.current=Math.max(0,H.idleNombre_(ressourceMagie.current)+current);
        recalculerBloodLocalIdleV1_(j,0);
        rafraichirAllocationBloodMagicIdleV1_(0);
        envoyerAllocRapideV1_({action:'allocate',system:'bloodMagic',resource:'magic',value:0});
      }
      window.__viderBloodMagicIdleV1__=viderBloodMagicIdleV1_;

      /* Même raccourcis que la barre d'outils de Basic Training/Augmentation : "cap" part du plafond réel de Magic, "idle" part de la Magic actuellement libre. */
      function presetBloodMagicIdleV1_(source,fraction){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const input=document.getElementById('sorealIdleBloodInputV1');
        if(!input)return;
        const ressourceMagie=j&&j.systemes&&j.systemes.resources&&j.systemes.resources.magic;
        const base=source==='idle'?H.idleEntier_(ressourceMagie&&ressourceMagie.current):H.idleEntier_(ressourceMagie&&ressourceMagie.cap);
        const valeur=Math.max(1,Math.floor(base*Math.max(0,Number(fraction)||0)));
        input.value=String(valeur);
      }
      window.__presetBloodMagicIdleV1__=presetBloodMagicIdleV1_;

      /*
       * Norman : « Je pense que Blood Magic nécessite des boutons Cap + et - également », pour
       * chaque rituel (capture NGU jointe). Le serveur n'a qu'UNE SEULE allocation Magic partagée,
       * versée au rituel ACTIF (data.activeRitual, selectRitual) -- jamais une réserve indépendante
       * par rituel. Le bouton d'un rituel non actif l'active donc d'abord (comme le ferait le joueur
       * en cliquant "Choisir ce rituel"), puis applique le même ajustement que la barre d'outils
       * principale -- aucune capacité serveur inventée, seulement le même modèle déjà réel.
       */
      /* Bascule locale du rituel actif : la durée de base de chaque rituel est dans le catalogue, donc K(nouveau) = K(ancien) x base(nouveau) / base(ancien). */
      function basculerRituelLocalIdleV1_(j,s,ancienId,ritualId){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const vue=j&&j.systemes&&j.systemes.bloodMagicView;
        const catalogue=(j&&j.systemes&&Array.isArray(j.systemes.bloodRituals))?j.systemes.bloodRituals:[];
        const ancien=catalogue.find(function(r){return r&&r.id===ancienId;});
        const nouveau=catalogue.find(function(r){return r&&r.id===ritualId;});
        if(!vue||!ancien||!nouveau||!(H.idleNombre_(ancien.baseSeconds)>0))return;
        const magie=Math.max(0,H.idleNombre_(s.state.allocation&&s.state.allocation.magic));
        const k=H.idleNombre_(vue.secondsK)*H.idleNombre_(nouveau.baseSeconds)/H.idleNombre_(ancien.baseSeconds);
        const rit=s.state.data.rituals&&s.state.data.rituals[ritualId];
        const progBrut=Math.max(0,H.idleNombre_(rit&&rit.progress));
        const refRit=Math.max(0,H.idleNombre_(rit&&rit.progressRef));
        const secondesNouveau=(k>0&&magie>0)?k/magie:0;
        /* Fraction propre à ce rituel : progression sur la durée à laquelle elle a été mesurée (sinon, sur la durée actuelle). */
        const fracRit=refRit>0?progBrut/refRit:(secondesNouveau>0?progBrut/secondesNouveau:0);
        const calc=recalculerPisteFractionIdleV1_(k,fracRit,magie);
        const progSec=calc.seconds>0?calc.progress*calc.seconds:progBrut;
        vue.activeRitual=ritualId;
        vue.secondsK=k;
        vue.progressSeconds=progSec;
        vue.progressFraction=calc.progress;
        vue.secondsPerCompletion=calc.seconds>0?calc.seconds:null;
        vue.etaSeconds=calc.seconds>0?Math.max(0,(1-calc.progress)*calc.seconds):null;
        j.__bloodMagicVisualV1=calc.seconds>0?{ritual:ritualId,secondsPerCompletion:calc.seconds,etaSeconds:vue.etaSeconds,at:performance.now(),src:vue}:null;
      }

      function ajusterRituelBloodMagicIdleV1_(ritualId,mode){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const s=systemeMetaParIdIdleV130_(j,'bloodMagic');
        const ancienId=s&&s.state&&s.state.data&&s.state.data.activeRitual;
        if(s&&s.state&&s.state.data&&ancienId!==ritualId){
          s.state.data.activeRitual=ritualId;
          basculerRituelLocalIdleV1_(j,s,ancienId,ritualId);
          envoyerAllocRapideV1_({action:'selectRitual',ritual:ritualId});
          ajusterBloodMagicIdleV1_(mode);
          /* Un seul redessin LOCAL du menu (aucun aller-retour réseau) : la barre passe sur le nouveau rituel. */
          if(typeof H.rafraichirMenuRacineIdleV28_==='function')H.rafraichirMenuRacineIdleV28_();
          return;
        }
        ajusterBloodMagicIdleV1_(mode);
      }
      window.__ajusterRituelBloodMagicIdleV1__=ajusterRituelBloodMagicIdleV1_;

      /* Noms français des rituels de Blood Magic (Norman, 2026-10-01 : « traduits aussi le nom des rituels ») ; le moteur garde les noms du wiki. */
      const IDLE_BLOOD_NOMS_RITUELS_V1={
        tack:'Se piquer avec une punaise',
        papercuts:'Cinquante coupures de papier',
        hickey:'Un énorme suçon',
        barbedWire:'Avaler un bol de fil barbelé',
        bloodBank:'Braquage de la banque du sang',
        decapitation:'Se décapiter soi-même',
        woodchipper:'Faire un câlin à une déchiqueteuse',
        insideOut:'Se retourner comme un gant'
      };
      /* Dessins (émojis) pour que les menus parlent d'eux-mêmes (Norman, 2026-10-01). */
      /* Emoji + nom (modules/icones-v1.js) : « 🔥 Bonus offensif ». Sans le module, le nom seul. */
      function emojiNomIdleV1_(famille,id,nom){
        const I=window.__SOREAL_IDLE_ICONES_V1__;
        return I&&typeof I.avec==='function'?I.avec(famille,id,nom):String(nom==null?'':nom);
      }
      /* Noms français des Augments (Norman, 2026-10-02 : « traduis le menu Augmentation, les titres des barres : Safety Scissors… ») ; le moteur garde les noms du wiki. */
      const IDLE_NOMS_AUGMENTS_V1={
        scissors:'Ciseaux de sécurité',
        milk:'Infusion de lait',
        cannon:'Implant de canon',
        minigun:'Minigun monté sur l’épaule',
        buster:'Buster d’énergie',
        exoskeleton:'Exosquelette avancé',
        laserSword:'Sabre laser'
      };
      /* Noms français des Upgrades d'Augments (wiki NGU Idle, page « Augmentations » : une Upgrade par Augment, dans le même ordre). */
      const IDLE_NOMS_UPGRADES_AUGMENTS_V1={
        dangerScissors:'Ciseaux dangereux',
        drinkMilk:'Boire aussi le lait',
        missileLauncher:'Lance-missiles',
        actualAmmo:'Vraies munitions',
        chargeShot:'Tir chargé',
        energyShield:'Bouclier d’énergie',
        quadLaser:'Sabre laser à quatre côtés'
      };
      const IDLE_ICONES_AUGMENTS_V1={scissors:'✂️',milk:'🥛',cannon:'💥',minigun:'🔫',buster:'⚡',exoskeleton:'🦾',laserSword:'🗡️',insideOut:'🌀'};
      const IDLE_ICONES_SORTS_V1={numberBoost:'🔢',ironPill:'💊',bloodSpaghetti:'🍝',counterfeitGold:'💰',leeches:'🪱'};
      const IDLE_ICONES_RITUELS_V1={tack:'📍',papercuts:'📄',hickey:'💋',barbedWire:'⛓️',bloodBank:'🏦',decapitation:'💀',woodchipper:'🪵',insideOut:'🌀'};
      window.__idleBloodInfosOuvertesV1=window.__idleBloodInfosOuvertesV1||{};
      window.__basculerInfoSortBloodIdleV1__=function(id,bouton){
        const ouvert=!window.__idleBloodInfosOuvertesV1[id];
        window.__idleBloodInfosOuvertesV1[id]=ouvert;
        const zone=document.getElementById('sorealIdleBloodSortInfosV1_'+id);
        if(zone)zone.hidden=!ouvert;
        if(bouton)bouton.setAttribute('aria-expanded',ouvert?'true':'false');
      };

      /* Rangs (1 à 4) des sorts de Blood Magic que CE joueur a déjà découverts (mêmes conditions que la liste du menu) : le fil « En direct » ne nomme jamais un sort qu'il ne connaît pas. Le dernier sort n'est jamais nommé. */
      window.__SOREAL_IDLE_SORTS_CONNUS_V1__=function(j){
        const rangs={1:true};
        try{
          const s=systemeMetaParIdIdleV130_(j,'bloodMagic');
          const data=s&&s.state&&s.state.data||{};
          const sp=data.spells||{};
          const n=function(v){v=Number(v);return v>0?v:0;};
          const pic=Math.max(n(data.bloodPeak),n(j&&j.systemes&&j.systemes.currencies&&j.systemes.currencies.blood));
          if(pic>=100||n(sp.ironPill)>0)rangs[2]=true;
          if(pic>=1e4||n(sp.bloodSpaghettiBloodSpent)>0)rangs[3]=true;
          if(pic>=1e6||n(sp.counterfeitGoldBloodSpent)>0)rangs[4]=true;
        }catch(e){}
        return rangs;
      };
      function pageBloodMagicIdleV48_(j){
        const s=systemeMetaParIdIdleV130_(j,'bloodMagic');
        if(!s||!s.state||!s.state.unlocked)return '<div class="soreal-idle-bloodmagic-v1"><div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div></div>';
        const snap=j&&j.systemes||{};
        const defs=Array.isArray(snap.bloodRituals)?snap.bloodRituals:[];
        const data=s.state.data||{};
        const rituals=data.rituals||{};
        const flags=snap.adventure&&snap.adventure.unlockFlags||{};
        const blood=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snap.currencies&&snap.currencies.blood||0);
        const gold=window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snap.currencies&&snap.currencies.gold||0);
        const spells=data.spells||{};
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const nb=function(v,d){return H.formatGrandNombreIdleV70_(v,d);};
        const pctFr=function(v){return Number(v).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' %';};
        /*
         * Sorts (Norman, 2026-09-29 : « savoir à quoi sert chaque chose »). Descriptions, formules et recharge d'après la
         * page wiki « Blood Magic » (section The Spells, consultée le 2026-09-29). Anti-spoil (AGENTS.md règle n°2) : un sort
         * n'apparaît qu'une fois DÉCOUVERT -- son « Minimum Blood Required » a déjà été atteint (data.bloodPeak, mémorisé côté
         * serveur, car chaque sort dépense tout le Blood) ou il a déjà servi. Le minimum lui-même n'est jamais affiché.
         * Le Number Boost (minimum 1) est le sort de départ : toujours visible.
         */
        const bloodPeak=Math.max(blood,H.idleNombre_(data.bloodPeak));
        const depense=function(k){return Math.max(0,H.idleNombre_(spells[k]));};
        const pctSpaghetti=function(total){return total>=1e4?Math.log2(total/1e4)+1:0;};
        const pctCounterfeit=function(total){return total>=1e6?Math.pow(Math.log2(total/1e6)+1,2):0;};
        const maintenant=Date.now();
        const prete=H.idleNombre_(spells.ironPillReadyAt);
        const rechargeIron=prete>maintenant?prete-maintenant:0;
        const spellDefs=[
          {id:'numberBoost',nom:'Blood NUMBER Boost',visible:true,
            desc:'Chaque Blood ajoute 1 au multiplicateur du NUMBER (le « Blood magic bonus » du Rebirth). Valable pour le Rebirth en cours.',
            actuel:'Bonus actuel : +'+nb(Math.max(0,H.idleNombre_(spells.numberBoost||1)-1)),
            apercu:blood>0?'En le lançant maintenant : +'+nb(Math.max(0,H.idleNombre_(spells.numberBoost||1)-1)+Math.floor(blood)):''},
          {id:'ironPill',nom:'Iron Pill',visible:bloodPeak>=100||depense('ironPill')>0,
            desc:'Augmente pour toujours tes stats d’Adventure. Avec G = Blood^0,25 : Puissance +G, Endurance +G, PV +3 × G, Regen PV +0,03 × G. Recharge de 11,5 h.',
            actuel:'Total acquis : +'+nb(depense('ironPill'),2),
            apercu:'',recharge:rechargeIron},
          {id:'bloodSpaghetti',nom:'Blood Spaghetti',visible:bloodPeak>=1e4||depense('bloodSpaghettiBloodSpent')>0,
            desc:'Augmente la Drop Chance de (log₂(Blood ÷ 10 000) + 1) %, où Blood est le total sacrifié à ce sort durant ce Rebirth.',
            actuel:'Bonus actuel : +'+pctFr(Math.max(0,(H.idleNombre_(spells.bloodSpaghetti||1)-1)*100)),
            apercu:blood>0&&depense('bloodSpaghettiBloodSpent')+blood>=1e4?'En le lançant maintenant : +'+pctFr(pctSpaghetti(depense('bloodSpaghettiBloodSpent')+Math.floor(blood))):''},
          {id:'counterfeitGold',nom:'Counterfeit Gold',visible:bloodPeak>=1e6||depense('counterfeitGoldBloodSpent')>0,
            desc:'Augmente le GPS de la Time Machine de (log₂(Blood ÷ 1 000 000) + 1)² %, où Blood est le total sacrifié à ce sort durant ce Rebirth.',
            actuel:'Bonus actuel : +'+pctFr(Math.max(0,(H.idleNombre_(spells.counterfeitGold||1)-1)*100)),
            apercu:blood>0&&depense('counterfeitGoldBloodSpent')+blood>=1e6?'En le lançant maintenant : +'+pctFr(pctCounterfeit(depense('counterfeitGoldBloodSpent')+Math.floor(blood))):''}
        ].filter(function(sp){return sp.visible;});
        /* Dernier sort (THE END) : invisible sous 5e22 de sang, sauf si la pièce est déjà trouvée. */
        const pieces494=snap.adventure&&snap.adventure.theEnd&&Array.isArray(snap.adventure.theEnd.pieces)&&snap.adventure.theEnd.pieces.some(function(p){return p.id===494;});
        if(blood>=5e22||pieces494)spellDefs.push({id:'leeches',nom:'3%q6(;>_<,$H8e',desc:'',actuel:'',apercu:''});
        const allocMagicActuelle=Math.max(0,H.idleNombre_(s.state.allocation&&s.state.allocation.magic));
        const ressourceMagie=snap.resources&&snap.resources.magic;
        const magicLibre=Math.max(0,H.idleNombre_(ressourceMagie&&ressourceMagie.current));
        const bmView=snap.bloodMagicView||null;
        /*
         * Norman (2026-09-29) : « blood magic n'a pas de barre d'avancement comme dans NGU Idle. »
         * Même mécanisme que __augmentationsVisualV215 (soreal-idle-ui.js, patch ciblé à chaque tick)
         * mais pour un seul élément : seul le rituel ACTIF progresse réellement (bloodMagicViewV1).
         */
        if(bmView&&bmView.secondsPerCompletion!=null){
          /* Redessin sans nouvelle réponse (même vue) : on garde le repère qui tourne déjà (jamais de retour en arrière) ; sinon il part de l'instant où le serveur a produit ces chiffres. */
          const visuelBloodExistant=H.getIdleEtat().__bloodMagicVisualV1;
          if(!(visuelBloodExistant&&visuelBloodExistant.src===bmView&&visuelBloodExistant.ritual===bmView.activeRitual)){
            H.getIdleEtat().__bloodMagicVisualV1={ritual:bmView.activeRitual,secondsPerCompletion:bmView.secondsPerCompletion,etaSeconds:bmView.etaSeconds,at:ancreSnapshotIdleV1_(H.getIdleEtat()),src:bmView};
          }
        }else{
          H.getIdleEtat().__bloodMagicVisualV1=null;
        }
        const toolbar=legendeAllocationIdleV1_('Magic',false,true)+'<div class="soreal-idle-bt-toolbar-v120">'+
          '<div class="soreal-idle-bt-input-box-v120"><label for="sorealIdleBloodInputV1">🎚️ Input</label><input id="sorealIdleBloodInputV1" type="text" value="'+montantAugmentIdleV1+'" title="Un nombre, ou une fraction comme 1/8 (résolue en 1/8 de la Magic libre à la validation)" oninput="window.__saisirMontantAugmentIdleV1__(this.value)" onblur="window.__resoudreFractionInputIdleV1__(this);window.__saisirMontantAugmentIdleV1__(this.value)"></div>'+
          '<div class="soreal-idle-bt-info-v1">Magic libre : <b id="sorealIdleBloodLibreV1">'+H.formatGrandNombreIdleV70_(magicLibre)+'</b> 🔮 · Magic allouée au rituel actif : <b id="sorealIdleBloodAllocV1" class="soreal-idle-bt-allocation-v120">'+H.formatGrandNombreIdleV70_(allocMagicActuelle)+'</b> 🔮</div>'+
          '<div class="soreal-idle-bt-presets-v120"><span>Magic Cap</span><button type="button" onclick="window.__presetBloodMagicIdleV1__(\'cap\',1)">Max</button><button type="button" onclick="window.__presetBloodMagicIdleV1__(\'cap\',.5)">1/2</button><button type="button" onclick="window.__presetBloodMagicIdleV1__(\'cap\',.25)">1/4</button></div>'+
          '<div class="soreal-idle-bt-presets-v120"><span>💤 Idle</span><button type="button" onclick="window.__presetBloodMagicIdleV1__(\'idle\',.5)">1/2</button><button type="button" onclick="window.__presetBloodMagicIdleV1__(\'idle\',.25)">1/4</button><button type="button" class="clear" onclick="window.__viderBloodMagicIdleV1__()">Tout retirer</button></div>'+
        '</div>';
        const rituelsHtml=defs.map(function(def,idxRituel){
          /* Montée en puissance : du premier rituel (rang 0) au dernier (rang 5), répartis sur les rituels disponibles. */
          const rangRituel=Math.max(0,Math.min(5,Math.round(idxRituel*5/Math.max(1,defs.length-1))));
          const r=rituals[def.id]||{};
          /* Le serveur ne liste plus que les rituels débloqués (idleNguSnapshot) : plus de carte « 🔒 Verrouillé » (anti-spoil). */
          const unlocked=true;
          const active=data.activeRitual===def.id;
          const progressionActive=active&&bmView&&bmView.activeRitual===def.id&&bmView.secondsPerCompletion!=null;
          const figee=window.__bloodFigeV1;
          const fractionVue=active&&bmView&&bmView.activeRitual===def.id?H.idleNombre_(bmView.progressFraction):0;
          const pct=progressionActive?Math.max(0,Math.min(1,1-H.idleNombre_(bmView.etaSeconds)/bmView.secondsPerCompletion)):(fractionVue>0?fractionVue:(active&&figee&&figee.ritual===def.id?figee.pct:0));
          const etaTexte=active&&bmView&&bmView.activeRitual===def.id&&bmView.etaSeconds!=null
            ?'⏱ '+formatDureeAugmentIdleV1_(bmView.etaSeconds)+' avant le prochain rituel complété'
            :(active?'Alloue de la Magic (ci-dessus) pour faire progresser ce rituel.':'');
          const idHtml=H.idleHtml_(def.id);
          /*
           * Barre de progression du rituel actif vers sa prochaine complétion (Norman, 2026-09-29 :
           * « blood magic n'a pas de barre d'avancement comme dans NGU Idle »). Même famille que la
           * barre d'Augmentation (.soreal-idle-bt-track-v120/.soreal-idle-bt-fill-v120), animée en
           * continu par animerBarreCycliqueIdleV217_ (soreal-idle-ui.js) -- seule couleur distincte
           * (rouge sang) pour rester dans le thème de la page.
           */
          const barre=active
            ?'<div class="soreal-idle-bt-track-v120"><div data-idle-blood-bar-v1="'+idHtml+'" class="soreal-idle-bt-fill-v120" style="width:100%;transform:scaleX('+pct+');transform-origin:left center;will-change:transform;background:#9a2138;transition:none"></div></div>'
            :'';
          return '<div id="sorealIdleBloodRitualV1_'+idHtml+'" class="soreal-idle-section-v8" data-rang-v1="'+rangRituel+'" style="margin:0;opacity:'+(unlocked?'1':'.55')+'">'+
            '<div style="display:flex;justify-content:space-between;gap:8px"><b>'+(IDLE_ICONES_RITUELS_V1[def.id]?IDLE_ICONES_RITUELS_V1[def.id]+' ':'')+H.idleHtml_(IDLE_BLOOD_NOMS_RITUELS_V1[def.id]||def.name||def.id)+'<span id="sorealIdleBloodMarkerV1_'+idHtml+'">'+(active?' ▶':'')+'</span></b><span>'+H.idleEntier_(r.completions||0)+' complété(s)</span></div>'+
            '<div class="soreal-idle-blood-ritual-desc-v1">Chaque fois qu’il se termine : <b>−'+H.formatGrandNombreIdleV70_(def.gold||0)+' Gold</b> → <b>+'+H.formatGrandNombreIdleV70_(def.blood||0)+' Blood</b></div>'+
            barre+
            /* Compteur de Magic allouée à CE rituel (Norman, 2026-10-05) : le rituel actif porte toute l'allocation, les autres 0 ; le chiffre gonfle quand on y ajoute de la Magic (modules/alloc-pop-v1.js, crochet data-idle-alloc-pop-v1). */
            '<div class="soreal-idle-blood-alloc-ligne-v1">🔮 Magic allouée : <b id="sorealIdleBloodRitualAllocV1_'+idHtml+'" data-idle-alloc-pop-v1="1">'+H.formatGrandNombreIdleV70_(active?allocMagicActuelle:0)+'</b></div>'+
            '<div id="sorealIdleBloodEtaLineV1_'+idHtml+'" style="font-size:14px;color:#c7d2fe;margin:3px 0;'+(etaTexte?'':'display:none')+'">'+H.idleHtml_(etaTexte)+'</div>'+
            '<div class="soreal-idle-bt-actions-v120" style="margin-top:9px"><button type="button" title="Placer la valeur de Input en Magic sur ce rituel (l’active s’il ne l’est pas)" onclick="window.__ajusterRituelBloodMagicIdleV1__(\''+idHtml+'\',\'plus\')" aria-label="Placer"><span class="soreal-idle-blood-croix-v1">✝︎</span></button><button type="button" title="Retirer la valeur de Input" onclick="window.__ajusterRituelBloodMagicIdleV1__(\''+idHtml+'\',\'moins\')">−</button><button type="button" title="Placer toute la Magic libre sur ce rituel" onclick="window.__ajusterRituelBloodMagicIdleV1__(\''+idHtml+'\',\'cap\')">Max</button></div>'+
          '</div>';
        }).join('');
        /*
         * Norman (2026-10-01) : « les sorts en haut, pas sur une ligne complète : des blocs côte à côte, sur 2 lignes quand il y en a trop, avec un
         * « i » cliquable pour les effets ; chaque bloc dans les tons mauve-rouge ». Un bloc par sort DÉCOUVERT (anti-spoil inchangé : spellDefs
         * ne contient que les sorts découverts). L'état ouvert/fermé des « i » est gardé en mémoire (les rendus ne le referment pas).
         */
        /* Rituel sonore du sort (modules/audio-effects-v199.js : sortBlood), du plus modeste au plus terrifiant. Jamais bloquant. */
        window.__sonSortBloodIdleV1__=function(id){try{const a=window.__SOREAL_IDLE_AUDIO_V199__;if(a&&a.sortBlood)a.sortBlood(String(id||''));}catch(e){}};
        const sortsHtml='<h3 class="soreal-idle-blood-titre-v1">Sorts <small>dépensent tout ton Blood</small></h3><div class="soreal-idle-blood-sorts-v1">'+spellDefs.map(function(sp){
          const recharge=sp.recharge>0;
          const peutLancer=blood>0&&!recharge;
          const idSort=H.idleHtml_(sp.id);
          const infos=(sp.desc?'<div class="soreal-idle-blood-sort-desc-v1">'+H.idleHtml_(sp.desc)+'</div>':'')+(sp.apercu?'<div class="soreal-idle-blood-sort-apercu-v1">'+H.idleHtml_(sp.apercu)+'</div>':'');
          const ouvert=Boolean(window.__idleBloodInfosOuvertesV1&&window.__idleBloodInfosOuvertesV1[sp.id]);
          return '<div class="soreal-idle-blood-sort-v1" data-sort="'+idSort+'">'+
            '<div class="soreal-idle-blood-sort-tete-v1"><b>'+(IDLE_ICONES_SORTS_V1[sp.id]?IDLE_ICONES_SORTS_V1[sp.id]+' ':'')+H.idleHtml_(sp.nom)+'</b>'+(infos?'<button type="button" class="soreal-idle-blood-info-v1" title="Voir les effets" aria-expanded="'+(ouvert?'true':'false')+'" onclick="window.__basculerInfoSortBloodIdleV1__(\''+idSort+'\',this)">i</button>':'')+'</div>'+
            (sp.actuel?'<div class="soreal-idle-blood-sort-actuel-v1">'+H.idleHtml_(sp.actuel)+'</div>':'')+
            (infos?'<div id="sorealIdleBloodSortInfosV1_'+idSort+'" class="soreal-idle-blood-sort-infos-v1"'+(ouvert?'':' hidden')+'>'+infos+'</div>':'')+
            (recharge?'<div class="soreal-idle-blood-sort-apercu-v1">⏳ Prêt dans '+formatDureeAugmentIdleV1_(sp.recharge/1000)+'</div>':'')+
            '<button type="button" class="soreal-idle-expand-button-v25 soreal-idle-blood-lancer-v1" '+(peutLancer?'onclick="window.__sonSortBloodIdleV1__(\''+sp.id+'\');window.__actionMetaV47__({action:\'castBloodSpell\',spell:\''+sp.id+'\'})"':'disabled')+'>'+(blood>0?(recharge?'En recharge':'Lancer avec tout mon Blood ('+H.formatGrandNombreIdleV70_(blood)+')'):'Pas assez de Blood')+'</button></div>';
        }).join('')+'</div>';

        /*
         * Norman (2026-09-29) : « Décore la page blood magic pour qu'elle ait l'air plus sanglante
         * sans pour autant qu'elle soit toute rouge. » soreal-idle-bloodmagic-v1 (soreal-idle-ui.css)
         * porte tout l'habillage (fond sombre lie-de-vin très désaturé, gouttes discrètes en haut de
         * carte, liseré) -- jamais un simple aplat rouge, et rien de tout ça n'existe ailleurs.
         */
        return '<div class="soreal-idle-bloodmagic-v1">'+
          H.entetePageIdleV28_('🩸 Blood Magic','Transforme de la Magic et de l’Or en Blood, puis dépense ce Blood dans des sorts.')+
          carteAideMenuIdleV1_('bloodMagic','Le Blood sert à lancer des sorts. Le plus courant, Blood NUMBER Boost, ajoute 1 au multiplicateur du NUMBER (le « Blood magic bonus » du Rebirth) par Blood dépensé : c’est ce qui te donne un plus gros nombre au Rebirth.',[
            'Choisis un rituel et place-y de la Magic avec + : plus il en reçoit, plus vite il se termine.',
            'Chaque fois qu’un rituel se termine, il dépense de l’Or et produit du Blood.',
            'Le Blood s’accumule dans ta réserve. Lancer un sort utilise tout ton Blood d’un coup.',
            'Le Blood est remis à zéro à chaque Rebirth. Les effets des sorts ne durent que jusqu’au prochain Rebirth, sauf ceux marqués « permanent ».'
          ])+
          '<div class="soreal-idle-summary-grid-v28"><div class="soreal-idle-summary-v28">🩸 Blood<b>'+H.formatGrandNombreIdleV70_(blood)+'</b></div><div class="soreal-idle-summary-v28">🪙 Gold<b>'+H.formatGrandNombreIdleV70_(gold)+'</b></div></div>'+
          sortsHtml+
          toolbar+
          '<h3 class="soreal-idle-blood-titre-v1">Rituels <small>produisent du Blood</small></h3><div style="display:grid;gap:10px">'+rituelsHtml+'</div>'+
        '</div>';
      }

      function libelleRecompenseMetaV206_(entree){
        if(!entree)return '—';
        const morceaux=[];
        const reward=entree.reward&&typeof entree.reward==='object'?entree.reward:{};
        if(entree.boost){
          const typeBoost=String(entree.boost.type||'');
          const nomBoost=typeBoost==='power'?'Puissance':(typeBoost==='toughness'?'Endurance':(typeBoost==='special'?'Spécial':typeBoost));
          morceaux.push(
            'Boost '+nomBoost+
            ' +'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(entree.boost.strength||0)
          );
        }
        if(reward.adventureStats){
          morceaux.push(
            '+'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(reward.adventureStats)+
            ' Puissance/Endurance Aventure'
          );
        }
        if(reward.adventureHp){
          morceaux.push('+'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(reward.adventureHp)+' PV max Aventure');
        }
        if(reward.adventureRegen){
          morceaux.push('+'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(reward.adventureRegen,2)+' Regen PV Aventure');
        }
        if(reward.ap)morceaux.push(window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(reward.ap)+' AP');
        if(reward.experience)morceaux.push(window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(reward.experience)+' EXP');
        if(reward.seeds)morceaux.push(window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(reward.seeds)+' graines');
        if(reward.cubePower)morceaux.push('+'+reward.cubePower+' Cube Puissance');
        if(reward.cubeToughness)morceaux.push('+'+reward.cubeToughness+' Cube Endurance');
        if(reward.cubeBoth)morceaux.push('+'+reward.cubeBoth+' Cube Puissance et Endurance');
        if(reward.wandoosLevels)morceaux.push('+'+reward.wandoosLevels+' niveau(x) Wandoos');
        if(reward.items){
          const NOMS={energyPotionAlpha:'Potion Energy α',energyPotionBeta:'Potion Energy β',energyPotionDelta:'Potion Energy δ',magicPotionAlpha:'Potion Magic α',magicPotionBeta:'Potion Magic β',magicPotionDelta:'Potion Magic δ',luckyCharm:'Lucky Charm',superLuckyCharm:'Super Lucky Charm',energyBarBar:'Energy Bar Bar',magicBarBar:'Magic Bar Bar',littleBluePill1000:'× 1000 Little Blue Pill',poop:'crottin (sans effet)',beastButter:'Beast Butter (sans effet)',macguffinMuffin:'MacGuffin Muffin (sans effet)'};
          Object.keys(reward.items).forEach(function(id){morceaux.push(reward.items[id]+' × '+(NOMS[id]||id));});
        }
        return morceaux.length?morceaux.join(' · '):'Récompense mystérieuse';
      }


      function tierDailySpinIdleV206_(totalSpins){
        const n=Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(totalSpins));
        const seuils=[0,7,14,30,60,120,180,365];
        let tier=0;
        seuils.forEach(function(seuil,index){
          if(n>=seuil)tier=index;
        });
        return tier;
      }


      function recompensesDailySpinTierIdleV206_(tier){
        const tables=[
          ['50 AP · 70 %','100 AP · 30 %'],
          ['100 AP · 53 %','200 AP · 35 %','1 000 AP · 10 %'],
          ['200 AP · 53 %','400 AP · 30 %','2 000 AP · 10 %'],
          ['300 AP · 37 %','600 AP · 25 %','3 000 AP · 10 %','20 graines · 10 %','50 000 AP · 0,5 %'],
          ['500 AP · 50 %','1 000 AP · 25 %','5 000 AP · 10 %','100 graines · 5 %','75 000 AP · 0,5 %'],
          ['800 AP · 36 %','1 600 AP · 25 %','8 000 AP · 10 %','400 graines · 10 %','100 000 AP · 0,5 %'],
          ['1 200 AP · 35 %','2 400 AP · 25 %','12 000 AP · 10 %','2 000 graines · 10 %','150 000 AP · 0,5 %'],
          ['1 500 AP · 35 %','3 000 AP · 25 %','15 000 AP · 10 %','5 000 graines · 10 %','175 000 AP · 0,5 %']
        ];
        return tables[Math.max(0,Math.min(tables.length-1,window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(tier)))]||tables[0];
      }


      /*
       * Phrases du Puits (Norman, 2026-09-26 : « les petites phrases humoristiques, traduites en français »). Le wiki NGU ne publie que trois messages du
       * Puits : le boost (« The Pit belches and spits out a Toughness Boost 1! », donné par Norman), « The Pit belches and it smells awful » (Wandoos déjà au
       * maximum) et la graine avant Yggdrasil (« A giant green seed shoots out of the pit and lands by your feet! Before you can grab it, it hops back into
       * the pit! WTF was that?? ») : ceux-là sont traduits fidèlement. Les autres phrases sont écrites par SOREAL dans le même ton (une par récompense).
       * Le choix entre deux variantes est fixé par l'heure du jet (la même phrase à chaque affichage).
       */
      function phraseMoneyPitIdleV1_(entree,j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const nb=function(v,d){return H.formatGrandNombreIdleV70_(v,d);};
        const reward=entree&&entree.reward&&typeof entree.reward==='object'?entree.reward:{};
        const variante=Math.abs(Math.floor(Number(entree&&entree.at)||0))%2;
        const choisir=function(a,b){return variante?b:a;};
        if(entree&&entree.boost){
          const type=String(entree.boost.type||'');
          const nom=type==='power'?'Puissance':(type==='toughness'?'Endurance':(type==='special'?'Spécial':type));
          return 'Le Puits rote et recrache un Boost '+nom+' '+nb(entree.boost.strength||0)+' !';
        }
        if(reward.seeds){
          const ygg=systemeMetaParIdIdleV130_(j,'yggdrasil');
          const debloque=Boolean(ygg&&(ygg.unlocked||(ygg.state&&ygg.state.unlocked)));
          return debloque
            ?choisir('Une graine jaillit du Puits et vous atterrit sur le pied : +'+nb(reward.seeds)+' graines !','Le Puits vous crache une poignée de graines à la figure : +'+nb(reward.seeds)+' graines !')
            :'Une énorme graine verte jaillit du Puits et atterrit à vos pieds ! Avant que vous puissiez l’attraper, elle rebondit dans le Puits ! C’était QUOI, ça ?!';
        }
        if(Object.prototype.hasOwnProperty.call(reward,'wandoosLevels')&&!reward.wandoosLevels)return 'Le Puits rote… et ça sent affreusement mauvais.';
        if(reward.wandoosLevels)return choisir('Le Puits rote et ça sent le vieil ordinateur : +'+reward.wandoosLevels+' niveau(x) Wandoos !','Le Puits ronronne comme un vieux disque dur : +'+reward.wandoosLevels+' niveau(x) Wandoos !');
        if(reward.adventureStats)return choisir('Le Puits rote un grand coup et vous voilà plus costaud : +'+nb(reward.adventureStats)+' Puissance et Endurance !','Le Puits vous crache de la force brute sur les bottes : +'+nb(reward.adventureStats)+' Puissance et Endurance !');
        if(reward.adventureHp)return choisir('Le Puits gargouille et vous gonfle les muscles : +'+nb(reward.adventureHp)+' PV max !','Le Puits hoquette et vous voilà bien plus solide : +'+nb(reward.adventureHp)+' PV max !');
        if(reward.adventureRegen)return choisir('Le Puits soupire un air tiède qui referme vos petits bobos : +'+nb(reward.adventureRegen,2)+' de régénération !','Le Puits tousse un nuage réparateur : +'+nb(reward.adventureRegen,2)+' de régénération !');
        if(reward.cubePower||reward.cubeToughness||reward.cubeBoth)return choisir('Le Puits crache un truc brillant qui se met à vibrer dans votre sac !','Le Puits rote et quelque chose de mystérieux se met à briller de bonheur !');
        if(reward.experience)return choisir('Le Puits tousse un petit nuage d’expérience : +'+nb(reward.experience)+' EXP !','Le Puits recrache un sac brillant : +'+nb(reward.experience)+' EXP !');
        return 'Le Puits rote… et ne recrache rien de reconnaissable.';
      }

      function historiqueMoneyPitIdleV206_(pit,roue){
        const pitData=pit&&pit.state&&pit.state.data||{};
        const roueData=roue&&roue.state&&roue.state.data||{};
        const lignes=[];

        (Array.isArray(pitData.history)?pitData.history:[]).forEach(function(x){
          lignes.push({
            at:window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(x.at),
            source:'🕳️ Money Pit',
            entree:x,
            detail:'Palier '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(x.tier)+' · '+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(x.cost||0)+' Or',
            prize:libelleRecompenseMetaV206_(x)
          });
        });
        (Array.isArray(roueData.history)?roueData.history:[]).forEach(function(x){
          lignes.push({
            at:window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(x.at),
            source:'🎡 Roue journalière',
            detail:'Tier '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(x.tier),
            prize:libelleRecompenseMetaV206_(x)
          });
        });

        lignes.sort(function(a,b){return b.at-a.at;});
        return lignes.slice(0,20);
      }


      /*
       * Calendrier de connexion (Norman, 2026-10-03) : une case par jour du mois, grisées tant que la série ne les a pas atteintes, qui « s'allument » une à une ; la dernière case, bien plus
       * grosse, couronne le mois. Les sommes viennent du serveur (idle-login-calendar-v1.js : 150 000 AP par mois, croissantes). Voulu tel quel par Norman : les cases à venir sont visibles (grisées).
       */
      const IDLE_MOIS_FR_CALENDRIER_V1=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
      function rendreCalendrierConnexionIdleV1_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const cal=j&&j.systemes&&j.systemes.loginCalendar;
        if(!cal||!Array.isArray(cal.bareme)||!cal.bareme.length)return '';
        const jours=cal.bareme.length;
        const serie=Math.max(0,Math.min(jours,H.idleEntier_(cal.serie)));
        const nomMois=(IDLE_MOIS_FR_CALENDRIER_V1[H.idleEntier_(cal.moisNumero)-1]||'')+' '+H.idleEntier_(cal.annee);
        const cases=cal.bareme.map(function(ap,i){
          const dernier=i===jours-1;
          const allume=i<serie;
          const pret=!allume&&i===serie&&Boolean(cal.reclamable);
          const etat=allume?'allume':(pret?'pret':'eteint');
          const icone=dernier?'👑':(((i+1)%7===0)?'🎁':'💠');
          return '<div class="cal-case-v1 '+etat+(dernier?' dernier':'')+'" title="Jour '+(i+1)+' : '+H.idleHtml_(H.formatGrandNombreIdleV70_(ap))+' AP">'+
            '<span class="cal-jour-v1">'+(i+1)+'</span>'+
            '<span class="cal-icone-v1">'+icone+'</span>'+
            '<span class="cal-ap-v1">'+H.idleHtml_(H.formatGrandNombreIdleV70_(ap))+(dernier?' AP':'')+'</span>'+
            (allume?'<span class="cal-coche-v1">✓</span>':'')+
          '</div>';
        }).join('');
        let bouton;
        if(cal.reclamable){
          bouton='<button type="button" class="soreal-idle-expand-button-v25 cal-bouton-v1 glow-dispo-v1" onclick="window.__actionMetaIdleV130__({action:\'loginCalendar\'})">🎁 Récupérer la récompense du jour : +'+H.idleHtml_(H.formatGrandNombreIdleV70_(cal.prochainAp))+' AP</button>';
        }else if(serie>=jours){
          bouton='<button type="button" class="soreal-idle-expand-button-v25 cal-bouton-v1" disabled>👑 Plateau complet ! Un nouveau plateau commence le 1er du mois prochain.</button>';
        }else{
          bouton='<button type="button" class="soreal-idle-expand-button-v25 cal-bouton-v1" disabled>✅ Récompense du jour récupérée · reviens demain pour +'+H.idleHtml_(H.formatGrandNombreIdleV70_(cal.prochainAp))+' AP</button>';
        }
        return '<style>'+
            '.cal-v1{max-width:760px;margin:0 auto 14px;padding:12px;border-radius:16px;border:2px solid rgba(255,214,102,.55);background:linear-gradient(165deg,rgba(40,28,8,.92),rgba(14,10,4,.95));box-shadow:0 10px 28px rgba(0,0,0,.35),inset 0 0 40px rgba(255,190,60,.08)}'+
            '.cal-titre-v1{font-size:17px;font-weight:950;color:#ffe9a8;text-shadow:0 2px 4px #000;text-align:center}'+
            '.cal-sous-v1{font-size:12px;color:#e8d9b0;text-align:center;margin:3px 0 8px}'+
            '.cal-stats-v1{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;font-size:13px;color:#ffe9a8;margin-bottom:8px}'+
            '.cal-stats-v1 b{color:#fff}'+
            '.cal-grille-v1{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}'+
            '.cal-case-v1{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;aspect-ratio:1/1.12;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#1b1a22;color:#9aa0b4;overflow:hidden;transition:transform .2s}'+
            '.cal-jour-v1{position:absolute;top:3px;left:5px;font-size:10px;font-weight:800;opacity:.85}'+
            '.cal-icone-v1{font-size:19px;line-height:1.1;margin-top:9px}'+
            '.cal-ap-v1{font-size:10px;font-weight:900;letter-spacing:.01em}'+
            '.cal-case-v1.eteint{filter:grayscale(1);opacity:.5}'+
            '.cal-case-v1.allume{border-color:#ffd54a;background:radial-gradient(circle at 50% 30%,#ffe58a 0,#f2a91b 55%,#a8650a 100%);color:#3a2300;box-shadow:0 0 14px rgba(255,200,60,.75),inset 0 0 10px rgba(255,255,255,.45);animation:calAllumeV1 .6s ease-out}'+
            '.cal-case-v1.allume .cal-icone-v1{filter:drop-shadow(0 0 5px rgba(255,255,255,.9))}'+
            '.cal-coche-v1{position:absolute;right:3px;top:3px;font-size:9px;font-weight:1000;color:#15632a;background:rgba(255,255,255,.9);border-radius:50%;width:13px;height:13px;line-height:13px;text-align:center}'+
            '.cal-case-v1.pret{border:2px solid #7dffa8;background:radial-gradient(circle at 50% 30%,#26543a 0,#123222 70%);color:#eafff1;box-shadow:0 0 16px rgba(110,255,160,.8);animation:calPretV1 1.1s ease-in-out infinite}'+
            '.cal-case-v1.dernier{grid-column:1/-1;flex-direction:row;gap:12px;aspect-ratio:auto;min-height:62px;padding:8px 14px}'+
            '.cal-case-v1.dernier .cal-jour-v1{top:5px;left:9px;font-size:12px}'+
            '.cal-case-v1.dernier .cal-icone-v1{font-size:34px;margin-top:0}.cal-case-v1.dernier.eteint{opacity:.75}'+
            '.cal-case-v1.dernier .cal-ap-v1{font-size:20px}'+
            '.cal-bouton-v1{width:100%;margin-top:10px!important;white-space:normal}'+
            '@keyframes calPretV1{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}'+
            '@keyframes calAllumeV1{0%{transform:scale(.7);filter:brightness(2)}100%{transform:scale(1);filter:none}}'+
            '@media(prefers-reduced-motion:reduce){.cal-case-v1.pret,.cal-case-v1.allume{animation:none}}'+
          '</style>'+
          '<div class="cal-v1">'+
            '<div class="cal-titre-v1">📅 Récompenses de connexion · '+H.idleHtml_(nomMois)+'</div>'+
            '<div class="cal-sous-v1">Reviens chaque jour : plus ta série est longue, plus l’AP est gros. Un jour raté et tu repars de la case 1 !</div>'+
            '<div class="cal-stats-v1"><span>🔥 Série : <b>'+serie+' jour'+(serie>1?'s':'')+'</b></span><span>💠 Total du mois : <b>'+H.idleHtml_(H.formatGrandNombreIdleV70_(H.idleNombre_(cal.totalMois)))+' AP</b></span></div>'+
            '<div class="cal-stats-v1"><span>🏆 Total d’AP obtenus depuis le début des récompenses : <b>'+H.idleHtml_(H.formatGrandNombreIdleV70_(H.idleNombre_(cal.totalAp)))+' AP</b></span></div>'+
            '<div class="cal-grille-v1">'+cases+'</div>'+
            bouton+
          '</div>';
      }

      /*
       * Historiques du Money Pit et de la roue (Norman, 2026-10-03) : DEUX cadres séparés (Money Pit seulement, roue seulement), repliables, 20 lignes par page, une page de plus pour les lignes
       * plus anciennes. L'état ouvert/fermé de chaque cadre et la page affichée sont retenus (la page se redessine souvent).
       */
      const IDLE_MP_PAR_PAGE_V1=20;
      const idleMpPagesV1={pit:0,roue:0};

      function lignesMoneyPitIdleV1_(pit){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const data=pit&&pit.state&&pit.state.data||{};
        return (Array.isArray(data.history)?data.history:[]).map(function(x){
          return {at:H.idleNombre_(x.at),entree:x,detail:'Palier '+H.idleEntier_(x.tier)+' · '+H.formatGrandNombreIdleV70_(x.cost||0)+' Or',prize:libelleRecompenseMetaV206_(x)};
        }).sort(function(a,b){return b.at-a.at;});
      }

      function lignesRoueIdleV1_(roue){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const data=roue&&roue.state&&roue.state.data||{};
        return (Array.isArray(data.history)?data.history:[]).map(function(x){
          return {at:H.idleNombre_(x.at),detail:'Tier '+H.idleEntier_(x.tier),prize:libelleRecompenseMetaV206_(x)};
        }).sort(function(a,b){return b.at-a.at;});
      }

      function dateCourteMoneyPitIdleV1_(ms){
        if(!(ms>0))return '';
        try{return new Date(ms).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}catch(_e){return '';}
      }

      function cleOuvertureCadreMoneyPitIdleV1_(cle){return 'soreal_idle_mp_cadre_'+cle;}
      function cadreMoneyPitOuvertIdleV1_(cle){
        try{return localStorage.getItem(cleOuvertureCadreMoneyPitIdleV1_(cle))!=='0';}catch(_e){return true;}
      }
      window.__basculerCadreMoneyPitIdleV1__=function(cle,details){
        try{localStorage.setItem(cleOuvertureCadreMoneyPitIdleV1_(cle),details&&details.open?'1':'0');}catch(_e){}
      };

      /* Change de page dans un cadre sans redessiner la page : montre le corps de tableau voulu, cache les autres, met à jour le compteur et les boutons. */
      window.__pageCadreMoneyPitIdleV1__=function(cle,sens){
        const racine=document.querySelector('[data-mp-cadre="'+cle+'"]');
        if(!racine)return;
        const corps=racine.querySelectorAll('[data-mp-page]');
        const total=corps.length;
        const cible=Math.max(0,Math.min(total-1,(idleMpPagesV1[cle]||0)+sens));
        idleMpPagesV1[cle]=cible;
        Array.prototype.forEach.call(corps,function(c){c.hidden=Number(c.getAttribute('data-mp-page'))!==cible;});
        const compteur=racine.querySelector('[data-mp-compteur]');
        if(compteur)compteur.textContent='Page '+(cible+1)+' / '+total;
        const recent=racine.querySelector('[data-mp-recent]');
        const ancien=racine.querySelector('[data-mp-ancien]');
        if(recent)recent.disabled=cible<=0;
        if(ancien)ancien.disabled=cible>=total-1;
      };

      function cadreRecompensesMoneyPitIdleV1_(cle,titre,lignes,colonneDetail,vide){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const pages=Math.max(1,Math.ceil(lignes.length/IDLE_MP_PAR_PAGE_V1));
        const courante=Math.max(0,Math.min(pages-1,idleMpPagesV1[cle]||0));
        idleMpPagesV1[cle]=courante;
        let tables='';
        for(let p=0;p<pages;p+=1){
          tables+='<tbody data-mp-page="'+p+'"'+(p===courante?'':' hidden')+'>'+
            lignes.slice(p*IDLE_MP_PAR_PAGE_V1,(p+1)*IDLE_MP_PAR_PAGE_V1).map(function(x){
              return '<tr><td>'+H.idleHtml_(dateCourteMoneyPitIdleV1_(x.at))+'</td><td>'+H.idleHtml_(x.detail)+'</td><td><b>'+H.idleHtml_(x.prize)+'</b></td></tr>';
            }).join('')+
          '</tbody>';
        }
        return '<details class="mp-cadre-v1" data-mp-cadre="'+cle+'"'+(cadreMoneyPitOuvertIdleV1_(cle)?' open':'')+' ontoggle="window.__basculerCadreMoneyPitIdleV1__(\''+cle+'\',this)">'+
          '<summary>'+H.idleHtml_(titre)+' <span class="mp-compte-v1">('+lignes.length+')</span></summary>'+
          '<div class="mp-corps-v1">'+
            (lignes.length
              ?'<table class="soreal-idle-reward-table-v206"><thead><tr><th>Quand</th><th>'+H.idleHtml_(colonneDetail)+'</th><th>Prix</th></tr></thead>'+tables+'</table>'+
                (pages>1
                  ?'<div class="mp-pager-v1">'+
                      '<button type="button" data-mp-recent onclick="window.__pageCadreMoneyPitIdleV1__(\''+cle+'\',-1)"'+(courante<=0?' disabled':'')+'>◀ Plus récentes</button>'+
                      '<span data-mp-compteur>Page '+(courante+1)+' / '+pages+'</span>'+
                      '<button type="button" data-mp-ancien onclick="window.__pageCadreMoneyPitIdleV1__(\''+cle+'\',1)"'+(courante>=pages-1?' disabled':'')+'>Plus anciennes ▶</button>'+
                    '</div>'
                  :'')
              :'<div class="soreal-idle-note-v4">'+H.idleHtml_(vide)+'</div>')+
          '</div>'+
        '</details>';
      }

      function pageMoneyPitDailySpinIdleV206_(j){
        const pit=systemeMetaParIdIdleV130_(j,'moneyPit');
        const roue=systemeMetaParIdIdleV130_(j,'dailySpin');
        const pitSt=pit&&pit.state||{};
        const roueSt=roue&&roue.state||{};
        const pitData=pitSt.data||{};
        const roueData=roueSt.data||{};
        const totalSpins=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(roueData.totalSpins||roueSt.level||0);
        const tier=tierDailySpinIdleV206_(totalSpins);
        const table=recompensesDailySpinTierIdleV206_(tier);
        const listePit=lignesMoneyPitIdleV1_(pit);
        const listeRoue=lignesRoueIdleV1_(roue);
        const historique=historiqueMoneyPitIdleV206_(pit,roue);
        const derniere=historique.length?historique[0]:null;

        return ''+
          window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_(
            '🕳️ Money Pit & 🎡 Roue journalière',
            'Balance tout ton Or durement gagné dedans.'
          )+
          bandeauMoneyPitIdleV1_(pitData)+
          '<style>'+
            '.soreal-idle-money-scene-v206{position:relative;max-width:760px;margin:0 auto 14px;overflow:hidden;border-radius:18px;border:2px solid #26344d;background:#102e16;box-shadow:0 15px 40px rgba(0,0,0,.3)}'+
            /* Norman (2026-10-02) : l'image du trou était coupée à gauche et à droite (carré forcé + cover) : elle s'affiche maintenant en entier, à ses proportions. */
            '.soreal-idle-money-scene-v206>img{display:block;width:100%;height:auto;object-fit:contain}'+
            '.soreal-idle-money-actions-v206{display:flex;gap:8px;max-width:760px;margin:0 auto 14px}'+
            '.soreal-idle-money-action-v206{flex:1 1 0;min-width:0;box-sizing:border-box;background:rgba(12,18,31,.92);border:2px solid rgba(255,255,255,.5);border-radius:12px;padding:8px;box-shadow:0 8px 22px rgba(0,0,0,.28);text-align:center}'+
            '.soreal-idle-money-action-v206 .soreal-idle-expand-button-v25{width:100%;margin:4px 0 0!important}'+
            '.soreal-idle-money-action-title-v206{font-size:15px;font-weight:950;color:#fff;text-shadow:0 1px 3px #000}'+
            '.soreal-idle-money-action-note-v206{font-size:12px;color:#d5e1f5;margin-top:2px}'+
            /* Norman (2026-10-03) : « Ton prix » était plus large que les autres cadres sur PC : même largeur maximale que la scène, les boutons et les cadres de récompenses. */
            '.soreal-idle-money-scene-v206~.soreal-idle-offre-v1{max-width:760px;margin:0 auto 14px;box-sizing:border-box}'+
            '.soreal-idle-prize-v206{padding:12px;border-radius:12px;background:#f4c83b;color:#19160b;border:2px solid #9c7b12;text-align:center;font-weight:950;font-size:14px}'+
            '.soreal-idle-reward-table-v206{width:100%;border-collapse:collapse;font-size:13px}.soreal-idle-reward-table-v206 th,.soreal-idle-reward-table-v206 td{padding:7px;border:1px solid rgba(132,145,175,.28);text-align:left}.soreal-idle-reward-table-v206 th{background:rgba(97,112,147,.14)}'+
            '@media(max-width:620px){.soreal-idle-money-action-title-v206{font-size:14px}.soreal-idle-money-action-note-v206{font-size:11px}}'+
            '.mp-cadre-v1{max-width:760px;margin:0 auto 12px;border-radius:14px;border:2px solid rgba(255,255,255,.28);background:rgba(12,18,31,.92);overflow:hidden}'+
            '.mp-cadre-v1>summary{cursor:pointer;padding:11px 14px;font-weight:950;font-size:15px;color:#fff;text-shadow:0 1px 3px #000;list-style:none;display:flex;gap:8px;align-items:center}'+
            '.mp-cadre-v1>summary::-webkit-details-marker{display:none}'+
            '.mp-cadre-v1>summary::after{content:"▾";margin-left:auto;transition:transform .2s}'+
            '.mp-cadre-v1:not([open])>summary::after{transform:rotate(-90deg)}'+
            '.mp-compte-v1{font-weight:700;opacity:.75;font-size:13px}'+
            '.mp-corps-v1{padding:0 12px 12px}'+
            '.mp-cadre-v1 .soreal-idle-reward-table-v206 th,.mp-cadre-v1 .soreal-idle-reward-table-v206 td{color:#eef3ff}'+
            '.mp-pager-v1{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px;font-size:13px;color:#d5e1f5}'+
            '.mp-pager-v1 button{padding:6px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.4);background:#253957;color:#fff;font-weight:800}'+
            '.mp-pager-v1 button:disabled{opacity:.4}'+
          '</style>'+
          '<div class="soreal-idle-money-scene-v206">'+
            '<img id="sorealIdleMoneyPitImageV209" src="/api/idle/media/banner?name=Money_Pit.jpg" alt="Money Pit et Daily Spin">'+
          '</div>'+
          /* 2026-09-26 (Norman) : les deux boutons sous l'image, chacun sur la moitié de sa largeur. */
          '<div class="soreal-idle-money-actions-v206">'+
            '<div class="soreal-idle-money-action-v206 soreal-idle-money-pit-action-v206">'+
              '<div class="soreal-idle-money-action-title-v206">Balance ton argent</div>'+
              '<div class="soreal-idle-money-action-note-v206">Le puits prend tout ton Or actuel.</div>'+
              rendreBoutonMoneyPitIdleV1_(j,pitSt)+
            '</div>'+
            '<div class="soreal-idle-money-action-v206 soreal-idle-money-spin-action-v206">'+
              '<div class="soreal-idle-money-action-title-v206">Daily Spin!</div>'+
              '<div class="soreal-idle-money-action-note-v206">Bon, ça ne « tourne » pas vraiment, mais c’est aléatoire !</div>'+
              rendreBoutonDailySpinIdleV203_(roueSt)+
            '</div>'+
          '</div>'+
          '<div class="soreal-idle-offre-v1">'+
            '<div class="soreal-idle-offre-titre-v1">🎁 TON PRIX</div>'+
            '<div class="soreal-idle-prize-v206">'+
              (derniere
                ?(derniere.entree
                  ?window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(phraseMoneyPitIdleV1_(derniere.entree,j))+
                    '<span class="soreal-idle-prize-detail-v1">'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(derniere.prize)+'</span>'
                  :window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(derniere.prize))
                :'Aucun prix obtenu pour l’instant.')+
            '</div>'+
          '</div>'+
          /* Norman (2026-10-03) : « Ton prix » juste sous les boutons, puis le bonus des jours cumulés (avec son total d'AP), puis un cadre par liste de récompenses. */
          rendreCalendrierConnexionIdleV1_(j)+
          cadreRecompensesMoneyPitIdleV1_('pit','🕳️ RÉCOMPENSES DU MONEY PIT',listePit,'Palier','Le tableau se remplira dès ton premier lancer dans le puits.')+
          cadreRecompensesMoneyPitIdleV1_('roue','🎡 RÉCOMPENSES DE LA ROUE',listeRoue,'Tier','Le tableau se remplira dès ton premier tour de roue.')+
          '<div class="soreal-idle-section-v8">'+
            '<div class="soreal-idle-window-title-v31">🎡 TABLE DES RÉCOMPENSES · TIER '+tier+'</div>'+
            '<div style="font-size:13px;color:#8b93ab;margin-bottom:8px">Tours effectués : <b>'+totalSpins+'</b>.</div>'+
            '<table class="soreal-idle-reward-table-v206"><tbody>'+
              table.map(function(x){return '<tr><td>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(x)+'</td></tr>';}).join('')+
            '</tbody></table>'+
          '</div>';
      }


      /*
       * NGU (2026-09-23, audit) : les 16 vrais NGU (9 Energy + 7 Magic) avec
       * une allocation propre à chacun ; un seul palier (Normal / Evil /
       * Sadistic) reçoit de l'énergie et de la magie à la fois.
       */
      function dureeLongueNguIdleV1_(secondes){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const n=Number(secondes);
        if(!Number.isFinite(n)||n<=0)return '—';
        if(n<1)return '< 1 s';
        if(n<60)return Math.round(n)+' s';
        if(n<3600)return Math.round(n/60)+' min';
        if(n<86400)return (n/3600).toFixed(1).replace('.',',')+' h';
        if(n<86400*365)return (n/86400).toFixed(1).replace('.',',')+' j';
        return H.formatGrandNombreIdleV70_(n/86400/365,1)+' ans';
      }

      /* Plafond (cap) d'une ressource dans un snapshot : partagé par les pages NGU et Wishes (auparavant dupliqué sous le nom capDe). */
      function capRessourceMetaIdleV1_(snap,ressource){
        return Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(snap.resources&&snap.resources[ressource]&&snap.resources[ressource].cap||0));
      }

      function pageNguIdleV1_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const titre=H.entetePageIdleV28_('♾️ NGU','Chaque NGU a sa propre allocation et progresse en parallèle. Les niveaux persistent à travers les Rebirths ; l\'énergie et la magie allouées sont rendues au Rebirth.');
        const sys=systemeMetaParIdIdleV130_(j,'ngu');
        if(!sys||!sys.state||!sys.state.unlocked){
          return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        }
        const snap=(j&&j.systemes)||{};
        const ng=snap.ngus||{};
        const nomPalier={normal:'Normal',evil:'Evil',sadistic:'Sadistic'};
        const paliers=Array.isArray(ng.activeTiers)?ng.activeTiers:['normal'];
        const courant=ng.tier||'normal';
        const liste=(ng.tiers&&ng.tiers[courant])||[];
        const systemes=Array.isArray(snap.systems)?snap.systems:[];
        function capDe(ressource){return capRessourceMetaIdleV1_(snap,ressource);}
        function alloueAutres(ressource,exceptId){
          let total=0;
          systemes.forEach(function(x){
            if(!x||x.id==='ngu')return;
            total+=Math.max(0,H.idleNombre_(x.state&&x.state.allocation&&x.state.allocation[ressource]||0));
          });
          liste.forEach(function(n){
            if(n.resource===ressource&&n.id!==exceptId)total+=Math.max(0,H.idleNombre_(n.allocation));
          });
          return total;
        }
        const onglets=paliers.map(function(t){
          const actif=t===courant;
          return '<button type="button" class="soreal-idle-expand-button-v25" style="'+(actif?'font-weight:700;outline:2px solid #6366f1':'')+'" '+(actif?'disabled':'onclick="window.__actionMetaV47__({action:\'setNguTier\',tier:\''+t+'\'})"')+'>'+nomPalier[t]+'</button>';
        }).join('');
        const fx=ng.effects||{};
        const ratio=function(v){return 'x'+H.formatGrandNombreIdleV70_(Math.max(1,H.idleNombre_(v)),2);};
        const resume=[
          ['⚔️ Attack/Defense',ratio(fx.attackDefense)],
          ['🗺️ Adventure',ratio(fx.adventure)],
          ['🪙 Gold',ratio(fx.gold)],
          ['🎲 Drop',ratio(fx.dropChance)],
          ['✨ EXP',ratio(fx.exp)],
          ['🔢 Number',ratio(fx.number)],
          ['⭐ PP',ratio(fx.pp)],
          ['🌱 Yggdrasil',ratio(fx.yggdrasil)],
          ['⏱️ Time Machine',ratio(fx.timeMachine)],
          ['🦾 Augments',ratio(fx.augments)],
          ['💻 Wandoos',ratio(fx.wandoosSpeed)],
          ['⏳ Respawn','-'+(H.idleNombre_(fx.respawnReduction)*100).toFixed(1).replace('.',',')+' %']
        ].map(function(x){return '<div class="soreal-idle-summary-v28">'+x[0]+'<b>'+x[1]+'</b></div>';}).join('');
        function ligne(n){
          const cap=capDe(n.resource);
          const dispo=Math.max(0,cap-alloueAutres(n.resource,n.id));
          const verrou=n.resource==='magic'&&!ng.magicUnlocked;
          if(verrou)return '';/* ANTI-SPOIL : un NGU Magic non débloqué n'apparaît pas du tout. */
          const valeurs=[0,Math.floor(dispo*.25),Math.floor(dispo*.5),Math.floor(dispo)];
          const pct=Math.max(0,Math.min(100,H.idleNombre_(n.progress)*100));
          const symbole=n.resource==='magic'?'✨':'⚡';
          const boutons=valeurs.map(function(v,i){
            return '<button type="button" class="soreal-idle-expand-button-v25" '+(verrou?'disabled':'onclick="window.__actionMetaV47__({action:\'allocateNgu\',ngu:\''+H.idleHtml_(n.id)+'\',value:'+v+'})"')+'>'+['0%','25%','50%','100%'][i]+'</button>';
          }).join('');
          return '<div class="soreal-idle-section-v8" style="margin:0;opacity:'+(verrou?'.55':'1')+'">'+
            '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>'+H.idleHtml_(emojiNomIdleV1_('ngu',n.id,n.name))+' · Niv. '+H.formatGrandNombreIdleV70_(n.level)+'</b><span>'+H.formatGrandNombreIdleV70_(n.allocation)+' '+symbole+'</span></div>'+
            '<div style="font-size:14px;color:#aeb5c8">'+H.idleHtml_(n.effect)+' : <b>'+(n.id==='respawn'?'-':'+')+H.formatGrandNombreIdleV70_(n.effectPct,2)+' %</b>'+
            (n.secondsPerLevel!==null&&n.secondsPerLevel!==undefined?' · prochain niveau ≈ '+dureeLongueNguIdleV1_(n.secondsPerLevel):' · aucune allocation')+'</div>'+
            '<div class="soreal-idle-bt-track-v120"><div class="soreal-idle-bt-fill-v120" style="width:100%;transform:scaleX('+(pct/100)+');transform-origin:left center;background:#6366f1;transition:none"></div></div>'+
            '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px">'+boutons+'</div></div>';
        }
        const energie=liste.filter(function(n){return n.resource==='energy';}).map(ligne).join('');
        const magie=liste.filter(function(n){return n.resource==='magic';}).map(ligne).join('');
        return titre+
          '<div class="soreal-idle-section-v8" style="margin:0 0 10px"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><b>Palier</b>'+onglets+'</div>'+
          '<div style="font-size:14px;color:#aeb5c8;margin-top:6px">Un seul palier reçoit de l\'énergie et de la magie à la fois ; les effets des paliers débloqués se multiplient.</div></div>'+
          '<div class="soreal-idle-summary-grid-v28">'+resume+'</div>'+
          '<h3 style="margin:16px 0 8px">NGU Energy</h3><div style="display:grid;gap:10px">'+energie+'</div>'+
          '<h3 style="margin:16px 0 8px">NGU Magic</h3><div style="display:grid;gap:10px">'+magie+'</div>';
      }

      /*
       * Wishes (2026-09-23) : jusqu'à 4 slots, chacun avec son souhait et sa propre allocation
       * Energy/Magic/R3. Toutes les valeurs (slots débloqués, durées, plafonds) viennent du
       * snapshot serveur j.systemes.wishSlots ; les boutons 0/25/50/100 % visent la part libre
       * du cap (le serveur plafonne de toute façon à ce que le joueur possède).
       */
      function pageWishesIdleV1_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const titre=H.entetePageIdleV28_('🌠 Wishes','Chaque slot travaille sur son propre souhait avec sa propre allocation d\'Énergie, de Magie et de Ressource 3. Répartir ses ressources sur plusieurs souhaits est très efficace : doubler une ressource n\'accélère un souhait que d\'environ 12,5 %.');
        const sys=systemeMetaParIdIdleV130_(j,'wishes');
        const snap=(j&&j.systemes)||{};
        const ws=snap.wishSlots||null;
        if(!sys||!sys.state||!sys.state.unlocked||!ws){
          return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        }
        const pistes=Array.isArray(sys.tracks)?sys.tracks:[];
        /* Wiki : chaque souhait exige une difficulté (Evil ou Sadistic) ; à une difficulté plus basse la liste est vide. */
        if(!pistes.length)return titre+'<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Aucun souhait n’est disponible à cette difficulté pour l’instant.</div>';
        const systemes=Array.isArray(snap.systems)?snap.systems:[];
        const slots=Array.isArray(ws.slots)?ws.slots:[];
        const ressources=['energy','magic','r3'];
        function capDe(r){return capRessourceMetaIdleV1_(snap,r);}
        function alloueAilleurs(r,indexSlot){
          let total=0;
          systemes.forEach(function(x){
            if(!x||x.id==='wishes')return;
            total+=Math.max(0,H.idleNombre_(x.state&&x.state.allocation&&x.state.allocation[r]||0));
          });
          slots.forEach(function(sl){
            if(sl.index!==indexSlot)total+=Math.max(0,H.idleNombre_(sl.allocation&&sl.allocation[r]));
          });
          return total;
        }
        const occupes={};
        slots.forEach(function(sl){if(sl.unlocked&&sl.wish)occupes[sl.wish]=sl.index;});
        const src=ws.sources||{};
        const resume=
          '<div class="soreal-idle-summary-grid-v28">'+
            '<div class="soreal-idle-summary-v28">🎰 Slots débloqués<b>'+H.idleEntier_(ws.slotCount)+'</b></div>'+
            '<div class="soreal-idle-summary-v28">⏳ Temps minimum par niveau<b>'+dureeLongueNguIdleV1_(ws.minSecondsPerLevel)+'</b></div>'+
            '<div class="soreal-idle-summary-v28">💨 Vitesse des souhaits<b>x'+H.formatGrandNombreIdleV70_(Math.max(0,H.idleNombre_(ws.speedMultiplier)),2)+'</b></div>'+
          '</div>'+
          /* ANTI-SPOIL : seules les sources de slot déjà obtenues sont citées (jamais celles qui restent à débloquer). */
          '<div class="soreal-idle-note-v4" style="margin:8px 0 12px">Sources des slots obtenues : base'+(src.trollEvil?' · Troll Challenge Evil':'')+(src.pinkHeart?' · My Pink Heart':'')+(src.quirk?' · Quirk « A Wish Slot! »':'')+'</div>';
        function carte(sl){
          const numero=sl.index+1;
          if(!sl.unlocked)return '';/* ANTI-SPOIL : un slot encore verrouillé n'apparaît pas (ni cadenas, ni sources). */
          const options=['<option value=""'+(sl.wish?'':' selected')+'>— Aucun souhait —</option>'].concat(pistes.filter(function(p){
            const st=p.state||{};
            const fini=H.idleNombre_(st.level)>=H.idleNombre_(p.levels);
            const ailleurs=occupes[p.id]!==undefined&&occupes[p.id]!==sl.index;
            return p.id===sl.wish||(!fini&&!ailleurs);
          }).map(function(p){
            const st=p.state||{};
            return '<option value="'+H.idleHtml_(p.id)+'"'+(p.id===sl.wish?' selected':'')+'>#'+H.idleHtml_(p.id)+' · '+H.idleHtml_(p.name)+' ('+H.idleEntier_(st.level)+'/'+H.idleEntier_(p.levels)+')</option>';
          })).join('');
          const choix='<select style="width:100%;margin-top:6px" onchange="window.__actionMetaIdleV130__({action:\'setWishSlot\',slot:'+sl.index+',wish:this.value})">'+options+'</select>';
          const pct=Math.max(0,Math.min(100,H.idleNombre_(sl.progress)*100));
          const etat=!sl.wish
            ?'Aucun souhait dans ce slot.'
            :sl.done
              ?'✔ Souhait terminé : choisis-en un autre.'
              :(sl.secondsRemaining!==null&&sl.secondsRemaining!==undefined
                ?'Niveau suivant dans ≈ '+dureeLongueNguIdleV1_(sl.secondsRemaining)+' (niveau complet : '+dureeLongueNguIdleV1_(sl.secondsPerLevel)+')'
                :'Alloue de l\'Énergie, de la Magie ET de la Ressource 3 pour progresser.');
          const allocations=ressources.map(function(r){
            const verrou=(r==='magic'&&!ws.magicUnlocked)||(r==='r3'&&!ws.r3Unlocked);
            if(verrou)return '';/* ANTI-SPOIL : une ressource non débloquée n'apparaît pas. */
            const dispo=Math.max(0,capDe(r)-alloueAilleurs(r,sl.index));
            const valeurs=[0,Math.floor(dispo*.25),Math.floor(dispo*.5),Math.floor(dispo)];
            const boutons=valeurs.map(function(v,i){
              return '<button type="button" class="soreal-idle-expand-button-v25" '+(verrou?'disabled':'onclick="window.__actionMetaIdleV130__({action:\'allocateWishSlot\',slot:'+sl.index+',resource:\''+r+'\',value:'+v+'})"')+'>'+['0%','25%','50%','100%'][i]+'</button>';
            }).join('');
            return '<div style="margin-top:6px"><div style="display:flex;justify-content:space-between;gap:8px;font-size:14px"><span>'+libelleRessourceMetaIdleV130_(r)+'</span><b>'+H.formatGrandNombreIdleV70_(H.idleNombre_(sl.allocation&&sl.allocation[r]))+'</b></div>'+
              '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px">'+boutons+'</div></div>';
          }).join('');
          return '<div class="soreal-idle-section-v8" style="margin:0">'+
            '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>🌠 Slot '+numero+(sl.wish?' · '+H.idleHtml_(sl.name):'')+'</b>'+(sl.wish?'<span>Niv. '+H.idleEntier_(sl.level)+' / '+H.idleEntier_(sl.maxLevel)+'</span>':'')+'</div>'+
            (sl.wish?'<div style="font-size:14px;color:#aeb5c8;margin-top:4px">'+H.idleHtml_(sl.effect)+'</div>':'')+
            choix+
            '<div class="soreal-idle-bt-track-v120" style="margin-top:8px"><div class="soreal-idle-bt-fill-v120" style="width:100%;transform:scaleX('+(pct/100)+');transform-origin:left center;background:#c084fc;transition:none"></div></div>'+
            '<div style="font-size:14px;color:#aeb5c8;margin-top:4px">'+etat+'</div>'+
            allocations+
          '</div>';
        }
        const liste=pistes.map(function(p){
          const st=p.state||{};
          return '<div style="font-size:14px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.08)"><b>#'+H.idleHtml_(p.id)+' · '+H.idleHtml_(p.name)+'</b> · Niv. '+H.idleEntier_(st.level)+' / '+H.idleEntier_(p.levels)+(p.active?' · ▶️ en cours':'')+'<br><span style="color:#aeb5c8">'+H.idleHtml_(p.effect||'')+'</span></div>';
        }).join('');
        return titre+resume+
          '<div style="display:grid;gap:10px">'+slots.map(carte).join('')+'</div>'+
          '<details class="soreal-idle-section-v8" style="margin-top:12px"><summary><b>Tous les souhaits ('+pistes.length+')</b></summary>'+liste+'</details>';
      }

      /*
       * Item Daycare (garderie du Daycare Kitty) : placer / reprendre des objets de l'inventaire,
       * progression, ETA et détail des bonus. Toutes les valeurs viennent du snapshot serveur
       * (j.systemes.daycare, calculé par idle-daycare-v1.js), jamais recalculées ici.
       */
      function pageDaycareIdleV1_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const titre=H.entetePageIdleV28_('🛠️ Item Daycare','Le Daycare Kitty fait gagner des niveaux à tes objets avec le temps, même hors ligne. Un seul exemplaire de chaque objet ; niveau maximum 100. Un objet en garderie ne peut pas être fusionné ni équipé.');
        const s=systemeMetaParIdIdleV130_(j,'daycare');
        const d=(j&&j.systemes&&j.systemes.daycare)||null;
        if(!s||!s.state||!s.state.unlocked||!d){
          return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        }
        const pct=function(v){return H.formatGrandNombreIdleV70_(H.idleNombre_(v)*100,2)+' %';};
        const objets=Array.isArray(d.items)?d.items:[];
        const libres=Math.max(0,H.idleEntier_(d.slots)-objets.length);
        const resume=
          '<div class="soreal-idle-summary-grid-v28">'+
            '<div class="soreal-idle-summary-v28">🎰 Slots<b>'+objets.length+' / '+H.idleEntier_(d.slots)+'</b></div>'+
            '<div class="soreal-idle-summary-v28">⏳ Temps par niveau<b>×'+pct(d.timeFactor)+'</b></div>'+
            '<div class="soreal-idle-summary-v28">💨 Vitesse<b>×'+pct(d.speedMultiplier)+'</b></div>'+
          '</div>';
        const tp=d.timeParts||{},sp=d.speedParts||{},ss=d.slotSources||{};
        const detail=
          '<details class="soreal-idle-section-v8" style="margin:0 0 10px"><summary><b>Détail des bonus</b></summary>'+
            '<div style="font-size:14px;color:#aeb5c8;margin-top:6px">Réductions de temps (rétroactives) : Blind Normal ×'+pct(tp.blindNormal==null?1:tp.blindNormal)+' · Daycare Kitty\'s Blessing ×'+pct(tp.perks==null?1:tp.perks)+' · Daycare Speed Boost ×'+pct(tp.selloutSpeedBoost==null?1:tp.selloutSpeedBoost)+'</div>'+
            '<div style="font-size:14px;color:#aeb5c8;margin-top:4px">Vitesse (non rétroactive) : équipement ×'+pct(sp.gear||1)+' · Fibonacci ×'+pct(sp.fibonacci||1)+' · souhait ×'+pct(sp.wish||1)+' · Blind Evil ×'+pct(sp.blindEvil||1)+' · Blind Sadistic ×'+pct(sp.blindSadistic||1)+' · Digger ×'+pct(sp.digger||1)+' · Hack ×'+pct(sp.hack||1)+'</div>'+
            '<div style="font-size:14px;color:#aeb5c8;margin-top:4px">Slots : boutique EXP '+H.idleEntier_(ss.expShop||0)+'/3 · Blind Normal '+H.idleEntier_(ss.blindNormal||0)+'/1 · Troll Evil '+H.idleEntier_(ss.trollEvil||0)+'/1 · perk '+H.idleEntier_(ss.perk||0)+'/1 (6 au total)</div>'+
          '</details>';
        const enGarde=objets.length
          ?objets.map(function(x){
              const it=x.item||{};
              const avance=Math.max(0,Math.min(100,H.idleNombre_(x.progress)*100));
              const eta=x.maxed
                ?'✔ Niveau 100 atteint'
                :'prochain niveau dans '+dureeLongueNguIdleV1_(x.secondsToNextLevel)+' · niveau 100 dans '+dureeLongueNguIdleV1_(x.secondsToMax);
              return '<div class="soreal-idle-section-v8" style="margin:0">'+
                '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>'+H.idleHtml_(it.name||it.definitionId||'Objet')+'</b><span>Niv. '+H.idleEntier_(it.level)+' (+'+H.idleEntier_(x.levelsGained)+')</span></div>'+
                '<div style="font-size:14px;color:#aeb5c8;margin-top:5px">Base : 1 niveau / '+H.formatGrandNombreIdleV70_(x.baseHours,2)+' h · effectif : 1 niveau / '+dureeLongueNguIdleV1_(H.idleNombre_(x.effectiveHoursPerLevel)*3600)+' · '+eta+'</div>'+
                '<div class="soreal-idle-bt-track-v120"><div class="soreal-idle-bt-fill-v120" style="width:100%;transform:scaleX('+(avance/100)+');transform-origin:left center;background:#84cc16;transition:none"></div></div>'+
                '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:8px"><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__daycareIdleV1__(\'daycareRemove\',\''+H.idleHtml_(it.id)+'\')">📤 Reprendre</button></div>'+
              '</div>';
            }).join('')
          :'<div class="soreal-idle-note-v4">Aucun objet en garderie.</div>';
        const sac=Array.isArray(d.inventory)?d.inventory:[];
        const placables=sac.filter(function(o){return o.baseHours!=null;});
        const inconnus=sac.filter(function(o){return o.baseHours==null;});
        const listeSac=placables.length
          ?placables.map(function(o){
              const bloque=libres<=0||o.alreadyInDaycare||H.idleEntier_(o.level)>=100;
              const raison=o.alreadyInDaycare?'déjà en garderie':H.idleEntier_(o.level)>=100?'niveau max':libres<=0?'aucun slot libre':'';
              return '<div class="soreal-idle-section-v8" style="margin:0;display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap">'+
                '<span><b>'+H.idleHtml_(o.name)+'</b> · Niv. '+H.idleEntier_(o.level)+' · 1 niveau / '+H.formatGrandNombreIdleV70_(o.baseHours,2)+' h</span>'+
                '<button type="button" class="soreal-idle-expand-button-v25" '+(bloque?'disabled title="'+H.idleHtml_(raison)+'"':'onclick="window.__daycareIdleV1__(\'daycarePlace\',\''+H.idleHtml_(o.id)+'\')"')+'>📥 Placer</button>'+
              '</div>';
            }).join('')
          :'<div class="soreal-idle-note-v4">Aucun objet plaçable dans ton sac (les objets équipés doivent d\'abord être déséquipés).</div>';
        const noteInconnus=inconnus.length
          ?'<div class="soreal-idle-note-v4" style="margin-top:8px">'+inconnus.length+' objet(s) sans taux de garderie publié par le wiki : '+inconnus.map(function(o){return H.idleHtml_(o.name);}).join(', ')+'.</div>'
          :'';
        return titre+resume+detail+
          '<h3 style="margin:16px 0 8px">En garderie</h3><div style="display:grid;gap:10px">'+enGarde+'</div>'+
          '<h3 style="margin:16px 0 8px">Sac</h3><div style="display:grid;gap:8px">'+listeSac+'</div>'+noteInconnus;
      }
      function daycareIdleV1_(action,itemId){
        actionMetaIdleV130_({action:String(action),itemId:String(itemId)});
      }
      window.__daycareIdleV1__=daycareIdleV1_;

      /*
       * Cards et Mayo (2026-09-23, wiki page Cards) : deck, mayo, générateurs,
       * tags et tiers. Tout vient du snapshot serveur (j.systemes.cards,
       * idle-cards-v1.js::idleCardsSnapshotV1) ; aucune formule recalculée ici.
       */
      function pageCardsIdleV1_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const titre=H.entetePageIdleV28_('🃏 Cards','Une carte arrive toutes les heures tant que le deck n\'est pas plein. Lance une carte en payant son coût en mayo : son bonus devient permanent (conservé au Rebirth). Les cartes protégées ne peuvent être ni lancées ni jetées.');
        const c=(j&&j.systemes&&j.systemes.cards)||null;
        if(!c||!c.unlocked){
          return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        }
        const act=function(extra){
          return 'window.__actionMetaV47__('+H.idleHtml_(JSON.stringify(Object.assign({action:'cards'},extra)))+')';
        };
        const pct=function(v,d){return H.formatGrandNombreIdleV70_(H.idleNombre_(v),d===undefined?2:d)+' %';};
        const fois=function(v){return 'x'+H.formatGrandNombreIdleV70_(H.idleNombre_(v),4);};
        const deck=Array.isArray(c.deck)?c.deck:[];
        const types=Array.isArray(c.types)?c.types:[];
        const mayos=Array.isArray(c.mayoTypes)?c.mayoTypes:[];
        const nomMayo={};
        mayos.forEach(function(m){nomMayo[m.id]=m.nom;});
        const actifs=mayos.filter(function(m){return m.active;}).length;
        const tagues=types.filter(function(t){return t.tagged;}).length;

        const resume=[
          ['Deck',H.idleEntier_(deck.length)+' / '+H.idleEntier_(c.deckSize)],
          ['Prochaine carte',c.deckFull?'Deck plein':dureeLongueNguIdleV1_(c.secondsToNextCard)],
          ['Vitesse des cartes',fois(c.cardSpeed)],
          ['Vitesse de la mayo',fois(c.mayoSpeed)],
          ['Générateurs',actifs+' / '+H.idleEntier_(c.generatorSlots)],
          ['Tags',tagues+' / '+H.idleEntier_(c.tagSlots)+' · effet '+pct(c.tagEffectPct)],
          ['Coût en mayo',H.idleEntier_(c.mayoCostRange&&c.mayoCostRange[0])+' à '+H.idleEntier_(c.mayoCostRange&&c.mayoCostRange[1])],
          ['Regular Black Pens',H.idleEntier_(c.blackPens)],
          ['Mayo Infuser',H.idleNombre_(c.infuserSeconds)>0?dureeLongueNguIdleV1_(c.infuserSeconds):'inactif']
        ];
        if(c.chonkers)resume.push(['Prochain Big Chonker',c.deckFull?'Deck plein':dureeLongueNguIdleV1_(c.secondsToNextChonker)]);
        const grille='<div class="soreal-idle-summary-grid-v28">'+resume.map(function(x){return '<div class="soreal-idle-summary-v28">'+x[0]+'<b>'+x[1]+'</b></div>';}).join('')+'</div>';

        const blocMayo=mayos.map(function(m){
          const p=Math.max(0,Math.min(100,H.idleNombre_(m.progress)*100));
          return '<div class="soreal-idle-section-v8" style="margin:0">'+
            '<div style="display:flex;justify-content:space-between;gap:8px"><b>🥫 '+H.idleHtml_(m.nom)+'</b><span>'+H.formatGrandNombreIdleV70_(H.idleEntier_(m.stored))+'</span></div>'+
            '<div class="soreal-idle-bt-track-v120"><div class="soreal-idle-bt-fill-v120" style="width:100%;transform:scaleX('+(p/100)+');transform-origin:left center;background:#eab308;transition:none"></div></div>'+
            '<div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:6px">'+
              '<button type="button" class="soreal-idle-expand-button-v25" onclick="'+act({mode:'toggleGenerator',mayo:m.id})+'">'+(m.active?'⏸️ Arrêter le générateur':'▶️ Lancer un générateur')+'</button>'+
              '<span style="font-size:14px;color:#aeb5c8">'+(m.active?'1 mayo ≈ '+dureeLongueNguIdleV1_(m.secondsPerMayo):'générateur à l\'arrêt')+'</span>'+
            '</div></div>';
        }).join('');

        const blocTypes=types.map(function(t){
          return '<div class="soreal-idle-section-v8" style="margin:0">'+
            '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>'+H.idleHtml_(t.code)+' · '+H.idleHtml_(t.nom)+'</b><span>Tier '+H.idleEntier_(t.tier)+'</span></div>'+
            '<div style="font-size:14px;color:#aeb5c8;margin-top:4px">Bonus accumulé : <b>+'+pct(t.totalPct)+'</b> ('+fois(t.multiplier)+') · chance d\'apparition '+pct(H.idleNombre_(t.chance)*100)+'</div>'+
            '<div style="margin-top:6px"><button type="button" class="soreal-idle-expand-button-v25" onclick="'+act({mode:'toggleTag',type:t.id})+'">'+(t.tagged?'🏷️ Retirer le tag':'🏷️ Tagger')+'</button></div>'+
          '</div>';
        }).join('');

        const blocDeck=deck.length?deck.map(function(k,i){
          const cout=Object.keys(k.mayo||{}).map(function(id){return H.idleEntier_(k.mayo[id])+' '+H.idleHtml_(nomMayo[id]||id);}).join(', ');
          return '<div class="soreal-idle-section-v8" style="margin:0'+(k.chonker?';border:2px solid #eab308':'')+(k.theEnd?';border:2px solid #ff3b3b':'')+'">'+
            (k.theEnd
              ?'<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>'+(k.protected?'🔒 ':'')+'THE END</b></div>'+
                '<div style="font-size:14px;color:#aeb5c8;margin-top:4px">coût '+H.idleEntier_(k.mayoTotal)+' mayo : '+cout+'</div>'
              :'<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>'+(k.protected?'🔒 ':'')+(k.chonker?'🍔 Big Chonker · ':'')+H.idleHtml_(k.code)+' · '+H.idleHtml_(k.nom)+'</b><span>Tier '+H.idleEntier_(k.tier)+'</span></div>'+
                '<div style="font-size:14px;color:#aeb5c8;margin-top:4px">Bonus <b>+'+pct(k.bonusPct,3)+'</b> · rareté '+H.idleHtml_(k.rarityLabel)+' ('+H.idleNombre_(k.rarity).toFixed(3).replace('.',',')+') · coût '+H.idleEntier_(k.mayoTotal)+' mayo : '+cout+'</div>')+
            '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:7px">'+
              '<button type="button" class="soreal-idle-expand-button-v25" '+(k.canCast?'onclick="'+act({mode:'cast',cardId:k.id})+'"':'disabled')+'>✨ Lancer</button>'+
              '<button type="button" class="soreal-idle-expand-button-v25" '+(k.protected?'disabled':'onclick="'+act({mode:'yeet',cardId:k.id})+'"')+'>🗑️ Jeter</button>'+
              '<button type="button" class="soreal-idle-expand-button-v25" onclick="'+act({mode:'protect',cardId:k.id})+'">'+(k.protected?'🔓 Déprotéger':'🔒 Protéger')+'</button>'+
              '<button type="button" class="soreal-idle-expand-button-v25" '+(i>0?'onclick="'+act({mode:'move',cardId:k.id,index:i-1})+'"':'disabled')+'>⬆️</button>'+
              '<button type="button" class="soreal-idle-expand-button-v25" '+(i<deck.length-1?'onclick="'+act({mode:'move',cardId:k.id,index:i+1})+'"':'disabled')+'>⬇️</button>'+
            '</div></div>';
        }).join(''):'<div class="soreal-idle-section-v8" style="text-align:center;padding:18px">Deck vide : la première carte arrive dans '+dureeLongueNguIdleV1_(c.secondsToNextCard)+'.</div>';

        return titre+grille+
          '<h3 style="margin:16px 0 8px">Deck</h3><div style="display:grid;gap:10px">'+blocDeck+'</div>'+
          '<h3 style="margin:16px 0 8px">Mayo</h3><div style="font-size:14px;color:#aeb5c8;margin-bottom:6px">La production totale est partagée entre les générateurs actifs.</div><div style="display:grid;gap:10px">'+blocMayo+'</div>'+
          '<h3 style="margin:16px 0 8px">Types, tiers et tags</h3><div style="font-size:14px;color:#aeb5c8;margin-bottom:6px">Un type taggé apparaît plus souvent. Le tier s\'applique aux prochaines cartes de ce type.</div><div style="display:grid;gap:10px">'+blocTypes+'</div>';
      }

      /*
       * Advanced Training (Norman, 2026-10-02 : « l'interface n'est pas bonne du tout, ce sont des barres qui avancent » -- capture du jeu d'origine :
       * une ligne par compétence avec Name / Level / Energy Allocated / Target et les boutons + et −, au-dessus la barre d'outils Input + Cap/Idle).
       * Chaque compétence a sa propre énergie (allocateAdvancedTraining) ; le Target retire l'énergie dès que le niveau voulu est atteint.
       */
      const IDLE_AT_NOMS_V1={
        power:'Adventure Power +',
        toughness:'Adventure Toughness +',
        block:'Block Damage Reduction',
        wandoosEnergy:'Wandoos Energy Dump +',
        wandoosMagic:'Wandoos Magic Dump +'
      };
      const IDLE_AT_ORDRE_V1=['toughness','power','block','wandoosEnergy','wandoosMagic'];
      const IDLE_AT_ICONES_V1={toughness:'🛡️',power:'⚔️',block:'🧱',wandoosEnergy:'💻',wandoosMagic:'🔮'};
      function atEnergieDePisteIdleV1_(s,id){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const pistes=(s&&s.state&&s.state.data&&s.state.data.tracks)||{};
        const parPiste=Object.keys(pistes).reduce(function(somme,k){return somme+Math.max(0,H.idleNombre_(pistes[k]&&pistes[k].energy));},0);
        if(parPiste>0)return Math.max(0,H.idleNombre_(pistes[id]&&pistes[id].energy));
        /* Ancien contrat : allocation unique rattachée à la piste active. */
        const active=(s&&s.state&&s.state.data&&s.state.data.activeTrack)||'';
        return active===id?Math.max(0,H.idleNombre_(s.state.allocation&&s.state.allocation.energy)):0;
      }
      function pageAdvancedTrainingIdleV1_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const s=systemeMetaParIdIdleV130_(j,'advancedTraining');
        if(!s||!s.state||!s.state.unlocked)return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        const wandoos=systemeMetaParIdIdleV130_(j,'wandoos');
        const wandoosOk=Boolean(wandoos&&wandoos.state&&wandoos.state.unlocked);
        const pistes=(s.state.data&&s.state.data.tracks)||{};
        const ids=IDLE_AT_ORDRE_V1.filter(function(id){
          if(!pistes[id])return false;
          /* Anti-spoil (règle n°2) : rien sur Wandoos tant qu'il n'est pas débloqué. */
          return wandoosOk||!(id==='wandoosEnergy'||id==='wandoosMagic');
        });
        const nombre=function(v){return H.formatGrandNombreIdleV70_(H.idleNombre_(v));};
        const libre=Math.max(0,H.idleNombre_(j&&j.energie));
        const vueAt=(j&&j.systemes&&j.systemes.advancedTrainingView)||null;
        const ancreAt=ancreSnapshotIdleV1_(j);
        const ligne=function(id){
          const st=pistes[id]||{};
          const infoAt=(vueAt&&vueAt.pistes&&vueAt.pistes[id])||{};
          const niveau=Math.floor(H.idleNombre_(st.level)+H.idleNombre_(st.tempLevel)+H.idleNombre_(st.permanentLevel));
          const energie=atEnergieDePisteIdleV1_(s,id);
          const idH=H.idleHtml_(id);
          /* Barre de progression de la compétence (Norman, 2026-10-03) : repère du dernier état serveur (niveau temporaire, part du niveau suivant, énergie, taux), rejoué en direct par le minuteur ci-dessous. */
          const ancrage='data-at-n="'+Math.max(0,Math.floor(H.idleNombre_(st.tempLevel)))+'" data-at-base="'+Math.max(0,Math.floor(H.idleNombre_(st.level)+H.idleNombre_(st.permanentLevel)))+'" data-at-p="'+Math.max(0,Math.min(.999999,H.idleNombre_(st.progress)))+'" data-at-t="'+ancreAt+'" data-at-a="'+energie+'" data-at-taux="'+H.idleNombre_(infoAt.rateParEnergie)+'" data-at-gratuit="'+(vueAt&&vueAt.gratuit?1:0)+'" data-at-cible="'+H.idleEntier_(st.target)+'"';
          return '<div class="soreal-idle-at-ligne-v1" data-at-piste="'+idH+'" '+ancrage+'>'+
            '<div class="soreal-idle-at-nom-v1"><div class="soreal-idle-at-barre-v1"><i class="soreal-idle-at-remplissage-v1" data-at-fill></i><span class="soreal-idle-at-titre-v1">'+(IDLE_AT_ICONES_V1[id]?IDLE_AT_ICONES_V1[id]+' ':'')+H.idleHtml_(IDLE_AT_NOMS_V1[id]||id)+'</span></div><div class="soreal-idle-at-detail-v1"><span data-at-bonus></span><span data-at-eta></span></div></div>'+
            '<div class="soreal-idle-at-col-v1"><span>Level</span><b id="sorealIdleAtNiveau_'+idH+'">'+nombre(niveau)+'</b></div>'+
            '<div class="soreal-idle-at-col-v1"><span>Energy Allocated</span><b id="sorealIdleAtAlloc_'+idH+'" data-idle-alloc-pop-v1>'+nombre(energie)+'</b></div>'+
            '<label class="soreal-idle-at-col-v1 cible"><span>Target</span><input type="number" inputmode="numeric" min="0" step="1" value="'+H.idleEntier_(st.target)+'" title="Niveau cible : l’énergie de la compétence est retirée dès qu’il est atteint (0 = aucun)" onchange="window.__cibleAdvancedTrainingIdleV1__(\''+idH+'\',this.value)"></label>'+
            '<div class="soreal-idle-at-boutons-v1">'+
              '<button type="button" title="Placer la valeur de Input" onclick="window.__ajusterAdvancedTrainingIdleV1__(\''+idH+'\',\'plus\')">+</button>'+
              '<button type="button" title="Retirer la valeur de Input" onclick="window.__ajusterAdvancedTrainingIdleV1__(\''+idH+'\',\'moins\')">−</button>'+
            '</div>'+
          '</div>';
        };
        const toolbar='<div class="soreal-idle-bt-toolbar-v120"><div class="soreal-idle-bt-input-box-v120"><label for="sorealIdleAugInputV1">🎚️ Input</label><input id="sorealIdleAugInputV1" type="text" value="'+montantAugmentIdleV1+'" title="Un nombre, ou une fraction comme 1/8 (résolue en 1/8 de l\'énergie idle libre à la validation)" oninput="window.__saisirMontantAugmentIdleV1__(this.value)" onblur="window.__resoudreFractionInputIdleV1__(this);window.__saisirMontantAugmentIdleV1__(this.value)"></div>'+
          '<div class="soreal-idle-bt-info-v1">Énergie libre : <b id="sorealIdleAugEnergieLibreV1">'+nombre(libre)+'</b> ⚡</div>'+
          '<div class="soreal-idle-bt-presets-v120"><span>⚡ Energy Cap</span><button type="button" onclick="window.__presetAugmentIdleV1__(\'cap\',1)">Max</button><button type="button" onclick="window.__presetAugmentIdleV1__(\'cap\',.5)">1/2</button><button type="button" onclick="window.__presetAugmentIdleV1__(\'cap\',.25)">1/4</button></div>'+
          '<div class="soreal-idle-bt-presets-v120"><span>💤 Idle</span><button type="button" onclick="window.__presetAugmentIdleV1__(\'idle\',.5)">1/2</button><button type="button" onclick="window.__presetAugmentIdleV1__(\'idle\',.25)">1/4</button><button type="button" class="clear" onclick="window.__viderAdvancedTrainingIdleV1__()">Tout retirer</button></div></div>';
        return '<style>'+
          '.soreal-idle-at-v1{display:grid;gap:10px}'+
          '.soreal-idle-at-haut-v1{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}'+
          '.soreal-idle-at-aide-bouton-v1{min-height:44px;padding:6px 14px;border-radius:10px;border:2px solid rgba(255,255,255,.55);background:rgba(255,255,255,.12);color:inherit;font:inherit;font-weight:900;cursor:pointer}'+
          '.soreal-idle-at-avance-v1{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:800;cursor:pointer}'+
          '.soreal-idle-at-avance-v1 input{width:22px;height:22px}'+
          '.soreal-idle-at-aide-v1{padding:12px 14px;border-radius:12px;border:1.5px solid rgba(255,255,255,.25);background:rgba(0,0,0,.28);font-size:15px;line-height:1.55}'+
          '.soreal-idle-at-aide-v1[hidden]{display:none}'+
          '.soreal-idle-at-aide-v1 p{margin:0 0 8px}.soreal-idle-at-aide-v1 ol{margin:0;padding-left:20px;display:grid;gap:6px}'+
          '.soreal-idle-at-entete-v1{text-align:center;padding:6px 0 2px}'+
          '.soreal-idle-at-entete-v1 h1{margin:0;font-family:Impact,"Arial Black",sans-serif;font-size:30px;letter-spacing:.04em;text-transform:uppercase}'+
          '.soreal-idle-at-entete-v1 p{margin:2px 0 0;font-size:14px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.8}'+
          '.soreal-idle-at-liste-v1{display:grid;gap:9px}'+
          '.soreal-idle-at-ligne-v1{display:grid;grid-template-columns:minmax(150px,1.6fr) repeat(3,minmax(76px,1fr)) auto;gap:10px;align-items:center;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.18)}'+
          '.soreal-idle-at-nom-v1{font-weight:900;font-size:16px}'+
          '.soreal-idle-at-col-v1{display:flex;flex-direction:column;align-items:center;gap:3px;text-align:center}'+
          '.soreal-idle-at-col-v1 span{font-size:12px;font-weight:800;letter-spacing:.04em;opacity:.75;text-transform:uppercase}'+
          '.soreal-idle-at-col-v1 b{font-size:18px;font-variant-numeric:tabular-nums}'+
          '.soreal-idle-at-col-v1 input{width:100%;max-width:120px;box-sizing:border-box;padding:6px 8px;border-radius:8px;border:1.5px solid rgba(255,255,255,.3);background:rgba(0,0,0,.35);color:inherit;font:inherit;font-weight:800;text-align:center}'+
          '.soreal-idle-at-boutons-v1{display:flex;gap:8px}'+
          '.soreal-idle-at-boutons-v1 button{min-width:46px;min-height:44px;border-radius:10px;border:2px solid rgba(255,255,255,.55);background:rgba(255,255,255,.12);color:inherit;font-size:22px;font-weight:900;cursor:pointer}'+
          '.soreal-idle-at-barre-v1{position:relative;overflow:hidden;min-height:44px;border-radius:12px;border:2px solid rgba(231,198,255,.7);background:linear-gradient(180deg,rgba(60,28,92,.85),rgba(34,14,56,.92));box-shadow:inset 0 2px 6px rgba(0,0,0,.55),0 0 0 1px rgba(0,0,0,.4)}'+
          '.soreal-idle-at-remplissage-v1{position:absolute;inset:0;transform-origin:left center;transform:scaleX(0);background:linear-gradient(90deg,#7c3aed,#c026d3 55%,#f0abfc);box-shadow:0 0 14px rgba(192,38,211,.6);will-change:transform}'+
          '.soreal-idle-at-remplissage-v1::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(115deg,rgba(255,255,255,.14) 0 10px,transparent 10px 22px);mix-blend-mode:overlay}'+
          '.soreal-idle-at-barre-v1.pleine .soreal-idle-at-remplissage-v1{transform:scaleX(1)!important;animation:sorealAtPulseV1 1.4s ease-in-out infinite}'+
          '@keyframes sorealAtPulseV1{50%{filter:brightness(1.25)}}'+
          '.soreal-idle-at-titre-v1{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;min-height:44px;padding:4px 10px;font-weight:900;font-size:16px;text-align:center;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.9),0 0 8px rgba(0,0,0,.6)}'+
          '.soreal-idle-at-detail-v1{display:flex;flex-wrap:wrap;gap:4px 12px;justify-content:space-between;margin-top:4px;font-size:13px;font-weight:700;color:#e9d5ff;font-variant-numeric:tabular-nums}'+
          '@media(max-width:620px){.soreal-idle-at-ligne-v1{grid-template-columns:1fr 1fr 1fr;grid-template-areas:"nom nom nom" "niv alloc cible" "btn btn btn"}.soreal-idle-at-nom-v1{grid-column:1/-1;text-align:center}.soreal-idle-at-boutons-v1{grid-column:1/-1;justify-content:center}.soreal-idle-at-boutons-v1 button{flex:1;max-width:140px}}'+
        '</style>'+
        '<div class="soreal-idle-at-v1">'+
          '<div class="soreal-idle-at-haut-v1">'+
            '<button type="button" class="soreal-idle-at-aide-bouton-v1" onclick="window.__basculerAideAdvancedTrainingIdleV1__()">WTF do I do?</button>'+
            '<label class="soreal-idle-at-avance-v1"><input type="checkbox" '+(s.state.data&&s.state.data.advanceEnergy?'checked ':'')+'onchange="window.__basculerAdvanceAdvancedTrainingIdleV1__(this.checked)"> Advance Energy</label>'+
          '</div>'+
          '<header class="soreal-idle-at-entete-v1"><h1>Advanced Training</h1><p>(Time to improve your moves)</p></header>'+
          '<div class="soreal-idle-at-aide-v1" id="sorealIdleAtAideV1" hidden>'+
            '<p><b>À quoi ça sert ?</b> L’Advanced Training améliore ton Power et ta Toughness en Aventure, la réduction de dégâts du Block'+(wandoosOk?' et la vitesse des dumps de Wandoos':'')+'.</p>'+
            '<ol>'+
              '<li><b>Place de l’énergie</b> sur une compétence avec <b>+</b> : la quantité placée est celle de la case <b>Input</b> (les boutons Cap, 1/2 et 1/4 la remplissent). <b>−</b> la retire.</li>'+
              '<li>Chaque compétence avance <b>avec sa propre énergie</b>, en même temps que les autres. Chaque niveau demande plus de temps que le précédent, avec des bonus qui augmentent de moins en moins.</li>'+
              '<li>Ta <b>Puissance d’énergie</b> ne compte que par sa racine carrée ; ton <b>plafond d’énergie</b> compte à plein.</li>'+
              '<li><b>Target</b> : le niveau à atteindre. Dès qu’il est atteint, l’énergie de la compétence est retirée (0 = aucun objectif).</li>'+
              '<li><b>Advance Energy</b> : quand une compétence atteint son Target, son énergie passe automatiquement à la ligne suivante.</li>'+
              '<li>Les niveaux sont remis à zéro à chaque Rebirth.</li>'+
            '</ol>'+
          '</div>'+
          toolbar+
          '<div class="soreal-idle-at-liste-v1">'+ids.map(ligne).join('')+'</div>'+
          '<div class="soreal-idle-note-v4">Chaque compétence progresse avec sa propre énergie. Les niveaux montent de plus en plus lentement, et la Puissance d’énergie ne compte que par sa racine carrée.</div>'+
        '</div>';
      }
      window.__SOREAL_IDLE_AT_PAGE_V2__=true;

      /*
       * Barres de l'Advanced Training, en direct (Norman, 2026-10-03). Mêmes formules que le moteur (advanceAdvancedTrainingV1) :
       *  - travail par seconde = énergie allouée × rateParEnergie (= √Puissance × bonus équipement / (10 000 s ou 20 000 s × 1000)) ;
       *  - passer du niveau n au suivant demande n + 1 unités de travail (coût linéaire) ; au plus 50 niveaux par seconde ; gratuit à 50 niveaux/s avec le souhait dédié ;
       *  - bonus Power/Toughness = niveau^0,4 × 10 % ; Block = (niveau + 50) / (niveau + 100) ; Wandoos = +1 % de vitesse du dump par niveau.
       * Le Target (niveau voulu) arrête la barre, comme le serveur retire l'énergie à ce moment.
       */
      function atNiveauxDepuisTravailIdleV1_(niveau,travail){
        const L=Math.max(0,Math.floor(niveau)),W=Math.max(0,travail);
        const a=2*L+1;
        let k=Math.floor((2*W)/(a+Math.sqrt(a*a+8*W)));
        const total=function(n){return n*(2*L+n+1)/2;};
        while(k>0&&total(k)>W)k-=1;
        while(total(k+1)<=W)k+=1;
        return {gagnes:k,reste:Math.max(0,W-total(k))};
      }
      function atSimulerIdleV1_(n0,p0,dt,alloc,taux,gratuit,cible){
        let n=n0,p=p0;
        if(gratuit){
          const gagnes=Math.floor(p0+50*dt);
          n=n0+gagnes;p=(p0+50*dt)-gagnes;
        }else if(alloc>0&&taux>0&&dt>0){
          const travail=p0*(n0+1)+alloc*taux*dt;
          const pas=atNiveauxDepuisTravailIdleV1_(n0,travail);
          const gagnes=Math.min(pas.gagnes,Math.floor(50*dt)+1);
          n=n0+gagnes;
          p=gagnes<pas.gagnes?0:Math.min(.999999,pas.reste/(n+1));
        }
        if(cible>0&&n>=cible){n=Math.max(n0,cible);p=0;}
        return {n:n,p:p};
      }
      function atBonusTexteIdleV1_(id,niveau){
        const fr=function(v,d){return v.toLocaleString('fr-FR',{maximumFractionDigits:d});};
        if(id==='power'||id==='toughness')return 'Bonus : +'+fr(Math.pow(Math.max(0,niveau),0.4)*10,2)+' %';
        if(id==='block')return 'Réduction : '+fr((niveau+50)/(niveau+100)*100,2)+' %';
        return 'Vitesse du dump : +'+fr(niveau,0)+' %';
      }
      function atTickIdleV1_(){
        const lignes=document.querySelectorAll('.soreal-idle-at-ligne-v1[data-at-piste]');
        if(!lignes.length)return;
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const sys=j?systemeMetaParIdIdleV130_(j,'advancedTraining'):null;
        const maintenant=performance.now();
        for(let i=0;i<lignes.length;i++){
          const el=lignes[i],id=el.getAttribute('data-at-piste'),d=el.dataset;
          const taux=Number(d.atTaux)||0,gratuit=d.atGratuit==='1',cible=Number(d.atCible)||0;
          const alloc=sys?atEnergieDePisteIdleV1_(sys,id):Number(d.atA)||0;
          let n0=Number(d.atN)||0,p0=Number(d.atP)||0,t0=Number(d.atT)||maintenant;
          /* L'énergie a changé (+ / − / Target atteint côté serveur) : on rejoue jusqu'à maintenant avec l'ancienne, puis on repart de là. */
          if(Math.abs(alloc-(Number(d.atA)||0))>1e-9){
            const avant=atSimulerIdleV1_(n0,p0,Math.max(0,(maintenant-t0)/1000),Number(d.atA)||0,taux,gratuit,cible);
            n0=avant.n;p0=avant.p;t0=maintenant;
            d.atN=String(n0);d.atP=String(p0);d.atT=String(t0);d.atA=String(alloc);
          }
          const etat=atSimulerIdleV1_(n0,p0,Math.max(0,(maintenant-t0)/1000),alloc,taux,gratuit,cible);
          const niveau=(Number(d.atBase)||0)+etat.n;
          const nivEl=document.getElementById('sorealIdleAtNiveau_'+id);
          /* Audit d'Entraînement avancé (Norman, 2026-10-05) : ce passage tourne ~7 fois par seconde et réécrivait niveau et bonus de chaque piste même identiques (~40 modifications de page par seconde au repos) ; seulement s'ils changent. */
          if(nivEl){const t=H.formatGrandNombreIdleV70_(niveau);if(nivEl.textContent!==t)nivEl.textContent=t;}
          const barre=el.querySelector('.soreal-idle-at-barre-v1'),rempl=el.querySelector('[data-at-fill]');
          const travailParS=gratuit?Infinity:alloc*taux;
          const niveauxParS=gratuit?50:Math.min(50,travailParS/(etat.n+1));
          const atteint=cible>0&&etat.n>=cible;
          const pleine=!atteint&&niveauxParS>=49.9;
          if(barre)barre.classList.toggle('pleine',pleine);
          if(rempl&&!pleine){const tr='scaleX('+(atteint?1:etat.p)+')';if(rempl.style.transform!==tr)rempl.style.transform=tr;}
          const bonusEl=el.querySelector('[data-at-bonus]');
          if(bonusEl){const t=atBonusTexteIdleV1_(id,niveau);if(bonusEl.textContent!==t)bonusEl.textContent=t;}
          const etaEl=el.querySelector('[data-at-eta]');
          if(etaEl){
            let txt;
            if(atteint)txt='🎯 Target atteint';
            else if(gratuit||niveauxParS>=49.9)txt='⚡ 50 niveaux par seconde (maximum)';
            else if(!(travailParS>0))txt='Place de l’énergie pour progresser.';
            else{
              const reste=(1-etat.p)*((etat.n+1)/travailParS);
              txt='Niveau suivant dans '+formatDureeAugmentIdleV1_(reste)+(niveauxParS>=1?' · '+niveauxParS.toLocaleString('fr-FR',{maximumFractionDigits:1})+' niv/s':'');
            }
            if(etaEl.textContent!==txt)etaEl.textContent=txt;
          }
        }
      }
      if(typeof setInterval==='function'&&!window.__SOREAL_IDLE_AT_TICK_V1__){
        window.__SOREAL_IDLE_AT_TICK_V1__=true;
        setInterval(atTickIdleV1_,150);
      }

      function atPatchLigneIdleV1_(id,valeur){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const span=document.getElementById('sorealIdleAtAlloc_'+id);
        if(span)span.textContent=H.formatGrandNombreIdleV70_(valeur);
        const libre=document.getElementById('sorealIdleAugEnergieLibreV1');
        if(libre){
          const j=H.getIdleEtat();
          libre.textContent=H.formatGrandNombreIdleV70_(Math.max(0,H.idleNombre_(j&&j.energie)));
        }
        if(typeof H.rafraichirEnergieEtBoutonsIdleV9_==='function')H.rafraichirEnergieEtBoutonsIdleV9_();
      }
      function ajusterAdvancedTrainingIdleV1_(id,mode){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const s=systemeMetaParIdIdleV130_(j,'advancedTraining');
        const piste=s&&s.state&&s.state.data&&s.state.data.tracks&&s.state.data.tracks[id];
        if(!piste)return;
        const courant=atEnergieDePisteIdleV1_(s,id);
        const pas=montantAugmentLireIdleV1_();
        const libre=Math.max(0,H.idleNombre_(j&&j.energie));
        const valeur=Math.max(0,H.idleEntier_(mode==='plus'?courant+Math.min(pas,libre):Math.max(0,courant-pas)));
        const delta=valeur-courant;
        if(delta!==0){
          if(H.jouerEffetAudioIdleV199_)H.jouerEffetAudioIdleV199_(mode==='plus'?'btPlus':'btMinus');
          /* Ancien contrat : on matérialise d'abord l'allocation unique sur la piste active, pour ne rien compter deux fois. */
          const dejaParPiste=Object.keys(s.state.data.tracks).some(function(k){return Math.max(0,H.idleNombre_(s.state.data.tracks[k].energy))>0;});
          if(!dejaParPiste){
            const actif=s.state.data.tracks[s.state.data.activeTrack||''];
            if(actif)actif.energy=Math.max(0,H.idleNombre_(s.state.allocation&&s.state.allocation.energy));
          }
          piste.energy=valeur;
          if(s.state.allocation)s.state.allocation.energy=Math.max(0,H.idleNombre_(s.state.allocation.energy)+delta);
          if(j)j.energie=Math.max(0,libre-delta);
          atPatchLigneIdleV1_(id,valeur);
        }
        /* Rien n'a changé (plus d'énergie libre, déjà à zéro) : aucun envoi (audit d'Entraînement avancé, 2026-10-05). */
        if(delta===0)return;
        envoyerAllocRapideV1_({action:'allocateAdvancedTraining',track:id,value:valeur});
      }
      window.__ajusterAdvancedTrainingIdleV1__=ajusterAdvancedTrainingIdleV1_;
      window.__basculerAideAdvancedTrainingIdleV1__=function(){
        const el=document.getElementById('sorealIdleAtAideV1');
        if(el)el.hidden=!el.hidden;
      };
      window.__basculerAdvanceAdvancedTrainingIdleV1__=function(actif){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const s=systemeMetaParIdIdleV130_(j,'advancedTraining');
        if(s&&s.state&&s.state.data)s.state.data.advanceEnergy=Boolean(actif);
        envoyerAllocRapideV1_({action:'setAdvancedTrainingAdvance',enabled:Boolean(actif)});
      };
      window.__cibleAdvancedTrainingIdleV1__=function(id,valeur){
        const n=Math.max(0,Math.floor(Number(valeur)||0));
        envoyerAllocRapideV1_({action:'setAdvancedTrainingTarget',track:String(id),value:n});
      };
      window.__viderAdvancedTrainingIdleV1__=function(){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const j=H.getIdleEtat();
        const s=systemeMetaParIdIdleV130_(j,'advancedTraining');
        const pistes=(s&&s.state&&s.state.data&&s.state.data.tracks)||{};
        Object.keys(pistes).forEach(function(id){
          const courant=atEnergieDePisteIdleV1_(s,id);
          if(courant<=0)return;
          pistes[id].energy=0;
          if(s.state.allocation)s.state.allocation.energy=Math.max(0,H.idleNombre_(s.state.allocation.energy)-courant);
          if(j)j.energie=Math.max(0,H.idleNombre_(j.energie)+courant);
          atPatchLigneIdleV1_(id,0);
          envoyerAllocRapideV1_({action:'allocateAdvancedTraining',track:id,value:0});
        });
      };

      function pageSystemeMetaIdleV130_(
        j,
        id,
        titre
      ){
        if(id==='cards')return pageCardsIdleV1_(j);
        if(id==='augmentations')return pageAugmentationsIdleV48_(j);
        if(id==='daycare')return pageDaycareIdleV1_(j);
        if(id==='ngu')return pageNguIdleV1_(j);
        if(id==='wishes')return pageWishesIdleV1_(j);
        if(id==='timeMachine')return pageTimeMachineIdleV48_(j);
        if(id==='advancedTraining')return pageAdvancedTrainingIdleV1_(j);
        if(id==='bloodMagic')return pageBloodMagicIdleV48_(j);
        if(id==='yggdrasil')return pageYggdrasilIdleV47_(j);
        if(id==='diggers')return pageDiggersIdleV47_(j);
        if(id==='tower')return pageItopodIdleV1_(j);
        if(id==='quirks')return pageQuirksIdleV1_(j);
        /* Questing : page dans modules/questing-v1.js. */
        if(id==='questing'&&window.__SOREAL_IDLE_QUESTING_V1__)return window.__SOREAL_IDLE_QUESTING_V1__.page(j);
        if(id==='challenges')return pageChallengesIdleV1_(j);
        /* MacGuffin Fragments : page dans modules/macguffins-v1.js (2026-09-23). */
        if(id==='macguffins'&&window.__SOREAL_IDLE_MACGUFFINS_V1__)return window.__SOREAL_IDLE_MACGUFFINS_V1__.page(j);

        if(id==='moneyPit')return pageMoneyPitDailySpinIdleV206_(j);
        /* Cooking : page rendue par modules/cooking-v1.js. */
        if(id==='cooking'&&window.__SOREAL_IDLE_COOKING_V1__)return window.__SOREAL_IDLE_COOKING_V1__.page(j);
        /* Achievements + Player Portraits : page rendue par modules/profile-v1.js (2026-09-24). */
        if(id==='achievements'&&window.__SOREAL_IDLE_PROFILE_V1__)return window.__SOREAL_IDLE_PROFILE_V1__.page(j);
        /* Wandoos : page « ordinateur rétro » rendue par modules/wandoos-retro-v1.js (2026-10-06). */
        if(id==='wandoos'&&window.__SOREAL_IDLE_WANDOOS_V1__){const pw=window.__SOREAL_IDLE_WANDOOS_V1__.page(j);if(pw)return pw;}

        const s=
          systemeMetaParIdIdleV130_(
            j,
            id
          );

        return ''+
          window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_(
            (s?s.icon:'⚙️')+' '+(titre||(s&&s.name)||'Système'),
            s&&s.desc
              ?s.desc
              :'Métaprogression SOREAL IDLE.'
          )+
          bandeauMetaIdleV130_(j)+
          rendreSystemeMetaIdleV130_(
            j,
            s,
            true
          )+
          (id==='hacks'&&s&&s.finalHack&&window.__SOREAL_IDLE_THE_END_UI_V1__?window.__SOREAL_IDLE_THE_END_UI_V1__.finalHackHtml(s.finalHack):'');
      }




  window.__SOREAL_IDLE_META_V130__={
    pageSystemeMetaIdleV130_:pageSystemeMetaIdleV130_,
    actionMetaIdleV130_:actionMetaIdleV130_,
    estOccupeIdleV130_:function(){return idleMetaBusyV130;},
    systemeMetaParIdIdleV130_:systemeMetaParIdIdleV130_,
    pageSpendExpIdleV1_:pageSpendExpIdleV1_,
    boutiqueCssIdleV1_:idleBoutiqueCssIdleV1_
  };
})();
