/*
 * Chat et joueurs en ligne de SOREAL IDLE (Norman, 2026-09-30) : « supprimer le chat tel qu'il est. Un chat uniquement réservé aux gens
 * qui jouent au jeu, accessible via le jeu, pour voir qui est en ligne SUR SOREAL IDLE (APP et TV ne doivent pas nous signaler en
 * ligne), avec des infos en plus du genre "Farm dans <zone d'Aventure>". »
 *
 * Remplace l'ancien chat, qui relayait le salon « général » de APP/TV par la page parente (postMessage) : plus aucun lien avec APP/TV.
 * Tout passe par le serveur de SOREAL IDLE (idle-chat-v1.js) : un joueur est « en ligne » tant que SON JEU envoie un battement
 * (toutes les ~20 s) ; ouvrir APP ou TV n'y change rien. Le même battement sert au temps de jeu ACTIF du classement : il dit si le
 * joueur a réellement interagi (clic, tap, clavier) avec la page visible dans les 2 dernières minutes.
 *
 * Anti-spoil (AGENTS.md règle n°2) : le nom d'une zone d'Aventure ou le numéro d'un boss combattu par UN AUTRE joueur n'est montré que
 * si TU les as déjà découverts ; sinon « Farm en Aventure » / « Combat un boss ».
 *
 * Le chat est une PAGE du menu (2026-10-01) : construit une fois puis re-monté après chaque rendu (voir pageHtml / apresRendu), pour que le rendu
 * complet du jeu n'efface ni la saisie ni la position de lecture.
 */
(function(){
  'use strict';

  const CLE_VU='soreal_idle_chat_vu_v2';
  const BATTEMENT_MS=20000;
  const INTERVALLE_OUVERT_MS=4000;
  const FENETRE_ACTIVITE_MS=120000;
  const MAX_MESSAGES=200;

  let dispo=false;
  let items=[];
  let dernierId=0;
  let vuId=0;
  let nonLus=0;
  let ouvert=false;
  let panneauPresence=false;
  let enLigne=[];
  let estAdmin=false;
  let envoiEnCours=false;
  let timerBattement=null;
  let timerListe=null;
  let derniereInteraction=0;

  function echapper(v){
    return String(v==null?'':v).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function lireVu(){
    try{return Math.max(0,Number(localStorage.getItem(CLE_VU))||0);}catch(e){return 0;}
  }
  function ecrireVu(n){
    try{localStorage.setItem(CLE_VU,String(n));}catch(e){}
  }

  /* ---------- appels au serveur du jeu ---------- */
  function appel(nom,args){
    const f=window.__SOREAL_IDLE_CALL_V1__;
    if(typeof f!=='function')return Promise.reject(new Error('Connexion au jeu indisponible.'));
    return Promise.resolve(f(nom,args||[]));
  }

  /* ---------- activité du joueur (temps de jeu actif + « Farm dans… ») ---------- */
  ['pointerdown','keydown','touchstart','wheel'].forEach(function(type){
    document.addEventListener(type,function(){derniereInteraction=Date.now();},{capture:true,passive:true});
  });

  function estActif(){
    return document.visibilityState==='visible'&&derniereInteraction>0&&(Date.now()-derniereInteraction)<=FENETRE_ACTIVITE_MS;
  }

  function contexteJeu(){
    try{
      const f=window.__SOREAL_IDLE_ACTIVITE_V1__;
      return typeof f==='function'?f():null;
    }catch(e){return null;}
  }

  /* Ce que fait le joueur, dans le format attendu par le serveur (normaliserActiviteV1). */
  function activiteActuelle(){
    const c=contexteJeu();
    if(!c)return {t:'libre'};
    if(c.farm&&c.farm.zoneId)return {t:'farm',zoneId:c.farm.zoneId,zoneNom:c.farm.zoneNom||''};
    if(c.boss>0)return {t:'boss',boss:c.boss};
    return {t:'libre'};
  }

  /* Texte montré aux autres, sans jamais révéler ce que le lecteur n'a pas encore découvert. */
  function texteActivite(u){
    if(!u.actif)return '💤 Inactif';
    const a=u.activite||{t:'libre'};
    const c=contexteJeu()||{zones:[],bossMax:0};
    if(a.t==='farm'){
      const connue=(c.zones||[]).some(function(z){return Number(z.id)===Number(a.zoneId);});
      return connue&&a.zoneNom?'⚔️ Farm dans '+a.zoneNom:'⚔️ Farm en Aventure';
    }
    if(a.t==='boss'){
      return a.boss>0&&a.boss<=Number(c.bossMax||0)+1?'👹 Combat le boss '+a.boss:'👹 Combat un boss';
    }
    return '🎮 En jeu';
  }

  function fluxDernier(){
    const f=window.__SOREAL_IDLE_FLUX_V1__;
    return f&&typeof f.dernier==='function'?f.dernier():0;
  }

  function battement(){
    return appel('battementSorealIdle',[{actif:estActif(),activite:activiteActuelle(),apresFlux:fluxDernier()}]).then(function(res){
      if(!res||res.ok===false)return;
      if(window.__SOREAL_IDLE_FLUX_V1__)window.__SOREAL_IDLE_FLUX_V1__.recevoir(res.flux);
      enLigne=Array.isArray(res.enLigne)?res.enLigne:[];
      estAdmin=Boolean(res.estAdmin);
      rendrePresence();
      if(Number(res.dernierChatId)>dernierId)chargerRecents().catch(function(){});
    }).catch(function(){});
  }

  /* ---------- messages ---------- */
  function normaliserItems(liste){
    return (Array.isArray(liste)?liste:[]).map(function(it){
      return {
        id:Number(it&&it.id)||0,
        nom:String(it&&it.nom||''),
        at:Number(it&&it.at)||0,
        admin:Boolean(it&&it.admin),
        moi:Boolean(it&&it.moi),
        message:String(it&&it.message||'')
      };
    }).filter(function(it){return it.id>0;});
  }

  function heure(at){
    if(!at)return '';
    const d=new Date(at);
    const hm=('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
    return d.toDateString()===new Date().toDateString()?hm:d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})+' '+hm;
  }

  function recalculerNonLus(){
    nonLus=items.filter(function(it){return it.id>vuId&&!it.moi;}).length;
    majBadge();
  }

  function ajouterItems(nouveaux){
    const connus=new Set(items.map(function(it){return it.id;}));
    let ajoute=false;
    nouveaux.forEach(function(it){
      if(!connus.has(it.id)){items.push(it);connus.add(it.id);ajoute=true;}
    });
    if(!ajoute)return false;
    items.sort(function(a,b){return a.id-b.id;});
    if(items.length>MAX_MESSAGES)items=items.slice(items.length-MAX_MESSAGES);
    dernierId=items.length?items[items.length-1].id:dernierId;
    return true;
  }

  function chargerRecents(){
    return appel('lireChatSorealIdle',[dernierId?{apresId:dernierId,limite:100}:{limite:40}]).then(function(data){
      const recus=normaliserItems(data&&data.items);
      const premier=!dernierId;
      const change=ajouterItems(recus);
      if(window.__SOREAL_IDLE_FLUX_V1__)window.__SOREAL_IDLE_FLUX_V1__.recevoirChat(recus,premier);
      if(change){
        if(ouvert){
          vuId=dernierId;ecrireVu(vuId);
          rendreMessages(true);
        }
        recalculerNonLus();
      }
      return change;
    });
  }

  /* ---------- badge dans le menu ---------- */
  function badgeHtml(){
    return nonLus>0?'<span class="soreal-idle-chat-badge-v1">'+(nonLus>99?'99+':nonLus)+'</span>':'';
  }
  function majBadge(){
    const b=document.querySelector('[data-menu-id-v1="chat"]');
    if(!b)return;
    const ancien=b.querySelector('.soreal-idle-chat-badge-v1');
    if(ancien)ancien.remove();
    if(nonLus>0)b.insertAdjacentHTML('beforeend',badgeHtml());
  }

  /* ---------- panneau ---------- */
  function css(){
    if(document.getElementById('sorealIdleChatStyleV1'))return;
    const st=document.createElement('style');
    st.id='sorealIdleChatStyleV1';
    /* Norman (2026-10-01) : le chat n'est plus une fenêtre volante mais une page du menu (couleurs du thème « chat », --th-*). */
    st.textContent=
      '.soreal-idle-chat-badge-v1{display:inline-block;margin-left:5px;min-width:18px;padding:1px 5px;border-radius:999px;background:#ef4444;color:#fff;font-size:13px;font-weight:900;line-height:1.3;text-align:center}'+
      '#sorealIdleChatV1{font-family:inherit;color:var(--th-ink,#e8fffb)}'+
      '#sorealIdleChatV1 .sic-fen{display:flex;flex-direction:column;height:min(76dvh,760px);min-height:380px;background:linear-gradient(165deg,var(--th-bg,#1d2a3a),var(--th-bg2,#0f1623));border:1px solid var(--th-line,rgba(94,234,212,.42));border-radius:22px;box-shadow:0 10px 30px -14px var(--th-glow,rgba(94,234,212,.4));overflow:hidden}'+
      '#sorealIdleChatV1 .sic-tete{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--th-line,rgba(255,255,255,.1));background:rgba(94,234,212,.08)}'+
      '#sorealIdleChatV1 .sic-titre{flex:1;font-size:15px;font-weight:900;letter-spacing:.04em}'+
      '#sorealIdleChatV1 button{cursor:pointer;font:inherit}'+
      '#sorealIdleChatV1 .sic-btn{min-height:36px;padding:0 14px;border-radius:999px;border:1px solid var(--th-line,rgba(94,234,212,.4));background:rgba(94,234,212,.12);color:var(--th-ink,#cfe6f7);font-size:15px;font-weight:800}'+
      '#sorealIdleChatV1 .sic-btn.actif{background:linear-gradient(180deg,#8ff7e6,#25b9a4);border-color:#8ff7e6;color:#04201b}'+
      '#sorealIdleChatV1 .sic-corps{position:relative;flex:1;min-height:0;display:flex;flex-direction:column}'+
      '#sorealIdleChatV1 .sic-liste{flex:1;min-height:0;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:9px;-webkit-overflow-scrolling:touch}'+
      '#sorealIdleChatV1 .sic-msg{max-width:84%;padding:8px 12px;border-radius:18px 18px 18px 4px;background:rgba(255,255,255,.08);align-self:flex-start;word-break:break-word}'+
      '#sorealIdleChatV1 .sic-msg.moi{align-self:flex-end;border-radius:18px 18px 4px 18px;background:linear-gradient(135deg,rgba(94,234,212,.28),rgba(244,114,182,.20))}'+
      '#sorealIdleChatV1 .sic-nom{font-size:14px;font-weight:900;margin-bottom:2px;color:#8ff7e6}'+
      '#sorealIdleChatV1 .sic-msg.moi .sic-nom{color:#ffc2e0}'+
      '#sorealIdleChatV1 .sic-heure{margin-left:6px;font-size:12px;font-weight:400;color:var(--th-dim,#8b93ab)}'+
      '#sorealIdleChatV1 .sic-suppr{margin-left:8px;border:0;background:transparent;color:#fca5a5;font-size:14px;padding:0}'+
      '#sorealIdleChatV1 .sic-txt{font-size:14px;line-height:1.4;white-space:pre-wrap}'+
      '#sorealIdleChatV1 .sic-vide{margin:auto;color:var(--th-dim,#8b93ab);font-size:15px;text-align:center}'+
      '#sorealIdleChatV1 .sic-saisie{display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--th-line,rgba(255,255,255,.1))}'+
      '#sorealIdleChatV1 textarea{flex:1;min-height:42px;max-height:110px;resize:none;padding:9px 14px;border-radius:20px;border:1px solid var(--th-line,rgba(255,255,255,.2));background:rgba(0,0,0,.35);color:#fff;font:inherit;font-size:14px}'+
      '#sorealIdleChatV1 .sic-envoyer{background:linear-gradient(180deg,#8ff7e6,#25b9a4);border:0;color:#04201b}'+
      '#sorealIdleChatV1 .sic-envoyer:disabled{opacity:.5}'+
      '#sorealIdleChatV1 .sic-presence{position:absolute;inset:0;overflow-y:auto;padding:10px 12px;background:linear-gradient(165deg,var(--th-bg,#1d2a3a),var(--th-bg2,#0f1623))}'+
      '#sorealIdleChatV1 .sic-ligne{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:14px}'+
      '#sorealIdleChatV1 .sic-point{width:10px;height:10px;border-radius:50%;background:#64748b;flex:none}'+
      '#sorealIdleChatV1 .sic-point.on{background:#22c55e;box-shadow:0 0 8px #22c55e}'+
      '#sorealIdleChatV1 .sic-point.away{background:#f59e0b}'+
      '#sorealIdleChatV1 .sic-activite{margin-left:auto;font-size:14px;color:var(--th-dim,#9fb0cf);text-align:right}'+
      '#sorealIdleChatV1 .sic-admin{margin-left:6px;padding:1px 6px;border-radius:6px;background:#7c3aed;color:#fff;font-size:12px;font-weight:900}'+
      '#sorealIdleChatV1 .sic-note{font-size:13px;color:var(--th-dim,#8b93ab);margin:0 0 8px}'+
      /* Grand écran : la liste des joueurs en ligne reste affichée à droite de la conversation. */
      '@media(min-width:900px){#sorealIdleChatV1 .sic-corps{flex-direction:row}#sorealIdleChatV1 .sic-liste{flex:1}#sorealIdleChatV1 .sic-presence{position:static;inset:auto;flex:0 0 280px;border-left:1px solid var(--th-line,rgba(255,255,255,.1))}#sorealIdleChatV1 .sic-presence[hidden]{display:block}#sorealIdleChatV1 .sic-btn-presence{display:none}}';
    document.head.appendChild(st);
  }

  function elListe(){return document.querySelector('#sorealIdleChatV1 .sic-liste');}

  function htmlMessage(it){
    return '<div class="sic-msg'+(it.moi?' moi':'')+'" data-id="'+it.id+'">'+
      '<div class="sic-nom">'+echapper(it.moi?'Moi':(it.nom||'?'))+(it.admin?'<span class="sic-admin">ADMIN</span>':'')+
        '<span class="sic-heure">'+echapper(heure(it.at))+'</span>'+
        (estAdmin?'<button type="button" class="sic-suppr" data-sic="suppr" data-id="'+it.id+'" aria-label="Supprimer ce message" title="Supprimer ce message">🗑</button>':'')+
      '</div>'+
      '<div class="sic-txt">'+echapper(it.message)+'</div>'+
    '</div>';
  }

  function rendreMessages(garderBas){
    const liste=elListe();
    if(!liste)return;
    const proche=liste.scrollHeight-liste.scrollTop-liste.clientHeight<80;
    liste.innerHTML=items.length?items.map(htmlMessage).join(''):'<div class="sic-vide">Aucun message pour l’instant. Dis bonjour ! 👋</div>';
    if(garderBas===true||proche)liste.scrollTop=liste.scrollHeight;
  }

  function rendrePresence(){
    const zone=document.querySelector('#sorealIdleChatV1 .sic-presence');
    const bouton=document.querySelector('#sorealIdleChatV1 .sic-btn-presence');
    if(bouton){
      bouton.classList.toggle('actif',panneauPresence);
      bouton.textContent='🟢 '+enLigne.length+' en ligne';
    }
    if(!zone)return;
    const grandEcran=window.matchMedia&&window.matchMedia('(min-width:900px)').matches;
    zone.hidden=!panneauPresence&&!grandEcran;
    if(zone.hidden)return;
    zone.innerHTML=
      '<p class="sic-note">Joueurs connectés à SOREAL IDLE en ce moment (seuls ceux qui ont le jeu ouvert apparaissent).</p>'+
      (enLigne.length?enLigne.map(function(u){
        return '<div class="sic-ligne"><span class="sic-point '+(u.actif?'on':'away')+'"></span>'+
          '<span>'+echapper(u.nom||'?')+(u.moi?' (moi)':'')+(u.admin?'<span class="sic-admin">ADMIN</span>':'')+'</span>'+
          '<span class="sic-activite">'+echapper(texteActivite(u))+'</span></div>';
      }).join(''):'<div class="sic-vide">Personne en ligne</div>');
  }

  function envoyer(){
    if(envoiEnCours)return;
    const champ=document.querySelector('#sorealIdleChatV1 textarea');
    const bouton=document.querySelector('#sorealIdleChatV1 .sic-envoyer');
    if(!champ)return;
    const message=String(champ.value||'').trim().slice(0,280);
    if(!message)return;
    envoiEnCours=true;
    if(bouton)bouton.disabled=true;
    appel('envoyerChatSorealIdle',[{message:message}]).then(function(res){
      if(res&&res.ok===false)throw new Error(res.message||'Message refusé.');
      champ.value='';
      return chargerRecents();
    }).catch(function(e){
      try{window.alert('⚠️ '+(e&&e.message?e.message:e));}catch(_){}
    }).then(function(){
      envoiEnCours=false;
      if(bouton)bouton.disabled=false;
      champ.focus();
    });
  }

  function supprimerMessage(id){
    if(!estAdmin||!window.confirm('Supprimer ce message pour tout le monde ?'))return;
    appel('supprimerMessageChatSorealIdle',[{id:id}]).then(function(){
      items=items.filter(function(it){return it.id!==id;});
      rendreMessages(false);
    }).catch(function(e){try{window.alert('⚠️ '+(e&&e.message?e.message:e));}catch(_){}});
  }

  /*
   * Page du menu Chat (Norman, 2026-10-01 : « le chat ne soit plus une fenêtre volante mais un menu en pleine page, comme les autres pages »).
   * Le rendu complet du jeu remplace le contenu de la page à chaque mise à jour : le chat est donc construit UNE fois (elChat) et RE-MONTÉ dans
   * l'emplacement que la page lui réserve (pageHtml / apresRendu), ce qui garde le texte en cours de frappe et la position de lecture.
   */
  let elChat=null;

  function construire(){
    const el=document.createElement('div');
    el.id='sorealIdleChatV1';
    el.innerHTML=
      '<div class="sic-fen">'+
        '<div class="sic-tete">'+
          '<div class="sic-titre">💬 Chat SOREAL IDLE</div>'+
          '<button type="button" class="sic-btn sic-btn-presence" data-sic="presence">🟢 … en ligne</button>'+
        '</div>'+
        '<div class="sic-corps">'+
          '<div class="sic-liste"></div>'+
          '<div class="sic-presence" hidden></div>'+
        '</div>'+
        '<div class="sic-saisie">'+
          '<textarea rows="1" maxlength="280" placeholder="Écris un message…" enterkeyhint="send"></textarea>'+
          '<button type="button" class="sic-btn sic-envoyer" data-sic="envoyer">Envoyer</button>'+
        '</div>'+
      '</div>';
    el.addEventListener('click',function(event){
      const c=event.target&&event.target.closest?event.target.closest('[data-sic]'):null;
      if(!c)return;
      const a=c.getAttribute('data-sic');
      if(a==='envoyer')envoyer();
      else if(a==='suppr')supprimerMessage(Number(c.getAttribute('data-id')));
      else if(a==='presence'){panneauPresence=!panneauPresence;rendrePresence();if(panneauPresence)battement();}
    });
    el.addEventListener('keydown',function(event){
      if(event.key==='Enter'&&!event.shiftKey&&event.target&&event.target.tagName==='TEXTAREA'){
        event.preventDefault();envoyer();
      }
      event.stopPropagation();
    });
    /* Les raccourcis clavier du jeu (A, D, R, T…) ne doivent pas se déclencher pendant la frappe. */
    ['keyup','keypress'].forEach(function(t){el.addEventListener(t,function(e){e.stopPropagation();});});
    return el;
  }

  /* HTML de l'emplacement réservé par la page du menu. */
  function pageHtml(){
    /* Le panneau « Activité des joueurs » (modules/flux-v1.js) précède le chat ; il est rempli juste après le rendu. */
    return '<div data-flux-panneau-v1="1"></div><div id="sorealIdleChatPageV1" data-idle-chat-page="1"></div>';
  }

  /* À appeler après chaque rendu de la page : monte (ou remonte) le chat dans son emplacement ; le quitte proprement si la page n'est plus affichée. */
  function apresRendu(){
    if(window.__SOREAL_IDLE_FLUX_V1__)window.__SOREAL_IDLE_FLUX_V1__.majPanneaux();
    const place=document.getElementById('sorealIdleChatPageV1');
    if(!place){
      if(ouvert){ouvert=false;demarrerTimerListe();}
      return;
    }
    if(!dispo)return;
    css();
    const premiereFois=!elChat;
    if(!elChat)elChat=construire();
    if(elChat.parentNode!==place)place.appendChild(elChat);
    const etaitOuvert=ouvert;
    ouvert=true;
    rendreMessages(premiereFois||!etaitOuvert);
    rendrePresence();
    vuId=dernierId;ecrireVu(vuId);recalculerNonLus();
    if(!etaitOuvert){
      chargerRecents().then(function(){rendreMessages(true);}).catch(function(){});
      battement();
      demarrerTimerListe();
    }
  }

  /* Compatibilité : « ouvrir » va simplement sur la page du menu Chat. */
  function ouvrir(){
    if(!dispo)return;
    if(typeof window.__menuIdleV28__==='function')window.__menuIdleV28__('chat');
  }
  function fermer(){
    ouvert=false;
    if(elChat&&elChat.parentNode)elChat.parentNode.removeChild(elChat);
    demarrerTimerListe();
  }

  /* Messages : interrogés seulement panneau ouvert (en arrière-plan, le battement signale un nouveau message). */
  function demarrerTimerListe(){
    clearInterval(timerListe);timerListe=null;
    if(!dispo||!ouvert)return;
    timerListe=setInterval(function(){
      if(document.hidden)return;
      chargerRecents().catch(function(){});
    },INTERVALLE_OUVERT_MS);
  }

  /* ---------- démarrage ---------- */
  function demarrer(tentative){
    if(dispo)return;
    if(typeof window.__SOREAL_IDLE_CALL_V1__!=='function'||!(window.__SOREAL_IDLE_STANDALONE_V1__&&window.__SOREAL_IDLE_STANDALONE_V1__.session&&window.__SOREAL_IDLE_STANDALONE_V1__.session())){
      if((tentative||0)<60)setTimeout(function(){demarrer((tentative||0)+1);},2000);
      return;
    }
    dispo=true;
    vuId=lireVu();
    battement().then(function(){
      return chargerRecents().catch(function(){});
    }).then(function(){
      /* Première utilisation sur cet appareil : pas de « non lus » pour tout l'historique. */
      if(!vuId&&dernierId){vuId=dernierId;ecrireVu(vuId);}
      recalculerNonLus();
      if(typeof window.__SOREAL_IDLE_CHAT_MAJ_MENU__==='function')window.__SOREAL_IDLE_CHAT_MAJ_MENU__();
    });
    /* Même onglet en arrière-plan : le battement continue (le joueur reste « en ligne », mais pas « actif »). */
    timerBattement=setInterval(battement,BATTEMENT_MS);
  }

  window.__SOREAL_IDLE_CHAT_V1__={
    disponible:function(){return dispo;},
    ouvrir:ouvrir,
    fermer:fermer,
    pageHtml:pageHtml,
    apresRendu:apresRendu,
    badgeHtml:badgeHtml,
    demarrer:function(){demarrer(0);},
    /* Outils de test. */
    texteActivite:texteActivite,
    estActif:estActif,
    activiteActuelle:activiteActuelle
  };
  demarrer(0);
})();
