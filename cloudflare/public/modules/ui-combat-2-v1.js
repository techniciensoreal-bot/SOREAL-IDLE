/*
 * SOREAL IDLE — Fight Boss et Titans (partie 2) (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_combat_2_v1)return;
  REG.__chargé_ui_combat_2_v1=true;

  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function formatGrandNombreIdleV70_(){return REG.formatGrandNombreIdleV70_.apply(null,arguments);}
  function labelCapaciteBossIdleV70_(){return REG.labelCapaciteBossIdleV70_.apply(null,arguments);}
  function messageFlottantIdleV32_(){return REG.messageFlottantIdleV32_.apply(null,arguments);}
  function idleNombre_(){return REG.idleNombre_.apply(null,arguments);}
  function afficherProchainePopupIdleV75_(){return REG.afficherProchainePopupIdleV75_.apply(null,arguments);}
  function jouerEffetAudioIdleV199_(){return REG.jouerEffetAudioIdleV199_.apply(null,arguments);}
  function preparerCapacitesBossIdleV70_(){return REG.preparerCapacitesBossIdleV70_.apply(null,arguments);}
  function ajouterLogCombatIdleV70_(){return REG.ajouterLogCombatIdleV70_.apply(null,arguments);}
  function rafraichirCommandesFightBossIdleV167_(){return REG.rafraichirCommandesFightBossIdleV167_.apply(null,arguments);}
  function planifierRenduOptimisteIdleV60_(){return REG.planifierRenduOptimisteIdleV60_.apply(null,arguments);}
  function ajouterActionRapideIdleV60_(){return REG.ajouterActionRapideIdleV60_.apply(null,arguments);}
  function snapshotCombatFightBossIdleV173_(){return REG.snapshotCombatFightBossIdleV173_.apply(null,arguments);}
  function toastIdleV5_(){return REG.toastIdleV5_.apply(null,arguments);}
  function rendreIdleEtat_(){return REG.rendreIdleEtat_.apply(null,arguments);}
  function histoireBossMarkupIdleV142_(){return REG.histoireBossMarkupIdleV142_.apply(null,arguments);}
  function formaterPvFixeIdleV1_(){return REG.formaterPvFixeIdleV1_.apply(null,arguments);}
  function capacitesBossMarkupIdleV70_(){return REG.capacitesBossMarkupIdleV70_.apply(null,arguments);}
  function fightEnAttenteServeurIdleV1_(){return REG.fightEnAttenteServeurIdleV1_.apply(null,arguments);}
  function aventureMetaIdleV47_(){return REG.aventureMetaIdleV47_.apply(null,arguments);}
  function selectionnerZoneAdventureIdleV47_(){return REG.selectionnerZoneAdventureIdleV47_.apply(null,arguments);}
  function rafraichirCommandesAdventureIdleV3_(){return REG.rafraichirCommandesAdventureIdleV3_.apply(null,arguments);}
  function resetHorlogesFightAdventureIdleV2_(){return REG.resetHorlogesFightAdventureIdleV2_.apply(null,arguments);}
  function envoyerResolutionAdventurePendingV2_(){return REG.envoyerResolutionAdventurePendingV2_.apply(null,arguments);}
  function ecouleRegenReposAdventureIdleV166_(){return REG.ecouleRegenReposAdventureIdleV166_.apply(null,arguments);}
  function regenReposAdventureIdleV3_(){return REG.regenReposAdventureIdleV3_.apply(null,arguments);}
  function restPvInitialIdleV1_(){return REG.restPvInitialIdleV1_.apply(null,arguments);}
  function memoriserRestPvIdleV1_(){return REG.memoriserRestPvIdleV1_.apply(null,arguments);}
  function aventureDebloqueeIdleV47_(){return REG.aventureDebloqueeIdleV47_.apply(null,arguments);}
  function programmerRespawnAdventureIdleV165_(){return REG.programmerRespawnAdventureIdleV165_.apply(null,arguments);}
  function annulerRespawnAdventureIdleV165_(){return REG.annulerRespawnAdventureIdleV165_.apply(null,arguments);}
  function reinitialiserHorlogeRegenReposAdventureIdleV166_(){return REG.reinitialiserHorlogeRegenReposAdventureIdleV166_.apply(null,arguments);}
  function terminerCombatAdventureLocalV2_(){return REG.terminerCombatAdventureLocalV2_.apply(null,arguments);}
  function identiteFightAdventureIdleV2_(){return REG.identiteFightAdventureIdleV2_.apply(null,arguments);}
  function intervalleIdleAttackAdventureIdleV4_(){return REG.intervalleIdleAttackAdventureIdleV4_.apply(null,arguments);}
  function intervalleAttaqueEnnemiAdventureIdleV2_(){return REG.intervalleAttaqueEnnemiAdventureIdleV2_.apply(null,arguments);}
  function cooldownDureeAdventureIdleV4_(){return REG.cooldownDureeAdventureIdleV4_.apply(null,arguments);}
  function ajouterLogAventureIdleV1_(){return REG.ajouterLogAventureIdleV1_.apply(null,arguments);}
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
  function pousserEtatVersRuntimePartageIdleV1_(){return REG.pousserEtatVersRuntimePartageIdleV1_.apply(null,arguments);}

      /* Texte à lire : la version modifiée par l'administrateur si elle existe (balises de voix, d'expression et de pause comprises), sinon l'origine. */
      function texteVoixSansTexteIdleV1_(cle,origine){
        try{
          const T=window.__SOREAL_IDLE_TEXTES_V1__;
          const tts=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
          const sur=T&&typeof T.surcharge==='function'?T.surcharge(cle):null;
          if(sur&&typeof sur.texte==='string'&&sur.texte.trim()&&tts&&typeof tts.retirerParentheses==='function')return tts.retirerParentheses(sur.texte).replace(/\s+/g,' ').trim();
        }catch(_e){}
        return origine;
      }

      function lancerVoixArrierePlanSandwichIdleV1_(){
        const tts=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
        if(!tts||typeof tts.readText!=='function'||typeof tts.enabled!=='function'||!tts.enabled())return;
        setTimeout(function(){
          try{tts.readText(texteVoixSansTexteIdleV1_(REG.CLE_VOIX_SANDWICH_IDLE_V1,REG.VOIX_ARRIERE_PLAN_SANDWICH_IDLE_V1));}catch(e){}
        },1500);
      }

      /* Balises de voix (Norman, 2026-10-02) : « (marius) » dans une chronique change la voix de la lecture ; l'écran ne les montre jamais. */
      function sansBaliseVoixIdleV1_(texte){
        const T=window.__SOREAL_IDLE_TEXTES_V1__;
        return T&&typeof T.sansBalises==='function'?T.sansBalises(texte):String(texte==null?'':texte);
      }

      /* Attribut portant le texte brut (avec ses balises) quand il en contient : la lecture le préfère au texte affiché. */
      function attrHistoireVoixIdleV1_(texte){
        const T=window.__SOREAL_IDLE_TEXTES_V1__;
        return T&&typeof T.aDesBalises==='function'&&T.aDesBalises(texte)
          ?' data-soreal-tts-histoire="'+idleHtml_(String(texte||''))+'"'
          :'';
      }

      /*
       * Attributs de lecture d'une chronique de boss (Norman, 2026-10-17 : « ce que je crée dans le menu Admin (textes et voix) doit être appliqué immédiatement partout où on peut lire ce texte »). Si l'administrateur a fixé
       * un texte ou un nom PARLÉS, la voix lit CEUX-LÀ (data-soreal-tts-say : mêmes blocs de voix, donc mêmes fichiers générés que dans le combat) ; sinon le récit affiché, avec ses balises éventuelles.
       */
      function attrLectureBossIdleV1_(nom,histoire,nomParle,histoireParlee){
        const T=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
        const np=String(nomParle||'').trim(),hp=String(histoireParlee||'').trim();
        if((np||hp)&&T&&typeof T.composerChronique==='function'){
          return ' data-soreal-tts-say="'+idleHtml_(T.composerChronique(np||nom||'Boss',hp||histoire||''))+'"';
        }
        return attrHistoireVoixIdleV1_(histoire);
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

      function construireCarteBossIdleV91_(
        b
      ){
        /* R2 d'abord (voir markupImageCombatIdleV61_) : l'ancienne image du Drive ne sert plus qu'à défaut. */
        const image=
          urlBossR2IdleV1_(
            b&&b.numero
          ) ||
          '';

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

              <div id="sorealIdleBossModalStoryV206_${idleEntier_(b.numero)}" class="soreal-idle-boss-story-v91"${b.histoire?' data-soreal-tts-chronique="'+idleHtml_(b.nom||'Boss')+'"'+attrLectureBossIdleV1_(b.nom,b.histoire,b.nomParle,b.histoireParlee):''}>
                ${idleHtml_(
                  sansBaliseVoixIdleV1_(b.histoire)||
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

        /* Fight impossible tant que le boss n'est pas AFFICHÉ (Norman, 2026-10-20 : « je peux lancer les combats alors que les boss ne sont pas encore affichés, et ça fait ça » : combat lancé contre « le boss » sans nom ni PV, puis remis à zéro à la synchro suivante). */
        if(actif&&!REG.idleEtat.combatBossActif&&!(String(REG.idleEtat.bossActuel||'').trim()&&idleNombre_(REG.idleEtat.bossPvMax)>0))return;

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
          REG.idleCombatStopFantomeEnvoyeV206=false;
          try{const D=window.__SOREAL_IDLE_DIAG_V1__;if(D&&D.combatLance)D.combatLance();}catch(_e){}
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

      /*
       * Explosion sur l'image du boss dans la borne d'arcade (Norman, 2026-10-21 : « quand on fait un NUKE, j'aimerais qu'il y ait une explosion sur l'image du boss »). Éclair blanc, boule de feu, onde de choc, étincelles qui jaillissent et fumée, pendant que l'image tremble ; 1,2 s, une seule fois par NUKE.
       * Le calque est AJOUTÉ à la page : data-morph-garder (règle n°4) pour qu'un redessin ne le retire pas en pleine explosion. Aucun effet avec « réduire les animations ».
       */
      function exploserBossNukeIdleV1_(){
        const hote=document.getElementById('sorealIdleBossImageHostV36');
        if(!hote)return false;
        try{if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return false;}catch(_e){}
        const ancien=hote.querySelector('.nk-boum');
        if(ancien)ancien.remove();
        clearTimeout(hote.__nkFin);
        const calque=document.createElement('div');
        calque.className='nk-boum';
        calque.setAttribute('data-morph-garder','');
        calque.setAttribute('aria-hidden','true');
        let etincelles='';
        for(let i=0;i<16;i+=1){
          etincelles+='<b style="--a:'+Math.round(i*22.5+((i*37)%11))+'deg;--d:'+(46+((i*53)%40))+'%;--t:'+(((i*29)%9)*0.012).toFixed(3)+'s"></b>';
        }
        calque.innerHTML='<i class="nk-flash"></i><i class="nk-feu"></i><i class="nk-fumee"></i><i class="nk-onde"></i><i class="nk-onde nk-onde2"></i>'+etincelles;
        hote.appendChild(calque);
        hote.classList.add('nk-tremble');
        hote.__nkFin=setTimeout(function(){
          hote.classList.remove('nk-tremble');
          if(calque.parentNode)calque.parentNode.removeChild(calque);
        },1300);
        return true;
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
        try{exploserBossNukeIdleV1_();}catch(_e){}
        REG.idleCombatIdentiteV116='';
        REG.idleProchainCoupJoueurV116=0;
        REG.idleProchainCoupBossV116=0;

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
                REG.idleCombatIdentiteV116='';
                REG.idleProchainCoupJoueurV116=0;
                REG.idleProchainCoupBossV116=0;

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

      function bossNukableIdleV198_(j){
        if(!j)return false;

        return (
          idleNombre_(j.puissance)/5 >
            idleNombre_(j.defenseBoss) &&
          idleNombre_(j.defense)/5 >
            idleNombre_(j.attaqueBoss)
        );
      }

      /*
       * LA BORNE D'ARCADE (Norman, 2026-10-10) : fronton lumineux, pupitre incliné aux trois vrais boutons, trappe à pièces. Dessins SVG originaux (source : la maquette validée) ; baguette bleue à gauche, rouge à droite,
       * rose là où elles se rejoignent. L'écran garde le contenu du jeu (barres de vie, noms, portraits). Allumage une fois par Renaissance : etatBorneIdleV2_ (chronologie calée sur le son, audio-borne-v1.js).
       */
      const BORNE_FRONTON_IDLE_V2="<svg class=\"bn-fronton\" viewBox=\"0 0 520 100\" aria-hidden=\"true\"><defs><linearGradient id=\"bnFr\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#232a6a\"/><stop offset=\"1\" stop-color=\"#0a0d2a\"/></linearGradient><linearGradient id=\"bnEn\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#1b2a7a\"/><stop offset=\"1\" stop-color=\"#0a1040\"/></linearGradient><linearGradient id=\"bnTx\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff2a8\"/><stop offset=\".5\" stop-color=\"#ffd24a\"/><stop offset=\"1\" stop-color=\"#ff8a1f\"/></linearGradient><linearGradient id=\"bnNeon\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#2f7bff\"/><stop offset=\".5\" stop-color=\"#ff4fb0\"/><stop offset=\"1\" stop-color=\"#ff2a3d\"/></linearGradient><filter id=\"bnLueur\" x=\"-20%\" y=\"-60%\" width=\"140%\" height=\"220%\"><feGaussianBlur stdDeviation=\"4.5\" result=\"b\"/><feMerge><feMergeNode in=\"b\"/><feMergeNode in=\"SourceGraphic\"/></feMerge></filter><filter id=\"bnFlou\" x=\"-30%\" y=\"-80%\" width=\"160%\" height=\"260%\"><feGaussianBlur stdDeviation=\"8\"/></filter></defs><path d=\"M0 100 V28 Q0 6 22 6 H498 Q520 6 520 28 V100 Z\" fill=\"url(#bnFr)\" stroke=\"#05071a\" stroke-width=\"4\"/><!-- baguette : bleue à gauche, rouge à droite, rose là où elles se rejoignent --><g class=\"pulse\"><path d=\"M5 100 V28 Q5 11 22 11 H498 Q515 11 515 28 V100\" fill=\"none\" stroke=\"url(#bnNeon)\" stroke-width=\"12\" opacity=\".55\" filter=\"url(#bnFlou)\"/></g><path d=\"M5 100 V28 Q5 11 22 11 H498 Q515 11 515 28 V100\" fill=\"none\" stroke=\"url(#bnNeon)\" stroke-width=\"8\" stroke-linecap=\"round\"/><path d=\"M5 100 V28 Q5 11 22 11 H498 Q515 11 515 28 V100\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2\" opacity=\".55\" stroke-linecap=\"round\"/><!-- enseigne --><rect x=\"52\" y=\"21\" width=\"416\" height=\"62\" rx=\"12\" fill=\"url(#bnEn)\" stroke=\"#ffd24a\" stroke-width=\"3.5\"/><rect x=\"58\" y=\"27\" width=\"404\" height=\"50\" rx=\"8\" fill=\"none\" stroke=\"#ff4fb0\" stroke-width=\"1.6\" opacity=\".8\"/><g class=\"pulse\"><text x=\"260\" y=\"66\" text-anchor=\"middle\" font-family=\"Bangers,'Russo One',Impact,sans-serif\" font-size=\"50\" letter-spacing=\"5\" fill=\"#ffb347\" filter=\"url(#bnFlou)\" opacity=\".9\">SOREAL IDLE</text></g><text x=\"260\" y=\"66\" text-anchor=\"middle\" font-family=\"Bangers,'Russo One',Impact,sans-serif\" font-size=\"50\" letter-spacing=\"5\" fill=\"url(#bnTx)\" stroke=\"#5a2a00\" stroke-width=\"4\" paint-order=\"stroke\">SOREAL IDLE</text><g stroke=\"#6a3d00\" stroke-width=\"1.2\"><polygon class=\"etoile\" style=\"--d:0s\" fill=\"#ffd24a\" points=\"76,52 80,43 84,52 93,56 84,60 80,69 76,60 67,56\"/><polygon class=\"etoile\" style=\"--d:-1.1s\" fill=\"#ffd24a\" points=\"444,52 448,43 452,52 461,56 452,60 448,69 444,60 435,56\"/></g><g fill=\"#04061a\" stroke=\"#2a3170\" stroke-width=\"1\"><rect x=\"16\" y=\"28\" width=\"26\" height=\"50\" rx=\"6\"/><rect x=\"478\" y=\"28\" width=\"26\" height=\"50\" rx=\"6\"/></g><g stroke=\"#3a438f\" stroke-width=\"2.4\" stroke-linecap=\"round\"><path d=\"M21 38 H37 M21 46 H37 M21 54 H37 M21 62 H37 M21 70 H37\"/><path d=\"M483 38 H499 M483 46 H499 M483 54 H499 M483 62 H499 M483 70 H499\"/></g><!-- filet du bas : même dégradé, sans aucun trou avec le corps --><rect x=\"0\" y=\"88\" width=\"520\" height=\"12\" fill=\"#070a20\"/><g class=\"pulse\"><path d=\"M0 91 H520\" stroke=\"url(#bnNeon)\" stroke-width=\"8\" opacity=\".6\" filter=\"url(#bnFlou)\"/></g><path d=\"M0 91 H520\" stroke=\"url(#bnNeon)\" stroke-width=\"4\"/></svg>";

      const BORNE_PUPITRE_IDLE_V2="<svg class=\"bn-deck-svg\" viewBox=\"0 0 552 190\" aria-hidden=\"true\"><defs><linearGradient id=\"bnPl\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#454d9a\"/><stop offset=\".72\" stop-color=\"#262c66\"/><stop offset=\"1\" stop-color=\"#1a1e4c\"/></linearGradient><linearGradient id=\"bnNeonP\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#2f7bff\"/><stop offset=\".5\" stop-color=\"#ff4fb0\"/><stop offset=\"1\" stop-color=\"#ff2a3d\"/></linearGradient><linearGradient id=\"bnLevre\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#1b2060\"/><stop offset=\"1\" stop-color=\"#090c28\"/></linearGradient><linearGradient id='bnBdB' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#06102a'/><stop offset='.35' stop-color='#2f7bff'/><stop offset='.5' stop-color='#a9c8ff'/><stop offset='.65' stop-color='#2f7bff'/><stop offset='1' stop-color='#06102a'/></linearGradient><linearGradient id='bnBdR' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#2a0610'/><stop offset='.35' stop-color='#ff2a3d'/><stop offset='.5' stop-color='#ff9aa2'/><stop offset='.65' stop-color='#ff2a3d'/><stop offset='1' stop-color='#2a0610'/></linearGradient><linearGradient id='bnGlB' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#2f7bff' stop-opacity='0'/><stop offset='.5' stop-color='#2f7bff' stop-opacity='.7'/><stop offset='1' stop-color='#2f7bff' stop-opacity='0'/></linearGradient><linearGradient id='bnGlR' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#ff2a3d' stop-opacity='0'/><stop offset='.5' stop-color='#ff2a3d' stop-opacity='.7'/><stop offset='1' stop-color='#ff2a3d' stop-opacity='0'/></linearGradient></defs><path d=\"M16 0 H536 L552 140 H0 Z\" fill=\"url(#bnPl)\" stroke=\"#05071a\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M16 3 H536\" stroke=\"url(#bnNeonP)\" stroke-width=\"4\"/><path d=\"M0 140 H552 V176 Q552 186 542 186 H10 Q0 186 0 176 Z\" fill=\"url(#bnLevre)\" stroke=\"#05071a\" stroke-width=\"4\"/><path d=\"M6 143 H546\" stroke=\"url(#bnNeonP)\" stroke-width=\"3\"/><g class='bn-lueur' style='animation:bnLuitB 3.2s ease-in-out infinite'><rect x='-9' y='0' width='60' height='186' fill='url(#bnGlB)'/><rect x='16' y='0' width='10' height='186' fill='url(#bnBdB)'/></g><g class='bn-lueur' style='animation:bnLuitR 3.2s ease-in-out infinite'><rect x='501' y='0' width='60' height='186' fill='url(#bnGlR)'/><rect x='526' y='0' width='10' height='186' fill='url(#bnBdR)'/></g><style>@media (prefers-reduced-motion:reduce){.bn-lueur{animation:none!important}}</style></svg>";

      const BORNE_BAS_IDLE_V2="<svg class=\"bn-bas-svg\" viewBox=\"0 0 520 250\" overflow='visible' aria-hidden=\"true\"><defs><linearGradient id=\"bnMe\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#b9c0d0\"/><stop offset=\".5\" stop-color=\"#7d8699\"/><stop offset=\"1\" stop-color=\"#4b5263\"/></linearGradient><linearGradient id=\"bnNeonB\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#2f7bff\"/><stop offset=\".5\" stop-color=\"#ff4fb0\"/><stop offset=\"1\" stop-color=\"#ff2a3d\"/></linearGradient><linearGradient id=\"bnBd\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#161b4a\"/><stop offset=\"1\" stop-color=\"#0a0d2a\"/></linearGradient><linearGradient id='bnBdB2' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#06102a'/><stop offset='.35' stop-color='#2f7bff'/><stop offset='.5' stop-color='#a9c8ff'/><stop offset='.65' stop-color='#2f7bff'/><stop offset='1' stop-color='#06102a'/></linearGradient><linearGradient id='bnBdR2' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#2a0610'/><stop offset='.35' stop-color='#ff2a3d'/><stop offset='.5' stop-color='#ff9aa2'/><stop offset='.65' stop-color='#ff2a3d'/><stop offset='1' stop-color='#2a0610'/></linearGradient><linearGradient id='bnGlB2' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#2f7bff' stop-opacity='0'/><stop offset='.5' stop-color='#2f7bff' stop-opacity='.7'/><stop offset='1' stop-color='#2f7bff' stop-opacity='0'/></linearGradient><linearGradient id='bnGlR2' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#ff2a3d' stop-opacity='0'/><stop offset='.5' stop-color='#ff2a3d' stop-opacity='.7'/><stop offset='1' stop-color='#ff2a3d' stop-opacity='0'/></linearGradient></defs><rect x=\"0\" y=\"0\" width=\"520\" height=\"210\" fill=\"url(#bnBd)\"/><g class='bn-lueur' style='animation:bnLuitB 3.2s ease-in-out infinite'><rect x='-25' y='0' width='60' height='210' fill='url(#bnGlB2)'/><rect x='0' y='0' width='10' height='210' fill='url(#bnBdB2)'/></g><g class='bn-lueur' style='animation:bnLuitR 3.2s ease-in-out infinite'><rect x='485' y='0' width='60' height='210' fill='url(#bnGlR2)'/><rect x='510' y='0' width='10' height='210' fill='url(#bnBdR2)'/></g><!-- décor de flanc : bandeau d'étoiles --><g fill=\"#ffd24a\"><polygon class=\"etoile\" style=\"--d:-.4s\" points=\"40,20 43,28 52,29 45,34 47,43 40,38 33,43 35,34 28,29 37,28\"/><polygon class=\"etoile\" style=\"--d:-1.5s\" points=\"480,20 483,28 492,29 485,34 487,43 480,38 473,43 475,34 468,29 477,28\"/></g><!-- trappe --><rect x=\"76\" y=\"14\" width=\"368\" height=\"170\" rx=\"14\" fill=\"url(#bnMe)\" stroke=\"#05071a\" stroke-width=\"4\"/><rect x=\"86\" y=\"24\" width=\"348\" height=\"150\" rx=\"9\" fill=\"none\" stroke=\"#e8edf7\" stroke-width=\"2\" opacity=\".7\"/><g fill=\"#5b6475\" stroke=\"#05071a\" stroke-width=\"1.4\"><circle cx=\"94\" cy=\"32\" r=\"4\"/><circle cx=\"426\" cy=\"32\" r=\"4\"/><circle cx=\"94\" cy=\"166\" r=\"4\"/><circle cx=\"426\" cy=\"166\" r=\"4\"/></g><text x=\"260\" y=\"48\" font-family=\"Bangers,Impact,sans-serif\" font-size=\"22\" letter-spacing=\"4\" text-anchor=\"middle\" fill=\"#7a1410\">INSERT COIN</text><!-- deux monnayeurs --><g><rect x=\"110\" y=\"62\" width=\"120\" height=\"86\" rx=\"10\" fill=\"#10143a\" stroke=\"#05071a\" stroke-width=\"3\"/><rect x=\"122\" y=\"74\" width=\"96\" height=\"62\" rx=\"6\" fill=\"#1d2250\" stroke=\"#ffd24a\" stroke-width=\"2\"/><rect x=\"166\" y=\"82\" width=\"8\" height=\"34\" rx=\"3\" fill=\"#000\"/><rect x=\"164\" y=\"80\" width=\"12\" height=\"38\" rx=\"4\" fill=\"none\" stroke=\"#ffd24a\" stroke-width=\"2\"/><circle cx=\"170\" cy=\"128\" r=\"6\" fill=\"#ff3d3d\"/><circle cx=\"170\" cy=\"128\" r=\"9\" fill=\"none\" stroke=\"#ff3d3d\" stroke-width=\"1.4\" opacity=\".6\"/></g><g><rect x=\"290\" y=\"62\" width=\"120\" height=\"86\" rx=\"10\" fill=\"#10143a\" stroke=\"#05071a\" stroke-width=\"3\"/><rect x=\"302\" y=\"74\" width=\"96\" height=\"62\" rx=\"6\" fill=\"#1d2250\" stroke=\"#ffd24a\" stroke-width=\"2\"/><rect x=\"346\" y=\"82\" width=\"8\" height=\"34\" rx=\"3\" fill=\"#000\"/><rect x=\"344\" y=\"80\" width=\"12\" height=\"38\" rx=\"4\" fill=\"none\" stroke=\"#ffd24a\" stroke-width=\"2\"/><circle cx=\"350\" cy=\"128\" r=\"6\" fill=\"#ff3d3d\"/><circle cx=\"350\" cy=\"128\" r=\"9\" fill=\"none\" stroke=\"#ff3d3d\" stroke-width=\"1.4\" opacity=\".6\"/></g><!-- retour de monnaie, serrure --><rect x=\"240\" y=\"96\" width=\"40\" height=\"30\" rx=\"7\" fill=\"#2a2f66\" stroke=\"#05071a\" stroke-width=\"3\"/><rect x=\"249\" y=\"104\" width=\"22\" height=\"9\" rx=\"3\" fill=\"#ff3d3d\" stroke=\"#05071a\" stroke-width=\"2\"/><circle cx=\"260\" cy=\"150\" r=\"9\" fill=\"#d79a1f\" stroke=\"#05071a\" stroke-width=\"2.4\"/><rect x=\"258\" y=\"147\" width=\"4\" height=\"9\" rx=\"1\" fill=\"#05071a\"/><!-- soubassement et pieds --><rect x=\"0\" y=\"210\" width=\"520\" height=\"24\" fill=\"#05071a\"/><path d=\"M0 210 H520\" stroke=\"url(#bnNeonB)\" stroke-width=\"4\"/><rect x=\"24\" y=\"230\" width=\"60\" height=\"14\" rx=\"4\" fill=\"#1a1a22\" stroke=\"#05071a\" stroke-width=\"2\"/><rect x=\"436\" y=\"230\" width=\"60\" height=\"14\" rx=\"4\" fill=\"#1a1a22\" stroke=\"#05071a\" stroke-width=\"2\"/><ellipse cx=\"260\" cy=\"246\" rx=\"240\" ry=\"6\" fill=\"rgba(0,0,0,.5)\"/></svg>";

      /* Décor derrière la borne (Norman, 2026-10-10) : une salle d'arcade sombre éclairée par des néons, avec bornes et machines à sous. Source : scratchpad/salle.py. */
      const BORNE_LUNAPARK_IDLE_V2="<svg class='bn-lunapark-svg' viewBox='0 0 800 900' preserveAspectRatio='xMidYMid slice' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'><defs><linearGradient id='saMur' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#030208'/><stop offset='.35' stop-color='#0d0818'/><stop offset='.82' stop-color='#170b27'/><stop offset='1' stop-color='#1d0c2e'/></linearGradient><linearGradient id='saSol' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#160a22'/><stop offset='1' stop-color='#050309'/></linearGradient><filter id='saFlou' x='-60%' y='-60%' width='220%' height='220%'><feGaussianBlur stdDeviation='5'/></filter><filter id='saFlouF' x='-60%' y='-60%' width='220%' height='220%'><feGaussianBlur stdDeviation='2.2'/></filter><pattern id='saMotif' width='46' height='46' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'><rect width='46' height='46' fill='none'/><path d='M0 23 H46 M23 0 V46' stroke='#2a1448' stroke-width='1' opacity='.55'/></pattern></defs><rect width='800' height='900' fill='url(#saMur)'/><rect width='800' height='760' fill='url(#saMotif)' opacity='.5'/><rect width='800' height='44' fill='#04020a'/><rect x='0' y='0' width='10' height='58' fill='#04020a'/><rect x='160' y='0' width='10' height='58' fill='#04020a'/><rect x='320' y='0' width='10' height='58' fill='#04020a'/><rect x='480' y='0' width='10' height='58' fill='#04020a'/><rect x='640' y='0' width='10' height='58' fill='#04020a'/><rect x='800' y='0' width='10' height='58' fill='#04020a'/><g class='lp-neon' style='--d:-0.4s'><path d='M0 118 L800 118' stroke='#ff2d95' stroke-width='14' stroke-linecap='round' opacity='.55' filter='url(#saFlou)'/><path d='M0 118 L800 118' stroke='#ff2d95' stroke-width='4' stroke-linecap='round'/><path d='M0 118 L800 118' stroke='#fff' stroke-width='1.4' stroke-linecap='round' opacity='.7'/></g><g class='lp-neon' style='--d:-1.7s'><path d='M0 560 L800 560' stroke='#1ee6ff' stroke-width='14' stroke-linecap='round' opacity='.55' filter='url(#saFlou)'/><path d='M0 560 L800 560' stroke='#1ee6ff' stroke-width='4' stroke-linecap='round'/><path d='M0 560 L800 560' stroke='#fff' stroke-width='1.4' stroke-linecap='round' opacity='.7'/></g><g class='lp-neon' style='--d:-0.9s' transform='rotate(-4 112 215)'><text x='112' y='215' text-anchor='middle' font-family=\"Bangers,'Russo One',Impact,sans-serif\" font-size='54' letter-spacing='4' fill='#1ee6ff' stroke='#1ee6ff' stroke-width='7' opacity='.55' filter='url(#saFlou)'>GAME</text><text x='112' y='215' text-anchor='middle' font-family=\"Bangers,'Russo One',Impact,sans-serif\" font-size='54' letter-spacing='4' fill='none' stroke='#1ee6ff' stroke-width='3'>GAME</text><text x='112' y='215' text-anchor='middle' font-family=\"Bangers,'Russo One',Impact,sans-serif\" font-size='54' letter-spacing='4' fill='#fff' fill-opacity='.18'>GAME</text></g><g class='lp-neon' style='--d:-2.1s' transform='rotate(3 690 235)'><text x='690' y='235' text-anchor='middle' font-family=\"Bangers,'Russo One',Impact,sans-serif\" font-size='46' letter-spacing='4' fill='#ff2d95' stroke='#ff2d95' stroke-width='7' opacity='.55' filter='url(#saFlou)'>JACKPOT</text><text x='690' y='235' text-anchor='middle' font-family=\"Bangers,'Russo One',Impact,sans-serif\" font-size='46' letter-spacing='4' fill='none' stroke='#ff2d95' stroke-width='3'>JACKPOT</text><text x='690' y='235' text-anchor='middle' font-family=\"Bangers,'Russo One',Impact,sans-serif\" font-size='46' letter-spacing='4' fill='#fff' fill-opacity='.18'>JACKPOT</text></g><g class='lp-neon' style='--d:-1.3s' transform='rotate(0 400 520)'><text x='400' y='520' text-anchor='middle' font-family=\"Bangers,'Russo One',Impact,sans-serif\" font-size='40' letter-spacing='4' fill='#ffb020' stroke='#ffb020' stroke-width='7' opacity='.55' filter='url(#saFlou)'>PLAY</text><text x='400' y='520' text-anchor='middle' font-family=\"Bangers,'Russo One',Impact,sans-serif\" font-size='40' letter-spacing='4' fill='none' stroke='#ffb020' stroke-width='3'>PLAY</text><text x='400' y='520' text-anchor='middle' font-family=\"Bangers,'Russo One',Impact,sans-serif\" font-size='40' letter-spacing='4' fill='#fff' fill-opacity='.18'>PLAY</text></g><g opacity='.62'><g><path d='M20 480 V363.0 Q20 330 30.5 330 H79.5 Q90 330 90 363.0 V480 Z' fill='#0c0714' stroke='#04020a' stroke-width='3'/><rect class='lp-ecran' style='--d:0s' x='28.4' y='337.5' width='53.2' height='13.5' rx='3' fill='#8a4bff' opacity='.85'/><rect x='28.4' y='357.0' width='53.2' height='45.0' rx='4' fill='#05030a'/><rect class='lp-ecran' style='--d:-0.8s' x='31.200000000000003' y='361.5' width='47.6' height='36.0' rx='3' fill='#8a4bff' opacity='.8'/><g stroke='#05030a' stroke-width='2' opacity='.6'><path d='M31.200000000000003 373.5 H78.8 M31.200000000000003 384.0 H78.8'/></g><path d='M20 412.5 L27.0 405.0 H83.0 L90 412.5 V423.0 H20 Z' fill='#1a0f2c' stroke='#04020a' stroke-width='2'/><circle cx='41.0' cy='412.5' r='3.5' fill='#e5483f'/><circle cx='62.0' cy='412.5' r='2.8000000000000003' fill='#8a4bff'/><circle cx='71.8' cy='412.5' r='2.8000000000000003' fill='#ffd24a'/></g><ellipse cx='55.0' cy='486' rx='56.0' ry='10' fill='#8a4bff' opacity='.22' filter='url(#saFlou)'/></g><g opacity='.62'><g><path d='M100 480 V356.76 Q100 322 110.5 322 H159.5 Q170 322 170 356.76 V480 Z' fill='#0c0714' stroke='#04020a' stroke-width='3'/><rect class='lp-ecran' style='--d:-1s' x='108.4' y='329.9' width='53.2' height='14.219999999999999' rx='3' fill='#38ff8a' opacity='.85'/><rect x='108.4' y='350.44' width='53.2' height='47.4' rx='4' fill='#05030a'/><rect class='lp-ecran' style='--d:-1.8s' x='111.2' y='355.18' width='47.6' height='37.92' rx='3' fill='#38ff8a' opacity='.8'/><g stroke='#05030a' stroke-width='2' opacity='.6'><path d='M111.2 367.82 H158.8 M111.2 378.88 H158.8'/></g><path d='M100 408.9 L107.0 401.0 H163.0 L170 408.9 V419.96 H100 Z' fill='#1a0f2c' stroke='#04020a' stroke-width='2'/><circle cx='121.0' cy='408.9' r='3.5' fill='#e5483f'/><circle cx='142.0' cy='408.9' r='2.8000000000000003' fill='#38ff8a'/><circle cx='151.8' cy='408.9' r='2.8000000000000003' fill='#ffd24a'/></g><ellipse cx='135.0' cy='486' rx='56.0' ry='10' fill='#38ff8a' opacity='.22' filter='url(#saFlou)'/></g><g opacity='.62'><g><path d='M640 480 V359.88 Q640 326 650.5 326 H699.5 Q710 326 710 359.88 V480 Z' fill='#0c0714' stroke='#04020a' stroke-width='3'/><rect class='lp-ecran' style='--d:-2s' x='648.4' y='333.7' width='53.2' height='13.86' rx='3' fill='#ffb020' opacity='.85'/><rect x='648.4' y='353.72' width='53.2' height='46.199999999999996' rx='4' fill='#05030a'/><rect class='lp-ecran' style='--d:-2.8s' x='651.2' y='358.34' width='47.6' height='36.96' rx='3' fill='#ffb020' opacity='.8'/><g stroke='#05030a' stroke-width='2' opacity='.6'><path d='M651.2 370.65999999999997 H698.8 M651.2 381.44 H698.8'/></g><path d='M640 410.7 L647.0 403.0 H703.0 L710 410.7 V421.48 H640 Z' fill='#1a0f2c' stroke='#04020a' stroke-width='2'/><circle cx='661.0' cy='410.7' r='3.5' fill='#e5483f'/><circle cx='682.0' cy='410.7' r='2.8000000000000003' fill='#ffb020'/><circle cx='691.8' cy='410.7' r='2.8000000000000003' fill='#ffd24a'/></g><ellipse cx='675.0' cy='486' rx='56.0' ry='10' fill='#ffb020' opacity='.22' filter='url(#saFlou)'/></g><g opacity='.62'><g><path d='M720 480 V366.12 Q720 334 730.5 334 H779.5 Q790 334 790 366.12 V480 Z' fill='#0c0714' stroke='#04020a' stroke-width='3'/><rect class='lp-ecran' style='--d:-3s' x='728.4' y='341.3' width='53.2' height='13.139999999999999' rx='3' fill='#1ee6ff' opacity='.85'/><rect x='728.4' y='360.28' width='53.2' height='43.8' rx='4' fill='#05030a'/><rect class='lp-ecran' style='--d:-3.8s' x='731.2' y='364.66' width='47.6' height='35.04' rx='3' fill='#1ee6ff' opacity='.8'/><g stroke='#05030a' stroke-width='2' opacity='.6'><path d='M731.2 376.34 H778.8 M731.2 386.56 H778.8'/></g><path d='M720 414.3 L727.0 407.0 H783.0 L790 414.3 V424.52 H720 Z' fill='#1a0f2c' stroke='#04020a' stroke-width='2'/><circle cx='741.0' cy='414.3' r='3.5' fill='#e5483f'/><circle cx='762.0' cy='414.3' r='2.8000000000000003' fill='#1ee6ff'/><circle cx='771.8' cy='414.3' r='2.8000000000000003' fill='#ffd24a'/></g><ellipse cx='755.0' cy='486' rx='56.0' ry='10' fill='#1ee6ff' opacity='.22' filter='url(#saFlou)'/></g><g><path d='M-14 720 V525.0 Q-14 470 1.5999999999999996 470 H74.39999999999999 Q90 470 90 525.0 V720 Z' fill='#0c0714' stroke='#04020a' stroke-width='3'/><rect class='lp-ecran' style='--d:-0.4s' x='-1.5199999999999996' y='482.5' width='79.04' height='22.5' rx='3' fill='#ff2d95' opacity='.85'/><rect x='-1.5199999999999996' y='515.0' width='79.04' height='75.0' rx='4' fill='#05030a'/><rect class='lp-ecran' style='--d:-1.2000000000000002s' x='2.6400000000000006' y='522.5' width='70.72' height='60.0' rx='3' fill='#ff2d95' opacity='.8'/><g stroke='#05030a' stroke-width='2' opacity='.6'><path d='M2.6400000000000006 542.5 H73.36 M2.6400000000000006 560.0 H73.36'/></g><path d='M-14 607.5 L-3.5999999999999996 595.0 H79.60000000000001 L90 607.5 V625.0 H-14 Z' fill='#1a0f2c' stroke='#04020a' stroke-width='2'/><circle cx='17.2' cy='607.5' r='5.2' fill='#e5483f'/><circle cx='48.4' cy='607.5' r='4.16' fill='#ff2d95'/><circle cx='62.959999999999994' cy='607.5' r='4.16' fill='#ffd24a'/></g><ellipse cx='38.0' cy='726' rx='83.2' ry='10' fill='#ff2d95' opacity='.22' filter='url(#saFlou)'/><g><path d='M92 720 V540.6 Q92 490 106.4 490 H173.6 Q188 490 188 540.6 V720 Z' fill='#0c0714' stroke='#04020a' stroke-width='3'/><rect class='lp-ecran' style='--d:-1.5s' x='103.52' y='501.5' width='72.96000000000001' height='20.7' rx='3' fill='#1ee6ff' opacity='.85'/><rect x='103.52' y='531.4' width='72.96000000000001' height='69.0' rx='4' fill='#05030a'/><rect class='lp-ecran' style='--d:-2.3s' x='107.36' y='538.3' width='65.28' height='55.199999999999996' rx='3' fill='#1ee6ff' opacity='.8'/><g stroke='#05030a' stroke-width='2' opacity='.6'><path d='M107.36 556.7 H172.64 M107.36 572.8 H172.64'/></g><path d='M92 616.5 L101.6 605.0 H178.4 L188 616.5 V632.6 H92 Z' fill='#1a0f2c' stroke='#04020a' stroke-width='2'/><circle cx='120.8' cy='616.5' r='4.800000000000001' fill='#e5483f'/><circle cx='149.6' cy='616.5' r='3.84' fill='#1ee6ff'/><circle cx='163.04' cy='616.5' r='3.84' fill='#ffd24a'/></g><ellipse cx='140.0' cy='726' rx='76.80000000000001' ry='10' fill='#1ee6ff' opacity='.22' filter='url(#saFlou)'/><g><path d='M612 720 V537.48 Q612 486 626.4 486 H693.6 Q708 486 708 537.48 V720 Z' fill='#0c0714' stroke='#04020a' stroke-width='3'/><rect class='lp-ecran' style='--d:-2.3s' x='623.52' y='497.7' width='72.96000000000001' height='21.06' rx='3' fill='#38ff8a' opacity='.85'/><rect x='623.52' y='528.12' width='72.96000000000001' height='70.2' rx='4' fill='#05030a'/><rect class='lp-ecran' style='--d:-3.0999999999999996s' x='627.36' y='535.14' width='65.28' height='56.16' rx='3' fill='#38ff8a' opacity='.8'/><g stroke='#05030a' stroke-width='2' opacity='.6'><path d='M627.36 553.86 H692.64 M627.36 570.24 H692.64'/></g><path d='M612 614.7 L621.6 603.0 H698.4 L708 614.7 V631.08 H612 Z' fill='#1a0f2c' stroke='#04020a' stroke-width='2'/><circle cx='640.8' cy='614.7' r='4.800000000000001' fill='#e5483f'/><circle cx='669.6' cy='614.7' r='3.84' fill='#38ff8a'/><circle cx='683.04' cy='614.7' r='3.84' fill='#ffd24a'/></g><ellipse cx='660.0' cy='726' rx='76.80000000000001' ry='10' fill='#38ff8a' opacity='.22' filter='url(#saFlou)'/><g><path d='M706 720 V521.88 Q706 466 722.2 466 H797.8 Q814 466 814 521.88 V720 Z' fill='#0c0714' stroke='#04020a' stroke-width='3'/><rect class='lp-ecran' style='--d:-0.9s' x='718.96' y='478.7' width='82.08' height='22.86' rx='3' fill='#ffb020' opacity='.85'/><rect x='718.96' y='511.72' width='82.08' height='76.2' rx='4' fill='#05030a'/><rect class='lp-ecran' style='--d:-1.7000000000000002s' x='723.28' y='519.34' width='73.44000000000001' height='60.96' rx='3' fill='#ffb020' opacity='.8'/><g stroke='#05030a' stroke-width='2' opacity='.6'><path d='M723.28 539.66 H796.72 M723.28 557.44 H796.72'/></g><path d='M706 605.7 L716.8 593.0 H803.2 L814 605.7 V623.48 H706 Z' fill='#1a0f2c' stroke='#04020a' stroke-width='2'/><circle cx='738.4' cy='605.7' r='5.4' fill='#e5483f'/><circle cx='770.8' cy='605.7' r='4.32' fill='#ffb020'/><circle cx='785.92' cy='605.7' r='4.32' fill='#ffd24a'/></g><ellipse cx='760.0' cy='726' rx='86.4' ry='10' fill='#ffb020' opacity='.22' filter='url(#saFlou)'/><g><path d='M8 850 V726 Q8 700 30 700 H64 Q86 700 86 726 V850 Z' fill='#1a0a1e' stroke='#04020a' stroke-width='3'/><circle class='lp-ampoule' style='--d:0.00s' cx='17' cy='710' r='3.4' fill='#ff2d95'/><circle class='lp-ampoule' style='--d:-0.28s' cx='27' cy='710' r='3.4' fill='#1ee6ff'/><circle class='lp-ampoule' style='--d:-0.56s' cx='37' cy='710' r='3.4' fill='#38ff8a'/><circle class='lp-ampoule' style='--d:-0.84s' cx='47' cy='710' r='3.4' fill='#ffb020'/><circle class='lp-ampoule' style='--d:-1.12s' cx='57' cy='710' r='3.4' fill='#8a4bff'/><circle class='lp-ampoule' style='--d:-1.40s' cx='67' cy='710' r='3.4' fill='#ff2d95'/><circle class='lp-ampoule' style='--d:-1.68s' cx='77' cy='710' r='3.4' fill='#1ee6ff'/><rect x='16' y='722' width='62' height='22' rx='4' fill='#ff2d95' opacity='.75' class='lp-ecran' style='--d:-0.2s'/><text x='47.0' y='738' text-anchor='middle' font-family=\"Bangers,Impact,sans-serif\" font-size='15' letter-spacing='2' fill='#05030a'>SLOTS</text><rect x='17' y='752' width='60' height='44' rx='5' fill='#05030a' stroke='#3a2a55' stroke-width='2'/><rect x='20.0' y='756' width='16.0' height='36' rx='3' fill='#f4efe2' opacity='.9'/><text x='28.0' y='782' text-anchor='middle' font-family='Impact,sans-serif' font-size='24' fill='#e5483f'>7</text><rect x='38.0' y='756' width='16.0' height='36' rx='3' fill='#f4efe2' opacity='.9'/><text x='46.0' y='782' text-anchor='middle' font-family='Impact,sans-serif' font-size='24' fill='#d4a017'>★</text><rect x='56.0' y='756' width='16.0' height='36' rx='3' fill='#f4efe2' opacity='.9'/><text x='64.0' y='782' text-anchor='middle' font-family='Impact,sans-serif' font-size='24' fill='#e5483f'>7</text><rect x='17' y='804' width='60' height='10' rx='3' fill='#2a1740'/><circle cx='31.4' cy='809' r='3' fill='#ff2d95'/><circle cx='47.0' cy='809' r='3' fill='#ff2d95'/><circle cx='62.599999999999994' cy='809' r='3' fill='#ff2d95'/><rect x='26' y='824' width='42' height='12' rx='3' fill='#05030a'/><path d='M88 760 q16 -4 14 -30' stroke='#9aa3b2' stroke-width='4' fill='none' stroke-linecap='round'/><circle cx='102' cy='728' r='7' fill='#e5483f' stroke='#04020a' stroke-width='2'/></g><ellipse cx='47.0' cy='856' rx='62.400000000000006' ry='9' fill='#ff2d95' opacity='.25' filter='url(#saFlou)'/><g><path d='M96 862 V738 Q96 712 118 712 H152 Q174 712 174 738 V862 Z' fill='#1a0a1e' stroke='#04020a' stroke-width='3'/><circle class='lp-ampoule' style='--d:0.00s' cx='105' cy='722' r='3.4' fill='#ff2d95'/><circle class='lp-ampoule' style='--d:-0.28s' cx='115' cy='722' r='3.4' fill='#1ee6ff'/><circle class='lp-ampoule' style='--d:-0.56s' cx='125' cy='722' r='3.4' fill='#38ff8a'/><circle class='lp-ampoule' style='--d:-0.84s' cx='135' cy='722' r='3.4' fill='#ffb020'/><circle class='lp-ampoule' style='--d:-1.12s' cx='145' cy='722' r='3.4' fill='#8a4bff'/><circle class='lp-ampoule' style='--d:-1.40s' cx='155' cy='722' r='3.4' fill='#ff2d95'/><circle class='lp-ampoule' style='--d:-1.68s' cx='165' cy='722' r='3.4' fill='#1ee6ff'/><rect x='104' y='734' width='62' height='22' rx='4' fill='#ffb020' opacity='.75' class='lp-ecran' style='--d:-1.2s'/><text x='135.0' y='750' text-anchor='middle' font-family=\"Bangers,Impact,sans-serif\" font-size='15' letter-spacing='2' fill='#05030a'>SLOTS</text><rect x='105' y='764' width='60' height='44' rx='5' fill='#05030a' stroke='#3a2a55' stroke-width='2'/><rect x='108.0' y='768' width='16.0' height='36' rx='3' fill='#f4efe2' opacity='.9'/><text x='116.0' y='794' text-anchor='middle' font-family='Impact,sans-serif' font-size='24' fill='#e5483f'>7</text><rect x='126.0' y='768' width='16.0' height='36' rx='3' fill='#f4efe2' opacity='.9'/><text x='134.0' y='794' text-anchor='middle' font-family='Impact,sans-serif' font-size='24' fill='#d4a017'>★</text><rect x='144.0' y='768' width='16.0' height='36' rx='3' fill='#f4efe2' opacity='.9'/><text x='152.0' y='794' text-anchor='middle' font-family='Impact,sans-serif' font-size='24' fill='#e5483f'>7</text><rect x='105' y='816' width='60' height='10' rx='3' fill='#2a1740'/><circle cx='119.4' cy='821' r='3' fill='#ffb020'/><circle cx='135.0' cy='821' r='3' fill='#ffb020'/><circle cx='150.6' cy='821' r='3' fill='#ffb020'/><rect x='114' y='836' width='42' height='12' rx='3' fill='#05030a'/><path d='M176 772 q16 -4 14 -30' stroke='#9aa3b2' stroke-width='4' fill='none' stroke-linecap='round'/><circle cx='190' cy='740' r='7' fill='#e5483f' stroke='#04020a' stroke-width='2'/></g><ellipse cx='135.0' cy='868' rx='62.400000000000006' ry='9' fill='#ffb020' opacity='.25' filter='url(#saFlou)'/><g><path d='M620 858 V734 Q620 708 642 708 H676 Q698 708 698 734 V858 Z' fill='#1a0a1e' stroke='#04020a' stroke-width='3'/><circle class='lp-ampoule' style='--d:0.00s' cx='629' cy='718' r='3.4' fill='#ff2d95'/><circle class='lp-ampoule' style='--d:-0.28s' cx='639' cy='718' r='3.4' fill='#1ee6ff'/><circle class='lp-ampoule' style='--d:-0.56s' cx='649' cy='718' r='3.4' fill='#38ff8a'/><circle class='lp-ampoule' style='--d:-0.84s' cx='659' cy='718' r='3.4' fill='#ffb020'/><circle class='lp-ampoule' style='--d:-1.12s' cx='669' cy='718' r='3.4' fill='#8a4bff'/><circle class='lp-ampoule' style='--d:-1.40s' cx='679' cy='718' r='3.4' fill='#ff2d95'/><circle class='lp-ampoule' style='--d:-1.68s' cx='689' cy='718' r='3.4' fill='#1ee6ff'/><rect x='628' y='730' width='62' height='22' rx='4' fill='#1ee6ff' opacity='.75' class='lp-ecran' style='--d:-0.7s'/><text x='659.0' y='746' text-anchor='middle' font-family=\"Bangers,Impact,sans-serif\" font-size='15' letter-spacing='2' fill='#05030a'>SLOTS</text><rect x='629' y='760' width='60' height='44' rx='5' fill='#05030a' stroke='#3a2a55' stroke-width='2'/><rect x='632.0' y='764' width='16.0' height='36' rx='3' fill='#f4efe2' opacity='.9'/><text x='640.0' y='790' text-anchor='middle' font-family='Impact,sans-serif' font-size='24' fill='#e5483f'>7</text><rect x='650.0' y='764' width='16.0' height='36' rx='3' fill='#f4efe2' opacity='.9'/><text x='658.0' y='790' text-anchor='middle' font-family='Impact,sans-serif' font-size='24' fill='#d4a017'>★</text><rect x='668.0' y='764' width='16.0' height='36' rx='3' fill='#f4efe2' opacity='.9'/><text x='676.0' y='790' text-anchor='middle' font-family='Impact,sans-serif' font-size='24' fill='#e5483f'>7</text><rect x='629' y='812' width='60' height='10' rx='3' fill='#2a1740'/><circle cx='643.4' cy='817' r='3' fill='#1ee6ff'/><circle cx='659.0' cy='817' r='3' fill='#1ee6ff'/><circle cx='674.6' cy='817' r='3' fill='#1ee6ff'/><rect x='638' y='832' width='42' height='12' rx='3' fill='#05030a'/><path d='M700 768 q16 -4 14 -30' stroke='#9aa3b2' stroke-width='4' fill='none' stroke-linecap='round'/><circle cx='714' cy='736' r='7' fill='#e5483f' stroke='#04020a' stroke-width='2'/></g><ellipse cx='659.0' cy='864' rx='62.400000000000006' ry='9' fill='#1ee6ff' opacity='.25' filter='url(#saFlou)'/><g><path d='M708 848 V724 Q708 698 730 698 H764 Q786 698 786 724 V848 Z' fill='#1a0a1e' stroke='#04020a' stroke-width='3'/><circle class='lp-ampoule' style='--d:0.00s' cx='717' cy='708' r='3.4' fill='#ff2d95'/><circle class='lp-ampoule' style='--d:-0.28s' cx='727' cy='708' r='3.4' fill='#1ee6ff'/><circle class='lp-ampoule' style='--d:-0.56s' cx='737' cy='708' r='3.4' fill='#38ff8a'/><circle class='lp-ampoule' style='--d:-0.84s' cx='747' cy='708' r='3.4' fill='#ffb020'/><circle class='lp-ampoule' style='--d:-1.12s' cx='757' cy='708' r='3.4' fill='#8a4bff'/><circle class='lp-ampoule' style='--d:-1.40s' cx='767' cy='708' r='3.4' fill='#ff2d95'/><circle class='lp-ampoule' style='--d:-1.68s' cx='777' cy='708' r='3.4' fill='#1ee6ff'/><rect x='716' y='720' width='62' height='22' rx='4' fill='#38ff8a' opacity='.75' class='lp-ecran' style='--d:-1.9s'/><text x='747.0' y='736' text-anchor='middle' font-family=\"Bangers,Impact,sans-serif\" font-size='15' letter-spacing='2' fill='#05030a'>SLOTS</text><rect x='717' y='750' width='60' height='44' rx='5' fill='#05030a' stroke='#3a2a55' stroke-width='2'/><rect x='720.0' y='754' width='16.0' height='36' rx='3' fill='#f4efe2' opacity='.9'/><text x='728.0' y='780' text-anchor='middle' font-family='Impact,sans-serif' font-size='24' fill='#e5483f'>7</text><rect x='738.0' y='754' width='16.0' height='36' rx='3' fill='#f4efe2' opacity='.9'/><text x='746.0' y='780' text-anchor='middle' font-family='Impact,sans-serif' font-size='24' fill='#d4a017'>★</text><rect x='756.0' y='754' width='16.0' height='36' rx='3' fill='#f4efe2' opacity='.9'/><text x='764.0' y='780' text-anchor='middle' font-family='Impact,sans-serif' font-size='24' fill='#e5483f'>7</text><rect x='717' y='802' width='60' height='10' rx='3' fill='#2a1740'/><circle cx='731.4' cy='807' r='3' fill='#38ff8a'/><circle cx='747.0' cy='807' r='3' fill='#38ff8a'/><circle cx='762.6' cy='807' r='3' fill='#38ff8a'/><rect x='726' y='822' width='42' height='12' rx='3' fill='#05030a'/><path d='M788 758 q16 -4 14 -30' stroke='#9aa3b2' stroke-width='4' fill='none' stroke-linecap='round'/><circle cx='802' cy='726' r='7' fill='#e5483f' stroke='#04020a' stroke-width='2'/></g><ellipse cx='747.0' cy='854' rx='62.400000000000006' ry='9' fill='#38ff8a' opacity='.25' filter='url(#saFlou)'/><rect x='0' y='842' width='800' height='58' fill='url(#saSol)'/><path d='M0 844 H800' stroke='#ff2d95' stroke-width='2' opacity='.5'/><path d='M362 877 l8 -5 l8 5 l-8 5 Z' fill='none' stroke='#ffb020' stroke-width='1.6' opacity='.28'/><path d='M406 878 h14 M410 882 h14' stroke='#1ee6ff' stroke-width='1.6' opacity='.25'/><circle cx='381' cy='879' r='4.3' fill='none' stroke='#1ee6ff' stroke-width='1.6' opacity='.28'/><path d='M113 876 h14 M117 880 h14' stroke='#ff2d95' stroke-width='1.6' opacity='.25'/><path d='M786 894 h14 M790 898 h14' stroke='#8a4bff' stroke-width='1.6' opacity='.25'/><circle cx='126' cy='853' r='3.2' fill='none' stroke='#8a4bff' stroke-width='1.6' opacity='.28'/><path d='M152 863 l8 -5 l8 5 l-8 5 Z' fill='none' stroke='#ff2d95' stroke-width='1.6' opacity='.28'/><path d='M261 878 h14 M265 882 h14' stroke='#1ee6ff' stroke-width='1.6' opacity='.25'/><path d='M187 865 h14 M191 869 h14' stroke='#ff2d95' stroke-width='1.6' opacity='.25'/><path d='M68 881 h14 M72 885 h14' stroke='#ffb020' stroke-width='1.6' opacity='.25'/><path d='M797 889 l8 -5 l8 5 l-8 5 Z' fill='none' stroke='#38ff8a' stroke-width='1.6' opacity='.28'/><circle cx='606' cy='875' r='4.7' fill='none' stroke='#ff2d95' stroke-width='1.6' opacity='.28'/><path d='M86 857 l8 -5 l8 5 l-8 5 Z' fill='none' stroke='#38ff8a' stroke-width='1.6' opacity='.28'/><circle cx='53' cy='853' r='3.6' fill='none' stroke='#ff2d95' stroke-width='1.6' opacity='.28'/><path d='M728 873 l8 -5 l8 5 l-8 5 Z' fill='none' stroke='#ffb020' stroke-width='1.6' opacity='.28'/><path d='M58 880 l8 -5 l8 5 l-8 5 Z' fill='none' stroke='#38ff8a' stroke-width='1.6' opacity='.28'/><circle cx='70' cy='867' r='3.4' fill='none' stroke='#ffb020' stroke-width='1.6' opacity='.28'/><path d='M566 852 l8 -5 l8 5 l-8 5 Z' fill='none' stroke='#ffb020' stroke-width='1.6' opacity='.28'/><path d='M142 877 h14 M146 881 h14' stroke='#ffb020' stroke-width='1.6' opacity='.25'/><path d='M153 884 l8 -5 l8 5 l-8 5 Z' fill='none' stroke='#1ee6ff' stroke-width='1.6' opacity='.28'/><circle cx='515' cy='857' r='3.0' fill='none' stroke='#ffb020' stroke-width='1.6' opacity='.28'/><path d='M691 895 l8 -5 l8 5 l-8 5 Z' fill='none' stroke='#8a4bff' stroke-width='1.6' opacity='.28'/><path d='M798 853 l8 -5 l8 5 l-8 5 Z' fill='none' stroke='#1ee6ff' stroke-width='1.6' opacity='.28'/><circle cx='797' cy='878' r='3.1' fill='none' stroke='#8a4bff' stroke-width='1.6' opacity='.28'/><path d='M117 871 h14 M121 875 h14' stroke='#ff2d95' stroke-width='1.6' opacity='.25'/><circle cx='263' cy='865' r='3.3' fill='none' stroke='#ff2d95' stroke-width='1.6' opacity='.28'/><radialGradient id='saOmbre' cx='.5' cy='.5' r='.6'><stop offset='0' stop-color='#000' stop-opacity='.5'/><stop offset='1' stop-color='#000' stop-opacity='0'/></radialGradient><ellipse cx='400' cy='520' rx='330' ry='460' fill='url(#saOmbre)'/></svg>";

      let borneAllumageDebutIdleV2=0;

      const BORNE_ALLUMAGE_MS_IDLE_V2=2800;

      function etatBorneIdleV2_(j){
        const maintenant=Date.now();
        if(borneAllumageDebutIdleV2&&maintenant-borneAllumageDebutIdleV2<BORNE_ALLUMAGE_MS_IDLE_V2){
          return {classe:'allumage',t:(maintenant-borneAllumageDebutIdleV2)/1000};
        }
        const marque=String(idleEntier_((((j&&j.systemes)||{}).records||{}).totalRebirths||0));
        let vu=null;
        try{vu=localStorage.getItem('soreal_idle_borne_v1');}catch(_e){}
        if(vu===marque)return {classe:'allume',t:0};
        borneAllumageDebutIdleV2=maintenant;
        try{localStorage.setItem('soreal_idle_borne_v1',marque);}catch(_e){}
        jouerEffetAudioIdleV199_('borneAllume');
        return {classe:'allumage',t:0};
      }

      function pageCombatIdleV28_(j){
        const borne=etatBorneIdleV2_(j);
        /* La chronique du boss est accrochée au mur derrière la borne (cadre cliquable, qui s'agrandit) ; sans chronique, rien (ou le bouton Admin) reste à l'ancienne place. */
        const chronique=histoireBossMarkupIdleV142_(j);
        const chroniqueMur=chronique.indexOf('id="sorealIdleBossChroniqueV206"')>=0;
        /* Plus de cadre d'en-tête « Combat de boss » sur cette page (Norman, 2026-10-08). */
        return `
          <div class="bn-lunapark" aria-hidden="true">${BORNE_LUNAPARK_IDLE_V2}</div>
          ${chroniqueMur?chronique:''}
          <div class="soreal-idle-card-v4 soreal-idle-boss-current-v35 borne-v2 ${borne.classe}" style="--tt:${borne.t.toFixed(2)}s">
            <div class="soreal-idle-label-v4">BOSS ACTUEL</div>
            ${BORNE_FRONTON_IDLE_V2}

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
                        '',
                        '',
                        j.nom||'Joueur',
                        'soreal-idle-player-image-v41',
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

                  <!-- La barre de vie du joueur n'est plus sur la borne (Norman, 2026-10-08) : elle est dans le bandeau du haut. -->
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
                        urlBossR2IdleV1_(idImageBossCanoniqueIdleV181_(j))||j.bossImage,
                        j.bossActuel||'Boss',
                        'soreal-idle-boss-image-v35',
                        j.bossActuel||'Boss'
                      ) ||
                      '<div style="font-size:74px">👹</div>'
                    }
                  </div>

                  <!-- L'XP du boss s'affiche en bas à droite de son image (Norman, 2026-10-08) ; frère du portrait, pas dedans : un changement d'image ne l'efface pas. -->
                  <div class="soreal-idle-reward-v8 soreal-idle-xp-borne-v1">
                    <span class="soreal-idle-chip-v8">
                      +${idleEntier_(j.recompenseBossActuel&&j.recompenseBossActuel.xp)} XP
                      ${
                        idleNombre_(j.recompenseBossActuel&&j.recompenseBossActuel.xpMultiplicateur)<.999
                          ?' · '+Math.round(idleNombre_(j.recompenseBossActuel.xpMultiplicateur)*100)+' %'
                          :''
                      }
                    </span>
                  </div>

                  <div class="soreal-idle-duel-hp-v41">
                    <div
                      class="soreal-idle-note-v4"
                      id="sorealIdleBossPvV7"
                      style="text-align:center"
                    >
                      ❤️ ${formaterPvFixeIdleV1_(j.bossPv)}
                      / ${formaterPvFixeIdleV1_(j.bossPvMax)}
                    </div>

                    <div class="soreal-idle-bossbar-wrap-v7">
                      <div
                        id="sorealIdleBossBarV7"
                        data-boss-n="${idleEntier_(j.bossId)}"
                        data-couleur-n="${idleEntier_(j.bossId)}"
                        class="soreal-idle-bossbar-v7"
                        style="${REG.styleCouleurBarreBossIdleV1_?REG.styleCouleurBarreBossIdleV1_(idleEntier_(j.bossId)):''}width:${
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
              ${BORNE_PUPITRE_IDLE_V2}
              <button
                type="button"
                id="sorealIdleBossStartV100"
                class="soreal-idle-boss-control-v39 start"
                data-sans-traduction
                onclick="window.__definirCombatBossIdleV39__(true)"
                ${
                  j.combatBossActif||
                  j.bossBloqueRenaissance||
                  idleNombre_(j.pvJoueur)<=0||
                  !(String(j.bossActuel||'').trim()&&idleNombre_(j.bossPvMax)>0)||
                  fightEnAttenteServeurIdleV1_()
                    ?'disabled'
                    :''
                }
              >
                Fight
              </button>

              <button
                type="button"
                class="soreal-idle-boss-control-v39 stop"
                onclick="window.__fuirBossIdleV1__()"
                ${j.combatBossActif?'':'disabled'}
              >
                Fuite
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
                <span class="nk-txt">NUKE</span>
              </button>

            </div>
            ${BORNE_BAS_IDLE_V2}

            <!--
              V168 — NGU garde le battle log pour Adventure ; Fight Boss
              affiche à la place la Story liée au boss. bossHistoire est la
              même donnée que Collection/bossCatalogue.histoire, donc aucune
              deuxième source de vérité n'est créée ici.
            -->
            ${chroniqueMur?'':chronique}


            <div
              id="sorealIdleBossRespawnV100"
              class="soreal-idle-boss-respawn-v100 ready"
            ></div>

            ${
              j.bossBloqueRenaissance
                ?'<div class="soreal-idle-rebirth-wall-v37">♻️ Ce boss exige au moins 1 Renaissance. Les boss déjà vaincus restent morts pour ce run.</div>'
                :''
            }
          </div>
        `;
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
                  '<div id="'+idHistoire+'" class="soreal-idle-bestiary-desc-v110 soreal-idle-boss-fiche-histoire-v1" data-soreal-tts-chronique="'+idleHtml_(e.nom||'Boss')+'"'+attrLectureBossIdleV1_(e.nom,e.description,e.nomParle,e.histoireParlee)+'>'+idleHtml_(sansBaliseVoixIdleV1_(e.description))+'</div>'+
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

        /* Norman (2026-10-22) : « quand on lit toutes les chroniques, il doit y avoir le petit lecteur » (pause / stop déplaçable), comme « à partir de ce boss » : même lecteur, depuis le premier boss découvert ; un second appui l'arrête. */
        try{
          const lecteur=window.__SOREAL_IDLE_LECTEUR_CHRONIQUES_V1__;
          if(lecteur){
            if(lecteur.actif()){lecteur.stop();return;}
            if(lecteur.demarrer(0,texteVoixSansTexteIdleV1_(REG.CLE_VOIX_CHRONIQUES_INTRO_IDLE_V1,REG.TEXTE_CHRONIQUES_INTRO_IDLE_V1)))return;
          }
        }catch(_e){}

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
          :function(nom,histoire){return histoire;};
        tts.readText(
          texteVoixSansTexteIdleV1_(REG.CLE_VOIX_CHRONIQUES_INTRO_IDLE_V1,REG.TEXTE_CHRONIQUES_INTRO_IDLE_V1)+M(1500)+
          connus.map(function(b){
            /* Sans le nom du boss : les chroniques s'enchaînent comme une histoire (Norman, 2026-10-22). */
            return composerChronique(String(b.nomParle||'').trim()||String(b.nom||'Boss'),String(b.histoireParlee||'').trim()||String(b.histoire||''),true);
          }).join(M(1200))
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

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-323 */
      function urlJoueurR2IdleV1_(zone,portrait,repli){
        /* Player Portraits (2026-09-24) : portrait choisi (fichier du wiki), repli serveur sur le défaut. Portrait automatique d'un set équipé : repli = portrait choisi. */
        return '/api/idle/media/player?zone='+encodeURIComponent(String(zone||''))+
          (portrait?'&portrait='+encodeURIComponent(String(portrait)):'')+
          (repli?'&fallback='+encodeURIComponent(String(repli)):'');
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

        /* Difficultés Evil ("difficile") et Sadistic ("extreme") : le serveur sert les images 3D (evil) ou photo (sadistic) de leur dossier, avec repli sur l'image normale si absente. */
        const difficulte=
          String(
            REG.idleEtat&&
            REG.idleEtat.systemes&&
            REG.idleEtat.systemes.difficulty||
            ''
          );

        return n
          ? '/api/idle/media/boss?id='+encodeURIComponent(String(n))+(difficulte==='difficile'||difficulte==='extreme'?'&difficulty='+difficulte:'')
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
    lancerVoixArrierePlanSandwichIdleV1_:lancerVoixArrierePlanSandwichIdleV1_,
    sansBaliseVoixIdleV1_:sansBaliseVoixIdleV1_,
    attrHistoireVoixIdleV1_:attrHistoireVoixIdleV1_,
    attrLectureBossIdleV1_:attrLectureBossIdleV1_,
    fermerCarteBossIdleV91_:fermerCarteBossIdleV91_,
    combattreDepuisCarteBossIdleV91_:combattreDepuisCarteBossIdleV91_,
    definirCombatBossIdleV39_:definirCombatBossIdleV39_,
    nukerBossIdleV1_:nukerBossIdleV1_,
    exploserBossNukeIdleV1_:exploserBossNukeIdleV1_,
    bossNukableIdleV198_:bossNukableIdleV198_,
    autoNukeDueIdleV1_:autoNukeDueIdleV1_,
    pageCombatIdleV28_:pageCombatIdleV28_,
    fermerBossCollectionIdleV1_:fermerBossCollectionIdleV1_,
    ouvrirBossCollectionIdleV1_:ouvrirBossCollectionIdleV1_,
    lireHistoireCompleteBossIdleV206_:lireHistoireCompleteBossIdleV206_,
    arreterCombatTitanIdleV1_:arreterCombatTitanIdleV1_,
    progresserZoneFightLocalIdleV1_:progresserZoneFightLocalIdleV1_,
    htmlReglagesMusiqueTitanIdleV1_:htmlReglagesMusiqueTitanIdleV1_,
    markupImageCombatIdleV61_:markupImageCombatIdleV61_,
    prechargerCatalogueCombatIdleV61_:prechargerCatalogueCombatIdleV61_,
    urlJoueurR2IdleV1_:urlJoueurR2IdleV1_,
    urlBossR2IdleV1_:urlBossR2IdleV1_,
    idImageBossCanoniqueIdleV181_:idImageBossCanoniqueIdleV181_,
    chargerImageBossIdleV36_:chargerImageBossIdleV36_
  });
})();
