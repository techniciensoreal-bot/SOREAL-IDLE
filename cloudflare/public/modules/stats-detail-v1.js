/*
 * SOREAL IDLE — panneau « Détail de l'Attack / Defense » (Norman, 2026-09-26) : un clic sur la case Attack ou Defense du résumé ouvre le calcul complet,
 * facteur par facteur, pour le comparer ligne à ligne avec le panneau Breakdown du vrai NGU Idle.
 * Les valeurs viennent du serveur (combatPrincipal.detailStats : les facteurs réellement multipliés) ; seuls les facteurs actifs (≠ ×1) sont nommés,
 * les autres sont juste comptés (aucun système encore verrouillé n'est révélé). La fenêtre vit hors de #app : le rendu du jeu remplace #app en continu.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_STATS_DETAIL_V1__)return;

var OUVERT=null;/* 'attaque' | 'defense' | null */
var MINUTEUR=0;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function nb(v){var n=Number(v);return Number.isFinite(n)?n:0;}

/* Nombres façon jeu : 23.4M, 1.25B… */
function grand(n){
  n=nb(n);
  var a=Math.abs(n);
  if(a<1000)return String(Math.round(n*100)/100).replace('.',',');
  var suffixes=['K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];
  var i=-1;
  while(a>=1000&&i<suffixes.length-1){a/=1000;i++;}
  var t=a.toFixed(a>=100?0:(a>=10?1:2));
  if(t.indexOf('.')>=0)t=t.replace(/0+$/,'').replace(/\.$/,'');
  return (n<0?'-':'')+t+suffixes[i];
}
function facteur(v){return '×'+nb(v).toFixed(4).replace('.',',');}
function pct(v){var p=(nb(v)-1)*100;return (p>=0?'+':'')+p.toFixed(2).replace('.',',')+' %';}

function etat(){
  try{return typeof window.__SOREAL_IDLE_LIRE_ETAT_V1__==='function'?window.__SOREAL_IDLE_LIRE_ETAT_V1__():null;}catch(_){return null;}
}

function style(){
  if(document.getElementById('soreal-idle-stats-detail-style-v1'))return;
  var st=document.createElement('style');
  st.id='soreal-idle-stats-detail-style-v1';
  st.textContent=
    '.soreal-idle-summary-v28:has(#sorealIdleSummaryAttackV50),.soreal-idle-summary-v28:has(#sorealIdleSummaryDefenseV50){cursor:pointer;position:relative}'+
    '.soreal-idle-summary-v28:has(#sorealIdleSummaryAttackV50)::after,.soreal-idle-summary-v28:has(#sorealIdleSummaryDefenseV50)::after{content:"ⓘ";position:absolute;top:6px;right:9px;font-size:11px;opacity:.55}'+
    '#soreal-idle-stats-detail-v1{position:fixed;inset:0;z-index:100003;background:rgba(4,8,18,.78);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}'+
    '#soreal-idle-stats-detail-v1 .boite{width:min(520px,100%);max-height:100%;overflow:auto;background:#182236;border:1px solid rgba(166,188,229,.25);border-radius:16px;padding:16px;color:#dce5f3;box-shadow:0 18px 50px rgba(0,0,0,.6)}'+
    '#soreal-idle-stats-detail-v1 h3{margin:0 0 4px;font-size:18px}'+
    '#soreal-idle-stats-detail-v1 .aide{font-size:12px;color:#8fa3c9;margin:0 0 10px}'+
    '#soreal-idle-stats-detail-v1 table{width:100%;border-collapse:collapse;font-size:14px}'+
    '#soreal-idle-stats-detail-v1 td{padding:6px 4px;border-bottom:1px solid rgba(166,188,229,.12);vertical-align:top}'+
    '#soreal-idle-stats-detail-v1 td.v{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}'+
    '#soreal-idle-stats-detail-v1 td small{display:block;color:#8fa3c9;font-size:11px;margin-top:2px}'+
    '#soreal-idle-stats-detail-v1 tr.total td{font-weight:800;border-bottom:0;padding-top:10px;font-size:15px}'+
    '#soreal-idle-stats-detail-v1 .actions{display:flex;justify-content:flex-end;margin-top:12px}'+
    '#soreal-idle-stats-detail-v1 button{padding:9px 16px;border-radius:10px;border:1px solid rgba(166,188,229,.3);background:#22314d;color:#eef4fc;font:600 14px system-ui,sans-serif;cursor:pointer}';
  document.head.appendChild(st);
}

function contenu(cle){
  var e=etat();
  var cp=e&&e.combatPrincipal;
  var d=cp&&cp.detailStats&&cp.detailStats[cle];
  var nom=cle==='attaque'?'Attack':'Defense';
  var icone=cle==='attaque'?'⚔️':'🛡️';
  if(!d)return '<h3>'+icone+' Détail : '+nom+'</h3><p class="aide">Le détail n’est pas encore disponible. Réessaie dans un instant.</p>';
  var base=Math.max(100,nb(cle==='attaque'?cp.attaqueEntrainement:cp.defenseEntrainement));
  var produit=nb(d.produit)>0?nb(d.produit):1;
  var total=Math.max(100,100+Math.round((base-100)*produit));
  var eq=cp.detailStats.equipement||null;
  var lignes='';
  var neutres=0;
  (d.facteurs||[]).forEach(function(f){
    var v=nb(f.valeur);
    if(Math.abs(v-1)<1e-9){neutres++;return;}
    var note='';
    if(f.id==='equipement'&&eq){
      var pts=cle==='attaque'?nb(eq.power):nb(eq.toughness);
      var cube=cle==='attaque'?nb(eq.cubePower):nb(eq.cubeToughness);
      note='<small>'+(cle==='attaque'?'Power':'Toughness')+' porté : '+String(Math.round(pts*100)/100).replace('.',',')+(cube>0?' (dont '+String(Math.round(cube*100)/100).replace('.',',')+' de l’Infinity Cube)':'')+' · boosts appliqués compris · 1 point = +1 %</small>';
    }
    lignes+='<tr><td>'+esc(f.label)+note+'</td><td class="v">'+facteur(v)+'<small>'+pct(v)+'</small></td></tr>';
  });
  var autres=nb(d.autres);
  if(autres>0&&Math.abs(autres-1)>1e-9)lignes+='<tr><td>Autres bonus</td><td class="v">'+facteur(autres)+'<small>'+pct(autres)+'</small></td></tr>';
  var actifs=(d.facteurs||[]).length-neutres+(Math.abs(autres-1)>1e-9?1:0);
  if(neutres)lignes+='<tr><td style="color:#8fa3c9">'+(actifs>0?neutres+' autre'+(neutres>1?'s':'')+' facteur'+(neutres>1?'s':'')+' à ×1':'Aucun bonus actif pour l’instant')+'</td><td class="v" style="color:#8fa3c9">×1,0000</td></tr>';
  return '<h3>'+icone+' Détail : '+nom+'</h3>'+
    '<p class="aide">'+nom+' = 100 + (Basic Training − 100) × produit des facteurs. Ce sont exactement les chiffres utilisés en combat.</p>'+
    '<table>'+
      '<tr><td>Basic Training<small>100 + Σ niveau<sup>1,3</sup> × valeur de base</small></td><td class="v">'+grand(base)+'</td></tr>'+
      lignes+
      '<tr><td>Produit des facteurs</td><td class="v">'+facteur(produit)+'<small>'+pct(produit)+'</small></td></tr>'+
      '<tr class="total"><td>'+nom+'</td><td class="v">'+grand(total)+'</td></tr>'+
    '</table>'+
    '<div class="actions"><button type="button" id="soreal-idle-stats-detail-fermer-v1">Fermer</button></div>';
}

function fermer(){
  OUVERT=null;
  if(MINUTEUR){clearInterval(MINUTEUR);MINUTEUR=0;}
  var o=document.getElementById('soreal-idle-stats-detail-v1');if(o)o.remove();
}

function dessiner(){
  var o=document.getElementById('soreal-idle-stats-detail-v1');
  if(!o||!OUVERT)return;
  var boite=o.querySelector('.boite');
  var haut=boite?boite.scrollTop:0;
  if(boite)boite.innerHTML=contenu(OUVERT);
  if(boite)boite.scrollTop=haut;
  var bt=document.getElementById('soreal-idle-stats-detail-fermer-v1');
  if(bt)bt.addEventListener('click',fermer);
}

function ouvrir(cle){
  style();
  fermer();
  OUVERT=cle;
  var o=document.createElement('div');
  o.id='soreal-idle-stats-detail-v1';
  o.innerHTML='<div class="boite" role="dialog" aria-modal="true"></div>';
  document.body.appendChild(o);
  o.addEventListener('mousedown',function(ev){if(ev.target===o)fermer();});
  dessiner();
  /* Les niveaux évoluent en continu : le détail suit. */
  MINUTEUR=setInterval(dessiner,1000);
}

style();
document.addEventListener('click',function(ev){
  var t=ev.target&&ev.target.closest?ev.target.closest('.soreal-idle-summary-v28'):null;
  if(!t)return;
  if(t.querySelector('#sorealIdleSummaryAttackV50'))ouvrir('attaque');
  else if(t.querySelector('#sorealIdleSummaryDefenseV50'))ouvrir('defense');
});
document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&OUVERT)fermer();});

window.__SOREAL_IDLE_STATS_DETAIL_V1__={ouvrir:ouvrir,fermer:fermer,contenu:contenu};
})();
