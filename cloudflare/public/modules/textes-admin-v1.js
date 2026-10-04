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
var ecouteCle='';
var reduit=false;                    // éditeur réduit en petit menu flottant (la génération continue pendant qu'on joue)

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
    '#'+EDITEUR_ID+' .stx-mini-actions{display:flex;gap:8px;justify-content:flex-end}';
  document.head.appendChild(s);
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
function champParle_(c){return Boolean(c&&c.type==='texte');}
function parleurUi_(v){return v==='homme'||!v?'narrateur':v;}
function lignesDepuisTexte_(texte){
  var brut=String(texte==null?'':texte);
  var re=/\(\s*([^()\n]{1,40}?)\s*\)/g;
  var voix='narrateur',dernier=0,m,lignes=[];
  function clore(fin){
    var t=brut.slice(dernier,fin).trim();
    if(t)lignes.push({parleur:voix,texte:t});
  }
  while((m=re.exec(brut))){
    var v=voixDeBalise_(m[1]);
    if(!v)continue;
    clore(m.index);
    voix=parleurUi_(v);
    dernier=m.index+m[0].length;
  }
  clore(brut.length);
  return lignes.length?lignes:[{parleur:voix,texte:''}];
}
function texteDepuisLignes_(lignes){
  var utiles=(lignes||[]).filter(function(x){return String(x&&x.texte||'').trim();});
  return utiles.map(function(x,k){
    var balise=(k>0||x.parleur!=='narrateur')?'('+x.parleur+') ':'';
    return balise+String(x.texte).trim();
  }).join(' ');
}
function normaliser_(t){return String(t==null?'':t).replace(/\([^()]*\)/g,' ').replace(/\s+/g,' ').trim().toLowerCase();}
/* Chaque bloc de voix du texte lu appartient à un cadre : le premier cadre (à partir du précédent) qui contient le début du bloc ; un bloc sans correspondance (le nom lu en tête d'une chronique…) suit le cadre précédent, ou le premier. */
function blocsParCadre_(valeurs){
  var blocs=blocsDeLecture_(valeurs);
  var cadres=[];
  Object.keys(edition.lignes||{}).forEach(function(c){(edition.lignes[c]||[]).forEach(function(l,k){cadres.push({champ:c,k:k,texte:normaliser_(l.texte),blocs:[]});});});
  if(!cadres.length)return {cadres:[],blocs:blocs};
  var curseur=0;
  blocs.forEach(function(b){
    var debut=normaliser_(b.texte).slice(0,30);
    var trouve=-1;
    if(debut)for(var i=curseur;i<cadres.length;i+=1){if(cadres[i].texte.indexOf(debut)!==-1){trouve=i;break;}}
    if(trouve>=0)curseur=trouve;
    cadres[trouve>=0?trouve:curseur].blocs.push(b);
  });
  return {cadres:cadres,blocs:blocs};
}
function blocsDuCadre_(champ,k,valeurs){
  var r=blocsParCadre_(valeurs||lireChamps_());
  for(var i=0;i<r.cadres.length;i+=1){if(r.cadres[i].champ===champ&&r.cadres[i].k===k)return r.cadres[i].blocs;}
  return [];
}
function parleurOptions_(courant){
  return voixProposees_().map(function(p){return '<option value="'+esc_(p[0])+'"'+(parleurUi_(courant)===p[0]?' selected':'')+'>'+esc_(p[1])+'</option>';}).join('');
}
function cadreHtml_(champ,k,l,blocs){
  var o=outilsVoix_();
  var voix=edition.voix||[];
  var prets=blocs.filter(function(b){return voix.indexOf(b.hash)!==-1;}).length;
  var badge=!blocs.length?'':(prets>=blocs.length?'<span class="stx-badge ok">🎙 prête</span>':'<span class="stx-badge">🎙 '+prets+'/'+blocs.length+'</span>');
  var cle=esc_(champ)+'|'+k;
  return '<div class="stx-cadre" data-stx-cadre="'+cle+'">'+
    '<div class="stx-cadre-tete"><span class="stx-cadre-n">'+(k+1)+'</span>'+
      '<select data-stx-lparleur="'+cle+'" title="La voix de ce personnage">'+parleurOptions_(l.parleur)+'</select>'+badge+
      '<span style="flex:1"></span>'+
      '<button type="button" class="stx-voix" data-stx-l="ecouter" data-c="'+esc_(champ)+'" data-k="'+k+'" title="Écouter uniquement cette ligne">▶ Écouter</button>'+
      '<button type="button" class="stx-voix primaire" data-stx-l="generer" data-c="'+esc_(champ)+'" data-k="'+k+'" title="Générer (ou régénérer) la voix de CE personnage seulement, autant de fois que tu veux">🎙 Générer cette ligne</button>'+
      '<button type="button" class="stx-voix danger" data-stx-l="suppr" data-c="'+esc_(champ)+'" data-k="'+k+'" title="Supprimer ce cadre">🗑</button>'+
    '</div>'+
    '<textarea rows="3" data-stx-ltexte="'+cle+'" placeholder="Ce que dit ce personnage…">'+esc_(l.texte)+'</textarea>'+
    '<div class="stx-cadre-fichiers" data-stx-fv="'+cle+'">'+(o&&blocs.length&&typeof o.fichiersVoixHtml==='function'?'<div class="stx-aide">Fichiers de voix de cette ligne (télécharger, retoucher, remplacer)</div>'+o.fichiersVoixHtml(blocs,voix):'')+'</div>'+
  '</div>';
}
function cadresChampHtml_(champ){
  var r=blocsParCadre_(lireChamps_());
  var lignes=edition.lignes[champ]||[];
  return lignes.map(function(l,k){
    var blocs=[];
    r.cadres.forEach(function(c){if(c.champ===champ&&c.k===k)blocs=c.blocs;});
    return cadreHtml_(champ,k,l,blocs);
  }).join('')+'<button type="button" data-stx-act="cadre+" data-c="'+esc_(champ)+'">＋ Ajouter un personnage</button>';
}
function rafraichirCadres_(champ){
  var el=document.querySelector('#'+EDITEUR_ID+' [data-stx-cadres="'+champ+'"]');
  if(el)el.innerHTML=cadresChampHtml_(champ);
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
      /* Cadres : le texte et la voix de chacun, puis le texte du champ est recomposé avec ses balises. */
      if(racine){
        edition.lignes[c.id].forEach(function(l,k){
          var cle=c.id+'|'+k;
          var ta=racine.querySelector('[data-stx-ltexte="'+cle+'"]');
          var sel=racine.querySelector('[data-stx-lparleur="'+cle+'"]');
          if(ta)l.texte=ta.value;
          if(sel)l.parleur=sel.value;
        });
      }
      valeurs[c.id]=texteDepuisLignes_(edition.lignes[c.id]);
      return;
    }
    var el=racine&&racine.querySelector('[data-stx-champ="'+c.id+'"]');
    valeurs[c.id]=texteVersValeur_(c,el?el.value:'');
  });
  return valeurs;
}

function afficherEtat_(message,erreur){
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
  var prets=blocs.filter(function(b){return edition.voix.indexOf(b.hash)!==-1;}).length;
  return {total:blocs.length,prets:prets};
}

function dessinerEditeur_(){
  installerStyle_();
  var ancien=document.getElementById(EDITEUR_ID);
  if(ancien)ancien.remove();
  var d=edition.def;
  var champsHtml=d.champs.map(function(c){
    if(champParle_(c)&&edition.lignes&&edition.lignes[c.id]){
      return '<label>'+esc_(c.label)+'</label>'+
        '<div class="stx-aide">Un cadre par personnage : choisis sa voix, écris sa ligne, puis génère la voix de ce cadre seulement. Ajoute un cadre pour chaque nouveau personnage.</div>'+
        '<div class="stx-cadres" data-stx-cadres="'+esc_(c.id)+'">'+cadresChampHtml_(c.id)+'</div>';
    }
    var valeur=valeurVersTexte_(c,edition.valeurs[c.id]);
    var rows=c.type==='liste'?9:7;
    var aide=c.type==='liste'?'<div class="stx-aide">Sépare chaque élément par une ligne vide.</div>':'';
    var champ=c.type==='ligne'
      ?'<input type="text" data-stx-champ="'+esc_(c.id)+'" value="'+esc_(valeur)+'">'
      :'<textarea rows="'+rows+'" data-stx-champ="'+esc_(c.id)+'">'+esc_(valeur)+'</textarea>';
    return '<label>'+esc_(c.label)+'</label>'+champ+aide;
  }).join('');
  var racine=document.createElement('div');
  racine.id=EDITEUR_ID;
  racine.innerHTML=
    '<div class="stx-carte" role="dialog" aria-modal="true">'+
      '<div style="display:flex;align-items:center;gap:8px"><h3 style="flex:1">✏️ '+esc_(d.libelle)+'</h3>'+
        '<button type="button" data-stx-act="reduire" title="Réduire en petit menu flottant : tu peux continuer à jouer pendant que les voix se génèrent">➖ Réduire</button></div>'+
      '<div class="stx-cle">'+esc_(edition.cle)+(edition.surcharge?' · <b style="color:#ffd84a">texte modifié</b>':' · texte d’origine')+'</div>'+
      champsHtml+
      '<div id="sorealIdleTextePronBlocV1">'+prononciationsHtml_()+'</div>'+
      '<div class="stx-actions">'+
        '<button type="button" data-stx-act="ecouter" id="sorealIdleTexteEcouterV1">▶ Tout écouter</button>'+
        '<button type="button" data-stx-act="generer" id="sorealIdleTexteGenererV1">🎙 Générer toutes les voix</button>'+
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
  racine.addEventListener('focusin',function(ev){
    if(ev.target&&ev.target.getAttribute&&ev.target.getAttribute('data-stx-champ'))edition.dernierChamp=ev.target;
  });
  afficherEtat_(statutLigne_());
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
    if(el)el.innerHTML=o&&c.blocs.length&&typeof o.fichiersVoixHtml==='function'?'<div class="stx-aide">Fichiers de voix de cette ligne (télécharger, retoucher, remplacer)</div>'+o.fichiersVoixHtml(c.blocs,edition.voix):'';
  });
  /* Badges « prête » des cadres. */
  r.cadres.forEach(function(c){
    var cadre=document.querySelector('#'+EDITEUR_ID+' [data-stx-cadre="'+c.champ+'|'+c.k+'"] .stx-cadre-tete');
    if(!cadre)return;
    var vieux=cadre.querySelector('.stx-badge');
    if(vieux)vieux.remove();
    if(!c.blocs.length)return;
    var prets=c.blocs.filter(function(b){return edition.voix.indexOf(b.hash)!==-1;}).length;
    var b=document.createElement('span');
    b.className='stx-badge'+(prets>=c.blocs.length?' ok':'');
    b.textContent=prets>=c.blocs.length?'🎙 prête':'🎙 '+prets+'/'+c.blocs.length;
    var espace=cadre.querySelector('span[style]');
    cadre.insertBefore(b,espace);
  });
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
  ecoute=false;ecouteCle='';
  Array.prototype.forEach.call(document.querySelectorAll('#'+EDITEUR_ID+' [data-stx-l="ecouter"]'),function(x){x.textContent='▶ Écouter';});
  try{var t=tts_();if(t&&typeof t.stop==='function')t.stop();}catch(_e){}
  var b=document.getElementById('sorealIdleTexteEcouterV1');
  if(b)b.textContent='▶ Tout écouter';
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
  try{demarre=t.readText(t.retirerParentheses(brut),undefined,function(){ecoute=false;var bb=document.getElementById('sorealIdleTexteEcouterV1');if(bb)bb.textContent='▶ Tout écouter';});}catch(_e){demarre=false;}
  if(!demarre){ecoute=false;if(b)b.textContent='▶ Tout écouter';afficherEtat_('Rien à lire dans ce texte.',true);}
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
  /* Les empreintes d'un bloc qui n'existe plus (texte modifié) sont retirées : le « nettoyage des voix » supprimera leurs fichiers. Sans le module de narration, rien n'est touché. */
  var blocsActuels=blocsDeLecture_(valeurs);
  if(blocsActuels.length){
    var actuelles={};
    blocsActuels.forEach(function(b){actuelles[b.hash]=1;});
    edition.voix=edition.voix.filter(function(h){return actuelles[h];});
  }
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
  reduit=false;
}

function majBoutonGenerer_(){
  var b=document.getElementById('sorealIdleTexteGenererV1');
  if(b)b.textContent=generation.enCours?'⏹ Arrêter':'🎙 Générer toutes les voix';
  Array.prototype.forEach.call(document.querySelectorAll('#'+EDITEUR_ID+' [data-stx-l="generer"]'),function(x){x.textContent=generation.enCours?'⏹ Arrêter':'🎙 Générer cette ligne';});
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
  if(!blocs.length){afficherEtat_('Ce cadre est vide : rien à générer.',true);return;}
  lancerGeneration_(o,blocs,'Ligne '+(k+1));
}

function lancerGeneration_(o,aFaire,libelle){
  generation={enCours:true,annule:false,texte:''};
  majBoutonGenerer_();
  var fait=0;
  var suite=Promise.resolve();
  aFaire.forEach(function(b){
    suite=suite.then(function(){
      if(generation.annule)throw new Error('__annule__');
      generation.texte='🎙 '+(libelle?libelle+' : ':'Génération des voix : ')+(fait+1)+'/'+aFaire.length+' (quelques secondes par bloc)…';
      afficherEtat_(generation.texte);
      return o.synthetiser(b.texte,b.parleur).then(function(blob){return o.televerser(b.hash,blob);}).then(function(){
        if(edition.voix.indexOf(b.hash)===-1)edition.voix.push(b.hash);
        if(edition.aRefaire)delete edition.aRefaire[b.hash];
        fait+=1;
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
  edition={cle:cle,def:def,surcharge:surcharge||null,valeurs:courant,voix:surcharge&&Array.isArray(surcharge.voix)?surcharge.voix.slice():[],dernierChamp:null,aRefaire:{},lignes:{}};
  /* Un cadre par personnage pour chaque texte parlé : les balises (marius), (femme)… du texte deviennent des cadres. */
  def.champs.forEach(function(c){if(champParle_(c))edition.lignes[c.id]=lignesDepuisTexte_(courant[c.id]);});
  reduit=false;
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
    /* Le NOM est modifiable (Norman, 2026-10-03) : il est affiché partout ET lu par la voix en tête de la chronique. */
    champs:[{id:'nom',label:'Nom du boss (affiché et prononcé)',type:'ligne'},{id:'texte',label:'Texte de la chronique',type:'texte'}],
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
    var fv=ev.target.closest('[data-fv]');
    if(fv){
      var o=outilsVoix_();
      if(!o||typeof o.clicFichierVoix!=='function'){afficherEtat_('Outils de voix indisponibles (module Admin non chargé).',true);return;}
      edition.valeurs=lireChamps_();
      o.clicFichierVoix(fv,{
        nomBase:String(edition.cle||'texte').replace(/[^a-z0-9]+/gi,'-'),
        message:function(t,erreur){afficherEtat_(t,erreur);},
        /* Le fichier remplacé garde son empreinte : on la déclare dans le texte et on l'enregistre, pour que le nettoyage ne le supprime pas. */
        apres:function(hash){
          if(edition.voix.indexOf(hash)===-1)edition.voix.push(hash);
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
      if(aL==='generer'){genererCadre_(cL,kL);return;}
      if(aL==='suppr'){
        var liste=edition.lignes[cL];
        if(!liste)return;
        /* Un texte garde au moins un cadre : supprimer le dernier le vide seulement. */
        if(liste.length<=1){liste[0].texte='';}else{liste.splice(kL,1);}
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
      if(act==='fermer'){fermer_();return;}
      if(act==='reduire'){edition.valeurs=lireChamps_();reduit=true;racine.classList.add('stx-reduit');afficherEtat_();return;}
      if(act==='agrandir'){reduit=false;racine.classList.remove('stx-reduit');return;}
      if(act==='arreter-gen'){if(generation.enCours){generation.annule=true;afficherEtat_('Arrêt demandé…');}return;}
      if(act==='cadre+'){
        var cN=a.getAttribute('data-c');
        edition.valeurs=lireChamps_();
        var lN=edition.lignes[cN];
        if(lN){lN.push({parleur:lN.length?lN[lN.length-1].parleur:'narrateur',texte:''});rafraichirCadres_(cN);}
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
  var bossBtn=ev.target&&ev.target.closest?ev.target.closest('[data-stx-boss]'):null;
  if(bossBtn){ev.preventDefault();ev.stopPropagation();editerBoss_(bossBtn.getAttribute('data-stx-boss'));}
},true);

var minuterieFichiers=0;
document.addEventListener('input',function(ev){
  var el=ev.target;
  if(edition&&el&&el.getAttribute&&(el.getAttribute('data-stx-champ')||el.getAttribute('data-stx-ltexte'))){clearTimeout(minuterieFichiers);minuterieFichiers=setTimeout(rafraichirFichiersVoix_,700);}
  if(el&&el.id==='sorealIdleTextesFiltreV1'){
    admin.filtre=el.value;
    var b=document.getElementById('sorealIdleTextesBossListeV1');
    if(b)b.innerHTML=listeBossHtml_();
    return;
  }
  if(edition&&el&&el.getAttribute&&(el.getAttribute('data-stx-champ')||el.getAttribute('data-stx-ltexte')))afficherEtat_(statutLigne_());
});
/* Changer la voix d'un cadre change aussi ses fichiers de voix (la voix fait partie de ce qui est lu). */
document.addEventListener('change',function(ev){
  var el=ev.target;
  if(edition&&el&&el.getAttribute&&el.getAttribute('data-stx-lparleur'))rafraichirFichiersVoix_();
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
