/* SOREAL IDLE — standalone text transformation helpers. */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_TEXT_TRANSFORMS_V1__)return;
  function texte69Lol(texte){
    return String(texte||'').replace(/(^|[^0-9.,])69(?=$|[^0-9.,])/g,function(match,prefix,offset,full){
      const fin=offset+match.length;
      if(full.slice(fin,fin+4)===' lol')return match;
      return prefix+'69 lol';
    });
  }
  function attr(v){return String(v||'');}
  window.__SOREAL_IDLE_TEXT_TRANSFORMS_V1__={texte69Lol,attr};
})();
