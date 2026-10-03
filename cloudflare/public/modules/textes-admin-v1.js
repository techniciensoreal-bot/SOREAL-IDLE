/*
 * SOREAL IDLE — textes éditables par l'administrateur (Norman, 2026-10-02) : « pour chaque boss, pouvoir éditer le texte, le regénérer en y
 * plaçant des voix différentes si j'ai envie. Ça doit fonctionner dans ma partie B aussi, et sur tout : fenêtres popup, fenêtres explicatives… »
 *
 * Principe : le texte d'origine reste dans le jeu ; l'administrateur peut le REMPLACER (surcharge stockée côté serveur, table idle_textes, voir
 * src/idle-textes-v1.js). Les surcharges sont globales : la partie A et la partie B voient les mêmes textes. Une surcharge garde aussi les
 * empreintes des voix générées (studio de voix local, comme pour les histoires plein écran : modules/admin-histoires-v1.js).
 *
 * Voix : dans un texte, « (marius) » fait lire ce qui suit par Marius, « (femme) » par la voix de femme, « (narrateur) » ramène au narrateur,
 * jusqu'à la balise suivante (registre modules/voix-nommees-v1.js). La balise ne s'affiche jamais ; le découpage en blocs de voix est celui de la
 * lecture dans le jeu (modules/tutorial-tts-v202.js, planNarration) : les fichiers générés sont donc exactement ceux qui seront lus.
 *
 * Sécurité : l'édition n'apparaît que pour l'administrateur, MAIS c'est le serveur qui décide (chaque opération vérifie le compte).
 *
 *   window.__SOREAL_IDLE_TEXTES_V1__ = { surcharge(cle), appliquerPage(cle,page), appliquerInfo(cle,info), sansBalises(texte), declarer(cle,def),
 *     boutonHtml(cle), editer(cle), editerBoss(numero), pageHtml(), surChangement(fn) }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_TEXTES_V1__)return;

var EDITEUR_ID='sorealIdleTexteEditeurV1';
var STYLE_ID='sorealIdleTexteStyleV1';
var STUDIO_URL='http://127.0.0.1:8765';

var surcharges={popups:{},voix:[]};  // ce que reçoit tout joueur : textes de popups modifiés + empreintes de voix
var chargees=false;
var enChargement=false;
var essais=0;
var abonnes=[];
var registre={};                    // clés déclarées par le jeu : {groupe, libelle, champs, original(), texteLu(valeurs)}
var admin={charge:false,enCharge:false,erreur:'',boss:[],popups:[],filtre:''};
var edition=null;                   // {cle, def, voix[], estBoss, numero}
var studio={ok:null,texte:''};
var generation={enCours:false,annule:false};
var ecoute=false;

function esc_(v){
  return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function tts_(){
  try{return window.__SOREAL_IDLE_TUTORIAL_TTS_V209__||null;}catch(_e){return null;}
}
function appel_(nom,args){
  var f=window.__SOREAL_IDLE_CALL_V1__;
  if(typeof f!=='function')return Promise.reject(new Error('Connexion au jeu indisponible.'));
  return Promise.resolve(f(nom,args));
}
function jeton_(){
  try{
    var s=window.__SOREAL_IDLE_STANDALONE_V1__;
    return s&&typeof s.session==='function'?String(s.session()||''):'';
  }catch(_e){return '';}
}
function estAdmin_(){
  try{return typeof window.__SOREAL_IDLE_EST_ADMIN_V1__==='function'&&window.__SOREAL_IDLE_EST_ADMIN_V1__()===true;}catch(_e){return false;}
}

/* ---------- balises de voix ---------- */

/* Voix désignée par le contenu d'une parenthèse (« homme » / « femme » / voix nommée), ou « » si ce n'est pas une balise de voix. */
function voixDeBalise_(contenu){
  var t=tts_();
  if(t&&typeof t.resoudreVoixBalise==='function')return t.resoudreVoixBalise(contenu);
  var n=String(contenu==null?'':contenu).toLowerCase().replace(/[^a-z0-9]/g,'');
  return n==='homme'||n==='narrateur'?'homme':(n==='femme'?'femme':'');
}

/* Texte tel qu'il s'affiche : les balises de voix disparaissent, toute autre parenthèse reste. */
function sansBalises_(texte){
  var brut=String(texte==null?'':texte);
  /* Balise seule sur sa ligne : la ligne disparaît entièrement. */
  var sans=brut.replace(/(^|\n)[ \t]*\(\s*([^()\n]{1,40}?)\s*\)[ \t]*(\n|$)/g,function(tout,debut,dedans){
    return voixDeBalise_(dedans)?debut:tout;
  });
  /* Balise au milieu d'une phrase : remplacée par une espace. */
  sans=sans.replace(/[ \t]*\(\s*([^()\n]{1,40}?)\s*\)[ \t]*/g,function(tout,dedans){
    return voixDeBalise_(dedans)?' ':tout;
  });
  return sans.replace(/[ \t]{2,}/g,' ').replace(/ ?\n ?/g,'\n').trim();
}
function aDesBalises_(texte){
  return sansBalises_(texte)!==String(texte==null?'':texte).trim();
}

/* ---------- surcharges (lecture) ---------- */

function surchargeComplete_(cle){
  var s=surcharges.popups[cle];
  return s&&typeof s==='object'&&s.champs&&typeof s.champs==='object'?s:null;
}
function surcharge_(cle){
  var s=surchargeComplete_(cle);
  return s?s.champs:null;
}

function notifier_(){
  abonnes.forEach(function(f){try{f();}catch(_e){}});
}

function enregistrerVoix_(liste){
  var t=tts_();
  try{if(t&&typeof t.enregistrerVoixDynamiques==='function')t.enregistrerVoixDynamiques(liste||[]);}catch(_e){}
}

function charger_(){
  if(chargees||enChargement)return;
  if(!jeton_()||typeof window.__SOREAL_IDLE_CALL_V1__!=='function'){
    if(essais<60){essais+=1;setTimeout(charger_,1500);}
    return;
  }
  enChargement=true;
  appel_('obtenirTextesSurchargesSorealIdle',[]).then(function(res){
    enChargement=false;
    if(!res||res.ok===false)return;
    surcharges={popups:res.popups&&typeof res.popups==='object'?res.popups:{},voix:Array.isArray(res.voix)?res.voix:[]};
    chargees=true;
    enregistrerVoix_(surcharges.voix);
    notifier_();
  }).catch(function(){
    enChargement=false;
    if(essais<60){essais+=1;setTimeout(charger_,3000);}
  });
}

/* ---------- application aux textes du jeu ---------- */

function liste_(v){return Array.isArray(v)?v.slice():[];}

/*
 * Fenêtre explicative en pages (titre, sousTitre, paragraphes) : renvoie une COPIE portant le texte à afficher (balises retirées), le texte à lire
 * (_brut, balises gardées) et sa clé (_cle) ; sans surcharge, la copie garde le texte d'origine.
 */
function appliquerPage_(cle,page){
  var base=page&&typeof page==='object'?page:{};
  var s=surcharge_(cle);
  var brut={
    titre:s&&typeof s.titre==='string'?s.titre:String(base.titre||''),
    sousTitre:s&&typeof s.sousTitre==='string'?s.sousTitre:String(base.sousTitre||''),
    paragraphes:s&&Array.isArray(s.paragraphes)?s.paragraphes.slice():liste_(base.paragraphes)
  };
  var out=Object.assign({},base,{_cle:cle});
  if(s){
    out.titre=sansBalises_(brut.titre);
    if(brut.sousTitre||base.sousTitre!==undefined)out.sousTitre=sansBalises_(brut.sousTitre);
    out.paragraphes=brut.paragraphes.map(sansBalises_);
    out._brut=brut;
  }
  return out;
}

/* Popup « nouveauté » (titre, intro, texte, bullets) : même principe. */
function appliquerInfo_(cle,info){
  var base=info&&typeof info==='object'?info:{};
  var s=surcharge_(cle);
  var brut={
    titre:s&&typeof s.titre==='string'?s.titre:String(base.titre||''),
    intro:s&&typeof s.intro==='string'?s.intro:String(base.intro||''),
    texte:s&&typeof s.texte==='string'?s.texte:String(base.texte||''),
    bullets:s&&Array.isArray(s.bullets)?s.bullets.slice():liste_(base.bullets)
  };
  var out=Object.assign({},base,{_cle:cle});
  if(s){
    out.titre=sansBalises_(brut.titre);
    out.intro=sansBalises_(brut.intro);
    out.texte=sansBalises_(brut.texte);
    out.bullets=brut.bullets.map(sansBalises_);
    out._brut=brut;
  }
  return out;
}

function declarer_(cle,def){
  if(!cle||!def)return;
  registre[cle]=def;
}

/* ---------- éditeur ---------- */

function installerStyle_(){
  if(document.getElementById(STYLE_ID))return;
  var s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=
    '#'+EDITEUR_ID+'{position:fixed;inset:0;z-index:1000001;background:rgba(3,6,12,.82);overflow:auto;padding:14px;box-sizing:border-box}'+
    '#'+EDITEUR_ID+' .stx-carte{max-width:780px;margin:0 auto;background:#10151f;border:1.5px solid #3b4a6b;border-radius:14px;padding:16px;color:#e8eefc;font:500 15px/1.5 system-ui,sans-serif}'+
    '#'+EDITEUR_ID+' h3{margin:0 0 2px;font-size:19px}'+
    '#'+EDITEUR_ID+' .stx-cle{font-size:12px;color:#8fa0c4;margin-bottom:12px;word-break:break-all}'+
    '#'+EDITEUR_ID+' label{display:block;font-weight:800;font-size:13px;color:#b8c7ea;margin:12px 0 4px;letter-spacing:.03em;text-transform:uppercase}'+
    '#'+EDITEUR_ID+' textarea,#'+EDITEUR_ID+' input[type=text]{width:100%;box-sizing:border-box;background:#0a0e16;color:#f1f4fb;border:1.5px solid #34425f;border-radius:10px;padding:10px;font:500 16px/1.5 system-ui,sans-serif}'+
    '#'+EDITEUR_ID+' textarea{min-height:90px;resize:vertical}'+
    '#'+EDITEUR_ID+' .stx-aide{font-size:13px;color:#8fa0c4;margin:4px 0}'+
    '#'+EDITEUR_ID+' .stx-palette{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 2px}'+
    '#'+EDITEUR_ID+' button,.stx-btn{min-height:42px;padding:8px 14px;border-radius:10px;border:1.5px solid #4b5d85;background:#1b2538;color:#e8eefc;font:700 14px/1 system-ui,sans-serif;cursor:pointer}'+
    '#'+EDITEUR_ID+' button.stx-voix{min-height:36px;padding:6px 10px;font-size:13px}'+
    '#'+EDITEUR_ID+' button.primaire{background:linear-gradient(180deg,#5da8ff,#2f6fd6);border-color:#7ab8ff;color:#fff}'+
    '#'+EDITEUR_ID+' button.danger{border-color:#a04a4a;color:#ffb4b4}'+
    '#'+EDITEUR_ID+' .stx-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}'+
    '#'+EDITEUR_ID+' .stx-etat{margin-top:10px;font-size:14px;min-height:20px}'+
    '#'+EDITEUR_ID+' .stx-etat.erreur{color:#ff9d9d}'+
    '.stx-bouton{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:4px 10px;border-radius:999px;border:1.5px solid rgba(255,212,0,.7);background:rgba(255,212,0,.12);color:#ffd84a;font:800 13px/1 system-ui,sans-serif;cursor:pointer}'+
    '.stx-adm-ligne{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid rgba(255,255,255,.14);border-radius:10px;margin:6px 0;background:rgba(255,255,255,.04)}'+
    '.stx-adm-ligne .nom{flex:1;min-width:0;font-weight:700}'+
    '.stx-adm-ligne .badge{font-size:12px;padding:2px 8px;border-radius:999px;background:rgba(74,222,128,.18);color:#86efac;white-space:nowrap}'+
    '.stx-adm-ligne .badge.non{background:rgba(255,255,255,.1);color:#b8c7ea}';
  document.head.appendChild(s);
}

function voixProposees_(){
  var reg=window.__SOREAL_IDLE_VOIX_NOMMEES_V1__;
  var nommees=reg&&Array.isArray(reg.liste)?reg.liste:[];
  return [['narrateur','🎙 Narrateur'],['femme','👩 Femme']].concat(nommees.map(function(v){return [v.id,'🎭 '+v.nom];}));
}

function champsDef_(){return edition&&edition.def&&Array.isArray(edition.def.champs)?edition.def.champs:[];}

function valeurVersTexte_(champ,valeur){
  if(champ.type==='liste')return (Array.isArray(valeur)?valeur:[]).join('\n\n');
  return String(valeur==null?'':valeur);
}
function texteVersValeur_(champ,texte){
  if(champ.type==='liste')return String(texte||'').split(/\n\s*\n/).map(function(x){return x.trim();}).filter(Boolean);
  if(champ.type==='ligne')return String(texte||'').replace(/\s+/g,' ').trim();
  return String(texte||'').trim();
}

function lireChamps_(){
  var racine=document.getElementById(EDITEUR_ID);
  var valeurs={};
  champsDef_().forEach(function(c){
    var el=racine&&racine.querySelector('[data-stx-champ="'+c.id+'"]');
    valeurs[c.id]=texteVersValeur_(c,el?el.value:'');
  });
  return valeurs;
}

function afficherEtat_(message,erreur){
  var el=document.getElementById('sorealIdleTexteEtatV1');
  if(!el)return;
  var base=studio.texte?'<div class="stx-aide">'+esc_(studio.texte)+'</div>':'';
  el.className='stx-etat'+(erreur?' erreur':'');
  el.innerHTML=(message?esc_(message):'')+base;
}

/* Blocs de voix du texte lu : mêmes blocs et mêmes empreintes que la lecture dans le jeu. */
function blocsDeLecture_(valeurs){
  var t=tts_();
  if(!t||typeof t.planNarration!=='function'||typeof t.hashBloc!=='function'||!edition)return [];
  var brut=edition.def.texteLu(valeurs);
  var plan=t.planNarration(t.retirerParentheses(brut));
  var vus={},blocs=[];
  plan.forEach(function(e){
    if(!e||e.chunk==null||!String(e.chunk).trim())return;
    var hash=t.hashBloc(e.chunk);
    if(vus[hash])return;
    vus[hash]=1;
    var parleur=e.voix||(typeof t.estVoixFemme==='function'&&t.estVoixFemme(e.chunk)?'femme':'homme');
    blocs.push({texte:e.chunk,hash:hash,parleur:parleur});
  });
  return blocs;
}

function statutVoix_(){
  var blocs=blocsDeLecture_(lireChamps_());
  var prets=blocs.filter(function(b){return edition.voix.indexOf(b.hash)!==-1;}).length;
  return {total:blocs.length,prets:prets};
}

function dessinerEditeur_(){
  installerStyle_();
  var ancien=document.getElementById(EDITEUR_ID);
  if(ancien)ancien.remove();
  var d=edition.def;
  var champsHtml=d.champs.map(function(c){
    var valeur=valeurVersTexte_(c,edition.valeurs[c.id]);
    var rows=c.type==='ligne'?1:(c.type==='liste'?9:7);
    var aide=c.type==='liste'?'<div class="stx-aide">Sépare chaque élément par une ligne vide.</div>':'';
    var champ=c.type==='ligne'
      ?'<input type="text" data-stx-champ="'+esc_(c.id)+'" value="'+esc_(valeur)+'">'
      :'<textarea rows="'+rows+'" data-stx-champ="'+esc_(c.id)+'">'+esc_(valeur)+'</textarea>';
    return '<label>'+esc_(c.label)+'</label>'+champ+aide;
  }).join('');
  var palette=voixProposees_().map(function(v){
    return '<button type="button" class="stx-voix" data-stx-voix="'+esc_(v[0])+'">'+esc_(v[1])+'</button>';
  }).join('');
  var racine=document.createElement('div');
  racine.id=EDITEUR_ID;
  racine.innerHTML=
    '<div class="stx-carte" role="dialog" aria-modal="true">'+
      '<h3>✏️ '+esc_(d.libelle)+'</h3>'+
      '<div class="stx-cle">'+esc_(edition.cle)+(edition.surcharge?' · <b style="color:#ffd84a">texte modifié</b>':' · texte d’origine')+'</div>'+
      champsHtml+
      '<label>Voix (clique dans un texte, puis choisis une voix)</label>'+
      '<div class="stx-palette">'+palette+'</div>'+
      '<div class="stx-aide">Écris par exemple : <b>(narrateur)</b> Il entre. <b>(marius)</b> Salut mon ami ! <b>(femme)</b> Bonjour. Ce qui suit une balise est lu par cette voix, jusqu’à la balise suivante. Les balises ne s’affichent jamais à l’écran.</div>'+
      '<div class="stx-actions">'+
        '<button type="button" data-stx-act="ecouter" id="sorealIdleTexteEcouterV1">▶ Écouter</button>'+
        '<button type="button" data-stx-act="generer" id="sorealIdleTexteGenererV1">🎙 Générer les voix</button>'+
        '<button type="button" data-stx-act="studio-lancer" title="Lance lancer.bat sur ce PC (via le pilote)">🚀 Lancer le studio</button>'+
        '<button type="button" data-stx-act="studio-arreter" title="Arrête le studio de voix sur ce PC">🛑 Arrêter le studio</button>'+
        '<label style="display:flex;align-items:center;gap:6px;margin:0;font-size:13px;text-transform:none"><input type="checkbox" id="sorealIdleTexteToutesV1"> tout régénérer</label>'+
      '</div>'+
      '<div class="stx-actions">'+
        '<button type="button" class="primaire" data-stx-act="enregistrer">💾 Enregistrer</button>'+
        (edition.surcharge?'<button type="button" class="danger" data-stx-act="retablir">↩ Rétablir l’original</button>':'')+
        '<button type="button" data-stx-act="fermer">Fermer</button>'+
      '</div>'+
      '<div class="stx-etat" id="sorealIdleTexteEtatV1"></div>'+
    '</div>';
  document.body.appendChild(racine);
  racine.addEventListener('focusin',function(ev){
    if(ev.target&&ev.target.getAttribute&&ev.target.getAttribute('data-stx-champ'))edition.dernierChamp=ev.target;
  });
  afficherEtat_(statutLigne_());
}

function statutLigne_(){
  var s=statutVoix_();
  if(!s.total)return '';
  return '🎙 Voix du studio : '+s.prets+'/'+s.total+' bloc'+(s.total>1?'s':'')+' prêt'+(s.total>1?'s':'')+(s.prets<s.total?' (les autres sont lus avec la voix de secours du jeu)':'')+'.';
}

function verifierStudio_(){
  studio={ok:null,texte:'Studio de voix : vérification…'};
  fetch(STUDIO_URL+'/ping',{cache:'no-store'}).then(function(r){return r.json();}).then(function(d){
    studio={ok:Boolean(d&&d.ok),texte:d&&d.ok?'🟢 Studio de voix connecté ('+(d.modele||'')+')':'Studio de voix : réponse inattendue.'};
    afficherEtat_(statutLigne_());
  }).catch(function(){
    studio={ok:false,texte:'🔴 Studio de voix non détecté sur ce PC : clique sur « 🚀 Lancer le studio » (ou lance « lancer.bat » dans cloudflare/tools/voice-studio) pour générer les voix. Écouter et enregistrer fonctionnent sans lui.'};
    afficherEtat_(statutLigne_());
  });
}

function outilsVoix_(){
  var a=window.__SOREAL_IDLE_ADMIN_HISTOIRES_V1__;
  return a&&a.outilsVoix?a.outilsVoix:null;
}

function inserer_(balise){
  var el=edition&&edition.dernierChamp&&edition.dernierChamp.isConnected?edition.dernierChamp:document.querySelector('#'+EDITEUR_ID+' [data-stx-champ]');
  if(!el)return;
  var debut=typeof el.selectionStart==='number'?el.selectionStart:el.value.length;
  var fin=typeof el.selectionEnd==='number'?el.selectionEnd:debut;
  var avant=el.value.slice(0,debut),apres=el.value.slice(fin);
  var ins=(avant&&!/\s$/.test(avant)?' ':'')+'('+balise+') ';
  el.value=avant+ins+apres;
  var pos=(avant+ins).length;
  try{el.focus();el.setSelectionRange(pos,pos);}catch(_e){}
  edition.dernierChamp=el;
  afficherEtat_(statutLigne_());
}

function arreterEcoute_(){
  ecoute=false;
  try{var t=tts_();if(t&&typeof t.stop==='function')t.stop();}catch(_e){}
  var b=document.getElementById('sorealIdleTexteEcouterV1');
  if(b)b.textContent='▶ Écouter';
}

function ecouter_(){
  var t=tts_();
  if(!t||typeof t.readText!=='function'){afficherEtat_('Lecture vocale indisponible sur cet appareil.',true);return;}
  if(ecoute){arreterEcoute_();return;}
  var valeurs=lireChamps_();
  var brut=edition.def.texteLu(valeurs);
  enregistrerVoix_(edition.voix);
  ecoute=true;
  var b=document.getElementById('sorealIdleTexteEcouterV1');
  if(b)b.textContent='⏹ Arrêter';
  var demarre=false;
  try{demarre=t.readText(t.retirerParentheses(brut),undefined,function(){ecoute=false;var bb=document.getElementById('sorealIdleTexteEcouterV1');if(bb)bb.textContent='▶ Écouter';});}catch(_e){demarre=false;}
  if(!demarre){ecoute=false;if(b)b.textContent='▶ Écouter';afficherEtat_('Rien à lire dans ce texte.',true);}
}

function charge_(valeurs){
  var o={cle:edition.cle,champs:{},voix:edition.voix.slice()};
  champsDef_().forEach(function(c){o.champs[c.id]=valeurs[c.id];});
  return o;
}

function enregistrer_(){
  var valeurs=lireChamps_();
  edition.valeurs=valeurs;
  return appel_('enregistrerTexteAdminSorealIdle',[charge_(valeurs)]).then(function(res){
    if(!res||res.ok===false){afficherEtat_((res&&res.message)||'Enregistrement refusé.',true);return false;}
    edition.surcharge=res.texte||{champs:valeurs,voix:edition.voix};
    miseAJourApresEcriture_(edition.cle,edition.surcharge);
    afficherEtat_('✔ Enregistré. '+statutLigne_());
    return true;
  }).catch(function(e){
    afficherEtat_('Enregistrement impossible : '+(e&&e.message?e.message:e),true);
    return false;
  });
}

/* Une surcharge vient d'être écrite (ou supprimée si null) : mémoire locale, voix, abonnés (réécriture des textes du jeu), liste Admin. */
function miseAJourApresEcriture_(cle,surcharge){
  if(/^boss:/.test(cle)){
    var n=Number(cle.slice(5));
    admin.boss.forEach(function(b){if(b.numero===n)b.surcharge=surcharge||null;});
    enregistrerVoix_(surcharge?surcharge.voix:[]);
    /* Le nouveau texte du boss arrive avec la prochaine synchronisation ; on la demande tout de suite. */
    try{var rt=window.__SOREAL_IDLE_RUNTIME_V1__;if(rt&&typeof rt.invalidate==='function')rt.invalidate();}catch(_e){}
    try{if(typeof window.__SOREAL_IDLE_FORCER_SYNCHRO_V1__==='function')window.__SOREAL_IDLE_FORCER_SYNCHRO_V1__();}catch(_e2){}
  }else{
    if(surcharge)surcharges.popups[cle]={champs:surcharge.champs,voix:surcharge.voix||[]};else delete surcharges.popups[cle];
    if(surcharge)enregistrerVoix_(surcharge.voix);
    notifier_();
  }
  rafraichirListe_();
}

function retablir_(){
  if(!window.confirm('Rétablir le texte d’origine ? Ta version modifiée (et ses voix) sera supprimée.'))return;
  arreterEcoute_();
  appel_('supprimerTexteAdminSorealIdle',[{cle:edition.cle}]).then(function(res){
    if(res&&res.ok===false)throw new Error(res.message||'Refusé.');
    miseAJourApresEcriture_(edition.cle,null);
    fermer_();
  }).catch(function(e){afficherEtat_('Impossible de rétablir : '+(e&&e.message?e.message:e),true);});
}

function fermer_(){
  arreterEcoute_();
  if(generation.enCours)generation.annule=true;
  var r=document.getElementById(EDITEUR_ID);
  if(r)r.remove();
  edition=null;
}

function majBoutonGenerer_(){
  var b=document.getElementById('sorealIdleTexteGenererV1');
  if(b)b.textContent=generation.enCours?'⏹ Arrêter':'🎙 Générer les voix';
}

function generer_(){
  var o=outilsVoix_();
  if(generation.enCours){generation.annule=true;afficherEtat_('Arrêt demandé…');return;}
  if(!o){afficherEtat_('Outils de voix indisponibles (module Admin non chargé).',true);return;}
  var valeurs=lireChamps_();
  edition.valeurs=valeurs;
  var blocs=blocsDeLecture_(valeurs);
  if(!blocs.length){afficherEtat_('Aucun texte à lire.',true);return;}
  var toutes=Boolean((document.getElementById('sorealIdleTexteToutesV1')||{}).checked);
  var aFaire=blocs.filter(function(b){return toutes||edition.voix.indexOf(b.hash)===-1;});
  if(!aFaire.length){afficherEtat_('Toutes les voix sont déjà prêtes (coche « tout régénérer » pour les refaire).');return;}
  generation={enCours:true,annule:false};
  majBoutonGenerer_();
  var fait=0;
  var suite=Promise.resolve();
  aFaire.forEach(function(b){
    suite=suite.then(function(){
      if(generation.annule)throw new Error('__annule__');
      afficherEtat_('🎙 Génération des voix : '+(fait+1)+'/'+aFaire.length+' (quelques secondes par bloc)…');
      return o.synthetiser(b.texte,b.parleur).then(function(blob){return o.televerser(b.hash,blob);}).then(function(){
        if(edition.voix.indexOf(b.hash)===-1)edition.voix.push(b.hash);
        fait+=1;
      });
    });
  });
  suite.then(function(){
    afficherEtat_('Enregistrement des voix…');
    return enregistrer_();
  }).then(function(ok){
    if(ok)afficherEtat_('✔ '+fait+' voix générée'+(fait>1?'s':'')+' et enregistrée'+(fait>1?'s':'')+'. Clique sur « Écouter » pour entendre. '+statutLigne_());
  }).catch(function(e){
    var msg=e&&e.message?e.message:String(e);
    if(fait>0&&edition)enregistrer_();
    afficherEtat_(msg==='__annule__'?'Génération arrêtée ('+fait+' voix déjà prêtes, enregistrées).':'Échec de la génération : '+msg,msg!=='__annule__');
  }).then(function(){
    generation={enCours:false,annule:false};
    majBoutonGenerer_();
  });
}

/* Ouvre l'éditeur d'un texte déclaré (popup, fenêtre explicative) ou d'un boss (voir editerBoss). */
function ouvrir_(cle,def,surcharge,originaux){
  if(edition)fermer_();
  var courant={};
  def.champs.forEach(function(c){
    var s=surcharge&&surcharge.champs?surcharge.champs[c.id]:undefined;
    courant[c.id]=s!==undefined?s:(originaux?originaux[c.id]:'');
  });
  edition={cle:cle,def:def,surcharge:surcharge||null,valeurs:courant,voix:surcharge&&Array.isArray(surcharge.voix)?surcharge.voix.slice():[],dernierChamp:null};
  dessinerEditeur_();
  verifierStudio_();
}

function editer_(cle){
  var def=registre[cle];
  if(!def)return;
  var s=surchargeComplete_(cle);
  ouvrir_(cle,def,s?{champs:s.champs,voix:Array.isArray(s.voix)?s.voix:[]}:null,def.original());
}

function defBoss_(numero,nom){
  return {
    groupe:'Boss',libelle:'Chronique — '+nom+' (boss '+numero+')',
    champs:[{id:'texte',label:'Texte de la chronique',type:'texte'}],
    original:function(){var b=bossParNumero_(numero);return {texte:b?b.original:''};},
    texteLu:function(v){
      var t=tts_();
      return t&&typeof t.composerChronique==='function'?t.composerChronique(nom,v.texte):nom+' '+v.texte;
    }
  };
}
function bossParNumero_(n){
  return admin.boss.filter(function(b){return b.numero===n;})[0]||null;
}

function editerBoss_(numero){
  numero=Math.floor(Number(numero)||0);
  if(numero<1)return;
  var ouvrirBoss=function(){
    var b=bossParNumero_(numero);
    if(!b){window.alert('Boss introuvable.');return;}
    ouvrir_('boss:'+numero,defBoss_(numero,b.nom),b.surcharge,{texte:b.original});
  };
  if(admin.charge){ouvrirBoss();return;}
  chargerAdmin_(ouvrirBoss);
}

/* ---------- liste Admin ---------- */

function chargerAdmin_(apres){
  if(admin.charge){if(apres)apres();return;}
  if(admin.enCharge){if(apres)setTimeout(function(){chargerAdmin_(apres);},300);return;}
  admin.enCharge=true;
  admin.erreur='';
  appel_('listerTextesAdminSorealIdle',[]).then(function(res){
    admin.enCharge=false;
    if(!res||res.ok===false)throw new Error((res&&res.message)||'Réponse invalide.');
    admin.boss=Array.isArray(res.boss)?res.boss:[];
    admin.popups=Array.isArray(res.popups)?res.popups:[];
    admin.charge=true;
    rafraichirListe_();
    if(apres)apres();
  }).catch(function(e){
    admin.enCharge=false;
    admin.erreur='Impossible de charger les textes : '+(e&&e.message?e.message:e);
    rafraichirListe_();
  });
}

function listeBossHtml_(){
  if(admin.erreur)return '<div class="stx-aide" style="color:#ff9d9d">'+esc_(admin.erreur)+'</div>';
  if(!admin.charge)return '<div class="stx-aide">Chargement des textes…</div>';
  var f=String(admin.filtre||'').trim().toLowerCase();
  var lignes=admin.boss.filter(function(b){
    if(!f)return true;
    return String(b.numero)===f||String(b.nom||'').toLowerCase().indexOf(f)!==-1||(f==='modifie'&&b.surcharge);
  });
  var max=60;
  var html=lignes.slice(0,max).map(function(b){
    var s=b.surcharge;
    var badge=s?'<span class="badge">✏️ modifié'+(s.voix&&s.voix.length?' · 🎙 '+s.voix.length:'')+'</span>':'<span class="badge non">d’origine</span>';
    return '<div class="stx-adm-ligne"><span class="nom">#'+b.numero+' — '+esc_(b.nom)+'</span>'+badge+
      '<button type="button" class="stx-bouton" data-stx-boss="'+b.numero+'">✏️ Modifier</button></div>';
  }).join('');
  if(!lignes.length)html='<div class="stx-aide">Aucun boss ne correspond.</div>';
  else if(lignes.length>max)html+='<div class="stx-aide">… '+(lignes.length-max)+' autres : précise ta recherche (numéro ou nom).</div>';
  return html;
}

function listePopupsHtml_(){
  var cles=Object.keys(registre).sort(function(a,b){
    var ga=registre[a].groupe||'',gb=registre[b].groupe||'';
    return ga===gb?(a<b?-1:1):(ga<gb?-1:1);
  });
  if(!cles.length)return '<div class="stx-aide">Les fenêtres explicatives apparaissent ici une fois le jeu chargé.</div>';
  var groupe='',html='';
  cles.forEach(function(cle){
    var d=registre[cle];
    if(d.groupe!==groupe){groupe=d.groupe;html+='<div class="stx-aide" style="margin-top:12px;font-weight:800;color:#b8c7ea">'+esc_(groupe)+'</div>';}
    var s=surcharge_(cle);
    html+='<div class="stx-adm-ligne"><span class="nom">'+esc_(d.libelle)+'</span>'+
      (s?'<span class="badge">✏️ modifié</span>':'<span class="badge non">d’origine</span>')+
      '<button type="button" class="stx-bouton" data-stx-cle="'+esc_(cle)+'">✏️ Modifier</button></div>';
  });
  return html;
}

function pageHtml_(){
  if(!admin.charge&&!admin.enCharge&&!admin.erreur)setTimeout(function(){chargerAdmin_();},0);
  return '<div class="soreal-idle-section-v8" id="sorealIdleTextesAdminV1">'+
    '<div class="soreal-idle-window-title-v31">📜 Admin — Textes et voix</div>'+
    '<div class="stx-aide">Modifie le texte d’une <b>chronique de boss</b> ou d’une <b>fenêtre explicative</b>, place des voix différentes avec les balises <b>(marius)</b>, <b>(femme)</b>… puis génère les voix. Valable dans la partie A et la partie B.</div>'+
    '<div style="margin:10px 0 4px;font-weight:800">Chroniques des boss</div>'+
    '<input type="text" id="sorealIdleTextesFiltreV1" placeholder="Numéro ou nom du boss (« modifie » = ceux que tu as changés)" value="'+esc_(admin.filtre)+'" '+
      'style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1.5px solid #34425f;background:#0a0e16;color:#f1f4fb;font:500 16px system-ui,sans-serif;margin-bottom:6px">'+
    '<div id="sorealIdleTextesBossListeV1">'+listeBossHtml_()+'</div>'+
    '<div style="margin:16px 0 4px;font-weight:800">Fenêtres et popups</div>'+
    '<div id="sorealIdleTextesPopupsListeV1">'+listePopupsHtml_()+'</div>'+
  '</div>';
}

function rafraichirListe_(){
  var b=document.getElementById('sorealIdleTextesBossListeV1');
  if(b)b.innerHTML=listeBossHtml_();
  var p=document.getElementById('sorealIdleTextesPopupsListeV1');
  if(p)p.innerHTML=listePopupsHtml_();
}

/* Bouton « ✏️ » à poser dans un popup : vide pour tout autre compte que l'administrateur. */
function boutonHtml_(cle){
  if(!estAdmin_())return '';
  installerStyle_();
  return '<button type="button" class="stx-bouton" data-stx-cle="'+esc_(cle)+'" title="Modifier ce texte et ses voix">✏️ Modifier le texte</button>';
}
function boutonBossHtml_(numero){
  if(!estAdmin_()||!(Number(numero)>0))return '';
  installerStyle_();
  return '<button type="button" class="stx-bouton" data-stx-boss="'+Math.floor(Number(numero))+'" title="Modifier ce texte et ses voix">✏️ Modifier le texte</button>';
}

/* ---------- événements ---------- */

document.addEventListener('click',function(ev){
  var racine=document.getElementById(EDITEUR_ID);
  if(racine&&edition&&racine.contains(ev.target)){
    var v=ev.target.closest('[data-stx-voix]');
    if(v){inserer_(v.getAttribute('data-stx-voix'));return;}
    var a=ev.target.closest('[data-stx-act]');
    if(a){
      var act=a.getAttribute('data-stx-act');
      if(act==='fermer'){fermer_();return;}
      if(act==='ecouter'){ecouter_();return;}
      if(act==='generer'){generer_();return;}
      if(act==='studio-lancer'||act==='studio-arreter'){
        var pilote=window.__SOREAL_IDLE_STUDIO_PILOTE_V1__;
        if(!pilote){afficherEtat_('Module du pilote absent : recharge la page.',true);return;}
        pilote[act==='studio-lancer'?'lancer':'arreter'](function(texte,erreur){afficherEtat_(texte,erreur);},verifierStudio_);
        return;
      }
      if(act==='enregistrer'){arreterEcoute_();enregistrer_();return;}
      if(act==='retablir'){retablir_();return;}
    }
    return;
  }
  var cleBtn=ev.target&&ev.target.closest?ev.target.closest('[data-stx-cle]'):null;
  if(cleBtn){ev.preventDefault();ev.stopPropagation();editer_(cleBtn.getAttribute('data-stx-cle'));return;}
  var bossBtn=ev.target&&ev.target.closest?ev.target.closest('[data-stx-boss]'):null;
  if(bossBtn){ev.preventDefault();ev.stopPropagation();editerBoss_(bossBtn.getAttribute('data-stx-boss'));}
},true);

document.addEventListener('input',function(ev){
  var el=ev.target;
  if(el&&el.id==='sorealIdleTextesFiltreV1'){
    admin.filtre=el.value;
    var b=document.getElementById('sorealIdleTextesBossListeV1');
    if(b)b.innerHTML=listeBossHtml_();
    return;
  }
  if(edition&&el&&el.getAttribute&&el.getAttribute('data-stx-champ'))afficherEtat_(statutLigne_());
});

window.__SOREAL_IDLE_TEXTES_V1__={
  surcharge:surcharge_,
  appliquerPage:appliquerPage_,
  appliquerInfo:appliquerInfo_,
  sansBalises:sansBalises_,
  aDesBalises:aDesBalises_,
  declarer:declarer_,
  boutonHtml:boutonHtml_,
  boutonBossHtml:boutonBossHtml_,
  editer:editer_,
  editerBoss:editerBoss_,
  pageHtml:pageHtml_,
  surChangement:function(f){if(typeof f==='function')abonnes.push(f);if(chargees){try{f();}catch(_e){}}},
  recharger:function(){chargees=false;enChargement=false;essais=0;charger_();},
  /* Outils de test. */
  blocsDeLecture:function(def,valeurs){edition={cle:'test',def:def,voix:[],valeurs:valeurs};var b=blocsDeLecture_(valeurs);edition=null;return b;}
};

charger_();
})();
