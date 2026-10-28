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
 * Texte de voix (Norman, 2026-10-08) : sous le texte AFFICHÉ de chaque bulle (verrouillé par défaut), un champ libre dit COMMENT le prononcer (« est-ce tes haut paix » pour « STOP »). Il ne modifie jamais le texte
 * des joueurs : l'empreinte du bloc, donc le fichier de voix, reste celle du texte affiché ; seule la phrase envoyée au studio change (edition.voixTextes, enregistré avec la surcharge, jamais envoyé aux joueurs).
 *
 * ÉDITEUR REPENSÉ (Norman, 2026-10-11) : pour chaque texte, un cadre DORÉ avec le texte tel que les joueurs le lisent (modifiable, enregistrable, jamais générateur de voix) ; en dessous, un cadre par PERSONNAGE
 * avec le texte à DIRE (au départ une copie), la voix, l'expression, et sa propre génération. Les joueurs LISENT le cadre doré et ENTENDENT les personnages (champ « parle » enregistré avec la surcharge) : changer
 * le texte doré ne change jamais la voix. Même principe pour le titre. La barre du haut garde toujours visibles : lancer / arrêter le studio, générer les manquantes, générer la sélection (cases à cocher), arrêter.
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
var admin={charge:false,enCharge:false,erreur:'',boss:[],popups:[],filtre:'',page:0,validations:{}};
var edition=null;                   // {cle, def, voix[], estBoss, numero}
var studio={ok:null,texte:''};
var generation={enCours:false,annule:false};
var ecoute=false;
var ecouteCle='';
var reduit=false;                    // éditeur réduit en petit menu flottant (la génération continue pendant qu'on joue)

var idLigne_=0;
function nouvelId_(){idLigne_+=1;return 'n'+idLigne_;}
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

/* Expression ou pause désignée par le contenu d'une parenthèse (« joyeux », « pause 2s »…) : ces balises ne sont jamais lues ni affichées, comme celles de voix. */
function balisePauseOuExpression_(contenu){
  var t=tts_();
  if(!t)return false;
  try{
    if(typeof t.resoudreExpressionBalise==='function'&&t.resoudreExpressionBalise(contenu))return true;
    if(typeof t.resoudrePauseBalise==='function'&&t.resoudrePauseBalise(contenu)>0)return true;
  }catch(_e){}
  return false;
}
function estBaliseDeLecture_(contenu){return Boolean(voixDeBalise_(contenu)||balisePauseOuExpression_(contenu));}

/* Texte tel qu'il s'affiche : les balises de voix, d'expression et de pause disparaissent, toute autre parenthèse reste. */
function sansBalises_(texte){
  var brut=String(texte==null?'':texte);
  /* Balise seule sur sa ligne : la ligne disparaît entièrement. */
  var sans=brut.replace(/(^|\n)[ \t]*\(\s*([^()\n]{1,40}?)\s*\)[ \t]*(\n|$)/g,function(tout,debut,dedans){
    return estBaliseDeLecture_(dedans)?debut:tout;
  });
  /* Balise au milieu d'une phrase : remplacée par une espace. */
  sans=sans.replace(/[ \t]*\(\s*([^()\n]{1,40}?)\s*\)[ \t]*/g,function(tout,dedans){
    return estBaliseDeLecture_(dedans)?' ':tout;
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
/* Feu de validation : 0 rouge, 1 jaune, 2 vert. Un clic passe au suivant, le troisième revient au rouge. */
function etatFeu_(cle){var e=admin.validations&&admin.validations[cle];return e===1||e===2?e:0;}
function feuHtml_(cle,bouton){
  var attrs=' class="stx-feu" data-stx-feu="'+esc_(cle)+'" data-etat="'+etatFeu_(cle)+'"';
  return bouton?'<button type="button" data-stx-act="feu"'+attrs+' aria-label="Validation de la voix"></button>':'<span'+attrs+' aria-hidden="true"></span>';
}
function majFeux_(){
  var l=document.querySelectorAll('[data-stx-feu]');
  for(var i=0;i<l.length;i++){var e=String(etatFeu_(l[i].getAttribute('data-stx-feu')));if(l[i].getAttribute('data-etat')!==e)l[i].setAttribute('data-etat',e);}
}
function changerFeu_(cle){
  var avant=etatFeu_(cle),suivant=(avant+1)%3;
  if(!admin.validations)admin.validations={};
  if(suivant)admin.validations[cle]=suivant;else delete admin.validations[cle];
  majFeux_();
  appel_('definirValidationVoixAdminSorealIdle',[{cle:cle,etat:suivant}]).then(function(res){
    if(!res||res.ok===false)throw new Error((res&&res.message)||'Réponse invalide.');
  }).catch(function(e){
    if(avant)admin.validations[cle]=avant;else delete admin.validations[cle];
    majFeux_();
    afficherEtat_('Validation non enregistrée : '+(e&&e.message?e.message:e),true);
  });
}

/*
 * Fenêtre explicative en pages (titre, sousTitre, paragraphes) : renvoie une COPIE portant le texte à afficher (balises retirées), le texte à lire
 * (_brut, balises gardées) et sa clé (_cle) ; sans surcharge, la copie garde le texte d'origine.
 */
/* Texte PARLÉ d'un champ (Norman, 2026-10-11) : ce que la voix dit, quel que soit le texte affiché ; absent = la voix suit le texte affiché. */
function parleDe_(cle,champ){
  var sc=surchargeComplete_(cle);
  var p=sc&&sc.parle&&typeof sc.parle==='object'?sc.parle[champ]:undefined;
  return p;
}
function appliquerPage_(cle,page){
  var base=page&&typeof page==='object'?page:{};
  var s=surcharge_(cle);
  var aff={
    titre:s&&typeof s.titre==='string'?s.titre:String(base.titre||''),
    sousTitre:s&&typeof s.sousTitre==='string'?s.sousTitre:String(base.sousTitre||''),
    paragraphes:s&&Array.isArray(s.paragraphes)?s.paragraphes.slice():liste_(base.paragraphes)
  };
  var pt=parleDe_(cle,'titre'),ps=parleDe_(cle,'sousTitre'),pp=parleDe_(cle,'paragraphes');
  var brut={
    titre:typeof pt==='string'?pt:aff.titre,
    sousTitre:typeof ps==='string'?ps:aff.sousTitre,
    paragraphes:Array.isArray(pp)&&pp.length===aff.paragraphes.length?pp.slice():aff.paragraphes
  };
  var out=Object.assign({},base,{_cle:cle});
  if(s){
    out.titre=sansBalises_(aff.titre);
    if(aff.sousTitre||base.sousTitre!==undefined)out.sousTitre=sansBalises_(aff.sousTitre);
    out.paragraphes=aff.paragraphes.map(sansBalises_);
    out._brut=brut;
  }
  return out;
}

/* Popup « nouveauté » (titre, intro, texte, bullets) : même principe. */
function appliquerInfo_(cle,info){
  var base=info&&typeof info==='object'?info:{};
  var s=surcharge_(cle);
  var aff={
    titre:s&&typeof s.titre==='string'?s.titre:String(base.titre||''),
    intro:s&&typeof s.intro==='string'?s.intro:String(base.intro||''),
    texte:s&&typeof s.texte==='string'?s.texte:String(base.texte||''),
    bullets:s&&Array.isArray(s.bullets)?s.bullets.slice():liste_(base.bullets)
  };
  var pt=parleDe_(cle,'titre'),pi=parleDe_(cle,'intro'),px=parleDe_(cle,'texte'),pb=parleDe_(cle,'bullets');
  var brut={
    titre:typeof pt==='string'?pt:aff.titre,
    intro:typeof pi==='string'?pi:aff.intro,
    texte:typeof px==='string'?px:aff.texte,
    bullets:Array.isArray(pb)&&pb.length===aff.bullets.length?pb.slice():aff.bullets
  };
  var out=Object.assign({},base,{_cle:cle});
  if(s){
    out.titre=sansBalises_(aff.titre);
    out.intro=sansBalises_(aff.intro);
    out.texte=sansBalises_(aff.texte);
    out.bullets=aff.bullets.map(sansBalises_);
    out._brut=brut;
  }
  return out;
}

var rafraichissementPrevu=false;
function declarer_(cle,def){
  if(!cle||!def)return;
  var nouvelle=!registre[cle];
  registre[cle]=def;
  /* Une clé déclarée après l'affichage de la page Textes (ex. les étapes d'un guide du tutoriel, chargées par l'onglet Tutoriel) apparaît dans la liste sans rouvrir le menu. */
  if(nouvelle&&!rafraichissementPrevu){
    rafraichissementPrevu=true;
    setTimeout(function(){rafraichissementPrevu=false;try{rafraichirListe_();}catch(_e){}},150);
  }
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
    /* Les cadres de texte s'allongent avec ce qu'ils contiennent (Norman, 2026-10-21) : field-sizing quand le navigateur le connaît, sinon ajusterCadres_ (hauteur = contenu). */
    '#'+EDITEUR_ID+' textarea{min-height:90px;resize:vertical;field-sizing:content;overflow-y:hidden}'+
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
    '.stx-groupe{border:1px solid rgba(255,255,255,.14);border-radius:12px;margin:8px 0;background:rgba(255,255,255,.03);padding:2px 10px}'+
    '.stx-groupe>summary{cursor:pointer;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:9px 0;list-style:none;font-size:15px}'+
    '.stx-groupe>summary::-webkit-details-marker{display:none}'+
    '.stx-groupe>summary::before{content:"▸";opacity:.7}.stx-groupe[open]>summary::before{content:"▾"}'+
    '.stx-pastille{display:inline-flex;align-items:center;gap:6px;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:800;background:rgba(255,255,255,.08);color:#b8c7ea;white-space:nowrap}'+
    '.stx-pastille.modif{background:rgba(255,216,74,.16);color:#ffd84a}'+
    /* Feu de validation de la voix (Norman, 2026-10-28) : rouge = pas validée, jaune = validée mais peut mieux faire, vert = totalement validée. Aucun texte, seulement la couleur. */
    '.stx-feu{display:inline-block;box-sizing:border-box;flex:0 0 auto;width:18px;height:18px;padding:0;border-radius:50%;border:2px solid rgba(255,255,255,.55);background:#e03131;box-shadow:0 0 8px 1px rgba(224,49,49,.75)}'+
    '.stx-feu[data-etat="1"]{background:#f5b800;box-shadow:0 0 8px 1px rgba(245,184,0,.75)}'+
    '.stx-feu[data-etat="2"]{background:#2fbf4a;box-shadow:0 0 8px 1px rgba(47,191,74,.75)}'+
    'button.stx-feu{width:34px;height:34px;cursor:pointer;margin-right:4px}button.stx-feu:active{transform:scale(.92)}'+
    /* dans l'éditeur, la règle « #éditeur button » (identifiant) impose le fond des boutons : le feu la reprend avec la même force */
    '#'+EDITEUR_ID+' button.stx-feu{width:34px;height:34px;padding:0;background:#e03131;border:2px solid rgba(255,255,255,.7);box-shadow:0 0 10px 2px rgba(224,49,49,.75)}'+
    '#'+EDITEUR_ID+' button.stx-feu[data-etat="1"]{background:#f5b800;box-shadow:0 0 10px 2px rgba(245,184,0,.75)}'+
    '#'+EDITEUR_ID+' button.stx-feu[data-etat="2"]{background:#2fbf4a;box-shadow:0 0 10px 2px rgba(47,191,74,.75)}'+
    '.stx-adm-ligne{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid rgba(255,255,255,.14);border-radius:10px;margin:6px 0;background:rgba(255,255,255,.04)}'+
    '.stx-adm-ligne .nom{flex:1;min-width:0;font-weight:700}'+
    '.stx-adm-ligne .badge{font-size:12px;padding:2px 8px;border-radius:999px;background:rgba(74,222,128,.18);color:#86efac;white-space:nowrap}'+
    '.stx-adm-ligne .badge.non{background:rgba(255,255,255,.1);color:#b8c7ea}'+
    '#'+EDITEUR_ID+' .stx-cadres{display:grid;gap:10px}'+
    '#'+EDITEUR_ID+' .stx-cadre{background:#0d1424;border:1.5px solid #34425f;border-left:5px solid #5b8cff;border-radius:12px;padding:10px 12px}'+
    '#'+EDITEUR_ID+' .stx-cadre-tete{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px}'+
    '#'+EDITEUR_ID+' .stx-cadre-tete select{width:auto;min-width:160px;background:#0a0e16;color:#f1f4fb;border:1.5px solid #34425f;border-radius:10px;padding:7px 8px;font:600 14px system-ui,sans-serif}'+
    '#'+EDITEUR_ID+' .stx-cadre-n{min-width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#5b8cff;color:#fff;font:800 13px/1 system-ui,sans-serif}'+
    '#'+EDITEUR_ID+' .stx-badge{font-size:12px;padding:2px 8px;border-radius:999px;background:rgba(255,255,255,.1);color:#b8c7ea;white-space:nowrap}'+
    '#'+EDITEUR_ID+' .stx-badge.ok{background:rgba(74,222,128,.18);color:#86efac}'+
    '#'+EDITEUR_ID+' .stx-cadre-fichiers{margin-top:6px}'+
    '#'+EDITEUR_ID+' .stx-mini{display:none}'+
    '#'+EDITEUR_ID+'.stx-reduit{inset:auto 12px 12px auto;width:310px;max-width:calc(100vw - 24px);height:auto;overflow:visible;background:transparent;padding:0;pointer-events:none}'+
    '#'+EDITEUR_ID+'.stx-reduit .stx-carte{display:none}'+
    '#'+EDITEUR_ID+'.stx-reduit .stx-mini{display:block;pointer-events:auto;background:#0d1530;border:1.5px solid #5b8cff;border-radius:14px;padding:10px 12px;box-shadow:0 10px 30px rgba(0,0,0,.55);color:#e8eefc;font:500 13px/1.4 system-ui,sans-serif}'+
    '#'+EDITEUR_ID+' .stx-mini-titre{font-weight:900;font-size:14px;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
    '#'+EDITEUR_ID+' .stx-mini-etat{color:#c9d4ee;margin-bottom:8px;max-height:4.2em;overflow:hidden}'+
    '#'+EDITEUR_ID+' .stx-mini-actions{display:flex;gap:8px;justify-content:flex-end}'+
    /* ----- éditeur v2 (Norman, 2026-10-08) : bulles de dialogue, choix de voix avec écoute, expressions, pauses ----- */
    '#'+EDITEUR_ID+' .stx-v2{padding:0;border-radius:18px;max-width:1780px}'+
    '#'+EDITEUR_ID+' .stx-barre{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:10px;padding:12px 14px;background:linear-gradient(180deg,#1a2540,#131b2e);border-bottom:1px solid #2b3a5c;border-radius:18px 18px 0 0}'+
    '#'+EDITEUR_ID+' .stx-barre h3{margin:0;font-size:17px;line-height:1.2}'+
    '#'+EDITEUR_ID+' .stx-sous{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:12px;color:#9fb0d4;margin-top:3px}'+
    '#'+EDITEUR_ID+' .stx-corps{padding:14px;display:grid;gap:12px}'+
    '#'+EDITEUR_ID+' .stx-icone{min-width:42px;padding:0;font-size:18px;border-radius:12px}'+
    '#'+EDITEUR_ID+' .stx-pastille{display:inline-flex;align-items:center;gap:6px;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:800;background:rgba(255,255,255,.08);color:#b8c7ea;white-space:nowrap}'+
    '#'+EDITEUR_ID+' .stx-pastille.modif{background:rgba(255,216,74,.16);color:#ffd84a}'+
    '#'+EDITEUR_ID+' .stx-champ-titre{font-weight:800;font-size:13px;color:#b8c7ea;letter-spacing:.03em;text-transform:uppercase;margin:4px 0 2px}'+
    '#'+EDITEUR_ID+' .stx-cadre{background:#0e1626;border:1px solid #2a3858;border-left:6px solid var(--stx-c,#5b8cff);border-radius:14px;padding:10px 12px}'+
    '#'+EDITEUR_ID+' .stx-bulle-tete{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}'+
    '#'+EDITEUR_ID+' .stx-flex{flex:1}'+
    '#'+EDITEUR_ID+' .stx-flex{flex:1}'+
    '#'+EDITEUR_ID+' .stx-etat-voix{font-size:12px;font-weight:800;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,.08);color:#b8c7ea;white-space:nowrap}'+
    '#'+EDITEUR_ID+' .stx-etat-voix.ok{background:rgba(74,222,128,.16);color:#86efac}'+
    '#'+EDITEUR_ID+' .stx-bulle-pied{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:8px}'+
    '#'+EDITEUR_ID+' details.stx-det{margin-top:8px}'+
    '#'+EDITEUR_ID+' details.stx-det>summary{cursor:pointer;font-size:13px;font-weight:700;color:#9fb0d4;padding:6px 2px;list-style:none}'+
    '#'+EDITEUR_ID+' details.stx-det>summary::-webkit-details-marker{display:none}'+
    '#'+EDITEUR_ID+' button.stx-ajout{width:100%;border-style:dashed;min-height:46px;background:transparent;color:#9fc3ff}'+
    '#'+EDITEUR_ID+' .stx-pied{position:sticky;bottom:0;z-index:5;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px;background:linear-gradient(0deg,#121a2c,#151f35);border-top:1px solid #2b3a5c;border-radius:0 0 18px 18px}'+
    '#'+EDITEUR_ID+' .stx-pied button.stx-gros{min-height:46px;padding:8px 18px;font-size:15px}'+
    '#'+EDITEUR_ID+' .stx-plus-pied{position:relative;margin-left:auto}'+
    '#'+EDITEUR_ID+' .stx-plus-pied>summary{cursor:pointer;list-style:none;min-height:42px;min-width:42px;display:grid;place-items:center;border-radius:10px;border:1.5px solid #4b5d85;background:#1b2538;font:900 20px/1 system-ui,sans-serif}'+
    '#'+EDITEUR_ID+' .stx-plus-pied>summary::-webkit-details-marker{display:none}'+
    '#'+EDITEUR_ID+' .stx-plus-menu{position:absolute;right:0;bottom:50px;z-index:6;display:grid;gap:8px;min-width:230px;padding:10px;border-radius:14px;background:#10151f;border:1.5px solid #4b5d85;box-shadow:0 12px 30px rgba(0,0,0,.55)}'+
    '#'+EDITEUR_ID+' .stx-plus-menu label{display:flex;align-items:center;gap:8px;margin:0;font-size:13px;text-transform:none;letter-spacing:0}'+
    /* ----- éditeur de voix pensé pour un écran de PC de 1920 x 1080 (Norman, 2026-10-08) : grande carte, deux bulles côte à côte, texte plus gros ----- */
    '#'+EDITEUR_ID+'{padding:18px 28px}'+
    '#'+EDITEUR_ID+' .stx-v2 textarea,#'+EDITEUR_ID+' .stx-v2 input[type=text]{font-size:17px;line-height:1.55}'+
    '#'+EDITEUR_ID+' .stx-cadres{grid-template-columns:repeat(auto-fit,minmax(820px,1fr));gap:16px;align-items:start}'+
    '#'+EDITEUR_ID+' .stx-corps{padding:18px 20px;gap:16px}'+
    '#'+EDITEUR_ID+' .stx-lib-titre{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0 4px;font:800 12px/1.3 system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:#9fb0d4}'+
    '#'+EDITEUR_ID+' textarea.stx-verrou{background:#0b111c;color:#c3cfeb;border-style:dashed;cursor:default}'+
    '#'+EDITEUR_ID+' .stx-voixbloc{margin-top:10px;padding:8px 10px 10px;border:1.5px solid #2f6a4d;background:#0a1813;border-radius:12px}'+
    '#'+EDITEUR_ID+' .stx-voixbloc .stx-lib-titre{color:#86efac;margin-top:0}'+
    '#'+EDITEUR_ID+' .stx-voixbloc textarea{background:#07120e;border-color:#2f6a4d;min-height:78px}'+
    '#'+EDITEUR_ID+' .stx-voixbloc textarea:focus{border-color:#4ade80;outline:none}'+
    '#'+EDITEUR_ID+' button.stx-verrou-btn{min-height:30px;padding:4px 10px;font-size:12px}'+
    /* ----- éditeur repensé (Norman, 2026-10-11) : cadre doré, personnages en cartes, barre d'outils toujours visible ----- */
    '#'+EDITEUR_ID+' .stx-barre2{position:sticky;top:60px;z-index:4;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px;background:rgba(16,21,31,.97);border-bottom:2px solid #2b3a5c}'+
    '#'+EDITEUR_ID+' .stx-grp-studio{display:flex;align-items:center;gap:8px;flex-wrap:wrap}'+
    '#'+EDITEUR_ID+' .stx-sep{width:2px;align-self:stretch;background:#2b3a5c}'+
    '#'+EDITEUR_ID+' .stx-b-go{background:linear-gradient(180deg,#46e08f,#16995a);border-color:#000;color:#04210f}'+
    '#'+EDITEUR_ID+' .stx-b-stop{background:linear-gradient(180deg,#ff7a86,#c42a3c);border-color:#000;color:#fff}'+
    '#'+EDITEUR_ID+' .stx-b-sel{background:linear-gradient(180deg,#7bd4ff,#2b7fb8);border-color:#000;color:#031a2a}'+
    '#'+EDITEUR_ID+' .stx-b-neutre{background:linear-gradient(180deg,#6a5f8f,#3d3560);border-color:#000}'+
    '#'+EDITEUR_ID+' .stx-barre2 button:disabled{opacity:.35;cursor:default}'+
    '#'+EDITEUR_ID+' .stx-prog{position:relative;flex:1 1 160px;min-width:130px;height:18px;border-radius:9px;background:#0a0e16;border:2px solid #000;overflow:hidden}'+
    '#'+EDITEUR_ID+' .stx-prog i{position:absolute;inset:0 auto 0 0;width:0;background:linear-gradient(90deg,#16995a,#7dffb4);transition:width .3s}'+
    '#'+EDITEUR_ID+' .stx-prog span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;text-shadow:0 1px 2px #000}'+
    '#'+EDITEUR_ID+' .stx-bloc{margin:0 0 22px}'+
    '#'+EDITEUR_ID+' .stx-or{background:linear-gradient(180deg,#f7d87a,#d8a233);border:3px solid #6b4607;border-radius:14px;padding:10px 12px 12px;color:#2a1a02;box-shadow:inset 0 2px 0 rgba(255,255,255,.55),0 4px 0 #000}'+
    '#'+EDITEUR_ID+' .stx-etiq{margin:0 0 4px;font-weight:900;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#5a3a02}'+
    '#'+EDITEUR_ID+' .stx-or textarea,#'+EDITEUR_ID+' .stx-or input[type=text]{background:rgba(255,248,214,.6);color:#2a1a02;border:2px solid #7d5410;font-weight:700}'+
    '#'+EDITEUR_ID+' .stx-rang{display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap}'+
    '#'+EDITEUR_ID+' .stx-bor{background:linear-gradient(180deg,#ffe9a6,#e8b84a);color:#2a1500;border:2px solid #000;box-shadow:0 3px 0 #000}'+
    '#'+EDITEUR_ID+' .stx-bor-danger{background:linear-gradient(180deg,#ff9aa4,#d9485a);color:#2a0008}'+
    '#'+EDITEUR_ID+' .stx-info{font-size:13px;color:#5a3a02}'+
    '#'+EDITEUR_ID+' .stx-sous-or{margin:10px 0 0 18px;padding-left:14px;border-left:4px dashed #6a5f8f}'+
    '#'+EDITEUR_ID+' .stx-etiq2{margin:0 0 8px;font-weight:900;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#b9aedb}'+
    '#'+EDITEUR_ID+' .stx-info2{font-weight:600;text-transform:none;letter-spacing:0;color:#8e84b3}'+
    '#'+EDITEUR_ID+' .stx-persos{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;align-items:start}'+
    '#'+EDITEUR_ID+' .stx-perso{border-left-width:6px}'+
    '#'+EDITEUR_ID+' .stx-perso.sel{box-shadow:0 0 0 2px rgba(94,200,255,.55);border-color:#5ec8ff}'+
    '#'+EDITEUR_ID+' .stx-coche{width:20px;height:20px;accent-color:#5ec8ff;cursor:pointer;flex:none}'+
    '#'+EDITEUR_ID+' .stx-persos>button.stx-ajout{min-height:150px;font-size:18px}'+
    '#'+EDITEUR_ID+' .stx-champ>button.stx-ajout{margin-top:6px}'+
    '@media(max-width:600px){#'+EDITEUR_ID+'{padding:0}#'+EDITEUR_ID+' .stx-v2{border-radius:0;min-height:100%}#'+EDITEUR_ID+' .stx-barre{border-radius:0}#'+EDITEUR_ID+' .stx-pied{border-radius:0;gap:6px;padding:8px 10px}#'+EDITEUR_ID+' .stx-lib{display:none}#'+EDITEUR_ID+' .stx-pied>button[data-stx-act="ecouter"]{min-width:46px;padding:6px 0}#'+EDITEUR_ID+' .stx-pied>button,#'+EDITEUR_ID+' .stx-pied button.stx-gros{min-height:42px;padding:6px 11px;font-size:13px}}';
  document.head.appendChild(s);
}

/* ---------- voix, expressions : couleurs, noms, choix (module partagé modules/voix-ui-v1.js) ---------- */
function VU_(){return window.__SOREAL_IDLE_VOIX_UI_V1__||null;}
function couleurVoix_(id){var u=VU_();return u?u.couleurVoix(id):'#5b8cff';}
/* Une voix est « prête » si son fichier existe ET qu'elle n'est pas à refaire (voix ou expression changée depuis). */
function etatVoixHtml_(blocs){
  if(!blocs||!blocs.length)return '';
  var voix=edition.voix||[],aR=edition.aRefaire||{};
  var prets=blocs.filter(function(b){return voix.indexOf(b.hash)!==-1&&!aR[b.hash];}).length;
  if(prets>=blocs.length)return '<span class="stx-etat-voix ok">🎙 Voix prête</span>';
  return '<span class="stx-etat-voix">'+(prets?'🎙 '+prets+'/'+blocs.length+' prêtes':'○ À générer')+'</span>';
}
function puceStudioHtml_(){
  var u=VU_();
  return u?u.puceStudioHtml(studio.ok,'sorealIdleTexteStudioV1'):'';
}
function majPuceStudio_(){
  var el=document.getElementById('sorealIdleTexteStudioV1');
  if(el)el.outerHTML=puceStudioHtml_();
  majBarreGeneration_();
}

function voixProposees_(){
  var reg=window.__SOREAL_IDLE_VOIX_NOMMEES_V1__;
  var nommees=reg&&Array.isArray(reg.liste)?reg.liste:[];
  return [['narrateur','🎙 Narrateur'],['femme','👩 Femme']].concat(nommees.map(function(v){return [v.id,'🎭 '+v.nom];}));
}

/*
 * Un cadre par personnage (Norman, 2026-10-04 : « je dois avoir un cadre par personnage ; je choisis la voix pour ce cadre ; j'en ajoute un autre, je choisis sa voix, etc. ; chaque cadre génère la voix du personnage
 * uniquement, de sa ligne même »). Les champs de type « texte » (la chronique d'un boss, le texte d'un popup) sont affichés en cadres { parleur, texte }. Le texte enregistré ne change pas de forme : la première
 * ligne est lue par le narrateur sauf balise, chaque cadre suivant est précédé de la balise de sa voix « (femme) », « (marius) »… exactement ce que lit le jeu. Les anciens textes avec balises sont découpés en cadres
 * à l'ouverture.
 */
/* Les champs parlés : un « texte » (chronique de boss…) ou une « liste » de paragraphes (tutoriels, nouveautés) : dans une liste, un cadre = un paragraphe. */
function champParle_(c){return Boolean(c&&(c.type==='texte'||c.type==='liste'||(typeof edition!=='undefined'&&edition&&edition.def&&edition.def.titre===c.id)));}
/* Voix en vigueur à la fin d'un texte : celle de sa dernière balise, sinon celle avec laquelle il a commencé. */
function voixFinale_(texte,depart){
  return etatFinal_(texte,depart,'').voix;
}
/* Expression désignée par le contenu d'une parenthèse (« joyeux »…), ou « » ; « neutre » désigne le ton de base (identifiant vide dans l'éditeur). */
function exprDeBalise_(contenu){
  var t=tts_();
  try{return t&&typeof t.resoudreExpressionBalise==='function'?String(t.resoudreExpressionBalise(contenu)||''):'';}catch(_e){return '';}
}
function exprCanon_(e){return e==='neutre'?'':(e||'');}
/* Voix et expression en vigueur à la fin d'un texte : une balise de voix ramène au ton neutre, une balise d'expression dure jusqu'à la suivante. */
function etatFinal_(texte,voix,expr){
  var re=/\(\s*([^()\n]{1,40}?)\s*\)/g,m;
  while((m=re.exec(String(texte==null?'':texte)))){
    var v=voixDeBalise_(m[1]);
    if(v){voix=parleurUi_(v);expr='';continue;}
    var e=exprDeBalise_(m[1]);
    if(e)expr=exprCanon_(e);
  }
  return {voix:voix,expr:expr};
}
/* Balises de TÊTE d'un texte (voix et/ou expression, dans leur ordre) : appliquées à l'état de départ ; le reste est le texte du cadre. Les pauses restent dans le texte. */
function teteBalises_(texte,voix,expr){
  var reste=String(texte==null?'':texte).trim(),re=/^\(\s*([^()\n]{1,40}?)\s*\)\s*/,m;
  while((m=re.exec(reste))){
    var v=voixDeBalise_(m[1]);
    if(v){voix=parleurUi_(v);expr='';reste=reste.slice(m[0].length);continue;}
    var e=exprDeBalise_(m[1]);
    if(e){expr=exprCanon_(e);reste=reste.slice(m[0].length);continue;}
    break;
  }
  return {voix:voix,expr:expr,reste:reste};
}
/* Liste de paragraphes -> cadres : la voix d'un paragraphe est celle de sa balise de tête, sinon celle qui était en vigueur à la fin du paragraphe précédent. */
function lignesDepuisListe_(liste){
  var etat={voix:'narrateur',expr:''},lignes=[];
  (Array.isArray(liste)?liste:[]).forEach(function(p){
    var t=teteBalises_(p,etat.voix,etat.expr);
    lignes.push({parleur:t.voix,expr:t.expr,texte:t.reste});
    etat=etatFinal_(t.reste,t.voix,t.expr);
  });
  return lignes.length?lignes:[{parleur:'narrateur',expr:'',texte:''}];
}
/* Cadres -> liste de paragraphes : une balise de tête seulement quand la voix change. */
function listeDepuisLignes_(lignes){
  var etat={voix:'narrateur',expr:''},liste=[];
  (lignes||[]).forEach(function(l){
    var texte=String(l&&l.texte||'').trim();
    if(!texte)return;
    var v=l.parleur||'narrateur',e=l.expr||'',balises='';
    if(v!==etat.voix){balises+='('+v+') ';etat={voix:v,expr:''};}
    if(e!==etat.expr){balises+='('+(e||'neutre')+') ';etat={voix:etat.voix,expr:e};}
    liste.push(balises+texte);
    etat=etatFinal_(texte,etat.voix,etat.expr);
  });
  return liste;
}
function parleurUi_(v){return v==='homme'||!v?'narrateur':v;}
function lignesDepuisTexte_(texte){
  var brut=String(texte==null?'':texte);
  var re=/\(\s*([^()\n]{1,40}?)\s*\)/g;
  var voix='narrateur',dernier=0,m,lignes=[];
  function clore(fin){
    var t=teteBalises_(brut.slice(dernier,fin),voix,'');
    if(t.reste)lignes.push({parleur:voix,expr:t.expr,texte:t.reste});
  }
  while((m=re.exec(brut))){
    var v=voixDeBalise_(m[1]);
    if(!v)continue;
    clore(m.index);
    voix=parleurUi_(v);
    dernier=m.index+m[0].length;
  }
  clore(brut.length);
  return lignes.length?lignes:[{parleur:voix,expr:'',texte:''}];
}
/*
 * Découpe aux points (Norman, 2026-10-21 : « dès que le texte a un point, il crée une case de nouveau personnage et découpe ainsi tout le texte, peu importe qu'il y ait 10 ou 20 personnages : ça me permet de générer de petites parties de voix »).
 * Une phrase = un personnage. On coupe APRÈS un point suivi d'un espace ; « ... » (points de suspension), les nombres (3.5) et les points sans espace derrière ne coupent pas.
 */
function decouperPhrases_(texte){
  var t=String(texte==null?'':texte).trim();
  if(!t)return [''];
  var morceaux=[],debut=0,re=/\.\s+/g,m;
  while((m=re.exec(t))){
    var avant=t.charAt(m.index-1);
    if(m.index===0||avant==='.'||/\s/.test(avant))continue;
    var piece=t.slice(debut,m.index+1).trim();
    if(piece)morceaux.push(piece);
    debut=m.index+m[0].length;
  }
  var fin=t.slice(debut).trim();
  if(fin)morceaux.push(fin);
  return morceaux.length?morceaux:[t];
}
/* Chaque cadre d'une liste de lignes devient autant de cadres que de phrases (même voix, même expression, même paragraphe u). */
function lignesParPhrase_(lignes){
  var out=[];
  (lignes||[]).forEach(function(l){
    decouperPhrases_(l.texte).forEach(function(p){out.push({parleur:l.parleur,expr:l.expr||'',texte:p,u:l.u});});
  });
  return out;
}
function texteDepuisLignes_(lignes){
  var utiles=(lignes||[]).filter(function(x){return String(x&&x.texte||'').trim();});
  return utiles.map(function(x,k){
    var balise=(k>0||x.parleur!=='narrateur')?'('+x.parleur+') ':'';
    if(x.expr)balise+='('+x.expr+') ';
    return balise+String(x.texte).trim();
  }).join(' ');
}
function normaliser_(t){return String(t==null?'':t).replace(/\([^()]*\)/g,' ').replace(/\s+/g,' ').trim().toLowerCase();}
/* Chaque bloc de voix du texte lu appartient à un cadre : le premier cadre (à partir du précédent) qui contient le début du bloc ; un bloc sans correspondance (le nom lu en tête d'une chronique…) suit le cadre précédent, ou le premier. */
/* Bloc de voix du titre : le premier bloc, s'il est exactement le titre (le nom lu avant la pause), est retiré des cadres. */
function blocsDuTitre_(valeurs,blocs){
  var def=edition&&edition.def;
  if(!def||!def.titre||!blocs.length)return {titre:[],autres:blocs};
  /* Le titre est un texte comme un autre (cadre doré + personnages) : ses blocs vont à ses personnages comme les autres. */
  return {titre:[],autres:blocs};
}
function blocsParCadre_(valeurs){
  var tous=blocsDeLecture_(valeurs,true);
  var separes=blocsDuTitre_(valeurs,tous);
  var blocs=separes.autres;
  var sansDoublons=function(l){var vu={};return l.filter(function(b){if(vu[b.hash])return false;vu[b.hash]=1;return true;});};
  var cadres=[];
  Object.keys(edition.lignes||{}).forEach(function(c){(edition.lignes[c]||[]).forEach(function(l,k){cadres.push({champ:c,k:k,texte:normaliser_(l.texte),blocs:[]});});});
  if(!cadres.length)return {cadres:[],blocs:sansDoublons(blocs),titre:separes.titre};
  var curseur=0;
  blocs.forEach(function(b){
    var debut=normaliser_(b.texte).slice(0,30);
    var trouve=-1;
    /* D'abord un cadre qui contient ce début ET n'a pas encore reçu ce bloc (phrase répétée : le suivant la reçoit), sinon le premier qui le contient. */
    if(debut)for(var i=curseur;i<cadres.length;i+=1){if(cadres[i].texte.indexOf(debut)!==-1&&!cadres[i].blocs.some(function(x){return x.hash===b.hash;})){trouve=i;break;}}
    if(debut&&trouve<0)for(var j=curseur;j<cadres.length;j+=1){if(cadres[j].texte.indexOf(debut)!==-1){trouve=j;break;}}
    /* Aucun cadre ne contient le début du bloc (texte transformé à la lecture) : il suit le cadre en cours s'il n'a encore rien ; sinon il va au prochain cadre avec du texte et sans bloc, qui sinon resterait « vide ». */
    if(trouve<0&&cadres[curseur]&&cadres[curseur].blocs.length){
      for(var q=curseur+1;q<cadres.length;q+=1){if(cadres[q].texte&&!cadres[q].blocs.length){trouve=q;break;}}
    }
    if(trouve>=0)curseur=trouve;
    cadres[trouve>=0?trouve:curseur].blocs.push(b);
  });
  return {cadres:cadres,blocs:sansDoublons(blocs),titre:separes.titre};
}
function blocsDuCadre_(champ,k,valeurs){
  var r=blocsParCadre_(valeurs||lireChamps_());
  if(champ==='__titre')return r.titre||[];
  for(var i=0;i<r.cadres.length;i+=1){if(r.cadres[i].champ===champ&&r.cadres[i].k===k)return r.cadres[i].blocs;}
  return [];
}
function parleurOptions_(courant){
  return voixProposees_().map(function(p){return '<option value="'+esc_(p[0])+'"'+(parleurUi_(courant)===p[0]?' selected':'')+'>'+esc_(p[1])+'</option>';}).join('');
}
function abrege_(t,n){t=String(t==null?'':t).replace(/\s+/g,' ').trim();n=n||90;return t.length>n?t.slice(0,n-1)+'…':t;}
/* Une carte de PERSONNAGE : sa voix et son expression (sélecteur partagé), le texte à DIRE, l'état de sa voix, écouter / générer / retirer. */
function cadreHtml_(champ,k,l,blocs){
  var o=outilsVoix_();
  var u=VU_();
  var voix=edition.voix||[];
  var cle=esc_(champ)+'|'+k;
  var sel=Boolean(edition.sel&&edition.sel[l.id]);
  var fichiers='<div class="stx-cadre-fichiers" data-stx-fv="'+cle+'">'+(o&&blocs.length&&typeof o.fichiersVoixHtml==='function'?'<div class="stx-aide">Télécharger, retoucher ou remplacer la voix de ce personnage.</div>'+o.fichiersVoixHtml(blocs,voix):'<div class="stx-aide">Écris du texte, puis génère la voix.</div>')+'</div>';
  return '<div class="stx-cadre stx-perso'+(sel?' sel':'')+'" data-vu-bulle="'+cle+'" data-stx-cadre="'+cle+'" style="--stx-c:'+couleurVoix_(l.parleur)+';--vu-c:'+couleurVoix_(l.parleur)+'">'+
    '<div class="stx-bulle-tete">'+
      '<input type="checkbox" class="stx-coche" data-stx-sel="'+esc_(l.id)+'" title="Cocher pour ne régénérer que ce personnage"'+(sel?' checked':'')+'>'+
      (u?u.chipsHtml(cle,l):'')+
      '<span class="stx-flex"></span>'+
      '<span data-stx-badge="'+cle+'">'+etatVoixHtml_(blocs)+'</span>'+
    '</div>'+
    '<input type="hidden" data-stx-lparleur="'+cle+'" value="'+esc_(parleurUi_(l.parleur))+'"><input type="hidden" data-stx-lexpr="'+cle+'" value="'+esc_(l.expr||'')+'">'+
    '<div class="stx-lib-titre"><span>🗣 Texte dit par ce personnage</span></div>'+
    '<textarea rows="3" data-stx-ltexte="'+cle+'" placeholder="Ce que dit ce personnage (au départ, une copie du texte des joueurs : change-le comme tu veux, la voix suivra ce texte-ci)…">'+esc_(l.texte)+'</textarea>'+
    (u?u.pausesHtml(cle,'stx-voix'):'')+
    '<div class="stx-bulle-pied">'+
      (u?u.pauseBoutonHtml(cle,'stx-voix'):'')+
      '<span class="stx-flex"></span>'+
      '<button type="button" class="stx-voix" data-stx-l="ecouter" data-c="'+esc_(champ)+'" data-k="'+k+'" title="Écouter uniquement ce personnage">▶ Écouter</button>'+
      '<button type="button" class="stx-voix primaire" data-stx-l="generer" data-c="'+esc_(champ)+'" data-k="'+k+'" title="Générer (ou régénérer) la voix de ce personnage, autant de fois que tu veux">🎙 Générer</button>'+
      '<button type="button" class="stx-voix danger" data-stx-l="suppr" data-c="'+esc_(champ)+'" data-k="'+k+'" title="Retirer ce personnage">🗑</button>'+
    '</div>'+
    '<details class="stx-det"><summary>📁 Fichiers de ce personnage</summary>'+fichiers+'</details>'+
  '</div>';
}
/* Un texte = cadre doré (ce que lisent les joueurs) + ses personnages. Une liste de paragraphes a un cadre doré par paragraphe. */
function uniteHtml_(c,i){
  var champ=c.id,ligne=c.type==='ligne';
  var aff=String((edition.affiche[champ]||[])[i]||'');
  var r=blocsParCadre_(edition.valeurs||lireChamps_());
  var cartes=(edition.lignes[champ]||[]).map(function(l,k){
    if(l.u!==i)return '';
    var blocs=[];
    r.cadres.forEach(function(x){if(x.champ===champ&&x.k===k)blocs=x.blocs;});
    return cadreHtml_(champ,k,l,blocs);
  }).join('');
  var titreUnite=c.type==='liste'?esc_(c.label)+' — paragraphe '+(i+1):esc_(c.label);
  var champOr=ligne
    ?'<input type="text" data-stx-affiche="'+esc_(champ)+'|'+i+'" value="'+esc_(aff)+'">'
    :'<textarea rows="'+(c.type==='liste'?4:6)+'" data-stx-affiche="'+esc_(champ)+'|'+i+'">'+esc_(aff)+'</textarea>';
  return '<section class="stx-bloc" data-stx-unite="'+esc_(champ)+'|'+i+'">'+
    '<div class="stx-champ-titre">'+titreUnite+'</div>'+
    '<div class="stx-or"><p class="stx-etiq">'+(edition.def.titre===champ?'Titre tel que les joueurs le lisent':'Texte tel que les joueurs le lisent')+'</p>'+champOr+
      '<div class="stx-rang"><button type="button" class="stx-bor" data-stx-act="enregistrer">💾 Enregistrer</button>'+
        (c.type==='liste'?'<button type="button" class="stx-bor stx-bor-danger" data-stx-act="unite-" data-c="'+esc_(champ)+'" data-u="'+i+'" title="Retirer ce paragraphe et ses personnages">🗑 Retirer ce paragraphe</button>':'')+
        '<span class="stx-info">Ne change jamais la voix : seuls les personnages ci-dessous parlent.</span></div></div>'+
    '<div class="stx-sous-or"><p class="stx-etiq2">🗣 '+(edition.def.titre===champ?'Titre tel qu’il doit être prononcé':(c.type==='liste'?'Personnages de ce paragraphe — ils parlent à tour de rôle':'Personnages — ils parlent à tour de rôle, dans cet ordre'))+' <span class="stx-info2">— c’est ce que les joueurs entendent, quel que soit le texte doré</span></p>'+
      '<div class="stx-persos">'+cartes+'<button type="button" class="stx-ajout" data-stx-act="cadre+" data-c="'+esc_(champ)+'" data-u="'+i+'" title="Ajouter un personnage">＋ Ajouter un personnage</button></div></div>'+
  '</section>';
}
function cadresChampHtml_(champ){
  var c=champsDef_().filter(function(x){return x.id===champ;})[0];
  if(!c)return '';
  var n=Math.max(1,(edition.affiche[champ]||[]).length);
  var h='';
  for(var i=0;i<n;i+=1)h+=uniteHtml_(c,i);
  if(c.type==='liste')h+='<button type="button" class="stx-ajout" data-stx-act="unite+" data-c="'+esc_(champ)+'">＋ Ajouter un paragraphe</button>';
  return h;
}
/* Re-dessine tout le bloc d'un texte (les numéros des personnages changent quand on en ajoute ou retire un). */
function rafraichirCadres_(champ){
  var el=document.querySelector('#'+EDITEUR_ID+' [data-stx-cadres="'+champ+'"]');
  if(el)el.innerHTML=cadresChampHtml_(champ);
  majBarreGeneration_();
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
    if(champParle_(c)&&edition&&edition.lignes&&edition.lignes[c.id]){
      if(racine){
        /* texte tel que les joueurs le lisent (cadres dorés) */
        var nbU=Math.max(1,(edition.affiche[c.id]||[]).length);
        for(var iu=0;iu<nbU;iu+=1){
          var elA=racine.querySelector('[data-stx-affiche="'+c.id+'|'+iu+'"]');
          if(elA){if(!edition.affiche[c.id])edition.affiche[c.id]=[];edition.affiche[c.id][iu]=elA.value;}
        }
        /* texte dit par chaque personnage */
        edition.lignes[c.id].forEach(function(l,k){
          var cle=c.id+'|'+k;
          var ta=racine.querySelector('[data-stx-ltexte="'+cle+'"]');
          var sel=racine.querySelector('[data-stx-lparleur="'+cle+'"]');
          var ex=racine.querySelector('[data-stx-lexpr="'+cle+'"]');
          if(ta)l.texte=ta.value;
          if(sel)l.parleur=sel.value;
          if(ex)l.expr=ex.value;
        });
      }
      valeurs[c.id]=valeurParleeChamp_(c);
      return;
    }
    var el=racine&&racine.querySelector('[data-stx-champ="'+c.id+'"]');
    valeurs[c.id]=texteVersValeur_(c,el?el.value:'');
  });
  majVoixTextes_(valeurs);
  return valeurs;
}
/* Texte DIT d'un champ : les personnages de chaque cadre doré, avec leurs balises de voix (une liste = un texte par paragraphe). */
function valeurParleeChamp_(c){
  var lignes=edition.lignes[c.id]||[];
  if(c.type==='liste'){
    var n=Math.max(1,(edition.affiche[c.id]||[]).length),out=[];
    for(var i=0;i<n;i+=1)out.push(texteDepuisLignes_(lignes.filter(function(l){return l.u===i;})));
    return out;
  }
  var t=texteDepuisLignes_(lignes);
  return c.type==='ligne'?t.replace(/\s+/g,' ').trim():t;
}
/* Texte AFFICHÉ aux joueurs d'un champ parlé (une liste = un texte par paragraphe). */
function valeurAfficheeChamp_(c){
  var aff=edition.affiche[c.id]||[''];
  if(c.type==='liste')return aff.map(function(x){return String(x||'').trim();});
  var t=String(aff[0]||'');
  return c.type==='ligne'?t.replace(/\s+/g,' ').trim():t.trim();
}

/*
 * Table { empreinte du bloc affiché -> texte de voix } reconstruite à chaque lecture des champs, et blocs « à refaire » : un bloc dont le texte de voix diffère de celui utilisé à sa dernière
 * génération (edition.voixFaites) est refait, comme après un changement de voix ou d'expression.
 */
function majVoixTextes_(valeurs){
  if(!edition)return;
  if(!edition.aRefaire)edition.aRefaire={};
  if(!edition.voixTextes)edition.voixTextes={};
  /* Les anciens textes de voix (avant l'éditeur à personnages) restent utilisés pour les blocs qui n'ont pas changé ; plus aucun n'est créé. */
}
/* Ce qui est envoyé au studio pour un bloc : son texte de voix s'il en a un (sans aucun passage entre parenthèses), sinon le texte affiché. */
function texteVoixDe_(b){
  var v=edition&&edition.voixTextes&&edition.voixTextes[b.hash];
  var t=String(v==null?'':v).replace(/\([^)]*\)/g,' ').replace(/\s+/g,' ').trim();
  return t||b.texte;
}

function afficherEtat_(message,erreur){
  majPuceStudio_();
  var el=document.getElementById('sorealIdleTexteEtatV1');
  var base=studio.texte?'<div class="stx-aide">'+esc_(studio.texte)+'</div>':'';
  if(el){
    el.className='stx-etat'+(erreur?' erreur':'');
    el.innerHTML=(message?esc_(message):'')+base;
  }
  /* Petit menu flottant : la même information, en plus court. */
  var mini=document.getElementById('sorealIdleTexteMiniEtatV1');
  if(mini){
    var texte=message||(generation.enCours?generation.texte:'')||studio.texte||'';
    if(message!==undefined&&message!==null&&message!=='')mini.dataset.dernier=message;
    mini.textContent=generation.enCours&&generation.texte?generation.texte:(message||mini.dataset.dernier||texte);
    var stop=document.getElementById('sorealIdleTexteMiniStopV1');
    if(stop)stop.style.display=generation.enCours?'':'none';
    var titre=document.getElementById('sorealIdleTexteMiniTitreV1');
    if(titre&&edition)titre.textContent=String(edition.def&&edition.def.libelle||'');
  }
}

/* Blocs de voix du texte lu : mêmes blocs et mêmes empreintes que la lecture dans le jeu. */
/* avecDoublons : garde aussi les blocs au texte identique (une phrase répétée dans deux cadres) : chaque cadre doit retrouver SON bloc, sinon il paraît vide (« Ce cadre est vide : rien à générer »). */
function blocsDeLecture_(valeurs,avecDoublons){
  var t=tts_();
  if(!t||typeof t.planNarration!=='function'||typeof t.hashBloc!=='function'||!edition)return [];
  var brut=edition.def.texteLu(valeurs);
  var plan=t.planNarration(t.retirerParentheses(brut));
  var vus={},blocs=[];
  plan.forEach(function(e){
    if(!e||e.chunk==null||!String(e.chunk).trim())return;
    var hash=t.hashBloc(e.chunk);
    if(vus[hash]&&!avecDoublons)return;
    vus[hash]=1;
    var parleur=e.voix||(typeof t.estVoixFemme==='function'&&t.estVoixFemme(e.chunk)?'femme':'homme');
    var bloc={texte:e.chunk,hash:hash,parleur:parleur};
    if(e.expr)bloc.expr=e.expr;
    blocs.push(bloc);
  });
  return blocs;
}

/*
 * Corrections de prononciation dans chaque écran de texte (Norman, 2026-10-03 : « je dois pouvoir changer la prononciation des mots pour chaque écran de texte ; par exemple Alien Vert Dégoûtant,
 * il dit « Ali un » au lieu de « Alienne » »). Même liste que l'éditeur d'histoires (gardée sur ce PC, modules/admin-histoires-v1.js) : une correction vaut pour TOUS les textes. Le remplacement se
 * fait seulement à l'envoi au studio ; le texte affiché et l'empreinte des blocs ne changent pas, donc les blocs concernés sont marqués « à refaire » : « Générer les voix » les régénère.
 */
function pronOutils_(){
  var o=outilsVoix_();
  return o&&typeof o.lirePrononciations==='function'?o:null;
}

function prononciationsHtml_(){
  var o=pronOutils_();
  if(!o)return '';
  var liste=o.lirePrononciations();
  return '<label>🗣 Prononciation <span style="text-transform:none;letter-spacing:0;font-weight:400">(corriger un mot mal lu — vaut pour tous les textes)</span></label>'+
    '<div class="stx-aide">Écris le mot tel qu’il est dans le texte, et comment il doit se dire, écrit comme on le prononce (ex. <b>Alien</b> → <b>Alienne</b>). Le texte affiché ne change pas ; ensuite, clique sur « Générer les voix » : les blocs concernés sont refaits.</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">'+
      '<input type="text" id="sorealIdleTextePronMotV1" placeholder="Mot (ex. Alien)" style="flex:1;min-width:110px">'+
      '<input type="text" id="sorealIdleTextePronDitV1" placeholder="Se prononce (ex. Alienne)" style="flex:1;min-width:130px">'+
      '<button type="button" class="primaire" data-stx-act="pron-ajouter">＋ Ajouter</button>'+
      '<button type="button" data-stx-act="pron-tester" title="Écouter la prononciation saisie, avec le studio">▶ Tester</button>'+
    '</div>'+
    (liste.length?liste.map(function(c,k){
      return '<div style="display:flex;align-items:center;gap:8px;margin-top:6px"><span style="flex:1"><b>'+esc_(c.mot)+'</b> → '+esc_(c.dit)+'</span>'+
        '<button type="button" data-stx-pron="tester" data-k="'+k+'">▶</button>'+
        '<button type="button" class="danger" data-stx-pron="suppr" data-k="'+k+'">🗑</button></div>';
    }).join(''):'<div class="stx-aide" style="margin-top:6px">Aucune correction pour l’instant.</div>');
}

function rafraichirPrononciations_(){
  var el=document.getElementById('sorealIdleTextePronBlocV1');
  if(el)el.innerHTML=prononciationsHtml_();
}

/* Marque « à refaire » les blocs de ce texte où le mot corrigé apparaît ; renvoie leur nombre. */
function marquerBlocsConcernes_(mot,dit){
  var o=pronOutils_();
  if(!o||!edition)return 0;
  var n=0;
  if(!edition.aRefaire)edition.aRefaire={};
  blocsDeLecture_(lireChamps_()).forEach(function(b){
    if(o.appliquerPrononciations(b.texte,[{mot:mot,dit:dit}])!==String(b.texte||'')){edition.aRefaire[b.hash]=true;n+=1;}
  });
  return n;
}

function ajouterPrononciation_(){
  var o=pronOutils_();
  if(!o){afficherEtat_('Outils de prononciation indisponibles (module Admin non chargé).',true);return;}
  var mot=String((document.getElementById('sorealIdleTextePronMotV1')||{}).value||'').trim();
  var dit=String((document.getElementById('sorealIdleTextePronDitV1')||{}).value||'').trim();
  if(!mot||!dit){afficherEtat_('Remplis le mot et sa prononciation.',true);return;}
  var liste=o.lirePrononciations().filter(function(c){return c.mot.toLowerCase()!==mot.toLowerCase();});
  liste.push({mot:mot,dit:dit});
  o.ecrirePrononciations(liste);
  var n=marquerBlocsConcernes_(mot,dit);
  rafraichirPrononciations_();
  afficherEtat_('✔ « '+mot+' » se lira « '+dit+' ».'+(n?' '+n+' bloc'+(n>1?'s':'')+' de ce texte concerné'+(n>1?'s':'')+' : clique sur « 🎙 Générer les voix » pour '+(n>1?'les':'le')+' refaire.':' Ce mot n’apparaît pas dans ce texte (la correction servira aux autres).'));
}

function supprimerPrononciation_(k){
  var o=pronOutils_();
  if(!o)return;
  var liste=o.lirePrononciations();
  var c=liste[k];
  if(!c)return;
  liste.splice(k,1);
  o.ecrirePrononciations(liste);
  var n=marquerBlocsConcernes_(c.mot,c.dit);
  rafraichirPrononciations_();
  afficherEtat_('Correction supprimée.'+(n?' '+n+' bloc'+(n>1?'s':'')+' à refaire : « 🎙 Générer les voix ».':''));
}

/* Écoute directe de la prononciation saisie (sans rien téléverser) : le texte est déjà écrit comme on le dit, aucune seconde correction. */
var essaiPron={audio:null};
function essayerPrononciation_(dit){
  var o=outilsVoix_();
  dit=String(dit||'').trim();
  if(!o||typeof o.synthetiserBrut!=='function'){afficherEtat_('Outils de voix indisponibles.',true);return;}
  if(!dit){afficherEtat_('Écris d’abord comment le mot se prononce.',true);return;}
  afficherEtat_('Essai de prononciation : « '+dit+' »…');
  o.synthetiserBrut(dit,'homme').then(function(blob){
    try{if(essaiPron.audio)essaiPron.audio.pause();}catch(_e){}
    var url=URL.createObjectURL(blob);
    essaiPron.audio=new Audio(url);
    essaiPron.audio.onended=function(){URL.revokeObjectURL(url);};
    essaiPron.audio.play();
    afficherEtat_('');
  }).catch(function(e){afficherEtat_('Essai impossible : '+(e&&e.message?e.message:e),true);});
}

function lirePrononciationsListe_(){var o=pronOutils_();return o?o.lirePrononciations():[];}

function statutVoix_(){
  var blocs=blocsDeLecture_(lireChamps_());
  var prets=blocs.filter(function(b){return edition.voix.indexOf(b.hash)!==-1&&!(edition.aRefaire&&edition.aRefaire[b.hash]);}).length;
  return {total:blocs.length,prets:prets};
}

function barreGenerationHtml_(){
  return '<div class="stx-barre2" id="sorealIdleTexteBarreV1">'+
    '<div class="stx-grp-studio">'+puceStudioHtml_()+
      '<button type="button" class="stx-b-go" data-stx-act="studio-lancer" id="sorealIdleTexteStudioOnV1" title="Lance le studio de voix sur ce PC (via le pilote)">🚀 Lancer le studio</button>'+
      '<button type="button" class="stx-b-stop" data-stx-act="studio-arreter" id="sorealIdleTexteStudioOffV1" title="Arrête le studio de voix sur ce PC">🛑 Arrêter le studio</button></div>'+
    '<span class="stx-sep"></span>'+
    '<button type="button" class="stx-b-go" data-stx-act="generer" id="sorealIdleTexteGenererV1" title="Génère les voix qui ne sont pas encore prêtes">▶ Générer les voix manquantes</button>'+
    '<button type="button" class="stx-b-sel" data-stx-act="generer-sel" id="sorealIdleTexteGenererSelV1" title="Ne génère que les personnages cochés">▶ Générer la sélection (0)</button>'+
    '<button type="button" class="stx-b-stop" data-stx-act="arreter-gen" id="sorealIdleTexteStopV1" title="Arrête la génération en cours">⏹ Arrêter</button>'+
    '<button type="button" class="stx-b-neutre" data-stx-act="tout-cocher" title="Cocher tous les personnages">☑ Tout cocher</button>'+
    '<button type="button" class="stx-b-neutre" data-stx-act="rien-cocher" title="Décocher tous les personnages">☐ Tout décocher</button>'+
    '<div class="stx-prog" title="Progression de la génération"><i id="sorealIdleTexteProgBarV1"></i><span id="sorealIdleTexteProgTxtV1">En attente</span></div>'+
  '</div>';
}
function nbSelection_(){
  var n=0;
  Object.keys(edition&&edition.sel||{}).forEach(function(id){if(edition.sel[id])n+=1;});
  return n;
}
/* Boutons de la barre : sélection, génération en cours, studio. */
function majBarreGeneration_(){
  if(!edition)return;
  var n=nbSelection_(),sel=document.getElementById('sorealIdleTexteGenererSelV1');
  var enCours=generation.enCours,studioOff=studio.ok===false;
  if(sel){sel.textContent='▶ Générer la sélection ('+n+')';sel.disabled=n===0||enCours||studioOff;}
  var tout=document.getElementById('sorealIdleTexteGenererV1');
  if(tout){tout.textContent='▶ Générer les voix manquantes';tout.disabled=enCours||studioOff;}
  var stop=document.getElementById('sorealIdleTexteStopV1');
  if(stop)stop.disabled=!enCours;
  var on=document.getElementById('sorealIdleTexteStudioOnV1'),off=document.getElementById('sorealIdleTexteStudioOffV1');
  if(on)on.disabled=studio.ok===true;
  if(off)off.disabled=studio.ok!==true||enCours;
  Array.prototype.forEach.call(document.querySelectorAll('#'+EDITEUR_ID+' [data-stx-l="generer"]'),function(x){x.disabled=enCours||studioOff;});
}
function majProgression_(fait,total,texte){
  var b=document.getElementById('sorealIdleTexteProgBarV1'),t=document.getElementById('sorealIdleTexteProgTxtV1');
  if(b)b.style.width=(total>0?Math.round(100*fait/total):0)+'%';
  if(t)t.textContent=texte||(total>0?fait+' sur '+total:'En attente');
}

function dessinerEditeur_(){
  installerStyle_();
  var ancien=document.getElementById(EDITEUR_ID);
  if(ancien)ancien.remove();
  var d=edition.def;
  var champsHtml=d.champs.map(function(c){
    if(champParle_(c)&&edition.lignes&&edition.lignes[c.id]){
      return '<div class="stx-champ" data-stx-cadres="'+esc_(c.id)+'">'+cadresChampHtml_(c.id)+'</div>';
    }
    var valeur=valeurVersTexte_(c,edition.valeurs[c.id]);
    var rows=c.type==='liste'?9:7;
    var aide=c.type==='liste'?'<div class="stx-aide">Sépare chaque élément par une ligne vide.</div>':'';
    var champ=c.type==='ligne'
      ?'<input type="text" data-stx-champ="'+esc_(c.id)+'" value="'+esc_(valeur)+'">'
      :'<textarea rows="'+rows+'" data-stx-champ="'+esc_(c.id)+'">'+esc_(valeur)+'</textarea>';
    return '<div><div class="stx-champ-titre">'+esc_(c.label)+'</div>'+champ+aide+'</div>';
  }).join('');
  var racine=document.createElement('div');
  racine.id=EDITEUR_ID;
  racine.innerHTML=
    '<div class="stx-carte stx-v2" role="dialog" aria-modal="true" title="'+esc_(edition.cle)+'">'+
      '<div class="stx-barre">'+
        '<div style="flex:1;min-width:0"><h3>✏️ '+esc_(d.libelle)+'</h3>'+
          '<div class="stx-sous">'+(edition.surcharge?'<span class="stx-pastille modif">texte modifié</span>':'<span class="stx-pastille">texte d’origine</span>')+'</div></div>'+
        feuHtml_(edition.cle,true)+
        '<button type="button" class="stx-icone" data-stx-act="reduire" title="Réduire : tu peux continuer à jouer pendant que les voix se génèrent">➖</button>'+
        '<button type="button" class="stx-icone" data-stx-act="fermer" title="Fermer">✕</button>'+
      '</div>'+
      barreGenerationHtml_()+
      '<div class="stx-corps">'+
        champsHtml+
        '<details class="stx-det"><summary>🗣 Prononciation : corriger un mot mal lu</summary><div id="sorealIdleTextePronBlocV1">'+prononciationsHtml_()+'</div></details>'+
        '<div class="stx-etat" id="sorealIdleTexteEtatV1"></div>'+
      '</div>'+
      '<div class="stx-pied">'+
        '<button type="button" class="primaire stx-gros" data-stx-act="enregistrer">💾 Enregistrer</button>'+
        '<button type="button" data-stx-act="ecouter" id="sorealIdleTexteEcouterV1" title="Écouter tout le texte">▶<span class="stx-lib"> Tout écouter</span></button>'+
        '<details class="stx-plus-pied"><summary title="Plus d’actions">⋯</summary><div class="stx-plus-menu">'+
          '<label><input type="checkbox" id="sorealIdleTexteToutesV1"> Tout régénérer (même les voix prêtes)</label>'+
          (edition.surcharge?'<button type="button" class="danger" data-stx-act="retablir">↩ Rétablir l’original</button>':'')+
        '</div></details>'+
      '</div>'+
    '</div>'+
    '<div class="stx-mini">'+
      '<div class="stx-mini-titre">🎙 Voix · <span id="sorealIdleTexteMiniTitreV1"></span></div>'+
      '<div class="stx-mini-etat" id="sorealIdleTexteMiniEtatV1"></div>'+
      '<div class="stx-mini-actions">'+
        '<button type="button" class="danger" data-stx-act="arreter-gen" id="sorealIdleTexteMiniStopV1">⏹ Arrêter</button>'+
        '<button type="button" class="primaire" data-stx-act="agrandir">⤢ Rouvrir</button>'+
      '</div>'+
    '</div>';
  document.body.appendChild(racine);
  racine.classList.toggle('stx-reduit',reduit);
  var uiPartagee=VU_();
  if(uiPartagee)uiPartagee.activer(racine,{
    surChoix:function(type,cle){edition.valeurs=lireChamps_();ouvrirSelecteur_(type,cle);},
    texteDe:function(cle){return racine.querySelector('[data-stx-ltexte="'+cle+'"]');}
  });
  racine.addEventListener('focusin',function(ev){
    if(ev.target&&ev.target.getAttribute&&ev.target.getAttribute('data-stx-champ'))edition.dernierChamp=ev.target;
  });
  afficherEtat_(statutLigne_());
  majBarreGeneration_();
  /* les états de validation viennent de la liste Admin : chargée si elle ne l'est pas encore (le feu s'allume dès qu'elle arrive) */
  if(!admin.charge)chargerAdmin_(majFeux_);
}
/* Liste des fichiers de voix des blocs du texte en cours d'édition (outils partagés avec l'éditeur d'histoires). */
function fichiersVoixEditeurHtml_(){
  return '';
}
function rafraichirFichiersVoix_(){
  if(!edition)return;
  var o=outilsVoix_();
  var valeurs=lireChamps_();
  var r=blocsParCadre_(valeurs);
  r.cadres.forEach(function(c){
    var el=document.querySelector('#'+EDITEUR_ID+' [data-stx-fv="'+c.champ+'|'+c.k+'"]');
    if(el)el.innerHTML=o&&c.blocs.length&&typeof o.fichiersVoixHtml==='function'?'<div class="stx-aide">Télécharger, retoucher ou remplacer la voix de ce personnage.</div>'+o.fichiersVoixHtml(c.blocs,edition.voix):'<div class="stx-aide">Écris du texte, puis génère la voix.</div>';
    var badge=document.querySelector('#'+EDITEUR_ID+' [data-stx-badge="'+c.champ+'|'+c.k+'"]');
    if(badge)badge.innerHTML=etatVoixHtml_(c.blocs);
  });
}
function statutLigne_(){
  var s=statutVoix_();
  if(!s.total)return '';
  return '🎙 '+s.prets+' voix prête'+(s.prets>1?'s':'')+' sur '+s.total+(s.prets<s.total?' : les autres seront lues avec la voix de secours du jeu':'')+'.';
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

/* Choix fait dans le sélecteur partagé : la bulle prend la voix ou l'expression ; ses fichiers de voix sont à refaire (la voix et l'expression se règlent à la génération). */
function appliquerChoix_(type,cle,valeur){
  if(!edition)return;
  var pos=String(cle).split('|'),champ=pos[0],k=Number(pos[1]);
  var racine=document.getElementById(EDITEUR_ID);
  var l=edition.lignes&&edition.lignes[champ]&&edition.lignes[champ][k];
  if(!racine||!l)return;
  var avant=blocsDuCadre_(champ,k,lireChamps_());
  if(type==='voix'){
    l.parleur=parleurUi_(valeur);
    var h=racine.querySelector('[data-stx-lparleur="'+cle+'"]');
    if(h)h.value=l.parleur;
  }else{
    l.expr=exprCanon_(valeur);
    var he=racine.querySelector('[data-stx-lexpr="'+cle+'"]');
    if(he)he.value=l.expr;
  }
  if(!edition.aRefaire)edition.aRefaire={};
  avant.forEach(function(b){if(edition.voix.indexOf(b.hash)!==-1)edition.aRefaire[b.hash]=1;});
  var u=VU_();
  if(u)u.appliquerAuxPuces(racine.querySelector('[data-stx-cadre="'+cle+'"]'),l);
  rafraichirFichiersVoix_();
  afficherEtat_(statutLigne_());
}
/* Ouvre le sélecteur partagé (voix ou expression, avec écoute) pour une bulle. */
function ouvrirSelecteur_(type,cle){
  var u=VU_(),racine=document.getElementById(EDITEUR_ID);
  if(!u||!racine||!edition)return;
  var pos=String(cle||'').split('|'),champ=pos[0],k=Number(pos[1]);
  var l=edition.lignes&&edition.lignes[champ]&&edition.lignes[champ][k];
  if(!l)return;
  lireChamps_();
  u.ouvrirSelecteur({racine:racine,type:type,ligne:l,outils:outilsVoix_(),apres:function(valeur){appliquerChoix_(type,cle,valeur);}});
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

/* « Tout écouter » : sur téléphone seule l'icône reste (le libellé complet est dans l'info-bulle), pour que les actions tiennent sur une ligne. */
function majBoutonEcouter_(b,actif){
  b.innerHTML=actif?'⏹<span class="stx-lib"> Arrêter</span>':'▶<span class="stx-lib"> Tout écouter</span>';
}
function arreterEcoute_(){
  ecoute=false;ecouteCle='';
  Array.prototype.forEach.call(document.querySelectorAll('#'+EDITEUR_ID+' [data-stx-l="ecouter"]'),function(x){x.textContent='▶ Écouter';});
  try{var t=tts_();if(t&&typeof t.stop==='function')t.stop();}catch(_e){}
  var b=document.getElementById('sorealIdleTexteEcouterV1');
  if(b)majBoutonEcouter_(b,false);
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
  if(b)majBoutonEcouter_(b,true);
  var demarre=false;
  try{demarre=t.readText(t.retirerParentheses(brut),undefined,function(){ecoute=false;var bb=document.getElementById('sorealIdleTexteEcouterV1');if(bb)majBoutonEcouter_(bb,false);});}catch(_e){demarre=false;}
  if(!demarre){ecoute=false;if(b)majBoutonEcouter_(b,false);afficherEtat_('Rien à lire dans ce texte.',true);}
}

/* Test direct d'un texte de voix avec le studio (rien n'est téléversé) : exactement la phrase qui sera générée, avec la voix et l'expression de la bulle. */
var essaiVoix={audio:null};
function testerVoix_(champ,k,i){
  var o=outilsVoix_();
  if(!o||typeof o.synthetiser!=='function'){afficherEtat_('Outils de voix indisponibles (module Admin non chargé).',true);return;}
  lireChamps_();
  var b=blocsDuCadre_(champ,k)[i];
  if(!b){afficherEtat_('Rien à tester : écris d’abord le texte affiché.',true);return;}
  var texte=texteVoixDe_(b);
  afficherEtat_('Test avec le studio : « '+abrege_(texte,70)+' »…');
  o.synthetiser(texte,b.parleur,b.expr).then(function(blob){
    try{if(essaiVoix.audio)essaiVoix.audio.pause();}catch(_e){}
    var url=URL.createObjectURL(blob);
    essaiVoix.audio=new Audio(url);
    essaiVoix.audio.onended=function(){URL.revokeObjectURL(url);};
    essaiVoix.audio.play();
    afficherEtat_('');
  }).catch(function(e){afficherEtat_('Test impossible : '+(e&&e.message?e.message:e),true);});
}
/* Copie le texte affiché d'un bloc dans son champ de voix, pour le retoucher. */
function copierVersVoix_(champ,k,i){
  lireChamps_();
  var b=blocsDuCadre_(champ,k)[i];
  var racine=document.getElementById(EDITEUR_ID);
  var ta=racine&&racine.querySelector('[data-stx-lvoix="'+champ+'|'+k+'#'+i+'"]');
  if(!b||!ta)return;
  ta.value=b.texte;
  lireChamps_();
  rafraichirFichiersVoix_();
  try{ta.focus();}catch(_e){}
}
/* Verrou du texte affiché d'une bulle : sans re-rendu (le texte en cours de saisie reste). */
function basculerVerrou_(champ,k){
  var l=edition.lignes&&edition.lignes[champ]&&edition.lignes[champ][k];
  var racine=document.getElementById(EDITEUR_ID);
  if(!l||!racine)return;
  l.deverrouille=!l.deverrouille;
  var ta=racine.querySelector('[data-stx-ltexte="'+champ+'|'+k+'"]');
  var btn=racine.querySelector('[data-stx-l="verrou"][data-c="'+champ+'"][data-k="'+k+'"]');
  if(ta){ta.readOnly=!l.deverrouille;ta.classList.toggle('stx-verrou',!l.deverrouille);if(l.deverrouille){try{ta.focus();}catch(_e){}}}
  if(btn)btn.textContent=l.deverrouille?'✏️ Modifiable · protéger':'✋ Protégé · modifier';
}

/* Écoute uniquement la ligne d'un cadre, avec la voix générée si elle existe (sinon la voix de secours du jeu, signalée). */
function ecouterCadre_(champ,k){
  var t=tts_();
  if(!t||typeof t.readText!=='function'){afficherEtat_('Lecture vocale indisponible sur cet appareil.',true);return;}
  var cle=champ+'|'+k;
  if(ecouteCle===cle){arreterEcoute_();return;}
  arreterEcoute_();
  lireChamps_();
  var l=edition.lignes[champ]&&edition.lignes[champ][k];
  var texte=String(l&&l.texte||'').replace(/\s+/g,' ').trim();
  if(!texte){afficherEtat_('Ce cadre est vide : rien à écouter.',true);return;}
  enregistrerVoix_(edition.voix);
  var blocs=blocsDuCadre_(champ,k);
  var pret=blocs.length&&blocs.every(function(b){return edition.voix.indexOf(b.hash)!==-1;});
  afficherEtat_(pret?'':'Voix du studio pas encore générée pour ce cadre : lecture avec la voix de secours du jeu.');
  ecouteCle=cle;
  var btn=document.querySelector('#'+EDITEUR_ID+' [data-stx-l="ecouter"][data-c="'+champ+'"][data-k="'+k+'"]');
  if(btn)btn.textContent='⏹ Arrêter';
  var fini=function(){if(ecouteCle===cle){arreterEcoute_();}};
  var demarre=false;
  try{demarre=t.readText(t.retirerParentheses(texte),undefined,fini);}catch(_e){demarre=false;}
  if(!demarre)fini();
}

function charge_(valeurs){
  /* Les empreintes d'un bloc qui n'existe plus (texte dit modifié) sont retirées : le « nettoyage des voix » supprimera leurs fichiers. Sans le module de narration, rien n'est touché. */
  var blocsActuels=blocsDeLecture_(valeurs);
  if(blocsActuels.length){
    var actuelles={};
    blocsActuels.forEach(function(b){actuelles[b.hash]=1;});
    edition.voix=edition.voix.filter(function(h){return actuelles[h];});
  }
  var o={cle:edition.cle,champs:{},parle:{},voix:edition.voix.slice(),voixTextes:{},voixFaites:{}};
  champsDef_().forEach(function(c){
    if(champParle_(c)&&edition.lignes&&edition.lignes[c.id]){
      var aff=valeurAfficheeChamp_(c),dit=valeurParleeChamp_(c);
      if(c.type==='liste'){
        /* un paragraphe sans texte affiché disparaît avec ses personnages (les deux listes restent alignées) */
        var gA=[],gD=[];
        aff.forEach(function(a,i){if(a){gA.push(a);gD.push(dit[i]||a);}});
        o.champs[c.id]=gA;o.parle[c.id]=gD;
      }else{
        o.champs[c.id]=aff;
        o.parle[c.id]=dit||aff;
      }
    }else o.champs[c.id]=valeurs[c.id];
  });
  /* Anciens textes de voix : seulement ceux de blocs qui existent encore. */
  var presents={};
  blocsActuels.forEach(function(b){presents[b.hash]=1;});
  Object.keys(edition.voixTextes||{}).forEach(function(h){if(presents[h])o.voixTextes[h]=edition.voixTextes[h];});
  Object.keys(edition.voixFaites||{}).forEach(function(h){if(presents[h]&&edition.voix.indexOf(h)!==-1)o.voixFaites[h]=edition.voixFaites[h];});
  return o;
}

function enregistrer_(){
  var valeurs=lireChamps_();
  edition.valeurs=valeurs;
  return appel_('enregistrerTexteAdminSorealIdle',[charge_(valeurs)]).then(function(res){
    if(!res||res.ok===false){afficherEtat_((res&&res.message)||'Enregistrement refusé.',true);return false;}
    edition.surcharge=res.texte||charge_(valeurs);
    miseAJourApresEcriture_(edition.cle,edition.surcharge);
    /* def.apresEnregistrer : renvoie le texte affiché à sa source (l'éditeur de guides y met à jour l'étape). */
    try{if(typeof edition.def.apresEnregistrer==='function')edition.def.apresEnregistrer({champs:charge_(valeurs).champs});}catch(_e){}
    afficherEtat_('✔ Enregistré. '+statutLigne_());
    rafraichirFichiersVoix_();
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
    /* nom = nom ACTUEL du boss : le nom modifié, ou l'original si la surcharge est retirée. */
    admin.boss.forEach(function(b){if(b.numero===n){b.surcharge=surcharge||null;b.nom=(surcharge&&surcharge.champs&&surcharge.champs.nom)||b.nomOriginal||b.nom;}});
    enregistrerVoix_(surcharge?surcharge.voix:[]);
    /* Le nouveau texte du boss arrive avec la prochaine synchronisation ; on la demande tout de suite. */
    try{var rt=window.__SOREAL_IDLE_RUNTIME_V1__;if(rt&&typeof rt.invalidate==='function')rt.invalidate();}catch(_e){}
    try{if(typeof window.__SOREAL_IDLE_FORCER_SYNCHRO_V1__==='function')window.__SOREAL_IDLE_FORCER_SYNCHRO_V1__();}catch(_e2){}
  }else{
    if(surcharge)surcharges.popups[cle]={champs:surcharge.champs,parle:surcharge.parle||{},voix:surcharge.voix||[]};else delete surcharges.popups[cle];
    /* Fiche complète (avec les textes de voix, jamais envoyés aux joueurs) gardée pour rouvrir l'éditeur sans perdre les textes de voix. */
    admin.popups=(admin.popups||[]).filter(function(p){return !(p&&p.cle===cle);});
    if(surcharge)admin.popups.push(Object.assign({cle:cle},surcharge));
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
  if(VU_())VU_().fermerSelecteur();
  arreterEcoute_();
  if(generation.enCours)generation.annule=true;
  var r=document.getElementById(EDITEUR_ID);
  if(r)r.remove();
  edition=null;
  reduit=false;
}

function majBoutonGenerer_(){
  majBarreGeneration_();
}
/* Génère seulement les personnages cochés (toujours refaits). */
function genererSelection_(){
  var o=outilsVoix_();
  if(generation.enCours){generation.annule=true;afficherEtat_('Arrêt demandé…');return;}
  if(!o){afficherEtat_('Outils de voix indisponibles (module Admin non chargé).',true);return;}
  var valeurs=lireChamps_();
  edition.valeurs=valeurs;
  var vus={},aFaire=[];
  Object.keys(edition.lignes).forEach(function(champ){
    edition.lignes[champ].forEach(function(l,k){
      if(!edition.sel||!edition.sel[l.id])return;
      blocsDuCadre_(champ,k,valeurs).forEach(function(b){if(!vus[b.hash]){vus[b.hash]=1;aFaire.push(b);}});
    });
  });
  if(!aFaire.length){afficherEtat_('Coche d’abord un ou plusieurs personnages (avec du texte).',true);return;}
  lancerGeneration_(o,aFaire,'Sélection');
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
  if(studio.ok===false){afficherEtat_('Le studio de voix n’est pas lancé : clique sur « 🚀 Lancer le studio ».',true);return;}
  /* Blocs dont une correction de prononciation vient de changer : refaits même si une voix existe déjà. */
  var aFaire=blocs.filter(function(b){return toutes||edition.voix.indexOf(b.hash)===-1||(edition.aRefaire&&edition.aRefaire[b.hash]);});
  if(!aFaire.length){afficherEtat_('Toutes les voix sont déjà prêtes (coche « tout régénérer » pour les refaire).');return;}
  lancerGeneration_(o,aFaire,'');
}

/* Une seule ligne (un seul personnage) : toujours régénérée, autant de fois qu'on veut, sans toucher au reste. */
function genererCadre_(champ,k){
  var o=outilsVoix_();
  if(generation.enCours){generation.annule=true;afficherEtat_('Arrêt demandé…');return;}
  if(!o){afficherEtat_('Outils de voix indisponibles (module Admin non chargé).',true);return;}
  var valeurs=lireChamps_();
  edition.valeurs=valeurs;
  var blocs=blocsDuCadre_(champ,k,valeurs);
  if(!blocs.length){afficherEtat_(champ==='__titre'?'Le titre est vide : rien à générer.':'Ce cadre est vide : rien à générer.',true);return;}
  lancerGeneration_(o,blocs,champ==='__titre'?'Titre':'Ligne '+(k+1));
}

function lancerGeneration_(o,aFaire,libelle){
  generation={enCours:true,annule:false,texte:''};
  majBoutonGenerer_();
  majProgression_(0,aFaire.length,'0 sur '+aFaire.length);
  var fait=0;
  var suite=Promise.resolve();
  aFaire.forEach(function(b){
    suite=suite.then(function(){
      if(generation.annule)throw new Error('__annule__');
      generation.texte='🎙 '+(libelle?libelle+' : ':'Génération des voix : ')+(fait+1)+'/'+aFaire.length+' (quelques secondes par bloc)…';
      afficherEtat_(generation.texte);
      return o.synthetiser(texteVoixDe_(b),b.parleur,b.expr).then(function(blob){return o.televerser(b.hash,blob);}).then(function(){
        if(edition.voix.indexOf(b.hash)===-1)edition.voix.push(b.hash);
        /* Voix déclarée tout de suite au lecteur (Norman, 2026-10-15 : l'Aperçu du tutoriel jouait la voix de secours) : sans cela, un bloc généré dans cette session n'était connu du lecteur qu'après « Écouter », et son absence mémorisée le faisait lire par la voix de secours. */
        enregistrerVoix_([b.hash]);
        if(edition.aRefaire)delete edition.aRefaire[b.hash];
        /* Texte de voix utilisé pour CE fichier : tant qu'il ne change pas, le bloc n'est pas « à refaire ». */
        if(!edition.voixFaites)edition.voixFaites={};
        var tv=edition.voixTextes&&edition.voixTextes[b.hash];
        if(tv)edition.voixFaites[b.hash]=tv;else delete edition.voixFaites[b.hash];
        fait+=1;
        majProgression_(fait,aFaire.length);
      });
    });
  });
  suite.then(function(){
    afficherEtat_('Enregistrement des voix…');
    return enregistrer_();
  }).then(function(ok){
    rafraichirFichiersVoix_();
    if(ok)try{var son=window.__SOREAL_IDLE_AUDIO_V199__;if(son&&typeof son.play==='function')son.play('voiceDone');}catch(_e){}
    if(ok)afficherEtat_('✔ '+fait+' voix générée'+(fait>1?'s':'')+' et enregistrée'+(fait>1?'s':'')+'. Clique sur « Écouter » pour entendre. '+statutLigne_());
  }).catch(function(e){
    var msg=e&&e.message?e.message:String(e);
    if(fait>0&&edition)enregistrer_();
    afficherEtat_(msg==='__annule__'?'Génération arrêtée ('+fait+' voix déjà prêtes, enregistrées).':'Échec de la génération : '+msg,msg!=='__annule__');
  }).then(function(){
    generation={enCours:false,annule:false,texte:''};
    majBoutonGenerer_();
    majProgression_(fait,aFaire.length,(fait>=aFaire.length?'Terminé ✔ ':'Arrêté ')+'('+fait+' sur '+aFaire.length+')');
  });
}

/* Ouvre l'éditeur d'un texte déclaré (popup, fenêtre explicative) ou d'un boss (voir editerBoss). */
function ouvrir_(cle,def,surcharge,originaux){
  if(edition)fermer_();
  var courant={};
  def.champs.forEach(function(c){
    var s=surcharge&&surcharge.champs?surcharge.champs[c.id]:undefined;
    /* def.champsDepuisSource : le texte affiché vient toujours de sa source (ex. l'étape d'un guide), jamais d'une copie enregistrée ici ; seuls le texte dit et les voix sont gardés. */
    courant[c.id]=(s!==undefined&&!def.champsDepuisSource)?s:(originaux?originaux[c.id]:'');
  });
  edition={cle:cle,def:def,surcharge:surcharge||null,valeurs:courant,affiche:{},sel:{},voix:surcharge&&Array.isArray(surcharge.voix)?surcharge.voix.slice():[],dernierChamp:null,aRefaire:{},lignes:{},
    voixTextes:surcharge&&surcharge.voixTextes&&typeof surcharge.voixTextes==='object'?Object.assign({},surcharge.voixTextes):{},
    voixFaites:surcharge&&surcharge.voixFaites&&typeof surcharge.voixFaites==='object'?Object.assign({},surcharge.voixFaites):{},
    titreVoix:''};
  /*
   * Un cadre doré (texte des joueurs) et des personnages (texte dit) pour chaque texte parlé. Le texte DIT vient de « parle » ; sans lui (texte d'origine, ou enregistré avant l'éditeur à personnages), il part du texte avec ses
   * balises, et le texte des joueurs est ce texte sans balises. Chaque personnage est une carte avec un identifiant stable (sélection).
   */
  var uid=0;
  def.champs.forEach(function(c){
    if(!champParle_(c))return;
    var dit=surcharge&&surcharge.parle&&surcharge.parle[c.id]!==undefined?surcharge.parle[c.id]:courant[c.id];
    var brutAff=courant[c.id];
    var possedeParle=Boolean(surcharge&&surcharge.parle&&surcharge.parle[c.id]!==undefined);
    if(c.type==='liste'){
      var listeA=(Array.isArray(brutAff)?brutAff:[]).map(function(x){return possedeParle?String(x||''):sansBalises_(x);});
      var listeD=Array.isArray(dit)?dit:[];
      var n=Math.max(listeA.length,listeD.length,1);
      edition.affiche[c.id]=[];
      edition.lignes[c.id]=[];
      var cartesListe=lignesDepuisListe_(listeD.length?listeD:listeA);
      for(var i=0;i<n;i+=1){
        edition.affiche[c.id][i]=listeA[i]!==undefined?listeA[i]:'';
        var l=cartesListe[i]||{parleur:'narrateur',expr:'',texte:edition.affiche[c.id][i]};
        /* Texte jamais modifié (aucun texte dit enregistré) : un personnage par phrase. Un texte déjà modifié garde ses cadres tels que Norman les a faits. */
        var phrases=possedeParle?[l.texte]:decouperPhrases_(l.texte);
        phrases.forEach(function(p){edition.lignes[c.id].push({parleur:l.parleur,expr:l.expr||'',texte:p,u:i,id:'c'+(++uid)});});
      }
    }else{
      var aff=possedeParle?String(brutAff==null?'':brutAff):sansBalises_(brutAff);
      edition.affiche[c.id]=[aff];
      edition.lignes[c.id]=lignesDepuisTexte_(dit).map(function(l){return {parleur:l.parleur,expr:l.expr||'',texte:l.texte,u:0,id:'c'+(++uid)};});
      /* texte d'origine sans balises : le personnage part d'une copie du texte des joueurs */
      if(edition.lignes[c.id].length===1&&!String(edition.lignes[c.id][0].texte||'').trim())edition.lignes[c.id][0].texte=aff;
      /* Texte jamais modifié : un personnage par phrase (voir decouperPhrases_). Un texte déjà modifié garde ses cadres. */
      if(!possedeParle)edition.lignes[c.id]=lignesParPhrase_(edition.lignes[c.id]).map(function(l){return {parleur:l.parleur,expr:l.expr||'',texte:l.texte,u:0,id:'c'+(++uid)};});
    }
  });
  edition.valeurs=lireChamps_();
  reduit=false;
  dessinerEditeur_();
  verifierStudio_();
}

/* Textes de voix de l'édition : chaque bulle reprend celui de ses blocs (par empreinte du texte affiché), le titre aussi. */

function editer_(cle){
  var def=registre[cle];
  if(!def)return;
  /* La fiche complète d'un popup (textes de voix compris) vient de la liste Admin ; le joueur ordinaire n'en reçoit que le texte et les empreintes. */
  var ouvrirTexte=function(){
    var s=surchargeComplete_(cle);
    var adm=(admin.popups||[]).filter(function(p){return p&&p.cle===cle;})[0];
    var base=s?{champs:s.champs,voix:Array.isArray(s.voix)?s.voix:[]}:null;
    /* Le texte DIT (« parle », avec les balises de voix) est ce qui redonne les personnages : sans lui, tout revenait en un seul bloc à la réouverture (Norman, 2026-10-15). */
    if(base){var parleSauve=s.parle&&typeof s.parle==='object'&&Object.keys(s.parle).length?s.parle:(adm&&adm.parle&&typeof adm.parle==='object'?adm.parle:null);if(parleSauve)base.parle=parleSauve;}
    if(base&&adm){base.voixTextes=adm.voixTextes||{};base.voixFaites=adm.voixFaites||{};}
    ouvrir_(cle,def,base,def.original());
  };
  if(admin.charge){ouvrirTexte();return;}
  chargerAdmin_(ouvrirTexte);
  setTimeout(function(){if(!edition&&admin.erreur)window.alert(admin.erreur);},4000);
}

function defBoss_(numero,nom){
  return {
    groupe:'Boss',libelle:'Chronique — '+nom+' (boss '+numero+')',
    /* Le NOM est modifiable (Norman, 2026-10-03) : il est affiché partout ET lu par la voix en tête de la chronique. */
    champs:[{id:'nom',label:'Nom du boss (affiché et prononcé)',type:'ligne'},{id:'texte',label:'Texte de la chronique',type:'texte'}],
    /* Le nom est lu en tête de la chronique (un bloc de voix à lui, avant la pause) : il se génère à part, comme un cadre. */
    titre:'nom',
    original:function(){var b=bossParNumero_(numero);return {nom:b?(b.nomOriginal||b.nom):nom,texte:b?b.original:''};},
    texteLu:function(v){
      var t=tts_();
      var nomLu=String(v.nom||'').replace(/\s+/g,' ').trim()||nom;
      return t&&typeof t.composerChronique==='function'?t.composerChronique(nomLu,v.texte):nomLu+' '+v.texte;
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
    ouvrir_('boss:'+numero,defBoss_(numero,b.nom),b.surcharge,{nom:b.nomOriginal||b.nom,texte:b.original});
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
    admin.validations=res.validations&&typeof res.validations==='object'?res.validations:{};
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
  /* Pages de 60 (Norman, 2026-10-26 : « au lieu des 60 premiers boss, des pages pour accéder aux 60 suivants, jusqu'au dernier ; j'ai besoin de tout voir ») */
  var max=60,pages=Math.max(1,Math.ceil(lignes.length/max));
  admin.page=Math.max(0,Math.min(pages-1,Number(admin.page)||0));
  var html=lignes.slice(admin.page*max,admin.page*max+max).map(function(b){
    var s=b.surcharge;
    var badge=s?'<span class="badge">✏️ modifié'+(s.voix&&s.voix.length?' · 🎙 '+s.voix.length:'')+'</span>':'<span class="badge non">d’origine</span>';
    return '<div class="stx-adm-ligne">'+feuHtml_('boss:'+b.numero)+'<span class="nom">#'+b.numero+' — '+esc_(b.nom)+'</span>'+badge+
      '<button type="button" class="stx-bouton" data-stx-boss="'+b.numero+'">✏️ Modifier</button></div>';
  }).join('');
  if(!lignes.length)html='<div class="stx-aide">Aucun boss ne correspond.</div>';
  else if(pages>1){
    var bt=function(p,txt,off){return '<button type="button" class="stx-bouton" data-stx-page="'+p+'"'+(off?' disabled style="opacity:.4"':'')+'>'+txt+'</button>';};
    var deb=admin.page*max+1,fin=Math.min(lignes.length,admin.page*max+max);
    var barre='<div class="stx-pager" style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;margin:8px 0">'+
      bt(0,'⏮',admin.page===0)+bt(admin.page-1,'◀ Précédents',admin.page===0)+
      '<span class="stx-aide" style="margin:0 6px">Page '+(admin.page+1)+' / '+pages+' · boss '+(lignes[0]?lignes[deb-1].numero:'')+' à '+lignes[fin-1].numero+' ('+lignes.length+' au total)</span>'+
      bt(admin.page+1,'Suivants ▶',admin.page>=pages-1)+bt(pages-1,'⏭',admin.page>=pages-1)+'</div>';
    html=barre+html+barre;
  }
  return html;
}

function listePopupsHtml_(){
  var cles=Object.keys(registre);
  if(!cles.length)return '<div class="stx-aide">Les fenêtres explicatives apparaissent ici une fois le jeu chargé.</div>';
  var groupes={};
  cles.forEach(function(c){var g=registre[c].groupe||'Autres';(groupes[g]=groupes[g]||[]).push(c);});
  var cache=function(g){return g.indexOf('Voix sans texte')===0;};
  var ordre=Object.keys(groupes).sort(function(a,b){
    var pa=cache(a)?0:1,pb=cache(b)?0:1;
    return pa!==pb?pa-pb:(a<b?-1:1);
  });
  return ordre.map(function(g){
    var liste=groupes[g].sort(function(a,b){return a<b?-1:1;});
    var modifs=liste.filter(function(c){return surcharge_(c);}).length;
    return '<details class="stx-groupe"'+(cache(g)?' open':'')+'><summary><b>'+esc_(g)+'</b><span class="stx-pastille">'+liste.length+'</span>'+
      (modifs?'<span class="stx-pastille modif">'+modifs+' modifié'+(modifs>1?'s':'')+'</span>':'')+'</summary>'+
      liste.map(function(cle){
        var d=registre[cle],sm=surcharge_(cle);
        return '<div class="stx-adm-ligne">'+feuHtml_(cle)+'<span class="nom">'+esc_(d.libelle)+'</span>'+
          (sm?'<span class="badge">✏️ modifié</span>':'<span class="badge non">d’origine</span>')+
          '<button type="button" class="stx-bouton" data-stx-cle="'+esc_(cle)+'">✏️ Modifier</button></div>';
      }).join('')+'</details>';
  }).join('');
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
    (window.__SOREAL_IDLE_PHRASES_V1__?window.__SOREAL_IDLE_PHRASES_V1__.editeurHtml():'')+
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
    var fv=ev.target.closest('[data-fv]');
    if(fv){
      var o=outilsVoix_();
      if(!o||typeof o.clicFichierVoix!=='function'){afficherEtat_('Outils de voix indisponibles (module Admin non chargé).',true);return;}
      edition.valeurs=lireChamps_();
      o.clicFichierVoix(fv,{
        nomBase:String(edition.cle||'texte').replace(/[^a-z0-9]+/gi,'-'),
        message:function(t,erreur){afficherEtat_(t,erreur);},
        /* Régénère uniquement ce bloc (un bout de phrase), sans toucher aux autres. */
        regenerer:function(hash,n){
          if(generation.enCours){generation.annule=true;afficherEtat_('Arrêt demandé…');return;}
          var r=blocsParCadre_(edition.valeurs),trouve=null;
          (r.titre||[]).concat(r.blocs||[]).forEach(function(b){if(!trouve&&b.hash===hash)trouve=b;});
          if(!trouve){afficherEtat_('Bloc introuvable : enregistre puis réessaie.',true);return;}
          lancerGeneration_(o,[trouve],'Bloc '+n);
        },
        /* Le fichier remplacé garde son empreinte : on la déclare dans le texte et on l'enregistre, pour que le nettoyage ne le supprime pas. */
        apres:function(hash){
          if(edition.voix.indexOf(hash)===-1)edition.voix.push(hash);
          enregistrerVoix_([hash]);
          if(edition.aRefaire)delete edition.aRefaire[hash];
          return enregistrer_();
        }
      });
      return;
    }
    var lg=ev.target.closest('[data-stx-l]');
    if(lg){
      var cL=lg.getAttribute('data-c'),kL=Number(lg.getAttribute('data-k'));
      var aL=lg.getAttribute('data-stx-l');
      edition.valeurs=lireChamps_();
      if(aL==='ecouter'){ecouterCadre_(cL,kL);return;}
      if(aL==='vtest'){testerVoix_(cL,kL,Number(lg.getAttribute('data-i'))||0);return;}
      if(aL==='vcopier'){copierVersVoix_(cL,kL,Number(lg.getAttribute('data-i'))||0);return;}
      if(aL==='verrou'){basculerVerrou_(cL,kL);return;}
      if(aL==='generer'){genererCadre_(cL,kL);return;}
      if(aL==='suppr'){
        var liste=edition.lignes[cL];
        if(!liste||!liste[kL])return;
        var uS=liste[kL].u;
        var memeUnite=liste.filter(function(x){return x.u===uS;}).length;
        /* Un texte garde au moins un personnage : retirer le dernier le vide seulement. */
        if(memeUnite<=1){liste[kL].texte='';}else{delete edition.sel[liste[kL].id];liste.splice(kL,1);}
        edition.valeurs=lireChamps_();
        rafraichirCadres_(cL);
        afficherEtat_(statutLigne_());
        return;
      }
    }
    var v=ev.target.closest('[data-stx-voix]');
    if(v){inserer_(v.getAttribute('data-stx-voix'));return;}
    var pr=ev.target.closest('[data-stx-pron]');
    if(pr){
      var listePr=lirePrononciationsListe_();
      var kPr=Number(pr.getAttribute('data-k'));
      if(pr.getAttribute('data-stx-pron')==='tester'){if(listePr[kPr])essayerPrononciation_(listePr[kPr].dit);return;}
      if(pr.getAttribute('data-stx-pron')==='suppr'&&listePr[kPr]){supprimerPrononciation_(kPr);return;}
    }
    var a=ev.target.closest('[data-stx-act]');
    if(a){
      var act=a.getAttribute('data-stx-act');
      if(act==='feu'){changerFeu_(edition.cle);return;}
      if(act==='fermer'){fermer_();return;}
      if(act==='reduire'){edition.valeurs=lireChamps_();reduit=true;racine.classList.add('stx-reduit');afficherEtat_();return;}
      if(act==='agrandir'){reduit=false;racine.classList.remove('stx-reduit');return;}
      if(act==='arreter-gen'){if(generation.enCours){generation.annule=true;afficherEtat_('Arrêt demandé…');}return;}
      if(act==='cadre+'){
        /* Nouveau personnage : une copie du texte des joueurs (à retoucher), à la suite de ceux de son cadre doré. */
        var cN=a.getAttribute('data-c'),uN=Number(a.getAttribute('data-u'))||0;
        edition.valeurs=lireChamps_();
        var lN=edition.lignes[cN];
        if(lN){
          var dernier=-1;
          lN.forEach(function(x,i){if(x.u===uN)dernier=i;});
          var prec=dernier>=0?lN[dernier]:null;
          lN.splice(dernier+1,0,{parleur:prec?prec.parleur:'narrateur',expr:'',texte:String((edition.affiche[cN]||[])[uN]||''),u:uN,id:nouvelId_()});
          rafraichirCadres_(cN);
        }
        return;
      }
      if(act==='unite+'){
        var cU=a.getAttribute('data-c');
        edition.valeurs=lireChamps_();
        var affU=edition.affiche[cU]||(edition.affiche[cU]=['']);
        affU.push('');
        edition.lignes[cU].push({parleur:'narrateur',expr:'',texte:'',u:affU.length-1,id:nouvelId_()});
        rafraichirCadres_(cU);
        return;
      }
      if(act==='unite-'){
        var cR=a.getAttribute('data-c'),uR=Number(a.getAttribute('data-u'))||0;
        edition.valeurs=lireChamps_();
        var affR=edition.affiche[cR]||[];
        if(affR.length<=1){affR[0]='';edition.lignes[cR].forEach(function(x){x.texte='';});}
        else{
          affR.splice(uR,1);
          edition.lignes[cR]=edition.lignes[cR].filter(function(x){return x.u!==uR;}).map(function(x){if(x.u>uR)x.u-=1;return x;});
        }
        edition.valeurs=lireChamps_();
        rafraichirCadres_(cR);
        return;
      }
      if(act==='generer-sel'){genererSelection_();return;}
      if(act==='tout-cocher'||act==='rien-cocher'){
        var cocher=act==='tout-cocher';
        Object.keys(edition.lignes).forEach(function(c){edition.lignes[c].forEach(function(x){edition.sel[x.id]=cocher;});});
        Array.prototype.forEach.call(racine.querySelectorAll('[data-stx-sel]'),function(b){b.checked=cocher;var carte=b.closest('.stx-perso');if(carte)carte.classList.toggle('sel',cocher);});
        majBarreGeneration_();
        return;
      }
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
      if(act==='pron-ajouter'){ajouterPrononciation_();return;}
      if(act==='pron-tester'){essayerPrononciation_((document.getElementById('sorealIdleTextePronDitV1')||{}).value);return;}
    }
    return;
  }
  var cleBtn=ev.target&&ev.target.closest?ev.target.closest('[data-stx-cle]'):null;
  if(cleBtn){ev.preventDefault();ev.stopPropagation();editer_(cleBtn.getAttribute('data-stx-cle'));return;}
  var pageBtn=ev.target&&ev.target.closest?ev.target.closest('[data-stx-page]'):null;
  if(pageBtn&&!pageBtn.disabled){ev.preventDefault();ev.stopPropagation();admin.page=Number(pageBtn.getAttribute('data-stx-page'))||0;var lb=document.getElementById('sorealIdleTextesBossListeV1');if(lb){lb.innerHTML=listeBossHtml_();if(lb.scrollIntoView)lb.scrollIntoView({block:'start'});}return;}
  var bossBtn=ev.target&&ev.target.closest?ev.target.closest('[data-stx-boss]'):null;
  if(bossBtn){ev.preventDefault();ev.stopPropagation();editerBoss_(bossBtn.getAttribute('data-stx-boss'));}
},true);

var minuterieFichiers=0;
document.addEventListener('input',function(ev){
  var el=ev.target;
  if(edition&&el&&el.getAttribute&&(el.getAttribute('data-stx-champ')||el.getAttribute('data-stx-ltexte')||el.getAttribute('data-stx-affiche'))){clearTimeout(minuterieFichiers);minuterieFichiers=setTimeout(rafraichirFichiersVoix_,700);}
  if(el&&el.id==='sorealIdleTextesFiltreV1'){
    admin.filtre=el.value;admin.page=0;
    var b=document.getElementById('sorealIdleTextesBossListeV1');
    if(b)b.innerHTML=listeBossHtml_();
    return;
  }
  if(edition&&el&&el.getAttribute&&(el.getAttribute('data-stx-champ')||el.getAttribute('data-stx-ltexte')||el.getAttribute('data-stx-affiche')))afficherEtat_(statutLigne_());
});
/* Changer la voix d'un cadre change aussi ses fichiers de voix (la voix fait partie de ce qui est lu). */
document.addEventListener('change',function(ev){
  var el=ev.target;
  if(edition&&el&&el.getAttribute&&el.getAttribute('data-stx-sel')){
    edition.sel[el.getAttribute('data-stx-sel')]=Boolean(el.checked);
    var carteSel=el.closest('.stx-perso');
    if(carteSel)carteSel.classList.toggle('sel',Boolean(el.checked));
    majBarreGeneration_();
    return;
  }
  if(edition&&el&&el.getAttribute&&el.getAttribute('data-stx-lparleur'))rafraichirFichiersVoix_();
});

window.__SOREAL_IDLE_TEXTES_V1__={
  surcharge:surcharge_,
  /* Met à jour (ou retire, avec champs=null) une surcharge simple enregistrée hors de l'éditeur, par exemple les listes de phrases (modules/phrases-coffre-valise-v1.js). */
  majSimple:function(cle,champs){miseAJourApresEcriture_(cle,champs?{champs:champs,parle:{},voix:[]}:null);},
  /* Texte DIT d'un champ (le cadre des personnages de l'éditeur), tel qu'il a été enregistré avec la voix générée ; undefined si la voix suit le texte affiché. */
  parle:parleDe_,
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

/* Cadres de texte qui s'adaptent à leur contenu (repli de field-sizing) : hauteur recalculée à chaque saisie et à chaque réécriture de l'éditeur. */
function ajusterCadres_(racine){
  var l=(racine||document).querySelectorAll('#'+EDITEUR_ID+' textarea'),i,t;
  for(i=0;i<l.length;i++){
    t=l[i];
    if(!t.offsetParent&&!t.getClientRects().length)continue;
    t.style.height='auto';
    t.style.height=(t.scrollHeight+(t.offsetHeight-t.clientHeight))+'px';
  }
}
(function(){
  var prevu=0;
  function planifier(){if(prevu)return;prevu=requestAnimationFrame(function(){prevu=0;try{ajusterCadres_();}catch(_e){}});}
  if(document.addEventListener)document.addEventListener('input',function(ev){var t=ev.target;if(t&&t.tagName==='TEXTAREA'&&t.closest&&t.closest('#'+EDITEUR_ID))planifier();},true);
  try{if(typeof MutationObserver!=='undefined')new MutationObserver(function(ml){for(var i=0;i<ml.length;i++){var n=ml[i].target;if(n&&n.nodeType===1&&n.closest&&(n.id===EDITEUR_ID||n.closest('#'+EDITEUR_ID))){planifier();return;}}}).observe(document.body,{childList:true,subtree:true});}catch(_e){}
  if(window.addEventListener)window.addEventListener('resize',planifier);
})();

charger_();
})();
