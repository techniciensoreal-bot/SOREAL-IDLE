/*
 * Fil d'actualité de SOREAL IDLE (Norman, 2026-10-01) : « voir ce que les gens font dans leur jeu (Mickaël vient de tuer <boss>, Sébastien a
 * débloqué <trophée>, Sylvain farme dans les égouts, Maxence a terrassé <titan>…), visible dans tous les menus, comme une écriture qui défile. »
 *
 * Les événements viennent du serveur (src/idle-flux-v1.js) par la réponse du battement du chat (toutes les ~20 s) : aucun appel de plus.
 * Un bandeau fixe en bas de l'écran, hors du rendu du jeu (donc présent dans tous les menus et jamais effacé par un re-rendu), fait défiler
 * les nouveautés ; chaque information n'est jouée qu'une fois (un seul passage), le bandeau apparaît et disparaît en fondu ; toucher/survoler met en pause.
 *
 * Anti-spoil (AGENTS.md règle n°2) : chaque phrase est construite CÔTÉ LECTEUR avec ce que le lecteur a déjà découvert
 * (window.__SOREAL_IDLE_ACTIVITE_V1__().connus) : un boss, un titan ou un trophée qu'il ne connaît pas devient « un boss », « un Titan »,
 * « un trophée » ; un Rebirth ou un Challenge n'est jamais mentionné tant que le lecteur n'a pas débloqué ces menus.
 */
(function(){
  'use strict';

  const MAX_ITEMS=30;
  const PX_PAR_SEC=46;
  /*
   * « En direct » (Norman, 2026-10-02 : « aucun message de rattrapage ») : le bandeau ne montre que ce qui vient de se passer. Une information de plus de
   * 90 s (arrivée après une absence, onglet resté en arrière-plan…) n'est jamais jouée, ni dans le bandeau ni dans le panneau du Chat.
   */
  const FRAICHEUR_MS=90000;

  let items=[];
  let chats=[];
  let file=[];
  const vus=new Set();
  let amorceFlux=false;
  let amorceChat=false;
  let phase='repos';
  let largeurVue=300;
  let dernier=0;
  let bandeau=null;
  let piste=null;
  let x=0;
  let enPause=false;
  let tPrec=0;
  let raf=0;

  function echapper(v){
    return String(v==null?'':v).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  /* Durée d'un run : « 8 h », « 8 h 12 min », « 45 min », « 3 j 4 h » (jamais de secondes au-delà d'une minute, arrondi à la minute inférieure). */
  function dureeRunTexte(secondes){
    let m=Math.floor((Number(secondes)||0)/60);
    if(!(m>0))return (Number(secondes)||0)>0?'moins d’une minute':'';
    const j=Math.floor(m/1440);m-=j*1440;
    const h=Math.floor(m/60);m-=h*60;
    const parts=[];
    if(j)parts.push(j+' j');
    if(h)parts.push(h+' h');
    if(m&&!j)parts.push(m+' min');
    return parts.join(' ');
  }

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
      /* « X vient de se connecter » : les connexions des AUTRES joueurs (la tienne, tu la connais). */
      case 'connexion':
        if(it.moi)return null;
        return {icone:'👋',texte:nom+' vient de se connecter'};
      case 'defiLance':
        if(!k.menus.challenges)return null;
        return {icone:'🏁',texte:nom+verbe(' as',' a')+' lancé un Challenge'};
      case 'set':{
        /* Le nom d'un set n'est donné que si le lecteur l'a lui-même complété (anti-spoil) ; sinon un set d'équipement, sans nom. */
        const nomSet=(k.sets||{})[String(d.id)];
        return {icone:'🛡️',texte:nomSet?nom+verbe(' as',' a')+' complété le set '+nomSet:nom+verbe(' as',' a')+' complété un set d’équipement'};
      }
      /* Achat en boutique (Norman, 2026-10-03 : « on voit l'achat des autres joueurs, oublie le sans spoil ») : annoncé à tous, avec l'article acheté. */
      case 'achat':{
        const ap=d.boutique==='sellout';
        const noms=(c.achatsNoms&&c.achatsNoms[ap?'sellout':'exp'])||{};
        const article=String(noms[d.id]||d.nom||'').trim();
        const fois=Number(d.n)>1?' ×'+Number(d.n):'';
        return {icone:'🛒',texte:article
          ?nom+verbe(' as',' a')+' acheté '+article+fois+' dans la '+(ap?'Boutique AP':'boutique EXP')
          :nom+verbe(' as',' a')+' fait un achat dans la '+(ap?'Boutique AP':'boutique EXP')};
      }
      /* Récompense de connexion (Norman, 2026-10-03) : annoncée aux joueurs qui connaissent déjà ce menu (comme les Titans ou les Challenges). */
      case 'calendrier':{
        if(!k.menus.moneyPit)return null;
        const ap=Number(d.ap)>0?' (+'+Math.round(Number(d.ap)).toLocaleString('fr-FR')+' AP)':'';
        const jour=Number(d.jour)>0?' du jour '+Math.floor(Number(d.jour)):'';
        return {icone:'📅',texte:nom+verbe(' as',' a')+' récupéré '+verbe('ta','sa')+' récompense de connexion'+jour+ap};
      }
      case 'rebirth':
        if(!k.menus.renaissance)return null;
        const dureeRun=dureeRunTexte(d.duree);
        return {icone:'♻️',texte:nom+verbe(' as',' a')+' fait un Rebirth'+(dureeRun?' après '+dureeRun+' de run':'')};
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

  /* Messages du chat : publics, donc sans filtre de découverte ; passent EN ENTIER (Norman, 2026-10-03 : « quand un message est trop long, il est coupé dans En Direct ») : le bandeau défile en continu, la longueur n'est pas un problème (280 caractères au plus côté chat). */
  function texteChat(m){
    return String(m||'').replace(/\s+/g,' ').trim();
  }

  function visibles(){
    const ctx=contexte();
    const sortie=[];
    items.forEach(function(it){
      const p=phrase(it,ctx);
      if(p)sortie.push({id:it.id,at:it.at,icone:p.icone,texte:p.texte,moi:it.moi,recu:it.recu});
    });
    chats.forEach(function(m){
      if(m.message)sortie.push({id:'c'+m.id,at:m.at,icone:'💬',texte:(m.moi?'Toi':m.nom)+' : '+texteChat(m.message),moi:m.moi,chat:true,recu:m.recu});
    });
    sortie.sort(function(a,b){return a.at-b.at;});
    return sortie;
  }

  /* ---------- bandeau ---------- */
  function css(){
    if(document.getElementById('sorealIdleFluxStyleV1'))return;
    const st=document.createElement('style');
    st.id='sorealIdleFluxStyleV1';
    st.textContent=
      '#sorealIdleFluxV1{position:fixed;left:0;right:0;bottom:0;z-index:55;height:34px;display:flex;align-items:center;overflow:hidden;'+
        'padding-bottom:env(safe-area-inset-bottom,0);box-sizing:content-box;'+
        'background:linear-gradient(180deg,var(--th-bg,#16233a),var(--th-bg2,#0b1220));border-top:1px solid var(--th-line,rgba(94,234,212,.4));'+
        'box-shadow:0 -6px 18px -10px var(--th-glow,rgba(94,234,212,.5));color:var(--th-ink,#e8fffb);font:700 13px/1 inherit;-webkit-user-select:none;user-select:none;'+
        'opacity:1;transition:opacity .6s ease,visibility 0s linear 0s}'+
      '#sorealIdleFluxV1.sif-off{opacity:0;visibility:hidden;pointer-events:none;transition:opacity .6s ease,visibility 0s linear .6s}'+
      '#sorealIdleFluxV1[hidden]{display:none}'+
      '#sorealIdleFluxV1 .sif-tag{flex:0 0 auto;z-index:2;padding:0 12px;height:100%;display:flex;align-items:center;gap:6px;font-weight:900;letter-spacing:.06em;font-size:14px;'+
        'background:linear-gradient(90deg,var(--th-a,#5eead4),var(--th-b,#25b9a4));color:#06201c;clip-path:polygon(0 0,100% 0,calc(100% - 10px) 100%,0 100%);padding-right:20px}'+
      '#sorealIdleFluxV1 .sif-vue{flex:1;min-width:0;overflow:hidden;height:100%;display:flex;align-items:center;'+
        '-webkit-mask-image:linear-gradient(90deg,transparent,#000 24px,#000 calc(100% - 24px),transparent);mask-image:linear-gradient(90deg,transparent,#000 24px,#000 calc(100% - 24px),transparent)}'+
      '#sorealIdleFluxV1 .sif-piste{display:flex;align-items:center;white-space:nowrap;will-change:transform}'+
      '#sorealIdleFluxV1 .sif-it{display:inline-flex;align-items:center;gap:6px;padding:0 18px;border-right:1px solid var(--th-line,rgba(255,255,255,.14))}'+
      '#sorealIdleFluxV1 .sif-it.moi{color:var(--th-num,#fff)}'+
      '#sorealIdleFluxV1 .sif-it .ic{font-size:15px}'+
      'body.soreal-idle-flux-actif-v1 .soreal-idle-native-v4{padding-bottom:44px}'+
      /* Panneau dans la page Chat */
      '.sif-panneau{margin:0 0 10px;border:1px solid var(--th-line,rgba(255,255,255,.18));border-radius:16px;background:rgba(0,0,0,.22);overflow:hidden}'+
      '.sif-panneau .sif-ph{padding:8px 12px;font-size:15px;font-weight:900;letter-spacing:.04em;border-bottom:1px solid var(--th-line,rgba(255,255,255,.12))}'+
      '.sif-panneau .sif-pl{max-height:150px;overflow-y:auto;padding:6px 12px;display:grid;gap:5px}'+
      '.sif-panneau .sif-pi{display:flex;gap:8px;align-items:baseline;font-size:15px}'+
      '.sif-panneau .sif-pi small{margin-left:auto;flex:0 0 auto;color:var(--th-dim,#8b93ab);font-size:13px}'+
      '.sif-panneau .sif-vide{padding:10px 12px;color:var(--th-dim,#8b93ab);font-size:14px}';
    document.head.appendChild(st);
  }

  function construire(){
    if(bandeau&&document.body.contains(bandeau))return;
    css();
    bandeau=document.createElement('div');
    bandeau.id='sorealIdleFluxV1';
    bandeau.className='sif-off';
    bandeau.setAttribute('role','marquee');
    bandeau.setAttribute('aria-label','Activité des joueurs');
    bandeau.innerHTML='<div class="sif-tag">📰 EN DIRECT</div><div class="sif-vue"><div class="sif-piste"></div></div>';
    piste=bandeau.querySelector('.sif-piste');
    ['mouseenter','touchstart','pointerdown'].forEach(function(t){bandeau.addEventListener(t,function(){enPause=true;},{passive:true});});
    ['mouseleave','touchend','touchcancel','pointerup'].forEach(function(t){bandeau.addEventListener(t,function(){enPause=false;},{passive:true});});
    document.body.appendChild(bandeau);
  }

  function htmlItem(p){
    return '<span class="sif-it'+(p.moi?' moi':'')+'"><span class="ic">'+p.icone+'</span><span>'+echapper(p.texte)+'</span></span>';
  }

  /*
   * Lecture du bandeau (Norman, 2026-10-02 : « les informations ne doivent passer qu'une seule fois et au moment où elles arrivent uniquement ») :
   * défilement CONTINU. Chaque information est ajoutée au bout de la piste à l'instant où elle arrive (elle entre par la droite, même si une autre est
   * encore en train de défiler : plus d'attente de la fin d'un lot), traverse l'écran UNE seule fois, puis est retirée. Le bandeau apparaît à la première
   * information et disparaît (fondu) quand la piste est vide. Une même phrase déjà passée il y a moins de 2 minutes n'est pas rejouée.
   */
  let derniereImage=0;
  let derniereVue=new Map();
  const DOUBLON_MS=120000;

  function ajouterAuBandeau(e){
    const p=e&&e.texte;
    if(!p)return;
    const maintenant=performance.now();
    const vuLe=derniereVue.get(e.texte);
    if(vuLe!==undefined&&maintenant-vuLe<DOUBLON_MS)return;
    derniereVue.set(e.texte,maintenant);
    if(derniereVue.size>60){derniereVue.forEach(function(t,k){if(maintenant-t>=DOUBLON_MS)derniereVue.delete(k);});}
    largeurVue=bandeau.querySelector('.sif-vue').clientWidth||largeurVue||300;
    const modele=document.createElement('div');
    modele.innerHTML=htmlItem(e);
    const noeud=modele.firstChild;
    if(!piste.firstChild){
      x=largeurVue;
    }else{
      /* La piste a déjà fini de défiler vers la gauche : un blanc la prolonge pour que la nouvelle information entre bien par la droite, au moment où elle arrive. */
      const finPiste=x+piste.scrollWidth;
      if(finPiste<largeurVue){
        const blanc=document.createElement('span');
        blanc.className='sif-blanc';
        blanc.style.cssText='display:inline-block;flex:none;width:'+Math.ceil(largeurVue-finPiste)+'px';
        piste.appendChild(blanc);
      }
    }
    piste.appendChild(noeud);
    piste.style.transform='translateX('+x.toFixed(1)+'px)';
    bandeau.classList.remove('sif-off');
    document.body.classList.add('soreal-idle-flux-actif-v1');
    phase='defile';
  }

  function viderBandeau(){
    if(piste)piste.innerHTML='';
    if(bandeau)bandeau.classList.add('sif-off');
    document.body.classList.remove('soreal-idle-flux-actif-v1');
    phase='repos';
  }

  function boucle(t){
    raf=requestAnimationFrame(boucle);
    if(!tPrec)tPrec=t;
    const dt=Math.min(0.1,(t-tPrec)/1000);
    tPrec=t;
    if(!bandeau)return;
    const now=performance.now();
    if(document.visibilityState!=='visible'){derniereImage=0;return;}
    /* Retour après une absence (onglet en arrière-plan) : ce qui défilait n'est plus « en direct », la piste repart de zéro. */
    if(derniereImage&&now-derniereImage>5000&&piste.firstChild)viderBandeau();
    derniereImage=now;
    /* Ce qui vient d'arriver passe tout de suite (jamais attendre) ; ce qui a trop attendu (onglet masqué) est écarté. */
    while(file.length){
      const e=file.shift();
      if(e.recu>0&&now-e.recu>FRAICHEUR_MS)continue;
      ajouterAuBandeau(e);
    }
    if(!piste.firstChild||enPause)return;
    x-=PX_PAR_SEC*dt;
    /* Une information entièrement sortie à gauche est retirée : elle n'est jamais rejouée. */
    while(piste.firstChild){
      const premier=piste.firstChild;
      const w=premier.getBoundingClientRect().width;
      if(x+w>0)break;
      piste.removeChild(premier);
      x+=w;
    }
    if(!piste.firstChild)return viderBandeau();
    piste.style.transform='translateX('+x.toFixed(1)+'px)';
  }

  /* Met en file ce qui n'a jamais été joué. Au tout premier passage de chaque source (chargement), on mémorise sans rejouer l'historique. */
  function enfiler(){
    visibles().forEach(function(e){
      if(vus.has(e.id))return;
      vus.add(e.id);
      if(e.chat?amorceChat:amorceFlux)file.push(e);
    });
  }

  /* ---------- données ---------- */
  function recevoir(liste,heureServeur){
    /* Le bandeau n'existe qu'une fois connecté : dès la première réponse du serveur (même sans nouvelle). */
    if(!bandeau)construire();
    if(!raf)raf=requestAnimationFrame(boucle);
    const maintenant=Number(heureServeur)>0?Number(heureServeur):Date.now();
    const nouveaux=(Array.isArray(liste)?liste:[]).map(function(it){
      return {id:Number(it&&it.id)||0,at:Number(it&&it.at)||0,nom:String(it&&it.nom||'Joueur'),type:String(it&&it.type||''),donnees:(it&&it.donnees)||{},moi:Boolean(it&&it.moi),recu:performance.now()};
    }).filter(function(it){
      if(it.id<=0)return false;
      /* Trop ancien : on avance simplement le repère pour ne plus le redemander, sans le montrer. */
      if(it.at>0&&maintenant-it.at>FRAICHEUR_MS){if(it.id>dernier)dernier=it.id;return false;}
      return true;
    });
    const connus=new Set(items.map(function(it){return it.id;}));
    let ajoute=false;
    nouveaux.forEach(function(it){if(!connus.has(it.id)){items.push(it);ajoute=true;}});
    if(ajoute){
      /* Petit bruit quand quelqu'un d'autre se connecte (jamais pour soi, une seule fois par lot). */
      if(nouveaux.some(function(it){return it.type==='connexion'&&!it.moi&&!connus.has(it.id);})){
        try{const audio=window.__SOREAL_IDLE_AUDIO_V199__;if(audio&&typeof audio.joueurConnecte==='function')audio.joueurConnecte();}catch(e){}
      }
      items.sort(function(a,b){return a.id-b.id;});
      if(items.length>MAX_ITEMS)items=items.slice(items.length-MAX_ITEMS);
      dernier=items[items.length-1].id;
      enfiler();
      majPanneaux();
    }
    amorceFlux=true;
    return ajoute;
  }

  /* Nouveaux messages du chat (modules/chat-v1.js) : le premier lot reçu au chargement n'est pas rejoué dans le bandeau. */
  function recevoirChat(liste,initial,heureServeur){
    if(!bandeau)construire();
    if(!raf)raf=requestAnimationFrame(boucle);
    const maintenant=Number(heureServeur)>0?Number(heureServeur):Date.now();
    const connus=new Set(chats.map(function(m){return m.id;}));
    let ajoute=false;
    (Array.isArray(liste)?liste:[]).forEach(function(m){
      if(!m||!m.id||connus.has(m.id))return;
      /* Premier lot (historique du chat) ou message devenu trop ancien : jamais montré dans le bandeau ; marqué « déjà vu » pour ne pas être redemandé. */
      if(initial||(Number(m.at)>0&&maintenant-Number(m.at)>FRAICHEUR_MS)){vus.add('c'+m.id);return;}
      chats.push({id:m.id,at:Number(m.at)||Date.now(),nom:String(m.nom||'Joueur'),message:String(m.message||''),moi:Boolean(m.moi),recu:performance.now()});
      ajoute=true;
    });
    if(ajoute){
      chats.sort(function(a,b){return a.id-b.id;});
      if(chats.length>MAX_ITEMS)chats=chats.slice(chats.length-MAX_ITEMS);
      enfiler();
      majPanneaux();
    }
    if(initial)amorceChat=true;
    return ajoute;
  }

  /* ---------- panneau dans la page Chat ---------- */
  function htmlPanneau(){
    const liste=visibles().slice(-12).reverse();
    return '<div class="sif-panneau"><div class="sif-ph">📰 Activité des joueurs</div>'+
      (liste.length
        ?'<div class="sif-pl">'+liste.map(function(p){return '<div class="sif-pi"><span>'+p.icone+'</span><span>'+echapper(p.texte)+'</span><small>'+ilya(p.at)+'</small></div>';}).join('')+'</div>'
        :'<div class="sif-vide">Rien pour le moment : ce que font les autres joueurs apparaîtra ici, en direct.</div>')+
      '</div>';
  }
  function majPanneaux(){
    document.querySelectorAll('[data-flux-panneau-v1]').forEach(function(n){n.innerHTML=htmlPanneau();});
  }

  window.__SOREAL_IDLE_FLUX_V1__={
    recevoir:recevoir,
    recevoirChat:recevoirChat,
    dernier:function(){return dernier;},
    /* Repère du premier battement : tout ce qui date d'avant l'arrivée du joueur est ignoré. */
    amorcer:function(id){id=Number(id)||0;if(id>dernier)dernier=id;amorceFlux=true;},
    amorce:function(){return amorceFlux;},
    phrase:phrase,
    htmlPanneau:htmlPanneau,
    majPanneaux:majPanneaux,
    construire:construire,
    visibles:visibles,
    enAttente:function(){return file.length;},
    items:function(){return items.slice();}
  };

})();
