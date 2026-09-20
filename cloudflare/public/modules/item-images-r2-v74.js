/*
 * SOREAL IDLE standalone auxiliary frontend module.
 * Migrated from SOREAL-APP/cloudflare/features/idle/item-images-r2-v74.html
 * during standalone frontend cutover.
 */
(function(){
  'use strict';

  if(window.__SOREAL_IDLE_ITEM_IMAGES_R2_V74__)return;
  window.__SOREAL_IDLE_ITEM_IMAGES_R2_V74__=true;

  var SET_NAMES_V74={
    training:'Training Set',
    sewers:'Sewers Set',
    forest:'Forest Set',
    cave:'Cave Set',
    hsb:'HSB Set',
    grb:'GRB Set',
    clock:'Clock Set',
    '2d':'2D Set',
    spoopy:'Spoopy Set',
    jake:'Jake Set',
    uug:"UUG's Rings Set",
    gaudy:'Gaudy Set',
    mega:'Mega Set',
    beardverse:'Beardverse Set',
    badly:'Badly Drawn Set',
    stealth:'Stealth Set',
    choco:'Choco Set',
    wanderer:"Wanderer's Set",
    rerednaw:"S'rerednaW Set",
    slimy:'Slimy Set'
  };

  var timer=0;

  function html_(v){
    return String(v==null?'':v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
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

  function items_(a){
    return Array.isArray(a&&a.inventory)?a.inventory:[];
  }

  function sacItems_(joueur){
    /*
     * V75 — le Sac (cases + emplacements équipés) est décoré depuis
     * idleEtat.inventaire (joueur.inventaire), la SEULE collection qui
     * alimente réellement l'UI du Sac (Soreal_Idle_UI.html casesInventaireIdleV78_).
     * joueur.systemes.adventure.inventory est une collection distincte,
     * utilisée uniquement par le mode Aventure (decorerCartesAdventure_) —
     * un objet du Sac absent de ce second tableau perdait auparavant son
     * image (setId introuvable, requête R2 sans nom -> 404 permanent).
     */
    return Array.isArray(joueur&&joueur.inventaire)?joueur.inventaire:[];
  }

  function setIdDepuisNom_(nom){
    var n=normaliser_(nom);
    var ids=Object.keys(SET_NAMES_V74);
    for(var i=0;i<ids.length;i++){
      var id=ids[i];
      var setNom=normaliser_(SET_NAMES_V74[id]);
      if(n===setNom||n.indexOf(setNom+' ')===0)return id;
    }
    return '';
  }

  function setIdObjet_(objet){
    if(!objet)return '';
    /*
     * V79 — Norman (2026-09-10) : "importe tout le contenu", ne plus
     * limiter l'affichage image aux 20 sets connus d'avance. objet.set est
     * un champ d'identite EXCLUSIF aux objets d'equipement de set (jamais
     * porte par un special/titan-drop/boost, geres par d'autres fichiers
     * via definitionId) : lui faire confiance sans exiger sa presence dans
     * SET_NAMES_V74 permet a un nouveau set d'apparaitre automatiquement
     * des que Norman ajoute les images R2 correspondantes, sans nouveau
     * code (le serveur resout deja n'importe quel set par recherche floue
     * sur les vrais dossiers R2, cf. dossierSetItemR2_ dans worker.js). Le
     * repli definitionId reste volontairement limite a SET_NAMES_V74 : ce
     * champ est aussi utilise par les specials/titan-drops (autres
     * fichiers), l'ouvrir en grand causerait des collisions entre
     * decorateurs sur le meme objet.
     */
    var direct=String(objet.set||'').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'');
    if(direct)return direct;
    var def=String(objet.definitionId||'').split(':')[0].trim().toLowerCase();
    if(def&&SET_NAMES_V74[def])return def;
    return setIdDepuisNom_(objet.name||objet.nom||'');
  }

  function trouverObjet_(items,nom){
    var cible=normaliser_(nom);
    if(!cible)return null;
    return items.find(function(item){
      return normaliser_(item&&item.name||item&&item.nom||'')===cible;
    })||null;
  }

  function urlImage_(objet,setId){
    var p=new URLSearchParams();
    p.set('set',setId);
    if(objet&&objet.slot)p.set('slot',String(objet.slot));
    if(objet&&objet.definitionId)p.set('definition',String(objet.definitionId));
    if(objet&&objet.wikiItemId)p.set('wikiItemId',String(objet.wikiItemId));
    if(objet&&(objet.name||objet.nom))p.set('name',String(objet.name||objet.nom));
    return '/api/idle/media/item?'+p.toString();
  }

  function binder_(img,fallback){
    if(!img||img.dataset.v74Bound==='1')return;
    img.dataset.v74Bound='1';
    img.addEventListener('load',function(){
      img.hidden=false;
      img.classList.add('loaded');
      if(fallback)fallback.hidden=true;
    });
    img.addEventListener('error',function(){
      img.hidden=true;
      if(fallback)fallback.hidden=false;
    });
  }

  function installer_(host,objet,setId,alt,mode){
    if(!host||!setId)return;
    var url=urlImage_(objet,setId);
    var key=setId+'|'+String(objet&&objet.slot||'')+'|'+String(objet&&(objet.name||objet.nom)||alt||'');
    if(host.dataset.v74R2Key===key)return;

    var fallbackTexte='🛡️';
    var ancienFallback=host.querySelector('.soreal-idle-v73-set-fallback');
    if(ancienFallback&&String(ancienFallback.textContent||'').trim()){
      fallbackTexte=String(ancienFallback.textContent||'').trim();
    }else if(String(host.textContent||'').trim()){
      fallbackTexte=String(host.textContent||'').trim();
    }

    var wrap=host.querySelector('.soreal-idle-v73-set-image-wrap');
    if(!wrap){
      host.innerHTML=
        '<span class="soreal-idle-v73-set-image-wrap '+html_(mode||'slot')+'">'+
          '<img class="soreal-idle-v73-set-image" alt="" loading="lazy" decoding="async">'+
          '<span class="soreal-idle-v73-set-fallback">'+html_(fallbackTexte)+'</span>'+
        '</span>';
      wrap=host.querySelector('.soreal-idle-v73-set-image-wrap');
    }

    var img=wrap&&wrap.querySelector('.soreal-idle-v73-set-image');
    var fallback=wrap&&wrap.querySelector('.soreal-idle-v73-set-fallback');
    if(!img)return;

    host.dataset.v74R2Key=key;
    host.dataset.v73SetImage=setId;
    img.setAttribute('alt',String(alt||objet&&objet.name||SET_NAMES_V74[setId]||'Objet'));
    img.dataset.v73SetSources=JSON.stringify([url]);
    img.dataset.v73SetIndex='0';
    img.dataset.v74R2='1';
    img.hidden=false;
    if(fallback)fallback.hidden=false;
    binder_(img,fallback);
    if(img.getAttribute('src')!==url)img.setAttribute('src',url);
  }

  function decorerInventaire_(root,items){
    root.querySelectorAll('.soreal-idle-inventory-slot-v78').forEach(function(slot){
      var nomEl=slot.querySelector('.soreal-idle-slot-name-v78');
      var host=slot.querySelector('.soreal-idle-slot-emoji-v78');
      if(!nomEl||!host)return;
      var nom=String(nomEl.textContent||'').replace(/\s+\+\d+\s*$/,'').trim();
      var objet=trouverObjet_(items,nom);
      var setId=setIdObjet_(objet)||setIdDepuisNom_(nom);
      if(!setId)return;
      installer_(host,objet,setId,nom,'inventory');
    });
  }

  function decorerEquipes_(root,items){
    root.querySelectorAll('.soreal-idle-equip-slot-v10').forEach(function(slot){
      var nomEl=slot.querySelector('.soreal-idle-equip-slot-name-v10');
      var host=slot.querySelector('.soreal-idle-equipped-icon-v50');
      if(!nomEl||!host)return;
      var nom=String(nomEl.textContent||'').replace(/\s+\+\d+\s*$/,'').trim();
      var objet=trouverObjet_(items,nom);
      var setId=setIdObjet_(objet)||setIdDepuisNom_(nom);
      if(!setId)return;
      installer_(host,objet,setId,nom,'equipped');
    });
  }

  function decorerCartesAdventure_(root,items){
    if(!root.querySelector('[onclick*="equiperObjetAdventureIdleV47_"]'))return;
    var labels=Array.prototype.slice.call(root.querySelectorAll('b'));
    items.forEach(function(item){
      if(!item||item.kind!=='equipment')return;
      var setId=setIdObjet_(item);
      if(!setId)return;
      labels.forEach(function(label){
        if(normaliser_(label.textContent)!==normaliser_(item.name||item.nom))return;
        var card=label.closest('div[style*="padding:12px"]');
        if(!card)return;
        card.dataset.v73SetCard='1';
        var host=card.querySelector('.soreal-idle-v73-adventure-item-image');
        if(!host){
          host=document.createElement('div');
          host.className='soreal-idle-v73-adventure-item-image';
          card.prepend(host);
        }
        installer_(host,item,setId,item.name||item.nom,'card');
      });
    });
  }

  function appliquer_(joueur){
    var root=root_();
    if(!root)return;
    var sac=sacItems_(joueur);
    if(sac.length){
      decorerInventaire_(root,sac);
      decorerEquipes_(root,sac);
    }
    var a=aventure_(joueur);
    var items=items_(a);
    if(items.length)decorerCartesAdventure_(root,items);
  }

  function rendre_(){
    var rt=window.__SOREAL_IDLE_RUNTIME_V1__;
    if(!rt||typeof rt.getState!=='function')return;
    var rootAvant=root_();
    if(!rootAvant)return;
    rt.getState(false).then(function(joueur){
      if(root_()!==rootAvant)return;
      appliquer_(joueur);
    }).catch(function(){});
  }

  function programmer_(){
    clearTimeout(timer);
    timer=setTimeout(rendre_,35);
  }

  function style_(){
    if(document.getElementById('soreal-idle-v74-r2-items-style'))return;
    var st=document.createElement('style');
    st.id='soreal-idle-v74-r2-items-style';
    st.textContent=
      '.soreal-idle-v73-set-image-wrap{position:relative;display:grid;place-items:center;width:100%;height:100%}'+
      '.soreal-idle-v73-set-image{display:block;max-width:100%;max-height:100%;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 3px 6px rgba(0,0,0,.28))}'+
      '.soreal-idle-v73-set-fallback{display:grid;place-items:center;width:100%;height:100%}'+
      '.soreal-idle-v73-adventure-item-image{width:74px;height:74px;float:left;margin:0 12px 8px 0;border-radius:12px;overflow:hidden;background:rgba(255,255,255,.04)}';
    document.head.appendChild(st);
  }

  window.__SOREAL_IDLE_ITEM_IMAGES_R2_V74_TEST__={
    setIdDepuisNom:setIdDepuisNom_,
    setIdObjet:setIdObjet_,
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
