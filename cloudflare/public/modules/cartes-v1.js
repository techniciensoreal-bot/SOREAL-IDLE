/*
 * Cartes dessinées (Norman, 2026-10-14 : « branche sans image, je n'ai pas encore les illustrations ») : chaque carte du deck est un cadre SVG (nom, palier, coût en mayo, type, effet, rareté)
 * aux proportions de la vraie carte (331 x 538). L'ILLUSTRATION est lue dans R2 sous idle/cartes/<type>.webp (ou .png, .jpg) via /api/idle/media/card?type=<type> ; tant que le fichier n'existe pas,
 * la zone reste vide (le code du type, en grand et en filigrane, la remplit). Les types sont ceux du moteur : energyNgu, magicNgu, wandoos, augments, timeMachine, hacks, wishes, stats, adventure,
 * drop, gold, daycare, pp, qp, plus theEnd pour la carte de fin. Foil (cadre doré), Big Chonker (cadre violet) et The End (cadre rouge) sont des variantes du même cadre.
 * Les cadres vierges d'origine sont dans _assets-locales/wiki-cartes/cartes-vierges/ (hors dépôt).
 */
(function(){
  'use strict';
  var MAYOS=['angry','sad','moldy','ayyLmayo','cincoDeMayo','pretty'];
  var POL="font-family=\"Bangers,'Russo One',Impact,sans-serif\"";
  var RARETE={'Crappy':'#c9964f','Bad':'#d98b4e','Meh':'#bba37a','Okay':'#e3d36e','Good':'#a9e673','Great':'#5fd673','Hot Damn':'#ff7ad9'};
  var THEMES={
    normal:{cadre:'#3f6a8e',interieur:'#3a6283',fond:'#143a5c',panneau:'#2f5878',palier:'#d9c36a'},
    foil:{cadre:'#c9a227',interieur:'#b8921f',fond:'#4a3a10',panneau:'#8a6c14',palier:'#fff0a6'},
    chonker:{cadre:'#6a3f94',interieur:'#5b3680',fond:'#2a1744',panneau:'#4a2a72',palier:'#d9c36a'},
    end:{cadre:'#8e2f3f',interieur:'#7a2634',fond:'#2a0f16',panneau:'#5c1f2b',palier:'#ffd0d0'}
  };
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function nombre(v,d){var n=Number(v);if(!isFinite(n))n=0;return n.toLocaleString('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d});}
  /* Définitions des 6 badges de mayo (40 x 40), à placer UNE fois dans la page ; les cartes les réutilisent par <use>. */
  function defs(){
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'+
      '<g id="mc-angry"><path d="M4 2h32l2 2v32l-2 2H4l-2-2V4z" fill="#8c2f45" stroke="#2a0d16" stroke-width="3"/><path d="M8 7h24v26H8z" fill="none" stroke="#c9566e" stroke-width="1.5" stroke-dasharray="3 2"/></g>'+
      '<g id="mc-sad"><rect x="2" y="2" width="36" height="36" rx="3" fill="#1f56c8" stroke="#08183a" stroke-width="3"/><rect x="7" y="7" width="26" height="26" rx="2" fill="none" stroke="#6f9bff" stroke-width="1.5"/></g>'+
      '<g id="mc-moldy"><path d="M6 2q4 3 8 0t8 0 8 0 4 4q-3 4 0 8t0 8 0 8-4 4q-4-3-8 0t-8 0-8 0-4-4q3-4 0-8t0-8 0-8z" fill="#3fa24a" stroke="#0e2d12" stroke-width="3"/><circle cx="14" cy="14" r="2.5" fill="#8fe39a"/><circle cx="26" cy="24" r="2" fill="#8fe39a"/></g>'+
      '<g id="mc-ayyLmayo"><rect x="2" y="2" width="36" height="36" rx="5" fill="#e9edf2" stroke="#3b4350" stroke-width="3"/><rect x="7" y="7" width="26" height="26" rx="3" fill="#c3cbd6"/></g>'+
      '<g id="mc-cincoDeMayo"><rect x="2" y="2" width="12" height="36" fill="#1f8a3b"/><rect x="14" y="2" width="12" height="36" fill="#f4f4f4"/><rect x="26" y="2" width="12" height="36" fill="#cf2a2a"/><rect x="2" y="2" width="36" height="36" rx="4" fill="none" stroke="#1d1d1d" stroke-width="3"/></g>'+
      '<g id="mc-pretty"><path d="M20 2c10 0 18 8 18 18s-8 18-18 18S2 30 2 20 10 2 20 2z" fill="#b99ad8" stroke="#3a2557" stroke-width="3"/><path d="M20 9l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z" fill="#f1e4ff" opacity=".85"/></g>'+
      '</defs></svg>';
  }
  function tailleTexte(texte,max,base,min){
    var t=String(texte||'');var largeur=t.length*base*0.52;
    if(largeur<=max)return base;
    return Math.max(min,Math.floor(max/(t.length*0.52)));
  }
  /*
   * carte : un élément de deck du snapshot serveur (type, code, nom, tier, mayo{}, bonusPct, rarityLabel, protected, chonker, theEnd, foil).
   * Renvoie le SVG de la carte (sans les boutons).
   */
  function carteSvg(k){
    k=k||{};
    var fin=Boolean(k.theEnd),gros=Boolean(k.chonker)&&!fin,foil=Boolean(k.foil)&&!fin&&!gros;
    var th=fin?THEMES.end:gros?THEMES.chonker:foil?THEMES.foil:THEMES.normal;
    var typeId=fin?'theEnd':String(k.type||'');
    var nom=fin?'THE END':String(k.nom||k.code||'');
    var code=fin?'END':String(k.code||'');
    var tailleNom=tailleTexte(nom.toUpperCase(),270,21,12);
    var badges='';
    for(var i=0;i<MAYOS.length;i++){
      var n=Math.max(0,Math.floor(Number((k.mayo||{})[MAYOS[i]])||0));
      badges+='<g transform="translate(281 '+(102+i*52)+')" opacity="'+(n>0?1:.32)+'"><use href="#mc-'+MAYOS[i]+'"/><text x="20" y="'+(n>=10?26:27)+'" text-anchor="middle" '+POL+' font-size="'+(n>=10?18:22)+'" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">'+n+'</text></g>';
    }
    var effet=fin?'FIN':'+'+nombre(k.bonusPct,3)+' %';
    var rarete=gros?'CHONKER':fin?String(k.rarityLabel||''):String(k.rarityLabel||'');
    var couleurRarete=gros?'#c58bff':(RARETE[rarete]||'#d6c86a');
    return '<svg class="cv1-carte-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 331 538" role="img" aria-label="'+esc(nom)+'">'+
      '<rect x="1.5" y="1.5" width="328" height="535" rx="16" fill="'+th.cadre+'" stroke="#0c1b2a" stroke-width="3"/>'+
      '<rect x="8" y="8" width="315" height="522" rx="11" fill="'+th.interieur+'" stroke="#0c1b2a" stroke-width="2"/>'+
      '<rect x="20" y="20" width="291" height="56" rx="8" fill="'+th.panneau+'" stroke="#0c1b2a" stroke-width="3"/>'+
      '<text x="165.5" y="'+(54+(21-tailleNom)/3)+'" text-anchor="middle" '+POL+' font-size="'+tailleNom+'" fill="#f2f6fa" stroke="#000" stroke-width="3" paint-order="stroke" letter-spacing="1">'+esc(nom.toUpperCase())+'</text>'+
      '<rect x="20" y="86" width="291" height="338" rx="6" fill="'+th.fond+'" stroke="#0c1b2a" stroke-width="3"/>'+
      '<text x="165.5" y="272" text-anchor="middle" '+POL+' font-size="'+tailleTexte(code,260,64,24)+'" fill="#fff" opacity=".07">'+esc(code)+'</text>'+
      (typeId?'<svg x="20" y="86" width="291" height="338" overflow="hidden"><image href="/api/idle/media/card?type='+encodeURIComponent(typeId)+'" x="0" y="0" width="291" height="338" preserveAspectRatio="xMidYMid slice" onerror="this.style.display=\'none\'"/></svg>':'')+
      '<rect x="20" y="86" width="291" height="338" rx="6" fill="none" stroke="#0c1b2a" stroke-width="3"/>'+
      '<circle cx="52" cy="122" r="29" fill="'+th.palier+'" stroke="#0c1b2a" stroke-width="3"/><circle cx="52" cy="122" r="23" fill="none" stroke="#fff6c8" stroke-width="1.5" opacity=".7"/>'+
      '<text x="52" y="'+(Number(k.tier)>=100?131:134)+'" text-anchor="middle" '+POL+' font-size="'+(Number(k.tier)>=100?24:Number(k.tier)>=10?30:34)+'" fill="#fff" stroke="#000" stroke-width="3.5" paint-order="stroke">'+Math.max(0,Math.floor(Number(k.tier)||0))+'</text>'+
      badges+
      '<rect x="20" y="434" width="291" height="86" rx="8" fill="'+th.panneau+'" stroke="#0c1b2a" stroke-width="3"/>'+
      '<text x="165.5" y="465" text-anchor="middle" '+POL+' font-size="23" fill="#f2f6fa" stroke="#000" stroke-width="3" paint-order="stroke">'+esc(code)+'</text>'+
      '<text x="165.5" y="490" text-anchor="middle" '+POL+' font-size="19" fill="#f2f6fa" stroke="#000" stroke-width="3" paint-order="stroke">'+(fin?'':'EFFET : ')+esc(effet)+'</text>'+
      '<text x="165.5" y="511" text-anchor="middle" '+POL+' font-size="18" fill="'+couleurRarete+'" stroke="#000" stroke-width="3" paint-order="stroke">'+esc(rarete)+'</text>'+
      (k.protected?'<g aria-label="protégée"><rect x="26" y="386" width="34" height="30" rx="5" fill="#000" opacity=".62"/><rect x="35" y="399" width="16" height="12" rx="2" fill="#f2c94c" stroke="#000" stroke-width="1.5"/><path d="M38 399v-4a5 5 0 0 1 10 0v4" fill="none" stroke="#f2c94c" stroke-width="2.5"/></g>':'')+
      '<g fill="#aab6c2" stroke="#1a2430" stroke-width="1.5">'+[[16,16],[315,16],[16,522],[315,522]].map(function(p){return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="5"/><path d="M'+(p[0]-3)+' '+p[1]+'h6M'+p[0]+' '+(p[1]-3)+'v6" stroke="#1a2430" stroke-width="1.5"/>';}).join('')+'</g>'+
      '</svg>';
  }
  var STYLE='.cv1-grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px}'+
    '.cv1-case{display:flex;flex-direction:column;gap:6px;align-items:stretch;min-width:0}'+
    '.cv1-carte-svg{display:block;width:100%;height:auto;filter:drop-shadow(0 4px 8px rgba(0,0,0,.45))}'+
    '.cv1-boutons{display:flex;gap:5px;flex-wrap:wrap;justify-content:center}'+
    '.cv1-boutons button{flex:1 1 auto;min-width:0;padding:5px 7px;font-size:13px}';
  function installerStyle(){
    if(typeof document==='undefined'||document.getElementById('cv1-style'))return;
    var s=document.createElement('style');s.id='cv1-style';s.textContent=STYLE;(document.head||document.documentElement).appendChild(s);
  }
  installerStyle();
  window.__SorealCartesV1__={defs:defs,carteSvg:carteSvg,esc:esc,mayos:MAYOS,themes:THEMES};
})();
