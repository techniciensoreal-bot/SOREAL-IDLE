/*
 * SOREAL IDLE — menu Réglages, design « options de jeu vidéo » (Norman, 2026-11-11 : « refais tout, les cadres, les couleurs, les icônes, les catégories, pour que ce soit beaucoup plus jeu vidéo »).
 * Même famille que les Chroniques (plaques d'acier à coins coupés, Bangers pour les titres, Russo One pour les textes) avec UNE couleur par catégorie.
 * Contient : les icônes SVG originales (une seule couleur, currentColor), la barre de catégories, et l'habillage d'une page (titres de section rendus avec une icône à la place de l'émoji).
 * Règle n°2 : rien de verrouillé n'est dessiné (les catégories et les sections viennent du menu existant, qui ne montre que ce qui est disponible).
 * Règle n°3 : aucune animation en boucle ici. Règle n°4 : tout est dans le HTML du rendu, aucun bloc ajouté après coup. Styles : soreal-idle-reglages-v1.css.
 *   window.__SOREAL_IDLE_REGLAGES_DESIGN_V1__ = { icone(nom), onglets(items, actif, clic), habiller(corps, ongletId) }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_REGLAGES_DESIGN_V1__)return;

  /* 24 x 24, une couleur. Les icônes de catégorie, puis celles des sections. */
  const ICONES={
    jeu:'<path fill-rule="evenodd" d="M7 6h10a5 5 0 0 1 4.8 3.6l1 4.4a3.2 3.2 0 0 1-5.6 2.6L15.8 15H8.2l-1.4 1.6A3.2 3.2 0 0 1 1.2 14l1-4.4A5 5 0 0 1 7 6zM7.5 9v1.5H6V12h1.5v1.5H9V12h1.5v-1.5H9V9zM15.5 9.4a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM18 11.6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>',
    profil:'<path fill-rule="evenodd" d="M12 2.4a4.6 4.6 0 1 0 .01 0zM3.4 21.4c0-4.8 3.8-7.8 8.6-7.8s8.6 3 8.6 7.8z"/>',
    audio:'<path d="M3 9.5h3.6L11 5.6v12.8l-4.4-3.9H3z"/><path d="M14 8.2a5.2 5.2 0 0 1 0 7.6M16.6 5.4a9 9 0 0 1 0 13.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    affichage:'<path fill-rule="evenodd" d="M2.4 4h19.2v12.6H2.4zM5 6.6v7.4h14V6.6z"/><path d="M8 18.4h8V21H8z"/>',
    partie:'<path fill-rule="evenodd" d="M4 3h13.6L21 6.4V21H4zM7 3v6h9.4V3zM7 13v6.4h10V13z"/>',
    infos:'<path fill-rule="evenodd" d="M12 2a10 10 0 1 0 .01 0zM10.9 6.6h2.2v2.2h-2.2zM10.9 10.4h2.2v7h-2.2z"/>',
    classement:'<path fill-rule="evenodd" d="M7 3h10v5.4a5 5 0 0 1-10 0zM4 5h2v2.6A2 2 0 0 1 4.4 7zM18 5h2v2a2 2 0 0 1-1.6.6z"/><path d="M11 13.4h2V17h-2z"/><path d="M7.5 18h9l1 3h-11z"/>',
    langue:'<path fill-rule="evenodd" d="M12 2a10 10 0 1 0 .01 0zM4.2 11h3.4c.1-2 .5-3.8 1.1-5.2A8 8 0 0 0 4.2 11zM9.7 11h4.6c-.2-2.6-1.2-4.6-2.3-5.8C10.9 6.4 9.9 8.4 9.7 11zM16.4 11h3.4a8 8 0 0 0-4.5-5.2c.6 1.4 1 3.2 1.1 5.2zM4.2 13a8 8 0 0 0 4.5 5.2c-.6-1.4-1-3.2-1.1-5.2zM9.7 13c.2 2.6 1.2 4.6 2.3 5.8 1.1-1.2 2.1-3.2 2.3-5.8zM16.4 13c-.1 2-.5 3.8-1.1 5.2a8 8 0 0 0 4.5-5.2z"/>',
    effets:'<path d="M12 1.8l2.3 6.4 6.4 2.3-6.4 2.3L12 19.2l-2.3-6.4-6.4-2.3 6.4-2.3z"/><path d="M19 15l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z"/>',
    theme:'<path fill-rule="evenodd" d="M12 2.2a9.8 9.8 0 1 0 0 19.6c1.3 0 2-.9 2-1.8 0-1.4-1.2-1.6-1.2-2.9 0-1 .8-1.6 1.8-1.6H17a4.8 4.8 0 0 0 4.8-4.8C21.8 5.8 17.5 2.2 12 2.2zM6.6 11a1.4 1.4 0 1 0 0 .01zM9 6.8a1.4 1.4 0 1 0 0 .01zM14.4 6.2a1.4 1.4 0 1 0 0 .01z"/>',
    nuage:'<path d="M7.2 19a4.6 4.6 0 0 1-.5-9.2 5.8 5.8 0 0 1 11.2 1.3 4 4 0 0 1-.5 7.9z"/>',
    actualiser:'<path d="M12 4a8 8 0 1 0 7.6 10.4l-2-.7A6 6 0 1 1 12 6v3.4l5-4.4-5-4.4z"/>',
    danger:'<path fill-rule="evenodd" d="M12 2.2 22.4 20.6H1.6zM10.9 9h2.2v6h-2.2zM10.9 16.4h2.2v2.2h-2.2z"/>',
    version:'<path fill-rule="evenodd" d="M3 3h9.4L21 11.6 11.6 21 3 12.4zM7.4 5.8a1.6 1.6 0 1 0 .01 0z"/>',
    musique:'<path d="M9 3.4l11 2.4v10.6a3.2 3.2 0 1 1-2-3V8L11 6.6v11.2a3.2 3.2 0 1 1-2-3z"/>',
    rune:'<path fill-rule="evenodd" d="M12 1.8l2.4 7.4 7.8.1-6.2 4.6 2.3 7.5L12 16.5l-6.3 4.9L8 13.9 1.8 9.3l7.8-.1z"/>',
    aide:'<path fill-rule="evenodd" d="M12 2a10 10 0 1 0 .01 0zM12 6.2c-2.1 0-3.6 1.3-3.7 3.2h2.1c0-.8.6-1.3 1.5-1.3s1.4.5 1.4 1.2c0 1.6-2.4 1.5-2.4 4.1h2c0-1.8 2.5-2 2.5-4.2 0-1.8-1.4-3-3.4-3zM10.9 15.4h2.2v2.2h-2.2z"/>',
    ordi:'<path fill-rule="evenodd" d="M2.4 4h19.2v12.6H2.4zM5 6.6v7.4h14V6.6z"/><path d="M8 18.4h8V21H8z"/>'
  };
  function icone(nom,cls){
    return '<svg class="rg2-ico'+(cls?' '+cls:'')+'" data-sans-traduction viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">'+(ICONES[nom]||ICONES.infos)+'</svg>';
  }

  /* Barre de catégories : items {id, nom, icone, aide} ; chaque plaque a sa couleur (classe rg2-c-<id>). */
  function onglets(items,actif,clic){
    return '<div class="rg2-onglets" role="tablist">'+items.map(function(o){
      const on=o.id===actif;
      return '<button type="button" role="tab" aria-selected="'+(on?'true':'false')+'" class="rg2-onglet rg2-c-'+o.id+(on?' actif':'')+'" data-onglet="'+o.id+'" onclick="'+clic+'">'+
        '<i class="rg2-onglet-ico">'+icone(o.icone||o.id)+'</i><b>'+o.nom+'</b></button>';
    }).join('')+'</div>';
  }

  /* Icône d'une section d'après son titre (mots-clés), sinon celle de la catégorie. */
  const MOTS=[
    ['classement','classement'],['langue','langue'],['audio','audio'],['son','audio'],['voix','audio'],['musique','musique'],['pentacle','rune'],['sorts','rune'],
    ['effet','effets'],['thème','theme'],['theme','theme'],['cthulhu','aide'],['aide','aide'],['mises à jour','actualiser'],['mise à jour','actualiser'],['recommencer','danger'],
    ['version','version'],['info','aide'],['badavatar','profil'],['ma partie','nuage'],['serveur','nuage'],['reconnexion','nuage'],['steam','jeu'],['liaison','jeu'],['relier','jeu'],['appareil','ordi'],['pseudo','profil'],['profil','profil']
  ];
  function iconeSection(titre,defaut){
    const t=String(titre||'').toLowerCase();
    for(let i=0;i<MOTS.length;i++)if(t.indexOf(MOTS[i][0])!==-1)return MOTS[i][1];
    return defaut;
  }

  /* Rend les titres de section (« Audio » précédé d'un émoji) avec une icône dessinée à la place de l'émoji. Seuls les titres de la page sont touchés ; le reste du HTML est inchangé. */
  const RE_TITRE=/(<div class="soreal-idle-window-title-v31[^"]*"[^>]*>)(\s*(?:<span>)?)([^<]*)/g;
  function habiller(corps,ongletId){
    /* Les boutons de la page changent de classe : les règles générales des autres menus (règles prioritaires) ne les touchent plus, ce qui évite d'ajouter de règles prioritaires ici (plafond de l'audit d'architecture). Aucun script ne les cherche par classe. */
    corps=String(corps).split('soreal-idle-danger-button-v67').join('rg2-bouton rg2-danger').split('soreal-idle-expand-button-v25').join('rg2-bouton').split('soreal-idle-parties-dev-bouton-v1').join('rg2-partie');
    /* Les textes d'explication portent une couleur et une taille en ligne (gris bleuté, 14 px) : on les retire pour que la feuille de style (Russo One, plus clair, plus grand) s'applique sans règle prioritaire. */
    corps=corps.replace(/style="([^"]*)"/g,function(tout,s){
      if(s.indexOf('color:#8b93ab')===-1&&s.indexOf('color:#c9d3ee')===-1&&s.indexOf('color:#dce5f3')===-1)return tout;
      const net=s.replace(/color:#(?:8b93ab|c9d3ee|dce5f3);?/g,'').replace(/font-size:1[45]px;?/g,'').trim();
      return net?'style="'+net+'"':'';
    });
    return corps.replace(RE_TITRE,function(tout,ouvrant,pre,texte){
      const propre=texte.replace(/^(?:ℹ️?|[^\p{L}\p{N}])+/u,'').trim();
      if(!propre)return tout;
      return ouvrant+pre+'<i class="rg2-sico">'+icone(iconeSection(propre,ongletId))+'</i>'+propre;
    });
  }

  window.__SOREAL_IDLE_REGLAGES_DESIGN_V1__={icone:icone,onglets:onglets,habiller:habiller,iconeSection:iconeSection};
})();
