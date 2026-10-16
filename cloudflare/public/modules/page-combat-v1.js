/*
 * SOREAL IDLE — page Fight Boss (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Extrait tel quel (même code) ; les aides du monolithe sont lues à l'exécution par window.__SOREAL_IDLE_UI_PARTAGE_V1__
 * (jamais au chargement : ce module se charge AVANT le monolithe). Expose window.__SOREAL_IDLE_PAGE_COMBAT_V1__.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_PAGE_COMBAT_V1__)return;

      function idleHtml_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.idleHtml_.apply(null,arguments);}
      function markupImageCombatIdleV61_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.markupImageCombatIdleV61_.apply(null,arguments);}
      function idleEntier_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.idleEntier_.apply(null,arguments);}
      function urlBossR2IdleV1_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.urlBossR2IdleV1_.apply(null,arguments);}
      function idImageBossCanoniqueIdleV181_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.idImageBossCanoniqueIdleV181_.apply(null,arguments);}
      function idleNombre_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.idleNombre_.apply(null,arguments);}
      function formaterPvFixeIdleV1_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.formaterPvFixeIdleV1_.apply(null,arguments);}
      function fightEnAttenteServeurIdleV1_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.fightEnAttenteServeurIdleV1_.apply(null,arguments);}
      function jouerEffetAudioIdleV199_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.jouerEffetAudioIdleV199_.apply(null,arguments);}
      function attrHistoireVoixIdleV1_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.attrHistoireVoixIdleV1_.apply(null,arguments);}
      function sansBaliseVoixIdleV1_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.sansBaliseVoixIdleV1_.apply(null,arguments);}
      function labelCapaciteBossIdleV70_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.labelCapaciteBossIdleV70_.apply(null,arguments);}

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

      /*
       * Chronique du boss accrochée au mur (Norman, 2026-10-10) : un petit cadre au fond de la salle ; un clic (ou un tap) l'agrandit, un clic dehors, sur la croix ou sur Échap la referme. L'état ouvert survit
       * au redessin de la page (window.__chroniqueOuverteIdleV1). Le panneau reste dans la page en continu : la lecture à voix haute automatique (tutorial-tts) le retrouve toujours.
       */
      /* Bouton de lecture de la chronique (Norman, 2026-10-10) : « Stop » pendant la lecture, « Play » quand rien n'est lu ; l'état est tenu à jour par modules/tutorial-tts-v202.js (updateReadButtons_). */
      function boutonLectureChroniqueIdleV1_(){
        const tts=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
        const enCours=Boolean(tts&&typeof tts.lectureCible==='function'&&tts.lectureCible('sorealIdleBossChroniqueV206'));
        return '<button type="button" class="soreal-idle-chro-lecture-v1" data-soreal-tts-ignore data-soreal-tts-target="sorealIdleBossChroniqueV206" data-etat="'+(enCours?'stop':'play')+'" aria-label="'+(enCours?'Arrêter la lecture':'Écouter la chronique')+'">'+
          '<svg class="chro-ico-play-v1" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5 L13.5 8 L4 13.5 Z" fill="currentColor"/></svg>'+
          '<svg class="chro-ico-stop-v1" viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="3.5" width="9" height="9" rx="1.5" fill="currentColor"/></svg>'+
          '<span class="chro-lecture-txt-v1">'+(enCours?'Stop':'Écouter')+'</span></button>';
      }

      /* Main qui montre la chronique : une seule fois sur l'appareil, jamais plus dès le premier clic (même après une Renaissance). */
      function mainChroniqueIdleV1_(){
        try{if(localStorage.getItem('soreal_idle_chronique_main_v1'))return '';}catch(_e){}
        return '<svg class="chro-main-v1" data-sans-traduction aria-hidden="true" viewBox="0 0 40 48"><path d="M14 4c3 0 4 2 4 4v14l2-1c2-1 4 0 4 2l1-1c2-1 4 0 4 2l1-1c2-1 4 0 4 3v10c0 7-5 12-12 12h-4c-5 0-8-3-11-8l-6-9c-1-3 2-5 4-3l3 3V8c0-2 1-4 3-4z" fill="#fff" stroke="#3a2208" stroke-width="2.4" stroke-linejoin="round"/></svg>';
      }
      (function(){
        function panneau(){return document.getElementById('sorealIdleBossChroniqueV206');}
        function poser(ouvert){
          window.__chroniqueOuverteIdleV1=Boolean(ouvert);
          const p=panneau();
          if(p)p.classList.toggle('ouverte',Boolean(ouvert));
        }
        window.__ouvrirChroniqueIdleV1__=poser;
        document.addEventListener('click',function(e){
          const cible=e.target;
          const p=cible&&cible.closest?cible.closest('.soreal-idle-boss-lore-v142'):null;
          if(p){
            if(!p.classList.contains('ouverte')){
              if(cible.closest('button,a,[data-soreal-tts-target],[data-texte-admin]'))return;
              try{localStorage.setItem('soreal_idle_chronique_main_v1','1');}catch(_e){}
              const m=p.querySelector('.chro-main-v1');if(m)m.remove();
              poser(true);
            }else if(cible.closest('.soreal-idle-lore-fermer-v1'))poser(false);
            return;
          }
          if(window.__chroniqueOuverteIdleV1)poser(false);
        });
        document.addEventListener('keydown',function(e){
          if(e.key==='Escape'&&window.__chroniqueOuverteIdleV1)poser(false);
          else if((e.key==='Enter'||e.key===' ')&&e.target&&e.target.classList&&e.target.classList.contains('soreal-idle-boss-lore-v142')&&!window.__chroniqueOuverteIdleV1){e.preventDefault();poser(true);}
        });
      })();

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

      const BORNE_PUPITRE_IDLE_V2="<svg class=\"bn-deck-svg\" viewBox=\"0 0 552 190\" aria-hidden=\"true\"><defs><linearGradient id=\"bnPl\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#454d9a\"/><stop offset=\".72\" stop-color=\"#262c66\"/><stop offset=\"1\" stop-color=\"#1a1e4c\"/></linearGradient><linearGradient id=\"bnNeonP\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#2f7bff\"/><stop offset=\".5\" stop-color=\"#ff4fb0\"/><stop offset=\"1\" stop-color=\"#ff2a3d\"/></linearGradient><linearGradient id=\"bnLevre\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#1b2060\"/><stop offset=\"1\" stop-color=\"#090c28\"/></linearGradient></defs><path d=\"M16 0 H536 L552 140 H0 Z\" fill=\"url(#bnPl)\" stroke=\"#05071a\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M16 3 H536\" stroke=\"url(#bnNeonP)\" stroke-width=\"4\"/><path d=\"M30 14 L10 130 M46 14 L28 130 M522 14 L542 130 M506 14 L524 130\" stroke=\"#ff4fb0\" stroke-width=\"5\" opacity=\".28\" stroke-linecap=\"round\"/><path d=\"M0 140 H552 V176 Q552 186 542 186 H10 Q0 186 0 176 Z\" fill=\"url(#bnLevre)\" stroke=\"#05071a\" stroke-width=\"4\"/><path d=\"M6 143 H546\" stroke=\"url(#bnNeonP)\" stroke-width=\"3\"/></svg>";

      const BORNE_BAS_IDLE_V2="<svg class=\"bn-bas-svg\" viewBox=\"0 0 520 250\" aria-hidden=\"true\"><defs><linearGradient id=\"bnMe\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#b9c0d0\"/><stop offset=\".5\" stop-color=\"#7d8699\"/><stop offset=\"1\" stop-color=\"#4b5263\"/></linearGradient><linearGradient id=\"bnNeonB\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#2f7bff\"/><stop offset=\".5\" stop-color=\"#ff4fb0\"/><stop offset=\"1\" stop-color=\"#ff2a3d\"/></linearGradient><linearGradient id=\"bnBd\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#161b4a\"/><stop offset=\"1\" stop-color=\"#0a0d2a\"/></linearGradient></defs><rect x=\"0\" y=\"0\" width=\"520\" height=\"210\" fill=\"url(#bnBd)\"/><rect x=\"0\" y=\"0\" width=\"10\" height=\"210\" fill=\"#2f7bff\"/><rect x=\"510\" y=\"0\" width=\"10\" height=\"210\" fill=\"#ff2a3d\"/><!-- décor de flanc : bandeau d'étoiles --><g fill=\"#ffd24a\"><polygon class=\"etoile\" style=\"--d:-.4s\" points=\"40,20 43,28 52,29 45,34 47,43 40,38 33,43 35,34 28,29 37,28\"/><polygon class=\"etoile\" style=\"--d:-1.5s\" points=\"480,20 483,28 492,29 485,34 487,43 480,38 473,43 475,34 468,29 477,28\"/></g><!-- trappe --><rect x=\"76\" y=\"14\" width=\"368\" height=\"170\" rx=\"14\" fill=\"url(#bnMe)\" stroke=\"#05071a\" stroke-width=\"4\"/><rect x=\"86\" y=\"24\" width=\"348\" height=\"150\" rx=\"9\" fill=\"none\" stroke=\"#e8edf7\" stroke-width=\"2\" opacity=\".7\"/><g fill=\"#5b6475\" stroke=\"#05071a\" stroke-width=\"1.4\"><circle cx=\"94\" cy=\"32\" r=\"4\"/><circle cx=\"426\" cy=\"32\" r=\"4\"/><circle cx=\"94\" cy=\"166\" r=\"4\"/><circle cx=\"426\" cy=\"166\" r=\"4\"/></g><text x=\"260\" y=\"48\" font-family=\"Bangers,Impact,sans-serif\" font-size=\"22\" letter-spacing=\"4\" text-anchor=\"middle\" fill=\"#7a1410\">INSERT COIN</text><!-- deux monnayeurs --><g><rect x=\"110\" y=\"62\" width=\"120\" height=\"86\" rx=\"10\" fill=\"#10143a\" stroke=\"#05071a\" stroke-width=\"3\"/><rect x=\"122\" y=\"74\" width=\"96\" height=\"62\" rx=\"6\" fill=\"#1d2250\" stroke=\"#ffd24a\" stroke-width=\"2\"/><rect x=\"166\" y=\"82\" width=\"8\" height=\"34\" rx=\"3\" fill=\"#000\"/><rect x=\"164\" y=\"80\" width=\"12\" height=\"38\" rx=\"4\" fill=\"none\" stroke=\"#ffd24a\" stroke-width=\"2\"/><circle cx=\"170\" cy=\"128\" r=\"6\" fill=\"#ff3d3d\"/><circle cx=\"170\" cy=\"128\" r=\"9\" fill=\"none\" stroke=\"#ff3d3d\" stroke-width=\"1.4\" opacity=\".6\"/></g><g><rect x=\"290\" y=\"62\" width=\"120\" height=\"86\" rx=\"10\" fill=\"#10143a\" stroke=\"#05071a\" stroke-width=\"3\"/><rect x=\"302\" y=\"74\" width=\"96\" height=\"62\" rx=\"6\" fill=\"#1d2250\" stroke=\"#ffd24a\" stroke-width=\"2\"/><rect x=\"346\" y=\"82\" width=\"8\" height=\"34\" rx=\"3\" fill=\"#000\"/><rect x=\"344\" y=\"80\" width=\"12\" height=\"38\" rx=\"4\" fill=\"none\" stroke=\"#ffd24a\" stroke-width=\"2\"/><circle cx=\"350\" cy=\"128\" r=\"6\" fill=\"#ff3d3d\"/><circle cx=\"350\" cy=\"128\" r=\"9\" fill=\"none\" stroke=\"#ff3d3d\" stroke-width=\"1.4\" opacity=\".6\"/></g><!-- retour de monnaie, serrure --><rect x=\"240\" y=\"96\" width=\"40\" height=\"30\" rx=\"7\" fill=\"#2a2f66\" stroke=\"#05071a\" stroke-width=\"3\"/><rect x=\"249\" y=\"104\" width=\"22\" height=\"9\" rx=\"3\" fill=\"#ff3d3d\" stroke=\"#05071a\" stroke-width=\"2\"/><circle cx=\"260\" cy=\"150\" r=\"9\" fill=\"#d79a1f\" stroke=\"#05071a\" stroke-width=\"2.4\"/><rect x=\"258\" y=\"147\" width=\"4\" height=\"9\" rx=\"1\" fill=\"#05071a\"/><!-- soubassement et pieds --><rect x=\"0\" y=\"210\" width=\"520\" height=\"24\" fill=\"#05071a\"/><path d=\"M0 210 H520\" stroke=\"url(#bnNeonB)\" stroke-width=\"4\"/><rect x=\"24\" y=\"230\" width=\"60\" height=\"14\" rx=\"4\" fill=\"#1a1a22\" stroke=\"#05071a\" stroke-width=\"2\"/><rect x=\"436\" y=\"230\" width=\"60\" height=\"14\" rx=\"4\" fill=\"#1a1a22\" stroke=\"#05071a\" stroke-width=\"2\"/><ellipse cx=\"260\" cy=\"246\" rx=\"240\" ry=\"6\" fill=\"rgba(0,0,0,.5)\"/></svg>";

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
                NUKE
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

  window.__SOREAL_IDLE_PAGE_COMBAT_V1__={
    pageCombatIdleV28_:pageCombatIdleV28_
  };
})();
