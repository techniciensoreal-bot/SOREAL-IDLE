/*
 * SOREAL IDLE — menu Admin : éditeur du tutoriel (Norman, 2026-10-14) : « changer les textes, les popups qui se déplacent, sans avoir besoin de toi ».
 *
 * Un guide = un déclencheur (début du jeu, première ouverture d'un menu, boss vaincu) + des étapes. Chaque étape a un titre, un texte, un menu où elle se passe, une CIBLE sur l'écran, un placement de la fenêtre
 * et une surbrillance. La cible se choisit EN CLIQUANT sur l'élément du jeu (« 🎯 Placer sur l'écran »), jamais en écrivant du code. « 👁 Aperçu » joue le guide tel que le verra le joueur, sans rien enregistrer.
 *
 * Sécurité : le menu n'apparaît que pour l'administrateur, MAIS c'est le serveur qui décide (listerTutorielAdminSorealIdle / enregistrer / supprimer / régler refusent tout autre compte).
 * L'éditeur est un panneau plein écran indépendant du rendu de page (ajouté à document.body) : le jeu redessine la page active à chaque synchro, ce qui effacerait un texte en cours de saisie.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_ADMIN_TUTORIEL_V1__)return;

var LISTE_ID='sorealIdleAdminTutoListeV1';
var EDITEUR_ID='sorealIdleAdminTutoEditeurV1';
var STYLE_ID='sorealIdleAdminTutoStyleV1';

var etat={charge:false,enCharge:false,erreur:'',guides:[],ancienActif:true,ancienMenus:true,message:''};
var edition=null;           // copie de travail du guide édité (jamais l'objet de la liste)
var editionEstNouveau=false;

function esc_(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function appel_(nom,args){
  var f=window.__SOREAL_IDLE_CALL_V1__;
  if(typeof f!=='function')return Promise.reject(new Error('Connexion au jeu indisponible.'));
  return Promise.resolve(f(nom,args));
}
function menus_(){
  var l=typeof window.__SOREAL_IDLE_MENUS_LISTE_V1__==='function'?window.__SOREAL_IDLE_MENUS_LISTE_V1__():[];
  return Array.isArray(l)?l:[];
}
function nomMenu_(id){
  var m=menus_().filter(function(x){return x.id===id;})[0];
  return m?m.nom:id;
}
function libelleDeclencheur_(d){
  if(!d)return '';
  if(d.type==='debut')return 'Début du jeu (nouveau joueur)';
  if(d.type==='menu')return 'Première ouverture du menu « '+nomMenu_(d.menu)+' »';
  if(d.type==='boss')return 'Après la victoire contre le boss '+d.boss;
  return '';
}
function nouvelId_(titre){
  var base=String(titre||'guide').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,30)||'guide';
  return 'tuto-'+base+'-'+Date.now().toString(36);
}
function guideVide_(){
  return {id:'',titre:'',declencheur:{type:'debut'},actif:true,ordre:0,etapes:[etapeVide_()]};
}
function etapeVide_(){
  return {titre:'',texte:'',menu:'',cible:null,placement:'auto',surbrillance:true,avanceAuClic:false};
}
function copie_(o){return JSON.parse(JSON.stringify(o));}

/* ---------- style ---------- */

function installerStyle_(){
  if(document.getElementById(STYLE_ID))return;
  var s=document.createElement('style');s.id=STYLE_ID;
  s.textContent=
    '#'+LISTE_ID+' .at-ligne{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 10px;margin:6px 0;border:1px solid rgba(255,255,255,.14);border-radius:10px;background:rgba(255,255,255,.04)}'+
    '#'+LISTE_ID+' .at-ligne.inactif{opacity:.55}'+
    '#'+LISTE_ID+' .at-nom{flex:1 1 200px;min-width:0}'+
    '#'+LISTE_ID+' .at-nom b{display:block}'+
    '#'+LISTE_ID+' .at-nom small{color:#aeb9d4}'+
    '#'+LISTE_ID+' button,#'+EDITEUR_ID+' button{font:inherit;font-weight:700;padding:6px 10px;border-radius:8px;border:2px solid #000;color:#fff;background:linear-gradient(180deg,#3a4d78,#26365a);cursor:pointer;min-height:36px}'+
    '#'+LISTE_ID+' button.principal,#'+EDITEUR_ID+' button.principal{background:linear-gradient(180deg,#34c46a,#1f8f4c)}'+
    '#'+LISTE_ID+' button.danger,#'+EDITEUR_ID+' button.danger{background:linear-gradient(180deg,#c94a4a,#8f2a2a)}'+
    '#'+LISTE_ID+' .at-ancien{margin-top:10px;padding:9px 10px;border-radius:10px;border:1px dashed rgba(242,201,76,.6);font-size:14px}'+
    '#'+EDITEUR_ID+'{position:fixed;inset:0;z-index:99990;overflow:auto;background:#050810;color:#eef2ff;padding:14px;box-sizing:border-box;font-family:"Comic Neue","Comic Sans MS",sans-serif}'+
    '#'+EDITEUR_ID+'[hidden]{display:none}'+
    '#'+EDITEUR_ID+' .at-panneau{max-width:820px;margin:0 auto}'+
    '#'+EDITEUR_ID+' h2{font-family:Bangers,"Comic Sans MS",cursive;letter-spacing:.05em;color:#f2c94c;margin:0 0 10px}'+
    '#'+EDITEUR_ID+' label{display:block;font-weight:700;margin:8px 0 3px;font-size:14px;color:#c9d4f0}'+
    '#'+EDITEUR_ID+' input[type=text],#'+EDITEUR_ID+' input[type=number],#'+EDITEUR_ID+' select,#'+EDITEUR_ID+' textarea{width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:7px 9px;border-radius:8px;border:2px solid #4a5d8a;background:#0b1224;color:#fff}'+
    '#'+EDITEUR_ID+' textarea{min-height:110px;resize:vertical}'+
    '#'+EDITEUR_ID+' .at-rang{display:grid;grid-template-columns:1fr 1fr;gap:10px}'+
    '#'+EDITEUR_ID+' .at-etape{margin:12px 0;padding:10px 12px;border-radius:12px;border:2px solid #34456f;background:rgba(255,255,255,.04)}'+
    '#'+EDITEUR_ID+' .at-etape-tete{display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;margin-bottom:4px}'+
    '#'+EDITEUR_ID+' .at-etape-tete b{font-family:Bangers,cursive;letter-spacing:.05em;color:#f2c94c;font-size:19px}'+
    '#'+EDITEUR_ID+' .at-cible{margin:8px 0;padding:8px 10px;border-radius:10px;background:rgba(76,214,242,.08);border:1px dashed #4cd6f2}'+
    '#'+EDITEUR_ID+' .at-cible code{display:block;margin-top:4px;font-size:12px;color:#9fb3d8;word-break:break-all}'+
    '#'+EDITEUR_ID+' .at-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 4px}'+
    '#'+EDITEUR_ID+' .at-etat{min-height:20px;font-weight:700;margin:6px 0}'+
    '#'+EDITEUR_ID+' .at-etat.erreur{color:#ff8f8f}'+
    '@media (max-width:560px){#'+EDITEUR_ID+' .at-rang{grid-template-columns:1fr}}';
  (document.head||document.documentElement).appendChild(s);
}

/* ---------- liste (dans le menu Admin) ---------- */

function listeHtml_(){
  if(etat.erreur)return '<p style="color:#ff8f8f">'+esc_(etat.erreur)+'</p><button type="button" data-at="recharger">Réessayer</button>';
  if(!etat.charge)return '<p>Chargement…</p>';
  var l=etat.guides.map(function(g,i){
    return '<div class="at-ligne'+(g.actif?'':' inactif')+'"><div class="at-nom"><b>'+esc_(g.titre)+(g.actif?'':' (désactivé)')+'</b><small>'+esc_(libelleDeclencheur_(g.declencheur))+' · '+g.etapes.length+' étape'+(g.etapes.length>1?'s':'')+'</small></div>'+
      '<button type="button" data-at="apercu" data-i="'+i+'">👁 Aperçu</button>'+
      '<button type="button" data-at="voix" data-i="'+i+'" title="Texte lu et voix de chaque étape de ce guide">🎙 Voix</button>'+
      '<button type="button" class="'+(g.actif?'':'principal')+'" data-at="basculer" data-i="'+i+'">'+(g.actif?'⏸ Désactiver':'▶ Activer')+'</button>'+
      '<button type="button" data-at="modifier" data-i="'+i+'">✏️ Modifier</button>'+
      '<button type="button" class="danger" data-at="supprimer" data-i="'+i+'">🗑</button></div>';
  }).join('');
  return (etat.message?'<p style="font-weight:700">'+esc_(etat.message)+'</p>':'')+
    '<p style="font-size:14px;color:#aeb9d4">Chaque guide est une suite d’étapes jouées automatiquement : au début du jeu, à la première ouverture d’un menu, ou après un boss. Tu choisis les textes, ce que la fenêtre montre à l’écran et où elle se place.</p>'+
    '<p style="font-size:14px;color:#aeb9d4">🎙 <b>Voix :</b> chaque étape a sa voix. Dans la section « Textes » du menu Admin, cherche le groupe « Tutoriel · … » : tu y changes ce que la voix dit, tu la génères (studio de voix) et tu l’écoutes. Le joueur l’entend si sa voix est activée, et peut la relancer avec 🔊.</p>'+
    (l||'<p>Aucun guide pour le moment.</p>')+
    '<div class="at-actions" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="principal" data-at="nouveau">➕ Nouveau guide</button></div>'+
    '<div class="at-ancien"><label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" data-at="ancien" '+(etat.ancienActif?'checked':'')+'> <span><b>Jouer l’ancien tutoriel de départ</b> (les fenêtres de Norman &amp; Sébastien : début du jeu, premier boss, Aventure et Renaissance). Décoche quand tes guides de départ sont prêts : ils le remplacent.</span></label>'+
      '<label style="display:flex;gap:8px;align-items:flex-start;margin-top:8px"><input type="checkbox" data-at="ancienmenus" '+(etat.ancienMenus?'checked':'')+'> <span><b>Jouer les anciennes fenêtres d’explication des menus</b> (celles qui s’ouvrent la première fois qu’on ouvre un menu : une trentaine). Décoche quand tu as écrit les tiennes : tant que cette case est cochée, les deux types de fenêtres peuvent se suivre.</span></label></div>';
}

function rafraichirListe_(){
  var el=document.getElementById(LISTE_ID);
  if(el)el.innerHTML=listeHtml_();
}

/*
 * Bouton « 🎙 Voix » d'un guide : liste ses étapes ; chacune s'ouvre dans l'éditeur de textes et de voix (modules/textes-admin-v1.js), où l'on change ce que la voix dit, la génère et l'écoute.
 */
function voixGuide_(i){
  var g=etat.guides[i],T=window.__SOREAL_IDLE_TUTORIEL_V1__,X=window.__SOREAL_IDLE_TEXTES_V1__;
  if(!g||!T||!X||typeof X.editer!=='function'){window.alert('Éditeur de voix indisponible.');return;}
  T.declarerVoix(g);
  var vieux=document.getElementById('sorealIdleTutoVoixV1');if(vieux&&vieux.parentNode)vieux.parentNode.removeChild(vieux);
  var o=document.createElement('div');
  o.id='sorealIdleTutoVoixV1';
  o.style.cssText='position:fixed;inset:0;z-index:1000000;background:rgba(3,6,12,.82);overflow:auto;padding:14px;box-sizing:border-box';
  o.innerHTML='<div style="max-width:640px;margin:0 auto;background:#10151f;border:1.5px solid #3b4a6b;border-radius:14px;padding:16px;color:#e8eefc;font:500 15px/1.5 system-ui,sans-serif">'+
    '<h3 style="margin:0 0 4px">🎙 Voix · '+esc_(g.titre)+'</h3>'+
    '<p style="font-size:13px;color:#8fa0c4;margin:0 0 10px">Une voix par étape. Ouvre une étape pour changer ce que la voix dit, la générer (studio de voix) et l’écouter.</p>'+
    g.etapes.map(function(e,k){return '<div style="display:flex;gap:8px;align-items:center;margin:6px 0"><span style="flex:1"><b>Étape '+(k+1)+'</b> — '+esc_(e.titre||'Sans titre')+'</span><button type="button" data-av="'+k+'" style="min-height:38px;padding:6px 12px;border-radius:10px;border:1.5px solid #4b5d85;background:#1b2538;color:#e8eefc;font:700 14px system-ui,sans-serif;cursor:pointer">🎙 Ouvrir</button></div>';}).join('')+
    '<div style="margin-top:12px"><button type="button" data-av="fermer" style="min-height:42px;padding:8px 14px;border-radius:10px;border:1.5px solid #4b5d85;background:#1b2538;color:#e8eefc;font:700 14px system-ui,sans-serif;cursor:pointer">Fermer</button></div></div>';
  o.addEventListener('click',function(ev){
    var b=ev.target.closest?ev.target.closest('[data-av]'):null;
    if(!b){if(ev.target===o)o.remove();return;}
    var v=b.getAttribute('data-av');
    if(v==='fermer'){o.remove();return;}
    X.editer(T.cleVoix(g,Number(v)));
  });
  document.body.appendChild(o);
}

/* Les étapes de tous les guides (même inactifs) sont proposées à l'éditeur de textes et de voix (Admin → Textes). */
function declarerVoix_(){
  var T=window.__SOREAL_IDLE_TUTORIEL_V1__;
  if(T&&typeof T.declarerVoix==='function')etat.guides.forEach(function(g){T.declarerVoix(g);});
}

function charger_(){
  if(etat.enCharge)return;
  etat.enCharge=true;
  appel_('listerTutorielAdminSorealIdle',[]).then(function(res){
    etat.enCharge=false;
    if(!res||res.ok===false)throw new Error((res&&res.message)||'Chargement impossible.');
    etat.guides=Array.isArray(res.guides)?res.guides:[];
    etat.ancienActif=res.ancienActif!==false;
    etat.ancienMenus=res.ancienMenusActif!==false;
    etat.charge=true;etat.erreur='';
    declarerVoix_();
    if(window.__SOREAL_IDLE_TUTORIEL_V1__){window.__SOREAL_IDLE_TUTORIEL_V1__.definirAncienActif(etat.ancienActif);window.__SOREAL_IDLE_TUTORIEL_V1__.definirAncienMenus(etat.ancienMenus);}
    rafraichirListe_();
  }).catch(function(e){
    etat.enCharge=false;etat.erreur='Tutoriel : '+String(e&&e.message||e);
    rafraichirListe_();
  });
}

function pageHtml_(){
  installerStyle_();
  if(!etat.charge&&!etat.enCharge&&!etat.erreur)setTimeout(charger_,0);
  return '<div class="soreal-idle-section-v8"><div class="soreal-idle-window-title-v31">🎓 Admin — Tutoriel</div><div id="'+LISTE_ID+'">'+listeHtml_()+'</div></div>';
}

/* ---------- aperçu ---------- */

function pourLecteur_(g){
  return {id:g.id||'apercu',titre:g.titre||'Aperçu',vuId:'apercu',etapes:g.etapes.map(function(e){return {titre:e.titre,texte:e.texte,menu:e.menu,cible:e.cible&&e.cible.selecteur?e.cible:null,placement:e.placement,surbrillance:e.surbrillance!==false,avanceAuClic:Boolean(e.avanceAuClic&&e.cible&&e.cible.selecteur)};})};
}
function apercu_(guide,apres){
  var T=window.__SOREAL_IDLE_TUTORIEL_V1__;
  if(!T)return;
  T.jouer(pourLecteur_(guide),{apercu:true,apresFin:apres});
}

/* ---------- éditeur ---------- */

function optionsMenus_(choisi,avecVide){
  return (avecVide?'<option value="">(là où se trouve le joueur)</option>':'')+menus_().map(function(m){return '<option value="'+esc_(m.id)+'"'+(m.id===choisi?' selected':'')+'>'+esc_((m.icon?m.icon+' ':'')+m.nom)+'</option>';}).join('');
}

function etapeHtml_(e,i,total){
  var cible=e.cible&&e.cible.selecteur;
  return '<div class="at-etape" data-etape="'+i+'">'+
    '<div class="at-etape-tete"><b>Étape '+(i+1)+'</b><span>'+
      '<button type="button" data-ae="haut" data-i="'+i+'" '+(i===0?'disabled':'')+'>⬆</button> '+
      '<button type="button" data-ae="bas" data-i="'+i+'" '+(i>=total-1?'disabled':'')+'>⬇</button> '+
      '<button type="button" data-ae="voir" data-i="'+i+'">▶ Voir cette étape</button> '+
      '<button type="button" class="danger" data-ae="suppr" data-i="'+i+'">🗑</button></span></div>'+
    '<label>Titre (facultatif)</label><input type="text" data-champ="titre" maxlength="80" value="'+esc_(e.titre)+'">'+
    '<label>Texte</label><textarea data-champ="texte" maxlength="1500">'+esc_(e.texte)+'</textarea>'+
    '<label>Menu où se passe l’étape</label><select data-champ="menu">'+optionsMenus_(e.menu,true)+'</select>'+
    '<div class="at-cible"><b>🎯 Élément montré :</b> '+(cible?esc_(e.cible.libelle||'(élément choisi)')+'<code>'+esc_(e.cible.selecteur)+'</code>':'<i>aucun — la fenêtre s’affiche au centre</i>')+
      '<div class="at-actions"><button type="button" class="principal" data-ae="placer" data-i="'+i+'">🎯 Placer sur l’écran</button>'+(cible?' <button type="button" data-ae="sanscible" data-i="'+i+'">Sans cible</button>':'')+'</div></div>'+
    '<div class="at-rang"><div><label>Où se place la fenêtre</label><select data-champ="placement">'+
      [['auto','Automatique (côté où il y a de la place)'],['haut','Au-dessus'],['bas','En dessous'],['gauche','À gauche'],['droite','À droite'],['centre','Au centre']].map(function(p){return '<option value="'+p[0]+'"'+(e.placement===p[0]?' selected':'')+'>'+p[1]+'</option>';}).join('')+
    '</select></div><div><label>Cadre lumineux</label><label style="display:flex;gap:8px;align-items:center;font-weight:400"><input type="checkbox" data-champ="surbrillance" '+(e.surbrillance!==false?'checked':'')+'> entoure l’élément montré</label></div></div>'+
    '<label style="display:flex;gap:8px;align-items:flex-start;font-weight:400;margin-top:10px"><input type="checkbox" data-champ="avanceAuClic" '+(e.avanceAuClic?'checked':'')+(cible?'':' disabled')+'> <span><b>Passe à l’étape suivante quand le joueur clique sur l’élément montré</b> (il faut une cible). Le bouton « Suivant » est alors caché pendant 30 secondes, puis il revient pour ne jamais bloquer le joueur.</span></label>'+
  '</div>';
}

function editeurHtml_(){
  var g=edition;
  var d=g.declencheur||{type:'debut'};
  return '<div class="at-panneau"><h2>🎓 '+(editionEstNouveau?'Nouveau guide':'Modifier le guide')+'</h2>'+
    '<label>Titre du guide (pour toi : le joueur ne le voit pas)</label><input type="text" data-g="titre" maxlength="80" value="'+esc_(g.titre)+'">'+
    '<div class="at-rang"><div><label>Quand est-il joué ?</label><select data-g="decl">'+
      [['debut','Au début du jeu (nouveau joueur)'],['menu','À la première ouverture d’un menu'],['boss','Après la victoire contre un boss']].map(function(x){return '<option value="'+x[0]+'"'+(d.type===x[0]?' selected':'')+'>'+x[1]+'</option>';}).join('')+
    '</select></div><div>'+
      (d.type==='menu'?'<label>Menu</label><select data-g="menu">'+optionsMenus_(d.menu,false)+'</select>':'')+
      (d.type==='boss'?'<label>Numéro du boss</label><input type="number" data-g="boss" min="1" max="999" value="'+esc_(d.boss||'')+'">':'')+
    '</div></div>'+
    '<div class="at-rang"><div><label>Ordre (si plusieurs guides ont le même déclencheur)</label><input type="number" data-g="ordre" value="'+esc_(g.ordre||0)+'"></div>'+
      '<div><label>Activé</label><label style="display:flex;gap:8px;align-items:center;font-weight:400"><input type="checkbox" data-g="actif" '+(g.actif!==false?'checked':'')+'> le guide est joué aux joueurs</label></div></div>'+
    '<div id="atEtapes">'+g.etapes.map(function(e,i){return etapeHtml_(e,i,g.etapes.length);}).join('')+'</div>'+
    '<div class="at-actions"><button type="button" data-ag="ajouter">➕ Ajouter une étape</button></div>'+
    '<div class="at-etat" id="atEtat"></div>'+
    '<div class="at-actions"><button type="button" class="principal" data-ag="enregistrer">💾 Enregistrer</button><button type="button" data-ag="apercu">👁 Aperçu du guide</button><button type="button" data-ag="annuler">Fermer</button></div></div>';
}

function afficherEtat_(txt,erreur){
  var el=document.getElementById('atEtat');
  if(el){el.textContent=txt||'';el.className='at-etat'+(erreur?' erreur':'');}
}

/* Recopie les champs de l'écran dans la copie de travail. */
function lireChamps_(){
  var ed=document.getElementById(EDITEUR_ID);
  if(!ed||!edition)return;
  function v(sel){var x=ed.querySelector(sel);return x?x.value:'';}
  edition.titre=v('[data-g="titre"]');
  var type=v('[data-g="decl"]')||'debut';
  var decl={type:type};
  if(type==='menu')decl.menu=v('[data-g="menu"]')||(edition.declencheur&&edition.declencheur.menu)||'';
  if(type==='boss')decl.boss=Math.floor(Number(v('[data-g="boss"]'))||0)||'';
  edition.declencheur=decl;
  edition.ordre=Math.floor(Number(v('[data-g="ordre"]'))||0);
  var a=ed.querySelector('[data-g="actif"]');edition.actif=a?a.checked:true;
  Array.prototype.forEach.call(ed.querySelectorAll('.at-etape'),function(bloc){
    var i=Number(bloc.getAttribute('data-etape'));
    var e=edition.etapes[i];if(!e)return;
    function c(n){var x=bloc.querySelector('[data-champ="'+n+'"]');return x;}
    e.titre=c('titre').value;e.texte=c('texte').value;e.menu=c('menu').value;e.placement=c('placement').value;e.surbrillance=c('surbrillance').checked;e.avanceAuClic=Boolean(c('avanceAuClic').checked&&e.cible&&e.cible.selecteur);
  });
}

function rendre_(){
  installerStyle_();
  var ed=document.getElementById(EDITEUR_ID);
  if(!ed){ed=document.createElement('div');ed.id=EDITEUR_ID;document.body.appendChild(ed);}
  ed.hidden=false;
  var defil=ed.scrollTop;
  ed.innerHTML=editeurHtml_();
  ed.scrollTop=defil;
}

function ouvrir_(guide,nouveau){
  edition=copie_(guide);editionEstNouveau=Boolean(nouveau);
  if(!edition.etapes||!edition.etapes.length)edition.etapes=[etapeVide_()];
  rendre_();
}
function fermerEditeur_(){
  var ed=document.getElementById(EDITEUR_ID);
  if(ed&&ed.parentNode)ed.parentNode.removeChild(ed);
  edition=null;
}
function masquerEditeur_(){var ed=document.getElementById(EDITEUR_ID);if(ed)ed.hidden=true;}
function remontrerEditeur_(){var ed=document.getElementById(EDITEUR_ID);if(ed)ed.hidden=false;}

function placerSurEcran_(i){
  lireChamps_();
  var e=edition.etapes[i];if(!e)return;
  var T=window.__SOREAL_IDLE_TUTORIEL_V1__;
  if(!T){afficherEtat_('Le tutoriel du jeu n’est pas chargé.',true);return;}
  masquerEditeur_();
  /* Le jeu se place sur le menu de l'étape pour que l'on voie le bon écran. */
  if(e.menu&&typeof window.__menuIdleV28__==='function'){try{window.__menuIdleV28__(e.menu);}catch(_e){}}
  setTimeout(function(){
    T.choisirElement().then(function(res){
      remontrerEditeur_();
      if(res&&res.selecteur){e.cible={selecteur:res.selecteur,libelle:res.libelle};rendre_();afficherEtat_('Élément choisi : « '+(res.libelle||res.selecteur)+' ».',false);}
      else if(res&&!res.selecteur){rendre_();afficherEtat_('Impossible de repérer cet élément de façon fiable : choisis-en un voisin.',true);}
      else rendre_();
    });
  },e.menu?500:80);
}

function enregistrer_(){
  lireChamps_();
  var g=copie_(edition);
  if(!String(g.titre||'').trim()){afficherEtat_('Donne un titre au guide.',true);return;}
  if(g.declencheur.type==='menu'&&!g.declencheur.menu){afficherEtat_('Choisis le menu.',true);return;}
  if(g.declencheur.type==='boss'&&!(g.declencheur.boss>0)){afficherEtat_('Indique le numéro du boss.',true);return;}
  g.etapes=g.etapes.filter(function(e){return String(e.texte||'').trim()||String(e.titre||'').trim();});
  if(!g.etapes.length){afficherEtat_('Écris au moins un texte.',true);return;}
  if(!g.id)g.id=nouvelId_(g.titre);
  afficherEtat_('Enregistrement…',false);
  appel_('enregistrerTutorielAdminSorealIdle',[g]).then(function(res){
    if(!res||res.ok===false)throw new Error((res&&res.message)||'Enregistrement refusé.');
    var idx=-1;etat.guides.forEach(function(x,i){if(x.id===res.guide.id)idx=i;});
    if(idx>=0)etat.guides[idx]=res.guide;else etat.guides.push(res.guide);
    declarerVoix_();
    etat.guides.sort(function(a,b){return (a.ordre-b.ordre)||String(a.id).localeCompare(String(b.id));});
    etat.message='✔ Guide « '+res.guide.titre+' » enregistré : il est en ligne tout de suite.';
    fermerEditeur_();rafraichirListe_();
  }).catch(function(e){afficherEtat_(String(e&&e.message||e),true);});
}

function supprimer_(i){
  var g=etat.guides[i];if(!g)return;
  if(!window.confirm('Supprimer le guide « '+g.titre+' » ? Les joueurs ne le verront plus.'))return;
  appel_('supprimerTutorielAdminSorealIdle',[{id:g.id}]).then(function(res){
    if(!res||res.ok===false)throw new Error('Suppression refusée.');
    etat.guides.splice(i,1);etat.message='Guide supprimé.';rafraichirListe_();
  }).catch(function(e){etat.message=String(e&&e.message||e);rafraichirListe_();});
}

/* Active ou désactive un guide d'un clic (sans ouvrir l'éditeur). */
function basculerGuide_(i){
  var g=etat.guides[i];if(!g)return;
  var copieG=copie_(g);copieG.actif=!g.actif;
  appel_('enregistrerTutorielAdminSorealIdle',[copieG]).then(function(res){
    if(!res||res.ok===false)throw new Error((res&&res.message)||'Enregistrement refusé.');
    etat.guides[i]=res.guide;
    etat.message=res.guide.actif?'✔ Guide « '+res.guide.titre+' » activé : les joueurs le voient.':'Guide « '+res.guide.titre+' » désactivé : les joueurs ne le voient plus.';
    rafraichirListe_();
  }).catch(function(e){etat.message=String(e&&e.message||e);rafraichirListe_();});
}

function basculerAncien_(actif,quoi){
  appel_('reglerAncienTutorielAdminSorealIdle',[{actif:Boolean(actif),quoi:quoi||'tutoriel'}]).then(function(res){
    if(!res||res.ok===false)throw new Error('Réglage refusé.');
    etat.ancienActif=res.ancienActif!==false;
    etat.ancienMenus=res.ancienMenusActif!==false;
    if(window.__SOREAL_IDLE_TUTORIEL_V1__){window.__SOREAL_IDLE_TUTORIEL_V1__.definirAncienActif(etat.ancienActif);window.__SOREAL_IDLE_TUTORIEL_V1__.definirAncienMenus(etat.ancienMenus);}
    etat.message=quoi==='menus'
      ?(etat.ancienMenus?'Les anciennes fenêtres d’explication des menus sont de nouveau jouées.':'Les anciennes fenêtres d’explication des menus sont désactivées.')
      :(etat.ancienActif?'L’ancien tutoriel de départ est de nouveau joué.':'L’ancien tutoriel de départ est désactivé : seuls tes guides le remplacent.');
    rafraichirListe_();
  }).catch(function(e){etat.message=String(e&&e.message||e);rafraichirListe_();});
}

/* ---------- événements ---------- */

document.addEventListener('click',function(ev){
  var t=ev.target&&ev.target.closest?ev.target.closest('[data-at],[data-ae],[data-ag]'):null;
  if(!t)return;
  var l=document.getElementById(LISTE_ID),ed=document.getElementById(EDITEUR_ID);
  var i=Number(t.getAttribute('data-i'));
  if(t.hasAttribute('data-at')&&l&&l.contains(t)){
    var a=t.getAttribute('data-at');
    if(a==='nouveau'){etat.message='';ouvrir_(guideVide_(),true);}
    else if(a==='modifier'){etat.message='';ouvrir_(etat.guides[i],false);}
    else if(a==='apercu'){var g=etat.guides[i];if(g)apercu_(g,null);}
    else if(a==='voix')voixGuide_(i);
    else if(a==='supprimer')supprimer_(i);
    else if(a==='recharger'){etat.erreur='';etat.charge=false;charger_();rafraichirListe_();}
    else if(a==='ancien')basculerAncien_(t.checked,'tutoriel');
    else if(a==='ancienmenus')basculerAncien_(t.checked,'menus');
    else if(a==='basculer')basculerGuide_(i);
    return;
  }
  if(!ed||!ed.contains(t)||!edition)return;
  if(t.hasAttribute('data-ae')){
    lireChamps_();
    var b=t.getAttribute('data-ae'),e=edition.etapes[i];
    if(b==='placer'){placerSurEcran_(i);return;}
    if(b==='sanscible'&&e){e.cible=null;rendre_();return;}
    if(b==='haut'&&i>0){var x=edition.etapes.splice(i,1)[0];edition.etapes.splice(i-1,0,x);rendre_();return;}
    if(b==='bas'&&i<edition.etapes.length-1){var y=edition.etapes.splice(i,1)[0];edition.etapes.splice(i+1,0,y);rendre_();return;}
    if(b==='suppr'){
      if(edition.etapes.length<=1){afficherEtat_('Un guide garde au moins une étape.',true);return;}
      if(window.confirm('Supprimer l’étape '+(i+1)+' ?')){edition.etapes.splice(i,1);rendre_();}
      return;
    }
    if(b==='voir'){
      var guide=copie_(edition);guide.etapes=guide.etapes.slice(i);
      masquerEditeur_();apercu_(guide,remontrerEditeur_);return;
    }
  }
  if(t.hasAttribute('data-ag')){
    var c=t.getAttribute('data-ag');
    if(c==='ajouter'){lireChamps_();edition.etapes.push(etapeVide_());rendre_();return;}
    if(c==='enregistrer'){enregistrer_();return;}
    if(c==='annuler'){fermerEditeur_();return;}
    if(c==='apercu'){lireChamps_();var gp=copie_(edition);masquerEditeur_();apercu_(gp,remontrerEditeur_);return;}
  }
});
/* Le changement de déclencheur affiche le bon champ (menu ou numéro de boss). */
document.addEventListener('change',function(ev){
  var t=ev.target;
  if(t&&t.getAttribute&&t.getAttribute('data-g')==='decl'&&edition){lireChamps_();if(edition.declencheur.type==='menu'&&!edition.declencheur.menu){var m=menus_()[0];edition.declencheur.menu=m?m.id:'';}rendre_();}
});

window.__SOREAL_IDLE_ADMIN_TUTORIEL_V1__={
  pageHtml:pageHtml_,
  recharger:function(){etat.charge=false;etat.erreur='';charger_();rafraichirListe_();},
  /* Outils de test. */
  guideVide:guideVide_,
  etapeVide:etapeVide_,
  libelleDeclencheur:libelleDeclencheur_,
  nouvelId:nouvelId_,
  pourLecteur:pourLecteur_
};
})();
