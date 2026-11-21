/*
 * SOREAL IDLE — page Money Pit & Roue journalière rendue par composants Preact (chantier de fluidité, 2026-11-18, AGENTS.md règle n°4).
 *
 * Avant : la page était fabriquée en chaîne HTML (money-pit-page-v1.js, ~30 Ko) et comparée au DOM par le morph à chaque synchro (4 s). Maintenant : un arbre de composants (h(), sans JSX) rendu par modules/vdom-pont-v1.js
 * dans un conteneur PERSISTANT ; les nœuds (cadres, tableaux, boutons, calendrier) restent les mêmes d'un rendu à l'autre, seul ce qui change est touché.
 *
 * Mêmes classes CSS, mêmes data-*, mêmes textes, mêmes ponts : aucune règle de jeu ni aucun texte ne change. Les fonctions de calcul (libellés de récompense, phrases du trou, historique, couleur du « Ton prix », compte à rebours)
 * restent CELLES de money-pit-page-v1.js (window.__SOREAL_IDLE_MONEY_PIT_V1__.aides) : une seule source de vérité. Composants PURS : tout effet de bord (minuteurs, guetteur de palier, mémoires de couleur) se décide dans preparer_(), une
 * fois par rendu, comme avant.
 *
 * Ce qui reste IMPÉRATIF (animé ou possédé par un autre module) et pourquoi :
 *  - la carte de la roue (.rb-roue) et le bouton + la légende des chances sous la roue : dessinés par roue-journaliere-v1.js, qui les anime (angle, rotation) et les relit dans le DOM ; ils sont rendus en chaîne par ce module
 *    puis mis à jour sur place par le morph (îlots), exactement comme avant, sans rien reconstruire quand la chaîne est identique ;
 *  - la légende des lots possibles du trou (trou-recompenses-v1.js, chaîne HTML) : même principe (îlot) ;
 *  - les calques du trou (yeux, volutes, titre) : dessin statique posé une fois ; la salve d'or (window.__jeterOrSalveV1__) et la classe « mp3-vu » (observateur de visibilité) s'y ajoutent à la main et Preact n'y touche jamais.
 * Le texte du compte à rebours des boutons de recharge est réécrit sur place par le minuteur de money-pit-page-v1.js (nœud de texte conservé).
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_MONEY_PIT_VDOM_V1__)return;

  var P_=window.preact||null;
  var h=P_&&P_.h;
  var CLE='moneypit';
  var calSerieVue=null;
  var dernier={cle:null,vm:null};
  var calquesMemo=null;

  function MP_(){return window.__SOREAL_IDLE_MONEY_PIT_V1__;}
  function A_(){var m=MP_();return m&&m.aides;}
  function H_(){return window.__SOREAL_IDLE_META_HOST_V130__;}
  function heure_(){return typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now();}

  /* ---------- Îlot : un morceau de page dessiné en chaîne HTML par un autre module, mis à jour sur place (morph) quand la chaîne change ---------- */
  function Ilot_(){}
  if(P_&&P_.Component){
    Ilot_=function(props){P_.Component.call(this,props);};
    Ilot_.prototype=Object.create(P_.Component.prototype);
    Ilot_.prototype.constructor=Ilot_;
    Ilot_.prototype.componentDidMount=function(){
      var el=this.base;
      var M=window.__SOREAL_IDLE_MORPH_V1__;
      this.vu=String(this.props.html||'');
      if(!el)return;
      if(M&&M.morpherHtml){try{M.morpherHtml(el,this.vu);return;}catch(_e){}}
      el.innerHTML=this.vu;
    };
    Ilot_.prototype.shouldComponentUpdate=function(n){return String(n.html||'')!==this.vu||JSON.stringify(n.attrs||null)!==JSON.stringify(this.props.attrs||null);};
    Ilot_.prototype.componentDidUpdate=function(){
      var el=this.base,M=window.__SOREAL_IDLE_MORPH_V1__,html=String(this.props.html||'');
      this.vu=html;
      if(!el)return;
      if(M&&M.morpherHtml){try{M.morpherHtml(el,html);return;}catch(_e){}}
      el.innerHTML=html;
    };
    Ilot_.prototype.render=function(){
      var p=this.props,a=Object.assign({},p.attrs||{});
      /* aucun enfant : Preact ne touche jamais au contenu, que le morph tient à jour */
      return h(p.tag||'div',a);
    };
  }
  /* Découpe « <div class="rb-roue"[ data-roue-v1="1"]>…</div> » (carte de la roue) en attributs + contenu. */
  function decouperRoue_(html){
    var m=/^<div class="rb-roue"( data-roue-v1="1")?>([\s\S]*)<\/div>$/.exec(String(html||''));
    if(!m)return null;
    var attrs={'class':'rb-roue'};
    if(m[1])attrs['data-roue-v1']='1';
    return {attrs:attrs,html:m[2]};
  }
  /* Contenu intérieur des calques du trou (le conteneur .mp3-calques est rendu ici avec ses attributs). */
  function interieurCalques_(html){
    var m=/^<div class="mp3-calques"[^>]*>([\s\S]*)<\/div>$/.exec(String(html||''));
    return m?m[1]:'';
  }

  /* ---------- Modèle de vue ---------- */
  function ligneBandeauPit_(H,data){
    var t=data&&data.rewardsTotal&&typeof data.rewardsTotal==='object'?data.rewardsTotal:{};
    var n=function(k){return Math.max(0,Number(t[k])||0);};
    var f=function(v,d){return H.formatGrandNombreIdleV70_(v,d);};
    var lignes=[];
    if(n('adventureStats'))lignes.push('⚔️ +'+f(n('adventureStats'))+' Puissance et Endurance d’Aventure');
    if(n('adventurePower'))lignes.push('⚔️ +'+f(n('adventurePower'))+' Puissance d’Aventure');
    if(n('adventureToughness'))lignes.push('🛡️ +'+f(n('adventureToughness'))+' Endurance d’Aventure');
    if(n('levelUps'))lignes.push('📈 +'+f(n('levelUps'))+' niveau(x) d’équipement');
    if(n('pilule'))lignes.push('💊 +'+f(n('pilule'),2)+' aux stats d’Aventure (pilule)');
    if(n('adventureHp'))lignes.push('❤️ +'+f(n('adventureHp'))+' PV max d’Aventure');
    if(n('adventureRegen'))lignes.push('🩹 +'+f(n('adventureRegen'),2)+' Regen PV d’Aventure');
    if(n('cubePower')||n('cubeToughness')||n('cubeBoth')){
      var morceaux=[];
      if(n('cubePower'))morceaux.push('+'+f(n('cubePower'))+' Puissance');
      if(n('cubeToughness'))morceaux.push('+'+f(n('cubeToughness'))+' Endurance');
      if(n('cubeBoth'))morceaux.push('+'+f(n('cubeBoth'))+' des deux');
      lignes.push('🧊 Cube : '+morceaux.join(' · '));
    }
    if(n('experience'))lignes.push('✨ +'+f(n('experience'))+' EXP');
    if(n('ap'))lignes.push('🎟️ +'+f(n('ap'))+' AP');
    if(n('seeds'))lignes.push('🌱 +'+f(n('seeds'))+' graines');
    if(n('wandoosLevels'))lignes.push('💻 +'+f(n('wandoosLevels'))+' niveaux de Wandoos');
    if(n('boosts'))lignes.push('🚀 '+f(n('boosts'))+' boost(s) obtenu(s)');
    if(n('energyBars')||n('magicBars'))lignes.push('📊 +'+f(n('energyBars'))+' barre(s) d’Energy · +'+f(n('magicBars'))+' barre(s) de Magic');
    return lignes;
  }
  function ligneBandeauRoue_(H,A,data){
    var t=data&&data.rewardsTotal&&typeof data.rewardsTotal==='object'?data.rewardsTotal:{};
    var f=function(v,d){return H.formatGrandNombreIdleV70_(v,d);};
    var lignes=[];
    if(Number(t.ap)>0)lignes.push('🎟️ +'+f(Number(t.ap))+' AP');
    if(Number(t.seeds)>0)lignes.push('🌱 +'+f(Number(t.seeds))+' graines');
    var items=t.items&&typeof t.items==='object'?t.items:{};
    Object.keys(items).forEach(function(id){
      var n=Number(items[id]);
      if(n>0)lignes.push('🎁 '+f(n)+' × '+(A.NOMS_OBJETS_ROUE[id]||id));
    });
    return lignes;
  }
  function cadreVm_(H,A,cle,titre,lignes,colonneDetail,vide){
    var pages=Math.max(1,Math.ceil(lignes.length/A.PAR_PAGE));
    var courante=Math.max(0,Math.min(pages-1,A.pages[cle]||0));
    A.pages[cle]=courante;
    var rangees=lignes.slice(courante*A.PAR_PAGE,(courante+1)*A.PAR_PAGE).map(function(x){return {quand:A.dateCourte(x.at),detail:x.detail,prize:x.prize};});
    return {cle:cle,titre:titre,nb:lignes.length,colonneDetail:colonneDetail,vide:vide,pages:pages,courante:courante,rangees:rangees,ouvert:A.cadreOuvert(cle)};
  }
  function calendrierVm_(H,j){
    var cal=j&&j.systemes&&j.systemes.loginCalendar;
    if(!cal||!Array.isArray(cal.bareme)||!cal.bareme.length)return null;
    var A=A_();
    var jours=cal.bareme.length;
    var serie=Math.max(0,Math.min(jours,H.idleEntier_(cal.serie)));void serie;
    var nomMois=(A.MOIS_FR[H.idleEntier_(cal.moisNumero)-1]||'')+' '+H.idleEntier_(cal.annee);
    var prises=Array.isArray(cal.reclamees)?cal.reclamees:[];
    var ratees=Array.isArray(cal.ratees)?cal.ratees:[];
    var serieAvant=calSerieVue;
    calSerieVue=prises.length;
    var jourDuMois=H.idleEntier_(cal.jourDuMois);
    var cases=cal.bareme.map(function(ap,i){
      var dernier=i===jours-1,jour=i+1;
      var allume=prises.indexOf(jour)>=0;
      var ratee=!allume&&ratees.indexOf(jour)>=0;
      var pret=!allume&&!ratee&&jour===jourDuMois&&Boolean(cal.reclamable);
      var etat=allume?('allume'+((serieAvant!==null&&prises.length>serieAvant)?' nouveau':'')):(ratee?'ratee':(pret?'pret':'eteint'));
      return {jour:jour,etat:etat,dernier:dernier,icone:dernier?'👑':(((i+1)%7===0)?'🎁':'💠'),ap:H.formatGrandNombreIdleV70_(ap),ratee:ratee,allume:allume};
    });
    var bouton;
    if(cal.reclamable)bouton={type:'dispo',texte:'🎁 Récupérer la récompense du jour : +'+H.formatGrandNombreIdleV70_(cal.prochainAp)+' AP'};
    else if(jourDuMois>=jours)bouton={type:'fin',texte:'👑 Dernier jour du mois récupéré ! Un nouveau plateau commence le 1er du mois prochain.'};
    else bouton={type:'fait',texte:'✅ Récompense du jour récupérée · reviens demain pour +'+H.formatGrandNombreIdleV70_(cal.prochainAp)+' AP'};
    return {nomMois:nomMois,sous:cal.offert?'Reviens chaque jour pour récupérer ta case : plus le mois avance, plus l’AP est gros. Une case ratée est grisée.':'Reviens chaque jour pour récupérer ta case. Une case ratée est grisée, et chaque jour raté retire 10 % aux récompenses restantes.',
      nbPrises:prises.length,ratesTexte:(H.idleEntier_(cal.joursRates)>0&&!cal.offert)?{n:H.idleEntier_(cal.joursRates),pct:Math.round(H.idleNombre_(cal.multiplicateur)*100)}:null,
      totalMois:H.formatGrandNombreIdleV70_(H.idleNombre_(cal.totalMois)),totalAp:H.formatGrandNombreIdleV70_(H.idleNombre_(cal.totalAp)),cases:cases,bouton:bouton};
  }

  /* Effets de bord et calculs : une fois par rendu, comme l'ancienne fonction de page. Renvoie le modèle de vue. */
  function preparer_(j){
    var A=A_(),H=H_();
    if(!A||!H)return null;
    var pit=A.systemeMeta(j,'moneyPit'),roueReelle=A.systemeMeta(j,'dailySpin');
    var pitSt=pit&&pit.state||{};
    var RO=window.__SOREAL_IDLE_ROUE_V1__,TR=window.__SOREAL_IDLE_TROU_V1__;
    A.guetterPalierTrou();
    /* Pendant que la roue tourne, TOUT l'affichage lié au tour reste celui d'AVANT : le résultat n'apparaît qu'à l'arrêt de la roue. */
    var roueEnCours=Boolean(RO&&RO.enCours());
    var roueSt=roueEnCours&&RO.stAvant()?RO.stAvant():(roueReelle&&roueReelle.state||{});
    var roue={state:roueSt};
    var pitData=pitSt.data||{},roueData=roueSt.data||{};
    var totalSpins=H.idleEntier_(roueData.totalSpins||roueSt.level||0);
    var listePit=A.lignesPit(pit),listeRoue=A.lignesRoue(roue);
    var historique=A.historique(pit,roue);
    var derniere=historique.find(function(x){return x.genre==='pit';})||null;
    var derniereRoue=historique.find(function(x){return x.genre==='roue';})||null;
    var couleurPrix=A.rangCouleurPrix(derniere,'soreal_idle_prix_couleur_v1');
    var couleurPrixRoue=A.rangCouleurPrix(derniereRoue,'soreal_idle_prix_couleur_roue_v1',totalSpins);
    if(RO)RO.memoPrix(derniereRoue,totalSpins);

    /* Bouton « Balance ton argent » (même logique que rendreBoutonMoneyPitIdleV1_) */
    var gold=H.idleNombre_(j&&j.systemes&&j.systemes.currencies&&j.systemes.currencies.gold);
    var nextAt=H.idleNombre_(pitSt&&pitSt.data&&pitSt.data.nextAt);
    var restantMs=nextAt-heure_();
    var bouton;
    if(restantMs>0){
      A.demarrerMinuteurRecharge();
      bouton={type:'recharge',fin:nextAt,texte:A.libelleRechargeMoneyPit(Math.ceil(restantMs/1000))};
    }else if(gold<1)bouton={type:'vide'};
    else bouton={type:'dispo'};

    var boutonRoue=roueEnCours?'<button type="button" class="rb-bouton" disabled>Ça tourne…</button>':A.boutonRoue(roueSt);
    var carteRoue=RO?RO.rendreCarte(roueSt,j,boutonRoue):'';
    var controles=RO&&typeof RO.rendreControles==='function'?RO.rendreControles(roueSt,j,boutonRoue):boutonRoue;
    var nuit=window.__SOREAL_IDLE_TROU_NUIT_V1__;

    return {
      bandeauPit:ligneBandeauPit_(H,pitData),bandeauRoue:ligneBandeauRoue_(H,A,roueData),
      src:nuit?nuit.src():'/trou/trou-sans-fond-v1.webp',calques:calquesMemo||(calquesMemo=interieurCalques_(A.calques())),
      bouton:bouton,legende:TR?TR.rendreLegende(j):'',
      prixPit:{couleur:couleurPrix,phrase:derniere&&derniere.entree?A.phrase(derniere.entree,j):'',detail:derniere?derniere.prize:'',aucun:!derniere,avecPhrase:Boolean(derniere&&derniere.entree)},
      jets:H.idleEntier_(pitSt.level||0),
      carteRoue:carteRoue?(decouperRoue_(carteRoue)||{tout:carteRoue}):null,controles:controles,
      prixRoue:{couleur:couleurPrixRoue,detail:derniereRoue?derniereRoue.prize:'',aucun:!derniereRoue},tours:totalSpins,
      cadrePit:cadreVm_(H,A,'pit','🕳️ RÉCOMPENSES DU MONEY PIT',listePit,'Palier','Le tableau se remplira dès ton premier lancer dans le trou.'),
      cadreRoue:cadreVm_(H,A,'roue','🎡 RÉCOMPENSES DE LA ROUE',listeRoue,'Tier','Le tableau se remplira dès ton premier tour de roue.'),
      calendrier:calendrierVm_(H,j),CSS_PAGE:A.CSS_PAGE,CSS_CAL:A.CSS_CALENDRIER
    };
  }

  /* ---------- Composants ---------- */
  function b_(t){return h('b',null,t);}
  function Bandeau_(p){
    return h('div',{class:'soreal-idle-section-v8 mp-bandeau-v1'},
      h('div',{class:'soreal-idle-window-title-v31 gold'},p.titre),
      p.lignes.length
        ?h('div',{style:'display:grid;gap:5px;margin-top:6px'},p.lignes.map(function(l,i){return h('div',{class:'soreal-idle-note-v4',style:'margin:0',key:i},l);}))
        :h('div',{class:'soreal-idle-note-v4'},p.vide));
  }
  function BoutonPit_(p){
    var A=A_();void A;
    if(p.type==='recharge')return h('button',{type:'button',class:'rb-bouton',disabled:true,'data-idle-recharge-v1':'pit','data-fin':String(p.fin),key:'recharge'},p.texte);
    if(p.type==='vide')return h('button',{type:'button',class:'rb-bouton',disabled:true,key:'vide'},'🕳️ Jeter de l’or (tu n’as plus d’Or)');
    return h('button',{type:'button',class:'rb-bouton rb-dispo glow-dispo-v1 mp2-spin-bouton-v1',key:'dispo',onClick:function(){window.__actionMetaIdleV130__({action:'moneyPit'});}},'🕳️ Balance ton argent');
  }
  function Prix_(p){
    var contenu;
    if(p.aucun)contenu='Aucun prix obtenu pour l’instant.';
    else if(p.avecPhrase)contenu=[p.phrase,h('span',{class:'soreal-idle-prize-detail-v1',key:'d'},p.detail)];
    else contenu=p.roue?h('span',{class:'soreal-idle-prize-detail-v1'},p.detail):p.detail;
    return h('div',{class:'soreal-idle-offre-v1 mp2-prix-v1'},
      h('div',{class:'soreal-idle-offre-titre-v1'},'🎁 TON PRIX'),
      h('div',{class:'soreal-idle-prize-v206','data-couleur':String(p.couleur)},contenu));
  }
  function Cadre_(p){
    var corps;
    if(!p.nb)corps=h('div',{class:'soreal-idle-note-v4'},p.vide);
    else{
      var table=h('table',{class:'soreal-idle-reward-table-v206'},
        h('thead',null,h('tr',null,h('th',null,'Quand'),h('th',null,p.colonneDetail),h('th',null,'Prix'))),
        h('tbody',{'data-mp-page':String(p.courante),key:'p'+p.courante},p.rangees.map(function(x,i){
          return h('tr',{key:i},h('td',null,x.quand),h('td',null,x.detail),h('td',null,b_(x.prize)));
        })));
      var pager=p.pages>1?h('div',{class:'mp-pager-v1'},
        h('button',{type:'button','data-mp-recent':'',disabled:p.courante<=0,onClick:function(){API.changerPage(p.cle,-1);}},'◀ Plus récentes'),
        h('span',{'data-mp-compteur':''},'Page '+(p.courante+1)+' / '+p.pages),
        h('button',{type:'button','data-mp-ancien':'',disabled:p.courante>=p.pages-1,onClick:function(){API.changerPage(p.cle,1);}},'Plus anciennes ▶')):null;
      corps=[table,pager];
    }
    return h('details',{class:'mp-cadre-v1','data-mp-cadre':p.cle,open:p.ouvert,onToggle:function(e){window.__basculerCadreMoneyPitIdleV1__(p.cle,e.currentTarget);}},
      h('summary',null,p.titre+' ',h('span',{class:'mp-compte-v1'},'('+p.nb+')')),
      h('div',{class:'mp-corps-v1'},corps));
  }
  function Calendrier_(c){
    var stats1=[h('span',{key:'a'},'🔥 Cases récupérées : ',b_(String(c.nbPrises)))];
    if(c.ratesTexte)stats1.push(h('span',{key:'b'},'⚠️ Jours ratés : ',b_(String(c.ratesTexte.n)),' (récompenses restantes à ',b_(c.ratesTexte.pct+' %'),')'));
    stats1.push(h('span',{key:'c'},'💠 Total du mois : ',b_(c.totalMois+' AP')));
    var bt=c.bouton;
    var bouton=bt.type==='dispo'
      ?h('button',{type:'button',class:'soreal-idle-expand-button-v25 cal-bouton-v1 glow-dispo-v1',key:'dispo',onClick:function(){window.__actionMetaIdleV130__({action:'loginCalendar'});}},bt.texte)
      :h('button',{type:'button',class:'soreal-idle-expand-button-v25 cal-bouton-v1',disabled:true,key:bt.type},bt.texte);
    return [
      h('style',{key:'s'},c.css),
      h('div',{class:'cal-v1',key:'c'},
        h('div',{class:'cal-titre-v1'},'📅 Récompenses de connexion · '+c.nomMois),
        h('div',{class:'cal-sous-v1'},c.sous),
        h('div',{class:'cal-stats-v1'},stats1),
        h('div',{class:'cal-stats-v1'},h('span',null,'🏆 Total d’AP obtenus depuis le début des récompenses : ',b_(c.totalAp+' AP'))),
        h('div',{class:'cal-grille-v1'},c.cases.map(function(k){
          return h('div',{class:'cal-case-v1 '+k.etat+(k.dernier?' dernier':''),title:'Jour '+k.jour+' : '+k.ap+' AP'+(k.ratee?' (jour raté)':''),key:k.jour},
            h('span',{class:'cal-jour-v1'},String(k.jour)),h('span',{class:'cal-icone-v1'},k.icone),h('span',{class:'cal-ap-v1'},k.ap+(k.dernier?' AP':'')),
            k.allume?h('span',{class:'cal-coche-v1'},'✓'):null);
        })),
        bouton)
    ];
  }
  function Page_(p){
    var cal=p.calendrier?Calendrier_(Object.assign({css:p.CSS_CAL},p.calendrier)):null;
    return h(P_.Fragment,null,
      h('div',{class:'soreal-idle-page-head-v28'},h('div',{class:'soreal-idle-page-title-v28'},'🕳️ Money Pit & 🎡 Roue journalière'),h('div',{class:'soreal-idle-page-sub-v28'},'Balance tout ton Or durement gagné dedans.')),
      h('style',null,p.CSS_PAGE),
      h('div',{class:'mp2-grille-v1'},
        h('div',{class:'mp-col-v1 mp-col-trou-v1'},
          h('div',{class:'soreal-idle-money-scene-v206'},
            h('img',{id:'sorealIdleMoneyPitImageV209',src:p.src,width:'1000',height:'1000',alt:'Trou sans fond'}),
            h('div',{class:'mp3-calques','aria-hidden':'false','data-morph-classes-gardees':'^mp3-vu$',dangerouslySetInnerHTML:{__html:p.calques}})),
          h('div',{class:'soreal-idle-money-actions-v206'},
            h('div',{class:'soreal-idle-money-action-v206 soreal-idle-money-pit-action-v206'},
              h('div',{class:'soreal-idle-money-action-title-v206'},'Balance ton argent'),
              h('div',{class:'soreal-idle-money-action-note-v206'},'Le trou prend tout ton Or actuel.'),
              h(BoutonPit_,p.bouton),
              h(Ilot_,{tag:'div',attrs:{'class':'vdom-ilot','data-vdom-ilot':'legende'},html:p.legende}),
              h(Prix_,p.prixPit),
              h('div',{class:'rb-prix-txt'},'Jets effectués : ',b_(String(p.jets)),'.'))),
          /* Bonus obtenus : sous le bouton du Money Pit (Norman, 2026-11-21), donc côte à côte avec celui de la roue sur PC. */
          h(Bandeau_,{titre:'🕳️ Bonus obtenus grâce au Money Pit',lignes:p.bandeauPit,vide:'Aucun bonus pour l’instant : jette ton Or dans le trou.'}),
          h(Cadre_,p.cadrePit)),
        h('div',{class:'mp-col-v1 mp-col-roue-v1'},
          p.carteRoue?(p.carteRoue.tout?h(Ilot_,{tag:'div',attrs:{'class':'vdom-ilot','data-vdom-ilot':'roue'},html:p.carteRoue.tout}):h(Ilot_,{tag:'div',attrs:p.carteRoue.attrs,html:p.carteRoue.html})):null,
          h('div',{class:'rb-prixcol'},h('div',{class:'soreal-idle-money-action-v206 soreal-idle-money-spin-action-v206'},
            h('div',{class:'soreal-idle-money-action-title-v206'},'Roue journalière !'),
            h('div',{class:'soreal-idle-money-action-note-v206'},'Une fois par jour. Chaque part de la roue est une récompense possible : sa largeur suit sa chance.'),
            h(Ilot_,{tag:'div',attrs:{'class':'vdom-ilot','data-vdom-ilot':'controles'},html:p.controles}),
            h(Prix_,Object.assign({roue:true},p.prixRoue)),
            h('div',{class:'rb-prix-txt'},'Tours effectués : ',b_(String(p.tours)),'.'))),
          h(Bandeau_,{titre:'🎡 Bonus obtenus grâce à la roue journalière',lignes:p.bandeauRoue,vide:'Aucun bonus pour l’instant : fais tourner la roue.'}),
          h(Cadre_,p.cadreRoue))),
      cal);
  }

  /* ---------- Entrée ---------- */
  function page(j){
    var V=window.__SOREAL_IDLE_VDOM_V1__;
    if(!h||!V)return '';
    var vm=preparer_(j);
    if(!vm)return '';
    /* Même modèle que le dernier rendu : le MÊME objet est confié au pont, qui ne refait alors aucun rendu (l'équivalent de l'ancien raccourci « HTML identique » du morph) ; la page est le plus souvent identique d'une synchro à l'autre. */
    var cle=JSON.stringify(vm);
    if(dernier.vm&&cle===dernier.cle)vm=dernier.vm;else{dernier.cle=cle;dernier.vm=vm;}
    return V.monter(CLE,Page_,vm);
  }
  /* Rendu synchrone vers une chaîne HTML (tests, débogage) : jamais utilisé par la page. */
  function html(j){
    var V=window.__SOREAL_IDLE_VDOM_V1__;
    if(!h||!V)return '';
    var vm=preparer_(j);
    return vm?V.rendreHtml(Page_,vm):'';
  }
  /* Nouveau rendu local (changement de page d'un tableau), sans redessiner tout le menu. */
  function rerendre_(){
    var V=window.__SOREAL_IDLE_VDOM_V1__,Hh=H_(),j=Hh&&Hh.getIdleEtat&&Hh.getIdleEtat();
    if(!V||!j)return;
    var vm=preparer_(j);
    if(!vm)return;
    V.monter(CLE,Page_,vm);
    /* les modules qui reposent leur état animé après un redessin (angle de la roue…) le refont aussitôt, dans la même tâche */
    var hooks=window.__SOREAL_IDLE_APRES_REDESSIN_V1__;
    if(Array.isArray(hooks))hooks.forEach(function(f){try{f();}catch(_e){}});
  }
  var API={
    page:page,html:html,preparer:preparer_,Page:Page_,
    changerPage:function(cle,sens){
      var A=A_();if(!A)return;
      var c=cle==='roue'?'roue':'pit';
      A.pages[c]=Math.max(0,(A.pages[c]||0)+sens);
      rerendre_();
    }
  };
  window.__SOREAL_IDLE_MONEY_PIT_VDOM_V1__=API;
})();
