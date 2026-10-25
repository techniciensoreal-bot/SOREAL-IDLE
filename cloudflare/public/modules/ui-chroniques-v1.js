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

  function idleNombre_(){return REG.idleNombre_.apply(null,arguments);}
  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function formatGrandNombreIdleV70_(){return REG.formatGrandNombreIdleV70_.apply(null,arguments);}
  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function rafraichirMenuRacineIdleV28_(){return REG.rafraichirMenuRacineIdleV28_.apply(null,arguments);}
  function urlBossR2IdleV1_(){return REG.urlBossR2IdleV1_.apply(null,arguments);}
  function attrHistoireVoixIdleV1_(){return REG.attrHistoireVoixIdleV1_.apply(null,arguments);}
  function attrLectureBossIdleV1_(){return REG.attrLectureBossIdleV1_.apply(null,arguments);}
  function sansBaliseVoixIdleV1_(){return REG.sansBaliseVoixIdleV1_.apply(null,arguments);}
  function aventureMetaIdleV47_(){return REG.aventureMetaIdleV47_.apply(null,arguments);}
  function rendreCollectionEquipementIdleV1_(){return REG.rendreCollectionEquipementIdleV1_.apply(null,arguments);}
  function iconeObjetAdventureIdleV138_(){return REG.iconeObjetAdventureIdleV138_.apply(null,arguments);}
  function libelleRecompenseSetAdventureIdleV163_(){return REG.libelleRecompenseSetAdventureIdleV163_.apply(null,arguments);}
  function toastIdleV5_(){return REG.toastIdleV5_.apply(null,arguments);}

      function dateIdleV25_(iso){
        const d=new Date(iso||'');
        return Number.isNaN(d.getTime())
          ?'—'
          :d.toLocaleDateString('fr-BE',{
              day:'2-digit',
              month:'2-digit',
              year:'numeric'
            });
      }

      function dureeProfilIdleV25_(p){
        const jours=Math.floor(idleNombre_(p&&p.ageJours));
        const heures=Math.floor(idleNombre_(p&&p.ageHeures));
        const mois=Math.floor(idleNombre_(p&&p.ageMois));
        if(mois>=1)return mois+' mois · '+jours+' jours';
        if(jours>=1)return jours+' jours · '+heures+' h';
        return heures+' h';
      }

      function rendreProfilIdleV26_(j){
        const joueur=
          j && typeof j==='object'
            ?j
            :{};

        const profil=
          joueur.profil &&
          typeof joueur.profil==='object'
            ?joueur.profil
            :{};

        const stats=
          profil.stats &&
          typeof profil.stats==='object'
            ?profil.stats
            :{};

        const prochain=
          joueur.prochainPalier &&
          typeof joueur.prochainPalier==='object'
            ?joueur.prochainPalier
            :null;

        return `
          <div class="soreal-idle-window-title-v31 dark">
            👤 ${idleHtml_(joueur.nom||'Joueur')}
            · ${idleHtml_(joueur.titre||'Recrue du dépôt')}
          </div>

          <div class="soreal-idle-character-grid-v25">
            <div class="soreal-idle-character-stat-v25">
              Nombre
              <b>${formatGrandNombreIdleV70_(joueur.systemes&&joueur.systemes.rebirth&&joueur.systemes.rebirth.number||1)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Puissance
              <b>${idleEntier_(joueur.puissance)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Force
              <b>${idleEntier_(joueur.force)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Endurance
              <b>${idleEntier_(joueur.endurance)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Organisation
              <b>${idleEntier_(joueur.organisation)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Défense
              <b>${idleEntier_(joueur.defense)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Boss vaincus
              <b>${idleEntier_(joueur.bossVaincus)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Renaissances
              <b>${idleEntier_(joueur.renaissances)}</b>
            </div>
          </div>

          <div class="soreal-idle-profile-detail-v52">
            <div>
              📅 Début :
              <strong>${dateIdleV25_(profil.dateDebut)}</strong>
            </div>

            <div>
              ⏱️ Temps de jeu :
              <strong>${formaterDureeJeuIdleV1_(stats.tempsActifSec)}</strong>
            </div>

            <div>
              🗓️ Ancienneté :
              <strong>${dureeProfilIdleV25_(profil)}</strong>
            </div>

            <div>
              🎁 Loots obtenus :
              <strong>${idleEntier_(stats.lootsObtenus)}</strong>
            </div>

            <div>
              ♻️ Objets recyclés :
              <strong>${idleEntier_(stats.objetsRecycles)}</strong>
            </div>

            <div>
              🔗 Fusions :
              <strong>${idleEntier_(stats.fusions)}</strong>
            </div>

            <div>
              🔥 Améliorations forge :
              <strong>${idleEntier_(stats.forge)}</strong>
            </div>

            <div>
              🗺️ Combats aventure :
              <strong>${idleEntier_(stats.combatsAventure)}</strong>
            </div>

            <div>
              🏆 Victoires aventure :
              <strong>${idleEntier_(stats.victoiresAventure)}</strong>
            </div>
          </div>

          ${
            prochain
              ?`
                <div class="soreal-idle-profile-next-v52">
                  🎯 Prochain titre :
                  <strong>${idleHtml_(prochain.nom||'—')}</strong>
                  ${
                    idleEntier_(prochain.niveau)>idleEntier_(joueur.niveau)
                      ?' au niveau '+idleEntier_(prochain.niveau)
                      :''
                  }
                </div>
              `
              :''
          }
        `;
      }

      /* Le menu Achievements n'apparaît qu'au premier succès débloqué (Norman, 2026-09-26). */
      function menuSuccesVisibleIdleV1_(j){
        const succes=j&&j.systemes&&j.systemes.achievements;
        return Boolean(succes&&Array.isArray(succes.list)&&succes.list.some(function(a){return a&&a.unlocked;}));
      }

      const CLE_SUCCES_VUS_V1='soreal_idle_succes_vus_v1';

      function succesVusIdleV1_(){
        try{
          const brut=localStorage.getItem(CLE_SUCCES_VUS_V1);
          if(brut===null)return null;
          const liste=JSON.parse(brut);
          return Array.isArray(liste)?liste:null;
        }catch(_e){return null;}
      }

      function memoriserSuccesVusIdleV1_(ids){
        try{localStorage.setItem(CLE_SUCCES_VUS_V1,JSON.stringify(ids));}catch(_e){}
      }

      /* Succès débloqués mais jamais regardés : la liste des succès vus est mémorisée sur l'appareil ; première visite = tout ce qui est déjà débloqué est considéré comme vu. Ouvrir le menu Succès les marque tous comme vus. */
      let idleSuccesNouveauxV1=[];

      function succesNonVusIdleV1_(j,menuActif){
        const ach=j&&j.systemes&&j.systemes.achievements&&Array.isArray(j.systemes.achievements.list)?j.systemes.achievements.list:[];
        const debloques=ach.filter(function(a){return a&&a.unlocked;}).map(function(a){return a.id;});
        const vus=succesVusIdleV1_();
        if(vus===null){memoriserSuccesVusIdleV1_(debloques);return false;}
        const nonVus=debloques.filter(function(id){return vus.indexOf(id)===-1;});
        if(menuActif==='succes'){
          /* Point rouge dans le menu (Norman, 2026-10-04) : les trophées non vus à l'ouverture sont gardés tant qu'on reste dans le menu (sur leur catégorie et sur le trophée), puis considérés comme vus. */
          nonVus.forEach(function(id){if(idleSuccesNouveauxV1.indexOf(id)===-1)idleSuccesNouveauxV1.push(id);});
          if(nonVus.length)memoriserSuccesVusIdleV1_(vus.concat(nonVus));
          return false;
        }
        idleSuccesNouveauxV1=[];
        return nonVus.length>0;
      }

      function chroniquesOngletsIdleV1_(j){
        const liste=[];
        if(!j)return liste;
        if(j.bestiaire&&j.bestiaire.debloquee)liste.push({nom:'Collection',icon:'🏆',id:'bestiaire'});
        if(j.classement&&j.classement.debloque)liste.push({nom:'Classement',icon:'📊',id:'classement'});
        if(menuSuccesVisibleIdleV1_(j))liste.push({nom:'Succès',icon:'🎖️',id:'succes'});
        /* Cinématiques : jamais seule (elle ne doit pas faire apparaître le menu Chroniques d'un joueur qui n'a encore rien découvert). */
        if(liste.length)liste.push({nom:'Cinématiques',icon:'🎬',id:'cinematiques'});
        return liste;
      }

      function chroniquesOngletActifIdleV1_(j){
        const onglets=chroniquesOngletsIdleV1_(j||REG.idleEtat);
        if(!onglets.length)return '';
        return onglets.some(function(o){return o.id===REG.idleChroniquesOngletV1;})?REG.idleChroniquesOngletV1:onglets[0].id;
      }

      /* Menu « de style » : pour Chroniques, l'onglet affiché ; sinon le menu actif. */
      function menuStyleIdleV1_(j){
        return REG.idleMenuActifV28==='chroniques'?(chroniquesOngletActifIdleV1_(j)||'bestiaire'):REG.idleMenuActifV28;
      }

      /*
       * Cinématiques (Norman, 2026-10-25 : « on doit pouvoir revoir les cinématiques ; tout le monde doit pouvoir revoir l'intro ; d'autres scènes viendront » + « avec la première image en aperçu »). Une carte par scène : l'aperçu est la première image, un clic la rejoue sans rien
       * marquer comme vu, et le serveur est prévenu (action watchCinematic) pour que « En direct » dise qui regarde quoi. Pour une nouvelle scène : ajouter une entrée ici ET son code dans IDLE_CINEMATIQUES_V1 (idle-ngu-actions.js) et sa phrase dans flux-v1.js.
       */
      const CINEMATIQUES_V1=[{id:'intro',nom:'L’intro',sous:'Le commencement',lancer:function(){return typeof window.__rejouerIntroIdleV1__==='function'&&window.__rejouerIntroIdleV1__();},apercu:function(){const d=window.__SOREAL_IDLE_INTRO_DIAPORAMA_V1__;try{return d&&typeof d.url==='function'?d.url(0):'';}catch(_e){return '';}}}];
      function pageCinematiquesIdleV1_(){
        return '<div class="soreal-idle-cine-v1">'+CINEMATIQUES_V1.map(function(c){
          const img=c.apercu();
          return '<button type="button" class="soreal-idle-cine-carte-v1" data-cine="'+c.id+'" onclick="window.__rejouerCinematiqueIdleV1__(this.dataset.cine)">'+
            '<span class="cine-apercu-v1">'+(img?'<img alt="" decoding="async" draggable="false" src="'+img+'">':'')+'<span class="cine-play-v1" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M4 2.5 L13.5 8 L4 13.5 Z" fill="currentColor"/></svg></span></span>'+
            '<b>'+c.nom+'</b><em>'+c.sous+'</em></button>';
        }).join('')+'</div>';
      }
      window.__rejouerCinematiqueIdleV1__=function(id){
        const c=CINEMATIQUES_V1.find(function(x){return x.id===id;});
        if(!c||!c.lancer())return;
        try{const f=window.__actionMetaIdleV130__;if(typeof f==='function')f({action:'watchCinematic',id:id});}catch(_e){}
      };

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
        else if(actif==='cinematiques')contenu=pageCinematiquesIdleV1_();
        else contenu=pageSystemeMetaIdleV130_(j,'achievements','Achievements');
        return barre+contenu;
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-138 */
      function entetePageIdleV28_(
        titre,
        sousTitre
      ){
        return `
          <div class="soreal-idle-page-head-v28">
            <div class="soreal-idle-page-title-v28">
              ${titre}
            </div>
            ${sousTitre ? `
            <div class="soreal-idle-page-sub-v28">
              ${sousTitre}
            </div>
            ` : ''}
          </div>
        `;
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

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-171 */
      let idleCollectionOngletV1='boss';

      function changerOngletCollectionIdleV1_(onglet){
        idleCollectionOngletV1=String(onglet||'boss');
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(root&&REG.idleEtat)rafraichirMenuRacineIdleV28_();
      }

      function rendreCollectionCreaturesIdleV1_(entrees,vide){
        /* ANTI-SPOIL (AGENTS.md règle n°2) : seules les entrées découvertes sont affichées, jamais de carte « ??? ». */
        entrees=entrees.filter(function(e){return e&&e.decouvert;});
        if(!entrees.length){
          return '<div class="soreal-idle-empty-v10">'+idleHtml_(vide)+'</div>';
        }

        return '<div class="soreal-idle-bestiary-grid-v110">'+
          entrees.map(function(e){
            if(!e||!e.decouvert)return '';

            /*
             * 2026-09-25 (Norman) : les cartes de boss n'affichent que l'image (plein cadre, sans bords) et le nom centré ; un clic ouvre
             * les statistiques et la chronique (ouvrirBossCollectionIdleV1_).
             */
            if(idleEntier_(e.numero)>0){
              const imageBoss=urlBossR2IdleV1_(idleEntier_(e.numero));
              return '<div class="soreal-idle-bestiary-card-v110 boss-card" role="button" tabindex="0" '+
                'onclick="window.__ouvrirBossCollectionIdleV1__('+idleEntier_(e.numero)+')" '+
                'onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();window.__ouvrirBossCollectionIdleV1__('+idleEntier_(e.numero)+')}">'+
                '<div class="soreal-idle-bestiary-image-v120"><img src="'+idleHtml_(imageBoss)+'" alt="'+idleHtml_(e.nom||'Boss')+'" loading="lazy" '+
                  'onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'flex\'">'+
                  '<div class="soreal-idle-bestiary-emoji-v110" style="display:none">'+idleHtml_(e.emoji||'👹')+'</div></div>'+
                '<div class="soreal-idle-bestiary-name-v110 boss-name">'+idleHtml_(e.nom||'Boss')+'</div>'+
              '</div>';
            }

            /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-172 */
            const image=
              idleEntier_(e.numero)>0
                ?urlBossR2IdleV1_(idleEntier_(e.numero))
                :(e.zone
                  ?urlMobR2IdleV1_(e.zone,e.boss,e.index,e.nom)
                  :String(e.image||''));

            return `
              <div class="soreal-idle-bestiary-card-v110${e.rare?' rare-found':''}">
                ${
                  image
                    ?'<div class="soreal-idle-bestiary-image-v120"><img src="'+idleHtml_(image)+'" alt="'+idleHtml_(e.nom||'Créature')+'" '+
                      'onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'flex\'">'+
                      '<div class="soreal-idle-bestiary-emoji-v110" style="display:none">'+idleHtml_(e.emoji||'👾')+'</div></div>'
                    :'<div class="soreal-idle-bestiary-emoji-v110">'+idleHtml_(e.emoji||'👾')+'</div>'
                }
                <div class="soreal-idle-bestiary-name-v110">
                  ${idleHtml_(e.nom||'Créature')}
                </div>
                <div class="soreal-idle-bestiary-type-v110">
                  ${idleHtml_(e.categorie||'Créature')}
                </div>
                <div class="soreal-idle-bestiary-meta-v110">
                  ${idleNombre_(e.pv)>0?'❤️ '+formatGrandNombreIdleV70_(e.pv):''}
                  ${idleNombre_(e.attaque)>0?'· ⚔️ '+formatGrandNombreIdleV70_(e.attaque)+' attaque':''}
                  ${idleNombre_(e.defense)>0?'· 🛡️ '+formatGrandNombreIdleV70_(e.defense)+' défense':''}
                  ${idleNombre_(e.regen)>0?'· 💚 '+formatGrandNombreIdleV70_(e.regen)+' regen':''}
                  ${idleNombre_(e.cadence)>0?'· ⏱️ '+idleNombre_(e.cadence)+' s':''}
                  ${e.typeMob&&e.typeMob!=='normal'?'· '+idleHtml_(e.typeMob):''}
                  ${e.numero>0?'· ✨ '+idleEntier_(e.xp)+' EXP':''}
                  · 👁️ ${idleEntier_(e.rencontres)} rencontre${idleEntier_(e.rencontres)>1?'s':''}
                </div>
                ${e.description
                  ?'<div id="'+
                    (idleEntier_(e.numero)>0
                      ?'sorealIdleCollectionBossStoryV206_'+idleEntier_(e.numero)
                      :'sorealIdleCollectionCreatureDescV206_'+idleEntier_(e.index))+
                    '" class="soreal-idle-bestiary-desc-v110"'+
                    (idleEntier_(e.numero)>0?' data-soreal-tts-chronique="'+idleHtml_(e.nom||'Boss')+'"'+attrLectureBossIdleV1_(e.nom,e.description,e.nomParle,e.histoireParlee):'')+
                    '>'+idleHtml_(sansBaliseVoixIdleV1_(e.description))+'</div>'
                  :''}
                ${idleEntier_(e.numero)>0&&e.description
                  ?'<button type="button" class="soreal-idle-tts-read-v203" data-soreal-tts-target="sorealIdleCollectionBossStoryV206_'+idleEntier_(e.numero)+'">🔊 Lire cette chronique</button>'
                  :''}
              </div>
            `;
          }).join('')+
        '</div>';
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

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-233 */
      function pageCollectionIdleV22_(j){
        return entetePageIdleV28_(
          '📚 Sets',
          'Progression réelle des sets NGU : chaque pièce doit atteindre le niveau 100 pour activer sa récompense de complétion.'
        )+rendreCollectionIdleV22_(j);
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

      function rendreCollectionIdleV22_(j){
        const a=aventureMetaIdleV47_(j);
        const setCatalog=catalogueSetsCollectionIdleV164_(a);
        const itemCatalog=a&&a.itemCatalog&&typeof a.itemCatalog==='object'?a.itemCatalog:{};
        const itemList=a&&a.itemList&&typeof a.itemList==='object'?a.itemList:{};
        const completed=a&&a.completedSets&&typeof a.completedSets==='object'?a.completedSets:{};
        const sets=Object.values(setCatalog).filter(function(setDef){
          const setId=String(setDef&&setDef.id||'');
          const slots=Array.isArray(setDef&&setDef.slots)?setDef.slots:[];
          return slots.some(function(slot){
            const info=itemList[setId+':'+String(slot)];
            return Boolean(info&&info.seen);
          });
        });

        if(!sets.length){
          return '<div class="soreal-idle-empty-v10">Aucun set découvert pour l’instant. Les cases apparaîtront dès que tu trouveras la première pièce d’un set.</div>';
        }

        return sets.map(function(setDef){
          const setId=String(setDef&&setDef.id||'');
          const slots=Array.isArray(setDef&&setDef.slots)?setDef.slots:[];
          const total=slots.length;
          let vus=0;
          let niveau100=0;
          let verts=0;

          const cartes=slots.map(function(slot){
            const definitionId=setId+':'+String(slot);
            const def=itemCatalog[definitionId]||{};
            const info=itemList[definitionId]||null;
            const vu=Boolean(info&&info.seen);
            const lvl=vu?idleEntier_(info.maxLevel):0;
            const lvl100=Boolean(info&&info.maxed);
            const vert=Boolean(info&&info.fullyMaxed);
            if(vu)vus+=1;
            if(lvl100)niveau100+=1;
            if(vert)verts+=1;

            const pseudo={
              set:setId,
              slot:def.slot||slot,
              name:def.name||definitionId,
              definitionId:definitionId,
              wikiItemId:def.wikiItemId||0,
              kind:'equipment',
              basePower:def.basePower||0,
              baseToughness:def.baseToughness||0
            };

            if(!vu)return '';
            return '<div class="soreal-idle-collection-slot-v32'+(vu?' found':'')+(vert?' maxed':'')+'">'+
              '<div style="font-size:20px">'+(vu?iconeObjetAdventureIdleV138_(pseudo):'❓')+'</div>'+
              '<div>'+(vu?idleHtml_(def.name||definitionId):'Inconnu')+'</div>'+
              (vu
                ?'<small>Niv. '+lvl+'/100'+
                  (vert?' · ✅ 100 %':lvl100?' · boosts à compléter':'')+
                '</small>'
                :'')+
            '</div>';
          }).join('');

          const completeCollection=Boolean(total>0&&verts===total);
          /* Bonus du set en évidence (2026-09-26, Norman) : cadre doré à obtenir, vert une fois obtenu (niveau 100 sur toutes les pièces). */
          const obtenu=Boolean(completed[setId]);
          const recompenseHtml=setDef.reward
            ?'<div class="soreal-idle-collection-bonus-v1'+(obtenu?' obtenu':'')+'">'+
                '<div class="titre">'+(obtenu?'✅ Bonus du set obtenu':'🎁 Bonus du set')+'</div>'+
                '<div class="texte">'+idleHtml_(libelleRecompenseSetAdventureIdleV163_(setDef.reward))+'</div>'+
                (obtenu?'':'<div class="condition">S’obtient quand les '+total+' pièces sont au niveau 100.</div>')+
              '</div>'
            :'';
          return '<div class="soreal-idle-collection-zone-v32">'+
            '<div class="soreal-idle-collection-zone-head-v32">'+
              '<div>'+
                '<div class="soreal-idle-collection-zone-name-v32">📚 '+idleHtml_(setDef.name||setId)+'</div>'+
                recompenseHtml+
                '<div class="soreal-idle-collection-reward-v32">'+
                  'Découverts : '+vus+' · Niveau 100 : '+niveau100+
                  ' · 100 % boosts : '+verts+
                '</div>'+
              '</div>'+
              '<div class="soreal-idle-collection-count-v32'+(completeCollection?' done':'')+'">'+
                verts+(completeCollection?' ✅':'')+
              '</div>'+
            '</div>'+
            '<div class="soreal-idle-collection-slots-v32">'+cartes+'</div>'+
          '</div>';
        }).join('');
      }

      function pageSystemeMetaIdleV130_(j,id,titre){
        const api=window.__SOREAL_IDLE_META_V130__;
        if(api&&typeof api.pageSystemeMetaIdleV130_==='function'){
          return api.pageSystemeMetaIdleV130_(j,id,titre);
        }
        return '';
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

      function formaterDureeJeuIdleV1_(secondes){
        let s=Math.max(0,Math.floor(idleNombre_(secondes)));
        const j=Math.floor(s/86400);s-=j*86400;
        const h=Math.floor(s/3600);s-=h*3600;
        const m=Math.floor(s/60);
        if(j>0)return j+' j '+h+' h '+m+' min';
        if(h>0)return h+' h '+m+' min';
        return m+' min';
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
       * Profil et pseudo (2026-09-26, Norman : « la possibilité de choisir un Pseudo dans les paramètres ; c'est ce pseudo qui est utilisé pour les gens qui jouent en dehors
       * de SOREAL APP et TV ; si c'est un ouvrier, il peut afficher un pseudo, mais on voit son prénom entre parenthèses »). Le serveur valide et garantit l'unicité.
       */
      function htmlProfilPseudoIdleV1_(j){
        const id=j&&j.identite;
        if(!id)return '';
        const google=Boolean(id.externe);
        return '<div class="soreal-idle-section-v8" id="sorealIdleProfilPseudoV1">'+
          '<div class="soreal-idle-window-title-v31">👤 Profil</div>'+
          '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">'+
            (google
              ?'Les autres joueurs te voient uniquement sous ton pseudo (jamais ton nom Google ni ton adresse).'
              :'Tu peux choisir un pseudo : les autres te verront « Pseudo ('+idleHtml_(id.prenom||'Prénom')+') ».')+
          '</div>'+
          '<div style="font-size:15px;color:#dce5f3;margin-bottom:8px">Nom affiché : <b>'+idleHtml_(id.nomAffiche||'Joueur')+'</b></div>'+
          '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">'+
            '<input id="sorealIdlePseudoChampV1" type="text" maxlength="20" autocomplete="off" spellcheck="false" placeholder="Ton pseudo (3 à 20 caractères)" value="'+idleHtml_(id.pseudo||'')+'" '+
              'style="flex:1 1 180px;min-width:0;padding:9px 11px;border-radius:10px;border:1px solid rgba(129,176,255,.35);background:#0d1830;color:#eef5ff;font-size:14px">'+
            '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__enregistrerPseudoIdleV1__()">Enregistrer</button>'+
          '</div>'+
          (google
            ?'<div style="font-size:13px;color:#7f8aa4;margin-top:10px">Connecté avec Google : '+idleHtml_(id.email||'')+'</div>'+
              '<button type="button" class="soreal-idle-expand-button-v25" style="margin-top:8px" onclick="window.__deconnexionGoogleIdleV1__()">Se déconnecter</button>'
            :'')+
        '</div>';
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

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-324 */
      function urlMobR2IdleV1_(zone,boss,index,nom){
        const z=String(zone||'').trim();
        if(!z)return '';
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-325 */
        return '/api/idle/media/mob?zone='+encodeURIComponent(z)+
          '&boss='+(boss?'1':'0')+
          '&seed='+encodeURIComponent(String(index||'0'))+
          (nom?'&name='+encodeURIComponent(String(nom)):'');
      }

  Object.assign(REG,{
    rendreProfilIdleV26_:rendreProfilIdleV26_,
    menuSuccesVisibleIdleV1_:menuSuccesVisibleIdleV1_,
    chroniquesOngletsIdleV1_:chroniquesOngletsIdleV1_,
    menuStyleIdleV1_:menuStyleIdleV1_,
    pageChroniquesIdleV1_:pageChroniquesIdleV1_,
    entetePageIdleV28_:entetePageIdleV28_,
    boutonLectureChroniqueIdleV1_:boutonLectureChroniqueIdleV1_,
    mainChroniqueIdleV1_:mainChroniqueIdleV1_,
    changerOngletCollectionIdleV1_:changerOngletCollectionIdleV1_,
    afficherDetailsCollectionIdleV1_:afficherDetailsCollectionIdleV1_,
    pageBestiaireIdleV110_:pageBestiaireIdleV110_,
    pageCollectionIdleV22_:pageCollectionIdleV22_,
    catalogueSetsCollectionIdleV164_:catalogueSetsCollectionIdleV164_,
    pageSystemeMetaIdleV130_:pageSystemeMetaIdleV130_,
    changerOngletClassementIdleV1_:changerOngletClassementIdleV1_,
    chargerClassementIdleV1_:chargerClassementIdleV1_,
    pageClassementIdleV1_:pageClassementIdleV1_,
    htmlProfilPseudoIdleV1_:htmlProfilPseudoIdleV1_,
    basculerClassementVisibleIdleV1_:basculerClassementVisibleIdleV1_,
    urlMobR2IdleV1_:urlMobR2IdleV1_
  });
})();
