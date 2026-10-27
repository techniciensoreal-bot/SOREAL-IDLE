/*
 * SOREAL IDLE — pages Yggdrasil (repli) et Gold Diggers (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe).
 * Extrait tel quel de meta-progression-v130.js (même code, mêmes ponts window.__x__ pour les onclick inline).
 * Dépendances : window.__SOREAL_IDLE_META_V130__ et window.__SOREAL_IDLE_META_HOST_V130__, relus seulement à l'exécution
 * (l'ordre de chargement des <script> n'a pas d'importance). Expose window.__SOREAL_IDLE_YGG_DIGGERS_PAGE_V1__.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_YGG_DIGGERS_PAGE_V1__)return;

      function systemeMetaParIdIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.systemeMetaParIdIdleV130_.apply(null,arguments);}
      function emojiNomIdleV1_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.emojiNomIdleV1_.apply(null,arguments);}

      /*
       * Yggdrasil (2026-09-23, Ygg extra) : Poop (case à cocher par fruit, envoyée avec Manger/Récolter),
       * Auto-Activate (boutique EXP, achetable ici), durée d'un tier (The Beast's Fertilizer), coût du
       * prochain tier. Données : j.systemes.yggExtra (idle-yggdrasil-extra-v1.js). L'ancien résumé
       * « Réservé Energy/Magic » (modèle de réservation retiré en V52, toujours 0) est remplacé.
       */
      const yggPoopChoixIdleV1_={};

      function basculerPoopYggIdleV1_(fruit,coche){yggPoopChoixIdleV1_[String(fruit)]=Boolean(coche);}
      window.__basculerPoopYggIdleV1__=basculerPoopYggIdleV1_;

      function utiliserFruitYggIdleV1_(fruit,mode){
        const payload={action:'useYggFruit',fruit:String(fruit),mode:mode==='harvest'?'harvest':'eat'};
        if(yggPoopChoixIdleV1_[String(fruit)])payload.poop=true;
        yggPoopChoixIdleV1_[String(fruit)]=false;
        window.__actionMetaV47__(payload);
      }
      window.__utiliserFruitYggIdleV1__=utiliserFruitYggIdleV1_;

      function pageYggdrasilIdleV47_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const s=systemeMetaParIdIdleV130_(j,'yggdrasil');
        if(!s||!s.state||!s.state.unlocked)return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
        const data=s.state.data||{};
        const fruits=data.fruits||{};
        const m=j&&j.systemes?j.systemes:{};
        /* Anti-spoil : un fruit qui porte le nom d'un système encore verrouillé n'apparaît pas. */
        const defs=(Array.isArray(m.yggFruits)?m.yggFruits:[]).filter(function(def){return !/MacGuffin/i.test(String(def.name||def.id||''))||Boolean(systemeMetaParIdIdleV130_(j,'macguffins')&&systemeMetaParIdIdleV130_(j,'macguffins').state&&systemeMetaParIdIdleV130_(j,'macguffins').state.unlocked);});
        const x=m.yggExtra||{};
        const xf=x.fruits||{};
        const tierSec=Number(x.tierSeconds)>0?Number(x.tierSeconds):3600;
        const seeds=m.currencies?H.idleEntier_(m.currencies.seeds||0):0;
        const exp=m.currencies?Number(m.currencies.experience)||0:0;
        const poop=H.idleEntier_(x.poop||0);
        const noms={energy:'Energy',magic:'Magic'};
        const brown=x.brownHeart?' · Brown Heart : '+(x.nextFreePoopIn===1?'la prochaine est gratuite':'gratuite dans '+H.idleEntier_(x.nextFreePoopIn||0)):'';
        return H.entetePageIdleV28_('🌱 Yggdrasil','Chaque tier permet une heure de croissance supplémentaire. Mange un fruit pour son effet ou récolte-le pour doubler les graines. Une Poop (+50 % avant arrondi) s’utilise sur le prochain fruit mangé ou récolté.')+
          '<div class="soreal-idle-summary-grid-v28">'+
            '<div class="soreal-idle-summary-v28">🌱 Graines<b>'+H.formatGrandNombreIdleV70_(seeds)+'</b></div>'+
            '<div class="soreal-idle-summary-v28">💩 Poop<b>'+H.formatGrandNombreIdleV70_(poop)+'</b></div>'+
            '<div class="soreal-idle-summary-v28">⏳ Durée d’un tier<b>'+H.idleEntier_(Math.round(tierSec/60))+' min</b></div>'+
          '</div>'+
          '<div class="soreal-idle-note-v4" style="margin:6px 0 10px">Poop : x'+H.idleHtml_(String(Math.round((Number(x.poopFactor)||1.5)*100)/100).replace('.',','))+' · tier max '+H.idleEntier_(x.maxTier||10)+H.idleHtml_(brown)+' · Poop achetable à la boutique AP, rayon Boosts.</div>'+
          '<div style="display:grid;gap:10px">'+defs.map(function(def){
            const f=fruits[def.id]||{};
            const e=xf[def.id]||{};
            const id=H.idleHtml_(def.id);
            const tier=H.idleEntier_(f.tier||0);
            const growth=H.idleNombre_(f.growthHours||0)*tierSec/3600;
            const pret=Boolean(f.active)&&(Number(f.growthHours)||0)>=1;
            const cout=e.activationCost!=null?e.activationCost:(def.activationCost||0);
            const verrou=e.unlocked===false&&!(f.tier>0);
            if(verrou)return '';/* ANTI-SPOIL : un fruit encore verrouillé n'apparaît pas du tout. */
            const ressource=noms[def.resource]||H.idleHtml_(def.resource||'energy');
            const auto=e.autoActivate
              ?'<span style="color:#8fe0a0">⚡ Auto-Activate</span>'
              :(e.autoShopId?'<button type="button" class="soreal-idle-expand-button-v25" '+(exp>=(e.autoCost||0)?'':'disabled ')+'title="Cap '+ressource+' total requis : '+H.formatGrandNombreIdleV70_(e.autoRequiredCap||0)+'" onclick="window.__acheterExpShopIdleV1__(\''+H.idleHtml_(e.autoShopId)+'\',1)">Auto-Activate · '+H.formatGrandNombreIdleV70_(e.autoCost||0)+' EXP</button>':'');
            return '<div class="soreal-idle-section-v8" style="margin:0">'+
              '<div style="display:flex;justify-content:space-between;gap:8px"><b>'+H.idleHtml_(emojiNomIdleV1_('yggdrasil',def.id,def.name||def.id))+'</b><span>Tier '+tier+'</span></div>'+
              '<div style="font-size:14px;color:#aeb5c8;margin-top:5px">'+
                'Croissance '+H.formatterHeuresIdleV47_(growth)+' / '+H.formatterHeuresIdleV47_(H.idleEntier_(f.tier||0)*tierSec/3600)+
                ' · activation '+(cout>0?H.formatGrandNombreIdleV70_(cout)+' '+ressource:'gratuite')+
                (e.nextTierCost!=null?' · tier suivant '+H.formatGrandNombreIdleV70_(e.nextTierCost)+' graines':(e.nextTierCost===null?' · tier max':''))+
              '</div>'+
              '<div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:9px">'+
                '<button type="button" class="soreal-idle-expand-button-v25" '+(verrou||e.nextTierCost===null?'disabled':'onclick="window.__actionMetaV47__({action:\'upgradeYggFruit\',fruit:\''+id+'\'})"')+'>Tier +1</button>'+
                '<button type="button" class="soreal-idle-expand-button-v25" '+(f.active||!(f.tier>0)?'disabled':'onclick="window.__actionMetaV47__({action:\'activateYggFruit\',fruit:\''+id+'\'})"')+'>'+(f.active?(pret?'Prêt':'En croissance'):'Activer')+'</button>'+
                '<button type="button" class="soreal-idle-expand-button-v25" '+(pret?'':'disabled ')+'onclick="window.__utiliserFruitYggIdleV1__(\''+id+'\',\'eat\')">Manger</button>'+
                '<button type="button" class="soreal-idle-expand-button-v25" '+(pret?'':'disabled ')+'onclick="window.__utiliserFruitYggIdleV1__(\''+id+'\',\'harvest\')">Récolter</button>'+
                '<label style="font-size:14px;display:flex;gap:4px;align-items:center"><input type="checkbox" '+(poop>0?'':'disabled ')+(yggPoopChoixIdleV1_[def.id]?'checked ':'')+'onchange="window.__basculerPoopYggIdleV1__(\''+id+'\',this.checked)">💩 Poop</label>'+
                auto+
              '</div>'+
            '</div>';
          }).join('')+'</div>';
      }

      /* Page Mineurs d'or : refaite en entier (Norman, 2026-10-27), voir modules/mineurs-page-v1.js. */
      function pageDiggersIdleV47_(j){
        return window.__SOREAL_IDLE_MINEURS_PAGE_V1__.page(j);
      }

  window.__SOREAL_IDLE_YGG_DIGGERS_PAGE_V1__={
    pageYggdrasilIdleV47_:pageYggdrasilIdleV47_,
    pageDiggersIdleV47_:pageDiggersIdleV47_
  };
})();
