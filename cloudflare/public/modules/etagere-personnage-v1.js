/*
 * SOREAL IDLE — les yeux du chat-étagère de la Garderie (2026-10-31). Chaque apparence (modules/etagere-skins-v1.js) fournit ses ovales blancs : ce module y dessine, pour CHAQUE ovale,
 * une pupille ronde noire centrée, une paupière qui épouse l'ovale à la couleur du pelage de l'apparence, un clignement rare et lent, une dérive très lente du regard et, pour l'œil « g »,
 * la pupille qui tombe de temps en temps comme une bille dans sa cavité (la paupière se ferme plusieurs fois pour la remettre en place). Les chats ne parlent pas : aucune phrase, aucune bulle.
 * Avec plusieurs ovales (3 têtes, pirate à un seul œil…) chaque œil porte un DÉLAI NÉGATIF différent (--dl) : les paires ne sont jamais à l'unisson mécanique, et chaque œil garde ses boucles parfaites.
 * Les bocaux et le décor sont dans modules/daycare-page-v1.js.
 * Règle n°4 : tout est dessiné par le rendu de la page (aucun état, aucune minuterie, rien n'est ajouté après coup : un redessin ne perd donc rien). Le `.gd-fig` de chaque apparence porte un id propre :
 * au changement d'apparence les yeux sont de NOUVEAUX éléments, ils repartent de leur état de repos.
 * Règle n°3 : clignement, dérive du regard et chute de la bille reviennent exactement à leur état de départ (boucles parfaites) ; prefers-reduced-motion les coupe.
 * Anti-spoil (règle n°2) : rien n'existe tant que la garderie n'est pas débloquée (seul l'onglet Garderie dessine le chat).
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_ETAGERE_V1__)return;

  /* Rapport de l'image (768 x 1152) : passe les % de l'image en pixels relatifs pour centrer la pupille ronde dans un ovale de n'importe quelle forme. */
  var LARG_IMG=7.68,HAUT_IMG=11.52;

  function oeil_(o,i){
    var cote=o.cote==='d'?'d':'g';
    var pup=Number(o.pupille)>0?Number(o.pupille):0.28;
    var l=Number(o.larg)*LARG_IMG,h=Number(o.haut)*HAUT_IMG;
    var diametre=l>0?pup*h/l*100:pup*100;                /* diamètre de la pupille, en % de la LARGEUR de l'ovale */
    var delai=-(((i*7.9)+(cote==='d'?2.3:0))%29);       /* décale la phase de CET œil (le plus long cycle dure 29 s) */
    return '<i class="et-oeil et-o'+cote+'" style="left:'+o.left+'%;top:'+o.top+'%;width:'+o.larg+'%;height:'+o.haut+'%;--pc:'+(o.couleur||'#faefe1')+';--dl:'+delai.toFixed(1)+'s">'+
      '<b class="et-regard"><u class="et-iris" style="top:'+((1-pup)/2*100).toFixed(2)+'%;height:'+(pup*100).toFixed(2)+'%;left:calc(50% - '+(diametre/2).toFixed(2)+'%)"></u></b><s class="et-paup"></s></i>';
  }
  /* Les yeux de l'apparence donnée (id) ; chaîne vide si les données des apparences ne sont pas chargées. */
  function yeuxHtml(idSkin){
    var D=window.__SOREAL_IDLE_ETAGERE_SKINS_V1__;
    var sk=D&&D.skins?(D.skins[idSkin]||D.skins.defaut):null;
    if(!sk||!Array.isArray(sk.yeux))return '';
    css();
    return sk.yeux.map(function(o,i){return oeil_(Object.assign({pupille:sk.pupille,couleur:sk.paupiere},o),i);}).join('');
  }

  function css(){
    if(typeof document==='undefined'||!document.head||document.getElementById('et-style-v1'))return;
    var s=document.createElement('style');
    s.id='et-style-v1';
    s.textContent=[
      /* œil : l'ovale blanc de l'image reste visible ; pupille noire ronde centrée ; paupière unie à la couleur du pelage, qui descend sur l'ovale */
      '.et-oeil{position:absolute;z-index:6;display:block;border-radius:50%;overflow:hidden;background:none;pointer-events:none}',
      '.et-regard{position:absolute;inset:0;display:block}',
      '.et-iris{position:absolute;aspect-ratio:1;display:block;border-radius:50%;background:#0b0603}',
      '.et-iris::after{content:"";position:absolute;left:24%;top:16%;width:20%;height:20%;border-radius:50%;background:#fff;opacity:.8}',
      '.et-paup{position:absolute;left:-2%;right:-2%;top:-2%;height:104%;display:block;transform-origin:50% 0;transform:scaleY(0);background:var(--pc,#faefe1);border-radius:0 0 50% 50%/0 0 14% 14%;border-bottom:1px solid rgba(0,0,0,.4);animation:etClin 13s ease-in-out var(--dl,0s) infinite}',
      '.et-og .et-regard{animation:etRegG 17s ease-in-out var(--dl,0s) infinite}.et-od .et-regard{animation:etRegD 21s ease-in-out var(--dl,0s) infinite}',
      /* la pupille de l'œil « g » tombe parfois comme une bille qui roulerait dans sa cavité ; la paupière se ferme plusieurs fois pour la remettre en place : même boucle de 29 s pour la bille et la paupière (elles ne se désynchronisent jamais, même délai) */
      '.et-og .et-paup{animation:etPaupG 29s ease-in-out var(--dl,0s) infinite}.et-og .et-iris{animation:etBilleG 29s ease-in-out var(--dl,0s) infinite}',
      '@keyframes etClin{0%,90%,100%{transform:scaleY(0)}94%{transform:scaleY(1.03)}}',
      '@keyframes etRegG{0%,100%{transform:translate(0,0)}35%{transform:translate(-1.8px,.8px)}70%{transform:translate(1.2px,-1px)}}',
      '@keyframes etRegD{0%,100%{transform:translate(0,0)}40%{transform:translate(1.8px,-.8px)}75%{transform:translate(-1.2px,1px)}}',
      '@keyframes etPaupG{0%,29.6%,32.4%,66.4%,68%,68.6%,70.6%,71.4%,73.4%,87.6%,90.4%,100%{transform:scaleY(0)}30.6%{transform:scaleY(1.03)}66.9%{transform:scaleY(1.03)}69.6%{transform:scaleY(1.03)}72.4%{transform:scaleY(1.03)}88.8%{transform:scaleY(1.03)}}',
      /* la bille roule le long de la cavité, oscille de part et d'autre du bas puis se stabilise au BAS CENTRE de l'œil (≈ +150 % en x, +127 % en y de sa propre taille) avant que la paupière, en se fermant trois fois, la remonte */
      '@keyframes etBilleG{0%,60%{transform:translate(0,0)}60.8%{transform:translate(8%,35%)}61.6%{transform:translate(25%,95%)}62.6%{transform:translate(105%,128%)}63.6%{transform:translate(205%,110%)}64.6%{transform:translate(110%,126%)}65.3%{transform:translate(175%,127%)}65.9%{transform:translate(140%,127%)}66.4%{transform:translate(152%,127%)}66.9%{transform:translate(152%,127%)}67.3%{transform:translate(100%,85%)}68.4%{transform:translate(100%,85%)}69.8%{transform:translate(45%,48%)}70.8%{transform:translate(45%,48%)}72.7%{transform:translate(0,0)}100%{transform:translate(0,0)}}',
      '@media (prefers-reduced-motion:reduce){.et-paup,.et-regard,.et-iris{animation:none}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  window.__SOREAL_IDLE_ETAGERE_V1__={yeuxHtml:yeuxHtml};
})();
