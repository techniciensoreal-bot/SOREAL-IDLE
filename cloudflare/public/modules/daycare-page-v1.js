/*
 * SOREAL IDLE — Garderie d'objets (Daycare) : onglet « Garderie » du sac. Le décor est l'IMAGE du chat-étagère ACTIF du joueur (768 x 1152, apparences de modules/etagere-skins-v1.js, servies par
 * /api/idle/media/garderie-skin?id=<id>) ; les bocaux sont rangés DANS ses 3 compartiments (2 par compartiment : 6 places au maximum), aux positions mesurées pour CETTE apparence. Le cadre du chat a
 * un rapport fixe : la mise en page ne bouge JAMAIS quand une place s'ajoute ou que l'apparence change.
 * Apparences : j.systemes.daycare.skins = { actif, possedes:[ids] } (idle-daycare-skins-v1.js, liées au COMPTE : rien dans localStorage, règle n°6). Une rangée de vignettes (seulement les apparences possédées) n'apparaît
 * qu'à partir de 2 possédées (règle n°2 : avec une seule, rien ne trahit l'existence des autres ; jamais de total, de case vide ni de verrou). Un clic envoie { action:'daycareSkin', id }.
 * Transition : l'ancien chat (copie figée posée dans un calque data-morph-garder) glisse hors du cadre pendant que le nouveau entre de l'autre côté (0,6 s, direction selon l'ordre des apparences) ;
 * coupée en prefers-reduced-motion ; pas de clic pendant le glissement ; le calque est remis par window.__SOREAL_IDLE_APRES_REDESSIN_V1__ si la page est redessinée en cours de route (règle n°4).
 * Anti-spoil (règle n°2) : l'onglet n'existe que si la garderie est débloquée ; seuls les bocaux des emplacements POSSÉDÉS sont dessinés, un par un.
 * Le liquide arc-en-ciel monte dans chaque bocal ; quand il atteint le haut, l'objet prend 1 niveau (compté par le MOTEUR : l'interface extrapole seulement la progression entre deux synchros avec la
 * vitesse du moteur, règle n°5 ; rien n'est lu dans le DOM pour le gameplay). Toutes les valeurs viennent de j.systemes.daycare (idle-daycare-v1.js).
 * Les yeux du chat sont dans modules/etagere-personnage-v1.js.
 * Règle n°4 : la hauteur du liquide est réécrite à chaque image ET juste après chaque redessin (window.__SOREAL_IDLE_APRES_REDESSIN_V1__).
 * Règle n°3 : l’onde du liquide avance d’exactement UNE période de sa tuile.
 * Règle n°6 : l'onglet choisi et le nombre de places déjà montrées (pose animée une seule fois) sont des clés localStorage soreal_idle_*_v1, liées au compte.
 * Expose window.__SOREAL_IDLE_DAYCARE_PAGE_V1__ (disponible, onglets, vueGarderie, etagere, infoFiche, boutonFiche, deposerNonMaxe).
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
  let derniereD=null,derniersTotaux=null;
  let repriseId=null;   /* bocal occupé sur lequel on a cliqué : le panneau « Reprendre ? » est affiché */
  /* Les 6 places du chat (en % de l'image) : 2 bocaux par compartiment, posés sur la planche (sol du compartiment). Ordre d'arrivée : du haut vers le bas. Valeurs de REPLI (les données mesurées de chaque apparence, etagere-skins-v1.js, les remplacent). */
  const PLACES=[[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]];
  const SOLS=[46.8,65.2,82.0],HAUT_POT=13.8,LARG_POT=13.2,CENTRES=[36,63],AXE=47.6;
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

  /* Apparences (modules/etagere-skins-v1.js) : données de géométrie du chat actif ; sans elles (module absent) l'apparence par défaut et les valeurs de repli ci-dessus. */
  const SKIN_DEFAUT='defaut',DUREE_GLISSE=600;
  let geoCourante=null;
  function skinsDonnees(){return window.__SOREAL_IDLE_ETAGERE_SKINS_V1__||null;}
  function skinConnu(id){const D=skinsDonnees();return Boolean(D&&D.skins&&D.skins[id]);}
  function skinActif(d){const s=d&&d.skins,id=s&&s.actif?String(s.actif):SKIN_DEFAUT;return skinConnu(id)?id:SKIN_DEFAUT;}
  /* Ids possédés, dans l'ordre des apparences ; jamais d'id inconnu. */
  function skinsPossedes(d){
    const s=d&&d.skins,D=skinsDonnees();
    const ids=s&&Array.isArray(s.possedes)?s.possedes.map(String):[];
    return D&&Array.isArray(D.ordre)?D.ordre.filter(function(id){return ids.indexOf(id)>=0&&D.skins[id];}):[];
  }
  function imageSkin(id){const D=skinsDonnees(),sk=D&&D.skins&&D.skins[id];return sk&&sk.image?sk.image:'/api/idle/media/garderie-skin?id='+SKIN_DEFAUT;}
  const prechargees={};
  function precharger(ids){
    if(typeof Image!=='function')return;
    ids.forEach(function(id){if(prechargees[id])return;prechargees[id]=1;try{const im=new Image();im.decoding='async';im.src=imageSkin(id);}catch(_e){}});
  }
  const r2=function(v){return Math.round(v*100)/100;};
  /* Le « sol » mesuré est la ARÊTE AVANT du dessus de la planche : un bocal dont le fond y touche semble posé dans le vide, au bord (Norman, 2026-10-31 : « les bocaux flottent »). Le fond du verre est remonté de 0,9 % de la hauteur de l'image (≈ 10 px sur 1152) pour reposer au milieu du dessus de la planche, ombre comprise. Même valeur partout, en % de l'image : identique sur PC et téléphone. */
  const REMONTEE_POSE=0.9;
  function positionPlace(i){
    const P=geoCourante;
    if(P&&P.places&&P.places[i]){
      const p=P.places[i],e=Number(p.echelle)||1,w=P.larg*e,h=P.haut*e;
      return {top:r2(p.sol-REMONTEE_POSE-h),left:r2(p.cx-w/2),larg:r2(w),haut:r2(h)};
    }
    const c=PLACES[i][0],col=PLACES[i][1];
    return {top:r2(SOLS[c]-REMONTEE_POSE-HAUT_POT),left:r2(CENTRES[col]-LARG_POT/2),larg:LARG_POT,haut:HAUT_POT};
  }
  const stylePot=function(pos){return 'left:'+pos.left+'%;top:'+pos.top+'%;width:'+pos.larg+'%;height:'+pos.haut+'%';};
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
      pot:'<div class="gd-pot'+(pose?' gd-pose':'')+'" style="'+stylePot(pos)+'"><i class="gd-ombre"></i>'+
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
      /* Plus de liste de notes ni de boutons sous le chat (Norman, 2026-10-30) : on clique sur les bocaux. Reprendre = clic sur un bocal occupé, avec avertissement (panneau ci-dessous). */
      note:'',
      id:it.id,nom:it.name||it.definitionId||'Objet',niveau:e.niveau,depart:(x.levelAtEntry!=null?x.levelAtEntry:it.level),progression:e.p,prochain:prochain
    };
  }

  function bocalVide(pose,i){
    const pos=positionPlace(i);
    return {
      pos:pos,
      pot:'<div class="gd-pot'+(pose?' gd-pose':'')+'" style="'+stylePot(pos)+'"><i class="gd-ombre"></i>'+
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

  /* L'onglet Garderie : le chat-étagère. Toute la section remplace le cadre du sac (mêmes colonnes). */
  function etagere(j){
    const H=H_();
    const d=donnees(j);
    if(!d)return '';
    css();
    const maintenant=Date.now();
    const sid=skinActif(d),possedes=skinsPossedes(d);
    geoCourante=(function(){const D=skinsDonnees(),sk=D&&D.skins&&D.skins[sid];return sk&&sk.pots&&Array.isArray(sk.pots.places)?sk.pots:null;})();
    precharger(possedes);
    suivreChangementSkin(sid,maintenant);
    const sens=glisseActif(maintenant)?transition.sens:'';
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
    /* Reprendre / choisir un objet : popup au-dessus de la page (Norman, 2026-10-31), plus de panneau sous le cadre. */
    derniereD=d;derniersTotaux={libres:libres};
    if(repriseId!=null&&!objets.some(function(x){return x&&x.item&&String(x.item.id)===String(repriseId);}))repriseId=null;
    if(libres<=0)choixOuvert=false;
    demarrer();
    return '<div class="soreal-idle-section-v8" id="soreal-idle-garderie-section"><div class="gd-plein">'+
      '<div class="gd-cadre"><div class="gd-haut">'+onglets(j)+
      '<div class="gd-titre"><span class="gd-titre-ico">'+ICONE_BOCAL+'</span><span>Garderie d’objets</span></div>'+
      '</div>'+
      '<div class="gd-scene">'+selecteur(possedes,sid)+'<div class="gd-etagere" data-skin="'+sid+'">'+
        /* id propre à chaque apparence : au changement, le redessin crée un NOUVEAU bloc (yeux repartis du repos, image neuve) au lieu de réutiliser l'ancien */
        '<div class="gd-fig'+(sens?' gd-entre gd-entre-'+sens:'')+'" id="gd-fig-'+sid+'">'+(E2&&E2.queueSousHtml?E2.queueSousHtml(sid):'')+'<img class="gd-img" src="'+imageSkin(sid)+'"'+(E2&&E2.queueMasqueStyle?E2.queueMasqueStyle(sid):'')+' alt="" width="768" height="1152" loading="eager" decoding="async" draggable="false">'+
          (E2?E2.yeuxHtml(sid)+(E2.queueHtml?E2.queueHtml(sid):''):'')+cases.map(function(c){return c.pot;}).join('')+'</div>'+
      '</div>'+
      '</div></div>'+
      '<div class="gd-intro">Ce chat fait gagner des niveaux à tes objets avec le temps, même hors ligne : quand le liquide atteint le haut du bocal, l’objet prend 1 niveau. Un seul exemplaire de chaque objet ; niveau maximum 100. Tant qu’un objet n’est pas sorti du bocal, il ne peut être ni fusionné ni équipé.</div>'+
      resume+detail+
      '</div></div>';
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
      return true;
    }
    window.__bagageAvaleIdleV1=Date.now();
    daycareIdleV1_('daycarePlace',id);
    return true;
  }
  function daycareIdleV1_(action,itemId){
    choixOuvert=false;repriseId=null;majPopup();
    actionMetaIdleV130_({action:String(action),itemId:String(itemId)});
  }
  window.__daycareIdleV1__=daycareIdleV1_;
  window.__garderieOngletV1__=function(onglet){
    choixOuvert=false;repriseId=null;majPopup();
    stockage(CLE_ONGLET,onglet==='garderie'?'garderie':'sac');
    try{const H=H_();if(H&&typeof H.rafraichirMenuRacineIdleV28_==='function')H.rafraichirMenuRacineIdleV28_();}catch(_e){}
  };
  window.__garderieReprendreV1__=function(id){
    repriseId=(id==null||String(repriseId)===String(id))?null:String(id);choixOuvert=false;
    majPopup();
  };
  window.__garderieConfirmerV1__=function(id){repriseId=null;majPopup();daycareIdleV1_('daycareRemove',String(id));};
  window.__garderieChoisirV1__=function(){
    choixOuvert=!choixOuvert;repriseId=null;
    majPopup();
  };

  /* SÉLECTEUR d'apparence : vignettes des seules apparences POSSÉDÉES (même image réduite), l'active entourée ; rien du tout avec moins de 2 possédées (règle n°2). */
  function selecteur(possedes,actif){
    if(possedes.length<2)return '';
    return '<div class="gd-skins" role="group" aria-label="Apparence du chat">'+possedes.map(function(id){
      return '<button type="button" class="gd-skin'+(id===actif?' actif':'')+'" aria-pressed="'+(id===actif?'true':'false')+'" aria-label="Choisir cette apparence" onclick="window.__garderieSkinV1__(\''+id+'\')">'+
        '<img src="'+imageSkin(id)+'" alt="" width="40" height="60" loading="eager" decoding="async" draggable="false"></button>';
    }).join('')+'</div>';
  }
  /*
   * TRANSITION : au clic, l'ancien chat est COPIÉ (image, yeux, bocaux figés) ; quand le moteur répond avec la nouvelle apparence, le nouveau chat (.gd-entre-*, classe posée par le rendu) entre d'un côté
   * pendant que la copie (calque posé dans la scène, data-morph-garder : un redessin de la page ne le retire pas) sort de l'autre. Sens : apparence suivante dans l'ordre = le chat part vers la gauche.
   * Seul un clic du joueur anime (un changement venu d'ailleurs est net). Pas de clic pendant le glissement ; coupée en prefers-reduced-motion.
   */
  let skinAffiche=null,attente=null,transition=null,finTimer=0;
  function mouvementReduit(){try{return Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){return false;}}
  function glisseActif(maintenant){return Boolean(transition&&maintenant<transition.t0+DUREE_GLISSE+40);}
  function verrouGlisse(maintenant){return Boolean(glisseActif(maintenant)||(attente&&maintenant-attente.t<8000));}
  function suivreChangementSkin(sid,maintenant){
    if(skinAffiche===null||sid===skinAffiche){skinAffiche=sid;return;}
    const a=attente;
    attente=null;skinAffiche=sid;
    if(!a||a.vers!==sid||maintenant-a.t>=8000||!a.ancien||mouvementReduit())return;
    transition={de:a.de,vers:sid,sens:a.sens,t0:maintenant,ancien:a.ancien};
    clearTimeout(finTimer);finTimer=setTimeout(finGlisse,DUREE_GLISSE+60);
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(ensureCalque);   /* filet : le crochet de redessin le pose normalement dans la même tâche */
  }
  function finGlisse(){
    transition=null;clearTimeout(finTimer);finTimer=0;
    const c=document.querySelectorAll('.gd-sort');
    for(let i=0;i<c.length;i+=1)if(c[i].parentNode)c[i].parentNode.removeChild(c[i]);
    const e=document.querySelectorAll('.gd-entre');   /* le nouveau chat est arrivé : plus d'animation maintenue */
    for(let i=0;i<e.length;i+=1)e[i].classList.remove('gd-entre','gd-entre-g','gd-entre-d');
  }
  /* Pose (une seule fois) le calque de l'ancien chat dans la scène, à la bonne phase de l'animation (délai négatif = temps déjà écoulé). */
  function ensureCalque(){
    if(!transition)return;
    const maintenant=Date.now();
    if(!glisseActif(maintenant)){finGlisse();return;}
    const scene=document.querySelector('.gd-scene');
    if(!scene||scene.querySelector('.gd-sort'))return;
    const c=transition.ancien;
    c.style.animationDelay='-'+Math.max(0,maintenant-transition.t0)+'ms';
    scene.appendChild(c);
  }
  window.__garderieSkinV1__=function(id){
    id=String(id);
    const d=derniereD,maintenant=Date.now();
    if(!d||verrouGlisse(maintenant))return;
    const possedes=skinsPossedes(d),actif=skinActif(d);
    if(id===actif||possedes.indexOf(id)<0)return;
    choixOuvert=false;repriseId=null;majPopup();
    const sens=possedes.indexOf(id)>possedes.indexOf(actif)?'g':'d';
    let ancien=null;
    const el=typeof document!=='undefined'&&document.querySelector?document.querySelector('.gd-scene>.gd-etagere'):null;
    if(el&&!mouvementReduit()){
      ancien=el.cloneNode(true);
      /* la queue de l'ancien chat sort FIGEE dans la pose ou elle se trouve (sinon la copie, animation neuve, repartirait du repos : saut visible) */
      {const E3=window.__SOREAL_IDLE_ETAGERE_V1__;if(E3&&E3.figerQueues)E3.figerQueues(el,ancien);}
      ancien.classList.add('gd-sort','gd-sort-'+sens);
      ancien.setAttribute('data-morph-garder','1');ancien.setAttribute('aria-hidden','true');
      const fig=ancien.querySelector('.gd-fig');
      if(fig){fig.removeAttribute('id');fig.classList.remove('gd-entre','gd-entre-g','gd-entre-d');}
      const liste=ancien.querySelectorAll('[data-gd-id]');
      for(let i=0;i<liste.length;i+=1){liste[i].removeAttribute('data-gd-id');liste[i].removeAttribute('onclick');}
    }
    attente={de:actif,vers:id,sens:sens,t:maintenant,ancien:ancien};
    actionMetaIdleV130_({action:'daycareSkin',id:id});
  };

  /* POPUP informatif (aux couleurs de la Garderie) : bloc ajouté à <body>, donc jamais retiré par le morph de la page (règle n°4). Son squelette ne change que si le contenu change ; les
     valeurs vivantes (niveau actuel, avancée) sont réécrites sur place à chaque image sans toucher au reste : aucun clignotement. Fermeture : croix, clic dehors, Échap. */
  let popupHtml='';
  function popupContenu(){
    const H=H_();
    if(repriseId!=null&&derniereD){
      const o=(Array.isArray(derniereD.items)?derniereD.items:[]).filter(function(x){return x&&x.item&&String(x.item.id)===String(repriseId);})[0];
      if(!o)return null;
      const it=o.item||{};
      const depart=o.levelAtEntry!=null?o.levelAtEntry:it.level;
      return '<div class="gd-pop-titre">Reprendre « '+H.idleHtml_(it.name||it.definitionId||'Objet')+' » ?</div>'+
        '<div class="gd-reprise-txt">Placé au niv. <b>'+H.idleEntier_(depart)+'</b>, il est maintenant au niv. <b class="gd-vert" data-gd-pop-niv="1">'+H.idleEntier_(it.level)+'</b> (il garde ses niveaux gagnés) · l’avancée actuelle vers le niveau suivant (<span data-gd-pop-prog="1"></span>) sera perdue.</div>'+
        '<div class="gd-reprise-btns"><button type="button" class="gd-pop-btn" onclick="window.__garderieConfirmerV1__(\''+H.idleHtml_(it.id)+'\')">Reprendre l’objet</button> '+
        '<button type="button" class="gd-pop-btn gd-pop-sec" onclick="window.__garderieReprendreV1__(null)">Annuler</button></div>';
    }
    if(choixOuvert&&derniereD&&derniersTotaux&&derniersTotaux.libres>0){
      return '<div class="gd-pop-titre">Choisis un objet du sac</div>'+listeSac(derniereD)+
        '<div class="gd-reprise-btns" style="margin-top:10px"><button type="button" class="gd-pop-btn gd-pop-sec" onclick="window.__garderieChoisirV1__()">Annuler</button></div>';
    }
    return null;
  }
  function fermerPopup(){
    if(repriseId==null&&!choixOuvert)return;
    repriseId=null;choixOuvert=false;majPopup();
  }
  function majPopup(){
    if(typeof document==='undefined'||!document.body)return;
    let contenu=null;
    if(document.getElementById('soreal-idle-garderie-section'))contenu=popupContenu();
    else{repriseId=null;choixOuvert=false;}
    let fond=document.getElementById('gd-popup-fond');
    /* boutons des bocaux vides : bascule de l'état « ouvert » sans redessiner la page */
    const vides=document.querySelectorAll('.gd-vide');
    for(let i=0;i<vides.length;i+=1)vides[i].classList.toggle('ouvert',Boolean(choixOuvert));
    if(contenu==null){
      popupHtml='';
      if(fond)fond.remove();
      return;
    }
    css();
    if(!fond){
      fond=document.createElement('div');
      fond.id='gd-popup-fond';
      fond.className='gd-popup-fond';
      fond.setAttribute('role','dialog');fond.setAttribute('aria-modal','true');
      fond.innerHTML='<div class="gd-popup"><button type="button" class="gd-pop-x" aria-label="Fermer">×</button><div class="gd-pop-corps"></div></div>';
      fond.addEventListener('click',function(ev){if(ev.target===fond)fermerPopup();});
      fond.querySelector('.gd-pop-x').addEventListener('click',fermerPopup);
      document.body.appendChild(fond);
      popupHtml='';
    }
    if(popupHtml!==contenu){
      popupHtml=contenu;
      fond.querySelector('.gd-pop-corps').innerHTML=contenu;
    }
    majPopupVivant();
  }
  /* valeurs vivantes du popup de reprise : réécrites sur place, seulement si elles changent */
  function majPopupVivant(){
    if(repriseId==null)return;
    const fond=document.getElementById('gd-popup-fond');
    if(!fond)return;
    const liste=document.querySelectorAll('.gd-bocal[data-gd-id]');
    let b=null;
    for(let i=0;i<liste.length;i+=1)if(liste[i].getAttribute('data-gd-id')===String(repriseId)){b=liste[i];break;}
    if(!b)return;
    const rep={p:parseFloat(b.getAttribute('data-gd-p'))||0,lv:parseInt(b.getAttribute('data-gd-lv'),10)||0,r:parseFloat(b.getAttribute('data-gd-r'))||0,t0:parseFloat(b.getAttribute('data-gd-t0'))||Date.now(),max:b.getAttribute('data-gd-max')==='1'?1:0};
    const e=etatA(rep,Date.now());
    const n=fond.querySelector('[data-gd-pop-niv]');
    if(n&&n.textContent!==String(e.niveau))n.textContent=String(e.niveau);
    const pr=fond.querySelector('[data-gd-pop-prog]');
    if(pr){const t=H_().formatGrandNombreIdleV70_(e.p*100,2)+' %';if(pr.textContent!==t)pr.textContent=t;}
  }
  if(typeof document!=='undefined'&&document.addEventListener)document.addEventListener('keydown',function(ev){if(ev.key==='Escape')fermerPopup();});

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
    majPopupVivant();
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
  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(function(){try{majPopup();if(appliquer()>0)demarrer();ensureCalque();}catch(_e){}});

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
      /* L'image du grenier est le fond de TOUT le cadre de la garderie (onglets, titre, chat, texte, résumé), comme l'arcade et Wandoos (Norman, 2026-10-30 : « elle doit prendre tout le cadre ») : image haute sur téléphone, large sur PC, en couverture (cover) ; le chat est posé en bas de sa scène, le texte est sur des panneaux sombres translucides. */
      '#soreal-idle-garderie-section{padding:0;overflow:hidden;border-radius:16px;box-shadow:0 6px 18px rgba(0,0,0,.45)}',
      /* padding 18 px = celui d'une section : les onglets Sac / Garderie gardent EXACTEMENT la même taille et la même place dans les deux vues (Norman, 2026-10-30) */
      '.gd-plein{position:relative;background:url(/garderie/fond-grenier-tel-v1.webp?v=1) center bottom/cover no-repeat;border-radius:16px;padding:18px;box-shadow:inset 0 0 0 3px #3a2410;min-height:620px}',
      '.gd-cadre{position:relative;width:100%;margin:0 auto 8px}',
      '.gd-haut{position:relative;z-index:3;padding:0 0 6px}.gd-haut .gd-onglets{margin:0 0 6px}.gd-haut .gd-titre{margin:2px 0 0}',
      '.gd-scene{position:relative;width:100%;max-width:520px;margin:0 auto;aspect-ratio:1/1.16}',
      '.gd-scene::after{content:"";position:absolute;left:20%;width:60%;bottom:-2.5%;height:5%;border-radius:50%;background:radial-gradient(ellipse at 50% 50%,rgba(20,8,0,.55),transparent 70%);pointer-events:none}',
      '.gd-scene>.gd-etagere{position:absolute;left:13.5%;width:73%;max-width:none;bottom:0;margin:0}',
      '.gd-plein>.gd-intro,.gd-plein>.soreal-idle-summary-grid-v28 .soreal-idle-summary-v28,.gd-plein>details,.gd-plein>.gd-choix-cadre{background:rgba(16,8,2,.72);border-radius:10px}.gd-plein>.gd-intro{padding:8px 10px;color:#f1e4c6}',
      /* transition entre deux chats : le nouveau (.gd-entre-*) entre de l'autre côté pendant que la copie de l'ancien (.gd-sort-*, calque posé par le module) sort ; 0,6 s ease-in-out ; distance = de quoi quitter tout le cadre */
      '.gd-scene{--gd-dx:140%}',
      '.gd-sort{pointer-events:none;z-index:3}',
      '.gd-sort-g{animation:gd-sort-g .6s ease-in-out both}.gd-sort-d{animation:gd-sort-d .6s ease-in-out both}',
      '.gd-entre-g{animation:gd-entre-g .6s ease-in-out both}.gd-entre-d{animation:gd-entre-d .6s ease-in-out both}',
      '@keyframes gd-sort-g{from{transform:translateX(0)}to{transform:translateX(calc(-1 * var(--gd-dx)))}}',
      '@keyframes gd-sort-d{from{transform:translateX(0)}to{transform:translateX(var(--gd-dx))}}',
      '@keyframes gd-entre-g{from{transform:translateX(var(--gd-dx))}to{transform:translateX(0)}}',
      '@keyframes gd-entre-d{from{transform:translateX(calc(-1 * var(--gd-dx)))}to{transform:translateX(0)}}',
      /* sélecteur d'apparence : rangée de vignettes, bande verticale le long du bord gauche sur téléphone (le chat laisse 13,5 % libres de chaque côté), horizontale en bas à droite sur PC (sous le résumé ; la colonne de gauche est prise par le texte) ; défilement interne */
      '.gd-skins{position:absolute;z-index:5;left:0;top:2%;bottom:2%;width:48px;box-sizing:border-box;display:flex;flex-direction:column;gap:6px;padding:5px 4px;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;border-radius:12px;background:rgba(16,8,2,.66);border:1px solid rgba(168,240,204,.4)}',
      '.gd-skin{flex:0 0 auto;width:38px;height:56px;box-sizing:border-box;padding:2px;border-radius:9px;border:2px solid transparent;background:rgba(168,240,204,.1);cursor:pointer}',
      '.gd-skin img{display:block;width:100%;height:100%;object-fit:contain;pointer-events:none}',
      '.gd-skin.actif{border-color:#a8f0cc;background:rgba(168,240,204,.22);box-shadow:0 0 9px rgba(168,240,204,.75)}',
      /* PC (Norman, 2026-10-30 : le chat doit être grand, les informations sur les côtés, le chat sur l'OMBRE ; l'emplacement est primordial) : le cadre a le rapport 4:3 ; le décor (1564 x 1006, ombre du plancher centrée en 800, 712) est agrandi de 1,515 fois et décalé pour que l'ombre tombe EXACTEMENT sous les pieds du chat (centre 50 % x 92 % du cadre) ; le chat fait 40 % de la largeur du cadre ; titre et texte à gauche, résumé et détail à droite. */
      '@media (min-width:900px){.gd-plein{container-type:inline-size;margin:0;aspect-ratio:4/3;min-height:0;padding:0;background:none}.gd-plein::before{content:"";position:absolute;inset:0;z-index:0;background:url(/garderie/fond-grenier-pc-v2.webp?v=2) -27.5cqw 0/151.5cqw auto no-repeat}.gd-cadre,.gd-haut{display:contents}.gd-haut .gd-onglets{position:absolute;z-index:3;top:18px;left:18px;right:18px;margin:0}.gd-haut .gd-titre{position:absolute;z-index:3;top:74px;left:18px;width:calc(28cqw - 18px);margin:0;justify-content:flex-start;font-size:21px;white-space:nowrap;box-sizing:border-box;padding:5px 10px;border-radius:10px;background:rgba(16,8,2,.72)}.gd-scene{position:absolute;inset:0;z-index:2;max-width:none;aspect-ratio:auto;margin:0}.gd-scene::after{display:none}.gd-scene>.gd-etagere{left:30%;width:40%;bottom:5.33%}.gd-scene{--gd-dx:190%}.gd-skins{left:auto;right:18px;top:auto;bottom:18px;width:calc(28cqw - 18px);height:auto;flex-direction:row;overflow-x:auto;overflow-y:hidden;padding:5px}.gd-plein>.gd-intro{position:absolute;z-index:3;top:112px;box-sizing:border-box;left:18px;width:calc(28cqw - 18px);margin:0;text-align:left}.gd-plein>.soreal-idle-summary-grid-v28{position:absolute;z-index:3;top:76px;right:18px;width:calc(28cqw - 18px);grid-template-columns:1fr;gap:6px;margin:0}.gd-plein>details{position:absolute;z-index:3;top:262px;right:18px;width:calc(28cqw - 18px);box-sizing:border-box;margin:0}}',
      /* le chat-étagère : cadre à rapport fixe (la mise en page ne bouge jamais), image en fond, tout le reste en pourcentages de l'image */
      '.gd-etagere{position:relative;width:100%;max-width:560px;margin:0 auto;aspect-ratio:768/1152;container-type:inline-size}',
      '.gd-fig{position:absolute;inset:0;transform-origin:50% 100%}',
      '.gd-img{position:absolute;inset:0;width:100%;height:100%;display:block;user-select:none;-webkit-user-drag:none;pointer-events:none}',
      /* bocal : les mesures sont des fractions de la largeur du bocal (cqw), il s'adapte donc à toutes les tailles d'écran */
      '.gd-pot{position:absolute;width:'+LARG_POT+'%;height:'+HAUT_POT+'%;container-type:size}',
      '.gd-ombre{position:absolute;left:-8%;bottom:-4%;width:116%;height:9%;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.7),rgba(0,0,0,0));z-index:0}',
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
      '@media (prefers-reduced-motion:reduce){.gd-liq,.gd-pose,.gd-pose-note,.gd-fig{animation:none}.gd-sort{display:none}}',
      /* popup de la Garderie : teintes menthe / vert sombre de la page, au-dessus de tout (fond assombri) */
      '.gd-popup-fond{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;background:rgba(4,12,9,.68)}',
      '.gd-popup{position:relative;box-sizing:border-box;width:min(460px,100%);max-height:calc(100dvh - 24px);overflow:auto;overscroll-behavior:contain;padding:18px 16px 16px;border-radius:14px;color:#eefcf5;background:linear-gradient(180deg,#2f4339,#1b2621);border:2px solid #a8f0cc;box-shadow:0 0 0 1px #000,0 16px 40px rgba(0,0,0,.65),inset 0 0 22px rgba(168,240,204,.18)}',
      '.gd-pop-x{position:absolute;top:6px;right:8px;width:34px;height:34px;border-radius:50%;border:1px solid rgba(168,240,204,.6);background:rgba(0,0,0,.35);color:#eefcf5;font:400 22px/1 system-ui,sans-serif;cursor:pointer;padding:0}',
      '.gd-pop-titre{margin:0 34px 10px 0;font:400 22px/1.15 "Bangers","Russo One",system-ui,sans-serif;letter-spacing:.04em;color:#a8f0cc;text-shadow:0 2px 0 #0e1a14}',
      '.gd-pop-btn{padding:9px 14px;border-radius:10px;border:1px solid #1f6b4d;background:linear-gradient(180deg,#a8f0cc,#4fb88a 60%,#2f8a64);color:#07261a;font:400 15px/1.1 "Russo One",system-ui,sans-serif;cursor:pointer}',
      '.gd-pop-sec{background:linear-gradient(180deg,#4c6c5c,#2f4339);color:#eefcf5;border-color:#a8f0cc}',
      '.gd-popup .gd-choix-objet{border-color:rgba(168,240,204,.35);background:rgba(168,240,204,.08)}',
      '.gd-popup .gd-reprise-txt{color:#eefcf5}',
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
    infoFiche:infoFiche,
    boutonFiche:boutonFiche
  };
})();
