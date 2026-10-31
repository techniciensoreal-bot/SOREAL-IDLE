/*
 * SOREAL IDLE — choix du portrait du joueur sur la borne d'arcade (menu Combat de boss).
 * Maquette validée par Norman (2026-10-31) : un petit bouton rond blanc « 1P » posé sur la tranche du pupitre ouvre la fenêtre « CHOOSE YOUR PLAYER ».
 * Données : j.systemes.portraits = {list:[{id,name,file,unlocked}], selected, unlockedCount, auto} (idle-portraits-v1.js côté serveur) ; action {action:'portrait',id}.
 *
 * Règle n°2 (anti-spoil) : le bouton n'existe QUE si le joueur possède au moins 2 portraits (sinon il trahirait l'existence des autres) ; la fenêtre ne montre
 * que les portraits débloqués, jamais de cadenas ni de total. Set équipé qui force le portrait : grille grisée et inactive, texte SANS nom de set.
 * Règle n°4 (redessin) : la fenêtre est ajoutée à <body> avec data-morph-garder ; la grille est mise à jour sur place (sans la reconstruire si la liste est la même),
 * juste après chaque redessin de la page (window.__SOREAL_IDLE_APRES_REDESSIN_V1__). Le bouton, lui, fait partie du HTML du pupitre (ui-combat-2-v1.js).
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_BORNE_JOUEUR_V1__)return;

  var overlay=null,grille=null,mention=null,signature='';

  function reg(){return window.__SOREAL_IDLE_REG__||{};}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function portraits(j){
    var e=j||reg().idleEtat;
    return e&&e.systemes&&e.systemes.portraits||null;
  }
  function debloques(p){
    var l=p&&Array.isArray(p.list)?p.list:[];
    return l.filter(function(x){return x&&x.unlocked;});
  }

  /* HTML du bouton pour le pupitre ; vide tant que le joueur n'a pas au moins 2 portraits. */
  function boutonHtml(j){
    if(debloques(portraits(j)).length<2)return '';
    return '<button type="button" class="bj-btn" aria-label="Choisir le joueur" title="Choisir le joueur" onclick="window.__borneJoueurOuvrirV1__()">'+
      '<span class="bj-collar"></span><span class="bj-dome"><span class="bj-txt">1P</span></span></button>';
  }

  function action(payload){
    var meta=window.__SOREAL_IDLE_META_V130__;
    if(meta&&typeof meta.actionMetaIdleV130_==='function')meta.actionMetaIdleV130_(payload);
  }

  function choisir(id){
    var p=portraits();
    if(!p||p.auto)return;
    var ok=debloques(p).some(function(x){return String(x.id)===String(id);});
    if(!ok)return;
    if(String(p.selected)!==String(id))action({action:'portrait',id:String(id)});
    fermer();
  }
  window.__borneChoisirPortraitIdleV1__=choisir;

  function construire(){
    if(overlay)return;
    overlay=document.createElement('div');
    overlay.className='bj-overlay';
    overlay.hidden=true;
    overlay.setAttribute('data-morph-garder','');
    overlay.innerHTML='<div class="bj-panel" role="dialog" aria-modal="true" aria-label="CHOOSE YOUR PLAYER">'+
      '<button type="button" class="bj-x" aria-label="Fermer">&times;</button>'+
      '<div class="bj-title" data-sans-traduction>CHOOSE YOUR PLAYER</div>'+
      '<div class="bj-sub">Choisis le portrait de ton héros (cosmétique)</div>'+
      '<div class="bj-set" hidden>Tu portes l’armure d’un set équipé. Retire une pièce pour retrouver ton portrait choisi.</div>'+
      '<div class="bj-grid"></div>'+
      '<div class="bj-foot">1P = portrait actuel</div></div>';
    document.body.appendChild(overlay);
    grille=overlay.querySelector('.bj-grid');
    mention=overlay.querySelector('.bj-set');
    overlay.querySelector('.bj-x').addEventListener('click',fermer);
    overlay.addEventListener('mousedown',function(e){if(e.target===overlay)fermer();});
    grille.addEventListener('click',function(e){
      var c=e.target&&e.target.closest?e.target.closest('.bj-card'):null;
      if(c)choisir(c.getAttribute('data-id'));
    });
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&overlay&&!overlay.hidden)fermer();});
  }

  /* Met la fenêtre au niveau de l'état : reconstruit les cartes seulement si la liste a changé (aucun clignotement). */
  function majGrille(){
    if(!overlay||overlay.hidden)return;
    var p=portraits(),liste=debloques(p);
    if(liste.length<2){fermer();return;}
    var sig=liste.map(function(x){return x.id+'|'+x.file;}).join(',');
    if(sig!==signature){
      signature=sig;
      grille.innerHTML=liste.map(function(x){
        return '<button type="button" class="bj-card" data-id="'+esc(x.id)+'">'+
          '<img src="/api/idle/media/player?portrait='+encodeURIComponent(x.file)+'" alt="" loading="lazy" draggable="false" onerror="this.style.visibility=\'hidden\'">'+
          '<span class="n">'+esc(x.name)+'</span></button>';
      }).join('');
    }
    var forcee=!!p.auto,courant=forcee?p.auto.id:p.selected;
    mention.hidden=!forcee;
    grille.classList.toggle('off',forcee);
    Array.prototype.forEach.call(grille.children,function(c){
      c.classList.toggle('sel',c.getAttribute('data-id')===String(courant));
    });
  }

  function ouvrir(){
    if(debloques(portraits()).length<2)return;
    construire();
    signature='';
    overlay.hidden=false;
    majGrille();
    var x=overlay.querySelector('.bj-x');
    if(x&&x.focus)x.focus();
  }
  function fermer(){if(overlay)overlay.hidden=true;}

  window.__borneJoueurOuvrirV1__=ouvrir;
  window.__SOREAL_IDLE_BORNE_JOUEUR_V1__={boutonHtml:boutonHtml,ouvrir:ouvrir,fermer:fermer,majGrille:majGrille};

  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(function(){
    try{
      if(overlay&&!overlay.hidden&&!document.querySelector('.bj-btn'))fermer();
      else majGrille();
    }catch(_e){}
  });
})();
