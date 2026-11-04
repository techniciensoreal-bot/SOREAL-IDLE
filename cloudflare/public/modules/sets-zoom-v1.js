/*
 * SOREAL IDLE — Sets : vue ZOOM d'une pièce (Norman, 2026-11-04 : « dans la vitrine de sets, je dois pouvoir cliquer sur un objet et il doit venir en grand, comme pour le daycare, et me mettre ses statistiques et bonus »).
 * Un clic sur une pièce de la vitrine (page-chroniques-v1.js : data-sets-zoom-v1 = clé de fiche) ouvre cette vue : l'icône (copie) arrive depuis sa case au centre de l'écran, en grand, sur son socle ; dessous, la fiche
 * d'objet UNIFIÉE du jeu (nom, niveau, Puissance / PV max / Endurance / Regen / Specials avec leur plafond, bonus de l'ensemble) : on la fait construire par le jeu (afficherPopupObjetUnifieIdleV1_) puis on reprend
 * son contenu : aucune valeur n'est recalculée ni inventée ici. Échap, clic hors de la carte et « Fermer » ferment.
 * Règle n°2 : seule la pièce cliquée (déjà découverte) ; aucun total. Règle n°3 : l'arrivée joue UNE fois, aucune boucle ; prefers-reduced-motion = apparition sans mouvement.
 * Règle n°4 : la couche est posée dans <body>, marquée data-morph-garder (un redessin de la page ne la touche pas). Accessibilité : role="dialog", aria-modal, focus sur « Fermer ».
 * Expose window.__SOREAL_IDLE_SETS_ZOOM_V1__ { ouvrir, fermer, ouvert }.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_SETS_ZOOM_V1__)return;
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  let couche=null,cleOuverte=null,focusAvant=null;

  function mouvementReduit(){try{return Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){return false;}}

  function css(){
    if(typeof document==='undefined'||!document.head||document.getElementById('sz-style-v1'))return;
    const s=document.createElement('style');
    s.id='sz-style-v1';
    s.textContent=[
      '.sz-fond{position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;background:rgba(4,6,12,.78);overflow:auto}',
      '.sz-carte{display:flex;flex-direction:column;align-items:center;gap:12px;margin:auto;max-width:100%}',
      '.sz-arrive .sz-carte{animation:sz-arrive .34s cubic-bezier(.2,.8,.3,1) 1 both}',
      '@keyframes sz-arrive{from{opacity:.2;transform:translate(var(--sz-dx,0),var(--sz-dy,0)) scale(var(--sz-s,.3))}to{opacity:1;transform:none}}',
      '.sz-socle{position:relative;display:flex;align-items:center;justify-content:center;width:min(60vw,230px);height:min(60vw,230px);padding-bottom:34px;box-sizing:border-box;border-radius:16px;border:2px solid rgba(217,169,74,.7);background:radial-gradient(ellipse 80% 58% at 50% 38%,rgba(255,236,150,.22),rgba(30,18,50,.92) 72%),#0c0814;box-shadow:inset 0 0 30px rgba(0,0,0,.7),0 10px 28px rgba(0,0,0,.6)}',
      '.sz-socle::after{content:"";position:absolute;left:50%;bottom:14px;width:78%;height:16px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(ellipse at 50% 40%,#f1d78a,#8a6a22 70%,#3a2a08);box-shadow:0 4px 8px rgba(0,0,0,.6)}',
      '.sz-icone{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;width:100%;height:100%}',
      '.sz-icone img,.sz-icone svg,.sz-icone canvas{width:62%;height:auto;max-height:78%;object-fit:contain;filter:drop-shadow(0 6px 6px rgba(0,0,0,.7))}',
      '.sz-fiche{width:min(92vw,360px);box-sizing:border-box;padding:12px 14px;border-radius:12px;background:rgba(16,10,24,.92);border:1px solid rgba(217,169,74,.55);color:#f3ecd6;font:400 15px/1.35 "Russo One",system-ui,sans-serif}',
      '.sz-fiche .soreal-idle-item-popup-drag-v1,.sz-fiche button{display:none}',
      '.sz-btn{min-width:130px;padding:10px 18px;border-radius:12px;border:1px solid #5d4208;background:linear-gradient(180deg,#f6d77f,#c9a243 55%,#99721c);box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 4px 10px rgba(0,0,0,.55);color:#2b1d05;font:400 16px/1.1 "Russo One",system-ui,sans-serif;cursor:pointer}',
      '.sz-btn:focus-visible{outline:3px solid #fff;outline-offset:2px}',
      '@media (prefers-reduced-motion:reduce){.sz-arrive .sz-carte{animation:none}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function fermer(silencieux){
    if(couche&&couche.parentNode)couche.parentNode.removeChild(couche);
    const avait=Boolean(couche);
    couche=null;cleOuverte=null;
    if(avait&&!silencieux&&focusAvant&&focusAvant.focus){try{focusAvant.focus({preventScroll:true});}catch(_e){}}
    if(!silencieux)focusAvant=null;
  }

  function ouvrir(cle,source){
    if(typeof document==='undefined')return false;
    if(cleOuverte!=null&&cleOuverte===String(cle)){fermer();return true;}
    const afficher=REG.afficherPopupObjetUnifieIdleV1_;
    if(typeof afficher!=='function')return false;
    /* le jeu construit la fiche d'objet unifiée ; on reprend son contenu puis on referme sa petite fenêtre */
    let ficheHtml='';
    try{
      if(!afficher(cle,null))return false;
      const corps=document.getElementById('soreal-idle-v138-details-body');
      ficheHtml=corps?corps.innerHTML:'';
      if(typeof REG.fermerDetailsObjetAdventureIdleV1_==='function')REG.fermerDetailsObjetAdventureIdleV1_();
      else{const root=document.getElementById('soreal-idle-v138-details');if(root)root.style.display='none';}
    }catch(_e){return false;}
    if(!ficheHtml)return false;
    css();
    fermer(true);
    cleOuverte=String(cle);
    const icone=source&&source.querySelector?source.querySelector('.sc-icone'):null;
    const d=document.createElement('div');
    d.className='sz-fond';d.setAttribute('data-morph-garder','1');d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label','Détails de la pièce');
    d.innerHTML=
      '<div class="sz-carte">'+
        '<div class="sz-socle"><div class="sz-icone">'+(icone?icone.innerHTML:'')+'</div></div>'+
        '<div class="sz-fiche">'+ficheHtml+'</div>'+
        '<button type="button" class="sz-btn" data-sz-fermer>Fermer</button>'+
      '</div>';
    d.addEventListener('click',function(ev){
      const t=ev.target;
      if(t.closest&&t.closest('[data-sz-fermer]')){fermer();return;}
      if(!(t.closest&&(t.closest('.sz-socle')||t.closest('.sz-fiche'))))fermer();
    });
    focusAvant=document.activeElement;
    document.body.appendChild(d);
    couche=d;
    /* arrivée depuis la case : une seule fois, transform + opacité */
    if(source&&source.getBoundingClientRect&&!mouvementReduit()){
      const a=source.getBoundingClientRect(),b=d.querySelector('.sz-socle').getBoundingClientRect();
      if(a.width>0&&b.width>0){
        d.style.setProperty('--sz-dx',(a.left+a.width/2-(b.left+b.width/2)).toFixed(1)+'px');
        d.style.setProperty('--sz-dy',(a.top+a.height/2-(b.top+b.height/2)).toFixed(1)+'px');
        d.style.setProperty('--sz-s',Math.max(.1,a.width/b.width).toFixed(3));
        d.classList.add('sz-arrive');
      }
    }
    try{d.querySelector('[data-sz-fermer]').focus({preventScroll:true});}catch(_e){}
    return true;
  }

  if(typeof document!=='undefined'&&document.addEventListener)document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&couche){ev.stopPropagation();fermer();}},true);
  window.__SOREAL_IDLE_SETS_ZOOM_V1__={ouvrir:ouvrir,fermer:fermer,ouvert:function(){return cleOuverte;}};
})();
