/*
 * SOREAL IDLE — Renaissance et remise à zéro (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_renaissance_v1)return;
  REG.__chargé_ui_renaissance_v1=true;

  function idleNombre_(){return REG.idleNombre_.apply(null,arguments);}
  function formatGrandNombreIdleV70_(){return REG.formatGrandNombreIdleV70_.apply(null,arguments);}
  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function jouerEffetAudioIdleV199_(){return REG.jouerEffetAudioIdleV199_.apply(null,arguments);}
  function toastIdleV5_(){return REG.toastIdleV5_.apply(null,arguments);}
  function rendreIdleEtat_(){return REG.rendreIdleEtat_.apply(null,arguments);}
  function annulerTimerCombatAutoIdleV30_(){return REG.annulerTimerCombatAutoIdleV30_.apply(null,arguments);}
  function sauverCombatAutoIdleV30_(){return REG.sauverCombatAutoIdleV30_.apply(null,arguments);}
  function aventureMetaIdleV47_(){return REG.aventureMetaIdleV47_.apply(null,arguments);}
  function pousserEtatVersRuntimePartageIdleV1_(){return REG.pousserEtatVersRuntimePartageIdleV1_.apply(null,arguments);}
  function sauverMenuIdleV28_(){return REG.sauverMenuIdleV28_.apply(null,arguments);}
  function messageFlottantIdleV32_(){return REG.messageFlottantIdleV32_.apply(null,arguments);}
  function entetePageIdleV28_(){return REG.entetePageIdleV28_.apply(null,arguments);}
  function viderActionsLocalesAvantResetIdleV67_(){return REG.viderActionsLocalesAvantResetIdleV67_.apply(null,arguments);}
  function chargerSorealIdleNatifV4_(){return REG.chargerSorealIdleNatifV4_.apply(null,arguments);}

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-102 */
      const IDLE_REBIRTH_FACTOR_LABELS_V1=[
        {id:'currentBossFactor',nom:'Bonus de puissance des boss'},
        {id:'priorBossFactor',nom:'Bonus de puissance des boss (dernière Renaissance)'},
        {id:'currentTimeFactor',nom:'Facteur de temps de Renaissance'},
        {id:'priorTimeFactor',nom:'Facteur de temps de Renaissance (dernière Renaissance)'},
        {id:'trainingFactor',nom:'Facteur de niveau d’entraînement'},
        {id:'bloodMagicBonus',nom:'Bonus de Magie du sang'},
        {id:'nguNumberBonus',nom:'Bonus NGU (Attaque)'},
        {id:'beardNumberBonus',nom:'Bonus des Barbes'}
      ];

      function rendreRenaissanceIdleV14_(j){
        const r=j&&j.renaissance?j.renaissance:{};
        const meta=j&&j.systemes&&j.systemes.rebirth?j.systemes.rebirth:{};
        const actuel=Math.max(1,idleNombre_(meta.number||r.number||1));
        const prochain=Math.max(1,idleNombre_(meta.nextNumber||r.nextNumber||actuel));
        const ratio=actuel>0?prochain/actuel:1;
        const preview=meta.preview||{};
        const sysSang=(j&&j.systemes&&Array.isArray(j.systemes.systems)?j.systemes.systems:[]).find(function(s){return s&&s.id==='bloodMagic';});
        const sangDebloque=Boolean(sysSang&&sysSang.state&&sysSang.state.unlocked);
        /* Le bonus de Magie du sang est TOUJOURS montré une fois Blood Magic débloquée, même à ×1 (Norman, 2026-10-15) : c'est lui que le sang dépensé fait monter. Les autres facteurs ne s'affichent que s'ils changent quelque chose. */
        const detailsFacteurs=IDLE_REBIRTH_FACTOR_LABELS_V1
          .filter(function(f){return (f.id==='bloodMagicBonus'&&sangDebloque)||(idleNombre_(preview[f.id])>0&&Math.abs(idleNombre_(preview[f.id])-1)>1e-9);})
          .map(function(f){
            return '<div class="soreal-idle-rebirth-stat-v14">'+
              '<div class="soreal-idle-rebirth-stat-label-v14">'+f.nom+'</div>'+
              '<div class="soreal-idle-rebirth-stat-value-v14">×'+formatGrandNombreIdleV70_(idleNombre_(preview[f.id]),3)+'</div>'+
            '</div>';
          }).join('');
        /*
         * Page refaite pour être claire (Norman, 2026-10-15) : deux colonnes, « Partie précédente » et « Partie en cours », avec les mêmes lignes à émojis (sang dépensé, durée, boss le plus haut, Number) ; le Number à la Renaissance
         * en grand ; les calculs restent tout en bas. Anti-spoil : la ligne « Sang » n'apparaît que si Blood Magic est déjà débloquée. Les libellés « Nombre à la Renaissance » et « Variation » sont repris
         * par modules/rebirth-live-v1.js (mise à jour chaque seconde) : ne pas les renommer sans lui.
         */
        const aPrecedent=Boolean(meta.hasPreviousRun);
        const tiret='<span class="rb2-vide">—</span>';
        const sangEnCours=Math.max(0,idleNombre_(sysSang&&sysSang.state&&sysSang.state.data&&sysSang.state.data.spells&&sysSang.state.data.spells.numberBoost)-1);
        const ligne=function(ico,libelle,valeur,idVal){
          return '<div class="rb2-ligne"><span class="rb2-ico" aria-hidden="true">'+ico+'</span><span class="rb2-lib">'+libelle+'</span><b class="rb2-val"'+(idVal?' id="'+idVal+'"':'')+'>'+valeur+'</b></div>';
        };
        const colonnePrecedente=
          '<div class="rb2-col rb2-prec"><div class="rb2-tete">💀 Partie précédente</div><div class="rb2-sous">Ce qui s’est éteint</div>'+
            (sangDebloque?ligne('🩸','Sang dépensé dans le rituel Boost du nombre par le sang',aPrecedent?formatGrandNombreIdleV70_(Math.max(0,idleNombre_(meta.lastBlood))):tiret):'')+
            ligne('⏱️','Durée',aPrecedent?formatDureeRunIdleV1_(Math.max(0,idleNombre_(meta.lastRunSeconds))):tiret)+
            ligne('👹','Boss le plus haut battu',aPrecedent?formatGrandNombreIdleV70_(Math.max(0,idleEntier_(meta.lastBosses))):tiret)+
            ligne('🔢','Number actif',aPrecedent?formatGrandNombreIdleV70_(Math.max(1,idleNombre_(meta.lastNumber))):tiret)+
            (aPrecedent?'':'<div class="rb2-note">Pas encore de partie précédente : elle apparaîtra après ta première Renaissance.</div>')+
          '</div>';
        const colonneEnCours=
          '<div class="rb2-col rb2-cours"><div class="rb2-tete">🌱 Partie en cours</div><div class="rb2-sous">Ce qui vit encore</div>'+
            (sangDebloque?ligne('🩸','Sang dépensé dans le rituel Boost du nombre par le sang',formatGrandNombreIdleV70_(sangEnCours)):'')+
            ligne('⏱️','Durée',formatDureeRunIdleV1_(dureeRunSecondesIdleV1_(j)),'sorealIdleRebirthRunV1')+
            ligne('👹','Boss le plus haut battu',formatGrandNombreIdleV70_(Math.max(0,idleEntier_(j&&j.bossVaincus))))+
            ligne('🔢','Nombre actif',formatGrandNombreIdleV70_(actuel))+
          '</div>';
        return `
          <div id="sorealIdleBlocRenaissanceV27" class="soreal-idle-rebirth-v14 rb2-v1">
            <div class="soreal-idle-rebirth-title-v14">♻️ Rebirth</div>
            <div class="soreal-idle-rebirth-sub-v14">
              Tu recommences tout depuis le début, mais ton <b>Nombre</b> multiplie ton Attaque et ta Défense au prochain cycle.
              Plus tu vas loin et vite, plus il monte.
            </div>
            <div class="rb2-colonnes">${colonnePrecedente}${colonneEnCours}</div>
            <div class="rb2-ciel-titre" aria-hidden="true">✦ ☁️ ✨ ☁️ ✦</div>
            <div class="rb2-prochain">
              <div class="soreal-idle-rebirth-stat-v14">
                <div class="soreal-idle-rebirth-stat-label-v14">Nombre si tu renais maintenant</div>
                <div class="soreal-idle-rebirth-stat-value-v14${prochain>actuel*1.0000001?' hausse':(prochain<actuel/1.0000001?' baisse':'')}">${formatGrandNombreIdleV70_(prochain)}</div>
              </div>
              <div class="soreal-idle-rebirth-stat-v14">
                <div class="soreal-idle-rebirth-stat-label-v14">Variation</div>
                <div class="soreal-idle-rebirth-stat-value-v14">×${ratio>=1000?formatGrandNombreIdleV70_(ratio,3):ratio.toFixed(3)}</div>
              </div>
            </div>
            <button type="button" class="soreal-idle-rebirth-button-v14${prochain>actuel*1.0000001?' positif':''}"
              onclick="window.__renaitreIdleV14__()" ${(REG.idleRenaissanceEnCoursV14||!(REG.idleEtat&&REG.idleEtat.renaissance&&REG.idleEtat.renaissance.debloquee))?'disabled':''}>
              ♻️ RENAISSANCE
            </button>
            ${
              (REG.idleEtat&&REG.idleEtat.renaissance&&!REG.idleEtat.renaissance.debloquee)
                ?(REG.idleEtat.renaissance.aventureRequise
                  ?`<div class="soreal-idle-rebirth-warning-v14">Débloqué après avoir vaincu le boss ${REG.idleEtat.renaissance.aventureRequiseBoss||4} (déblocage d'Aventure).</div>`
                  :'<div class="soreal-idle-rebirth-warning-v14">Disponible après 3 minutes de run.</div>')
                :''
            }
            <div class="soreal-idle-window-title-v31">📐 Comment c’est calculé</div>
            <div class="rb2-explication">Ton Nombre à la Renaissance est le produit de ces facteurs : le boss le plus haut battu, la durée de la partie, ta partie précédente et tes bonus. En voici le détail.</div>
            <div class="soreal-idle-rebirth-stats-v14">
              ${detailsFacteurs}
              <div class="soreal-idle-rebirth-stat-v14">
                <div class="soreal-idle-rebirth-stat-label-v14">Renaissances effectuées</div>
                <div class="soreal-idle-rebirth-stat-value-v14" id="sorealIdleRebirthTotalV1">${formatGrandNombreIdleV70_(Math.max(0,idleEntier_((j&&j.systemes&&j.systemes.records&&j.systemes.records.totalRebirths)||0)))}</div>
              </div>
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
          REG.idleRenaissanceEnCoursV14 ||
          !SOREAL_SESSION
        ){
          return;
        }

        fermerPopupRenaissanceIdleV63_();

        REG.idleRenaissanceEnCoursV14=true;

        /* Rebirth (Norman, 2026-09-26) : un bruit de machine à voyager dans le temps. */
        jouerEffetAudioIdleV199_('timeMachine');

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
            REG.idleRenaissanceEnCoursV14=false;

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

            REG.idleEtat=
              res.joueur;

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-103 */
            REG.idleCombatEnPauseApresDefaiteV1=false;
            REG.idleVictoireBossLocaleV49=false;

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-104 */
            REG.idleAutoAventureV30=false;
            REG.idleAutoZoneV30=0;
            annulerTimerCombatAutoIdleV30_();
            sauverCombatAutoIdleV30_();
            REG.idleAdventureRespawnAtV1=0;
            if(REG.idleAdventureRespawnTimerV165){
              clearTimeout(REG.idleAdventureRespawnTimerV165);
              REG.idleAdventureRespawnTimerV165=null;
            }

            const adventureApresRebirthV186=
              aventureMetaIdleV47_(REG.idleEtat);
            if(adventureApresRebirthV186){
              adventureApresRebirthV186.selectedZone='safe';
              if(adventureApresRebirthV186.fight){
                adventureApresRebirthV186.fight.active=false;
              }
            }
            pousserEtatVersRuntimePartageIdleV1_();

            /* Norman (2026-10-13) : après une Renaissance on arrive sur Fight Boss, la borne d'arcade en haut de la page, pour revoir la borne qui s'allume */
            REG.idleMenuActifV28='combat';
            sauverMenuIdleV28_();

            rendreIdleEtat_({
              ok:true,
              joueur:res.joueur
            });
            /*
             * Norman (2026-10-15) : « on est bien sur la borne, mais il manque la partie du haut : il faut vraiment que la page soit scrollée au max en haut ». scrollIntoView sur la borne la collait en haut de l'écran et masquait tout ce qui
             * la précède ; on remonte donc tout en haut de la page, et on le refait un instant plus tard (la page se redessine et change de hauteur juste après la Renaissance).
             */
            try{
              /* Norman (2026-10-15) : « je veux la même position que quand on clique sur le bouton Combat de boss : le menu Attaque, Défense… collé au top » : la page est placée sous la bannière (comme un clic sur un menu), pas tout en haut. */
              const toutEnHaut=function(){const ban=document.querySelector('.soreal-idle-hero-banner-v95')||document.querySelector('.soreal-idle-hero-v4');window.scrollTo(0,ban?Math.max(0,Math.round(ban.getBoundingClientRect().bottom+(window.scrollY||0))):0);};
              toutEnHaut();
              requestAnimationFrame(function(){toutEnHaut();});
              setTimeout(toutEnHaut,250);
              setTimeout(toutEnHaut,700);
            }catch(_e){}

            messageFlottantIdleV32_(
              '♻️ Rebirth réussi · NUMBER '+formatGrandNombreIdleV70_(res.number||REG.idleEtat&&REG.idleEtat.renaissance&&REG.idleEtat.renaissance.number||1)
            );
          })
          .withFailureHandler(function(e){
            REG.idleRenaissanceEnCoursV14=false;

            toastIdleV5_(
              e&&e.message
                ?e.message
                :'Erreur pendant la Renaissance.'
            );

            if(REG.idleEtat){
              rendreIdleEtat_({
                ok:true,
                joueur:REG.idleEtat
              });
            }
          })
          .renaitreSorealIdle(
            SOREAL_SESSION
          );
      }

      /*
       * 2026-09-25 (Norman : « il faut qu'on soit considéré comme un nouveau joueur quand on reset la partie : on doit revoir les popups une
       * fois de nouveau ») : le reset total efface la ligne du joueur (donc profil.stats.vus côté serveur) ; ici on oublie ce que la page
       * avait en mémoire (sinon « bienvenue », tutoriels et popups de menus restaient « vus » jusqu'au rechargement) et les caches locaux.
       */
      function idleVusOublierV1_(){
        Object.keys(REG.idleVusMemoireV1).forEach(function(id){delete REG.idleVusMemoireV1[id];});
        REG.idleVusEnAttenteV1=[];
        REG.idleVusMigreV1='';
        try{
          Object.keys(localStorage).forEach(function(cle){
            if(
              cle.indexOf('soreal_idle_menus_ack_v1_')===0||
              cle.indexOf('soreal_idle_menu_ordre_')===0||
              cle.indexOf('soreal_idle_bienvenue_v75_')===0||
              cle.indexOf('soreal_idle_tutoriel_')===0||
              /*
               * Norman (2026-09-27) : « les voix n'ont pas été jouées automatiquement pour les boss [après reset]. »
               * La mémoire "chronique de boss déjà lue" (tutorial-tts-v202.js, CHRONICLE_LU_KEY) vit dans ce même
               * localStorage, jamais touchée par le Rebirth (action serveur normale) -- mais un reset TOTAL doit,
               * comme les autres popups ci-dessus, faire réapparaître ces voix.
               */
              cle==='soreal_idle_boss_chronique_lue_v1'
            )localStorage.removeItem(cle);
          });
        }catch(e){}
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

      function resetTotalPeutPartirIdleV67_(){
        return !(
          REG.idleFastNetworkBusyV60 ||
          REG.idleAchatEnCoursV5 ||
          REG.idleRecycleBatchV32 ||
          REG.idleAventureEnCoursV17 ||
          REG.idleSyncEnCoursV60
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
            idleVusOublierV1_();
            REG.idleEtat=null;
            REG.idleCombatLogV70=[];
            REG.idleCombatLogBossV70='';

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
                  REG.idleEtat=
                    etat.joueur;

                  /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-310 */
                  REG.idleMenuActifV28='combat';
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
                '<div id="sorealIdleResetTotalStatusV67" style="margin-top:9px;color:#d7b4ba;font-size:12px;font-weight:900;text-align:center"></div>'+
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

  Object.assign(REG,{
    fermerPopupRenaissanceIdleV63_:fermerPopupRenaissanceIdleV63_,
    executerRenaissanceIdleV63_:executerRenaissanceIdleV63_,
    formatDureeRunIdleV1_:formatDureeRunIdleV1_,
    dureeRunSecondesIdleV1_:dureeRunSecondesIdleV1_,
    pageRenaissanceIdleV28_:pageRenaissanceIdleV28_,
    fermerPopupResetTotalIdleV67_:fermerPopupResetTotalIdleV67_,
    executerResetTotalIdleV67_:executerResetTotalIdleV67_,
    ouvrirPopupResetTotalIdleV67_:ouvrirPopupResetTotalIdleV67_
  });
})();
