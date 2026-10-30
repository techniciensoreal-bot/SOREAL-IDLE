/*
 * SOREAL IDLE — Réglages et notes de version (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_reglages_v1)return;
  REG.__chargé_ui_reglages_v1=true;

  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function menuDisponibleIdleV28_(){return REG.menuDisponibleIdleV28_.apply(null,arguments);}
  function rafraichirMenuRacineIdleV28_(){return REG.rafraichirMenuRacineIdleV28_.apply(null,arguments);}
  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function idleInfosParMenuIdleV1_(){return REG.idleInfosParMenuIdleV1_.apply(null,arguments);}
  function idleMenusAckListeV1_(){return REG.idleMenusAckListeV1_.apply(null,arguments);}
  function entetePageIdleV28_(){return REG.entetePageIdleV28_.apply(null,arguments);}
  function texteVoixNouveauteIdleV1_(){return REG.texteVoixNouveauteIdleV1_.apply(null,arguments);}
  function texteVoixTutorielIdleV1_(){return REG.texteVoixTutorielIdleV1_.apply(null,arguments);}
  function htmlProfilPseudoIdleV1_(){return REG.htmlProfilPseudoIdleV1_.apply(null,arguments);}
  function htmlReglagesMusiqueTitanIdleV1_(){return REG.htmlReglagesMusiqueTitanIdleV1_.apply(null,arguments);}
  function htmlReglagesOrageSortsIdleV1_(){return REG.htmlReglagesOrageSortsIdleV1_.apply(null,arguments);}
  function estAdminSorealIdle_(){return REG.estAdminSorealIdle_.apply(null,arguments);}

      /* Trois parties pour tout le monde (Norman, 2026-10-26) : A (la tienne), B et C (essais, hors classement et hors « En direct »). Un clic sur une partie la remplace par la précédente, la page se recharge. */
      function rendrePartiesDevIdleV1_(){
        const p=REG.idlePartieDevV1;
        if(!p||!p.parties)return '';
        function bouton(cle,titre,detail){
          const active=p.partie===cle;
          /* Boutons du jeu (expand-button) : la partie active n'est pas grisée mais entourée d'un anneau doré. */
          return '<button type="button" class="soreal-idle-expand-button-v25 soreal-idle-parties-dev-bouton-v1'+(active?' actif':'')+'" '+
            (active?'aria-pressed="true" aria-current="true" style="outline:3px solid #ffd45a;outline-offset:2px;cursor:default" ':'aria-pressed="false" onclick="window.__changerPartieDevIdleV1__(\''+cle+'\')" ')+'>'+
            '<b>'+(active?'✔ ':'')+titre+'</b><span style="display:block;font-size:12px;opacity:.85;font-weight:400">'+detail+'</span></button>';
        }
        return '<div class="soreal-idle-section-v8">'+
          '<div class="soreal-idle-window-title-v31">🎮 Mes parties</div>'+
          '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">Trois parties indépendantes : clique sur l’une d’elles pour y jouer. La A est ta partie principale ; la B et la C servent à essayer autre chose, sans toucher à la A. Les autres joueurs ne les voient pas. Le bouton « Tout recommencer » ci-dessous ne concerne que la partie active.</div>'+
          '<div class="soreal-idle-parties-dev-v1">'+
            bouton('a','Partie A','Ma partie principale')+
            bouton('b','Partie B','Pour essayer')+
            bouton('c','Partie C','Pour essayer')+
          '</div>'+
          '<div style="font-size:14px;color:#dce5f3;margin-top:8px">Partie active : <b>'+(p.partie==='c'?'C':p.partie==='b'?'B':'A')+'</b></div>'+
          (p.actif&&p.partie!=='a'?'<div style="margin-top:10px"><button type="button" class="soreal-idle-expand-button-v25 soreal-idle-parties-dev-bouton-v1" onclick="window.__copierPartieADevIdleV1__()"><b>Copier la partie A ici</b><span>Mêmes conditions que ta vraie partie (A n’est pas modifiée)</span></button></div>':'')+
        '</div>';
      }

      function jouerEffetAudioIdleV199_(nom){
        const audio=window.__SOREAL_IDLE_AUDIO_V199__;
        if(!audio)return false;

        if(typeof audio.play==='function'){
          try{return Boolean(audio.play(String(nom||'')));}catch(_){return false;}
        }

        const fn=audio[String(nom||'')];
        if(typeof fn==='function'){
          try{return Boolean(fn());}catch(_){return false;}
        }

        return false;
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-312 */
      function textesNormanSebastienIdleV204_(j){
        const bossVaincus=idleEntier_(j&&j.bossVaincus);
        const groupes=[
          {
            nom:'Début du jeu',
            visible:true,
            pages:REG.TUTORIEL_DEBUT_JEU_PAGES_V1
          },
          {
            nom:'Premier boss',
            visible:bossVaincus>=1,
            pages:REG.TUTORIEL_PREMIER_BOSS_PAGES_V1
          },
          {
            nom:'Aventure & Rebirth',
            visible:menuDisponibleIdleV28_('aventure',j),
            pages:REG.TUTORIEL_AVENTURE_PAGES_V1
          }
        ];
        const sorties=[];

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-313 */
        groupes.forEach(function(groupe){
          if(!groupe.visible)return;
          const pages=Array.isArray(groupe.pages)?groupe.pages:[];
          pages.forEach(function(page,index){
            if(!page)return;
            sorties.push({
              groupe:groupe.nom,
              titre:String(page.titre||'Introduction'),
              sousTitre:String(page.sousTitre||''),
              index:index+1,
              total:pages.length,
              paragraphes:Array.isArray(page.paragraphes)?page.paragraphes:[],
              _brut:page._brut||null,
              _cle:page._cle||''
            });
          });
        });

        return sorties;
      }

      /*
       * 2026-09-24 (Norman) : « Info doit être un menu qui s'ouvre et se ferme, comme le coffre. De base, il doit être fermé. »
       * Même mécanique que le Coffre : titre cliquable + chevron, état gardé dans localStorage, fermé tant que rien n'est stocké.
       */
      /*
       * « Special Prize » — dans le jeu il vit dans « Info 'n Stuff » (Tips N' Tricks) : 50 000 AP, ou A PRETTY KITTY (qui donne aussi les AP) ;
       * une seule fois, hors bonus d'AP. Le second clic répond « Nice try, greedypants ».
       */
      function carteSpecialPrizeIdleV1_(){
        const portraits=REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.portraits;
        const prix=portraits&&portraits.specialPrize;
        if(!prix)return '';
        const ap=idleEntier_(prix.ap).toLocaleString('fr-FR');
        const corps=prix.claimed
          ?'<div class="soreal-idle-note-v4">Déjà récupéré ('+(prix.choice==='kitty'?'le joli chaton et ':'')+ap+' AP). Bien essayé, gourmand !'+(prix.choice==='kitty'?' Ton chaton t’attend dans tes Player Portraits (Achievements).':'')+'</div>'
          :'<div class="soreal-idle-note-v4">Une seule fois, au choix (sans bonus d’AP) :</div>'+
            '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">'+
              '<button type="button" class="soreal-idle-offre-bouton-v1" onclick="window.__actionMetaIdleV130__({action:\'specialPrize\',choice:\'ap\'})"><b>Offre unique</b><small>💠 '+ap+' AP</small></button>'+
              '<button type="button" class="soreal-idle-offre-bouton-v1" onclick="window.__actionMetaIdleV130__({action:\'specialPrize\',choice:\'kitty\'})"><b>Offre unique</b><small>🐱 Un JOLI CHATON + '+ap+' AP</small></button>'+
            '</div>';
        return '<div class="soreal-idle-offre-v1" id="sorealIdleSpecialPrizeV1">'+
          '<div class="soreal-idle-offre-titre-v1">🎁 Special Prize</div>'+corps+
        '</div>';
      }

      /*
       * Notes de mise à jour (Norman, 2026-09-25) : données dans modules/release-notes-v1.js (une entrée en tête à chaque mise à jour).
       * Dépliées seulement à la demande ; l'état est mémorisé sur cet appareil.
       */
      function notesMajIdleV1_(){
        const n=window.__SOREAL_IDLE_RELEASE_NOTES_V1__;
        return n&&Array.isArray(n.versions)?n:{courante:'?',versions:[]};
      }

      /* Date d'une version en toutes lettres (Norman, 2026-10-14 : « je veux les dates des patchs, même les anciens ») : 2026-10-14 -> 14 octobre 2026 (anglais : October 14, 2026). */
      function dateNotesMajIdleV1_(iso){
        const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso||''));
        if(!m)return String(iso||'');
        const en=langueIdleV1_()==='en';
        const mois=en
          ?['January','February','March','April','May','June','July','August','September','October','November','December']
          :['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
        const jour=Number(m[3]),nom=mois[Number(m[2])-1]||'';
        return en?nom+' '+jour+', '+m[1]:(jour===1?'1er':String(jour))+' '+nom+' '+m[1];
      }

      function notesMajOuvertesIdleV1_(){
        try{
          return localStorage.getItem('soreal_idle_notes_maj_ouvert_v1')==='1';
        }catch(e){
          return false;
        }
      }

      function basculerNotesMajIdleV1_(){
        try{
          localStorage.setItem('soreal_idle_notes_maj_ouvert_v1',notesMajOuvertesIdleV1_()?'0':'1');
        }catch(e){}
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(root&&REG.idleEtat)rafraichirMenuRacineIdleV28_();
      }

      /*
       * Langue des items et des textes (Norman, 2026-10-03) : Français (traduit) ou English (les originaux de ce qui a été traduit). Mémorisée sur cet appareil ; le serveur traduit ses réponses
       * d'après le champ « langue » que le pont envoie (standalone-bridge.js).
       */
      function langueIdleV1_(){
        try{return localStorage.getItem('soreal_idle_langue_v1')==='en'?'en':'fr';}catch(_e){return 'fr';}
      }

      function htmlReglagesLangueIdleV1_(){
        const l=langueIdleV1_();
        const bouton=function(code,libelle){
          return '<button type="button" class="soreal-idle-expand-button-v25" aria-pressed="'+(l===code?'true':'false')+'" '+(l===code?'disabled ':'')+
            'onclick="window.__changerLangueIdleV1__(\''+code+'\')">'+libelle+'</button>';
        };
        return '<div class="soreal-idle-section-v8">'+
          '<div class="soreal-idle-window-title-v31">🌐 Langue des objets et des textes</div>'+
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">'+bouton('fr','Français')+bouton('en','English')+'</div>'+
        '</div>';
      }

      /*
       * Thème d'images (Norman, 2026-10-30) : « dans les options, je veux pouvoir activer le thème Magic ». Remplace les images des boss, des zones et des zones sûres (modules/theme-images-v1.js). Mémorisé dans le compte
       * (clé soreal_idle_theme_v1). Ne dévoile rien : les images ne se chargent que pour ce que le joueur rencontre.
       */
      function htmlReglagesThemeIdleV1_(){
        const T=window.__SOREAL_IDLE_THEME_V1__;
        if(!T)return '';
        const actuel=T.theme();
        const bouton=function(code,libelle){
          return '<button type="button" class="soreal-idle-expand-button-v25" aria-pressed="'+(actuel===code?'true':'false')+'" '+(actuel===code?'disabled ':'')+
            'onclick="window.__changerThemeIdleV1__(\''+code+'\')">'+libelle+'</button>';
        };
        return '<div class="soreal-idle-section-v8">'+
          '<div class="soreal-idle-window-title-v31">🎨 Thème des images</div>'+
          '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">Le thème Magic remplace les images des boss, des zones et des zones sûres. La première fois que tu croises une image avec ce thème, l’ancienne reste 5 secondes, puis la nouvelle apparaît en fondu ; ensuite elle s’affiche directement.</div>'+
          '<div style="display:flex;gap:8px;flex-wrap:wrap">'+bouton('','Normal')+bouton('magic','Magic')+'</div>'+
        '</div>';
      }
      window.__changerThemeIdleV1__=function(code){
        const T=window.__SOREAL_IDLE_THEME_V1__;
        if(!T)return;
        T.definir(code);
        try{rafraichirMenuRacineIdleV28_();}catch(_e){}
      };

      function htmlReglagesAudioIdleV1_(){
        const r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
        const lignes=[
          ['voix','🎙️ Voix'],
          ['ambiance','🎶 Ambiance'],
          ['musique','🎵 Musique'],
          ['interface','🔔 Sons de l’interface']
        ];
        return '<div class="soreal-idle-section-v8">'+
          '<div class="soreal-idle-window-title-v31">🔊 Audio</div>'+
          '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">Règle le volume des voix (narration), des sons d’ambiance, des musiques (Blood Magic et boutique EXP) et des sons de l’interface. Décoche une case pour couper complètement l’option.</div>'+
          lignes.map(function(l){
            const type=l[0];
            const actif=r&&r.getActif?r.getActif(type):true;
            const pct=Math.round((r&&r.getReglage?r.getReglage(type):.75)*100);
            return '<div id="sorealIdleVolumeLigneV1_'+type+'" style="margin-bottom:12px;opacity:'+(actif?1:.5)+'">'+
              '<label style="display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:14px;color:#dce5f3;margin-bottom:4px">'+
                '<span style="display:flex;align-items:center;gap:8px"><input type="checkbox" '+(actif?'checked ':'')+'onchange="window.__basculerSonIdleV1__(\''+type+'\',this.checked)" title="Décoche pour couper complètement"> '+l[1]+'</span>'+
                '<span id="sorealIdleVolumeValeurV1_'+type+'">'+pct+'%</span>'+
              '</label>'+
              '<input id="sorealIdleVolumeCurseurV1_'+type+'" type="range" min="0" max="100" value="'+pct+'" '+(actif?'':'disabled ')+
                'oninput="window.__reglerVolumeIdleV1__(\''+type+'\',this.value)" style="width:100%">'+
            '</div>';
          }).join('')+
        '</div>';
      }

      function htmlReglagesDiarrheesIdleV1_(){
        const A=window.__SOREAL_IDLE_AUDIO_V199__;
        if(!REG.idlePartieDevV1||!REG.idlePartieDevV1.actif||!A||!A.diarrheeList)return '';
        const liste=A.diarrheeList();
        if(!liste.length)return '';
        return '<div class="soreal-idle-section-v8">'+
          '<div class="soreal-idle-window-title-v31">💩 Bruits de diarrhée (développement)</div>'+
          '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">Section visible seulement en développement : propositions pour l’accident du Coffre. ▶ pour écouter ; dis lesquels garder.</div>'+
          liste.map(function(x,i){
            return '<div style="display:flex;align-items:center;gap:10px;font-size:14px;color:#dce5f3;margin-bottom:8px"><span style="flex:1;min-width:0">'+(i+1)+'. '+idleHtml_(x.libelle)+'</span>'+
              '<button type="button" class="soreal-idle-expand-button-v25" aria-label="Écouter" title="Écouter ce son" onclick="window.__ecouterDiarrheeIdleV1__(\''+x.nom+'\')">▶</button></div>';
          }).join('')+
        '</div>';
      }

      function htmlReglagesSonsDefaiteIdleV1_(){
        const A=window.__SOREAL_IDLE_AUDIO_V199__;
        if(!REG.idlePartieDevV1||!REG.idlePartieDevV1.actif||!A||!A.defeatList)return '';
        return '<div class="soreal-idle-section-v8">'+
          '<div class="soreal-idle-window-title-v31">😵 Sons de défaite (développement)</div>'+
          '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">Section visible seulement en développement : les sons de défaite du jeu, tirés au hasard à chaque défaite. Le bouton ▶ te les fait écouter ; aucun réglage pour les joueurs.</div>'+
          A.defeatList().map(function(x){
            return '<div style="display:flex;align-items:center;gap:10px;font-size:14px;color:#dce5f3;margin-bottom:8px"><span style="flex:1;min-width:0">'+idleHtml_(x.libelle)+'</span>'+
              '<button type="button" class="soreal-idle-expand-button-v25" aria-label="Écouter" title="Écouter ce son" onclick="window.__ecouterSonDefaiteIdleV1__(\''+x.nom+'\')">▶</button></div>';
          }).join('')+
        '</div>';
      }

      function effetVisuelActifIdleV1_(e){
        try{const v=localStorage.getItem(e.cle);return e.defaut===false?v==='1':v!=='0';}catch(_e){return e.defaut!==false;}
      }

      function htmlReglagesEffetsIdleV1_(){
        return '<div class="soreal-idle-section-v8">'+
          '<div class="soreal-idle-window-title-v31">✨ Effets visuels</div>'+
          '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">Décoche un effet pour alléger le jeu sur un téléphone moins puissant (la cheminée est coupée par défaut : coche-la pour l’allumer). Ils n’apparaissent que si tu entends la piste d’ambiance correspondante.</div>'+
          REG.EFFETS_VISUELS_IDLE_V1.map(function(e){
            return '<label style="display:flex;align-items:center;gap:10px;font-size:14px;color:#dce5f3;margin-bottom:8px">'+
              '<input type="checkbox" '+(effetVisuelActifIdleV1_(e)?'checked ':'')+'onchange="window.__basculerEffetIdleV1__(\''+e.id+'\',this.checked)">'+
              '<span>'+e.libelle+'</span></label>';
          }).join('')+
        '</div>';
      }

      /*
       * Notes regroupées par menu (Norman, 2026-10-11). Anti-spoil (règle n°2) : un groupe n'est montré que si le joueur possède DÉJÀ ce menu (il figure dans son menu de gauche) ; le groupe « Général » est toujours visible.
       * Les notes écrites avec l'ancien format (« points ») restent affichées telles quelles.
       */
      function menusPossedesNotesMajIdleV1_(){
        const ids={general:true};
        try{
          document.querySelectorAll('.soreal-idle-nav-v28 [data-menu-id-v1]').forEach(function(b){ids[b.getAttribute('data-menu-id-v1')]=true;});
        }catch(e){}
        /* « Titans » n'est pas un menu de gauche : c'est le bouton de la page Aventure, ouvert dès qu'un titan est accessible (même condition que ce bouton). */
        try{
          const H=window.__SOREAL_IDLE_META_HOST_V130__;
          const av=H&&typeof H.aventureMetaIdleV47_==='function'&&REG.idleEtat?H.aventureMetaIdleV47_(REG.idleEtat):null;
          if(av&&Array.isArray(av.titans)&&av.titans.some(function(t){return t&&t.progressionUnlocked!==false;}))ids.titans=true;
        }catch(e){}
        return ids;
      }

      function htmlVersionNotesMajIdleV1_(v,possedes){
        if(Array.isArray(v.groupes)){
          return v.groupes.filter(function(g){return g&&Array.isArray(g.points)&&g.points.length&&possedes[g.menu];}).map(function(g){
            return '<div class="soreal-idle-notes-maj-groupe-v1"><div class="soreal-idle-notes-maj-menu-v1">'+idleHtml_(g.titre||g.menu)+'</div>'+
              '<ul>'+g.points.map(function(p){return '<li>'+idleHtml_(p)+'</li>';}).join('')+'</ul></div>';
          }).join('');
        }
        return '<ul>'+(v.points||[]).map(function(p){return '<li>'+idleHtml_(p)+'</li>';}).join('')+'</ul>';
      }

      function htmlNotesMajIdleV1_(){
        const notes=notesMajIdleV1_();
        if(!notes.versions.length)return '';
        const ouvert=notesMajOuvertesIdleV1_();
        const possedes=menusPossedesNotesMajIdleV1_();
        return '<button type="button" class="soreal-idle-expand-button-v25 soreal-idle-notes-maj-bouton-v1" aria-expanded="'+ouvert+'" '+
            'onclick="window.__basculerNotesMajIdleV1__()">'+(ouvert?'▾':'▸')+' 📝 Notes de mise à jour</button>'+
          (ouvert
            ?'<div class="soreal-idle-notes-maj-v1">'+
              notes.versions.filter(function(v,i){return i===Math.min(REG.notesMajPageIdleV1_,notes.versions.length-1);}).map(function(v){
                const i=notes.versions.indexOf(v),total=notes.versions.length;
                return '<div class="soreal-idle-notes-maj-version-v1'+(i===0?' derniere':'')+'">'+
                  '<div class="soreal-idle-notes-maj-titre-v1"><b>Beta '+idleHtml_(v.version)+'</b> · '+idleHtml_(v.nom)+
                    '<span>'+idleHtml_(dateNotesMajIdleV1_(v.date))+'</span></div>'+
                  htmlVersionNotesMajIdleV1_(v,possedes)+
                  ((v.hommage||notes.hommage)?'<div class="soreal-idle-notes-maj-hommage-v1">'+idleHtml_(v.hommage||notes.hommage)+'</div>':'')+
                '</div>'+
                '<div class="soreal-idle-notes-maj-pages-v1">'+
                  '<button type="button" onclick="window.__pageNotesMajIdleV1__(1)"'+(i>=total-1?' disabled':'')+'>◀ Plus ancienne</button>'+
                  '<span>'+(i+1)+' / '+total+'</span>'+
                  '<button type="button" onclick="window.__pageNotesMajIdleV1__(-1)"'+(i<=0?' disabled':'')+'>Plus récente ▶</button>'+
                '</div>';
              }).join('')+
            '</div>'
            :'');
      }

      function idleInfoOuvertV1_(){
        try{
          return localStorage.getItem('soreal_idle_info_ouvert_v1')==='1';
        }catch(e){
          return false;
        }
      }

      function toggleInfoOuvertIdleV1_(){
        try{
          localStorage.setItem('soreal_idle_info_ouvert_v1',idleInfoOuvertV1_()?'0':'1');
        }catch(e){}
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(root&&REG.idleEtat)rafraichirMenuRacineIdleV28_();
      }

      /*
       * Refonte du menu Réglages (Norman, 2026-10-25 : « on va nettoyer le menu Réglages : enlève les menus (Développement) et (Administrateur), et fais une refonte complète pour que tout soit plus clair »). Quatre catégories, une à la fois (onglets) :
       * Mon jeu (profil, classement, langue, 3e ressource), Son et image (audio, musique, effets visuels), Ma partie (sauvegardes ; réinitialisation avec saisie d'un mot de confirmation) et Infos (explications, version et notes, signaler un bug).
       * Les blocs « Développement » (parties A/B, bruits de diarrhée, sons de défaite) et « Administrateur » (accès à SOREAL IDLE, outils de test) ne sont plus dans ce menu.
       */
      const REGLAGES_ONGLETS_IDLE_V1=[
        {id:'jeu',icone:'👤',nom:'Mon jeu',aide:'Ton profil, ta place dans le classement et la langue.'},
        {id:'son',icone:'🔊',nom:'Son et image',aide:'Le volume, les musiques et les effets visuels.'},
        {id:'partie',icone:'💾',nom:'Ma partie',aide:'Sauvegarder, changer d’appareil, tout recommencer.'},
        {id:'infos',icone:'ℹ️',nom:'Infos',aide:'Explications des menus, version et signalement de bug.'}
      ];
      function reglagesOngletActifIdleV1_(){
        let id='jeu';
        try{id=String(localStorage.getItem('soreal_idle_reglages_onglet_v1')||'jeu');}catch(_e){}
        return REGLAGES_ONGLETS_IDLE_V1.some(function(o){return o.id===id;})?id:'jeu';
      }
      window.__reglagesOngletIdleV1__=function(id){
        try{localStorage.setItem('soreal_idle_reglages_onglet_v1',String(id));}catch(_e){}
        try{rafraichirMenuRacineIdleV28_();}catch(_e){}
      };

      function pageParametresIdleV28_(j){
        const actif=reglagesOngletActifIdleV1_();
        const onglet=REGLAGES_ONGLETS_IDLE_V1.filter(function(o){return o.id===actif;})[0];
        let corps='';

        if(actif==='jeu'){
          corps=
            htmlProfilPseudoIdleV1_(j)+
            (j&&j.classement&&j.classement.debloque
              ?'<div class="soreal-idle-section-v8">'+
                '<div class="soreal-idle-window-title-v31">🏆 Classement</div>'+
                '<label style="display:flex;align-items:center;gap:8px;font-size:15px;color:#c9d3ee">'+
                  '<input type="checkbox" '+(j.classement.visible!==false?'checked ':'')+'onchange="window.__basculerClassementVisibleIdleV1__(this.checked)"> '+
                  'Apparaître dans le classement pour les autres joueurs'+
                '</label>'+
                '<div style="font-size:14px;color:#8b93ab;margin-top:8px">'+
                  'Décoché : ton nom n’apparaît plus dans le classement vu par les autres joueurs. Tu continues de voir ta propre place normalement.'+
                '</div>'+
              '</div>'
              :'')+
            htmlReglagesLangueIdleV1_()+
            (window.__SOREAL_IDLE_PERSO_PCT_V1__&&window.__SOREAL_IDLE_PERSO_PCT_V1__.blocReglageR3?window.__SOREAL_IDLE_PERSO_PCT_V1__.blocReglageR3():'');
        }else if(actif==='son'){
          corps=
            htmlReglagesThemeIdleV1_()+
            htmlReglagesAudioIdleV1_()+
            htmlReglagesMusiqueTitanIdleV1_()+
            htmlReglagesOrageSortsIdleV1_()+
            htmlReglagesEffetsIdleV1_();
        }else if(actif==='partie'){
          corps=
            rendrePartiesDevIdleV1_()+
            (window.__SOREAL_IDLE_MOTEUR_LOCAL_V1__&&window.__SOREAL_IDLE_MOTEUR_LOCAL_V1__.actif()
              ?'<div class="soreal-idle-section-v8" id="sorealIdlePartieServeurV1">'+
                '<div class="soreal-idle-window-title-v31">☁️ Ma partie</div>'+
                '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">'+
                  'Ta partie se joue sur cet appareil et part vers le serveur toute seule. Avant de changer d’appareil, envoie-la tout de suite, puis ouvre le jeu sur l’autre.'+
                '</div>'+
                '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__envoyerPartieServeurIdleV1__(this)">☁️ Envoyer ma partie vers le serveur</button>'+
                '<div id="sorealIdlePartieServeurEtatV1" style="font-size:14px;color:#8b93ab;margin-top:8px"></div>'+
                '<div style="font-size:14px;color:#8b93ab;margin:14px 0 10px">'+
                  'Tu peux aussi enregistrer ta partie dans un fichier sur ton appareil, puis la recharger plus tard : elle reprend exactement là où tu l’as sauvegardée.'+
                '</div>'+
                '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
                  '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__exporterPartieIdleV1__(this)">💾 Exporter ma partie</button>'+
                  '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__choisirPartieIdleV1__()">📂 Charger une partie</button>'+
                '</div>'+
                '<input type="file" id="sorealIdlePartieFichierChoixV1" accept=".json,application/json" style="display:none" onchange="window.__lirePartieIdleV1__(this)">'+
                '<div id="sorealIdlePartieFichierEtatV1" style="font-size:14px;color:#8b93ab;margin-top:8px"></div>'+
              '</div>'
              :'')+
            (window.__SOREAL_IDLE_LIAISON_V1__?window.__SOREAL_IDLE_LIAISON_V1__.sectionHtml():'')+
            (window.__SOREAL_IDLE_STEAM_V1__?window.__SOREAL_IDLE_STEAM_V1__.sectionHtml():'')+
            '<div class="soreal-idle-section-v8 rg-danger-v1">'+
              '<div class="soreal-idle-window-title-v31">⚠️ Tout recommencer</div>'+
              '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">Efface entièrement la progression SOREAL NGU IDLE et recrée le personnage comme lors de la première ouverture. Cette action est irréversible : il faudra taper un mot pour la confirmer.</div>'+
              '<button type="button" class="soreal-idle-danger-button-v67" onclick="window.__ouvrirPopupResetTotalIdleV67__()">💣 Réinitialiser entièrement SOREAL NGU IDLE</button>'+
            '</div>';
        }else{
          const infosParMenu=idleInfosParMenuIdleV1_(j);
          const infoOuvert=idleInfoOuvertV1_();
          const vus=idleMenusAckListeV1_(j);
          const entrees=vus
            .map(function(menuId){return infosParMenu[menuId];})
            .filter(Boolean);
          const introsNormanSebastien=textesNormanSebastienIdleV204_(j);
          corps=
            '<div class="soreal-idle-section-v8">'+
              '<div class="soreal-idle-window-title-v31 soreal-idle-info-titre-v1" '+
                'onclick="window.__toggleInfoOuvertIdleV1__()" '+
                'role="button" tabindex="0" aria-expanded="'+(infoOuvert?'true':'false')+'">'+
                '<span>ℹ️ Info</span>'+
                '<span class="soreal-idle-coffre-chevron-v1">'+(infoOuvert?'▲':'▼')+'</span>'+
              '</div>'+
              (infoOuvert?
              carteSpecialPrizeIdleV1_()+
              '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">Revoir les explications des menus déjà débloqués. Chaque texte peut être relu à voix haute avec la synthèse vocale de ton appareil.</div>'+
              (entrees.length
                ?entrees.map(function(info,index){
                  const targetId='sorealIdleInfoRecapV203_'+index;
                  return '<div id="'+targetId+'" class="soreal-idle-info-recap-card-v1" data-soreal-tts-say="'+idleHtml_(texteVoixNouveauteIdleV1_(info))+'">'+
                    '<div class="soreal-idle-info-recap-head-v1">'+idleHtml_(info.icon||'✨')+' <b>'+idleHtml_(info.titre||'')+'</b></div>'+
                    (info.intro?'<div class="soreal-idle-info-recap-intro-v1">'+idleHtml_(info.intro)+'</div>':'')+
                    (info.texte?'<div>'+idleHtml_(info.texte)+'</div>':'')+
                    (Array.isArray(info.bullets)
                      ?'<div class="soreal-idle-news-bullets-v75">'+
                        info.bullets.map(function(texte){
                          return '<div class="soreal-idle-news-bullet-v75">'+idleHtml_(texte)+'</div>';
                        }).join('')+
                        '</div>'
                      :'')+
                    '<button type="button" class="soreal-idle-tts-read-v203" data-soreal-tts-target="'+targetId+'">🔊 Lire ce texte</button>'+
                    (info._cle&&window.__SOREAL_IDLE_TEXTES_V1__?' '+window.__SOREAL_IDLE_TEXTES_V1__.boutonHtml(info._cle):'')+
                  '</div>';
                }).join('')
                :'<div style="font-size:14px;color:#5b6178">Aucun panneau d’information consulté pour l’instant.</div>'
              )+
              '<div class="soreal-idle-window-title-v31" style="margin-top:16px">🎙️ Norman & Sébastien</div>'+
              '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">Retrouve ici toutes les pages des introductions et tutoriels de Norman & Sébastien déjà rencontrées dans ta partie. Tu peux tout relire ou lancer le Text-to-Speech page par page.</div>'+
              (introsNormanSebastien.length
                ?introsNormanSebastien.map(function(info,index){
                  const targetId='sorealIdleNarrateursV203_'+index;
                  return '<div id="'+targetId+'" class="soreal-idle-info-recap-card-v1" data-soreal-tts-say="'+idleHtml_(texteVoixTutorielIdleV1_(info,index>0&&introsNormanSebastien[index-1].groupe===info.groupe?introsNormanSebastien[index-1]:null))+'">'+
                    '<div class="soreal-idle-info-recap-head-v1">🎙️ <b>'+idleHtml_(info.groupe)+' · '+idleHtml_(info.titre)+'</b></div>'+
                    '<div style="font-size:12px;color:#7f8aa4;margin:4px 0 7px">Page '+idleEntier_(info.index)+' / '+idleEntier_(info.total)+(info.sousTitre?' · '+idleHtml_(info.sousTitre):'')+'</div>'+
                    '<div class="soreal-idle-info-recap-intro-v1">'+
                      info.paragraphes.map(function(texte){
                        return '<div style="margin-bottom:7px">'+idleHtml_(texte)+'</div>';
                      }).join('')+
                    '</div>'+
                    '<button type="button" class="soreal-idle-tts-read-v203" data-soreal-tts-target="'+targetId+'">🔊 Lire ce texte</button>'+
                  '</div>';
                }).join('')
                :'<div style="font-size:14px;color:#5b6178">Aucune intervention disponible pour l’instant.</div>'
              ):'')+
            '</div>'+
            '<div class="soreal-idle-section-v8">'+
              '<div class="soreal-idle-window-title-v31">Version</div>'+
              '<div style="font-size:14px;color:#8b93ab">Build <b style="color:#dce5f3">Beta '+idleHtml_(notesMajIdleV1_().courante)+'</b>'+
                (notesMajIdleV1_().versions[0]?' · '+idleHtml_(notesMajIdleV1_().versions[0].nom):'')+'</div>'+
              htmlNotesMajIdleV1_()+
            '</div>'+
            (window.__SOREAL_IDLE_BUG_REPORT_V1__?window.__SOREAL_IDLE_BUG_REPORT_V1__.html(estAdminSorealIdle_()):'');
        }

        return entetePageIdleV28_(
          '⚙️ Settings',
          ''
        )+
          '<div class="rg-onglets-v1" role="tablist">'+
            REGLAGES_ONGLETS_IDLE_V1.map(function(o){
              return '<button type="button" role="tab" aria-selected="'+(o.id===actif?'true':'false')+'" class="rg-onglet-v1'+(o.id===actif?' actif':'')+'" data-onglet="'+o.id+'" onclick="window.__reglagesOngletIdleV1__(this.dataset.onglet)">'+
                '<i>'+o.icone+'</i><b>'+o.nom+'</b></button>';
            }).join('')+
          '</div>'+
          '<div class="rg-aide-v1">'+onglet.aide+'</div>'+
          corps;
      }

  Object.assign(REG,{
    jouerEffetAudioIdleV199_:jouerEffetAudioIdleV199_,
    notesMajIdleV1_:notesMajIdleV1_,
    basculerNotesMajIdleV1_:basculerNotesMajIdleV1_,
    langueIdleV1_:langueIdleV1_,
    toggleInfoOuvertIdleV1_:toggleInfoOuvertIdleV1_,
    pageParametresIdleV28_:pageParametresIdleV28_
  });
})();
