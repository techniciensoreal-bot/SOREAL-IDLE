/*
 * SOREAL IDLE — bulles dans les barres de vie (Norman, 2026-10-10 : « dans la barre de vie du joueur et du boss, des bulles de temps en temps, plus foncées que la couleur de base, un peu comme des bulles dans le sang »).
 * Un calque de 6 bulles sombres est posé dans chaque barre de vie (celle du bandeau, celle du boss et celle du joueur dans le duel) ; les barres sont redessinées par la page, on le repose donc dès qu'il manque.
 * Les bulles naissent en fondu, montent un peu dans un seul sens, puis s'éteignent en fondu (opacité 0 au début et à la fin du cycle : aucune boucle imparfaite), chacune à son rythme, la plupart du temps invisibles.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_BULLES_SANG_V1__)return;
  /* Seulement la barre de vie du joueur en haut de l'écran et celles de Fight Boss (Norman, 2026-10-10 : « pas dans le reste du jeu »). */
  var BARRES='#sorealIdleHudPvBarV2,.soreal-idle-page-root-v28[data-menu="combat"] .soreal-idle-bossbar-v7,.soreal-idle-page-root-v28[data-menu="combat"] .soreal-idle-playerbar-v15';
  var HTML='<i class="sg-bulles-v1" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b><b></b></i>';
  /* Barre d'un boss (Norman, 2026-10-11) : les premiers boss ont des bulles de la couleur de leur barre (en plus foncé) ; plus le numéro monte, plus certaines bulles prennent une autre teinte que le fond. */
  var DECALAGES=[0,0,120,0,-100,0,200,60,-150,0];
  function rgb2hsl(r,g,b){r/=255;g/=255;b/=255;var mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,h=0,s=0,d=mx-mn;if(d){s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;}return [h,s,l];}
  function hsl(h,s,l,a){return 'hsla('+Math.round(((h%360)+360)%360)+','+Math.round(s*100)+'%,'+Math.round(l*100)+'%,'+a+')';}
  function teinterBoss_(el){
    var bar=el.classList.contains('soreal-idle-bossbar-v7')?el:null,calque=el.querySelector(':scope > .sg-bulles-v1');
    if(!bar||!calque)return;
    var n=Number(bar.getAttribute('data-boss-n'))||0,fond=getComputedStyle(bar).backgroundImage||'',c=fond.match(/rgba?([^)]*)/g),cle=n+'|'+fond;
    if(calque.__cleTeinte===cle)return;
    calque.__cleTeinte=cle;
    if(!c||!c.length)return;
    var m=c[Math.floor(c.length/2)].match(/[0-9.]+/g),hsl0=rgb2hsl(+m[0],+m[1],+m[2]);
    var melange=Math.max(0,Math.min(1,(n-25)/275)),bulles=calque.children;
    for(var i=0;i<bulles.length;i++){
      var dec=melange>0.02?DECALAGES[i%DECALAGES.length]*melange:0,h=hsl0[0]+dec,s=Math.max(.35,hsl0[1]);
      bulles[i].style.setProperty('--sg-b1',hsl(h,s,Math.max(.06,hsl0[2]*.45),.5));
      bulles[i].style.setProperty('--sg-b2',hsl(h,s,Math.max(.03,hsl0[2]*.22),.78));
    }
  }
  function poser_(){
    /* Rien à poser quand l'onglet est caché (audit du 2026-10-10, IDLE-AUDIT-FE-007). */
    if(document.hidden)return;
    /* Nettoyage : un calque posé sur une barre qui n'est plus dans la liste (autre page) est retiré. */
    var vieux=document.querySelectorAll('.sg-bulles-v1');
    for(var v=0;v<vieux.length;v+=1){
      var h=vieux[v].parentElement;
      if(!h||!h.matches(BARRES)){h&&h.classList.remove('sg-hote-v1');vieux[v].remove();}
    }
    var liste=document.querySelectorAll(BARRES);
    for(var i=0;i<liste.length;i+=1){
      var el=liste[i];
      if(el.querySelector(':scope > .sg-bulles-v1'))continue;
      el.classList.add('sg-hote-v1');
      if(getComputedStyle(el).position==='static')el.style.position='relative';
      el.insertAdjacentHTML('beforeend',HTML);
    }
    for(var j=0;j<liste.length;j+=1)teinterBoss_(liste[j]);
  }
  poser_();
  setInterval(poser_,700);
  window.__SOREAL_IDLE_BULLES_SANG_V1__={poser:poser_};
})();
