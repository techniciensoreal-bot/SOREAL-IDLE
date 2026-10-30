/*
 * SOREAL IDLE — Garderie d'objets (Daycare) : onglet « Garderie » du sac. Le décor est l'IMAGE de la vieille dame armoire (cloudflare/public/garderie/armoire-v1.webp, 768 x 1152, fournie par Norman) ;
 * les bocaux sont rangés DANS ses 3 compartiments (2 par compartiment : 6 places au maximum). Le cadre de l'armoire a un rapport fixe : la mise en page ne bouge JAMAIS quand une place s'ajoute.
 * Anti-spoil (règle n°2) : l'onglet n'existe que si la garderie est débloquée ; seuls les bocaux des emplacements POSSÉDÉS sont dessinés, un par un.
 * Le liquide arc-en-ciel monte dans chaque bocal ; quand il atteint le haut, l'objet prend 1 niveau (compté par le MOTEUR : l'interface extrapole seulement la progression entre deux synchros avec la
 * vitesse du moteur, règle n°5 ; rien n'est lu dans le DOM pour le gameplay). Toutes les valeurs viennent de j.systemes.daycare (idle-daycare-v1.js).
 * Les yeux, le nez qui bouge et les phrases sont dans modules/etagere-personnage-v1.js.
 * Règle n°4 : la hauteur du liquide est réécrite à chaque image ET juste après chaque redessin (window.__SOREAL_IDLE_APRES_REDESSIN_V1__).
 * Règle n°3 : l’onde du liquide avance d’exactement UNE période de sa tuile.
 * Règle n°6 : l'onglet choisi et le nombre de places déjà montrées (pose animée une seule fois) sont des clés localStorage soreal_idle_*_v1, liées au compte.
 * Expose window.__SOREAL_IDLE_DAYCARE_PAGE_V1__ (disponible, onglets, vueGarderie, etagere, infoFiche, boutonFiche, deposerNonMaxe, apresDepotMaxe).
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
  let repriseId=null;   /* bocal occupé sur lequel on a cliqué : le panneau « Reprendre ? » est affiché */
  /* Les 6 places de l'armoire (en % de l'image) : 2 bocaux par compartiment, posés sur la planche (sol du compartiment). Ordre d'arrivée : du haut vers le bas. */
  const PLACES=[[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]];
  const SOLS=[46.8,65.2,82.0],HAUT_POT=11.0,LARG_POT=10.5,CENTRES=[36,63],AXE=47.6;
  const CLE_ONGLET='soreal_idle_sac_onglet_v1',CLE_PLACES='soreal_idle_garderie_places_v1';
  const poses={};                                     /* indice du bocal -> instant de sa pose animée (le temps que l'animation joue, même si la page est redessinée) */
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

  function stockage(cle,valeur){
    try{
      if(valeur===undefined)return window.localStorage.getItem(cle);
      window.localStorage.setItem(cle,String(valeur));
    }catch(_e){}
    return null;
  }
  function ongletChoisi(){return stockage(CLE_ONGLET)==='garderie'?'garderie':'sac';}
  function vueGarderie(j){return disponible(j)&&ongletChoisi()==='garderie';}
  /* Onglets Sac | Garderie : seulement si la garderie est débloquée ; sinon rien (le sac reste tel qu'avant). */
  function onglets(j){
    if(!disponible(j))return '';
    css();
    const g=ongletChoisi()==='garderie';
    return '<div class="gd-onglets" role="tablist">'+
      '<button type="button" role="tab" aria-selected="'+(g?'false':'true')+'" class="gd-onglet'+(g?'':' actif')+'" onclick="window.__garderieOngletV1__(\'sac\')">Sac</button>'+
      '<button type="button" role="tab" aria-selected="'+(g?'true':'false')+'" class="gd-onglet'+(g?' actif':'')+'" onclick="window.__garderieOngletV1__(\'garderie\')">'+ICONE_BOCAL+' Garderie</button>'+
    '</div>';
  }

  function positionPlace(i){
    const c=PLACES[i][0],col=PLACES[i][1];
    return {top:SOLS[c]-HAUT_POT,left:CENTRES[col]-LARG_POT/2,cx:CENTRES[col],col:col,comp:c};
  }
  /* Un bocal rangé dans son compartiment (le verre, le liquide, l'objet) + sa fiche dans la liste dessous (niveau, nom, temps). */
  function bocalHtml(x,maintenant,pose,i){
    const H=H_(),it=x.item||{};
    const rep=reperePour(x,maintenant);
    const e=etatA(rep,maintenant);
    const R=REG_();
    const pos=positionPlace(i);
    const icone=typeof R.iconeObjetAdventureIdleV138_==='function'?R.iconeObjetAdventureIdleV138_(Object.assign({},it,{level:e.niveau})):'';
    const prochain=rep.max?'Niveau max':(rep.r>0?'+1 niv. dans '+dureeLongueNguIdleV1_((1-e.p)/rep.r):'À l’arrêt');
    const taux=x.effectiveHoursPerLevel!=null?'1 niveau / '+dureeLongueNguIdleV1_(H.idleNombre_(x.effectiveHoursPerLevel)*3600):'';
    return {
      pos:pos,
      pot:'<div class="gd-pot'+(pose?' gd-pose':'')+'" style="left:'+pos.left+'%;top:'+pos.top+'%"><i class="gd-ombre"></i>'+
        '<button type="button" class="gd-bocal gd-occupe" data-gd-id="'+H.idleHtml_(it.id)+'" data-gd-p="'+rep.p+'" data-gd-lv="'+rep.lv+'" data-gd-r="'+rep.r+'" data-gd-t0="'+rep.t0+'" data-gd-max="'+rep.max+'" aria-label="Reprendre '+H.idleHtml_(it.name||'l’objet')+'" title="'+H.idleHtml_((it.name||'Objet')+' — '+prochain+(taux?' · '+taux:''))+'" onclick="window.__garderieReprendreV1__(\''+H.idleHtml_(it.id)+'\')">'+
          '<div class="gd-bouchon"></div><div class="gd-col"></div>'+
          '<div class="gd-verre">'+
            '<div class="gd-objet">'+icone+'</div>'+
            '<div class="gd-liq" style="transform:translateY('+decalageLiquide(e.p)+'%)"><i class="gd-bulles"></i></div>'+
            '<div class="gd-reflet"></div>'+
          '</div>'+
          /* niveau au moment du placement, puis niveau actuel EN VERT (Norman, 2026-10-30) */
          '<span class="gd-niv-badge" data-gd-note="'+H.idleHtml_(it.id)+'">Niv. <i class="gd-niv-dep">'+H.idleEntier_(x.levelAtEntry!=null?x.levelAtEntry:it.level)+'</i> › <b class="gd-niv-n">'+e.niveau+'</b></span>'+
        '</button></div>',
      /* Plus de liste de notes ni de boutons sous l'armoire (Norman, 2026-10-30) : on clique sur les bocaux. Reprendre = clic sur un bocal occupé, avec avertissement (panneau ci-dessous). */
      note:'',
      id:it.id,nom:it.name||it.definitionId||'Objet',niveau:e.niveau,depart:(x.levelAtEntry!=null?x.levelAtEntry:it.level),progression:e.p,prochain:prochain
    };
  }

  function bocalVide(pose,i){
    const pos=positionPlace(i);
    return {
      pos:pos,
      pot:'<div class="gd-pot'+(pose?' gd-pose':'')+'" style="left:'+pos.left+'%;top:'+pos.top+'%"><i class="gd-ombre"></i>'+
        '<button type="button" class="gd-bocal gd-vide'+(choixOuvert?' ouvert':'')+'" onclick="window.__garderieChoisirV1__()" aria-label="Placer un objet">'+
          '<div class="gd-bouchon"></div><div class="gd-col"></div>'+
          '<div class="gd-verre"><div class="gd-objet">'+ICONE_PLUS+'</div><div class="gd-reflet"></div></div>'+
        '</button></div>',
      note:''
    };
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

  /* Combien de places ont déjà été montrées : un bocal NOUVEAU (achat, perk, défi) se pose avec une petite animation, une seule fois (mémorisé), jamais au rechargement. */
  function nouvellesPlaces(total,maintenant){
    const brut=stockage(CLE_PLACES),connu=brut===null||brut===''?null:Math.max(0,parseInt(brut,10)||0);
    if(connu===null||total<connu){stockage(CLE_PLACES,total);return;}
    for(let i=connu;i<total;i+=1)poses[i]=maintenant;
    if(total>connu)stockage(CLE_PLACES,total);
  }

  /* L'onglet Garderie : l'armoire. Toute la section remplace le cadre du sac (mêmes colonnes). */
  function etagere(j){
    const H=H_();
    const d=donnees(j);
    if(!d)return '';
    css();
    const maintenant=Date.now();
    const pct=function(v){return H.formatGrandNombreIdleV70_(H.idleNombre_(v)*100,2)+' %';};
    const objets=Array.isArray(d.items)?d.items:[];
    const total=Math.min(PLACES.length,Math.max(H.idleEntier_(d.slots),objets.length));
    const libres=Math.max(0,total-objets.length);
    nouvellesPlaces(total,maintenant);
    const cases=objets.slice(0,PLACES.length).map(function(x,i){return bocalHtml(x,maintenant,poses[i]&&maintenant-poses[i]<1100,i);});
    for(let i=0;i<libres;i+=1){const k=objets.length+i;cases.push(bocalVide(poses[k]&&maintenant-poses[k]<1100,k));}
    const E2=window.__SOREAL_IDLE_ETAGERE_V1__;
    const resume=
      '<div class="soreal-idle-summary-grid-v28">'+
        '<div class="soreal-idle-summary-v28">Places<b>'+total+'</b></div>'+
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
    const R2=repriseId==null?null:cases.filter(function(c){return c.id!=null&&String(c.id)===String(repriseId);})[0];
    /* Reprendre un objet : clic sur son bocal ; l'avancée vers le niveau suivant est perdue, le panneau le dit avant (Norman, 2026-10-30) */
    const reprise=R2
      ?'<div class="soreal-idle-section-v8 gd-choix-cadre gd-reprise"><div class="soreal-idle-window-title-v31">Reprendre « '+H.idleHtml_(R2.nom)+' » ?</div>'+
        '<div class="gd-reprise-txt">Placé au niv. <b>'+H.idleEntier_(R2.depart)+'</b>, il est maintenant au niv. <b class="gd-vert">'+H.idleEntier_(R2.niveau)+'</b> (il garde ses niveaux gagnés) · l’avancée actuelle vers le niveau suivant ('+pct(R2.progression)+') sera perdue.</div>'+
        '<div class="gd-reprise-btns"><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__garderieConfirmerV1__(\''+H.idleHtml_(R2.id)+'\')">Reprendre l’objet</button> '+
        '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__garderieReprendreV1__(null)">Annuler</button></div></div>'
      :'';
    const choix=(libres>0&&choixOuvert)
      ?'<div class="soreal-idle-section-v8 gd-choix-cadre"><div class="soreal-idle-window-title-v31">Choisis un objet du sac</div>'+listeSac(d)+
        '<div style="margin-top:8px"><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__garderieChoisirV1__()">Annuler</button></div></div>'
      :'';
    demarrer();
    return '<div class="soreal-idle-section-v8" id="soreal-idle-garderie-section"><div class="gd-plein">'+
      '<div class="gd-cadre"><div class="gd-haut">'+onglets(j)+
      '<div class="gd-titre"><span class="gd-titre-ico">'+ICONE_BOCAL+'</span><span>Garderie d’objets</span></div>'+
      '</div>'+
      '<div class="gd-scene"><div class="gd-armoire'+(E2?E2.classes():'')+'"'+(E2?' data-humeur="'+E2.humeur()+'"':'')+'>'+
        '<div class="gd-fig"><img class="gd-img" src="/garderie/armoire-v1.webp?v=2" alt="" width="768" height="1152" loading="eager" decoding="async" draggable="false">'+
          (E2?E2.yeuxHtml():'')+cases.map(function(c){return c.pot;}).join('')+'</div>'+
      '</div>'+
      '</div></div>'+
      '<div class="gd-intro">Mamie l’armoire fait gagner des niveaux à tes objets avec le temps, même hors ligne : quand le liquide atteint le haut du bocal, l’objet prend 1 niveau. Un seul exemplaire de chaque objet ; niveau maximum 100. Un objet en garderie ne peut pas être fusionné ni équipé.</div>'+
      resume+detail+
      reprise+choix+'</div></div>';
  }

  /* L'étagère parle (modules/etagere-personnage-v1.js, phrases « phrases:etagere ») : {D} on lui confie un objet, {M} objet maxé, {P} plus de place. Seulement quand la garderie est débloquée (règle n°2). */
  function parler(mode){
    try{const E=window.__SOREAL_IDLE_ETAGERE_V1__;if(E&&typeof E.reagir==='function')E.reagir(mode);}catch(_e){}
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
      parler('plein');   /* c'est l'étagère qui refuse */
      return true;
    }
    window.__bagageAvaleIdleV1=Date.now();
    daycareIdleV1_('daycarePlace',id);
    return true;
  }
  /* Un objet maxé rangé dans le Coffre comme avant : si la garderie est débloquée, il a sa phrase {M}. */
  function apresDepotMaxe(){if(disponible(REG_().idleEtat))parler('daycare:max');}

  function daycareIdleV1_(action,itemId){
    choixOuvert=false;repriseId=null;
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
  window.__garderieOngletV1__=function(onglet){
    choixOuvert=false;repriseId=null;
    stockage(CLE_ONGLET,onglet==='garderie'?'garderie':'sac');
    try{const H=H_();if(H&&typeof H.rafraichirMenuRacineIdleV28_==='function')H.rafraichirMenuRacineIdleV28_();}catch(_e){}
  };
  window.__garderieReprendreV1__=function(id){
    repriseId=(id==null||String(repriseId)===String(id))?null:String(id);choixOuvert=false;
    try{const H=H_();if(H&&typeof H.rafraichirMenuRacineIdleV28_==='function')H.rafraichirMenuRacineIdleV28_();}catch(_e){}
  };
  window.__garderieConfirmerV1__=function(id){repriseId=null;daycareIdleV1_('daycareRemove',String(id));};
  window.__garderieChoisirV1__=function(){
    choixOuvert=!choixOuvert;repriseId=null;
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
      const nn=document.querySelector('[data-gd-note="'+b.getAttribute('data-gd-id')+'"] .gd-niv-n');
      const n=nn||null;
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
      '.gd-onglets{display:flex;gap:8px;margin:0 0 10px}',
      '.gd-onglet{flex:1 1 0;min-width:0;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 10px;border-radius:12px;border:2px solid #5a4630;background:linear-gradient(180deg,#3a2a1a,#241a10);color:#d8c7a6;font:400 18px/1.15 "Bangers","Russo One",system-ui,sans-serif;letter-spacing:.04em;cursor:pointer;white-space:normal;text-align:center}',
      '.gd-onglet.actif{border-color:#e6c46a;background:linear-gradient(180deg,#e6c46a,#a67c25);color:#2b1d05;box-shadow:0 0 10px rgba(230,196,106,.45)}',
      '.gd-titre{display:flex;align-items:center;justify-content:center;gap:8px;margin:2px 0 6px;font:400 24px/1.15 "Bangers","Russo One",system-ui,sans-serif;letter-spacing:.05em;color:#f2d98d;text-shadow:0 2px 0 #4a2d0c,0 0 12px rgba(255,200,90,.35);text-align:center}',
      '.gd-titre-ico{display:inline-flex;font-size:.95em}',
      '.gd-intro{font-size:13px;color:#b9c6dc;margin:2px 0 10px;text-align:center}',
      '.gd-ico{vertical-align:-.2em}',
      '.gd-reserve{margin-top:6px}',
      /* L'image du grenier est le fond de TOUT le cadre de la garderie (onglets, titre, armoire, texte, résumé), comme l'arcade et Wandoos (Norman, 2026-10-30 : « elle doit prendre tout le cadre ») : image haute sur téléphone, large sur PC, en couverture (cover) ; l'armoire est posée en bas de sa scène, le texte est sur des panneaux sombres translucides. */
      '#soreal-idle-garderie-section{padding:0;overflow:hidden;border-radius:16px;box-shadow:0 6px 18px rgba(0,0,0,.45)}',
      /* padding 18 px = celui d'une section : les onglets Sac / Garderie gardent EXACTEMENT la même taille et la même place dans les deux vues (Norman, 2026-10-30) */
      '.gd-plein{position:relative;background:url(/garderie/fond-grenier-tel-v1.webp?v=1) center bottom/cover no-repeat;border-radius:16px;padding:18px;box-shadow:inset 0 0 0 3px #3a2410;min-height:620px}',
      '.gd-cadre{position:relative;width:100%;margin:0 auto 8px}',
      '.gd-haut{position:relative;z-index:3;padding:0 0 6px}.gd-haut .gd-onglets{margin:0 0 6px}.gd-haut .gd-titre{margin:2px 0 0}',
      '.gd-scene{position:relative;width:100%;max-width:520px;margin:0 auto;aspect-ratio:1/1.16}',
      '.gd-scene::after{content:"";position:absolute;left:20%;width:60%;bottom:-2.5%;height:5%;border-radius:50%;background:radial-gradient(ellipse at 50% 50%,rgba(20,8,0,.55),transparent 70%);pointer-events:none}',
      '.gd-scene>.gd-armoire{position:absolute;left:13.5%;width:73%;max-width:none;bottom:0;margin:0}',
      '.gd-plein>.gd-intro,.gd-plein>.soreal-idle-summary-grid-v28 .soreal-idle-summary-v28,.gd-plein>details,.gd-plein>.gd-choix-cadre{background:rgba(16,8,2,.72);border-radius:10px}.gd-plein>.gd-intro{padding:8px 10px;color:#f1e4c6}',
      '@media (min-width:900px){.gd-plein{background-image:url(/garderie/fond-grenier-pc-v2.webp?v=1);min-height:760px}.gd-scene{max-width:860px;aspect-ratio:860/470}.gd-scene::after{left:35%;width:30%}.gd-scene>.gd-armoire{left:35%;width:30%}}',
      /* l'armoire : cadre à rapport fixe (la mise en page ne bouge jamais), image en fond, tout le reste en pourcentages de l'image */
      '.gd-armoire{position:relative;width:100%;max-width:560px;margin:0 auto;aspect-ratio:768/1152;container-type:inline-size}',
      '.gd-fig{position:absolute;inset:0;transform-origin:50% 100%}',
      '.gd-img{position:absolute;inset:0;width:100%;height:100%;display:block;user-select:none;-webkit-user-drag:none;pointer-events:none}',
      '.gd-armoire[data-humeur="dort"] .gd-fig{animation:etRespire 4.6s ease-in-out infinite}',
      '.gd-armoire:not([data-humeur="dort"]) .gd-fig{animation:etGrince 14s linear infinite}',
      /* bocal : les mesures sont des fractions de la largeur du bocal (cqw), il s'adapte donc à toutes les tailles d'écran */
      '.gd-pot{position:absolute;width:'+LARG_POT+'%;height:'+HAUT_POT+'%;container-type:size}',
      '.gd-ombre{position:absolute;left:-10%;bottom:-3%;width:130%;height:12%;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.6),rgba(0,0,0,0));z-index:0}',
      '.gd-bocal{position:relative;z-index:1;display:block;width:100%;height:100%;padding:0;margin:0;border:0;background:none;color:inherit;font:inherit}',
      '.gd-bouchon{position:absolute;left:50%;top:0;width:48cqw;height:15cqw;margin-left:-24cqw;border-radius:3px 3px 1px 1px;background:radial-gradient(circle at 20% 40%,rgba(90,52,20,.55) 0 1px,rgba(0,0,0,0) 1.5px),radial-gradient(circle at 66% 62%,rgba(90,52,20,.5) 0 1px,rgba(0,0,0,0) 1.6px),linear-gradient(180deg,#d5a96a,#a9743a 60%,#7a5028);box-shadow:inset 0 -1px 0 rgba(0,0,0,.35),inset 0 1px 0 rgba(255,236,200,.5),0 1px 2px #000;z-index:4}',
      '.gd-col{position:absolute;left:50%;top:13cqw;width:60cqw;height:10cqw;margin-left:-30cqw;border-radius:3px;border:max(1px,2cqw) solid rgba(200,230,255,.8);background:linear-gradient(90deg,rgba(255,255,255,.32),rgba(255,255,255,.06) 45%,rgba(255,255,255,.2));z-index:3}',
      '.gd-verre{position:absolute;left:0;right:0;top:21cqw;bottom:0;border-radius:15cqw 15cqw 27cqw 27cqw;border:max(1.5px,3.2cqw) solid rgba(190,225,255,.8);background:linear-gradient(90deg,rgba(255,255,255,.2),rgba(255,255,255,.04) 38%,rgba(255,255,255,.1) 70%,rgba(255,255,255,.24));box-shadow:inset 0 0 0 1px rgba(255,255,255,.25),inset 0 0 10px rgba(160,210,255,.4),inset -4px -4px 8px rgba(20,60,110,.28),0 3px 6px rgba(0,0,0,.5);overflow:hidden;isolation:isolate}',
      '.gd-verre::after{content:"";position:absolute;inset:0;z-index:5;pointer-events:none;background:linear-gradient(115deg,rgba(255,255,255,.26) 0,rgba(255,255,255,0) 26%,rgba(255,255,255,0) 74%,rgba(255,255,255,.18) 92%,rgba(255,255,255,.45) 94%,rgba(255,255,255,0) 96%)}',
      '.gd-objet{position:absolute;inset:12cqw 10cqw 12cqw;display:flex;align-items:center;justify-content:center;z-index:1}',
      '.gd-objet>*,.gd-objet img{max-width:100%;max-height:100%}',
      '.gd-objet .idle-boost-icon-v1,.gd-objet img{width:56cqw;height:56cqw;object-fit:contain;filter:drop-shadow(1px 2px 1px rgba(0,0,0,.5))}',
      '.gd-objet .idle-lvl-badge-v1{display:none}',
      '.gd-vide .gd-objet{color:rgba(190,225,255,.75)}',
      '.gd-plus{width:60%;height:auto}',
      '.gd-vide,.gd-occupe{cursor:pointer}',
      '.gd-niv-badge{position:absolute;left:50%;bottom:-17%;transform:translateX(-50%);z-index:3;padding:.3em .7em;border-radius:999px;background:rgba(20,10,0,.82);border:1px solid rgba(255,226,120,.6);color:#ffe9a8;font:800 28cqw/1 "Russo One",system-ui,sans-serif;white-space:nowrap;pointer-events:none}',
      '.gd-niv-badge .gd-niv-n,.gd-reprise-txt .gd-vert{color:#5dff7a;text-shadow:0 0 6px rgba(60,220,90,.6)}.gd-niv-dep{font-style:normal}',
      '.gd-reprise-txt{margin:6px 0 10px;font-size:14px;color:#f3e6c4;text-align:center}.gd-reprise-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}',
      '.gd-vide.ouvert .gd-verre{border-color:#f5c14b}',
      /* liquide : couches de saturation, ménisque brillant ; une couche animée par bocal (l’onde) */
      '.gd-liq{position:absolute;left:0;right:0;top:-8cqw;height:calc(100% + 8cqw);z-index:2;opacity:.88;background:radial-gradient(130% 40% at 50% 100%,rgba(255,255,255,.28),rgba(255,255,255,0) 70%),linear-gradient(180deg,rgba(255,255,255,.28) 0,rgba(255,255,255,0) 14%),linear-gradient(180deg,#ff4a4a 0%,#ff9f2e 17%,#ffe135 33%,#4be07b 50%,#2fb5ff 67%,#5b5bff 83%,#b24bff 100%);background-size:100% 100%,100% 100%,100% 100%;background-repeat:no-repeat;will-change:transform;',
      '-webkit-mask-image:'+WAVE+',linear-gradient(#000,#000);mask-image:'+WAVE+',linear-gradient(#000,#000);-webkit-mask-size:50cqw 8cqw,100% calc(100% - 7cqw);mask-size:50cqw 8cqw,100% calc(100% - 7cqw);-webkit-mask-position:0 0,0 100%;mask-position:0 0,0 100%;-webkit-mask-repeat:repeat-x,no-repeat;mask-repeat:repeat-x,no-repeat;animation:gd-onde 3.2s linear infinite}',
      '.gd-liq::after{content:"";position:absolute;left:0;right:0;top:6cqw;height:2px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.85) 30%,rgba(255,255,255,.85) 60%,rgba(255,255,255,0))}',
      '.gd-bulles{position:absolute;left:0;right:0;top:8cqw;bottom:0;pointer-events:none;background:radial-gradient(circle at 20% 82%,rgba(255,255,255,.8) 0 2px,rgba(255,255,255,0) 2.8px),radial-gradient(circle at 56% 48%,rgba(255,255,255,.75) 0 1.4px,rgba(255,255,255,0) 2px),radial-gradient(circle at 78% 70%,rgba(255,255,255,.8) 0 2.6px,rgba(255,255,255,0) 3.4px),radial-gradient(circle at 36% 24%,rgba(255,255,255,.7) 0 1.1px,rgba(255,255,255,0) 1.7px),radial-gradient(circle at 88% 20%,#fff6c0 0 .8px,rgba(255,246,192,0) 1.4px),radial-gradient(circle at 12% 46%,#fff6c0 0 .9px,rgba(255,246,192,0) 1.5px);background-size:100% 46px;background-repeat:repeat-y;-webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,0),#000 22%,#000 78%,rgba(0,0,0,0));mask-image:linear-gradient(180deg,rgba(0,0,0,0),#000 22%,#000 78%,rgba(0,0,0,0))}',
      '.gd-reflet{position:absolute;left:9cqw;top:11cqw;bottom:14cqw;width:7cqw;border-radius:6px;background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,.05));z-index:4;pointer-events:none}',
      /* liste des bocaux : 3 rangées réservées (2 colonnes), la page ne bouge pas quand une place s'ajoute */
      '.gd-liste{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,minmax(92px,auto));gap:8px 10px;margin-top:10px;min-height:calc(3*92px + 16px)}',
      '.gd-note{display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center;min-width:0;padding:6px 6px 8px;border-radius:10px;background:rgba(0,0,0,.28);border:1px solid rgba(255,226,170,.18)}',
      '.gd-niv{font-family:"Russo One",system-ui,sans-serif;font-size:15px;color:#fff3c9;text-shadow:0 1px 2px #000}',
      '.gd-info{font-size:13px;font-weight:700;overflow-wrap:anywhere;line-height:1.2;color:#f6e7c8;text-shadow:0 1px 2px #000}',
      '.gd-info.gd-petit{font-size:11px;font-weight:500;color:#e0cfa8}',
      '.gd-reprendre{margin-top:auto;width:100%;max-width:112px;box-sizing:border-box;padding:5px 4px;border-radius:9px;border:1px solid #5d4208;background:linear-gradient(180deg,#f6d77f,#c9a243 55%,#99721c);box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 2px 3px rgba(0,0,0,.5);color:#2b1d05;font:400 12px/1.1 "Russo One",system-ui,sans-serif;letter-spacing:0;cursor:pointer;white-space:normal;overflow-wrap:anywhere}',
      /* pose d'un nouveau bocal : une seule fois */
      '.gd-pose{animation:gd-pose .8s cubic-bezier(.3,.8,.35,1) 1 both}',
      '.gd-pose-note{animation:gd-pose-note .8s ease-out 1 both}',
      '@keyframes gd-pose{0%{opacity:0;transform:translateY(-46px) scale(.96)}55%{opacity:1;transform:translateY(0) scale(1)}72%{transform:translateY(-7px)}100%{opacity:1;transform:translateY(0)}}',
      '@keyframes gd-pose-note{0%{opacity:0}60%{opacity:0}100%{opacity:1}}',
      '@keyframes gd-onde{from{-webkit-mask-position:0 0,0 100%;mask-position:0 0,0 100%}to{-webkit-mask-position:50cqw 0,0 100%;mask-position:50cqw 0,0 100%}}',
      '@media (prefers-reduced-motion:reduce){.gd-liq,.gd-pose,.gd-pose-note,.gd-fig{animation:none}}',
      '.gd-choix{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px}',
      '.gd-choix-cadre{margin-top:12px}',
      '.gd-choix-objet{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 6px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:inherit;font:inherit;cursor:pointer;min-width:0}',
      '.gd-choix-ico{display:flex;width:52px;height:52px;align-items:center;justify-content:center;position:relative}',
      '.gd-choix-ico img{max-width:100%;max-height:100%}',
      '.gd-choix-nom{font-size:13px;font-weight:700;overflow-wrap:anywhere;line-height:1.15}',
      '@media (max-width:520px){.gd-reprendre{font-size:10px;padding:5px 1px}.gd-info{font-size:12px}.gd-info.gd-petit{font-size:10px}.gd-onglet{font-size:16px}.gd-titre{font-size:21px}.gd-liste{gap:6px}.gd-note{padding:5px 3px 6px}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  window.__SOREAL_IDLE_DAYCARE_PAGE_V1__={
    disponible:disponible,
    onglets:onglets,
    vueGarderie:vueGarderie,
    etagere:etagere,
    deposerNonMaxe:deposerNonMaxe,
    apresDepotMaxe:apresDepotMaxe,
    infoFiche:infoFiche,
    boutonFiche:boutonFiche
  };
})();
