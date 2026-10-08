/*
 * SOREAL IDLE — menu Admin : éditeur d'histoires plein écran (Norman, 2026-09-30) : « un menu Admin, que moi qui le voie : choisir à la
 * mort de quel boss une scène se déclenche, ajouter autant d'images que je veux et y coller un texte, passage automatique à l'image
 * suivante quand le texte est lu, un bouton pour générer les voix ; pouvoir aussi éditer les 2 premières scènes. »
 *
 * Sécurité : le menu n'apparaît que pour l'administrateur (menuDisponibleIdleV28_), MAIS c'est le serveur qui décide : chaque
 * opération (lister / enregistrer / supprimer) et chaque téléversement (images, voix) refuse tout autre compte.
 *
 * L'éditeur est un panneau plein écran indépendant du rendu de page (ajouté à document.body), comme le lecteur d'histoires : le jeu
 * redessine la page active à chaque synchro, ce qui effacerait un texte en cours de saisie. La page du menu n'affiche que la liste.
 *
 * Voix : le bouton « Générer les voix » envoie chaque bloc de texte au studio de voix local (cloudflare/tools/voice-studio, Chatterbox
 * sur le PC de l'administrateur), puis téléverse le fichier audio sur R2 ; les empreintes sont enregistrées avec l'histoire.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_ADMIN_HISTOIRES_V1__)return;

var LISTE_ID='sorealIdleAdminListeV1';
var EDITEUR_ID='sorealIdleAdminEditeurV1';
var STYLE_ID='sorealIdleAdminStyleV1';
var STUDIO_URL='http://127.0.0.1:8765';
var TYPES_IMAGE={webp:1,png:1,jpg:1,jpeg:1,gif:1};

var etat={charge:false,enCharge:false,erreur:'',histoires:[],boss:[],message:''};
var edition=null;       // copie de travail de l'histoire éditée (jamais l'objet de la liste)
var editionEstNouvelle=false;
var studio={ok:null,texte:'Studio de voix : vérification…'};
var generation={enCours:false,annule:false,texte:''};
var reduit=false;       // l'éditeur est réduit en petit menu flottant (la génération continue pendant qu'on joue)

function esc_(v){
  return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
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

function tts_(){
  try{return window.__SOREAL_IDLE_TUTORIAL_TTS_V209__||null;}catch(_e){return null;}
}

/* ---------- utilitaires purs (testés) ---------- */

function urlImage_(histoireId,image){
  var img=String(image||'');
  var legacy=/^legacy:(\d{1,2})$/.exec(img);
  if(legacy)return '/api/idle/media/story?id='+encodeURIComponent(histoireId)+'&index='+legacy[1];
  if(!img)return '';
  return '/api/idle/media/story-image?id='+encodeURIComponent(histoireId)+'&f='+encodeURIComponent(img);
}

/* Identifiant technique d'une nouvelle histoire : lettres/chiffres + suffixe aléatoire (jamais modifié ensuite : il nomme le dossier R2). */
function nouvelId_(titre){
  var base=String(titre||'histoire').normalize?String(titre||'histoire').normalize('NFD').replace(/[̀-ͯ]/g,''):String(titre||'histoire');
  base=base.replace(/[^A-Za-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,30)||'histoire';
  return base+'-'+Math.random().toString(36).slice(2,8);
}

function extensionImage_(nom){
  var m=/\.([A-Za-z0-9]{2,5})$/.exec(String(nom||''));
  var ext=m?m[1].toLowerCase():'';
  return TYPES_IMAGE[ext]?ext:'';
}

/* Tri « naturel » des noms de fichiers (2.png avant 10.png) pour l'ajout de plusieurs images à la fois. */
function comparerNomsNaturel_(a,b){
  return String(a).localeCompare(String(b),'fr',{numeric:true,sensitivity:'base'});
}

/* Blocs de voix d'un texte : mêmes blocs et mêmes empreintes que la lecture dans le jeu (planNarration/hashBloc du module de narration). */
function blocsDeTexte_(texte){
  var t=tts_();
  if(!t||typeof t.planNarration!=='function'||typeof t.hashBloc!=='function')return [];
  var txt=String(texte||'').replace(/\s+/g,' ').trim();
  /* Comme à la lecture : les parenthèses ne sont jamais lues ; pauses et expressions deviennent leurs marqueurs (l'expression suit chaque bloc, le texte du bloc ne change pas). */
  if(typeof t.retirerParentheses==='function')txt=t.retirerParentheses(txt).replace(/\s+/g,' ').trim();
  if(!txt)return [];
  return t.planNarration(txt).filter(function(e){return e&&e.chunk!=null&&String(e.chunk).trim();}).map(function(e){
    var b={texte:e.chunk,hash:t.hashBloc(e.chunk)};
    if(e.expr)b.expr=e.expr;
    return b;
  });
}

/* Voix proposées par étape : narrateur, femme, puis les voix nommées du registre (modules/voix-nommees-v1.js). */
function voixNommees_(){
  var reg=window.__SOREAL_IDLE_VOIX_NOMMEES_V1__;
  return reg&&Array.isArray(reg.liste)?reg.liste:[];
}
function parleurs_(){
  return [['narrateur','🎙 Narrateur'],['femme','👩 Femme']].concat(voixNommees_().map(function(v){return [v.id,'🎭 '+v.nom];}));
}
/* Identifiant courant d'un « Qui parle » enregistré (les anciens identifiants longs deviennent leur nom court : « gogole » -> « niais »). */
function parleurCanon_(parleur){
  var reg=window.__SOREAL_IDLE_VOIX_NOMMEES_V1__;
  var r=reg&&typeof reg.resoudre==='function'?reg.resoudre(parleur):'';
  return r||parleur||'narrateur';
}
function voixStudio_(parleur){
  parleur=parleurCanon_(parleur);
  return voixNommees_().some(function(v){return v.id===parleur;})?parleur:(parleur==='femme'?'femme':'homme');
}

/* Segments de voix d'une étape (balises (homme) / (femme) dans le texte) : la même découpe que le lecteur. */
function segmentsDeEtape_(etape){
  var moteur=window.__SOREAL_IDLE_STORY_ENGINE_V1__;
  if(moteur&&typeof moteur.segmenter==='function')return moteur.segmenter(etape.texte,etape.parleur).segments;
  var t=String(etape.texte||'').replace(/\s+/g,' ').trim();
  return t?[{voix:etape.parleur==='femme'?'femme':'homme',texte:t}]:[];
}

/* Blocs de voix d'une étape, chacun avec la voix de son segment. */
function blocsDeEtape_(etape){
  var blocs=[];
  segmentsDeEtape_(etape).forEach(function(seg){
    blocsDeTexte_(seg.texte).forEach(function(b){b.parleur=seg.voix;blocs.push(b);});
  });
  return blocs;
}

/*
 * Lignes par personnage (Norman, 2026-10-04 : « je veux une ligne par personnage et ne générer que cette ligne ; ajouter ou supprimer des lignes par personnage ; de base il y a un personnage »). Une étape (une image) se
 * compose de lignes { parleur, texte }. Le format enregistré ne change pas : le texte de l'étape reste une seule chaîne, la première ligne donne la voix de départ et chaque ligne suivante est précédée de la
 * balise de sa voix « (femme) », « (narrateur) », « (bohort) »… exactement ce que lit le jeu. Les lignes vides existent seulement dans l'éditeur (elles ne laissent aucune trace à l'enregistrement).
 */
function parleurUi_(p){var c=parleurCanon_(p||'narrateur');return c==='homme'?'narrateur':c;}
function etapeVide_(image){return {texte:'',image:image||'',parleur:'narrateur',lignes:[{parleur:'narrateur',expr:'',texte:''}]};}
function exprTete_(texte){
  var t=tts_(),reste=String(texte==null?'':texte).trim(),expr='',re=/^\(\s*([^()\n]{1,40}?)\s*\)\s*/,m;
  while((m=re.exec(reste))){
    var e='';
    try{e=t&&typeof t.resoudreExpressionBalise==='function'?String(t.resoudreExpressionBalise(m[1])||''):'';}catch(_e){e='';}
    if(!e)break;
    expr=e==='neutre'?'':e;
    reste=reste.slice(m[0].length);
  }
  return {expr:expr,reste:reste};
}
function lignesDepuisEtape_(e){
  var segs=segmentsDeEtape_(e);
  if(!segs.length)return [{parleur:parleurUi_(e.parleur),expr:'',texte:''}];
  return segs.map(function(sg){
    var t=exprTete_(sg.texte);
    return {parleur:parleurUi_(sg.voix),expr:t.expr,texte:t.reste};
  });
}
function composerEtape_(e){
  var lignes=(e.lignes||[]).filter(function(x){return String(x&&x.texte||'').trim();});
  if(!lignes.length){e.texte='';e.parleur=parleurUi_((e.lignes&&e.lignes[0]&&e.lignes[0].parleur)||e.parleur);return;}
  e.parleur=lignes[0].parleur;
  /* Chaque ligne : la balise de sa voix (sauf la première, qui donne la voix de départ), puis celle de son expression si elle n'est pas neutre. */
  e.texte=lignes.map(function(x,k){return (k?'('+x.parleur+') ':'')+(x.expr?'('+x.expr+') ':'')+String(x.texte).trim();}).join(' ');
}
function sansEspaces_(t){return String(t||'').replace(/\s+/g,' ').trim();}
/* Après un chargement ou un enregistrement : reconstruit les lignes depuis le texte, en gardant celles qu'on était en train d'éditer (lignes vides comprises) quand elles donnent le même texte. */
function initialiserLignes_(anciennes){
  (edition.etapes||[]).forEach(function(e,k){
    var avant=anciennes&&anciennes[k];
    if(avant&&avant.length){
      var essai={texte:'',parleur:'narrateur',lignes:avant};
      composerEtape_(essai);
      if(sansEspaces_(essai.texte)===sansEspaces_(e.texte)){e.lignes=avant;return;}
    }
    e.lignes=lignesDepuisEtape_(e);
  });
}
function blocsDeLigne_(l){
  return blocsDeTexte_((l&&l.expr?'('+l.expr+') ':'')+(l&&l.texte)).map(function(b){b.parleur=parleurUi_(l.parleur);return b;});
}
/* Une voix est prête si son fichier existe ET qu'elle n'est pas à refaire (voix ou expression changée depuis). */
function bloc_Pret_(hash){
  return (edition&&edition.voix||[]).indexOf(hash)!==-1&&!(edition&&edition.aRefaire&&edition.aRefaire[hash]);
}
var etapeEnEdition_=null;
function statutVoixEtape_(etape,voix){
  var blocs=blocsDeEtape_(etape);
  if(!blocs.length)return {total:0,prets:0};
  var prets=blocs.filter(function(b){return voix.indexOf(b.hash)!==-1&&!(edition&&edition.aRefaire&&edition===etapeEnEdition_&&edition.aRefaire[b.hash]);}).length;
  return {total:blocs.length,prets:prets};
}

function statutVoixHistoire_(h){
  var total=0,prets=0;
  (h.etapes||[]).forEach(function(e){var s=statutVoixEtape_(e,h.voix||[]);total+=s.total;prets+=s.prets;});
  return {total:total,prets:prets};
}

function nomBoss_(numero){
  for(var i=0;i<etat.boss.length;i++){if(etat.boss[i].numero===numero)return etat.boss[i].nom;}
  return '';
}

function libelleBoss_(numero){
  if(numero==null)return 'Aucun boss (jamais déclenchée)';
  var nom=nomBoss_(numero);
  return 'Mort du boss '+numero+(nom?' — '+nom:'');
}

/* ---------- style ---------- */

function installerStyleFichiersVoix_(){
  if(document.getElementById('sorealIdleFvStyleV1'))return;
  var st=document.createElement('style');
  st.id='sorealIdleFvStyleV1';
  st.textContent=
    '.fv-liste{display:grid;gap:5px;margin:6px 0}'+
    '.fv-ligne{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:6px 8px;border:1px solid rgba(255,255,255,.14);border-radius:10px;background:rgba(255,255,255,.04)}'+
    '.fv-n{min-width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.12);font:800 12px/1 system-ui,sans-serif}'+
    '.fv-ex{flex:1 1 180px;min-width:0;font-size:13px;color:#c9d4ee;overflow:hidden;text-overflow:ellipsis}'+
    '.fv-ex b{color:#ffd84a;margin-right:4px}'+
    '.fv-badge{font-size:12px;padding:2px 8px;border-radius:999px;background:rgba(74,222,128,.18);color:#86efac;white-space:nowrap}'+
    '.fv-badge.non{background:rgba(255,255,255,.1);color:#b8c7ea}'+
    '.fv-btn{min-height:34px;padding:4px 10px;border-radius:9px;border:1.5px solid #4b5d85;background:#1b2538;color:#e8eefc;font:700 13px/1 system-ui,sans-serif;cursor:pointer}'+
    '.fv-btn:disabled{opacity:.4;cursor:default}';
  document.head.appendChild(st);
}

function installerStyle_(){
  installerStyleFichiersVoix_();
  if(document.getElementById(STYLE_ID))return;
  var s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=
    '.soreal-idle-adm-carte-v1{background:linear-gradient(165deg,#221116,#150c0f);border:1px solid rgba(220,38,38,.35);border-radius:14px;padding:12px 14px;margin:0 0 10px;color:#f3e6e8}'+
    '.soreal-idle-adm-carte-v1 h4{margin:0 0 4px;font-size:15px}'+
    '.soreal-idle-adm-meta-v1{font-size:14px;color:#c9adb2;line-height:1.5}'+
    '.soreal-idle-adm-badge-v1{display:inline-block;font-size:13px;font-weight:800;border-radius:999px;padding:2px 8px;margin-left:6px;background:rgba(255,255,255,.1)}'+
    '.soreal-idle-adm-badge-v1.ok{background:rgba(34,197,94,.22);color:#86efac}'+
    '.soreal-idle-adm-badge-v1.non{background:rgba(245,158,11,.22);color:#fcd34d}'+
    '.soreal-idle-adm-actions-v1{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}'+
    '.soreal-idle-adm-btn-v1{border:1px solid rgba(255,255,255,.22);background:#2a3550;color:#f1f5ff;border-radius:10px;padding:8px 12px;font:700 13px system-ui,sans-serif;cursor:pointer}'+
    '.soreal-idle-adm-btn-v1:hover{filter:brightness(1.15)}'+
    '.soreal-idle-adm-btn-v1.danger{background:#7a2733}'+
    '.soreal-idle-adm-btn-v1.primaire{background:#2f7d4f}'+
    '.soreal-idle-adm-btn-v1:disabled{opacity:.5;cursor:default}'+
    '#'+EDITEUR_ID+'{position:fixed;inset:0;z-index:999000;background:#0b1020;color:#eef2ff;overflow-y:auto;font:14px/1.45 system-ui,sans-serif}'+
    '#'+EDITEUR_ID+' .adm-page{max-width:760px;margin:0 auto;padding:16px 14px 90px}'+
    '#'+EDITEUR_ID+' h2{margin:0 0 12px;font-size:20px}'+
    '#'+EDITEUR_ID+' label{display:block;font-size:14px;font-weight:800;color:#a9b6d8;margin:12px 0 4px;text-transform:uppercase;letter-spacing:.05em}'+
    '#'+EDITEUR_ID+' input[type=text],#'+EDITEUR_ID+' select,#'+EDITEUR_ID+' textarea{width:100%;box-sizing:border-box;background:#111a30;color:#fff;border:1px solid #33456f;border-radius:10px;padding:9px 10px;font:14px system-ui,sans-serif}'+
    '#'+EDITEUR_ID+' textarea{min-height:110px;resize:vertical}'+
    '.adm-etape-v1{background:#131c35;border:1px solid #2c3d66;border-radius:14px;padding:10px;margin:10px 0}'+
    '.adm-etape-tete-v1{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}'+
    '.adm-etape-tete-v1 b{font-size:15px}'+
    '.adm-etape-corps-v1{display:flex;gap:10px;align-items:flex-start}'+
    '.adm-vignette-v1{width:112px;height:112px;flex:0 0 112px;object-fit:cover;border-radius:10px;background:#0a1226;border:1px solid #33456f}'+
    '.adm-vide-v1{display:flex;align-items:center;justify-content:center;color:#7d8bb0;font-size:14px;text-align:center}'+
    '.adm-pied-v1{position:fixed;left:0;right:0;bottom:0;background:#0d1530;border-top:1px solid #2c3d66;padding:10px 14px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;z-index:1}'+
    '.adm-etat-v1{font-size:14px;margin:8px 0;color:#a9b6d8}'+
    '.adm-erreur-v1{color:#fca5a5;font-weight:700}'+
    '.adm-image-v1{display:flex;flex-direction:column;gap:6px;width:112px;flex:0 0 112px}'+
    '.adm-lignes-v1{flex:1;min-width:0;display:grid;gap:8px}'+
    '.adm-ligne-v1{background:#0f1830;border:1px solid #2c3d66;border-left:6px solid var(--vu-c,#5b8cff);border-radius:14px;padding:8px 10px}'+
    '.adm-ligne-pied-v1{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:8px}'+
    '.adm-det-v1{margin-top:8px}.adm-det-v1>summary{cursor:pointer;font-size:13px;font-weight:700;color:#a9b6d8;padding:6px 2px;list-style:none}.adm-det-v1>summary::-webkit-details-marker{display:none}'+
    '.adm-plus-v1{position:relative}.adm-plus-v1>summary{cursor:pointer;list-style:none;min-height:40px;min-width:42px;display:grid;place-items:center;border-radius:10px;border:1px solid rgba(255,255,255,.22);background:#2a3550;font:900 20px/1 system-ui,sans-serif;color:#f1f5ff}'+
    '.adm-plus-v1>summary::-webkit-details-marker{display:none}'+
    '.adm-plus-menu-v1{position:absolute;right:0;bottom:50px;display:grid;gap:8px;min-width:230px;padding:10px;border-radius:14px;background:#0d1530;border:1.5px solid #4b5d85;box-shadow:0 12px 30px rgba(0,0,0,.55)}'+
    '.adm-ligne-tete-v1{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px}'+
    '.adm-ligne-tete-v1 select{width:auto;min-width:150px;padding:6px 8px}'+
    '.adm-ligne-n-v1{min-width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#5b8cff;color:#fff;font:800 13px/1 system-ui,sans-serif}'+
    '#'+EDITEUR_ID+' .adm-ligne-v1 textarea{min-height:64px}'+
    '.adm-fichiers-v1{margin-top:6px}.adm-fichiers-titre-v1{font-size:12px;font-weight:800;color:#a9b6d8;text-transform:uppercase;letter-spacing:.04em}.adm-fichiers-titre-v1 span{text-transform:none;letter-spacing:0;font-weight:400}'+
    '.adm-mini-v1{display:none}'+
    '#'+EDITEUR_ID+'.adm-reduit{inset:auto 12px 12px auto;width:310px;max-width:calc(100vw - 24px);height:auto;overflow:visible;background:transparent;pointer-events:none}'+
    '#'+EDITEUR_ID+'.adm-reduit .adm-page,#'+EDITEUR_ID+'.adm-reduit .adm-pied-v1{display:none}'+
    '#'+EDITEUR_ID+'.adm-reduit .adm-mini-v1{display:block;pointer-events:auto;background:#0d1530;border:1.5px solid #5b8cff;border-radius:14px;padding:10px 12px;box-shadow:0 10px 30px rgba(0,0,0,.55)}'+
    '.adm-mini-titre-v1{font-weight:900;font-size:14px;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
    '.adm-mini-etat-v1{font-size:13px;color:#c9d4ee;line-height:1.4;margin-bottom:8px;max-height:4.2em;overflow:hidden}'+
    '.adm-mini-actions-v1{display:flex;gap:8px;justify-content:flex-end}'+
    '@media(max-width:520px){.adm-pied-v1{gap:6px;padding:8px 10px}.adm-pied-v1>.soreal-idle-adm-btn-v1{padding:8px 9px;font-size:12.5px}.adm-etape-corps-v1{flex-direction:column;align-items:stretch}.adm-image-v1{width:100%;flex:none}.adm-vignette-v1{width:100%;height:170px;flex:none}}';
  document.head.appendChild(s);
}

/* ---------- page du menu (liste) ---------- */

function listeHtml_(){
  if(!etat.charge&&!etat.erreur)return '<div class="soreal-idle-adm-meta-v1">Chargement des histoires…</div>';
  if(etat.erreur)return '<div class="adm-erreur-v1">'+esc_(etat.erreur)+'</div><div class="soreal-idle-adm-actions-v1"><button type="button" class="soreal-idle-adm-btn-v1" onclick="window.__SOREAL_IDLE_ADMIN_HISTOIRES_V1__.recharger()">Réessayer</button></div>';
  var html='<div class="soreal-idle-adm-meta-v1" style="margin-bottom:10px">Une histoire se joue <b>une seule fois par joueur</b>, à la mort du boss choisi (Fight Boss). Chaque étape = une image + un texte lu à voix haute ; on passe à l’image suivante dès que la lecture est terminée.</div>'+
    '<div class="soreal-idle-adm-actions-v1" style="margin:0 0 12px"><button type="button" class="soreal-idle-adm-btn-v1 primaire" onclick="window.__SOREAL_IDLE_ADMIN_HISTOIRES_V1__.nouvelle()">＋ Nouvelle histoire</button>'+
      '<button type="button" class="soreal-idle-adm-btn-v1" title="Supprime du stockage les fichiers de voix que plus aucune histoire n’utilise (anciennes voix, textes modifiés)" onclick="window.__SOREAL_IDLE_ADMIN_HISTOIRES_V1__.purgerVoix()">🧹 Supprimer les voix inutiles</button></div>'+
      '<div class="soreal-idle-adm-meta-v1" id="sorealIdleAdminPurgeV1" style="margin-bottom:10px"></div>';
  if(!etat.histoires.length)html+='<div class="soreal-idle-adm-meta-v1">Aucune histoire pour le moment.</div>';
  etat.histoires.forEach(function(h){
    var v=statutVoixHistoire_(h);
    var voixBadge=v.total===0?'':(v.prets>=v.total?'<span class="soreal-idle-adm-badge-v1 ok">🎙 voix studio prêtes</span>':'<span class="soreal-idle-adm-badge-v1 non">🎙 voix studio '+v.prets+'/'+v.total+'</span>');
    html+='<div class="soreal-idle-adm-carte-v1"><h4>🎬 '+esc_(h.titre)+(h.actif?'':'<span class="soreal-idle-adm-badge-v1 non">désactivée</span>')+voixBadge+'</h4>'+
      '<div class="soreal-idle-adm-meta-v1">'+esc_(libelleBoss_(h.boss))+' · '+h.etapes.length+' étape'+(h.etapes.length>1?'s':'')+'</div>'+
      '<div class="soreal-idle-adm-actions-v1">'+
        '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-act="modifier" data-adm-id="'+esc_(h.id)+'">✏️ Modifier</button>'+
        '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-act="jouer" data-adm-id="'+esc_(h.id)+'">▶ Jouer</button>'+
        '<button type="button" class="soreal-idle-adm-btn-v1 danger" data-adm-act="supprimer" data-adm-id="'+esc_(h.id)+'">🗑 Supprimer</button>'+
      '</div></div>';
  });
  return html;
}

function rafraichirListe_(){
  var el=document.getElementById(LISTE_ID);
  if(el)el.innerHTML=listeHtml_();
}

/* Supprime de R2 les voix qu'aucune histoire n'utilise : d'abord un comptage (rien n'est supprimé), puis confirmation. */
function purgerVoix_(){
  var zone=document.getElementById('sorealIdleAdminPurgeV1');
  function message(t){if(zone)zone.textContent=t;}
  function appeler(dry){
    return fetch('/api/v1/voice-purge'+(dry?'?dry=1':''),{method:'POST',headers:{authorization:'Bearer '+jeton_()}})
      .then(function(r){return r.json().catch(function(){return null;}).then(function(d){
        if(!r.ok||!d||!d.ok)throw new Error((d&&d.error)||('Refusé ('+r.status+')'));
        return d;
      });});
  }
  message('Comptage des voix inutiles…');
  appeler(true).then(function(d){
    var mo=(d.octetsLiberes/1048576).toFixed(1).replace('.',',');
    if(!d.supprimees){message('Rien à nettoyer : les '+d.gardees+' voix stockées sont toutes utilisées.');return;}
    if(!window.confirm('Supprimer '+d.supprimees+' fichier'+(d.supprimees>1?'s':'')+' de voix inutile'+(d.supprimees>1?'s':'')+' ('+mo+' Mo) ? Les '+d.gardees+' voix utilisées sont conservées.')){message('Nettoyage annulé.');return;}
    message('Suppression…');
    return appeler(false).then(function(f){message('✔ '+f.supprimees+' fichier'+(f.supprimees>1?'s':'')+' supprimé'+(f.supprimees>1?'s':'')+' ('+mo+' Mo libérés), '+f.gardees+' conservé'+(f.gardees>1?'s':'')+'.');});
  }).catch(function(e){message('Nettoyage impossible : '+(e&&e.message?e.message:e));});
}

function charger_(){
  if(etat.enCharge)return;
  etat.enCharge=true;
  etat.erreur='';
  appel_('listerHistoiresAdminSorealIdle',[]).then(function(res){
    etat.enCharge=false;
    if(!res||res.ok===false)throw new Error((res&&res.message)||'Réponse invalide.');
    etat.histoires=Array.isArray(res.histoires)?res.histoires:[];
    etat.boss=Array.isArray(res.boss)?res.boss:[];
    etat.charge=true;
    rafraichirListe_();
  }).catch(function(e){
    etat.enCharge=false;
    etat.erreur='Impossible de charger les histoires : '+(e&&e.message?e.message:e);
    rafraichirListe_();
  });
}

function page_(){
  installerStyle_();
  if(!etat.charge&&!etat.enCharge&&!etat.erreur)setTimeout(charger_,0);
  /* Textes et voix des chroniques de boss et des popups (modules/textes-admin-v1.js) : même menu Admin, sous les histoires. */
  var textes=window.__SOREAL_IDLE_TEXTES_V1__;
  return '<div class="soreal-idle-section-v8"><div class="soreal-idle-window-title-v31">🛠️ Admin — Histoires</div><div id="'+LISTE_ID+'">'+listeHtml_()+'</div></div>'+
    (textes&&typeof textes.pageHtml==='function'?textes.pageHtml():'')+
    /* EXP des joueurs (modules/credit-exp-admin-v1.js) : crédit d'EXP et journal. */
    (window.__SOREAL_IDLE_CREDIT_EXP_V1__?window.__SOREAL_IDLE_CREDIT_EXP_V1__.pageHtml():'');
}

/* ---------- lecture / suppression depuis la liste ---------- */

function histoireParId_(id){
  for(var i=0;i<etat.histoires.length;i++){if(etat.histoires[i].id===id)return etat.histoires[i];}
  return null;
}

function versLecteur_(h){
  return {
    id:h.id,vuId:h.vuId||('histoire:'+h.id),voix:h.voix||[],
    etapes:h.etapes.map(function(e){return {texte:e.texte,imageUrl:urlImage_(h.id,e.image)};})
  };
}

function jouer_(h){
  var moteur=window.__SOREAL_IDLE_STORY_ENGINE_V1__;
  if(!moteur||typeof moteur.jouer!=='function'){alert('Lecteur d’histoires indisponible.');return;}
  moteur.jouer(versLecteur_(h),{marquerVu:false});
}

function supprimer_(h){
  if(!window.confirm('Supprimer définitivement l’histoire « '+h.titre+' » ?'))return;
  appel_('supprimerHistoireAdminSorealIdle',[{id:h.id}]).then(function(){
    etat.histoires=etat.histoires.filter(function(x){return x.id!==h.id;});
    rafraichirListe_();
  }).catch(function(e){alert('Suppression impossible : '+(e&&e.message?e.message:e));});
}

document.addEventListener('click',function(ev){
  var b=ev.target&&ev.target.closest?ev.target.closest('[data-adm-act]'):null;
  if(!b||!b.closest('#'+LISTE_ID))return;
  var h=histoireParId_(b.getAttribute('data-adm-id'));
  if(!h)return;
  var act=b.getAttribute('data-adm-act');
  if(act==='modifier')ouvrirEditeur_(h,false);
  else if(act==='jouer')jouer_(h);
  else if(act==='supprimer')supprimer_(h);
});

/* ---------- éditeur ---------- */

function copie_(h){return JSON.parse(JSON.stringify(h));}

function nouvelle_(){
  ouvrirEditeur_({id:nouvelId_('histoire'),titre:'',boss:null,actif:true,voix:[],etapes:[etapeVide_('')]},true);
}

function ouvrirEditeur_(h,estNouvelle){
  installerStyle_();
  edition=copie_(h);
  edition.aRefaire={};
  etapeEnEdition_=edition;
  initialiserLignes_(null);
  reduit=false;
  editionEstNouvelle=Boolean(estNouvelle);
  var vieux=document.getElementById(EDITEUR_ID);
  if(vieux&&vieux.parentNode)vieux.parentNode.removeChild(vieux);
  var racine=document.createElement('div');
  racine.id=EDITEUR_ID;
  document.body.appendChild(racine);
  dessinerEditeur_();
  verifierStudio_();
}

function fermerEditeur_(){
  if(window.__SOREAL_IDLE_VOIX_UI_V1__)window.__SOREAL_IDLE_VOIX_UI_V1__.fermerSelecteur();
  arreterEcoute_();
  if(generation.enCours){generation.annule=true;}
  var el=document.getElementById(EDITEUR_ID);
  if(el&&el.parentNode)el.parentNode.removeChild(el);
  edition=null;
  reduit=false;
}

function optionsBoss_(){
  var html='<option value="">— Aucun (l’histoire ne se déclenche pas) —</option>';
  etat.boss.forEach(function(b){
    var pris=etat.histoires.filter(function(x){return x.id!==edition.id&&x.actif&&x.boss===b.numero;})[0];
    html+='<option value="'+b.numero+'"'+(edition.boss===b.numero?' selected':'')+'>'+b.numero+' — '+esc_(b.nom)+(pris?'  (déjà : '+esc_(pris.titre)+')':'')+'</option>';
  });
  return html;
}

function parleurOptions_(courant){
  return parleurs_().map(function(p){return '<option value="'+p[0]+'"'+(parleurUi_(courant)===p[0]?' selected':'')+'>'+p[1]+'</option>';}).join('');
}

function ligneHtml_(e,i,k){
  var l=e.lignes[k];
  var u=window.__SOREAL_IDLE_VOIX_UI_V1__;
  var blocs=blocsDeLigne_(l);
  var voix=edition.voix||[];
  var prets=blocs.filter(function(b){return bloc_Pret_(b.hash);}).length;
  var badge=!blocs.length?'':(prets>=blocs.length?'<span class="soreal-idle-adm-badge-v1 ok">🎙 Voix prête</span>':'<span class="soreal-idle-adm-badge-v1 non">'+(prets?'🎙 '+prets+'/'+blocs.length+' prêtes':'○ À générer')+'</span>');
  var cle=i+'-'+k;
  var couleur=u?u.couleurVoix(l.parleur):'#5b8cff';
  return '<div class="adm-ligne-v1" data-adm-ligne="'+cle+'" data-vu-bulle="'+cle+'" style="--vu-c:'+couleur+'">'+
    '<div class="adm-ligne-tete-v1">'+
      (u?u.chipsHtml(cle,l):'')+
      '<span style="flex:1"></span>'+badge+
    '</div>'+
    '<input type="hidden" data-adm-lparleur="'+cle+'" value="'+esc_(parleurUi_(l.parleur))+'"><input type="hidden" data-adm-lexpr="'+cle+'" value="'+esc_(l.expr||'')+'">'+
    '<textarea data-adm-ltexte="'+cle+'" placeholder="Ce que dit ce personnage…">'+esc_(l.texte)+'</textarea>'+
    (u?u.pausesHtml(cle,'soreal-idle-adm-btn-v1'):'')+
    '<div class="adm-ligne-pied-v1">'+
      (u?u.pauseBoutonHtml(cle,'soreal-idle-adm-btn-v1'):'')+
      '<span style="flex:1"></span>'+
      '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-l="ecouter" data-i="'+i+'" data-k="'+k+'" title="Écouter uniquement cette ligne">▶ Écouter</button>'+
      '<button type="button" class="soreal-idle-adm-btn-v1 primaire" data-adm-l="generer" data-i="'+i+'" data-k="'+k+'" title="Générer (ou régénérer) la voix de cette ligne, autant de fois que tu veux">🎙 Générer</button>'+
      '<button type="button" class="soreal-idle-adm-btn-v1 danger" data-adm-l="suppr" data-i="'+i+'" data-k="'+k+'" title="Retirer ce personnage">🗑</button>'+
    '</div>'+
    (blocs.length?'<details class="adm-det-v1"><summary>📁 Fichiers de cette ligne</summary><div class="adm-fichiers-v1" data-adm-fv="'+cle+'"><div class="adm-fichiers-titre-v1">Télécharger, retoucher ou remplacer la voix de cette ligne</div>'+fichiersVoixHtml_(blocs,voix)+'</div></details>':'')+
  '</div>';
}
function etapeHtml_(e,i){
  var url=urlImage_(edition.id,e.image);
  var s=statutVoixEtape_(e,edition.voix||[]);
  var voix=s.total===0?'':(s.prets>=s.total?'<span class="soreal-idle-adm-badge-v1 ok">🎙 voix prêtes</span>':'<span class="soreal-idle-adm-badge-v1 non">🎙 '+s.prets+'/'+s.total+'</span>');
  return '<div class="adm-etape-v1" data-adm-etape="'+i+'">'+
    '<div class="adm-etape-tete-v1"><b>Étape '+(i+1)+'</b>'+voix+
      '<span style="flex:1"></span>'+
      '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-e="ecouter" data-i="'+i+'" title="Écouter toute l’étape (toutes les lignes, l’une après l’autre)">▶ Toute l’étape</button>'+
      '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-e="generer" data-i="'+i+'" title="Générer (ou régénérer) toutes les lignes de cette étape">🎙 Toute l’étape</button>'+
      '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-e="haut" data-i="'+i+'"'+(i===0?' disabled':'')+'>⬆</button>'+
      '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-e="bas" data-i="'+i+'"'+(i===edition.etapes.length-1?' disabled':'')+'>⬇</button>'+
      '<button type="button" class="soreal-idle-adm-btn-v1 danger" data-adm-e="suppr" data-i="'+i+'" title="Supprimer toute l’étape">🗑</button>'+
    '</div>'+
    '<div class="adm-etape-corps-v1">'+
      '<div class="adm-image-v1">'+
        (url?'<img class="adm-vignette-v1" src="'+esc_(url)+'" alt="">':'<div class="adm-vignette-v1 adm-vide-v1">Pas d’image : garde celle de l’étape précédente</div>')+
        '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-e="image" data-i="'+i+'">🖼 '+(url?'Changer':'Choisir')+'</button>'+
      '</div>'+
      '<div class="adm-lignes-v1">'+
        e.lignes.map(function(l,k){return ligneHtml_(e,i,k);}).join('')+
        '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-e="ligne+" data-i="'+i+'" title="Ajouter un personnage (une nouvelle ligne)">＋ Ajouter un personnage</button>'+
        '<div class="soreal-idle-adm-meta-v1" style="margin-top:6px">Une ligne = un personnage qui parle. Pour une seule voix, garde une seule ligne ; les balises <b>(femme)</b>, <b>(homme)</b>… écrites dans un texte marchent toujours et sont aussi découpées en lignes à la réouverture.</div>'+
      '</div>'+
    '</div>'+
  '</div>';
}

function etapesHtml_(){
  return edition.etapes.map(etapeHtml_).join('');
}

/* Choix fait dans le sélecteur partagé (modules/voix-ui-v1.js) : la ligne prend la voix ou l'expression ; ses fichiers de voix sont à refaire (la voix et l'expression se règlent à la génération). */
function appliquerChoix_(type,cle,valeur){
  if(!edition)return;
  lireChamps_();
  var c=String(cle).split('-'),i=Number(c[0]),k=Number(c[1]);
  var etape=edition.etapes[i],l=etape&&etape.lignes&&etape.lignes[k];
  if(!l)return;
  var avant=blocsDeLigne_(l);
  if(type==='voix')l.parleur=parleurUi_(valeur);
  else l.expr=valeur==='neutre'?'':String(valeur||'');
  edition.aRefaire=edition.aRefaire||{};
  avant.forEach(function(b){if((edition.voix||[]).indexOf(b.hash)!==-1)edition.aRefaire[b.hash]=1;});
  composerEtape_(etape);
  rafraichirEtapes_();
  afficherEtat_();
}
function ouvrirSelecteur_(type,cle){
  var u=window.__SOREAL_IDLE_VOIX_UI_V1__,racine=document.getElementById(EDITEUR_ID);
  if(!u||!racine||!edition)return;
  lireChamps_();
  var c=String(cle).split('-');
  var l=edition.etapes[Number(c[0])]&&edition.etapes[Number(c[0])].lignes&&edition.etapes[Number(c[0])].lignes[Number(c[1])];
  if(!l)return;
  u.ouvrirSelecteur({racine:racine,type:type,ligne:l,outils:{synthetiserBrut:synthetiserBrut_},apres:function(valeur){appliquerChoix_(type,cle,valeur);}});
}

function dessinerEditeur_(){
  var racine=document.getElementById(EDITEUR_ID);
  if(!racine||!edition)return;
  racine.innerHTML=
    '<div class="adm-page">'+
      '<div style="display:flex;align-items:center;gap:10px"><h2 style="flex:1">'+(editionEstNouvelle?'Nouvelle histoire':'Modifier l’histoire')+'</h2>'+
        '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-g="reduire" title="Réduire en petit menu flottant : tu peux continuer à jouer pendant que les voix se génèrent">➖ Réduire</button>'+
        '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-g="fermer">✕ Fermer</button></div>'+
      '<label>Titre (visible seulement ici)</label><input type="text" data-adm-champ="titre" value="'+esc_(edition.titre)+'" maxlength="80">'+
      '<label>Se déclenche à la mort du boss (Fight Boss)</label><select data-adm-champ="boss">'+optionsBoss_()+'</select>'+
      '<label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font-size:15px"><input type="checkbox" data-adm-champ="actif"'+(edition.actif?' checked':'')+'> Histoire active</label>'+
      '<h3 style="margin:18px 0 0">Étapes <span style="font-weight:400;font-size:15px;color:#a9b6d8">(une image et une ou plusieurs lignes, une par personnage)</span></h3>'+
      '<div id="sorealIdleAdminEtapesV1">'+etapesHtml_()+'</div>'+
      '<div class="soreal-idle-adm-actions-v1"><button type="button" class="soreal-idle-adm-btn-v1" data-adm-g="ajouter">＋ Ajouter une étape</button>'+
        '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-g="images">🖼 Ajouter plusieurs images d’un coup</button></div>'+
      '<input type="file" id="sorealIdleAdminFichierV1" accept="image/webp,image/png,image/jpeg,image/gif" style="display:none">'+
      '<input type="file" id="sorealIdleAdminFichiersV1" accept="image/webp,image/png,image/jpeg,image/gif" multiple style="display:none">'+
      '<div id="sorealIdleAdminPronBlocV1">'+prononciationsHtml_()+'</div>'+
      '<div class="adm-etat-v1" id="sorealIdleAdminEtatV1"></div>'+
    '</div>'+
    '<div class="adm-pied-v1">'+
      '<button type="button" class="soreal-idle-adm-btn-v1 primaire" data-adm-g="enregistrer">💾 Enregistrer</button>'+
      '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-g="tester">▶ Tester</button>'+
      '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-g="voix" id="sorealIdleAdminBtnVoixV1">🎙 Générer les voix</button>'+
      '<details class="adm-plus-v1"><summary title="Plus d’actions">⋯</summary><div class="adm-plus-menu-v1">'+
        '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-g="studio-lancer" title="Lance lancer.bat sur ce PC (via le pilote)">🚀 Lancer le studio</button>'+
        '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-g="studio-arreter" title="Arrête le studio de voix sur ce PC">🛑 Arrêter le studio</button>'+
        '<label style="margin:0;display:flex;align-items:center;gap:6px;text-transform:none;letter-spacing:0;font-size:14px"><input type="checkbox" id="sorealIdleAdminToutesV1"> Tout régénérer</label>'+
      '</div></details>'+
    '</div>'+
    '<div class="adm-mini-v1" id="sorealIdleAdminMiniV1">'+
      '<div class="adm-mini-titre-v1">🎙 Voix · <span id="sorealIdleAdminMiniTitreV1"></span></div>'+
      '<div class="adm-mini-etat-v1" id="sorealIdleAdminMiniEtatV1"></div>'+
      '<div class="adm-mini-actions-v1">'+
        '<button type="button" class="soreal-idle-adm-btn-v1 danger" data-adm-g="arreter-gen" id="sorealIdleAdminMiniStopV1">⏹ Arrêter</button>'+
        '<button type="button" class="soreal-idle-adm-btn-v1 primaire" data-adm-g="agrandir">⤢ Rouvrir</button>'+
      '</div>'+
    '</div>';
  racine.classList.toggle('adm-reduit',reduit);
  var uiPartagee=window.__SOREAL_IDLE_VOIX_UI_V1__;
  if(uiPartagee)uiPartagee.activer(racine,{
    surChoix:function(type,cle){ouvrirSelecteur_(type,cle);},
    texteDe:function(cle){return racine.querySelector('[data-adm-ltexte="'+cle+'"]');}
  });
  afficherEtat_();
}

function rafraichirEtapes_(){
  var el=document.getElementById('sorealIdleAdminEtapesV1');
  if(el)el.innerHTML=etapesHtml_();
}

function afficherEtat_(message,erreur){
  var el=document.getElementById('sorealIdleAdminEtatV1');
  if(message!==undefined)etat.message=message?{texte:message,erreur:Boolean(erreur)}:null;
  var m=etat.message;
  if(el){
    el.innerHTML=(m?'<div class="'+(m.erreur?'adm-erreur-v1':'')+'">'+esc_(m.texte)+'</div>':'')+
      '<div>'+esc_(generation.enCours?generation.texte:studio.texte)+'</div>';
  }
  /* Petit menu flottant : la même information, en plus court. */
  var mini=document.getElementById('sorealIdleAdminMiniEtatV1');
  if(mini){
    var texte=generation.enCours?generation.texte:(m?m.texte:studio.texte);
    mini.textContent=texte;
    mini.className='adm-mini-etat-v1'+(!generation.enCours&&m&&m.erreur?' adm-erreur-v1':'');
    var titre=document.getElementById('sorealIdleAdminMiniTitreV1');
    if(titre&&edition)titre.textContent=String(edition.titre||'histoire');
    var stop=document.getElementById('sorealIdleAdminMiniStopV1');
    if(stop)stop.style.display=generation.enCours?'':'none';
  }
}

/* Lit les champs saisis dans l'éditeur vers la copie de travail (avant toute action). */
function lireChamps_(){
  var r=document.getElementById(EDITEUR_ID);
  if(!r||!edition)return;
  var t=r.querySelector('[data-adm-champ="titre"]');
  var b=r.querySelector('[data-adm-champ="boss"]');
  var a=r.querySelector('[data-adm-champ="actif"]');
  if(t)edition.titre=t.value;
  if(b)edition.boss=b.value===''?null:Math.floor(Number(b.value));
  if(a)edition.actif=Boolean(a.checked);
  /* Lignes : le texte et le personnage de chacune, puis le texte de chaque étape est recomposé (voix de départ + balises). */
  Array.prototype.forEach.call(r.querySelectorAll('[data-adm-ltexte]'),function(ta){
    var c=String(ta.getAttribute('data-adm-ltexte')).split('-');
    var l=edition.etapes[Number(c[0])]&&edition.etapes[Number(c[0])].lignes&&edition.etapes[Number(c[0])].lignes[Number(c[1])];
    if(l)l.texte=ta.value;
  });
  Array.prototype.forEach.call(r.querySelectorAll('[data-adm-lparleur]'),function(sel){
    var c=String(sel.getAttribute('data-adm-lparleur')).split('-');
    var l=edition.etapes[Number(c[0])]&&edition.etapes[Number(c[0])].lignes&&edition.etapes[Number(c[0])].lignes[Number(c[1])];
    if(l)l.parleur=sel.value;
  });
  Array.prototype.forEach.call(r.querySelectorAll('[data-adm-lexpr]'),function(inp){
    var c=String(inp.getAttribute('data-adm-lexpr')).split('-');
    var l=edition.etapes[Number(c[0])]&&edition.etapes[Number(c[0])].lignes&&edition.etapes[Number(c[0])].lignes[Number(c[1])];
    if(l)l.expr=inp.value;
  });
  edition.etapes.forEach(function(e){if(e.lignes)composerEtape_(e);});
}

function deplacer_(i,delta){
  var j=i+delta;
  if(j<0||j>=edition.etapes.length)return;
  var tmp=edition.etapes[i];edition.etapes[i]=edition.etapes[j];edition.etapes[j]=tmp;
  rafraichirEtapes_();
}

/* ---------- téléversement d'image ---------- */

function televerserImage_(fichier){
  var ext=extensionImage_(fichier.name);
  if(!ext)return Promise.reject(new Error('Format non pris en charge (webp, png, jpg ou gif seulement) : '+fichier.name));
  if(fichier.size>8*1024*1024)return Promise.reject(new Error('Image trop lourde (8 Mo maximum) : '+fichier.name));
  return fetch('/api/v1/story-upload?id='+encodeURIComponent(edition.id)+'&ext='+ext,{
    method:'POST',
    headers:{authorization:'Bearer '+jeton_(),'content-type':'application/octet-stream'},
    body:fichier
  }).then(function(r){return r.json().catch(function(){return null;}).then(function(d){
    if(!r.ok||!d||!d.ok)throw new Error((d&&d.error)||('Téléversement refusé ('+r.status+')'));
    return d.file;
  });});
}

function choisirImage_(i){
  var input=document.getElementById('sorealIdleAdminFichierV1');
  if(!input)return;
  input.value='';
  input.onchange=function(){
    var f=input.files&&input.files[0];
    if(!f)return;
    lireChamps_();
    afficherEtat_('Téléversement de '+f.name+'…');
    televerserImage_(f).then(function(nom){
      edition.etapes[i].image=nom;
      rafraichirEtapes_();
      afficherEtat_('Image ajoutée. Pense à enregistrer.');
    }).catch(function(e){afficherEtat_(e&&e.message?e.message:String(e),true);});
  };
  input.click();
}

function ajouterImages_(){
  var input=document.getElementById('sorealIdleAdminFichiersV1');
  if(!input)return;
  input.value='';
  input.onchange=function(){
    var fichiers=Array.prototype.slice.call(input.files||[]).sort(function(a,b){return comparerNomsNaturel_(a.name,b.name);});
    if(!fichiers.length)return;
    lireChamps_();
    /* Une étape vide de départ (sans image ni texte) est réutilisée plutôt que laissée en tête. */
    if(edition.etapes.length===1&&!edition.etapes[0].image&&!edition.etapes[0].texte)edition.etapes=[];
    var suite=Promise.resolve();
    var faits=0;
    fichiers.forEach(function(f){
      suite=suite.then(function(){
        afficherEtat_('Téléversement '+(faits+1)+'/'+fichiers.length+' : '+f.name+'…');
        return televerserImage_(f).then(function(nom){
          edition.etapes.push(etapeVide_(nom));
          faits+=1;
          rafraichirEtapes_();
        });
      });
    });
    suite.then(function(){afficherEtat_(faits+' image'+(faits>1?'s':'')+' ajoutée'+(faits>1?'s':'')+' (dans l’ordre des noms de fichiers). Colle maintenant le texte de chaque étape, puis enregistre.');})
      .catch(function(e){afficherEtat_((faits?faits+' image(s) ajoutée(s), puis : ':'')+(e&&e.message?e.message:String(e)),true);});
  };
  input.click();
}

/* ---------- enregistrement ---------- */

function valider_(){
  if(!String(edition.titre||'').trim())return 'Donne un titre à l’histoire.';
  if(!edition.etapes.length)return 'Ajoute au moins une étape.';
  return '';
}

function enregistrer_(){
  lireChamps_();
  var erreur=valider_();
  if(erreur){afficherEtat_(erreur,true);return Promise.resolve(false);}
  /* Les empreintes de voix d'un texte modifié ou supprimé ne servent plus : elles sont retirées ici (le nettoyage supprimera leurs fichiers). */
  var actuelles={};
  edition.etapes.forEach(function(e){blocsDeEtape_(e).forEach(function(b){actuelles[b.hash]=1;});});
  /* Sans le module de narration on ne peut pas recalculer les empreintes : on ne touche à rien. */
  if(tts_()&&typeof tts_().planNarration==='function')edition.voix=(edition.voix||[]).filter(function(h){return actuelles[h];});
  afficherEtat_('Enregistrement…');
  var envoi=copie_(edition);
  envoi.etapes.forEach(function(e){delete e.lignes;});
  var lignesAvant=edition.etapes.map(function(e){return e.lignes;});
  return appel_('enregistrerHistoireAdminSorealIdle',[envoi]).then(function(res){
    if(!res||res.ok===false){afficherEtat_((res&&res.message)||'Enregistrement refusé.',true);return false;}
    var h=res.histoire;
    var idx=-1;
    etat.histoires.forEach(function(x,k){if(x.id===h.id)idx=k;});
    if(idx>=0)etat.histoires[idx]=h;else etat.histoires.push(h);
    etat.histoires.sort(function(a,b){return String(a.id).localeCompare(String(b.id));});
    edition=copie_(h);
    initialiserLignes_(lignesAvant);
    editionEstNouvelle=false;
    rafraichirListe_();
    afficherEtat_('✔ Enregistrée.');
    return true;
  }).catch(function(e){afficherEtat_('Enregistrement impossible : '+(e&&e.message?e.message:e),true);return false;});
}

/* ---------- voix ---------- */

/* Boutons « Lancer / Arrêter le studio » (Norman, 2026-10-03) : parlent au pilote local (modules/studio-pilote-v1.js, tools/voice-studio/pilote.py). */
function pilotageStudio_(lancer){
  var p=window.__SOREAL_IDLE_STUDIO_PILOTE_V1__;
  if(!p){afficherEtat_('Module du pilote absent : recharge la page.',true);return;}
  p[lancer?'lancer':'arreter'](function(texte,erreur){afficherEtat_(texte,erreur);},verifierStudio_);
}

function verifierStudio_(){
  studio={ok:null,texte:'Studio de voix : vérification…'};
  afficherEtat_();
  fetch(STUDIO_URL+'/ping',{cache:'no-store'}).then(function(r){return r.json();}).then(function(d){
    studio={ok:Boolean(d&&d.ok),texte:d&&d.ok?'🟢 Studio de voix connecté ('+(d.modele||'')+' · '+(d.gpu||'')+')':'Studio de voix : réponse inattendue.'};
    afficherEtat_();
  }).catch(function(){
    studio={ok:false,texte:'🔴 Studio de voix non détecté sur ce PC : clique sur « 🚀 Lancer le studio » (ou lance « lancer.bat » dans cloudflare/tools/voice-studio). Sur iPhone/Safari, la génération est impossible.'};
    afficherEtat_();
  });
}

/*
 * Corrections de prononciation (Norman, 2026-10-01 : « corriger la prononciation d'un mot, par exemple zinzin que le studio lit
 * « zinne zinne » au lieu de « zain zain » »). Liste {mot, dit} gardée sur ce PC (c'est lui qui génère les voix). Le remplacement
 * se fait UNIQUEMENT au moment d'envoyer le texte au studio : le texte affiché et l'empreinte (hash) du bloc ne changent jamais,
 * donc aucune voix déjà générée n'est invalidée -- il suffit de régénérer les cases concernées.
 */
var CLE_PRONONCIATIONS='soreal_idle_admin_prononciations_v1';

function lirePrononciations_(){
  try{
    var brut=localStorage.getItem(CLE_PRONONCIATIONS);
    var liste=brut?JSON.parse(brut):[];
    return Array.isArray(liste)?liste.filter(function(x){return x&&typeof x.mot==='string'&&typeof x.dit==='string'&&x.mot.trim()&&x.dit.trim();}):[];
  }catch(_e){return [];}
}

function ecrirePrononciations_(liste){
  try{localStorage.setItem(CLE_PRONONCIATIONS,JSON.stringify(liste));}catch(_e){}
}

function echapperRegex_(m){return String(m).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}

/* Remplace chaque occurrence du mot entier (sans tenir compte de la casse ni des accents composés) par sa prononciation. */
function appliquerPrononciations_(texte,liste){
  var t=String(texte==null?'':texte);
  (liste||[]).slice().sort(function(a,b){return b.mot.length-a.mot.length;}).forEach(function(c){
    var mot=String(c.mot).trim(),dit=String(c.dit).trim();
    if(!mot||!dit)return;
    var re;
    try{re=new RegExp('(?<![\\p{L}\\p{N}])'+echapperRegex_(mot)+'(?![\\p{L}\\p{N}])','giu');}catch(_e){return;}
    t=t.replace(re,function(){return dit;});
  });
  return t;
}

function synthetiser_(texte,parleur,expr){
  return synthetiserBrut_(appliquerPrononciations_(texte,lirePrononciations_()),parleur,expr);
}

/* Envoie le texte TEL QUEL au studio (aucune correction de prononciation) : sert à tester une prononciation, qui est déjà écrite comme on la dit. */
/*
 * Expression (Norman, 2026-10-08) : « (joyeux) »… devient les réglages « exaggeration » et « cfg » du studio (modules/voix-expressions-v1.js) ; « neutre » (ou aucune) ne les envoie pas : le studio garde
 * les réglages propres à la voix (reglages-voix.json).
 */
function corpsSynthese_(texte,parleur,expr){
  var corps={texte:texte,voix:voixStudio_(parleur)};
  try{
    var reg=window.__SOREAL_IDLE_EXPRESSIONS_V1__;
    var r=expr&&reg&&typeof reg.reglages==='function'?reg.reglages(expr):null;
    if(r){corps.exaggeration=r.exaggeration;corps.cfg=r.cfg;}
  }catch(_e){}
  return corps;
}
function synthetiserBrut_(texte,parleur,expr){
  return fetch(STUDIO_URL+'/synthese',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(corpsSynthese_(texte,parleur,expr))})
    .then(function(r){
      if(!r.ok)return r.json().catch(function(){return null;}).then(function(d){throw new Error((d&&d.error)||('Studio de voix : erreur '+r.status));});
      return r.blob();
    });
}

function televerserVoix_(hash,blob){
  return fetch('/api/v1/voice-upload?h='+hash,{method:'POST',headers:{authorization:'Bearer '+jeton_(),'content-type':'application/octet-stream'},body:blob})
    .then(function(r){return r.json().catch(function(){return null;}).then(function(d){
      if(!r.ok||!d||!d.ok)throw new Error((d&&d.error)||('Téléversement de la voix refusé ('+r.status+')'));
    });});
}

/*
 * Fichiers de voix : télécharger, modifier ailleurs, remplacer (Norman, 2026-10-04 : « je dois pouvoir télécharger le fichier de voix, le modifier et le réuploader via le menu d'édition des voix ; l'upload doit remplacer
 * l'ancien fichier »). Un fichier de voix s'appelle idle/voix/<empreinte du bloc>.m4a : téléverser un fichier pour la MÊME empreinte écrase l'ancien (R2 remplace l'objet de même clé), donc rien ne traîne ; le jeu le
 * relit au plus tard une minute après (cache de 60 s). Seul le format m4a (AAC, celui du fichier téléchargé) est accepté, 12 Mo au maximum.
 */
var FORMAT_VOIX_MESSAGE='Format attendu : m4a (AAC), comme le fichier téléchargé.';
function urlVoix_(hash){return '/api/idle/media/voice?h='+encodeURIComponent(hash)+'&t='+Date.now();}

function telechargerVoix_(hash,nom){
  return fetch(urlVoix_(hash),{cache:'no-store'}).then(function(r){
    if(!r.ok)throw new Error(r.status===404?'Pas encore de fichier pour ce bloc : génère d’abord la voix.':'Téléchargement refusé ('+r.status+').');
    return r.blob();
  }).then(function(blob){
    var u=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=u;a.download=(nom||('voix-'+hash))+'.m4a';a.style.display='none';
    document.body.appendChild(a);a.click();
    setTimeout(function(){try{a.remove();URL.revokeObjectURL(u);}catch(_e){}},1500);
    return blob.size;
  });
}

/* Refuse tout fichier qui n'est pas un m4a : trop gros, vide, ou sans la signature « ftyp » d'un conteneur MP4/M4A. */
function verifierFichierVoix_(fichier){
  return new Promise(function(ok,ko){
    if(!fichier){ko(new Error('Aucun fichier choisi.'));return;}
    if(fichier.size>12*1024*1024){ko(new Error('Fichier trop gros (12 Mo au maximum).'));return;}
    if(fichier.size<16){ko(new Error('Fichier vide ou illisible. '+FORMAT_VOIX_MESSAGE));return;}
    var lecteur=new FileReader();
    lecteur.onload=function(){
      var b=new Uint8Array(lecteur.result);
      if(String.fromCharCode(b[4],b[5],b[6],b[7])!=='ftyp')ko(new Error(FORMAT_VOIX_MESSAGE));else ok(fichier);
    };
    lecteur.onerror=function(){ko(new Error('Lecture du fichier impossible.'));};
    lecteur.readAsArrayBuffer(fichier.slice(0,16));
  });
}

function remplacerVoix_(hash,fichier){
  return verifierFichierVoix_(fichier).then(function(f){return televerserVoix_(hash,f);});
}

function choisirFichierVoix_(){
  return new Promise(function(resolve){
    var champ=document.createElement('input');
    champ.type='file';champ.accept='.m4a,.mp4,audio/mp4,audio/x-m4a';champ.style.display='none';
    champ.addEventListener('change',function(){var f=champ.files&&champ.files[0]||null;champ.remove();resolve(f);});
    document.body.appendChild(champ);
    champ.click();
  });
}

var ecouteFichier={audio:null,hash:''};
function ecouterFichierVoix_(hash){
  try{if(ecouteFichier.audio){ecouteFichier.audio.pause();ecouteFichier.audio=null;}}catch(_e){}
  if(ecouteFichier.hash===hash){ecouteFichier.hash='';return Promise.resolve(false);}
  ecouteFichier.hash=hash;
  var a=new Audio(urlVoix_(hash));
  ecouteFichier.audio=a;
  a.onended=function(){ecouteFichier.hash='';};
  return Promise.resolve(a.play()).then(function(){return true;});
}

function extraitBloc_(texte){
  var t=String(texte||'').replace(/\s+/g,' ').trim();
  return t.length>70?t.slice(0,67)+'…':t;
}

/* Liste des fichiers de voix d'un texte : une ligne par bloc (extrait, voix, état, trois boutons). blocs = [{texte,hash,parleur}], voix = empreintes prêtes. */
function fichiersVoixHtml_(blocs,voix){
  if(!blocs||!blocs.length)return '';
  var prets=voix||[];
  return '<div class="fv-liste">'+blocs.map(function(b,k){
    var pret=prets.indexOf(b.hash)!==-1;
    return '<div class="fv-ligne" data-fv-hash="'+esc_(b.hash)+'" data-fv-n="'+(k+1)+'">'+
      '<span class="fv-n">'+(k+1)+'</span>'+
      '<span class="fv-ex"><b>'+esc_(b.parleur||'')+'</b> '+esc_(extraitBloc_(b.texte))+'</span>'+
      '<span class="fv-badge'+(pret?'':' non')+'">'+(pret?'fichier prêt':'pas de fichier')+'</span>'+
      '<button type="button" class="fv-btn" data-fv="ecouter" title="Écouter le fichier tel qu’il est sur le serveur"'+(pret?'':' disabled')+'>▶</button>'+
      '<button type="button" class="fv-btn" data-fv="telecharger" title="Télécharger ce fichier de voix (m4a) pour le retoucher"'+(pret?'':' disabled')+'>⬇ Télécharger</button>'+
      '<button type="button" class="fv-btn" data-fv="remplacer" title="Choisir un fichier m4a retouché : il REMPLACE l’ancien">⬆ Remplacer</button>'+
    '</div>';
  }).join('')+'</div>';
}

/*
 * Clic sur un bouton de fichier de voix. opts : { nomBase, message(texte, erreur), apres(hash) } ; apres() enregistre l'empreinte dans le texte (pour que le nettoyage ne supprime pas ce fichier) et rafraîchit la liste.
 * Renvoie true si le clic a été traité.
 */
function clicFichierVoix_(bouton,opts){
  var act=bouton&&bouton.getAttribute?bouton.getAttribute('data-fv'):'';
  var ligne=bouton&&bouton.closest?bouton.closest('[data-fv-hash]'):null;
  if(!act||!ligne)return false;
  var hash=ligne.getAttribute('data-fv-hash');
  var n=ligne.getAttribute('data-fv-n');
  var dire=(opts&&opts.message)||function(){};
  if(act==='ecouter'){
    ecouterFichierVoix_(hash).catch(function(e){dire('Lecture impossible : '+(e&&e.message?e.message:e),true);});
  }else if(act==='telecharger'){
    dire('Téléchargement du bloc '+n+'…');
    telechargerVoix_(hash,((opts&&opts.nomBase)||'voix')+'-bloc'+n+'-'+hash).then(function(){
      dire('✔ Bloc '+n+' téléchargé (m4a). Retouche-le, puis clique sur « ⬆ Remplacer » pour le remettre : il écrase l’ancien fichier.');
    }).catch(function(e){dire(e&&e.message?e.message:String(e),true);});
  }else if(act==='remplacer'){
    choisirFichierVoix_().then(function(fichier){
      if(!fichier)return;
      dire('Envoi du fichier pour le bloc '+n+'…');
      return remplacerVoix_(hash,fichier).then(function(){
        if(opts&&typeof opts.apres==='function')return opts.apres(hash);
      }).then(function(){
        dire('✔ Bloc '+n+' remplacé : l’ancien fichier est écrasé (le jeu le relit sous une minute).');
      });
    }).catch(function(e){dire('Remplacement impossible : '+(e&&e.message?e.message:e),true);});
  }
  return true;
}

function libelleBoutonsGenerer_(){
  var b=document.getElementById('sorealIdleAdminBtnVoixV1');
  if(b)b.textContent=generation.enCours?'⏹ Arrêter':'🎙 Générer les voix';
  var r=document.getElementById(EDITEUR_ID);
  if(r){
    Array.prototype.forEach.call(r.querySelectorAll('[data-adm-e="generer"]'),function(x){x.textContent=generation.enCours?'⏹ Arrêter':'🎙 Toute l’étape';});
    Array.prototype.forEach.call(r.querySelectorAll('[data-adm-l="generer"]'),function(x){x.textContent=generation.enCours?'⏹ Arrêter':'🎙 Générer';});
  }
}

/* Génère (studio) puis téléverse (R2) les blocs donnés, enregistre l'histoire ; commun au bouton global et au bouton d'une étape. */
function lancerGeneration_(aFaire,libelle){
  generation={enCours:true,annule:false,texte:''};
  libelleBoutonsGenerer_();
  var fait=0;
  var voix=(edition.voix||[]).slice();
  var suite=enregistrer_().then(function(ok){if(!ok)throw new Error('__stop__');});
  aFaire.forEach(function(b){
    suite=suite.then(function(){
      if(generation.annule)throw new Error('__annule__');
      generation.texte='🎙 '+(libelle?libelle+' : ':'Génération des voix : ')+(fait+1)+'/'+aFaire.length+' (quelques secondes par bloc)…';
      afficherEtat_();
      return synthetiser_(b.texte,b.parleur,b.expr).then(function(blob){return televerserVoix_(b.hash,blob);}).then(function(){
        if(voix.indexOf(b.hash)===-1)voix.push(b.hash);
        edition.voix=voix.slice();
        if(edition.aRefaire)delete edition.aRefaire[b.hash];
        fait+=1;
        rafraichirEtapes_();
      });
    });
  });
  suite=suite.then(function(){
    generation.texte='Enregistrement des voix…';afficherEtat_();
    return enregistrer_();
  }).then(function(){
    afficherEtat_('✔ '+fait+' voix générée'+(fait>1?'s':'')+' et enregistrée'+(fait>1?'s':'')+'. Clique sur « Tester » ou « Écouter » pour entendre.');
    sonVoixPrete_();
  }).catch(function(e){
    var msg=e&&e.message?e.message:String(e);
    if(msg==='__stop__')return;
    if(voix.length&&fait>0){enregistrer_();}
    afficherEtat_(msg==='__annule__'?'Génération arrêtée ('+fait+' voix déjà prêtes, enregistrées).':'Échec de la génération : '+msg,msg!=='__annule__');
  }).then(function(){
    generation={enCours:false,annule:false,texte:''};
    libelleBoutonsGenerer_();
    afficherEtat_();
  });
}

/* Petit son quand une génération se termine (Norman, 2026-10-04) : utile quand le menu est réduit et qu'on joue pendant ce temps. */
function sonVoixPrete_(){
  try{var a=window.__SOREAL_IDLE_AUDIO_V199__;if(a&&typeof a.play==='function')a.play('voiceDone');}catch(_e){}
}

function genererVoix_(){
  if(generation.enCours){generation.annule=true;afficherEtat_('Arrêt demandé…');return;}
  lireChamps_();
  var erreur=valider_();
  if(erreur){afficherEtat_(erreur,true);return;}
  var toutes=Boolean((document.getElementById('sorealIdleAdminToutesV1')||{}).checked);
  var vus={},blocs=[];
  edition.etapes.forEach(function(e){blocsDeEtape_(e).forEach(function(b){if(!vus[b.hash]){vus[b.hash]=1;blocs.push(b);}});});
  if(!blocs.length){afficherEtat_('Aucun texte à lire : colle d’abord le texte des étapes.',true);return;}
  var aFaire=blocs.filter(function(b){return toutes||!bloc_Pret_(b.hash);});
  if(!aFaire.length){afficherEtat_('Toutes les voix sont déjà prêtes (coche « tout régénérer » pour les refaire).');return;}
  lancerGeneration_(aFaire);
}

/* Norman (2026-10-01) : un bouton par case pour générer la voix de cette étape seulement (toujours régénérée, même si elle existe déjà). */
function genererEtape_(i){
  if(generation.enCours){generation.annule=true;afficherEtat_('Arrêt demandé…');return;}
  lireChamps_();
  var erreur=valider_();
  if(erreur){afficherEtat_(erreur,true);return;}
  var etape=edition.etapes[i];
  var vus={},blocs=[];
  blocsDeEtape_(etape||{}).forEach(function(b){if(!vus[b.hash]){vus[b.hash]=1;blocs.push(b);}});
  if(!blocs.length){afficherEtat_('Étape '+(i+1)+' : pas de texte à lire.',true);return;}
  afficherEtat_('Étape '+(i+1)+' : génération de '+blocs.length+' bloc'+(blocs.length>1?'s':'')+'…');
  lancerGeneration_(blocs,'Étape '+(i+1));
}

/* Une seule ligne (un seul personnage) : toujours régénérée, autant de fois qu'on veut, sans toucher au reste des dialogues. */
function genererLigne_(i,k){
  if(generation.enCours){generation.annule=true;afficherEtat_('Arrêt demandé…');return;}
  lireChamps_();
  var erreur=valider_();
  if(erreur){afficherEtat_(erreur,true);return;}
  var l=edition.etapes[i]&&edition.etapes[i].lignes&&edition.etapes[i].lignes[k];
  var vus={},blocs=[];
  blocsDeLigne_(l).forEach(function(b){if(!vus[b.hash]){vus[b.hash]=1;blocs.push(b);}});
  if(!blocs.length){afficherEtat_('Étape '+(i+1)+', ligne '+(k+1)+' : pas de texte à lire.',true);return;}
  afficherEtat_('Étape '+(i+1)+', ligne '+(k+1)+' : génération…');
  lancerGeneration_(blocs,'Étape '+(i+1)+', ligne '+(k+1));
}

/* ---------- corrections de prononciation (écran de l'éditeur) ---------- */

function prononciationsHtml_(){
  var liste=lirePrononciations_();
  return '<h3 style="margin:18px 0 0">🗣 Prononciation <span style="font-weight:400;font-size:15px;color:#a9b6d8">(corriger un mot mal lu)</span></h3>'+
    '<div class="soreal-idle-adm-meta-v1">Écris le mot tel qu’il est dans le texte, et comment il doit se prononcer, écrit comme on le dit (ex. <b>zinzin</b> → <b>zain zain</b>). Le texte affiché ne change pas ; ensuite, régénère les cases concernées.</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">'+
      '<input type="text" id="sorealIdleAdminPronMotV1" placeholder="Mot (ex. zinzin)" style="flex:1;min-width:120px">'+
      '<input type="text" id="sorealIdleAdminPronDitV1" placeholder="Se prononce (ex. zain zain)" style="flex:1;min-width:140px">'+
      '<button type="button" class="soreal-idle-adm-btn-v1 primaire" data-adm-g="pron-ajouter">＋ Ajouter</button>'+
      '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-g="pron-tester" title="Écouter la prononciation saisie, avec le studio">▶ Tester</button>'+
    '</div>'+
    '<div id="sorealIdleAdminPronListeV1">'+(liste.length?liste.map(function(c,k){
      return '<div style="display:flex;align-items:center;gap:8px;margin-top:6px"><span style="flex:1"><b>'+esc_(c.mot)+'</b> → '+esc_(c.dit)+'</span>'+
        '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-p="tester" data-k="'+k+'">▶</button>'+
        '<button type="button" class="soreal-idle-adm-btn-v1 danger" data-adm-p="suppr" data-k="'+k+'">🗑</button></div>';
    }).join(''):'<div class="soreal-idle-adm-meta-v1" style="margin-top:6px">Aucune correction pour l’instant.</div>')+'</div>';
}

function rafraichirPrononciations_(){
  var el=document.getElementById('sorealIdleAdminPronBlocV1');
  if(el)el.innerHTML=prononciationsHtml_();
}

/* Écoute directe d'une prononciation avec le studio (sans rien téléverser). */
var essaiPron={audio:null};
function essayerPrononciation_(dit){
  dit=String(dit||'').trim();
  if(!dit){afficherEtat_('Écris d’abord comment le mot se prononce.',true);return;}
  afficherEtat_('Essai de prononciation : « '+dit+' »…');
  /* Le texte saisi est déjà la prononciation : pas de seconde correction. */
  fetch(STUDIO_URL+'/synthese',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({texte:dit,voix:'homme'})})
    .then(function(r){
      if(!r.ok)return r.json().catch(function(){return null;}).then(function(d){throw new Error((d&&d.error)||('Studio de voix : erreur '+r.status));});
      return r.blob();
    }).then(function(blob){
      try{if(essaiPron.audio)essaiPron.audio.pause();}catch(_e){}
      var url=URL.createObjectURL(blob);
      essaiPron.audio=new Audio(url);
      essaiPron.audio.onended=function(){URL.revokeObjectURL(url);};
      essaiPron.audio.play();
      afficherEtat_('');
    }).catch(function(e){afficherEtat_('Essai impossible : '+(e&&e.message?e.message:e),true);});
}

function ajouterPrononciation_(){
  var mot=String((document.getElementById('sorealIdleAdminPronMotV1')||{}).value||'').trim();
  var dit=String((document.getElementById('sorealIdleAdminPronDitV1')||{}).value||'').trim();
  if(!mot||!dit){afficherEtat_('Remplis le mot et sa prononciation.',true);return;}
  var liste=lirePrononciations_().filter(function(c){return c.mot.toLowerCase()!==mot.toLowerCase();});
  liste.push({mot:mot,dit:dit});
  ecrirePrononciations_(liste);
  lireChamps_();
  var concernees=[];
  (edition.etapes||[]).forEach(function(e,i){if(appliquerPrononciations_(e.texte,[{mot:mot,dit:dit}])!==String(e.texte||''))concernees.push(i+1);});
  rafraichirPrononciations_();
  afficherEtat_('✔ « '+mot+' » se lira « '+dit+' ».'+(concernees.length?' Utilisé dans l’étape'+(concernees.length>1?'s ':' ')+concernees.join(', ')+' : clique sur « 🎙 Générer la voix » de '+(concernees.length>1?'ces cases':'cette case')+'.':' Aucune étape de cette histoire ne contient ce mot.'));
}

/* ---------- écoute d'UNE étape ---------- */

var ecoute={index:-1,cle:''};

function boutonEcoute_(i){
  var r=document.getElementById(EDITEUR_ID);
  return r?r.querySelector('[data-adm-e="ecouter"][data-i="'+i+'"]'):null;
}

function remettreBoutonsEcoute_(){
  var r=document.getElementById(EDITEUR_ID);
  if(!r)return;
  Array.prototype.forEach.call(r.querySelectorAll('[data-adm-e="ecouter"]'),function(b){b.textContent='▶ Toute l’étape';});
  Array.prototype.forEach.call(r.querySelectorAll('[data-adm-l="ecouter"]'),function(b){b.textContent='▶ Écouter';});
}

function arreterEcoute_(){
  ecoute.index=-1;ecoute.cle='';
  try{var t=tts_();if(t&&typeof t.stop==='function')t.stop();}catch(_e){}
  remettreBoutonsEcoute_();
}

/* Joue uniquement le texte de l'étape i, avec la voix générée si elle existe (sinon la voix de secours du jeu, signalée). */
function ecouterEtape_(i){
  var t=tts_();
  if(!t||typeof t.readText!=='function'){afficherEtat_('Lecture vocale indisponible sur cet appareil.',true);return;}
  if(ecoute.index===i){arreterEcoute_();return;}
  arreterEcoute_();
  lireChamps_();
  var etape=edition.etapes[i];
  var segments=segmentsDeEtape_(etape||{});
  if(!segments.length){afficherEtat_('Étape '+(i+1)+' : pas de texte à écouter.',true);return;}
  try{if(typeof t.enregistrerVoixDynamiques==='function')t.enregistrerVoixDynamiques(edition.voix||[]);}catch(_e){}
  var s=statutVoixEtape_(etape,edition.voix||[]);
  afficherEtat_(s.total&&s.prets>=s.total?'':'Étape '+(i+1)+' : voix du studio pas encore générée, lecture avec la voix de secours du jeu.');
  ecoute.index=i;
  var b=boutonEcoute_(i);
  if(b)b.textContent='⏹ Arrêter';
  var fini=false;
  var surFin=function(){
    if(fini)return;
    fini=true;
    if(ecoute.index===i){ecoute.index=-1;remettreBoutonsEcoute_();}
  };
  /* Les segments (une voix chacun) se lisent l'un après l'autre ; arrêter l'écoute coupe la suite. */
  var lire=function(k){
    if(ecoute.index!==i)return;
    if(k>=segments.length){surFin();return;}
    var demarre=false;
    try{demarre=t.readText(segments[k].texte,undefined,function(){lire(k+1);});}catch(_e){demarre=false;}
    if(!demarre&&k===0)surFin();
  };
  lire(0);
}

/* Joue uniquement la ligne k de l'étape i, avec la voix générée si elle existe (sinon la voix de secours du jeu, signalée). */
function ecouterLigne_(i,k){
  var t=tts_();
  if(!t||typeof t.readText!=='function'){afficherEtat_('Lecture vocale indisponible sur cet appareil.',true);return;}
  var cle=i+'-'+k;
  if(ecoute.cle===cle){arreterEcoute_();return;}
  arreterEcoute_();
  lireChamps_();
  var l=edition.etapes[i]&&edition.etapes[i].lignes&&edition.etapes[i].lignes[k];
  var texte=sansEspaces_(l&&l.texte);
  if(!texte){afficherEtat_('Étape '+(i+1)+', ligne '+(k+1)+' : pas de texte à écouter.',true);return;}
  try{if(typeof t.enregistrerVoixDynamiques==='function')t.enregistrerVoixDynamiques(edition.voix||[]);}catch(_e){}
  var blocs=blocsDeLigne_(l);
  var pret=blocs.length&&blocs.every(function(b){return (edition.voix||[]).indexOf(b.hash)!==-1;});
  afficherEtat_(pret?'':'Ligne '+(k+1)+' : voix du studio pas encore générée, lecture avec la voix de secours du jeu.');
  ecoute.cle=cle;
  var btn=document.querySelector('#'+EDITEUR_ID+' [data-adm-l="ecouter"][data-i="'+i+'"][data-k="'+k+'"]');
  if(btn)btn.textContent='⏹ Arrêter';
  var fini=function(){if(ecoute.cle===cle){ecoute.cle='';remettreBoutonsEcoute_();}};
  var demarre=false;
  try{demarre=t.readText(texte,undefined,fini);}catch(_e){demarre=false;}
  if(!demarre)fini();
}

/* ---------- événements de l'éditeur ---------- */

document.addEventListener('click',function(ev){
  var racine=document.getElementById(EDITEUR_ID);
  if(!racine||!edition||!racine.contains(ev.target))return;
  var fv=ev.target.closest('[data-fv]');
  if(fv){
    lireChamps_();
    clicFichierVoix_(fv,{
      nomBase:'histoire-'+String(edition.id||'texte'),
      message:function(t,erreur){afficherEtat_(t,erreur);},
      /* Le fichier remplacé garde son empreinte : on la déclare dans l'histoire et on enregistre, pour que le nettoyage ne le supprime pas. */
      apres:function(hash){
        edition.voix=edition.voix||[];
        if(edition.voix.indexOf(hash)===-1)edition.voix.push(hash);
        return enregistrer_().then(function(){rafraichirEtapes_();});
      }
    });
    return;
  }
  var g=ev.target.closest('[data-adm-g]');
  var e=ev.target.closest('[data-adm-e]');
  if(g){
    var act=g.getAttribute('data-adm-g');
    if(act==='fermer'){fermerEditeur_();return;}
    if(act==='reduire'){lireChamps_();reduit=true;racine.classList.add('adm-reduit');afficherEtat_();return;}
    if(act==='agrandir'){reduit=false;racine.classList.remove('adm-reduit');return;}
    if(act==='arreter-gen'){if(generation.enCours){generation.annule=true;afficherEtat_('Arrêt demandé…');}return;}
    if(act==='ajouter'){lireChamps_();edition.etapes.push(etapeVide_(''));rafraichirEtapes_();return;}
    if(act==='images'){ajouterImages_();return;}
    if(act==='enregistrer'){enregistrer_();return;}
    if(act==='tester'){lireChamps_();var err=valider_();if(err){afficherEtat_(err,true);return;}jouer_(edition);return;}
    if(act==='voix'){genererVoix_();return;}
    if(act==='studio-lancer'||act==='studio-arreter'){pilotageStudio_(act==='studio-lancer');return;}
    if(act==='pron-ajouter'){ajouterPrononciation_();return;}
    if(act==='pron-tester'){essayerPrononciation_((document.getElementById('sorealIdleAdminPronDitV1')||{}).value);return;}
  }
  var lg=ev.target.closest('[data-adm-l]');
  if(lg){
    var iL=Number(lg.getAttribute('data-i')),kL=Number(lg.getAttribute('data-k'));
    var aL=lg.getAttribute('data-adm-l');
    lireChamps_();
    if(aL==='ecouter'){ecouterLigne_(iL,kL);return;}
    if(aL==='generer'){genererLigne_(iL,kL);return;}
    if(aL==='suppr'){
      var lignesE=edition.etapes[iL]&&edition.etapes[iL].lignes;
      if(!lignesE)return;
      /* Une étape garde au moins une ligne : supprimer la dernière la vide seulement. */
      if(lignesE.length<=1){lignesE[0].texte='';}else{lignesE.splice(kL,1);}
      composerEtape_(edition.etapes[iL]);
      rafraichirEtapes_();
      return;
    }
  }
  var pr=ev.target.closest('[data-adm-p]');
  if(pr){
    var listePr=lirePrononciations_();
    var kPr=Number(pr.getAttribute('data-k'));
    if(pr.getAttribute('data-adm-p')==='tester'){if(listePr[kPr])essayerPrononciation_(listePr[kPr].dit);return;}
    if(pr.getAttribute('data-adm-p')==='suppr'){listePr.splice(kPr,1);ecrirePrononciations_(listePr);rafraichirPrononciations_();afficherEtat_('Correction supprimée.');return;}
  }
  if(e){
    var i=Number(e.getAttribute('data-i'));
    var a=e.getAttribute('data-adm-e');
    lireChamps_();
    if(a==='ecouter'){ecouterEtape_(i);return;}
    if(a==='generer'){genererEtape_(i);return;}
    if(a==='ligne+'){
      var lignesN=edition.etapes[i]&&edition.etapes[i].lignes;
      if(lignesN){lignesN.push({parleur:lignesN.length?lignesN[lignesN.length-1].parleur:'narrateur',expr:'',texte:''});rafraichirEtapes_();}
      return;
    }
    arreterEcoute_();
    if(a==='haut')deplacer_(i,-1);
    else if(a==='bas')deplacer_(i,1);
    else if(a==='image')choisirImage_(i);
    else if(a==='suppr'){
      if(edition.etapes.length<=1){afficherEtat_('Une histoire garde au moins une étape.',true);return;}
      if(window.confirm('Supprimer l’étape '+(i+1)+' ?')){edition.etapes.splice(i,1);rafraichirEtapes_();}
    }
  }
});

window.__SOREAL_IDLE_ADMIN_HISTOIRES_V1__={
  page:page_,
  recharger:function(){etat.charge=false;etat.erreur='';charger_();rafraichirListe_();},
  nouvelle:nouvelle_,
  purgerVoix:purgerVoix_,
  appliquerPrononciations:appliquerPrononciations_,
  /* Génération de voix réutilisée par l'éditeur de textes (modules/textes-admin-v1.js) : même studio, mêmes corrections de prononciation, même téléversement R2. */
  outilsVoix:{synthetiser:synthetiser_,synthetiserBrut:synthetiserBrut_,televerser:televerserVoix_,
    /* Fichiers de voix : télécharger / remplacer / écouter (2026-10-04), communs à l'éditeur d'histoires et à celui des textes. */
    fichiersVoixHtml:fichiersVoixHtml_,clicFichierVoix:clicFichierVoix_,telechargerVoix:telechargerVoix_,remplacerVoix:remplacerVoix_,verifierFichierVoix:verifierFichierVoix_,urlVoix:urlVoix_,
    /* Corrections de prononciation partagées avec l'éditeur de textes (Norman, 2026-10-03 : « pouvoir changer la prononciation des mots pour chaque écran de texte »). */
    lirePrononciations:lirePrononciations_,ecrirePrononciations:ecrirePrononciations_,appliquerPrononciations:appliquerPrononciations_},
  /* Outils de test. */
  urlImage:urlImage_,
  nouvelId:nouvelId_,
  extensionImage:extensionImage_,
  comparerNoms:comparerNomsNaturel_,
  statutVoixHistoire:statutVoixHistoire_
};
})();
