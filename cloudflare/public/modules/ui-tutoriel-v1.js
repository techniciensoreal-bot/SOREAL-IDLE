/*
 * SOREAL IDLE — Tutoriel (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_tutoriel_v1)return;
  REG.__chargé_ui_tutoriel_v1=true;

  function idleVuConnuV1_(){return REG.idleVuConnuV1_.apply(null,arguments);}
  function idleVuMarquerV1_(){return REG.idleVuMarquerV1_.apply(null,arguments);}
  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function menuIdleV28_(){return REG.menuIdleV28_.apply(null,arguments);}
  function definirCombatBossIdleV39_(){return REG.definirCombatBossIdleV39_.apply(null,arguments);}
  function generationJoueurIdleV75_(){return REG.generationJoueurIdleV75_.apply(null,arguments);}
  function lancerVoixArrierePlanSandwichIdleV1_(){return REG.lancerVoixArrierePlanSandwichIdleV1_.apply(null,arguments);}
  function afficherProchainePopupIdleV75_(){return REG.afficherProchainePopupIdleV75_.apply(null,arguments);}

      /* Identifiant serveur d'un tutoriel : sa clé locale sans le joueur (« soreal_idle_tutoriel_aventure_v1_<joueur> » -> « tuto:tutoriel_aventure »). */
      function idleVuIdTutorielV1_(cle){
        return 'tuto:'+String(cle).replace(/^soreal_idle_/,'').replace(/_v\d+_.*$/,'');
      }

      function idleTutorielPagesDejaVuLocalV1_(cle){
        try{
          return Boolean(JSON.parse(localStorage.getItem(cle)||'null'));
        }catch(e){
          return false;
        }
      }

      function idleTutorielPagesDejaVuV1_(cle){
        return idleTutorielPagesDejaVuLocalV1_(cle)||idleVuConnuV1_(REG.idleEtat,idleVuIdTutorielV1_(cle));
      }

      function idleTutorielPagesMarquerVuV1_(cle){
        try{
          localStorage.setItem(cle,JSON.stringify(true));
        }catch(e){}
        idleVuMarquerV1_(idleVuIdTutorielV1_(cle));
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-123 */
      const STYLE_ID_TUTO_FLOTTANT_V1='sorealIdleTutoFlottantV1';

      function installerStyleTutoFlottantV1_(){
        if(document.getElementById(STYLE_ID_TUTO_FLOTTANT_V1))return;
        const style=document.createElement('style');
        style.id=STYLE_ID_TUTO_FLOTTANT_V1;
        style.textContent=`
          .soreal-idle-tuto-flottant-v1{
            position:fixed;
            z-index:9000;
            width:min(300px,calc(100vw - 16px));
            border-radius:16px;
            background:#182236;
            border:1px solid rgba(166,188,229,.18);
            box-shadow:0 18px 40px rgba(5,10,25,.45);
            overflow:hidden;
            color:#e9f0f8;
            transition:width .22s ease,height .22s ease,border-radius .22s ease;
          }
          /*
           * Norman (2026-09-27) : « quand on clique en dehors du popup d'info, le popup devient tout petit mais
           * continue à jouer la voix. Si on reclique dessus, il reprend sa taille normale. » On ne touche jamais
           * display/visibility/opacity de la racine ici : tutorial-tts-v202.js s'en sert pour savoir si ce popup
           * est "visible" et ne doit donc jamais la voir disparaître pendant que la narration continue.
           */
          .soreal-idle-tuto-flottant-v1.reduit{
            width:52px;
            height:52px;
            border-radius:50%;
            cursor:pointer;
          }
          .soreal-idle-tuto-flottant-v1.reduit .soreal-idle-tuto-flottant-drag-v1,
          .soreal-idle-tuto-flottant-v1.reduit .soreal-idle-tuto-flottant-titre-v1,
          .soreal-idle-tuto-flottant-v1.reduit .soreal-idle-tuto-flottant-corps-v1,
          .soreal-idle-tuto-flottant-v1.reduit .soreal-idle-tuto-flottant-actions-v1{
            display:none;
          }
          .soreal-idle-tuto-flottant-v1.reduit::after{
            content:'🔊';
            position:absolute;
            inset:0;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:22px;
            animation:sorealIdleTutoReduitPulseV1 1.6s ease-in-out infinite;
          }
          @keyframes sorealIdleTutoReduitPulseV1{
            0%,100%{opacity:.7}
            50%{opacity:1}
          }
          .soreal-idle-tuto-flottant-drag-v1{
            display:flex;
            align-items:center;
            justify-content:space-between;
            padding:6px 10px;
            background:linear-gradient(135deg,#202d45,#2a3b59);
            color:#8fa3c9;
            cursor:grab;
            user-select:none;
            touch-action:none;
            font-size:14px;
            letter-spacing:1px;
          }
          .soreal-idle-tuto-flottant-drag-v1:active{cursor:grabbing}
          .soreal-idle-tuto-flottant-titre-v1{
            padding:10px 14px 2px;
            font-family:Georgia,'Iowan Old Style','Palatino Linotype',Palatino,serif;
            font-weight:800;
            font-size:16px;
            letter-spacing:.3px;
            color:#ffd76a;
          }
          .soreal-idle-tuto-flottant-corps-v1{
            padding:6px 14px 12px;
            font-family:Georgia,'Iowan Old Style','Palatino Linotype',Palatino,serif;
            font-size:15px;
            line-height:1.55;
            color:#cfd8ea;
            max-height:38vh;
            overflow-y:auto;
          }
          .soreal-idle-tuto-flottant-actions-v1{
            display:grid;
            grid-template-columns:repeat(3,minmax(0,1fr));
            gap:6px;
            padding:0 10px 10px;
          }
          .soreal-idle-tuto-flottant-actions-v1 button{
            border:0;
            border-radius:9px;
            padding:7px 4px;
            font-size:14px;
            font-weight:700;
            cursor:pointer;
            background:rgba(255,255,255,.08);
            color:#cfd8ea;
          }
          .soreal-idle-tuto-flottant-actions-v1 button.confirm{
            background:linear-gradient(135deg,#f4d47a,#e0a93a);
            color:#241a04;
          }
          .soreal-idle-tuto-flottant-actions-v1 button:disabled{
            opacity:.35;
            cursor:default;
          }
        `;
        document.head.appendChild(style);
      }

      let idleTutorielPagesPositionV1_=null;

      function positionnerTutoFlottantV1_(root){
        const largeur=root.offsetWidth||300;
        const hauteur=root.offsetHeight||160;
        const margeMax={
          left:Math.max(8,window.innerWidth-largeur-8),
          top:Math.max(8,window.innerHeight-hauteur-8)
        };
        if(!idleTutorielPagesPositionV1_){
          idleTutorielPagesPositionV1_={
            left:margeMax.left,
            top:8
          };
        }
        idleTutorielPagesPositionV1_.left=Math.min(margeMax.left,Math.max(8,idleTutorielPagesPositionV1_.left));
        idleTutorielPagesPositionV1_.top=Math.min(margeMax.top,Math.max(8,idleTutorielPagesPositionV1_.top));
        root.style.left=idleTutorielPagesPositionV1_.left+'px';
        root.style.top=idleTutorielPagesPositionV1_.top+'px';
      }

      function activerGlisserTutoFlottantV1_(root){
        const poignee=root.querySelector('.soreal-idle-tuto-flottant-drag-v1');
        if(!poignee)return;
        let actif=false,departX=0,departY=0,origineLeft=0,origineTop=0;
        const surDeplacement=function(event){
          if(!actif)return;
          const point=event.touches?event.touches[0]:event;
          const largeur=root.offsetWidth,hauteur=root.offsetHeight;
          const nouveauLeft=Math.min(Math.max(8,window.innerWidth-largeur-8),Math.max(8,origineLeft+(point.clientX-departX)));
          const nouveauTop=Math.min(Math.max(8,window.innerHeight-hauteur-8),Math.max(8,origineTop+(point.clientY-departY)));
          idleTutorielPagesPositionV1_={left:nouveauLeft,top:nouveauTop};
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

      /*
       * Norman (2026-09-27) : « quand on clique en dehors du popup d'info le popup devienne tout petit mais
       * continue à jouer la voix. Si on reclique dessus, il reprend sa taille normale. » Un seul écouteur
       * global (jamais reposé à chaque rendu) : un clic dans #sorealIdleTutorielFlottantV1 alors qu'il est
       * réduit le restaure ; un clic ailleurs le réduit. Jamais de display/visibility/opacity touchés (voir
       * commentaire de la classe .reduit ci-dessus) : la narration en cours n'est jamais interrompue.
       */
      let idleTutoFlottantReductionInstalleeV1=false;

      function installerReductionTutoFlottantV1_(){
        if(idleTutoFlottantReductionInstalleeV1)return;
        idleTutoFlottantReductionInstalleeV1=true;
        document.addEventListener('click',function(ev){
          const root=document.getElementById('sorealIdleTutorielFlottantV1');
          if(!root)return;
          const dedans=ev.target&&ev.target.closest&&ev.target.closest('#sorealIdleTutorielFlottantV1');
          if(dedans){
            if(root.classList.contains('reduit'))root.classList.remove('reduit');
            return;
          }
          root.classList.add('reduit');
        },true);
      }

      function retirerChromeTutorielV1_(){
        const ancienModal=document.getElementById('sorealIdleTutorielPagesModalV1');
        if(ancienModal)ancienModal.remove();
        const ancienFlottant=document.getElementById('sorealIdleTutorielFlottantV1');
        if(ancienFlottant)ancienFlottant.remove();
      }

      /*
       * Voix pré-générées (2026-09-24) : le texte LU par un panneau est construit ICI à partir des données (jamais relevé dans le DOM),
       * posé sur le panneau (data-soreal-tts-say) et réutilisé tel quel par cloudflare/tools/voice-generate.mjs via
       * window.__sorealVoiceTextesIdleV1__ : mêmes blocs de texte = mêmes fichiers audio. Les icônes, « Page n / N » et l'en-tête
       * « SOREAL IDLE » ne sont plus lus.
       */
      function pauseVoixIdleV1_(ms){
        return ' \uE000'+ms+'\uE001 ';
      }

      /*
       * Titre répété (Norman, 2026-09-26 : « quand un menu a plusieurs fois le même nom dans les popups informatifs, il ne doit pas le répéter à chaque fois qu'on fait Suivant : "Le NOMBRE"
       * ne se prononce qu'au début du popup ») : si la page précédente du même popup porte le même titre, il n'est pas relu.
       */
      function texteVoixTutorielIdleV1_(page,precedente){
        /* Le titre « Norman & Sébastien » n'a pas de sens à l'oral (Norman, 2026-09-26) : seul le texte est lu. */
        /* Texte modifié par l'administrateur : _brut garde les balises de voix « (marius) » que l'affichage ne montre jamais. */
        const src=(page&&page._brut)||page;
        const srcPrec=(precedente&&precedente._brut)||precedente;
        const titrePage=String(src&&src.titre||'');
        const titreRepete=Boolean(srcPrec&&String(srcPrec.titre||'')===titrePage);
        const titreLu=(titrePage==='Norman & Sébastien'||titreRepete)?'':titrePage;
        return (titreLu?titreLu+pauseVoixIdleV1_(450):'')+
          (src&&src.sousTitre?String(src.sousTitre)+pauseVoixIdleV1_(450):'')+
          (Array.isArray(src&&src.paragraphes)?src.paragraphes:[]).join(' ');
      }

      const TUTORIEL_LIBELLES_TEXTES_V1={debut:'Début du jeu',aventure:'Aventure & Rebirth',boss:'Premier boss'};

      const TUTORIEL_ORIGINAUX_TEXTES_V1={};

      const TUTORIEL_CHAMPS_TEXTES_V1=[
        {id:'titre',label:'Titre',type:'ligne'},
        {id:'sousTitre',label:'Sous-titre',type:'ligne'},
        {id:'paragraphes',label:'Paragraphes',type:'liste'}
      ];

      function appliquerTextesTutorielsIdleV1_(){
        const T=window.__SOREAL_IDLE_TEXTES_V1__;
        if(!T)return;
        Object.keys(REG.TUTORIEL_TABLEAUX_TEXTES_V1).forEach(function(id){
          const tableau=REG.TUTORIEL_TABLEAUX_TEXTES_V1[id];
          if(!TUTORIEL_ORIGINAUX_TEXTES_V1[id])TUTORIEL_ORIGINAUX_TEXTES_V1[id]=tableau.slice();
          const originaux=TUTORIEL_ORIGINAUX_TEXTES_V1[id];
          originaux.forEach(function(page,index){
            const cle='tuto:'+id+':'+index;
            T.declarer(cle,{
              groupe:'Norman & Sébastien · '+TUTORIEL_LIBELLES_TEXTES_V1[id],
              libelle:'Page '+(index+1)+' — '+String(page.titre||'Introduction'),
              champs:TUTORIEL_CHAMPS_TEXTES_V1,
              original:function(){
                return {titre:String(page.titre||''),sousTitre:String(page.sousTitre||''),paragraphes:Array.isArray(page.paragraphes)?page.paragraphes.slice():[]};
              },
              texteLu:function(v){return texteVoixTutorielIdleV1_(v,index>0?tableau[index-1]:null);}
            });
            tableau[index]=T.appliquerPage(cle,page);
          });
        });
      }

      /* Précharge la voix des pages suivantes d'un popup pendant la lecture de la page affichée : « Suivant » joue alors sans délai. */
      function prechaufferVoixTutorielIdleV1_(etat){
        const tts=window.__SOREAL_IDLE_TUTORIAL_TTS_V203__;
        if(!tts||typeof tts.prechauffer!=='function'||!etat)return;
        [1,2].forEach(function(decalage){
          const suivante=etat.pages[etat.index+decalage];
          if(suivante)tts.prechauffer(texteVoixTutorielIdleV1_(suivante,etat.pages[etat.index+decalage-1]));
        });
      }

      function rendreTutorielPagesIdleV1_(){
        const etat=REG.idleTutorielPagesEnCoursV1;
        if(!etat)return;

        prechaufferVoixTutorielIdleV1_(etat);

        const page=etat.pages[etat.index];
        const dernier=etat.index>=etat.pages.length-1;
        const premier=etat.index<=0;

        if(page.long){
          REG.idlePopupBloqueCombatV102=true;
          retirerChromeTutorielV1_();

          const modal=document.createElement('div');
          modal.id='sorealIdleTutorielPagesModalV1';
          modal.className='soreal-idle-modal-backdrop-v63';
          document.body.appendChild(modal);

          modal.innerHTML=
            '<div class="soreal-idle-modal-card-v63" role="dialog" aria-modal="true" data-soreal-tts-say="'+idleHtml_(texteVoixTutorielIdleV1_(page,etat.pages[etat.index-1]))+'">'+
              '<div class="soreal-idle-modal-top-v63">'+
                '<div class="soreal-idle-modal-title-v63">'+
                  idleHtml_(page.titre||'')+
                  (page.sousTitre?' <span style="opacity:.7;font-weight:600">'+idleHtml_(page.sousTitre)+'</span>':'')+
                '</div>'+
              '</div>'+
              '<div class="soreal-idle-modal-body-v63">'+
                '<div class="soreal-idle-modal-info-v63">'+
                  (page.paragraphes||[]).map(function(p){
                    return '<div style="margin-bottom:10px">'+idleHtml_(p)+'</div>';
                  }).join('')+
                '</div>'+
                (page._cle&&window.__SOREAL_IDLE_TEXTES_V1__?'<div style="margin-top:10px">'+window.__SOREAL_IDLE_TEXTES_V1__.boutonHtml(page._cle)+'</div>':'')+
              '</div>'+
              '<div class="soreal-idle-modal-actions-v63" style="grid-template-columns:1fr">'+
                '<button type="button" class="soreal-idle-modal-button-v63 '+(page.bouton?'jouer':'confirm')+'" onclick="window.__tutorielPagesNaviguerV1__(1)">'+idleHtml_(page.bouton||'Continuer ▶')+'</button>'+
              '</div>'+
            '</div>';
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-124 */
        REG.idlePopupBloqueCombatV102=false;
        installerStyleTutoFlottantV1_();

        let root=document.getElementById('sorealIdleTutorielFlottantV1');
        const nouveau=!root;
        if(nouveau){
          retirerChromeTutorielV1_();
          root=document.createElement('div');
          root.id='sorealIdleTutorielFlottantV1';
          root.className='soreal-idle-tuto-flottant-v1';
          document.body.appendChild(root);
        }
        root.classList.remove('reduit');/* changer de page rouvre le popup en taille normale */
        installerReductionTutoFlottantV1_();

        root.innerHTML=
          '<div class="soreal-idle-tuto-flottant-drag-v1"><span>⠿</span><span>SOREAL IDLE</span></div>'+
          '<div class="soreal-idle-tuto-flottant-titre-v1">'+idleHtml_(page.titre||'')+'</div>'+
          '<div class="soreal-idle-tuto-flottant-corps-v1">'+
            (page.paragraphes||[]).map(function(p){
              return '<div style="margin-bottom:8px">'+idleHtml_(p)+'</div>';
            }).join('')+
          '</div>'+
          (page._cle&&window.__SOREAL_IDLE_TEXTES_V1__?'<div style="margin:0 0 8px">'+window.__SOREAL_IDLE_TEXTES_V1__.boutonHtml(page._cle)+'</div>':'')+
          '<div class="soreal-idle-tuto-flottant-actions-v1">'+
            '<button type="button" '+(premier?'disabled':'')+' onclick="window.__tutorielPagesNaviguerV1__(-1)">◀ Précédent</button>'+
            /* Page « il faut cliquer » (page.attendre) : ni « Passer » ni « Suivant » ; c'est le clic sur le bouton qui clignote qui fait avancer (modules/tutorial-hint-v1.js). */
            '<button type="button" '+((page.attendre||(dernier&&page.seulementPrecedent))?'disabled style="visibility:hidden" ':'')+'onclick="window.__tutorielPagesFermerV1__()">'+(dernier?'Terminé ✔':'Passer')+'</button>'+
            (
              (dernier&&page.seulementPrecedent)
                ?'<button type="button" class="confirm" onclick="window.__tutorielPagesFermerV1__()">Terminé ✔</button>'
                :'<button type="button" class="confirm" '+((dernier||page.attendre)?'disabled style="visibility:hidden"':'')+' onclick="window.__tutorielPagesNaviguerV1__(1)">Suivant ▶</button>'
            )+
          '</div>';

        root.setAttribute('data-soreal-tts-say',texteVoixTutorielIdleV1_(page,etat.pages[etat.index-1]));

        if(nouveau){
          positionnerTutoFlottantV1_(root);
        }

        /* Cadrage de la page (menu, défilement, place de la fenêtre) : modules/tutorial-framing-v1.js. */
        if(window.__SOREAL_IDLE_TUTO_CADRAGE_V1__){
          window.__SOREAL_IDLE_TUTO_CADRAGE_V1__.appliquer(page.cadrage||'',root,{
            menuActif:function(){return REG.idleMenuActifV28;},
            allerMenu:function(menu){menuIdleV28_(menu);}
          });
        }

        /* Bouton qui clignote (et clic obligatoire sur la page « Basic Training ») : modules/tutorial-hint-v1.js. */
        if(window.__SOREAL_IDLE_TUTO_INDICE_V1__){
          window.__SOREAL_IDLE_TUTO_INDICE_V1__.appliquer(page.clignote||'',page.attendre||'');
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-125 */
        activerGlisserTutoFlottantV1_(root);
      }

      /*
       * Ancien tutoriel (fenêtres de Norman & Sébastien, popups de première ouverture de menu) : joué tant que l'administrateur ne l'a pas désactivé dans le menu Admin → Tutoriel (modules/tutoriel-v1.js).
       * Tant que le réglage n'est pas connu (premier instant du jeu), rien n'est joué : on ne montre jamais un ancien popup qui serait aussitôt remplacé.
       */
      function ancienTutorielPermisIdleV1_(){
        const T=window.__SOREAL_IDLE_TUTORIEL_V1__;
        return !T||T.ancienPermis();
      }

      function demarrerTutorielPagesIdleV1_(pages,cle){
        if(!ancienTutorielPermisIdleV1_())return;
        if(!Array.isArray(pages)||!pages.length)return;
        if(idleTutorielPagesDejaVuV1_(cle))return;

        /*
         * Déjà en cours (Norman, 2026-09-26 : « j'ai cliqué sur Shop sans fermer le popup Récompenses : il est reparti de Norman & Sébastien ») :
         * cette fonction est rappelée à chaque rendu ; on reprend la page où l'on était (et on réaffiche la fenêtre si un autre popup l'a retirée).
         */
        if(REG.idleTutorielPagesEnCoursV1&&REG.idleTutorielPagesEnCoursV1.cle===cle){
          if(!document.getElementById('sorealIdleTutorielFlottantV1')&&!document.getElementById('sorealIdleTutorielPagesModalV1'))rendreTutorielPagesIdleV1_();
          return;
        }

        REG.idleTutorielPagesEnCoursV1={pages:pages,index:0,cle:cle};

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-126 */
        if(pages[0]&&pages[0].long&&REG.idleEtat&&REG.idleEtat.combatBossActif){
          REG.idleEtat.combatBossActif=false;
          REG.idleVictoireBossLocaleV49=false;
          definirCombatBossIdleV39_(false);
        }

        rendreTutorielPagesIdleV1_();
      }

      function tutorielPagesFermerV1_(){
        const etat=REG.idleTutorielPagesEnCoursV1;
        if(etat)idleTutorielPagesMarquerVuV1_(etat.cle);
        /*
         * Norman (2026-09-27) : « Si on ne termine pas l'introduction complète, elle sera rejouée au prochain
         * lancement du jeu depuis le début ». « Bienvenue » (le flag qui empêche gererPopupsProgressionIdleV75_
         * de relancer l'intro) n'est donc marqué ICI, qu'une fois le tutoriel de début réellement fermé -- jamais
         * dès son ouverture -- pour que quitter en plein milieu la rejoue depuis le début.
         */
        if(etat&&etat.pages===REG.TUTORIEL_DEBUT_JEU_PAGES_V1&&REG.idleEtat){
          const cleBienvenue='soreal_idle_bienvenue_v75_'+generationJoueurIdleV75_(REG.idleEtat);
          try{localStorage.setItem(cleBienvenue,JSON.stringify(true));}catch(e){}
          idleVuMarquerV1_('bienvenue');
        }
        /* Le sandwich est la dernière page du tutoriel de début : la voix de fond ne part que si le joueur l'a atteinte. */
        if(etat&&etat.pages===REG.TUTORIEL_DEBUT_JEU_PAGES_V1&&etat.index>=etat.pages.length-1)lancerVoixArrierePlanSandwichIdleV1_();

        retirerChromeTutorielV1_();
        REG.idleTutorielPagesEnCoursV1=null;

        if(!REG.idlePopupQueueV75.length){
          REG.idlePopupBloqueCombatV102=false;
        }

        setTimeout(afficherProchainePopupIdleV75_,120);
      }

  Object.assign(REG,{
    idleVuIdTutorielV1_:idleVuIdTutorielV1_,
    idleTutorielPagesDejaVuLocalV1_:idleTutorielPagesDejaVuLocalV1_,
    pauseVoixIdleV1_:pauseVoixIdleV1_,
    texteVoixTutorielIdleV1_:texteVoixTutorielIdleV1_,
    appliquerTextesTutorielsIdleV1_:appliquerTextesTutorielsIdleV1_,
    rendreTutorielPagesIdleV1_:rendreTutorielPagesIdleV1_,
    ancienTutorielPermisIdleV1_:ancienTutorielPermisIdleV1_,
    demarrerTutorielPagesIdleV1_:demarrerTutorielPagesIdleV1_,
    tutorielPagesFermerV1_:tutorielPagesFermerV1_
  });
})();
