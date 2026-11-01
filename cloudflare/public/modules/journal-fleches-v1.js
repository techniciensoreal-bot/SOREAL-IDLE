/*
 * SOREAL IDLE — les deux flèches du journal de combat (Norman, 2026-11-01 : « scroller dans le journal ne doit plus le faire remonter ; deux flèches, haut et bas, permettent de remonter ; après 15 secondes sans mouvement il revient à sa position de base ; sur téléphone, plus de défilement au doigt »).
 * Posées À CÔTÉ du journal (frère juste après lui, data-morph-garder : le redessin de la page ne les retire pas, règle n°4), jamais dedans (son contenu est réécrit à chaque ligne) ; elles suivent la position du journal (ResizeObserver).
 * Flèche du haut : remonte de 80 % de la hauteur ; flèche du bas : redescend. Chaque appui appelle surAppui(sens) : ui-aventure-1-v1.js fige la lecture (sens < 0) et relance les 15 secondes avant le retour tout en bas.
 *   window.__SOREAL_IDLE_JOURNAL_FLECHES_V1__ = { installer(host, surAppui) }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_JOURNAL_FLECHES_V1__)return;
function installer(host,surAppui){
  const parent=host&&host.parentNode;
  if(!parent)return;
  Array.prototype.slice.call(parent.children).forEach(function(n){if(n.classList&&n.classList.contains('soreal-idle-journal-fleches-v1'))parent.removeChild(n);});
  const c=document.createElement('div');
  c.className='soreal-idle-journal-fleches-v1';
  c.setAttribute('data-morph-garder','');
  c.innerHTML='<button type="button" data-sens="-1" aria-label="Remonter dans le journal">▲</button><button type="button" data-sens="1" aria-label="Redescendre dans le journal">▼</button>';
  host.insertAdjacentElement('afterend',c);
  const placer=function(){
    if(!host.isConnected)return;
    c.style.left=(host.offsetLeft+host.offsetWidth-30)+'px';
    c.style.top=(host.offsetTop+4)+'px';
    c.style.height=Math.max(0,host.offsetHeight-8)+'px';
  };
  placer();
  if(typeof ResizeObserver==='function'){try{new ResizeObserver(placer).observe(host);}catch(_e){}}
  c.addEventListener('click',function(e){
    const b=e.target&&e.target.closest?e.target.closest('button[data-sens]'):null;
    if(!b)return;
    e.preventDefault();
    const sens=Number(b.getAttribute('data-sens'))<0?-1:1;
    if(typeof surAppui==='function')surAppui(sens);
    const pas=Math.max(24,Math.round(host.clientHeight*0.8));
    try{host.scrollBy({top:sens*pas,behavior:'smooth'});}catch(_e){host.scrollTop+=sens*pas;}
  });
}
window.__SOREAL_IDLE_JOURNAL_FLECHES_V1__={installer:installer};
})();
