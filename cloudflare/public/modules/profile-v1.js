/*
 * SOREAL IDLE — page Achievements (succès, bonus d'AP) et Player Portraits.
 * Moteurs : cloudflare/src/idle-achievements-v1.js et idle-portraits-v1.js ; le serveur publie
 * j.systemes.achievements et j.systemes.portraits. Branché par une seule ligne dans
 * pageSystemeMetaIdleV130_ (meta-progression-v130.js) ; les actions passent par
 * window.__SOREAL_IDLE_META_V130__.actionMetaIdleV130_.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_PROFILE_V1__)return;

  function hote(){return window.__SOREAL_IDLE_META_HOST_V130__;}
  function html(v){const h=hote();return h&&h.idleHtml_?h.idleHtml_(v):String(v==null?'':v);}
  function nombre(v){const n=Number(v);return Number.isFinite(n)?n:0;}
  function pct(v){return nombre(v).toFixed(2).replace('.',',')+' %';}
  function entete(titre,sous){const h=hote();return h&&h.entetePageIdleV28_?h.entetePageIdleV28_(titre,sous):'<h1>'+titre+'</h1><p>'+sous+'</p>';}

  function action(payload){
    const meta=window.__SOREAL_IDLE_META_V130__;
    if(meta&&typeof meta.actionMetaIdleV130_==='function')meta.actionMetaIdleV130_(payload);
  }
  window.__profilChoisirPortraitIdleV1__=function(id){action({action:'portrait',id:String(id)});};
  window.__profilPrixSpecialIdleV1__=function(){action({action:'specialPrize'});};

  const GROUPES={
    energyPower:'Energy Power',magicPower:'Magic Power',energyCap:'Energy Cap',magicCap:'Magic Cap',
    energyBars:'Energy Bar',magicBars:'Magic Bar',boss:'Boss vaincus',rebirth:'Rebirths',secret:'Secrets'
  };

  function blocSucces(a){
    const liste=Array.isArray(a.list)?a.list:[];
    const faits=liste.filter(function(x){return x.unlocked;}).length;
    const ordre=Object.keys(GROUPES);
    /*
     * ANTI-SPOIL (Norman, 2026-09-24 : « le joueur ne doit voir que ce qu'il a débloqué ») : seuls les succès DÉJÀ obtenus sont listés ;
     * ni les objectifs à venir, ni les succès secrets (« ??? »), ni le nombre total (« n / 153 »), ni les totaux par groupe.
     */
    const groupes=ordre.map(function(g){
      const items=liste.filter(function(x){return x.group===g&&x.unlocked;});
      if(!items.length)return '';
      const lignes=items.map(function(x){
        return '<div class="soreal-idle-note-v4" style="margin-top:3px">✅ '+html(x.name)+' · '+nombre(x.bp)+' BP</div>';
      }).join('');
      return '<details class="soreal-idle-section-v8"><summary><b>'+html(GROUPES[g]||g)+'</b> — '+items.length+'</summary>'+lignes+'</details>';
    }).join('');
    return '<div class="soreal-idle-summary-grid-v28">'+
        '<div class="soreal-idle-summary-v28">Succès<b>'+faits+'</b></div>'+
        '<div class="soreal-idle-summary-v28">Bonus Points<b>'+nombre(a.bp)+' BP</b></div>'+
        '<div class="soreal-idle-summary-v28">Bonus d’AP<b>+'+pct((nombre(a.apMultiplier)-1)*100)+'</b></div>'+
      '</div>'+
      '<div class="soreal-idle-note-v4" style="margin:6px 0">+1 % d’AP par tranche de 100 BP (sauf kills de l’ITOPOD et Special Prize).</div>'+
      groupes;
  }

  function blocPortraits(p){
    if(!p)return '';
    const liste=Array.isArray(p.list)?p.list:[];
    /* ANTI-SPOIL (2026-09-24) : uniquement les portraits déjà débloqués (pas de bouton verrouillé ni de condition). */
    const boutons=liste.filter(function(x){return x.unlocked;}).map(function(x){
      const choisi=x.id===p.selected;
      return '<button type="button" class="soreal-idle-expand-button-v25"'+
        (choisi?' disabled':' onclick="window.__profilChoisirPortraitIdleV1__(\''+html(x.id)+'\')"')+'>'+
        (choisi?'✅ ':'')+html(x.name)+'</button>';
    }).join('');
    const prix=p.specialPrize||{};
    return '<div class="soreal-idle-section-v8">'+
        '<div class="soreal-idle-window-title-v31">🖼️ Player Portraits — '+nombre(p.unlockedCount)+'</div>'+
        '<div class="soreal-idle-note-v4">Portrait du héros en combat (cosmétique). Un portrait par set complété, plus les souhaits Weiner, Mayo et Sneak Preview et les fragments SEXY / SMART à 250 %.</div>'+
        '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">'+boutons+'</div>'+
      '</div>'+
      '<div class="soreal-idle-section-v8">'+
        '<div class="soreal-idle-window-title-v31">🎁 Special Prize</div>'+
        '<div class="soreal-idle-note-v4">Une seule fois : '+nombre(prix.ap).toLocaleString('fr-FR')+' AP (sans bonus d’AP).</div>'+
        '<div style="margin-top:9px"><button type="button" class="soreal-idle-expand-button-v25"'+(prix.claimed?' disabled':' onclick="window.__profilPrixSpecialIdleV1__()"')+'>'+
          (prix.claimed?'Déjà récupéré':'Récupérer le Special Prize')+'</button></div>'+
      '</div>';
  }

  function page(j){
    const s=(j&&j.systemes)||{};
    return entete('🎖️ Achievements','Succès, Bonus Points et portraits du héros.')+
      (s.achievements?blocSucces(s.achievements):'')+
      blocPortraits(s.portraits);
  }

  window.__SOREAL_IDLE_PROFILE_V1__={page:page};
})();
