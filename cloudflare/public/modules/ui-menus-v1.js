/*
 * SOREAL IDLE — Menus, bandeau et barres du haut (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_menus_v1)return;
  REG.__chargé_ui_menus_v1=true;

  function idleNombre_(){return REG.idleNombre_.apply(null,arguments);}
  function formatGrandNombreIdleV70_(){return REG.formatGrandNombreIdleV70_.apply(null,arguments);}
  function ancreSacIdleV1_(){return REG.ancreSacIdleV1_.apply(null,arguments);}
  function restaurerAncreSacIdleV1_(){return REG.restaurerAncreSacIdleV1_.apply(null,arguments);}
  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function menuSuccesVisibleIdleV1_(){return REG.menuSuccesVisibleIdleV1_.apply(null,arguments);}
  function infoSurchargeeIdleV1_(){return REG.infoSurchargeeIdleV1_.apply(null,arguments);}
  function definitionsNouveautesIdleV75_(){return REG.definitionsNouveautesIdleV75_.apply(null,arguments);}
  function idleVusServeurV1_(){return REG.idleVusServeurV1_.apply(null,arguments);}
  function idleVuMarquerV1_(){return REG.idleVuMarquerV1_.apply(null,arguments);}
  function rendreTutorielPagesIdleV1_(){return REG.rendreTutorielPagesIdleV1_.apply(null,arguments);}
  function tutorielPagesFermerV1_(){return REG.tutorielPagesFermerV1_.apply(null,arguments);}
  function menuDisponibleIdleV28_(){return REG.menuDisponibleIdleV28_.apply(null,arguments);}
  function idleVuConnuV1_(){return REG.idleVuConnuV1_.apply(null,arguments);}
  function jouerEffetAudioIdleV199_(){return REG.jouerEffetAudioIdleV199_.apply(null,arguments);}
  function aventureMetaIdleV47_(){return REG.aventureMetaIdleV47_.apply(null,arguments);}
  function heureServeurIdleV1_(){return REG.heureServeurIdleV1_.apply(null,arguments);}
  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function menuIdleV28_(){return REG.menuIdleV28_.apply(null,arguments);}
  function entetePageIdleV28_(){return REG.entetePageIdleV28_.apply(null,arguments);}
  function rendreProfilIdleV26_(){return REG.rendreProfilIdleV26_.apply(null,arguments);}
  function rendreSetsIdleV25_(){return REG.rendreSetsIdleV25_.apply(null,arguments);}
  function pageEntrainementIdleV28_(){return REG.pageEntrainementIdleV28_.apply(null,arguments);}
  function pageParametresIdleV28_(){return REG.pageParametresIdleV28_.apply(null,arguments);}
  function pageAventureIdleV28_(){return REG.pageAventureIdleV28_.apply(null,arguments);}
  function pageChroniquesIdleV1_(){return REG.pageChroniquesIdleV1_.apply(null,arguments);}
  function pageBestiaireIdleV110_(){return REG.pageBestiaireIdleV110_.apply(null,arguments);}
  function pageBoutiqueIdleV28_(){return REG.pageBoutiqueIdleV28_.apply(null,arguments);}
  function pageSelloutShopIdleV1_(){return REG.pageSelloutShopIdleV1_.apply(null,arguments);}
  function pageShopIdleV1_(){return REG.pageShopIdleV1_.apply(null,arguments);}
  function pageClassementIdleV1_(){return REG.pageClassementIdleV1_.apply(null,arguments);}
  function pageMagieIdleV90_(){return REG.pageMagieIdleV90_.apply(null,arguments);}
  function pageRenaissanceIdleV28_(){return REG.pageRenaissanceIdleV28_.apply(null,arguments);}
  function pageSystemeMetaIdleV130_(){return REG.pageSystemeMetaIdleV130_.apply(null,arguments);}
  function pageCollectionIdleV22_(){return REG.pageCollectionIdleV22_.apply(null,arguments);}
  function pageSpendExpIdleV1_(){return REG.pageSpendExpIdleV1_.apply(null,arguments);}
  function pageCombatIdleV28_(){return REG.pageCombatIdleV28_.apply(null,arguments);}

      /* Bandeau : à gauche de la barre le niveau gagné par seconde, à droite le temps avant que tout soit généré (format court). */
      function dureeCourteBandeauIdleV2_(sec){
        let s=Math.max(0,Math.ceil(Number(sec)||0));
        const j=Math.floor(s/86400);s-=j*86400;
        const h=Math.floor(s/3600);s-=h*3600;
        const m=Math.floor(s/60);s-=m*60;
        if(j>0)return j+'j '+h+'h';
        if(h>0)return h+'h '+m+'m';
        if(m>0)return m+'m '+s+'s';
        return s+'s';
      }

      function infoBandeauIdleV2_(parSeconde,reste){
        const ps=Math.max(0,idleNombre_(parSeconde));
        return {vitesse:'+'+formatGrandNombreIdleV70_(ps,2)+'/s',temps:reste<1?'✔':(ps>0?dureeCourteBandeauIdleV2_(reste/ps):'')};
      }

      function majHudPvIdleV2_(pv,max,regen){
        const bar=document.getElementById('sorealIdleHudPvBarV2');
        if(!bar)return;
        const pct=idleNombre_(max)>0?Math.max(0,Math.min(100,idleNombre_(pv)/idleNombre_(max)*100)):0;
        /* Audit 60 fps (Norman, 2026-10-26) : la largeur de cette barre de 1 200 px s'animait en continu (mise en page + dessin à chaque image, jusqu'à -6 images/s sur toutes les pages). La barre garde sa pleine largeur et GLISSE vers la gauche (transform, carte graphique) : le cadre du bandeau (overflow:hidden) ne montre que la part remplie, bord droit plat comme avant. Le pourcentage reste lisible dans data-idle-pct-hud-v1 (diagnostic). */
        bar.style.width='100%';
        bar.style.transform='translate3d('+(-(100-pct)).toFixed(2)+'%,0,0)';
        bar.dataset.idlePctHudV1=pct.toFixed(2);
        const t=document.getElementById('sorealIdleHudPvTexteV2');
        const texte=window.__SOREAL_IDLE_TEXTE_PV_V2__(pv,max);
        if(t&&t.textContent!==texte)t.textContent=texte;
        const d=document.getElementById('sorealIdleHudDPvV2');
        const tr=window.__SOREAL_IDLE_TEXTE_REGEN_PV_V2__(regen);
        if(d&&d.textContent!==tr)d.textContent=tr;
        const panneau=document.getElementById('sorealIdleHudPvV2');
        if(panneau)panneau.classList.toggle('bas',pct<=25);
      }

      /* Éléments « jumeaux » d'un bouton : même balise, même action (onclick) et mêmes classes ; le rang parmi eux sert à le retrouver après le rendu, même si le nombre d'éléments avant lui a changé. */
      function jumeauxClicIdleV1_(racine,tag,onclick,classes){
        return Array.prototype.filter.call(racine.getElementsByTagName(tag),function(n){
          /* Les classes (ON/OFF, actif...) changent avec l action : on ne s appuie que sur la balise et l action. */
          return (n.getAttribute('onclick')||'')===onclick;
        });
      }

      function ancreClicIdleV1_(){
        try{
          const c=REG.idleDernierClicAncreV1;
          if(!c||Date.now()-c.t>5000||!c.el.isConnected)return null;
          if(Math.abs((window.scrollY||0)-c.y)>40)return null;
          const racine=document.querySelector('.soreal-idle-page-root-v28');
          if(!racine||!racine.contains(c.el))return null;
          const r=c.el.getBoundingClientRect();
          if(r.bottom<=0||r.top>=(window.innerHeight||0))return null;
          const chemin=[];
          let n=c.el;
          while(n&&n!==racine){
            const parent=n.parentElement;
            if(!parent)return null;
            chemin.unshift(Array.prototype.indexOf.call(parent.children,n));
            n=parent;
          }
          if(n!==racine)return null;
          return signatureClicIdleV1_(c.el,racine,chemin,hautSansTransformIdleV1_(c.el));
        }catch(_e){return null;}
      }

      function signatureClicIdleV1_(el,racine,chemin,haut){
        const onclick=el.getAttribute('onclick')||'';
        const classes=String(el.className||'');
        const rang=jumeauxClicIdleV1_(racine,el.tagName,onclick,classes).indexOf(el);
        return {chemin:chemin,tag:el.tagName,id:el.id||'',onclick:onclick,classes:classes,rang:rang,texte:String(el.textContent||'').trim().slice(0,24),haut:haut};
      }

      /*
       * Épingle de clic : pendant 5 s après un clic (assez pour une réponse lente du serveur) dans la page, ce qui a été touché reste exactement au même endroit de l'écran, quoi que le rendu, les images qui se chargent ou un
       * bloc qui apparaît au-dessus fassent à la hauteur de la page. S'arrête dès que le joueur défile lui-même (molette, doigt, clavier). Ignorée pour les éléments fixes (fenêtres,
       * menus flottants) et pour la barre de menus, hors de la page.
       */
      let idlePinClicV1=null;

      function arreterPinClicIdleV1_(){
        if(idlePinClicV1){cancelAnimationFrame(idlePinClicV1.raf);idlePinClicV1=null;}
      }

      /*
       * Position du bouton SANS sa transformation (Norman, 2026-10-08 : « quand je presse le clavier de Wandoos la page fait un mini mouvement ; quand on trie, aussi, très léger »). Un bouton pressé s'enfonce de
       * quelques pixels (translate au :active, touches de Wandoos) : mesurée à l'instant du clic, sa position était décalée, et quand le doigt se levait la page « se corrigeait » de ces quelques pixels.
       */
      function hautSansTransformIdleV1_(e){
        const r=e.getBoundingClientRect();
        let ty=0;
        try{
          const t=window.getComputedStyle(e).transform;
          if(t&&t!=='none'){
            const m=t.match(/matrix(3d)?(([^)]+))/);
            if(m){
              const v=m[2].split(',').map(Number);
              ty=m[1]?(v[13]||0):(v[5]||0);
            }
          }
        }catch(_e){}
        return r.top-ty;
      }

      function demarrerPinClicIdleV1_(el){
        try{
          arreterPinClicIdleV1_();
          const racine=document.querySelector('.soreal-idle-page-root-v28');
          if(!racine||!racine.contains(el))return;
          /* Norman (2026-10-19) : « quand je lance un combat de boss, sa barre et la mienne s'arrêtent une demi-seconde ». Le profil montrait cette boucle (getBoundingClientRect à chaque image pendant 3 à 5 s) : à l'instant où le combat démarre et où la page bouge beaucoup, chaque mesure force un calcul de mise en page complet (219 ms sur les 900 premières ms). La borne d'arcade (Fight, Fuite…) ne décale jamais la page : aucun calage pour elle. */
          if(el.closest&&el.closest('.borne-v2'))return;
          for(let n=el;n&&n!==racine;n=n.parentElement){
            if(window.getComputedStyle(n).position==='fixed')return;
          }
          const r=el.getBoundingClientRect();
          if(r.bottom<=0||r.top>=(window.innerHeight||0))return;
          const chemin=[];
          let n=el;
          while(n&&n!==racine){
            const parent=n.parentElement;
            if(!parent)return;
            chemin.unshift(Array.prototype.indexOf.call(parent.children,n));
            n=parent;
          }
          const hautStable=hautSansTransformIdleV1_(el);
          const pin={ancre:signatureClicIdleV1_(el,racine,chemin,hautStable),haut:hautStable,debut:performance.now(),raf:0};
          idlePinClicV1=pin;
          (function boucle(){
            if(idlePinClicV1!==pin)return;
            if(performance.now()-pin.debut>5000){idlePinClicV1=null;return;}
            /* L element est gardé en mémoire : on ne le cherche de nouveau (balayage de la page) que s il a quitté la page. Pin arrêtée quand tout est stable depuis 1,5 s (au moins 3 s après le clic). */
            /* Mesure au plus toutes les 60 ms (et non à chaque image) : le calage de défilement reste imperceptible, sans forcer la mise en page 60 fois par seconde. */
            if(pin.derniere&&performance.now()-pin.derniere<60){pin.raf=requestAnimationFrame(boucle);return;}
            pin.derniere=performance.now();
            let e=pin.cache;
            if(!e||!e.isConnected){e=retrouverElementClicIdleV1_(pin.ancre);pin.cache=e;}
            if(e){
              const r=e.getBoundingClientRect();
              if(r.width||r.height){
                const dy=hautSansTransformIdleV1_(e)-pin.haut;
                if(Math.abs(dy)>1){window.scrollBy(0,dy);pin.stables=0;}else pin.stables=(pin.stables||0)+1;
              }
            }
            if((pin.stables||0)>=25&&performance.now()-pin.debut>3000){idlePinClicV1=null;return;}
            pin.raf=requestAnimationFrame(boucle);
          })();
        }catch(_e){}
      }

      function retrouverElementClicIdleV1_(ancre){
        if(ancre.id){const parId=document.getElementById(ancre.id);if(parId)return parId;}
        const racine=document.querySelector('.soreal-idle-page-root-v28');
        if(!racine)return null;
        if(ancre.onclick){
          const jumeaux=jumeauxClicIdleV1_(racine,ancre.tag,ancre.onclick,ancre.classes);
          if(jumeaux.length)return jumeaux[Math.min(Math.max(0,ancre.rang),jumeaux.length-1)];
        }
        let n=racine;
        for(let i=0;n&&i<ancre.chemin.length;i+=1)n=n.children[ancre.chemin[i]];
        return n&&n.tagName===ancre.tag&&String(n.textContent||'').trim().slice(0,24)===ancre.texte?n:null;
      }

      function restaurerAncreClicIdleV1_(ancre,xAvant){
        if(!ancre)return false;
        let dernierY=null;
        let trouve=false;
        function caler(){
          const el=retrouverElementClicIdleV1_(ancre);
          /* Introuvable ou devenu invisible (menu déroulant refermé, panneau replié) : on ne s appuie pas dessus. */
          if(!el||!(el.offsetWidth||el.offsetHeight||el.getClientRects().length))return;
          trouve=true;
          /* Le joueur a défilé lui-même depuis notre dernier calage : on n'y touche plus. */
          if(dernierY!==null&&Math.abs((window.scrollY||0)-dernierY)>2)return;
          const ecart=hautSansTransformIdleV1_(el)-ancre.haut;
          if(Math.abs(ecart)>1)window.scrollTo(xAvant,(window.scrollY||0)+ecart);
          dernierY=window.scrollY||0;
        }
        caler();
        setTimeout(caler,120);
        setTimeout(caler,450);
        return trouve;
      }

      /*
       * Norman (2026-09-27) : « Quand on ouvre et ferme le coffre, il y a un effet de clignotement. Il y en a plusieurs
       * dans le jeu... Part à la traque de ces sauts d'images et neutralise-les. La page ne doit jamais faire de saut ou
       * se déplacer sauf pendant les tutoriaux ou si c'est explicitement demandé. »
       *
       * Cause : chaque bascule d'onglet/panneau à l'intérieur d'une page (Coffre ouvert/fermé, pagination Coffre/Collection,
       * onglets Shop/Classement, notes de mise à jour, encart Infos, sauvegarde du pseudo, interrupteurs admin) remplace
       * .soreal-idle-page-root-v28 en entier (root.innerHTML=contenuMenuIdleV28_(...)) sans AUCUNE protection de défilement
       * -- contrairement au rendu complet (rendreIdleEtat_) qui, lui, gèle la hauteur du document pendant le remplacement
       * et restaure le défilement après coup (ancreSacIdleV1_/restaurerAncreSacIdleV1_, déjà en place depuis 2026-09-26).
       * Une page qui se raccourcit (ex. fermer le Coffre) fait alors automatiquement redescendre le défilement du
       * navigateur avant que rien ne le rétablisse -- exactement le saut/clignotement décrit. Cette fonction applique la
       * même protection à ces remplacements locaux, au lieu de dupliquer la logique à chaque site d'appel.
       */
      /* Rendu sur place : le moteur vit dans modules/morph-v1.js (extrait le 2026-10-07). Sans lui, innerHTML garde son comportement normal. */
      function installerMorphIdleV1_(element){
        const M=window.__SOREAL_IDLE_MORPH_V1__;
        if(M&&typeof M.installer==='function')M.installer(element);
      }

      function rafraichirMenuRacineIdleV28_(){
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(!root||!REG.idleEtat)return;
        const xAvant=window.scrollX||0;
        const yAvant=window.scrollY||0;
        const ancreClic=ancreClicIdleV1_();
        const ancreAvant=ancreClic?null:ancreSacIdleV1_();
        try{
          if(document.body){
            /* Hauteur retenue sur le conteneur du jeu (celui qui porte le menu collant), pas sur le body : sinon le menu est poussé hors de l'écran pendant les 700 ms où la page courte est plus petite que le body retenu (Norman, 2026-10-11, Renaissance). */
            const hoteHauteur=document.querySelector('.soreal-idle-native-v4');
            document.body.style.minHeight='';
            if(hoteHauteur)hoteHauteur.style.minHeight='';
            const hauteurAvant=Math.max(document.documentElement.scrollHeight||0,document.body.scrollHeight||0);
            if(hauteurAvant>0){
              if(hoteHauteur)hoteHauteur.style.minHeight=Math.max(0,hauteurAvant-(hoteHauteur.getBoundingClientRect().top+(window.scrollY||0)))+'px';
              else document.body.style.minHeight=hauteurAvant+'px';
              clearTimeout(window.__idleRelacherHauteurTimerV1__);
              window.__idleRelacherHauteurTimerV1__=setTimeout(function(){document.body.style.minHeight='';if(hoteHauteur)hoteHauteur.style.minHeight='';},700);
            }
          }
        }catch(_e){}
        installerMorphIdleV1_(root);
        root.innerHTML=contenuMenuIdleV28_(REG.idleEtat);
        /*
         * RÈGLE « aucun redessin visible » (AGENTS.md, règle n°4) : tout module qui anime lui-même des éléments de la page (liquide, compteurs, durées…) s'inscrit dans window.__SOREAL_IDLE_APRES_REDESSIN_V1__ ;
         * ses éléments sont remis à l'état animé ICI, dans la même tâche que le redessin, donc sans image intermédiaire aux valeurs du serveur.
         */
        try{(window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).forEach(function(f){try{f();}catch(_e){}});}catch(_e){}
        /* Calage immédiat (avant toute image), puis de nouveau quand la mise en page a bougé. */
        const ancre_ok=ancreClic?restaurerAncreClicIdleV1_(ancreClic,xAvant):false;
        requestAnimationFrame(function(){
          if(!ancre_ok)window.scrollTo(xAvant,yAvant);
          restaurerAncreSacIdleV1_(ancreAvant,xAvant,yAvant);
        });
      }

      const CLE_MENU_IDLE_V28=
        'sorealIdleMenuActifV28';

      function chargerMenuIdleV28_(){
        try{
          const sauve=
            sessionStorage.getItem(
              CLE_MENU_IDLE_V28
            );

          if(sauve){
            const ancien=String(sauve);
            REG.idleMenuActifV28=
              ancien==='inventaire'
                ?'aventure'
                :ancien==='perks'?'tower'
                :ancien==='titans'?'aventure'
                :ancien==='bestiaire'||ancien==='classement'||ancien==='succes'?'chroniques'
                :(ancien==='spendExp'||ancien==='sellout'?'shop':ancien);
          }
        }catch(e){}
      }

      function sauverMenuIdleV28_(){
        try{
          if(window.__SOREAL_IDLE_INPUT_MENU_V1__)window.__SOREAL_IDLE_INPUT_MENU_V1__.changer(REG.idleMenuActifV28);
        }catch(_e){}
        try{
          sessionStorage.setItem(
            CLE_MENU_IDLE_V28,
            REG.idleMenuActifV28
          );
        }catch(e){}
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-108 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-109 */
      /*
       * Menu du haut sur téléphone (Norman, 2026-10-04 : « j'aimerais qu'on puisse lancer le menu et qu'il continue de défiler jusqu'au bout ; là il s'arrête très vite »). Deux causes : l'aimantation du défilement
       * (scroll-snap) qui arrêtait l'élan à chaque bouton (retirée dans soreal-idle-themes.css), et chaque rendu de la page qui recréait le menu, le ramenait au début puis le recentrait sur le bouton actif, ce qui coupait
       * l'élan et renvoyait loin de l'endroit où on regardait. Le rendu est maintenant repoussé tant que le menu défile, et la position de défilement est conservée (scrollAvant) quand le menu actif n'a pas changé.
       */
      function restaurerScrollNavIdleV28_(scrollAvant){
        const actif=
          document.querySelector(
            '.soreal-idle-nav-v28 .active'
          );

        if(!actif)return;

        const nav=
          actif.closest('.soreal-idle-nav-v28');

        if(!nav)return;

        const navRect=nav.getBoundingClientRect();
        const actifRect=actif.getBoundingClientRect();

        const offsetDansNav=
          actifRect.left-
          navRect.left+
          nav.scrollLeft;

        const cible=
          offsetDansNav-
          (nav.clientWidth-actifRect.width)/2;

        nav.scrollLeft=
          Math.max(
            0,
            Math.min(
              typeof scrollAvant==='number'&&Number.isFinite(scrollAvant)?scrollAvant:cible,
              nav.scrollWidth-nav.clientWidth
            )
          );

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-110 */
        const racine=
          document.getElementById('app');

        let ancetre=
          nav.parentElement;

        while(
          ancetre &&
          ancetre!==racine &&
          ancetre!==document.body
        ){
          ancetre.scrollLeft=0;
          ancetre=ancetre.parentElement;
        }

        if(racine)racine.scrollLeft=0;
      }

      function generationJoueurIdleV75_(
        j
      ){
        return [
          String(j&&j.id||'joueur'),
          String(
            j&&j.profil&&j.profil.dateDebut||'date'
          )
        ].join('|');
      }

      function fonctionnalitesDisponiblesIdleV75_(j){
        const disponibles=[];

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-115 */
        ['aventure','combat_auto','renaissance']
          .forEach(function(id){
            const entree=
              j&&j.deblocages&&j.deblocages[id]
                ?j.deblocages[id]
                :null;

            if(
              entree &&
              idleEntier_(j.niveau)>=
              idleEntier_(entree.niveau)
            ){
              disponibles.push(id);
            }
          });

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-116 */

        if(
          j&&j.systemes&&Array.isArray(j.systemes.systems)
        ){
          j.systemes.systems.forEach(function(s){
            if(
              s&&
              s.id&&
              s.unlock&&
              s.unlock.unlocked&&
              /* Achievements : disponible (donc popup + voix) seulement une fois le menu apparu, au premier succès débloqué. */
              (s.id!=='achievements'||menuSuccesVisibleIdleV1_(j))
            ){
              disponibles.push(
                'meta:'+String(s.id)
              );
            }
          });
        }

        return disponibles;
      }

      /*
       * Panneaux explicatifs des systèmes (Norman, 2026-09-30 : « pour achievements, time machine, blood magic etc., c'est toujours le
       * même panneau : génère des panneaux explicatifs explicites pour chaque système qui se débloque »). Un texte par système, écrit
       * d'après SA page du wiki NGU Idle (Achievements, Advanced Training, Augmentations, Broken Time Machine, Blood Magic, Wandoos, NGU,
       * Yggdrasil, Gold Diggers, Beards, ITOPOD, Perks, Challenges, Titans, MacGuffin Fragments, Item Daycare, Questing, Quirks, Hacks,
       * Wishes, Cards, Cooking, pages consultées le 2026-09-30) : rien d'autre que ce que ces pages publient, aucune valeur inventée.
       * Anti-spoil (AGENTS.md règle n°2) : chaque texte n'explique QUE le système qui vient de se débloquer -- jamais un autre système,
       * un boss ou un objet encore inconnu, jamais un total. Ces textes sont aussi lus à voix haute (voix pré-générées) : phrases courtes.
       */
      const TEXTES_SYSTEMES_IDLE_V1={
        achievements:{
          intro:'Les Achievements, ce sont des médailles pour ceux qui font des trucs : chaque objectif accompli te rapporte des points bonus.',
          bullets:[
            'Chaque succès accompli te donne des points bonus, un peu comme un autocollant sur ton cahier, mais en utile.',
            'Ces points bonus augmentent ton gain d’AP : un pour cent de plus pour chaque tranche de cent points bonus. Autrement dit, plus tu collectionnes, mieux tu es payé.',
            'Les succès sont rangés par catégorie dans ce menu, pour retrouver facilement celui qui te manque.'
          ]
        },
        augmentations:{
          intro:'Les Augmentations donnent un multiplicateur d’Attack et de Defense : en clair, tu tapes plus fort et tu encaisses mieux, sans faire un seul calcul.',
          bullets:[
            'Place de l’Energy sur un Augment, c’est son carburant : plus il en reçoit, plus sa barre se remplit vite.',
            'Quand la barre est pleine, l’Augment gagne un niveau, à condition d’avoir assez d’Or pour payer la facture.',
            'Chaque Augment a une Upgrade qui multiplie son bonus : c’est le gros bouton « encore plus fort ».',
            'Les multiplicateurs de tous tes Augments s’additionnent, et tout repart à zéro à chaque Renaissance. Oui, c’est un peu vexant.'
          ]
        },
        advancedTraining:{
          intro:'L’Advanced Training est la salle de sport de ton héros : tu y dépenses de l’Energy pour entraîner tes capacités d’Aventure.',
          bullets:[
            'Place de l’Energy dans une capacité : chaque capacité s’entraîne avec sa propre énergie et gagne des niveaux.',
            'Résultat : plus de puissance et plus d’endurance en Aventure, donc des biceps virtuels.',
            'Attention, ça devient de plus en plus long : chaque niveau demande un peu plus de temps que le précédent, et les bonus grossissent de moins en moins vite.'
          ]
        },
        timeMachine:{
          intro:'La Time Machine fabrique de l’Or toute seule : elle rejoue le meilleur drop d’Or que tu as obtenu en Aventure, encore et encore.',
          bullets:[
            'Place de l’Energy sur la vitesse de la machine : sa barre se remplit plus vite, et chaque remplissage te rapporte de l’Or. C’est la photocopieuse à billets.',
            'Chaque niveau coûte de l’Or et de l’Energy, et un peu plus cher que le précédent. Rien n’est gratuit, même dans le futur.',
            'Ton meilleur boss vaincu multiplie aussi l’Or produit : battre des boss, ça paie.',
            'Les niveaux de la machine sont remis à zéro à chaque Renaissance, comme un voyageur qui perd ses bagages.'
          ]
        },
        bloodMagic:{
          intro:'Blood Magic transforme de la Magic et de l’Or en Blood, que tu dépenses ensuite dans des sorts. Oui, c’est de la cuisine, mais en plus rouge.',
          bullets:[
            'Choisis un rituel et place-y de la Magic : plus il en reçoit, plus vite il se termine. Chaque rituel terminé dépense de l’Or et produit du Blood.',
            'Le sort le plus courant ajoute un au multiplicateur de ton nombre pour chaque Blood dépensé : c’est ce qui te donne un plus gros nombre à la Renaissance.',
            'Lancer un sort utilise tout ton Blood d’un coup : pas de demi-mesure, on lance, on regarde, on applaudit.',
            'Le Blood est remis à zéro à chaque Renaissance, alors dépense-le avant.'
          ]
        },
        wandoos:{
          intro:'Wandoos est un système d’exploitation médiocre, mais il multiplie ton attaque et ta défense quand tu y déverses de l’Energy et de la Magic. Il plante peut-être, mais il paie.',
          bullets:[
            'Déverse de l’Energy et de la Magic dedans pour faire monter ses niveaux : c’est le tuyau d’arrosage du vieil ordinateur.',
            'Au début il ne sert pas à grand-chose, car ses bonus sont faibles. Il devient important plus tard dans le jeu : patience, il chauffe.',
            'À chaque Renaissance, il lui faut environ une heure pour atteindre sa pleine vitesse, sans que tu aies besoin d’être connecté. Il démarre tout seul, comme un vieux PC.',
            'Wandoos reste débloqué après une Renaissance, mais les niveaux d’Energy et de Magic sont perdus.'
          ]
        },
        ngu:{
          intro:'Les NGU, c’est un peu l’entraîneur de l’Entraînement : tu leur confies ton Energy et ta Magic, et ils font le sport à ta place pour te donner des bonus.',
          bullets:[
            'Choisis dans quel NGU envoyer chacune de tes ressources, comme on choisit à quel coach donner sa carte de fidélité.',
            'Chaque NGU gagne des niveaux, et chaque niveau coûte plus cher que le précédent : normal, plus on devient costaud, plus il faut de séances.',
            'Les NGU restent débloqués et gardent leurs niveaux après une Renaissance : tes coachs ne démissionnent jamais.'
          ]
        },
        yggdrasil:{
          intro:'Yggdrasil est l’arbre du monde : tu y fais pousser des fruits qui donnent des récompenses quand tu les manges. Un potager, mais cosmique.',
          bullets:[
            'Dépense des graines pour faire monter un fruit de palier : chaque palier de plus lui permet de pousser une heure de plus sans que tu aies à le manger.',
            'Active un fruit en payant son coût en Energy ou en Magic : ce coût est retiré temporairement de ton plafond, puis récupéré grâce à ta production. C’est un prêt, pas un cadeau.',
            'Un fruit qui a poussé au moins une heure peut être mangé pour sa récompense spéciale, ou récolté pour doubler les graines gagnées. Croquer ou replanter : à toi de voir.',
            'À la Renaissance, tes graines, tes fruits débloqués et tes paliers sont conservés. Les fruits en train de pousser sont perdus : mange-les avant, sinon ils finissent en compote.'
          ]
        },
        diggers:{
          intro:'Les Gold Diggers sont des mineurs à louer : tu leur sacrifies une partie de ton Or par seconde, et en échange ils te donnent des bonus dans plusieurs domaines du jeu.',
          bullets:[
            'Paie de l’Or pour débloquer un Digger et pour le faire monter de niveau : un mineur ne creuse pas gratuitement.',
            'Active un Digger pour recevoir son bonus. En échange, il retire en permanence une petite part de ton Or par seconde : c’est son salaire.',
            'Tu ne peux activer qu’autant de Diggers que tu as d’emplacements : pas de place, pas de pioche.',
            'Monter les Diggers de niveau augmente aussi le bonus de tous les Diggers, même ceux que tu n’actives pas : les mineurs au repos profitent quand même des progrès du syndicat.'
          ]
        },
        beards:{
          intro:'Les Beards sont des barbes qui te donnent des bonus temporaires. Oui, des barbes : on ne juge pas.',
          bullets:[
            'Chaque barbe donne un type de bonus différent : il y en a pour tous les goûts, même sans rasoir.',
            'Tu ne peux avoir actives qu’autant de barbes que tu as d’emplacements.',
            'À la Renaissance, si une barbe est active, une partie de son bonus temporaire devient permanente. Plus la Renaissance arrive tard, plus cette part est grande : laisse pousser.'
          ]
        },
        tower:{
          intro:'L’ITOPOD est une tour infinie : tu grimpes étage après étage en tapant tout ce qui bouge, pour gagner des points de perk et de l’expérience.',
          bullets:[
            'Choisis ton étage de départ et ton étage de fin : c’est ton ascenseur, tu règles le premier et le dernier bouton.',
            'Chaque dizaine d’ennemis vaincus te fait monter d’un étage.',
            'Si tu meurs, ou si tu bats dix ennemis à ton étage de fin, tu retournes à ton étage de départ. Retour au rez-de-chaussée, sans escalator.',
            'Plus tu montes, plus les ennemis sont forts, mais plus tu gagnes de progression vers les points de perk.'
          ]
        },
        perks:{
          intro:'Les Perks sont des améliorations que tu achètes avec les points de perk gagnés dans la tour : des petits bonus de carrière pour ton héros.',
          bullets:[
            'Dépense tes points de perk dans la page ITOPOD, avec le bouton « Atouts ».',
            'Chaque perk a un coût et un niveau maximum : on ne peut pas tout acheter à l’infini, même avec de la volonté.',
            'Certains perks s’achètent une seule fois, d’autres niveau par niveau.',
            'Certains perks donnent un bonus permanent : ceux-là, tu les gardes pour de bon.'
          ]
        },
        challenges:{
          intro:'Les Challenges sont des défis à relever : tu te mets volontairement des bâtons dans les roues, et le jeu te récompense pour ça.',
          bullets:[
            'Lancer un défi te fait faire une Renaissance : ton nombre revient à un. Prépare-toi mentalement.',
            'Tu peux quitter un défi quand tu veux, sans aucune pénalité à part le temps perdu : zéro honte, promis.',
            'Chaque défi peut être réussi plusieurs fois.',
            'Les récompenses sont les plus grosses à la première et à la dernière réussite.'
          ]
        },
        titans:{
          intro:'Les Titans sont des boss géants de l’Aventure, chacun dans sa propre zone : les gros durs du quartier, qui ne se laissent pas faire.',
          bullets:[
            'Tu peux combattre un Titan à tout moment, tant qu’il n’est pas en temps de repos : même les géants ont besoin d’une sieste.',
            'Un Titan vaincu te donne de l’expérience et des objets, comme de l’équipement ou des boosts. Ensuite, il a un temps de repos avant de revenir.',
            'Si tu perds, tu retournes à la zone de départ. Le temps de repos ne se remet pas à zéro : tu peux réessayer autant que tu veux.',
            'À chaque Renaissance, les Titans vivants disparaissent et un nouveau temps de repos commence. Chaque Titan devient plus fort à chaque attaque, il s’échauffe : garde de la marge de puissance.'
          ]
        },
        macguffins:{
          intro:'Les MacGuffins sont des objets uniques qui te donnent des bonus permanents à chaque Renaissance : des porte-bonheur qui se méritent.',
          bullets:[
            'Trouve des fragments en combattant dans les zones de l’Aventure : chaque zone compte tes victoires, et le fragment tombe quand le compteur est atteint.',
            'Équipe tes MacGuffins dans ton inventaire : tu ne peux en porter que selon ton nombre d’emplacements.',
            'Ils montent de niveau sans limite : le ciel est la seule frontière.',
            'Le bonus permanent grandit quand tu fais une Renaissance avec un fragment équipé : n’oublie pas de l’emporter avec toi.'
          ]
        },
        daycare:{
          intro:'La Garderie fait monter tes objets de niveau pendant que tu fais autre chose, sans que tu aies à les fusionner : une nounou pour objets.',
          bullets:[
            'Elle est utile pour les objets difficiles ou très longs à monter de niveau : ceux qui font les capricieux.',
            'Le petit chat de la garderie s’occupe de tes objets : le temps pour gagner un niveau dépend de chaque objet.',
            'Tu ne peux mettre qu’un seul exemplaire de chaque objet.',
            'Fusionner un objet dans un emplacement de la garderie ne fait rien : la nounou n’accepte pas les doublons.'
          ]
        },
        questing:{
          intro:'Les quêtes te donnent des points de quête en échange d’objets que tu ramasses en Aventure : tu fais la livraison, on te paie en points.',
          bullets:[
            'Lance une quête, puis ramasse l’objet de quête : il tombe dans une zone d’Aventure précise.',
            'Tu peux aussi activer le mode inactif pour avancer lentement sans ramasser l’objet toi-même : la quête se fait en pantoufles.',
            'Terminer une quête te donne des points de quête.',
            'Une quête en cours continue après une Renaissance, et tu peux l’abandonner quand tu veux : aucune rancune.'
          ]
        },
        quirks:{
          intro:'Les Quirks sont des petites manies que tu achètes avec des points de quête, et qui te donnent des bonus.',
          bullets:[
            'Les points de quête se gagnent en faisant des quêtes.',
            'Dépense-les dans ce menu pour acheter des bonus : c’est le rayon bonbons du jeu.',
            'Certains Quirks améliorent ta puissance, ta capacité ou tes barres d’Energy et de Magic, et d’autres augmentent tes gains d’Or.',
            'Certains Quirks ont plusieurs niveaux, et le prix est indiqué pour chaque niveau : lis l’étiquette avant de payer.'
          ]
        },
        hacks:{
          intro:'Les Hacks sont des programmes que tu fais monter de niveau pour booster définitivement d’autres statistiques du jeu : le pirate informatique, version gentille.',
          bullets:[
            'Répartis ta ressource entre les Hacks disponibles pour les faire monter de niveau.',
            'Chaque Hack donne un petit bonus par niveau, et des paliers de niveaux offrent en plus un bonus supplémentaire : une récompense pour les persévérants.',
            'Un Hack touche par exemple l’attaque et la défense, les statistiques d’Aventure ou les chances de butin.'
          ]
        },
        wishes:{
          intro:'Les Wishes sont des souhaits : tu mets tes ressources dans la lampe, et un génie très lent finit par les exaucer.',
          bullets:[
            'Pour exaucer un souhait, alloue-lui un peu de chacune de tes ressources : un souhait prend au minimum quatre heures. Le génie ne fait pas de livraison express.',
            'Mettre beaucoup de ressources dans un seul souhait rapporte de moins en moins. Il vaut mieux allouer peu de chaque, et répartir sur plusieurs souhaits si tu as plusieurs emplacements.',
            'Tu commences avec un seul emplacement de souhait.',
            'Les souhaits te donnent des bonus, et pas des moutons à cinq pattes.'
          ]
        },
        cards:{
          intro:'Les Cards sont des cartes à jouer qui te donnent des bonus permanents : tu les piges, tu les lances, et tu gardes l’effet pour toujours.',
          bullets:[
            'Tu reçois une carte toutes les heures, sauf si ton paquet est plein : un paquet plein, c’est un cadeau perdu.',
            'Pour lancer une carte, il faut de la mayonnaise : le coût est écrit sur la carte. Oui, de la vraie mayonnaise virtuelle.',
            'Une carte lancée disparaît, mais son bonus reste permanent.',
            'Tu peux aussi détruire une carte, ou la protéger pour ne pas la lancer ni la détruire par erreur.'
          ]
        },
        cooking:{
          intro:'La cuisine te permet d’augmenter définitivement ton gain d’expérience : chaque bon petit plat te rend plus malin. Bon appétit.',
          bullets:[
            'Tu peux manger un plat environ une fois toutes les vingt-quatre heures. Si tu ne le manges pas, le temps s’accumule pour les repas suivants : le frigo n’oublie rien.',
            'Ajuste la quantité de chaque ingrédient pour rendre le plat le plus efficace possible : dosage de chef.',
            'Équipe ton matériel de cuisine avant de manger pour augmenter les bonus.',
            'Quand tu manges le plat, son gain s’ajoute à ton gain d’expérience total, et un nouveau plat est généré.'
          ]
        }
      };

      /*
       * Texte d'explication d'un système « générique » (Perks, Quirks, Achievements…). Fonction pure : le popup l'affiche ET la génération des voix pré-enregistrées (voice-generate.mjs) la
       * lit pour chaque système du catalogue. Sans cela, ces popups n'avaient pas de fichier audio : repli sur la voix locale (lourde, jeu qui rame, souvent en erreur sur téléphone).
       */
      function infoSystemeGeneriqueIdleV1_(s,menuCible){
        return infoSurchargeeIdleV1_('nouveaute:systeme:'+s.id,String(s.name||s.id)+' (système)',infoSystemeGeneriqueBruteIdleV1_(s,menuCible));
      }

      function infoSystemeGeneriqueBruteIdleV1_(s,menuCible){
        /* Texte explicite du système (TEXTES_SYSTEMES_IDLE_V1) ; le texte générique ci-dessous n'est qu'un repli pour un système sans texte. */
        const t=TEXTES_SYSTEMES_IDLE_V1[s.id];
        if(t){
          return {
            icon:s.icon||'✨',
            titre:(s.name||'Nouveau système')+' débloqué',
            intro:t.intro,
            menuCible:menuCible,
            libelleCible:'Aller à '+(s.name||'ce système'),
            bullets:t.bullets.slice()
          };
        }
        return {
          icon:s.icon||'✨',
          titre:(s.name||'Nouveau système')+' débloqué',
          intro:'Une nouvelle couche de progression est disponible.',
          menuCible:menuCible,
          libelleCible:'Ouvrir le système',
          bullets:[
            s.desc||'Ce système améliore ta progression.',
            'Son état est sauvegardé dans le moteur partagé SOREAL IDLE.',
            s.kind==='permanent'
              ?'Cette progression est permanente entre les Renaissances.'
              :'Vérifie ce qui est conservé ou banké lors d’une Renaissance.'
          ]
        };
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-117 */
      function idleInfosParMenuIdleV1_(j){
        const definitions=definitionsNouveautesIdleV75_();
        const actuelles=fonctionnalitesDisponiblesIdleV75_(j);
        const parMenu={};

        actuelles.forEach(function(id){
          let info=definitions[id]||null;

          if(
            !info &&
            String(id).indexOf('meta:')===0 &&
            j&&j.systemes&&Array.isArray(j.systemes.systems)
          ){
            const systemeId=String(id).slice(5);
            const s=j.systemes.systems.find(function(entree){
              return entree&&entree.id===systemeId;
            });

            if(s){
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-118 */
              if(systemeId==='moneyPit'){
                info=infoMoneyPitIdleV1_();
              }else if(systemeId!=='dailySpin'){
                const menuCible=REG.IDLE_MENU_PAR_SYSTEME_V1[systemeId]||null;
                info=menuCible?infoSystemeGeneriqueIdleV1_(s,menuCible):null;
              }
            }
          }

          if(info&&info.menuCible){
            parMenu[info.menuCible]=info;
          }
        });

        return parMenu;
      }

      function idleMenusAckCleV1_(j){
        return 'soreal_idle_menus_ack_v1_'+generationJoueurIdleV75_(j);
      }

      function idleMenusAckListeLocaleV1_(j){
        try{
          const brut=JSON.parse(localStorage.getItem(idleMenusAckCleV1_(j))||'[]');
          return Array.isArray(brut)?brut:[];
        }catch(e){
          return [];
        }
      }

      function idleMenusAckListeV1_(j){
        const liste=idleMenusAckListeLocaleV1_(j).slice();
        idleVusServeurV1_(j).concat(Object.keys(REG.idleVusMemoireV1)).forEach(function(id){
          if(String(id).indexOf('menu:')===0&&liste.indexOf(String(id).slice(5))===-1)liste.push(String(id).slice(5));
        });
        return liste;
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-119 */
      const IDLE_MENUS_SANS_CLIGNOTEMENT_V1=['entrainement','combat','parametres','sellout','shop','admin'];

      function idleMenuEstAcquisV1_(j,menuId){
        const liste=idleMenusAckListeV1_(j);
        /* Chroniques remplace Collection, Classement et Succès : un joueur qui connaissait déjà l'un d'eux ne le revoit pas comme un menu neuf. */
        if(menuId==='chroniques'&&['bestiaire','classement','succes'].some(function(a){return liste.indexOf(a)!==-1;}))return true;
        return IDLE_MENUS_SANS_CLIGNOTEMENT_V1.indexOf(menuId)!==-1||
          liste.indexOf(menuId)!==-1;
      }

      function idleMenuMarquerAcquisV1_(j,menuId){
        if(IDLE_MENUS_SANS_CLIGNOTEMENT_V1.indexOf(menuId)!==-1)return;
        const liste=idleMenusAckListeLocaleV1_(j);
        if(liste.indexOf(menuId)===-1){
          liste.push(menuId);
          try{
            localStorage.setItem(idleMenusAckCleV1_(j),JSON.stringify(liste));
          }catch(e){}
        }
        idleVuMarquerV1_('menu:'+menuId);
      }

      function infoMoneyPitIdleV1_(){
        return infoSurchargeeIdleV1_('nouveaute:moneyPit','Money Pit & Roue journalière',infoMoneyPitBruteIdleV1_());
      }

      function infoMoneyPitBruteIdleV1_(){
        return {
          icon:'🕳️',
          titre:'Money Pit & Roue journalière',
          intro:'Tu as débloqué un trou dans lequel jeter tout ton Or. Oui, tout. Excellente gestion financière.',
          menuCible:'moneyPit',
          libelleCible:'Ouvrir le Money Pit',
          bullets:[
            'Money Pit : avec au moins 100 000 Or, tu peux jeter TOUT l’Or que tu possèdes dans le trou. Plus la somme est énorme, plus les cadeaux possibles sont beaux.',
            'Le trou te recrache un lot au hasard selon la somme jetée, puis il doit se recharger avant le prochain lancer. Plus tu en fais dans la même partie, plus la recharge est longue : il se fatigue.',
            'Roue journalière : elle est dans ce même menu. Quand elle est prête, fais-la tourner pour gagner un lot au hasard, notamment de l’AP ou des graines.',
            'La roue revient sur un cycle de 24 heures. Plus tu accumules de tours au fil du temps, plus ses récompenses s’améliorent : la patience paie.',
            'Repère visuel : le bouton Money Pit devient vert quand le trou est prêt, ou jaune quand la roue journalière est disponible.'
          ]
        };
      }

      /* Systèmes génériques (Perks, Quirks…) : déclarés pour l'éditeur Admin même avant d'être débloqués (l'administrateur voit tout). */
      function declarerTextesSystemesIdleV1_(j){
        try{
          const T=window.__SOREAL_IDLE_TEXTES_V1__;
          if(!T||!j||!j.systemes||!Array.isArray(j.systemes.systems))return;
          infoMoneyPitIdleV1_();
          definitionsNouveautesIdleV75_();
          j.systemes.systems.forEach(function(sys){
            if(sys&&sys.id&&sys.id!=='moneyPit'&&sys.id!=='dailySpin'&&REG.IDLE_MENU_PAR_SYSTEME_V1[sys.id])infoSystemeGeneriqueIdleV1_(sys,REG.IDLE_MENU_PAR_SYSTEME_V1[sys.id]);
          });
        }catch(_e){}
      }

      /* Anciennes fenêtres d'explication de chaque menu (première ouverture) : réglage séparé de l'ancien tutoriel de départ. */
      function anciennesFenetresMenusPermisesIdleV1_(){
        const T=window.__SOREAL_IDLE_TUTORIEL_V1__;
        return !T||T.ancienMenusPermis();
      }

      function tutorielPagesNaviguerV1_(delta){
        const etat=REG.idleTutorielPagesEnCoursV1;
        if(!etat)return;

        /* Norman (2026-10-22) : l'introduction est maintenant seule (une page) ; « avancer » depuis la dernière page la ferme, comme son bouton « Terminé ». */
        if(delta>0&&etat.index>=etat.pages.length-1){tutorielPagesFermerV1_();return;}

        etat.index=Math.max(0,Math.min(etat.pages.length-1,etat.index+delta));
        rendreTutorielPagesIdleV1_();
      }

      /*
       * Menu débloqué (Norman, 2026-09-26) : à chaque nouveau menu, une annonce en fondu (celle des autres annonces) et un petit bruit de victoire,
       * différent de celui des boss. « Vu » est mémorisé côté serveur (idleVuMarquerV1_) : une annonce par menu et par joueur. La toute première fois
       * (joueur existant ou nouveau), les menus déjà disponibles sont seulement notés, sans annonce.
       */
      function annoncerNouveauxMenusIdleV1_(j){
        if(!j||typeof window.__sorealFadeNoticeV1__!=='function')return;
        const dispo=REG.IDLE_MENUS_V1.filter(function(m){
          return m&&m.id&&m.id!=='admin'&&menuDisponibleIdleV28_(m.id,j);
        });
        if(!dispo.length)return;
        if(!idleVuConnuV1_(j,'menus-annonces-init')){
          idleVuMarquerV1_('menus-annonces-init');
          dispo.forEach(function(m){idleVuMarquerV1_('menu-annonce:'+m.id);});
          return;
        }
        const nouveaux=dispo.filter(function(m){
          if(m.id==='chroniques'&&['bestiaire','classement','succes'].some(function(a){return idleVuConnuV1_(j,'menu-annonce:'+a);}))return false;
          return !idleVuConnuV1_(j,'menu-annonce:'+m.id);
        });
        if(!nouveaux.length)return;
        nouveaux.forEach(function(m){idleVuMarquerV1_('menu-annonce:'+m.id);});
        jouerEffetAudioIdleV199_('menuUnlock');
        nouveaux.forEach(function(m){
          window.__sorealFadeNoticeV1__('🔓 Nouveau menu débloqué !',[(m.icon?m.icon+' ':'')+m.nom],{dureeMs:3800});
        });
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-131 */
      /*
       * Identité de chaque bouton du menu (Norman, 2026-10-03 : « refais les boutons du menu en haut, je ne les aime pas ; ils doivent être beaucoup plus parlants par rapport à ce qu'ils font ; une identité par
       * bouton »). Chaque menu a sa COULEUR (IDLE_NAV_COULEURS_V1), son ICÔNE, la FORME de son badge (bouclier pour le combat, goutte pour le sang, bulle pour le chat…) et un VERBE qui dit ce qu'on y fait.
       */
      /*
       * Menu ALIMENTÉ (Norman, 2026-10-03 : « quand un menu est alimenté, c'est-à-dire quand on y place de l'énergie, un effet dessus ; chaque bouton avec un effet qui représente ce qu'il fait ») : un menu qui
       * consomme de l'énergie, de la magie ou de la ressource 3 reçoit la classe « alimente-v1 » tant qu'on y en place ; l'effet propre à chaque menu est dans soreal-idle-themes.css (data-effet-v1 = identifiant du menu).
       */
      /*
       * Autres états qui animent un menu (Norman, 2026-10-03) : Aventure quand on farme dans une zone (pas en zone sûre) ; Renaissance quand le prochain NUMBER dépasse celui du dernier Rebirth ; Défis quand un défi est
       * actif ; Titans quand un titan est prêt à être affronté ; Succès tant qu'il y en a de non vus ; Shop, Classement, Collection, Chat et Réglages tant qu'on les consulte.
       */
      const IDLE_MENUS_ETATS_V1={aventure:1,renaissance:1,challenges:1,titans:1,shop:1,chroniques:1,chat:1,parametres:1,tower:1};

      const IDLE_MENUS_CONSULTES_V1={shop:1,chroniques:1,chat:1,parametres:1};

      function idleMenuEtatAnimeIdleV1_(id,j){
        if(!j)return false;
        if(IDLE_MENUS_CONSULTES_V1[id])return REG.idleMenuActifV28===id;
        if(id==='aventure'){
          const a=aventureMetaIdleV47_(j);
          if(a&&Array.isArray(a.titans)){
            const maintenant=heureServeurIdleV1_();
            if(a.titans.some(function(t){return t&&t.id&&t.progressionUnlocked!==false&&!(t.state&&t.state.hiddenPanel)&&!(idleNombre_(t.state&&t.state.nextAt)>maintenant);}))return true;
          }
          return Boolean(a&&a.selectedZone&&String(a.selectedZone)!=='safe');
        }
        if(id==='renaissance'){
          const r=j.renaissance||{};
          const meta=j.systemes&&j.systemes.rebirth?j.systemes.rebirth:{};
          const actuel=Math.max(1,idleNombre_(meta.number||r.number||1));
          const prochain=Math.max(1,idleNombre_(meta.nextNumber||r.nextNumber||actuel));
          return prochain>actuel*(1+1e-9);
        }
        if(id==='challenges'){
          const c=j.systemes&&j.systemes.challenge;
          return Boolean(c&&String(c.active||'')!=='');
        }
        if(id==='titans'){
          const a=aventureMetaIdleV47_(j);
          const liste=a&&Array.isArray(a.titans)?a.titans:[];
          const maintenant=heureServeurIdleV1_();
          return liste.some(function(t){
            return t&&t.id&&t.progressionUnlocked!==false&&!(t.state&&t.state.hiddenPanel)&&!(idleNombre_(t.state&&t.state.nextAt)>maintenant);
          });
        }
        /* ITOPOD : animé tant que la tour tourne (système actif), comme les autres menus qui travaillent. */
        if(id==='tower'){
          const liste=j.systemes&&Array.isArray(j.systemes.systems)?j.systemes.systems:[];
          const tour=liste.find(function(x){return x&&x.id==='tower';});
          return Boolean(tour&&tour.state&&tour.state.active);
        }
        return false;
      }

      const IDLE_MENUS_ALIMENTABLES_V1={entrainement:1,augmentations:1,avance:1,machine:1,sang:1,wandoos:1,ngu:1,yggdrasil:1,diggers:1,beards:1,hacks:1,wishes:1};

      /* Les boutons du menu du haut ne s'animent (« menu actif ») qu'avec l'achat « Menus animés » du rayon Toc de la boutique EXP (Norman, 2026-10-04). Le serveur l'annonce par `menusAnimes`. */
      function menusAnimesAchetesIdleV1_(j){
        return Boolean(j&&j.menusAnimes===true);
      }

      function idleMenuAlimenteV1_(id,j){
        if(!menusAnimesAchetesIdleV1_(j))return false;
        if(IDLE_MENUS_ETATS_V1[id])return idleMenuEtatAnimeIdleV1_(id,j);
        if(!j||!IDLE_MENUS_ALIMENTABLES_V1[id])return false;
        if(id==='entrainement'){
          const liste=j.basicTraining&&Array.isArray(j.basicTraining.skills)?j.basicTraining.skills:[];
          return liste.some(function(x){return x&&idleNombre_(x.allocation)>0;});
        }
        const sid=REG.IDLE_SYSTEME_PAR_MENU_V1[id];
        const systemes=j.systemes&&Array.isArray(j.systemes.systems)?j.systemes.systems:[];
        const sys=systemes.find(function(x){return x&&x.id===sid;});
        const etat=sys&&sys.state;
        if(!etat)return false;
        const a=etat.allocation;
        if(a&&(idleNombre_(a.energy)>0||idleNombre_(a.magic)>0||idleNombre_(a.r3)>0))return true;
        const donnees=etat.data||{};
        const enSomme=function(objet,cles){
          return Object.keys(objet||{}).some(function(k){const p=objet[k]||{};return cles.some(function(c){return idleNombre_(p[c])>0;});});
        };
        if(id==='augmentations')return enSomme(donnees.pairs,['energy','upgradeEnergy']);
        if(id==='avance')return enSomme(donnees.tracks,['energy']);
        return false;
      }

      function actualiserNavAlimenteIdleV1_(){
        if(!REG.idleEtat)return;
        document.querySelectorAll('.soreal-idle-nav-button-v28[data-menu-id-v1]').forEach(function(b){
          b.classList.toggle('alimente-v1',idleMenuAlimenteV1_(b.getAttribute('data-menu-id-v1'),REG.idleEtat));
        });
      }

      /*
       * Disponibilité dans le menu Money Pit (Norman, 2026-10-03 : « quand le Money Pit, la roue ou le bonus AP est disponible, le bouton doit glow de manière visible »). Renvoie
       * 'pit' (vert), 'roue' (jaune), 'calendrier' (orange) ou null ; priorité dans cet ordre. Heure du serveur pour les échéances.
       */
      function idleDisponibiliteMoneyPitV1_(j){
        const pit=systemeMetaParIdIdleV130_(j,'moneyPit');
        if(!(pit&&pit.unlock&&pit.unlock.unlocked))return null;
        const gold=idleNombre_(j&&j.systemes&&j.systemes.currencies&&j.systemes.currencies.gold);
        const pitData=pit.state&&pit.state.data||null;
        if(pitData&&gold>=100000&&heureServeurIdleV1_()>=Number(pitData.nextAt||0))return 'pit';
        const roue=systemeMetaParIdIdleV130_(j,'dailySpin');
        const roueData=roue&&roue.state&&roue.state.data||null;
        if(roue&&roue.unlock&&roue.unlock.unlocked&&roueData&&heureServeurIdleV1_()>=Number(roueData.readyAt||0))return 'roue';
        const cal=j&&j.systemes&&j.systemes.loginCalendar;
        if(cal&&cal.reclamable)return 'calendrier';
        return null;
      }

      let idleDispoMoneyPitVerifieV1=0;

      function actualiserDisponibiliteMoneyPitNavIdleV1_(){
        if(!REG.idleEtat)return;
        /* Une vérification par minute suffit (Norman, 2026-10-03 : « chaque seconde, ça va alourdir le site ») : une échéance n'a pas besoin d'être détectée à la seconde près. */
        const maintenantVerif=Date.now();
        if(maintenantVerif-idleDispoMoneyPitVerifieV1<60000)return;
        idleDispoMoneyPitVerifieV1=maintenantVerif;
        const dispo=idleDisponibiliteMoneyPitV1_(REG.idleEtat)||'';
        if(dispo===REG.idleDispoMoneyPitDerniereV1)return;
        const bouton=document.querySelector('.soreal-idle-nav-button-v28[data-menu-id-v1="moneyPit"]');
        if(!bouton)return;
        REG.idleDispoMoneyPitDerniereV1=dispo;
        Object.keys(REG.IDLE_DISPO_MONEY_PIT_V1).forEach(function(k){bouton.classList.remove(REG.IDLE_DISPO_MONEY_PIT_V1[k].classe);});
        bouton.classList.remove('soreal-idle-nav-dispo-v1');
        if(dispo){
          bouton.classList.add(REG.IDLE_DISPO_MONEY_PIT_V1[dispo].classe,'soreal-idle-nav-dispo-v1');
          bouton.style.setProperty('--nav-color',REG.IDLE_DISPO_MONEY_PIT_V1[dispo].couleur);
        }else{
          bouton.style.setProperty('--nav-color',REG.IDLE_NAV_COULEURS_V1.moneyPit||'#9aa5bb');
        }
      }

      function idleCouleurMoneyPitNavV1_(j){
        const dispoNav=idleDisponibiliteMoneyPitV1_(j);
        if(dispoNav==='calendrier')return REG.IDLE_DISPO_MONEY_PIT_V1.calendrier.couleur;
        const pit=systemeMetaParIdIdleV130_(j,'moneyPit');
        const pitData=pit&&pit.state&&pit.state.data||null;
        const gold=idleNombre_(
          j&&j.systemes&&j.systemes.currencies&&j.systemes.currencies.gold
        );
        const pitPret=Boolean(
          pit&&pit.unlock&&pit.unlock.unlocked&&
          pitData&&
          gold>=100000&&
          heureServeurIdleV1_()>=Number(pitData.nextAt||0)
        );
        if(pitPret)return '#2ecc71';

        const roue=systemeMetaParIdIdleV130_(j,'dailySpin');
        const roueData=roue&&roue.state&&roue.state.data||null;
        const rouePrete=Boolean(
          roue&&roue.unlock&&roue.unlock.unlocked&&
          roueData&&
          heureServeurIdleV1_()>=Number(roueData.readyAt||0)
        );
        if(rouePrete)return '#f1c40f';

        return null;
      }

      let idleMenuOrdreTravailV1=null;

      function idleMenuOrdreCleV1_(j){
        return 'soreal_idle_menu_ordre_v3_'+generationJoueurIdleV75_(j);
      }

      /*
       * Réparation unique (Norman, 2026-10-22) : l'ancien enregistrement plaçait les menus encore verrouillés après Réglages. Une seule fois par compte, ceux qui suivent Réglages (hors le groupe de fin) sont retirés de
       * l'ordre enregistré : ils reprennent leur place par défaut. Le drapeau voyage avec le compte (préférence soreal_idle_*).
       */
      const CLE_REPARATION_ORDRE_MENUS_V1='soreal_idle_menu_ordre_reparee_v1';
      function reparerOrdreMenusIdleV1_(liste,j){
        try{
          if(localStorage.getItem(CLE_REPARATION_ORDRE_MENUS_V1))return liste;
          localStorage.setItem(CLE_REPARATION_ORDRE_MENUS_V1,'1');
        }catch(e){return liste;}
        const iReglages=liste.indexOf('parametres');
        if(iReglages===-1)return liste;
        const fin=['shop','chroniques','chat','parametres','admin'];
        const propre=liste.filter(function(id,i){return i<iReglages||fin.indexOf(id)!==-1;});
        if(propre.length===liste.length)return liste;
        try{localStorage.setItem(idleMenuOrdreCleV1_(j),JSON.stringify(propre));}catch(e){}
        if(j&&j.profil&&j.profil.stats)j.profil.stats.menuOrdre=propre.slice();
        if(SOREAL_SESSION){
          try{google.script.run.withSuccessHandler(function(){}).withFailureHandler(function(){}).definirOrdreMenusSorealIdle(SOREAL_SESSION,propre);}catch(e){}
        }
        return propre;
      }

      function idleMenuOrdreEnregistreV1_(j){
        const serveur=j&&j.profil&&j.profil.stats&&Array.isArray(j.profil.stats.menuOrdre)?j.profil.stats.menuOrdre:null;
        if(serveur&&serveur.length)return reparerOrdreMenusIdleV1_(serveur,j);
        try{
          const brut=JSON.parse(localStorage.getItem(idleMenuOrdreCleV1_(j))||'[]');
          return Array.isArray(brut)?brut:[];
        }catch(e){
          return [];
        }
      }

      function ordonnerMenusIdleV1_(defauts,ordre){
        const ids=defauts.map(function(m){return m.id;});
        const res=(Array.isArray(ordre)?ordre:[]).filter(function(id,i,tab){
          return ids.indexOf(id)!==-1&&tab.indexOf(id)===i;
        });
        /*
         * Admin est TOUJOURS le dernier (Norman, 2026-10-09 : « des menus s'ajoutent après Admin ») ; il n'apparaît que pour l'administrateur (voir menuDisponibleIdleV28_). On le met de côté pendant le placement des
         * menus qui se débloquent (ils s'intercalent donc toujours AVANT lui) et on le remet à la fin. Par défaut, les cinq derniers boutons sont Boutique, Chroniques, Chat, Réglages puis Admin (ordre de
         * IDLE_MENUS_V1) ; un rangement choisi par le joueur reste prioritaire pour les autres.
         */
        const iAdmin=res.indexOf('admin');
        if(iAdmin!==-1)res.splice(iAdmin,1);
        ids.forEach(function(id,i){
          if(id==='admin'||res.indexOf(id)!==-1)return;
          let pos=0;
          for(let k=i-1;k>=0;k-=1){
            const p=res.indexOf(ids[k]);
            if(p!==-1){pos=p+1;break;}
          }
          res.splice(pos,0,id);
        });
        if(ids.indexOf('admin')!==-1)res.push('admin');
        return res.map(function(id){
          return defauts.find(function(m){return m.id===id;});
        });
      }

      function menusOrdonnesIdleV1_(j){
        return ordonnerMenusIdleV1_(
          REG.IDLE_MENUS_V1,
          REG.idleMenuEditionV1&&idleMenuOrdreTravailV1?idleMenuOrdreTravailV1:idleMenuOrdreEnregistreV1_(j)
        );
      }

      /* Titans débloqués : le menu Adventure devient « Adventure & Titans » (Norman, 2026-10-09) ; tant qu'aucun titan n'est découvert, le nom reste « Adventure » (anti-spoil). */
      function nomMenuIdleV1_(m,j){
        if(m.id!=='aventure')return m.nom;
        try{
          const a=aventureMetaIdleV47_(j);
          if(a&&Array.isArray(a.titans)&&a.titans.some(function(t){return t&&t.id&&t.progressionUnlocked!==false;}))return 'Adventure & Titans';
        }catch(e){}
        return m.nom;
      }

      /*
       * Quand un Titan est prêt à être affronté (et ne se tue pas tout seul), le mot « Titans » du menu brille pour attirer l'œil (Norman, 2026-10-11). Même condition que le bouton « Titans » de la page Aventure.
       */
      function htmlNomMenuIdleV1_(m,j){
        const nom=nomMenuIdleV1_(m,j);
        if(m.id==='aventure'&&/ & Titans$/.test(nom)){
          try{
            const api=window.__SOREAL_IDLE_TITANS_V1__;
            if(api&&typeof api.disponible==='function'&&api.disponible(j))return idleHtml_(nom.slice(0,-6))+'<span class="soreal-idle-nav-titans-brille-v1">Titans</span>';
          }catch(e){}
        }
        return idleHtml_(nom);
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-135 */
      let idleSwipeDebutXV1=null;

      let idleSwipeDebutYV1=null;

      function menusVisiblesIdleV1_(j){
        return menusOrdonnesIdleV1_(j).filter(function(m){
          return m.id!=='chat'&&menuDisponibleIdleV28_(m.id,j);
        }).map(function(m){return m.id;});
      }

      function rangeesMenuIdleV1_(){
        try{
          const n=Number(localStorage.getItem(REG.CLE_RANGEES_MENU_IDLE_V1));
          return n===1||n===2||n===3?n:2;
        }catch(e){return 2;}
      }

      function htmlRangeesMenuIdleV1_(){
        const n=rangeesMenuIdleV1_();
        return '<span class="soreal-idle-nav-rangees-v1">Lignes '+[1,2,3].map(function(k){
          return '<button type="button" data-nav-rangees="'+k+'" class="'+(k===n?'actif':'')+'" onclick="window.__reglerRangeesMenuIdleV1__('+k+')" aria-label="'+k+' ligne'+(k>1?'s':'')+'">'+k+'</button>';
        }).join('')+'</span>';
      }

      function htmlBandeauRangementMenuIdleV1_(){
        return '<div class="soreal-idle-nav-rangement-v1" data-idle-nav-rangement-v1>'+
          '<span>↔️ <b>Rangement des boutons</b> — glisse un bouton entre deux autres</span>'+htmlRangeesMenuIdleV1_()+
          '<button type="button" class="soreal-idle-nav-valider-v1" onclick="window.__validerRangementMenuIdleV1__()">✔ Valider</button>'+
        '</div>';
      }

      function navMenuIdleV1_(){
        return document.querySelector('.soreal-idle-nav-v28');
      }

      function ordreDepuisNavIdleV1_(){
        const nav=navMenuIdleV1_();
        if(!nav)return idleMenuOrdreTravailV1||[];
        const visibles=Array.prototype.map.call(nav.querySelectorAll('[data-menu-id-v1]'),function(b){
          return b.getAttribute('data-menu-id-v1');
        });
        /*
         * Norman (2026-10-22) : « Machine temporelle est entre Réglages et Admin ». Les menus pas encore débloqués (absents de la barre) étaient ajoutés À LA FIN de l'ordre enregistré : une fois débloqués, ils
         * apparaissaient tout en bas. Chacun reste maintenant juste après le menu qui le précède dans l'ordre de travail (sa place par défaut au départ).
         */
        const travail=idleMenuOrdreTravailV1||[];
        const res=visibles.slice();
        travail.forEach(function(id,i){
          if(visibles.indexOf(id)!==-1)return;
          let pos=0;
          for(let k=i-1;k>=0;k-=1){
            const p=res.indexOf(travail[k]);
            if(p!==-1){pos=p+1;break;}
          }
          res.splice(pos,0,id);
        });
        return res;
      }

      function entrerRangementMenuIdleV1_(){
        if(REG.idleMenuEditionV1||!REG.idleEtat)return;
        REG.idleMenuEditionV1=true;
        idleMenuOrdreTravailV1=menusOrdonnesIdleV1_(REG.idleEtat).map(function(m){return m.id;});
        const nav=navMenuIdleV1_();
        if(nav){
          nav.classList.add('edition');
          if(!nav.querySelector('[data-idle-nav-rangement-v1]')){
            nav.insertAdjacentHTML('afterbegin',htmlBandeauRangementMenuIdleV1_());
          }
        }
      }

      function validerRangementMenuIdleV1_(){
        if(!REG.idleMenuEditionV1)return;
        const ordre=ordreDepuisNavIdleV1_();
        REG.idleMenuEditionV1=false;
        idleMenuOrdreTravailV1=null;
        REG.idleMenuClicAvaleJusquaV1=Date.now()+400;
        try{
          localStorage.setItem(idleMenuOrdreCleV1_(REG.idleEtat),JSON.stringify(ordre));
        }catch(e){}
        if(REG.idleEtat&&REG.idleEtat.profil&&REG.idleEtat.profil.stats)REG.idleEtat.profil.stats.menuOrdre=ordre.slice();
        const nav=navMenuIdleV1_();
        if(nav){
          nav.classList.remove('edition');
          const bandeau=nav.querySelector('[data-idle-nav-rangement-v1]');
          if(bandeau)bandeau.remove();
        }
        if(SOREAL_SESSION){
          try{
            google.script.run
              .withSuccessHandler(function(res){
                if(res&&res.ok&&REG.idleEtat&&REG.idleEtat.profil&&REG.idleEtat.profil.stats&&Array.isArray(res.menuOrdre)){
                  REG.idleEtat.profil.stats.menuOrdre=res.menuOrdre;
                }
              })
              .withFailureHandler(function(){})
              .definirOrdreMenusSorealIdle(SOREAL_SESSION,ordre);
          }catch(e){}
        }
      }

      function installerRangementMenuIdleV1_(){
        if(window.__sorealIdleRangementMenuV1)return;
        window.__sorealIdleRangementMenuV1=true;
        const DELAI_MAINTIEN_MS=600;
        let minuterie=0;
        let debut=null;
        let glisse=null;

        function boutonNav(cible){
          return cible&&cible.closest?cible.closest('.soreal-idle-nav-button-v28[data-menu-id-v1]'):null;
        }
        function annulerMaintien(){
          if(minuterie){clearTimeout(minuterie);minuterie=0;}
          debut=null;
        }
        function commencerGlisse(bouton,ev){
          if(glisse)return;
          glisse={bouton:bouton,id:ev.pointerId};
          bouton.classList.add('glisse');
          try{bouton.setPointerCapture(ev.pointerId);}catch(e){}
        }
        /* Défilement automatique pendant le glissement (Norman, 2026-10-22 : « sur PC on ne peut pas glisser la barre vers le bas, on ne peut pas déplacer les éléments du bas de la liste »). */
        let dernierY=0,boucleDefilement=0;
        function conteneurDefilant(nav){
          let e=nav;
          while(e&&e!==document.body&&e!==document.documentElement){
            const o=getComputedStyle(e).overflowY;
            if((o==='auto'||o==='scroll')&&e.scrollHeight>e.clientHeight+2)return e;
            e=e.parentElement;
          }
          return null;
        }
        function defilerPendantGlisse(){
          boucleDefilement=0;
          if(!glisse)return;
          const nav=navMenuIdleV1_();
          const cont=nav?conteneurDefilant(nav):null;
          const r=cont?cont.getBoundingClientRect():{top:0,bottom:window.innerHeight};
          const marge=70,haut=dernierY-r.top,bas=r.bottom-dernierY;
          let dy=0;
          if(bas<marge)dy=Math.ceil((marge-Math.max(0,bas))/5);
          else if(haut<marge)dy=-Math.ceil((marge-Math.max(0,haut))/5);
          if(dy){
            if(cont)cont.scrollTop+=dy;else window.scrollBy(0,dy);
            /* le bouton tenu suit : on réévalue l'élément sous le pointeur */
            const cible=boutonNav(document.elementFromPoint(pointerX,dernierY));
            if(cible&&cible!==glisse.bouton&&nav){
              const rc=cible.getBoundingClientRect();
              const vertical=getComputedStyle(nav).flexDirection==='column';
              const avant=vertical?dernierY<rc.top+rc.height/2:pointerX<rc.left+rc.width/2;
              nav.insertBefore(glisse.bouton,avant?cible:cible.nextSibling);
            }
          }
          boucleDefilement=requestAnimationFrame(defilerPendantGlisse);
        }
        let pointerX=0;
        function terminerGlisse(){
          if(boucleDefilement){cancelAnimationFrame(boucleDefilement);boucleDefilement=0;}
          if(!glisse)return;
          glisse.bouton.classList.remove('glisse');
          try{glisse.bouton.releasePointerCapture(glisse.id);}catch(e){}
          glisse=null;
          idleMenuOrdreTravailV1=ordreDepuisNavIdleV1_();
        }

        document.addEventListener('pointerdown',function(ev){
          const bouton=boutonNav(ev.target);
          if(!bouton)return;
          if(REG.idleMenuEditionV1){
            ev.preventDefault();
            commencerGlisse(bouton,ev);
            return;
          }
          if(ev.pointerType==='mouse'&&ev.button!==0)return;
          annulerMaintien();
          debut={x:ev.clientX,y:ev.clientY,bouton:bouton,id:ev.pointerId};
          minuterie=setTimeout(function(){
            minuterie=0;
            if(!debut)return;
            const b=debut.bouton;
            const pid=debut.id;
            debut=null;
            REG.idleMenuClicAvaleJusquaV1=Date.now()+700;
            entrerRangementMenuIdleV1_();
            if(navigator.vibrate){try{navigator.vibrate(25);}catch(e){}}
            commencerGlisse(b,{pointerId:pid});
          },DELAI_MAINTIEN_MS);
        },true);

        document.addEventListener('pointermove',function(ev){
          if(debut&&(Math.abs(ev.clientX-debut.x)>10||Math.abs(ev.clientY-debut.y)>10))annulerMaintien();
          if(!glisse)return;
          ev.preventDefault();
          dernierY=ev.clientY;pointerX=ev.clientX;
          if(!boucleDefilement)boucleDefilement=requestAnimationFrame(defilerPendantGlisse);
          const nav=navMenuIdleV1_();
          if(!nav)return;
          const sous=document.elementFromPoint(ev.clientX,ev.clientY);
          const cible=boutonNav(sous);
          if(!cible||cible===glisse.bouton)return;
          const r=cible.getBoundingClientRect();
          /* Menu en colonne (interface PC) : on compare à la hauteur, pas à la largeur. */
          const verticalNav=getComputedStyle(nav).flexDirection==='column';
          const avant=verticalNav?ev.clientY<r.top+r.height/2:ev.clientX<r.left+r.width/2;
          nav.insertBefore(glisse.bouton,avant?cible:cible.nextSibling);
        },{passive:false});

        ['pointerup','pointercancel'].forEach(function(nom){
          document.addEventListener(nom,function(){
            annulerMaintien();
            terminerGlisse();
          },true);
        });

        /* L'appui long ne doit ouvrir ni le menu contextuel du navigateur ni une sélection de texte sur les boutons du menu. */
        document.addEventListener('contextmenu',function(ev){
          if(boutonNav(ev.target))ev.preventDefault();
        },true);
      }

      function naviguerSwipeIdleV1_(direction){
        if(!REG.idleEtat)return;
        const visibles=menusVisiblesIdleV1_(REG.idleEtat);
        if(visibles.length<2)return;
        const indexActuel=visibles.indexOf(REG.idleMenuActifV28);
        const base=indexActuel===-1?0:indexActuel;
        const suivant=(base+direction+visibles.length)%visibles.length;
        menuIdleV28_(visibles[suivant]);
      }

      function initialiserSwipeNavigationIdleV1_(){
        if(document.body.dataset.idleSwipeBoundV1==='1')return;
        document.body.dataset.idleSwipeBoundV1='1';

        document.addEventListener('touchstart',function(e){
          const cible=e.target&&e.target.closest&&e.target.closest('.soreal-idle-native-v4');
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-136 */
          const surBarreNav=e.target&&e.target.closest&&e.target.closest('.soreal-idle-nav-v28');
          const surInteractionInventaireV180=
            e.target&&
            e.target.closest&&
            e.target.closest(
              '.soreal-idle-v138-bag-card[data-item-id],'+
              '.soreal-idle-v138-slot[data-occupant-id],'+
              '.soreal-idle-item-popup-v1'
            );
          /* Un curseur de volume (ou tout champ de saisie) se glisse avec le doigt : ce geste n'est jamais un changement de page (Norman, 2026-10-07 : « quand on règle les barres de volume, ça nous fait swipe de page »). */
          const surChampGlisseV1=e.target&&e.target.closest&&e.target.closest('input,select,textarea,[role="slider"],[data-no-swipe],.bg-flaque-v1,.vl-flaque-v1');
          if(!cible||surBarreNav||surInteractionInventaireV180||surChampGlisseV1||!e.touches||e.touches.length!==1){
            idleSwipeDebutXV1=null;
            idleSwipeDebutYV1=null;
            return;
          }
          idleSwipeDebutXV1=e.touches[0].clientX;
          idleSwipeDebutYV1=e.touches[0].clientY;
        },{passive:true});

        document.addEventListener('touchend',function(e){
          if(idleSwipeDebutXV1==null)return;
          /* un geste de nettoyage (frotter la flaque du Coffre ou de la valise) vient d'avoir lieu : jamais un changement de page */
          if(Date.now()<(window.__SOREAL_IDLE_NETTOYAGE_JUSQUA_V1__||0)){idleSwipeDebutXV1=null;idleSwipeDebutYV1=null;return;}
          const fin=e.changedTouches&&e.changedTouches[0];
          const debutX=idleSwipeDebutXV1,debutY=idleSwipeDebutYV1;
          idleSwipeDebutXV1=null;
          idleSwipeDebutYV1=null;
          if(!fin)return;

          const dx=fin.clientX-debutX;
          const dy=fin.clientY-debutY;

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-137 */
          if(Math.abs(dx)<60||Math.abs(dx)<Math.abs(dy)*1.5)return;

          naviguerSwipeIdleV1_(dx<0?1:-1);
        },{passive:true});
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-156 */
      /*
       * Menus débloqués seulement (Norman, 2026-10-08 : « j'ai tué le boss 30 et la Machine temporelle n'est pas apparue, j'ai dû rafraîchir »). La synchro « sans redessin » du combat remplace l'état
       * par celui du serveur (qui contient le nouveau système débloqué) mais ne redessinait jamais le menu : on compare donc la liste des menus avant et après, et on redessine si elle a changé.
       */
      function empreinteMenusIdleV1_(j){
        if(!j)return '';
        const systemes=j.systemes&&Array.isArray(j.systemes.systems)?j.systemes.systems:[];
        return [
          systemes.filter(function(s){return s&&s.unlock&&s.unlock.unlocked;}).map(function(s){return String(s.id||'');}).sort().join(','),
          Boolean(j.inventaireDebloque),
          Boolean(j.aventure&&j.aventure.debloquee),
          Boolean(j.bestiaire&&j.bestiaire.debloquee),
          Boolean(j.renaissance&&j.renaissance.debloquee),
          Boolean(j.systemes&&j.systemes.selloutShop&&j.systemes.selloutShop.unlockedEver)
        ].join('|');
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-209 */
      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-210 */
      const IDLE_WALDERP_PANEL_LABELS_V147={
        combat:'⚔️ Fight Boss',
        entrainement:'🥊 Basic Training',
        inventaire:'🎒 Inventory',
        bestiaire:'📖 Bestiary',
        parametres:'⚙️ Settings'
      };

      function walderpCacheIdleV147_(j){
        const a=aventureMetaIdleV47_(j);
        const titans=a&&Array.isArray(a.titans)?a.titans:[];
        const walderp=titans.find(function(t){
          return t&&t.id==='t5'&&t.state&&t.state.hiddenPanel;
        });
        if(!walderp)return null;
        return String(walderp.state.hiddenPanel||'')||null;
      }

      function walderpBanniereIdleV147_(j){
        const panel=walderpCacheIdleV147_(j);
        if(!panel)return '';

        const ici=panel===REG.idleMenuActifV28;
        const nomPage=IDLE_WALDERP_PANEL_LABELS_V147[panel]||panel;

        return '<div class="soreal-idle-walderp-hide-v147'+(ici?' here':'')+'">'+
          (ici
            ?'👻 Walderp se cache ici ! <button type="button" class="soreal-idle-expand-button-v25" onclick="window.__trouverWalderpIdleV147__()">Le débusquer !</button>'
            :'👻 Walderp se cache quelque part… essaie : <b>'+idleHtml_(nomPage)+'</b>')+
        '</div>';
      }

      function systemeMetaParIdIdleV130_(j,id){
        const api=window.__SOREAL_IDLE_META_V130__;
        if(api&&typeof api.systemeMetaParIdIdleV130_==='function'){
          return api.systemeMetaParIdIdleV130_(j,id);
        }
        return null;
      }

      function pagePersonnageIdleV28_(j){
        return `
          ${entetePageIdleV28_(
            '👤 Personnage',
            'Statistiques générales et historique du personnage.'
          )}

          <div class="soreal-idle-character-v25">
            ${rendreProfilIdleV26_(j)}
            ${rendreSetsIdleV25_(j)}

            <div class="soreal-idle-danger-zone-v67">
              <div class="soreal-idle-danger-title-v67">
                ⚠️ Zone dangereuse
              </div>

              <div class="soreal-idle-danger-text-v67">
                Efface entièrement ce personnage et recommence SOREAL IDLE
                exactement comme lors de ta toute première connexion.
              </div>

              <button
                type="button"
                class="soreal-idle-danger-button-v67"
                onclick="window.__ouvrirPopupResetTotalIdleV67__()"
              >
                💣 Réinitialiser entièrement SOREAL IDLE
              </button>
            </div>
          </div>
        `;
      }

      function contenuMenuIdleV28_(j){
        switch(REG.idleMenuActifV28){
          case 'entrainement':
            return pageEntrainementIdleV28_(j);
          case 'parametres':
            return pageParametresIdleV28_(j);
          case 'admin':
            declarerTextesSystemesIdleV1_(j);
            return window.__SOREAL_IDLE_ADMIN_HISTOIRES_V1__?window.__SOREAL_IDLE_ADMIN_HISTOIRES_V1__.page(j):'';
          case 'chat':
            /* Emplacement du chat ; le module le monte juste après le rendu (il garde la saisie entre deux rendus). */
            if(window.__SOREAL_IDLE_CHAT_V1__&&typeof window.__SOREAL_IDLE_CHAT_V1__.pageHtml==='function'){
              Promise.resolve().then(function(){try{window.__SOREAL_IDLE_CHAT_V1__.apresRendu();}catch(_e){}});
              return entetePageIdleV28_('💬 Chat','Discute avec les autres joueurs de SOREAL IDLE et vois qui est en ligne.')+window.__SOREAL_IDLE_CHAT_V1__.pageHtml();
            }
            return '';
          case 'aventure':
            return pageAventureIdleV28_(j);
          case 'chroniques':
            return pageChroniquesIdleV1_(j);
          case 'bestiaire':
            return pageBestiaireIdleV110_(j);
          case 'boutique':
            return pageBoutiqueIdleV28_(j);
          case 'sellout':
            return pageSelloutShopIdleV1_(j);
          case 'shop':
            return pageShopIdleV1_(j);
          case 'classement':
            return pageClassementIdleV1_(j);
          case 'magie':
            return pageMagieIdleV90_(j);
          case 'renaissance':
            return pageRenaissanceIdleV28_(j);
          case 'augmentations':
            return pageSystemeMetaIdleV130_(j,'augmentations','Augmentations');
          case 'avance':
            return pageSystemeMetaIdleV130_(j,'advancedTraining','Entraînement avancé');
          case 'machine':
            return pageSystemeMetaIdleV130_(j,'timeMachine','Machine temporelle');
          case 'sang':
            return pageSystemeMetaIdleV130_(j,'bloodMagic','Magie du sang');
          case 'ngu':
            return pageSystemeMetaIdleV130_(j,'ngu','NGU');
          case 'wandoos':
            return pageSystemeMetaIdleV130_(j,'wandoos','Wandoos');
          case 'yggdrasil':
            return pageSystemeMetaIdleV130_(j,'yggdrasil','Yggdrasil');
          case 'moneyPit':
            return pageSystemeMetaIdleV130_(j,'moneyPit','Money Pit');
          case 'diggers':
            return pageSystemeMetaIdleV130_(j,'diggers','Gold Diggers');
          case 'beards':
            return pageSystemeMetaIdleV130_(j,'beards','Beards');
          case 'tower':
            return pageSystemeMetaIdleV130_(j,'tower','ITOPOD');
          case 'challenges':
            return pageSystemeMetaIdleV130_(j,'challenges','Challenges');
          case 'titans':
            /* Page Titans refaite (Norman, 2026-10-02) : cartes avec image, compte à rebours et combat en Aventure (modules/titans-v1.js). */
            return window.__SOREAL_IDLE_TITANS_V1__
              ?window.__SOREAL_IDLE_TITANS_V1__.page(j)
              :pageSystemeMetaIdleV130_(j,'titans','Titans');
          case 'macguffins':
            return pageSystemeMetaIdleV130_(j,'macguffins','MacGuffins');
          case 'setsZones':
            return pageCollectionIdleV22_(j);
          case 'spendExp':
            return pageSpendExpIdleV1_(j);
          case 'daycare':
            return pageSystemeMetaIdleV130_(j,'daycare','Item Daycare');
          case 'questing':
            return pageSystemeMetaIdleV130_(j,'questing','Questing');
          case 'quirks':
            return pageSystemeMetaIdleV130_(j,'quirks','Quirks');
          case 'hacks':
            return pageSystemeMetaIdleV130_(j,'hacks','Hacks');
          case 'wishes':
            return pageSystemeMetaIdleV130_(j,'wishes','Wishes');
          case 'cards':
            return pageSystemeMetaIdleV130_(j,'cards','Cards');
          case 'cooking':
            return pageSystemeMetaIdleV130_(j,'cooking','Cooking');
          case 'succes':
            return pageSystemeMetaIdleV130_(j,'achievements','Achievements');
          case 'personnage':
            return pagePersonnageIdleV28_(j);
          case 'combat':
          default:
            return pageCombatIdleV28_(j);
        }
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-314 */
      function jouerSonMenuIdleV1_(){
        if(typeof window.__jouerSonClicSorealV1__==='function'){
          window.__jouerSonClicSorealV1__();
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-315 */
        jouerEffetAudioIdleV199_('uiClick');
      }

      /*
       * Sur PC ET sur téléphone (Norman, 2026-10-15 : « sur téléphone aussi »), un clic sur un menu replace TOUJOURS la page ouverte en haut de la fenêtre : la bannière SOREAL IDLE est hors de l'écran et la barre Attaque / Défense / Or / EXP / AP est tout en haut
       * (Norman, 2026-10-15). Le haut de cette barre est le bas de la bannière ; plusieurs passes, car le rendu de la page et la remise en place du défilement peuvent annuler la première (sur téléphone, la barre des menus collée reste tout en haut, la barre de stats juste dessous).
       */
      function placerMenuEnHautPcIdleV1_(){
        const placer=function(){
          const banniere=document.querySelector('.soreal-idle-hero-banner-v95')||document.querySelector('.soreal-idle-hero-v4');
          if(!banniere)return;
          const cible=Math.max(0,Math.round(banniere.getBoundingClientRect().bottom+(window.scrollY||0)));
          window.scrollTo(0,cible);
        };
        placer();
        requestAnimationFrame(placer);
        [60,160,360].forEach(function(d){setTimeout(placer,d);});
        return true;
      }

  Object.assign(REG,{
    infoBandeauIdleV2_:infoBandeauIdleV2_,
    majHudPvIdleV2_:majHudPvIdleV2_,
    ancreClicIdleV1_:ancreClicIdleV1_,
    arreterPinClicIdleV1_:arreterPinClicIdleV1_,
    demarrerPinClicIdleV1_:demarrerPinClicIdleV1_,
    restaurerAncreClicIdleV1_:restaurerAncreClicIdleV1_,
    installerMorphIdleV1_:installerMorphIdleV1_,
    rafraichirMenuRacineIdleV28_:rafraichirMenuRacineIdleV28_,
    chargerMenuIdleV28_:chargerMenuIdleV28_,
    sauverMenuIdleV28_:sauverMenuIdleV28_,
    restaurerScrollNavIdleV28_:restaurerScrollNavIdleV28_,
    generationJoueurIdleV75_:generationJoueurIdleV75_,
    infoSystemeGeneriqueIdleV1_:infoSystemeGeneriqueIdleV1_,
    idleInfosParMenuIdleV1_:idleInfosParMenuIdleV1_,
    idleMenusAckListeLocaleV1_:idleMenusAckListeLocaleV1_,
    idleMenusAckListeV1_:idleMenusAckListeV1_,
    idleMenuEstAcquisV1_:idleMenuEstAcquisV1_,
    idleMenuMarquerAcquisV1_:idleMenuMarquerAcquisV1_,
    infoMoneyPitIdleV1_:infoMoneyPitIdleV1_,
    anciennesFenetresMenusPermisesIdleV1_:anciennesFenetresMenusPermisesIdleV1_,
    tutorielPagesNaviguerV1_:tutorielPagesNaviguerV1_,
    annoncerNouveauxMenusIdleV1_:annoncerNouveauxMenusIdleV1_,
    idleMenuAlimenteV1_:idleMenuAlimenteV1_,
    actualiserNavAlimenteIdleV1_:actualiserNavAlimenteIdleV1_,
    idleDisponibiliteMoneyPitV1_:idleDisponibiliteMoneyPitV1_,
    actualiserDisponibiliteMoneyPitNavIdleV1_:actualiserDisponibiliteMoneyPitNavIdleV1_,
    idleCouleurMoneyPitNavV1_:idleCouleurMoneyPitNavV1_,
    menusOrdonnesIdleV1_:menusOrdonnesIdleV1_,
    nomMenuIdleV1_:nomMenuIdleV1_,
    htmlNomMenuIdleV1_:htmlNomMenuIdleV1_,
    rangeesMenuIdleV1_:rangeesMenuIdleV1_,
    htmlBandeauRangementMenuIdleV1_:htmlBandeauRangementMenuIdleV1_,
    validerRangementMenuIdleV1_:validerRangementMenuIdleV1_,
    installerRangementMenuIdleV1_:installerRangementMenuIdleV1_,
    initialiserSwipeNavigationIdleV1_:initialiserSwipeNavigationIdleV1_,
    empreinteMenusIdleV1_:empreinteMenusIdleV1_,
    walderpBanniereIdleV147_:walderpBanniereIdleV147_,
    systemeMetaParIdIdleV130_:systemeMetaParIdIdleV130_,
    contenuMenuIdleV28_:contenuMenuIdleV28_,
    jouerSonMenuIdleV1_:jouerSonMenuIdleV1_,
    placerMenuEnHautPcIdleV1_:placerMenuEnHautPcIdleV1_
  });
})();
