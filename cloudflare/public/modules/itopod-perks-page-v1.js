/*
 * SOREAL IDLE — pages Perks, Quirks et ITOPOD (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe).
 * Extrait tel quel de meta-progression-v130.js (même code, mêmes ponts window.__x__ pour les onclick inline).
 * Dépendances : window.__SOREAL_IDLE_META_V130__ et window.__SOREAL_IDLE_META_HOST_V130__, relus seulement à l'exécution
 * (l'ordre de chargement des <script> n'a pas d'importance). Expose window.__SOREAL_IDLE_ITOPOD_PERKS_PAGE_V1__.
 *
 * ITOPOD (tour + boutique des Atouts) : rendu par composants Preact (2026-11-18, modules/itopod-vdom-v1.js, pont modules/vdom-pont-v1.js). Ce fichier garde tout ce qui a un effet de bord (brouillon des étages,
 * mémoire de la vue, HTML de la scène, actions) et prépare le MODÈLE DE VUE que les composants dessinent ; la scène animée (itopod-scene-v1.js) reste impérative.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_ITOPOD_PERKS_PAGE_V1__)return;

      function systemeMetaParIdIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.systemeMetaParIdIdleV130_.apply(null,arguments);}
      function actionMetaIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.actionMetaIdleV130_.apply(null,arguments);}
      function toggleSystemeMetaIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.toggleSystemeMetaIdleV130_.apply(null,arguments);}
      function emojiNomIdleV1_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.emojiNomIdleV1_.apply(null,arguments);}

/*
 * Modèle des vitrines du magasin des Perks (Norman, 2026-10-04) : une boutique à part, en vitrines (néon violet et rose, étagères) et non en rayons à auvent comme les boutiques EXP et AP ;
 * une image par achat : celle du wiki NGU Idle (https://ngu-idle.fandom.com/wiki/Perk_Points), copiée dans /perks/<numéro du perk>.webp. Aucun total (anti-spoil).
 * Dessiné par modules/itopod-vdom-v1.js (Perks_) ; ici seulement les données.
 */
/*
 * Réglages de la boutique des Atouts : filtres « Abordables » et « Masquer les atouts au maximum », tri. Préférences du joueur : liées au compte (règle n°6), clé localStorage soreal_idle_perks_reglages_v1
 * (le texte de recherche, lui, reste en mémoire : un mot oublié dans le champ cacherait des atouts au prochain chargement).
 * Lu dans le jeu (build 1260, ItopodPerkController::constructList) : filtre « abordables » = filterAffordable (garde cost <= PP, les atouts au maximum NE SONT PAS écartés), filtre « pas au maximum » =
 * filterNotMax ; tri = orderList : 0 = ordre croissant des indices, 1 = orderBaseCost (coût de base), 2 = orderTotalCost ((plafond - niveau) x coût). Le filtre de difficulté du jeu (filterDifficulty) est
 * inutile ici : le serveur ne liste que ce qui est accessible.
 */
const CLE_REGLAGES_PERKS_V1='soreal_idle_perks_reglages_v1';
function lireReglagesPerksIdleV1_(){
        let o=null;
        try{o=JSON.parse(localStorage.getItem(CLE_REGLAGES_PERKS_V1)||'null');}catch(_e){o=null;}
        if(!o||typeof o!=='object')o={};
        return {abordables:o.abordables===true,nonMax:o.nonMax===true,tri:(o.tri==='base'||o.tri==='total')?o.tri:'id'};
      }
function ecrireReglagesPerksIdleV1_(r){try{localStorage.setItem(CLE_REGLAGES_PERKS_V1,JSON.stringify({abordables:Boolean(r.abordables),nonMax:Boolean(r.nonMax),tri:r.tri}));}catch(_e){}}

/*
 * Fibonacci Perk (perk 94) : le jeu (ItopodPerkUIController::fibPerkUnlocks) liste les paliers (« Level N: » + effet si atteint, « ?????? » sinon). Règle n°2 : seuls les paliers DÉJÀ atteints sont écrits, plus un
 * seul « ?????? » pour le PROCHAIN (jamais la suite ni le total). Textes du jeu (build 1260), écrits en français ici et rendus mot pour mot en anglais par le dictionnaire (« Level N: » + effet) ; le palier 1597 est le dernier (« (COSMETIC) » dans le jeu tant qu'il n'est pas atteint).
 */
const FIBONACCI_PALIERS_TEXTES_V1=[[1,'+10 % de Puissance d’Énergie et de Magie'],[2,'+10 % de Plafond d’Énergie'],[3,'+10 % de Plafond de Magie'],[5,'+5 % de vitesse des NGU d’Énergie'],[8,'+5 % de vitesse des NGU de Magie'],[13,'+5 % de gains de PP'],[21,'+10 % de Barres d’Énergie et de Magie'],[34,'13 % de stats d’Aventure'],[55,'+5 % de vitesse de la garderie'],[89,'+2 % de gains d’AP'],[144,'+5 % de chance d’avoir +1 niveau sur le butin !'],[233,'+10 % de récompenses de QP'],[377,'Multiplicateur d’Attaque/Défense de 377 %'],[610,'Plus aucun hasard sur les quêtes assignées !'],[987,'+5 % de gains d’EXP'],[1597,'ART DU CHAT FIBONACCI']];
function fibonacciPaliersIdleV1_(niveau){
        const out=[];
        for(let k=0;k<FIBONACCI_PALIERS_TEXTES_V1.length;k++){
          const pal=FIBONACCI_PALIERS_TEXTES_V1[k];
          if(niveau>=pal[0])out.push('Niveau '+pal[0]+' : '+pal[1]);
          else{out.push('Niveau '+pal[0]+' : ??????'+(pal[0]===1597?' (COSMÉTIQUE)':''));break;}
        }
        return out;
      }

function modelePerksIdleV1_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const s=systemeMetaParIdIdleV130_(j,'perks');
        if(!s||!s.state||!s.state.unlocked)return null;
        const levels=(s.state.data&&s.state.data.levels)||{};
        const defs=j&&j.systemes&&Array.isArray(j.systemes.perkDefinitions)?j.systemes.perkDefinitions:[];
        const pp=j&&j.systemes&&j.systemes.currencies?H.idleEntier_(j.systemes.currencies.pp||0):0;
        const filtre=window.__perkFiltreIdleV1__||(window.__perkFiltreIdleV1__={q:''});
        const reg=lireReglagesPerksIdleV1_();
        const q=String(filtre.q||'').trim().toLowerCase();
        const cartes=[];
        defs.forEach(function(perk){
          const niveau=H.idleEntier_(levels[perk.id]||0);
          const cap=H.idleEntier_(perk.cap||0);
          const auMax=niveau>=cap;
          const cout=H.idleEntier_(perk.cost||0);
          const abordable=!auMax&&pp>=cout;
          const nom=String(perk.name||('Perk '+perk.id));
          if(q&&(nom+' '+String(perk.effect||'')).toLowerCase().indexOf(q)<0)return;
          if(reg.abordables&&cout>pp)return;   /* jeu : filterAffordable garde cost <= PP, même un atout au maximum */
          if(reg.nonMax&&auMax)return;         /* jeu : filterNotMax */
          const barre=cap>0?Math.min(100,niveau*100/cap):0;
          cartes.push({id:perk.id,nom:nom,effet:String(perk.effect||''),niveau:niveau,cap:cap,auMax:auMax,cout:cout,abordable:abordable,barre:barre.toFixed(1)+'%',
            total:Math.max(0,cap-niveau)*cout,
            paliers:perk.id===94?fibonacciPaliersIdleV1_(niveau):null,
            /* perk.diff : rang de difficulté exigé (1 Evil, 2 Sadistic), envoyé par le serveur seulement pour un atout déjà accessible (règle n°2) */
            difficulte:H.idleEntier_(perk.diff||0),
            image:'/perks/'+H.idleEntier_(perk.id)+'.webp'+(perk.id===52||perk.id===53?'?v=2':'')});
        });
        /* Ordre du jeu : indices croissants ; les deux autres tris sont croissants sur leur clé, à égalité par indice. */
        cartes.sort(function(a,b){
          if(reg.tri==='base'&&a.cout!==b.cout)return a.cout-b.cout;
          if(reg.tri==='total'&&a.total!==b.total)return a.total-b.total;
          return a.id-b.id;
        });
        
        return {pp:pp,q:String(filtre.q||''),abordables:reg.abordables,nonMax:reg.nonMax,tri:reg.tri,cartes:cartes,sig:pp+'|'+String(filtre.q||'')+'|'+reg.abordables+'|'+reg.nonMax+'|'+reg.tri+'|'+JSON.stringify(cartes)};   /* sig : Perks_ ne se redessine que si elle change */
      }

/* Réglages du magasin des Perks : recherche, « abordables », « masquer les maximums », tri ; la page est rendue de nouveau aussitôt (le champ de recherche est le MÊME élément : il garde le focus, sans aucune manœuvre). */
function perkFiltrerIdleV1_(q,abordables,nonMax,tri){
        const f=window.__perkFiltreIdleV1__||(window.__perkFiltreIdleV1__={q:''});
        if(q!=null)f.q=String(q);
        if(abordables!=null||nonMax!=null||tri!=null){
          const r=lireReglagesPerksIdleV1_();
          if(abordables!=null)r.abordables=Boolean(abordables);
          if(nonMax!=null)r.nonMax=Boolean(nonMax);
          if(tri!=null)r.tri=(tri==='base'||tri==='total')?tri:'id';
          ecrireReglagesPerksIdleV1_(r);
        }
        rendreDeNouveauItopodIdleV1_();
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
              '<div style="display:flex;justify-content:space-between;gap:8px"><b>'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(emojiNomIdleV1_('quirks',quirk.id,quirk.name||('Quirk '+quirk.id)))+'</b><span style="white-space:nowrap;flex:none">'+niveau+' / '+cap+'</span></div>'+
              '<div style="font-size:14px;color:#aeb5c8;margin-top:5px">'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(quirk.effect||'')+'</div>'+
              '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">'+
                (auMax
                  ?'<span class="soreal-idle-note-v4">✔ Maximum atteint</span>'
                  :'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__acheterQuirkIdleV1__('+quirk.id+')">📚 Acheter ('+cout+' QP)</button>')+
              '</div>'+
            '</div>';
          }).join('')+'</div>';
      }

/* Données de la tour (système ITOPOD) ; null tant qu'elle n'est pas débloquée. */
function lireItopodIdleV1_(j){
        const s=systemeMetaParIdIdleV130_(j,'tower');
        if(!s||!s.state||!s.state.unlocked)return null;
        return {s:s,d:(s.state.data)||{}};
      }

/* Dernier HTML de la scène posé dans la page : une synchro (rafraîchissement en direct) le réutilise tel quel, seule une page redessinée en recalcule un (et réinitialise le combat de l'écran, comme avant). */
let derniereSceneItopodIdleV1_='';

/* Modèle de vue de la page entière : tout ce que les composants (modules/itopod-vdom-v1.js) dessinent. */
function preparerItopodIdleV1_(j,sceneHtml){
        const t=lireItopodIdleV1_(j);
        if(!t)return null;
        const s=t.s,d=t.d;
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const etage=H.idleEntier_(d.floor);
        const kills=H.idleEntier_(d.kills);
        const versProchainEtage=d.killsOnFloor!=null?H.idleEntier_(d.killsOnFloor):kills%10;
        const plusHaut=H.idleEntier_(d.highestFloor||d.floor);
        const optimal=H.idleEntier_(d.optimalFloor);
        const auto=d.startFloor==null||d.endFloor==null;
        /* Mode Auto : la montée part de l étage où tu es (elle ne repart jamais de 0) ; le champ « Départ » le montre au lieu d afficher 0 (Norman, 2026-10-07 : « départ 0, arrivée 18 » semblait un redémarrage). */
        const debut=H.idleEntier_(d.startFloor==null?etage:d.startFloor);
        const fin=H.idleEntier_(d.endFloor==null?optimal:d.endFloor);
        /* Brouillon des champs Départ / Fin (Norman, 2026-11-01 : « les chiffres que je tape ne se sauvegardent pas ») : un nombre tapé mais pas encore appliqué survit au redessin, au changement de menu et au rechargement
           (clé liée au compte, règle n°6) ; il disparaît à « Appliquer » et « Auto ». */
        const brouillon=lireBrouillonItopodIdleV1_();
        const champDebut=brouillon?brouillon.d:debut,champFin=brouillon?brouillon.f:fin;   /* le texte « Départ → fin » reste celui du SERVEUR (ce qui est appliqué) */
        const ppProgress=Math.max(0,H.idleNombre_(d.ppProgress));
        const pp=H.idleEntier_((j&&j.systemes&&j.systemes.currencies&&j.systemes.currencies.pp)||0);
        const pourcent=Math.max(0,Math.min(100,ppProgress/10000));
        /* Little Blue Pill (lu dans le jeu, build 1260, 2026-11-17 : AdventureController::togglePill / updatePillUI « Enable Little Blue Pill (N kills left) ») : bouton visible seulement si le joueur possède déjà des pilules (ou a le réglage actif) ; réglage lié au compte (état du jeu côté serveur, règle n°6). */
        const conso=(j&&j.systemes&&j.systemes.consommables)||{};
        const pilulesRestantes=Math.max(0,Math.floor(Number(conso.reserve&&conso.reserve.bluePills)||0));
        const pilulesActives=Boolean(conso.pilulesActives);
        /* PPP de base d'un kill : la valeur du SERVEUR (d.ppBase, base Sadistic complète : 2000 + quêtes + souhaits) ; repli sur la base de la difficulté en cours. */
        const ppBase=Math.floor(d.ppBase!=null&&Number(d.ppBase)>0?Number(d.ppBase):(j&&j.systemes&&j.systemes.difficulty==='extreme'?2000:j&&j.systemes&&j.systemes.difficulty==='difficile'?700:200));
        /* PP gagnés au total (ITOPOD.lifetimePoints du jeu, seulement par la progression, pas par les PP de record d'étage) : lu s'il existe côté serveur, affiché quand > 0 ; jamais de total à découvrir. */
        const ppTotal=Math.max(0,H.idleNombre_(d.lifetimePp));
        /* Lazy ITOPOD Floor Shifter : l'interrupteur n'apparaît qu'une fois l'amélioration ACHETÉE (règle n°2) ; Idle Mode : attaque automatique de la tour. */
        const achatsBoutique=(j&&j.systemes&&j.systemes.selloutShop&&j.systemes.selloutShop.purchases)||{};
        const shifterAchete=Number(achatsBoutique.lazyItopodFloorShifter)>0;
        const atouts=systemeMetaParIdIdleV130_(j,'perks');
        const atoutsOuverts=Boolean(atouts&&atouts.state&&atouts.state.unlocked);
        const vueAtouts=atoutsOuverts&&window.__itopodVueIdleV1__==='atouts';
        return {
          sousTitre:'Une tour sans fin : bats 10 ennemis pour monter d’un étage. Chaque ennemi vaincu te rapporte des PPP ('+ppBase+' + le numéro de l’étage). À 1 000 000 PPP, tu gagnes 1 PP à dépenser dans les Atouts. Tu choisis l’étage de départ et l’étage de fin : arrivé au bout, tu repars du départ.',
          atoutsOuverts:atoutsOuverts,vueAtouts:vueAtouts,
          perks:atoutsOuverts?modelePerksIdleV1_(j):null,
          sceneHtml:sceneHtml,
          actif:Boolean(s.state.active),
          pilule:(pilulesRestantes>0||pilulesActives)?{actives:pilulesActives,restantes:H.idleEntier_(pilulesRestantes)}:null,
          alerte:d.hitsParKill===0,
          modeEtages:auto?'Montée automatique jusqu’à l’étage optimal':(debut===fin?'Étage fixé : '+debut+(debut===optimal?' (ton meilleur étage)':''):'Départ '+debut+' → fin '+fin),
          champDebut:champDebut,champFin:champFin,
          shifter:shifterAchete?{actif:d.shifterOn===true}:null,
          idleMode:d.idleMode!==false,
          tuiles:[['🏢','Étage',etage],['⭐','PP disponibles',pp],['🗡️','Ennemis vaincus',H.formatGrandNombreIdleV70_(kills)],['⬆️','Prochain étage',versProchainEtage+' / 10'],['🏔️','Étage le plus haut',plusHaut],['🎯','Étage optimal',optimal]].concat(ppTotal>0?[['⭐','PP gagnés au total',H.formatGrandNombreIdleV70_(ppTotal)]]:[]),
          ppTexte:Math.floor(ppProgress).toLocaleString('fr-FR')+' / 1 000 000',
          ppLargeur:pourcent.toFixed(2)+'%'
        };
      }

/* Page ITOPOD pour le menu : le modèle est confié au pont, qui rend les composants dans un conteneur persistant et renvoie ici la chaîne STABLE à mettre dans la page. Un redessin de la page recalcule le HTML de la scène. */
function pageItopodIdleV1_(j){
        const t=lireItopodIdleV1_(j);
        if(!t)return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        const V=window.__SOREAL_IDLE_VDOM_V1__,C=window.__SOREAL_IDLE_ITOPOD_VDOM_V1__;
        if(!V||!C)return '';
        const sc=window.__SOREAL_IDLE_ITOPOD_SCENE_V1__;
        derniereSceneItopodIdleV1_=sc?sc.html(Object.assign({},t.d,{actif:Boolean(t.s.state.active)})):'';
        return V.monter('itopod',C.Page,preparerItopodIdleV1_(j,derniereSceneItopodIdleV1_));
      }

/* Rendu synchrone vers une chaîne HTML (tests, débogage) : jamais utilisé par la page. */
function htmlItopodIdleV1_(j){
        const V=window.__SOREAL_IDLE_VDOM_V1__,C=window.__SOREAL_IDLE_ITOPOD_VDOM_V1__;
        const t=lireItopodIdleV1_(j);
        if(!t||!V||!C)return '';
        const sc=window.__SOREAL_IDLE_ITOPOD_SCENE_V1__;
        derniereSceneItopodIdleV1_=sc?sc.html(Object.assign({},t.d,{actif:Boolean(t.s.state.active)})):'';
        return V.rendreHtml(C.Page,preparerItopodIdleV1_(j,derniereSceneItopodIdleV1_));
      }

/* Nouveau rendu local, sans redessiner le menu : filtre des perks, bascule de vue. La scène n'est pas recalculée (son HTML reste celui de la page). */
function rendreDeNouveauItopodIdleV1_(){
        const V=window.__SOREAL_IDLE_VDOM_V1__,C=window.__SOREAL_IDLE_ITOPOD_VDOM_V1__;
        const j=window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat();
        if(!V||!C||!j||typeof document==='undefined'||!document.querySelector('.itp-page'))return;
        const vm=preparerItopodIdleV1_(j,derniereSceneItopodIdleV1_);
        if(vm)V.monter('itopod',C.Page,vm);
      }

/* Bouton « Atouts » de la page ITOPOD : bascule entre la tour et la boutique des Atouts (ancien menu à part), sans redessiner le menu. */
function itopodVueIdleV1_basculer_(){
        const vers=window.__itopodVueIdleV1__==='atouts'?'tour':'atouts';
        window.__itopodVueIdleV1__=vers;
        rendreDeNouveauItopodIdleV1_();
      }
      window.__itopodVueIdleV1_basculer__=itopodVueIdleV1_basculer_;

/* Arène : un nouvel étage ou de nouveaux coups par ennemi venus du serveur (« Appliquer », « Auto ») la refont tout de suite, sans changer de menu (la scène ne fait rien si rien n'a changé). */
function majArenaItopodIdleV1_(j){
        const sc=window.__SOREAL_IDLE_ITOPOD_SCENE_V1__,t=lireItopodIdleV1_(j);
        if(sc&&sc.maj&&t)sc.maj(Object.assign({},t.d,{actif:Boolean(t.s.state.active)}));
      }

/* Mise à jour en direct de la page ITOPOD à chaque synchro (étage, ennemis vaincus, PP, progression, solde et vitrines) : même rendu, seul ce qui change est touché ; la scène animée (HTML de la dernière page) et les champs d'étage en cours de saisie ne sont jamais réécrits. */
function rafraichirItopodIdleV1_(j){
        const V=window.__SOREAL_IDLE_VDOM_V1__,C=window.__SOREAL_IDLE_ITOPOD_VDOM_V1__;
        if(!V||!C||typeof document==='undefined'||!document.querySelector('.itp-page'))return;
        majArenaItopodIdleV1_(j);   /* les valeurs du serveur (étage appliqué, coups par ennemi, PV) changent l'arène tout de suite */
        const vm=preparerItopodIdleV1_(j,derniereSceneItopodIdleV1_);
        if(vm)V.monter('itopod',C.Page,vm);
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
        ecrireBrouillonItopodIdleV1_();
      }
      window.__itopodPasIdleV1__=itopodPasIdleV1_;

const CLE_BROUILLON_ITOPOD_V1='soreal_idle_itopod_etages_v1';
function lireBrouillonItopodIdleV1_(){
        try{
          const o=JSON.parse(localStorage.getItem(CLE_BROUILLON_ITOPOD_V1)||'null');
          if(!o||typeof o!=='object'||o.d==null||o.f==null)return null;
          const d=Math.floor(Number(o.d)),f=Math.floor(Number(o.f));
          return Number.isFinite(d)&&Number.isFinite(f)&&d>=0&&f>=0&&d<=1600&&f<=1600?{d:d,f:f}:null;
        }catch(_e){return null;}
      }
function ecrireBrouillonItopodIdleV1_(){
        const debut=document.getElementById('itopodDebutV1');
        const fin=document.getElementById('itopodFinV1');
        if(!debut||!fin)return;
        const d=Math.floor(Number(debut.value)),f=Math.floor(Number(fin.value));
        if(String(debut.value).trim()===''||String(fin.value).trim()===''||!Number.isFinite(d)||!Number.isFinite(f)||d<0||f<0||d>1600||f>1600)return;   /* champ vide ou en cours de frappe : l'ancien brouillon reste */
        try{localStorage.setItem(CLE_BROUILLON_ITOPOD_V1,JSON.stringify({d:d,f:f}));}catch(_e){}
      }
function effacerBrouillonItopodIdleV1_(){try{localStorage.removeItem(CLE_BROUILLON_ITOPOD_V1);}catch(_e){}}
window.__itopodBrouillonIdleV1__=ecrireBrouillonItopodIdleV1_;

function itopodEtagesIdleV1_(){
        const debut=document.getElementById('itopodDebutV1');
        const fin=document.getElementById('itopodFinV1');
        effacerBrouillonItopodIdleV1_();
        actionMetaIdleV130_({action:'towerFloors',start:Number(debut&&debut.value)||0,end:Number(fin&&fin.value)||0});
      }
      window.__itopodEtagesIdleV1__=itopodEtagesIdleV1_;

function itopodPiluleIdleV1_(){
        actionMetaIdleV130_({action:'towerTogglePill'});
      }
      window.__itopodPiluleIdleV1__=itopodPiluleIdleV1_;

/* « Optimal » (AdventureController::setOptimalFloor : une seule fois, pas un mode). */
function itopodAutoIdleV1_(){
        effacerBrouillonItopodIdleV1_();
        actionMetaIdleV130_({action:'towerFloors',auto:true});
      }
      window.__itopodAutoIdleV1__=itopodAutoIdleV1_;

/* « Max » (AdventureController::setMaxFloor) : départ = plus haut étage atteint - 1. */
function itopodMaxIdleV1_(){
        effacerBrouillonItopodIdleV1_();
        actionMetaIdleV130_({action:'towerMaxFloor'});
      }
      window.__itopodMaxIdleV1__=itopodMaxIdleV1_;

/* Interrupteurs de la tour : Lazy ITOPOD Floor Shifter (acheté) et Idle Mode ; l'état vit côté serveur (règle n°6). */
window.__itopodShifterIdleV1__=function(activer){actionMetaIdleV130_({action:'towerShifter',enabled:Boolean(activer)});};
window.__itopodIdleModeIdleV1__=function(activer){actionMetaIdleV130_({action:'towerIdleMode',enabled:Boolean(activer)});};

function acheterPerkIdleV1_(perkId){
        actionMetaIdleV130_({action:'buyPerk',perkId:Number(perkId)});
      }
      window.__acheterPerkIdleV1__=acheterPerkIdleV1_;

/* « Tout » : dépense tout ce qui est possible sur cet atout (ItopodPerkController::tryLevelAll, clic droit dans le jeu). Pas de confirmation d'achat (PlayerSettings.itopodConfirmation non reprise). */
function acheterPerkToutIdleV1_(perkId){
        actionMetaIdleV130_({action:'buyPerkMax',perkId:Number(perkId)});
      }
      window.__acheterPerkToutIdleV1__=acheterPerkToutIdleV1_;

function acheterQuirkIdleV1_(quirkId){
        actionMetaIdleV130_({action:'buyQuirk',quirkId:Number(quirkId)});
      }
      window.__acheterQuirkIdleV1__=acheterQuirkIdleV1_;

  window.__SOREAL_IDLE_ITOPOD_PERKS_PAGE_V1__={
    pageQuirksIdleV1_:pageQuirksIdleV1_,
    pageItopodIdleV1_:pageItopodIdleV1_,
    htmlItopodIdleV1_:htmlItopodIdleV1_
  };
})();
