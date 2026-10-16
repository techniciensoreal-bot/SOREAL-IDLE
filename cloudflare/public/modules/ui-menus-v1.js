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
  function ancreClicIdleV1_(){return REG.ancreClicIdleV1_.apply(null,arguments);}
  function ancreSacIdleV1_(){return REG.ancreSacIdleV1_.apply(null,arguments);}
  function installerMorphIdleV1_(){return REG.installerMorphIdleV1_.apply(null,arguments);}
  function restaurerAncreClicIdleV1_(){return REG.restaurerAncreClicIdleV1_.apply(null,arguments);}
  function restaurerAncreSacIdleV1_(){return REG.restaurerAncreSacIdleV1_.apply(null,arguments);}
  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function menuSuccesVisibleIdleV1_(){return REG.menuSuccesVisibleIdleV1_.apply(null,arguments);}
  function definitionsNouveautesIdleV75_(){return REG.definitionsNouveautesIdleV75_.apply(null,arguments);}
  function infoMoneyPitIdleV1_(){return REG.infoMoneyPitIdleV1_.apply(null,arguments);}
  function infoSystemeGeneriqueIdleV1_(){return REG.infoSystemeGeneriqueIdleV1_.apply(null,arguments);}
  function generationJoueurIdleV75_(){return REG.generationJoueurIdleV75_.apply(null,arguments);}
  function idleVusServeurV1_(){return REG.idleVusServeurV1_.apply(null,arguments);}
  function idleVuMarquerV1_(){return REG.idleVuMarquerV1_.apply(null,arguments);}
  function rendreTutorielPagesIdleV1_(){return REG.rendreTutorielPagesIdleV1_.apply(null,arguments);}
  function menuDisponibleIdleV28_(){return REG.menuDisponibleIdleV28_.apply(null,arguments);}
  function idleVuConnuV1_(){return REG.idleVuConnuV1_.apply(null,arguments);}
  function jouerEffetAudioIdleV199_(){return REG.jouerEffetAudioIdleV199_.apply(null,arguments);}
  function aventureMetaIdleV47_(){return REG.aventureMetaIdleV47_.apply(null,arguments);}
  function heureServeurIdleV1_(){return REG.heureServeurIdleV1_.apply(null,arguments);}
  function idleDisponibiliteMoneyPitV1_(){return REG.idleDisponibiliteMoneyPitV1_.apply(null,arguments);}
  function systemeMetaParIdIdleV130_(){return REG.systemeMetaParIdIdleV130_.apply(null,arguments);}
  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function menusOrdonnesIdleV1_(){return REG.menusOrdonnesIdleV1_.apply(null,arguments);}
  function menuIdleV28_(){return REG.menuIdleV28_.apply(null,arguments);}
  function pageEntrainementIdleV28_(){return REG.pageEntrainementIdleV28_.apply(null,arguments);}
  function pageParametresIdleV28_(){return REG.pageParametresIdleV28_.apply(null,arguments);}
  function entetePageIdleV28_(){return REG.entetePageIdleV28_.apply(null,arguments);}
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
  function pagePersonnageIdleV28_(){return REG.pagePersonnageIdleV28_.apply(null,arguments);}
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
        bar.style.width=pct.toFixed(2)+'%';
        const t=document.getElementById('sorealIdleHudPvTexteV2');
        const texte=window.__SOREAL_IDLE_TEXTE_PV_V2__(pv,max);
        if(t&&t.textContent!==texte)t.textContent=texte;
        const d=document.getElementById('sorealIdleHudDPvV2');
        const tr=window.__SOREAL_IDLE_TEXTE_REGEN_PV_V2__(regen);
        if(d&&d.textContent!==tr)d.textContent=tr;
        const panneau=document.getElementById('sorealIdleHudPvV2');
        if(panneau)panneau.classList.toggle('bas',pct<=25);
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

      function idleMenuOrdreCleV1_(j){
        return 'soreal_idle_menu_ordre_v3_'+generationJoueurIdleV75_(j);
      }

      function idleMenuOrdreEnregistreV1_(j){
        const serveur=j&&j.profil&&j.profil.stats&&Array.isArray(j.profil.stats.menuOrdre)?j.profil.stats.menuOrdre:null;
        if(serveur&&serveur.length)return serveur;
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
        if(!nav)return REG.idleMenuOrdreTravailV1||[];
        const visibles=Array.prototype.map.call(nav.querySelectorAll('[data-menu-id-v1]'),function(b){
          return b.getAttribute('data-menu-id-v1');
        });
        const autres=(REG.idleMenuOrdreTravailV1||[]).filter(function(id){return visibles.indexOf(id)===-1;});
        return visibles.concat(autres);
      }

      function entrerRangementMenuIdleV1_(){
        if(REG.idleMenuEditionV1||!REG.idleEtat)return;
        REG.idleMenuEditionV1=true;
        REG.idleMenuOrdreTravailV1=menusOrdonnesIdleV1_(REG.idleEtat).map(function(m){return m.id;});
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
        REG.idleMenuOrdreTravailV1=null;
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
        function terminerGlisse(){
          if(!glisse)return;
          glisse.bouton.classList.remove('glisse');
          try{glisse.bouton.releasePointerCapture(glisse.id);}catch(e){}
          glisse=null;
          REG.idleMenuOrdreTravailV1=ordreDepuisNavIdleV1_();
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
          const surChampGlisseV1=e.target&&e.target.closest&&e.target.closest('input,select,textarea,[role="slider"],[data-no-swipe]');
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
    rafraichirMenuRacineIdleV28_:rafraichirMenuRacineIdleV28_,
    chargerMenuIdleV28_:chargerMenuIdleV28_,
    sauverMenuIdleV28_:sauverMenuIdleV28_,
    restaurerScrollNavIdleV28_:restaurerScrollNavIdleV28_,
    idleInfosParMenuIdleV1_:idleInfosParMenuIdleV1_,
    idleMenusAckListeLocaleV1_:idleMenusAckListeLocaleV1_,
    idleMenusAckListeV1_:idleMenusAckListeV1_,
    idleMenuEstAcquisV1_:idleMenuEstAcquisV1_,
    idleMenuMarquerAcquisV1_:idleMenuMarquerAcquisV1_,
    anciennesFenetresMenusPermisesIdleV1_:anciennesFenetresMenusPermisesIdleV1_,
    tutorielPagesNaviguerV1_:tutorielPagesNaviguerV1_,
    annoncerNouveauxMenusIdleV1_:annoncerNouveauxMenusIdleV1_,
    idleMenuAlimenteV1_:idleMenuAlimenteV1_,
    actualiserNavAlimenteIdleV1_:actualiserNavAlimenteIdleV1_,
    actualiserDisponibiliteMoneyPitNavIdleV1_:actualiserDisponibiliteMoneyPitNavIdleV1_,
    idleCouleurMoneyPitNavV1_:idleCouleurMoneyPitNavV1_,
    idleMenuOrdreEnregistreV1_:idleMenuOrdreEnregistreV1_,
    ordonnerMenusIdleV1_:ordonnerMenusIdleV1_,
    nomMenuIdleV1_:nomMenuIdleV1_,
    htmlNomMenuIdleV1_:htmlNomMenuIdleV1_,
    rangeesMenuIdleV1_:rangeesMenuIdleV1_,
    htmlBandeauRangementMenuIdleV1_:htmlBandeauRangementMenuIdleV1_,
    validerRangementMenuIdleV1_:validerRangementMenuIdleV1_,
    installerRangementMenuIdleV1_:installerRangementMenuIdleV1_,
    initialiserSwipeNavigationIdleV1_:initialiserSwipeNavigationIdleV1_,
    empreinteMenusIdleV1_:empreinteMenusIdleV1_,
    walderpBanniereIdleV147_:walderpBanniereIdleV147_,
    contenuMenuIdleV28_:contenuMenuIdleV28_,
    jouerSonMenuIdleV1_:jouerSonMenuIdleV1_,
    placerMenuEnHautPcIdleV1_:placerMenuEnHautPcIdleV1_
  });
})();
