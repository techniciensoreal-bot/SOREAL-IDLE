/*
 * SOREAL IDLE — page Questing (quêtes de la Bête).
 *
 * Module client isolé (2026-09-23). Il n'affiche QUE ce que le serveur a
 * déjà calculé dans snapshot.questing (idle-questing-v1.js) : aucune
 * formule de jeu n'est recalculée ici. Les actions passent par le même
 * canal que les autres pages méta (window.__SOREAL_IDLE_META_V130__.
 * actionMetaIdleV130_), avec les actions serveur questStart / questSkip /
 * questHandIn / questComplete / questIdle / questMerge / questPrefs.
 * Branché par une seule ligne dans pageSystemeMetaIdleV130_
 * (meta-progression-v130.js).
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_QUESTING_V1__)return;

  function H(){return window.__SOREAL_IDLE_META_HOST_V130__;}
  function esc(v){const h=H();return h&&h.idleHtml_?h.idleHtml_(v):String(v==null?'':v);}
  function ent(v){const h=H();return h&&h.idleEntier_?h.idleEntier_(v):Math.max(0,Math.floor(Number(v)||0));}
  function action(payload){
    const meta=window.__SOREAL_IDLE_META_V130__;
    if(meta&&typeof meta.actionMetaIdleV130_==='function')meta.actionMetaIdleV130_(payload);
  }
  function duree(secondes){
    const n=Number(secondes);
    if(!Number.isFinite(n)||n<=0)return '—';
    if(n<60)return Math.round(n)+' s';
    if(n<3600)return Math.round(n/60)+' min';
    if(n<86400)return (n/3600).toFixed(1).replace('.',',')+' h';
    return (n/86400).toFixed(1).replace('.',',')+' j';
  }
  function pct(v,dec){return (Number(v||0)*100).toFixed(dec==null?1:dec).replace('.',',')+' %';}
  function bouton(libelle,js,desactive){
    return '<button type="button" class="soreal-idle-expand-button-v25"'+(desactive?' disabled':'')+' onclick="'+js+'">'+libelle+'</button>';
  }

  function blocQuete(q,data){
    if(!q){
      const zones=Array.isArray(data.eligibleZones)?data.eligibleZones:[];
      if(!zones.length){
        return '<div class="soreal-idle-note-v4">Aucune zone disponible : une zone ne donne des quêtes qu’une fois son set d’équipement complété (tous les objets niveau 100).</div>';
      }
      return '<div class="soreal-idle-note-v4">Aucune quête en cours. Zones possibles : '+zones.map(function(z){return esc(z.zoneName)+' ('+esc(z.itemName)+')';}).join(', ')+'.</div>'+
        '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">'+
          bouton('⭐ Quête majeure ('+ent(data.majorsBanked)+' en banque)','window.__questingIdleV1__.demarrer(true)',!(data.majorsBanked>0))+
          bouton('📜 Quête mineure','window.__questingIdleV1__.demarrer(false)',false)+
        '</div>';
    }
    const ratio=q.required>0?Math.min(1,q.progress/q.required):0;
    return '<div class="soreal-idle-note-v4"><b>'+(q.major?'⭐ Quête majeure':'📜 Quête mineure')+'</b> — rapporter <b>'+esc(q.itemName)+'</b> ('+esc(q.zoneName)+')</div>'+
      '<div class="soreal-idle-note-v4" style="margin-top:5px">Progression : <b>'+ent(q.progress)+' / '+ent(q.required)+'</b>'+(q.usedIdle?' · barre d’idle déjà remplie (récompense non doublée)':' · récompense active (x2)')+'</div>'+
      '<div style="height:8px;background:#2a2f3d;border-radius:4px;margin-top:6px;overflow:hidden"><div style="height:100%;width:'+(ratio*100).toFixed(1)+'%;background:#d97706"></div></div>'+
      (data.idle?'<div class="soreal-idle-note-v4" style="margin-top:5px">Barre d’idle : '+pct(q.idleBar,0)+' · fin estimée en idle : '+duree(q.idleEtaSeconds)+'</div>':'')+
      '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">'+
        bouton('📦 Remettre les objets','window.__questingIdleV1__.remettre()',false)+
        bouton('✅ Terminer la quête','window.__questingIdleV1__.terminer()',!q.readyToComplete)+
        bouton('⏭️ Abandonner','window.__questingIdleV1__.abandonner()',false)+
        (data.goToQuestZone?bouton('🧭 Aller à la zone de quête','window.__questingIdleV1__.allerZone(\''+esc(q.zone)+'\')',false):'')+
      '</div>';
  }

  function blocObjets(items){
    if(!Array.isArray(items)||!items.length)return '<div class="soreal-idle-note-v4">Aucun objet de quête en stock.</div>';
    return items.map(function(it){
      const niveaux=(it.levels||[]).map(function(l){
        return '<span class="soreal-idle-note-v4" style="display:inline-block;margin:2px 6px 2px 0">niv. '+ent(l.level)+' × '+ent(l.count)+' (vaut '+ent(l.handInValue)+')</span>';
      }).join('');
      /* Fusion : les deux objets de plus bas niveau (le serveur applique la règle de niveau). */
      const pile=[];
      (it.levels||[]).forEach(function(l){for(let i=0;i<Math.min(2,ent(l.count));i++)pile.push(ent(l.level));});
      const fusion=pile.length>=2&&pile[0]<100
        ?'<div style="margin-top:6px">'+bouton('🔀 Fusionner niv. '+pile[0]+' + niv. '+pile[1],'window.__questingIdleV1__.fusionner(\''+esc(it.zone)+'\','+pile[0]+','+pile[1]+')',false)+'</div>'
        :'';
      return '<div class="soreal-idle-section-v8" style="margin:0 0 8px"><b>'+esc(it.itemName)+'</b> — '+esc(it.zoneName)+(it.maxed?' · ✔ niveau 100 atteint (+2 % QP)':'')+'<div style="margin-top:5px">'+(niveaux||'—')+'</div>'+fusion+'</div>';
    }).join('');
  }

  function page(j){
    const h=H();
    const meta=window.__SOREAL_IDLE_META_V130__;
    const s=meta&&meta.systemeMetaParIdIdleV130_?meta.systemeMetaParIdIdleV130_(j,'questing'):null;
    const data=j&&j.systemes&&j.systemes.questing?j.systemes.questing:null;
    const titre='📋 Quêtes';
    const sous='La Bête te confie des quêtes : rapporte des objets de quête trouvés dans une zone d’Aventure pour gagner des QP (Quirks) et de l’AP.';
    if(!s||!s.state||!s.state.unlocked||!data||!data.unlocked){
      return h.entetePageIdleV28_(titre,sous)+'<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">🔒 Système verrouillé (utilise le Heroic Sigil de The Beast).</div>';
    }
    const qp=j.systemes.currencies?ent(j.systemes.currencies.qp):0;
    const rp=data.rewardPreview||{};
    const ligneRecompense=function(nom,r){
      return '<div class="soreal-idle-note-v4">'+nom+' : active <b>'+ent(r&&r.active&&r.active.qp)+' QP / '+ent(r&&r.active&&r.active.ap)+' AP</b> · idle <b>'+ent(r&&r.idle&&r.idle.qp)+' QP / '+ent(r&&r.idle&&r.idle.ap)+' AP</b></div>';
    };
    return h.entetePageIdleV28_(titre,sous)+
      '<div class="soreal-idle-summary-grid-v28">'+
        '<div class="soreal-idle-summary-v28">QP disponibles<b>'+qp+'</b></div>'+
        '<div class="soreal-idle-summary-v28">Quêtes majeures<b>'+ent(data.majorsBanked)+' / '+ent(data.bankCap)+'</b></div>'+
        '<div class="soreal-idle-summary-v28">Prochaine majeure<b>'+(data.secondsToNextMajor==null?'banque pleine':duree(data.secondsToNextMajor))+'</b></div>'+
        '<div class="soreal-idle-summary-v28">Beast Butter<b>'+ent(data.butters)+'</b></div>'+
      '</div>'+
      '<div class="soreal-idle-section-v8"><div class="soreal-idle-window-title-v31">🎯 Quête en cours</div>'+blocQuete(data.quest,data)+'</div>'+
      '<div class="soreal-idle-section-v8"><div class="soreal-idle-window-title-v31">💤 Mode idle</div>'+
        '<div class="soreal-idle-note-v4">'+(data.idle?'Actif':'Inactif')+' — progression sans être dans la zone, 1 objet toutes les '+duree(data.idleSecondsPerItem)+' (diviseur '+ent(data.idleDivider)+'). Les objets ne tombent plus pendant l’idle, et une quête dont la barre d’idle s’est remplie n’est pas doublée.'+(data.trulyIdle?' Truly Idle Questing : remise et nouvelle quête automatiques.':'')+'</div>'+
        '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">'+
          bouton(data.idle?'⏸️ Désactiver l’idle':'▶️ Activer l’idle','window.__questingIdleV1__.idle('+(!data.idle)+')',false)+
          bouton(data.preferMajor?'Relance auto : majeure d’abord':'Relance auto : mineure','window.__questingIdleV1__.prefs({preferMajor:'+(!data.preferMajor)+'})',false)+
          bouton(data.useButter?'🧈 Butter : utilisé':'🧈 Butter : gardé','window.__questingIdleV1__.prefs({useButter:'+(!data.useButter)+'})',false)+
        '</div>'+
      '</div>'+
      '<div class="soreal-idle-section-v8"><div class="soreal-idle-window-title-v31">🎁 Récompenses</div>'+
        ligneRecompense('Majeure',rp.major)+ligneRecompense('Mineure',rp.minor)+
        '<div class="soreal-idle-note-v4" style="margin-top:5px">Chance d’objet de quête par ennemi : '+pct(data.dropChance,2)+(data.fixedItems?' · quêtes fixées à 50 objets':' · 50 à 59 objets par quête')+(data.handInDivider?' · remise : 1 + niveau / '+ent(data.handInDivider):'')+'</div>'+
        (data.lastReward?'<div class="soreal-idle-note-v4" style="margin-top:5px">Dernière quête : +'+ent(data.lastReward.qp)+' QP, +'+ent(data.lastReward.ap)+' AP'+(data.lastReward.butter?' (Beast Butter)':'')+'</div>':'')+
      '</div>'+
      '<div class="soreal-idle-section-v8"><div class="soreal-idle-window-title-v31">📦 Objets de quête</div>'+blocObjets(data.items)+'</div>';
  }

  window.__questingIdleV1__={
    demarrer:function(majeure){action({action:'questStart',major:Boolean(majeure)});},
    remettre:function(){action({action:'questHandIn'});},
    terminer:function(){action({action:'questComplete'});},
    abandonner:function(){action({action:'questSkip'});},
    idle:function(actif){action({action:'questIdle',active:Boolean(actif)});},
    prefs:function(p){action(Object.assign({action:'questPrefs'},p||{}));},
    fusionner:function(zone,a,b){action({action:'questMerge',zone:String(zone||''),levelA:Number(a)||0,levelB:Number(b)||0});},
    allerZone:function(zone){action({action:'adventure',adventure:{action:'selectZone',zone:String(zone||'')}});}
  };
  window.__SOREAL_IDLE_QUESTING_V1__={page:page};
})();
