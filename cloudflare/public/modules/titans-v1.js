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
  return '<div class="ttn-stat"><span class="ttn-stat-i">'+icone+'</span><b data-ttn-stat="'+cle+'">'+valeur+'</b><span class="ttn-stat-l">'+libelle+'</span></div>';
}
function htmlStats(v){
  if(!v)return '<div class="ttn-note">Statistiques indisponibles.</div>';
  return ligneStat('❤️','PV','hp',gn(v.hp,2))+
    ligneStat('⚔️','Puissance','power',gn(v.power,2))+
    ligneStat('🛡️','Endurance','toughness',gn(v.toughness,2))+
    ligneStat('💚','Régénération par seconde','regen',gn(v.regen,2))+
    ligneStat('⏱️','Une attaque toutes les','attackRate',String(v.attackRate).replace('.',',')+' s');
}
/* Stats d'aventure du joueur (celles que le serveur compare au titan : Power et Toughness), ou null si l'état n'est pas encore chargé. */
function statsJoueur(){
  try{
    var etat=typeof window.__SOREAL_IDLE_LIRE_ETAT_V1__==='function'?window.__SOREAL_IDLE_LIRE_ETAT_V1__():null;
    var st=etat&&etat.systemes&&etat.systemes.adventure&&etat.systemes.adventure.stats;
    if(!st)return null;
    var p=Number(st.power),to=Number(st.toughness);
    return {power:Number.isFinite(p)?p:0,toughness:Number.isFinite(to)?to:0};
  }catch(e){return null;}
}
/* Un chiffre actuel : vert s'il atteint la stat conseillée, rouge sinon. */
function chiffreActuel(actuel,requis){
  return '<span class="ttn-ok-'+(actuel>=requis?'oui':'non')+'">'+gn(actuel,2)+'</span>';
}
/* Une ligne (Puissance ou Endurance) : ce que le titan demande, ce que tu as, et une jauge qui se remplit jusqu'à la stat conseillée. */
function ligneComparaison(icone,nom,requis,actuel){
  var ok=actuel!=null&&actuel>=requis;
  var pct=actuel==null?0:(requis>0?Math.max(0,Math.min(100,actuel/requis*100)):100);
  return '<div class="ttn-ligne"><span class="ttn-cat">'+icone+' '+nom+'</span>'+
    '<span class="ttn-reco-g">'+gn(requis,2)+'</span>'+
    '<span class="ttn-reco-d">'+(actuel==null?'—':chiffreActuel(actuel,requis))+'</span>'+
    '<div class="ttn-jauge '+(actuel==null?'':ok?'oui':'non')+'"><i style="width:'+pct.toFixed(1)+'%"></i></div></div>';
}
function seuilsRecommandes(t,palier){
  var s=null;
  if(Array.isArray(t.forms)&&t.forms.length)s=t.forms[formeIndex(t)];
  else if(t.difficulties&&typeof t.difficulties==='object')s=t.difficulties[palier]||t.difficulties[Object.keys(t.difficulties)[0]];
  else s=t;
  if(!s)return '';
  /*
   * Comparaison très visible (Norman, 2026-10-04 puis 2026-10-07 : « les stats conseillées et actuelles doivent être plus visibles ») : pour chacun des trois modes (Manuel, Idle, Auto-kill),
   * la Puissance et l'Endurance conseillées à gauche, les tiennes à droite (vert si tu atteins la stat, rouge sinon), une jauge de progression et un verdict clair.
   */
  var moi=statsJoueur();
  var blocs=[];
  function ajouter(nom,p,tt){
    if(p==null||tt==null)return;
    var okP=moi&&moi.power>=p,okT=moi&&moi.toughness>=tt;
    var verdict='';
    if(!moi)verdict='<span class="ttn-verdict">Tes stats se chargent…</span>';
    else if(okP&&okT)verdict='<span class="ttn-verdict oui">✅ Prêt</span>';
    else{
      var manque=[];
      if(!okP)manque.push('⚔️ '+gn(p-moi.power,2));
      if(!okT)manque.push('🛡️ '+gn(tt-moi.toughness,2));
      verdict='<span class="ttn-verdict non">❌ Pas encore : il te manque '+manque.join(' et ')+'</span>';
    }
    blocs.push('<div class="ttn-mode '+(!moi?'':okP&&okT?'oui':'non')+'"><div class="ttn-mode-haut"><b class="ttn-mode-nom">'+h(nom)+'</b>'+verdict+'</div>'+
      ligneComparaison('⚔️','Puissance',p,moi?moi.power:null)+
      ligneComparaison('🛡️','Endurance',tt,moi?moi.toughness:null)+'</div>');
  }
  ajouter('Manuel',s.p,s.t);
  ajouter('Idle',s.idleP,s.idleT);
  ajouter('Auto-kill',s.autoKillP,s.autoKillT);
  if(!blocs.length)return '';
  return '<div class="ttn-reco"><div class="ttn-comp-titre">⚖️ Es-tu assez costaud ?</div>'+
    '<div class="ttn-comp-aide">À gauche : ce que ce Titan te demande. À droite : ce que tu as vraiment. Vert : tu passes. Rouge : va t’entraîner, il ne fera pas de cadeau.</div>'+
    '<div class="ttn-tete"><b class="ttn-reco-g">Stats conseillées</b><b class="ttn-reco-d">Stats actuelles</b></div>'+blocs.join('')+'</div>';
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
      '</ul><div class="ttn-note">'+h((window.SorealTitanComportementsV1&&window.SorealTitanComportementsV1.note(id))||'Les capacités spéciales sont décrites ici mais pas encore simulées : le combat utilise les statistiques de base du titan.')+'</div></details>'
    :'';
  return '<article class="ttn-carte '+(pret?'pret':cache(t)?'cache':'attente')+'" data-ttn-id="'+h(id)+'">'+
    '<div class="ttn-haut">'+
      '<div class="ttn-portrait"><img id="ttnImg_'+h(id)+'" src="'+h(urlImage(t,palier))+'" alt="'+h(nom)+'" loading="lazy" '+
        'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><span class="ttn-emoji" style="display:none">👹</span></div>'+
      '<div class="ttn-id">'+
        '<h3 class="ttn-nom">'+h(nom)+(forme>=0?' <small>(forme '+(forme+1)+' / '+t.forms.length+')</small>':'')+'</h3>'+
        '<div class="ttn-sous">💀 '+kills+' victoire'+(kills>1?'s':'')+'</div>'+
        statut+
      '</div>'+
    '</div>'+
    '<div class="ttn-sous-titre">Ses statistiques</div><div class="ttn-stats" id="ttnStats_'+h(id)+'">'+htmlStats(v)+'</div>'+
    '<div id="ttnReco_'+h(id)+'">'+seuilsRecommandes(t,palier)+'</div>'+
    capacites+
    '<div class="ttn-actions">'+selecteur+
      '<label class="ttn-auto" title="Le titan est vaincu tout seul, en ligne comme hors ligne, dès que tu as les stats Auto-kill."><input type="checkbox" id="ttnAuto_'+h(id)+'" '+(t.state&&t.state.autoKill===true?'checked ':'')+'onchange="window.__autoKillTitanV1__(\''+h(id)+'\',this.checked)"> 🤖 Auto-kill</label>'+
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
    '.ttn-sous-titre{margin-top:14px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;font-size:12px;color:var(--th-dim,#c79a85)}'+
    '.ttn-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:8px;margin-top:6px}'+
    '.ttn-stat{display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px;padding:9px 6px;border-radius:12px;background:rgba(0,0,0,.34);border:1px solid var(--th-line,rgba(255,255,255,.14))}'+
    '.ttn-stat-i{font-size:20px}'+
    '.ttn-stat b{font-size:21px;line-height:1.1;color:#fff;font-variant-numeric:tabular-nums}'+
    '.ttn-stat-l{font-size:12px;color:var(--th-dim,#c79a85);line-height:1.2}'+
    '.ttn-reco{margin-top:16px;padding:12px 13px;border-radius:14px;background:rgba(0,0,0,.4);border:2px solid var(--th-line,rgba(255,122,26,.45))}'+
    '.ttn-comp-titre{font-size:19px;font-weight:900;color:var(--th-c,#ffd166)}'+
    '.ttn-comp-aide{margin:3px 0 10px;font-size:13px;line-height:1.4;color:var(--th-dim,#c79a85)}'+
    '.ttn-tete{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin-bottom:6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase}'+
    '.ttn-tete b:last-child{text-align:right}'+
    '.ttn-reco b{color:var(--th-ink,#ffe7d6)}'+
    '.ttn-mode{margin-top:8px;padding:9px 10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.14);border-left-width:6px}'+
    '.ttn-mode.oui{border-left-color:#34d399}.ttn-mode.non{border-left-color:#f87171}'+
    '.ttn-mode-haut{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:4px 10px;margin-bottom:6px}'+
    '.ttn-mode-nom{font-size:17px;text-transform:uppercase;letter-spacing:.08em}'+
    '.ttn-verdict{font-size:13px;font-weight:800;color:var(--th-dim,#c79a85)}.ttn-verdict.oui{color:#34d399}.ttn-verdict.non{color:#fca5a5}'+
    '.ttn-ligne{display:grid;grid-template-columns:minmax(86px,auto) minmax(0,1fr) minmax(0,1fr);column-gap:10px;align-items:baseline;margin-top:5px}'+
    '.ttn-cat{font-size:13px;color:var(--th-dim,#c79a85)}'+
    '.ttn-reco-g{font-size:19px;font-weight:800;font-variant-numeric:tabular-nums}'+
    '.ttn-reco-d{font-size:19px;font-weight:900;text-align:right;font-variant-numeric:tabular-nums}'+
    '.ttn-tete .ttn-reco-g,.ttn-tete .ttn-reco-d{font-size:12px;font-weight:900}'+
    '.ttn-jauge{grid-column:1/-1;height:8px;margin-top:3px;border-radius:999px;background:rgba(0,0,0,.55);overflow:hidden;border:1px solid rgba(255,255,255,.16)}'+
    '.ttn-jauge i{display:block;height:100%;border-radius:999px;background:#6b7280}'+
    '.ttn-jauge.oui i{background:linear-gradient(90deg,#059669,#34d399)}.ttn-jauge.non i{background:linear-gradient(90deg,#b91c1c,#f87171)}'+
    '.ttn-ok-oui{color:#34d399;font-weight:900}.ttn-ok-non{color:#f87171;font-weight:900}'+
    '.ttn-details{margin-top:9px;font-size:13px}'+
    '.ttn-details summary{cursor:pointer;font-weight:800}'+
    '.ttn-details ul{margin:7px 0 0;padding-left:18px;line-height:1.5}'+
    '.ttn-note{margin-top:7px;font-size:12px;opacity:.7;font-style:italic}'+
    '.ttn-actions{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:12px}'+
    '.ttn-auto{font-size:14px;font-weight:800;display:flex;align-items:center;gap:7px;cursor:pointer}.ttn-auto input{width:20px;height:20px;accent-color:var(--th-a,#ff7a1a)}'+
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

/* Section intégrée à la page Adventure (le menu Titans n'existe plus) : même grille de cartes, sans en-tête de page ; vide s'il n'y a aucun titan débloqué (anti-spoil). */
function section(j){
  css();
  /* styles de la bascule Aventure / Titans */
  var H=hote();
  var a=typeof H.aventureMetaIdleV47_==='function'?H.aventureMetaIdleV47_(j):null;
  var titans=(a&&Array.isArray(a.titans)?a.titans:[]).filter(function(t){return t&&t.progressionUnlocked!==false&&t.id;});
  if(!titans.length)return '';
  return '<div class="ttn-grille">'+titans.map(carte).join('')+'</div>';
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

window.__autoKillTitanV1__=function(id,actif){
  if(typeof window.__actionMetaV47__==='function')window.__actionMetaV47__({action:'adventure',adventure:{action:'setAutoKillTitan',id:String(id),enabled:Boolean(actif)}});
};

window.__affronterTitanV1__=function(id){
  var t=registre[id];
  if(!t)return;
  var sel=document.getElementById('ttnPalier_'+id);
  var etat=typeof window.__SOREAL_IDLE_LIRE_ETAT_V1__==='function'?window.__SOREAL_IDLE_LIRE_ETAT_V1__():null;
  var charge={action:'startTitanFight',titan:String(id)};
  if(sel&&sel.value)charge.difficulty=String(sel.value);
  if(etat&&etat.adventureRestPv!=null)charge.restHp=etat.adventureRestPv;
  if(typeof window.__vueAventureIdleV1__==='function')window.__vueAventureIdleV1__('zones');
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

/* Ce titan sera-t-il vaincu tout seul (case Auto-kill cochée ET stats Auto-kill atteintes) ? Alors il n'y a rien à faire : ni bouton qui brille, ni icône. */
function seTueTout(t){
  if(!(t.state&&t.state.autoKill===true))return false;
  var moi=statsJoueur();
  if(!moi)return false;
  function ok(s){return s&&Number(s.autoKillP)>0&&moi.power>=Number(s.autoKillP)&&moi.toughness>=Number(s.autoKillT);}
  var kills=ent(t.state&&t.state.kills);
  if(Array.isArray(t.forms)&&t.forms.length)return kills>=t.forms.length&&ok(t.forms[t.forms.length-1]);
  if(t.difficulties&&typeof t.difficulties==='object'){
    return Object.keys(t.difficulties).some(function(k){
      var e=t.difficulties[k];
      return ok(e)||(e&&e.autoKillKills&&ent((t.state.difficultyKills||{})[k])>=e.autoKillKills);
    });
  }
  return ok(t);
}

/* Premier titan à affronter (prêt, pas auto-tué) : sert à l'icône animée du bandeau Aventure / Titans. */
function premierDisponible(j){
  var H=hote();
  var a=typeof H.aventureMetaIdleV47_==='function'?H.aventureMetaIdleV47_(j):null;
  var maintenant=(typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now());
  var liste=(a&&Array.isArray(a.titans)?a.titans:[]).filter(function(t){return t&&t.progressionUnlocked!==false&&t.id&&!cache(t)&&!(prochainRetour(t)>maintenant)&&!seTueTout(t);});
  return liste[0]||null;
}
function icone(j){
  var t=premierDisponible(j);
  if(!t)return '';
  var palier=t.difficulties&&typeof t.difficulties==='object'?Object.keys(t.difficulties)[0]:'';
  return '<span class="soreal-idle-titan-icone-v1" aria-hidden="true"><img src="'+h(urlImage(t,palier))+'" alt="" loading="lazy" onerror="this.style.display=\'none\'"></span>';
}

/* Un titan est-il prêt à être affronté (débloqué, pas caché, délai écoulé) ? Sert au bouton « Titans » de la page Adventure, qui brille alors. */
function disponible(j){
  var H=hote();
  var a=typeof H.aventureMetaIdleV47_==='function'?H.aventureMetaIdleV47_(j):null;
  var maintenant=(typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now());
  return (a&&Array.isArray(a.titans)?a.titans:[]).some(function(t){return t&&t.progressionUnlocked!==false&&t.id&&!cache(t)&&!(prochainRetour(t)>maintenant)&&!seTueTout(t);});
}

window.__SOREAL_IDLE_TITANS_V1__={page:page,section:section,disponible:disponible,icone:icone,seTueTout:seTueTout,traduire:traduire,duree:duree,cleVariante:cleVariante,textes:{MESSAGES_ERREUR:MESSAGES_ERREUR}};
})();
