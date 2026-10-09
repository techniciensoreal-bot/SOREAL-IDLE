/*
 * SOREAL IDLE — page NGU, « la nuit des tuyaux » (Norman, 2026-10-08) : plus de fioles. Chaque NGU est un TUYAU de verre horizontal qui se remplit d'un liquide lumineux, aux couleurs de l'écran NGU de NGU Idle ; les tuyaux
 * brillent dans une nuit étoilée (le fond « cosmos » du cadre de chat des niveaux 30 de SOREAL APP : nuit violette, étoiles à quatre branches qui scintillent) et sont branchés sur un tronc lumineux qui reprend toutes leurs couleurs.
 *
 * Couleurs : celles de la capture (échantillonnées sur l'image) pour les 9 NGU d'énergie. Les 7 NGU de magie ne figuraient pas sur la capture : leurs couleurs sont un choix de SOREAL, dans le même esprit.
 * Contrôles, comme dans le jeu d'origine : + / − (la quantité est celle de la case « Input » partagée avec les autres menus), « Target » (niveau à atteindre) et « Advance Energy » (voir src/idle-ngu-progression.js).
 *
 * Vivant : le remplissage est la progression vers le niveau suivant, rejouée en direct à partir du dernier état du serveur (progression + secondes par niveau), uniquement en transform et opacité (compositeur : aucune repeinte lourde) ;
 * un reflet lumineux parcourt les tuyaux qui reçoivent de l'énergie.
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
/* Étoiles à quatre branches (comme le cadre « cosmos » du chat de SOREAL APP) : positions fixes, pseudo-aléatoires, qui scintillent en opacité / échelle seulement. */
function etoilesHtml_(){
  var a=7,sortie='';
  function suite(){a=(a*9301+49297)%233280;return a/233280;}
  /* Nuit étoilée (Norman, 2026-10-08 : « beaucoup plus d'étoiles ») : 240 étoiles, surtout de toutes petites ; seules quelques-unes scintillent (le reste est fixe, pour ne pas alourdir le téléphone). */
  for(var i=0;i<240;i+=1){
    var x=suite()*100,y=suite()*100,u=suite(),t=2+Math.round(u*u*u*10);
    sortie+='<b style="--i:'+i+';--x:'+x.toFixed(1)+'%;--y:'+y.toFixed(1)+'%;--s:'+t+'px"><i></i></b>';
  }
  return '<span class="nl-etoiles" aria-hidden="true">'+sortie+'</span>';
}
var ETOILES=etoilesHtml_();

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

/* ---------- minuteur : fin du niveau en cours ---------- */
function dureeTexte_(s){
  s=Math.max(0,Math.ceil(s));
  if(s<60)return s+' s';
  var m=Math.floor(s/60),r=s%60;
  if(m<60)return m+' min'+(r?' '+r+' s':'');
  var h=Math.floor(m/60);m=m%60;
  if(h<24)return h+' h'+(m?' '+m+' min':'');
  var j=Math.floor(h/24);h=h%24;
  return j+' j'+(h?' '+h+' h':'');
}
/* « Niveau suivant dans … » = durée d'un niveau × ce qu'il reste à remplir ; rien à dire sans énergie ni quand la cible est atteinte. */
function etaTexte_(spl,fraction,cibleAtteinte){
  if(cibleAtteinte)return 'Cible atteinte';
  if(!(spl>0))return 'Place de l’énergie pour avancer';
  if(spl<0.04)return 'Niveaux instantanés';
  return '⏱️ Niveau suivant dans <b>'+dureeTexte_(spl*Math.max(0,1-fraction))+'</b>';
}

/* ---------- un tuyau ---------- */
function barreHtml_(n,ancre){
  var c=COULEURS[n.id]||['#9aa5bb','#111111'];
  var niveau=Math.max(0,Math.floor(nombre_(n.level)));
  var alloc=Math.max(0,Math.floor(nombre_(n.allocation)));
  var p=Math.max(0,Math.min(0.999999,nombre_(n.progress)));
  var spl=n.secondsPerLevel!=null&&isFinite(Number(n.secondsPerLevel))&&Number(n.secondsPerLevel)>0?Number(n.secondsPerLevel):0;
  var cible=Math.max(0,Math.floor(nombre_(n.target)));
  var pleine=spl>0&&spl<0.04;
  var effet=(n.id==='respawn'?'-':'+')+format_(n.effectPct,2)+' %';
  var idH=esc_(n.id);
  var rempli=pleine?1:Math.round(p*1000)/1000;
  return '<div class="nl-barre'+(alloc>0?' actif':'')+(pleine?' pleine':'')+'" data-nl-ngu="'+idH+'" data-nl-res="'+esc_(n.resource)+'" data-nl-p="'+p+'" data-nl-spl="'+spl+'" data-nl-n="'+niveau+'" data-nl-cible="'+cible+'" data-nl-t0="'+ancre+'" style="--nl-c:'+c[0]+';--nl-t:'+c[1]+'">'+
    '<div class="nl-tete"><div class="nl-nom">NGU '+esc_(String(n.name||n.id).toUpperCase())+'</div><div class="nl-niveau">Niveau <b data-nl-niv>'+format_(niveau)+'</b></div></div>'+
    '<div class="nl-tuyau">'+
      '<i class="nl-bride g"></i>'+
      '<div class="nl-tube"><i class="nl-liq-in" data-nl-fill style="transform:scaleX('+rempli+')"></i><span class="nl-pct" data-nl-pct>'+Math.round(rempli*100)+' %</span></div>'+
      '<i class="nl-bride d"></i>'+
    '</div>'+
    '<div class="nl-eta" data-nl-eta>'+etaTexte_(spl,rempli,cible>0&&niveau>=cible)+'</div>'+
    '<div class="nl-infos"><span>'+(n.resource==='magic'?'Magie':'Énergie')+' placée <b data-nl-alloc>'+format_(alloc)+'</b></span>'+
      '<span class="nl-effet" title="'+esc_(n.effect)+'">'+esc_(n.effect)+' <b>'+effet+'</b></span></div>'+
    '<div class="nl-actions">'+
      '<label class="nl-cible"><span>Cible</span><input type="number" inputmode="numeric" min="0" step="1" value="'+cible+'" title="Niveau cible : l’énergie est retirée dès qu’il est atteint (0 = aucun objectif)" onchange="window.__SOREAL_IDLE_NGU_LABO_V1__.cible(\''+idH+'\',this.value)"></label>'+
      '<div class="nl-boutons">'+
        '<button type="button" title="Placer la valeur de Input" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.ajuster(\''+idH+'\',\'plus\')">+</button>'+
        '<button type="button" title="Retirer la valeur de Input" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.ajuster(\''+idH+'\',\'moins\')">−</button>'+
        '<button type="button" class="max" title="Placer toute l’énergie ou la magie libre" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.ajuster(\''+idH+'\',\'max\')">Max</button>'+
      '</div>'+
    '</div>'+
  '</div>';
}

/* ---------- page ---------- */
var CSS=
  '.nl-v1{position:relative;isolation:isolate;box-sizing:border-box;margin:0 0 12px;padding:16px 14px 22px;color:#eaf0ff;border-radius:20px;border:2px solid rgba(170,110,255,.6);overflow:hidden;font-family:"Segoe UI",system-ui,sans-serif;'+
    'background-color:#0a0620;background-image:radial-gradient(circle at 12% 18%,#fff 0 1px,transparent 2px),radial-gradient(circle at 78% 9%,#fff 0 1px,transparent 2px),radial-gradient(circle at 55% 42%,#fff 0 1.5px,transparent 2.5px),radial-gradient(circle at 90% 55%,#ffd6fb 0 1px,transparent 2px),radial-gradient(circle at 30% 66%,#d6e6ff 0 1px,transparent 2px),radial-gradient(circle at 66% 88%,#fff 0 1px,transparent 2px),radial-gradient(circle at 8% 92%,#ffd6fb 0 1px,transparent 2px),linear-gradient(160deg,#1b0f45 0%,#120a33 45%,#0a0620 100%);'+
    'box-shadow:0 0 34px rgba(120,70,255,.4),inset 0 0 50px rgba(90,34,216,.28)}'+
  '.nl-v1 *{box-sizing:border-box}'+
  '.nl-eta{margin:2px 0 4px;font-size:12.5px;font-weight:800;color:#cdbcff;letter-spacing:.02em}.nl-eta b{color:#fff}'+
  '.nl-v1>*:not(.nl-etoiles){position:relative;z-index:1}'+
  /* étoiles à quatre branches : lueur (b) + étoile (i), scintillement en opacité / échelle */
  '.nl-etoiles{position:absolute;inset:0;pointer-events:none;z-index:0}'+
  '.nl-etoiles b{position:absolute;left:var(--x);top:var(--y);width:calc(var(--s)*3);height:calc(var(--s)*3);margin:calc(var(--s)*-1.5) 0 0 calc(var(--s)*-1.5);background:radial-gradient(circle,rgba(255,255,255,.4) 0,rgba(181,138,255,.2) 38%,transparent 70%);opacity:.3}'+
  '.nl-etoiles b:nth-child(3n+1){--pic:.5}.nl-etoiles b:nth-child(3n+2){--pic:.75}.nl-etoiles b:nth-child(3n){--pic:.95}'+
  '.nl-etoiles b i{position:absolute;left:50%;top:50%;width:var(--s);height:var(--s);margin:calc(var(--s)/-2) 0 0 calc(var(--s)/-2);background:#fff;clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%)}'+
  '@media(prefers-reduced-motion:no-preference){.nl-v1[data-nl-actif="1"] .nl-etoiles b:nth-child(4n){animation:nlEtoile calc(6s + var(--i)*.9s) ease-in-out infinite;animation-delay:calc(var(--i)*-2.3s)}'+
    '@keyframes nlEtoile{0%,60%,100%{opacity:.25;transform:scale(.6)}74%{opacity:var(--pic,.9);transform:scale(1.05)}86%{opacity:.4;transform:scale(.75)}}}'+
  '.nl-haut{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}'+
  '.nl-btn{min-height:44px;padding:6px 14px;background:rgba(255,255,255,.08);color:#fff;border:1.5px solid rgba(190,160,255,.75);border-radius:12px;box-shadow:0 0 12px rgba(150,100,255,.35);font:800 13px/1.15 "Segoe UI",system-ui,sans-serif;text-transform:uppercase;letter-spacing:.04em;cursor:pointer}'+
  '.nl-btn:active{transform:translateY(1px)}.nl-btn.actif{background:rgba(190,160,255,.35)}'+
  '.nl-entete{text-align:center;padding:4px 0 8px}'+
  '.nl-entete .nl-titre{margin:0;font:900 52px/1.1 "Segoe UI Black","Segoe UI",system-ui,sans-serif;letter-spacing:.08em;background:linear-gradient(90deg,#ff9ee8,#8fdcff 50%,#ffd34d);-webkit-background-clip:text!important;background-clip:text!important;-webkit-text-fill-color:transparent!important;color:transparent!important;text-shadow:none!important;filter:drop-shadow(0 0 10px rgba(170,110,255,.7))}'+
  '.nl-entete p{margin:2px 0 0;font:700 12px/1.2 "Segoe UI",system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#b9c2ee}'+
  '.nl-aide{margin:8px 0;padding:10px 12px;background:rgba(10,6,32,.7);border:1px solid rgba(150,120,255,.4);border-radius:12px;font:500 14px/1.5 "Segoe UI",system-ui,sans-serif;color:#dfe5ff}'+
  '.nl-aide[hidden]{display:none}.nl-aide p{margin:0 0 6px}.nl-aide ol{margin:0;padding-left:20px;display:grid;gap:4px}'+
  '.nl-paliers{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:6px 0;font:800 13px/1 "Segoe UI",system-ui,sans-serif;text-transform:uppercase;color:#c9d2f7}'+
  '.nl-barre-outils{display:grid;gap:6px;margin:8px 0;padding:8px 10px;background:rgba(10,6,32,.65);border:1px solid rgba(150,120,255,.4);border-radius:12px;font:700 13px/1.3 "Segoe UI",system-ui,sans-serif;color:#dfe5ff}'+
  '.nl-barre-outils .nl-ligne{display:flex;align-items:center;gap:6px;flex-wrap:wrap}'+
  '.nl-barre-outils input[type=text]{width:120px;padding:6px 8px;background:#0b0724;border:1.5px solid rgba(170,130,255,.7);border-radius:8px;font:800 15px "Segoe UI",system-ui,sans-serif;color:#fff}'+
  '.nl-barre-outils button{min-height:36px;padding:0 10px;background:rgba(255,255,255,.08);color:#fff;border:1.5px solid rgba(170,130,255,.6);border-radius:8px;font:800 13px "Segoe UI",system-ui,sans-serif;cursor:pointer}'+
  '.nl-avance{display:inline-flex;align-items:center;gap:8px;margin:4px 0;font:800 16px/1 "Segoe UI",system-ui,sans-serif;cursor:pointer;color:#fff}'+
  '.nl-avance input{width:24px;height:24px;accent-color:#b58aff}'+
  /* réseau : un tronc lumineux aux couleurs de tous les tuyaux, une branche par tuyau */
  '.nl-section[hidden]{display:none}'+
  '.nl-grille{position:relative;display:grid;gap:16px;margin:10px auto 0;padding-left:24px;max-width:920px}'+
  '.nl-grille::before{content:"";position:absolute;left:5px;top:10px;bottom:10px;width:8px;border-radius:8px;background:linear-gradient(180deg,#ed3e3e,#f2bb6a,#ffffa9,#daf11a,#a6deb9,#7a96f5,#9e19f1,#ff9de1,#62c0ff,#7ef0e0);box-shadow:0 0 10px 1px rgba(200,160,255,.75),0 0 28px rgba(120,80,255,.5)}'+
  '.nl-barre{position:relative}'+
  '.nl-barre::before{content:"";position:absolute;left:-22px;top:62px;width:24px;height:7px;border-radius:4px;background:var(--nl-c);box-shadow:0 0 10px var(--nl-c)}'+
  '.nl-tete{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:0 2px 6px}'+
  '.nl-nom{font:900 14px/1.15 "Segoe UI",system-ui,sans-serif;letter-spacing:.07em;color:color-mix(in srgb,var(--nl-c) 55%,#fff);text-shadow:0 0 9px var(--nl-c),0 0 2px #000}'+
  '.nl-niveau{font:700 12px/1 "Segoe UI",system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#b9c2ee;white-space:nowrap}'+
  '.nl-niveau b{font:900 20px/1 "Segoe UI",system-ui,sans-serif;color:#fff;font-variant-numeric:tabular-nums;text-shadow:0 0 8px var(--nl-c)}'+
  /* tuyau : brides métalliques, verre, liquide lumineux, halo derrière */
  '.nl-tuyau{position:relative;display:flex;align-items:center}'+
  '.nl-tuyau::before{content:"";position:absolute;inset:-6px 8px;border-radius:16px;background:var(--nl-c);filter:blur(13px);opacity:.14;z-index:0}'+
  '.nl-barre.actif .nl-tuyau::before{opacity:.5}'+
  '@media(prefers-reduced-motion:no-preference){.nl-barre.actif .nl-tuyau::before{animation:nlPouls 2.4s ease-in-out infinite alternate}@keyframes nlPouls{from{opacity:.3}to{opacity:.62}}}'+
  '.nl-bride{position:relative;z-index:2;flex:0 0 auto;width:15px;height:52px;border-radius:5px;border:1px solid #0b0b1c;background:linear-gradient(90deg,#222744,#b4bae0 45%,#222744);box-shadow:0 0 6px rgba(0,0,0,.65)}'+
  '.nl-bride::before{content:"";position:absolute;left:50%;top:5px;bottom:5px;width:4px;margin-left:-2px;background:radial-gradient(circle,#10122a 0 1.5px,transparent 2.2px) 0 0/4px 12px repeat-y}'+
  '.nl-tube{position:relative;z-index:1;flex:1 1 auto;min-width:0;height:38px;margin:0 -4px;border-radius:10px;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(0,0,0,.5));border:2px solid color-mix(in srgb,var(--nl-c) 75%,#fff);box-shadow:0 0 12px color-mix(in srgb,var(--nl-c) 70%,transparent),inset 0 0 12px rgba(0,0,0,.7)}'+
  '.nl-liq-in{position:absolute;inset:0;transform-origin:0 50%;transform:scaleX(0);background:linear-gradient(180deg,color-mix(in srgb,var(--nl-c) 52%,#fff) 0,var(--nl-c) 40%,color-mix(in srgb,var(--nl-c) 68%,#000) 100%);box-shadow:0 0 14px var(--nl-c);will-change:transform}'+
  '.nl-tube::after{content:"";position:absolute;left:3px;right:3px;top:3px;height:34%;border-radius:8px;background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,.04));pointer-events:none;z-index:2}'+
  '.nl-tube::before{content:"";position:absolute;top:0;bottom:0;left:0;width:45%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.6),transparent);transform:translateX(-110%);opacity:0;z-index:2;pointer-events:none}'+
  '@media(prefers-reduced-motion:no-preference){.nl-barre.actif .nl-tube::before{opacity:1;animation:nlFlux 2.6s linear infinite}.nl-barre.pleine .nl-tube::before{animation-duration:.9s}@keyframes nlFlux{from{transform:translateX(-110%)}to{transform:translateX(250%)}}}'+
  '.nl-pct{position:absolute;right:10px;top:50%;transform:translateY(-50%);z-index:3;font:900 13px/1 "Segoe UI",system-ui,sans-serif;font-variant-numeric:tabular-nums;color:#fff;text-shadow:0 1px 3px #000,0 0 6px #000}'+
  '.nl-infos{display:flex;flex-wrap:wrap;align-items:baseline;gap:3px 14px;margin:7px 2px 0;font:600 12px/1.3 "Segoe UI",system-ui,sans-serif;color:#c7d0f2}'+
  '.nl-infos b{color:#fff;font-variant-numeric:tabular-nums}'+
  '.nl-actions{display:flex;align-items:center;gap:8px;margin:6px 2px 0}'+
  '.nl-cible{display:flex;align-items:center;gap:6px;margin-right:auto;font:800 11px/1 "Segoe UI",system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#aab4dc}'+
  '.nl-cible input{width:86px;padding:7px 6px;background:#0b0724;color:#fff;border:1.5px solid color-mix(in srgb,var(--nl-c) 70%,#fff);border-radius:8px;font:800 15px "Segoe UI",system-ui,sans-serif;text-align:center}'+
  '.nl-boutons{display:flex;gap:8px}'+
  '.nl-boutons button{width:52px;min-height:44px;background:rgba(255,255,255,.07);color:#fff;border:1.5px solid var(--nl-c);border-radius:12px;box-shadow:0 0 10px color-mix(in srgb,var(--nl-c) 60%,transparent);font:900 24px/1 "Segoe UI",system-ui,sans-serif;cursor:pointer}'+
  '.nl-boutons button:active{transform:translateY(1px)}'+
  '.nl-resume{margin-top:14px;font:600 13px/1.4 "Segoe UI",system-ui,sans-serif;color:#dfe5ff}'+
  '.nl-resume>summary{cursor:pointer;font-weight:800;text-transform:uppercase;letter-spacing:.04em}'+
  '.nl-resume-grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:6px;margin-top:6px}'+
  '.nl-resume-grille div{display:flex;justify-content:space-between;gap:6px;padding:5px 9px;background:rgba(10,6,32,.65);border:1px solid rgba(150,120,255,.35);border-radius:8px}'+
  '@media(max-width:700px){.nl-v1{padding:12px 8px 16px;border-radius:16px}.nl-entete .nl-titre{font-size:40px}.nl-grille{padding-left:22px;gap:14px}.nl-nom{font-size:13px}.nl-barre::before{left:-20px;width:22px;top:60px}}';

/* Totaux placés dans les NGU (Norman, 2026-10-09) : un cadre pour l'énergie, un second pour la magie quand elle est débloquée. */
function totauxHtml_(j){
  var AL=window.__SOREAL_IDLE_ALLOC_V1__;
  if(!AL||typeof AL.compteur!=='function')return '';
  var ng=ngus_(j);
  return '<div class="nl-ligne nl-totaux">'+AL.compteur('energy','ngu')+(ng&&ng.magicUnlocked?AL.compteur('magic','ngu'):'')+'</div>';
}

function barreOutilsHtml_(j){
  var el=document.getElementById('sorealIdleAugInputV1');
  var valeur=el&&el.value?el.value:String(typeof window.__lireMontantAugmentIdleV1__==='function'?window.__lireMontantAugmentIdleV1__():125);
  var lib=libre_(j,onglet);
  return '<div class="nl-barre-outils">'+
    '<div class="nl-ligne"><label for="sorealIdleAugInputV1">🎚️ Input</label><input id="sorealIdleAugInputV1" type="text" value="'+esc_(valeur)+'" title="Un nombre, ou une fraction comme 1/8 (résolue en 1/8 de l’énergie idle libre à la validation)" oninput="window.__saisirMontantAugmentIdleV1__(this.value)" onblur="window.__resoudreFractionInputIdleV1__&amp;&amp;window.__resoudreFractionInputIdleV1__(this);window.__saisirMontantAugmentIdleV1__(this.value)">'+
      '<span data-nl-libre-label>'+(onglet==='magic'?'Magie libre':'Énergie libre')+' : <b id="sorealIdleNguLibreV1">'+format_(lib)+'</b> '+(onglet==='magic'?'✨':'⚡')+'</span></div>'+
    '<div class="nl-ligne"><span>'+(onglet==='magic'?'🔮 Plafond de magie':'⚡ Plafond d’énergie')+'</span>'+
      '<button type="button" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.preset(\'cap\',1)">Max</button><button type="button" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.preset(\'cap\',.5)">1/2</button><button type="button" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.preset(\'cap\',.25)">1/4</button></div>'+
    '<div class="nl-ligne">'+
      '<span>💤 Idle</span><button type="button" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.preset(\'idle\',.5)">1/2</button><button type="button" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.preset(\'idle\',.25)">1/4</button>'+
      '<button type="button" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.vider(window.__SOREAL_IDLE_NGU_LABO_V1__.ongletCourant())">Tout retirer</button></div>'+
    totauxHtml_(j)+
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
    var tuyaux=liste.filter(function(n){return n.resource===res;}).map(function(n){return barreHtml_(n,ancre);}).join('');
    return '<div class="nl-section" data-nl-section="'+res+'"'+(onglet===res?'':' hidden')+'>'+
      '<label class="nl-avance"><input type="checkbox" '+(avance[res]?'checked ':'')+'onchange="window.__SOREAL_IDLE_NGU_LABO_V1__.avance(\''+res+'\',this.checked)"> Faire suivre '+(res==='magic'?'la magie':'l’énergie')+'</label>'+
      '<div class="nl-grille">'+tuyaux+'</div>'+
    '</div>';
  }
  var html=
    '<style>'+CSS+'</style>'+
    '<div class="nl-v1" data-nl-racine data-nl-onglet="'+onglet+'" data-nl-actif="'+(liste.some(function(n){return nombre_(n.allocation)>0;})?'1':'0')+'">'+ETOILES+
      '<div class="nl-haut">'+
        '<button type="button" class="nl-btn" onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.aide()">Je fais quoi ?</button>'+
        (magieOk?'<button type="button" class="nl-btn" data-nl-onglet-btn onclick="window.__SOREAL_IDLE_NGU_LABO_V1__.onglet(window.__SOREAL_IDLE_NGU_LABO_V1__.ongletCourant()===\'magic\'?\'energy\':\'magic\')">'+(onglet==='magic'?'Vers les NGU d’énergie':'Vers les NGU de magie')+'</button>':'')+
      '</div>'+
      '<header class="nl-entete"><div class="nl-titre" role="heading" aria-level="1">NGU</div><p>(Eh, c’est le nom de ce jeu !)</p></header>'+
      '<div class="nl-aide" id="sorealIdleNguAideV1"'+(aideOuverte?'':' hidden')+'>'+
        '<p><b>C’est quoi ?</b> Les NGU sont des entraîneurs : tu leur confies de l’énergie (et de la magie), ils font le sport pour toi. Chaque tuyau se remplit de lumière : quand il est plein, le NGU gagne un niveau et son bonus augmente.</p>'+
        '<ol>'+
          '<li><b>Place de l’énergie.</b> Dans un tuyau, avec +. La quantité est celle de la case Input (Max, 1/2 et 1/4 la remplissent), et − la retire.</li>'+
          '<li><b>Chacun son énergie.</b> Les NGU avancent en même temps, chacun avec sa propre énergie : plus tu en donnes, plus son tuyau se remplit vite.</li>'+
          '<li><b>Cible.</b> Le niveau à atteindre. Dès qu’il est atteint, l’énergie du NGU te revient (0 = aucun objectif).</li>'+
          '<li><b>Faire suivre l’énergie.</b> Quand un NGU atteint sa cible, son énergie passe automatiquement au NGU suivant, comme un relais.</li>'+
          '<li><b>Renaissance.</b> Les niveaux persistent à travers les Renaissances ; l’énergie et la magie placées te sont rendues à la Renaissance.</li>'+
          (paliers.length>1?'<li><b>Paliers.</b> Un seul palier reçoit de l’énergie et de la magie à la fois ; les effets des paliers débloqués se multiplient.</li>':'')+
        '</ol>'+
      '</div>'+
      chips+
      barreOutilsHtml_(j)+
      section('energy')+
      (magieOk?section('magic'):'')+
      '<details class="nl-resume"'+(resumeOuvert?' open':'')+' ontoggle="window.__SOREAL_IDLE_NGU_LABO_V1__.resume(this.open)"><summary>Effets de tous tes NGU</summary><div class="nl-resume-grille">'+resume+'</div></details>'+
    '</div>';
  demarrer_();
  return html;
}

/* ---------- vie des tuyaux : progression rejouée en direct ---------- */
function tick_(){
  var racine=document.querySelector('[data-nl-racine]');
  if(!racine){arreter_();return;}
  /* Les étoiles du fond scintillent dès qu'un tuyau reçoit de l'énergie ou de la magie. */
  var actif=Array.prototype.some.call(racine.querySelectorAll('[data-nl-ngu]'),function(f){return Number(f.dataset.nlSpl)>0;})?'1':'0';
  if(racine.getAttribute('data-nl-actif')!==actif)racine.setAttribute('data-nl-actif',actif);
  var maintenant=typeof performance!=='undefined'?performance.now():0;
  var H=H_();
  Array.prototype.forEach.call(racine.querySelectorAll('[data-nl-ngu]'),function(f){
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
      if(String(v)!==liq.getAttribute('data-nl-v')){
        liq.setAttribute('data-nl-v',String(v));
        liq.style.transform='scaleX('+v+')';
        var pct=f.querySelector('[data-nl-pct]');
        if(pct)pct.textContent=Math.round(v*100)+' %';
      }
    }
    var eta=f.querySelector('[data-nl-eta]');
    if(eta){
      var texteEta=etaTexte_(spl,frac,cible>0&&niveau>=cible);
      if(eta.__nlTexte!==texteEta){eta.__nlTexte=texteEta;eta.innerHTML=texteEta;}
    }
    var t=f.querySelector('[data-nl-niv]');
    if(t&&niveau!==Number(t.getAttribute('data-nl-v')||n0)){
      t.setAttribute('data-nl-v',String(niveau));
      t.textContent=format_(niveau);
    }
  });
}
/* Le fond d'étoiles défile avec les tuyaux (Norman, 2026-10-08 : plus de décalage de profondeur, trop gourmand en ressources). */
/* Le volet « Effets de tous tes NGU » garde son état d'ouverture : la page se redessine toutes les quelques secondes et le refermait aussitôt. */
var resumeOuvert=false;
/* « Je fais quoi ? » reste ouvert tant qu'on ne le ferme pas : la page se redessine toutes les quelques secondes et le refermait avant la fin de la lecture. */
var aideOuverte=false;
function demarrer_(){if(!timer)timer=setInterval(tick_,100);}
function arreter_(){if(timer){clearInterval(timer);timer=0;}}

/* ---------- actions ---------- */
function systemeAlloc_(j,res,delta){
  var s=systemeNgu_(j);
  if(s&&s.state&&s.state.allocation)s.state.allocation[res]=Math.max(0,nombre_(s.state.allocation[res])+delta);
}
/* Repart la progression d'un tuyau du moment présent (après un changement d'énergie : nouvelle vitesse, même niveau de liquide). */
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
  var valeur=mode==='max'?courant+Math.floor(lib):(mode==='plus'?courant+Math.min(pas_(),Math.floor(lib)):Math.max(0,courant-pas_()));
  var delta=valeur-courant;
  if(delta===0)return;
  if(H.jouerEffetAudioIdleV199_)H.jouerEffetAudioIdleV199_(mode==='moins'?'btMinus':'btPlus');
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
  if(b)b.textContent=onglet==='magic'?'Vers les NGU d’énergie':'Vers les NGU de magie';
  var j=H_()&&H_().getIdleEtat?H_().getIdleEtat():null;
  var lab=racine.querySelector('[data-nl-libre-label]');
  if(lab)lab.innerHTML=(onglet==='magic'?'Magie libre':'Énergie libre')+' : <b id="sorealIdleNguLibreV1">'+format_(libre_(j,onglet))+'</b> '+(onglet==='magic'?'✨':'⚡');
  var presets=racine.querySelector('.nl-barre-outils .nl-ligne:nth-child(2)>span');
  if(presets)presets.textContent=onglet==='magic'?'🔮 Plafond de magie':'⚡ Plafond d’énergie';
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
  resume:function(o){resumeOuvert=Boolean(o);},
  page:page,
  couleurs:COULEURS,
  aide:function(){var el=document.getElementById('sorealIdleNguAideV1');if(el){el.hidden=!el.hidden;aideOuverte=!el.hidden;}},
  ajuster:ajuster,cible:cible,avance:avance,onglet:changerOnglet,vider:vider,preset:preset,
  ongletCourant:function(){return onglet;},
  /* Pour les tests : la progression d'un tuyau à un instant donné (mêmes formules que tick_). */
  progression:function(p,spl,n0,ecouleSecondes){
    var total=p+ecouleSecondes/spl,gagnes=Math.floor(total);
    return spl<0.04?{fraction:1,niveau:n0+Math.floor(ecouleSecondes*Math.min(50,1/spl))}:{fraction:total-gagnes,niveau:n0+gagnes};
  }
};
})();
