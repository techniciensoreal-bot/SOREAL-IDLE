/*
 * SOREAL IDLE — briques d'interface communes aux éditeurs de voix (Norman, 2026-10-08) : l'éditeur de textes (modules/textes-admin-v1.js) et l'éditeur d'histoires plein écran (modules/admin-histoires-v1.js)
 * partagent ici ce qui fait le « menu de création des voix » : les puces de voix et d'expression, le choix d'une voix APRÈS l'avoir écoutée, les pauses, l'état du studio.
 *
 *  - Une voix a une couleur et une initiale (un personnage se reconnaît d'un coup d'œil dans une liste de bulles).
 *  - Choisir une voix ou une expression ouvre une fenêtre avec un bouton « Écouter » sur chaque ligne : l'essai envoie une phrase courte au studio de voix local (Chatterbox) avec la voix et l'expression
 *    voulues ; le son est gardé en mémoire (un second essai est instantané). Sans studio lancé, un message dit quoi faire.
 *  - Une pause s'insère à l'endroit du curseur sous forme de balise « (pause 2s) » : ni lue ni affichée, c'est un silence (modules/voix-expressions-v1.js).
 *
 *   window.__SOREAL_IDLE_VOIX_UI_V1__ = { couleurVoix, infoVoix, initialeVoix, exprListe, infoExpr, pausesListe, voixProposees, puceStudioHtml, chipsHtml, pauseBoutonHtml, pausesHtml,
 *     activer(racine, {surChoix(type,cle)}), ouvrirSelecteur({racine,type,ligne,outils,apres}), fermerSelecteur(), insererPause(textarea,balise), appliquerAuxPuces(cadre,ligne) }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_VOIX_UI_V1__)return;

var STYLE_ID='sorealIdleVoixUiStyleV1';

function esc_(v){
  return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function parleurUi_(v){return v==='homme'||!v?'narrateur':v;}

/* ---------- voix : couleur, nom, initiale ---------- */
var PALETTE=['#5b8cff','#f472b6','#34d399','#fbbf24','#a78bfa','#fb7185','#22d3ee','#fb923c','#84cc16','#e879f9','#38bdf8','#f97316','#2dd4bf','#c084fc'];
function registreVoix_(){
  var reg=window.__SOREAL_IDLE_VOIX_NOMMEES_V1__;
  return reg&&Array.isArray(reg.liste)?reg.liste:[];
}
function couleurVoix(id){
  id=parleurUi_(id);
  if(id==='narrateur')return PALETTE[0];
  if(id==='femme')return PALETTE[1];
  /* Une couleur par voix nommée, dans l'ordre du registre : jamais deux voix du registre de la même couleur. */
  var rang=-1;
  registreVoix_().forEach(function(v,i){if(v.id===id)rang=i;});
  if(rang<0){rang=0;for(var i=0;i<id.length;i+=1)rang=(rang*31+id.charCodeAt(i))>>>0;}
  return PALETTE[2+rang%(PALETTE.length-2)];
}
function infoVoix(id){
  id=parleurUi_(id);
  if(id==='narrateur')return {id:id,nom:'Narrateur',desc:'Voix d’homme, la voix par défaut'};
  if(id==='femme')return {id:id,nom:'Femme',desc:'Voix de femme'};
  var v=registreVoix_().filter(function(x){return x.id===id;})[0];
  return v?{id:id,nom:v.nom,desc:v.genre==='femme'?'Voix de femme':'Voix d’homme'}:{id:id,nom:id,desc:''};
}
function initialeVoix(id){return String(infoVoix(id).nom).charAt(0).toUpperCase();}
/* Voix proposées : narrateur, femme, puis les voix nommées du registre. */
function voixProposees(){
  return ['narrateur','femme'].concat(registreVoix_().map(function(v){return v.id;}));
}

/* ---------- expressions et pauses ---------- */
function registreExpr_(){return window.__SOREAL_IDLE_EXPRESSIONS_V1__||null;}
function exprListe(){
  var r=registreExpr_();
  return r&&Array.isArray(r.liste)?r.liste:[{id:'neutre',nom:'Neutre',emoji:'🙂',aide:''}];
}
function infoExpr(id){
  var l=exprListe(),cible=id||'neutre';
  for(var i=0;i<l.length;i+=1)if(l[i].id===cible)return l[i];
  return l[0];
}
function pausesListe(){
  var r=registreExpr_();
  return r&&Array.isArray(r.pauses)?r.pauses:[{nom:'Normale',tag:'(pause)',ms:1000}];
}

/* ---------- style ---------- */
function installerStyle_(){
  if(document.getElementById(STYLE_ID))return;
  var s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=
    '.vu-av{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;flex:0 0 30px;background:var(--vu-c,#5b8cff);color:#071022;font:900 15px/1 system-ui,sans-serif}'+
    '.vu-chip{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:4px 12px 4px 5px;border-radius:999px;border:1.5px solid #3a4b73;background:#16213a;color:#e8eefc;font:700 14px/1 system-ui,sans-serif;cursor:pointer}'+
    '.vu-chip.vu-expr{padding-left:12px}'+
    '.vu-fleche{opacity:.6;font-size:12px}'+
    '.vu-pastille{display:inline-flex;align-items:center;gap:6px;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:800;background:rgba(255,255,255,.08);color:#b8c7ea;white-space:nowrap}'+
    '.vu-pastille.ok{background:rgba(74,222,128,.16);color:#86efac}'+
    '.vu-pastille.ko{background:rgba(255,120,120,.14);color:#ffb4b4}'+
    '.vu-pauses{display:none;gap:6px;flex-wrap:wrap;margin-top:8px;padding:8px;border-radius:12px;background:#0a1020;border:1px dashed #3a4b73}'+
    '.vu-ouvert>.vu-pauses,.vu-ouvert .vu-pauses{display:flex}'+
    '.vu-btn{min-height:38px;padding:6px 12px;border-radius:10px;border:1.5px solid #4b5d85;background:#1b2538;color:#e8eefc;font:700 13px/1 system-ui,sans-serif;cursor:pointer}'+
    '.vu-btn.actif{border-color:#7ab8ff;background:#1d3358}'+
    '.vu-icone{min-width:42px;min-height:42px;padding:0;font-size:18px;border-radius:12px;border:1.5px solid #4b5d85;background:#1b2538;color:#e8eefc;cursor:pointer}'+
    '.vu-sel{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:rgba(3,6,12,.72);padding:14px;font:500 15px/1.5 system-ui,sans-serif;color:#e8eefc}'+
    '.vu-sel-carte{width:min(480px,100%);max-height:88vh;overflow:auto;background:#10151f;border:1.5px solid #4b5d85;border-radius:18px;padding:14px}'+
    '.vu-sel-tete{display:flex;align-items:center;gap:8px;margin-bottom:6px}'+
    '.vu-sel-tete h4{margin:0;flex:1;font-size:16px}'+
    '.vu-sel-aide{font-size:13px;color:#8fa0c4;margin:4px 0}'+
    '.vu-sel-ligne{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:14px;border:1.5px solid #2e3d5f;margin:6px 0;background:#0e1626;cursor:pointer}'+
    '.vu-sel-ligne.actif{border-color:#7ab8ff;background:#13203b}'+
    '.vu-sel-nom{flex:1;min-width:0;display:grid;gap:2px}'+
    '.vu-sel-nom small{color:#8fa0c4;font-size:12px}'+
    '.vu-sel-emoji{width:30px;height:30px;flex:0 0 30px;display:grid;place-items:center;font-size:22px}'+
    '.vu-sel-msg{font-size:13px;margin:6px 0;min-height:18px;color:#c9d4ee}'+
    '.vu-sel-msg.erreur{color:#ffb4b4}';
  document.head.appendChild(s);
}

/* ---------- morceaux de HTML ---------- */
function puceStudioHtml(ok,id){
  var attr=id?' id="'+esc_(id)+'"':'';
  return ok===true?'<span class="vu-pastille ok"'+attr+'>🟢 Studio prêt</span>'
    :(ok===false?'<span class="vu-pastille ko"'+attr+'>🔴 Studio éteint</span>':'<span class="vu-pastille"'+attr+'>… Studio</span>');
}
/* Les deux puces d'une bulle : la voix (avatar coloré + nom) et l'expression (emoji + nom). cle : identifiant de la bulle, rendu dans data-vu-cle. */
function chipsHtml(cle,l){
  var v=infoVoix(l&&l.parleur),e=infoExpr(l&&l.expr);
  return '<button type="button" class="vu-chip" data-vu-pick="voix" data-vu-cle="'+esc_(cle)+'" title="Choisir la voix (tu peux l’écouter avant)"><span class="vu-av">'+esc_(initialeVoix(l&&l.parleur))+'</span><span data-vu-nomvoix>'+esc_(v.nom)+'</span><span class="vu-fleche">▾</span></button>'+
    '<button type="button" class="vu-chip vu-expr" data-vu-pick="expr" data-vu-cle="'+esc_(cle)+'" title="Choisir l’expression"><span data-vu-emojiexpr>'+e.emoji+'</span><span data-vu-nomexpr>'+esc_(e.nom)+'</span><span class="vu-fleche">▾</span></button>';
}
function pauseBoutonHtml(cle,classe){
  return '<button type="button" class="'+esc_(classe||'vu-btn')+'" data-vu-pausebtn="'+esc_(cle)+'" title="Insérer un arrêt, à l’endroit du curseur">⏸ Pause</button>';
}
function pausesHtml(cle,classe){
  return '<div class="vu-pauses" data-vu-pauses="'+esc_(cle)+'">'+pausesListe().map(function(pz){
    return '<button type="button" class="'+esc_(classe||'vu-btn')+'" data-vu-pause="'+esc_(pz.tag)+'" data-vu-cle="'+esc_(cle)+'" title="Insère '+esc_(pz.tag)+'">⏸ '+esc_(pz.nom)+'</button>';
  }).join('')+'</div>';
}
/* Après un choix : la bulle prend la couleur, l'initiale et les noms de sa voix et de son expression. */
function appliquerAuxPuces(cadre,l){
  if(!cadre)return;
  cadre.style.setProperty('--vu-c',couleurVoix(l.parleur));
  cadre.style.setProperty('--stx-c',couleurVoix(l.parleur));
  var av=cadre.querySelector('.vu-av');if(av)av.textContent=initialeVoix(l.parleur);
  var nv=cadre.querySelector('[data-vu-nomvoix]');if(nv)nv.textContent=infoVoix(l.parleur).nom;
  var ee=cadre.querySelector('[data-vu-emojiexpr]');if(ee)ee.textContent=infoExpr(l.expr).emoji;
  var ne=cadre.querySelector('[data-vu-nomexpr]');if(ne)ne.textContent=infoExpr(l.expr).nom;
}

/* ---------- pause à l'endroit du curseur ---------- */
function insererPause(ta,balise){
  if(!ta)return;
  var debut=typeof ta.selectionStart==='number'?ta.selectionStart:ta.value.length;
  var fin=typeof ta.selectionEnd==='number'?ta.selectionEnd:debut;
  var avant=ta.value.slice(0,debut),apres=ta.value.slice(fin);
  var ins=(avant&&!/\s$/.test(avant)?' ':'')+balise+' ';
  ta.value=avant+ins+apres;
  var pos=(avant+ins).length;
  try{ta.focus();ta.setSelectionRange(pos,pos);}catch(_e){}
  ta.dispatchEvent(new Event('input',{bubbles:true}));
}

/* ---------- écoute d'une voix avant de la choisir ---------- */
var selecteurEl=null;
var contexte=null;                 // {racine,type,ligne,outils,apres}
var essais={};                     // voix|expression -> adresse du son déjà généré
var essaiEnCours={audio:null,cle:'',bouton:null};

function arreterEssai_(){
  var e=essaiEnCours;
  essaiEnCours={audio:null,cle:'',bouton:null};
  if(e.audio){try{e.audio.onended=null;e.audio.pause();}catch(_e){}}
  if(e.bouton){e.bouton.textContent='▶ Écouter';e.bouton.classList.remove('actif');}
}
function message_(texte,erreur){
  var m=selecteurEl&&selecteurEl.querySelector('.vu-sel-msg');
  if(!m)return;
  m.className='vu-sel-msg'+(erreur?' erreur':'');
  m.innerHTML=texte;
}
function essayer_(voixId,exprId,bouton){
  var cle=voixId+'|'+(exprId||'');
  if(essaiEnCours.cle===cle){arreterEssai_();return;}
  arreterEssai_();
  var o=contexte&&contexte.outils;
  if(!o||typeof o.synthetiserBrut!=='function'){message_('Outils de voix indisponibles (module Admin non chargé).',true);return;}
  essaiEnCours={audio:null,cle:cle,bouton:bouton};
  bouton.textContent='⏳ …';
  message_('');
  var r=registreExpr_();
  var phrase=r&&r.phraseEssai?r.phraseEssai:'Bonjour, voici ma voix.';
  var pret=essais[cle]?Promise.resolve(essais[cle]):o.synthetiserBrut(phrase,voixId,exprId).then(function(blob){
    var url=URL.createObjectURL(blob);
    essais[cle]=url;
    return url;
  });
  pret.then(function(url){
    if(essaiEnCours.cle!==cle)return null;
    var a=new Audio(url);
    essaiEnCours.audio=a;
    bouton.textContent='⏹ Arrêter';
    bouton.classList.add('actif');
    a.onended=function(){if(essaiEnCours.cle===cle)arreterEssai_();};
    return a.play();
  }).catch(function(e){
    if(essaiEnCours.cle!==cle)return;
    arreterEssai_();
    var injoignable=!e||/Failed to fetch|NetworkError|Load failed|fetch/i.test(String(e.message||e));
    message_(injoignable
      ?'Le studio de voix n’est pas lancé sur ce PC. <button type="button" class="vu-btn" data-vu-studio="1">🚀 Lancer le studio</button> puis réessaie dans quelques secondes.'
      :esc_('Essai impossible : '+(e&&e.message?e.message:e)),true);
  });
}

function selecteurHtml_(type,l){
  var tete='<div class="vu-sel-tete"><h4>'+(type==='voix'?'Choisis la voix':'Choisis l’expression')+'</h4><button type="button" class="vu-icone" data-vu-fermer="1" title="Fermer">✕</button></div>';
  var aide='<div class="vu-sel-aide">'+(type==='voix'?'Appuie sur « Écouter » pour entendre une voix avant de la choisir.':'Appuie sur « Écouter » pour entendre cette expression avec la voix de ce personnage.')+'</div>';
  var lignes='';
  if(type==='voix'){
    lignes=voixProposees().map(function(id){
      var v=infoVoix(id),actif=parleurUi_(l.parleur)===id;
      return '<div class="vu-sel-ligne'+(actif?' actif':'')+'" data-vu-choisir="'+esc_(id)+'" style="--vu-c:'+couleurVoix(id)+'" role="button" tabindex="0">'+
        '<span class="vu-av">'+esc_(initialeVoix(id))+'</span>'+
        '<span class="vu-sel-nom"><b>'+esc_(v.nom)+(actif?' ✓':'')+'</b><small>'+esc_(v.desc)+'</small></span>'+
        '<button type="button" class="vu-btn" data-vu-essai="'+esc_(id)+'" data-vu-expr="'+esc_(l.expr||'')+'">▶ Écouter</button></div>';
    }).join('');
  }else{
    lignes=exprListe().map(function(e){
      var actif=(l.expr||'neutre')===e.id;
      return '<div class="vu-sel-ligne'+(actif?' actif':'')+'" data-vu-choisir="'+esc_(e.id)+'" role="button" tabindex="0">'+
        '<span class="vu-sel-emoji">'+e.emoji+'</span>'+
        '<span class="vu-sel-nom"><b>'+esc_(e.nom)+(actif?' ✓':'')+'</b><small>'+esc_(e.aide||'')+'</small></span>'+
        '<button type="button" class="vu-btn" data-vu-essai="'+esc_(parleurUi_(l.parleur))+'" data-vu-expr="'+esc_(e.id==='neutre'?'':e.id)+'">▶ Écouter</button></div>';
    }).join('');
  }
  return '<div class="vu-sel-carte">'+tete+aide+'<div class="vu-sel-msg"></div>'+lignes+'</div>';
}
function fermerSelecteur(){
  arreterEssai_();
  if(selecteurEl)selecteurEl.remove();
  selecteurEl=null;
  contexte=null;
}
function choisir_(valeur){
  var c=contexte;
  fermerSelecteur();
  if(c&&typeof c.apres==='function')c.apres(valeur);
}
/* Ouvre le sélecteur de voix ou d'expression dans la racine de l'éditeur. ligne : {parleur,expr} courants ; outils : {synthetiserBrut(texte,voix,expr)} ; apres(valeur) : appelé au choix. */
function ouvrirSelecteur(opts){
  fermerSelecteur();
  if(!opts||!opts.racine)return;
  installerStyle_();
  contexte=opts;
  var el=document.createElement('div');
  el.className='vu-sel';
  el.innerHTML=selecteurHtml_(opts.type,opts.ligne||{});
  opts.racine.appendChild(el);
  selecteurEl=el;
  el.addEventListener('click',function(ev){
    ev.stopPropagation();
    var t=ev.target;
    var essai=t.closest&&t.closest('[data-vu-essai]');
    if(essai){essayer_(essai.getAttribute('data-vu-essai'),essai.getAttribute('data-vu-expr')||'',essai);return;}
    var studio=t.closest&&t.closest('[data-vu-studio]');
    if(studio){
      var pilote=window.__SOREAL_IDLE_STUDIO_PILOTE_V1__;
      if(!pilote||typeof pilote.lancer!=='function'){message_('Module du pilote absent : recharge la page.',true);return;}
      pilote.lancer(function(texte,erreur){message_(esc_(texte||''),Boolean(erreur));},function(){});
      return;
    }
    var choix=t.closest&&t.closest('[data-vu-choisir]');
    if(choix){choisir_(choix.getAttribute('data-vu-choisir'));return;}
    if((t.closest&&t.closest('[data-vu-fermer]'))||t===el){fermerSelecteur();}
  });
  el.addEventListener('keydown',function(ev){
    if(ev.key!=='Enter'&&ev.key!==' ')return;
    var ligne=ev.target&&ev.target.closest?ev.target.closest('[data-vu-choisir]'):null;
    if(ligne&&ev.target===ligne){ev.preventDefault();choisir_(ligne.getAttribute('data-vu-choisir'));}
  });
}

/*
 * Câblage d'un éditeur : un seul écouteur sur sa racine pour les puces (ouvrent le sélecteur), le bouton Pause (déplie la rangée de pauses) et les pauses (insèrent la balise dans le texte de la bulle).
 * rappels.surChoix(type, cle) : l'éditeur ouvre alors son sélecteur ; rappels.texteDe(cle) : le textarea de la bulle.
 */
function activer(racine,rappels){
  if(!racine||racine.__vuActif)return;
  racine.__vuActif=true;
  installerStyle_();
  racine.addEventListener('click',function(ev){
    var t=ev.target;
    var pk=t.closest&&t.closest('[data-vu-pick]');
    if(pk){ev.stopPropagation();if(rappels&&typeof rappels.surChoix==='function')rappels.surChoix(pk.getAttribute('data-vu-pick'),pk.getAttribute('data-vu-cle'));return;}
    var pb=t.closest&&t.closest('[data-vu-pausebtn]');
    if(pb){ev.stopPropagation();var cp=pb.closest('[data-vu-bulle]');if(cp)cp.classList.toggle('vu-ouvert');return;}
    var pz=t.closest&&t.closest('[data-vu-pause]');
    if(pz){
      ev.stopPropagation();
      var cle=pz.getAttribute('data-vu-cle');
      var ta=rappels&&typeof rappels.texteDe==='function'?rappels.texteDe(cle):null;
      insererPause(ta,pz.getAttribute('data-vu-pause'));
      var bulle=pz.closest('[data-vu-bulle]');
      if(bulle)bulle.classList.remove('vu-ouvert');
    }
  });
}

window.__SOREAL_IDLE_VOIX_UI_V1__={
  couleurVoix:couleurVoix,infoVoix:infoVoix,initialeVoix:initialeVoix,exprListe:exprListe,infoExpr:infoExpr,pausesListe:pausesListe,voixProposees:voixProposees,
  puceStudioHtml:puceStudioHtml,chipsHtml:chipsHtml,pauseBoutonHtml:pauseBoutonHtml,pausesHtml:pausesHtml,appliquerAuxPuces:appliquerAuxPuces,
  activer:activer,ouvrirSelecteur:ouvrirSelecteur,fermerSelecteur:fermerSelecteur,insererPause:insererPause,
  installerStyle:installerStyle_
};
})();
