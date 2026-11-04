/*
 * SOREAL IDLE — fenêtres de dialogue au format du site (Norman, 2026-11-04 : « le popup quand on veut enregistrer doit être au format du site ; il ne doit rester aucun popup avec le look Windows de base »).
 * Remplace alert / confirm / prompt du navigateur. Les appels sont ASYNCHRONES (promesses) : un confirm natif bloquait le code, pas celui-ci.
 *   window.__SOREAL_IDLE_DIALOGUE_V1__.confirmer(texte, {titre, ok, annuler, danger}) -> Promise<boolean>
 *   window.__SOREAL_IDLE_DIALOGUE_V1__.alerter(texte, {titre, ok}) -> Promise<void>
 *   window.__SOREAL_IDLE_DIALOGUE_V1__.saisir(texte, {titre, valeur, max, placeholder, ok, annuler}) -> Promise<string|null>
 * Entrée valide, Échap et le clic hors de la carte annulent ; focus sur le bon bouton puis retour du focus ; role="dialog", aria-modal. La couche est posée dans <body> et marquée data-morph-garder (règle n°4).
 * Une seule fenêtre à la fois : une nouvelle demande ferme la précédente en la refusant (confirmer -> false, saisir -> null). prefers-reduced-motion : aucune animation. Aucune boucle.
 * Le texte est inséré comme TEXTE (jamais en HTML) : aucun contenu venant d'un joueur ne peut injecter de balise.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_DIALOGUE_V1__)return;
  var courant=null;

  function css(){
    if(typeof document==='undefined'||!document.head||document.getElementById('dlg-style-v1'))return;
    var s=document.createElement('style');s.id='dlg-style-v1';
    s.textContent=[
      '.dlg-fond{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;background:rgba(4,6,12,.74)}',
      '.dlg-carte{width:min(92vw,420px);box-sizing:border-box;padding:16px 18px 14px;border-radius:14px;border:2px solid rgba(217,169,74,.75);background:linear-gradient(180deg,#1b1530,#0e0a1d);box-shadow:0 14px 40px rgba(0,0,0,.65),inset 0 1px 0 rgba(255,255,255,.08);color:#f3ecd6;font:400 15px/1.4 "Russo One",system-ui,sans-serif}',
      '.dlg-titre{margin:0 0 8px;font:400 24px/1.1 "Bangers","Russo One",system-ui,sans-serif;letter-spacing:.04em;color:#f2d98d}',
      '.dlg-texte{margin:0 0 12px;white-space:pre-wrap;overflow-wrap:anywhere}',
      '.dlg-champ{width:100%;box-sizing:border-box;margin:0 0 12px;padding:9px 11px;border-radius:9px;border:2px solid #5d4208;background:#0a0716;color:#fff3c9;font:400 16px/1.2 "Russo One",system-ui,sans-serif}',
      '.dlg-champ:focus-visible{outline:3px solid #7fb0ff;outline-offset:1px}',
      '.dlg-boutons{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}',
      '.dlg-btn{min-width:104px;padding:9px 16px;border-radius:11px;border:1px solid #5d4208;background:linear-gradient(180deg,#f6d77f,#c9a243 55%,#99721c);box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 3px 8px rgba(0,0,0,.55);color:#2b1d05;font:400 15px/1.1 "Russo One",system-ui,sans-serif;cursor:pointer}',
      '.dlg-btn.dlg-sec{background:#16221c;color:#fff;border:2px solid #a8f0cc;box-shadow:none}',
      '.dlg-btn.dlg-danger{background:linear-gradient(180deg,#ff8a8a,#d63b3b 55%,#8f1c1c);border-color:#4d0c0c;color:#fff}',
      '.dlg-btn:focus-visible{outline:3px solid #fff;outline-offset:2px}',
      '@media (prefers-reduced-motion:no-preference){.dlg-carte{animation:dlg-entree .16s ease-out 1 both}@keyframes dlg-entree{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function fermer(valeur){
    var c=courant;if(!c)return;
    courant=null;
    try{if(c.fond.parentNode)c.fond.parentNode.removeChild(c.fond);}catch(_e){}
    document.removeEventListener('keydown',c.touche,true);
    try{if(c.focus&&c.focus.focus&&c.focus.isConnected)c.focus.focus({preventScroll:true});}catch(_e){}
    c.fin(valeur);
  }

  function ouvrir(type,texte,opt){
    opt=opt||{};
    return new Promise(function(resolve){
      css();
      if(courant)fermer(type==='saisir'?null:false);
      var fond=document.createElement('div');
      fond.className='dlg-fond';fond.setAttribute('data-morph-garder','1');
      fond.setAttribute('role','dialog');fond.setAttribute('aria-modal','true');
      var carte=document.createElement('div');carte.className='dlg-carte';
      var titre=document.createElement('h3');titre.className='dlg-titre';titre.textContent=String(opt.titre||(type==='confirmer'?'Confirmer':type==='saisir'?'Nom':'Information'));
      fond.setAttribute('aria-label',titre.textContent);
      var p=document.createElement('p');p.className='dlg-texte';p.textContent=String(texte==null?'':texte);
      carte.appendChild(titre);carte.appendChild(p);
      var champ=null;
      if(type==='saisir'){
        champ=document.createElement('input');champ.type='text';champ.className='dlg-champ';champ.value=String(opt.valeur==null?'':opt.valeur);
        champ.maxLength=Math.max(1,Math.min(200,Number(opt.max)||60));champ.placeholder=String(opt.placeholder||'');champ.setAttribute('aria-label',titre.textContent);
        carte.appendChild(champ);
      }
      var bt=document.createElement('div');bt.className='dlg-boutons';
      function bouton(label,classe,fn){var b=document.createElement('button');b.type='button';b.className='dlg-btn'+(classe?' '+classe:'');b.textContent=label;b.addEventListener('click',fn);return b;}
      var ok=bouton(String(opt.ok||(type==='alerter'?'OK':'Valider')),opt.danger?'dlg-danger':'',function(){fermer(type==='saisir'?champ.value:true);});
      if(type!=='alerter'){bt.appendChild(bouton(String(opt.annuler||'Annuler'),'dlg-sec',function(){fermer(type==='saisir'?null:false);}));}
      bt.appendChild(ok);carte.appendChild(bt);fond.appendChild(carte);
      fond.addEventListener('mousedown',function(ev){if(ev.target===fond)fermer(type==='saisir'?null:type==='confirmer'?false:undefined);});
      var touche=function(ev){
        if(ev.key==='Escape'){ev.stopPropagation();ev.preventDefault();fermer(type==='saisir'?null:type==='confirmer'?false:undefined);}
        else if(ev.key==='Enter'&&(!ev.target||ev.target.tagName!=='BUTTON')){ev.stopPropagation();ev.preventDefault();fermer(type==='saisir'?champ.value:true);}
      };
      document.addEventListener('keydown',touche,true);
      courant={fond:fond,touche:touche,focus:document.activeElement,fin:function(v){resolve(v);}};
      document.body.appendChild(fond);
      try{(champ||ok).focus({preventScroll:true});if(champ)champ.select();}catch(_e){}
    });
  }

  window.__SOREAL_IDLE_DIALOGUE_V1__={
    confirmer:function(texte,opt){return ouvrir('confirmer',texte,opt);},
    alerter:function(texte,opt){return ouvrir('alerter',texte,opt).then(function(){});},
    saisir:function(texte,opt){return ouvrir('saisir',texte,opt);},
    ouvert:function(){return Boolean(courant);}
  };
  /* Dernier filet : si un code oublié appelle encore alert(), il passe par la fenêtre du site (non bloquante) ; confirm et prompt natifs ne sont plus utilisés nulle part (test idle-aucun-popup-natif-v1). */
  try{window.alert=function(m){window.__SOREAL_IDLE_DIALOGUE_V1__.alerter(String(m==null?'':m));};}catch(_e){}
})();
