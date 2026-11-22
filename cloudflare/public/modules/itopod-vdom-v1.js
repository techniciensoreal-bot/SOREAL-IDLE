/*
 * SOREAL IDLE — page ITOPOD (tour + boutique des Atouts) rendue par composants Preact (chantier de fluidité, 2026-11-18, AGENTS.md règle n°4).
 * Même page, mêmes classes CSS, mêmes ids, mêmes textes et mêmes ponts window.__x__ qu'avant (modules/itopod-perks-page-v1.js) ; seule l'écriture change : plus de grosse chaîne HTML refabriquée,
 * analysée puis comparée au DOM, mais des composants PURS (h(), sans JSX) rendus par modules/vdom-pont-v1.js dans un conteneur persistant. Les effets de bord (brouillon des étages, mémoire de la vue,
 * HTML de la scène) restent dans modules/itopod-perks-page-v1.js (preparer_) : les composants ne dessinent que le modèle de vue reçu.
 * Ce qui reste impératif, volontairement :
 *  - la SCÈNE animée (modules/itopod-scene-v1.js : coups, barre de vie, ennemis qui défilent, remplie 6 fois par seconde) : son HTML est posé UNE fois par le composant Scene_ (dangerouslySetInnerHTML) et n'est
 *    réécrit par Preact que si ce HTML change (un redessin complet de la page, comme avant) ; entre deux, la scène modifie son propre DOM, que Preact ne touche jamais ;
 *  - la valeur d'un champ de saisie (Départ / Fin) : posée au montage puis seulement si le serveur change la valeur ET que le joueur n'est pas en train de taper (jamais écrasée pendant la frappe).
 * Expose window.__SOREAL_IDLE_ITOPOD_VDOM_V1__ = { Page, Perks } (composants).
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_ITOPOD_VDOM_V1__)return;
  var P=window.preact||null;
  if(!P)return;
  var h=P.h,Component=P.Component,Fragment=P.Fragment;

  /* Champ de saisie « jeu vidéo » : valeur au centre, − et + de part et d'autre. */
  function Saisie_(){Component.call(this);}
  Saisie_.prototype=Object.create(Component.prototype);
  Saisie_.prototype.constructor=Saisie_;
  Saisie_.prototype.pose_=function(force){
    var el=this.el,v=String(this.props.valeur);
    if(!el)return;
    if(force||(el.value!==v&&!(typeof document!=='undefined'&&document.activeElement===el)))el.value=v;
    el.setAttribute('value',v);
  };
  Saisie_.prototype.componentDidMount=function(){this.pose_(true);};
  Saisie_.prototype.componentDidUpdate=function(prec){if(prec.valeur!==this.props.valeur)this.pose_(false);};
  Saisie_.prototype.render=function(p){
    var self=this;
    return h('input',{id:p.id,class:'itp-saisie',type:'number',inputMode:'numeric',min:'0',max:'1600',
      ref:function(el){self.el=el;},
      onInput:function(){window.__itopodBrouillonIdleV1__();},onChange:function(){window.__itopodBrouillonIdleV1__();}});
  };
  function Champ_(p){
    return h('div',{class:'itp-champ'},h('label',{for:p.id},p.libelle),
      h('div',{class:'itp-pas'},
        h('button',{type:'button',class:'itp-pas-bouton','aria-label':'Moins',onClick:function(e){window.__itopodPasIdleV1__(e.currentTarget,-1);}},'−'),
        h(Saisie_,{id:p.id,valeur:p.valeur}),
        h('button',{type:'button',class:'itp-pas-bouton','aria-label':'Plus',onClick:function(e){window.__itopodPasIdleV1__(e.currentTarget,1);}},'+')));
  }
  function Tuile_(p){
    return h('div',{class:'itp-tuile'},h('span',{class:'itp-tuile-icone'},p.icone),h('span',{class:'itp-tuile-libelle'},p.libelle),h('b',null,String(p.valeur)));
  }

  /* La scène : un hôte sans boîte (display:contents) dont le contenu est posé une fois et ensuite animé par modules/itopod-scene-v1.js. */
  function Scene_(p){
    if(!p.html)return null;
    return h('div',{class:'itp-scene-hote',style:{display:'contents'},dangerouslySetInnerHTML:{__html:p.html}});
  }

  /* Boutique des Atouts (Perk Emporium) : vitrines en liste ; la liste n'est refaite que si le modèle des cartes change. */
  function Vitrine_(c){
    return h('article',{class:'pk-vitrine'+(c.auMax?' pk-max':c.abordable?' pk-abordable':'')+(c.niveau>0?' pk-possede':'')},
      h('div',{class:'pk-socle'},h('img',{class:'pk-image',src:c.image,alt:'',loading:'lazy',onError:function(e){e.currentTarget.hidden=true;}})),
      h('div',{class:'pk-corps'},
        h('div',{class:'pk-nom'},c.nom),
        c.difficulte?h('div',{class:'pk-difficulte'},c.difficulte>=2?'ATOUT DE DIFFICULTÉ SADIQUE':'ATOUT DE DIFFICULTÉ MALÉFIQUE'):null,
        h('div',{class:'pk-effet'},c.effet),
        c.paliers?h('div',{class:'pk-paliers'},c.paliers.map(function(t){return h('div',{key:t},t);})):null,
        h('div',{class:'pk-niveau'},h('div',{class:'pk-jauge'},h('i',{style:{width:c.barre}})),h('span',null,c.niveau+' / '+c.cap))),
      c.auMax
        ?h('div',{class:'pk-etiquette pk-etiquette-max'},'✔ Maximum')
        :h('div',{class:'pk-achats'},
          h('button',{type:'button',class:'pk-acheter',onClick:function(){window.__acheterPerkIdleV1__(c.id);},onContextMenu:function(e){e.preventDefault();window.__acheterPerkToutIdleV1__(c.id);}},h('span',{class:'pk-prix'},'⭐ '+c.cout+' PP'),h('span',{class:'pk-achat'},'Acheter')),
          h('button',{type:'button',class:'pk-bascule pk-tout',title:'Dépense tout ce que tu peux sur cet atout, jusqu’à son niveau maximum (clic droit sur l’achat, sur ordinateur).',onClick:function(){window.__acheterPerkToutIdleV1__(c.id);}},'Tout')));
  }
  function PerksVue_(p){
    return h('div',{class:'pk-fond'},h('div',{class:'pk-boutique'},
      h('div',{class:'pk-enseigne'},h('span',{class:'pk-ampoules'}),h('div',{class:'pk-enseigne-texte'},h('small',null,'Boutique'),h('b',null,'Perk Emporium')),h('span',{class:'pk-ampoules'})),
      h('div',{class:'pk-comptoir'},
        h('div',{class:'pk-solde'},h('span',null,'⭐ PP disponibles'),h('b',null,String(p.pp))),
        h('input',{class:'pk-recherche',type:'search',placeholder:'Chercher un perk…',value:p.q,onInput:function(e){window.__perkFiltrerIdleV1__(e.currentTarget.value,null);}}),
        h('button',{type:'button',class:'pk-bascule'+(p.abordables?' actif':''),'aria-pressed':p.abordables?'true':'false',onClick:function(){window.__perkFiltrerIdleV1__(null,!p.abordables);}},'💰 Abordables'),
        h('button',{type:'button',class:'pk-bascule'+(p.nonMax?' actif':''),'aria-pressed':p.nonMax?'true':'false',title:'Cache les atouts déjà au niveau maximum.',onClick:function(){window.__perkFiltrerIdleV1__(null,null,!p.nonMax);}},'🙈 Masquer les maximums'),
        h('select',{class:'pk-recherche pk-tri','aria-label':'Tri des atouts',value:p.tri,onChange:function(e){window.__perkFiltrerIdleV1__(null,null,null,e.currentTarget.value);}},
          h('option',{value:'id'},'Tri : ordre normal'),h('option',{value:'base'},'Tri : coût de base'),h('option',{value:'total'},'Tri : coût total restant'))),
      h('div',{class:'pk-etagere'},p.cartes.length?p.cartes.map(function(c){return h(Vitrine_,Object.assign({key:c.id},c));}):h('div',{class:'pk-vide'},'Aucun perk ne correspond.'))));
  }

  /* La boutique n'est redessinée que si son contenu (signature du modèle) a changé : une synchro qui ne change rien aux vitrines ne parcourt pas leurs dizaines de cartes. */
  function Perks_(){Component.call(this);}
  Perks_.prototype=Object.create(Component.prototype);
  Perks_.prototype.constructor=Perks_;
  Perks_.prototype.shouldComponentUpdate=function(suivant){return suivant.sig!==this.props.sig;};
  Perks_.prototype.render=function(p){return h(PerksVue_,p);};

  function Page_(p){
    var bouton=p.pilule
      ?h('button',{type:'button',class:'itp-bouton itp-bouton-pilule',style:{flex:'none',width:'100%',marginTop:'8px',fontSize:'14px',background:p.pilule.actives?'linear-gradient(180deg,#64748b,#334155)':'linear-gradient(180deg,#3b82f6,#1e40af)'},'aria-pressed':p.pilule.actives?'true':'false',
        title:'Chaque pilule double les PPP d’un kill dans l’ITOPOD (une pilule par kill, seulement tant que le réglage est actif).',onClick:function(){window.__itopodPiluleIdleV1__();}},
        '💊 '+(p.pilule.actives?'Désactiver la petite pilule bleue':'Activer la petite pilule bleue')+' ('+p.pilule.restantes+' kills restants)')
      :null;
    return h(Fragment,null,
      h('div',{class:'soreal-idle-page-head-v28'},h('div',{class:'soreal-idle-page-title-v28'},'🏢 ITOPOD'),h('div',{class:'soreal-idle-page-sub-v28'},p.sousTitre)),
      p.atoutsOuverts?h('div',{class:'itp-vues'},h('button',{type:'button',class:'itp-bouton itp-bouton-atouts',onClick:function(){window.__itopodVueIdleV1_basculer__();}},p.vueAtouts?'🏢 Retour à la tour':'⭐ Atouts')):null,
      p.atoutsOuverts?h('div',{class:'itp-vue-atouts',hidden:!p.vueAtouts},h(Perks_,p.perks)):null,
      h('div',{class:'itp-page',hidden:p.vueAtouts},
        h(Scene_,{html:p.sceneHtml}),
        h('section',{class:'itp-panneau itp-entree'},
          h('button',{type:'button',class:'itp-bouton itp-bouton-entrer'+(p.actif?' itp-en-cours':''),onClick:function(){window.__itopodBasculerIdleV1__();}},p.actif?'🚪 Quitter l’ITOPOD':'⚔️ Entrer dans l’ITOPOD'),
          bouton,
          h('div',{class:'itp-mode'},p.actif?'Tu combats les ennemis à la chaîne.':'Entre dans la tour pour combattre les ennemis à la chaîne.'),
          p.alerte?h('div',{class:'itp-mode itp-alerte'},'Tu n’es pas encore assez fort pour avancer dans la tour : monte ta Puissance d’Aventure.'):null),
        h('section',{class:'itp-panneau itp-montee'},
          h('div',{class:'itp-titre'},'🪜 Étages à gravir'),
          h('div',{class:'itp-mode'},p.modeEtages),
          h('div',{class:'itp-champs'},h(Champ_,{id:'itopodDebutV1',libelle:'Départ',valeur:p.champDebut}),h(Champ_,{id:'itopodFinV1',libelle:'Fin',valeur:p.champFin})),
          h('div',{class:'itp-actions'},
            h('button',{type:'button',class:'itp-bouton',onClick:function(){window.__itopodEtagesIdleV1__();}},'Appliquer'),
            h('button',{type:'button',class:'itp-bouton',title:'Départ = ton plus haut étage atteint − 1 (la fin reste telle quelle).',onClick:function(){window.__itopodMaxIdleV1__();}},'Max'),
            h('button',{type:'button',class:'itp-bouton itp-bouton-auto',title:'Règle tes étages sur ton meilleur étage (l’étage optimal du moment). Reclique plus tard pour le remettre à jour.',onClick:function(){window.__itopodAutoIdleV1__();}},'Optimal')),
          h('div',{class:'itp-actions itp-interrupteurs'},
            p.shifter?h('button',{type:'button',class:'itp-bouton itp-bascule'+(p.shifter.actif?' itp-actif':''),'aria-pressed':p.shifter.actif?'true':'false',title:'Après chaque ennemi vaincu, règle les étages sur l’étage optimal.',onClick:function(){window.__itopodShifterIdleV1__(!p.shifter.actif);}},'🔄 Lazy ITOPOD Floor Shifter : '+(p.shifter.actif?'activé':'désactivé')):null)),
        h('section',{class:'itp-panneau'},
          h('div',{class:'itp-titre'},'📊 Progression'),
          h('div',{class:'itp-tuiles'},p.tuiles.map(function(t){return h(Tuile_,{key:t[1],icone:t[0],libelle:t[1],valeur:t[2]});})),
          h('div',{class:'itp-pp'},h('div',{class:'itp-pp-ligne'},h('span',null,'🔷 Progression PP'),h('b',null,p.ppTexte)),
            h('div',{class:'itp-pp-barre'},h('div',{class:'itp-pp-rempli',style:{width:p.ppLargeur}}))))));
  }

  window.__SOREAL_IDLE_ITOPOD_VDOM_V1__={Page:Page_,Perks:Perks_};
})();
