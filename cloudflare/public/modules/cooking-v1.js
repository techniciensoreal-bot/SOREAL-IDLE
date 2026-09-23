/*
 * SOREAL IDLE — page Cooking (débloquée par IT HUNGERS).
 * Moteur : cloudflare/src/idle-cooking-v1.js. Le serveur ne publie que la
 * vue publique (niveaux choisis, efficacité, bonus, minuterie) : les cibles
 * et les paires secrètes du repas ne quittent jamais le serveur.
 * Branché par une seule ligne dans pageSystemeMetaIdleV130_
 * (meta-progression-v130.js) ; les actions passent par
 * window.__SOREAL_IDLE_META_V130__.actionMetaIdleV130_.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_COOKING_V1__)return;

  function hote(){return window.__SOREAL_IDLE_META_HOST_V130__;}
  function html(v){const h=hote();return h&&h.idleHtml_?h.idleHtml_(v):String(v==null?'':v);}
  function nombre(v){const n=Number(v);return Number.isFinite(n)?n:0;}
  function pct(v,dec){return nombre(v).toFixed(dec==null?2:dec).replace('.',',')+' %';}
  function duree(ms){
    const s=Math.max(0,Math.ceil(nombre(ms)/1000));
    const deux=function(v){return String(v).padStart(2,'0');};
    return deux(Math.floor(s/3600))+':'+deux(Math.floor((s%3600)/60))+':'+deux(s%60);
  }
  function heures(ms){return (nombre(ms)/3600000).toFixed(1).replace('.',',')+' h';}
  function entete(titre,sous){const h=hote();return h&&h.entetePageIdleV28_?h.entetePageIdleV28_(titre,sous):'<h1>'+titre+'</h1><p>'+sous+'</p>';}

  function action(payload){
    const meta=window.__SOREAL_IDLE_META_V130__;
    if(meta&&typeof meta.actionMetaIdleV130_==='function')meta.actionMetaIdleV130_(payload);
  }
  function reglerIngredient(index,niveau){action({action:'cooking',op:'setIngredient',index:Number(index),level:Number(niveau)});}
  function manger(){action({action:'cooking',op:'eat'});}
  window.__cuisineReglerIngredientIdleV1__=reglerIngredient;
  window.__cuisineMangerIdleV1__=manger;

  const LIBELLES_SLOTS={weapon:'Arme',head:'Tête',chest:'Torse',legs:'Jambes',boots:'Bottes',accessory:'Accessoire'};

  function ligneIngredient(ing,min,max){
    const n=Number(ing.index)+1;
    if(!ing.unlocked){
      return '<div class="soreal-idle-section-v8" style="margin:0;opacity:.55"><b>Ingrédient n°'+n+'</b>'+
        '<div class="soreal-idle-note-v4" style="margin-top:5px">🔒 Emplacement verrouillé ('+(n===7?'vaincre ROCK LOBSTER':'vaincre AMALGAMATE')+').</div></div>';
    }
    const niveau=Math.max(min,Math.min(max,Math.floor(nombre(ing.level))));
    return '<div class="soreal-idle-section-v8" style="margin:0">'+
      '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center">'+
        '<b>Ingrédient n°'+n+'</b><span><b>'+niveau+'</b> / '+max+'</span>'+
      '</div>'+
      '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">'+
        '<button type="button" class="soreal-idle-expand-button-v25"'+(niveau<=min?' disabled':'')+' onclick="window.__cuisineReglerIngredientIdleV1__('+ing.index+','+(niveau-1)+')">−</button>'+
        '<button type="button" class="soreal-idle-expand-button-v25"'+(niveau>=max?' disabled':'')+' onclick="window.__cuisineReglerIngredientIdleV1__('+ing.index+','+(niveau+1)+')">+</button>'+
        '<button type="button" class="soreal-idle-expand-button-v25"'+(niveau===min?' disabled':'')+' onclick="window.__cuisineReglerIngredientIdleV1__('+ing.index+','+min+')">0</button>'+
      '</div>'+
    '</div>';
  }

  function page(j){
    const meta=window.__SOREAL_IDLE_META_V130__;
    const s=meta&&meta.systemeMetaParIdIdleV130_?meta.systemeMetaParIdIdleV130_(j,'cooking'):null;
    const titre='🍲 Cooking';
    const sous='Une fois par jour environ, équilibre les ingrédients du repas puis mange-le pour augmenter définitivement tes gains d’EXP (jusqu’à +300 %).';
    if(!s||!s.state||!s.state.unlocked){
      return entete(titre,sous)+'<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">🔒 Système verrouillé : vaincs le titan IT HUNGERS.</div>';
    }
    const d=s.state.data||{};
    const min=nombre(d.levelMin),max=nombre(d.levelMax)||20;
    const ingredients=Array.isArray(d.ingredients)?d.ingredients:[];
    const b=d.bonuses||{};
    const t=d.timer||{};
    const gainConnu=d.mealExpGainDocumented===true&&d.mealExpGainPct!=null;
    const pret=Boolean(t.ready);

    const pieces=Array.isArray(b.gearPieces)?b.gearPieces:[];
    const detailBonus=
      '<div class="soreal-idle-note-v4" style="margin-top:5px">🧑‍🍳 Équipement Cooking : '+
        (pieces.length
          ?pieces.map(function(p){return html(p.name)+' ('+html(LIBELLES_SLOTS[p.slot]||p.slot)+(nombre(p.count)>1?', compte ×'+nombre(p.count):'')+')';}).join(', ')
          :'aucun objet Cooking équipé')+
        ' → ×'+nombre(b.gearMultiplier).toFixed(4).replace('.',',')+
      '</div>'+
      '<div class="soreal-idle-note-v4" style="margin-top:5px">🚀 Set Space complété : '+(b.spaceSet?'oui (×1,10)':'non')+
        ' · Emplacement 7 : '+(b.slot7?'oui (×1,20)':'non')+
        ' · Emplacement 8 : '+(b.slot8?'oui (×1,20)':'non')+
      '</div>';

    const boutonManger=!pret
      ?'<button type="button" class="soreal-idle-expand-button-v25" disabled>🍽️ Manger ! · prêt dans '+duree(t.readyInMs)+'</button>'
      :(gainConnu
        ?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__cuisineMangerIdleV1__()">🍽️ Manger !</button>'
        :'<button type="button" class="soreal-idle-expand-button-v25" disabled>🍽️ Manger ! (gain non documenté)</button>');

    return entete(titre,sous)+
      '<div class="soreal-idle-summary-grid-v28">'+
        '<div class="soreal-idle-summary-v28">Efficacité du repas<b>'+pct(d.efficiencyPct)+'</b></div>'+
        '<div class="soreal-idle-summary-v28">Bonus de cuisine totaux<b>'+pct(d.totalCookingBonusesPct)+'</b></div>'+
        '<div class="soreal-idle-summary-v28">Gain d’EXP du repas<b>'+(gainConnu?'+'+pct(d.mealExpGainPct):'non documenté')+'</b></div>'+
        '<div class="soreal-idle-summary-v28">Gain d’EXP total<b>+'+pct(d.totalExpGainPct)+' / '+nombre(d.totalExpGainMaxPct)+' %</b></div>'+
      '</div>'+
      '<div class="soreal-idle-section-v8">'+
        '<div class="soreal-idle-window-title-v31">🥘 Repas n°'+Math.max(0,Math.floor(nombre(d.mealNumber)))+'</div>'+
        '<div class="soreal-idle-note-v4">Les ingrédients forment 4 paires secrètes. Chaque ingrédient a deux niveaux idéaux et chaque paire une somme idéale : trouve-les en tâtonnant jusqu’à 100 % d’efficacité.</div>'+
        '<div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:9px">'+boutonManger+'</div>'+
        '<div class="soreal-idle-note-v4" style="margin-top:9px">⏱️ Un repas toutes les '+heures(t.mealMs)+(t.breadSet?' (Set Bread : −1 h)':'')+
          ' · temps en réserve : '+duree(t.bankedMs)+' (max '+heures(t.capMs)+') · repas mangés : '+Math.max(0,Math.floor(nombre(d.mealsEaten)))+'</div>'+
        (gainConnu?'':'<div class="soreal-idle-note-v4" style="margin-top:5px">ℹ️ Le wiki NGU ne publie pas la formule du gain d’EXP d’un repas : manger reste désactivé tant qu’elle n’est pas sourcée.</div>')+
      '</div>'+
      '<div class="soreal-idle-section-v8">'+
        '<div class="soreal-idle-window-title-v31">✨ Bonus de cuisine</div>'+detailBonus+
      '</div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px">'+
        ingredients.map(function(ing){return ligneIngredient(ing,min,max);}).join('')+
      '</div>';
  }

  window.__SOREAL_IDLE_COOKING_V1__={page:page};
})();
