/*
 * SOREAL IDLE standalone auxiliary frontend module.
 * Migrated from SOREAL-APP/cloudflare/features/idle/item-extra-r2-v77.html
 * during standalone frontend cutover.
 */
(function(){
  'use strict';

  if(window.__SOREAL_IDLE_ITEM_EXTRA_IMAGES_R2_V77__)return;
  window.__SOREAL_IDLE_ITEM_EXTRA_IMAGES_R2_V77__=true;

  var TITAN_DROPS_V77={
    aNumber:'A Number',
    giantSeed:'Giant Seed',
    scrapPaper:'Scrap Paper',
    uugHair:'UUG Hair'
  };
  var BOOST_STRENGTHS_V77={1:true,2:true,5:true,10:true,20:true,50:true,100:true};
  var timer=0;

  function html_(v){
    return String(v==null?'':v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/\"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function normaliser_(v){
    return String(v==null?'':v)
      .replace(/\s+\+\d+\s*$/,'')
      .replace(/\s+/g,' ')
      .trim()
      .toLowerCase();
  }

  function root_(){
    return document.querySelector('.soreal-idle-page-root-v28');
  }

  function aventure_(joueur){
    return joueur&&joueur.systemes&&joueur.systemes.adventure&&
      typeof joueur.systemes.adventure==='object'
        ?joueur.systemes.adventure
        :null;
  }

  function items_(aventure){
    return Array.isArray(aventure&&aventure.inventory)?aventure.inventory:[];
  }

  function specObjet_(objet){
    if(!objet)return null;
    var def=String(objet.definitionId||'').trim();

    if(TITAN_DROPS_V77[def]){
      return {
        key:'titan:'+def,
        pack:'titan-drops',
        stem:def,
        label:String(objet.name||objet.nom||TITAN_DROPS_V77[def]),
        fallback:'🏆'
      };
    }

    var match=def.match(/^boost:(power|special|toughness):(1|2|5|10|20|50|100)$/);
    if(match&&BOOST_STRENGTHS_V77[Number(match[2])]){
      var type=match[1];
      var strength=match[2];
      return {
        key:'boost:'+type+':'+strength,
        boostType:type,
        strength:strength,
        label:String(objet.name||objet.nom||('Boost '+type+' '+strength)),
        fallback:type==='power'?'⚔️':type==='toughness'?'🛡️':'✨'
      };
    }

    return null;
  }

  /*
   * Correctif 2026-09-14 (Norman : "Je les ai changées" — nouvelles images
   * de boost sur R2, soreal/idle/items/SOREAL_IDLE_Boosts/). Cette route
   * pointait encore vers l'ancien mécanisme /api/idle/media/item?set=boosts
   * (recherche floue de dossier + convention de nom "svgboost_X_Y"), jamais
   * mis à jour quand la vraie route dédiée /api/idle/media/boost (worker.js,
   * boostImage_) a été ajoutée pour lire exactement ce dossier avec la
   * convention réelle des fichiers ("boost_X_Y.ext") — les images de boost
   * n'étaient donc jamais trouvées, quelle que soit leur présence sur R2.
   */
  function urlImage_(spec){
    if(!spec)return '';
    if(spec.boostType&&spec.strength){
      return '/api/idle/media/boost?boostType='+encodeURIComponent(spec.boostType)+'&strength='+encodeURIComponent(spec.strength);
    }
    return '/api/idle/media/item?set='+encodeURIComponent(spec.pack)+'&name='+encodeURIComponent(spec.stem);
  }

  function trouverObjet_(items,nom){
    var cible=normaliser_(nom);
    if(!cible)return null;
    return items.find(function(item){
      var spec=specObjet_(item);
      if(!spec)return false;
      return normaliser_(item&&item.name||item&&item.nom||spec.label)===cible;
    })||null;
  }

  function binder_(img,fallback){
    if(!img||img.dataset.v77Bound==='1')return;
    img.dataset.v77Bound='1';
    img.addEventListener('load',function(){
      img.hidden=false;
      if(fallback)fallback.hidden=true;
    });
    img.addEventListener('error',function(){
      img.hidden=true;
      if(fallback)fallback.hidden=false;
    });
  }

  function installer_(host,spec,mode){
    if(!host||!spec)return;
    var url=urlImage_(spec);
    if(!url||host.dataset.v77ItemKey===spec.key)return;

    var fallbackTexte=String(host.textContent||'').trim()||spec.fallback||'🎁';
    host.dataset.v77ItemKey=spec.key;
    host.innerHTML=
      '<span class="soreal-idle-v77-item-wrap '+html_(mode||'slot')+'">'+
        '<img class="soreal-idle-v77-item-image" src="'+html_(url)+'" alt="'+html_(spec.label||'Objet')+'" loading="lazy" decoding="async">'+
        '<span class="soreal-idle-v77-item-fallback">'+html_(fallbackTexte)+'</span>'+
      '</span>';

    var img=host.querySelector('.soreal-idle-v77-item-image');
    var fallback=host.querySelector('.soreal-idle-v77-item-fallback');
    binder_(img,fallback);
  }

  function decorerInventaire_(root,items){
    root.querySelectorAll('.soreal-idle-inventory-slot-v78').forEach(function(slot){
      var nomEl=slot.querySelector('.soreal-idle-slot-name-v78');
      var host=slot.querySelector('.soreal-idle-slot-emoji-v78');
      if(!nomEl||!host)return;
      var objet=trouverObjet_(items,nomEl.textContent||'');
      var spec=specObjet_(objet);
      if(spec)installer_(host,spec,'inventory');
    });
  }

  function decorerEquipes_(root,items){
    root.querySelectorAll('.soreal-idle-equip-slot-v10').forEach(function(slot){
      var nomEl=slot.querySelector('.soreal-idle-equip-slot-name-v10');
      var host=slot.querySelector('.soreal-idle-equipped-icon-v50');
      if(!nomEl||!host)return;
      var objet=trouverObjet_(items,nomEl.textContent||'');
      var spec=specObjet_(objet);
      if(spec)installer_(host,spec,'equipped');
    });
  }

  function decorerCartes_(root,items){
    if(!items.length)return;
    var labels=Array.prototype.slice.call(root.querySelectorAll('b'));
    items.forEach(function(item){
      var spec=specObjet_(item);
      if(!spec)return;
      labels.forEach(function(label){
        if(normaliser_(label.textContent)!==normaliser_(item.name||item.nom||spec.label))return;
        var card=label.closest('div[style*="padding:12px"]');
        if(!card)return;
        var host=card.querySelector('.soreal-idle-v77-item-card-image');
        if(!host){
          host=document.createElement('div');
          host.className='soreal-idle-v77-item-card-image';
          card.prepend(host);
        }
        installer_(host,spec,'card');
      });
    });
  }

  function appliquer_(joueur){
    var root=root_();
    if(!root)return;
    var aventure=aventure_(joueur);
    if(!aventure)return;
    var items=items_(aventure);
    if(!items.length)return;
    decorerInventaire_(root,items);
    decorerEquipes_(root,items);
    decorerCartes_(root,items);
  }

  function rendre_(){
    var rt=window.__SOREAL_IDLE_RUNTIME_V1__;
    if(!rt||typeof rt.getState!=='function')return;
    var avant=root_();
    if(!avant)return;
    rt.getState(false).then(function(joueur){
      if(root_()!==avant)return;
      appliquer_(joueur);
    }).catch(function(){});
  }

  function programmer_(){
    clearTimeout(timer);
    timer=setTimeout(rendre_,45);
  }

  function style_(){
    if(document.getElementById('soreal-idle-v77-item-extra-style'))return;
    var st=document.createElement('style');
    st.id='soreal-idle-v77-item-extra-style';
    st.textContent=
      '.soreal-idle-v77-item-wrap{position:relative;display:grid;place-items:center;width:100%;height:100%}'+
      '.soreal-idle-v77-item-image{display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 3px 6px rgba(0,0,0,.28))}'+
      '.soreal-idle-v77-item-fallback{display:grid;place-items:center;width:100%;height:100%;font-size:44px;line-height:1;text-align:center}'+
      '.soreal-idle-v77-item-card-image{width:74px;height:74px;float:left;margin:0 12px 8px 0;border-radius:12px;overflow:hidden;background:rgba(255,255,255,.04)}';
    document.head.appendChild(st);
  }

  window.__SOREAL_IDLE_ITEM_EXTRA_IMAGES_R2_V77_TEST__={
    specObjet:specObjet_,
    urlImage:urlImage_
  };

  style_();
  var rt=window.__SOREAL_IDLE_RUNTIME_V1__;
  if(rt&&typeof rt.onRender==='function')rt.onRender(programmer_);
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',programmer_,{once:true});
  }else{
    programmer_();
  }
})();
