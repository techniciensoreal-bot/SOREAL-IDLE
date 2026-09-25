/*
 * Chat SOREAL dans SOREAL IDLE (Norman, 2026-09-25) : « le chat normal, celui dans lequel tout le monde parle, mais accessible dans SOREAL IDLE,
 * avec le bouton des gens en ligne ».
 *
 * Aucune donnée n'est dupliquée : c'est le salon « général » de APP/TV. SOREAL IDLE tourne dans un cadre de APP ou de TV et ne reçoit jamais la
 * session de l'application (isolation voulue) ; il demande donc à la PAGE PARENTE, par postMessage, de lire / envoyer avec sa propre session :
 *   IDLE -> parent : {soreal:'idle-chat-v1', id, op, args}   op = hello | list | send | presence
 *   parent -> IDLE : {soreal:'idle-chat-v1', id, ok, data | error}
 * Le parent (APP: Soreal_App_html.html, TV: TV_67_JS_Idle_Launcher.html) ne répond qu'à SON cadre IDLE, ne touche jamais au salon Responsables
 * et borne les arguments. Hors cadre (adresse directe du jeu) le chat est simplement indisponible : aucun bouton.
 *
 * Le panneau vit hors de #app (le rendu complet du jeu remplace #app en continu et effacerait la saisie).
 */
(function(){
  'use strict';

  const PROTOCOLE='idle-chat-v1';
  const CLE_VU='soreal_idle_chat_vu_v1';
  const INTERVALLE_OUVERT_MS=3000;
  const INTERVALLE_FOND_MS=15000;
  const INTERVALLE_PRESENCE_MS=15000;
  const MAX_MESSAGES=200;

  let dispo=false;
  let moiEmail='';
  let moiNom='';
  let items=[];
  let dernierId=0;
  let vuId=0;
  let nonLus=0;
  let ouvert=false;
  let panneauPresence=false;
  let modePresence='online';
  let presence={enLigne:[],horsLigne:[]};
  let envoiEnCours=false;
  let timerListe=null;
  let timerPresence=null;
  let seq=0;
  const attentes={};

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

  /* ---------- pont vers la page parente ---------- */
  window.addEventListener('message',function(event){
    if(event.source!==window.parent)return;
    const d=event.data;
    if(!d||typeof d!=='object'||d.soreal!==PROTOCOLE||!d.id)return;
    const a=attentes[d.id];
    if(!a)return;
    delete attentes[d.id];
    clearTimeout(a.t);
    if(d.ok)a.res(d.data);
    else a.rej(new Error(String(d.error||'Chat indisponible')));
  });

  function appelParent(op,args){
    return new Promise(function(res,rej){
      if(window.parent===window){rej(new Error('hors cadre'));return;}
      const id=++seq;
      const t=setTimeout(function(){delete attentes[id];rej(new Error('Le chat ne répond pas.'));},10000);
      attentes[id]={res:res,rej:rej,t:t};
      try{
        window.parent.postMessage({soreal:PROTOCOLE,id:id,op:op,args:args||{}},'*');
      }catch(e){
        delete attentes[id];clearTimeout(t);rej(e);
      }
    });
  }

  /* ---------- messages ---------- */
  function texteMessage(m){
    const brut=String(m==null?'':m).replace(/[​-‍﻿]/g,'').trim();
    if(/\[\[\s*SOREAL_PHOTO/i.test(brut))return '📷 Photo (à voir dans le chat de APP ou de TV)';
    if(/\[\[\s*SOREAL_AUDIO/i.test(brut))return '🎤 Message vocal (à écouter dans le chat de APP ou de TV)';
    if(/^\[\[\s*SOREAL_[A-Z_]+\s*:/i.test(brut))return '📎 Pièce jointe (à ouvrir dans le chat de APP ou de TV)';
    return brut;
  }

  function normaliserItems(liste){
    return (Array.isArray(liste)?liste:[]).map(function(it){
      return {
        id:Number(it&&it.id)||0,
        nom:String(it&&it.nom||''),
        email:String(it&&it.email||'').toLowerCase(),
        heure:String(it&&it.heure||''),
        date:String(it&&it.date||''),
        message:String(it&&it.message||''),
        couleur:/^#[0-9a-f]{6}$/i.test(String(it&&it.profil&&it.profil.couleur||''))?String(it.profil.couleur):''
      };
    }).filter(function(it){return it.id>0;});
  }

  function estMoi(it){
    return Boolean(moiEmail&&it.email&&it.email===moiEmail);
  }

  function recalculerNonLus(){
    nonLus=items.filter(function(it){return it.id>vuId&&!estMoi(it);}).length;
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
    return appelParent('list',dernierId?{apresId:dernierId,limite:100}:{limite:40}).then(function(data){
      const nouveaux=normaliserItems(data&&data.items);
      const change=ajouterItems(nouveaux);
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
    st.textContent=
      '.soreal-idle-chat-badge-v1{display:inline-block;margin-left:5px;min-width:18px;padding:1px 5px;border-radius:999px;background:#ef4444;color:#fff;font-size:11px;font-weight:900;line-height:1.3;text-align:center}'+
      '#sorealIdleChatV1{position:fixed;inset:0;z-index:2147482000;display:flex;align-items:flex-end;justify-content:center;background:rgba(3,8,20,.62);font-family:inherit}'+
      '#sorealIdleChatV1 .sic-fen{width:min(560px,100%);height:min(86dvh,720px);display:flex;flex-direction:column;background:#0f1729;border:1px solid rgba(94,217,255,.3);border-radius:16px 16px 0 0;box-shadow:0 -10px 40px rgba(0,0,0,.5);color:#dce5f3;overflow:hidden}'+
      '@media(min-width:700px){#sorealIdleChatV1{align-items:center}#sorealIdleChatV1 .sic-fen{border-radius:16px}}'+
      '#sorealIdleChatV1 .sic-tete{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.1);background:rgba(94,217,255,.07)}'+
      '#sorealIdleChatV1 .sic-titre{flex:1;font-size:15px;font-weight:900}'+
      '#sorealIdleChatV1 button{cursor:pointer;font:inherit}'+
      '#sorealIdleChatV1 .sic-btn{min-height:36px;padding:0 12px;border-radius:10px;border:1px solid rgba(94,217,255,.35);background:rgba(94,217,255,.1);color:#cfe6f7;font-size:13px;font-weight:800}'+
      '#sorealIdleChatV1 .sic-btn.actif{background:#166534;border-color:#4ade80;color:#fff}'+
      '#sorealIdleChatV1 .sic-corps{position:relative;flex:1;min-height:0;display:flex;flex-direction:column}'+
      '#sorealIdleChatV1 .sic-liste{flex:1;min-height:0;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px;-webkit-overflow-scrolling:touch}'+
      '#sorealIdleChatV1 .sic-msg{max-width:86%;padding:7px 10px;border-radius:12px;background:rgba(255,255,255,.07);align-self:flex-start;word-break:break-word}'+
      '#sorealIdleChatV1 .sic-msg.moi{align-self:flex-end;background:rgba(94,217,255,.16)}'+
      '#sorealIdleChatV1 .sic-nom{font-size:12px;font-weight:900;margin-bottom:2px}'+
      '#sorealIdleChatV1 .sic-heure{margin-left:6px;font-size:10px;font-weight:400;color:#8b93ab}'+
      '#sorealIdleChatV1 .sic-txt{font-size:14px;line-height:1.4;white-space:pre-wrap}'+
      '#sorealIdleChatV1 .sic-vide{margin:auto;color:#8b93ab;font-size:13px;text-align:center}'+
      '#sorealIdleChatV1 .sic-saisie{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(255,255,255,.1)}'+
      '#sorealIdleChatV1 textarea{flex:1;min-height:40px;max-height:110px;resize:none;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:#0b1220;color:#fff;font:inherit;font-size:15px}'+
      '#sorealIdleChatV1 .sic-envoyer{background:linear-gradient(90deg,#5ed9ff,#7cf0c6);border:0;color:#04202b}'+
      '#sorealIdleChatV1 .sic-envoyer:disabled{opacity:.5}'+
      '#sorealIdleChatV1 .sic-presence{position:absolute;inset:0;overflow-y:auto;padding:10px 12px;background:#0f1729}'+
      '#sorealIdleChatV1 .sic-onglets{display:flex;gap:8px;margin-bottom:10px}'+
      '#sorealIdleChatV1 .sic-ligne{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:14px}'+
      '#sorealIdleChatV1 .sic-point{width:10px;height:10px;border-radius:50%;background:#64748b;flex:none}'+
      '#sorealIdleChatV1 .sic-point.on{background:#22c55e;box-shadow:0 0 8px #22c55e}'+
      '#sorealIdleChatV1 .sic-dernier{margin-left:auto;font-size:11px;color:#8b93ab}'+
      '#sorealIdleChatV1 .sic-admin{margin-left:6px;padding:1px 6px;border-radius:6px;background:#7c3aed;color:#fff;font-size:10px;font-weight:900}';
    document.head.appendChild(st);
  }

  function elListe(){return document.querySelector('#sorealIdleChatV1 .sic-liste');}

  function htmlMessage(it){
    const moi=estMoi(it);
    return '<div class="sic-msg'+(moi?' moi':'')+'" data-id="'+it.id+'">'+
      '<div class="sic-nom"'+(it.couleur?' style="color:'+it.couleur+'"':'')+'>'+echapper(moi?'Moi':(it.nom||'?'))+
        '<span class="sic-heure">'+echapper(it.heure)+'</span></div>'+
      '<div class="sic-txt">'+echapper(texteMessage(it.message))+'</div>'+
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
      bouton.textContent='🟢 '+presence.enLigne.length+' en ligne';
    }
    if(!zone)return;
    zone.hidden=!panneauPresence;
    if(!panneauPresence)return;
    const liste=modePresence==='online'?presence.enLigne:presence.horsLigne;
    zone.innerHTML=
      '<div class="sic-onglets">'+
        '<button type="button" class="sic-btn'+(modePresence==='online'?' actif':'')+'" data-sic="online">🟢 En ligne ('+presence.enLigne.length+')</button>'+
        '<button type="button" class="sic-btn'+(modePresence==='offline'?' actif':'')+'" data-sic="offline">⚪ Hors ligne ('+presence.horsLigne.length+')</button>'+
      '</div>'+
      (liste.length?liste.map(function(u){
        return '<div class="sic-ligne"><span class="sic-point'+(modePresence==='online'?' on':'')+'"></span>'+
          '<span>'+echapper(u.nom||u.email||'?')+(u.moi?' (moi)':'')+(u.admin?'<span class="sic-admin">ADMIN</span>':'')+'</span>'+
          '<span class="sic-dernier">'+echapper(modePresence==='online'?'maintenant':(u.derniereActivite||'Jamais connecté'))+'</span></div>';
      }).join(''):'<div class="sic-vide">'+(modePresence==='online'?'Personne en ligne':'Personne hors ligne')+'</div>');
  }

  function chargerPresence(){
    return appelParent('presence').then(function(data){
      presence={
        enLigne:Array.isArray(data&&data.enLigne)?data.enLigne:[],
        horsLigne:Array.isArray(data&&data.horsLigne)?data.horsLigne:[]
      };
      rendrePresence();
    }).catch(function(){});
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
    appelParent('send',{message:message}).then(function(){
      champ.value='';
      return chargerRecents();
    }).catch(function(e){
      try{window.alert('⚠️ '+e.message);}catch(_){}
    }).then(function(){
      envoiEnCours=false;
      if(bouton)bouton.disabled=false;
      champ.focus();
    });
  }

  function ouvrir(){
    if(!dispo||ouvert)return;
    css();
    ouvert=true;
    const el=document.createElement('div');
    el.id='sorealIdleChatV1';
    el.setAttribute('role','dialog');
    el.setAttribute('aria-modal','true');
    el.setAttribute('aria-label','Chat SOREAL');
    el.innerHTML=
      '<div class="sic-fen">'+
        '<div class="sic-tete">'+
          '<div class="sic-titre">💬 Chat SOREAL</div>'+
          '<button type="button" class="sic-btn sic-btn-presence" data-sic="presence">🟢 … en ligne</button>'+
          '<button type="button" class="sic-btn" data-sic="fermer" aria-label="Fermer le chat">✕</button>'+
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
      if(event.target===el){fermer();return;}
      const c=event.target&&event.target.closest?event.target.closest('[data-sic]'):null;
      if(!c)return;
      const a=c.getAttribute('data-sic');
      if(a==='fermer')fermer();
      else if(a==='envoyer')envoyer();
      else if(a==='presence'){panneauPresence=!panneauPresence;rendrePresence();if(panneauPresence)chargerPresence();}
      else if(a==='online'||a==='offline'){modePresence=a;rendrePresence();}
    });
    el.addEventListener('keydown',function(event){
      if(event.key==='Enter'&&!event.shiftKey&&event.target&&event.target.tagName==='TEXTAREA'){
        event.preventDefault();envoyer();
      }
      event.stopPropagation();
    });
    /* Les raccourcis clavier du jeu (A, D, R, T…) ne doivent pas se déclencher pendant la frappe. */
    ['keyup','keypress'].forEach(function(t){el.addEventListener(t,function(e){e.stopPropagation();});});
    document.body.appendChild(el);
    panneauPresence=false;
    rendreMessages(true);
    rendrePresence();
    vuId=dernierId;ecrireVu(vuId);recalculerNonLus();
    chargerRecents().then(function(){rendreMessages(true);});
    chargerPresence();
    demarrerTimers();
  }

  function fermer(){
    ouvert=false;
    const el=document.getElementById('sorealIdleChatV1');
    if(el&&el.parentNode)el.parentNode.removeChild(el);
    demarrerTimers();
  }

  function demarrerTimers(){
    clearInterval(timerListe);timerListe=null;
    clearInterval(timerPresence);timerPresence=null;
    if(!dispo)return;
    timerListe=setInterval(function(){
      if(document.hidden)return;
      chargerRecents().catch(function(){});
    },ouvert?INTERVALLE_OUVERT_MS:INTERVALLE_FOND_MS);
    if(ouvert){
      timerPresence=setInterval(function(){
        if(!document.hidden)chargerPresence();
      },INTERVALLE_PRESENCE_MS);
    }
  }

  /* Échap ferme le chat. */
  document.addEventListener('keydown',function(event){
    if(event.key==='Escape'&&ouvert)fermer();
  },true);

  /* ---------- démarrage ---------- */
  function demarrer(tentative){
    if(dispo||window.parent===window)return;
    appelParent('hello').then(function(data){
      moiEmail=String(data&&data.email||'').toLowerCase();
      moiNom=String(data&&data.nom||'');
      dispo=true;
      vuId=lireVu();
      return chargerRecents().catch(function(){}).then(function(){
        /* Première utilisation sur cet appareil : pas de « non lus » pour tout l'historique. */
        if(!vuId&&dernierId){vuId=dernierId;ecrireVu(vuId);}
        recalculerNonLus();
        demarrerTimers();
        if(typeof window.__SOREAL_IDLE_CHAT_MAJ_MENU__==='function')window.__SOREAL_IDLE_CHAT_MAJ_MENU__();
      });
    }).catch(function(){
      if((tentative||0)<3)setTimeout(function(){demarrer((tentative||0)+1);},4000);
    });
  }

  window.__SOREAL_IDLE_CHAT_V1__={
    disponible:function(){return dispo;},
    ouvrir:ouvrir,
    fermer:fermer,
    badgeHtml:badgeHtml,
    demarrer:function(){demarrer(0);}
  };
  demarrer(0);
})();
