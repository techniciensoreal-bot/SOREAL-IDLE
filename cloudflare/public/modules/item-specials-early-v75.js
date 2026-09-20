/*
 * SOREAL IDLE standalone auxiliary frontend module.
 * Migrated from SOREAL-APP/cloudflare/features/idle/item-specials-early-v75.html
 * during standalone frontend cutover.
 */
(function(){
  'use strict';

  if(window.__SOREAL_IDLE_SPECIAL_EARLY_IMAGES_V75__)return;
  window.__SOREAL_IDLE_SPECIAL_EARLY_IMAGES_V75__=true;

  var SPECIALS_V75={
    aStick:'A Stick',
    tutorialCube:'Tutorial Cube',
    tubaTime:'Tuba of Time',
    cheeseGrater:'Cheese Grater',
    skyBall:"A Dragon's Left Ball",
    pissedOffKey:'Pissed Off Key',
    wandoos98:'Wandoos 98',
    magicite:'Magicite Crystal',
    windupGear:'Giant Windup Gear',
    sinusoidalWave:'A Sinusoidal Wave',
    ghostTypewriter:'Ghost Typewriter',
    gaudyShoulders:'Gaudy Epaulettes',
    fTank:'The F Tank',
    wanderersCane:"Wanderer's Cane",
    stapler:'Stapler',
    crumpledNote:'A Crumpled Note',
    questNorthDakota:'Entire State of North Dakota',
    questCanadianCoins:'Random Canadian Coins',
    questDiploma:'Useless College Diploma',
    questSpittoon:'Spittoon',
    questToothbrush:'Toothbrush',
    ringOfApathy:'Ring of Apathy'
  };

  var SPECIAL_PACKS_V76={
    windupGear:'specials-mid',
    sinusoidalWave:'specials-mid',
    ghostTypewriter:'specials-mid',
    gaudyShoulders:'specials-mid',
    fTank:'specials-mid',
    wanderersCane:'specials-mid',
    stapler:'specials-mid',
    crumpledNote:'specials-mid',
    questNorthDakota:'specials-quest-beast-i',
    questCanadianCoins:'specials-quest-beast-i',
    questDiploma:'specials-quest-beast-i',
    questSpittoon:'specials-quest-beast-i',
    questToothbrush:'specials-quest-beast-i',
    ringOfApathy:'specials-quest-beast-i'
  };

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
    return Array.isArray(aventure&&aventure.inventory)
      ?aventure.inventory
      :[];
  }

  function specialId_(objet){
    var id=String(objet&&objet.definitionId||'').trim();
    return SPECIALS_V75[id]?id:'';
  }

  function trouverObjet_(items,nom){
    var cible=normaliser_(nom);
    if(!cible)return null;
    return items.find(function(item){
      var id=specialId_(item);
      if(!id)return false;
      return normaliser_(item&&item.name||item&&item.nom||SPECIALS_V75[id])===cible;
    })||null;
  }

  function urlImage_(id){
    var pack=SPECIAL_PACKS_V76[id]||'specials-early';
    return '/api/idle/media/item?set='+encodeURIComponent(pack)+'&name='+encodeURIComponent(id);
  }

  function binder_(img,fallback){
    if(!img||img.dataset.v75Bound==='1')return;
    img.dataset.v75Bound='1';
    img.addEventListener('load',function(){
      img.hidden=false;
      if(fallback)fallback.hidden=true;
    });
    img.addEventListener('error',function(){
      img.hidden=true;
      if(fallback)fallback.hidden=false;
    });
  }

  function installer_(host,objet,id,alt,mode){
    if(!host||!SPECIALS_V75[id])return;
    var url=urlImage_(id);
    if(host.dataset.v75SpecialId===id)return;

    var fallbackTexte=String(host.textContent||'').trim()||'🎁';
    host.dataset.v75SpecialId=id;
    host.innerHTML=
      '<span class="soreal-idle-v75-special-wrap '+html_(mode||'slot')+'">'+
        '<img class="soreal-idle-v75-special-image" src="'+html_(url)+'" alt="'+html_(alt||SPECIALS_V75[id])+'" loading="lazy" decoding="async">'+
        '<span class="soreal-idle-v75-special-fallback">'+html_(fallbackTexte)+'</span>'+
      '</span>';

    var img=host.querySelector('.soreal-idle-v75-special-image');
    var fallback=host.querySelector('.soreal-idle-v75-special-fallback');
    binder_(img,fallback);
  }

  function decorerInventaire_(root,items){
    root.querySelectorAll('.soreal-idle-inventory-slot-v78').forEach(function(slot){
      var nomEl=slot.querySelector('.soreal-idle-slot-name-v78');
      var host=slot.querySelector('.soreal-idle-slot-emoji-v78');
      if(!nomEl||!host)return;
      var objet=trouverObjet_(items,nomEl.textContent||'');
      var id=specialId_(objet);
      if(!id)return;
      installer_(host,objet,id,objet.name||objet.nom||SPECIALS_V75[id],'inventory');
    });
  }

  function decorerEquipes_(root,items){
    root.querySelectorAll('.soreal-idle-equip-slot-v10').forEach(function(slot){
      var nomEl=slot.querySelector('.soreal-idle-equip-slot-name-v10');
      var host=slot.querySelector('.soreal-idle-equipped-icon-v50');
      if(!nomEl||!host)return;
      var objet=trouverObjet_(items,nomEl.textContent||'');
      var id=specialId_(objet);
      if(!id)return;
      installer_(host,objet,id,objet.name||objet.nom||SPECIALS_V75[id],'equipped');
    });
  }

  function decorerAdventure_(root,items){
    var labels=Array.prototype.slice.call(root.querySelectorAll('b'));
    items.forEach(function(item){
      var id=specialId_(item);
      if(!id)return;
      labels.forEach(function(label){
        if(normaliser_(label.textContent)!==normaliser_(item.name||item.nom||SPECIALS_V75[id]))return;
        var card=label.closest('div[style*="padding:12px"]');
        if(!card)return;
        var host=card.querySelector('.soreal-idle-v75-special-card-image');
        if(!host){
          host=document.createElement('div');
          host.className='soreal-idle-v75-special-card-image';
          card.prepend(host);
        }
        installer_(host,item,id,item.name||item.nom||SPECIALS_V75[id],'card');
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
    decorerAdventure_(root,items);
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
    timer=setTimeout(rendre_,40);
  }

  function style_(){
    if(document.getElementById('soreal-idle-v75-special-early-style'))return;
    var st=document.createElement('style');
    st.id='soreal-idle-v75-special-early-style';
    st.textContent=
      '.soreal-idle-v75-special-wrap{position:relative;display:grid;place-items:center;width:100%;height:100%}'+
      '.soreal-idle-v75-special-image{display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 3px 6px rgba(0,0,0,.28))}'+
      '.soreal-idle-v75-special-fallback{display:grid;place-items:center;width:100%;height:100%}'+
      '.soreal-idle-v75-special-card-image{width:74px;height:74px;float:left;margin:0 12px 8px 0;border-radius:12px;overflow:hidden;background:rgba(255,255,255,.04)}';
    document.head.appendChild(st);
  }

  window.__SOREAL_IDLE_SPECIAL_EARLY_IMAGES_V75_TEST__={
    specialId:specialId_,
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
