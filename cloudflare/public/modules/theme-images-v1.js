/*
 * SOREAL IDLE — thèmes d'images (Norman, 2026-10-30 : « dans les options, je veux pouvoir activer le thème Magic »).
 *
 * Le thème Magic remplace les images des boss, des ennemis du mode Aventure (ce sont les mêmes images que les boss de même nom : le serveur, /api/idle/media/mob?…&theme=magic, renvoie vers l'image Magic du boss correspondant), les fonds des zones d'Aventure
 * et les images des zones sûres (WebP compressés, /magic/boss/<numéro>.webp, /magic/fonds/<zone>.webp, /magic/safe/<zone>.webp ; aucune n'est montrée en plein écran). Il ne s'applique qu'aux images de base : les images Evil et Sadistic gardent leur propre jeu.
 *
 * Réservé à l'administrateur (Norman, 2026-10-30) : pour tout autre compte, aucun thème.
 *
 * Règle d'apparition (Norman) : la PREMIÈRE fois qu'on rencontre une image avec le thème actif, l'ancienne reste 5 secondes, puis la nouvelle la remplace en fondu. Les fois suivantes, l'image du thème apparaît directement, sans fondu.
 * « Déjà vue » = liste mémorisée dans le compte (clé localStorage soreal_idle_theme_vus_v1, recopiée sur le serveur par prefs-compte-v1.js ; format compact { b:[numéros de boss], m:[empreintes de noms d'ennemis], f:[zones], s:[zones] } : une valeur de préférence
 * est limitée à 8 000 caractères).
 *
 * Les modules d'image appellent habiller(type, id, adresseDeBase[, adresseDuThème]) au moment de bâtir l'adresse : ils reçoivent l'adresse de base pendant les 5 secondes, puis celle du thème. La minuterie est tenue ici (par image,
 * pas par élément) : un redessin du combat ne la relance pas.
 *
 *   window.__SOREAL_IDLE_THEME_V1__ = { theme, habiller, definir, rafraichir }
 */
(function(){
  'use strict';
  if(typeof window==='undefined'||window.__SOREAL_IDLE_THEME_V1__)return;

  var CLE_THEME='soreal_idle_theme_v1';
  var CLE_VUS='soreal_idle_theme_vus_v1';
  var DELAI=5000;
  var DUREE=1400;
  var THEMES={magic:1};
  var ZONES={tutorial:1,sewers:1,forest:1,cave:1,sky:1,hsb:1,clock:1,'2d':1,ancient:1,avsp:1,mega:1,beardverse:1,badly:1,boring:1,chocolate:1,evilverse:1,pinkprincess:1,metaland:1,interdimensional:1,typozone:1,fadlands:1,jrpgville:1,radlands:1,backtoschool:1,westworld:1,breadverse:1,seventies:1,halloweenies:1,construction:1,duckduck:1,netherregions:1,aethereansea:1};
  /* Boss sans image dans le dossier du thème : ils gardent l'image de base. */
  var BOSS_ABSENTS={289:1,296:1};
  /* catégorie de la liste « déjà vues » selon le type d'image */
  var CATEGORIE={boss:'b',mob:'m',fonds:'f',safe:'s'};

  var pendants={};
  var echecs={};
  var vus={b:{},m:{},f:{},s:{}};
  var vusBrut=null;

  function lire_(cle){try{return window.localStorage.getItem(cle)||'';}catch(_e){return '';}}
  /* Réservé à l'administrateur : pour tout autre compte, aucun thème, quelle que soit la valeur mémorisée. */
  function estAdmin_(){try{return typeof window.__SOREAL_IDLE_EST_ADMIN_V1__==='function'&&window.__SOREAL_IDLE_EST_ADMIN_V1__()===true;}catch(_e){return false;}}
  function theme(){if(!estAdmin_())return '';var t=lire_(CLE_THEME);return THEMES[t]===1?t:'';}

  /* Empreinte courte (base 36) du nom d'un ennemi : la liste des « déjà vus » reste petite. */
  function empreinte_(texte){
    var s=String(texte==null?'':texte).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
    var h=5381,i;
    for(i=0;i<s.length;i++)h=((h*33)^s.charCodeAt(i))>>>0;
    return h.toString(36);
  }
  function valeurVue_(type,id){return type==='mob'?empreinte_(id):String(id);}

  function chargerVus_(){
    var brut=lire_(CLE_VUS);
    if(brut!==vusBrut){
      vusBrut=brut;vus={b:{},m:{},f:{},s:{}};
      try{
        var o=JSON.parse(brut||'{}');
        if(Array.isArray(o)){   /* ancien format : ["magic:boss:6", …] */
          o.forEach(function(k){var m=/^magic:(boss|fonds|safe|mob):(.+)$/.exec(String(k));if(m)vus[CATEGORIE[m[1]]][valeurVue_(m[1],m[2])]=1;});
        }else if(o&&typeof o==='object'){
          Object.keys(CATEGORIE).forEach(function(t){var c=CATEGORIE[t];(Array.isArray(o[c])?o[c]:[]).forEach(function(v){vus[c][String(v)]=1;});});
        }
      }catch(_e){}
    }
    return vus;
  }
  function sauverVus_(){
    try{
      var o={};
      Object.keys(CATEGORIE).forEach(function(t){var c=CATEGORIE[t];o[c]=Object.keys(vus[c]);});
      var brut=JSON.stringify(o);
      window.localStorage.setItem(CLE_VUS,brut);
      vusBrut=brut;
    }catch(_e){}
  }

  function fichier_(t,type,id){
    id=String(id==null?'':id);
    if(type==='boss'){var n=Number(id);return n>=1&&n<=301&&n===Math.floor(n)&&!BOSS_ABSENTS[n]?'/'+t+'/boss/'+n+'.webp':'';}
    if(type==='fonds')return ZONES[id]===1?'/'+t+'/fonds/'+id+'.webp':'';
    if(type==='safe')return ZONES[id]===1?'/'+t+'/safe/'+id+'.webp':'';
    return '';
  }

  function precharger_(url){try{var i=new window.Image();i.src=url;return i;}catch(_e){return null;}}

  /* Image qui en remplace une autre sur place : l'ancienne (copie posée par-dessus) s'efface en fondu pendant que la nouvelle est déjà dessous. */
  function fonduImage_(img,neuf){
    var parent=img.offsetParent;
    if(!img.isConnected||!parent||!img.offsetWidth||!img.offsetHeight||!img.animate){img.setAttribute('src',neuf);return;}
    var clone=img.cloneNode(false);
    clone.removeAttribute('id');
    clone.setAttribute('data-morph-garder','1');
    clone.setAttribute('aria-hidden','true');
    clone.style.cssText+=';position:absolute;left:'+img.offsetLeft+'px;top:'+img.offsetTop+'px;width:'+img.offsetWidth+'px;height:'+img.offsetHeight+'px;margin:0;animation:none;z-index:2;pointer-events:none';
    img.setAttribute('src',neuf);
    img.insertAdjacentElement('afterend',clone);
    var a=clone.animate([{opacity:1},{opacity:0}],{duration:DUREE,easing:'ease-in-out',fill:'forwards'});
    a.onfinish=a.oncancel=function(){clone.remove();};
  }

  /* Fond posé en variable CSS : fondu enchaîné calculé image par image (cross-fade), puis l'image du thème seule. */
  function fonduFond_(el,ancien,neuf,variable){
    var debut=null;
    function pas(t){
      if(!el.isConnected)return;
      if(debut===null)debut=t;
      var p=Math.min(1,(t-debut)/DUREE);
      el.style.setProperty(variable,p>=1?'url("'+neuf+'")':'-webkit-cross-fade(url("'+ancien+'"), url("'+neuf+'"), '+Math.round(p*100)+'%)');
      if(p<1)window.requestAnimationFrame(pas);
    }
    window.requestAnimationFrame(pas);
  }

  function remplacer_(p){
    var i,liste;
    if(p.type==='boss'||p.type==='mob'){
      liste=document.querySelectorAll('img[src="'+p.base+'"]');
      for(i=0;i<liste.length;i++)fonduImage_(liste[i],p.fichier);
    }else if(p.type==='safe'){
      liste=document.querySelectorAll('img.soreal-idle-v79-adventure-safe-image');
      for(i=0;i<liste.length;i++){
        if(liste[i].getAttribute('data-base')!==p.base)continue;
        liste[i].setAttribute('data-base',p.fichier);
        fonduImage_(liste[i],p.fichier);
      }
    }else if(p.type==='fonds'){
      liste=document.querySelectorAll('[data-fond-zone="'+p.id+'"]');
      for(i=0;i<liste.length;i++)fonduFond_(liste[i],p.base,p.fichier,'--fond-zone-v1');
    }
  }

  function finir_(cle){
    var p=pendants[cle];
    if(!p)return;
    delete pendants[cle];
    var i=new window.Image();
    i.onload=function(){
      chargerVus_();vus[CATEGORIE[p.type]][valeurVue_(p.type,p.id)]=1;sauverVus_();
      if(theme()===p.theme)remplacer_(p);
    };
    i.onerror=function(){echecs[cle]=1;};
    i.src=p.fichier;
  }

  /*
   * L'adresse à utiliser pour cette image : celle de base, ou celle du thème (déjà vue, ou après les 5 secondes). adresseTheme : pour un ennemi d'Aventure (type « mob »), l'adresse de base avec « &theme=magic » (le serveur le renvoie vers l'image du boss
   * de même nom) ; pour les autres types, l'adresse du thème est calculée ici.
   */
  function habiller(type,id,base,adresseTheme){
    var t=theme();
    if(!t)return base;
    var f=type==='mob'?(adresseTheme||''):fichier_(t,type,id);
    if(!f)return base;
    var cle=t+':'+type+':'+id;
    if(echecs[cle])return base;
    if(chargerVus_()[CATEGORIE[type]][valeurVue_(type,id)]===1)return f;
    if(!pendants[cle]){
      pendants[cle]={theme:t,type:type,id:String(id),base:base,fichier:f};
      precharger_(f);
      pendants[cle].minuterie=setTimeout(function(){finir_(cle);},DELAI);
    }
    return base;
  }

  /* Les fonds de zone sont posés une fois en variable CSS : on les repose pour qu'ils suivent le thème (changement dans les Réglages). */
  function rafraichir(){
    try{
      var F=window.__SOREAL_IDLE_FOND_ZONE_V1__;
      var blocs=document.querySelectorAll('[data-fond-zone]');
      for(var i=0;F&&F.appliquer&&i<blocs.length;i++)F.appliquer(blocs[i],blocs[i].getAttribute('data-fond-zone'));
      /* Images déjà à l'écran (boss, zone sûre) : le jeu ne redemande pas leur adresse tout de suite ; on les inscrit pour que l'ancienne reste 5 secondes puis cède la place en fondu. */
      var imgs=document.querySelectorAll('img[src^="/api/idle/media/boss?id="],img.soreal-idle-v79-adventure-safe-image');
      for(var j=0;j<imgs.length;j++){
        var s=imgs[j].classList.contains('soreal-idle-v79-adventure-safe-image')?(imgs[j].getAttribute('data-base')||''):(imgs[j].getAttribute('src')||'');
        var m=/^\/api\/idle\/media\/boss\?id=(\d+)$/.exec(s);
        if(m){habiller('boss',m[1],s);continue;}
        m=/^\/api\/idle\/media\/safe-zone\?zone=([a-z0-9]+)$/.exec(s);
        if(m)habiller('safe',m[1],s);
      }
    }catch(_e){}
  }

  function definir(code){
    var t=THEMES[code]===1&&estAdmin_()?code:'';
    try{
      if(t)window.localStorage.setItem(CLE_THEME,t);
      else window.localStorage.removeItem(CLE_THEME);
    }catch(_e){}
    rafraichir();
    return t;
  }

  window.__SOREAL_IDLE_THEME_V1__={estAdmin:estAdmin_,theme:theme,habiller:habiller,definir:definir,rafraichir:rafraichir,delai:DELAI,duree:DUREE};
})();
