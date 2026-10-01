/*
 * Fil d'actualité de SOREAL IDLE (Norman, 2026-10-01) : « voir ce que les gens font dans leur jeu (Mickaël vient de tuer <boss>, Sébastien a
 * débloqué <trophée>, Sylvain farme dans les égouts, Maxence a terrassé <titan>…), visible dans tous les menus, comme une écriture qui défile. »
 *
 * Les événements viennent du serveur (src/idle-flux-v1.js) par la réponse du battement du chat (toutes les ~20 s) : aucun appel de plus.
 * Un bandeau fixe en bas de l'écran, hors du rendu du jeu (donc présent dans tous les menus et jamais effacé par un re-rendu), fait défiler
 * les dernières nouvelles ; toucher/survoler le met en pause ; la croix le replie (choix mémorisé).
 *
 * Anti-spoil (AGENTS.md règle n°2) : chaque phrase est construite CÔTÉ LECTEUR avec ce que le lecteur a déjà découvert
 * (window.__SOREAL_IDLE_ACTIVITE_V1__().connus) : un boss, un titan ou un trophée qu'il ne connaît pas devient « un boss », « un Titan »,
 * « un trophée » ; un Rebirth ou un Challenge n'est jamais mentionné tant que le lecteur n'a pas débloqué ces menus.
 */
(function(){
  'use strict';

  const CLE_REPLI='soreal_idle_flux_replie_v1';
  const MAX_ITEMS=30;
  const MAX_BANDEAU=14;
  const PX_PAR_SEC=46;

  let items=[];
  let dernier=0;
  let replie=false;
  let bandeau=null;
  let piste=null;
  let x=0;
  let enPause=false;
  let tPrec=0;
  let largeurPiste=0;
  let raf=0;

  function echapper(v){
    return String(v==null?'':v).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  try{replie=localStorage.getItem(CLE_REPLI)==='1';}catch(e){}

  function contexte(){
    try{
      const f=window.__SOREAL_IDLE_ACTIVITE_V1__;
      const c=typeof f==='function'?f():null;
      return c&&c.connus?c:{zones:[],bossMax:0,connus:{boss:{},titan:{},succes:{},menus:{}}};
    }catch(e){return {zones:[],bossMax:0,connus:{boss:{},titan:{},succes:{},menus:{}}};}
  }

  /*
   * Phrase d'un événement, ou null si elle ne doit pas être montrée à CE lecteur. Exportée pour les tests.
   * it = { type, nom, donnees, moi } ; ctx = résultat de __SOREAL_IDLE_ACTIVITE_V1__.
   */
  function phrase(it,ctx){
    const c=ctx||contexte();
    const k=c.connus||{boss:{},titan:{},succes:{},menus:{}};
    const d=it.donnees||{};
    const nom=it.moi?'Tu':it.nom;
    const verbe=function(toi,lui){return it.moi?toi:lui;};
    switch(it.type){
      case 'boss':{
        const n=Number(d.boss)||0;
        const nomBoss=n>0&&n<=Number(c.bossMax||0)?k.boss[n]:'';
        return {icone:'👹',texte:nomBoss?nom+verbe(' viens',' vient')+' de vaincre '+nomBoss:nom+verbe(' viens',' vient')+' de vaincre un boss'};
      }
      case 'succes':{
        const nomSucces=k.succes[String(d.id)];
        return {icone:'🏆',texte:nomSucces?nom+verbe(' as',' a')+' débloqué le trophée '+nomSucces:nom+verbe(' as',' a')+' débloqué un trophée'};
      }
      case 'titan':{
        if(!k.menus.titans)return null;
        const nomTitan=k.titan[String(d.id)];
        return {icone:'🔥',texte:nomTitan?nom+verbe(' viens',' vient')+' de terrasser un Titan : '+nomTitan:nom+verbe(' viens',' vient')+' de terrasser un Titan'};
      }
      case 'defi':
        if(!k.menus.challenges)return null;
        return {icone:'🏁',texte:nom+verbe(' as',' a')+' réussi un Challenge'};
      case 'rebirth':
        if(!k.menus.renaissance)return null;
        return {icone:'♻️',texte:nom+verbe(' as',' a')+' fait un Rebirth'};
      case 'farm':{
        const connue=(c.zones||[]).some(function(z){return Number(z.id)===Number(d.zoneId);});
        return {icone:'⚔️',texte:connue&&d.zoneNom?nom+verbe(' farmes',' farme')+' dans '+d.zoneNom:nom+verbe(' farmes',' farme')+' en Aventure'};
      }
      default:return null;
    }
  }

  function ilya(at){
    const s=Math.max(0,Math.round((Date.now()-at)/1000));
    if(s<60)return 'à l’instant';
    const m=Math.round(s/60);
    if(m<60)return 'il y a '+m+' min';
    return 'il y a '+Math.round(m/60)+' h';
  }

  function visibles(){
    const ctx=contexte();
    const sortie=[];
    items.forEach(function(it){
      const p=phrase(it,ctx);
      if(p)sortie.push({id:it.id,at:it.at,icone:p.icone,texte:p.texte,moi:it.moi});
    });
    return sortie;
  }

  /* ---------- bandeau ---------- */
  function css(){
    if(document.getElementById('sorealIdleFluxStyleV1'))return;
    const st=document.createElement('style');
    st.id='sorealIdleFluxStyleV1';
    st.textContent=
      '#sorealIdleFluxV1{position:fixed;left:0;right:0;bottom:0;z-index:40;height:34px;display:flex;align-items:center;overflow:hidden;'+
        'padding-bottom:env(safe-area-inset-bottom,0);box-sizing:content-box;'+
        'background:linear-gradient(180deg,var(--th-bg,#16233a),var(--th-bg2,#0b1220));border-top:1px solid var(--th-line,rgba(94,234,212,.4));'+
        'box-shadow:0 -6px 18px -10px var(--th-glow,rgba(94,234,212,.5));color:var(--th-ink,#e8fffb);font:700 13px/1 inherit;-webkit-user-select:none;user-select:none}'+
      '#sorealIdleFluxV1[hidden]{display:none}'+
      '#sorealIdleFluxV1 .sif-tag{flex:0 0 auto;z-index:2;padding:0 12px;height:100%;display:flex;align-items:center;gap:6px;font-weight:900;letter-spacing:.06em;font-size:12px;'+
        'background:linear-gradient(90deg,var(--th-a,#5eead4),var(--th-b,#25b9a4));color:#06201c;clip-path:polygon(0 0,100% 0,calc(100% - 10px) 100%,0 100%);padding-right:20px}'+
      '#sorealIdleFluxV1 .sif-vue{flex:1;min-width:0;overflow:hidden;height:100%;display:flex;align-items:center;'+
        '-webkit-mask-image:linear-gradient(90deg,transparent,#000 24px,#000 calc(100% - 24px),transparent);mask-image:linear-gradient(90deg,transparent,#000 24px,#000 calc(100% - 24px),transparent)}'+
      '#sorealIdleFluxV1 .sif-piste{display:flex;align-items:center;white-space:nowrap;will-change:transform}'+
      '#sorealIdleFluxV1 .sif-it{display:inline-flex;align-items:center;gap:6px;padding:0 18px;border-right:1px solid var(--th-line,rgba(255,255,255,.14))}'+
      '#sorealIdleFluxV1 .sif-it.moi{color:var(--th-num,#fff)}'+
      '#sorealIdleFluxV1 .sif-it .ic{font-size:15px}'+
      '#sorealIdleFluxV1 .sif-vide{padding:0 14px;color:var(--th-dim,#9fb3c8);font-weight:600}'+
      '#sorealIdleFluxV1 .sif-x{flex:0 0 auto;z-index:2;width:34px;height:100%;border:0;background:transparent;color:var(--th-dim,#9fb3c8);font-size:15px;cursor:pointer}'+
      '#sorealIdleFluxV1 .sif-x:hover{color:var(--th-ink,#fff)}'+
      '#sorealIdleFluxRouvrirV1{position:fixed;left:8px;bottom:calc(8px + env(safe-area-inset-bottom,0));z-index:40;width:38px;height:38px;border-radius:999px;border:1px solid var(--th-line,rgba(94,234,212,.5));'+
        'background:linear-gradient(180deg,var(--th-bg,#16233a),var(--th-bg2,#0b1220));color:var(--th-ink,#fff);font-size:17px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.4)}'+
      '#sorealIdleFluxRouvrirV1[hidden]{display:none}'+
      'body.soreal-idle-flux-actif-v1 .soreal-idle-native-v4{padding-bottom:44px}'+
      '@media (prefers-reduced-motion:reduce){#sorealIdleFluxV1 .sif-piste{transform:none!important}}'+
      /* Panneau dans la page Chat */
      '.sif-panneau{margin:0 0 10px;border:1px solid var(--th-line,rgba(255,255,255,.18));border-radius:16px;background:rgba(0,0,0,.22);overflow:hidden}'+
      '.sif-panneau .sif-ph{padding:8px 12px;font-size:13px;font-weight:900;letter-spacing:.04em;border-bottom:1px solid var(--th-line,rgba(255,255,255,.12))}'+
      '.sif-panneau .sif-pl{max-height:150px;overflow-y:auto;padding:6px 12px;display:grid;gap:5px}'+
      '.sif-panneau .sif-pi{display:flex;gap:8px;align-items:baseline;font-size:13px}'+
      '.sif-panneau .sif-pi small{margin-left:auto;flex:0 0 auto;color:var(--th-dim,#8b93ab);font-size:11px}'+
      '.sif-panneau .sif-vide{padding:10px 12px;color:var(--th-dim,#8b93ab);font-size:12px}';
    document.head.appendChild(st);
  }

  function construire(){
    if(bandeau&&document.body.contains(bandeau))return;
    css();
    bandeau=document.createElement('div');
    bandeau.id='sorealIdleFluxV1';
    bandeau.setAttribute('role','marquee');
    bandeau.setAttribute('aria-label','Activité des joueurs');
    bandeau.innerHTML='<div class="sif-tag">📰 EN DIRECT</div><div class="sif-vue"><div class="sif-piste"></div></div><button type="button" class="sif-x" aria-label="Masquer le fil d’actualité" title="Masquer">✕</button>';
    piste=bandeau.querySelector('.sif-piste');
    bandeau.querySelector('.sif-x').addEventListener('click',function(){definirReplie(true);});
    ['mouseenter','touchstart','pointerdown'].forEach(function(t){bandeau.addEventListener(t,function(){enPause=true;},{passive:true});});
    ['mouseleave','touchend','touchcancel','pointerup'].forEach(function(t){bandeau.addEventListener(t,function(){enPause=false;},{passive:true});});
    document.body.appendChild(bandeau);
    const r=document.createElement('button');
    r.type='button';r.id='sorealIdleFluxRouvrirV1';r.hidden=true;r.title='Afficher le fil d’actualité';r.setAttribute('aria-label','Afficher le fil d’actualité');r.textContent='📰';
    r.addEventListener('click',function(){definirReplie(false);});
    document.body.appendChild(r);
    majAffichage();
  }

  function definirReplie(v){
    replie=Boolean(v);
    try{localStorage.setItem(CLE_REPLI,replie?'1':'0');}catch(e){}
    majAffichage();
  }

  function majAffichage(){
    if(!bandeau)return;
    const r=document.getElementById('sorealIdleFluxRouvrirV1');
    bandeau.hidden=replie;
    if(r)r.hidden=!replie;
    document.body.classList.toggle('soreal-idle-flux-actif-v1',!replie);
  }

  function htmlItem(p){
    return '<span class="sif-it'+(p.moi?' moi':'')+'"><span class="ic">'+p.icone+'</span><span>'+echapper(p.texte)+'</span></span>';
  }

  function rendreBandeau(){
    if(!piste)return;
    const liste=visibles().slice(-MAX_BANDEAU);
    if(!liste.length){
      piste.innerHTML='<span class="sif-vide">Les exploits des autres joueurs s’afficheront ici…</span>';
      piste.style.transform='translateX(0)';
      largeurPiste=0;
      return;
    }
    const un=liste.map(htmlItem).join('');
    /* Contenu répété pour un défilement sans coupure : on recule d'une largeur de copie complète. */
    piste.innerHTML='<span class="sif-copie" style="display:inline-flex">'+un+'</span><span class="sif-copie" style="display:inline-flex" aria-hidden="true">'+un+'</span>';
    const copie=piste.querySelector('.sif-copie');
    largeurPiste=copie?copie.getBoundingClientRect().width:0;
    const vue=bandeau.querySelector('.sif-vue');
    /* Si tout tient dans la vue, rien ne défile ; sinon la copie assure la continuité. */
    if(largeurPiste&&vue&&largeurPiste<=vue.clientWidth){
      piste.innerHTML=un;largeurPiste=0;piste.style.transform='translateX(0)';
    }
    x=0;
  }

  function boucle(t){
    raf=requestAnimationFrame(boucle);
    if(!tPrec)tPrec=t;
    const dt=Math.min(0.1,(t-tPrec)/1000);
    tPrec=t;
    if(!piste||replie||enPause||!largeurPiste||document.visibilityState!=='visible')return;
    x-=PX_PAR_SEC*dt;
    if(-x>=largeurPiste)x+=largeurPiste;
    piste.style.transform='translateX('+x.toFixed(1)+'px)';
  }

  /* ---------- données ---------- */
  function recevoir(liste){
    /* Le bandeau n'apparaît qu'une fois connecté : dès la première réponse du serveur (même sans nouvelle). */
    if(!bandeau){construire();rendreBandeau();}
    if(!raf)raf=requestAnimationFrame(boucle);
    const nouveaux=(Array.isArray(liste)?liste:[]).map(function(it){
      return {id:Number(it&&it.id)||0,at:Number(it&&it.at)||0,nom:String(it&&it.nom||'Joueur'),type:String(it&&it.type||''),donnees:(it&&it.donnees)||{},moi:Boolean(it&&it.moi)};
    }).filter(function(it){return it.id>0;});
    if(!nouveaux.length)return false;
    const connus=new Set(items.map(function(it){return it.id;}));
    let ajoute=false;
    nouveaux.forEach(function(it){if(!connus.has(it.id)){items.push(it);ajoute=true;}});
    if(!ajoute)return false;
    items.sort(function(a,b){return a.id-b.id;});
    if(items.length>MAX_ITEMS)items=items.slice(items.length-MAX_ITEMS);
    dernier=items[items.length-1].id;
    construire();
    rendreBandeau();
    majPanneaux();
    return true;
  }

  /* ---------- panneau dans la page Chat ---------- */
  function htmlPanneau(){
    const liste=visibles().slice(-12).reverse();
    return '<div class="sif-panneau"><div class="sif-ph">📰 Activité des joueurs</div>'+
      (liste.length
        ?'<div class="sif-pl">'+liste.map(function(p){return '<div class="sif-pi"><span>'+p.icone+'</span><span>'+echapper(p.texte)+'</span><small>'+ilya(p.at)+'</small></div>';}).join('')+'</div>'
        :'<div class="sif-vide">Rien pour le moment : les exploits des autres joueurs apparaîtront ici.</div>')+
      '</div>';
  }
  function majPanneaux(){
    document.querySelectorAll('[data-flux-panneau-v1]').forEach(function(n){n.innerHTML=htmlPanneau();});
  }

  window.__SOREAL_IDLE_FLUX_V1__={
    recevoir:recevoir,
    dernier:function(){return dernier;},
    phrase:phrase,
    htmlPanneau:htmlPanneau,
    majPanneaux:majPanneaux,
    construire:construire,
    items:function(){return items.slice();}
  };

})();
