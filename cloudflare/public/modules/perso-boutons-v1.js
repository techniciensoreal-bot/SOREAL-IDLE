/*
 * SOREAL IDLE — boutons de pourcentage personnalisés de la Boutique AP (Norman, 2026-10-12 : « veille à brancher tout ce qui est dans les boutiques »). Textes du wiki NGU Idle, page 4G's Sellout Shop :
 *  - Custom Energy/Magic % Buttons (25 000 AP) : « one set of custom % buttons for Energy and Magic inputs ! These work like the other custom buttons, but they output a % of your total cap. »
 *  - More Custom Energy/Magic % Buttons (80 000 AP) : « another set … ».
 *  - Custom Idle Energy/Magic % Buttons (125 000 AP) : « a set of custom % buttons for idle Energy and Magic inputs … output a % of your total idle Energy or Magic. »
 *  - Custom Resource 3 % Button (50 000 AP), Another Custom Resource 3 % Button (150 000 AP) : boutons de pourcentage du plafond de la ressource 3 ; Custom Idle Resource 3 % Button (150 000 AP) : pourcentage de l'idle.
 *  - NGU Cap Modifier (100 000 AP) : « a setting to modify the % of cap gets input when you click the NGU cap button. »
 * Le wiki ne publie pas de pourcentage de départ : chaque bouton porte une valeur CHOISIE par le joueur (✎), gardée sur cet appareil (10 % au départ). Un bouton n'existe que si l'achat est fait (anti-spoil, règle n°2).
 *  - Boutique EXP, Misc : Custom Input Button 1 à 4 (50 / 100 / 500 / 1000 EXP) : un bouton à côté du champ Input qui y place un NOMBRE choisi par le joueur (valeurs de départ SOREAL : 100, 1 000, 10 000, 100 000).
 *
 * Les boutons s'ajoutent d'eux-mêmes à chaque cadre « Plafond » / « Idle » déjà dessiné par les menus (barre d'allocation commune, Augmentations, Entraînement avancé, Blood Magic, Entraînement de base, NGU) : ils écrivent dans
 * le champ Input exactement comme Max, 1/2 et 1/4.
 *
 *   window.__SOREAL_IDLE_PERSO_PCT_V1__ = { pourcentage(slot), definir(slot,valeur), editer(slot), appliquer(res,source,slot), decorer() }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_PERSO_PCT_V1__)return;

  var CLE='soreal_idle_pct_perso_v1';
  /* slot -> article de la Boutique AP, ressources concernées, source (plafond ou idle) */
  var SLOTS={
    em1:{achat:'customEnergyMagicButtons',res:['energy','magic'],source:'cap'},
    em2:{achat:'moreCustomEnergyMagicButtons',res:['energy','magic'],source:'cap'},
    emIdle:{achat:'customIdleEnergyMagicButtons',res:['energy','magic'],source:'idle'},
    r3a:{achat:'customResource3Button',res:['r3'],source:'cap'},
    r3b:{achat:'anotherCustomResource3Button',res:['r3'],source:'cap'},
    r3Idle:{achat:'customIdleResource3Button',res:['r3'],source:'idle'}
  };
  var ORDRE=['em1','em2','emIdle','r3a','r3b','r3Idle'];
  var DEFAUT=10;
  var NGU_ACHAT='nguCapModifier';
  /* Custom Input Button 1 à 4 (boutique EXP) : achat et valeur de départ */
  var INPUTS={1:{achat:'customInput1',defaut:100},2:{achat:'customInput2',defaut:1000},3:{achat:'customInput3',defaut:10000},4:{achat:'customInput4',defaut:100000}};
  var CHAMPS_INPUT=['sorealIdleAugInputV1','sorealIdleTrainingInputV120','sorealIdleBloodInputV1','sorealIdleTmInputV1','sorealIdleGenInputV1'];
  var CLE_INPUT='soreal_idle_input_perso_v1';

  function lire_(){try{var o=JSON.parse(localStorage.getItem(CLE)||'{}');return o&&typeof o==='object'?o:{};}catch(_e){return {};}}
  function ecrire_(o){try{localStorage.setItem(CLE,JSON.stringify(o));}catch(_e){}}
  function bornes_(v){var n=Number(String(v).replace(',','.'));return Number.isFinite(n)?Math.max(1,Math.min(100,Math.round(n*10)/10)):null;}
  function pourcentage(slot){var v=bornes_(lire_()[slot]);return v==null?DEFAUT:v;}
  function definir(slot,valeur){var v=bornes_(valeur);if(v==null||(!SLOTS[slot]&&slot!=='nguCap'))return false;var o=lire_();o[slot]=v;ecrire_(o);return true;}
  function pourcentNgu_(){var v=bornes_(lire_().nguCap);return v==null?100:v;}
  function etat_(){var h=window.__SOREAL_IDLE_META_HOST_V130__;return h&&h.getIdleEtat?h.getIdleEtat():null;}
  function possede_(achat){
    var j=etat_(),c=j&&j.systemes&&j.systemes.selloutShop&&Array.isArray(j.systemes.selloutShop.catalog)?j.systemes.selloutShop.catalog:[];
    for(var i=0;i<c.length;i++)if(c[i]&&c[i].id===achat&&Number(c[i].purchased)>0)return true;
    return false;
  }
  function texte_(v){return String(v).replace('.',',')+' %';}

  /* ----- Custom Input Button 1 à 4 : un nombre, pas un pourcentage ----- */
  function lireInputs_(){try{var o=JSON.parse(localStorage.getItem(CLE_INPUT)||'{}');return o&&typeof o==='object'?o:{};}catch(_e){return {};}}
  function valeurInput(n){var v=Math.floor(Number(lireInputs_()[n]));return Number.isFinite(v)&&v>=1?v:(INPUTS[n]?INPUTS[n].defaut:1);}
  function definirInput(n,valeur){
    var v=Math.floor(Number(String(valeur).replace(/\s/g,'').replace(',','.')));
    if(!INPUTS[n]||!Number.isFinite(v)||v<1)return false;
    var o=lireInputs_();o[n]=Math.min(v,1e15);
    try{localStorage.setItem(CLE_INPUT,JSON.stringify(o));}catch(_e){}
    return true;
  }
  function possedeExp_(achat){
    var j=etat_(),c=j&&j.systemes&&Array.isArray(j.systemes.expShop)?j.systemes.expShop:[];
    for(var i=0;i<c.length;i++)if(c[i]&&c[i].id===achat&&Number(c[i].purchased)>0)return true;
    return false;
  }
  function nombreTexte_(v){var h=window.__SOREAL_IDLE_META_HOST_V130__;return h&&h.formatGrandNombreIdleV70_?h.formatGrandNombreIdleV70_(v):String(v);}
  /*
   * Fenêtre de saisie du site (Norman, 2026-10-12 : « le popup qui apparaît pour demander combien on veut mettre n'a pas l'apparence du site ») : mêmes cartes que les autres fenêtres du jeu (.soreal-idle-modal-*-v63) à la place
   * du prompt() du navigateur ; Entrée valide, Échap ou un clic à côté ferme.
   */
  function demander_(o){
    var ancien=document.getElementById('sorealIdlePersoModalV1');
    if(ancien&&ancien.parentNode)ancien.parentNode.removeChild(ancien);
    var h=window.__SOREAL_IDLE_META_HOST_V130__,esc=function(t){return h&&h.idleHtml_?h.idleHtml_(t):String(t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
    var m=document.createElement('div');
    m.id='sorealIdlePersoModalV1';m.className='soreal-idle-modal-backdrop-v63';
    m.innerHTML='<div class="soreal-idle-modal-card-v63" role="dialog" aria-modal="true" aria-label="'+esc(o.titre)+'">'+
      '<div class="soreal-idle-modal-top-v63"><div class="soreal-idle-modal-icon-v63">'+esc(o.icone||'⭐')+'</div><div class="soreal-idle-modal-title-v63">'+esc(o.titre)+'</div></div>'+
      '<div class="soreal-idle-modal-body-v63"><div class="soreal-idle-modal-info-v63">'+esc(o.aide)+'</div>'+
        '<input class="perso-modal-champ-v1" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="'+esc(o.valeur)+'">'+
        '<div class="perso-modal-erreur-v1" aria-live="polite"></div></div>'+
      '<div class="soreal-idle-modal-actions-v63"><button type="button" class="soreal-idle-modal-button-v63 cancel">Annuler</button><button type="button" class="soreal-idle-modal-button-v63 confirm">Valider</button></div>'+
    '</div>';
    var champ=m.querySelector('input'),err=m.querySelector('.perso-modal-erreur-v1');
    function fermer(){if(m.parentNode)m.parentNode.removeChild(m);document.removeEventListener('keydown',clavier,true);}
    function valider(){
      if(!o.valider(champ.value)){err.textContent=o.erreur||'Valeur invalide.';champ.focus();return;}
      fermer();
      if(typeof o.apres==='function')o.apres();
    }
    function clavier(e){
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();fermer();}
      else if(e.key==='Enter'&&document.activeElement===champ){e.preventDefault();e.stopPropagation();valider();}
    }
    m.addEventListener('click',function(e){if(e.target===m)fermer();});
    m.querySelector('.cancel').addEventListener('click',fermer);
    m.querySelector('.confirm').addEventListener('click',valider);
    champ.addEventListener('input',function(){err.textContent='';});
    document.addEventListener('keydown',clavier,true);
    document.body.appendChild(m);
    try{champ.focus();champ.select();}catch(_e){}
  }
  function editerInput(n){
    demander_({icone:'⭐',titre:'Bouton personnalisé '+n,aide:'Nombre placé dans le champ Input quand tu cliques sur ce bouton (entier, 1 ou plus).',valeur:String(valeurInput(n)),
      valider:function(rep){return definirInput(n,rep);},erreur:'Entre un entier supérieur ou égal à 1.',apres:function(){decorer(true);}});
  }
  function appliquerInput(n){
    var a=window.__SOREAL_IDLE_ALLOC_V1__;
    if(a&&typeof a.saisir==='function')a.saisir(valeurInput(n));
  }
  function decorerChampInput_(champ,force){
    var boite=champ.parentElement;
    if(!boite||!boite.parentNode)return;
    var cle=[1,2,3,4].map(function(n){return possedeExp_(INPUTS[n].achat)?valeurInput(n):'-';}).join(',');
    var suivant=boite.nextElementSibling,rangee=suivant&&suivant.hasAttribute&&suivant.hasAttribute('data-perso-input-rangee')?suivant:null;
    var aucun=cle==='-,-,-,-';
    if(!force&&((rangee&&rangee.getAttribute('data-perso-input-cle')===cle)||(!rangee&&aucun&&!boite.querySelector('[data-perso-input-v1]'))))return;
    /* anciens boutons (collés dans la boîte du champ) et ancienne rangée */
    Array.prototype.forEach.call(boite.querySelectorAll('[data-perso-input-v1]'),function(b){b.parentNode.removeChild(b);});
    if(rangee)rangee.parentNode.removeChild(rangee);
    boite.removeAttribute('data-perso-input-cle');
    if(aucun)return;
    /* Norman (2026-10-12) : « le bouton est très moche, il doit avoir l'apparence du menu dans lequel il se trouve » : une rangée .soreal-idle-bt-presets-v120 comme « Idle » (le thème de chaque menu s'y applique tout seul) */
    var html='<span>⭐ Mes nombres</span>';
    [1,2,3,4].forEach(function(n){
      if(!possedeExp_(INPUTS[n].achat))return;
      html+='<button type="button" data-perso-input-v1="'+n+'" title="Ton bouton personnalisé '+n+' : place '+nombreTexte_(valeurInput(n))+' dans Input" onclick="window.__SOREAL_IDLE_PERSO_PCT_V1__.appliquerInput('+n+')">'+nombreTexte_(valeurInput(n))+'</button>'+
        '<button type="button" class="perso-edit-v1" data-perso-input-v1="'+n+'" title="Changer le nombre de ce bouton" onclick="window.__SOREAL_IDLE_PERSO_PCT_V1__.editerInput('+n+')">✏️</button>';
    });
    var r=document.createElement('div');
    r.className='soreal-idle-bt-presets-v120';
    r.setAttribute('data-perso-input-rangee','1');r.setAttribute('data-perso-input-cle',cle);
    r.innerHTML=html;
    boite.parentNode.insertBefore(r,boite.nextSibling);
  }

  function editer(slot){
    var cible=slot==='nguCap'?pourcentNgu_():pourcentage(slot);
    demander_({icone:'%',titre:slot==='nguCap'?'Max des NGU':'Pourcentage du bouton',aide:slot==='nguCap'?'Pourcentage du plafond placé par le bouton Max des NGU (1 à 100).':'Part placée par ce bouton (1 à 100 %).',valeur:String(cible).replace('.',','),
      valider:function(rep){return definir(slot,rep);},erreur:'Entre un nombre entre 1 et 100.',apres:function(){decorer(true);}});
  }

  /* Écrit le montant dans l'Input comme Max, 1/2 et 1/4 (menu NGU : son propre calcul). */
  function appliquer(res,source,slot){
    var f=pourcentage(slot)/100;
    var ngu=window.__SOREAL_IDLE_NGU_LABO_V1__;
    if(document.querySelector('.nl-v1')&&ngu&&typeof ngu.preset==='function'){ngu.preset(source,f);return;}
    var a=window.__SOREAL_IDLE_ALLOC_V1__;
    if(a&&typeof a.preset==='function')a.preset(res,source,f);
  }

  /* Ressource d'un cadre, d'après son libellé (« Plafond d’énergie », « Plafond de magie », « Plafond de 3e ressource »). */
  function ressourceDe_(cadre){
    var t=String((cadre.querySelector('span')||{}).textContent||'').toLowerCase();
    if(t.indexOf('magie')!==-1)return 'magic';
    if(t.indexOf('3e')!==-1||t.indexOf('ressource')!==-1)return 'r3';
    if(t.indexOf('nergie')!==-1)return 'energy';
    return '';
  }
  function sourceDe_(cadre){
    var t=String((cadre.querySelector('span')||{}).textContent||'').toLowerCase();
    if(t.indexOf('plafond')!==-1)return 'cap';
    if(t.indexOf('idle')!==-1)return 'idle';
    return '';
  }
  /* Menu NGU : le cadre Idle ne porte pas la ressource dans son libellé ; elle suit l'onglet affiché. */
  function ressourceNgu_(){
    var r=document.querySelector('.nl-v1');
    return r&&r.getAttribute('data-nl-onglet')==='magic'?'magic':'energy';
  }

  function boutonsHtml_(res,source){
    var h='';
    ORDRE.forEach(function(slot){
      var s=SLOTS[slot];
      if(s.source!==source||s.res.indexOf(res)===-1||!possede_(s.achat))return;
      h+='<button type="button" class="perso-pct-v1" data-perso-pct-v1="'+slot+'" title="Ton bouton personnalisé : '+texte_(pourcentage(slot))+(source==='idle'?' de ton idle libre':' de ton plafond')+'" onclick="window.__SOREAL_IDLE_PERSO_PCT_V1__.appliquer(\''+res+'\',\''+source+'\',\''+slot+'\')">'+texte_(pourcentage(slot))+'</button>'+
        '<button type="button" class="perso-pct-edit-v1" data-perso-pct-v1="'+slot+'" title="Changer le pourcentage de ce bouton" onclick="window.__SOREAL_IDLE_PERSO_PCT_V1__.editer(\''+slot+'\')">✎</button>';
    });
    return h;
  }

  function decorerCadre_(cadre,force){
    var ngu=cadre.classList.contains('nl-ligne');
    var source=sourceDe_(cadre);
    if(!source)return;
    var res=ressourceDe_(cadre);
    if(!res&&ngu)res=ressourceNgu_();
    if(!res&&source==='idle')res=ngu?ressourceNgu_():'';
    /* cadre « Idle » des menus : la ressource est celle du cadre « Plafond » voisin, ou de la page */
    if(!res){
      var prec=cadre.previousElementSibling;
      while(prec&&!res){res=ressourceDe_(prec);prec=prec.previousElementSibling;}
    }
    if(!res)return;
    var cle=res+'|'+source+'|'+(ngu?'n':'a')+'|'+ORDRE.map(function(s){return possede_(SLOTS[s].achat)?pourcentage(s):'-';}).join(',')+'|'+(source==='cap'&&possede_(NGU_ACHAT)?pourcentNgu_():'');
    if(!force&&cadre.getAttribute('data-perso-pct-cle')===cle)return;
    Array.prototype.forEach.call(cadre.querySelectorAll('[data-perso-pct-v1],[data-perso-ngu-v1]'),function(b){b.parentNode.removeChild(b);});
    var html=boutonsHtml_(res,source);
    if(ngu&&source==='cap'&&possede_(NGU_ACHAT)){
      html+='<button type="button" class="perso-pct-edit-v1" data-perso-ngu-v1="1" title="Réglage du bouton Max des NGU : pourcentage du plafond placé" onclick="window.__SOREAL_IDLE_PERSO_PCT_V1__.editer(\'nguCap\')">⚙ Max = '+texte_(pourcentNgu_())+'</button>';
    }
    if(html){
      var tampon=document.createElement('span');
      tampon.innerHTML=html;
      var clear=cadre.querySelector('button.clear');
      while(tampon.firstChild){
        if(clear)cadre.insertBefore(tampon.firstChild,clear);else cadre.appendChild(tampon.firstChild);
      }
    }
    cadre.setAttribute('data-perso-pct-cle',cle);
  }

  var enCours=false;
  function decorer(force){
    if(typeof document==='undefined'||typeof document.querySelectorAll!=='function'||document.hidden)return;
    CHAMPS_INPUT.forEach(function(id){var champ=document.getElementById(id);if(champ){try{decorerChampInput_(champ,Boolean(force));}catch(_e){}}});
    var cadres=document.querySelectorAll('.soreal-idle-bt-presets-v120,.nl-ligne');
    Array.prototype.forEach.call(cadres,function(c){
      if(c.classList.contains('soreal-idle-bt-total-v1')||c.getAttribute('data-alloc-total-v1')||c.hasAttribute('data-perso-input-rangee'))return;
      try{decorerCadre_(c,Boolean(force));}catch(_e){}
    });
  }
  function planifier_(){
    if(enCours)return;
    enCours=true;
    /* setTimeout et non requestAnimationFrame : l'onglet caché ne rejoue pas les images d'animation, le suivi ne doit jamais rester bloqué. */
    setTimeout(function(){enCours=false;decorer(false);},80);
  }
  /* Le bouton Max des NGU applique le pourcentage choisi (NGU Cap Modifier) : le clic est repris avant le menu. */
  if(typeof document!=='undefined'&&document.addEventListener){
    document.addEventListener('click',function(ev){
      var b=ev.target&&ev.target.closest?ev.target.closest('.nl-ligne button'):null;
      if(!b||b.getAttribute('data-perso-pct-v1')||b.getAttribute('data-perso-ngu-v1'))return;
      var onclick=String(b.getAttribute('onclick')||'');
      if(onclick.indexOf("preset('cap',1)")===-1&&onclick.indexOf('preset(\\\'cap\\\',1)')===-1)return;
      if(!possede_(NGU_ACHAT))return;
      var ngu=window.__SOREAL_IDLE_NGU_LABO_V1__;
      if(!ngu||typeof ngu.preset!=='function')return;
      ev.preventDefault();
      ev.stopPropagation();
      ngu.preset('cap',pourcentNgu_()/100);
    },true);
    if(typeof MutationObserver==='function'&&document.body){
      new MutationObserver(planifier_).observe(document.body,{childList:true,subtree:true});
    }
    /* un achat de la Boutique AP ne change pas le DOM : un rattrapage régulier suffit */
    setInterval(planifier_,1500);
    var style=document.createElement('style');
    style.textContent='.perso-pct-v1{border-color:#f2d79a!important;color:#ffe9a6!important}.perso-pct-edit-v1{min-width:30px;padding:0 6px!important;opacity:.85;font-size:12px!important}'+
      'html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-page-root-v28[data-menu] [data-perso-input-rangee] button.perso-edit-v1:not(#_):not(#_){opacity:1;font-size:26px!important;line-height:1!important;padding:0!important}'+
      'html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-page-root-v28[data-menu] [data-perso-input-rangee] button:not(#_):not(#_){white-space:nowrap!important;letter-spacing:0!important;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;gap:1px}html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-page-root-v28[data-menu] [data-perso-input-rangee] button .nb-suf{display:inline!important}'+
      '.perso-modal-champ-v1{display:block;width:100%;box-sizing:border-box;margin:14px 0 0;padding:13px 14px;border-radius:13px;border:1px solid rgba(184,164,255,.38);background:#0f1626;color:#f5f1ff;font:inherit;font-size:22px;font-weight:1000;text-align:center;outline:none}'+
      '.perso-modal-champ-v1:focus{border-color:#b8a4ff;box-shadow:0 0 0 3px rgba(139,104,214,.35)}'+
      '.perso-modal-erreur-v1{min-height:20px;margin-top:8px;color:#ff9a9a;font-size:13px;font-weight:800;text-align:center}';
    (document.head||document.documentElement).appendChild(style);
  }

  /* ----- Resource 3 Name Randomizer : nom courant de la ressource 3 et réglage à cocher ----- */
  function nomR3(){
    var j=etat_();
    var n=j&&j.systemes&&typeof j.systemes.r3Nom==='string'?j.systemes.r3Nom:'';
    return n;
  }
  function blocReglageR3(){
    var j=etat_();
    if(!j||!j.systemes||!j.systemes.r3NomDisponible)return '';
    var actif=Boolean(nomR3());
    var h=window.__SOREAL_IDLE_META_HOST_V130__;
    var nom=nomR3();
    return '<div class="soreal-idle-section-v8" id="sorealIdleR3NomReglageV1">'+
      '<div class="soreal-idle-window-title-v31">🧪 Nom de la ressource 3</div>'+
      '<label style="display:flex;align-items:center;gap:10px;cursor:pointer"><input type="checkbox" '+(actif?'checked ':'')+'onchange="window.__SOREAL_IDLE_PERSO_PCT_V1__.reglerNomR3(this.checked)"> '+
      'Changer le nom de la ressource 3 au hasard à chaque Rebirth</label>'+
      (actif&&nom?'<div style="margin-top:6px;opacity:.85">Nom actuel : <b>'+(h&&h.idleHtml_?h.idleHtml_(nom):nom)+'</b></div>':'')+
    '</div>';
  }
  function reglerNomR3(actif){
    var f=window.__actionMetaIdleV130__;
    if(typeof f==='function')f({action:'setR3NomAleatoire',enabled:Boolean(actif)});
  }

  window.__SOREAL_IDLE_PERSO_PCT_V1__={nomR3:nomR3,blocReglageR3:blocReglageR3,reglerNomR3:reglerNomR3,valeurInput:valeurInput,definirInput:definirInput,editerInput:editerInput,appliquerInput:appliquerInput,pourcentage:pourcentage,definir:definir,editer:editer,appliquer:appliquer,decorer:decorer,pourcentNgu:pourcentNgu_,
    /* Outils de test */
    slots:SLOTS,decorerCadre:decorerCadre_};
  planifier_();
})();
