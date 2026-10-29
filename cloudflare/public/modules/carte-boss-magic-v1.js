/*
 * SOREAL IDLE — carte de boss « façon carte à collectionner » (Norman, 2026-10-28 : « quand on ouvre une carte de boss, elle ressemble exactement à ça, avec les infos liées au boss »).
 * Mise en page copiée d'une carte de jeu de cartes : cadre noir, bandeau du nom avec pastilles à droite, illustration, ligne de type avec emblème, cadre de texte (capacités, puis récit en italique),
 * ligne de collection en bas et case attaque / vie dans le coin. Les données sont celles d'un boss DÉJÀ découvert (règle anti-spoil n°2) : ce module ne lit rien d'autre que ce qu'on lui donne.
 * Couleur du cadre (Norman, même jour : « différentes suivant ce qu'il y a dessus ») : elle suit l'ILLUSTRATION du boss, comme les couleurs d'une carte de jeu — bleu, rouge, vert, noir, blanc, ou or quand deux couleurs
 * dominent (analyse de l'image à son chargement, mémorisée par boss). Un tap sur l'illustration retourne la carte : dos de carte avec le titre du jeu sur deux lignes ; un tap remet l'endroit.
 * Partagé par la chronique du boss (page Combat, ui-combat-1-v1.js) et la fiche de la Collection (ui-combat-2-v1.js). Style : soreal-idle-carte-boss.css.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_CARTE_BOSS_MAGIC_V1__)return;

function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function nb(n){
  var REG=window.__SOREAL_IDLE_REG__||{};
  var v=Number(n)||0;
  return typeof REG.formatGrandNombreIdleV70_==='function'?REG.formatGrandNombreIdleV70_(v):String(Math.floor(v));
}
function pad4(n){var s=String(Math.max(0,Math.floor(Number(n)||0)));while(s.length<4)s='0'+s;return s;}

/* Couleurs : 0 bleu, 1 rouge, 2 vert, 3 noir, 4 blanc, 5 or (deux couleurs). Repli avant l'analyse de l'image (ou si elle est impossible) : une couleur par monde. */
function couleurMonde(monde){var m=Math.max(1,Math.floor(Number(monde)||1));return (m-1)%5;}
var couleurs={};      /* numéro du boss -> couleur déduite de son illustration */
var retournees={};    /* numéro du boss -> carte retournée (survit au redessin de la page ; remis à zéro à la fermeture) */

/* Couleur dominante d'une illustration : chaque pixel est pesé par sa saturation et sa luminosité, par famille de teintes. */
function analyser(img){
  var c=document.createElement('canvas');c.width=c.height=48;
  var g=c.getContext('2d',{willReadFrequently:true});
  g.drawImage(img,0,0,48,48);
  var d=g.getImageData(0,0,48,48).data;
  var poids=[0,0,0,0,0],lum=0,n=0;      /* poids : bleu, rouge, vert, violet (noir), jaune (blanc) */
  for(var i=0;i<d.length;i+=4){
    if(d[i+3]<128)continue;
    var r=d[i]/255,gg=d[i+1]/255,b=d[i+2]/255;
    var mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),dl=mx-mn;
    var v=mx,s=mx?dl/mx:0,h=0;
    if(dl){
      if(mx===r)h=((gg-b)/dl+6)%6;else if(mx===gg)h=(b-r)/dl+2;else h=(r-gg)/dl+4;
      h*=60;
    }
    lum+=v;n+=1;
    if(s<.22||v<.18)continue;
    var w=s*v;
    if(h<18||h>=345)poids[1]+=w;
    else if(h<70)poids[4]+=w;
    else if(h<170)poids[2]+=w;
    else if(h<255)poids[0]+=w;
    else poids[3]+=w;
  }
  if(!n)return null;
  var moy=lum/n,total=poids[0]+poids[1]+poids[2]+poids[3]+poids[4];
  if(moy<.3||total<n*.05)return moy>.62?4:3;       /* sombre ou presque sans couleur : noir ; clair sans couleur : blanc */
  var ordre=[0,1,2,3,4].sort(function(a,b){return poids[b]-poids[a];});
  var p1=poids[ordre[0]],p2=poids[ordre[1]];
  /* or : deux familles de couleurs nettes (la seconde pèse au moins 70 % de la première) */
  if(p2>=p1*.7&&p2>=total*.28)return 5;
  return ordre[0];
}

function appliquer(numero,couleur){
  couleurs[numero]=couleur;
  var cartes=document.querySelectorAll('.carte-mtg-v1[data-numero="'+numero+'"]');
  for(var i=0;i<cartes.length;i++)cartes[i].setAttribute('data-couleur',String(couleur));
}
/* Appelé par l'illustration à son chargement (attribut onload). */
function colorier(img){
  try{
    var carte=img&&img.closest?img.closest('.carte-mtg-v1'):null;
    if(!carte)return;
    var numero=carte.getAttribute('data-numero');
    if(couleurs[numero]!=null){carte.setAttribute('data-couleur',String(couleurs[numero]));return;}
    var c=analyser(img);
    if(c!=null)appliquer(numero,c);
  }catch(_e){/* image d'une autre origine ou canvas indisponible : la couleur du monde reste */}
}

/*
 * Cartes voisines (Norman, 2026-10-28 : flèches à gauche et à droite d'une carte ouverte) : seulement des boss DÉJÀ découverts (ceux que la Collection sait ouvrir), jamais le suivant d'un boss inconnu.
 */
function voisinsDe(numero){
  var REG=window.__SOREAL_IDLE_REG__||{};
  var e=REG.idleEtat&&REG.idleEtat.bestiaire&&Array.isArray(REG.idleEtat.bestiaire.entrees)?REG.idleEtat.bestiaire.entrees:[];
  var prec=0,suiv=0;
  for(var i=0;i<e.length;i++){
    var x=e[i];
    if(!x||x.source!=='boss'||!x.decouvert)continue;
    var n=Math.floor(Number(x.numero)||0);
    if(n<numero&&n>prec)prec=n;
    if(n>numero&&(!suiv||n<suiv))suiv=n;
  }
  return {prec:prec,suiv:suiv};
}
var CHEVRON_G='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var CHEVRON_D='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function fleches(numero){
  var v=voisinsDe(numero);
  return (v.prec?'<button type="button" class="mtg-fleche mtg-fleche-prec" data-mtg-aller="'+v.prec+'" aria-label="Boss précédent" data-soreal-tts-ignore>'+CHEVRON_G+'</button>':'')+
    (v.suiv?'<button type="button" class="mtg-fleche mtg-fleche-suiv" data-mtg-aller="'+v.suiv+'" aria-label="Boss suivant" data-soreal-tts-ignore>'+CHEVRON_D+'</button>':'');
}
/* Ouvre la fiche du boss voisin : la chronique accrochée au mur se referme, la fiche (même carte) prend le relais et porte à son tour les flèches. */
function aller(numero){
  var n=Math.floor(Number(numero)||0);
  if(!n)return;
  if(typeof window.__ouvrirChroniqueIdleV1__==='function'&&document.querySelector('.soreal-idle-boss-lore-v142.ouverte'))window.__ouvrirChroniqueIdleV1__(false);
  if(typeof window.__ouvrirBossCollectionIdleV1__==='function')window.__ouvrirBossCollectionIdleV1__(n);
}

/* Emblème de l'extension (en bas à droite de la ligne de type) : petit écusson SOREAL. */
var EMBLEME='<svg class="mtg-embleme" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 21 6v6c0 5-4 8.5-9 10C7 20.5 3 17 3 12V6z" fill="#1b1b22" stroke="#e9d9a2" stroke-width="1.6"/><path d="M12 6.5l1.8 3.8 4.1.5-3 2.8.8 4.1L12 15.6 8.3 17.7l.8-4.1-3-2.8 4.1-.5z" fill="#e9d9a2"/></svg>';

/* Dos de carte : cadre doré, ovale brun bordé de bleu, titre du jeu sur deux lignes (lettres bleues à contour brun-rouge) et les cinq billes de couleur. Rien d'autre : pas de photo du boss (Norman, 2026-10-28). Le dos est l'image idle/backgrounds/MagicCardBack.webp (R2, route /api/idle/media/card-back) pour TOUTES les cartes ; ce dessin ne sert que de repli tant qu'elle manque. */
function dos(o){
  var lettres='font-family="Bangers,Impact,sans-serif" font-size="92" text-anchor="middle" fill="url(#mtgBleu)" stroke="#5b1d12" stroke-width="9" stroke-linejoin="round" paint-order="stroke fill" letter-spacing="3"';
  return '<div class="mtg-dos" data-soreal-tts-ignore>'+
    '<img class="mtg-dos-image" src="/api/idle/media/card-back" alt="" data-sans-traduction onerror="this.style.display=\'none\'">'+
    '<div class="mtg-dos-ovale">'+
      '<svg class="mtg-dos-titre" viewBox="0 0 340 215" aria-hidden="true" data-sans-traduction>'+
        '<defs><linearGradient id="mtgBleu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd0f2"/><stop offset=".5" stop-color="#4a8fd0"/><stop offset="1" stop-color="#2a63a8"/></linearGradient></defs>'+
        '<g transform="rotate(-4 170 100)"><text x="170" y="92" '+lettres+'>SOREAL</text><text x="170" y="190" '+lettres+'>IDLE</text></g>'+
      '</svg>'+
      '<div class="mtg-dos-orbes" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b></div>'+
      '<div class="mtg-dos-billes" aria-hidden="true"><i></i><i></i><i></i><i></i></div>'+
    '</div>'+
  '</div>';
}

/*
 * o : { numero, nom, monde, ordre, pv, attaque, xp, rencontres, capacites:[texte], notesHtml, histoireHtml, boutonsHtml, adminHtml, image }
 *   notesHtml / histoireHtml : HTML déjà prêt (le module appelant garde ses attributs de lecture vocale) ; boutonsHtml : boutons placés au bas du cadre de texte.
 */
function html(o){
  o=o||{};
  var pip=function(n){return '<span class="mtg-pastille">'+esc(n)+'</span>';};
  var pastilles=(o.monde?pip(o.monde):'')+(o.ordre?pip(o.ordre):'');
  var lignes='';
  function ligne(badge,texte){lignes+='<div class="mtg-capacite"><span class="mtg-badge">'+esc(badge)+'</span><span class="mtg-capacite-texte">'+texte+'</span></div>';}
  /* attaque et vie sont dans la case du coin (comme force / endurance sur une carte de jeu) : pas répétées dans le texte */
  if(Number(o.xp)>0)ligne('EXP',esc(nb(o.xp)));
  (Array.isArray(o.capacites)?o.capacites:[]).forEach(function(c){if(String(c||'').trim())ligne('★',esc(c));});
  var rencontres=Number(o.rencontres)>0?'<div class="mtg-rencontres">'+esc(Math.floor(o.rencontres))+' <span>'+(o.rencontres>1?'rencontres':'rencontre')+'</span></div>':'';
  var image=o.image?'<img src="'+esc(o.image)+'" alt="'+esc(o.nom||'Boss')+'" loading="lazy" onload="window.__SOREAL_IDLE_CARTE_BOSS_MAGIC_V1__.colorier(this)" onerror="this.style.display=\'none\'">':'';
  var force=Number(o.attaque)>0||Number(o.pv)>0
    ?'<div class="mtg-force"><span>'+esc(nb(o.attaque))+'</span><i>/</i><span>'+esc(nb(o.pv))+'</span></div>':'';
  var numero=Math.floor(Number(o.numero)||0);
  var couleur=couleurs[numero]!=null?couleurs[numero]:couleurMonde(o.monde);
  return fleches(numero)+'<div class="carte-mtg-v1'+(retournees[numero]?' retournee':'')+'" data-numero="'+numero+'" data-couleur="'+couleur+'">'+
    '<div class="mtg-avant">'+
    '<div class="mtg-cadre">'+
      '<div class="mtg-titre"><div class="soreal-idle-boss-lore-name-v184 mtg-nom" data-soreal-tts-pause="1100">'+esc(o.nom||'Boss')+'</div><div class="mtg-pastilles" data-soreal-tts-ignore>'+pastilles+'</div></div>'+
      '<div class="mtg-art" data-soreal-tts-ignore>'+image+'</div>'+
      '<div class="mtg-type" data-soreal-tts-ignore><span class="mtg-type-texte"><span>Boss légendaire</span>'+(o.monde?' — <span>Monde</span> '+esc(o.monde):'')+'</span>'+EMBLEME+'</div>'+
      '<div class="mtg-texte">'+
        (o.notesHtml||'')+
        (lignes?'<div class="mtg-capacites" data-soreal-tts-ignore>'+lignes+'</div>':'')+
        (o.histoireHtml?'<div class="mtg-filet" data-soreal-tts-ignore></div>'+o.histoireHtml:'')+
        '<div class="mtg-boutons">'+(o.boutonsHtml||'')+'</div>'+
        (o.adminHtml?'<div class="mtg-admin">'+o.adminHtml+'</div>':'')+
      '</div>'+
      '<div class="mtg-bas" data-soreal-tts-ignore><span data-sans-traduction>B '+esc(pad4(o.numero))+' · FR</span><span data-sans-traduction>SOREAL NGU IDLE</span>'+rencontres+'</div>'+
    '</div>'+
    force+
    '</div>'+
    dos(o)+
  '</div>';
}

/* Un tap sur l'illustration retourne la carte ; un tap sur le dos la remet à l'endroit. Le reste de la carte (boutons, texte) garde son comportement. */
document.addEventListener('click',function(e){
  var cible=e.target;
  if(!cible||!cible.closest)return;
  if(Date.now()-apresGlisse<350)return;   /* le « click » qui suit une rotation ne retourne pas la carte en plus */
  var fleche=cible.closest('.mtg-fleche');
  if(fleche){for(var f in retournees)delete retournees[f];aller(fleche.getAttribute('data-mtg-aller'));return;}
  var carte=cible.closest('.carte-mtg-v1');
  if(!carte){
    for(var k in retournees)delete retournees[k];       /* clic ailleurs : la chronique / la fiche se ferme, la prochaine carte sera à l'endroit */
    return;
  }
  var numero=carte.getAttribute('data-numero');
  var retournee=carte.classList.contains('retournee');
  if(retournee||cible.closest('.mtg-art')){
    retournee=!retournee;
    carte.classList.toggle('retournee',retournee);
    if(retournee)retournees[numero]=true;else delete retournees[numero];
  }
});
/*
 * Faire tourner la carte (Norman, 2026-10-29 : « zoomée sur l'écran pour qu'on puisse lire et la faire tourner ») : dans la fiche zoomée, on la saisit au doigt ou à la souris et on la fait pivoter à volonté (autour de l'axe vertical, avec un léger penchement) ;
 * au relâchement elle termine son demi-tour jusqu'à la face la plus proche (avant ou dos). Un simple tap garde son effet (retourner par l'illustration). Le défilement vertical du texte reste possible (touch-action: pan-y).
 */
var glisse=null,apresGlisse=0;
document.addEventListener('pointerdown',function(e){
  var cible=e.target;if(!cible||!cible.closest||(e.pointerType==='mouse'&&e.button!==0))return;
  var carte=cible.closest('.mtg-modal-v1 .carte-mtg-v1');
  if(!carte||cible.closest('button,a,input,textarea,select,.mtg-fleche'))return;
  glisse={carte:carte,x:e.clientX,y:e.clientY,base:carte.classList.contains('retournee')?180:0,angle:null,id:e.pointerId};
},true);
document.addEventListener('pointermove',function(e){
  if(!glisse||e.pointerId!==glisse.id)return;
  var dx=e.clientX-glisse.x,dy=e.clientY-glisse.y;
  if(glisse.angle===null){
    if(Math.abs(dx)<10||Math.abs(dx)<Math.abs(dy))return;   /* un défilement vertical n'est pas un geste de rotation */
    glisse.carte.style.transition='none';
    try{glisse.carte.setPointerCapture(glisse.id);}catch(_e){}
  }
  glisse.angle=glisse.base+dx*0.7;
  var pench=Math.max(-14,Math.min(14,-dy*0.12));
  glisse.carte.style.transform='rotateX('+pench.toFixed(1)+'deg) rotateY('+glisse.angle.toFixed(1)+'deg)';
},true);
function finGlisse(e){
  if(!glisse||(e&&e.pointerId!==glisse.id))return;
  var g=glisse;glisse=null;
  if(g.angle===null)return;
  apresGlisse=Date.now();   /* le « click » qui suit le relâchement ne doit pas retourner la carte en plus */
  var demi=Math.round(g.angle/180),cible=demi*180,carte=g.carte;
  var numero=carte.getAttribute('data-numero');
  var fin=function(){
    carte.removeEventListener('transitionend',fin);
    carte.style.transition='none';carte.style.transform='';
    var dos=((demi%2)+2)%2===1;
    carte.classList.toggle('retournee',dos);
    if(dos)retournees[numero]=true;else delete retournees[numero];
    void carte.offsetWidth;carte.style.transition='';
  };
  carte.style.transition='transform .45s cubic-bezier(.25,.9,.3,1)';
  carte.addEventListener('transitionend',fin);
  carte.style.transform='rotateX(0deg) rotateY('+cible+'deg)';
  setTimeout(function(){if(carte.style.transform)fin();},700);
}
document.addEventListener('pointerup',finGlisse,true);
document.addEventListener('pointercancel',finGlisse,true);
document.addEventListener('keydown',function(e){
  if(e.key==='Escape')for(var k in retournees)delete retournees[k];
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
    var b=document.querySelector('.mtg-modal-v1 .mtg-fleche-'+(e.key==='ArrowLeft'?'prec':'suiv')+',.soreal-idle-boss-lore-v142.ouverte .mtg-fleche-'+(e.key==='ArrowLeft'?'prec':'suiv'));
    if(b)b.click();
  }
});

window.__SOREAL_IDLE_CARTE_BOSS_MAGIC_V1__={html:html,colorier:colorier,analyser:analyser,voisinsDe:voisinsDe,aller:aller};
})();
