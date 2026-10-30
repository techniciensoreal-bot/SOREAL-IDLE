/*
 * SOREAL IDLE — Garderie d'objets (Daycare), emplacements du COFFRE (Norman, 2026-10-30 : « je veux que le coffre ait des emplacements daycare, avec l'animation ;
 * on doit bien voir que ce sont des cases à part » ; le liquide arc-en-ciel monte dans un bocal, quand il atteint le haut l'objet prend 1 niveau).
 * Plus de menu autonome : le panneau « Garderie d'objets » se range dans le Coffre ouvert (ui-aventure-2-v1.js, rendreCadreCoffreAdventureIdleV1_), dans un cadre de verre et de laiton
 * à part des cases d'objets rangés. Toutes les valeurs viennent du snapshot serveur (j.systemes.daycare, idle-daycare-v1.js) ; le niveau est compté par le MOTEUR, l'interface ne fait
 * qu'extrapoler la progression entre deux synchros avec la vitesse du moteur (règle n°5 : rien n'est lu dans le DOM pour le gameplay, les repères sont dans des attributs écrits par le rendu).
 * Règle n°4 : la hauteur du liquide est réécrite à chaque image ET juste après chaque redessin (window.__SOREAL_IDLE_APRES_REDESSIN_V1__).
 * Règle n°3 : l'ondulation (masque en vague) et le reflet glissent d'exactement UNE période de leur tuile ; les bulles ont un fondu d'entrée et de sortie.
 * Expose window.__SOREAL_IDLE_DAYCARE_PAGE_V1__ (disponible, panneau, infoFiche, boutonFiche, deposerNonMaxe, apresDepotMaxe).
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_DAYCARE_PAGE_V1__)return;

  function systemeMetaParIdIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.systemeMetaParIdIdleV130_.apply(null,arguments);}
  function actionMetaIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.actionMetaIdleV130_.apply(null,arguments);}
  function dureeLongueNguIdleV1_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.dureeLongueNguIdleV1_.apply(null,arguments);}
  function REG_(){return window.__SOREAL_IDLE_REG__||{};}

  /* Choix d'un objet du sac pour un récipient vide : état de page seulement (un clic le rouvre). */
  let choixOuvert=false;
  /* Repère de progression de chaque objet : (progression, niveau, vitesse) reçus du moteur + instant de réception. Même contenu = même repère. */
  const reperes={};

  const ICONE_BOCAL='<svg class="gd-ico" viewBox="0 0 24 24" width="1.15em" height="1.15em" aria-hidden="true"><path d="M8 3h8v2.2c0 .5-.3.9-.7 1.2C14.2 7 14 7.6 14 8.2V9c1.9.8 3 2.5 3 4.6V18a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-4.4C7 11.5 8.100 9.800 10 9v-.8c0-.6-.2-1.200-1.300-1.800C8.300 6.100 8 5.700 8 5.200z" fill="none" stroke="currentColor" stroke-width="1.700" stroke-linejoin="round"/><path d="M7.300 14.500c1.500-1 3-1 4.700 0s3.200 1 4.700 0" fill="none" stroke="currentColor" stroke-width="1.700" stroke-linecap="round"/></svg>';
  const ICONE_PLUS='<svg class="gd-plus" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.600" stroke-linecap="round"/></svg>';

  function H_(){return window.__SOREAL_IDLE_META_HOST_V130__;}

  function donnees(j){
    const s=systemeMetaParIdIdleV130_(j,'daycare');
    const d=(j&&j.systemes&&j.systemes.daycare)||null;
    if(!s||!s.state||!s.state.unlocked||!d)return null;
    return d;
  }
  /* Anti-spoil (règle n°2) : l'onglet n'existe que si le système est débloqué. */
  function disponible(j){try{return Boolean(donnees(j));}catch(_e){return false;}}

  /*
   * Bouton « Garderie » de la fiche d'un objet : absent (rien du tout) si la garderie n'est pas débloquée ou si l'objet n'est pas plaçable
   * (équipé, verrouillé, boost, consommable, taux inconnu, déjà en garderie, niveau 100) ; « pleine » s'il n'y a aucun emplacement libre.
   */
  function infoFiche(j,itemId,item){
    let d=null;
    try{d=donnees(j);}catch(_e){}
    if(!d)return null;
    if(item&&item.locked)return null;
    const o=(Array.isArray(d.inventory)?d.inventory:[]).find(function(x){return x&&String(x.id)===String(itemId);});
    if(!o||o.baseHours==null||o.alreadyInDaycare||Number(o.level)>=100)return null;
    const pris=Array.isArray(d.items)?d.items.length:0;
    return {etat:pris>=Math.max(0,Math.floor(Number(d.slots)||0))?'pleine':'ok'};
  }

  /* Bouton « Garderie » de la fiche d'un objet (HTML), '' quand il ne doit pas exister. L'action est celle des récipients : daycarePlace ; la fiche se ferme ensuite. */
  function boutonFiche(j,itemId,item){
    const info=infoFiche(j,itemId,item);
    if(!info)return '';
    const ico='<svg class="gd-ico" viewBox="0 0 24 24" width="1.15em" height="1.15em" aria-hidden="true"><path d="M8 3h8v2.2c0 .5-.3.9-.7 1.2C14.2 7 14 7.6 14 8.2V9c1.9.8 3 2.5 3 4.6V18a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-4.4C7 11.5 8.1 9.8 10 9v-.8c0-.6-.2-1.2-1.3-1.8C8.3 6.1 8 5.7 8 5.2z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg> ';
    const id=H_().idleHtml_(itemId);
    if(info.etat==='ok')return '<button type="button" class="idle-fiche-bouton-v1" onclick="window.__daycareIdleV1__(\'daycarePlace\',\''+id+'\');window.__fermerDetailsObjetAdventureIdleV1__();">'+ico+'Garderie</button>';
    return '<button type="button" class="idle-fiche-bouton-v1 idle-fiche-bouton-large-v1" disabled>'+ico+'Garderie pleine</button>';
  }

  function reperePour(x,maintenant){
    const id=String((x.item&&x.item.id)||'');
    const p=Math.max(0,Math.min(1,Number(x.progress)||0));
    const lv=Math.max(0,Math.floor(Number((x.item&&x.item.level))||0));
    const heures=Number(x.effectiveHoursPerLevel);
    const r=!x.maxed&&heures>0&&isFinite(heures)?1/(heures*3600):0;
    const ancien=reperes[id];
    if(ancien&&ancien.p===p&&ancien.lv===lv&&ancien.r===r)return ancien;
    return (reperes[id]={p:p,lv:lv,r:r,t0:maintenant,max:x.maxed?1:0});
  }
  /* Progression exacte à l'instant donné (même formule que le moteur : un niveau = 1 de progression, plafond au niveau 100). */
  function etatA(rep,maintenant){
    if(rep.max)return {p:1,niveau:100};
    const total=rep.p+rep.r*Math.max(0,(maintenant-rep.t0)/1000);
    const gagnes=Math.floor(total+1e-9);
    if(rep.lv+gagnes>=100)return {p:1,niveau:100};
    return {p:Math.max(0,Math.min(1,total-gagnes)),niveau:rep.lv+gagnes};
  }
  function decalageLiquide(p){return ((1-p)*100).toFixed(2);}

  function bocalPlein(x,maintenant){
    const H=H_(),it=x.item||{};
    const rep=reperePour(x,maintenant);
    const e=etatA(rep,maintenant);
    const R=REG_();
    const icone=typeof R.iconeObjetAdventureIdleV138_==='function'?R.iconeObjetAdventureIdleV138_(Object.assign({},it,{level:e.niveau})):'';
    const prochain=rep.max?'Niveau max':(rep.r>0?'Prochain niveau dans '+dureeLongueNguIdleV1_((1-e.p)/rep.r):'À l’arrêt');
    const taux=x.effectiveHoursPerLevel!=null?'1 niveau / '+dureeLongueNguIdleV1_(H.idleNombre_(x.effectiveHoursPerLevel)*3600):'';
    return '<div class="gd-case">'+
      '<div class="gd-bocal" data-gd-id="'+H.idleHtml_(it.id)+'" data-gd-p="'+rep.p+'" data-gd-lv="'+rep.lv+'" data-gd-r="'+rep.r+'" data-gd-t0="'+rep.t0+'" data-gd-max="'+rep.max+'">'+
        '<div class="gd-bouchon"></div>'+
        '<div class="gd-verre">'+
          '<div class="gd-objet">'+icone+'</div>'+
          '<div class="gd-liq" style="transform:translateY('+decalageLiquide(e.p)+'%)"><i class="gd-bulle" style="--x:22%;--t:4.6s;--d:0s"></i><i class="gd-bulle" style="--x:52%;--t:5.8s;--d:1.7s"></i><i class="gd-bulle" style="--x:76%;--t:4.1s;--d:3.1s"></i></div>'+
          '<div class="gd-reflet"></div>'+
        '</div>'+
      '</div>'+
      '<div class="gd-niv">Niv. <b class="gd-niv-n">'+e.niveau+'</b></div>'+
      '<div class="gd-info">'+H.idleHtml_(it.name||it.definitionId||'Objet')+'</div>'+
      '<div class="gd-info gd-petit">'+H.idleHtml_(prochain)+(taux?' · '+H.idleHtml_(taux):'')+'</div>'+
      '<button type="button" class="soreal-idle-expand-button-v25 gd-bouton" onclick="window.__daycareIdleV1__(\'daycareRemove\',\''+H.idleHtml_(it.id)+'\')">Reprendre</button>'+
    '</div>';
  }

  function bocalVide(){
    return '<div class="gd-case">'+
      '<button type="button" class="gd-bocal gd-vide'+(choixOuvert?' ouvert':'')+'" onclick="window.__garderieChoisirV1__()" aria-label="Placer un objet">'+
        '<div class="gd-bouchon"></div>'+
        '<div class="gd-verre"><div class="gd-objet">'+ICONE_PLUS+'</div><div class="gd-reflet"></div></div>'+
      '</button>'+
      '<div class="gd-info gd-petit">Emplacement libre</div>'+
    '</div>';
  }

  function listeSac(d){
    const H=H_();
    const sac=(Array.isArray(d.inventory)?d.inventory:[]).filter(function(o){return o&&o.baseHours!=null&&!o.alreadyInDaycare&&H.idleEntier_(o.level)<100;});
    const R=REG_();
    if(!sac.length)return '<div class="soreal-idle-note-v4">Aucun objet à placer dans ton sac (les objets équipés doivent d’abord être déséquipés).</div>';
    return '<div class="gd-choix">'+sac.map(function(o){
      const pseudo={id:o.id,definitionId:o.definitionId,wikiItemId:o.wikiItemId,name:o.name,level:o.level};
      const ico=typeof R.iconeObjetAdventureIdleV138_==='function'?R.iconeObjetAdventureIdleV138_(pseudo):'';
      return '<button type="button" class="gd-choix-objet" onclick="window.__daycareIdleV1__(\'daycarePlace\',\''+H.idleHtml_(o.id)+'\')">'+
        '<span class="gd-choix-ico">'+ico+'</span><span class="gd-choix-nom">'+H.idleHtml_(o.name)+'</span><small>Niv. '+H.idleEntier_(o.level)+'</small></button>';
    }).join('')+'</div>';
  }

  function panneau(j){
    const H=H_();
    const d=donnees(j);
    if(!d)return '';
    css();
    const maintenant=Date.now();
    const pct=function(v){return H.formatGrandNombreIdleV70_(H.idleNombre_(v)*100,2)+' %';};
    const objets=Array.isArray(d.items)?d.items:[];
    const total=Math.max(0,H.idleEntier_(d.slots));
    const libres=Math.max(0,total-objets.length);
    let cases=objets.map(function(x){return bocalPlein(x,maintenant);}).join('');
    for(let i=0;i<libres;i+=1)cases+=bocalVide();
    const resume=
      '<div class="soreal-idle-summary-grid-v28">'+
        '<div class="soreal-idle-summary-v28">Emplacements<b>'+total+'</b></div>'+
        '<div class="soreal-idle-summary-v28">Temps par niveau<b>×'+pct(d.timeFactor)+'</b></div>'+
        '<div class="soreal-idle-summary-v28">Vitesse<b>×'+pct(d.speedMultiplier)+'</b></div>'+
      '</div>';
    const tp=d.timeParts||{},sp=d.speedParts||{},ss=d.slotSources||{};
    const detail=
      '<details class="soreal-idle-section-v8" style="margin:0 0 10px"><summary><b>Détail des bonus</b></summary>'+
        '<div style="font-size:14px;color:#aeb5c8;margin-top:6px">Réductions de temps (rétroactives) : Blind Normal ×'+pct(tp.blindNormal==null?1:tp.blindNormal)+' · Daycare Kitty\'s Blessing ×'+pct(tp.perks==null?1:tp.perks)+' · Daycare Speed Boost ×'+pct(tp.selloutSpeedBoost==null?1:tp.selloutSpeedBoost)+'</div>'+
        '<div style="font-size:14px;color:#aeb5c8;margin-top:4px">Vitesse (non rétroactive) : équipement ×'+pct(sp.gear||1)+' · Fibonacci ×'+pct(sp.fibonacci||1)+' · souhait ×'+pct(sp.wish||1)+' · Blind Evil ×'+pct(sp.blindEvil||1)+' · Blind Sadistic ×'+pct(sp.blindSadistic||1)+' · Digger ×'+pct(sp.digger||1)+' · Hack ×'+pct(sp.hack||1)+'</div>'+
        '<div style="font-size:14px;color:#aeb5c8;margin-top:4px">Emplacements : boutique EXP '+H.idleEntier_(ss.expShop||0)+' · Blind Normal '+H.idleEntier_(ss.blindNormal||0)+' · Troll Evil '+H.idleEntier_(ss.trollEvil||0)+' · perk '+H.idleEntier_(ss.perk||0)+'</div>'+
      '</details>';
    const choix=(libres>0&&choixOuvert)
      ?'<div class="soreal-idle-section-v8 gd-choix-cadre"><div class="soreal-idle-window-title-v31">Choisis un objet du sac</div>'+listeSac(d)+
        '<div style="margin-top:8px"><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__garderieChoisirV1__()">Annuler</button></div></div>'
      :'';
    demarrer();
    return '<section class="gd-cadre" aria-label="Garderie d’objets">'+
      '<header class="gd-cadre-titre"><span class="gd-cadre-ico">'+ICONE_BOCAL+'</span><span>Garderie d’objets</span></header>'+
      '<div class="gd-intro">Le chat de la garderie fait gagner des niveaux à tes objets avec le temps, même hors ligne : quand le liquide atteint le haut, l’objet prend 1 niveau. Un seul exemplaire de chaque objet ; niveau maximum 100. Un objet en garderie ne peut pas être fusionné ni équipé.</div>'+
      resume+detail+
      '<div class="gd-grille">'+cases+'</div>'+
    '</section>'+choix;
  }

  /* Phrases du Coffre (modules/phrases-coffre-valise-v1.js) : {D} placement, {M} objet maxé, {P} plus de place. Seulement quand la garderie est débloquée (règle n°2). */
  function parler(mode){
    try{
      const P=window.__SOREAL_IDLE_PHRASES_V1__,S=window.__SOREAL_IDLE_COFFRE_SOMMEIL_V1__;
      const t=P&&typeof P.tirer==='function'?P.tirer('coffre',mode):'';
      if(t&&S&&typeof S.parler==='function')S.parler(t);
    }catch(_e){}
  }
  function objetDuSac(id){
    const R=REG_();
    const a=typeof R.aventureMetaIdleV47_==='function'&&R.idleEtat?R.aventureMetaIdleV47_(R.idleEtat):null;
    return a&&Array.isArray(a.inventory)?a.inventory.find(function(x){return x&&String(x.id)===String(id);})||null:null;
  }
  /* Geste « poser sur le Coffre » avec un objet NON maxé : accepté seulement s'il reste un emplacement de garderie libre (le moteur applique la même règle). Renvoie false = comportement d'avant (refus sans phrase). */
  function deposerNonMaxe(id){
    const j=REG_().idleEtat;
    let d=null;
    try{d=donnees(j);}catch(_e){}
    if(!d)return false;
    const it=objetDuSac(id);
    const o=(Array.isArray(d.inventory)?d.inventory:[]).find(function(x){return x&&String(x.id)===String(id);});
    if(!o||!it||it.fullyMaxed||o.baseHours==null||o.alreadyInDaycare||Number(o.level)>=100)return false;
    if((Array.isArray(d.items)?d.items.length:0)>=Math.max(0,Math.floor(Number(d.slots)||0))){
      if(typeof window.__jouerNonCoffreIdleV1__==='function')window.__jouerNonCoffreIdleV1__();
      parler('plein');
      return true;
    }
    window.__bagageAvaleIdleV1=Date.now();
    daycareIdleV1_('daycarePlace',id);
    return true;
  }
  /* Un objet maxé rangé dans le Coffre comme avant : si la garderie est débloquée, il a sa phrase {M}. */
  function apresDepotMaxe(){if(disponible(REG_().idleEtat))parler('daycare:max');}

  function daycareIdleV1_(action,itemId){
    choixOuvert=false;
    if(action==='daycarePlace'){
      const it=objetDuSac(itemId),mode=it&&it.fullyMaxed?'daycare:max':'daycare';
      /* La phrase attend que l'objet ait quitté le sac (page redessinée avec la réponse du moteur) : sinon le redessin effacerait la bulle. */
      let essais=0;
      const attendre=function(){essais+=1;if(objetDuSac(itemId)&&essais<20){setTimeout(attendre,150);return;}setTimeout(function(){parler(mode);},120);};
      setTimeout(attendre,150);
    }
    actionMetaIdleV130_({action:String(action),itemId:String(itemId)});
  }
  window.__daycareIdleV1__=daycareIdleV1_;
  window.__garderieChoisirV1__=function(){
    choixOuvert=!choixOuvert;
    try{const H=H_();if(H&&typeof H.rafraichirMenuRacineIdleV28_==='function')H.rafraichirMenuRacineIdleV28_();}catch(_e){}
  };

  /* Animation : la hauteur du liquide suit le temps (progression + vitesse du moteur) ; la boucle s'arrête d'elle-même quand plus aucun récipient n'est affiché. */
  let boucle=0;
  function appliquer(){
    const liste=document.querySelectorAll('.gd-bocal[data-gd-id]');
    const maintenant=Date.now();
    for(let i=0;i<liste.length;i+=1){
      const b=liste[i];
      const rep={p:parseFloat(b.getAttribute('data-gd-p'))||0,lv:parseInt(b.getAttribute('data-gd-lv'),10)||0,r:parseFloat(b.getAttribute('data-gd-r'))||0,t0:parseFloat(b.getAttribute('data-gd-t0'))||maintenant,max:b.getAttribute('data-gd-max')==='1'?1:0};
      const e=etatA(rep,maintenant);
      const liq=b.querySelector('.gd-liq');
      const v='translateY('+decalageLiquide(e.p)+'%)';
      if(liq&&liq.style.transform!==v)liq.style.transform=v;
      const n=b.parentNode&&b.parentNode.querySelector('.gd-niv-n');
      if(n&&n.textContent!==String(e.niveau))n.textContent=String(e.niveau);
    }
    return liste.length;
  }
  function pas(){
    boucle=0;
    let n=0;
    try{n=appliquer();}catch(_e){}
    if(n>0||vide<30){
      vide=n>0?0:vide+1;
      boucle=requestAnimationFrame(pas);
    }
  }
  let vide=0;
  function demarrer(){
    vide=0;
    if(!boucle&&typeof requestAnimationFrame==='function')boucle=requestAnimationFrame(pas);
  }
  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(function(){try{if(appliquer()>0)demarrer();}catch(_e){}});

  function css(){
    if(typeof document==='undefined'||!document.head||document.getElementById('gd-style-v1'))return;
    const WAVE="url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='10' viewBox='0 0 60 10'%3E%3Cpath d='M0 5Q15 0 30 5T60 5V10H0Z'/%3E%3C/svg%3E\")";
    const s=document.createElement('style');
    s.id='gd-style-v1';
    s.textContent=[
      '.gd-cadre{position:relative;margin:26px 0 16px;padding:14px 12px 14px;border-radius:16px;border:3px solid #c9a24a;background:linear-gradient(180deg,rgba(20,44,64,.92),rgba(10,24,40,.95));box-shadow:inset 0 0 0 2px rgba(255,236,170,.25),inset 0 0 26px rgba(80,170,255,.18),0 6px 16px rgba(0,0,0,.5)}',
      '.gd-cadre-titre{display:flex;align-items:center;justify-content:center;gap:8px;margin:-26px auto 10px;width:max-content;max-width:92%;padding:5px 16px;border-radius:999px;background:linear-gradient(180deg,#e6c46a,#a67c25);color:#2b1d05;font:400 17px/1.2 "Bangers","Russo One",system-ui,sans-serif;letter-spacing:.04em;box-shadow:0 2px 5px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.5);text-align:center}',
      '.gd-cadre-ico{display:inline-flex}',
      '.gd-cadre .gd-intro{font-size:13px;color:#b9c6dc;margin:2px 0 10px;text-align:center}',
      '.gd-ico{vertical-align:-.2em}',
      '.gd-grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px 12px;margin-top:6px}',
      '.gd-case{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;min-width:0}',
      '.gd-info{font-size:14px;font-weight:700;overflow-wrap:anywhere;line-height:1.2}',
      '.gd-info.gd-petit{font-size:12px;font-weight:500;color:#aeb5c8}',
      '.gd-niv{font-family:"Russo One",system-ui,sans-serif;font-size:17px;color:#fff;text-shadow:0 1px 2px #000}',
      '.gd-bouton{margin-top:4px;max-width:100%;white-space:normal}',
      '.gd-bocal{--p:60px;position:relative;display:block;width:112px;height:176px;padding:0;margin:0;border:0;background:none;color:inherit;font:inherit}',
      '.gd-bouchon{position:absolute;left:50%;top:0;width:58px;height:14px;margin-left:-29px;border-radius:5px 5px 2px 2px;background:linear-gradient(180deg,#b88a55,#7a5530);box-shadow:inset 0 -2px 0 rgba(0,0,0,.35),0 1px 2px #000;z-index:3}',
      '.gd-verre{position:absolute;left:0;right:0;top:10px;bottom:0;border-radius:18px 18px 30px 30px;border:3px solid rgba(190,225,255,.75);background:linear-gradient(90deg,rgba(255,255,255,.14),rgba(255,255,255,.03) 40%,rgba(255,255,255,.1));box-shadow:inset 0 0 14px rgba(160,210,255,.35),0 4px 10px rgba(0,0,0,.5);overflow:hidden;isolation:isolate}',
      '.gd-objet{position:absolute;inset:14px 12px 22px;display:flex;align-items:center;justify-content:center;z-index:1}',
      '.gd-objet>*,.gd-objet img{max-width:100%;max-height:100%}',
      '.gd-objet .idle-boost-icon-v1,.gd-objet img{width:64px;height:64px;object-fit:contain}',
      '.gd-objet .idle-lvl-badge-v1{display:none}',
      '.gd-vide .gd-objet{color:rgba(190,225,255,.7)}',
      '.gd-vide{cursor:pointer}',
      '.gd-vide.ouvert .gd-verre{border-color:#f5c14b}',
      '.gd-liq{position:absolute;left:0;right:0;top:-10px;height:calc(100% + 10px);z-index:2;opacity:.8;background:linear-gradient(180deg,#ff3d3d 0%,#ff9f2e 17%,#ffe135 33%,#4be07b 50%,#2fb5ff 67%,#5b5bff 83%,#b24bff 100%);background-size:100% 100%;background-repeat:no-repeat;will-change:transform;',
      '-webkit-mask-image:'+WAVE+',linear-gradient(#000,#000);mask-image:'+WAVE+',linear-gradient(#000,#000);-webkit-mask-size:60px 10px,100% calc(100% - 9px);mask-size:60px 10px,100% calc(100% - 9px);-webkit-mask-position:0 0,0 100%;mask-position:0 0,0 100%;-webkit-mask-repeat:repeat-x,no-repeat;mask-repeat:repeat-x,no-repeat;animation:gd-onde 3.2s linear infinite}',
      '.gd-liq::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,rgba(255,255,255,0) 0,rgba(255,255,255,0) 35%,rgba(255,255,255,.28) 50%,rgba(255,255,255,0) 65%,rgba(255,255,255,0) 100%);background-size:90px 100%;background-repeat:repeat-x;animation:gd-glisse 5s linear infinite}',
      '.gd-bulle{position:absolute;bottom:6px;left:var(--x);width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.7);opacity:0;animation:gd-bulle var(--t) linear infinite;animation-delay:var(--d)}',
      '.gd-reflet{position:absolute;left:10px;top:10px;bottom:24px;width:9px;border-radius:6px;background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,.05));z-index:4;pointer-events:none}',
      '@keyframes gd-onde{from{-webkit-mask-position:0 0,0 100%;mask-position:0 0,0 100%}to{-webkit-mask-position:60px 0,0 100%;mask-position:60px 0,0 100%}}',
      '@keyframes gd-glisse{from{background-position:0 0}to{background-position:90px 0}}',
      '@keyframes gd-bulle{0%{opacity:0;transform:translateY(0)}15%{opacity:.8}85%{opacity:.8}100%{opacity:0;transform:translateY(-70px)}}',
      '@media (prefers-reduced-motion:reduce){.gd-liq,.gd-liq::after,.gd-bulle{animation:none}}',
      '.gd-choix{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px}',
      '.gd-choix-objet{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 6px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:inherit;font:inherit;cursor:pointer;min-width:0}',
      '.gd-choix-ico{display:flex;width:52px;height:52px;align-items:center;justify-content:center;position:relative}',
      '.gd-choix-ico img{max-width:100%;max-height:100%}',
      '.gd-choix-nom{font-size:13px;font-weight:700;overflow-wrap:anywhere;line-height:1.15}',
      '@media (max-width:520px){.gd-grille{grid-template-columns:repeat(2,minmax(0,1fr))}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  window.__SOREAL_IDLE_DAYCARE_PAGE_V1__={
    disponible:disponible,
    panneau:panneau,
    deposerNonMaxe:deposerNonMaxe,
    apresDepotMaxe:apresDepotMaxe,
    infoFiche:infoFiche,
    boutonFiche:boutonFiche
  };
})();
