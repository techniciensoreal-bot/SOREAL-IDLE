/*
 * SOREAL IDLE — Chroniques (collection, classement, succès, profil) (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_chroniques_v1)return;
  REG.__chargé_ui_chroniques_v1=true;

  function chroniquesOngletsIdleV1_(){return REG.chroniquesOngletsIdleV1_.apply(null,arguments);}
  function chroniquesOngletActifIdleV1_(){return REG.chroniquesOngletActifIdleV1_.apply(null,arguments);}
  function pageSystemeMetaIdleV130_(){return REG.pageSystemeMetaIdleV130_.apply(null,arguments);}
  function rafraichirMenuRacineIdleV28_(){return REG.rafraichirMenuRacineIdleV28_.apply(null,arguments);}
  function aventureMetaIdleV47_(){return REG.aventureMetaIdleV47_.apply(null,arguments);}
  function entetePageIdleV28_(){return REG.entetePageIdleV28_.apply(null,arguments);}
  function rendreCollectionCreaturesIdleV1_(){return REG.rendreCollectionCreaturesIdleV1_.apply(null,arguments);}
  function rendreCollectionEquipementIdleV1_(){return REG.rendreCollectionEquipementIdleV1_.apply(null,arguments);}
  function rendreCollectionIdleV22_(){return REG.rendreCollectionIdleV22_.apply(null,arguments);}
  function menuStyleIdleV1_(){return REG.menuStyleIdleV1_.apply(null,arguments);}
  function formaterDureeJeuIdleV1_(){return REG.formaterDureeJeuIdleV1_.apply(null,arguments);}
  function idleNombre_(){return REG.idleNombre_.apply(null,arguments);}
  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function formatGrandNombreIdleV70_(){return REG.formatGrandNombreIdleV70_.apply(null,arguments);}
  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function toastIdleV5_(){return REG.toastIdleV5_.apply(null,arguments);}

      /* Le menu Achievements n'apparaît qu'au premier succès débloqué (Norman, 2026-09-26). */
      function menuSuccesVisibleIdleV1_(j){
        const succes=j&&j.systemes&&j.systemes.achievements;
        return Boolean(succes&&Array.isArray(succes.list)&&succes.list.some(function(a){return a&&a.unlocked;}));
      }

      function memoriserSuccesVusIdleV1_(ids){
        try{localStorage.setItem(REG.CLE_SUCCES_VUS_V1,JSON.stringify(ids));}catch(_e){}
      }

      function pageChroniquesIdleV1_(j){
        const onglets=chroniquesOngletsIdleV1_(j);
        if(!onglets.length)return '';
        const actif=chroniquesOngletActifIdleV1_(j);
        const barre=onglets.length>1
          ?'<div class="soreal-idle-chroniques-onglets-v1" role="tablist">'+
            onglets.map(function(o){
              return '<button type="button" role="tab" aria-selected="'+(o.id===actif?'true':'false')+'" class="soreal-idle-chroniques-onglet-v1'+(o.id===actif?' actif':'')+'" data-onglet="'+o.id+'" onclick="window.__chroniquesOngletIdleV1__(this.dataset.onglet)">'+
                '<i>'+o.icon+'</i><b>'+o.nom+'</b></button>';
            }).join('')+
          '</div>'
          :'';
        let contenu='';
        if(actif==='bestiaire')contenu=pageBestiaireIdleV110_(j);
        else if(actif==='classement')contenu=pageClassementIdleV1_(j);
        else contenu=pageSystemeMetaIdleV130_(j,'achievements','Achievements');
        return barre+contenu;
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-171 */
      let idleCollectionOngletV1='boss';

      function changerOngletCollectionIdleV1_(onglet){
        idleCollectionOngletV1=String(onglet||'boss');
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(root&&REG.idleEtat)rafraichirMenuRacineIdleV28_();
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-177 */
      function afficherDetailsCollectionIdleV1_(id){
        const el=document.getElementById('soreal-idle-collection-details-'+id);
        if(!el)return;
        el.style.display=el.style.display==='none'?'block':'none';
      }

      function pageBestiaireIdleV110_(j){
        const b=
          j&&j.bestiaire
            ?j.bestiaire
            :{
                debloquee:false,
                niveauRequis:2,
                decouvertes:0,
                entrees:[]
              };

        if(!b.debloquee)return '';

        const entrees=
          Array.isArray(b.entrees)
            ?b.entrees
            :[];
        const bossEntrees=entrees.filter(function(e){return e&&e.source==='boss';});

        const a=aventureMetaIdleV47_(j);
        const itemList=a&&a.itemList&&typeof a.itemList==='object'?a.itemList:{};
        const catalog=a&&a.itemCatalog&&typeof a.itemCatalog==='object'?a.itemCatalog:{};
        const completedSets=a&&a.completedSets&&typeof a.completedSets==='object'?a.completedSets:{};
        const cube=a&&a.cube||{};

        /* 2026-09-25 (Norman) : les créatures d'Aventure sont les mêmes que les boss : l'onglet « Aventure » n'existe plus. */
        const onglet=idleCollectionOngletV1&&idleCollectionOngletV1!=='aventure'?idleCollectionOngletV1:'boss';
        const decouvertesBoss=bossEntrees.filter(function(e){return e.decouvert;}).length;
        const itemsObtenus=Object.keys(itemList).length;

        return `
          ${entetePageIdleV28_(
            '🏆 Collection',
            'Chaque créature se révèle après une véritable rencontre — chaque objet dès sa première obtention.'
          )}

          <div class="soreal-idle-collection-tabs-v1">
            <button class="soreal-idle-collection-tab-v1${onglet==='boss'?' active':''}" onclick="window.__changerOngletCollectionIdleV1__('boss')">
              👹 Boss <span>${decouvertesBoss}</span>
            </button>
            <button class="soreal-idle-collection-tab-v1${onglet==='equipement'?' active':''}" onclick="window.__changerOngletCollectionIdleV1__('equipement')">
              🗡️ Équipement <span>${itemsObtenus}</span>
            </button>
            <button class="soreal-idle-collection-tab-v1${onglet==='sets'?' active':''}" onclick="window.__changerOngletCollectionIdleV1__('sets')">
              📚 Sets
            </button>
          </div>

          ${onglet==='boss'
            ?'<div class="soreal-idle-section-v8" style="margin-bottom:10px">'+
              '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__lireHistoireCompleteBossIdleV206__()">🔊 Lire toute l’histoire des boss débloqués</button>'+
              '</div>'+
              rendreCollectionCreaturesIdleV1_(bossEntrees,'Aucun boss vaincu pour l’instant.')
            :''}
          ${onglet==='equipement'?rendreCollectionEquipementIdleV1_(itemList,catalog,completedSets,cube):''}
          ${onglet==='sets'?rendreCollectionIdleV22_(j):''}
        `;
      }

      function catalogueSetsCollectionIdleV164_(a){
        const direct=
          a&&a.setCatalog&&typeof a.setCatalog==='object'
            ?a.setCatalog
            :{};

        if(Object.keys(direct).length){
          return direct;
        }

        const itemCatalog=
          a&&a.itemCatalog&&typeof a.itemCatalog==='object'
            ?a.itemCatalog
            :{};

        const derives={};

        Object.keys(itemCatalog).forEach(function(definitionId){
          const def=itemCatalog[definitionId];
          const setId=String(def&&def.set||'');
          if(!setId||!def||def.kind!=='equipment')return;

          if(!derives[setId]){
            derives[setId]={
              id:setId,
              name:String(def.setName||setId),
              source:'',
              slots:[],
              reward:null
            };
          }

          const slot=String(
            def.slot||
            String(definitionId).split(':').pop()||
            ''
          );

          if(slot&&derives[setId].slots.indexOf(slot)===-1){
            derives[setId].slots.push(slot);
          }
        });

        return derives;
      }

      /*
       * Menu « Classement » (2026-09-25, Norman) : tous les comptes IDLE, classement global à points et par statistique (boss le plus élevé,
       * Rebirths, meilleur NUMBER, EXP totale gagnée, temps de jeu, succès), onglets du même menu. Données : opération serveur
       * obtenirClassementSorealIdle (le serveur calcule les rangs et les points).
       */
      const IDLE_CLASSEMENT_ONGLETS_V1=[
        {id:'global',nom:'🏆 Global'},
        {id:'boss',nom:'👹 Boss'},
        {id:'rebirths',nom:'♻️ Rebirths'},
        {id:'number',nom:'🔢 Nombre'},
        {id:'exp',nom:'⭐ EXP'},
        {id:'playSeconds',nom:'⏱️ Temps de jeu actif'},
        {id:'achievements',nom:'🎖️ Succès'},
        {id:'clics',nom:'🖱️ Clics/Tap'},
        {id:'combatLong',nom:'⚔️ Combat le plus long'}
      ];

      let idleClassementOngletV1='global';

      const idleClassementV1={donnees:null,chargement:false,erreur:'',dernier:0};

      function changerOngletClassementIdleV1_(onglet){
        idleClassementOngletV1=String(onglet||'global');
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(root&&REG.idleEtat)rafraichirMenuRacineIdleV28_();
      }

      function chargerClassementIdleV1_(force){
        if(idleClassementV1.chargement||!SOREAL_SESSION)return;
        if(!force&&idleClassementV1.donnees&&Date.now()-idleClassementV1.dernier<30000)return;
        idleClassementV1.chargement=true;
        function rafraichirPage(){
          const root=document.querySelector('.soreal-idle-page-root-v28');
          if(root&&REG.idleEtat&&REG.idleMenuActifV28==='chroniques'&&menuStyleIdleV1_(REG.idleEtat)==='classement')rafraichirMenuRacineIdleV28_();
        }
        try{
          google.script.run
            .withSuccessHandler(function(res){
              idleClassementV1.chargement=false;
              if(res&&res.ok){
                idleClassementV1.donnees=res;
                idleClassementV1.erreur='';
                idleClassementV1.dernier=Date.now();
              }else{
                idleClassementV1.erreur=(res&&res.message)||'Classement indisponible.';
              }
              rafraichirPage();
            })
            .withFailureHandler(function(e){
              idleClassementV1.chargement=false;
              idleClassementV1.erreur=(e&&e.message)||'Classement indisponible.';
              rafraichirPage();
            })
            .obtenirClassementSorealIdle(SOREAL_SESSION);
        }catch(e){
          idleClassementV1.chargement=false;
          idleClassementV1.erreur='Classement indisponible.';
        }
      }

      function valeurClassementIdleV1_(stat,valeur){
        if(stat==='playSeconds')return formaterDureeJeuIdleV1_(valeur);
        if(stat==='combatLong'){
          const sec=Math.max(0,idleNombre_(valeur));
          if(sec<=0)return '—';
          if(sec<60)return sec.toFixed(1).replace('.',',')+' s';
          return formaterDureeJeuIdleV1_(sec)+' '+Math.floor(sec%60)+' s';
        }
        if(stat==='boss')return 'Boss '+idleEntier_(valeur);
        if(stat==='number'||stat==='exp')return formatGrandNombreIdleV70_(valeur);
        return String(idleEntier_(valeur));
      }

      function pageClassementIdleV1_(j){
        chargerClassementIdleV1_(false);
        const d=idleClassementV1.donnees;
        const onglet=IDLE_CLASSEMENT_ONGLETS_V1.some(function(o){return o.id===idleClassementOngletV1;})?idleClassementOngletV1:'global';
        const tete=entetePageIdleV28_('📊 Classement','Tous les joueurs de SOREAL IDLE. Un joueur qui recommence sa partie reste listé, à zéro.');
        const onglets='<div class="soreal-idle-collection-tabs-v1">'+
          IDLE_CLASSEMENT_ONGLETS_V1.map(function(o){
            return '<button type="button" class="soreal-idle-collection-tab-v1'+(onglet===o.id?' active':'')+'" onclick="window.__changerOngletClassementIdleV1__(\''+o.id+'\')">'+o.nom+'</button>';
          }).join('')+
        '</div>';
        if(!d){
          return tete+onglets+'<div class="soreal-idle-empty-v10">'+
            idleHtml_(idleClassementV1.erreur||'Chargement du classement…')+
          '</div>';
        }
        const entrees=Array.isArray(d.entrees)?d.entrees.slice():[];
        let lignes;
        if(onglet==='global'){
          lignes=entrees.sort(function(a,b){return a.rang-b.rang||String(a.nom).localeCompare(String(b.nom),'fr');});
        }else{
          lignes=entrees.sort(function(a,b){
            return (a.rangs&&a.rangs[onglet]||0)-(b.rangs&&b.rangs[onglet]||0)||String(a.nom).localeCompare(String(b.nom),'fr');
          });
        }
        /* Onglets Global ET Boss (Norman, 2026-10-11 puis 2026-10-13) : le boss d'un autre joueur plus avancé que le tien s'affiche « Boss ??? » (anti-spoil : tu ne vois pas jusqu'où les autres sont allés). */
        const monBoss=(function(){const m=entrees.find(function(x){return x&&x.moi;});return m?idleEntier_(m.valeurs&&m.valeurs.boss):0;})();
        const corps=lignes.map(function(e){
          const rang=onglet==='global'?e.rang:(e.rangs&&e.rangs[onglet]);
          const medaille=rang===1?'🥇':(rang===2?'🥈':(rang===3?'🥉':rang));
          const valeur=onglet==='global'
            ?'<b>'+idleEntier_(e.points)+' pts</b><span>'+(idleEntier_(e.valeurs&&e.valeurs.boss)>monBoss?'Boss ???':valeurClassementIdleV1_('boss',e.valeurs&&e.valeurs.boss))+'</span>'
            :'<b>'+(onglet==='boss'&&idleEntier_(e.valeurs&&e.valeurs.boss)>monBoss?'Boss ???':valeurClassementIdleV1_(onglet,e.valeurs&&e.valeurs[onglet]))+'</b>'+(onglet==='combatLong'&&e.valeurs&&typeof e.valeurs.combatLongGagne==='boolean'?'<span class="soreal-idle-classement-issue-v1 '+(e.valeurs.combatLongGagne?'gagne':'perdu')+'">'+(e.valeurs.combatLongGagne?'🏆 Gagné':'💀 Perdu')+'</span>':'');
          return '<div class="soreal-idle-classement-ligne-v1'+(e.moi?' moi':'')+'">'+
            '<div class="soreal-idle-classement-rang-v1">'+medaille+'</div>'+
            '<div class="soreal-idle-classement-nom-v1">'+idleHtml_(e.nom)+(e.moi?' <em>(toi)</em>':'')+'</div>'+
            '<div class="soreal-idle-classement-valeur-v1">'+valeur+'</div>'+
          '</div>';
        }).join('');
        const detail=onglet==='global'
          ?'<div class="soreal-idle-note-v4" style="margin:0 0 10px">Points : pour chaque statistique, le 1er reçoit autant de points qu’il y a de joueurs, le dernier 1 point ; le total classe les joueurs.</div>'
          :'';
        return tete+onglets+detail+
          '<div class="soreal-idle-classement-liste-v1">'+corps+'</div>'+
          '<div style="margin-top:12px"><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__actualiserClassementIdleV1__()">↻ Actualiser</button></div>';
      }

      /*
       * Norman (2026-09-27) : « Je ne veux pas apparaitre dans le classement pour les autres. Uniquement moi. Et
       * avoir une case dans parametres pour pouvoir apparaitre ou disparaitre. » Préférence PERSONNELLE (jamais
       * réservée à l'administrateur) : n'importe quel joueur qui a le classement débloqué peut se cacher des autres
       * -- il continue de se voir lui-même (voir obtenirClassementSorealIdle, côté serveur).
       */
      function basculerClassementVisibleIdleV1_(voulu){
        if(!REG.idleEtat||!REG.idleEtat.classement||!SOREAL_SESSION)return;
        google.script.run
          .withSuccessHandler(function(res){
            if(res&&res.ok){
              REG.idleEtat.classement.visible=Boolean(res.classementVisible);
              toastIdleV5_(res.classementVisible?'🏆 Visible des autres dans le classement.':'🙈 Caché des autres dans le classement.');
            }else{
              toastIdleV5_((res&&res.message)||'Impossible de changer cette préférence.');
              const root=document.querySelector('.soreal-idle-page-root-v28');
              if(root&&REG.idleMenuActifV28==='parametres')rafraichirMenuRacineIdleV28_();
            }
          })
          .withFailureHandler(function(e){
            toastIdleV5_((e&&e.message)||'Impossible de changer cette préférence.');
            const root=document.querySelector('.soreal-idle-page-root-v28');
            if(root&&REG.idleMenuActifV28==='parametres')rafraichirMenuRacineIdleV28_();
          })
          .definirClassementVisibleSorealIdle(SOREAL_SESSION,Boolean(voulu));
      }

  Object.assign(REG,{
    menuSuccesVisibleIdleV1_:menuSuccesVisibleIdleV1_,
    memoriserSuccesVusIdleV1_:memoriserSuccesVusIdleV1_,
    pageChroniquesIdleV1_:pageChroniquesIdleV1_,
    changerOngletCollectionIdleV1_:changerOngletCollectionIdleV1_,
    afficherDetailsCollectionIdleV1_:afficherDetailsCollectionIdleV1_,
    pageBestiaireIdleV110_:pageBestiaireIdleV110_,
    catalogueSetsCollectionIdleV164_:catalogueSetsCollectionIdleV164_,
    changerOngletClassementIdleV1_:changerOngletClassementIdleV1_,
    chargerClassementIdleV1_:chargerClassementIdleV1_,
    pageClassementIdleV1_:pageClassementIdleV1_,
    basculerClassementVisibleIdleV1_:basculerClassementVisibleIdleV1_
  });
})();
