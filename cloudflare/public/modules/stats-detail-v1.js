/*
 * SOREAL IDLE — panneaux « Stats Breakdown » (Norman, 2026-09-26 puis 2026-11-22 : « il manque plein de chiffres ») : un clic sur la case Attack ou Defense du résumé (ou sur le « i » d'une
 * ressource de la boutique d'EXP) ouvre le calcul complet, facteur par facteur, comme les panneaux du vrai NGU Idle.
 * Attack / Defense : combatPrincipal.detailStats (facteurs réellement multipliés). Tous les autres panneaux (Énergie, Magie, Ressource 3, Augmentations, NGU, Barbes, Wandoos, gains d'EXP/AP/PP,
 * Aventure, Divers) : combatPrincipal.detailStats.panneauxStats, calculés par le serveur (src/idle-stats-breakdown-v1.js) avec les mêmes variables que le moteur.
 * ANTI-SPOIL (règle n°2) : le serveur n'envoie que les facteurs ACTIFS (≠ ×1) et que les panneaux des systèmes découverts ; ici, seuls les facteurs actifs d'Attack / Defense sont nommés, les autres sont
 * juste comptés. La fenêtre vit hors de #app : le rendu du jeu remplace #app en continu (règle n°4 : jamais de redessin visible).
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_STATS_DETAIL_V1__)return;

var OUVERT=null;/* 'attaque' | 'defense' | id d'un panneau serveur | null */
var MINUTEUR=0;
var DERNIER='';

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
function facteur(v){v=nb(v);return '×'+(Math.abs(v)>=1000?grand(v):v.toFixed(4).replace('.',','));}
function pct(v){var p=(nb(v)-1)*100;return (p>=0?'+':'')+(Math.abs(p)>=100000?grand(p):p.toFixed(2).replace('.',','))+' %';}
function pourcent(v){return grand(nb(v)*100)+' %';}
function secondes(v){return String(Math.round(nb(v)*100)/100).replace('.',',')+' s';}

function etat(){
  try{return typeof window.__SOREAL_IDLE_LIRE_ETAT_V1__==='function'?window.__SOREAL_IDLE_LIRE_ETAT_V1__():null;}catch(_){return null;}
}

function style(){
  if(document.getElementById('soreal-idle-stats-detail-style-v1'))return;
  var st=document.createElement('style');
  st.id='soreal-idle-stats-detail-style-v1';
  st.textContent=
    '.soreal-idle-summary-v28:has(#sorealIdleSummaryAttackV50),.soreal-idle-summary-v28:has(#sorealIdleSummaryDefenseV50){cursor:pointer;position:relative}'+
    '.soreal-idle-summary-v28:has(#sorealIdleSummaryAttackV50)::after,.soreal-idle-summary-v28:has(#sorealIdleSummaryDefenseV50)::after{content:"ⓘ";position:absolute;top:6px;right:9px;font-size:13px;opacity:.55}'+
    '#soreal-idle-stats-detail-v1{position:fixed;inset:0;z-index:100003;background:rgba(4,8,18,.78);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}'+
    '#soreal-idle-stats-detail-v1 .boite{width:min(560px,100%);max-height:100%;overflow:auto;background:#182236;border:1px solid rgba(166,188,229,.25);border-radius:16px;padding:16px;color:#dce5f3;box-shadow:0 18px 50px rgba(0,0,0,.6)}'+
    '#soreal-idle-stats-detail-v1 h3{margin:0 0 4px;font-size:18px}'+
    '#soreal-idle-stats-detail-v1 h4{margin:14px 0 2px;font-size:15px;color:#a9c0ee}'+
    '#soreal-idle-stats-detail-v1 .aide{font-size:14px;color:#8fa3c9;margin:0 0 10px}'+
    '#soreal-idle-stats-detail-v1 .onglets{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}'+
    '#soreal-idle-stats-detail-v1 .onglets button{padding:6px 10px;font-size:13px;border-radius:9px}'+
    '#soreal-idle-stats-detail-v1 .onglets button.actif{background:#3a5a98;border-color:#8fb0f0;color:#fff}'+
    '#soreal-idle-stats-detail-v1 table{width:100%;border-collapse:collapse;font-size:14px}'+
    '#soreal-idle-stats-detail-v1 td{padding:6px 4px;border-bottom:1px solid rgba(166,188,229,.12);vertical-align:top}'+
    '#soreal-idle-stats-detail-v1 td.v{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}'+
    '#soreal-idle-stats-detail-v1 td small{display:block;color:#8fa3c9;font-size:13px;margin-top:2px}'+
    '#soreal-idle-stats-detail-v1 tr.total td{font-weight:800;border-bottom:0;padding-top:10px;font-size:15px}'+
    '#soreal-idle-stats-detail-v1 .actions{display:flex;justify-content:flex-end;margin-top:12px}'+
    '#soreal-idle-stats-detail-v1 button{padding:9px 16px;border-radius:10px;border:1px solid rgba(166,188,229,.3);background:#22314d;color:#eef4fc;font:600 14px system-ui,sans-serif;cursor:pointer}';
  document.head.appendChild(st);
}

/* ---------- Attack / Defense ---------- */

/* Total d'Attack / Defense : la MÊME formule que le moteur (idle-runtime-boss.js, statsCombatPrincipalSorealIdleV413_) :
   max(100, 100 × part « post » + arrondi((entraînement − 100 + boutique) × permanent × produit effectif)). Le « 100 » naturel reçoit la part post
   (tout sauf NUMBER, ITOPOD, équipement et Rich Jerks), jamais le NUMBER. */
function totalCombat(cle,cp,d){
  var base=Math.max(100,nb(cle==='attaque'?cp.attaqueEntrainement:cp.defenseEntrainement));
  var produit=nb(cle==='attaque'?cp.multiplicateurAttaqueTotal:cp.multiplicateurDefenseTotal);
  if(!(produit>0))produit=nb(d.produit)>0?nb(d.produit):1;
  var post=nb(cle==='attaque'?cp.multiplicateurAttaquePost:cp.multiplicateurDefensePost);
  var perm=nb(cp.multiplicateurPermanent)>0?nb(cp.multiplicateurPermanent):1;
  var boutique=Math.max(0,nb(cp.bonusBoutique));
  return {base:base,produit:produit,total:Math.max(100,100*post+Math.round((base-100+boutique)*perm*produit))};
}

function contenuCombat(cle){
  var e=etat();
  var cp=e&&e.combatPrincipal;
  var d=cp&&cp.detailStats&&cp.detailStats[cle];
  var nom=cle==='attaque'?'Attack':'Defense';
  var icone=cle==='attaque'?'⚔️':'🛡️';
  if(!d)return '<h3>'+icone+' Détail : '+nom+'</h3><p class="aide">Le détail n’est pas encore disponible. Réessaie dans un instant.</p>';
  var t=totalCombat(cle,cp,d);
  var produit=t.produit;
  var diviseur=cp.detailStats.panneauxStats&&nb(cp.detailStats.panneauxStats.diviseur)>1?nb(cp.detailStats.panneauxStats.diviseur):1;
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
      note='<small>'+(cle==='attaque'?'Puissance':'Endurance')+' porté : '+String(Math.round(pts*100)/100).replace('.',',')+(cube>0?' (dont '+String(Math.round(cube*100)/100).replace('.',',')+' de l’Infinity Cube)':'')+' · boosts appliqués compris · 1 point = +1 %</small>';
    }
    lignes+='<tr><td>'+esc(f.label)+note+'</td><td class="v">'+facteur(v)+'<small>'+pct(v)+'</small></td></tr>';
  });
  /* « autres » est mesuré sur le produit effectif, DÉJÀ divisé par la difficulté : on remet le diviseur à part, sur sa propre ligne. */
  var autres=nb(d.autres)*diviseur;
  var autresActif=autres>0&&Math.abs(autres-1)>1e-9;
  if(autresActif)lignes+='<tr><td>Autres bonus</td><td class="v">'+facteur(autres)+'<small>'+pct(autres)+'</small></td></tr>';
  if(diviseur>1)lignes+='<tr><td>Difficulty DIVIDER<small>Evil / Sadistic : le joueur est divisé, le plancher de 100 s’applique au total</small></td><td class="v">÷ '+grand(diviseur)+'</td></tr>';
  var actifs=(d.facteurs||[]).length-neutres+(autresActif?1:0);
  if(neutres)lignes+='<tr><td style="color:#8fa3c9">'+(actifs>0?neutres+' autre'+(neutres>1?'s':'')+' facteur'+(neutres>1?'s':'')+' à ×1':'Aucun bonus actif pour l’instant')+'</td><td class="v" style="color:#8fa3c9">×1,0000</td></tr>';
  return '<h3>'+icone+' Détail : '+nom+'</h3>'+
    '<p class="aide">'+nom+' = 100 × (bonus appliqués au 100 naturel) + (Basic Training − 100) × produit des facteurs. Ce sont exactement les chiffres utilisés en combat.</p>'+
    '<table>'+
      '<tr><td>Basic Training<small>100 + Σ niveau<sup>1,3</sup> × valeur de base</small></td><td class="v">'+grand(t.base)+'</td></tr>'+
      lignes+
      '<tr><td>Produit des facteurs</td><td class="v">'+facteur(produit)+'<small>'+pct(produit)+'</small></td></tr>'+
      '<tr class="total"><td>'+nom+'</td><td class="v">'+grand(t.total)+'</td></tr>'+
    '</table>';
}

/* ---------- Panneaux du serveur ---------- */

function formatValeur(v,f,sec){
  if(f==='p')return pourcent(v);
  if(f==='ps')return pourcent(v)+(sec!=null?' ('+secondes(sec)+')':'');
  return grand(v);
}

function ligneFacteur(x){
  var v=nb(x.v);
  if(x.op==='/')return '<tr><td>'+esc(x.l)+'</td><td class="v">÷ '+grand(v)+'</td></tr>';
  return '<tr><td>'+esc(x.l)+'</td><td class="v">'+facteur(v)+'<small>'+pct(v)+'</small></td></tr>';
}

function sectionHtml(s){
  var h='';
  if(s.t)h+='<h4>'+esc(s.t)+'</h4>';
  h+='<table>';
  if(s.base){
    h+='<tr><td>'+esc(s.base.l)+(s.baseDont>0?'<small>dont '+grand(s.baseDont)+' de bonus fixes</small>':'')+'</td><td class="v">'+formatValeur(s.base.v,s.base.f)+'</td></tr>';
  }
  (s.lignes||[]).forEach(function(x){h+=ligneFacteur(x);});
  if(!(s.lignes||[]).length)h+='<tr><td style="color:#8fa3c9">Aucun bonus actif pour l’instant</td><td class="v" style="color:#8fa3c9">×1,0000</td></tr>';
  h+='<tr class="total"><td>'+esc(s.total.l)+'</td><td class="v">'+formatValeur(s.total.v,s.total.f,s.total.secondes)+'</td></tr>';
  h+='</table>';
  if(s.note)h+='<p class="aide">'+esc(s.note)+'</p>';
  return h;
}

function contenuPanneau(id){
  var e=etat();
  var ps=e&&e.combatPrincipal&&e.combatPrincipal.detailStats&&e.combatPrincipal.detailStats.panneauxStats;
  var p=ps&&ps.panneaux&&ps.panneaux[id];
  if(!p)return '<h3>Détail</h3><p class="aide">Le détail n’est pas encore disponible. Réessaie dans un instant.</p>';
  var h='<h3>'+esc(p.t)+'</h3>';
  if(p.divers){
    h+='<table>';
    p.divers.forEach(function(x){h+='<tr><td>'+esc(x.l)+'</td><td class="v">'+grand(x.v)+'</td></tr>';});
    h+='</table>';
    return h;
  }
  if(id==='ngu'||id==='barbes'||id==='wandoos'||id==='augments'){
    h+='<p class="aide">Chaque ligne est un facteur réellement multiplié par le moteur ; seuls les facteurs actifs sont nommés.</p>';
  }else{
    h+='<p class="aide">Chaque ligne est un facteur réellement multiplié par le moteur ; le total est la valeur utilisée en jeu.</p>';
  }
  (p.sections||[]).forEach(function(s){h+=sectionHtml(s);});
  return h;
}

/* ---------- Onglets ---------- */

var NOMS={attaque:'Attack',defense:'Defense',energie:'Énergie',magie:'Magie',ressource3:'Ressource 3',augments:'Augmentations',ngu:'NGU',barbes:'Barbes',wandoos:'Wandoos',gains:'EXP / AP / PP',aventure:'Aventure',divers:'Divers'};
var ORDRE=['attaque','defense','energie','magie','ressource3','augments','ngu','barbes','wandoos','gains','aventure','divers'];

function ongletsDisponibles(){
  var e=etat();
  var ps=e&&e.combatPrincipal&&e.combatPrincipal.detailStats&&e.combatPrincipal.detailStats.panneauxStats;
  var panneaux=ps&&ps.panneaux?ps.panneaux:{};
  return ORDRE.filter(function(id){return id==='attaque'||id==='defense'||!!panneaux[id];});
}

function contenu(cle){
  var corps=(cle==='attaque'||cle==='defense')?contenuCombat(cle):contenuPanneau(cle);
  var ids=ongletsDisponibles();
  var barre='';
  if(ids.length>2){
    barre='<div class="onglets" role="tablist">'+ids.map(function(id){
      return '<button type="button" role="tab" data-stats-onglet="'+id+'"'+(id===cle?' class="actif" aria-selected="true"':'')+'>'+esc(NOMS[id])+'</button>';
    }).join('')+'</div>';
  }
  return barre+corps+'<div class="actions"><button type="button" id="soreal-idle-stats-detail-fermer-v1">Fermer</button></div>';
}

function fermer(){
  OUVERT=null;DERNIER='';
  if(MINUTEUR){clearInterval(MINUTEUR);MINUTEUR=0;}
  var o=document.getElementById('soreal-idle-stats-detail-v1');if(o)o.remove();
}

function dessiner(){
  var o=document.getElementById('soreal-idle-stats-detail-v1');
  if(!o||!OUVERT)return;
  var html=contenu(OUVERT);
  if(html===DERNIER)return;/* aucun redessin si rien n'a changé */
  DERNIER=html;
  var boite=o.querySelector('.boite');
  var haut=boite?boite.scrollTop:0;
  if(boite)boite.innerHTML=html;
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
  o.addEventListener('click',function(ev){
    var b=ev.target&&ev.target.closest?ev.target.closest('[data-stats-onglet]'):null;
    if(b){OUVERT=b.getAttribute('data-stats-onglet');DERNIER='';dessiner();}
  });
  dessiner();
  /* Les niveaux évoluent en continu : le détail suit. */
  MINUTEUR=setInterval(function(){if(!document.hidden)dessiner();},1000);
}

style();
document.addEventListener('click',function(ev){
  var d=ev.target&&ev.target.closest?ev.target.closest('[data-stats-panneau]'):null;
  if(d){ev.preventDefault();ev.stopPropagation();ouvrir(d.getAttribute('data-stats-panneau'));return;}
  var t=ev.target&&ev.target.closest?ev.target.closest('.soreal-idle-summary-v28'):null;
  if(!t)return;
  if(t.querySelector('#sorealIdleSummaryAttackV50'))ouvrir('attaque');
  else if(t.querySelector('#sorealIdleSummaryDefenseV50'))ouvrir('defense');
});
document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&OUVERT)fermer();});

window.__SOREAL_IDLE_STATS_DETAIL_V1__={ouvrir:ouvrir,fermer:fermer,contenu:contenu};
})();
