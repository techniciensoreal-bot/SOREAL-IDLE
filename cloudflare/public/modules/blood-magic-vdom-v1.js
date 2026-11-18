/*
 * SOREAL IDLE — page Magie du sang rendue par composants Preact (chantier de fluidité, 2026-11-18 ; même démarche que yggdrasil-elfes-v1.js et aventure-vdom-v1.js).
 *
 * Avant : pageBloodMagicIdleV48_ (blood-magic-v1.js) fabriquait ~80 Ko de HTML toutes les 4 s, comparés au DOM par le morph de la page. Maintenant la coquille de la page (aide, tuiles, sorts, barre d'outils,
 * cartes de rituels) est un composant Preact dans un conteneur PERSISTANT : les nœuds restent les mêmes d'un rendu à l'autre, seul ce qui change est touché. La page en chaînes HTML (blood-magic-v1.js) reste le
 * REPLI si Preact n'est pas chargé ; mêmes classes, mêmes ids, mêmes textes, mêmes ponts window.__x__ que cette chaîne.
 *
 * Ce qui NE passe PAS par Preact (règle n°4, « Blood Magic » d'AGENTS.md ; haute fréquence ou nœuds écrits à la main par d'autres modules) :
 *  - LA SCÈNE d'un rituel (.bm-scene, étagère, bac : sang-rituel-decor-v1.js) : un « îlot » vide que Preact ne remplit jamais lui-même. Son HTML (decor.scene, calculé comme avant) est posé UNE fois puis mis à jour par le morph
 *    existant, SUR l'îlot, avec ses gardes (data-morph-garder, data-morph-classes-gardees, attributs gardés) : les calices, la sangsue, les coupures, la punaise, le jet… ne sont donc jamais recréés ;
 *    les animations ne dépendent d'aucun chiffre affiché (événement soreal-rituel-termine, phaseRituelEtat calculé) ni du rendu Preact ;
 *  - les valeurs ÉCRITES EN DIRECT par les ticks (sang collecté, Or, Magic libre/allouée, compteur « N complété(s) », ligne du temps avant le prochain rituel, boutons « Lancer le sort ») : des nœuds « vivants » (Vif) que Preact crée
 *    mais dont il n'écrit le contenu que quand LA VALEUR VENUE DU MOTEUR change (comparée à sa dernière écriture, jamais au DOM, règle n°4) ; il ne se bat donc pas avec les ticks.
 * Un rendu Preact n'a lieu qu'à chaque synchro (≈ toutes les 4 s) ou action : jamais à haute fréquence.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_BLOOD_VDOM_V1__)return;
  function P_(){return window.preact||null;}
  function pont_(){return window.__SOREAL_IDLE_VDOM_V1__||null;}
  function disponible(){return Boolean(P_()&&pont_()&&window.__SOREAL_IDLE_SANG_DECOR_V1__);}
  function appeler_(nom){
    var f=window[nom];
    if(typeof f==='function')return f.apply(window,Array.prototype.slice.call(arguments,1));
  }
  /* Sang minimum par sort, identique au serveur (jamais affiché) : sous ce seuil le bouton Lancer est inactif. */
  var SANG_MINI_SORTS={numberBoost:1,ironPill:100,bloodSpaghetti:1e4,counterfeitGold:1e6,leeches:5e22};
  var AUTO_CLES={numberBoost:'autoNumberBoost',bloodSpaghetti:'autoBloodSpaghetti',counterfeitGold:'autoCounterfeitGold'};
  var NOMS_ICONES_SORTS={numberBoost:'🔢',ironPill:'💊',bloodSpaghetti:'🍝',counterfeitGold:'💰',leeches:'🪱'};

  /* ---------- Modèle de vue : tous les effets de bord et tous les calculs, dans l'ordre de l'ancienne page ; les composants ne font que dessiner ---------- */
  function preparer_(j,A){
    var H=window.__SOREAL_IDLE_META_HOST_V130__;
    var decor=window.__SOREAL_IDLE_SANG_DECOR_V1__;
    var s=A.systemeMeta(j,'bloodMagic');
    decor.css();
    var snap=j&&j.systemes||{};
    var defs=Array.isArray(snap.bloodRituals)?snap.bloodRituals:[];
    var data=s.state.data||{};
    var rituals=data.rituals||{};
    var blood=H.idleNombre_(snap.currencies&&snap.currencies.blood||0);
    var gold=H.idleNombre_(snap.currencies&&snap.currencies.gold||0);
    var spells=data.spells||{};
    var nb=function(v,d){return H.formatGrandNombreIdleV70_(v,d);};
    var spellDefs=A.sortsDefinis(H,snap,data,blood);
    var allocMagicActuelle=Math.max(0,H.idleNombre_(s.state.allocation&&s.state.allocation.magic));
    var ressourceMagie=snap.resources&&snap.resources.magic;
    var magicLibre=Math.max(0,H.idleNombre_(ressourceMagie&&ressourceMagie.current));
    var bmView=snap.bloodMagicView||null;
    A.preparerVisuels(H,bmView,A.ancre);
    A.installerSon();
    var ouvertes=window.__idleBloodInfosOuvertesV1||{};
    var sorts=spellDefs.map(function(sp){
      var recharge=sp.recharge>0;
      var sangMini=SANG_MINI_SORTS[sp.id]||1;
      var cle=AUTO_CLES[sp.id];
      return {
        id:sp.id,nom:(NOMS_ICONES_SORTS[sp.id]?NOMS_ICONES_SORTS[sp.id]+' ':'')+sp.nom,
        desc:sp.desc||'',apercu:sp.apercu||'',actuel:sp.actuel||'',
        ouvert:Boolean(ouvertes[sp.id]),
        rechargeTxt:recharge?'⏳ Prêt dans '+A.formatDuree(sp.recharge/1000):'',
        auto:cle?{actif:Boolean(spells&&spells[cle])}:null,
        sangMini:sangMini,recharge:recharge,
        peut:blood>=sangMini&&!recharge,
        texte:blood>=sangMini?(recharge?'En recharge':'Lancer le sort'):'Pas assez de sang'
      };
    });
    var rituelsModele=defs.map(function(def,idxRituel){
      var rangRituel=Math.max(0,Math.min(5,Math.round(idxRituel*5/Math.max(1,defs.length-1))));
      var r=rituals[def.id]||{};
      var selectionne=data.activeRitual===def.id;
      var rv=((bmView&&bmView.rituals)||[]).find(function(x){return x&&x.id===def.id;})||null;
      var magieR=rv?Math.max(0,H.idleNombre_(rv.magic)):0;
      var active=magieR>0;
      var progressionActive=active&&rv&&rv.secondsPerCompletion!=null;
      var figees=(window.__bloodFigeV1&&typeof window.__bloodFigeV1==='object')?window.__bloodFigeV1:{};
      var fractionVue=rv?H.idleNombre_(rv.progressFraction):0;
      var pct=progressionActive?Math.max(0,Math.min(1,1-H.idleNombre_(rv.etaSeconds)/rv.secondsPerCompletion)):(fractionVue>0?fractionVue:(figees[def.id]!=null?H.idleNombre_(figees[def.id]):0));
      var montrerBarre=active||figees[def.id]!=null;
      var etaTexte=rv&&rv.etaSeconds!=null
        ?'⏱ '+A.etaTexte(rv)+' avant le prochain rituel complété'
        :(montrerBarre?'Alloue de la Magic (ci-dessus) pour faire progresser ce rituel.':'');
      var idHtml=H.idleHtml_(def.id);
      /* Barre du moteur (animée par soreal-idle-ui.js) et gouttes : dans l'HTML de la scène, comme avant. */
      var barre=montrerBarre
        ?'<div data-idle-blood-bar-v1="'+idHtml+'" class="bm-sang" style="width:100%;transform:scaleX('+pct+');transform-origin:left center;will-change:transform;transition:none"></div>'+(progressionActive?A.gouttesHtml:'')
        :'';
      var compte=A.compteAffiche(def.id,r.completions||0);
      var sceneHtml=decor.scene({id:idHtml,compte:Number(r.completions||0),sang:Number(def.blood||0),sangTotal:(typeof window.__sangRituelAfficheV1__==='function'?window.__sangRituelAfficheV1__(idHtml,compte):null),barre:barre,saigne:progressionActive,rang:rangRituel});
      return {
        id:def.id,idHtml:idHtml,rang:rangRituel,
        nom:A.noms[def.id]||def.name||def.id,selectionne:selectionne,
        compteTxt:String(H.idleEntier_(compte)),
        coutOk:gold>=(Number(def.gold)||0),coutOr:Number(def.gold)||0,
        coutTxt:'−'+H.formatGrandNombreIdleV70_(def.gold||0)+' Gold',gainTxt:'+'+H.formatGrandNombreIdleV70_(def.blood||0)+' sang',
        sceneHtml:sceneHtml,magieTxt:H.formatGrandNombreIdleV70_(magieR),etaTexte:etaTexte
      };
    });
    return {
      enteteHtml:decor.entete('Magie du sang','Transforme de la Magic et de l’Or en sang, puis dépense ce sang dans des sorts.'),
      aideHtml:A.carteAide('bloodMagic','Le sang sert à lancer des sorts. Le plus courant, Boost du nombre par le sang, ajoute 1 au multiplicateur du Nombre (le « Bonus de Magie du sang » de la Renaissance) par point de sang dépensé : c’est ce qui te donne un plus gros Nombre à la Renaissance.',[
        'Choisis un rituel et place-y de la Magic avec + : plus il en reçoit, plus vite il se termine.',
        'Chaque fois qu’un rituel se termine, il dépense de l’Or et produit du sang.',
        'Le sang s’accumule dans ta réserve. Lancer un sort utilise tout ton sang d’un coup.',
        'Le sang est remis à zéro à chaque Rebirth. Les effets des sorts ne durent que jusqu’au prochain Rebirth, sauf ceux marqués « permanent ».'
      ]),
      sangTxt:H.formatGrandNombreIdleV70_(A.sangAffiche()),orTxt:H.formatGrandNombreIdleV70_(gold),
      sorts:sorts,
      legendeHtml:A.legende('Magic',false,true),
      montant:String(A.montant()),
      libreTxt:H.formatGrandNombreIdleV70_(magicLibre),allocTxt:H.formatGrandNombreIdleV70_(allocMagicActuelle),
      compteurHtml:window.__SOREAL_IDLE_ALLOC_V1__?window.__SOREAL_IDLE_ALLOC_V1__.compteur('magic','bloodMagic'):'',
      rituels:rituelsModele,nb:nb
    };
  }

  /* ---------- Composants ---------- */
  var C_={};
  function definirClasses_(){
    if(C_.Vif)return C_;
    var P=P_(),h=P.h,Component=P.Component;

    /* HTML déjà fabriqué par un autre module (en-tête, aide, compteur d'allocation) : posé tel quel, réécrit seulement s'il change. */
    function Html(props){return h('div',{style:'display:contents',dangerouslySetInnerHTML:{__html:props.html||''}});}

    /* Nœud « vivant » : Preact le crée et le range, mais n'écrit son contenu que quand la valeur du moteur change (comparée à SA dernière écriture) : les ticks (textContent, innerHTML) restent maîtres du reste. */
    class Vif extends Component{
      constructor(p){super(p);this.el=null;this.dernier=undefined;var me=this;this.ref=function(el){me.el=el;};}
      componentDidMount(){this.ecrire();}
      componentDidUpdate(){this.ecrire();}
      ecrire(){
        var p=this.props,el=this.el;
        if(!el)return;
        var v=p.valeur==null?'':String(p.valeur);
        if(this.dernier===v)return;
        this.dernier=v;
        if(el.textContent!==v)el.textContent=v;
      }
      render(p){
        var a=Object.assign({},p.attrs||{});
        a.ref=this.ref;
        return h(p.tag||'span',a);
      }
    }

    /* Îlot de la scène d'un rituel : Preact ne remplit jamais son contenu. */
    class SceneIle extends Component{
      constructor(p){super(p);this.el=null;this.dernier=null;this.t=0;var me=this;this.ref=function(el){me.el=el;};}
      componentDidMount(){this.maj();}
      componentDidUpdate(){this.maj();}
      maj(){
        var el=this.el,html=this.props.html;
        if(!el)return;
        var M=window.__SOREAL_IDLE_MORPH_V1__;
        /* HTML identique au dernier rendu et vu il y a moins de 4 s : rien à comparer (resynchronisation complète au moins toutes les 4 s, comme le morph de la page). */
        if(this.dernier===html&&Date.now()-this.t<4000)return;
        this.dernier=html;this.t=Date.now();
        if(M&&typeof M.morpherHtml==='function')M.morpherHtml(el,html);
        else el.innerHTML=html;
      }
      render(){return h('div',{class:'bm-scene-ile',style:'display:contents',ref:this.ref});}
    }

    /* Bouton « Lancer le sort » : disabled / onclick / texte sont écrits par la minuterie de la page (majBoutonsSortsV1_) ; Preact ne les écrit qu'à la création et quand l'état venu du moteur change. */
    class Lancer extends Component{
      constructor(p){super(p);this.el=null;this.cle=null;var me=this;this.ref=function(el){me.el=el;};}
      componentDidMount(){this.ecrire();}
      componentDidUpdate(){this.ecrire();}
      ecrire(){
        var p=this.props,el=this.el;
        if(!el)return;
        var cle=(p.peut?'1':'0')+'|'+p.texte;
        if(this.cle===cle)return;
        this.cle=cle;
        if(p.peut){
          el.disabled=false;
          el.setAttribute('onclick',"window.__lancerSortBloodIdleV1__('"+p.id+"')");
        }else{
          el.disabled=true;
          el.removeAttribute('onclick');
        }
        if(el.textContent!==p.texte)el.textContent=p.texte;
      }
      render(p){
        return h('button',{type:'button',class:'soreal-idle-expand-button-v25 soreal-idle-blood-lancer-v1','data-sort-id':p.id,'data-sang-mini':String(p.sangMini),'data-recharge':p.recharge?'1':'0',ref:this.ref});
      }
    }

    function Sort(p){
      var sp=p.sort,infos=Boolean(sp.desc||sp.apercu);
      return h('div',{class:'soreal-idle-blood-sort-v1','data-sort':sp.id},
        h('div',{class:'soreal-idle-blood-sort-tete-v1'},
          h('b',null,sp.nom),
          infos?h('button',{type:'button',class:'soreal-idle-blood-info-v1',title:'Voir les effets','aria-expanded':sp.ouvert?'true':'false',onClick:function(e){appeler_('__basculerInfoSortBloodIdleV1__',sp.id,e.currentTarget);}},'i'):null),
        sp.actuel?h('div',{class:'soreal-idle-blood-sort-actuel-v1'},sp.actuel):null,
        infos?h('div',{id:'sorealIdleBloodSortInfosV1_'+sp.id,class:'soreal-idle-blood-sort-infos-v1',hidden:!sp.ouvert},
          sp.desc?h('div',{class:'soreal-idle-blood-sort-desc-v1'},sp.desc):null,
          sp.apercu?h('div',{class:'soreal-idle-blood-sort-apercu-v1'},sp.apercu):null):null,
        sp.rechargeTxt?h('div',{class:'soreal-idle-blood-sort-apercu-v1'},sp.rechargeTxt):null,
        sp.auto?h('button',{type:'button',class:'soreal-idle-blood-auto-v1','data-sort-auto':sp.id,'aria-pressed':sp.auto.actif?'true':'false',title:'Lance ce sort chaque seconde avec sa part du sang',onClick:function(){appeler_('__actionMetaV47__',{action:'setBloodAutoSpell',spell:sp.id});}},'Automatique : '+(sp.auto.actif?'activé':'désactivé')):null,
        h(Lancer,{id:sp.id,sangMini:sp.sangMini,recharge:sp.recharge,peut:sp.peut,texte:sp.texte}));
    }

    /* Champ Input : non contrôlé (d'autres modules l'écrivent par son id : presets, barre d'allocation commune) ; la valeur n'est posée qu'à la création et quand le montant du jeu change. */
    class Saisie extends Component{
      constructor(p){super(p);this.el=null;this.dernier=undefined;var me=this;this.ref=function(el){me.el=el;};}
      componentDidMount(){this.ecrire();}
      componentDidUpdate(){this.ecrire();}
      ecrire(){
        var el=this.el,v=String(this.props.valeur);
        if(!el||this.dernier===v)return;
        this.dernier=v;
        var actif=typeof document!=='undefined'&&document.activeElement===el;
        if(!actif&&el.value!==v)el.value=v;
      }
      render(){
        return h('input',{id:'sorealIdleBloodInputV1',type:'text',inputmode:'decimal',title:'Un nombre, ou une fraction comme 1/8 (résolue en 1/8 de la Magic libre à la validation)',ref:this.ref,
          onInput:function(e){appeler_('__saisirMontantAugmentIdleV1__',e.target.value);},
          onBlur:function(e){appeler_('__resoudreFractionInputIdleV1__',e.target);appeler_('__saisirMontantAugmentIdleV1__',e.target.value);}});
      }
    }

    function Barre(m){
      return h(P.Fragment,null,
        m.legendeHtml?h(Html,{html:m.legendeHtml}):null,
        h('div',{class:'soreal-idle-bt-toolbar-v120'},
          h('div',{class:'soreal-idle-bt-entree-v1'},h('div',{class:'soreal-idle-bt-input-box-v120'},h('label',{for:'sorealIdleBloodInputV1'},'🎚️ Input'),h(Saisie,{valeur:m.montant}))),
          h('div',{class:'soreal-idle-bt-info-v1'},'Magic libre : ',h(Vif,{tag:'b',attrs:{id:'sorealIdleBloodLibreV1'},valeur:m.libreTxt}),' 🔮 · Magic allouée aux rituels : ',h(Vif,{tag:'b',attrs:{id:'sorealIdleBloodAllocV1',class:'soreal-idle-bt-allocation-v120'},valeur:m.allocTxt}),' 🔮'),
          h('div',{class:'soreal-idle-bt-groupe-v1','data-bt-groupe-v1':'magic'},
            h('div',{class:'soreal-idle-bt-presets-v120'},h('span',null,'🔮 Plafond de magie'),
              h('button',{type:'button',onClick:function(){appeler_('__presetBloodMagicIdleV1__','cap',1);}},'Max'),
              h('button',{type:'button',onClick:function(){appeler_('__presetBloodMagicIdleV1__','cap',0.5);}},'1/2'),
              h('button',{type:'button',onClick:function(){appeler_('__presetBloodMagicIdleV1__','cap',0.25);}},'1/4')),
            h('div',{class:'soreal-idle-bt-presets-v120'},h('span',null,'💤 Idle'),
              h('button',{type:'button',onClick:function(){appeler_('__presetBloodMagicIdleV1__','idle',0.5);}},'1/2'),
              h('button',{type:'button',onClick:function(){appeler_('__presetBloodMagicIdleV1__','idle',0.25);}},'1/4'),
              h('button',{type:'button',class:'clear',onClick:function(){appeler_('__viderBloodMagicIdleV1__');}},'Tout reprendre')),
            m.compteurHtml?h(Html,{html:m.compteurHtml}):null)));
    }

    function Rituel(p){
      var r=p.r,id=r.idHtml;
      function clic(mode){return function(){appeler_('__ajusterRituelBloodMagicIdleV1__',id,mode);};}
      return h('div',{id:'sorealIdleBloodRitualV1_'+id,class:'bm-rituel','data-rang-v1':String(r.rang),style:'margin:0'},
        h('div',{class:'bm-rituel-tete'},
          h('b',{class:'bm-rituel-nom'},r.nom,h('span',{id:'sorealIdleBloodMarkerV1_'+id},r.selectionne?' ▶':'')),
          h('span',{class:'bm-rituel-compte'},h(Vif,{tag:'b',attrs:{id:'sorealIdleBloodCountV1_'+id,'data-n':r.compteTxt},valeur:r.compteTxt}),' complété(s)')),
        h('div',{class:'soreal-idle-blood-ritual-desc-v1'},'Chaque fois qu’il se termine : ',
          h('b',{class:'or-cout-v1 '+(r.coutOk?'or-ok':'or-non'),'data-cout-or':String(r.coutOr)},r.coutTxt),' → ',h('b',null,r.gainTxt)),
        h(SceneIle,{html:r.sceneHtml}),
        h('div',{class:'soreal-idle-blood-alloc-ligne-v1'},'🔮 Magic allouée : ',h(Vif,{tag:'b',attrs:{id:'sorealIdleBloodRitualAllocV1_'+id,'data-idle-alloc-pop-v1':'1'},valeur:r.magieTxt})),
        h(Vif,{tag:'div',attrs:{id:'sorealIdleBloodEtaLineV1_'+id,class:'bm-eta'},valeur:r.etaTexte}),
        h('div',{class:'soreal-idle-bt-actions-v120',style:'margin-top:9px'},
          h('button',{type:'button',title:'Placer la valeur de Input en Magic sur ce rituel (les autres rituels gardent la leur)','aria-label':'Placer',onClick:clic('plus')},h('span',{class:'soreal-idle-blood-croix-v1'},'✝︎')),
          h('button',{type:'button',title:'Retirer la valeur de Input',onClick:clic('moins')},'−'),
          h('button',{type:'button',title:'Placer toute la Magic libre sur ce rituel',onClick:clic('cap')},'Max'),
          h('button',{type:'button',title:'Retirer toute l’énergie de cette barre',onClick:clic('zero')},'0')));
    }

    function Page(m){
      return h('div',{class:'soreal-idle-bloodmagic-v1'},
        h(Html,{html:m.enteteHtml}),
        h(Html,{html:m.aideHtml}),
        h('div',{class:'soreal-idle-summary-grid-v28'},
          h('div',{class:'soreal-idle-summary-v28 bm-sang-total-v1'},'🩸 Sang collecté',h(Vif,{tag:'b',attrs:{id:'sorealIdleBloodTotalV1'},valeur:m.sangTxt})),
          h('div',{class:'soreal-idle-summary-v28'},'🪙 Gold',h(Vif,{tag:'b',attrs:{id:'sorealIdleBloodOrV1'},valeur:m.orTxt}))),
        h('h3',{class:'soreal-idle-blood-titre-v1'},'Sorts ',h('small',null,'dépensent tout ton sang')),
        h('div',{class:'soreal-idle-blood-sorts-v1'},m.sorts.map(function(sp){return h(Sort,{key:sp.id,sort:sp});})),
        h(Barre,m),
        h('h3',{class:'soreal-idle-blood-titre-v1'},'Rituels ',h('small',null,'produisent du sang')),
        h('div',{class:'bm-grille'},m.rituels.map(function(r){return h(Rituel,{key:r.id,r:r});})));
    }
    C_={Vif:Vif,Html:Html,SceneIle:SceneIle,Lancer:Lancer,Sort:Sort,Saisie:Saisie,Barre:Barre,Rituel:Rituel,Page:Page};
    return C_;
  }

  /* Renvoie la chaîne STABLE à mettre dans la page (conteneur Preact), ou '' si Preact manque (la page en chaînes HTML prend alors le relais). */
  function page(j,A){
    if(!disponible())return '';
    var C=definirClasses_();
    var m=preparer_(j,A);
    return pont_().monter('sang',C.Page,m);
  }
  /* HTML rendu (tests, débogage). */
  function html(j,A){
    if(!disponible())return '';
    var C=definirClasses_();
    return pont_().rendreHtml(C.Page,preparer_(j,A));
  }

  window.__SOREAL_IDLE_BLOOD_VDOM_V1__={disponible:disponible,page:page,html:html,preparer:preparer_,composants:definirClasses_};
})();
