/*
 * SOREAL IDLE — Popups de progression et résumé hors ligne (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_popups_v1)return;
  REG.__chargé_ui_popups_v1=true;

  function idleVusServeurV1_(){return REG.idleVusServeurV1_.apply(null,arguments);}
  function generationJoueurIdleV75_(){return REG.generationJoueurIdleV75_.apply(null,arguments);}
  function idleMenusAckListeLocaleV1_(){return REG.idleMenusAckListeLocaleV1_.apply(null,arguments);}
  function idleVuIdTutorielV1_(){return REG.idleVuIdTutorielV1_.apply(null,arguments);}
  function idleTutorielPagesDejaVuLocalV1_(){return REG.idleTutorielPagesDejaVuLocalV1_.apply(null,arguments);}
  function menuDisponibleIdleV28_(){return REG.menuDisponibleIdleV28_.apply(null,arguments);}
  function menuIdleV28_(){return REG.menuIdleV28_.apply(null,arguments);}
  function definirCombatBossIdleV39_(){return REG.definirCombatBossIdleV39_.apply(null,arguments);}
  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function texteVoixNouveauteIdleV1_(){return REG.texteVoixNouveauteIdleV1_.apply(null,arguments);}
  function ancienTutorielPermisIdleV1_(){return REG.ancienTutorielPermisIdleV1_.apply(null,arguments);}
  function demarrerTutorielPagesIdleV1_(){return REG.demarrerTutorielPagesIdleV1_.apply(null,arguments);}
  function idleNombre_(){return REG.idleNombre_.apply(null,arguments);}
  function resumeStatsIdleV28_(){return REG.resumeStatsIdleV28_.apply(null,arguments);}
  function formatGrandNombreIdleV70_(){return REG.formatGrandNombreIdleV70_.apply(null,arguments);}
  function formatDureeRunIdleV1_(){return REG.formatDureeRunIdleV1_.apply(null,arguments);}
  function dureeRunSecondesIdleV1_(){return REG.dureeRunSecondesIdleV1_.apply(null,arguments);}
  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function statsHtmlObjetAdventureIdleV138_(){return REG.statsHtmlObjetAdventureIdleV138_.apply(null,arguments);}
  function enteteFicheObjetIdleV1_(){return REG.enteteFicheObjetIdleV1_.apply(null,arguments);}
  function piedFicheObjetIdleV1_(){return REG.piedFicheObjetIdleV1_.apply(null,arguments);}
  function activerGlisserPopupObjetAdventureIdleV1_(){return REG.activerGlisserPopupObjetAdventureIdleV1_.apply(null,arguments);}
  function formatEnergieIdleV50_(){return REG.formatEnergieIdleV50_.apply(null,arguments);}
  function aventureMetaIdleV47_(){return REG.aventureMetaIdleV47_.apply(null,arguments);}

      let idleVusEnvoiEnCoursV1=false;

      function idleVuConnuV1_(j,id){
        return REG.idleVusMemoireV1[id]===true||idleVusServeurV1_(j).indexOf(id)!==-1;
      }

      function idleVusEnvoyerV1_(){
        if(idleVusEnvoiEnCoursV1||!REG.idleVusEnAttenteV1.length||!SOREAL_SESSION)return;
        const lot=REG.idleVusEnAttenteV1.slice(0,50);
        idleVusEnvoiEnCoursV1=true;
        try{
          google.script.run
            .withSuccessHandler(function(res){
              idleVusEnvoiEnCoursV1=false;
              if(!res||!res.ok)return;
              REG.idleVusEnAttenteV1=REG.idleVusEnAttenteV1.filter(function(id){return lot.indexOf(id)===-1;});
              if(REG.idleEtat&&REG.idleEtat.profil&&REG.idleEtat.profil.stats&&Array.isArray(res.vus)){
                REG.idleEtat.profil.stats.vus=res.vus;
              }
              if(REG.idleVusEnAttenteV1.length)idleVusEnvoyerV1_();
            })
            .withFailureHandler(function(){
              idleVusEnvoiEnCoursV1=false;
            })
            .marquerVusSorealIdle(SOREAL_SESSION,lot);
        }catch(e){
          idleVusEnvoiEnCoursV1=false;
        }
      }

      /*
       * Audit de Collection (Norman, 2026-10-05) : ouvrir un menu marque plusieurs choses « vues » à la suite (le menu, son tutoriel, un texte…) et chacune partait seule : deux appels serveur à la même milliseconde.
       * Les identifiants marqués dans la même rafale partent maintenant ensemble, 400 ms après le premier (la mémoire locale, elle, est à jour tout de suite).
       */
      let idleVusMinuterieV1=0;

      function idleVuMarquerV1_(id){
        REG.idleVusMemoireV1[id]=true;
        if(REG.idleVusEnAttenteV1.indexOf(id)===-1)REG.idleVusEnAttenteV1.push(id);
        if(idleVusMinuterieV1)return;
        idleVusMinuterieV1=setTimeout(function(){
          idleVusMinuterieV1=0;
          idleVusEnvoyerV1_();
        },400);
      }

      /* Une fois par partie chargée : ce que le navigateur sait déjà « vu » est confié au serveur (anciens joueurs). */
      function idleVusMigrerLocalV1_(j){
        if(!j)return;
        const generation=generationJoueurIdleV75_(j);
        if(REG.idleVusMigreV1===generation)return;
        REG.idleVusMigreV1=generation;
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

      function fermerPopupNouveauteIdleV75_(){
        const modal=
          document.getElementById(
            'sorealIdleNouveauteModalV75'
          );

        if(modal){
          modal.remove();
        }

        REG.idlePopupActifV75=false;

        if(
          !REG.idlePopupQueueV75.length
        ){
          REG.idlePopupBloqueCombatV102=false;
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
            REG.idleEtat
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

      function afficherProchainePopupIdleV75_(){
        if(
          REG.idlePopupActifV75 ||
          !REG.idlePopupQueueV75.length
        ){
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-127 */
        REG.idlePopupBloqueCombatV102=true;

        if(
          REG.idleEtat &&
          REG.idleEtat.combatBossActif
        ){
          REG.idleEtat.combatBossActif=false;
          REG.idleVictoireBossLocaleV49=false;

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
          REG.idlePopupQueueV75.shift();

        if(!info){
          return;
        }

        REG.idlePopupActifV75=true;

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
                (info._cle&&window.__SOREAL_IDLE_TEXTES_V1__?'<div style="margin-top:10px">'+window.__SOREAL_IDLE_TEXTES_V1__.boutonHtml(info._cle)+'</div>':'')+
              '</div>'+
            '</div>'+
            /* Un seul bouton (2026-09-26, Norman : « ça n'a plus lieu d'être, il me faut juste Continuer ») : le popup s'ouvre déjà dans le menu concerné. */
            '<div class="soreal-idle-modal-actions-v63" style="grid-template-columns:1fr">'+
              '<button type="button" class="soreal-idle-modal-button-v63 cancel" onclick="window.__fermerPopupNouveauteIdleV75__()">'+
                idleHtml_(info.bouton||'Continuer')+
              '</button>'+
            '</div>'+
          '</div>';

        document.body.appendChild(modal);
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-128 */
      function gererPopupsProgressionIdleV75_(j){
        if(!j)return;
        if(!ancienTutorielPermisIdleV1_())return;

        const cle='soreal_idle_bienvenue_v75_'+generationJoueurIdleV75_(j);

        idleVusMigrerLocalV1_(j);

        if(idleTutorielPagesDejaVuLocalV1_(cle)||idleVuConnuV1_(j,'bienvenue'))return;

        if(!Boolean(j&&j.profil&&j.profil.nouveauJoueur)){
          /* Aucune intro à jouer pour un joueur déjà existant : rien à rejouer, donc marqué vu tout de suite. */
          try{
            localStorage.setItem(cle,JSON.stringify(true));
          }catch(e){}
          idleVuMarquerV1_('bienvenue');
          return;
        }

        /*
         * Norman (2026-09-27) : « Si on ne termine pas l'introduction complète, elle sera rejouée au prochain
         * lancement du jeu depuis le début ». « bienvenue » n'est donc PAS marqué ici : seulement quand le
         * tutoriel de début se termine réellement (tutorielPagesFermerV1_), pour qu'un abandon en cours de
         * route relance cette fonction (et donc l'intro depuis sa toute première page) au prochain lancement.
         */
        demarrerTutorielPagesIdleV1_(
          REG.TUTORIEL_DEBUT_JEU_PAGES_V1,
          'soreal_idle_tutoriel_debut_v1_'+cle
        );
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
          const attaqueNode=document.getElementById('sorealIdleSummaryAttackV50');
          const grille=attaqueNode&&attaqueNode.closest('.soreal-idle-summary-grid-v28');
          if(grille){
            grille.outerHTML=resumeStatsIdleV28_(j);
          }
        }

        const ecrire=function(id,texte){
          const el=document.getElementById(id);
          if(el&&el.textContent!==texte)el.textContent=texte;
        };

        ecrire('sorealIdleSummaryAttackV50',formatGrandNombreIdleV70_(combat.attaque||j.puissance||0));
        ecrire('sorealIdleSummaryDefenseV50',formatGrandNombreIdleV70_(combat.defense||j.defense||0));
        ecrire('sorealIdleSummaryGoldV50',formatGrandNombreIdleV70_(monnaies.gold||0));
        ecrire('sorealIdleSummaryExpV50',formatGrandNombreIdleV70_(monnaies.experience||j.xp||0));
        ecrire('sorealIdleSummaryApV210',formatGrandNombreIdleV70_(monnaies.ap||0));
        /* Page Renaissance : total des renaissances et temps du run (ces deux infos ont quitté les tuiles du haut). */
        ecrire('sorealIdleRebirthTotalV1',formatGrandNombreIdleV70_(records.totalRebirths||0));
        ecrire('sorealIdleRebirthRunV1',formatDureeRunIdleV1_(dureeRunSecondesIdleV1_(j)));
      }

      /*
       * Fiche d'objet UNIFIÉE (Norman, 2026-10-03 : « dans le coffre, je veux pouvoir consulter les statistiques des objets avant de décider si je le reprends ; trouve une manière uniformisée pour tous les
       * objets, équipé, dans l'inventaire, dans le coffre ou dans les collections »). Une seule fiche (le popup d'objet de l'inventaire : titre, niveau, Puissance / PV max / Endurance / Regen / Specials avec leur
       * plafond, mêmes couleurs) pour tous les endroits : l'inventaire et l'équipement l'ouvrent par leurs identifiants (afficherDetailsObjetAdventureIdleV138_) ; le Coffre et les Collections enregistrent
       * ici l'objet à montrer (clé « coffre:… » ou « collection:… ») et l'ouvrent au survol (0,5 s) ou au clic. Dans le Coffre, la fiche propose « Reprendre dans l'inventaire » : plus de reprise par erreur.
       */
      const idleObjetsPopupVirtuelsV1=new Map();

      function enregistrerObjetPopupIdleV1_(cle,item,contexte){
        idleObjetsPopupVirtuelsV1.set(cle,{item:item,contexte:contexte});
      }

      function racinePopupObjetIdleV1_(){
        let root=document.getElementById('soreal-idle-v138-details');
        if(root)return root;
        root=document.createElement('div');
        root.className='soreal-idle-item-popup-v1';
        root.id='soreal-idle-v138-details';
        root.style.display='none';
        root.innerHTML='<div class="soreal-idle-item-popup-drag-v1" id="soreal-idle-v138-details-drag"><span>⠿</span><button type="button" class="soreal-idle-item-popup-close-v1" onclick="window.__fermerDetailsObjetAdventureIdleV1__()" aria-label="Fermer">✕</button></div><div class="soreal-idle-item-popup-body-v1" id="soreal-idle-v138-details-body"></div>';
        document.body.appendChild(root);
        return root;
      }

      function positionnerPopupPresDeIdleV1_(root,element){
        if(!element||!element.getBoundingClientRect)return;
        const r=element.getBoundingClientRect();
        const largeur=root.offsetWidth||320;
        const hauteur=root.offsetHeight||160;
        const marge=8;
        let left=r.right+4;
        if(left+largeur>window.innerWidth-marge)left=r.left-largeur-4;
        left=Math.min(Math.max(marge,left),Math.max(marge,window.innerWidth-largeur-marge));
        const top=Math.min(Math.max(marge,r.top-6),Math.max(marge,window.innerHeight-hauteur-marge));
        REG.idleItemPopupPositionV1_={left:Math.round(left),top:Math.round(top)};
        root.style.left=REG.idleItemPopupPositionV1_.left+'px';
        root.style.top=REG.idleItemPopupPositionV1_.top+'px';
      }

      function afficherPopupObjetUnifieIdleV1_(cle,ancre){
        const e=idleObjetsPopupVirtuelsV1.get(cle);
        if(!e||!e.item)return false;
        const root=racinePopupObjetIdleV1_();
        const corps=document.getElementById('soreal-idle-v138-details-body');
        if(!corps)return false;
        const item=e.item;
        const niveau=idleEntier_(item.level);
        const idObjet=idHtmlObjetIdleV1_(item);
        const actions=e.contexte==='coffre'&&item.id
          ?'<div class="soreal-idle-item-popup-actions-v165"><button type="button" class="idle-fiche-bouton-v1" onclick="window.__retirerDuCoffreAdventureIdleV1__(\''+idObjet+'\');window.__fermerDetailsObjetAdventureIdleV1__();">⬅️ Reprendre dans l’inventaire</button></div>'
          :'';
        const mention=e.contexte==='coffre'
          ?'Niveau '+niveau+'/100 · rangé au coffre'
          :'Niveau '+niveau+'/100'+(item.fullyMaxed?' · tout au maximum':' · niveau maximum atteint');
        corps.innerHTML=
          enteteFicheObjetIdleV1_(item,mention)+
          statsHtmlObjetAdventureIdleV138_(item)+
          piedFicheObjetIdleV1_(item)+
          actions;
        root.style.display='block';
        positionnerPopupPresDeIdleV1_(root,ancre);
        activerGlisserPopupObjetAdventureIdleV1_(root);
        REG.idleAdventureIgnorerClicJusquaV165=Date.now()+750;
        return true;
      }

      function idHtmlObjetIdleV1_(item){return idleHtml_(String(item&&item.id||''));}

      let idleDernierResumeHorsLigneV64=0;

      /*
       * Norman (2026-09-27) : « Quand on relance le jeu on doit avoir un résumé de ce qu'on a eu. EXP, AP,
       * Loot, ATTACK, DEFENSE, ... ce qu'on a eu quoi. Avec un popup a fermer »
       *
       * Avant ce correctif : un simple toast (messageFlottantIdleV32_), sans bouton, qui disparaissait seul
       * après 1,8 s et ne parlait QUE de l'énergie produite -- jamais l'EXP, l'AP, les niveaux, les boss battus,
       * les combats auto d'Aventure ni le loot, pourtant déjà calculés côté serveur (progressionHorsLigne).
       * Remplacé par un vrai popup modal (même famille que la confirmation de Renaissance,
       * .soreal-idle-modal-backdrop-v63) qui reste affiché jusqu'à ce qu'on le ferme volontairement.
       */
      function fermerResumeHorsLigneIdleV64_(){
        const modal=document.getElementById('sorealIdleResumeHorsLigneModalV64');
        if(modal)modal.remove();
      }

      function ligneResumeHorsLigneIdleV64_(icone,texte){
        return '<div class="soreal-idle-modal-info-v63" style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'+
          '<span style="font-size:16px">'+icone+'</span><span>'+texte+'</span>'+
        '</div>';
      }

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

        const auto=j&&j.autoAventureHorsLigne?j.autoAventureHorsLigne:null;
        const drops=Array.isArray(p.dropsRecents)?p.dropsRecents:[];

        const produite=idleNombre_(p.energieProduite);
        const depensee=idleNombre_(p.energieDepenseeAventure);
        const perdue=idleNombre_(p.energiePerdueAuPlafond);
        /* Gains hors ligne de toutes les monnaies (calculés par le serveur : écart avant / après) ; l'EXP et l'AP déjà comptés par le combat auto restent pris en compte (le plus grand des deux). */
        const gm=p.gainsMeta&&typeof p.gainsMeta==='object'?p.gainsMeta:{};
        const xp=Math.max(idleNombre_(p.xpGagnee),idleNombre_(gm.experience));
        const niveaux=idleEntier_(p.niveauxGagnes);
        const ap=Math.max(idleNombre_(p.apGagne),idleNombre_(gm.ap));
        const gainsAutres=[['pp','🏅','PP'],['qp','🧩','QP'],['gold','💰','Or'],['blood','🩸','Blood'],['seeds','🌱','Graines'],['mayo','🧀','Mayo'],['magic','🔮','Magie'],['r3','🧪','Ressource 3']].filter(function(g){return idleNombre_(gm[g[0]])>0;});
        const bossBattus=idleEntier_(p.bossBattus);
        const degats=idleNombre_(p.degats);
        const degatsRecus=idleNombre_(p.degatsRecus);
        const koSubis=idleEntier_(p.koSubis);
        const victoiresAuto=auto?idleEntier_(auto.victoires):0;
        const defaitesAuto=auto?idleEntier_(auto.defaites):0;
        /* Titans tués par l'Auto-Kill pendant l'absence : [{id,n}] ; seul le nom d'un Titan DÉJÀ connu du joueur s'affiche (anti-spoil). */
        const titansTues=Array.isArray(p.titansTues)?p.titansTues.filter(function(t){return t&&idleEntier_(t.n)>0;}):[];

        /* Rien de notable à raconter (juste quelques secondes d'absence, énergie nulle) : pas de popup pour rien. */
        const rienAVoir=
          produite<=0&&xp<=0&&ap<=0&&gainsAutres.length<=0&&bossBattus<=0&&
          victoiresAuto<=0&&defaitesAuto<=0&&drops.length<=0&&titansTues.length<=0;
        if(rienAVoir)return;

        const signature=
          idleEntier_(p.secondes)+':'+Math.round(produite*10)+':'+
          Math.round(xp)+':'+Math.round(ap)+':'+bossBattus+':'+
          victoiresAuto+':'+defaitesAuto+':'+drops.length+':'+titansTues.length+':'+gainsAutres.map(function(g){return Math.round(idleNombre_(gm[g[0]]));}).join(',');

        if(
          String(
            idleDernierResumeHorsLigneV64
          )===String(signature)
        ){
          return;
        }

        idleDernierResumeHorsLigneV64=
          signature;

        const lignes=[];
        /* Aucune énergie générée pendant l'absence : la ligne n'apparaît pas (Norman, 2026-10-02). */
        if(produite>0)lignes.push(ligneResumeHorsLigneIdleV64_('⚡','+'+formatEnergieIdleV50_(produite)+' énergie produite'));
        if(depensee>0)lignes.push(ligneResumeHorsLigneIdleV64_('🗺️','-'+formatEnergieIdleV50_(depensee)+' dépensée en Aventure AUTO'));
        if(perdue>0)lignes.push(ligneResumeHorsLigneIdleV64_('🌊',formatEnergieIdleV50_(perdue)+' perdue au-delà du maximum'));
        if(xp>0)lignes.push(ligneResumeHorsLigneIdleV64_('✨','+'+formatGrandNombreIdleV70_(xp)+' EXP'));
        if(niveaux>0)lignes.push(ligneResumeHorsLigneIdleV64_('📈','+'+niveaux+' niveau(x) de Basic Training'));
        if(ap>0)lignes.push(ligneResumeHorsLigneIdleV64_('🎟️','+'+formatGrandNombreIdleV70_(ap)+' AP'));
        gainsAutres.forEach(function(g){lignes.push(ligneResumeHorsLigneIdleV64_(g[1],'+'+formatGrandNombreIdleV70_(idleNombre_(gm[g[0]]))+' '+g[2]));});
        if(bossBattus>0)lignes.push(ligneResumeHorsLigneIdleV64_('👹','+'+bossBattus+' boss vaincu(s)'));
        if(titansTues.length>0){
          const aventure=aventureMetaIdleV47_(j);
          const noms={};
          ((aventure&&Array.isArray(aventure.titans))?aventure.titans:[]).forEach(function(t){if(t&&t.id&&t.name&&t.progressionUnlocked!==false)noms[String(t.id)]=String(t.name);});
          const total=titansTues.reduce(function(a,t){return a+idleEntier_(t.n);},0);
          const morceaux=titansTues.slice(0,4).map(function(t){return idleHtml_(noms[String(t.id)]||'un Titan')+(idleEntier_(t.n)>1?' ×'+idleEntier_(t.n):'');});
          const reste=titansTues.length-morceaux.length;
          lignes.push(ligneResumeHorsLigneIdleV64_('🔥',total+' Titan'+(total>1?'s':'')+' vaincu'+(total>1?'s':'')+' : '+morceaux.join(', ')+(reste>0?' et '+reste+' autre'+(reste>1?'s':''):'')));
        }
        if(victoiresAuto>0||defaitesAuto>0){
          let texteAuto='Aventure AUTO : '+victoiresAuto+' victoire(s)';
          if(defaitesAuto>0)texteAuto+=' · '+defaitesAuto+' défaite(s)';
          lignes.push(ligneResumeHorsLigneIdleV64_('⚔️',texteAuto));
        }
        if(degats>0||degatsRecus>0){
          lignes.push(ligneResumeHorsLigneIdleV64_('🗡️','Dégâts infligés '+formatGrandNombreIdleV70_(degats)+' · reçus '+formatGrandNombreIdleV70_(degatsRecus)+(koSubis>0?' · K.O. ×'+koSubis:'')));
        }
        if(drops.length>0){
          /* Liste courte : les objets identiques sont regroupés (« Nom ×3 »), 5 lignes au plus, puis « et N autres ». */
          const groupes=[];
          const parNom={};
          drops.forEach(function(objet){
            const nom=String((objet&&(objet.name||objet.nom))||'Objet');
            if(parNom[nom]){parNom[nom].n+=1;return;}
            parNom[nom]={nom:nom,n:1,puissance:idleNombre_(objet&&objet.basePower),endurance:idleNombre_(objet&&objet.baseToughness)};
            groupes.push(parNom[nom]);
          });
          const maxLignes=5;
          const objets=groupes.slice(0,maxLignes).map(function(g){
            let details='';
            if(g.n===1&&(g.puissance>0||g.endurance>0)){
              const morceaux=[];
              if(g.puissance>0)morceaux.push('Puissance '+formatGrandNombreIdleV70_(g.puissance));
              if(g.endurance>0)morceaux.push('Endurance '+formatGrandNombreIdleV70_(g.endurance));
              details=' <small style="color:#8b93ab">('+morceaux.join(' · ')+')</small>';
            }
            return '<div style="margin-left:24px">• '+idleHtml_(g.nom)+(g.n>1?' ×'+g.n:'')+details+'</div>';
          }).join('');
          const resteObjets=groupes.slice(maxLignes).reduce(function(a,g){return a+g.n;},0);
          const suite=resteObjets>0?'<div style="margin-left:24px;color:#8b93ab">… et '+resteObjets+' autre'+(resteObjets>1?'s':'')+'</div>':'';
          lignes.push(ligneResumeHorsLigneIdleV64_('🎁','+'+drops.length+' objet'+(drops.length>1?'s':'')+' obtenu'+(drops.length>1?'s':'')+' :')+objets+suite);
        }

        fermerResumeHorsLigneIdleV64_();

        const modal=document.createElement('div');
        modal.id='sorealIdleResumeHorsLigneModalV64';
        modal.className='soreal-idle-modal-backdrop-v63';
        modal.innerHTML=
          '<div class="soreal-idle-modal-card-v63" role="dialog" aria-modal="true" aria-label="Résumé de ton absence">'+
            '<div class="soreal-idle-modal-top-v63">'+
              '<div class="soreal-idle-modal-icon-v63">🕒</div>'+
              '<div class="soreal-idle-modal-title-v63">Pendant ton absence</div>'+
            '</div>'+
            '<div class="soreal-idle-modal-body-v63">'+
              lignes.join('')+
            '</div>'+
            '<div class="soreal-idle-modal-actions-v63" style="grid-template-columns:1fr">'+
              '<button type="button" class="soreal-idle-modal-button-v63 confirm" onclick="window.__fermerResumeHorsLigneIdleV64__()">Fermer</button>'+
            '</div>'+
          '</div>';

        modal.addEventListener('click',function(event){
          if(event.target===modal)fermerResumeHorsLigneIdleV64_();
        });

        setTimeout(
          function(){
            document.body.appendChild(modal);
          },
          250
        );
      }

  Object.assign(REG,{
    idleVuConnuV1_:idleVuConnuV1_,
    idleVuMarquerV1_:idleVuMarquerV1_,
    fermerPopupNouveauteIdleV75_:fermerPopupNouveauteIdleV75_,
    allerDepuisPopupNouveauteIdleV106_:allerDepuisPopupNouveauteIdleV106_,
    afficherProchainePopupIdleV75_:afficherProchainePopupIdleV75_,
    gererPopupsProgressionIdleV75_:gererPopupsProgressionIdleV75_,
    patcherResumeStatsIdleV28_:patcherResumeStatsIdleV28_,
    enregistrerObjetPopupIdleV1_:enregistrerObjetPopupIdleV1_,
    afficherPopupObjetUnifieIdleV1_:afficherPopupObjetUnifieIdleV1_,
    fermerResumeHorsLigneIdleV64_:fermerResumeHorsLigneIdleV64_,
    afficherResumeHorsLigneIdleV64_:afficherResumeHorsLigneIdleV64_
  });
})();
