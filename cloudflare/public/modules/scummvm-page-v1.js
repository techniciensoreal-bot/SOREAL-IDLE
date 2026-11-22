/*
 * SOREAL IDLE — page « Énigmes » : un jeu ScummVM (WebAssembly) dans un iframe (ajout SOREAL, Norman, 2026-11-22).
 * Expose window.__SOREAL_IDLE_SCUMMVM_PAGE_V1__ = { page(j), choisirJeu(cat, difficulte), urlLancement(jeu), ... }.
 *
 * Règle n°4 (redessin invisible) : l'iframe n'est JAMAIS déplacé ni recréé (déplacer un iframe dans le DOM le recharge). Il vit dans un hôte `position:fixed`
 * rattaché à <body> (hors de la page, donc hors de portée du morph, `data-morph-garder` par prudence). La page ne dessine qu'une ZONE vide (#scvZoneV1) ;
 * l'hôte se cale dessus (getBoundingClientRect) au redessin (window.__SOREAL_IDLE_APRES_REDESSIN_V1__, même tâche) et à chaque image tant qu'il est visible.
 * Quand la zone n'est plus dans la page (autre menu) l'hôte est masqué sans être détruit et le son est suspendu.
 * Règle n°2 : seul le nom du jeu courant est montré ; jamais de total, ni de jeu d'une autre difficulté.
 * Règle n°6 : dernier état dans localStorage `soreal_idle_scummvm_etat_v1`.
 * Les fichiers viennent du Worker : /api/idle/scummvm/<clé> (catalogue jeux.json, moteur/scummvm.html, jeux/<dossier>/...).
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_SCUMMVM_PAGE_V1__)return;

  const BASE='/api/idle/scummvm/';
  const CLE_ETAT='soreal_idle_scummvm_etat_v1';
  /* Difficultés du moteur (state.difficulty) -> difficultés du catalogue ; repli sur la difficulté inférieure. */
  const DIFF_CATALOGUE={normal:'normal',difficile:'evil',extreme:'sadistic'};
  const ORDRE_DIFF=['normal','evil','sadistic'];

  let catalogue=null;      /* null = pas encore lu ; [] = aucun jeu ; [..] = jeux */
  let catalogueEnCours=false;
  let difficulteCourante='normal';
  let jeuCourant=null;
  let host=null,iframe=null,cover=null,overlay=null,btnQuitter=null;
  let gestePage=false;     /* un geste de l'utilisateur a eu lieu : le son peut partir */
  let iframeCharge=false,moteurPret=false,chargeLe=0;
  let pause=false,plein=false,preSuivi=false,preFini=false,attente=0,observeur=null,zoneObservee=null;
  const precharge={octets:0,total:0};

  function lire(){try{return window.localStorage.getItem(CLE_ETAT)||'';}catch(_e){return '';}}
  function ecrire(v){try{window.localStorage.setItem(CLE_ETAT,v);}catch(_e){}}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  /* Le jeu de la difficulté du joueur, sinon celui de la difficulté inférieure, sinon le premier. */
  function choisirJeu(cat,difficulte){
    const liste=Array.isArray(cat)?cat.filter(function(g){return g&&g.cible&&g.dossier;}):[];
    if(!liste.length)return null;
    let i=ORDRE_DIFF.indexOf(DIFF_CATALOGUE[difficulte]||difficulte);
    if(i<0)i=0;
    for(;i>=0;i--){
      const g=liste.find(function(x){return x.difficulte===ORDRE_DIFF[i];});
      if(g)return g;
    }
    return liste[0];
  }
  /* Langue du jeu Soreal (clé soreal_idle_langue_v1 : « en » = anglais, sinon français). Un jeu peut avoir un dossier par langue (« dossiers »:{"fr":"…","en":"…"} dans jeux.json) : le dossier de la langue,
     sinon celui du français, sinon « dossier ». Les sous-titres sont toujours demandés (--subtitles) : ils s'affichent dans la langue des fichiers du jeu choisi. */
  function langueJeu(){try{return window.localStorage.getItem('soreal_idle_langue_v1')==='en'?'en':'fr';}catch(_e){return 'fr';}}
  function dossierDe(jeu){
    const d=jeu&&jeu.dossiers&&typeof jeu.dossiers==='object'?jeu.dossiers:null;
    return String((d&&(d[langueJeu()]||d.fr))||jeu.dossier);
  }
  function urlLancement(jeu){
    /* --path : ScummVM détecte le jeu par son dossier (mesuré le 2026-11-22 avec Day of the Tentacle) : aucune entrée à écrire dans scummvm.ini, un nouveau jeu n'a besoin que de son dossier sur R2. */
    return BASE+'moteur/scummvm.html#--path=/data/games/'+dossierDe(jeu).replace(/[^A-Za-z0-9._+()-]/g,'')+(langueJeu()==='en'?' --no-subtitles':' --subtitles')+' --save-slot=0 '+jeu.cible;   /* Norman, 2026-11-22 : sous-titres en français si le jeu Soreal est en français, désactivés en anglais (--no-subtitles écrase aussi un réglage gardé par ScummVM) */
  }
  function difficulteDe(j){
    const d=j&&j.systemes&&j.systemes.difficulty;
    return d==='extreme'||d==='difficile'?d:'normal';
  }
  function scummvmDebloque(j){
    const l=j&&j.systemes&&Array.isArray(j.systemes.systems)?j.systemes.systems:[];
    return l.some(function(s){return s&&s.id==='scummvm';});
  }

  /* Interrupteur serveur : GET /api/idle/scummvm/ouvert -> {ouvert:bool}. Une requête au démarrage puis au plus toutes les 60 s (jamais de rafale) ; échec réseau = fermé. */
  let ouvert=false,ouvertLeMs=0,ouvertEnCours=false;
  function interroger(){
    if(ouvertEnCours)return;
    ouvertEnCours=true;ouvertLeMs=Date.now();
    fetch(BASE+'ouvert',{cache:'no-store'}).then(function(r){return r.ok?r.json():{ouvert:false};}).catch(function(){return {ouvert:false};}).then(function(d){
      const nouveau=Boolean(d&&d.ouvert===true);
      ouvertEnCours=false;
      ouvert=nouveau;   /* le menu apparaît au prochain rendu normal (synchro), sans rendu forcé */
    });
  }
  function estOuvert(){
    if(!ouvertLeMs||Date.now()-ouvertLeMs>60000)interroger();
    return ouvert;
  }
  window.__SOREAL_IDLE_SCUMMVM_OUVERT_V1__=estOuvert;
  interroger();   /* une requête au démarrage */
  function chargerCatalogue(){
    if(catalogue!==null||catalogueEnCours)return;
    catalogueEnCours=true;
    fetch(BASE+'jeux.json').then(function(r){return r.ok?r.json():{jeux:[]};}).catch(function(){return {jeux:[]};}).then(function(d){
      catalogue=d&&Array.isArray(d.jeux)?d.jeux:[];
      catalogueEnCours=false;
      jeuCourant=choisirJeu(catalogue,difficulteCourante);
      majCouverture();
      demarrerPrechargeSiBesoin();
      chargerTropheesDuJeu();
    });
  }

  /* ---------- préchargement du cache HTTP (jamais pendant un combat, jamais en économie de données) ---------- */
  function connexionEconome(){try{return Boolean(navigator.connection&&navigator.connection.saveData);}catch(_e){return false;}}
  function menuActif(){try{return String((window.__SOREAL_IDLE_REG__||{}).idleMenuActifV28||'');}catch(_e){return '';}}
  function demarrerPrechargeSiBesoin(){
    if(preSuivi||!jeuCourant||connexionEconome())return;
    preSuivi=true;
    const lancer=function(){
      const m=menuActif();
      if(m==='combat'||m==='aventure'){window.setTimeout(lancer,30000);return;}
      precharger(jeuCourant).then(function(){preFini=true;majCouverture();if(lire()==='lance')creerIframe(true);});
    };
    if(typeof window.requestIdleCallback==='function')window.requestIdleCallback(lancer,{timeout:20000});else window.setTimeout(lancer,5000);
  }
  function aller(url){
    return fetch(url).then(function(r){
      if(!r.ok||!r.body||!r.body.getReader)return r.arrayBuffer().then(function(b){precharge.octets+=b.byteLength;});
      const lec=r.body.getReader();
      const pas=function(){return lec.read().then(function(x){if(x.done)return;precharge.octets+=x.value.length;return pas();});};
      return pas();
    }).catch(function(){});
  }
  function precharger(jeu){
    const racine=BASE+'moteur/';
    const fichiers=[racine+'scummvm.html',racine+'scummvm.js',racine+'scummvm.wasm',racine+'data/index.json'];
    const dossier=BASE+'jeux/'+encodeURIComponent(dossierDe(jeu))+'/';
    precharge.total=60e6;   /* estimation tant que les tailles ne sont pas connues ; remplacée par la somme réelle */
    return fetch(dossier+'index.json').then(function(r){return r.ok?r.json():{};}).catch(function(){return {};}).then(function(idx){
      let somme=0;const noms=Object.keys(idx||{});
      noms.forEach(function(n){somme+=Number(idx[n])||0;fichiers.push(dossier+n.split('/').map(encodeURIComponent).join('/'));});
      if(somme>0)precharge.total=somme+3e6;
      let i=0;
      const travailleur=function(){if(i>=fichiers.length)return Promise.resolve();return aller(fichiers[i++]).then(travailleur);};
      return Promise.all([travailleur(),travailleur()]);
    });
  }

  /* ---------- hôte, iframe, couverture ---------- */
  function creerHote(){
    if(host)return;
    host=document.createElement('div');host.id='scvHoteV1';host.className='scv-cache';host.setAttribute('data-morph-garder','');
    cover=document.createElement('div');cover.className='scv-couv';
    btnQuitter=document.createElement('button');btnQuitter.type='button';btnQuitter.className='scv-quitter';btnQuitter.textContent='✕';btnQuitter.setAttribute('aria-label','Quitter le plein écran');
    btnQuitter.addEventListener('click',function(){pleinEcran(false);});
    host.appendChild(cover);host.appendChild(btnQuitter);
    document.body.appendChild(host);
    cover.addEventListener('click',function(e){const b=e.target&&e.target.closest&&e.target.closest('button');if(b)jouer();});
    majCouverture();
  }
  function majCouverture(){
    if(!cover)return;
    if(catalogue!==null&&!jeuCourant){cover.innerHTML='<b>Aucun jeu disponible pour l’instant.</b>';return;}
    if(!jeuCourant){cover.innerHTML='<b>Chargement…</b>';return;}
    const nom=esc(jeuCourant.nom||'');
    if(!gestePage){cover.innerHTML='<b>'+nom+'</b><button type="button" class="soreal-idle-expand-button-v25">▶ Jouer</button>';return;}
    const pct=precharge.total>0?Math.min(100,Math.round(precharge.octets/precharge.total*100)):0;
    cover.innerHTML='<b>'+nom+'</b><div class="scv-barre"><i style="width:'+(preFini?100:pct)+'%"></i></div><span>Chargement…</span>';
  }
  function couvrir(oui){if(cover)cover.style.display=oui?'flex':'none';}

  function creerIframe(cache){
    if(iframe||!jeuCourant)return;
    creerHote();
    iframe=document.createElement('iframe');
    iframe.setAttribute('allow','autoplay; fullscreen');
    iframe.setAttribute('title',jeuCourant.nom||'');
    iframe.style.touchAction='none';
    iframe.addEventListener('load',function(){iframeCharge=true;chargeLe=Date.now();espionnerAudio();});
    host.insertBefore(iframe,cover);
    iframe.src=urlLancement(jeuCourant);
    /* AP par progrès (modules/scummvm-progres-v1.js) : un minuteur de 30 s lit l'autosave du jeu tant que la page vit. */
    try{const P=window.__SOREAL_IDLE_SCUMMVM_PROGRES_V1__;if(P)P.demarrer(jeuCourant,dossierDe(jeuCourant));}catch(_e){}
    /* Écran tactile : une couche au-dessus de l'iframe traduit appui = clic, deux doigts = clic droit. */
    if((navigator.maxTouchPoints||0)>0)monterVoile();
    if(cache)surveillerPretCache();
  }
  /* Le moteur ne montre pas son AudioContext (Module.SDL2 absent) : on enveloppe le constructeur de l'iframe dès son chargement (l'audio n'est ouvert qu'après l'initialisation du wasm) pour pouvoir le suspendre. */
  function espionnerAudio(){
    try{
      const w=fenetreJeu();if(!w||w.__scvAudio)return;
      w.__scvAudio=[];
      ['AudioContext','webkitAudioContext'].forEach(function(nom){
        const Orig=w[nom];if(!Orig)return;
        const Enveloppe=function(){const c=new (Function.prototype.bind.apply(Orig,[null].concat(Array.prototype.slice.call(arguments))))();w.__scvAudio.push(c);return c;};
        Enveloppe.prototype=Orig.prototype;
        w[nom]=Enveloppe;
      });
    }catch(_e){}
  }
  function contextesAudio(w){
    const l=(w&&w.__scvAudio)?w.__scvAudio.slice():[];
    try{const M=w.Module,c=(M.SDL2&&M.SDL2.audioContext)||(M.SDL&&M.SDL.audioContext);if(c&&l.indexOf(c)<0)l.push(c);}catch(_e){}
    return l;
  }
  function fenetreJeu(){try{return iframe&&iframe.contentWindow;}catch(_e){return null;}}
  function moteurEstPret(){
    try{
      const w=fenetreJeu();
      if(w&&w.Module&&w.Module.calledRun)return true;
      /* page hôte du moteur : la fenêtre de téléchargement est masquée une fois le statut vidé (setStatus('')) */
      const m=w&&w.document&&w.document.getElementById('download-modal');
      if(m&&m.style.display==='none'&&w.Module&&w.Module.setStatus&&w.Module.setStatus.last==='')return true;
      return iframeCharge&&Date.now()-chargeLe>20000;
    }catch(_e){return false;}
  }
  function estVisible(){return Boolean(host&&!host.classList.contains('scv-cache'));}
  /* Iframe préparé en arrière-plan : une fois prêt, on le met en pause (il reprend à l'ouverture du menu). */
  function surveillerPretCache(){
    let essais=0;
    const v=function(){
      if(!iframe)return;
      if(moteurEstPret()){moteurPret=true;if(!estVisible())suspendre(true);return;}
      if(++essais<120)window.setTimeout(v,1000);
    };
    window.setTimeout(v,1000);
  }

  /* Pause du SON seulement (mesuré, 2026-11-22) : AudioContext suspendu / repris. Module.pauseMainLoop ne sert à rien ici (ScummVM n'utilise pas la boucle emscripten : resumeMainLoop lève une exception) ; le moteur reste actif, sans son, tant que l'iframe existe. */
  function suspendre(oui){
    if(pause===oui)return;
    const w=fenetreJeu();if(!w)return;
    pause=oui;
    try{contextesAudio(w).forEach(function(c){if(oui)c.suspend();else c.resume();});}catch(_e){}
  }
  function debloquerSon(){
    const w=fenetreJeu();if(!w)return;
    try{w.focus();}catch(_e){}
    try{contextesAudio(w).forEach(function(c){if(c.state==='suspended')c.resume();});}catch(_e){}
  }

  function jouer(){
    if(!jeuCourant)return;
    gestePage=true;
    ecrire('lance');
    creerHote();
    if(!iframe)creerIframe(false);
    if(moteurEstPret()||moteurPret){moteurPret=true;couvrir(false);}
    else{majCouverture();attendrePret();}
    suspendre(false);
    debloquerSon();
  }

  /* ---------- tactile : appui = clic, deux doigts = clic droit ---------- */
  function envoyerSouris(type,x,y,bouton,appuye){
    const w=fenetreJeu();if(!w)return;
    try{
      const r=iframe.getBoundingClientRect();
      const cible=w.document.getElementById('canvas')||w.document.querySelector('canvas')||w.document.body;
      cible.dispatchEvent(new w.MouseEvent(type,{bubbles:true,cancelable:true,view:w,clientX:x-r.left,clientY:y-r.top,screenX:x,screenY:y,button:bouton,buttons:appuye?(bouton===2?2:1):0}));
    }catch(_e){}
  }
  function cliquer(x,y,bouton){
    envoyerSouris('mousemove',x,y,0,false);
    envoyerSouris('mousedown',x,y,bouton,true);
    envoyerSouris('mouseup',x,y,bouton,false);
  }
  function monterVoile(){
    if(overlay)return;
    overlay=document.createElement('div');overlay.className='scv-voile';
    host.insertBefore(overlay,cover);
    let debut=null;
    const centre=function(ts){let x=0,y=0;for(let i=0;i<ts.length;i++){x+=ts[i].clientX;y+=ts[i].clientY;}return {x:x/ts.length,y:y/ts.length};};
    overlay.addEventListener('touchstart',function(e){
      e.preventDefault();
      gestePage=true;debloquerSon();
      const c=centre(e.touches);
      if(!debut)debut={t:Date.now(),x:c.x,y:c.y,max:e.touches.length,bouge:false,x0:c.x,y0:c.y};
      else debut.max=Math.max(debut.max,e.touches.length);
      if(e.touches.length===1)envoyerSouris('mousemove',c.x,c.y,0,false);
    },{passive:false});
    overlay.addEventListener('touchmove',function(e){
      e.preventDefault();if(!debut)return;
      const c=centre(e.touches);
      if(Math.abs(c.x-debut.x0)+Math.abs(c.y-debut.y0)>14)debut.bouge=true;
      debut.x=c.x;debut.y=c.y;
      if(e.touches.length===1)envoyerSouris('mousemove',c.x,c.y,0,false);   /* un doigt qui glisse déplace le curseur (survol), sans cliquer */
    },{passive:false});
    overlay.addEventListener('touchend',function(e){
      e.preventDefault();
      if(!debut||e.touches.length>0)return;
      const d=debut;debut=null;
      if(d.bouge||Date.now()-d.t>600)return;
      cliquer(d.x,d.y,d.max>=2?2:0);
    },{passive:false});
    overlay.addEventListener('touchcancel',function(){debut=null;});
    /* souris sur un appareil hybride : la couche transmet aussi la souris. */
    overlay.addEventListener('mousemove',function(e){envoyerSouris('mousemove',e.clientX,e.clientY,0,false);});
    overlay.addEventListener('mousedown',function(e){e.preventDefault();gestePage=true;debloquerSon();envoyerSouris('mousedown',e.clientX,e.clientY,e.button,true);});
    overlay.addEventListener('mouseup',function(e){envoyerSouris('mouseup',e.clientX,e.clientY,e.button,false);});
    overlay.addEventListener('contextmenu',function(e){e.preventDefault();});
  }

  /* ---------- plein écran ---------- */
  function pleinEcran(oui){
    if(!host)return;
    plein=oui;
    host.classList.toggle('scv-plein',oui);
    if(oui){host.style.left='';host.style.top='';host.style.width='';host.style.height='';}
    try{
      if(oui){
        if(host.requestFullscreen)host.requestFullscreen().catch(function(){});
        if(window.screen&&screen.orientation&&screen.orientation.lock)screen.orientation.lock('landscape').catch(function(){});
      }else{
        if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(function(){});
        if(window.screen&&screen.orientation&&screen.orientation.unlock)screen.orientation.unlock();
      }
    }catch(_e){}
    if(!oui)synchroniser();
  }
  document.addEventListener('fullscreenchange',function(){if(plein&&!document.fullscreenElement)pleinEcran(false);});
  window.__scvPleinEcran__=function(){
    if(!host)creerHote();
    pleinEcran(!plein);
  };

  /* ---------- calage sur la zone de la page ---------- */
  function placer(z){
    if(plein)return;
    const r=z.getBoundingClientRect();
    const s=host.style;
    s.left=r.left+'px';s.top=r.top+'px';s.width=r.width+'px';s.height=r.height+'px';
  }
  function masquer(){
    if(!host)return;
    if(plein)pleinEcran(false);
    host.classList.add('scv-cache');
    suspendre(true);
  }
  function afficher(z){
    creerHote();
    const etait=host.classList.contains('scv-cache');
    placer(z);
    host.classList.remove('scv-cache');
    /* l'iframe existe déjà (préparé en arrière-plan ou vu avant) : on le réveille tout de suite */
    if(etait&&iframe)suspendre(false);
    if(!iframe&&jeuCourant&&lire()==='lance')creerIframe(false);
    if(iframe&&!moteurPret&&moteurEstPret())moteurPret=true;
    couvrir(!jeuCourant||!(gestePage&&moteurPret));
    if(gestePage&&!moteurPret){majCouverture();attendrePret();}
  }
  function recaler(){
    if(!host||plein||!estVisible())return;
    const z=document.getElementById('scvZoneV1');
    if(!z||!z.isConnected){masquer();return;}
    placer(z);
  }
  function observer(z){
    if(zoneObservee===z||typeof window.ResizeObserver!=='function')return;
    try{if(!observeur)observeur=new window.ResizeObserver(recaler);if(zoneObservee)observeur.unobserve(zoneObservee);observeur.observe(z);zoneObservee=z;}catch(_e){}
  }
  /* En attendant que le moteur soit prêt : un test toutes les 500 ms, seulement tant que la couverture est affichée. */
  function attendrePret(){
    if(attente||moteurPret||!gestePage)return;
    attente=window.setTimeout(function(){
      attente=0;
      if(iframe&&moteurEstPret())moteurPret=true;
      if(moteurPret){if(estVisible())couvrir(false);return;}
      majCouverture();attendrePret();
    },500);
  }
  function synchroniser(){
    const z=document.getElementById('scvZoneV1');
    if(!z||!z.isConnected){masquer();return;}
    afficher(z);
    observer(z);
  }
  window.addEventListener('scroll',recaler,{passive:true,capture:true});
  window.addEventListener('resize',recaler,{passive:true});
  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(function(){
    try{
      const j=(window.__SOREAL_IDLE_REG__||{}).idleEtat;
      if(j&&scummvmDebloque(j)&&estOuvert()){difficulteCourante=difficulteDe(j);chargerCatalogue();}
      synchroniser();
      majTrophees();
    }catch(_e){}
  });

  /* ---------- TROPHÉES du jeu courant (Norman, 2026-11-22) : le bloc ne montre QUE les trophées déjà obtenus (nom + AP gagnés, dans l'ordre d'obtention) et le total gagné ;
     jamais les autres, jamais leur nombre ni le total possible (règle n°2). Rien du tout tant qu'aucun n'est obtenu. Règle n°4 : nœud persistant (data-morph-vivant) dessiné ICI et
     mis à jour de façon incrémentale (un trophée nouveau s'ajoute en bas, le reste n'est pas touché), appelé juste après chaque redessin ; aucune minuterie. */
  let tNoeud=null,tIds=[],tLangue='',tTotal=null,tListe=null,tTotalEl=null;
  function progresMod(){return window.__SOREAL_IDLE_SCUMMVM_PROGRES_V1__||null;}
  function chargerTropheesDuJeu(){
    const P=progresMod();
    if(!P||!jeuCourant||!jeuCourant.ap)return;
    P.chargerTrophees(jeuCourant,dossierDe(jeuCourant)).then(function(){try{majTrophees();redessinerPage();}catch(_e){}});
  }
  /* la liste vient d'être lue : un seul redessin de la page (le total hors trophées change de place) si le menu est ouvert */
  function redessinerPage(){try{const R=window.__SOREAL_IDLE_REG__||{};if(String(R.idleMenuActifV28||'')==='scummvm'&&R.idleEtat&&typeof R.rendreIdleEtat_==='function')R.rendreIdleEtat_({ok:true,joueur:R.idleEtat});}catch(_e){}}
  function etatJeu(j,jeu){
    const l=j&&j.systemes&&Array.isArray(j.systemes.systems)?j.systemes.systems:[];
    const s=l.find(function(x){return x&&x.id==='scummvm';});
    const d=s&&((s.state&&s.state.data)||s.data);
    return (d&&d.jeux&&jeu&&d.jeux[jeu.id])||null;
  }
  function nomTrophee(t){const n=(t&&t.nom)||{};return langueJeu()==='en'?(n.en||n.fr||''):(n.fr||n.en||'');}
  function nombreLisible(n){try{const f=(window.__SOREAL_IDLE_REG__||{}).formatEntierLisibleIdleV1_;if(typeof f==='function')return String(f(n));}catch(_e){}return String(n);}
  /* [{id,nom,ap}] des trophées obtenus, dans l'ordre d'obtention (liste du serveur ; l'AP est celui réellement crédité) */
  function tropheesObtenus(j){
    const P=progresMod();
    const liste=P&&jeuCourant?P.tropheesDe(jeuCourant.id):null;
    if(!liste)return [];
    const e=etatJeu(j,jeuCourant);
    const ordre=e&&Array.isArray(e.ordre)?e.ordre:[];
    const cred=e&&e.trophees&&typeof e.trophees==='object'?e.trophees:{};
    const par={};liste.forEach(function(t){par[t.id]=t;});
    return ordre.filter(function(id){return par[id]&&Number(cred[id])>=0;}).map(function(id){return {id:id,nom:nomTrophee(par[id]),ap:Math.floor(Number(cred[id]))};});
  }
  function majTrophees(){
    const noeud=document.getElementById('scvTropheesV1');
    if(!noeud)return;
    const j=(window.__SOREAL_IDLE_REG__||{}).idleEtat;
    const obtenus=j?tropheesObtenus(j):[];
    if(!obtenus.length){
      if(noeud.firstChild){while(noeud.firstChild)noeud.removeChild(noeud.firstChild);}
      tNoeud=noeud;tIds=[];tListe=null;tTotalEl=null;tTotal=null;
      return;
    }
    const langue=langueJeu();
    if(noeud!==tNoeud||!tListe||langue!==tLangue||!tListe.isConnected){
      while(noeud.firstChild)noeud.removeChild(noeud.firstChild);
      const titre=document.createElement('div');titre.className='scv-troph-titre';titre.textContent='Trophées';
      tListe=document.createElement('ul');tListe.className='scv-troph-liste';
      const ap=document.createElement('div');ap.className='scv-ap';
      const lib=document.createElement('span');lib.textContent='AP gagnés avec ce jeu :';
      tTotalEl=document.createElement('b');
      ap.appendChild(lib);ap.appendChild(document.createTextNode(' '));ap.appendChild(tTotalEl);
      [titre,tListe,ap].forEach(function(e){e.setAttribute('data-morph-garder','');noeud.appendChild(e);});   /* le redessin laisse ces blocs où ils sont (règle n°4) */
      tNoeud=noeud;tIds=[];tLangue=langue;tTotal=null;
    }
    obtenus.forEach(function(t,i){
      if(tIds[i]===t.id)return;
      const li=document.createElement('li');
      const n=document.createElement('span');n.className='scv-troph-nom';n.textContent=t.nom;
      const a=document.createElement('b');a.className='scv-troph-ap';a.textContent='+'+nombreLisible(t.ap)+' AP';
      li.appendChild(n);li.appendChild(a);tListe.appendChild(li);tIds[i]=t.id;
    });
    const total=apCredites(j,jeuCourant);
    if(total!==tTotal){tTotalEl.textContent=nombreLisible(total);tTotal=total;}   /* comparé à la dernière valeur écrite, jamais à textContent */
  }

  /* AP déjà gagnés avec le jeu courant (règle n°2 : seulement ce qui est gagné, jamais le plafond ni le nombre d'unités possibles). Rien si le jeu n'a pas de gain d'AP dans le catalogue. */
  function apCredites(j,jeu){
    const l=j&&j.systemes&&Array.isArray(j.systemes.systems)?j.systemes.systems:[];
    const s=l.find(function(x){return x&&x.id==='scummvm';});
    const d=s&&((s.state&&s.state.data)||s.data);
    const e=d&&d.jeux&&jeu&&d.jeux[jeu.id];
    const n=Math.floor(Number(e&&e.apCredite));
    return n>0?n:0;
  }
  function apGagnes(j){
    if(!jeuCourant||!jeuCourant.ap)return '';
    const P=progresMod();
    if(P&&P.tropheesDe(jeuCourant.id)!==null)return '';   /* jeu avec une liste de trophées (ou liste en cours de lecture) : le total est dans le bloc des trophées, rien tant qu'aucun n'est obtenu */
    return '<div class="scv-ap"><span>AP gagnés avec ce jeu :</span> <b>'+esc(String(apCredites(j,jeuCourant)))+'</b></div>';
  }

  function page(j){
    if(!estOuvert())return '';
    difficulteCourante=difficulteDe(j);
    chargerCatalogue();
    if(catalogue!==null)jeuCourant=choisirJeu(catalogue,difficulteCourante);
    const REG=window.__SOREAL_IDLE_REG__||{};
    const entete=typeof REG.entetePageIdleV28_==='function'?REG.entetePageIdleV28_('🕹️ Énigmes',''):'';
    return entete+'<div class="scv-page"><div id="scvZoneV1" class="scv-zone" data-morph-vivant></div>'+apGagnes(j)+'<div id="scvTropheesV1" class="scv-troph" data-morph-vivant></div>'+
      '<div><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__scvPleinEcran__()">⛶ Plein écran</button></div></div>';
  }

  window.__SOREAL_IDLE_SCUMMVM_PAGE_V1__={page:page,choisirJeu:choisirJeu,urlLancement:urlLancement,CLE_ETAT:CLE_ETAT,dossierDe:dossierDe,apCredites:apCredites,majTrophees:majTrophees,tropheesObtenus:tropheesObtenus};
})();
