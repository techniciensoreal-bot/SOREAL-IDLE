/*
 * SOREAL IDLE — menu Chroniques, design commun « Diablo » (Norman, 2026-11-02 : « tout le menu Chronique doit être magnifique »).
 * Contient : les icônes SVG originales (.dsn-v1), la barre d'onglets du menu, les sous-onglets (Collection, Classement), la médaille de classement,
 * et la page « Sets » de la Collection (rendreCollectionIdleV22_). Styles : soreal-idle-chroniques.css (jetons .chr-v1, motifs .sc-m0..m7).
 * Règle n°2 (anti-spoil) : rien de verrouillé n'est dessiné, aucun total, aucune case vide. Règle n°3 : animations en CSS pur, boucles sans à-coup.
 * Règle n°4 : tout est dans le HTML du rendu (aucun bloc ajouté après coup). Les helpers du jeu sont lus à l'exécution par le registre REG.
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_page_chroniques_v1)return;
  REG.__chargé_page_chroniques_v1=true;

  function idleHtml_(){return REG.idleHtml_.apply(null,arguments);}
  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function aventureMetaIdleV47_(){return REG.aventureMetaIdleV47_.apply(null,arguments);}
  function iconeObjetAdventureIdleV138_(){return REG.iconeObjetAdventureIdleV138_.apply(null,arguments);}
  function libelleRecompenseSetAdventureIdleV163_(){return REG.libelleRecompenseSetAdventureIdleV163_.apply(null,arguments);}
  function catalogueSetsCollectionIdleV164_(){return REG.catalogueSetsCollectionIdleV164_.apply(null,arguments);}
  function enregistrerObjetPopupIdleV1_(){return REG.enregistrerObjetPopupIdleV1_.apply(null,arguments);}
  /* Vitrine de sets (Norman, 2026-11-04 : « je dois pouvoir cliquer sur un objet et il doit venir en grand, et me mettre ses statistiques et bonus ») : la pièce s'ouvre dans la MÊME fiche d'objet que l'Équipement de la Collection (statistiques au niveau maximum atteint, Specials, bonus de l'ensemble), via le registre de fiches. Seulement ce qui est déjà découvert (règle n°2). */
  function fichePieceSet_(id,def,niveau,vert){
    if(!def||!(def.kind==='equipment'||def.kind==='special'||def.kind==='cube'))return '';
    const cle='collection:'+String(id),q=1+niveau/100;
    try{
      enregistrerObjetPopupIdleV1_(cle,{
        kind:def.kind,name:def.name,definitionId:id,level:niveau,fullyMaxed:Boolean(vert),
        basePower:Number(def.basePower)||0,baseToughness:Number(def.baseToughness)||0,
        power:(Number(def.basePower)||0)*q,toughness:(Number(def.baseToughness)||0)*q,
        specialsAll:(Array.isArray(def.specials)?def.specials:[]).map(function(sp){return{type:sp[0],value:(Number(sp[1])||0)*q,max:(Number(sp[1])||0)*q};})
      },'collection');
    }catch(_e){return '';}
    return ' data-sets-zoom-v1="'+idleHtml_(cle)+'" role="button" tabindex="0" onclick="window.__SOREAL_IDLE_SETS_ZOOM_V1__.ouvrir(\''+idleHtml_(cle)+'\',this)"';
  }

  /* Icônes originales : 24 x 24, une seule couleur (currentColor) ; fill-rule evenodd pour les découpes. */
  const ICONES={
    collection:'<path fill-rule="evenodd" d="M5 3h12.5A1.5 1.5 0 0 1 19 4.5V19H7.2A2.2 2.2 0 0 0 5 21.2zM7.2 5.2v11.6h9.6V5.2zM12 7.3l1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z"/><path d="M7.4 20.2h11.6V22H7.4a1.4 1.4 0 0 1 0-1.8z"/>',
    classement:'<path fill-rule="evenodd" d="M7 3h10v5.4a5 5 0 0 1-10 0zM4 5h2v2.6A2 2 0 0 1 4.4 7zM18 5h2v2a2 2 0 0 1-1.6.6z"/><path d="M11 13.4h2V17h-2z"/><path d="M7.5 18h9l1 3h-11z"/><path d="M12 5.4l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z" fill="#000" fill-opacity=".45"/>',
    succes:'<path d="M7.6 13.4 4.8 21.6 12 18.8l7.2 2.8-2.8-8.2z"/><path fill-rule="evenodd" d="M12 2.2a6.4 6.4 0 1 0 .01 0zM12 5.4l1.1 2.3 2.5.3-1.8 1.8.5 2.5-2.3-1.2-2.3 1.2.5-2.5L8.4 8l2.5-.3z"/>',
    cine:'<path fill-rule="evenodd" d="M2.5 4.5h19v15h-19zM5 7v10h14V7zM10.3 9.4v5.2l4.6-2.6z"/><path d="M3.4 2.2h2.2v1.4H3.4zM8 2.2h2.2v1.4H8zM12.6 2.2h2.2v1.4h-2.2zM17.2 2.2h2.2v1.4h-2.2zM3.4 20.4h2.2v1.4H3.4zM8 20.4h2.2v1.4H8zM12.6 20.4h2.2v1.4h-2.2zM17.2 20.4h2.2v1.4h-2.2z"/>',
    boss:'<path d="M2.6 2.4c.4 4.6 2.6 7.6 5.6 8.6L7.6 8.4C5.6 7.4 3.8 5.4 2.6 2.4zM21.4 2.4c-.4 4.6-2.6 7.6-5.6 8.6l.6-2.6c2-1 3.8-3 5-6z"/><path fill-rule="evenodd" d="M12 6.4c-3.7 0-6.4 2.5-6.4 6 0 2.2 1.1 3.8 2.6 4.6V21h7.6v-4c1.5-.8 2.6-2.4 2.6-4.6 0-3.5-2.7-6-6.4-6zM9 11.2a1.8 2.1 0 1 0 .01 0zM15 11.2a1.8 2.1 0 1 0 .01 0zM12 14.2l-1 2.1h2z"/>',
    equipement:'<path d="M20.8 2.8l-.5 5.6-9.2 9.2-3.6-3.6 9.2-9.2z"/><path d="M4.4 12.6l7 7-1.9 1.9-7-7z"/><path d="M6.5 17.5 3 21l-1-1 3.5-3.5z"/>',
    sets:'<path fill-rule="evenodd" d="M12 1.8l8.4 10.2L12 22.2 3.6 12zM12 6.6 7.6 12l4.4 5.4 4.4-5.4zM12 10.2a1.8 1.8 0 1 0 .01 0z"/>',
    couronne:'<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5z"/><path d="M5.4 19.4h13.2V21H5.4z"/>',
    coche:'<path d="M3.4 12.4l3.2-3.2 3.4 3.4 7.2-7.4 3.2 3.2-10.4 10.6z"/>',
    sceau:'<path fill-rule="evenodd" d="M12 1.6l2.2 1.6 2.7-.2 1.1 2.5 2.4 1.2-.2 2.7L21.8 12l-1.6 2.2.2 2.7-2.5 1.1-1.2 2.4-2.7-.2L12 21.8l-2.2-1.6-2.7.2-1.1-2.5-2.4-1.2.2-2.7L2.2 12l1.6-2.2-.2-2.7 2.5-1.1 1.2-2.4 2.7.2zM12 7.2l1.2 2.5 2.7.4-2 1.9.5 2.7L12 13.4l-2.4 1.3.5-2.7-2-1.9 2.7-.4z"/>',
    bouclier:'<path fill-rule="evenodd" d="M12 2l8 3v6.2c0 5-3.2 8.6-8 10.8-4.8-2.2-8-5.8-8-10.8V5zM12 6.2 6.4 8v3.4c0 3.4 2 6 5.6 7.8 3.6-1.8 5.6-4.4 5.6-7.8V8z"/>',
    enclume:'<path d="M3 5h14.5c0 3-1.5 4.5-4 5v2h3.5v3H7v-3h3.5v-2C6.5 9.6 3 8 3 5zM17.5 5H22c0 2-2 3.4-4.5 3.8z"/><path d="M6 17.6h12V21H6z"/>',
    boost:'<path d="M13.4 1.8 5 13.2h5.6L9.6 22.2 19 10.2h-5.8z"/>',
    cube:'<path fill-rule="evenodd" d="M12 2l9 4.6v10.8L12 22l-9-4.6V6.6zM12 4.6 6 7.6l6 3 6-3zM5.4 9.4v6.4l5.4 2.8v-6.4zM13.2 12.2v6.4l5.4-2.8V9.4z"/>',
    lecture:'<path d="M3 9.5h3.6L11 5.6v12.8l-4.4-3.9H3z"/><path d="M14 8.2a5.2 5.2 0 0 1 0 7.6M16.6 5.4a9 9 0 0 1 0 13.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    actualiser:'<path d="M12 4a8 8 0 1 0 7.6 10.4l-2-.7A6 6 0 1 1 12 6v3.4l5-4.4-5-4.4z"/>',
    med1:'<path d="M12 2a7 7 0 1 0 .01 0zM8 15l-2 7 6-2.8 6 2.8-2-7z"/>',
    jouer:'<path d="M6 3.2 20.4 12 6 20.8z"/>'
  };
  function icone(nom,cls){
    return '<svg class="dsn-v1 chr-ico'+(cls?' '+cls:'')+'" data-sans-traduction viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">'+(ICONES[nom]||'')+'</svg>';
  }

  /* Frise : un filet orné avec un losange central (réutilisée sous les titres). */
  function frise(){
    return '<svg class="chr-frise" data-sans-traduction viewBox="0 0 160 10" preserveAspectRatio="none" aria-hidden="true"><path d="M0 5h66M94 5h66" stroke="currentColor" stroke-width="1" fill="none"/><path d="M80 0l5 5-5 5-5-5z M66 5l-4-2.4v4.8zM94 5l4-2.4v4.8z" fill="currentColor"/></svg>';
  }

  /* Barre d'onglets du menu (Collection / Classement / Succès / Cinématiques) : plaques forgées à angles biseautés, gemme allumée sur l'onglet actif. */
  function barreOnglets(onglets,actif){
    return '<div class="soreal-idle-chroniques-onglets-v1 chr-onglets" role="tablist">'+
      onglets.map(function(o){
        const a=o.id===actif;
        return '<button type="button" role="tab" aria-selected="'+(a?'true':'false')+'" class="soreal-idle-chroniques-onglet-v1 chr-onglet'+(a?' actif':'')+'" data-onglet="'+o.id+'" onclick="window.__chroniquesOngletIdleV1__(this.dataset.onglet)">'+
          '<span class="chr-gemme" aria-hidden="true"></span>'+
          '<i class="chr-onglet-ico">'+icone(o.id==='bestiaire'?'collection':(o.id==='cinematiques'?'cine':o.id))+'</i><b>'+o.nom+'</b>'+
        '</button>';
      }).join('')+
    '</div>'+
    '<div class="chr-filet" aria-hidden="true">'+frise()+'</div>';
  }

  /* Sous-onglets (Boss / Équipement / Sets ; statistiques du Classement ; défis). items : {nom, actif, clic, compteur?, icone?} ; le compteur est toujours un nombre déjà découvert, sans dénominateur. */
  function sousOnglets(items,classe){
    return '<div class="chr-sous'+(classe?' '+classe:'')+'" role="tablist">'+
      items.map(function(o){
        return '<button type="button" role="tab" aria-selected="'+(o.actif?'true':'false')+'" class="chr-sous-bouton'+(o.actif?' actif':'')+'"'+(o.id?' data-sous="'+idleHtml_(o.id)+'"':'')+' onclick="'+o.clic+'">'+
          (o.icone?'<i class="chr-sous-ico">'+icone(o.icone)+'</i>':'')+
          '<b>'+o.nom+'</b>'+
          (o.compteur!==undefined&&o.compteur!==null?'<span class="chr-puce">'+o.compteur+'</span>':'')+
        '</button>';
      }).join('')+
    '</div>';
  }

  /* Médaille du classement : disque métallique pour les trois premiers, numéro pour les autres. */
  function medaille(rang){
    const n=idleEntier_(rang);
    if(n>=1&&n<=3){
      return '<span class="chr-medaille m'+n+'" aria-label="'+n+'"><svg viewBox="0 0 24 24" data-sans-traduction aria-hidden="true"><path d="M7.5 13.4 5 22l7-3 7 3-2.5-8.6z" fill="currentColor" fill-opacity=".55"/><circle cx="12" cy="9" r="7" fill="currentColor"/><circle cx="12" cy="9" r="5" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="1"/></svg><b>'+n+'</b></span>';
    }
    return '<span class="chr-rang-n">'+idleHtml_(String(rang==null?'':rang))+'</span>';
  }

  function enveloppe(classe,html){
    return '<div class="chr-v1 '+classe+'">'+html+'</div>';
  }

  /* ===== Page Sets de la Collection ===== */

  function hashId(s){
    let h=0;const t=String(s||'');
    for(let i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))>>>0;
    return h;
  }

  function rendreCollectionIdleV22_(j){
    const a=aventureMetaIdleV47_(j);
    const setCatalog=catalogueSetsCollectionIdleV164_(a);
    const itemCatalog=a&&a.itemCatalog&&typeof a.itemCatalog==='object'?a.itemCatalog:{};
    const itemList=a&&a.itemList&&typeof a.itemList==='object'?a.itemList:{};
    const completed=a&&a.completedSets&&typeof a.completedSets==='object'?a.completedSets:{};
    const sets=Object.values(setCatalog).filter(function(setDef){
      const setId=String(setDef&&setDef.id||'');
      const slots=Array.isArray(setDef&&setDef.slots)?setDef.slots:[];
      return slots.some(function(slot){
        const info=itemList[setId+':'+String(slot)];
        return Boolean(info&&info.seen);
      });
    });
    /* Sets d'objets (Graine, Nombre, Aisselle, cœurs…) : révélés par le moteur seulement une fois un de leurs objets obtenu ou le set complété ; seuls les objets déjà vus sont listés, jamais leur total. */
    const setsObjets=Object.values(setCatalog).filter(function(setDef){return Boolean(setDef&&setDef.source==='objets');});

    if(!sets.length&&!setsObjets.length){
      return '<div class="soreal-idle-empty-v10 sc-vide"><span class="sc-vide-ico">'+icone('sets')+'</span>Aucun set découvert pour l’instant. Les cases apparaîtront dès que tu trouveras la première pièce d’un set.</div>';
    }

    function bonus(setDef,obtenu,condition){
      if(!setDef.reward||!Object.keys(setDef.reward).length)return '';
      return '<div class="sc-sceau'+(obtenu?' obtenu':'')+'">'+
        '<span class="sc-cire">'+icone('sceau')+'</span>'+
        '<div class="sc-btxt">'+
          '<div class="titre">'+(obtenu?'Bonus du set obtenu':'Bonus du set')+'</div>'+
          '<div class="texte">'+idleHtml_(libelleRecompenseSetAdventureIdleV163_(setDef.reward))+'</div>'+
          (obtenu?'':'<div class="condition">'+condition+'</div>')+
        '</div>'+
      '</div>';
    }

    function carte(setId,nom,complet,compte,statsHtml,bonusHtml,piecesHtml){
      const h=hashId(setId);
      return '<article class="sc-carte sc-m'+(h%8)+' sc-t'+(Math.floor(h/8)%6)+(complet?' sc-complet':'')+'">'+
        '<div class="sc-motif" aria-hidden="true"></div>'+
        '<span class="sc-coin sc-coin-a" aria-hidden="true"></span><span class="sc-coin sc-coin-b" aria-hidden="true"></span><span class="sc-coin sc-coin-c" aria-hidden="true"></span><span class="sc-coin sc-coin-d" aria-hidden="true"></span>'+
        '<header class="sc-tete">'+
          '<span class="sc-medaillon">'+icone('bouclier')+(complet?'<span class="sc-couronne">'+icone('couronne')+'</span>':'')+'</span>'+
          '<div class="sc-titre"><h3 class="sc-set-nom">'+idleHtml_(nom)+'</h3>'+frise()+'</div>'+
          '<div class="sc-compte'+(complet?' done':'')+'">'+compte+(complet?icone('coche'):'')+'</div>'+
        '</header>'+
        (statsHtml||'')+
        bonusHtml+
        '<div class="sc-pieces">'+piecesHtml+'</div>'+
      '</article>';
    }

    const htmlSetsObjets=setsObjets.map(function(setDef){
      const setId=String(setDef.id||'');
      const objets=Array.isArray(setDef.items)?setDef.items:[];
      const obtenu=Boolean(completed[setId]);
      const lignes=objets.map(function(defId){
        const def=itemCatalog[defId]||{};
        const info=itemList[defId]||null;
        const niveau=idleEntier_(info&&info.maxLevel);
        /* icône de l'objet (Norman, 2026-11-03 : « il y a des images manquantes dans sets ») : la même que dans l'onglet Équipement (équipement, cube ou objet spécial ; sinon un repli) */
        const pseudoObj=def.kind==='equipment'?{set:def.set,slot:def.slot,name:def.name,definitionId:defId,wikiItemId:def.wikiItemId||0,kind:'equipment',level:niveau}
          :(def.kind==='cube'?{set:'',slot:def.slot||'special',name:def.name,definitionId:defId,wikiItemId:def.wikiItemId||0,kind:'cube',level:niveau}
          :{set:'',slot:def.slot||'accessory',name:def.name||defId,definitionId:defId,wikiItemId:def.wikiItemId||0,kind:'special',level:niveau});
        return '<div class="sc-piece found soreal-idle-collection-slot-v32'+(niveau>=100?' maxed':'')+'"'+fichePieceSet_(defId,def,niveau,niveau>=100)+'>'+
          '<span class="sc-icone">'+iconeObjetAdventureIdleV138_(pseudoObj)+'</span>'+
          '<span class="sc-pnom">'+idleHtml_(def.name||defId)+'</span>'+
          /* Objet terminé : seulement son nom et le petit ✓ vert ; ses informations (niveau, jauge) ne s'affichent que tant qu'il n'est pas complètement monté (Norman, 2026-11-03) */
          (niveau>=100?'<span class="sc-fini">'+icone('coche','sc-ok')+'</span>'
            :'<small class="sc-niv">Niv. '+niveau+'/100</small>'+
              '<span class="sc-jauge"><i style="width:'+Math.min(100,niveau)+'%"></i></span>')+
        '</div>';
      }).join('');
      return carte(setId,setDef.name||setId,obtenu,'',
        '',
        bonus(setDef,obtenu,'S’obtient quand les objets du set sont au niveau 100.'),
        lignes);
    }).join('');

    return '<div class="sc-grille">'+sets.map(function(setDef){
      const setId=String(setDef&&setDef.id||'');
      const slots=Array.isArray(setDef&&setDef.slots)?setDef.slots:[];
      const total=slots.length;
      let vus=0;
      let niveau100=0;
      let verts=0;

      const cartes=slots.map(function(slot){
        const definitionId=setId+':'+String(slot);
        const def=itemCatalog[definitionId]||{};
        const info=itemList[definitionId]||null;
        const vu=Boolean(info&&info.seen);
        const lvl=vu?idleEntier_(info.maxLevel):0;
        const lvl100=Boolean(info&&info.maxed);
        const vert=Boolean(info&&info.fullyMaxed);
        if(vu)vus+=1;
        if(lvl100)niveau100+=1;
        if(vert)verts+=1;

        const pseudo={
          set:setId,
          slot:def.slot||slot,
          name:def.name||definitionId,
          definitionId:definitionId,
          wikiItemId:def.wikiItemId||0,
          kind:'equipment',
          basePower:def.basePower||0,
          baseToughness:def.baseToughness||0
        };

        if(!vu)return '';
        return '<div class="sc-piece soreal-idle-collection-slot-v32'+(vu?' found':'')+(vert?' maxed':'')+(lvl100&&!vert?' n100':'')+'"'+fichePieceSet_(definitionId,def,lvl,vert)+'>'+
          '<span class="sc-icone">'+iconeObjetAdventureIdleV138_(pseudo)+'</span>'+
          '<span class="sc-pnom">'+idleHtml_(def.name||definitionId)+'</span>'+
          /* Pièce terminée (niveau 100 ET boosts à 100 %) : seulement son nom et le petit ✓ vert ; tant qu'elle n'est pas complètement montée : niveau, « boosts à compléter » et jauge (Norman, 2026-11-03) */
          (vert?'<span class="sc-fini">'+icone('coche','sc-ok')+'</span>'
            :'<small class="sc-niv">Niv. '+lvl+'/100'+(lvl100?' · boosts à compléter':'')+'</small>'+
              '<span class="sc-jauge"><i style="width:'+Math.min(100,lvl)+'%"></i></span>')+
        '</div>';
      }).join('');

      const completeCollection=Boolean(total>0&&verts===total);
      /* Bonus du set en évidence (2026-09-26, Norman) : or à obtenir, sceau lumineux une fois obtenu (niveau 100 sur toutes les pièces). Aucun total de pièces n'est affiché. */
      const obtenu=Boolean(completed[setId]);
      const stats='<div class="sc-stats">'+
        '<span class="sc-stat"><em>Découverts</em><b>'+vus+'</b></span>'+
        '<span class="sc-stat"><em>Niveau 100</em><b>'+niveau100+'</b></span>'+
        '<span class="sc-stat"><em>100 % boosts</em><b>'+verts+'</b></span>'+
      '</div>';
      return carte(setId,setDef.name||setId,completeCollection,String(verts),stats,
        setDef.reward?bonus(setDef,obtenu,'S’obtient quand toutes les pièces du set sont au niveau 100.'):'',
        cartes);
    }).join('')+htmlSetsObjets+'</div>';
  }

  window.__SOREAL_IDLE_CHRONIQUES_DESIGN_V1__={
    icone:icone,
    frise:frise,
    barreOnglets:barreOnglets,
    sousOnglets:sousOnglets,
    medaille:medaille,
    enveloppe:enveloppe,
    rendreCollectionIdleV22_:rendreCollectionIdleV22_
  };
})();
