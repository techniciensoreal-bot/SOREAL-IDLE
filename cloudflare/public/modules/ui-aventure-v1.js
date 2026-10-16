/*
 * SOREAL IDLE — Aventure (zones, combat d'aventure, équipement) (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_aventure_v1)return;
  REG.__chargé_ui_aventure_v1=true;

  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function aventureMetaIdleV47_(){return REG.aventureMetaIdleV47_.apply(null,arguments);}
  function catalogueSetsCollectionIdleV164_(){return REG.catalogueSetsCollectionIdleV164_.apply(null,arguments);}
  function jouerEffetAudioIdleV199_(){return REG.jouerEffetAudioIdleV199_.apply(null,arguments);}
  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function idleNombre_(){return REG.idleNombre_.apply(null,arguments);}
  function heureServeurIdleV1_(){return REG.heureServeurIdleV1_.apply(null,arguments);}
  function arreterCombatAutoIdleV30_(){return REG.arreterCombatAutoIdleV30_.apply(null,arguments);}
  function journalCombatEstEnBasV70_(){return REG.journalCombatEstEnBasV70_.apply(null,arguments);}
  function cloneInventaireIdleV160_(){return REG.cloneInventaireIdleV160_.apply(null,arguments);}
  function pousserEtatVersRuntimePartageIdleV1_(){return REG.pousserEtatVersRuntimePartageIdleV1_.apply(null,arguments);}
  function marquePerfInventaireIdleV160_(){return REG.marquePerfInventaireIdleV160_.apply(null,arguments);}
  function patchResumeInventaireIdleV160_(){return REG.patchResumeInventaireIdleV160_.apply(null,arguments);}
  function patchGrilleSacInventaireIdleV160_(){return REG.patchGrilleSacInventaireIdleV160_.apply(null,arguments);}
  function patchEquipementInventaireIdleV160_(){return REG.patchEquipementInventaireIdleV160_.apply(null,arguments);}
  function patchCoffreInventaireIdleV160_(){return REG.patchCoffreInventaireIdleV160_.apply(null,arguments);}
  function patchBonusInventaireIdleV160_(){return REG.patchBonusInventaireIdleV160_.apply(null,arguments);}
  function restaurerFicheInventaireIdleV160_(){return REG.restaurerFicheInventaireIdleV160_.apply(null,arguments);}
  function appliquerMutationOptimisteInventaireIdleV160_(){return REG.appliquerMutationOptimisteInventaireIdleV160_.apply(null,arguments);}
  function recalculerUtilisationInventaireIdleV160_(){return REG.recalculerUtilisationInventaireIdleV160_.apply(null,arguments);}
  function equipementBloqueParDefiIdleV1_(){return REG.equipementBloqueParDefiIdleV1_.apply(null,arguments);}
  function refuserEquipementDefiIdleV1_(){return REG.refuserEquipementDefiIdleV1_.apply(null,arguments);}
  function enfilerMutationInventaireIdleV160_(){return REG.enfilerMutationInventaireIdleV160_.apply(null,arguments);}
  function actionMetaIdleV130_(){return REG.actionMetaIdleV130_.apply(null,arguments);}
  function metaOccupeIdleV130_(){return REG.metaOccupeIdleV130_.apply(null,arguments);}
  function basicTrainingIdleV120_(){return REG.basicTrainingIdleV120_.apply(null,arguments);}
  function systemeMetaParIdIdleV130_(){return REG.systemeMetaParIdIdleV130_.apply(null,arguments);}
  function titanJoueurParalyseIdleV1_(){return REG.titanJoueurParalyseIdleV1_.apply(null,arguments);}
  function fxIdleV1_(){return REG.fxIdleV1_.apply(null,arguments);}
  function titanMultDegatsJoueurIdleV1_(){return REG.titanMultDegatsJoueurIdleV1_.apply(null,arguments);}
  function urlMobR2IdleV1_(){return REG.urlMobR2IdleV1_.apply(null,arguments);}
  function memoriserRestPvIdleV1_(){return REG.memoriserRestPvIdleV1_.apply(null,arguments);}
  function restPvInitialIdleV1_(){return REG.restPvInitialIdleV1_.apply(null,arguments);}
  function aventureDebloqueeIdleV47_(){return REG.aventureDebloqueeIdleV47_.apply(null,arguments);}
  function formatGrandNombreIdleV70_(){return REG.formatGrandNombreIdleV70_.apply(null,arguments);}
  function pageInventaireIdleV28_(){return REG.pageInventaireIdleV28_.apply(null,arguments);}
  function signatureObjetInventaireIdleV160_(){return REG.signatureObjetInventaireIdleV160_.apply(null,arguments);}
  function pagerSacIdleV1_(){return REG.pagerSacIdleV1_.apply(null,arguments);}
  function toastIdleV5_(){return REG.toastIdleV5_.apply(null,arguments);}
  function gestesAchetesIdleV1_(){return REG.gestesAchetesIdleV1_.apply(null,arguments);}
  function messageFlottantIdleV32_(){return REG.messageFlottantIdleV32_.apply(null,arguments);}
  function utiliserObjetDeblocageIdleV1_(){return REG.utiliserObjetDeblocageIdleV1_.apply(null,arguments);}
  function specialAcceptePlusDeBoostIdleV1_(){return REG.specialAcceptePlusDeBoostIdleV1_.apply(null,arguments);}
  function idleLabelSpecialBonusV1_(){return REG.idleLabelSpecialBonusV1_.apply(null,arguments);}
  function composerCorpsComparaisonIdleV1_(){return REG.composerCorpsComparaisonIdleV1_.apply(null,arguments);}
  function poserFenetreComparaisonIdleV1_(){return REG.poserFenetreComparaisonIdleV1_.apply(null,arguments);}
  function idleCoffreOuvertV1_(){return REG.idleCoffreOuvertV1_.apply(null,arguments);}
  function normaliserRechercheIdleV1_(){return REG.normaliserRechercheIdleV1_.apply(null,arguments);}
  function caseCoffreCorrespondIdleV1_(){return REG.caseCoffreCorrespondIdleV1_.apply(null,arguments);}
  function enregistrerObjetPopupIdleV1_(){return REG.enregistrerObjetPopupIdleV1_.apply(null,arguments);}
  function rendrePaginationIdleV1_(){return REG.rendrePaginationIdleV1_.apply(null,arguments);}
  function jouerSonOuvertureCoffreIdleV1_(){return REG.jouerSonOuvertureCoffreIdleV1_.apply(null,arguments);}
  function jouerSonFermetureCoffreIdleV197_(){return REG.jouerSonFermetureCoffreIdleV197_.apply(null,arguments);}
  function rafraichirMenuRacineIdleV28_(){return REG.rafraichirMenuRacineIdleV28_.apply(null,arguments);}

      /*
       * Note de combat de l'Aventure (« Prochain combat dans 3 s… ») : le texte change chaque seconde ; la note est maintenant ÉCRITE EN PLACE (textContent) au lieu d'être remplacée en entier (outerHTML) à chaque
       * changement : un nœud de moins retiré et recréé par seconde (audit de la page Aventure, Norman 2026-10-10). Seul le bouton « Combattre » du départ est encore remplacé, une fois.
       */
      function poserNoteCombatAdventureIdleV1_(el,texte){
        if(!el)return;
        if(el.classList&&el.classList.contains('soreal-idle-adventure-fight-note-v1')){
          if(el.textContent!==texte)el.textContent=texte;
          return;
        }
        el.outerHTML='<div class="soreal-idle-adventure-fight-note-v1">'+idleHtml_(texte)+'</div>';
      }

      /*
       * Annonces en fondu (2026-09-26, Norman) : set complété (« est-ce qu'on a bien les récompenses ? ») et Tutorial Cube devenu Infinity Cube
       * (« les gens ne vont pas comprendre ce qu'il s'est passé »). On compare l'état de l'Aventure à chaque seconde ; le premier état observé sert
       * de référence (rien n'est annoncé au chargement pour ce qui était déjà acquis).
       */
      let idleEvenementsVusV1=null;

      function surveillerEvenementsAventureIdleV1_(){
        const a=REG.idleEtat?aventureMetaIdleV47_(REG.idleEtat):null;
        if(!a||typeof a!=='object')return;
        const complets=a.completedSets&&typeof a.completedSets==='object'?Object.keys(a.completedSets).filter(function(k){return a.completedSets[k];}):[];
        const cube=Boolean(a.cube&&a.cube.unlocked);
        if(idleEvenementsVusV1===null){
          idleEvenementsVusV1={sets:new Set(complets),cube:cube};
          return;
        }
        const notice=window.__sorealFadeNoticeV1__;
        complets.forEach(function(setId){
          if(idleEvenementsVusV1.sets.has(setId))return;
          idleEvenementsVusV1.sets.add(setId);
          if(typeof notice!=='function')return;
          let def=null;
          try{def=catalogueSetsCollectionIdleV164_(a)[setId]||null;}catch(_e){}
          const libelle=def&&def.reward?libelleRecompenseSetAdventureIdleV163_(def.reward):'';
          /* Norman (2026-09-27) : « je veux un son de victoire en même temps que la notification fade in fade out apparait. » */
          jouerEffetAudioIdleV199_('setComplete');
          notice('🧩 Set complété : '+String((def&&def.name)||setId),[libelle?'Bonus obtenu : '+libelle:'Bonus du set obtenu !']);
        });
        if(cube&&!idleEvenementsVusV1.cube){
          idleEvenementsVusV1.cube=true;
          if(typeof notice==='function'){
            notice('🧊 Infinity Cube débloqué !',[
              'Ton Tutorial Cube a atteint le niveau 100 : il s’est transformé en Infinity Cube.',
              'Il prend place à côté de ton arme. Glisse-y tes boosts : ils sont convertis en Power et Toughness, sans limite.'
            ],{dureeMs:7000});
          }
        }else if(!cube){
          idleEvenementsVusV1.cube=false;
        }
      }

      function zoneAventureLocaleIdleV30_(
        zoneId
      ){
        const zones=
          REG.idleEtat &&
          REG.idleEtat.aventure &&
          Array.isArray(
            REG.idleEtat.aventure.zones
          )
            ?REG.idleEtat.aventure.zones
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

      function cooldownAventureRestantIdleV100_(){
        const fin=
          REG.idleEtat&&
          REG.idleEtat.aventure
            ?Math.max(
                0,
                idleNombre_(
                  REG.idleEtat.aventure.cooldownJusqua
                )
              )
            :0;

        return Math.max(
          0,
          (
            fin-
            heureServeurIdleV1_()
          )/
          1000
        );
      }

      function actualiserCooldownAventureIdleV100_(
        maintenant
      ){
        if(
          !REG.idleEtat ||
          !REG.idleEtat.aventure
        ){
          return;
        }

        const fin=
          Math.max(
            0,
            idleNombre_(
              REG.idleEtat.aventure.cooldownJusqua
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
          REG.idleEtat.aventure&&
          Array.isArray(
            REG.idleEtat.aventure.zones
          )
            ?REG.idleEtat.aventure.zones
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
                REG.idleAventureEnCoursV17 ||
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
        REG.idleReserveAventureV23=0;

        arreterCombatAutoIdleV30_(
          '🤖 Combat automatique désactivé : ancienne mécanique retirée.'
        );
      }

      /* Pose tout de suite la classe rouge clignotante sur le bouton Adventure (sans attendre le prochain rendu du menu) quand on est mis K.O. hors du menu Adventure. */
      function marquerBoutonAventureKoIdleV1_(){
        if(REG.idleMenuActifV28==='aventure')return;
        try{
          const bouton=document.querySelector('.soreal-idle-nav-button-v28[data-menu-id-v1="aventure"]');
          if(bouton)bouton.classList.add('soreal-idle-nav-adventure-ko-v1');
        }catch(e){}
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-139 */
      let idleAdventureLogV1=[];

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-140 */
      let idleAdventureLogAutoScrollV1_=true;

      let idleAdventureLogScrollMemoV1_=0;

      let idleAdventureLogResumeTimerV1_=null;

      const IDLE_ADVENTURE_LOG_RESUME_MS_V1=6000;

      /*
       * critique (2026-09-27, Norman : « Quand on met ou recoit un coup critique ») : suffixe
       * visuel distinct sur la ligne de dégâts, jamais un type à part -- la ligne garde sa
       * couleur habituelle (manual/player/enemy), seul "💥 Coup critique !" accroche l'œil.
       */
      function ajouterLogAventureIdleV1_(type,texte,rareteClasse,critique){
        const classe=String(rareteClasse||'');
        idleAdventureLogV1.push({
          type:String(type||'system'),
          texte:String(texte||''),
          rareteClasse:/^idle-loot-rarity-[0-6]$/.test(classe)?classe:'',
          critique:Boolean(critique)
        });
        if(idleAdventureLogV1.length>80){
          idleAdventureLogV1.splice(0,idleAdventureLogV1.length-80);
        }
        dessinerJournalAventureIdleV1_();
      }

      /*
       * Norman (2026-09-27) : « Parfois, je meurs en mode aventure et dans le journal de combat, ma mort
       * n'apparaît pas. » Cause : une mort par combat automatique (en ligne ou hors ligne) se résout entièrement
       * côté serveur, jamais via terminerCombatAdventureLocalV2_ (le seul autre endroit qui alimente le journal).
       * j.autoAventureHorsLigne (combats/victoires/defaites) est le delta calculé PAR CE SYNC UNIQUEMENT (jamais
       * cumulatif) -- on ne le traite donc qu'une fois par réponse serveur réellement nouvelle (serveurTs change à
       * chaque appel), pour ne jamais logger deux fois le même lot en cas de nouveaux rendus sans nouvelle synchro.
       */
      let idleDerniereSyncAutoDefaiteAventureV1_=0;

      function verifierDefaiteAutoAventureIdleV1_(j){
        const ts=idleNombre_(j&&j.serveurTs);
        if(!ts||ts===idleDerniereSyncAutoDefaiteAventureV1_)return;
        idleDerniereSyncAutoDefaiteAventureV1_=ts;
        const infos=j&&j.autoAventureHorsLigne;
        const defaites=Math.max(0,idleEntier_(infos&&infos.defaites));
        if(defaites<=0)return;
        /*
         * Norman (2026-09-29) : « il devra pouvoir lire dans le journal de combat la manière dont il est mort. »
         * derniereDefaite (monstre/zone/ko de la défaite qui a arrêté le farm) précise le récit générique
         * ci-dessous quand le serveur le fournit ; sinon (anciens clients, ou champ manquant) le message
         * générique reste identique au comportement historique.
         */
        const d=infos&&infos.derniereDefaite;
        const cible=d?[d.monstre,d.zone].filter(Boolean).join(' · '):'';
        if(cible){
          const suffixe=defaites>1?' ('+defaites+' défaites au total pendant ton absence)':'';
          ajouterLogAventureIdleV1_(
            'enemy',
            (d.ko
              ?'💀 Tu as été mis K.O. par '+cible+' pendant ton absence.'
              :'⏱️ Le combat contre '+cible+' a traîné trop longtemps pendant ton absence : le farm automatique s’est arrêté.')+
              suffixe
          );
          return;
        }
        ajouterLogAventureIdleV1_(
          'enemy',
          defaites>1
            ?'⚔️ Combat automatique : tu as été mis K.O. '+defaites+' fois pendant ton absence.'
            :'⚔️ Combat automatique : tu as été mis K.O. pendant ton absence.'
        );
      }

      /* Rendu d'une ligne, partagé entre le journal live (dessinerJournalAventureIdleV1_) et le rendu complet de la page Aventure (même markup dupliqué avant ce correctif). */
      function rendreLigneJournalAventureIdleV1_(l){
        const suffixeCritique=l.critique?' <span class="soreal-idle-adventure-log-crit-v1">💥 Coup critique !</span>':'';
        return '<div class="soreal-idle-adventure-log-line-v1 '+idleHtml_(l.type)+(l.rareteClasse?' '+idleHtml_(l.rareteClasse):'')+'">'+idleHtml_(l.texte)+suffixeCritique+'</div>';
      }

      function dessinerJournalAventureIdleV1_(){
        const host=document.getElementById('sorealIdleAdventureLogV1');
        if(!host)return;
        attacherEcouteurScrollJournalAventureIdleV1_(host);
        /*
         * Journal incrémental (audit de la page Aventure, Norman 2026-10-10) : avant, chaque nouvelle ligne faisait REDESSINER les 80 lignes (innerHTML) ; on ne retire maintenant que les lignes sorties du journal et on
         * n'ajoute que les nouvelles. Si le contenu de l'élément ne correspond plus à ce qui a été dessiné (page redessinée), on repart d'un dessin complet.
         */
        if(!idleAdventureLogV1.length){
          host.__htmlLignesV1=null;
          host.innerHTML='<div class="soreal-idle-adventure-log-line-v1 system">Le journal commencera au prochain combat.</div>';
        }else{
          const nouvelles=idleAdventureLogV1.map(rendreLigneJournalAventureIdleV1_);
          const anciennes=host.__htmlLignesV1;
          let fait=false;
          if(Array.isArray(anciennes)&&anciennes.length&&host.children.length===anciennes.length){
            const n=anciennes.length;
            let k=0;
            for(;k<n;k+=1){
              let ok=true;
              for(let i=0;i<n-k;i+=1){if(i>=nouvelles.length||anciennes[k+i]!==nouvelles[i]){ok=false;break;}}
              if(ok)break;
            }
            if(k<n){
              for(let i=0;i<k;i+=1)host.removeChild(host.firstChild);
              for(let i=n-k;i<nouvelles.length;i+=1)host.insertAdjacentHTML('beforeend',nouvelles[i]);
              fait=true;
            }
          }
          if(!fait)host.innerHTML=nouvelles.join('');
          host.__htmlLignesV1=nouvelles;
        }
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

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-178 */
      const IDLE_INVENTORY_ACTIONS_V160=new Set([
        'equip','unequip','merge','boost','cube','discard','setLock',
        'trashPut','trashRecover','coffreDeposer','coffreRetirer','reorderInventory'
      ]);

      let idleInventoryDeferredPatchV160=false;

      let idleAdventureSnapshotDiffereV208=null;

      const IDLE_ADVENTURE_INVENTORY_FIELDS_V208=[
        'inventory','inventorySlots','equipment','itemList',
        'completedSets','setRewards','permanent','unlockItems','unlockFlags',
        'skillState','cube','cubeTier','inventoryCapacity','inventoryUsed',
        'accessorySlotsCapacity','stats','trash','coffreSlots','secondWeaponUnlocked','dualWieldRatio','theEnd'
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

      function appliquerAdventureDiffereeIdleV208_(){
        if(
          REG.idleInventoryBusyV160||
          REG.idleInventoryMutationQueueV160.length||
          !idleAdventureSnapshotDiffereV208||
          !REG.idleEtat
        ){
          return false;
        }

        const differee=idleAdventureSnapshotDiffereV208;
        idleAdventureSnapshotDiffereV208=null;

        const revisionDifferee=
          revisionAdventureServeurIdleV208_(differee);
        const revisionConfirmee=
          revisionAdventureServeurIdleV208_(
            REG.idleInventoryConfirmedAdventureV160
          );

        if(revisionDifferee<=revisionConfirmee){
          return false;
        }

        const courant=aventureMetaIdleV47_(REG.idleEtat);
        const fightLocal=
          courant&&courant.fight&&courant.fight.active
            ?cloneInventaireIdleV160_(courant.fight)
            :null;
        const prochain=cloneInventaireIdleV160_(differee);
        if(fightLocal)prochain.fight=fightLocal;

        REG.idleEtat.systemes=Object.assign({},REG.idleEtat.systemes||{});
        REG.idleEtat.systemes.adventure=prochain;
        REG.idleInventoryConfirmedAdventureV160=
          cloneInventaireIdleV160_(differee);
        REG.idleAdventureRevisionServeurV208=Math.max(
          REG.idleAdventureRevisionServeurV208,
          revisionDifferee
        );

        pousserEtatVersRuntimePartageIdleV1_();
        patchInventaireAdventureIdleV160_(
          REG.idleEtat,
          {action:'reconcile-v208',confirmed:true}
        );
        return true;
      }

      function estMutationInventaireAdventureIdleV160_(payload){
        return Boolean(
          payload&&
          IDLE_INVENTORY_ACTIONS_V160.has(String(payload.action||''))
        );
      }

      function casesSacAdventureIdleV162_(a){
        if(!a)return [];
        const items=Array.isArray(a.inventory)?a.inventory:[];
        const equipment=a.equipment||{};
        const itemById=new Map(items.map(function(item){
          return [String(item&&item.id||''),item];
        }));
        const equipes=new Set();
        REG.ADVENTURE_CORE_SLOTS_V138.forEach(function(slot){
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
          accessorySlotsCapacity:idleEntier_(a.accessorySlotsCapacity||2),
          secondWeaponUnlocked:Boolean(a.secondWeaponUnlocked),
          theEnd:a.theEnd
        };
      }

      function patchInventaireAdventureIdleV160_(j,options){
        if(
          REG.idleMenuActifV28!=='aventure'||
          !j||
          !aventureMetaIdleV47_(j)
        ){
          return false;
        }

        if(REG.idleAdventureDragIdV138){
          idleInventoryDeferredPatchV160=true;
          return false;
        }

        const opt=options||{};
        const action=String(opt.action||'');
        /* audit 2026-10-13 : un patch différé (après un glisser-déposer) ou une réconciliation ne sait pas quelle action a été manquée : on remet alors à jour équipement, coffre et bonus, pas seulement la grille du sac */
        const patchToutV1=action==='deferred'||action==='reconcile-v208';
        const marqueId=opt.transactionId||REG.idleInventorySequenceV160||0;
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
          /* Remplacée seulement si elle diffère : sinon l'icône de la corbeille était recréée à chaque mise à jour (clignotement de l'inventaire). */
          if(trashSuivantV165&&!trashActuelV165.isEqualNode(trashSuivantV165))trashActuelV165.replaceWith(trashSuivantV165);
        }

        if(
          patchToutV1||['equip','unequip','merge','boost','cube','setLock'].indexOf(action)!==-1
        ){
          patchEquipementInventaireIdleV160_(modele);
        }

        if(
          patchToutV1||
          action==='coffreDeposer'||
          action==='coffreRetirer'
        ){
          patchCoffreInventaireIdleV160_(modele);
        }

        if(
          patchToutV1||(opt.confirmed&&
          ['equip','unequip','merge','boost','cube'].indexOf(action)!==-1)
        ){
          patchBonusInventaireIdleV160_(modele);
        }

        restaurerFicheInventaireIdleV160_(modele);
        REG.idleInventoryPerfV160.patches+=1;
        REG.idleInventoryPerfV160.globalRendersAvoided+=1;
        marquePerfInventaireIdleV160_('patch-end',marqueId);
        return true;
      }

      function remplacerAdventureInventaireIdleV160_(base){
        if(!REG.idleEtat||!base)return;
        const courant=aventureMetaIdleV47_(REG.idleEtat);
        const fightLocal=courant&&courant.fight&&courant.fight.active
          ?courant.fight
          :null;

        REG.idleEtat.systemes=Object.assign({},REG.idleEtat.systemes||{});
        REG.idleEtat.systemes.adventure=Object.assign(
          {},
          cloneInventaireIdleV160_(base),
          fightLocal?{fight:fightLocal}:{}
        );

        REG.idleInventoryMutationQueueV160.forEach(function(tx){
          appliquerMutationOptimisteInventaireIdleV160_(
            REG.idleEtat.systemes.adventure,
            tx.payload,
            tx.id
          );
        });
        recalculerUtilisationInventaireIdleV160_(
          REG.idleEtat.systemes.adventure
        );
      }

      function actionAdventureIdleV47_(payload){
        const action=payload||{};
        if(action.action==='equip'&&equipementBloqueParDefiIdleV1_()){
          refuserEquipementDefiIdleV1_();
          return;
        }
        if(estMutationInventaireAdventureIdleV160_(action)){
          enfilerMutationInventaireIdleV160_(action);
          return;
        }
        actionMetaIdleV130_({
          action:'adventure',
          adventure:action
        });
      }

      /*
       * Choix de zone FIABLE (2026-09-26, Norman : « la flèche droite / gauche n'interrompt pas le combat ; le nom de la zone change mais on
       * continue de combattre dans l'ancienne »). actionMetaIdleV130_ ABANDONNE en silence toute action envoyée pendant qu'une autre est en cours
       * (le combat en envoie en continu) : le nom choisi s'affichait (état local) mais le serveur ne changeait jamais de zone. Le choix est donc
       * mémorisé et renvoyé tant que le canal est occupé (le dernier choix l'emporte), pour les flèches comme pour le menu déroulant.
       */
      let idleZoneCibleEnAttenteV1='';

      let idleZoneTimerV1=0;

      let idleZoneEssaisV1=0;

      function envoyerChoixZoneFiableIdleV1_(){
        clearTimeout(idleZoneTimerV1);
        idleZoneTimerV1=0;
        if(!idleZoneCibleEnAttenteV1)return;
        const api=window.__SOREAL_IDLE_META_V130__;
        if(api&&typeof api.estOccupeIdleV130_==='function'&&api.estOccupeIdleV130_()&&idleZoneEssaisV1<80){
          idleZoneEssaisV1+=1;
          idleZoneTimerV1=setTimeout(envoyerChoixZoneFiableIdleV1_,120);
          return;
        }
        const cible=idleZoneCibleEnAttenteV1;
        idleZoneCibleEnAttenteV1='';
        actionAdventureIdleV47_({action:'selectZone',zone:cible});
      }

      function selectionnerZoneAdventureIdleV47_(id){
        const cible=String(id||'safe');
        const a=aventureMetaIdleV47_(REG.idleEtat);
        if(a){
          /*
           * Changer de zone interrompt le combat en cours : le serveur le vide, mais la synchronisation client garde le combat LOCAL tant qu'il est
           * actif (appliquerSynchroCombatSansReflowIdleV116_) — la zone affichée changeait, le combat continuait dans l'ancienne. On l'arrête ici.
           */
          /* Un combat de TITAN se livre en Zone sûre : choisir une zone, Zone sûre comprise, l'arrête (Norman, 2026-10-12). */
          if(a.fight&&a.fight.active&&(String(a.fight.zone||'')!==cible||a.fight.titanId)){
            a.fight={active:false,zone:'',monsterHp:0,monsterHpMax:0,boss:false,playerHp:0,playerHpMax:0};
          }
          a.selectedZone=cible;
          patchZoneAdventureSansReflowIdleV1_(REG.idleEtat);
          pousserEtatVersRuntimePartageIdleV1_();
        }
        idleZoneCibleEnAttenteV1=cible;
        idleZoneEssaisV1=0;
        envoyerChoixZoneFiableIdleV1_();
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-187 */
      function patchZoneAdventureSansReflowIdleV1_(j){
        if(REG.idleMenuActifV28!=='aventure')return;
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
        if(!REG.idleEtat)return;
        const a=aventureMetaIdleV47_(REG.idleEtat);
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

      function titanCompetenceDesactiveeIdleV1_(competence){
        const api=window.SorealTitanComportementsV1;
        return Boolean(api&&REG.idleTitanEtatV1&&api.competenceDesactivee(REG.idleTitanEtatV1.id,REG.idleTitanEtatV1,competence));
      }

      /* Identité du combat de titan terminé (id + heure de départ) : jointe à la résolution pour que le serveur la rattache au bon combat. */
      let idleAdventureResolutionIdentiteV2={titanId:'',titanStartedAt:0};

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
          (1-respawnReductionAdventureIdleV1_(REG.idleEtat))
        );
      }

      function texteProchainCombatAdventureIdleV165_(){
        const restantMs=REG.idleAdventureRespawnAtV1
          ?Math.max(0,REG.idleAdventureRespawnAtV1-Date.now())
          :dureeRespawnAdventureIdleV165_();
        const secondes=Math.max(0,Math.ceil(restantMs/1000));
        return '⏳ Prochain combat dans '+secondes+' seconde'+(secondes>1?'s':'');
      }

      function annulerRespawnAdventureIdleV165_(){
        if(REG.idleAdventureRespawnTimerV165){
          clearTimeout(REG.idleAdventureRespawnTimerV165);
          REG.idleAdventureRespawnTimerV165=0;
        }
        REG.idleAdventureRespawnAtV1=0;
        REG.idleAdventureRespawnStartPendingV165=false;
        idleAdventureRespawnZoneV165='';
      }

      function programmerRespawnAdventureIdleV165_(departMs){
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const zone=String((a&&a.selectedZone)||'safe');
        if(!a||zone==='safe'){
          annulerRespawnAdventureIdleV165_();
          return;
        }
        const depart=Math.max(0,idleNombre_(departMs)||Date.now());
        REG.idleAdventureRespawnAtV1=depart+dureeRespawnAdventureIdleV165_();
        idleAdventureRespawnZoneV165=zone;
        REG.idleAdventureRespawnStartPendingV165=false;
        if(REG.idleAdventureRespawnTimerV165)clearTimeout(REG.idleAdventureRespawnTimerV165);

        const tenter=function(){
          const courant=aventureMetaIdleV47_(REG.idleEtat);
          const zoneCourante=String((courant&&courant.selectedZone)||'safe');
          if(
            !courant||
            zoneCourante==='safe'||
            zoneCourante!==idleAdventureRespawnZoneV165
          ){
            annulerRespawnAdventureIdleV165_();
            return;
          }
          const restant=REG.idleAdventureRespawnAtV1-Date.now();
          if(restant>1){
            REG.idleAdventureRespawnTimerV165=setTimeout(tenter,restant);
            return;
          }
          if(REG.idleAdventureResolutionPendingV2||metaOccupeIdleV130_()){
            REG.idleAdventureRespawnTimerV165=setTimeout(tenter,16);
            return;
          }
          REG.idleAdventureRespawnTimerV165=0;
          REG.idleAdventureRespawnStartPendingV165=true;
          REG.idleAdventureRespawnAtV1=0;
          actionAdventureIdleV47_({
            action:'startZoneFight',
            restHp:REG.idleEtat&&REG.idleEtat.adventureRestPv
          });
        };

        REG.idleAdventureRespawnTimerV165=setTimeout(
          tenter,
          Math.max(0,REG.idleAdventureRespawnAtV1-Date.now())
        );
      }

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
        const wishes=systemeMetaParIdIdleV130_(REG.idleEtat,'wishes');
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
              REG.idleEtat&&REG.idleEtat.systemes&&
              REG.idleEtat.systemes.challenge&&
              REG.idleEtat.systemes.challenge.completions&&
              REG.idleEtat.systemes.challenge.completions.basic
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
        if(REG.IDLE_ADVENTURE_MANUAL_ATTACKS_V3.indexOf(def)>=0)return'attack';
        if(REG.IDLE_ADVENTURE_MANUAL_DEFENSE_V3.indexOf(def)>=0)return'defense';
        return'advanced';
      }

      function competenceAdventureDisponibleIdleV4_(def,group,a){
        if(!def)return false;
        return group==='advanced'
          ?competenceAdventureAvanceeDebloqueeIdleV4_(def.id,a)
          :competenceAdventureDebloqueeIdleV3_(def,group);
      }

      function definitionCompetenceAdventureIdleV3_(id){
        return REG.IDLE_ADVENTURE_MANUAL_ATTACKS_V3
          .concat(REG.IDLE_ADVENTURE_MANUAL_DEFENSE_V3)
          .concat(REG.IDLE_ADVENTURE_ADVANCED_SKILLS_V4)
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
        if(REG.idleAdventureManualStateV3.offensiveBuffUntil>maintenant)mult*=1.2;
        if(REG.idleAdventureManualStateV3.ultimateBuffUntil>maintenant)mult*=1.3;
        if(REG.idleAdventureManualStateV3.megaBuffUntil>maintenant)mult*=1.2;
        mult*=multiplicateurBeastPowerAdventureIdleV4_(a);
        return mult;
      }

      function multiplicateurToughnessManuelAdventureIdleV3_(maintenant){
        let mult=1;
        if(REG.idleAdventureManualStateV3.defensiveBuffUntil>maintenant)mult*=1.2;
        if(REG.idleAdventureManualStateV3.ultimateBuffUntil>maintenant)mult*=1.3;
        if(REG.idleAdventureManualStateV3.megaBuffUntil>maintenant)mult*=1.2;
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
        /* Wiki « Red Liquid (set) » : le -20 % porte sur le « global cooldown timer » (délai entre deux moves différents) et la vitesse d'Idle Attack, PAS sur le cooldown propre de chaque move. Le délai global est simulé à part (appliquerDelaiGlobalAdventureIdleV1_) : 1 s, 0,8 s avec ce set. */
        const equipement=Math.max(0,Math.min(95,idleNombre_(a&&a.stats&&a.stats.specials&&a.stats.specials.moveCooldownPct)));
        return base*(1-equipement/100);
      }

      /*
       * Délai global entre deux actions (Norman, 2026-10-08, vérifié dans le vrai jeu : « dès qu'une action est faite, peu importe laquelle, toutes les autres ont 1 s de CD »).
       * Wiki « Red Liquid (set) » : « -20% on the global cooldown timer [...] the cooldown between using different moves » -> 0,8 s avec ce set (même drapeau que la vitesse d'Idle Attack).
       * Le wiki ne publie pas la durée de base : 1 s, confirmée par Norman dans NGU Idle. N'allonge jamais un délai déjà plus long.
       */
      function appliquerDelaiGlobalAdventureIdleV1_(idUtilise,maintenant,a){
        const fin=maintenant+intervalleIdleAttackAdventureIdleV4_(a);
        REG.IDLE_ADVENTURE_MANUAL_ATTACKS_V3.concat(REG.IDLE_ADVENTURE_MANUAL_DEFENSE_V3,REG.IDLE_ADVENTURE_ADVANCED_SKILLS_V4).forEach(function(d){
          if(d.id===idUtilise)return;
          if(idleNombre_(REG.idleAdventureManualStateV3.cooldownUntil[d.id])<fin)REG.idleAdventureManualStateV3.cooldownUntil[d.id]=fin;
        });
      }

      function cooldownRestantAdventureIdleV3_(id,maintenant){
        return Math.max(
          0,
          idleNombre_(REG.idleAdventureManualStateV3.cooldownUntil[id])-maintenant
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

      /*
       * Audit d'Aventure (Norman, 2026-10-05) : les raccourcis sont actualisés ~15 fois par seconde et réassignaient « disabled », « hidden », « aria-pressed » et les textes à CHAQUE passage, même identiques : ~187
       * modifications de page par seconde au repos, qui relançaient aussi les observateurs de la page. Chaque valeur n'est écrite que si elle change.
       */
      function posteIdleSiChangeV1_(el,propriete,valeur){
        if(el&&el[propriete]!==valeur)el[propriete]=valeur;
      }

      function attributIdleSiChangeV1_(el,nom,valeur){
        if(el&&el.getAttribute(nom)!==valeur)el.setAttribute(nom,valeur);
      }

      function rafraichirCommandesAdventureIdleV3_(maintenant){
        const root=document.getElementById('sorealIdleAdventureManualV3');
        if(!root)return;
        const now=Math.max(0,idleNombre_(maintenant)||Date.now());
        const a=aventureMetaIdleV47_(REG.idleEtat);
        /*
         * Paralysie (Norman, 2026-10-04 : « quand un titan ou un ennemi nous freeze, il faut le voir sur les raccourcis d'attaque, parade etc. : tout devient grisé ou autre chose, sinon on dirait un bug, l'interface qui
         * ne répond plus ») : tous les raccourcis et l'Idle Mode sont grisés, marqués d'un éclair, et un bandeau dit pourquoi et pendant combien de temps.
         */
        const paralyse=titanJoueurParalyseIdleV1_(now);
        root.classList.toggle('paralyse-v1',paralyse);
        /* Norman (2026-10-10) : plus de phrase « Paralysé » au-dessus (elle décalait l'interface) ; seuls les raccourcis jaunes et grisés (classe paralyse-v1) le montrent. */
        root.classList.toggle('manual-active',!REG.idleAdventureIdleModeV3);
        const toggle=root.querySelector('[data-adventure-idle-toggle]');
        if(toggle){
          toggle.classList.toggle('active',REG.idleAdventureIdleModeV3);
          attributIdleSiChangeV1_(toggle,'aria-pressed',REG.idleAdventureIdleModeV3?'true':'false');
          const value=toggle.querySelector('b');
          if(value)posteIdleSiChangeV1_(value,'textContent',REG.idleAdventureIdleModeV3?'ON':'OFF');
          toggle.classList.toggle('paralyse-v1',paralyse);
        }
        root.querySelectorAll('[data-adventure-skill]').forEach(function(btn){
          const id=String(btn.getAttribute('data-adventure-skill')||'');
          const def=definitionCompetenceAdventureIdleV3_(id);
          if(!def)return;
          const group=groupeCompetenceAdventureIdleV4_(def);
          const unlocked=competenceAdventureDisponibleIdleV4_(def,group,a);
          const restant=cooldownRestantAdventureIdleV3_(id,now);
          const prerequisOk=prerequisCompetenceAdventureIdleV4_(id,now);
          const desactivee=titanCompetenceDesactiveeIdleV1_(id);
          posteIdleSiChangeV1_(btn,'disabled',Boolean(REG.idleAdventureIdleModeV3||!unlocked||restant>0||!prerequisOk||desactivee||paralyse));
          btn.classList.toggle('titan-off',desactivee);
          btn.classList.toggle('paralyse-v1',paralyse);
          btn.classList.toggle('locked',!unlocked);
          const cd=btn.querySelector('.soreal-idle-adventure-skill-cd-v3');
          if(cd)posteIdleSiChangeV1_(cd,'textContent',paralyse?'⚡':(restant>0?(restant/1000).toFixed(restant<10000?1:0)+'s':''));
          const label=btn.querySelector('.soreal-idle-adventure-skill-label-v3');
          if(label&&id==='move69'){
            const uses=Math.max(0,idleEntier_(a&&a.skillState&&a.skillState.move69Uses));
            posteIdleSiChangeV1_(label,'textContent','Move 69 · '+uses+'/69');
          }
          let active=false;
          if(id==='block')active=REG.idleAdventureManualStateV3.blockUntil>now;
          else if(id==='defensiveBuff')active=REG.idleAdventureManualStateV3.defensiveBuffUntil>now;
          else if(id==='offensiveBuff')active=REG.idleAdventureManualStateV3.offensiveBuffUntil>now;
          else if(id==='ultimateBuff')active=REG.idleAdventureManualStateV3.ultimateBuffUntil>now;
          else if(id==='megaBuff')active=REG.idleAdventureManualStateV3.megaBuffUntil>now;
          else if(id==='hyperRegen')active=REG.idleAdventureManualStateV3.hyperRegenUntil>now;
          else if(id==='paralyze')active=REG.idleAdventureManualStateV3.enemyParalyzedUntil>now;
          else if(id==='charge')active=REG.idleAdventureManualStateV3.charge;
          else if(id==='parry')active=REG.idleAdventureManualStateV3.parryArmed;
          else if(id==='beastMode')active=beastModeActifAdventureIdleV4_(a);
          btn.classList.toggle('effect-active',active);
        });
      }

      function basculerIdleModeAdventureIdleV3_(){
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const fight=a&&a.fight;
        const maintenant=Date.now();
        if(fight&&fight.active){
          appliquerRegenCombatAdventureIdleV2_(a,fight,maintenant);
        }
        REG.idleAdventureIdleModeV3=!REG.idleAdventureIdleModeV3;
        try{
          localStorage.setItem(
            'sorealIdleAdventureIdleModeV3',
            REG.idleAdventureIdleModeV3?'1':'0'
          );
        }catch(e){}
        if(REG.idleAdventureIdleModeV3){
          REG.idleAdventureFightNextPlayerHitV2=
            maintenant+intervalleIdleAttackAdventureIdleV4_(a);
        }
        rafraichirCommandesAdventureIdleV3_(maintenant);
      }

      /*
       * Journal de combat, mode manuel (2026-09-27, Norman : « Quand je passe en mode manuel, je
       * ne vois pas l'indication de mes attaques dans le journal de combat. Je veux une phrase en
       * verte. "Redrum lance soin" avec explications. ») : def optionnel (le skill qui a déclenché
       * le soin -- « heal » ou « ohShit ») pour nommer l'action comme les lignes d'attaque le font déjà.
       */
      function appliquerHealAdventureIdleV4_(a,fight,def){
        const max=Math.max(0,idleNombre_(fight&&fight.playerHpMax));
        if(fight&&fight.active&&max>0){
          const avant=idleNombre_(fight.playerHp);
          fight.playerHp=Math.min(
            max,
            avant+max*.15
          );
          const soigne=Math.round(fight.playerHp-avant);
          REG.idleFxSoinJusqua=Math.max(REG.idleFxSoinJusqua,Date.now()+2500);
          if(soigne>0){
            fxIdleV1_('joueur','soin','+'+soigne);
            ajouterLogAventureIdleV1_(
              'manual',
              (REG.idleEtat&&REG.idleEtat.nom||'Vous')+' lance '+(def&&def.label?def.label:'Soin')+' : +'+soigne+' PV !'
            );
          }
          pousserEtatVersRuntimePartageIdleV1_();
          return true;
        }
        return false;
      }

      function appliquerParalyzeAdventureIdleV4_(maintenant){
        REG.idleAdventureManualStateV3.enemyParalyzedUntil=
          Math.max(REG.idleAdventureManualStateV3.enemyParalyzedUntil,maintenant+3000);
      }

      function appliquerHyperRegenAdventureIdleV4_(a,fight,maintenant){
        if(fight&&fight.active){
          appliquerRegenCombatAdventureIdleV2_(a,fight,maintenant);
        }
        REG.idleAdventureManualStateV3.hyperRegenUntil=
          Math.max(REG.idleAdventureManualStateV3.hyperRegenUntil,maintenant+5000);
      }

      function attaqueManuelleAdventureIdleV3_(def,a,fight,maintenant,chargeMemorisee){
        if(!fight||!fight.active)return false;
        let multiplier=Math.max(0,idleNombre_(def&&def.multiplier)||1);
        if(def&&def.id==='ultimate'){
          const bossRecord=Math.max(
            Math.max(0,idleEntier_(REG.idleEtat&&REG.idleEtat.bossVaincus)),
            Math.max(0,idleEntier_(REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.records&&REG.idleEtat.systemes.records.highestBoss))
          );
          const jrpg=Boolean(a&&a.completedSets&&a.completedSets.jrpg);
          multiplier=(jrpg?4:2)+bossRecord*.01;
        }
        /* Wiki Skills : Parry x1 (x3 avec le set Slimy complété). */
        if(def&&def.id==='parry'&&a&&a.completedSets&&a.completedSets.slimy)multiplier=3;
        /* Riposte de Parry : Charge consommée au lancement de la parade, jamais la Charge courante. */
        if(chargeMemorisee>0){
          multiplier*=chargeMemorisee;
        }else if(REG.idleAdventureManualStateV3.charge){
          multiplier*=multiplicateurChargeAdventureIdleV3_(a);
          REG.idleAdventureManualStateV3.charge=false;
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
            multiplier*titanMultDegatsJoueurIdleV1_(fight,maintenant),
            facteurAleatoireDegatsAdventureIdleV2_()
          )
        );
        fight.monsterHp=Math.max(0,avant-degats);
        impactMonstreAdventureIdleV1_();
        fxIdleV1_('mob',titanMultDegatsJoueurIdleV1_(fight,maintenant)===0?'invincible':({strong:'fort',piercing:'perce',ultimate:'ultime'})[def&&def.id]||'coup',idleEntier_(degats));
        /* Mode manuel, en vert -- distinct du bleu 'player' de l'attaque idle automatique (Norman, 2026-09-27). */
        ajouterLogAventureIdleV1_(
          'manual',
          (REG.idleEtat&&REG.idleEtat.nom||'Vous')+' lance '+(def&&def.label?def.label:'Attaque')+' : '+
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
        if(REG.idleAdventureIdleModeV3)return;
        if(titanJoueurParalyseIdleV1_(Date.now()))return;
        if(titanCompetenceDesactiveeIdleV1_(id))return;
        const def=definitionCompetenceAdventureIdleV3_(id);
        if(!def)return;
        const a=aventureMetaIdleV47_(REG.idleEtat);
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

        REG.idleAdventureManualStateV3.cooldownUntil[def.id]=
          maintenant+cooldownDureeAdventureIdleV4_(def,a);
        appliquerDelaiGlobalAdventureIdleV1_(def.id,maintenant,a);
        /* Un son propre à chaque bouton (modules/audio-effects-v199.js : skill_<id>). */
        jouerEffetAudioIdleV199_('skill_'+def.id);

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
            REG.idleAdventureManualStateV3.parryArmed=true;
            REG.idleAdventureManualStateV3.parryChargeMult=1;
            if(REG.idleAdventureManualStateV3.charge){
              REG.idleAdventureManualStateV3.parryChargeMult=multiplicateurChargeAdventureIdleV3_(a);
              REG.idleAdventureManualStateV3.charge=false;
            }
          }else{
            attaqueManuelleAdventureIdleV3_(def,a,fight,maintenant);
          }
        }else if(group==='defense'&&def.id==='block'){
          /* Block Damage Reduction : (Level+50)/(Level+100) d'Advanced Training, exposé par le serveur (audit 2026-09-23). */
          let reduction=(a&&a.stats&&Number.isFinite(Number(a.stats.blockReduction)))?Number(a.stats.blockReduction):.5;
          if(REG.idleAdventureManualStateV3.charge){
            reduction=Math.min(.99,reduction*multiplicateurChargeAdventureIdleV3_(a));
            REG.idleAdventureManualStateV3.charge=false;
          }
          REG.idleAdventureManualStateV3.blockReduction=reduction;
          REG.idleAdventureManualStateV3.blockUntil=maintenant+3000;
        }else if(group==='defense'&&def.id==='defensiveBuff'){
          REG.idleAdventureManualStateV3.defensiveBuffUntil=maintenant+15000;
          fxIdleV1_('joueur','buffDef');
        }else if(group==='defense'&&def.id==='heal'){
          appliquerHealAdventureIdleV4_(a,fight,def);
        }else if(group==='defense'&&def.id==='offensiveBuff'){
          REG.idleAdventureManualStateV3.offensiveBuffUntil=maintenant+15000;
          fxIdleV1_('joueur','buffOff');
        }else if(group==='defense'&&def.id==='charge'){
          REG.idleAdventureManualStateV3.charge=true;
        }else if(group==='defense'&&def.id==='ultimateBuff'){
          REG.idleAdventureManualStateV3.ultimateBuffUntil=maintenant+15000;
          fxIdleV1_('joueur','buffUlt');
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
          REG.idleAdventureManualStateV3.offensiveBuffUntil=maintenant+15000;
          REG.idleAdventureManualStateV3.defensiveBuffUntil=maintenant+15000;
          REG.idleAdventureManualStateV3.ultimateBuffUntil=maintenant+15000;
          REG.idleAdventureManualStateV3.megaBuffUntil=maintenant+15000;
          REG.idleAdventureManualStateV3.cooldownUntil.offensiveBuff=
            maintenant+cooldownDureeAdventureIdleV4_(
              definitionCompetenceAdventureIdleV3_('offensiveBuff'),a
            );
          REG.idleAdventureManualStateV3.cooldownUntil.defensiveBuff=
            maintenant+cooldownDureeAdventureIdleV4_(
              definitionCompetenceAdventureIdleV3_('defensiveBuff'),a
            );
          REG.idleAdventureManualStateV3.cooldownUntil.ultimateBuff=
            maintenant+cooldownDureeAdventureIdleV4_(
              definitionCompetenceAdventureIdleV3_('ultimateBuff'),a
            );
        }else if(def.id==='ohShit'){
          appliquerHealAdventureIdleV4_(a,fight,def);
          appliquerParalyzeAdventureIdleV4_(maintenant);
          appliquerHyperRegenAdventureIdleV4_(a,fight,maintenant);
          REG.idleAdventureManualStateV3.cooldownUntil.heal=
            maintenant+cooldownDureeAdventureIdleV4_(
              definitionCompetenceAdventureIdleV3_('heal'),a
            );
          REG.idleAdventureManualStateV3.cooldownUntil.paralyze=
            maintenant+cooldownDureeAdventureIdleV4_(
              definitionCompetenceAdventureIdleV3_('paralyze'),a
            );
          REG.idleAdventureManualStateV3.cooldownUntil.hyperRegen=
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

      function rendreBoutonCompetenceAdventureIdleV3_(def,group){
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const unlocked=competenceAdventureDisponibleIdleV4_(def,group,a);
        const label=def.id==='move69'
          ?def.label+' · '+Math.max(0,idleEntier_(a&&a.skillState&&a.skillState.move69Uses))+'/69'
          :def.label;
        /* ANTI-SPOIL (règle n°2) : aucune condition de déblocage dans l'infobulle d'une compétence verrouillée. */
        const titreVerrouillage='';
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
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const avancees=REG.IDLE_ADVENTURE_ADVANCED_SKILLS_V4.filter(function(def){
          return competenceAdventureAvanceeDebloqueeIdleV4_(def.id,a);
        });
        return '<div id="sorealIdleAdventureManualV3" class="soreal-idle-adventure-manual-v3'+
          (REG.idleAdventureIdleModeV3?'':' manual-active')+'">'+
          /* Norman (2026-10-13) : petit bouton discret du journal des attaques sur la même ligne qu'Idle Mode (modules/journal-attaques-v1.js). */
          '<div class="soreal-idle-adventure-idle-ligne-v1">'+
          '<button type="button" class="soreal-idle-adventure-idle-toggle-v3'+
            (REG.idleAdventureIdleModeV3?' active':'')+'" data-adventure-idle-toggle '+
            'aria-pressed="'+(REG.idleAdventureIdleModeV3?'true':'false')+'" '+
            'onclick="window.__basculerIdleModeAdventureIdleV3__()">'+
            '<span>Idle Mode</span><b>'+(REG.idleAdventureIdleModeV3?'ON':'OFF')+'</b>'+
          '</button>'+
          '<button type="button" class="soreal-idle-journal-mini-v1" title="Journal des attaques" aria-label="Journal des attaques" '+
            'onclick="window.__SOREAL_IDLE_JOURNAL_ATTAQUES_V1__&&window.__SOREAL_IDLE_JOURNAL_ATTAQUES_V1__.ouvrir()">📖</button>'+
          '</div>'+
          '<div class="soreal-idle-adventure-manual-grid-v3">'+
            '<div class="soreal-idle-adventure-skill-row-v3 attack">'+
              REG.IDLE_ADVENTURE_MANUAL_ATTACKS_V3.map(function(def){
                return rendreBoutonCompetenceAdventureIdleV3_(def,'attack');
              }).join('')+
            '</div>'+
            '<div class="soreal-idle-adventure-skill-row-v3 defense">'+
              REG.IDLE_ADVENTURE_MANUAL_DEFENSE_V3.map(function(def){
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
        /* Le x5 (x10 avec le set GRB) est celui du REPOS en Safe Zone : pendant un combat de Titan, qui se livre dans la Safe Zone, la régénération reste la normale (Norman, 2026-10-10 : « on a x5 à la regen en combattant un titan »). */
        if(zoneCourante==='safe'&&!(a&&a.fight&&a.fight.active)){
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

      function resetHorlogesFightAdventureIdleV2_(){
        REG.idleAdventureFightNextPlayerHitV2=0;
        REG.idleAdventureFightNextEnemyHitV2=0;
        REG.idleAdventureFightLastRegenAtV2=0;
        REG.idleAdventureFightIdentityV2='';
      }

      function envoyerResolutionAdventurePendingV2_(){
        if(
          !REG.idleAdventureResolutionPendingV2||
          metaOccupeIdleV130_()||
          !SOREAL_SESSION
        ){
          return false;
        }
        const action=REG.idleAdventureResolutionPendingV2;
        actionMetaIdleV130_({
          action:'adventure',
          adventure:{action:action,titanId:idleAdventureResolutionIdentiteV2.titanId,titanStartedAt:idleAdventureResolutionIdentiteV2.titanStartedAt}
        });
        if(metaOccupeIdleV130_()){
          REG.idleAdventureResolutionPendingV2='';
          return true;
        }
        return false;
      }

      function appliquerRegenCombatAdventureIdleV2_(a,fight,jusquaMs){
        if(!fight||!fight.active)return;
        const jusqua=Math.max(0,idleNombre_(jusquaMs));
        if(!REG.idleAdventureFightLastRegenAtV2){
          REG.idleAdventureFightLastRegenAtV2=jusqua;
          return;
        }
        const secondes=Math.max(
          0,
          (jusqua-REG.idleAdventureFightLastRegenAtV2)/1000
        );
        if(!(secondes>0))return;

        const regenBaseJoueur=
          Math.max(0,idleNombre_(a&&a.stats&&a.stats.regen))*
          (REG.idleAdventureIdleModeV3?1.2:1);
        const debutRegen=REG.idleAdventureFightLastRegenAtV2;
        const hyperSecondes=Math.max(
          0,
          (Math.min(jusqua,REG.idleAdventureManualStateV3.hyperRegenUntil)-debutRegen)/1000
        );
        /* Saignement du titan : facteur sur la régénération, négatif au-delà de 10 cumuls (le joueur perd alors des PV). */
        const apiTitanRegen=window.SorealTitanComportementsV1;
        const multSaignement=REG.idleTitanEtatV1&&apiTitanRegen&&fight.titanId?apiTitanRegen.multRegenJoueur(fight.titanId,REG.idleTitanEtatV1):1;
        const regenJoueur=
          regenBaseJoueur*multSaignement*(secondes+(multSaignement>0?hyperSecondes*4:0));
        const regenEnnemi=
          Math.max(0,idleNombre_(fight.mobHpRegen));

        if(regenJoueur>0){
          fight.playerHp=Math.min(
            idleNombre_(fight.playerHpMax),
            idleNombre_(fight.playerHp)+regenJoueur
          );
        }else if(regenJoueur<0){
          fight.playerHp=Math.max(0,idleNombre_(fight.playerHp)+regenJoueur);
        }
        if(regenEnnemi>0){
          fight.monsterHp=Math.min(
            idleNombre_(fight.monsterHpMax),
            idleNombre_(fight.monsterHp)+regenEnnemi*secondes
          );
        }
        REG.idleAdventureFightLastRegenAtV2=jusqua;
      }

      function terminerCombatAdventureLocalV2_(fight,victoire){
        if(!fight||!fight.active)return;
        const nom=libelleEnnemiAdventureIdleV1_(fight);
        const finCombatMsV166=
          reinitialiserHorlogeRegenReposAdventureIdleV166_(Date.now());

        if(victoire){
          REG.idleEtat.adventureRestPv=Math.max(0,idleNombre_(fight.playerHp));
          memoriserRestPvIdleV1_(REG.idleEtat.adventureRestPv);
          programmerRespawnAdventureIdleV165_(finCombatMsV166);
          ajouterLogAventureIdleV1_(
            'system',
            'Vous avez vaincu '+nom+' !'
          );
          idleAdventureResolutionIdentiteV2={titanId:String(fight.titanId||''),titanStartedAt:idleNombre_(fight.titanStartedAt)};
          REG.idleAdventureResolutionPendingV2='resolveZoneFight';
          /* Titan vaincu : l'écran de combat joue son départ (il rapetisse en tournant) puis annonce son retour (modules/titans-combat-ecran-v1.js). */
          if(fight.titanId){try{window.dispatchEvent(new CustomEvent('soreal-titan-vaincu',{detail:{id:String(fight.titanId),nom:String(nom||'')}}));}catch(_e){}}
          /* Les histoires ne se déclenchent plus sur un boss de zone Aventure (Norman, 2026-09-30 : « uniquement ceux de Fight Boss »). */
        }else{
          REG.idleEtat.adventureRestPv=0;
          memoriserRestPvIdleV1_(0);
          REG.idleAdventureKoAlertV1=true;
          marquerBoutonAventureKoIdleV1_();
          ajouterLogAventureIdleV1_(
            'enemy',
            'Vous avez été mis K.O. par '+nom+' ! Retour à la Safe Zone…'
          );
          idleAdventureResolutionIdentiteV2={titanId:String(fight.titanId||''),titanStartedAt:idleNombre_(fight.titanStartedAt)};
          REG.idleAdventureResolutionPendingV2='loseZoneFight';
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-204 */
        fight.active=false;
        resetHorlogesFightAdventureIdleV2_();
        pousserEtatVersRuntimePartageIdleV1_();
        envoyerResolutionAdventurePendingV2_();
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

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-211 */
      const IDLE_ADVENTURE_UNLOCK_ITEMS_V1={
        aNumber:{nom:'Un nombre',systeme:'NGU'},
        giantSeed:{nom:'Graine géante',systeme:'Yggdrasil'},
        scrapPaper:{nom:'Bout de papier',systeme:'Diggers'},
        uugHair:{nom:'Poil d\'UUG',systeme:'Beards'},
        pissedOffKey:{nom:'Clé furieuse',systeme:'la Tour'},
        wandoos98:{nom:'Wandoos 98',systeme:'Wandoos'}
      };

      /* Objet réel du sac -> clé d'objet de déblocage -> drapeau du système (mêmes correspondances que le serveur : idle-adventure-v47.js, UNLOCK_PAR_OBJET_V1 et unlockMap). */
      const IDLE_UNLOCK_PAR_OBJET_V1={aNumber:{cle:'aNumber',flag:'ngu',systeme:'NGU'},giantSeed:{cle:'giantSeed',flag:'yggdrasil',systeme:'Yggdrasil'},'scrap:paper':{cle:'scrapPaper',flag:'diggers',systeme:'Gold Diggers'},uugHair:{cle:'uugHair',flag:'beards',systeme:'Beards'},pissedOffKey:{cle:'pissedOffKey',flag:'tower',systeme:'ITOPOD'},wandoos98:{cle:'wandoos98',flag:'wandoos',systeme:'Wandoos'}};

      /* L'objet du sac sert-il à débloquer son système (système encore verrouillé) ? Renvoie la fiche de déblocage, sinon null. */
      function deblocageParObjetIdleV1_(a,item){
        const d=item&&IDLE_UNLOCK_PAR_OBJET_V1[item.definitionId];
        if(!d)return null;
        const flags=a&&a.unlockFlags&&typeof a.unlockFlags==='object'?a.unlockFlags:{};
        return flags[d.flag]?null:d;
      }

      /*
       * Menu « Objets de déblocage » (Norman, 2026-10-04 : « dans le jeu de base c'est en utilisant un objet ») : on utilise désormais l'objet du sac (bouton « Utiliser » de sa fiche, ou clic droit). Le menu ne reste
       * que comme secours pour un déblocage dont l'objet réel n'est plus dans le sac (anciens joueurs).
       */
      function objetsDeblocageDisponiblesAdventureIdleV1_(a){
        const items=a&&a.unlockItems&&typeof a.unlockItems==='object'?a.unlockItems:{};
        const sac=a&&Array.isArray(a.inventory)?a.inventory:[];
        return Object.keys(IDLE_ADVENTURE_UNLOCK_ITEMS_V1).filter(function(id){
          if(!items[id])return false;
          return !sac.some(function(o){const d=o&&IDLE_UNLOCK_PAR_OBJET_V1[o.definitionId];return d&&d.cle===id;});
        });
      }

      function consommerDeblocageAdventureIdleV47_(id){
        actionAdventureIdleV47_({action:'consumeUnlock',item:String(id||'')});
      }

      function consommerObjetSkillAdventureIdleV4_(id){
        actionAdventureIdleV47_({action:'consumeSkillItem',id:String(id||'')});
      }

      /* Norman (2026-10-07) : « je clique sur Transformer mais rien ne se passe… ah si, mais ça a pris du temps » : la transformation attend son tour derrière les appels en cours, puis le serveur la calcule ; on le dit tout de suite. */
      function annoncerTransformationIdleV1_(){
        try{
          let t=document.getElementById('sorealIdleTransformationV1');
          if(!t){
            t=document.createElement('div');
            t.id='sorealIdleTransformationV1';
            t.setAttribute('role','status');
            t.style.cssText='position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:2147483000;padding:10px 18px;border:3px solid #000;border-radius:8px;background:#3a2a05;color:#ffd24a;font-weight:800;box-shadow:3px 3px 0 #000;pointer-events:none;';
            document.body.appendChild(t);
          }
          t.textContent='🧪 Transformation en cours…';
          clearTimeout(t.__finV1);
          t.__finV1=setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},6000);
        }catch(_e){}
      }

      function transformerObjetAdventureIdleV4_(id){
        annoncerTransformationIdleV1_();
        actionAdventureIdleV47_({action:'transformAdventureItem',id:String(id||'')});
      }

      function equiperObjetAdventureIdleV47_(id,slot){
        if(equipementBloqueParDefiIdleV1_()){
          refuserEquipementDefiIdleV1_();
          return;
        }
        jouerEffetAudioIdleV199_('equip');
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

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-214 */
      function toggleMenuZoneAdventureIdleV1_(event){
        if(event)event.stopPropagation();
        document.getElementById('idleZoneSelectCustom')?.classList.toggle('open');
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-215 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-216 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-217 */
      function rendreZoneCombatAdventureIdleV1_(a,nomJoueur){
        const fight=a&&a.fight;
        const stats=a&&a.stats||{};
        const pvMaxRepos=Math.max(0,idleNombre_(stats.hp));
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-218 */
        if(REG.idleEtat&&(REG.idleEtat.adventureRestPv==null||REG.idleEtat.adventureRestPv>pvMaxRepos)){
          REG.idleEtat.adventureRestPv=restPvInitialIdleV1_(pvMaxRepos);
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
                ?idleAdventureLogV1.map(rendreLigneJournalAventureIdleV1_).join('')
                :'<div class="soreal-idle-adventure-log-line-v1 system">Le journal commencera au prochain combat.</div>'
              )+
            '</div>'+
          '</div>';
      }

function pageAventureIdleV28_(j){
        document.documentElement.setAttribute('data-vue-aventure',REG.idleVueAventureV1);
        const a=aventureMetaIdleV47_(j);
        const zones=a&&Array.isArray(a.zones)?a.zones:[];
        const debloquee=aventureDebloqueeIdleV47_(j);
        if(!a||!debloquee){
          /* ANTI-SPOIL (règle n°2) : Adventure encore fermé = rien d'affiché (ni cadenas, ni condition). */
          return '';
        }
        const selected=String(a.selectedZone||'safe');
        const zone=zones.find(function(z){return z&&z.id===selected;})||zones.find(function(z){return z&&z.unlocked;})||null;
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-226 */
        const titans=(Array.isArray(a.titans)?a.titans:[]).filter(function(t){
          return t&&t.progressionUnlocked!==false;
        });
        const deblocagesDisponibles=objetsDeblocageDisponiblesAdventureIdleV1_(a);
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-227 */
        /* Bascule Aventure / Titans (Norman, 2026-10-08) : plus de menu Titans, un bouton au-dessus des zones ouvre la page des titans, le bouton Aventure revient aux zones. Rien n'est affiché tant qu'aucun titan n'est débloqué. */
        const iconeTitan=titans.length&&window.__SOREAL_IDLE_TITANS_V1__&&window.__SOREAL_IDLE_TITANS_V1__.icone?window.__SOREAL_IDLE_TITANS_V1__.icone(j):'';
        const bascule=titans.length?(
          '<div class="soreal-idle-bascule-aventure-v1'+(iconeTitan?' avec-icone':'')+'">'+
            '<button type="button" class="soreal-idle-expand-button-v25'+(REG.idleVueAventureV1==='titans'?'':' actif')+'" onclick="window.__vueAventureIdleV1__(\'zones\')">🗺️ Aventure</button>'+
            '<button type="button" class="soreal-idle-expand-button-v25'+(REG.idleVueAventureV1==='titans'?' actif':'')+(window.__SOREAL_IDLE_TITANS_V1__&&window.__SOREAL_IDLE_TITANS_V1__.disponible&&window.__SOREAL_IDLE_TITANS_V1__.disponible(j)?' soreal-idle-titan-brille-v1':'')+'" onclick="window.__vueAventureIdleV1__(\'titans\')">👹 Titans</button>'+iconeTitan+
          '</div>'
        ):(Number(a.titansAccesBoss)>0?(
          /* Exception à la règle n°2 voulue par Norman (2026-10-10) : le bouton Titans se montre avant l'accès, en ???, avec le boss à vaincre ; il n'ouvre rien. */
          '<div class="soreal-idle-bascule-aventure-v1">'+
            '<button type="button" class="soreal-idle-expand-button-v25 actif" onclick="window.__vueAventureIdleV1__(\'zones\')">🗺️ Aventure</button>'+
            '<button type="button" class="soreal-idle-expand-button-v25 soreal-idle-titans-ferme-v1" disabled aria-disabled="true"><b>???</b><small>Vaincs le boss '+idleHtml_(String(Math.floor(Number(a.titansAccesBoss))))+'</small></button>'+
          '</div>'
        ):'');
        if(REG.idleVueAventureV1==='titans'&&titans.length&&window.__SOREAL_IDLE_TITANS_V1__&&window.__SOREAL_IDLE_TITANS_V1__.section){
          return bascule+window.__SOREAL_IDLE_TITANS_V1__.section(j);
        }
        return bascule+''+
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
                      ?' · Puissance Idle '+formatGrandNombreIdleV70_(z.idleP)+' · Endurance Idle '+formatGrandNombreIdleV70_(z.idleT)
                      :'';
                    return '<button type="button" data-zone-id="'+idleHtml_(z.id)+'" class="team-sort-option'+(active?' active':'')+'" title="Puissance '+formatGrandNombreIdleV70_(z.p||0)+' · Endurance '+formatGrandNombreIdleV70_(z.t||0)+idleInfo+'" onclick="window.__selectionnerZoneAdventureIdleV47__(\''+idleHtml_(z.id)+'\');window.__toggleMenuZoneAdventureIdleV1__();">'+
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
          /* Les cartes des titans ont leur propre vue dans cette page (bouton « Titans » en haut, modules/titans-v1.js). */''+
          (deblocagesDisponibles.length?'<div class="soreal-idle-section-v8"><div class="soreal-idle-window-title-v31">🎒 Un objet t’attend : ton sac est plein</div><div style="display:grid;gap:8px">'+deblocagesDisponibles.map(function(id){const d=IDLE_ADVENTURE_UNLOCK_ITEMS_V1[id];return '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;border-radius:12px;background:rgba(255,200,120,.08);border:1px solid rgba(255,200,120,.35)"><span><b>'+idleHtml_(d.nom)+'</b><br><small>Libère une place dans ton sac : l’objet y arrivera, puis utilise-le pour débloquer '+idleHtml_(d.systeme)+'.</small></span></div>';}).join('')+'</div></div>':'')+
          /* 2026-09-24 (Norman : « trop de menus sur téléphone ») : tout l'Inventory (équipement, sac, coffre, options) est maintenant sous la page Adventure. */
          (j.inventaireDebloque?pageInventaireIdleV28_(j):'');
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

      function emplacementEquipementAdventureIdleV138_(item){
        const slot=String(item&&item.slot||'');
        if(REG.ADVENTURE_SECOND_WEAPON_SLOTS_V1.indexOf(slot)!==-1)return 'weapon2';
        return slot!=='weapon2'&&REG.ADVENTURE_CORE_SLOTS_V138.indexOf(slot)!==-1?slot:'accessory';
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
      /* Points de couleur des boosts qu'il manque encore (Norman, 2026-10-08) : orange = Power, bleu = Toughness, jaune = Special ; fournis par le serveur (boostManque), au niveau actuel de la pièce. */
      function pointsBoostManquantIdleV1_(item){
        const m=item&&item.boostManque;
        if(!m||!(m.power||m.toughness||m.special))return '';
        return '<i class="idle-boostpts-v1" aria-hidden="true">'+
          (m.power?'<b class="p" title="Il manque des boosts de Power"></b>':'')+
          (m.toughness?'<b class="t" title="Il manque des boosts de Toughness"></b>':'')+
          (m.special?'<b class="s" title="Il manque des boosts Special"></b>':'')+
        '</i>';
      }

      function badgesNiveauObjetIdleV1_(item){
        if(!item)return '';
        const niveau=idleEntier_(item.level);
        return (niveau>=1
          ?'<i class="idle-lvl-badge-v1'+(niveau>=100?' max':'')+'" aria-hidden="true">'+niveau+'</i>'
          :'')+
          (item.fullyMaxed
            ?'<i class="idle-maxok-badge-v1" title="Niveau 100 et statistiques au maximum" aria-hidden="true">✔</i>'
            :pointsBoostManquantIdleV1_(item));
      }

      function iconeObjetAdventureIdleV138_(item){
        return iconeBaseObjetAdventureIdleV138_(item)+badgesNiveauObjetIdleV1_(item);
      }

      /*
       * Emoji de repli d'un objet dont l'image manque (Norman, 2026-09-25) : « mets-le bien grand et centré dans sa case ; s'ils sont plusieurs,
       * fais au mieux pour qu'on les voie bien ». Le nombre de symboles (data-n) règle la taille : 1 = grand, 2 = un peu moins, 3+ = sur deux lignes.
       */
      function nombreEmojisIdleV1_(texte){
        const brut=String(texte==null?'':texte).replace(/\s+/g,'');
        if(!brut)return 0;
        try{
          if(typeof Intl!=='undefined'&&Intl.Segmenter){
            return Array.from(new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(brut)).length;
          }
        }catch(e){}
        return Array.from(brut).length;
      }

      function emojiRepliObjetIdleV1_(emoji){
        const n=Math.min(4,Math.max(1,nombreEmojisIdleV1_(emoji)));
        return '<span class="idle-emoji-fallback-v1" data-n="'+n+'" style="display:none">'+idleHtml_(String(emoji==null?'':emoji).split(' ').join(''))+'</span>';
      }

      const ONERROR_EMOJI_OBJET_IDLE_V1="onerror=\"this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='flex'\"";

      function iconeBaseObjetAdventureIdleV138_(item){
        if(item&&item.kind==='boost'){
          return '<img class="idle-boost-icon-v1" src="'+idleHtml_(urlImageBoostAdventureIdleV138_(item))+'" alt="" loading="eager" decoding="async" draggable="false" '+
            ONERROR_EMOJI_OBJET_IDLE_V1+'>'+
            emojiRepliObjetIdleV1_('⚡');
        }
        if(item&&item.kind==='cube'){
          return '<img src="'+idleHtml_(urlImageObjetAdventureIdleV138_(item))+'" alt="" loading="eager" decoding="async" draggable="false" '+
            ONERROR_EMOJI_OBJET_IDLE_V1+'>'+
            emojiRepliObjetIdleV1_('🧊');
        }
        /*
         * Norman (2026-09-29) : « J'ai toujours l'émoji à la place de Tuba of
         * Time » -- alors que l'image existe bien sur le R2 et que le Worker
         * média la résout correctement par wikiItemId (vérifié en direct en
         * production). Cause réelle : ce chemin de rendu (le seul utilisé par
         * le paperdoll/les accessoires Aventure -- item-specials-early-v75.js
         * et item-images-r2-v74.js ciblent des classes d'un ancien écran
         * d'équipement, jamais celui-ci) exigeait `item.set` pour même
         * tenter une image. Un Special (Tuba of Time, Cheese Grater…) n'a
         * jamais de `.set` (exclusif aux pièces d'équipement de set) --
         * repli immédiat et permanent sur l'émoji générique du slot, quelle
         * que soit la disponibilité réelle de l'image. `wikiItemId` (déjà
         * transporté par TOUT objet du catalogue, cleanItem) est un
         * identifiant tout aussi valide pour urlImageObjetAdventureIdleV138_ ;
         * le repli `onerror` vers l'émoji reste inchangé si l'image manque
         * vraiment.
         */
        if(!item||!(item.set||item.wikiItemId))return iconeSlotAdventureIdleV138_(item&&item.slot);
        return '<img src="'+idleHtml_(urlImageObjetAdventureIdleV138_(item))+'" alt="" loading="eager" decoding="async" draggable="false" '+
          ONERROR_EMOJI_OBJET_IDLE_V1+'>'+
          emojiRepliObjetIdleV1_(iconeSlotAdventureIdleV138_(item.slot));
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-235 */
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

        /*
         * Norman (2026-10-09) : le 3e accessoire se place SOUS les deux premiers, à côté du Pantalon ; le 4e SOUS le 3e, à côté des Bottes (colonne de gauche de la grille). Les suivants restent en dessous du paperdoll.
         */
        const classesGrille=['soreal-idle-v138-slot-acc1','soreal-idle-v138-slot-acc2','soreal-idle-v138-slot-acc3','soreal-idle-v138-slot-acc4'];
        const enGrille=tousLesSlots.slice(0,4).map(function(item,index){
          return rendreEmplacementAccessoireAdventureIdleV138_(item,classesGrille[index]);
        }).join('');

        const debordement=tousLesSlots.slice(4);
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

      function rendreGrilleSacAdventureIdleV1_(items,capacite){
        const total=Math.max(idleEntier_(capacite),items.length);
        const pages=Math.max(1,Math.ceil(total/REG.IDLE_SAC_CASES_PAR_PAGE_V1));
        if(REG.idlePageSacV1>pages)REG.idlePageSacV1=pages;
        const page=REG.idlePageSacV1;
        const debut=(page-1)*REG.IDLE_SAC_CASES_PAR_PAGE_V1;
        const fin=Math.min(total,debut+REG.IDLE_SAC_CASES_PAR_PAGE_V1);
        const cases=[];
        for(let i=debut;i<fin;i+=1){
          const item=items[i];
          cases.push(
            item
              ?rendreCarteSacAdventureIdleV138_(item,i)
              :'<div class="soreal-idle-v138-bag-card soreal-idle-v138-bag-card-vide" data-slot-index="'+i+'"></div>'
          );
        }
        return pagerSacIdleV1_(page,pages)+'<div class="soreal-idle-v138-bag">'+cases.join('')+'</div>'+(pages>1?pagerSacIdleV1_(page,pages):'');
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
        if(!id||!REG.idleEtat)return;
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const equipment=a&&a.equipment||{};
        const estEquipe=
          REG.ADVENTURE_CORE_SLOTS_V138.some(function(slot){return String(equipment[slot]||'')===id;})||
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

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-242 */
      const IDLE_ADVENTURE_GESTE_SEUIL_PX_V196=32;

      const IDLE_ADVENTURE_DOUBLE_TAP_MS_V196=420;

      let idleDernierClicDroitSourisMsV209=0;

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
        /* Une case salie par le Coffre (modules/coffre-accident-v1.js) : le caca glisse avec l'objet. */
        if(source.hasAttribute&&source.hasAttribute('data-caca')){const caca=document.createElement('i');caca.className='soreal-idle-caca-fantome-v1';ghost.appendChild(caca);}
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
          const a=REG.idleEtat&&aventureMetaIdleV47_(REG.idleEtat);
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

        if(cible.getAttribute('data-equip-slot-v180')==='weapon2'&&decisionActionSlotAdventureIdleV138_(source,String(cible.getAttribute('data-occupant-id')||''))==='equiper'){
          equiperObjetAdventureIdleV47_(source,'weapon2');
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
          const a=REG.idleEtat&&aventureMetaIdleV47_(REG.idleEtat);
          const equipment=a&&a.equipment||{};
          const estEquipe=
            REG.ADVENTURE_CORE_SLOTS_V138.some(function(slot){
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
        if(REG.idleAdventureGesteV196&&REG.idleAdventureGesteV196.timer){
          clearTimeout(REG.idleAdventureGesteV196.timer);
          REG.idleAdventureGesteV196.timer=0;
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
        const geste=REG.idleAdventureGesteV196;
        annulerTimerGesteAdventureIdleV196_();
        if(!(options&&options.garderCapture)){
          libererCaptureGesteAdventureIdleV196_(geste);
        }
        REG.idleAdventureGesteV196=null;
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

      /* Un nouvel appui sur l'objet dont la fiche est ouverte la REFERME (Norman, 2026-10-14) : l'appui ferme d'abord la fiche (clic hors du popup), puis le tap qui suit ne doit pas la rouvrir. */
      let idleFicheFermeeParAppuiV1={id:'',ms:0};

      function fermerPopupDetailsSiExterieurAdventureIdleV207_(event){
        if(!popupDetailsObjetAdventureIdleOuvertV207_())return false;
        const target=event&&event.target;
        if(cibleDansPopupDetailsObjetAdventureIdleV207_(target))return false;
        const appuye=idObjetGesteAdventureIdleV196_(elementObjetGesteAdventureIdleV196_(target));
        idleFicheFermeeParAppuiV1=appuye&&appuye===String(REG.idleFicheObjetOuverteIdV1||'')?{id:appuye,ms:Date.now()}:{id:'',ms:0};
        fermerDetailsObjetAdventureIdleV1_();
        return true;
      }

      function ouvrirDetailsObjetParGesteAdventureIdleV196_(id){
        const objet=String(id||'');
        if(!objet)return false;

        /* Même objet que celui dont l'appui vient de fermer la fiche : elle reste fermée. */
        if(idleFicheFermeeParAppuiV1.id===objet&&Date.now()-idleFicheFermeeParAppuiV1.ms<1500){
          idleFicheFermeeParAppuiV1={id:'',ms:0};
          nettoyerEtatDragAdventureIdleV138_();
          REG.idleAdventureIgnorerClicJusquaV165=Date.now()+750;
          return true;
        }
        idleFicheFermeeParAppuiV1={id:'',ms:0};
        nettoyerEtatDragAdventureIdleV138_();
        afficherDetailsObjetAdventureIdleV138_(objet);
        REG.idleAdventureIgnorerClicJusquaV165=Date.now()+750;
        return true;
      }

      let idleTapsObjetV1={id:'',n:0,ms:0};

      let idleDoubleDiffereTimerV1=0;

      /* Nombre d'appuis rapides consécutifs sur le même objet (1, 2 ou 3 ; au troisième le compteur repart de zéro). La souris compte toujours 1. */
      function compterTapsObjetIdleV1_(id,pointerType){
        if(pointerType==='mouse')return 1;
        const maintenant=Date.now();
        const objet=String(id||'');
        if(objet&&objet===idleTapsObjetV1.id&&maintenant-idleTapsObjetV1.ms<=IDLE_ADVENTURE_DOUBLE_TAP_MS_V196)idleTapsObjetV1.n+=1;
        else idleTapsObjetV1.n=1;
        idleTapsObjetV1.id=objet;
        idleTapsObjetV1.ms=maintenant;
        const n=idleTapsObjetV1.n;
        /* Un seul geste tactile : le double tap (Norman, 2026-10-09) ; au deuxième appui la séquence repart de zéro. */
        if(n>=2){idleTapsObjetV1={id:'',n:0,ms:0};}
        return n;
      }

      /* Pièces du sac qui peuvent fusionner avec cet objet : même objet, ni verrouillées, ni équipées, ni au niveau 100. */
      function piecesIdentiquesFusionIdleV1_(a,item){
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const equipement=(a&&a.equipment)||{};
        const idsEquipes=REG.ADVENTURE_CORE_SLOTS_V138
          .map(function(slot){return String(equipement[slot]||'');})
          .concat(Array.isArray(equipement.accessories)?equipement.accessories.map(String):[])
          .filter(Boolean);
        return items.filter(function(x){
          return x&&String(x.id)!==String(item.id)&&x.kind!=='boost'&&x.definitionId===item.definitionId&&!x.locked&&idsEquipes.indexOf(String(x.id))===-1&&idleEntier_(x.level)<100;
        });
      }

      /*
       * Clic droit de la souris avec Double tap / Triple tap ACHETÉS (Norman, 2026-10-04 : « pour que l'achat serve aussi sur PC : un premier clic droit absorbe les objets identiques, et quand aucune pièce n'est
       * disponible, il absorbe les boosts ; dans l'inventaire ou équipé »). Triple tap acheté : fusion avec les pièces identiques tant qu'il y en a ; Double tap acheté : sinon, absorption des boosts du sac.
       * Renvoie false quand aucun des deux achats ne s'applique (l'ancienne action rapide équiper / fusionner reste alors celle du clic droit).
       */
      function clicDroitGestesAchetesIdleV1_(id){
        const g=gestesAchetesIdleV1_();
        if(!g.double&&!g.triple)return false;
        const objet=String(id||'');
        if(!objet||!REG.idleEtat)return false;
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const item=items.find(function(x){return String(x&&x.id)===objet;});
        /* Clic droit / double tap sur un BOOST (Norman, 2026-10-10) : il absorbe tous les boosts de même chiffre et de même couleur (même définition), jusqu'à ce qu'ils fusionnent au niveau 100 (action serveur inventoryAuto / mergeAll). */
        if(item&&item.kind==='boost'){
          const identiques=items.filter(function(x){return x&&x.kind==='boost'&&String(x.id)!==objet&&x.definitionId===item.definitionId&&!x.locked&&idleEntier_(x.level)<100;});
          if(idleEntier_(item.level)>=100||!identiques.length){
            messageFlottantIdleV32_('Aucun boost identique à fusionner avec celui-ci.');
            return true;
          }
          const envoyerBoost=window.__actionMetaV47__;
          if(typeof envoyerBoost!=='function')return false;
          nettoyerEtatDragAdventureIdleV138_();
          envoyerBoost({action:'inventoryAuto',mode:'mergeAll',itemId:objet});
          return true;
        }
        if(!item)return false;
        if(deblocageParObjetIdleV1_(a,item))return false;
        if(g.triple&&idleEntier_(item.level)<100&&piecesIdentiquesFusionIdleV1_(a,item).length){
          return fusionnerAutoObjetIdleV1_(objet);
        }
        if(g.double)return boosterObjetEquipeAdventureIdleV1_(objet);
        return false;
      }

      /*
       * Clic droit (PC) sur le Cube de l'infini : même règle que sur un objet (Norman, 2026-10-05 : « le clic droit sur le cube de l'infini absorbe tous les boosts comme pour les items, pas de règle à part ») : avec Double tap acheté,
       * il absorbe tous les boosts du sac (la même action que « A + clic » sur le cube, inventoryAuto / boostAll) ; sans cet achat, rien de plus qu'avant.
       */
      function clicDroitCubeIdleV1_(){
        const g=gestesAchetesIdleV1_();
        if(!g.double||!REG.idleEtat)return false;
        const a=aventureMetaIdleV47_(REG.idleEtat);
        if(!(a&&a.cube&&a.cube.unlocked))return false;
        const envoyer=window.__actionMetaV47__;
        if(typeof envoyer!=='function')return false;
        nettoyerEtatDragAdventureIdleV138_();
        envoyer({action:'inventoryAuto',mode:'boostAll',targetId:'cube'});
        return true;
      }

      /* Triple tap : fusion automatique de l'objet avec toutes les pièces identiques du sac (action serveur inventoryAuto / mergeAll). Prévient s'il n'y a rien à fusionner. */
      function fusionnerAutoObjetIdleV1_(id){
        const objet=String(id||'');
        if(!objet||!REG.idleEtat)return false;
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const item=items.find(function(x){return String(x&&x.id)===objet;});
        if(!item||item.kind==='boost')return false;
        const candidats=piecesIdentiquesFusionIdleV1_(a,item);
        if(idleEntier_(item.level)>=100||!candidats.length){
          messageFlottantIdleV32_('Aucune pièce identique à fusionner avec cet objet.');
          return true;
        }
        const envoyer=window.__actionMetaV47__;
        if(typeof envoyer!=='function')return false;
        nettoyerEtatDragAdventureIdleV138_();
        envoyer({action:'inventoryAuto',mode:'mergeAll',itemId:objet});
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
          REG.idleAdventureComparerEnAttenteV183&&
          occupant!==idleAdventureComparerPremierV183
        ){
          ouvrirComparaisonObjetAdventureIdleV183_(occupant);
          return;
        }

        /* Un simple appui ouvre la fiche de l'objet (Norman, 2026-10-14) : plus aucune sélection. */
        ouvrirDetailsObjetParGesteAdventureIdleV196_(occupant);
      }

      function executerTapCarteAdventureIdleV196_(element,id){
        const objet=String(id||'');
        if(!element||!objet)return;

        if(
          REG.idleAdventureComparerEnAttenteV183&&
          objet!==idleAdventureComparerPremierV183
        ){
          ouvrirComparaisonObjetAdventureIdleV183_(objet);
          return;
        }

        /* Un simple appui ouvre la fiche de l'objet, avec ou sans statistiques (Norman, 2026-10-14) : plus aucune sélection. */
        ouvrirDetailsObjetParGesteAdventureIdleV196_(objet);
      }

      /*
       * Action rapide d'un objet du sac (2026-09-24, comme le clic droit de NGU Idle) :
       * - une pièce identique (même definitionId) est déjà équipée -> fusion dans la pièce équipée ;
       * - sinon -> équipement (remplace la pièce du slot).
       * Les boosts ne sont pas concernés (retourne false). Réutilise la décision du glisser-déposer sur un slot.
       */
      function actionRapideObjetAdventureIdleV209_(id){
        const objet=String(id||'');
        if(!objet||!REG.idleEtat)return false;
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const item=items.find(function(x){return String(x&&x.id)===objet;});
        if(!item||item.kind==='boost')return false;

        /* Objet de déblocage dont le système est encore verrouillé : le clic droit l'utilise (comme CTRL + clic dans le jeu d'origine). */
        if(deblocageParObjetIdleV1_(a,item)){
          nettoyerEtatDragAdventureIdleV138_();
          utiliserObjetDeblocageIdleV1_(objet);
          return true;
        }

        const equipement=a.equipment||{};
        const idsEquipes=REG.ADVENTURE_CORE_SLOTS_V138
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

      /*
       * Double tap sur une pièce ÉQUIPÉE = même effet que « A + clic » sur ordinateur (Norman, 2026-09-26 : « quand on double tape sur une pièce équipée, ça doit avoir le même effet que
       * CTRL + A sur PC ») : applique les boosts du sac à cette pièce (action inventoryAuto / boostAll, la même que modules/inventory-auto-v1.js).
       */
      function boosterObjetEquipeAdventureIdleV1_(id){
        const objet=String(id||'');
        if(!objet||!REG.idleEtat)return false;
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const item=items.find(function(x){return String(x&&x.id)===objet;});
        if(!item||item.kind==='boost')return false;
        const envoyer=window.__actionMetaV47__;
        if(typeof envoyer!=='function')return false;
        nettoyerEtatDragAdventureIdleV138_();
        envoyer({action:'inventoryAuto',mode:'boostAll',targetId:objet});
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

        REG.idleAdventureGesteV196=geste;

        if(typeof element.setPointerCapture==='function'){
          try{element.setPointerCapture(event.pointerId);}catch(_){}
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-243 */
      }

      function deplacerGesteAdventureIdleV196_(event){
        const geste=REG.idleAdventureGesteV196;
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
          REG.idleAdventureDragIdV138=geste.itemId;
          REG.idleAdventureIgnorerClicJusquaV165=Date.now()+750;
          geste.sourceEl.classList.add('drag-source');
          creerGhostDragAdventureIdleV183_(geste.sourceEl,event);
        }

        deplacerGhostDragAdventureIdleV183_(event);
        marquerCibleDragAdventureIdleV196_(event);

        if(event.cancelable)event.preventDefault();
        event.stopPropagation();
      }

      function finirGesteAdventureIdleV196_(event){
        const geste=REG.idleAdventureGesteV196;
        if(!geste||geste.pointerId!==event.pointerId)return;

        if(event.cancelable)event.preventDefault();
        event.stopPropagation();

        annulerTimerGesteAdventureIdleV196_();

        if(geste.drag){
          const cible=marquerCibleDragAdventureIdleV196_(event);
          const source=geste.itemId;
          REG.idleAdventureIgnorerClicJusquaV165=Date.now()+750;
          terminerEtatGesteAdventureIdleV196_();
          nettoyerEtatDragAdventureIdleV138_();
          appliquerDepotGesteAdventureIdleV196_(source,cible);
          return;
        }

        if(geste.appuiLong){
          REG.idleAdventureIgnorerClicJusquaV165=Date.now()+750;
          terminerEtatGesteAdventureIdleV196_();
          return;
        }

        const element=geste.sourceEl;
        const id=geste.itemId;
        const pointerType=geste.pointerType;
        const moved=geste.moved;

        REG.idleAdventureIgnorerClicJusquaV165=Date.now()+750;
        terminerEtatGesteAdventureIdleV196_();

        if(moved)return;

        /*
         * Double tap (achats « Double tap : boosts » et « Double tap : fusion » de la boutique EXP, voir gestesAchetesIdleV1_) : sans achat, chaque appui reste un appui simple. Le geste unique est décrit juste en dessous.
         */
        /*
         * UN SEUL geste tactile, le DOUBLE TAP (Norman, 2026-10-09 : sur téléphone, le double tap absorbe toutes les pièces qui peuvent fusionner ; quand il n'y en a plus, il absorbe tous les boosts ; comme le clic droit de la
         * souris). Exactement la règle du clic droit (clicDroitGestesAchetesIdleV1_) : avec l'achat de fusion, il fusionne tant qu'il y a des pièces identiques ; avec l'achat des boosts, il absorbe les boosts sinon.
         */
        const nTaps=compterTapsObjetIdleV1_(id,pointerType);
        const gestes=gestesAchetesIdleV1_();
        /* Le premier appui n'ouvre pas la fiche tout de suite quand un double tap est acheté (Norman, 2026-10-14 : « le double tap ne fonctionne plus car un simple tap ouvre la fenêtre de stats ») : la fiche cacherait ou
         * déplacerait l'objet avant le deuxième appui. On attend la fin du délai du double tap ; un deuxième appui annule l'attente et lance l'action du double tap. Sans achat, ou à la souris, la fiche s'ouvre aussitôt. */
        clearTimeout(idleDoubleDiffereTimerV1);
        if(nTaps===2&&(gestes.double||gestes.triple)){
          if(clicDroitGestesAchetesIdleV1_(id))return;
        }else if(nTaps===1&&(gestes.double||gestes.triple)&&pointerType!=='mouse'){
          idleDoubleDiffereTimerV1=setTimeout(function(){
            idleDoubleDiffereTimerV1=0;
            executerTapObjetAdventureIdleV196_(element,id);
          },IDLE_ADVENTURE_DOUBLE_TAP_MS_V196+30);
          return;
        }

        executerTapObjetAdventureIdleV196_(element,id);
      }

      function annulerGesteAdventureIdleV196_(event){
        const geste=REG.idleAdventureGesteV196;
        if(!geste)return;
        if(event&&event.pointerId!=null&&geste.pointerId!==event.pointerId)return;
        REG.idleAdventureIgnorerClicJusquaV165=Date.now()+350;
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
            REG.idleAdventureGesteV196&&
            REG.idleAdventureGesteV196.pointerId===event.pointerId
          ){
            annulerGesteAdventureIdleV196_(event);
          }
        },true);

        document.addEventListener('pointerdown',function(event){
          if(event.pointerType==='mouse'){idleCubeAppuiV1=null;return;}
          const c=event.target&&event.target.closest?event.target.closest('[data-idle-cube-drop-v180]'):null;
          idleCubeAppuiV1=c?{x:event.clientX,y:event.clientY,t:Date.now(),id:event.pointerId}:null;
        },true);
        document.addEventListener('pointerup',function(event){
          const p=idleCubeAppuiV1;
          idleCubeAppuiV1=null;
          if(!p||p.id!==event.pointerId||event.pointerType==='mouse')return;
          if(Math.hypot(event.clientX-p.x,event.clientY-p.y)>20||Date.now()-p.t>550)return;
          toucherCubeAdventureIdleV1_();
        },true);

        document.addEventListener('soreal-longpress',function(event){
          /* PC : le maintien du clic n'ouvre plus le popup (il se refermait au relâchement) — c'est le survol qui l'ouvre. */
          if(event.detail&&event.detail.pointerType==='mouse')return;
          /* Cube de l'infini : son popup s'ouvre au maintien, comme celui des autres objets. */
          const cubeLong=event.target&&event.target.closest?event.target.closest('[data-idle-cube-drop-v180]'):null;
          if(cubeLong){
            idleCubeIgnorerClicJusquaV1=Date.now()+750;
            idleCubeDernierTapMsV1=0;
            afficherDetailsCubeInfiniAdventureIdleV220_();
            if(event.cancelable)event.preventDefault();
            event.stopPropagation();
            return;
          }
          const element=elementObjetGesteAdventureIdleV196_(event.target);
          const id=idObjetGesteAdventureIdleV196_(element);
          if(!element||!id)return;

          if(
            REG.idleAdventureGesteV196&&
            REG.idleAdventureGesteV196.itemId===id
          ){
            REG.idleAdventureGesteV196.appuiLong=true;
            annulerTimerGesteAdventureIdleV196_();
          }

          REG.idleAdventureIgnorerClicJusquaV165=Date.now()+750;
          ouvrirDetailsObjetParGesteAdventureIdleV196_(id);

          if(event.cancelable)event.preventDefault();
          event.stopPropagation();
        },true);

        document.addEventListener('contextmenu',function(event){
          /* Cube de l'infini : même clic droit que pour un objet (absorbe tous les boosts) ; la souris seulement. */
          const cubeEl=event.target&&event.target.closest?event.target.closest('[data-idle-cube-drop-v180]'):null;
          if(cubeEl&&cubeEl.closest('.soreal-idle-v151-inventory-columns')){
            event.preventDefault();
            const sourisCube=event.pointerType==='mouse'||(!event.pointerType&&Date.now()-idleDernierClicDroitSourisMsV209<1500);
            if(sourisCube&&clicDroitCubeIdleV1_())event.stopPropagation();
            return;
          }
          const element=elementObjetGesteAdventureIdleV196_(event.target);
          if(!element)return;
          event.preventDefault();
          /* Clic droit de la souris (PC) sur un objet du sac : action rapide équiper / fusionner. Un contextmenu tactile
             (maintien long) n'est pas un clic droit : il reste géré par le composant de maintien long. */
          const souris=
            event.pointerType==='mouse'||
            (!event.pointerType&&Date.now()-idleDernierClicDroitSourisMsV209<1500);
          if(!souris)return;
          const idObjet=idObjetGesteAdventureIdleV196_(element);
          /* Double tap / Triple tap achetés : le clic droit fusionne puis absorbe les boosts, sur une pièce du sac comme sur une pièce équipée. */
          if(clicDroitGestesAchetesIdleV1_(idObjet))return;
          if(!element.classList.contains('soreal-idle-v138-bag-card'))return;
          actionRapideObjetAdventureIdleV209_(idObjet);
        },true);

        document.addEventListener('click',function(event){

          /*
           * Comparer (2026-09-26, Norman : « Comparer ne fonctionne plus sur PC, à la souris ») : le tap qui choisit le deuxième objet ouvre la
           * comparaison au relâchement (pointerup), puis le navigateur envoie le « click » : cet objet étant hors des popups, il les refermait aussitôt.
           * Un clic qui suit de moins de 750 ms un geste sur un objet (idleAdventureIgnorerClicJusquaV165) n'est pas un clic « à l'extérieur ».
           */
          if(Date.now()<REG.idleAdventureIgnorerClicJusquaV165){
            if(elementObjetGesteAdventureIdleV196_(event.target)){
              event.preventDefault();
              event.stopPropagation();
            }
            return;
          }
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-246 */
          fermerPopupDetailsSiExterieurAdventureIdleV207_(event);

          if(!elementObjetGesteAdventureIdleV196_(event.target))return;
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-247 */
          event.preventDefault();
          event.stopPropagation();
        },true);
      }

      function idSourceAdventureIdleV138_(event){
        return String(
          REG.idleAdventureDragIdV138||
          (event&&event.dataTransfer?event.dataTransfer.getData('text/plain'):'')||
          ''
        );
      }

      function nettoyerEtatDragAdventureIdleV138_(){
        REG.idleAdventureDragIdV138='';
        document.querySelectorAll(
          '.soreal-idle-v138-slot.drag-over,'+
          '.soreal-idle-v138-bag-card.drag-over,'+
          '.soreal-idle-v138-bag-card.drag-source,'+
          '.soreal-idle-v138-slot.drag-source'
        ).forEach(function(el){
          el.classList.remove('drag-over','drag-source');
        });
        afficherDetailsObjetAdventureIdleV138_('');

        if(idleInventoryDeferredPatchV160&&REG.idleEtat){
          idleInventoryDeferredPatchV160=false;
          patchInventaireAdventureIdleV160_(
            REG.idleEtat,
            {action:'deferred',confirmed:true}
          );
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
        if(!REG.idleEtat)return;
        const a=aventureMetaIdleV47_(REG.idleEtat);
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
        if(!REG.idleEtat||sourceId===cibleId)return;
        const a=aventureMetaIdleV47_(REG.idleEtat);
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
        const a=aventureMetaIdleV47_(REG.idleEtat);
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
          const nomStat=type==='power'?'Puissance':type==='toughness'?'Endurance':'Spécial';
          toastIdleV5_('Cet objet n’a pas de statistique '+nomStat+' à remplir : le boost n’est pas consommé.');
          return;
        }
        const specialsRestants=type==='special'?specialAcceptePlusDeBoostIdleV1_(cible):null;
        if(
          cible.fullyMaxed||
          (specialsRestants===null?actuel>=cap-1e-9:!specialsRestants)
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
        if(!id||!REG.idleEtat)return;
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const source=items.find(function(x){return String(x&&x.id)===id;});
        if(!source||source.kind!=='boost'){
          toastIdleV5_('Seul un boost peut être absorbé par le Cube.');
          return;
        }
        boosterCubeAdventureIdleV47_(source.id);
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-255 */
      function afficherDetailsCubeInfiniAdventureIdleV220_(){
        const root=document.getElementById('soreal-idle-v138-details');
        const corps=document.getElementById('soreal-idle-v138-details-body');
        const a=REG.idleEtat&&aventureMetaIdleV47_(REG.idleEtat);
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
            '<div class="soreal-idle-v138-details-stat"><span class="sb-power-v1">Puissance</span><b>'+formatGrandNombreIdleV70_(cube.power||0)+'</b></div>'+
            '<div class="soreal-idle-v138-details-stat"><span class="sb-toughness-v1">Endurance</span><b>'+formatGrandNombreIdleV70_(cube.toughness||0)+'</b></div>'+
            '<div class="soreal-idle-v138-details-stat"><span>Total stats</span><b>'+formatGrandNombreIdleV70_(total)+'</b></div>'+
            (suivant
              ?'<div class="soreal-idle-v138-details-stat"><span>Prochain tier</span><b>'+formatGrandNombreIdleV70_(suivant.seuil||0)+'</b></div>'
              :'<div class="soreal-idle-v138-details-stat"><span>Tier</span><b>MAX</b></div>')+
          '</div>'+
          (bonus.length
            ?'<div style="margin-top:10px;font-size:14px;color:#aeb5c8"><b>Bonus du tier</b><br>'+bonus.map(idleHtml_).join('<br>')+'</div>'
            :'');
        root.style.display='block';
        positionnerPopupObjetAdventureIdleV1_(root);
        activerGlisserPopupObjetAdventureIdleV1_(root);
      }

      /*
       * Double tap sur le Cube de l'infini = il absorbe tous les boosts du sac (Norman, 2026-09-29 :
       * « quand on double tape sur le cube de l'infini il doit absorber tous les boosts »). Même
       * principe que le double tap sur une pièce équipée (boosterObjetEquipeAdventureIdleV1_) et que
       * « A + clic » sur le Cube (modules/inventory-auto-v1.js) : action inventoryAuto / boostAll,
       * cible « cube » -- déjà gérée côté serveur (idle-inventory-auto-v1.js), aucune règle nouvelle.
       * Tactile/stylet seulement, comme les objets (estDoubleTapGesteAdventureIdleV196_) : la souris
       * garde « A + clic ». Le popup de détails n'est ouvert qu'une fois la fenêtre de double tap
       * écoulée : sinon il recouvrirait le Cube et le second tap tomberait dessus.
       */
      let idleCubeDernierTapMsV1=0;

      let idleCubeIgnorerClicJusquaV1=0;

      function absorberTousBoostsCubeAdventureIdleV1_(){
        const envoyer=window.__actionMetaV47__;
        if(typeof envoyer!=='function')return false;
        nettoyerEtatDragAdventureIdleV138_();
        envoyer({action:'inventoryAuto',mode:'boostAll',targetId:'cube'});
        return true;
      }

      /*
       * Un appui tactile sur le Cube (Norman, 2026-10-09 : « le double tap sur le cube n'avale plus les boosts »). Le Cube porte data-soreal-longpress (son popup s'ouvre au maintien) et le module de maintien
       * appelle preventDefault sur touchstart : le navigateur ne produit alors plus de « click » tactile, et le double tap, compté dans le clic, ne se déclenchait jamais. Le tap est donc détecté au relâchement
       * du doigt (pointerup) ; le clic, quand il existe quand même, passe par la même fonction (deux appels collés = un seul appui).
       */
      let idleCubeDernierEvtMsV1=0;

      function toucherCubeAdventureIdleV1_(){
        const maintenant=Date.now();
        if(maintenant-idleCubeDernierEvtMsV1<80)return;
        idleCubeDernierEvtMsV1=maintenant;
        if(maintenant<idleCubeIgnorerClicJusquaV1)return;
        if(!gestesAchetesIdleV1_().double)return;
        if(maintenant-idleCubeDernierTapMsV1<=IDLE_ADVENTURE_DOUBLE_TAP_MS_V196){
          idleCubeDernierTapMsV1=0;
          absorberTousBoostsCubeAdventureIdleV1_();
          return;
        }
        idleCubeDernierTapMsV1=maintenant;
      }

      let idleCubeAppuiV1=null;

      function clicCubeAdventureIdleV138_(event){
        /* Certains Safari envoient un « click » sans pointerType : repli sur le type de pointeur principal de l'appareil. */
        const typePointeur=event&&typeof event.pointerType==='string'&&event.pointerType
          ?event.pointerType
          :(window.matchMedia&&window.matchMedia('(pointer: coarse)').matches?'touch':'mouse');
        if(typePointeur==='mouse'){
          afficherDetailsCubeInfiniAdventureIdleV220_();
          return;
        }
        /*
         * Téléphone (Norman, 2026-10-09 : le Cube de l'infini nécessite un appui long pour ouvrir son popup ; c'est le seul item qui fonctionnait différemment) : comme les autres objets, un appui simple n'ouvre plus
         * rien ; le popup s'ouvre au maintien (voir l'écouteur « soreal-longpress ») et le double tap absorbe tous les boosts (avec l'achat correspondant).
         */
        toucherCubeAdventureIdleV1_();
      }

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
          (item?iconeObjetAdventureIdleV138_(item):'<i class="dsn-v1 dsn-corbeille" aria-hidden="true"></i>')+
        '</div>';
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-257 */
      function decisionActionSlotAdventureIdleV138_(sourceId,occupantId){
        if(!occupantId||occupantId===sourceId)return 'equiper';
        if(!REG.idleEtat)return 'equiper';
        const a=aventureMetaIdleV47_(REG.idleEtat);
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

      function statsHtmlObjetAdventureIdleV138_(item){
        if(!(item.kind==='equipment'||item.kind==='special'||item.kind==='cube'))return '';
        const niveau=idleEntier_(item.level);
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

        /*
         * Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-268 -- Ordre (2026-09-27, Norman : « Dans NGU, c'est Power / Max HP /
         * Toughness / HP Regen ») : Power et Max HP se boostent avec les boosts oranges (Power), Toughness et HP Regen avec les
         * boosts bleus (Toughness) -- l'ordre affiché regroupe donc les deux paires par boost, comme sur le wiki NGU, plutôt que
         * Power/Toughness/MaxHP/Regen (ordre "brut" du moteur, qui sépare les deux paires).
         */
        return '<div class="soreal-idle-v138-details-stats">'+
            (basePower>0
              ?'<div class="soreal-idle-v138-details-stat"><span class="sb-power-v1">Puissance</span><b>'+
                '<span class="soreal-idle-v138-stat-value-v1'+(powerMaxAtteint?' maxed':'')+'">'+formatGrandNombreIdleV70_(idleNombre_(item.power))+'</span>'+
                ' / '+formatGrandNombreIdleV70_(maxPower)+
              '</b></div>'
              :''
            )+
            (baseHp>0
              ?'<div class="soreal-idle-v138-details-stat"><span class="sb-power-v1">PV Max</span><b>'+
                '<span class="soreal-idle-v138-stat-value-v1'+(hpMaxAtteint?' maxed':'')+'">'+formatGrandNombreIdleV70_(itemHp)+'</span>'+
                ' / '+formatGrandNombreIdleV70_(maxHp)+
              '</b></div>'
              :''
            )+
            (baseToughness>0
              ?'<div class="soreal-idle-v138-details-stat"><span class="sb-toughness-v1">Endurance</span><b>'+
                '<span class="soreal-idle-v138-stat-value-v1'+(toughnessMaxAtteint?' maxed':'')+'">'+formatGrandNombreIdleV70_(idleNombre_(item.toughness))+'</span>'+
                ' / '+formatGrandNombreIdleV70_(maxToughness)+
              '</b></div>'
              :''
            )+
            (baseRegen>0
              ?'<div class="soreal-idle-v138-details-stat"><span class="sb-toughness-v1">Regen PV</span><b>'+
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
                  return '<div class="soreal-idle-v138-details-stat"><span class="sb-special-v1">Special: '+idleHtml_(idleLabelSpecialBonusV1_(sv.type))+'</span><b>'+
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
              return '<div class="soreal-idle-v138-details-stat"><span class="sb-special-v1">Special Bonus: '+idleHtml_(label)+'</span><b>'+
                '<span class="soreal-idle-v138-stat-value-v1'+(specialMaxAtteint?' maxed':'')+'">'+formatGrandNombreIdleV70_(idleNombre_(item.special))+'</span>'+
                ' / '+formatGrandNombreIdleV70_(maxSpecial)+
              '</b></div>';
            })()+
          '</div>';
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-262 */
      function afficherDetailsObjetAdventureIdleV138_(itemId){
        const root=document.getElementById('soreal-idle-v138-details');
        const corps=document.getElementById('soreal-idle-v138-details-body');
        if(!root||!corps)return;

        const id=String(itemId||'');
        const a=REG.idleEtat&&aventureMetaIdleV47_(REG.idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const item=id?items.find(function(x){return String(x&&x.id)===id;}):null;

        if(!item){
          REG.idleFicheObjetOuverteIdV1='';
          root.style.display='none';
          corps.innerHTML='';
          return;
        }
        REG.idleFicheObjetOuverteIdV1=id;

        const niveau=idleEntier_(item.level);
        const statsHtml=statsHtmlObjetAdventureIdleV138_(item);

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-270 */
        const equipement=a&&a.equipment||{};
        const estEquipe=
          ['head','chest','legs','boots','weapon','weapon2'].some(function(slot){return String(equipement[slot]||'')===id;}) ||
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
          String(REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.difficulty||'')==='extreme';
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
        /* Objet de déblocage (A Number, Giant Seed, Scrap of Paper, UUG's Armpit Hair, Pissed Off Key, copie de Wandoos 98) : « Utiliser » le consomme et débloque son système pour toujours. */
        const deblocageObjet=deblocageParObjetIdleV1_(a,item);
        const boutonDebloquer=deblocageObjet
          ?'<button type="button" class="soreal-idle-expand-button-v25" title="Utilise l’objet : il disparaît du sac et débloque '+idleHtml_(deblocageObjet.systeme)+' pour toujours" onclick="window.__utiliserObjetDeblocageIdleV1__(\''+idleHtml_(id)+'\');window.__fermerDetailsObjetAdventureIdleV1__();">🔓 Utiliser</button>'
          :'';
        const boutonInstallerOs=((item.definitionId==='wandoos98'&&!deblocageObjet)||item.definitionId==='wandoosXl')
          ?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__actionMetaIdleV130__({action:\'consumeWandoosCopy\',itemId:\''+idleHtml_(id)+'\'});window.__fermerDetailsObjetAdventureIdleV1__();">💾 Installer l’OS</button>'
          :'';
        /* A Giant Seed réutilisée (Yggdrasil débloqué) : max(1, ⌊L + L²/100⌋) graines, action méta consumeGiantSeed. */
        const boutonSemerGraine=(item.definitionId==='giantSeed'&&!item.locked&&!deblocageObjet)
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
            boutonDebloquer+
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

      function positionnerPopupObjetAdventureIdleV1_(root){
        const largeur=root.offsetWidth||320;
        const hauteur=root.offsetHeight||160;
        const margeMax={
          left:Math.max(8,window.innerWidth-largeur-8),
          top:Math.max(8,window.innerHeight-hauteur-8)
        };
        if(!REG.idleItemPopupPositionV1_){
          REG.idleItemPopupPositionV1_={
            left:Math.max(8,Math.round((window.innerWidth-largeur)/2)),
            top:Math.max(8,Math.round((window.innerHeight-hauteur)/3))
          };
        }
        REG.idleItemPopupPositionV1_.left=Math.min(margeMax.left,Math.max(8,REG.idleItemPopupPositionV1_.left));
        REG.idleItemPopupPositionV1_.top=Math.min(margeMax.top,Math.max(8,REG.idleItemPopupPositionV1_.top));
        root.style.left=REG.idleItemPopupPositionV1_.left+'px';
        root.style.top=REG.idleItemPopupPositionV1_.top+'px';
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
          REG.idleItemPopupPositionV1_={left:nouveauLeft,top:nouveauTop};
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

      function fermerComparaisonObjetAdventureIdleV183_(){
        const second=document.getElementById('soreal-idle-v138-details-compare-v183');/* ancien second popup (plus créé : la comparaison tient dans une seule fenêtre) */
        if(second)second.remove();
        idleAdventureComparerPremierV183='';
        REG.idleComparaisonIdsV1=[];
        REG.idleAdventureComparerEnAttenteV183=false;
        const primary=document.getElementById('soreal-idle-v138-details');
        if(primary){primary.classList.remove('idle-compare-v183');primary.style.maxHeight='';}
      }

      function comparerObjetAdventureIdleV183_(id){
        fermerComparaisonObjetAdventureIdleV183_();
        idleAdventureComparerPremierV183=String(id||'');
        REG.idleAdventureComparerEnAttenteV183=true;
        /* Le popup cachait le sac (surtout sur téléphone) : on le masque pendant le choix du deuxième objet, il revient avec la comparaison. */
        const popup=document.getElementById('soreal-idle-v138-details');
        if(popup)popup.style.display='none';
        toastIdleV5_('Choisis maintenant le deuxième objet à comparer.');
      }

      function ouvrirComparaisonObjetAdventureIdleV183_(secondId){
        const firstId=String(idleAdventureComparerPremierV183||'');
        const second=String(secondId||'');
        if(!firstId||!second||firstId===second)return false;

        const root=document.getElementById('soreal-idle-v138-details');
        const corps=document.getElementById('soreal-idle-v138-details-body');
        if(!root||!corps)return false;

        if(!composerCorpsComparaisonIdleV1_(corps,firstId,second))return false;
        REG.idleComparaisonIdsV1=[firstId,second];
        root.style.display='block';
        root.classList.add('idle-compare-v183');

        poserFenetreComparaisonIdleV1_(root,root.offsetLeft,root.offsetTop);
        activerGlisserPopupObjetAdventureIdleV1_(root);
        REG.idleAdventureComparerEnAttenteV183=false;
        return true;
      }

      function fermerDetailsObjetAdventureIdleV1_(){
        fermerComparaisonObjetAdventureIdleV183_();
        const primary=document.getElementById('soreal-idle-v138-details');
        if(primary)primary.style.width='';
        afficherDetailsObjetAdventureIdleV138_('');
      }

      function clicTrashAdventureIdleV138_(){
        const a=REG.idleEtat&&aventureMetaIdleV47_(REG.idleEtat);
        if(a&&a.trash)recupererObjetTrashAdventureIdleV165_();
      }

      function rendreBonusEquipementAdventureIdleV1_(a){
        const stats=(a&&a.stats)||{};
        const power=idleNombre_(stats.power);
        const toughness=idleNombre_(stats.toughness);
        const hp=idleNombre_(stats.hp);
        const regen=idleNombre_(stats.regen);
        const specials=stats.specials||{};

        const lignes=
          (power>0?'<div class="soreal-idle-v138-details-stat"><span class="sb-power-v1">Puissance</span><b>+'+formatGrandNombreIdleV70_(power)+'</b></div>':'')+
          (toughness>0?'<div class="soreal-idle-v138-details-stat"><span class="sb-toughness-v1">Endurance</span><b>+'+formatGrandNombreIdleV70_(toughness)+'</b></div>':'')+
          (hp>0?'<div class="soreal-idle-v138-details-stat"><span class="sb-power-v1">PV Max</span><b>+'+formatGrandNombreIdleV70_(hp)+'</b></div>':'')+
          (regen>0?'<div class="soreal-idle-v138-details-stat"><span class="sb-toughness-v1">Regen PV/s</span><b>+'+formatGrandNombreIdleV70_(regen,2)+'</b></div>':'');

        const specialLignes=REG.IDLE_SPECIAL_BONUS_TYPES_V1_
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

      function rendreCoffreAdventureIdleV1_(slots){
        /* ANTI-SPOIL (règle n°2) : seules les cases déjà découvertes sont listées (ni « ??? », ni total). */
        slots=slots.filter(function(s){return s&&s.decouvert;});
        const occupees=slots.filter(function(s){return s&&s.occupe;}).length;
        const grille=grilleCoffreAdventureIdleV1_(slots);
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-282 */
        const ouvert=idleCoffreOuvertV1_();
        return rendreCadreCoffreAdventureIdleV1_(grille,occupees,ouvert);
      }

      /* Grille du coffre (cases + pagination), filtrée par la recherche. */
      function grilleCoffreAdventureIdleV1_(slots){
        slots=slots.filter(function(s){return s&&s.decouvert;});
        const requete=normaliserRechercheIdleV1_(REG.idleRechercheCoffreV1);
        if(requete)slots=slots.filter(function(s){return caseCoffreCorrespondIdleV1_(s,requete);});
        if(requete&&!slots.length)return '<div class="soreal-idle-note-v4" style="padding:8px 2px">Aucun objet du coffre ne correspond à « '+idleHtml_(REG.idleRechercheCoffreV1.trim())+' ».</div>';
        const totalPagesCoffre=Math.max(1,Math.ceil(slots.length/REG.IDLE_PAGINATION_TAILLE_V1));
        if(REG.idlePageCoffreV1>totalPagesCoffre)REG.idlePageCoffreV1=totalPagesCoffre;
        const debutPageCoffre=(REG.idlePageCoffreV1-1)*REG.IDLE_PAGINATION_TAILLE_V1;
        const slotsPage=slots.slice(debutPageCoffre,debutPageCoffre+REG.IDLE_PAGINATION_TAILLE_V1);

        /* Norman (2026-10-01) : cases regroupées (zones, titans, cœurs, Looty, pendentifs...) avec un titre de section ; seules les cases déjà découvertes sont listées, donc jamais de titre de groupe encore inconnu. */
        let groupePrecedent=debutPageCoffre>0&&slots[debutPageCoffre-1]?String(slots[debutPageCoffre-1].groupeNom||''):null;
        /*
         * Mannequins (Norman, 2026-10-03 : « chaque item de set comme s'il était équipé : tête, torse, jambes, bottes, comme si l'armure était posée sur un mannequin ; les sets côte à côte, et en
         * dessous quand la ligne est occupée »). Les pièces d'un même set se rangent comme sur le personnage : colonne de gauche = tête, torse, jambes, bottes ; colonne de droite = arme puis
         * accessoires du set. Les cases gardent leur taille. Anti-spoil : seules les pièces déjà découvertes existent ; une pièce inconnue ne laisse qu'un vide, jamais une case grisée.
         */
        /*
         * Filtre de butin amélioré (Norman, 2026-10-03 : « quand on achète le filtre de loot spécial, c'est dans le coffre qu'on doit pouvoir désactiver un objet en particulier »). Une fois acheté, chaque
         * case du coffre porte un petit bouton : un objet filtré n'est plus ramassé dans la zone en cours (chaque zone a son filtre). Il n'existe QUE pour les objets déjà découverts (les seuls du coffre).
         */
        const iaFiltre=REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.inventoryAuto;
        const filtreAmeliore=Boolean(iaFiltre&&iaFiltre.unlocked&&iaFiltre.unlocked.lootFilterImproved);
        const defsFiltrees=filtreAmeliore&&iaFiltre.lootFilter&&Array.isArray(iaFiltre.lootFilter.items)?iaFiltre.lootFilter.items:[];
        function boutonFiltre(s){
          if(!filtreAmeliore)return '';
          const filtre=defsFiltrees.indexOf(s.definitionId)!==-1;
          return '<button type="button" class="soreal-idle-coffre-filtre-v1'+(filtre?' actif':'')+'" '+
            'title="'+(filtre?'Filtré : cet objet n’est plus ramassé dans cette zone. Clique pour le ramasser de nouveau.':'Clique pour ne plus ramasser cet objet dans cette zone.')+'" '+
            'onclick="event.stopPropagation();window.__filtrerObjetCoffreIdleV1__(\''+idleHtml_(String(s.definitionId))+'\',this)">'+(filtre?'🚫':'🧹')+'</button>';
        }
        function carteCoffre(s){
          if(!s.occupe){
            return '<div class="soreal-idle-collection-card-v1">'+boutonFiltre(s)+
              '<div class="soreal-idle-collection-card-icon-v1"><span>⬜</span></div>'+
              '<div class="soreal-idle-collection-card-name-v1">'+idleHtml_(s.name)+'</div>'+
            '</div>';
          }
          const item=s.item||{};
          const pseudoItem={set:s.set,slot:s.slot,name:s.name,level:100,definitionId:s.definitionId,wikiItemId:s.wikiItemId,kind:item.kind};
          const rareteClasse=idleRareteClasseObjetAdventureIdleV1_(item);
          const clePopup='coffre:'+String(s.definitionId);
          enregistrerObjetPopupIdleV1_(clePopup,Object.assign({},item,{name:item.name||s.name}),'coffre');
          return '<div class="soreal-idle-collection-card-v1 maxed'+(rareteClasse?' '+rareteClasse:'')+'" '+
            'data-popup-objet-v1="'+idleHtml_(clePopup)+'" '+
            'onclick="window.__consulterObjetIdleV1__(\''+idleHtml_(clePopup)+'\',this)" '+
            'title="Clique pour voir les statistiques (et reprendre l’objet dans l’inventaire)">'+
            /* Coffre épuré (Norman, 2026-10-02) : l'image prend toute la case ; seuls « 100 », le ✔ et le nom (par-dessus l'image) restent. */
            '<div class="soreal-idle-collection-check-v1" title="Niveau maximum">✔</div>'+boutonFiltre(s)+
            '<div class="soreal-idle-collection-card-icon-v1">'+iconeBaseObjetAdventureIdleV138_(pseudoItem)+'</div>'+
            '<div class="soreal-idle-collection-card-level-v1" title="Niveau 100/100">100</div>'+
            '<div class="soreal-idle-collection-card-name-v1">'+idleHtml_(s.name)+'</div>'+
          '</div>';
        }
        const LIGNE_ARMURE={head:1,chest:2,legs:3,boots:4};
        function mannequin(pieces){
          let autres=1;
          const cases=pieces.map(function(p){
            let colonne=2,ligne;
            if(LIGNE_ARMURE[p.slot]){colonne=1;ligne=LIGNE_ARMURE[p.slot];}
            else if(p.slot==='weapon')ligne=1;
            else{autres+=1;ligne=autres;}
            return '<div style="grid-column:'+colonne+';grid-row:'+ligne+'">'+carteCoffre(p)+'</div>';
          }).join('');
          return '<div class="soreal-idle-coffre-mannequin-v1">'+cases+'</div>';
        }
        /*
         * Cadres thématiques (Norman, 2026-10-03 : « les sets côte à côte, et en dessous seulement quand il n'y a plus de place ; un cadre dédié à chaque set qui rappelle la zone d'où il vient, avec ses couleurs et
         * ses décorations ; un thème par set »). Une zone = un cadre (son set posé en mannequin + ses objets) ; pour les titans, un cadre par set puis un cadre pour leurs autres objets. Les cadres se rangent côte à côte
         * et passent à la ligne quand la place manque (centrés sur téléphone). Le thème (couleurs, décor) est choisi par l'identifiant du set, voir « data-theme-set-v1 » dans soreal-idle-ui.css.
         */
        function cadreThematique(cle,titre,corps){
          return '<section class="soreal-idle-coffre-cadre-v1" data-theme-set-v1="'+idleHtml_(cle)+'">'+
            '<header class="soreal-idle-coffre-cadre-titre-v1"><i class="soreal-idle-coffre-cadre-deco-v1" aria-hidden="true"></i><span>'+idleHtml_(titre)+'</span></header>'+
            '<div class="soreal-idle-coffre-cadre-corps-v1">'+corps+'</div>'+
          '</section>';
        }
        const groupesCoffre=[];
        slotsPage.forEach(function(s){
          const nomGroupe=String(s.groupeNom||'');
          let g=groupesCoffre[groupesCoffre.length-1];
          if(!g||g.nom!==nomGroupe){g={nom:nomGroupe,groupe:String(s.groupe||''),sets:[],libres:[]};groupesCoffre.push(g);}
          if(s.set){
            let st=g.sets.find(function(x){return x.id===s.set;});
            if(!st){st={id:s.set,nom:s.setName||nomGroupe,pieces:[]};g.sets.push(st);}
            st.pieces.push(s);
          }else g.libres.push(s);
        });
        let html='';
        const libres=function(liste){return liste.length?'<div class="soreal-idle-coffre-libres-v1">'+liste.map(carteCoffre).join('')+'</div>':'';};
        groupesCoffre.forEach(function(g){
          if(g.groupe==='zone'){
            const cle=g.sets.length?g.sets[0].id:'ciel';
            /* Les accessoires sans set se rangent SOUS l'arme, dans la 2e colonne du mannequin (Norman, 2026-10-11 : « les accessoires en dessous de l'arme plutôt qu'à sa droite : 2 colonnes au lieu de 3 »). */
            const corpsZone=g.sets.length
              ?g.sets.map(function(st,i){return mannequin(i===0?st.pieces.concat(g.libres):st.pieces);}).join('')
              :libres(g.libres);
            html+=cadreThematique(cle,g.nom,corpsZone);
          }else{
            g.sets.forEach(function(st){html+=cadreThematique(st.id,st.nom,mannequin(st.pieces));});
            if(g.libres.length)html+=cadreThematique(g.groupe||'autre',g.nom,libres(g.libres));
          }
        });
        return '<div class="soreal-idle-collection-grid-v1 soreal-idle-coffre-grille-v1 soreal-idle-coffre-mannequins-v1">'+html+'</div>'+
        rendrePaginationIdleV1_(REG.idlePageCoffreV1,totalPagesCoffre,'window.__changerPageCoffreV1__');
      }

      /*
       * Le Coffre est un coffre à pattes, avec des dents et une langue, qui mange les objets pour les ranger (Norman, 2026-10-10 : « un coffre qui fait référence à Discworld »). Dessin original en SVG ; sa gueule est la zone de
       * dépôt. Il croque (couvercle qui claque, corps qui gonfle, bulle) quand un objet est déposé : le drapeau window.__bagageAvaleIdleV1 survit au redessin de la page. Animations : voir « Inventaire v2 » dans soreal-idle-itopod.css.
       */
      const BAGAGE_SVG_IDLE_V1='<svg viewBox="0 0 320 260" aria-hidden="true" focusable="false"><defs>'+
        '<linearGradient id="bgBois" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9783a"/><stop offset=".55" stop-color="#8a5122"/><stop offset="1" stop-color="#5f3414"/></linearGradient>'+
        '<linearGradient id="bgBoisC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cf8d4c"/><stop offset="1" stop-color="#8f5626"/></linearGradient>'+
        '<linearGradient id="bgCuivre" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe58a"/><stop offset=".5" stop-color="#d79a1f"/><stop offset="1" stop-color="#8a5a08"/></linearGradient>'+
        '<linearGradient id="bgLangue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8fa8"/><stop offset="1" stop-color="#d94b6d"/></linearGradient>'+
        '<radialGradient id="bgGueule" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#5a0f1c"/><stop offset="1" stop-color="#1c0309"/></radialGradient></defs>'+
        '<ellipse cx="160" cy="246" rx="120" ry="11" fill="rgba(0,0,0,.45)"/>'+
        '<g><g class="bg-patte"><rect x="62" y="214" width="16" height="26" rx="6" fill="#6a3a16"/><ellipse cx="68" cy="241" rx="14" ry="6" fill="#4a280e"/></g>'+
        '<g class="bg-patte bg-b"><rect x="104" y="218" width="16" height="24" rx="6" fill="#6a3a16"/><ellipse cx="110" cy="243" rx="14" ry="6" fill="#4a280e"/></g>'+
        '<g class="bg-patte"><rect x="132" y="220" width="16" height="22" rx="6" fill="#6a3a16"/><ellipse cx="138" cy="243" rx="14" ry="6" fill="#4a280e"/></g>'+
        '<g class="bg-patte bg-b"><rect x="172" y="220" width="16" height="22" rx="6" fill="#6a3a16"/><ellipse cx="178" cy="243" rx="14" ry="6" fill="#4a280e"/></g>'+
        '<g class="bg-patte"><rect x="200" y="218" width="16" height="24" rx="6" fill="#6a3a16"/><ellipse cx="206" cy="243" rx="14" ry="6" fill="#4a280e"/></g>'+
        '<g class="bg-patte bg-b"><rect x="242" y="214" width="16" height="26" rx="6" fill="#6a3a16"/><ellipse cx="248" cy="241" rx="14" ry="6" fill="#4a280e"/></g></g>'+
        '<g class="bg-corps"><path d="M44 130 L276 130 L270 100 L50 100 Z" fill="url(#bgGueule)"/>'+
        '<path d="M40 128 H280 V214 Q280 228 266 228 H54 Q40 228 40 214 Z" fill="url(#bgBois)" stroke="#3a1d08" stroke-width="4"/>'+
        '<path d="M40 160 H280 M40 192 H280" stroke="#4a2509" stroke-width="3" opacity=".55"/><path d="M96 130 V228 M224 130 V228" stroke="url(#bgCuivre)" stroke-width="12"/>'+
        '<circle cx="96" cy="150" r="3.5" fill="#6a4308"/><circle cx="96" cy="206" r="3.5" fill="#6a4308"/><circle cx="224" cy="150" r="3.5" fill="#6a4308"/><circle cx="224" cy="206" r="3.5" fill="#6a4308"/>'+
        '<rect x="140" y="166" width="40" height="34" rx="6" fill="url(#bgCuivre)" stroke="#6a4308" stroke-width="3"/><circle cx="160" cy="180" r="5" fill="#3a2300"/><rect x="158" y="182" width="4" height="10" fill="#3a2300"/>'+
        '<g fill="#fffbe8" stroke="#6a5a3a" stroke-width="2" stroke-linejoin="round"><path d="M52 130 l10 -20 l10 20z"/><path d="M76 130 l9 -17 l9 17z"/><path d="M102 130 l9 -18 l9 18z"/><path d="M200 130 l9 -18 l9 18z"/><path d="M226 130 l9 -17 l9 17z"/><path d="M248 130 l11 -22 l11 22z"/></g>'+
        '<g class="bg-langue"><path d="M148 126 C144 168 150 208 176 214 C202 208 208 168 204 126 Z" fill="url(#bgLangue)" stroke="#8f2a45" stroke-width="3" stroke-linejoin="round"/><path d="M176 134 L176 196" stroke="#b83a58" stroke-width="3" stroke-linecap="round"/><ellipse cx="164" cy="168" rx="4" ry="9" fill="#ffb3c4" opacity=".55"/></g>'+
        '<g class="bg-couvercle"><path d="M40 126 V92 Q40 52 90 48 H230 Q280 52 280 92 V126 Z" fill="url(#bgBoisC)" stroke="#3a1d08" stroke-width="4"/><path d="M54 74 Q160 52 266 74" stroke="#5a3010" stroke-width="3" fill="none" opacity=".5"/>'+
        '<path d="M96 52 V126 M224 52 V126" stroke="url(#bgCuivre)" stroke-width="12"/><circle cx="96" cy="86" r="3.5" fill="#6a4308"/><circle cx="224" cy="86" r="3.5" fill="#6a4308"/>'+
        '<g fill="#fffbe8" stroke="#6a5a3a" stroke-width="2" stroke-linejoin="round"><path d="M56 126 l10 20 l10 -20z"/><path d="M80 126 l9 17 l9 -17z"/><path d="M108 126 l9 19 l9 -19z"/><path d="M130 126 l8 14 l8 -14z"/><path d="M174 126 l8 14 l8 -14z"/><path d="M198 126 l9 19 l9 -19z"/><path d="M228 126 l9 17 l9 -17z"/><path d="M250 126 l10 20 l10 -20z"/></g></g></g></svg>';

      const BAGAGE_OBJETS_IDLE_V1=['🗡️','🛡️','👢','💍','🪖','📿','🧪'];

      const BAGAGE_CRIS_IDLE_V1=['*Gloups !*','*Miam.*','*Rrrot.*','*Crounch !*','*Encore.*'];

      /* Cadre du coffre : titre repliable, case de dépôt, champ de recherche et grille. */
      function rendreCadreCoffreAdventureIdleV1_(grille,occupees,ouvert){
        /* Un vrai coffre (Norman, 2026-10-02 : « ça fait classeur ») : bois, bandes de fer, couvercle ; voir .soreal-idle-coffre-v1 (soreal-idle-ui.css). */
        return '<div class="soreal-idle-section-v8 soreal-idle-coffre-v1'+(ouvert?' ouvert':'')+'">'+
          '<div class="soreal-idle-window-title-v31 soreal-idle-coffre-titre-v1" '+
            'onclick="window.__toggleCoffreOuvertAdventureIdleV1__()" '+
            'role="button" tabindex="0" aria-expanded="'+(ouvert?'true':'false')+'">'+
            '<span><i class="dsn-v1 dsn-coffre" aria-hidden="true"></i> Coffre ('+occupees+')</span>'+
            '<span class="soreal-idle-coffre-chevron-v1">'+(ouvert?'▲':'▼')+'</span>'+
          '</div>'+
          '<div class="soreal-idle-v138-cube-slot" data-idle-coffre-drop-v180 '+
            'ondragover="window.__survolCibleAdventureIdleV138__(event)" '+
            'ondragleave="window.__quitterCibleAdventureIdleV138__(event)" '+
            'ondrop="window.__deposerSurCoffreAdventureIdleV1__(event)" '+
            'onclick="window.__clicCoffreAdventureIdleV1__()"'+
            '>'+
            '<div class="bg-bagage-v1'+(Date.now()-(window.__bagageAvaleIdleV1||0)<1300?' croque':'')+'">'+
              '<span class="bg-bulle-v1">'+BAGAGE_CRIS_IDLE_V1[Math.floor(Math.random()*BAGAGE_CRIS_IDLE_V1.length)]+'</span>'+
              '<span class="bg-objet-v1">'+BAGAGE_OBJETS_IDLE_V1[Math.floor(Math.random()*BAGAGE_OBJETS_IDLE_V1.length)]+'</span>'+
              BAGAGE_SVG_IDLE_V1+
            '</div>'+
            '<div class="bg-texte-v1"><b>Il mange les objets pour les ranger.</b>'+
              '<span>Glisse ici un objet réellement maxé : il croque, avale, rote, puis le range quelque part là-dedans. Ne lui mets pas les doigts.</span></div>'+
          '</div>'+
          (ouvert?'<div style="margin-top:10px">'+
            '<input type="search" id="sorealIdleCoffreRechercheV1" class="soreal-idle-coffre-recherche-v1" placeholder="🔎 Rechercher : un nom, ou une stat (Magic Power…)" value="'+idleHtml_(REG.idleRechercheCoffreV1)+'" oninput="window.__rechercheCoffreV1__(this.value)" autocomplete="off" spellcheck="false">'+
            '<div id="sorealIdleCoffreGrilleV1">'+grille+'</div>'+
          '</div>':'')+
        '</div>';
      }

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
        if(root&&REG.idleEtat)rafraichirMenuRacineIdleV28_();
      }

      function deposerSurCoffreAdventureIdleV1_(event){
        if(event){event.preventDefault();event.stopPropagation();}
        const id=idSourceAdventureIdleV138_(event);
        nettoyerEtatDragAdventureIdleV138_();
        if(id){window.__bagageAvaleIdleV1=Date.now();actionAdventureIdleV47_({action:'coffreDeposer',id:String(id)});}
      }

      function clicCoffreAdventureIdleV1_(){
        toggleCoffreOuvertAdventureIdleV1_();
      }

      function retirerDuCoffreAdventureIdleV1_(id){
        if(!id)return;
        actionAdventureIdleV47_({action:'coffreRetirer',id:String(id)});
      }

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
          ' · Puissance '+formatGrandNombreIdleV70_(cube.power||0)+
          ' · Endurance '+formatGrandNombreIdleV70_(cube.toughness||0)
        );

        return '<div class="soreal-idle-v138-slot soreal-idle-v138-slot-cube" data-idle-cube-drop-v180 data-soreal-longpress="idle-cube" '+
          'ondragover="window.__survolCibleAdventureIdleV138__(event)" '+
          'ondragleave="window.__quitterCibleAdventureIdleV138__(event)" '+
          'ondrop="window.__deposerSurCubeAdventureIdleV138__(event)" '+
          'onclick="window.__clicCubeAdventureIdleV138__(event)"'+
          '>'+
          '<div class="soreal-idle-v138-slot-icon" title="'+titre+'">'+
            '<img src="'+idleHtml_(urlImageCubeInfiniAdventureIdleV1_(tier))+'" alt="" loading="lazy" '+
            'onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'block\'">'+
            '<span style="display:none">🧊</span>'+
          '</div>'+
        '</div>';
      }

  Object.assign(REG,{
    poserNoteCombatAdventureIdleV1_:poserNoteCombatAdventureIdleV1_,
    surveillerEvenementsAventureIdleV1_:surveillerEvenementsAventureIdleV1_,
    zoneAventureLocaleIdleV30_:zoneAventureLocaleIdleV30_,
    cooldownAventureRestantIdleV100_:cooldownAventureRestantIdleV100_,
    actualiserCooldownAventureIdleV100_:actualiserCooldownAventureIdleV100_,
    combattreAventureIdleV17_:combattreAventureIdleV17_,
    ajouterLogAventureIdleV1_:ajouterLogAventureIdleV1_,
    verifierDefaiteAutoAventureIdleV1_:verifierDefaiteAutoAventureIdleV1_,
    dessinerJournalAventureIdleV1_:dessinerJournalAventureIdleV1_,
    restaurerScrollJournalAventureIdleV1_:restaurerScrollJournalAventureIdleV1_,
    revisionAdventureServeurIdleV208_:revisionAdventureServeurIdleV208_,
    fusionnerAdventureServeurAvecInventaireLocalV208_:fusionnerAdventureServeurAvecInventaireLocalV208_,
    joueurAvecAdventureIdleV208_:joueurAvecAdventureIdleV208_,
    memoriserAdventureDiffereeIdleV208_:memoriserAdventureDiffereeIdleV208_,
    appliquerAdventureDiffereeIdleV208_:appliquerAdventureDiffereeIdleV208_,
    estMutationInventaireAdventureIdleV160_:estMutationInventaireAdventureIdleV160_,
    casesSacAdventureIdleV162_:casesSacAdventureIdleV162_,
    patchInventaireAdventureIdleV160_:patchInventaireAdventureIdleV160_,
    remplacerAdventureInventaireIdleV160_:remplacerAdventureInventaireIdleV160_,
    actionAdventureIdleV47_:actionAdventureIdleV47_,
    selectionnerZoneAdventureIdleV47_:selectionnerZoneAdventureIdleV47_,
    patchZoneAdventureSansReflowIdleV1_:patchZoneAdventureSansReflowIdleV1_,
    zoneAdventurePrecedenteV1_:zoneAdventurePrecedenteV1_,
    zoneAdventureSuivanteV1_:zoneAdventureSuivanteV1_,
    reinitialiserHorlogeRegenReposAdventureIdleV166_:reinitialiserHorlogeRegenReposAdventureIdleV166_,
    ecouleRegenReposAdventureIdleV166_:ecouleRegenReposAdventureIdleV166_,
    texteProchainCombatAdventureIdleV165_:texteProchainCombatAdventureIdleV165_,
    annulerRespawnAdventureIdleV165_:annulerRespawnAdventureIdleV165_,
    programmerRespawnAdventureIdleV165_:programmerRespawnAdventureIdleV165_,
    competenceAdventureDisponibleIdleV4_:competenceAdventureDisponibleIdleV4_,
    definitionCompetenceAdventureIdleV3_:definitionCompetenceAdventureIdleV3_,
    beastModeActifAdventureIdleV4_:beastModeActifAdventureIdleV4_,
    multiplicateurPowerManuelAdventureIdleV3_:multiplicateurPowerManuelAdventureIdleV3_,
    multiplicateurToughnessManuelAdventureIdleV3_:multiplicateurToughnessManuelAdventureIdleV3_,
    intervalleIdleAttackAdventureIdleV4_:intervalleIdleAttackAdventureIdleV4_,
    cooldownDureeAdventureIdleV4_:cooldownDureeAdventureIdleV4_,
    rafraichirCommandesAdventureIdleV3_:rafraichirCommandesAdventureIdleV3_,
    basculerIdleModeAdventureIdleV3_:basculerIdleModeAdventureIdleV3_,
    attaqueManuelleAdventureIdleV3_:attaqueManuelleAdventureIdleV3_,
    utiliserCompetenceAdventureIdleV3_:utiliserCompetenceAdventureIdleV3_,
    rendreCommandesAdventureIdleV3_:rendreCommandesAdventureIdleV3_,
    libelleEnnemiAdventureIdleV1_:libelleEnnemiAdventureIdleV1_,
    regenReposAdventureIdleV3_:regenReposAdventureIdleV3_,
    facteurAleatoireDegatsAdventureIdleV2_:facteurAleatoireDegatsAdventureIdleV2_,
    degatsJoueurAdventureIdleV2_:degatsJoueurAdventureIdleV2_,
    degatsEnnemiAdventureIdleV2_:degatsEnnemiAdventureIdleV2_,
    multiplicateurIdleAttackAdventureIdleV2_:multiplicateurIdleAttackAdventureIdleV2_,
    intervalleAttaqueEnnemiAdventureIdleV2_:intervalleAttaqueEnnemiAdventureIdleV2_,
    identiteFightAdventureIdleV2_:identiteFightAdventureIdleV2_,
    resetHorlogesFightAdventureIdleV2_:resetHorlogesFightAdventureIdleV2_,
    envoyerResolutionAdventurePendingV2_:envoyerResolutionAdventurePendingV2_,
    appliquerRegenCombatAdventureIdleV2_:appliquerRegenCombatAdventureIdleV2_,
    terminerCombatAdventureLocalV2_:terminerCombatAdventureLocalV2_,
    impactMonstreAdventureIdleV1_:impactMonstreAdventureIdleV1_,
    consommerDeblocageAdventureIdleV47_:consommerDeblocageAdventureIdleV47_,
    consommerObjetSkillAdventureIdleV4_:consommerObjetSkillAdventureIdleV4_,
    transformerObjetAdventureIdleV4_:transformerObjetAdventureIdleV4_,
    desequiperObjetAdventureIdleV47_:desequiperObjetAdventureIdleV47_,
    toggleMenuZoneAdventureIdleV1_:toggleMenuZoneAdventureIdleV1_,
    pageAventureIdleV28_:pageAventureIdleV28_,
    libelleRecompenseSetAdventureIdleV163_:libelleRecompenseSetAdventureIdleV163_,
    iconeObjetAdventureIdleV138_:iconeObjetAdventureIdleV138_,
    idleRareteClasseObjetAdventureIdleV1_:idleRareteClasseObjetAdventureIdleV1_,
    rendreSlotPaperdollAdventureIdleV138_:rendreSlotPaperdollAdventureIdleV138_,
    rendreAccessoiresAdventureIdleV138_:rendreAccessoiresAdventureIdleV138_,
    rendreCarteSacAdventureIdleV138_:rendreCarteSacAdventureIdleV138_,
    rendreGrilleSacAdventureIdleV1_:rendreGrilleSacAdventureIdleV1_,
    deposerSurEmplacementVideSacAdventureIdleV1_:deposerSurEmplacementVideSacAdventureIdleV1_,
    elementObjetGesteAdventureIdleV196_:elementObjetGesteAdventureIdleV196_,
    popupDetailsObjetAdventureIdleOuvertV207_:popupDetailsObjetAdventureIdleOuvertV207_,
    cibleDansPopupDetailsObjetAdventureIdleV207_:cibleDansPopupDetailsObjetAdventureIdleV207_,
    ouvrirDetailsObjetParGesteAdventureIdleV196_:ouvrirDetailsObjetParGesteAdventureIdleV196_,
    installerGestesInventaireAdventureIdleV196_:installerGestesInventaireAdventureIdleV196_,
    survolCibleAdventureIdleV138_:survolCibleAdventureIdleV138_,
    quitterCibleAdventureIdleV138_:quitterCibleAdventureIdleV138_,
    equiperParIdAdventureIdleV138_:equiperParIdAdventureIdleV138_,
    deposerSurCubeAdventureIdleV138_:deposerSurCubeAdventureIdleV138_,
    clicCubeAdventureIdleV138_:clicCubeAdventureIdleV138_,
    supprimerObjetAdventureIdleV165_:supprimerObjetAdventureIdleV165_,
    basculerVerrouObjetAdventureIdleV165_:basculerVerrouObjetAdventureIdleV165_,
    deposerSurTrashAdventureIdleV138_:deposerSurTrashAdventureIdleV138_,
    rendreTrashAdventureIdleV165_:rendreTrashAdventureIdleV165_,
    statsHtmlObjetAdventureIdleV138_:statsHtmlObjetAdventureIdleV138_,
    afficherDetailsObjetAdventureIdleV138_:afficherDetailsObjetAdventureIdleV138_,
    activerGlisserPopupObjetAdventureIdleV1_:activerGlisserPopupObjetAdventureIdleV1_,
    fermerComparaisonObjetAdventureIdleV183_:fermerComparaisonObjetAdventureIdleV183_,
    comparerObjetAdventureIdleV183_:comparerObjetAdventureIdleV183_,
    fermerDetailsObjetAdventureIdleV1_:fermerDetailsObjetAdventureIdleV1_,
    clicTrashAdventureIdleV138_:clicTrashAdventureIdleV138_,
    rendreBonusEquipementAdventureIdleV1_:rendreBonusEquipementAdventureIdleV1_,
    rendreCoffreAdventureIdleV1_:rendreCoffreAdventureIdleV1_,
    grilleCoffreAdventureIdleV1_:grilleCoffreAdventureIdleV1_,
    toggleCoffreOuvertAdventureIdleV1_:toggleCoffreOuvertAdventureIdleV1_,
    deposerSurCoffreAdventureIdleV1_:deposerSurCoffreAdventureIdleV1_,
    clicCoffreAdventureIdleV1_:clicCoffreAdventureIdleV1_,
    retirerDuCoffreAdventureIdleV1_:retirerDuCoffreAdventureIdleV1_,
    rendreSlotCubeInfiniAdventureIdleV1_:rendreSlotCubeInfiniAdventureIdleV1_
  });
})();
