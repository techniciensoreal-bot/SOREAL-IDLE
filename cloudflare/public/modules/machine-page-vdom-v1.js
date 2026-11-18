/*
 * SOREAL IDLE — page « Machine à remonter le temps cassée » rendue par composants Preact (chantier de fluidité, 2026-11-18, AGENTS.md règle n°4).
 *
 * Avant : pageTimeMachineIdleV48_ (augmentations-page-v1.js) fabriquait une chaîne HTML de ~60 Ko (tours, écrans à cristaux liquides, grande machine en SVG, statistiques), comparée au DOM par modules/morph-v1.js à chaque redessin
 * (toutes les 4 s tant que le menu est ouvert). Maintenant : pageTimeMachineIdleV48_ calcule un MODÈLE DE VUE (mêmes valeurs, mêmes règles, mêmes effets de bord qu'avant : repère de temps, aide, anti-spoil) et ce module le dessine
 * par composants (h(), sans JSX) dans un conteneur persistant (modules/vdom-pont-v1.js) : les nœuds restent les mêmes d'un rendu à l'autre, seul ce qui change est touché.
 *
 * Ce qui est animé ou écrit EN DIRECT reste impératif (ui-machine-temporelle-v1.js : barres, tubes, comptes à rebours, écrans LCD, chiffres ; machine-dessin-v1.js : roues, aiguille, tas de pièces, image du mob ; tm-bulles-canvas-v1.js) :
 *  - leurs nœuds sont rendus par Preact (même classe, mêmes attributs data-tm-*, mêmes id), puis écrits à la main par ces modules ; Preact compare avec son PROPRE dernier rendu (jamais avec le DOM) : il n'écrit un texte, un style ou un
 *    attribut que si la valeur annoncée par le serveur a changé, comme le morph le faisait à chaque redessin ;
 *  - ce que le morph RETIRAIT à chaque redessin et que le code en direct repose ensuite (ancre du compte à rebours data-tm-eta-at / -last / data-tm-niveau0, aria-valuenow de la barre, titre de la barre) est retiré ici par une
 *    fonction « ref » à chaque rendu : la mécanique de re-ancrage (« plus jamais un recul de barre ») est EXACTEMENT celle d'avant ;
 *  - les blocs dont un module dessine tout l'intérieur (tas de pièces, rouages et aiguilles du haut des tours, machine centrale, barre d'outils d'allocation) sont des « îlots » : leur élément appartient à Preact, leur contenu est une chaîne
 *    HTML posée une fois puis comparée par le MORPH (le même qu'avant, mêmes protections data-morph-*) seulement quand la chaîne change ; chaîne identique : aucun travail.
 * Anti-spoil (règle n°2) : rien de nouveau n'est affiché ; la tour Magie n'existe pas tant que Blood Magic est verrouillé (le modèle ne la contient pas) ; un facteur à 100 % n'est pas listé.
 * Expose window.__SOREAL_IDLE_MACHINE_PAGE_V1__ = { page(vm), html(vm) }.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_MACHINE_PAGE_V1__)return;

  var P_=window.preact||null;
  var h=P_&&P_.h;

  /* Îlot : le contenu de l'élément est une chaîne HTML tenue par un module ; elle est posée puis comparée par le MORPH (le même qu'avant, mêmes protections data-morph-*), et seulement si la chaîne a changé ; sans morph : innerHTML. */
  function ile_(html){
    return function(el){
      if(!el||el.__ileHtmlV1===html)return;
      var M=window.__SOREAL_IDLE_MORPH_V1__;
      if(!M||!M.morpherHtml)el.innerHTML=html;else M.morpherHtml(el,html);
      el.__ileHtmlV1=html;
    };
  }
  /* Ce que le redessin (morph) retirait de l'élément parce que la page ne le contenait pas : retiré ici à chaque rendu, le code en direct le repose. */
  function retirer_(noms){
    return function(el){if(!el)return;for(var i=0;i<noms.length;i++)if(el.hasAttribute(noms[i]))el.removeAttribute(noms[i]);};
  }
  function ANCRES_ETA_(){return retirer_(['data-tm-eta-at','data-tm-eta-last','data-tm-niveau0']);}
  function SANS_ARIA_(){return retirer_(['aria-valuenow']);}
  function SANS_TITRE_(){return retirer_(['title']);}
  /* Champ de saisie : comme le morph, la valeur du serveur n'est reposée que si le champ n'a pas le focus (jamais en pleine frappe). */
  function champ_(valeur){
    var v=String(valeur);
    return function(el){
      if(!el)return;
      if(document.activeElement!==el&&el.value!==v){el.value=v;}
      if(el.getAttribute('value')!==v&&document.activeElement!==el)el.setAttribute('value',v);
    };
  }

  var ICONE_ENERGIE_=function(){return h('svg',{viewBox:'0 0 32 32','aria-hidden':'true'},h('path',{d:'M19 2 7 18h8l-2 12 12-17h-8z',fill:'#7dff9f',stroke:'#150c06','stroke-width':'2.4','stroke-linejoin':'round'}));};
  var ICONE_MAGIE_=function(){return h('svg',{viewBox:'0 0 32 32','aria-hidden':'true'},h('path',{d:'M16 2 19.5 12.5 30 16 19.5 19.5 16 30 12.5 19.5 2 16 12.5 12.5Z',fill:'#9fd2ff',stroke:'#150c06','stroke-width':'2.2','stroke-linejoin':'round'}));};
  function pont_(nom){var a=Array.prototype.slice.call(arguments,1);return function(){var f=window[nom];if(typeof f==='function')f.apply(null,a);};}

  /* ---------- composants (purs) ---------- */
  function Tour_(t){
    var cle=t.cle,g=t.gauche;
    var icone=g?ICONE_ENERGIE_():ICONE_MAGIE_();
    var tube=h('div',{class:'tmm-tube'},h('div',{class:'tmm-liq',style:{height:t.largeur}},h('div',{class:'tmm-bulles'},h('canvas',{class:'tmm-bulles-cv','data-morph-vivant':'1','data-tm-gauche':g?'1':'0'}))));
    var lcds=h('div',{class:'tmm-lcds'},
      h('div',{class:'tmm-lcd'},h('i',{class:'tmm-lcd-titre'},'NIVEAU'),h('div',{class:'tmm-lcd-val','data-tm-niveau':cle},t.niveau)),
      h('div',{class:'tmm-lcd'},h('i',{class:'tmm-lcd-titre'},'TEMPS RESTANT'),h('div',{class:'tmm-lcd-val','data-tm-lcd-eta':cle},t.lcd),
        h('div',{class:'tmm-barre',ref:SANS_TITRE_()},h('div',{class:'tmm-rempl','data-tm-fill0':t.fill0,style:{width:t.largeur},ref:SANS_ARIA_()})),
        t.prix!=null?h('div',{class:'tmm-prix',title:'Or qu’il faut payer pour gagner le niveau suivant'},h('i',null,'Niveau suivant'),h('b',{'data-tm-prix':cle},'🪙 '+t.prix)):null,
        h('div',{class:'tmm-eta','data-tm-eta-track':cle,'data-tm-eta-seconds':t.etaSecondes,ref:ANCRES_ETA_()},t.etaTexte)),
      h('div',{class:'tmm-boutons'},
        h('button',{type:'button',title:'Placer la valeur de Input',onClick:pont_('__ajusterTimeMachineIdleV1__',t.ressource,'plus')},'+'),
        h('button',{type:'button',title:'Retirer la valeur de Input',onClick:pont_('__ajusterTimeMachineIdleV1__',t.ressource,'moins')},'−'),
        h('button',{type:'button',class:'max',title:'Placer toute la ressource libre',onClick:pont_('__ajusterTimeMachineIdleV1__',t.ressource,'max')},'Max'),
        h('button',{type:'button',title:'Retirer toute l’énergie de cette barre',onClick:pont_('__ajusterTimeMachineIdleV1__',t.ressource,'zero')},'0')),
      h('div',{class:'tmm-ligne'},
        h('div',{class:'tmm-case'},h('i',{class:'tmm-case-titre'},'Cible'),
          h('input',{type:'number','inputmode':'numeric',min:'0',step:'1',title:'Niveau cible : l\'allocation est retirée dès qu\'il est atteint (0 = aucune cible)',ref:champ_(t.cible),
            onChange:function(e){var f=window.__cibleTimeMachineIdleV1__;if(typeof f==='function')f(g?'speed':'gold',e.currentTarget.value);}})),
        h('div',{class:'tmm-case'},h('i',{class:'tmm-case-titre tmm-case-icone',title:t.libelleAlloc,role:'img','aria-label':t.libelleAlloc},icone),
          h('output',{class:'tmm-case-val',id:'sorealIdleTmAllocV1_'+cle,'data-idle-alloc-pop-v1':''},t.alloue))));
    return h('section',{class:'tmm-tour '+(g?'tmm-gauche':'tmm-droite')+' tmm-piste '+cle,'data-tm-alloc':t.allocBrute,'data-tm-k':t.k,'aria-label':t.titre},
      /* l'explication de la tour (Norman, 2026-11-06 : l'image n'a pas d'emplacement pour un texte) passe en infobulle du titre ; elle est aussi dans « À quoi ça sert ? » */
      h('div',{class:'tmm-tete',title:t.sousTitre},icone,g?'ÉNERGIE':'MAGIE'),
      h('div',{class:'tmm-haut',ref:ile_(t.hautHtml)}),
      h('div',{class:'tmm-corps'},g?[tube,lcds]:[lcds,tube]));
  }
  /* Définitions communes (dégradés) : l'élément svg est à Preact, ses définitions sont posées une fois. */
  function Defs_(p){
    return h('svg',{class:'tmm-defs',width:'0',height:'0','aria-hidden':'true',focusable:'false',style:'position:absolute',dangerouslySetInnerHTML:{__html:p.interieur}});
  }
  function GrandeMachine_(p){
    return h('div',{class:'tmm-cadre'},
      p.defs!=null?h(Defs_,{interieur:p.defs}):null,
      h('div',{class:'tmm-machine'+(p.magicOk?'':' tmm-sans-magie')},
        h(Tour_,p.vitesse),
        h('section',{class:'tmm-centre',ref:ile_(p.centreHtml)}),
        p.or?h(Tour_,p.or):null));
  }
  function Stat_(s){return h('div',null,h('span',null,s.libelle+' :'),' ',h('b',s.cle?{'data-tm-stat':s.cle}:null,s.valeur));}
  function Stats_(p){
    return h('section',{class:'soreal-idle-tm-stats-v1'},
      h('div',{class:'soreal-idle-tm-stats-titre-v1'},'🧮 Comment ton GPS est calculé'),
      h('div',{class:'soreal-idle-tm-stats-grille-v1'},
        h('div',null,p.colonne1.map(function(s){return h(Stat_,Object.assign({key:s.cle},s));})),
        h('div',null,p.colonne2.map(function(s){return h(Stat_,Object.assign({key:s.cle},s));}))),
      p.gps.brutNet
        ?h('div',{class:'soreal-idle-tm-gps-v1'},
          h('div',null,'💰 GPS brut : ',h('b',{'data-tm-stat':'grossGps'},p.gps.brut),' ',h('small',null,'(ce que la machine fabrique)')),
          h('div',null,'🧑‍🔬 − Labos : ',h('b',{'data-tm-stat':'diggerDrain'},p.gps.labos),' ',h('small',null,'(l’Or que tes Labos actifs dépensent chaque seconde ; 0 si aucun n’est actif)')),
          h('div',null,'💎 GPS net : ',h('b',{'data-tm-stat':'netGps'},p.gps.net),' ',h('small',null,'(ce qui entre vraiment dans ta bourse)')))
        :h('div',{class:'soreal-idle-tm-gps-v1'},h('div',null,'💎 GPS : ',h('b',{'data-tm-stat':'netGps'},p.gps.net))));
  }
  function Hero_(p){
    return h('section',{class:'soreal-idle-tm-hero-v1'},
      h('div',{class:'soreal-idle-tm-hero-pieces-v1','aria-hidden':'true'},h('i',null,'🪙'),h('i',null,'🪙'),h('i',null,'🪙'),h('i',null,'🪙'),h('i',null,'🪙')),
      h('div',{class:'soreal-idle-tm-hero-titre-v1'},'💰 Ta machine fabrique de l’Or'),
      h('div',{class:'soreal-idle-tm-hero-gps-v1'},h('b',{'data-tm-hero':'netGps'},p.net),h('span',null,' Or par seconde')),
      h('div',{class:'soreal-idle-tm-hero-sous-v1'},
        p.brutNet?['Brut ',h('b',{'data-tm-hero':'grossGps'},p.brut),' /s − Labos ',h('b',{'data-tm-hero':'diggerDrain'},p.labos),' /s · ']:null,
        h('b',{'data-tm-hero':'orReel'},p.orReel),' Or à chaque remplissage de barre'),
      h('div',{class:'soreal-idle-tm-or-v1'},
        h('div',{class:'soreal-idle-tm-or-barre-v1'},h('div',{class:'soreal-idle-tm-or-remplissage-v1'+(p.barre.classe?' '+p.barre.classe:''),'data-tm-or-remplissage':'1','data-fills':p.barre.fills,style:p.barre.style})),
        h('div',{class:'soreal-idle-tm-or-legende-v1','data-tm-or-legende':'1'},p.legende)));
  }
  /* Carte « À quoi ça sert ? » : <details> natif ; l'état ouvert est mémorisé par le pont du jeu (window.__basculerAideMenuIdleV1__). */
  function Aide_(a){
    return h('details',{class:'soreal-idle-aide-v1','data-idle-aide-v1':a.cle,open:a.ouvert,onToggle:function(e){var f=window.__basculerAideMenuIdleV1__;if(typeof f==='function')f(a.cle,e.currentTarget);}},
      h('summary',null,'💡 À quoi ça sert ?'),
      h('p',{class:'soreal-idle-aide-resume-v1'},a.resume),
      h('ol',{class:'soreal-idle-aide-etapes-v1'},a.etapes.map(function(e,i){return h('li',{key:i},e);})));
  }
  function Page_(p){
    return h('div',{class:'soreal-idle-tm-v1'},
      h('header',{class:'soreal-idle-tm-entete-v1'},h('h1',null,'Machine à remonter le temps cassée'),h('p',null,'(Ramasse cet or encore, et encore, et encore, et...)')),
      /* Bandeau d'identité (Norman, 2026-10-04) : une machine de laiton qui crache des pièces : le gain d'Or par seconde en grand, la barre d'Or qui bat à chaque remplissage et ce que rapporte un remplissage. */
      h(Hero_,p.hero),
      h(Aide_,p.aide),
      /* Barre d'outils (Input, plafonds, Idle, total placé) : tenue par modules/barre-allocation-v1.js, îlot comparé par le morph. */
      h('div',{class:'soreal-idle-bt-toolbar-v120',ref:ile_(p.barreOutils)}),
      h(GrandeMachine_,p.machine),
      h(Stats_,p.stats));
  }
  function page(vm){
    var V=window.__SOREAL_IDLE_VDOM_V1__;
    if(!vm||!h||!V)return '';
    return V.monter('machine',Page_,vm);
  }
  /* Rendu synchrone vers une chaîne HTML (tests, débogage) : jamais utilisé par la page. */
  function html(vm){
    var V=window.__SOREAL_IDLE_VDOM_V1__;
    return vm&&h&&V?V.rendreHtml(Page_,vm):'';
  }
  window.__SOREAL_IDLE_MACHINE_PAGE_V1__={page:page,html:html};
})();
