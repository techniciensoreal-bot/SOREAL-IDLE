/*
 * SOREAL IDLE — Garderie : vue ZOOM d'un bocal (Norman, 2026-11-01 : « quand on clique sur un bocal, je ne veux pas le popup immédiatement, je veux que le bocal vienne en zoom »).
 * Un clic sur un bocal occupé (window.__garderieReprendreV1__, posé par daycare-page-v1.js) ouvre cette vue au lieu du popup : le bocal (copie vivante : même forme, même liquide, même ombrage, le
 * liquide continue de monter car la copie garde data-gd-id et est animée par la boucle de la page) arrive depuis sa place au centre de l'écran (transform/opacité, UNE seule fois) ; dessous :
 * nom, « Niv. X › Y » (placé › actuel), temps avant le prochain niveau, temps avant le niveau 100, puis deux boutons : « Reprendre » (ferme la vue et ouvre ENSUITE le popup de confirmation
 * existant, inchangé) et « Ranger » (ferme seulement la vue : il n'existe pas d'action de jeu « ranger » pour un bocal ; la reprise de l'objet = l'action existante daycareRemove du popup).
 * Échap, clic hors du bocal et « Ranger » ferment. Règle n°5 : aucune valeur de jeu inventée ; les durées utilisent le MÊME modèle que la page (vitesse constante par niveau,
 * r = 1 / (heures par niveau x 3600), niveaux restants = 100 - niveau - progression) et le même formateur de durée (dureeLongueNguIdleV130). Rien n'est lu pour décider du jeu : affichage seulement.
 * Règle n°4 : la couche est posée dans <body>, marquée data-morph-garder (un redessin de la page ne la touche pas) ; son texte est mis à jour en place (jamais recréée). Règle n°3 : aucune boucle,
 * l'arrivée joue une fois ; prefers-reduced-motion = apparition sans mouvement. Accessibilité : role="dialog", aria-modal, focus sur « Reprendre », retour du focus à la fermeture.
 * Anti-spoil (règle n°2) : rien que l'objet placé dans le bocal ; aucun total.
 * Expose window.__SOREAL_IDLE_GARDERIE_ZOOM_V1__ { ouvrir, fermer, ouvert }.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_GARDERIE_ZOOM_V1__)return;
  const originalReprendre=window.__garderieReprendreV1__;
  let couche=null,idOuvert=null,minuterie=0,focusAvant=null;

  function duree(s){
    try{if(typeof window.__SOREAL_IDLE_DUREE_JHM_V1__==='function')return window.__SOREAL_IDLE_DUREE_JHM_V1__(s);const M=window.__SOREAL_IDLE_META_PARTAGE_V130__;return M.dureeLongueNguIdleV1_(s);}catch(_e){return '';}
  }
  function trouverOriginal(id){
    const l=document.querySelectorAll('.gd-bocal[data-gd-id]');
    for(let i=0;i<l.length;i+=1){if(l[i].getAttribute('data-gd-id')===String(id)&&!(couche&&couche.contains(l[i])))return l[i];}
    return null;
  }
  function lire(orig){
    const note=document.querySelector('[data-gd-note="'+orig.getAttribute('data-gd-id')+'"]');
    const dep=note&&note.querySelector('.gd-niv-dep'),niv=note&&note.querySelector('.gd-niv-n');
    const liq=orig.querySelector('.gd-liq');
    const m=liq&&/translateY\(([-\d.]+)%\)/.exec(liq.style.transform||'');
    const p=m?Math.max(0,Math.min(1,1-parseFloat(m[1])/100)):(parseFloat(orig.getAttribute('data-gd-p'))||0);
    return {dep:dep?dep.textContent:'',niv:niv?niv.textContent:'',p:p,r:parseFloat(orig.getAttribute('data-gd-r'))||0,max:orig.getAttribute('data-gd-max')==='1'};
  }
  function maj(){
    if(!couche)return;
    const orig=trouverOriginal(idOuvert);
    if(!orig){fermer();return;}
    const v=lire(orig);
    const niv=parseInt(v.niv,10)||0;
    const set=function(sel,txt){const e=couche.querySelector(sel);if(e&&e.textContent!==txt)e.textContent=txt;};
    set('[data-gdz-dep]',v.dep);set('[data-gdz-niv]',v.niv);
    const l1=couche.querySelector('[data-gdz-l1]'),l2=couche.querySelector('[data-gdz-l2]');
    if(v.max||niv>=100){
      set('[data-gdz-t1]','');set('[data-gdz-t2]','');
      if(l1)l1.hidden=true;
      if(l2)l2.hidden=false;
      set('[data-gdz-l2-txt]','Niveau maximal atteint');
      return;
    }
    if(v.r>0){
      if(l1)l1.hidden=false;
      if(l2)l2.hidden=false;
      set('[data-gdz-l2-txt]','Niveau 100 dans');
      set('[data-gdz-t1]',duree(Math.max(0,(1-v.p)/v.r)));
      set('[data-gdz-t2]',duree(Math.max(0,(100-niv-v.p)/v.r)));
    }else{
      if(l1)l1.hidden=true;
      if(l2)l2.hidden=true;
    }
  }
  function ouvrir(id){
    const orig=trouverOriginal(id);
    if(!orig||typeof document==='undefined')return false;
    css();
    fermer(true);
    idOuvert=String(id);
    const pot=orig.closest('.gd-pot'),eta=orig.closest('.gd-etagere');
    const skin=eta?eta.getAttribute('data-skin'):'defaut';
    const nom=(orig.getAttribute('aria-label')||'').replace(/^Reprendre\s*/,'')||'';
    const copie=orig.cloneNode(true);
    copie.removeAttribute('onclick');copie.setAttribute('tabindex','-1');copie.setAttribute('aria-hidden','true');copie.disabled=true;copie.removeAttribute('title');
    const badge=copie.querySelector('.gd-niv-badge');if(badge)badge.remove();
    const d=document.createElement('div');
    d.className='gdz-fond';d.setAttribute('data-morph-garder','1');d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label',nom||'Bocal');
    d.innerHTML=
      '<div class="gdz-carte">'+
        '<div class="gd-etagere gdz-etagere" data-skin="'+String(skin).replace(/[^a-z]/g,'')+'"><div class="gd-pot gdz-pot" data-rang="'+String(pot&&pot.getAttribute('data-rang')||'1').replace(/[^0-9]/g,'')+'"><i class="gd-ombre"></i></div></div>'+
        '<div class="gdz-info">'+
          '<div class="gdz-nom"></div>'+
          '<div class="gdz-ligne"><span>Niv.</span> <i data-gdz-dep></i> › <b data-gdz-niv></b></div>'+
          '<div class="gdz-ligne" data-gdz-l1><span>Prochain niveau dans</span> <b data-gdz-t1></b></div>'+
          '<div class="gdz-ligne" data-gdz-l2><span data-gdz-l2-txt>Niveau 100 dans</span> <b data-gdz-t2></b></div>'+
        '</div>'+
        '<div class="gdz-btns"><button type="button" class="gdz-btn" data-gdz-reprendre>Reprendre</button><button type="button" class="gdz-btn gdz-sec" data-gdz-ranger>Ranger</button></div>'+
      '</div>';
    /* boule de Noël : la copie reprend l'instant du cycle de couleurs de l'original (purement visuel) */
    try{
      const lq=orig.querySelector('.gd-liq'),an=lq&&lq.getAnimations?lq.getAnimations().filter(function(a){return a.animationName==='gd-noel-teintes';})[0]:null;
      if(an&&an.currentTime!=null)d.querySelector('.gdz-etagere').style.setProperty('--gd-noel-d','-'+(Number(an.currentTime)/1000).toFixed(2)+'s');
    }catch(_e){}
    d.querySelector('.gdz-nom').textContent=nom;
    d.querySelector('.gdz-pot').appendChild(copie);
    d.addEventListener('click',function(ev){
      const t=ev.target;
      if(t.closest&&t.closest('[data-gdz-reprendre]')){fermer();if(typeof originalReprendre==='function')originalReprendre(id);return;}
      if(t.closest&&t.closest('[data-gdz-ranger]')){fermer();return;}
      if(!(t.closest&&(t.closest('.gdz-pot')||t.closest('.gdz-info'))))fermer();
    });
    focusAvant=document.activeElement;
    document.body.appendChild(d);
    couche=d;
    maj();
    /* arrivée depuis la place du bocal : une seule fois, transform + opacité */
    if(pot&&!mouvementReduit()){
      const a=pot.getBoundingClientRect(),b=d.querySelector('.gdz-pot').getBoundingClientRect();
      if(a.width>0&&b.width>0){
        d.style.setProperty('--gdz-dx',(a.left+a.width/2-(b.left+b.width/2)).toFixed(1)+'px');
        d.style.setProperty('--gdz-dy',(a.top+a.height/2-(b.top+b.height/2)).toFixed(1)+'px');
        d.style.setProperty('--gdz-s',Math.max(.1,a.width/b.width).toFixed(3));
        d.classList.add('gdz-arrive');
      }
    }
    try{d.querySelector('[data-gdz-reprendre]').focus({preventScroll:true});}catch(_e){}
    clearInterval(minuterie);minuterie=setInterval(maj,250);
    pupillesZoom(true);
    return true;
  }
  /* Norman, 2026-11-02 : bocal pris pour consulter son temps = les pupilles du chat deviennent RONDES (état stable) tant que la vue est ouverte ; fentes à la fermeture (etagere-pupilles-v1.js, classe sur <html>). */
  function pupillesZoom(ouvert){
    try{const P=window.__SOREAL_IDLE_ETAGERE_PUPILLES_V1__;if(P&&typeof P.zoom==='function')P.zoom(ouvert);}catch(_e){}
  }
  function mouvementReduit(){try{return Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){return false;}}
  function fermer(silencieux){
    clearInterval(minuterie);minuterie=0;
    if(couche&&couche.parentNode)couche.parentNode.removeChild(couche);
    const avait=Boolean(couche);
    couche=null;idOuvert=null;
    pupillesZoom(false);
    if(avait&&!silencieux&&focusAvant&&focusAvant.focus){try{focusAvant.focus({preventScroll:true});}catch(_e){}}
    if(!silencieux)focusAvant=null;
  }
  /* Le clic sur un bocal ouvre la vue zoom ; le clic sur le même bocal la referme ; la fonction d'origine (popup) n'est appelée que par « Reprendre ». */
  window.__garderieReprendreV1__=function(id){
    if(idOuvert!=null&&String(idOuvert)===String(id)){fermer();return;}
    if(!ouvrir(id)&&typeof originalReprendre==='function')originalReprendre(id);
  };
  if(typeof document!=='undefined'&&document.addEventListener)document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&couche){ev.stopPropagation();fermer();}},true);

  function css(){
    if(typeof document==='undefined'||!document.head||document.getElementById('gdz-style-v1'))return;
    const s=document.createElement('style');
    s.id='gdz-style-v1';
    s.textContent=[
      '.gdz-fond{position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;background:rgba(4,8,12,.74);overflow:auto}',
      '.gdz-carte{display:flex;flex-direction:column;align-items:center;gap:12px;margin:auto;max-width:100%}',
      '.gdz-arrive .gdz-carte{animation:gdz-arrive .32s cubic-bezier(.2,.8,.3,1) 1 both}',
      '@keyframes gdz-arrive{from{opacity:.2;transform:translate(var(--gdz-dx,0),var(--gdz-dy,0)) scale(var(--gdz-s,.3))}to{opacity:1;transform:none}}',
      '.gdz-fond .gdz-etagere{position:relative;width:auto;max-width:none;aspect-ratio:auto;margin:0;container-type:normal;overflow:visible}',
      '.gdz-fond .gdz-etagere::before{display:none}',
      '.gdz-fond .gd-pot{position:relative;left:auto;top:auto;width:min(56vw,250px,calc((100dvh - 330px) / 1.57));height:calc(min(56vw,250px,calc((100dvh - 330px) / 1.57)) * 1.57)}',
      '.gdz-fond .gd-bocal{pointer-events:none}',
      '.gdz-info{width:min(88vw,340px);box-sizing:border-box;padding:10px 14px;border-radius:12px;background:rgba(16,8,2,.82);border:1px solid rgba(255,226,120,.5);color:#fff3c9;text-align:center;font:400 15px/1.35 "Russo One",system-ui,sans-serif}',
      '.gdz-nom{font:400 22px/1.15 "Bangers","Russo One",system-ui,sans-serif;letter-spacing:.04em;color:#f2d98d;margin-bottom:4px;overflow-wrap:anywhere}',
      '.gdz-ligne[hidden]{display:none}',
      '.gdz-ligne i{font-style:normal}',
      '.gdz-ligne b{color:#5dff7a;text-shadow:0 0 6px rgba(60,220,90,.55)}',
      '.gdz-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}',
      '.gdz-btn{min-width:120px;padding:10px 18px;border-radius:12px;border:1px solid #5d4208;background:linear-gradient(180deg,#f6d77f,#c9a243 55%,#99721c);box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 4px 10px rgba(0,0,0,.55);color:#2b1d05;font:400 16px/1.1 "Russo One",system-ui,sans-serif;cursor:pointer;touch-action:manipulation}',
      '.gdz-btn.gdz-sec{background:#16221c;color:#fff;border:2px solid #a8f0cc}',
      '.gdz-btn:focus-visible{outline:3px solid #fff;outline-offset:2px}',
      '@media (prefers-reduced-motion:reduce){.gdz-arrive .gdz-carte{animation:none}}'
    ].join('\n');
    document.head.appendChild(s);
  }
  window.__SOREAL_IDLE_GARDERIE_ZOOM_V1__={ouvrir:ouvrir,fermer:fermer,ouvert:function(){return idOuvert;}};
})();
