/*
 * SOREAL IDLE — page Augmentations rendue par composants Preact (chantier de fluidité, 2026-11-18, AGENTS.md règle n°4).
 *
 * Avant : la page (une paire « Augment + Upgrade » par ligne, environ 35 Ko de HTML) était fabriquée en chaîne puis comparée au DOM par le morph à chaque synchro. Maintenant : un arbre de composants (h(), sans JSX) rendu par
 * modules/vdom-pont-v1.js dans un conteneur PERSISTANT ; les cartes, les pistes, les boutons et le circuit LED gardent leurs nœuds d'un rendu à l'autre, seul ce qui change est touché.
 *
 * Mêmes classes CSS, mêmes identifiants et data-* (les modules qui lisent la page les retrouvent), mêmes textes, mêmes ponts window.__x__ : aucune règle de jeu, aucun texte, aucune valeur ne change. Les calculs (visuel rebasé,
 * durée du niveau suivant, formats) restent CEUX de augmentations-page-v1.js (window.__SOREAL_IDLE_AUGMENTATIONS_PAGE_V1__.aides) : une seule source de vérité. Composants PURS : les effets de bord (le repère de la barre, le
 * bruit) se décident dans preparer_(), une fois par rendu, comme avant.
 *
 * Ce qui reste IMPÉRATIF et pourquoi (AGENTS.md règle n°4) : les chiffres vivants sont réécrits par le tick du jeu à chaque image (niveau, prix, durée du niveau suivant, énergie placée, bonus total, énergie libre, remplissage des barres)
 * et par des modules qui posent des calques dans la page (canvas LED des tubes, particules). Ces nœuds-feuilles sont donc rendus VIDES de composants enfants (« Vivant_ ») : Preact n'écrit leur contenu que lorsque la valeur
 * du SERVEUR change par rapport à son dernier rendu (jamais en le comparant au DOM), et ne touche jamais à ce que le tick ou un autre module y a écrit ou ajouté. Les champs de saisie (Input, Cible) ne reçoivent leur valeur que
 * s'ils n'ont pas le focus, comme le morph le faisait. Le cadre d'allocation (Plafond / Idle / compteur, dessiné en chaîne par barre-allocation-v1.js) est un îlot mis à jour par le morph.
 *
 * Anti-spoil (règle n°2) : exactement les cinq exceptions déjà décidées, rien de plus. La liste ne contient que les paires débloquées et la prochaine, qui n'affiche que « ???????? » et le numéro du boss (quatrième et
 * cinquième exceptions) ; l'emplacement de l'Upgrade non possédée est UNE div vide, aria-hidden, sans enfant (quatrième exception).
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_AUGMENTATIONS_VDOM_V1__)return;

  var P_=window.preact||null;
  var h=P_&&P_.h;
  var CLE='augmentations';
  var dernier={cle:null,vm:null};

  function AP_(){return window.__SOREAL_IDLE_AUGMENTATIONS_PAGE_V1__;}
  function A_(){var m=AP_();return m&&m.aides;}
  function H_(){return window.__SOREAL_IDLE_META_HOST_V130__;}

  /* ---------- Nœuds-feuilles vivants : Preact écrit leur contenu seulement quand la valeur du serveur change ---------- */
  function Vivant_(){}
  if(P_&&P_.Component){
    Vivant_=function(props){P_.Component.call(this,props);};
    Vivant_.prototype=Object.create(P_.Component.prototype);
    Vivant_.prototype.constructor=Vivant_;
    Vivant_.prototype.ecrire_=function(){
      var el=this.base,p=this.props;
      if(!el)return;
      this.vu=p.html!=null?'h'+String(p.html):'t'+String(p.texte==null?'':p.texte);
      if(p.html!=null)el.innerHTML=String(p.html);else el.textContent=String(p.texte==null?'':p.texte);
    };
    Vivant_.prototype.componentDidMount=function(){this.ecrire_();};
    Vivant_.prototype.shouldComponentUpdate=function(n){
      var vu=n.html!=null?'h'+String(n.html):'t'+String(n.texte==null?'':n.texte);
      return vu!==this.vu||JSON.stringify(n.attrs||null)!==JSON.stringify(this.props.attrs||null);
    };
    Vivant_.prototype.componentDidUpdate=function(){
      var p=this.props,vu=p.html!=null?'h'+String(p.html):'t'+String(p.texte==null?'':p.texte);
      if(vu!==this.vu)this.ecrire_();
    };
    Vivant_.prototype.render=function(){var p=this.props;return h(p.tag||'span',Object.assign({},p.attrs||{}));};
  }
  /* Champ de saisie : la valeur n'est posée que si le champ n'a pas le focus (même règle que le morph) ; aucune valeur « contrôlée » côté Preact. */
  function Champ_(){}
  if(P_&&P_.Component){
    Champ_=function(props){P_.Component.call(this,props);};
    Champ_.prototype=Object.create(P_.Component.prototype);
    Champ_.prototype.constructor=Champ_;
    Champ_.prototype.poser_=function(){
      var el=this.base,v=String(this.props.valeur==null?'':this.props.valeur);
      if(!el)return;
      if(document.activeElement!==el&&el.value!==v)el.value=v;
    };
    Champ_.prototype.componentDidMount=function(){this.poser_();};
    Champ_.prototype.componentDidUpdate=function(){this.poser_();};
    Champ_.prototype.render=function(){return h('input',Object.assign({},this.props.attrs||{}));};
  }
  /* Cadre d'allocation (Plafond, Idle, total placé) : chaîne HTML de barre-allocation-v1.js, mise à jour sur place par le morph quand elle change. */
  function Ilot_(){}
  if(P_&&P_.Component){
    Ilot_=function(props){P_.Component.call(this,props);};
    Ilot_.prototype=Object.create(P_.Component.prototype);
    Ilot_.prototype.constructor=Ilot_;
    Ilot_.prototype.componentDidMount=function(){
      var el=this.base,M=window.__SOREAL_IDLE_MORPH_V1__;
      this.vu=String(this.props.html||'');
      if(!el)return;
      if(M&&M.morpherHtml){try{M.morpherHtml(el,this.vu);return;}catch(_e){}}
      el.innerHTML=this.vu;
    };
    Ilot_.prototype.shouldComponentUpdate=function(n){return String(n.html||'')!==this.vu;};
    Ilot_.prototype.componentDidUpdate=function(){
      var el=this.base,M=window.__SOREAL_IDLE_MORPH_V1__,html=String(this.props.html||'');
      this.vu=html;
      if(!el)return;
      if(M&&M.morpherHtml){try{M.morpherHtml(el,html);return;}catch(_e){}}
      el.innerHTML=html;
    };
    Ilot_.prototype.render=function(){var p=this.props;return h(p.tag||'div',Object.assign({},p.attrs||{}));};
  }

  /* ---------- Modèle de vue : même calcul que pageAugmentationsIdleV48_ (augmentations-page-v1.js), effets de bord compris ---------- */
  var TITRE_CIBLE='Niveau cible : l’énergie est retirée dès qu’il est atteint (ou passée à la piste suivante si « Faire suivre l’énergie » est coché). 0 = aucune cible. -1 = la piste fait passer son énergie à la suivante avec « Faire suivre l’énergie ».';
  var TITRE_INPUT='Un nombre, ou une fraction comme 1/8 (résolue en 1/8 de l\'énergie idle libre à la validation)';
  var AIDE_RESUME='Chaque Augment te donne un multiplicateur d’Attack et de Defense. Les multiplicateurs de tous tes Augments s’additionnent.';
  var AIDE_ETAPES=[
    'Place de l’Energy sur un Augment avec + : plus il en reçoit, plus sa barre se remplit vite.',
    'Quand la barre est pleine, l’Augment gagne un niveau si tu as assez d’Or (le coût d’un niveau = coût de base × ce niveau).',
    'Chaque Augment a une Upgrade associée : elle coûte de l’Or et de l’Energy, et multiplie le bonus de l’Augment par (1 + niveau²).',
    'Chaque Augment et chaque Upgrade a sa propre Energy et progresse en parallèle des autres.',
    'Tous les niveaux sont remis à zéro à chaque Rebirth.'
  ];
  var PRESETS_HTML='<div class="soreal-idle-bt-presets-v120"><span>⚡ Plafond d’énergie</span><button type="button" onclick="window.__presetAugmentIdleV1__(\'cap\',1)">Max</button><button type="button" onclick="window.__presetAugmentIdleV1__(\'cap\',.5)">1/2</button><button type="button" onclick="window.__presetAugmentIdleV1__(\'cap\',.25)">1/4</button></div>'+
    '<div class="soreal-idle-bt-presets-v120"><span>💤 Idle</span><button type="button" onclick="window.__presetAugmentIdleV1__(\'idle\',.5)">1/2</button><button type="button" onclick="window.__presetAugmentIdleV1__(\'idle\',.25)">1/4</button><button type="button" class="clear" onclick="window.__viderAugmentsIdleV1__()">Tout reprendre</button></div>';

  function preparer_(j){
    var A=A_(),H=H_();
    if(!A||!H)return null;
    /* Cas particuliers (défi sans Augmentations, système verrouillé) : la page historique en chaîne HTML s'en occupe (texte fixe). */
    var sys=A.systemeMeta(j,'augmentations');
    if(j&&j.systemes&&j.systemes.challenge&&j.systemes.challenge.active==='noAugmentations')return null;
    if(!sys||!sys.state||!sys.state.unlocked)return null;
    var snap=j&&j.systemes||{},defs=Array.isArray(snap.augmentations)?snap.augmentations:[],pairs=(sys.state.data||{}).pairs||{};
    var bossMax=H.idleEntier_(snap.records&&snap.records.highestBoss||0),boss=Math.max(0,H.idleEntier_(j&&j.bossVaincus)),gold=H.idleNombre_(snap.currencies&&snap.currencies.gold||0),mult=H.idleNombre_(snap.bonuses&&snap.bonuses.augmentationMultiplier||1);
    /* Repère de la barre : un redessin ne remet JAMAIS la barre en arrière (même logique que la page historique). */
    var etatAug=H.getIdleEtat();
    var visuelAugExistant=etatAug.__augmentationsVisualV215;
    var garderVisuelAug=Boolean(visuelAugExistant&&visuelAugExistant.src===defs&&defs.length);
    if(garderVisuelAug)A.rebaserVisuel(visuelAugExistant);
    if(!garderVisuelAug){
      etatAug.__augmentationsVisualV215=A.construireVisuel(j);
      A.rebaserVisuel(etatAug.__augmentationsVisualV215);
    }
    var rangAugment=function(d){var i=defs.findIndex(function(x){return x&&d&&x.id===d.id;});return Math.max(0,Math.min(5,Math.round(Math.max(0,i)*5/Math.max(1,defs.length-1))));};
    var fmtNiv=window.__SOREAL_IDLE_NUMBER_FORMAT_V1__;
    function piste(def,pair,upgrade,ok){
      var value=Math.max(0,H.idleNombre_(upgrade?pair.upgradeEnergy:pair.energy));
      var pct=Math.max(0,Math.min(100,H.idleNombre_(upgrade?def.upgradeProgressPct:def.progressPct)*100));
      var level=H.idleEntier_(upgrade?pair.upgradeLevel:pair.level);
      var label=upgrade?'⬆️ '+(A.NOMS_UPGRADES[def.upgrade&&def.upgrade.id]||(def.upgrade&&def.upgrade.name)||'Upgrade'):'';
      var coutBrut=Number(upgrade?def.upgradeGoldCost:def.goldCost)||0;
      var suffixe=upgrade?'upgrade':'main';
      var clef=def.id+':'+suffixe;
      var etaTexte=A.texteEta({seconds:upgrade?def.upgradeSecondsPerLevel:def.secondsPerLevel,progress:upgrade?def.upgradeProgressPct:def.progressPct,waiting:upgrade?def.upgradeWaitingGold:def.waitingGold,goldCost:upgrade?def.upgradeGoldCost:def.goldCost,gold:gold},0);
      var cible=Math.max(-1,H.idleEntier_(upgrade?def.upgradeTarget:def.target));
      var icone=upgrade?(A.ICONES_UPGRADES[def.upgrade&&def.upgrade.id]||'⚡'):(A.ICONES[def.id]||'🦾');
      var nom=upgrade?(label||'').replace('⬆️ ',''):(A.NOMS[def.id]||def.name||def.id);
      return {id:def.id,upgrade:upgrade,rang:rangAugment(def),ok:ok,icone:icone,nom:nom,clef:clef,
        niv:fmtNiv&&fmtNiv.entierLisible?fmtNiv.entierLisible(level):String(level),
        allocId:'sorealIdleAugAllocV1_'+def.id+'_'+suffixe,alloc:H.formatGrandNombreIdleV70_(value)+'⚡',
        coutOk:gold>=coutBrut,coutBrut:coutBrut,cout:H.formatGrandNombreIdleV70_(upgrade?def.upgradeGoldCost:def.goldCost)+' Or',
        eta:etaTexte,pct:pct,cible:cible};
    }
    var premierVerrouilleIndex=defs.findIndex(function(def){return boss<H.idleEntier_(def.unlockBoss||0);});
    var defsVisibles=premierVerrouilleIndex<0?defs:defs.slice(0,premierVerrouilleIndex+1);
    var liste=defsVisibles.map(function(def){
      var pair=pairs[def.id]||{};
      var mainOk=boss>=H.idleEntier_(def.unlockBoss||0);
      if(!mainOk)return {id:def.id,verrou:true,boss:H.idleEntier_(def.unlockBoss||0)};
      var upgradeOk=boss>=H.idleEntier_(def.upgrade&&def.upgrade.unlockBoss||999999);
      var iLed=Math.max(0,defs.indexOf(def))%A.COULEURS_LED.length;
      return {id:def.id,verrou:false,icone:A.ICONES[def.id]||'',ac:A.COULEURS_RANG[rangAugment(def)],ledPaire:A.COULEURS_LED[iLed][0],ledFond:A.COULEURS_LED[iLed][1],
        principale:piste(def,pair,false,mainOk),
        upgrade:def.upgrade?(upgradeOk?piste(def,pair,true,true):'vide'):null};
    });
    var alloc=window.__SOREAL_IDLE_ALLOC_V1__;
    return {
      aide:{ouvert:A.aideOuverte('augmentations'),resume:AIDE_RESUME,etapes:AIDE_ETAPES},
      mult:A.formatMultiplicateur(mult),bossMax:bossMax,
      montant:String(window.__lireMontantAugmentIdleV1__?window.__lireMontantAugmentIdleV1__():''),
      libre:H.formatGrandNombreIdleV70_(Math.max(0,H.idleNombre_(j&&j.energie))),
      groupe:PRESETS_HTML+(alloc?alloc.compteur('energy','augmentations'):''),
      avance:Boolean(snap.augmentationsAdvance),liste:liste
    };
  }

  /* ---------- Composants ---------- */
  function Piste_(p){
    var suf=p.upgrade?'upgrade':'main';
    var id=p.id,ok=p.ok;
    return h('div',{class:'aug-piste-v2'+(p.upgrade?' upgrade':''),'data-rang-v1':String(p.rang),style:'opacity:'+(ok?'1':'.45')},
      h('div',{class:'aug-tete-v2'},h('span',{class:'aug-badge-v2 '+(p.upgrade?'puissant':'normal')},h('i',null,p.icone)),h('span',{class:'aug-nom-piste-v2'},p.nom)),
      h('div',{class:'aug-ligne-haut'},
        h('div',{class:'aug-niv-bloc'},h('span',{class:'aug-niv-lib'},'Niveau'),h('b',{class:'aug-niv-val'},h(Vivant_,{tag:'span',attrs:{'data-idle-aug-niv-v1':p.clef},texte:p.niv}))),
        h(Vivant_,{tag:'span',attrs:{id:p.allocId,'class':'soreal-idle-bt-allocation-v120'},texte:p.alloc})),
      h('div',{class:'aug-cout-ligne'},
        h('span',{'data-idle-aug-parniveau-v1':id+':'+suf}),
        h('span',{class:'aug-cout-lib'},'Prochain niveau'),
        h(Vivant_,{tag:'span',attrs:{'class':'aug-cout-val '+(p.coutOk?'ok':'non'),'data-idle-aug-cout-v1':p.clef,'data-cout':String(p.coutBrut)},texte:p.cout})),
      h(Vivant_,{tag:'div',attrs:{'class':'aug-eta','data-idle-aug-eta-v1':id+':'+suf},html:p.eta}),
      /* tube de verre : le liquide monte avec la progression ; le canvas LED est posé dans le tube par aug-led-barres-v1.js (jamais retiré par Preact) */
      h('div',{class:'aug-tube-v2'},h('div',{'data-idle-aug-bar-v215':id+':'+suf,'class':'aug-liquide-v2',style:'width:100%;transform:scaleX('+(p.pct/100)+');transform-origin:left center;will-change:transform;transition:none'},h('i',{class:'aug-reflet-v2'}))),
      h('div',{class:'aug-bas-v2'},
        h('label',{class:'aug-cible-v2'},h('span',null,'Cible'),
          h(Champ_,{valeur:String(p.cible),attrs:ok?{type:'number',inputmode:'numeric',min:'-1',step:'1',title:TITRE_CIBLE,onChange:function(e){window.__cibleAugmentIdleV1__(id,p.upgrade,e.currentTarget.value);}}:{type:'number',inputmode:'numeric',min:'-1',step:'1',disabled:true,title:TITRE_CIBLE}})),
        h('div',{class:'soreal-idle-bt-actions-v120'},[['plus','+'],['moins','−'],['max','Max'],['zero','0']].map(function(b){
          var a={type:'button',key:b[0]};
          if(b[0]==='zero')a.title='Retirer toute l’énergie de cette barre';
          if(ok)a.onClick=function(){window.__ajusterAugmentIdleV1__(id,p.upgrade,b[0]);};else a.disabled=true;
          return h('button',a,b[1]);
        }))));
  }
  function Ligne_(l){
    if(l.verrou){
      /* Cinquième exception (AGENTS.md) : la PROCHAINE augmentation, « ???????? » et le numéro du boss, rien d'autre. */
      return h('div',{class:'soreal-idle-section-v8',style:'margin:0;opacity:.55'},
        h('div',{style:'display:flex;justify-content:space-between;gap:8px'},h('b',null,'🔒 ????????')),
        h('div',{class:'aug-verrou-boss-v1',style:'font-size:14px;color:#aeb5c8;margin-top:4px'},'Bats le boss '+l.boss+' pour l’obtenir.'));
    }
    return h('div',{class:'soreal-idle-section-v8 aug-paire-v2','data-icone':l.icone,style:'margin:0;--ac:'+l.ac+';--led-paire:'+l.ledPaire+';--led-fond:'+l.ledFond},
      h('div',{class:'aug-pistes-v2'},
        h(Piste_,Object.assign({key:'main'},l.principale)),
        l.upgrade==='vide'
          /* Quatrième exception (AGENTS.md) : UNE div vide, aria-hidden, sans enfant ni fond propre, qui tient la cellule de la vraie piste d'Upgrade. */
          ?h('div',{class:'aug-emplacement-v2','aria-hidden':'true',key:'vide'})
          :(l.upgrade?h(Piste_,Object.assign({key:'up'},l.upgrade)):null)));
  }
  function Page_(p){
    return h(P_.Fragment,null,
      h('div',{class:'soreal-idle-page-head-v28'},h('div',{class:'soreal-idle-page-title-v28'},'🦾 Augmentations'),h('div',{class:'soreal-idle-page-sub-v28'},'Renforce ton Attack et ta Defense en y investissant de l’Energy et de l’Or.')),
      h('details',{class:'soreal-idle-aide-v1','data-idle-aide-v1':'augmentations',open:p.aide.ouvert,onToggle:function(e){window.__basculerAideMenuIdleV1__('augmentations',e.currentTarget);}},
        h('summary',null,'💡 À quoi ça sert ?'),
        h('p',{class:'soreal-idle-aide-resume-v1'},p.aide.resume),
        h('ol',{class:'soreal-idle-aide-etapes-v1'},p.aide.etapes.map(function(e,i){return h('li',{key:i},e);}))),
      h('div',{class:'soreal-idle-summary-grid-v28'},
        h('div',{class:'soreal-idle-summary-v28'},'💪 Bonus total Attack & Defense',h(Vivant_,{tag:'b',attrs:{id:'sorealIdleAugMultV1'},texte:p.mult})),
        h('div',{class:'soreal-idle-summary-v28'},'👹 Boss max',h('b',null,String(p.bossMax)))),
      h('div',{class:'soreal-idle-bt-toolbar-v120'},
        h('div',{class:'soreal-idle-bt-entree-v1'},h('div',{class:'soreal-idle-bt-input-box-v120'},h('label',{'for':'sorealIdleAugInputV1'},'🎚️ Input'),
          h(Champ_,{valeur:p.montant,attrs:{id:'sorealIdleAugInputV1',type:'text',inputmode:'decimal',title:TITRE_INPUT,
            onInput:function(e){window.__saisirMontantAugmentIdleV1__(e.currentTarget.value);},
            onBlur:function(e){window.__resoudreFractionInputIdleV1__(e.currentTarget);window.__saisirMontantAugmentIdleV1__(e.currentTarget.value);}}}))),
        h('div',{class:'soreal-idle-bt-info-v1'},'Énergie libre : ',h(Vivant_,{tag:'b',attrs:{id:'sorealIdleAugEnergieLibreV1'},texte:p.libre}),' ⚡'),
        h(Ilot_,{tag:'div',attrs:{'class':'soreal-idle-bt-groupe-v1','data-bt-groupe-v1':'energy'},html:p.groupe})),
      h('label',{class:'aug-avance-v2'},h('input',{type:'checkbox',checked:p.avance,onChange:function(e){window.__avanceAugmentsIdleV1__(e.currentTarget.checked);}}),
        h('span',null,h('b',null,'Faire suivre l’énergie'),' Quand une piste atteint sa cible, son énergie passe à la suivante (l’Augment, puis sa version puissante, paire après paire).')),
      h('div',{style:'display:grid;gap:10px;margin-top:10px'},p.liste.map(function(l){return h(Ligne_,Object.assign({key:l.id},l));})));
  }

  /* ---------- Entrée ---------- */
  function page(j){
    var V=window.__SOREAL_IDLE_VDOM_V1__;
    if(!h||!V)return '';
    var vm=preparer_(j);
    if(!vm)return '';
    /* Même modèle que le dernier rendu : le MÊME objet est confié au pont, qui ne refait alors aucun rendu (équivalent du raccourci « HTML identique » du morph). */
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
  window.__SOREAL_IDLE_AUGMENTATIONS_VDOM_V1__={page:page,html:html,preparer:preparer_,Page:Page_};
})();
