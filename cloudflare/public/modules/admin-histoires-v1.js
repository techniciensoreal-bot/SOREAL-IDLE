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
  if(!txt)return [];
  return t.planNarration(txt).filter(function(e){return e&&e.chunk!=null&&String(e.chunk).trim();}).map(function(e){
    return {texte:e.chunk,hash:t.hashBloc(e.chunk)};
  });
}

var PARLEURS=[['narrateur','🎙 Narrateur'],['femme','👩 Femme']];

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

function statutVoixEtape_(etape,voix){
  var blocs=blocsDeEtape_(etape);
  if(!blocs.length)return {total:0,prets:0};
  var prets=blocs.filter(function(b){return voix.indexOf(b.hash)!==-1;}).length;
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

function installerStyle_(){
  if(document.getElementById(STYLE_ID))return;
  var s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=
    '.soreal-idle-adm-carte-v1{background:linear-gradient(165deg,#221116,#150c0f);border:1px solid rgba(220,38,38,.35);border-radius:14px;padding:12px 14px;margin:0 0 10px;color:#f3e6e8}'+
    '.soreal-idle-adm-carte-v1 h4{margin:0 0 4px;font-size:15px}'+
    '.soreal-idle-adm-meta-v1{font-size:12px;color:#c9adb2;line-height:1.5}'+
    '.soreal-idle-adm-badge-v1{display:inline-block;font-size:11px;font-weight:800;border-radius:999px;padding:2px 8px;margin-left:6px;background:rgba(255,255,255,.1)}'+
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
    '#'+EDITEUR_ID+' label{display:block;font-size:12px;font-weight:800;color:#a9b6d8;margin:12px 0 4px;text-transform:uppercase;letter-spacing:.05em}'+
    '#'+EDITEUR_ID+' input[type=text],#'+EDITEUR_ID+' select,#'+EDITEUR_ID+' textarea{width:100%;box-sizing:border-box;background:#111a30;color:#fff;border:1px solid #33456f;border-radius:10px;padding:9px 10px;font:14px system-ui,sans-serif}'+
    '#'+EDITEUR_ID+' textarea{min-height:110px;resize:vertical}'+
    '.adm-etape-v1{background:#131c35;border:1px solid #2c3d66;border-radius:14px;padding:10px;margin:10px 0}'+
    '.adm-etape-tete-v1{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}'+
    '.adm-etape-tete-v1 b{font-size:15px}'+
    '.adm-etape-corps-v1{display:flex;gap:10px;align-items:flex-start}'+
    '.adm-vignette-v1{width:112px;height:112px;flex:0 0 112px;object-fit:cover;border-radius:10px;background:#0a1226;border:1px solid #33456f}'+
    '.adm-vide-v1{display:flex;align-items:center;justify-content:center;color:#7d8bb0;font-size:12px;text-align:center}'+
    '.adm-pied-v1{position:fixed;left:0;right:0;bottom:0;background:#0d1530;border-top:1px solid #2c3d66;padding:10px 14px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;z-index:1}'+
    '.adm-etat-v1{font-size:12px;margin:8px 0;color:#a9b6d8}'+
    '.adm-erreur-v1{color:#fca5a5;font-weight:700}'+
    '@media(max-width:520px){.adm-etape-corps-v1{flex-direction:column;align-items:stretch}.adm-vignette-v1{width:100%;height:170px;flex:none}}';
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
  return '<div class="soreal-idle-section-v8"><div class="soreal-idle-window-title-v31">🛠️ Admin — Histoires</div><div id="'+LISTE_ID+'">'+listeHtml_()+'</div></div>';
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
  ouvrirEditeur_({id:nouvelId_('histoire'),titre:'',boss:null,actif:true,voix:[],etapes:[{texte:'',image:'',parleur:'narrateur'}]},true);
}

function ouvrirEditeur_(h,estNouvelle){
  installerStyle_();
  edition=copie_(h);
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
  arreterEcoute_();
  if(generation.enCours){generation.annule=true;}
  var el=document.getElementById(EDITEUR_ID);
  if(el&&el.parentNode)el.parentNode.removeChild(el);
  edition=null;
}

function optionsBoss_(){
  var html='<option value="">— Aucun (l’histoire ne se déclenche pas) —</option>';
  etat.boss.forEach(function(b){
    var pris=etat.histoires.filter(function(x){return x.id!==edition.id&&x.actif&&x.boss===b.numero;})[0];
    html+='<option value="'+b.numero+'"'+(edition.boss===b.numero?' selected':'')+'>'+b.numero+' — '+esc_(b.nom)+(pris?'  (déjà : '+esc_(pris.titre)+')':'')+'</option>';
  });
  return html;
}

function etapeHtml_(e,i){
  var url=urlImage_(edition.id,e.image);
  var s=statutVoixEtape_(e,edition.voix||[]);
  var voix=s.total===0?'':(s.prets>=s.total?'<span class="soreal-idle-adm-badge-v1 ok">🎙 voix prête</span>':'<span class="soreal-idle-adm-badge-v1 non">🎙 '+s.prets+'/'+s.total+'</span>');
  return '<div class="adm-etape-v1" data-adm-etape="'+i+'">'+
    '<div class="adm-etape-tete-v1"><b>Étape '+(i+1)+'</b>'+voix+
      '<span style="flex:1"></span>'+
      '<button type="button" class="soreal-idle-adm-btn-v1 primaire" data-adm-e="ecouter" data-i="'+i+'" title="Écouter uniquement cette étape">▶ Écouter</button>'+
      '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-e="haut" data-i="'+i+'"'+(i===0?' disabled':'')+'>⬆</button>'+
      '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-e="bas" data-i="'+i+'"'+(i===edition.etapes.length-1?' disabled':'')+'>⬇</button>'+
      '<button type="button" class="soreal-idle-adm-btn-v1 danger" data-adm-e="suppr" data-i="'+i+'">🗑</button>'+
    '</div>'+
    '<div class="adm-etape-corps-v1">'+
      (url?'<img class="adm-vignette-v1" src="'+esc_(url)+'" alt="">':'<div class="adm-vignette-v1 adm-vide-v1">Pas d’image : garde celle de l’étape précédente</div>')+
      '<div style="flex:1;min-width:0">'+
        '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-e="image" data-i="'+i+'">🖼 '+(url?'Changer l’image':'Choisir une image')+'</button>'+
        '<label>Voix au début de l’étape</label><select data-adm-parleur="'+i+'">'+PARLEURS.map(function(p){return '<option value="'+p[0]+'"'+((e.parleur||'narrateur')===p[0]?' selected':'')+'>'+p[1]+'</option>';}).join('')+'</select>'+
        '<label>Texte lu à voix haute</label>'+
        '<textarea data-adm-texte="'+i+'" placeholder="Colle ici le texte de cette image…">'+esc_(e.texte)+'</textarea>'+
        '<div class="soreal-idle-adm-meta-v1" style="margin-top:4px">Astuce : écris <b>(femme)</b> ou <b>(homme)</b> dans le texte pour changer de voix à cet endroit. Les balises ne s’affichent pas à l’écran.</div>'+
      '</div>'+
    '</div>'+
  '</div>';
}

function etapesHtml_(){
  return edition.etapes.map(etapeHtml_).join('');
}

function dessinerEditeur_(){
  var racine=document.getElementById(EDITEUR_ID);
  if(!racine||!edition)return;
  racine.innerHTML=
    '<div class="adm-page">'+
      '<div style="display:flex;align-items:center;gap:10px"><h2 style="flex:1">'+(editionEstNouvelle?'Nouvelle histoire':'Modifier l’histoire')+'</h2>'+
        '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-g="fermer">✕ Fermer</button></div>'+
      '<label>Titre (visible seulement ici)</label><input type="text" data-adm-champ="titre" value="'+esc_(edition.titre)+'" maxlength="80">'+
      '<label>Se déclenche à la mort du boss (Fight Boss)</label><select data-adm-champ="boss">'+optionsBoss_()+'</select>'+
      '<label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font-size:13px"><input type="checkbox" data-adm-champ="actif"'+(edition.actif?' checked':'')+'> Histoire active</label>'+
      '<h3 style="margin:18px 0 0">Étapes <span style="font-weight:400;font-size:13px;color:#a9b6d8">(une image + un texte chacune)</span></h3>'+
      '<div id="sorealIdleAdminEtapesV1">'+etapesHtml_()+'</div>'+
      '<div class="soreal-idle-adm-actions-v1"><button type="button" class="soreal-idle-adm-btn-v1" data-adm-g="ajouter">＋ Ajouter une étape</button>'+
        '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-g="images">🖼 Ajouter plusieurs images d’un coup</button></div>'+
      '<input type="file" id="sorealIdleAdminFichierV1" accept="image/webp,image/png,image/jpeg,image/gif" style="display:none">'+
      '<input type="file" id="sorealIdleAdminFichiersV1" accept="image/webp,image/png,image/jpeg,image/gif" multiple style="display:none">'+
      '<div class="adm-etat-v1" id="sorealIdleAdminEtatV1"></div>'+
    '</div>'+
    '<div class="adm-pied-v1">'+
      '<button type="button" class="soreal-idle-adm-btn-v1 primaire" data-adm-g="enregistrer">💾 Enregistrer</button>'+
      '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-g="tester">▶ Tester</button>'+
      '<button type="button" class="soreal-idle-adm-btn-v1" data-adm-g="voix" id="sorealIdleAdminBtnVoixV1">🎙 Générer les voix</button>'+
      '<label style="margin:0;display:flex;align-items:center;gap:6px;text-transform:none;letter-spacing:0;font-size:12px"><input type="checkbox" id="sorealIdleAdminToutesV1"> tout régénérer</label>'+
    '</div>';
  afficherEtat_();
}

function rafraichirEtapes_(){
  var el=document.getElementById('sorealIdleAdminEtapesV1');
  if(el)el.innerHTML=etapesHtml_();
}

function afficherEtat_(message,erreur){
  var el=document.getElementById('sorealIdleAdminEtatV1');
  if(!el)return;
  if(message!==undefined)etat.message=message?{texte:message,erreur:Boolean(erreur)}:null;
  var m=etat.message;
  el.innerHTML=(m?'<div class="'+(m.erreur?'adm-erreur-v1':'')+'">'+esc_(m.texte)+'</div>':'')+
    '<div>'+esc_(generation.enCours?generation.texte:studio.texte)+'</div>';
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
  Array.prototype.forEach.call(r.querySelectorAll('[data-adm-texte]'),function(ta){
    var i=Number(ta.getAttribute('data-adm-texte'));
    if(edition.etapes[i])edition.etapes[i].texte=ta.value;
  });
  Array.prototype.forEach.call(r.querySelectorAll('[data-adm-parleur]'),function(sel){
    var i=Number(sel.getAttribute('data-adm-parleur'));
    if(edition.etapes[i])edition.etapes[i].parleur=sel.value;
  });
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
          edition.etapes.push({texte:'',image:nom,parleur:'narrateur'});
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
  return appel_('enregistrerHistoireAdminSorealIdle',[edition]).then(function(res){
    if(!res||res.ok===false){afficherEtat_((res&&res.message)||'Enregistrement refusé.',true);return false;}
    var h=res.histoire;
    var idx=-1;
    etat.histoires.forEach(function(x,k){if(x.id===h.id)idx=k;});
    if(idx>=0)etat.histoires[idx]=h;else etat.histoires.push(h);
    etat.histoires.sort(function(a,b){return String(a.id).localeCompare(String(b.id));});
    edition=copie_(h);
    editionEstNouvelle=false;
    rafraichirListe_();
    afficherEtat_('✔ Enregistrée.');
    return true;
  }).catch(function(e){afficherEtat_('Enregistrement impossible : '+(e&&e.message?e.message:e),true);return false;});
}

/* ---------- voix ---------- */

function verifierStudio_(){
  studio={ok:null,texte:'Studio de voix : vérification…'};
  afficherEtat_();
  fetch(STUDIO_URL+'/ping',{cache:'no-store'}).then(function(r){return r.json();}).then(function(d){
    studio={ok:Boolean(d&&d.ok),texte:d&&d.ok?'🟢 Studio de voix connecté ('+(d.modele||'')+' · '+(d.gpu||'')+')':'Studio de voix : réponse inattendue.'};
    afficherEtat_();
  }).catch(function(){
    studio={ok:false,texte:'🔴 Studio de voix non détecté sur ce PC : lance « lancer.bat » (dossier cloudflare/tools/voice-studio), puis rouvre cet écran. Sur iPhone/Safari, la génération est impossible.'};
    afficherEtat_();
  });
}

function synthetiser_(texte,parleur){
  return fetch(STUDIO_URL+'/synthese',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({texte:texte,voix:parleur==='femme'?'femme':'homme'})})
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

function genererVoix_(){
  if(generation.enCours){generation.annule=true;afficherEtat_('Arrêt demandé…');return;}
  lireChamps_();
  var erreur=valider_();
  if(erreur){afficherEtat_(erreur,true);return;}
  var toutes=Boolean((document.getElementById('sorealIdleAdminToutesV1')||{}).checked);
  var vus={},blocs=[];
  edition.etapes.forEach(function(e){blocsDeEtape_(e).forEach(function(b){if(!vus[b.hash]){vus[b.hash]=1;blocs.push(b);}});});
  if(!blocs.length){afficherEtat_('Aucun texte à lire : colle d’abord le texte des étapes.',true);return;}
  var aFaire=blocs.filter(function(b){return toutes||(edition.voix||[]).indexOf(b.hash)===-1;});
  if(!aFaire.length){afficherEtat_('Toutes les voix sont déjà prêtes (coche « tout régénérer » pour les refaire).');return;}
  generation={enCours:true,annule:false,texte:''};
  var bouton=document.getElementById('sorealIdleAdminBtnVoixV1');
  if(bouton)bouton.textContent='⏹ Arrêter';
  var fait=0;
  var voix=(edition.voix||[]).slice();
  var suite=enregistrer_().then(function(ok){if(!ok)throw new Error('__stop__');});
  aFaire.forEach(function(b){
    suite=suite.then(function(){
      if(generation.annule)throw new Error('__annule__');
      generation.texte='🎙 Génération des voix : '+(fait+1)+'/'+aFaire.length+' (quelques secondes par bloc)…';
      afficherEtat_();
      return synthetiser_(b.texte,b.parleur).then(function(blob){return televerserVoix_(b.hash,blob);}).then(function(){
        if(voix.indexOf(b.hash)===-1)voix.push(b.hash);
        edition.voix=voix.slice();
        fait+=1;
        rafraichirEtapes_();
      });
    });
  });
  suite=suite.then(function(){
    generation.texte='Enregistrement des voix…';afficherEtat_();
    return enregistrer_();
  }).then(function(){
    afficherEtat_('✔ '+fait+' voix générée'+(fait>1?'s':'')+' et enregistrée'+(fait>1?'s':'')+'. Clique sur « Tester » pour écouter.');
  }).catch(function(e){
    var msg=e&&e.message?e.message:String(e);
    if(msg==='__stop__')return;
    if(voix.length&&fait>0){enregistrer_();}
    afficherEtat_(msg==='__annule__'?'Génération arrêtée ('+fait+' voix déjà prêtes, enregistrées).':'Échec de la génération : '+msg,msg!=='__annule__');
  }).then(function(){
    generation={enCours:false,annule:false,texte:''};
    var b=document.getElementById('sorealIdleAdminBtnVoixV1');
    if(b)b.textContent='🎙 Générer les voix';
    afficherEtat_();
  });
}

/* ---------- écoute d'UNE étape ---------- */

var ecoute={index:-1};

function boutonEcoute_(i){
  var r=document.getElementById(EDITEUR_ID);
  return r?r.querySelector('[data-adm-e="ecouter"][data-i="'+i+'"]'):null;
}

function remettreBoutonsEcoute_(){
  var r=document.getElementById(EDITEUR_ID);
  if(!r)return;
  Array.prototype.forEach.call(r.querySelectorAll('[data-adm-e="ecouter"]'),function(b){b.textContent='▶ Écouter';});
}

function arreterEcoute_(){
  ecoute.index=-1;
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

/* ---------- événements de l'éditeur ---------- */

document.addEventListener('click',function(ev){
  var racine=document.getElementById(EDITEUR_ID);
  if(!racine||!edition||!racine.contains(ev.target))return;
  var g=ev.target.closest('[data-adm-g]');
  var e=ev.target.closest('[data-adm-e]');
  if(g){
    var act=g.getAttribute('data-adm-g');
    if(act==='fermer'){fermerEditeur_();return;}
    if(act==='ajouter'){lireChamps_();edition.etapes.push({texte:'',image:'',parleur:'narrateur'});rafraichirEtapes_();return;}
    if(act==='images'){ajouterImages_();return;}
    if(act==='enregistrer'){enregistrer_();return;}
    if(act==='tester'){lireChamps_();var err=valider_();if(err){afficherEtat_(err,true);return;}jouer_(edition);return;}
    if(act==='voix'){genererVoix_();return;}
  }
  if(e){
    var i=Number(e.getAttribute('data-i'));
    var a=e.getAttribute('data-adm-e');
    lireChamps_();
    if(a==='ecouter'){ecouterEtape_(i);return;}
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
  /* Outils de test. */
  urlImage:urlImage_,
  nouvelId:nouvelId_,
  extensionImage:extensionImage_,
  comparerNoms:comparerNomsNaturel_,
  statutVoixHistoire:statutVoixHistoire_
};
})();
