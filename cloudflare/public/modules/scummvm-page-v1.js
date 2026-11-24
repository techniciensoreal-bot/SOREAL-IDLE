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

  /* Fichiers PROTÉGÉS par compte (Norman, 2026-11-22 : « donne l'accès au jeu à mon compte uniquement ») : tout passe par /api/idle/scummvm/<jeton>/… ; le jeton vient de POST /api/v1/scummvm-acces (voir plus bas). Sans jeton : la racine nue (le serveur répond 404). */
  const RACINE='/api/idle/scummvm/';
  let jetonFichiers='',jetonExpire=0;
  function BASE(){return jetonFichiers?RACINE+jetonFichiers+'/':RACINE;}
  window.__SOREAL_IDLE_SCUMMVM_BASE_V1__=BASE;
  const CLE_ETAT='soreal_idle_scummvm_etat_v1';
  /* Difficultés du moteur (state.difficulty) -> difficultés du catalogue ; repli sur la difficulté inférieure. */
  const DIFF_CATALOGUE={normal:'normal',difficile:'evil',extreme:'sadistic'};
  const ORDRE_DIFF=['normal','evil','sadistic'];

  let iframeSrcLe=0,relancesMoteur=0;   /* relance automatique d'un moteur resté muet (voir attendrePret) */
  let catalogue=null;      /* null = pas encore lu ; [] = aucun jeu ; [..] = jeux */
  let catalogueEnCours=false,catalogueEssaiLe=0;   /* un échec de lecture n'est JAMAIS mémorisé : nouvel essai au redessin suivant, 5 s au moins après (2026-11-23 : « parfois le jeu ne démarre pas, il faut recharger la page ») */
  let difficulteCourante='normal';
  let jeuCourant=null;
  let host=null,iframe=null,cover=null,btnQuitter=null,barrePlein=null;
  let gestePage=false;     /* un geste de l'utilisateur a eu lieu : le son peut partir */
  let iframeCharge=false,moteurPret=false,chargeLe=0;
  let pause=false,plein=false,preSuivi=false,preFini=false,attente=0,observeur=null,zoneObservee=null;
  const precharge={octets:0,total:0};

  /* Introduction de Cthulhu à la première arrivée (Norman, 2026-11-24 : « quand on débloque le menu Énigmes, le jeu ne se charge pas tout de suite : Cthulhu fait un speech, puis on clique sur Jouer »). Jouée une seule fois par compte (préférence liée au compte) ; un joueur dont la partie est déjà lancée ne la voit jamais. */
  const CLE_INTRO='soreal_idle_scummvm_intro_v1';
  /* Textes de Norman (2026-11-24) ; le prénom est inséré ici (le dictionnaire ne peut pas traduire une phrase qui contient un nom), donc l'anglais est choisi ici aussi. */
  function nomJoueur(){try{const h=window.__SOREAL_IDLE_META_HOST_V130__,j=h&&typeof h.getIdleEtat==='function'?h.getIdleEtat():null,id=j&&j.identite;return String((id&&(id.nomAffiche||id.pseudo))||'').trim();}catch(_e){return '';}}
  function langueEn(){try{return window.localStorage.getItem('soreal_idle_langue_v1')==='en';}catch(_e){return false;}}
  function introEtapes(){
    const n=nomJoueur(),en=langueEn();
    const T=en?[
      ['Hello again'+(n?', '+n:'')+'!','You have unlocked the Puzzles menu.','arrive'],
      ['Up to 200,000 AP','Thanks to it, you will be able to earn up to 200,000 AP. The further you progress, the bigger the rewards get.','content'],
      ['A piece of advice','My advice: play without a walkthrough. Follow the story, let it carry you, and play with the sound on: this game was made for it. A masterpiece like this is meant to be savoured. Press “Play” when you are ready.','coucou']
    ]:[
      ['Rebonjour'+(n?' '+n:'')+' !','Tu as débloqué le menu Énigmes.','arrive'],
      ['Jusqu’à 200 000 AP','Grâce à lui, tu vas pouvoir récolter jusqu’à 200 000 AP. Plus tu progresseras, plus les gains monteront.','content'],
      ['Un conseil','Je te conseille de le faire sans solution : suis l’histoire, laisse-toi porter, et joue avec le son, ce jeu est fait pour ça. Ce genre de chef-d’œuvre se savoure. Appuie sur « Jouer » quand tu es prêt.','coucou']
    ];
    const ouv=en?['Cthulhu','Wow, a bit too close!']:['Cthulhu','Wow, un peu trop près !'];
    return [{titre:ouv[0],texte:ouv[1],menu:'scummvm',placement:'centre',humeur:'surpris',scene:'proche'}].concat(T.map(function(t,i){const e={titre:t[0],texte:(i===0?t[0]+' ':'')+t[1],menu:'scummvm',placement:'centre',humeur:t[2]};if(i===0)e.scene='eloigne';   /* la bulle de Cthulhu n'affiche que le texte : le salut en fait partie */return e;}));
  }
  let introEnCours=false;
  function introVue(){try{return window.localStorage.getItem(CLE_INTRO)==='1';}catch(_e){return false;}}
  function introAttendue(){return !gestePage&&lire()!=='lance'&&!introVue();}
  function lancerIntro(){
    if(introEnCours||!introAttendue())return;
    const T=window.__SOREAL_IDLE_TUTORIEL_V1__;
    if(!T||typeof T.jouer!=='function'){try{window.localStorage.setItem(CLE_INTRO,'1');}catch(_e){}return;}   /* sans le module du tutoriel : pas d'introduction, « Jouer » reste disponible */
    introEnCours=true;
    const fin=function(){introEnCours=false;try{window.localStorage.setItem(CLE_INTRO,'1');}catch(_e){}try{majCouverture();}catch(_e){}};
    const ok=T.jouer({id:'scummvm-intro',titre:'Énigmes',vuId:'scummvm-intro',mascotte:true,etapes:introEtapes()},{apresFin:fin});
    if(!ok)fin();
  }
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
  /* TÉLÉPHONE : le son crépitait sur téléphone et pas sur PC (Norman, 2026-11-23). La musique du jeu est émulée (carte AdLib, OPL) : sur un processeur de téléphone le moteur n'arrive pas à remplir le tampon audio à temps. Deux réglages ScummVM
     plus légers, appliqués SEULEMENT sur un appareil tactile : émulateur OPL le plus léger (opl_driver=db, option de ligne de commande) et un tampon audio plus grand (audio_buffer_size dans scummvm.ini). Réglages non mesurés sur un vrai téléphone : à ajuster. */
  function appareilTactile(){try{return Boolean(window.matchMedia&&window.matchMedia('(pointer:coarse)').matches)||((navigator.maxTouchPoints||0)>1&&'ontouchstart' in window);}catch(_e){return false;}}
  const REGLAGES_INI_TACTILE={audio_buffer_size:'8192',output_rate:'22050'};
  /* TÉLÉPHONE, SON (Norman, 2026-11-24 : « il faut que les sons soient joués, juste les voix ça ne va pas ; le MIDI fait craquer ») : la musique est TOUJOURS jouée, par l'émulateur AdLib intégré au jeu (OPL léger, mixage à 22 kHz dans scummvm.ini). Sans pilote imposé, ScummVM choisit tout seul le pilote WebMIDI du navigateur (le moteur contient requestMIDIAccess : c'est la demande « modifier un truc MIDI » vue sur le téléphone) et envoie la musique au synthétiseur du téléphone, lent et saccadé : on le contourne. Choix SOREAL, à confirmer à l'écoute sur un vrai téléphone. */
  function urlLancement(jeu){
    /* --path : ScummVM détecte le jeu par son dossier (mesuré le 2026-11-22 avec Day of the Tentacle) : aucune entrée à écrire dans scummvm.ini, un nouveau jeu n'a besoin que de son dossier sur R2. */
    return BASE()+'moteur/scummvm.html#--path=/data/games/'+dossierDe(jeu).replace(/[^A-Za-z0-9._+()-]/g,'')+(langueJeu()==='en'?' --no-subtitles':' --subtitles')+(appareilTactile()?' --opl-driver=db --music-driver=adlib':'')+' --save-slot=0 '+jeu.cible;   /* Norman, 2026-11-22 : sous-titres en français si le jeu Soreal est en français, désactivés en anglais (--no-subtitles écrase aussi un réglage gardé par ScummVM) */
  }
  function difficulteDe(j){
    const d=j&&j.systemes&&j.systemes.difficulty;
    return d==='extreme'||d==='difficile'?d:'normal';
  }
  function scummvmDebloque(j){
    const l=j&&j.systemes&&Array.isArray(j.systemes.systems)?j.systemes.systems:[];
    return l.some(function(s){return s&&s.id==='scummvm';});
  }

  /* Accès du COMPTE : POST /api/v1/scummvm-acces (jeton de session du joueur) -> {autorise, jeton, expire}. Une requête au démarrage puis au plus toutes les 60 s (jamais de rafale) ; elle renouvelle aussi le jeton
     (le serveur en rend un valable 12 à 24 h : bien avant l'expiration, donc toujours renouvelé plus de 10 minutes avant) ; échec, refus ou session absente = fermé : menu masqué, aucun appel au catalogue ni au moteur.
     Un jeton qui change pendant la partie ne recrée jamais l'iframe : le jeu garde ses fichiers déjà chargés. */
  let ouvert=false,ouvertLeMs=0,ouvertEnCours=false;
  function apkAcces(){const a=window.__SOREAL_IDLE_APK_CONNEXION_V1__;try{return a&&a.acces?a.acces():null;}catch(_e){return null;}}   /* application Android : adresse du serveur et jeton du compte (comme profil-badavatar-v1.js) */
  function jetonSession(){
    try{const s=window.sessionStorage.getItem('soreal_idle_session_v1');if(s)return String(s);}catch(_e){}
    try{const g=JSON.parse(window.localStorage.getItem('soreal_idle_google_session_v1')||'null');if(g&&g.token)return String(g.token);}catch(_e){}
    try{return String(window.localStorage.getItem('horsligne_soreal_jeton_v1')||'');}catch(_e){return '';}
  }
  /* L'APK hors ligne (pont window.AndroidSoreal) ne relaie pas encore les fichiers du jeu (moteur, jeux) : le menu y reste CACHÉ plutôt que cassé (2026-11-22). Le site (navigateur, application TWA) fonctionne ; l'exe Windows (pont window.sorealDesktop) les relaie depuis le serveur (desktop/src/liaison.mjs, 2026-11-24). */
  function horsSite(){try{return Boolean(window.AndroidSoreal);}catch(_e){return false;}}
  function interroger(){
    if(horsSite()){ouvert=false;ouvertLeMs=Date.now();return;}
    if(ouvertEnCours)return;
    ouvertEnCours=true;ouvertLeMs=Date.now();
    const a=apkAcces(),t=a?a.jeton:jetonSession();
    const fermer=function(){return {autorise:false};};
    if(!t)ouvertLeMs=Date.now()-50000;   /* pas encore de session (connexion en cours) : aucune requête, nouvel essai dans 10 s */
    (t?fetch((a?a.base:'')+'/api/v1/scummvm-acces',{method:'POST',cache:'no-store',headers:{'content-type':'application/json',authorization:'Bearer '+t},body:'{}'}).then(function(r){return r.ok?r.json():fermer();}).catch(fermer):Promise.resolve(fermer())).then(function(d){
      const nouveau=Boolean(d&&d.autorise===true&&typeof d.jeton==='string'&&d.jeton);
      ouvertEnCours=false;
      if(nouveau){jetonFichiers=d.jeton;jetonExpire=Number(d.expire)||0;}else{jetonFichiers='';jetonExpire=0;}
      ouvert=nouveau;   /* le menu apparaît au prochain rendu normal (synchro), sans rendu forcé */
    });
  }
  function estOuvert(){
    /* renouvelé au plus toutes les 60 s, et aussitôt si le jeton expire dans moins de 10 minutes */
    if(!ouvertLeMs||Date.now()-ouvertLeMs>60000||(ouvert&&jetonExpire&&jetonExpire*1000-Date.now()<600000&&Date.now()-ouvertLeMs>5000))interroger();
    return ouvert;
  }
  window.__SOREAL_IDLE_SCUMMVM_OUVERT_V1__=estOuvert;
  interroger();   /* une requête au démarrage */
  function chargerCatalogue(){
    if(catalogue!==null||catalogueEnCours||Date.now()-catalogueEssaiLe<5000)return;
    catalogueEnCours=true;catalogueEssaiLe=Date.now();
    fetch(BASE()+'jeux.json').then(function(r){return r.ok?r.json():null;}).catch(function(){return null;}).then(function(d){
      catalogueEnCours=false;
      if(!d||!Array.isArray(d.jeux))return;   /* échec : catalogue toujours « pas encore lu », on réessaiera */
      catalogue=d.jeux;
      jeuCourant=choisirJeu(catalogue,difficulteCourante);
      majCouverture();
      /* REMISE À ZÉRO UNIQUE par compte (Norman, 2026-11-24 : « reset le menu Énigmes pour moi, comme si je venais de le débloquer ») : partie effacée (appareil et serveur), suivi remis à zéro, état « Jouer » et introduction de Cthulhu rejoués ; les AP déjà crédités sont retirés par le moteur (version 3 des crédits). Repère lié au compte : une seule fois. */
      try{if(window.localStorage.getItem('soreal_idle_scummvm_reinit_v3')!=='1'){window.localStorage.setItem('soreal_idle_scummvm_reinit_v3','1');window.setTimeout(recommencer,0);}}catch(_e){}
      try{synchroniser();}catch(_e){}   /* le jeu est connu : la reprise directe (afficher) peut se faire sans attendre un redessin de la page */
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
      precharger(jeuCourant).then(function(){preFini=true;majCouverture();});   /* fichiers en cache seulement : le jeu ne démarre JAMAIS en arrière-plan (Norman, 2026-11-24) */
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
    const racine=BASE()+'moteur/';
    const fichiers=[racine+'scummvm.html',racine+'scummvm.js',racine+'scummvm.wasm',racine+'data/index.json'];
    const dossier=BASE()+'jeux/'+encodeURIComponent(dossierDe(jeu))+'/';
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

  /* ---------- boutons de touches (Norman, 2026-11-23 : « des boutons de l'interface Soreal IDLE à la place des raccourcis clavier du jeu, téléphone et PC ») ----------
     Touches MESURÉES dans le vrai jeu (Day of the Tentacle, version française, ScummVM) en envoyant chaque touche et en lisant la ligne de phrase : O Ouvrir, G Donner, C Fermer, P Prendre, L Regarder, T Parler à, U Utiliser, S Pousser, Y Tirer ;
     Échap passe la scène, Espace met en pause, F5 ouvre le menu du jeu. Version anglaise : lettres des verbes non mesurées, donc aucun bouton (jamais de touche devinée). */
  const TOUCHES_TENTACLE_FR=[
    {n:'⏸ Pause',key:' ',code:'Space',kc:32},{n:'☰ Menu (F5)',key:'F5',code:'F5',kc:116},
    {n:'',special:'sensibilite'}
  ];
  /* SOURIS ÉMULÉE LENTE (Norman, 2026-11-23 : « la sensibilité de la souris émulée sur téléphone beaucoup plus lente ») : en mode pavé tactile ScummVM déplace le curseur du même déplacement que le doigt ; on RALENTIT ce déplacement en
     réécrivant les événements tactiles AVANT le moteur (dans la fenêtre du jeu, phase de capture) : la position transmise = position de départ + déplacement du doigt × facteur. Facteur 0,3 par défaut (« beaucoup plus lente »), 1 = normal ;
     choix SOREAL (non publié), bouton « Souris » pour alterner, préférence liée au compte (clé soreal_idle_scummvm_sensibilite_v1). Les appuis (clic) ne sont pas modifiés. */
  const CLE_SENS='soreal_idle_scummvm_sensibilite_v1',FACTEUR_LENT=0.3;
  function facteurSouris(){try{return window.localStorage.getItem(CLE_SENS)==='1'?1:FACTEUR_LENT;}catch(_e){return FACTEUR_LENT;}}
  /*
   * PAVÉ TACTILE (Norman, 2026-11-24 : « sur téléphone, une zone vide sous le jeu à côté du bouton Menu : je voudrais un carré qui serve de track pad dans le jeu »). Appareils tactiles seulement : un carré sous le jeu ; le doigt qui glisse dessus DÉPLACE le curseur du jeu (mouvement relatif,
   * comme un pavé d'ordinateur portable), un appui bref clique, un appui long fait un clic droit. Le doigt ne cache donc jamais le jeu.
   * Comment : le moteur (ScummVM / SDL3) lit des PointerEvent sur son canvas (mesuré le 2026-11-24 : pointerenter + pointermove déplacent le curseur et changent le survol ; les MouseEvent et TouchEvent simulés sont ignorés) ; on lui envoie donc des PointerEvent
   * (type « mouse ») dans la fenêtre du jeu (même origine). Le nœud du pavé est persistant (data-morph-vivant) ; les écouteurs sont sur le document (règle n°4 : rien à remettre après un redessin).
   */
  function htmlPad(){return appareilTactile()&&jeuCourant?'<div id="scvPadV1" class="scv-pad" data-morph-vivant role="application" aria-label="Pavé tactile"><span class="scv-pad-aide">Pavé tactile</span></div>':'';}
  const PAD={id:null,x:0,y:0,t:0,bouge:0,cx:null,cy:null,minuterie:0,droit:false,entre:null};
  function cibleJeu(){
    const w=fenetreJeu();let c=null;
    try{c=w&&w.document&&w.document.getElementById('canvas');}catch(_e){c=null;}
    return w&&c&&typeof w.PointerEvent==='function'?{w:w,c:c}:null;
  }
  function evPointeur(w,type,x,y,o){
    return new w.PointerEvent(type,Object.assign({pointerId:77,pointerType:'mouse',isPrimary:true,clientX:x,clientY:y,screenX:x,screenY:y,bubbles:true,cancelable:true,view:w,width:1,height:1},o||{}));
  }
  function envoyerAuJeu(type,x,y,o){
    const g=cibleJeu();if(!g)return;
    try{
      if(PAD.entre!==g.w){PAD.entre=g.w;g.c.dispatchEvent(evPointeur(g.w,'pointerenter',x,y,{bubbles:false}));}
      g.c.dispatchEvent(evPointeur(g.w,type,x,y,o));
    }catch(_e){}
  }
  function limitesJeu(){const g=cibleJeu();return g?{w:Math.max(1,g.w.innerWidth||g.c.clientWidth||320),h:Math.max(1,g.w.innerHeight||g.c.clientHeight||240)}:null;}
  function cliquerAuJeu(bouton){
    const l=limitesJeu();if(!l)return;
    if(PAD.cx==null){PAD.cx=l.w/2;PAD.cy=l.h/2;}
    const b=bouton===2?2:0,m=bouton===2?2:1;
    envoyerAuJeu('pointermove',PAD.cx,PAD.cy,{buttons:0});
    envoyerAuJeu('pointerdown',PAD.cx,PAD.cy,{button:b,buttons:m});
    window.setTimeout(function(){envoyerAuJeu('pointerup',PAD.cx,PAD.cy,{button:b,buttons:0});},40);
  }
  function surPad(e){return e&&e.target&&e.target.closest?e.target.closest('#scvPadV1'):null;}
  document.addEventListener('pointerdown',function(e){
    const p=surPad(e);if(!p||PAD.id!==null)return;
    e.preventDefault();
    PAD.id=e.pointerId;PAD.x=e.clientX;PAD.y=e.clientY;PAD.t=Date.now();PAD.bouge=0;PAD.droit=false;
    try{p.setPointerCapture(e.pointerId);}catch(_e){}
    const l=limitesJeu();if(l&&PAD.cx==null){PAD.cx=l.w/2;PAD.cy=l.h/2;}
    if(PAD.minuterie)window.clearTimeout(PAD.minuterie);
    PAD.minuterie=window.setTimeout(function(){PAD.minuterie=0;if(PAD.id!==null&&PAD.bouge<8){PAD.droit=true;cliquerAuJeu(2);}},450);   /* appui long immobile : clic droit */
  },true);
  document.addEventListener('pointermove',function(e){
    if(PAD.id===null||e.pointerId!==PAD.id)return;
    const p=document.getElementById('scvPadV1'),l=limitesJeu();if(!p||!l)return;
    e.preventDefault();
    const dx=e.clientX-PAD.x,dy=e.clientY-PAD.y;PAD.x=e.clientX;PAD.y=e.clientY;PAD.bouge+=Math.abs(dx)+Math.abs(dy);
    const base=(l.w/Math.max(40,p.clientWidth))*(facteurSouris()===1?1.1:0.7);   /* traverser le pavé = environ 70 % de la largeur du jeu (souris lente) ou 110 % (souris normale) */
    PAD.cx=Math.max(0,Math.min(l.w-1,PAD.cx+dx*base));PAD.cy=Math.max(0,Math.min(l.h-1,PAD.cy+dy*base));
    envoyerAuJeu('pointermove',PAD.cx,PAD.cy,{buttons:0,movementX:dx*base,movementY:dy*base});
  },true);
  function finPad(e){
    if(PAD.id===null||e.pointerId!==PAD.id)return;
    PAD.id=null;if(PAD.minuterie){window.clearTimeout(PAD.minuterie);PAD.minuterie=0;}
    if(e.type==='pointerup'&&!PAD.droit&&PAD.bouge<8&&Date.now()-PAD.t<350)cliquerAuJeu(0);   /* appui bref : clic gauche */
  }
  document.addEventListener('pointerup',finPad,true);
  document.addEventListener('pointercancel',finPad,true);
  function libelleSens(){return facteurSouris()===1?'🖱 Souris normale':'🖱 Souris lente';}
  function installerSouris(w){
    try{
      /* Écouteurs sur le DOCUMENT du jeu, repère posé sur lui (Norman, 2026-11-24 : « la souris lente ne change rien ») : la fenêtre du premier chargement (about:blank) est RÉUTILISÉE par le vrai document, qui efface ses écouteurs mais garde le repère posé sur elle : le filtre n'était alors jamais réinstallé. */
      const d=w&&w.document;
      if(!d||d.__scvSens||!w.TouchEvent||!w.Touch)return;
      d.__scvSens=true;
      const virt={},dern={};let synth=false;
      const filtre=function(e){
        if(synth||(!e.isTrusted&&!w.__scvTest))return;
        const k=facteurSouris();if(k===1)return;
        const liste=function(tl){return Array.prototype.map.call(tl,function(t){
          const id=t.identifier;
          if(e.type==='touchstart'||!virt[id]){virt[id]={x:t.clientX,y:t.clientY};dern[id]={x:t.clientX,y:t.clientY};}
          else if(e.type==='touchmove'){virt[id].x+=(t.clientX-dern[id].x)*k;virt[id].y+=(t.clientY-dern[id].y)*k;dern[id]={x:t.clientX,y:t.clientY};}
          return new w.Touch({identifier:id,target:t.target,clientX:virt[id].x,clientY:virt[id].y,pageX:virt[id].x+w.pageXOffset,pageY:virt[id].y+w.pageYOffset,screenX:t.screenX,screenY:t.screenY,radiusX:t.radiusX,radiusY:t.radiusY,force:t.force});
        });};
        const touches=liste(e.touches),changed=liste(e.changedTouches),cibles=liste(e.targetTouches);
        if(e.type==='touchend'||e.type==='touchcancel')Array.prototype.forEach.call(e.changedTouches,function(t){delete virt[t.identifier];delete dern[t.identifier];});
        e.stopImmediatePropagation();if(e.cancelable)e.preventDefault();
        synth=true;
        try{e.target.dispatchEvent(new w.TouchEvent(e.type,{touches:touches,targetTouches:cibles,changedTouches:changed,bubbles:true,cancelable:true,view:w,ctrlKey:e.ctrlKey,shiftKey:e.shiftKey,altKey:e.altKey,metaKey:e.metaKey}));}
        finally{synth=false;}
      };
      ['touchstart','touchmove','touchend','touchcancel'].forEach(function(t){d.addEventListener(t,filtre,{capture:true,passive:false});});
    }catch(_e){}
  }
  function touchesDuJeu(){
    if(!jeuCourant)return null;
    return TOUCHES_TENTACLE_FR.filter(function(x){return x.special!=='sensibilite'||appareilTactile();});   /* souris lente : appareils tactiles seulement */
  }
  function htmlTouches(classe){
    const t=touchesDuJeu();if(!t)return '';
    return '<div class="'+classe+'">'+t.map(function(x,i){return '<button type="button" class="scv-touche"'+(x.special==='sensibilite'?' data-sens="1"':'')+' onmousedown="event.preventDefault()" onclick="window.__scvTouche__('+i+')">'+esc(x.special==='sensibilite'?libelleSens():x.n)+'</button>';}).join('')+'</div>';
  }
  /* Envoie la touche au jeu (événements clavier dans la fenêtre du jeu, même origine : le moteur les lit comme une vraie frappe). */
  window.__scvTouche__=function(i){
    try{
      const t=touchesDuJeu(),x=t&&t[i],w=fenetreJeu();
      if(x&&x.special==='sensibilite'){try{window.localStorage.setItem(CLE_SENS,facteurSouris()===1?'0':'1');}catch(_e){}Array.prototype.forEach.call(document.querySelectorAll('[data-sens]'),function(b){b.textContent=libelleSens();});return;}
      if(!x||!w||!w.document)return;
      const cible=w.document.activeElement||w.document.body;
      ['keydown','keyup'].forEach(function(type){
        const e=new w.KeyboardEvent(type,{key:x.key,code:x.code,bubbles:true,cancelable:true});
        try{Object.defineProperty(e,'keyCode',{get:function(){return x.kc;}});Object.defineProperty(e,'which',{get:function(){return x.kc;}});}catch(_e){}
        cible.dispatchEvent(e);
      });
    }catch(_e){}
  };

  /* ---------- hôte, iframe, couverture ---------- */
  /* Relance le moteur dans le même iframe (changement de réglage du son) : la partie reprend à la dernière sauvegarde automatique. */
  function relancerMoteur(){
    if(!iframe||!jeuCourant)return;
    const u=urlLancement(jeuCourant),ifr=iframe;
    try{ifr.src='about:blank';}catch(_e){}
    window.setTimeout(function(){if(iframe===ifr){iframeSrcLe=Date.now();ifr.src=u;}},400);
  }
  function creerHote(){
    if(host)return;
    host=document.createElement('div');host.id='scvHoteV1';host.className='scv-cache';host.setAttribute('data-morph-garder','');
    cover=document.createElement('div');cover.className='scv-couv';
    btnQuitter=document.createElement('button');btnQuitter.type='button';btnQuitter.className='scv-quitter';btnQuitter.textContent='✕';btnQuitter.setAttribute('aria-label','Quitter le plein écran');
    btnQuitter.addEventListener('click',function(){pleinEcran(false);});
    host.appendChild(cover);host.appendChild(btnQuitter);
    barrePlein=document.createElement('div');barrePlein.className='scv-touches-plein';host.appendChild(barrePlein);
    document.body.appendChild(host);
    cover.addEventListener('click',function(e){const b=e.target&&e.target.closest&&e.target.closest('button');if(b)jouer();});
    majCouverture();
  }
  function majBarrePlein(){if(barrePlein)barrePlein.innerHTML=htmlTouches('scv-touches-rang');}
  function majCouverture(){
    if(!cover)return;
    if(catalogue!==null&&!jeuCourant){cover.innerHTML='<b>Aucun jeu disponible pour l’instant.</b>';return;}
    if(!jeuCourant){cover.innerHTML='<b>Chargement…</b>';return;}
    const nom=esc(jeuCourant.nom||'');
    if(!gestePage&&introEnCours){cover.innerHTML='<b>'+nom+'</b>';return;}   /* Cthulhu parle d'abord : pas de bouton « Jouer » avant la fin de son introduction */
    if(!gestePage){cover.innerHTML='<b>'+nom+'</b><button type="button" class="soreal-idle-expand-button-v25">▶ Jouer</button>';return;}
    const pct=precharge.total>0?Math.min(100,Math.round(precharge.octets/precharge.total*100)):0;
    cover.innerHTML='<b>'+nom+'</b><div class="scv-barre"><i style="width:'+(preFini?100:pct)+'%"></i></div><span>Chargement…</span>';
  }
  function couvrir(oui){if(cover)cover.style.display=oui?'flex':'none';}

  /* Écrit autosave_period=15 dans /home/web_user/scummvm.ini (base IndexedDB d'IDBFS, table FILE_DATA) si la config existe déjà (un profil neuf la reçoit déjà réglée du moteur sur R2) ; au plus 1,5 s d'attente, jamais d'erreur. */
  /* Sauvegarde automatique rapprochée : des objets pris puis donnés ou utilisés en quelques secondes (diamant, badge, boule de poussière, etc.) échappaient au suivi avec 15 s (Norman, 2026-11-23 : « j'ai eu tous les objets cités »). 5 s sur ordinateur, 10 s sur téléphone (le son y craque déjà ; une écriture de sauvegarde coûte). */
  const AUTOSAVE_S=appareilTactile()?3:1,CLE_INI='/home/web_user/scummvm.ini';
  function reglerAutosave(){
    return new Promise(function(resolve){
      let fini=false;
      const fin=function(){if(!fini){fini=true;resolve();}};
      window.setTimeout(fin,1500);
      try{
        window.indexedDB.databases().then(function(l){
          if(!(l||[]).some(function(d){return d&&d.name==='/home/web_user';}))return fin();
          const rq=window.indexedDB.open('/home/web_user');
          rq.onerror=fin;rq.onblocked=fin;
          rq.onsuccess=function(){
            const db=rq.result;
            const clore=function(){try{db.close();}catch(_e){}fin();};
            try{
              if(!db.objectStoreNames.contains('FILE_DATA'))return clore();
              const g=db.transaction('FILE_DATA','readonly').objectStore('FILE_DATA').get(CLE_INI);
              g.onerror=clore;
              g.onsuccess=function(){
                const v=g.result;
                if(!v||!v.contents)return clore();
                let txt=new TextDecoder().decode(v.contents);
                const reglages=Object.assign({autosave_period:String(AUTOSAVE_S)},appareilTactile()?REGLAGES_INI_TACTILE:{});
                let change=false;
                Object.keys(reglages).forEach(function(cle){
                  const ligne=cle+'='+reglages[cle];
                  const motif=new RegExp(cle+'=[0-9]+');
                  const m=motif.exec(txt);
                  if(m&&m[0]===ligne)return;
                  change=true;
                  txt=m?txt.replace(motif,ligne):txt.replace('[scummvm]','[scummvm]'+String.fromCharCode(10)+ligne);
                });
                if(!change)return clore();   /* déjà réglé */
                v.contents=new TextEncoder().encode(txt);v.timestamp=new Date();
                const tx=db.transaction('FILE_DATA','readwrite');
                tx.objectStore('FILE_DATA').put(v,CLE_INI);
                tx.oncomplete=clore;tx.onerror=clore;tx.onabort=clore;
              };
            }catch(_e){clore();}
          };
        },fin);
      }catch(_e){fin();}
    });
  }
  function creerIframe(cache){
    if(iframe||!jeuCourant||!jetonFichiers)return;   /* sans jeton valide : rien (le serveur répondrait 404) ; l'iframe est créé au prochain affichage */
    creerHote();
    iframe=document.createElement('iframe');
    window.__SOREAL_IDLE_SCUMMVM_FENETRE_V1__=function(){try{return iframe&&iframe.contentWindow;}catch(_e){return null;}};   /* lecture directe de l'autosave en mémoire par scummvm-progres-v1.js */
    iframe.setAttribute('allow','autoplay; fullscreen');
    iframe.setAttribute('title',jeuCourant.nom||'');
    iframe.style.touchAction='none';
    iframe.addEventListener('load',function(){iframeCharge=true;chargeLe=Date.now();espionnerAudio();installerSouris(fenetreJeu());suivrePause(fenetreJeu());});
    host.insertBefore(iframe,cover);
    calerDecor();
    /* Autosave rapproché (Norman, 2026-11-22 : un objet pris puis perdu dans la minute n'était pas vu avec 60 s) : le réglage autosave_period de ScummVM est écrit dans sa config (IndexedDB) AVANT le lancement ; sans IndexedDB on lance tout de suite. */
    const lancer=function(){if(iframe&&!iframe.src){iframeSrcLe=Date.now();iframe.src=urlLancement(jeuCourant);}};
    /* Sauvegardes liées au compte (modules/scummvm-sync-v1.js, Norman, 2026-11-22) : la reprise de la dernière partie du compte (autre appareil) se fait AVANT le lancement (3 s au plus, jamais d'erreur), le suivi (envoi des fichiers changés) après. */
    const reprise=function(){const S=window.__SOREAL_IDLE_SCUMMVM_SYNC_V1__;try{return S?S.reprendre(jeuCourant):Promise.resolve();}catch(_e){return Promise.resolve();}};
    const apres=function(){if(!window.indexedDB||typeof window.indexedDB.databases!=='function')lancer();else reglerAutosave().then(lancer,lancer);};
    reprise().then(apres,apres);
    try{const S=window.__SOREAL_IDLE_SCUMMVM_SYNC_V1__;if(S)S.suivre(jeuCourant);}catch(_e){}
    /* AP par progrès (modules/scummvm-progres-v1.js) : un minuteur de 10 s lit l'autosave du jeu tant que la page vit. */
    try{const P=window.__SOREAL_IDLE_SCUMMVM_PROGRES_V1__;if(P)P.demarrer(jeuCourant,dossierDe(jeuCourant));}catch(_e){}
    /* Tactile : AUCUNE couche au-dessus du jeu (2026-11-23). La couche précédente envoyait des événements de souris SIMULÉS, que ScummVM ignore (mesuré : le clic réel passe, le clic simulé non) ; un toucher natif sur l'iframe devient un vrai clic de souris pour le navigateur. */
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
  /* JEU en pause quand on quitte l'onglet ou la page (Norman, 2026-11-24) : la touche Espace du jeu BASCULE la pause ; on suit donc l'état (frappes du joueur, de la barre de touches et les nôtres) pour ne jamais inverser une pause que le joueur a lui-même mise. Au retour, on ne relâche que la pause que NOUS avons posée. */
  let jeuEnPause=false,geleParNous=false,frappeNous=false;
  function frappeEspace(w){
    try{
      const cible=w.document.activeElement||w.document.body;frappeNous=true;
      ['keydown','keyup'].forEach(function(type){
        const e=new w.KeyboardEvent(type,{key:' ',code:'Space',bubbles:true,cancelable:true});
        try{Object.defineProperty(e,'keyCode',{get:function(){return 32;}});Object.defineProperty(e,'which',{get:function(){return 32;}});}catch(_e){}
        cible.dispatchEvent(e);
      });
    }catch(_e){}
    frappeNous=false;
  }
  function geler(oui){
    const w=fenetreJeu();if(!w||!w.document||!iframe||!moteurPret)return;
    if(oui){if(jeuEnPause||geleParNous)return;frappeEspace(w);jeuEnPause=true;geleParNous=true;}
    else if(geleParNous){if(jeuEnPause)frappeEspace(w);jeuEnPause=false;geleParNous=false;}
  }
  function suivrePause(w){
    try{w.document.addEventListener('keydown',function(e){if(frappeNous||e.repeat)return;if(e.key===' '||e.code==='Space'){jeuEnPause=!jeuEnPause;if(!jeuEnPause)geleParNous=false;}},true);}catch(_e){}
    jeuEnPause=false;geleParNous=false;
  }
  document.addEventListener('visibilitychange',function(){
    try{if(document.hidden)geler(true);else if(host&&!host.classList.contains('scv-cache'))geler(false);}catch(_e){}
  });
  function suspendre(oui){
    if(oui)geler(true);else geler(false);
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

  /* ---------- « Recommencer la partie » (Norman, 2026-11-23 : « tu peux effacer ma partie… je dois tout recommencer pour que tu suives l'avancée ») ----------
     Confirmation DANS la page en deux étapes (jamais alert/confirm natifs) : « Recommencer la partie » -> « Effacer ma partie ? » + « Oui, effacer » + « Annuler » ; retour à l'état normal après 8 s sans action
     (UN SEUL setTimeout, jamais de minuterie en boucle). « Oui » : l'ancien iframe est retiré (il ne doit plus écrire de sauvegarde), le serveur puis l'appareil effacent (scummvm-sync-v1.js), le suivi est remis à zéro
     (scummvm-progres-v1.js), puis un iframe NEUF est créé (même hôte, même couverture : l'écran « Jouer » revient). C'est le SEUL cas où l'iframe est recréé. Règle n°4 : nœud persistant (data-morph-vivant) rempli ici,
     ses boutons portent data-morph-garder. Aucun texte de progression. */
  const TEXTE_RECOMMENCER='Recommencer la partie',TEXTE_CONFIRMER='Effacer ma partie ?',TEXTE_OUI='Oui, effacer',TEXTE_NON='Annuler',TEXTE_ERREUR_EFFACER='Impossible d’effacer pour l’instant, réessaie.';
  const DELAI_CONFIRMATION_MS=8000;
  let rNoeud=null,rEtape=0,rOccupe=false,rTimer=0,rErreur=false,rB={};
  function rMaj(){
    if(!rNoeud||!rB.recom)return;
    const montre=function(e,oui){const v=oui?'':'none';if(e.style.display!==v)e.style.display=v;};
    montre(rB.recom,rEtape===0);montre(rB.question,rEtape===1);montre(rB.oui,rEtape===1);montre(rB.non,rEtape===1);montre(rB.erreur,rErreur&&rEtape===0);
    rB.recom.disabled=rOccupe;rB.oui.disabled=rOccupe;rB.non.disabled=rOccupe;
  }
  function rEtapeVers(n){
    if(rTimer){window.clearTimeout(rTimer);rTimer=0;}
    rEtape=n;
    if(n===1)rTimer=window.setTimeout(function(){rTimer=0;if(!rOccupe){rEtape=0;rMaj();}},DELAI_CONFIRMATION_MS);
    rMaj();
  }
  function rBouton(texte,classe,f){
    const b=document.createElement('button');b.type='button';b.className=classe;b.textContent=texte;b.setAttribute('data-morph-garder','');
    b.addEventListener('click',f);return b;
  }
  function majRecommencer(){
    const noeud=document.getElementById('scvRecomV1');
    if(!noeud)return;
    if(!jeuCourant){while(noeud.firstChild)noeud.removeChild(noeud.firstChild);rNoeud=null;rB={};return;}   /* visible seulement quand un jeu est affiché */
    if(noeud!==rNoeud||!rB.recom||!rB.recom.isConnected){
      while(noeud.firstChild)noeud.removeChild(noeud.firstChild);
      rB={};
      rB.recom=rBouton(TEXTE_RECOMMENCER,'soreal-idle-expand-button-v25',function(){rErreur=false;rEtapeVers(1);});
      rB.question=document.createElement('span');rB.question.className='scv-recom-q';rB.question.textContent=TEXTE_CONFIRMER;rB.question.setAttribute('data-morph-garder','');
      rB.oui=rBouton(TEXTE_OUI,'soreal-idle-expand-button-v25',function(){recommencer();});
      rB.non=rBouton(TEXTE_NON,'soreal-idle-expand-button-v25',function(){if(!rOccupe)rEtapeVers(0);});
      rB.erreur=document.createElement('span');rB.erreur.className='scv-recom-err';rB.erreur.setAttribute('role','status');rB.erreur.textContent=TEXTE_ERREUR_EFFACER;rB.erreur.setAttribute('data-morph-garder','');
      [rB.recom,rB.question,rB.oui,rB.non,rB.erreur].forEach(function(e){noeud.appendChild(e);});
      rNoeud=noeud;
    }
    rMaj();
  }
  function recommencer(){
    if(rOccupe||!jeuCourant)return;
    rOccupe=true;rMaj();
    if(rTimer){window.clearTimeout(rTimer);rTimer=0;}
    const jeu=jeuCourant;
    /* l'ancien iframe disparaît d'abord : il ne doit plus écrire de sauvegarde pendant ni après l'effacement */
    if(iframe){try{if(iframe.parentNode)iframe.parentNode.removeChild(iframe);}catch(_e){}}
    iframe=null;iframeCharge=false;moteurPret=false;chargeLe=0;pause=false;gestePage=false;ecrire('');   /* le jeu repart de zéro : « Jouer » est redemandé */
    try{window.localStorage.removeItem(CLE_INTRO);}catch(_e){}   /* et Cthulhu refait son introduction */
    const S=window.__SOREAL_IDLE_SCUMMVM_SYNC_V1__,P=progresMod();
    const fin=function(res){
      /* COMPTEUR CUMULATIF (Norman, 2026-11-24 : « pas grave s'il faut faire le jeu plusieurs fois pour tout avoir ») : « Recommencer la partie » efface la partie mais GARDE les unités déjà découvertes (dialogues et objets) : en rejouant, on complète ce qu'on a raté, sans que rien soit compté deux fois ni perdu (l'AP déjà crédité ne change pas). Le suivi n'est donc plus remis à zéro ici. */
      rErreur=!(res&&res.ok===true);
      rOccupe=false;rEtape=0;
      /* aucun iframe en arrière-plan : le jeu ne démarre qu'au clic sur « Jouer » (il repart alors de la sauvegarde restante, rien si l'effacement a réussi) */
      majCouverture();couvrir(true);
      try{majRecommencer();majTrophees();}catch(_e){}
    };
    let p;
    try{p=S&&S.effacer?S.effacer(jeu):Promise.resolve({ok:false});}catch(_e){p=Promise.resolve({ok:false});}
    p.then(fin,function(){fin({ok:false});});
  }

  /* ---------- plein écran ---------- */
  function pleinEcran(oui){
    if(!host)return;
    plein=oui;
    host.classList.toggle('scv-plein',oui);
    if(oui)majBarrePlein();
    host.classList.toggle('scv-avec-touches',Boolean(oui&&touchesDuJeu()));
    /* « Plein écran » = le jeu est AGRANDI DANS SON MENU : il remplit la zone de contenu (toute la largeur de la page Énigmes, du bas du bandeau du haut au bas de la fenêtre) ; les menus de Soreal IDLE restent visibles (Norman, 2026-11-24 : « le jeu doit juste être agrandi dans son menu, pas sur toute l'interface »). Jamais le vrai plein écran du navigateur ni un verrouillage d'orientation. Le bouton « Quitter » le referme. */
    if(oui)placerPlein();
    if(!oui)synchroniser();
  }
  window.__scvPleinEcran__=function(){
    if(!host)creerHote();
    pleinEcran(!plein);
  };

  /* ---------- calage sur la zone de la page ---------- */
  /* Zone de contenu du menu : colonne de la page Énigmes (gauche et largeur de .scv-page), sous le bandeau fixe du haut s'il y en a un, jusqu'en bas de la fenêtre. */
  function placerPlein(){
    if(!host)return;
    const p=document.querySelector('.scv-page'),W=window.innerWidth||1000,H=window.innerHeight||700;
    const r=p?p.getBoundingClientRect():null;
    let gauche=0,largeur=W;
    if(r&&r.width>50){gauche=Math.max(0,r.left);largeur=Math.min(W-gauche,r.width);}
    let haut=0;
    try{
      let e=document.elementFromPoint(gauche+largeur/2,4);
      while(e&&e!==document.body){const cs=getComputedStyle(e);if((cs.position==='fixed'||cs.position==='sticky')&&e.id!=='scvHoteV1'){const b=e.getBoundingClientRect().bottom;if(b<H*0.4)haut=Math.max(haut,b+4);break;}e=e.parentElement;}
    }catch(_e){}
    const s=host.style;s.left=gauche+'px';s.top=haut+'px';s.width=largeur+'px';s.height=Math.max(120,H-haut)+'px';
  }
  window.addEventListener('resize',function(){if(plein)placerPlein();});
  function placer(z){
    if(plein){placerPlein();return;}
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
  /* Reprise directe (Norman, 2026-11-23) : le PREMIER lancement exige un clic sur « Jouer » ; ensuite (état 'lance', préférence liée au compte, donc aussi sur un autre appareil) le jeu reprend seul à l'arrivée sur la page, sans clic. Le son part
     parce que la page a déjà reçu un geste de l'utilisateur (le clic qui a ouvert le menu) ; sans geste (rechargement de la page sans clic), l'écran « Jouer » reste. */
  function activationPage(){try{return Boolean(navigator.userActivation&&navigator.userActivation.hasBeenActive);}catch(_e){return false;}}
  /* DÉCOR (Norman, 2026-11-24 : « l'image de fond prend tout le cadre, plus de fond mauve ; le jeu agrandi pour prendre la fenêtre ») : sur grand écran à souris, l'image fond-enigmes-v1.webp (1536 x 1024) COUVRE toute la zone de la page (background-size: cover, centrée) ;
     l'écran du jeu est la fenêtre de l'image mesurée (x 396..1138, y 141..679 : 743 x 539), recalculée ici selon l'échelle « cover » ; le jeu 4:3 est étiré en largeur pour remplir cette fenêtre (jamais rogné : les verbes restent entiers). Téléphone, tablette, petites fenêtres : pas de décor. */
  const DECOR_IMG={w:1536,h:1024,x:396,y:141,lw:743,lh:539};
  function decorActif(){try{return Boolean(window.matchMedia&&window.matchMedia('(min-width:900px) and (hover:hover) and (pointer:fine)').matches);}catch(_e){return false;}}
  function calerDecor(){
    try{
      const d=document.querySelector('.scv-decor'),z=document.getElementById('scvZoneV1');
      if(!d||!z)return;
      if(!decorActif()){
        d.style.height='';z.style.left='';z.style.top='';z.style.width='';z.style.height='';
        if(iframe)iframe.style.transform='';
        return;
      }
      const W=d.clientWidth||Math.round(d.getBoundingClientRect().width),H=Math.max(420,Math.round((window.innerHeight||800)-170));
      if(!(W>50))return;
      const s=Math.max(W/DECOR_IMG.w,H/DECOR_IMG.h),ox=(W-DECOR_IMG.w*s)/2,oy=(H-DECOR_IMG.h*s)/2;
      d.style.height=H+'px';
      z.style.left=Math.round(ox+DECOR_IMG.x*s)+'px';z.style.top=Math.round(oy+DECOR_IMG.y*s)+'px';
      z.style.width=Math.round(DECOR_IMG.lw*s)+'px';z.style.height=Math.round(DECOR_IMG.lh*s)+'px';
      if(iframe&&!plein)iframe.style.transform='scaleX('+((DECOR_IMG.lw/DECOR_IMG.lh)/(4/3)).toFixed(4)+')';
    }catch(_e){}
  }
  function afficher(z){
    calerDecor();
    creerHote();
    if(!gestePage&&jeuCourant&&lire()==='lance'&&activationPage()){gestePage=true;if(!iframe)creerIframe(false);}
    const etait=host.classList.contains('scv-cache');
    placer(z);
    host.classList.remove('scv-cache');
    /* l'iframe existe déjà (préparé en arrière-plan ou vu avant) : on le réveille tout de suite */
    if(etait&&iframe)suspendre(false);
    if(!iframe&&jeuCourant&&gestePage)creerIframe(false);
    if(iframe&&!moteurPret&&moteurEstPret())moteurPret=true;
    couvrir(!jeuCourant||!(gestePage&&moteurPret));
    if(jeuCourant&&introAttendue()){lancerIntro();majCouverture();}
    if(gestePage&&!moteurPret){majCouverture();attendrePret();}
  }
  /* Page ouverte directement sur Énigmes (menu restauré, aucun geste encore) : dès le premier clic ou la première touche, si la partie a déjà été lancée une fois (état 'lance'), la reprise se fait sans cliquer sur « Jouer ». */
  ['click','keydown','touchend'].forEach(function(t){
    window.addEventListener(t,function(){
      if(gestePage||!host||!estVisible()||lire()!=='lance')return;
      window.setTimeout(function(){try{synchroniser();}catch(_e){}},0);
    },{capture:true,passive:true});
  });
  /* « +N AP » qui s'envole du jeu à chaque gain (Norman, 2026-11-24 : « je veux voir l'AP s'envoler comme quand on nettoie le coffre ») : même effet que le nettoyage (nettoyage-ap-v1.js), au centre de la zone de jeu ; le bonus de fin s'envole en doré (« rare »). */
  window.addEventListener('soreal-enigmes-ap',function(e){
    try{
      const N=window.__SOREAL_IDLE_NETTOYAGE_AP_V1__,d=(e&&e.detail)||{};
      if(!N||!(Number(d.ap)>0))return;
      const z=document.getElementById('scvZoneV1'),r=z&&z.getBoundingClientRect();
      const x=r&&r.width?r.left+r.width/2:window.innerWidth/2,y=r&&r.height?r.top+r.height*0.4:window.innerHeight*0.4;
      N.montrer(Number(d.ap),Number(d.bonus)>0,x,y);
    }catch(_e){}
  });
  function recaler(){
    if(!host||plein||!estVisible())return;
    const z=document.getElementById('scvZoneV1');
    if(!z||!z.isConnected){masquer();return;}
    calerDecor();
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
      if(moteurPret){if(estVisible()){couvrir(false);debloquerSon();}return;}
      /* moteur muet depuis 90 s (réseau coupé pendant le téléchargement, page d'erreur dans l'iframe) : UNE relance, sans toucher à la partie (les sauvegardes restent dans IndexedDB) */
      if(iframe&&iframeSrcLe&&relancesMoteur<1&&Date.now()-iframeSrcLe>90000&&jeuCourant){
        relancesMoteur++;iframeSrcLe=Date.now();
        const u=urlLancement(jeuCourant),ifr=iframe;
        try{ifr.src='about:blank';}catch(_e){}
        window.setTimeout(function(){if(iframe===ifr)ifr.src=u;},300);
      }
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
      majRecommencer();
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

  /* AP déjà gagnés avec le jeu courant, affichés « obtenus / plafond » (exception du 2026-11-23 à la règle n°2 : le plafond d'AP est montré, jamais le nombre d'unités possibles). Rien si le jeu n'a pas de gain d'AP dans le catalogue. */
  function apCredites(j,jeu){
    const l=j&&j.systemes&&Array.isArray(j.systemes.systems)?j.systemes.systems:[];
    const s=l.find(function(x){return x&&x.id==='scummvm';});
    const d=s&&((s.state&&s.state.data)||s.data);
    const e=d&&d.jeux&&jeu&&d.jeux[jeu.id];
    const n=Math.floor(Number(e&&e.apCredite));
    return n>0?n:0;
  }
  /* bonus de fin déjà reçu (rien n'est montré avant : le montant n'est pas annoncé) */
  function bonusRecu(j,jeu){
    const l=j&&j.systemes&&Array.isArray(j.systemes.systems)?j.systemes.systems:[];
    const s=l.find(function(x){return x&&x.id==='scummvm';});
    const d=s&&((s.state&&s.state.data)||s.data);
    const e=d&&d.jeux&&jeu&&d.jeux[jeu.id];
    const n=Math.floor(Number(e&&e.bonus));
    return n>0?n:0;
  }
  function apGagnes(j){
    if(!jeuCourant||!jeuCourant.ap)return '';
    const P=progresMod();
    if(P&&P.tropheesDe(jeuCourant.id)!==null)return '';   /* jeu avec une liste de trophées (ou liste en cours de lecture) : le total est dans le bloc des trophées, rien tant qu'aucun n'est obtenu */
    /* Compteur « obtenus / total » (Norman, 2026-11-23 : « un compteur d'AP obtenu, exemple 50/150000 ») : EXCEPTION à la règle n°2, le total d'AP possible de ce jeu est montré (AP seulement : jamais le nombre d'unités ni de trophées). */
    const plafond=Math.floor(Number(jeuCourant.ap.plafond));
    return '<div class="scv-ap"><span>AP obtenus :</span> <b>'+esc(nombreLisible(apCredites(j,jeuCourant)))+(plafond>0?' / '+esc(nombreLisible(plafond)):'')+'</b></div>'+(bonusRecu(j,jeuCourant)>0?'<div class="scv-ap"><span>Bonus de fin obtenu :</span> <b>+'+esc(nombreLisible(bonusRecu(j,jeuCourant)))+'</b></div>':'');
  }

  function page(j){
    if(!estOuvert())return '';
    difficulteCourante=difficulteDe(j);
    chargerCatalogue();
    if(catalogue!==null)jeuCourant=choisirJeu(catalogue,difficulteCourante);
    const REG=window.__SOREAL_IDLE_REG__||{};
    const entete=typeof REG.entetePageIdleV28_==='function'?REG.entetePageIdleV28_('🕹️ Énigmes',''):'';
    return entete+'<div class="scv-page"><div class="scv-decor"><div id="scvZoneV1" class="scv-zone" data-morph-vivant></div><div class="scv-bas"><div class="scv-ctrl">'+htmlTouches('scv-touches')+htmlPad()+'</div>'+apGagnes(j)+'<div id="scvTropheesV1" class="scv-troph" data-morph-vivant></div>'+
      '<div><button type="button" class="soreal-idle-expand-button-v25" onclick="window.__scvPleinEcran__()">⛶ Plein écran</button> <span id="scvRecomV1" class="scv-recom" data-morph-vivant></span></div></div></div></div>';
  }

  window.__SOREAL_IDLE_SCUMMVM_PAGE_V1__={page:page,choisirJeu:choisirJeu,urlLancement:urlLancement,CLE_ETAT:CLE_ETAT,dossierDe:dossierDe,reglerAutosave:reglerAutosave,apCredites:apCredites,majTrophees:majTrophees,majRecommencer:majRecommencer,recommencer:recommencer,tropheesObtenus:tropheesObtenus};
})();
