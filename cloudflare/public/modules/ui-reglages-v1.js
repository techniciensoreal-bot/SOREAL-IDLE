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
  function langueIdleV1_(){return REG.langueIdleV1_.apply(null,arguments);}
  function rafraichirMenuRacineIdleV28_(){return REG.rafraichirMenuRacineIdleV28_.apply(null,arguments);}
  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function notesMajIdleV1_(){return REG.notesMajIdleV1_.apply(null,arguments);}
  function idleInfosParMenuIdleV1_(){return REG.idleInfosParMenuIdleV1_.apply(null,arguments);}
  function idleInfoOuvertV1_(){return REG.idleInfoOuvertV1_.apply(null,arguments);}
  function idleMenusAckListeV1_(){return REG.idleMenusAckListeV1_.apply(null,arguments);}
  function entetePageIdleV28_(){return REG.entetePageIdleV28_.apply(null,arguments);}
  function texteVoixNouveauteIdleV1_(){return REG.texteVoixNouveauteIdleV1_.apply(null,arguments);}
  function texteVoixTutorielIdleV1_(){return REG.texteVoixTutorielIdleV1_.apply(null,arguments);}
  function htmlProfilPseudoIdleV1_(){return REG.htmlProfilPseudoIdleV1_.apply(null,arguments);}
  function htmlReglagesMusiqueTitanIdleV1_(){return REG.htmlReglagesMusiqueTitanIdleV1_.apply(null,arguments);}
  function htmlReglagesOrageSortsIdleV1_(){return REG.htmlReglagesOrageSortsIdleV1_.apply(null,arguments);}
  function estAdminSorealIdle_(){return REG.estAdminSorealIdle_.apply(null,arguments);}

      function rendrePartiesDevIdleV1_(){
        const p=REG.idlePartieDevV1;
        if(!p||!p.actif)return '';
        function bouton(cle,titre,detail){
          const active=p.partie===cle;
          return '<button type="button" class="soreal-idle-parties-dev-bouton-v1'+(active?' actif':'')+'" '+
            (active?'disabled aria-pressed="true" ':'aria-pressed="false" onclick="window.__changerPartieDevIdleV1__(\''+cle+'\')" ')+'>'+
            '<b>'+titre+'</b><span>'+detail+'</span></button>';
        }
        return '<div class="soreal-idle-section-v8">'+
          '<div class="soreal-idle-window-title-v31">🛠️ Développement — Parties</div>'+
          '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">Uniquement pendant le développement. Deux parties indépendantes : la <b>A</b> est ta vraie partie (à ne jamais réinitialiser), la <b>B</b> se réinitialise à volonté pour comparer avec NGU IDLE. Le bouton de réinitialisation ci-dessous ne concerne que la partie active.</div>'+
          '<div class="soreal-idle-parties-dev-v1">'+
            bouton('a','Partie A','Ta vraie partie')+
            bouton('b','Partie B','Comparaison NGU IDLE')+
          '</div>'+
          '<div style="font-size:14px;color:#dce5f3;margin-top:8px">Partie active : <b>'+(p.partie==='b'?'B (comparaison)':'A (réelle)')+'</b></div>'+
          (p.partie==='b'?'<div style="margin-top:10px"><button type="button" class="soreal-idle-parties-dev-bouton-v1" onclick="window.__copierPartieADevIdleV1__()"><b>Copier la partie A ici</b><span>Mêmes conditions que ta vraie partie (A n’est pas modifiée)</span></button></div>':'')+
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

      function pageParametresIdleV28_(j){
        const infosParMenu=idleInfosParMenuIdleV1_(j);
        const infoOuvert=idleInfoOuvertV1_();
        const vus=idleMenusAckListeV1_(j);
        const entrees=vus
          .map(function(menuId){return infosParMenu[menuId];})
          .filter(Boolean);
        const introsNormanSebastien=textesNormanSebastienIdleV204_(j);

        return entetePageIdleV28_(
          '⚙️ Settings',
          ''
        )+
          rendrePartiesDevIdleV1_()+
          (window.__SOREAL_IDLE_PERSO_PCT_V1__&&window.__SOREAL_IDLE_PERSO_PCT_V1__.blocReglageR3?window.__SOREAL_IDLE_PERSO_PCT_V1__.blocReglageR3():'')+
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
          (j&&j.reglages
            ?'<div class="soreal-idle-section-v8" id="sorealIdleAccesAdminV1">'+
              '<div class="soreal-idle-window-title-v31">🔑 Accès à SOREAL IDLE (administrateur)</div>'+
              '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">'+
                'Activé : toute personne qui a déjà le trophée « Assiduité de bronze » (même si elle ne travaille plus ici) a accès à SOREAL IDLE, et le reçoit avec un popup de félicitations dans APP / TV. Désactivé : SOREAL IDLE est caché à tout le monde, sauf à toi.'+
              '</div>'+
              '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__basculerAccesOuvertIdleV1__()" '+
                'style="'+(j.reglages.accesOuvert?'background:#166534;color:#fff':'background:#7f1d1d;color:#fff')+'">'+
                (j.reglages.accesOuvert?'✅ Accès OUVERT (trophée Assiduité de bronze) — désactiver':'⛔ Accès FERMÉ — activer pour les détenteurs du trophée')+
              '</button>'+
              '<div style="font-size:14px;color:#8b93ab;margin:14px 0 10px">'+
                'Accès public : activé, toute personne qui se connecte avec un compte Google peut jouer sans passer par APP / TV (elle est vue des autres sous son pseudo). Désactivé : la connexion Google est acceptée mais le jeu reste fermé.'+
              '</div>'+
              '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__basculerAccesPublicIdleV1__()" '+
                'style="'+(j.reglages.accesPublic?'background:#166534;color:#fff':'background:#7f1d1d;color:#fff')+'">'+
                (j.reglages.accesPublic?'🌍 Accès PUBLIC ouvert (Google) — fermer':'⛔ Accès PUBLIC fermé — ouvrir aux comptes Google')+
              '</button>'+
              '<div style="margin-top:12px"><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__chargerJoueursGoogleIdleV1__()">👥 Voir les joueurs connectés par Google</button></div>'+
              '<div id="sorealIdleJoueursGoogleV1" style="margin-top:8px"></div>'+
            '</div>'
            :'')+
          htmlReglagesLangueIdleV1_()+
          htmlReglagesAudioIdleV1_()+
          htmlReglagesSonsDefaiteIdleV1_()+
          htmlReglagesDiarrheesIdleV1_()+
          htmlReglagesMusiqueTitanIdleV1_()+
          htmlReglagesOrageSortsIdleV1_()+
          htmlReglagesEffetsIdleV1_()+
          '<div class="soreal-idle-section-v8">'+
            '<div class="soreal-idle-window-title-v31">Version</div>'+
            '<div style="font-size:14px;color:#8b93ab">Build <b style="color:#dce5f3">Beta '+idleHtml_(notesMajIdleV1_().courante)+'</b>'+
              (notesMajIdleV1_().versions[0]?' · '+idleHtml_(notesMajIdleV1_().versions[0].nom):'')+'</div>'+
            htmlNotesMajIdleV1_()+
          '</div>'+
          (window.__SOREAL_IDLE_BUG_REPORT_V1__?window.__SOREAL_IDLE_BUG_REPORT_V1__.html(estAdminSorealIdle_()):'')+
          (estAdminSorealIdle_()
            ?'<div class="soreal-idle-section-v8">'+
              '<div class="soreal-idle-window-title-v31">🧪 Outils de test (administrateur)</div>'+
              '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">Les scènes spéciales (histoires) se créent, se modifient et se revoient dans le menu <b>Admin</b>.</div>'+
              '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__menuIdleV28__(\'admin\')">🛠️ Ouvrir le menu Admin</button>'+
            '</div>'
            :'')+
          '<div class="soreal-idle-section-v8">'+
            '<div class="soreal-idle-window-title-v31">Réinitialisation complète</div>'+
            '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">Efface entièrement la progression SOREAL IDLE et recrée le personnage comme lors de la première ouverture. Cette action est irréversible.</div>'+
            '<button type="button" class="soreal-idle-danger-button-v67" onclick="window.__ouvrirPopupResetTotalIdleV67__()">💣 Réinitialiser entièrement SOREAL IDLE</button>'+
          '</div>';
      }

  Object.assign(REG,{
    jouerEffetAudioIdleV199_:jouerEffetAudioIdleV199_,
    basculerNotesMajIdleV1_:basculerNotesMajIdleV1_,
    pageParametresIdleV28_:pageParametresIdleV28_
  });
})();
