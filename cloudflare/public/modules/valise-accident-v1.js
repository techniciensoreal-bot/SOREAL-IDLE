/*
 * SOREAL IDLE — l'accident de la valise : elle vomit (Norman, 2026-10-23 : « la valise peut aussi avoir un accident comme le coffre, mais elle vomit ; on doit la frotter pour faire partir le vomi »), et la main qui apprend à frotter.
 *
 * Environ une fois par jour (délai tiré entre 0,65 et 1,35 jour, premier tirage entre 2,4 et 24 heures, gardé dans le stockage : lié au compte), la valise vomit : une flaque de vomi (potions mal digérées : vert-jaune, des morceaux rosés)
 * s'étale à ses roulettes et des coulures lui salissent la façade. Elle le dit (« Bleurgh… j'ai trop bu. »). On nettoie en la FROTTANT, comme la flaque du Coffre : CINQ allers-retours du doigt ou de la souris, la flaque rétrécit et pâlit,
 * les coulures s'effacent au fur et à mesure. Tout reste sale tant qu'on ne nettoie pas (ouvrir, fermer, changer de menu, recharger : rien n'y change). Jamais en même temps qu'un caca du Coffre, jamais pendant que l'un des deux dort.
 *
 * La main (Norman, 2026-10-23, téléphone comme PC) : pour le PREMIER caca et le PREMIER vomi, une main animée apprend à frotter, et elle ne disparaît pas tant qu'on n'a pas frotté UNE fois. Deux temps : tant que le Coffre ou la valise n'est pas à
 * l'écran, une main posée SUR l'inventaire pointe vers le bas (pour qu'on fasse défiler jusqu'à eux) ; dès que l'un des deux est à l'écran, une autre main va et vient sur l'accident (celle du Coffre : modules/coffre-accident-v1.js ; celle de la valise : ici).
 *
 * Redessin (règle n°4 d'AGENTS.md) : l'attribut data-vomi est gardé par le morph ; la flaque et les mains portent data-morph-garder ; tout est remis en place juste après chaque redessin et toutes les 1,5 s.
 *   window.__SOREAL_IDLE_VALISE_ACCIDENT_V1__ = { vomir(), horsEcran(), niveau(), nettoyer() }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_VALISE_ACCIDENT_V1__)return;

  var NIVEAU_MAX=5,SEUIL_COURSE=16,JOUR_MS=24*3600*1000;
  var CLE='soreal_idle_vomi_v1',CLE_PROCHAIN='soreal_idle_valise_prochain_vomi_v1',CLE_DOIGT='soreal_idle_vomi_doigt_vu_v1';
  var niveau=0,suivi=null,ignorerClicJusqua=0,dernierControle=0,repliquesEnAttente=false;

  /* ---------- mémoire (liée au compte : clés soreal_idle_) ---------- */
  function sauver(){try{localStorage.setItem(CLE,JSON.stringify({niveau:niveau}));}catch(_e){}}
  (function charger(){try{var o=JSON.parse(localStorage.getItem(CLE)||'null');if(o&&typeof o==='object')niveau=Math.max(0,Math.min(NIVEAU_MAX,o.niveau|0));}catch(_e){}})();
  function doigtVu(){try{return localStorage.getItem(CLE_DOIGT)==='1';}catch(_e){return false;}}
  function marquerDoigtVu(){try{localStorage.setItem(CLE_DOIGT,'1');}catch(_e){}}
  function lireInstant(){try{var v=Number(localStorage.getItem(CLE_PROCHAIN));return v>0?v:0;}catch(_e){return 0;}}
  function ecrireInstant(t){try{localStorage.setItem(CLE_PROCHAIN,String(Math.round(t)));}catch(_e){}}

  function V(){return window.__SOREAL_IDLE_VALISE_V1__||null;}
  function C(){return window.__SOREAL_IDLE_CACA_V1__||null;}
  function bete(){return document.querySelector('.vl-section .vl-bete');}
  function son(id){try{var a=window.__SOREAL_IDLE_AUDIO_V199__;if(a&&typeof a.play==='function')a.play(id);}catch(_e){}}
  function clic(){try{var a=window.__SOREAL_IDLE_AUDIO_V199__;if(a&&typeof a.uiClick==='function')a.uiClick();}catch(_e){}}

  /* ---------- dessin ---------- */
  var VERT='#9fb83a',VERT_FONCE='#6d8a22',JAUNE='#d6c94e',ROSE='#e29a8c',ORANGE='#e3a45c';
  function tache(x,y,rx,ry,c){return 'radial-gradient(ellipse '+rx+'% '+ry+'% at '+x+'% '+y+'%,'+c+' 0 66%,transparent 70%)';}
  function goutte(x,larg,haut,c,depuis){return 'linear-gradient('+c+','+c+') '+x+'% '+(depuis||'0')+'/'+larg+'px '+haut+'% no-repeat';}
  var COULURES=[goutte(30,7,46,VERT,'-1px'),goutte(48,5,34,JAUNE,'-1px'),goutte(66,8,52,VERT_FONCE,'-1px'),tache(22,60,10,12,VERT),tache(78,50,12,14,JAUNE),tache(50,72,14,10,VERT_FONCE)].join(',');
  var EPONGE='<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34"><rect x="3" y="9" width="28" height="18" rx="6" fill="#f2cf4a" stroke="#6b4e0a" stroke-width="2"/><rect x="3" y="21" width="28" height="6" rx="3" fill="#d9a92a"/><circle cx="11" cy="15" r="2" fill="#b98a1c"/><circle cx="20" cy="14" r="2.4" fill="#b98a1c"/><circle cx="25" cy="19" r="1.8" fill="#b98a1c"/></svg>';
  var CURSEUR='url("data:image/svg+xml;utf8,'+encodeURIComponent(EPONGE)+'") 17 17,grab';

  /* Le vomi sur la façade : une coulée qui part de la bouche (l'ouverture), deux coulures sur les côtés, des morceaux (rose, orange, crème), des bulles et des reflets. Même repère que le dessin de la valise (320 x 232). */
  var VOMI_SVG='<svg class="vl-vomi-svg" viewBox="0 0 320 232" aria-hidden="true" focusable="false"><defs><linearGradient id="vlVomiG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9d84e"/><stop offset=".6" stop-color="#a1ba3b"/><stop offset="1" stop-color="#7a951f"/></linearGradient></defs><g class="vl-vomi-flot">'+
    '<g fill="url(#vlVomiG)" stroke="#4d6212" stroke-width="1.6" stroke-linejoin="round">'+
      '<path d="M120 104C110 122 130 130 122 152C116 170 138 178 134 200C133 208 140 218 148 214C154 204 156 196 156 176C170 182 178 164 172 150C192 152 200 134 192 118C198 110 196 104 190 102Z"/>'+
      '<path d="M70 106C64 128 78 142 72 168C70 182 82 188 86 176C92 152 86 130 94 108Z"/>'+
      '<path d="M232 106C226 130 240 144 236 172C238 186 250 188 254 176C258 152 250 130 258 108Z"/>'+
      '<path d="M104 134C98 146 106 154 112 150C116 144 114 138 112 134Z"/>'+
      '<path d="M206 150C202 166 212 172 216 164C218 158 214 152 212 150Z"/>'+
    '</g>'+
    '<g stroke="#4d6212" stroke-width="1.2"><circle cx="140" cy="168" r="4.2" fill="#e29a8c"/><circle cx="158" cy="142" r="3.4" fill="#f3e9c6"/><circle cx="126" cy="130" r="3" fill="#e3a45c"/><circle cx="178" cy="124" r="4" fill="#e29a8c"/><circle cx="148" cy="190" r="3" fill="#e3a45c"/><circle cx="78" cy="150" r="3.2" fill="#f3e9c6"/><circle cx="246" cy="154" r="3.6" fill="#e29a8c"/><circle cx="184" cy="160" r="2.8" fill="#e3a45c"/><circle cx="116" cy="112" r="2.6" fill="#f3e9c6"/></g>'+
    '<g fill="#fff" opacity=".4"><ellipse cx="134" cy="126" rx="3.2" ry="9"/><ellipse cx="178" cy="140" rx="2.6" ry="7"/><ellipse cx="80" cy="130" rx="2.2" ry="9"/><ellipse cx="244" cy="132" rx="2.2" ry="9"/></g>'+
    '<g fill="none" stroke="#e8f2a8" stroke-width="1.2" opacity=".7"><circle cx="150" cy="154" r="3"/><circle cx="168" cy="172" r="2.2"/><circle cx="130" cy="186" r="2.4"/></g>'+
  '</g></svg>';
  function style(){
    if(document.getElementById('soreal-idle-vomi-style-v1'))return;
    var s=document.createElement('style');s.id='soreal-idle-vomi-style-v1';
    var css=[
      /* coulures sur la façade : leur opacité suit le niveau de la flaque */
      '.vl-bete[data-vomi]{position:relative}',
      /* le dessin du vomi sur la façade : sous le couvercle et les yeux (z 5), sur le corps ; il fond avec le niveau, et coule la première fois */
      '.vl-vomi-svg{position:absolute;left:0;top:0;width:100%;height:100%;z-index:3;pointer-events:none;overflow:visible;transition:opacity .9s ease}',
      '@keyframes vlCoule{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0 0 0 0)}}',
      '.vl-vomi-svg.neuf .vl-vomi-flot{animation:vlCoule 1.9s cubic-bezier(.3,.6,.4,1) both}',
      /* flaque aux roulettes */
      '@keyframes vlFlaque{0%{opacity:0;transform:scale(.1,.05)}25%{opacity:1}100%{opacity:1;transform:scale(1,1)}}',
      '@keyframes vlMorceau{0%{opacity:0;transform:scale(.2)}60%{opacity:0}100%{opacity:1;transform:scale(1)}}',
      '.vl-flaque-v1{--s:1;position:absolute;left:-8%;bottom:-10px;width:116%;height:36px;z-index:6;transform-origin:50% 60%;animation:vlFlaque 2.4s cubic-bezier(.2,.7,.3,1) both;pointer-events:none;-webkit-tap-highlight-color:transparent}',
      '.vl-flaque-v1.deja{animation:none}',
      '.vl-flaque-v1[data-niveau="4"]{--s:.9;scale:.9;filter:opacity(.92)}.vl-flaque-v1[data-niveau="3"]{--s:.78;scale:.78;filter:opacity(.84)}.vl-flaque-v1[data-niveau="2"]{--s:.64;scale:.64;filter:opacity(.72)}.vl-flaque-v1[data-niveau="1"]{--s:.5;scale:.5;filter:opacity(.58)}',
      /* zone tactile invisible bien plus grande : le doigt qui frotte reste dedans et ne fait ni défiler ni changer de page */
      '.vl-flaque-v1::after{content:"";position:absolute;top:50%;bottom:calc(-50px / var(--s));left:calc(-60px / var(--s));right:calc(-60px / var(--s));pointer-events:auto;cursor:'+CURSEUR+';touch-action:none;background:transparent}',
      '.vl-flaque-v1 b{position:absolute;inset:0;border-radius:58% 42% 55% 45% / 62% 58% 42% 38%;background:radial-gradient(ellipse at 35% 35%,#c9dc6a 0 16%,transparent 17%),radial-gradient(ellipse at 50% 55%,'+VERT+','+VERT_FONCE+' 74%);box-shadow:0 2px 0 rgba(0,0,0,.45),inset 0 -3px 5px rgba(60,80,10,.55)}',
      '.vl-flaque-v1 b::before,.vl-flaque-v1 b::after{content:"";position:absolute;background:inherit;border-radius:50%}',
      '.vl-flaque-v1 b::before{left:-9px;top:9px;width:20px;height:11px;transform:rotate(-12deg)}',
      '.vl-flaque-v1 b::after{right:-11px;top:5px;width:24px;height:12px;transform:rotate(8deg)}',
      '.vl-flaque-v1 i{position:absolute;border-radius:48% 52% 45% 55%;box-shadow:0 1px 0 rgba(0,0,0,.45);opacity:0;animation:vlMorceau 2.6s ease-out both}',
      '.vl-flaque-v1.deja i{animation:none;opacity:1}',
      /* la valise se plie en deux quand elle vomit */
      '@keyframes vlHaut{0%,100%{transform:translate(0,0) scale(1)}12%{transform:translate(-3px,0) scale(1.03,.97)}24%{transform:translate(3px,0) scale(1.05,.95)}36%{transform:translate(-3px,0) scale(1.06,.94)}50%{transform:translate(2px,2px) scale(1.07,.93)}70%{transform:translate(0,0) scale(.97,1.03)}}',
      '.vl-section .vl-bete.vl-vomit{animation:vlHaut 1.7s ease-in-out}',
      /* la main du premier vomi, sur la flaque (même geste que celle du Coffre) */
      '@keyframes vlDoigt{from{transform:translateX(-56px) rotate(-8deg)}to{transform:translateX(56px) rotate(8deg)}}',
      '.vl-doigt-v1{position:absolute;left:50%;bottom:-8px;width:40px;height:46px;margin-left:-20px;z-index:9;pointer-events:none;filter:drop-shadow(0 2px 2px rgba(0,0,0,.55));animation:vlDoigt 1s ease-in-out infinite alternate}',
      '.vl-doigt-v1 svg{display:block;width:100%;height:100%;overflow:visible}',
      /* la main SUR l'inventaire, qui pointe vers le bas tant que le Coffre / la valise n\'est pas à l\'écran */
      '@keyframes aideMain{0%,100%{transform:translateY(-10px)}50%{transform:translateY(16px)}}',
      '.aide-main-v1{position:fixed;z-index:9000;width:62px;height:72px;margin:-36px 0 0 -31px;pointer-events:none;filter:drop-shadow(0 3px 4px rgba(0,0,0,.6));animation:aideMain 1.1s ease-in-out infinite}',
      '.aide-main-v1 svg{display:block;width:100%;height:100%;overflow:visible;transform:rotate(180deg)}',
      '.aide-main-v1.vers-haut svg{transform:none}',
      '@media (prefers-reduced-motion:reduce){.vl-flaque-v1,.vl-flaque-v1 i,.vl-doigt-v1,.aide-main-v1,.vl-section .vl-bete.vl-vomit{animation:none;opacity:1}}'
    ];
    for(var n=0;n<=NIVEAU_MAX;n+=1)css.push('.vl-bete[data-vomi="'+n+'"] .vl-vomi-svg{opacity:'+(n/NIVEAU_MAX).toFixed(2)+'}');
    /* Norman (2026-10-23) : ouverte sans avoir été nettoyée, tous les objets de la valise sont pleins de vomi ; il part au fil des frottées (opacité = niveau / maximum). */
    css.push('.vl-section .vl-art::after{content:none}');
    css.push('.vl-section:has(.vl-bete[data-vomi]) .vl-art::after{content:"";position:absolute;inset:2px 4px;z-index:3;pointer-events:none;border-radius:10px;'+
      'background:radial-gradient(circle at 26% 22%,#cbd96e 0 8px,transparent 9px),radial-gradient(circle at 72% 38%,#a9c04e 0 11px,transparent 12px),radial-gradient(circle at 42% 66%,#d9d077 0 9px,transparent 10px),'+
      'linear-gradient(#b3c755,#9db444) 20% 0/7px 62% no-repeat,linear-gradient(#a7bd48,#8fa83c) 64% 0/6px 78% no-repeat;filter:drop-shadow(0 1px 0 #55631a)}');
    for(var v=1;v<=NIVEAU_MAX;v+=1)css.push('.vl-section:has(.vl-bete[data-vomi="'+v+'"]) .vl-art::after{opacity:'+(.25+.75*v/NIVEAU_MAX).toFixed(2)+'}');
    /* Perspective (Norman, 2026-10-23) : le vomi est AU SOL, il passe EN DESSOUS de la valise : le fond de la flaque est derrière le dessin de la valise, le devant (sa moitié basse seulement) recouvre juste le bas des roulettes. */
    css=css.concat(css.filter(function(x){return x.indexOf('.vl-flaque-v1')===0&&x.indexOf('::after{content')<0;}).map(function(x){return x.replace(/.vl-flaque-v1/g,'.vl-flaque-fond-v1');}));
    css.push('.vl-flaque-fond-v1{z-index:1;pointer-events:none;cursor:auto;touch-action:auto}');
    css.push('.vl-bete:has(.vl-flaque-fond-v1)>svg:not(.vl-haut):not(.vl-vomi-svg){position:relative;z-index:2}');
    css.push('.vl-flaque-v1 b{clip-path:inset(54% -20px 0 -20px)}');
    s.textContent=css.join('\n');
    document.head.appendChild(s);
  }

  /* ---------- la flaque ---------- */
  function construire(el,spontanee){
    style();
    var f=document.createElement('span');
    f.className='vl-flaque-v1'+(spontanee?'':' deja');f.setAttribute('aria-hidden','true');f.setAttribute('data-morph-garder','');f.setAttribute('data-niveau',String(niveau));
    var fondHtml='<b></b>',devantHtml='<b></b>',couleurs=[VERT_FONCE,JAUNE,ROSE,ORANGE,VERT];
    for(var k=0;k<8;k+=1){
      var w=5+Math.round(Math.random()*6),h=4+Math.round(Math.random()*4),haut=Math.round(18+Math.random()*50);
      var morceau='<i style="left:'+Math.round(10+Math.random()*74)+'%;top:'+haut+'%;width:'+w+'px;height:'+h+'px;background:'+couleurs[k%couleurs.length]+';animation-delay:'+(1.1+k*.22).toFixed(2)+'s"></i>';
      fondHtml+=morceau;
      if(haut>=40)devantHtml+=morceau;   /* devant : seulement les morceaux de la moitié basse */
    }
    var fond=document.createElement('span');
    fond.className='vl-flaque-fond-v1'+(spontanee?'':' deja');fond.setAttribute('aria-hidden','true');fond.setAttribute('data-morph-garder','');fond.setAttribute('data-niveau',String(niveau));
    fond.innerHTML=fondHtml;
    f.innerHTML=devantHtml;
    el.appendChild(fond);
    el.appendChild(f);
    poserVomiFacade(el,spontanee);
    montrerDoigt(el);
    return f;
  }
  /* le dessin du vomi sur la façade (coule la première fois, déjà là ensuite) */
  function poserVomiFacade(el,spontanee){
    if(!el||el.querySelector('.vl-vomi-svg'))return;
    var h=document.createElement('span');
    h.innerHTML=VOMI_SVG;
    var svg=h.firstChild;
    svg.setAttribute('data-morph-garder','');
    if(spontanee)svg.setAttribute('class','vl-vomi-svg neuf');
    el.appendChild(svg);
  }
  function montrerDoigt(el){
    if(doigtVu()||!el||el.querySelector('.vl-doigt-v1'))return;
    style();
    var c=C(),d=document.createElement('span');
    d.className='vl-doigt-v1';d.setAttribute('aria-hidden','true');d.setAttribute('data-morph-garder','');d.innerHTML=c&&c.doigtSvg?c.doigtSvg:'';
    el.appendChild(d);
  }
  function retirerDoigt(){
    marquerDoigtVu();
    var d=document.querySelector('.vl-doigt-v1');if(d&&d.parentNode)d.parentNode.removeChild(d);
  }
  /* remet en place l'état (flaque, coulures, main) : appelé après chaque redessin et toutes les 1,5 s */
  function majFlaque(){
    var el=bete();
    var fl=document.querySelector('.vl-flaque-v1'),fd=document.querySelector('.vl-flaque-fond-v1');
    if(niveau<=0){
      if(fd&&fd.parentNode)fd.parentNode.removeChild(fd);
      if(fl&&fl.parentNode)fl.parentNode.removeChild(fl);
      var d=document.querySelector('.vl-doigt-v1');if(d&&d.parentNode)d.parentNode.removeChild(d);
      var vf=document.querySelector('.vl-vomi-svg');if(vf&&vf.parentNode)vf.parentNode.removeChild(vf);
      if(el&&el.hasAttribute('data-vomi'))el.removeAttribute('data-vomi');
      return;
    }
    if(!el)return;
    style();
    if(!fl){if(fd&&fd.parentNode)fd.parentNode.removeChild(fd);fl=construire(el,false);fd=document.querySelector('.vl-flaque-fond-v1');}
    if(!document.querySelector('.vl-doigt-v1'))montrerDoigt(el);
    poserVomiFacade(el,false);
    if(fl.getAttribute('data-niveau')!==String(niveau))fl.setAttribute('data-niveau',String(niveau));
    if(fd&&fd.getAttribute('data-niveau')!==String(niveau))fd.setAttribute('data-niveau',String(niveau));
    if(el.getAttribute('data-vomi')!==String(niveau))el.setAttribute('data-vomi',String(niveau));
  }

  /* ---------- l'accident ---------- */
  function entierementVisible(){
    var el=bete();
    if(!el||document.hidden)return null;
    var r=el.getBoundingClientRect(),h=window.innerHeight||document.documentElement.clientHeight,w=window.innerWidth||document.documentElement.clientWidth;
    return r.width>0&&r.height>0&&r.top>=0&&r.left>=0&&r.bottom<=h&&r.right<=w?el:null;
  }
  function repliques(){
    var v=V();if(!v||typeof v.dire!=='function')return;
    var ouvertures=['Bleurgh… j’ai trop bu.','Oh non… pas encore les potions…','Ne regardez pas, c’est gênant.'];
    v.dire(ouvertures[Math.floor(Math.random()*ouvertures.length)]);
  }
  function vomir(){
    var el=bete();if(!el)return false;
    style();
    var ancienne=document.querySelector('.vl-flaque-v1');if(ancienne&&ancienne.parentNode)ancienne.parentNode.removeChild(ancienne);
    var ancienFond=document.querySelector('.vl-flaque-fond-v1');if(ancienFond&&ancienFond.parentNode)ancienFond.parentNode.removeChild(ancienFond);
    var ancienneFacade=document.querySelector('.vl-vomi-svg');if(ancienneFacade&&ancienneFacade.parentNode)ancienneFacade.parentNode.removeChild(ancienneFacade);
    niveau=NIVEAU_MAX;sauver();
    el.classList.remove('vl-vomit');void el.offsetWidth;el.classList.add('vl-vomit');
    setTimeout(function(){el.classList.remove('vl-vomit');},1800);
    construire(el,true);
    el.setAttribute('data-vomi',String(niveau));
    setTimeout(function(){son('valiseVomi');},350);
    repliques();
    window.__valiseVomiNumeroIdleV1__=Math.floor(Date.now()/1000);
    return true;
  }
  function horsEcran(){
    niveau=NIVEAU_MAX;sauver();
    repliquesEnAttente=true;
    majFlaque();
  }
  function nettoyer(){
    niveau=0;sauver();majFlaque();
  }
  /* La valise existe pour ce joueur (il a un Coffre) : sinon rien ne se passe */
  function coffreExiste(){
    try{
      var e=typeof window.__SOREAL_IDLE_LIRE_ETAT_V1__==='function'?window.__SOREAL_IDLE_LIRE_ETAT_V1__():null;
      var a=e&&e.systemes&&e.systemes.adventure;
      return Boolean(a&&Array.isArray(a.coffreSlots)&&a.coffreSlots.length>0);
    }catch(_e){return false;}
  }
  /* Tirage du prochain vomi, une fois par minute au plus (comme l'accident du Coffre) ; jamais avec un caca en cours, ni pendant un sommeil */
  function verifier(){
    var maintenant=Date.now();
    if(maintenant-dernierControle<60000)return;
    dernierControle=maintenant;
    if(!coffreExiste())return;
    var t=lireInstant();
    if(!t){ecrireInstant(maintenant+JOUR_MS*(.1+Math.random()*.9));return;}
    if(maintenant<t)return;
    var c=C();
    if((c&&c.flaqueNiveau&&c.flaqueNiveau()>0)||niveau>0||window.__coffreDortIdleV1__||window.__valiseDortIdleV1__){ecrireInstant(maintenant+5*60*1000);return;}   /* pas maintenant : dans 5 minutes */
    ecrireInstant(maintenant+JOUR_MS*(.65+Math.random()*.7));
    var el=entierementVisible();
    if(el&&vomir())return;
    horsEcran();
  }

  /* ---------- frottement : 5 allers-retours (même geste que la flaque du Coffre) ---------- */
  function dedans(r,x,y){return x>=r.left-70&&x<=r.right+70&&y>=r.top-70&&y<=r.bottom+70;}
  function nouveau(x,y){return {x:x,y:y,sx:0,sy:0,bx:0,by:0,compte:false,total:0};}
  function course(fr,x,y){
    var dx=x-fr.x,dy=y-fr.y,d=Math.hypot(dx,dy);
    if(d<2)return 0;
    fr.x=x;fr.y=y;fr.total+=d;
    var sl=Math.hypot(fr.sx,fr.sy);
    if(sl<1){fr.sx+=dx;fr.sy+=dy;}
    else{
      var p=(dx*fr.sx+dy*fr.sy)/sl;
      if(p>=0){fr.sx+=dx;fr.sy+=dy;fr.bx=0;fr.by=0;}
      else{
        fr.bx+=dx;fr.by+=dy;
        if(Math.hypot(fr.bx,fr.by)>=8){fr.sx=fr.bx;fr.sy=fr.by;fr.bx=0;fr.by=0;fr.compte=false;}
      }
    }
    if(!fr.compte&&Math.hypot(fr.sx,fr.sy)>=SEUIL_COURSE){fr.compte=true;return 1;}
    return 0;
  }
  document.addEventListener('pointerdown',function(e){
    if(e.button>0){suivi=null;return;}
    var fl=e.target&&e.target.closest?e.target.closest('.vl-flaque-v1'):null;
    suivi=fl?Object.assign(nouveau(e.clientX,e.clientY),{id:e.pointerId}):null;
  },true);
  document.addEventListener('pointermove',function(e){
    if(!suivi||e.pointerId!==suivi.id)return;
    var fl=document.querySelector('.vl-flaque-v1');
    if(!fl||!dedans(fl.getBoundingClientRect(),e.clientX,e.clientY)){suivi=null;return;}
    var n=course(suivi,e.clientX,e.clientY);
    if(suivi.total>8)ignorerClicJusqua=Date.now()+600;
    if(n&&niveau>0){
      retirerDoigt();   /* une vraie frottée : la main a rempli son rôle */
      niveau-=1;sauver();majFlaque();clic();
      if(niveau===0){var v=V();if(v&&typeof v.dire==='function')v.dire('Merci… ça va mieux.');}
    }
  },true);
  ['pointerup','pointercancel'].forEach(function(t){document.addEventListener(t,function(){suivi=null;},true);});
  document.addEventListener('click',function(e){
    if(Date.now()<ignorerClicJusqua&&e.target&&e.target.closest&&e.target.closest('.vl-flaque-v1')){e.stopPropagation();e.preventDefault();}
  },true);

  /* ---------- la main SUR l'inventaire (premier caca, premier vomi) ---------- */
  function aideActive(){
    var c=C();
    var caca=Boolean(c&&c.flaqueNiveau&&c.flaqueNiveau()>0&&!(c.doigtVu&&c.doigtVu()));
    var vomi=niveau>0&&!doigtVu();
    return {caca:caca,vomi:vomi};
  }
  function visible(el){
    if(!el||typeof el.getBoundingClientRect!=='function')return false;
    var r=el.getBoundingClientRect(),h=window.innerHeight||document.documentElement.clientHeight,w=window.innerWidth||document.documentElement.clientWidth;
    if(!(r.width>0&&r.height>0))return false;
    var vis=Math.max(0,Math.min(r.bottom,h)-Math.max(r.top,0))*Math.max(0,Math.min(r.right,w)-Math.max(r.left,0));
    return vis>=r.width*r.height*0.5;
  }
  function retirerMain(){var m=document.querySelector('.aide-main-v1');if(m&&m.parentNode)m.parentNode.removeChild(m);}
  function majMain(){
    var a=aideActive();
    var inventaire=document.querySelector('.soreal-idle-v151-inventory-columns');
    if(!(a.caca||a.vomi)||!inventaire||document.hidden){retirerMain();return;}
    var cible=a.caca?document.querySelector('.soreal-idle-coffre-v1 .bg-bagage-v1'):null;
    var cibleV=a.vomi?bete():null;
    /* le Coffre ou la valise (celui qui a l'accident) est à l'écran : c'est SA main qui prend le relais */
    if((cible&&visible(cible))||(cibleV&&visible(cibleV))){retirerMain();return;}
    var cibleRect=(cible||cibleV);
    if(!cibleRect){retirerMain();return;}   /* pas de Coffre sur cette page : rien à montrer */
    var h=window.innerHeight||document.documentElement.clientHeight,w=window.innerWidth||document.documentElement.clientWidth;
    var r=inventaire.getBoundingClientRect(),rc=cibleRect.getBoundingClientRect();
    var haut=Math.max(r.top,0),bas=Math.min(r.bottom,h);
    /* sur l'inventaire s'il est à l'écran ; sinon au bord de l'écran, du côté où il se trouve (en bas : on invite à faire défiler vers le bas) */
    var y=bas>haut?(haut+bas)/2:(r.top>=h?h*.82:h*.18);
    var x=Math.max(40,Math.min(w-40,r.left+r.width/2));
    var versBas=rc.top>=h*.5;   /* le Coffre est plus bas : on pointe vers le bas ; s'il est déjà passé, vers le haut */
    style();
    var m=document.querySelector('.aide-main-v1');
    if(!m){
      m=document.createElement('span');
      m.className='aide-main-v1';m.setAttribute('aria-hidden','true');m.setAttribute('data-morph-garder','');
      var c=C();m.innerHTML=c&&c.doigtSvg?c.doigtSvg:'';
      document.body.appendChild(m);
    }
    m.style.left=Math.round(x)+'px';m.style.top=Math.round(y)+'px';
    m.classList.toggle('vers-haut',!versBas);
  }

  (window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__=window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__||[]).push('data-vomi');
  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(function(){majFlaque();});

  setInterval(function(){
    if((document.documentElement&&document.documentElement.classList&&document.documentElement.classList.contains&&document.documentElement.classList.contains('soreal-anim-coffre')))return;
    verifier();
    if(niveau>0)majFlaque();
    /* accident survenu hors de vue : les répliques sortent la première fois que la valise est entièrement à l'écran */
    if(repliquesEnAttente&&!document.hidden&&entierementVisible()){repliquesEnAttente=false;repliques();}
    majMain();
  },1500);
  window.addEventListener('scroll',function(){majMain();},{passive:true});
  window.addEventListener('resize',function(){majMain();});

  window.__SOREAL_IDLE_VALISE_ACCIDENT_V1__={vomir:vomir,horsEcran:horsEcran,nettoyer:nettoyer,niveau:function(){return niveau;},majMain:majMain,verifier:verifier};
  window.__valiseVomirIdleV1__=vomir;   /* essais */
  style();
  setTimeout(function(){majFlaque();majMain();},400);
})();
