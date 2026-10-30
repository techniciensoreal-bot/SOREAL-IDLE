/*
 * SOREAL IDLE — Navigation et ordre des menus (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_navigation_v1)return;
  REG.__chargé_ui_navigation_v1=true;

  function idleNombre_(){return REG.idleNombre_.apply(null,arguments);}
  function chroniquesOngletsIdleV1_(){return REG.chroniquesOngletsIdleV1_.apply(null,arguments);}
  function estAdminSorealIdle_(){return REG.estAdminSorealIdle_.apply(null,arguments);}
  function menuSuccesVisibleIdleV1_(){return REG.menuSuccesVisibleIdleV1_.apply(null,arguments);}
  function pauseVoixIdleV1_(){return REG.pauseVoixIdleV1_.apply(null,arguments);}
  function achatsApParCategorieIdleV1_(){return REG.achatsApParCategorieIdleV1_.apply(null,arguments);}
  function menusOrdonnesIdleV1_(){return REG.menusOrdonnesIdleV1_.apply(null,arguments);}
  function rangeesMenuIdleV1_(){return REG.rangeesMenuIdleV1_.apply(null,arguments);}
  function htmlBandeauRangementMenuIdleV1_(){return REG.htmlBandeauRangementMenuIdleV1_.apply(null,arguments);}
  function idleMenuEstAcquisV1_(){return REG.idleMenuEstAcquisV1_.apply(null,arguments);}
  function idleCouleurMoneyPitNavV1_(){return REG.idleCouleurMoneyPitNavV1_.apply(null,arguments);}
  function idleDisponibiliteMoneyPitV1_(){return REG.idleDisponibiliteMoneyPitV1_.apply(null,arguments);}
  function aventureMetaIdleV47_(){return REG.aventureMetaIdleV47_.apply(null,arguments);}
  function idleMenuAlimenteV1_(){return REG.idleMenuAlimenteV1_.apply(null,arguments);}
  function idleMenuTravailleV1_(){return REG.idleMenuTravailleV1_.apply(null,arguments);}
  function couleurBoutonShopIdleV1_(){return REG.couleurBoutonShopIdleV1_.apply(null,arguments);}
  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function nomMenuIdleV1_(){return REG.nomMenuIdleV1_.apply(null,arguments);}
  function htmlNomMenuIdleV1_(){return REG.htmlNomMenuIdleV1_.apply(null,arguments);}
  function aventureDebloqueeIdleV47_(){return REG.aventureDebloqueeIdleV47_.apply(null,arguments);}
  function placerMenuEnHautPcIdleV1_(){return REG.placerMenuEnHautPcIdleV1_.apply(null,arguments);}
  function jouerSonMenuIdleV1_(){return REG.jouerSonMenuIdleV1_.apply(null,arguments);}
  function idleMenuMarquerAcquisV1_(){return REG.idleMenuMarquerAcquisV1_.apply(null,arguments);}
  function arreterCombatTitanIdleV1_(){return REG.arreterCombatTitanIdleV1_.apply(null,arguments);}
  function demarrerTutorielPagesIdleV1_(){return REG.demarrerTutorielPagesIdleV1_.apply(null,arguments);}
  function generationJoueurIdleV75_(){return REG.generationJoueurIdleV75_.apply(null,arguments);}
  function idleInfosParMenuIdleV1_(){return REG.idleInfosParMenuIdleV1_.apply(null,arguments);}
  function anciennesFenetresMenusPermisesIdleV1_(){return REG.anciennesFenetresMenusPermisesIdleV1_.apply(null,arguments);}
  function afficherProchainePopupIdleV75_(){return REG.afficherProchainePopupIdleV75_.apply(null,arguments);}
  function annulerTimerCombatAutoIdleV30_(){return REG.annulerTimerCombatAutoIdleV30_.apply(null,arguments);}
  function sauverCombatAutoIdleV30_(){return REG.sauverCombatAutoIdleV30_.apply(null,arguments);}
  function ajouterActionRapideIdleV60_(){return REG.ajouterActionRapideIdleV60_.apply(null,arguments);}
  function sauverMenuIdleV28_(){return REG.sauverMenuIdleV28_.apply(null,arguments);}
  function rendreIdleEtat_(){return REG.rendreIdleEtat_.apply(null,arguments);}

      function menuDisponibleIdleV28_(
        id,
        j
      ){
        if(!j)return false;

        if(
          id==='entrainement' ||
          id==='combat' ||
          id==='parametres'
        ){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-112 */
          return true;
        }

        if(id==='spendExp'){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-113 */
          return Boolean(
            j.systemes&&
            j.systemes.records&&
            idleNombre_(j.systemes.records.highestBoss)>=1
          );
        }

        if(id==='setsZones')return false;

        /* Chroniques (Norman, 2026-10-08) : Collection, Classement et Succès sont réunis dans UN seul menu ; les trois anciens boutons n'existent plus. */
        if(id==='bestiaire'||id==='classement'||id==='succes')return false;
        if(id==='chroniques')return chroniquesOngletsIdleV1_(j).length>0;

        /* Titans : fusionnés avec Adventure, plus de bouton de menu. */
        if(id==='titans')return false;

        /* Garderie d'objets : ses emplacements vivent dans le Coffre (Norman, 2026-10-30), plus de bouton de menu. */
        if(id==='daycare')return false;

        /* Admin : jamais visible d'un autre joueur (le serveur refuse de toute façon chaque opération d'administration). */
        if(id==='admin')return estAdminSorealIdle_();

        /* Chat : présent seulement si SOREAL IDLE est ouvert dans APP/TV (la page parente répond) — sinon aucun bouton. */
        if(id==='chat'){
          return Boolean(window.__SOREAL_IDLE_CHAT_V1__&&window.__SOREAL_IDLE_CHAT_V1__.disponible());
        }

        /* Shop : présent dès que l'un des deux magasins l'est (EXP Shop dès le premier boss, Boutique AP une fois débloquée). */
        if(id==='shop'){
          return menuDisponibleIdleV28_('spendExp',j)||menuDisponibleIdleV28_('sellout',j);
        }

        /* Classement : verrou fourni par le serveur (provisoire : administrateur ; il passera à un trophée TV/APP). */
        if(id==='classement'){
          return Boolean(j.classement&&j.classement.debloque);
        }

        if(id==='sellout'){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-114 */
          return Boolean(
            j.systemes&&
            j.systemes.selloutShop&&
            j.systemes.selloutShop.unlockedEver
          );
        }

        if(id==='aventure'){
          return Boolean(j.aventure&&j.aventure.debloquee);
        }

        /* 2026-09-24 : plus de menu « Inventory » — son contenu est sous Adventure (pageAventureIdleV28_). */
        if(id==='inventaire')return false;

        if(id==='bestiaire'){
          return Boolean(j.bestiaire&&j.bestiaire.debloquee);
        }

        if(id==='renaissance'){
          return Boolean(j.renaissance&&j.renaissance.debloquee);
        }

        /* Achievements (Norman, 2026-09-26) : le menu n'apparaît qu'au premier succès débloqué. */
        if(id==='succes'&&!menuSuccesVisibleIdleV1_(j))return false;

        const systemeId=REG.IDLE_SYSTEME_PAR_MENU_V1[id];
        if(!systemeId)return false;

        const liste=
          j.systemes&&Array.isArray(j.systemes.systems)
            ?j.systemes.systems
            :[];

        const systeme=liste.find(function(x){
          return x&&x.id===systemeId;
        });

        return Boolean(
          systeme&&systeme.unlock&&systeme.unlock.unlocked
        );
      }

      /*
       * Textes éditables (Norman, 2026-10-02 : popups et fenêtres explicatives modifiables par l'administrateur, avec voix différentes) : chaque popup
       * « nouveauté » passe par ici ; sans modification il est rendu tel quel, avec en plus sa clé (_cle) pour le bouton « Modifier » de l'administrateur.
       */
      const NOUVEAUTE_CHAMPS_TEXTES_V1=[
        {id:'titre',label:'Titre',type:'ligne'},
        {id:'intro',label:'Introduction',type:'texte'},
        {id:'texte',label:'Texte',type:'texte'},
        {id:'bullets',label:'Points (un par paragraphe)',type:'liste'}
      ];

      function infoSurchargeeIdleV1_(cle,libelle,infoBrute){
        const T=window.__SOREAL_IDLE_TEXTES_V1__;
        if(!T||!infoBrute)return infoBrute;
        T.declarer(cle,{
          groupe:'Popups de nouveautés',
          libelle:libelle||String(infoBrute.titre||cle),
          champs:NOUVEAUTE_CHAMPS_TEXTES_V1,
          original:function(){
            return {titre:String(infoBrute.titre||''),intro:String(infoBrute.intro||''),texte:String(infoBrute.texte||''),bullets:Array.isArray(infoBrute.bullets)?infoBrute.bullets.slice():[]};
          },
          texteLu:function(v){return texteVoixNouveauteIdleV1_(v);}
        });
        return T.appliquerInfo(cle,infoBrute);
      }

      function definitionsNouveautesIdleV75_(){
        const brutes=definitionsNouveautesBrutesIdleV75_();
        const out={};
        Object.keys(brutes).forEach(function(cle){
          out[cle]=infoSurchargeeIdleV1_('nouveaute:'+cle,String(brutes[cle]&&brutes[cle].titre||cle),brutes[cle]);
        });
        return out;
      }

      function definitionsNouveautesBrutesIdleV75_(){
        return {
          bestiaire:{
            icon:'📖',
            titre:'Bestiaire débloqué',
            intro:'Le Bestiaire est ton carnet de rencontres : chaque créature que tu croises s’y inscrit toute seule, comme un album d’autocollants qui se remplit.',
            menuCible:'chroniques',
            libelleCible:'Aller aux chroniques',
            bullets:[
              'Une créature reste inconnue tant que tu ne l’as jamais rencontrée : impossible de coller ce que tu n’as pas trouvé.',
              'Boss principaux et créatures d’Aventure partagent le même registre.',
              'Certaines entrées sont beaucoup plus difficiles à découvrir que les autres : les plus rares font la fierté des collectionneurs.'
            ]
          },
          combat_auto:{
            icon:'🤖',
            titre:'Aventure AUTO débloquée',
            intro:'Tu peux automatiser les expéditions : le jeu se bat à ta place pendant que tu bois ton café.',
            menuCible:'aventure',
            libelleCible:'Aller à l’aventure',
            bullets:[
              'Choisis une zone puis active AUTO : ton héros part en balade tout seul.',
              'L’énergie continue d’être consommée pour chaque combat : le pilote automatique n’est pas gratuit.'
            ]
          },
          renaissance:{
            icon:'♻️',
            titre:'Renaissance débloquée',
            intro:'La Renaissance, c’est le bouton « on recommence, mais en mieux » : tu repars de zéro avec un nombre plus gros.',
            menuCible:'renaissance',
            libelleCible:'Aller à la Renaissance',
            bullets:[
              'Une Renaissance sacrifie une partie de ta progression : on fait de la place dans le placard.',
              'En échange, ton NOMBRE grandit : il multiplie ton Attaque et ta Défense et accélère les cycles suivants.'
            ]

          }
        };
      }

      function texteVoixNouveauteIdleV1_(info){
        /* Texte modifié par l'administrateur : _brut garde les balises de voix. */
        info=(info&&info._brut)||info;
        return String(info&&info.titre||'')+pauseVoixIdleV1_(450)+
          [String(info&&info.intro||''),String(info&&info.texte||'')]
            .concat(Array.isArray(info&&info.bullets)?info.bullets:[])
            .filter(function(t){return String(t).trim();})
            .join(' ');
      }

      const IDLE_NAV_FORMES_V1={
        cercle:'circle(50% at 50% 50%)',
        hexagone:'polygon(25% 4%,75% 4%,100% 50%,75% 96%,25% 96%,0 50%)',
        bouclier:'polygon(0 6%,50% 0,100% 6%,100% 58%,50% 100%,0 58%)',
        losange:'polygon(50% 0,100% 50%,50% 100%,0 50%)',
        octogone:'polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)',
        etoile:'polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
        goutte:'polygon(50% 0,78% 34%,94% 62%,86% 88%,50% 100%,14% 88%,6% 62%,22% 34%)',
        triangle:'polygon(50% 2%,100% 96%,0 96%)',
        etiquette:'polygon(0 18%,18% 0,100% 0,100% 82%,82% 100%,0 100%)',
        bulle:'polygon(0 0,100% 0,100% 74%,62% 74%,38% 100%,38% 74%,0 74%)',
        carte:'inset(0 round 28%)',
        pentagone:'polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%)',
        chevron:'polygon(0 0,70% 0,100% 50%,70% 100%,0 100%,30% 50%)',
        engrenage:'polygon(40% 0,60% 0,66% 14%,82% 10%,90% 22%,86% 36%,100% 40%,100% 60%,86% 64%,90% 78%,82% 90%,66% 86%,60% 100%,40% 100%,34% 86%,18% 90%,10% 78%,14% 64%,0 60%,0 40%,14% 36%,10% 22%,18% 10%,34% 14%)'
      };

      const IDLE_NAV_IDENTITES_V1={
        entrainement:{forme:'hexagone',verbe:'S’entraîner'},
        augmentations:{forme:'losange',verbe:'Renforcer'},
        combat:{forme:'bouclier',verbe:'Combattre'},
        aventure:{forme:'pentagone',verbe:'Explorer'},
        moneyPit:{forme:'cercle',verbe:'Jeter de l’Or'},
        renaissance:{forme:'octogone',verbe:'Renaître'},
        avance:{forme:'hexagone',verbe:'Perfectionner'},
        machine:{forme:'engrenage',verbe:'Produire de l’Or'},
        sang:{forme:'goutte',verbe:'Lancer des sorts'},
        wandoos:{forme:'carte',verbe:'Booster'},
        ngu:{forme:'losange',verbe:'Améliorer'},
        yggdrasil:{forme:'pentagone',verbe:'Récolter'},
        diggers:{forme:'hexagone',verbe:'Creuser'},
        beards:{forme:'bouclier',verbe:'Cultiver'},
        tower:{forme:'triangle',verbe:'Grimper'},
        perks:{forme:'etoile',verbe:'Acheter des bonus'},
        challenges:{forme:'chevron',verbe:'Relever des défis'},
        titans:{forme:'octogone',verbe:'Affronter'},
        macguffins:{forme:'pentagone',verbe:'Collecter'},
        daycare:{forme:'carte',verbe:'Faire monter'},
        questing:{forme:'etiquette',verbe:'Quêtes'},
        quirks:{forme:'losange',verbe:'Bonus'},
        hacks:{forme:'octogone',verbe:'Pirater'},
        wishes:{forme:'etoile',verbe:'Faire un vœu'},
        cards:{forme:'carte',verbe:'Collectionner'},
        cooking:{forme:'cercle',verbe:'Cuisiner'},
        chroniques:{forme:'hexagone',verbe:'Parcourir'},
        shop:{forme:'etoile',verbe:'Boutique magique'},
        chat:{forme:'bulle',verbe:'Discuter'},
        parametres:{forme:'engrenage',verbe:'Régler'},
        admin:{forme:'triangle',verbe:'Gérer'}
      };

      /* Y a-t-il des achats que le joueur n'a pas encore vus dans l'une des deux boutiques ? Hors de la boutique, on oublie aussi les points de la visite précédente. */
      function boutiqueNouveautesIdleV1_(j){
        const B=window.__SOREAL_IDLE_BOUTIQUE_V1__;
        if(!B||!j)return false;
        try{
          let neuf=false;
          if(menuDisponibleIdleV28_('spendExp',j)&&typeof window.__SOREAL_IDLE_EXP_ACHATS_V1__==='function')neuf=B.boutiqueNonVue('exp',window.__SOREAL_IDLE_EXP_ACHATS_V1__(j));
          if(menuDisponibleIdleV28_('sellout',j))neuf=B.boutiqueNonVue('ap',achatsApParCategorieIdleV1_(j))||neuf;
          return neuf;
        }catch(e){return false;}
      }

      function navigationIdleV28_(j){
        if(REG.idleMenuActifV28!=='shop'&&window.__SOREAL_IDLE_BOUTIQUE_V1__)window.__SOREAL_IDLE_BOUTIQUE_V1__.reinitialiserVisite();
        const menus=menusOrdonnesIdleV1_(j);

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-134 */
        const menusVisibles=menus.filter(function(m){
          return menuDisponibleIdleV28_(m.id,j);
        });

        return `
          <div class="soreal-idle-nav-v28${REG.idleMenuEditionV1?' edition':''}" style="--nav-lignes:${Math.max(1,Math.ceil(menusVisibles.length/2))};--nav-rangees:${rangeesMenuIdleV1_()}">
            ${REG.idleMenuEditionV1?htmlBandeauRangementMenuIdleV1_():''}
            ${menusVisibles.map(function(m){

              const nouveau=!idleMenuEstAcquisV1_(j,m.id);
              const couleurDisponibilite=m.id==='moneyPit'?idleCouleurMoneyPitNavV1_(j):null;
              const classeAlerteAventure=
                m.id==='aventure'&&REG.idleAdventureKoAlertV1&&REG.idleMenuActifV28!=='aventure'
                  ?' soreal-idle-nav-adventure-ko-v1':'';
              const dispoMoneyPit=m.id==='moneyPit'?idleDisponibiliteMoneyPitV1_(j):null;
              if(m.id==='moneyPit')REG.idleDispoMoneyPitDerniereV1=dispoMoneyPit||'';
              const classeMoneyPit=
                dispoMoneyPit
                  ?' '+REG.IDLE_DISPO_MONEY_PIT_V1[dispoMoneyPit].classe+' soreal-idle-nav-dispo-v1'
                  :'';
              /* Yggdrasil Harvest Light (Sellout Shop) : même lueur verte que le Money Pit quand un fruit est prêt (serveur : yggExtra.harvestLight.lit). */
              const yggExtraNav=j&&j.systemes&&j.systemes.yggExtra;
              const classeRecolteYgg=
                m.id==='yggdrasil'&&yggExtraNav&&yggExtraNav.harvestLight&&yggExtraNav.harvestLight.lit
                  ?' soreal-idle-nav-money-green-v1':'';
              /* Adventure Light (Boutique AP, wiki : « The Adventure button will light up when in a safe zone ») : même lueur verte que le Money Pit tant qu'on est en Zone sûre (Norman, 2026-10-12). */
              const catalogueAp=j&&j.systemes&&j.systemes.selloutShop&&Array.isArray(j.systemes.selloutShop.catalog)?j.systemes.selloutShop.catalog:[];
              const lumiereAventure=m.id==='aventure'&&catalogueAp.some(function(it){return it&&it.id==='adventureLight'&&idleNombre_(it.purchased)>0;});
              const metaAv=lumiereAventure?aventureMetaIdleV47_(j):null;
              const classeLumiereAventure=lumiereAventure&&metaAv&&String(metaAv.selectedZone||'safe')==='safe'&&!(metaAv.fight&&metaAv.fight.active)&&REG.idleMenuActifV28!=='aventure'?' soreal-idle-nav-money-green-v1':'';
              /* Boutique : l'étoile ne scintille que dans la boutique ou quand elle a du nouveau, signalé d'un point rouge (Norman, 2026-10-04). */
              /* Renaissance en positif (Norman, 2026-10-17) : possible ET le nombre après renaissance dépasse l'actuel -> des lueurs dorées montent dans le bouton (voir soreal-idle-itopod.css). */
              const rbNav=m.id==='renaissance'&&j&&j.renaissance&&j.renaissance.debloquee?j.renaissance:null;
              const classeRenaissancePositif=rbNav&&idleNombre_(rbNav.nextNumber)>idleNombre_(rbNav.number)*1.0000001?' renaissance-positif-v1':'';
              const nouveautesShop=m.id==='shop'?boutiqueNouveautesIdleV1_(j):false;
              const classeShopNouveau=nouveautesShop?' soreal-idle-nav-shop-nouveau-v1':'';

              return `
                <button
                  type="button"
                  class="soreal-idle-nav-button-v28${
                    REG.idleMenuActifV28===m.id
                      ?' active'
                      :''
                  }${
                    nouveau
                      ?' soreal-idle-nav-new-v1'
                      :''
                  }${classeAlerteAventure}${classeMoneyPit}${classeRenaissancePositif}${classeRecolteYgg}${classeLumiereAventure}${classeShopNouveau}${idleMenuTravailleV1_(m.id,j)?' travail-v1':''}"
                  style="--nav-color:${
                    couleurDisponibilite||(m.id==='shop'?couleurBoutonShopIdleV1_():REG.IDLE_NAV_COULEURS_V1[m.id])||'#9aa5bb'
                  };--forme:${IDLE_NAV_FORMES_V1[(IDLE_NAV_IDENTITES_V1[m.id]||{}).forme]||IDLE_NAV_FORMES_V1.carte}"
                  data-menu-id-v1="${m.id}"
                  data-effet-v1="${m.id}"
                  title="${idleHtml_(nomMenuIdleV1_(m,j)+((IDLE_NAV_IDENTITES_V1[m.id]||{}).verbe?' — '+IDLE_NAV_IDENTITES_V1[m.id].verbe:''))}"
                  onclick="window.__menuIdleV28__('${m.id}')"
                >
                  <span class="soreal-idle-nav-deco-v1" aria-hidden="true"><i class="nb-g"></i><i class="nb-d"></i></span>
                  <span class="soreal-idle-nav-cadre-v2"><span class="soreal-idle-nav-badge-v2"><i class="soreal-idle-nav-emoji-v2"></i></span></span>
                  ${classeRenaissancePositif?ETOILES_BOUTON_RENAISSANCE_V1:''}
                  <span class="soreal-idle-nav-texte-v2"><b>${htmlNomMenuIdleV1_(m,j)}${m.id==='chat'&&window.__SOREAL_IDLE_CHAT_V1__?window.__SOREAL_IDLE_CHAT_V1__.badgeHtml():''}</b><small>${idleHtml_((IDLE_NAV_IDENTITES_V1[m.id]||{}).verbe||'')}</small></span>${nouveautesShop?window.__SOREAL_IDLE_BOUTIQUE_V1__.point('Nouveautés dans la boutique'):''}
                </button>
              `;
            }).join('')}
          </div>
        `;
      }

      /*
       * Bouton Aventure (Norman, 2026-10-15) : « peu importe dans quel menu on se trouve, un premier appui sur Aventure nous emmène sur l'onglet Aventure, avec l'écran entièrement remonté ; un double clic ou double tap nous
       * emmène toujours dans Titans (sauf s'il n'est pas encore débloqué) ». Le premier appui agit tout de suite (aucune attente pour deviner un double appui) ; un second appui dans les 0,42 s qui suivent ouvre en plus Titans.
       */
      let idleAventureDernierAppuiV1=0;

      function titansDebloquesIdleV1_(){
        const a=REG.idleEtat?aventureMetaIdleV47_(REG.idleEtat):null;
        return Boolean(a&&aventureDebloqueeIdleV47_(REG.idleEtat)&&(Array.isArray(a.titans)?a.titans:[]).some(function(t){return t&&t.progressionUnlocked!==false;}));
      }

      function remonterToutEnHautIdleV1_(){
        const haut=function(){window.scrollTo(0,0);if(document.documentElement)document.documentElement.scrollTop=0;if(document.body)document.body.scrollTop=0;};
        haut();
        requestAnimationFrame(haut);
        setTimeout(haut,150);
      }

      /* Étoiles du bouton Renaissance du menu (Norman, 2026-10-19 : « je ne veux plus les points jaunes qui remontent, je veux des étoilettes qui scintillent partout sur le cadre mauve »). Quatorze petites étoiles à quatre branches, chacune à sa place, sa taille, sa durée et son retard : elles scintillent sur place, jamais en groupe. Le calque fait partie du gabarit du bouton : un redessin ne le remplace pas. */
      const ETOILES_BOUTON_RENAISSANCE_V1='<span class="nav-etoiles-v1" aria-hidden="true"><i style="left:6%;top:18%;--s:7px;--t:2.6s;--d:0s"></i><i style="left:18%;top:80%;--s:6px;--t:3.1s;--d:0.4s"></i><i style="left:30%;top:12%;--s:8px;--t:3.4s;--d:1.1s"></i><i style="left:44%;top:86%;--s:7px;--t:2.8s;--d:0.7s"></i><i style="left:58%;top:14%;--s:6px;--t:3.7s;--d:1.6s"></i><i style="left:70%;top:82%;--s:8px;--t:2.9s;--d:0.2s"></i><i style="left:84%;top:12%;--s:7px;--t:3.3s;--d:1s"></i><i style="left:94%;top:68%;--s:6px;--t:2.7s;--d:0.5s"></i><i style="left:10%;top:50%;--s:5px;--t:3.6s;--d:1.4s"></i><i style="left:50%;top:48%;--s:5px;--t:3s;--d:2s"></i><i style="left:78%;top:46%;--s:6px;--t:3.5s;--d:0.9s"></i><i style="left:26%;top:44%;--s:5px;--t:2.9s;--d:1.8s"></i><i style="left:91%;top:32%;--s:5px;--t:3.2s;--d:0.1s"></i><i style="left:38%;top:64%;--s:5px;--t:3.8s;--d:2.4s"></i></span>';

      function menuIdleV28_(menu){
        if(REG.idleMenuEditionV1||Date.now()<REG.idleMenuClicAvaleJusquaV1){menuIdleCoeurV28_(menu);return;}
        if(menu!=='aventure'){menuIdleCoeurV28_(menu);placerMenuEnHautPcIdleV1_();return;}
        const maintenant=Date.now();
        const doubleAppui=maintenant-idleAventureDernierAppuiV1<420;
        idleAventureDernierAppuiV1=doubleAppui?0:maintenant;
        /* Un simple appui ramène TOUJOURS aux zones, même si l'onglet Titans était mémorisé quand on a quitté Aventure (Norman, 2026-10-15). */
        if(REG.idleVueAventureV1==='titans'&&REG.idleMenuActifV28!=='aventure'){
          REG.idleVueAventureV1='zones';
          document.documentElement.setAttribute('data-vue-aventure','zones');
        }
        menuIdleCoeurV28_(menu);
        if(REG.idleMenuActifV28!=='aventure')return;
        if(doubleAppui&&titansDebloquesIdleV1_()&&REG.idleVueAventureV1!=='titans')window.__vueAventureIdleV1__('titans');
        if(!placerMenuEnHautPcIdleV1_())remonterToutEnHautIdleV1_();
      }

      /*
       * Panneaux d'informations repliables des menus (« 💡 À quoi ça sert ? », « Que faire ici ? », résumé des NGU, encart Infos des Réglages) : toujours FERMÉS à l'arrivée dans un menu et refermés quand on change de menu
       * (Norman, 2026-10-15). Un panneau ouvert le reste seulement tant qu'on reste dans le menu (la synchro redessine la page) ; on ne retient plus rien d'une visite à l'autre.
       */
      function fermerPanneauxInfoIdleV1_(){
        try{
          const cles=[];
          for(let i=0;i<localStorage.length;i+=1){const k=localStorage.key(i);if(k&&k.indexOf('soreal_idle_aide_v1_')===0)cles.push(k);}
          cles.forEach(function(k){localStorage.removeItem(k);});
          localStorage.setItem('soreal_idle_info_ouvert_v1','0');
        }catch(_e){}
        try{const L=window.__SOREAL_IDLE_NGU_LABO_V1__;if(L&&typeof L.resume==='function')L.resume(false);}catch(_e){}
        try{const Y=window.__SOREAL_IDLE_YGG_V1__;if(Y&&typeof Y.fermerAide==='function')Y.fermerAide();}catch(_e){}
      }

      function menuIdleCoeurV28_(menu){
        /* Mode « Rangement des boutons » : un appui ne change pas de page ; l'appui qui suit un maintien est avalé. */
        if(REG.idleMenuEditionV1||Date.now()<REG.idleMenuClicAvaleJusquaV1)return;

        const menuDemandeV1=menu;
        /* Anciens menus Collection / Classement / Succès : ils ouvrent Chroniques sur le bon onglet. */
        if(menu==='bestiaire'||menu==='classement'||menu==='succes'){
          REG.idleChroniquesOngletV1=menu;
          menu='chroniques';
        }

        if(
          !menuDisponibleIdleV28_(
            menu,
            REG.idleEtat
          )
        ){
          return;
        }

        jouerSonMenuIdleV1_();
        fermerPanneauxInfoIdleV1_();

        /* Chat : page du menu comme les autres (plus de fenêtre volante) ; le module monte son contenu dans la page (contenuMenuIdleV28_). */
        if(menu==='chat'){
          try{
            if(REG.idleEtat&&!idleMenuEstAcquisV1_(REG.idleEtat,'chat'))idleMenuMarquerAcquisV1_(REG.idleEtat,'chat');
          }catch(e){}
        }

        const nouveauMenu=
          String(
            menu||'combat'
          );

        /* Norman (2026-10-13) : cliquer sur Aventure arrête le combat de titan et laisse en Zone sûre, sur la vue Zones (l'écran de combat de titan ne couvre pas le menu). */
        if(nouveauMenu==='aventure'&&arreterCombatTitanIdleV1_()){
          if(REG.idleMenuActifV28==='aventure'){
            window.__vueAventureIdleV1__('zones');
            return;
          }
          REG.idleVueAventureV1='zones';
          document.documentElement.setAttribute('data-vue-aventure','zones');
        }

        /* Norman (2026-10-14) : cliquer sur Aventure depuis la vue Titans ramène à la vue Aventure (zones). */
        if(nouveauMenu==='aventure'&&REG.idleMenuActifV28==='aventure'&&REG.idleVueAventureV1==='titans'){
          window.__vueAventureIdleV1__('zones');
          return;
        }

        /*
         * Reclic sur le menu où l'on se trouve déjà (Norman, 2026-10-11 : « la page Entraînement avancé se redessine quand on reclique sur son menu »). La page est déjà là et déjà à jour : rien à redessiner. Seul un ancien
         * menu redirigé vers un onglet de Chroniques, ou la page absente du DOM, redessine.
         */
        if(
          nouveauMenu===REG.idleMenuActifV28 &&
          menuDemandeV1===nouveauMenu &&
          REG.idleMenuRenduV179===nouveauMenu &&
          REG.idleEtat &&
          idleMenuEstAcquisV1_(REG.idleEtat,nouveauMenu) &&
          document.querySelector('.soreal-idle-page-root-v28[data-menu="'+nouveauMenu+'"]')
        ){
          return;
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-316 */
        if(REG.idleEtat&&!idleMenuEstAcquisV1_(REG.idleEtat,nouveauMenu)){
          idleMenuMarquerAcquisV1_(REG.idleEtat,nouveauMenu);

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-317 */
          if(nouveauMenu==='aventure'){
            demarrerTutorielPagesIdleV1_(
              REG.TUTORIEL_AVENTURE_PAGES_V1,
              'soreal_idle_tutoriel_aventure_v1_'+generationJoueurIdleV75_(REG.idleEtat)
            );
          }else{
            const info=idleInfosParMenuIdleV1_(REG.idleEtat)[nouveauMenu];
            if(info&&anciennesFenetresMenusPermisesIdleV1_()){
              REG.idlePopupQueueV75.push(info);
              afficherProchainePopupIdleV75_();
            }
          }
        }

        if(
          REG.idleMenuActifV28==='aventure' &&
          nouveauMenu!=='aventure' &&
          REG.idleAutoAventureV30
        ){
          REG.idleAutoAventureV30=false;

          if(REG.idleEtat){
            REG.idleEtat.autoAventure={
              actif:false,
              zoneId:
                REG.idleAutoZoneV30
            };
          }

          annulerTimerCombatAutoIdleV30_();
          sauverCombatAutoIdleV30_();

          if(SOREAL_SESSION){
            ajouterActionRapideIdleV60_(
              'autoAdventure',
              {
                actif:false,
                zoneId:
                  REG.idleAutoZoneV30
              }
            );
          }
        }

        if(nouveauMenu==='aventure')REG.idleAdventureKoAlertV1=false;

        /* ITOPOD : un clic sur le menu ramène TOUJOURS à la tour (l'écran de combat), jamais à la boutique des Atouts restée en mémoire (Norman, 2026-10-22). */
        if(nouveauMenu==='tower')window.__itopodVueIdleV1__='tour';

        REG.idleMenuActifV28=
          nouveauMenu;

        sauverMenuIdleV28_();

        rendreIdleEtat_({
          ok:true,
          joueur:REG.idleEtat
        });
      }

  Object.assign(REG,{
    menuDisponibleIdleV28_:menuDisponibleIdleV28_,
    infoSurchargeeIdleV1_:infoSurchargeeIdleV1_,
    definitionsNouveautesIdleV75_:definitionsNouveautesIdleV75_,
    texteVoixNouveauteIdleV1_:texteVoixNouveauteIdleV1_,
    navigationIdleV28_:navigationIdleV28_,
    menuIdleV28_:menuIdleV28_,
    fermerPanneauxInfoIdleV1_:fermerPanneauxInfoIdleV1_
  });
})();
