/*
 * SOREAL IDLE — pont entre l'ancien rendu (chaînes HTML comparées au DOM par modules/morph-v1.js) et le rendu par composants Preact (chantier de fluidité, 2026-11-18).
 *
 * Pourquoi : redessiner une page, c'était fabriquer une grosse chaîne HTML (jusqu'à 300 Ko), la faire analyser par le navigateur, puis la comparer au DOM toutes les 4 s ; cher sur téléphone, et fragile (chaque module qui ajoute
 * quelque chose à la page devait s'inscrire pour survivre au redessin, AGENTS.md règle n°4). Une page MIGRÉE rend un composant Preact dans un conteneur PERSISTANT : les nœuds restent les mêmes d'un rendu à l'autre, seul ce qui change est touché.
 *
 *   window.__SOREAL_IDLE_VDOM_V1__ = {
 *     monter(cle, composant, props)   -> enregistre le composant et ses props ; le rend tout de suite si son conteneur est déjà dans la page ; renvoie la chaîne STABLE à mettre dans la page
 *                                        (<div data-vdom="cle" data-morph-vivant></div>, toujours identique : le morph ne la voit jamais changer) ;
 *     appliquer()                     -> appelé après chaque redessin de la page (window.__SOREAL_IDLE_APRES_REDESSIN_V1__, règle n°4, même tâche, avant la première image) : rend dans les conteneurs
 *                                        qui viennent d'apparaître, démonte ceux qui ont disparu (changement de menu) ;
 *     rendreHtml(composant, props)    -> rendu synchrone vers une chaîne HTML, dans un élément détaché (tests, débogage) ;
 *     liberer(cle)                    -> démonte et oublie.
 *   }
 *
 * Règles du conteneur : le morph ne descend JAMAIS dans un élément portant data-vdom (modules/morph-v1.js : il ne compare que ses attributs) ; le conteneur est en display:contents (vdom-v1.css ; aucune boîte en plus dans la mise en page) ;
 * ce que d'autres modules ajoutent À L'INTÉRIEUR (calque d'animation, copie qui tombe…) reste en place : Preact ne retire que les nœuds qu'il a lui-même créés.
 * Traducteurs du DOM (traduction-interface-v1.js, traduction-anglais-v1.js) : Preact compare avec son PROPRE dernier rendu (jamais avec le DOM) et n'écrit un nœud de texte ou un attribut que si le texte français d'origine a changé ;
 * il ne se bat donc pas avec eux (le texte affiché en anglais n'est pas réécrit tant que l'origine est la même ; une origine nouvelle est écrite en français puis retraduite par l'observateur du traducteur, avant la peinture).
 * Un module qui retouche un élément Preact doit comparer avec ce qu'IL a écrit en dernier (règle n°4), jamais avec ce que Preact a dessiné.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_VDOM_V1__)return;

  var reg={};
  function P_(){return window.preact||null;}

  /* Le conteneur ne crée aucune boîte (display:contents, règle dans vdom-v1.css) : le composant se met en page comme s'il était directement dans la page. */
  function chaine_(cle){return '<div data-vdom="'+cle+'" data-morph-vivant></div>';}
  function trouver_(cle){try{return document.querySelector('[data-vdom="'+cle+'"]');}catch(_e){return null;}}

  function demonter_(e){
    var p=P_();
    if(e&&e.el&&p){try{p.render(null,e.el);}catch(_e){}}
    if(e){e.el=null;e.rendus=null;}
  }
  /* Rend le composant dans le conteneur de la page ; faux si la page n'en contient pas (autre menu). */
  function rendre_(cle){
    var e=reg[cle],p=P_();
    if(!e||!p)return false;
    var el=trouver_(cle);
    if(!el){demonter_(e);return false;}
    /* Le morph a recréé le conteneur (page quittée puis rouverte) : l'ancien arbre est démonté, le nouveau part de zéro. */
    if(e.el&&e.el!==el)demonter_(e);
    /* Mêmes props que le dernier rendu dans ce même conteneur (monter() vient de rendre, puis le hook de redessin passe) : rien à refaire. */
    if(e.el===el&&e.rendus===e.props)return true;
    e.el=el;e.rendus=e.props;
    p.render(p.h(e.comp,e.props),el);
    return true;
  }
  function monter(cle,composant,props){
    var e=reg[cle]||(reg[cle]={el:null});
    e.comp=composant;e.props=props;
    if(e.el&&e.el.isConnected!==false)rendre_(cle);
    return chaine_(cle);
  }
  function appliquer(){
    Object.keys(reg).forEach(function(cle){
      var e=reg[cle];
      if(!rendre_(cle)){demonter_(e);delete reg[cle];}
    });
  }
  function liberer(cle){var e=reg[cle];if(e){demonter_(e);delete reg[cle];}}
  function rendreHtml(composant,props){
    var p=P_();
    if(!p)return '';
    var el=document.createElement('div');
    p.render(p.h(composant,props),el);
    var html=el.innerHTML;
    p.render(null,el);
    return html;
  }

  try{(window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(function(){try{appliquer();}catch(e){try{console.error('vdom-pont',e);}catch(_e){}}});}catch(_e){}

  window.__SOREAL_IDLE_VDOM_V1__={monter:monter,appliquer:appliquer,rendreHtml:rendreHtml,liberer:liberer,registre:reg};
})();
