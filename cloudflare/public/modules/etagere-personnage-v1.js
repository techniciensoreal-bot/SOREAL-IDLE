/*
 * SOREAL IDLE — les yeux du chat-étagère de la Garderie (2026-10-31). Chaque apparence (modules/etagere-skins-v1.js) fournit ses ovales blancs : ce module y dessine, pour CHAQUE ovale,
 * une pupille ronde noire centrée, une paupière-SPRITE à la forme exacte du blanc (modules/etagere-paupieres-v1.js ; tchernobyl : deux moitiés qui se rejoignent au milieu), à la couleur et au dégradé du pelage voisin, un clignement rare et lent, une dérive très lente du regard et, pour l'œil « g »,
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
  var LARG_IMG=7.68,HAUT_IMG=11.52,DECALAGE_TETE=0.4;   /* DECALAGE_TETE : secondes entre le clignement d'une tête de Fibonacci et celui de la suivante */

  /* Paupière-sprite de l'œil (modules/etagere-paupieres-v1.js) : même ordre que `yeux`. Absente : repli sur l'ancienne paupière unie. */
  function spriteDe_(idSkin,i){
    var P=window.__SOREAL_IDLE_ETAGERE_PAUPIERES_V1__;
    var l=P&&P[idSkin];
    return l&&l[i]&&(l[i].image||(l[i].images&&l[i].images.length===2))?l[i]:null;
  }
  function oeil_(o,i,pp,rg,seul){
    var cote=o.cote==='d'?'d':'g';
    var pup=Number(o.pupille)>0?Number(o.pupille):0.28;
    if(pp)o=Object.assign({},o,{left:pp.left,top:pp.top,larg:pp.larg,haut:pp.haut});   /* boîte du MASQUE exact du blanc */
    var l=Number(o.larg)*LARG_IMG,h=Number(o.haut)*HAUT_IMG;
    var diametre=l>0?pup*h/l*100:pup*100;                /* diamètre de la pupille, en % de la LARGEUR de l'ovale */
    /* Clignements SYNCHRONES (Norman, 2026-10-31) : tous les yeux d'un chat ont le même délai (0) ; seul Fibonacci clignote en vague, une tête après l'autre (les deux yeux d'une tête ensemble), avec un décalage constant. Sans sprite (repli) : l'ancien décalage par œil. */
    var tete=pp&&pp.tete>0?pp.tete:0;
    var delai=pp?(tete>0?-(29-tete*DECALAGE_TETE):0):-(((i*7.9)+(cote==='d'?2.3:0))%29);
    var masque='',lid;
    /* regard-sprite (iris + pupille + reflets de la planche validée) : boîte du disque d'iris en % de la boîte du masque ; sinon l'ancien disque noir */
    var iris=pp&&rg&&rg.image
      ?'<u class="et-iris et-ir" style="left:'+((rg.left-pp.left)/pp.larg*100).toFixed(3)+'%;top:'+((rg.top-pp.top)/pp.haut*100).toFixed(3)+'%;width:'+(rg.larg/pp.larg*100).toFixed(3)+'%;height:'+(rg.haut/pp.haut*100).toFixed(3)+'%;background-image:url('+rg.image+')"></u>'
      :'<u class="et-iris" style="top:'+((1-pup)/2*100).toFixed(2)+'%;height:'+(pup*100).toFixed(2)+'%;left:calc(50% - '+(diametre/2).toFixed(2)+'%)"></u>';
    if(pp&&pp.images){
      /* deux moitiés (tchernobyl) : chacune entre par son bord et elles se touchent au milieu */
      var m=Number(pp.moitie);
      masque=';-webkit-mask-image:url('+pp.images[0]+'),url('+pp.images[1]+');mask-image:url('+pp.images[0]+'),url('+pp.images[1]+');-webkit-mask-size:'+m+'% 100%,'+(100-m).toFixed(3)+'% 100%;mask-size:'+m+'% 100%,'+(100-m).toFixed(3)+'% 100%;-webkit-mask-position:0 0,100% 0;mask-position:0 0,100% 0;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat';
      lid='<s class="et-paup et-sp et-pg" style="width:'+m+'%;background-image:url('+pp.images[0]+')"></s><s class="et-paup et-sp et-pd" style="width:'+(100-m).toFixed(3)+'%;background-image:url('+pp.images[1]+')"></s>';
    }else if(pp){
      masque=';-webkit-mask-image:url('+pp.image+');mask-image:url('+pp.image+');-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat';
      lid='<s class="et-paup et-sp" style="background-image:url('+pp.image+')"></s>';
    }else lid='<s class="et-paup"></s>';
    return '<i class="et-oeil et-o'+cote+(pp?' et-m':'')+(pp&&seul?' et-un':'')+'" style="left:'+o.left+'%;top:'+o.top+'%;width:'+o.larg+'%;height:'+o.haut+'%;--pc:'+(o.couleur||'#faefe1')+';--dl:'+(delai===0?'0.0':delai.toFixed(1))+'s'+masque+'">'+
      '<b class="et-regard">'+iris+'</b>'+lid+'</i>';
  }
  /* Les yeux de l'apparence donnée (id) ; chaîne vide si les données des apparences ne sont pas chargées. */
  function yeuxHtml(idSkin){
    var D=window.__SOREAL_IDLE_ETAGERE_SKINS_V1__;
    var sk=D&&D.skins?(D.skins[idSkin]||D.skins.defaut):null;
    if(!sk||!Array.isArray(sk.yeux))return '';
    css();
    var P=window.__SOREAL_IDLE_ETAGERE_PAUPIERES_V1__,R=window.__SOREAL_IDLE_ETAGERE_REGARDS_V1__;
    var id=D.skins[idSkin]?idSkin:'defaut',lp=P&&P[id]?P[id]:[],lr=R&&R[id]?R[id]:[];
    /* la liste des paupières peut être plus longue que `yeux` (petites têtes de Fibonacci) : l'œil en plus vient de son sprite */
    var n=Math.max(sk.yeux.length,lp.length),r=[];
    for(var i=0;i<n;i++){
      var o=Object.assign({pupille:sk.pupille,couleur:sk.paupiere},sk.yeux[i]||{cote:lp[i]&&lp[i].cote||(i%2?'d':'g')});
      r.push(oeil_(o,i,spriteDe_(id,i),lr[i]||null,n===1));
    }
    return r.join('');
  }

  /* QUEUES (modules/etagere-queues-v1.js) : le sprite de la queue anime par-dessus le decor ; l'image du decor porte un MASQUE (alpha) qui retire la queue d'origine, donc jamais de doublon.
     Meme principe que les yeux (regle n°4) : tout est dessine par le rendu de la page, sans minuterie ; au changement d'apparence les elements sont NEUFS et la queue repart de sa pose de repos
     (le delai positif --qp la laisse immobile avant son premier mouvement). Regle n°3 : cycle 0 > +a > -a > 0, depart = arrivee, vitesse nulle aux extremes et au repos. */
  function queueDe_(idSkin){var Q=window.__SOREAL_IDLE_ETAGERE_QUEUES_V1__;return Q&&Q[idSkin]&&Q[idSkin].sprite&&Q[idSkin].masque?Q[idSkin]:null;}
  function boite_(q,z){return 'left:'+q.left+'%;top:'+q.top+'%;width:'+q.larg+'%;height:'+q.haut+'%'+z;}
  /* style a poser sur l'image du decor (masque alpha) ; chaine vide pour un chat sans queue animee */
  function queueMasqueStyle(idSkin){
    var q=queueDe_(idSkin);
    return q?' style="-webkit-mask-image:url('+q.masque+');mask-image:url('+q.masque+');-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat"':'';
  }
  /* calque SOUS le decor (halo de Fibonacci) : a poser AVANT l'image du decor */
  function queueSousHtml(idSkin){
    var q=queueDe_(idSkin);
    return q&&q.sous?'<i class="et-sous" style="'+boite_(q.sous,';background-image:url('+q.sous.image+')')+'"></i>':'';
  }
  /* la queue animee, a poser APRES l'image du decor (avec les yeux) */
  function queueHtml(idSkin){
    var q=queueDe_(idSkin);
    if(!q)return '';
    css();
    return '<i class="et-queue" style="'+boite_(q,';background-image:url('+q.sprite+');transform-origin:'+q.pivot.x+'% '+q.pivot.y+'%;--qa:'+q.angle+'deg;--qd:'+q.duree+'s;--qp:'+q.phase+'s')+'"></i>';
  }

  /* copie de l'ancien chat qui sort : sa queue reste FIGEE dans la pose où elle se trouve (une copie à animation neuve repartirait du repos : saut visible) ; lecture de style, pas de gameplay */
  function figerQueues(source,copie){
    if(!source||!copie||!source.querySelectorAll||!copie.querySelectorAll)return;
    var a=source.querySelectorAll('.et-queue'),c=copie.querySelectorAll('.et-queue');
    for(var i=0;i<a.length&&i<c.length;i+=1){c[i].style.animation='none';c[i].style.transform=window.getComputedStyle(a[i]).transform;}
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
      /* paupière-sprite : le sprite (forme EXACTE du blanc, pelage voisin, ourlet noir) glisse dans l'œil, clippé par le masque (l'alpha du même sprite) ; ouvert il est hors du masque : l'image d'origine est intacte. Fermé (translate 0) il recouvre le blanc exactement. */
      '.et-m{border-radius:0}',
      '.et-iris.et-ir{aspect-ratio:auto;border-radius:0;background-color:transparent;background-size:100% 100%;background-repeat:no-repeat}.et-iris.et-ir::after{display:none}',
      '.et-og .et-iris.et-ir{animation:etBilleG2 29s ease-in-out var(--dl,0s) infinite}',
      /* bille du regard-sprite (iris = 0,8 de la hauteur du blanc : course réduite, en % de la taille de l'iris) : roule vers le bas de la cavité, oscille puis se stabilise ; le masque du blanc la clippe, rien ne sort. Départ = arrivée. */
      '@keyframes etBilleG2{0%,60%{transform:translate(0,0)}60.8%{transform:translate(2%,8%)}61.6%{transform:translate(5%,18%)}62.6%{transform:translate(14%,23%)}63.6%{transform:translate(22%,20%)}64.6%{transform:translate(12%,23%)}65.3%{transform:translate(18%,22%)}65.9%{transform:translate(10%,22%)}66.4%{transform:translate(10%,22%)}66.9%{transform:translate(10%,22%)}67.3%{transform:translate(6%,15%)}68.4%{transform:translate(6%,15%)}69.8%{transform:translate(3%,8%)}70.8%{transform:translate(3%,8%)}72.7%{transform:translate(0,0)}100%{transform:translate(0,0)}}',
      '.et-paup.et-sp{left:0;top:0;right:auto;width:100%;height:100%;border:0;border-radius:0;background-size:100% 100%;background-repeat:no-repeat;background-color:transparent;--o:translateY(-102%);transform:var(--o);transform-origin:0 0;animation:etPaupG2 29s ease-in-out var(--dl,0s) infinite}',
      /* un seul œil visible (pirate) : un clignement simple, sans les fermetures supplémentaires de la bille */
      '.et-un .et-paup.et-sp{animation:etClin2 13s ease-in-out var(--dl,0s) infinite}',
      '.et-og .et-paup.et-sp{animation:etPaupG2 29s ease-in-out var(--dl,0s) infinite}',
      '.et-sp.et-pg{--o:translateX(-102%)}.et-sp.et-pd{left:auto;right:0;--o:translateX(102%)}',
      '@keyframes etClin2{0%,90%,100%{transform:var(--o)}94%{transform:translate(0,0)}}',
      '@keyframes etPaupG2{0%,29.6%,32.4%,66.4%,68%,68.6%,70.6%,71.4%,73.4%,87.6%,90.4%,100%{transform:var(--o)}30.6%{transform:translate(0,0)}66.9%{transform:translate(0,0)}69.6%{transform:translate(0,0)}72.4%{transform:translate(0,0)}88.8%{transform:translate(0,0)}}',
      /* queue : sprite pose a la place exacte de la queue masquee ; balancement doux autour du pivot (racine) ; ease-in-out sur chaque segment ; coupe en mouvement reduit */
      '.et-sous{position:absolute;z-index:0;display:block;background-size:100% 100%;background-repeat:no-repeat;pointer-events:none}',
      '.et-queue{position:absolute;z-index:5;display:block;background-size:100% 100%;background-repeat:no-repeat;pointer-events:none;animation:etQueue var(--qd,8s) ease-in-out var(--qp,0s) infinite}',
      '@keyframes etQueue{0%,100%{transform:rotate(0deg)}25%{transform:rotate(var(--qa,2deg))}75%{transform:rotate(calc(var(--qa,2deg) * -1))}}',
      '@media (prefers-reduced-motion:reduce){.et-paup,.et-regard,.et-iris{animation:none}.et-queue{animation:none}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  window.__SOREAL_IDLE_ETAGERE_V1__={yeuxHtml:yeuxHtml,queueHtml:queueHtml,queueSousHtml:queueSousHtml,queueMasqueStyle:queueMasqueStyle,figerQueues:figerQueues};
})();
