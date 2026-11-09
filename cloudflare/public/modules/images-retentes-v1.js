/*
 * SOREAL IDLE — images redemandées pour TOUT le jeu (Norman, 2026-11-09 : « deux images (la gelée métallique, les 743 coucous furax) n'apparaissent plus en Aventure, sur téléphone et sur Chrome ; tu ne peux pas fixer ça pour l'entièreté du projet ? »).
 *
 * Cause : une image (<img> ou <image> SVG) qui échoue une fois (réponse d'erreur, coupure réseau, mise en veille du téléphone) n'était JAMAIS redemandée tant que son adresse ne changeait pas, et le navigateur garde une
 * réponse d'erreur du serveur 60 s. Les médias du jeu sont servis par le serveur (R2) : un échec isolé laissait un trou jusqu'à un changement d'onglet.
 * Ici, un seul écouteur (phase de capture : « error » ne remonte pas) sur toute la page : trois nouvelles tentatives (1,5 s, 4 s, 9 s), chacune avec une adresse différente (&r=n) pour passer outre le cache ; seules les adresses du
 * jeu lui-même sont retentées (jamais data:, blob: ni un autre site). Après le troisième échec, le module DEMANDE lui-même l'adresse (fetch) pour noter la vraie réponse du serveur (statut, type, clé R2) dans
 * `soreal_idle_diag_v1_images` (30 derniers échecs, propre à l'appareil : exclu de la synchro des préférences) et dans window.__SOREAL_IDLE_IMAGES_ECHECS_V1__ : la prochaine fois, la cause se lit au lieu de se deviner.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_IMAGES_RETENTES_V1__)return;
  var CLE='soreal_idle_diag_v1_images',DELAIS=[1500,4000,9000],MAX=30;
  var echecs=[];
  try{echecs=JSON.parse(window.localStorage.getItem(CLE)||'[]');if(!Array.isArray(echecs))echecs=[];}catch(_e){echecs=[];}
  window.__SOREAL_IDLE_IMAGES_ECHECS_V1__=echecs;
  function noter_(e){
    echecs.push(e);while(echecs.length>MAX)echecs.shift();
    try{window.localStorage.setItem(CLE,JSON.stringify(echecs));}catch(_e){}
  }
  function adresse_(el){return el.tagName.toLowerCase()==='img'?el.getAttribute('src'):(el.getAttribute('href')||el.getAttribute('xlink:href'));}
  function poser_(el,u){if(el.tagName.toLowerCase()==='img')el.setAttribute('src',u);else el.setAttribute('href',u);}
  function propre_(u){return String(u||'').replace(/([?&])r=\d+(&|$)/,function(m,a,b){return b?a:'';}).replace(/[?&]$/,'');}
  function duJeu_(u){
    if(!u||/^(data|blob|about|javascript):/i.test(u))return false;
    if(/^(https?:)?\/\//i.test(u)){try{return new URL(u,location.href).origin===location.origin;}catch(_e){return false;}}
    return true;
  }
  function essai_(ev){
    var el=ev&&ev.target;if(!el||!el.tagName)return;
    var t=el.tagName.toLowerCase();if(t!=='img'&&t!=='image')return;
    var u=adresse_(el);if(!duJeu_(u))return;
    var base=propre_(u);
    if(el.__imgBaseV1!==base){el.__imgBaseV1=base;el.__imgEssaisV1=0;}   /* une autre image : compteur remis à zéro */
    var n=(el.__imgEssaisV1||0)+1;el.__imgEssaisV1=n;
    if(n>DELAIS.length){
      try{
        fetch(base,{cache:'no-store'}).then(function(r){noter_({u:base,t:Date.now(),statut:r.status,type:r.headers.get('content-type'),cle:r.headers.get('x-soreal-idle-r2-key'),ua:String(navigator.userAgent||'').slice(0,70)});})
          .catch(function(e){noter_({u:base,t:Date.now(),erreur:String(e&&e.message||e),ua:String(navigator.userAgent||'').slice(0,70)});});
      }catch(_e){}
      return;
    }
    setTimeout(function(){
      if(el.__imgBaseV1!==base||propre_(adresse_(el))!==base)return;   /* le jeu a changé l'image entre-temps : rien à refaire */
      poser_(el,base+(base.indexOf('?')<0?'?':'&')+'r='+n);
    },DELAIS[n-1]);
  }
  function charge_(ev){var el=ev&&ev.target;if(el&&el.tagName&&(el.tagName.toLowerCase()==='img'||el.tagName.toLowerCase()==='image'))el.__imgEssaisV1=0;}
  document.addEventListener('error',essai_,true);
  document.addEventListener('load',charge_,true);
  window.__SOREAL_IDLE_IMAGES_RETENTES_V1__={essai:essai_,propre:propre_,echecs:echecs,delais:DELAIS.slice()};
})();
