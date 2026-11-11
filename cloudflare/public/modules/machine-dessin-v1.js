/*
 * SOREAL IDLE — le dessin de la Machine à remonter le temps (Norman, 2026-10-20 : « une grosse machine avec un écran et l'image du mob qui nous a rapporté le plus gros butin d'Or ; l'énergie sur la partie gauche, la magie sur la partie droite ;
 * des engrenages qui tournent de plus en plus vite jusqu'à 50 tiques par seconde » ; maquette validée : public/maquette-machine-temporelle-v1.html).
 *
 *   window.__SOREAL_IDLE_TM_DESSIN_V1__ = { defs(), centre(opts), hautEnergie(), hautMagie(), rafraichir(), maj(vue) }
 *
 * NOUVEAU LOOK (Norman, 2026-11-06 : « elle est toute moche » ; trois images de sa main, détourées : tour Énergie, machine centrale, tour Magie, posées en fond par le CSS ; ce module ne dessine plus que ce qui BOUGE ou CHANGE dans les emplacements
 * vides des images : écran du mob, afficheurs, cadran, rouages qui engrènent (modules/engrenages-v1.js), tas d'Or). Positions : public/machine-v3/zones.json (image « Time Machine PC » de Norman, 2026-11-07).
 *
 * Tout le dessin est du balisage SVG statique (aucun enfant créé par le script) : le redessin périodique de la page (morph) le laisse en place (data-morph-vivant, AGENTS.md règle n°4). Le script ne fait que :
 *  - lancer les rotations (WAAPI) : la VITESSE change (playbackRate), jamais la phase, donc aucun saut quand le rythme change ; toujours le même sens ; la vitesse est lissée (elle monte progressivement) ;
 *  - tenir à jour les quelques textes et attributs dynamiques (vitesse, aiguille, lueur, image et nom du mob, butin).
 * Mouvement réduit (prefers-reduced-motion) : rien ne tourne.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_TM_DESSIN_V1__)return;

  var calme=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function arr(v,n){return Number(v).toFixed(n===undefined?2:n);}
  function esc(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  /* ---------- engrenages : modules/engrenages-v1.js (module commun, entraxe = somme des rayons primitifs, phase calculée : les dents ENGRÈNENT vraiment) ---------- */
  function G(){return window.__SOREAL_IDLE_ENGRENAGES_V1__;}
  /* chaîne d'engrenages posée dans une zone (x0,y0,x1,y1 en px de la viewBox) : module m choisi pour que la hauteur des plus grands rouages remplisse 88 % de la zone, puis chaîne centrée */
  function chaineDansZone(z,comptes,corps){
    var g=G(),h=z[3]-z[1],m=4,ch=g.chaine({m:m,n:comptes,y:0,x0:0});
    m=m*(h*.88)/ch.hauteur;
    var l=g.chaine({m:m,n:comptes,y:0,x0:0}).largeur;
    if(l>(z[2]-z[0])*.99){m=m*(z[2]-z[0])*.99/l;}   /* trop large : on réduit */
    ch=g.chaine({m:m,n:comptes,y:0,x0:0});
    var cx=(z[0]+z[2])/2,cy=(z[1]+z[3])/2,dx=cx-(ch.xMin+ch.largeur/2);
    ch=g.chaine({m:m,n:comptes,y:cy,x0:dx});
    return g.svg(ch,{corps:corps,trait:'#0a0a0c',classe:'tmm-rot'});
  }

  /* ---------- définitions communes (dégradés), posées une seule fois dans la page ---------- */
  function defs(){
    return '<svg class="tmm-defs" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute"><defs>'+
      '<radialGradient id="tmmPiece" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff6c4"/><stop offset=".5" stop-color="#ffc931"/><stop offset="1" stop-color="#a86a00"/></radialGradient>'+
      '<radialGradient id="tmmLueur" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#ffb43a" stop-opacity=".75"/><stop offset="1" stop-color="#ff6a00" stop-opacity="0"/></radialGradient>'+
      '<radialGradient id="tmmOrbe" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#e0f1ff"/><stop offset=".45" stop-color="#4aa8ff"/><stop offset="1" stop-color="#0f3f8a"/></radialGradient>'+
      '</defs></svg>';
  }

  /* ---------- l'image du mob du meilleur butin ---------- */
  function urlMob(m){
    if(!m||typeof m!=='object')return '';
    if(m.titan)return '/api/idle/media/titan?id='+encodeURIComponent(String(m.titan));
    if(!m.zone)return '';
    var p=new URLSearchParams();
    p.set('zone',String(m.zone));
    p.set('boss',m.boss?'1':'0');
    p.set('seed',String(Math.max(0,Math.floor(Number(m.seed)||0))));
    if(m.name)p.set('name',String(m.name));
    return '/api/idle/media/mob?'+p.toString();
  }

  /* Le multiplicateur peut être très grand (« ×1,23 Qa ») : la police rétrécit pour tenir dans l'écran. */
  function taillePoliceMulti(t){var n=String(t).length;return n>10?14:n>8?17:n>6?21:n>4?25:29;}

  /* Taille du nom du mob (Norman, 2026-10-23) : le nom a toute la largeur de l'écran (300 sur 324) sur sa propre ligne, au-dessus ; plus il est long, plus il rapetisse (jamais sous 9). */
  function tailleNom(nom){var n=Math.max(1,String(nom||'').length);return Math.max(14,Math.min(34,Math.floor(380/(n*.82))));}
  /*
   * Le tas d'Or sous la goulotte (Norman, 2026-10-29 : « pour chaque M, T, UVG… un tas un peu plus gros ; pas à l'infini, mais une dizaine de tas différents ») : dix tailles, choisies d'après l'unité de l'OR PAR SECONDE (voir SEUILS_TAS ci-dessous ; avant le 2026-11-08 : le butin d'une barre) ; 10 niveaux, le dernier ne grossit plus. Chaque niveau est plus large, un peu plus haut et porte plus de pièces.
   */
  /*
   * Norman (2026-11-08) : « j'aimerais que le paquet d'or soit de plus en plus gros suivant si on fait des T/s ou des Qa/s de plus en plus gros » : la taille suit désormais l'OR PAR SECONDE (brut, celui qui s'affiche « /s »), plus le butin d'une barre. Rangs d'unité
   * (3 chiffres par rang : K=1, M=2, B=3, T=4, Qa=5, Qi=6, Sx=7, Sp=8, Oc=9…) : sous B/s, puis B, T, Qa, Qi, Sx, Oc, rang 12, 16 et 21 par seconde ; le dernier ne grossit plus.
   */
  var SEUILS_TAS=[0,3,4,5,6,7,9,12,16,21];
  function niveauTas(orParSeconde){
    var g=Number(orParSeconde)||0,rang=g>=1000?Math.floor(Math.log10(g)/3+1e-9):0,n=0,i;
    for(i=0;i<SEUILS_TAS.length;i++)if(rang>=SEUILS_TAS[i])n=i;
    return n;
  }
  /* Zone « sortie » de l'image centrale : x 393 à 728, y 1120 à 1275. Le tas est centré (x = 560,5), posé sur le bas ; chaque niveau est plus large et plus haut sans jamais sortir de la zone (325 px de large au plus, 96 de haut). */
  function rangeesTas(niv){return Math.min(5,2+Math.floor((niv|0)*.35));}
  function tasInterieur(niv){
    var cx=560.5,B=1268,R=rangeesTas(niv),n0=Math.min(14,5+(niv|0)),sp=26,out='',r,k,cnt,x0,x,y,j;
    for(r=R-1;r>=0;r--){                                             /* du haut vers le bas : les rangées basses recouvrent les hautes */
      cnt=Math.max(2,n0-2*r);x0=cx-(cnt-1)*sp/2;y=B-13-r*15;
      for(k=0;k<cnt;k++){
        j=((k*0.6180339+r*0.37+.11)%1-.5)*5;x=x0+k*sp+j;
        out+='<ellipse cx="'+x.toFixed(1)+'" cy="'+(y+(k%2?1.5:-1.5)).toFixed(1)+'" rx="22" ry="13" fill="url(#tmmPiece)" stroke="#0a0a0c" stroke-width="3.5"/>';
      }
    }
    return out;
  }

  /* ---------- le centre : les éléments qui bougent, posés dans les emplacements vides de l'image centre.webp (zones en px de la viewBox 762 x 753 ; mesures : public/machine-v3/zones.json) ---------- */
  var ZONE_MOB=[69,57,228,192],ZONE_INFO=[283,57,700,192],ZONE_LCD_G=[108,283,292,326],ZONE_LCD_D=[479,283,662,327],CADRAN=[386,293],ZONE_FENETRE=[89,382,679,495];
  var CHUTE_PX=64;   /* distance de chute d'une pièce (px de la viewBox d'origine du tas, avant réduction à 70 %), du haut de la sortie jusqu'au tas */
  /* le tas et les pièces gardent leur dessin d'origine (viewBox 1122 x 1402) : un groupe les réduit à 70 % et les pose dans la sortie du bas (x 255 à 512, y 567 à 675) */
  var TRANSFORME_CHUTE='translate(-8.75 -216.6) scale(.7)';
  function centre(opts){
    opts=opts||{};
    var ticks=Math.max(1,Math.min(50,Number(opts.ticks)||1));
    var url=urlMob(opts.mob);
    var nom=opts.mob&&opts.mob.name?String(opts.mob.name):'';
    var butin=opts.butin?String(opts.butin):'';
    var multi=opts.multi?String(opts.multi):'×1';
    var pieces='';
    for(var p=0;p<8;p++)pieces+='<g class="tmm-piece" data-rang="'+p+'"><circle cx="560.5" cy="1142" r="22" fill="url(#tmmPiece)" stroke="#0a0a0c" stroke-width="4"/><circle cx="560.5" cy="1142" r="13" fill="none" stroke="#a86a00" stroke-width="3"/></g>';
    var ecran='';
    if(!url){
      /* Aucun butin d'Or encore cette renaissance : un cadran d'horloge qui attend (en noir et blanc, comme tout l'écran). */
      ecran='<g id="tmmAttente" transform="translate(149.5 122)" opacity=".85"><circle r="46" fill="none" stroke="#d8dde2" stroke-opacity=".5" stroke-width="5"/><circle r="38" fill="none" stroke="#d8dde2" stroke-opacity=".25" stroke-width="2"/><path d="M0 -26 V0 L18 12" fill="none" stroke="#d8dde2" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>';
    }
    /* sept rouages qui engrènent dans la fenêtre longue : 18-12-18-12-18-12-18 dents, grands en acier, petits en orange */
    var train=chaineDansZone(ZONE_FENETRE,[18,12,18,12,18,12,18],['#9aa3ad','#e3a23a']);
    var F='font-family="Orbitron,Russo One,sans-serif" font-weight="700"';
    return '<svg class="tmm-svg" viewBox="0 0 762 753" role="img" aria-label="La machine à remonter le temps" data-morph-vivant="1" data-tmm-centre="1" data-sans-couleur-nombre="1">'+
      '<clipPath id="tmmClipEcran"><polygon points="'+POLYGONE_ECRAN+'"/></clipPath>'+
      '<clipPath id="tmmClipChute"><rect x="497" y="1030" width="127" height="245"/></clipPath>'+
      /* petit écran du mob (Norman, 2026-11-08 : « un slime métallique apparaît zoomé et mal placé dans la Time Machine » : l'image est maintenant ENTIÈRE et centrée, « meet », au lieu d'être agrandie et rognée, « slice », ce qui coupait les mobs d'un autre format) : l'image du meilleur butin d'Or est posée dans le cadre (l'effet d'écran est posé par-dessus, voir .tmm-ecran-mob) */
      '<g clip-path="url(#tmmClipEcran)"><rect x="62" y="50" width="176" height="144" fill="#050607"/>'+ecran+'</g>'+
      /* grand écran d'informations : le nom du mob, puis le meilleur butin d'Or */
      '<text id="tmmNomMob" x="0" y="0" transform="translate(298 100) skewX(-8)" '+F+' font-size="'+tailleNom(nom)+'" fill="#e8f7ee" opacity=".95">'+esc(nom)+'</text>'+
      '<text x="0" y="0" transform="translate(298 134) skewX(-8)" '+F+' font-size="13" letter-spacing="4" fill="#7dffd0" opacity=".85">MEILLEUR BUTIN D’OR</text>'+
      '<text id="tmmButin" x="0" y="0" transform="translate(686 176) skewX(-8)" text-anchor="end" '+F+' font-size="34" fill="#ffd84a" stroke="#000" stroke-width="4" style="paint-order:stroke">'+esc(butin)+'</text>'+
      /* afficheur de gauche : la vitesse (Norman, 2026-11-11 : VITESSE et MULTIPLICATEUR centrés en hauteur dans leur emplacement : emplacements mesurés y 278-321, bloc titre + valeur remonté de 6 px) */
      '<text x="0" y="0" transform="translate(120 292) skewX(-8)" '+F+' font-size="11" letter-spacing="4" fill="#6fd9b3" opacity=".85">VITESSE</text>'+
      '<text id="tmmVitesse" x="0" y="0" transform="translate(280 315) skewX(-8)" text-anchor="end" '+F+' font-size="27" fill="#7dffd0" stroke="#042a1c" stroke-width="3" style="paint-order:stroke">'+Math.round(ticks)+' /s</text>'+
      /* cadran de tiques par seconde */
      '<g transform="translate(386 293)">'+
      '<g id="tmmAiguille" style="transform:rotate('+arr(-120+240*ticks/50,1)+'deg);transition:transform .45s cubic-bezier(.2,.8,.2,1)"><path d="M-3 6 L0 -27 L3 6 Z" fill="#ff4a3a" stroke="#0a0a0c" stroke-width="1.5" stroke-linejoin="round"/></g>'+
      '<circle r="5" fill="#b9c2cc" stroke="#0a0a0c" stroke-width="2"/></g>'+
      /* afficheur de droite : le MULTIPLICATEUR d'Or (la Magie le fait monter, et les niveaux d'Énergie au-dessus de 50 aussi) */
      '<text x="0" y="0" transform="translate(490 292) skewX(-8)" '+F+' font-size="11" letter-spacing="3" fill="#6fd9b3" opacity=".85">MULTIPLICATEUR</text>'+
      '<text id="tmmMulti" x="0" y="0" transform="translate(653 315) skewX(-8)" text-anchor="end" '+F+' font-size="'+taillePoliceMulti(multi)+'" fill="#ffd84a" stroke="#3a2a00" stroke-width="3" style="paint-order:stroke">'+esc(multi)+'</text>'+
      /* fenêtre longue : les rouages qui engrènent, et la lueur qui monte avec la vitesse */
      train+
      '<rect id="tmmLueurBaie" x="89" y="382" width="590" height="113" rx="10" fill="url(#tmmLueur)" opacity="0"/>'+
      /* sortie du bas : pièces qui tombent en file, flux continu à grande vitesse, tas d'Or (dessin d'origine réduit à 70 %) */
      '<g transform="'+TRANSFORME_CHUTE+'"><g clip-path="url(#tmmClipChute)"><rect id="tmmFluxOr" x="539" y="1062" width="43" height="138" rx="14" fill="url(#tmmPiece)" opacity="0" style="transition:opacity .6s ease"/>'+pieces+'</g>'+
      '<g id="tmmTas" data-niveau="'+(opts.tas|0)+'">'+tasInterieur(opts.tas|0)+'</g></g>'+
      '</svg>'+
      /* écran de télé en noir et blanc (CSS : .tmm-ecran-mob) : l'image du mob, deux bandes d'interférence qui la décalent, grain, lignes de balayage */
      ecranTelevision(url);
  }

  /*
   * Ouverture du petit écran dans l'image du centre : x 66-231, y 51-191 (mesurée sur la transparence de public/machine-v3/centre-cadre.webp, l'image de Norman du 2026-11-10 dont les ouvertures sont transparentes). Sous le cadre (qui fait filtre), un rectangle noir un peu plus grand ;
   * la couche HTML de l'image du monstre (.tmm-ecran-mob, voir machine-ecran-tv-v1.css) dépasse aussi de 4 px de chaque côté : c'est le cadre qui la découpe.
   */
  var POLYGONE_ECRAN='62,47 236,47 236,195 62,195';
  /*
   * L'écran du mob est une télé noir et blanc (Norman, 2026-11-10) : l'image remplit tout le cadre (centrée, rognée au besoin : « cover »), passée en gris, avec des INTERFÉRENCES qui décalent l'image (deux bandes qui descendent, une copie de l'image
   * décalée de quelques pixels), du grain et des lignes de balayage. Tout est en HTML et ne bouge que par transform / opacity (processeur graphique) : rien de plus à calculer dans le dessin SVG de la machine.
   */
  /*
   * TUBE CATHODIQUE (Norman, 2026-11-11 : « l'effet tube cathodique n'est pas bien fait, on dirait une grille placée au hasard »). Un vrai écran de tube : (1) la vitre est BOMBÉE (l'image est comprimée vers les bords, déformation en tonneau, par un filtre SVG qui déplace chaque point d'après une petite carte de déplacement générée une fois) ;
   * (2) les trois couleurs sont décalées de moins d'un pixel de chaque côté (aberration chromatique, visible vers les bords) ; (3) un léger flou de phosphore. Les lignes de balayage, la vignette et le reflet de la vitre sont dessinés dans la feuille (machine-ecran-tv-v1.css) et suivent la courbure parce que le filtre porte sur tout l'écran.
   */
  var CRT_CARTE='';
  function carteTonneau(){
    if(CRT_CARTE)return CRT_CARTE;
    try{
      var n=48,cv=document.createElement('canvas');cv.width=cv.height=n;
      var cx=cv.getContext('2d'),im=cx.createImageData(n,n),i,j,u,v,r2,p;
      for(j=0;j<n;j++)for(i=0;i<n;i++){
        u=(i+.5)/n*2-1;v=(j+.5)/n*2-1;r2=(u*u+v*v)/2;p=(j*n+i)*4;
        im.data[p]=Math.round(127.5*(1+u*r2));im.data[p+1]=Math.round(127.5*(1+v*r2));im.data[p+2]=128;im.data[p+3]=255;
      }
      cx.putImageData(im,0,0);CRT_CARTE=cv.toDataURL('image/png');
    }catch(_e){CRT_CARTE='';}
    return CRT_CARTE;
  }
  function filtreTube(){
    var m=carteTonneau();
    if(!m)return '';
    return '<svg class="tmm-crt-defs" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false" data-sans-traduction><defs>'+
      '<filter id="tmmCrt" x="0" y="0" width="1" height="1" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB">'+
        '<feImage href="'+m+'" x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="carte"/>'+
        '<feDisplacementMap in="SourceGraphic" in2="carte" scale="0.1" xChannelSelector="R" yChannelSelector="G" result="bombe"/>'+
        '<feColorMatrix in="bombe" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>'+
        '<feColorMatrix in="bombe" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g"/>'+
        '<feColorMatrix in="bombe" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b"/>'+
        '<feOffset in="r" dx="-0.007" dy="0" result="r2"/><feOffset in="b" dx="0.007" dy="0" result="b2"/>'+
        '<feBlend in="r2" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="b2" mode="screen" result="rgb"/>'+
        '<feGaussianBlur in="rgb" stdDeviation="0.004 0.006"/>'+
      '</filter></defs></svg>';
  }
  function ecranTelevision(url){
    var img=function(id){return '<img'+(id?' id="'+id+'"':'')+' class="tmm-tv-img" alt="" decoding="async" draggable="false" src="'+esc(url)+'">';};
    var bande=function(k){return '<div class="tmm-tv-bande tmm-tv-bande-'+k+'"><div class="tmm-tv-cale"><div class="tmm-tv-decal">'+img('')+'</div></div></div>';};
    return filtreTube()+'<div class="tmm-ecran-mob" aria-hidden="true">'+
      (url?img('tmmImage')+bande('a')+bande('b'):'')+
      '<div class="tmm-tv-grain"></div></div>';
  }

  /* ---------- le socle rond des tours : deux rouages qui engrènent (Énergie) ; l'orbe et son anneau (Magie) ---------- */
  function hautEnergie(){
    /* UN SEUL rouage, plus grand, VERT (Norman, 2026-11-07 : « ne mets qu'un seul engrenage à gauche, plus grand, et fais-le vert pour l'énergie ») : il remplit le disque du socle */
    var g=G(),ch=g.chaine({m:3.7,n:[14],y:0,x0:0}),cx=ch.xMin+ch.largeur/2;
    return '<svg viewBox="'+arr(cx-33,1)+' -33 66 66" aria-hidden="true" data-morph-vivant="1">'+g.svg(ch,{corps:['#2fd06b'],trait:'#0a0a0c',classe:'tmm-rot'})+'</svg>';
  }
  function hautMagie(){
    return '<svg viewBox="-44 -44 88 88" aria-hidden="true" data-morph-vivant="1"><circle class="tmm-orbe" r="40" fill="#3d8bff" opacity=".35"/>'+
      '<g class="tmm-anneau"><circle r="34" fill="none" stroke="#0a0a0c" stroke-width="7"/><circle r="34" fill="none" stroke="#5aa2ff" stroke-width="3.5" stroke-dasharray="14 7"/></g>'+
      '<circle r="19" fill="url(#tmmOrbe)" stroke="#0a0a0c" stroke-width="3"/><path d="M-9 -8 Q-3 -15 6 -12" fill="none" stroke="#fff" opacity=".55" stroke-width="3" stroke-linecap="round"/></svg>';
  }

  /* ---------- animation : la vitesse change, la phase ne saute jamais ---------- */
  var cible=1,vue=1,derniere=0,boucle=0;
  var anneaux=new WeakSet();
  function tourDeReference(t){return .06+.86*Math.pow((Math.max(1,Math.min(50,t))-1)/49,.75);}   /* tours par seconde de la roue de 16 dents : 1 tique = très lente, 50 = vitesse maximale encore lisible */
  /*
   * Roues des tours (Norman, 2026-10-26) : « quand aucune énergie ni magie n'est allouée, les roues liées à ce cadre ne doivent plus tourner ; celles de la machine continuent ; elles tournent plus ou moins vite selon la somme attribuée, au maximum tant que la
   * barre est maxée, et quand elle redescend, tout doucement, les engrenages suivent le rythme ». Cadence d'une tour = niveaux par seconde de sa barre = allocation / K (K : durée du niveau à 1 unité, envoyée par le serveur et posée sur la tour par la page :
   * data-tm-alloc, data-tm-k), plafonnée à 50 comme la machine. Zéro allocation : roues arrêtées. La vitesse est lissée : elle monte vite, redescend lentement ; jamais de saut de phase.
   */
  var tours={vitesse:{cible:0,vue:0},or:{cible:0,vue:0}};
  function ticksTour(piste){
    var s=document.querySelector('.tmm-tour.'+piste);
    if(!s)return 0;
    var a=Number(s.getAttribute('data-tm-alloc')),k=Number(s.getAttribute('data-tm-k'));
    return a>0&&k>0?Math.min(50,a/k):0;
  }
  function viserTours(depart){
    ['vitesse','or'].forEach(function(c){var t=tours[c];t.cible=ticksTour(c);if(depart)t.vue=t.cible;});
  }
  function cleTour(el){var t=el.closest?el.closest('.tmm-tour'):null;return t?(t.classList.contains('vitesse')?'vitesse':'or'):'';}
  function vitesseRoueTour(t){return t<=0?0:(t>=1?tourDeReference(t):tourDeReference(1)*t);}   /* tours par seconde de la roue de 16 dents ; sous 1 niveau par seconde, proportionnelle */
  function rythmeAnneau(t){return t<=0?0:.15+2.2*Math.pow(Math.min(1,t/50),.75);}
  function cadenceRoue(r){
    var dents=16/(parseInt(r.getAttribute('data-dents'),10)||16);
    if(r.closest&&r.closest('.tmm-haut')){var c=cleTour(r);return Math.max(0,vitesseRoueTour(c?tours[c].vue:0)*dents*10);}
    return Math.max(.0001,tourDeReference(vue)*dents*10);
  }
  function lancerRoues(racine){
    if(calme)return;
    if(!racine.__toursInit){racine.__toursInit=true;viserTours(true);}
    racine.querySelectorAll('.tmm-rot').forEach(function(r){
      if(r.__tmmAnim)return;
      var off=parseFloat(r.getAttribute('data-off'))||0,sens=parseFloat(r.getAttribute('data-sens'))||1;
      r.style.transform='';
      r.__tmmAnim=r.animate([{transform:'rotate('+off+'deg)'},{transform:'rotate('+(off+360*sens)+'deg)'}],{duration:10000,iterations:Infinity,easing:'linear'});
      r.__tmmAnim.playbackRate=cadenceRoue(r);
    });
    reglerPieces(racine);
    racine.querySelectorAll('.tmm-anneau').forEach(function(g){
      if(g.__tmmAnim)return;
      g.__tmmAnim=g.animate([{transform:'rotate(0deg)'},{transform:'rotate(360deg)'}],{duration:22000,iterations:Infinity,easing:'linear'});
      g.__tmmAnim.playbackRate=rythmeAnneau(tours.or.vue);
    });
  }
  /*
   * Pièces dans la goulotte (Norman, 2026-10-29 : « il y en a une qui fait des haut-bas, je n'aime pas ; je préfère qu'elles se suivent toutes à la file ») : une FILE régulière. Toutes les pièces tombent exactement de la même façon (même durée de chute, même vitesse, jamais d'aller-retour) ;
   * seul le nombre de pièces par seconde change avec le rythme (1, 2, 4 ou 8), réparties à intervalles égaux : la cadence ne touche jamais la vitesse d'une pièce. La cadence n'est réglée que lorsqu'elle change de palier (pas à chaque image).
   */
  var CHUTE_PIECE=.5;   /* secondes de chute de chaque pièce */
  /* hauteur du sommet du tas (viewBox d'origine) selon son niveau : les pièces tombent jusqu'à lui puis s'enfoncent derrière lui */
  function sommetTas(niv){return 1268-28-(rangeesTas(niv)-1)*15;}
  function reglerPieces(racine){
    var cad=vue<=2?1:vue<=4?2:vue<=8?4:8,tasEl=document.getElementById('tmmTas'),niv=tasEl?(parseInt(tasEl.getAttribute('data-niveau'),10)||0):0;
    if(racine.__cadencePieces===cad&&racine.__niveauPieces===niv&&racine.querySelector('.tmm-piece').__tmmAnim)return;
    racine.__cadencePieces=cad;racine.__niveauPieces=niv;
    var periode=8/cad;
    var debut=-86,fin=sommetTas(niv)+24-1142,dist=fin-debut,f=Math.min(.99,(dist/280)/periode);   /* 280 px/s : vitesse constante, quel que soit le niveau du tas ; début : pièce entièrement cachée DERRIÈRE le décor (la bande d'acier au-dessus du réceptacle, Norman, 2026-11-11 : « les pièces tombent de l'arrière du décor, depuis la zone noire du réceptacle ») ; fin : pièce entièrement sous le sommet du tas */
    var kf=[{transform:'translateY('+debut+'px)',opacity:1},{transform:'translateY('+fin.toFixed(1)+'px)',opacity:1,offset:+f.toFixed(4)},{transform:'translateY('+fin.toFixed(1)+'px)',opacity:1}];
    racine.querySelectorAll('.tmm-piece').forEach(function(g){
      var rang=parseInt(g.getAttribute('data-rang'),10)||0;
      var opt={duration:periode*1000,iterations:Infinity,delay:-rang*periode*1000/8,easing:'linear'};
      try{
        if(g.__tmmAnim){g.__tmmAnim.effect.setKeyframes(kf);g.__tmmAnim.effect.updateTiming(opt);}
        else g.__tmmAnim=g.animate(kf,opt);
      }catch(_e){try{if(g.__tmmAnim)g.__tmmAnim.cancel();}catch(_f){} g.__tmmAnim=g.animate(kf,opt);}
      if(g.style.display)g.style.display='';
    });
  }
  function appliquerVitesse(){
    var racine=document.querySelector('.tmm-machine');
    if(!racine)return;
    racine.querySelectorAll('.tmm-rot').forEach(function(r){
      if(r.__tmmAnim)r.__tmmAnim.playbackRate=cadenceRoue(r);
    });
    racine.querySelectorAll('.tmm-anneau').forEach(function(g){
      if(g.__tmmAnim)g.__tmmAnim.playbackRate=rythmeAnneau(tours.or.vue);
    });
    reglerPieces(racine);
    var flux=document.getElementById('tmmFluxOr');if(flux)flux.style.opacity=String(Math.max(0,Math.min(1,(vue-18)/20))*.85);
    var lueur=document.getElementById('tmmLueurBaie');if(lueur)lueur.style.opacity=String(Math.max(0,(vue-6)/44)*.9);
  }
  function image(t){
    boucle=0;
    if(!document.querySelector('.tmm-machine'))return;
    var dt=Math.min(.1,(t-derniere)/1000);derniere=t;
    var bouge=false,diff=cible-vue;
    if(Math.abs(diff)>.01){vue+=diff*Math.min(1,dt*3.2);bouge=true;}
    else if(vue!==cible){vue=cible;bouge=true;}
    ['vitesse','or'].forEach(function(c){
      var T=tours[c],d=T.cible-T.vue;
      /* monte vite, redescend tout doucement : les roues suivent le rythme de la barre */
      if(Math.abs(d)>.005){T.vue+=d*Math.min(1,dt*(d>0?3.2:.7));bouge=true;}
      else if(T.vue!==T.cible){T.vue=T.cible;bouge=true;}
    });
    if(bouge){appliquerVitesse();boucle=requestAnimationFrame(image);}
  }
  function lancerBoucle(){if(!boucle){derniere=performance.now();boucle=requestAnimationFrame(image);}}
  function viser(ticks){
    cible=Math.max(1,Math.min(50,Number(ticks)||1));
    if(calme){vue=cible;return;}
    lancerBoucle();
  }

  /* Tient à jour les textes et attributs dynamiques de la machine (à chaque synchro) ; lance les rotations si le dessin vient d'apparaître. */
  function maj(vueMachine,apresRedessin){
    var racine=document.querySelector('.tmm-machine');
    if(!racine)return;
    var v=vueMachine||(window.__SOREAL_IDLE_LIRE_ETAT_V1__&&((window.__SOREAL_IDLE_LIRE_ETAT_V1__()||{}).systemes||{}).timeMachineView)||null;
    if(!v)return;
    var H=window.__SOREAL_IDLE_META_HOST_V130__;
    var ticks=Math.max(1,Math.min(50,Number(v.barFillsPerSecond)||1));
    lancerRoues(racine);
    viser(ticks);
    viserTours(false);   /* allocation lue sur les tours (posée par la page) ; la boucle lisse la vitesse des roues et de l'anneau */
    if(!calme)lancerBoucle();
    suivreCentre(racine,apresRedessin);
    var ia=document.getElementById('tmmAiguille');if(ia)ia.style.transform='rotate('+arr(-120+240*ticks/50,1)+'deg)';
    var tv=document.getElementById('tmmVitesse');var texteV=Math.round(ticks)+' /s';if(tv&&tv.textContent!==texteV)tv.textContent=texteV;
    var multi=document.getElementById('tmmMulti');
    if(multi&&H&&typeof H.formatGrandNombreIdleV70_==='function'){
      var m=(Number(v.goldMultiplier)||1)*(Number(v.machineSpeedMultiplier)||1);
      var tm='×'+H.formatGrandNombreIdleV70_(m);
      if(multi.textContent!==tm){multi.textContent=tm;multi.setAttribute('font-size',String(taillePoliceMulti(tm)));}
    }
    var tas=document.getElementById('tmmTas');
    if(tas){var nv=niveauTas(v.grossGps);if(tas.getAttribute('data-niveau')!==String(nv)){tas.setAttribute('data-niveau',String(nv));tas.innerHTML=tasInterieur(nv);reglerPieces(racine);}}
    var butin=document.getElementById('tmmButin');
    if(butin&&H&&typeof H.formatGrandNombreIdleV70_==='function'){var tb='+'+H.formatGrandNombreIdleV70_(Number(v.goldPerBarFill)||0)+' Or';if(butin.textContent!==tb)butin.textContent=tb;}
    var nomMob=document.getElementById('tmmNomMob');var nom=v.bestGoldMob&&v.bestGoldMob.name?String(v.bestGoldMob.name):'';if(nomMob){if(nomMob.textContent!==nom)nomMob.textContent=nom;var tn=String(tailleNom(nom));if(nomMob.getAttribute('font-size')!==tn)nomMob.setAttribute('font-size',tn);}
    /* Le mob a changé (un meilleur butin a été obtenu) : image remplacée sur place ; première apparition (aucun mob avant) : la page est redessinée par l'appelant. */
    var u=urlMob(v.bestGoldMob);
    /* l'image du petit écran et ses copies d'interférence (couche HTML .tmm-ecran-mob) */
    if(u)document.querySelectorAll('.tmm-ecran-mob img').forEach(function(im){if(im.getAttribute('src')!==u)im.setAttribute('src',u);});
    var presente=Boolean(document.getElementById('tmmImage')),attendue=Boolean(u);
    if(presente!==attendue&&typeof H.rafraichirMenuRacineIdleV28_==='function'&&Date.now()-(maj.__redessin||0)>1500){maj.__redessin=Date.now();H.rafraichirMenuRacineIdleV28_();}
  }
  /*
   * Hors écran, la grande machine et le haut des tours ne s'animent plus (audit de fluidité, 2026-11-02) : ses engrenages, sa vapeur, ses lampes et ses étincelles sont des éléments SVG, dont chaque image d'animation redessine l'arbre SVG entier (mesuré : ~60 ms/s de mise en
   * page, seulement pour eux). Sur téléphone la machine est au-dessus des tours : dès qu'on descend vers les boutons + / − / Max, elle sort de l'écran et ses animations sont mises en pause (marge de 120 px : elles repartent avant d'être revisibles).
   * Aucun changement visible : une animation en pause hors écran reprend là où elle s'était arrêtée. Seules les animations posées par CE module de pause sont reprises (marqueur __tmmPause).
   */
  var zonesObs=null,zonesSuivies=[];
  function poserPauseZone(ze){
    if(!ze||!ze.isConnected||typeof ze.getAnimations!=='function')return;
    var l=ze.getAnimations({subtree:true}),i,a;
    for(i=0;i<l.length;i++){
      a=l[i];
      if(ze.__tmmHors){if(a.playState==='running'){a.__tmmPause=true;a.pause();}}
      else if(a.__tmmPause){a.__tmmPause=false;if(a.playState==='paused')a.play();}
    }
  }
  function suivreCentre(racine,apresRedessin){
    if(!racine||!racine.querySelectorAll||typeof IntersectionObserver!=='function'||calme)return;
    var zones=racine.querySelectorAll('.tmm-centre,.tmm-haut'),i,nouvelle=zones.length!==zonesSuivies.length;
    for(i=0;i<zones.length&&!nouvelle;i++)if(zones[i]!==zonesSuivies[i])nouvelle=true;
    if(nouvelle){
      if(zonesObs)zonesObs.disconnect();
      zonesSuivies=Array.prototype.slice.call(zones);
      zonesObs=new IntersectionObserver(function(es){es.forEach(function(e){e.target.__tmmHors=!e.isIntersecting;poserPauseZone(e.target);});},{rootMargin:'120px 0px'});
      zonesSuivies.forEach(function(z){z.__tmmHors=false;zonesObs.observe(z);});
    }else if(apresRedessin)zonesSuivies.forEach(function(z){if(z.__tmmHors)poserPauseZone(z);});   /* animations créées depuis (redessin de la page) : remises en pause. Seulement APRÈS un redessin (profil sur la partie de Norman, 2026-11-06 : getAnimations() à chaque synchro = la fonction la plus coûteuse de la page pendant une rafale d'actions) */
  }
  function rafraichir(){maj(null,true);}

  /* Après chaque redessin de la page (AGENTS.md règle n°4) : les rotations repartent dans la même tâche. */
  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(rafraichir);

  window.__SOREAL_IDLE_TM_DESSIN_V1__={niveauTas:niveauTas,tasInterieur:tasInterieur,defs:defs,centre:centre,hautEnergie:hautEnergie,hautMagie:hautMagie,rafraichir:rafraichir,maj:maj,urlMob:urlMob};
})();
