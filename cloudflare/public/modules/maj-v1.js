/*
 * SOREAL IDLE — bandeau de mise à jour (Norman, 2026-10-28 : « une mise à jour que la personne voit en haut quand il est connecté à internet ; elle se fait dans la fenêtre et le jeu se relance, comme VLC »).
 * Application Windows seulement (le pont window.sorealDesktop, desktop/preload.js, n'existe pas dans un navigateur : ce module ne fait alors rien). L'application vérifie le serveur toute seule ; ici on n'affiche que ce qu'elle propose :
 *   « Une mise à jour est disponible : <notes>  [Mettre à jour] [Plus tard] »  ->  barre de progression  ->  « Redémarrage… » (le jeu se ferme et se relance avec la mise à jour).
 * Le bandeau est posé HORS de la page du jeu (directement dans <body>, « data-morph-garder ») : les redessins de la page ne le touchent pas.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_MAJ_V1__)return;
var D=window.sorealDesktop;
if(!D||typeof D.majEtat!=='function'||typeof D.majInstaller!=='function'||typeof D.majSur!=='function')return;

var ID='sorealIdleMajV1';
var etat={maj:null,cachee:'',progression:null,installation:false,erreur:''};

function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function taille(o){var m=Number(o)/1048576;return m>=10?Math.round(m)+' Mo':m.toFixed(1).replace('.',',')+' Mo';}

function style(){
  if(document.getElementById(ID+'Style'))return;
  var s=document.createElement('style');s.id=ID+'Style';
  s.textContent='#'+ID+'{position:fixed;left:0;right:0;top:0;z-index:2147483000;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:8px 14px;background:linear-gradient(180deg,#1f4fa8,#173a7d);color:#fff;font:600 14px/1.3 "Comic Neue","Segoe UI",system-ui,sans-serif;box-shadow:0 3px 14px rgba(0,0,0,.55);border-bottom:2px solid #7fb2ff}'+
    '#'+ID+' .maj-texte{flex:1 1 260px;min-width:0}#'+ID+' .maj-texte b{color:#ffd24a}'+
    '#'+ID+' button{font:800 14px "Comic Neue","Segoe UI",system-ui,sans-serif;padding:6px 14px;border-radius:999px;border:2px solid rgba(255,255,255,.7);cursor:pointer;color:#fff;background:rgba(255,255,255,.12)}'+
    '#'+ID+' button.principal{background:#2fbf4a;border-color:#fff;color:#06210d}#'+ID+' button:disabled{opacity:.6;cursor:default}'+
    '#'+ID+' .maj-barre{flex:1 1 220px;height:12px;border-radius:999px;background:rgba(0,0,0,.35);overflow:hidden}#'+ID+' .maj-barre i{display:block;height:100%;width:0;background:#ffd24a;border-radius:999px}'+
    '#'+ID+' .maj-erreur{color:#ffd0d0}';
  (document.head||document.documentElement).appendChild(s);
}

function dessiner(){
  var el=document.getElementById(ID);
  var m=etat.maj;
  if(!m||(etat.cachee===m.version&&!etat.installation)){if(el)el.remove();return;}
  style();
  if(!el){el=document.createElement('div');el.id=ID;el.setAttribute('data-morph-garder','1');el.setAttribute('role','status');(document.body||document.documentElement).appendChild(el);}
  var html;
  if(etat.installation){
    var p=etat.progression||{},pct=p.octetsTotal>0?Math.min(100,Math.round(p.octets*100/p.octetsTotal)):(p.total>0?Math.round(p.fait*100/p.total):0);
    html=p.termine
      ?'<div class="maj-texte">Mise à jour installée. <b>Redémarrage du jeu…</b></div>'
      :'<div class="maj-texte">Mise à jour en cours… <b>'+pct+' %</b>'+(p.octetsTotal>0?' ('+taille(p.octets)+' sur '+taille(p.octetsTotal)+')':'')+'. Ne ferme pas le jeu.</div><div class="maj-barre"><i style="width:'+pct+'%"></i></div>';
  }else{
    html='<div class="maj-texte">🔄 Une mise à jour est disponible'+(m.notes?' : <b>'+esc(m.notes)+'</b>':'')+' <span style="opacity:.8">('+taille(m.octets)+')</span></div>'+
      (etat.erreur?'<div class="maj-texte maj-erreur">'+esc(etat.erreur)+'</div>':'')+
      '<button type="button" class="principal" data-maj="installer">Mettre à jour</button><button type="button" data-maj="plus-tard">Plus tard</button>';
  }
  if(el.__html!==html){el.innerHTML=html;el.__html=html;}
}

document.addEventListener('click',function(ev){
  var b=ev.target&&ev.target.closest?ev.target.closest('#'+ID+' [data-maj]'):null;
  if(!b)return;
  if(b.getAttribute('data-maj')==='plus-tard'){etat.cachee=etat.maj?etat.maj.version:'';dessiner();return;}
  if(b.getAttribute('data-maj')==='installer'&&!etat.installation){
    etat.installation=true;etat.erreur='';etat.progression={fait:0,total:etat.maj.nb||0,octets:0,octetsTotal:etat.maj.octets||0};dessiner();
    Promise.resolve(D.majInstaller()).then(function(r){
      if(!r||r.ok===false){etat.installation=false;etat.erreur='La mise à jour n’a pas pu être installée : réessaie dans un moment.';dessiner();}
    }).catch(function(){etat.installation=false;etat.erreur='La mise à jour n’a pas pu être installée : réessaie dans un moment.';dessiner();});
  }
},true);

D.majSur(function(e){
  if(!e)return;
  if(e.type==='proposee'){etat.maj=e.maj||null;if(!etat.installation)dessiner();}
  else if(e.type==='progression'){etat.progression=e.progression||null;dessiner();}
});
Promise.resolve(D.majEtat()).then(function(m){if(m){etat.maj=m;dessiner();}}).catch(function(){});

window.__SOREAL_IDLE_MAJ_V1__={etat:function(){return etat;},dessiner:dessiner};
})();
