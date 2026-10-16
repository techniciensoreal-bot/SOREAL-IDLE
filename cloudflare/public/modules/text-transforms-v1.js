/* SOREAL IDLE — standalone text transformation helpers. */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_TEXT_TRANSFORMS_V1__)return;
  function texte69Lol(texte){
    /* « 69 % » devient « 69 % lol » (Norman, 2026-10-16) : le lol vient APRÈS le signe %, jamais entre le chiffre et lui. */
    return String(texte||'').replace(/(^|[^0-9.,])69(\s?%)?(?=$|[^0-9.,])/g,function(match,prefix,pct,offset,full){
      const fin=offset+match.length;
      if(full.slice(fin,fin+4)===' lol')return match;
      return prefix+'69'+(pct||'')+' lol';
    });
  }
  function attr(v){return String(v||'');}
  window.__SOREAL_IDLE_TEXT_TRANSFORMS_V1__={texte69Lol,attr};
})();
