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
          /* audit 2026-10-13 : on ne dédoublonne que contre la DERNIÈRE action en attente (ou, file vide, contre la dernière envoyée) : A, B, A rapides finissent bien à A au lieu de perdre le 3e clic */
          const dernierEnFile=idleMetaFileV1.length?cleActionMetaV1_(idleMetaFileV1[idleMetaFileV1.length-1]):'';
          if(cle&&idleMetaFileV1.length&&cle===dernierEnFile)return;
          if(cle&&!idleMetaFileV1.length&&cle===idleMetaDernierEnvoiV1.cle&&Date.now()-idleMetaDernierEnvoiV1.at<700)return;
          idleMetaFileV1.push(payload);
          if(idleMetaFileV1.length>12)idleMetaFileV1.shift();
          if(!idleMetaTimerFileV1)idleMetaTimerFileV1=setTimeout(viderFileActionsMetaV1_,60);
          return;
        }
        actionMetaNoyauIdleV130_(payload);
      }

      /* Refus d'une copie de Wandoos : un message clair à la place du code d'erreur du serveur. */
      function messageCopieWandoosV1_(code){
        const m=String(code||'').match(/^NIVEAU_COPIE_INSUFFISANT(?::(d+))?/);
        if(m)return '⚠️ Pas assez de niveaux sur cette copie'+(m[1]?' : il faut qu’elle soit au niveau '+m[1]+' ou plus pour passer l’OS au niveau '+m[1]:'')+'. Fusionne d’autres copies pour la monter.';
        if(code==='OS_NIVEAU_MAX')return '⚠️ Le niveau d’OS de cette source est déjà au maximum.';
        if(code==='COPIE_WANDOOS_INVALIDE')return '⚠️ Cet objet ne peut pas être installé.';
        return 'Action impossible.';
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

              /* Norman (2026-10-27) : lancer un défi = un Rebirth ; même arrivée : on atterrit sur la borne d'arcade (menu Combat), page placée sous la bannière. */
              const defiDemarreV1=Boolean(payload&&payload.action==='challenge'&&payload.mode==='start'&&res.resultat&&res.resultat.started);
              if(defiDemarreV1){
                const regDefi=window.__SOREAL_IDLE_REG__||{};
                regDefi.idleMenuActifV28='combat';
                try{regDefi.sauverMenuIdleV28_();}catch(_e){}
              }
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
                /* Norman (2026-10-13) : le combat de titan a son propre écran (titans-combat-ecran-v1.js) : on ne bascule plus vers l'Aventure au lancement (cliquer sur Aventure arrête le combat). */
                }else if(
                  /* Wandoos (Norman, 2026-10-08 : « quand je mets des points dans Wandoos, ça remonte l'écran ») : le poste est déjà mis à jour à l'appui ; la réponse du serveur ne reconstruit plus toute la page, seulement le poste. */
                  payload&&payload.action==='allocate'&&payload.system==='wandoos'&&
                  window.__SOREAL_IDLE_WANDOOS_V1__&&typeof window.__SOREAL_IDLE_WANDOOS_V1__.rafraichir==='function'&&
                  document.querySelector('.wd-poste')
                ){
                  /* Sécurité : si le rafraîchissement du poste échoue pour une raison quelconque, on retombe sur le rendu complet plutôt que de laisser l'écran figé. */
                  try{
                    window.__SOREAL_IDLE_WANDOOS_V1__.rafraichir();
                    if(!document.querySelector('.wd-poste .wd-ecran'))throw new Error('poste vide');
                  }catch(_e){
                    window.__SOREAL_IDLE_META_HOST_V130__.rendreIdleEtat_({ok:true,joueur:joueurMetaProtegeV208});
                  }
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
              if(defiDemarreV1){
                try{
                  const toutEnHautDefi=function(){const ban=document.querySelector('.soreal-idle-hero-banner-v95')||document.querySelector('.soreal-idle-hero-v4');window.scrollTo(0,ban?Math.max(0,Math.round(ban.getBoundingClientRect().bottom+(window.scrollY||0))):0);};
                  toutEnHautDefi();
                  requestAnimationFrame(function(){toutEnHautDefi();});
                  setTimeout(toutEnHautDefi,250);
                  setTimeout(toutEnHautDefi,700);
                }catch(_e){}
              }

              if(window.__SOREAL_IDLE_THE_END_UI_V1__){
                const aventureFin=window.__SOREAL_IDLE_META_HOST_V130__.aventureMetaIdleV47_(window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat());
                window.__SOREAL_IDLE_THE_END_UI_V1__.notifier(aventureFin);
                if(res.resultat&&Array.isArray(res.resultat.text)&&payload&&payload.adventure&&payload.adventure.action==='theEndPlay'){
                  window.__SOREAL_IDLE_THE_END_UI_V1__.ouvrirFin(res.resultat.text);
                }
              }

              /* Coffre ou Valise nettoyé : le moteur a tiré et versé les AP, la page montre le « +N AP » qui s'envole (modules/nettoyage-ap-v1.js). */
              if(payload&&payload.action==='cleanMess'&&res.resultat&&Number(res.resultat.ap)>0){
                try{window.dispatchEvent(new CustomEvent('soreal-nettoyage-ap',{detail:{ap:Number(res.resultat.ap),rare:Boolean(res.resultat.rare),lieu:String(res.resultat.lieu||'')}}));}catch(_e){}
              }
              if(
                res.resultat &&
                Object.keys(res.resultat).length
              ){
                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-293 */
                if(!estCycleCombatZoneV1){
                  /* A + clic sans rien d'absorbé : on dit pourquoi. */
                  const boostVideV1=payload&&payload.action==='inventoryAuto'&&payload.mode==='boostAll'
                    &&!(window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(res.resultat.applied)>0||window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(res.resultat.cube)>0);
                  const ia=window.__SOREAL_IDLE_INVENTORY_AUTO_V1__;
                  /* Plus de « Progression mise à jour » (Norman, 2026-10-07) : seul reste le message qui explique pourquoi un boost n'a rien absorbé. */
                  if(boostVideV1&&ia&&ia.expliquerAucunBoost&&payload.targetId&&payload.targetId!=='cube'){
                    window.__SOREAL_IDLE_META_HOST_V130__.messageFlottantIdleV32_(ia.expliquerAucunBoost(payload.targetId));
                  }
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

                /* Liquide mystérieux bu : un popup dit quelle compétence du combat manuel vient d'être débloquée (competence-debloquee-v1.js). */
                if(
                  payload&&
                  payload.action==='adventure'&&
                  payload.adventure&&
                  payload.adventure.action==='consumeSkillItem'&&
                  window.__SOREAL_IDLE_COMPETENCE_V1__
                ){
                  window.__SOREAL_IDLE_COMPETENCE_V1__.annoncer(res.resultat.definitionId);
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
                      '+ '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(res.resultat.gold)+' or ! '+exclamationOrIdleV1_(res.resultat.gold)
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

                /*
                 * Fusion de toutes les pièces identiques (clic droit sur PC, double tap sur téléphone ; mode:'mergeAll') : même son que lorsqu'on glisse une pièce sur une pièce identique (Norman, 2026-10-09) :
                 * fusion d'arme, d'armure ou d'accessoire selon l'emplacement de la pièce, joué seulement si quelque chose a réellement été fusionné.
                 */
                if(
                  payload&&
                  payload.action==='inventoryAuto'&&
                  payload.mode==='mergeAll'&&
                  window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(res.resultat.merged)>0
                ){
                  try{
                    const H2=window.__SOREAL_IDLE_META_HOST_V130__;
                    const a2=H2.aventureMetaIdleV47_(H2.getIdleEtat());
                    const piece=((a2&&a2.inventory)||[]).find(function(x){return String(x&&x.id)===String(payload.itemId||'');});
                    const empl=String(piece&&piece.slot||'');
                    const cue=empl==='weapon'?'mergeWeapon':(['head','chest','legs','boots'].indexOf(empl)!==-1?'mergeArmor':'mergeAccessory');
                    const audio=window.__SOREAL_IDLE_AUDIO_V199__;
                    if(audio&&typeof audio[cue]==='function')audio[cue]();
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
                /* Rituel d'un sort de sang (son + orage) : il ne part qu'APRÈS l'acceptation du serveur (jamais sur un simple clic refusé). */
                if(payload&&payload.action==='castBloodSpell'){
                  try{if(typeof window.__sonSortBloodIdleV1__==='function')window.__sonSortBloodIdleV1__(String(payload.spell||''));}catch(_e){}
                }
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
                    if(window.__roueSonneeIdleV1__){window.__roueSonneeIdleV1__=false;}
                    else if(window.__SOREAL_IDLE_AUDIO_V199__&&typeof window.__SOREAL_IDLE_AUDIO_V199__.dailySpin==='function'){
                      window.__SOREAL_IDLE_AUDIO_V199__.dailySpin();
                    }
                  }catch(_e){}
                }

                /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-297 */
                /* Copie de Wandoos 98 / XL utilisée (Norman, 2026-10-14) : on dit ce qui s'est passé. */
                if(payload&&payload.action==='consumeWandoosCopy'){
                  /* Son « ordinateur positif » à chaque mise à jour de Wandoos (Norman, 2026-10-15) */
                  try{if(window.__SOREAL_IDLE_AUDIO_V199__&&typeof window.__SOREAL_IDLE_AUDIO_V199__.wandoosMaj==='function')window.__SOREAL_IDLE_AUDIO_V199__.wandoosMaj();}catch(_e){}
                  window.__SOREAL_IDLE_META_HOST_V130__.toastIdleV5_(
                    res.resultat.unlocked==='xl'
                      ?'💾 Wandoos XL débloqué !'
                      :'💾 Wandoos : niveau d’OS '+window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(res.resultat.osLevel)+' ('+(res.resultat.source==='consumedXl'?'copie de Wandoos XL':'copie de Wandoos 98')+')'
                  );
                }
                if(payload&&payload.action==='moneyPit'&&res.resultat.rien){
                  window.__SOREAL_IDLE_META_HOST_V130__.toastIdleV5_('Tu te sens bien plus pauvre… mais rien ne s’est passé :c. Peut-être qu’il faut jeter plus d’or ?');
                }
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

            /* Installation refusée (niveaux insuffisants…) : son d'erreur d'ordinateur (Norman, 2026-10-15) */
            try{if(payload&&payload.action==='consumeWandoosCopy'&&window.__SOREAL_IDLE_AUDIO_V199__&&typeof window.__SOREAL_IDLE_AUDIO_V199__.wandoosErreur==='function')window.__SOREAL_IDLE_AUDIO_V199__.wandoosErreur();}catch(_e){}
            window.__SOREAL_IDLE_META_HOST_V130__.toastIdleV5_(
              payload&&payload.action==='consumeWandoosCopy'&&res&&res.message
                ?messageCopieWandoosV1_(res.message)
                :payload&&payload.action==='castBloodSpell'&&res&&/SANG_INSUFFISANT/.test(String(res.message||''))
                ?'Pas assez de sang pour lancer ce sort.'
                :res&&res.message
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

      /* page Boutique EXP : rendu dans modules/boutique-exp-page-v1.js (découpage du monolithe, 2026-10-16). */
      function idleExpShopIdInput_(){return window.__SOREAL_IDLE_BOUTIQUE_EXP_PAGE_V1__.idleExpShopIdInput_.apply(null,arguments);}
      function idleExpQuantiteChampIdleV1_(){return window.__SOREAL_IDLE_BOUTIQUE_EXP_PAGE_V1__.idleExpQuantiteChampIdleV1_.apply(null,arguments);}
      function idleBoutiqueCssIdleV1_(){return window.__SOREAL_IDLE_BOUTIQUE_EXP_PAGE_V1__.idleBoutiqueCssIdleV1_.apply(null,arguments);}
      function pageSpendExpIdleV1_(){return window.__SOREAL_IDLE_BOUTIQUE_EXP_PAGE_V1__.pageSpendExpIdleV1_.apply(null,arguments);}



















      function acheterRessourceMetaIdleV130_(ressource,stat,quantite){
        const payload={action:'buyResource',resource:ressource,stat:stat};
        const qty=Math.floor(Number(quantite));
        if(Number.isFinite(qty)&&qty>1)payload.quantity=qty;
        actionMetaIdleV130_(payload);
      }
      window.__acheterRessourceMetaIdleV130__=acheterRessourceMetaIdleV130_;

      function acheterRessourceLotPersonnaliseMetaIdleV130_(ressource,stat){
        const input=document.getElementById(idleExpShopIdInput_(ressource,stat));
        const qty=input?idleExpQuantiteChampIdleV1_(input,Number(input.getAttribute('data-gain'))):1;
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
        const A=window.__SOREAL_IDLE_ALLOC_V1__;
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        /*
         * Norman (2026-10-09) : dans chaque menu où l'on place une ressource, + − MAX sur chaque ligne et, en haut, deux cadres (Plafond MAX 1/2 1/4 ; IDLE 1/2 1/4 TOUT RETIRER). Les anciens boutons ±10 %
         * envoyaient une valeur bornée à 100 : on place maintenant des quantités réelles (le serveur borne au maximum et à ce qui est libre).
         */
        return '<div class="soreal-idle-bt-toolbar-v120">'+
            (A?A.entree('sorealIdleGenInputV1'):'')+
            ressources.map(function(r){return A?A.cadres(r,s.id):'';}).join('')+
          '</div>'+
          '<div class="soreal-idle-shop-grid-v12">'+
          ressources.map(function(r){
            const valeur=
              H.idleNombre_(
                s.state&&
                s.state.allocation&&
                s.state.allocation[r]
              );
            const sid=H.idleHtml_(s.id),rid=H.idleHtml_(r);
            const act='window.__SOREAL_IDLE_ALLOC_V1__.ajuster(\''+sid+'\',\''+rid+'\',';
            return '<div class="soreal-idle-section-v8">'+
              '<div class="soreal-idle-window-title-v31">'+
                libelleRessourceMetaIdleV130_(r)+
              '</div>'+
              '<div class="soreal-idle-note-v4">'+
                'Placé : <strong>'+H.formatGrandNombreIdleV70_(valeur)+'</strong>'+
              '</div>'+
              '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:8px">'+
                '<button type="button" class="soreal-idle-expand-button-v25" title="Retirer la valeur de Input" onclick="'+act+'\'moins\')">−</button>'+
                '<button type="button" class="soreal-idle-expand-button-v25" title="Placer la valeur de Input" onclick="'+act+'\'plus\')">+</button>'+
                '<button type="button" class="soreal-idle-expand-button-v25" title="Placer toute la ressource libre" onclick="'+act+'\'max\')">Max</button>'+
              '</div>'+
            '</div>';
          }).join('')+
        '</div>';
      }


      /* Money Pit / Daily Spin : rendu dans modules/money-pit-page-v1.js (découpage du monolithe, 2026-10-16). */
      function rendreBoutonMoneyPitIdleV1_(j,st){return window.__SOREAL_IDLE_MONEY_PIT_V1__.rendreBoutonMoneyPit(j,st);}
      function rendreBoutonDailySpinIdleV203_(st){return window.__SOREAL_IDLE_MONEY_PIT_V1__.rendreBoutonDailySpin(st);}
      function pageMoneyPitDailySpinIdleV206_(j){return window.__SOREAL_IDLE_MONEY_PIT_V1__.page(j);}
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


      
      /* pages Yggdrasil (repli) et Gold Diggers : rendu dans modules/yggdrasil-diggers-page-v1.js (découpage du monolithe, 2026-10-16). */
      function pageYggdrasilIdleV47_(){return window.__SOREAL_IDLE_YGG_DIGGERS_PAGE_V1__.pageYggdrasilIdleV47_.apply(null,arguments);}
      function pageDiggersIdleV47_(){return window.__SOREAL_IDLE_YGG_DIGGERS_PAGE_V1__.pageDiggersIdleV47_.apply(null,arguments);}


      /* pages Perks, Quirks et ITOPOD : rendu dans modules/itopod-perks-page-v1.js (découpage du monolithe, 2026-10-16). */
      function pageQuirksIdleV1_(){return window.__SOREAL_IDLE_ITOPOD_PERKS_PAGE_V1__.pageQuirksIdleV1_.apply(null,arguments);}
      function pageItopodIdleV1_(){return window.__SOREAL_IDLE_ITOPOD_PERKS_PAGE_V1__.pageItopodIdleV1_.apply(null,arguments);}












      /* page Défis (Challenges) : rendu dans modules/defis-page-v1.js (découpage du monolithe, 2026-10-16). */
      function pageChallengesIdleV1_(){return window.__SOREAL_IDLE_DEFIS_PAGE_V1__.pageChallengesIdleV1_.apply(null,arguments);}




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

      /* Page NGU : gardée ici, ses deux aides (durée longue, plafond) servent aussi aux pages Wishes, Garderie et Cartes. */
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

      /*
       * Page NGU : « le laboratoire » (modules/ngu-labo-v1.js, Norman 2026-10-08) -- fioles verticales aux couleurs de l'écran NGU de NGU Idle, + / −, Target, Advance Energy. Les NGU de magie non débloqués n'y
       * apparaissent pas du tout (anti-spoil) ; tant que le système n'est pas découvert : « Rien à afficher ».
       */
      function pageNguIdleV1_(j){
        const labo=window.__SOREAL_IDLE_NGU_LABO_V1__;
        if(labo&&typeof labo.page==='function')return labo.page(j);
        return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
      }

      function pageWishesIdleV1_(){return window.__SOREAL_IDLE_WISHES_PAGE_V1__.pageWishesIdleV1_.apply(null,arguments);}
      function pageDaycareIdleV1_(){return window.__SOREAL_IDLE_DAYCARE_PAGE_V1__.pageDaycareIdleV1_.apply(null,arguments);}
      function pageCardsIdleV1_(){return window.__SOREAL_IDLE_CARDS_PAGE_V1__.pageCardsIdleV1_.apply(null,arguments);}

      /* pages Augmentations, Machine temporelle, Magie du sang (pont) et Entraînement avancé, avec leur allocation rapide : rendu dans modules/augmentations-page-v1.js (découpage du monolithe, 2026-10-16). */
      function pageAugmentationsIdleV48_(){return window.__SOREAL_IDLE_AUGMENTATIONS_PAGE_V1__.pageAugmentationsIdleV48_.apply(null,arguments);}
      function pageTimeMachineIdleV48_(){return window.__SOREAL_IDLE_AUGMENTATIONS_PAGE_V1__.pageTimeMachineIdleV48_.apply(null,arguments);}
      function exclamationOrIdleV1_(){return window.__SOREAL_IDLE_AUGMENTATIONS_PAGE_V1__.exclamationOrIdleV1_.apply(null,arguments);}
      function pageBloodMagicIdleV48_(){return window.__SOREAL_IDLE_AUGMENTATIONS_PAGE_V1__.pageBloodMagicIdleV48_.apply(null,arguments);}
      function emojiNomIdleV1_(){return window.__SOREAL_IDLE_AUGMENTATIONS_PAGE_V1__.emojiNomIdleV1_.apply(null,arguments);}
      function pageAdvancedTrainingIdleV1_(){return window.__SOREAL_IDLE_AUGMENTATIONS_PAGE_V1__.pageAdvancedTrainingIdleV1_.apply(null,arguments);}







































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
        /* Yggdrasil : page « elfique » rendue par modules/yggdrasil-elfes-v1.js (2026-10-06) ; l'ancienne liste reste en secours. */
        if(id==='yggdrasil'&&window.__SOREAL_IDLE_YGG_V1__){const py=window.__SOREAL_IDLE_YGG_V1__.page(j);if(py)return py;}
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
              :'Métaprogression SOREAL NGU IDLE.'
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
    collecterSystemeMetaIdleV130_:collecterSystemeMetaIdleV130_,
    pageSpendExpIdleV1_:pageSpendExpIdleV1_,
    boutiqueCssIdleV1_:idleBoutiqueCssIdleV1_
  };
  /* Aides partagées avec les pages extraites (modules/*-page-v1.js) : lues à l'exécution seulement. */
  window.__SOREAL_IDLE_META_PARTAGE_V130__={
    systemeMetaParIdIdleV130_:systemeMetaParIdIdleV130_,
    libelleRessourceMetaIdleV130_:libelleRessourceMetaIdleV130_,
    dureeLongueNguIdleV1_:dureeLongueNguIdleV1_,
    capRessourceMetaIdleV1_:capRessourceMetaIdleV1_,
    actionMetaIdleV130_:actionMetaIdleV130_,
    emojiNomIdleV1_:emojiNomIdleV1_,
    toggleSystemeMetaIdleV130_:toggleSystemeMetaIdleV130_,
    actionMetaNoyauIdleV130_:actionMetaNoyauIdleV130_,
    allocationMaxMetaIdleV48_:allocationMaxMetaIdleV48_,
    /*PARTAGE*/
  };
})();
