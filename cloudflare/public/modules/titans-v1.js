/*
 * Menu Titans (Norman, 2026-10-02) : « Où apparaît le titan quand on l'affronte ? Il n'y a pas de timer. On doit voir son image, sa barre de vie…
 * Là c'est un bête menu avec activer et affronter. C'est pas du tout comme ça dans le jeu de base. »
 *
 * Le menu liste les titans déjà débloqués (anti-spoil : jamais un titan encore verrouillé) avec leur image, leur état (prêt ou compte à rebours de
 * réapparition), leurs statistiques de combat du wiki (PV, Power, Toughness, régénération, cadence) et leurs capacités. « Affronter » fait apparaître
 * le titan comme ennemi dans la scène d'Aventure (voir startTitanFight, idle-adventure-v47.js), avec sa barre de vie, ses attaques manuelles et le
 * mode Idle : comme dans le jeu de base, on le combat en mode Aventure.
 *
 *   window.__SOREAL_IDLE_TITANS_V1__ = { page(j), traduire(code) }
 */
(function(){
'use strict';

var MESSAGES_ERREUR={
  TITAN_VERROUILLE:'Ce titan n’est pas encore accessible.',
  TITAN_EN_REAPPARITION:'Ce titan n’est pas encore réapparu : attends la fin du compte à rebours.',
  TITAN_CACHE:'Ce titan se cache : trouve-le d’abord.',
  DIFFICULTE_EVIL_REQUISE:'Ce titan n’apparaît qu’en difficulté Evil ou supérieure.',
  DIFFICULTE_SADISTIC_REQUISE:'Ce titan n’apparaît qu’en difficulté Sadistic.',
  PROTECTION_TITAN_REQUISE:'Il te manque une protection pour affronter ce titan.',
  PROGRESSION_TITAN_REQUISE:'Il te manque une étape de progression pour affronter ce titan.',
  COMBAT_TITAN_TROP_COURT:'Le combat ne peut pas déjà être terminé.',
  TITAN_SANS_STATS:'Les statistiques de ce titan ne sont pas disponibles.',
  AUCUN_COMBAT_ACTIF:'Aucun combat n’est en cours.'
};
var LIBELLES_PALIERS={easy:'Easy',normal:'Normal',hard:'Hard',brutal:'Brutal'};
var MENUS_WALDERP={combat:'Fight Boss',entrainement:'Basic Training',inventaire:'Inventory',bestiaire:'Bestiary',parametres:'Settings'};
var registre={};

function hote(){return window.__SOREAL_IDLE_META_HOST_V130__||{};}
function h(x){var f=hote().idleHtml_;return typeof f==='function'?f(x):String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function ent(x){var f=hote().idleEntier_;return typeof f==='function'?f(x):Math.floor(Number(x)||0);}
function gn(x,d){var f=hote().formatGrandNombreIdleV70_;return typeof f==='function'?f(x,d):String(x);}
function traduire(message){var m=String(message==null?'':message);return MESSAGES_ERREUR[m]||m;}

function duree(ms){
  var s=Math.max(0,Math.ceil(ms/1000));
  var hh=Math.floor(s/3600),mm=Math.floor((s%3600)/60),ss=s%60;
  var p=function(n){return (n<10?'0':'')+n;};
  return hh>0?hh+':'+p(mm)+':'+p(ss):mm+':'+p(ss);
}

/* Clé de la variante de stats affichée : forme courante (Walderp), palier choisi (titans à difficultés) ou unique. */
function cleVariante(t,palier){
  var kills=ent(t.state&&t.state.kills);
  if(Array.isArray(t.forms)&&t.forms.length)return String(Math.min(kills,t.forms.length-1));
  if(t.difficulties&&typeof t.difficulties==='object')return palier&&t.difficulties[palier]?palier:Object.keys(t.difficulties)[0];
  return '';
}
function variante(t,palier){
  var c=t.combat||{};
  return c[cleVariante(t,palier)]||c['']||null;
}
function formeIndex(t){
  return Array.isArray(t.forms)&&t.forms.length?Math.min(ent(t.state&&t.state.kills),t.forms.length-1):-1;
}
function urlImage(t,palier){
  var p='id='+encodeURIComponent(String(t.id));
  var f=formeIndex(t);
  if(f>=0)p+='&form='+f;
  else if(palier)p+='&tier='+encodeURIComponent(palier);
  return '/api/idle/media/titan?'+p;
}

function prochainRetour(t){
  var n=t.state&&t.state.nextAt;
  var v=Number(n);
  return Number.isFinite(v)&&v>0?v:0;
}
function cache(t){return Boolean(t.state&&t.state.hiddenPanel);}

function ligneStat(icone,libelle,cle,valeur){
  return '<div class="ttn-stat"><span class="ttn-stat-i">'+icone+'</span><span class="ttn-stat-l">'+libelle+'</span><b data-ttn-stat="'+cle+'">'+valeur+'</b></div>';
}
function htmlStats(v){
  if(!v)return '<div class="ttn-note">Statistiques indisponibles.</div>';
  return ligneStat('❤️','PV','hp',gn(v.hp,2))+
    ligneStat('⚔️','Power','power',gn(v.power,2))+
    ligneStat('🛡️','Toughness','toughness',gn(v.toughness,2))+
    ligneStat('💚','Régénération / s','regen',gn(v.regen,2))+
    ligneStat('⏱️','Une attaque toutes les','attackRate',String(v.attackRate).replace('.',',')+' s');
}
function seuilsRecommandes(t,palier){
  var s=null;
  if(Array.isArray(t.forms)&&t.forms.length)s=t.forms[formeIndex(t)];
  else if(t.difficulties&&typeof t.difficulties==='object')s=t.difficulties[palier]||t.difficulties[Object.keys(t.difficulties)[0]];
  else s=t;
  if(!s)return '';
  var morceaux=[];
  if(s.p!=null&&s.t!=null)morceaux.push('Manuel : ⚔️ '+gn(s.p,2)+' · 🛡️ '+gn(s.t,2));
  if(s.idleP!=null&&s.idleT!=null)morceaux.push('Idle : ⚔️ '+gn(s.idleP,2)+' · 🛡️ '+gn(s.idleT,2));
  if(s.autoKillP!=null&&s.autoKillT!=null)morceaux.push('Auto-kill : ⚔️ '+gn(s.autoKillP,2)+' · 🛡️ '+gn(s.autoKillT,2));
  return morceaux.length?'<div class="ttn-reco"><b>Stats conseillées</b><br>'+morceaux.map(h).join('<br>')+'</div>':'';
}

function carte(t){
  var id=String(t.id);
  var palier=t.difficulties&&typeof t.difficulties==='object'?Object.keys(t.difficulties)[0]:'';
  var v=variante(t,palier);
  registre[id]=t;
  var kills=ent(t.state&&t.state.kills);
  var retour=prochainRetour(t);
  var maintenant=(typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now());
  var enAttente=!cache(t)&&retour>maintenant;
  var pret=!cache(t)&&!enAttente;
  var statut=cache(t)
    ?'<span class="ttn-etat cache">👻 Caché quelque part…</span>'
    :enAttente
      ?'<span class="ttn-etat attente">⏳ Réapparition dans <b data-ttn-cd="'+retour+'">'+duree(retour-maintenant)+'</b></span>'
      :'<span class="ttn-etat pret">✅ Prêt à être affronté</span>';
  var selecteur=t.difficulties&&typeof t.difficulties==='object'
    ?'<label class="ttn-palier">Difficulté <select id="ttnPalier_'+h(id)+'" onchange="window.__changerPalierTitanV1__(\''+h(id)+'\',this.value)">'+
        Object.keys(t.difficulties).map(function(k){return '<option value="'+h(k)+'">'+h(LIBELLES_PALIERS[k]||k)+'</option>';}).join('')+
      '</select></label>'
    :'';
  var forme=formeIndex(t);
  var nom=String(t.nomComplet||t.name||id);
  var capacites=Array.isArray(t.capacites)&&t.capacites.length
    ?'<details class="ttn-details"><summary>📜 Capacités</summary><ul>'+t.capacites.map(function(c){return '<li>'+h(c)+'</li>';}).join('')+
      '</ul><div class="ttn-note">Les capacités spéciales sont décrites ici mais pas encore simulées : le combat utilise les statistiques de base du titan.</div></details>'
    :'';
  return '<article class="ttn-carte '+(pret?'pret':cache(t)?'cache':'attente')+'" data-ttn-id="'+h(id)+'">'+
    '<div class="ttn-haut">'+
      '<div class="ttn-portrait"><img id="ttnImg_'+h(id)+'" src="'+h(urlImage(t,palier))+'" alt="'+h(nom)+'" loading="lazy" '+
        'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><span class="ttn-emoji" style="display:none">👹</span></div>'+
      '<div class="ttn-id">'+
        '<h3 class="ttn-nom">'+h(nom)+(forme>=0?' <small>(forme '+(forme+1)+' / '+t.forms.length+')</small>':'')+'</h3>'+
        '<div class="ttn-sous">'+kills+' victoire'+(kills>1?'s':'')+'</div>'+
        statut+
      '</div>'+
    '</div>'+
    '<div class="ttn-stats" id="ttnStats_'+h(id)+'">'+htmlStats(v)+'</div>'+
    '<div id="ttnReco_'+h(id)+'">'+seuilsRecommandes(t,palier)+'</div>'+
    capacites+
    '<div class="ttn-actions">'+selecteur+
      '<button type="button" class="soreal-idle-expand-button-v25 ttn-bouton" id="ttnBtn_'+h(id)+'" '+(pret?'':'disabled ')+'onclick="window.__affronterTitanV1__(\''+h(id)+'\')">⚔️ Affronter</button>'+
    '</div>'+
  '</article>';
}

function css(){
  if(document.getElementById('sorealIdleTitansStyleV1'))return;
  var st=document.createElement('style');
  st.id='sorealIdleTitansStyleV1';
  st.textContent=
    '.ttn-grille{display:grid;gap:14px}'+
    '.ttn-carte{position:relative;border:2px solid var(--th-line,rgba(255,122,26,.5));border-radius:16px;padding:12px;color:var(--th-ink,#ffe7d6);overflow:hidden;'+
      'background:linear-gradient(170deg,var(--th-bg,#2a1814),var(--th-bg2,#130a09));box-shadow:0 0 0 3px rgba(0,0,0,.4),0 14px 26px -16px var(--th-glow,rgba(255,122,26,.5))}'+
    '.ttn-carte.attente{filter:saturate(.8)}'+
    '.ttn-haut{display:flex;gap:12px;align-items:center}'+
    '.ttn-portrait{flex:0 0 112px;height:112px;border-radius:14px;overflow:hidden;border:2px solid var(--th-a,#ff7a1a);background:#0d0605;display:flex;align-items:center;justify-content:center;box-shadow:0 0 18px -4px var(--th-glow,rgba(255,122,26,.6))}'+
    '.ttn-portrait img{width:100%;height:100%;object-fit:contain;display:block}'+
    '.ttn-emoji{font-size:56px;align-items:center;justify-content:center;width:100%;height:100%}'+
    '.ttn-id{min-width:0;flex:1}'+
    '.ttn-nom{margin:0;font-family:Georgia,"Palatino Linotype",serif;font-size:19px;letter-spacing:.03em;color:var(--th-c,#ffd166);text-shadow:0 0 14px var(--th-glow,rgba(255,122,26,.5))}'+
    '.ttn-nom small{font-size:12px;opacity:.8}'+
    '.ttn-sous{font-size:13px;color:var(--th-dim,#c79a85);margin-top:2px}'+
    '.ttn-etat{display:inline-block;margin-top:6px;padding:4px 11px;border-radius:999px;font-size:13px;font-weight:800;border:1px solid currentColor;background:rgba(0,0,0,.35)}'+
    '.ttn-etat.pret{color:#34d399}.ttn-etat.attente{color:#fbbf24}.ttn-etat.cache{color:#a78bfa}'+
    '.ttn-etat b{font-variant-numeric:tabular-nums;color:#fff}'+
    '.ttn-stats{display:grid;gap:5px;margin-top:12px;padding:9px 11px;border-radius:12px;background:rgba(0,0,0,.28);border:1px solid var(--th-line,rgba(255,255,255,.12))}'+
    '.ttn-stat{display:flex;align-items:baseline;gap:7px;font-size:14px}'+
    '.ttn-stat-l{color:var(--th-dim,#c79a85)}'+
    '.ttn-stat b{margin-left:auto;color:#fff;font-variant-numeric:tabular-nums}'+
    '.ttn-reco{margin-top:9px;font-size:13px;line-height:1.5;color:var(--th-dim,#c79a85)}'+
    '.ttn-reco b{color:var(--th-ink,#ffe7d6)}'+
    '.ttn-details{margin-top:9px;font-size:13px}'+
    '.ttn-details summary{cursor:pointer;font-weight:800}'+
    '.ttn-details ul{margin:7px 0 0;padding-left:18px;line-height:1.5}'+
    '.ttn-note{margin-top:7px;font-size:12px;opacity:.7;font-style:italic}'+
    '.ttn-actions{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:12px}'+
    '.ttn-palier{font-size:13px;display:flex;align-items:center;gap:7px}'+
    '.ttn-palier select{padding:5px 8px;border-radius:8px}'+
    '.ttn-bouton[disabled]{opacity:.45;cursor:not-allowed}';
  document.head.appendChild(st);
}

function page(j){
  css();
  var H=hote();
  var a=typeof H.aventureMetaIdleV47_==='function'?H.aventureMetaIdleV47_(j):null;
  var titans=(a&&Array.isArray(a.titans)?a.titans:[]).filter(function(t){return t&&t.progressionUnlocked!==false&&t.id;});
  var entete=typeof H.entetePageIdleV28_==='function'
    ?H.entetePageIdleV28_('👹 Titans','Des ennemis bien plus coriaces, qui réapparaissent après un délai. Le combat se déroule en Aventure, comme dans le jeu d’origine.')
    :'';
  if(!titans.length)return entete+'<div class="soreal-idle-note-v4">Rien à affronter pour le moment.</div>';
  return entete+'<div class="ttn-grille">'+titans.map(carte).join('')+'</div>';
}

/* ---------- interactions ---------- */
window.__changerPalierTitanV1__=function(id,palier){
  var t=registre[id];
  if(!t)return;
  var v=variante(t,palier);
  var el=document.getElementById('ttnStats_'+id);
  if(el)el.innerHTML=htmlStats(v);
  var reco=document.getElementById('ttnReco_'+id);
  if(reco)reco.innerHTML=seuilsRecommandes(t,palier);
  var img=document.getElementById('ttnImg_'+id);
  if(img){img.style.display='';if(img.nextElementSibling)img.nextElementSibling.style.display='none';img.src=urlImage(t,palier);}
};

window.__affronterTitanV1__=function(id){
  var t=registre[id];
  if(!t)return;
  var sel=document.getElementById('ttnPalier_'+id);
  var etat=typeof window.__SOREAL_IDLE_LIRE_ETAT_V1__==='function'?window.__SOREAL_IDLE_LIRE_ETAT_V1__():null;
  var charge={action:'startTitanFight',titan:String(id)};
  if(sel&&sel.value)charge.difficulty=String(sel.value);
  if(etat&&etat.adventureRestPv!=null)charge.restHp=etat.adventureRestPv;
  if(typeof window.__actionMetaV47__==='function')window.__actionMetaV47__({action:'adventure',adventure:charge});
};

/* Compte à rebours : une seule horloge pour toutes les cartes affichées ; à zéro, la carte passe en « prêt » sans attendre la synchro. */
setInterval(function(){
  var cds=document.querySelectorAll('[data-ttn-cd]');
  if(!cds.length)return;
  var maintenant=(typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now());
  cds.forEach(function(el){
    var fin=Number(el.getAttribute('data-ttn-cd'));
    var reste=fin-maintenant;
    if(reste>0){el.textContent=duree(reste);return;}
    var carteEl=el.closest('.ttn-carte');
    if(!carteEl)return;
    carteEl.classList.remove('attente');carteEl.classList.add('pret');
    var etat=carteEl.querySelector('.ttn-etat');
    if(etat){etat.className='ttn-etat pret';etat.textContent='✅ Prêt à être affronté';}
    var btn=carteEl.querySelector('.ttn-bouton');
    if(btn)btn.disabled=false;
  });
},1000);

window.__SOREAL_IDLE_TITANS_V1__={page:page,traduire:traduire,duree:duree,cleVariante:cleVariante,textes:{MESSAGES_ERREUR:MESSAGES_ERREUR}};
})();
