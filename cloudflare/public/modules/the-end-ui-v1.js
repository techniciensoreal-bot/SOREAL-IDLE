/*
 * SOREAL IDLE — interface de THE END (2026-09-25). Voir src/idle-the-end-v1.js.
 *
 *  - panneau des pièces trouvées (dans l'équipement du sac), invisible tant qu'aucune pièce n'est trouvée, jamais de compteur ;
 *  - pièce au bouton rouge : cliquable une fois les 16 réunies (confirmation), elle lance la fin ;
 *  - ligne du dernier Hack (page Hacks) ;
 *  - fin plein écran : le texte vient du serveur au moment de lancer la fin (jamais présent dans ce fichier), révélé paragraphe par paragraphe,
 *    un clic ou une touche accélère, Échap ferme.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_THE_END_UI_V1__)return;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

function injecterStyle(){
  if(document.getElementById('soreal-idle-the-end-style-v1'))return;
  const st=document.createElement('style');
  st.id='soreal-idle-the-end-style-v1';
  st.textContent=
    '.soreal-idle-the-end-v1{margin-top:12px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}'+
    '.soreal-idle-the-end-piece-v1{min-width:44px;height:44px;padding:0 5px;border-radius:8px;border:1px solid rgba(255,255,255,.18);background:#0b0d12;color:#7d8599;font:700 8px/1.1 system-ui,sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;letter-spacing:.06em;cursor:help;box-sizing:border-box}'+
    '.soreal-idle-the-end-piece-v1.red{background:#3a0508;border-color:#ff3b3b;color:#fff;font-size:22px;cursor:pointer;box-shadow:0 0 10px rgba(255,59,59,.55)}'+
    '.soreal-idle-the-end-note-v1{flex-basis:100%;font-size:12px;color:#aeb5c8}'+
    '#soreal-idle-the-end-overlay-v1{position:fixed;inset:0;z-index:100000;background:#000;color:#e9e9ee;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;cursor:pointer;font-family:Georgia,"Times New Roman",serif}'+
    '#soreal-idle-the-end-overlay-v1 .scene{max-width:640px;width:100%;max-height:100%;overflow:auto;text-align:center;font-size:19px;line-height:1.65}'+
    '#soreal-idle-the-end-overlay-v1 p{margin:0 0 1.1em;opacity:0;transition:opacity 1.4s ease}'+
    '#soreal-idle-the-end-overlay-v1 p.on{opacity:1}'+
    '#soreal-idle-the-end-overlay-v1 h1{margin:0 0 .8em;font-size:38px;letter-spacing:.3em;font-weight:700;opacity:0;transition:opacity 1.8s ease}'+
    '#soreal-idle-the-end-overlay-v1 h1.on{opacity:1}'+
    '#soreal-idle-the-end-overlay-v1 .fermer{margin-top:18px;padding:10px 26px;border-radius:999px;border:1px solid #666;background:transparent;color:#ddd;font:600 15px system-ui,sans-serif;cursor:pointer;opacity:0;transition:opacity 1.4s ease}'+
    '#soreal-idle-the-end-overlay-v1 .fermer.on{opacity:1}'+
    '@media (prefers-reduced-motion:reduce){#soreal-idle-the-end-overlay-v1 p,#soreal-idle-the-end-overlay-v1 h1,#soreal-idle-the-end-overlay-v1 .fermer{transition:none}}';
  document.head.appendChild(st);
}

/* Panneau des pièces : chaîne vide tant qu'aucune n'est trouvée. */
function panelHtml(aventure){
  const t=aventure&&aventure.theEnd;
  if(!t||!Array.isArray(t.pieces)||!t.pieces.length)return '';
  injecterStyle();
  const cases=t.pieces.map(function(p){
    const rouge=Boolean(p.red&&t.complete);
    return rouge
      ?'<button type="button" class="soreal-idle-the-end-piece-v1 red" title="'+esc(p.hint)+'" onclick="window.__theEndPlayIdleV1__()">🔴</button>'
      :'<div class="soreal-idle-the-end-piece-v1" title="'+esc(p.hint)+'">THE END</div>';
  }).join('');
  return '<div class="soreal-idle-the-end-v1" id="soreal-idle-the-end-v1">'+cases+
    (t.complete?'<div class="soreal-idle-the-end-note-v1">Les pièces se sont assemblées. Un petit bouton rouge attend.</div>':'')+
  '</div>';
}

/* Dernier Hack (page Hacks) : progression seule, pas de Resource 3. */
function heures(sec){const h=sec/3600;return h>=10?Math.round(h)+' h':(Math.round(h*10)/10)+' h';}
function finalHackHtml(fh){
  if(!fh)return '';
  const pct=fh.total>0?Math.max(0,Math.min(100,fh.seconds/fh.total*100)):0;
  return '<div class="soreal-idle-section-v8" style="margin-top:12px"><div style="display:flex;justify-content:space-between;gap:8px"><b>'+esc(fh.name)+'</b><span>'+(fh.done?'terminé':Math.floor(pct)+' %')+'</span></div>'+
    '<div style="height:8px;border-radius:99px;background:rgba(255,255,255,.1);margin-top:8px;overflow:hidden"><div style="height:100%;width:'+pct.toFixed(2)+'%;background:linear-gradient(90deg,#ff3b3b,#ff9a3b)"></div></div>'+
    '<div style="font-size:12px;color:#aeb5c8;margin-top:6px">'+(fh.done?'':'Progresse seul, sans Resource 3 · '+heures(Math.max(0,fh.total-fh.seconds))+' restantes')+'</div></div>';
}

/* Notification discrète à chaque nouvelle pièce (rien au premier chargement). */
let dejaVues=null;
function notifier(aventure){
  const t=aventure&&aventure.theEnd;
  const ids=t&&Array.isArray(t.pieces)?t.pieces.map(function(p){return p.id;}):[];
  if(dejaVues===null){dejaVues=new Set(ids);return;}
  let nouveau=false;
  ids.forEach(function(id){if(!dejaVues.has(id)){dejaVues.add(id);nouveau=true;}});
  if(nouveau&&typeof window.__toastIdleV5__==='function')window.__toastIdleV5__('🧩 Un objet étrange rejoint ton inventaire.');
}

/* Fin plein écran. lignes : « # titre », « --- » (change de tableau), sinon paragraphe. */
function ouvrirFin(lignes){
  const liste=Array.isArray(lignes)?lignes.slice():[];
  if(!liste.length||document.getElementById('soreal-idle-the-end-overlay-v1'))return;
  injecterStyle();
  const scenes=[[]];
  liste.forEach(function(l){if(l==='---')scenes.push([]);else scenes[scenes.length-1].push(String(l));});
  const overlay=document.createElement('div');
  overlay.id='soreal-idle-the-end-overlay-v1';
  const scene=document.createElement('div');
  scene.className='scene';
  overlay.appendChild(scene);
  document.body.appendChild(overlay);
  const reduit=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let iScene=-1,elements=[],iElem=0,timer=0,fini=false;

  function fermer(){clearTimeout(timer);document.removeEventListener('keydown',touche,true);overlay.remove();}
  function touche(e){if(e.key==='Escape'){e.stopPropagation();fermer();}else if(e.key===' '||e.key==='Enter'){e.preventDefault();avancer();}}
  function delai(el){const n=(el.textContent||'').length;return reduit?0:Math.min(6500,1500+n*38);}
  function afficherSuivant(){
    clearTimeout(timer);
    if(iElem<elements.length){
      const el=elements[iElem++];
      el.classList.add('on');
      timer=setTimeout(afficherSuivant,delai(el));
    }else if(iScene<scenes.length-1){
      timer=setTimeout(prochaineScene,reduit?0:2200);
    }else if(!fini){
      fini=true;
      const b=document.createElement('button');
      b.type='button';b.className='fermer';b.textContent='Fermer';
      b.onclick=function(e){e.stopPropagation();fermer();};
      scene.appendChild(b);
      requestAnimationFrame(function(){b.classList.add('on');});
    }
  }
  function prochaineScene(){
    iScene++;
    scene.innerHTML='';
    elements=scenes[iScene].map(function(l){
      const el=document.createElement(l.charAt(0)==='#'?'h1':'p');
      el.textContent=l.charAt(0)==='#'?l.replace(/^#\s*/,''):l;
      scene.appendChild(el);
      return el;
    });
    iElem=0;
    requestAnimationFrame(afficherSuivant);
  }
  /* Un clic ou Espace : montre tout de suite le paragraphe suivant (ou la scène suivante). */
  function avancer(){
    if(iElem<elements.length){afficherSuivant();}
    else if(iScene<scenes.length-1){prochaineScene();}
  }
  overlay.addEventListener('click',avancer);
  document.addEventListener('keydown',touche,true);
  prochaineScene();
}

window.__theEndPlayIdleV1__=function(){
  if(!window.confirm('Appuyer sur le bouton rouge ?'))return;
  if(typeof window.__actionMetaV47__==='function')window.__actionMetaV47__({action:'adventure',adventure:{action:'theEndPlay'}});
};

window.__SOREAL_IDLE_THE_END_UI_V1__={panelHtml:panelHtml,finalHackHtml:finalHackHtml,notifier:notifier,ouvrirFin:ouvrirFin};
})();
