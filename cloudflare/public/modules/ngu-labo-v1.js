/*
 * SOREAL IDLE — page NGU, « le laboratoire » (Norman, 2026-10-08) : l'écran NGU reprend l'identité de l'écran NGU de NGU Idle (capture fournie par Norman) : fond gris clair, cadre en sucre d'orge rouge, vert et
 * blanc, un nom de couleur par NGU, champs blancs ; les barres y sont des FIOLES verticales, comme des alambics de laboratoire qui se remplissent.
 *
 * Couleurs : celles de la capture (échantillonnées sur l'image) pour les 9 NGU d'énergie. Les 7 NGU de magie ne figuraient pas sur la capture : leurs couleurs sont un choix de SOREAL, dans le même esprit.
 * Contrôles, comme dans le jeu d'origine : + / − (la quantité est celle de la case « Input » partagée avec les autres menus), « Target » (niveau à atteindre) et « Advance Energy » (voir src/idle-ngu-progression.js).
 *
 * Vivant : la hauteur du liquide est la progression vers le niveau suivant, rejouée en direct à partir du dernier état du serveur (progression + secondes par niveau), uniquement en transform (aucune repeinte lourde).
 *
 *   window.__SOREAL_IDLE_NGU_LABO_V1__ = { page(j), couleurs, aide(), ajuster(id,mode), cible(id,valeur), avance(ressource,coche), onglet(ressource), vider(ressource), preset(source,fraction) }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_NGU_LABO_V1__)return;

/* [couleur du liquide et du nom, couleur du texte du nom] */
var COULEURS={
  augments:['#868686','#0c0c0c'],
  wandoos:['#7a96f5','#030c29'],
  respawn:['#a6deb9','#061509'],
  gold:['#ffffa9','#0e1100'],
  adventureAlpha:['#f2bb6a','#120b00'],
  powerAlpha:['#ed3e3e','#220300'],
  dropChance:['#daf11a','#101300'],
  magicNgu:['#9e19f1','#ffffff'],
  pp:['#cfca15','#131100'],
  yggdrasil:['#58c46a','#04170a'],
  exp:['#62c0ff','#02131f'],
  powerBeta:['#ff7a59','#240800'],
  number:['#ffd34d','#1f1600'],
  timeMachine:['#b79bff','#12062e'],
  energyNgu:['#7ef0e0','#021a17'],
  adventureBeta:['#ff9de1','#2a0420']
};
/* Fiole d'alambic : contour (viewBox 100 x 150) ; les mêmes points, en pourcentages, découpent le liquide. */
var FIOLE=[[38,8],[62,8],[62,44],[70,58],[80,78],[90,104],[94,122],[90,138],[80,146],[20,146],[10,138],[6,122],[10,104],[20,78],[30,58],[38,44]];
var CONTOUR=FIOLE.map(function(p){return p[0]+','+p[1];}).join(' ');
var DECOUPE='polygon('+FIOLE.map(function(p){return p[0]+'% '+(Math.round(p[1]/1.5*100)/100)+'%';}).join(',')+')';

var onglet='energy';        // 'energy' | 'magic'
var timer=0;

function H_(){return window.__SOREAL_IDLE_META_HOST_V130__||null;}
function esc_(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function nombre_(v){var n=Number(v);return isFinite(n)?n:0;}
function format_(v,d){var H=H_();return H&&H.formatGrandNombreIdleV70_?H.formatGrandNombreIdleV70_(nombre_(v),d):String(Math.floor(nombre_(v)));}
function envoyer_(payload){
  var f=window.__envoyerAllocRapideIdleV1__;
  if(typeof f==='function')f(payload);
}

/* ---------- données ---------- */
function systemeNgu_(j){
  var l=j&&j.systemes&&Array.isArray(j.systemes.systems)?j.systemes.systems:[];
  for(var i=0;i<l.length;i+=1)if(l[i]&&l[i].id==='ngu')return l[i];
  return null;
}
function ngus_(j){return (j&&j.systemes&&j.systemes.ngus)||{};}
function listeCourante_(j){
  var ng=ngus_(j);
  return (ng.tiers&&ng.tiers[ng.tier||'normal'])||[];
}
function nguDe_(j,id){
  var l=listeCourante_(j);
  for(var i=0;i<l.length;i+=1)if(l[i].id===id)return l[i];
  return null;
}
function ressourceMagie_(j){return (j&&j.systemes&&j.systemes.resources&&j.systemes.resources.magic)||null;}
function libre_(j,res){
  if(res==='magic'){var m=ressourceMagie_(j);return Math.max(0,nombre_(m&&m.current));}
  return Math.max(0,nombre_(j&&j.energie));
}
function plafond_(j,res){
  if(res==='magic'){var m=ressourceMagie_(j);return Math.max(0,nombre_(m&&m.cap));}
  return Math.max(0,nombre_(j&&j.energieMax));
}
/* Quantité des boutons + et − : la case « Input » partagée (Basic Training, Augmentations, Time Machine, Entraînement avancé…). */
function pas_(){
  var el=document.getElementById('sorealIdleAugInputV1');
  var n=Math.floor(Number(el&&el.value));
  if(isFinite(n)&&n>=1)return n;
  var m=typeof window.__lireMontantAugmentIdleV1__==='function'?window.__lireMontantAugmentIdleV1__():125;
  return Math.max(1,Math.floor(Number(m))||125);
}

/* ---------- une fiole ---------- */
function fioleHtml_(n,ancre){
  var c=COULEURS[n.id]||['#9aa5bb','#111111'];
  var niveau=Math.max(0,Math.floor(nombre_(n.level)));
  var alloc=Math.max(0,Math.floor(nombre_(n.allocation)));
  var p=Math.max(0,Math.min(0.999999,nombre_(n.progress)));
  var spl=n.secondsPerLevel!=null&&isFinite(Number(n.secondsPerLevel))&&Number(n.secondsPerLevel)>0?Number(n.secondsPerLevel):0;
  var cible=Math.max(0,Math.floor(nombre_(n.target)));
  var pleine=spl>0&&spl<0.04;
  var effet=(n.id==='respawn'?'-':'+')+format_(n.effectPct,2)+' %';
  var idH=esc_(n.id);
  return '<div class="nl-fiole'+(alloc>0?' actif':'')+(pleine?' pleine':'')+'" data-nl-ngu="'+idH+'" data-nl-res="'+esc_(n.resource)+'" data-nl-p="'+p+'" data-nl-spl="'+spl+'" data-nl-n="'+niveau+'" data-nl-cible="'+cible+'" data-nl-t0="'+ancre+'" style="--nl-c:'+c[0]+';--nl-t:'+c[1]+'">'+
    '<div class="nl-nom">NGU '+esc_(String(n.name||n.id).toUpperCase())+'</div>'+
    '<div class="nl-verre">'+
      '<div class="nl-liq"><i class="nl-liq-in" data-nl-fill style="transform:scaleY('+(pleine?1:Math.round(p*1000)/1000)+')"></i><b class="nl-bulle b1"></b><b class="nl-bulle b2"></b><b class="nl-bulle b3"></b></div>'+
      '<svg class="nl-contour" viewBox="0 0 100 150" aria-hidden="true">'+
        '<polygon points="'+CONTOUR+'" fill="rgba(255,255,255,.18)" stroke="#27323a" stroke-width="3" stroke-linejoin="round"/>'+
        '<g stroke="#27323a" stroke-width="1.6" stroke-linecap="round" opacity=".55"><line x1="12" y1="112" x2="26" y2="112"/><line x1="16" y1="92" x2="28" y2="92"/><line x1="23" y1="72" x2="33" y2="72"/><line x1="66" y1="26" x2="62" y2="26"/></g>'+
        '<path d="M16 108 Q 14 124 20 136" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>'+
        '<rect x="35" y="0" width="30" height="10" rx="2" fill="#8a5a2b" stroke="#27323a" stroke-width="2.5"/>'+
      '</svg>'+
    '</div>'+
    '<div class="nl-stats">'+
      '<div class="nl-col"><span>Level</span><b data-nl-niv>'+format_(niveau)+'</b></div>'+
      '<div class="nl-col"><span>'+(n.resource==='magic'?'Magic':'Energy')+' Allocated</span><b data-nl-alloc>'+format_(alloc)+'</b></div>'+
    '</div>'+
    '<div class="nl-effet" title="'+esc_(n.effect)+'">'+esc_(n.effect)+' <b>'+effet+'</b></div>'+
    '<label class="nl-cible"><span>Target</span><input type="number" inputmode="numeric" min="0" step="1" value="'+cible+'" title="Niveau cible : l’énergie est retirée dès qu’il est atteint (0 = aucun objectif)" onchange="window.__SOREAL_IDLE_NGU_LABO_V1__.cible(\''+idH+'\',this.value)"></label>'+
    '<div class="nl-boutons">'+
      '<button type="button" title="Placer la valeur de Input" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.ajuster(\''+idH+'\',\'plus\')">+</button>'+
      '<button type="button" title="Retirer la valeur de Input" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.ajuster(\''+idH+'\',\'moins\')">−</button>'+
    '</div>'+
  '</div>';
}

/* ---------- page ---------- */
var CSS=
  '.nl-v1{--nl-fond:#c6c4c7;--nl-encre:#232124;position:relative;box-sizing:border-box;margin:0 0 12px;padding:14px 12px 16px;color:var(--nl-encre);background:var(--nl-fond);border:12px solid transparent;'+
    'border-image:repeating-linear-gradient(135deg,#e91c1f 0 11px,#f4f4f4 11px 22px,#004e03 22px 33px,#f4f4f4 33px 44px) 12;font-family:Impact,"Arial Black","Segoe UI",sans-serif}'+
  '.nl-v1 *{box-sizing:border-box}'+
  '.nl-haut{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}'+
  '.nl-btn{min-height:44px;padding:6px 14px;background:#f4f4f4;color:#111;border:3px solid #26394d;border-radius:6px;box-shadow:inset 0 0 0 2px #fff;font:800 14px/1.15 "Segoe UI",system-ui,sans-serif;text-transform:uppercase;cursor:pointer}'+
  '.nl-btn:active{transform:translateY(1px)}'+
  '.nl-btn.actif{background:#26394d;color:#fff}'+
  '.nl-entete{text-align:center;padding:2px 0 6px}'+
  '.nl-entete h1{margin:0;font-family:Impact,"Arial Black",sans-serif;font-size:44px;line-height:1;letter-spacing:.03em;color:var(--nl-encre)}'+
  '.nl-entete p{margin:2px 0 0;font:800 12px/1.2 "Segoe UI",system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--nl-encre)}'+
  '.nl-aide{margin:8px 0;padding:10px 12px;background:#f4f4f4;border:2px solid #26394d;border-radius:6px;font:500 14px/1.5 "Segoe UI",system-ui,sans-serif;color:#1c1c1f}'+
  '.nl-aide[hidden]{display:none}.nl-aide p{margin:0 0 6px}.nl-aide ol{margin:0;padding-left:20px;display:grid;gap:4px}'+
  '.nl-paliers{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:6px 0;font:800 13px/1 "Segoe UI",system-ui,sans-serif;text-transform:uppercase}'+
  '.nl-barre-outils{display:grid;gap:6px;margin:8px 0;padding:8px;background:#dcdadd;border:2px solid #9b999d;border-radius:6px;font:700 13px/1.3 "Segoe UI",system-ui,sans-serif}'+
  '.nl-barre-outils .nl-ligne{display:flex;align-items:center;gap:6px;flex-wrap:wrap}'+
  '.nl-barre-outils input[type=text]{width:120px;padding:6px 8px;background:#fff;border:2px solid #26394d;border-radius:4px;font:800 15px "Segoe UI",system-ui,sans-serif;color:#111}'+
  '.nl-barre-outils button{min-height:36px;padding:0 10px;background:#f4f4f4;color:#111;border:2px solid #26394d;border-radius:5px;font:800 13px "Segoe UI",system-ui,sans-serif;cursor:pointer}'+
  '.nl-avance{display:flex;align-items:center;gap:8px;font:800 16px/1 "Segoe UI",system-ui,sans-serif;cursor:pointer;color:var(--nl-encre)}'+
  '.nl-avance input{width:24px;height:24px;accent-color:#26394d}'+
  '.nl-grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px 10px;margin-top:8px}'+
  '.nl-fiole{display:flex;flex-direction:column;align-items:stretch;gap:5px;padding:6px 6px 8px;background:rgba(255,255,255,.35);border:2px solid #9b999d;border-radius:8px}'+
  '.nl-fiole.actif{border-color:var(--nl-c);box-shadow:0 0 0 2px #fff,0 0 0 4px var(--nl-c)}'+
  '.nl-nom{padding:5px 4px;text-align:center;background:var(--nl-c);color:var(--nl-t);border:2px solid #232124;border-radius:4px;font:900 12px/1.1 "Segoe UI",system-ui,sans-serif;letter-spacing:.02em}'+
  '.nl-verre{position:relative;width:78%;max-width:118px;margin:2px auto 0;aspect-ratio:100/150}'+
  '.nl-liq{position:absolute;inset:0;clip-path:'+DECOUPE+';overflow:hidden}'+
  '.nl-liq-in{position:absolute;inset:0;transform-origin:50% 100%;transform:scaleY(0);background:linear-gradient(180deg,color-mix(in srgb,var(--nl-c) 82%,#fff),var(--nl-c) 55%,color-mix(in srgb,var(--nl-c) 78%,#000));will-change:transform}'+
  '.nl-bulle{position:absolute;bottom:6%;width:9%;aspect-ratio:1;border-radius:50%;background:rgba(255,255,255,.7);opacity:0}'+
  '.nl-bulle.b1{left:30%}.nl-bulle.b2{left:50%}.nl-bulle.b3{left:68%}'+
  '.nl-fiole.actif .nl-bulle{animation:nlBulle 2.2s ease-in infinite}'+
  '.nl-fiole.actif .nl-bulle.b2{animation-delay:.7s;animation-duration:1.8s}.nl-fiole.actif .nl-bulle.b3{animation-delay:1.3s;animation-duration:2.6s}'+
  '.nl-fiole.pleine .nl-bulle{animation-duration:.9s!important}'+
  '@keyframes nlBulle{0%{transform:translateY(0) scale(.6);opacity:0}15%{opacity:.85}100%{transform:translateY(-520%) scale(1.1);opacity:0}}'+
  '.nl-contour{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}'+
  '.nl-stats{display:grid;grid-template-columns:1fr 1fr;gap:4px}'+
  '.nl-col{display:flex;flex-direction:column;align-items:center;text-align:center;gap:1px;font-family:"Segoe UI",system-ui,sans-serif}'+
  '.nl-fiole .nl-col span{font-size:10px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;color:#3a383c!important}'+
  '.nl-fiole .nl-col b{font-size:14px;font-weight:900;font-variant-numeric:tabular-nums;color:#111!important}'+
  '.nl-fiole .nl-effet{font:600 11px/1.25 "Segoe UI",system-ui,sans-serif;text-align:center;color:#3a383c!important;min-height:2.5em}'+
  '.nl-fiole .nl-effet b{color:#111!important;white-space:nowrap}'+
  '.nl-cible{display:flex;flex-direction:column;align-items:center;gap:2px;font-family:"Segoe UI",system-ui,sans-serif}'+
  '.nl-cible span{font-size:10px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;color:#3a383c}'+
  '.nl-cible input{width:100%;max-width:130px;padding:5px 6px;background:#fff;color:#111;border:2px solid #26394d;border-radius:4px;font:800 14px "Segoe UI",system-ui,sans-serif;text-align:center}'+
  '.nl-boutons{display:flex;justify-content:center;gap:8px}'+
  '.nl-boutons button{min-width:52px;min-height:44px;background:#f4f4f4;color:#111;border:3px solid #26394d;border-radius:6px;box-shadow:inset 0 0 0 2px #fff;font:900 24px/1 "Segoe UI",system-ui,sans-serif;cursor:pointer}'+
  '.nl-boutons button:active{transform:translateY(1px)}'+
  '.nl-section[hidden]{display:none}'+
  '.nl-resume{margin-top:12px;font:600 13px/1.4 "Segoe UI",system-ui,sans-serif}'+
  '.nl-resume>summary{cursor:pointer;font-weight:800;text-transform:uppercase;letter-spacing:.03em}'+
  '.nl-resume-grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;margin-top:6px}'+
  '.nl-resume-grille div{display:flex;justify-content:space-between;gap:6px;padding:4px 8px;background:rgba(255,255,255,.55);border:1px solid #9b999d;border-radius:5px}'+
  '@media(max-width:700px){.nl-v1{padding:10px 6px 12px;border-width:10px}.nl-entete h1{font-size:36px}.nl-grille{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px 5px}.nl-fiole{padding:4px 3px 6px;gap:4px}.nl-nom{font-size:10px;padding:4px 2px}.nl-verre{width:86%}.nl-col b{font-size:12px}.nl-col span,.nl-cible span{font-size:8.5px}.nl-effet{font-size:9.5px}.nl-boutons button{min-width:40px;min-height:44px}.nl-cible input{padding:4px 2px;font-size:13px}}'+
  '@media(prefers-reduced-motion:reduce){.nl-fiole.actif .nl-bulle{animation:none}}';

function barreOutilsHtml_(j){
  var el=document.getElementById('sorealIdleAugInputV1');
  var valeur=el&&el.value?el.value:String(typeof window.__lireMontantAugmentIdleV1__==='function'?window.__lireMontantAugmentIdleV1__():125);
  var lib=libre_(j,onglet);
  return '<div class="nl-barre-outils">'+
    '<div class="nl-ligne"><label for="sorealIdleAugInputV1">🎚️ Input</label><input id="sorealIdleAugInputV1" type="text" value="'+esc_(valeur)+'" title="Un nombre, ou une fraction comme 1/8 (résolue en 1/8 de l’énergie idle libre à la validation)" oninput="window.__saisirMontantAugmentIdleV1__(this.value)" onblur="window.__resoudreFractionInputIdleV1__&amp;&amp;window.__resoudreFractionInputIdleV1__(this);window.__saisirMontantAugmentIdleV1__(this.value)">'+
      '<span data-nl-libre-label>'+(onglet==='magic'?'Magie libre':'Énergie libre')+' : <b id="sorealIdleNguLibreV1">'+format_(lib)+'</b> '+(onglet==='magic'?'✨':'⚡')+'</span></div>'+
    '<div class="nl-ligne"><span>'+(onglet==='magic'?'✨ Magic Cap':'⚡ Energy Cap')+'</span>'+
      '<button type="button" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.preset(\'cap\',1)">Max</button><button type="button" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.preset(\'cap\',.5)">1/2</button><button type="button" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.preset(\'cap\',.25)">1/4</button>'+
      '<span>💤 Idle</span><button type="button" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.preset(\'idle\',.5)">1/2</button><button type="button" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.preset(\'idle\',.25)">1/4</button>'+
      '<button type="button" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.vider(window.__SOREAL_IDLE_NGU_LABO_V1__.ongletCourant())">Tout retirer</button></div>'+
  '</div>';
}

function page(j){
  var H=H_();
  var sys=systemeNgu_(j);
  if(!sys||!sys.state||!sys.state.unlocked){
    return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
  }
  var ng=ngus_(j);
  var magieOk=Boolean(ng.magicUnlocked);
  if(!magieOk&&onglet==='magic')onglet='energy';
  var liste=listeCourante_(j);
  var ancre=typeof j.__recuPerfV1==='number'?j.__recuPerfV1:(typeof performance!=='undefined'?performance.now():0);
  var nomPalier={normal:'Normal',evil:'Evil',sadistic:'Sadistic'};
  var paliers=Array.isArray(ng.activeTiers)?ng.activeTiers:['normal'];
  var courant=ng.tier||'normal';
  var chips=paliers.length>1?'<div class="nl-paliers"><span>Palier</span>'+paliers.map(function(t){
    var actif=t===courant;
    return '<button type="button" class="nl-btn'+(actif?' actif':'')+'" '+(actif?'disabled':'onclick="window.__actionMetaV47__({action:\'setNguTier\',tier:\''+esc_(t)+'\'})"')+'>'+esc_(nomPalier[t]||t)+'</button>';
  }).join('')+'</div>':'<div class="nl-paliers"><span>Palier : '+esc_(nomPalier[courant]||courant)+'</span></div>';
  var fx=ng.effects||{};
  var ratio=function(v){return 'x'+format_(Math.max(1,nombre_(v)),2);};
  /* Anti-spoil : les effets des NGU de magie (EXP, Number, Yggdrasil, Time Machine) n'apparaissent qu'une fois la magie découverte. */
  var resume=[
    ['⚔️ Attack/Defense',ratio(fx.attackDefense)],['🗺️ Adventure',ratio(fx.adventure)],['🪙 Gold',ratio(fx.gold)],['🎲 Drop',ratio(fx.dropChance)],
    ['⭐ PP',ratio(fx.pp)],['🦾 Augments',ratio(fx.augments)],['💻 Wandoos',ratio(fx.wandoosSpeed)],
    ['⏳ Respawn','-'+(nombre_(fx.respawnReduction)*100).toFixed(1).replace('.',',')+' %']
  ].concat(magieOk?[['✨ EXP',ratio(fx.exp)],['🔢 Number',ratio(fx.number)],['🌱 Yggdrasil',ratio(fx.yggdrasil)],['⏱️ Time Machine',ratio(fx.timeMachine)]]:[])
  .map(function(x){return '<div>'+x[0]+'<b>'+x[1]+'</b></div>';}).join('');
  var avance=ng.advance||{};
  function section(res){
    var vials=liste.filter(function(n){return n.resource===res;}).map(function(n){return fioleHtml_(n,ancre);}).join('');
    return '<div class="nl-section" data-nl-section="'+res+'"'+(onglet===res?'':' hidden')+'>'+
      '<label class="nl-avance"><input type="checkbox" '+(avance[res]?'checked ':'')+'onchange="window.__SOREAL_IDLE_NGU_LABO_V1__.avance(\''+res+'\',this.checked)"> Advance '+(res==='magic'?'Magic':'Energy')+'</label>'+
      '<div class="nl-grille">'+vials+'</div>'+
    '</div>';
  }
  var html=
    '<style>'+CSS+'</style>'+
    '<div class="nl-v1" data-nl-racine data-nl-onglet="'+onglet+'">'+
      '<div class="nl-haut">'+
        '<button type="button" class="nl-btn" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.aide()">WTF do I do?</button>'+
        (magieOk?'<button type="button" class="nl-btn" data-nl-onglet-btn onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.onglet(window.__SOREAL_IDLE_NGU_LABO_V1__.ongletCourant()===\'magic\'?\'energy\':\'magic\')">'+(onglet==='magic'?'TO NGU ENERGY':'TO NGU MAGIC')+'</button>':'')+
      '</div>'+
      '<header class="nl-entete"><h1>NGU</h1><p>(Hey, that\'s the name of this game!)</p></header>'+
      '<div class="nl-aide" id="sorealIdleNguAideV1" hidden>'+
        '<p><b>À quoi ça sert ?</b> Chaque NGU est une fiole qui se remplit : quand elle déborde, le NGU gagne un niveau et son bonus augmente.</p>'+
        '<ol>'+
          '<li><b>Place de l’énergie</b> dans une fiole avec <b>+</b> : la quantité est celle de la case <b>Input</b> (Max, 1/2 et 1/4 la remplissent). <b>−</b> la retire.</li>'+
          '<li>Chaque NGU avance <b>avec sa propre énergie</b>, en même temps que les autres.</li>'+
          '<li><b>Target</b> : le niveau à atteindre. Dès qu’il est atteint, l’énergie du NGU lui est retirée (0 = aucun objectif).</li>'+
          '<li><b>Advance Energy</b> : quand un NGU atteint son Target, son énergie passe automatiquement au NGU suivant.</li>'+
          '<li>Les niveaux persistent à travers les Rebirths ; l’énergie et la magie allouées sont rendues au Rebirth.</li>'+
          (paliers.length>1?'<li>Un seul palier reçoit de l’énergie et de la magie à la fois ; les effets des paliers débloqués se multiplient.</li>':'')+
        '</ol>'+
      '</div>'+
      chips+
      barreOutilsHtml_(j)+
      section('energy')+
      (magieOk?section('magic'):'')+
      '<details class="nl-resume"><summary>Effets de tous tes NGU</summary><div class="nl-resume-grille">'+resume+'</div></details>'+
    '</div>';
  demarrer_();
  return html;
}

/* ---------- vie des fioles : progression rejouée en direct ---------- */
function tick_(){
  var racine=document.querySelector('[data-nl-racine]');
  if(!racine){arreter_();return;}
  var maintenant=typeof performance!=='undefined'?performance.now():0;
  var H=H_();
  Array.prototype.forEach.call(racine.querySelectorAll('.nl-fiole'),function(f){
    var d=f.dataset;
    var spl=Number(d.nlSpl);
    if(!(spl>0)||f.closest('[hidden]'))return;
    var n0=Number(d.nlN),cible=Number(d.nlCible);
    if(cible>0&&n0>=cible)return;
    var ecoule=Math.max(0,(maintenant-Number(d.nlT0))/1000);
    var total=Number(d.nlP)+ecoule/spl;
    var gagnes=Math.floor(total);
    var frac=total-gagnes;
    if(spl<0.04){frac=1;gagnes=Math.floor(ecoule*Math.min(50,1/spl));}
    var niveau=n0+gagnes;
    if(cible>0&&niveau>cible)niveau=cible;
    var liq=f.querySelector('[data-nl-fill]');
    if(liq){
      var v=Math.round(frac*500)/500;
      if(String(v)!==liq.getAttribute('data-nl-v')){liq.setAttribute('data-nl-v',String(v));liq.style.transform='scaleY('+v+')';}
    }
    var t=f.querySelector('[data-nl-niv]');
    if(t&&niveau!==Number(t.getAttribute('data-nl-v')||n0)){
      t.setAttribute('data-nl-v',String(niveau));
      t.textContent=format_(niveau);
    }
  });
}
function demarrer_(){if(!timer)timer=setInterval(tick_,100);}
function arreter_(){if(timer){clearInterval(timer);timer=0;}}

/* ---------- actions ---------- */
function systemeAlloc_(j,res,delta){
  var s=systemeNgu_(j);
  if(s&&s.state&&s.state.allocation)s.state.allocation[res]=Math.max(0,nombre_(s.state.allocation[res])+delta);
}
/* Repart la progression d'une fiole du moment présent (après un changement d'énergie : nouvelle vitesse, même niveau de liquide). */
function reancrer_(f,splNouveau){
  var d=f.dataset;
  var spl=Number(d.nlSpl);
  var maintenant=typeof performance!=='undefined'?performance.now():0;
  if(spl>0){
    var ecoule=Math.max(0,(maintenant-Number(d.nlT0))/1000);
    var total=Number(d.nlP)+ecoule/spl;
    d.nlN=String(Number(d.nlN)+Math.floor(total));
    d.nlP=String(Math.max(0,Math.min(0.999999,total-Math.floor(total))));
  }
  d.nlT0=String(maintenant);
  d.nlSpl=String(splNouveau>0?splNouveau:0);
}
function ajuster(id,mode){
  var H=H_();
  var j=H&&H.getIdleEtat?H.getIdleEtat():null;
  var n=nguDe_(j,id);
  if(!n)return;
  var res=n.resource;
  var courant=Math.max(0,Math.floor(nombre_(n.allocation)));
  var lib=libre_(j,res);
  var valeur=mode==='plus'?courant+Math.min(pas_(),Math.floor(lib)):Math.max(0,courant-pas_());
  var delta=valeur-courant;
  if(delta===0)return;
  if(H.jouerEffetAudioIdleV199_)H.jouerEffetAudioIdleV199_(mode==='plus'?'btPlus':'btMinus');
  /* Vitesse proportionnelle à l'énergie : sans allocation avant, on attend la réponse du serveur pour la durée d'un niveau. */
  var f=document.querySelector('[data-nl-ngu="'+id+'"]');
  var spl=Number(n.secondsPerLevel)||0;
  var splNouveau=courant>0&&valeur>0&&spl>0?spl*courant/valeur:0;
  n.allocation=valeur;
  if(spl>0&&valeur>0&&courant>0)n.secondsPerLevel=splNouveau;
  else if(valeur<=0)n.secondsPerLevel=null;
  systemeAlloc_(j,res,delta);
  if(res==='magic'){var m=ressourceMagie_(j);if(m)m.current=Math.max(0,nombre_(m.current)-delta);}
  else j.energie=Math.max(0,nombre_(j.energie)-delta);
  if(f){
    reancrer_(f,splNouveau);
    f.classList.toggle('actif',valeur>0);
    var a=f.querySelector('[data-nl-alloc]');
    if(a)a.textContent=format_(valeur);
  }
  majLibre_(j);
  if(H.rafraichirEnergieEtBoutonsIdleV9_)H.rafraichirEnergieEtBoutonsIdleV9_();
  envoyer_({action:'allocateNgu',ngu:id,value:valeur});
}
function majLibre_(j){
  var el=document.getElementById('sorealIdleNguLibreV1');
  if(el)el.textContent=format_(libre_(j,onglet));
}
function vider(res){
  var H=H_();
  var j=H&&H.getIdleEtat?H.getIdleEtat():null;
  listeCourante_(j).forEach(function(n){
    if(n.resource!==res)return;
    var courant=Math.max(0,Math.floor(nombre_(n.allocation)));
    if(courant<=0)return;
    n.allocation=0;n.secondsPerLevel=null;
    systemeAlloc_(j,res,-courant);
    if(res==='magic'){var m=ressourceMagie_(j);if(m)m.current=nombre_(m.current)+courant;}
    else j.energie=nombre_(j.energie)+courant;
    var f=document.querySelector('[data-nl-ngu="'+n.id+'"]');
    if(f){reancrer_(f,0);f.classList.remove('actif');var a=f.querySelector('[data-nl-alloc]');if(a)a.textContent=format_(0);}
    envoyer_({action:'allocateNgu',ngu:n.id,value:0});
  });
  majLibre_(j);
  if(H&&H.rafraichirEnergieEtBoutonsIdleV9_)H.rafraichirEnergieEtBoutonsIdleV9_();
}
function cible(id,valeur){
  var n=Math.max(0,Math.floor(Number(valeur)||0));
  var j=H_()&&H_().getIdleEtat?H_().getIdleEtat():null;
  var d=nguDe_(j,id);
  if(d)d.target=n;
  var f=document.querySelector('[data-nl-ngu="'+id+'"]');
  if(f)f.dataset.nlCible=String(n);
  envoyer_({action:'setNguTarget',ngu:id,value:n});
}
function avance(res,coche){
  var j=H_()&&H_().getIdleEtat?H_().getIdleEtat():null;
  var ng=ngus_(j);
  if(ng){ng.advance=Object.assign({},ng.advance,{[res]:Boolean(coche)});}
  envoyer_({action:'setNguAdvance',resource:res,enabled:Boolean(coche)});
}
function changerOnglet(res){
  onglet=res==='magic'?'magic':'energy';
  var racine=document.querySelector('[data-nl-racine]');
  if(!racine)return;
  racine.setAttribute('data-nl-onglet',onglet);
  Array.prototype.forEach.call(racine.querySelectorAll('[data-nl-section]'),function(s){s.hidden=s.getAttribute('data-nl-section')!==onglet;});
  var b=racine.querySelector('[data-nl-onglet-btn]');
  if(b)b.textContent=onglet==='magic'?'TO NGU ENERGY':'TO NGU MAGIC';
  var j=H_()&&H_().getIdleEtat?H_().getIdleEtat():null;
  var lab=racine.querySelector('[data-nl-libre-label]');
  if(lab)lab.innerHTML=(onglet==='magic'?'Magie libre':'Énergie libre')+' : <b id="sorealIdleNguLibreV1">'+format_(libre_(j,onglet))+'</b> '+(onglet==='magic'?'✨':'⚡');
  var presets=racine.querySelector('.nl-barre-outils .nl-ligne:nth-child(2)>span');
  if(presets)presets.textContent=onglet==='magic'?'✨ Magic Cap':'⚡ Energy Cap';
}
function preset(source,fraction){
  var H=H_();
  var j=H&&H.getIdleEtat?H.getIdleEtat():null;
  var input=document.getElementById('sorealIdleAugInputV1');
  if(!input)return;
  var base=source==='idle'?libre_(j,onglet):plafond_(j,onglet);
  var valeur=Math.max(1,Math.floor(base*Math.max(0,Number(fraction)||0)));
  input.value=String(valeur);
  if(typeof window.__saisirMontantAugmentIdleV1__==='function')window.__saisirMontantAugmentIdleV1__(valeur);
}

window.__SOREAL_IDLE_NGU_LABO_V1__={
  page:page,
  couleurs:COULEURS,
  aide:function(){var el=document.getElementById('sorealIdleNguAideV1');if(el)el.hidden=!el.hidden;},
  ajuster:ajuster,cible:cible,avance:avance,onglet:changerOnglet,vider:vider,preset:preset,
  ongletCourant:function(){return onglet;},
  /* Pour les tests : la progression d'une fiole à un instant donné (mêmes formules que tick_). */
  progression:function(p,spl,n0,ecouleSecondes){
    var total=p+ecouleSecondes/spl,gagnes=Math.floor(total);
    return spl<0.04?{fraction:1,niveau:n0+Math.floor(ecouleSecondes*Math.min(50,1/spl))}:{fraction:total-gagnes,niveau:n0+gagnes};
  }
};
})();
