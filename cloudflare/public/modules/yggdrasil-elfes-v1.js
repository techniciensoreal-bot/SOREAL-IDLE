/*
 * SOREAL IDLE — page Yggdrasil « elfique » (Norman, 2026-10-06 : « retravaille entièrement la page, elle doit faire penser aux elfes, même disposition que
 * l'Yggdrasil original de NGU Idle : 9 fruits par page, chaque fruit avec son image, les graines et la poop, cadre ITOPOD mélangé aux elfes »).
 *
 * Disposition de l'original : titre, bouton d'aide, onglets « Page 1 / Page 2 », grille 3 x 3 de fruits (nom et tier, barre de croissance, bouton principal
 * Activer / Manger / Récolter, bouton Améliorer, case Poop, choix Manger ou Récolter), puis un bandeau du bas : graines, poop, bonus, « tout manger / récolter »
 * et la case « poop seulement sur les fruits au tier maximum ».
 *
 * Aucune règle de jeu ne change : mêmes actions serveur (activateYggFruit, upgradeYggFruit, useYggFruit, achat Auto-Activate). Les images viennent de R2
 * (dossier idle/yggdrasil/, route /api/idle/media/ygg?name=<id du fruit | seed | poop>) ; tant qu'une image n'existe pas, le fruit garde son dessin (emoji).
 * Anti-spoil (règle n°2) : un fruit encore verrouillé n'apparaît pas, ni la page 2 tant qu'elle est vide, ni un total.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_YGG_V1__)return;

  var PAR_PAGE=9;
  var etat={page:1,aide:false,soloMax:true,choix:{},manquantes:{},chargees:{},pretsVus:null};
  function son_(nom,option){var S=window.__SOREAL_IDLE_YGG_SONS_V1__;if(S&&S.jouer)S.jouer(nom,option);}

  function H_(){return window.__SOREAL_IDLE_META_HOST_V130__;}
  function html_(t){var H=H_();return H&&H.idleHtml_?H.idleHtml_(t):String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function nb_(v){var n=Number(v);return Number.isFinite(n)?n:0;}
  function ent_(v){return Math.max(0,Math.floor(nb_(v)));}
  function grand_(v){var H=H_();return H&&H.formatGrandNombreIdleV70_?H.formatGrandNombreIdleV70_(v):String(Math.floor(nb_(v)));}
  function emoji_(id,nom){
    var I=window.__SOREAL_IDLE_ICONES_V1__;
    var e=I&&I.pour?I.pour('yggdrasil',id,nom):'';
    return e||'🌿';
  }
  function choix_(id){return etat.choix[id]||(etat.choix[id]={mode:'eat',poop:false});}
  function action_(payload){if(typeof window.__actionMetaV47__==='function')window.__actionMetaV47__(payload);}
  function rafraichir_(){
    var H=H_();
    if(H&&typeof H.rafraichirMenuRacineIdleV28_==='function')H.rafraichirMenuRacineIdleV28_();
  }

  /* Image R2 d'un fruit (ou « seed », « poop ») avec dessin de secours ; une image absente n'est plus redemandée pendant la visite. */
  function image_(nom,secours,classe){
    var fond='<span class="ygg-secours">'+html_(secours)+'</span>';
    if(etat.manquantes[nom])return fond;
    /* Image déjà chargée pendant la visite : plus de dessin de secours (pas de clignotement au rafraîchissement des chiffres). */
    /* La poop a la même image que dans la boutique AP (« Fertilizer », /shop/fertilizer.png). */
    var src=nom==='poop'?'/shop/fertilizer.png':'/api/idle/media/ygg?name='+encodeURIComponent(nom);
    return (etat.chargees[nom]?'':fond)+'<img class="ygg-img '+(classe||'')+'" src="'+src+'" alt="" loading="lazy" draggable="false" '+
      'onload="window.__SOREAL_IDLE_YGG_V1__.imageChargee(\''+html_(nom)+'\',this)" onerror="window.__SOREAL_IDLE_YGG_V1__.imageManquante(\''+html_(nom)+'\',this)">';
  }

  /* ---------- Style ---------- */
  function style_(){
    if(document.getElementById('ygg-style-v1'))return;
    var s=document.createElement('style');s.id='ygg-style-v1';
    s.textContent=[
      '.ygg-page{--or:#f0cc62;--or2:#b8862a;--vert:#2f7a4a;--vert2:#17432a;--nuit:#0f2418;--parch:#f4edc9;container-type:inline-size;max-width:760px;margin:6px auto 18px;font-family:Georgia,"Palatino Linotype",serif;color:var(--parch);}',
      /* Cadre général : pierre-forêt à la manière de l'ITOPOD (gros contour noir, ombre décalée) avec quatre anneaux (noir, or, noir, vert), lierre sur les côtés et médaillons en haut et en bas : un cadre fini, sans pièce qui dépasse. */
      '.ygg-cadre{position:relative;padding:calc(3cqw + 12px) calc(3cqw + 12px) calc(3.4cqw + 12px);border:3px solid #000;border-radius:10px;background:radial-gradient(ellipse 5px 3px at 7px 8px,rgba(130,215,130,.85) 96%,transparent) left 5px top 24px/14px 28px repeat-y,radial-gradient(ellipse 5px 3px at 7px 22px,rgba(240,204,98,.75) 96%,transparent) left 5px top 24px/14px 28px repeat-y,linear-gradient(90deg,transparent 6px,rgba(70,150,80,.9) 6px 8px,transparent 8px) left 5px top 0/14px 100% no-repeat,radial-gradient(ellipse 5px 3px at 7px 8px,rgba(130,215,130,.85) 96%,transparent) right 5px top 24px/14px 28px repeat-y,radial-gradient(ellipse 5px 3px at 7px 22px,rgba(240,204,98,.75) 96%,transparent) right 5px top 24px/14px 28px repeat-y,linear-gradient(90deg,transparent 6px,rgba(70,150,80,.9) 6px 8px,transparent 8px) right 5px top 0/14px 100% no-repeat,radial-gradient(ellipse at 20% 0%,rgba(120,200,120,.16),transparent 55%),radial-gradient(ellipse at 90% 100%,rgba(240,204,98,.10),transparent 50%),linear-gradient(160deg,#2c5a38,#183a25 50%,#0f2418);box-shadow:inset 0 0 0 3px #2f7a4a,inset 0 0 0 5px #000,inset 0 0 0 7px #e0b640,inset 0 0 0 9px #000,6px 6px 0 #000,0 0 28px rgba(80,200,120,.28);}',
      '.ygg-cadre::before,.ygg-cadre::after{position:absolute;left:50%;transform:translateX(-50%);padding:.05em .7em;border:3px solid #000;border-radius:999px;font-size:clamp(14px,3.4cqw,22px);line-height:1.2;color:#2b1d00;background:linear-gradient(180deg,#ffe38a,#d9a62f);box-shadow:inset 0 2px 0 rgba(255,255,255,.55),2px 2px 0 #000;}',
      '.ygg-cadre::before{content:"❦ ✦ ❦";top:-.7em}.ygg-cadre::after{content:"❧ ✦ ❧";bottom:-.7em}',
      /* Titre. */
      '.ygg-entete{display:flex;align-items:center;gap:2.4cqw;margin-bottom:2.4cqw;}',
      '.ygg-titre{flex:1;min-width:0;text-align:center;padding:1.2cqw 2cqw;border:3px solid #000;border-radius:4px;background:linear-gradient(180deg,#3d7a4c,#1c4a2c);box-shadow:inset 0 2px 0 rgba(255,255,255,.25),4px 4px 0 #000;clip-path:polygon(14px 0,calc(100% - 14px) 0,100% 50%,calc(100% - 14px) 100%,14px 100%,0 50%);}',
      '.ygg-titre b{display:block;font-size:clamp(15px,4.6cqw,30px);font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:var(--or);text-shadow:0 2px 0 #000,0 0 14px rgba(240,204,98,.6);}',
      '.ygg-titre small{display:block;font-size:clamp(9px,1.9cqw,13px);font-style:italic;color:#d8efc4;margin-top:2px;}',
      '.ygg-aide-bouton{flex:0 0 auto;max-width:21cqw;padding:.8em .9em;font:700 clamp(10px,2cqw,13px) Georgia,serif;line-height:1.15;color:#1c2a14;border:3px solid #000;border-radius:4px;background:linear-gradient(180deg,#f4edc9,#d3c68d);box-shadow:3px 3px 0 #000;cursor:pointer;min-height:44px;}',
      '.ygg-aide{display:none;margin:0 0 2.4cqw;padding:2cqw 2.6cqw;border:3px solid #000;border-radius:4px;background:rgba(7,22,13,.78);font-size:clamp(11px,2.2cqw,15px);line-height:1.45;box-shadow:4px 4px 0 #000;}',
      '.ygg-aide.ouvert{display:block;}',
      /* Onglets. */
      '.ygg-onglets{display:flex;gap:1.6cqw;margin:0 0 2.4cqw;padding:0 1.4cqw;border-bottom:3px solid #000;}',
      '.ygg-onglet{min-height:44px;padding:.4em 1.4em;font:900 clamp(11px,2.4cqw,16px) Georgia,serif;letter-spacing:.06em;color:#f4edc9;border:3px solid #000;border-bottom:0;border-radius:8px 8px 0 0;background:linear-gradient(180deg,#2a5a38,#143523);cursor:pointer;box-shadow:inset 0 2px 0 rgba(255,255,255,.2),3px 0 0 #000;}',
      '.ygg-onglet[aria-selected="true"]{color:#2b1d00;background:linear-gradient(180deg,#ffe38a,#d9a62f);text-shadow:0 1px 0 rgba(255,255,255,.5);}',
      /* Grille 3 x 3. */
      '.ygg-grille{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:2cqw;}',
      '.ygg-carte{position:relative;display:flex;flex-direction:column;gap:1.1cqw;padding:1.6cqw;border:3px solid #000;border-radius:6px;background:linear-gradient(180deg,rgba(56,110,70,.95),rgba(20,52,34,.97));box-shadow:inset 0 0 0 2px rgba(240,204,98,.38),inset 0 2px 0 rgba(255,255,255,.16),inset 0 -3px 0 rgba(0,0,0,.4),4px 4px 0 #000;min-width:0;}',
      '.ygg-carte.pret{box-shadow:inset 0 2px 0 rgba(255,255,255,.2),inset 0 -3px 0 rgba(0,0,0,.4),4px 4px 0 #000,0 0 18px rgba(240,204,98,.75);}',
      '.ygg-carte::before{content:"❦";position:absolute;top:-.55em;left:.35em;font-size:clamp(12px,3cqw,20px);color:var(--or);text-shadow:0 1px 0 #000,0 0 6px rgba(240,204,98,.7);}',
      '.ygg-nom{padding:.25em .5em;border:2px solid #000;border-radius:3px;text-align:center;font-weight:900;font-size:clamp(9px,2.1cqw,14px);line-height:1.15;color:#fff3c4;text-shadow:0 1px 0 #000;background:linear-gradient(180deg,#355f40,#1a3a26);min-height:2.4em;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.3em;}',
      '.ygg-nom span{color:var(--or);font-weight:700;}',
      '.ygg-vitre{position:relative;overflow:hidden;aspect-ratio:5/4;border:3px solid #000;border-radius:12px;background:radial-gradient(ellipse at 50% 35%,#4a8a58,#0d2a18);box-shadow:inset 0 0 18px rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;}',
      '.ygg-secours{font-size:clamp(26px,9cqw,60px);filter:drop-shadow(0 2px 0 rgba(0,0,0,.6));}',
      '.ygg-img{position:absolute;inset:6%;width:88%;height:88%;object-fit:contain;filter:drop-shadow(0 3px 2px rgba(0,0,0,.6));image-rendering:auto;}',
      '.ygg-barre{position:relative;height:clamp(9px,2cqw,14px);border:2px solid #000;border-radius:3px;background:#0a1d12;overflow:hidden;}',
      '.ygg-barre i{display:block;height:100%;background:linear-gradient(180deg,#d6ff9a,#55b062);box-shadow:0 0 8px rgba(160,255,150,.6);}',
      '.ygg-barre.vide i{background:#7a2d2d;}',
      '.ygg-temps{font-size:clamp(8px,1.7cqw,12px);text-align:center;color:#cfe8bf;line-height:1.2;}',
      '.ygg-btn{appearance:none;-webkit-appearance:none;cursor:pointer;min-height:42px;padding:.3em .4em;border:3px solid #000;border-radius:4px;font:900 clamp(9px,2.1cqw,14px) Georgia,serif;letter-spacing:.03em;color:#2b1d00;background:linear-gradient(180deg,#ffe38a,#d9a62f);box-shadow:inset 0 2px 0 rgba(255,255,255,.55),3px 3px 0 #000;touch-action:manipulation;-webkit-tap-highlight-color:transparent;line-height:1.1;}',
      '.ygg-btn small{display:block;font-weight:700;font-size:.78em;opacity:.8;}',
      '.ygg-btn:active:not(:disabled){transform:translate(2px,2px);box-shadow:inset 0 2px 0 rgba(255,255,255,.4),1px 1px 0 #000;}',
      '.ygg-btn:disabled{cursor:default;color:#7d8a70;background:linear-gradient(180deg,#46543f,#2c3a2a);box-shadow:inset 0 2px 0 rgba(255,255,255,.1),3px 3px 0 #000;}',
      '.ygg-btn.vert{color:#f4edc9;background:linear-gradient(180deg,#4ea866,#256b3c);}',
      '.ygg-btn.vert:disabled{color:#7d8a70;background:linear-gradient(180deg,#46543f,#2c3a2a);}',
      '.ygg-actions{display:grid;grid-template-columns:1fr;gap:1.1cqw;}',
      '.ygg-mode{display:grid;grid-template-columns:1fr 1fr;border:2px solid #000;border-radius:4px;overflow:hidden;}',
      '.ygg-mode button{min-height:36px;padding:.2em .1em;border:0;cursor:pointer;font:800 clamp(8px,1.8cqw,12px) Georgia,serif;color:#cfe8bf;background:#17381f;}',
      '.ygg-mode button+button{border-left:2px solid #000;}',
      '.ygg-mode button[aria-pressed="true"]{color:#2b1d00;background:linear-gradient(180deg,#ffe38a,#d9a62f);}',
      '.ygg-poop{display:flex;align-items:center;justify-content:center;gap:.4em;min-height:36px;border:2px solid #000;border-radius:4px;cursor:pointer;font:800 clamp(8px,1.8cqw,12px) Georgia,serif;color:#e9d9b6;background:#3a2a18;}',
      '.ygg-poop[aria-pressed="true"]{color:#fff;background:linear-gradient(180deg,#8a5a2a,#5b3a18);box-shadow:0 0 10px rgba(240,170,80,.7);}',
      '.ygg-poop:disabled{opacity:.45;cursor:default;}',
      '.ygg-poop .ygg-mini{position:relative;width:1.5em;height:1.5em;display:inline-flex;align-items:center;justify-content:center;}',
      '.ygg-mini .ygg-img{inset:0;width:100%;height:100%;}',
      '.ygg-mini .ygg-secours{font-size:1.2em;}',
      '.ygg-auto{font-size:clamp(8px,1.6cqw,11px);text-align:center;color:#a8e0a8;min-height:1.2em;}',
      '.ygg-auto button{width:100%;min-height:34px;font-size:clamp(8px,1.7cqw,11px);}',
      /* Bandeau du bas. */
      '.ygg-bas{margin-top:2.6cqw;padding:2.2cqw;border:3px solid #000;border-radius:6px;background:linear-gradient(180deg,rgba(18,48,30,.96),rgba(8,26,16,.98));box-shadow:inset 0 2px 0 rgba(255,255,255,.12),5px 5px 0 #000;display:grid;grid-template-columns:1.1fr 1fr;gap:2.2cqw;align-items:center;}',
      '.ygg-monnaies{display:flex;flex-wrap:wrap;gap:2.4cqw;align-items:center;}',
      '.ygg-monnaie{display:flex;align-items:center;gap:1.2cqw;font-size:clamp(15px,4.2cqw,28px);font-weight:900;color:var(--or);text-shadow:0 2px 0 #000;}',
      '.ygg-monnaie .ygg-vignette{position:relative;width:clamp(34px,10cqw,64px);height:clamp(34px,10cqw,64px);display:flex;align-items:center;justify-content:center;border:3px solid #000;border-radius:10px;background:radial-gradient(circle at 50% 35%,#4a8a58,#0d2a18);}',
      '.ygg-vignette .ygg-img{inset:8%;width:84%;height:84%;}',
      '.ygg-vignette .ygg-secours{font-size:clamp(20px,6cqw,38px);}',
      '.ygg-bonus{grid-column:1/2;font-size:clamp(9px,2cqw,14px);line-height:1.5;}',
      '.ygg-bonus b{color:var(--or);}',
      '.ygg-actions-bas{display:grid;gap:1.4cqw;}',
      '.ygg-solo{display:flex;align-items:center;gap:.6em;min-height:44px;font-size:clamp(9px,1.9cqw,13px);cursor:pointer;}',
      '.ygg-solo input{width:22px;height:22px;accent-color:#e0b640;flex:0 0 auto;}',
      '.ygg-note{margin-top:1.6cqw;font-size:clamp(8px,1.7cqw,12px);color:#b9d8a8;line-height:1.4;text-align:center;}',
      '@container (max-width:520px){.ygg-bas{grid-template-columns:1fr}.ygg-bonus{grid-column:auto}.ygg-grille{gap:1.6cqw}.ygg-carte{padding:1.2cqw;gap:.9cqw}}',
      '@media (prefers-reduced-motion:reduce){.ygg-btn{transition:none}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ---------- Données ---------- */
  function lire_(j){
    var meta=window.__SOREAL_IDLE_META_V130__;
    var s=meta&&meta.systemeMetaParIdIdleV130_?meta.systemeMetaParIdIdleV130_(j,'yggdrasil'):null;
    if(!s||!s.state||!s.state.unlocked)return null;
    var m=(j&&j.systemes)||{};
    var data=s.state.data||{};
    var x=m.yggExtra||{};
    var macOk=Boolean(meta.systemeMetaParIdIdleV130_(j,'macguffins')&&meta.systemeMetaParIdIdleV130_(j,'macguffins').state&&meta.systemeMetaParIdIdleV130_(j,'macguffins').state.unlocked);
    var fruits=data.fruits||{};
    var xf=x.fruits||{};
    var visibles=(Array.isArray(m.yggFruits)?m.yggFruits:[]).filter(function(def){
      if(/MacGuffin/i.test(String(def.name||def.id||''))&&!macOk)return false;
      var e=xf[def.id]||{};var f=fruits[def.id]||{};
      return !(e.unlocked===false&&!(nb_(f.tier)>0));
    }).map(function(def){
      var f=fruits[def.id]||{};var e=xf[def.id]||{};
      var tier=ent_(f.tier);
      var growth=Math.max(0,nb_(f.growthHours));
      return {def:def,f:f,e:e,tier:tier,growth:growth,active:Boolean(f.active),pret:Boolean(f.active)&&growth>=1,max:e.nextTierCost===null};
    });
    return {s:s,m:m,x:x,data:data,fruits:visibles,seeds:ent_(m.currencies&&m.currencies.seeds),exp:nb_(m.currencies&&m.currencies.experience),poop:ent_(x.poop),
      maxTier:ent_(x.maxTier)||10,tierSec:nb_(x.tierSeconds)>0?nb_(x.tierSeconds):3600};
  }

  function carte_(d,v){
    var def=v.def,id=def.id,c=choix_(id);
    var nom=html_(def.name||id);
    var frac=v.tier>0?Math.max(0,Math.min(1,v.growth/v.tier)):0;
    var heures=v.growth*d.tierSec/3600;
    var temps=v.tier>0?(window.__SOREAL_IDLE_META_HOST_V130__.formatterHeuresIdleV47_?window.__SOREAL_IDLE_META_HOST_V130__.formatterHeuresIdleV47_(heures)+' / '+window.__SOREAL_IDLE_META_HOST_V130__.formatterHeuresIdleV47_(v.tier*d.tierSec/3600):''):'';
    var coutAct=v.e.activationCost!=null?v.e.activationCost:(def.activationCost||0);
    var ress=def.resource==='magic'?'Magic':'Energy';
    var principal;
    if(v.tier<=0)principal='<button type="button" class="ygg-btn vert" disabled>Activer</button>';
    else if(!v.active)principal='<button type="button" class="ygg-btn vert" title="Coût : '+html_(grand_(coutAct))+' '+ress+'" onclick="window.__SOREAL_IDLE_YGG_V1__.activer(\''+html_(id)+'\')">Activer<small>'+html_(grand_(coutAct))+' '+ress+'</small></button>';
    else if(!v.pret)principal='<button type="button" class="ygg-btn vert" disabled>Pousse…</button>';
    else principal='<button type="button" class="ygg-btn" onclick="window.__SOREAL_IDLE_YGG_V1__.utiliser(\''+html_(id)+'\')">'+(c.mode==='harvest'?'Récolter':'Manger')+'</button>';
    var coutUp=v.e.nextTierCost;
    var upLabel=v.tier<=0?'Débloquer':'Améliorer';
    var amelio=v.max?'<button type="button" class="ygg-btn vert" disabled>Tier max</button>'
      :'<button type="button" class="ygg-btn vert" '+(d.seeds>=nb_(coutUp)?'':'disabled ')+'onclick="window.__SOREAL_IDLE_YGG_V1__.ameliorer(\''+html_(id)+'\')">'+upLabel+(coutUp!=null?'<small>'+html_(grand_(coutUp))+' graines</small>':'')+'</button>';
    var auto='';
    if(v.e.autoActivate)auto='<div class="ygg-auto">⚡ Auto-Activate</div>';
    else if(v.e.autoShopId)auto='<div class="ygg-auto"><button type="button" class="ygg-btn" '+(d.exp>=nb_(v.e.autoCost)?'':'disabled ')+'title="Cap '+ress+' total requis : '+html_(grand_(v.e.autoRequiredCap||0))+'" onclick="window.__acheterExpShopIdleV1__(\''+html_(v.e.autoShopId)+'\',1)">Auto-Activate<small>'+html_(grand_(v.e.autoCost||0))+' EXP</small></button></div>';
    return '<div class="ygg-carte'+(v.pret?' pret':'')+'" data-fruit="'+html_(id)+'">'+
      '<div class="ygg-nom">'+nom+' <span>('+v.tier+'/'+d.maxTier+')</span></div>'+
      '<div class="ygg-vitre">'+image_(id,emoji_(id,def.name))+'</div>'+
      '<div class="ygg-barre'+(v.tier>0?'':' vide')+'" title="Croissance"><i style="width:'+(frac*100).toFixed(1)+'%"></i></div>'+
      '<div class="ygg-temps">'+(temps||'&nbsp;')+'</div>'+
      '<div class="ygg-actions">'+principal+amelio+'</div>'+
      '<button type="button" class="ygg-poop" aria-pressed="'+(c.poop&&d.poop>0)+'" '+(d.poop>0?'':'disabled ')+'onclick="window.__SOREAL_IDLE_YGG_V1__.poop(\''+html_(id)+'\')"><span class="ygg-mini">'+image_('poop','💩')+'</span>Poop</button>'+
      '<div class="ygg-mode" role="group" aria-label="Manger ou récolter"><button type="button" aria-pressed="'+(c.mode!=='harvest')+'" onclick="window.__SOREAL_IDLE_YGG_V1__.mode(\''+html_(id)+'\',\'eat\')">Manger</button><button type="button" aria-pressed="'+(c.mode==='harvest')+'" onclick="window.__SOREAL_IDLE_YGG_V1__.mode(\''+html_(id)+'\',\'harvest\')">Récolter</button></div>'+
      auto+
    '</div>';
  }

  function bonus_(d){
    var perm=d.data.permanent||{};
    var lignes=[];
    var ids={};d.fruits.forEach(function(v){ids[v.def.id]=true;});
    if(ids.luck)lignes.push(['Bonus de chance de drop',nb_(perm.luckDropPct),' %']);
    if(ids.powerAlpha)lignes.push(['Bonus Fruit de Puissance α',nb_(d.data.runPowerAlphaValue),'']);
    if(ids.powerBeta)lignes.push(['Bonus Fruit de Puissance β',nb_(perm.powerBetaValue),'']);
    if(ids.powerDelta)lignes.push(['Bonus Fruit de Puissance δ',nb_(perm.powerDeltaValue),'']);
    if(ids.numbers)lignes.push(['Bonus Fruit de Nombres',nb_(perm.numbersValue),'']);
    return lignes.filter(function(l){return l[1]>0;}).map(function(l){return html_(l[0])+' : <b>'+html_(grand_(l[1]))+l[2]+'</b>';}).join('<br>');
  }

  function page(j){
    style_();
    var d=lire_(j);
    if(!d)return '';
    var pretsIds=d.fruits.filter(function(v){return v.pret;}).map(function(v){return v.def.id;});
    if(etat.pretsVus!==null&&pretsIds.some(function(id){return etat.pretsVus.indexOf(id)===-1;}))son_('pret');
    etat.pretsVus=pretsIds;
    var pages=Math.max(1,Math.ceil(d.fruits.length/PAR_PAGE));
    if(etat.page>pages)etat.page=pages;
    var debut=(etat.page-1)*PAR_PAGE;
    var cartes=d.fruits.slice(debut,debut+PAR_PAGE).map(function(v){return carte_(d,v);}).join('');
    var onglets='';
    if(pages>1){
      onglets='<div class="ygg-onglets" role="tablist">';
      for(var p=1;p<=pages;p++)onglets+='<button type="button" role="tab" class="ygg-onglet" aria-selected="'+(p===etat.page)+'" onclick="window.__SOREAL_IDLE_YGG_V1__.aller('+p+')">Page '+p+'</button>';
      onglets+='</div>';
    }
    var pretsMax=d.fruits.some(function(v){return v.pret&&v.max;});
    var prets=d.fruits.some(function(v){return v.pret&&v.tier>=1;});
    var brown=d.x.brownHeart?' · Brown Heart : '+(d.x.nextFreePoopIn===1?'la prochaine est gratuite':'gratuite dans '+ent_(d.x.nextFreePoopIn)):'';
    var b=bonus_(d);
    var poopFacteur=String(Math.round((nb_(d.x.poopFactor)||1.5)*100)/100).replace('.',',');
    return '<div class="ygg-page"><div class="ygg-cadre">'+
      '<div class="ygg-entete"><button type="button" class="ygg-aide-bouton" onclick="window.__SOREAL_IDLE_YGG_V1__.aide()">Que faire ici ?</button>'+
        '<div class="ygg-titre"><b>Yggdrasil, l’Arbre-Monde</b><small>(et pourtant tu le fertilises avec du caca)</small></div></div>'+
      '<div class="ygg-aide'+(etat.aide?' ouvert':'')+'">Chaque tier donne une heure de croissance de plus. <b>Active</b> un fruit, laisse-le pousser, puis <b>mange-le</b> pour son effet ou <b>récolte-le</b> pour doubler les graines. Les graines servent à <b>améliorer</b> les fruits. Une poop (+50 % avant arrondi) s’utilise sur le prochain fruit mangé ou récolté.</div>'+
      onglets+
      '<div class="ygg-grille">'+cartes+'</div>'+
      '<div class="ygg-bas">'+
        '<div class="ygg-monnaies">'+
          '<div class="ygg-monnaie"><span class="ygg-vignette">'+image_('seed','🌱')+'</span>'+html_(grand_(d.seeds))+'</div>'+
          '<div class="ygg-monnaie"><span class="ygg-vignette">'+image_('poop','💩')+'</span>'+html_(grand_(d.poop))+'</div>'+
        '</div>'+
        '<div class="ygg-actions-bas">'+
          '<button type="button" class="ygg-btn" '+(pretsMax?'':'disabled ')+'onclick="window.__SOREAL_IDLE_YGG_V1__.tout(\'max\')">Manger / récolter tous les fruits au tier max</button>'+
          '<button type="button" class="ygg-btn" '+(prets?'':'disabled ')+'onclick="window.__SOREAL_IDLE_YGG_V1__.tout(\'tous\')">Manger / récolter tous les fruits ≥ tier 1</button>'+
          '<label class="ygg-solo"><input type="checkbox" '+(etat.soloMax?'checked ':'')+'onchange="window.__SOREAL_IDLE_YGG_V1__.soloMax(this.checked)"> Poop seulement sur les fruits au tier max</label>'+
        '</div>'+
        (b?'<div class="ygg-bonus">'+b+'</div>':'')+
      '</div>'+
      '<div class="ygg-note">Poop ×'+html_(poopFacteur)+' · tier max '+d.maxTier+html_(brown)+' · poop achetable à la boutique AP, rayon Boosts.</div>'+
    '</div></div>';
  }

  /* ---------- Actions ---------- */
  function trouver_(id){
    var d=lire_(H_().getIdleEtat());
    if(!d)return null;
    for(var i=0;i<d.fruits.length;i++)if(d.fruits[i].def.id===id)return {d:d,v:d.fruits[i]};
    return null;
  }
  function lancerUsage_(id,avecPoop){
    var c=choix_(id);
    var payload={action:'useYggFruit',fruit:String(id),mode:c.mode==='harvest'?'harvest':'eat'};
    if(avecPoop)payload.poop=true;
    action_(payload);
  }
  var API={
    page:page,
    imageChargee:function(nom,img){etat.chargees[nom]=true;var f=img&&img.previousElementSibling;if(f&&f.classList&&f.classList.contains('ygg-secours'))f.style.display='none';},
    imageManquante:function(nom,img){etat.manquantes[nom]=true;if(img)img.style.display='none';},
    activer:function(id){son_('activer');action_({action:'activateYggFruit',fruit:String(id)});},
    ameliorer:function(id){son_('ameliorer');action_({action:'upgradeYggFruit',fruit:String(id)});},
    utiliser:function(id){
      var c=choix_(id);var t=trouver_(id);
      son_(c.mode==='harvest'?'recolter':'manger');
      lancerUsage_(id,Boolean(c.poop&&t&&t.d.poop>0));
      c.poop=false;
    },
    mode:function(id,mode){var m=mode==='harvest'?'harvest':'eat';if(choix_(id).mode!==m)son_('interrupteur',m==='harvest');choix_(id).mode=m;rafraichir_();},
    poop:function(id){var c=choix_(id);c.poop=!c.poop;if(c.poop)son_('poop');else son_('interrupteur',false);rafraichir_();},
    aller:function(p){if(ent_(p)!==etat.page)son_('onglet');etat.page=Math.max(1,ent_(p));rafraichir_();},
    aide:function(){son_('aide');etat.aide=!etat.aide;var e=document.querySelector('.ygg-aide');if(e)e.classList.toggle('ouvert',etat.aide);},
    soloMax:function(v){etat.soloMax=Boolean(v);son_('interrupteur',Boolean(v));},
    /* « Manger / récolter tous… » : chaque fruit prêt reçoit son mode choisi, la poop (si cochée et en stock) selon la case « seulement au tier max ». */
    tout:function(critere){
      var d=lire_(H_().getIdleEtat());
      if(!d)return 0;
      var poopRestante=d.poop;
      var cibles=d.fruits.filter(function(v){return v.pret&&(critere==='max'?v.max:v.tier>=1);});
      if(cibles.length)son_('tout');
      cibles.forEach(function(v,i){
        var c=choix_(v.def.id);
        var avec=Boolean(c.poop&&poopRestante>0&&(!etat.soloMax||v.max));
        if(avec){poopRestante-=1;c.poop=false;}
        setTimeout(function(){lancerUsage_(v.def.id,avec);},i*350);
      });
      return cibles.length;
    },
    etat:etat,
    PAR_PAGE:PAR_PAGE
  };
  window.__SOREAL_IDLE_YGG_V1__=API;
})();
