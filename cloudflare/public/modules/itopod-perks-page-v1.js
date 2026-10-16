/*
 * SOREAL IDLE — pages Perks, Quirks et ITOPOD (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe).
 * Extrait tel quel de meta-progression-v130.js (même code, mêmes ponts window.__x__ pour les onclick inline).
 * Dépendances : window.__SOREAL_IDLE_META_V130__ et window.__SOREAL_IDLE_META_HOST_V130__, relus seulement à l'exécution
 * (l'ordre de chargement des <script> n'a pas d'importance). Expose window.__SOREAL_IDLE_ITOPOD_PERKS_PAGE_V1__.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_ITOPOD_PERKS_PAGE_V1__)return;

      function systemeMetaParIdIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.systemeMetaParIdIdleV130_.apply(null,arguments);}
      function actionMetaIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.actionMetaIdleV130_.apply(null,arguments);}
      function toggleSystemeMetaIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.toggleSystemeMetaIdleV130_.apply(null,arguments);}
      function emojiNomIdleV1_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.emojiNomIdleV1_.apply(null,arguments);}

/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-303 */
function pagePerksIdleV1_(j){
        const s=systemeMetaParIdIdleV130_(j,'perks');
        if(!s||!s.state||!s.state.unlocked)return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const levels=(s.state.data&&s.state.data.levels)||{};
        const defs=j&&j.systemes&&Array.isArray(j.systemes.perkDefinitions)?j.systemes.perkDefinitions:[];
        const pp=j&&j.systemes&&j.systemes.currencies?H.idleEntier_(j.systemes.currencies.pp||0):0;
        /*
         * Magasin des Perks (Norman, 2026-10-04) : une boutique à part, en vitrines (néon violet et rose, étagères) et non en rayons à auvent comme les boutiques EXP et AP ;
         * une image par achat : celle du wiki NGU Idle (https://ngu-idle.fandom.com/wiki/Perk_Points), copiée dans /perks/<numéro du perk>.webp. Aucun total (anti-spoil).
         */
        const filtre=window.__perkFiltreIdleV1__||{q:'',abordables:false};
        const q=String(filtre.q||'').trim().toLowerCase();
        const cartes=defs.map(function(perk){
          const niveau=H.idleEntier_(levels[perk.id]||0);
          const cap=H.idleEntier_(perk.cap||0);
          const auMax=niveau>=cap;
          const cout=H.idleEntier_(perk.cost||0);
          const abordable=!auMax&&pp>=cout;
          const nom=String(perk.name||('Perk '+perk.id));
          if(q&&(nom+' '+String(perk.effect||'')).toLowerCase().indexOf(q)<0)return '';
          if(filtre.abordables&&!abordable)return '';
          const barre=cap>0?Math.min(100,niveau*100/cap):0;
          return '<article class="pk-vitrine'+(auMax?' pk-max':abordable?' pk-abordable':'')+(niveau>0?' pk-possede':'')+'">'+
            '<div class="pk-socle"><img class="pk-image" src="/perks/'+H.idleEntier_(perk.id)+'.webp" alt="" loading="lazy" onerror="this.hidden=true"></div>'+
            '<div class="pk-corps">'+
              '<div class="pk-nom">'+H.idleHtml_(nom)+'</div>'+
              '<div class="pk-effet">'+H.idleHtml_(perk.effect||'')+'</div>'+
              '<div class="pk-niveau"><div class="pk-jauge"><i style="width:'+barre.toFixed(1)+'%"></i></div><span>'+niveau+' / '+cap+'</span></div>'+
            '</div>'+
            (auMax
              ?'<div class="pk-etiquette pk-etiquette-max">✔ Maximum</div>'
              :'<button type="button" class="pk-acheter" onclick="window.__acheterPerkIdleV1__('+perk.id+')"><span class="pk-prix">⭐ '+cout+' PP</span><span class="pk-achat">Acheter</span></button>')+
          '</article>';
        }).join('');
        return '<div class="pk-fond"><div class="pk-boutique">'+
            '<div class="pk-enseigne"><span class="pk-ampoules"></span><div class="pk-enseigne-texte"><small>Boutique</small><b>Perk Emporium</b></div><span class="pk-ampoules"></span></div>'+
            '<div class="pk-comptoir"><div class="pk-solde"><span>⭐ PP disponibles</span><b>'+pp+'</b></div>'+
              '<input class="pk-recherche" type="search" placeholder="Chercher un perk…" value="'+H.idleHtml_(filtre.q||'')+'" oninput="window.__perkFiltrerIdleV1__(this.value,null)">'+
              '<button type="button" class="pk-bascule'+(filtre.abordables?' actif':'')+'" onclick="window.__perkFiltrerIdleV1__(null,'+(filtre.abordables?'false':'true')+')">💰 Abordables</button>'+
            '</div>'+
            '<div class="pk-etagere">'+(cartes||'<div class="pk-vide">Aucun perk ne correspond.</div>')+'</div>'+
          '</div></div>';
      }

/* Filtre du magasin des Perks : recherche et « abordables » ; le magasin est redessiné aussitôt (la saisie garde le focus). */
function perkFiltrerIdleV1_(q,abordables){
        const f=window.__perkFiltreIdleV1__||(window.__perkFiltreIdleV1__={q:'',abordables:false});
        if(q!=null)f.q=String(q);
        if(abordables!=null)f.abordables=Boolean(abordables);
        const racine=document.querySelector('.pk-fond');
        const ancien=racine&&racine.querySelector('.pk-boutique');
        if(!ancien)return;
        const actif=document.activeElement&&document.activeElement.classList&&document.activeElement.classList.contains('pk-recherche');
        const pos=actif?document.activeElement.selectionStart:0;
        const tmp=document.createElement('div');
        tmp.innerHTML=pagePerksIdleV1_(window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat());
        const neuf=tmp.querySelector('.pk-boutique');
        if(!neuf)return;
        ancien.replaceWith(neuf);
        if(actif){const champ=racine.querySelector('.pk-recherche');if(champ){champ.focus();try{champ.setSelectionRange(pos,pos);}catch(_){}}}
      }
      window.__perkFiltrerIdleV1__=perkFiltrerIdleV1_;

function pageQuirksIdleV1_(j){
        const s=systemeMetaParIdIdleV130_(j,'quirks');
        if(!s||!s.state||!s.state.unlocked)return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        const levels=(s.state.data&&s.state.data.levels)||{};
        const defs=j&&j.systemes&&Array.isArray(j.systemes.quirkDefinitions)?j.systemes.quirkDefinitions:[];
        const qp=j&&j.systemes&&j.systemes.currencies?window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(j.systemes.currencies.qp||0):0;
        return window.__SOREAL_IDLE_META_HOST_V130__.entetePageIdleV28_('📚 Quirks','Chaque Quirk a son propre coût plat et son propre plafond. Dépense tes QP pour les améliorer une par une.')+
          '<div class="soreal-idle-summary-grid-v28"><div class="soreal-idle-summary-v28">📋 QP disponibles<b>'+qp+'</b></div></div>'+
          '<div style="display:grid;gap:10px">'+defs.map(function(quirk){
            const niveau=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(levels[quirk.id]||0);
            const cap=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(quirk.cap||0);
            const auMax=niveau>=cap;
            const cout=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(quirk.cost||0);
            return '<div class="soreal-idle-section-v8" style="margin:0">'+
              '<div style="display:flex;justify-content:space-between;gap:8px"><b>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(emojiNomIdleV1_('quirks',quirk.id,quirk.name||('Quirk '+quirk.id)))+'</b><span>'+niveau+' / '+cap+'</span></div>'+
              '<div style="font-size:14px;color:#aeb5c8;margin-top:5px">'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(quirk.effect||'')+'</div>'+
              '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">'+
                (auMax
                  ?'<span class="soreal-idle-note-v4">✔ Maximum atteint</span>'
                  :'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__acheterQuirkIdleV1__('+quirk.id+')">📚 Acheter ('+cout+' QP)</button>')+
              '</div>'+
            '</div>';
          }).join('')+'</div>';
      }

/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-304 */
function pageItopodIdleV1_(j){
        const s=systemeMetaParIdIdleV130_(j,'tower');
        if(!s||!s.state||!s.state.unlocked)return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const d=(s.state.data)||{};
        const etage=H.idleEntier_(d.floor);
        const kills=H.idleEntier_(d.kills);
        const versProchainEtage=d.killsOnFloor!=null?H.idleEntier_(d.killsOnFloor):kills%10;
        const plusHaut=H.idleEntier_(d.highestFloor||d.floor);
        const optimal=H.idleEntier_(d.optimalFloor);
        const auto=d.startFloor==null||d.endFloor==null;
        /* Mode Auto : la montée part de l étage où tu es (elle ne repart jamais de 0) ; le champ « Départ » le montre au lieu d afficher 0 (Norman, 2026-10-07 : « départ 0, arrivée 18 » semblait un redémarrage). */
        const debut=H.idleEntier_(d.startFloor==null?etage:d.startFloor);
        const fin=H.idleEntier_(d.endFloor==null?optimal:d.endFloor);
        const ppProgress=Math.max(0,H.idleNombre_(d.ppProgress));
        const pp=H.idleEntier_((j&&j.systemes&&j.systemes.currencies&&j.systemes.currencies.pp)||0);
        const pourcent=Math.max(0,Math.min(100,ppProgress/10000));
        /* Champ de saisie « jeu vidéo » : valeur au centre, − et + de part et d'autre. */
        const champ=function(id,libelle,valeur){
          return '<div class="itp-champ"><label for="'+id+'">'+libelle+'</label>'+
            '<div class="itp-pas"><button type="button" class="itp-pas-bouton" aria-label="Moins" onclick="window.__itopodPasIdleV1__(this,-1)">−</button>'+
            '<input id="'+id+'" class="itp-saisie" type="number" inputmode="numeric" min="0" max="1600" value="'+valeur+'">'+
            '<button type="button" class="itp-pas-bouton" aria-label="Plus" onclick="window.__itopodPasIdleV1__(this,1)">+</button></div></div>';
        };
        const tuile=function(icone,libelle,valeur){return '<div class="itp-tuile"><span class="itp-tuile-icone">'+icone+'</span><span class="itp-tuile-libelle">'+libelle+'</span><b>'+valeur+'</b></div>';};
        const atouts=systemeMetaParIdIdleV130_(j,'perks');
        const atoutsOuverts=Boolean(atouts&&atouts.state&&atouts.state.unlocked);
        const vueAtouts=atoutsOuverts&&window.__itopodVueIdleV1__==='atouts';
        return H.entetePageIdleV28_(
          '🏢 ITOPOD',
          'Une tour sans fin : bats 10 ennemis pour monter d’un étage. Chaque ennemi vaincu te rapporte des PPP ('+(j&&j.systemes&&j.systemes.difficulty==='extreme'?2000:j&&j.systemes&&j.systemes.difficulty==='difficile'?700:200)+' + le numéro de l’étage). À 1 000 000 PPP, tu gagnes 1 PP à dépenser dans les Atouts. Tu choisis l’étage de départ et l’étage de fin : arrivé au bout, tu repars du départ.'
        )+
        (atoutsOuverts?'<div class="itp-vues"><button type="button" class="itp-bouton itp-bouton-atouts" onclick="window.__itopodVueIdleV1_basculer__()">'+(vueAtouts?'🏢 Retour à la tour':'⭐ Atouts')+'</button></div>':'')+
        (atoutsOuverts?'<div class="itp-vue-atouts"'+(vueAtouts?'':' hidden')+'>'+pagePerksIdleV1_(j)+'</div>':'')+
        '<div class="itp-page"'+(vueAtouts?' hidden':'')+'>'+
          (window.__SOREAL_IDLE_ITOPOD_SCENE_V1__?window.__SOREAL_IDLE_ITOPOD_SCENE_V1__.html(Object.assign({},d,{actif:Boolean(s.state.active)})):'')+
          '<section class="itp-panneau itp-entree">'+
            '<button type="button" class="itp-bouton itp-bouton-entrer'+(s.state.active?' itp-en-cours':'')+'" onclick="window.__itopodBasculerIdleV1__()">'+(s.state.active?'🚪 Quitter l’ITOPOD':'⚔️ Entrer dans l’ITOPOD')+'</button>'+
            '<div class="itp-mode">'+(s.state.active?'Tu combats les ennemis à la chaîne.':'Entre dans la tour pour combattre les ennemis à la chaîne.')+'</div>'+
            (d.hitsParKill===0?'<div class="itp-mode itp-alerte">Tu n’es pas encore assez fort pour avancer dans la tour : monte ta Puissance d’Aventure.</div>':'')+
          '</section>'+
          '<section class="itp-panneau itp-montee">'+
            '<div class="itp-titre">🪜 Étages à gravir</div>'+
            '<div class="itp-mode">'+(auto?'Montée automatique jusqu’à l’étage optimal':(debut===fin?'Étage fixé : '+debut+(debut===optimal?' (ton meilleur étage)':''):'Départ '+debut+' → fin '+fin))+'</div>'+
            '<div class="itp-champs">'+champ('itopodDebutV1','Départ',debut)+champ('itopodFinV1','Fin',fin)+'</div>'+
            '<div class="itp-actions">'+
              '<button type="button" class="itp-bouton" onclick="window.__itopodEtagesIdleV1__()">Appliquer</button>'+
              '<button type="button" class="itp-bouton itp-bouton-auto" title="Règle tes étages sur ton meilleur étage (l’étage optimal du moment). Reclique plus tard pour le remettre à jour." onclick="window.__itopodAutoIdleV1__()">Auto</button>'+
            '</div>'+
          '</section>'+
          '<section class="itp-panneau">'+
            '<div class="itp-titre">📊 Progression</div>'+
            '<div class="itp-tuiles">'+
              tuile('🏢','Étage',etage)+
              tuile('⭐','PP disponibles',pp)+
              tuile('🗡️','Ennemis vaincus',H.formatGrandNombreIdleV70_(kills))+
              tuile('⬆️','Prochain étage',versProchainEtage+' / 10')+
              tuile('🏔️','Étage le plus haut',plusHaut)+
              tuile('🎯','Étage optimal',optimal)+
            '</div>'+
            '<div class="itp-pp"><div class="itp-pp-ligne"><span>🔷 Progression PP</span><b>'+Math.floor(ppProgress).toLocaleString('fr-FR')+' / 1 000 000</b></div>'+
              '<div class="itp-pp-barre"><div class="itp-pp-rempli" style="width:'+pourcent.toFixed(2)+'%"></div></div></div>'+
          '</section>'+
        '</div>';
      }

/* Bouton « Atouts » de la page ITOPOD : bascule entre la tour et la boutique des Atouts (ancien menu à part), sans rien redessiner. */
function itopodVueIdleV1_basculer_(){
        const vers=window.__itopodVueIdleV1__==='atouts'?'tour':'atouts';
        window.__itopodVueIdleV1__=vers;
        const a=document.querySelector('.itp-vue-atouts');
        const t=document.querySelector('.itp-page');
        const b=document.querySelector('.itp-bouton-atouts');
        if(a)a.hidden=vers!=='atouts';
        if(t)t.hidden=vers==='atouts';
        if(b)b.textContent=vers==='atouts'?'🏢 Retour à la tour':'⭐ Atouts';
      }
      window.__itopodVueIdleV1_basculer__=itopodVueIdleV1_basculer_;

/* Mise à jour en direct des chiffres de la page ITOPOD (étage, ennemis vaincus, PP, progression) sans toucher à la scène animée ni aux champs d'étage. */
function rafraichirItopodIdleV1_(j){
        const vivant=document.querySelector('.itp-page');
        if(!vivant)return;
        const tmp=document.createElement('div');
        /* La scène animée est mise de côté pendant ce calcul : son HTML réinitialise le combat de l'écran (coups, ennemi suivant) ; sans cette précaution les ennemis ne défilaient plus (toujours le même, remis à zéro toutes les 4 s). */
        const scene=window.__SOREAL_IDLE_ITOPOD_SCENE_V1__;
        window.__SOREAL_IDLE_ITOPOD_SCENE_V1__=null;
        try{tmp.innerHTML=pageItopodIdleV1_(j);}finally{window.__SOREAL_IDLE_ITOPOD_SCENE_V1__=scene;}
        const neuf=tmp.querySelector('.itp-page');
        if(!neuf)return;
        const copier=function(racineVive,racineNeuve,sel){
          const a=racineVive.querySelectorAll(sel),b=racineNeuve.querySelectorAll(sel);
          a.forEach(function(e,i){if(b[i]&&e.textContent!==b[i].textContent)e.textContent=b[i].textContent;});
        };
        copier(vivant,neuf,'.itp-tuile b');
        copier(vivant,neuf,'.itp-pp-ligne b');
        const barreVive=vivant.querySelector('.itp-pp-rempli'),barreNeuve=neuf.querySelector('.itp-pp-rempli');
        if(barreVive&&barreNeuve&&barreVive.style.width!==barreNeuve.style.width)barreVive.style.width=barreNeuve.style.width;
        /* Solde de PP de la boutique des Atouts (même page). */
        const soldeVif=document.querySelector('.pk-solde b'),soldeNeuf=tmp.querySelector('.pk-solde b');
        if(soldeVif&&soldeNeuf&&soldeVif.textContent!==soldeNeuf.textContent)soldeVif.textContent=soldeNeuf.textContent;
      }
      window.__rafraichirItopodIdleV1__=rafraichirItopodIdleV1_;

/* Entrer dans la tour / la quitter (le combat à la chaîne ne tourne que tour ouverte). */
function itopodBasculerIdleV1_(){
        toggleSystemeMetaIdleV130_('tower');
      }
      window.__itopodBasculerIdleV1__=itopodBasculerIdleV1_;

/* Boutons − et + des champs d'étage : un pas de 1, borné à 0–1600 comme la saisie. */
function itopodPasIdleV1_(bouton,delta){
        const el=bouton&&bouton.parentNode?bouton.parentNode.querySelector('input'):null;
        if(!el)return;
        el.value=String(Math.max(0,Math.min(1600,(Number(el.value)||0)+(Number(delta)||0))));
      }
      window.__itopodPasIdleV1__=itopodPasIdleV1_;

function itopodEtagesIdleV1_(){
        const debut=document.getElementById('itopodDebutV1');
        const fin=document.getElementById('itopodFinV1');
        actionMetaIdleV130_({action:'towerFloors',start:Number(debut&&debut.value)||0,end:Number(fin&&fin.value)||0});
      }
      window.__itopodEtagesIdleV1__=itopodEtagesIdleV1_;

function itopodAutoIdleV1_(){
        actionMetaIdleV130_({action:'towerFloors',auto:true});
      }
      window.__itopodAutoIdleV1__=itopodAutoIdleV1_;

function acheterPerkIdleV1_(perkId){
        actionMetaIdleV130_({action:'buyPerk',perkId:Number(perkId)});
      }
      window.__acheterPerkIdleV1__=acheterPerkIdleV1_;

function acheterQuirkIdleV1_(quirkId){
        actionMetaIdleV130_({action:'buyQuirk',quirkId:Number(quirkId)});
      }
      window.__acheterQuirkIdleV1__=acheterQuirkIdleV1_;

  window.__SOREAL_IDLE_ITOPOD_PERKS_PAGE_V1__={
    pageQuirksIdleV1_:pageQuirksIdleV1_,
    pageItopodIdleV1_:pageItopodIdleV1_
  };
})();
